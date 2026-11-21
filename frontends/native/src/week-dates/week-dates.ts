// This Week's two dates in the Expo app (MIGRATION.md phase 3, row 5, its third session; D289 P-NATIVEWRITES): the
// race date of a program aligned to a race, and Program Start of every other. In a folder of their own, because
// they write and This Week's folder writes nothing. Each is the page's own code, line for line, with the page's
// globals (the active program, the store, the clock) taken as arguments:
//
//   setProgRace, setProgStart                     programs.ts
//   _rsRace, resolveStartDate                     wizard.ts (the one resolver the wizard and the start box share, D21)
//
// THE RACE DATE moves the start to where the plan counts back to (raceAlignment) and rebuilds the program: untrained
// weeks pin again, trained weeks stay frozen. Any day is accepted, as today.
// PROGRAM START is resolved first (D24, D25, D184 c): a start that is not a Monday makes a short first week; a short
// week with no training day left moves to the next Monday, unless it holds the test of a dated test goal. Only a
// dated test goal pins its test week again from the new start (D106a) and is rebuilt; every other program is stored
// with its new start and nothing is rebuilt.
// Both write ia_programs alone. A cleared box does nothing.
//
// The screen then shows the title holding today, as today's does (week-view.ts render: the page's currentWeek set
// from outside the screen): titleAfterDate says whether it does.
//
// tests/support/native-change-sheet.ts holds the store equal to today's page, key for key, after each of them.
import { _ISO_ORDER, _isoOf, _parseLocalDate, getWeekMonday } from '@ia/core/engine/calendar.ts';
import { PACE_GOALS, raceAlignment } from '@ia/core/engine/nrc-race-bike-swim.ts';
import { readPrograms, writePrograms } from '@ia/core/engine/state-programs.ts';
import { type RefreshReport, type StoredProgram, progTestPin, refreshStoredProgram } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { currentWeek, fmtStartDay } from '../this-week/week-readers';

/** The stored config, as far as the two dates go. */
export interface DatedCfg {
  raceDate?: string | null;
  eventTargeted?: boolean;
  restDays?: string[];
  cardioTypes?: string[];
  cardioGoals?: { run?: { id?: string } | null };
  _testWeek?: number | null;
  _raceDateCappedWeeks?: number;
}
/** The program in hand, as far as the two dates go (today's activeProg). */
export interface DatedProgram { id: string; startDate?: string | null; totalWeeks?: number; cfg?: DatedCfg | null }

/**
 * What a date leaves: its toast, the program in hand (the same one, or the one a rebuild handed back), and whether
 * the date was set (false for a race date that did not resolve, which stores nothing).
 */
export interface DateTap { toast: string; prog: DatedProgram; set: boolean }

/** Today's words. */
export const DATE_TOASTS = {
  unresolved: 'That date didn’t resolve',
  holdsTest: 'That week holds your test. Nothing left to train before it ✓',
  short: 'Start date set. Short first week ✓',
  set: 'Start date set ✓',
} as const;

/** The page's _rsRace (D184 c): the test date the resolver is given. Only a dated test goal has one. */
export function rsRace(c: DatedCfg | null | undefined): string | null {
  const g = c && c.cardioGoals && c.cardioGoals.run;
  return (c && (c.cardioTypes || []).includes('run') && g && PACE_GOALS.has(g.id) && c.eventTargeted !== false && c.raceDate) ? c.raceDate : null;
}

/** What the resolver hands back (wizard.ts). `holdsTest` is there only when true. */
export interface ResolvedStart { start: string; entered: string; mon: string; partial: boolean; snapped: boolean; week1Train: string[]; nextMon: string; holdsTest?: true }

/** The page's resolveStartDate. A date that does not read is today. */
export function resolveStartDate(dateStr: string | null | undefined, restDays: unknown, raceIso: string | null, now: Date): ResolvedStart {
  const rest = new Set(Array.isArray(restDays) ? restDays : []);
  let d = _parseLocalDate(dateStr);
  if (!d) { d = new Date(now); d.setHours(0, 0, 0, 0); }
  const mon = getWeekMonday(_isoOf(d));
  const offset = Math.round((d.getTime() - mon.getTime()) / 86400000);
  const partial = offset > 0;
  const week1Train = _ISO_ORDER.slice(offset).filter((k) => !rest.has(k));
  const rt = raceIso ? _parseLocalDate(raceIso) : null;
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(0, 0, 0, 0);
  const holdsTest = !!(partial && week1Train.length === 0 && rt && rt >= d && rt <= sun);
  if (partial && week1Train.length === 0 && !holdsTest) {
    const nm = new Date(mon); nm.setDate(mon.getDate() + 7); nm.setHours(0, 0, 0, 0);
    return { start: _isoOf(nm), entered: _isoOf(d), mon: _isoOf(nm), partial: false, snapped: true, week1Train: _ISO_ORDER.filter((k) => !rest.has(k)), nextMon: _isoOf(nm) };
  }
  const nm = new Date(mon); nm.setDate(mon.getDate() + 7); nm.setHours(0, 0, 0, 0);
  const r: ResolvedStart = { start: _isoOf(d), entered: _isoOf(d), mon: _isoOf(mon), partial, snapped: false, week1Train, nextMon: _isoOf(nm) };
  return holdsTest ? { ...r, holdsTest: true } : r;
}

/** The stored list with the program in hand in its own place (the page's programs[idx]=activeProg). */
function keep(store: StateStore, prog: DatedProgram): void {
  const programs = readPrograms(store) as unknown as DatedProgram[];
  const idx = programs.findIndex((p) => p.id === prog.id);
  if (idx >= 0) { programs[idx] = prog; writePrograms(store, programs as never); }
}

/**
 * The page's setProgRace. Null when the tap does nothing (a cleared box, no program). A date the race goal cannot
 * be laid back from is put back as it was and said.
 */
export function setProgRace(store: StateStore, prog: DatedProgram | null, dateStr: string, now: number, failed: RefreshReport): DateTap | null {
  if (!dateStr || !prog || !prog.cfg) return null;
  const c = prog.cfg;
  const before = c.raceDate;
  c.raceDate = dateStr;
  const al = (c.cardioTypes && c.cardioTypes.includes('run') && c.cardioGoals && c.cardioGoals.run) ? raceAlignment(c.cardioGoals.run.id, c.raceDate, c.eventTargeted !== false) : null;
  if (!al) { c.raceDate = before; return { toast: DATE_TOASTS.unresolved, prog, set: false }; }
  prog.startDate = al.start;
  keep(store, prog);
  const next = refreshStoredProgram(store, prog as unknown as StoredProgram, now, failed) as unknown as DatedProgram;
  return { toast: 'Race day ' + fmtStartDay(al.raceIso) + ' — plan starts ' + fmtStartDay(al.start) + ' ✓', prog: next, set: true };
}

/** The page's setProgStart. Null when the tap does nothing (a cleared box, no program). */
export function setProgStart(store: StateStore, prog: DatedProgram | null, dateStr: string, now: number, failed: RefreshReport): DateTap | null {
  if (!dateStr || !prog) return null;
  const r = resolveStartDate(dateStr, (prog.cfg && prog.cfg.restDays) || [], rsRace(prog.cfg), new Date(now));
  prog.startDate = r.start;
  const tp = progTestPin(prog.cfg as never, r.start);
  if (tp && prog.cfg) { prog.cfg._testWeek = tp.tw; prog.cfg._raceDateCappedWeeks = tp.tw || tp.len; }
  keep(store, prog);
  const next = tp ? refreshStoredProgram(store, prog as unknown as StoredProgram, now, failed) as unknown as DatedProgram : prog;
  const toast = r.holdsTest ? DATE_TOASTS.holdsTest
    : (r.snapped ? 'Nothing to train that week. Starts ' + fmtStartDay(r.start) + ' ✓'
      : (r.partial ? DATE_TOASTS.short : DATE_TOASTS.set));
  return { toast, prog: next, set: true };
}

/**
 * After a date is set the page's current week is the week holding today (calcCurrentWeek), set from outside the
 * screen. Today's screen then shows the title holding today and places its strip anew, unless that is the week the
 * screen itself last wrote (a title picked, a day opened). `own` is that week, null before the first draw. Returns
 * whether the title goes back to today's, and the week the screen now holds as its own.
 */
export function titleAfterDate(own: number | null, prog: DatedProgram, today: Date): { reset: boolean; own: number } {
  const cw = currentWeek(prog, today);
  return { reset: cw !== own, own: cw };
}
