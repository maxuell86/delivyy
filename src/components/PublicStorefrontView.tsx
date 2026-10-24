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
} from 'lucide-react';
import { Product, StoreConfig, CartItem, CategoryId, Order } from '../types';
import { CATEGORIAS_POR_SEGMENTO, SEGMENTOS_DISPONIVEIS } from '../data/segmentData';
import { generatePixPayload } from '../utils/pixPayload';
import { playOrderChime } from '../utils/soundAlert';
import { syncOrderToFirestore, subscribeToSingleOrder } from '../services/firestoreSync';

interface PublicStorefrontViewProps {
  products: Product[];
  storeConfig: StoreConfig;
  onExitPublicMode?: () => void;
  showAdminReturnBar?: boolean;
}

export const PublicStorefrontView: React.FC<PublicStorefrontViewProps> = ({
  products,
  storeConfig,
  onExitPublicMode,
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

  // Flatten delivery zones (DeliveryZone: { nome, preco, tempo, bairros: string[] }) into selectable neighborhood items
  const availableNeighborhoods = React.useMemo(() => {
    const list: { bairro: string; taxa: number; tempo: string; faixaNome: string }[] = [];
    if (storeConfig.faixasEntrega && Array.isArray(storeConfig.faixasEntrega)) {
      storeConfig.faixasEntrega.forEach((f: any) => {
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
    return list;
  }, [storeConfig.faixasEntrega, storeConfig.taxaEntregaPadrao, storeConfig.tempoEntrega]);

  // Cart & Checkout state isolated per establishment (effectiveStoreId)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`omni_public_cart_${storeConfig.id || 'default'}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer personal info (remembered on device)
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('omni_cust_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('omni_cust_phone') || '');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'retirada' | 'mesa'>('delivery');
  const [deliveryStreet, setDeliveryStreet] = useState(() => localStorage.getItem('omni_cust_street') || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(() => {
    const saved = localStorage.getItem('omni_cust_bairro');
    if (saved) return saved;
    return '';
  });
  const [mesaNumero, setMesaNumero] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

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
    if (!product.disponivel) return;
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
    setActiveProductModal(null);
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

  // Calculate delivery fee based on neighborhood or delivery type
  const activeDeliveryFee = (() => {
    if (deliveryType !== 'delivery') return 0;
    if (availableNeighborhoods.length > 0 && selectedNeighborhood) {
      const match = availableNeighborhoods.find(
        (n) => n.bairro.toLowerCase() === selectedNeighborhood.toLowerCase()
      );
      if (match) return match.taxa;
    }
    return storeConfig.taxaEntregaPadrao || 0;
  })();

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
      msg += `*Modalidade:* Entrega (Delivery)\n`;
      msg += `*Endereço:* ${deliveryStreet}\n`;
      msg += `*Bairro:* ${selectedNeighborhood || storeConfig.bairro}\n`;
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
    if (!customerPhone.trim()) {
      setCheckoutError('Por favor, informe seu telefone/WhatsApp para contato.');
      return;
    }
    if (deliveryType === 'delivery' && !deliveryStreet.trim()) {
      setCheckoutError('Por favor, informe o endereço completo (Rua e Número) para entrega.');
      return;
    }

    // Save customer info locally for next orders
    try {
      localStorage.setItem('omni_cust_name', customerName.trim());
      localStorage.setItem('omni_cust_phone', customerPhone.trim());
      localStorage.setItem('omni_cust_street', deliveryStreet.trim());
      localStorage.setItem('omni_cust_bairro', selectedNeighborhood);
    } catch {}

    const effectiveStoreId = storeConfig.id || 'default';
    const orderNum = Math.floor(100 + Math.random() * 899);
    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      storeId: effectiveStoreId,
      numero: orderNum,
      clienteNome: customerName.trim(),
      clienteTelefone: customerPhone.trim(),
      tipoEntrega: deliveryType,
      endereco:
        deliveryType === 'delivery'
          ? deliveryStreet.trim()
          : deliveryType === 'mesa'
          ? `Mesa ${mesaNumero || 'Local'}`
          : 'Retirada no Balcão da Loja',
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
        <div className="absolute top-4 left-4 right-4 max-w-4xl mx-auto flex items-center justify-between">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
              storeConfig.aberto
                ? 'bg-emerald-500/95 text-neutral-950'
                : 'bg-red-500/95 text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${storeConfig.aberto ? 'bg-neutral-950 animate-ping' : 'bg-white'}`} />
            {storeConfig.aberto ? 'Aberto Agora • Recebendo Pedidos' : 'Fechado no Momento'}
          </span>

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
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  {storeConfig.tempoEntrega}
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
        {/* Welcome Notice / Pix Promo Banner */}
        {(storeConfig.customizacao?.mensagemBoasVindas || paymentConfig.pixDescontoPct > 0) && (
          <div
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
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
                ⚡ {paymentConfig.pixDescontoPct}% OFF pagando no PIX
              </span>
            )}
          </div>
        )}

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
              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenItem(product)}
                  className={`p-3.5 rounded-2xl border flex gap-3.5 transition ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-800/90 hover:border-neutral-700'
                      : 'bg-white border-neutral-200/90 hover:border-neutral-300 shadow-xs'
                  } ${
                    product.disponivel
                      ? 'cursor-pointer active:scale-[0.99]'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
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
                        <span className="text-sm sm:text-base font-black text-emerald-500">
                          R$ {effectivePrice.toFixed(2).replace('.', ',')}
                        </span>
                        {product.precoPromocional && product.precoPromocional < product.preco && (
                          <span className="text-xs line-through text-neutral-500">
                            R$ {product.preco.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>

                      {product.disponivel ? (
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                          style={{
                            backgroundColor: `${primaryColor}20`,
                            color: primaryColor,
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar
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
                      .filter((p) => p.disponivel && p.id !== activeProductModal.id && p.permiteMeioAMeio)
                      .map((p) => (
                        <option key={p.id} value={p.nome}>
                          1/2 {activeProductModal.nome} + 1/2 {p.nome}
                        </option>
                      ))}
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
                      <p className="text-emerald-500 font-black mt-1">
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
                      <span className="font-black w-5 text-center">{item.quantidade}</span>
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
                        onChange={(e) => setCustomerPhone(e.target.value)}
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
                  <div className="space-y-2.5">
                    <div>
                      <label className="block font-bold mb-1">Endereço Completo (Rua, Número, Complemento) *</label>
                      <input
                        type="text"
                        value={deliveryStreet}
                        onChange={(e) => setDeliveryStreet(e.target.value)}
                        placeholder="Ex: Rua das Palmeiras, Nº 420 - Casa"
                        className={`w-full px-3 py-2 rounded-xl border outline-none ${
                          isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Bairro *</label>
                      {availableNeighborhoods.length > 0 ? (
                        <select
                          value={selectedNeighborhood}
                          onChange={(e) => setSelectedNeighborhood(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border font-bold outline-none ${
                            isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                          }`}
                        >
                          {availableNeighborhoods.map((item, idx) => (
                            <option key={`${item.bairro}_${idx}`} value={item.bairro}>
                              {item.bairro} — Taxa R$ {item.taxa.toFixed(2).replace('.', ',')} ({item.tempo})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedNeighborhood}
                          onChange={(e) => setSelectedNeighborhood(e.target.value)}
                          placeholder="Informe seu bairro"
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                          }`}
                        />
                      )}
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
                  <div>
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
    </div>
  );
};
