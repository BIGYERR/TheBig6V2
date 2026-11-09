// The iOS edge swipe (D277 P-SWIPEBACK, docs/decisions/swipe-back.md), kept apart from Angular so the app's node --test
// suite reads it as it is: where a swipe may start, when it takes the touch from the page, whether a release goes back,
// and which page it moves. The numbers are iOS's.

/** A swipe starts within this many px of the left edge. */
export const EDGE = 24;
/** It takes the touch once the finger has moved this many px more sideways than up or down. */
export const LOCK = 10;
/** A release past this share of the screen's width goes back. */
export const HALF = 0.5;
/** A flick right faster than this, in px a millisecond, goes back from anywhere. */
export const FLICK = 0.3;
/** A flick left faster than this goes home from anywhere. */
export const FLICK_HOME = -0.1;
/** Both ways settle over this long, on this curve. */
export const SETTLE_MS = 280;
export const SETTLE_EASE = 'cubic-bezier(.2,.8,.2,1)';

/** Whether a touch at x (px from the left) may start a swipe back. */
export function atEdge(x: number): boolean {
  return x >= 0 && x <= EDGE;
}

/**
 * What the touch is, from how far it has moved: the swipe (sideways, past LOCK), the page's own scroll (up or down
 * first), or not yet known.
 */
export function lockOf(dx: number, dy: number): 'swipe' | 'scroll' | null {
  if (Math.abs(dy) > LOCK && Math.abs(dy) >= Math.abs(dx)) return 'scroll';
  if (dx > LOCK && dx > Math.abs(dy)) return 'swipe';
  return null;
}

/** Where the page sits under the finger: never left of home. */
export function follow(dx: number): number {
  return Math.max(0, dx);
}

/** On release: back past half the width or on a flick right; home on a flick left or short of half. */
export function settle(dx: number, vx: number, width: number): 'back' | 'home' {
  if (vx <= FLICK_HOME) return 'home';
  if (vx >= FLICK && dx > LOCK) return 'back';
  return dx >= width * HALF ? 'back' : 'home';
}

/** A page on screen: how high it sits (z, then later in the page) and its Back to press, if it has one. */
export interface Layer { z: number; order: number; back: unknown }

/** The page a swipe moves: the top one, and only when it has a Back (a pop-up over a sheet stops the swipe). */
export function topLayer<L extends Layer>(layers: readonly L[]): L | null {
  let top: L | null = null;
  for (const l of layers) if (!top || l.z > top.z || (l.z === top.z && l.order > top.order)) top = l;
  return top && top.back ? top : null;
}

/** The finger's speed at release, px a millisecond, from its last two samples (0 with fewer, or none apart in time). */
export function speed(samples: readonly { x: number; t: number }[]): number {
  if (samples.length < 2) return 0;
  const a = samples[samples.length - 2]!, b = samples[samples.length - 1]!;
  return b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0;
}
