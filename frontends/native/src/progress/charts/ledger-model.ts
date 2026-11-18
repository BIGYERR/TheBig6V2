// The Lift Ledger, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase E,
// step 16: the legacy buildLedgerCards, buildMainLiftBlock, _ladderRow and _ladderTrack become the LedgerCards
// component). The ledger's rows still come from the legacy ledgerModel; this lays them out as the legacy cards did:
// Main Lifts (the top set each session, with its line), the Range Ladder (each accessory's sets on its rep range) and
// Other Accessory Work. Every number and word is the legacy builders'.
import { axTx, gridLine, type SvgEl, svgEl } from './chart-card-model.ts';

/** A point on a main lift's line, and its top set. */
export interface LiftPoint {
  v: number;
  reps?: number | null;
  week: number;
  /** The variant when the Deadlift line's point was not the conventional deadlift (D255). */
  tag?: string | null;
}

/** The legacy ledgerModel's rows. */
export interface LedgerModel {
  mains: {
    name: string;
    mode: 'load' | 'reps';
    series: { w: number; v: number; tag?: string | null }[];
    heavy: LiftPoint;
    first: LiftPoint;
    accessoryDay: number;
    noLoad: number;
  }[];
  ladder: { name: string; wt: number; lo: number; hi: number; sets: number[]; ready: boolean; ups: number; sessions: number }[];
  plain: { name: string; wt: number; sets: number[]; sessions: number; range: [number, number] }[];
  unloaded: { name: string; sessions: number; reps: number }[];
}

/** An SVG to draw: its viewBox, its style, and its elements. */
export interface Picture {
  viewBox: string;
  style: string;
  els: SvgEl[];
}

/**
 * One main lift's block. The line under the name is cut where the legacy markup cut it into text and bold: after the
 * opening set come its week and, with a gain, " · up " before the bold gain and the rest after it; without one, the
 * rest runs straight on. One run of text stays one run, so the browser places its letters as it did.
 */
export interface MainBlock {
  name: string;
  top: string;
  opened: string;
  afterOpened: string;
  gain: string | null;
  afterGain: string;
  chart: Picture | null;
}

/** One Range Ladder row. */
export interface LadderRow {
  name: string;
  weight: string;
  detail: string;
  ready: boolean;
  toGo: number;
  track: Picture;
}

/** The Lift Ledger's cards; a card with nothing to show is null, as the legacy drew nothing. */
export interface LedgerView {
  mains: { title: string; blocks: MainBlock[]; foot: string } | null;
  ladder: { title: string; ready: number; ups: number; rows: LadderRow[]; foot: string } | null;
  other: { title: string; rows: { name: string; meta: string }[]; foot: string } | null;
}

/** A load in the athlete's unit: kilograms to the nearest half, pounds to the nearest whole. */
export function displayLoad(w: number, unit: string): number {
  return unit === 'kg' ? Math.round(w * 0.453592 * 2) / 2 : Math.round(w);
}

const min = (xs: number[]) => Math.min.apply(null, xs);
const max = (xs: number[]) => Math.max.apply(null, xs);

/** The legacy buildMainLiftBlock: the top set, the opening set and the gain, and the line once there are two sessions. */
export function mainBlock(m: LedgerModel['mains'][number], unit: string): MainBlock {
  const isReps = m.mode === 'reps';
  const disp = (w: number) => (isReps ? w : displayLoad(w, unit));
  const u = isReps ? 'reps' : unit === 'kg' ? 'kg' : 'lbs';
  const hv = m.heavy, fs = m.first;
  const lblOf = (p: LiftPoint) => (isReps ? p.v + ' reps' : disp(p.v) + (p.reps ? '×' + p.reps : '') + (p.tag ? ' ' + p.tag : ''));
  let chart: Picture | null = null;
  if (m.series.length >= 2) {
    const W = 320, H = 108, padL = 34, padR = 10, padT = 14, padB = 20;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const ws = m.series.map((p) => p.v);
    let lo = min(ws), hi = max(ws);
    const pad = Math.max((hi - lo) * 0.25, 10);
    lo -= pad;
    hi += pad;
    const xs = plotW / (m.series.length - 1);
    const yof = (v: number) => padT + plotH - ((v - lo) / (hi - lo)) * plotH;
    const s: SvgEl[] = [];
    const step = hi - lo > 90 ? 25 : 10;
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      const cy = yof(v);
      s.push(gridLine(padL, cy.toFixed(1), W - padR), axTx(padL - 5, cy + 3, disp(v)));
    }
    let d = '';
    m.series.forEach((p, i) => {
      d += (i ? ' L' : 'M') + (padL + i * xs).toFixed(1) + ',' + yof(p.v).toFixed(1);
    });
    s.push(svgEl('path', { d, stroke: 'var(--lift)', 'stroke-width': '1.5', fill: 'none', opacity: '0.55' }));
    m.series.forEach((p, i) => {
      const top = p.v === hv.v && p.w === hv.week;
      s.push(svgEl('circle', { cx: (padL + i * xs).toFixed(1), cy: yof(p.v).toFixed(1), r: top ? 4.5 : 3.2, fill: 'var(--lift)', opacity: top ? 1 : 0.72 }));
    });
    // D255: each run of a variant is tagged once, over its first point.
    m.series.forEach((p, i) => {
      // D255 Amendment 1: the first point's tag starts at the line, clear of the axis labels.
      if (p.tag && (i === 0 || m.series[i - 1]!.tag !== p.tag)) s.push(axTx(padL + i * xs - (i ? 0 : 2), yof(p.v) - 8, p.tag, 7, i ? 'middle' : 'start'));
    });
    const lblStep = Math.max(1, Math.ceil(m.series.length / 6));
    m.series.forEach((p, i) => {
      if (i % lblStep === 0) s.push(axTx(padL + i * xs, H - 4, 'W' + p.w, 8, 'middle'));
    });
    chart = { viewBox: '0 0 ' + W + ' ' + H, style: 'width:100%;height:auto;overflow:visible', els: s };
  }
  const gain = fs.tag === hv.tag ? disp(hv.v) - disp(fs.v) : 0; // D255: "up" compares one lift with itself
  const best = ' · ' + (isReps ? 'best' : 'heaviest') + ' in week ' + hv.week;
  return {
    name: m.name,
    top: String(lblOf(hv)),
    opened: String(lblOf(fs)),
    afterOpened: ' in week ' + fs.week + (gain > 0 ? ' · up ' : best),
    gain: gain > 0 ? gain + ' ' + u : null,
    afterGain: gain > 0 ? best : '',
    chart,
  };
}

/** The legacy _ladderTrack: the rep range as ticks, the sets as dots, nudged apart when they land together. */
export function ladderTrack(r: LedgerModel['ladder'][number]): Picture {
  const track = 140, H = 26, span = r.hi - r.lo || 1;
  const xof = (v: number) => ((Math.max(Math.min(v, r.hi), r.lo) - r.lo) / span) * track;
  const col = r.ready ? 'var(--signal)' : 'var(--lift)';
  const s: SvgEl[] = [];
  for (let k = r.lo; k <= r.hi; k++) s.push(svgEl('line', { x1: xof(k).toFixed(1), y1: '9', x2: xof(k).toFixed(1), y2: '15', stroke: 'var(--border2)', 'stroke-width': '1', opacity: '0.55' }));
  s.push(svgEl('line', { x1: '0', y1: '12', x2: track, y2: '12', stroke: 'var(--border2)', 'stroke-width': '1', opacity: '0.55' }));
  const fill = xof(min(r.sets));
  if (fill > 0) s.push(svgEl('rect', { x: '0', y: '10', width: fill.toFixed(1), height: '4', fill: col, opacity: '0.5', rx: '2' }));
  if (r.ready) s.push(svgEl('rect', { x: '0', y: '10', width: track, height: '4', fill: col, opacity: '0.75', rx: '2' }));
  const seen: Record<number, number> = {};
  r.sets.forEach((v) => {
    const x = xof(v);
    const n = (seen[v] = (seen[v] || 0) + 1);
    s.push(svgEl('circle', { cx: (x - (n - 1) * 5.5).toFixed(1), cy: '12', r: '3.6', fill: col, opacity: '0.92' }));
  });
  s.push(axTx(0, 25, r.lo, 8, 'start'));
  s.push(axTx(track, 25, r.hi, 8, 'end', r.ready ? 'var(--signal)' : 'rgba(var(--ink-rgb),0.3)', r.ready ? '700' : ''));
  return { viewBox: '-8 0 ' + (track + 16) + ' ' + H, style: 'width:' + track + 'px;height:' + H + 'px;overflow:visible', els: s };
}

/** The legacy buildLedgerCards, as a view: the three cards and their footers. */
export function ledgerView(model: LedgerModel, unit: string, icon: (name: string, size: number) => string): LedgerView {
  const u = unit === 'kg' ? 'kg' : 'lbs';
  const title = (words: string) => icon('🏋', 15) + ' ' + words;
  let mains: LedgerView['mains'] = null;
  if (model.mains.length) {
    const accDay = model.mains.reduce((a, m) => a + m.accessoryDay, 0);
    const noLoad = model.mains.reduce((a, m) => a + m.noLoad, 0);
    mains = {
      title: title('Main Lifts'),
      blocks: model.mains.map((m) => mainBlock(m, unit)),
      foot: 'The top set you actually did. No estimated maxes: a formula that inflates with reps would rank a heavy single below a lighter double.'
        + ' This is the lift each day was built around. Everything else you loaded is in the ladder below.'
        + (accDay ? ' ' + accDay + (accDay === 1 ? ' session' : ' sessions') + ' where this ran as an accessory ' + (accDay === 1 ? 'is' : 'are')
          + ' kept off the line. The lighter sets would make the climb look like something it was not.' : '')
        + (noLoad ? ' ' + noLoad + (noLoad === 1 ? ' session' : ' sessions') + ' had no load written down. Add the weight and '
          + (noLoad === 1 ? 'it joins' : 'they join') + ' the line.' : ''),
    };
  }
  let ladder: LedgerView['ladder'] = null;
  if (model.ladder.length) {
    ladder = {
      title: title('Range Ladder'),
      ready: model.ladder.filter((r) => r.ready).length,
      ups: model.ladder.reduce((a, r) => a + r.ups, 0),
      rows: model.ladder.map((r) => ({
        name: r.name,
        weight: displayLoad(r.wt, unit) + ' ' + u,
        detail: ' · ' + r.sets.join('/') + ' reps' + (r.ups ? ' · ↑' + r.ups + ' this block' : ''),
        ready: r.ready,
        toGo: r.hi - min(r.sets),
        track: ladderTrack(r),
      })),
      foot: 'Each track is the rep range your session was written with. Dots are that session’s sets. When every set reaches the top, the movement is ready for more weight.',
    };
  }
  let other: LedgerView['other'] = null;
  if (model.plain.length || model.unloaded.length) {
    other = {
      title: title('Other Accessory Work'),
      rows: [
        ...model.plain.map((r) => {
          const lo = displayLoad(r.range[0], unit), hi = displayLoad(r.range[1], unit);
          return { name: r.name, meta: (hi > lo ? lo + '–' + hi : lo) + ' ' + u + ' · ' + r.sessions + ' sessions' };
        }),
        ...model.unloaded.map((r) => ({ name: r.name, meta: (r.reps ? r.reps.toLocaleString() + ' reps · ' : '') + r.sessions + ' sessions' })),
      ],
      foot: 'These were written without a rep range — timed holds, effort-based bodyweight sets, and plain fixed-rep rows — so there is no ladder to climb. Shown as a record of what you did.',
    };
  }
  return { mains, ladder, other };
}
