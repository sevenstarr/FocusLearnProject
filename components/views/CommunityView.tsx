'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Trash2, Cloud, Users, Plus, LogIn, LogOut } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { useAuth } from '@/components/AuthProvider';
import { CommunityChannel } from '@/lib/types';
import { UserAvatar } from '@/components/UserAvatar';

type FocusRoom = { id: string; title: string; goal: string; ownerId: string; participants: number; joined: boolean };

const CHANNELS: { id: CommunityChannel; name: string; topic: string }[] = [
  { id: 'calculo', name: 'Cálculo Diferencial', topic: 'Dúvidas de listas, integrais e teoremas' },
  { id: 'algoritmos', name: 'Algoritmos & ED', topic: 'Árvores, grafos e complexidade' },
  { id: 'geral', name: 'Sala Geral de Foco', topic: 'Metas do dia e sessões conjuntas' },
];

export function CommunityView() {
  const {
    communityMessages,
    activeChannel,
    setActiveChannel,
    sendCommunityMessage,
    deleteCommunityMessage,
    cloudSynced,
    showToast,
  } = useFocus();
  const { user, signInWithGoogle, getAccessToken } = useAuth();

  const [text, setText] = useState('');
  const [rooms, setRooms] = useState<FocusRoom[]>([]);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomGoal, setRoomGoal] = useState('');
  const [roomBusy, setRoomBusy] = useState(false);

  const loadRooms = useCallback(async () => {
    if (!cloudSynced) return;
    const token = await getAccessToken();
    if (!token) return;
    const response = await fetch('/api/rooms', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    setRooms(payload.rooms || []);
    for (const room of (payload.rooms || []) as FocusRoom[]) {
      if (room.joined) {
        void fetch(`/api/rooms/${encodeURIComponent(room.id)}`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  }, [cloudSynced, getAccessToken]);

  useEffect(() => {
    if (!cloudSynced) {
      const clearTimeoutId = window.setTimeout(() => setRooms([]), 0);
      return () => window.clearTimeout(clearTimeoutId);
    }
    const initialLoad = window.setTimeout(() => { void loadRooms(); }, 0);
    const interval = window.setInterval(() => { void loadRooms(); }, 15_000);
    return () => { window.clearTimeout(initialLoad); window.clearInterval(interval); };
  }, [cloudSynced, loadRooms]);

  const roomRequest = async (url: string, method: string, body?: Record<string, string>) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Não foi possível atualizar a sala.');
    return payload;
  };

  const createRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setRoomBusy(true);
    try {
      await roomRequest('/api/rooms', 'POST', { title: roomTitle, goal: roomGoal });
      setRoomTitle(''); setRoomGoal('');
      await loadRooms();
      showToast('Sala criada', 'Seu espaço de foco está aberto.', 'success');
    } catch (error) { showToast('Não foi possível criar a sala', error instanceof Error ? error.message : 'Tente novamente.', 'error'); }
    finally { setRoomBusy(false); }
  };

  const changeRoomPresence = async (room: FocusRoom) => {
    setRoomBusy(true);
    try {
      await roomRequest(`/api/rooms/${encodeURIComponent(room.id)}`, room.joined ? 'DELETE' : 'POST');
      await loadRooms();
    } catch (error) { showToast('Sala indisponível', error instanceof Error ? error.message : 'Tente novamente.', 'error'); }
    finally { setRoomBusy(false); }
  };

  const channelMessages = useMemo(
    () => communityMessages.filter((m) => m.channel === activeChannel),
    [communityMessages, activeChannel]
  );

  const activeChannelMeta = CHANNELS.find((c) => c.id === activeChannel) || CHANNELS[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendCommunityMessage(text);
    setText('');
  };

  const handleGoogleSync = async () => {
    const res = await signInWithGoogle();
    showToast(res.ok ? 'Conectado!' : 'Aviso', res.message, res.ok ? 'success' : 'error');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {activeChannelMeta.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeChannelMeta.topic} ·{' '}
              {cloudSynced ? 'Sincronizado entre estudantes' : 'Modo local neste dispositivo'}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setActiveChannel(ch.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeChannel === ch.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              #{ch.id}
            </button>
          ))}
        </div>
      </div>

      {!cloudSynced && (
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Entre com sua conta Google para conversar e sincronizar mensagens com outros estudantes.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleGoogleSync()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Conectar com Google
          </button>
        </div>
      )}

      {cloudSynced && <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={(event) => void createRoom(event)} className="flex flex-col gap-3">
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /><h2 className="font-bold">Salas de foco ao vivo</h2></div>
          <p className="text-xs text-slate-500">Crie uma meta compartilhada e acompanhe quem está estudando. A presença é atualizada a cada 15 segundos.</p>
          <input value={roomTitle} onChange={(event) => setRoomTitle(event.target.value)} maxLength={100} required placeholder="Nome da sala" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <input value={roomGoal} onChange={(event) => setRoomGoal(event.target.value)} maxLength={240} placeholder="Meta (opcional), ex.: revisar capítulo 4" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
          <button disabled={roomBusy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Plus className="h-4 w-4" />Criar sala</button>
        </form>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Salas ativas</h3>
          {rooms.length ? rooms.map((room) => <article key={room.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{room.title}</p><p className="mt-0.5 text-xs text-slate-500">{room.goal || 'Foco livre'} · {room.participants} estudando</p></div>
            <button type="button" disabled={roomBusy} onClick={() => void changeRoomPresence(room)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${room.joined ? 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{room.joined ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}{room.joined ? 'Sair' : 'Entrar'}</button>
          </article>) : <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500 dark:bg-slate-800/60">Ainda não há salas ativas. Crie a primeira.</p>}
        </div>
      </section>}

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
          {channelMessages.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-10 text-center">
              Nenhuma mensagem neste canal ainda. Envie a primeira dúvida ou saudação!
            </p>
          ) : (
            channelMessages.map((msg) => {
              const isOwn =
                (user && msg.authorId === user.uid) || (!user && msg.authorId === 'local-preview');
              const timeStr = new Date(msg.createdAtMs).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={msg.id}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <UserAvatar name={msg.authorName} sizeClass="w-8 h-8 text-[11px]" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {msg.authorName}
                        </span>
                        <span className="text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{msg.authorCourse}</span>
                        <span className="text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                          {timeStr}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed break-words">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                  {isOwn && (
                    <button
                      type="button"
                      onClick={() => void deleteCommunityMessage(msg.id)}
                      aria-label="Apagar mensagem"
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={(e) => void handleSend(e)}
          className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder={`Escreva uma mensagem em #${activeChannel}...`}
            className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </form>
      </section>
    </div>
  );
}
