import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { completeStudyRun } from '@/src/db/shop.ts';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyRequestAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const result = await completeStudyRun(user.uid, id, new Date().toISOString().slice(0, 10));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao concluir sessão.';
    const early = message.includes('ainda não') || message.includes('Session is not complete');
    return NextResponse.json({ error: early ? 'A sessão ainda não completou o tempo de foco.' : message }, { status: early ? 425 : 400 });
  }
}
