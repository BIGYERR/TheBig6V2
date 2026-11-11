// Stored state: what the app leaves in storage after a whole history, held byte for byte (MIGRATION.md, phase 1).
// Golden records in tests/snapshots/stored-state.json, made by tests/support/stored-state.ts through the app's own
// entry points. They guard behaviour that must not change: the logic that reads and writes the ia_ keys is about to
// move out of the page into core, and after each move these records must come out the same, to the byte. So every
// test here passes on the release before it too, by design; what proves the records can fail is the deliberate break
// (tools/red-check, MIGRATION.md 3.4).
//
// This file: Mario's program through the standard history, and the hostile cases. Each case also holds the few facts
// that can be typed by hand (a week number from the calendar, a key that must be gone, two phones that must be equal).
// The sweep (tests/sweeps/stored-state.test.ts) walks the other seeded programs, three time zones and a lattice sample.
//
// The time zone is pinned (America/New_York): a log's ts is an instant, so the bytes depend on the zone.
// Regenerate only when a ruling changes what the app stores:
//   cd tests && UPDATE_SNAPSHOTS=1 npx vitest run integration/stored-state.test.ts
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { afterAll, test } from 'vitest';
import { fixtures } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { matchSnapshot } from '../support/snapshot.ts';
import { Phone, at, firstWeek, life, slim, trainDay, training } from '../support/stored-state.ts';
import type { StateRecord } from '../support/stored-state.ts';

const HALF = fixtures.HALF_MANNY;                                   // race 2026-12-06, 14 weeks, first Monday 2026-08-31
const PACE = PROGRAMS['1.5 mile test goal, commercial, balanced']!;  // no race date: it starts when it is made
const CREATED = '2026-08-29T09:00:00';                               // the Saturday before HALF_MANNY's first Monday
const START = '2026-08-31';

const golden: Record<string, unknown> = {};
/** A phone with HALF_MANNY made and its first training day logged. */
function oneDayIn(): { P: Phone; id: string; day: string } {
  const P = new Phone().launch(CREATED);
  const id = P.generate(HALF);
  const d = training(P.launch(at(START, 0)), 1)[0]!;
  trainDay(P, 1, d, 0);
  return { P, id, day: d };
}
const parsed = (P: Phone, key: string): any => JSON.parse(P.dump()[key] || 'null');

test('HALF_MANNY through the standard history: the same history twice leaves the same bytes', () => {
  const a = life(HALF, CREATED), b = life(HALF, CREATED);
  assert.deepStrictEqual(a.phone.dump(), b.phone.dump(), 'two runs of one history store the same bytes');
  assert.deepStrictEqual(a.records, b.records);
  assert.equal(a.phone.prog.startDate, START, 'fourteen weeks back from race week (typed from the calendar)');
  const last = a.records['4 after two weeks away']!;
  assert.equal(last.live!.week, 6, '2026-10-07 is in the sixth week from 2026-08-31');
  const id = a.phone.ev('activeProgId');
  // What the history did, read back from the keys it should have written.
  for (const k of ['ia_logs_', 'ia_comp_', 'ia_hist_', 'ia_exw_', 'ia_parts_', 'ia_swaps_', 'ia_swapct_', 'ia_edits_', 'ia_moves_', 'ia_wild_']) {
    assert.ok(last.keys[k + id], k + ' was written');
  }
  assert.equal(parsed(a.phone, 'ia_logs_' + id).w1_tue.notes, 'Felt strong 💪, slept 7 h', 'an emoji in a note comes back whole');
  assert.equal(last.programs[0]!.overlays >= 2, true, 'the injury and the travel are stored on the program');
  golden['half-manny, the standard history'] = slim(a.records);
});

test('a backup of that phone, loaded on an empty phone, gives the same keys to the byte', () => {
  const src = life(HALF, CREATED).phone;
  const text: string = JSON.stringify(src.ev('backupSnapshot()'));
  const dst = new Phone().launch('2026-10-07T08:05:00');
  assert.deepStrictEqual(dst.dump(), {}, 'the second phone starts with nothing');
  dst.IA.ctx['__text'] = text;
  const read = dst.ev('readBackup(__text)');
  assert.equal(read.ok, true);
  assert.equal(read.programs, 1);
  assert.equal(dst.ev('loadBackupData(readBackup(__text).data)'), true);
  assert.deepStrictEqual(dst.dump(), src.dump(), 'every ia_ key equal, byte for byte');
  dst.launch('2026-10-07T08:10:00');
  assert.deepStrictEqual(dst.record().live, src.record().live, 'and the next launch shows the same grid');
  golden['a backup loaded on an empty phone'] = { backupBytes: Buffer.byteLength(text, 'utf8'), after: dst.record() };
});

test('eight weeks unopened: the launch lands on week nine and the logged day is still there', () => {
  const { P, id, day } = oneDayIn();
  P.launch(at(START, 56, '09:00'));
  const r = P.record();
  assert.equal(r.live!.week, 9, '2026-10-26 is the ninth Monday from 2026-08-31');
  assert.equal(parsed(P, 'ia_comp_' + id)['w1_' + day].status, 'complete');
  golden['eight weeks unopened'] = r;
});

test('after race day the program holds on its last week', () => {
  const { P } = oneDayIn();
  P.launch('2026-12-16T09:00:00');
  const r = P.record();
  assert.equal(r.live!.week, 14, 'a fourteen week program never reads past week fourteen');
  golden['ten days after the race'] = r;
});

test('the week the clocks go back (2026-11-01): Monday 2 November is week ten', () => {
  const P = new Phone().launch('2026-10-24T09:00:00');
  P.generate(HALF);
  const { first } = firstWeek(P, '2026-10-24T09:00:00');
  assert.equal(first, 9, 'made on a Saturday of week eight, the first whole week is nine (26 Oct to 1 Nov)');
  training(P.launch(at(START, 56)), 9).slice(0, 2).forEach((d, i) => { P.launch(at(START, 56 + ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(d))); trainDay(P, 9, d, i); });
  P.launch('2026-11-02T06:00:00');
  const r = P.record();
  assert.equal(r.live!.week, 10, '2026-11-02 is nine weeks after 2026-08-31');
  golden['the week the clocks go back'] = r;
});

test('a year end: a program made on Saturday 19 December is in its fourth week on Monday 4 January', () => {
  const made = '2026-12-19T09:00:00';
  const P = new Phone().launch(made);
  P.generate(PACE);
  const { first, start } = firstWeek(P, made);
  assert.equal(P.prog.startDate, '2026-12-19', 'with no race it starts the day it is made');
  assert.equal(first, 2, 'its first week is the one it was made in (14 to 20 December), so the first whole week is two');
  for (const w of [first, first + 1]) training(P.launch(at(start, 7 * (w - 1))), w).slice(0, 2).forEach((d, i) => { P.launch(at(start, 7 * (w - 1) + ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(d))); trainDay(P, w, d, i); });
  P.launch(at(start, 7 * (first + 1), '07:00'));
  const r = P.record();
  assert.equal(r.live!.week, 4, 'weeks of 14, 21 and 28 December, then 4 January: the fourth');
  golden['a year end'] = r;
});

// DEFECT, found 2026-11-11 by this record, not ruled and not fixed: calcCurrentWeek and refreshProgram count days as
// milliseconds over 86,400,000. After the clocks go forward a local midnight is an hour short of a whole day, so every
// Monday from then on reads as the week before; Tuesday to Sunday read right. The other direction (2026-11-01, above)
// is an hour over and reads right. The record holds what the app does today, so the move into core reproduces it; a
// fix is its own ruling and regenerates this record.
test('the week the clocks go forward (2027-03-14): the Monday after reads as week two, the Tuesday as week three', () => {
  const made = '2027-03-06T09:00:00';
  const P = new Phone().launch(made);
  P.generate(PACE);
  const { first, start } = firstWeek(P, made);
  training(P.launch(at(start, 7 * (first - 1))), first).slice(0, 2).forEach((d, i) => { P.launch(at(start, 7 * (first - 1) + ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(d))); trainDay(P, first, d, i); });
  // The Monday and the Tuesday after the clocks go forward, by the calendar the second week from `start`.
  const weeks = [0, 1].map((n) => P.launch(at(start, 7 * first + n, '06:00')).record().live!.week);
  assert.equal(P.prog.startDate, '2027-03-06');
  assert.equal(first, 2, 'made on the Saturday of its first week (1 to 7 March)');
  assert.equal(weeks[1], 3, 'Tuesday 16 March is in the third week from Monday 1 March (typed from the calendar)');
  assert.equal(weeks[0], 2, 'Monday 15 March is in the third week too, and the app reads two: the defect above, held');
  golden['the week the clocks go forward'] = { mondayReads: weeks[0], tuesdayReads: weeks[1], after: P.record() };
});

test('a log for a day the grid does not hold is kept as it is', () => {
  const { P, id } = oneDayIn();
  const logs = parsed(P, 'ia_logs_' + id);
  logs['w40_mon'] = { rpe: '7', notes: 'from another life', week: 40, ts: 1 };
  P.damage('ia_logs_' + id, JSON.stringify(logs));
  P.launch(at(START, 2));
  assert.deepStrictEqual(parsed(P, 'ia_logs_' + id).w40_mon, logs['w40_mon']);
  golden['a log for a day the grid does not hold'] = P.record();
});

test('an old lift key is folded onto its new name at launch (EX_KEY_ALIAS)', () => {
  const { P, id } = oneDayIn();
  const exw = parsed(P, 'ia_exw_' + id);
  exw['push_press'] = { name: 'Push press', entries: [{ weight: 95, setsReps: '3×5', setsDone: [5, 5, 5], setsW: [], week: 1, day: 'mon', ts: 2 }] };
  P.damage('ia_exw_' + id, JSON.stringify(exw));
  P.launch(at(START, 2));
  const after = parsed(P, 'ia_exw_' + id);
  assert.equal('push_press' in after, false, 'the old key is gone');
  assert.equal(after['barbell_push_press'].entries[0].weight, 95, 'its entries sit under the new one');
  golden['an old lift key'] = P.record();
});

test('an older program with no seed in its config, no overlays and no blockOpen gets its seed written back', () => {
  const { P } = oneDayIn();
  const progs = JSON.parse(P.dump()['ia_programs']!);
  delete progs[0].cfg.seed; delete progs[0].overlays; delete progs[0].blockOpen;
  assert.equal(progs[0].seed, 76308, 'the program itself still carries the seed');
  P.damage('ia_programs', JSON.stringify(progs));
  P.launch(at(START, 2));
  assert.equal(JSON.parse(P.dump()['ia_programs']!)[0].cfg.seed, 76308);
  golden['an older program'] = P.record();
});

test('a key holding broken JSON reads as empty, and the next log replaces it', () => {
  const { P, id } = oneDayIn();
  P.damage('ia_logs_' + id, '{"w1_mon":');
  P.damage('ia_comp_' + id, 'not json');
  P.launch(at(START, 1));
  const d = training(P, 1)[1]!;
  trainDay(P, 1, d, 1);
  assert.deepStrictEqual(Object.keys(parsed(P, 'ia_logs_' + id)), ['w1_' + d], 'the logs hold the day just logged and nothing else');
  assert.deepStrictEqual(Object.keys(parsed(P, 'ia_comp_' + id)), ['w1_' + d]);
  golden['broken JSON in two keys'] = P.record();
});

test('storage that refuses the history key: the day still logs, and no history is kept', () => {
  const P = new Phone().launch(CREATED);
  const id = P.generate(HALF);
  P.launch(at(START, 0));
  const set = P.IA.localStorage.setItem;
  P.IA.localStorage.setItem = (k: string, v: string) => { if (k.startsWith('ia_hist_')) throw new Error('QuotaExceededError'); set(k, v); };
  const d = training(P, 1)[0]!;
  trainDay(P, 1, d, 0);
  assert.equal(parsed(P, 'ia_comp_' + id)['w1_' + d].status, 'complete');
  assert.equal(('ia_hist_' + id) in P.dump(), false);
  golden['storage refuses the history key'] = P.record();
});

test('a second program, a switch back, an archive and a delete: the deleted program leaves no key behind', () => {
  const { P, id: first } = oneDayIn();
  P.launch(at(START, 1, '07:00'));
  const second = P.generate(PACE);
  assert.notEqual(second, first);
  const d = training(P, 1)[0];
  if (d) trainDay(P, 1, d, 2);
  assert.ok(Object.keys(P.dump()).some((k) => k.endsWith(second) && k !== 'ia_active'), 'the second program wrote keys of its own');
  P.ev(`setActive(${JSON.stringify(first)});`);
  assert.equal(P.dump()['ia_active'], first);
  P.ev(`archiveProg(${JSON.stringify(second)});`);
  const archived = P.record();
  P.ev(`deleteProg(${JSON.stringify(second)});`);
  assert.deepStrictEqual(Object.keys(P.dump()).filter((k) => k.includes(second)), [], 'every key of the deleted program is gone');
  assert.equal(JSON.parse(P.dump()['ia_programs']!).length, 1);
  golden['two programs: archived, then deleted'] = { archived, deleted: P.record() };
});

test('a logged day with no history kept, in a week an injury then covers, takes the injured form at the next launch', () => {
  // Older data, and a phone whose storage refused the history key, hold logged days with no snapshot. The freeze
  // gives such a day its rebuilt form when an injury covers its week, and its stored form otherwise.
  const { P, id, day } = oneDayIn();
  const before = JSON.stringify(P.day(1, day as 'mon'));
  P.damage('ia_hist_' + id, null);
  P.launch(at(START, 1, '07:00'));
  P.ev(`_ovDraft.injRegion='lowback';_ovDraft.injTier='workaround';_ovDraft.from=${JSON.stringify(START)};applyInjuryDraft();`);
  P.launch(at(START, 1, '07:05'));
  assert.equal(('ia_hist_' + id) in P.dump(), false, 'still no history for the program');
  assert.notEqual(JSON.stringify(P.day(1, day as 'mon')), before, 'the logged day is no longer the form it was logged in');
  golden['a logged day with no history, then an injury'] = P.record();
});

afterAll(() => {
  // One file for the whole feature. A case that failed above left its entry out, and the comparison says so.
  matchSnapshot('stored-state', { zone: process.env['TZ'], created: CREATED, records: golden as Record<string, StateRecord> });
});
