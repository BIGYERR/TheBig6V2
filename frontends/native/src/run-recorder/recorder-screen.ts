// The Run recorder's rules (MIGRATION.md phase 4), as today's screen holds them
// (frontends/app/src/app/screens/run-recorder/run-recorder.ts, method for method): what an event from the module
// does, what the screen reads back when it opens or the app returns to the front, what each button does, where Back
// goes. The words are run-recorder-model.ts, today's file. RunRecorder.tsx draws and nothing else.
// The module writes every fix to the run's file itself, so the screen can close, the phone can lock and the app can
// sleep without losing a second. On its return the screen reads the file back.
import type { CardioCardView } from '../day-detail/cardio-card-model';
import {
  RECORDER_COPY,
  type GpsAuth,
  type GpsBridge,
  type GpsEvent,
  type GpsFix,
  type GpsLine,
  type RecorderButton,
  type RecorderView,
  gpxFileName,
  parseRecording,
  recorderView,
  runGpx,
  runLabel,
  runListLine,
} from './run-recorder-model';

/** The share sheet for one file the screen made: done once the sheet closes, fail when it could not be written or shared. */
export type Share = (fileName: string, text: string, done: () => void, fail: () => void) => void;

/** One row of Past runs: the run's start, then its miles and time. */
export interface PastRun { id: string; label: string; line: string }

/** What the screen holds between draws (today's signals). */
export interface RecorderState {
  lines: GpsLine[];
  runId: string | null;
  live: boolean;
  auth: GpsAuth;
  lastFix: GpsFix | null;
  past: PastRun[];
  message: string;
}
export const newRecorderState = (): RecorderState => ({ lines: [], runId: null, live: false, auth: 'unasked', lastFix: null, past: [], message: '' });

/** Opened from a day's run card (D272, D276): its when line and the run's name, in place of the test bench's. */
export interface RecorderHeading { over: string; title: string }

/**
 * The run a run card records (today's RecordFrom, record-host.ts): its day, the words over the recorder, the run's
 * workout drawn above the clock (D278 item 2), and the way to the run's own hand log, which Ran without the phone?
 * takes once the recorder has closed (today's RecordState.openDay).
 */
export interface RecordFrom { week: number; key: string; over: string; title: string; workout: CardioCardView | null; handLog: () => void }

export interface RecorderDeps {
  gps: GpsBridge | null;
  share: Share | null;
  /** Today's confirm(): the system's own question, `yes` when the athlete agrees. */
  ask: (text: string, yes: () => void) => void;
  /** The state changed: draw it. */
  draw: () => void;
  /** Back from the start or from a live run: the screen closes. */
  closed: () => void;
}

/**
 * A run's start as the screen draws it. iOS writes the time with a narrow space that does not break before AM or PM
 * (U+202F). WebKit draws that space; React Native's text draws nothing for it ("12:35PM", seen on the simulator), so
 * the screen draws a plain space there. The label itself (run-recorder-model.ts runLabel, which also names the GPX)
 * is left as iOS wrote it.
 */
export function drawnLabel(label: string): string {
  return label.split(String.fromCharCode(0x202f)).join(' ');
}

/** The screen's words for what it holds now (today's `view`). */
export function recorderDrawn(st: RecorderState, now: number): RecorderView {
  return recorderView(st.lines, { auth: st.auth, lastFix: st.lastFix, live: st.live, now });
}

/** The line over the title: a finished run's start, the day's when line from a run card, or the test bench's note. */
export function recorderOver(st: RecorderState, heading: RecorderHeading | null): string {
  return st.runId && !st.live ? drawnLabel(runLabel(st.runId)) : heading ? heading.over : RECORDER_COPY.rowNote;
}

/** The title: the run's name from a run card, or the test bench's. */
export function recorderTitle(heading: RecorderHeading | null): string {
  return (heading && heading.title) || RECORDER_COPY.row;
}

/** Ran without the phone? (D272's open item): from a run card only, before Start. */
export function offersHandLog(st: RecorderState, heading: RecorderHeading | null): boolean {
  return !!heading && !st.live && !st.runId;
}

/** The screen as it is made (today's constructor): the channel, location on, and what the module holds. */
export function recorderOpened(st: RecorderState, d: RecorderDeps): void {
  if (d.gps) d.gps.listen((e) => recorderEvent(st, d, e));
  if (d.gps) d.gps.warm();
  recorderResync(st, d);
}

/** The screen as it goes (today's ngOnDestroy): location off unless a run is recording, which keeps going. */
export function recorderGone(d: RecorderDeps): void {
  if (d.gps) d.gps.cool();
}

export function recorderEvent(st: RecorderState, d: RecorderDeps, e: GpsEvent): void {
  if (e.type === 'auth') st.auth = e.status;
  else if (e.type === 'fix') {
    st.lastFix = e.fix;
    if (e.recorded && st.live) st.lines = [...st.lines, e.fix];
  } else if (e.type === 'motion') {
    if (st.live) st.lines = [...st.lines, e.line];
  } else if (e.type === 'mark') {
    if ('mark' in e.line && e.line.mark === 'start') {
      st.live = true;
      st.lines = [e.line];
      if (d.gps) d.gps.status((s) => { st.runId = s.id; d.draw(); });
    } else if (st.live) st.lines = [...st.lines, e.line];
  } else st.message = e.message;
  d.draw();
}

/** What the module holds: the live run read back from its file, and the past runs. */
export function recorderResync(st: RecorderState, d: RecorderDeps): void {
  const gps = d.gps;
  if (!gps) return;
  gps.status((s) => {
    if (s.recording && s.id) {
      const id = s.id;
      st.live = true;
      st.runId = id;
      gps.read(id, (text) => { st.lines = parseRecording(text); d.draw(); });
    }
    refreshPast(st, d, s.id);
    d.draw();
  });
}

function refreshPast(st: RecorderState, d: RecorderDeps, liveId: string | null): void {
  const gps = d.gps;
  if (!gps) return;
  gps.list((runs) => {
    const ids = runs.map((r) => r.id).filter((id) => id !== liveId);
    const rows = new Map<string, string>();
    if (!ids.length) { st.past = []; d.draw(); }
    for (const id of ids) {
      gps.read(id, (text) => {
        rows.set(id, runListLine(parseRecording(text)));
        if (rows.size === ids.length) { st.past = ids.map((i) => ({ id: i, label: drawnLabel(runLabel(i)), line: rows.get(i) ?? '' })); d.draw(); }
      });
    }
  });
}

/** A row of Past runs tapped: that run on the screen, never while one is recording. */
export function recorderOpenRun(st: RecorderState, d: RecorderDeps, id: string): void {
  if (st.live) return;
  if (d.gps) d.gps.read(id, (text) => {
    st.message = '';
    st.runId = id;
    st.lines = parseRecording(text);
    d.draw();
  });
}

export function recorderPress(st: RecorderState, d: RecorderDeps, b: RecorderButton): void {
  const gps = d.gps;
  if (!gps) return;
  st.message = '';
  const id = st.runId;
  if (b === 'start') {
    st.runId = null;
    st.lines = [];
    gps.start();
  } else if (b === 'pause') gps.pause();
  else if (b === 'resume') gps.resume();
  else if (b === 'finish') {
    gps.finish(
      (done) => {
        st.live = false;
        st.runId = done;
        gps.read(done, (text) => { st.lines = parseRecording(text); d.draw(); });
        refreshPast(st, d, null);
        d.draw();
      },
      (why) => { st.message = why; d.draw(); },
    );
  } else if (b === 'share' && id) {
    const fail = (): void => { st.message = RECORDER_COPY.shareFailed; d.draw(); };
    if (d.share) d.share(gpxFileName(id), runGpx(id, st.lines), () => { st.message = ''; d.draw(); }, fail);
    else fail();
  } else if (b === 'delete' && id) {
    d.ask(RECORDER_COPY.confirmDelete, () => {
      gps.remove(
        id,
        () => {
          clear(st);
          refreshPast(st, d, null);
          d.draw();
        },
        (why) => { st.message = why; d.draw(); },
      );
    });
  }
  d.draw();
}

/** Back from a finished run goes to the start; back from the start, or from a live run, closes the screen. */
export function recorderBack(st: RecorderState, d: RecorderDeps): void {
  if (!st.live && st.runId) { clear(st); d.draw(); } else d.closed();
}

function clear(st: RecorderState): void {
  st.runId = null;
  st.lines = [];
  st.message = '';
}
