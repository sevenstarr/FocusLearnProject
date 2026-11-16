import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import {
  createCommunityMessageRow,
  getOrCreateUser,
  listCommunityMessages,
} from '@/src/db/gateway.ts';
import type { CommunityChannel } from '@/lib/types';

const VALID_CHANNELS: CommunityChannel[] = ['calculo', 'algoritmos', 'geral'];

function parseChannel(value: string | null): CommunityChannel {
  if (value && VALID_CHANNELS.includes(value as CommunityChannel)) {
    return value as CommunityChannel;
  }
  return 'calculo';
}

export async function GET(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const channel = parseChannel(req.nextUrl.searchParams.get('channel'));

  try {
    const messages = await listCommunityMessages(channel);
    return NextResponse.json({ messages });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch community messages.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestAuth(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
    }
    const channel = parseChannel(body?.channel ?? null);

    const userRow = await getOrCreateUser(
      decoded.uid,
      decoded.email || 'estudante@universidade.edu.br',
      decoded.name
    );

    const message = await createCommunityMessageRow({
      authorId: decoded.uid,
      authorName: typeof body?.authorName === 'string' && body.authorName.trim()
        ? body.authorName
        : userRow.name,
      authorCourse: typeof body?.authorCourse === 'string' && body.authorCourse.trim()
        ? body.authorCourse
        : userRow.course,
      channel,
      text,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to post community message.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
