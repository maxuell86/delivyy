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
  CreditCard,
  Printer,
  Award,
  Rocket,
  BarChart3
} from 'lucide-react';
import { StoreConfig, Product, SegmentConfig } from '../types';

export type AppTab = 'produtos' | 'loja' | 'fidelidade' | 'relatorios' | 'simulador' | 'producao' | 'diagnostico' | 'checklist';

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
}) => {
  const totalProdutos = products.length;
  const disponiveis = products.filter((p) => p.disponivel).length;
  const esgotados = totalProdutos - disponiveis;

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-30 shadow-lg backdrop-blur-md bg-neutral-900/95">
      {/* Top Banner with Store Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/60 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSegmentModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-black border border-orange-500/20 text-xs transition"
              title="Clique para alternar o nicho (Pizzaria, Lanchonete, Restaurante, Confeitaria, etc.)"
            >
              <span>{currentSegmentConfig.icone}</span>
              <span>{currentSegmentConfig.nome}</span>
              <span className="text-[10px] text-orange-400/70">▾</span>
            </button>
            <span className="hidden md:inline text-neutral-400">
              {storeConfig.nome} • {storeConfig.cidade}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSegmentModal}
              className="flex items-center gap-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded-lg border border-neutral-700 transition font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Mudar Nicho</span>
            </button>

            <button
              onClick={onOpenKitchenReceipt}
              className="flex items-center gap-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded-lg border border-neutral-700 transition font-medium"
              title="Visualizar e imprimir comanda térmica para impressora da cozinha"
            >
              <Printer className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Imprimir Comanda</span>
              <span className="sm:hidden">Comanda</span>
            </button>

            {storeConfig.cardapioConfirmadoHoje ? (
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cardápio Confirmado Hoje</span>
                <span className="sm:hidden">Confirmado</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-semibold text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Pendente</span>
              </span>
            )}

            <button
              onClick={onOpenChecklist}
              className="flex items-center gap-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition font-bold"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confirmar Cardápio</span>
            </button>
          </div>
        </div>

        {/* Main Header Content */}
        <div className="py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xl shadow-md shadow-orange-500/20 font-black">
                {currentSegmentConfig.icone}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  {storeConfig.nome}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    SaaS Multi-Segmento
                  </span>
                </h1>
                <p className="text-xs text-neutral-400">
                  {storeConfig.slogan} • Delivery e Cardápio Digital Completo
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenPaymentModal}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition"
              title="Configurar Pix direto, maquininha na entrega e vales refeição"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pagamentos &amp; Pix</span>
            </button>

            <button
              onClick={onOpenBatchPrice}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition"
              title="Ajustar preços de uma categoria ou porcentagem"
            >
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>Preços</span>
            </button>

            <button
              onClick={onOpenExport}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition"
              title="Exportar produtos.json ou config.js para seu projeto"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar</span>
            </button>

            <button
              onClick={onNewProduct}
              className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Novo Item</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => onTabChange('produtos')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'produtos'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <span>📋 Cardápio &amp; Produtos ({totalProdutos})</span>
            {esgotados > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/30 text-red-300 font-bold border border-red-500/40">
                {esgotados} pausados
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('loja')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'loja'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-orange-400" />
            <span>🏪 Loja, Horários &amp; Frete</span>
          </button>

          <button
            onClick={() => onTabChange('fidelidade')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'fidelidade'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>⭐ Fidelidade &amp; Cupons</span>
          </button>

          <button
            onClick={() => onTabChange('relatorios')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'relatorios'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>📈 Relatórios &amp; Vendas</span>
          </button>

          <button
            onClick={() => onTabChange('simulador')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'simulador'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Ver como o Cliente Vê</span>
          </button>

          <button
            onClick={() => onTabChange('producao')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'producao'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-neutral-800/70 text-emerald-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>🚀 Colocar em Produção</span>
          </button>

          <button
            onClick={() => onTabChange('diagnostico')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'diagnostico'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>📊 Modelo Comercial SaaS</span>
          </button>
        </div>
      </div>
    </header>
  );
};

