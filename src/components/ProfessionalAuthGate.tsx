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
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Headset,
} from 'lucide-react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';
import { StoreConfig } from '../types';

interface ProfessionalAuthGateProps {
  storeConfig: StoreConfig;
  activeEstablishmentId: string;
  onOpenPublicMenu: () => void;
  onOpenMarketplace?: () => void;
}

export const ProfessionalAuthGate: React.FC<ProfessionalAuthGateProps> = ({
  storeConfig,
  activeEstablishmentId,
  onOpenPublicMenu,
  onOpenMarketplace,
}) => {
  const { user, loading, signIn, signInWithCredentials, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await signInWithCredentials(email, password);
    } catch (err: any) {
      setLoginError(
        err instanceof Error
          ? err.message
          : 'Não foi possível validar suas credenciais. Verifique seu e-mail e senha.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await signIn();
    } catch (err: any) {
      setLoginError(
        'Não foi possível concluir a autenticação com o Google. Verifique se os pop-ups estão permitidos ou entre com seu E-mail e Senha.'
      );
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
        <p className="text-sm font-black tracking-wide text-white">
          Verificando credenciais e direcionando para o seu ambiente...
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          Sincronizando permissões seguras no Cloud Firestore
        </p>
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
              Por segurança, cada login possui acesso exclusivo apenas aos dados do seu próprio restaurante. Sua conta foi autenticada, mas ainda não está vinculada a uma loja ativa.
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
                {copiedEmail ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedEmail ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
              <p>
                <strong>Como liberar seu acesso:</strong> Envie o e-mail acima para o administrador da plataforma (
                <span className="text-white font-semibold">{SUPER_ADMIN_EMAIL}</span>) ou para o gerente do seu estabelecimento para que ele vincule seu login em <strong>Acessos &amp; Equipe</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={signOut}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Trocar Conta / Voltar ao Login</span>
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

  // Case 2: Not signed in — Render General Multi-Tenant Login Portal
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="w-96 h-96 rounded-full bg-orange-500/10 blur-3xl absolute -top-24 -left-24 pointer-events-none" />
      <div className="w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl absolute -bottom-24 -right-24 pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-2 py-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-base shadow-lg">
            D
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-white block leading-none">
              DELIVY • GESTÃO &amp; DELIVERY
            </span>
            <span className="text-[10px] text-neutral-400 font-semibold">
              Portal Geral Multi-Estabelecimentos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMarketplace && (
            <button
              onClick={onOpenMarketplace}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-black text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>App Delivy (Ver Restaurantes)</span>
            </button>
          )}
          <button
            onClick={onOpenPublicMenu}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-emerald-400 flex items-center gap-1.5 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cardápio ({storeConfig.nome})</span>
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-5xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        {/* Left Column: Automatic Role & Store Routing Explanation */}
        <div className="lg:col-span-6 p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border-b lg:border-b-0 lg:border-r border-neutral-800 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[11px] font-black uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Redirecionamento Automático por Perfil</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Acesso Geral à Plataforma
            </h1>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Entre com seu e-mail e senha/PIN ou conta Google. O sistema reconhece automaticamente o seu cargo e o estabelecimento vinculado, abrindo exatamente as ferramentas do seu perfil:
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Store className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-black text-white">Gerente do Estabelecimento</p>
                <p className="text-neutral-400 mt-0.5">
                  Abre o painel exclusivo da sua loja: Operação do Dia, KDS, Cardápio, Estoque, CRM e DRE.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <ChefHat className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-black text-white">Cozinha (Monitor KDS)</p>
                <p className="text-neutral-400 mt-0.5">
                  Abre direto na fila de preparo da cozinha em tempo real e impressão de comandas térmicas.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <Headset className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-black text-white">Atendente / Caixa PDV</p>
                <p className="text-neutral-400 mt-0.5">
                  Abre a Operação do Turno, lançamento de Pedidos de Balcão/PDV e consulta rápida do cardápio.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Crown className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-black text-white">Master da Plataforma (Super Admin)</p>
                <p className="text-neutral-400 mt-0.5">
                  Controle global de todas as lojas, implantação de novos clientes, cores/marca e gestão de acessos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Login Form (Email + Password/PIN & Google Sign-In) */}
        <div className="lg:col-span-6 p-6 sm:p-8 bg-neutral-950 flex flex-col justify-center space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-orange-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">Entrar na Plataforma</h2>
            <p className="text-xs text-neutral-400">
              Digite suas credenciais cadastradas ou entre com o Google
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          {/* Email + Password/PIN Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                E-mail do Usuário / Login *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: gerente@loja.com ou maxuell86@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                Senha ou PIN de Acesso *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha ou PIN"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs sm:text-sm outline-none focus:border-orange-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoggingIn ? 'Autenticando...' : 'Entrar com E-mail e Senha'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-neutral-800" />
            <span className="flex-shrink mx-3 text-[11px] font-bold text-neutral-500 uppercase">
              ou acesse com o Google
            </span>
            <div className="flex-grow border-t border-neutral-800" />
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full py-3 px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
              />
            </svg>
            <span>Entrar com Conta Google</span>
          </button>

          <div className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Isolamento Multi-Loja Garantido</span>
            </div>
            <p className="leading-relaxed">
              Master Admin: <code className="text-orange-300">{SUPER_ADMIN_EMAIL}</code> (senha padrão inicial:{' '}
              <code className="text-emerald-300">admin123</code> ou via Google). Gerentes e equipe entram com o e-mail e senha criados em <strong>Acessos &amp; Equipe</strong>.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-900 text-center">
            <button
              type="button"
              onClick={onOpenPublicMenu}
              className="text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer"
            >
              É cliente fazendo pedido?{' '}
              <span className="text-emerald-400 underline">Abrir Cardápio Digital ({storeConfig.nome})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto text-center text-[11px] text-neutral-500 py-2 relative z-10">
        Tecnologia por <strong className="text-orange-500">Delivy</strong> • Plataforma SaaS Multi-Estabelecimentos via Google Firebase &amp; Cloud Firestore
      </div>
    </div>
  );
};
