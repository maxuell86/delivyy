import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  DollarSign, 
  QrCode, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Save, 
  Percent,
  Layers,
  Utensils
} from 'lucide-react';
import { PaymentMethodsConfig, StoreConfig } from '../types';

interface PaymentSettingsModalProps {
  isOpen: boolean;
  storeConfig: StoreConfig;
  onClose: () => void;
  onSave: (paymentConfig: PaymentMethodsConfig) => void;
}

export const PaymentSettingsModal: React.FC<PaymentSettingsModalProps> = ({
  isOpen,
  storeConfig,
  onClose,
  onSave,
}) => {
  const current = storeConfig.pagamentos || {
    pixAtivo: true,
    pixTipo: 'direto',
    pixChave: '65996953036',
    pixTipoChave: 'telefone',
    pixTitular: 'MAX HAMBURGUER',
    pixCidade: 'TANGARA DA SERRA',
    pixDescontoPct: 5,
    dinheiroAtivo: true,
    perguntarTroco: true,
    cartaoEntregaAtivo: true,
    cartaoDebitoAtivo: true,
    cartaoCreditoAtivo: true,
    bandeirasAceitas: ['Visa', 'Mastercard', 'Elo'],
    valeRefeicaoAtivo: true,
    valesAceitos: ['Alelo Refeição', 'Sodexo / Pluxee', 'VR', 'Ticket'],
    mercadoPagoPublicKey: '',
  };

  const [activeTab, setActiveTab] = useState<'pix' | 'cartoes' | 'vales' | 'dinheiro' | 'comparativo'>('pix');

  // Form states
  const [pixAtivo, setPixAtivo] = useState(current.pixAtivo);
  const [pixTipo, setPixTipo] = useState<'direto' | 'mercadopago'>(current.pixTipo);
  const [pixChave, setPixChave] = useState(current.pixChave);
  const [pixTipoChave, setPixTipoChave] = useState<'telefone' | 'cpf' | 'cnpj' | 'email' | 'aleatoria'>(current.pixTipoChave);
  const [pixTitular, setPixTitular] = useState(current.pixTitular);
  const [pixCidade, setPixCidade] = useState(current.pixCidade);
  const [pixDescontoPct, setPixDescontoPct] = useState(current.pixDescontoPct.toString());

  const [dinheiroAtivo, setDinheiroAtivo] = useState(current.dinheiroAtivo);
  const [perguntarTroco, setPerguntarTroco] = useState(current.perguntarTroco);

  const [cartaoEntregaAtivo, setCartaoEntregaAtivo] = useState(current.cartaoEntregaAtivo);
  const [cartaoDebitoAtivo, setCartaoDebitoAtivo] = useState(current.cartaoDebitoAtivo);
  const [cartaoCreditoAtivo, setCartaoCreditoAtivo] = useState(current.cartaoCreditoAtivo);
  const [bandeirasAceitas, setBandeirasAceitas] = useState<string[]>(current.bandeirasAceitas);

  const [valeRefeicaoAtivo, setValeRefeicaoAtivo] = useState(current.valeRefeicaoAtivo);
  const [valesAceitos, setValesAceitos] = useState<string[]>(current.valesAceitos);
  const [mercadoPagoPublicKey, setMercadoPagoPublicKey] = useState(current.mercadoPagoPublicKey || '');

  if (!isOpen) return null;

  const toggleBandeira = (bandeira: string) => {
    if (bandeirasAceitas.includes(bandeira)) {
      setBandeirasAceitas(bandeirasAceitas.filter((b) => b !== bandeira));
    } else {
      setBandeirasAceitas([...bandeirasAceitas, bandeira]);
    }
  };

  const toggleVale = (vale: string) => {
    if (valesAceitos.includes(vale)) {
      setValesAceitos(valesAceitos.filter((v) => v !== vale));
    } else {
      setValesAceitos([...valesAceitos, vale]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config: PaymentMethodsConfig = {
      pixAtivo,
      pixTipo,
      pixChave: pixChave.trim(),
      pixTipoChave,
      pixTitular: pixTitular.trim() || 'MAX HAMBURGUER',
      pixCidade: pixCidade.trim() || 'TANGARA DA SERRA',
      pixDescontoPct: parseFloat(pixDescontoPct) || 0,
      dinheiroAtivo,
      perguntarTroco,
      cartaoEntregaAtivo,
      cartaoDebitoAtivo,
      cartaoCreditoAtivo,
      bandeirasAceitas,
      valeRefeicaoAtivo,
      valesAceitos,
      mercadoPagoPublicKey: mercadoPagoPublicKey.trim(),
    };
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              💰
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Gestão de Pagamentos &amp; Pix Direto
              </h2>
              <p className="text-xs text-neutral-400">
                Configure Pix sem taxas, maquininha na entrega, vales refeição e descontos.
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

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-neutral-800 flex gap-2 bg-neutral-950/40 text-xs overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('pix')}
            className={`pb-2.5 px-3 font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'pix' ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>1. Pix (0% Taxas ou Gateway)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cartoes')}
            className={`pb-2.5 px-3 font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'cartoes' ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span>2. Cartões na Entrega</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vales')}
            className={`pb-2.5 px-3 font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'vales' ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            <span>3. Vales Refeição (VR/Alelo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dinheiro')}
            className={`pb-2.5 px-3 font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'dinheiro' ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 text-green-400" />
            <span>4. Dinheiro &amp; Troco</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparativo')}
            className={`pb-2.5 px-3 font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'comparativo' ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Guia Comercial de Pagamentos</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          
          {/* TAB 1: PIX */}
          {activeTab === 'pix' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block">Aceitar Pagamento via Pix</span>
                  <span className="text-xs text-neutral-400">
                    O Pix é o método favorito dos brasileiros e não cobra comissões abusivas.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPixAtivo(!pixAtivo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pixAtivo ? 'bg-emerald-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pixAtivo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {pixAtivo && (
                <div className="space-y-4 pt-1">
                  {/* Pix Mode */}
                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                      Modalidade do Pix:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPixTipo('direto')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          pixTipo === 'direto'
                            ? 'border-emerald-500 bg-emerald-500/10 text-white'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        <span className="font-bold text-xs text-emerald-400 flex items-center gap-1 mb-1">
                          <Zap className="w-3.5 h-3.5" />
                          Pix Direto na Conta (Recomendado)
                        </span>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          0% de taxa. O dinheiro cai na mesma hora na conta do lojista (Nubank, Itaú, etc.) via BRCode automático.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPixTipo('mercadopago')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          pixTipo === 'mercadopago'
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        <span className="font-bold text-xs text-orange-400 flex items-center gap-1 mb-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Gateway Mercado Pago
                        </span>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Confirmação automática via webhook (requer credenciais de API e cobra ~0,99% por transação).
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Pix Key Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                        Tipo da Chave Pix
                      </label>
                      <select
                        value={pixTipoChave}
                        onChange={(e) => setPixTipoChave(e.target.value as any)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs outline-none font-bold"
                      >
                        <option value="telefone">Telefone (Celular com DDD)</option>
                        <option value="cnpj">CNPJ da Empresa</option>
                        <option value="cpf">CPF do Titular</option>
                        <option value="email">E-mail</option>
                        <option value="aleatoria">Chave Aleatória (EVP)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                        Chave Pix do Estabelecimento *
                      </label>
                      <input
                        type="text"
                        value={pixChave}
                        onChange={(e) => setPixChave(e.target.value)}
                        placeholder="Ex: 65996953036 ou contato@maxhamburguer.com"
                        className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs font-mono outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Pix Receiver Name & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                        Nome do Titular da Conta
                      </label>
                      <input
                        type="text"
                        value={pixTitular}
                        onChange={(e) => setPixTitular(e.target.value)}
                        placeholder="Ex: MAX HAMBURGUER LTDA"
                        className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                        Cidade da Conta Bancária
                      </label>
                      <input
                        type="text"
                        value={pixCidade}
                        onChange={(e) => setPixCidade(e.target.value)}
                        placeholder="Ex: TANGARA DA SERRA"
                        className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Pix Discount incentive */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-orange-400" />
                        Desconto de Incentivo para Pagamento no Pix (%):
                      </span>
                      <div className="flex items-center gap-1 w-24">
                        <input
                          type="number"
                          value={pixDescontoPct}
                          onChange={(e) => setPixDescontoPct(e.target.value)}
                          placeholder="5"
                          className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-emerald-400 font-bold text-xs text-right outline-none"
                        />
                        <span className="text-xs font-bold text-neutral-400">%</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Oferecer 5% de desconto no Pix estimula o cliente a pagar à vista, reduz custos de maquininha e elimina riscos de estorno.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CARTÕES NA ENTREGA */}
          {activeTab === 'cartoes' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block">Levar Maquininha na Entrega</span>
                  <span className="text-xs text-neutral-400">
                    O entregador leva a maquininha para passar o cartão no portão do cliente.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCartaoEntregaAtivo(!cartaoEntregaAtivo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    cartaoEntregaAtivo ? 'bg-emerald-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      cartaoEntregaAtivo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {cartaoEntregaAtivo && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cartaoCreditoAtivo}
                        onChange={(e) => setCartaoCreditoAtivo(e.target.checked)}
                        className="rounded text-orange-500 focus:ring-0 bg-neutral-900"
                      />
                      <span className="font-bold text-xs text-white">Cartão de Crédito</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cartaoDebitoAtivo}
                        onChange={(e) => setCartaoDebitoAtivo(e.target.checked)}
                        className="rounded text-orange-500 focus:ring-0 bg-neutral-900"
                      />
                      <span className="font-bold text-xs text-white">Cartão de Débito</span>
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 uppercase block mb-2">
                      Bandeiras Aceitas pela sua Maquininha:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Visa', 'Mastercard', 'Elo', 'Hipercard', 'American Express'].map((bandeira) => {
                        const isSelected = bandeirasAceitas.includes(bandeira);
                        return (
                          <button
                            key={bandeira}
                            type="button"
                            onClick={() => toggleBandeira(bandeira)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
                              isSelected
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                                : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{bandeira}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VALES REFEIÇÃO / ALIMENTAÇÃO */}
          {activeTab === 'vales' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block">Aceitar Vales Refeição &amp; Alimentação</span>
                  <span className="text-xs text-neutral-400">
                    Altamente procurado no almoço, marmitarias, restaurantes e padarias.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setValeRefeicaoAtivo(!valeRefeicaoAtivo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    valeRefeicaoAtivo ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      valeRefeicaoAtivo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {valeRefeicaoAtivo && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-neutral-300 uppercase block mb-1">
                    Selecione quais vales você aceita na maquininha:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Alelo Refeição', 'Sodexo / Pluxee', 'VR Benefícios', 'Ticket Restaurante'].map((vale) => {
                      const isSelected = valesAceitos.includes(vale);
                      return (
                        <button
                          key={vale}
                          type="button"
                          onClick={() => toggleVale(vale)}
                          className={`p-2.5 rounded-xl border text-center transition text-xs font-bold ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                              : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                          }`}
                        >
                          {vale}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    O cliente poderá selecionar a bandeira do vale na hora de fechar o pedido, e o entregador já leva a maquininha compatível configurada.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DINHEIRO & TROCO */}
          {activeTab === 'dinheiro' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block">Aceitar Pagamento em Dinheiro</span>
                  <span className="text-xs text-neutral-400">
                    Permite ao cliente pagar em cédulas no momento da entrega.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDinheiroAtivo(!dinheiroAtivo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    dinheiroAtivo ? 'bg-emerald-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dinheiroAtivo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {dinheiroAtivo && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-200">
                    <input
                      type="checkbox"
                      checked={perguntarTroco}
                      onChange={(e) => setPerguntarTroco(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-0 bg-neutral-900"
                    />
                    <span>Perguntar se precisa de troco automaticamente (Ex: "Troco para R$ 50,00")</span>
                  </label>
                  <p className="text-[11px] text-neutral-400 pl-6 mt-1">
                    Evita que o entregador saia sem troco suficiente, acelerando a entrega.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GUIA COMPARATIVO */}
          {activeTab === 'comparativo' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <span className="font-bold text-white text-xs block">
                  Por que o Pix Direto (BRCode) é o segredo do delivery lucrativo?
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  No delivery tradicional, gateways de pagamento e aplicativos cobram taxas que variam de 1% a 27% em cada venda. Com a nossa solução de **Pix Direto com QR Code EMV**, o cliente copia o código gerado em tempo real, paga diretamente para a conta do restaurante e o lojista recebe 100% do valor na hora, com custo zero por transação.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-neutral-950 border border-emerald-900/30">
                  <span className="font-bold text-emerald-400 block mb-0.5">Pix Direto BRCode</span>
                  <p className="text-[11px] text-neutral-400">Zero taxas, dinheiro imediato, sem intermediários.</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-cyan-900/30">
                  <span className="font-bold text-cyan-400 block mb-0.5">Maquininha na Entrega</span>
                  <p className="text-[11px] text-neutral-400">Conveniente para cartões de crédito, débito e VR.</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-amber-900/30">
                  <span className="font-bold text-amber-400 block mb-0.5">Mercado Pago / Gateway</span>
                  <p className="text-[11px] text-neutral-400">Ideal para quem quer confirmação automática 100% digital.</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Formas de Pagamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
