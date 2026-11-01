/**
 * The Run recorder (D267 P-GPSTEST, docs/decisions/gps-recording.md): what the test screen shows for a run, from the raw
 * lines the ia-gps plugin writes. The math lives in core/src/gps, the one copy the tests, the comparison and later the
 * run card read; this file only turns a run into the screen's words, which is all the component draws.
 */
import {
  formatClock,
  formatMiles,
  formatPace,
  gpsSummary,
  pacePerMile,
  parseRecording,
  recordingGpx,
  type GpsFix,
  type GpsLine,
  type GpsSummary,
} from '../../../../../../core/src/gps/index.ts';

export { parseRecording, type GpsFix, type GpsLine };

/** window.iaGps, the native recorder (absent in a browser). */
export interface GpsBridge {
  listen(onEvent: (e: GpsEvent) => void): void;
  warm(): void;
  cool(): void;
  start(): void;
  pause(): void;
  resume(): void;
  finish(done: (id: string) => void, fail?: (message: string) => void): void;
  status(done: (s: { recording: boolean; paused: boolean; id: string | null }) => void): void;
  list(done: (runs: { id: string; bytes: number }[]) => void): void;
  read(id: string, done: (text: string) => void, fail?: (message: string) => void): void;
  remove(id: string, done: () => void, fail?: (message: string) => void): void;
}

export type GpsAuth = 'unasked' | 'granted' | 'denied';
export type GpsEvent =
  | { type: 'auth'; status: GpsAuth }
  | { type: 'fix'; fix: GpsFix; recorded: boolean }
  | { type: 'mark'; line: GpsLine }
  | { type: 'error'; message: string };

/** The Bugs tab shows the Run recorder row only inside the iOS app, where the plugin is. */
export function recorderAvailable(win: { iaGps?: unknown }): boolean {
  return typeof win.iaGps === 'object' && win.iaGps !== null;
}

export const RECORDER_COPY = {
  row: 'Run recorder',
  rowNote: 'Test GPS against your watch. Runs stay on this phone.',
  waiting: 'Waiting for GPS.',
  denied: 'Location is off for The Asylum. Turn it on in Settings.',
  confirmDelete: 'Delete this run? It cannot come back.',
  shareFailed: 'That run could not be shared.',
} as const;

export type RecorderButton = 'start' | 'pause' | 'resume' | 'finish' | 'share' | 'delete';
export const BUTTON_LABEL: Record<RecorderButton, string> = {
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  finish: 'Finish',
  share: 'Share',
  delete: 'Delete',
};

export interface RecorderView {
  state: GpsSummary['state'];
  gps: string;
  time: string;
  distance: string;
  avgPace: string;
  milePace: string;
  splits: { mile: number; time: string }[];
  buttons: RecorderButton[];
}

const BUTTONS: Record<GpsSummary['state'], RecorderButton[]> = {
  empty: ['start'],
  recording: ['pause', 'finish'],
  paused: ['resume', 'finish'],
  finished: ['share', 'delete'],
};

/** The GPS line: the accuracy iOS reports for its last fix, whole metres. */
export function gpsLine(auth: GpsAuth, fix: GpsFix | null): string {
  if (auth === 'denied') return RECORDER_COPY.denied;
  if (!fix || !(fix.ha >= 0)) return RECORDER_COPY.waiting;
  return `GPS ±${Math.round(fix.ha)} m`;
}

export interface RecorderContext {
  auth: GpsAuth;
  /** The newest fix iOS delivered, recorded or not (before Start it is all the screen has). */
  lastFix: GpsFix | null;
  /** True for the run the plugin is recording now; its clock runs on `now` (ms since 1970). */
  live: boolean;
  now?: number;
}

/**
 * The screen for a run. A run that is not the live one is over, finish mark or not: iOS closing the app ends a run
 * without one, and it then reads as finished at its last line.
 */
export function recorderView(lines: readonly GpsLine[], ctx: RecorderContext): RecorderView {
  const run = gpsSummary(lines, ctx.live ? ctx.now : undefined);
  const state = !ctx.live && run.state !== 'empty' ? 'finished' : run.state;
  return {
    state,
    gps: gpsLine(ctx.auth, ctx.lastFix ?? run.lastFix),
    time: formatClock(run.elapsedS),
    distance: formatMiles(run.distanceM),
    avgPace: formatPace(pacePerMile(run.distanceM, run.movingS)),
    milePace: formatPace(pacePerMile(run.partM, run.partS)),
    splits: run.splits.map((s) => ({ mile: s.mile, time: formatClock(s.seconds) })),
    buttons: BUTTONS[state],
  };
}

/** A run's start time from its id (run-<ms since 1970>), or null for an id that is not one. */
export function runStart(id: string): number | null {
  const m = /^run-(\d+)$/.exec(id);
  return m ? Number(m[1]) : null;
}

/** How a run is named on the list and in its GPX: its local start in the phone's short form ("Nov 1 at 12:26 AM" on iOS 26). */
export function runLabel(id: string): string {
  const t = runStart(id);
  if (t === null) return id;
  return new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** The shared file's name, from the local start: asylum-run-2026-10-26-0730.gpx. */
export function gpxFileName(id: string): string {
  const t = runStart(id);
  if (t === null) return 'asylum-run.gpx';
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `asylum-run-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.gpx`;
}

export function runGpx(id: string, lines: readonly GpsLine[]): string {
  return recordingGpx(lines, runLabel(id));
}

/** One row of the past runs list after its label: "0.25 mi · 1:42". */
export function runListLine(lines: readonly GpsLine[]): string {
  const run = gpsSummary(lines);
  return `${formatMiles(run.distanceM)} mi · ${formatClock(run.elapsedS)}`;
}
