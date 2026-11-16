// The Expo deck's swap sheet against today's (tests/integration/native-deck-swap.test.ts and the sweep of that name;
// MIGRATION.md phase 3, the deck's third session). It stands on support/native-deck-logging.ts, whose two decks make
// each tap on today's page and on the beta and hold the stores, the fields, the cards and the toasts equal after it.
//
//   everySheet   every move that offers a swap, on every day of the live grid: the beta's sheet (deck-swaps.ts
//                swapSheetOf) is today's (the Angular sheet's open() over the page), whole. Reads only.
//   swapDay      one day worked through its deck on both apps with swaps among the logging: a sheet opened on every
//                move that offers one, a pick from it (the first row, a later row, a row of the other job), a draft
//                or a Log before the pick, a second pick on the same place, work on the lift swapped in, put it back
//                one pick at a time or all the way, a lift left swapped, the same pair picked three times running
//                (the nudge comes due on both, and is answered on both), then Call it.
//
// The expected value of every comparison is today's page, on purpose: the page stays the reference until the
// cutover. The hand-typed values are in tests/unit/native-deck-swap.test.ts.
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type DeckProgram, dayCards, movesOf } from '../../frontends/native/src/deck/deck-screen.ts';
import { type SwapOpen, swapSheetOf } from '../../frontends/native/src/deck/deck-swaps.ts';
import { DAYS7 } from './native-deck.ts';
import { type Tally, TwoDecks, held, pageSheet } from './native-deck-logging.ts';
import type { PopSession } from '../../frontends/native/src/pop-up/pop-ups.ts';
import { pops, sameReminder, seedBoth } from './native-pop-ups.ts';
import { launchNow, nativeGrid } from './native-this-week.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import { Phone } from './stored-state.ts';

const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const pad = (n: number): string => String(n).padStart(2, '0');
export const iso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

let launched = 0;
/**
 * Both apps on one set of keys: a second phone launched on them at the first one's instant (today's page), and the
 * beta launched on the same keys into its own SQLite store. After the two launches the stores are equal. Then the
 * launch's reminder, which today's raises 600 ms in: the same pop-up on both, or none, left unanswered, and the
 * stores equal after it (support/native-pop-ups.ts answers one, over whole programs).
 */
export function both(P: Phone): { Q: Phone; store: StateStore; grid: DeckProgram } {
  const pre = P.dump();
  const Q = new Phone();
  for (const [k, v] of Object.entries(pre)) Q.damage(k, v);
  Q.launch(iso(launchNow(P)));
  const store = sqliteTestStore();
  for (const [k, v] of Object.entries(pre)) store.set(k, v);
  const grid = nativeGrid(Q, store) as unknown as DeckProgram;
  assert.deepStrictEqual(held(store), Q.dump(), 'after its own launch the beta holds the keys today\'s launch left');
  pops(Q);
  sameReminder(Q, { store, prog: grid } as unknown as PopSession, seedBoth(Q, (++launched * 69069 + 1) % 4294967296), null, 'the launch both apps made');
  return { Q, store, grid };
}

/** Every swap sheet of every day of the live grid, the beta's against today's. Returns how many it compared. */
export function everySheet(P: Phone, store: StateStore, grid: DeckProgram, T: Tally, what: string): number {
  const now = launchNow(P).getTime();
  const before = held(store);
  let seen = 0;
  for (const w of Object.keys(grid.weeks).map(Number).sort((a, b) => a - b)) for (const d of DAYS7) {
    const day = (grid.weeks[w] || {})[d];
    if (!day || day.rest || !Array.isArray(day.sections) || !day.sections.length) continue;
    for (const x of movesOf(dayCards(store, grid, w, d, now))) {
      if (!x.swap) continue;
      const page = pageSheet(P, w, d, x.swap.secIdx, x.swap.itemIdx);
      const beta = swapSheetOf(grid, w, d, x.swap.secIdx, x.swap.itemIdx);
      assert.deepStrictEqual(beta ? plain(beta.view) : null, page, what + ', week ' + w + ', ' + d + ': the swap sheet of ' + x.name);
      assert.ok(beta, what + ', week ' + w + ', ' + d + ': a move that offers a swap has a sheet');
      seen++;
      T.sheets++;
      const rows = beta.view.sameJob.length + beta.view.otherJob.length;
      T.rows += rows;
      if (!rows) T.empty++;
    }
  }
  assert.deepStrictEqual(held(store), before, what + ': reading the sheets stored something');
  return seen;
}

const rowsOf = (sh: SwapOpen): string[] => [...sh.view.sameJob, ...sh.view.otherJob].map((r) => r.name);

/**
 * One day worked through its deck on both apps, with swaps among the logging. The taps are chosen from what the day
 * holds and from `n`, so each kind falls on some card across a week. False where no deck opens.
 */
export function swapDay(P: Phone, store: StateStore, grid: DeckProgram, week: number, dayKey: string, n: number, T: Tally, mark = true): boolean {
  const D = new TwoDecks(P, store, grid, week, dayKey, T, 'week ' + week + ', ' + dayKey);
  if (!D.open()) return false;
  const keys = D.view.cards.map((c) => c.key);
  /** The move standing at one place of the day, as the deck draws it now. */
  const at = (key: string, secIdx: number, itemIdx: number) => {
    const c = D.card(key);
    return c ? D.moves(c).find((x) => x.swap && x.swap.secIdx === secIdx && x.swap.itemIdx === itemIdx) : undefined;
  };
  let trio: { key: string; secIdx: number; itemIdx: number } | null = null;
  keys.forEach((key, ci) => {
    const c = D.card(key);
    if (!c || c.kind === 'finish' || c.skipped) return;
    // The sheet of every move of the card that offers one.
    const spots = D.moves(c).filter((x) => x.swap).map((x) => ({ secIdx: x.swap!.secIdx, itemIdx: x.swap!.itemIdx, exKey: x.exKey }));
    const sheets = spots.map((sp) => D.sheet(sp.secIdx, sp.itemIdx));
    const k = sheets.findIndex((sh, j) => !!sh && rowsOf(sh).length > 0 && (j + n) % Math.max(1, spots.length) === 0);
    const pickAt = k >= 0 ? k : sheets.findIndex((sh) => !!sh && rowsOf(sh).length > 0);
    const v = (ci + n) % 4;
    if (pickAt < 0 || v === 3) {
      if ((ci + n) % 2 === 0) D.done(key);
      return;
    }
    const sp = spots[pickAt]!, sh = sheets[pickAt]!;
    if (!trio) trio = { key, secIdx: sp.secIdx, itemIdx: sp.itemIdx };
    const out = at(key, sp.secIdx, sp.itemIdx)!;
    // A draft on the lift going out, and on some cards its Log, before the pick.
    if (out.log && D.fields[out.exKey]!.reps.length && (ci + n) % 2 === 0) D.step(out.exKey, 0, 1);
    if (v === 1 && out.log) D.log(out);
    const rows = rowsOf(sh);
    D.swap(sh, rows[(n + ci) % rows.length]!);
    // A second pick on the same place: the chain.
    if (v === 2) {
      const again = D.sheet(sp.secIdx, sp.itemIdx);
      if (again && rowsOf(again).length) D.swap(again, rowsOf(again)[rowsOf(again).length - 1]!);
    }
    // Work on the lift swapped in.
    const inn = at(key, sp.secIdx, sp.itemIdx);
    if (inn && inn.log) {
      const f = D.fields[inn.exKey]!;
      if (f.reps.length) D.step(inn.exKey, 0, 1);
      if (f.load) { D.typeLoad(inn.exKey, String(90 + 5 * n)); D.leave(inn.exKey); }
      if (v !== 1 && n % 2) D.log(inn);
    }
    // Put it back: all the way, one pick, or not at all.
    const from = (): string | null => { const m = at(key, sp.secIdx, sp.itemIdx); return (m && m.swappedFrom) || null; };
    if (v === 0 || (v === 1 && n % 2 === 0)) {
      for (let guard = 0, f = from(); f && guard < 4; guard++, f = from()) D.unswap(f);
    } else if (v === 2 && n % 2) {
      const f = from();
      if (f) D.unswap(f);
    }
    if ((ci + n) % 3 === 0) D.done(key);
  });
  // The same pair three times running on one lift: on the third pick the nudge comes due on both apps.
  const t = trio as { key: string; secIdx: number; itemIdx: number } | null;
  if (t && n % 3 === 0) {
    const m0 = at(t.key, t.secIdx, t.itemIdx);
    if (m0 && m0.swappedFrom) D.unswap(m0.swappedFrom);
    const first = D.sheet(t.secIdx, t.itemIdx);
    const to = first && rowsOf(first)[0];
    if (first && to) {
      for (let i = 0; i < 3; i++) {
        const sh = i ? D.sheet(t.secIdx, t.itemIdx) : first;
        if (!sh || !rowsOf(sh).includes(to)) break;
        D.swap(sh, to);
        const m = at(t.key, t.secIdx, t.itemIdx);
        if (i < 2 && m && m.swappedFrom) D.unswap(m.swappedFrom);
      }
    }
  }
  if (mark) { if (n % 2 === 0) D.mark(8 - (n % 3), 'Swap day ' + n); else D.mark(null, ''); }
  D.close();
  return true;
}
