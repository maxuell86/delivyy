import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  Flame, 
  Store,
  Sparkles
} from 'lucide-react';
import { Product, StoreConfig } from '../types';

interface DailyChecklistModalProps {
  isOpen: boolean;
  products: Product[];
  storeConfig: StoreConfig;
  onClose: () => void;
  onConfirmMenu: (updatedProducts: Product[], message: string) => void;
  onToggleDisponivel: (id: string) => void;
}

export const DailyChecklistModal: React.FC<DailyChecklistModalProps> = ({
  isOpen,
  products,
  storeConfig,
  onClose,
  onConfirmMenu,
  onToggleDisponivel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);

  // Selected burger of the day for promo message
  const [burgerDestaque, setBurgerDestaque] = useState(
    products.find((p) => p.destaque)?.nome || products[0]?.nome || 'Burger Especial da Casa'
  );

  if (!isOpen) return null;

  const totalDisponiveis = products.filter((p) => p.disponivel).length;
  const esgotados = products.filter((p) => !p.disponivel);

  const generateBroadcastMessage = () => {
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

    return `🔥 *CARDÁPIO CONFIRMADO - ${storeConfig.nome.toUpperCase()}* 🔥

${saudacao}, Tangará da Serra! A chapa já está quente e nosso delivery está *ABERTO* e a todo vapor! 🍔🚀

⭐ *DESTAQUE DE HOJE:*
👉 *${burgerDestaque}*
Preparado no pão brioche dourado, blend artesanal suculento e ingredientes fresquinhos!

📋 *CARDÁPIO ONLINE COMPLETO:*
👉 Peça com rapidez e acompanhe pelo WhatsApp:
https://maxhamburguer.github.io/app-delivery-max-hamburguer/

🛵 *ENTREGA RÁPIDA:*
• Bairros atendidos: Jardim Buritis e toda região
• Tempo médio: ${storeConfig.tempoEntrega}
• Formas de pagamento: Pix, Cartão ou Dinheiro

Garanta o seu antes que esgote! 😋`;
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generateBroadcastMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFinalConfirm = () => {
    onConfirmMenu(products, generateBroadcastMessage());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              ✓
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Checklist Diário: Confirmar Cardápio de Hoje
              </h2>
              <p className="text-xs text-neutral-400">
                Rotina de 2 minutos para abrir o delivery com 100% de segurança.
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

        {/* Step Progress Bar */}
        <div className="px-5 pt-3 pb-2 bg-neutral-950/40 border-b border-neutral-800/80 flex items-center justify-between text-xs">
          <button
            onClick={() => setStep(1)}
            className={`font-bold pb-1 flex items-center gap-1.5 border-b-2 transition ${
              step === 1 ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400'
            }`}
          >
            <span>1. Conferir Estoque</span>
          </button>

          <button
            onClick={() => setStep(2)}
            className={`font-bold pb-1 flex items-center gap-1.5 border-b-2 transition ${
              step === 2 ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400'
            }`}
          >
            <span>2. Destaque do Dia</span>
          </button>

          <button
            onClick={() => setStep(3)}
            className={`font-bold pb-1 flex items-center gap-1.5 border-b-2 transition ${
              step === 3 ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400'
            }`}
          >
            <span>3. Disparo WhatsApp</span>
          </button>
        </div>

        {/* Step Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
                <span className="font-bold text-white block mb-0.5">
                  Itens Disponíveis Hoje: {totalDisponiveis} de {products.length}
                </span>
                <p className="text-neutral-400">
                  Desative qualquer hambúrguer, bebida ou combo que faltou insumo para hoje.
                </p>
              </div>

              {esgotados.length > 0 && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                  <span className="font-bold text-red-400 block mb-1">
                    ⚠️ {esgotados.length} itens marcados como esgotados:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {esgotados.map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-300 text-[11px] font-semibold"
                      >
                        {p.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fast stock review list */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">🍔</span>
                      <span className="font-bold text-white truncate">{p.nome}</span>
                      <span className="text-neutral-400 text-[11px]">
                        R$ {p.preco.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleDisponivel(p.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        p.disponivel
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {p.disponivel ? 'Disponível' : 'Esgotado'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
                <span className="font-bold text-white block mb-0.5">
                  Defina o Hambúrguer Estrela da Noite
                </span>
                <p className="text-neutral-400">
                  Ele ganhará destaque na mensagem automática de WhatsApp e no topo do cardápio para os clientes.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                  Escolha o Hambúrguer em Foco:
                </label>
                <select
                  value={burgerDestaque}
                  onChange={(e) => setBurgerDestaque(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none font-bold"
                >
                  {products
                    .filter((p) => p.categoria === 'hamburgueres' || p.categoria === 'combos')
                    .map((p) => (
                      <option key={p.id} value={p.nome}>
                        {p.nome} (R$ {p.preco.toFixed(2).replace('.', ',')})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 text-xs space-y-2">
                <span className="font-bold text-orange-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Dica de Vendas Max Delivery:
                </span>
                <p className="text-neutral-300 leading-relaxed">
                  Colocar combos ou hambúrgueres artesanais com bacon em destaque costuma aumentar o faturamento em até 25% por causa do ticket médio mais alto.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Texto Pronto para Lista de Transmissão / Grupos:
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="flex items-center gap-1 text-orange-400 font-bold hover:text-orange-300"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Texto Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Mensagem</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {generateBroadcastMessage()}
              </pre>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  Ao confirmar, seu cardápio receberá o selo "Confirmado Hoje" no painel.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2)}
                className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
              >
                Voltar
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as 2 | 3)}
                className="px-5 py-2 text-xs sm:text-sm font-black rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition"
              >
                Próximo Passo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="px-6 py-2 text-xs sm:text-sm font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Cardápio de Hoje</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
