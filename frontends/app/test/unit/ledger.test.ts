// The Lift Ledger (src/app/screens/progress/charts/ledger-model.ts, architecture phase E step 16), with values worked
// by hand from the legacy builders: loads in pounds to the whole and in kilograms to the half (× 0.453592), the gain
// between the opening and the heaviest set, the rep-range track 140 wide, and every card's words.
// tests/integration/progress-charts.test.ts holds the whole ledger to the legacy buildLedgerCards byte for byte.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { displayLoad, type LedgerModel, ladderTrack, ledgerView, mainBlock } from '../../src/app/screens/progress/charts/ledger-model.ts';

const SQUAT: LedgerModel['mains'][number] = {
  name: 'Back squat', mode: 'load', series: [{ w: 1, v: 225 }, { w: 2, v: 235 }, { w: 3, v: 245 }, { w: 5, v: 240 }],
  heavy: { v: 245, reps: 5, week: 3 }, first: { v: 225, reps: 5, week: 1 }, accessoryDay: 1, noLoad: 2,
};
const BENCH: LedgerModel['mains'][number] = {
  name: 'Barbell bench press', mode: 'load', series: [{ w: 2, v: 185 }], heavy: { v: 185, reps: null, week: 2 }, first: { v: 185, reps: null, week: 2 }, accessoryDay: 0, noLoad: 1,
};
const PULLUPS: LedgerModel['mains'][number] = {
  name: 'Pullups', mode: 'reps', series: [{ w: 1, v: 8 }, { w: 2, v: 10 }], heavy: { v: 10, reps: null, week: 2 }, first: { v: 8, reps: null, week: 1 }, accessoryDay: 0, noLoad: 0,
};
const ROW = { name: 'Dumbbell row', wt: 70, lo: 8, hi: 12, sets: [12, 12, 12], ready: true, ups: 2, sessions: 4 };
const RAISE = { name: 'Lateral raise', wt: 20, lo: 10, hi: 15, sets: [12, 12, 10], ready: false, ups: 1, sessions: 3 };

describe('the Lift Ledger', () => {
  it('shows a load in pounds to the whole and in kilograms to the half', () => {
    // 225 × 0.453592 = 102.06 → 102; 185 → 83.91 → 84; 245 → 111.13 → 111; 70 → 31.75 → 32.
    assert.deepEqual([displayLoad(225, 'lbs'), displayLoad(225.4, 'lbs'), displayLoad(225, 'kg'), displayLoad(185, 'kg'), displayLoad(245, 'kg'), displayLoad(70, 'kg')], [225, 225, 102, 84, 111, 32]);
  });

  it('names the top set, the opening set and the gain, and draws the line from two sessions', () => {
    const b = mainBlock(SQUAT, 'lbs');
    assert.deepEqual([b.top, b.opened, b.afterOpened, b.gain, b.afterGain], ['245×5', '225×5', ' in week 1 · up ', '20 lbs', ' · heaviest in week 3']);
    const dots = b.chart!.els.filter((e) => e.el === 'circle').map((e) => [e.a['r'], e.a['opacity']]);
    assert.deepEqual(dots, [['3.2', '0.72'], ['3.2', '0.72'], ['4.5', '1'], ['3.2', '0.72']], 'the heaviest set is the bold dot');
    assert.deepEqual(b.chart!.els.filter((e) => e.el === 'text' && e.text!.startsWith('W')).map((e) => e.text), ['W1', 'W2', 'W3', 'W5']);
    assert.deepEqual([mainBlock(SQUAT, 'kg').top, mainBlock(SQUAT, 'kg').gain], ['111×5', '9 kg'], '111 − 102 in kilograms');
  });

  it('runs the line on without a gain, draws no line for one session, and counts reps for a bodyweight main', () => {
    const b = mainBlock(BENCH, 'lbs');
    assert.deepEqual([b.top, b.opened, b.afterOpened, b.gain, b.afterGain, b.chart], ['185', '185', ' in week 2 · heaviest in week 2', null, '', null]);
    const p = mainBlock(PULLUPS, 'kg');
    assert.deepEqual([p.top, p.opened, p.afterOpened, p.gain, p.afterGain], ['10 reps', '8 reps', ' in week 1 · up ', '2 reps', ' · best in week 2'], 'reps are never converted');
  });

  it('tracks an accessory\'s sets on its range: a tick per rep, the sets as dots nudged apart, the ends labelled', () => {
    // 10 to 15 over 140: 28 per rep. Two sets of 12 land at 56, the second nudged 5.5 left; the set of 10 at 0.
    const t = ladderTrack(RAISE);
    assert.deepEqual([t.viewBox, t.style], ['-8 0 156 26', 'width:140px;height:26px;overflow:visible']);
    assert.deepEqual(t.els.filter((e) => e.el === 'line').map((e) => e.a['x1']), ['0.0', '28.0', '56.0', '84.0', '112.0', '140.0', '0']);
    assert.deepEqual(t.els.filter((e) => e.el === 'rect'), [], 'the lowest set is the bottom of the range: nothing filled');
    assert.deepEqual(t.els.filter((e) => e.el === 'circle').map((e) => e.a['cx']), ['56.0', '50.5', '0.0']);
    const ends = t.els.filter((e) => e.el === 'text');
    assert.deepEqual(ends.map((e) => [e.text, e.a['fill'], e.a['font-weight']]), [['10', 'rgba(24,23,18,0.3)', undefined], ['15', 'rgba(24,23,18,0.3)', undefined]]);
  });

  it('fills a ready accessory\'s track to the top in the signal colour', () => {
    const t = ladderTrack(ROW);
    assert.deepEqual(t.els.filter((e) => e.el === 'rect').map((e) => [e.a['width'], e.a['opacity'], e.a['fill']]), [['140.0', '0.5', 'var(--signal)'], ['140', '0.75', 'var(--signal)']]);
    assert.deepEqual(t.els.filter((e) => e.el === 'circle').map((e) => e.a['cx']), ['140.0', '134.5', '129.0']);
    assert.deepEqual(t.els.filter((e) => e.el === 'text').at(-1)!.a['font-weight'], '700');
  });

  it('accounts for every session in the Main Lifts footer, counts the ladder, and lists the rest', () => {
    const v = ledgerView({
      mains: [SQUAT, BENCH, PULLUPS], ladder: [ROW, RAISE],
      plain: [{ name: 'Farmer carry', wt: 70, sets: [], sessions: 3, range: [60, 70] }, { name: 'Sled push', wt: 90, sets: [], sessions: 1, range: [90, 90] }],
      unloaded: [{ name: 'Plank hold', sessions: 4, reps: 0 }, { name: 'Pushups', sessions: 2, reps: 1250 }],
    }, 'lbs', (n, s) => `[${n}/${s}]`);
    assert.equal(v.mains!.title, '[🏋/15] Main Lifts');
    assert.match(v.mains!.foot, / 1 session where this ran as an accessory is kept off the line\. .* 3 sessions had no load written down\. Add the weight and they join the line\.$/);
    assert.deepEqual([v.ladder!.ready, v.ladder!.ups], [1, 3]);
    assert.deepEqual(v.ladder!.rows.map((r) => [r.weight, r.detail, r.ready, r.toGo]), [
      ['70 lbs', ' · 12/12/12 reps · ↑2 this block', true, 0],
      ['20 lbs', ' · 12/12/10 reps · ↑1 this block', false, 5],
    ]);
    assert.deepEqual(v.other!.rows, [
      { name: 'Farmer carry', meta: '60–70 lbs · 3 sessions' }, { name: 'Sled push', meta: '90 lbs · 1 sessions' },
      { name: 'Plank hold', meta: '4 sessions' }, { name: 'Pushups', meta: '1,250 reps · 2 sessions' },
    ]);
    assert.deepEqual(ledgerView({ mains: [], ladder: [], plain: [], unloaded: [] }, 'kg', () => ''), { mains: null, ladder: null, other: null });
  });
});
