import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser } from '../services/firebase';
import { UserRole } from '../types';

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  authProvider?: 'google' | 'credentials';
}

interface CredentialSession {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  storeId: string | null;
  storeName: string | null;
  isSuperAdmin: boolean;
}

interface AuthContextType {
  user: AuthUserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: UserRole;
  assignedStoreId: string | null;
  assignedStoreName: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const SUPER_ADMIN_EMAIL = 'maxuell86@gmail.com';
const CREDENTIAL_SESSION_KEY = 'omni_credential_session_v1';
export const LOCAL_TEAM_CACHE_KEY = 'omni_team_members_cache_v1';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  userRole: 'store_manager',
  assignedStoreId: null,
  assignedStoreName: null,
  loading: true,
  signIn: async () => {},
  signInWithCredentials: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('store_manager');
  const [assignedStoreId, setAssignedStoreId] = useState<string | null>(null);
  const [assignedStoreName, setAssignedStoreName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const applyCredentialSession = (session: CredentialSession) => {
    setUser({
      uid: session.uid,
      email: session.email,
      displayName: session.displayName,
      photoURL: null,
      authProvider: 'credentials',
    });
    setIsSuperAdmin(session.isSuperAdmin);
    setIsAdmin(true);
    setUserRole(session.role);
    setAssignedStoreId(session.isSuperAdmin ? null : session.storeId || 'default');
    setAssignedStoreName(
      session.isSuperAdmin
        ? 'Todos os Estabelecimentos (Plataforma)'
        : session.storeName || 'Estabelecimento Vinculado'
    );
  };

  useEffect(() => {
    let unsubscribeMemberDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (unsubscribeMemberDoc) {
        unsubscribeMemberDoc();
        unsubscribeMemberDoc = null;
      }

      if (currentUser) {
        // Clear any manual credential session if Google Auth is active
        try {
          localStorage.removeItem(CREDENTIAL_SESSION_KEY);
        } catch {}

        const emailLower = currentUser.email?.trim().toLowerCase() || '';
        const isSuper = emailLower === SUPER_ADMIN_EMAIL;

        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          authProvider: 'google',
        });
        setIsSuperAdmin(isSuper);

        if (isSuper) {
          setIsAdmin(true);
          setUserRole('platform_admin');
          setAssignedStoreId(null);
          setAssignedStoreName('Todos os Estabelecimentos (Plataforma)');
          setLoading(false);
        } else {
          try {
            const uidDocRef = doc(db, 'admins', currentUser.uid);
            const emailSanitized = emailLower.replace(/[^a-zA-Z0-9_-]/g, '_');
            const emailDocRef = emailSanitized ? doc(db, 'admins', emailSanitized) : null;

            const uidDoc = await getDoc(uidDocRef);

            if (uidDoc.exists()) {
              const data = uidDoc.data();
              const resolvedRole: UserRole =
                data.role === 'admin' ? 'store_manager' : (data.role as UserRole) || 'store_manager';
              const resolvedStoreId = data.storeId && data.storeId !== 'all' ? data.storeId : 'default';
              setIsAdmin(true);
              setUserRole(resolvedRole);
              setAssignedStoreId(resolvedStoreId);
              setAssignedStoreName(data.storeName || null);
            } else if (emailDocRef) {
              const emailDoc = await getDoc(emailDocRef);
              if (emailDoc.exists()) {
                const data = emailDoc.data();
                const resolvedRole: UserRole =
                  data.role === 'admin' ? 'store_manager' : (data.role as UserRole) || 'store_manager';
                const resolvedStoreId = data.storeId && data.storeId !== 'all' ? data.storeId : 'default';
                setIsAdmin(true);
                setUserRole(resolvedRole);
                setAssignedStoreId(resolvedStoreId);
                setAssignedStoreName(data.storeName || null);

                await setDoc(
                  uidDocRef,
                  {
                    uid: currentUser.uid,
                    email: emailLower,
                    role: resolvedRole,
                    storeId: resolvedStoreId,
                    storeName: data.storeName || 'Estabelecimento Vinculado',
                    nome: data.nome || currentUser.displayName || emailLower.split('@')[0],
                    criadoEm: data.criadoEm || new Date().toISOString(),
                  },
                  { merge: true }
                );
              } else {
                const storesSnap = await getDocs(collection(db, 'store_config'));
                let matchedStoreId: string | null = null;
                let matchedStoreName: string | null = null;

                storesSnap.forEach((sDoc) => {
                  const sData = sDoc.data();
                  if (sData.gerenteEmail && sData.gerenteEmail.trim().toLowerCase() === emailLower) {
                    matchedStoreId = sDoc.id;
                    matchedStoreName = sData.nome || sDoc.id;
                  }
                });

                if (matchedStoreId) {
                  setIsAdmin(true);
                  setUserRole('store_manager');
                  setAssignedStoreId(matchedStoreId);
                  setAssignedStoreName(matchedStoreName);
                  await setDoc(
                    uidDocRef,
                    {
                      uid: currentUser.uid,
                      email: emailLower,
                      role: 'store_manager',
                      storeId: matchedStoreId,
                      storeName: matchedStoreName || 'Estabelecimento',
                      nome: currentUser.displayName || emailLower.split('@')[0],
                      criadoEm: new Date().toISOString(),
                    },
                    { merge: true }
                  );
                } else {
                  setIsAdmin(false);
                  setUserRole('store_manager');
                  setAssignedStoreId(null);
                  setAssignedStoreName(null);
                }
              }
            } else {
              setIsAdmin(false);
              setAssignedStoreId(null);
              setAssignedStoreName(null);
            }

            if (emailDocRef) {
              unsubscribeMemberDoc = onSnapshot(
                emailDocRef,
                (snap) => {
                  if (snap.exists()) {
                    const data = snap.data();
                    const resolvedRole: UserRole =
                      data.role === 'admin' ? 'store_manager' : (data.role as UserRole) || 'store_manager';
                    const resolvedStoreId = data.storeId && data.storeId !== 'all' ? data.storeId : 'default';
                    setIsAdmin(true);
                    setUserRole(resolvedRole);
                    setAssignedStoreId(resolvedStoreId);
                    setAssignedStoreName(data.storeName || null);
                  }
                },
                () => {}
              );
            }
          } catch (err) {
            console.warn('Verificação de permissão e vínculo de estabelecimento:', err);
            setIsAdmin(false);
          }
          setLoading(false);
        }
      } else {
        // Check if there is an active E-mail + Senha/PIN session saved
        try {
          const savedRaw = localStorage.getItem(CREDENTIAL_SESSION_KEY);
          if (savedRaw) {
            const parsed: CredentialSession = JSON.parse(savedRaw);
            if (parsed && parsed.email) {
              applyCredentialSession(parsed);
              const emailSanitized = parsed.email.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
              if (emailSanitized && !parsed.isSuperAdmin) {
                const emailDocRef = doc(db, 'admins', emailSanitized);
                unsubscribeMemberDoc = onSnapshot(
                  emailDocRef,
                  (snap) => {
                    if (snap.exists()) {
                      const data = snap.data();
                      const resolvedRole: UserRole =
                        data.role === 'admin' ? 'store_manager' : (data.role as UserRole) || 'store_manager';
                      const resolvedStoreId = data.storeId && data.storeId !== 'all' ? data.storeId : 'default';
                      const updatedSession: CredentialSession = {
                        ...parsed,
                        displayName: data.nome || parsed.displayName,
                        role: resolvedRole,
                        storeId: resolvedStoreId,
                        storeName: data.storeName || parsed.storeName,
                      };
                      applyCredentialSession(updatedSession);
                      try {
                        localStorage.setItem(CREDENTIAL_SESSION_KEY, JSON.stringify(updatedSession));
                      } catch {}
                    }
                  },
                  () => {}
                );
              }
              setLoading(false);
              return;
            }
          }
        } catch {}

        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setUserRole('store_manager');
        setAssignedStoreId(null);
        setAssignedStoreName(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMemberDoc) unsubscribeMemberDoc();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Falha no login com Google:', error);
      throw error;
    }
  };

  const handleSignInWithCredentials = async (rawEmail: string, rawPassword: string) => {
    const emailLower = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();

    if (!emailLower || !password) {
      throw new Error('Preencha o e-mail e a senha/PIN de acesso.');
    }

    const emailSanitized = emailLower.replace(/[^a-zA-Z0-9_-]/g, '_');
    const isSuper = emailLower === SUPER_ADMIN_EMAIL;

    // 1. Check Firestore `admins` document
    let adminData: Record<string, any> | null = null;
    try {
      const adminSnap = await getDoc(doc(db, 'admins', emailSanitized));
      if (adminSnap.exists()) {
        adminData = adminSnap.data();
      }
    } catch (err) {
      console.warn('Consulta offline de credenciais:', err);
    }

    // 2. Fallback: Check local team cache if offline
    if (!adminData) {
      try {
        const cachedRaw = localStorage.getItem(LOCAL_TEAM_CACHE_KEY);
        if (cachedRaw) {
          const list: any[] = JSON.parse(cachedRaw);
          const found = list.find((m) => (m.email || '').trim().toLowerCase() === emailLower);
          if (found) adminData = found;
        }
      } catch {}
    }

    // 3. Super Admin authentication
    if (isSuper) {
      const expectedPassword = adminData?.senha ? String(adminData.senha).trim() : null;
      const validSuperPass = expectedPassword
        ? password === expectedPassword
        : ['admin123', '123456', 'max123'].includes(password);

      if (!validSuperPass) {
        throw new Error('Senha incorreta para o administrador da plataforma.');
      }

      const session: CredentialSession = {
        uid: emailSanitized,
        email: emailLower,
        displayName: adminData?.nome || 'Maxuell (Master Plataforma)',
        role: 'platform_admin',
        storeId: null,
        storeName: 'Todos os Estabelecimentos (Plataforma)',
        isSuperAdmin: true,
      };
      try {
        localStorage.setItem(CREDENTIAL_SESSION_KEY, JSON.stringify(session));
      } catch {}
      applyCredentialSession(session);
      return;
    }

    // 4. Bound Store Manager / Kitchen / Attendant in `admins`
    if (adminData) {
      const savedPass = adminData.senha ? String(adminData.senha).trim() : '123456';
      if (password !== savedPass) {
        throw new Error('Senha ou PIN incorreto para este usuário.');
      }

      const resolvedRole: UserRole =
        adminData.role === 'admin' ? 'store_manager' : (adminData.role as UserRole) || 'store_manager';
      const resolvedStoreId =
        adminData.storeId && adminData.storeId !== 'all' ? adminData.storeId : 'default';

      const session: CredentialSession = {
        uid: emailSanitized,
        email: emailLower,
        displayName: adminData.nome || emailLower.split('@')[0],
        role: resolvedRole,
        storeId: resolvedStoreId,
        storeName: adminData.storeName || 'Estabelecimento Vinculado',
        isSuperAdmin: false,
      };
      try {
        localStorage.setItem(CREDENTIAL_SESSION_KEY, JSON.stringify(session));
      } catch {}
      applyCredentialSession(session);
      return;
    }

    // 5. Check `store_config` collection for `gerenteEmail`
    try {
      const storesSnap = await getDocs(collection(db, 'store_config'));
      let matchedStore: { id: string; nome: string; gerenteNome?: string; gerenteSenha?: string } | null = null;
      storesSnap.forEach((sDoc) => {
        const sData = sDoc.data();
        if (sData.gerenteEmail && sData.gerenteEmail.trim().toLowerCase() === emailLower) {
          matchedStore = {
            id: sDoc.id,
            nome: sData.nome || sDoc.id,
            gerenteNome: sData.gerenteNome,
            gerenteSenha: sData.gerenteSenha,
          };
        }
      });

      if (matchedStore) {
        const storeMatch = matchedStore as {
          id: string;
          nome: string;
          gerenteNome?: string;
          gerenteSenha?: string;
        };
        const expectedPass = storeMatch.gerenteSenha ? String(storeMatch.gerenteSenha).trim() : '123456';
        if (password !== expectedPass) {
          throw new Error('Senha ou PIN incorreto para o gerente deste estabelecimento.');
        }

        const session: CredentialSession = {
          uid: emailSanitized,
          email: emailLower,
          displayName: storeMatch.gerenteNome || emailLower.split('@')[0],
          role: 'store_manager',
          storeId: storeMatch.id,
          storeName: storeMatch.nome,
          isSuperAdmin: false,
        };
        try {
          localStorage.setItem(CREDENTIAL_SESSION_KEY, JSON.stringify(session));
        } catch {}
        applyCredentialSession(session);
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Senha')) {
        throw err;
      }
    }

    throw new Error(
      'E-mail não encontrado ou ainda não vinculado a nenhum estabelecimento. Solicite o cadastro ao administrador.'
    );
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem(CREDENTIAL_SESSION_KEY);
    } catch {}
    setUser(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setUserRole('store_manager');
    setAssignedStoreId(null);
    setAssignedStoreName(null);
    try {
      if (auth.currentUser) {
        await logoutUser();
      }
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSuperAdmin,
        userRole,
        assignedStoreId,
        assignedStoreName,
        loading,
        signIn: handleSignIn,
        signInWithCredentials: handleSignInWithCredentials,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
