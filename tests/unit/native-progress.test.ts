// The Expo app's Progress (MIGRATION.md phase 3, row 4), by rule. Every expected value here is typed by hand from the
// rule's own ruling (D11 main by slot and main if ever, V196 D57, D58 and D59, V194 D55, D255 and its amendment, D26,
// V156 the chips and the archived bar, V169 the delete on Progress, D289 the beta's own store) or from the page's
// code the port follows line for line. tests/integration/native-progress.test.ts and the sweep of that name hold the
// same screen equal to today's page on real programs; this file holds each rule where a hand can check it.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { type StateStore, memoryStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import { blockStyle, blockType, markupBlocks } from '../../frontends/native/src/progress/card-markup.ts';
import { ledgerView } from '../../frontends/native/src/progress/charts/ledger-model.ts';
import type { SvgEl } from '../../frontends/native/src/progress/charts/chart-card-model.ts';
import { paint, pictureBox, svgProps } from '../../frontends/native/src/progress/paint.ts';
import {
  EASY_MIN_RUNS, EASY_ZONE_MIN_RUNS, type Hist, type LedgerLog, RACE_DIST_MI, easyVsPrescribed, ledgerModel, partialWeek1, rxRangeFor, setsOf, slotOfEntry,
} from '../../frontends/native/src/progress/progress-readers.ts';
import {
  DRAWN, afterDelete, askPurge, cancelConfirm, estimateLine, estimatorUnit, markupParts, newProgressState, openProgress, progressView, setCalcLift, showProgram,
} from '../../frontends/native/src/progress/progress-screen.ts';
import { PURGE_FAMILIES, cleanLiftLog, deleteProgram, restoreProgram } from '../../frontends/native/src/progress/progress-writes.ts';
import { DAY, NIGHT } from '../../frontends/native/src/theme.ts';

const NATIVE = join(REPO, 'frontends/native/src');
const TODAY = join(REPO, 'frontends/app/src/app/screens/progress');
const read = (f: string): string => readFileSync(join(NATIVE, f), 'utf8');
const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const NOW = new Date(2026, 8, 23, 8, 0, 0).getTime();   // a Wednesday, the fourth week from 2026-08-31
const icon = (n: string, s: number): string => '[' + n + '/' + s + ']';

/** A frozen day: a Main section whose first item is the day's main lift, then an accessory section. */
const card = (main: string, mainDetail: string, acc: [string, string][] = []) => ({ sections: [{ label: 'Main Lift', items: [{ name: main, detail: mainDetail }] }, { label: 'Accessory', items: acc.map(([name, detail]) => ({ name, detail })) }] });
const en = (week: number, day: string, weight: number | string, setsDone: number[], setsReps = '', ts = week) => ({ week, day, weight, setsDone, setsReps, ts });

describe('native progress: the models are today\'s files', () => {
  for (const f of ['progress-model.ts', 'program-chips-model.ts', 'charts/dot-chart-model.ts', 'charts/chart-card-model.ts', 'charts/run-charts-model.ts', 'charts/ledger-model.ts']) {
    test(f + ' in frontends/native is frontends/app\'s, byte for byte', () => {
      const today = readFileSync(join(TODAY, f));
      const copy = readFileSync(join(NATIVE, 'progress', f));
      assert.ok(today.length > 1500);
      assert.ok(copy.equals(today), f + ' differs from today\'s: copy it again (cp), never edit the copy');
    });
  }
});

describe('native progress: the Lift Ledger\'s rows (ledgerModel)', () => {
  test('a lift is main by its slot, item 0 of a Main section, and an accessory anywhere else (D11)', () => {
    const hist: Hist = { w1_mon: card('Back squat', '4×5', [['Dumbbell bench press', '3×8–12']]), w1_wed: { sections: [{ label: 'Main Lift', items: [{ name: 'Bench press', detail: '4×5' }, { name: 'Back squat', detail: '3×5' }] }] } };
    assert.equal(slotOfEntry(hist, 'Back squat', en(1, 'mon', 185, [5])), 'main');
    assert.equal(slotOfEntry(hist, 'Dumbbell bench press', en(1, 'mon', 50, [10])), 'accessory');
    assert.equal(slotOfEntry(hist, 'Back squat', en(1, 'wed', 185, [5])), 'accessory', 'second in a Main section is not the main slot');
    assert.equal(slotOfEntry(hist, 'Back squat', en(2, 'mon', 185, [5])), null, 'no frozen card for that day');
    assert.equal(slotOfEntry(hist, 'Back squat', { week: 1, weight: 185 }), null, 'an entry with no day cannot be placed');
    assert.equal(slotOfEntry(hist, 'Goblet squat', en(1, 'mon', 40, [10])), null, 'not on the card');
    const twice: Hist = { w1_fri: card('Back squat', '4×5', [['Back squat', '2×10']]) };
    assert.equal(slotOfEntry(twice, 'Back squat', en(1, 'fri', 185, [5])), 'main', 'the main lift again as a back-off set is still the main lift');
  });
  test('main if ever: one main day makes the lift a main lift, its line reads only main days, and every session lands in one of three numbers (D11, V167, D58)', () => {
    const hist: Hist = { w1_mon: card('Bench press', '4×5'), w2_mon: card('Bench press', '4×5'), w1_thu: card('Overhead press', '4×5', [['Bench press', '3×8']]), w3_mon: card('Bench press', '4×5') };
    const exw: LedgerLog = { 'bench-press': { name: 'Bench press', entries: [en(3, 'mon', '', [5, 5]), en(2, 'mon', 140, [5, 5, 5, 5]), en(1, 'thu', 95, [8, 8, 8], '', 1.5), en(1, 'mon', 135, [5, 5, 5, 4])] } };   // stored latest first
    const m = ledgerModel(exw, hist);
    assert.equal(m.mains.length, 1);
    const b = m.mains[0]!;
    assert.deepEqual(b.series, [{ w: 1, v: 135 }, { w: 2, v: 140 }], 'the accessory day and the blank load are off the line, and the line runs by week whatever order the store holds');
    assert.deepEqual([b.plotted, b.accessoryDay, b.noLoad, b.entries], [2, 1, 1, 4]);
    assert.equal(b.plotted + b.accessoryDay + b.noLoad, b.entries);
    assert.deepEqual(b.heavy, { v: 140, reps: 5, week: 2 });
    assert.deepEqual(b.first, { v: 135, reps: 5, week: 1 });
    assert.deepEqual([m.ladder.length, m.plain.length, m.unloaded.length], [0, 0, 0], 'a main lift is in no other bucket');
  });
  test('a main lift with every load blank is a reps block, never dropped (V196 D57)', () => {
    const hist: Hist = { w1_mon: card('Pull-up', '4×8'), w2_mon: card('Pull-up', '4×8') };
    const m = ledgerModel({ 'pull-up': { name: 'Pull-up', entries: [en(1, 'mon', '', [8, 8, 7]), en(2, 'mon', '', [10, 9, 9])] } }, hist);
    assert.equal(m.mains[0]!.mode, 'reps');
    assert.deepEqual(m.mains[0]!.series, [{ w: 1, v: 8 }, { w: 2, v: 10 }]);
    assert.deepEqual(m.mains[0]!.heavy, { v: 10, reps: null, week: 2 });
    assert.equal(m.unloaded.length, 0);
  });
  test('the range that sends a lift to the Range Ladder is the latest session\'s that carries one; ready is every set at the top (V194 D55)', () => {
    const hist: Hist = {
      w1_mon: card('Back squat', '4×5', [['Dumbbell row', '3×8–12'], ['Face pull', '3×12–15'], ['Cable row', '3×8–12']]),
      w2_mon: card('Back squat', '4×5', [['Dumbbell row', '3×8–12'], ['Face pull', '3×12–15'], ['Cable row', '3×8–12']]),
      w3_mon: card('Back squat', '3×3', [['Dumbbell row', '2×6']]),
    };
    const exw: LedgerLog = {
      row: { name: 'Dumbbell row', entries: [en(1, 'mon', 50, [10, 9, 8]), en(2, 'mon', 55, [12, 12, 12]), en(3, 'mon', 55, [6, 6])] },
      face: { name: 'Face pull', entries: [en(1, 'mon', 30, [15, 15, 15]), en(2, 'mon', 30, [15, 15, 15])] },
      cable: { name: 'Cable row', entries: [en(1, 'mon', 100, [10, 9, 9]), en(2, 'mon', 100, [12, 10])] },
    };
    const m = ledgerModel(exw, hist);
    assert.deepEqual(m.ladder.map((r) => r.name), ['Face pull', 'Dumbbell row', 'Cable row'], 'the ready lift first, then the most sessions');
    assert.equal(m.ladder[2]!.ready, false, 'one set at the top of the range is not every set');
    const row = m.ladder[1]!;
    assert.deepEqual([row.lo, row.hi, row.wt, row.ups, row.sessions, row.ready], [8, 12, 55, 1, 3, false], 'week 3 is a primer with no range: week 2\'s 8 to 12 stands');
    assert.deepEqual(row.sets, [6, 6], 'the sets are the last session\'s');
    assert.equal(m.ladder[0]!.ready, true);
  });
  test('a loaded lift with no range anywhere is Other Accessory Work with its lightest and heaviest load; one with no load is counted in reps', () => {
    const day = card('Back squat', '4×5', [['Farmer carry', '3×40 m'], ['Plank', '3×45 s']]);
    const hist: Hist = { w1_mon: day, w2_mon: day, w3_mon: day };
    const m = ledgerModel({
      carry: { name: 'Farmer carry', entries: [en(1, 'mon', '', [], '3×40'), en(2, 'mon', 70, [], '3×40'), en(3, 'mon', 80, [], '3×40')] },   // week 1's load left blank
      plank: { name: 'Plank', entries: [en(1, 'mon', '', [45, 45, 40]), en(2, 'mon', '', [50, 50])] },
    }, hist);
    assert.deepEqual(m.plain, [{ name: 'Farmer carry', wt: 80, sets: [40], sessions: 3, range: [70, 80] }], 'the blank load is a session, and no lift\'s lightest');
    assert.deepEqual(m.unloaded, [{ name: 'Plank', sessions: 2, reps: 230 }]);
  });
  test('the other lifts and the lifts with no load are each listed by sessions, most first, whatever order the store holds', () => {
    const acc: [string, string][] = [['Farmer carry', '3×40 m'], ['Sled push', '4×20 m'], ['Plank', '3×45 s'], ['Dead hang', '3×30 s']];
    const hist: Hist = { w1_mon: card('Back squat', '4×5', acc), w2_mon: card('Back squat', '4×5', acc), w3_mon: card('Back squat', '4×5', acc) };
    const m = ledgerModel({
      carry: { name: 'Farmer carry', entries: [en(1, 'mon', 70, [], '3×40')] },
      sled: { name: 'Sled push', entries: [en(1, 'mon', 90, [], '4×20'), en(2, 'mon', 90, [], '4×20')] },
      plank: { name: 'Plank', entries: [en(1, 'mon', '', [45, 45])] },
      hang: { name: 'Dead hang', entries: [en(1, 'mon', '', [30]), en(2, 'mon', '', [30]), en(3, 'mon', '', [30])] },
    }, hist);
    assert.deepEqual(m.plain.map((r) => [r.name, r.sessions]), [['Sled push', 2], ['Farmer carry', 1]]);
    assert.deepEqual(m.unloaded.map((r) => [r.name, r.sessions]), [['Dead hang', 3], ['Plank', 1]]);
  });
  test('an entry\'s sets are the reps done, else the number its prescription ends in; a range is read only where the top is above the bottom', () => {
    assert.deepEqual(setsOf(en(1, 'mon', 100, [8, 0, 7])), [8, 7]);
    assert.deepEqual(setsOf(en(1, 'mon', 100, [], '3×10')), [10]);
    assert.deepEqual(setsOf(null), []);
    const hist: Hist = { w1_mon: card('Back squat', '4×5', [['Curl', '3×8–12 @ RPE 8'], ['Dip', '3×10-10'], ['Row', '3x6-8']]) };
    assert.deepEqual(rxRangeFor(hist, 'Curl', en(1, 'mon', 30, [8])), { sets: 3, lo: 8, hi: 12 });
    assert.equal(rxRangeFor(hist, 'Dip', en(1, 'mon', 0, [10])), null);
    assert.deepEqual(rxRangeFor(hist, 'Row', en(1, 'mon', 60, [8])), { sets: 3, lo: 6, hi: 8 }, 'a plain x and a hyphen read too');
    assert.equal(rxRangeFor(hist, 'Back squat', en(1, 'mon', 185, [5])), null, 'fixed reps carry no range');
  });
  test('the four main hinges are one Deadlift line, each variant tagged, and "up" only compares one lift with itself (D255)', () => {
    // docs/decisions/progress.md, D255, expected values.
    const hist: Hist = { w1_mon: card('Barbell Romanian deadlift', '3×8'), w2_mon: card('Barbell Romanian deadlift', '3×8'), w3_mon: card('Trap bar deadlift', '3×10'), w9_mon: card('Deadlift', '3×8'), w10_mon: card('Deadlift', '3×8'), w1_wed: card('Bench press', '4×5') };
    // Stored latest first, so the line's order is the weeks', not the store's.
    const exw: LedgerLog = {
      dl: { name: 'Deadlift', entries: [en(9, 'mon', 185, [8, 8, 8])] },
      trap: { name: 'Trap bar deadlift', entries: [en(3, 'mon', 155, [10, 10, 10])] },
      rdl: { name: 'Barbell Romanian deadlift', entries: [en(1, 'mon', 95, [8, 8, 8]), en(2, 'mon', 95, [8, 8, 8])] },
      bench: { name: 'Bench press', entries: [en(1, 'wed', 135, [5, 5])] },
    };
    const m = ledgerModel(exw, hist);
    assert.deepEqual(m.mains.map((x) => x.name), ['Deadlift', 'Bench press'], 'one Deadlift block, the longer line first; the press keeps its own');
    const d = m.mains[0]!;
    assert.deepEqual(d.series, [{ w: 1, v: 95, tag: 'RDL' }, { w: 2, v: 95, tag: 'RDL' }, { w: 3, v: 155, tag: 'Trap bar' }, { w: 9, v: 185, tag: null }]);
    assert.deepEqual([d.plotted, d.entries], [4, 4]);
    const block = ledgerView(m, 'lbs', icon).mains!.blocks[0]!;
    assert.deepEqual([block.name, block.top, block.opened, block.afterOpened, block.gain], ['Deadlift', '185×8', '95×8 RDL', ' in week 1 · heaviest in week 9', null]);
    const tags = block.chart!.els.filter((e) => e.el === 'text' && (e.text === 'RDL' || e.text === 'Trap bar'));
    assert.deepEqual(tags.map((e) => [e.text, e.a['text-anchor']]), [['RDL', 'start'], ['Trap bar', 'middle']], 'each variant tagged once, the first clear of the axis (Amendment 1)');
    // The second history: one lift compared with itself.
    const two = ledgerView(ledgerModel({ dl: { name: 'Deadlift', entries: [en(9, 'mon', 185, [8, 8, 8]), en(10, 'mon', 195, [8, 8, 8])] } }, hist), 'lbs', icon).mains!.blocks[0]!;
    assert.equal('Opened at ' + two.opened + two.afterOpened + two.gain + two.afterGain, 'Opened at 185×8 in week 9 · up 10 lbs · heaviest in week 10');
  });
});

describe('native progress: the Deadlift block\'s edges (D255)', () => {
  test('two hinges at one load: the earlier week heads the block; a hinge\'s accessory day is counted off the line; an unloaded hinge keeps a reps block of its own', () => {
    const hist: Hist = { w1_mon: card('Barbell Romanian deadlift', '3×8'), w9_mon: card('Deadlift', '3×8'), w2_thu: card('Bench press', '4×5', [['Barbell Romanian deadlift', '3×10']]), w3_mon: card('Trap bar deadlift', '3×8') };
    const m = ledgerModel({
      dl: { name: 'Deadlift', entries: [en(9, 'mon', 185, [8, 8, 8])] },
      rdl: { name: 'Barbell Romanian deadlift', entries: [en(1, 'mon', 185, [8, 8, 8]), en(2, 'thu', 95, [10, 10, 10])] },
      trap: { name: 'Trap bar deadlift', entries: [en(3, 'mon', '', [8, 8, 8])] },
    }, hist);
    assert.deepEqual(m.mains.map((x) => [x.name, x.mode]), [['Deadlift', 'load'], ['Trap bar deadlift', 'reps']]);
    const d = m.mains[0]!;
    assert.deepEqual(d.series, [{ w: 1, v: 185, tag: 'RDL' }, { w: 9, v: 185, tag: null }]);
    assert.deepEqual(d.heavy, { v: 185, reps: 8, week: 1, tag: 'RDL' }, 'a tie goes to the earlier week');
    assert.deepEqual(d.first, { v: 185, reps: 8, week: 1, tag: 'RDL' });
    assert.deepEqual([d.plotted, d.accessoryDay, d.noLoad, d.entries], [2, 1, 0, 3]);
    assert.deepEqual(m.mains[1]!.series, [{ w: 3, v: 8 }]);
  });
});

describe('native progress: the run readers the page keeps (easyVsPrescribed, D26)', () => {
  const run = (subtype: string, dose: object | null, type = 'run') => ({ cardio: { type, subtype, dose } });
  test('an easy or recovery run with a target is placed against its own ceiling; faster than the ceiling is hot', () => {
    const hist = { w2_tue: run('Recovery Run', { tgt: 600, cap: 560 }), w1_mon: run('Easy Run', { tgt: 610, cap: 570 }) } as Hist;
    const runs = easyVsPrescribed({ w2_tue: { run_pace: '9:10/mi' }, w1_mon: { run_pace: '10:00' } }, hist, 12);
    assert.deepEqual(runs, [{ w: 1, sec: 600, tgt: 610, cap: 570, hot: false }, { w: 2, sec: 550, tgt: 600, cap: 560, hot: true }], 'by week');
  });
  test('a run with no target (even one frozen with a ceiling), a swapped one, another sport, a hard run, a week outside the program or an unread pace is left out', () => {
    const hist = { w1_mon: run('Recovery Run', {}), w1_tue: run('Recovery Run', { tgt: 600, cap: 560 }), w1_wed: run('Recovery Ride', { tgt: 600, cap: 560 }, 'bike'), w1_thu: run('Tempo Run', { tgt: 480, cap: 470 }), w9_mon: run('Easy Run', { tgt: 600, cap: 560 }), w1_fri: run('Easy Run', { tgt: 600, cap: 560 }), w1_sat: { sections: [] }, w2_mon: run('Easy Run', { cap: 560 }) } as Hist;
    const logs = { w1_mon: { run_pace: '10:00' }, w1_tue: { run_pace: '10:00', swapTo: 'bike' }, w1_wed: { run_pace: '10:00' }, w1_thu: { run_pace: '8:00' }, w9_mon: { run_pace: '10:00' }, w1_fri: { run_pace: 'fast' }, w1_sat: { run_pace: '10:00' }, w1_sun: { run_pace: '10:00' }, junk: { run_pace: '10:00' }, w2_mon: { run_pace: '10:00' } };
    assert.deepEqual(easyVsPrescribed(logs, hist, 8), []);
  });
  test('a card frozen with a target and no ceiling takes the engine\'s own: tempo and recovery from one row of the pace table, clamped together at its edges', () => {
    // The table's first row holds tempo 365 and recovery 420, its second 395 and 455, its last 815 and 870 (cardio-progression.ts).
    const cap = (tgt: number): number | undefined => easyVsPrescribed({ w1_mon: { run_pace: '20:00' } }, { w1_mon: run('Easy Run', { tgt }) } as Hist, 4)[0]?.cap;
    assert.equal(cap(420), 393, '(365 + 420) / 2, rounded');
    assert.equal(cap(1), 393, 'a target below the table reads as its first row, whole');
    assert.equal(cap(437.5), 409, 'half way between two rows: tempo 380, so (380 + 437.5) / 2');
    assert.equal(cap(900), 843, 'a target above the table reads as its last row: (815 + 870) / 2');
  });
  test('a program that starts off a Monday has a short first week (D26)', () => {
    assert.equal(partialWeek1({ startDate: '2026-08-31' }), false, 'a Monday');
    assert.equal(partialWeek1({ startDate: '2026-08-29' }), true, 'a Saturday');
    assert.equal(partialWeek1({}), false);
    assert.equal(partialWeek1(null), false);
  });
  test('the gates and the race distances are the page\'s', () => {
    assert.deepEqual([EASY_MIN_RUNS, EASY_ZONE_MIN_RUNS], [6, 4]);
    assert.deepEqual(RACE_DIST_MI, { run_5k: 3.1, run_10k: 6.2, run_half: 13.1, run_marathon: 26.2 });
  });
});

/** A store with two programs: p1 active, p2 archived; p1 with two logged days. */
function stored(): StateStore {
  const s = memoryStore();
  s.set('ia_programs', JSON.stringify([
    { id: 'p1', name: 'One', created: 2, totalWeeks: 4, startDate: '2026-08-31', cfg: { unit: 'kg', cardioTypes: ['run'] } },
    { id: 'p2', name: 'Two & more', created: 1, totalWeeks: 6, startDate: '2026-06-01', archived: true, archivedAt: 5, cfg: { unit: 'lbs', cardioTypes: [] } },
  ]));
  s.set('ia_active', 'p1');
  s.set('ia_logs_p1', JSON.stringify({ w1_mon: { run_dist: '3.0', rpe: '6', notes: 'Good', ts: 1 }, w2_tue: { run_dist: '5.0', rpe: '9', ts: 2 } }));
  for (const f of PURGE_FAMILIES) s.set(f + 'p2', f === 'ia_logs_' ? '{}' : '[]');
  return s;
}

describe('native progress: what the page keeps between draws, and the screen (showProgressScreen, renderProgressScreen)', () => {
  test('the tab opens on the active program with no delete armed, and keeps the estimator\'s lift; each tap sets what today\'s sets', () => {
    const st = newProgressState();
    assert.deepEqual({ ...st }, { viewId: null, confirmId: null, confirmTier: 0, calcLift: 'Deadlift' });
    showProgram(st, 'p2'); askPurge(st, 'p2'); setCalcLift(st, 'Bench');
    assert.deepEqual({ ...st }, { viewId: 'p2', confirmId: 'p2', confirmTier: 2, calcLift: 'Bench' });
    cancelConfirm(st);
    assert.deepEqual([st.viewId, st.confirmId, st.confirmTier], ['p2', null, 0], 'Cancel stands the delete down and stays on the program');
    askPurge(st, 'p2'); afterDelete(st, 'p2');
    assert.deepEqual([st.viewId, st.confirmId, st.confirmTier], [null, null, 0], 'after the delete the view lets go of the program');
    showProgram(st, 'p1'); askPurge(st, 'p2'); afterDelete(st, 'p2');
    assert.equal(st.viewId, 'p1', 'another program in view stays in view');
    showProgram(st, 'p2'); askPurge(st, 'p2'); openProgress(st);
    assert.deepEqual({ ...st }, { viewId: null, confirmId: null, confirmTier: 0, calcLift: 'Bench' });
  });
  test('no program stored draws nothing; a program with nothing logged reads No data yet, with no estimator', () => {
    assert.equal(progressView(memoryStore(), newProgressState(), NOW), null);
    const s = stored();
    s.remove('ia_logs_p1');
    const v = progressView(s, newProgressState(), NOW)!;
    assert.deepEqual([v.vid, v.empty, v.charts.length, v.journal, v.estimator], ['p1', 'none', 0, null, false]);
  });
  test('the program shown is the one asked for, else the active one; a view id that names no program is let go', () => {
    const s = stored(), st = newProgressState();
    assert.equal(progressView(s, st, NOW)!.vid, 'p1');
    showProgram(st, 'p2');
    assert.equal(progressView(s, st, NOW)!.vid, 'p2');
    showProgram(st, 'gone');
    assert.equal(progressView(s, st, NOW)!.vid, 'p1');
    assert.equal(st.viewId, null);
    // The pointer on an archived program: the launch would load the first that is not archived, and so does the screen.
    s.set('ia_active', 'p2');
    assert.equal(progressView(s, newProgressState(), NOW)!.vid, 'p1');
  });
  test('two programs draw two chips, the active first; the archived one shows its bar, and the armed delete its confirmation', () => {
    const s = stored(), st = newProgressState();
    let v = progressView(s, st, NOW)!;
    assert.deepEqual(v.chips.chips!.map((c) => [c.id, c.sel]), [['p1', true], ['p2', false]]);
    assert.equal(v.chips.bar, null);
    showProgram(st, 'p2');
    v = progressView(s, st, NOW)!;
    assert.deepEqual(v.chips.bar, { kind: 'archived', id: 'p2' });
    askPurge(st, 'p2');
    v = progressView(s, st, NOW)!;
    assert.deepEqual(v.chips.bar, { kind: 'confirm', id: 'p2', name: 'Two & more', warn: false });
  });
  test('logged runs draw the weekly mileage, the ladder and the session RPE, then the ledger; the journal holds each entry with an RPE or a note, the latest week open', () => {
    const v = progressView(stored(), newProgressState(), NOW)!;
    assert.equal(v.empty, null);
    // Two weeks each hold a run, so the Long Run Ladder has its two points: a run card, in the view and not yet drawn.
    assert.deepEqual(v.charts.map((c) => (c.kind === 'card' ? markupParts(c.spec.title).text : c.kind)), ['dot', 'Long Run Ladder', 'dot', 'ledger']);
    const dots = v.charts.filter((c) => c.kind === 'dot').map((c) => (c.kind === 'dot' ? [markupParts(c.spec.title).text, c.spec.unit, c.spec.points.length] : []));
    assert.deepEqual(dots, [['Weekly Running Mileage', 'mi', 2], ['Average Session RPE', '', 2]]);
    assert.deepEqual(v.journal!.map((w) => [w.week, w.open, w.count]), [[1, false, '1 entry'], [2, true, '1 entry']]);
    assert.deepEqual(v.journal![0]!.entries[0], { day: 'Mon', headMb: 6, rpe: { text: 'RPE 6 — Hard+', color: 'var(--accent)' }, swap: null, jogLines: [], jogMb: 6, notes: '"Good"' });
    assert.equal(v.journal![1]!.entries[0]!.rpe!.color, 'var(--red)', 'an RPE of 9 is red');
    assert.equal(v.estimator, true);
  });
  test('a log with nothing to chart and nothing for the journal reads the second empty state', () => {
    const s = stored();
    s.set('ia_programs', JSON.stringify([{ id: 'p1', totalWeeks: 4, cfg: { cardioTypes: [] } }]));
    s.set('ia_logs_p1', JSON.stringify({ w1_mon: { ts: 1 } }));
    const v = progressView(s, newProgressState(), NOW)!;
    assert.deepEqual([v.empty, v.journal, v.estimator], ['charts', null, true]);
  });
  test('a ledger with a row, or a journal with an entry, is something to show: neither reads the empty state', () => {
    const s = stored();
    s.set('ia_programs', JSON.stringify([{ id: 'p1', totalWeeks: 4, cfg: { cardioTypes: [] } }]));
    s.set('ia_logs_p1', JSON.stringify({ w1_mon: { ts: 1 } }));
    s.set('ia_exw_p1', JSON.stringify({ curl: { name: 'Curl', entries: [{ week: 1, day: 'mon', weight: 30, setsDone: [10, 10], ts: 1 }] } }));
    let v = progressView(s, newProgressState(), NOW)!;
    assert.deepEqual([v.charts.map((c) => c.kind), v.journal, v.empty], [['ledger'], null, null], 'a lift logged and nothing else: the ledger alone');
    s.remove('ia_exw_p1');
    s.set('ia_logs_p1', JSON.stringify({ w1_mon: { notes: 'Short day', ts: 1 } }));
    v = progressView(s, newProgressState(), NOW)!;
    assert.deepEqual([v.charts.map((c) => c.kind), v.journal!.length, v.empty], [['ledger'], 1, null], 'a note and nothing else: the journal alone');
  });
  test('a program stored with no length is read as six weeks', () => {
    const s = stored();
    s.set('ia_programs', JSON.stringify([{ id: 'p1', cfg: { cardioTypes: ['run'] } }]));
    s.set('ia_logs_p1', JSON.stringify({ w6_mon: { run_dist: '3.0', ts: 1 }, w7_mon: { run_dist: '4.0', ts: 2 } }));
    const dot = progressView(s, newProgressState(), NOW)!.charts[0]!;
    assert.ok(dot.kind === 'dot' && dot.spec.points.length === 1 && dot.spec.total === '3.0', 'week 7 is past the program: ' + JSON.stringify(dot));
  });
  test('this app draws each of today\'s three kinds of chart: the dot charts, the run cards and the ledger', () => {
    assert.deepEqual([...DRAWN], ['dot', 'card', 'ledger']);
    assert.ok(read('progress/Progress.tsx').includes('v.charts.filter((c) => DRAWN.includes(c.kind)).map('));
  });
});

describe('native progress: the three writes, to this app\'s own store (D289)', () => {
  /** A store that counts its writes. */
  const counting = (inner: StateStore): { s: StateStore; sets: string[]; removes: string[] } => {
    const sets: string[] = [], removes: string[] = [];
    return { s: { ...inner, get: (k) => inner.get(k), keys: () => inner.keys(), set: (k, v) => { sets.push(k); inner.set(k, v); }, remove: (k) => { removes.push(k); inner.remove(k); } } as StateStore, sets, removes };
  };
  test('Restore takes the archive marks off the program and nothing else; a program that is gone writes nothing', () => {
    const c = counting(stored());
    assert.equal(restoreProgram(c.s, 'p2'), 'Program restored');
    assert.deepEqual([c.sets, c.removes], [['ia_programs'], []]);
    const p2 = (JSON.parse(c.s.get('ia_programs')!) as Record<string, unknown>[])[1]!;
    assert.deepEqual(p2, { id: 'p2', name: 'Two & more', created: 1, totalWeeks: 6, startDate: '2026-06-01', cfg: { unit: 'lbs', cardioTypes: [] } });
    assert.equal(restoreProgram(c.s, 'gone'), null);
    assert.deepEqual(c.sets, ['ia_programs']);
  });
  test('Delete Forever saves the list without the program first, then removes the fifteen families it owns, and no other program\'s', () => {
    const c = counting(stored());
    const p1Before = c.s.get('ia_logs_p1');
    assert.equal(deleteProgram(c.s, 'p2'), 'Program deleted');
    assert.deepEqual(c.sets, ['ia_programs']);
    // Typed from the page's purgeProgData (program-manage.ts), in its order.
    assert.deepEqual(c.removes, ['ia_logs_p2', 'ia_comp_p2', 'ia_parts_p2', 'ia_hist_p2', 'ia_wild_p2', 'ia_exw_p2', 'ia_moves_p2', 'ia_swaps_p2', 'ia_swapct_p2', 'ia_edits_p2', 'ia_pop_dismiss_p2', 'ia_pop_idx_p2', 'ia_season_shown_p2', 'ia_reminded_p2', 'ia_remind_last_p2']);
    assert.deepEqual((JSON.parse(c.s.get('ia_programs')!) as { id: string }[]).map((p) => p.id), ['p1']);
    assert.deepEqual(c.s.keys().sort(), ['ia_active', 'ia_logs_p1', 'ia_programs']);
    assert.equal(c.s.get('ia_logs_p1'), p1Before);
    assert.equal(c.s.get('ia_active'), 'p1', 'the pointer is not on the deleted program, and stays');
  });
  test('were the pointer on the deleted program, it goes to the first that is not archived, or goes with none left', () => {
    const s = stored();
    s.set('ia_active', 'p2');
    deleteProgram(s, 'p2');
    assert.equal(s.get('ia_active'), 'p1');
    const lone = memoryStore();
    lone.set('ia_programs', JSON.stringify([{ id: 'p9', archived: true }]));
    lone.set('ia_active', 'p9');
    deleteProgram(lone, 'p9');
    assert.equal(lone.get('ia_active'), null);
    assert.equal(lone.get('ia_programs'), '[]');
  });
  test('the open\'s cleanup drops the earlier of two entries of one day and writes once; a clean log is never written', () => {
    const c = counting(stored());
    c.s.set('ia_exw_p1', JSON.stringify({ 'bench-press': { name: 'Bench press', entries: [{ week: 1, day: 'mon', weight: 135, ts: 1 }, { week: 1, day: 'mon', weight: 140, ts: 2 }, { week: 1, day: 'thu', weight: 95, ts: 3 }] } }));
    c.sets.length = 0;
    const log = cleanLiftLog(c.s, 'p1');
    assert.deepEqual(c.sets, ['ia_exw_p1']);
    assert.deepEqual(log['bench-press']!.entries.map((e) => [e.day, e.weight]), [['mon', 140], ['thu', 95]], 'two days of one week are two sessions (V117)');
    cleanLiftLog(c.s, 'p1');
    assert.deepEqual(c.sets, ['ia_exw_p1'], 'a second open writes nothing');
    progressView(c.s, newProgressState(), NOW);
    assert.deepEqual(c.sets, ['ia_exw_p1'], 'and a draw of a clean log writes nothing');
  });
  test('an old exercise key alone is folded onto today\'s and saved, with no pair to drop', () => {
    // 'Barbell front squat' was renamed 'Front squat' (core's rename table), so its old key is barbell_front_squat.
    const c = counting(stored());
    c.s.set('ia_exw_p1', JSON.stringify({ barbell_front_squat: { name: 'Barbell front squat', entries: [{ week: 1, day: 'mon', weight: 135, ts: 1 }] } }));
    c.sets.length = 0;
    const log = cleanLiftLog(c.s, 'p1');
    assert.deepEqual(c.sets, ['ia_exw_p1']);
    assert.deepEqual(Object.keys(log), ['front_squat']);
    assert.deepEqual(Object.keys(JSON.parse(c.s.get('ia_exw_p1')!) as object), ['front_squat']);
  });
  test('of the screen\'s files only progress-writes.ts writes, and none names the phone\'s own store', () => {
    const writes = /\.set\(|\.remove\(|writePrograms|writeLiftLog|writeDayLogs|writeActiveProgramId|pickActive/;
    for (const f of ['progress/progress-screen.ts', 'progress/progress-readers.ts', 'progress/Progress.tsx', 'progress/ChartCards.tsx', 'progress/SvgPicture.tsx', 'progress/paint.ts', 'progress/card-markup.ts']) {
      assert.doesNotMatch(strip(read(f)), writes, f + ' writes');
      assert.doesNotMatch(strip(read(f)), /phoneStore|localStorage/, f + ' names a store of its own');
    }
    assert.match(strip(read('progress/progress-writes.ts')), /writePrograms\(store, programs as never\);\n  if \(readActiveProgramId\(store\) === id\) pickActive\(store\);\n  PURGE_FAMILIES\.forEach\(\(p\) => store\.remove\(p \+ id\)\);/, 'the list is saved before the keys go, as today\'s');
  });
});

describe('native progress: the estimator and the page\'s markup', () => {
  test('a single is itself, a set is Epley to the nearest five, and nothing shows without both numbers; the lift named is the one picked', () => {
    const st = newProgressState();
    assert.deepEqual(estimateLine(st, '185', '5', 'lbs'), { bold: 'Estimated Deadlift 1RM: 215 lbs', rest: ' — for your reference; the app coaches by RPE.' });
    setCalcLift(st, 'Squat');
    assert.equal(estimateLine(st, '225', '1', 'kg')!.bold, 'Estimated Squat 1RM: 225 kg');
    assert.equal(estimateLine(st, '100', '10', 'lbs')!.bold, 'Estimated Squat 1RM: 135 lbs', '100 × (1 + 10 / 30) is 133.3, to the nearest five');
    assert.equal(estimateLine(st, '', '5', 'lbs'), null);
    assert.equal(estimateLine(st, '135', '0', 'lbs'), null);
    assert.equal(estimateLine(st, 'heavy', '5', 'lbs'), null);
  });
  test('the estimate is said in the active program\'s unit, pounds with none', () => {
    assert.equal(estimatorUnit(stored()), 'kg');
    assert.equal(estimatorUnit(memoryStore()), 'lbs');
  });
  test('markup the page writes is drawn as its icon and its plain words', () => {
    assert.deepEqual(markupParts('<svg width="15"><path d="M0 0"/></svg> Weekly Running Mileage'), { icon: '<svg width="15"><path d="M0 0"/></svg>', text: 'Weekly Running Mileage' });
    assert.deepEqual(markupParts('"Legs heavy &amp; slow &lt;on the hill&gt;"'), { icon: null, text: '"Legs heavy & slow <on the hill>"' });
    assert.deepEqual(markupParts('20 min run logged · RPE 3'), { icon: null, text: '20 min run logged · RPE 3' });
  });
  test('a colour the models name as the web does is this palette\'s: a token, a tint of the ink, or a plain colour', () => {
    assert.equal(paint('var(--lift)', DAY), DAY.lift);
    assert.equal(paint('var(--border2)', DAY), DAY.border2);
    assert.equal(paint('var(--on-ink)', DAY), DAY.onInk);
    assert.equal(paint('rgba(var(--ink-rgb),0.3)', DAY), 'rgba(17,17,17,0.3)');
    assert.equal(paint('#f0a050', DAY), '#f0a050');
    assert.equal(paint('var(--nothing)', DAY), DAY.muted);
  });
  test('an element keeps the numbers the page wrote, under react-native-svg\'s names; a picture is a fixed size where the page named one', () => {
    const el: SvgEl = { el: 'text', a: { x: '34.0', y: '12.5', fill: 'rgba(var(--ink-rgb),0.3)', 'font-size': '8', 'text-anchor': 'end', 'font-family': 'Helvetica Neue,Helvetica,Geist,sans-serif', 'font-weight': '' }, text: '185' };
    assert.deepEqual(svgProps(el, DAY, 'Helvetica Neue'), { x: '34.0', y: '12.5', fill: 'rgba(17,17,17,0.3)', fontSize: '8', textAnchor: 'end', fontFamily: 'Helvetica Neue' });
    assert.deepEqual(svgProps({ el: 'path', a: { d: 'M0,0 L1,1', stroke: 'var(--lift)', 'stroke-width': '1.5', fill: 'none', opacity: '0.55' } }, DAY, 'x'), { d: 'M0,0 L1,1', stroke: DAY.lift, strokeWidth: '1.5', fill: 'none', opacity: '0.55' });
    // A ladder track: 156 units drawn 140 points wide, so 140 / 156 a unit. Six units more on every side keep the dot
    // the page nudges left of the track (overflow: visible), at the same scale and in the same place.
    const track = pictureBox('-8 0 156 26', 'width:140px;height:26px;overflow:visible');
    assert.equal(track.viewBox, '-14 -6 168 38');
    assert.ok(Math.abs(track.width! - (140 + 12 * 140 / 156)) < 1e-9 && Math.abs(track.height! - (26 + 12 * 140 / 156)) < 1e-9 && Math.abs(track.margin + 6 * 140 / 156) < 1e-9);
    assert.ok(Math.abs(track.width! / 168 - 140 / 156) < 1e-9, 'the scale is the page\'s');
    assert.ok(pictureBox('0 0 320 108', 'width:100%;height:auto;overflow:visible').width === null, 'no size named: the full width (its box is the next block\'s test)');
  });
});

describe('native progress: a run card\'s markup, its type and its picture', () => {
  const words = (text: string): { text: string; bold: boolean; color: string | null } => ({ text, bold: false, color: null });
  const bold = (text: string, color: string | null = null): { text: string; bold: boolean; color: string | null } => ({ text, bold: true, color });
  const near = (a: number | undefined, b: number): void => assert.ok(a !== undefined && Math.abs(a - b) < 1e-9, a + ' against ' + b);

  test('a footer is one block of its words in order, each <b> a bold run in the colour it names, or in none', () => {
    // The drift chart's footer, as buildDriftChart writes it.
    const foot = 'Written <b>12.0 mi</b> · logged <b style="color:var(--run)">13.5 mi</b> across 3 weeks — <b style="color:var(--red)">-1.5 mi</b> net. Distance-prescribed runs only.';
    assert.deepEqual(markupBlocks(foot), [{ style: null, runs: [words('Written '), bold('12.0 mi'), words(' · logged '), bold('13.5 mi', 'var(--run)'), words(' across 3 weeks — '), bold('-1.5 mi', 'var(--red)'),
      words(' net. Distance-prescribed runs only.')] }]);
    assert.deepEqual(markupBlocks('The two bars should not touch.'), [{ style: null, runs: [words('The two bars should not touch.')] }]);
    assert.deepEqual(markupBlocks('<b>1</b> and <b>2</b>'), [{ style: null, runs: [bold('1'), words(' and '), bold('2')] }], 'a bold run first and last');
    assert.deepEqual(markupBlocks(''), []);
  });
  test('a head is a block for each <div>, in the page\'s order, each with what its inline style names', () => {
    // The easy zone chart's head (headHtml), with a run too fast.
    const head = '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;letter-spacing:-0.02em;color:var(--red);line-height:1.15;margin-bottom:4px">2 of 5 were too fast</div>'
      + '<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px">The plan asks for 10:00/mi.</div>';
    assert.deepEqual(markupBlocks(head), [
      { style: { display: true, size: 24, weight: '700', spacing: -0.02, color: 'var(--red)', line: 1.15, gap: 4 }, runs: [words('2 of 5 were too fast')] },
      { style: { display: false, size: 12, weight: null, spacing: null, color: 'var(--muted)', line: 1.5, gap: 12 }, runs: [words('The plan asks for 10:00/mi.')] },
    ]);
  });
  test('a body\'s block holds its bold runs, each in its colour', () => {
    // The easy effort chart's empty state (buildEasyEffortEmpty).
    const body = '<div style="font-size:12px;color:var(--muted);line-height:1.6">it needs <b style="color:var(--text)">6</b> easy or recovery runs. You have <b style="color:var(--text)">4</b>, so 2 to go.</div>';
    assert.deepEqual(markupBlocks(body), [{ style: { display: false, size: 12, weight: null, spacing: null, color: 'var(--muted)', line: 1.6, gap: null },
      runs: [words('it needs '), bold('6', 'var(--text)'), words(' easy or recovery runs. You have '), bold('4', 'var(--text)'), words(', so 2 to go.')] }]);
  });
  test('words between and after blocks are blocks of their own; a block with no words is left out; an entity is its character; any other tag is left out and its words kept', () => {
    assert.deepEqual(markupBlocks('before<div style="font-size:12px">in &amp; <i>out</i> &lt;there&gt;</div><div style="font-size:11px"></div> after <b></b><div>bare</div>'), [
      { style: null, runs: [words('before')] },
      { style: { display: false, size: 12, weight: null, spacing: null, color: null, line: null, gap: null }, runs: [words('in & out <there>')] },
      { style: null, runs: [words(' after ')] },
      { style: { display: false, size: null, weight: null, spacing: null, color: null, line: null, gap: null }, runs: [words('bare')] },
    ]);
  });
  test('a style reads only what it names, each in the unit the page writes it in, and only the display face\'s own name is the display face', () => {
    const none = { display: false, size: null, weight: null, spacing: null, color: null, line: null, gap: null };
    assert.deepEqual(blockStyle(''), none);
    assert.deepEqual(blockStyle('font-family:serif;font-size:12em;letter-spacing:1px;line-height:18px;margin-bottom:1em;font-weight:;color:'), none);
    assert.deepEqual(blockStyle(' color : var(--text) ; font-size : 12px '), { ...none, color: 'var(--text)', size: 12 });
    assert.deepEqual(blockStyle('margin-bottom:0px;letter-spacing:0.5em;line-height:1'), { ...none, gap: 0, spacing: 0.5, line: 1 });
  });
  test('a block\'s type is its style in points and in this palette: the tracking and the line height off its size, and nothing for what the style does not name', () => {
    const big = { display: true, size: 24, weight: '700', spacing: -0.02, color: 'var(--red)', line: 1.15, gap: 4 };
    const t = blockType(big, DAY);
    assert.deepEqual(Object.keys(t).sort(), ['color', 'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'marginBottom']);
    assert.ok(t.fontFamily === 'Helvetica Neue' && t.fontSize === 24 && t.fontWeight === '700' && t.color === '#9e3328' && t.marginBottom === 4, JSON.stringify(t));
    near(t.letterSpacing, -0.48);   // 24 × -0.02
    near(t.lineHeight, 27.6);       // 24 × 1.15
    assert.equal(blockType(big, NIGHT).color, '#D9665A');
    // The line under the projected finish: 11 points, no line height named.
    assert.deepEqual(blockType({ display: false, size: 11, weight: null, spacing: null, color: 'var(--muted)', line: null, gap: 12 }, DAY), { fontFamily: 'Helvetica Neue', fontSize: 11, color: '#6E6E6A', marginBottom: 12 });
    assert.deepEqual(blockType(blockStyle(''), DAY), { fontFamily: 'Helvetica Neue' });
    // A tracking or a line height with no size has nothing to be a share of; no room at all is still said.
    assert.deepEqual(blockType({ display: false, size: null, weight: null, spacing: -0.02, color: null, line: 1.5, gap: 0 }, DAY), { fontFamily: 'Helvetica Neue', marginBottom: 0 });
    // A size with neither: no tracking and no line height.
    assert.deepEqual(blockType({ display: false, size: 12, weight: null, spacing: null, color: null, line: null, gap: null }, DAY), { fontFamily: 'Helvetica Neue', fontSize: 12 });
  });
  test('the builders of the run cards write those two tags and those seven properties, and no other', () => {
    const model = strip(read('progress/charts/run-charts-model.ts'));
    const literals = [...model.matchAll(/'(?:[^'\\\n]|\\.)*'/g)].map((m) => m[0]).join('\n');
    assert.deepEqual([...new Set([...literals.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1]))].sort(), ['b', 'div']);
    assert.deepEqual([...new Set([...literals.matchAll(/(?:["';])([a-z][a-z-]*):(?=[a-z0-9(' -])/g)].map((m) => m[1]))].sort(),
      ['color', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'margin-bottom']);
    // Every <b> opens bare or with a colour alone, and every <div> with a style: the two shapes the reader takes.
    assert.deepEqual([...new Set([...literals.matchAll(/<b[^>']*/g)].map((m) => m[0]))].sort(), ['<b', '<b style="color:', '<b style="color:var(--run)"', '<b style="color:var(--text)"']);
    assert.deepEqual([...new Set([...literals.matchAll(/<div[^>']{0,8}/g)].map((m) => m[0]))], ['<div style="']);
  });
  test('a picture\'s text that names no face takes the app\'s, as one that names the page\'s does; no other element takes a face', () => {
    // The pace chart's plan label (buildPaceChart): no font-family.
    assert.deepEqual(svgProps({ el: 'text', a: { x: '306', y: '40.0', 'font-size': '7.5', fill: 'var(--run)', 'text-anchor': 'end', opacity: '0.85' }, text: 'Plan 9:30/mi' }, DAY, 'Helvetica Neue'),
      { x: '306', y: '40.0', fontSize: '7.5', fill: DAY.run, textAnchor: 'end', opacity: '0.85', fontFamily: 'Helvetica Neue' });
    assert.deepEqual(svgProps({ el: 'rect', a: { x: '30.0', y: '26', width: '40.0', height: '18', fill: 'var(--lift)', opacity: '0.82', rx: '1' } }, DAY, 'Helvetica Neue'),
      { x: '30.0', y: '26', width: '40.0', height: '18', fill: DAY.lift, opacity: '0.82', rx: '1' });
    assert.deepEqual(svgProps({ el: 'polygon', a: { points: '46.0,60.0 150.0,70.0 ', fill: 'var(--hip)', opacity: '0.13' } }, NIGHT, 'Helvetica Neue'), { points: '46.0,60.0 150.0,70.0 ', fill: NIGHT.hip, opacity: '0.13' });
  });
  test('a chart laid the full width of its card keeps six units past each edge, at the page\'s scale and in the page\'s place', () => {
    // 320 units across the card's width: 332 units are 103.75% of it, pulled back 6 of 320 (1.875%) on every side.
    assert.deepEqual(pictureBox('0 0 320 108', 'width:100%;height:auto;overflow:visible'), { viewBox: '-6 -6 332 120', width: null, height: null, margin: 0, ratio: 332 / 120, wide: 103.75, pull: -1.875 });
    const b = pictureBox('0 0 320 152', 'width:100%;height:auto;overflow:visible');
    // On a card 300 points wide a unit is 300 / 320 of a point: the box is 311.25 by 153.75, and after its margins the picture stands 300 by 142.5, the page's own 300 × 152 / 320.
    const wide = 300 * b.wide / 100, tall = wide / b.ratio, pull = 300 * b.pull / 100;
    near(wide, 311.25); near(tall, 153.75); near(wide + 2 * pull, 300); near(tall + 2 * pull, 142.5);
  });
});

describe('native progress: the screen\'s words and wiring', () => {
  const screen = read('progress/Progress.tsx'), cards = read('progress/ChartCards.tsx'), app = read('App.tsx');
  const today = readFileSync(join(TODAY, 'progress-screen.ts'), 'utf8') + readFileSync(join(TODAY, 'program-chips.ts'), 'utf8') + readFileSync(join(TODAY, 'charts/ledger-cards.ts'), 'utf8') + readFileSync(join(TODAY, 'charts/dot-chart.ts'), 'utf8');
  test('every sentence on the screen is today\'s, word for word', () => {
    for (const words of [
      'No data yet', 'Start logging your sessions and your progress will appear here as dotted line charts.', 'Log sessions to see progress charts, exercise history, and your training journal here.',
      'This program is archived — history only.', 'Delete Forever', 'Other programs are using these loads as starting points — those will go blank.', 'Delete this program forever',
      'Optional — estimate a one-rep max from any recent set, just for your own records. Your training still runs on RPE.', 'e.g. 185', 'e.g. 5',
      'ready to move up', ' across these lifts this block. Hit the top of the range on every set, then add weight and start back at the bottom.', 'Add weight', 'Total logged: ', ' · Peak week: ',
    ]) {
      assert.ok(today.includes(words), 'today\'s screen says: ' + words);
      assert.ok((screen + cards).includes(words), 'the Expo screen says: ' + words);
    }
    for (const words of ["'This erases all logs, weights, and history for “' + b.name + '”. It cannot be undone.'", '>Restore</Text>', '>Cancel</Text>', "{'Week ' + wk.week}", '>Weight</Text>', '>Reps</Text>', "' Session Journal'", "' 1RM Estimator'", "{r.toGo + ' to go'}", "{'Opened at '}", '>Progress</Text>', '>The Asylum</Text>']) {
      assert.ok((screen + cards).includes(words), 'the Expo screen holds: ' + words);
    }
    assert.ok(read('progress/progress-screen.ts').includes("rest: ' — for your reference; the app coaches by RPE.'") && today.includes('— for your reference; the app coaches by RPE.'));
  });
  test('each tap makes today\'s call, then a draw: a chip, Restore and its toast, the trash, Delete Forever and its toast, Cancel', () => {
    assert.ok(screen.includes('show: (id: string): void => { showProgram(st, id); redraw(); },'));
    assert.ok(screen.includes('restore: (id: string): void => { const toast = restoreProgram(store, id); redraw(); if (toast) say(toast); },'));
    assert.ok(screen.includes('askPurge: (id: string): void => { askPurge(st, id); redraw(); },'));
    assert.ok(screen.includes('purge: (id: string): void => { const toast = deleteProgram(store, id); afterDelete(st, id); redraw(); say(toast); },'));
    assert.ok(screen.includes('cancel: (): void => { cancelConfirm(st); redraw(); },'));
    assert.ok(screen.includes('onPress={() => on.show(c.id)}') && screen.includes('onPress={() => on.restore(b.id)}') && screen.includes('onPress={() => on.askPurge(b.id)}') && screen.includes('onPress={() => on.purge(b.id)}') && screen.includes('onPress={on.cancel}'));
  });
  test('the screen opens as the tab\'s tap does, and every draw is a body of its own: the journal folds back and the estimator clears', () => {
    assert.ok(screen.includes('useState(() => { openProgress(st); return { view: progressView(store, st, Date.now()), n: 0 }; });'));
    assert.ok(screen.includes('const redraw = (): void => setDrawn((d) => ({ view: progressView(store, st, Date.now()), n: d.n + 1 }));'));
    assert.ok(screen.includes('<ScrollView key={drawn.n} testID="progress-body"'));
    assert.ok(screen.includes('useState<Record<number, boolean>>(() => Object.fromEntries(weeks.map((w) => [w.week, w.open])));'), 'only the latest week opens unfolded');
    assert.ok(screen.includes('const [open, setOpen] = useState(false);\n  const [lift, setLift] = useState(st.calcLift);'), 'the estimator opens folded, on the lift last picked');
    assert.ok(screen.includes('onPress={() => { setCalcLift(st, n); setLift(n); }}'));
    assert.ok(screen.includes('const line = estimateLine(st, weight, reps, unit);'));
    assert.ok(screen.includes('{v.estimator && <Estimator palette={p} state={st} unit={estimatorUnit(store)} />}'));
  });
  test('the app holds a Progress tab between This Week and Bugs; each tap on it opens the screen afresh, and what it keeps outlives a visit', () => {
    assert.ok(app.includes("type Tab = 'week' | 'progress' | 'bugs';"));
    assert.ok(app.includes('const progress = useRef(newProgressState()).current;'));
    assert.ok(app.includes("if (t === 'progress') setProgressTaps((n) => n + 1);"));
    assert.ok(app.includes(": tab === 'progress' ? <Progress key={progressTaps} palette={p} store={phoneStore} state={progress} say={say} /> : <Bugs palette={p} />}"));
    const week = app.indexOf('id="tab-week"'), prog = app.indexOf('id="tab-progress" label="Progress"'), bugs = app.indexOf('id="tab-bugs"');
    assert.ok(week > 0 && week < prog && prog < bugs);
  });
  test('the ledger\'s cards and the dot chart draw every field of today\'s models', () => {
    for (const field of ['{b.name}', '{b.top}', '{b.opened}', '{b.afterOpened}', '{b.gain}', '{b.afterGain}', 'b.chart.els', '{l.ready}', '{r.name}', '{r.weight}', '{r.detail}', 'r.track.els', '{r.meta}', 'foot={m.foot}', 'foot={l.foot}', 'foot={o.foot}', 'title={m.title}', 'title={l.title}', 'title={o.title}']) assert.ok(cards.includes(field), 'the ledger draws ' + field);
    for (const field of ['c.grid.map(', '{g.label}', 'd={c.path}', 'c.points.map(', 'c.xLabels.map(', '{l.text}', "{c.total + ' ' + c.unit}", "{c.peak + ' ' + c.unit}", 'html={c.title}']) assert.ok(cards.includes(field), 'the dot chart draws ' + field);
    assert.ok(cards.includes("{l.ups + ' time' + (l.ups === 1 ? '' : 's')}"));
  });
  test('a run card draws each part of today\'s spec where it holds one, in the page\'s order: the title in the card\'s colour, the head, the picture, the body, the footer', () => {
    const lines = [
      '<CardTitle html={c.title} color={paint(c.color, p)} gap={c.titleGap} />',
      '{c.head && <Markup html={c.head} palette={p} />}',
      "{c.svg && <SvgPicture viewBox={'0 0 ' + c.svg.w + ' ' + c.svg.h} style=\"width:100%;height:auto;overflow:visible\" els={c.svg.els} palette={p} />}",
      '{c.body && <Markup html={c.body} palette={p} />}',
      '{c.foot && <Markup html={c.foot} base={[s.foot, { color: p.muted }]} palette={p} />}',
    ];
    const at = lines.map((l) => cards.indexOf(l));
    assert.ok(at.every((i) => i > 0), 'each part is drawn: ' + at.join(' '));
    assert.deepEqual([...at].sort((a, b) => a - b), at, 'in the page\'s order');
    assert.ok(cards.includes('<View testID="run-card" style={[s.card, { backgroundColor: p.surface }]}>'), 'on a card of its own, as every chart is');
    assert.ok(cards.includes('{markupBlocks(html).map((b, i) => ('), 'a part is drawn block by block');
    assert.ok(cards.includes('<Text key={i} style={b.style ? blockType(b.style, p) : base}>'), 'a block in its own type, the words outside one in the type of where they stand');
    assert.ok(cards.includes('{b.runs.map((r, j) => (r.bold ? <Text key={j} style={[s.bold, r.color !== null && { color: paint(r.color, p) }]}>{r.text}</Text> : r.text))}'), 'a bold run in its colour, the other words as they are');
    assert.ok(cards.includes("foot: { fontFamily: TEXT, fontSize: 11, marginTop: 6, lineHeight: 16.5 },") && cards.includes("bold: { fontWeight: '700' },"), 'the footer\'s type is the page\'s: 11 points at 1.5, six under the picture');
    assert.ok(screen.includes("c.kind === 'dot' ? <DotChartCard key={i} spec={c.spec} palette={p} />\n                : c.kind === 'card' ? <RunCard key={i} spec={c.spec} palette={p} />\n                  : <LedgerCards key={i} view={c.view} palette={p} />"), 'each kind of chart goes to its own drawer');
  });
  test('the journal draws every field of today\'s entry, the confirmation warns only when told to, and the ledger\'s marks follow its rows', () => {
    for (const field of ['{e.day}', '{e.rpe.text}', 'paint(e.rpe.color, p)', '{swap.text}', 'markupParts(l).text', 'markupParts(e.notes).text', '{wk.count}', 'marginBottom: e.headMb', 'marginBottom: e.swap.mb', 'marginBottom: e.jogMb', 'open[wk.week] && (']) assert.ok(screen.includes(field), 'the journal draws ' + field);
    assert.ok(screen.includes("{b.warn && <Text style={{ color: p.muted }}>"));
    assert.ok(screen.includes("{v.empty === 'none' ? 'Start logging"), 'the first empty sentence is for nothing logged');
    assert.ok(screen.includes("b && b.kind === 'confirm' && (") && screen.includes("b && b.kind === 'archived' && ("));
    assert.ok(cards.includes('color: l.ready ? p.signal : p.muted') && cards.includes("{r.ready\n                  ? <Text style={[s.addWeight, { color: p.signal }]}>Add weight</Text>"));
    assert.ok(cards.includes('{b.chart && <SvgPicture viewBox={b.chart.viewBox} style={b.chart.style} els={b.chart.els} palette={p} />}'));
    assert.ok(cards.includes('<SvgPicture viewBox={r.track.viewBox} style={r.track.style} els={r.track.els} palette={p} />'));
    assert.ok(cards.includes('{b.gain && <><Text style={[s.bold, { color: p.lift }]}>{b.gain}</Text>{b.afterGain}</>}'));
    assert.ok(cards.includes('const t = markupParts(html);') && cards.includes('<Text style={[s.titleText, { color }]}>{t.text}</Text>'), 'a title is its icon and its plain words');
    assert.ok(cards.includes('{foot && <Text style={[s.foot, { color: p.muted }]}>{markupParts(foot).text}</Text>}'), 'a card with a footer draws it');
    const pic = read('progress/SvgPicture.tsx');
    assert.ok(pic.includes('<Svg viewBox={box.viewBox} style={size}>') && pic.includes('{ width: box.width, height: box.height, margin: box.margin }') && pic.includes("{ width: (box.wide + '%') as `${number}%`, aspectRatio: box.ratio, margin: (box.pull + '%') as `${number}%` }"));
    assert.ok(pic.includes('const a = svgProps(e, p, DISPLAY);'));
    for (const [tag, el] of [['line', 'Line'], ['rect', 'Rect'], ['circle', 'Circle'], ['path', 'Path'], ['polygon', 'Polygon']]) assert.ok(pic.includes("case '" + tag + "': return <" + el + ' key={i} {...a} />;'), 'a ' + tag + ' is drawn as one');
    assert.ok(pic.includes('default: return <SvgText key={i} {...a}>{e.text}</SvgText>;'));
  });
  test('the copy carries no Nike', () => {
    assert.doesNotMatch(strip(screen) + strip(cards), /Nike/);
  });
});
