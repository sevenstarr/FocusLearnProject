import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/src/lib/api-auth.ts';
import { getSupabaseAdmin } from '@/src/lib/supabase.ts';
import { getOrCreateUser } from '@/src/db/gateway.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await verifyRequestAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Sala inválida.' }, { status: 400 });
  try {
    await getOrCreateUser(user.uid, user.email, user.name);
    const supabase = getSupabaseAdmin();
    const { data: room, error: roomError } = await supabase.from('study_rooms').select('id').eq('id', id).maybeSingle();
    if (roomError) throw roomError;
    if (!room) return NextResponse.json({ error: 'Sala não encontrada.' }, { status: 404 });
    const { error } = await supabase.from('study_room_presence').upsert({ room_id: id, user_id: user.uid, last_seen: new Date().toISOString() }, { onConflict: 'room_id,user_id' });
    if (error) throw error;
    await supabase.from('study_rooms').update({ updated_at: new Date().toISOString() }).eq('id', id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Não foi possível entrar na sala.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await verifyRequestAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Sala inválida.' }, { status: 400 });
  try {
    const { error } = await getSupabaseAdmin().from('study_room_presence').delete().eq('room_id', id).eq('user_id', user.uid);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Não foi possível sair da sala.' }, { status: 500 });
  }
}
