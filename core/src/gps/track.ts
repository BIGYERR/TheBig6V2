/**
 * GPS recording (docs/decisions/gps-recording.md, D267 P-GPSTEST): the lines the iOS app's ia-gps plugin writes, and the
 * math that reads them. The plugin writes one JSON object a line, raw: a mark at start, pause, resume and finish, and
 * every fix iOS delivers, unfiltered. Every judgement runs here, over the raw lines, so a filter tuned later reruns on
 * the runs already recorded.
 *
 * Stage 1 judges only what iOS itself flags: a fix with a negative horizontal accuracy is invalid and dropped. There is
 * no accuracy cut, no speed ceiling and no smoothing; the comparison against the watch sets those, by a later ruling.
 */

/** The IUGG mean Earth radius, in metres. */
export const EARTH_RADIUS_M = 6371008.8;
/** The international mile, in metres. */
export const METRES_PER_MILE = 1609.344;

/**
 * One fix as iOS reports it (CLLocation): time in ms since 1970, degrees, metres, metres per second and degrees.
 * A negative accuracy is iOS saying it has no value for that reading.
 */
export interface GpsFix {
  t: number;
  lat: number;
  lon: number;
  ha: number;
  alt?: number;
  va?: number;
  spd?: number;
  sa?: number;
  crs?: number;
  ca?: number;
}

export type GpsMarkKind = 'start' | 'pause' | 'resume' | 'finish';
export interface GpsMark {
  t: number;
  mark: GpsMarkKind;
}
export type GpsLine = GpsFix | GpsMark;

export function isGpsMark(line: GpsLine): line is GpsMark {
  return 'mark' in line;
}

const MARKS: readonly string[] = ['start', 'pause', 'resume', 'finish'];
const OPTIONAL: readonly (keyof GpsFix)[] = ['alt', 'va', 'spd', 'sa', 'crs', 'ca'];

function finite(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** One line of a recording file, or null when it is not one: a run iOS cut short can end mid line. */
export function parseGpsLine(text: string): GpsLine | null {
  let o: unknown;
  try {
    o = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof o !== 'object' || o === null) return null;
  const r = o as Record<string, unknown>;
  if (!finite(r['t'])) return null;
  const mark = r['mark'];
  if (mark !== undefined) return typeof mark === 'string' && MARKS.includes(mark) ? { t: r['t'], mark: mark as GpsMarkKind } : null;
  if (!finite(r['lat']) || !finite(r['lon']) || !finite(r['ha'])) return null;
  const fix: GpsFix = { t: r['t'], lat: r['lat'], lon: r['lon'], ha: r['ha'] };
  for (const k of OPTIONAL) {
    const v = r[k];
    if (finite(v)) fix[k] = v;
  }
  return fix;
}

/** Every line of a recording file that parses, in file order. */
export function parseRecording(text: string): GpsLine[] {
  const out: GpsLine[] = [];
  for (const raw of text.split('\n')) {
    const s = raw.trim();
    if (!s) continue;
    const line = parseGpsLine(s);
    if (line) out.push(line);
  }
  return out;
}

/** Great circle distance in metres (haversine) on EARTH_RADIUS_M. */
export function gpsDistanceM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A fix the math uses: iOS gave it a horizontal accuracy (a negative one means the position is invalid). */
export function isValidFix(fix: GpsFix): boolean {
  return fix.ha >= 0;
}

export interface GpsSplit {
  /** 1 for the first mile. */
  mile: number;
  /** Moving seconds the mile took. */
  seconds: number;
}

export interface GpsSummary {
  state: 'empty' | 'recording' | 'paused' | 'finished';
  /** The start mark's time, or null before Start. */
  startT: number | null;
  /** The finish mark's time; while recording, the time the summary was taken. */
  endT: number | null;
  elapsedS: number;
  /** Elapsed time less every pause. */
  movingS: number;
  distanceM: number;
  splits: GpsSplit[];
  /** The mile in progress: metres and moving seconds since the last split. */
  partM: number;
  partS: number;
  /** The valid fixes of each stretch between Start, the pauses and Finish, in order. */
  stretches: GpsFix[][];
  /** The last fix iOS delivered, valid or not: what the GPS line on the screen reads. */
  lastFix: GpsFix | null;
}

/**
 * The run so far. Distance adds up between consecutive valid fixes of one stretch, so the gap a pause spans adds none.
 * Fixes before Start, inside a pause and after Finish count for nothing. Time between Pause and Resume counts toward
 * elapsed time, not moving time. A mile split falls at METRES_PER_MILE, its moving time interpolated between the two
 * fixes either side. `now` (ms since 1970) is the clock for a run still going; without it the last line's time is.
 */
export function gpsSummary(lines: readonly GpsLine[], now?: number): GpsSummary {
  let state: GpsSummary['state'] = 'empty';
  let startT: number | null = null;
  let finishT: number | null = null;
  let pausedAt: number | null = null;
  let pausedMs = 0;
  let distanceM = 0;
  let prev: GpsFix | null = null;
  let prevClock = 0;
  let lastSplitClock = 0;
  let lastLineT: number | null = null;
  let lastFix: GpsFix | null = null;
  let stretch: GpsFix[] | null = null;
  const stretches: GpsFix[][] = [];
  const splits: GpsSplit[] = [];

  for (const line of lines) {
    if (state === 'finished') break;
    lastLineT = line.t;
    if (isGpsMark(line)) {
      if (line.mark === 'start' && state === 'empty') {
        startT = line.t;
        state = 'recording';
        stretch = [];
        stretches.push(stretch);
      } else if (line.mark === 'pause' && state === 'recording') {
        pausedAt = line.t;
        state = 'paused';
        prev = null;
        stretch = null;
      } else if (line.mark === 'resume' && state === 'paused' && pausedAt !== null) {
        pausedMs += line.t - pausedAt;
        pausedAt = null;
        state = 'recording';
        stretch = [];
        stretches.push(stretch);
      } else if (line.mark === 'finish' && startT !== null) {
        if (pausedAt !== null) pausedMs += line.t - pausedAt;
        pausedAt = null;
        finishT = line.t;
        state = 'finished';
      }
      continue;
    }
    lastFix = line;
    if (state !== 'recording' || startT === null || !isValidFix(line)) continue;
    const clock = line.t - startT - pausedMs;
    if (prev) {
      const d = gpsDistanceM(prev, line);
      while (distanceM + d >= (splits.length + 1) * METRES_PER_MILE) {
        const target = (splits.length + 1) * METRES_PER_MILE;
        const at = prevClock + ((target - distanceM) / d) * (clock - prevClock);
        splits.push({ mile: splits.length + 1, seconds: (at - lastSplitClock) / 1000 });
        lastSplitClock = at;
      }
      distanceM += d;
    }
    prev = line;
    prevClock = clock;
    stretch?.push(line);
  }

  const endT = startT === null ? null : (finishT ?? now ?? lastLineT);
  const elapsedMs = startT === null || endT === null ? 0 : Math.max(0, endT - startT);
  const openPauseMs = pausedAt !== null && endT !== null ? Math.max(0, endT - pausedAt) : 0;
  const movingMs = Math.max(0, elapsedMs - pausedMs - openPauseMs);
  return {
    state,
    startT,
    endT,
    elapsedS: elapsedMs / 1000,
    movingS: movingMs / 1000,
    distanceM,
    splits,
    partM: distanceM - splits.length * METRES_PER_MILE,
    partS: Math.max(0, movingMs - lastSplitClock) / 1000,
    stretches,
    lastFix,
  };
}

/** Seconds per mile for a distance and a time, or null when no distance has been covered. */
export function pacePerMile(metres: number, seconds: number): number | null {
  return metres > 0 ? seconds / (metres / METRES_PER_MILE) : null;
}
