import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { deleteCommunityMessageRow, UUID_REGEX } from '@/src/db/repositories.ts';

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
    return NextResponse.json({ error: 'Invalid message id.' }, { status: 400 });
  }

  try {
    const deleted = await deleteCommunityMessageRow(decoded.uid, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete community message.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
