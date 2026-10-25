import React, { useState, useMemo, useEffect } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  TrendingDown,
  PackageCheck,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { Product } from '../types';
import { useTheme } from '../context/ThemeContext';

interface InventoryViewProps {
  storeId?: string;
  products: Product[];
  onToggleDisponivel: (id: string) => void;
  onUpdateProduct?: (product: Product) => void;
  showToast: (msg: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  storeId = 'default',
  products,
  onToggleDisponivel,
  onUpdateProduct,
  showToast,
}) => {
  const { isDark } = useTheme();
  const storageKey = `omni_inventory_stock_${storeId}`;

  const [stockMap, setStockMap] = useState<{ [id: string]: { qtd: number; min: number; unidade: string } }>(() => {
    try {
      const saved =
        localStorage.getItem(storageKey) ||
        (storeId === 'default' ? localStorage.getItem('omni_inventory_stock') : null);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const initial: { [id: string]: { qtd: number; min: number; unidade: string } } = {};
    products.forEach((p, idx) => {
      const isOut = !p.disponivel;
      const baseQtd =
        p.estoqueAtual !== undefined
          ? p.estoqueAtual
          : isOut
          ? 0
          : 20 + (idx % 10);
      initial[p.id] = {
        qtd: baseQtd,
        min: p.estoqueMinimo ?? 5,
        unidade: p.unidadeMedida || 'unidade',
      };
    });
    return initial;
  });

  // Sync stockMap whenever products update from Firestore or storeId changes
  useEffect(() => {
    let savedMap: { [id: string]: { qtd: number; min: number; unidade: string } } = {};
    try {
      const saved =
        localStorage.getItem(storageKey) ||
        (storeId === 'default' ? localStorage.getItem('omni_inventory_stock') : null);
      if (saved) savedMap = JSON.parse(saved);
    } catch {}

    const merged: { [id: string]: { qtd: number; min: number; unidade: string } } = { ...savedMap };
    products.forEach((p, idx) => {
      const existing = merged[p.id];
      const qtd =
        p.estoqueAtual !== undefined
          ? p.estoqueAtual
          : existing?.qtd !== undefined
          ? existing.qtd
          : p.disponivel
          ? 20 + (idx % 10)
          : 0;
      const min = p.estoqueMinimo ?? existing?.min ?? 5;
      merged[p.id] = {
        qtd,
        min,
        unidade: p.unidadeMedida || existing?.unidade || 'unidade',
      };
    });
    setStockMap(merged);
  }, [products, storeId, storageKey]);

  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'baixos' | 'esgotados'>('todos');

  const saveStock = (newMap: typeof stockMap) => {
    setStockMap(newMap);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMap));
      if (storeId === 'default') {
        localStorage.setItem('omni_inventory_stock', JSON.stringify(newMap));
      }
    } catch (e) {}
  };

  const persistProductStock = (productId: string, nextQtd: number, nextMin?: number, nextCost?: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const current = stockMap[productId] || {
      qtd: prod.estoqueAtual ?? 15,
      min: prod.estoqueMinimo ?? 5,
      unidade: prod.unidadeMedida || 'unidade',
    };

    const resolvedQtd = Math.max(0, nextQtd);
    const resolvedMin = nextMin !== undefined ? Math.max(0, nextMin) : current.min;

    const updatedMap = {
      ...stockMap,
      [productId]: {
        ...current,
        qtd: resolvedQtd,
        min: resolvedMin,
      },
    };
    saveStock(updatedMap);

    let nextDisponivel = prod.disponivel;
    if (resolvedQtd === 0 && prod.disponivel) {
      nextDisponivel = false;
      showToast(`Estoque zerado! "${prod.nome}" foi pausado automaticamente no cardápio.`);
    } else if (resolvedQtd > 0 && !prod.disponivel && current.qtd === 0) {
      nextDisponivel = true;
      showToast(`Estoque reposto! "${prod.nome}" foi reativado no cardápio.`);
    }

    if (onUpdateProduct) {
      onUpdateProduct({
        ...prod,
        controlarEstoque: true,
        estoqueAtual: resolvedQtd,
        estoqueMinimo: resolvedMin,
        custoUnitario: nextCost !== undefined ? nextCost : prod.custoUnitario,
        disponivel: nextDisponivel,
        atualizadoEm: new Date().toISOString(),
      });
    } else if (nextDisponivel !== prod.disponivel) {
      onToggleDisponivel(productId);
    }
  };

  const handleAdjust = (productId: string, delta: number) => {
    const current = stockMap[productId] || { qtd: 10, min: 5, unidade: 'unidade' };
    const newQtd = Math.max(0, current.qtd + delta);
    persistProductStock(productId, newQtd);
    if (newQtd > 0) {
      showToast(`Estoque atualizado: ${newQtd} ${current.unidade}(s)`);
    }
  };

  const handleSetExact = (productId: string, val: number) => {
    persistProductStock(productId, val);
  };

  const handleSetMin = (productId: string, minVal: number) => {
    const current = stockMap[productId] || { qtd: 10, min: 5, unidade: 'unidade' };
    persistProductStock(productId, current.qtd, minVal);
  };

  const handleReplenishLowStock = () => {
    const updatedMap = { ...stockMap };
    products.forEach((p) => {
      const current = updatedMap[p.id] || { qtd: p.estoqueAtual ?? 0, min: p.estoqueMinimo ?? 5, unidade: p.unidadeMedida || 'unidade' };
      if (current.qtd <= current.min) {
        const replenished = Math.max(20, current.min * 3);
        updatedMap[p.id] = { ...current, qtd: replenished };
        if (onUpdateProduct) {
          onUpdateProduct({
            ...p,
            controlarEstoque: true,
            estoqueAtual: replenished,
            disponivel: true,
            atualizadoEm: new Date().toISOString(),
          });
        }
      }
    });
    saveStock(updatedMap);
    showToast('Itens com estoque baixo/esgotado foram repostos e reativados!');
  };

  // Filtragem dos itens de estoque
  const items = useMemo(() => {
    return products.map((p) => {
      const stock = stockMap[p.id] || {
        qtd: p.estoqueAtual !== undefined ? p.estoqueAtual : p.disponivel ? 15 : 0,
        min: p.estoqueMinimo ?? 5,
        unidade: p.unidadeMedida || 'unidade',
      };
      let status: 'ok' | 'baixo' | 'esgotado' = 'ok';
      if (stock.qtd === 0 || !p.disponivel) {
        status = 'esgotado';
      } else if (stock.qtd <= stock.min) {
        status = 'baixo';
      }

      const effectivePrice = p.precoPromocional && p.precoPromocional < p.preco ? p.precoPromocional : p.preco;
      const custo = p.custoUnitario || 0;
      const margemPct = custo > 0 && effectivePrice > 0 ? Math.round(((effectivePrice - custo) / effectivePrice) * 100) : null;

      return {
        product: p,
        qtd: stock.qtd,
        min: stock.min,
        unidade: stock.unidade,
        status,
        custo,
        margemPct,
      };
    });
  }, [products, stockMap]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.product.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.product.categoria.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filtroStatus === 'baixos') return item.status === 'baixo';
    if (filtroStatus === 'esgotados') return item.status === 'esgotado';
    return true;
  });

  const totalEsgotados = items.filter((i) => i.status === 'esgotado').length;
  const totalBaixos = items.filter((i) => i.status === 'baixo').length;
  const totalOk = items.filter((i) => i.status === 'ok').length;
  const valorEstoqueCusto = items.reduce((acc, i) => acc + i.qtd * (i.custo || i.product.preco * 0.4), 0);

  const surfaceClass = isDark
    ? 'bg-neutral-900 border-neutral-800 text-white'
    : 'bg-white border-neutral-200 text-neutral-900 shadow-xs';

  const inputClass = isDark
    ? 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500'
    : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400';

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className={`${surfaceClass} border rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-500 uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            <span>Departamento de Estoque, Insumos &amp; CMV</span>
          </div>
          <h2 className={`text-xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Controle de Quantidades, Baixa Automática &amp; Reposição
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Sincronizado por loja. Novos pedidos descontam o estoque automaticamente e pausam itens esgotados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar item no estoque..."
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500 ${inputClass}`}
            />
          </div>
          {(totalBaixos > 0 || totalEsgotados > 0) && (
            <button
              onClick={handleReplenishLowStock}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              title="Repor automaticamente itens com estoque crítico ou zerado"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Repor Críticos ({totalBaixos + totalEsgotados})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className={`${surfaceClass} border rounded-xl p-4 flex items-center justify-between`}>
          <div>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Estoque Normal</span>
            <p className="text-2xl font-black text-emerald-500 mt-0.5">{totalOk} itens</p>
            <span className="text-[11px] text-neutral-500">Prontos para venda</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className={`${surfaceClass} border rounded-xl p-4 flex items-center justify-between`}>
          <div>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Estoque Crítico (Baixo)</span>
            <p className="text-2xl font-black text-amber-500 mt-0.5">{totalBaixos} itens</p>
            <span className="text-[11px] text-amber-500/80">Necessitam reposição</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className={`${surfaceClass} border rounded-xl p-4 flex items-center justify-between`}>
          <div>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Esgotados / Pausados</span>
            <p className="text-2xl font-black text-red-500 mt-0.5">{totalEsgotados} itens</p>
            <span className="text-[11px] text-red-500/80">Ocultos de compra no cardápio</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className={`${surfaceClass} border rounded-xl p-4 flex items-center justify-between`}>
          <div>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Capital em Estoque (CMV)</span>
            <p className="text-2xl font-black text-cyan-500 mt-0.5 font-mono tabular-nums">
              R$ {valorEstoqueCusto.toFixed(0)}
            </p>
            <span className="text-[11px] text-neutral-500">Valor estimado de insumos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center p-1 border rounded-xl text-xs font-bold ${
            isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
          }`}
        >
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filtroStatus === 'todos'
                ? 'bg-orange-500 text-white'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setFiltroStatus('baixos')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filtroStatus === 'baixos'
                ? 'bg-amber-500 text-neutral-950'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Estoque Baixo ({totalBaixos})
          </button>
          <button
            onClick={() => setFiltroStatus('esgotados')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filtroStatus === 'esgotados'
                ? 'bg-red-500 text-white'
                : isDark
                ? 'text-neutral-400 hover:text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Esgotados ({totalEsgotados})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className={`${surfaceClass} border rounded-2xl overflow-hidden shadow-lg`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b uppercase tracking-wider font-bold ${
                isDark
                  ? 'bg-neutral-950/80 border-neutral-800 text-neutral-400'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}
            >
              <tr>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Venda / Margem</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Qtd Atual</th>
                <th className="py-3 px-4 text-center">Mínimo</th>
                <th className="py-3 px-4 text-center">Ajuste Rápido (+ / -)</th>
                <th className="py-3 px-4 text-right">Cardápio</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-neutral-800/80' : 'divide-neutral-200'}`}>
              {filteredItems.map(({ product, qtd, min, unidade, status, margemPct }) => (
                <tr
                  key={product.id}
                  className={`transition ${isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-50'}`}
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={product.foto}
                      alt={product.nome}
                      loading="lazy"
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-950 shrink-0"
                    />
                    <div>
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {product.nome}
                      </p>
                      <p className="text-[11px] text-orange-500 font-semibold capitalize">
                        {product.categoria}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className={`font-bold font-mono tabular-nums ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      R$ {(product.precoPromocional || product.preco).toFixed(2).replace('.', ',')}
                    </div>
                    {margemPct !== null ? (
                      <span
                        className={`text-[10px] font-bold ${
                          margemPct >= 50
                            ? 'text-emerald-500'
                            : margemPct >= 30
                            ? 'text-amber-500'
                            : 'text-red-500'
                        }`}
                      >
                        Margem {margemPct}% (CMV R$ {(product.custoUnitario || 0).toFixed(2).replace('.', ',')})
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400">Sem CMV informado</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        status === 'ok'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : status === 'baixo'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}
                    >
                      {status === 'ok' && <CheckCircle2 className="w-3 h-3" />}
                      {status === 'baixo' && <AlertTriangle className="w-3 h-3" />}
                      {status === 'esgotado' && <TrendingDown className="w-3 h-3" />}
                      {status === 'ok' ? 'Disponível' : status === 'baixo' ? 'Estoque Baixo' : 'Esgotado'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      min="0"
                      value={qtd}
                      onChange={(e) => handleSetExact(product.id, parseInt(e.target.value) || 0)}
                      className={`w-16 text-center py-1 border rounded-lg font-mono font-bold text-sm outline-none focus:border-orange-500 ${inputClass}`}
                    />
                    <span className="text-[10px] text-neutral-500 block mt-0.5">{unidade}s</span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      min="0"
                      value={min}
                      onChange={(e) => handleSetMin(product.id, parseInt(e.target.value) || 0)}
                      className={`w-14 text-center py-1 border rounded-lg font-mono text-xs outline-none focus:border-orange-500 ${inputClass}`}
                      title="Estoque mínimo para alerta"
                    />
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleAdjust(product.id, -5)}
                        className={`p-1 px-2 rounded border font-mono text-[11px] cursor-pointer transition ${
                          isDark
                            ? 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                        }`}
                        title="Subtrair 5"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleAdjust(product.id, -1)}
                        className={`p-1 px-2 rounded border font-mono text-[11px] cursor-pointer transition ${
                          isDark
                            ? 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                        }`}
                        title="Subtrair 1"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleAdjust(product.id, 1)}
                        className={`p-1 px-2 rounded border font-mono text-[11px] cursor-pointer transition ${
                          isDark
                            ? 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                        }`}
                        title="Adicionar 1"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleAdjust(product.id, 10)}
                        className={`p-1 px-2 rounded border font-mono text-[11px] cursor-pointer transition ${
                          isDark
                            ? 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                        }`}
                        title="Adicionar 10"
                      >
                        +10
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onToggleDisponivel(product.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        product.disponivel
                          ? 'bg-emerald-500/10 text-emerald-500 hover:bg-red-500/20 hover:text-red-500 border border-emerald-500/20'
                          : isDark
                          ? 'bg-neutral-800 text-neutral-400 hover:bg-emerald-500/20 hover:text-emerald-400 border border-neutral-700'
                          : 'bg-neutral-200 text-neutral-600 hover:bg-emerald-500/20 hover:text-emerald-600 border border-neutral-300'
                      }`}
                    >
                      {product.disponivel ? 'Ativo no Cardápio' : 'Pausado (Ativar)'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
