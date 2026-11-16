import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { createPomodoroSessionRow, getOrCreateUser } from '@/src/db/gateway.ts';

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    await getOrCreateUser(
      decoded.uid,
      decoded.email || 'estudante@universidade.edu.br',
      decoded.name
    );
    const result = await createPomodoroSessionRow(decoded.uid, {
      subjectId: String(body?.subjectId || 'geral'),
      subjectName: String(body?.subjectName || 'Estudo Geral'),
      mode: body?.mode || 'pomodoro25',
      durationMinutes: Number(body?.durationMinutes) || 25,
      dateKey: String(body?.dateKey || new Date().toISOString().slice(0, 10)),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to log session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
