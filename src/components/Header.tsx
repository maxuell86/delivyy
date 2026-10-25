import React, { useState, useEffect } from 'react';
import {
  Store,
  AlertCircle,
  PlusCircle,
  Smartphone,
  Download,
  Percent,
  Sparkles,
  ClipboardCheck,
  Rocket,
  BarChart3,
  Boxes,
  ChefHat,
  Palette,
  CreditCard,
  Sun,
  Moon,
  Printer,
  Users,
  ShieldCheck,
  LogIn,
  Building2,
  Crown,
  LayoutDashboard,
  Tag,
  Lock,
  Power,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
} from 'lucide-react';
import { StoreConfig, Product, SegmentConfig, ViewPerspective, Order } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { subscribeToOrders } from '../services/firestoreSync';

export type AppTab =
  | 'operacao'
  | 'cardapio'
  | 'pedidos'
  | 'estoque'
  | 'financeiro'
  | 'customizacao'
  | 'loja'
  | 'simulador'
  | 'producao'
  | 'diagnostico'
  | 'produtos'
  | 'fidelidade'
  | 'relatorios'
  | 'checklist';

interface HeaderProps {
  storeConfig: StoreConfig;
  currentSegmentConfig: SegmentConfig;
  products: Product[];
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onNewProduct: () => void;
  onOpenChecklist: () => void;
  onOpenBatchPrice: () => void;
  onOpenExport: () => void;
  onOpenSegmentModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenKitchenReceipt: () => void;
  onOpenOnboarding: () => void;
  onOpenTeamModal: () => void;
  // Multi-Tenant & Role Perspective props
  activeStoreId?: string;
  allStores?: StoreConfig[];
  onSelectStore?: (storeId: string) => void;
  viewPerspective?: ViewPerspective;
  onChangePerspective?: (perspective: ViewPerspective) => void;
  onToggleStoreOpen?: () => void;
  // Sidebar Layout props
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeConfig,
  currentSegmentConfig,
  products,
  activeTab,
  onTabChange,
  onNewProduct,
  onOpenChecklist,
  onOpenBatchPrice,
  onOpenExport,
  onOpenSegmentModal,
  onOpenPaymentModal,
  onOpenKitchenReceipt,
  onOpenOnboarding,
  onOpenTeamModal,
  activeStoreId = 'default',
  allStores = [],
  onSelectStore,
  viewPerspective = 'platform_admin',
  onChangePerspective,
  onToggleStoreOpen,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
}) => {
  const { toggleAdminTheme, isDark } = useTheme();
  const { user, isSuperAdmin, assignedStoreId, signIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const totalProdutos = products.length;
  const disponiveis = products.filter((p) => p.disponivel).length;
  const esgotados = totalProdutos - disponiveis;

  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  useEffect(() => {
    const targetId = activeStoreId || storeConfig.id || 'default';
    const unsubscribe = subscribeToOrders(
      (orders) => setLiveOrders(orders),
      undefined,
      targetId
    );
    return () => unsubscribe();
  }, [activeStoreId, storeConfig.id]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const novosPedidosCount = liveOrders.filter((o) => o.status === 'recebido').length;
  const preparoPedidosCount = liveOrders.filter((o) => o.status === 'preparo').length;

  const isPlatformView = isSuperAdmin && viewPerspective === 'platform_admin';

  // Ensure current store is in dropdown options
  const storesOptions = React.useMemo(() => {
    const map = new Map<string, StoreConfig>();
    allStores.forEach((s) => {
      const id = s.id || 'default';
      map.set(id, { ...s, id });
    });
    const currId = activeStoreId || storeConfig.id || 'default';
    if (!map.has(currId)) {
      map.set(currId, { ...storeConfig, id: currId });
    }
    return Array.from(map.values());
  }, [allStores, storeConfig, activeStoreId]);

  const btnSecondaryClass = isDark
    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300 shadow-xs';

  const handleSelectTab = (tab: AppTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const handleTriggerAction = (fn: () => void) => {
    fn();
    setIsMobileMenuOpen(false);
  };

  // Shared Navigation Items Builder (used in both Desktop Sidebar & Mobile Hamburger Drawer)
  const renderSidebarContent = (collapsed: boolean, isMobileDrawer: boolean = false) => {
    const itemBase = `w-full flex items-center ${
      collapsed && !isMobileDrawer ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
    } rounded-xl text-xs font-bold transition cursor-pointer group relative`;

    const getTabClass = (isActive: boolean, accent: 'orange' | 'emerald' = 'orange') => {
      if (isActive) {
        return accent === 'emerald'
          ? 'bg-emerald-600 text-white shadow-xs'
          : 'bg-orange-500 text-white shadow-xs';
      }
      return isDark
        ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
        : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100';
    };

    const sectionTitleClass = `px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider ${
      isDark ? 'text-neutral-500' : 'text-neutral-400'
    }`;

    return (
      <div className="flex flex-col h-full justify-between select-none">
        <div className="space-y-1 p-2.5 overflow-y-auto flex-1">
          {/* MOBILE-ONLY STORE SELECTOR & PERSPECTIVE SWITCHER */}
          {isMobileDrawer && (
            <div
              className={`mb-3 p-3 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              {isSuperAdmin ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1">
                      Estabelecimento Ativo
                    </label>
                    <select
                      value={activeStoreId}
                      onChange={(e) => onSelectStore && onSelectStore(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-700 text-white'
                          : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    >
                      {storesOptions.map((st) => {
                        const stId = st.id || 'default';
                        return (
                          <option key={stId} value={stId}>
                            {st.nome} ({st.cidade || stId})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {onChangePerspective && (
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => onChangePerspective('platform_admin')}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                          isPlatformView
                            ? 'bg-orange-500 text-white'
                            : isDark
                            ? 'bg-neutral-900 text-neutral-400'
                            : 'bg-white text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        <Crown className="w-3 h-3" />
                        <span>Plataforma</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onChangePerspective('store_manager');
                          handleSelectTab('operacao');
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                          !isPlatformView
                            ? 'bg-emerald-600 text-white'
                            : isDark
                            ? 'bg-neutral-900 text-neutral-400'
                            : 'bg-white text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        <Store className="w-3 h-3" />
                        <span>Visão Loja</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-bold text-emerald-500 truncate">
                    {storeConfig.nome} ({storeConfig.cidade})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SECTION 1: OPERAÇÃO EM TEMPO REAL */}
          {(!collapsed || isMobileDrawer) && (
            <div className={sectionTitleClass}>Operação em Tempo Real</div>
          )}

          <button
            onClick={() => handleSelectTab('operacao')}
            className={`${itemBase} ${getTabClass(activeTab === 'operacao')}`}
            title="Operação do Dia (Resumo do Turno, Fila Rápida e Caixa)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutDashboard
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'operacao' ? 'text-white' : 'text-orange-400'
                }`}
              />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">Operação do Dia</span>
              )}
            </div>
          </button>

          <button
            onClick={() => handleSelectTab('pedidos')}
            className={`${itemBase} ${getTabClass(activeTab === 'pedidos')}`}
            title="Pedidos & Cozinha (KDS) + PDV Balcão"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ChefHat
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'pedidos' ? 'text-white' : 'text-amber-500'
                }`}
              />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">Pedidos &amp; KDS</span>
              )}
            </div>
            {(!collapsed || isMobileDrawer) ? (
              novosPedidosCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-neutral-950 animate-pulse">
                  {novosPedidosCount} {novosPedidosCount === 1 ? 'novo' : 'novos'}
                </span>
              ) : preparoPedidosCount > 0 ? (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'pedidos'
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {preparoPedidosCount} prep
                </span>
              ) : null
            ) : (
              novosPedidosCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              )
            )}
          </button>

          {/* SECTION 2: CATÁLOGO & ESTOQUE */}
          {(!collapsed || isMobileDrawer) && (
            <div className={sectionTitleClass}>Catálogo &amp; Estoque</div>
          )}

          <button
            onClick={() => handleSelectTab('cardapio')}
            className={`${itemBase} ${getTabClass(
              activeTab === 'cardapio' || activeTab === 'produtos'
            )}`}
            title={`Cardápio Digital (${totalProdutos} itens)`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Store
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'cardapio' || activeTab === 'produtos'
                    ? 'text-white'
                    : 'text-orange-500'
                }`}
              />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">Cardápio ({totalProdutos})</span>
              )}
            </div>
            {(!collapsed || isMobileDrawer) && esgotados > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  activeTab === 'cardapio' || activeTab === 'produtos'
                    ? 'bg-white/20 text-white'
                    : 'bg-red-500/15 text-red-400'
                }`}
              >
                {esgotados} pausados
              </span>
            )}
          </button>

          <button
            onClick={() => handleSelectTab('estoque')}
            className={`${itemBase} ${getTabClass(activeTab === 'estoque')}`}
            title="Controle de Estoque, Insumos & CMV"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Boxes
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'estoque' ? 'text-white' : 'text-cyan-500'
                }`}
              />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">Estoque &amp; CMV</span>
              )}
            </div>
          </button>

          {/* SECTION 3: GESTÃO & CRESCIMENTO */}
          {(!collapsed || isMobileDrawer) && (
            <div className={sectionTitleClass}>Gestão &amp; Resultados</div>
          )}

          <button
            onClick={() => handleSelectTab('fidelidade')}
            className={`${itemBase} ${getTabClass(activeTab === 'fidelidade')}`}
            title="CRM, Programa de Fidelidade & Cupons de Desconto"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Tag
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'fidelidade' ? 'text-white' : 'text-amber-500'
                }`}
              />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">CRM &amp; Fidelidade</span>
              )}
            </div>
          </button>

          <button
            onClick={() => handleSelectTab('financeiro')}
            className={`${itemBase} ${getTabClass(
              activeTab === 'financeiro' || activeTab === 'relatorios'
            )}`}
            title="DRE Gerencial, Curva ABC & Relatórios Financeiros"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BarChart3
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'financeiro' || activeTab === 'relatorios'
                    ? 'text-white'
                    : 'text-emerald-500'
                }`}
              />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">DRE &amp; Relatórios</span>
              )}
            </div>
          </button>

          <button
            onClick={() => handleSelectTab('loja')}
            className={`${itemBase} ${getTabClass(activeTab === 'loja')}`}
            title="Taxas de Entrega por Bairro, Horários e Dados da Loja"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Building2
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'loja' ? 'text-white' : 'text-orange-500'
                }`}
              />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">Frete &amp; Horários</span>
              )}
            </div>
          </button>

          {/* SECTION 4: PLATAFORMA & CUSTOMIZAÇÃO (SuperAdmin / Platform View) */}
          {isPlatformView && (
            <>
              {(!collapsed || isMobileDrawer) && (
                <div className={sectionTitleClass}>Plataforma &amp; Implantação</div>
              )}

              <button
                onClick={() => handleSelectTab('customizacao')}
                className={`${itemBase} ${getTabClass(activeTab === 'customizacao')}`}
                title="Configuração de Cores, Marca e Layout White-Label"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Palette
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'customizacao' ? 'text-white' : 'text-pink-500'
                    }`}
                  />
                  {(!collapsed || isMobileDrawer) && (
                    <span className="truncate">Cores &amp; Marca</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('simulador')}
                className={`${itemBase} ${getTabClass(activeTab === 'simulador')}`}
                title="Simulador Interativo da Experiência do Cliente"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Smartphone
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'simulador' ? 'text-white' : 'text-emerald-500'
                    }`}
                  />
                  {(!collapsed || isMobileDrawer) && (
                    <span className="truncate">Simulador Mobile</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('producao')}
                className={`${itemBase} ${getTabClass(activeTab === 'producao', 'emerald')}`}
                title="Implantação, QR Codes e Go-Live do Estabelecimento"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Rocket
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'producao' ? 'text-white' : 'text-emerald-400'
                    }`}
                  />
                  {(!collapsed || isMobileDrawer) && (
                    <span className="truncate">Implantação &amp; Go-Live</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('diagnostico')}
                className={`${itemBase} ${getTabClass(activeTab === 'diagnostico')}`}
                title="Diagnóstico Comercial do Catálogo"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Activity
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'diagnostico' ? 'text-white' : 'text-purple-400'
                    }`}
                  />
                  {(!collapsed || isMobileDrawer) && (
                    <span className="truncate">Diagnóstico Comercial</span>
                  )}
                </div>
              </button>
            </>
          )}

          {/* SECTION 5: FERRAMENTAS RÁPIDAS & ATALHOS OPERACIONAIS */}
          {(!collapsed || isMobileDrawer) && (
            <div className={sectionTitleClass}>Ferramentas Rápidas</div>
          )}

          <button
            onClick={() => handleTriggerAction(onOpenChecklist)}
            className={`${itemBase} ${
              isDark
                ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
            }`}
            title="Checklist Diário de Abertura do Turno"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ClipboardCheck
                className={`w-4 h-4 shrink-0 ${
                  storeConfig.cardapioConfirmadoHoje ? 'text-emerald-500' : 'text-amber-500'
                }`}
              />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">
                  {storeConfig.cardapioConfirmadoHoje ? 'Turno Confirmado' : 'Checklist Abertura'}
                </span>
              )}
            </div>
            {(!collapsed || isMobileDrawer) && !storeConfig.cardapioConfirmadoHoje && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => handleTriggerAction(onOpenKitchenReceipt)}
            className={`${itemBase} ${
              isDark
                ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
            }`}
            title="Testar ou Imprimir Comanda Térmica 80mm / 58mm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Printer className="w-4 h-4 shrink-0 text-orange-500" />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">Comanda Térmica</span>
              )}
            </div>
          </button>

          <button
            onClick={() => handleTriggerAction(onOpenPaymentModal)}
            className={`${itemBase} ${
              isDark
                ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
            }`}
            title="Configurar Chave Pix, Maquininhas e Vales"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CreditCard className="w-4 h-4 shrink-0 text-emerald-500" />
              {(!collapsed || isMobileDrawer) && (
                <span className="truncate">Pix &amp; Pagamentos</span>
              )}
            </div>
          </button>

          {isPlatformView && (
            <>
              <button
                onClick={() => handleTriggerAction(onOpenBatchPrice)}
                className={`${itemBase} ${
                  isDark
                    ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                    : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
                title="Reajustar preços em lote por categoria"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Percent className="w-4 h-4 shrink-0 text-amber-500" />
                  {(!collapsed || isMobileDrawer) && (
                    <span className="truncate">Reajuste em Lote</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleTriggerAction(onOpenSegmentModal)}
                className={`${itemBase} ${
                  isDark
                    ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                    : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
                title="Alterar Segmento Gastronômico"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="w-4 h-4 shrink-0 text-orange-500" />
                  {(!collapsed || isMobileDrawer) && (
                    <span className="truncate">Segmento ({currentSegmentConfig.nome})</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleTriggerAction(onOpenTeamModal)}
                className={`${itemBase} ${
                  isDark
                    ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                    : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
                title="Gerenciar Acessos & Vínculos de Gerentes"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="w-4 h-4 shrink-0 text-orange-500" />
                  {(!collapsed || isMobileDrawer) && (
                    <span className="truncate">Acessos &amp; Equipe</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleTriggerAction(onOpenExport)}
                className={`${itemBase} ${
                  isDark
                    ? 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                    : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
                title="Exportar Catálogo e Backup JSON"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Download className="w-4 h-4 shrink-0 text-cyan-500" />
                  {(!collapsed || isMobileDrawer) && (
                    <span className="truncate">Exportar Catálogo</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleTriggerAction(onOpenOnboarding)}
                className={`${itemBase} mt-1 ${
                  isDark
                    ? 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/30'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}
                title="Cadastrar Novo Estabelecimento na Plataforma"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sparkles className="w-4 h-4 shrink-0 text-orange-500" />
                  {(!collapsed || isMobileDrawer) && (
                    <span className="truncate">+ Novo Estabelecimento</span>
                  )}
                </div>
              </button>
            </>
          )}
        </div>

        {/* SIDEBAR FOOTER: COLLAPSE TOGGLE ON DESKTOP */}
        {!isMobileDrawer && onToggleSidebarCollapse && (
          <div
            className={`p-2.5 border-t ${
              isDark ? 'border-neutral-800/80' : 'border-neutral-200'
            }`}
          >
            <button
              onClick={onToggleSidebarCollapse}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center py-2' : 'justify-between px-3 py-2'
              } rounded-xl text-xs font-bold transition cursor-pointer ${
                isDark
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral (Modo Compacto)'}
            >
              {!collapsed && <span>Recolher Menu</span>}
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-orange-500" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-neutral-400" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* COMPACT 1-LINE TOP HEADER (56px height) */}
      <header
        className={`${
          isDark
            ? 'bg-neutral-900/95 border-neutral-800 text-white'
            : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-xs'
        } border-b sticky top-0 z-30 h-14 backdrop-blur-md transition-colors duration-200`}
      >
        <div className="h-full px-3 sm:px-5 flex items-center justify-between gap-2">
          {/* LEFT ZONE: Hamburger (Mobile) / Collapse Toggle (Desktop) + Brand + Store Switcher */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile/Tablet Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden relative p-2 rounded-xl border transition cursor-pointer ${btnSecondaryClass}`}
              aria-label="Abrir menu de navegação"
              title="Abrir Menu"
            >
              <Menu className="w-4 h-4" />
              {novosPedidosCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-neutral-900 animate-ping" />
              )}
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            {onToggleSidebarCollapse && (
              <button
                type="button"
                onClick={onToggleSidebarCollapse}
                className={`hidden lg:flex p-2 rounded-xl border transition cursor-pointer ${btnSecondaryClass}`}
                title={isSidebarCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-orange-500" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Store Brand Identity */}
            <div
              onClick={() => onTabChange('operacao')}
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
              title="Ir para Operação do Dia"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-xs font-black text-white shrink-0"
                style={{
                  backgroundColor: storeConfig.corTema || '#f97316',
                }}
              >
                {currentSegmentConfig.icone}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-black tracking-tight truncate max-w-[140px] sm:max-w-[220px]">
                    {storeConfig.nome}
                  </h1>
                  <span className="hidden md:inline-block text-[11px] text-orange-500 font-bold whitespace-nowrap">
                    · {currentSegmentConfig.nome}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Multi-Store Switcher & Perspective Toggle (for Super Admin) */}
            {isSuperAdmin && (
              <div className="hidden xl:flex items-center gap-2 ml-2 pl-2 border-l border-neutral-700/40">
                <select
                  value={activeStoreId}
                  onChange={(e) => onSelectStore && onSelectStore(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold outline-none focus:border-orange-500 cursor-pointer ${
                    isDark
                      ? 'bg-neutral-950 border-neutral-700 text-white'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                  }`}
                  title="Alternar entre os estabelecimentos cadastrados"
                >
                  {storesOptions.map((st) => {
                    const stId = st.id || 'default';
                    return (
                      <option key={stId} value={stId}>
                        {st.nome} ({st.cidade || stId})
                      </option>
                    );
                  })}
                </select>

                {onChangePerspective && (
                  <div
                    className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-800'
                        : 'bg-neutral-100 border-neutral-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onChangePerspective('platform_admin')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
                        isPlatformView
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-neutral-400 hover:text-current'
                      }`}
                      title="Modo Gerente da Plataforma"
                    >
                      <Crown className="w-3 h-3" />
                      <span>Plataforma</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangePerspective('store_manager');
                        onTabChange('operacao');
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
                        !isPlatformView
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-neutral-400 hover:text-current'
                      }`}
                      title="Visão limpa do Gerente da Loja"
                    >
                      <Store className="w-3 h-3" />
                      <span>Visão Loja</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT ZONE: Live KDS Status Pill + Open/Close Switch + New Product + Theme + User */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick KDS Counter Pill (Always visible on top bar for immediate awareness) */}
            <button
              type="button"
              onClick={() => onTabChange('pedidos')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer whitespace-nowrap ${
                novosPedidosCount > 0
                  ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm animate-pulse font-black'
                  : activeTab === 'pedidos'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : btnSecondaryClass
              }`}
              title="Abrir fila de Pedidos & Cozinha (KDS)"
            >
              <ChefHat className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">KDS</span>
              {novosPedidosCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-950 text-amber-400 font-black">
                  {novosPedidosCount} {novosPedidosCount === 1 ? 'novo' : 'novos'}
                </span>
              ) : preparoPedidosCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-400 font-black">
                  {preparoPedidosCount}
                </span>
              ) : null}
            </button>

            {/* Live Store Open/Closed Quick Toggle */}
            {onToggleStoreOpen && (
              <button
                type="button"
                onClick={onToggleStoreOpen}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-bold transition cursor-pointer whitespace-nowrap ${
                  storeConfig.aberto
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/25'
                    : 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                }`}
                title="Alternar status da loja (Aberta / Fechada)"
              >
                <Power className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {storeConfig.aberto ? 'Loja Aberta' : 'Loja Fechada'}
                </span>
              </button>
            )}

            {/* + Novo Produto CTA */}
            <button
              type="button"
              onClick={onNewProduct}
              className="px-3 py-1.5 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: storeConfig.corTema || '#f97316',
              }}
              title="Cadastrar novo produto no cardápio"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Produto</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleAdminTheme}
              className={`p-2 rounded-xl border transition cursor-pointer ${btnSecondaryClass}`}
              title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-neutral-700" />
              )}
            </button>

            {/* User Auth Button */}
            {user ? (
              <button
                type="button"
                onClick={onOpenTeamModal}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-bold transition cursor-pointer whitespace-nowrap ${btnSecondaryClass}`}
                title={`Conectado como ${user.email}. Clique para gerenciar acessos.`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span className="hidden xl:inline truncate max-w-[100px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={signIn}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 font-bold transition cursor-pointer whitespace-nowrap"
                title="Entrar com Conta Google"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* DESKTOP FIXED COLLAPSIBLE LEFT SIDEBAR (lg+) */}
      <aside
        className={`hidden lg:flex flex-col fixed top-14 bottom-0 left-0 z-20 border-r transition-all duration-200 ${
          isSidebarCollapsed ? 'w-[68px]' : 'w-64'
        } ${
          isDark
            ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-xs'
        }`}
      >
        {renderSidebarContent(isSidebarCollapsed, false)}
      </aside>

      {/* MOBILE & TABLET SLIDE-OVER HAMBURGER DRAWER (< lg) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-over panel */}
          <div
            className={`relative w-72 max-w-[85vw] h-full flex flex-col border-r shadow-2xl z-10 ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 text-white'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            {/* Drawer Header */}
            <div
              className={`h-14 px-4 flex items-center justify-between border-b ${
                isDark ? 'border-neutral-800' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
                  style={{ backgroundColor: storeConfig.corTema || '#f97316' }}
                >
                  {currentSegmentConfig.icone}
                </div>
                <span className="font-black text-sm truncate">{storeConfig.nome}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-1.5 rounded-lg border cursor-pointer ${btnSecondaryClass}`}
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Navigation & Tools */}
            <div className="flex-1 overflow-y-auto">
              {renderSidebarContent(false, true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
