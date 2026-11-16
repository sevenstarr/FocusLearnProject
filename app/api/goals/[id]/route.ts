import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import {
  deleteGoalRow,
  incrementGoalRow,
  UUID_REGEX,
} from '@/src/db/repositories.ts';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid goal id.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const delta = Number(body?.delta) || 0;
    const goal = await incrementGoalRow(decoded.uid, id, delta);
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
    }
    return NextResponse.json({ goal });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update goal.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid goal id.' }, { status: 400 });
  }

  try {
    const deleted = await deleteGoalRow(decoded.uid, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete goal.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
