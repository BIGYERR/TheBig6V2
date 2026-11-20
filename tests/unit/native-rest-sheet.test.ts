// The Expo app's rest day sheet and the coach's mile nudge (MIGRATION.md phase 3, row 5, its second session), each
// rule by a hand table: where the sheet opens, what Move offers and warns of, the face and the record, every word of
// the two views, the three writes to this app's own store, the nudge's record and the pencil it opens, and the
// wiring of the screens. Every expected value here is typed by hand from today's code and rulings (D24 a day before
// the start, D219 and D225 what counts as logged, D223 and D226 the jog's own record, D228 the face, Logged ✓ and
// Clear, D229 the controls by sport, D231 the doors, D232 Already logged here, D274 the nudge); the two apps side by
// side are tests/integration/native-rest-sheet.test.ts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { type StateStore, memoryStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import type { NudgeOffer } from '../../frontends/native/src/mile-nudge/mile-nudge-model.ts';
import { NUDGE_DELAY_MS, afterLog, answer, update } from '../../frontends/native/src/mile-nudge/nudge-screen.ts';
import {
  type CardioView, type MoveView, REST_TOASTS, type RestDraft, type RestLogs, type RestProgram, cardioView, dayRegion, faceInput, moveView, openRest, pickSession,
  pickType, restDayEligible, restIsRec, restJogEligible, restMoveCandidates, restMoveCollisions, restNum, restSame, restSeed, restView, tapRpe, toCardio,
} from '../../frontends/native/src/rest-sheet/rest-sheet-model.ts';
import { applyRestCardio, applyRestMove, clearRestCardio, readRestMoves } from '../../frontends/native/src/rest-sheet/rest-writes.ts';

process.env['TZ'] = 'America/New_York';
const NATIVE = join(REPO, 'frontends/native/src');
const TODAY = join(REPO, 'frontends/app/src/app/screens');
const read = (f: string): string => readFileSync(join(NATIVE, f), 'utf8');
const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const J = JSON.stringify;

// A program that starts on Monday 2026-08-31: legs on Monday and Friday, push on Wednesday, the other four days rest.
const legs = (title: string) => ({ title, sections: [{ items: [{ name: 'Back squat' }, { name: 'Romanian deadlift' }, { name: 'Plank' }] }] });
const push = (title: string) => ({ title, sections: [{ items: [{ name: 'Barbell bench press' }, { name: 'Overhead press' }] }] });
const rest = () => ({ title: 'Rest', rest: true });
const week = () => ({ mon: legs('Lower A'), tue: rest(), wed: push('Upper'), thu: rest(), fri: legs('Lower B'), sat: rest(), sun: rest() });
const prog = (over: Record<string, unknown> = {}, cfg: Record<string, unknown> = {}): RestProgram => ({
  id: 'p1', startDate: '2026-08-31', totalWeeks: 6, cfg: { cardioTypes: ['run', 'bike'], ...cfg }, weeks: { 1: week(), 2: week() }, ...over,
} as unknown as RestProgram);
/** Thursday of the first week, 08:00. */
const THU = new Date(2026, 8, 3, 8, 0, 0);
const draft = (over: Partial<RestDraft> = {}): RestDraft => ({ w: 1, day: 'tue', view: 'cardio', pick: null, type: 'run', mins: '', dist: '', rpe: null, armed: false, ...over });
const stored = (s: StateStore, k: string): unknown => JSON.parse(s.get(k) || 'null');

describe('native rest sheet: the nudge\'s model is today\'s file', () => {
  test('mile-nudge-model.ts in frontends/native is frontends/app\'s, byte for byte', () => {
    const today = readFileSync(join(TODAY, 'mile-nudge', 'mile-nudge-model.ts'));
    assert.ok(today.length > 1000, 'today\'s file was read');
    assert.ok(today.equals(readFileSync(join(NATIVE, 'mile-nudge', 'mile-nudge-model.ts'))));
  });
  test('the wait before the sheet rises is today\'s 700 ms', () => {
    assert.equal(NUDGE_DELAY_MS, 700);
    assert.match(readFileSync(join(TODAY, 'mile-nudge', 'mile-nudge.ts'), 'utf8'), /export const NUDGE_DELAY_MS = 700;/);
  });
});

describe('native rest sheet: where the sheet opens', () => {
  test('a rest day opens once its date has come: Tuesday and today, not Saturday, not next week', () => {
    const p = prog();
    assert.deepEqual(['tue', 'thu', 'sat', 'sun'].map((d) => restJogEligible(p, {}, 1, d, THU)), [true, true, false, false]);
    assert.equal(restJogEligible(p, {}, 2, 'tue', THU), false);
    assert.equal(restJogEligible(p, {}, 1, 'thu', new Date(2026, 8, 2, 23, 59)), false, 'the evening before');
    assert.equal(restJogEligible(p, {}, 1, 'thu', new Date(2026, 8, 3, 0, 1)), true, 'a minute into the day');
  });
  test('a training day opens only once it holds a jog (D231 item 1)', () => {
    const p = prog();
    assert.equal(restJogEligible(p, {}, 1, 'mon', THU), false);
    assert.equal(restJogEligible(p, { w1_mon: { restLog: { walk: { mins: 20 } } } }, 1, 'mon', THU), true);
    assert.equal(restJogEligible(p, { w1_mon: { rpe: 7 } }, 1, 'mon', THU), false, 'a session\'s own log is no jog');
    assert.equal(restJogEligible(p, { w1_mon: { restLog: {} } }, 1, 'mon', THU), false, 'an empty restLog is none');
    assert.equal(restJogEligible(p, { w1_mon: { restLog: { run: {} } } }, 1, 'mon', THU), true, 'a sport\'s key is enough, as today\'s reads it');
    assert.equal(restJogEligible(p, { w1_fri: { restLog: { walk: { mins: 20 } } } }, 1, 'fri', THU), false, 'not before its date, jog or none');
  });
  test('never with no start date, on a day before the start (D24), on a day the week does not have, or on no program', () => {
    assert.equal(restJogEligible(prog({ startDate: null }), {}, 1, 'tue', THU), false);
    assert.equal(restJogEligible(prog({ startDate: '2026-09-02' }), {}, 1, 'tue', THU), false, 'Tuesday, the program starting Wednesday');
    assert.equal(restJogEligible(prog({ startDate: '2026-09-02' }), {}, 1, 'thu', THU), true);
    assert.equal(restJogEligible(prog(), {}, 1, 'xyz', THU), false);
    assert.equal(restJogEligible(prog(), {}, 9, 'tue', THU), false);
    assert.equal(restJogEligible(null, {}, 1, 'tue', THU), false);
  });
  test('a move may land on a rest day that has come, never on a training day or on a day a session moved away from', () => {
    const p = prog();
    (p.weeks![1] as Record<string, unknown>)['thu'] = { title: 'Upper', rest: true, moved: true };
    assert.deepEqual(['mon', 'tue', 'thu', 'sat'].map((d) => restDayEligible(p, 1, d, THU)), [false, true, false, false]);
    assert.deepEqual(['tue', 'thu', 'sat'].map((d) => restDayEligible(prog(), 1, d, THU)), [true, true, false], 'yesterday\'s and today\'s, not tomorrow\'s');
    assert.equal(restDayEligible(prog(), 2, 'tue', THU), false, 'not next week\'s');
    assert.equal(restDayEligible(prog({ startDate: '2026-09-02' }), 1, 'tue', THU), false);
    assert.equal(restDayEligible(prog({ startDate: null }), 1, 'tue', THU), false);
  });
  test('the door: refused with today\'s words, or the draft', () => {
    assert.deepEqual(openRest(null, {}, 1, 'tue', 'move', THU), { toast: 'No active program. Tap Set Active or build a new one.' });
    assert.deepEqual(openRest(prog(), {}, 1, 'sat', 'cardio', THU), { toast: 'That rest day has not come around yet' });
    assert.deepEqual(openRest(prog(), {}, 1, 'tue', 'move', THU), { draft: draft({ view: 'move' }) });
    assert.deepEqual(openRest(prog(), {}, 1, 'tue', 'cardio', THU), { draft: draft() });
  });
  test('a day that takes no move opens on Log cardio whatever was asked: a double day, a day a session left', () => {
    const logs: RestLogs = { w1_mon: { restLog: { bike: { mins: 40, dist: 10, rpe: 5 } } } };
    assert.deepEqual(openRest(prog(), logs, 1, 'mon', 'move', THU), { draft: draft({ day: 'mon', type: 'bike', mins: '40', dist: '10', rpe: 5 }) });
  });
  test('the sport selected: the first that holds a record, else the program\'s first, else run (D228 item 1)', () => {
    const open = (p: RestProgram, logs: RestLogs): string => (openRest(p, logs, 1, 'tue', 'cardio', THU) as { draft: RestDraft }).draft.type;
    assert.equal(open(prog(), {}), 'run');
    assert.equal(open(prog({}, { cardioTypes: ['swim'] }), {}), 'swim');
    assert.equal(open(prog({}, { cardioTypes: [] }), {}), 'run');
    assert.equal(open(prog({ cfg: null }), {}), 'run');
    assert.equal(open(prog(), { w1_tue: { restLog: { run: {}, walk: { mins: 30 } } } }), 'walk', 'an emptied record is no record');
    assert.equal(open(prog(), { w1_tue: { restLog: { bike: { dist: 10 }, run: { mins: 20 } } } }), 'bike', 'the first as stored, not as the program lists its sports');
  });
});

describe('native rest sheet: the face and the record', () => {
  test('a record is a sport holding a time or a distance', () => {
    assert.deepEqual([{ mins: 1 }, { dist: 0.5 }, { mins: '20' }, { rpe: 7 }, {}, { mins: 0, dist: 0 }, null, undefined].map((r) => restIsRec(r as never)), [true, true, true, false, false, false, false, false]);
  });
  test('the face is seeded from the record, never from a default: a walk shows no distance', () => {
    assert.deepEqual(restSeed(draft({ mins: '9', dist: '9', rpe: 9 }), {}), draft());
    assert.deepEqual(restSeed(draft(), { run: { mins: 25.5, dist: 2.5, rpe: 7 } }), draft({ mins: '25.5', dist: '2.5', rpe: 7 }));
    assert.deepEqual(restSeed(draft({ type: 'walk' }), { walk: { mins: 30, dist: 2 } }), draft({ type: 'walk', mins: '30' }));
    assert.deepEqual(restSeed(draft(), { run: { dist: 3, rpe: '' } }), draft({ dist: '3' }));
    assert.deepEqual(restSeed(draft(), { run: { mins: 20, rpe: 'x' } }), draft({ mins: '20' }));
  });
  test('a number on the face: what parses above zero, else zero', () => {
    assert.deepEqual(['25.50', '0', '', null, undefined, 'x', '-3', '800'].map(restNum), [25.5, 0, 0, 0, 0, 0, 0, 800]);
  });
  test('the face equals the record, every number compared as a number (D228 item 3)', () => {
    const r = { mins: 25.5, dist: 2.5, rpe: 7 };
    assert.equal(restSame(draft({ mins: '25.50', dist: '2.50', rpe: 7 }), r), true);
    assert.equal(restSame(draft({ mins: '25.50', dist: '2.50', rpe: null }), r), false, 'the effort deselected');
    assert.equal(restSame(draft({ mins: '26.00', dist: '2.50', rpe: 7 }), r), false);
    assert.equal(restSame(draft({ mins: '25.50', dist: '', rpe: 7 }), r), false);
    assert.equal(restSame(draft({ type: 'walk', mins: '30', dist: '9' }), { mins: 30 }), true, 'a walk compares no distance');
    assert.equal(restSame(draft({ mins: '20' }), { mins: 20, rpe: '' }), true, 'an effort stored empty is none');
  });
  test('the taps that write nothing: a row, Log cardio instead, a chip, an effort, a wheel', () => {
    assert.deepEqual(pickSession(draft({ view: 'move' }), 'fri'), draft({ view: 'move', pick: 'fri' }));
    assert.deepEqual(toCardio(draft({ view: 'move', pick: 'fri' })), draft({ pick: 'fri' }));
    assert.deepEqual(pickType(draft({ mins: '9', armed: true }), { walk: { mins: 30, rpe: 5 } }, 'walk'), draft({ type: 'walk', mins: '30', rpe: 5 }), 'a chip seeds the face again and disarms Clear');
    assert.deepEqual(pickType(draft({ mins: '9', dist: '2', rpe: 7 }), {}, 'bike'), draft({ type: 'bike' }), 'a roll that was not logged does not follow the chip');
    assert.equal(tapRpe(draft(), 7).rpe, 7);
    assert.equal(tapRpe(draft({ rpe: 7 }), 7).rpe, null, 'the one selected deselects (D228 item 4)');
    assert.equal(tapRpe(draft({ rpe: 7 }), 9).rpe, 9);
    assert.equal(tapRpe(draft({ rpe: 7, armed: true }), 5).armed, true, 'an effort tap leaves Clear armed');
    assert.deepEqual(faceInput(draft(), 'rest_mins', '25.50'), draft({ mins: '25.50' }));
    assert.deepEqual(faceInput(draft(), 'rest_dist', '2.50'), draft({ dist: '2.50' }));
    assert.deepEqual(faceInput(draft(), 'log_run_mins', '9'), draft());
  });
});

describe('native rest sheet: what Move offers', () => {
  test('every training day of the week with no mark and no log, Monday first, by its title', () => {
    assert.deepEqual(restMoveCandidates(prog(), {}, {}, 1), [{ day: 'mon', label: 'Monday', title: 'Lower A' }, { day: 'wed', label: 'Wednesday', title: 'Upper' }, { day: 'fri', label: 'Friday', title: 'Lower B' }]);
    const p = prog();
    delete (p.weeks![1]!['mon'] as Record<string, unknown>)['title'];
    assert.equal(restMoveCandidates(p, {}, {}, 1)[0]!.title, 'Training');
    assert.deepEqual(restMoveCandidates(prog(), {}, {}, 7), []);
    assert.deepEqual(restMoveCandidates(null, {}, {}, 1), []);
  });
  test('not a day marked done or skipped', () => {
    assert.deepEqual(restMoveCandidates(prog(), { w1_mon: { status: 'complete' }, w1_wed: { status: 'skipped' } }, {}, 1).map((c) => c.day), ['fri']);
  });
  test('not a day that holds a log: an effort, a note, a swap, parked numbers, or any field of any sport (D219, D225)', () => {
    for (const e of [{ rpe: 7 }, { notes: 'x' }, { swapTo: 'bike' }, { parked: { run: {} } }, { run_dist: '3' }, { run_mins: '30' }, { run_pace: '9:00' }, { run_reps: '4' }, { run_rep_time: '1:30' }, { bike_mins: '40' }, { swim_yards: '800' }]) {
      assert.deepEqual(restMoveCandidates(prog(), {}, { w1_mon: e }, 1).map((c) => c.day), ['wed', 'fri'], J(e));
    }
  });
  test('a day that holds only a jog, set drafts, or an empty entry is still offered', () => {
    for (const e of [{ restLog: { walk: { mins: 30 } } }, { sets: { a: 1 } }, { rpe: '', notes: '', swapTo: '', run_dist: '' }, { week: 1, ts: 5 }]) {
      assert.deepEqual(restMoveCandidates(prog(), {}, { w1_mon: e }, 1).map((c) => c.day), ['mon', 'wed', 'fri'], J(e));
    }
  });
  test('not a day a session moved onto, nor the rest day it left', () => {
    const p = prog();
    const wk = p.weeks![1] as Record<string, Record<string, unknown>>;
    wk['tue'] = { ...legs('Lower B'), movedFrom: 'fri' };
    wk['fri'] = { title: 'Lower B', rest: true, moved: true };
    assert.deepEqual(restMoveCandidates(p, {}, {}, 1).map((c) => c.day), ['mon', 'wed']);
  });
});

describe('native rest sheet: the spacing warning', () => {
  test('a day\'s region is the one two or more of its moves train; one stray move is no region day', () => {
    assert.equal(dayRegion(legs('x')), 'legs');
    assert.equal(dayRegion(push('x')), 'push');
    assert.equal(dayRegion({ sections: [{ items: [{ name: 'Back squat' }, { name: 'Plank' }] }] }), null);
    assert.equal(dayRegion({ rest: true, sections: [{ items: [{ name: 'Back squat' }, { name: 'Front squat' }] }] }), null);
    assert.equal(dayRegion({ title: 'x' }), null);
    assert.equal(dayRegion(null), null);
    assert.equal(dayRegion({ sections: [{ items: [{ name: 'Back squat' }, { name: 'Front squat' }, { name: 'Barbell bench press' }, { name: 'Overhead press' }, { name: 'Dumbbell bench press' }] }] }), 'push', 'the most trained');
    assert.equal(dayRegion({ sections: [{ items: [{ name: 'Back squat' }, { name: 'Barbell bench press' }] }, { items: [{ name: 'Overhead press' }, { name: 'Front squat' }, null, {}] }] }), 'legs', 'a tie goes to the region met first, across sections');
    assert.equal(dayRegion({ sections: [{ items: [{ name: 'Barbell bench press' }, { name: 'Back squat' }, { name: 'Front squat' }, { name: 'Overhead press' }] }, {}] }), 'push');
  });
  test('the neighbours of the day moved onto that train the session\'s region: one, both, none', () => {
    const p = prog();
    assert.deepEqual(restMoveCollisions(p, 1, 'tue', p.weeks![1]!['fri']), [{ day: 'mon', label: 'Monday', title: 'Lower A' }], 'legs onto Tuesday, beside Monday\'s legs');
    assert.deepEqual(restMoveCollisions(p, 1, 'thu', p.weeks![1]!['mon']), [{ day: 'fri', label: 'Friday', title: 'Lower B' }]);
    assert.deepEqual(restMoveCollisions(p, 1, 'tue', p.weeks![1]!['wed']).map((h) => h.day), ['wed'], 'the session\'s own day counts while it still stands there');
    assert.deepEqual(restMoveCollisions(p, 1, 'sat', p.weeks![1]!['wed']), [], 'push onto Saturday: Friday is legs, Sunday rest');
    assert.deepEqual(restMoveCollisions(p, 1, 'sun', p.weeks![1]!['mon']), [], 'Sunday has no day after it in the week, and Saturday rests');
    (p.weeks![1] as Record<string, unknown>)['wed'] = legs('Lower C');
    assert.deepEqual(restMoveCollisions(p, 1, 'tue', p.weeks![1]!['fri']).map((h) => h.day), ['mon', 'wed']);
    assert.deepEqual(restMoveCollisions(p, 1, 'xyz', p.weeks![1]!['fri']), []);
    assert.deepEqual(restMoveCollisions(p, 1, 'mon', p.weeks![1]!['fri']), [], 'Monday has no day before it in the week, and Tuesday rests');
    (p.weeks![1] as Record<string, unknown>)['tue'] = { sections: legs('x').sections };
    assert.deepEqual(restMoveCollisions(p, 1, 'mon', p.weeks![1]!['fri']), [{ day: 'tue', label: 'Tuesday', title: 'that session' }], 'a neighbour with no title');
    assert.deepEqual(restMoveCollisions(p, 1, 'tue', { title: 'Easy', sections: [{ items: [{ name: 'Plank' }] }] }), [], 'a session of no region stacks nothing');
    assert.deepEqual(restMoveCollisions(null, 1, 'tue', legs('x')), []);
  });
});

describe('native rest sheet: Move a session here, every word', () => {
  const view = (d: Partial<RestDraft>, logs: RestLogs = {}, comp: Record<string, unknown> = {}, p: RestProgram = prog()): MoveView => moveView(draft({ view: 'move', ...d }), p, comp, logs);
  test('the head names the day', () => {
    const v = view({});
    assert.equal(v.kicker, 'Tuesday · Training anyway');
    assert.equal(v.title, 'Move a session here');
    assert.equal(v.intro, 'Nothing gets added. Whatever you pick moves to Tuesday, and its old day becomes your rest.');
  });
  test('the rows: the label, each session with its day and "not logged", and no button until one is picked', () => {
    const v = view({});
    assert.equal(v.label, 'Not logged this week');
    assert.deepEqual(v.rows, [{ day: 'mon', title: 'Lower A', desc: 'Monday · not logged', sel: false }, { day: 'wed', title: 'Upper', desc: 'Wednesday · not logged', sel: false }, { day: 'fri', title: 'Lower B', desc: 'Friday · not logged', sel: false }]);
    assert.deepEqual([v.apply, v.warn, v.already, v.none], [null, null, null, null]);
  });
  test('a pick marks its row and draws Move it here', () => {
    const v = view({ day: 'sat', pick: 'wed' });
    assert.deepEqual(v.rows.map((r) => r.sel), [false, true, false]);
    assert.equal(v.apply, 'Move it here');
    assert.equal(v.warn, null, 'push onto Saturday stacks nothing');
  });
  test('the warning names the region and the neighbour, or both neighbours', () => {
    assert.deepEqual(view({ pick: 'fri' }).warn, { title: 'That’s legs on top of legs', sub: 'You have legs work on Monday too. Stack it here and something gives. Your call.' });
    const p = prog();
    (p.weeks![1] as Record<string, unknown>)['wed'] = legs('Lower C');
    assert.equal(view({ pick: 'fri' }, {}, {}, p).warn!.sub, 'You have legs work on Monday and Wednesday too. Stack it here and something gives. Your call.');
  });
  test('Already logged here (D232): each jog\'s line without "logged", then the sentence', () => {
    const v = view({}, { w1_tue: { restLog: { run: { mins: 25.5, dist: 2.5, rpe: 7 }, walk: { mins: 30 } } } });
    assert.deepEqual(v.already, { title: 'Already logged here', lines: ['26 min run · 2.5 mi · RPE 7', '30 min walk · RPE —'], tail: 'Move a session in and Tuesday is a double day. Your call.' });
  });
  test('nothing left to move: its words, Log cardio instead, and no row, no label, no Already logged here', () => {
    const v = view({}, { w1_tue: { restLog: { walk: { mins: 30 } } } }, { w1_mon: { status: 'complete' }, w1_wed: { status: 'complete' }, w1_fri: { status: 'skipped' } });
    assert.deepEqual(v.none, { title: 'Nothing left to move', sub: 'Every session this week is logged or done. Take the rest, or log some cardio instead.', button: 'Log cardio instead' });
    assert.deepEqual([v.rows, v.label, v.already, v.apply, v.warn], [[], '', null, null, null]);
  });
});

describe('native rest sheet: Log cardio, every word', () => {
  const view = (d: Partial<RestDraft>, logs: RestLogs = {}, p: RestProgram = prog()): CardioView => cardioView(draft(d), p, logs);
  test('with no record: What did you do?, and Log it with no Clear', () => {
    const v = view({});
    assert.equal(v.kicker, 'Tuesday · Log cardio');
    assert.equal(v.title, 'What did you do?');
    assert.equal(v.intro, 'Easy work on a rest day is recovery, not extra load. This will not touch your program.');
    assert.deepEqual([v.chipsLabel, v.timeLabel, v.effortLabel, v.log, v.clear, v.note], ['Modality', 'Time', 'How hard', 'Log it', null, null]);
  });
  test('with a record: Your <jog> on <day>, Logged ✓ while the face is the record, Clear this <jog>', () => {
    const logs: RestLogs = { w1_tue: { restLog: { bike: { mins: 40, dist: 10, rpe: 5 } } } };
    const v = view({ type: 'bike', mins: '40', dist: '10', rpe: 5 }, logs);
    assert.equal(v.title, 'Your ride on Tuesday');
    assert.equal(v.intro, 'This is what you logged. Roll it to fix it, or clear it if it did not happen.');
    assert.deepEqual([v.log, v.clear], ['Logged ✓', 'Clear this ride']);
    assert.equal(view({ type: 'bike', mins: '41.00', dist: '10', rpe: 5 }, logs).log, 'Log it');
    assert.equal(view({ type: 'bike', mins: '40', dist: '10', rpe: 5, armed: true }, logs).clear, 'Tap again to clear');
    assert.deepEqual(['run', 'swim', 'row', 'walk'].map((t) => view({ type: t }, { w1_tue: { restLog: { [t]: { mins: 9 } } } }).clear), ['Clear this run', 'Clear this swim', 'Clear this row', 'Clear this walk']);
  });
  test('the chips: the program\'s sports, a sport a record holds, then Walk; a check on each that holds a record', () => {
    assert.deepEqual(view({}).chips, [{ type: 'run', label: 'Run', sel: true }, { type: 'bike', label: 'Bike', sel: false }, { type: 'walk', label: 'Walk', sel: false }]);
    assert.deepEqual(view({ type: 'row' }, { w1_tue: { restLog: { row: { mins: 15, dist: 3000 }, bike: { dist: 10 }, swim: {} } } }).chips.map((c) => c.label + (c.sel ? '*' : '')), ['Run', 'Bike ✓', 'Row ✓*', 'Walk']);
    assert.deepEqual(view({}, {}, prog({}, { cardioTypes: ['walk', 'swim'] })).chips.map((c) => c.label), ['Walk', 'Swim'], 'a program that trains the walk keeps its own order');
    assert.deepEqual(view({}, {}, prog({ cfg: null })).chips.map((c) => c.label), ['Walk']);
    assert.deepEqual(view({}, { w1_tue: { restLog: { run: {}, bike: { rpe: 5 } } } }).chips.map((c) => c.label), ['Run', 'Bike', 'Walk'], 'an emptied record earns no check');
  });
  test('the controls by sport (D229 item 2): the time wheel on all; miles for run and bike; a box for row and swim; none for a walk', () => {
    const run = view({ mins: '25.50', dist: '2.50' });
    assert.deepEqual([run.time.kind, run.time.hiddenId, run.time.value], ['hms', 'rest_mins', '25.50']);
    assert.ok(run.dist && 'wheel' in run.dist);
    assert.deepEqual([run.dist.label, run.dist.wheel.kind, run.dist.wheel.hiddenId, run.dist.wheel.value], ['Distance', 'dist', 'rest_dist', '2.50']);
    const bike = view({ type: 'bike' });
    assert.ok(bike.dist && 'wheel' in bike.dist && bike.dist.label === 'Distance');
    assert.deepEqual(view({ type: 'row', dist: '3000' }).dist, { label: 'Distance (meters)', box: { value: '3000', placeholder: 'meters', step25: false } });
    assert.deepEqual(view({ type: 'swim' }).dist, { label: 'Distance (yards)', box: { value: '', placeholder: 'yards', step25: true } });
    assert.equal(view({ type: 'walk' }).dist, null);
  });
  test('the three efforts, the one selected, and Noted from RPE 9', () => {
    const v = view({ rpe: 7 });
    assert.deepEqual(v.efforts, [
      { v: 5, head: 'RPE 5', name: 'Easy', desc: 'Conversational, full sentences', sel: false },
      { v: 7, head: 'RPE 7', name: 'Steady', desc: 'Working, sentences getting short', sel: true },
      { v: 9, head: 'RPE 9+', name: 'Hard', desc: 'That’s a training day, not a rest day', sel: false },
    ]);
    assert.equal(v.note, null);
    assert.deepEqual(view({ rpe: 9 }).note, { title: 'Noted', sub: 'Hard effort is not a rest day, it is a training day. Logging it as it happened. Keep an eye on how tomorrow feels.' });
    assert.equal(view({ rpe: null }).efforts.some((e) => e.sel), false);
    // An effort a record holds that is none of the three rows: no row marked, and Noted from 9 up.
    assert.deepEqual([view({ rpe: 8 }).note, view({ rpe: 8 }).efforts.some((e) => e.sel)], [null, false]);
    assert.equal(view({ rpe: 10 }).note!.title, 'Noted');
    assert.deepEqual(view({ rpe: 5 }).efforts.map((e) => e.sel), [true, false, false]);
    assert.deepEqual(view({ rpe: 9 }).efforts.map((e) => e.sel), [false, false, true]);
  });
  test('the sheet draws the view its draft names', () => {
    assert.equal(restView(draft({ view: 'move' }), prog(), {}, {}).kind, 'move');
    assert.equal(restView(draft(), prog(), {}, {}).kind, 'cardio');
  });
  test('the six toasts are today\'s words', () => {
    assert.deepEqual(REST_TOASTS, {
      none: 'No active program. Tap Set Active or build a new one.', future: 'That rest day has not come around yet', pick: 'Pick a session',
      useClear: 'To remove it, use Clear.', emptyWalk: 'Nothing to log yet. Add a time.', empty: 'Nothing to log yet. Add a time or a distance.',
    });
  });
});

describe('native rest sheet: Move it here writes the move and the grid', () => {
  const phone = (p: RestProgram): StateStore => { const s = memoryStore(); s.set('ia_programs', J([{ id: 'other', weeks: {} }, { id: p.id, name: 'Block', weeks: { 1: 'the stored grid' } }])); return s; };
  test('with no row picked it says so and writes nothing', () => {
    const p = prog(), s = phone(p), before = s.get('ia_programs');
    assert.deepEqual(applyRestMove({ store: s, prog: p }, draft({ view: 'move' }), 5), { toast: 'Pick a session', closed: false });
    assert.deepEqual([s.get('ia_programs'), s.get('ia_moves_p1')], [before, null]);
  });
  test('the move is stored under the day moved onto, the grid in hand takes it, and that grid is stored on its program alone', () => {
    const p = prog(), s = phone(p);
    assert.deepEqual(applyRestMove({ store: s, prog: p }, draft({ view: 'move', pick: 'fri' }), 1757000000000), { toast: 'Moved. Friday is your rest now ✓', closed: true });
    assert.deepEqual(stored(s, 'ia_moves_p1'), { w1_tue: { from: 'fri', ts: 1757000000000 } });
    assert.deepEqual(p.weeks![1]!['tue'], { ...legs('Lower B'), movedFrom: 'fri' });
    assert.deepEqual(p.weeks![1]!['fri'], { title: 'Lower B', dot: 'rest', tags: ['rest'], rest: true, moved: true, movedTo: 'tue' });
    assert.deepEqual(p.weeks![2], week(), 'another week is left alone');
    assert.deepEqual(stored(s, 'ia_programs'), [{ id: 'other', weeks: {} }, { id: 'p1', name: 'Block', weeks: JSON.parse(J(p.weeks)) }]);
  });
  test('a second move joins the first, and a key that does not read starts afresh', () => {
    const p = prog(), s = phone(p);
    applyRestMove({ store: s, prog: p }, draft({ view: 'move', pick: 'fri' }), 1);
    applyRestMove({ store: s, prog: p }, draft({ view: 'move', day: 'thu', pick: 'mon' }), 2);
    assert.deepEqual(stored(s, 'ia_moves_p1'), { w1_tue: { from: 'fri', ts: 1 }, w1_thu: { from: 'mon', ts: 2 } });
    s.set('ia_moves_p1', '{broken');
    assert.deepEqual(readRestMoves(s, 'p1'), {});
    assert.deepEqual(readRestMoves(memoryStore(), 'p1'), {});
  });
  test('a program the store no longer lists still takes the move, and no program list is written', () => {
    const p = prog(), s = memoryStore();
    assert.equal(applyRestMove({ store: s, prog: p }, draft({ view: 'move', pick: 'wed' }), 1).closed, true);
    assert.deepEqual([s.keys().sort(), s.get('ia_programs')], [['ia_moves_p1'], null]);
  });
});

describe('native rest sheet: Log it writes the jog\'s own record', () => {
  const sess = (logs: unknown = null) => { const s = memoryStore(); if (logs) s.set('ia_logs_p1', J(logs)); return { store: s, prog: prog() }; };
  test('the time, the distance and the effort as numbers, the week and the stamp, and the toast leads with the minutes', () => {
    const s = sess();
    assert.deepEqual(applyRestCardio(s, draft({ mins: '25.50', dist: '2.50', rpe: 7 }), 99), { toast: '26 min run logged ✓', closed: true });
    assert.equal(s.store.get('ia_logs_p1'), '{"w1_tue":{"restLog":{"run":{"mins":25.5,"dist":2.5,"rpe":7}},"week":1,"ts":99}}');
  });
  test('only what the face holds: no effort unless a row is selected, no time at zero; a distance alone leads the toast', () => {
    const s = sess();
    assert.deepEqual(applyRestCardio(s, draft({ type: 'swim', dist: '800' }), 1), { toast: '800 yd swim logged ✓', closed: true });
    assert.deepEqual(stored(s.store, 'ia_logs_p1'), { w1_tue: { restLog: { swim: { dist: 800 } }, week: 1, ts: 1 } });
    assert.equal(applyRestCardio(sess(), draft({ type: 'row', dist: '3000' }), 1).toast, '3000 m row logged ✓');
    assert.equal(applyRestCardio(sess(), draft({ type: 'bike', dist: '10.00' }), 1).toast, '10 mi ride logged ✓');
  });
  test('a walk never stores a distance', () => {
    const s = sess();
    assert.equal(applyRestCardio(s, draft({ type: 'walk', mins: '30.00', dist: '2.00', rpe: 5 }), 1).toast, '30 min walk logged ✓');
    assert.deepEqual(stored(s.store, 'ia_logs_p1'), { w1_tue: { restLog: { walk: { mins: 30, rpe: 5 } }, week: 1, ts: 1 } });
  });
  test('an empty face writes nothing and says what to add; a record rolled to zero says to use Clear (D228 item 5)', () => {
    const s = sess();
    assert.deepEqual(applyRestCardio(s, draft({ rpe: 7 }), 1), { toast: 'Nothing to log yet. Add a time or a distance.', closed: false });
    assert.deepEqual(applyRestCardio(s, draft({ type: 'walk', dist: '2' }), 1), { toast: 'Nothing to log yet. Add a time.', closed: false });
    assert.equal(s.store.get('ia_logs_p1'), null);
    const h = sess({ w1_tue: { restLog: { run: { mins: 20 } }, week: 1, ts: 1 } }), before = h.store.get('ia_logs_p1');
    assert.deepEqual(applyRestCardio(h, draft(), 2), { toast: 'To remove it, use Clear.', closed: false });
    assert.equal(h.store.get('ia_logs_p1'), before);
  });
  test('Logged ✓ with the face unchanged closes the sheet and writes nothing, not even the stamp (D228 item 3)', () => {
    const h = sess({ w1_tue: { restLog: { run: { mins: 20, rpe: 5 } }, week: 1, ts: 1 } }), before = h.store.get('ia_logs_p1');
    assert.deepEqual(applyRestCardio(h, draft({ mins: '20', rpe: 5 }), 2), { toast: null, closed: true });
    assert.equal(h.store.get('ia_logs_p1'), before);
  });
  test('the face goes over its sport\'s record whole; another sport and the session\'s own log are kept as they were', () => {
    const h = sess({ w1_tue: { rpe: '6', notes: 'legs', sets: { a: 1 }, restLog: { run: { mins: 20, dist: 2, rpe: 5 }, walk: { mins: 30 } }, week: 1, ts: 1 }, w2_mon: { rpe: '7' } });
    applyRestCardio(h, draft({ mins: '22.00' }), 50);
    assert.deepEqual(stored(h.store, 'ia_logs_p1'), { w1_tue: { rpe: '6', notes: 'legs', sets: { a: 1 }, restLog: { run: { mins: 22 }, walk: { mins: 30 } }, week: 1, ts: 50 }, w2_mon: { rpe: '7' } });
  });
});

describe('native rest sheet: Clear, two taps (D228 item 6)', () => {
  const sess = (logs: unknown) => { const s = memoryStore(); s.set('ia_logs_p1', J(logs)); return { store: s, prog: prog() }; };
  test('the first tap arms it and writes nothing', () => {
    const h = sess({ w1_tue: { restLog: { run: { mins: 20 } }, week: 1, ts: 1 } }), before = h.store.get('ia_logs_p1');
    assert.deepEqual(clearRestCardio(h, draft()), { toast: null, closed: false, draft: draft({ armed: true }) });
    assert.equal(h.store.get('ia_logs_p1'), before);
  });
  test('the second removes the record; the day\'s entry goes when only its week and stamp are left', () => {
    const h = sess({ w1_tue: { restLog: { run: { mins: 20 } }, week: 1, ts: 1 }, w1_thu: { restLog: { walk: { mins: 9 } }, week: 1, ts: 2 } });
    assert.deepEqual(clearRestCardio(h, draft({ armed: true })), { toast: 'Run cleared', closed: true, draft: draft() });
    assert.equal(h.store.get('ia_logs_p1'), '{"w1_thu":{"restLog":{"walk":{"mins":9}},"week":1,"ts":2}}');
  });
  test('another jog stays, and so does anything a session logged', () => {
    let h = sess({ w1_tue: { restLog: { bike: { mins: 40 }, walk: { mins: 30 } }, week: 1, ts: 1 } });
    assert.equal(clearRestCardio(h, draft({ type: 'bike', armed: true })).toast, 'Ride cleared');
    assert.deepEqual(stored(h.store, 'ia_logs_p1'), { w1_tue: { restLog: { walk: { mins: 30 } }, week: 1, ts: 1 } });
    h = sess({ w1_tue: { rpe: '6', restLog: { walk: { mins: 30 } }, week: 1, ts: 1 } });
    assert.equal(clearRestCardio(h, draft({ type: 'walk', armed: true })).toast, 'Walk cleared');
    assert.deepEqual(stored(h.store, 'ia_logs_p1'), { w1_tue: { rpe: '6', week: 1, ts: 1 } });
  });
  test('with no record of that sport it writes nothing, and still closes with its words', () => {
    const h = sess({ w1_tue: { restLog: { walk: { mins: 30 } }, week: 1, ts: 1 } }), before = h.store.get('ia_logs_p1');
    let wrote = 0;
    const store: StateStore = { ...h.store, get: (k) => h.store.get(k), keys: () => h.store.keys(), remove: (k) => h.store.remove(k), set: (k, v) => { wrote++; h.store.set(k, v); } };
    assert.deepEqual(clearRestCardio({ store, prog: h.prog }, draft({ type: 'swim', armed: true })), { toast: 'Swim cleared', closed: true, draft: draft({ type: 'swim' }) });
    assert.deepEqual([h.store.get('ia_logs_p1'), wrote], [before, 0]);
  });
});

describe('native rest sheet: the nudge between the store and the screen', () => {
  const offer = { cards: [{ key: 'w1_tue', week: 1, day: 'tue', tgt: 600, pace: 750 }, { key: 'w1_thu', week: 1, day: 'thu', tgt: 600, pace: 750 }], implied: [570, 572], dir: 1, anchor: 480, offer: 600, lockWeek: 4 } as unknown as NudgeOffer;
  const RUN = { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_10k', mileBestMins: '8', mileBestSecs: '0' } } };
  const phone = (): StateStore => { const s = memoryStore(); s.set('ia_programs', J([{ id: 'p0' }, { id: 'p1', totalWeeks: 6, startDate: '2026-08-31', cfg: RUN }])); return s; };
  test('either answer leaves the two cards and the mile judged against on the program, and touches no other', () => {
    const s = phone();
    answer(s, { offer, progId: 'p1' });
    assert.deepEqual(stored(s, 'ia_programs'), [{ id: 'p0' }, { id: 'p1', totalWeeks: 6, startDate: '2026-08-31', cfg: RUN, mileNudge: { cards: ['w1_tue', 'w1_thu'], anchor: 480 } }]);
    assert.deepEqual(s.keys(), ['ia_programs']);
  });
  test('an answer on a program that is gone writes nothing', () => {
    const s = phone(), before = s.get('ia_programs');
    answer(s, { offer, progId: 'gone' });
    assert.equal(s.get('ia_programs'), before);
  });
  test('Update mile time opens the pencil on the offer, minutes and seconds, in place of the stored mile', () => {
    assert.deepEqual(update(phone(), { offer, progId: 'p1' }, THU), { kind: 'edit', progId: 'p1', mins: '10', secs: '00' });
    assert.deepEqual(update(phone(), { offer: { ...offer, offer: 575 }, progId: 'p1' }, THU), { kind: 'edit', progId: 'p1', mins: '9', secs: '35' });
  });
  test('in the program\'s last three weeks it opens the lock, as the pencil\'s own tap does, and on no program nothing', () => {
    assert.deepEqual(update(phone(), { offer, progId: 'p1' }, new Date(2026, 8, 22, 9)), { kind: 'lock', facts: [{ k: 'Week', v: '4 of 6' }] });
    assert.equal(update(phone(), { offer, progId: 'gone' }, THU), null);
  });
  test('the judge is silent with no program, no config, or no run to anchor', () => {
    const s = memoryStore();
    s.set('ia_programs', J([{ id: 'p1' }, { id: 'p2', cfg: { cardioTypes: [], cardioGoals: {} } }]));
    assert.equal(afterLog(s, 'gone', 1, 'tue', THU), null);
    assert.equal(afterLog(s, 'p1', 1, 'tue', THU), null);
    assert.equal(afterLog(s, 'p2', 1, 'tue', THU), null);
    assert.equal(afterLog(s, null, 1, 'tue', THU), null);
  });
});

describe('native rest sheet: the screens\' wiring', () => {
  const app = strip(read('App.tsx')), sheet = strip(read('rest-sheet/RestSheet.tsx')), weekScreen = strip(read('this-week/ThisWeek.tsx')), session = strip(read('day-detail/SessionSheet.tsx'));
  test('This Week\'s rest card: Training anyway? asks for Move, the log link for Log cardio', () => {
    assert.match(weekScreen, /testID="rest-anyway" accessibilityRole="button" onPress=\{\(\) => onRest\(d\.rest!\.week, d\.rest!\.key, 'move'\)\}/);
    assert.match(weekScreen, /testID="rest-log-link" accessibilityRole="button" onPress=\{\(\) => onRest\(d\.rest!\.week, d\.rest!\.key, 'cardio'\)\}/);
    assert.match(weekScreen, /\{d\.rest\.anyway && <Text testID="rest-anyway"/);
  });
  test('the session sheet\'s Edit cardio asks for Log cardio on its own day, and is drawn again once the sheet wrote', () => {
    assert.match(session, /testID="sheet-also-edit"[^\n]*onRest\(\{ prog: prog as unknown as RestProgram, week: open\.week, dayKey: open\.dayKey, view: 'cardio' \}, \(\) => redraw\(\)\)/);
  });
  test('the nudge is judged after every tap of the cardio card\'s Log, on that card', () => {
    assert.match(session, /const toast = logCardio\(session, formNow\.current, cardioNow\.current, Date\.now\(\)\);[\s\S]{0,260}onLogged\(open\.week, open\.dayKey\);/);
    assert.match(app, /onLogged=\{\(week, dayKey\) => logged\(sheet\.prog\.id, week, dayKey\)\}/);
    assert.match(app, /const offer = afterLog\(phoneStore, progId, week, dayKey, new Date\(\)\);\s*if \(!offer\) return;\s*pending\.current = offer;/);
  });
  test('it rises 700 ms after This Week shows with the session sheet going or gone, and a sheet opened in the wait starts the wait again', () => {
    assert.match(app, /const onWeek = tab === 'week' && \(!sheet \|\| going\);/);
    assert.match(app, /if \(!pending\.current \|\| !onWeek\) return;\s*const t = setTimeout\(\(\) => \{ const p = pending\.current; pending\.current = null; if \(p\) setNudge\(p\); \}, NUDGE_DELAY_MS\);\s*return \(\) => clearTimeout\(t\);\s*\}, \[waits, onWeek\]\);/);
    assert.match(session, /leaving\.current = true;\s*Keyboard\.dismiss\(\);\s*onGoing\(\);/);
    assert.match(app, /onSheet=\{\(s\) => \{ setGoing\(false\); setSheet\(s\); \}\}/);
  });
  test('either answer stores the record first; Update mile time then opens the pencil, whose save This Week holds', () => {
    assert.match(app, /setNudge\(null\);\s*if \(!n\) return;\s*answerNudge\(phoneStore, n\);\s*if \(open\) setMile\(nudgeMile\(phoneStore, n, new Date\(\)\)\);/);
    assert.match(app, /onUpdate=\{\(\) => answered\(true\)\} onKeep=\{\(\) => answered\(false\)\}/);
    assert.match(app, /<MileSheet [^\n]*open=\{mile\}[\s\S]{0,200}onDone=\{\(o\) => \{ if \(o\.prog\) setHeld\(o\.prog as unknown as DeckProgram\); if \(o\.toast\) say\(o\.toast\); \}\}/);
  });
  test('a door that is refused says its words and opens nothing; an open sheet is a sheet of its own', () => {
    assert.match(app, /const r = openRest\(ask\.prog, readDayLogs\(phoneStore, ask\.prog\.id\) as unknown as RestLogs, ask\.week, ask\.dayKey, ask\.view, new Date\(\)\);\s*if \('toast' in r\) \{ say\(r\.toast\); return; \}/);
    assert.match(app, /<RestSheet key=\{rest\.n\}/);
    assert.match(app, /onWrote=\{\(\) => \{ setWrites\(\(n\) => n \+ 1\); if \(rest\.wrote\) rest\.wrote\(\); \}\}/);
  });
  test('the layers are today\'s: the rest sheet and the pencil under the toast, the nudge over the toast and under the pop-ups', () => {
    const at = (text: string): number => { const i = app.indexOf(text); assert.ok(i > 0 && app.indexOf(text, i + 1) < 0, text + ' is in the app once'); return i; };
    const sheets = at('{sheet && ('), cover = at('{cover}'), rest = at('{rest && ('), mile = at('{mile && ('), toast = at('{toast && <Toast'), over = at('{over}'), nudge = at('{nudge && <MileNudge'), pop = at('{pop && <PopUp');
    assert.deepEqual([sheets, cover, rest, mile, toast, over, nudge, pop], [sheets, cover, rest, mile, toast, over, nudge, pop].slice().sort((a, b) => a - b));
  });
  test('a tap that closes the sheet runs in today\'s order: the sheet goes, what is under it is drawn, the toast', () => {
    assert.match(sheet, /if \(!r\.closed\) \{ if \(r\.toast\) say\(r\.toast\); return; \}\s*leave\(\(\) => \{ onWrote\(\); if \(r\.toast\) say\(r\.toast\); \}\);/);
  });
  test('a wheel still settling is rested before Log and before an effort tap, and the wheels start afresh after a chip or an effort', () => {
    assert.match(sheet, /apply\('rest-log', v\.log, \(\) => \{ flush\(\); done\(applyRestCardio\(session, now\.current, Date\.now\(\)\), leave\); \}\)/);
    assert.match(sheet, /onPress=\{\(\) => \{ flush\(\); hold\(tapRpe\(now\.current, e\.v\)\); setDrawn\(\(n\) => n \+ 1\); \}\}/);
    assert.match(sheet, /hold\(pickType\(now\.current, restHeld\(logs, draft\.w, draft\.day\), c\.type\)\); setDrawn\(\(n\) => n \+ 1\);/);
    assert.match(sheet, /<Wheel key=\{w\.hiddenId \+ ':' \+ draft\.type \+ ':' \+ drawn\}/);
  });
  test('of the new files only the two writers touch the store, each through core\'s writers or the moves\' own key', () => {
    const writes = (f: string): string[] => [...strip(read(f)).matchAll(/\b(store\.set|store\.remove|write[A-Z]\w+)\(/g)].map((m) => m[1]!).sort();
    assert.deepEqual(writes('rest-sheet/rest-writes.ts'), ['store.set', 'writeDayLogs', 'writeDayLogs', 'writePrograms']);
    assert.deepEqual(writes('mile-nudge/nudge-screen.ts'), ['writePrograms']);
    for (const f of ['rest-sheet/rest-sheet-model.ts', 'rest-sheet/RestSheet.tsx', 'mile-nudge/MileNudge.tsx', 'mile-nudge/mile-nudge-model.ts']) assert.deepEqual(writes(f), [], f);
    assert.match(strip(read('rest-sheet/rest-writes.ts')), /s\.store\.set\('ia_moves_' \+ s\.prog\.id, JSON\.stringify\(moves\)\);/);
  });
  test('the sheet draws every piece of each view', () => {
    for (const piece of ['{v.kicker}', '{v.title}', '{v.intro}', '{v.none && note(v.none)}', "apply('rest-instead', v.none.button, () => hold(toCardio(now.current)))", "sub: v.already.lines.concat(v.already.tail).join('\\n')", '{v.label}',
      '{r.title}', '{r.desc}', '{r.sel && <Text', 'onPress={() => hold(pickSession(now.current, r.day))}', '{v.warn && note(v.warn, p.red', "apply('rest-move', v.apply, () => done(applyRestMove(session, now.current, Date.now()), leave))",
      '{v.chipsLabel}', '{c.label}', '{v.timeLabel}', '{wheel(v.time)}', '{v.dist.label}', 'wheel(v.dist.wheel)', 'value={v.dist.box.value}', 'placeholder={v.dist.box.placeholder}', "onChangeText={(t) => hold(faceInput(now.current, 'rest_dist', t))}",
      '{v.effortLabel}', '{e.head}', "{' · ' + e.name}", '{e.desc}', '{v.note && note(v.note, p.accent)}', '{v.clear}', 'onPress={() => done(clearRestCardio(session, now.current), leave)}',
      "held={() => (w.hiddenId === 'rest_mins' ? now.current.mins : now.current.dist)}", 'onWrite={(id, value) => hold(faceInput(now.current, id, value))}',
      "{view.kind === 'move' ? move(view, leave) : cardio(view, leave)}", '<SheetFrame id="rest-sheet" palette={p} calm={calm} onClose={onClose}>']) assert.ok(sheet.includes(piece), piece);
    assert.match(sheet, /const view = restView\(draft, session\.prog, readCompleted\(session\.store, session\.prog\.id\) as Record<string, unknown>, logs\);/);
    assert.match(sheet, /if \(r\.draft\) hold\(r\.draft\);/);
    assert.match(sheet, /<Text style=\{\[s\.effectTtl, \{ color: tone \|\| p\.text \}\]\}>\{n\.title\}<\/Text>\s*<Text style=\{\[s\.effectSub, \{ color: p\.muted \}\]\}>\{n\.sub\}<\/Text>/);
  });
  test('each piece is drawn only where the view holds it', () => {
    for (const cond of ['{v.none && note(v.none)}', "{v.none && apply('rest-instead',", '{v.already && note({', '{!v.none && <Text style={[s.label,', '{v.warn && note(', "{v.apply && apply('rest-move',",
      '{v.dist && <Text style={[s.label, s.labelGap,', "{v.dist && ('wheel' in v.dist ? wheel(v.dist.wheel) : (", '{v.note && note(', '{v.clear && (\n        <Pressable testID="rest-clear"', '{r.sel && <Text style={[s.eqChk,']) assert.ok(sheet.includes(cond), cond);
  });
  test('every door reaches the app, and the app draws the sheet it was asked for', () => {
    assert.ok(weekScreen.includes('onRest={(week, key, view) => { if (prog) onRest({ prog: prog as unknown as RestProgram, week, dayKey: key, view }); }}'), 'This Week hands the program in hand, the day and the view');
    assert.ok(weekScreen.includes('onCardio={onCardio} />)}') && /function Days\(\{ d, p, onPick, onStart, onReopen, onCardio, onRest \}/.test(weekScreen));
    assert.ok(app.includes('onRest={(ask) => askRest(ask)} onLaunch={launched}'), 'This Week\'s links');
    assert.ok(app.includes('onRest={askRest} onLogged='), 'the session sheet\'s Edit cardio, with what to draw again');
    assert.ok(app.includes('const askRest = (ask: RestAsk, wrote: (() => void) | null = null): void => {'));
    assert.ok(app.includes('setRest((was) => ({ prog: ask.prog, draft: r.draft, wrote, n: was ? was.n + 1 : 1 }));'));
    assert.ok(app.includes('<RestSheet key={rest.n} palette={p} session={{ store: phoneStore, prog: rest.prog }} draft={rest.draft} calm={calm} say={say} onClose={() => setRest(null)}'));
    assert.ok(app.includes('<MileSheet palette={p} store={phoneStore} open={mile} calm={calm} say={say} onClose={() => setMile(null)}'));
  });
  test('the nudge draws its five lines and answers by its two buttons alone', () => {
    const nudge = strip(read('mile-nudge/MileNudge.tsx'));
    for (const piece of ['{text.label}', '{text.title}', '{text.body}', '{text.update}', '{text.keep}', 'testID="mile-nudge-update" accessibilityRole="button" onPress={onUpdate}', 'testID="mile-nudge-keep" accessibilityRole="button" onPress={onKeep}']) assert.ok(nudge.includes(piece), piece);
    assert.equal(nudge.split('onPress=').length - 1, 2, 'the scrim takes no press');
    assert.match(app, /\{nudge && <MileNudge palette=\{p\} text=\{nudgeText\(nudge\.offer\)\} calm=\{calm\}/);
    assert.match(nudge, /if \(calm\) return;\s*Animated\.timing\(scrim, \{ toValue: 1, duration: 240,[^\n]*\n\s*Animated\.timing\(rise, \{ toValue: 0, duration: 360,/);
  });
  test('the menu, Not resting?, is not built: no screen of today\'s iOS app opens it', () => {
    for (const f of ['rest-sheet/rest-sheet-model.ts', 'rest-sheet/RestSheet.tsx']) assert.doesNotMatch(strip(read(f)), /Not resting\?|Train a session here/);
    assert.match(readFileSync(join(TODAY, 'week-view', 'week-view.ts'), 'utf8'), /this\.bridge\.call\('openRestSheet', week, key, mode\);/);
  });
});
