import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { startStudyRun } from '@/src/db/shop.ts';
import { getOrCreateUser } from '@/src/db/gateway.ts';

export async function POST(req: NextRequest) {
  const user = await verifyRequestAuth(req);
  if (!user) return NextResponse.json({ error: 'Conta online necessária para iniciar sessões recompensadas.' }, { status: 401 });
  try {
    await getOrCreateUser(user.uid, user.email, user.name);
    const body = await req.json();
    if (body?.mode !== 'pomodoro25' && body?.mode !== 'ultra50') return NextResponse.json({ error: 'Modo de foco inválido.' }, { status: 400 });
    const run = await startStudyRun(user.uid, body.mode, typeof body.subjectId === 'string' ? body.subjectId : 'geral', typeof body.subjectName === 'string' ? body.subjectName : 'Estudo Geral');
    return NextResponse.json({ run });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível iniciar a sessão.' }, { status: 400 }); }
}
