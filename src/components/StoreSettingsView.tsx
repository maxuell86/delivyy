import React, { useState } from 'react';
import { 
  Store, 
  MapPin, 
  Clock, 
  Truck, 
  Zap, 
  Save, 
  Plus, 
  Trash2, 
  Check,
  Building2,
  Calendar
} from 'lucide-react';
import { StoreConfig, DeliveryZone } from '../types';

interface StoreSettingsViewProps {
  storeConfig: StoreConfig;
  onSaveConfig: (updated: StoreConfig) => void;
  showToast: (msg: string) => void;
}

const DIAS_SEMANA = [
  { id: '0', nome: 'Domingo' },
  { id: '1', nome: 'Segunda-feira' },
  { id: '2', nome: 'Terça-feira' },
  { id: '3', nome: 'Quarta-feira' },
  { id: '4', nome: 'Quinta-feira' },
  { id: '5', nome: 'Sexta-feira' },
  { id: '6', nome: 'Sábado' },
];

export const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({
  storeConfig,
  onSaveConfig,
  showToast,
}) => {
  // Brand & Contact
  const [nome, setNome] = useState(storeConfig.nome);
  const [slogan, setSlogan] = useState(storeConfig.slogan);
  const [whatsapp, setWhatsapp] = useState(storeConfig.whatsapp);
  const [whatsappExibicao, setWhatsappExibicao] = useState(storeConfig.whatsappExibicao);
  
  // Address
  const [endereco, setEndereco] = useState(storeConfig.endereco);
  const [bairro, setBairro] = useState(storeConfig.bairro);
  const [cidade, setCidade] = useState(storeConfig.cidade);
  const [taxaEntregaPadrao, setTaxaEntregaPadrao] = useState(storeConfig.taxaEntregaPadrao.toString());
  const [tempoEntrega, setTempoEntrega] = useState(storeConfig.tempoEntrega);
  const [aberto, setAberto] = useState(storeConfig.aberto);

  // Delivery Zones (Faixas por bairro)
  const [faixas, setFaixas] = useState<DeliveryZone[]>(
    storeConfig.faixasEntrega || [
      { nome: 'Perto', preco: 7, tempo: '20-30 min', bairros: ['Jd Buritis', 'Bela Vista', 'Centro', 'Tarumã'] },
      { nome: 'Médio', preco: 10, tempo: '30-45 min', bairros: ['Vila Alta', 'Jardim dos Ipês', 'Morada do Sol'] },
      { nome: 'Longe', preco: 15, tempo: '45-60 min', bairros: ['Distrito Industrial', 'Zona Rural Próxima'] },
    ]
  );

  // Happy Hour / Relâmpago
  const [hhAtivo, setHhAtivo] = useState(storeConfig.happyHour?.ativo ?? true);
  const [hhInicio, setHhInicio] = useState(storeConfig.happyHour?.inicio?.toString() || '18');
  const [hhFim, setHhFim] = useState(storeConfig.happyHour?.fim?.toString() || '19');
  const [hhDescontoPct, setHhDescontoPct] = useState(storeConfig.happyHour?.descontoPct?.toString() || '5');
  const [hhTexto, setHhTexto] = useState(storeConfig.happyHour?.texto || 'Happy Hour: 5% OFF por tempo limitado!');

  // Horários semanais
  const [horariosGrade, setHorariosGrade] = useState<{ [dia: string]: { abre: number; fecha: number } | null }>(
    storeConfig.horariosGrade || {
      '0': { abre: 18, fecha: 24 },
      '1': null, // Fechado às segundas
      '2': { abre: 18, fecha: 24 },
      '3': { abre: 18, fecha: 24 },
      '4': { abre: 18, fecha: 24 },
      '5': { abre: 18, fecha: 24 },
      '6': { abre: 18, fecha: 24 },
    }
  );

  const handleAddFaixa = () => {
    setFaixas([
      ...faixas,
      { nome: 'Nova Faixa', preco: 12, tempo: '35-50 min', bairros: ['Bairro Exemplo'] },
    ]);
  };

  const handleRemoveFaixa = (index: number) => {
    const list = [...faixas];
    list.splice(index, 1);
    setFaixas(list);
  };

  const handleUpdateBairrosText = (index: number, text: string) => {
    const list = [...faixas];
    list[index].bairros = text.split('\n').map((s) => s.trim()).filter(Boolean);
    setFaixas(list);
  };

  const handleToggleDiaAberto = (diaId: string) => {
    setHorariosGrade((prev) => {
      const atual = prev[diaId];
      return {
        ...prev,
        [diaId]: atual ? null : { abre: 18, fecha: 24 },
      };
    });
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: StoreConfig = {
      ...storeConfig,
      nome: nome.trim(),
      slogan: slogan.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      whatsappExibicao: whatsappExibicao.trim(),
      endereco: endereco.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      taxaEntregaPadrao: parseFloat(taxaEntregaPadrao.replace(',', '.')) || 7.0,
      tempoEntrega: tempoEntrega.trim(),
      aberto,
      faixasEntrega: faixas,
      happyHour: {
        ativo: hhAtivo,
        inicio: parseInt(hhInicio) || 18,
        fim: parseInt(hhFim) || 19,
        descontoPct: parseFloat(hhDescontoPct) || 5,
        texto: hhTexto.trim(),
      },
      horariosGrade,
    };

    onSaveConfig(updated);
    showToast('Configurações da loja salvas com sucesso!');
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Painel do Estabelecimento</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Configurações da Loja, Horários &amp; Frete
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Mantenha endereço, taxas por bairro, horário de funcionamento e dados da empresa 100% atualizados.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        
        {/* SECTION 1: MARCA & CONTATO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
            <Building2 className="w-4 h-4 text-orange-400" />
            <span>1. Dados da Empresa &amp; WhatsApp do Delivery</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Nome Comercial da Loja *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Max Hamburguer"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Slogan / Especialidade
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: Hambúrgueres Artesanais na Brasa"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                WhatsApp que Recebe os Pedidos (só dígitos com DDI 55) *
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="5565996953036"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                WhatsApp Formatado para o Cliente Ver
              </label>
              <input
                type="text"
                value={whatsappExibicao}
                onChange={(e) => setWhatsappExibicao(e.target.value)}
                placeholder="(65) 99695-3036"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ENDEREÇO & STATUS DE ABERTURA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>2. Localização &amp; Status de Funcionamento</span>
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-300">
                {aberto ? 'Loja Aberta Agora' : 'Loja Fechada'}
              </span>
              <button
                type="button"
                onClick={() => setAberto(!aberto)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aberto ? 'bg-emerald-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aberto ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Endereço Físico (Rua e Número)
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua B (Lot Bela Vista) Nº 378"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Bairro Sede
              </label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Jd Buritis"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Cidade e Estado (UF)
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Tangará da Serra (MT)"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Taxa de Entrega Padrão (R$)
              </label>
              <input
                type="text"
                value={taxaEntregaPadrao}
                onChange={(e) => setTaxaEntregaPadrao(e.target.value)}
                placeholder="7.00"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-emerald-400 font-bold outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Tempo Médio de Entrega
              </label>
              <input
                type="text"
                value={tempoEntrega}
                onChange={(e) => setTempoEntrega(e.target.value)}
                placeholder="35-50 min"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: FAIXAS DE ENTREGA POR BAIRRO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400" />
                <span>3. Faixas de Entrega &amp; Taxas por Bairro</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                O cliente escolhe o bairro dele e a taxa é calculada automaticamente no carrinho.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddFaixa}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-neutral-700 transition"
            >
              <Plus className="w-3.5 h-3.5 text-orange-400" />
              <span>+ Adicionar Faixa</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {faixas.map((faixa, fIdx) => (
              <div
                key={fIdx}
                className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={faixa.nome}
                      onChange={(e) => {
                        const list = [...faixas];
                        list[fIdx].nome = e.target.value;
                        setFaixas(list);
                      }}
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-bold text-white outline-none"
                    />

                    <div className="flex items-center gap-1">
                      <span className="text-xs text-neutral-400">R$</span>
                      <input
                        type="number"
                        value={faixa.preco}
                        onChange={(e) => {
                          const list = [...faixas];
                          list[fIdx].preco = parseFloat(e.target.value) || 0;
                          setFaixas(list);
                        }}
                        className="w-16 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-bold text-emerald-400 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={faixa.tempo}
                        onChange={(e) => {
                          const list = [...faixas];
                          list[fIdx].tempo = e.target.value;
                          setFaixas(list);
                        }}
                        placeholder="Ex: 20-30 min"
                        className="w-24 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFaixa(fIdx)}
                    className="text-neutral-500 hover:text-red-400 p-1"
                    title="Remover faixa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                    Bairros inclusos nesta faixa (um por linha):
                  </label>
                  <textarea
                    rows={2}
                    value={faixa.bairros.join('\n')}
                    onChange={(e) => handleUpdateBairrosText(fIdx, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 text-xs outline-none focus:border-orange-500"
                    placeholder="Bairro 1&#10;Bairro 2&#10;Bairro 3"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: HORÁRIOS SEMANAIS & HAPPY HOUR */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>4. Grade Semanal de Horários &amp; Promoção Relâmpago</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Days grid */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-neutral-300 block mb-2">Funcionamento por Dia da Semana:</span>
              {DIAS_SEMANA.map((dia) => {
                const j = horariosGrade[dia.id];
                const isAberto = j !== null && j !== undefined;
                return (
                  <div
                    key={dia.id}
                    className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleDiaAberto(dia.id)}
                      className="flex items-center gap-2 font-bold text-white hover:text-orange-400"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          isAberto ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-700'
                        }`}
                      >
                        {isAberto && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>{dia.nome}</span>
                    </button>

                    {isAberto ? (
                      <span className="text-[11px] text-emerald-400 font-bold">
                        {j.abre}h às {j.fecha === 24 ? '00h' : `${j.fecha}h`}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-500 italic">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Happy hour box */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Promoção Relâmpago / Happy Hour
                </span>
                <button
                  type="button"
                  onClick={() => setHhAtivo(!hhAtivo)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    hhAtivo ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      hhAtivo ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {hhAtivo && (
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Início</label>
                      <input
                        type="number"
                        value={hhInicio}
                        onChange={(e) => setHhInicio(e.target.value)}
                        className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Fim</label>
                      <input
                        type="number"
                        value={hhFim}
                        onChange={(e) => setHhFim(e.target.value)}
                        className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Desconto</label>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          value={hhDescontoPct}
                          onChange={(e) => setHhDescontoPct(e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-amber-400 font-bold"
                        />
                        <span className="text-neutral-400 text-[10px]">%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Texto do Banner</label>
                    <input
                      type="text"
                      value={hhTexto}
                      onChange={(e) => setHhTexto(e.target.value)}
                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save button footer */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações da Loja</span>
          </button>
        </div>
      </form>
    </div>
  );
};
