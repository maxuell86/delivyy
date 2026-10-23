import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Eye, 
  Check, 
  Image as ImageIcon, 
  Layout, 
  Save, 
  Undo,
  Sliders,
  Type,
  Smartphone,
  Sun,
  Moon
} from 'lucide-react';
import { StoreConfig, CustomizationConfig } from '../types';
import { PALETAS_CORES_PRESET } from '../data/colorPresets';
import { useTheme } from '../context/ThemeContext';

interface CustomizationViewProps {
  storeConfig: StoreConfig;
  onSaveConfig: (updated: StoreConfig) => void;
  showToast: (msg: string) => void;
  onOpenSimulator?: () => void;
}

export const CustomizationView: React.FC<CustomizationViewProps> = ({
  storeConfig,
  onSaveConfig,
  showToast,
  onOpenSimulator,
}) => {
  const { isDark } = useTheme();
  const customizacaoAtual: CustomizationConfig = storeConfig.customizacao || {
    corPrimaria: storeConfig.corTema || '#f97316',
    corSecundaria: '#ea580c',
    corFundo: '#0a0a0a',
    modoEscuro: true,
    estiloCard: 'moderno',
    mensagemBoasVindas: 'Peça online com entrega rápida e rastreio via WhatsApp!',
    mostrarTempoEntrega: true,
    destaqueOfertas: true,
  };

  const [corPrimaria, setCorPrimaria] = useState(customizacaoAtual.corPrimaria);
  const [corSecundaria, setCorSecundaria] = useState(customizacaoAtual.corSecundaria);
  const [modoEscuro, setModoEscuro] = useState<boolean>(customizacaoAtual.modoEscuro ?? true);
  const [estiloCard, setEstiloCard] = useState<'moderno' | 'classico' | 'compacto'>(
    customizacaoAtual.estiloCard
  );
  const [mensagemBoasVindas, setMensagemBoasVindas] = useState(
    customizacaoAtual.mensagemBoasVindas || ''
  );
  const [logoUrl, setLogoUrl] = useState(customizacaoAtual.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(customizacaoAtual.bannerUrl || '');
  const [mostrarTempoEntrega, setMostrarTempoEntrega] = useState(
    customizacaoAtual.mostrarTempoEntrega
  );
  const [destaqueOfertas, setDestaqueOfertas] = useState(
    customizacaoAtual.destaqueOfertas
  );

  const handleApplyPreset = (presetId: string) => {
    const preset = PALETAS_CORES_PRESET.find((p) => p.id === presetId);
    if (!preset) return;
    setCorPrimaria(preset.primaria);
    setCorSecundaria(preset.secundaria);
    showToast(`Paleta "${preset.nome}" aplicada para visualização!`);
  };

  const handleSave = () => {
    const updatedCustomizacao: CustomizationConfig = {
      corPrimaria,
      corSecundaria,
      corFundo: modoEscuro ? '#0a0a0a' : '#f8fafc',
      modoEscuro,
      estiloCard,
      mensagemBoasVindas,
      logoUrl: logoUrl.trim() || undefined,
      bannerUrl: bannerUrl.trim() || undefined,
      mostrarTempoEntrega,
      destaqueOfertas,
    };

    const updatedConfig: StoreConfig = {
      ...storeConfig,
      corTema: corPrimaria,
      customizacao: updatedCustomizacao,
    };

    onSaveConfig(updatedConfig);
    showToast('Identidade visual, tema e cores salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl shadow-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-500 uppercase tracking-wider">
            <Palette className="w-4 h-4" />
            <span>Departamento de Design &amp; Identidade Visual</span>
          </div>
          <h2 className={`text-xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Personalização de Cores, Marca &amp; Estilo do Cardápio
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Adapte a interface às cores oficiais de {storeConfig.nome} para fortalecer a identidade do restaurante.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                isDark 
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700' 
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
              }`}
            >
              <Smartphone className="w-4 h-4 text-orange-500" />
              <span>Ver no Simulador</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section: Tema Padrão do Cardápio do Cliente */}
          <div className={`p-5 rounded-2xl shadow-lg border space-y-4 transition-colors ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  {modoEscuro ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span>Tema Padrão do Cardápio do Cliente</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Escolha como o cardápio mobile deve se abrir inicialmente para os clientes no WhatsApp ou QR Code.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModoEscuro(true)}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between relative ${
                  modoEscuro
                    ? 'border-orange-500 bg-neutral-950 ring-2 ring-orange-500/30 shadow-md text-white'
                    : isDark ? 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300' : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-neutral-800 text-purple-300">
                      <Moon className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-xs">Modo Escuro (Dark)</span>
                  </div>
                  {modoEscuro && (
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Fundo dark sofisticado e imersivo. Destaca cores quentes, fotos de hambúrgueres e carnes nobres.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-orange-400 font-semibold">
                  <span>Recomendado para hamburguerias &amp; pubs</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setModoEscuro(false)}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between relative ${
                  !modoEscuro
                    ? 'border-orange-500 bg-white ring-2 ring-orange-500/30 shadow-md text-neutral-900'
                    : isDark ? 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300' : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <Sun className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-xs">Modo Claro (Clean)</span>
                  </div>
                  {!modoEscuro && (
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Fundo branco puro e minimalista. Leitura suave e alta claridade sob luz do dia.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                  <span>Excelente para cafeterias, açaí &amp; docerias</span>
                </div>
              </button>
            </div>
            <p className={`text-[11px] italic ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
              * Nota: Os clientes sempre poderão alternar manualmente o tema no botão superior do cardápio mobile caso prefiram.
            </p>
          </div>

          {/* Section 1: Presets de Cores por Nicho Comercial */}
          <div className={`p-5 rounded-2xl shadow-lg border space-y-4 transition-colors ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Paletas de Cores Prontas (Presets Comerciais)</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Clique para aplicar uma harmonia de cores testada para cada nicho gastronômico.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PALETAS_CORES_PRESET.map((p) => {
                const isSelected = corPrimaria.toLowerCase() === p.primaria.toLowerCase();
                return (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPreset(p.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-24 relative overflow-hidden group ${
                      isSelected
                        ? isDark ? 'border-white bg-neutral-800 ring-2 ring-orange-500/50 shadow-md' : 'border-neutral-900 bg-neutral-100 ring-2 ring-orange-500/50 shadow-md'
                        : isDark ? 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/60' : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white'
                    }`}
                  >
                    <div
                      className="w-full h-3 rounded-md mb-2 shadow-sm"
                      style={{ background: p.preview }}
                    />
                    <div>
                      <p className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>{p.nome}</p>
                      <p className={`text-[10px] truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{p.nichoSugerido}</p>
                    </div>

                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Personalização Fina de Cores (Hex & Pickers) */}
          <div className={`p-5 rounded-2xl shadow-lg border space-y-4 transition-colors ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
          }`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <Sliders className="w-4 h-4 text-orange-500" />
              <span>Ajuste Fino de Cores (Código Hexadecimal)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cor Primária */}
              <div className={`p-3.5 border rounded-xl space-y-2 ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <label className={`text-xs font-semibold flex items-center justify-between ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  <span>Cor Principal (Destaques &amp; Botões)</span>
                  <span className="text-[11px] font-mono opacity-80">{corPrimaria}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={corPrimaria}
                    onChange={(e) => setCorPrimaria(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={corPrimaria}
                    onChange={(e) => setCorPrimaria(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg text-xs font-mono outline-none focus:border-orange-500 ${
                      isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                    }`}
                    placeholder="#f97316"
                  />
                </div>
              </div>

              {/* Cor Secundária */}
              <div className={`p-3.5 border rounded-xl space-y-2 ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <label className={`text-xs font-semibold flex items-center justify-between ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  <span>Cor Secundária (Gradientes &amp; Bordas)</span>
                  <span className="text-[11px] font-mono opacity-80">{corSecundaria}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={corSecundaria}
                    onChange={(e) => setCorSecundaria(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={corSecundaria}
                    onChange={(e) => setCorSecundaria(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg text-xs font-mono outline-none focus:border-orange-500 ${
                      isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                    }`}
                    placeholder="#ea580c"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Estilo dos Cards & Exibição */}
          <div className={`p-5 rounded-2xl shadow-lg border space-y-4 transition-colors ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
          }`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <Layout className="w-4 h-4 text-emerald-500" />
              <span>Estilo Visual dos Produtos no Cardápio</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setEstiloCard('moderno')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  estiloCard === 'moderno'
                    ? 'border-orange-500 bg-orange-500/10'
                    : isDark ? 'border-neutral-800 bg-neutral-950 hover:border-neutral-700' : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                }`}
              >
                <div>
                  <p className={`font-bold text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>Moderno (Cards)</p>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Foto ampla no topo com preço em destaque e botão de adicionar.
                  </p>
                </div>
                <span className="text-[10px] text-orange-500 font-semibold mt-3">Recomendado</span>
              </button>

              <button
                onClick={() => setEstiloCard('classico')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  estiloCard === 'classico'
                    ? 'border-orange-500 bg-orange-500/10'
                    : isDark ? 'border-neutral-800 bg-neutral-950 hover:border-neutral-700' : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                }`}
              >
                <div>
                  <p className={`font-bold text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>Clássico (Horizontal)</p>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Texto à esquerda com foto retangular ao lado direito estilo iFood.
                  </p>
                </div>
                <span className={`text-[10px] font-semibold mt-3 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Tradicional</span>
              </button>

              <button
                onClick={() => setEstiloCard('compacto')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  estiloCard === 'compacto'
                    ? 'border-orange-500 bg-orange-500/10'
                    : isDark ? 'border-neutral-800 bg-neutral-950 hover:border-neutral-700' : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                }`}
              >
                <div>
                  <p className={`font-bold text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>Compacto (Lista)</p>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Ideal para cardápios extensos, pizzas e marmitex rápidos.
                  </p>
                </div>
                <span className={`text-[10px] font-semibold mt-3 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Alta Densidade</span>
              </button>
            </div>

            <div className={`pt-2 border-t flex flex-col sm:flex-row gap-4 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
              <label className={`flex items-center gap-2 cursor-pointer text-xs ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                <input
                  type="checkbox"
                  checked={mostrarTempoEntrega}
                  onChange={(e) => setMostrarTempoEntrega(e.target.checked)}
                  className="rounded border-neutral-600 text-orange-500 focus:ring-orange-500"
                />
                <span>Mostrar tempo de entrega no topo ({storeConfig.tempoEntrega})</span>
              </label>

              <label className={`flex items-center gap-2 cursor-pointer text-xs ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                <input
                  type="checkbox"
                  checked={destaqueOfertas}
                  onChange={(e) => setDestaqueOfertas(e.target.checked)}
                  className="rounded border-neutral-600 text-orange-500 focus:ring-orange-500"
                />
                <span>Exibir selos de desconto e itens recomendados</span>
              </label>
            </div>
          </div>

          {/* Section 4: Textos de Boas-vindas & Links de Imagens */}
          <div className={`p-5 rounded-2xl shadow-lg border space-y-4 transition-colors ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
          }`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <Type className="w-4 h-4 text-blue-500" />
              <span>Mensagem de Boas-Vindas &amp; Imagens da Loja</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Mensagem de Boas-Vindas no Cardápio
                </label>
                <input
                  type="text"
                  value={mensagemBoasVindas}
                  onChange={(e) => setMensagemBoasVindas(e.target.value)}
                  placeholder="Ex: Sejam bem-vindos! Peça online e receba quentinho."
                  className={`w-full px-3.5 py-2.5 border rounded-xl outline-none focus:border-orange-500 ${
                    isDark ? 'bg-neutral-950 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    URL do Logotipo da Loja (Opcional)
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                    className={`w-full px-3.5 py-2.5 border rounded-xl outline-none focus:border-orange-500 ${
                      isDark ? 'bg-neutral-950 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    URL da Imagem de Capa/Banner (Opcional)
                  </label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className={`w-full px-3.5 py-2.5 border rounded-xl outline-none focus:border-orange-500 ${
                      isDark ? 'bg-neutral-950 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`sticky top-24 p-5 rounded-2xl shadow-lg border space-y-4 transition-colors ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-neutral-800' : 'border-neutral-200'
            }`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                <Eye className="w-4 h-4 text-orange-500" />
                <span>Pré-Visualização em Tempo Real</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  modoEscuro ? 'bg-neutral-800 text-purple-300' : 'bg-amber-100 text-amber-800'
                }`}>
                  {modoEscuro ? '🌙 Dark' : '☀️ Light'}
                </span>
                <span className="text-[11px] font-mono opacity-70">
                  {corPrimaria}
                </span>
              </div>
            </div>

            {/* Simulated Mobile Cardápio Interface (Reflecting modoEscuro) */}
            <div className={`rounded-2xl overflow-hidden shadow-2xl border transition-colors ${
              modoEscuro ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              {/* Store Header Banner Preview */}
              <div
                className="p-4 text-white relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full">
                    Aberto Agora
                  </span>
                  {mostrarTempoEntrega && (
                    <span className="text-[11px] bg-black/30 px-2 py-0.5 rounded-full">
                      ⏱ {storeConfig.tempoEntrega}
                    </span>
                  )}
                </div>

                <h4 className="text-base font-black tracking-tight">{storeConfig.nome}</h4>
                <p className="text-xs text-white/90 line-clamp-1">{storeConfig.slogan}</p>
                <p className="text-[10px] text-white/80 mt-1 italic line-clamp-1">
                  "{mensagemBoasVindas || 'Peça online com praticidade!'}"
                </p>
              </div>

              {/* Sample Product Card Preview */}
              <div className="p-4 space-y-3">
                <div className={`text-[11px] font-semibold uppercase tracking-wider ${
                  modoEscuro ? 'text-neutral-400' : 'text-slate-500'
                }`}>
                  Como o cliente vê o produto ({modoEscuro ? 'Modo Escuro' : 'Modo Claro'}):
                </div>

                {estiloCard === 'moderno' ? (
                  /* Modern Card */
                  <div className={`rounded-xl overflow-hidden shadow-sm border transition-colors ${
                    modoEscuro ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-md'
                  }`}>
                    <div className="h-28 bg-neutral-800 relative">
                      <img
                        src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80"
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      {destaqueOfertas && (
                        <span
                          className="absolute top-2 left-2 text-[10px] font-black text-white px-2 py-0.5 rounded shadow"
                          style={{ backgroundColor: corPrimaria }}
                        >
                          Mais Pedido ⭐
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h5 className={`font-bold text-xs ${modoEscuro ? 'text-white' : 'text-slate-900'}`}>Exemplo: Especial da Casa</h5>
                      <p className={`text-[11px] line-clamp-1 mt-0.5 ${modoEscuro ? 'text-neutral-400' : 'text-slate-600'}`}>
                        Blend suculento, queijo derretido, molho secreto e adicionais.
                      </p>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className="font-black text-sm"
                          style={{ color: corPrimaria }}
                        >
                          R$ 34,90
                        </span>
                        <button
                          className="px-3 py-1 text-white text-xs font-bold rounded-lg shadow-sm transition"
                          style={{
                            background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`,
                          }}
                        >
                          Adicionar +
                        </button>
                      </div>
                    </div>
                  </div>
                ) : estiloCard === 'classico' ? (
                  /* Classic Horizontal */
                  <div className={`rounded-xl p-3 flex gap-3 items-center border transition-colors ${
                    modoEscuro ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-bold text-xs ${modoEscuro ? 'text-white' : 'text-slate-900'}`}>Exemplo: Especial da Casa</h5>
                      <p className={`text-[11px] line-clamp-1 mt-0.5 ${modoEscuro ? 'text-neutral-400' : 'text-slate-600'}`}>
                        Blend suculento, queijo derretido e molho secreto.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-black text-xs" style={{ color: corPrimaria }}>
                          R$ 34,90
                        </span>
                        <button
                          className="px-2 py-0.5 text-white text-[11px] font-bold rounded"
                          style={{ backgroundColor: corPrimaria }}
                        >
                          Pedir
                        </button>
                      </div>
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80"
                      alt="Preview"
                      className="w-16 h-16 rounded-lg object-cover bg-neutral-800 shrink-0"
                    />
                  </div>
                ) : (
                  /* Compact List */
                  <div className={`rounded-xl p-2.5 flex items-center justify-between border transition-colors ${
                    modoEscuro ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <p className={`font-bold text-xs ${modoEscuro ? 'text-white' : 'text-slate-900'}`}>Exemplo: Especial da Casa</p>
                      <span className="font-black text-xs" style={{ color: corPrimaria }}>
                        R$ 34,90
                      </span>
                    </div>
                    <button
                      className="px-2.5 py-1 text-white text-xs font-bold rounded-lg"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Bottom WhatsApp Checkout Button Preview */}
                <div className="pt-2">
                  <div
                    className="w-full py-2.5 px-3 rounded-xl text-center text-xs font-black text-white shadow-md flex items-center justify-center gap-1.5"
                    style={{
                      background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`,
                    }}
                  >
                    <span>Finalizar Pedido via WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                isDark 
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700' 
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
              }`}
            >
              <Save className="w-4 h-4 text-orange-500" />
              <span>Salvar esta Paleta &amp; Estilo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
