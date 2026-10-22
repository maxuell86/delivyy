import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  ShoppingBag,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Award,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { Product, StoreConfig } from '../types';
import { CATEGORIAS_POR_SEGMENTO } from '../data/segmentData';

interface ReportsViewProps {
  products: Product[];
  storeConfig: StoreConfig;
}

type PeriodoFiltro = 'hoje' | '7dias' | '30dias';
type CanalFiltro = 'todos' | 'delivery' | 'retirada';

// Cores premium para gráficos
const PALETA_CORES = [
  '#f97316', // Orange
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export const ReportsView: React.FC<ReportsViewProps> = ({ products, storeConfig }) => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('7dias');
  const [canal, setCanal] = useState<CanalFiltro>('todos');
  const [seed, setSeed] = useState(42);

  // Multiplicador do período para simulação realista
  const multiplicadorPeriodo = useMemo(() => {
    switch (periodo) {
      case 'hoje':
        return 0.25;
      case '7dias':
        return 1;
      case '30dias':
        return 3.8;
      default:
        return 1;
    }
  }, [periodo]);

  const canalFactor = canal === 'todos' ? 1 : canal === 'delivery' ? 0.78 : 0.22;

  // 1. Dados de Produtos Mais Vendidos
  const produtosRanking = useMemo(() => {
    if (products.length === 0) return [];

    return products.map((prod, index) => {
      // Cálculo determinístico e proporcional baseado no preço, destaque e posição
      const fatorPreco = Math.max(1, 80 / (prod.preco || 15));
      const bonusDestaque = prod.destaque ? 1.8 : 1.0;
      const variacao = ((index * 37 + seed * 13) % 25) / 10 + 0.8;
      
      const qtdVendasBase = Math.round(
        (18 * fatorPreco * bonusDestaque * variacao * multiplicadorPeriodo * canalFactor)
      );
      const qtdVendida = Math.max(2, qtdVendasBase);
      const faturamento = Math.round(qtdVendida * prod.preco * 100) / 100;

      return {
        id: prod.id,
        nome: prod.nome,
        categoria: prod.categoria,
        preco: prod.preco,
        foto: prod.foto,
        disponivel: prod.disponivel,
        destaque: prod.destaque,
        qtdVendida,
        faturamento,
      };
    }).sort((a, b) => b.qtdVendida - a.qtdVendida);
  }, [products, multiplicadorPeriodo, canalFactor, seed]);

  // Top 6 mais vendidos para gráfico de barras
  const topProdutosChart = useMemo(() => {
    return produtosRanking.slice(0, 6).map((p) => ({
      nome: p.nome.length > 16 ? p.nome.substring(0, 14) + '...' : p.nome,
      nomeCompleto: p.nome,
      unidades: p.qtdVendida,
      faturamento: p.faturamento,
      preco: p.preco,
    }));
  }, [produtosRanking]);

  // 2. Faturamento e Volume por Categoria (Gráfico de Pizza / Donut)
  const faturamentoPorCategoria = useMemo(() => {
    const mapa = new Map<string, { faturamento: number; pedidos: number; countItens: number }>();

    produtosRanking.forEach((p) => {
      const atual = mapa.get(p.categoria) || { faturamento: 0, pedidos: 0, countItens: 0 };
      mapa.set(p.categoria, {
        faturamento: atual.faturamento + p.faturamento,
        pedidos: atual.pedidos + p.qtdVendida,
        countItens: atual.countItens + 1,
      });
    });

    const lista = Array.from(mapa.entries()).map(([cat, dados], idx) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      faturamento: Math.round(dados.faturamento * 100) / 100,
      pedidos: dados.pedidos,
      countItens: dados.countItens,
      color: PALETA_CORES[idx % PALETA_CORES.length],
    }));

    return lista.sort((a, b) => b.faturamento - a.faturamento);
  }, [produtosRanking]);

  // 3. Volume de Pedidos & Faturamento por Linha do Tempo
  const historicoTempo = useMemo(() => {
    if (periodo === 'hoje') {
      // Gráfico por faixas de horário (almoço e jantar)
      const faixas = [
        { hora: '11h - 12h', pedidos: 4, faturamento: 184 },
        { hora: '12h - 13h', pedidos: 12, faturamento: 520 },
        { hora: '13h - 14h', pedidos: 9, faturamento: 395 },
        { hora: '18h - 19h', pedidos: 8, faturamento: 340 },
        { hora: '19h - 20h', pedidos: 21, faturamento: 980 },
        { hora: '20h - 21h', pedidos: 28, faturamento: 1290 },
        { hora: '21h - 22h', pedidos: 17, faturamento: 765 },
        { hora: '22h - 23h', pedidos: 7, faturamento: 310 },
      ];
      return faixas.map((f) => ({
        label: f.hora,
        pedidos: Math.round(f.pedidos * canalFactor),
        faturamento: Math.round(f.faturamento * canalFactor),
      }));
    }

    if (periodo === '7dias') {
      const dias = [
        { dia: 'Segunda', pedidos: 24, faturamento: 1120 },
        { dia: 'Terça', pedidos: 29, faturamento: 1380 },
        { dia: 'Quarta', pedidos: 33, faturamento: 1540 },
        { dia: 'Quinta', pedidos: 42, faturamento: 1980 },
        { dia: 'Sexta', pedidos: 68, faturamento: 3250 },
        { dia: 'Sábado', pedidos: 84, faturamento: 4120 },
        { dia: 'Domingo', pedidos: 61, faturamento: 2890 },
      ];
      return dias.map((d) => ({
        label: d.dia,
        pedidos: Math.round(d.pedidos * canalFactor),
        faturamento: Math.round(d.faturamento * canalFactor),
      }));
    }

    // 30 dias (4 semanas)
    const semanas = [
      { sem: 'Semana 1', pedidos: 210, faturamento: 9850 },
      { sem: 'Semana 2', pedidos: 245, faturamento: 11600 },
      { sem: 'Semana 3', pedidos: 278, faturamento: 13200 },
      { sem: 'Semana 4', pedidos: 312, faturamento: 14950 },
    ];
    return semanas.map((s) => ({
      label: s.sem,
      pedidos: Math.round(s.pedidos * canalFactor),
      faturamento: Math.round(s.faturamento * canalFactor),
    }));
  }, [periodo, canalFactor]);

  // Totais Consolidados
  const totalFaturamento = useMemo(() => {
    return historicoTempo.reduce((acc, curr) => acc + curr.faturamento, 0);
  }, [historicoTempo]);

  const totalPedidos = useMemo(() => {
    return historicoTempo.reduce((acc, curr) => acc + curr.pedidos, 0);
  }, [historicoTempo]);

  const ticketMedio = useMemo(() => {
    if (totalPedidos === 0) return 0;
    return totalFaturamento / totalPedidos;
  }, [totalFaturamento, totalPedidos]);

  const produtoDestaque = produtosRanking[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Inteligência de Vendas &amp; Desempenho</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400 capitalize">{storeConfig.segmento || 'Cardápio'}</span>
          </div>
          <h2 className="text-xl font-black text-white mt-0.5">
            Relatórios de Volume, Mais Vendidos e Faturamento
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Métricas calculadas em tempo real com base no cardápio de {storeConfig.nome}.
          </p>
        </div>

        {/* Filter Controls (Clean Segmented Buttons) */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Período */}
          <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriodo('hoje')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodo === 'hoje'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodo('7dias')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodo === '7dias'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriodo('30dias')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodo === '30dias'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              30 Dias
            </button>
          </div>

          {/* Canal de Atendimento */}
          <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setCanal('todos')}
              className={`px-3 py-1.5 rounded-lg transition ${
                canal === 'todos'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Geral
            </button>
            <button
              onClick={() => setCanal('delivery')}
              className={`px-3 py-1.5 rounded-lg transition ${
                canal === 'delivery'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Delivery
            </button>
            <button
              onClick={() => setCanal('retirada')}
              className={`px-3 py-1.5 rounded-lg transition ${
                canal === 'retirada'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Balcão
            </button>
          </div>

          {/* Recalcular / Atualizar */}
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="p-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition"
            title="Atualizar simulação de vendas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Faturamento Bruto
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-semibold">+14.2%</span>
            <span className="text-neutral-500">em relação ao período anterior</span>
          </div>
        </div>

        {/* Card 2: Volume de Pedidos */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Volume de Pedidos
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {totalPedidos}
            </span>
            <span className="text-xs text-neutral-400 font-medium">pedidos finalizados</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-semibold">+9.8%</span>
            <span className="text-neutral-500">conversão no cardápio</span>
          </div>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Ticket Médio por Pedido
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            <span>Média por cliente incluindo adicionais</span>
          </div>
        </div>

        {/* Card 4: Produto Campeão */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Item Campeão de Vendas
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          {produtoDestaque ? (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={produtoDestaque.foto}
                alt={produtoDestaque.nome}
                className="w-11 h-11 rounded-xl object-cover bg-neutral-950 border border-neutral-800 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-bold text-white text-sm truncate">{produtoDestaque.nome}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                  <span className="text-amber-400 font-semibold">{produtoDestaque.qtdVendida} un</span>
                  <span>·</span>
                  <span>R$ {produtoDestaque.faturamento.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-neutral-500">Nenhum produto cadastrado</p>
          )}
        </div>
      </div>

      {/* Main Charts Row 1: Volume de Pedidos & Faturamento Temporal */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span>Volume de Pedidos &amp; Curva de Faturamento</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Evolução diária de pedidos e receita ao longo do período selecionado ({periodo === 'hoje' ? 'Horários de Pico' : periodo === '7dias' ? 'Dias da Semana' : 'Semanas do Mês'}).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-500 inline-block" />
              <span className="text-neutral-300">Faturamento (R$)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
              <span className="text-neutral-300">Volume de Pedidos</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicoTempo} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="corFaturamento" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="corPedidos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="label" stroke="#737373" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#737373" fontSize={11} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#737373" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  borderColor: '#404040',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any) => {
                  const num = typeof val === 'number' ? val : Number(val || 0);
                  if (name === 'Faturamento') {
                    return [`R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento'];
                  }
                  return [`${num} pedidos`, 'Volume'];
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="faturamento"
                name="Faturamento"
                stroke="#f97316"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#corFaturamento)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="pedidos"
                name="Volume de Pedidos"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#corPedidos)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Produtos Mais Vendidos vs Faturamento por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Top Produtos Mais Vendidos (BarChart) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Top Produtos Mais Vendidos (Unidades)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Itens com maior saída de estoque no período selecionado.
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProdutosChart} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                  <XAxis type="number" stroke="#737373" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="nome" stroke="#a3a3a3" fontSize={11} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#404040',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any, item: any) => {
                      const num = typeof val === 'number' ? val : Number(val || 0);
                      const fullItem = item?.payload || {};
                      return [
                        `${num} unidades vendidas (R$ ${(fullItem.faturamento || 0).toFixed(2).replace('.', ',')})`,
                        fullItem.nomeCompleto || name,
                      ];
                    }}
                  />
                  <Bar dataKey="unidades" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 text-xs text-neutral-400 flex items-center justify-between">
            <span>Item com maior saída: <strong className="text-white">{topProdutosChart[0]?.nomeCompleto || '—'}</strong></span>
            <span className="text-emerald-400 font-semibold">{topProdutosChart[0]?.unidades || 0} pedidos</span>
          </div>
        </div>

        {/* Gráfico 2: Faturamento por Categoria (PieChart / Donut) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>Faturamento por Categoria</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Distribuição percentual da receita entre as seções do cardápio.
                </p>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {faturamentoPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={faturamentoPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="faturamento"
                    >
                      {faturamentoPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171717',
                        borderColor: '#404040',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => {
                        const num = typeof val === 'number' ? val : Number(val || 0);
                        const pct = totalFaturamento > 0 ? ((num / totalFaturamento) * 100).toFixed(1) : '0';
                        return [`R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pct}%)`, 'Receita'];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-neutral-500">Sem categorias para exibir</p>
              )}
            </div>
          </div>

          {/* Legenda Dinâmica e Limpa */}
          <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            {faturamentoPorCategoria.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-neutral-300">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="font-medium">{cat.name}:</span>
                <span className="text-neutral-400">
                  R$ {cat.faturamento.toFixed(0)} ({totalFaturamento > 0 ? Math.round((cat.faturamento / totalFaturamento) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Tabela Detalhada de Performance de Cada Produto */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Desempenho Comercial de Cada Item do Cardápio</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Classificação por volume de vendas, faturamento gerado e participação na receita.
            </p>
          </div>

          <span className="text-xs font-semibold text-neutral-400">
            {produtosRanking.length} produtos analisados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Preço</th>
                <th className="py-3 px-4 text-center">Volume Vendido</th>
                <th className="py-3 px-4 text-right">Faturamento Total</th>
                <th className="py-3 px-4 text-right">% Receita</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {produtosRanking.map((prod, idx) => {
                const partReceita = totalFaturamento > 0 ? (prod.faturamento / totalFaturamento) * 100 : 0;

                return (
                  <tr key={prod.id} className="hover:bg-neutral-800/40 transition">
                    <td className="py-3 px-4 text-center font-black">
                      {idx === 0 ? (
                        <span className="text-amber-400 text-sm">🥇 #1</span>
                      ) : idx === 1 ? (
                        <span className="text-slate-300 text-sm">🥈 #2</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-600 text-sm">🥉 #3</span>
                      ) : (
                        <span className="text-neutral-500">#{idx + 1}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={prod.foto}
                        alt={prod.nome}
                        className="w-10 h-10 rounded-lg object-cover bg-neutral-950 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm truncate">{prod.nome}</p>
                          {prod.destaque && (
                            <span className="text-[10px] text-amber-400 font-semibold">⭐ Destaque</span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 capitalize">{prod.categoria}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-neutral-300 capitalize">
                      {prod.categoria}
                    </td>

                    <td className="py-3 px-4 font-bold text-neutral-200">
                      R$ {prod.preco.toFixed(2).replace('.', ',')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-black text-emerald-400 text-sm">
                        {prod.qtdVendida}
                      </span>
                      <span className="text-[10px] text-neutral-500 ml-1">unidades</span>
                    </td>

                    <td className="py-3 px-4 text-right font-black text-white text-sm">
                      R$ {prod.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold text-neutral-300">{partReceita.toFixed(1)}%</span>
                        <div className="w-12 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${Math.min(100, partReceita * 3)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[11px] font-semibold ${
                          prod.disponivel ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {prod.disponivel ? 'Disponível' : 'Pausado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
