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

/** The international foot, in metres. */
export const METRES_PER_FOOT = 0.3048;

/** A climb in whole feet ("33 ft", D296); GPS_BLANK with no barometer reading. */
export function formatFeet(metres: number | null): string {
  return metres === null ? GPS_BLANK : `${Math.round(metres / METRES_PER_FOOT)} ft`;
}

/** A split's net change in whole feet with its sign ("+10 ft", "−7 ft", "0 ft"); empty with no barometer reading. */
export function formatFeetChange(metres: number | null): string {
  if (metres === null) return '';
  const ft = Math.round(metres / METRES_PER_FOOT);
  return ft > 0 ? `+${ft} ft` : ft < 0 ? `−${-ft} ft` : '0 ft';
}

/** Steps a minute, whole ("150 spm", D296); GPS_BLANK with no steps. */
export function formatCadence(stepsPerMinute: number | null): string {
  return stepsPerMinute === null || !Number.isFinite(stepsPerMinute) ? GPS_BLANK : `${Math.round(stepsPerMinute)} spm`;
}

/** A step count with thousands commas ("1,500", D296); GPS_BLANK with no step counter. */
export function formatSteps(steps: number | null): string {
  return steps === null ? GPS_BLANK : Math.round(steps).toLocaleString('en-US');
}
