import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Store, 
  Palette, 
  CreditCard, 
  UtensilsCrossed, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Rocket, 
  Truck,
  CheckCircle2
} from 'lucide-react';
import { StoreConfig, SegmentId } from '../types';
import { SEGMENTOS_DISPONIVEIS } from '../data/segmentData';
import { PALETAS_CORES_PRESET } from '../data/colorPresets';

interface ClientOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: StoreConfig, loadSampleMenu: boolean) => void;
}

export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [nome, setNome] = useState('Novo Estabelecimento');
  const [segmento, setSegmento] = useState<SegmentId>('hamburgueria');
  const [slogan, setSlogan] = useState('O melhor sabor da cidade entregue na sua porta');
  const [cidade, setCidade] = useState('Tangará da Serra');
  const [bairro, setBairro] = useState('Centro');
  const [whatsapp, setWhatsapp] = useState('5565996953036');

  // Step 2: Branding
  const [paletaId, setPaletaId] = useState('laranja-fogo');
  const [corTema, setCorTema] = useState('#f97316');

  // Step 3: Payments & Delivery
  const [chavePix, setChavePix] = useState('65996953036');
  const [titularPix, setTitularPix] = useState('Max Delivery');
  const [taxaEntrega, setTaxaEntrega] = useState('7.00');
  const [tempoEntrega, setTempoEntrega] = useState('35-50 min');

  // Step 4: Catalog
  const [carregarCardapioModelo, setCarregarCardapioModelo] = useState(true);

  if (!isOpen) return null;

  const handleSelectSegment = (segId: SegmentId) => {
    setSegmento(segId);
    // Sugestão de cores e slogan
    const segInfo = SEGMENTOS_DISPONIVEIS.find((s) => s.id === segId);
    if (segInfo) {
      setCorTema(segInfo.corSecundaria);
      const matchedPalette = PALETAS_CORES_PRESET.find((p) =>
        p.nichoSugerido.toLowerCase().includes(segInfo.nome.toLowerCase().slice(0, 4))
      );
      if (matchedPalette) setPaletaId(matchedPalette.id);
    }
  };

  const handleFinish = () => {
    const newConfig: StoreConfig = {
      segmento,
      nome,
      slogan,
      cidade,
      bairro,
      endereco: 'Rua Principal, 100',
      whatsapp: whatsapp.replace(/\D/g, ''),
      whatsappExibicao: whatsapp,
      corTema,
      taxaEntregaPadrao: parseFloat(taxaEntrega) || 7.00,
      tempoEntrega,
      aberto: true,
      horarioFuncionamento: 'Terça a Domingo das 18h às 23h30',
      cardapioConfirmadoHoje: true,
      ultimaConfirmacao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      pagamentos: {
        pixAtivo: true,
        pixTipo: 'direto',
        pixChave: chavePix,
        pixTipoChave: 'telefone',
        pixTitular: titularPix,
        pixCidade: cidade,
        pixDescontoPct: 5,
        dinheiroAtivo: true,
        perguntarTroco: true,
        cartaoEntregaAtivo: true,
        cartaoDebitoAtivo: true,
        cartaoCreditoAtivo: true,
        bandeirasAceitas: ['Mastercard', 'Visa', 'Elo'],
        valeRefeicaoAtivo: true,
        valesAceitos: ['Alelo', 'VR', 'Sodexo'],
      },
      customizacao: {
        paletaId,
        corPrimaria: corTema,
        corSecundaria: '#ea580c',
        corFundo: '#0a0a0a',
        modoEscuro: true,
        estiloCard: 'moderno',
        mostrarTempoEntrega: true,
        destaqueOfertas: true,
      },
    };

    onComplete(newConfig, carregarCardapioModelo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Assistente de Configuração do Novo Restaurante
              </h2>
              <p className="text-xs text-neutral-400">
                Configure um novo cliente do zero em 4 etapas rápidas.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-neutral-950 border-b border-neutral-800/80 flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Negócio & Nicho' },
            { num: 2, label: 'Identidade & Cores' },
            { num: 3, label: 'Pix & Frete' },
            { num: 4, label: 'Cardápio Inicial' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 ${
                step === s.num
                  ? 'text-orange-400 font-bold'
                  : step > s.num
                  ? 'text-emerald-400 font-medium'
                  : 'text-neutral-500'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                  step === s.num
                    ? 'bg-orange-500 text-white'
                    : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-5">
          
          {/* ETAPA 1: DADOS DO ESTABELECIMENTO */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Nome do Estabelecimento / Restaurante
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Pizzaria Bella Napoli, Max Burguer, etc."
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2">
                  Selecione o Nicho Gastronômico Comercial:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SEGMENTOS_DISPONIVEIS.map((seg) => (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => handleSelectSegment(seg.id)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col items-center justify-center text-center gap-1.5 ${
                        segmento === seg.id
                          ? 'border-orange-500 bg-orange-500/10 text-white shadow-md'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-2xl">{seg.icone}</span>
                      <span className="text-xs font-bold">{seg.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    WhatsApp para Pedidos (com DDD)
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="5565996953036"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Cidade / Bairro
                  </label>
                  <input
                    type="text"
                    value={`${cidade} - ${bairro}`}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade - Bairro"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Slogan Comercial
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ex: Pizzas no Forno a Lenha com Massa Artesanal"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* ETAPA 2: IDENTIDADE VISUAL & PALETA DE CORES */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-neutral-300 mb-1">
                  Escolha a Paleta de Cores do Cardápio:
                </h4>
                <p className="text-xs text-neutral-400 mb-3">
                  As cores serão aplicadas em todos os botões, banners e destaques visuais do cliente.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PALETAS_CORES_PRESET.map((p) => {
                    const isSelected = corTema.toLowerCase() === p.primaria.toLowerCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPaletaId(p.id);
                          setCorTema(p.primaria);
                        }}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-20 relative ${
                          isSelected
                            ? 'border-white bg-neutral-800 ring-2 ring-orange-500/50'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                        }`}
                      >
                        <div
                          className="w-full h-3 rounded mb-2 shadow"
                          style={{ background: p.preview }}
                        />
                        <p className="font-bold text-xs text-white truncate">{p.nome}</p>
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white text-neutral-950 flex items-center justify-center text-[10px] font-black">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">Ajuste Livre de Cor (Hexadecimal)</span>
                  <span className="text-neutral-400">Escolha a cor exata da logo do cliente</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={corTema}
                    onChange={(e) => setCorTema(e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono font-bold text-neutral-300">{corTema}</span>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: PAGAMENTO & FRETE */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>Configuração do Pix Direto (0% de Taxa)</span>
                </div>
                <p className="text-neutral-300 text-xs">
                  O cliente escaneia o Pix ou usa copia-e-cola e o dinheiro cai na hora na conta bancária do restaurante.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1">
                      Chave Pix do Estabelecimento
                    </label>
                    <input
                      type="text"
                      value={chavePix}
                      onChange={(e) => setChavePix(e.target.value)}
                      placeholder="CNPJ, Celular, CPF ou E-mail"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-300 mb-1">
                      Nome do Titular da Conta
                    </label>
                    <input
                      type="text"
                      value={titularPix}
                      onChange={(e) => setTitularPix(e.target.value)}
                      placeholder="Nome do Restaurante ou Sócio"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Taxa de Entrega Padrão (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={taxaEntrega}
                    onChange={(e) => setTaxaEntrega(e.target.value)}
                    placeholder="7.00"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Tempo Médio de Entrega
                  </label>
                  <input
                    type="text"
                    value={tempoEntrega}
                    onChange={(e) => setTempoEntrega(e.target.value)}
                    placeholder="35-50 min"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 4: CARDÁPIO INICIAL */}
          {step === 4 && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                  <span>Cardápio Inicial do Estabelecimento</span>
                </h4>
                <p className="text-neutral-400">
                  Como você deseja inicializar os produtos deste restaurante?
                </p>

                <div className="space-y-2 pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-700 bg-neutral-900 cursor-pointer">
                    <input
                      type="radio"
                      name="modoCardapio"
                      checked={carregarCardapioModelo}
                      onChange={() => setCarregarCardapioModelo(true)}
                      className="mt-1 text-orange-500 focus:ring-orange-500"
                    />
                    <div>
                      <p className="font-bold text-white text-xs">
                        Carregar Cardápio Modelo de {segmento.toUpperCase()} (Recomendado)
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Importa automaticamente produtos com fotos, opcionais e preços de exemplo para demonstração e adaptação rápida.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 cursor-pointer">
                    <input
                      type="radio"
                      name="modoCardapio"
                      checked={!carregarCardapioModelo}
                      onChange={() => setCarregarCardapioModelo(false)}
                      className="mt-1 text-orange-500 focus:ring-orange-500"
                    />
                    <div>
                      <p className="font-bold text-white text-xs">
                        Iniciar com Cardápio Vazio
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Cadastre os produtos um a um manualmente.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Resumo Final */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1.5">
                <span className="font-bold text-neutral-300 block">Resumo do Novo Cliente:</span>
                <p className="text-neutral-400">
                  • <strong>Loja:</strong> {nome} ({segmento})
                </p>
                <p className="text-neutral-400">
                  • <strong>WhatsApp:</strong> {whatsapp}
                </p>
                <p className="text-neutral-400">
                  • <strong>Pix:</strong> {chavePix} ({titularPix})
                </p>
                <p className="text-neutral-400">
                  • <strong>Cor da Marca:</strong>{' '}
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full ml-1"
                    style={{ backgroundColor: corTema }}
                  />{' '}
                  {corTema}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition"
            >
              <span>Avançar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              <Rocket className="w-4 h-4" />
              <span>Concluir e Lançar Restaurante!</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
