// This Week in the Expo app, as a view (MIGRATION.md phase 2, session 4): the stored state and the clock in, the screen's
// words and marks out. The view is today's own model (week-view-model.ts, a copy of the Angular screen's, held equal by
// a test), so every word, mark and order here is D276, D272, D278 and D284's, unchanged. The Angular screen feeds that
// model through its bridge into the legacy page; this feeds it from core's readers of the stored state and from
// week-readers.ts. Read only: nothing here writes a key.
//
// THE GRID IS THE STORED ONE, FOR NOW. Today's app draws the grid refreshProgram hands back (the program rebuilt, the
// overlays applied, the trained weeks frozen, the moves, swaps and edits laid over it). That code is still in the
// page (program-manage.ts, overlays.ts, swaps-edits.ts: phase 1's last two slices). Until it is in core, liveProgram
// below returns the grid as ia_programs stores it, which is the same grid on a day nothing has touched since it was
// stored, and not otherwise (tests/measure/native-this-week_reads.md, section 2). It is the one seam to change.
import { _parseLocalDate, getWeekMonday } from '@ia/core/engine/calendar.ts';
import { asyIcon } from '@ia/core/engine/icons.ts';
import { INJURY_REGIONS } from '@ia/core/engine/injury.ts';
import { dayStoreKey, readDayLogs } from '@ia/core/engine/state-day-log.ts';
import { dayStatus, readCompleted, readPartSkips } from '@ia/core/engine/state-day-status.ts';
import { readActiveProgramId, readPrograms } from '@ia/core/engine/state-programs.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import {
  DAY_FULL, type ReadDay, type ReadProgram, computeStreak, currentWeek, dayBeforeStart, dayIsTravel, fmtStartDay,
  heroSummary, liftFocusCode, liveInjuryOverlay, overlayWeekRange, progAlignment, restDayTip, restLogLines,
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
 * The program the screen draws: the active one, as stored. The seam named at the top of this file: when refreshProgram
 * is in core, this returns what it hands back.
 */
export function liveProgram(store: StateStore): ScreenProgram | null {
  const id = readActiveProgramId(store);
  if (!id) return null;
  const p = (readPrograms(store) as unknown as ScreenProgram[]).find((x) => x && x.id === id);
  return p && p.weeks ? p : null;
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

/** This Week from the store: the active program drawn, or null when the store holds none (the screen draws BLANK). */
export function weekScreen(store: StateStore, now: Date, pick: ScreenPick, gps: boolean): WeekScreen | null {
  const prog = liveProgram(store);
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

/** A token the model names as the web does (`var(--run)`), as a key of the palette: `run`. Unknown reads as `dim`. */
export function tokenOf(cssVar: string): string {
  const m = /^var\(--([a-z0-9-]+)\)$/.exec(cssVar);
  return m ? m[1]! : 'dim';
}
