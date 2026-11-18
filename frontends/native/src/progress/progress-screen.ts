// Progress in the Expo app, as a view (MIGRATION.md phase 3, row 4): the stored state and the clock in, the screen's
// words and numbers out. The arrangement is today's own models (progress-model.ts, program-chips-model.ts and the
// charts' models, copies of the Angular screen's held equal to the byte), so every word, number and order here is
// today's, with its rulings unchanged. The Angular screen feeds those models through its bridge into the legacy
// page; this feeds them from core's readers of the stored state and from progress-readers.ts. What stands here is
// the page's code around them, line for line:
//
//   showProgressScreen, setProgressView, askPurgeFromProgress, cancelProgressConfirm     progress-data.ts
//   renderProgressScreen (the Angular progress-screen.ts render), setCalcLift, runCalc   lift-ledger-progress-screen.ts
//
// The three writes are progress-writes.ts's. Drawn: the chips and the archived bar, the empty states, the weekly dot
// charts, the run cards, the Lift Ledger, the Session Journal and the estimator (DRAWN).
import { _clkMS } from '@ia/core/engine/clock-format.ts';
import { asyIcon } from '@ia/core/engine/icons.ts';
import { readDayHistory } from '@ia/core/engine/state-day-history.ts';
import { type DayLogs, readDayLogs } from '@ia/core/engine/state-day-log.ts';
import { readLiftLog } from '@ia/core/engine/state-lift-log.ts';
import {
  EASY_RPE_HI, EASY_RPE_LO, easyPaceByWeek, halfFromMilePace, liftLogFeedsOthers, longestRunByWeek, mileFromRecoveryPace,
  plannedAndLoggedMiles, progressCutWeek, recoveryPaceByWeek, runPacesByClass,
} from '@ia/core/engine/state-progress.ts';
import { readPrograms } from '@ia/core/engine/state-programs.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { RPE_LABELS } from '../day-detail/sheet-readers';
import { restLogLines } from '../this-week/week-readers';
import { storedProgram } from '../this-week/week-screen';
import { type ChipProgram, type ChipsView, chipsView } from './program-chips-model';
import {
  type ChartBlock, type DayLog, type ExRow, type JournalWeek, type ProgressProgram, chartChunks, estimate1RM, journalWeeks,
  viewedProgram, weeklySums,
} from './progress-model';
import { EASY_MIN_RUNS, EASY_ZONE_MIN_RUNS, type Hist, type LedgerLog, RACE_DIST_MI, easyVsPrescribed, ledgerModel, partialWeek1 } from './progress-readers';
import { cleanLiftLog } from './progress-writes';

/** What the page keeps in four globals between draws: the program asked for, the delete armed, the estimator's lift. */
export interface ProgressState { viewId: string | null; confirmId: string | null; confirmTier: number; calcLift: string }
/** The globals as a launch leaves them (rest-day-shell.ts). */
export function newProgressState(): ProgressState { return { viewId: null, confirmId: null, confirmTier: 0, calcLift: 'Deadlift' }; }

/** The Progress tab (showProgressScreen): never opened with a delete armed, always on the active program. The lift stays. */
export function openProgress(st: ProgressState): void { st.confirmId = null; st.confirmTier = 0; st.viewId = null; }
/** A chip (setProgressView). */
export function showProgram(st: ProgressState, id: string): void { st.viewId = id; }
/** The trash on the archived bar (askPurgeFromProgress). */
export function askPurge(st: ProgressState, id: string): void { st.confirmId = id; st.confirmTier = 2; }
/** Cancel on the delete's confirmation (cancelProgressConfirm). */
export function cancelConfirm(st: ProgressState): void { st.confirmId = null; st.confirmTier = 0; }
/** After Delete Forever (deleteProg's tail): the confirmation stands down, and the view lets go of the deleted program. */
export function afterDelete(st: ProgressState, id: string): void { st.confirmId = null; st.confirmTier = 0; if (st.viewId === id) st.viewId = null; }
/** The estimator's lift (setCalcLift). */
export function setCalcLift(st: ProgressState, lift: string): void { st.calcLift = lift; }

/** A stored program, as far as the screen reads it. */
type Stored = ProgressProgram & ChipProgram & { startDate?: string | null };

/** The kinds of chart this app draws: all three of today's. */
export const DRAWN: readonly ChartBlock['kind'][] = ['dot', 'card', 'ledger'];

/** One draw of the screen. */
export interface ProgressView {
  /** The program shown. */
  vid: string;
  chips: ChipsView;
  /** 'none' before anything is logged, 'charts' when there is nothing to chart, null when there is. */
  empty: 'none' | 'charts' | null;
  /** Every chart and card, in today's order (the run cards among them). */
  charts: ChartBlock[];
  journal: JournalWeek[] | null;
  /** The estimator shows once anything is logged. */
  estimator: boolean;
}

/**
 * The page's renderProgressScreen, as the Angular screen draws it: null with no program stored (the body stays as it
 * was). It lets go of a view id that names no program, as the page does, and makes the open's one write (the lift
 * log's cleanup, progress-writes.ts).
 */
export function progressView(store: StateStore, st: ProgressState, now: number): ProgressView | null {
  const all = readPrograms(store) as unknown as Stored[];
  if (!all.length) return null;
  // The page's activeProgId and activeProg after its launch: the program a launch loads (week-screen.ts).
  const active = storedProgram(store);
  const activeId = active ? active.id : null;
  const { prog, reset } = viewedProgram(all, st.viewId, activeId, !!active);
  if (reset) st.viewId = null;
  if (!prog) return null;
  const vid = prog.id;
  const icon = (n: string, s: number): string => asyIcon(n, s);
  const chips = chipsView(all, vid, {
    activeId, confirmId: st.confirmId, confirmTier: st.confirmTier,
    warnsCrossProg: (id) => liftLogFeedsOthers(store, id),
    icon,
  });

  cleanLiftLog(store, vid);

  const logs = readDayLogs(store, vid);
  const cfg = prog.cfg || {};
  const totalWeeks = prog.totalWeeks || 6;
  const sums = weeklySums(logs as unknown as Record<string, DayLog>, readLiftLog(store, vid) as unknown as Record<string, ExRow>, totalWeeks);

  if (!Object.keys(logs).length) return { vid, chips, empty: 'none', charts: [], journal: null, estimator: false };

  const hist = readDayHistory(store, vid);
  const goalId = (cfg.cardioGoals && cfg.cardioGoals.run && cfg.cardioGoals.run.id) || '';
  const L = (x: unknown): DayLogs => x as DayLogs, H = (x: unknown): typeof hist => x as typeof hist;
  const charts = chartChunks({
    logs: logs as unknown as Record<string, DayLog>, hist, sums, totalWeeks, cfg,
    cardioTypes: cfg.cardioTypes || [],
    cut: progressCutWeek(prog as never, now),
    skip1: partialWeek1(prog),
    raceMi: RACE_DIST_MI[goalId] || 0,
  }, {
    icon,
    ladderWeekly: (l, tw, cut, skip1) => longestRunByWeek(L(l), tw, cut, skip1),
    easyVsPrescribed: (l, h, tw) => easyVsPrescribed(l as never, h as Hist, tw),
    runsByClass: (l, h, tw) => runPacesByClass(L(l), H(h), tw),
    easyEffortWeekly: (l, h, tw) => easyPaceByWeek(L(l), H(h), tw),
    recoveryPaceWeekly: (l, h, tw) => recoveryPaceByWeek(L(l), H(h), tw),
    plannedVsLogged: (l, h, tw, cut, skip1) => plannedAndLoggedMiles(L(l), H(h), tw, cut, skip1),
    exWeights: () => readLiftLog(store, vid),
    ledgerModel: (exw, h) => ledgerModel(exw as LedgerLog, h as Hist),
    run: {
      pace: (sec) => _clkMS(sec),
      icon,
      mileFromRecovery: (sec) => mileFromRecoveryPace(sec),
      halfFromMile: (sec) => halfFromMilePace(sec),
      easyRpeLo: EASY_RPE_LO,
      easyRpeHi: EASY_RPE_HI,
      easyMinRuns: EASY_MIN_RUNS,
      easyZoneMinRuns: EASY_ZONE_MIN_RUNS,
    },
  });
  const weeks = journalWeeks(readDayLogs(store, vid) as unknown as Record<string, DayLog>, {
    rpeLabel: (r) => RPE_LABELS[r],
    jogLines: (rl) => restLogLines(rl),
    icon,
  });
  const journal = weeks.length ? weeks : null;
  const empty = !charts.some((c) => c.kind !== 'ledger' || c.view.mains || c.view.ladder || c.view.other) && !journal ? 'charts' : null;
  return { vid, chips, empty, charts, journal, estimator: true };
}

/** The unit the estimate is said in: the active program's, else pounds (the page reads the wizard's draft between the two, which is pounds until the wizard is built here). */
export function estimatorUnit(store: StateStore): string {
  const active = storedProgram(store) as unknown as Stored | null;
  return (active && active.cfg && active.cfg.unit) || 'lbs';
}

/** The estimator's line (runCalc): the bold estimate and the words after it, or null without both numbers. */
export function estimateLine(st: ProgressState, weight: string, reps: string, unit: string): { bold: string; rest: string } | null {
  const est = estimate1RM(weight, reps);
  if (est === null) return null;
  return { bold: 'Estimated ' + st.calcLift + ' 1RM: ' + est + ' ' + unit, rest: ' — for your reference; the app coaches by RPE.' };
}

/** Markup the page writes into the screen (a title with its icon, a note, a swap line), as React Native draws it: the icon it opens with, if any, and its plain words. */
export function markupParts(html: string): { icon: string | null; text: string } {
  const m = /^\s*(<svg[\s\S]*?<\/svg>)/.exec(html);
  const rest = m ? html.slice(m[0].length) : html;
  const text = rest.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  return { icon: m ? m[1]! : null, text: m ? text.replace(/^ /, '') : text };
}
