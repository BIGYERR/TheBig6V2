// This Week in the Expo app, as a view (MIGRATION.md phase 2, session 4): the stored state and the clock in, the screen's
// words and marks out. The view is today's own model (week-view-model.ts, a copy of the Angular screen's, held equal by
// a test), so every word, mark and order here is D276, D272, D278 and D284's, unchanged. The Angular screen feeds that
// model through its bridge into the legacy page; this feeds it from core's readers of the stored state and from
// week-readers.ts. Drawing the screen writes nothing; the launch below writes what today's launch writes.
//
// THE GRID IS THE LAUNCH'S. Today's app draws the grid refreshProgram hands back (the program rebuilt, the overlays
// applied, the trained weeks frozen, the moves, swaps and edits laid over it). That is core's refreshStoredProgram
// since v0.262.2 (core/src/engine/state-refresh.ts), and liveProgram below calls it as the page's refreshProgram
// does: the store, the instant, the failure reports.
//
// THE LAUNCH WRITES, TO THIS APP'S OWN STORE (D289 P-NATIVEWRITES, docs/decisions/data-backup.md). It is handed the
// store itself, and makes each write today's launch makes (the page's init and loadActiveProgram, with core's launch
// inside them), in today's order: the active program put right (pickActive), the lift log's old keys folded
// (foldLiftLog), then core's own two (an older program repaired, the day edits of frozen weeks dropped). The page's
// timers after a launch (the day-after reminder) are not here: that pop-up is not built. Held equal to the page's
// launch, key for key, on every launch of the stored-state histories (tests/support/native-launch.ts).
import { _parseLocalDate, getWeekMonday } from '@ia/core/engine/calendar.ts';
import { asyIcon } from '@ia/core/engine/icons.ts';
import { INJURY_REGIONS } from '@ia/core/engine/injury.ts';
import { dayStoreKey, readDayLogs } from '@ia/core/engine/state-day-log.ts';
import { dayStatus, readCompleted, readPartSkips } from '@ia/core/engine/state-day-status.ts';
import { overlayWeekRange } from '@ia/core/engine/state-overlays.ts';
import { foldExAliasKeys } from '@ia/core/engine/exercise-library.ts';
import { readLiftLog, writeLiftLog } from '@ia/core/engine/state-lift-log.ts';
import { readActiveProgramId, readPrograms, writeActiveProgramId } from '@ia/core/engine/state-programs.ts';
import { type RefreshReport, type StoredProgram, refreshStoredProgram } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import {
  DAY_FULL, type ReadDay, type ReadProgram, computeStreak, currentWeek, dayBeforeStart, dayIsTravel, fmtStartDay,
  heroSummary, liftFocusCode, liveInjuryOverlay, progAlignment, restDayTip, restLogLines,
  runSessionCode, sessionTimeEst, wildcardOn,
} from './week-readers';
import { type DayLog, type WeekDay, type WeekProgram, type WeekView, liveTitle, weekView } from './week-view-model';

/** A stored program, as far as the screen and its readers go. */
export type ScreenProgram = WeekProgram & ReadProgram & { id: string; archived?: boolean };

/** The screen before any program is held: the Angular screen's own blank (week-view.ts BLANK). */
export const BLANK: WeekView = {
  overline: 'The Asylum', pill: { html: '', cls: '' }, injuryWeek: false, hurt: { injured: false, label: 'Hurt?' },
  titles: [{ n: 1, title: 'Week 1', active: true }], row: { kind: 'start', shown: null, iso: '' }, days: null,
};

/**
 * The program a launch loads, as ia_programs stores it, or null when it loads none (the page's init): the one
 * ia_active names unless it is archived or gone, else the first that is not archived; none without ia_active, and
 * none when every program is archived. Reads only.
 */
export function storedProgram(store: StateStore): ScreenProgram | null {
  const id = readActiveProgramId(store);
  if (!id) return null;
  const all = readPrograms(store) as unknown as ScreenProgram[];
  return all.find((x) => x && x.id === id && !x.archived) || all.find((x) => x && !x.archived) || null;
}

/**
 * The page's init and loadActiveProgram, as far as they write: the program the launch loads is written to ia_active
 * (the same id on most launches, another when the pointer named an archived or missing program), and a pointer that
 * leads to no program is removed. Returns the program loaded, or null.
 */
export function pickActive(store: StateStore): ScreenProgram | null {
  const stored = storedProgram(store);
  if (stored) {
    writeActiveProgramId(store, stored.id);
    return stored;
  }
  if (readActiveProgramId(store)) store.remove('ia_active');
  return null;
}

/**
 * The page's fold before its launch (bug-report-init.ts): the loaded program's lift log with its old keys folded
 * into today's, stored only when the fold changed it. A fault is swallowed, as the page swallows it.
 */
export function foldLiftLog(store: StateStore, programId: string): void {
  try {
    const log = readLiftLog(store, programId);
    if (foldExAliasKeys(log as never)) writeLiftLog(store, programId, log);
  } catch { /* the launch goes on */ }
}

/**
 * The program the screen draws: what a launch hands back (the page's init: the pick, the fold, then core's
 * refreshStoredProgram), as today's page holds it in activeProg. `now` is the instant of the launch, `failed` what
 * it is told when a part of the launch fails. The launch writes to the store it is handed (the top of this file).
 */
export function liveProgram(store: StateStore, now: number, failed: RefreshReport): ScreenProgram | null {
  const stored = pickActive(store);
  if (!stored) return null;
  foldLiftLog(store, stored.id);
  return refreshStoredProgram(store, stored as unknown as StoredProgram, now, failed) as unknown as ScreenProgram;
}

/** How many parts of a launch failed, by kind (core's RefreshReport). */
export interface LaunchFailures { overlay: number; freeze: number; rebuild: number }
/** Today's words for an overlay that did not apply (the page's toast, program-manage.ts). */
export const PLAN_CHANGE_FAILED = 'A plan change failed to apply. Flag it in Bugs.';

/**
 * One launch, as the screen makes it: the program, and what failed. Each failure goes to the console in the page's
 * own words; the screen draws PLAN_CHANGE_FAILED while an overlay failed, where today's page shows it as a toast.
 */
export function launch(store: StateStore, now: number, log: (...a: unknown[]) => void = console.error): { prog: ScreenProgram | null; failures: LaunchFailures } {
  const failures: LaunchFailures = { overlay: 0, freeze: 0, rebuild: 0 };
  const prog = liveProgram(store, now, {
    overlay: (ov, e) => { failures.overlay++; log('overlay apply failed', ov && ov.id, e); },
    freeze: (e) => { failures.freeze++; log('week freeze failed; showing fully rebuilt weeks', e); },
    rebuild: (e) => { failures.rebuild++; log('refreshProgram failed; using stored program', e); },
  });
  return { prog, failures };
}

/** The words under WILDCARD DONE (the Angular sheet-marks-model's wildcardSub, D71), or null with no Wildcard. */
export function wildcardSub(on: unknown, day: { rest?: unknown; title?: string } | null | undefined): string | null {
  if (!on) return null;
  return day && day.rest ? 'Rest day. The streak sits this one out.' : ((day && day.title) || 'Your session') + ' is still on the board.';
}

/** Today at midnight, as the screen counts days. */
export function midnight(now: Date): Date {
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  return t;
}

/** The title a launch shows: the one holding today (week-view-model's liveTitle, as the Angular screen boots). */
export function launchTitle(prog: ScreenProgram, now: Date): number {
  const today = midnight(now);
  return liveTitle(prog.startDate ? getWeekMonday(prog.startDate) : null, today, prog.totalWeeks || 6, currentWeek(prog, today));
}

/** What the screen holds between draws: the title in view and the day picked in each title. Null is the launch's own. */
export interface ScreenPick { shown: number | null; picked: number | null }

/** One draw of the screen. */
export interface WeekScreen {
  view: WeekView;
  /** The title in view, 1 to the program's weeks plus the last title. */
  shown: number;
  /** The program's weeks. */
  totalWeeks: number;
  programId: string;
}

/**
 * This Week for a program in hand, drawn as the Angular screen draws it (week-view.ts render): the same inputs, each
 * helper called as that screen calls its legacy one. `gps` is whether Record run is offered (D272 item 6).
 */
export function drawWeek(store: StateStore, prog: ScreenProgram, now: Date, pick: ScreenPick, gps: boolean): WeekScreen {
  const id = prog.id;
  const totalWeeks = prog.totalWeeks || 6;
  const today = midnight(now);
  const actualWeek = currentWeek(prog, today);
  const weekMon = prog.startDate ? getWeekMonday(prog.startDate) : null;
  const shown = pick.shown === null ? launchTitle(prog, now) : Math.min(Math.max(1, pick.shown), totalWeeks + 1);
  const regions = INJURY_REGIONS as Record<string, { label?: string } | undefined>;
  const view = weekView({
    prog, shown, picked: pick.picked, actualWeek, today, weekMon,
    completed: readCompleted(store, id) as Record<string, { status?: string } | undefined>,
    logs: readDayLogs(store, id) as unknown as Record<string, DayLog | undefined>,
    parts: readPartSkips(store, id) as Record<string, { run?: unknown; lift?: unknown } | undefined>,
    dayFull: DAY_FULL,
    gps,
  }, {
    weekRange: (ov) => overlayWeekRange(prog, ov, totalWeeks),
    parseDate: (iso) => _parseLocalDate(iso),
    isTravel: (day) => dayIsTravel(day as ReadDay | undefined),
    beforeStart: (w, d) => dayBeforeStart(prog, w, d),
    regionLabel: (r) => (regions[r] || {}).label,
    icon: (n, s) => asyIcon(n, s),
    liftFocus: (t) => liftFocusCode(t),
    runChip: (sub, key, type) => runSessionCode(sub, key, type),
    wildcardOn: (w, d) => !!wildcardOn(store, id, w, d),
    statusOf: (w, d) => dayStatus(store, id, w, d) ?? undefined,
    heroSummary: (day) => heroSummary(day as ReadDay),
    sessionTime: (day) => sessionTimeEst(day as ReadDay),
    restTip: () => restDayTip(now.getTime()),
    restLines: (rl) => restLogLines(rl),
    streak: () => computeStreak(store, prog, id, today),
    wildcardSub: (w, k) => (k ? wildcardSub(wildcardOn(store, id, w, k), (prog.weeks[w] ? prog.weeks[w]![k] : null) as WeekDay | null) : null),
    liveInjury: () => ((liveInjuryOverlay(prog, today) || {}).patch || {}).injury || null,
    alignment: () => progAlignment(prog),
    shortDay: (iso) => fmtStartDay(iso),
    completedKey: (w, d) => dayStoreKey(w, d),
    logKey: (w, d) => dayStoreKey(w, d),
  });
  return { view, shown, totalWeeks, programId: id };
}

/** This Week from the store: the active program launched and drawn, or null when the store holds none (the screen draws BLANK). */
export function weekScreen(store: StateStore, now: Date, pick: ScreenPick, gps: boolean): WeekScreen | null {
  const { prog } = launch(store, now.getTime());
  return prog ? drawWeek(store, prog, now, pick, gps) : null;
}

/** The phase pill, as React Native draws it: the icon its markup opens with, if any, and its words. */
export interface PillParts { icon: string | null; text: string }

/**
 * The model hands the pill over as the web's markup (an inline SVG from asyIcon before the words on a taper week,
 * the words escaped otherwise). React Native draws no markup: this splits it into the icon's SVG and the plain words.
 */
export function pillParts(html: string): PillParts {
  const m = /^(<svg[\s\S]*?<\/svg>)([\s\S]*)$/.exec(html);
  const icon = m ? m[1]! : null;
  const rest = m ? m[2]! : html;
  const text = rest.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
  return { icon, text };
}

/**
 * The pill's words with a leading arrow apart ("↓ Recovery Week"): the arrow with its space, and the words after it.
 * The screen draws the arrow in the system font, which holds one at the pill's weight; '' when the words open with none.
 */
export function pillArrow(text: string): { arrow: string; words: string } {
  const m = /^([↓↑] )([\s\S]*)$/.exec(text);
  return m ? { arrow: m[1]!, words: m[2]! } : { arrow: '', words: text };
}

/** A token the model names as the web does (`var(--run)`), as a key of the palette: `run`. Unknown reads as `dim`. */
export function tokenOf(cssVar: string): string {
  const m = /^var\(--([a-z0-9-]+)\)$/.exec(cssVar);
  return m ? m[1]! : 'dim';
}
