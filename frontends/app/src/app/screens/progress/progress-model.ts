// The Progress screen's arrangement, kept apart from Angular so the app's node --test suite reads it as it is
// (architecture phase E, step 13: the screen moves from the legacy renderProgressScreen to the ProgressScreen
// component). The stores, the program chips, every chart and the Lift Ledger are still the legacy script's builders;
// this decides which program is shown, sums each week, picks the charts in the legacy order with the legacy arguments,
// and lays out the Session Journal and the 1RM estimator. The weekly dot charts are the DotChart component's since
// step 14 (charts/dot-chart-model.ts). Strings the legacy wrote into the page as markup stay markup here (the notes, the swap line and the jog lines), so the page reads as it did.

import type { DotSpec } from './charts/dot-chart-model.ts';

/** A stored program, as far as the screen reads it. */
export interface ProgressProgram {
  id: string;
  archived?: boolean;
  totalWeeks?: number;
  liftingFocus?: string;
  cfg?: {
    cardioTypes?: string[];
    liftingFocus?: string;
    unit?: string;
    cardioGoals?: { run?: { id?: string; mileBestMins?: string | number; mileBestSecs?: string | number } };
  };
}

/** One day's session log (the legacy ia_logs_ entries), as far as the screen reads it. */
export interface DayLog {
  run_dist?: string | number;
  bike_mins?: string | number;
  swim_yards?: string | number;
  rpe?: string | number;
  notes?: string;
  ts?: number;
  swapFrom?: string;
  swapTo?: string;
  restLog?: Record<string, { dist?: string | number; mins?: string | number; rpe?: string | number } | null | undefined>;
}

/** One exercise's logged loads (the legacy ia_exw_ rows). */
export interface ExRow {
  name?: string;
  entries?: { week: number; weight?: string | number }[];
}

/** One week's sums. */
export interface WeekSums {
  run: number;
  bike: number;
  swim: number;
  bench: number | null;
  squat: number | null;
  dead: number | null;
  rpe: number | null;
  sessions: number;
}

/** The program the screen shows: the one asked for, else the active one, else the first unarchived, else the first. */
export function viewedProgram<P extends ProgressProgram>(all: P[], viewId: string | null, activeId: string | null, hasActive: boolean): { prog: P | undefined; reset: boolean } {
  const asked = viewId ? all.find((p) => p.id === viewId) : undefined;
  if (asked) return { prog: asked, reset: false };
  return { prog: (hasActive && all.find((p) => p.id === activeId)) || all.find((p) => !p.archived) || all[0], reset: true };
}

/** The legacy weekly sums: logged run miles, bike minutes, swim yards (the rest-day jog's too), the running mean RPE, sessions, and the best big-three load. */
export function weeklySums(logs: Record<string, DayLog>, exw: Record<string, ExRow>, totalWeeks: number): Record<number, WeekSums> {
  const wd: Record<number, WeekSums> = {};
  for (let w = 1; w <= totalWeeks; w++) wd[w] = { run: 0, bike: 0, swim: 0, bench: null, squat: null, dead: null, rpe: null, sessions: 0 };
  Object.entries(logs).forEach(([key, entry]) => {
    const match = key.match(/^w(\d+)_/);
    if (!match) return;
    const s = wd[parseInt(match[1]!)];
    if (!s) return;
    if (entry.run_dist && +entry.run_dist > 0) s.run += +entry.run_dist;
    if (entry.bike_mins && +entry.bike_mins > 0) s.bike += +entry.bike_mins;
    if (entry.swim_yards && +entry.swim_yards > 0) s.swim += +entry.swim_yards;
    if (entry.rpe && +entry.rpe > 0) s.rpe = s.rpe ? (+s.rpe + +entry.rpe) / 2 : +entry.rpe;
    const rl = entry.restLog && typeof entry.restLog === 'object' ? entry.restLog : {};
    if (rl['run'] && +rl['run'].dist! > 0) s.run += +rl['run'].dist!;
    if (rl['bike'] && +rl['bike'].mins! > 0) s.bike += +rl['bike'].mins!;
    if (rl['swim'] && +rl['swim'].dist! > 0) s.swim += +rl['swim'].dist!;
    Object.keys(rl).forEach((t) => {
      const r = rl[t] ? +rl[t]!.rpe! : 0;
      if (r > 0) s.rpe = s.rpe ? (+s.rpe + r) / 2 : r;
    });
    if (entry.rpe || entry.run_dist || entry.bike_mins || entry.swim_yards || entry.notes) s.sessions++;
  });
  Object.values(exw).forEach((ex) => {
    const n = (ex.name || '').toLowerCase();
    const isBench = n.includes('bench') && !n.includes('db') && !n.includes('dumbbell') && !n.includes('bench dip');
    const isSquat = (n.includes('back squat') || n.includes('front squat') || n.includes('box squat')) && !n.includes('goblet') && !n.includes('jump');
    const isDead = n.includes('deadlift') && !n.includes('single-leg') && !n.includes('romanian');
    if (!(isBench || isSquat || isDead)) return;
    const lift = isBench ? 'bench' : isSquat ? 'squat' : 'dead';
    (ex.entries || []).forEach((en) => {
      const s = wd[en.week];
      if (!s) return;
      const wt = +en.weight! || 0;
      if (wt > 0) s[lift] = Math.max(s[lift] || 0, wt);
    });
  });
  return wd;
}

/** The legacy builders and readers the charts come from, each called as the legacy screen called it. */
export interface ChartDeps {
  icon(name: string, size: number): string;
  /** The weekly dot chart (charts/dot-chart-model.ts's dotChart). */
  dotChart(title: string, weeks: number[], data: (number | null)[], color: string, unit: string, maxY?: number): DotSpec | null;
  ladderWeekly(logs: unknown, tw: number, cut: number, skip1: boolean): unknown;
  ladderChart(weekly: unknown, tw: number, raceMi: number, cut: number, skip1: boolean): string;
  easyVsPrescribed(logs: unknown, hist: unknown, tw: number): unknown;
  easyZoneChart(ez: unknown): string;
  runsByClass(logs: unknown, hist: unknown, tw: number): unknown;
  easyBandsFallback(rc: unknown): string;
  easyEffortWeekly(logs: unknown, hist: unknown, tw: number): { nRuns: number; nWeeks: number };
  easyMinRuns: number;
  easyEffortChart(ee: unknown, tw: number): string;
  projectionCard(ee: unknown, tw: number, mile: number): string;
  recoveryPaceWeekly(logs: unknown, hist: unknown, tw: number): { nWeeks: number; weekly: Record<number, number | null | undefined>; tgt: unknown };
  paceChart(title: string, weeks: number[], data: (number | null)[], tgt: unknown, color: string): string;
  easyEffortEmpty(ee: unknown): string;
  plannedVsLogged(logs: unknown, hist: unknown, tw: number, cut: number, skip1: boolean): unknown;
  driftChart(pvl: unknown, tw: number, cut: number, skip1: boolean): string;
  exWeights(): unknown;
  ledgerModel(exw: unknown, hist: unknown): unknown;
  ledgerCards(model: unknown, unit: string): string;
}

/** What the charts read about the viewed program. */
export interface ChartInput {
  logs: Record<string, DayLog>;
  hist: unknown;
  sums: Record<number, WeekSums>;
  totalWeeks: number;
  cardioTypes: string[];
  cut: number;
  skip1: boolean;
  raceMi: number;
  cfg: NonNullable<ProgressProgram['cfg']>;
}

/** One chart on the screen: a weekly dot chart to draw, or a legacy builder's markup. */
export type ChartBlock = { kind: 'dot'; spec: DotSpec } | { kind: 'html'; html: string };

/** The charts and the Lift Ledger, in the legacy order. A dot chart with nothing logged is left out, as the legacy drew nothing. */
export function chartChunks(c: ChartInput, d: ChartDeps): ChartBlock[] {
  const out: ChartBlock[] = [];
  const html = (h: string) => out.push({ kind: 'html', html: h });
  const dot = (spec: DotSpec | null) => {
    if (spec) out.push({ kind: 'dot', spec });
  };
  const tw = c.totalWeeks;
  const weeks = Array.from({ length: tw }, (_, i) => i + 1);
  const loggedAny = (s: 'run' | 'bike' | 'swim') => weeks.some((w) => (c.sums[w]![s] || 0) > 0);
  if (c.cardioTypes.includes('run') || loggedAny('run')) {
    const runData = weeks.map((w) => (c.skip1 && w === 1 ? null : c.sums[w]!.run || null));
    dot(d.dotChart(d.icon('🏃', 15) + ' Weekly Running Mileage', weeks, runData, 'var(--run)', 'mi'));
    html(d.ladderChart(d.ladderWeekly(c.logs, tw, c.cut, c.skip1), tw, c.raceMi, c.cut, c.skip1));
    const zone = d.easyZoneChart(d.easyVsPrescribed(c.logs, c.hist, tw));
    html(zone || d.easyBandsFallback(d.runsByClass(c.logs, c.hist, tw)));
  }
  if (c.cardioTypes.includes('run')) {
    const ee = d.easyEffortWeekly(c.logs, c.hist, tw);
    if (ee.nRuns >= d.easyMinRuns && ee.nWeeks >= 2) {
      html(d.easyEffortChart(ee, tw));
      const mg = c.cfg.cardioGoals && c.cfg.cardioGoals.run;
      const mile = mg ? (+mg.mileBestMins! || 0) * 60 + (+mg.mileBestSecs! || 0) : 0;
      html(d.projectionCard(ee, tw, mile));
    } else {
      const rp = d.recoveryPaceWeekly(c.logs, c.hist, tw);
      if (rp.nWeeks >= 2) {
        const rpData = weeks.map((w) => (rp.weekly[w] != null ? rp.weekly[w]! : null));
        html(d.paceChart(d.icon('🏃', 15) + ' Recovery Pace — Easy-Effort Trend', weeks, rpData, rp.tgt, 'var(--run)'));
      } else if (ee.nRuns > 0) {
        html(d.easyEffortEmpty(ee));
      }
    }
    html(d.driftChart(d.plannedVsLogged(c.logs, c.hist, tw, c.cut, c.skip1), tw, c.cut, c.skip1));
  }
  if (c.cardioTypes.includes('swim') || loggedAny('swim')) {
    dot(d.dotChart(d.icon('🏊', 15) + ' Weekly Swimming Volume', weeks, weeks.map((w) => c.sums[w]!.swim || null), '#3f6e96', 'yd'));
  }
  if (c.cardioTypes.includes('bike') || loggedAny('bike')) {
    dot(d.dotChart(d.icon('🚴', 15) + ' Weekly Cycling Time', weeks, weeks.map((w) => c.sums[w]!.bike || null), '#f0a050', 'min'));
  }
  const rpeData = weeks.map((w) => c.sums[w]!.rpe || null);
  if (rpeData.some((v) => v !== null)) dot(d.dotChart(d.icon('💡', 15) + ' Average Session RPE', weeks, rpeData, '#7e5e96', '', 10));
  html(d.ledgerCards(d.ledgerModel(d.exWeights(), c.hist), c.cfg.unit || 'lbs'));
  return out;
}

/** One journal entry as the screen lays it out. */
export interface JournalEntry {
  day: string;
  headMb: number;
  rpe: { text: string; color: string } | null;
  /** The swap line's markup (its icon, then the two sports), and the space under it. */
  swap: { html: string; mb: number } | null;
  jogLines: string[];
  jogMb: number;
  /** The note's markup, in its quotes. */
  notes: string | null;
}

/** One week of the journal: its entries, and whether it opens unfolded (only the latest week does). */
export interface JournalWeek {
  week: number;
  open: boolean;
  count: string;
  entries: JournalEntry[];
}

const DAY_NAMES: Record<string, string> = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };
const SWAP_WORDS: Record<string, string> = { run: 'Run', bike: 'Bike', swim: 'Swim' };

/** The colour of an RPE in the journal: muted with none, red from 9, the lift colour from 7, the accent from 5, else the run colour. */
export function rpeColor(rpe: string | number | undefined): string {
  if (!rpe) return 'var(--muted)';
  const r = +rpe;
  return r >= 9 ? 'var(--red)' : r >= 7 ? 'var(--lift)' : r >= 5 ? 'var(--accent)' : 'var(--run)';
}

/** The legacy pieces the journal reads: the RPE words, the jog lines and the icon. */
export interface JournalDeps {
  rpeLabel(rpe: number): string | undefined;
  jogLines(restLog: DayLog['restLog']): string[];
  icon(name: string, size: number): string;
}

/** The Session Journal, as the legacy screen grouped it: entries with an RPE, a note, a swap or a jog, by week, in time. */
export function journalWeeks(logs: Record<string, DayLog>, d: JournalDeps): JournalWeek[] {
  const all: { w: number; dayKey: string; entry: DayLog; ts: number }[] = [];
  Object.entries(logs).forEach(([key, entry]) => {
    if (!entry.notes && !entry.rpe && !(entry.swapFrom && entry.swapTo) && !(entry.restLog && Object.keys(entry.restLog).length)) return;
    const match = key.match(/^w(\d+)_(\w+)$/);
    if (!match) return;
    all.push({ w: parseInt(match[1]!), dayKey: match[2]!, entry, ts: entry.ts || 0 });
  });
  all.sort((a, b) => a.w - b.w || a.ts - b.ts);
  const byWeek = new Map<number, JournalEntry[]>();
  for (const { w, dayKey, entry } of all) {
    const jog = d.jogLines(entry.restLog);
    const isSwap = !!(entry.swapFrom && entry.swapTo);
    const word = (s: string) => SWAP_WORDS[s] || s;
    const row: JournalEntry = {
      day: DAY_NAMES[dayKey] || dayKey,
      headMb: entry.notes || isSwap || jog.length ? 6 : 0,
      rpe: entry.rpe ? { text: 'RPE ' + entry.rpe + ' — ' + (d.rpeLabel(+entry.rpe) || ''), color: rpeColor(entry.rpe) } : null,
      swap: isSwap
        ? { html: d.icon('history', 12) + ' Swapped ' + word(entry.swapFrom!) + ' → ' + word(entry.swapTo!), mb: entry.notes || jog.length ? 6 : 0 }
        : null,
      jogLines: jog,
      jogMb: entry.notes ? 6 : 0,
      notes: entry.notes ? '"' + entry.notes + '"' : null,
    };
    if (!byWeek.has(w)) byWeek.set(w, []);
    byWeek.get(w)!.push(row);
  }
  const order = [...byWeek.keys()];
  const open = order[order.length - 1];
  return order.map((w) => {
    const entries = byWeek.get(w)!;
    return { week: w, open: w === open, count: entries.length + ' ' + (entries.length === 1 ? 'entry' : 'entries'), entries };
  });
}

/** The estimator's lifts, in the legacy order. */
export const CALC_LIFTS = ['Deadlift', 'Squat', 'Bench'] as const;

/** The legacy 1RM estimate: a single is itself, else Epley rounded to the nearest 5; nothing without both numbers. */
export function estimate1RM(weight: string, reps: string): number | null {
  const w = +weight || 0;
  const r = +reps || 0;
  if (!w || !r) return null;
  return r === 1 ? w : Math.round((w * (1 + r / 30)) / 5) * 5;
}
