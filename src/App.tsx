import React, { useState } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  CheckCircle2, 
  Store,
  Sparkles,
  Building2,
  ChevronDown
} from 'lucide-react';
import { Product, StoreConfig, CategoryId, SegmentId } from './types';
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
import { PaymentMethodsConfig, CartItem } from './types';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { isDark } = useTheme();
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    try {
      const saved = localStorage.getItem('omni_delivery_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
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
      const saved = localStorage.getItem('omni_delivery_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return PRODUTOS_PRESETS_SEGMENTO.hamburgueria;
  });

  const currentSegment = storeConfig.segmento || 'hamburgueria';
  const currentSegmentConfig = SEGMENTOS_DISPONIVEIS.find((s) => s.id === currentSegment) || SEGMENTOS_DISPONIVEIS[0];
  const categoriasDoSegmento = CATEGORIAS_POR_SEGMENTO[currentSegment] || CATEGORIAS_POR_SEGMENTO.hamburgueria;

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<AppTab>('produtos');

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

  // Persist products to localStorage
  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem('omni_delivery_products', JSON.stringify(newProducts));
    } catch (e) {}
  };

  // Persist store config
  const saveStoreConfig = (newConfig: StoreConfig) => {
    setStoreConfig(newConfig);
    try {
      localStorage.setItem('omni_delivery_config', JSON.stringify(newConfig));
    } catch (e) {}
  };

  // Segment Switching Handler
  const handleSelectSegment = (segmentId: SegmentId, loadSampleData: boolean) => {
    const segInfo = SEGMENTOS_DISPONIVEIS.find((s) => s.id === segmentId) || SEGMENTOS_DISPONIVEIS[0];

    // Name suggestions for commercial demo
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
      saveProducts(presetProducts);
      showToast(`Segmento alterado para ${segInfo.nome} com cardápio modelo carregado!`);
    } else {
      // Keep existing products, just update their segment tag
      const adapted = products.map((p) => ({ ...p, segmento: segmentId }));
      saveProducts(adapted);
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
      showToast(`"${product.nome}" atualizado com sucesso!`);
    } else {
      updated = [product, ...products];
      showToast(`Novo item "${product.nome}" cadastrado no cardápio!`);
    }
    saveProducts(updated);
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
    saveProducts(updated);
    showToast(`Cópia criada para edição rápida!`);
    setEditingProduct(duplicated);
    setIsProductModalOpen(true);
  };

  // Delete product
  const handleDeleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (confirm(`Excluir "${prod?.nome || 'o item'}" do cardápio?`)) {
      const updated = products.filter((p) => p.id !== id);
      saveProducts(updated);
      showToast('Item excluído do cardápio.');
    }
  };

  // 1-Click Toggle Availability
  const handleToggleDisponivel = (id: string) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        const novoStatus = !p.disponivel;
        showToast(novoStatus ? `"${p.nome}" reativado!` : `"${p.nome}" marcado como ESGOTADO.`);
        return { ...p, disponivel: novoStatus };
      }
      return p;
    });
    saveProducts(updated);
  };

  // Toggle Featured
  const handleToggleDestaque = (id: string) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, destaque: !p.destaque };
      }
      return p;
    });
    saveProducts(updated);
  };

  // Quick price update inline
  const handleQuickUpdatePrice = (id: string, newPrice: number) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, preco: newPrice };
      }
      return p;
    });
    saveProducts(updated);
    showToast('Preço atualizado!');
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
    saveProducts(updated);
    showToast(`Preços atualizados com sucesso!`);
  };

  // Confirm today's menu
  const handleConfirmTodayMenu = (updatedProducts: Product[], message: string) => {
    saveProducts(updatedProducts);
    const newConfig: StoreConfig = {
      ...storeConfig,
      cardapioConfirmadoHoje: true,
      ultimaConfirmacao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    saveStoreConfig(newConfig);
    showToast('Cardápio do dia 100% confirmado para os clientes!');
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* DEP 1: GESTÃO DE CARDÁPIO (PRODUTOS) */}
        {(activeTab === 'cardapio' || activeTab === 'produtos') && (
          <div className="space-y-6">
            
            {/* Quick Segment Banner & Stats */}
            <div className={`${cardSurface} border rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentSegmentConfig.icone}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-orange-500">
                      Segmento: {currentSegmentConfig.nome}
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      ({products.length} itens cadastrados)
                    </span>
                  </div>
                  <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {storeConfig.nome} • {storeConfig.slogan}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setIsSegmentModalOpen(true)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                  isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-orange-500" />
                <span>Trocar Segmento Comercial</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
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
            onOpenExport={() => setIsExportOpen(true)}
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
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
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
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={(newConfig, loadSample) => {
          saveStoreConfig(newConfig);
          if (loadSample) {
            const sample = PRODUTOS_PRESETS_SEGMENTO[newConfig.segmento] || [];
            saveProducts(sample);
          }
          showToast(`Novo cliente "${newConfig.nome}" configurado e lançado com sucesso!`);
          setActiveTab('cardapio');
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
