import React, { useState } from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  Copy, 
  Check, 
  Globe, 
  Smartphone, 
  Download, 
  FileCode, 
  Server, 
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Volume2,
  QrCode,
  DollarSign,
  Store,
  Users,
  CheckSquare,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { StoreConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import { playOrderChime } from '../utils/soundAlert';

interface ProductionDeployGuideProps {
  storeConfig: StoreConfig;
  onOpenExport: () => void;
}

export const ProductionDeployGuide: React.FC<ProductionDeployGuideProps> = ({
  storeConfig,
  onOpenExport,
}) => {
  const { isDark } = useTheme();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'onboarding' | 'hosting' | 'pwa' | 'testing'>('onboarding');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-2xl shadow-xl border relative overflow-hidden transition-colors ${
        isDark 
          ? 'bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-teal-950/30 border-emerald-500/30' 
          : 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-200'
      }`}>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Rocket className="w-4 h-4" />
          <span>Guia Oficial de Engenharia de Software &amp; Implantação em Cliente Real</span>
        </div>
        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          Roteiro de Implantação Turnkey (Do Zero ao Primeiro Pedido)
        </h2>
        <p className={`text-sm mt-2 leading-relaxed max-w-3xl ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
          Este sistema foi arquitetado como uma aplicação web progressiva (PWA) de alto desempenho, desacoplada, resiliente a falhas de internet e com sincronização instantânea. Siga o passo a passo abaixo para implantar no estabelecimento do cliente com 100% de segurança.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenExport}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Pacote de Dados (produtos.json + config.js)</span>
          </button>

          <button
            onClick={() => playOrderChime()}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition ${
              isDark 
                ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border-neutral-700' 
                : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300 shadow-sm'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-500" />
            <span>Testar Campainha da Cozinha</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border transition-colors ${
        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
      }`}>
        <button
          onClick={() => setActiveStepTab('onboarding')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeStepTab === 'onboarding'
              ? 'bg-emerald-500 text-white shadow-md'
              : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>1. Passo a Passo do Zero</span>
        </button>

        <button
          onClick={() => setActiveStepTab('hosting')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeStepTab === 'hosting'
              ? 'bg-emerald-500 text-white shadow-md'
              : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>2. Hospedagem &amp; Domínio</span>
        </button>

        <button
          onClick={() => setActiveStepTab('pwa')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeStepTab === 'pwa'
              ? 'bg-emerald-500 text-white shadow-md'
              : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>3. PWA &amp; Celular do Cliente</span>
        </button>

        <button
          onClick={() => setActiveStepTab('testing')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeStepTab === 'testing'
              ? 'bg-emerald-500 text-white shadow-md'
              : isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>4. Smoke Test Final</span>
        </button>
      </div>

      {/* TAB CONTENT 1: ROTEIRO PASSO A PASSO DO ZERO */}
      {activeStepTab === 'onboarding' && (
        <div className={`p-5 sm:p-6 rounded-2xl shadow-lg border space-y-6 transition-colors ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <div>
            <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Roteiro de Onboarding em um Cliente Real (Passo a Passo)</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Siga estas 5 etapas cronológicas para entregar o sistema funcionando em menos de 1 hora no restaurante.
            </p>
          </div>

          <div className="space-y-4">
            {/* ETAPA 1 */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start gap-4 transition-colors ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-500 font-black flex items-center justify-center shrink-0 text-sm">
                01
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Dados Oficiais &amp; WhatsApp do Estabelecimento
                  </h4>
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded">
                    Aba Loja &amp; Frete
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Insira o WhatsApp oficial de atendimento com DDI e DDD (ex: <code className="text-orange-500 font-semibold">{storeConfig.whatsapp}</code>). Configure o nome comercial, slogan e horário de funcionamento.
                </p>
              </div>
            </div>

            {/* ETAPA 2 */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start gap-4 transition-colors ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 font-black flex items-center justify-center shrink-0 text-sm">
                02
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Chave Pix Direta do Lojista (Zero Intermediários e Zero Taxas)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">
                    Botão Pagamentos &amp; Pix
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Cadastre a chave Pix (CNPJ, CPF ou celular) e o nome do titular da conta. O sistema gera automaticamente o payload oficial EMVco BRCode com QR Code dinâmico e chave Copia e Cola para pagamento instantâneo.
                </p>
              </div>
            </div>

            {/* ETAPA 3 */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start gap-4 transition-colors ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-500 font-black flex items-center justify-center shrink-0 text-sm">
                03
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Cardápio, Fotos &amp; Cores da Identidade Visual
                  </h4>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded">
                    Abas Cardápio &amp; Customizar
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Cadastre os produtos por categoria com valores reais. Na aba <b>Customizar</b>, escolha a paleta de cores (ex: Laranja Smash, Vermelho Burguer, Verde Saudável) e selecione o tema padrão do cardápio (Dark ou Light).
                </p>
              </div>
            </div>

            {/* ETAPA 4 */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start gap-4 transition-colors ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-500 font-black flex items-center justify-center shrink-0 text-sm">
                04
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Instalação da Tela KDS na Cozinha com Campainha Ativa
                  </h4>
                  <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded">
                    Aba KDS Cozinha
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Abra a aba <b>KDS Cozinha</b> no tablet, notebook ou PC da cozinha/chapeiro. O sino sonoro acústico (587Hz / 880Hz) tocará automaticamente sempre que um cliente fechar um pedido, garantindo que nenhum pedido passe despercebido.
                </p>
              </div>
            </div>

            {/* ETAPA 5 */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start gap-4 transition-colors ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-500 font-black flex items-center justify-center shrink-0 text-sm">
                05
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Divulgação: Link na Bio do Instagram &amp; QR Code de Mesa
                  </h4>
                  <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider bg-teal-500/10 px-2 py-0.5 rounded">
                    Go-Live
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Coloque o link direto no Instagram do estabelecimento. Para mesas e balcão, imprima o QR Code para os clientes pedirem diretamente pelo próprio celular sem precisar aguardar o garçom.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: HOSPEDAGEM & DOMÍNIO */}
      {activeStepTab === 'hosting' && (
        <div className={`p-5 sm:p-6 rounded-2xl shadow-lg border space-y-5 transition-colors ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <div>
            <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <Globe className="w-5 h-5 text-cyan-500" />
              <span>Opções de Hospedagem Profissional (Zero Custo de Servidor)</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Por ser um app estático ultrarrápido compilado em Vite + React + Tailwind, a hospedagem tem custo R$ 0,00 e suporta milhares de acessos simultâneos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Vercel / Netlify */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block mb-1.5">
                  Recomendado para Produção
                </span>
                <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>Vercel ou Netlify</h4>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Conecte seu repositório Git ou faça upload da pasta <code>dist</code>. O deploy é instantâneo com CDN global e SSL automático.
                </p>
              </div>
              <div className={`pt-2 border-t text-[11px] ${isDark ? 'border-neutral-800 text-neutral-300' : 'border-slate-200 text-neutral-700'}`}>
                Custo: <b>R$ 0,00</b> no plano Hobby
              </div>
            </div>

            {/* GitHub Pages */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-500 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 inline-block mb-1.5">
                  Repositório Próprio
                </span>
                <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>GitHub Pages</h4>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Suba o código no seu repositório GitHub e ative o GitHub Pages na aba Settings &gt; Pages.
                </p>
              </div>
              <div className={`pt-2 border-t text-[11px] ${isDark ? 'border-neutral-800 text-neutral-300' : 'border-slate-200 text-neutral-700'}`}>
                Custo: <b>R$ 0,00</b>
              </div>
            </div>

            {/* Domínio Próprio */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 inline-block mb-1.5">
                  Marca Própria
                </span>
                <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>Domínio .com.br</h4>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Aponte seu domínio próprio (ex: <code>pedir.hamburgueria.com.br</code>) via registro CNAME no painel do Registro.br ou Cloudflare.
                </p>
              </div>
              <div className={`pt-2 border-t text-[11px] ${isDark ? 'border-neutral-800 text-neutral-300' : 'border-slate-200 text-neutral-700'}`}>
                Investimento: ~R$ 40/ano no Registro.br
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: PWA & INSTALAÇÃO */}
      {activeStepTab === 'pwa' && (
        <div className={`p-5 sm:p-6 rounded-2xl shadow-lg border space-y-4 transition-colors ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <div>
            <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <Smartphone className="w-5 h-5 text-purple-500" />
              <span>Instalação PWA no Celular dos Clientes e Funcionários</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              O cliente não precisa baixar nada da Play Store ou App Store. O aplicativo abre direto e cria atalho na tela inicial.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`font-bold block text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                No Android (Chrome / Samsung Internet):
              </span>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Ao abrir o link do cardápio, surge o botão ou banner automático: <b>"Instalar Aplicativo"</b>. O ícone fica salvo entre os aplicativos do celular, abre em tela cheia e carrega instantaneamente mesmo em conexões lentas 4G/3G.
              </p>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`font-bold block text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                No iPhone / iPad (Safari):
              </span>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                O cliente clica no ícone de compartilhamento do Safari (o quadrado com a seta para cima) e seleciona <b>"Adicionar à Tela de Início"</b>. O app ganha ícone na tela de início do iOS e roda sem barras de navegação.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: SMOKE TEST FINAL */}
      {activeStepTab === 'testing' && (
        <div className={`p-5 sm:p-6 rounded-2xl shadow-lg border space-y-5 transition-colors ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <div>
            <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <CheckSquare className="w-5 h-5 text-emerald-500" />
              <span>Checklist de Homologação (Smoke Test Pré-Inauguração)</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Execute esta checagem de 3 minutos para garantir que o restaurante está 100% pronto para atender pedidos reais:
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
              isDark ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}>
              <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500" />
              <div>
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  1. Teste de Pedido no WhatsApp da Loja
                </span>
                <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Simule um pedido com 1 lanche e 1 refrigerante. Confirme se a mensagem formatada chega corretamente no WhatsApp configurado.
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
              isDark ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}>
              <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500" />
              <div>
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  2. Teste do QR Code Pix de R$ 1,00
                </span>
                <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Abra o aplicativo bancário no celular e leia o QR Code Pix ou utilize a chave Copia e Cola para testar uma transferência teste de R$ 1,00.
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
              isDark ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}>
              <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500" />
              <div>
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  3. Teste de Campainha e Fluxo KDS na Cozinha
                </span>
                <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Verifique se a tela da cozinha emite o toque acústico sonoro e se o pedido se move de "Aguardando" para "Em Preparo" e "Pronto".
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
              isDark ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}>
              <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500" />
              <div>
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  4. Alternância de Temas Claro e Escuro
                </span>
                <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Alterne o tema no botão Sun/Moon do painel e no simulador mobile para validar legibilidade dos textos e contraste com a identidade visual.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
