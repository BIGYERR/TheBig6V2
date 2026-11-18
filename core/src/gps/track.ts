/**
 * GPS recording (docs/decisions/gps-recording.md, D267 P-GPSTEST): the lines the iOS app's ia-gps plugin writes, and the
 * math that reads them. The plugin writes one JSON object a line, raw: a mark at start, pause, resume and finish, and
 * every fix iOS delivers, unfiltered. Every judgement runs here, over the raw lines, so a filter tuned later reruns on
 * the runs already recorded.
 *
 * A fix with a negative horizontal accuracy is iOS saying it has none, and is dropped. Distance counts by the 10 m
 * rule (D293 P-GPSSMOOTH): a fix is kept only once it stands MIN_STEP_M from the last one kept, with an accuracy of
 * MAX_ACCURACY_M or better, and the distance joins the kept fixes. The rule does not depend on speed: standing drift
 * never stands 10 m from the last kept fix, a wobble of a few metres adds little to a 10 m step, and at a ride's speed
 * every fix is kept, so no bend is averaged away.
 *
 * Beside the fixes the plugin records the step counter and the barometer (D296 P-STEPCLIMB), raw: the steps counted
 * while recording, the cadence, and the climb on a turn band of CLIMB_BAND_M, the band the watch counts its own with.
 */

/** The IUGG mean Earth radius, in metres. */
export const EARTH_RADIUS_M = 6371008.8;
/** The international mile, in metres. */
export const METRES_PER_MILE = 1609.344;
/** The 10 m rule (D293): a fix counts once it stands this far from the last one kept. */
export const MIN_STEP_M = 10;
/** The worst horizontal accuracy a fix may have and still be kept for distance (D293). */
export const MAX_ACCURACY_M = 50;
/** The turn band the climb is counted on (D296), read off the watch's own totals. */
export const CLIMB_BAND_M = 2;

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
/**
 * The step counter's reading (Core Motion, D296): the steps since Start and, where iOS gives them, its distance from
 * steps in metres and its current cadence in steps a second. Recorded raw; the distance is never counted.
 */
export interface GpsSteps {
  t: number;
  steps: number;
  sd?: number;
  cad?: number;
}
/** The barometer's reading (D296): the altitude in metres relative to its first reading, and the pressure in kPa. */
export interface GpsBaro {
  t: number;
  ralt: number;
  kpa?: number;
}
export type GpsLine = GpsFix | GpsMark | GpsSteps | GpsBaro;

export function isGpsMark(line: GpsLine): line is GpsMark {
  return 'mark' in line;
}
export function isGpsSteps(line: GpsLine): line is GpsSteps {
  return 'steps' in line;
}
export function isGpsBaro(line: GpsLine): line is GpsBaro {
  return 'ralt' in line;
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
  if (finite(r['steps'])) {
    const s: GpsSteps = { t: r['t'], steps: r['steps'] };
    if (finite(r['sd'])) s.sd = r['sd'];
    if (finite(r['cad'])) s.cad = r['cad'];
    return s;
  }
  if (finite(r['ralt'])) {
    const b: GpsBaro = { t: r['t'], ralt: r['ralt'] };
    if (finite(r['kpa'])) b.kpa = r['kpa'];
    return b;
  }
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
  /** The barometer's net change across the mile in metres (D296), or null with no barometer reading. */
  climbM: number | null;
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
  /** Steps counted while recording (D296), or null when the step counter gave no reading. */
  steps: number | null;
  /** Those steps over the moving minutes, steps a minute, or null with no steps or no moving time. */
  cadenceSpm: number | null;
  /** Metres climbed and descended on the CLIMB_BAND_M turn band (D296), or null with no barometer reading. */
  climbM: number | null;
  descentM: number | null;
}

/** The barometer's altitude last read at or before t, else its first reading, else null. */
function altitudeAt(baro: readonly GpsBaro[], t: number): number | null {
  const first = baro[0];
  if (!first) return null;
  let a = first.ralt;
  for (const b of baro) {
    if (b.t > t) break;
    a = b.ralt;
  }
  return a;
}

/**
 * The run so far. Distance adds up by the 10 m rule (D293) inside each stretch, so the gap a pause spans adds none:
 * the stretch's first fix with an accuracy of MAX_ACCURACY_M or better is kept, then a fix is kept, and its distance
 * from the last kept one added, only when that distance is MIN_STEP_M or more. Nothing after a stretch's last kept fix
 * is added. Fixes before Start, inside a pause and after Finish count for nothing. Time between Pause and Resume counts
 * toward elapsed time, not moving time. A mile split falls at METRES_PER_MILE, its moving time interpolated between the
 * two kept fixes either side, and its climb the barometer's net change across it.
 *
 * Steps (D296) are the rise in the step total between two readings of one stretch, the total standing at 0 at Start,
 * so the steps between the last reading before a pause and the first after it count for nothing. The climb counts the
 * barometer's readings of each stretch on a turn band: the altitude last counted is the mark (the stretch's first
 * reading to begin with); a reading above the mark counts as climb when the last change counted was a climb or when it
 * stands CLIMB_BAND_M or more above the mark, a reading below it counts as descent the same way, and either way the
 * mark moves to it. `now` (ms since 1970) is the clock for a run still going; without it the last line's time is.
 */
export function gpsSummary(lines: readonly GpsLine[], now?: number): GpsSummary {
  let state: GpsSummary['state'] = 'empty';
  let startT: number | null = null;
  let finishT: number | null = null;
  let pausedAt: number | null = null;
  let pausedMs = 0;
  let distanceM = 0;
  let kept: GpsFix | null = null;
  let keptClock = 0;
  let lastSplitClock = 0;
  let lastLineT: number | null = null;
  let lastFix: GpsFix | null = null;
  let stretch: GpsFix[] | null = null;
  const stretches: GpsFix[][] = [];
  const splitWalls: number[] = [];
  const splitTimes: { mile: number; seconds: number }[] = [];
  let steps: number | null = null;
  let stepsPrev: number | null = null;
  const baro: GpsBaro[] = [];
  let climbM: number | null = null;
  let descentM: number | null = null;
  let mark: number | null = null;
  let dir = 0;

  for (const line of lines) {
    if (state === 'finished') break;
    lastLineT = line.t;
    if (isGpsMark(line)) {
      if (line.mark === 'start' && state === 'empty') {
        startT = line.t;
        state = 'recording';
        stretch = [];
        stretches.push(stretch);
        stepsPrev = 0;
      } else if (line.mark === 'pause' && state === 'recording') {
        pausedAt = line.t;
        state = 'paused';
        kept = null;
        stretch = null;
        stepsPrev = null;
        mark = null;
        dir = 0;
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
    if (isGpsSteps(line)) {
      if (state !== 'recording') continue;
      if (stepsPrev !== null && line.steps >= stepsPrev) steps = (steps ?? 0) + line.steps - stepsPrev;
      else steps ??= 0;
      stepsPrev = line.steps;
      continue;
    }
    if (isGpsBaro(line)) {
      if (startT === null) continue;
      baro.push(line);
      if (state !== 'recording') continue;
      climbM ??= 0;
      descentM ??= 0;
      if (mark === null) mark = line.ralt;
      else if (line.ralt > mark && (dir === 1 || line.ralt - mark >= CLIMB_BAND_M)) {
        climbM += line.ralt - mark;
        mark = line.ralt;
        dir = 1;
      } else if (line.ralt < mark && (dir === -1 || mark - line.ralt >= CLIMB_BAND_M)) {
        descentM += mark - line.ralt;
        mark = line.ralt;
        dir = -1;
      }
      continue;
    }
    lastFix = line;
    if (state !== 'recording' || startT === null || !isValidFix(line)) continue;
    stretch?.push(line);
    if (line.ha > MAX_ACCURACY_M) continue;
    const clock = line.t - startT - pausedMs;
    if (kept) {
      const d = gpsDistanceM(kept, line);
      if (d < MIN_STEP_M) continue;
      while (distanceM + d >= (splitTimes.length + 1) * METRES_PER_MILE) {
        const target = (splitTimes.length + 1) * METRES_PER_MILE;
        const at = keptClock + ((target - distanceM) / d) * (clock - keptClock);
        splitTimes.push({ mile: splitTimes.length + 1, seconds: (at - lastSplitClock) / 1000 });
        splitWalls.push(startT + pausedMs + at);
        lastSplitClock = at;
      }
      distanceM += d;
    }
    kept = line;
    keptClock = clock;
  }

  const splits: GpsSplit[] = splitTimes.map((s, i) => {
    const from = altitudeAt(baro, i === 0 ? (startT ?? 0) : (splitWalls[i - 1] ?? 0));
    const to = altitudeAt(baro, splitWalls[i] ?? 0);
    return { ...s, climbM: from === null || to === null ? null : to - from };
  });
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
    steps,
    cadenceSpm: steps === null || movingMs <= 0 ? null : steps / (movingMs / 60000),
    climbM,
    descentM,
  };
}

/** Seconds per mile for a distance and a time, or null when no distance has been covered. */
export function pacePerMile(metres: number, seconds: number): number | null {
  return metres > 0 ? seconds / (metres / METRES_PER_MILE) : null;
}
