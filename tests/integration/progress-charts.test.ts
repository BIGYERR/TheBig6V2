// Progress's run charts moved from the legacy builders (progress-charts.ts, buildPaceChart in progress-data.ts) to
// card specs the app's ChartCard component draws (frontends/app/src/app/screens/progress/charts/run-charts-model.ts,
// architecture phase E step 15). The oracle here is the legacy builder itself, lifted out of the page with appFunction:
// for every input below, the spec written back out in the legacy markup format is the legacy builder's markup, byte for
// byte. The inputs walk each builder's branches (the null cases, the race line, the cut and short first week, the
// target line, coarse and fine grids). The Lift Ledger (ledger-model.ts, step 16) and the program chips
// (program-chips-model.ts, step 17) are held the same way to the legacy buildLedgerCards and _progChipsHTML. The app's own unit tests hold hand-worked values for the same functions.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { appFunction } from '../support/app.ts';
import type { CardSpec, SvgEl } from '../../frontends/app/src/app/screens/progress/charts/chart-card-model.ts';
import {
  driftChart, easyBandsFallback, easyEffortChart, easyEffortEmpty, easyZoneChart, ladderChart, paceChart, projectionCard, type RunChartDeps,
} from '../../frontends/app/src/app/screens/progress/charts/run-charts-model.ts';
import { type LedgerModel, type LedgerView, ledgerView, type Picture } from '../../frontends/app/src/app/screens/progress/charts/ledger-model.ts';
import { type ChipProgram, type ChipsView, chipStyle, chipsView } from '../../frontends/app/src/app/screens/progress/program-chips-model.ts';

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

// ── the Lift Ledger ─────────────────────────────────────────────────────────────────────────────────────────────
const _axTx = base._axTx;
const _ladderTrack = appFunction('_ladderTrack', { _axTx });
const legacyLedger = appFunction<(m: LedgerModel, unit: string) => string>('buildLedgerCards', {
  ...base, buildMainLiftBlock: appFunction('buildMainLiftBlock', { _axTx }), _ladderRow: appFunction('_ladderRow', { _ladderTrack }),
});

/** A ledger view written out as buildLedgerCards wrote it. */
function ledgerMarkup(v: LedgerView): string {
  const el = (e: SvgEl) => {
    const attrs = Object.entries(e.a).map(([k, val]) => ` ${k}="${val}"`).join('');
    return e.el === 'text' ? `<text${attrs}>${e.text}</text>` : `<${e.el}${attrs}/>`;
  };
  const pic = (p: Picture) => `<svg viewBox="${p.viewBox}" style="${p.style}">${p.els.map(el).join('')}</svg>`;
  const card = (title: string, color: string, inner: string, foot: string) =>
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">'
    + `<div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${color};margin-bottom:12px">${title}</div>`
    + inner + `<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">${foot}</div></div>`;
  let out = '';
  if (v.mains) {
    out += card(v.mains.title, 'var(--lift)', v.mains.blocks.map((b) => '<div style="padding:12px 0;border-bottom:1px solid var(--border)">'
      + '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">'
      + `<div style="font-size:13px;color:var(--text);font-weight:600;line-height:1.3">${b.name}</div>`
      + `<div style="font-family:var(--font-display);font-size:19px;font-weight:700;color:var(--lift);white-space:nowrap">${b.top}</div></div>`
      + `<div style="font-size:11px;color:var(--muted);margin:2px 0 8px">Opened at <b style="color:var(--text)">${b.opened}</b>${b.afterOpened}`
      + (b.gain ? `<b style="color:var(--lift)">${b.gain}</b>${b.afterGain}` : '') + '</div>' + (b.chart ? pic(b.chart) : '') + '</div>').join(''), v.mains.foot);
  }
  if (v.ladder) {
    const l = v.ladder;
    const head = '<div style="display:flex;align-items:baseline;gap:9px;margin-bottom:2px">'
      + `<div style="font-family:var(--font-display);font-size:30px;font-weight:700;letter-spacing:-0.02em;color:${l.ready ? 'var(--signal)' : 'var(--muted)'};line-height:1.05">${l.ready}</div>`
      + '<div style="font-size:13px;color:var(--text);font-weight:600">ready to move up</div></div>'
      + '<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px">'
      + (l.ups ? `You have stepped the weight up <b style="color:var(--text)">${l.ups} time${l.ups === 1 ? '' : 's'}</b> across these lifts this block. ` : '')
      + 'Hit the top of the range on every set, then add weight and start back at the bottom.</div>';
    const rows = l.rows.map((r) => '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">'
      + '<div style="flex:1;min-width:0">'
      + `<div style="font-size:12px;color:var(--text);font-weight:500;line-height:1.3">${r.name}</div>`
      + `<div style="font-size:10px;color:var(--muted);margin-top:2px"><b style="color:var(--text)">${r.weight}</b>${r.detail}</div>`
      + '<div style="margin-top:3px">' + (r.ready
        ? '<span style="font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--signal)">Add weight</span>'
        : `<span style="font-size:10px;color:var(--muted)">${r.toGo} to go</span>`) + '</div></div>'
      + `<div style="flex-shrink:0">${pic(r.track)}</div></div>`).join('');
    out += card(l.title, 'var(--lift)', head + rows, l.foot);
  }
  if (v.other) {
    out += card(v.other.title, 'var(--muted)', v.other.rows.map((r) => '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">'
      + `<div style="font-size:12px;color:var(--text)">${r.name}</div><div style="font-size:10px;color:var(--muted);white-space:nowrap">${r.meta}</div></div>`).join(''), v.other.foot);
  }
  return out;
}

const LEDGER: LedgerModel = {
  mains: [
    { name: 'Back squat', mode: 'load', series: [{ w: 1, v: 225 }, { w: 2, v: 235 }, { w: 3, v: 245 }, { w: 5, v: 240 }], heavy: { v: 245, reps: 5, week: 3 }, first: { v: 225, reps: 5, week: 1 }, accessoryDay: 1, noLoad: 2 },
    { name: 'Barbell bench press', mode: 'load', series: [{ w: 2, v: 185 }], heavy: { v: 185, reps: null, week: 2 }, first: { v: 185, reps: null, week: 2 }, accessoryDay: 0, noLoad: 1 },
    { name: 'Pullups', mode: 'reps', series: [{ w: 1, v: 8 }, { w: 2, v: 10 }], heavy: { v: 10, reps: null, week: 2 }, first: { v: 8, reps: null, week: 1 }, accessoryDay: 0, noLoad: 0 },
  ],
  ladder: [
    { name: 'Dumbbell row', wt: 70, lo: 8, hi: 12, sets: [12, 12, 12], ready: true, ups: 2, sessions: 4 },
    { name: 'Lateral raise', wt: 20, lo: 10, hi: 15, sets: [12, 12, 10], ready: false, ups: 0, sessions: 3 },
    { name: 'Face pull', wt: 40, lo: 15, hi: 15, sets: [15], ready: true, ups: 1, sessions: 1 },
  ],
  plain: [{ name: 'Farmer carry', wt: 70, sets: [], sessions: 3, range: [60, 70] }, { name: 'Sled push', wt: 90, sets: [], sessions: 1, range: [90, 90] }],
  unloaded: [{ name: 'Plank hold', sessions: 4, reps: 0 }, { name: 'Pushups', sessions: 2, reps: 1250 }],
};

describe('the Lift Ledger', () => {
  for (const [label, model, unit] of [
    ['every card, in pounds', LEDGER, 'lbs'],
    ['every card, in kilograms', LEDGER, 'kg'],
    ['main lifts alone, nothing kept off the line', { ...LEDGER, mains: [LEDGER.mains[2]!], ladder: [], plain: [], unloaded: [] }, 'lbs'],
    ['the ladder alone, nothing stepped up, nothing ready', { mains: [], ladder: [{ ...LEDGER.ladder[1]!, ups: 0 }], plain: [], unloaded: [] }, 'lbs'],
    ['other work alone', { mains: [], ladder: [], plain: [], unloaded: LEDGER.unloaded }, 'lbs'],
    ['nothing at all', { mains: [], ladder: [], plain: [], unloaded: [] }, 'lbs'],
  ] as [string, LedgerModel, string][]) {
    test(label, () => {
      const want = legacyLedger(model, unit);
      assert.equal(ledgerMarkup(ledgerView(model, unit, icon)), want);
      if (label === 'nothing at all') assert.equal(want, '');
      else assert.notEqual(want, '');
    });
  }
});

// ── the program chips and the archived bar ─────────────────────────────────────────────────────────────────────────
// The legacy bar is an indented template literal inside flex rows, so the whitespace between its tags never renders;
// both sides drop it before comparing.

function chipsLegacy(programs: ChipProgram[], vid: string, g: { activeProgId: string | null; confirmProgId: string | null; confirmTier: number; warns: boolean }): string {
  const esc = appFunction('esc');
  const _purgeWarnsCrossProg = () => g.warns;
  const _restoreBarHTML = appFunction('_restoreBarHTML', { confirmProgId: g.confirmProgId, confirmTier: g.confirmTier, esc, _purgeWarnsCrossProg, asyIcon: icon });
  return appFunction<(p: ChipProgram[], v: string) => string>('_progChipsHTML', { activeProgId: g.activeProgId, asyIcon: icon, _restoreBarHTML })(programs, vid);
}
function chipsMarkup(v: ChipsView): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  let out = '';
  if (v.chips) out += '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch">'
    + v.chips.map((c) => `<button onclick="setProgressView('${c.id}')" style="${chipStyle(c.sel)}">${c.label}</button>`).join('') + '</div>';
  const b = v.bar;
  if (b && b.kind === 'confirm') {
    out += '<div style="display:flex;flex-direction:column;gap:8px;background:var(--surface);border:1px solid var(--red);border-radius:4px;padding:10px 12px">'
      + `<div style="font-size:12px;color:var(--red);line-height:1.5">This erases all logs, weights, and history for “${esc(b.name)}”. It cannot be undone.`
      + (b.warn ? '<br><span style="color:var(--muted)">Other programs are using these loads as starting points — those will go blank.</span>' : '') + '</div>'
      + `<div style="display:flex;gap:8px"><button class="prog-action-btn danger" onclick="deleteProg('${b.id}',true)">Delete Forever</button><button class="prog-action-btn" onclick="cancelProgressConfirm()">Cancel</button></div></div>`;
  } else if (b) {
    out += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:10px 12px">'
      + '<div style="font-size:12px;color:var(--muted)">This program is archived — history only.</div>'
      + `<button class="prog-action-btn" style="flex:0 0 auto" onclick="unarchiveProg('${b.id}');renderProgressScreen()">Restore</button>`
      + `<button class="prog-action-btn" aria-label="Delete this program forever" title="Delete forever" style="flex:0 0 auto;color:var(--red);padding:8px 10px;display:inline-flex;align-items:center" onclick="askPurgeFromProgress('${b.id}')">${icon('trash', 16)}</button></div>`;
  }
  return out;
}
const tight = (s: string) => s.replace(/>\s+</g, '><').trim();

describe('the program chips and the archived bar', () => {
  const live = (id: string, created: number, name?: string): ChipProgram => ({ id, created, ...(name ? { name } : {}) });
  const P = [live('a', 1, 'Spring Base'), { ...live('b', 3, 'Old Block'), archived: true }, live('c', 2, 'Half Manny'), live('d', 4)];
  for (const [label, programs, vid, g] of [
    ['four programs, the active first, the live by newest, the archived last', P, 'c', { activeProgId: 'c', confirmProgId: null, confirmTier: 0, warns: false }],
    ['an archived program shown, with its bar', P, 'b', { activeProgId: 'a', confirmProgId: null, confirmTier: 0, warns: false }],
    ['its delete armed, other programs using its loads', P, 'b', { activeProgId: 'a', confirmProgId: 'b', confirmTier: 2, warns: true }],
    ['its delete armed, nothing else at stake, a name with markup', [{ ...P[1]!, name: 'A <b> & "Q"' }, P[0]!], 'b', { activeProgId: null, confirmProgId: 'b', confirmTier: 2, warns: false }],
    ['an archive armed elsewhere is not this bar\'s', P, 'b', { activeProgId: 'a', confirmProgId: 'b', confirmTier: 1, warns: true }],
    ['one archived program alone: the bar, no chips', [P[1]!], 'b', { activeProgId: null, confirmProgId: null, confirmTier: 0, warns: false }],
    ['one live program alone: nothing', [P[0]!], 'a', { activeProgId: 'a', confirmProgId: null, confirmTier: 0, warns: false }],
  ] as [string, ChipProgram[], string, { activeProgId: string | null; confirmProgId: string | null; confirmTier: number; warns: boolean }][]) {
    test(label, () => {
      const want = tight(chipsLegacy(programs, vid, g));
      const got = chipsView(programs, vid, { activeId: g.activeProgId, confirmId: g.confirmProgId, confirmTier: g.confirmTier, warnsCrossProg: () => g.warns, icon });
      assert.equal(tight(chipsMarkup(got)), want);
      assert.equal(want === '', label.endsWith('nothing'));
    });
  }
});
