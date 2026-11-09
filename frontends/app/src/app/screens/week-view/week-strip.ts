import { TITLE_W } from './week-view-model.ts';

/**
 * Where This Week's title strip sits (D279 P-WEEKSNAP, docs/decisions/this-week.md). WebKit can draw This Week before
 * the app's stylesheet applies, while the strip is not yet a scroller: a write then clamps to 0 and the strip shows
 * Week 1 with the week in view out of sight. So the strip is placed only once it can scroll, and only counts as placed
 * when it sits where it was sent; until then it tries again on each frame, for up to READY_MS. The first placement of a
 * launch is a glide from Week 1 (Mario's Long glide preset), as the page's old scoot was (V146, V147); every later one
 * is instant. Framework free, so the tests drive it with a stand-in strip and clock.
 */

/** The glide: a wait, then the travel, peaking `overPx` past the target (at most `overFrac` of the way) at `split`. */
export const GLIDE = { waitMs: 300, travelMs: 1200, overPx: 16, overFrac: 0.05, split: 0.76 } as const;
/** How long a placement keeps trying while the strip cannot scroll yet, or does not hold its position. */
export const READY_MS = 10_000;

/** The strip as the placer reads and moves it (an HTMLElement on the phone). */
export interface StripEl {
  readonly clientWidth: number;
  readonly scrollWidth: number;
  scrollLeft: number;
  readonly style: { scrollSnapType: string };
}

/** Frames, timers and the time (the window's in the app). */
export interface StripClock {
  frame(fn: (ts: number) => void): number;
  cancelFrame(id: number): void;
  after(ms: number, fn: () => void): number;
  cancelAfter(id: number): void;
  now(): number;
}

/** Ease in and out, cubic: from rest, fastest at the middle, to rest. */
export function glideEase(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
/** The farthest the strip scrolls. */
export function stripEnd(el: Pick<StripEl, 'clientWidth' | 'scrollWidth'>): number {
  return Math.max(0, el.scrollWidth - el.clientWidth);
}
/** Where title n sits at the left edge, never past the strip's end. */
export function stripTarget(n: number, end: number): number {
  return Math.min(end, Math.max(0, (n - 1) * TITLE_W));
}
/** The strip can scroll: it has a width, and more inside than its box (its stylesheet has applied). */
export function stripReady(el: Pick<StripEl, 'clientWidth' | 'scrollWidth'>): boolean {
  return el.clientWidth > 0 && el.scrollWidth > el.clientWidth;
}
/** The glide's peak: a little past the target, never past the end. */
export function glidePeak(to: number, end: number): number {
  return Math.min(end, to + Math.min(GLIDE.overPx, to * GLIDE.overFrac));
}
/** The strip's position at p (0 to 1) of the travel: out to the peak by the split, then back onto the target. */
export function glideLeft(p: number, to: number, peak: number): number {
  if (p < GLIDE.split) return peak * glideEase(p / GLIDE.split);
  return peak + (to - peak) * glideEase((p - GLIDE.split) / (1 - GLIDE.split));
}
/** The title lit at a position: the one nearest the left edge, never past the title in view. */
export function glideLit(left: number, shown: number): number {
  return Math.max(1, Math.min(shown, Math.round(left / TITLE_W) + 1));
}

/** Places the strip, and glides it on the first placement of a launch. */
export class StripPlacer {
  private readonly clock: StripClock;
  /** The title the glide lights, or null when the screen's own title in view is lit. */
  private readonly onLit: (n: number | null) => void;
  /** The first placement has been made (glided or not): every later one is instant. */
  private greeted = false;
  private frameId = 0;
  private timerId = 0;
  private glide: { el: StripEl; to: number } | null = null;

  constructor(clock: StripClock, onLit: (n: number | null) => void) {
    this.clock = clock;
    this.onLit = onLit;
  }

  /** A glide is in flight: a scroll it makes never picks a week. */
  get busy(): boolean {
    return this.glide !== null;
  }

  /** Puts the strip on title n: the first time with the glide unless `calm`, at once after. */
  place(el: StripEl, n: number, calm: boolean): void {
    this.cancel();
    const since = this.clock.now();
    const attempt = (): void => {
      this.frameId = 0;
      const late = this.clock.now() - since >= READY_MS;
      if (!stripReady(el)) {
        if (!late) this.frameId = this.clock.frame(attempt);
        return;
      }
      const end = stripEnd(el);
      const to = stripTarget(n, end);
      const first = !this.greeted;
      this.greeted = true;
      if (first && !calm && to > 0) {
        this.start(el, to, n, end);
        return;
      }
      el.scrollLeft = to;
      if (Math.abs(el.scrollLeft - to) > 1 && !late) this.frameId = this.clock.frame(attempt);
    };
    attempt();
  }

  /** A touch on the strip: a glide in flight lands on its title at once, and the swipe goes on from there. */
  stop(): void {
    const g = this.glide;
    if (!g) return;
    this.cancel();
    g.el.scrollLeft = g.to;
  }

  /** Drops whatever is pending, leaving the strip where it is. */
  cancel(): void {
    if (this.frameId) this.clock.cancelFrame(this.frameId);
    if (this.timerId) this.clock.cancelAfter(this.timerId);
    this.frameId = 0;
    this.timerId = 0;
    if (this.glide) {
      this.glide.el.style.scrollSnapType = '';
      this.glide = null;
      this.onLit(null);
    }
  }

  private start(el: StripEl, to: number, shown: number, end: number): void {
    const peak = glidePeak(to, end);
    this.glide = { el, to };
    el.style.scrollSnapType = 'none';
    el.scrollLeft = 0;
    let lit = glideLit(0, shown);
    this.onLit(lit);
    let t0: number | null = null;
    const step = (ts: number): void => {
      this.frameId = 0;
      if (t0 === null) t0 = ts;
      const p = Math.min(1, (ts - t0) / GLIDE.travelMs);
      const left = p < 1 ? glideLeft(p, to, peak) : to;
      el.scrollLeft = left;
      const now = glideLit(left, shown);
      if (now !== lit) this.onLit((lit = now));
      if (p < 1) {
        this.frameId = this.clock.frame(step);
        return;
      }
      this.glide = null;
      el.style.scrollSnapType = '';
      this.onLit(null);
      // A glide that did not end on its title falls back to the instant placement and its checks.
      if (Math.abs(el.scrollLeft - to) > 1) this.place(el, shown, true);
    };
    this.timerId = this.clock.after(GLIDE.waitMs, () => {
      this.timerId = 0;
      this.frameId = this.clock.frame(step);
    });
  }
}
