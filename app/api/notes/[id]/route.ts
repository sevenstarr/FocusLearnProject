import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import {
  deleteNoteRow,
  updateNoteRow,
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
    return NextResponse.json({ error: 'Invalid note id.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const note = await updateNoteRow(decoded.uid, id, body);
    if (!note) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }
    return NextResponse.json({ note });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update note.';
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
    return NextResponse.json({ error: 'Invalid note id.' }, { status: 400 });
  }

  try {
    const deleted = await deleteNoteRow(decoded.uid, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete note.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
