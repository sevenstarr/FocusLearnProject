'use client';

import { useEffect, useState } from 'react';
import { Check, Coins, LockKeyhole, Palette, ShoppingBag, Sparkles } from 'lucide-react';
import { useFocus } from '@/components/FocusProvider';
import { SHOP_ITEMS } from '@/lib/shopCatalog';

export function ShopView() {
  const { cloudSynced, shop, buyShopItem, equipShopItem, refreshShop } = useFocus();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const owned = new Map(shop.owned.map((item) => [item.itemId, item] as const));
  const items = shop.items.length ? shop.items : SHOP_ITEMS;
  useEffect(() => { if (cloudSynced) void refreshShop().catch(() => {}); }, [cloudSynced, refreshShop]);
  const act = async (id: string, action: () => Promise<void>) => {
    setBusy(id); setError('');
    try { await action(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.'); }
    finally { setBusy(''); }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Personalize seu espaço</p>
          <h1 className="mt-1 text-2xl font-bold">Loja de cosméticos</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ganhe créditos concluindo sessões de foco e troque por temas e avatares.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <Coins className="h-5 w-5" /><span className="text-xl font-bold tabular-nums">{cloudSynced ? shop.balance : '—'}</span><span className="text-sm">créditos</span>
        </div>
      </header>

      {!cloudSynced && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"><LockKeyhole className="mr-2 inline h-4 w-4" />Entre em uma conta online para ganhar créditos, comprar e equipar itens. O modo local não usa saldo da loja.</div>}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><ShoppingBag className="h-5 w-5 text-blue-600" />Catálogo</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const ownedItem = owned.get(item.id);
            return <article key={item.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-24 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
                {item.category === 'theme' ? <span className="h-12 w-12 rounded-full ring-8 ring-white shadow-lg dark:ring-slate-700" style={{ backgroundColor: item.swatch }} /> : <span className="text-5xl" aria-hidden>{item.emoji}</span>}
              </div>
              <h3 className="font-bold">{item.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300"><Coins className="h-4 w-4" />{item.price}</span>
                {ownedItem ? <button type="button" disabled={!cloudSynced || busy === item.id || ownedItem.equipped} onClick={() => void act(item.id, () => equipShopItem(item.id))} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200">{ownedItem.equipped ? <><Check className="mr-1 inline h-4 w-4" />Equipado</> : 'Equipar'}</button> : <button type="button" disabled={!cloudSynced || busy === item.id || shop.balance < item.price} onClick={() => void act(item.id, () => buyShopItem(item.id))} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45">{busy === item.id ? 'Aguarde…' : 'Comprar'}</button>}
              </div>
            </article>;
          })}
          {cloudSynced && shop.items.length === 0 && <button type="button" onClick={() => void refreshShop()} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">Carregar catálogo</button>}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><Palette className="h-5 w-5 text-violet-500" />Seus cosméticos</h2>
          {shop.owned.length ? <ul className="space-y-2">{shop.owned.map((entry) => { const item = items.find((i) => i.id === entry.itemId); return <li key={entry.itemId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span>{item?.emoji || '🎨'} {item?.name || entry.itemId}</span><span className="text-xs text-slate-500">{entry.equipped ? 'Equipado' : 'No inventário'}</span></li>; })}</ul> : <p className="text-sm text-slate-500">Os itens comprados aparecerão aqui.</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><Sparkles className="h-5 w-5 text-amber-500" />Histórico de créditos</h2>
          {shop.transactions.length ? <ul className="max-h-64 space-y-2 overflow-auto">{shop.transactions.map((tx) => <li key={tx.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span className="truncate">{tx.description}</span><strong className={tx.amount > 0 ? 'text-emerald-600' : 'text-slate-500'}>{tx.amount > 0 ? '+' : ''}{tx.amount}</strong></li>)}</ul> : <p className="text-sm text-slate-500">Conclua uma sessão de foco para ganhar seu primeiro crédito.</p>}
          <p className="mt-3 text-xs text-slate-400">1 crédito por 25 min; 2 por 50 min. Limite de 8 créditos em 24 horas.</p>
        </div>
      </section>
    </div>
  );
}
