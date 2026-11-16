import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { setStudyRunState } from '@/src/db/shop.ts';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyRequestAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const { state } = await req.json();
    if (!['pause', 'resume', 'cancel'].includes(state)) return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    return NextResponse.json({ run: await setStudyRunState(user.uid, id, state) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao atualizar sessão.' }, { status: 400 }); }
}
