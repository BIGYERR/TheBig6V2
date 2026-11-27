// What Random Workout writes in the Expo app (MIGRATION.md phase 3, row 7; D289 P-NATIVEWRITES): Complete and the
// counter's reset. Both end in core's own writer of the Wildcard's record (state-programs.ts, ia_wild_<program>),
// and nothing else here names a key. It is the page's code around that writer (random-wildcard.ts), line for line,
// with its globals (the store, the active program, the clock) taken as arguments:
//
//   wildcardDayFor, completeWildcard, fireWildcardPopup, resetWildcardCounter
//
// The rulings are today's and keep their D-codes (V195 D64 and D71: a Wildcard is a substitute, never a completion;
// docs/decisions/wildcard.md). A card's Log, its set draft, a swap and a minus are the deck's own writes
// (../deck/deck-writes.ts), handed the Wildcard's working day. The store is this app's own SQLite store.
import { getWeekMonday } from '@ia/core/engine/calendar.ts';
import { readWildcardDone, writeWildcardDone } from '@ia/core/engine/state-programs.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import type { PopCall } from '../pop-up/pop-ups';
import { type ReadProgram, computeStreak, dayBeforeStart } from '../this-week/week-readers';
import { midnight } from '../this-week/week-screen';
import type { RandProgram } from './random-screen';

type DatedProgram = RandProgram & ReadProgram;

/**
 * The page's wildcardDayFor: the program's week and day that hold today, by the date (never the week being viewed),
 * or null off the program's calendar, where a Wildcard still counts and stamps no day.
 */
export function wildcardDayFor(prog: RandProgram | null | undefined, now: Date): { week: number; dayKey: string } | null {
  const g = prog as DatedProgram | null | undefined;
  if (!g || !g.startDate || !g.weeks) return null;
  const d = new Date(now); d.setHours(0, 0, 0, 0);
  const mon = getWeekMonday(g.startDate);
  const diff = Math.round((d.getTime() - mon.getTime()) / 86400000);
  if (diff < 0) return null;
  const week = Math.floor(diff / 7) + 1;
  const tw = g.totalWeeks || Object.keys(g.weeks).length;
  if (week < 1 || week > tw) return null;
  const dayKey = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][diff % 7]!;
  const wk = g.weeks[week];
  if (!wk || !wk[dayKey]) return null;
  if (dayBeforeStart(g, week, dayKey)) return null;
  return { week, dayKey };
}

/** What Complete did: the toast, and whether today holds a training day (the pop-up's sub line reads it). */
export interface Completed { toast: string; isTraining: boolean }

/**
 * The page's completeWildcard: the title joins the record once, stamped with today's day of the program when there
 * is one; then the toast. The sheet closes, This Week is drawn again and the pop-up follows 380 ms on (the screen's).
 */
export function completeWildcard(store: StateStore, prog: RandProgram, title: string, now: Date): Completed {
  const done = readWildcardDone(store, prog.id);
  const slot = wildcardDayFor(prog, now);
  if (!done.some((d) => d.title === title)) done.push({ title, ts: now.getTime(), week: slot ? slot.week : null, dayKey: slot ? slot.dayKey : null });
  writeWildcardDone(store, prog.id, done);
  const wk = slot ? prog.weeks[slot.week] : null;
  const day = (slot && wk && wk[slot.dayKey]) || null;
  return { toast: title + ' logged ✓', isTraining: !!(day && !day.rest) };
}
/** The pop-up follows Complete by this long. */
export const WILD_POP_MS = 380;

/**
 * The page's fireWildcardPopup: its own dispatcher, never the completion's (which raises the season banner on the
 * last scheduled day). The streak is read when the pop-up is raised, after the record was written.
 */
export function fireWildcardPopup(store: StateStore, prog: RandProgram, isTraining: boolean, now: Date): PopCall {
  return { tier: 'workout', opts: {
    kicker: 'Wildcard done',
    msg: 'You showed up. That is the whole game.',
    sub: isTraining ? 'Streak: ' + computeStreak(store, prog as DatedProgram, prog.id, midnight(now)) + '.' : 'Streak holds.',
  } };
}

/** The page's resetWildcardCounter, its second tap: the record emptied. Returns the toast. */
export function resetWildcards(store: StateStore, prog: RandProgram): string {
  writeWildcardDone(store, prog.id, []);
  return 'Wildcard counter reset ✓';
}
