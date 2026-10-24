import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  QrCode,
  Share2,
  Smartphone,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Instagram,
  Printer,
  Sparkles,
  Store,
  ChefHat,
  Trash2,
  CloudUpload,
  Users,
  Power,
  Building2,
  Eye,
} from 'lucide-react';
import { StoreConfig } from '../types';

interface ProductionDeployGuideProps {
  storeConfig: StoreConfig;
  productsCount?: number;
  onOpenExport: () => void;
  onOpenOnboarding?: () => void;
  onOpenTeamModal?: () => void;
  onOpenPublicStorefront?: () => void;
  onOpenKdsMode?: () => void;
  onToggleStoreOpen?: () => void;
  onForceSyncCloud?: () => void;
  onClearDemoOrders?: () => void;
}

export const ProductionDeployGuide: React.FC<ProductionDeployGuideProps> = ({
  storeConfig,
  productsCount = 0,
  onOpenExport,
  onOpenOnboarding,
  onOpenTeamModal,
  onOpenPublicStorefront,
  onOpenKdsMode,
  onToggleStoreOpen,
  onForceSyncCloud,
  onClearDemoOrders,
}) => {
  const [copiedMenuLink, setCopiedMenuLink] = useState(false);
  const [copiedKdsLink, setCopiedKdsLink] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedWhatsappGreeting, setCopiedWhatsappGreeting] = useState(false);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maxdelivery.app';
  const storeParam = storeConfig.id && storeConfig.id !== 'default' ? `&loja=${encodeURIComponent(storeConfig.id)}` : '';
  const publicMenuUrl = `${originUrl}/?modo=cardapio${storeParam}`;
  const kdsDirectUrl = `${originUrl}/?modo=kds${storeParam}`;

  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>({
    step1: true,
    step2: true,
    step3: Boolean(storeConfig.pagamentos?.pixChave || storeConfig.whatsapp),
    step4: false,
    step5: false,
  });

  const toggleStep = (key: string) => {
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const progressPct = Math.round(
    (Object.values(completedSteps).filter(Boolean).length / Object.keys(completedSteps).length) * 100
  );

  const bioTemplate = `🍔 ${storeConfig.nome} | ${storeConfig.slogan}
📍 ${storeConfig.bairro} - ${storeConfig.cidade}
⏰ ${storeConfig.horarioFuncionamento}
👇 Peça agora no nosso Cardápio Digital (Desconto no PIX):
${publicMenuUrl}`;

  const whatsappAutoReply = `Olá! Seja muito bem-vindo(a) ao *${storeConfig.nome}*! 😍

Para fazer seu pedido de forma rápida, ver fotos, escolher adicionais e pagar com *PIX (com desconto)*, Cartão ou Dinheiro, acesse nosso Cardápio Digital Oficial:

👉 ${publicMenuUrl}

Assim que finalizar, seu pedido cai direto na nossa cozinha! Qualquer dúvida estamos por aqui.`;

  const handleCopy = (text: string, type: 'menu' | 'kds' | 'bio' | 'wa') => {
    navigator.clipboard.writeText(text);
    if (type === 'menu') {
      setCopiedMenuLink(true);
      setTimeout(() => setCopiedMenuLink(false), 2500);
    } else if (type === 'kds') {
      setCopiedKdsLink(true);
      setTimeout(() => setCopiedKdsLink(false), 2500);
    } else if (type === 'bio') {
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 2500);
    } else {
      setCopiedWhatsappGreeting(true);
      setTimeout(() => setCopiedWhatsappGreeting(false), 2500);
    }
  };

  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(
    publicMenuUrl
  )}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* HERO: CENTRAL DE OPERAÇÃO EM PRODUÇÃO REAL */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-neutral-900 to-neutral-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <Rocket className="w-3.5 h-3.5" />
              <span>Central de Produção &amp; Go-Live Comercial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Implantação em Estabelecimento Real: {storeConfig.nome}
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Tudo pronto para iniciar a operação real. Configure os dados do cliente, limpe os pedidos de teste,
              compartilhe o <strong>Link Público do Cardápio</strong> na bio do Instagram/WhatsApp e abra o{' '}
              <strong>Monitor KDS</strong> no computador ou tablet da cozinha.
            </p>
          </div>

          {/* Store Live Status & 1-Click Toggle */}
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-5 min-w-[260px] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase">Status da Loja Online</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5 ${
                  storeConfig.aberto
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    storeConfig.aberto ? 'bg-emerald-400 animate-ping' : 'bg-red-500'
                  }`}
                />
                {storeConfig.aberto ? 'ABERTA AGORA' : 'FECHADA'}
              </span>
            </div>

            <div className="text-xs text-neutral-400 space-y-1">
              <p>
                <strong className="text-white">WhatsApp:</strong> {storeConfig.whatsappExibicao || storeConfig.whatsapp}
              </p>
              <p>
                <strong className="text-white">Chave PIX:</strong>{' '}
                {storeConfig.pagamentos?.pixChave || storeConfig.whatsapp}
              </p>
              <p>
                <strong className="text-white">Catálogo Cloud:</strong> {productsCount} itens sincronizados
              </p>
            </div>

            {onToggleStoreOpen && (
              <button
                onClick={onToggleStoreOpen}
                className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  storeConfig.aberto
                    ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{storeConfig.aberto ? 'Fechar Loja Temporariamente' : 'Abrir Loja para Receber Pedidos'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÕES RÁPIDAS DE IMPLANTAÇÃO REAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="p-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black text-left flex flex-col justify-between gap-3 shadow-lg shadow-orange-500/15 transition cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <Building2 className="w-6 h-6" />
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20 text-white font-bold">
                Passo 1
              </span>
            </div>
            <div>
              <p className="text-sm font-black leading-snug">Implantar Estabelecimento Real</p>
              <p className="text-[11px] font-semibold opacity-85 mt-0.5">
                Cadastrar nome, segmento, WhatsApp, Pix e frete do cliente.
              </p>
            </div>
          </button>
        )}

        {onOpenPublicStorefront && (
          <button
            onClick={onOpenPublicStorefront}
            className="p-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/40 text-white text-left flex flex-col justify-between gap-3 transition cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <Eye className="w-6 h-6 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                Visão do Cliente
              </span>
            </div>
            <div>
              <p className="text-sm font-black leading-snug text-emerald-400">Abrir Cardápio Público Real</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Testar tela cheia exatamente como o consumidor final faz o pedido.
              </p>
            </div>
          </button>
        )}

        {onForceSyncCloud && (
          <button
            onClick={onForceSyncCloud}
            className="p-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-left flex flex-col justify-between gap-3 transition cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <CloudUpload className="w-6 h-6 text-cyan-400" />
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                Cloud Firestore
              </span>
            </div>
            <div>
              <p className="text-sm font-black leading-snug">Publicar Cardápio na Nuvem</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Forçar sincronização imediata de produtos e preços para todos os celulares.
              </p>
            </div>
          </button>
        )}

        {onClearDemoOrders && (
          <button
            onClick={onClearDemoOrders}
            className="p-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-red-500/30 text-white text-left flex flex-col justify-between gap-3 transition cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <Trash2 className="w-6 h-6 text-red-400" />
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
                Limpar Testes
              </span>
            </div>
            <div>
              <p className="text-sm font-black leading-snug text-red-400">Zerar Pedidos de Demonstração</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Limpa os pedidos fictícios para iniciar o turno real na cozinha.
              </p>
            </div>
          </button>
        )}
      </div>

      {/* LINKS OFICIAIS DE PRODUÇÃO + QR CODE DE MESA/BALCÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Direct Production Links */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-orange-400">
              Links Exclusivos de Operação
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">
              Endereços Web para Clientes e Equipe da Cozinha
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              O link do cliente abre somente o Cardápio Digital (sem botões administrativos). Já o link do KDS abre
              direto o monitor de produção da cozinha.
            </p>
          </div>

          {/* 1. Link Público do Cardápio do Cliente */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black text-emerald-400 uppercase">
                  1. Link Oficial do Cardápio (Para Clientes / Bio do Instagram)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                Modo Consumidor Final
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={publicMenuUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-emerald-300 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(publicMenuUrl, 'menu')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  {copiedMenuLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedMenuLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>
                {onOpenPublicStorefront && (
                  <button
                    onClick={onOpenPublicStorefront}
                    className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Abrir visualização pública do cliente"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Testar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Link do Monitor KDS da Cozinha */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-black text-orange-400 uppercase">
                  2. Link Direto do Monitor KDS (Para Tablet ou PC da Cozinha)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 font-bold">
                Com Campainha Sonora
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={kdsDirectUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-orange-300 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(kdsDirectUrl, 'kds')}
                  className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  {copiedKdsLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKdsLink ? 'Copiado!' : 'Copiar Link KDS'}</span>
                </button>
                {onOpenKdsMode && (
                  <button
                    onClick={onOpenKdsMode}
                    className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir KDS</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Gestão de Administradores & Nuvem */}
          {onOpenTeamModal && (
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase">
                    Controle de Acesso do Dono do Estabelecimento
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Adicione o e-mail Google do proprietário ou gerente da loja para que ele possa editar preços e produtos.
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenTeamModal}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-neutral-950 font-black text-xs whitespace-nowrap transition cursor-pointer"
              >
                Gerenciar Equipe
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Printable QR Code Card for Tables & Counter */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center justify-between text-center">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1">
              <QrCode className="w-3.5 h-3.5" /> Display de Mesa &amp; Balcão
            </span>
            <h3 className="text-lg font-black text-white">{storeConfig.nome}</h3>
            <p className="text-xs text-neutral-400">Aponte a câmera do celular para abrir o Cardápio Digital</p>
          </div>

          <div className="my-4 p-4 rounded-2xl bg-white shadow-xl border-4 border-orange-500/80">
            <img
              src={qrCodeImageUrl}
              alt={`QR Code Cardápio ${storeConfig.nome}`}
              className="w-44 h-44 object-contain mx-auto"
            />
            <p className="text-[10px] font-black text-neutral-900 uppercase tracking-wider mt-2">
              Peça Online Sem Filas
            </p>
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Imprimir Plaquinha QR Code</span>
            </button>
            <button
              onClick={onOpenExport}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Kit Completo de Divulgação</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHECKLIST DE VIRADA DE CHAVE COM O CLIENTE REAL */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Roteiro Passo a Passo para Iniciar a Operação Hoje</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Marque cada etapa concluída durante a implantação no estabelecimento cliente ({progressPct}% concluído)
            </p>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
            {progressPct}% Pronto
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              id: 'step1',
              title: '1. Cadastrar Dados Reais do Estabelecimento',
              desc: `Nome (${storeConfig.nome}), endereço (${storeConfig.endereco}) e horário (${storeConfig.horarioFuncionamento}).`,
            },
            {
              id: 'step2',
              title: '2. Revisar Produtos, Fotos e Taxas de Entrega por Bairro',
              desc: `${productsCount} produtos cadastrados e sincronizados no banco de dados Cloud Firestore.`,
            },
            {
              id: 'step3',
              title: '3. Confirmar Chave PIX e WhatsApp de Recebimento',
              desc: `Chave PIX ativa (${storeConfig.pagamentos?.pixChave || storeConfig.whatsapp}) com ${
                storeConfig.pagamentos?.pixDescontoPct ?? 5
              }% de desconto automático.`,
            },
            {
              id: 'step4',
              title: '4. Configurar Mensagem Automática no WhatsApp Business',
              desc: 'Colar o texto abaixo na saudação automática do WhatsApp da loja para enviar o link do cardápio.',
            },
            {
              id: 'step5',
              title: '5. Fazer 1 Pedido Real de Teste e Verificar Campainha KDS',
              desc: 'Abrir o Cardápio Público pelo celular, enviar um pedido teste e confirmar o alerta sonoro no KDS.',
            },
          ].map((item) => {
            const checked = completedSteps[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleStep(item.id)}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition select-none ${
                  checked
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    checked ? 'bg-emerald-500 text-neutral-950' : 'border border-neutral-600'
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="text-xs">
                  <p className={`font-bold ${checked ? 'text-emerald-300' : 'text-white'}`}>{item.title}</p>
                  <p className="text-neutral-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TEXTOS PRONTOS PARA COPIAR: WHATSAPP BUSINESS & BIO INSTAGRAM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Business Auto-Greeting */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Automação de Atendimento
                </span>
                <h3 className="text-base font-black text-white">Saudação do WhatsApp Business</h3>
              </div>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Cole esta mensagem em <strong>Ferramentas Comerciais &gt; Mensagem de Saudação</strong> no WhatsApp da loja:
            </p>
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300 whitespace-pre-line mb-4">
              {whatsappAutoReply}
            </div>
          </div>

          <button
            onClick={() => handleCopy(whatsappAutoReply, 'wa')}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copiedWhatsappGreeting ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>
              {copiedWhatsappGreeting ? 'Mensagem Copiada!' : 'Copiar Saudação Automática do WhatsApp'}
            </span>
          </button>
        </div>

        {/* Instagram Bio */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">
                  Conversão nas Redes Sociais
                </span>
                <h3 className="text-base font-black text-white">Texto Pronto para Bio do Instagram</h3>
              </div>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Coloque o link público do cardápio na Bio do Instagram e nos Destaques dos Stories para converter seguidores em pedidos:
            </p>
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300 whitespace-pre-line mb-4">
              {bioTemplate}
            </div>
          </div>

          <button
            onClick={() => handleCopy(bioTemplate, 'bio')}
            className="w-full py-2.5 px-4 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copiedBio ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedBio ? 'Texto da Bio Copiado!' : 'Copiar Texto + Link para Instagram'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
