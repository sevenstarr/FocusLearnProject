import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { createTaskRow, getOrCreateUser } from '@/src/db/gateway.ts';

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Task title is required.' }, { status: 400 });
    }
    await getOrCreateUser(
      decoded.uid,
      decoded.email || 'estudante@universidade.edu.br',
      decoded.name
    );
    const task = await createTaskRow(
      decoded.uid,
      title,
      typeof body?.subjectId === 'string' ? body.subjectId : ''
    );
    return NextResponse.json({ task }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create task.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
