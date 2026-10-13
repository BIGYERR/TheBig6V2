// The rest timer's logic, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase
// E, step 2: the floating rest timer moves from the legacy script's rest-timer.ts to the RestTimer component). Each rule
// is the legacy script's: a stopwatch on the wall clock in the native app (so the iOS Live Activity reads the same
// start) and on performance.now() in a browser, the m:ss readout and its hundredths, the side the tab docks to, and
// what the Live Activity is told.

/** The iOS Live Activity the native app's ia-island plugin exposes as window.iaIsland (absent in a browser). */
export interface Island {
  run(startMs: number): void;
  stop(elapsedMs: number): void;
  end(): void;
}

/** A stopwatch: running from `start` on its clock, or stopped holding `elapsed` milliseconds. */
export class Stopwatch {
  running = false;
  elapsed = 0;
  start = 0;
  private readonly clock: () => number;
  constructor(clock: () => number) {
    this.clock = clock;
  }

  /** Milliseconds on the watch now. */
  now(): number {
    return this.running ? this.clock() - this.start : this.elapsed;
  }
  /** Starts it from what it holds; a running watch is left alone. */
  begin(): void {
    if (this.running) return;
    this.running = true;
    this.start = this.clock() - this.elapsed;
  }
  /** Stops it, holding the time so far. */
  pause(): void {
    if (this.running) this.elapsed = this.clock() - this.start;
    this.running = false;
  }
  /** Stops it at zero. */
  reset(): void {
    this.pause();
    this.elapsed = 0;
  }
  /** Zeroes a stopped watch; a running one keeps running (moving between days and tabs is navigation). */
  resetIfIdle(): boolean {
    if (this.running) return false;
    this.elapsed = 0;
    return true;
  }
}

/** The clock the legacy script read: the wall clock when the Live Activity is there to share it, else performance.now(). */
export function stopwatchClock(island: Island | undefined, perf: { now(): number }, wall: () => number): () => number {
  return () => (island ? wall() : perf.now());
}

/** What the Live Activity is told: the start while running, the time held while stopped, nothing at zero. */
export function syncIsland(island: Island | undefined, watch: Stopwatch): void {
  if (!island) return;
  try {
    if (watch.running) island.run(watch.start);
    else if (watch.elapsed > 0) island.stop(watch.elapsed);
    else island.end();
  } catch {
    // The plugin failing never stops the timer, as before.
  }
}

/** The readout: m:ss, and the hundredths as '.cs'. A negative time reads as zero. */
export function clockFace(ms: number): { main: string; cs: string } {
  if (ms < 0) ms = 0;
  const cs = Math.floor(ms / 10) % 100;
  const ts = Math.floor(ms / 1000);
  const m = Math.floor(ts / 60);
  const s = ts % 60;
  return { main: m + ':' + pad(s), cs: '.' + pad(cs) };
}
function pad(n: number): string {
  return (n < 10 ? '0' : '') + n;
}

/** The edge the timer docks to. */
export type RtSide = 'left' | 'right';

/** The inline styles the legacy script wrote for each side, element by element. */
export function sideStyles(side: RtSide): {
  anchor: { left: string; right: string };
  tab: { borderRadius: string; borderLeft: string; borderRight: string };
  card: { borderRadius: string; borderLeft: string; borderRight: string };
  chevron: string;
  nub: { left: string; right: string };
} {
  return side === 'right'
    ? {
        anchor: { right: '0', left: 'auto' },
        tab: { borderRadius: '14px 0 0 14px', borderRight: 'none', borderLeft: '1.5px solid var(--signal)' },
        card: { borderRadius: '12px 0 0 12px', borderRight: 'none', borderLeft: '2px solid var(--signal)' },
        chevron: '‹',
        nub: { left: '18px', right: 'auto' },
      }
    : {
        anchor: { left: '0', right: 'auto' },
        tab: { borderRadius: '0 14px 14px 0', borderLeft: 'none', borderRight: '1.5px solid var(--signal)' },
        card: { borderRadius: '0 12px 12px 0', borderLeft: 'none', borderRight: '2px solid var(--signal)' },
        chevron: '›',
        nub: { right: '18px', left: 'auto' },
      };
}

/** The side a drag lets go on: the half of the frame the timer's centre is in. */
export function snapSide(anchorLeft: number, anchorWidth: number, frameWidth: number): RtSide {
  return anchorLeft + anchorWidth / 2 < frameWidth / 2 ? 'left' : 'right';
}

/** How far a pointer must move before a press becomes a drag, in pixels either way. */
export const DRAG_THRESHOLD = 5;

/** Where a drag puts the timer: its top kept 8 px inside the window, its left inside the frame, centred on the pointer. */
export function dragPosition(
  p: { startTop: number; dy: number; clientX: number },
  box: { innerHeight: number; anchorHeight: number; anchorWidth: number; frameLeft: number; frameWidth: number },
): { top: number; left: number } {
  const maxT = box.innerHeight - box.anchorHeight - 8;
  return {
    top: Math.max(8, Math.min(maxT, p.startTop + p.dy)),
    left: Math.max(0, Math.min(box.frameWidth - box.anchorWidth, p.clientX - box.frameLeft - box.anchorWidth / 2)),
  };
}

/** Whether the timer shows: with a program, on the week, Progress or Bugs. */
export function showsOn(hasProgram: boolean, screen: string | null | undefined): boolean {
  return hasProgram && (screen === 'screenWeek' || screen === 'screenProgress' || screen === 'screenBugs');
}
