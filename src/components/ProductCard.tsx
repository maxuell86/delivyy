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
  AlertTriangle
} from 'lucide-react';
import { Product } from '../types';

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

  const totalOpcoes = product.opcoes?.reduce((acc, curr) => acc + curr.itens.length, 0) || 0;

  return (
    <div
      className={`group relative bg-neutral-900 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
        product.disponivel
          ? 'border-neutral-800 hover:border-neutral-700 shadow-md hover:shadow-orange-500/5'
          : 'border-red-900/40 bg-neutral-950/70 opacity-75'
      }`}
    >
      {/* Top Image & Floating Badges */}
      <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden">
        <img
          src={product.foto}
          alt={product.nome}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            !product.disponivel ? 'grayscale contrast-75' : ''
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
          <div className="flex flex-wrap gap-1.5 items-center">
            {product.selo && (
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500 text-white shadow-md">
                {product.selo}
              </span>
            )}
            {product.precoPromocional && (
              <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-md">
                PROMO
              </span>
            )}
          </div>

          <button
            onClick={() => onToggleDestaque(product.id)}
            className={`p-1.5 rounded-full backdrop-blur-md transition ${
              product.destaque
                ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/40'
                : 'bg-black/50 text-neutral-400 hover:text-amber-400'
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
              <span className="uppercase tracking-wider font-bold text-orange-400 truncate">
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
          <h3 className="text-base font-black text-white group-hover:text-orange-400 transition leading-snug">
            {product.nome}
          </h3>

          {/* Product Description */}
          <p className="text-xs text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
            {product.descricao}
          </p>

          {/* Technical Sheet Metadata (Weight, Serving Size, Allergens) */}
          {(product.pesoGramas || product.porcaoPessoas || (product.alergenos && product.alergenos.length > 0)) && (
            <div className="mt-2 pt-2 border-t border-neutral-800/60 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
              {product.pesoGramas && <span className="font-semibold text-neutral-300">{product.pesoGramas}</span>}
              {product.pesoGramas && product.porcaoPessoas && <span aria-hidden="true">·</span>}
              {product.porcaoPessoas && <span>{product.porcaoPessoas}</span>}
              {product.alergenos && product.alergenos.length > 0 && (
                <>
                  {(product.pesoGramas || product.porcaoPessoas) && <span aria-hidden="true">·</span>}
                  <span className="text-amber-400/90 truncate">{product.alergenos.slice(0, 2).join(' · ')}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Options / Add-ons badge */}
        {product.opcoes && product.opcoes.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center gap-2 text-xs text-neutral-400">
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-semibold text-neutral-300">
              {product.opcoes.length} {product.opcoes.length === 1 ? 'grupo' : 'grupos'} de opções
            </span>
            <span className="text-neutral-500 text-[11px]">
              ({totalOpcoes} adicionais/escolhas)
            </span>
          </div>
        )}

        {/* Price & Availability bar */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
          {/* Price display / quick edit */}
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">Preço de Venda</div>
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
                  className="w-16 px-1.5 py-0.5 bg-neutral-800 text-white rounded text-sm font-bold border border-orange-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSavePrice}
                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                  title="Salvar"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancelPrice}
                  className="p-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded"
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
                <span className="text-lg font-black text-emerald-400 group-hover/price:text-emerald-300">
                  R$ {product.preco.toFixed(2).replace('.', ',')}
                </span>
                {product.precoPromocional && (
                  <span className="text-xs text-neutral-500 line-through">
                    R$ {product.precoPromocional.toFixed(2).replace('.', ',')}
                  </span>
                )}
                <Pencil className="w-3 h-3 text-neutral-500 opacity-0 group-hover/price:opacity-100 transition" />
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                product.disponivel ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
              title={product.disponivel ? 'Marcar como esgotado hoje' : 'Ativar no cardápio'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  product.disponivel ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="px-4 py-2.5 bg-neutral-950/60 border-t border-neutral-800/60 flex items-center justify-between text-xs">
        <button
          onClick={() => onEdit(product)}
          className="flex items-center gap-1.5 text-neutral-300 hover:text-white font-semibold transition py-1"
        >
          <Pencil className="w-3.5 h-3.5 text-orange-400" />
          <span>Editar</span>
        </button>

        <button
          onClick={() => onDuplicate(product)}
          className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 font-semibold transition py-1"
          title="Duplicar para criar um novo produto parecido rapidamente"
        >
          <Copy className="w-3.5 h-3.5 text-cyan-400" />
          <span>Duplicar</span>
        </button>

        <button
          onClick={() => onDelete(product.id)}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-red-400 font-semibold transition py-1"
          title="Excluir produto do cardápio"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Excluir</span>
        </button>
      </div>
    </div>
  );
};
