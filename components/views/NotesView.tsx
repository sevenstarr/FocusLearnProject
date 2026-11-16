'use client';

import React, { useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import { FileText, Plus, Trash2, Edit3, Eye, Save, X } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';

export function NotesView() {
  const { notes, subjects, searchQuery, addNote, updateNote, deleteNote } = useFocus();

  const [selectedId, setSelectedId] = useState<string>(notes[0]?.id || '');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || '');
  const [newTags, setNewTags] = useState('');
  const [newContent, setNewContent] = useState('');

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.subjectName.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  const activeNote =
    filteredNotes.find((n) => n.id === selectedId) || filteredNotes[0] || null;

  const startEditing = () => {
    if (!activeNote) return;
    setEditTitle(activeNote.title);
    setEditContent(activeNote.content);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!activeNote) return;
    await updateNote(activeNote.id, {
      title: editTitle,
      content: editContent,
    });
    setEditing(false);
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const sub = subjects.find((s) => s.id === newSubjectId);
    const createdId = await addNote({
      title: newTitle,
      subjectId: sub?.id || '',
      subjectName: sub?.name || 'Estudo Geral',
      tags: newTags.split(','),
      content: newContent,
    });
    setSelectedId(createdId);
    setNewTitle('');
    setNewTags('');
    setNewContent('');
    setModalOpen(false);
    setEditing(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Caderno Digital · Suporte a Markdown
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mt-0.5">
            Anotações & Cadernos
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Escreva resumos, teoremas e checklists por disciplina com renderização em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewSubjectId(subjects[0]?.id || '');
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Nota</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <aside className="lg:col-span-5 flex flex-col gap-2.5">
          {filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
              <FileText className="w-7 h-7 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Nenhuma nota encontrada
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Crie uma nova anotação para iniciar seu caderno.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(note.id);
                    setEditing(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/60 dark:border-blue-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-blue-600 dark:text-blue-400 truncate">
                      {note.subjectName}
                    </span>
                    <span className="font-mono tabular-nums shrink-0">
                      {new Date(note.updatedAtMs).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {note.title}
                  </h2>
                  {note.tags.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                      {note.tags.map((t) => `#${t}`).join(' · ')}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </aside>

        {/* Right Reader / Editor */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          {!activeNote ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Selecione uma anotação ao lado ou crie uma nova nota.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {activeNote.subjectName}
                  </span>
                  {activeNote.tags.length > 0 && (
                    <>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>{activeNote.tags.map((t) => `#${t}`).join(' · ')}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visualizar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveEdit()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void deleteNote(activeNote.id)}
                    aria-label="Excluir nota"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editing ? (
                <div className="flex flex-col gap-3">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={160}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-base font-bold border border-slate-200 dark:border-slate-700"
                  />
                  <textarea
                    rows={12}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    maxLength={20000}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm font-mono border border-slate-200 dark:border-slate-700"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {activeNote.title}
                  </h2>
                  <div className="prose prose-sm prose-slate dark:prose-invert max-w-none leading-relaxed">
                    <Markdown>{activeNote.content}</Markdown>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Create Note Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nova Anotação"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Criar Nova Anotação
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => void handleCreateNote(e)} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Título
                </label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex.: Integrais de Superfície"
                  maxLength={160}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Disciplina
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} · {s.name}
                      </option>
                    ))}
                    {subjects.length === 0 && <option value="">Estudo Geral</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tags (vírgula)
                  </label>
                  <input
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="resumo, p2"
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Conteúdo (Markdown)
                </label>
                <textarea
                  required
                  rows={7}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="## Tópico Principal&#10;- Definição e exemplos..."
                  maxLength={20000}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm font-mono border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Salvar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
