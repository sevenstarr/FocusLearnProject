'use client';

import React, { useMemo, useState } from 'react';
import { MessageSquare, Send, Trash2, Cloud } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { useAuth } from '@/components/AuthProvider';
import { CommunityChannel } from '@/lib/types';
import { UserAvatar } from '@/components/UserAvatar';

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
  const { user, signInWithGoogle } = useAuth();

  const [text, setText] = useState('');

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
              {cloudSynced ? 'Sincronizado em tempo real' : 'Modo local neste dispositivo'}
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
