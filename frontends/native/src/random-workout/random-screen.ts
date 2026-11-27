// Random Workout in the Expo app, as a view (MIGRATION.md phase 3, row 7): the stored state, the program in hand, the
// day last opened and a draw in, the sheet out. It is the Angular screen's own reads (random-workout.ts over
// random-workout-model.ts, a copy held to the byte) with the page's globals taken as arguments:
//
//   randFilter, lastRandIdx           RandState, kept for the app's life: the filter and the last draw outlive the sheet
//   _wildDraw (D250 P-WILDEDIT)       WildDraw: the draw's own working day, which a swap or a minus changes and nothing stores
//   activeProg, currentWeek           the program in hand and the week This Week holds as its own
//   currentDayKey, _unitLabel,
//   _staleWarnShown, _staleWarnSrc    DayInHand (../deck/deck-screen.ts): what the last deck or sheet opened left behind
//
// The cards are the session sheet's own (sectionsView), read as the Angular sectionReads reads them with the source
// 'wild': each section off the working day, each swap chip off the working day's own swaps, and everything else as
// the session sheet reads it for the week in hand and the day last opened. That is today's own, carried as it stands
// and not ruled (tests/measure/native-row7_today.md): a Wildcard card shows, and logs under, the day last opened.
// Nothing here writes a key: what the sheet writes is random-writes.ts and ../deck/deck-writes.ts.
import { readWildcardDone } from '@ia/core/engine/state-programs.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import type { ExCard, ExSection, SectionView } from '../day-detail/session-sections-model';
import { sectionsView } from '../day-detail/session-sections-model';
import type { Session, WildDay } from '../deck/deck-writes';
import { type DayInHand, type DeckProgram, type Fields, deckReads } from '../deck/deck-screen';
import { fieldsOf } from '../deck/set-fields';
import { RAND_POOLS } from './random-pools';
import { type RandFilter, type RandView, type RandWorkout, randCount, randDraw, randPool, randView } from './random-workout-model';

/** The program in hand, as far as Random Workout reads it. */
export type RandProgram = DeckProgram & { goal?: string };
/** What outlives the sheet (the Angular screen's filter signal and the page's lastRandIdx): the filter, the last draw. */
export interface RandState { filter: RandFilter; lastIdx: number }
export const newRandState = (): RandState => ({ filter: 'mine', lastIdx: -1 });

/** The page's _wildDraw: the workout drawn, and its own working day (a copy of its sections, the swaps made on it). */
export interface WildDraw extends WildDay { w: RandWorkout; sections: ExSection[] }
/** An open sheet: the working day, and its head as the draw read it (the badge is not read again until the next draw). */
export interface RandOpen { wild: WildDraw; head: RandView }

/** The page's activeProg?.goal||'balanced'. */
export const goalOf = (prog: RandProgram | null | undefined): string => (prog && prog.goal) || 'balanced';

/**
 * The Angular reroll(): a workout other than the last drawn, from the pool the filter names, its working day made
 * afresh, and its head read against the Wildcards already done. The draw's index is kept for the next one.
 */
export function drawRandom(st: RandState, store: StateStore, prog: RandProgram, random: () => number): RandOpen {
  const goal = goalOf(prog);
  const pool = randPool(RAND_POOLS, goal, st.filter);
  const idx = randDraw(pool.length, st.lastIdx, random);
  st.lastIdx = idx;
  const w = pool[idx]!;
  const wild: WildDraw = { w, sections: JSON.parse(JSON.stringify(w.sections || [])) as ExSection[], swaps: [] };
  return { wild, head: randView(w, readWildcardDone(store, prog.id), goal) };
}

/** The page's swapOriginOf for a Wildcard card: the lift the newest of the working day's own swaps took this name from. */
export function wildOrigin(wild: WildDay, name: string): string | null {
  const hit = (wild.swaps || []).filter((e) => e && e.to === name).pop();
  return (hit && hit.from) || null;
}

/** The program as a Wildcard card reads it: the page's unit label is the last opened day's, not the program's. */
export function inUnit(prog: RandProgram, hand: DayInHand): RandProgram {
  return { ...prog, cfg: { ...(prog.cfg || {}), unit: hand.unit } };
}

/**
 * What a Wildcard card's taps write under: the week in hand and the day last opened, blank when none was (the page's
 * logExerciseWeight stores currentDayKey||''). The page's Log turns the load field and names its toast by the
 * program's unit, and turns each set's load by the unit label, which is the last opened day's: both are handed on.
 */
export function wildSession(store: StateStore, prog: RandProgram, hand: DayInHand, week: number): Session {
  return { store, prog, week, dayKey: hand.dayKey || '', label: hand.unit };
}

/**
 * The Angular drawSections(): the working day's cards, on every draw and again after a swap or a minus on one. The
 * stale warning is the app's one, as the last open left it: no draw here starts it afresh.
 */
export function wildSections(store: StateStore, prog: RandProgram, hand: DayInHand, week: number, wild: WildDraw, nowMs: number): SectionView[] {
  const reads = deckReads(store, inUnit(prog, hand), week, hand.dayKey as string, nowMs, hand.warn);
  return sectionsView(wild.sections, undefined, {
    ...reads,
    daySection: (i) => wild.sections[i] || null,
    swapOrigin: (n) => wildOrigin(wild, n),
  });
}

/** A sheet as drawn: the draw, and its cards. */
export interface RandSheet extends RandOpen { sections: SectionView[] }
/**
 * The Angular open() and setFilter(): a fresh draw and its cards. Made where the tap lands, never while the screen
 * draws: a draw moves the last index on, and its cards may speak the stale warning, each once.
 */
export function openRandom(st: RandState, store: StateStore, prog: RandProgram, hand: DayInHand, week: number, random: () => number, nowMs: number): RandSheet {
  const o = drawRandom(st, store, prog, random);
  return { ...o, sections: wildSections(store, prog, hand, week, o.wild, nowMs) };
}

/** Every move's card of the sheet, in order. */
export function wildMoves(sections: SectionView[]): ExCard[] {
  return sections.flatMap((sec) => (sec.kind === 'section' ? sec.body.items : [])).filter((x): x is ExCard => x.kind === 'card');
}
/** Each move's fields as its card draws them: at a draw, and again after every redraw. */
export function wildFields(sections: SectionView[]): Fields {
  const out: Fields = {};
  for (const x of wildMoves(sections)) out[x.exKey] = fieldsOf(x);
  return out;
}

/** The Angular updateCounter(): the goal's own Wildcards done, out of how many its pool holds, on This Week's button. */
export function randCounter(store: StateStore, prog: RandProgram | null | undefined): string {
  return randCount(prog ? readWildcardDone(store, prog.id) : [], RAND_POOLS, goalOf(prog));
}

/** The words of the sheet that no model holds (the Angular template's, and the page's reset). */
export const RAND_WORDS = {
  back: '← Back',
  reset: '↺ Reset',
  again: 'Tap again',
  resetLabel: 'Reset wildcard counter',
  badge: 'Wildcard',
  badgeDone: 'Done Before ✓',
  doneBlock: '✓ You\'ve done this one before',
  complete: ' Complete — Mark Done',
  completeIcon: '✅',
} as const;
/** The reset asks again for this long (the page's two tap reset). */
export const RESET_ASK_MS = 3000;
