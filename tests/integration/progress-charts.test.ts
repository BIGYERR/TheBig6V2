// Progress's run charts moved from the legacy builders (progress-charts.js, buildPaceChart in progress-data.js) to
// card specs the app's ChartCard component draws (frontends/app/src/app/screens/progress/charts/run-charts-model.ts,
// architecture phase E step 15). The oracle here is the legacy builder itself, lifted out of the page with appFunction:
// for every input below, the spec written back out in the legacy markup format is the legacy builder's markup, byte for
// byte. The inputs walk each builder's branches (the null cases, the race line, the cut and short first week, the
// target line, coarse and fine grids). The app's own unit tests hold hand-worked values for the same functions.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { appFunction } from '../support/app.ts';
import type { CardSpec, SvgEl } from '../../frontends/app/src/app/screens/progress/charts/chart-card-model.ts';
import {
  driftChart, easyBandsFallback, easyEffortChart, easyEffortEmpty, easyZoneChart, ladderChart, paceChart, projectionCard, type RunChartDeps,
} from '../../frontends/app/src/app/screens/progress/charts/run-charts-model.ts';

type Fn = (...a: any[]) => string;
const icon = (n: string, s: number) => `[${n}/${s}]`;
const mileFromRecovery = (sec: number) => (sec > 0 ? sec * 0.62 : null);
const halfFromMile = (sec: number) => (sec > 0 ? sec * 21.4 : null);
const _clkMS = appFunction('_clkMS');
const _fmtPaceShort = appFunction('_fmtPaceShort', { _clkMS });
const base = { _iaCard: appFunction('_iaCard'), _axTx: appFunction('_axTx'), asyIcon: icon, _fmtPaceShort };
const legacy = {
  ladder: appFunction<Fn>('buildLadderChart', base),
  effort: appFunction<Fn>('buildEasyEffortChart', { ...base, EASY_RPE_LO: 3, EASY_RPE_HI: 4 }),
  effortEmpty: appFunction<Fn>('buildEasyEffortEmpty', { ...base, EASY_MIN_RUNS: 6, EASY_RPE_LO: 3, EASY_RPE_HI: 4 }),
  projection: appFunction<Fn>('buildProjectionCard', { ...base, _mileFromRecoverySec: mileFromRecovery, _halfFromMileSec: halfFromMile, _fmtHMS: appFunction('_fmtHMS') }),
  drift: appFunction<Fn>('buildDriftChart', base),
  zone: appFunction<Fn>('buildEasyZoneChart', { ...base, EASY_ZONE_MIN_RUNS: 4 }),
  bands: appFunction<Fn>('buildEasyBandsFallback', base),
  pace: appFunction<Fn>('buildPaceChart', { _fmtPaceShort }),
};
const d: RunChartDeps = {
  pace: (sec) => _fmtPaceShort(sec), icon, mileFromRecovery, halfFromMile, easyRpeLo: 3, easyRpeHi: 4, easyMinRuns: 6, easyZoneMinRuns: 4,
};

/** A spec written out as the legacy builders wrote markup. */
function markup(c: CardSpec | null): string {
  if (!c) return '';
  const el = (e: SvgEl) => {
    const attrs = Object.entries(e.a).map(([k, v]) => ` ${k}="${v}"`).join('');
    return e.el === 'text' ? `<text${attrs}>${e.text}</text>` : `<${e.el}${attrs}/>`;
  };
  const svg = c.svg
    ? `<svg viewBox="0 0 ${c.svg.w} ${c.svg.h}"${c.titleGap === 10 ? ' xmlns="http://www.w3.org/2000/svg"' : ''} style="width:100%;height:auto;overflow:visible">${c.svg.els.map(el).join('')}</svg>`
    : '';
  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">'
    + `<div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${c.color};margin-bottom:${c.titleGap}px">${c.title}</div>`
    + (c.head ?? '') + svg + (c.body ?? '')
    + (c.foot ? `<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">${c.foot}</div>` : '')
    + '</div>';
}

function same(name: string, cases: [string, () => string, () => CardSpec | null][]) {
  describe(name, () => {
    for (const [label, old, now] of cases) {
      test(label, () => {
        const want = old();
        assert.equal(markup(now()), want);
        if (label.startsWith('nothing')) assert.equal(want, '', 'the legacy builder drew nothing');
        else assert.notEqual(want, '', 'the legacy builder drew a chart');
      });
    }
  });
}

same('the Long Run Ladder', [
  ['two long runs, short of the race', () => legacy.ladder({ 1: 4, 2: 6 }, 4, 13.1, 0, false), () => ladderChart({ 1: 4, 2: 6 }, 4, 13.1, 0, false, d)],
  ['race distance covered, a week in progress, a short first week, twelve weeks', () => legacy.ladder({ 1: 8, 2: 14, 3: 13 }, 12, 13.1, 3, true), () => ladderChart({ 1: 8, 2: 14, 3: 13 }, 12, 13.1, 3, true, d)],
  ['no race, gaps between runs', () => legacy.ladder({ 2: 5.5, 5: 9 }, 8, 0, 0, false), () => ladderChart({ 2: 5.5, 5: 9 }, 8, 0, 0, false, d)],
  ['a marathon, a coarse grid', () => legacy.ladder({ 1: 18, 2: 22, 4: 20 }, 16, 26.2, 0, false), () => ladderChart({ 1: 18, 2: 22, 4: 20 }, 16, 26.2, 0, false, d)],
  ['nothing: one long run', () => legacy.ladder({ 1: 5 }, 6, 6.2, 0, false), () => ladderChart({ 1: 5 }, 6, 6.2, 0, false, d)],
]);

same('Same Effort, More Speed', [
  ['pace falling', () => legacy.effort({ weekly: { 1: 660, 3: 640, 4: 630 }, nRuns: 7 }, 6), () => easyEffortChart({ weekly: { 1: 660, 3: 640, 4: 630 }, nRuns: 7 }, 6, d)],
  ['pace not moved', () => legacy.effort({ weekly: { 1: 600, 2: 610 }, nRuns: 6 }, 4), () => easyEffortChart({ weekly: { 1: 600, 2: 610 }, nRuns: 6 }, 4, d)],
  ['a wide spread, ten weeks', () => legacy.effort({ weekly: { 1: 900, 6: 600, 10: 610 }, nRuns: 9 }, 10), () => easyEffortChart({ weekly: { 1: 900, 6: 600, 10: 610 }, nRuns: 9 }, 10, d)],
  ['nothing: one week', () => legacy.effort({ weekly: { 2: 600 }, nRuns: 6 }, 6), () => easyEffortChart({ weekly: { 2: 600 }, nRuns: 6 }, 6, d)],
]);

same('Same Effort, More Speed, before there is enough', [
  ['two runs of six', () => legacy.effortEmpty({ nRuns: 2 }), () => easyEffortEmpty({ weekly: {}, nRuns: 2 }, d)],
  ['six runs in one week', () => legacy.effortEmpty({ nRuns: 6 }), () => easyEffortEmpty({ weekly: {}, nRuns: 6 }, d)],
]);

same('Where This Is Heading', [
  ['with the signup mile', () => legacy.projection({ weekly: { 1: 640, 2: 625, 4: 610 } }, 8, 420), () => projectionCard({ weekly: { 1: 640, 2: 625, 4: 610 }, nRuns: 8 }, 8, 420, d)],
  ['without one', () => legacy.projection({ weekly: { 1: 700, 3: 650 } }, 12, 0), () => projectionCard({ weekly: { 1: 700, 3: 650 }, nRuns: 6 }, 12, 0, d)],
  ['nothing: one week', () => legacy.projection({ weekly: { 1: 700 } }, 12, 0), () => projectionCard({ weekly: { 1: 700 }, nRuns: 6 }, 12, 0, d)],
]);

same('Mileage, Drift From Plan', [
  ['over, under and on', () => legacy.drift({ 1: { presc: 10, act: 12 }, 2: { presc: 12, act: 9 }, 3: { presc: 14, act: 14 } }, 6, 0, false), () => driftChart({ 1: { presc: 10, act: 12 }, 2: { presc: 12, act: 9 }, 3: { presc: 14, act: 14 } }, 6, 0, false, d)],
  ['a coarse grid, a week in progress, a short first week', () => legacy.drift({ 2: { presc: 30, act: 10 }, 3: { presc: 5, act: 9 } }, 10, 4, true), () => driftChart({ 2: { presc: 30, act: 10 }, 3: { presc: 5, act: 9 } }, 10, 4, true, d)],
  ['nothing: one week', () => legacy.drift({ 1: { presc: 3, act: 3 } }, 6, 0, false), () => driftChart({ 1: { presc: 3, act: 3 } }, 6, 0, false, d)],
]);

const run = (w: number, sec: number, tgt: number, cap: number) => ({ w, sec, tgt, cap, hot: sec < cap });
same('Is Your Easy Actually Easy? (the plan\'s ceiling)', [
  ['every run easy', () => legacy.zone([run(1, 640, 630, 580), run(1, 650, 630, 580), run(2, 635, 625, 575), run(3, 660, 640, 590)]), () => easyZoneChart([run(1, 640, 630, 580), run(1, 650, 630, 580), run(2, 635, 625, 575), run(3, 660, 640, 590)], d)],
  ['two too fast, the aim drawn', () => legacy.zone([run(1, 560, 700, 600), run(2, 650, 700, 600), run(2, 590, 700, 600), run(3, 680, 700, 600), run(4, 720, 700, 600)]), () => easyZoneChart([run(1, 560, 700, 600), run(2, 650, 700, 600), run(2, 590, 700, 600), run(3, 680, 700, 600), run(4, 720, 700, 600)], d)],
  ['a narrow range widened, seven runs', () => legacy.zone([1, 2, 3, 4, 5, 6, 7].map((w) => run(w, 600 + w, 610, 590))), () => easyZoneChart([1, 2, 3, 4, 5, 6, 7].map((w) => run(w, 600 + w, 610, 590)), d)],
  ['nothing: three runs', () => legacy.zone([run(1, 600, 610, 590), run(2, 600, 610, 590), run(3, 600, 610, 590)]), () => easyZoneChart([run(1, 600, 610, 590), run(2, 600, 610, 590), run(3, 600, 610, 590)], d)],
]);

const secs = (...xs: number[]) => xs.map((sec) => ({ sec }));
same('Is Your Easy Actually Easy? (easy against hard)', [
  ['clean separation', () => legacy.bands({ Easy: secs(620, 640), Recovery: secs(680), Tempo: secs(480), Interval: secs(430, 450) }), () => easyBandsFallback({ Easy: secs(620, 640), Recovery: secs(680), Tempo: secs(480), Interval: secs(430, 450) }, d)],
  ['one medium speed', () => legacy.bands({ Easy: secs(540, 600), Tempo: secs(560, 520) }), () => easyBandsFallback({ Easy: secs(540, 600), Tempo: secs(560, 520) }, d)],
  ['nothing: one hard run', () => legacy.bands({ Easy: secs(600, 610), Tempo: secs(500) }), () => easyBandsFallback({ Easy: secs(600, 610), Tempo: secs(500) }, d)],
]);

same('Recovery Pace, Easy-Effort Trend', [
  ['with the plan target', () => legacy.pace('[🏃/15] Recovery Pace — Easy-Effort Trend', [1, 2, 3, 4], [650, null, 640, 630], 645, 'var(--run)'), () => paceChart('[🏃/15] Recovery Pace — Easy-Effort Trend', [1, 2, 3, 4], [650, null, 640, 630], 645, 'var(--run)', d)],
  ['without one, twelve weeks', () => legacy.pace('t', Array.from({ length: 12 }, (_, i) => i + 1), [null, 700, 690, null, null, 680, 675, null, null, null, 660, 655], null, 'var(--run)'), () => paceChart('t', Array.from({ length: 12 }, (_, i) => i + 1), [null, 700, 690, null, null, 680, 675, null, null, null, 660, 655], null, 'var(--run)', d)],
  ['twenty weeks, no two neighbours', () => legacy.pace('t', Array.from({ length: 20 }, (_, i) => i + 1), Array.from({ length: 20 }, (_, i) => (i % 2 ? null : 700 - i)), 0, '#7e5e96'), () => paceChart('t', Array.from({ length: 20 }, (_, i) => i + 1), Array.from({ length: 20 }, (_, i) => (i % 2 ? null : 700 - i)), 0, '#7e5e96', d)],
  ['nothing: one week', () => legacy.pace('t', [1, 2], [600, null], 610, 'var(--run)'), () => paceChart('t', [1, 2], [600, null], 610, 'var(--run)', d)],
]);
