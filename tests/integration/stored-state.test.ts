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

afterAll(() => {
  // One file for the whole feature. A case that failed above left its entry out, and the comparison says so.
  matchSnapshot('stored-state', { zone: process.env['TZ'], created: CREATED, records: golden as Record<string, StateRecord> });
});
