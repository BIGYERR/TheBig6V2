// Generate, in the Expo app (MIGRATION.md phase 3, row 6, the first of two sessions; D289 P-NATIVEWRITES): the one
// file of the wizard that writes to this app's own store. Each function is the page's own code, line for line, with
// the page's globals (the draft `WD`, the store, the clock) taken as arguments:
//
//   generateProgram, showLengthWarning's words, doGenerate        wizard-generate.ts
//   _applyWizardStart                                             wizard.ts
//
// THE ORDER IS THE PAGE'S. The last button asks core for the goals' length; a warning stands as a pop-up first
// (Go Back, or Build N-Week Plan). Then the mile and the swim times are checked: a refusal is a toast and the wizard
// again, and nothing is stored. Then the generating screen: the test week and the length that builds are written on
// the draft (a pin from an earlier try cannot survive), the line under the figure reads the length, then six lines
// 380 ms apart. At 2,400 ms the program is built by core's own buildProgram from the draft as it stands, its start
// resolved (a race plan counts back from its race; any other start is the resolver's), stored at the end of the
// list, and made the active one through the list's own switch (program-list/list-writes.ts loadActive: ia_active
// written, the stored program rebuilt by core as a launch rebuilds it). The line reads that it is ready, and 600 ms
// later This Week shows it, on its first week.
//
// It writes ia_programs and ia_active and nothing else. The rest timer's first use note, which the page arms after a
// first program, is not here: the floating timer is out of this app until the Dynamic Island (D295).
//
// tests/support/native-wizard.ts holds every ia_ key and the program in hand equal to today's page after Generate.
import { _isoOf } from '@ia/core/engine/calendar.ts';
import { buildProgram } from '@ia/core/engine/budget-engine-d.ts';
import { LIFTING_FOCUS_TO_GOAL } from '@ia/core/engine/exercise-library.ts';
import { raceAlignment } from '@ia/core/engine/nrc-race-bike-swim.ts';
import { calcProgramLength } from '@ia/core/engine/nsw-cardio.ts';
import { readPrograms, writePrograms } from '@ia/core/engine/state-programs.ts';
import { type RefreshReport, progTestPin } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { mileEntryState } from '../program-list/list-readers';
import { loadActive } from '../program-list/list-writes';
import type { ScreenProgram } from '../this-week/week-screen';
import { resolveStartDate, rsRace } from '../week-dates/week-dates';
import { type Draft, lengthGoals, swimEntryState } from './wizard-readers';

const focusGoal = (d: Draft): string => (LIFTING_FOCUS_TO_GOAL as Record<string, string | undefined>)[d.liftingFocus || ''] || 'balanced';
/** The goals' length as Generate asks core for it. */
const goalLength = (d: Draft): { weeks: number; warning: string | null } => calcProgramLength((d.cardioTypes || []) as never, lengthGoals(d, true) as never, focusGoal(d));

/** The pop-up's words (showLengthWarning). */
export const LENGTH_WORDS = {
  kicker: 'Heads Up',
  title: (weeks: number): string => weeks + '-Week Program',
  /** After the warning, a blank line, then this, its length in bold. */
  body: (weeks: number): { before: string; bold: string; after: string } => ({ before: 'The app will build you a ', bold: weeks + '-week program', after: ' that safely progresses toward your goal. Stick to the plan and you will get there.' }),
  back: 'Go Back',
  build: (weeks: number): string => 'Build ' + weeks + '-Week Plan',
} as const;

/** The last button's first question (generateProgram): the warning to stand as a pop-up before anything builds, or null. */
export function lengthWarning(d: Draft): { msg: string; weeks: number } | null {
  const r = goalLength(d);
  return r.warning ? { msg: r.warning, weeks: r.weeks } : null;
}

/** Generate's two checks (doGenerate, D9 and D110a): the mile, then the swim times. The toast that refuses, or null. */
export function refusal(d: Draft): string | null {
  const mv = mileEntryState((d.cardioGoals ? d.cardioGoals['run'] : null) as never, d.experience as string);
  if (!mv.ok) return mv.msg as string;
  const sv = swimEntryState(d.cardioGoals && d.cardioGoals['swim']);
  if (!sv.ok) return sv.msg as string;
  return null;
}

/** The generating screen's words and times (screens.html, doGenerate). */
export const GENERATING = {
  title: 'Building Your Program',
  tickMs: 380,
  buildMs: 2400,
  landMs: 600,
  ready: (weeks: number): string => 'Your ' + weeks + '-week program is ready!',
  error: (message: string): string => 'Error: ' + message,
} as const;

/**
 * The generating screen opens (doGenerate, before its timers): the dated test goal's pin is taken from the resolved
 * start and written on the draft with the length that builds, and the lines the screen will show are made. `first`
 * stands at once; `lines` follow, one every 380 ms.
 */
export function beginGenerate(d: Draft, now: Date): { weeks: number; first: string; lines: string[] } {
  let weeks = goalLength(d).weeks;
  const tp = progTestPin(d as never, resolveStartDate(d.startDate, d.restDays || [], rsRace(d as never), now).start);
  d._testWeek = (tp && tp.tw) || null;
  d._raceDateCappedWeeks = d._testWeek || weeks;
  weeks = d._raceDateCappedWeeks;
  return {
    weeks,
    first: 'Building your ' + weeks + '-week program...',
    lines: ['Analyzing your goals...', 'Building cardio progressions...', 'Selecting exercises...', 'Calculating weights...', 'Assembling ' + weeks + ' weeks...', 'Almost done...'],
  };
}

/** A built program, as far as its start goes. */
interface BuiltProgram { id: string; totalWeeks: number; startDate?: string | null; blockOpen?: string; cfg?: Record<string, unknown> | null }

/**
 * The page's _applyWizardStart: the program's start is the resolved one. A run race goal with a race date counts
 * back from the race, and the day the block opened is today; any other program starts where the resolver says. The
 * wizard's own field is taken off the stored config, so the engine stays a function of the training selections.
 */
export function applyWizardStart(prog: BuiltProgram, d: Draft, now: Date): void {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const al = d && d.cardioTypes && d.cardioTypes.includes('run') && d.cardioGoals && d.cardioGoals['run']
    ? raceAlignment(d.cardioGoals['run'].id, d.raceDate, d.eventTargeted !== false, _isoOf(today)) : null;
  if (al) {
    prog.startDate = al.start;
    prog.blockOpen = _isoOf(today);
  } else {
    prog.startDate = resolveStartDate(d && d.startDate, (d && d.restDays) || [], rsRace(d as never), now).start;
  }
  if (prog.cfg && Object.prototype.hasOwnProperty.call(prog.cfg, 'startDate')) delete prog.cfg['startDate'];
}

/**
 * The build (doGenerate, at 2,400 ms): the program built from the draft, its start applied, stored last in the list
 * and made the active one. Returns the program in hand, as the switch handed it back, and the line that says it is
 * ready. A build that throws stores nothing: the caller shows GENERATING.error with the error's words, as the page does.
 */
export function finishGenerate(store: StateStore, d: Draft, now: number, failed: RefreshReport): { prog: ScreenProgram; ready: string } {
  const prog = buildProgram(d as never) as unknown as BuiltProgram;
  applyWizardStart(prog, d, new Date(now));
  const programs = readPrograms(store) as unknown as BuiltProgram[];
  programs.push(prog);
  writePrograms(store, programs as never);
  const r = loadActive(store, prog.id, now, failed);
  if (!('prog' in r)) throw new Error('the program just stored did not load');
  return { prog: r.prog, ready: GENERATING.ready(prog.totalWeeks) };
}
