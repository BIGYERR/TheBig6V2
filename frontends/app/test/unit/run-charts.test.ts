// Progress's run charts (src/app/screens/progress/charts/run-charts-model.ts, architecture phase E step 15), with
// values worked by hand from the legacy builders' constants. The ladder: a 320 × 152 box, 26 in from the left, 10 from
// the right, 20 from the top and 26 from the bottom, so the plot is 284 wide and 106 tall; with a 13.1 mile race the
// top is 13.1 × 1.12 = 14.672 and a value v sits at 126 − v/14.672 × 106. Four weeks give slots 71 wide with bars of
// 42.6. tests/integration/progress-charts.test.ts holds every chart to its legacy builder's markup byte for byte.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SvgEl } from '../../src/app/screens/progress/charts/chart-card-model.ts';
import {
  driftChart, easyBandsFallback, easyEffortChart, easyEffortEmpty, easyZoneChart, fmtHMS, ladderChart, paceChart, projectionCard, type RunChartDeps,
} from '../../src/app/screens/progress/charts/run-charts-model.ts';

const clock = (sec: number) => Math.floor(Math.round(sec) / 60) + ':' + String(Math.round(sec) % 60).padStart(2, '0');
const d: RunChartDeps = {
  pace: clock, icon: (n) => `[${n}]`, mileFromRecovery: (sec) => sec * 0.6, halfFromMile: (sec) => sec * 21,
  easyRpeLo: 3, easyRpeHi: 4, easyMinRuns: 6, easyZoneMinRuns: 4,
};
const texts = (els: SvgEl[]) => els.filter((e) => e.el === 'text').map((e) => e.text);
const of = (els: SvgEl[], el: SvgEl['el']) => els.filter((e) => e.el === el).map((e) => e.a);

describe('the run charts', () => {
  it('ladders the long runs: the grid every 5, the race line, the best bar bolder, the empty weeks dashed', () => {
    const c = ladderChart({ 1: 4, 2: 6 }, 4, 13.1, 0, false, d)!;
    const els = c.svg!.els;
    assert.deepEqual(of(els, 'line').map((a) => a['y1']), ['126.0', '89.9', '53.8', '31.4']);
    assert.deepEqual(texts(els), ['0', '5', '10', 'RACE — 13.1 mi', 'W1', 'W2', 'W3', 'W4']);
    assert.deepEqual(of(els, 'rect').map((a) => [a['x'], a['y'], a['height'], a['opacity'] ?? a['stroke-dasharray']]), [
      ['40.2', '97.1', '28.9', '0.62'], ['111.2', '82.7', '43.3', '0.95'], ['182.2', '118.0', '8', '2,2'], ['253.2', '118.0', '8', '2,2'],
    ]);
    assert.equal(c.foot, 'Furthest so far <b style="color:var(--run)">6.0 mi</b> in W2 — <b style="color:var(--text)">7.1 mi</b> from race distance.');
    assert.deepEqual([c.title, c.color, c.titleGap, c.svg!.w, c.svg!.h], ['[🏃] Long Run Ladder', 'var(--run)', 12, 320, 152]);
    assert.equal(ladderChart({ 1: 5 }, 4, 13.1, 0, false, d), null, 'one long run is not a ladder');
  });

  it('says when race distance is covered and which weeks are not counted', () => {
    assert.equal(ladderChart({ 1: 8, 2: 14 }, 12, 13.1, 3, true, d)!.foot,
      'Furthest so far <b style="color:var(--run)">14.0 mi</b> in W2 — you have already covered race distance. Week 3 is still in progress and is not counted yet. Week 1 was a short first week and is not counted here or in the mileage above.');
  });

  it('reads the effort trend: a drop in seconds at the same effort, or none yet', () => {
    assert.match(easyEffortChart({ weekly: { 1: 660, 3: 640, 4: 630 }, nRuns: 7 }, 6, d)!.foot!, /Pace fell <b style="color:var\(--run\)">30 sec\/mi<\/b> at the same effort/);
    assert.match(easyEffortChart({ weekly: { 1: 600, 2: 610 }, nRuns: 6 }, 4, d)!.foot!, /Pace has not moved yet at this effort\./);
    assert.equal(easyEffortChart({ weekly: { 2: 600 }, nRuns: 6 }, 4, d), null);
  });

  it('counts the easy runs the effort chart still needs', () => {
    assert.match(easyEffortEmpty({ weekly: {}, nRuns: 2 }, d).body!, /You have <b style="color:var\(--text\)">2<\/b>, so 4 to go\./);
    assert.match(easyEffortEmpty({ weekly: {}, nRuns: 6 }, d).body!, /You have <b style="color:var\(--text\)">6<\/b>\. Adding/);
  });

  it('projects a half finish from easy pace: 625 s/mi reads to a 375 s mile and a 7875 s half, give or take 2.5%', () => {
    const c = projectionCard({ weekly: { 1: 640, 2: 625 }, nRuns: 6 }, 8, 420, d)!;
    assert.match(c.head!, />2:07:58 – 2:14:32<\/div>/);
    assert.match(c.foot!, /Opened the block at <b>2:14:24<\/b>\. The dashed line is the 7:00 mile you entered at signup/);
    assert.equal(of(c.svg!.els, 'polygon').length, 1);
    assert.deepEqual([fmtHMS(7678.125), fmtHMS(3599.6), fmtHMS(59)], ['2:07:58', '1:00:00', '0:00:59']);
  });

  it('bars the drift from plan, red under, with the net and the zero line', () => {
    const c = driftChart({ 1: { presc: 10, act: 12 }, 2: { presc: 12, act: 9 }, 3: { presc: 14, act: 14 } }, 6, 0, false, d)!;
    assert.deepEqual(of(c.svg!.els, 'rect').map((a) => [a['fill'], a['height']]), [['var(--run)', a2(c, 0)], ['var(--red)', a2(c, 1)], ['var(--run)', '1.2']]);
    assert.ok(texts(c.svg!.els).includes('as written'));
    assert.equal(c.foot, 'Written <b>36.0 mi</b> · logged <b style="color:var(--run)">35.0 mi</b> across 3 weeks — <b style="color:var(--red)">-1.0 mi</b> net. Distance-prescribed runs only; time-based runs carry no written mileage to compare against.');
  });

  it('holds easy runs to the plan\'s ceiling: how many came in too fast, the ceiling and the aim', () => {
    const run = (w: number, sec: number) => ({ w, sec, tgt: 700, cap: 600, hot: sec < 600 });
    const c = easyZoneChart([run(1, 560), run(2, 650), run(2, 590), run(3, 680), run(4, 720)], d)!;
    assert.deepEqual([c.color, c.head!.includes('>2 of 5 were too fast<')], ['var(--red)', true]);
    assert.match(c.head!, /The plan asks for 11:40\/mi and sets a ceiling at 10:00\/mi\. 2 runs came in under it/);
    assert.deepEqual(texts(c.svg!.els).slice(0, 3), ['too fast', 'CEILING 10:00', 'aim 11:40']);
    assert.equal(easyZoneChart([run(1, 650), run(2, 650), run(3, 650)], d), null, 'three runs are too few');
  });

  it('sets the easy range against the hard one, and calls an overlap one medium speed', () => {
    const s = (...xs: number[]) => xs.map((sec) => ({ sec }));
    const ok = easyBandsFallback({ Easy: s(620, 640), Recovery: s(680), Tempo: s(480), Interval: s(430, 450) }, d)!;
    assert.match(ok.head!, />Yes — comfortably<\/div>.*Your easiest run is 2:20\/mi slower than your hardest\./);
    assert.ok(texts(ok.svg!.els).includes('2:20 gap'));
    const flat = easyBandsFallback({ Easy: s(540, 600), Tempo: s(560, 520) }, d)!;
    assert.match(flat.head!, />Not really<\/div>.*Only 0:20\/mi separates your easiest run from your hardest\./);
    assert.equal(easyBandsFallback({ Easy: s(600, 610), Tempo: s(500) }, d), null);
  });

  it('draws the recovery pace trend on its own card, faster upward, with the plan target and the latest pace', () => {
    const c = paceChart('[🏃] Recovery Pace — Easy-Effort Trend', [1, 2, 3, 4], [650, null, 640, 630], 645, 'var(--run)', d)!;
    assert.deepEqual([c.titleGap, c.foot, c.head], [10, null, null]);
    const t = texts(c.svg!.els);
    assert.ok(t.includes('PLAN 10:45/mi') && t.includes('10:30') && t.includes('higher = faster easy pace · dashed = plan target'));
    assert.equal(paceChart('t', [1, 2], [600, null], 610, 'var(--run)', d), null, 'one dot is not a trend');
  });
});

/** A drift bar's height worked by hand: the deltas +2, −3 and 0 span 5 miles, padded by the larger of 1 and 18% of that. */
function a2(_c: unknown, i: number): string {
  const lo = -3 - 1, hi = 2 + 1, plotH = 128 - 12 - 26;
  return Math.max((Math.abs([2, -3][i]!) / (hi - lo)) * plotH, 1.2).toFixed(1);
}
