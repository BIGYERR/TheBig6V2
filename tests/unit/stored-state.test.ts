// Stored state, the logic in @ia/core (docs/decisions/stored-state.md), imported and run alone: the store the app's
// state sits behind (core/src/engine/state-store.ts, v0.261.2) with the page's one use of the browser's storage, and
// the lift log (core/src/engine/state-lift-log.ts, v0.261.3). Every expected value is typed from the ruling. What the app stores
// through it is held by tests/integration/stored-state.test.ts and the sweeps.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { memoryStore, storageStore } from '@ia/core/engine/state-store.ts';
import type { StorageLike } from '@ia/core/engine/state-store.ts';
import { dedupeExDayEntries, entryDay, readLiftLog, recordLift, weeklyBest, writeLiftLog } from '@ia/core/engine/state-lift-log.ts';
import type { LiftEntry, LiftLog, LiftRecord } from '@ia/core/engine/state-lift-log.ts';
import { appScript, loadApp } from '../support/app.ts';

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
