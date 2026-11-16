import { NextResponse } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/src/lib/supabase.ts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = getSupabaseUrl() ?? null;
  const anonKey = getSupabaseAnonKey() ?? null;

  return NextResponse.json(
    {
      url,
      anonKey,
      configured: Boolean(url && anonKey),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
