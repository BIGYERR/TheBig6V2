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
import { Phone, at, cards, firstWeek, life, slim, trainDay, training } from '../support/stored-state.ts';
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

test('a day\'s parts settle its status: a skipped lift with a logged run is done, both parts skipped is skipped, and neither latches', () => {
  // The standard history skips one part of one day and stops there, so no record of it holds a completion the parts
  // wrote (found by the break check, v0.261.4). Week 1 of HALF_MANNY: Monday and Tuesday each carry a run and a lift.
  const P = new Phone().launch(CREATED);
  const id = P.generate(HALF);
  const comp = () => parsed(P, 'ia_comp_' + id) || {};
  P.launch(at(START, 0));
  for (const d of ['mon', 'tue']) assert.equal(P.ev(`JSON.stringify(dayPartsOf(1,'${d}'))`), '["run","lift"]', d + ' has both parts');

  // Monday: the lift skipped on its own leaves the day open; the run logged then closes it.
  P.open(1, 'mon');
  P.ev("skipPart(1,'mon','lift')");
  assert.deepStrictEqual(comp(), {}, 'one skipped part of two writes no completion');
  P.type('log_run_dist', '3.1'); P.type('log_run_mins', '31');
  P.ev("persistLogFields('mon',true)");
  assert.deepStrictEqual([comp().w1_mon.status, comp().w1_mon.parts], ['complete', 1], 'the parts wrote the completion, and it says so');

  // Tuesday: both parts skipped is a skipped day.
  P.launch(at(START, 1));
  P.open(1, 'tue');
  P.ev("skipPart(1,'tue','run');skipPart(1,'tue','lift');");
  assert.deepStrictEqual([comp().w1_tue.status, comp().w1_tue.parts], ['skipped', 1]);
  assert.deepStrictEqual(parsed(P, 'ia_parts_' + id), { w1_mon: { lift: 1 }, w1_tue: { run: 1, lift: 1 } });
  const closed = P.record();

  // No latch: Tuesday's run put back, and Monday's run cleared, open both days again; the skipped lifts stay.
  P.launch(at(START, 1, '21:00'));
  P.ev("skipPart(1,'tue','run')");
  P.open(1, 'mon');
  P.ev("persistLogFields('mon',true)");
  assert.deepStrictEqual(comp(), {}, 'a completion the parts wrote goes when the parts no longer earn it');
  assert.deepStrictEqual(parsed(P, 'ia_parts_' + id), { w1_mon: { lift: 1 }, w1_tue: { lift: 1 } });
  golden['a day\'s parts settle its status'] = { closed, reopened: P.record() };
});

test('a touched day edited, then its session moved: the edit is in the day\'s snapshot, and the move leaves the snapshot as it was', () => {
  // No other history edits a day after its first touch: the standard one swaps, skips and adds before the day is
  // logged, so a re-snapshot that did nothing changed no record (found by the break check, v0.261.5). Week 1 of
  // HALF_MANNY: Monday trains, Wednesday rests.
  const P = new Phone().launch(CREATED);
  const id = P.generate(HALF);
  const hist = () => parsed(P, 'ia_hist_' + id) || {};
  const items = (day: any): any[] => (day.sections || []).flatMap((s: any) => s.items || []);
  const names = (day: any): string[] => items(day).map((i) => i.name);
  P.launch(at(START, 0));
  assert.deepStrictEqual([!!P.day(1, 'mon').rest, !!P.day(1, 'wed').rest], [false, true], 'Monday trains, Wednesday rests');

  // Monday: one lift logged, the first touch. Then another card swapped, and a third skipped.
  P.open(1, 'mon');
  const cs = cards(P.day(1, 'mon'));
  P.logLift(cs[0]!.name, cs[0]!.detail, [cs[0]!.reps, cs[0]!.reps], [135, 140]);
  assert.deepStrictEqual(Object.keys(hist()), ['w1_mon'], 'the logged lift snapshots the day');
  assert.deepStrictEqual(parsed(P, 'ia_comp_' + id), null, 'and marks nothing');
  const out = cs[1]!, gone = cs[2]!;
  P.IA.ctx['__c'] = { secIdx: out.secIdx, itemIdx: out.itemIdx, name: out.name, detail: out.detail };
  const to: string | null = P.ev("(function(){var r=swapCandidates(__c.name,activeProg.weeks[1].mon,1,activeProg);var x=[].concat(r.tier1||[],r.tier2||[])[0];return x?(x.name||x):null;})()");
  assert.ok(to && to !== out.name, 'the swap sheet offers a move for the second card');
  P.ev(`_swapCtx=__c;applySwapChoice(${JSON.stringify(to)});`);
  P.ev(`skipExercise(${JSON.stringify(gone.name)});`);
  const edited = (day: any): unknown[] => [names(day).includes(to!), names(day).includes(out.name), items(day).some((i) => i.name === gone.name && i._skipped === true)];
  assert.deepStrictEqual(edited(hist().w1_mon), [true, false, true], 'the snapshot holds the move swapped in and the skipped one, edits made after its first touch');

  // The next launch gives Monday back from its snapshot, edits and all.
  P.launch(at(START, 1, '07:00'));
  assert.deepStrictEqual(edited(P.day(1, 'mon')), [true, false, true], 'the card in hand is the card the athlete left');
  const afterEdit = P.record();

  // Wednesday: Monday's session, a lift already logged on it, is still offered to the rest sheet's Move.
  P.launch(at(START, 2, '10:00'));
  const before = JSON.stringify(hist().w1_mon);
  P.ev("openRestSheet(1,'wed','move');_rdSet('pick','mon');applyRestMove();");
  P.settle();
  assert.deepStrictEqual([P.day(1, 'wed').movedFrom, !!P.day(1, 'mon').rest], ['mon', true], 'the session is on Wednesday and Monday rests');
  assert.equal(JSON.stringify(hist().w1_mon), before, 'the move does not rewrite Monday\'s snapshot: first touch stands');
  P.open(1, 'wed');
  const c = cards(P.day(1, 'wed'))[0]!;
  P.logLift(c.name, c.detail, [c.reps, c.reps], [145, 150]);
  assert.deepStrictEqual(Object.keys(hist()), ['w1_mon', 'w1_wed'], 'the moved session is snapshotted where it was trained');
  assert.equal(hist().w1_wed.movedFrom, 'mon');
  assert.equal(JSON.stringify(hist().w1_mon), before);
  // The launch after: the record holds what today's app does here. Each day has a snapshot, so the session shows on
  // both (found, not fixed: docs/decisions/stored-state.md, v0.261.5).
  P.launch(at(START, 3, '07:00'));
  golden['a touched day edited, then its session moved'] = { edited: afterEdit, moved: P.record() };
});

test('a day\'s swaps and edits made and undone before the next launch, and the nudge: what each tap stores is in the records', () => {
  // No other history holds what a skip, an add, an undo or the nudge stores: the next launch freezes the touched week
  // and prunes its edits, and the standard history swaps once and undoes nothing (found by the break check,
  // v0.261.6). Week 1 of HALF_MANNY, Monday, before anything is logged and with no launch between the taps.
  const P = new Phone().launch(CREATED);
  const id = P.generate(HALF);
  P.launch(at(START, 0));
  P.open(1, 'mon');
  const cs = cards(P.day(1, 'mon'));
  assert.ok(cs.length >= 3, 'Monday holds three movements to work with');
  const out = cs[0]!, gone = cs[1]!;
  P.IA.ctx['__c'] = { secIdx: out.secIdx, itemIdx: out.itemIdx, name: out.name, detail: out.detail };
  const to: string | null = P.ev("(function(){var r=swapCandidates(__c.name,activeProg.weeks[1].mon,1,activeProg);var x=[].concat(r.tier1||[],r.tier2||[])[0];return x?(x.name||x):null;})()");
  assert.ok(to && to !== out.name, 'the swap sheet offers a move for the first card');
  const swap = () => { P.ev(`_swapCtx=__c;applySwapChoice(${JSON.stringify(to)});`); P.settle(); };
  const undo = () => { P.ev(`undoSwap(${JSON.stringify(out.name)});`); P.settle(); };
  const add: string | null = P.ev("(function(){var c=addCandidates(activeProg.weeks[1].mon,1,activeProg);return (c.more||[])[0]||(c.gap||[])[0]||null;})()");
  assert.ok(add, 'the add sheet offers a movement');

  // A swap, a skip and an add.
  swap();
  P.ev(`skipExercise(${JSON.stringify(gone.name)});`);
  P.ev(`applyAddChoice(${JSON.stringify(add)});`);
  const swaps = parsed(P, 'ia_swaps_' + id), edits = parsed(P, 'ia_edits_' + id);
  assert.deepStrictEqual(swaps.w1_mon.map((r: any) => [r.from, r.to, Array.isArray(r.rx)]), [[out.name, to, true]], 'one record, with where the lift stood');
  assert.deepStrictEqual(parsed(P, 'ia_swapct_' + id), { [out.name]: { to, n: 1, offered: false } });
  assert.deepStrictEqual([Object.keys(edits), edits.w1_mon.skip, edits.w1_mon.add.map((a: any) => a.name)], [['w1_mon'], [gone.name], [add]]);
  const edited = P.record();

  // Each undone: the skip put back, the add removed, the swap undone. The day's keys go with their last record.
  P.ev(`unskipExercise(${JSON.stringify(gone.name)});`);
  P.ev(`removeAddedExercise(${JSON.stringify(add)});`);
  undo();
  assert.deepStrictEqual([parsed(P, 'ia_swaps_' + id), parsed(P, 'ia_edits_' + id)], [{}, {}]);
  assert.deepStrictEqual(parsed(P, 'ia_swapct_' + id), { [out.name]: { to, n: 1, offered: false } }, 'an undo leaves the count');
  const undone = P.record();

  // The same pair twice more: the third swap running brings the nudge up, and turning it down marks the lift offered.
  swap(); undo(); swap();
  assert.equal(P.ev('_nudgeCtx&&_nudgeCtx.from'), out.name, 'the nudge is up');
  P.ev('dismissSwapNudge();');
  assert.deepStrictEqual(parsed(P, 'ia_swapct_' + id), { [out.name]: { to, n: 3, offered: true } });
  const nudged = P.record();

  // The same pair recorded again while its record stands: the lift traded in is traded on, the lift traded off comes
  // back from the add sheet, and that one is swapped for the first replacement again. The record keeps both places
  // the lift stood, the earlier tap's and this one's (V221 D177 R4).
  type Place = { secIdx: number; itemIdx: number; name: string; detail: string };
  const place = (n: string): Place | null => {
    let r: Place | null = null;
    (P.day(1, 'mon').sections || []).forEach((s: any, si: number) => (s.items || []).forEach((it: any, ii: number) => {
      if (!r && it && it.name === n) r = { secIdx: si, itemIdx: ii, name: n, detail: it.detail };
    }));
    return r;
  };
  const offered = (n: string): string[] => {
    P.IA.ctx['__n'] = n;
    return P.ev("(function(){var r=swapCandidates(__n,activeProg.weeks[1].mon,1,activeProg);return [].concat(r.tier1||[],r.tier2||[]).map(function(x){return x.name||x;});})()");
  };
  const swapAt = (n: string, t: string) => { P.IA.ctx['__c'] = place(n); P.ev(`_swapCtx=__c;applySwapChoice(${JSON.stringify(t)});`); P.settle(); };
  const onward = offered(to!).find((n) => n !== out.name);
  assert.ok(onward, 'the swap sheet offers a move for the replacement');
  swapAt(to!, onward!);
  const adds: string[] = P.ev("(function(){var c=addCandidates(activeProg.weeks[1].mon,1,activeProg);return [].concat(c.gap||[],c.more||[],c.off||[]);})()");
  assert.ok(adds.includes(out.name), 'the add sheet offers the lift traded off');
  P.ev(`applyAddChoice(${JSON.stringify(out.name)});`);
  const again = place(out.name)!;
  assert.ok(offered(out.name).includes(to!), 'and the swap sheet offers it the first replacement again');
  swapAt(out.name, to!);
  const rec = parsed(P, 'ia_swaps_' + id).w1_mon;
  assert.deepStrictEqual(rec.map((r: any) => [r.from, r.to]), [[to, onward], [out.name, to]], 'one record per lift traded off, the latest last');
  assert.deepStrictEqual(rec[1].rx.map((p: any) => [p.s, p.i]), [[out.secIdx, out.itemIdx], [again.secIdx, again.itemIdx]], 'both places');
  assert.deepStrictEqual(parsed(P, 'ia_swapct_' + id), { [out.name]: { to, n: 1, offered: true }, [to!]: { to: onward, n: 1, offered: false } },
    'a pair offered once starts again at one and stays offered');
  golden['a day\'s swaps and edits, made and undone, and the nudge'] = { edited, undone, nudged, merged: P.record() };
});

test('what Progress reads from three weeks of runs, the nudge taken, and a second program: the readers, the seed and the purge warning are in the records', () => {
  // Progress reads the stores and writes none, so no key-by-key record shows what it computes; and no other history
  // logs a pace at an easy effort, takes the nudge, or makes a second program to seed from (found by the break check,
  // v0.261.7). This case records what the page's readers hand back. HALF_MANNY, every run of weeks 1 to 3 logged with a
  // distance, a pace and an effort: an easy or recovery run at RPE 3, any other at RPE 7, one recovery run credited
  // to the bike, and one run tapped Done, undone and Done again.
  const P = new Phone().launch(CREATED);
  const id = P.generate(HALF);
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const runs: { w: number; d: string; sub: string; pace: number; dist: number; rpe: number; bike: boolean }[] = [];
  let n = 0, bikeDone = false, undoDone = false, undone: any = null;
  for (const w of [1, 2, 3]) {
    for (const d of training(P.launch(at(START, 7 * (w - 1), '06:30')), w)) {
      const day = P.day(w, d);
      if (!day.cardio || String(day.cardio.type).toLowerCase() !== 'run') continue;
      P.launch(at(START, 7 * (w - 1) + DAYS.indexOf(d)));
      P.open(w, d);
      const sub = String(day.cardio.subtype);
      const easy = /recovery|easy/i.test(sub);
      const bike = !bikeDone && w === 2 && /recovery/i.test(sub);
      const pace = (easy ? 600 : 480) + 7 * n, dist = +(3 + 0.4 * n).toFixed(1), rpe = easy ? 3 : 7;
      P.type('cardioSwapWrap', '');
      P.ev(`(function(){var x=document.getElementById('cardioSwapWrap').dataset;x.planned='run';x.active=${JSON.stringify(bike ? 'bike' : 'run')};})()`);
      P.type('log_run_dist', dist.toFixed(1));
      P.type('log_run_pace', Math.floor(pace / 60) + ':' + String(pace % 60).padStart(2, '0') + '/mi');
      P.type('log_run_mins', String(Math.round(dist * pace / 60)));
      if (bike) P.type('log_bike_mins', '45');
      P.type('log_rpe', String(rpe), true);
      P.mark(d as any, 'complete');
      if (!undoDone && !bike && w === 2) {
        // The undo tap saves the card without committing it: a card already logged keeps its numbers.
        P.mark(d as any, 'complete');
        undone = parsed(P, 'ia_logs_' + id)[`w${w}_${d}`];
        assert.equal(undone.run_dist, dist.toFixed(1), 'the undone run keeps its distance');
        P.mark(d as any, 'complete');
        undoDone = true;
      }
      runs.push({ w, d, sub, pace, dist, rpe, bike });
      if (bike) bikeDone = true;
      n++;
    }
  }
  assert.ok(bikeDone && undoDone, 'one recovery run went to the bike, and one run was undone and done again');
  const readers = (pid: string): any => {
    P.IA.ctx['__p'] = pid;
    return P.ev(`(function(){var p=getPrograms().filter(function(x){return x.id===__p;})[0];var L=getLogsFor(__p),H=getDayHistFor(__p),tw=p.totalWeeks,cut=_cutWeek(p);
      return {cut:cut,recoveryPace:recoveryPaceWeekly(L,H,tw),ladder:ladderWeekly(L,tw,cut,false),ladderNoFirst:ladderWeekly(L,tw,0,true),
        byClass:runsByClass(L,H,tw),easyEffort:easyEffortWeekly(L,H,tw),planned:plannedVsLogged(L,H,tw,cut,false),plannedNoFirst:plannedVsLogged(L,H,tw,0,true),
        projection:(function(){var ee=easyEffortWeekly(L,H,tw),ws=Object.keys(ee.weekly),mile=_mileFromRecoverySec(ws.length?ee.weekly[ws[ws.length-1]]:0);return {mile:mile,half:_halfFromMileSec(mile)};})()};})()`);
  };
  // The fourth week's Wednesday: weeks 1 to 3 are behind.
  P.launch(at(START, 23, '08:00'));
  const progress = readers(id);
  assert.equal(progress.cut, 4, '2026-09-23 is in the fourth week from 2026-08-31, and the in-progress week is the one held back');
  const logs = parsed(P, 'ia_logs_' + id);
  const bikeRun = runs.find((r) => r.bike)!;
  assert.equal(logs[`w${bikeRun.w}_${bikeRun.d}`].swapTo, 'bike', 'the recovery run credited to the bike is stored as swapped');
  assert.deepStrictEqual(Object.keys(progress.ladder).map(Number), [1, 2, 3], 'a longest run in each of the three weeks');
  assert.deepStrictEqual(Object.keys(progress.ladderNoFirst).map(Number), [2, 3], 'and the short first week left out when asked');
  const recov = runs.filter((r) => /recovery/i.test(r.sub) && !r.bike);
  assert.equal(progress.byClass.Recovery.length, recov.length, 'every recovery run with a pace, the swapped one left out');
  // The wizard's seed is read from every program; one program alone can seed the next.
  const now: number = P.ev('Date.now()');
  const inWindow = recov.filter((r) => Date.parse(at(START, 7 * (r.w - 1) + DAYS.indexOf(r.d as any)) + '') >= now - 21 * 86400000);
  // The nudge taken: the first lift of the week's first training day traded for one replacement three times running.
  const d4 = training(P, 4)[0]!;
  P.open(4, d4);
  const out = cards(P.day(4, d4))[0]!;
  P.IA.ctx['__c'] = { secIdx: out.secIdx, itemIdx: out.itemIdx, name: out.name, detail: out.detail };
  const to: string = P.ev(`(function(){var r=swapCandidates(__c.name,activeProg.weeks[4][${JSON.stringify(d4)}],4,activeProg);var x=[].concat(r.tier1||[],r.tier2||[])[0];return x?(x.name||x):null;})()`);
  assert.ok(to, 'the swap sheet offers a move');
  for (let i = 0; i < 3; i++) {
    P.ev(`_swapCtx=__c;applySwapChoice(${JSON.stringify(to)});`); P.settle();
    if (i < 2) { P.ev(`undoSwap(${JSON.stringify(out.name)});`); P.settle(); }
  }
  assert.equal(P.ev('_nudgeCtx&&_nudgeCtx.from'), out.name, 'the nudge is up');
  P.ev('acceptSwapNudge();'); P.settle();
  const stored = JSON.parse(P.dump()['ia_programs']!).filter((p: any) => p.id === id)[0];
  assert.deepStrictEqual(stored.cfg.exSwapPrefs, { [out.name]: to }, 'the preference is stored in the program\'s config');
  assert.deepStrictEqual(parsed(P, 'ia_swapct_' + id)[out.name], { to, n: 3, offered: true });
  const nudgeTaken = P.record();
  // One lift logged, then a second program made the same morning: the first program's lift log now feeds another
  // program's loads.
  P.open(4, d4);
  const lift = cards(P.day(4, d4))[0]!;
  P.logLift(lift.name, lift.detail, [5, 5], [135, 140]);
  P.generate(PACE);
  const id2: string = P.ev('activeProgId');
  assert.notEqual(id2, id);
  const seed = P.ev(`seedFromPriorPrograms(${now})`);
  assert.equal(seed && seed.progId, id, 'the seed comes from the first program');
  assert.equal(seed.n, inWindow.length, 'every recovery run of the last 21 days, the swapped one left out');
  P.IA.ctx['__id'] = id; P.IA.ctx['__id2'] = id2;
  const warns = { first: P.ev('_purgeWarnsCrossProg(__id)'), second: P.ev('_purgeWarnsCrossProg(__id2)') };
  assert.deepStrictEqual(warns, { first: true, second: false }, 'only the program with lifts logged warns that its loads feed another');
  golden['what Progress reads from three weeks of runs, the nudge taken, and a second program'] = {
    progress, undone, nudgeTaken, second: { seed, warns, progress: readers(id2), record: P.record() },
  };
});

test('backups the reader refuses, a load the phone refuses, and a backup loaded over another program and a key not the app\'s: what each reads and stores is in the records', () => {
  const { P: src, id } = oneDayIn();
  src.damage('keep', 'not the app\'s');
  src.launch(at(START, 1, '07:30'));
  const snap = src.ev('backupSnapshot()');
  // Typed by hand from D264: the file's kind and format, the release that wrote it, and the instant (07:30 EDT).
  assert.deepStrictEqual([snap.kind, snap.format, snap.version, snap.made], ['asylum-backup', 1, src.ev('String(IA_VERSION)'), '2026-09-01T11:30:00.000Z']);
  assert.deepStrictEqual(Object.keys(snap.data), Object.keys(src.dump()), 'every ia_ key in name order, and no other key');
  const good = JSON.stringify(snap);
  const variant = (o: Record<string, unknown>): string => JSON.stringify({ ...snap, ...o });
  const data = (o: Record<string, unknown>): Record<string, unknown> => ({ ...snap.data, ...o });
  const files: Record<string, string> = {
    'the file as written': good,
    'text cut short': good.slice(0, -1),
    'another kind': variant({ kind: 'other-backup' }),
    'a newer format': variant({ format: 2 }),
    'no format': variant({ format: undefined }),
    'the format as text': variant({ format: '1' }),
    'data that is a list': variant({ data: [] }),
    'no data': variant({ data: null }),
    'a key not the app\'s': variant({ data: data({ keep: '1' }) }),
    'a value not a string': variant({ data: data({ ia_active: 7 }) }),
    'no program list': variant({ data: data({ ia_programs: undefined }) }),
    'a program list that is not a list': variant({ data: data({ ia_programs: '{}' }) }),
    'two programs': variant({ data: data({ ia_programs: JSON.stringify([...JSON.parse(snap.data.ia_programs), { id: 'other' }]) }) }),
    'no time': variant({ made: undefined }),
    'a time that is not text': variant({ made: 5 }),
  };
  const reads: Record<string, unknown> = {};
  for (const [what, text] of Object.entries(files)) {
    src.IA.ctx['__text'] = text;
    const r = src.ev('readBackup(__text)');
    reads[what] = r.ok ? { ok: true, programs: r.programs, made: r.made, keys: Object.keys(r.data).length } : { ok: false, why: r.why };
  }
  const n = Object.keys(snap.data).length, made = '2026-09-01T11:30:00.000Z';
  const bad = { ok: false, why: 'bad' };
  assert.deepStrictEqual(reads, {
    'the file as written': { ok: true, programs: 1, made, keys: n }, 'text cut short': bad, 'another kind': bad,
    'a newer format': { ok: false, why: 'newer' }, 'no format': bad, 'the format as text': bad, 'data that is a list': bad, 'no data': bad,
    'a key not the app\'s': bad, 'a value not a string': bad, 'no program list': bad, 'a program list that is not a list': bad,
    'two programs': { ok: true, programs: 2, made, keys: n }, 'no time': { ok: true, programs: 1, made: '', keys: n },
    'a time that is not text': { ok: true, programs: 1, made: '', keys: n },
  }, 'typed from D264: only a good file reads, a newer format is told apart, and a missing time reads as none');

  // A second phone with a program of its own, made on another morning (so its id is not the file's), a day trained on
  // it, and a key that is not the app's.
  const dst = new Phone().launch(at(START, 1, '06:00'));
  const other = dst.generate(PACE);
  assert.notEqual(other, id);
  dst.launch(at(START, 1, '07:00'));
  const d = training(dst, 1)[0];
  if (d) trainDay(dst, 1, d, 2);
  dst.damage('keep', 'the phone\'s own');
  dst.launch(at(START, 1, '08:00'));
  const held = dst.dump();
  assert.ok(Object.keys(held).some((k) => k.endsWith(other) && !(k in snap.data)), 'the phone holds an ia_ key the file does not');
  // The phone refuses the load's last write, once, after the file's other keys are written, one of them a key the phone
  // did not hold: nothing changes.
  const fileKeys = Object.keys(snap.data), last = fileKeys[fileKeys.length - 1]!;
  assert.ok(fileKeys.slice(0, -1).some((k) => !(k in held)), 'the load writes a key the phone did not hold before the refused one');
  const LS = dst.IA.localStorage;
  const set = LS.setItem;
  let refusals = 0;
  LS.setItem = (k: string, v: string) => { if (k === last && !refusals) { refusals++; throw new Error('QuotaExceededError'); } set(k, v); };
  dst.IA.ctx['__text'] = good;
  const refusedLoad = dst.ev('loadBackupData(readBackup(__text).data)');
  LS.setItem = set;
  assert.equal(refusals, 1, 'the write was refused');
  assert.equal(refusedLoad, false);
  assert.deepStrictEqual(dst.dump(), held, 'a refused load puts back every ia_ key the phone held, and leaves none of the file\'s');
  const refused = dst.record();
  // Then the load goes through: the phone holds the file's ia_ keys and no other, and its own key stays.
  assert.equal(dst.ev('loadBackupData(readBackup(__text).data)'), true);
  assert.deepStrictEqual(dst.dump(), src.dump(), 'every ia_ key the file\'s, byte for byte');
  assert.equal(dst.IA.localStorage.getItem('keep'), 'the phone\'s own', 'a key not the app\'s stays');
  dst.launch(at(START, 1, '08:05'));
  golden['backups refused, a load refused, and a backup loaded over another program'] = {
    keys: Object.keys(snap.data), reads, refused, loaded: dst.record(),
  };
});

test('a trip to a mini gym, a swap on a trip day, an overlay the engine cannot build and a program stored with no length: the grid in hand and what each stores are in the records', () => {
  // No other history books a mini gym (the standard one travels with no equipment, where the trip's mark changes
  // nothing), asks the swap sheet about a trip day, holds an overlay that fails, or holds a program with no length:
  // four rules of the splice no record could see (found by the measure before v0.262.1,
  // tests/measure/stored-state_overlays-gaps.md). Week 1 of HALF_MANNY trains Monday, Tuesday, Thursday, Friday and
  // Saturday; the trip is Tuesday 1 September to Friday 4 September.
  const TRIP = '["substitute",{"equipment":"home_basic"}]';
  const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const P = new Phone().launch(CREATED);
  const id = P.generate(HALF);
  const stamps = (): (string | null)[] => WEEK.map((d) => P.day(1, d)._ovKey || null);
  const onTrip = [null, TRIP, null, TRIP, TRIP, null, null];   // Wednesday rests, so it keeps the base's day
  P.launch(at(START, 0, '07:00'));
  assert.deepStrictEqual(WEEK.map((d) => !!P.day(1, d).rest), [false, false, true, false, false, false, true]);
  P.ev(`_ovDraft.equipment='home_basic';_ovDraft.from='2026-09-01';_ovDraft.to='2026-09-04';applyOverlayDraft();`);
  P.settle();
  assert.deepStrictEqual(stamps(), onTrip, 'the trip\'s training days carry its stamp, and no other day does');
  // A mini gym on a trip is a hotel rack (the travel mark): its dumbbells top out, so the day's main lift is three sets
  // in a rep range at the program's easy effort, not the loaded 3×12 of the wave. Monday, at home, keeps the wave.
  const mains = (d: 'mon' | 'tue' | 'thu', lead: string): number =>
    (P.day(1, d).sections || []).flatMap((s: any) => s.items || []).filter((i: any) => String(i.detail).startsWith(lead)).length;
  assert.deepStrictEqual([mains('tue', '3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)'), mains('thu', '3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)')], [1, 1]);
  assert.deepStrictEqual([mains('tue', '3×12 — RPE'), mains('thu', '3×12 — RPE'), mains('mon', '3×12 — RPE'), mains('mon', '3 sets of 8 to 12')], [0, 0, 1, 0]);

  // Tuesday trained on the trip. Then the swap sheet on Thursday: what a mini gym can do, and nothing a rack is needed for.
  P.launch(at(START, 1));
  trainDay(P, 1, 'tue', 0);
  assert.equal(parsed(P, 'ia_hist_' + id).w1_tue._ovKey, TRIP, 'the day\'s snapshot carries the trip\'s stamp');
  P.open(1, 'thu');
  const c = cards(P.day(1, 'thu'))[0]!;
  P.IA.ctx['__c'] = { secIdx: c.secIdx, itemIdx: c.itemIdx, name: c.name, detail: c.detail };
  const offered: string[] = P.ev("(function(){var r=swapCandidates(__c.name,activeProg.weeks[1].thu,1,activeProg);return [].concat(r.tier1||[],r.tier2||[]).map(function(x){return x.name||x;});})()");
  assert.ok(offered.length > 0, 'the swap sheet offers a move for Thursday\'s first card');
  assert.equal(offered.filter((n) => /barbell|landmine|back squat|front squat|^deadlift$/i.test(n)).join(', '), '', 'no move that needs a bar');
  P.ev(`_swapCtx=__c;applySwapChoice(${JSON.stringify(offered[0])});`);
  P.settle();
  assert.deepStrictEqual(parsed(P, 'ia_swaps_' + id).w1_thu.map((r: any) => [r.from, r.to]), [[c.name, offered[0]]]);
  const trip = P.record();

  // An overlay the engine cannot build, made before the trip: the athlete is told once, and the trip still applies.
  const withBroken = JSON.parse(P.dump()['ia_programs']!);
  const tripOnly = JSON.stringify(withBroken[0].overlays);
  withBroken[0].overlays.unshift({ id: 'ov_broken', type: 'injury', from: '2026-09-01', to: '2026-09-04', patch: { restDays: 7 }, note: '', created: 1 });
  P.damage('ia_programs', JSON.stringify(withBroken));
  P.launch(at(START, 2));
  assert.deepStrictEqual(P.toasts.filter((t) => /failed to apply/.test(t)), ['A plan change failed to apply. Flag it in Bugs.']);
  assert.deepStrictEqual(stamps(), onTrip, 'the trip still stands beside the overlay that failed');
  const broken = P.record();

  // The same program stored with no length, the broken overlay gone: the trip is read against the rebuilt length.
  const noLength = JSON.parse(P.dump()['ia_programs']!);
  noLength[0].overlays = JSON.parse(tripOnly);
  delete noLength[0].totalWeeks;
  P.damage('ia_programs', JSON.stringify(noLength));
  P.launch(at(START, 3));
  assert.deepStrictEqual(P.toasts.filter((t) => /failed to apply/.test(t)), []);
  assert.deepStrictEqual(stamps(), onTrip, 'a program with no stored length still takes its trip');
  trainDay(P, 1, 'thu', 1);
  assert.equal(parsed(P, 'ia_hist_' + id).w1_thu._ovKey, TRIP);
  golden['a mini gym trip, a swap on a trip day, an overlay that fails, and no stored length'] = { offered, trip, broken, noLength: P.record() };
});

// ── The launch itself: refreshProgram and the freeze (found by the measure before v0.262.2) ──────────────────────────
// tests/measure/stored-state_freeze-gaps.md: of 90 breaks inside the rules a launch applies, the records above let 59
// through, for three reasons they all share. A history's stored grid is the same engine's build of the same config as
// the launch that reads it, so a rule that picks between the stored day and the rebuilt one picks between two equal
// days. Every touch snapshots its day, so a touched day comes back from its snapshot and nothing is laid back on it.
// And no history holds an older program or a dated pace test. The cases below are the histories that were missing.
type Wd = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
const WD: Wd[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const MINI = '["substitute",{"equipment":"home_basic"}]';   // the stamp of a trip to a mini gym
/** A value the page made, as a value of this file's own (the page runs in its own realm, and deepStrictEqual tells the two apart). */
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const itemsOf = (day: any): any[] => (day?.sections || []).flatMap((s: any) => s.items || []);
const namesOf = (day: any): string[] => itemsOf(day).map((i) => i.name);
/** What the swap sheet offers for a lift on a day of week `w`. */
const offeredFor = (P: Phone, w: number, d: Wd, n: string): string[] => {
  P.IA.ctx['__n'] = n;
  return P.ev(`(function(){var r=swapCandidates(__n,activeProg.weeks[${w}].${d},${w},activeProg);return [].concat(r.tier1||[],r.tier2||[]).map(function(x){return x.name||x;});})()`);
};
/** The swap sheet's tap: the lift named `n` on the open day traded for `t`. */
const swapOn = (P: Phone, w: number, d: Wd, n: string, t: string): void => {
  let c: unknown = null;
  (P.day(w, d).sections || []).forEach((s: any, si: number) => (s.items || []).forEach((it: any, ii: number) => {
    if (!c && it && it.name === n) c = { secIdx: si, itemIdx: ii, name: n, detail: it.detail };
  }));
  P.IA.ctx['__c'] = c;
  P.ev(`_swapCtx=__c;applySwapChoice(${JSON.stringify(t)});`);
  P.settle();
};
/** The program in hand beside its grid: what a launch carries over from the stored one, or derives. */
const inHand = (P: Phone): Record<string, unknown> | null => {
  const p = P.prog;
  return p ? {
    id: p.id, name: p.name, created: p.created, seed: p.seed ?? null, startDate: p.startDate ?? null, blockOpen: p.blockOpen ?? null,
    totalWeeks: p.totalWeeks, weeks: Object.keys(p.weeks || {}).length, overlays: Array.isArray(p.overlays) ? p.overlays.length : null,
    testWeek: p.cfg ? p.cfg._testWeek ?? null : null, cappedWeeks: p.cfg ? p.cfg._raceDateCappedWeeks ?? null : null,
    paceShift: p.cfg ? p.cfg._paceShift ?? null : null,
  } : null;
};
/** The stored program list, parsed. */
const stored = (P: Phone): any[] => JSON.parse(P.dump()['ia_programs']!);
/** Each day of a week as the launch left it: a trip's day, a day of the athlete's own gym, or rest. */
const forms = (P: Phone, w: number): string[] => WD.map((d) => { const x = P.day(w, d); return !x ? 'none' : x.rest ? 'rest' : x._ovKey === MINI ? 'trip' : 'gym'; });

test('swaps, edits and a moved session on days not yet trained are laid back at each launch, and a trained day comes back from its snapshot with nothing laid on it', () => {
  // Week 1 of HALF_MANNY, and nothing logged until Saturday: Monday edited, Tuesday's session moved onto Wednesday's
  // rest and swapped there, an injury flagged on Thursday and a lift swapped under it.
  const P = new Phone().launch(CREATED);
  const id = P.generate(HALF);
  const day = (d: Wd): any => P.day(1, d);

  // Monday morning: the second card traded twice in a row (a chain), the lift traded in skipped, the other round
  // skipped whole, a movement added.
  P.launch(at(START, 0, '07:00'));
  P.open(1, 'mon');
  const A = cards(day('mon'))[1]!.name;
  const B = offeredFor(P, 1, 'mon', A)[0]!;
  swapOn(P, 1, 'mon', A, B);
  const C = offeredFor(P, 1, 'mon', B).find((n) => n !== A)!;
  swapOn(P, 1, 'mon', B, C);
  assert.equal(new Set([A, B, C]).size, 3, 'three different lifts');
  P.ev(`skipExercise(${JSON.stringify(C)});`);
  const rounds = (day('mon').sections as any[]).map((s, i) => (s.superset ? i : -1)).filter((i) => i >= 0);
  assert.equal(rounds.length, 2, 'Monday holds two rounds');
  const other = rounds.find((i) => !(day('mon').sections[i].items as any[]).some((it) => it.name === C))!;
  P.ev(`skipSuperset(${other});`);
  const add: string = P.ev("(function(){var c=addCandidates(activeProg.weeks[1].mon,1,activeProg);return (c.more||[])[0]||(c.gap||[])[0]||null;})()");
  P.ev(`applyAddChoice(${JSON.stringify(add)});`);
  assert.deepStrictEqual(parsed(P, 'ia_swaps_' + id).w1_mon.map((r: any) => [r.from, r.to]), [[A, B], [B, C]], 'two records, in the order made');
  const edits = parsed(P, 'ia_edits_' + id).w1_mon;
  assert.deepStrictEqual([edits.skip, edits.add.map((a: any) => a.name)], [[C, '__ss:' + other], [add]]);
  assert.deepStrictEqual([parsed(P, 'ia_hist_' + id), parsed(P, 'ia_comp_' + id), parsed(P, 'ia_logs_' + id)], [null, null, null], 'an edit is not a touch: nothing is snapshotted, logged or marked');
  const monday = (): unknown[] => plain([
    namesOf(day('mon')).filter((n) => n === C).length, namesOf(day('mon')).includes(A), namesOf(day('mon')).includes(B),
    itemsOf(day('mon')).some((i) => i.name === C && i._skipped === true), day('mon').sections[other]._skipped === true,
    (day('mon').sections as any[]).filter((s) => s._added).map((s) => (s.items as any[]).map((i) => [i.name, i._addedByUser])),
  ]);
  const asLeft = [1, false, false, true, true, [[[add, true]]]];
  assert.deepStrictEqual(monday(), asLeft);

  // Wednesday: the launch lays Monday's swaps on the rebuilt day in the order made, then its edits. The week is not
  // touched, so it is not below the cut and its edits are kept. Then Tuesday's session is moved onto today's rest, and
  // its first card swapped there.
  P.launch(at(START, 2, '10:00'));
  assert.deepStrictEqual(monday(), asLeft, 'Monday in hand is the card the athlete left: the chain\'s last lift once, skipped, the round off, the add on');
  assert.deepStrictEqual(Object.keys(parsed(P, 'ia_edits_' + id)), ['w1_mon'], 'the edits of an untouched week are kept');
  const edited = P.record();
  P.ev("openRestSheet(1,'wed','move');_rdSet('pick','tue');applyRestMove();");
  P.settle();
  P.open(1, 'wed');
  const W0 = cards(day('wed'))[0]!.name;
  const W = offeredFor(P, 1, 'wed', W0)[0]!;
  swapOn(P, 1, 'wed', W0, W);
  assert.deepStrictEqual(Object.keys(parsed(P, 'ia_swaps_' + id)), ['w1_mon', 'w1_wed'], 'the swap is recorded under the day the session now stands on');

  // Thursday: the move is laid first, so the swap finds its session on Wednesday. Then a knee flagged from today, and
  // a lift of today's injured session swapped.
  P.launch(at(START, 3, '07:00'));
  assert.deepStrictEqual([day('tue').rest, day('tue').movedTo, day('wed').movedFrom, namesOf(day('wed')).includes(W), namesOf(day('wed')).includes(W0)],
    [true, 'wed', 'tue', true, false], 'Tuesday rests, Wednesday holds its session with the lift traded in');
  const moved = P.record();
  P.ev("_ovDraft.injRegion='knee';_ovDraft.injTier='workaround';_ovDraft.from='2026-09-03';applyInjuryDraft();");
  const KNEE = '["injury",{"injury":{"region":"knee","tier":"workaround"}}]';
  assert.deepStrictEqual(WD.map((d) => day(d)._ovKey || null), [null, null, null, KNEE, KNEE, KNEE, null], 'Thursday, Friday and Saturday are the injured build\'s days');
  P.open(1, 'thu');
  const T0 = cards(day('thu'))[0]!.name;
  const T = offeredFor(P, 1, 'thu', T0)[0]!;
  swapOn(P, 1, 'thu', T0, T);

  // Friday: the swap is laid on the rebuilt injured day, and the day goes through the injury's filter again, the plan
  // read off the day's own stamp. The lift traded in carries the dose it had before the filter.
  P.launch(at(START, 4, '07:00'));
  const traded = itemsOf(day('thu')).filter((i) => i.name === T);
  assert.deepStrictEqual([traded.length, typeof traded[0]._preHold, namesOf(day('thu')).includes(T0)], [1, 'string', false]);
  const injured = P.record();

  // Saturday: Monday's first lift logged, the day's first touch, so the day is snapshotted as it stands. Then the lift
  // first traded off is added back from the add sheet.
  P.launch(at(START, 5, '09:00'));
  P.open(1, 'mon');
  const first = cards(day('mon'))[0]!;
  P.logLift(first.name, first.detail, [first.reps, first.reps], [135, 140]);
  const adds: string[] = P.ev("(function(){var c=addCandidates(activeProg.weeks[1].mon,1,activeProg);return [].concat(c.gap||[],c.more||[],c.off||[]);})()");
  assert.ok(adds.includes(A), 'the add sheet offers the lift traded off');
  P.ev(`applyAddChoice(${JSON.stringify(A)});`);
  const snap = JSON.stringify(parsed(P, 'ia_hist_' + id).w1_mon);

  // Sunday: Monday comes back from its snapshot and its swaps are not laid on it again (they would trade the lift
  // just added back). The week is touched now, so it is below the cut and its edits are dropped from the store.
  P.launch(at(START, 6, '08:00'));
  assert.equal(JSON.stringify(day('mon')), snap, 'Monday in hand is its snapshot, to the byte');
  assert.deepStrictEqual([namesOf(day('mon')).filter((n) => n === A).length, namesOf(day('mon')).filter((n) => n === C).length], [1, 1]);
  assert.deepStrictEqual(parsed(P, 'ia_edits_' + id), {}, 'a touched week gives up its edits');
  assert.deepStrictEqual(Object.keys(parsed(P, 'ia_swaps_' + id)), ['w1_mon', 'w1_wed', 'w1_thu'], 'the swaps stay, for undo');
  golden['swaps, edits and a move laid back at launch'] = { chain: [A, B, C], edited, moved, injured, restored: P.record() };
});

test('days proved by one store each, a trip booked over them, a Monday launch and a launch after the last week: which form each day takes', () => {
  // Week 1 of HALF_MANNY trained Monday, Tuesday, Thursday and Friday, and next Monday trained early. Then, as older
  // data holds them, each day is left one proof: Monday its completion, Tuesday its log, Thursday its logged lifts,
  // Friday its snapshot, next Monday its snapshot. A trip to a mini gym is then booked over all of them (Monday 31
  // August to Monday 7 September), so the rebuilt day and the stored day differ on every training day.
  const P = new Phone().launch(CREATED);
  const id = P.generate(HALF);
  (['mon', 'tue', 'thu', 'fri'] as Wd[]).forEach((d, i) => { P.launch(at(START, WD.indexOf(d))); trainDay(P, 1, d, i); });
  P.launch(at(START, 4, '20:00'));
  trainDay(P, 2, 'mon', 4);
  const keep = (key: string, days: string[]): void => {
    const v = parsed(P, key + id);
    Object.keys(v).forEach((k) => { if (!days.includes(k)) delete v[k]; });
    P.damage(key + id, JSON.stringify(v));
  };
  keep('ia_comp_', ['w1_mon']); keep('ia_logs_', ['w1_tue']); keep('ia_hist_', ['w1_fri', 'w2_mon']);
  const exw = parsed(P, 'ia_exw_' + id);
  Object.keys(exw).forEach((k) => { exw[k].entries = exw[k].entries.filter((e: any) => e.week === 1 && e.day === 'thu'); if (!exw[k].entries.length) delete exw[k]; });
  assert.equal(Object.keys(exw).length, 2, 'Thursday\'s two logged lifts');
  P.damage('ia_exw_' + id, JSON.stringify(exw));

  // Saturday of week 1. Every proved day keeps its own gym's form; Saturday, untouched in the current week, takes the
  // trip. A trip is not an injury: it never rewrites a touched day. Next Monday is held by its snapshot alone: the
  // furthest touched week is frozen though the calendar is a week behind it.
  P.launch(at(START, 5, '08:00'));
  P.ev("_ovDraft.equipment='home_basic';_ovDraft.from='2026-08-31';_ovDraft.to='2026-09-07';applyOverlayDraft();");
  P.settle();
  const SAT = [['gym', 'gym', 'rest', 'gym', 'gym', 'trip', 'rest'], ['gym', 'gym', 'rest', 'gym', 'gym', 'gym', 'rest']];
  assert.deepStrictEqual([forms(P, 1), forms(P, 2)], SAT);
  const booked = P.record();
  P.launch(at(START, 6, '08:00'));
  assert.deepStrictEqual([forms(P, 1), forms(P, 2)], SAT, 'the next launch reads the same');
  const sunday = P.record();

  // Monday of week 2 (2026-09-07): week 1 is behind now, a dead record, and its untouched Saturday goes back to the
  // stored form. A trip wholly after the last week (the race is 6 December) is refused and nothing is stored.
  P.launch(at(START, 7, '08:00'));
  assert.equal(P.record().live!.week, 2, '2026-09-07 is the second Monday from 2026-08-31');
  assert.deepStrictEqual([forms(P, 1), forms(P, 2)], [['gym', 'gym', 'rest', 'gym', 'gym', 'gym', 'rest'], ['gym', 'gym', 'rest', 'gym', 'gym', 'gym', 'rest']]);
  P.ev("_ovDraft.equipment='home_basic';_ovDraft.from='2026-12-08';_ovDraft.to='2026-12-10';applyOverlayDraft();");
  assert.deepStrictEqual(P.toasts.filter((t) => /outside/.test(t)), ['That range is outside your program']);
  assert.equal(stored(P)[0].overlays.length, 1, 'only the first trip is stored');
  const monday = P.record();

  // Another phone, race week (week 14, Monday 30 November): Monday trained, a trip Tuesday to Thursday. Ten days after
  // the race the program holds on its last week, which is still the current one: its untouched days take the trip.
  const Q = new Phone().launch(CREATED);
  Q.generate(HALF);
  Q.launch('2026-11-30T07:00:00');
  trainDay(Q, 14, 'mon', 0);
  Q.ev("_ovDraft.equipment='home_basic';_ovDraft.from='2026-12-01';_ovDraft.to='2026-12-03';applyOverlayDraft();");
  Q.settle();
  Q.launch('2026-12-16T09:00:00');
  assert.equal(Q.record().live!.week, 14);
  assert.deepStrictEqual(forms(Q, 14), ['gym', 'trip', 'rest', 'trip', 'rest', 'gym', 'gym'], 'Tuesday and Thursday are the trip\'s, Friday rests, the shakeout and the race are outside the trip');
  golden['days proved by one store each, and a trip booked over them'] = { booked, sunday, monday, afterTheRace: Q.record() };
});

test('an older program with a dated pace test and no pinned week: the launch pins it once, a past test, a test past week 26 and an event switched off pin nothing, and a pinned week stands', () => {
  // The 1.5 mile goal, made on Saturday 29 August with no date (11 weeks), then given a test date by hand as a
  // release before the pin stored it: the date and the event in the config, no _testWeek and no capped length.
  // Typed from the calendar: the first Monday is 24 August, the test (Saturday 10 October) is in the week of 5 October,
  // 42 days on, the seventh week.
  const older = (raceDate: string, on = true, pin?: number): Phone => {
    const P = new Phone().launch(CREATED);
    P.generate(PACE);
    const progs = stored(P);
    assert.deepStrictEqual([progs[0].totalWeeks, progs[0].startDate, progs[0].cfg._testWeek], [11, '2026-08-29', null]);
    progs[0].cfg.raceDate = raceDate; progs[0].cfg.eventTargeted = on;
    delete progs[0].cfg._testWeek; delete progs[0].cfg._raceDateCappedWeeks;
    if (pin) { progs[0].cfg._testWeek = pin; progs[0].cfg._raceDateCappedWeeks = pin; }
    P.damage('ia_programs', JSON.stringify(progs));
    return P;
  };
  const pinOf = (P: Phone): unknown[] => { const c = stored(P)[0].cfg; return ['_testWeek' in c, c._testWeek, '_raceDateCappedWeeks' in c, c._raceDateCappedWeeks]; };

  // The launch on Monday 31 August pins week 7 and stores it; the program in hand is the seven week build, and the
  // stored program keeps the length it was made with.
  const P = older('2026-10-10');
  P.launch('2026-08-31T07:00:00');
  assert.deepStrictEqual(pinOf(P), [true, 7, true, 7]);
  assert.deepStrictEqual([P.prog.totalWeeks, stored(P)[0].totalWeeks], [7, 11]);
  const pinned = { record: P.record(), inHand: inHand(P) };
  const bytes = P.dump()['ia_programs'];
  P.launch('2026-09-01T07:00:00');
  assert.equal(P.dump()['ia_programs'], bytes, 'the pin is written once');
  // Monday 19 October, the ninth week by the calendar: the current week is read against the stored length (11), not
  // the rebuilt one (7), so weeks 7 and 8 are behind and keep their stored days.
  P.launch('2026-10-19T07:00:00');
  assert.equal(P.record().live!.week, 7, 'the screen holds on the last week of the seven');
  const later = { record: P.record(), inHand: inHand(P) };

  // First opened on Monday 12 October, two days after the test: nothing is pinned and nothing is written.
  const past = older('2026-10-10');
  const before = past.dump()['ia_programs'];
  past.launch('2026-10-12T07:00:00');
  assert.deepStrictEqual([pinOf(past), past.dump()['ia_programs'] === before], [[false, undefined, false, undefined], true]);

  // A test on Saturday 10 April 2027 is past week 26 (which begins Monday 15 February): nothing is pinned.
  const far = older('2027-04-10');
  far.launch('2026-08-31T07:00:00');
  assert.deepStrictEqual(pinOf(far), [false, undefined, false, undefined]);

  // The same date with the event switched off: nothing is pinned.
  const off = older('2026-10-10', false);
  off.launch('2026-08-31T07:00:00');
  assert.deepStrictEqual(pinOf(off), [false, undefined, false, undefined]);

  // A program already pinned, to week 6 where its dates say 7: the launch leaves a pinned week alone.
  const held = older('2026-10-10', true, 6);
  held.launch('2026-08-31T07:00:00');
  assert.deepStrictEqual(pinOf(held), [true, 6, true, 6]);

  golden['an older program with a dated pace test'] = {
    pinned, later, past: { record: past.record(), inHand: inHand(past) }, far: { record: far.record(), inHand: inHand(far) },
    off: { record: off.record(), inHand: inHand(off) }, held: { record: held.record(), inHand: inHand(held) },
  };
});

test('older and damaged programs, by hand: no config, no seed anywhere, a seed missing from the second program, no start date, old moves, a stored week missing days, a config the engine cannot build, and a renamed program', () => {
  const recs: Record<string, unknown> = {};
  const sameAsStored = (P: Phone): boolean => { const r = P.record(); return r.live!.digest === r.programs.find((p) => p.id === P.prog.id)!.digest; };
  const edit = (P: Phone, fn: (progs: any[]) => void): void => { const progs = stored(P); fn(progs); P.damage('ia_programs', JSON.stringify(progs)); };

  // No config (damage): the program is handed back as stored, and the launch goes on.
  { const { P } = oneDayIn();
    edit(P, (g) => { delete g[0].cfg; });
    P.launch(at(START, 1));
    assert.deepStrictEqual(['cfg' in P.prog, sameAsStored(P)], [false, true]);
    recs['no config'] = { record: P.record(), inHand: inHand(P) }; }

  // No seed on the program or in its config (a program from before seeds were kept): never rebuilt, never written.
  { const { P } = oneDayIn();
    edit(P, (g) => { delete g[0].seed; delete g[0].cfg.seed; });
    const bytes = P.dump()['ia_programs'];
    P.launch(at(START, 1));
    assert.deepStrictEqual([P.dump()['ia_programs'] === bytes, sameAsStored(P), P.prog.seed], [true, true, undefined]);
    recs['no seed anywhere'] = { record: P.record(), inHand: inHand(P) }; }

  // Two programs, the second (the active one) with no seed in its config: the seed is written to that program's
  // config, and the first program's is left alone. HALF_MANNY's seed is 76308, the 1.5 mile program's 24865.
  { const { P } = oneDayIn();
    P.launch(at(START, 1, '07:00'));
    P.generate(PACE);
    edit(P, (g) => { assert.deepStrictEqual([g[0].cfg.seed, g[1].seed], [76308, 24865]); delete g[1].cfg.seed; });
    P.launch(at(START, 2));
    assert.deepStrictEqual(stored(P).map((g) => g.cfg.seed), [76308, 24865]);
    recs['a seed missing from the second program'] = { record: P.record(), inHand: inHand(P) }; }

  // No seed on the program itself, its config's kept: the program in hand carries none, as stored.
  { const { P } = oneDayIn();
    edit(P, (g) => { delete g[0].seed; });
    P.launch(at(START, 1));
    assert.deepStrictEqual([inHand(P)!['seed'], P.prog.cfg.seed], [null, 76308]);
    recs['no seed on the program'] = { record: P.record(), inHand: inHand(P) }; }

  // No start date (a program from before start dates). Tuesday trained, a day with a paced run; then the mile time
  // changed (10:30 to 9:30), so every paced run still ahead reads another pace. With no clock the freeze goes by what
  // was touched alone: Tuesday comes back from its snapshot at the old pace, Friday is rebuilt at the new one.
  { const P = new Phone().launch(CREATED);
    const id = P.generate(HALF);
    P.launch(at(START, 1));
    trainDay(P, 1, 'tue', 0);
    P.launch(at(START, 2, '07:00'));
    const friBefore = JSON.stringify(P.day(1, 'fri'));
    P.ev(`openMileSheet(${JSON.stringify(id)});`);
    P.type('mileSheetMins', '9'); P.type('mileSheetSecs', '30');
    P.ev('commitMileChange();');
    P.clearFields();
    assert.deepStrictEqual([stored(P)[0].cfg.cardioGoals.run.mileBestMins, stored(P)[0].cfg.cardioGoals.run.mileBestSecs], ['9', '30']);
    edit(P, (g) => { delete g[0].startDate; delete g[0].blockOpen; });
    P.launch(at(START, 3));
    const tue = JSON.stringify(P.day(1, 'tue'));
    assert.equal(tue, JSON.stringify(parsed(P, 'ia_hist_' + id).w1_tue), 'the trained day is its snapshot');
    assert.notEqual(JSON.stringify(P.day(1, 'fri')), friBefore, 'the day not yet trained reads the new mile');
    assert.notEqual(tue, JSON.stringify(P.ev(`buildProgram(getPrograms()[0].cfg).weeks[1].tue`)), 'and the snapshot is not what the engine builds today');
    recs['no start date, and the mile changed'] = { record: P.record(), inHand: inHand(P) }; }

  // Moves as older data holds them: one stored as a plain day name (Tuesday's session onto Wednesday, week 1), and
  // one whose source is a rest day (Wednesday onto Sunday, week 2), which moves nothing.
  { const P = new Phone().launch(CREATED);
    const id = P.generate(HALF);
    P.damage('ia_moves_' + id, JSON.stringify({ w1_wed: 'tue', w2_sun: { from: 'wed', ts: 1 } }));
    P.launch(at(START, 0));
    assert.deepStrictEqual([P.day(1, 'wed').movedFrom, P.day(1, 'tue').rest, P.day(1, 'tue').movedTo], ['tue', true, 'wed']);
    assert.deepStrictEqual([P.day(2, 'sun').rest, 'movedFrom' in P.day(2, 'sun'), 'moved' in P.day(2, 'wed')], [true, false, false]);
    recs['moves in their old form'] = P.record(); }

  // A stored grid with days missing (an older build stored no entry for some days). Week 1 and week 2 each trained on
  // Monday; the stored weeks then lose their Sundays, week 2 loses its Monday, and Monday's snapshot goes too. Opened
  // on Tuesday of week 2: the week behind keeps the days it was stored with; the current week takes the rebuild's
  // days as well, and its trained Monday, with no stored form and no snapshot, takes the rebuilt one.
  { const { P, id } = oneDayIn();
    P.launch(at(START, 7));
    trainDay(P, 2, 'mon', 1);
    edit(P, (g) => { delete g[0].weeks['1'].sun; delete g[0].weeks['2'].sun; delete g[0].weeks['2'].mon; });
    const hist = parsed(P, 'ia_hist_' + id); delete hist.w2_mon; P.damage('ia_hist_' + id, JSON.stringify(hist));
    P.launch(at(START, 8));
    assert.deepStrictEqual(Object.keys(P.prog.weeks[1]).sort(), ['fri', 'mon', 'sat', 'thu', 'tue', 'wed']);
    assert.deepStrictEqual(Object.keys(P.prog.weeks[2]).sort(), ['fri', 'mon', 'sat', 'sun', 'thu', 'tue', 'wed']);
    assert.deepStrictEqual([!!P.day(2, 'mon').rest, Array.isArray(P.day(2, 'mon').sections)], [false, true]);
    recs['a stored grid with days missing'] = { record: P.record(), week1: Object.keys(P.prog.weeks[1]), week2: Object.keys(P.prog.weeks[2]) }; }

  // A config the engine cannot build (damage: its sports are not a list), on the dated 1.5 mile program, whose test
  // week is pinned so the launch goes straight to the rebuild. The screens cannot draw such a program, so the page's
  // loader is called on its own, as Set Active calls it: the stored program is handed back as it is.
  { const P = new Phone().launch(CREATED);
    const id = P.generate({ ...PACE, raceDate: '2026-10-10', eventTargeted: true });
    edit(P, (g) => { assert.equal(g[0].cfg._testWeek, 7); g[0].cfg.cardioTypes = 7; });
    P.launch(at(START, 1), { init: false });
    assert.equal(P.ev(`loadActiveProgram(${JSON.stringify(id)})`), true);
    assert.deepStrictEqual([P.prog.cfg.cardioTypes, sameAsStored(P)], [7, true]);
    recs['a config the engine cannot build'] = { record: P.record(), inHand: inHand(P) }; }

  // Renamed, then opened the next day: the program in hand keeps its id, its new name, the instant it was made (the
  // Saturday morning, not the launch) and its start.
  { const { P, id } = oneDayIn();
    P.type('renameInput_' + id, 'Half, the long way');
    P.ev(`commitRename(${JSON.stringify(id)});`);
    P.clearFields();
    P.launch(at(START, 1));
    const h = inHand(P)!;
    assert.deepStrictEqual([h['id'], h['name'], h['created'], h['seed'], h['startDate']], [id, 'Half, the long way', new Date(2026, 7, 29, 9, 0, 0).getTime(), 76308, START]);
    recs['a renamed program'] = { record: P.record(), inHand: h }; }

  golden['older and damaged programs, by hand'] = recs;
});

test('the pace clock at launch: days hurt before the first Monday do not count, two injuries count a day once, a shoulder counts nothing, and a shift left in the stored config is cleared', () => {
  // The 1.5 mile goal, made Saturday 29 August: its first Monday is 24 August, eleven weeks.
  // A knee flagged from Monday 17 August (before the program) and an ankle from Friday 28 August, both still open on
  // Wednesday 2 September. Counted from 24 August and once a day: 7 days hurt before week 2, 10 before every later
  // week (the count stops at today), each a shift of one week.
  const P = new Phone().launch(CREATED);
  P.generate(PACE);
  P.launch('2026-08-29T10:00:00');
  P.ev("_ovDraft.injRegion='knee';_ovDraft.injTier='workaround';_ovDraft.from='2026-08-17';applyInjuryDraft();");
  P.launch('2026-08-29T11:00:00');
  P.ev("_ovDraft.injRegion='ankle';_ovDraft.injTier='workaround';_ovDraft.from='2026-08-28';applyInjuryDraft();");
  assert.equal(stored(P)[0].overlays.length, 2);
  P.launch('2026-09-02T08:00:00');
  assert.deepStrictEqual(plain(P.prog.cfg._paceShift), [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const twoInjuries = { record: P.record(), inHand: inHand(P) };

  // A shoulder, from the first Monday on: its plan leaves running alone, so the clock runs.
  const S = new Phone().launch(CREATED);
  S.generate(PACE);
  S.launch('2026-08-29T10:00:00');
  S.ev("_ovDraft.injRegion='shoulder';_ovDraft.injTier='workaround';_ovDraft.from='2026-08-24';applyInjuryDraft();");
  S.launch('2026-09-02T08:00:00');
  assert.deepStrictEqual([stored(S)[0].overlays.length, '_paceShift' in S.prog.cfg], [1, false]);
  const shoulder = { record: S.record(), inHand: inHand(S) };

  // A knee from the first Monday, then the start date set again (which stores the program in hand, its shift with
  // it), then the injury removed. The stored config still holds the shift; the next launch derives none and clears it.
  const R = new Phone().launch(CREATED);
  R.generate(PACE);
  R.launch('2026-08-29T10:00:00');
  R.ev("_ovDraft.injRegion='knee';_ovDraft.injTier='workaround';_ovDraft.from='2026-08-24';applyInjuryDraft();");
  R.ev("setProgStart('2026-08-29');");
  R.ev('removeOverlay(activeProg.overlays[0].id);');
  assert.deepStrictEqual([stored(R)[0].overlays.length, Array.isArray(stored(R)[0].cfg._paceShift)], [0, true], 'no injury is stored, and the config still holds the shift');
  R.launch('2026-08-30T08:00:00');
  assert.equal('_paceShift' in R.prog.cfg, false);
  golden['the pace clock at launch'] = { twoInjuries, shoulder, cleared: { record: R.record(), inHand: inHand(R) } };
});

afterAll(() => {
  // One file for the whole feature. A case that failed above left its entry out, and the comparison says so.
  matchSnapshot('stored-state', { zone: process.env['TZ'], created: CREATED, records: golden as Record<string, StateRecord> });
});
