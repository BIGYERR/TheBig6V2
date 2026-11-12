// Stored state, the logic in @ia/core (docs/decisions/stored-state.md), imported and run alone: the store the app's
// state sits behind (core/src/engine/state-store.ts, v0.261.2) with the page's one use of the browser's storage, and
// the lift log (core/src/engine/state-lift-log.ts, v0.261.3), the day's log, completion and skipped parts
// (core/src/engine/state-day-log.ts and state-day-status.ts, v0.261.4), the day history
// (core/src/engine/state-day-history.ts, v0.261.5), and the swaps, the swap counts, the day edits, the program list,
// the active program and the Wildcard's record (core/src/engine/state-swaps.ts, state-day-edits.ts and
// state-programs.ts, v0.261.6), and what Progress reads and computes from the stored state, the run card's regime and
// the nudge's preference (core/src/engine/state-progress.ts, state-day-log.ts and state-programs.ts, v0.261.7). Every
// expected value is typed from the ruling.
// What the app stores through it is held by tests/integration/stored-state.test.ts and the sweeps.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { memoryStore, storageStore } from '@ia/core/engine/state-store.ts';
import type { StateStore, StorageLike } from '@ia/core/engine/state-store.ts';
import { dedupeExDayEntries, entryDay, readLiftLog, recordLift, weeklyBest, writeLiftLog } from '@ia/core/engine/state-lift-log.ts';
import type { LiftEntry, LiftLog, LiftRecord } from '@ia/core/engine/state-lift-log.ts';
import {
  CARDIO_PARK_FIELDS, cardioEntryLogged, dayStoreKey, dropSetDraft, readDayLogs, recordSetDraft, runPartLogged, setDraftOf, writeDayLogs,
} from '@ia/core/engine/state-day-log.ts';
import type { DayLogs, StoredDayEntry } from '@ia/core/engine/state-day-log.ts';
import {
  clearDayParts, clearDayStatus, dayStatus, partsOfDay, readCompleted, readPartSkips, setDayStatus, settleDayParts, skipDayPart,
  writeCompleted, writePartSkips,
} from '@ia/core/engine/state-day-status.ts';
import { readDayHistory, recordDaySnapshot, refreshDaySnapshot, writeDayHistory } from '@ia/core/engine/state-day-history.ts';
import type { DayHistory } from '@ia/core/engine/state-day-history.ts';
import {
  SWAP_NUDGE_AT, addSwapRecord, countSwap, dropSwapRecord, markSwapNudged, readSwapCounts, readSwaps, writeSwapCounts,
  writeSwaps,
} from '@ia/core/engine/state-swaps.ts';
import {
  addAddEdit, addSkipEdit, dropAddEdit, dropSkipEdit, pruneDayEditsBefore, readDayEdits, writeDayEdits,
} from '@ia/core/engine/state-day-edits.ts';
import {
  readActiveProgramId, readPrograms, readWildcardDone, recordSwapPreference, writeActiveProgramId, writePrograms, writeWildcardDone,
} from '@ia/core/engine/state-programs.ts';
import {
  EASY_RPE_HI, EASY_RPE_LO, RUN_CLASS_ORDER, SEED_MIN_RUNS, SEED_WINDOW_DAYS, easyPaceByWeek, halfFromMilePace, liftLogFeedsOthers,
  longestRunByWeek, mileFromRecoveryPace, paceSeconds, plannedAndLoggedMiles, programWeekAt, progressCutWeek, recoveryPaceByWeek,
  recoveryPaceEntry, runClassOf, runPacesByClass, seedFromStoredPrograms,
} from '@ia/core/engine/state-progress.ts';
import type { Day, Program } from '@ia/core';
import { appScript, loadApp, pinClock } from '../support/app.ts';

/** A stand-in for the browser's storage that records what was asked of it. */
function fakeStorage(start: [string, string][] = []): StorageLike & { calls: string[]; rows: (readonly [string, string] | null)[] } {
  const rows: (readonly [string, string] | null)[] = start.map((r) => r);
  const calls: string[] = [];
  const at = (k: string) => rows.findIndex((r) => r !== null && r[0] === k);
  return {
    calls, rows,
    getItem(k) { calls.push('get ' + k); const i = at(k); return i < 0 ? null : rows[i]![1]; },
    setItem(k, v) { calls.push('set ' + k + '=' + v); const i = at(k); if (i < 0) rows.push([k, v]); else rows[i] = [k, v]; },
    removeItem(k) { calls.push('remove ' + k); const i = at(k); if (i >= 0) rows.splice(i, 1); },
    key(i) { const r = rows[i]; return r ? r[0] : null; },
    get length() { return rows.length; },
  };
}

test('a memory store gives null for a key never set, the string that was set, and null again once removed', () => {
  const s = memoryStore();
  assert.equal(s.get('ia_active'), null);
  s.set('ia_active', 'prog_1');
  assert.equal(s.get('ia_active'), 'prog_1');
  s.set('ia_active', '');
  assert.equal(s.get('ia_active'), '', 'an empty string is a stored value, not nothing');
  s.remove('ia_active');
  assert.equal(s.get('ia_active'), null);
  s.remove('never there');   // removing nothing is not an error
});

test('a memory store keeps strings: what is set is stored as String(value), as the browser does', () => {
  const s = memoryStore();
  s.set('n', 42 as unknown as string);
  s.set('o', { a: 1 } as unknown as string);
  assert.equal(s.get('n'), '42');
  assert.equal(s.get('o'), '[object Object]');
});

test('a memory store lists its keys in the order each was first set', () => {
  const s = memoryStore();
  s.set('ia_programs', '[]'); s.set('ia_active', 'p'); s.set('ia_logs_p', '{}');
  s.set('ia_programs', '[1]');   // set again: its place is kept
  assert.deepEqual(s.keys(), ['ia_programs', 'ia_active', 'ia_logs_p']);
  s.remove('ia_active'); s.set('ia_active', 'q');   // removed and set again: it goes to the end
  assert.deepEqual(s.keys(), ['ia_programs', 'ia_logs_p', 'ia_active']);
});

test('a memory store copies its seed: neither changes the other afterwards', () => {
  const seed: Record<string, string> = { ia_theme: 'night' };
  const s = memoryStore(seed);
  assert.equal(s.get('ia_theme'), 'night');
  seed['ia_theme'] = 'day'; seed['ia_new'] = 'x';
  assert.equal(s.get('ia_theme'), 'night');
  assert.equal(s.get('ia_new'), null);
  s.set('ia_theme', 'auto');
  assert.equal(seed['ia_theme'], 'day');
});

test('a storage store reads, writes and removes on the storage it stands on, one call each', () => {
  const f = fakeStorage([['ia_active', 'p1']]);
  const s = storageStore(() => f);
  assert.equal(s.get('ia_active'), 'p1');
  assert.equal(s.get('ia_none'), null);
  s.set('ia_theme', 'day');
  s.remove('ia_active');
  assert.deepEqual(f.calls, ['get ia_active', 'get ia_none', 'set ia_theme=day', 'remove ia_active']);
  assert.deepEqual(f.rows, [['ia_theme', 'day']]);
});

test('a storage store asks for its storage at every call, so a storage swapped after launch is followed', () => {
  const a = fakeStorage([['k', 'from a']]), b = fakeStorage([['k', 'from b']]);
  let now: StorageLike = a;
  const s = storageStore(() => now);
  assert.equal(s.get('k'), 'from a');
  now = b;
  assert.equal(s.get('k'), 'from b');
  s.set('k', 'written');
  assert.deepEqual([a.rows, b.rows], [[['k', 'from a']], [['k', 'written']]]);
});

test('a storage store lists key(0) to key(length - 1), in storage order, skipping a null', () => {
  const f = fakeStorage([['ia_b', '1'], ['ia_a', '2'], ['other', '3']]);
  f.rows.splice(1, 0, null);   // a slot whose key() answers null
  assert.equal(f.length, 4);
  assert.deepEqual(storageStore(() => f).keys(), ['ia_b', 'ia_a', 'other']);
  assert.deepEqual(storageStore(() => fakeStorage()).keys(), []);
});

test('a storage that refuses a write throws out of set, to the caller', () => {
  const f = fakeStorage();
  f.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => storageStore(() => f).set('ia_hist_p', '{}'), /QuotaExceededError/);
});

test('the page names the browser\'s storage once, where its one store is made', () => {
  const code = appScript().replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  assert.deepEqual(code.match(/[^\n]*\blocalStorage\b[^\n]*/g), ['const iaStore=storageStore(()=>localStorage);']);
});

test('the page\'s store is the harness\'s storage: a write through one is read through the other', () => {
  const IA = loadApp();
  IA.eval("iaStore.set('ia_theme','night')");
  assert.equal(IA.localStorage.getItem('ia_theme'), 'night');
  IA.localStorage.setItem('ia_active', 'prog_7');
  assert.equal(IA.eval("iaStore.get('ia_active')"), 'prog_7');
  assert.deepEqual([...IA.eval('iaStore.keys()')], ['ia_theme', 'ia_active']);   // copied: the array is the page's own
  IA.eval("iaStore.remove('ia_theme')");
  assert.equal(IA.localStorage.getItem('ia_theme'), null);
});

// ── The lift log, ia_exw_<program> (core/src/engine/state-lift-log.ts, v0.261.3) ─────────────────────────────────
// Imported from @ia/core and run on a memory store. Every expected value is typed from the ruling.
const lift = (over: Partial<LiftRecord> = {}): LiftRecord => ({
  name: 'Barbell bench press', weight: 135, setsReps: '3×5', week: 2, day: 'mon', setsDone: [5, 5, 5], setsW: [125, 130, 135], now: 1000, ...over,
});

test('the lift log reads empty when nothing or something broken is stored, and reads back what was written', () => {
  const s = memoryStore({ ia_exw_broken: '{"barbell_bench_press":' });
  assert.deepEqual(readLiftLog(s, 'p1'), {});
  assert.deepEqual(readLiftLog(s, 'broken'), {});
  const log: LiftLog = { barbell_bench_press: { name: 'Barbell bench press', entries: [{ weight: 135, setsReps: '3×5', setsDone: [5], setsW: [], week: 1, day: 'mon', ts: 7 }] } };
  writeLiftLog(s, 'p1', log);
  assert.equal(s.get('ia_exw_p1'), JSON.stringify(log), 'stored as its JSON, under ia_exw_<program>');
  assert.deepEqual(readLiftLog(s, 'p1'), log);
  assert.deepEqual(s.keys(), ['ia_exw_broken', 'ia_exw_p1'], 'and nothing else is written');
});

test('a first lift makes the row under the movement\'s key, its entry\'s fields in the stored order', () => {
  const log: LiftLog = {};
  recordLift(log, lift());
  assert.equal(JSON.stringify(log),
    '{"barbell_bench_press":{"name":"Barbell bench press","entries":[{"weight":135,"setsReps":"3×5","setsDone":[5,5,5],"setsW":[125,130,135],"week":2,"day":"mon","ts":1000}]}}');
});

test('the same week and day logged again replaces the entry; another day of the week adds one', () => {
  const log: LiftLog = {};
  recordLift(log, lift());
  recordLift(log, lift({ weight: '140', setsReps: '3×5 heavy', setsDone: [], setsW: null, now: 2000 }));
  const row = log['barbell_bench_press']!;
  assert.equal(row.entries.length, 1, 'no second entry for the day');
  assert.deepEqual(row.entries[0], { weight: 140, setsReps: '3×5 heavy', setsDone: [5, 5, 5], setsW: [125, 130, 135], week: 2, day: 'mon', ts: 2000 },
    'the weight (as a number), the prescription and the instant are the later log\'s; the sets it did not bring are kept');
  recordLift(log, lift({ day: 'thu', setsDone: [4], setsW: [], now: 3000 }));
  assert.deepEqual(row.entries.map((e) => [e.week, e.day, e.ts]), [[2, 'mon', 2000], [2, 'thu', 3000]]);
});

test('a year of weeks is kept: an entry of week 60 drops week 8 and keeps week 9', () => {
  const log: LiftLog = {};
  for (const week of [8, 9, 30]) recordLift(log, lift({ week, now: week }));
  assert.deepEqual(log['barbell_bench_press']!.entries.map((e) => e.week), [8, 9, 30], 'nothing is dropped up to week 52');
  recordLift(log, lift({ week: 60, now: 60 }));
  assert.deepEqual(log['barbell_bench_press']!.entries.map((e) => e.week), [9, 30, 60]);
});

test('an entry\'s day is its own day, else the weekday of its instant, else nothing', () => {
  assert.equal(entryDay({ day: 'sat', ts: new Date(2026, 8, 3, 12).getTime() }), 'sat');
  assert.equal(entryDay({ ts: new Date(2026, 8, 3, 12).getTime() }), 'thu', '3 September 2026 is a Thursday');
  assert.equal(entryDay({ ts: new Date(2026, 8, 6, 12).getTime() }), 'sun');
  assert.equal(entryDay({}), '');
  assert.equal(entryDay(null), '');
});

test('the week\'s best is its heaviest entry, the later of two equal ones, weeks in order', () => {
  const e = (week: number, weight: number, ts: number, day = 'mon'): LiftEntry => ({ weight, setsReps: '', setsDone: [], setsW: [], week, day, ts });
  const best = weeklyBest([e(3, 100, 1), e(1, 90, 2), e(3, 110, 3, 'thu'), e(1, 90, 5, 'fri'), e(3, 105, 9, 'sat')]);
  assert.deepEqual(best.map((x) => [x.week, x.weight, x.ts]), [[1, 90, 5], [3, 110, 3]]);
  assert.deepEqual(weeklyBest(null), []);
});

test('duplicate entries of one week and day collapse to the latest, and the function says whether anything changed', () => {
  const e = (week: number, day: string, ts: number, weight: number): LiftEntry => ({ weight, setsReps: '', setsDone: [], setsW: [], week, day, ts });
  const log: LiftLog = {
    a: { name: 'A', entries: [e(2, 'mon', 5, 100), e(1, 'mon', 1, 90), e(2, 'mon', 9, 105), e(2, 'thu', 7, 95)] },
    b: { name: 'B', entries: [e(1, 'mon', 1, 50)] },
  };
  assert.equal(dedupeExDayEntries(log), true);
  assert.deepEqual(log['a']!.entries.map((x) => [x.week, x.day, x.weight]), [[1, 'mon', 90], [2, 'thu', 95], [2, 'mon', 105]], 'by week, then by instant');
  assert.equal(dedupeExDayEntries(log), false, 'a clean log is left alone');
});

test('the page logs a lift through core: one entryDay in the script, and logExerciseWeight writes what recordLift records', () => {
  const code = appScript();
  assert.equal(code.split('function entryDay(').length - 1, 1, 'moved, not copied');
  assert.equal(code.split('function recordLift(').length - 1, 1);
  const IA = loadApp();
  IA.eval("activeProgId='p9';currentWeek=4;currentDayKey='tue';logExerciseWeight('Barbell bench press',135,'3×5',0,[5,5,5],[],'');");
  const stored = JSON.parse(IA.localStorage.getItem('ia_exw_p9')!);
  assert.deepEqual(Object.keys(stored), ['barbell_bench_press']);
  const { ts, ...rest } = stored.barbell_bench_press.entries[0];
  assert.deepEqual(rest, { weight: 135, setsReps: '3×5', setsDone: [5, 5, 5], setsW: [], week: 4, day: 'tue' }, 'the week and the day are the page\'s own when none is passed');
  assert.equal(typeof ts, 'number');
});

// ── The day's log, ia_logs_<program> (core/src/engine/state-day-log.ts, v0.261.4) ───────────────────────────────
// Imported from @ia/core and run on a memory store. Every expected value is typed from the ruling.
/** A memory store that counts its writes, to show a rule that must write nothing wrote nothing. */
function countingStore(seed?: Record<string, string>): StateStore & { writes: string[] } {
  const s = memoryStore(seed), writes: string[] = [];
  return { writes, get: (k) => s.get(k), set: (k, v) => { writes.push(k); s.set(k, v); }, remove: (k) => s.remove(k), keys: () => s.keys() };
}

test('a day is stored under w<week>_<day>, in every store that holds a day', () => {
  assert.equal(dayStoreKey(3, 'mon'), 'w3_mon');
  assert.equal(dayStoreKey('11', 'sat'), 'w11_sat');
});

test('the day\'s log reads empty when nothing or something broken is stored, and reads back what was written', () => {
  const s = memoryStore({ ia_logs_broken: '{"w1_mon":' });
  assert.deepEqual(readDayLogs(s, 'p1'), {});
  assert.deepEqual(readDayLogs(s, 'broken'), {});
  const logs: DayLogs = { w1_mon: { rpe: '7', run_dist: '3.1', notes: 'steady', week: 1, ts: 9 } };
  writeDayLogs(s, 'p1', logs);
  assert.equal(s.get('ia_logs_p1'), '{"w1_mon":{"rpe":"7","run_dist":"3.1","notes":"steady","week":1,"ts":9}}', 'stored as its JSON, under ia_logs_<program>');
  assert.deepEqual(readDayLogs(s, 'p1'), logs);
  assert.deepEqual(s.keys(), ['ia_logs_broken', 'ia_logs_p1'], 'and nothing else is written');
});

test('an old rest day entry reads in today\'s shape, an entry of today\'s shape as it is, and the read writes nothing', () => {
  const old = '{"w2_sun":{"rest_cardio":true,"rest_type":"run","rest_mins":"20","rpe":"4","run_dist":"2","notes":"easy","week":2,"ts":5},'
    + '"w2_mon":{"rpe":"6","run_dist":"3","notes":"","week":2,"ts":6},'
    + '"w2_sat":{"rest_cardio":true,"rest_type":"walk","rest_mins":"30","bike_mins":"15","swim_yards":"400","week":2}}';
  const s = countingStore({ ia_logs_p1: old });
  assert.equal(JSON.stringify(readDayLogs(s, 'p1')),
    '{"w2_sun":{"restLog":{"run":{"mins":20,"dist":2,"rpe":4}},"notes":"easy","week":2,"ts":5},'
    + '"w2_mon":{"rpe":"6","run_dist":"3","notes":"","week":2,"ts":6},'
    + '"w2_sat":{"restLog":{"walk":{"mins":30},"swim":{"dist":400},"bike":{"mins":15}},"week":2}}',
    'the seven flat fields become restLog; nothing is invented (no ts where there was none); a session entry is untouched');
  assert.deepEqual(s.writes, []);
  assert.equal(s.get('ia_logs_p1'), old);
});

test('a first set draft makes the day\'s entry: its week, its sets, the instant, in that order', () => {
  const s = memoryStore();
  recordSetDraft(s, 'p1', 2, 'mon', 'barbell_bench_press', { r: ['5', '5', ''], w: ['135', '', ''], L: 'lb' }, 1000);
  assert.equal(s.get('ia_logs_p1'), '{"w2_mon":{"week":2,"sets":{"barbell_bench_press":{"r":["5","5",""],"w":["135","",""],"L":"lb"}},"ts":1000}}');
  assert.deepEqual(setDraftOf(s, 'p1', 2, 'mon', 'barbell_bench_press'), { r: ['5', '5', ''], w: ['135', '', ''], L: 'lb' });
  assert.equal(setDraftOf(s, 'p1', 2, 'mon', 'back_squat'), null, 'no draft for another movement');
  assert.equal(setDraftOf(s, 'p1', 2, 'tue', 'barbell_bench_press'), null, 'nor on another day');
  assert.equal(setDraftOf(s, 'p1', 2, 'mon', ''), null);
});

test('a draft on a day already logged keeps the entry\'s other fields and restamps its week and instant', () => {
  const s = memoryStore({ ia_logs_p1: '{"w2_mon":{"rpe":"7","notes":"good","week":1,"ts":5}}' });
  recordSetDraft(s, 'p1', 2, 'mon', 'back_squat', { r: null, w: undefined, L: null }, 2000);
  assert.equal(s.get('ia_logs_p1'), '{"w2_mon":{"rpe":"7","notes":"good","week":2,"ts":2000,"sets":{"back_squat":{"r":[],"w":[],"L":""}}}}',
    'a draft that brings nothing is stored as empty lists and an empty label');
  recordSetDraft(s, 'p1', 2, 'mon', 'back_squat', { r: ['3'], w: ['225'], L: 'lb' }, 3000);
  assert.equal(s.get('ia_logs_p1'), '{"w2_mon":{"rpe":"7","notes":"good","week":2,"ts":3000,"sets":{"back_squat":{"r":["3"],"w":["225"],"L":"lb"}}}}',
    'a second draft of the movement replaces the first');
});

test('dropping a draft leaves the other drafts; dropping the last removes the sets and keeps the entry; dropping none writes nothing', () => {
  const s = countingStore({ ia_logs_p1: '{"w2_mon":{"notes":"n","week":2,"ts":7,"sets":{"a":{"r":["1"],"w":[],"L":""},"b":{"r":["2"],"w":[],"L":""}}}}' });
  dropSetDraft(s, 'p1', 2, 'mon', 'a');
  assert.equal(s.get('ia_logs_p1'), '{"w2_mon":{"notes":"n","week":2,"ts":7,"sets":{"b":{"r":["2"],"w":[],"L":""}}}}');
  dropSetDraft(s, 'p1', 2, 'mon', 'b');
  assert.equal(s.get('ia_logs_p1'), '{"w2_mon":{"notes":"n","week":2,"ts":7}}', 'the instant is not restamped by a drop');
  assert.deepEqual(s.writes, ['ia_logs_p1', 'ia_logs_p1']);
  dropSetDraft(s, 'p1', 2, 'mon', 'b');     // no sets left
  dropSetDraft(s, 'p1', 2, 'tue', 'a');     // no entry
  dropSetDraft(s, 'p2', 2, 'mon', 'a');     // no log
  assert.deepEqual(s.writes, ['ia_logs_p1', 'ia_logs_p1'], 'nothing more was written');
});

test('the fields a sport owns on an entry, and the test for a logged run', () => {
  assert.deepEqual(CARDIO_PARK_FIELDS, { run: ['run_dist', 'run_pace', 'run_mins', 'run_reps', 'run_rep_time'], bike: ['bike_mins'], swim: ['swim_yards'] });
  assert.equal(runPartLogged({ run_dist: '3' }, 'run'), true);
  assert.equal(runPartLogged({ run_rep_time: '1:30' }, 'run'), true);
  assert.equal(runPartLogged({ run_dist: '', run_mins: '' }, 'run'), false, 'untouched fields are not a log');
  assert.equal(runPartLogged({ run_mins: '0' }, 'run'), false, 'a zero is not a log');
  assert.equal(runPartLogged({ run_mins: 0 as unknown as string }, 'run'), false);
  assert.equal(runPartLogged({ notes: 'felt fine', rpe: '6' }, 'run'), false, 'a note and an effort are not the run');
  assert.equal(runPartLogged({ swapTo: 'bike', bike_mins: '30' }, 'run'), true, 'the sport it was swapped to is the one read');
  assert.equal(runPartLogged({ swapTo: 'bike', run_dist: '3' }, 'run'), false);
  assert.equal(runPartLogged({ swim_yards: '400' }, 'Swim'), true, 'the plan\'s sport, in any case');
  assert.equal(runPartLogged({ run_dist: '3' }, undefined), true, 'a run when nothing names the sport');
  assert.equal(runPartLogged(null, 'run'), false);
});

// ── Completion and skipped parts, ia_comp_ and ia_parts_<program> (core/src/engine/state-day-status.ts, v0.261.4) ──
const liftAndRun = { title: 'Push + Tempo', dot: 'run', tags: [], cardio: { type: 'run' }, sections: [{ label: 'Main', items: [{ name: 'Barbell bench press' }] }] } as unknown as Day;
const runOnly = { title: 'Long Run', dot: 'run', tags: [], cardio: { type: 'run' }, sections: [] } as unknown as Day;

test('completion and parts read empty when nothing or something broken is stored, and are stored as their JSON', () => {
  const s = memoryStore({ ia_comp_broken: '{', ia_parts_broken: 'x' });
  assert.deepEqual([readCompleted(s, 'p1'), readCompleted(s, 'broken'), readPartSkips(s, 'p1'), readPartSkips(s, 'broken')], [{}, {}, {}, {}]);
  writeCompleted(s, 'p1', { w1_mon: { title: 'Push', ts: 4, status: 'complete' } });
  writePartSkips(s, 'p1', { w1_tue: { run: 1 } });
  assert.equal(s.get('ia_comp_p1'), '{"w1_mon":{"title":"Push","ts":4,"status":"complete"}}');
  assert.equal(s.get('ia_parts_p1'), '{"w1_tue":{"run":1}}');
  assert.deepEqual(readCompleted(s, 'p1'), { w1_mon: { title: 'Push', ts: 4, status: 'complete' } });
  assert.deepEqual(readPartSkips(s, 'p1'), { w1_tue: { run: 1 } });
});

test('a status set by hand is stored as title, instant, status, with the title as it was given', () => {
  const s = memoryStore();
  setDayStatus(s, 'p1', 1, 'mon', 'Push', 'complete', 1000);
  assert.equal(s.get('ia_comp_p1'), '{"w1_mon":{"title":"Push","ts":1000,"status":"complete"}}');
  setDayStatus(s, 'p1', 1, 'tue', null, 'skipped', 2000);
  setDayStatus(s, 'p1', 1, 'wed', undefined, 'complete', 3000);
  assert.equal(s.get('ia_comp_p1'),
    '{"w1_mon":{"title":"Push","ts":1000,"status":"complete"},"w1_tue":{"title":null,"ts":2000,"status":"skipped"},"w1_wed":{"ts":3000,"status":"complete"}}',
    'no title given is no title stored; a null title is stored as null');
  setDayStatus(s, 'p1', 1, 'mon', 'Push', 'skipped', 4000);
  assert.deepEqual(readCompleted(s, 'p1')['w1_mon'], { title: 'Push', ts: 4000, status: 'skipped' }, 'set again, the record is replaced whole');
});

test('a day reads as its status: none with no record, complete for a record with no status or a partial one', () => {
  const s = memoryStore({ ia_comp_p1: '{"w1_mon":{"title":"A","ts":1},"w1_tue":{"ts":2,"status":"partial"},"w1_wed":{"ts":3,"status":"skipped"},"w1_thu":{"ts":4,"status":"complete"}}' });
  assert.deepEqual(['mon', 'tue', 'wed', 'thu', 'fri'].map((d) => dayStatus(s, 'p1', 1, d)), ['complete', 'complete', 'skipped', 'complete', null]);
  assert.equal(dayStatus(s, 'p1', 2, 'mon'), null, 'another week');
  assert.equal(dayStatus(s, 'p2', 1, 'mon'), null, 'another program');
});

test('the undo tap removes the day\'s record, and writes the store even when none was there', () => {
  const s = countingStore({ ia_comp_p1: '{"w1_mon":{"title":"A","ts":1,"status":"complete"},"w1_tue":{"title":"B","ts":2,"status":"skipped"}}' });
  clearDayStatus(s, 'p1', 1, 'mon');
  assert.equal(s.get('ia_comp_p1'), '{"w1_tue":{"title":"B","ts":2,"status":"skipped"}}');
  clearDayStatus(s, 'p1', 1, 'mon');
  assert.equal(s.get('ia_comp_p1'), '{"w1_tue":{"title":"B","ts":2,"status":"skipped"}}');
  clearDayStatus(s, 'p2', 1, 'mon');
  assert.equal(s.get('ia_comp_p2'), '{}');
  assert.deepEqual(s.writes, ['ia_comp_p1', 'ia_comp_p1', 'ia_comp_p2']);
});

test('a day\'s parts are its run when the cardio has a sport and its lift when a section holds a movement', () => {
  assert.deepEqual(partsOfDay(liftAndRun), ['run', 'lift']);
  assert.deepEqual(partsOfDay(runOnly), ['run']);
  assert.deepEqual(partsOfDay({ title: 'Pull', cardio: null, sections: [{ label: 'Main', items: [{ name: 'Pull-up' }] }] } as unknown as Day), ['lift']);
  assert.deepEqual(partsOfDay({ title: 'Odd', cardio: { type: '' }, sections: [{ label: 'Empty', items: [] }] } as unknown as Day), [], 'a cardio with no sport and a section with no movement are not parts');
  assert.deepEqual(partsOfDay({ title: 'Rest', rest: true, cardio: { type: 'run' } } as unknown as Day), [], 'a rest day has none');
  assert.deepEqual([partsOfDay(null), partsOfDay(undefined)], [[], []]);
});

test('one part skipped of two is stored in the parts and leaves the day open; both skipped is a skipped day; one put back reopens it', () => {
  const s = countingStore();
  skipDayPart(s, 'p1', 1, 'mon', liftAndRun, 'run', 1000);
  assert.equal(s.get('ia_parts_p1'), '{"w1_mon":{"run":1}}');
  assert.equal(s.get('ia_comp_p1'), null, 'the lift is left, and only a status set by hand completes a lift: no record');
  skipDayPart(s, 'p1', 1, 'mon', liftAndRun, 'lift', 2000);
  assert.equal(s.get('ia_parts_p1'), '{"w1_mon":{"run":1,"lift":1}}');
  assert.equal(s.get('ia_comp_p1'), '{"w1_mon":{"title":"Push + Tempo","ts":2000,"status":"skipped","parts":1}}');
  settleDayParts(s, 'p1', 1, 'mon', liftAndRun, 9999);
  assert.equal(s.get('ia_comp_p1'), '{"w1_mon":{"title":"Push + Tempo","ts":2000,"status":"skipped","parts":1}}', 'settled again with nothing changed, the record is not rewritten');
  skipDayPart(s, 'p1', 1, 'mon', liftAndRun, 'lift', 3000);
  assert.equal(s.get('ia_parts_p1'), '{"w1_mon":{"run":1}}', 'tapped again, the part is put back');
  assert.equal(s.get('ia_comp_p1'), '{}', 'and the record the parts wrote is removed');
  skipDayPart(s, 'p1', 1, 'mon', liftAndRun, 'run', 4000);
  assert.equal(s.get('ia_parts_p1'), '{}', 'the last part put back removes the day from the parts');
  assert.deepEqual(s.writes, ['ia_parts_p1', 'ia_parts_p1', 'ia_comp_p1', 'ia_parts_p1', 'ia_comp_p1', 'ia_parts_p1'], 'the parts are written before the completion they settle');
});

test('the lift skipped and the run logged is a done day; the run cleared reopens it', () => {
  const s = memoryStore({ ia_logs_p1: '{"w1_mon":{"run_dist":"3","week":1,"ts":5}}' });
  skipDayPart(s, 'p1', 1, 'mon', liftAndRun, 'lift', 1000);
  assert.equal(s.get('ia_parts_p1'), '{"w1_mon":{"lift":1}}');
  assert.equal(s.get('ia_comp_p1'), '{"w1_mon":{"title":"Push + Tempo","ts":1000,"status":"complete","parts":1}}');
  s.set('ia_logs_p1', '{"w1_mon":{"run_dist":"","week":1,"ts":6}}');
  settleDayParts(s, 'p1', 1, 'mon', liftAndRun, 2000);
  assert.equal(s.get('ia_comp_p1'), '{}');
  s.set('ia_logs_p1', '{"w1_mon":{"run_mins":"25","week":1,"ts":7}}');
  settleDayParts(s, 'p1', 1, 'mon', liftAndRun, 3000);
  assert.equal(s.get('ia_comp_p1'), '{"w1_mon":{"title":"Push + Tempo","ts":3000,"status":"complete","parts":1}}');
});

test('a day with one part, skipped, is a skipped day; a day with no title stores a null one; a part the day does not have is ignored', () => {
  const s = countingStore();
  skipDayPart(s, 'p1', 3, 'sat', runOnly, 'lift', 500);
  assert.deepEqual(s.writes, [], 'a run day has no lift to skip: nothing is written');
  skipDayPart(s, 'p1', 3, 'sat', runOnly, 'run', 1000);
  assert.equal(s.get('ia_comp_p1'), '{"w3_sat":{"title":"Long Run","ts":1000,"status":"skipped","parts":1}}');
  skipDayPart(s, 'p1', 3, 'sun', { cardio: { type: 'bike' }, sections: [] } as unknown as Day, 'run', 2000);
  assert.deepEqual(readCompleted(s, 'p1')['w3_sun'], { title: null, ts: 2000, status: 'skipped', parts: 1 });
  skipDayPart(s, 'p1', 3, 'mon', undefined, 'run', 3000);
  assert.equal(s.get('ia_parts_p1'), '{"w3_sat":{"run":1},"w3_sun":{"run":1}}', 'a day the grid does not hold has no parts');
});

test('a status set by hand is never settled over; a day skipped whole turns into its parts when one is put back', () => {
  const done = '{"w1_mon":{"title":"Push + Tempo","ts":1,"status":"complete"}}';
  const s = memoryStore({ ia_comp_p1: done });
  skipDayPart(s, 'p1', 1, 'mon', liftAndRun, 'run', 1000);
  skipDayPart(s, 'p1', 1, 'mon', liftAndRun, 'lift', 2000);
  assert.equal(s.get('ia_parts_p1'), '{"w1_mon":{"run":1,"lift":1}}');
  assert.equal(s.get('ia_comp_p1'), done, 'Done by hand stands, whatever the parts say');
  const t = memoryStore({ ia_comp_p1: '{"w1_mon":{"title":"Push + Tempo","ts":1,"status":"skipped"}}' });
  skipDayPart(t, 'p1', 1, 'mon', liftAndRun, 'run', 1000);
  assert.equal(t.get('ia_parts_p1'), '{"w1_mon":{"lift":1}}', 'skipped whole was both parts skipped; the run is put back, the lift stays skipped');
  assert.equal(t.get('ia_comp_p1'), '{}', 'and the day is open again');
});

test('clearing a day\'s parts removes its key and leaves the other days; with none to clear it writes nothing', () => {
  const s = countingStore({ ia_parts_p1: '{"w1_mon":{"run":1},"w1_tue":{"lift":1}}' });
  clearDayParts(s, 'p1', 1, 'mon');
  assert.equal(s.get('ia_parts_p1'), '{"w1_tue":{"lift":1}}');
  clearDayParts(s, 'p1', 1, 'mon');
  clearDayParts(s, 'p1', 2, 'tue');
  clearDayParts(s, 'p2', 1, 'tue');
  assert.deepEqual(s.writes, ['ia_parts_p1']);
});

test('the page reaches the day\'s log, completion and parts through core: each rule is in the script once', () => {
  const code = appScript();
  for (const name of ['restNorm', 'readDayLogs', 'recordSetDraft', 'runPartLogged', 'setDayStatus', 'settleDayParts', 'skipDayPart']) {
    assert.equal(code.split('function ' + name + '(').length - 1, 1, name + ' is in the page once');
  }
  assert.equal(code.split('CARDIO_PARK_FIELDS=').length - 1, 1, 'moved, not copied');
  for (const key of ["'ia_logs_'+", "'ia_comp_'+", "'ia_parts_'+"]) {
    // One reader and one writer in core; the freeze still reads ia_logs_ and ia_comp_ itself (the freeze slice's).
    assert.equal(code.split(key).length - 1, key === "'ia_parts_'+" ? 2 : 3, key + ' is built by its reader, its writer and, until its slice, the freeze');
  }
});

// These guard behaviour the move must not change: they pass on the release before it too.
test('the page\'s own names still answer as they did: the keys, the lens, a draft written and dropped, a status read', () => {
  const IA = loadApp();
  assert.deepEqual([IA.eval("logKey(3,'mon')"), IA.eval("completedKey(3,'mon')")], ['w3_mon', 'w3_mon']);
  IA.localStorage.setItem('ia_logs_p9', '{"w4_sun":{"rest_cardio":true,"rest_type":"bike","rest_mins":"40","week":4}}');
  IA.localStorage.setItem('ia_comp_p9', '{"w4_mon":{"title":"A","ts":1},"w4_wed":{"ts":3,"status":"skipped"}}');
  IA.eval("activeProgId='p9';currentWeek=4;currentDayKey='tue';");
  assert.equal(IA.eval('JSON.stringify(getLogs())'), '{"w4_sun":{"restLog":{"bike":{"mins":40}},"week":4}}');
  assert.equal(IA.eval("JSON.stringify(getLogsFor('p9'))"), '{"w4_sun":{"restLog":{"bike":{"mins":40}},"week":4}}');
  assert.deepEqual([IA.eval("statusOf(4,'mon')"), IA.eval("statusOf(4,'wed')"), IA.eval("statusOf(4,'thu')")], ['complete', 'skipped', null]);
  IA.eval("writeSetDraft('back_squat',['5'],['225'],'lb')");
  const stored = JSON.parse(IA.localStorage.getItem('ia_logs_p9')!);
  const { ts, ...rest } = stored.w4_tue;
  assert.deepEqual(rest, { week: 4, sets: { back_squat: { r: ['5'], w: ['225'], L: 'lb' } } }, 'the week and the day are the page\'s own');
  assert.equal(typeof ts, 'number');
  assert.deepEqual(stored.w4_sun, { restLog: { bike: { mins: 40 } }, week: 4 }, 'the old rest entry converts when a writer saves the map it read');
  assert.equal(IA.eval("JSON.stringify(readSetDraft('back_squat'))"), '{"r":["5"],"w":["225"],"L":"lb"}');
  IA.eval("clearSetDraft('back_squat')");
  assert.deepEqual(Object.keys(JSON.parse(IA.localStorage.getItem('ia_logs_p9')!).w4_tue), ['week', 'ts']);
  IA.eval("activeProgId='';writeSetDraft('back_squat',['5'],['225'],'lb')");
  assert.equal(IA.localStorage.getItem('ia_logs_'), null, 'with no active program a draft is not written');
});

// ── The day history, ia_hist_<program> (core/src/engine/state-day-history.ts, v0.261.5) ──
// Imported from @ia/core and run on a memory store. Every expected value is typed from the ruling.
const pushDay = () => ({ title: 'Push', sections: [{ label: 'Main', items: [{ name: 'Barbell bench press', detail: '4×5' }] }] }) as unknown as Day;
const PUSH = '{"title":"Push","sections":[{"label":"Main","items":[{"name":"Barbell bench press","detail":"4×5"}]}]}';
const PULL = '{"title":"Pull","sections":[]}';

test('the day history reads empty when nothing or something broken is stored, and is stored as its JSON', () => {
  assert.deepEqual(readDayHistory(memoryStore(), 'p1'), {});
  assert.deepEqual(readDayHistory(memoryStore({ ia_hist_p1: '{"w1_mon":' }), 'p1'), {}, 'broken JSON reads as empty');
  const s = memoryStore();
  writeDayHistory(s, 'p1', { w1_mon: pushDay() });
  assert.equal(s.get('ia_hist_p1'), '{"w1_mon":' + PUSH + '}');
  assert.deepEqual(readDayHistory(s, 'p1'), { w1_mon: pushDay() });
  assert.equal(s.get('ia_hist_p2'), null, 'another program has its own key');
});

test('a store that refuses the history stops nothing: the write is swallowed, the snapshot too', () => {
  const full: StateStore = { get: () => null, set: () => { throw new Error('QuotaExceededError'); }, remove: () => {}, keys: () => [] };
  writeDayHistory(full, 'p1', { w1_mon: pushDay() });
  recordDaySnapshot(full, 'p1', 1, 'mon', pushDay());
  refreshDaySnapshot(full, 'p1', 1, 'mon', pushDay());
});

test('a day\'s first touch stores the day whole under w<week>_<day>, and the copy does not follow the day', () => {
  const s = memoryStore();
  const day = pushDay();
  recordDaySnapshot(s, 'p1', 1, 'mon', day);
  assert.equal(s.get('ia_hist_p1'), '{"w1_mon":' + PUSH + '}');
  (day as any).title = 'Changed';
  (day as any).sections[0].items[0].name = 'Dumbbell bench press';
  assert.equal(s.get('ia_hist_p1'), '{"w1_mon":' + PUSH + '}', 'a copy, not the day itself');
});

test('first touch wins: a second touch of a day writes nothing, changed or not; another day adds its key after the first', () => {
  const s = countingStore();
  recordDaySnapshot(s, 'p1', 1, 'mon', pushDay());
  recordDaySnapshot(s, 'p1', 1, 'mon', pushDay());
  recordDaySnapshot(s, 'p1', 1, 'mon', { title: 'Pull', sections: [] } as unknown as Day);
  assert.deepEqual(s.writes, ['ia_hist_p1'], 'one write, the first');
  assert.equal(s.get('ia_hist_p1'), '{"w1_mon":' + PUSH + '}');
  recordDaySnapshot(s, 'p1', 2, 'tue', { title: 'Pull', sections: [] } as unknown as Day);
  assert.equal(s.get('ia_hist_p1'), '{"w1_mon":' + PUSH + ',"w2_tue":' + PULL + '}');
  recordDaySnapshot(s, 'p2', 1, 'mon', { title: 'Pull', sections: [] } as unknown as Day);
  assert.equal(s.get('ia_hist_p2'), '{"w1_mon":' + PULL + '}', 'another program has its own history');
  assert.equal(s.get('ia_hist_p1'), '{"w1_mon":' + PUSH + ',"w2_tue":' + PULL + '}');
});

test('no day, no snapshot: nothing is written for a day the week does not hold', () => {
  const s = countingStore({ ia_hist_p1: '{"w1_mon":' + PUSH + '}' });
  recordDaySnapshot(s, 'p1', 1, 'tue', null);
  recordDaySnapshot(s, 'p1', 1, 'tue', undefined);
  refreshDaySnapshot(s, 'p1', 1, 'mon', null);
  refreshDaySnapshot(s, 'p1', 1, 'mon', undefined);
  assert.deepEqual(s.writes, []);
  assert.equal(s.get('ia_hist_p1'), '{"w1_mon":' + PUSH + '}');
});

test('an edit after the first touch replaces that day\'s snapshot and leaves the others; with no snapshot it writes nothing', () => {
  const s = countingStore({ ia_hist_p1: '{"w1_mon":' + PUSH + ',"w1_tue":' + PULL + '}' });
  const edited = pushDay();
  (edited as any).sections[0].items[0].name = 'Dumbbell bench press';
  refreshDaySnapshot(s, 'p1', 1, 'wed', edited);
  refreshDaySnapshot(s, 'p2', 1, 'mon', edited);
  assert.deepEqual(s.writes, [], 'a day never touched has no snapshot to bring up to date');
  refreshDaySnapshot(s, 'p1', 1, 'mon', edited);
  assert.equal(s.get('ia_hist_p1'), '{"w1_mon":' + PUSH.replace('Barbell bench press', 'Dumbbell bench press') + ',"w1_tue":' + PULL + '}');
  assert.deepEqual(s.writes, ['ia_hist_p1']);
});

test('the page reaches the day history through core: each rule is in the script once', () => {
  const code = appScript();
  for (const name of ['readDayHistory', 'writeDayHistory', 'recordDaySnapshot', 'refreshDaySnapshot']) {
    assert.equal(code.split('function ' + name + '(').length - 1, 1, name + ' is in the page once');
  }
  // One reader and one writer in core; the freeze still reads ia_hist_ itself, twice (the freeze slice's).
  assert.equal(code.split("'ia_hist_'+").length - 1, 4, 'the key is built by its reader, its writer and, until its slice, the freeze');
});

// These guard behaviour the move must not change: they pass on the release before it too.
test('the page\'s own names still answer as they did: a first touch, a second, an edit, the two reads, and the taps that write nothing', () => {
  const IA = loadApp();
  const stored = () => IA.localStorage.getItem('ia_hist_p9');
  IA.eval("activeProgId='p9';activeProg={id:'p9',weeks:{2:{tue:{title:'A',sections:[]},wed:{title:'W',sections:[]}}}};");
  IA.eval("snapshotDay(2,'tue')");
  assert.equal(stored(), '{"w2_tue":{"title":"A","sections":[]}}');
  IA.eval("activeProg.weeks[2].tue.title='B';snapshotDay(2,'tue')");
  assert.equal(stored(), '{"w2_tue":{"title":"A","sections":[]}}', 'first touch wins');
  IA.eval("resnapshotDayEdit(2,'wed')");
  assert.equal(stored(), '{"w2_tue":{"title":"A","sections":[]}}', 'an edit to a day never touched snapshots nothing');
  IA.eval("resnapshotDayEdit(2,'tue')");
  assert.equal(stored(), '{"w2_tue":{"title":"B","sections":[]}}', 'the athlete\'s edit is folded into the snapshot');
  assert.equal(IA.eval('JSON.stringify(getDayHist())'), '{"w2_tue":{"title":"B","sections":[]}}');
  assert.equal(IA.eval("JSON.stringify(getDayHistFor('p9'))"), '{"w2_tue":{"title":"B","sections":[]}}');
  assert.equal(IA.eval("JSON.stringify(getDayHistFor('nobody'))"), '{}');
  // Nothing is written for week 0, an empty day, a day the week does not hold, or a week the program does not hold.
  IA.eval("snapshotDay(0,'wed');snapshotDay(2,'');snapshotDay(2,'fri');snapshotDay(9,'wed');resnapshotDayEdit(0,'tue');resnapshotDayEdit(2,'');");
  assert.equal(stored(), '{"w2_tue":{"title":"B","sections":[]}}');
  // A stored null is a fault inside the snapshot: it is logged and the tap goes on, the store as it was.
  IA.localStorage.setItem('ia_hist_p9', 'null');
  const err = console.error; const said: unknown[][] = []; console.error = (...a: unknown[]) => { said.push(a); };
  try { IA.eval("snapshotDay(2,'wed');resnapshotDayEdit(2,'wed');"); } finally { console.error = err; }
  assert.equal(stored(), 'null');
  assert.deepEqual(said.map((a) => a[0]), ['day snapshot failed', 'day edit re-snapshot failed']);
  IA.eval("activeProg=null;snapshotDay(2,'wed');resnapshotDayEdit(2,'wed');");
  assert.equal(stored(), 'null', 'with no active program nothing is read or written');
});

// ── The swaps and the swap counts, ia_swaps_ and ia_swapct_<program> (core/src/engine/state-swaps.ts, v0.261.6) ──
// Imported from @ia/core and run on a memory store. Every expected value is typed from the ruling.
const refusing = (): StateStore => ({ get: () => null, set: () => { throw new Error('QuotaExceededError'); }, remove: () => {}, keys: () => [] });

test('the swaps and the swap counts read empty when nothing or something broken is stored, and are stored as their JSON', () => {
  assert.deepEqual(readSwaps(memoryStore(), 'p1'), {});
  assert.deepEqual(readSwapCounts(memoryStore(), 'p1'), {});
  assert.deepEqual(readSwaps(memoryStore({ ia_swaps_p1: '{"w1_mon":[' }), 'p1'), {}, 'broken JSON reads as empty');
  assert.deepEqual(readSwapCounts(memoryStore({ ia_swapct_p1: 'nope' }), 'p1'), {});
  const s = memoryStore();
  writeSwaps(s, 'p1', { w1_mon: [{ from: 'Back squat', to: 'Front squat', ts: 5 }] });
  writeSwapCounts(s, 'p1', { 'Back squat': { to: 'Front squat', n: 1, offered: false } });
  assert.equal(s.get('ia_swaps_p1'), '{"w1_mon":[{"from":"Back squat","to":"Front squat","ts":5}]}');
  assert.equal(s.get('ia_swapct_p1'), '{"Back squat":{"to":"Front squat","n":1,"offered":false}}');
  assert.deepEqual(readSwaps(s, 'p1'), { w1_mon: [{ from: 'Back squat', to: 'Front squat', ts: 5 }] });
  assert.deepEqual(readSwaps(s, 'p2'), {}, 'another program has its own key');
});

test('a store that refuses a swap or a count stops nothing: the write is swallowed', () => {
  writeSwaps(refusing(), 'p1', {});
  writeSwapCounts(refusing(), 'p1', {});
  assert.deepEqual(addSwapRecord(refusing(), 'p1', 1, 'mon', 'Back squat', 'Front squat', null, 5),
    { w1_mon: [{ from: 'Back squat', to: 'Front squat', ts: 5 }] }, 'the tap still hands back what it would have stored');
  assert.equal(countSwap(refusing(), 'p1', 'Back squat', 'Front squat'), null);
});

test('a swap is stored under its day as from, to, the instant, and where the lift stood when the tap brings it', () => {
  const s = memoryStore();
  addSwapRecord(s, 'p1', 2, 'mon', 'Back squat', 'Front squat', null, 100);
  assert.equal(s.get('ia_swaps_p1'), '{"w2_mon":[{"from":"Back squat","to":"Front squat","ts":100}]}');
  addSwapRecord(s, 'p1', 2, 'tue', 'Barbell row', 'Seal row', [], 101);
  assert.equal(JSON.stringify(readSwaps(s, 'p1').w2_tue), '[{"from":"Barbell row","to":"Seal row","ts":101}]', 'no places, no rx');
  addSwapRecord(s, 'p1', 2, 'wed', 'Bench press', 'Floor press', [{ s: 0, i: 1, d: '4×5' }, { s: 2, i: 0, d: '3×8', ph: '3×8 RPE 8' }], 102);
  assert.equal(JSON.stringify(readSwaps(s, 'p1').w2_wed),
    '[{"from":"Bench press","to":"Floor press","ts":102,"rx":[{"s":0,"i":1,"d":"4×5"},{"s":2,"i":0,"d":"3×8","ph":"3×8 RPE 8"}]}]');
  assert.deepEqual(Object.keys(readSwaps(s, 'p1')), ['w2_mon', 'w2_tue', 'w2_wed'], 'each day its own key, in the order made');
});

test('a lift swapped again on its day replaces its record at the end of the list, and the same pair keeps the places the earlier tap saw', () => {
  const s = memoryStore();
  addSwapRecord(s, 'p1', 1, 'mon', 'A', 'B', [{ s: 0, i: 0, d: '5×5' }], 1);
  addSwapRecord(s, 'p1', 1, 'mon', 'C', 'D', null, 2);
  addSwapRecord(s, 'p1', 1, 'mon', 'A', 'B', [{ s: 3, i: 0, d: '3×10' }], 3);
  assert.equal(JSON.stringify(readSwaps(s, 'p1').w1_mon),
    '[{"from":"C","to":"D","ts":2},{"from":"A","to":"B","ts":3,"rx":[{"s":0,"i":0,"d":"5×5"},{"s":3,"i":0,"d":"3×10"}]}]');
  addSwapRecord(s, 'p1', 1, 'mon', 'A', 'B', [{ s: 3, i: 0, d: '3×12' }], 4);
  assert.equal(JSON.stringify(readSwaps(s, 'p1').w1_mon[1]!.rx), '[{"s":0,"i":0,"d":"5×5"},{"s":3,"i":0,"d":"3×12"}]', 'a place seen again takes this tap\'s detail');
  addSwapRecord(s, 'p1', 1, 'mon', 'A', 'E', [{ s: 3, i: 0, d: '3×12' }], 5);
  assert.equal(JSON.stringify(readSwaps(s, 'p1').w1_mon), '[{"from":"C","to":"D","ts":2},{"from":"A","to":"E","ts":5,"rx":[{"s":3,"i":0,"d":"3×12"}]}]',
    'another replacement keeps nothing of the earlier record');
  addSwapRecord(s, 'p1', 1, 'mon', 'A', 'E', null, 6);
  assert.equal(JSON.stringify(readSwaps(s, 'p1').w1_mon[1]), '{"from":"A","to":"E","ts":6}', 'a tap with no places stores none');
});

test('undoing a swap removes that lift\'s record, and the day\'s key with its last one; a day with none writes nothing', () => {
  const s = countingStore({ ia_swaps_p1: '{"w1_mon":[{"from":"A","to":"B","ts":1},{"from":"C","to":"D","ts":2}],"w1_tue":[{"from":"E","to":"F","ts":3}]}' });
  assert.deepEqual(dropSwapRecord(s, 'p1', 1, 'wed', 'A'), readSwaps(s, 'p1'));
  assert.deepEqual(s.writes, [], 'no record on the day, nothing written');
  dropSwapRecord(s, 'p1', 1, 'mon', 'A');
  assert.equal(s.get('ia_swaps_p1'), '{"w1_mon":[{"from":"C","to":"D","ts":2}],"w1_tue":[{"from":"E","to":"F","ts":3}]}');
  dropSwapRecord(s, 'p1', 1, 'mon', 'Z');
  assert.equal(s.get('ia_swaps_p1'), '{"w1_mon":[{"from":"C","to":"D","ts":2}],"w1_tue":[{"from":"E","to":"F","ts":3}]}', 'a lift with no record changes nothing');
  dropSwapRecord(s, 'p1', 1, 'mon', 'C');
  assert.equal(s.get('ia_swaps_p1'), '{"w1_tue":[{"from":"E","to":"F","ts":3}]}');
});

test('the nudge comes at the third swap running of one lift to one replacement; another choice starts again; once offered, that pair never again', () => {
  assert.equal(SWAP_NUDGE_AT, 3);
  const s = memoryStore();
  assert.equal(countSwap(s, 'p1', 'Back squat', 'Front squat'), null);
  assert.equal(s.get('ia_swapct_p1'), '{"Back squat":{"to":"Front squat","n":1,"offered":false}}');
  assert.equal(countSwap(s, 'p1', 'Back squat', 'Front squat'), null);
  assert.deepEqual(countSwap(s, 'p1', 'Back squat', 'Front squat'), { to: 'Front squat', n: 3, offered: false });
  assert.deepEqual(countSwap(s, 'p1', 'Back squat', 'Front squat'), { to: 'Front squat', n: 4, offered: false }, 'still due until it is answered');
  assert.equal(countSwap(s, 'p1', 'Back squat', 'Goblet squat'), null);
  assert.equal(s.get('ia_swapct_p1'), '{"Back squat":{"to":"Goblet squat","n":1,"offered":false}}', 'another replacement starts the run again');
  countSwap(s, 'p1', 'Back squat', 'Goblet squat'); countSwap(s, 'p1', 'Back squat', 'Goblet squat');
  markSwapNudged(s, 'p1', 'Back squat');
  assert.equal(s.get('ia_swapct_p1'), '{"Back squat":{"to":"Goblet squat","n":3,"offered":true}}');
  assert.equal(countSwap(s, 'p1', 'Back squat', 'Goblet squat'), null);
  assert.equal(countSwap(s, 'p1', 'Back squat', 'Goblet squat'), null);
  assert.equal(countSwap(s, 'p1', 'Back squat', 'Goblet squat'), null);
  assert.equal(s.get('ia_swapct_p1'), '{"Back squat":{"to":"Goblet squat","n":1,"offered":true}}', 'the pair offered starts at one and stays offered');
  countSwap(s, 'p1', 'Back squat', 'Front squat'); countSwap(s, 'p1', 'Back squat', 'Front squat');
  assert.deepEqual(countSwap(s, 'p1', 'Back squat', 'Front squat'), { to: 'Front squat', n: 3, offered: false }, 'another pair can still be offered');
});

test('answering the nudge marks the lift offered; a lift never counted writes nothing', () => {
  const s = countingStore({ ia_swapct_p1: '{"A":{"to":"B","n":3,"offered":false},"C":{"to":"D","n":1,"offered":false}}' });
  markSwapNudged(s, 'p1', 'Z');
  assert.deepEqual(s.writes, []);
  markSwapNudged(s, 'p1', 'A');
  assert.equal(s.get('ia_swapct_p1'), '{"A":{"to":"B","n":3,"offered":true},"C":{"to":"D","n":1,"offered":false}}');
});

// ── The day edits, ia_edits_<program> (core/src/engine/state-day-edits.ts, v0.261.6) ──
test('the day edits read empty when nothing or something broken is stored, are stored as their JSON, and a refused write stops nothing', () => {
  assert.deepEqual(readDayEdits(memoryStore(), 'p1'), {});
  assert.deepEqual(readDayEdits(memoryStore({ ia_edits_p1: '{"w1' }), 'p1'), {});
  const s = memoryStore();
  writeDayEdits(s, 'p1', { w1_mon: { add: [], skip: ['Curl'] } });
  assert.equal(s.get('ia_edits_p1'), '{"w1_mon":{"add":[],"skip":["Curl"]}}');
  writeDayEdits(refusing(), 'p1', {});
  assert.deepEqual(addSkipEdit(refusing(), 'p1', 1, 'mon', 'Curl'), { w1_mon: { add: [], skip: ['Curl'] } });
});

test('a movement taken off is stored once under its day, after an empty add list; a superset by its token', () => {
  const s = memoryStore();
  addSkipEdit(s, 'p1', 3, 'tue', 'Hammer curl');
  assert.equal(s.get('ia_edits_p1'), '{"w3_tue":{"add":[],"skip":["Hammer curl"]}}');
  addSkipEdit(s, 'p1', 3, 'tue', 'Hammer curl');
  addSkipEdit(s, 'p1', 3, 'tue', '__ss:2');
  assert.equal(s.get('ia_edits_p1'), '{"w3_tue":{"add":[],"skip":["Hammer curl","__ss:2"]}}');
  const old = memoryStore({ ia_edits_p1: '{"w3_tue":{"skip":["Plank"]}}' });
  addSkipEdit(old, 'p1', 3, 'tue', 'Hammer curl');
  assert.equal(old.get('ia_edits_p1'), '{"w3_tue":{"skip":["Plank","Hammer curl"],"add":[]}}', 'an entry missing a list gains it after the ones it has');
});

test('put back: the name leaves the day\'s skips, and the day\'s key goes with its last edit; a day with none writes nothing', () => {
  const s = countingStore({ ia_edits_p1: '{"w1_mon":{"add":[],"skip":["A","B"]},"w1_tue":{"add":[{"name":"C","detail":"3×10","ts":1}],"skip":["D"]}}' });
  dropSkipEdit(s, 'p1', 1, 'wed', 'A');
  assert.deepEqual(s.writes, []);
  dropSkipEdit(s, 'p1', 1, 'mon', 'A');
  assert.equal(s.get('ia_edits_p1'), '{"w1_mon":{"add":[],"skip":["B"]},"w1_tue":{"add":[{"name":"C","detail":"3×10","ts":1}],"skip":["D"]}}');
  dropSkipEdit(s, 'p1', 1, 'mon', 'B');
  dropSkipEdit(s, 'p1', 1, 'tue', 'D');
  assert.equal(s.get('ia_edits_p1'), '{"w1_tue":{"add":[{"name":"C","detail":"3×10","ts":1}],"skip":[]}}', 'a day keeps its key while an add stands');
});

test('a movement added is stored once by name with its dose and the instant, the first add kept', () => {
  const s = memoryStore();
  addAddEdit(s, 'p1', 1, 'thu', 'Barbell hip thrust', '3×10', 50);
  assert.equal(s.get('ia_edits_p1'), '{"w1_thu":{"add":[{"name":"Barbell hip thrust","detail":"3×10","ts":50}],"skip":[]}}');
  addAddEdit(s, 'p1', 1, 'thu', 'Barbell hip thrust', '4×8', 60);
  addAddEdit(s, 'p1', 1, 'thu', 'Nordic curl', '3×5', 70);
  assert.equal(s.get('ia_edits_p1'),
    '{"w1_thu":{"add":[{"name":"Barbell hip thrust","detail":"3×10","ts":50},{"name":"Nordic curl","detail":"3×5","ts":70}],"skip":[]}}');
});

test('an added movement removed leaves the day\'s adds, and the day\'s key goes with its last edit; a day with none writes nothing', () => {
  const s = countingStore({ ia_edits_p1: '{"w1_thu":{"add":[{"name":"A","detail":"3×10","ts":1},{"name":"B","detail":"3×5","ts":2}],"skip":[]},"w1_fri":{"add":[{"name":"C","detail":"3×8","ts":3}],"skip":["D"]}}' });
  dropAddEdit(s, 'p1', 1, 'sat', 'A');
  assert.deepEqual(s.writes, []);
  dropAddEdit(s, 'p1', 1, 'thu', 'A');
  dropAddEdit(s, 'p1', 1, 'fri', 'C');
  assert.equal(s.get('ia_edits_p1'), '{"w1_thu":{"add":[{"name":"B","detail":"3×5","ts":2}],"skip":[]},"w1_fri":{"add":[],"skip":["D"]}}');
  dropAddEdit(s, 'p1', 1, 'thu', 'B');
  assert.equal(s.get('ia_edits_p1'), '{"w1_fri":{"add":[],"skip":["D"]}}');
});

test('the prune drops every week below the cut, keeps the rest and any other key, and writes only when something went', () => {
  const s = countingStore({ ia_edits_p1: '{"w1_mon":{"add":[],"skip":["A"]},"w2_tue":{"add":[],"skip":["B"]},"w3_wed":{"add":[],"skip":["C"]},"w12_thu":{"add":[],"skip":["D"]},"x":{}}' });
  pruneDayEditsBefore(s, 'p1', 3);
  assert.equal(s.get('ia_edits_p1'), '{"w3_wed":{"add":[],"skip":["C"]},"w12_thu":{"add":[],"skip":["D"]},"x":{}}');
  pruneDayEditsBefore(s, 'p1', 3);
  pruneDayEditsBefore(s, 'p1', 1);
  assert.deepEqual(s.writes, ['ia_edits_p1'], 'one write, the one that dropped something');
});

// ── The program list, the active program and the Wildcard's record (core/src/engine/state-programs.ts, v0.261.6) ──
test('the program list and the Wildcard\'s record read empty when nothing or something broken is stored; the active id reads null for none or an empty one', () => {
  assert.deepEqual(readPrograms(memoryStore()), []);
  assert.deepEqual(readPrograms(memoryStore({ ia_programs: '[{"id"' })), []);
  assert.deepEqual(readWildcardDone(memoryStore(), 'p1'), []);
  assert.deepEqual(readWildcardDone(memoryStore({ ia_wild_p1: '[' }), 'p1'), []);
  assert.equal(readActiveProgramId(memoryStore()), null);
  assert.equal(readActiveProgramId(memoryStore({ ia_active: '' })), null);
  assert.equal(readActiveProgramId(memoryStore({ ia_active: 'prog_1' })), 'prog_1');
});

test('a program list, an active id and a Wildcard record are stored as given; a store that refuses the list or the record throws to the caller', () => {
  const s = memoryStore();
  writePrograms(s, [{ id: 'prog_1', name: 'THE HALF MANNY' }] as unknown as Program[]);
  writeActiveProgramId(s, 'prog_1');
  writeWildcardDone(s, 'prog_1', [{ title: 'Hill sprints', ts: 9, week: 2, dayKey: 'sat' }, { title: 'Ruck', ts: 10, week: null, dayKey: null }]);
  assert.equal(s.get('ia_programs'), '[{"id":"prog_1","name":"THE HALF MANNY"}]');
  assert.equal(s.get('ia_active'), 'prog_1');
  assert.equal(s.get('ia_wild_prog_1'), '[{"title":"Hill sprints","ts":9,"week":2,"dayKey":"sat"},{"title":"Ruck","ts":10,"week":null,"dayKey":null}]');
  assert.deepEqual(readPrograms(s), [{ id: 'prog_1', name: 'THE HALF MANNY' }]);
  assert.deepEqual(readWildcardDone(s, 'prog_2'), [], 'another program has its own record');
  assert.throws(() => writePrograms(refusing(), []), /QuotaExceededError/);
  assert.throws(() => writeWildcardDone(refusing(), 'p1', []), /QuotaExceededError/);
});

test('the page reaches the swaps, the counts, the edits and the program list through core: each rule is in the script once', () => {
  const code = appScript();
  for (const name of ['readSwaps', 'addSwapRecord', 'dropSwapRecord', 'countSwap', 'markSwapNudged', 'readDayEdits', 'addSkipEdit',
    'dropSkipEdit', 'addAddEdit', 'dropAddEdit', 'pruneDayEditsBefore', 'readPrograms', 'readActiveProgramId', 'readWildcardDone']) {
    assert.equal(code.split('function ' + name + '(').length - 1, 1, name + ' is in the page once');
  }
  // One reader and one writer in core. The purge names each key's prefix in its list, without the +.
  for (const key of ["'ia_swaps_'+", "'ia_swapct_'+", "'ia_edits_'+", "'ia_wild_'+"]) {
    assert.equal(code.split(key).length - 1, 2, key + ' is built by its reader and its writer');
  }
  // The moved helpers and the writer the fourth slice left with no caller are gone, not kept as callers of nothing.
  for (const name of ['editStoreKey', 'saveDayEdits', '_editEntry', 'swapStoreKey', 'saveSwaps', 'swapCountKey', 'getSwapCounts', 'saveSwapCounts', 'saveDayHist']) {
    assert.equal(code.split(name + '(').length - 1, 0, name + ' is gone');
  }
});

// These guard behaviour the move must not change: they pass on the release before it too.
test('the page\'s own names still answer as they did: a swap, its undo, the count and the nudge, a skip and an add put back, the prune, the program list, the active id, the Wildcard', () => {
  const IA = loadApp();
  pinClock(IA, 1_800_000_000_000);
  const get = (k: string) => IA.localStorage.getItem(k);
  assert.equal(IA.eval("JSON.stringify(recordSwap('p9',2,'mon','A','B',[{s:0,i:1,d:'4×5'}]))"), '{"w2_mon":[{"from":"A","to":"B","ts":1800000000000,"rx":[{"s":0,"i":1,"d":"4×5"}]}]}');
  assert.equal(get('ia_swaps_p9'), '{"w2_mon":[{"from":"A","to":"B","ts":1800000000000,"rx":[{"s":0,"i":1,"d":"4×5"}]}]}');
  assert.equal(IA.eval("JSON.stringify(getSwaps('p9'))"), get('ia_swaps_p9'));
  IA.eval("clearSwap('p9',2,'mon','A')");
  assert.equal(get('ia_swaps_p9'), '{}');
  assert.deepEqual([IA.eval("bumpSwapCount('p9','A','B')"), IA.eval("bumpSwapCount('p9','A','B')")], [null, null]);
  assert.equal(IA.eval("JSON.stringify(bumpSwapCount('p9','A','B'))"), '{"to":"B","n":3,"offered":false}');
  IA.eval("markSwapOffered('p9','A')");
  assert.equal(get('ia_swapct_p9'), '{"A":{"to":"B","n":3,"offered":true}}');
  IA.eval("recordSkip('p9',2,'mon','Curl');recordAdd('p9',2,'mon','Hip thrust','3×10');recordSkip('p9',4,'tue','Row');");
  assert.equal(get('ia_edits_p9'), '{"w2_mon":{"add":[{"name":"Hip thrust","detail":"3×10","ts":1800000000000}],"skip":["Curl"]},"w4_tue":{"add":[],"skip":["Row"]}}');
  assert.equal(IA.eval("JSON.stringify(getDayEdits('p9'))"), get('ia_edits_p9'));
  IA.eval("clearSkip('p9',2,'mon','Curl');clearAdd('p9',2,'mon','Hip thrust');");
  assert.equal(get('ia_edits_p9'), '{"w4_tue":{"add":[],"skip":["Row"]}}');
  IA.eval("pruneDayEdits('p9',5)");
  assert.equal(get('ia_edits_p9'), '{}');
  IA.eval("savePrograms([{id:'p9',name:'X'}]);setActiveProgId('p9');activeProgId='p9';saveWildcardDone([{title:'Ruck',ts:1,week:null,dayKey:null}]);");
  assert.deepEqual([get('ia_programs'), get('ia_active'), get('ia_wild_p9')], ['[{"id":"p9","name":"X"}]', 'p9', '[{"title":"Ruck","ts":1,"week":null,"dayKey":null}]']);
  assert.deepEqual([IA.eval('JSON.stringify(getPrograms())'), IA.eval('getActiveProgId()'), IA.eval('JSON.stringify(getWildcardDone())')],
    ['[{"id":"p9","name":"X"}]', 'p9', '[{"title":"Ruck","ts":1,"week":null,"dayKey":null}]']);
});

// ── What Progress reads and computes from the stored state (core/src/engine/state-progress.ts, v0.261.7), the run card's
// regime (state-day-log.ts) and the nudge's preference (state-programs.ts). Every value is typed from the ruling and
// PACE_CHART's rows. ──
const DAY = 86_400_000;
const hist = (h: Record<string, unknown>): DayHistory => h as unknown as DayHistory;
const runDay = (subtype: string, dose?: Record<string, unknown>, type = 'run') => ({ cardio: { type, subtype, ...(dose ? { dose } : {}) } });

test('the constants: a 21-day window, three runs, RPE 3 to 4, and the five classes in order', () => {
  assert.deepEqual([SEED_WINDOW_DAYS, SEED_MIN_RUNS, EASY_RPE_LO, EASY_RPE_HI], [21, 3, 3, 4]);
  assert.deepEqual(RUN_CLASS_ORDER, ['Recovery', 'Easy', 'Long', 'Tempo', 'Interval']);
});

test('a pace reads as seconds a mile, and the pace table walks both ways, clamped at its edges', () => {
  assert.deepEqual(['10:26/mi', ' 7:30 ', '7:3', 'abc', '', null].map(paceSeconds), [626, 450, null, null, null, null]);
  assert.deepEqual([400, 420, 437.5, 630, 870, 900, 0].map(mileFromRecoveryPace), [300, 300, 315, 480, 720, 720, null]);
  assert.deepEqual([280, 300, 315, 720, 800, 0].map(halfFromMilePace), [4680, 4680, 4890, 11100, 11100, null]);
});

test('a run\'s class comes from its session name, long intervals as tempo and benchmarks as none', () => {
  const names = ['', 'Benchmark Run', 'Recovery Run', 'Long Interval (LI)', 'Speed Run — Intervals', 'Speed Run — Tempo', 'Tempo Run',
    'Easy Run — Long', 'Easy Run', 'Strides', null];
  assert.deepEqual(names.map(runClassOf), [null, null, 'Recovery', 'Tempo', 'Interval', 'Interval', 'Tempo', 'Long', 'Easy', null, null]);
});

test('a recovery run counts with its week, pace and target; swapped, out of the program, unsnapshotted, on a bike or not recovery, it does not', () => {
  const H = hist({
    w2_tue: runDay('Recovery Run', { k: 'time', tgt: 800 }), w2_wed: runDay('Recovery Ride', undefined, 'bike'), w2_thu: runDay('Easy Run'),
    w2_fri: runDay('Recovery Run', { k: 'time', tgt: 0 }), w15_tue: runDay('Recovery Run'),
  });
  const e = { run_pace: '10:00/mi' };
  assert.deepEqual(recoveryPaceEntry('w2_tue', e, H, 14), { w: 2, sec: 600, tgt: 800 });
  assert.deepEqual(recoveryPaceEntry('w2_fri', e, H, 14), { w: 2, sec: 600, tgt: null }, 'a target of 0 is none');
  assert.equal(recoveryPaceEntry('w2_tue', { ...e, swapTo: 'bike' }, H, 14), null);
  assert.equal(recoveryPaceEntry('w15_tue', e, H, 14), null, 'past the program\'s weeks');
  assert.equal(recoveryPaceEntry('w2_mon', e, H, 14), null, 'no snapshot');
  assert.equal(recoveryPaceEntry('w2_wed', e, H, 14), null, 'a ride');
  assert.equal(recoveryPaceEntry('w2_thu', e, H, 14), null, 'an easy run');
  assert.equal(recoveryPaceEntry('w2_tue', {}, H, 14), null, 'no pace');
  assert.equal(recoveryPaceEntry('w2_tue', { run_pace: '0:00' }, H, 14), null, 'a zero pace');
  assert.equal(recoveryPaceEntry('w2_tue', null, H, 14), null);
  assert.equal(recoveryPaceEntry('notes', e, H, 14), null, 'a key that is not a day');
});

test('the recovery pace by week is each week\'s mean, the target the mean of the targets', () => {
  const H = hist({ w1_tue: runDay('Recovery Run', { k: 'time', tgt: 800 }), w1_fri: runDay('Recovery Run', { k: 'time', tgt: 800 }), w2_tue: runDay('Recovery Run', { k: 'time', tgt: 770 }) });
  const L = { w1_tue: { run_pace: '10:00/mi' }, w1_fri: { run_pace: '10:20/mi' }, w2_tue: { run_pace: '10:40/mi' } };
  assert.deepEqual(recoveryPaceByWeek(L, H, 14), { weekly: { 1: 610, 2: 640 }, tgt: 790, nWeeks: 2 });
  assert.deepEqual(recoveryPaceByWeek({}, H, 14), { weekly: {}, tgt: null, nWeeks: 0 });
  assert.deepEqual(recoveryPaceByWeek(null, null, 14), { weekly: {}, tgt: null, nWeeks: 0 });
});

test('the longest run of a week takes a rest-day jog as one more run, never a sum, and leaves out the cut week and, asked, week 1', () => {
  const L = {
    w1_mon: { run_dist: '3.1' }, w1_wed: { run_dist: '5' }, w1_sat: { restLog: { run: { dist: 6 } } }, w2_tue: { run_dist: '4' },
    w3_thu: { run_dist: '7.5' }, w3_fri: { run_dist: '0' }, w15_mon: { run_dist: '9' }, notes: { run_dist: '9' },
  };
  assert.deepEqual(longestRunByWeek(L, 14, 0, false), { 1: 6, 2: 4, 3: 7.5 });
  assert.deepEqual(longestRunByWeek(L, 14, 2, false), { 1: 6, 3: 7.5 });
  assert.deepEqual(longestRunByWeek(L, 14, 0, true), { 2: 4, 3: 7.5 });
});

test('runs by class: one dot per run with a pace and a class, swapped and unclassed runs left out; the easy effort keeps RPE 3 and 4 on recovery and easy runs', () => {
  const H = hist({
    w1_mon: runDay('Speed Run — Intervals'), w1_tue: runDay('Recovery Run'), w1_thu: runDay('Easy Run'), w1_fri: runDay('Recovery Run'),
    w1_sat: runDay('Long Run'), w1_sun: runDay('Benchmark Run'), w2_tue: runDay('Recovery Run'), w2_thu: runDay('Easy Run'),
  });
  const L = {
    w1_mon: { run_pace: '8:00' }, w1_tue: { run_pace: '10:00', rpe: '3' }, w1_thu: { run_pace: '9:40', rpe: '4' }, w1_fri: { run_pace: '9:00', rpe: '5' },
    w1_sat: { run_pace: '9:10', rpe: '3' }, w1_sun: { run_pace: '8:30' }, w2_tue: { run_pace: '10:20', rpe: 3 }, w2_thu: { run_pace: '9:50', rpe: '' },
    w2_mon: { run_pace: '9:40' }, w2_wed: { run_pace: '9:40', swapTo: 'bike' },
  };
  const by = runPacesByClass(L, H, 14);
  assert.deepEqual(Object.keys(by), ['Recovery', 'Easy', 'Long', 'Tempo', 'Interval']);
  assert.deepEqual(by, {
    Recovery: [{ w: 1, sec: 600 }, { w: 1, sec: 540 }, { w: 2, sec: 620 }], Easy: [{ w: 1, sec: 580 }, { w: 2, sec: 590 }],
    Long: [{ w: 1, sec: 550 }], Tempo: [], Interval: [{ w: 1, sec: 480 }],
  });
  assert.deepEqual(easyPaceByWeek(L, H, 14), { weekly: { 1: 590, 2: 620 }, nRuns: 3, nWeeks: 2 });
});

test('planned and logged miles pair each distance-dosed run with its log; a swapped day, a timed run and a ride are out', () => {
  const H = hist({
    w1_mon: runDay('Easy Run', { k: 'dist', mi: 3 }), w1_wed: runDay('Tempo Run', { k: 'dist', mi: 2 }), w1_fri: runDay('Long Run', { k: 'time', mins: 60 }),
    w1_sat: runDay('Easy Run', { k: 'dist', mi: 4 }), w2_mon: runDay('Easy Run', { k: 'dist', mi: 3.5 }), w2_tue: runDay('Ride', { k: 'dist', mi: 10 }, 'bike'),
  });
  const L = { w1_mon: { run_dist: '3.5' }, w1_sat: { run_dist: '4', swapTo: 'bike' }, w2_mon: { run_dist: '3' } };
  assert.deepEqual(plannedAndLoggedMiles(L, H, 14, 0, false), { 1: { presc: 5, act: 3.5 }, 2: { presc: 3.5, act: 3 } });
  assert.deepEqual(plannedAndLoggedMiles(L, H, 14, 2, false), { 1: { presc: 5, act: 3.5 } });
  assert.deepEqual(plannedAndLoggedMiles(L, H, 14, 0, true), { 2: { presc: 3.5, act: 3 } });
});

test('a program\'s week at an instant, and the week Progress holds back: the week in progress, never the last one', () => {
  const p = { startDate: '2026-08-31', totalWeeks: 14 } as unknown as Program;
  const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
  const both = (when: number) => [programWeekAt(p, when), progressCutWeek(p, when)];
  assert.deepEqual(both(at(2026, 8, 30)), [0, 0], 'the day before the start');
  assert.deepEqual(both(at(2026, 8, 31, 0)), [1, 1], 'the first Monday at midnight');
  assert.deepEqual(both(at(2026, 9, 23)), [4, 4]);
  assert.deepEqual(both(at(2026, 11, 25)), [13, 13]);
  assert.deepEqual(both(at(2026, 12, 6)), [14, 0], 'race day: the last week, never cut');
  assert.deepEqual(both(at(2026, 12, 10)), [14, 0], 'after the program: its last week');
  assert.equal(programWeekAt({ startDate: '2026-08-31' } as unknown as Program, at(2026, 12, 10)), 6, 'a program with no length counts six weeks');
  assert.deepEqual([programWeekAt({ startDate: null } as unknown as Program, at(2026, 9, 23)), programWeekAt(null, at(2026, 9, 23)), progressCutWeek(null, at(2026, 9, 23))], [0, 0, 0]);
});

test('the seed: the program whose qualifying runs are latest, three or more inside 21 days and none after the instant', () => {
  const now = 1_800_000_000_000;
  const rec = (ks: string[]) => JSON.stringify(Object.fromEntries(ks.map((k) => [k, runDay('Recovery Run')])));
  const A = {
    ia_logs_a: JSON.stringify({
      w3_tue: { run_pace: '10:00/mi', run_dist: '4', ts: now - 20 * DAY }, w3_fri: { run_pace: '10:30/mi', run_dist: '5', ts: now - 10 * DAY },
      w4_tue: { run_pace: '11:00/mi', run_dist: '3', ts: now - 2 * DAY, restLog: { run: { dist: 6.2 } } },
      w1_tue: { run_pace: '9:00/mi', run_dist: '8', ts: now - 30 * DAY }, w5_tue: { run_pace: '9:00/mi', run_dist: '9', ts: now + DAY },
    }),
    ia_hist_a: rec(['w1_tue', 'w3_tue', 'w3_fri', 'w4_tue', 'w5_tue']),
  };
  const B = {
    ia_logs_b: JSON.stringify({ w2_mon: { run_pace: '9:20', ts: now - 5 * DAY }, w2_wed: { run_pace: '9:20', ts: now - 3 * DAY }, w2_fri: { run_pace: '9:20', ts: now - DAY } }),
    ia_hist_b: rec(['w2_mon', 'w2_wed', 'w2_fri']),
  };
  const C = { ia_logs_c: JSON.stringify({ w1_mon: { run_pace: '9:20', ts: now - DAY }, w1_wed: { run_pace: '9:20', ts: now - DAY } }), ia_hist_c: rec(['w1_mon', 'w1_wed']) };
  const programs = (ids: [string, string?][]) => JSON.stringify(ids.map(([id, name]) => ({ id, ...(name ? { name } : {}), totalWeeks: 14 })));
  assert.deepEqual(seedFromStoredPrograms(memoryStore({ ia_programs: programs([['a', 'Block A'], ['c', 'Block C']]), ...A, ...C }), now),
    { progId: 'a', progName: 'Block A', latest: now - 2 * DAY, n: 3, avgRecSec: 630, mileSec: 480, maxDist: 6.2 });
  assert.deepEqual(seedFromStoredPrograms(memoryStore({ ia_programs: programs([['a', 'Block A'], ['b'], ['c', 'Block C']]), ...A, ...B, ...C }), now),
    { progId: 'b', progName: 'previous block', latest: now - DAY, n: 3, avgRecSec: 560, mileSec: 420, maxDist: null }, 'the latest wins, a program with no name is the previous block');
  assert.equal(seedFromStoredPrograms(memoryStore({ ia_programs: programs([['c', 'Block C']]), ...C }), now), null, 'two runs seed nothing');
  assert.equal(seedFromStoredPrograms(memoryStore(), now), null);
  assert.equal(seedFromStoredPrograms(memoryStore({ ia_programs: '[{' }), now), null);
});

test('the delete warning: only when another program exists and this one\'s lift log holds a lift', () => {
  const lifted = '{"back_squat":{"name":"Back squat","entries":[]}}';
  assert.equal(liftLogFeedsOthers(memoryStore({ ia_programs: '[{"id":"a"}]', ia_exw_a: lifted }), 'a'), false, 'no other program');
  const two = (exw: string) => memoryStore({ ia_programs: '[{"id":"a"},{"id":"b"}]', ia_exw_a: exw });
  assert.deepEqual([liftLogFeedsOthers(two(lifted), 'a'), liftLogFeedsOthers(two(lifted), 'b'), liftLogFeedsOthers(two('{}'), 'a'), liftLogFeedsOthers(two('{'), 'a')],
    [true, false, false, false]);
  assert.equal(liftLogFeedsOthers(memoryStore(), 'a'), false);
});

test('the run card is logged for a sport when the entry holds a value in one of its fields; "0.00" is a value, the number 0 is not', () => {
  assert.deepEqual([
    cardioEntryLogged({ run_pace: '9:00' }, 'run'), cardioEntryLogged({ run_dist: '0.00' }, 'run'), cardioEntryLogged({ bike_mins: '40' }, 'bike'),
    cardioEntryLogged({ swim_yards: '800' }, 'swim'), cardioEntryLogged({ bike_mins: '40' }, 'run'), cardioEntryLogged({ run_dist: 0 } as unknown as StoredDayEntry, 'run'),
    cardioEntryLogged({ notes: 'easy' }, 'run'), cardioEntryLogged({ run_pace: '9:00' }, ''), cardioEntryLogged(null, 'run'),
  ], [true, true, true, true, false, false, false, false, false]);
});

test('the nudge taken: the pair joins the program\'s preferences and the list is written; a missing program or one with no config writes nothing', () => {
  const s = countingStore({ ia_programs: '[{"id":"a","cfg":{"seed":1,"exSwapPrefs":{"Bench press":"Floor press"}}},{"id":"b","cfg":{"seed":2}},{"id":"c"}]' });
  const p = recordSwapPreference(s, 'a', 'Back squat', 'Front squat');
  assert.deepEqual(p && p.cfg.exSwapPrefs, { 'Bench press': 'Floor press', 'Back squat': 'Front squat' });
  assert.equal(s.get('ia_programs'), '[{"id":"a","cfg":{"seed":1,"exSwapPrefs":{"Bench press":"Floor press","Back squat":"Front squat"}}},{"id":"b","cfg":{"seed":2}},{"id":"c"}]');
  assert.equal(recordSwapPreference(s, 'z', 'Back squat', 'Front squat'), null);
  assert.equal(recordSwapPreference(s, 'c', 'Back squat', 'Front squat'), null);
  assert.deepEqual(s.writes, ['ia_programs'], 'one write, the first');
  assert.deepEqual(recordSwapPreference(countingStore({ ia_programs: '[{"id":"b","cfg":{"seed":2}}]' }), 'b', 'Row', 'Pull-up')!.cfg.exSwapPrefs, { Row: 'Pull-up' });
});

test('the page reaches what Progress reads, the run card\'s regime and the nudge\'s write through core: each rule is in the script once', () => {
  const code = appScript();
  for (const name of ['seedFromStoredPrograms', 'liftLogFeedsOthers', 'recoveryPaceEntry', 'recoveryPaceByWeek', 'longestRunByWeek', 'runPacesByClass',
    'easyPaceByWeek', 'plannedAndLoggedMiles', 'programWeekAt', 'progressCutWeek', 'runClassOf', 'paceSeconds', 'mileFromRecoveryPace',
    'halfFromMilePace', 'cardioEntryLogged', 'recordSwapPreference']) {
    assert.equal(code.split('function ' + name + '(').length - 1, 1, name + ' is in the page once');
  }
  for (const rule of ['SEED_WINDOW_DAYS*86400000', "if(/\\(LI\\)|long interval/i.test(s)) return 'Tempo';", 'p.cfg.exSwapPrefs[from]=to;', 'return !!e&&(CARDIO_PARK_FIELDS[sport]||[]).some(']) {
    assert.equal(code.split(rule).length - 1, 1, rule + ' is in the page once');
  }
  // The two the move left with no caller are gone, not kept as callers of nothing.
  for (const name of ['_recoveryPaceEntry', '_progWeekNow']) assert.equal(code.split(name + '(').length - 1, 0, name + ' is gone');
});

// These guard behaviour the move must not change: they pass on the release before it too.
test('the page\'s own names still answer as they did: the seed, the warning, the five readers, the week held back, the class, the pace and the table, the run card', () => {
  const IA = loadApp();
  const now = pinClock(IA, new Date(2026, 8, 23, 12));
  const set = (k: string, v: unknown) => IA.localStorage.setItem(k, JSON.stringify(v));
  set('ia_programs', [{ id: 'p1', name: 'Block', totalWeeks: 14, startDate: '2026-08-31' }, { id: 'p2', totalWeeks: 8 }]);
  set('ia_logs_p1', { w1_tue: { run_pace: '10:10/mi', run_dist: '3', rpe: '3', ts: now - 8 * DAY }, w1_fri: { run_pace: '10:30/mi', run_dist: '3.5', rpe: '4', ts: now - 5 * DAY },
    w2_tue: { run_pace: '10:50/mi', run_dist: '4', rpe: '3', ts: now - DAY } });
  set('ia_hist_p1', { w1_tue: runDay('Recovery Run', { k: 'time', tgt: 800 }), w1_fri: runDay('Recovery Run', { k: 'dist', mi: 3, tgt: 800 }), w2_tue: runDay('Recovery Run', { k: 'time', tgt: 770 }) });
  set('ia_exw_p1', { back_squat: { name: 'Back squat', entries: [] } });
  const J = (code: string) => JSON.parse(IA.eval('JSON.stringify(' + code + ')'));
  assert.deepEqual(J('seedFromPriorPrograms(' + now + ')'), { progId: 'p1', progName: 'Block', latest: now - DAY, n: 3, avgRecSec: 630, mileSec: 480, maxDist: 4 });
  assert.deepEqual(J('seedFromPriorPrograms()'), J('seedFromPriorPrograms(' + now + ')'), 'no instant reads the clock');
  assert.deepEqual([IA.eval("_purgeWarnsCrossProg('p1')"), IA.eval("_purgeWarnsCrossProg('p2')")], [true, false]);
  const L = "getLogsFor('p1')", H = "getDayHistFor('p1')";
  assert.deepEqual(J(`recoveryPaceWeekly(${L},${H},14)`), { weekly: { 1: 620, 2: 650 }, tgt: 790, nWeeks: 2 });
  assert.deepEqual(J(`ladderWeekly(${L},14,2,false)`), { 1: 3.5 });
  assert.deepEqual(J(`runsByClass(${L},${H},14)`).Recovery, [{ w: 1, sec: 610 }, { w: 1, sec: 630 }, { w: 2, sec: 650 }]);
  assert.deepEqual(J(`easyEffortWeekly(${L},${H},14)`), { weekly: { 1: 620, 2: 650 }, nRuns: 3, nWeeks: 2 });
  assert.deepEqual(J(`plannedVsLogged(${L},${H},14,0,false)`), { 1: { presc: 3, act: 3.5 } });
  assert.equal(IA.eval('_cutWeek(getPrograms()[0])'), 4);
  assert.deepEqual([IA.eval("_runClass('Easy Run — Long')"), IA.eval("_paceStrToSec('10:26/mi')"), IA.eval('_mileFromRecoverySec(630)'), IA.eval('_halfFromMileSec(315)')],
    ['Long', 626, 480, 4890]);
  assert.deepEqual([IA.eval("cardioEntryLive({run_dist:'0.00'},'run')"), IA.eval("cardioEntryLive({bike_mins:'40'},'run')")], [true, false]);
});
