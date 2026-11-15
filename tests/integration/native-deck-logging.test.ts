// The Expo deck logs as today's deck logs (MIGRATION.md phase 3, the deck's second session; D289 P-NATIVEWRITES,
// docs/decisions/data-backup.md; D290 P-OWNROWS, docs/decisions/set-logging.md). The proof D289 asks for: after the
// same taps on the same keys, the beta's store holds each ia_ key equal to today's page's, value for value, over
// whole histories; and a backup loaded after a logged set leaves the store the file's, key for key and hash for hash.
//
// support/native-deck-logging.ts opens one day's deck on both apps and makes each tap on both, checking the stores,
// every field and every toast after each one. This file walks whole histories through it: at each of the five
// stretches of the standard history (support/stored-state.ts life), a second phone is launched on the keys as they
// stand, the beta launches on the same keys into its own SQLite store, and every training day of the week in view is
// worked through its deck on both. The reference is today's page, on purpose. The one exception is named there: the
// pop-ups' keys, which the page writes and the beta must leave as they stood.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts), so each launch after a logged day is compared as well.
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import type { DeckProgram } from '../../frontends/native/src/deck/deck-screen.ts';
import { importBackup, misses } from '../../frontends/native/src/store/backup-import.ts';
import { fixtures } from '../support/app.ts';
import { DAYS7 } from '../support/native-deck.ts';
import { POPUP_KEYS, TwoDecks, held, tally, workDay } from '../support/native-deck-logging.ts';
import { launches } from '../support/native-launch.ts';
import { launchNow, nativeGrid } from '../support/native-this-week.ts';
import { PROGRAMS } from '../support/programs.ts';
import { sqliteTestStore } from '../support/sqlite-kv.ts';
import { Phone, at, firstWeek, life, training } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const pad = (n: number): string => String(n).padStart(2, '0');
const iso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/**
 * Both apps on one set of keys: a second phone launched on them at the first one's instant (today's page), and the
 * beta launched on the same keys into its own SQLite store. After the two launches the stores are equal.
 */
function both(P: Phone): { Q: Phone; store: StateStore; grid: DeckProgram } {
  const pre = P.dump();
  const Q = new Phone();
  for (const [k, v] of Object.entries(pre)) Q.damage(k, v);
  Q.launch(iso(launchNow(P)));
  const store = sqliteTestStore();
  for (const [k, v] of Object.entries(pre)) store.set(k, v);
  const grid = nativeGrid(Q, store) as unknown as DeckProgram;
  assert.deepStrictEqual(held(store), Q.dump(), 'after its own launch the beta holds the keys today\'s launch left');
  return { Q, store, grid };
}

test('HALF_MANNY through the standard history: every training day of the week in view worked through its deck on both apps, the stores equal after every tap', () => {
  const T = tally();
  let n = 0, stages = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    const { Q, store, grid } = both(P);
    const week: number = Q.ev('calcCurrentWeek()');
    for (const d of training(Q, week)) workDay(Q, store, grid, week, d, n++, T);
    // The next morning, both launch on what the day's work left (support/native-launch.ts compares the two).
    const next = new Date(launchNow(Q).getTime() + 86400000);
    const before = launches.compared;
    Q.launch(iso(next));
    assert.equal(launches.compared, before + 1, stage + ': the launch after the logged days was compared');
    stages++;
  });
  assert.equal(stages, 5);
  // IA_TALLY=<file> writes what the walk compared, for the record (docs/decisions/swipe-deck.md).
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ walk: T, launches }));
  // Each kind of tap was made, and each kind of write compared. Measured when this was written: 24 days, 1,246 taps
  // (205 steps, 380 typed, 17 pills, 25 Log, 77 Done next one, 80 changes after Log, 505 drafts, 32 skips, 28 put
  // backs, 24 days marked), 108 loaded moves, 99 toasts, and the page's pop-up 24 times. The floors sit under those,
  // so a walk that stopped making one kind is red and a history that grows is not.
  assert.ok(T.days >= 20 && T.taps >= 1000 && T.checks >= T.taps, 'days and taps: ' + JSON.stringify(T));
  assert.ok(T.steps >= 150 && T.typed >= 300 && T.pills >= 10, 'steppers, typed fields and pills: ' + JSON.stringify(T));
  assert.ok(T.drafts >= 400 && T.logs >= 20 && T.dones >= 60 && T.commits >= 60, 'drafts, Log, Done next one, changes after Log: ' + JSON.stringify(T));
  assert.ok(T.skips >= 25 && T.undos >= 20 && T.marks >= 20 && T.loaded >= 80 && T.toasts >= 80, 'skips, put backs, days marked, loaded moves, toasts: ' + JSON.stringify(T));
  assert.ok(T.popups >= 20, 'the page\'s pop-up wrote its keys, and the beta left them as they stood: ' + JSON.stringify(T));
});

test('a backup loaded after logged sets leaves the beta\'s store the file\'s, key for key and hash for hash', () => {
  let done = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    if (stage !== '3 third week') return;
    const text = JSON.stringify(P.ev('backupSnapshot()'));
    const data = (JSON.parse(text) as { data: Record<string, string> }).data;
    const { Q, store, grid } = both(P);
    const week: number = Q.ev('calcCurrentWeek()');
    const T = tally();
    training(Q, week).slice(0, 2).forEach((d, i) => workDay(Q, store, grid, week, d, i, T));
    assert.ok(T.logs + T.dones >= 2 && T.marks >= 1, 'sets were logged and a day marked in the beta: ' + JSON.stringify(T));
    assert.ok(misses(store, data).length >= 3, 'the beta\'s store is no longer the file\'s: ' + misses(store, data).join(', '));
    const r = importBackup(store, text);
    assert.equal(r.ok, true, 'the backup loads');
    assert.deepStrictEqual(misses(store, data), [], 'no key differs from the file by value or by sha256');
    assert.deepStrictEqual(held(store), Object.fromEntries(Object.keys(data).sort().map((k) => [k, data[k]])), 'the store holds the file\'s keys and no other');
    done++;
  });
  assert.equal(done, 1);
});

test('a kilogram program: a load typed in kilograms is stored in pounds, as today\'s stores it', () => {
  const P = new Phone().launch(CREATED);
  P.generate({ ...fixtures.HALF_MANNY, unit: 'kg' } as Cfg);
  const { first, start } = firstWeek(P, CREATED);
  const days = training(P.launch(at(start, 7 * (first - 1), '06:30')), first);
  P.launch(at(start, 7 * (first - 1) + DAYS7.indexOf(days[0]!)));
  const { Q, store, grid } = both(P);
  assert.equal(grid.cfg!.unit, 'kg');
  // By hand first: 100 kg is 220.462 lb, stored 220; the toast says what was typed.
  const T = tally();
  const D = new TwoDecks(Q, store, grid, first, days[0]!, T, 'kilograms');
  assert.ok(D.open());
  const x = D.cards().flatMap((c) => D.moves(c)).find((m) => m.log && m.log.load && m.log.sets)!;
  assert.ok(x, 'a loaded lift on the day');
  D.typeLoad(x.exKey, '100');
  D.leave(x.exKey);
  D.log(x);
  const entry = (JSON.parse(store.get('ia_exw_' + grid.id)!) as Record<string, { entries: { weight: number; setsW: number[] }[] }>)[x.exKey]!.entries[0]!;
  assert.equal(entry.weight, 220);
  assert.deepStrictEqual([...new Set(entry.setsW)], [220]);
  assert.equal(Q.toasts[Q.toasts.length - 1], '100 kg logged ✓');
  // Then the whole week through both decks.
  days.slice(1).forEach((d, i) => workDay(Q, store, grid, first, d, i + 1, T));
  assert.ok(T.loaded >= 5 && T.pills >= 1, JSON.stringify(T));
});

// D290: on today's page (v0.262.3) and in the beta, Log stores a move's own sets. The bodyweight run base program
// puts Split squat (3 sets) on a day with Split-squat heel-raise hold (2×30 sec each), whose key starts with its key.
test('two moves on one day whose keys start alike: each one\'s Log stores its own sets, on both apps (D290)', () => {
  const cfg = PROGRAMS['run base, bodyweight, balanced']!;
  const P = new Phone().launch(CREATED);
  P.generate(cfg);
  let found: { w: number; d: string } | null = null;
  const prog = P.prog as { weeks: Record<string, Record<string, { rest?: unknown; sections?: { items?: { name?: string }[] }[] } | null>> };
  for (const w of Object.keys(prog.weeks)) for (const d of DAYS7) {
    const names = ((prog.weeks[w]![d] || {}).sections || []).flatMap((s) => (s.items || []).map((i) => i.name));
    if (!found && names.includes('Split squat') && names.includes('Split-squat heel-raise hold')) found = { w: +w, d };
  }
  assert.ok(found, 'the program holds the pair on a day');
  const { first, start } = firstWeek(P, CREATED);
  P.launch(at(start, 7 * (found!.w - 1) + DAYS7.indexOf(found!.d)));
  assert.ok(found!.w >= first);
  const { Q, store, grid } = both(P);
  const T = tally();
  const D = new TwoDecks(Q, store, grid, found!.w, found!.d, T, 'the pair');
  assert.ok(D.open());
  const moves = D.cards().flatMap((c) => D.moves(c));
  const a = moves.find((m) => m.exKey === 'split_squat')!, b = moves.find((m) => m.exKey === 'split_squat_heel_raise_hold')!;
  assert.ok(a && b && a.log && b.log);
  [8, 8, 7].forEach((r, s) => D.typeRep(a.exKey, s, String(r)));
  [31, 32].forEach((r, s) => D.typeRep(b.exKey, s, String(r)));
  D.leave(a.exKey);
  D.leave(b.exKey);
  D.log(a);
  D.log(b);
  D.step(a.exKey, 0, 1);
  const log = JSON.parse(store.get('ia_exw_' + grid.id)!) as Record<string, { entries: { setsDone: number[] }[] }>;
  assert.deepStrictEqual(log['split_squat']!.entries[0]!.setsDone, [9, 8, 7]);
  assert.deepStrictEqual(log['split_squat_heel_raise_hold']!.entries[0]!.setsDone, [31, 32]);
  D.close();
});

test('nothing the beta stores is a pop-up\'s key unless the keys it was handed held it', () => {
  // A phone with nothing marked yet: the page's first pop-up writes its keys, and the beta's store holds none.
  const P = new Phone().launch(CREATED);
  P.generate(fixtures.HALF_MANNY);
  const { first, start } = firstWeek(P, CREATED);
  const days = training(P.launch(at(start, 7 * (first - 1), '06:30')), first);
  P.launch(at(start, 7 * (first - 1) + DAYS7.indexOf(days[0]!)));
  const { Q, store, grid } = both(P);
  assert.deepStrictEqual(Object.keys(Q.dump()).filter((k) => POPUP_KEYS.test(k)), []);
  const T = tally();
  assert.ok(workDay(Q, store, grid, first, days[0]!, 0, T));
  assert.equal(T.marks, 1);
  assert.ok(Object.keys(Q.dump()).filter((k) => POPUP_KEYS.test(k)).length >= 1, 'today\'s pop-up stored its pick');
  assert.deepStrictEqual(Object.keys(held(store)).filter((k) => POPUP_KEYS.test(k)), []);
  // Every other key the beta holds is the page's, and the page holds no other.
  const page = Q.dump();
  assert.deepStrictEqual(held(store), Object.fromEntries(Object.keys(page).filter((k) => !POPUP_KEYS.test(k)).map((k) => [k, page[k]])));
});
