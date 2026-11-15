// The Expo deck's swap sheet is today's, and a swap stores what today's stores (MIGRATION.md phase 3, the deck's third
// session; D289 P-NATIVEWRITES, docs/decisions/data-backup.md). Three proofs over HALF_MANNY's standard history
// (the ten seeded programs are tests/sweeps/native-deck-swap.test.ts):
//
// 1. The sheet's list equals today's for every card: at each of the five stretches, every move that offers a swap on
//    every day of the live grid, the beta's sheet against the Angular sheet's over the page, whole.
// 2. After the same taps, the beta's store holds each ia_ key equal to today's page's, value for value: every
//    training day of the week in view worked through its deck on both apps with swaps among the logging
//    (support/native-deck-swap.ts swapDay), checked after every tap; and the next morning's launch on what was left.
// 3. A backup loaded after a swap leaves the store the file's, key for key and hash for hash.
//
// The reference is today's page, on purpose. The one exception is the logging file's: the pop-ups' five key
// families, which the page writes and the beta must leave as they stood.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts), so a launch after a swap replays the swap on both.
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { importBackup, misses } from '../../frontends/native/src/store/backup-import.ts';
import { fixtures } from '../support/app.ts';
import { TwoDecks, held, tally } from '../support/native-deck-logging.ts';
import { both, everySheet, iso, swapDay } from '../support/native-deck-swap.ts';
import { launches } from '../support/native-launch.ts';
import { launchNow } from '../support/native-this-week.ts';
import { at, firstWeek, life, training, Phone } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

test('HALF_MANNY through the standard history: every swap sheet of the live grid is today\'s, at each stretch', () => {
  const T = tally();
  let stages = 0;
  const per: number[] = [];
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    const { Q, store, grid } = both(P);
    per.push(everySheet(Q, store, grid, T, stage));
    stages++;
  });
  assert.equal(stages, 5);
  // Measured when this was written (tests/measure/native-deck-swap_writes.md counts 1,408 for this program over the
  // five stretches). The floors sit under what was measured, so a walk that stops reading is red and a history that
  // grows is not.
  assert.ok(per.every((n) => n >= 200), 'sheets at each stretch: ' + per.join(', '));
  assert.ok(T.sheets >= 1300 && T.rows >= 10000, 'sheets and rows: ' + JSON.stringify(T));
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'] + '.sheets', JSON.stringify({ per, sheets: T.sheets, rows: T.rows, empty: T.empty }));
});

test('HALF_MANNY through the standard history: every training day of the week in view worked through its deck with swaps on both apps, the stores equal after every tap', () => {
  const T = tally();
  let n = 0, stages = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    const { Q, store, grid } = both(P);
    const week: number = Q.ev('calcCurrentWeek()');
    for (const d of training(Q, week)) swapDay(Q, store, grid, week, d, n++, T);
    // The next morning, both launch on what the day's swaps left: the records are replayed by each launch.
    const before = launches.compared;
    Q.launch(iso(new Date(launchNow(Q).getTime() + 86400000)));
    assert.equal(launches.compared, before + 1, stage + ': the launch after the swapped days was compared');
    stages++;
  });
  assert.equal(stages, 5);
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ walk: T, launches }));
  // Each kind of tap was made and compared. The floors sit under what was measured when this was written.
  assert.ok(T.days >= 20 && T.checks >= T.taps, 'days and checks: ' + JSON.stringify(T));
  assert.ok(T.sheets >= 100 && T.picks >= 60 && T.unswaps >= 40, 'sheets, picks and put backs: ' + JSON.stringify(T));
  assert.ok(T.nudges >= 5, 'the nudge came due on both apps: ' + JSON.stringify(T));
  assert.ok((T.swapToasts['same'] || 0) >= 20, 'a pick that keeps its numbers: ' + JSON.stringify(T.swapToasts));
  assert.ok(T.logs >= 10 && T.drafts >= 30 && T.marks >= 20, 'logging among the swaps: ' + JSON.stringify(T));
});

test('a backup loaded after a swap leaves the beta\'s store the file\'s, key for key and hash for hash', () => {
  let done = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    if (stage !== '3 third week') return;
    const text = JSON.stringify(P.ev('backupSnapshot()'));
    const data = (JSON.parse(text) as { data: Record<string, string> }).data;
    const { Q, store, grid } = both(P);
    const week: number = Q.ev('calcCurrentWeek()');
    const T = tally();
    training(Q, week).slice(0, 2).forEach((d, i) => swapDay(Q, store, grid, week, d, i, T, false));
    assert.ok(T.picks >= 2, 'lifts were swapped in the beta: ' + JSON.stringify(T));
    const differ = misses(store, data);
    assert.ok(differ.some((k) => /^ia_swaps_/.test(k)) && differ.some((k) => /^ia_swapct_/.test(k)), 'the beta\'s swaps and counts are no longer the file\'s: ' + differ.join(', '));
    const r = importBackup(store, text);
    assert.equal(r.ok, true, 'the backup loads');
    assert.deepStrictEqual(misses(store, data), [], 'no key differs from the file by value or by sha256');
    assert.deepStrictEqual(held(store), Object.fromEntries(Object.keys(data).sort().map((k) => [k, data[k]])), 'the store holds the file\'s keys and no other');
    done++;
  });
  assert.equal(done, 1);
});

// Typed by hand from the measure (tests/measure/native-deck-swap_writes.md, section B): HALF_MANNY's first Monday
// opens on Barbell Romanian deadlift, 3×12, and the first row of its sheet is Deadlift.
test('HALF_MANNY\'s first Monday: Barbell Romanian deadlift swapped for Deadlift and put back, the keys by hand', () => {
  const P = new Phone().launch(CREATED);
  P.generate(fixtures.HALF_MANNY);
  const { first, start } = firstWeek(P, CREATED);
  const days = training(P.launch(at(start, 7 * (first - 1), '06:30')), first);
  assert.equal(days[0], 'mon');
  P.launch(at(start, 7 * (first - 1) + DAYS.indexOf('mon')));
  const { Q, store, grid } = both(P);
  const T = tally();
  const D = new TwoDecks(Q, store, grid, first, 'mon', T, 'the first Monday');
  assert.ok(D.open());
  const card = D.cards()[0]!;
  assert.equal(card.title, 'Barbell Romanian deadlift');
  assert.deepStrictEqual(card.swap, { secIdx: 0, itemIdx: 0 });
  const RX = '3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest';
  // A draft first, so the day is touched and holds a snapshot.
  D.step('barbell_romanian_deadlift', 0, 1);
  const sheet = D.sheet(0, 0)!;
  // A hinge is leg work in the engine's regions (hinge and heavy lower pair with speed days), so the day's tag is Leg day.
  assert.deepStrictEqual([sheet.view.outName, sheet.view.kindTag, sheet.view.regionTag, sheet.view.slotTag, sheet.view.keeps], ['Barbell Romanian deadlift', 'Hinge', 'Leg day', 'Main lift', '3×12 at RPE 6.5']);
  assert.equal(sheet.view.sameJob[0]!.name, 'Deadlift');
  D.swap(sheet, 'Deadlift');
  const now: number = Q.ev('Date.now()');
  const key = 'w' + first + '_mon';
  const read = (k: string): Record<string, unknown> => JSON.parse(store.get(k + grid.id) || '{}') as Record<string, unknown>;
  assert.deepStrictEqual(read('ia_swaps_'), { [key]: [{ from: 'Barbell Romanian deadlift', to: 'Deadlift', ts: now, rx: [{ s: 0, i: 0, d: RX }] }] });
  assert.deepStrictEqual(read('ia_swapct_'), { 'Barbell Romanian deadlift': { to: 'Deadlift', n: 1, offered: false } });
  assert.equal(Q.toasts[Q.toasts.length - 1], 'Deadlift in, barbell romanian deadlift out. Same job, same numbers.');
  const after = D.cards()[0]!;
  assert.deepStrictEqual([after.key, after.title, after.swappedFrom, D.moves(after)[0]!.exKey, D.moves(after)[0]!.rxDetail], [card.key, 'Deadlift', 'Barbell Romanian deadlift', 'deadlift', RX]);
  // The snapshot took the swap in; the draft stays under the lift it was made on, and the new lift starts fresh.
  const snap = (read('ia_hist_')[key] as { sections: { items: { name: string }[] }[] }).sections[0]!.items[0]!.name;
  assert.equal(snap, 'Deadlift');
  const drafts = Object.keys(((read('ia_logs_')[key] as { sets?: Record<string, unknown> }).sets) || {});
  assert.deepStrictEqual(drafts, ['barbell_romanian_deadlift']);
  assert.deepStrictEqual(D.fields['deadlift']!.reps.map((r) => r.value), ['12', '12', '12'], 'each set at its target, none of the other lift\'s draft');
  D.unswap('Barbell Romanian deadlift');
  assert.deepStrictEqual(read('ia_swaps_'), {});
  assert.deepStrictEqual(read('ia_swapct_'), { 'Barbell Romanian deadlift': { to: 'Deadlift', n: 1, offered: false } }, 'put it back takes nothing off the count');
  assert.equal(Q.toasts[Q.toasts.length - 1], 'Barbell Romanian deadlift is back on the card.');
  const back = D.cards()[0]!;
  assert.deepStrictEqual([back.title, back.swappedFrom, D.moves(back)[0]!.exKey], ['Barbell Romanian deadlift', null, 'barbell_romanian_deadlift']);
  assert.deepStrictEqual(D.fields['barbell_romanian_deadlift']!.reps.map((r) => r.value), ['13', '12', '12'], 'its draft is back with it');
  D.close();
});
