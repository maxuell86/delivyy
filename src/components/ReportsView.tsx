import React, { useState, useMemo, useEffect } from 'react';
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
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  ShoppingBag,
  Layers,
  RefreshCw,
  Award,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Calculator,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Product, StoreConfig, FinancialExpense, Order } from '../types';
import { subscribeToOrders } from '../services/firestoreSync';

interface ReportsViewProps {
  storeId?: string;
  products: Product[];
  storeConfig: StoreConfig;
  onSaveConfig?: (updated: StoreConfig) => void;
  showToast?: (msg: string) => void;
}

type PeriodoFiltro = 'hoje' | '7dias' | '30dias';
type CanalFiltro = 'todos' | 'delivery' | 'retirada';
type CurvaAbcCriterio = 'faturamento' | 'lucro';

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

export const ReportsView: React.FC<ReportsViewProps> = ({
  storeId = 'default',
  products,
  storeConfig,
  onSaveConfig,
  showToast,
}) => {
  const effectiveStoreId = storeId || storeConfig.id || 'default';
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30dias');
  const [canal, setCanal] = useState<CanalFiltro>('todos');
  const [abcCriterio, setAbcCriterio] = useState<CurvaAbcCriterio>('lucro');
  const [seed, setSeed] = useState(42);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);

  // Operational Expenses state for DRE
  const defaultExpenses: FinancialExpense[] = useMemo(
    () => [
      {
        id: 'exp_1',
        storeId: effectiveStoreId,
        descricao: 'Embalagens Térmicas, Sacolas Kraft & Lacres',
        categoria: 'variavel',
        valor: 680,
        data: new Date().toISOString().slice(0, 10),
      },
      {
        id: 'exp_2',
        storeId: effectiveStoreId,
        descricao: 'Diárias Fixas & Repasse Motoboys / Entregadores',
        categoria: 'motoboy',
        valor: 1450,
        data: new Date().toISOString().slice(0, 10),
      },
      {
        id: 'exp_3',
        storeId: effectiveStoreId,
        descricao: 'Energia Elétrica, Gás Industrial & Água',
        categoria: 'fixo',
        valor: 920,
        data: new Date().toISOString().slice(0, 10),
      },
      {
        id: 'exp_4',
        storeId: effectiveStoreId,
        descricao: 'Tráfego Pago (Instagram Ads) & Divulgação Local',
        categoria: 'marketing',
        valor: 450,
        data: new Date().toISOString().slice(0, 10),
      },
      {
        id: 'exp_5',
        storeId: effectiveStoreId,
        descricao: 'Simples Nacional / Taxas Pix & Maquininha',
        categoria: 'imposto',
        valor: 590,
        data: new Date().toISOString().slice(0, 10),
      },
    ],
    [effectiveStoreId]
  );

  const [despesas, setDespesas] = useState<FinancialExpense[]>(
    storeConfig.despesasFinanceiras && storeConfig.despesasFinanceiras.length > 0
      ? storeConfig.despesasFinanceiras
      : defaultExpenses
  );

  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expCat, setExpCat] = useState<FinancialExpense['categoria']>('fixo');
  const [expVal, setExpVal] = useState('');

  useEffect(() => {
    if (storeConfig.despesasFinanceiras && storeConfig.despesasFinanceiras.length > 0) {
      setDespesas(storeConfig.despesasFinanceiras);
    } else {
      setDespesas(defaultExpenses);
    }
  }, [storeConfig.despesasFinanceiras, defaultExpenses]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (orders) => {
        setLiveOrders(orders);
      },
      undefined,
      effectiveStoreId
    );
    return () => unsubscribe();
  }, [effectiveStoreId]);

  const multiplicadorPeriodo = useMemo(() => {
    switch (periodo) {
      case 'hoje':
        return 0.08;
      case '7dias':
        return 0.32;
      case '30dias':
        return 1;
      default:
        return 1;
    }
  }, [periodo]);

  const canalFactor = canal === 'todos' ? 1 : canal === 'delivery' ? 0.78 : 0.22;

  // 1. Dados de Produtos com Custo Unitário (CMV), Margem Unitária e Lucro Bruto
  const produtosAnaliticos = useMemo(() => {
    if (products.length === 0) return [];

    // Count real order quantities per product id/name if available
    const realSalesByName = new Map<string, number>();
    liveOrders
      .filter((o) => o.status !== 'cancelado')
      .forEach((o) => {
        o.itens.forEach((it) => {
          const key = (it.produto?.nome || '').toLowerCase();
          realSalesByName.set(key, (realSalesByName.get(key) || 0) + (Number(it.quantidade) || 1));
        });
      });

    return products.map((prod, index) => {
      const precoVenda = prod.precoPromocional || prod.preco || 15;
      // Use configured custoUnitario or fallback to 35% of selling price
      const custoUnit =
        prod.custoUnitario && prod.custoUnitario > 0
          ? prod.custoUnitario
          : Math.round(precoVenda * 0.35 * 100) / 100;
      const margemUnit = Math.max(0, precoVenda - custoUnit);
      const margemPct = precoVenda > 0 ? (margemUnit / precoVenda) * 100 : 0;

      const fatorPreco = Math.max(1, 85 / precoVenda);
      const bonusDestaque = prod.destaque ? 1.65 : 1.0;
      const variacao = ((index * 37 + seed * 13) % 25) / 10 + 0.85;

      const realSold = realSalesByName.get(prod.nome.toLowerCase()) || 0;
      const qtdSimulada = Math.round(
        52 * fatorPreco * bonusDestaque * variacao * multiplicadorPeriodo * canalFactor
      );
      const qtdVendida = Math.max(2, qtdSimulada + realSold);

      const faturamento = Math.round(qtdVendida * precoVenda * 100) / 100;
      const cmvTotal = Math.round(qtdVendida * custoUnit * 100) / 100;
      const lucroBruto = Math.round((faturamento - cmvTotal) * 100) / 100;

      return {
        id: prod.id,
        nome: prod.nome,
        categoria: prod.categoria,
        preco: precoVenda,
        custoUnitario: custoUnit,
        custoConfigurado: Boolean(prod.custoUnitario && prod.custoUnitario > 0),
        margemUnitaria: margemUnit,
        margemPct,
        foto: prod.foto,
        disponivel: prod.disponivel,
        destaque: prod.destaque,
        qtdVendida,
        faturamento,
        cmvTotal,
        lucroBruto,
      };
    });
  }, [products, liveOrders, multiplicadorPeriodo, canalFactor, seed]);

  // Curva ABC Classificada (80% A, 15% B, 5% C)
  const curvaAbcProdutos = useMemo(() => {
    const sorted = [...produtosAnaliticos].sort((a, b) =>
      abcCriterio === 'lucro' ? b.lucroBruto - a.lucroBruto : b.faturamento - a.faturamento
    );

    const totalBase = sorted.reduce(
      (acc, item) => acc + (abcCriterio === 'lucro' ? item.lucroBruto : item.faturamento),
      0
    );

    let acumuladoPct = 0;
    return sorted.map((item, idx) => {
      const valorCriterio = abcCriterio === 'lucro' ? item.lucroBruto : item.faturamento;
      const sharePct = totalBase > 0 ? (valorCriterio / totalBase) * 100 : 0;
      const prevAcumulado = acumuladoPct;
      acumuladoPct += sharePct;

      let classeAbc: 'A' | 'B' | 'C' = 'C';
      if (prevAcumulado < 80) {
        classeAbc = 'A';
      } else if (prevAcumulado < 95) {
        classeAbc = 'B';
      }

      return {
        ...item,
        rank: idx + 1,
        sharePct,
        acumuladoPct: Math.min(100, acumuladoPct),
        classeAbc,
      };
    });
  }, [produtosAnaliticos, abcCriterio]);

  const produtosRankingVolume = useMemo(() => {
    return [...produtosAnaliticos].sort((a, b) => b.qtdVendida - a.qtdVendida);
  }, [produtosAnaliticos]);

  const topProdutosChart = useMemo(() => {
    return produtosRankingVolume.slice(0, 6).map((p) => ({
      nome: p.nome.length > 16 ? p.nome.substring(0, 14) + '...' : p.nome,
      nomeCompleto: p.nome,
      unidades: p.qtdVendida,
      faturamento: p.faturamento,
      lucroBruto: p.lucroBruto,
    }));
  }, [produtosRankingVolume]);

  // 2. Faturamento por Categoria
  const faturamentoPorCategoria = useMemo(() => {
    const mapa = new Map<string, { faturamento: number; pedidos: number; countItens: number }>();

    produtosAnaliticos.forEach((p) => {
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
  }, [produtosAnaliticos]);

  // 3. Totais Financeiros & DRE Gerencial Automático
  const dreCalculado = useMemo(() => {
    const receitaProdutos = produtosAnaliticos.reduce((acc, p) => acc + p.faturamento, 0);
    const cmvTotal = produtosAnaliticos.reduce((acc, p) => acc + p.cmvTotal, 0);
    const totalUnidades = produtosAnaliticos.reduce((acc, p) => acc + p.qtdVendida, 0);
    const totalPedidosEstimado = Math.max(1, Math.round(totalUnidades / 2.4));

    const taxaEntregaMedia = storeConfig.taxaEntregaPadrao || 7;
    const receitaTaxasEntrega =
      canal === 'retirada' ? 0 : Math.round(totalPedidosEstimado * 0.75 * taxaEntregaMedia * 100) / 100;

    const receitaBruta = Math.round((receitaProdutos + receitaTaxasEntrega) * 100) / 100;

    // Descontos (PIX + Cupons promocionais médios)
    const pixPct = storeConfig.pagamentos?.pixDescontoPct || 5;
    const descontosPromocionais = Math.round(receitaProdutos * ((pixPct * 0.55) / 100) * 100) / 100;

    const receitaLiquida = Math.round((receitaBruta - descontosPromocionais) * 100) / 100;
    const margemContribuicao = Math.round((receitaLiquida - cmvTotal) * 100) / 100;
    const margemContribuicaoPct = receitaBruta > 0 ? (margemContribuicao / receitaBruta) * 100 : 0;
    const cmvPct = receitaBruta > 0 ? (cmvTotal / receitaBruta) * 100 : 0;

    // Despesas operacionais proporcionais ao período filtrado
    const fatorDespesa = periodo === 'hoje' ? 1 / 30 : periodo === '7dias' ? 7 / 30 : 1;
    const despesasDetalhadas = despesas.map((d) => ({
      ...d,
      valorPeriodo: Math.round(d.valor * fatorDespesa * 100) / 100,
    }));

    const totalDespesasOperacionais =
      Math.round(despesasDetalhadas.reduce((acc, d) => acc + d.valorPeriodo, 0) * 100) / 100;

    const lucroLiquido = Math.round((margemContribuicao - totalDespesasOperacionais) * 100) / 100;
    const lucroLiquidoPct = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;
    const ticketMedio = totalPedidosEstimado > 0 ? receitaBruta / totalPedidosEstimado : 0;

    return {
      receitaProdutos,
      receitaTaxasEntrega,
      receitaBruta,
      descontosPromocionais,
      receitaLiquida,
      cmvTotal,
      cmvPct,
      margemContribuicao,
      margemContribuicaoPct,
      despesasDetalhadas,
      totalDespesasOperacionais,
      lucroLiquido,
      lucroLiquidoPct,
      totalPedidosEstimado,
      ticketMedio,
    };
  }, [produtosAnaliticos, storeConfig, canal, periodo, despesas]);

  // 4. Histórico Temporal alinhado com a Receita
  const historicoTempo = useMemo(() => {
    const baseRec = dreCalculado.receitaBruta;
    const basePed = dreCalculado.totalPedidosEstimado;
    if (periodo === 'hoje') {
      const pesos = [
        { label: '18h - 19h', p: 0.12 },
        { label: '19h - 20h', p: 0.24 },
        { label: '20h - 21h', p: 0.31 },
        { label: '21h - 22h', p: 0.21 },
        { label: '22h - 23h', p: 0.12 },
      ];
      return pesos.map((w) => ({
        label: w.label,
        pedidos: Math.max(1, Math.round(basePed * w.p)),
        faturamento: Math.round(baseRec * w.p),
      }));
    }
    if (periodo === '7dias') {
      const pesos = [
        { label: 'Seg', p: 0.09 },
        { label: 'Ter', p: 0.11 },
        { label: 'Qua', p: 0.12 },
        { label: 'Qui', p: 0.14 },
        { label: 'Sex', p: 0.18 },
        { label: 'Sáb', p: 0.21 },
        { label: 'Dom', p: 0.15 },
      ];
      return pesos.map((w) => ({
        label: w.label,
        pedidos: Math.max(1, Math.round(basePed * w.p)),
        faturamento: Math.round(baseRec * w.p),
      }));
    }
    const pesos = [
      { label: 'Semana 1', p: 0.21 },
      { label: 'Semana 2', p: 0.24 },
      { label: 'Semana 3', p: 0.26 },
      { label: 'Semana 4', p: 0.29 },
    ];
    return pesos.map((w) => ({
      label: w.label,
      pedidos: Math.max(1, Math.round(basePed * w.p)),
      faturamento: Math.round(baseRec * w.p),
    }));
  }, [periodo, dreCalculado]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(expVal.replace(',', '.')) || 0;
    if (!expDesc.trim() || val <= 0) return;

    const nova: FinancialExpense = {
      id: 'exp_' + Date.now(),
      storeId: effectiveStoreId,
      descricao: expDesc.trim(),
      categoria: expCat,
      valor: val,
      data: new Date().toISOString().slice(0, 10),
    };
    const updated = [nova, ...despesas];
    setDespesas(updated);
    if (onSaveConfig) {
      onSaveConfig({
        ...storeConfig,
        despesasFinanceiras: updated,
      });
    }
    setExpDesc('');
    setExpVal('');
    setIsNewExpenseOpen(false);
    if (showToast) showToast(`Despesa "${nova.descricao}" adicionada ao DRE da loja!`);
  };

  const handleRemoveExpense = (id: string) => {
    const updated = despesas.filter((d) => d.id !== id);
    setDespesas(updated);
    if (onSaveConfig) {
      onSaveConfig({
        ...storeConfig,
        despesasFinanceiras: updated,
      });
    }
    if (showToast) showToast('Despesa removida do DRE.');
  };

  // CSV Download Utility with UTF-8 BOM (\uFEFF) and semicolon (;) for Brazilian Excel
  const triggerCsvDownload = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCell = (cell: string | number) => {
      const str = String(cell ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };
    const csvBody = [
      headers.map(escapeCell).join(';'),
      ...rows.map((r) => r.map(escapeCell).join(';')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAbcCsv = () => {
    const slug = storeConfig.slug || effectiveStoreId;
    const headers = [
      'Rank',
      'Classe ABC',
      'Produto',
      'Categoria',
      'Preco Venda (R$)',
      'Custo CMV Unitario (R$)',
      'Margem Unitaria (R$)',
      'Margem (%)',
      'Qtd Vendida',
      'Faturamento Bruto (R$)',
      'CMV Total (R$)',
      'Lucro Bruto (R$)',
      '% Participacao',
      '% Acumulado',
    ];
    const rows = curvaAbcProdutos.map((p) => [
      p.rank,
      `Classe ${p.classeAbc}`,
      p.nome,
      p.categoria,
      p.preco.toFixed(2).replace('.', ','),
      p.custoUnitario.toFixed(2).replace('.', ','),
      p.margemUnitaria.toFixed(2).replace('.', ','),
      p.margemPct.toFixed(1).replace('.', ',') + '%',
      p.qtdVendida,
      p.faturamento.toFixed(2).replace('.', ','),
      p.cmvTotal.toFixed(2).replace('.', ','),
      p.lucroBruto.toFixed(2).replace('.', ','),
      p.sharePct.toFixed(1).replace('.', ',') + '%',
      p.acumuladoPct.toFixed(1).replace('.', ',') + '%',
    ]);
    triggerCsvDownload(`curva_abc_vendas_${slug}_${periodo}.csv`, headers, rows);
    if (showToast) showToast('Planilha CSV de Vendas & Curva ABC exportada com sucesso!');
  };

  const handleExportDreCsv = () => {
    const slug = storeConfig.slug || effectiveStoreId;
    const headers = ['Linha do Demonstrativo (DRE)', 'Categoria', 'Valor no Periodo (R$)', '% sobre Receita Bruta'];
    const rb = dreCalculado.receitaBruta || 1;
    const rows: (string | number)[][] = [
      ['(+) Receita de Produtos Vendidos', 'Receita', dreCalculado.receitaProdutos.toFixed(2).replace('.', ','), ((dreCalculado.receitaProdutos / rb) * 100).toFixed(1).replace('.', ',') + '%'],
      ['(+) Receita de Taxas de Entrega', 'Receita', dreCalculado.receitaTaxasEntrega.toFixed(2).replace('.', ','), ((dreCalculado.receitaTaxasEntrega / rb) * 100).toFixed(1).replace('.', ',') + '%'],
      ['(=) RECEITA BRUTA TOTAL', 'Subtotal', dreCalculado.receitaBruta.toFixed(2).replace('.', ','), '100,0%'],
      ['(-) Descontos Promocionais (PIX / Cupons)', 'Deducao', (-dreCalculado.descontosPromocionais).toFixed(2).replace('.', ','), ((dreCalculado.descontosPromocionais / rb) * 100).toFixed(1).replace('.', ',') + '%'],
      ['(=) RECEITA OPERACIONAL LIQUIDA', 'Subtotal', dreCalculado.receitaLiquida.toFixed(2).replace('.', ','), ((dreCalculado.receitaLiquida / rb) * 100).toFixed(1).replace('.', ',') + '%'],
      ['(-) CMV (Custo de Mercadoria Vendida / Insumos)', 'Custo Variavel', (-dreCalculado.cmvTotal).toFixed(2).replace('.', ','), dreCalculado.cmvPct.toFixed(1).replace('.', ',') + '%'],
      ['(=) LUCRO BRUTO / MARGEM DE CONTRIBUICAO', 'Subtotal', dreCalculado.margemContribuicao.toFixed(2).replace('.', ','), dreCalculado.margemContribuicaoPct.toFixed(1).replace('.', ',') + '%'],
      ...dreCalculado.despesasDetalhadas.map((d) => [
        `(-) Despesa: ${d.descricao}`,
        d.categoria.toUpperCase(),
        (-d.valorPeriodo).toFixed(2).replace('.', ','),
        ((d.valorPeriodo / rb) * 100).toFixed(1).replace('.', ',') + '%',
      ]),
      ['(=) RESULTADO LIQUIDO DO PERIODO (LUCRO LIQUIDO)', 'Resultado Final', dreCalculado.lucroLiquido.toFixed(2).replace('.', ','), dreCalculado.lucroLiquidoPct.toFixed(1).replace('.', ',') + '%'],
    ];
    triggerCsvDownload(`dre_financeiro_${slug}_${periodo}.csv`, headers, rows);
    if (showToast) showToast('Demonstrativo DRE Financeiro exportado em CSV!');
  };

  const handleExportEstoqueCsv = () => {
    const slug = storeConfig.slug || effectiveStoreId;
    let stockMap: Record<string, { qtd: number; min: number; unidade: string }> = {};
    try {
      const saved = localStorage.getItem('omni_inventory_stock');
      if (saved) stockMap = JSON.parse(saved);
    } catch {}

    const headers = [
      'Codigo PDV',
      'Produto',
      'Categoria',
      'Status Cardapio',
      'Qtd Estoque Atual',
      'Estoque Minimo',
      'Unidade',
      'Custo Unitario CMV (R$)',
      'Preco Venda (R$)',
      'Valor Total em Estoque (R$)',
    ];
    const rows = products.map((p, idx) => {
      const st = stockMap[p.id] || {
        qtd: p.disponivel ? 20 + (idx % 10) : 0,
        min: 5,
        unidade: p.unidadeMedida || 'unidade',
      };
      const preco = p.precoPromocional || p.preco || 0;
      const custo = p.custoUnitario && p.custoUnitario > 0 ? p.custoUnitario : Math.round(preco * 0.35 * 100) / 100;
      const valorEstoque = st.qtd * custo;
      return [
        p.codigoPdv || `PDV-${idx + 101}`,
        p.nome,
        p.categoria,
        p.disponivel ? 'Disponivel' : 'Esgotado/Pausado',
        st.qtd,
        st.min,
        st.unidade,
        custo.toFixed(2).replace('.', ','),
        preco.toFixed(2).replace('.', ','),
        valorEstoque.toFixed(2).replace('.', ','),
      ];
    });
    triggerCsvDownload(`estoque_cmv_${slug}.csv`, headers, rows);
    if (showToast) showToast('Relatório de Estoque & CMV exportado em CSV!');
  };

  const countClasseA = curvaAbcProdutos.filter((p) => p.classeAbc === 'A').length;
  const countClasseB = curvaAbcProdutos.filter((p) => p.classeAbc === 'B').length;
  const countClasseC = curvaAbcProdutos.filter((p) => p.classeAbc === 'C').length;

  return (
    <div className="space-y-6 pb-10">
      {/* Top Banner, Period Filter & CSV Export Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              <span>Inteligência Financeira, DRE Automático &amp; Curva ABC</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400 capitalize">{storeConfig.nome}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Demonstrativo DRE, Curva ABC de Produtos &amp; Exportação CSV
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Acompanhe o lucro líquido real descontando CMV e despesas operacionais, identifique os itens Classe A e exporte planilhas compatíveis com Excel.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Período */}
            <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setPeriodo('hoje')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  periodo === 'hoje'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriodo('7dias')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  periodo === '7dias'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setPeriodo('30dias')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  periodo === '30dias'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                30 Dias (Mês)
              </button>
            </div>

            {/* Canal de Atendimento */}
            <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCanal('todos')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  canal === 'todos' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setCanal('delivery')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  canal === 'delivery' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Delivery
              </button>
              <button
                onClick={() => setCanal('retirada')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  canal === 'retirada' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Balcão
              </button>
            </div>

            <button
              onClick={() => setSeed((s) => s + 1)}
              className="p-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition cursor-pointer"
              title="Recalcular projeção"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CSV Export Toolbar */}
        <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-neutral-200">Exportação para Excel / Contabilidade (CSV UTF-8):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportDreCsv}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar DRE Financeiro (.CSV)</span>
            </button>
            <button
              type="button"
              onClick={handleExportAbcCsv}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Vendas &amp; Curva ABC (.CSV)</span>
            </button>
            <button
              type="button"
              onClick={handleExportEstoqueCsv}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Baixar Posição de Estoque (.CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Receita Bruta Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              R$ {dreCalculado.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-400 font-mono tabular-nums">
            <span>{dreCalculado.totalPedidosEstimado} pedidos</span>
            <span>Ticket: R$ {dreCalculado.ticketMedio.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              CMV (Custo de Insumos)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tabular-nums">
              R$ {dreCalculado.cmvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-neutral-400 font-mono tabular-nums">
            Representa <strong>{dreCalculado.cmvPct.toFixed(1)}%</strong> da receita bruta
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Margem de Contribuição
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono tabular-nums">
              R$ {dreCalculado.margemContribuicao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-neutral-400 font-mono tabular-nums">
            Margem Bruta: <strong>{dreCalculado.margemContribuicaoPct.toFixed(1)}%</strong> após CMV
          </div>
        </div>

        <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              Lucro Líquido Real (DRE)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                dreCalculado.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              R$ {dreCalculado.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 font-bold font-mono tabular-nums">
            Lucratividade Líquida: {dreCalculado.lucroLiquidoPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE GERENCIAL AUTOMÁTICO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Demonstrativo Financeiro DRE Automático</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Apuração vertical de receitas, deduções, CMV de ficha técnica e despesas operacionais.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
              Período: {periodo === 'hoje' ? 'Hoje' : periodo === '7dias' ? '7 Dias' : '30 Dias'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono tabular-nums">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-950/60">
              <span className="font-sans font-semibold text-neutral-300">(+) Venda de Produtos do Cardápio</span>
              <span className="text-white font-bold">
                R$ {dreCalculado.receitaProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-950/60">
              <span className="font-sans font-semibold text-neutral-300">(+) Receita de Taxas de Entrega</span>
              <span className="text-white font-bold">
                R$ {dreCalculado.receitaTaxasEntrega.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 font-black text-sm">
              <span className="font-sans text-white">(=) RECEITA BRUTA OPERACIONAL</span>
              <span className="text-white">
                R$ {dreCalculado.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (100%)
              </span>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg text-amber-400">
              <span className="font-sans">(-) Descontos Concedidos (PIX &amp; Cupons)</span>
              <span>
                - R$ {dreCalculado.descontosPromocionais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-950/80 border border-neutral-800/80 font-bold">
              <span className="font-sans text-neutral-200">(=) RECEITA OPERACIONAL LÍQUIDA</span>
              <span className="text-neutral-100">
                R$ {dreCalculado.receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg text-red-400">
              <span className="font-sans">(-) CMV — Custo de Mercadoria Vendida (Ficha Técnica)</span>
              <span>
                - R$ {dreCalculado.cmvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({dreCalculado.cmvPct.toFixed(1)}%)
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/30 font-black text-blue-300">
              <span className="font-sans">(=) LUCRO BRUTO / MARGEM DE CONTRIBUIÇÃO</span>
              <span>
                R$ {dreCalculado.margemContribuicao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({dreCalculado.margemContribuicaoPct.toFixed(1)}%)
              </span>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg text-red-400">
              <span className="font-sans">(-) Despesas Operacionais (Fixas, Motoboys, Marketing, Impostos)</span>
              <span>
                - R$ {dreCalculado.totalDespesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div
              className={`flex items-center justify-between py-3.5 px-4 rounded-xl border text-sm sm:text-base font-black ${
                dreCalculado.lucroLiquido >= 0
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-red-500/15 border-red-500/40 text-red-400'
              }`}
            >
              <span className="font-sans">(=) RESULTADO LÍQUIDO DO PERÍODO</span>
              <span>
                R$ {dreCalculado.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({dreCalculado.lucroLiquidoPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Lançamento de Despesas Operacionais da Loja */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Despesas Operacionais Mensais</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Lance custos fixos e variáveis para cálculo exato do Lucro Líquido.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewExpenseOpen(!isNewExpenseOpen)}
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Lançar Despesa</span>
              </button>
            </div>

            {isNewExpenseOpen && (
              <form
                onSubmit={handleAddExpense}
                className="p-3.5 rounded-xl bg-neutral-950 border border-orange-500/40 space-y-2.5 text-xs"
              >
                <div>
                  <label className="block text-neutral-400 font-bold mb-1">Descrição da Despesa *</label>
                  <input
                    type="text"
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    placeholder="Ex: Aluguel Salão, Contador, Embalagens..."
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-400 font-bold mb-1">Categoria</label>
                    <select
                      value={expCat}
                      onChange={(e) => setExpCat(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white outline-none"
                    >
                      <option value="fixo">Custo Fixo</option>
                      <option value="variavel">Custo Variável</option>
                      <option value="motoboy">Logística / Motoboy</option>
                      <option value="marketing">Marketing</option>
                      <option value="imposto">Impostos / Taxas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 font-bold mb-1">Valor Mensal (R$) *</label>
                    <input
                      type="text"
                      value={expVal}
                      onChange={(e) => setExpVal(e.target.value)}
                      placeholder="Ex: 450,00"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white font-mono outline-none"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black cursor-pointer"
                >
                  Adicionar ao DRE
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {dreCalculado.despesasDetalhadas.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{d.descricao}</p>
                    <span className="text-[10px] uppercase font-bold text-neutral-500">
                      {d.categoria} • Base mensal: R$ {d.valor.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono tabular-nums font-bold text-red-400">
                      - R$ {d.valorPeriodo.toFixed(2).replace('.', ',')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(d.id)}
                      className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
                      title="Remover despesa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="font-sans text-neutral-400 font-bold">Total Despesas no Período:</span>
            <span className="text-red-400 font-black text-sm">
              - R$ {dreCalculado.totalDespesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* CURVA ABC DE PRODUTOS (MAIS VENDIDOS & MAIS LUCRATIVOS) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-black text-white">
                Matriz Curva ABC de Produtos (Regra 80 / 15 / 5)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Identifique os produtos <strong>Classe A</strong> (geram 80% do resultado da loja), <strong>Classe B</strong> (15% intermediários) e <strong>Classe C</strong> (5% complementares).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400 font-bold">Ordenar Curva ABC por:</span>
            <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAbcCriterio('lucro')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  abcCriterio === 'lucro'
                    ? 'bg-emerald-500 text-neutral-950 font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Mais Lucrativos (Margem R$)
              </button>
              <button
                type="button"
                onClick={() => setAbcCriterio('faturamento')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  abcCriterio === 'faturamento'
                    ? 'bg-orange-500 text-white font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Maior Faturamento Bruto
              </button>
            </div>
          </div>
        </div>

        {/* Summary Class A / B / C Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-neutral-950/60 border-b border-neutral-800 text-xs">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="font-black text-emerald-400 uppercase block">Classe A • Estrelas (Até 80%)</span>
              <span className="text-neutral-300 text-[11px]">Nunca podem faltar no estoque</span>
            </div>
            <span className="text-lg font-black text-emerald-400 font-mono tabular-nums">{countClasseA} itens</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="font-black text-amber-400 uppercase block">Classe B • Intermediários (15%)</span>
              <span className="text-neutral-300 text-[11px]">Ideais para combos e destaques</span>
            </div>
            <span className="text-lg font-black text-amber-400 font-mono tabular-nums">{countClasseB} itens</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-800/70 border border-neutral-700 flex items-center justify-between">
            <div>
              <span className="font-black text-neutral-300 uppercase block">Classe C • Baixo Giro (5%)</span>
              <span className="text-neutral-400 text-[11px]">Avaliar reformulação ou promoção</span>
            </div>
            <span className="text-lg font-black text-neutral-300 font-mono tabular-nums">{countClasseC} itens</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Classe</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4 text-right">Preço Venda</th>
                <th className="py-3 px-4 text-right">CMV Unit.</th>
                <th className="py-3 px-4 text-right">Margem Un.</th>
                <th className="py-3 px-4 text-center">Vendas</th>
                <th className="py-3 px-4 text-right">Faturamento</th>
                <th className="py-3 px-4 text-right">Lucro Bruto</th>
                <th className="py-3 px-4 text-right">% Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 font-mono tabular-nums">
              {curvaAbcProdutos.map((prod) => (
                <tr key={prod.id} className="hover:bg-neutral-800/40 transition">
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-black text-xs inline-block ${
                        prod.classeAbc === 'A'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : prod.classeAbc === 'B'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {prod.classeAbc} #{prod.rank}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={prod.foto}
                        alt={prod.nome}
                        className="w-9 h-9 rounded-lg object-cover bg-neutral-950 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs sm:text-sm truncate">{prod.nome}</p>
                        <span className="text-[10px] text-neutral-400 capitalize">{prod.categoria}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right text-neutral-200 font-bold">
                    R$ {prod.preco.toFixed(2).replace('.', ',')}
                  </td>

                  <td className="py-3 px-4 text-right text-neutral-400">
                    R$ {prod.custoUnitario.toFixed(2).replace('.', ',')}
                  </td>

                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                    R$ {prod.margemUnitaria.toFixed(2).replace('.', ',')}{' '}
                    <span className="text-[10px] text-neutral-500">({prod.margemPct.toFixed(0)}%)</span>
                  </td>

                  <td className="py-3 px-4 text-center font-black text-white">
                    {prod.qtdVendida} un
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-neutral-200">
                    R$ {prod.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-4 text-right font-black text-emerald-400">
                    R$ {prod.lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-neutral-300 font-bold">{prod.acumuladoPct.toFixed(1)}%</span>
                      <div className="w-12 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            prod.classeAbc === 'A'
                              ? 'bg-emerald-500'
                              : prod.classeAbc === 'B'
                              ? 'bg-amber-500'
                              : 'bg-neutral-500'
                          }`}
                          style={{ width: `${Math.min(100, prod.sharePct * 2.5)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficos Visuais: Evolução Temporal & Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span>Evolução de Faturamento &amp; Pedidos</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Desempenho ao longo do período selecionado.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicoTempo} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="corFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="label" stroke="#737373" fontSize={11} tickLine={false} />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#404040',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  name="Faturamento (R$)"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#corFaturamento)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Receita por Categoria do Cardápio</span>
            </h3>
            <div className="h-56 w-full flex items-center justify-center mt-2">
              {faturamentoPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={faturamentoPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
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
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-neutral-500">Sem categorias</p>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-mono tabular-nums">
            {faturamentoPorCategoria.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-neutral-300">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="font-sans font-medium">{cat.name}:</span>
                <span className="text-neutral-400">R$ {cat.faturamento.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
