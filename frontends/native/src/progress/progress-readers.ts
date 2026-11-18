// Progress in the Expo app (MIGRATION.md phase 3, row 4): the page's own readers that are not in core, line for line.
// Each keeps its ruling and reads only what it is handed; none names the store.
//
//   ledgerModel, _slotOfEntry, _rxRangeFor, _setsOf, _deadliftLine, _HINGE_TAG      lift-ledger-progress-screen.ts
//       (D11 main by slot, V196 D57 an unloaded main is a main, D58 every session in one bucket, D59 a blank load
//        costs the point, V194 D55 the range from the latest session that carries one, D255 the one Deadlift line)
//   easyVsPrescribed, _steadyCeilingFor, EASY_ZONE_MIN_RUNS                          progress-charts.ts
//   _partialWeek1 (D26)                                                              week-view-sections.ts
//   RACE_DIST_MI, EASY_MIN_RUNS                                                      progress-data.ts
//
// The jog's lines (restLogLines) are this-week/week-readers.ts's and the RPE's words day-detail/sheet-readers.ts's,
// ported there with their own screens. tests/integration/native-progress.test.ts holds every one of these equal to
// the page's on the same stored state.
import { _parseLocalDate, getWeekMonday } from '@ia/core/engine/calendar.ts';
import { PACE_CHART } from '@ia/core/engine/cardio-progression.ts';
import { exStoreKey } from '@ia/core/engine/exercise-library.ts';
import { paceSeconds, runClassOf } from '@ia/core/engine/state-progress.ts';

import type { LedgerModel } from './charts/ledger-model';
import type { ZoneRun } from './charts/run-charts-model';

/** One stored lift entry (an ia_exw_ row's), as far as the ledger reads it. */
export interface LedgerEntry { week: number; day?: string; ts?: number; weight?: number | string; setsDone?: (number | string)[]; setsReps?: string }
/** The lift log, as far as the ledger reads it. */
export type LedgerLog = Record<string, { name?: string; entries?: LedgerEntry[] } | undefined>;
/** A day's frozen card (an ia_hist_ entry), as far as Progress reads it. */
export interface HistDay {
  sections?: { label?: string; items?: ({ name?: string; detail?: string } | null)[] }[];
  cardio?: { type?: string; subtype?: string; dose?: { tgt?: number | string; cap?: number | string } | null } | null;
}
export type Hist = Record<string, HistDay | undefined> | null | undefined;

/** A main lift's row, with the three numbers its sessions add up to (V196 D58). */
export type LedgerMain = LedgerModel['mains'][number] & { plotted: number; entries: number };
export type Ledger = Omit<LedgerModel, 'mains'> & { mains: LedgerMain[] };

export const RACE_DIST_MI: Record<string, number> = { run_5k: 3.1, run_10k: 6.2, run_half: 13.1, run_marathon: 26.2 };
/** The coverage gate: below this the easy effort card draws its empty state. */
export const EASY_MIN_RUNS = 6;
/** Below this the zone chart has nothing to say. */
export const EASY_ZONE_MIN_RUNS = 4;

/** Where a logged entry stood on its day's frozen card: the main slot (item 0 of a Main section), an accessory, or not there. */
export function slotOfEntry(hist: Hist, name: string, en: LedgerEntry | null | undefined): 'main' | 'accessory' | null {
  if (!en || !en.week || !en.day) return null;
  const snap = hist && hist['w' + en.week + '_' + en.day];
  if (!snap || !snap.sections) return null;
  const key = exStoreKey(name);
  let seen = null as 'main' | 'accessory' | null;
  snap.sections.forEach((sec) => {
    const isMain = /^main/i.test(sec.label || '');
    (sec.items || []).forEach((it, ii) => {
      if (!it || !it.name) return;
      if (exStoreKey(it.name) !== key) return;
      if (isMain && ii === 0) seen = 'main';
      else if (seen !== 'main') seen = 'accessory';
    });
  });
  return seen;
}

/** The frozen prescription for one logged entry: its sets and its rep range, or null when it carries no range. */
export function rxRangeFor(hist: Hist, name: string, en: LedgerEntry | null | undefined): { sets: number; lo: number; hi: number } | null {
  if (!en || !en.week || !en.day) return null;
  const snap = hist && hist['w' + en.week + '_' + en.day];
  if (!snap || !snap.sections) return null;
  const key = exStoreKey(name);
  let det = null as string | null;
  snap.sections.forEach((sec) => (sec.items || []).forEach((it) => {
    if (it && it.name && exStoreKey(it.name) === key && !det) det = it.detail || '';
  }));
  if (!det) return null;
  const m = det.match(/(\d+)\s*[×x]\s*(\d+)\s*[–-]\s*(\d+)/);
  if (!m) return null;
  const lo = +m[2]!, hi = +m[3]!;
  if (!(hi > lo)) return null;
  return { sets: +m[1]!, lo: lo, hi: hi };
}

/** An entry's sets: the reps done, else the one number its prescription ends in, else none. */
export function setsOf(en: LedgerEntry | null | undefined): number[] {
  const sd = (en && en.setsDone) || [];
  const out = sd.map(Number).filter((v) => v > 0);
  if (out.length) return out;
  const m = String((en && en.setsReps) || '').match(/(\d+)\s*$/);
  return m ? [+m[1]!] : [];
}

// v0.249.0 (D255, P-DEADLIFTLINE): the Posterior Chain main is drawn per block from these four hinges
// (EXLIB.back_compound), and the ledger listed each as its own main lift. Display only: their main-slot sessions are
// one Deadlift line, and a point that was not the conventional pull is tagged.
const HINGE_TAG: Record<string, string> = { 'Deadlift': '', 'Trap bar deadlift': 'Trap bar', 'Sumo deadlift': 'Sumo', 'Barbell Romanian deadlift': 'RDL' };
function deadliftLine(mains: LedgerMain[]): LedgerMain[] {
  const hinge = mains.filter((m) => m.mode === 'load' && Object.prototype.hasOwnProperty.call(HINGE_TAG, m.name));
  if (!hinge.length) return mains;
  const tagOf = (m: LedgerMain): string | null => HINGE_TAG[m.name] || null;
  let heavy = null as LedgerMain['heavy'] | null, first = null as LedgerMain['first'] | null;
  hinge.forEach((m) => {
    const t = tagOf(m);
    if (!heavy || m.heavy.v > heavy.v || (m.heavy.v === heavy.v && m.heavy.week < heavy.week)) heavy = { ...m.heavy, tag: t };
    if (!first || m.first.week < first.week) first = { ...m.first, tag: t };
  });
  const series = ([] as LedgerMain['series']).concat(...hinge.map((m) => m.series.map((p) => ({ w: p.w, v: p.v, tag: tagOf(m) })))).sort((a, b) => a.w - b.w);
  const sum = (k: 'plotted' | 'accessoryDay' | 'noLoad' | 'entries'): number => hinge.reduce((a, m) => a + (m[k] || 0), 0);
  return mains.filter((m) => hinge.indexOf(m) < 0).concat([{ name: 'Deadlift', mode: 'load', series, heavy: heavy!, first: first!,
    plotted: sum('plotted'), accessoryDay: sum('accessoryDay'), noLoad: sum('noLoad'), entries: sum('entries') }]);
}

/** The page's ledgerModel: every key of the lift log in exactly one of four buckets (V196 D58). */
export function ledgerModel(exw: LedgerLog | null | undefined, hist: Hist): Ledger {
  const mains: LedgerMain[] = [], ladder: Ledger['ladder'] = [], plain: Ledger['plain'] = [], unloaded: Ledger['unloaded'] = [];
  Object.values(exw || {}).forEach((ex) => {
    const name = (ex && ex.name) || '';
    const all = ((ex && ex.entries) || []).slice().sort((a, b) => (a.week - b.week) || ((a.ts || 0) - (b.ts || 0)));
    if (!all.length) return;
    const mainEns = all.filter((en) => slotOfEntry(hist, name, en) === 'main');
    if (mainEns.length) {
      // V196 D57: an unloaded main lift is still a main lift. V196 D58: plotted + accessoryDay + noLoad == entries.
      const loaded = mainEns.filter((en) => +en.weight! > 0);
      const accessoryDay = all.length - mainEns.length;
      const topOf = (en: LedgerEntry): number => { const s = setsOf(en); return s.length ? Math.max.apply(null, s) : 0; };
      if (loaded.length) {
        // V196 D59: a blank Load box costs the point, not the session. Nothing is carried forward.
        const first = loaded[0]!;
        const heavy = loaded.reduce((a, b) => (+b.weight! > +a.weight! ? b : a), loaded[0]!);
        mains.push({ name, mode: 'load', series: loaded.map((en) => ({ w: en.week, v: +en.weight! })),
          heavy: { v: +heavy.weight!, reps: topOf(heavy) || null, week: heavy.week },
          first: { v: +first.weight!, reps: topOf(first) || null, week: first.week },
          plotted: loaded.length, accessoryDay: accessoryDay,
          noLoad: mainEns.length - loaded.length, entries: all.length });
        return;
      }
      const repEns = mainEns.filter((en) => topOf(en) > 0);
      if (repEns.length) {
        const first = repEns[0]!;
        const heavy = repEns.reduce((a, b) => (topOf(b) > topOf(a) ? b : a), repEns[0]!);
        mains.push({ name, mode: 'reps', series: repEns.map((en) => ({ w: en.week, v: topOf(en) })),
          heavy: { v: topOf(heavy), reps: null, week: heavy.week },
          first: { v: topOf(first), reps: null, week: first.week },
          plotted: repEns.length, accessoryDay: accessoryDay,
          noLoad: mainEns.length - repEns.length, entries: all.length });
        return;
      }
      // Main-slot sessions carrying neither a load nor a rep count have nothing to plot in either unit. They fall
      // through to the routing below, so a populated store key always lands in exactly one bucket.
    }
    const last = all[all.length - 1]!;
    const sets = setsOf(last);
    const wt = +last.weight! || 0;
    if (!(wt > 0)) { unloaded.push({ name, sessions: all.length,
      reps: all.reduce((s, en) => s + setsOf(en).reduce((a, b) => a + b, 0), 0) }); return; }
    // V194 D55: the range that decides Range Ladder or Other Accessory Work is read from the most recent session
    // that carries one, not strictly the last.
    let rng = null as ReturnType<typeof rxRangeFor>;
    for (let i = all.length - 1; i >= 0 && !rng; i--) rng = rxRangeFor(hist, name, all[i]);
    if (rng && sets.length) {
      // step-ups: how many times the working weight rose across the block
      let ups = 0, prev = null as number | null;
      all.forEach((en) => { const w = +en.weight! || 0; if (prev !== null && w > prev) ups++; if (w > 0) prev = w; });
      const hi = rng.hi;
      ladder.push({ name, wt, lo: rng.lo, hi: rng.hi, sets,
        ready: sets.length > 0 && sets.every((r) => r >= hi), ups, sessions: all.length });
    } else {
      plain.push({ name, wt, sets, sessions: all.length,
        range: [Math.min.apply(null, all.map((e) => +e.weight! || 0).filter((v) => v > 0).concat([wt])),
          Math.max.apply(null, all.map((e) => +e.weight! || 0).concat([wt]))] });
    }
  });
  const mainsOut = deadliftLine(mains).sort((a, b) => b.series.length - a.series.length);
  ladder.sort((a, b) => (b.ready ? 1 : 0) - (a.ready ? 1 : 0) || b.sessions - a.sessions);
  plain.sort((a, b) => b.sessions - a.sessions);
  unloaded.sort((a, b) => b.sessions - a.sessions);
  return { mains: mainsOut, ladder, plain, unloaded };
}

// The steady ceiling for a frozen dose that carries a target and no cap (a card frozen before V203): the engine's own
// formula off PACE_CHART's tempo column, tempo and recovery read from one row, clamped together at the table's edges.
function steadyCeilingFor(recSec: number): number | null {
  const rows = PACE_CHART || null;
  if (!rows || !rows.length || !(recSec > 0)) return null;
  let tempo: number, rec = recSec;
  if (recSec <= rows[0]!.recovery) { tempo = rows[0]!.tempo; rec = rows[0]!.recovery; }
  else if (recSec >= rows[rows.length - 1]!.recovery) { tempo = rows[rows.length - 1]!.tempo; rec = rows[rows.length - 1]!.recovery; }
  else {
    tempo = rows[rows.length - 1]!.tempo;
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1]!, b = rows[i]!;
      if (recSec <= b.recovery) {
        const f = (recSec - a.recovery) / (b.recovery - a.recovery);
        tempo = a.tempo + f * (b.tempo - a.tempo);
        break;
      }
    }
  }
  return Math.round((tempo + rec) / 2);
}

/** Every easy or recovery run that carries a prescribed anchor, with its own ceiling. A run with no target in its freeze is left out, never guessed. */
export function easyVsPrescribed(logs: Record<string, { run_pace?: unknown; swapTo?: unknown } | null | undefined> | null | undefined, hist: Hist, totalWeeks: number): ZoneRun[] {
  const runs: ZoneRun[] = [];
  Object.entries(logs || {}).forEach(([key, e]) => {
    if (!e || !e.run_pace || e.swapTo) return;
    const m = key.match(/^w(\d+)_(.+)$/); if (!m) return;
    const w = +m[1]!; if (!(w >= 1 && w <= totalWeeks)) return;
    const snap = hist && hist[key]; if (!snap || !snap.cardio) return;
    const c = snap.cardio;
    if (String(c.type || '').toLowerCase() !== 'run') return;
    const cls = runClassOf(c.subtype);
    if (cls !== 'Recovery' && cls !== 'Easy') return;
    const d = c.dose || {};
    const tgt = (+d.tgt! > 0) ? +d.tgt! : 0;
    if (!tgt) return;                                  // no anchor -> excluded
    const sec = paceSeconds(e.run_pace); if (!sec) return;
    const cap = (+d.cap! > 0) ? +d.cap! : steadyCeilingFor(tgt);
    if (!(cap! > 0)) return;
    runs.push({ w, sec, tgt, cap: cap!, hot: sec < cap! });       // fewer seconds = too fast
  });
  runs.sort((a, b) => a.w - b.w);
  return runs;
}

/** D26: a program whose start is not a Monday has a short week 1, which the accumulating charts leave out. */
export function partialWeek1(prog: { startDate?: string | null } | null | undefined): boolean {
  if (!prog || !prog.startDate) return false;
  const sd = _parseLocalDate(prog.startDate); if (!sd) return false;
  return getWeekMonday(prog.startDate).getTime() !== sd.getTime();
}
