import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SUPER_ADMIN_EMAIL = 'maxuell86@gmail.com';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isSuper = currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(isSuper);

        if (isSuper) {
          setIsAdmin(true);
        } else {
          try {
            const uidDocRef = doc(db, 'admins', currentUser.uid);
            const uidDoc = await getDoc(uidDocRef);

            if (uidDoc.exists()) {
              setIsAdmin(true);
            } else if (currentUser.email) {
              const emailSanitized = currentUser.email.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
              const emailDocRef = doc(db, 'admins', emailSanitized);
              const emailDoc = await getDoc(emailDocRef);

              if (emailDoc.exists()) {
                setIsAdmin(true);
                const data = emailDoc.data();
                // Espelha sob o UID do usuário para validação direta nas Security Rules
                await setDoc(uidDocRef, {
                  uid: currentUser.uid,
                  email: currentUser.email.toLowerCase(),
                  role: data.role || 'admin',
                  nome: data.nome || currentUser.displayName || currentUser.email.split('@')[0],
                  criadoEm: data.criadoEm || new Date().toISOString(),
                }, { merge: true });
              } else {
                setIsAdmin(false);
              }
            } else {
              setIsAdmin(false);
            }
          } catch (err) {
            console.warn('Verificação de permissão admin:', err);
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
