import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser } from '../services/firebase';
import { UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: UserRole;
  assignedStoreId: string | null;
  assignedStoreName: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const SUPER_ADMIN_EMAIL = 'maxuell86@gmail.com';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  userRole: 'store_manager',
  assignedStoreId: null,
  assignedStoreName: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('store_manager');
  const [assignedStoreId, setAssignedStoreId] = useState<string | null>(null);
  const [assignedStoreName, setAssignedStoreName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeMemberDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeMemberDoc) {
        unsubscribeMemberDoc();
        unsubscribeMemberDoc = null;
      }

      setUser(currentUser);
      if (currentUser) {
        const emailLower = currentUser.email?.trim().toLowerCase() || '';
        const isSuper = emailLower === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(isSuper);

        if (isSuper) {
          setIsAdmin(true);
          setUserRole('platform_admin');
          setAssignedStoreId(null); // Super Admin tem acesso global a todos os estabelecimentos
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

                // Espelha sob o UID do usuário para validação direta nas Security Rules
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
                // Verifica se o e-mail consta como gerenteEmail em algum estabelecimento em store_config
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

            // Escuta alterações em tempo real no vínculo do usuário (caso o Gerente da Plataforma altere o estabelecimento vinculado)
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

  const handleSignOut = async () => {
    try {
      await logoutUser();
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
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

