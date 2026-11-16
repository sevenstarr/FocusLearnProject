import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { getOrCreateUser } from '@/src/db/users.ts';
import { createNoteRow } from '@/src/db/repositories.ts';

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body?.title || !body?.content) {
      return NextResponse.json(
        { error: 'Title and content are required.' },
        { status: 400 }
      );
    }
    await getOrCreateUser(
      decoded.uid,
      decoded.email || 'estudante@universidade.edu.br',
      decoded.name
    );
    const note = await createNoteRow(decoded.uid, body);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create note.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
