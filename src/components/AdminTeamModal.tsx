import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  Check,
  AlertCircle,
  X,
  ChefHat,
  Crown,
  Building2,
  Eye,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { StoreConfig, UserRole } from '../types';

interface AdminMember {
  uid: string;
  email: string;
  role: UserRole;
  storeId: string;
  storeName?: string;
  nome?: string;
  criadoEm: string;
}

interface AdminTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
  onForceSyncCloud?: () => Promise<void>;
  activeStoreId?: string;
  storeConfig?: StoreConfig;
  allStores?: StoreConfig[];
  onSwitchStoreAndPreviewManager?: (storeId: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Gerente da Plataforma (Super Admin)',
  store_manager: 'Gerente do Estabelecimento',
  admin: 'Gerente do Estabelecimento',
  kitchen: 'Cozinha (Monitor KDS)',
  attendant: 'Atendente / Caixa',
};

export const AdminTeamModal: React.FC<AdminTeamModalProps> = ({
  isOpen,
  onClose,
  showToast,
  onForceSyncCloud,
  activeStoreId = 'default',
  storeConfig,
  allStores = [],
  onSwitchStoreAndPreviewManager,
}) => {
  const { user, isAdmin, isSuperAdmin, assignedStoreId, signIn, signOut } = useAuth();
  const { isDark } = useTheme();

  const [members, setMembers] = useState<AdminMember[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('store_manager');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(activeStoreId || 'default');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (assignedStoreId && !isSuperAdmin) {
      setSelectedStoreId(assignedStoreId);
    } else if (activeStoreId) {
      setSelectedStoreId(activeStoreId);
    }
  }, [activeStoreId, assignedStoreId, isSuperAdmin]);

  // Available stores list (ensuring active store is always included)
  const storesList: StoreConfig[] = React.useMemo(() => {
    const map = new Map<string, StoreConfig>();
    allStores.forEach((s) => {
      const id = s.id || 'default';
      map.set(id, { ...s, id });
    });
    if (storeConfig) {
      const currId = activeStoreId || storeConfig.id || 'default';
      if (!map.has(currId)) {
        map.set(currId, { ...storeConfig, id: currId });
      }
    }
    return Array.from(map.values());
  }, [allStores, storeConfig, activeStoreId]);

  // Load team members from Firestore
  useEffect(() => {
    if (!isOpen) return;

    try {
      const adminsCol = collection(db, 'admins');
      const unsubscribe = onSnapshot(
        adminsCol,
        (snapshot) => {
          const list: AdminMember[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              uid: docSnap.id,
              email: data.email || docSnap.id,
              role: (data.role as UserRole) || 'store_manager',
              storeId: data.storeId || 'default',
              storeName: data.storeName,
              nome: data.nome,
              criadoEm: data.criadoEm || new Date().toISOString(),
            });
          });
          // Deduplicate by email (since we mirror emailDoc -> uidDoc on login)
          const byEmail = new Map<string, AdminMember>();
          list.forEach((item) => {
            const key = item.email.toLowerCase();
            const existing = byEmail.get(key);
            if (!existing || item.uid === key.replace(/[^a-zA-Z0-9_-]/g, '_')) {
              byEmail.set(key, item);
            }
          });
          setMembers(Array.from(byEmail.values()));
        },
        (error) => {
          console.warn('Carregamento de equipe em modo offline:', error);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Erro ao conectar coleção de admins:', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resolveStoreName = (sId: string, fallbackName?: string) => {
    if (sId === 'all') return 'Todos os Estabelecimentos (Plataforma)';
    const found = storesList.find((s) => (s.id || 'default') === sId);
    if (found) return found.nome;
    if (fallbackName) return fallbackName;
    return sId === 'default' ? storeConfig?.nome || 'Estabelecimento Principal' : sId;
  };

  const visibleMembers = isSuperAdmin
    ? members
    : members.filter((m) => (m.storeId || 'default') === (assignedStoreId || activeStoreId));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      showToast('Por favor, informe o e-mail Google do usuário.');
      return;
    }

    setIsSubmitting(true);
    try {
      const emailSanitized = newEmail.trim().toLowerCase();
      const memberId = emailSanitized.replace(/[^a-zA-Z0-9_-]/g, '_');
      const targetStoreId = isSuperAdmin ? selectedStoreId : assignedStoreId || activeStoreId;
      const targetStoreName = resolveStoreName(targetStoreId);

      const newMemberData = {
        uid: memberId,
        email: emailSanitized,
        nome: newNome.trim() || emailSanitized.split('@')[0],
        role: newRole,
        storeId: targetStoreId,
        storeName: targetStoreName,
        criadoEm: new Date().toISOString(),
      };

      await setDoc(doc(db, 'admins', memberId), newMemberData, { merge: true });

      // Se o cargo for Gerente do Estabelecimento, também registra gerenteEmail na config da loja
      if (newRole === 'store_manager' || newRole === 'admin') {
        await setDoc(
          doc(db, 'store_config', targetStoreId),
          {
            gerenteEmail: emailSanitized,
            gerenteNome: newMemberData.nome,
          },
          { merge: true }
        );
      }

      showToast(
        `Login ${emailSanitized} vinculado exclusivamente ao estabelecimento "${targetStoreName}"!`
      );
      setNewEmail('');
      setNewNome('');
    } catch (error) {
      console.error('Erro ao vincular login ao estabelecimento:', error);
      showToast('Erro ao salvar vínculo no Firestore. Verifique se você está autenticado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    try {
      await deleteDoc(doc(db, 'admins', memberId));
      showToast(`Vínculo de acesso de ${email} removido.`);
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      showToast('Não foi possível remover o vínculo.');
    }
  };

  const cardBg = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200';
  const innerBg = isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${cardBg}`}>
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Controle de Acessos &amp; Vínculo por Estabelecimento
              </h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Cada login tem acesso estrito e isolado somente às informações do seu próprio estabelecimento
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Current Auth Status Card */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${innerBg}`}>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full border border-orange-500/40"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {user.displayName || user.email}
                      </span>
                      <span className="text-xs text-orange-500 font-bold">
                        · {isSuperAdmin ? 'Gerente da Plataforma (Acesso Global)' : 'Acesso Vinculado ao Estabelecimento'}
                      </span>
                    </div>
                    <span className={`text-xs block ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {user.email} •{' '}
                      {isSuperAdmin
                        ? `Controlando ${storesList.length} estabelecimento(s)`
                        : `Unidade: ${resolveStoreName(assignedStoreId || activeStoreId)}`}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`font-bold text-sm block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      Nenhum Usuário Conectado
                    </span>
                    <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Entre com sua Conta Google para carregar o estabelecimento vinculado ao seu login
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {user ? (
                <button
                  onClick={signOut}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-red-400 border-neutral-700'
                      : 'bg-white hover:bg-red-50 text-red-600 border-neutral-300'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Trocar Conta / Sair</span>
                </button>
              ) : (
                <button
                  onClick={signIn}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar com Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Form: Bind Login to Specific Establishment */}
          <form onSubmit={handleAddMember} className={`p-4 rounded-xl border space-y-4 ${innerBg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-500">
                <Plus className="w-4 h-4" />
                <span>Vincular Login de Gerente ou Equipe a um Estabelecimento Específico</span>
              </div>
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                Isolamento por Loja Ativo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Nome do Responsável
                </label>
                <input
                  type="text"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: Carlos (Gerente)"
                  className={`w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500 ${
                    isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-4">
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  E-mail Google do Login *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="gerente.loja@gmail.com"
                  className={`w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500 ${
                    isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-5">
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Estabelecimento Vinculado *
                </label>
                <select
                  value={selectedStoreId}
                  disabled={!isSuperAdmin}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500 disabled:opacity-60 ${
                    isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                  }`}
                >
                  {storesList.map((st) => {
                    const stId = st.id || 'default';
                    return (
                      <option key={stId} value={stId}>
                        {st.nome} ({st.cidade || stId})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-neutral-400">Nível de Visão:</span>
                {(
                  [
                    { id: 'store_manager', label: 'Gerente do Estabelecimento (Visão Operacional)' },
                    { id: 'kitchen', label: 'Cozinha (Direto no KDS)' },
                    { id: 'attendant', label: 'Atendente / Caixa' },
                  ] as const
                ).map((roleOpt) => (
                  <button
                    key={roleOpt.id}
                    type="button"
                    onClick={() => setNewRole(roleOpt.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                      newRole === roleOpt.id
                        ? 'bg-orange-500 text-white border-orange-500'
                        : isDark
                        ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        : 'bg-white border-neutral-300 text-neutral-700'
                    }`}
                  >
                    {roleOpt.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Vincular Login à Loja</span>
              </button>
            </div>
          </form>

          {/* Members List Grouped / Tagged by Establishment */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                Logins Autorizados e Seus Estabelecimentos Vinculados ({visibleMembers.length + (isSuperAdmin ? 1 : 0)})
              </h4>
            </div>

            <div className="space-y-2">
              {/* Permanent Platform Manager */}
              {isSuperAdmin && (
                <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${innerBg}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-500 font-bold flex items-center justify-center text-xs shrink-0">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        maxuell86@gmail.com
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
                        <span className="text-orange-500 font-semibold">Gerente da Plataforma (Super Admin)</span>
                        <span aria-hidden="true">·</span>
                        <span>Controle total de configurações, implantação e clientes</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-500 font-bold whitespace-nowrap">
                    Acesso Global Multi-Lojas
                  </span>
                </div>
              )}

              {/* Dynamic Bound Logins */}
              {visibleMembers.length === 0 ? (
                <div className={`p-6 rounded-xl border text-center text-xs text-neutral-400 ${innerBg}`}>
                  Nenhum login de gerente de estabelecimento vinculado ainda. Utilize o formulário acima para vincular o
                  e-mail do seu cliente ao estabelecimento dele.
                </div>
              ) : (
                visibleMembers.map((m) => {
                  const boundStoreName = resolveStoreName(m.storeId, m.storeName);
                  return (
                    <div
                      key={m.uid}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${innerBg}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 font-bold flex items-center justify-center text-xs shrink-0">
                          {m.role === 'kitchen' ? <ChefHat className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {m.nome ? `${m.nome} (${m.email})` : m.email}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
                            <span className="text-emerald-500 font-semibold">
                              Loja: {boundStoreName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{ROLE_LABELS[m.role] || m.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSuperAdmin && onSwitchStoreAndPreviewManager && m.storeId !== 'all' && (
                          <button
                            type="button"
                            onClick={() => {
                              onSwitchStoreAndPreviewManager(m.storeId || 'default');
                              onClose();
                            }}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                              isDark
                                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
                                : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800'
                            }`}
                            title="Alternar para este estabelecimento e simular a visão deste gerente"
                          >
                            <Eye className="w-3.5 h-3.5 text-orange-500" />
                            <span>Ver Visão Deste Gerente</span>
                          </button>
                        )}

                        {(isSuperAdmin || isAdmin) && (
                          <button
                            onClick={() => handleRemoveMember(m.uid, m.email)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 transition rounded cursor-pointer"
                            title="Revogar Vínculo de Acesso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
            isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
          }`}
        >
          <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
            <Shield className="w-4 h-4" />
            <span>Isolamento Multi-Estabelecimento Ativo no Firestore</span>
          </div>

          <div className="flex items-center gap-2">
            {onForceSyncCloud && isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onForceSyncCloud();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition cursor-pointer whitespace-nowrap"
              >
                Sincronizar Loja Atual na Nuvem
              </button>
            )}
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
              }`}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

