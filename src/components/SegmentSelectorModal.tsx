import React, { useState } from 'react';
import { X, Check, Sparkles, Building2, Layers, ArrowRight } from 'lucide-react';
import { SegmentId, SegmentConfig } from '../types';
import { SEGMENTOS_DISPONIVEIS, PRODUTOS_PRESETS_SEGMENTO } from '../data/segmentData';

interface SegmentSelectorModalProps {
  isOpen: boolean;
  currentSegment: SegmentId;
  onClose: () => void;
  onSelectSegment: (segmentId: SegmentId, loadSampleData: boolean) => void;
}

export const SegmentSelectorModal: React.FC<SegmentSelectorModalProps> = ({
  isOpen,
  currentSegment,
  onClose,
  onSelectSegment,
}) => {
  const [selected, setSelected] = useState<SegmentId>(currentSegment);
  const [loadSampleProducts, setLoadSampleProducts] = useState(true);

  if (!isOpen) return null;

  const currentConfig = SEGMENTOS_DISPONIVEIS.find((s) => s.id === selected) || SEGMENTOS_DISPONIVEIS[0];

  const handleApply = () => {
    onSelectSegment(selected, loadSampleProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-lg font-black">
              🏪
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Personalização Multi-Nicho &amp; White-Label Comercial
              </h2>
              <p className="text-xs text-neutral-400">
                Adapte a aplicação para qualquer tipo de delivery com regras de negócio específicas.
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
        <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Segments Grid */}
          <div>
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
              Escolha o Segmento Comercial do Estabelecimento:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SEGMENTOS_DISPONIVEIS.map((seg) => {
                const isCurrent = selected === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setSelected(seg.id)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isCurrent
                        ? 'border-orange-500 bg-orange-500/10 shadow-md shadow-orange-500/10 ring-1 ring-orange-500'
                        : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-2xl">{seg.icone}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                            Ativo
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-sm text-white">{seg.nome}</h4>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {seg.descricao}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-800/80 text-[10px] text-neutral-400 font-semibold">
                      Tipo de item: <span className="text-neutral-200">{seg.termoProduto}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Business Rules details for selected segment */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Regras e Recursos Ativados para {currentConfig.nome}:
            </span>
            <ul className="text-neutral-300 space-y-1 pl-4 list-disc marker:text-orange-500 text-[11px]">
              {currentConfig.regrasExclusivas.permiteMeioAMeio && (
                <li>
                  <b className="text-white">Meio a Meio Inteligente:</b> cliente pode dividir 2 sabores na mesma pizza com cálculo automático pelo maior valor.
                </li>
              )}
              {currentConfig.regrasExclusivas.permiteTamanhos && (
                <li>
                  <b className="text-white">Seleção de Tamanhos:</b> Broto (25cm), Média (30cm), Grande (35cm) e Família (40cm).
                </li>
              )}
              <li>
                <b className="text-white">Presets de Opcionais Sugeridos:</b> {currentConfig.regrasExclusivas.gruposOpcionaisSugeridos.join(' • ')}.
              </li>
              <li>
                <b className="text-white">Cálculo de Carrinho &amp; WhatsApp:</b> Formatado especificamente para a linguagem desse comércio.
              </li>
            </ul>
          </div>

          {/* Sample Catalog Checkbox */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={loadSampleProducts}
                onChange={(e) => setLoadSampleProducts(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-neutral-900 border-neutral-700 mt-0.5"
              />
              <div>
                <span className="font-bold text-white block">
                  Carregar Cardápio Modelo de Demonstração deste Nicho
                </span>
                <span className="text-neutral-400 text-[11px] leading-relaxed">
                  Substitui os itens atuais por um cardápio completo com fotos profissionais, categorias e adicionais do segmento selecionado (ideal para demonstrações comerciais e novos clientes).
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-neutral-400 hover:text-white transition font-semibold"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Ativar {currentConfig.nome}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
