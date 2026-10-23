// The rest timer's logic (src/app/screens/rest-timer/rest-timer-model.ts, architecture phase E step 2), against the
// legacy rest-timer.ts it replaces. Expected values are typed here from the legacy code's arithmetic, never asked of the
// model: the stopwatch on a clock the test drives, the m:ss readout, the docking styles, the drag box and the Live
// Activity calls.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clockFace, DRAG_THRESHOLD, dragPosition, showsOn, sideStyles, snapSide, Stopwatch, stopwatchClock, syncIsland, type Island,
} from '../../src/app/screens/rest-timer/rest-timer-model.ts';

describe('the rest timer', () => {
  it('runs a stopwatch on its clock: start, hold on pause, resume from what it holds, zero on reset', () => {
    let t = 1000;
    const w = new Stopwatch(() => t);
    assert.equal(w.now(), 0);
    w.begin();
    t = 4500;
    assert.equal(w.now(), 3500);
    w.begin();
    assert.equal(w.start, 1000, 'starting a running watch leaves it alone');
    w.pause();
    t = 9000;
    assert.deepEqual([w.running, w.now()], [false, 3500]);
    w.begin();
    t = 10000;
    assert.equal(w.now(), 4500, 'resumes from the 3.5 s it held');
    w.reset();
    assert.deepEqual([w.running, w.elapsed, w.now()], [false, 0, 0]);
  });

  it('zeroes only a stopped watch when a day opens', () => {
    let t = 0;
    const w = new Stopwatch(() => t);
    w.begin();
    t = 2000;
    assert.equal(w.resetIfIdle(), false);
    assert.equal(w.now(), 2000, 'a running watch keeps running');
    w.pause();
    assert.equal(w.resetIfIdle(), true);
    assert.equal(w.now(), 0);
  });

  it('keeps time on the wall clock with the Live Activity, on performance.now() without it', () => {
    const island: Island = { run: () => undefined, stop: () => undefined, end: () => undefined };
    assert.equal(stopwatchClock(island, { now: () => 5 }, () => 1_700_000_000_000)(), 1_700_000_000_000);
    assert.equal(stopwatchClock(undefined, { now: () => 5 }, () => 1_700_000_000_000)(), 5);
  });

  it('tells the Live Activity the start while running, the time held while stopped, and ends it at zero', () => {
    const calls: string[] = [];
    const island: Island = { run: (s) => calls.push('run ' + s), stop: (e) => calls.push('stop ' + e), end: () => calls.push('end') };
    let t = 100;
    const w = new Stopwatch(() => t);
    syncIsland(island, w);
    w.begin();
    syncIsland(island, w);
    t = 1600;
    w.pause();
    syncIsland(island, w);
    syncIsland(undefined, w);
    syncIsland({ run() { throw new Error('plugin'); }, stop() { throw new Error('plugin'); }, end: () => undefined }, w);
    assert.deepEqual(calls, ['end', 'run 100', 'stop 1500']);
  });

  it('reads m:ss and the hundredths, rounding down, and zero for a negative time', () => {
    assert.deepEqual(clockFace(0), { main: '0:00', cs: '.00' });
    assert.deepEqual(clockFace(65_437), { main: '1:05', cs: '.43' });
    assert.deepEqual(clockFace(599_999), { main: '9:59', cs: '.99' });
    assert.deepEqual(clockFace(3_600_000), { main: '60:00', cs: '.00' });
    assert.deepEqual(clockFace(-20), { main: '0:00', cs: '.00' });
  });

  it('docks to a side with the legacy styles, the chevron pointing in', () => {
    assert.deepEqual(sideStyles('right'), {
      anchor: { right: '0', left: 'auto' },
      tab: { borderRadius: '14px 0 0 14px', borderRight: 'none', borderLeft: '1.5px solid var(--signal)' },
      card: { borderRadius: '12px 0 0 12px', borderRight: 'none', borderLeft: '2px solid var(--signal)' },
      chevron: '‹',
      nub: { left: '18px', right: 'auto' },
    });
    assert.deepEqual(sideStyles('left'), {
      anchor: { left: '0', right: 'auto' },
      tab: { borderRadius: '0 14px 14px 0', borderLeft: 'none', borderRight: '1.5px solid var(--signal)' },
      card: { borderRadius: '0 12px 12px 0', borderLeft: 'none', borderRight: '2px solid var(--signal)' },
      chevron: '›',
      nub: { right: '18px', left: 'auto' },
    });
  });

  it('drags inside the window and the frame, and docks to the half its centre is in', () => {
    const box = { innerHeight: 852, anchorHeight: 44, anchorWidth: 60, frameLeft: 0, frameWidth: 393 };
    assert.deepEqual(dragPosition({ startTop: 300, dy: 50, clientX: 200 }, box), { top: 350, left: 170 });
    assert.deepEqual(dragPosition({ startTop: 300, dy: -400, clientX: -50 }, box), { top: 8, left: 0 }, 'top 8, left 0 at the most');
    assert.deepEqual(dragPosition({ startTop: 300, dy: 900, clientX: 900 }, box), { top: 800, left: 333 }, 'bottom 8 px above the window, right inside the frame');
    assert.equal(snapSide(100, 60, 393), 'left');
    assert.equal(snapSide(200, 60, 393), 'right');
    assert.equal(DRAG_THRESHOLD, 5);
  });

  it('shows with a program on the week, Progress and Bugs only', () => {
    for (const s of ['screenWeek', 'screenProgress', 'screenBugs']) assert.equal(showsOn(true, s), true, s);
    for (const s of ['screenHome', 'screenWizard', 'screenGenerate', null]) assert.equal(showsOn(true, s), false, String(s));
    assert.equal(showsOn(false, 'screenWeek'), false);
  });
});
