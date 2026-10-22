import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles,
  Zap,
  TrendingUp,
  Building2,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';
import { Product, StoreConfig } from '../types';
import { SEGMENTOS_DISPONIVEIS } from '../data/segmentData';

interface DiagnosticViewProps {
  products: Product[];
  storeConfig: StoreConfig;
  onOpenExport: () => void;
  onOpenSegmentModal: () => void;
}

export const DiagnosticView: React.FC<DiagnosticViewProps> = ({
  products,
  storeConfig,
  onOpenExport,
  onOpenSegmentModal,
}) => {
  const currentSegment = storeConfig.segmento || 'hamburgueria';
  const segmentConfig = SEGMENTOS_DISPONIVEIS.find((s) => s.id === currentSegment) || SEGMENTOS_DISPONIVEIS[0];
  const [copiedScript, setCopiedScript] = useState(false);

  const pitchVenda = `Olá [Nome do Dono do Restaurante]! Tudo bem?

Vi que vocês atendem muito delivery aqui na cidade. Vocês sabiam que o iFood chega a cobrar até 27% de comissão em cada pedido que vocês recebem?

Nós desenvolvemos um Cardápio Digital próprio no WhatsApp para o seu negócio:
✅ Sem comissão sobre suas vendas (você fica com 100% do lucro)
✅ O cliente escolhe tamanhos, complementos e adicionais com cálculo automático
✅ O pedido chega pronto e formatado no WhatsApp da sua loja
✅ QR Code de Pix integrado e pagamento na entrega
✅ Aplicativo leve que não precisa baixar na Play Store (PWA)

Gostaria de ver uma demonstração gratuita montada especialmente com o cardápio de vocês hoje?`;

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-gradient-to-r from-orange-950/40 via-neutral-900 to-amber-950/30 border border-orange-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Plataforma White-Label Comercial de Delivery</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Como Escalar Comercialmente para Qualquer Comércio
        </h2>
        <p className="text-neutral-300 text-sm mt-2 leading-relaxed max-w-3xl">
          Transformamos sua aplicação em uma <b className="text-white">plataforma SaaS multi-segmento</b>. Agora você pode atender e vender este sistema para qualquer estabelecimento alimentício: pizzarias, hamburguerias, marmitarias, confeitarias, padarias e açaiteiras com regras e complementos customizáveis.
        </p>

        {/* Current active segment indicator */}
        <div className="mt-5 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{segmentConfig.icone}</span>
            <div>
              <p className="text-xs text-neutral-400 font-semibold uppercase">Segmento Ativo no Momento:</p>
              <h4 className="text-base font-black text-white">{segmentConfig.nome}</h4>
            </div>
          </div>

          <button
            onClick={onOpenSegmentModal}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow"
          >
            <span>Trocar Nicho Comercial (Multi-Nicho)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Segments matrix */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-orange-400" />
          <span>Os 7 Nichos Atendidos pela sua Plataforma:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {SEGMENTOS_DISPONIVEIS.map((seg) => (
            <div
              key={seg.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                currentSegment === seg.id
                  ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500'
                  : 'bg-neutral-950 border-neutral-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{seg.icone}</span>
                  {currentSegment === seg.id && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-500 text-white">
                      Em uso
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white">{seg.nome}</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {seg.descricao}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-neutral-800 text-[11px] text-orange-400 font-semibold">
                Opcionais: {seg.regrasExclusivas.gruposOpcionaisSugeridos.slice(0, 2).join(' • ')}...
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commercial Model & Monetization */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span>Modelo de Negócio Recomendado para Escalar (SaaS)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
              1. Taxa de Implantação
            </span>
            <p className="text-xl font-black text-white">R$ 250 a R$ 500</p>
            <p className="text-neutral-400 leading-relaxed">
              Cobrada uma única vez para cadastrar o cardápio do restaurante, colocar a logo e conectar o WhatsApp dele.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
              2. Mensalidade Recorrente
            </span>
            <p className="text-xl font-black text-white">R$ 79 a R$ 149 /mês</p>
            <p className="text-neutral-400 leading-relaxed">
              Com apenas 10 clientes na sua cidade, você garante R$ 1.000 a R$ 1.500 de renda passiva mensal recorrente.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 block">
              3. Argumento de Venda Matador
            </span>
            <p className="text-sm font-bold text-white">0% de Comissão</p>
            <p className="text-neutral-400 leading-relaxed">
              O restaurante economiza milhares de reais por mês que pagaria ao iFood em taxas abusivas.
            </p>
          </div>
        </div>

        {/* Ready to use Sales Pitch */}
        <div className="pt-3 border-t border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-orange-400" />
              Script de Vendas Pronto para WhatsApp / Instagram:
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(pitchVenda);
                setCopiedScript(true);
                setTimeout(() => setCopiedScript(false), 2500);
              }}
              className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
            >
              {copiedScript ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Script Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Mensagem de Venda</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            {pitchVenda}
          </pre>
        </div>
      </div>
    </div>
  );
};
