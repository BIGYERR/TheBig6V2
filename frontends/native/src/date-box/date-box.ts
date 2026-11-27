// The date box's own sums in the Expo app (MIGRATION.md phase 3, row 5, its third session). Today's app asks WebKit
// for a date (<input type="date">): a calendar with Reset and a check, a value that is a day as yyyy-mm-dd or blank,
// and a change at each day picked and at Reset. React Native has no such field, so this app draws its own over the
// iOS calendar (DateBox.tsx). What a pick hands back is what WebKit's field hands the page: the day as local
// yyyy-mm-dd, or blank after Reset.
//
// Seen in the simulator's Safari (iOS 26.5) on a field set as today's Angular screens set theirs, its value as a
// property: a day picked is written at once and the box stays; Reset writes a blank, the box stays and its calendar
// goes back to today; the check, or a tap outside, closes it. The field's earliest day (Through carries From as its
// min) is not enforced by WebKit's calendar: a day before it is picked and written, and the page's own refusal,
// Through can't be before From, is what answers. So this calendar offers every day too.
import { _isoOf, _parseLocalDate } from '@ia/core/engine/calendar.ts';

//
// A FIELD WHOSE VALUE IS AN ATTRIBUTE (the wizard's race date, seen in the same Safari on 2026-11-26): Reset does
// not blank it. The field goes back to the day it was drawn with, hands that day to its handler, and its calendar
// goes back to that day. A DateAsk names that day as `reset`; with none, Reset writes a blank as before.

/**
 * What opens the box: the field's value (a day, or blank), the earliest day the field names (not enforced, as
 * WebKit's is not), where a change goes, and for a field drawn with its value as an attribute the day Reset goes back to.
 */
export interface DateAsk { value: string; min: string | null; onChange: (iso: string) => void; reset?: string }

/** The day the calendar opens on: the field's own, or today for a blank field or one that does not read. */
export function calendarDay(value: string, now: Date): Date {
  const d = _parseLocalDate(value);
  if (d) return d;
  const t = new Date(now); t.setHours(0, 0, 0, 0);
  return t;
}

/** The value a picked day writes: the local day, whatever hour the calendar hands back. */
export function pickedValue(d: Date): string { return _isoOf(d); }

/** The value Reset writes: a blank field. */
export const RESET_VALUE = '';
/** What Reset writes for an ask: the day the field was drawn with when it names one, else a blank. */
export function resetWrites(ask: { reset?: string }): string {
  return ask.reset === undefined ? RESET_VALUE : ask.reset;
}
/** The day the calendar shows after Reset: the day the field was drawn with when it names one, else the day the box opened on. */
export function resetDay(ask: { reset?: string }, opened: Date, now: Date): Date {
  return ask.reset === undefined ? opened : calendarDay(ask.reset, now);
}
/** How far a pressed button of the box dims, so a tap shows (WebKit's own Reset and check dim under the finger). */
export const PRESSED_DIM = 0.55;
/** The box's two buttons: WebKit's Reset, and its check, which reads Done to VoiceOver. */
export const DATE_WORDS = { reset: 'Reset', done: 'Done' } as const;
