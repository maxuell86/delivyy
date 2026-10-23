import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpRight,
  TrendingDown,
  Layers,
  Save,
  PackageCheck
} from 'lucide-react';
import { Product, StockItem, StoreConfig } from '../types';

interface InventoryViewProps {
  products: Product[];
  onToggleDisponivel: (id: string) => void;
  showToast: (msg: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onToggleDisponivel,
  showToast,
}) => {
  const [stockMap, setStockMap] = useState<{ [id: string]: { qtd: number; min: number; unidade: string } }>(() => {
    try {
      const saved = localStorage.getItem('omni_inventory_stock');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Inicialização proporcional baseada no cardápio
    const initial: { [id: string]: { qtd: number; min: number; unidade: string } } = {};
    products.forEach((p, idx) => {
      const isLow = idx % 5 === 0;
      const isOut = !p.disponivel;
      const baseQtd = isOut ? 0 : isLow ? 3 : 25 + (idx % 15);
      initial[p.id] = {
        qtd: baseQtd,
        min: 5,
        unidade: p.unidadeMedida || 'unidade',
      };
    });
    return initial;
  });

  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'baixos' | 'esgotados'>('todos');

  const saveStock = (newMap: typeof stockMap) => {
    setStockMap(newMap);
    try {
      localStorage.setItem('omni_inventory_stock', JSON.stringify(newMap));
    } catch (e) {}
  };

  const handleAdjust = (productId: string, delta: number) => {
    const current = stockMap[productId] || { qtd: 10, min: 5, unidade: 'unidade' };
    const newQtd = Math.max(0, current.qtd + delta);
    const updated = {
      ...stockMap,
      [productId]: {
        ...current,
        qtd: newQtd,
      },
    };
    saveStock(updated);

    // Se zerar o estoque e o produto estiver disponível, alertar e pausar
    const prod = products.find((p) => p.id === productId);
    if (newQtd === 0 && prod?.disponivel) {
      onToggleDisponivel(productId);
      showToast(`Estoque zerado! "${prod.nome}" foi pausado no cardápio.`);
    } else {
      showToast(`Estoque atualizado: ${newQtd} ${current.unidade}(s)`);
    }
  };

  const handleSetExact = (productId: string, val: number) => {
    const current = stockMap[productId] || { qtd: 10, min: 5, unidade: 'unidade' };
    const newQtd = Math.max(0, val);
    const updated = {
      ...stockMap,
      [productId]: {
        ...current,
        qtd: newQtd,
      },
    };
    saveStock(updated);
  };

  // Filtragem dos itens de estoque
  const items = useMemo(() => {
    return products.map((p) => {
      const stock = stockMap[p.id] || { qtd: p.disponivel ? 15 : 0, min: 5, unidade: p.unidadeMedida || 'unidade' };
      let status: 'ok' | 'baixo' | 'esgotado' = 'ok';
      if (stock.qtd === 0 || !p.disponivel) {
        status = 'esgotado';
      } else if (stock.qtd <= stock.min) {
        status = 'baixo';
      }

      return {
        product: p,
        qtd: stock.qtd,
        min: stock.min,
        unidade: stock.unidade,
        status,
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            <span>Departamento de Estoque &amp; Insumos</span>
          </div>
          <h2 className="text-xl font-black text-white mt-0.5">
            Controle de Quantidades, Baixas &amp; Reposição
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Evite vender itens indisponíveis. A contagem zera e pausa automaticamente produtos esgotados.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar item no estoque..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-neutral-400">Estoque Normal</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{totalOk} itens</p>
            <span className="text-[11px] text-neutral-500">Prontos para venda</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-neutral-400">Estoque Crítico (Baixo)</span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{totalBaixos} itens</p>
            <span className="text-[11px] text-amber-500/80">Necessitam reposição</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-neutral-400">Esgotados / Pausados</span>
            <p className="text-2xl font-black text-red-400 mt-0.5">{totalEsgotados} itens</p>
            <span className="text-[11px] text-red-500/80">Ocultos no cardápio</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2">
        <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filtroStatus === 'todos' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setFiltroStatus('baixos')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filtroStatus === 'baixos' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Estoque Baixo ({totalBaixos})
          </button>
          <button
            onClick={() => setFiltroStatus('esgotados')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filtroStatus === 'esgotados' ? 'bg-red-500 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Esgotados ({totalEsgotados})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Preço Venda</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Qtd Atual</th>
                <th className="py-3 px-4 text-center">Ajuste Rápido (+ / -)</th>
                <th className="py-3 px-4 text-right">Cardápio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredItems.map(({ product, qtd, min, unidade, status }) => (
                <tr key={product.id} className="hover:bg-neutral-800/40 transition">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={product.foto}
                      alt={product.nome}
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-950 shrink-0"
                    />
                    <div>
                      <p className="font-bold text-white text-sm">{product.nome}</p>
                      <p className="text-[11px] text-neutral-400">
                        Mínimo recomendado: {min} {unidade}s
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-semibold text-neutral-300 capitalize">
                    {product.categoria}
                  </td>

                  <td className="py-3 px-4 font-bold text-white">
                    R$ {product.preco.toFixed(2).replace('.', ',')}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        status === 'ok'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : status === 'baixo'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
                      className="w-16 text-center py-1 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono font-bold text-sm outline-none focus:border-orange-500"
                    />
                    <span className="text-[10px] text-neutral-500 block mt-0.5">{unidade}s</span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleAdjust(product.id, -5)}
                        className="p-1 px-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded border border-neutral-700 font-mono text-[11px]"
                        title="Subtrair 5"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleAdjust(product.id, -1)}
                        className="p-1 px-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded border border-neutral-700 font-mono text-[11px]"
                        title="Subtrair 1"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleAdjust(product.id, 1)}
                        className="p-1 px-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded border border-neutral-700 font-mono text-[11px]"
                        title="Adicionar 1"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleAdjust(product.id, 10)}
                        className="p-1 px-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded border border-neutral-700 font-mono text-[11px]"
                        title="Adicionar 10"
                      >
                        +10
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onToggleDisponivel(product.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                        product.disponivel
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-red-500/20 hover:text-red-400 border border-emerald-500/20'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-emerald-500/20 hover:text-emerald-400 border border-neutral-700'
                      }`}
                    >
                      {product.disponivel ? 'Ativo no Cardápio' : 'Pausar'}
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
