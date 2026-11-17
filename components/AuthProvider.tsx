'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Session, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import {
  getInlineSupabaseConfig,
  getSupabaseBrowserClient,
  type PublicSupabaseConfig,
} from '@/lib/supabase-browser';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthResult {
  ok: boolean;
  message: string;
  needsProviderSetup?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  authReady: boolean;
  passwordRecoveryReady: boolean;
  supabaseConfigured: boolean;
  getAccessToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getAuthRedirectUrl(path: string): string {
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  const base = configuredBase || 'https://focuslearnproject.vercel.app';
  return new URL(path, `${base}/`).toString();
}

function mapSupabaseUser(
  user: SupabaseUser | null | undefined,
  session: Session | null | undefined
): AuthUser | null {
  if (!user) return null;
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const displayName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    user.email?.split('@')[0] ||
    'Estudante FocusLearn';
  const photoURL =
    (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
    (typeof meta.picture === 'string' && meta.picture.trim()) ||
    null;

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName,
    photoURL,
    emailVerified: Boolean(
      user.email_confirmed_at ||
        user.confirmed_at ||
        user.app_metadata?.provider === 'google' ||
        session?.access_token
    ),
  };
}

function mapSupabaseAuthError(err: unknown): AuthResult {
  const rawMessage =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : err instanceof Error
        ? err.message
        : 'Erro inesperado na autenticação.';

  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('provider is not enabled') ||
    lower.includes('unsupported provider')
  ) {
    return {
      ok: false,
      needsProviderSetup: true,
      message:
        'O login com Google ainda não foi ativado no painel do Supabase. Ative Google em Authentication > Providers > Google e configure as URLs de callback.',
    };
  }
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_credentials')
  ) {
    return {
      ok: false,
      message:
        'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
    };
  }
  if (lower.includes('email not confirmed')) {
    return {
      ok: false,
      message:
        'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (ou spam) para ativar a conta.',
    };
  }
  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered')
  ) {
    return {
      ok: false,
      message: 'Este e-mail já possui uma conta cadastrada. Tente fazer login.',
    };
  }
  if (lower.includes('password should be at least') || lower.includes('weak_password')) {
    return {
      ok: false,
      message: 'A senha precisa ter pelo menos 6 caracteres.',
    };
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      ok: false,
      message: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
    };
  }
  if (lower.includes('access_denied')) {
    return {
      ok: false,
      message: 'A autenticação com o Google foi cancelada.',
    };
  }
  return {
    ok: false,
    message: rawMessage || 'Erro inesperado na autenticação.',
  };
}

interface OAuthCallbackPayload {
  type?: string;
  search?: string;
  hash?: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [passwordRecoveryReady, setPasswordRecoveryReady] = useState(false);
  const [config, setConfig] = useState<PublicSupabaseConfig | null>(() =>
    getInlineSupabaseConfig()
  );

  const clientRef = useRef<SupabaseClient | null>(
    getSupabaseBrowserClient(getInlineSupabaseConfig())
  );
  const sessionRef = useRef<Session | null>(null);
  const pendingOAuthResolverRef = useRef<((res: AuthResult) => void) | null>(null);
  const pendingOAuthPopupRef = useRef<Window | null>(null);

  const completeOAuthFromParams = useCallback(
    async (
      client: SupabaseClient,
      search: string,
      hash: string
    ): Promise<AuthResult> => {
      const searchParams = new URLSearchParams(search || '');
      const hashParams = new URLSearchParams((hash || '').replace(/^#/, ''));

      const oauthError =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (oauthError) {
        return mapSupabaseAuthError(new Error(decodeURIComponent(oauthError)));
      }

      const code = searchParams.get('code');
      if (code) {
        const { data, error } = await client.auth.exchangeCodeForSession(code);
        if (error) {
          return mapSupabaseAuthError(error);
        }
        sessionRef.current = data.session ?? null;
        setUser(mapSupabaseUser(data.user ?? data.session?.user, data.session));
        return { ok: true, message: 'Autenticado com Google com sucesso!' };
      }

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        const { data, error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          return mapSupabaseAuthError(error);
        }
        sessionRef.current = data.session ?? null;
        setUser(mapSupabaseUser(data.user ?? data.session?.user, data.session));
        return { ok: true, message: 'Autenticado com Google com sucesso!' };
      }

      const { data: sessionData } = await client.auth.getSession();
      if (sessionData.session) {
        sessionRef.current = sessionData.session;
        setUser(mapSupabaseUser(sessionData.session.user, sessionData.session));
        return { ok: true, message: 'Autenticado com Google com sucesso!' };
      }

      return {
        ok: false,
        message: 'Não foi possível concluir a autenticação com Google.',
      };
    },
    []
  );

  // Resolve runtime public Supabase config if not inlined at build time
  useEffect(() => {
    if (config) return;
    let active = true;

    async function loadRuntimeConfig() {
      try {
        const res = await fetch('/api/auth/config', { cache: 'no-store' });
        if (!res.ok) {
          if (active) setAuthReady(true);
          return;
        }
        const json = (await res.json()) as {
          url?: string | null;
          anonKey?: string | null;
          configured?: boolean;
        };
        if (active && json.url && json.anonKey) {
          const resolved = { url: json.url, anonKey: json.anonKey };
          clientRef.current = getSupabaseBrowserClient(resolved);
          setConfig(resolved);
        } else if (active) {
          setAuthReady(true);
        }
      } catch {
        if (active) setAuthReady(true);
      }
    }

    void loadRuntimeConfig();
    return () => {
      active = false;
    };
  }, [config]);

  // Initialize Supabase session, URL redirect params, and auth listener
  useEffect(() => {
    const client = getSupabaseBrowserClient(config);
    clientRef.current = client;

    if (!client) {
      return;
    }

    let active = true;

    async function initAuth() {
      if (!client) return;
      try {
        if (typeof window !== 'undefined') {
          const search = window.location.search;
          const hash = window.location.hash;
          const searchParams = new URLSearchParams(search);
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const isPasswordRecovery =
            searchParams.get('flow') === 'recovery' ||
            searchParams.get('type') === 'recovery' ||
            hashParams.get('type') === 'recovery';
          if (
            search.includes('code=') ||
            search.includes('error=') ||
            hash.includes('access_token=') ||
            hash.includes('error=')
          ) {
            const result = await completeOAuthFromParams(client, search, hash);
            if (isPasswordRecovery) {
              setPasswordRecoveryReady(result.ok);
            }
            const cleanUrl = isPasswordRecovery
              ? `${window.location.pathname}?flow=recovery`
              : window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }

        const { data } = await client.auth.getSession();
        if (!active) return;
        sessionRef.current = data.session ?? null;
        setUser(mapSupabaseUser(data.session?.user, data.session));
      } finally {
        if (active) setAuthReady(true);
      }
    }

    void initAuth();

    const { data: subscription } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryReady(true);
      }
      sessionRef.current = session;
      setUser(mapSupabaseUser(session?.user, session));
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [config, completeOAuthFromParams]);

  // Listen for popup OAuth completion via postMessage and BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePayload = async (payload: OAuthCallbackPayload | null | undefined) => {
      if (
        !payload ||
        payload.type !== 'SUPABASE_OAUTH_CALLBACK' ||
        typeof payload.search !== 'string' ||
        payload.search.length > 8192 ||
        !pendingOAuthResolverRef.current
      ) return;

      const callbackParams = new URLSearchParams(payload.search);
      if (!callbackParams.has('code') && !callbackParams.has('error')) return;

      const client = clientRef.current;
      if (!client) return;

      const result = await completeOAuthFromParams(client, payload.search, '');
      if (pendingOAuthResolverRef.current) {
        const resolve = pendingOAuthResolverRef.current;
        pendingOAuthResolverRef.current = null;
        resolve(result);
      }
    };

    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== pendingOAuthPopupRef.current
      ) return;
      void handlePayload(event.data as OAuthCallbackPayload);
    };

    window.addEventListener('message', onMessage);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('focuslearn_oauth');
        bc.onmessage = (event) => {
          void handlePayload(event.data as OAuthCallbackPayload);
        };
      }
    } catch {
      // BroadcastChannel unavailable in restricted contexts
    }

    return () => {
      window.removeEventListener('message', onMessage);
      bc?.close();
    };
  }, [completeOAuthFromParams]);

  const ensureClient = useCallback(async (): Promise<SupabaseClient | null> => {
    if (clientRef.current) return clientRef.current;
    try {
      const res = await fetch('/api/auth/config', { cache: 'no-store' });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        url?: string | null;
        anonKey?: string | null;
      };
      if (json.url && json.anonKey) {
        const resolved = { url: json.url, anonKey: json.anonKey };
        const client = getSupabaseBrowserClient(resolved);
        clientRef.current = client;
        setConfig(resolved);
        return client;
      }
    } catch {
      // Ignore network errors
    }
    return null;
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const client = clientRef.current;
    if (!client) return null;
    const { data } = await client.auth.getSession();
    sessionRef.current = data.session ?? null;
    return data.session?.access_token ?? null;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    return {
      ok: false,
      message: 'O acesso com Google está temporariamente indisponível. Entre com e-mail e senha.',
    };
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const client = await ensureClient();
      if (!client) {
        return {
          ok: false,
          needsProviderSetup: true,
          message:
            'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nos Secrets para entrar com sua conta.',
        };
      }

      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return mapSupabaseAuthError(error);
        }
        sessionRef.current = data.session ?? null;
        setUser(mapSupabaseUser(data.user, data.session));
        return { ok: true, message: 'Login efetuado com sucesso!' };
      } catch (err) {
        return mapSupabaseAuthError(err);
      }
    },
    [ensureClient]
  );

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const client = await ensureClient();
      if (!client) {
        return {
          ok: false,
          needsProviderSetup: true,
          message:
            'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nos Secrets para criar sua conta.',
        };
      }

      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              name,
            },
            emailRedirectTo: getAuthRedirectUrl('/auth/callback'),
          },
        });
        if (error) {
          return mapSupabaseAuthError(error);
        }

        if (data.session) {
          sessionRef.current = data.session;
          setUser(mapSupabaseUser(data.user, data.session));
          return {
            ok: true,
            message: 'Conta criada e sincronizada com sucesso!',
          };
        }

        return {
          ok: true,
          message:
            'Conta criada! Verifique sua caixa de entrada para confirmar o e-mail e liberar a sincronização na nuvem.',
        };
      } catch (err) {
        return mapSupabaseAuthError(err);
      }
    },
    [ensureClient]
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<AuthResult> => {
      const client = await ensureClient();
      if (!client) {
        return {
          ok: false,
          needsProviderSetup: true,
          message:
            'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nos Secrets para recuperar sua senha.',
        };
      }

      try {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: getAuthRedirectUrl('/auth/callback?next=/recuperar-senha&flow=recovery'),
        });
        if (error) {
          return mapSupabaseAuthError(error);
        }
        return {
          ok: true,
          message: `Link de redefinição enviado para ${email}.`,
        };
      } catch (err) {
        return mapSupabaseAuthError(err);
      }
    },
    [ensureClient]
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<AuthResult> => {
      const client = await ensureClient();
      if (!client) {
        return {
          ok: false,
          message: 'Cliente Supabase Auth indisponível.',
        };
      }

      try {
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) {
          return mapSupabaseAuthError(error);
        }
        return {
          ok: true,
          message: 'Senha redefinida com sucesso! Você já pode acessar sua conta.',
        };
      } catch (err) {
        return mapSupabaseAuthError(err);
      }
    },
    [ensureClient]
  );

  const signOutUser = useCallback(async () => {
    const client = clientRef.current;
    if (client) {
      await client.auth.signOut();
    }
    sessionRef.current = null;
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        passwordRecoveryReady,
        supabaseConfigured: Boolean(config),
        getAccessToken,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        updatePassword,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

