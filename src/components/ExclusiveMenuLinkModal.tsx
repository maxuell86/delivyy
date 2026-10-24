import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  QrCode,
  Download,
  Share2,
  ExternalLink,
  Link2,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { StoreConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ExclusiveMenuLinkModalProps {
  isOpen: boolean;
  storeId: string;
  storeConfig: StoreConfig;
  allStores: StoreConfig[];
  onClose: () => void;
  onSaveConfig: (config: StoreConfig) => void;
  onOpenPublicStorefront: () => void;
  showToast: (msg: string) => void;
}

export function sanitizeMenuSlug(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export function buildExclusiveMenuUrl(storeId: string, storeConfig: StoreConfig): string {
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maxdelivery.app';
  const identifier = storeConfig.slug?.trim() || (storeId && storeId !== 'default' ? storeId : '');
  if (!identifier) {
    return `${originUrl}/?modo=cardapio`;
  }
  return `${originUrl}/?modo=cardapio&loja=${encodeURIComponent(identifier)}`;
}

export const ExclusiveMenuLinkModal: React.FC<ExclusiveMenuLinkModalProps> = ({
  isOpen,
  storeId,
  storeConfig,
  allStores,
  onClose,
  onSaveConfig,
  onOpenPublicStorefront,
  showToast,
}) => {
  const { isDark } = useTheme();
  const [slugInput, setSlugInput] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsText, setCopiedWhatsText] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultSlug =
        storeConfig.slug ||
        (storeId && storeId !== 'default' ? storeId : sanitizeMenuSlug(storeConfig.nome || 'minha-loja'));
      setSlugInput(defaultSlug);
      setSlugError(null);
    }
  }, [isOpen, storeConfig.slug, storeConfig.nome, storeId]);

  const previewSlug = sanitizeMenuSlug(slugInput) || (storeId !== 'default' ? storeId : 'cardapio');
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maxdelivery.app';
  const exclusiveUrl = `${originUrl}/?modo=cardapio&loja=${encodeURIComponent(previewSlug)}`;

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    QRCode.toDataURL(exclusiveUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn('Erro ao gerar QR Code:', err);
      });
    return () => {
      active = false;
    };
  }, [exclusiveUrl, isOpen]);

  if (!isOpen) return null;

  const handleSaveSlug = (e: React.FormEvent) => {
    e.preventDefault();
    setSlugError(null);

    const cleaned = sanitizeMenuSlug(slugInput);
    if (!cleaned || cleaned.length < 3) {
      setSlugError('O nome personalizado do link deve ter pelo menos 3 caracteres.');
      return;
    }

    // Verify if another store already uses this slug or ID
    const conflict = allStores.find(
      (s) =>
        s.id !== storeId &&
        (sanitizeMenuSlug(s.slug || '') === cleaned || sanitizeMenuSlug(s.id || '') === cleaned)
    );
    if (conflict) {
      setSlugError(`O identificador "${cleaned}" já está em uso por outro estabelecimento. Escolha outro nome.`);
      return;
    }

    const updated: StoreConfig = {
      ...storeConfig,
      slug: cleaned,
    };
    onSaveConfig(updated);
    setSlugInput(cleaned);
    showToast(`Link personalizado "${cleaned}" salvo e vinculado ao estabelecimento!`);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(exclusiveUrl);
    setCopiedLink(true);
    showToast('Link exclusivo do cardápio copiado!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const whatsappInviteText = `Olá! Faça seu pedido direto pelo nosso Cardápio Digital exclusivo de *${storeConfig.nome}* sem taxas e com agilidade:\n\n${exclusiveUrl}`;

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappInviteText);
    const link = document.createElement('a');
    link.href = `https://wa.me/?text=${encoded}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleCopyInviteMessage = () => {
    navigator.clipboard.writeText(whatsappInviteText);
    setCopiedWhatsText(true);
    showToast('Mensagem pronta com link copiada para o WhatsApp!');
    setTimeout(() => setCopiedWhatsText(false), 2500);
  };

  const handleDownloadQrCard = () => {
    if (!qrDataUrl) return;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top Accent Bar
    ctx.fillStyle = storeConfig.corTema || '#f97316';
    ctx.fillRect(0, 0, canvas.width, 16);

    // Store Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(storeConfig.nome.slice(0, 28), canvas.width / 2, 85);

    // Slogan
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '18px sans-serif';
    ctx.fillText((storeConfig.slogan || 'Cardápio Digital Oficial').slice(0, 42), canvas.width / 2, 120);

    // White QR Box
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(110, 155, 380, 380, 24);
    ctx.fill();

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 130, 175, 340, 340);

      // Call to action
      ctx.fillStyle = '#F97316';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('APONTE A CÂMERA DO CELULAR', canvas.width / 2, 595);

      ctx.fillStyle = '#E5E7EB';
      ctx.font = '18px sans-serif';
      ctx.fillText('Acesse nosso cardápio e faça seu pedido sem fila', canvas.width / 2, 630);

      // Slug / Link footer
      ctx.fillStyle = '#6B7280';
      ctx.font = '14px monospace';
      ctx.fillText(exclusiveUrl.slice(0, 58), canvas.width / 2, 705);

      const downloadUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `qrcode-cardapio-${previewSlug}.png`;
      a.click();
      showToast(' Arte do QR Code baixada em alta resolução (PNG)!');
    };
    img.src = qrDataUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                Link Exclusivo &amp; QR Code — {storeConfig.nome}
              </h2>
              <p className="text-xs text-neutral-400">
                Personalize o endereço do cardápio digital deste estabelecimento e compartilhe com clientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-current hover:bg-neutral-800/40 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* 1. Custom Slug Configuration */}
          <form onSubmit={handleSaveSlug} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                <Link2 className="w-4 h-4" />
                <span>1. Nome Personalizado no Link do Estabelecimento</span>
              </label>
              {storeConfig.slug && (
                <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ativo: {storeConfig.slug}
                </span>
              )}
            </div>

            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Escolha um identificador curto e fácil de lembrar para o link exclusivo da sua loja (ex:{' '}
              <code className="font-mono text-orange-400">max-burger</code>,{' '}
              <code className="font-mono text-orange-400">pizzaria-napoli</code>).
            </p>

            {slugError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{slugError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <div
                className={`flex-1 flex items-center rounded-xl border px-3 py-2 text-xs font-mono ${
                  isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-400' : 'bg-neutral-100 border-neutral-300 text-neutral-500'
                }`}
              >
                <span className="truncate hidden sm:inline">?modo=cardapio&amp;loja=</span>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder="nome-da-sua-loja"
                  className={`flex-1 bg-transparent font-bold outline-none ml-1 ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Nome do Link</span>
              </button>
            </div>
          </form>

          {/* 2. Direct Exclusive Link Box & Quick Actions */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400">
                Link Oficial Exclusivo do Cardápio de {storeConfig.nome}:
              </span>
              <span className="text-[11px] font-mono text-emerald-500">100% isolado por loja</span>
            </div>

            <div
              className={`p-3 rounded-xl border font-mono text-xs break-all select-all ${
                isDark ? 'bg-neutral-900 border-neutral-800 text-emerald-400' : 'bg-white border-neutral-300 text-emerald-700'
              }`}
            >
              {exclusiveUrl}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPublicStorefront();
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                    : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                <ExternalLink className="w-4 h-4 text-orange-500" />
                <span>Abrir Cardápio Agora</span>
              </button>
            </div>
          </div>

          {/* 3. QR Code & WhatsApp Automatic Message */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* QR Code Display */}
            <div
              className={`md:col-span-5 p-4 rounded-2xl border flex flex-col items-center justify-between text-center ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-orange-500 block mb-1">
                  QR Code da Loja
                </span>
                <p className="text-[11px] text-neutral-400 mb-3">
                  Para mesas, balcão, panfletos ou embalagens de entrega
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-md my-1">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${storeConfig.nome}`}
                    className="w-40 h-40 object-contain"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs text-neutral-400">
                    Gerando QR...
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownloadQrCard}
                className="mt-3 w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Placa QR Code (PNG)</span>
              </button>
            </div>

            {/* WhatsApp Ready Message & Bio Tips */}
            <div
              className={`md:col-span-7 p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-500">
                  <Smartphone className="w-4 h-4" />
                  <span>Mensagem Automática para WhatsApp &amp; Bio</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Configure esta mensagem na resposta automática do WhatsApp Business do estabelecimento ou envie para sua lista de clientes:
                </p>
                <div
                  className={`p-3 rounded-xl border text-xs whitespace-pre-line leading-relaxed ${
                    isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-200' : 'bg-white border-neutral-300 text-neutral-800'
                  }`}
                >
                  {whatsappInviteText}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyInviteMessage}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                      : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  {copiedWhatsText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Mensagem Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <span>Copiar Texto para Resposta Automática do WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-end ${
            isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isDark
                ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
