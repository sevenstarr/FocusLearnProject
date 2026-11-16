import { sql } from 'drizzle-orm';
import { db } from './index.ts';
import { getSupabaseAdmin } from '../lib/supabase.ts';
import { isSupabaseConfigured } from '../lib/supabase.ts';
import type { CosmeticCategory, ShopState } from '@/lib/types';
import { SHOP_ITEMS } from '@/lib/shopCatalog';

type DbRow = Record<string, unknown>;
const fromDbItem = (r: DbRow) => ({
  itemId: String(r.item_id), category: String(r.category) as CosmeticCategory,
  equipped: Boolean(r.equipped), acquiredAtMs: new Date(String(r.acquired_at)).getTime(),
});
const fromDbTransaction = (r: DbRow) => ({
  id: String(r.id), amount: Number(r.amount), type: String(r.type) as 'study' | 'purchase',
  description: String(r.description), createdAtMs: new Date(String(r.created_at)).getTime(),
});

export async function getShopState(uid: string): Promise<ShopState> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const [tx, owned, active] = await Promise.all([
      supabase.from('credit_transactions').select('*').eq('owner_id', uid).order('created_at', { ascending: false }).limit(30),
      supabase.from('cosmetic_ownership').select('*').eq('owner_id', uid),
      supabase.from('study_session_runs').select('*').eq('owner_id', uid).in('status', ['running', 'paused']).limit(1).maybeSingle(),
    ]);
    if (tx.error) throw tx.error;
    if (owned.error) throw owned.error;
    const transactions = (tx.data || []).map(fromDbTransaction);
    const { data: balanceData, error: balanceError } = await supabase.rpc('focus_shop_balance', { p_uid: uid });
    if (balanceError) throw balanceError;
    return {
      balance: Number(balanceData || 0), items: SHOP_ITEMS,
      transactions, owned: (owned.data || []).map(fromDbItem),
      activeSession: active.data ? { id: active.data.id, mode: active.data.mode, accumulatedSeconds: active.data.accumulated_seconds, activeSinceMs: active.data.active_since ? new Date(active.data.active_since).getTime() : null } : null,
    };
  }
  const [tx, owned, active, sum] = await Promise.all([
    db.execute(sql`SELECT * FROM credit_transactions WHERE owner_id=${uid} ORDER BY created_at DESC LIMIT 30`),
    db.execute(sql`SELECT * FROM cosmetic_ownership WHERE owner_id=${uid}`),
    db.execute(sql`SELECT * FROM study_session_runs WHERE owner_id=${uid} AND status IN ('running','paused') LIMIT 1`),
    db.execute(sql`SELECT coalesce(sum(amount),0)::int AS balance FROM credit_transactions WHERE owner_id=${uid}`),
  ]);
  const activeRow = active.rows[0] as DbRow | undefined;
  return {
    balance: Number((sum.rows[0] as DbRow | undefined)?.balance || 0), items: SHOP_ITEMS,
    transactions: tx.rows.map(fromDbTransaction), owned: owned.rows.map(fromDbItem),
    activeSession: activeRow ? { id: String(activeRow.id), mode: String(activeRow.mode) as 'pomodoro25'|'ultra50', accumulatedSeconds: Number(activeRow.accumulated_seconds), activeSinceMs: activeRow.active_since ? new Date(String(activeRow.active_since)).getTime() : null } : null,
  };
}

async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await getSupabaseAdmin().rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

export async function startStudyRun(uid: string, mode: 'pomodoro25'|'ultra50', subjectId: string, subjectName: string): Promise<DbRow> {
  if (isSupabaseConfigured()) return await rpc('focus_start_session', { p_uid: uid, p_mode: mode, p_subject_id: subjectId, p_subject_name: subjectName }) as DbRow;
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${uid}))`);
    const existing = await tx.execute(sql`SELECT * FROM study_session_runs WHERE owner_id=${uid} AND status IN ('running','paused') LIMIT 1`);
    if (existing.rows[0]) return existing.rows[0] as DbRow;
    const inserted = await tx.execute(sql`INSERT INTO study_session_runs(owner_id,subject_id,subject_name,mode,status,active_since) VALUES(${uid},${subjectId.slice(0,128)},${subjectName.slice(0,120)},${mode},'running',now()) RETURNING *`);
    return inserted.rows[0] as DbRow;
  });
}

export async function setStudyRunState(uid: string, id: string, state: 'pause'|'resume'|'cancel') {
  if (isSupabaseConfigured()) return rpc('focus_set_session_state', { p_uid: uid, p_id: id, p_state: state });
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${uid}))`);
    const rows = await tx.execute(sql`SELECT * FROM study_session_runs WHERE owner_id=${uid} AND id=${id} FOR UPDATE`);
    const r = rows.rows[0] as DbRow | undefined;
    if (!r || !['running','paused'].includes(String(r.status))) throw new Error('Sessão indisponível.');
    if (state === 'cancel') {
      await tx.execute(sql`UPDATE study_session_runs SET status='cancelled',active_since=NULL WHERE id=${id} AND owner_id=${uid}`);
    } else if (state === 'pause' && r.status === 'running') {
      await tx.execute(sql`UPDATE study_session_runs SET accumulated_seconds=accumulated_seconds+greatest(0,floor(extract(epoch FROM (now()-active_since)))::int),active_since=NULL,status='paused' WHERE id=${id} AND owner_id=${uid}`);
    } else if (state === 'resume' && r.status === 'paused') {
      await tx.execute(sql`UPDATE study_session_runs SET active_since=now(),status='running' WHERE id=${id} AND owner_id=${uid}`);
    } else throw new Error('Estado de sessão inválido.');
    const updated = await tx.execute(sql`SELECT * FROM study_session_runs WHERE id=${id}`);
    return updated.rows[0];
  });
}

export async function completeStudyRun(uid: string, id: string, dateKey: string) {
  if (isSupabaseConfigured()) {
    const result = await rpc('focus_complete_session', { p_uid: uid, p_id: id, p_date_key: dateKey }) as DbRow;
    const rawSubject = result.updatedSubject as DbRow | null;
    return { ...result, session: mapSession(result.session as DbRow), updatedSubject: rawSubject ? rawSubject : null };
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${uid}))`);
    const result = await tx.execute(sql`SELECT * FROM study_session_runs WHERE owner_id=${uid} AND id=${id} FOR UPDATE`);
    const run = result.rows[0] as DbRow | undefined;
    if (!run || !['running','paused'].includes(String(run.status))) throw new Error('Sessão indisponível.');
    const elapsedQ = await tx.execute(sql`SELECT ${Number(run.accumulated_seconds)} + CASE WHEN ${String(run.status)}='running' THEN greatest(0,floor(extract(epoch FROM (now()-${run.active_since as string}::timestamptz)))::int) ELSE 0 END AS elapsed`);
    const elapsed = Number((elapsedQ.rows[0] as DbRow).elapsed);
    const duration = run.mode === 'ultra50' ? 3000 : 1500;
    if (elapsed < duration) throw new Error('A sessão ainda não completou o tempo de foco.');
    await tx.execute(sql`UPDATE study_session_runs SET status='completed',active_since=NULL,completed_at=now() WHERE id=${id}`);
    const created = await tx.execute(sql`INSERT INTO pomodoro_sessions(owner_id,subject_id,subject_name,mode,duration_minutes,date_key) VALUES(${uid},${String(run.subject_id)},${String(run.subject_name)},${String(run.mode)},${duration/60},${dateKey}) RETURNING *`);
    let updatedSubject: unknown = null;
    if (/^[0-9a-f-]{36}$/i.test(String(run.subject_id))) {
      const updated = await tx.execute(sql`UPDATE subjects SET hours_studied=hours_studied+(${duration}/3600.0),updated_at=now() WHERE owner_id=${uid} AND id=${String(run.subject_id)}::uuid RETURNING *`);
      if (updated.rows[0]) {
        const r = updated.rows[0] as DbRow;
        updatedSubject = { id: r.id, ownerId: r.owner_id, code: r.code, name: r.name, professor: r.professor, schedule: r.schedule, p1: r.p1, p2: r.p2, hoursStudied: r.hours_studied, status: r.status };
      }
    }
    const earnedQ = await tx.execute(sql`SELECT coalesce(sum(amount),0)::int AS n FROM credit_transactions WHERE owner_id=${uid} AND type='study' AND amount>0 AND created_at>now()-interval '24 hours'`);
    const reward = Math.min(run.mode === 'ultra50' ? 2 : 1, Math.max(0,8-Number((earnedQ.rows[0] as DbRow).n)));
    if (reward) await tx.execute(sql`INSERT INTO credit_transactions(owner_id,amount,type,source_id,description) VALUES(${uid},${reward},'study',${`session:${id}`},${`Sessão de foco (${duration/60} min)`})`);
    const balanceQ = await tx.execute(sql`SELECT coalesce(sum(amount),0)::int AS balance FROM credit_transactions WHERE owner_id=${uid}`);
    return { session: mapSession(created.rows[0] as DbRow), updatedSubject, reward, balance: Number((balanceQ.rows[0] as DbRow).balance) };
  });
}

function mapSession(r: DbRow) {
  return {
    id: String(r.id), ownerId: String(r.owner_id), subjectId: String(r.subject_id),
    subjectName: String(r.subject_name), mode: String(r.mode),
    durationMinutes: Number(r.duration_minutes), dateKey: String(r.date_key),
    createdAtMs: new Date(String(r.created_at)).getTime(),
  };
}

export async function buyShopItem(uid: string, itemId: string) {
  if (isSupabaseConfigured()) return rpc('focus_buy_cosmetic', { p_uid: uid, p_item_id: itemId });
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) throw new Error('Item inválido.');
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${uid}))`);
    const balanceQ = await tx.execute(sql`SELECT coalesce(sum(amount),0)::int AS balance FROM credit_transactions WHERE owner_id=${uid}`);
    const balance = Number((balanceQ.rows[0] as DbRow).balance);
    if (balance < item.price) throw new Error('Créditos insuficientes.');
    await tx.execute(sql`INSERT INTO cosmetic_ownership(owner_id,item_id,category) VALUES(${uid},${item.id},${item.category})`);
    await tx.execute(sql`INSERT INTO credit_transactions(owner_id,amount,type,source_id,description) VALUES(${uid},${-item.price},'purchase',${`purchase:${uid}:${item.id}`},${`Compra: ${item.name}`})`);
    return { balance: balance-item.price, itemId: item.id };
  });
}

export async function equipShopItem(uid: string, itemId: string) {
  if (isSupabaseConfigured()) return rpc('focus_equip_cosmetic', { p_uid: uid, p_item_id: itemId });
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${uid}))`);
    const rows = await tx.execute(sql`SELECT category FROM cosmetic_ownership WHERE owner_id=${uid} AND item_id=${itemId}`);
    const category = (rows.rows[0] as DbRow | undefined)?.category;
    if (!category) throw new Error('Cosmético não adquirido.');
    await tx.execute(sql`UPDATE cosmetic_ownership SET equipped=false WHERE owner_id=${uid} AND category=${String(category)}`);
    await tx.execute(sql`UPDATE cosmetic_ownership SET equipped=true WHERE owner_id=${uid} AND item_id=${itemId}`);
    return { itemId };
  });
}
