import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  var _supabaseAdminClient: SupabaseClient | undefined;
  var _supabaseClientSignature: string | undefined;
}

export function cleanEnvValue(raw: string | undefined): string | undefined {
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

export function getSupabaseUrl(): string | undefined {
  const raw = cleanEnvValue(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  if (!raw) return undefined;
  const normalized = raw.replace(/\/+$/, '');
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return undefined;
    }
    return normalized;
  } catch {
    return undefined;
  }
}

export function getSupabaseAnonKey(): string | undefined {
  return cleanEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );
}

export function getSupabaseServiceKey(): string | undefined {
  return cleanEnvValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceKey());
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase credentials are not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).'
    );
  }

  const signature = `${url}::${serviceKey.slice(0, 12)}`;
  if (!global._supabaseAdminClient || global._supabaseClientSignature !== signature) {
    global._supabaseAdminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    global._supabaseClientSignature = signature;
  }

  return global._supabaseAdminClient;
}
