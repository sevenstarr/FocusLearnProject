import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { buyShopItem } from '@/src/db/shop.ts';
import { getOrCreateUser } from '@/src/db/gateway.ts';

export async function POST(req: NextRequest) {
  const user = await verifyRequestAuth(req);
  if (!user) return NextResponse.json({ error: 'Conta online necessária.' }, { status: 401 });
  try {
    await getOrCreateUser(user.uid, user.email, user.name);
    const body = await req.json();
    if (typeof body?.itemId !== 'string') return NextResponse.json({ error: 'Item inválido.' }, { status: 400 });
    return NextResponse.json(await buyShopItem(user.uid, body.itemId));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Compra recusada.' }, { status: 400 }); }
}
