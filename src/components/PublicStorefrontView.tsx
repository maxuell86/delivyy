import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  MapPin,
  Clock,
  MessageCircle,
  Plus,
  Minus,
  X,
  Check,
  Send,
  QrCode,
  CreditCard,
  DollarSign,
  Utensils,
  Copy,
  Sun,
  Moon,
  Bike,
  Store,
  Tag,
  ChefHat,
  CheckCircle2,
  ArrowLeft,
  Phone,
  User,
  Sparkles,
  AlertCircle,
  Star,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { Product, StoreConfig, CartItem, CategoryId, Order, StoreReview } from '../types';
import { CATEGORIAS_POR_SEGMENTO, SEGMENTOS_DISPONIVEIS } from '../data/segmentData';
import { generatePixPayload } from '../utils/pixPayload';
import { playOrderChime } from '../utils/soundAlert';
import {
  syncOrderToFirestore,
  subscribeToSingleOrder,
  syncStoreConfigToFirestore,
  deductStockForOrder,
} from '../services/firestoreSync';

const DIAS_SEMANA_MAP = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

function formatPhoneBr(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface PublicStorefrontViewProps {
  products: Product[];
  storeConfig: StoreConfig;
  onSaveConfig?: (updated: StoreConfig) => void;
  onExitPublicMode?: () => void;
  onOpenMarketplace?: () => void;
  showAdminReturnBar?: boolean;
}

export const PublicStorefrontView: React.FC<PublicStorefrontViewProps> = ({
  products,
  storeConfig,
  onSaveConfig,
  onExitPublicMode,
  onOpenMarketplace,
  showAdminReturnBar = false,
}) => {
  const currentSegment = storeConfig.segmento || 'hamburgueria';
  const segmentConfig = SEGMENTOS_DISPONIVEIS.find((s) => s.id === currentSegment) || SEGMENTOS_DISPONIVEIS[0];
  const categoriasBase = CATEGORIAS_POR_SEGMENTO[currentSegment] || CATEGORIAS_POR_SEGMENTO.hamburgueria;
  const categoriasDoSegmento = React.useMemo(() => {
    const map = new Map();
    categoriasBase.forEach((c) => map.set(c.id, c));
    (storeConfig.categoriasCustomizadas || []).forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [categoriasBase, storeConfig.categoriasCustomizadas]);

  const paymentConfig = storeConfig.pagamentos || {
    pixAtivo: true,
    pixTipo: 'direto',
    pixChave: storeConfig.whatsapp || '65996953036',
    pixTipoChave: 'telefone',
    pixTitular: storeConfig.nome || 'ESTABELECIMENTO',
    pixCidade: storeConfig.cidade || 'CIDADE',
    pixDescontoPct: 5,
    dinheiroAtivo: true,
    perguntarTroco: true,
    cartaoEntregaAtivo: true,
    cartaoDebitoAtivo: true,
    cartaoCreditoAtivo: true,
    bandeirasAceitas: ['Visa', 'Mastercard', 'Elo'],
    valeRefeicaoAtivo: true,
    valesAceitos: ['Alelo Refeição', 'Sodexo / Pluxee', 'VR Benefícios', 'Ticket Restaurante'],
  };

  const primaryColor = storeConfig.customizacao?.corPrimaria || storeConfig.corTema || '#f97316';
  const [customerTheme, setCustomerTheme] = useState<'dark' | 'light'>(
    storeConfig.customizacao?.modoEscuro === false ? 'light' : 'dark'
  );
  const isDark = customerTheme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);

  // Customization modal state
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{ [groupId: string]: string[] }>({});
  const [itemNotes, setItemNotes] = useState('');
  const [segundoSaborPizza, setSegundoSaborPizza] = useState<string>('');
  const [optionValidationError, setOptionValidationError] = useState<string | null>(null);

  const effectiveStoreId = storeConfig.id || 'default';
  const cartStorageKey = `omni_public_cart_${effectiveStoreId}`;
  const activeOrderStorageKey = `omni_customer_active_order_${effectiveStoreId}`;

  // Flatten delivery zones & individual neighborhood rules into selectable neighborhood items
  const availableNeighborhoods = React.useMemo(() => {
    const list: { bairro: string; taxa: number; tempo: string; faixaNome: string }[] = [];

    // 1. Prioritize individual neighborhood rules (taxasBairros) if configured
    if (storeConfig.taxasBairros && Array.isArray(storeConfig.taxasBairros) && storeConfig.taxasBairros.length > 0) {
      const inactiveRegions = new Set(
        (storeConfig.faixasEntrega || [])
          .filter((z) => z.ativo === false)
          .map((z) => z.nome.trim().toLowerCase())
      );

      storeConfig.taxasBairros.forEach((rule) => {
        if (!rule.bairro || !rule.bairro.trim()) return;
        if (rule.ativo === false) return; // Hide paused neighborhoods
        if (rule.regiao && inactiveRegions.has(rule.regiao.trim().toLowerCase())) return;

        list.push({
          bairro: rule.bairro.trim(),
          taxa: Number(rule.preco ?? storeConfig.taxaEntregaPadrao) || 0,
          tempo: rule.tempo || storeConfig.tempoEntrega || '35-50 min',
          faixaNome: rule.regiao || 'Entrega',
        });
      });
    } else {
      // 2. Fallback to faixasEntrega or default zones
      const defaultZones = [
        {
          nome: 'Região Central / Próxima',
          preco: Math.max(4, (storeConfig.taxaEntregaPadrao || 7) - 2),
          tempo: '20-30 min',
          bairros: [storeConfig.bairro || 'Jd Buritis', 'Centro', 'Bela Vista', 'Tarumã'],
          ativo: true,
        },
        {
          nome: 'Região Intermediária',
          preco: storeConfig.taxaEntregaPadrao || 7,
          tempo: storeConfig.tempoEntrega || '35-50 min',
          bairros: ['Vila Alta', 'Jardim dos Ipês', 'Morada do Sol', 'Parque das Mansões'],
          ativo: true,
        },
        {
          nome: 'Região Afastada',
          preco: (storeConfig.taxaEntregaPadrao || 7) + 5,
          tempo: '45-60 min',
          bairros: ['Distrito Industrial', 'Jardim Califórnia', 'Altos do Tarumã'],
          ativo: true,
        },
      ];

      const sourceZones =
        storeConfig.faixasEntrega && Array.isArray(storeConfig.faixasEntrega) && storeConfig.faixasEntrega.length > 0
          ? storeConfig.faixasEntrega
          : defaultZones;

      sourceZones.forEach((f: any) => {
        if (f.ativo === false) return;
        if (Array.isArray(f.bairros)) {
          f.bairros.forEach((b: string) => {
            if (b && b.trim()) {
              list.push({
                bairro: b.trim(),
                taxa: Number(f.preco ?? f.taxa ?? storeConfig.taxaEntregaPadrao) || 0,
                tempo: f.tempo || storeConfig.tempoEntrega || '35-50 min',
                faixaNome: f.nome || 'Entrega',
              });
            }
          });
        } else if (f.bairro && (f.ativo === undefined || f.ativo)) {
          list.push({
            bairro: String(f.bairro).trim(),
            taxa: Number(f.taxa ?? f.preco ?? storeConfig.taxaEntregaPadrao) || 0,
            tempo: f.tempo || `${f.tempoMedioMin || 35} min`,
            faixaNome: f.nome || 'Entrega',
          });
        }
      });
    }

    // Deduplicate neighborhoods by name
    const seen = new Set<string>();
    return list.filter((item) => {
      const k = item.bairro.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [
    storeConfig.taxasBairros,
    storeConfig.faixasEntrega,
    storeConfig.taxaEntregaPadrao,
    storeConfig.tempoEntrega,
    storeConfig.bairro,
  ]);

  // Store Reviews & Customer Ratings (isolated by effectiveStoreId)
  const reviewsStorageKey = `omni_store_reviews_${effectiveStoreId}`;
  const defaultReviews: StoreReview[] = React.useMemo(
    () => [
      {
        id: 'rev_1',
        storeId: effectiveStoreId,
        clienteNome: 'Lucas Mendonça',
        nota: 5,
        comentario: 'Pedido chegou super rápido e bem quentinho! Embalagem impecável e sabor nota 10.',
        pratoDestaque: products[0]?.nome || 'Especial da Casa',
        criadoEm: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'rev_2',
        storeId: effectiveStoreId,
        clienteNome: 'Camila Rocha',
        nota: 5,
        comentario: 'Melhor atendimento da cidade! Pedi pelo link direto e ainda ganhei desconto no PIX.',
        pratoDestaque: products[1]?.nome || 'Combo Casal',
        criadoEm: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'rev_3',
        storeId: effectiveStoreId,
        clienteNome: 'Fernando Oliveira',
        nota: 5,
        comentario: 'Ingredientes de primeira qualidade, caprichado nos adicionais. Recomendo demais!',
        pratoDestaque: products[2]?.nome || 'Clássico Artesanal',
        criadoEm: new Date(Date.now() - 86400000 * 9).toISOString(),
      },
    ],
    [effectiveStoreId, products]
  );

  const [reviews, setReviews] = useState<StoreReview[]>(() => {
    if (storeConfig.avaliacoes && storeConfig.avaliacoes.length > 0) {
      return storeConfig.avaliacoes;
    }
    try {
      const saved = localStorage.getItem(reviewsStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultReviews;
  });

  useEffect(() => {
    if (storeConfig.avaliacoes && storeConfig.avaliacoes.length > 0) {
      setReviews(storeConfig.avaliacoes);
    } else {
      try {
        const saved = localStorage.getItem(reviewsStorageKey);
        setReviews(saved ? JSON.parse(saved) : defaultReviews);
      } catch {
        setReviews(defaultReviews);
      }
    }
  }, [storeConfig.avaliacoes, reviewsStorageKey, defaultReviews]);

  const averageRating = React.useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.nota) || 5), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewName, setNewReviewName] = useState<string>('');
  const [newReviewDish, setNewReviewDish] = useState<string>('');
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) {
      setReviewFeedback('Preencha seu nome e um breve comentário sobre sua experiência.');
      return;
    }
    const created: StoreReview = {
      id: 'rev_' + Date.now(),
      storeId: effectiveStoreId,
      clienteNome: newReviewName.trim(),
      nota: newReviewRating,
      comentario: newReviewComment.trim(),
      pratoDestaque: newReviewDish.trim() || undefined,
      criadoEm: new Date().toISOString(),
    };
    const updatedList = [created, ...reviews];
    setReviews(updatedList);
    try {
      localStorage.setItem(reviewsStorageKey, JSON.stringify(updatedList));
    } catch {}

    const updatedConfig: StoreConfig = {
      ...storeConfig,
      avaliacoes: updatedList,
    };
    if (onSaveConfig) {
      onSaveConfig(updatedConfig);
    } else {
      syncStoreConfigToFirestore(updatedConfig, effectiveStoreId).catch(() => {});
    }

    setNewReviewComment('');
    setNewReviewDish('');
    setReviewFeedback('Avaliação publicada com sucesso! Obrigado pelo seu carinho.');
    setTimeout(() => setReviewFeedback(null), 3500);
  };

  // Cart & Checkout state isolated per establishment (effectiveStoreId)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`omni_public_cart_${storeConfig.id || 'default'}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer personal info (remembered on device) & automatic ?mesa=XX detection
  const initialMesaParam =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mesa') || '' : '';
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('omni_cust_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('omni_cust_phone') || '');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'retirada' | 'mesa'>(
    initialMesaParam ? 'mesa' : 'delivery'
  );
  const [deliveryCep, setDeliveryCep] = useState(() => localStorage.getItem('omni_cust_cep') || '');
  const [deliveryStreet, setDeliveryStreet] = useState(() => localStorage.getItem('omni_cust_street') || '');
  const [deliveryNumber, setDeliveryNumber] = useState(() => localStorage.getItem('omni_cust_number') || '');
  const [deliveryComplement, setDeliveryComplement] = useState(
    () => localStorage.getItem('omni_cust_complement') || ''
  );
  const [deliveryReference, setDeliveryReference] = useState(
    () => localStorage.getItem('omni_cust_reference') || ''
  );
  const [deliveryPlaceType, setDeliveryPlaceType] = useState<'Casa' | 'Apartamento' | 'Trabalho'>(
    () => (localStorage.getItem('omni_cust_place_type') as any) || 'Casa'
  );
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(() => {
    const saved = localStorage.getItem('omni_cust_bairro');
    if (saved) return saved;
    return '';
  });
  const [mesaNumero, setMesaNumero] = useState(initialMesaParam);
  const [orderNotes, setOrderNotes] = useState('');
  const [customerToast, setCustomerToast] = useState<string | null>(null);

  const handleCepChange = async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setDeliveryCep(formatted);

    if (digits.length === 8) {
      setIsFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            if (data.logradouro) {
              setDeliveryStreet(data.logradouro);
            }
            if (data.bairro) {
              const matched = availableNeighborhoods.find(
                (n) => n.bairro.toLowerCase() === String(data.bairro).trim().toLowerCase()
              );
              if (matched) {
                setSelectedNeighborhood(matched.bairro);
              }
            }
          }
        }
      } catch {
        // Fallback silently if offline
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const buildFullDeliveryAddress = (): string => {
    const rua = deliveryStreet.trim();
    const num = deliveryNumber.trim() || 'S/N';
    const compl = deliveryComplement.trim();
    const ref = deliveryReference.trim();
    let full = `${rua}, Nº ${num}`;
    if (compl) full += ` (${compl})`;
    if (ref) full += ` — Ref: ${ref}`;
    full += ` [${deliveryPlaceType}]`;
    if (deliveryCep.trim()) full += ` • CEP: ${deliveryCep.trim()}`;
    return full;
  };

  const showCustomerToast = (msg: string) => {
    setCustomerToast(msg);
    setTimeout(() => setCustomerToast(null), 2600);
  };

  const todayWeekKey = DIAS_SEMANA_MAP[new Date().getDay()];
  const isAvailableToday = (product: Product): boolean => {
    if (!product.disponivel) return false;
    if (product.controlarEstoque !== false && product.estoqueAtual !== undefined && product.estoqueAtual <= 0) {
      return false;
    }
    if (product.diasDisponiveis && product.diasDisponiveis.length > 0 && product.diasDisponiveis.length < 7) {
      return product.diasDisponiveis.includes(todayWeekKey);
    }
    return true;
  };

  // Coupons state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ codigo: string; tipo: 'porcentagem' | 'fixo'; valor: number } | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CartaoCredito' | 'CartaoDebito' | 'Dinheiro' | 'ValeRefeicao'>('PIX');
  const [trocoPara, setTrocoPara] = useState('');
  const [valeSelecionado, setValeSelecionado] = useState(paymentConfig.valesAceitos[0] || 'Alelo');
  const [copiedPix, setCopiedPix] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Active Order Live Tracking (Firestore) isolated per establishment
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem(`omni_customer_active_order_${storeConfig.id || 'default'}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Reload isolated cart & activeOrder when switching storeConfig.id
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(cartStorageKey);
      setCart(savedCart ? JSON.parse(savedCart) : []);
    } catch {
      setCart([]);
    }
    try {
      const savedOrder = localStorage.getItem(activeOrderStorageKey);
      setActiveOrder(savedOrder ? JSON.parse(savedOrder) : null);
    } catch {
      setActiveOrder(null);
    }
    setAppliedCoupon(null);
    setCouponFeedback(null);
  }, [cartStorageKey, activeOrderStorageKey]);

  // Default selectedNeighborhood when availableNeighborhoods loads
  useEffect(() => {
    if (!selectedNeighborhood && availableNeighborhoods.length > 0) {
      setSelectedNeighborhood(availableNeighborhoods[0].bairro);
    }
  }, [availableNeighborhoods, selectedNeighborhood]);

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch {}
  }, [cart, cartStorageKey]);

  // Subscribe to active order status updates in Firestore
  useEffect(() => {
    if (!activeOrder?.id) return;
    const unsubscribe = subscribeToSingleOrder(activeOrder.id, (updatedOrder) => {
      if (updatedOrder) {
        setActiveOrder(updatedOrder);
        try {
          localStorage.setItem(activeOrderStorageKey, JSON.stringify(updatedOrder));
        } catch {}
      }
    });
    return () => unsubscribe();
  }, [activeOrder?.id, activeOrderStorageKey]);

  // Filter products for customer
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'todos' || p.categoria === selectedCategory;
    const matchesSearch =
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenItem = (product: Product) => {
    if (!isAvailableToday(product)) return;
    setActiveProductModal(product);
    setModalQuantity(1);
    setItemNotes('');
    setSegundoSaborPizza('');
    setOptionValidationError(null);

    const initialOptions: { [groupId: string]: string[] } = {};
    if (product.opcoes) {
      product.opcoes.forEach((grp) => {
        const activeItems = grp.itens.filter((it) => it.disponivel !== false);
        if (grp.tipo === 'unico' && grp.obrigatorio && activeItems.length > 0) {
          initialOptions[grp.id] = [activeItems[0].id];
        } else {
          initialOptions[grp.id] = [];
        }
      });
    }
    setSelectedOptions(initialOptions);
  };

  const handleToggleOption = (groupId: string, itemId: string, isUnique: boolean, maxLimit?: number) => {
    setOptionValidationError(null);
    const current = selectedOptions[groupId] || [];
    if (isUnique) {
      setSelectedOptions({ ...selectedOptions, [groupId]: [itemId] });
    } else {
      if (current.includes(itemId)) {
        setSelectedOptions({ ...selectedOptions, [groupId]: current.filter((id) => id !== itemId) });
      } else {
        if (maxLimit && maxLimit > 0 && current.length >= maxLimit) {
          setOptionValidationError(`Você pode escolher no máximo ${maxLimit} opção(ões) neste grupo.`);
          return;
        }
        setSelectedOptions({ ...selectedOptions, [groupId]: [...current, itemId] });
      }
    }
  };

  const calculateModalUnitPrice = () => {
    if (!activeProductModal) return 0;
    let price = activeProductModal.precoPromocional || activeProductModal.preco;

    // Regra oficial de Pizzaria: na Pizza Meio a Meio, prevalece o maior valor entre os 2 sabores
    if (activeProductModal.permiteMeioAMeio && segundoSaborPizza) {
      const secondProd = products.find((p) => p.nome === segundoSaborPizza);
      if (secondProd) {
        const secondPrice = secondProd.precoPromocional || secondProd.preco;
        price = Math.max(price, secondPrice);
      }
    }

    if (activeProductModal.opcoes) {
      activeProductModal.opcoes.forEach((grp) => {
        const selectedItemIds = selectedOptions[grp.id] || [];
        grp.itens.forEach((item) => {
          if (selectedItemIds.includes(item.id)) {
            price += item.preco;
          }
        });
      });
    }
    return Math.max(0, price);
  };

  const handleAddToCart = () => {
    if (!activeProductModal) return;

    // Validate stock limit if controlled
    if (
      activeProductModal.controlarEstoque !== false &&
      activeProductModal.estoqueAtual !== undefined &&
      modalQuantity > activeProductModal.estoqueAtual
    ) {
      setOptionValidationError(
        `Temos apenas ${activeProductModal.estoqueAtual} unidade(s) disponíveis em estoque no momento.`
      );
      return;
    }

    // Validate mandatory and min/max option groups
    if (activeProductModal.opcoes) {
      for (const grp of activeProductModal.opcoes) {
        const activeItems = grp.itens.filter((it) => it.disponivel !== false);
        if (activeItems.length === 0) continue;
        const selectedCount = (selectedOptions[grp.id] || []).length;
        const minReq = Math.max(grp.obrigatorio ? 1 : 0, grp.minimo || 0);
        if (minReq > 0 && selectedCount < minReq) {
          setOptionValidationError(
            `Por favor, selecione pelo menos ${minReq} opção(ões) em "${grp.titulo}".`
          );
          return;
        }
      }
    }

    const unitPrice = calculateModalUnitPrice();
    const formattedOptions: { grupoTitulo: string; itemNome: string; itemPreco: number }[] = [];

    if (activeProductModal.opcoes) {
      activeProductModal.opcoes.forEach((grp) => {
        const selectedIds = selectedOptions[grp.id] || [];
        grp.itens.forEach((item) => {
          if (selectedIds.includes(item.id)) {
            formattedOptions.push({
              grupoTitulo: grp.titulo,
              itemNome: item.nome,
              itemPreco: item.preco,
            });
          }
        });
      });
    }

    const newItem: CartItem = {
      id: 'cart_' + Date.now(),
      produto: activeProductModal,
      quantidade: modalQuantity,
      saboresMeioAMeio: segundoSaborPizza ? [activeProductModal.nome, segundoSaborPizza] : undefined,
      opcoesSelecionadas: formattedOptions,
      observacoes: itemNotes.trim() || undefined,
      subtotal: unitPrice * modalQuantity,
    };

    setCart([...cart, newItem]);
    showCustomerToast(`${modalQuantity}x ${activeProductModal.nome} adicionado à sacola!`);
    setActiveProductModal(null);
  };

  const handleRepeatLastOrder = () => {
    if (!activeOrder || !activeOrder.itens || activeOrder.itens.length === 0) return;
    setCart(
      activeOrder.itens.map((it, idx) => ({
        ...it,
        id: `cart_repeat_${Date.now()}_${idx}`,
      }))
    );
    setIsCartOpen(true);
    showCustomerToast('Itens do seu último pedido adicionados à sacola!');
  };

  const updateCartQty = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantidade += delta;
    if (newCart[index].quantidade <= 0) {
      newCart.splice(index, 1);
    } else {
      const unit = newCart[index].subtotal / (newCart[index].quantidade - delta);
      newCart[index].subtotal = unit * newCart[index].quantidade;
    }
    setCart(newCart);
  };

  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);

  // Smart Upsell: Suggest drinks and desserts not yet in the cart
  const upsellSuggestions = React.useMemo(() => {
    const cartProductIds = new Set(cart.map((c) => c.produto.id));
    const available = products.filter((p) => p.disponivel && !cartProductIds.has(p.id));

    const drinkOrDessertKeywords = [
      'bebida',
      'refrigerante',
      'suco',
      'agua',
      'água',
      'coca',
      'guarana',
      'guaraná',
      'cerveja',
      'heineken',
      'sobremesa',
      'doce',
      'brownie',
      'pudim',
      'bolo',
      'torta',
      'petit',
      'sorvete',
      'milkshake',
      'shake',
      'acai',
      'açaí',
      'acompanhamento',
      'porcao',
      'porção',
      'batata',
    ];

    const matched = available.filter((p) => {
      const catLower = (p.categoria || '').toLowerCase();
      const nameLower = (p.nome || '').toLowerCase();
      return drinkOrDessertKeywords.some((kw) => catLower.includes(kw) || nameLower.includes(kw));
    });

    if (matched.length >= 3) {
      return matched.slice(0, 4);
    }

    // Fill remaining slots with lowest-priced available products as impulse add-ons
    const matchedIds = new Set(matched.map((m) => m.id));
    const others = available
      .filter((p) => !matchedIds.has(p.id))
      .sort((a, b) => (a.precoPromocional || a.preco) - (b.precoPromocional || b.preco));

    return [...matched, ...others].slice(0, 4);
  }, [products, cart]);

  const handleQuickAddUpsell = (product: Product) => {
    const unitPrice = product.precoPromocional || product.preco;
    const existingIndex = cart.findIndex(
      (item) => item.produto.id === product.id && item.opcoesSelecionadas.length === 0 && !item.saboresMeioAMeio
    );
    if (existingIndex >= 0) {
      updateCartQty(existingIndex, 1);
      showCustomerToast(`+1 ${product.nome} na sacola!`);
      return;
    }
    const newItem: CartItem = {
      id: 'cart_upsell_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      produto: product,
      quantidade: 1,
      opcoesSelecionadas: [],
      subtotal: unitPrice,
    };
    setCart([...cart, newItem]);
    showCustomerToast(`${product.nome} adicionado à sacola!`);
  };

  // Find active neighborhood object for dynamic delivery fee & estimated time
  const activeNeighborhoodObj = React.useMemo(() => {
    if (deliveryType !== 'delivery' || !selectedNeighborhood) return null;
    return (
      availableNeighborhoods.find(
        (n) => n.bairro.toLowerCase() === selectedNeighborhood.toLowerCase()
      ) || null
    );
  }, [deliveryType, selectedNeighborhood, availableNeighborhoods]);

  // Calculate delivery fee based on neighborhood or delivery type
  const activeDeliveryFee = (() => {
    if (deliveryType !== 'delivery') return 0;
    if (activeNeighborhoodObj) return activeNeighborhoodObj.taxa;
    return storeConfig.taxaEntregaPadrao || 0;
  })();

  const activeDeliveryTime = activeNeighborhoodObj?.tempo || storeConfig.tempoEntrega || '35-50 min';

  // Calculate Pix discount
  const pixDiscount =
    paymentMethod === 'PIX' && paymentConfig.pixDescontoPct > 0
      ? cartSubtotal * (paymentConfig.pixDescontoPct / 100)
      : 0;

  // Calculate Coupon discount
  const couponDiscount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.tipo === 'porcentagem') {
      return cartSubtotal * (appliedCoupon.valor / 100);
    }
    return appliedCoupon.valor;
  })();

  const totalDiscount = pixDiscount + couponDiscount;

  const cartTotal =
    cartSubtotal > 0 ? Math.max(0, cartSubtotal - totalDiscount + activeDeliveryFee) : 0;

  const handleApplyCoupon = () => {
    setCouponFeedback(null);
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const coupons = storeConfig.cupons || [];
    const found: any = coupons.find(
      (c: any) => (c.ativo === undefined || c.ativo) && c.codigo.toUpperCase() === code
    );
    if (!found) {
      setCouponFeedback('Cupom inválido ou expirado.');
      return;
    }
    const minVal = Number(found.minimo ?? found.valorMinimoPedido ?? 0);
    if (minVal > 0 && cartSubtotal < minVal) {
      setCouponFeedback(`Pedido mínimo de R$ ${minVal.toFixed(2).replace('.', ',')} para este cupom.`);
      return;
    }
    const discountVal = Number(found.desconto ?? found.valor ?? 0);
    const discountType: 'porcentagem' | 'fixo' =
      found.tipo === 'fixo' ? 'fixo' : 'porcentagem';

    setAppliedCoupon({
      codigo: found.codigo,
      tipo: discountType,
      valor: discountVal,
    });
    setCouponFeedback(`Cupom ${found.codigo} aplicado com sucesso!`);
  };

  // Official Pix BRCode payload
  const pixPayloadCode =
    cartTotal > 0
      ? generatePixPayload({
          chave: paymentConfig.pixChave || storeConfig.whatsapp || '65996953036',
          nomeRecebedor: paymentConfig.pixTitular || storeConfig.nome,
          cidade: paymentConfig.pixCidade || storeConfig.cidade,
          valor: cartTotal,
        })
      : '';

  const handleCopyPix = () => {
    if (!pixPayloadCode) return;
    navigator.clipboard.writeText(pixPayloadCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const formatPaymentLabel = () => {
    if (paymentMethod === 'PIX') return 'PIX (Chave da Loja)';
    if (paymentMethod === 'CartaoCredito') return 'Cartão de Crédito na Entrega';
    if (paymentMethod === 'CartaoDebito') return 'Cartão de Débito na Entrega';
    if (paymentMethod === 'Dinheiro')
      return `Dinheiro ${trocoPara ? `(Troco para R$ ${trocoPara})` : '(Sem troco)'}`;
    if (paymentMethod === 'ValeRefeicao') return `Vale Refeição (${valeSelecionado})`;
    return 'PIX';
  };

  const generateWhatsAppMessage = (orderNumber: number) => {
    let msg = `*${segmentConfig.icone} PEDIDO #${orderNumber} - ${storeConfig.nome.toUpperCase()}*\n`;
    msg += `--------------------------------\n`;
    msg += `*Cliente:* ${customerName}\n`;
    msg += `*WhatsApp:* ${customerPhone}\n`;
    if (deliveryType === 'delivery') {
      msg += `*Modalidade:* Entrega (Delivery - ${deliveryPlaceType})\n`;
      msg += `*Logradouro:* ${deliveryStreet.trim()}, Nº ${deliveryNumber.trim() || 'S/N'}\n`;
      if (deliveryComplement.trim()) {
        msg += `*Complemento:* ${deliveryComplement.trim()}\n`;
      }
      if (deliveryReference.trim()) {
        msg += `*Ponto de Referência:* ${deliveryReference.trim()}\n`;
      }
      msg += `*Bairro:* ${selectedNeighborhood || storeConfig.bairro}\n`;
      if (deliveryCep.trim()) {
        msg += `*CEP:* ${deliveryCep.trim()}\n`;
      }
    } else if (deliveryType === 'retirada') {
      msg += `*Modalidade:* Retirada no Balcão\n`;
    } else {
      msg += `*Modalidade:* Consumo no Local (Mesa ${mesaNumero || 'Balcão'})\n`;
    }
    msg += `--------------------------------\n\n`;
    msg += `*ITENS DO PEDIDO:*\n`;

    cart.forEach((item) => {
      let title = item.produto.nome;
      if (item.saboresMeioAMeio && item.saboresMeioAMeio.length === 2) {
        title = `Pizza 1/2 ${item.saboresMeioAMeio[0]} + 1/2 ${item.saboresMeioAMeio[1]}`;
      }

      msg += `*${item.quantidade}x ${title}* - R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n`;
      if (item.opcoesSelecionadas.length > 0) {
        item.opcoesSelecionadas.forEach((opt) => {
          msg += `  • ${opt.itemNome}${opt.itemPreco > 0 ? ` (+R$ ${opt.itemPreco.toFixed(2)})` : ''}\n`;
        });
      }
      if (item.observacoes) {
        msg += `  Obs: _${item.observacoes}_\n`;
      }
      msg += `\n`;
    });

    msg += `--------------------------------\n`;
    msg += `*Subtotal:* R$ ${cartSubtotal.toFixed(2).replace('.', ',')}\n`;
    if (pixDiscount > 0) {
      msg += `*Desconto Pix (${paymentConfig.pixDescontoPct}%):* -R$ ${pixDiscount.toFixed(2).replace('.', ',')}\n`;
    }
    if (couponDiscount > 0 && appliedCoupon) {
      msg += `*Cupom (${appliedCoupon.codigo}):* -R$ ${couponDiscount.toFixed(2).replace('.', ',')}\n`;
    }
    if (deliveryType === 'delivery') {
      msg += `*Taxa de Entrega:* R$ ${activeDeliveryFee.toFixed(2).replace('.', ',')}\n`;
    }
    msg += `*TOTAL A PAGAR: R$ ${cartTotal.toFixed(2).replace('.', ',')}*\n\n`;
    msg += `*Pagamento:* ${formatPaymentLabel()}\n`;
    if (orderNotes.trim()) {
      msg += `*Observações Gerais:* ${orderNotes.trim()}\n`;
    }
    msg += `*Previsão:* ${storeConfig.tempoEntrega}\n`;

    return msg;
  };

  const handleConfirmOrder = async () => {
    setCheckoutError(null);

    if (!storeConfig.aberto) {
      setCheckoutError('A loja está fechada no momento. Confira nosso horário de atendimento.');
      return;
    }
    if (!customerName.trim()) {
      setCheckoutError('Por favor, informe seu nome para identificarmos seu pedido.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setCheckoutError('Por favor, informe um número de WhatsApp válido com DDD.');
      return;
    }
    if (deliveryType === 'delivery') {
      if (!deliveryStreet.trim()) {
        setCheckoutError('Por favor, informe o nome da Rua / Avenida para a entrega.');
        return;
      }
      if (!deliveryNumber.trim()) {
        setCheckoutError('Por favor, informe o número do endereço (ou clique em "S/N").');
        return;
      }
      if (!deliveryReference.trim()) {
        setCheckoutError('Por favor, informe um Ponto de Referência para ajudar o entregador.');
        return;
      }
    }
    if (paymentMethod === 'Dinheiro' && trocoPara.trim()) {
      const trocoNum = parseFloat(trocoPara.replace(',', '.'));
      if (!isNaN(trocoNum) && trocoNum > 0 && trocoNum < cartTotal) {
        setCheckoutError(
          `O valor para troco (R$ ${trocoNum.toFixed(2).replace('.', ',')}) deve ser maior ou igual ao total do pedido (R$ ${cartTotal.toFixed(2).replace('.', ',')}).`
        );
        return;
      }
    }

    // Save customer info locally for next orders
    try {
      localStorage.setItem('omni_cust_name', customerName.trim());
      localStorage.setItem('omni_cust_phone', customerPhone.trim());
      localStorage.setItem('omni_cust_cep', deliveryCep.trim());
      localStorage.setItem('omni_cust_street', deliveryStreet.trim());
      localStorage.setItem('omni_cust_number', deliveryNumber.trim());
      localStorage.setItem('omni_cust_complement', deliveryComplement.trim());
      localStorage.setItem('omni_cust_reference', deliveryReference.trim());
      localStorage.setItem('omni_cust_place_type', deliveryPlaceType);
      localStorage.setItem('omni_cust_bairro', selectedNeighborhood);
    } catch {}

    const effectiveStoreId = storeConfig.id || 'default';
    const orderNum = Math.floor(100 + Math.random() * 899);
    const formattedAddress =
      deliveryType === 'delivery'
        ? buildFullDeliveryAddress()
        : deliveryType === 'mesa'
        ? `Mesa ${mesaNumero || 'Local'}`
        : 'Retirada no Balcão da Loja';

    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      storeId: effectiveStoreId,
      numero: orderNum,
      clienteNome: customerName.trim(),
      clienteTelefone: customerPhone.trim(),
      tipoEntrega: deliveryType,
      endereco: formattedAddress,
      bairro:
        deliveryType === 'delivery'
          ? selectedNeighborhood || storeConfig.bairro || 'Centro'
          : deliveryType === 'mesa'
          ? `Mesa ${mesaNumero || '1'}`
          : 'Balcão',
      mesa: deliveryType === 'mesa' ? mesaNumero || '1' : undefined,
      itens: [...cart],
      subtotal: cartSubtotal,
      taxaEntrega: activeDeliveryFee,
      desconto: totalDiscount,
      total: cartTotal,
      formaPagamento: formatPaymentLabel(),
      status: 'recebido',
      criadoEm: new Date().toISOString(),
      observacoes: orderNotes.trim() || undefined,
      tempoEstimadoMin: 35,
    };

    // 1. Save to Cloud Firestore in real time so Kitchen KDS receives it immediately
    syncOrderToFirestore(newOrder, effectiveStoreId).catch((err) => {
      console.warn('Erro ao gravar pedido no Firestore:', err);
    });

    // Deduct stock automatically
    deductStockForOrder(newOrder, products, effectiveStoreId).catch(() => {});

    // 2. Also update local storage and dispatch local event isolated by storeId
    try {
      const kdsKey = `omni_kds_orders_${effectiveStoreId}`;
      const existing = localStorage.getItem(kdsKey);
      const ordersList: Order[] = existing ? JSON.parse(existing) : [];
      localStorage.setItem(kdsKey, JSON.stringify([newOrder, ...ordersList]));
      if (effectiveStoreId === 'default') {
        localStorage.setItem('omni_kds_orders', JSON.stringify([newOrder, ...ordersList]));
      }
      localStorage.setItem(activeOrderStorageKey, JSON.stringify(newOrder));
      window.dispatchEvent(new CustomEvent('new_order_placed', { detail: newOrder }));
      playOrderChime();
    } catch {}

    // 3. Open WhatsApp message to establishment
    const text = encodeURIComponent(generateWhatsAppMessage(orderNum));
    const cleanPhone = (storeConfig.whatsapp || '').replace(/\D/g, '');
    if (cleanPhone) {
      const link = document.createElement('a');
      link.href = `https://wa.me/${cleanPhone}?text=${text}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    }

    // 4. Transition to Live Order Tracker
    setActiveOrder(newOrder);
    setCart([]);
    setIsCartOpen(false);
    setIsTrackingModalOpen(true);
  };

  if (storeConfig.statusLicenca === 'suspenso' && !showAdminReturnBar) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
          <Store className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-xl sm:text-2xl font-black">
            Estabelecimento Temporariamente Indisponível
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            O cardápio digital de <strong>{storeConfig.nome}</strong> encontra-se temporariamente suspenso na plataforma <strong>Delivy</strong>.
          </p>
        </div>
        {onOpenMarketplace && (
          <button
            type="button"
            onClick={onOpenMarketplace}
            className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Outros Restaurantes no App Delivy</span>
          </button>
        )}
        <p className="text-[11px] text-neutral-500 pt-6">
          Tecnologia por <strong className="text-orange-500">Delivy</strong> • Plataforma de Delivery
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Optional Admin Bar when previewing inside management mode */}
      {showAdminReturnBar && onExitPublicMode && (
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between text-xs text-white z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">Visualização Real do Cardápio Público do Cliente</span>
            <span className="hidden sm:inline text-neutral-400">
              (É exatamente assim que seu cliente vê pelo link da bio ou QR Code)
            </span>
          </div>
          <button
            onClick={onExitPublicMode}
            className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel Gestor</span>
          </button>
        </div>
      )}

      {/* Hero Store Banner */}
      <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-neutral-900">
        {storeConfig.customizacao?.bannerUrl ? (
          <img
            src={storeConfig.customizacao.bannerUrl}
            alt={storeConfig.nome}
            className="w-full h-full object-cover opacity-65"
          />
        ) : (
          <div
            className="w-full h-full opacity-90"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #171717 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Top Bar Actions */}
        <div className="absolute top-4 left-4 right-4 max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onOpenMarketplace && (
              <button
                type="button"
                onClick={onOpenMarketplace}
                className="px-3 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 text-xs font-black flex items-center gap-1.5 shadow-lg backdrop-blur-md transition cursor-pointer"
                title="Voltar para a lista de todos os restaurantes no App Delivy"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
                <span>App Delivy</span>
              </button>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
                storeConfig.aberto
                  ? 'bg-emerald-500/95 text-neutral-950'
                  : 'bg-red-500/95 text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${storeConfig.aberto ? 'bg-neutral-950 animate-ping' : 'bg-white'}`} />
              <span className="hidden sm:inline">
                {storeConfig.aberto ? 'Aberto Agora • Recebendo Pedidos' : 'Fechado no Momento'}
              </span>
              <span className="sm:hidden">{storeConfig.aberto ? 'Aberto' : 'Fechado'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeOrder && (
              <button
                onClick={() => setIsTrackingModalOpen(true)}
                className="px-3 py-1.5 rounded-full bg-orange-500 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-lg hover:bg-orange-400 transition cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pedido #{activeOrder.numero}</span>
              </button>
            )}
            <button
              onClick={() => setCustomerTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
              title="Alternar tema claro/escuro"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Store Identity Info */}
        <div className="absolute bottom-4 left-4 right-4 max-w-4xl mx-auto flex items-end justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {storeConfig.customizacao?.logoUrl ? (
              <img
                src={storeConfig.customizacao.logoUrl}
                alt={storeConfig.nome}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/20 shadow-xl bg-neutral-900 flex-shrink-0"
              />
            ) : (
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/20 flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {segmentConfig.icone}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-white leading-tight drop-shadow">
                {storeConfig.nome}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-200 font-medium">
                {storeConfig.slogan}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-neutral-300">
                <button
                  type="button"
                  onClick={() => setIsReviewsModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black flex items-center gap-1 hover:bg-amber-500/30 transition cursor-pointer font-mono tabular-nums"
                  title="Ver avaliações dos clientes ou avaliar esta loja"
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{averageRating.toFixed(1)}</span>
                  <span className="font-sans font-semibold text-neutral-200">({reviews.length})</span>
                </button>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  {activeDeliveryTime}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  {storeConfig.bairro}, {storeConfig.cidade}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Storefront Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 pb-28 space-y-5">
        {/* Early Closed Store Warning Banner */}
        {!storeConfig.aberto && (
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 text-red-400 font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-black">Estabelecimento fechado para pedidos no momento</p>
                <p className="text-xs opacity-90">
                  Você pode navegar pelo cardápio! Horário de funcionamento: {storeConfig.horarioFuncionamento}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table QR Code Banner or Repeat Last Order Quick Bar */}
        {(initialMesaParam || (activeOrder && activeOrder.itens?.length > 0)) && (
          <div
            className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
              isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
            }`}
          >
            {initialMesaParam ? (
              <div className="flex items-center gap-2 font-bold text-orange-400">
                <Utensils className="w-4 h-4" />
                <span>Atendimento Presencial Identificado: Mesa {mesaNumero || initialMesaParam}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-neutral-400">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>
                  Último pedido: <strong className={isDark ? 'text-white' : 'text-neutral-900'}>#{activeOrder?.numero}</strong>
                </span>
              </div>
            )}
            {activeOrder && activeOrder.itens?.length > 0 && (
              <button
                type="button"
                onClick={handleRepeatLastOrder}
                className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 font-black flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repetir Meu Último Pedido</span>
              </button>
            )}
          </div>
        )}

        {/* Welcome Notice / Pix Promo & Customer Reviews Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div
            className={`md:col-span-7 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
              <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span>
                {storeConfig.customizacao?.mensagemBoasVindas ||
                  `Peça direto pelo nosso cardápio oficial sem taxas de aplicativo!`}
              </span>
            </div>
            {paymentConfig.pixDescontoPct > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-black whitespace-nowrap self-start sm:self-auto">
                ⚡ {paymentConfig.pixDescontoPct}% OFF no PIX
              </span>
            )}
          </div>

          <div
            onClick={() => setIsReviewsModalOpen(true)}
            className={`md:col-span-5 p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition ${
              isDark
                ? 'bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40'
                : 'bg-white border-neutral-200 hover:border-amber-400 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm shrink-0 font-mono tabular-nums">
                {averageRating.toFixed(1)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <Star
                      key={st}
                      className={`w-3 h-3 ${
                        st <= Math.round(averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-600'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] font-bold text-neutral-400 ml-1">
                    ({reviews.length} avaliações)
                  </span>
                </div>
                <p className="text-[11px] truncate text-neutral-400 mt-0.5">
                  {reviews[0] ? `"${reviews[0].comentario}" — ${reviews[0].clienteNome}` : 'Clique para avaliar a loja'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-black whitespace-nowrap shrink-0">
              Avaliar
            </span>
          </div>
        </div>

        {/* Search & Categories Sticky Bar */}
        <div
          className={`sticky top-0 z-20 pt-2 pb-3 -mx-4 px-4 backdrop-blur-md border-b transition-colors ${
            isDark ? 'bg-neutral-950/90 border-neutral-900' : 'bg-neutral-50/90 border-neutral-200'
          }`}
        >
          <div className="relative mb-3">
            <Search
              className={`w-4 h-4 absolute left-3.5 top-3 ${
                isDark ? 'text-neutral-500' : 'text-neutral-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar em ${storeConfig.nome}...`}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-orange-500'
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-orange-500 shadow-2xs'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-orange-500"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('todos')}
              style={
                selectedCategory === 'todos'
                  ? { backgroundColor: primaryColor, color: '#fff' }
                  : undefined
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'todos'
                  ? 'shadow-md'
                  : isDark
                  ? 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              🔥 Todos ({products.filter((p) => p.disponivel).length})
            </button>
            {categoriasDoSegmento.map((cat) => {
              const count = products.filter((p) => p.categoria === cat.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={
                    selectedCategory === cat.id
                      ? { backgroundColor: primaryColor, color: '#fff' }
                      : undefined
                  }
                  className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'shadow-md'
                      : isDark
                      ? 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                      : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  <span>{cat.icone}</span>
                  <span>{cat.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div
            className={`p-12 rounded-2xl border text-center ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <p className="text-base font-bold">Nenhum item encontrado nesta categoria.</p>
            <p className="text-xs text-neutral-400 mt-1">Tente buscar por outro termo ou limpar o filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredProducts.map((product) => {
              const effectivePrice = product.precoPromocional || product.preco;
              const availableNow = isAvailableToday(product);
              const inCartCount = cart
                .filter((c) => c.produto.id === product.id)
                .reduce((acc, c) => acc + c.quantidade, 0);
              const isDayRestricted =
                product.disponivel &&
                product.diasDisponiveis &&
                product.diasDisponiveis.length > 0 &&
                product.diasDisponiveis.length < 7 &&
                !product.diasDisponiveis.includes(todayWeekKey);
              const isLowStock =
                availableNow &&
                product.controlarEstoque !== false &&
                product.estoqueAtual !== undefined &&
                product.estoqueAtual > 0 &&
                product.estoqueAtual <= (product.estoqueMinimo ?? 5);

              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenItem(product)}
                  className={`p-3.5 rounded-2xl border flex gap-3.5 transition ${
                    inCartCount > 0
                      ? isDark
                        ? 'bg-neutral-900 border-orange-500/50'
                        : 'bg-white border-orange-400 shadow-xs'
                      : isDark
                      ? 'bg-neutral-900 border-neutral-800/90 hover:border-neutral-700'
                      : 'bg-white border-neutral-200/90 hover:border-neutral-300 shadow-xs'
                  } ${
                    availableNow
                      ? 'cursor-pointer active:scale-[0.99]'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {inCartCount > 0 && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-neutral-950">
                            {inCartCount}x na sacola
                          </span>
                        )}
                        {product.destaque && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ⭐ Destaque
                          </span>
                        )}
                        {product.selo && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400">
                            {product.selo}
                          </span>
                        )}
                        {isLowStock && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">
                            Restam {product.estoqueAtual}
                          </span>
                        )}
                      </div>
                      <h3
                        className={`font-bold text-sm sm:text-base leading-snug ${
                          isDark ? 'text-white' : 'text-neutral-900'
                        }`}
                      >
                        {product.nome}
                      </h3>
                      <p
                        className={`text-xs line-clamp-2 mt-1 leading-relaxed ${
                          isDark ? 'text-neutral-400' : 'text-neutral-600'
                        }`}
                      >
                        {product.descricao}
                      </p>
                      {(product.pesoGramas || product.porcaoPessoas || (product.alergenos && product.alergenos.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-neutral-400">
                          {product.pesoGramas && <span className="font-semibold">{product.pesoGramas}</span>}
                          {product.pesoGramas && product.porcaoPessoas && <span aria-hidden="true">·</span>}
                          {product.porcaoPessoas && <span>{product.porcaoPessoas}</span>}
                          {product.alergenos && product.alergenos.length > 0 && (
                            <>
                              {(product.pesoGramas || product.porcaoPessoas) && <span aria-hidden="true">·</span>}
                              <span className="text-orange-400">{product.alergenos.slice(0, 2).join(' · ')}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm sm:text-base font-black text-emerald-500 font-mono tabular-nums">
                          R$ {effectivePrice.toFixed(2).replace('.', ',')}
                        </span>
                        {product.precoPromocional && product.precoPromocional < product.preco && (
                          <span className="text-xs line-through text-neutral-500 font-mono tabular-nums">
                            R$ {product.preco.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>

                      {availableNow ? (
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                          style={{
                            backgroundColor: `${primaryColor}20`,
                            color: primaryColor,
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" /> {inCartCount > 0 ? 'Mais' : 'Adicionar'}
                        </span>
                      ) : isDayRestricted ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {product.diasDisponiveis?.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                          Esgotado
                        </span>
                      )}
                    </div>
                  </div>

                  {storeConfig.customizacao?.exibirFotosCardapio !== false && product.foto && (
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800">
                      <img
                        src={product.foto}
                        alt={product.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* RODAPÉ OFICIAL DELIVY NA VITRINE DO CLIENTE */}
        <div
          className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
            isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-neutral-200 text-neutral-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-500 to-red-600 text-white font-black flex items-center justify-center text-[10px]">
              D
            </span>
            <span>
              Tecnologia por <strong className={isDark ? 'text-white' : 'text-neutral-900'}>Delivy</strong> • Cardápio Digital &amp; Delivery
            </span>
          </div>

          {onOpenMarketplace && (
            <button
              type="button"
              onClick={onOpenMarketplace}
              className="text-orange-500 hover:underline font-bold cursor-pointer"
            >
              Ver todos os restaurantes no App Delivy →
            </button>
          )}
        </div>
      </main>

      {/* Floating Cart Bottom Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: primaryColor }}
            className="w-full py-3.5 px-5 rounded-2xl text-white font-black shadow-2xl flex items-center justify-between transition transform hover:scale-[1.01] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-black/25 flex items-center justify-center text-xs font-black">
                {cart.reduce((a, b) => a + b.quantidade, 0)}
              </span>
              <span className="text-sm sm:text-base">Ver Sacola &amp; Finalizar Pedido</span>
            </div>
            <span className="text-sm sm:text-base font-black">
              R$ {cartSubtotal.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>
      )}

      {/* PRODUCT CUSTOMIZATION MODAL */}
      {activeProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden border shadow-2xl ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            {/* Header Image */}
            <div className="relative h-48 w-full bg-neutral-950 flex-shrink-0">
              <img
                src={activeProductModal.foto}
                alt={activeProductModal.nome}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveProductModal(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <h3 className="text-xl font-black">{activeProductModal.nome}</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {activeProductModal.descricao}
                </p>
                {(activeProductModal.pesoGramas ||
                  activeProductModal.porcaoPessoas ||
                  (activeProductModal.alergenos && activeProductModal.alergenos.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-neutral-400">
                    {activeProductModal.pesoGramas && (
                      <span className="font-bold text-neutral-300">{activeProductModal.pesoGramas}</span>
                    )}
                    {activeProductModal.pesoGramas && activeProductModal.porcaoPessoas && (
                      <span aria-hidden="true">·</span>
                    )}
                    {activeProductModal.porcaoPessoas && <span>{activeProductModal.porcaoPessoas}</span>}
                    {activeProductModal.alergenos && activeProductModal.alergenos.length > 0 && (
                      <>
                        {(activeProductModal.pesoGramas || activeProductModal.porcaoPessoas) && (
                          <span aria-hidden="true">·</span>
                        )}
                        <span className="text-orange-400 font-semibold">
                          {activeProductModal.alergenos.join(' · ')}
                        </span>
                      </>
                    )}
                  </div>
                )}
                <p className="text-lg font-black text-emerald-500 mt-2 font-mono tabular-nums">
                  R$ {(activeProductModal.precoPromocional || activeProductModal.preco).toFixed(2).replace('.', ',')}
                </p>
              </div>

              {optionValidationError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{optionValidationError}</span>
                </div>
              )}

              {/* Half & Half Pizza Selector */}
              {activeProductModal.permiteMeioAMeio && (
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-orange-50/60 border-orange-200'
                  }`}
                >
                  <label className="block text-xs font-black uppercase text-orange-500 mb-1.5">
                    🍕 Deseja Pizza Meio a Meio? (2º Sabor Opcional)
                  </label>
                  <select
                    value={segundoSaborPizza}
                    onChange={(e) => setSegundoSaborPizza(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-bold outline-none ${
                      isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                    }`}
                  >
                    <option value="">Não, quero inteira de {activeProductModal.nome}</option>
                    {products
                      .filter((p) => isAvailableToday(p) && p.id !== activeProductModal.id && p.permiteMeioAMeio)
                      .map((p) => {
                        const firstP = activeProductModal.precoPromocional || activeProductModal.preco;
                        const secondP = p.precoPromocional || p.preco;
                        const finalHalfPrice = Math.max(firstP, secondP);
                        return (
                          <option key={p.id} value={p.nome}>
                            1/2 {activeProductModal.nome} + 1/2 {p.nome} (R${' '}
                            {finalHalfPrice.toFixed(2).replace('.', ',')})
                          </option>
                        );
                      })}
                  </select>
                </div>
              )}

              {/* Option Groups */}
              {activeProductModal.opcoes &&
                activeProductModal.opcoes.map((grp) => {
                  const activeItems = grp.itens.filter((it) => it.disponivel !== false);
                  if (activeItems.length === 0) return null;
                  const minReq = Math.max(grp.obrigatorio ? 1 : 0, grp.minimo || 0);
                  const maxLim = grp.tipo === 'unico' ? 1 : grp.maximo;

                  return (
                    <div key={grp.id} className="space-y-2">
                      <div
                        className={`flex items-center justify-between py-1.5 px-3 rounded-lg ${
                          isDark ? 'bg-neutral-950' : 'bg-neutral-100'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-black uppercase tracking-wide block">{grp.titulo}</span>
                          <span className="text-[10px] text-neutral-400">
                            {grp.tipo === 'unico'
                              ? 'Escolha 1 opção'
                              : minReq > 0 && maxLim
                              ? `Escolha de ${minReq} até ${maxLim}`
                              : maxLim
                              ? `Escolha até ${maxLim} opções`
                              : 'Múltipla escolha'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-orange-500">
                          {minReq > 0 ? `Obrigatório (Mín. ${minReq})` : 'Opcional'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {activeItems.map((item) => {
                          const isSelected = (selectedOptions[grp.id] || []).includes(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                handleToggleOption(grp.id, item.id, grp.tipo === 'unico', maxLim)
                              }
                              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-500/10 font-bold'
                                  : isDark
                                  ? 'border-neutral-800 bg-neutral-950/60 text-neutral-300'
                                  : 'border-neutral-200 bg-white text-neutral-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                                    isSelected
                                      ? 'bg-orange-500 border-orange-500 text-neutral-950'
                                      : 'border-neutral-500'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span>{item.nome}</span>
                              </div>
                              {item.preco > 0 && (
                                <span className="text-emerald-500 font-bold font-mono tabular-nums">
                                  + R$ {item.preco.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* Customer Item Notes */}
              <div>
                <label className="block text-xs font-bold mb-1">Alguma observação neste item?</label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Ex: Tirar cebola, maionese à parte, bem passado..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                    isDark
                      ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-500'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400'
                  }`}
                />
              </div>
            </div>

            {/* Footer Add Action */}
            <div
              className={`p-4 border-t flex items-center gap-3 ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
                  isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-300'
                }`}
              >
                <button
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="p-1 text-neutral-400 hover:text-orange-500 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-black w-5 text-center">{modalQuantity}</span>
                <button
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="p-1 text-neutral-400 hover:text-orange-500 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                style={{ backgroundColor: primaryColor }}
                className="flex-1 py-3 px-4 rounded-xl text-white font-black text-sm flex items-center justify-between shadow-lg cursor-pointer"
              >
                <span>Adicionar</span>
                <span>R$ {(calculateModalUnitPrice() * modalQuantity).toFixed(2).replace('.', ',')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT & CART MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`w-full max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden border shadow-2xl ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            {/* Header */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-black">Seu Pedido em {storeConfig.nome}</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {checkoutError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2.5">
                {cart.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">
                        {item.quantidade}x{' '}
                        {item.saboresMeioAMeio
                          ? `1/2 ${item.saboresMeioAMeio[0]} + 1/2 ${item.saboresMeioAMeio[1]}`
                          : item.produto.nome}
                      </p>
                      {item.opcoesSelecionadas.length > 0 && (
                        <p className="text-[11px] text-neutral-400">
                          {item.opcoesSelecionadas.map((o) => o.itemNome).join(', ')}
                        </p>
                      )}
                      {item.observacoes && (
                        <p className="text-[11px] text-orange-400 italic">Obs: {item.observacoes}</p>
                      )}
                      <p className="text-emerald-500 font-black mt-1 font-mono tabular-nums">
                        R$ {item.subtotal.toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQty(idx, -1)}
                        className="p-1.5 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black w-5 text-center font-mono tabular-nums">{item.quantidade}</span>
                      <button
                        onClick={() => updateCartQty(idx, 1)}
                        className="p-1.5 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* SMART UPSELL: SUGESTÃO DE BEBIDAS E SOBREMESAS NO CARRINHO */}
              {upsellSuggestions.length > 0 && (
                <div
                  className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    isDark
                      ? 'bg-orange-500/5 border-orange-500/25'
                      : 'bg-orange-50/70 border-orange-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-orange-500 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Que tal uma bebida gelada ou sobremesa?</span>
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400">Adicione com 1 clique</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {upsellSuggestions.map((sug) => {
                      const sugPrice = sug.precoPromocional || sug.preco;
                      return (
                        <div
                          key={sug.id}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 ${
                            isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {sug.foto && (
                              <img
                                src={sug.foto}
                                alt={sug.nome}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 bg-neutral-800"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate">{sug.nome}</p>
                              <p className="text-[11px] font-black text-emerald-500 font-mono tabular-nums">
                                + R$ {sugPrice.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickAddUpsell(sug)}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black text-[11px] flex items-center gap-1 shrink-0 transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>Adicionar</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer Identification */}
              <div className="space-y-3 pt-2 border-t border-neutral-800/60">
                <h4 className="font-black uppercase tracking-wider text-orange-500">1. Seus Dados</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1">Seu Nome *</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border outline-none ${
                          isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Seu WhatsApp *</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(formatPhoneBr(e.target.value))}
                        placeholder="Ex: (65) 99999-9999"
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border outline-none ${
                          isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Mode & Address */}
              <div className="space-y-3 pt-2 border-t border-neutral-800/60">
                <h4 className="font-black uppercase tracking-wider text-orange-500">2. Como deseja receber?</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('retirada')}
                    className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      deliveryType === 'retirada'
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Retirar no Balcão</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('mesa')}
                    className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      deliveryType === 'mesa'
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Na Mesa</span>
                  </button>
                </div>

                {deliveryType === 'delivery' && (
                  <div
                    className={`p-3.5 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-neutral-950/70 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black text-orange-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Endereço Completo para Entrega</span>
                      </span>

                      {/* Tipo de Local (Casa / Apartamento / Trabalho) */}
                      <div className="flex items-center gap-1">
                        {(['Casa', 'Apartamento', 'Trabalho'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setDeliveryPlaceType(t)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                              deliveryPlaceType === t
                                ? 'bg-orange-500 text-neutral-950 border-orange-500'
                                : isDark
                                ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
                                : 'bg-white border-neutral-300 text-neutral-600'
                            }`}
                          >
                            {t === 'Casa' ? '🏠 Casa' : t === 'Apartamento' ? '🏢 Apto' : '💼 Trabalho'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Linha 1: CEP (Busca Automática) + Bairro/Região (Cálculo de Taxa) */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-4">
                        <label className="block font-bold mb-1">
                          CEP <span className="text-[10px] text-neutral-400 font-normal">(Opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryCep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          className={`w-full px-3 py-2 rounded-xl border font-mono outline-none focus:border-orange-500 ${
                            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                          }`}
                        />
                        {isFetchingCep && (
                          <span className="text-[10px] text-orange-400 block mt-0.5">
                            Buscando endereço pelo CEP...
                          </span>
                        )}
                      </div>

                      <div className="sm:col-span-8">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold">Bairro / Região *</label>
                          <span className="text-[10px] font-black text-emerald-500 font-mono tabular-nums">
                            Frete: R$ {activeDeliveryFee.toFixed(2).replace('.', ',')} • {activeDeliveryTime}
                          </span>
                        </div>
                        <select
                          value={selectedNeighborhood}
                          onChange={(e) => setSelectedNeighborhood(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border font-bold outline-none focus:border-orange-500 ${
                            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                          }`}
                        >
                          {availableNeighborhoods.map((item, idx) => (
                            <option key={`${item.bairro}_${idx}`} value={item.bairro}>
                              {item.bairro} ({item.faixaNome}) — R$ {item.taxa.toFixed(2).replace('.', ',')} • {item.tempo}
                            </option>
                          ))}
                          <option value="Outro Bairro">
                            Outro Bairro — Taxa Padrão R$ {(storeConfig.taxaEntregaPadrao || 7).toFixed(2).replace('.', ',')} ({storeConfig.tempoEntrega})
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Linha 2: Rua / Logradouro + Número (com botão S/N) */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-8">
                        <label className="block font-bold mb-1">Rua / Avenida / Logradouro *</label>
                        <input
                          type="text"
                          value={deliveryStreet}
                          onChange={(e) => setDeliveryStreet(e.target.value)}
                          placeholder="Ex: Av. Brasil, Rua das Palmeiras..."
                          className={`w-full px-3 py-2 rounded-xl border outline-none focus:border-orange-500 ${
                            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                          }`}
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold">Número *</label>
                          <button
                            type="button"
                            onClick={() => setDeliveryNumber('S/N')}
                            className="text-[10px] text-orange-400 hover:underline font-bold cursor-pointer"
                          >
                            Sem Nº (S/N)
                          </button>
                        </div>
                        <input
                          type="text"
                          value={deliveryNumber}
                          onChange={(e) => setDeliveryNumber(e.target.value)}
                          placeholder="Ex: 420"
                          className={`w-full px-3 py-2 rounded-xl border outline-none focus:border-orange-500 ${
                            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Linha 3: Complemento + Ponto de Referência */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-5">
                        <label className="block font-bold mb-1">
                          Complemento <span className="text-[10px] text-neutral-400 font-normal">(Opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryComplement}
                          onChange={(e) => setDeliveryComplement(e.target.value)}
                          placeholder="Ex: Apto 202, Bloco B, Fundos"
                          className={`w-full px-3 py-2 rounded-xl border outline-none focus:border-orange-500 ${
                            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                          }`}
                        />
                      </div>

                      <div className="sm:col-span-7">
                        <label className="block font-bold mb-1">
                          Ponto de Referência * <span className="text-[10px] text-emerald-400 font-normal">(Ajuda o entregador)</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryReference}
                          onChange={(e) => setDeliveryReference(e.target.value)}
                          placeholder="Ex: Próximo ao mercado, portão branco, esquina..."
                          className={`w-full px-3 py-2 rounded-xl border outline-none focus:border-orange-500 ${
                            isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {deliveryType === 'mesa' && (
                  <div>
                    <label className="block font-bold mb-1">Número da Mesa ou Comanda</label>
                    <input
                      type="text"
                      value={mesaNumero}
                      onChange={(e) => setMesaNumero(e.target.value)}
                      placeholder="Ex: Mesa 04"
                      className={`w-full px-3 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Coupon Input */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                <label className="block font-bold">Possui Cupom de Desconto?</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Ex: BEMVINDO10"
                      className={`w-full pl-8 pr-3 py-2 rounded-xl border uppercase font-bold outline-none ${
                        isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
                {couponFeedback && (
                  <p className={`text-[11px] font-bold ${appliedCoupon ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {couponFeedback}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-3 pt-2 border-t border-neutral-800/60">
                <h4 className="font-black uppercase tracking-wider text-orange-500">3. Forma de Pagamento</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      paymentMethod === 'PIX'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <QrCode className="w-4 h-4" />
                      {paymentConfig.pixDescontoPct > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-neutral-950 font-black">
                          -{paymentConfig.pixDescontoPct}%
                        </span>
                      )}
                    </div>
                    <span className="block mt-1">PIX Agora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CartaoCredito')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      paymentMethod === 'CartaoCredito'
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400 font-bold'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="block mt-1">Cartão Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CartaoDebito')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      paymentMethod === 'CartaoDebito'
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400 font-bold'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="block mt-1">Cartão Débito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Dinheiro')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      paymentMethod === 'Dinheiro'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="block mt-1">Dinheiro</span>
                  </button>

                  {paymentConfig.valeRefeicaoAtivo && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ValeRefeicao')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        paymentMethod === 'ValeRefeicao'
                          ? 'border-purple-500 bg-purple-500/15 text-purple-400 font-bold'
                          : isDark
                          ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <Utensils className="w-4 h-4" />
                      <span className="block mt-1">Vale Refeição</span>
                    </button>
                  )}
                </div>

                {/* PIX Copia e Cola Box */}
                {paymentMethod === 'PIX' && pixPayloadCode && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-400">PIX Copia e Cola Oficial da Loja</span>
                      <span className="text-[10px] text-emerald-300">Chave: {paymentConfig.pixChave}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={pixPayloadCode}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPix ? 'Copiado!' : 'Copiar Pix'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Dinheiro' && (
                  <div className="space-y-1">
                    <label className="block font-bold mb-1">Precisa de troco para quanto?</label>
                    <input
                      type="text"
                      value={trocoPara}
                      onChange={(e) => setTrocoPara(e.target.value)}
                      placeholder="Ex: 100,00 (ou deixe em branco se não precisar)"
                      className={`w-full px-3 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    />
                    {(() => {
                      const tVal = parseFloat(trocoPara.replace(',', '.'));
                      if (!trocoPara.trim() || isNaN(tVal) || tVal <= 0) return null;
                      if (tVal < cartTotal) {
                        return (
                          <p className="text-[11px] font-bold text-red-400">
                            Informe um valor maior ou igual a R$ {cartTotal.toFixed(2).replace('.', ',')}
                          </p>
                        );
                      }
                      return (
                        <p className="text-[11px] font-bold text-emerald-400">
                          Troco a receber na entrega: R$ {(tVal - cartTotal).toFixed(2).replace('.', ',')}
                        </p>
                      );
                    })()}
                  </div>
                )}

                {paymentMethod === 'ValeRefeicao' && (
                  <div>
                    <label className="block font-bold mb-1">Selecione a Bandeira do Vale:</label>
                    <select
                      value={valeSelecionado}
                      onChange={(e) => setValeSelecionado(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-bold outline-none ${
                        isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    >
                      {paymentConfig.valesAceitos.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 ${
                  isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal dos Itens</span>
                  <span>R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {pixDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Desconto PIX ({paymentConfig.pixDescontoPct}%)</span>
                    <span>- R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {couponDiscount > 0 && appliedCoupon && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Cupom ({appliedCoupon.codigo})</span>
                    <span>- R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {deliveryType === 'delivery' && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Taxa de Entrega ({selectedNeighborhood || storeConfig.bairro})</span>
                    <span>R$ {activeDeliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black pt-2 border-t border-neutral-800">
                  <span>Total a Pagar</span>
                  <span className="text-emerald-500">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            {/* Footer Confirm Button */}
            <div
              className={`p-4 border-t ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <button
                onClick={handleConfirmOrder}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Pedido Agora • R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE REAL-TIME ORDER TRACKING MODAL (SYNCED VIA FIRESTORE) */}
      {isTrackingModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-5 ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                Pedido #{activeOrder.numero} • Ao Vivo
              </span>
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black">Acompanhe seu Pedido</h3>
              <p className="text-xs text-neutral-400 mt-1">
                O status abaixo atualiza sozinho em tempo real conforme a cozinha prepara seu pedido.
              </p>
            </div>

            {/* Live Progress Steps */}
            <div className="space-y-3">
              {[
                { id: 'recebido', label: 'Pedido Recebido pela Loja', icon: CheckCircle2 },
                { id: 'preparo', label: 'Em Preparo na Cozinha', icon: ChefHat },
                {
                  id: 'rota',
                  label:
                    activeOrder.tipoEntrega === 'delivery'
                      ? 'Saiu para Entrega (Motoboy a caminho)'
                      : 'Pronto para Retirada no Balcão',
                  icon: Bike,
                },
                { id: 'concluido', label: 'Pedido Entregue / Concluído', icon: Check },
              ].map((step, index) => {
                const statusOrder = ['recebido', 'preparo', 'rota', 'concluido'];
                const currentIdx = statusOrder.indexOf(activeOrder.status);
                const isCompleted = currentIdx >= index;
                const isCurrent = currentIdx === index;
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                      isCurrent
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : isCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-500'
                        : 'border-neutral-200 bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isCurrent
                          ? 'bg-orange-500 text-neutral-950'
                          : isCompleted
                          ? 'bg-emerald-500 text-neutral-950'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black">{step.label}</p>
                      {isCurrent && (
                        <p className="text-[10px] text-orange-400 font-bold">Status atual em tempo real</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`https://wa.me/${(storeConfig.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá! Gostaria de falar sobre o meu Pedido #${activeOrder.numero} (${activeOrder.clienteNome}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Falar com a Loja no WhatsApp</span>
              </a>
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs cursor-pointer"
              >
                Voltar ao Cardápio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER REVIEWS & STORE RATING MODAL */}
      {isReviewsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden border shadow-2xl ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            {/* Header */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'border-neutral-800 bg-neutral-950' : 'border-neutral-200 bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm font-mono tabular-nums">
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">Avaliações de {storeConfig.nome}</h3>
                  <p className="text-[11px] text-neutral-400">
                    {reviews.length} avaliações verificadas de clientes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Submit Review Form */}
              <form
                onSubmit={handleSubmitReview}
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-400 uppercase tracking-wider">
                    Deixe sua Avaliação
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="p-0.5 cursor-pointer transition transform hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= newReviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1">Seu Nome *</label>
                    <input
                      type="text"
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      placeholder="Ex: Mariana Costa"
                      className={`w-full px-3 py-2 rounded-xl border outline-none ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-800 text-white'
                          : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Item Favorito (Opcional)</label>
                    <select
                      value={newReviewDish}
                      onChange={(e) => setNewReviewDish(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border outline-none ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-800 text-white'
                          : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    >
                      <option value="">Selecione um item...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.nome}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Seu Comentário *</label>
                  <textarea
                    rows={2}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Conte como foi o sabor, entrega e atendimento..."
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark
                        ? 'bg-neutral-900 border-neutral-800 text-white'
                        : 'bg-white border-neutral-300 text-neutral-900'
                    }`}
                  />
                </div>

                {reviewFeedback && (
                  <p className="text-[11px] font-bold text-emerald-400">{reviewFeedback}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition cursor-pointer"
                >
                  Publicar Avaliação ({newReviewRating} Estrelas)
                </button>
              </form>

              {/* Reviews List */}
              <div className="space-y-2.5">
                <h4 className="font-black uppercase tracking-wider text-neutral-400">
                  Comentários Recentes ({reviews.length})
                </h4>
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className={`p-3.5 rounded-2xl border space-y-1.5 ${
                      isDark ? 'bg-neutral-950/70 border-neutral-800' : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{rev.clienteNome}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star
                            key={st}
                            className={`w-3.5 h-3.5 ${
                              st <= rev.nota ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      &ldquo;{rev.comentario}&rdquo;
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
                      {rev.pratoDestaque ? (
                        <span className="text-orange-400 font-semibold">Pediu: {rev.pratoDestaque}</span>
                      ) : (
                        <span>Cliente Verificado</span>
                      )}
                      <span>{new Date(rev.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER FLOATING TOAST FEEDBACK */}
      {customerToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-2xl text-xs font-black flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{customerToast}</span>
        </div>
      )}
    </div>
  );
};
