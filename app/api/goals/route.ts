import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { createGoalRow, getOrCreateUser } from '@/src/db/gateway.ts';

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body?.title) {
      return NextResponse.json({ error: 'Goal title is required.' }, { status: 400 });
    }
    await getOrCreateUser(
      decoded.uid,
      decoded.email || 'estudante@universidade.edu.br',
      decoded.name
    );
    const goal = await createGoalRow(decoded.uid, body);
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create goal.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
