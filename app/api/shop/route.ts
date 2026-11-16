import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { getShopState } from '@/src/db/shop.ts';
import { getOrCreateUser } from '@/src/db/gateway.ts';

export async function GET(req: NextRequest) {
  const user = await verifyRequestAuth(req);
  if (!user) return NextResponse.json({ error: 'Conta online necessária.' }, { status: 401 });
  try { await getOrCreateUser(user.uid, user.email, user.name); return NextResponse.json(await getShopState(user.uid)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao carregar a loja.' }, { status: 500 }); }
}
