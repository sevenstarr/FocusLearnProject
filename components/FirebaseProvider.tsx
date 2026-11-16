'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthResult {
  ok: boolean;
  message: string;
  needsProviderSetup?: boolean;
}

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  signOutUser: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

function mapFirebaseAuthError(err: unknown): AuthResult {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';

  if (code === 'auth/operation-not-allowed') {
    return {
      ok: false,
      needsProviderSetup: true,
      message:
        'O login por E-mail/Senha ainda não foi ativado no Console do Firebase deste projeto. Use "Entrar com Google" imediatamente ou ative "Email/Password" em Authentication > Sign-in method no Firebase Console.',
    };
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return {
      ok: false,
      message: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
    };
  }
  if (code === 'auth/email-already-in-use') {
    return {
      ok: false,
      message: 'Este e-mail já possui uma conta cadastrada. Tente fazer login.',
    };
  }
  if (code === 'auth/weak-password') {
    return {
      ok: false,
      message: 'A senha precisa ter pelo menos 6 caracteres.',
    };
  }
  if (code === 'auth/popup-closed-by-user') {
    return {
      ok: false,
      message: 'A janela de autenticação do Google foi fechada antes da conclusão.',
    };
  }
  if (code === 'auth/too-many-requests') {
    return {
      ok: false,
      message: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
    };
  }
  return {
    ok: false,
    message: err instanceof Error ? err.message : 'Erro inesperado na autenticação.',
  };
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { ok: true, message: 'Autenticado com Google com sucesso!' };
    } catch (err) {
      return mapFirebaseAuthError(err);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        await sendEmailVerification(cred.user);
        return {
          ok: true,
          message:
            'Login efetuado! Enviamos um e-mail de verificação para liberar a sincronização na nuvem.',
        };
      }
      return { ok: true, message: 'Login efetuado com sucesso!' };
    } catch (err) {
      return mapFirebaseAuthError(err);
    }
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await sendEmailVerification(cred.user);
      return {
        ok: true,
        message:
          'Conta criada! Verifique sua caixa de entrada para confirmar o e-mail e sincronizar seus dados.',
      };
    } catch (err) {
      return mapFirebaseAuthError(err);
    }
  };

  const sendPasswordReset = async (email: string): Promise<AuthResult> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        ok: true,
        message: `Link de redefinição enviado para ${email}.`,
      };
    } catch (err) {
      return mapFirebaseAuthError(err);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signOutUser,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
}
