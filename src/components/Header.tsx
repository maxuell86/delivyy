import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
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
}) => {
  const { toggleAdminTheme, isDark } = useTheme();
  const { user, isSuperAdmin, assignedStoreId, signIn } = useAuth();
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

  return (
    <header
      className={`${
        isDark
          ? 'bg-neutral-900/95 border-neutral-800 text-white'
          : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-sm'
      } border-b sticky top-0 z-30 backdrop-blur-md transition-colors duration-200`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TOP GOVERNANCE & MULTI-STORE BAR */}
        <div
          className={`py-2.5 flex flex-wrap items-center justify-between gap-3 border-b ${
            isDark ? 'border-neutral-800/60' : 'border-neutral-200'
          } text-xs`}
        >
          {/* Left Zone: Store Context / Multi-Store Switcher (for Platform Admin) or Bound Store Indicator (for Store Manager) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isSuperAdmin ? (
              <>
                {/* Platform Manager Multi-Store Selector */}
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="font-bold text-neutral-400 hidden sm:inline">Estabelecimento:</span>
                  <select
                    value={activeStoreId}
                    onChange={(e) => onSelectStore && onSelectStore(e.target.value)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold outline-none focus:border-orange-500 cursor-pointer ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-700 text-white'
                        : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    }`}
                    title="Alternar entre os estabelecimentos cadastrados na plataforma"
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

                {/* Perspective Switcher: Platform Admin vs Store Manager View */}
                {onChangePerspective && (
                  <div
                    className={`flex items-center gap-1 p-0.5 rounded-lg border ${
                      isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChangePerspective('platform_admin');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                        isPlatformView
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-neutral-400 hover:text-current'
                      }`}
                      title="Modo Gerente da Plataforma: Todas as configurações técnicas, cores, segmentos e acessos"
                    >
                      <Crown className="w-3 h-3" />
                      <span>Gerente Plataforma</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangePerspective('store_manager');
                        onTabChange('operacao');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                        !isPlatformView
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-neutral-400 hover:text-current'
                      }`}
                      title="Simular a visão limpa e operacional que o Gerente do Estabelecimento vê no dia a dia"
                    >
                      <Store className="w-3 h-3" />
                      <span>Visão Gerente da Loja</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Bound Store Manager Badge */
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-bold text-emerald-500">
                  Acesso Exclusivo: {storeConfig.nome}
                </span>
                <span aria-hidden="true" className="text-neutral-500">·</span>
                <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                  {currentSegmentConfig.nome} ({storeConfig.cidade})
                </span>
              </div>
            )}
          </div>

          {/* Right Zone: User Login, Theme & Role-Aware Quick Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* User Auth Button */}
            {user ? (
              <button
                onClick={onOpenTeamModal}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer whitespace-nowrap ${btnSecondaryClass}`}
                title={`Conectado como ${user.email}. Clique para ver detalhes do acesso.`}
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
                <span className="hidden sm:inline truncate max-w-[130px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-orange-500 font-black">
                  {isSuperAdmin ? 'PLATAFORMA' : assignedStoreId ? 'LOJA VINCULADA' : 'GERENTE'}
                </span>
              </button>
            ) : (
              <button
                onClick={signIn}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 font-bold transition cursor-pointer whitespace-nowrap"
                title="Entrar com Conta Google vinculada ao estabelecimento"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar com Login da Loja</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleAdminTheme}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer whitespace-nowrap ${btnSecondaryClass}`}
              title="Alternar tema claro/escuro"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-neutral-700" />
              )}
              <span className="hidden md:inline">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            {/* Platform-Only Onboarding Wizard */}
            {isPlatformView && (
              <button
                onClick={onOpenOnboarding}
                className="flex items-center gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg font-bold shadow-xs transition cursor-pointer whitespace-nowrap"
                title="Cadastrar novo estabelecimento cliente e vincular login do gerente"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Novo Estabelecimento</span>
              </button>
            )}

            {/* Live Store Open/Closed Quick Toggle for Store Manager */}
            {!isPlatformView && onToggleStoreOpen && (
              <button
                onClick={onToggleStoreOpen}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer whitespace-nowrap ${
                  storeConfig.aberto
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                    : 'bg-red-500/15 border-red-500/30 text-red-400'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{storeConfig.aberto ? 'Loja Aberta' : 'Loja Fechada'}</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN HEADER IDENTITY & CONTEXTUAL ACTIONS */}
        <div className="py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs font-black text-white shrink-0"
              style={{
                backgroundColor: storeConfig.corTema || '#f97316',
              }}
            >
              {currentSegmentConfig.icone}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className={`text-xl sm:text-2xl font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {storeConfig.nome}
                </h1>
                <span className="text-xs text-orange-500 font-bold">
                  · {currentSegmentConfig.nome}
                </span>
                {!isPlatformView && (
                  <span className="text-xs text-emerald-500 font-bold">
                    · Painel Operacional do Gerente
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {isPlatformView
                  ? `${storeConfig.slogan} • Administração Global da Plataforma & Configurações do Cliente`
                  : `${storeConfig.slogan} • Gestão de Turno, Fila de Pedidos, Pausas e Caixa`}
              </p>
            </div>
          </div>

          {/* Contextual Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isPlatformView ? (
              /* PLATFORM MANAGER CONFIGURATION BUTTONS */
              <>
                <button
                  onClick={onOpenSegmentModal}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${btnSecondaryClass}`}
                  title="Alterar nicho gastronômico deste estabelecimento"
                >
                  <Building2 className="w-3.5 h-3.5 text-orange-500" />
                  <span>Segmento</span>
                </button>

                <button
                  onClick={onOpenPaymentModal}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${btnSecondaryClass}`}
                  title="Configurar Pix direto, maquininha na entrega e vales refeição"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Pix &amp; Pagamentos</span>
                </button>

                <button
                  onClick={onOpenBatchPrice}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${btnSecondaryClass}`}
                  title="Ajustar preços em lote por categoria"
                >
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                  <span>Reajuste Lote</span>
                </button>

                <button
                  onClick={onOpenTeamModal}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${btnSecondaryClass}`}
                  title="Vincular logins de gerentes e equipe a cada estabelecimento"
                >
                  <Users className="w-3.5 h-3.5 text-orange-500" />
                  <span>Acessos &amp; Vínculos</span>
                </button>

                <button
                  onClick={onOpenExport}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${btnSecondaryClass}`}
                  title="Exportar catálogo e configurações"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Exportar</span>
                </button>
              </>
            ) : (
              /* STORE MANAGER FOCUSED OPERATIONAL BUTTONS */
              <>
                <button
                  onClick={onOpenKitchenReceipt}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${btnSecondaryClass}`}
                >
                  <Printer className="w-3.5 h-3.5 text-orange-500" />
                  <span>Comanda Térmica</span>
                </button>

                <button
                  onClick={onOpenChecklist}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                    storeConfig.cardapioConfirmadoHoje
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>
                    {storeConfig.cardapioConfirmadoHoje ? 'Turno Confirmado' : 'Checklist de Abertura'}
                  </span>
                </button>
              </>
            )}

            <button
              onClick={onNewProduct}
              className="px-4 py-1.5 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: storeConfig.corTema || '#f97316',
              }}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Novo Produto</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS: SEPARATED BY ROLE PERSPECTIVE */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 scrollbar-none text-xs sm:text-sm">
          {/* TAB 0: OPERAÇÃO DO TURNO (Destaque principal na Visão do Gerente do Estabelecimento) */}
          <button
            onClick={() => onTabChange('operacao')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'operacao'
                ? 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'bg-neutral-800/70 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-orange-400" />
            <span>Operação do Dia</span>
          </button>

          {/* TAB 1: PEDIDOS & COZINHA (KDS) */}
          <button
            onClick={() => onTabChange('pedidos')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'pedidos'
                ? 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'bg-neutral-800/70 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-500" />
            <span>Pedidos &amp; Cozinha (KDS)</span>
            {novosPedidosCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-neutral-950 animate-pulse">
                {novosPedidosCount} {novosPedidosCount === 1 ? 'novo' : 'novos'}
              </span>
            ) : preparoPedidosCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {preparoPedidosCount} preparo
              </span>
            ) : null}
          </button>

          {/* TAB 2: CARDÁPIO */}
          <button
            onClick={() => onTabChange('cardapio')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'cardapio' || activeTab === 'produtos'
                ? 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'bg-neutral-800/70 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80'
            }`}
          >
            <span>Cardápio ({totalProdutos})</span>
            {esgotados > 0 && (
              <span className="text-[11px] text-red-400 font-bold">
                · {esgotados} pausados
              </span>
            )}
          </button>

          {/* TAB 3: ESTOQUE */}
          <button
            onClick={() => onTabChange('estoque')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'estoque'
                ? 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'bg-neutral-800/70 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-cyan-500" />
            <span>Estoque</span>
          </button>

          {/* TAB 4: CRM, FIDELIDADE & CUPONS */}
          <button
            onClick={() => onTabChange('fidelidade')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'fidelidade'
                ? 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'bg-neutral-800/70 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>CRM &amp; Fidelidade</span>
          </button>

          {/* TAB 5: FINANCEIRO, DRE & CURVA ABC */}
          <button
            onClick={() => onTabChange('financeiro')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'financeiro' || activeTab === 'relatorios'
                ? 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'bg-neutral-800/70 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>DRE &amp; Relatórios</span>
          </button>

          {/* TAB 6: FRETE POR BAIRRO & HORÁRIOS DA LOJA */}
          <button
            onClick={() => onTabChange('loja')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'loja'
                ? 'bg-orange-500 text-white shadow-xs'
                : isDark
                ? 'bg-neutral-800/70 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-orange-500" />
            <span>Frete por Bairro &amp; Loja</span>
          </button>

          {/* PLATFORM MANAGER EXCLUSIVE CONFIGURATION TABS */}
          {isPlatformView && (
            <>
              <button
                onClick={() => onTabChange('customizacao')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'customizacao'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : isDark
                    ? 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-pink-500" />
                <span>Config. Cores &amp; Marca</span>
              </button>

              <button
                onClick={() => onTabChange('simulador')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'simulador'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : isDark
                    ? 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Simulador</span>
              </button>

              <button
                onClick={() => onTabChange('producao')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'producao'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-neutral-800/70 text-emerald-400 hover:text-white hover:bg-neutral-800'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Implantação &amp; Go-Live</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};


