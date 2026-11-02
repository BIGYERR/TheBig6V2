/**
 * How a recorded run reads on the screen (D267 P-GPSTEST): miles to two places, pace as m:ss per mile, time as m:ss or
 * h:mm:ss. Rounding happens once, on whole seconds, so a pace never reads 8:60.
 */
import { METRES_PER_MILE } from './track.ts';

/** Shown where a number has no value yet, standing alone (never inside a sentence). */
export const GPS_BLANK = '—';

export function formatMiles(metres: number): string {
  return (metres / METRES_PER_MILE).toFixed(2);
}

/** m:ss, or h:mm:ss from an hour on. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Seconds per mile as m:ss; GPS_BLANK when there is no pace. */
export function formatPace(secondsPerMile: number | null): string {
  return secondsPerMile === null || !Number.isFinite(secondsPerMile) ? GPS_BLANK : formatClock(secondsPerMile);
}
