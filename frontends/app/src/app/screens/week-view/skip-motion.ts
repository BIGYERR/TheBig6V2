// The Skip pill's motion (D284 P-SKIPPILL, docs/decisions/this-week.md), kept apart from Angular so the app's
// node --test suite reads it as it is. Mario's picks on the Skip the Day board (docs/design/card-skip.html): the pill
// presses at its own speed (Pop); the card goes dark in slow motion, three times as slow (Fade at 350 ms, Dim at 50%),
// with its button sinking over the same time (Sunken); the lift card's dumbbell snaps in half (Snap). Undo is the same
// pill, and the card, its button and the dumbbell each play their skip backwards: the same frames, the same time, each
// curve turned around.

/** The press: 70% over 150 ms, dark while small, back out over 320 ms through 112% at 55% of the way. */
export const POP = { inMs: 150, to: 0.7, outMs: 320, peak: 1.12, at: 0.55 } as const;
/** The card's fade at normal speed, and Mario's slow motion. */
export const FADE_MS = 350;
export const SLOW = 3;
/** The card going dark, and back: 1,050 ms. */
export const CARD_MS = FADE_MS * SLOW;
/** What everything on a skipped card but the pill fades to. */
export const DIM = 0.5;
/** The dumbbell's break, and its mend. */
export const BREAK_MS = 520;

/** A cubic Bézier as its four numbers. */
export type Curve = readonly [number, number, number, number];
/** The button's moves (its sink, its height) and its colours. */
export const MOVE: Curve = [0.2, 0.8, 0.2, 1];
export const EASE: Curve = [0.25, 0.1, 0.25, 1];
/** The pill's shrink: it gathers speed into the press. */
export const SHRINK: Curve = [0.5, 0, 0.75, 0];

export const bezier = (b: Curve): string => 'cubic-bezier(' + b.join(',') + ')';
/** A curve played backwards: the curve turned half round about its middle. */
export function reversed(b: Curve): Curve {
  const r = (v: number) => +(1 - v).toFixed(3);
  return [r(b[2]), r(b[3]), r(b[0]), r(b[1])];
}
/** The button's curves for a skip (forwards) or an undo (backwards). */
export function buttonCurves(skipping: boolean): { move: string; ease: string } {
  return skipping ? { move: bezier(MOVE), ease: bezier(EASE) } : { move: bezier(reversed(MOVE)), ease: bezier(reversed(EASE)) };
}

/** The pill's shrink, and its pop back out, the same both ways. */
export const shrinkFrames = (): Keyframe[] => [{ transform: 'scale(1)' }, { transform: 'scale(' + POP.to + ')' }];
export const popFrames = (): Keyframe[] => [
  { transform: 'scale(' + POP.to + ')', offset: 0 },
  { transform: 'scale(' + POP.peak + ')', offset: POP.at, easing: 'cubic-bezier(.3,0,.5,1)' },
  { transform: 'scale(1)', offset: 1 },
];
export const popEase = 'cubic-bezier(.2,.8,.3,1)';

/** The card's work going dark: from full to DIM. An undo plays the same frames backwards. */
export const dimFrames = (): Keyframe[] => [{ opacity: 1 }, { opacity: DIM }];
/** The card's ground going a shade darker, between two colours the theme gives. */
export const groundFrames = (lit: string, off: string): Keyframe[] => [{ backgroundColor: lit }, { backgroundColor: off }];

/** One step of a dumbbell half: how far it moves out and down (in the icon's 24 unit box) and how far it turns. */
export interface HalfStep { x: number; y: number; deg: number; at?: number }
/** The break: a crack to 7 degrees, back to 2, past 30 and down, resting at 22 in a V, 2 units apart. */
export const BREAK: readonly HalfStep[] = [
  { x: 0, y: 0, deg: 0 },
  { x: 0, y: 0, deg: 7, at: 0.16 },
  { x: 0, y: 0, deg: 2, at: 0.28 },
  { x: 2.8, y: 1.8, deg: 30, at: 0.68 },
  { x: 2, y: 1.2, deg: 22 },
];
/** A half's frames: side -1 the left half (it turns clockwise about its middle plate), +1 the right. */
export function halfFrames(side: -1 | 1): Keyframe[] {
  return BREAK.map((s) => {
    const f: Keyframe = { transform: 'translate(' + side * s.x + 'px,' + s.y + 'px) rotate(' + -side * s.deg + 'deg)' };
    if (s.at !== undefined) f.offset = s.at;
    return f;
  });
}

/** How each part of the card moves for a skip or an undo: an undo is the same animation with its direction reversed. */
export function cardTiming(skipping: boolean, ms: number): KeyframeAnimationOptions {
  return { duration: ms, easing: 'ease-out', direction: skipping ? 'normal' : 'reverse' };
}

/** The elements one card's motion needs. */
export interface SkipCard {
  card: HTMLElement;
  lit: HTMLElement | null;
  halves: Element[];
}

/**
 * Plays the card going dark (or coming back): its work dims, its ground darkens, its dumbbell breaks (or mends).
 * Animations still running from the last tap are turned round where they are, so a tap part way through never jumps.
 */
export function playCard(el: SkipCard, skipping: boolean, running: Animation[], colours: { lit: string; off: string }): Animation[] {
  const live = running.filter((a) => a.playState === 'running');
  if (live.length) {
    live.forEach((a) => a.reverse());
    return live;
  }
  const out: Animation[] = [];
  const t = cardTiming(skipping, CARD_MS);
  if (el.lit) out.push(el.lit.animate(dimFrames(), t));
  out.push(el.card.animate(groundFrames(colours.lit, colours.off), t));
  const b = cardTiming(skipping, BREAK_MS);
  el.halves.forEach((h, i) => out.push(h.animate(halfFrames(i === 0 ? -1 : 1), b)));
  return out;
}
