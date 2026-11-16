import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { getOrCreateUser } from '@/src/db/users.ts';
import { createSubject } from '@/src/db/repositories.ts';

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body?.code || !body?.name) {
      return NextResponse.json({ error: 'Invalid subject payload.' }, { status: 400 });
    }
    await getOrCreateUser(
      decoded.uid,
      decoded.email || 'estudante@universidade.edu.br',
      decoded.name
    );
    const subject = await createSubject(decoded.uid, body);
    return NextResponse.json({ subject }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create subject.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
