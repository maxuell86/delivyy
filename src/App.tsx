import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  CheckCircle2, 
  Building2,
  ChevronDown,
  Lock,
  AlertCircle,
  Copy,
  ExternalLink,
  QrCode,
  Share2
} from 'lucide-react';
import { Product, StoreConfig, CategoryId, CategoryInfo, SegmentId, ViewPerspective, CartItem } from './types';
import { PRODUTOS_PRESETS_SEGMENTO, SEGMENTOS_DISPONIVEIS, CATEGORIAS_POR_SEGMENTO } from './data/segmentData';
import { Header, AppTab } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CustomerSimulator } from './components/CustomerSimulator';
import { DiagnosticView } from './components/DiagnosticView';
import { DailyChecklistModal } from './components/DailyChecklistModal';
import { BatchPriceModal } from './components/BatchPriceModal';
import { ExportModal } from './components/ExportModal';
import { SegmentSelectorModal } from './components/SegmentSelectorModal';
import { PaymentSettingsModal } from './components/PaymentSettingsModal';
import { StoreSettingsView } from './components/StoreSettingsView';
import { LoyaltyCouponsView } from './components/LoyaltyCouponsView';
import { ProductionDeployGuide } from './components/ProductionDeployGuide';
import { KitchenReceiptModal } from './components/KitchenReceiptModal';
import { ReportsView } from './components/ReportsView';
import { OrdersKdsView } from './components/OrdersKdsView';
import { InventoryView } from './components/InventoryView';
import { CustomizationView } from './components/CustomizationView';
import { ClientOnboardingModal } from './components/ClientOnboardingModal';
import { AdminTeamModal } from './components/AdminTeamModal';
import { PublicStorefrontView } from './components/PublicStorefrontView';
import { StoreManagerOperationView } from './components/StoreManagerOperationView';
import { ExclusiveMenuLinkModal, buildExclusiveMenuUrl, sanitizeMenuSlug } from './components/ExclusiveMenuLinkModal';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './services/firebase';
import {
  subscribeToAllStores,
  subscribeToStoreConfig,
  syncStoreConfigToFirestore,
  subscribeToProducts,
  syncProductToFirestore,
  deleteProductFromFirestore,
  syncProductsBatchToFirestore,
  clearAllOrdersInFirestore,
  sanitizeStoreId,
} from './services/firestoreSync';

export default function App() {
  const { isDark } = useTheme();
  const { user, isAdmin, isSuperAdmin, userRole, assignedStoreId } = useAuth();
  const hasSeededConfigRef = useRef(false);
  const hasSeededProductsRef = useRef(false);

  // Check URL query parameters for Public Customer Menu (?modo=cardapio&loja=... or ?loja=...) or Kitchen KDS (?modo=kds&loja=...)
  const initialUrlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialModo = initialUrlParams?.get('modo');
  const rawLojaUrlParam = initialUrlParams?.get('loja') || initialUrlParams?.get('store');
  const initialLojaParam = sanitizeStoreId(rawLojaUrlParam || 'default');

  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialLojaParam);
  const [allStores, setAllStores] = useState<StoreConfig[]>([]);

  // Perspective: Platform Manager ('platform_admin') vs Store Manager ('store_manager')
  const [viewPerspective, setViewPerspective] = useState<ViewPerspective>('platform_admin');

  // Open public customer storefront automatically when URL has ?modo=cardapio, ?modo=cliente, or ?loja=... (unless modo=kds or modo=admin)
  const [isPublicStorefront, setIsPublicStorefront] = useState<boolean>(
    initialModo === 'cardapio' ||
      initialModo === 'cliente' ||
      (Boolean(rawLojaUrlParam) && initialModo !== 'kds' && initialModo !== 'admin')
  );
  const [openedFromAdmin, setOpenedFromAdmin] = useState<boolean>(false);

  // Effective storeId:
  // - If viewing public storefront via direct link (!openedFromAdmin), respect the store ID from the URL (selectedStoreId)
  // - Otherwise, if user is a bound Store Manager (not Super Admin), lock strictly to their assignedStoreId
  const activeStoreId =
    isPublicStorefront && !openedFromAdmin
      ? selectedStoreId
      : !isSuperAdmin && assignedStoreId
      ? assignedStoreId
      : selectedStoreId;

  // Automatically adjust perspective and default tab when a bound Store Manager or Kitchen user logs in
  useEffect(() => {
    if (isPublicStorefront && !openedFromAdmin) return;
    if (user && !isSuperAdmin && assignedStoreId) {
      setSelectedStoreId(assignedStoreId);
      setViewPerspective('store_manager');
      if (userRole === 'kitchen') {
        setActiveTab('pedidos');
      } else {
        setActiveTab((prev) =>
          ['customizacao', 'loja', 'simulador', 'producao', 'diagnostico'].includes(prev) ? 'operacao' : prev
        );
      }
    }
  }, [user, isSuperAdmin, assignedStoreId, userRole, isPublicStorefront, openedFromAdmin]);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    try {
      const saved =
        localStorage.getItem(`omni_delivery_config_${initialLojaParam}`) ||
        (initialLojaParam === 'default' ? localStorage.getItem('omni_delivery_config') : null);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: initialLojaParam,
      segmento: 'hamburgueria' as SegmentId,
      nome: 'Max Hamburguer',
      slogan: 'Hambúrgueres Artesanais na Brasa',
      cidade: 'Tangará da Serra',
      bairro: 'Jd Buritis',
      endereco: 'Rua B (Lot Bela Vista) Nº 378',
      whatsapp: '5565996953036',
      whatsappExibicao: '(65) 99695-3036',
      corTema: '#f97316',
      taxaEntregaPadrao: 7.00,
      tempoEntrega: '35-50 min',
      aberto: true,
      horarioFuncionamento: 'Terça a Domingo das 18h às 00h',
      cardapioConfirmadoHoje: true,
      ultimaConfirmacao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved =
        localStorage.getItem(`omni_delivery_products_${initialLojaParam}`) ||
        (initialLojaParam === 'default' ? localStorage.getItem('omni_delivery_products') : null);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialLojaParam === 'default' ? PRODUTOS_PRESETS_SEGMENTO.hamburgueria : [];
  });

  const currentSegment = storeConfig.segmento || 'hamburgueria';
  const currentSegmentConfig = SEGMENTOS_DISPONIVEIS.find((s) => s.id === currentSegment) || SEGMENTOS_DISPONIVEIS[0];
  const categoriasBase = CATEGORIAS_POR_SEGMENTO[currentSegment] || CATEGORIAS_POR_SEGMENTO.hamburgueria;
  const categoriasDoSegmento: CategoryInfo[] = React.useMemo(() => {
    const map = new Map<string, CategoryInfo>();
    categoriasBase.forEach((c) => map.set(c.id, c));
    (storeConfig.categoriasCustomizadas || []).forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [categoriasBase, storeConfig.categoriasCustomizadas]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (initialModo === 'kds') return 'pedidos';
    return 'operacao';
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'todos'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'disponiveis' | 'pausados' | 'destaques'>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isBatchPriceOpen, setIsBatchPriceOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isKitchenReceiptOpen, setIsKitchenReceiptOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isExclusiveLinkModalOpen, setIsExclusiveLinkModalOpen] = useState(false);

  // Kitchen receipt dynamic order data
  const [kitchenReceiptData, setKitchenReceiptData] = useState<{
    cartItems: CartItem[];
    customerName: string;
    customerAddress: string;
    paymentMethod: string;
  }>({
    cartItems: [],
    customerName: 'Cliente Balcão',
    customerAddress: 'Rua Principal, 100',
    paymentMethod: 'PIX (Chave da Loja)',
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Subscribe to all establishments list for Platform Manager & Custom Slug Resolution
  useEffect(() => {
    const unsubscribeAll = subscribeToAllStores((stores) => {
      setAllStores(stores);
      // Resolve custom slug in URL (?loja=meu-slug) to the actual store document ID
      if (rawLojaUrlParam && stores.length > 0) {
        const cleanedParam = sanitizeMenuSlug(rawLojaUrlParam);
        const matchedBySlug = stores.find(
          (s) =>
            (s.slug && sanitizeMenuSlug(s.slug) === cleanedParam) ||
            (s.id && sanitizeStoreId(s.id) === sanitizeStoreId(rawLojaUrlParam))
        );
        if (matchedBySlug && matchedBySlug.id && matchedBySlug.id !== selectedStoreId) {
          setSelectedStoreId(matchedBySlug.id);
        }
      }
    });
    return () => unsubscribeAll();
  }, [rawLojaUrlParam]);

  // Real-time Firestore synchronization for StoreConfig and Products isolated by activeStoreId
  useEffect(() => {
    // Load cached config/products for activeStoreId immediately on store switch
    try {
      const cachedCfg = localStorage.getItem(`omni_delivery_config_${activeStoreId}`);
      if (cachedCfg) {
        setStoreConfig({ ...JSON.parse(cachedCfg), id: activeStoreId });
      }
      const cachedProds = localStorage.getItem(`omni_delivery_products_${activeStoreId}`);
      if (cachedProds) {
        setProducts(JSON.parse(cachedProds));
      }
    } catch {}

    const unsubscribeConfig = subscribeToStoreConfig(
      (cloudConfig, exists) => {
        if (exists && cloudConfig) {
          setStoreConfig({ ...cloudConfig, id: activeStoreId });
          try {
            localStorage.setItem(`omni_delivery_config_${activeStoreId}`, JSON.stringify(cloudConfig));
            if (activeStoreId === 'default') {
              localStorage.setItem('omni_delivery_config', JSON.stringify(cloudConfig));
            }
          } catch {}
        } else if (!exists && isAdmin && activeStoreId === 'default' && !hasSeededConfigRef.current) {
          hasSeededConfigRef.current = true;
          syncStoreConfigToFirestore(storeConfig, 'default').catch((err) => {
            console.warn('Falha ao inicializar store_config no Firestore:', err);
          });
        }
      },
      (err) => {
        console.warn('Leitura de configuração no Firestore:', err);
      },
      activeStoreId
    );

    const unsubscribeProducts = subscribeToProducts(
      (cloudProducts, isEmpty) => {
        if (!isEmpty && cloudProducts.length > 0) {
          setProducts(cloudProducts);
          try {
            localStorage.setItem(`omni_delivery_products_${activeStoreId}`, JSON.stringify(cloudProducts));
            if (activeStoreId === 'default') {
              localStorage.setItem('omni_delivery_products', JSON.stringify(cloudProducts));
            }
          } catch {}
        } else if (isEmpty && isAdmin && activeStoreId === 'default' && !hasSeededProductsRef.current) {
          hasSeededProductsRef.current = true;
          syncProductsBatchToFirestore(products, false, 'default').catch((err) => {
            console.warn('Falha ao inicializar produtos no Firestore:', err);
          });
        } else if (isEmpty && activeStoreId !== 'default') {
          setProducts([]);
        }
      },
      (err) => {
        console.warn('Leitura de produtos no Firestore:', err);
      },
      activeStoreId
    );

    return () => {
      unsubscribeConfig();
      unsubscribeProducts();
    };
  }, [isAdmin, activeStoreId]);

  // Persist products to state, cache, and Firestore batch scoped to activeStoreId
  const saveProducts = (newProducts: Product[], replaceAllInCloud: boolean = false, targetStoreId: string = activeStoreId) => {
    const stamped = newProducts.map((p) => ({ ...p, storeId: targetStoreId }));
    setProducts(stamped);
    try {
      localStorage.setItem(`omni_delivery_products_${targetStoreId}`, JSON.stringify(stamped));
      if (targetStoreId === 'default') {
        localStorage.setItem('omni_delivery_products', JSON.stringify(stamped));
      }
    } catch (e) {}

    if (isAdmin) {
      syncProductsBatchToFirestore(stamped, replaceAllInCloud, targetStoreId).catch((err) => {
        console.warn('Erro ao sincronizar lote de produtos no Firestore:', err);
      });
    }
  };

  // Persist a single product mutation to state, cache, and Firestore scoped to activeStoreId
  const saveSingleProductMutation = (newProducts: Product[], changedProduct: Product) => {
    const stampedProduct = { ...changedProduct, storeId: activeStoreId };
    const stampedList = newProducts.map((p) => (p.id === changedProduct.id ? stampedProduct : p));
    setProducts(stampedList);
    try {
      localStorage.setItem(`omni_delivery_products_${activeStoreId}`, JSON.stringify(stampedList));
      if (activeStoreId === 'default') {
        localStorage.setItem('omni_delivery_products', JSON.stringify(stampedList));
      }
    } catch (e) {}

    if (isAdmin) {
      syncProductToFirestore(stampedProduct, activeStoreId).catch((err) => {
        console.warn('Erro ao sincronizar produto no Firestore:', err);
      });
    }
  };

  // Persist store config to state, cache, and Firestore scoped to activeStoreId
  const saveStoreConfig = (newConfig: StoreConfig, targetStoreId: string = activeStoreId) => {
    const stampedConfig = { ...newConfig, id: targetStoreId };
    setStoreConfig(stampedConfig);
    try {
      localStorage.setItem(`omni_delivery_config_${targetStoreId}`, JSON.stringify(stampedConfig));
      if (targetStoreId === 'default') {
        localStorage.setItem('omni_delivery_config', JSON.stringify(stampedConfig));
      }
    } catch (e) {}

    if (isAdmin) {
      syncStoreConfigToFirestore(stampedConfig, targetStoreId).catch((err) => {
        console.warn('Erro ao sincronizar configuração da loja no Firestore:', err);
      });
    }
  };

  // Force full cloud synchronization on demand for activeStoreId
  const handleForceSyncCloud = async () => {
    try {
      await syncStoreConfigToFirestore(storeConfig, activeStoreId);
      await syncProductsBatchToFirestore(products, true, activeStoreId);
      showToast(`Catálogo e configurações de "${storeConfig.nome}" sincronizados no Firestore!`);
    } catch (err) {
      console.error('Erro ao sincronizar manualmente:', err);
      showToast('Verifique sua autenticação de administrador para gravar na nuvem.');
    }
  };

  // Clear demo orders in Firestore and localStorage to start clean operation for activeStoreId
  const handleClearDemoOrders = async (targetStoreId: string = activeStoreId) => {
    try {
      localStorage.setItem(`omni_kds_orders_cleared_${targetStoreId}`, 'true');
      localStorage.setItem(`omni_kds_orders_${targetStoreId}`, JSON.stringify([]));
      if (targetStoreId === 'default') {
        localStorage.setItem('omni_kds_orders_cleared', 'true');
        localStorage.setItem('omni_kds_orders', JSON.stringify([]));
      }
      await clearAllOrdersInFirestore(targetStoreId);
      showToast('Pedidos de demonstração zerados! Painel pronto para pedidos reais.');
    } catch (err) {
      console.warn('Erro ao zerar pedidos de demonstração:', err);
      showToast('Pedidos locais zerados para operação real!');
    }
  };

  // Segment Switching Handler
  const handleSelectSegment = (segmentId: SegmentId, loadSampleData: boolean) => {
    const segInfo = SEGMENTOS_DISPONIVEIS.find((s) => s.id === segmentId) || SEGMENTOS_DISPONIVEIS[0];

    const nomesSugeridos: { [key in SegmentId]: { nome: string; slogan: string } } = {
      hamburgueria: { nome: 'Max Hamburguer', slogan: 'Hambúrgueres Artesanais na Brasa' },
      pizzaria: { nome: 'Pizzaria Bella Napoli', slogan: 'Pizzas Artesanais no Forno a Lenha' },
      restaurante: { nome: 'Restaurante Sabor Caseiro', slogan: 'Almoço Executivo & Marmitex Diário' },
      confeitaria: { nome: 'Doce Encanto Confeitaria', slogan: 'Bolos de Festa & Fatias Gourmet' },
      padaria: { nome: 'Padaria Pão Dourado', slogan: 'Pães Quentinhos & Cafeteria Especial' },
      acaiteria: { nome: 'Puro Açaí & Sorvetes', slogan: 'O Melhor Açaí no Copo e na Barca' },
      japones: { nome: 'Haru Sushi Delivery', slogan: 'Combinados & Temakis Frescos' },
    };

    const suggested = nomesSugeridos[segmentId] || nomesSugeridos.hamburgueria;

    const updatedConfig: StoreConfig = {
      ...storeConfig,
      segmento: segmentId,
      nome: suggested.nome,
      slogan: suggested.slogan,
      corTema: segInfo.corSecundaria,
    };
    saveStoreConfig(updatedConfig);

    if (loadSampleData) {
      const presetProducts = PRODUTOS_PRESETS_SEGMENTO[segmentId] || [];
      saveProducts(presetProducts, true);
      showToast(`Segmento alterado para ${segInfo.nome} e sincronizado na nuvem!`);
    } else {
      const adapted = products.map((p) => ({ ...p, segmento: segmentId }));
      saveProducts(adapted, false);
      showToast(`Segmento alterado para ${segInfo.nome}!`);
    }

    setSelectedCategory('todos');
  };

  // Add or Edit Product
  const handleSaveProduct = (product: Product) => {
    const exists = products.some((p) => p.id === product.id);
    let updated: Product[];
    if (exists) {
      updated = products.map((p) => (p.id === product.id ? product : p));
      showToast(`"${product.nome}" atualizado e sincronizado no Firestore!`);
    } else {
      updated = [product, ...products];
      showToast(`Novo item "${product.nome}" salvo no Firestore!`);
    }
    saveSingleProductMutation(updated, product);
  };

  // Duplicate product
  const handleDuplicateProduct = (product: Product) => {
    const duplicated: Product = {
      ...product,
      id: 'prod_' + Date.now(),
      nome: `${product.nome} (Cópia)`,
      destaque: false,
      criadoEm: new Date().toISOString(),
    };
    const updated = [duplicated, ...products];
    saveSingleProductMutation(updated, duplicated);
    showToast(`Cópia criada e sincronizada na nuvem!`);
    setEditingProduct(duplicated);
    setIsProductModalOpen(true);
  };

  // Delete product
  const handleDeleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    try {
      localStorage.setItem(`omni_delivery_products_${activeStoreId}`, JSON.stringify(updated));
      if (activeStoreId === 'default') {
        localStorage.setItem('omni_delivery_products', JSON.stringify(updated));
      }
    } catch (e) {}

    if (isAdmin) {
      deleteProductFromFirestore(id, activeStoreId).catch((err) => {
        console.warn('Erro ao excluir produto do Firestore:', err);
      });
    }
    showToast(`"${prod?.nome || 'Item'}" excluído do cardápio e da nuvem.`);
  };

  // 1-Click Toggle Availability
  const handleToggleDisponivel = (id: string) => {
    let targetProduct: Product | null = null;
    const updated = products.map((p) => {
      if (p.id === id) {
        const novoStatus = !p.disponivel;
        showToast(novoStatus ? `"${p.nome}" reativado na nuvem!` : `"${p.nome}" marcado como ESGOTADO.`);
        targetProduct = { ...p, disponivel: novoStatus };
        return targetProduct;
      }
      return p;
    });
    if (targetProduct) {
      saveSingleProductMutation(updated, targetProduct);
    }
  };

  // Toggle Featured
  const handleToggleDestaque = (id: string) => {
    let targetProduct: Product | null = null;
    const updated = products.map((p) => {
      if (p.id === id) {
        targetProduct = { ...p, destaque: !p.destaque };
        return targetProduct;
      }
      return p;
    });
    if (targetProduct) {
      saveSingleProductMutation(updated, targetProduct);
    }
  };

  // Quick price update inline
  const handleQuickUpdatePrice = (id: string, newPrice: number) => {
    let targetProduct: Product | null = null;
    const updated = products.map((p) => {
      if (p.id === id) {
        targetProduct = { ...p, preco: newPrice };
        return targetProduct;
      }
      return p;
    });
    if (targetProduct) {
      saveSingleProductMutation(updated, targetProduct);
      showToast('Preço atualizado e sincronizado no Firestore!');
    }
  };

  // Batch price adjustment
  const handleApplyBatchPrice = (categoria: CategoryId | 'todos', modo: 'porcentagem' | 'fixo', valor: number) => {
    const updated = products.map((p) => {
      if (categoria === 'todos' || p.categoria === categoria) {
        let newPrice = p.preco;
        if (modo === 'porcentagem') {
          newPrice = Math.round(p.preco * (1 + valor / 100) * 10) / 10;
        } else {
          newPrice = p.preco + valor;
        }
        return { ...p, preco: Math.max(0.5, newPrice) };
      }
      return p;
    });
    saveProducts(updated, false);
    showToast(`Preços atualizados em lote no Firestore!`);
  };

  // Confirm today's menu
  const handleConfirmTodayMenu = (updatedProducts: Product[], message: string) => {
    saveProducts(updatedProducts, false);
    const newConfig: StoreConfig = {
      ...storeConfig,
      cardapioConfirmadoHoje: true,
      ultimaConfirmacao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    saveStoreConfig(newConfig);
    showToast('Cardápio do dia 100% confirmado e sincronizado na nuvem!');
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'todos' || p.categoria === selectedCategory;
    const matchesSearch =
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.selo && p.selo.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'disponiveis') matchesStatus = p.disponivel;
    if (statusFilter === 'pausados') matchesStatus = !p.disponivel;
    if (statusFilter === 'destaques') matchesStatus = !!p.destaque;

    return matchesCategory && matchesSearch && matchesStatus;
  });

  const cardSurface = isDark 
    ? 'bg-neutral-900 border-neutral-800' 
    : 'bg-white border-neutral-200 shadow-sm';

  const innerSurface = isDark 
    ? 'bg-neutral-950 border-neutral-800 text-white' 
    : 'bg-neutral-100 border-neutral-200 text-neutral-900';

  // If running in Public Customer Storefront mode (?modo=cardapio), render clean customer digital menu
  if (isPublicStorefront) {
    return (
      <PublicStorefrontView
        products={products}
        storeConfig={storeConfig}
        showAdminReturnBar={openedFromAdmin || isAdmin}
        onExitPublicMode={() => {
          setIsPublicStorefront(false);
          if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'} flex flex-col font-sans transition-colors duration-200 selection:bg-orange-500 selection:text-white`}>
      {/* Header */}
      <Header
        storeConfig={storeConfig}
        currentSegmentConfig={currentSegmentConfig}
        products={products}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'checklist') {
            setIsChecklistOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onNewProduct={() => {
          setEditingProduct(null);
          setIsProductModalOpen(true);
        }}
        onOpenChecklist={() => setIsChecklistOpen(true)}
        onOpenBatchPrice={() => setIsBatchPriceOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSegmentModal={() => setIsSegmentModalOpen(true)}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onOpenKitchenReceipt={() => setIsKitchenReceiptOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        activeStoreId={activeStoreId}
        allStores={allStores}
        onSelectStore={(newStoreId) => {
          if (isSuperAdmin) {
            setSelectedStoreId(newStoreId);
            showToast(`Alternado para o estabelecimento: ${newStoreId}`);
          }
        }}
        viewPerspective={isSuperAdmin ? viewPerspective : 'store_manager'}
        onChangePerspective={(p) => setViewPerspective(p)}
        onToggleStoreOpen={() => {
          const updated: StoreConfig = {
            ...storeConfig,
            aberto: !storeConfig.aberto,
          };
          saveStoreConfig(updated);
          showToast(
            updated.aberto
              ? 'Loja ABERTA para receber pedidos reais na nuvem!'
              : 'Loja FECHADA temporariamente para novos pedidos.'
          );
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alerta caso o usuário tenha feito login com um e-mail que ainda não foi vinculado a nenhum estabelecimento */}
        {user && !isSuperAdmin && !isAdmin && (
          <div className="mb-6 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  Login conectado ({user.email}), mas ainda sem vínculo ativo a um estabelecimento
                </p>
                <p className="text-neutral-400">
                  Solicite ao Gerente da Plataforma (maxuell86@gmail.com) para vincular seu e-mail ao seu estabelecimento em &quot;Acessos &amp; Vínculos&quot;.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-neutral-950 font-black whitespace-nowrap cursor-pointer"
            >
              Verificar Acesso
            </button>
          </div>
        )}

        {/* DEP 0: VISÃO OPERACIONAL DO GERENTE DO ESTABELECIMENTO */}
        {activeTab === 'operacao' && (
          <StoreManagerOperationView
            storeId={activeStoreId}
            storeConfig={storeConfig}
            products={products}
            onSaveConfig={(cfg) => saveStoreConfig(cfg)}
            onToggleDisponivel={handleToggleDisponivel}
            onNewProduct={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setIsProductModalOpen(true);
            }}
            onOpenKds={() => setActiveTab('pedidos')}
            onOpenChecklist={() => setIsChecklistOpen(true)}
            onOpenKitchenReceipt={() => setIsKitchenReceiptOpen(true)}
            onOpenPublicStorefront={() => {
              setOpenedFromAdmin(true);
              setIsPublicStorefront(true);
            }}
            onOpenExclusiveLinkModal={() => setIsExclusiveLinkModalOpen(true)}
            showToast={showToast}
          />
        )}

        {/* DEP 1: GESTÃO DE CARDÁPIO (PRODUTOS) */}
        {(activeTab === 'cardapio' || activeTab === 'produtos') && (
          <div className="space-y-6">
            {/* Quick Segment Banner, Stats & Direct Exclusive Store Menu Link */}
            <div className={`${cardSurface} border rounded-2xl p-4 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentSegmentConfig.icone}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-orange-500">
                      Segmento: {currentSegmentConfig.nome}
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      ({products.length} itens vinculados exclusivamente a esta loja)
                    </span>
                  </div>
                  <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {storeConfig.nome} • {storeConfig.slogan}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Direct Exclusive Menu Link Copy, QR Code & Preview */}
                {(() => {
                  const storeMenuUrl = buildExclusiveMenuUrl(activeStoreId, storeConfig);
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsExclusiveLinkModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Link Personalizado, QR Code &amp; WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(storeMenuUrl);
                          showToast(`Link exclusivo do cardápio de "${storeConfig.nome}" copiado!`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                        title={storeMenuUrl}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Link</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenedFromAdmin(true);
                          setIsPublicStorefront(true);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                          isDark
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Ver Cardápio do Cliente</span>
                      </button>
                    </>
                  );
                })()}

                {isSuperAdmin && viewPerspective === 'platform_admin' ? (
                  <button
                    onClick={() => setIsSegmentModalOpen(true)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-orange-500" />
                    <span>Trocar Segmento Comercial</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>ID Loja: {activeStoreId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Filter & Toolbar */}
            <div className={`${cardSurface} border rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center transition-colors`}>
              
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar em ${currentSegmentConfig.nome.toLowerCase()}...`}
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:border-orange-500 transition ${
                    isDark 
                      ? 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500' 
                      : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400'
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

              {/* Status Filters & View Toggle */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${innerSurface}`}>
                  <button
                    onClick={() => setStatusFilter('todos')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === 'todos' ? 'bg-orange-500 text-white' : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Todos ({products.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('disponiveis')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === 'disponiveis' ? 'bg-emerald-500 text-white' : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Disponíveis ({products.filter((p) => p.disponivel).length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pausados')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === 'pausados' ? 'bg-red-500 text-white' : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Pausados ({products.filter((p) => !p.disponivel).length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('destaques')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === 'destaques' ? 'bg-amber-400 text-neutral-950 font-bold' : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Destaques ⭐
                  </button>
                </div>

                <div className={`flex items-center gap-1 p-1 rounded-xl border ${innerSurface}`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'grid' 
                        ? 'bg-orange-500 text-white shadow-xs' 
                        : isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                    title="Visualização em Grade de Cards"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'table' 
                        ? 'bg-orange-500 text-white shadow-xs' 
                        : isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                    title="Visualização em Tabela Rápida"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Pills Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('todos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-2 border ${
                  selectedCategory === 'todos'
                    ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : isDark
                    ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 shadow-xs'
                }`}
              >
                <span>🔥 Todas as Categorias</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isDark ? 'bg-black/40 text-neutral-300' : 'bg-neutral-200 text-neutral-700'}`}>
                  {products.length}
                </span>
              </button>

              {categoriasDoSegmento.map((cat) => {
                const count = products.filter((p) => p.categoria === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-2 border ${
                      selectedCategory === cat.id
                        ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : isDark
                        ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-white'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 shadow-xs'
                    }`}
                  >
                    <span>{cat.icone}</span>
                    <span>{cat.nome}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isDark ? 'bg-black/40 text-neutral-300' : 'bg-neutral-200 text-neutral-700'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Product List Content */}
            {filteredProducts.length === 0 ? (
              <div className={`py-16 text-center ${cardSurface} border rounded-2xl p-8 transition-colors`}>
                <div className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'} flex items-center justify-center mx-auto text-2xl mb-3`}>
                  {currentSegmentConfig.icone}
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Nenhum item encontrado</h3>
                <p className={`text-sm mt-1 max-w-md mx-auto ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Não encontramos nenhum item correspondente aos filtros atuais. Tente limpar a busca ou adicione um novo produto.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('todos');
                    setStatusFilter('todos');
                  }}
                  className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                  }`}
                >
                  Limpar Filtros
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={(p) => {
                      setEditingProduct(p);
                      setIsProductModalOpen(true);
                    }}
                    onDuplicate={handleDuplicateProduct}
                    onDelete={handleDeleteProduct}
                    onToggleDisponivel={handleToggleDisponivel}
                    onToggleDestaque={handleToggleDestaque}
                    onQuickUpdatePrice={handleQuickUpdatePrice}
                  />
                ))}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className={`${cardSurface} border rounded-2xl overflow-hidden shadow-lg transition-colors`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b uppercase tracking-wider font-bold ${
                      isDark ? 'bg-neutral-950/80 border-neutral-800 text-neutral-400' : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                    }`}>
                      <tr>
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4">Preço</th>
                        <th className="py-3 px-4">Opcionais</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-neutral-800/80' : 'divide-neutral-200'}`}>
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className={`transition ${isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-50'}`}>
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={p.foto}
                              alt={p.nome}
                              className={`w-10 h-10 rounded-lg object-cover flex-shrink-0 ${isDark ? 'bg-neutral-950' : 'bg-neutral-100'}`}
                            />
                            <div>
                              <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>{p.nome}</p>
                              <p className={`text-[11px] line-clamp-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{p.descricao}</p>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-semibold text-orange-500 capitalize">
                            {p.categoria}
                          </td>

                          <td className="py-3 px-4 font-black text-emerald-500 text-sm">
                            R$ {p.preco.toFixed(2).replace('.', ',')}
                            {p.unidadeMedida && p.unidadeMedida !== 'unidade' && (
                              <span className={`text-[10px] font-normal ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}> /{p.unidadeMedida}</span>
                            )}
                          </td>

                          <td className={`py-3 px-4 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            {p.opcoes && p.opcoes.length > 0 ? (
                              <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                                isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-100 border-neutral-300 text-neutral-800'
                              }`}>
                                {p.opcoes.length} grupos
                              </span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleDisponivel(p.id)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                                p.disponivel
                                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-500 border border-red-500/30'
                              }`}
                            >
                              {p.disponivel ? 'Disponível' : 'Esgotado'}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className={`px-2.5 py-1 rounded font-semibold transition ${
                                isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200'
                              }`}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(p)}
                              className={`px-2.5 py-1 rounded font-semibold transition ${
                                isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 border border-neutral-200'
                              }`}
                            >
                              Duplicar
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded font-semibold transition"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEP 2: PEDIDOS & KDS EM TEMPO REAL */}
        {activeTab === 'pedidos' && (
          <OrdersKdsView
            storeId={activeStoreId}
            storeConfig={storeConfig}
            products={products}
            onOpenKitchenReceipt={(cartItems, name, addr, pay) => {
              setKitchenReceiptData({
                cartItems,
                customerName: name,
                customerAddress: addr,
                paymentMethod: pay,
              });
              setIsKitchenReceiptOpen(true);
            }}
            showToast={showToast}
          />
        )}

        {/* DEP 3: ESTOQUE & INSUMOS */}
        {activeTab === 'estoque' && (
          <InventoryView
            products={products}
            onToggleDisponivel={handleToggleDisponivel}
            showToast={showToast}
          />
        )}

        {/* DEP 4: FINANCEIRO & RELATÓRIOS (RECHARTS) */}
        {(activeTab === 'financeiro' || activeTab === 'relatorios') && (
          <ReportsView
            products={products}
            storeConfig={storeConfig}
          />
        )}

        {/* DEP 5: CUSTOMIZAÇÃO DE CORES & IDENTIDADE VISUAL */}
        {activeTab === 'customizacao' && (
          <CustomizationView
            storeConfig={storeConfig}
            onSaveConfig={saveStoreConfig}
            showToast={showToast}
            onOpenSimulator={() => setActiveTab('simulador')}
          />
        )}

        {/* DEP 6: DADOS DA LOJA, HORÁRIOS & FRETE POR BAIRRO */}
        {activeTab === 'loja' && (
          <StoreSettingsView
            storeConfig={storeConfig}
            onSaveConfig={saveStoreConfig}
            showToast={showToast}
          />
        )}

        {/* PROGRAMA DE FIDELIDADE & CUPONS */}
        {activeTab === 'fidelidade' && (
          <LoyaltyCouponsView
            storeConfig={storeConfig}
            onSaveConfig={saveStoreConfig}
            showToast={showToast}
          />
        )}

        {/* DEP 7: SIMULADOR DO CLIENTE (LIVE DELIVERY WEB APP) */}
        {activeTab === 'simulador' && (
          <CustomerSimulator
            products={products}
            storeConfig={storeConfig}
          />
        )}

        {/* DEP 8: GUIA COMPLETO PARA COLOCAR EM PRODUÇÃO */}
        {activeTab === 'producao' && (
          <ProductionDeployGuide
            storeConfig={storeConfig}
            productsCount={products.length}
            onOpenExport={() => setIsExportOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenTeamModal={() => setIsTeamModalOpen(true)}
            onOpenPublicStorefront={() => {
              setOpenedFromAdmin(true);
              setIsPublicStorefront(true);
            }}
            onOpenKdsMode={() => setActiveTab('pedidos')}
            onToggleStoreOpen={() => {
              const updated: StoreConfig = {
                ...storeConfig,
                aberto: !storeConfig.aberto,
              };
              saveStoreConfig(updated);
              showToast(
                updated.aberto
                  ? '🟢 Loja ABERTA para receber pedidos reais na nuvem!'
                  : '🔴 Loja FECHADA temporariamente para novos pedidos.'
              );
            }}
            onForceSyncCloud={handleForceSyncCloud}
            onClearDemoOrders={handleClearDemoOrders}
          />
        )}

        {/* DIAGNÓSTICO & ESCALABILIDADE COMERCIAL */}
        {activeTab === 'diagnostico' && (
          <DiagnosticView
            products={products}
            storeConfig={storeConfig}
            onOpenExport={() => setIsExportOpen(true)}
            onOpenSegmentModal={() => setIsSegmentModalOpen(true)}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className={`border-t py-6 text-center text-xs transition-colors ${
        isDark ? 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400' : 'border-neutral-200 bg-white text-neutral-600 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className={`font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>{storeConfig.nome}</span>
            <span>• Nicho: {currentSegmentConfig.nome}</span>
          </div>

          <div className="text-neutral-400">
            Plataforma White-Label de Delivery &amp; Gestão de Cardápio para Múltiplos Estabelecimentos
          </div>
        </div>
      </footer>

      {/* PRODUCT ADD/EDIT MODAL */}
      <ProductModal
        isOpen={isProductModalOpen}
        currentSegment={currentSegment}
        product={editingProduct}
        customCategories={storeConfig.categoriasCustomizadas || []}
        onUpdateCustomCategories={(newCustomCats) => {
          const updatedCfg: StoreConfig = {
            ...storeConfig,
            categoriasCustomizadas: newCustomCats,
          };
          saveStoreConfig(updatedCfg);
          showToast('Categorias personalizadas do estabelecimento atualizadas!');
        }}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* EXCLUSIVE MENU LINK, QR CODE & WHATSAPP MODAL */}
      <ExclusiveMenuLinkModal
        isOpen={isExclusiveLinkModalOpen}
        storeId={activeStoreId}
        storeConfig={storeConfig}
        allStores={allStores}
        onClose={() => setIsExclusiveLinkModalOpen(false)}
        onSaveConfig={(cfg) => saveStoreConfig(cfg)}
        onOpenPublicStorefront={() => {
          setOpenedFromAdmin(true);
          setIsPublicStorefront(true);
        }}
        showToast={showToast}
      />

      {/* DAILY CHECKLIST MODAL */}
      <DailyChecklistModal
        isOpen={isChecklistOpen}
        products={products}
        storeConfig={storeConfig}
        onClose={() => setIsChecklistOpen(false)}
        onConfirmMenu={handleConfirmTodayMenu}
        onToggleDisponivel={handleToggleDisponivel}
      />

      {/* BATCH PRICE MODAL */}
      <BatchPriceModal
        isOpen={isBatchPriceOpen}
        products={products}
        onClose={() => setIsBatchPriceOpen(false)}
        onApplyBatchPrice={handleApplyBatchPrice}
      />

      {/* EXPORT MODAL */}
      <ExportModal
        isOpen={isExportOpen}
        products={products}
        storeConfig={storeConfig}
        onClose={() => setIsExportOpen(false)}
      />

      {/* SEGMENT SELECTOR MODAL */}
      <SegmentSelectorModal
        isOpen={isSegmentModalOpen}
        currentSegment={currentSegment}
        onClose={() => setIsSegmentModalOpen(false)}
        onSelectSegment={handleSelectSegment}
      />

      {/* PAYMENT SETTINGS MODAL */}
      <PaymentSettingsModal
        isOpen={isPaymentModalOpen}
        storeConfig={storeConfig}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={(newPayments) => {
          const updated: StoreConfig = {
            ...storeConfig,
            pagamentos: newPayments,
          };
          saveStoreConfig(updated);
          showToast('Configurações de pagamento atualizadas!');
        }}
      />

      {/* CLIENT ONBOARDING WIZARD MODAL */}
      <ClientOnboardingModal
        isOpen={isOnboardingOpen}
        activeStoreId={activeStoreId}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={async (newConfig, loadSample, targetStoreId) => {
          hasSeededConfigRef.current = true;
          hasSeededProductsRef.current = true;
          setSelectedStoreId(targetStoreId);
          saveStoreConfig(newConfig, targetStoreId);
          if (loadSample) {
            const sample = PRODUTOS_PRESETS_SEGMENTO[newConfig.segmento] || [];
            saveProducts(sample, true, targetStoreId);
          } else {
            saveProducts([], true, targetStoreId);
          }
          await handleClearDemoOrders(targetStoreId);

          // Se informou e-mail do Gerente do Estabelecimento, vincula automaticamente na coleção admins
          if (newConfig.gerenteEmail) {
            try {
              const emailLower = newConfig.gerenteEmail.trim().toLowerCase();
              const memberId = emailLower.replace(/[^a-zA-Z0-9_-]/g, '_');
              await setDoc(
                doc(db, 'admins', memberId),
                {
                  uid: memberId,
                  email: emailLower,
                  nome: newConfig.gerenteNome || emailLower.split('@')[0],
                  role: 'store_manager',
                  storeId: targetStoreId,
                  storeName: newConfig.nome,
                  criadoEm: new Date().toISOString(),
                },
                { merge: true }
              );
            } catch (e) {
              console.warn('Falha ao vincular gerente automaticamente:', e);
            }
          }

          showToast(`Estabelecimento "${newConfig.nome}" implantado e isolado com sucesso!`);
          setActiveTab('producao');
        }}
      />

      {/* ADMIN TEAM & MULTI-STORE ACCESS BINDING MODAL */}
      <AdminTeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        showToast={showToast}
        onForceSyncCloud={handleForceSyncCloud}
        activeStoreId={activeStoreId}
        storeConfig={storeConfig}
        allStores={allStores}
        onSwitchStoreAndPreviewManager={(targetStoreId) => {
          setSelectedStoreId(targetStoreId);
          setViewPerspective('store_manager');
          setActiveTab('operacao');
          showToast('Simulando a visão operacional do gerente deste estabelecimento!');
        }}
      />

      {/* KITCHEN RECEIPT MODAL */}
      <KitchenReceiptModal
        isOpen={isKitchenReceiptOpen}
        storeConfig={storeConfig}
        cartItems={kitchenReceiptData.cartItems}
        customerName={kitchenReceiptData.customerName}
        customerAddress={kitchenReceiptData.customerAddress}
        paymentMethod={kitchenReceiptData.paymentMethod}
        onClose={() => setIsKitchenReceiptOpen(false)}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-neutral-900 text-white border border-neutral-700 shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
