// The mile pencil's two sheets, kept apart from Angular so the app's node --test suite reads them as they are
// (architecture phase E, step 8: the sheets move from the legacy openMileSheet's writes to the MileSheet and MileLock
// components). Whether a tap opens the edit sheet or the lock, and what the lock lists, are decided here, each string the
// legacy openMileSheet's; saving the mile is still the legacy commitMileChange.

/** The edit sheet's line under its heading. */
export const MILE_INTRO =
  'Put in the mile you can run today. Every run still ahead of you rebuilds off it. Weeks you have already trained stand as they are.';

/** The lock's reason. */
export const MILE_LOCK_TEXT =
  'You are too close to the race. Three weeks out the work is done. Changing your mile now would reset the pace of every session left, and those sessions have one job. Get you to the line fresh.';

/** Whether the pencil shows the lock: the last three weeks of a program, judged at the tap, never at render. */
export function mileLocked(week: number, totalWeeks: number): boolean {
  return week >= totalWeeks - 2;
}

/** One row of the lock's facts. */
export interface MileFact {
  k: string;
  v: string;
}

/** A race countdown (the legacy raceCountdown's). */
export interface Countdown {
  days: number;
  weeks: number;
}

/** The legacy pieces the lock reads: the countdown, its words, and the race day's date line. */
export interface LockDeps {
  countdown(iso: string): Countdown | null;
  words(cd: Countdown): { card: string } | null;
  day(iso: string): string;
}

/**
 * The lock's facts, as the legacy openMileSheet listed them: the days out and the race day when the race date reads,
 * then the week. Days out counts days at every horizon; at race day and past it, the countdown's own words.
 */
export function mileLockFacts(raceDate: string | null | undefined, week: number, totalWeeks: number, deps: LockDeps): MileFact[] {
  const facts: MileFact[] = [];
  if (raceDate) {
    const cd = deps.countdown(raceDate);
    if (cd && isFinite(cd.days)) {
      const out = cd.days >= 1 ? String(cd.days) : deps.words(cd)!.card;
      let day: string;
      try {
        day = deps.day(raceDate);
      } catch {
        day = String(raceDate);
      }
      facts.push({ k: 'Days out', v: out }, { k: 'Race day', v: day });
    }
  }
  facts.push({ k: 'Week', v: week + ' of ' + totalWeeks });
  return facts;
}

/** A stored mile field as the edit sheet starts it: the stored value, or empty when there is none. */
export function mileField(v: string | number | null | undefined): string {
  return v === undefined || v === null ? '' : String(v);
}
