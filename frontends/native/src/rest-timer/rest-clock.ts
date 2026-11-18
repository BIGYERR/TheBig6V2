// The rest timer's clock in the Expo app (MIGRATION.md phase 3, row 3): the Angular RestTimer component's stopwatch
// half (rest-timer.ts start, pause, reset, resetIfIdle and its buttons), over today's own model (rest-timer-model.ts, a
// copy held equal by a test). It writes no key: the time lives in memory, and a launch starts at 0:00, as today's does.
//
// The Live Activity is phase 4's. Until then nothing is told to it, and the clock is the wall clock, as on today's iOS
// app, where the Live Activity is there to share it (V239 D233): a rest keeps counting while the phone is locked.
import { type Island, Stopwatch, stopwatchClock, syncIsland } from './rest-timer-model';

/** The Live Activity until phase 4 builds it: told nothing, and its presence makes the clock the wall clock. */
export const NO_ISLAND: Island = { run() {}, stop() {}, end() {} };

export class RestClock {
  readonly watch: Stopwatch;
  private readonly island: Island | undefined;
  private heard: (() => void)[] = [];

  constructor(island: Island | undefined, perf: { now(): number }, wall: () => number) {
    this.island = island;
    this.watch = new Stopwatch(stopwatchClock(island, perf, wall));
  }

  /** The screen hears every change, to draw the readout and its button again. */
  listen(fn: () => void): () => void {
    this.heard.push(fn);
    return () => { this.heard = this.heard.filter((f) => f !== fn); };
  }
  private changed(): void {
    this.heard.forEach((fn) => fn());
    syncIsland(this.island, this.watch);
  }

  start(): void {
    if (this.watch.running) return;
    this.watch.begin();
    this.changed();
  }
  pause(): void {
    this.watch.pause();
    this.changed();
  }
  /** Start, or Stop. */
  toggle(): void {
    if (this.watch.running) this.pause(); else this.start();
  }
  /** Reset, and a day closed by Done, Skip or Mark the day done (V221 D179): stopped at zero. */
  reset(): void {
    this.pause();
    this.watch.reset();
    this.changed();
  }
  /** A day's sheet opening: a stopped clock goes to zero, a running one keeps running. */
  resetIfIdle(): void {
    if (this.watch.resetIfIdle()) this.changed();
  }
}
