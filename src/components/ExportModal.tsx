import React, { useState } from 'react';
import { X, Download, Copy, Check, FileJson, FileCode, Database, Briefcase } from 'lucide-react';
import { Product, StoreConfig } from '../types';
import { SEGMENTOS_DISPONIVEIS } from '../data/segmentData';

interface ExportModalProps {
  isOpen: boolean;
  products: Product[];
  storeConfig: StoreConfig;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  products,
  storeConfig,
  onClose,
}) => {
  const [activeFormat, setActiveFormat] = useState<'json' | 'config' | 'sql' | 'comercial'>('json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentSegment = storeConfig.segmento || 'hamburgueria';
  const segmentConfig = SEGMENTOS_DISPONIVEIS.find((s) => s.id === currentSegment) || SEGMENTOS_DISPONIVEIS[0];

  // Format 1: produtos.json
  const formattedJson = JSON.stringify(
    products.map((p) => ({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      segmento: p.segmento,
      preco: p.preco,
      precoPromocional: p.precoPromocional || undefined,
      descricao: p.descricao,
      foto: p.foto,
      disponivel: p.disponivel,
      destaque: p.destaque || undefined,
      selo: p.selo || undefined,
      tempoPreparoMin: p.tempoPreparoMin || undefined,
      unidadeMedida: p.unidadeMedida || undefined,
      permiteMeioAMeio: p.permiteMeioAMeio || undefined,
      opcoes: p.opcoes && p.opcoes.length > 0 ? p.opcoes : undefined,
    })),
    null,
    2
  );

  // Format 2: config.js (adapted for active segment)
  const formattedConfig = `// ===============================
// CONFIGURACAO DA LOJA (WHITE-LABEL - ${segmentConfig.nome.toUpperCase()})
// ===============================
window.CONFIG_PADRAO = {
    segmento: "${currentSegment}",
    marca: {
        nome: "${storeConfig.nome}",
        slogan: "${storeConfig.slogan}",
        logo: "imagens/logo.png",
        favicon: "imagens/icons/icon-192.png",
        appleIcon: "imagens/icons/icon-512.png",
        rodape: "© ${storeConfig.nome}",
        credito: "Desenvolvido com Plataforma Delivery Multi-Segmento",
        tagline: "${segmentConfig.icone} <b>Qualidade artesanal e entrega rápida no seu endereço</b>",
        sobre: {
            titulo: "${segmentConfig.icone} Sobre ${storeConfig.nome}",
            paragrafos: [
                "Trabalhamos com ingredientes frescos e selecionados para oferecer a melhor experiência em ${segmentConfig.termoProduto.toLowerCase()}.",
                "Cardápio com preparo ágil e atendimento direto pelo WhatsApp com total comodidade.",
                "Entregamos quentinho no seu endereço em ${storeConfig.cidade} e bairros da região!"
            ]
        }
    },
    contato: {
        whatsapp: "${storeConfig.whatsapp}",
        whatsappExibicao: "${storeConfig.whatsappExibicao}",
        telefone: "${storeConfig.whatsappExibicao}"
    },
    endereco: {
        rua: "${storeConfig.endereco}",
        numero: "",
        bairro: "${storeConfig.bairro}",
        cidade: "${storeConfig.cidade}",
        estado: "MT",
        cep: ""
    },
    horarios: {
        resumo: "${storeConfig.horarioFuncionamento}",
        grade: {
            "0": { abre: 18, fecha: 24 },
            "1": null,
            "2": { abre: 18, fecha: 24 },
            "3": { abre: 18, fecha: 24 },
            "4": { abre: 18, fecha: 24 },
            "5": { abre: 18, fecha: 24 },
            "6": { abre: 18, fecha: 24 }
        },
        happyHour: {
            ativo: true,
            inicio: 18,
            fim: 19,
            descontoPct: 5,
            texto: "Promoção Especial: 5% OFF por tempo limitado!"
        }
    },
    entrega: {
        faixas: [
            { nome: "Perto", preco: ${storeConfig.taxaEntregaPadrao}, tempo: "${storeConfig.tempoEntrega}", bairros: ["${storeConfig.bairro}", "Centro"] }
        ],
        bairroNaoListado: { preco: ${storeConfig.taxaEntregaPadrao + 5}, tempo: "45-60 min" }
    }
};
`;

  // Format 3: SQL for Supabase
  const formattedSql = `-- TABELA DE PRODUTOS MULTI-NICHO PARA SUPABASE
CREATE TABLE IF NOT EXISTS public.produtos_delivery (
    id TEXT PRIMARY KEY,
    segmento TEXT NOT NULL,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    preco_promocional NUMERIC(10,2),
    descricao TEXT,
    foto_url TEXT,
    disponivel BOOLEAN DEFAULT TRUE,
    destaque BOOLEAN DEFAULT FALSE,
    selo TEXT,
    unidade_medida TEXT DEFAULT 'unidade',
    permite_meio_a_meio BOOLEAN DEFAULT FALSE,
    opcoes_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HABILITAR LEITURA PÚBLICA
ALTER TABLE public.produtos_delivery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de produtos" ON public.produtos_delivery FOR SELECT USING (true);
`;

  // Format 4: Commercial Scaling Guide
  const formattedCommercialGuide = `# GUIA COMERCIAL: COMO VENDER E ESCALAR ESTA APLICAÇÃO

Você pode comercializar esta solução como um SaaS White-Label (sua própria plataforma de cardápio digital) para comércios da sua cidade ou região:

1. SEGMENTOS ALVO DE VENDA:
   • Pizzarias (Destaque: Meio a Meio + Bordas + Tamanhos P/M/G)
   • Hamburguerias & Lanchonetes (Destaque: Ponto da carne + Adicionais em cascata)
   • Restaurantes & Marmitarias (Destaque: Escolha de proteína e acompanhamentos do dia)
   • Confeitarias & Docerias (Destaque: Encomendas por kg e fatias do dia)
   • Padarias & Cafeterias (Destaque: Pães, cafés quentes e lanches)
   • Açaí & Sorveterias (Destaque: Copos 300ml a 700ml com frutas)
   • Sushi & Japonês (Destaque: Combinados e temakis)

2. MODELO DE COBRANÇA RECOMENDADO:
   • Taxa de Implantação: R$ 250 a R$ 500 (para cadastrar os primeiros produtos e configurar domínio)
   • Mensalidade Fixa: R$ 79 a R$ 149 / mês por cliente (SEM comissão sobre as vendas)
   • Comparativo de Venda: "Ao contrário do iFood que cobra 12% a 27% sobre todas as vendas, no nosso sistema você recebe os pedidos direto no seu WhatsApp e fica com 100% do lucro!"

3. PROCEDIMENTO DE IMPLANTAÇÃO EM 3 MINUTOS:
   • Passo 1: Abra o painel e selecione o segmento do cliente no botão "Mudar Nicho Comercial".
   • Passo 2: Preencha o Nome, WhatsApp e Endereço dele em "Configurações".
   • Passo 3: Cadastre os produtos ou edite os itens modelos do nicho.
   • Passo 4: Clique em Exportar para salvar o config.js e produtos.json.
   • Passo 5: Hospede no GitHub Pages, Netlify ou Vercel gratuitamente!`;

  const getCurrentContent = () => {
    if (activeFormat === 'json') return formattedJson;
    if (activeFormat === 'config') return formattedConfig;
    if (activeFormat === 'sql') return formattedSql;
    return formattedCommercialGuide;
  };

  const getFileName = () => {
    if (activeFormat === 'json') return 'produtos.json';
    if (activeFormat === 'config') return 'config.js';
    if (activeFormat === 'sql') return 'tabela_produtos.sql';
    return 'manual_comercial_saas.md';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([getCurrentContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
              ↓
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Exportação White-Label ({segmentConfig.nome})
              </h2>
              <p className="text-xs text-neutral-400">
                Gere os arquivos prontos para implantar em qualquer cliente comercial.
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

        {/* Format Selector Tabs */}
        <div className="px-5 pt-3 border-b border-neutral-800 flex gap-2 bg-neutral-950/40 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveFormat('json')}
            className={`pb-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeFormat === 'json'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>produtos.json ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveFormat('config')}
            className={`pb-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeFormat === 'config'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>config.js ({segmentConfig.termoProduto})</span>
          </button>

          <button
            onClick={() => setActiveFormat('sql')}
            className={`pb-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeFormat === 'sql'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>SQL Supabase</span>
          </button>

          <button
            onClick={() => setActiveFormat('comercial')}
            className={`pb-2 px-3 font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeFormat === 'comercial'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>Manual Comercial SaaS</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Arquivo <code className="text-orange-400 font-mono">{getFileName()}</code>:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-bold flex items-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-bold flex items-center gap-1.5 transition shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar</span>
              </button>
            </div>
          </div>

          <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-[11px] leading-relaxed max-h-[50vh] overflow-auto">
            {getCurrentContent()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
