// The Run recorder's calls into the GPS module (MIGRATION.md phase 4), in today's shape: what
// frontends/app/plugins-src/ia-gps/www/gps.js is to the Cordova plugin, this is to the Swift module
// (modules/ia-gps/ios/IAGpsModule.swift). The screen is handed the same eleven calls and the same events as today's
// window.iaGps, so its rules are today's line for line (recorder-screen.ts).
//   listen(onEvent)          the one event channel: {type:'auth', status}, {type:'fix', fix, recorded},
//                            {type:'mark', line}, {type:'motion', line}, {type:'error', message}
//   warm() / cool()          location on before Start, off again
//   start() pause() resume() the run's marks; Start waits for permission when it is not yet given
//   finish(done)             done(id) once the file is closed
//   status(done)             done({recording, paused, id})
//   list(done)               done([{id, bytes}]), newest first
//   read(id, done, fail)     done(text), the run's raw lines
//   remove(id, done, fail)   deletes a run that is not recording
//   quiet()                  this app's own: the channel closed, as the screen goes
// Native writes every fix to the run's file itself; the events only draw the screen, and the screen reads the file
// back whenever the app returns to the front. A call that can fail answers {ok, …} with `why` in today's words.
import type { GpsBridge, GpsEvent } from './run-recorder-model';

interface Answer { ok: boolean; why?: string }

/** What the Swift module answers. */
export interface NativeGps {
  addListener(name: 'onGps', on: (e: GpsEvent) => void): { remove(): void };
  listen(): Promise<void>;
  warm(): Promise<void>;
  cool(): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  finish(): Promise<Answer & { id?: string }>;
  status(): Promise<{ recording: boolean; paused: boolean; id: string | null }>;
  list(): Promise<{ id: string; bytes: number }[]>;
  read(id: string): Promise<Answer & { text?: string }>;
  remove(id: string): Promise<Answer>;
}

/** Today's window.iaGps, and the one call this app adds. */
export interface AppGps extends GpsBridge { quiet(): void }

const none = (): void => { /* a call with nothing to hand back */ };

/** Today's eleven calls over the Swift module. One channel at a time: a new listen takes the place of the last. */
export function gpsOver(native: NativeGps): AppGps {
  let channel: { remove(): void } | null = null;
  const quiet = (): void => {
    if (channel) channel.remove();
    channel = null;
  };
  const tell = (fail: ((message: string) => void) | undefined) => (e: unknown): void => { if (fail) fail(String(e)); };
  return {
    listen(onEvent) {
      quiet();
      channel = native.addListener('onGps', onEvent);
      native.listen().catch(none);
    },
    quiet,
    warm() { native.warm().catch(none); },
    cool() { native.cool().catch(none); },
    start() { native.start().catch(none); },
    pause() { native.pause().catch(none); },
    resume() { native.resume().catch(none); },
    finish(done, fail) {
      native.finish().then((a) => {
        if (a.ok && typeof a.id === 'string') done(a.id);
        else if (fail) fail(a.why || '');
      }, tell(fail));
    },
    status(done) {
      native.status().then((s) => done({ recording: !!s.recording, paused: !!s.paused, id: typeof s.id === 'string' ? s.id : null }), none);
    },
    list(done) {
      native.list().then((runs) => done(runs), none);
    },
    read(id, done, fail) {
      native.read(id).then((a) => {
        if (a.ok && typeof a.text === 'string') done(a.text);
        else if (fail) fail(a.why || '');
      }, tell(fail));
    },
    remove(id, done, fail) {
      native.remove(id).then((a) => {
        if (a.ok) done();
        else if (fail) fail(a.why || '');
      }, tell(fail));
    },
  };
}
