'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;
let browserClientSignature = '';
const memoryStorage = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  },
};

function cleanPublicValue(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^["']|["']$/g, '').trim();
  if (!trimmed) return undefined;
  if (
    trimmed.includes('YOUR_PROJECT_REF') ||
    trimmed.includes('YOUR_SUPABASE_') ||
    trimmed.startsWith('MY_')
  ) {
    return undefined;
  }
  return trimmed;
}

export interface PublicSupabaseConfig {
  url: string;
  anonKey: string;
}

export function getInlineSupabaseConfig(): PublicSupabaseConfig | null {
  const url = cleanPublicValue(process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, '');
  const anonKey = cleanPublicValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getSupabaseBrowserClient(
  config?: Partial<PublicSupabaseConfig> | null
): SupabaseClient | null {
  const inline = getInlineSupabaseConfig();
  const url = cleanPublicValue(config?.url)?.replace(/\/+$/, '') || inline?.url;
  const anonKey = cleanPublicValue(config?.anonKey) || inline?.anonKey;

  if (!url || !anonKey) {
    return null;
  }

  const signature = `${url}::${anonKey.slice(0, 12)}`;
  if (!browserClient || browserClientSignature !== signature) {
    browserClient = createClient(url, anonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? safeStorage : undefined,
      },
    });
    browserClientSignature = signature;
  }

  return browserClient;
}
