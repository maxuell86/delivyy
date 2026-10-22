import React, { useState } from 'react';
import { X, Percent, DollarSign, ArrowUpRight, Check } from 'lucide-react';
import { CategoryId, Product } from '../types';
import { CATEGORIAS } from '../data/initialProducts';

interface BatchPriceModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onApplyBatchPrice: (categoria: CategoryId | 'todos', modo: 'porcentagem' | 'fixo', valor: number) => void;
}

export const BatchPriceModal: React.FC<BatchPriceModalProps> = ({
  isOpen,
  products,
  onClose,
  onApplyBatchPrice,
}) => {
  const [categoria, setCategoria] = useState<CategoryId | 'todos'>('todos');
  const [modo, setModo] = useState<'porcentagem' | 'fixo'>('porcentagem');
  const [valor, setValor] = useState('5');
  const [previewConfirmed, setPreviewConfirmed] = useState(false);

  if (!isOpen) return null;

  const affectedProducts = products.filter(
    (p) => categoria === 'todos' || p.categoria === categoria
  );

  const numVal = parseFloat(valor.replace(',', '.')) || 0;

  const calculateNewPrice = (current: number) => {
    if (modo === 'porcentagem') {
      return current * (1 + numVal / 100);
    } else {
      return current + numVal;
    }
  };

  const handleApply = () => {
    if (numVal === 0) return;
    onApplyBatchPrice(categoria, modo, numVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              %
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Reajuste de Preços em Lote
              </h2>
              <p className="text-xs text-neutral-400">
                Aumente ou diminua os preços de uma categoria inteira rapidamente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Target category */}
          <div>
            <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
              Aplicar em qual Categoria?
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoryId | 'todos')}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none font-bold"
            >
              <option value="todos">Todas as Categorias ({products.length} itens)</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome} ({products.filter((p) => p.categoria === cat.id).length} itens)
                </option>
              ))}
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
              Tipo de Reajuste
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModo('porcentagem')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  modo === 'porcentagem'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                }`}
              >
                <Percent className="w-4 h-4" />
                <span>Por Porcentagem (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setModo('fixo')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  modo === 'fixo'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Valor Fixo (R$)</span>
              </button>
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
              {modo === 'porcentagem' ? 'Porcentagem de Aumento (%)' : 'Valor a Adicionar (R$)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step={modo === 'porcentagem' ? '1' : '0.5'}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={modo === 'porcentagem' ? 'Ex: 5 ou -5' : 'Ex: 2.00'}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none font-bold"
              />
              <span className="absolute right-3 top-2.5 text-neutral-400 text-xs font-bold">
                {modo === 'porcentagem' ? '%' : 'R$'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Dica: Use valores negativos (ex: -5) se desejar aplicar desconto geral.
            </p>
          </div>

          {/* Live Preview of Changes */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-orange-400" />
              Prévia das Alterações ({affectedProducts.length} itens afetados):
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto text-xs pr-1">
              {affectedProducts.slice(0, 5).map((p) => {
                const novoPreco = calculateNewPrice(p.preco);
                return (
                  <div key={p.id} className="flex justify-between items-center text-neutral-300">
                    <span className="truncate pr-2">{p.nome}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-neutral-500 line-through">
                        R$ {p.preco.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        → R$ {novoPreco.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {affectedProducts.length > 5 && (
                <p className="text-[11px] text-neutral-500 italic text-center pt-1">
                  ...e mais {affectedProducts.length - 5} produtos
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-xs sm:text-sm font-black rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition flex items-center gap-1.5 shadow-md shadow-orange-500/20"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Reajuste Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
