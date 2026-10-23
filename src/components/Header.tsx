import React from 'react';
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
  Award,
  Rocket,
  BarChart3,
  Boxes,
  ChefHat,
  Palette,
  DollarSign,
  CreditCard,
  Sun,
  Moon,
  Printer,
  Users,
  Cloud,
  ShieldCheck,
  LogIn
} from 'lucide-react';
import { StoreConfig, Product, SegmentConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export type AppTab = 
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
}) => {
  const { toggleAdminTheme, isDark } = useTheme();
  const { user, isAdmin, isSuperAdmin, signIn } = useAuth();
  const totalProdutos = products.length;
  const disponiveis = products.filter((p) => p.disponivel).length;
  const esgotados = totalProdutos - disponiveis;

  const btnSecondaryClass = isDark
    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300 shadow-xs';

  return (
    <header className={`${isDark ? 'bg-neutral-900/95 border-neutral-800 text-white' : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-sm'} border-b sticky top-0 z-30 shadow-lg backdrop-blur-md transition-colors duration-200`}>
      {/* Top Banner with Store Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`py-2.5 flex flex-wrap items-center justify-between gap-3 border-b ${isDark ? 'border-neutral-800/60' : 'border-neutral-200'} text-xs sm:text-sm`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSegmentModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-black border border-orange-500/20 text-xs transition"
              title="Clique para alternar o nicho (Pizzaria, Lanchonete, Restaurante, Confeitaria, etc.)"
            >
              <span>{currentSegmentConfig.icone}</span>
              <span>{currentSegmentConfig.nome}</span>
              <span className="text-[10px] text-orange-500/70">▾</span>
            </button>
            <span className={`hidden md:inline ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {storeConfig.nome} • {storeConfig.cidade}
            </span>

            {/* Cloud Real-Time Indicator */}
            <button
              onClick={onOpenTeamModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
              title="Sincronização em Nuvem ativa via Firebase Firestore. Clique para gerenciar a equipe."
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuvem Firestore</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* User Auth Chip or Sign-in button */}
            {user ? (
              <button
                onClick={onOpenTeamModal}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-bold transition ${btnSecondaryClass}`}
                title={`Conectado como ${user.email}. Clique para gerenciar equipe.`}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-4 h-4 rounded-full" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-orange-500 font-black">
                  {isSuperAdmin ? 'SUPER' : 'ADMIN'}
                </span>
              </button>
            ) : (
              <button
                onClick={signIn}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 font-bold transition"
                title="Entrar com Conta Google de Administrador"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar (Admin)</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Quick Dark/Light Mode Switcher */}
            <button
              onClick={toggleAdminTheme}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-bold transition active:scale-95 ${
                isDark 
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-neutral-700' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
              }`}
              title={isDark ? 'Alternar para Modo Claro (Ideal para luz do dia)' : 'Alternar para Modo Escuro (Ideal para noite e telas de cozinha)'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-800" />}
              <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            <button
              onClick={onOpenOnboarding}
              className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3 py-1 rounded-lg font-bold shadow-md shadow-orange-500/20 transition active:scale-95"
              title="Abrir assistente guiado para configurar novo restaurante"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Configurar Novo Restaurante</span>
              <span className="sm:hidden">Novo Restaurante</span>
            </button>

            <button
              onClick={onOpenKitchenReceipt}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition font-medium ${btnSecondaryClass}`}
              title="Visualizar e imprimir comanda térmica para impressora da cozinha"
            >
              <Printer className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">Imprimir Comanda</span>
              <span className="sm:hidden">Comanda</span>
            </button>

            {storeConfig.cardapioConfirmadoHoje ? (
              <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cardápio Confirmado</span>
                <span className="sm:hidden">Confirmado</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-semibold text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Pendente</span>
              </span>
            )}

            <button
              onClick={onOpenChecklist}
              className="flex items-center gap-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition font-bold"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Confirmar</span>
            </button>
          </div>
        </div>

        {/* Main Header Content */}
        <div className="py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md font-black"
                style={{
                  background: `linear-gradient(135deg, ${storeConfig.corTema || '#f97316'} 0%, #ea580c 100%)`,
                }}
              >
                {currentSegmentConfig.icone}
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {storeConfig.nome}
                  <span 
                    className="text-xs font-semibold px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: `${storeConfig.corTema || '#f97316'}20`,
                      color: storeConfig.corTema || '#f97316',
                      borderColor: `${storeConfig.corTema || '#f97316'}40`,
                    }}
                  >
                    {currentSegmentConfig.nome}
                  </span>
                </h1>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {storeConfig.slogan} • Painel de Gestão &amp; Departamentos
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenPaymentModal}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${btnSecondaryClass}`}
              title="Configurar Pix direto, maquininha na entrega e vales refeição"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
              <span>Pix &amp; Pagamentos</span>
            </button>

            <button
              onClick={onOpenBatchPrice}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${btnSecondaryClass}`}
              title="Ajustar preços de uma categoria ou porcentagem"
            >
              <Percent className="w-3.5 h-3.5 text-amber-500" />
              <span>Ajustar Preços</span>
            </button>

            <button
              onClick={onOpenExport}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${btnSecondaryClass}`}
              title="Exportar produtos.json ou config.js para seu projeto"
            >
              <Download className="w-3.5 h-3.5 text-cyan-500" />
              <span>Exportar</span>
            </button>

            <button
              onClick={onOpenTeamModal}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${btnSecondaryClass}`}
              title="Gerenciar múltiplos administradores, equipe e permissões no Firebase"
            >
              <Users className="w-3.5 h-3.5 text-orange-500" />
              <span>Equipe &amp; Admins</span>
            </button>

            <button
              onClick={onNewProduct}
              className="px-4 py-1.5 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${storeConfig.corTema || '#f97316'} 0%, #ea580c 100%)`,
              }}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Novo Item</span>
            </button>
          </div>
        </div>

        {/* Clean Department Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 scrollbar-none text-xs sm:text-sm">
          {/* DEP 1: CARDÁPIO */}
          <button
            onClick={() => onTabChange('cardapio')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'cardapio' || activeTab === 'produtos'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : (isDark ? 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80 shadow-xs')
            }`}
          >
            <span>🍔 Cardápio ({totalProdutos})</span>
            {esgotados > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/30 text-red-300 font-bold border border-red-500/40">
                {esgotados} pausados
              </span>
            )}
          </button>

          {/* DEP 2: PEDIDOS & KDS */}
          <button
            onClick={() => onTabChange('pedidos')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'pedidos'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : (isDark ? 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80 shadow-xs')
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-500" />
            <span>🛎️ Pedidos &amp; Cozinha</span>
          </button>

          {/* DEP 3: ESTOQUE */}
          <button
            onClick={() => onTabChange('estoque')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'estoque'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : (isDark ? 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80 shadow-xs')
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-cyan-500" />
            <span>📦 Estoque</span>
          </button>

          {/* DEP 4: FINANCEIRO & VENDAS */}
          <button
            onClick={() => onTabChange('financeiro')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'financeiro' || activeTab === 'relatorios'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : (isDark ? 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80 shadow-xs')
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>💰 Financeiro &amp; Relatórios</span>
          </button>

          {/* DEP 5: CUSTOMIZAÇÃO & CORES */}
          <button
            onClick={() => onTabChange('customizacao')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'customizacao'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : (isDark ? 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80 shadow-xs')
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-pink-500" />
            <span>🎨 Cores &amp; Marca</span>
          </button>

          {/* DEP 6: LOJA & HORÁRIOS */}
          <button
            onClick={() => onTabChange('loja')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'loja'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : (isDark ? 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80 shadow-xs')
            }`}
          >
            <Store className="w-3.5 h-3.5 text-orange-500" />
            <span>🏪 Loja &amp; Frete</span>
          </button>

          {/* DEP 7: SIMULADOR MOBILE DO CLIENTE */}
          <button
            onClick={() => onTabChange('simulador')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'simulador'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : (isDark ? 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 border border-neutral-200/80 shadow-xs')
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            <span>📱 Simulador do Cliente</span>
          </button>

          {/* DEP 8: COLOCAR EM PRODUÇÃO */}
          <button
            onClick={() => onTabChange('producao')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'producao'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : (isDark ? 'bg-neutral-800/70 text-emerald-400 hover:text-white hover:bg-neutral-800' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 shadow-xs')
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>🚀 Produção</span>
          </button>
        </div>
      </div>
    </header>
  );
};

