import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  LogIn,
  LogOut,
  Building2,
  ChefHat,
  Crown,
  Store,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';
import { StoreConfig } from '../types';

interface ProfessionalAuthGateProps {
  storeConfig: StoreConfig;
  activeEstablishmentId: string;
  onOpenPublicMenu: () => void;
}

export const ProfessionalAuthGate: React.FC<ProfessionalAuthGateProps> = ({
  storeConfig,
  activeEstablishmentId,
  onOpenPublicMenu,
}) => {
  const { user, loading, signIn, signOut } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await signIn();
    } catch (err: any) {
      setLoginError('Não foi possível concluir a autenticação com o Google. Verifique se os pop-ups estão permitidos.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCopyEmail = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(user.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center animate-pulse mb-4">
          <ShieldCheck className="w-6 h-6 text-orange-500" />
        </div>
        <p className="text-sm font-black tracking-wide text-white">Verificando credenciais e vínculo do estabelecimento...</p>
        <p className="text-xs text-neutral-400 mt-1">Sincronizando permissões seguras no Cloud Firestore</p>
      </div>
    );
  }

  // Case 1: User is signed in with Google, but their email is NOT linked to any establishment
  if (user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Acesso Restrito por Estabelecimento
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Conta Ainda Não Vinculada a um Estabelecimento
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Por segurança profissional, cada login possui acesso exclusivo apenas aos dados do seu próprio restaurante. Sua conta foi autenticada, mas ainda não está vinculada a uma loja ativa.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Seu E-mail Autenticado
                </span>
                <span className="text-sm font-black text-orange-400 break-all">{user.email}</span>
              </div>
              <button
                onClick={handleCopyEmail}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmail ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
              <p>
                <strong>Como liberar seu acesso:</strong> Envie o e-mail acima para o administrador da plataforma (
                <span className="text-white font-semibold">{SUPER_ADMIN_EMAIL}</span>) ou para o proprietário do seu estabelecimento para que ele vincule seu login na aba <strong>Acessos &amp; Lojas</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={signOut}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Entrar com Outra Conta Google</span>
            </button>
            <button
              onClick={onOpenPublicMenu}
              className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span>Abrir Cardápio Público</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Not signed in — Render Professional Multi-Tenant Portal Login
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="w-96 h-96 rounded-full bg-orange-500/10 blur-3xl absolute -top-24 -left-24 pointer-events-none" />
      <div className="w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl absolute -bottom-24 -right-24 pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-white block leading-none">
              MAX DELIVERY &amp; GESTÃO
            </span>
            <span className="text-[10px] text-neutral-400 font-semibold">
              Plataforma SaaS Multi-Estabelecimentos
            </span>
          </div>
        </div>

        <button
          onClick={onOpenPublicMenu}
          className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-emerald-400 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Ver Cardápio do Cliente ({storeConfig.nome})</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-4xl w-full mx-auto my-8 grid grid-cols-1 lg:grid-cols-12 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        {/* Left Column: Value Proposition & Isolation Security */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-b lg:border-b-0 lg:border-r border-neutral-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[11px] font-black uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Ambiente Corporativo Isolado por Loja</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Portal do Estabelecimento &amp; Gestão em Tempo Real
            </h1>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Faça login com sua conta autorizada. O sistema identifica automaticamente o seu estabelecimento vinculado e carrega apenas o seu cardápio, seus pedidos KDS e seu financeiro.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Store className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-black text-white">Acesso Exclusivo do Lojista (Dono / Gerente)</p>
                <p className="text-neutral-400 mt-0.5">
                  Visualiza e edita somente os produtos, preços, taxas de entrega, PIX e relatórios do seu próprio restaurante.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                <ChefHat className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-black text-white">Acesso Operacional (Cozinha KDS &amp; Caixa)</p>
                <p className="text-neutral-400 mt-0.5">
                  Acesso direto à fila de produção e despacho de pedidos da loja vinculada, sem alterar configurações sensíveis.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Crown className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-black text-white">Central Master SaaS (Proprietário da Plataforma)</p>
                <p className="text-neutral-400 mt-0.5">
                  Controle centralizado para cadastrar novos estabelecimentos clientes, vincular logins e gerenciar assinaturas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign-In Action */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-neutral-950 flex flex-col justify-center space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-orange-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-white">Identifique seu Acesso</h2>
            <p className="text-xs text-neutral-400">
              Utilize o e-mail Google cadastrado para o seu estabelecimento
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-neutral-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/20 transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoggingIn ? 'Autenticando...' : 'Entrar com Conta Google'}</span>
            </button>

            <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Isolamento de Dados Ativo</span>
              </div>
              <p className="leading-relaxed">
                Cada estabelecimento possui banco de produtos, fila de pedidos e link público independentes (
                <code className="text-orange-300">/?modo=cardapio&amp;loja={activeEstablishmentId}</code>).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-900 text-center">
            <button
              onClick={onOpenPublicMenu}
              className="text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer"
            >
              É cliente final? <span className="text-emerald-400 underline">Clique aqui para abrir o Cardápio Digital</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto text-center text-[11px] text-neutral-500 py-2 relative z-10">
        Segurança e Isolamento Multi-Estabelecimento via Google Firebase Authentication &amp; Cloud Firestore
      </div>
    </div>
  );
};
