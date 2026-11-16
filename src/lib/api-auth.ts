import { NextRequest } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.ts';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  photoURL?: string;
}

export async function verifyRequestAuth(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    console.warn('Supabase Auth verification skipped: Supabase credentials not configured.');
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      if (error) {
        console.warn(`Supabase token validation rejected: ${error.message}`);
      }
      return null;
    }

    const meta = (data.user.user_metadata || {}) as Record<string, unknown>;
    const fullName =
      (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
      (typeof meta.name === 'string' && meta.name.trim()) ||
      data.user.email?.split('@')[0] ||
      'Estudante FocusLearn';
    const photoURL =
      (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
      (typeof meta.picture === 'string' && meta.picture.trim()) ||
      undefined;

    return {
      uid: data.user.id,
      email: data.user.email || 'estudante@universidade.edu.br',
      name: fullName,
      photoURL,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Error verifying Supabase access token: ${message}`);
    return null;
  }
}
