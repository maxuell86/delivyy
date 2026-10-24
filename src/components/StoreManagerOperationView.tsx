import React, { useState, useEffect } from 'react';
import {
  Power,
  Clock,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Search,
  Copy,
  Check,
  ExternalLink,
  ClipboardCheck,
  Printer,
  ShoppingBag,
  TrendingUp,
  Lock,
  PlusCircle,
  Bike,
  Utensils,
} from 'lucide-react';
import { Product, StoreConfig, Order, CategoryId } from '../types';
import { CATEGORIAS_POR_SEGMENTO } from '../data/segmentData';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { subscribeToOrders } from '../services/firestoreSync';

interface StoreManagerOperationViewProps {
  storeId: string;
  storeConfig: StoreConfig;
  products: Product[];
  onSaveConfig: (config: StoreConfig) => void;
  onToggleDisponivel: (productId: string) => void;
  onNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onOpenKds: () => void;
  onOpenChecklist: () => void;
  onOpenKitchenReceipt: () => void;
  onOpenPublicStorefront: () => void;
  showToast: (msg: string) => void;
}

const DELIVERY_TIME_PRESETS = [
  { label: '25-35 min', desc: 'Fluxo Rápido' },
  { label: '35-50 min', desc: 'Fluxo Normal' },
  { label: '50-70 min', desc: 'Horário de Pico' },
  { label: '60-90 min', desc: 'Alta Demanda / Chuva' },
];

export const StoreManagerOperationView: React.FC<StoreManagerOperationViewProps> = ({
  storeId,
  storeConfig,
  products,
  onSaveConfig,
  onToggleDisponivel,
  onNewProduct,
  onEditProduct,
  onOpenKds,
  onOpenChecklist,
  onOpenKitchenReceipt,
  onOpenPublicStorefront,
  showToast,
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [quickSearch, setQuickSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<'todos' | 'esgotados' | 'ativos'>('todos');
  const [selectedCat, setSelectedCat] = useState<CategoryId | 'todos'>('todos');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const currentSegment = storeConfig.segmento || 'hamburgueria';
  const categorias = CATEGORIAS_POR_SEGMENTO[currentSegment] || CATEGORIAS_POR_SEGMENTO.hamburgueria;

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (orders) => {
        setLiveOrders(orders);
      },
      undefined,
      storeId
    );
    return () => unsubscribe();
  }, [storeId]);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maxdelivery.app';
  const storeMenuUrl =
    storeId && storeId !== 'default'
      ? `${originUrl}/?modo=cardapio&loja=${encodeURIComponent(storeId)}`
      : `${originUrl}/?modo=cardapio`;

  const handleCopyMenuUrl = () => {
    navigator.clipboard.writeText(storeMenuUrl);
    setCopiedUrl(true);
    showToast('Link do cardápio copiado para compartilhar com clientes!');
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleToggleStoreOpen = () => {
    const updated: StoreConfig = {
      ...storeConfig,
      aberto: !storeConfig.aberto,
    };
    onSaveConfig(updated);
    showToast(
      updated.aberto
        ? `Estabelecimento "${storeConfig.nome}" ABERTO para pedidos online!`
        : `Estabelecimento "${storeConfig.nome}" PAUSADO para novos pedidos.`
    );
  };

  const handleChangeDeliveryTime = (tempo: string) => {
    const updated: StoreConfig = {
      ...storeConfig,
      tempoEntrega: tempo,
    };
    onSaveConfig(updated);
    showToast(`Tempo estimado de entrega atualizado para ${tempo}!`);
  };

  // Metrics calculation
  const pedidosRecebidos = liveOrders.filter((o) => o.status === 'recebido').length;
  const pedidosPreparo = liveOrders.filter((o) => o.status === 'preparo').length;
  const pedidosRota = liveOrders.filter((o) => o.status === 'rota').length;
  const pedidosConcluidos = liveOrders.filter((o) => o.status === 'concluido').length;
  const pedidosAtivos = pedidosRecebidos + pedidosPreparo + pedidosRota;

  const faturamentoTurno = liveOrders
    .filter((o) => o.status !== 'cancelado')
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  const produtosDisponiveis = products.filter((p) => p.disponivel).length;
  const produtosPausados = products.length - produtosDisponiveis;

  const filteredQuickProducts = products.filter((p) => {
    const matchCat = selectedCat === 'todos' || p.categoria === selectedCat;
    const matchSearch = p.nome.toLowerCase().includes(quickSearch.toLowerCase());
    const matchState =
      quickFilter === 'todos' ? true : quickFilter === 'esgotados' ? !p.disponivel : p.disponivel;
    return matchCat && matchSearch && matchState;
  });

  const surfaceClass = isDark
    ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
    : 'bg-white border-neutral-200 text-neutral-900 shadow-xs';

  const subtleSurfaceClass = isDark
    ? 'bg-neutral-950 border-neutral-800 text-neutral-200'
    : 'bg-neutral-50 border-neutral-200 text-neutral-800';

  return (
    <div className="space-y-6 pb-10">
      {/* BARRA DE IDENTIFICAÇÃO DO ESTABELECIMENTO & CONTROLE DE TURNO */}
      <div className={`border rounded-2xl p-5 sm:p-6 ${surfaceClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <span className="font-semibold text-orange-500">Painel Operacional do Gerente</span>
              <span aria-hidden="true">·</span>
              <span>Unidade: {storeConfig.nome}</span>
              <span aria-hidden="true">·</span>
              <span>{storeConfig.cidade}</span>
              {user?.email && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Acesso vinculado: {user.email}</span>
                </>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Operação Diária — {storeConfig.nome}
            </h2>

            <p className={`text-sm max-w-2xl ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Gerencie o funcionamento do turno em tempo real: abertura e fechamento da loja, tempo de espera para
              clientes, fila da cozinha e disponibilidade imediata dos itens do cardápio.
            </p>
          </div>

          {/* 1-Click Open / Close Store Control */}
          <div className={`p-4 rounded-xl border min-w-[280px] flex flex-col gap-3 ${subtleSurfaceClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400">Recebimento de Pedidos</span>
              <span
                className={`text-xs font-black ${
                  storeConfig.aberto ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {storeConfig.aberto ? 'LOJA ABERTA' : 'LOJA FECHADA'}
              </span>
            </div>

            <button
              onClick={handleToggleStoreOpen}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
                storeConfig.aberto
                  ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {storeConfig.aberto ? 'Pausar / Fechar Loja Agora' : 'Abrir Loja para Receber Pedidos'}
              </span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/40">
              <span>Horário padrão: {storeConfig.horarioFuncionamento}</span>
            </div>
          </div>
        </div>

        {/* QUICK OPERATIONAL CONTROLS BAR: DELIVERY TIME & DAILY CHECKLIST */}
        <div className={`mt-6 pt-5 border-t grid grid-cols-1 lg:grid-cols-12 gap-4 items-center ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
          {/* Delivery Time Selector */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold">Tempo de Espera Atual:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DELIVERY_TIME_PRESETS.map((preset) => {
                const isSelected = storeConfig.tempoEntrega === preset.label;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handleChangeDeliveryTime(preset.label)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500'
                        : isDark
                        ? 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                    }`}
                    title={preset.desc}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Operational Actions */}
          <div className="lg:col-span-5 flex flex-wrap items-center justify-start lg:justify-end gap-2">
            <button
              onClick={onOpenChecklist}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                storeConfig.cardapioConfirmadoHoje
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-500'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>
                {storeConfig.cardapioConfirmadoHoje ? 'Checklist do Dia Confirmado' : 'Confirmar Abertura do Dia'}
              </span>
            </button>

            <button
              onClick={onOpenKitchenReceipt}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${subtleSurfaceClass}`}
            >
              <Printer className="w-4 h-4 text-orange-500" />
              <span>Testar Impressora</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI GRID: FILA DE PEDIDOS AO VIVO & RESUMO DO TURNO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pedidos Aguardando Aceite / Na Cozinha */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between ${surfaceClass}`}>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold">Fila Ativa na Cozinha</span>
            <ChefHat className="w-4 h-4 text-orange-500" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono tabular-nums">
              {pedidosAtivos}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1 font-mono tabular-nums">
              <span className={pedidosRecebidos > 0 ? 'text-amber-500 font-bold' : ''}>
                {pedidosRecebidos} novos
              </span>
              <span aria-hidden="true">·</span>
              <span>{pedidosPreparo} preparo</span>
              <span aria-hidden="true">·</span>
              <span>{pedidosRota} entrega</span>
            </div>
          </div>
          <button
            onClick={onOpenKds}
            className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <span>Abrir Monitor de Pedidos (KDS)</span>
          </button>
        </div>

        {/* Card 2: Vendas do Turno */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between ${surfaceClass}`}>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold">Vendas Registradas no Turno</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono tabular-nums text-emerald-500">
              R$ {faturamentoTurno.toFixed(2).replace('.', ',')}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1 font-mono tabular-nums">
              <span>{liveOrders.length} pedidos totais</span>
              <span aria-hidden="true">·</span>
              <span>{pedidosConcluidos} concluídos</span>
            </div>
          </div>
          <div className="text-xs text-neutral-400 font-mono tabular-nums">
            Ticket Médio: R${' '}
            {liveOrders.length > 0
              ? (faturamentoTurno / liveOrders.length).toFixed(2).replace('.', ',')
              : '0,00'}
          </div>
        </div>

        {/* Card 3: Disponibilidade do Cardápio */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between ${surfaceClass}`}>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold">Itens do Cardápio</span>
            <Utensils className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono tabular-nums">
              {produtosDisponiveis} <span className="text-sm font-normal text-neutral-400">/ {products.length} ativos</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1 font-mono tabular-nums">
              {produtosPausados > 0 ? (
                <span className="text-red-400 font-semibold">
                  {produtosPausados} item(ns) pausado(s) hoje
                </span>
              ) : (
                <span className="text-emerald-500 font-semibold">
                  100% do cardápio disponível
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onNewProduct}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${subtleSurfaceClass}`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-orange-500" />
            <span>Cadastrar Novo Produto</span>
          </button>
        </div>

        {/* Card 4: Link Direto do Cardápio do Estabelecimento */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between ${surfaceClass}`}>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold">Link do Cardápio Digital</span>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-3">
            <p className="text-xs text-neutral-400 mb-1.5">
              Envie aos clientes no WhatsApp ou fixe na bio do Instagram:
            </p>
            <div className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono truncate ${subtleSurfaceClass}`}>
              {storeMenuUrl}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyMenuUrl}
              className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
            <button
              onClick={onOpenPublicStorefront}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${subtleSurfaceClass}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Loja</span>
            </button>
          </div>
        </div>
      </div>

      {/* CENTRAL DE PAUSA RÁPIDA DE PRODUTOS (CONTROLE DE ESGOTADOS EM 1 CLIQUE) */}
      <div className={`border rounded-2xl p-5 sm:p-6 space-y-4 ${surfaceClass}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black">
              Controle Rápido de Disponibilidade (Pausar / Ativar Itens)
            </h3>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Acabou algum ingrediente na cozinha? Pause ou reative o item com 1 clique. O cardápio dos clientes é atualizado na mesma hora.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Buscar produto ou bebida..."
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs outline-none focus:border-orange-500 ${subtleSurfaceClass}`}
              />
            </div>

            {/* State Filter */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-bold ${subtleSurfaceClass}`}>
              <button
                onClick={() => setQuickFilter('todos')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  quickFilter === 'todos' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-current'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => setQuickFilter('ativos')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  quickFilter === 'ativos' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-current'
                }`}
              >
                Ativos ({produtosDisponiveis})
              </button>
              <button
                onClick={() => setQuickFilter('esgotados')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  quickFilter === 'esgotados' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-current'
                }`}
              >
                Pausados ({produtosPausados})
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCat('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap shrink-0 ${
              selectedCat === 'todos'
                ? 'bg-orange-500 text-white border-orange-500'
                : subtleSurfaceClass
            }`}
          >
            Todas as Categorias
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCat === c.id
                  ? 'bg-orange-500 text-white border-orange-500'
                  : subtleSurfaceClass
              }`}
            >
              {c.icone} {c.nome}
            </button>
          ))}
        </div>

        {/* Compact High-Density Operational Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredQuickProducts.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                item.disponivel
                  ? subtleSurfaceClass
                  : isDark
                  ? 'bg-red-950/20 border-red-900/40 text-neutral-400'
                  : 'bg-red-50/60 border-red-200 text-neutral-500'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={item.foto}
                  alt={item.nome}
                  referrerPolicy="no-referrer"
                  className={`w-11 h-11 rounded-lg object-cover shrink-0 ${
                    !item.disponivel ? 'grayscale opacity-60' : ''
                  }`}
                />
                <div className="min-w-0">
                  <button
                    onClick={() => onEditProduct(item)}
                    className="text-xs font-bold truncate block text-left hover:text-orange-500 transition"
                    title="Clique para editar preço ou detalhes"
                  >
                    {item.nome}
                  </button>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
                    <span className="text-emerald-500 font-bold">
                      R$ {item.preco.toFixed(2).replace('.', ',')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate capitalize">{item.categoria}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onToggleDisponivel(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 border ${
                  item.disponivel
                    ? 'bg-emerald-500/15 hover:bg-red-500/20 text-emerald-500 hover:text-red-400 border-emerald-500/30'
                    : 'bg-red-500/20 hover:bg-emerald-500/20 text-red-400 hover:text-emerald-400 border-red-500/30'
                }`}
              >
                {item.disponivel ? 'Ativo no Cardápio' : 'Esgotado (Ativar)'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RODAPÉ INFORMATIVO DE GOVERNANÇA DA PLATAFORMA */}
      <div className={`border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${subtleSurfaceClass}`}>
        <div className="flex items-center gap-2.5 text-neutral-400">
          <Lock className="w-4 h-4 text-orange-500 shrink-0" />
          <span>
            Ambiente Operacional Exclusivo de <strong className={isDark ? 'text-white' : 'text-neutral-900'}>{storeConfig.nome}</strong>.
            Configurações estruturais da plataforma, domínio, identidade visual e permissões globais são administradas pelo Gestor da Plataforma.
          </span>
        </div>
      </div>
    </div>
  );
};
