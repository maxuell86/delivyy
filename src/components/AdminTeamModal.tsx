import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Trash2, 
  Plus, 
  Mail, 
  LogIn, 
  LogOut, 
  Check, 
  Sparkles,
  AlertCircle,
  X,
  ChefHat,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';

interface AdminMember {
  uid: string;
  email: string;
  role: 'admin' | 'kitchen' | 'attendant';
  nome?: string;
  criadoEm: string;
}

interface AdminTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const AdminTeamModal: React.FC<AdminTeamModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const { user, isAdmin, isSuperAdmin, signIn, signOut } = useAuth();
  const { isDark } = useTheme();

  const [members, setMembers] = useState<AdminMember[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'kitchen' | 'attendant'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
              role: data.role || 'admin',
              nome: data.nome,
              criadoEm: data.criadoEm || new Date().toISOString(),
            });
          });
          setMembers(list);
        },
        (error) => {
          // Em caso de offline ou regras restritas
          console.warn('Carregamento de equipe em modo offline:', error);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Erro ao conectar coleção de admins:', e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      showToast('Por favor, informe o e-mail do membro da equipe.');
      return;
    }

    setIsSubmitting(true);
    try {
      const emailSanitized = newEmail.trim().toLowerCase();
      const memberId = emailSanitized.replace(/[^a-zA-Z0-9_-]/g, '_');

      const newMemberData = {
        uid: memberId,
        email: emailSanitized,
        nome: newNome.trim() || emailSanitized.split('@')[0],
        role: newRole,
        criadoEm: new Date().toISOString(),
      };

      await setDoc(doc(db, 'admins', memberId), newMemberData);
      showToast(`Membro ${emailSanitized} autorizado como ${newRole.toUpperCase()}!`);
      setNewEmail('');
      setNewNome('');
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      showToast('Erro ao salvar permissão no Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (confirm(`Remover acesso de ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'admins', memberId));
        showToast(`Acesso de ${email} revogado.`);
      } catch (error) {
        console.error('Erro ao remover membro:', error);
        showToast('Não foi possível remover o membro.');
      }
    }
  };

  const cardBg = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200';
  const innerBg = isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${cardBg}`}>
        
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Gerenciamento de Equipe &amp; Administradores
              </h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Autenticação Firebase com controle de acesso por função (RBAC)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'}`}
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
                    <img src={user.photoURL} alt="Avatar" className="w-11 h-11 rounded-full border border-orange-500/40" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black flex items-center justify-center text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {user.displayName || user.email}
                      </span>
                      {isSuperAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          <span>Super Admin</span>
                        </span>
                      )}
                      {!isSuperAdmin && isAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>Admin</span>
                        </span>
                      )}
                    </div>
                    <span className={`text-xs block ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {user.email} • Conectado via Google
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
                      Nenhum Administrador Conectado
                    </span>
                    <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Entre com sua Conta Google para sincronização autorizada em nuvem
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {user ? (
                <button
                  onClick={signOut}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-red-400 border-neutral-700' : 'bg-white hover:bg-red-50 text-red-600 border-neutral-300'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              ) : (
                <button
                  onClick={signIn}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-orange-500/20 transition active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar com Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Form: Add New Admin/Team Member */}
          <form onSubmit={handleAddMember} className={`p-4 rounded-xl border space-y-3.5 ${innerBg}`}>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider">
              <Plus className="w-3.5 h-3.5" />
              <span>Autorizar Novo Membro na Equipe</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Nome / Apelido
                </label>
                <input
                  type="text"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: João Cozinha"
                  className={`w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500 ${
                    isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-5">
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  E-mail Google do Membro *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@gmail.com"
                  className={`w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500 ${
                    isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-3">
                <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                  Cargo / Função
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500 ${
                    isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-300 text-neutral-900'
                  }`}
                >
                  <option value="admin">Administrador</option>
                  <option value="kitchen">Cozinha (KDS)</option>
                  <option value="attendant">Atendente/Caixa</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Autorizar Acesso</span>
              </button>
            </div>
          </form>

          {/* Members List */}
          <div className="space-y-2">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Membros Autorizados no Firestore ({members.length + 1})
            </h4>

            <div className="space-y-2">
              {/* Permanent Super Admin */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${innerBg}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      maxuell86@gmail.com
                    </span>
                    <span className="text-[10px] text-purple-400 font-semibold">
                      Super Administrador Titular (Proprietário)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-bold border border-purple-500/20">
                  Acesso Total
                </span>
              </div>

              {/* Dynamic Authorized Members */}
              {members.map((m) => (
                <div key={m.uid} className={`p-3 rounded-xl border flex items-center justify-between ${innerBg}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs">
                      {m.role === 'kitchen' ? <ChefHat className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {m.nome ? `${m.nome} (${m.email})` : m.email}
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Função: <b className="capitalize text-orange-500">{m.role}</b>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-medium border border-neutral-700">
                      {m.role.toUpperCase()}
                    </span>
                    {(isSuperAdmin || isAdmin) && (
                      <button
                        onClick={() => handleRemoveMember(m.uid, m.email)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 transition rounded"
                        title="Revogar Acesso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'}`}>
          <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronização em Nuvem Ativa (Firestore)</span>
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
            }`}
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
