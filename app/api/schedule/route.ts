import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { getOrCreateUser } from '@/src/db/users.ts';
import { createScheduleBlockRow } from '@/src/db/repositories.ts';

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body?.title) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }
    await getOrCreateUser(
      decoded.uid,
      decoded.email || 'estudante@universidade.edu.br',
      decoded.name
    );
    const block = await createScheduleBlockRow(decoded.uid, body);
    return NextResponse.json({ block }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create schedule block.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
