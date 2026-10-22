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
  ExternalLink
} from 'lucide-react';
import { StoreConfig } from '../types';

interface ProductionDeployGuideProps {
  storeConfig: StoreConfig;
  onOpenExport: () => void;
}

export const ProductionDeployGuide: React.FC<ProductionDeployGuideProps> = ({
  storeConfig,
  onOpenExport,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-teal-950/30 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Rocket className="w-4 h-4" />
          <span>Guia Oficial de Implantação &amp; Produção</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          O que você precisa para Colocar em Produção
        </h2>
        <p className="text-neutral-300 text-sm mt-2 leading-relaxed max-w-3xl">
          Como a aplicação é um PWA moderno de alto desempenho, ela não depende de servidores caros. Você pode publicá-la gratuitamente ou conectar seu próprio domínio (.com.br) em menos de 10 minutos.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenExport}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Pacote para Produção (produtos.json + config.js)</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CHECKLIST PRÉ-PRODUÇÃO */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>1. Checklist Obrigatório de Configuração (5 Minutos)</span>
        </h3>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center flex-shrink-0 text-xs">
              ✓
            </span>
            <div>
              <h4 className="font-bold text-white text-sm">WhatsApp de Recebimento de Pedidos</h4>
              <p className="text-neutral-400 text-xs mt-0.5">
                Certifique-se de que o número cadastrado nas configurações está com DDI + DDD (ex: <code className="text-orange-400">{storeConfig.whatsapp}</code>).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center flex-shrink-0 text-xs">
              ✓
            </span>
            <div>
              <h4 className="font-bold text-white text-sm">Chave Pix do Estabelecimento</h4>
              <p className="text-neutral-400 text-xs mt-0.5">
                Cadastre a chave Pix no botão <b>"Pagamentos &amp; Pix"</b> no topo. O código BRCode gerado enviará o dinheiro 100% direto para o lojista com 0% de taxas.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center flex-shrink-0 text-xs">
              ✓
            </span>
            <div>
              <h4 className="font-bold text-white text-sm">Faixas de Entrega e Bairros</h4>
              <p className="text-neutral-400 text-xs mt-0.5">
                Na aba <b>"Loja &amp; Frete"</b>, ajuste os bairros atendidos e a taxa de frete cobrada para sua cidade.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center flex-shrink-0 text-xs">
              ✓
            </span>
            <div>
              <h4 className="font-bold text-white text-sm">Teste de Pedido no Simulador</h4>
              <p className="text-neutral-400 text-xs mt-0.5">
                Vá na aba <b>"Simulador do Cliente"</b>, adicione 1 item ao carrinho e clique em <i>"Enviar Pedido no WhatsApp da Loja"</i> para confirmar se o texto abre perfeitamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ONDE HOSPEDAR (3 OPÇÕES GRÁTIS E PROFISSIONAIS) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>2. Opções de Hospedagem Recomendadas (100% Grátis)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Option A: Netlify / Vercel */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block mb-1.5">
                Mais Fácil (Recomendado)
              </span>
              <h4 className="text-sm font-black text-white">Netlify / Vercel</h4>
              <p className="text-neutral-400 text-[11px] mt-1 leading-relaxed">
                Você pode simplesmente arrastar a pasta do projeto para o site do Netlify e ter um link online em 30 segundos (com certificado SSL grátis).
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-300">
              Custo: <b>R$ 0,00</b> para sempre
            </div>
          </div>

          {/* Option B: GitHub Pages */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 inline-block mb-1.5">
                Já Configurado no Projeto
              </span>
              <h4 className="text-sm font-black text-white">GitHub Pages</h4>
              <p className="text-neutral-400 text-[11px] mt-1 leading-relaxed">
                Basta subir os arquivos para seu repositório no GitHub e ativar o Pages nas configurações do repositório.
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-300">
              Custo: <b>R$ 0,00</b> para sempre
            </div>
          </div>

          {/* Option C: Domínio Próprio */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 inline-block mb-1.5">
                Mais Profissional
              </span>
              <h4 className="text-sm font-black text-white">Domínio Próprio (.com.br)</h4>
              <p className="text-neutral-400 text-[11px] mt-1 leading-relaxed">
                Conecte seu domínio (ex: <code className="text-orange-400">pedir.maxhamburguer.com.br</code>) nas configurações do Netlify ou GitHub Pages apontando o CNAME.
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-300">
              Registro: ~R$ 40/ano no Registro.br
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PWA (COMO O CLIENTE INSTALA COMO APLICATIVO) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
          <Smartphone className="w-4 h-4 text-purple-400" />
          <span>3. Instalação no Celular do Cliente (PWA)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="font-bold text-white block">No Android (Google Chrome):</span>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Ao abrir o link do cardápio, o navegador exibe o banner: <i>"Instalar Max Hamburguer"</i>. O app ganha ícone na tela inicial e abre em tela cheia como se fosse baixado na Google Play!
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
            <span className="font-bold text-white block">No iPhone / iPad (Safari):</span>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              O cliente clica no botão de compartilhamento do Safari e seleciona <b>"Adicionar à Tela de Início"</b>. O ícone fica salvo no iPhone e abre instantaneamente sem barra de endereço.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
