// The Expo app's Progress against today's page (MIGRATION.md phase 3, row 4), on HALF_MANNY: the screen opened at each
// stretch of the standard history, then on three weeks of runs logged with a pace (which the standard history never
// stores, so no run card but the ladder shows on it), then with a second program beside it (the chips, the archived
// bar, Restore, Delete Forever), then on a lift log that needs the open's cleanup. After every tap every word and
// number of the screen and every ia_ key is equal, value for value, no family left out. Every expected value here is
// today's page, on purpose (support/native-progress.ts). The ten programs are tests/sweeps/native-progress.test.ts's.
//
// The run cards are compared here though this app does not draw them yet (DRAWN): their numbers are the view's.
//
// Imported first: every launch a phone makes here is a launch of the beta's seam too, held equal key for key
// (support/native-launch.ts).
import '../support/native-launch.ts';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { fixtures } from '../support/app.ts';
import { TwoProgress, cardKind, chipsWalk, openBoth, progressTally, runsLife, twin } from '../support/native-progress.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life } from '../support/stored-state.ts';

process.env['TZ'] = 'America/New_York';
const CREATED = '2026-08-29T09:00:00';
const HALF = fixtures.HALF_MANNY;
const SECOND = Object.values(PROGRAMS)[5]!;
const T = progressTally();

test('HALF_MANNY through the standard history: Progress opened at each stretch and the estimator worked, the screens and the stores equal', () => {
  let stages = 0;
  life(HALF, CREATED, undefined, (stage, P) => {
    const two = openBoth(P, T, 'HALF_MANNY, ' + stage);
    if (stage === '0 generated') assert.equal(two.view && two.view.empty, 'none', 'nothing logged: No data yet');
    else assert.equal(two.view && two.view.empty, null);
    stages++;
  });
  assert.equal(stages, 5);
  // Measured: 25 draws (five taps at each of five stretches), 5 of them No data yet, 20 with a ledger (75 main
  // blocks, 80 ladder rows), 40 dot charts, 105 journal entries (40 with a note), 15 estimates and 5 with none.
  assert.ok(T.draws >= 25 && T.empties >= 5 && T.ledgers >= 20 && T.mains >= 40 && T.ladder >= 50 && T.dots >= 40, 'what was drawn: ' + JSON.stringify(T));
  assert.ok(T.journalEntries >= 80 && T.notes >= 20 && T.estimates >= 15 && T.estimatesEmpty >= 5, 'the journal and the estimator: ' + JSON.stringify(T));
});

test('HALF_MANNY in kilograms: the ledger\'s loads and the estimate are said in kg, as today\'s', () => {
  const K = progressTally();
  const { phone } = life({ ...HALF, unit: 'kg' } as typeof HALF, CREATED);
  const two = openBoth(phone, K, 'HALF_MANNY in kg');
  const led = two.view!.charts.find((c) => c.kind === 'ledger');
  assert.ok(led && led.kind === 'ledger' && led.view.ladder && led.view.ladder.rows.every((r) => / kg$/.test(r.weight)), 'every ladder row reads kg');
  assert.match(two.estimate('Squat', '100', '5'), /^Estimated Squat 1RM: 115 kg /);
});

test('three weeks of runs logged with a pace: every run card, the swap line and the jog line equal to today\'s', () => {
  const R = progressTally();
  const { phone, runs } = runsLife(HALF, CREATED);
  assert.ok(runs >= 10, 'runs logged: ' + runs);
  const two = openBoth(phone, R, 'HALF_MANNY, three weeks of runs');
  const titles = two.view!.charts.flatMap((c) => (c.kind === 'card' ? [cardKind(c.spec)] : []));
  // Typed from the measure (tests/measure/native-progress_today.md, section A2), in today's order.
  assert.deepEqual(titles, ['Long Run Ladder', 'Is Your Easy Actually Easy?', 'Recovery Pace — Easy-Effort Trend', 'Mileage — Drift From Plan']);
  assert.ok(R.swaps >= 1 && R.jogs >= 1 && R.notes >= 1, 'the journal holds a swap, a jog and a note: ' + JSON.stringify(R));
  const note = two.view!.journal!.flatMap((w) => w.entries).find((e) => e.notes);
  assert.ok(note && /Legs heavy/.test(note.notes!), 'the note is in the journal');
  for (const k of Object.keys(R.cardKinds)) T.cardKinds[k] = (T.cardKinds[k] || 0) + R.cardKinds[k]!;
});

test('one and two weeks of runs are too few for the trend and the zone chart: the easy effort\'s empty state, then the easy bands, equal to today\'s', () => {
  const R = progressTally();
  const one = runsLife(HALF, CREATED, 1);
  assert.equal(one.runs, 4);
  let two = openBoth(one.phone, R, 'HALF_MANNY, one week of runs');
  // Typed from the measure of today's page: one card, the easy effort chart's empty state.
  assert.deepEqual(two.view!.charts.flatMap((c) => (c.kind === 'card' ? [cardKind(c.spec)] : [])), ['Same Effort, More Speed (its empty state)']);
  const twoWeeks = runsLife(HALF, CREATED, 2);
  assert.equal(twoWeeks.runs, 8);
  two = openBoth(twoWeeks.phone, R, 'HALF_MANNY, two weeks of runs');
  assert.deepEqual(two.view!.charts.flatMap((c) => (c.kind === 'card' ? [cardKind(c.spec)] : [])),
    ['Long Run Ladder', 'Is Your Easy Actually Easy? (the easy bands)', 'Recovery Pace — Easy-Effort Trend', 'Mileage — Drift From Plan']);
});

test('a run logged in the short first week is left out of the weekly sums, the ladder and the drift on both (D26)', () => {
  const R = progressTally();
  // A test goal program starts the day it is made, a Saturday here, so its first week is two days long and holds a
  // run (a race program is counted back from its race and starts on a Monday).
  const { phone, shortRuns } = runsLife(Object.values(PROGRAMS)[4]!, CREATED, 3, true);
  assert.equal(shortRuns, 1, 'the Saturday run of the short week was logged');
  const two = openBoth(phone, R, 'the 1.5 mile program, a run in its short first week');
  assert.ok(two.view!.charts.some((c) => c.kind === 'card' && cardKind(c.spec) === 'Mileage — Drift From Plan'), 'the drift is drawn');
  const dot = two.view!.charts.find((c) => c.kind === 'dot');
  assert.ok(dot && dot.kind === 'dot' && dot.spec.points.length === 3, 'three whole weeks on the mileage chart, the short one left out');
});

test('a second program beside it: both chips, the archived bar, the trash and Cancel, Restore, then Delete Forever, the stores equal after each', () => {
  const C = progressTally();
  // The standard history's phone: its lifts are logged, and the second program's lifts start from those loads, so
  // the delete's confirmation carries its warning.
  const { phone } = life(HALF, CREATED);
  const two = chipsWalk(phone, SECOND, C, 'HALF_MANNY and a second program');
  assert.ok(C.chips >= 20 && C.bars >= 5 && C.confirms === 2 && C.warned === 2 && C.restores === 1 && C.deletes === 1, 'chips, bars and the two writes: ' + JSON.stringify(C));
  assert.ok(C.removed >= 10, 'Delete Forever removed the program\'s own keys: ' + C.removed);
  assert.deepEqual(two.wrote.filter((k) => k === 'ia_programs'), ['ia_programs'], 'and its row in ia_programs');
  if (process.env['IA_TALLY']) writeFileSync(process.env['IA_TALLY'], JSON.stringify({ standard: T, chips: C }));
});

test('the open cleans the viewed program\'s lift log once: an old exercise key folded and a same day pair dropped, on both', () => {
  const F = progressTally();
  const { phone: P } = life(HALF, CREATED);
  const first: string = P.ev('activeProgId');
  // A second program becomes the active one, so no launch folds the first one's log before Progress shows it.
  const Q = twin(P);
  Q.launch('2026-10-12T09:00:00');
  Q.generate(SECOND);
  const exw = JSON.parse(Q.dump()['ia_exw_' + first]!) as Record<string, { name: string; entries: { week: number; day?: string; weight: number; ts: number }[] }>;
  const alias = Q.ev('EX_KEY_ALIAS') as Record<string, string>;
  const old = Object.keys(alias).find((k) => alias[k] !== k && !exw[k] && !exw[alias[k]!])!;
  assert.ok(old, 'an old key the log does not hold');
  // The old key and today's key each hold an entry of one day: folding makes a same day pair, which the cleanup
  // then drops (the fold runs first for that reason).
  exw[old] = { name: 'An old name', entries: [{ week: 1, day: 'mon', weight: 100, ts: 5 }] };
  exw[alias[old]!] = { name: 'An old name', entries: [{ week: 1, day: 'mon', weight: 105, ts: 6 }] };
  const row = Object.values(exw).find((r) => r.entries.length && r.name !== 'An old name')!;
  row.entries.push({ ...row.entries[0]!, weight: 999, ts: row.entries[0]!.ts + 1 });
  const pairs = row.entries.length;
  Q.damage('ia_exw_' + first, JSON.stringify(exw));
  Q.launch('2026-10-13T09:00:00');
  const two = new TwoProgress(Q, F, 'a lift log to clean');
  two.open();
  assert.deepEqual(two.wrote, [], 'the active program\'s log needs nothing');
  two.chip(first);
  assert.deepEqual(two.wrote, ['ia_exw_' + first], 'showing the first program cleans its log');
  const after = JSON.parse(two.store.get('ia_exw_' + first)!) as typeof exw;
  assert.equal(after[old], undefined, 'the old key is gone');
  assert.deepEqual(after[alias[old]!]!.entries.map((e) => e.weight), [105], 'its row is under today\'s key, and of the pair the fold made the later entry is kept');
  assert.equal(Object.values(after).find((r) => r.name === row.name)!.entries.length, pairs - 1, 'the same day pair is one entry');
  assert.ok(Object.values(after).find((r) => r.name === row.name)!.entries.some((e) => e.weight === 999), 'the later of the two is kept');
  two.chip(first);
  assert.deepEqual(two.wrote, [], 'and the next draw writes nothing');
  assert.equal(F.folds, 1);
});
