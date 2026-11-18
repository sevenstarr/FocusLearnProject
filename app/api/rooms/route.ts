import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { getSupabaseAdmin } from '@/src/lib/supabase.ts';
import { readJsonBody, RequestBodyError } from '@/src/lib/request-body.ts';
import { getOrCreateUser } from '@/src/db/gateway.ts';

export async function GET(req: NextRequest) {
  const user = await verifyRequestAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const supabase = getSupabaseAdmin();
    await getOrCreateUser(user.uid, user.email, user.name);
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase.from('study_rooms')
      .select('id,title,goal,owner_id,created_at,updated_at,study_room_presence(user_id,last_seen)')
      .gte('updated_at', cutoff).order('updated_at', { ascending: false }).limit(30);
    if (error) throw error;
    const activeSince = Date.now() - 45_000;
    const rooms = (data || []).map((room) => {
      const participants = Array.isArray(room.study_room_presence) ? room.study_room_presence : [];
      return {
        id: room.id,
        title: room.title,
        goal: room.goal,
        ownerId: room.owner_id,
        createdAt: room.created_at,
        participants: participants.filter((entry) => new Date(entry.last_seen).getTime() >= activeSince).length,
        joined: participants.some((entry) => entry.user_id === user.uid && new Date(entry.last_seen).getTime() >= activeSince),
      };
    }).filter((room) => room.participants > 0);
    return NextResponse.json({ rooms });
  } catch {
    return NextResponse.json({ error: 'Não foi possível carregar as salas de foco.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await verifyRequestAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await readJsonBody(req, 2_048) as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const goal = typeof body.goal === 'string' ? body.goal.trim() : '';
    if (!title || title.length > 100 || goal.length > 240) return NextResponse.json({ error: 'Informe um título de até 100 caracteres e uma meta de até 240 caracteres.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    await getOrCreateUser(user.uid, user.email, user.name);
    const { data: room, error } = await supabase.from('study_rooms').insert({ owner_id: user.uid, title, goal }).select('id,title,goal,owner_id,created_at').single();
    if (error) throw error;
    const { error: presenceError } = await supabase.from('study_room_presence').insert({ room_id: room.id, user_id: user.uid });
    if (presenceError) {
      await supabase.from('study_rooms').delete().eq('id', room.id).eq('owner_id', user.uid);
      throw presenceError;
    }
    return NextResponse.json({ room: { ...room, participants: 1, joined: true } }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Não foi possível criar a sala de foco.' }, { status: 500 });
  }
}
