// The generating screen's figure in the Expo app: today's lifting figure (screens.html and the Angular
// generating-screen.ts), whose motion the page writes as SVG animation. React Native's SVG has no such animation, so
// the figure's shape at an instant is worked out here from the same numbers, and the screen draws it frame by frame:
// one squat every 1.5 s, the bar and the body sinking 11 and coming back on the page's ease, the legs folding with
// them, and two sparks off the bar on the way up.
export const FIGURE = { periodMs: 1500, size: 48, box: 64 } as const;

/** The page's ease for the squat (keySplines 0.45 0 0.55 1), as a cubic bezier over 0..1. */
export function ease(x: number): number {
  const x1 = 0.45, y1 = 0, x2 = 0.55, y2 = 1;
  const bez = (t: number, a: number, b: number): number => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (bez(mid, x1, x2) < x) lo = mid; else hi = mid; }
  return bez((lo + hi) / 2, y1, y2);
}

/** A value at `t` (0..1) along the page's key times, moving straight between them. */
export function along(t: number, times: number[], values: number[]): number {
  for (let i = 1; i < times.length; i++) {
    if (t <= times[i]!) {
      const span = times[i]! - times[i - 1]!;
      const f = span > 0 ? (t - times[i - 1]!) / span : 1;
      return values[i - 1]! + (values[i]! - values[i - 1]!) * f;
    }
  }
  return values[values.length - 1]!;
}

/** The figure at an instant: how far the bar and body have sunk, the two legs' paths, and the two sparks. */
export interface FigureFrame { dy: number; left: string; right: string; sparks: { cx: number; cy: number; r: number; opacity: number }[] }

/** The figure `ms` into its motion. */
export function figureAt(ms: number): FigureFrame {
  const t = ((ms % FIGURE.periodMs) + FIGURE.periodMs) % FIGURE.periodMs / FIGURE.periodMs;
  // Down over the first half, up over the second, each half eased.
  const k = t <= 0.5 ? ease(t / 0.5) : 1 - ease((t - 0.5) / 0.5);
  const mix = (a: number, b: number): number => +(a + (b - a) * k).toFixed(2);
  const leg = (a: number[], b: number[]): string => 'M' + mix(a[0]!, b[0]!) + ' ' + mix(a[1]!, b[1]!) + ' L' + mix(a[2]!, b[2]!) + ' ' + mix(a[3]!, b[3]!) + ' L' + mix(a[4]!, b[4]!) + ' ' + mix(a[5]!, b[5]!);
  return {
    dy: +(11 * k).toFixed(2),
    left: leg([32, 36, 26, 46, 24, 56], [32, 47, 20, 49, 24, 57]),
    right: leg([32, 36, 38, 46, 40, 56], [32, 47, 44, 49, 40, 57]),
    sparks: [
      { r: 1.3, cx: along(t, [0, 0.5, 0.78, 1], [40, 40, 44, 44]), cy: along(t, [0, 0.5, 0.78, 1], [24, 24, 31, 31]), opacity: along(t, [0, 0.5, 0.6, 0.78, 1], [0, 0, 1, 0, 0]) },
      { r: 1.1, cx: along(t, [0, 0.55, 0.85, 1], [24, 24, 20, 20]), cy: along(t, [0, 0.55, 0.85, 1], [24, 24, 30, 30]), opacity: along(t, [0, 0.55, 0.65, 0.85, 1], [0, 0, 1, 0, 0]) },
    ],
  };
}
