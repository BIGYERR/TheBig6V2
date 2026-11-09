// This Week's week title strip (src/app/screens/week-view/week-strip.ts): D279 P-WEEKSNAP (docs/decisions/this-week.md).
// On the phone WebKit can draw This Week before the app's stylesheet applies; the one write the strip got then clamped to
// 0 and the strip showed Week 1 with the week in view out of sight. The stand-in strip below clamps as WebKit does (to
// 0 while it is not a scroller), and a hand-driven clock runs the frames and timers. Every number is typed from the
// ruling: HALF_MANNY on Sunday Nov 8, 2026 has 15 titles (14 weeks and Race Day) on a 402 px strip, so the strip is
// 15 x 240 + 150 = 3,750 px inside and ends at 3,750 - 402 = 3,348; Week 11 sits at (11 - 1) x 240 = 2,400 and the
// glide peaks 16 px past it at 2,416.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  GLIDE, READY_MS, type StripClock, type StripEl, StripPlacer, glideLeft, glideLit, glidePeak, stripReady, stripTarget,
} from '../../src/app/screens/week-view/week-strip.ts';

/** A strip as WebKit keeps it: a write clamps to [0, end], and an unstyled strip is no scroller (its end is 0). */
class Strip implements StripEl {
  clientWidth: number;
  scrollWidth: number;
  readonly style = { scrollSnapType: '' };
  /** Every position the strip was moved to, in order. */
  readonly writes: number[] = [];
  /** Writes the strip drops (a scroller that does not hold its first position yet). */
  refuse = 0;
  private left = 0;
  constructor(clientWidth: number, scrollWidth: number) {
    this.clientWidth = clientWidth;
    this.scrollWidth = scrollWidth;
  }
  get scrollLeft(): number {
    return this.left;
  }
  set scrollLeft(v: number) {
    this.writes.push(v);
    if (this.refuse > 0) {
      this.refuse--;
      return;
    }
    this.left = Math.max(0, Math.min(Math.max(0, this.scrollWidth - this.clientWidth), v));
  }
  /** The stylesheet lands: the strip becomes a scroller, keeping its position (0 after a clamped write). */
  styled(): void {
    this.clientWidth = 402;
    this.scrollWidth = 3750;
  }
}
const unstyled = (): Strip => new Strip(386, 386);
const styled = (): Strip => new Strip(402, 3750);

/** Frames and timers the test runs by hand. */
class Clock implements StripClock {
  t = 0;
  private id = 0;
  private frames = new Map<number, (ts: number) => void>();
  private timers = new Map<number, { at: number; fn: () => void }>();
  frame(fn: (ts: number) => void): number {
    this.frames.set(++this.id, fn);
    return this.id;
  }
  cancelFrame(id: number): void {
    this.frames.delete(id);
  }
  after(ms: number, fn: () => void): number {
    this.timers.set(++this.id, { at: this.t + ms, fn });
    return this.id;
  }
  cancelAfter(id: number): void {
    this.timers.delete(id);
  }
  now(): number {
    return this.t;
  }
  get pending(): number {
    return this.frames.size + this.timers.size;
  }
  /** Moves the time on by ms, running the timers that come due, then one frame at the new time. */
  tick(ms: number): void {
    this.t += ms;
    for (const [id, tm] of [...this.timers]) {
      if (tm.at <= this.t) {
        this.timers.delete(id);
        tm.fn();
      }
    }
    const due = [...this.frames];
    this.frames.clear();
    for (const [, fn] of due) fn(this.t);
  }
}

function setup(): { clock: Clock; lit: (number | null)[]; placer: StripPlacer } {
  const clock = new Clock();
  const lit: (number | null)[] = [];
  return { clock, lit, placer: new StripPlacer(clock, (n) => lit.push(n)) };
}

describe('The week strip (D279)', () => {
  it('glides on the ruling\'s curve: 151, 1,208, the 2,416 peak, 2,408, then 2,400, lighting Week 2, 6 and 11', () => {
    assert.deepEqual(GLIDE, { waitMs: 300, travelMs: 1200, overPx: 16, overFrac: 0.05, split: 0.76 });
    const peak = glidePeak(2400, 3348);
    assert.equal(peak, 2416);
    const at = (p: number) => Math.round(glideLeft(p, 2400, peak) * 1000) / 1000;
    assert.equal(at(0), 0);
    assert.equal(at(0.19), 151);
    assert.equal(at(0.38), 1208);
    assert.equal(at(0.76), 2416);
    assert.equal(at(0.88), 2408);
    assert.equal(at(1), 2400);
    assert.deepEqual([0, 151, 1208, 2416, 2408, 2400].map((l) => glideLit(l, 11)), [1, 2, 6, 11, 11, 11]);
  });

  it('stops at the strip\'s end: Race Day sits at 3,348 with no overshoot, Week 2 peaks at 252', () => {
    assert.equal(stripTarget(15, 3348), 3348);
    assert.equal(glidePeak(3348, 3348), 3348);
    assert.equal(stripTarget(2, 3348), 240);
    assert.equal(glidePeak(240, 3348), 252);
    assert.equal(stripTarget(1, 3348), 0);
  });

  it('counts a strip as ready only once it scrolls: a width, and more inside than its box', () => {
    assert.equal(stripReady({ clientWidth: 386, scrollWidth: 386 }), false);
    assert.equal(stripReady({ clientWidth: 0, scrollWidth: 0 }), false);
    assert.equal(stripReady({ clientWidth: 402, scrollWidth: 3750 }), true);
  });

  it('places Week 11 once the stylesheet lands, where one early write was clamped to Week 1', () => {
    const { clock, placer } = setup();
    const el = unstyled();
    placer.place(el, 11, true);
    assert.equal(el.scrollLeft, 0);
    assert.deepEqual(el.writes, [], 'nothing is written into a strip that cannot scroll');
    clock.tick(16);
    clock.tick(16);
    assert.equal(el.scrollLeft, 0);
    el.styled();
    clock.tick(16);
    assert.equal(el.scrollLeft, 2400);
    assert.equal(clock.pending, 0, 'placed, nothing more to try');
  });

  it('tries again when a write does not hold', () => {
    const { clock, placer } = setup();
    const el = styled();
    el.refuse = 1;
    placer.place(el, 11, true);
    assert.equal(el.scrollLeft, 0);
    clock.tick(16);
    assert.equal(el.scrollLeft, 2400);
    assert.equal(clock.pending, 0);
  });

  it('gives up after 10 seconds on a strip that never scrolls', () => {
    const { clock, placer } = setup();
    const el = unstyled();
    placer.place(el, 11, true);
    for (let ms = 0; ms < READY_MS; ms += 100) clock.tick(100);
    assert.equal(READY_MS, 10_000);
    assert.equal(clock.pending, 0);
    el.styled();
    clock.tick(16);
    assert.equal(el.scrollLeft, 0, 'no frame is left to place it');
  });

  it('glides the first time: Week 1 for 300 ms, through Week 2 and 6, out to 2,416, back onto Week 11', () => {
    const { clock, lit, placer } = setup();
    const el = styled();
    placer.place(el, 11, false);
    assert.equal(el.scrollLeft, 0);
    assert.equal(el.style.scrollSnapType, 'none', 'no snapping while it glides');
    assert.equal(placer.busy, true);
    assert.deepEqual(lit, [1]);
    clock.tick(299);
    assert.equal(el.scrollLeft, 0, 'still waiting');
    clock.tick(1); // the wait ends and the first frame of the travel runs (its time is the travel's 0)
    assert.equal(el.scrollLeft, 0);
    clock.tick(228);
    assert.equal(Math.round(el.scrollLeft), 151);
    assert.deepEqual(lit, [1, 2]);
    clock.tick(228);
    assert.equal(Math.round(el.scrollLeft), 1208);
    assert.equal(lit.at(-1), 6);
    clock.tick(456);
    assert.equal(Math.round(el.scrollLeft), 2416);
    assert.equal(lit.at(-1), 11);
    clock.tick(144);
    assert.equal(Math.round(el.scrollLeft), 2408);
    clock.tick(144);
    assert.equal(el.scrollLeft, 2400);
    assert.equal(lit.at(-1), null, 'the title in view is lit by the screen again');
    assert.equal(el.style.scrollSnapType, '');
    assert.equal(placer.busy, false);
    assert.equal(clock.pending, 0);
    assert.ok(lit.slice(0, -1).every((n, i, a) => n !== null && (i === 0 || n > a[i - 1]!) && n <= 11), 'counts up, never past Week 11');
  });

  it('places every later time at once', () => {
    const { clock, placer } = setup();
    const el = styled();
    placer.place(el, 11, false);
    for (let i = 0; i < 20; i++) clock.tick(100);
    placer.place(el, 5, false);
    assert.equal(el.scrollLeft, 960);
    assert.equal(placer.busy, false);
    assert.equal(clock.pending, 0);
  });

  it('does not glide when asked for reduced motion, or from Week 1, and a later week is then placed at once', () => {
    const calm = setup();
    const a = styled();
    calm.placer.place(a, 11, true);
    assert.equal(a.scrollLeft, 2400);
    assert.deepEqual(calm.lit, []);
    const week1 = setup();
    const b = styled();
    week1.placer.place(b, 1, false);
    assert.equal(b.scrollLeft, 0);
    assert.equal(week1.placer.busy, false);
    week1.placer.place(b, 11, false);
    assert.equal(b.scrollLeft, 2400, 'the launch\'s one glide was spent on Week 1');
    assert.equal(week1.placer.busy, false);
  });

  it('lands on Week 11 at once when the strip is touched mid-glide, and moves it no more', () => {
    const { clock, lit, placer } = setup();
    const el = styled();
    placer.place(el, 11, false);
    clock.tick(300);
    clock.tick(456);
    assert.equal(Math.round(el.scrollLeft), 1208);
    placer.stop();
    assert.equal(el.scrollLeft, 2400);
    assert.equal(lit.at(-1), null);
    assert.equal(el.style.scrollSnapType, '');
    assert.equal(placer.busy, false);
    assert.equal(clock.pending, 0);
  });

  it('a touch before the stylesheet lands leaves the placement waiting', () => {
    const { clock, placer } = setup();
    const el = unstyled();
    placer.place(el, 11, true);
    placer.stop();
    el.styled();
    clock.tick(16);
    assert.equal(el.scrollLeft, 2400);
  });

  it('This Week places through the placer, lights the glide\'s title, and lets no glide scroll pick a week', () => {
    const src = readFileSync(new URL('../../src/app/screens/week-view/week-view.ts', import.meta.url), 'utf8');
    assert.match(src, /if \(el\) this\.placer\.place\(el, this\.shown\(\), this\.calm\);/);
    assert.doesNotMatch(src, /this\.scrollTo\(this\.shown\(\), false\)/);
    assert.match(src, /if \(this\.drag \|\| this\.placer\.busy\) return;/);
    assert.match(src, /protected dragDown\(e: PointerEvent\): void \{\s*\/\/[^\n]*\n\s*this\.placer\.stop\(\);/);
    assert.match(src, /\[class\]="'tw-title' \+ \(isOn\(t\) \? ' on' : ''\)"/);
    assert.match(src, /\[attr\.aria-current\]="t\.active \? 'true' : null"/);
    const css = readFileSync(new URL('../../src/app/screens/week-view/week-view.css', import.meta.url), 'utf8');
    assert.match(css, /\.tw-strip\.gliding \.tw-title\{transition:none;\}/);
  });
});
