// The opening out of a card (D275 P-DECK call 16, Lift first at 420 ms, docs/decisions/swipe-deck.md), as today's
// grow-motion.ts plays it (frontends/app/src/app/screens/deck/grow-motion.ts growFx): the deck is drawn at the place
// of the card on This Week that started it, under a copy of the card; the card lifts, then opens to the whole screen
// as the deck fades in; leaving plays it back into the card. The times and curves are deck-model.ts openMotion, the
// model today's deck reads. This file is the motion as plain numbers; DeckOpening.tsx moves the layers by it.
//
// Today's frame is a CSS clip-path that opens. React Native has none, so the frame here is a box that cuts off what
// is outside it (the card's box, the card lifted, the whole screen) with the deck held still inside it.
import { openMotion } from './deck-model';

/** Where the card sits on the screen, in points: its top, left, width and height. */
export interface GrowBox { t: number; l: number; w: number; h: number }
/** The frame at one rest of the motion: its box and its corner. */
export interface GrowFrame extends GrowBox { r: number }

/**
 * The frame's three rests for a card at `o` on a screen `vw` by `vh`: the card's own box with its 24 point corners;
 * the card lifted, 10 points more at top and bottom and 8 at each side, corners 28; the whole screen, square.
 */
export function growFrames(o: GrowBox, vw: number, vh: number): { card: GrowFrame; lifted: GrowFrame; full: GrowFrame } {
  return {
    card: { t: o.t, l: o.l, w: o.w, h: o.h, r: 24 },
    lifted: { t: o.t - 10, l: o.l - 8, w: o.w + 16, h: o.h + 20, r: 28 },
    full: { t: 0, l: 0, w: vw, h: vh, r: 0 },
  };
}

/**
 * What moves. `frame` runs 0 the card, 1 lifted, 2 the whole screen; `shut` runs 0 the whole screen to 1 the card
 * (the close goes straight back, not by way of the lift). `scrim` is the black over This Week, `week` This Week's
 * size under the deck. `copyFade` and `copyScale` are the copy of the card, `copyFill` its ground: 0 none, 1 one step
 * lighter than a card, 2 a card's own. `deckFade` and `deckScale` are the deck.
 */
export type GrowPart = 'frame' | 'shut' | 'scrim' | 'week' | 'copyFade' | 'copyScale' | 'copyFill' | 'deckFade' | 'deckScale';
/** The four curves: the three of openMotion, and CSS ease. */
export type GrowEase = 'lift' | 'open' | 'close' | 'ease';
/** One part's move in a stage: where it goes, over how long, after what wait, on which curve. */
export interface GrowStep { part: GrowPart; to: number; ms: number; delay: number; ease: GrowEase }

/** Where every part stands before anything moves: the deck drawn at the card's place, hidden at 94%, under the copy. */
export const GROW_START: Record<GrowPart, number> = { frame: 0, shut: 0, scrim: 0, week: 1, copyFade: 1, copyScale: 1, copyFill: 0, deckFade: 0, deckScale: 0.94 };
/** Where every part stands with no motion (Reduce Motion, or no card on the screen): the deck open, nothing under it moved. */
export const GROW_STILL: Record<GrowPart, number> = { frame: 2, shut: 0, scrim: 0, week: 1, copyFade: 0, copyScale: 1, copyFill: 0, deckFade: 1, deckScale: 1 };

/** The three stages, each part's move in each (grow-motion.ts growFx: 'lift', 'in' and the close). */
export function growPlan(speed = 420): { lift: GrowStep[]; open: GrowStep[]; close: GrowStep[] } {
  const M = openMotion(speed);
  const step = (part: GrowPart, to: number, ms: number, ease: GrowEase, delay = 0): GrowStep => ({ part, to, ms, delay, ease });
  return {
    lift: [
      step('scrim', 0.3, M.lift, 'ease'),
      step('copyScale', 1.04, M.lift, 'lift'),
      step('copyFill', 1, M.lift, 'lift'),
      step('frame', 1, M.lift, 'lift'),
    ],
    open: [
      step('week', 0.96, M.open, 'open'),
      step('scrim', 0.55, M.open, 'open'),
      step('copyFade', 0, M.copyFadeOut, 'ease'),
      step('frame', 2, M.open, 'open'),
      step('deckFade', 1, M.deckFadeIn, 'ease', M.deckFadeDelay),
      step('deckScale', 1, M.open, 'open'),
    ],
    close: [
      step('week', 1, M.close, 'close'),
      step('scrim', 0, M.close, 'close'),
      step('copyFade', 1, M.copyBackTo - M.copyBackFrom, 'ease', M.copyBackFrom),
      step('copyScale', 1, M.close, 'close'),
      step('copyFill', 2, M.close, 'ease'),
      step('shut', 1, M.close, 'close'),
      step('deckFade', 0, M.deckFadeOut, 'ease'),
      step('deckScale', 0.94, M.close, 'close'),
    ],
  };
}

/** A curve's four numbers: openMotion's own for the three stages (its CSS cubic-bezier text), CSS ease for the rest. */
export function growCurve(ease: GrowEase): [number, number, number, number] {
  if (ease === 'ease') return [0.25, 0.1, 0.25, 1];
  const n = (openMotion().ease[ease].match(/-?\d*\.?\d+/g) || []).map(Number);
  return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 1, n[3] ?? 1];
}

/** The parts that change a box or a colour, which the screen moves itself; the rest are a fade or a size, handed to the phone. */
export const GROW_LAYOUT: readonly GrowPart[] = ['frame', 'shut', 'copyFill'];
