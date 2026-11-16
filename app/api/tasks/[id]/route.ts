import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import {
  deleteTaskRow,
  updateTaskRow,
  UUID_REGEX,
} from '@/src/db/gateway.ts';

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
    return NextResponse.json({ error: 'Invalid task id.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const task = await updateTaskRow(decoded.uid, id, Boolean(body?.completed));
    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update task.';
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
    return NextResponse.json({ error: 'Invalid task id.' }, { status: 400 });
  }

  try {
    const deleted = await deleteTaskRow(decoded.uid, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete task.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
