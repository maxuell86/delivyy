import React, { useState } from 'react';
import { 
  Star, 
  Copy, 
  Pencil, 
  Trash2, 
  Clock, 
  Layers, 
  Check, 
  X,
  AlertTriangle,
  Boxes,
  TrendingUp
} from 'lucide-react';
import { Product } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleDisponivel: (id: string) => void;
  onToggleDestaque: (id: string) => void;
  onQuickUpdatePrice: (id: string, newPrice: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleDisponivel,
  onToggleDestaque,
  onQuickUpdatePrice,
}) => {
  const { isDark } = useTheme();
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(product.preco.toFixed(2));

  const handleSavePrice = () => {
    const val = parseFloat(priceInput.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onQuickUpdatePrice(product.id, val);
    } else {
      setPriceInput(product.preco.toFixed(2));
    }
    setIsEditingPrice(false);
  };

  const handleCancelPrice = () => {
    setPriceInput(product.preco.toFixed(2));
    setIsEditingPrice(false);
  };

  const handleConfirmDelete = () => {
    if (window.confirm(`Deseja realmente excluir "${product.nome}" do cardápio?`)) {
      onDelete(product.id);
    }
  };

  const totalOpcoes = product.opcoes?.reduce((acc, curr) => acc + curr.itens.length, 0) || 0;
  const hasValidPromo = Boolean(product.precoPromocional && product.precoPromocional > 0 && product.precoPromocional < product.preco);
  const effectivePrice = hasValidPromo ? (product.precoPromocional as number) : product.preco;

  const marginPct =
    product.custoUnitario && product.custoUnitario > 0 && effectivePrice > 0
      ? Math.round(((effectivePrice - product.custoUnitario) / effectivePrice) * 100)
      : null;

  const isLowStock =
    product.controlarEstoque !== false &&
    product.estoqueAtual !== undefined &&
    product.estoqueAtual > 0 &&
    product.estoqueAtual <= (product.estoqueMinimo ?? 5);

  return (
    <div
      className={`group relative border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
        product.disponivel
          ? isDark
            ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 shadow-md hover:shadow-orange-500/5'
            : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md'
          : isDark
          ? 'border-red-900/40 bg-neutral-950/70 opacity-75'
          : 'border-red-200 bg-red-50/40 opacity-80'
      }`}
    >
      {/* Top Image & Floating Badges */}
      <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden">
        <img
          src={product.foto}
          alt={product.nome}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            !product.disponivel ? 'grayscale contrast-75' : ''
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
          <div className="flex flex-wrap gap-1.5 items-center">
            {product.selo && (
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-md">
                {product.selo}
              </span>
            )}
            {hasValidPromo && (
              <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-md">
                PROMO
              </span>
            )}
            {isLowStock && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 shadow-md flex items-center gap-1">
                <Boxes className="w-3 h-3" /> Restam {product.estoqueAtual}
              </span>
            )}
          </div>

          <button
            onClick={() => onToggleDestaque(product.id)}
            className={`p-1.5 rounded-full backdrop-blur-md transition cursor-pointer ${
              product.destaque
                ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/40'
                : 'bg-black/50 text-neutral-300 hover:text-amber-400'
            }`}
            title={product.destaque ? 'Remover dos destaques' : 'Destacar no topo do cardápio'}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Out of stock Banner */}
        {!product.disponivel && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1.5 rounded-xl bg-red-600/90 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border border-red-500 shadow-xl">
              <AlertTriangle className="w-4 h-4" />
              Esgotado / Pausado
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category, PDV Code & Prep time */}
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5 font-medium">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="uppercase tracking-wider font-bold text-orange-500 truncate">
                {product.categoria}
              </span>
              {product.codigoPdv && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[11px] text-neutral-500">{product.codigoPdv}</span>
                </>
              )}
            </div>
            {product.tempoPreparoMin && (
              <span className="flex items-center gap-1 text-neutral-400 shrink-0">
                <Clock className="w-3 h-3 text-neutral-500" />
                ~{product.tempoPreparoMin} min
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3
            className={`text-base font-black group-hover:text-orange-500 transition leading-snug ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}
          >
            {product.nome}
          </h3>

          {/* Product Description */}
          <p className={`text-xs line-clamp-2 mt-1.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {product.descricao}
          </p>

          {/* Technical Sheet Metadata (Weight, Serving Size, Allergens, Margin) */}
          {(product.pesoGramas ||
            product.porcaoPessoas ||
            marginPct !== null ||
            (product.alergenos && product.alergenos.length > 0)) && (
            <div
              className={`mt-2 pt-2 border-t flex flex-wrap items-center gap-1.5 text-[11px] ${
                isDark ? 'border-neutral-800/60 text-neutral-400' : 'border-neutral-200 text-neutral-600'
              }`}
            >
              {product.pesoGramas && (
                <span className={`font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>
                  {product.pesoGramas}
                </span>
              )}
              {product.pesoGramas && product.porcaoPessoas && <span aria-hidden="true">·</span>}
              {product.porcaoPessoas && <span>{product.porcaoPessoas}</span>}
              {marginPct !== null && (
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold ${
                    marginPct >= 50
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : marginPct >= 30
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-red-500/15 text-red-500'
                  }`}
                  title={`Custo: R$ ${(product.custoUnitario || 0).toFixed(2).replace('.', ',')}`}
                >
                  <TrendingUp className="w-3 h-3" /> Margem {marginPct}%
                </span>
              )}
              {product.alergenos && product.alergenos.length > 0 && (
                <span className="text-amber-500 truncate">{product.alergenos.slice(0, 2).join(' · ')}</span>
              )}
            </div>
          )}
        </div>

        {/* Options / Add-ons badge */}
        {product.opcoes && product.opcoes.length > 0 && (
          <div
            className={`mt-3 pt-2.5 border-t flex items-center gap-2 text-xs ${
              isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-neutral-200 text-neutral-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span className={`font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>
              {product.opcoes.length} {product.opcoes.length === 1 ? 'grupo' : 'grupos'} de opções
            </span>
            <span className="text-neutral-500 text-[11px]">
              ({totalOpcoes} adicionais/escolhas)
            </span>
          </div>
        )}

        {/* Price & Availability bar */}
        <div
          className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          }`}
        >
          {/* Price display / quick edit */}
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">
              {hasValidPromo ? 'Preço Promocional' : 'Preço de Venda'}
            </div>
            {isEditingPrice ? (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-neutral-400">R$</span>
                <input
                  type="text"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePrice();
                    if (e.key === 'Escape') handleCancelPrice();
                  }}
                  className={`w-16 px-1.5 py-0.5 rounded text-sm font-bold border border-orange-500 outline-none ${
                    isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-900'
                  }`}
                  autoFocus
                />
                <button
                  onClick={handleSavePrice}
                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                  title="Salvar"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancelPrice}
                  className="p-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div 
                className="flex items-baseline gap-1.5 cursor-pointer group/price"
                onClick={() => setIsEditingPrice(true)}
                title="Clique para editar o preço rapidamente"
              >
                <span className="text-lg font-black text-emerald-500 group-hover/price:text-emerald-400 font-mono tabular-nums">
                  R$ {effectivePrice.toFixed(2).replace('.', ',')}
                </span>
                {hasValidPromo && (
                  <span className="text-xs text-neutral-400 line-through font-mono tabular-nums">
                    R$ {product.preco.toFixed(2).replace('.', ',')}
                  </span>
                )}
                <Pencil className="w-3 h-3 text-neutral-400 opacity-0 group-hover/price:opacity-100 transition" />
              </div>
            )}
          </div>

          {/* Availability Toggle Switch */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-neutral-400 mb-1">
              {product.disponivel ? 'Disponível' : 'Pausado'}
            </span>
            <button
              onClick={() => onToggleDisponivel(product.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                product.disponivel ? 'bg-emerald-500' : isDark ? 'bg-neutral-700' : 'bg-neutral-300'
              }`}
              title={product.disponivel ? 'Marcar como esgotado hoje' : 'Ativar no cardápio'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                  product.disponivel ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div
        className={`px-4 py-2.5 border-t flex items-center justify-between text-xs ${
          isDark
            ? 'bg-neutral-950/60 border-neutral-800/60'
            : 'bg-neutral-50 border-neutral-200/80'
        }`}
      >
        <button
          onClick={() => onEdit(product)}
          className={`flex items-center gap-1.5 font-semibold transition py-1 cursor-pointer ${
            isDark ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'
          }`}
        >
          <Pencil className="w-3.5 h-3.5 text-orange-500" />
          <span>Editar</span>
        </button>

        <button
          onClick={() => onDuplicate(product)}
          className={`flex items-center gap-1.5 font-semibold transition py-1 cursor-pointer ${
            isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-900'
          }`}
          title="Duplicar para criar um novo produto parecido rapidamente"
        >
          <Copy className="w-3.5 h-3.5 text-cyan-500" />
          <span>Duplicar</span>
        </button>

        <button
          onClick={handleConfirmDelete}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-red-500 font-semibold transition py-1 cursor-pointer"
          title="Excluir produto do cardápio"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Excluir</span>
        </button>
      </div>
    </div>
  );
};
