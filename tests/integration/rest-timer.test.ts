// The floating rest timer: dragging the tab and the card (_rtWireDrag, wired by _rtInit), and the rest stopwatch with
// its mirror on the iPhone island in the native app. Rulings: docs/decisions/rest-timer.md (D235: a tap never strands
// the timer, a cancelled drag docks to an edge); the handoff §11f and tests/measure/v239_rulings/v239_ruling_d233.md
// (D233 P-ISLAND: inside the native app the clock is the wall clock and the island is told every seam; on the PWA the
// clock is performance.now and nothing is called).
//
// Dragging. The app boots in the VM harness with a document that keeps its elements (tests/support/app.ts
// loadApp({dom:true})). The real _rtInit wires the real handlers onto stubs that keep every listener and run it; the
// test fires pointer events at them and reads every write to the anchor's style.
// Oracle: hand geometry, typed here and checked below, never the app's own handler. The frame (#restFloat) is 375 px
// wide at left 0, window.innerHeight is 852, the anchor (#rtAnchor) is 40 x 60 and sits at top 300 until a drag writes
// top. The anchor's offsetLeft follows its style as a browser lays it out: a px left reads as written, left '0' reads
// 0, right '0' reads 375 - 40 = 335.
//
// The stopwatch and the island. The rig in tests/support/rest-timer.ts boots the app with two fake clocks the test
// moves by hand, Date and performance.now, by different amounts at every step, so the clock the stopwatch follows is
// read off its value. A stub plugin (window.iaIsland) logs every run, stop and end. Oracle: hand values, typed below and
// checked: 92340 ms shows 1:32 and .34, 93340 ms shows 1:33, 0 shows 0:00; the start epoch is the rig's own wall clock
// at the tap (10:00 local on the day under test, by date arithmetic).
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { loadApp } from '../support/app.ts';
import { islandStub, loadWithIsland, stopwatchRig } from '../support/rest-timer.ts';

const FRAME_W = 375;
const INNER_H = 852;
const ANCHOR_W = 40;
const ANCHOR_H = 60;
const TOP0 = 300;
const SNAP_TRANSITION = 'left .18s cubic-bezier(.34,1.3,.5,1),right .18s cubic-bezier(.34,1.3,.5,1)';

// Drag A: the tab, docked right, pressed at (355, 330) and moved to (100, 340).
//   top  = clamp(8, 852 - 60 - 8 = 784, 300 + 10) = 310 px
//   left = clamp(0, 375 - 40 = 335, 100 - 0 - 40/2) = 80 px; centre 80 + 20 = 100 < 375 / 2, so it docks left.
// Drag B: the card, docked left after A, pressed at (20, 400) and moved to (300, 395).
//   top  = clamp(8, 784, 310 - 5) = 305 px
//   left = clamp(0, 335, 300 - 20) = 280 px; centre 280 + 20 = 300 >= 187.5, so it docks right.
const A = { top: '310px', left: '80px' };
const B = { top: '305px', left: '280px' };

test('the hand geometry is self-consistent', () => {
  const clamp = (lo: number, hi: number, v: number) => Math.max(lo, Math.min(hi, v));
  const maxTop = INNER_H - ANCHOR_H - 8;
  const maxLeft = FRAME_W - ANCHOR_W;
  assert.equal(maxTop, 784);
  assert.equal(maxLeft, 335);
  assert.equal(clamp(8, maxTop, TOP0 + (340 - 330)) + 'px', A.top);
  assert.equal(clamp(0, maxLeft, 100 - ANCHOR_W / 2) + 'px', A.left);
  assert.ok(80 + ANCHOR_W / 2 < FRAME_W / 2);
  assert.equal(clamp(8, maxTop, 310 + (395 - 400)) + 'px', B.top);
  assert.equal(clamp(0, maxLeft, 300 - ANCHOR_W / 2) + 'px', B.left);
  assert.ok(!(280 + ANCHOR_W / 2 < FRAME_W / 2));
});

// ── stubs ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const classList = () => ({ add() {}, remove() {}, toggle() {}, contains: () => false });

/** A pointer event as the drag handlers read it. */
interface PointerEvt {
  type: string;
  clientX: number;
  clientY: number;
  pointerId: number;
  cancelable: boolean;
  preventDefault(): void;
  target: { closest(): null };
  currentTarget: Handle;
}
type PointerListener = (this: Handle, e: PointerEvt) => void;

/** A drag handle (#rtTab or #rtCard) that keeps every listener so the test can run it. */
interface Handle {
  id: string;
  listeners: Record<string, PointerListener[]>;
  [other: string]: unknown;
}

/** A drag handle (#rtTab or #rtCard) that keeps every listener so the test can run it. */
function handle(id: string): Handle {
  const listeners: Record<string, PointerListener[]> = {};
  return {
    id, style: {}, dataset: {}, innerHTML: '', textContent: '', listeners, classList: classList(),
    addEventListener(type: string, fn: unknown) {
      if (typeof fn === 'function') (listeners[type] = listeners[type] || []).push(fn as PointerListener);
    },
    removeEventListener() {}, setPointerCapture() {}, releasePointerCapture() {},
    querySelector: () => null, closest: () => null,
  };
}

/** The anchor's style as written: top, left, right and transition. */
type AnchorStyle = Record<string, string | undefined>;

/** #rtAnchor: logs every style write, and lays out offsetTop and offsetLeft the way a browser would. */
function anchor() {
  const raw: AnchorStyle = {};
  const log: [string, string][] = [];
  const style = new Proxy(raw, {
    set(o, k, v) {
      log.push([String(k), String(v)]);
      o[k as string] = v;
      return true;
    },
  });
  return {
    id: 'rtAnchor', style, raw, log, offsetWidth: ANCHOR_W, offsetHeight: ANCHOR_H, classList: classList(),
    get offsetTop() {
      return /px$/.test(raw['top'] || '') ? parseFloat(raw['top'] as string) : TOP0;
    },
    get offsetLeft() {
      if (/px$/.test(raw['left'] || '')) return parseFloat(raw['left'] as string);
      if (raw['left'] === '0') return 0;
      return raw['right'] === '0' ? FRAME_W - ANCHOR_W : 0;
    },
    addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ top: 0, left: 0, width: ANCHOR_W, height: ANCHOR_H, right: ANCHOR_W, bottom: ANCHOR_H }),
  };
}

/** #restFloat: the 375 px frame at left 0. */
function frame() {
  return {
    id: 'restFloat', style: { display: 'block' }, classList: classList(), addEventListener() {}, removeEventListener() {},
    getBoundingClientRect: () => ({ top: 0, left: 0, width: FRAME_W, height: INNER_H, right: FRAME_W, bottom: INNER_H, x: 0, y: 0 }),
  };
}

/** Runs every listener of `type` on handle `h` with a pointer event at (x, y); returns how many ran. */
function fire(h: Handle, type: string, x: number, y: number): number {
  const e: PointerEvt = {
    type, clientX: x, clientY: y, pointerId: 1, cancelable: true, preventDefault() {},
    target: { closest: () => null }, currentTarget: h,
  };
  const fns = h.listeners[type] || [];
  for (const fn of fns) fn.call(h, e);
  return fns.length;
}

/**
 * Boots the app, places the stubs, and runs the real _rtInit: the timer docked right, collapsed, no intro, no drag.
 * Returns the stubs and readers for the app's own timer state.
 */
function timer() {
  const IA = loadApp({ dom: true });
  const tab = handle('rtTab');
  const card = handle('rtCard');
  const a = anchor();
  Object.assign(IA.els, { rtTab: tab, rtCard: card, rtAnchor: a, restFloat: frame() });
  IA.ctx['innerHeight'] = INNER_H;
  IA.docListeners['touchmove'] = [];
  IA.eval("_rtInited=false;_rtSide='right';_rtExpanded=false;_rtIntroTO=null;_rtDragging=false;_rtInit();");
  for (const h of [tab, card]) {
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      assert.equal((h.listeners[type] || []).length, 1, `${h.id} has one ${type} listener`);
    }
  }
  assert.equal(IA.docListeners['touchmove'].length, 1, 'the touchmove guard is registered once');
  return {
    tab, card, anchor: a,
    state: () => ({ top: a.raw['top'], left: a.raw['left'], right: a.raw['right'] }),
    transition: () => a.raw['transition'],
    /** The anchor's style writes since `from`, limited to `keys` when given. */
    writes: (from: number, keys?: string[]) => a.log.slice(from).filter((w) => !keys || keys.includes(w[0])),
    side: () => IA.eval('_rtSide'),
    expanded: () => IA.eval('_rtExpanded'),
    dragging: () => IA.eval('_rtDragging'),
    eval: IA.eval,
    /** Runs the touchmove guard once; returns how many times it prevented the page from scrolling. */
    guard: () => {
      let prevented = 0;
      for (const fn of IA.docListeners['touchmove'] || []) fn({ cancelable: true, preventDefault: () => prevented++ });
      return prevented;
    },
  };
}

const DOCKED_RIGHT = { top: undefined, left: 'auto', right: '0' };
const POSITION = ['top', 'left', 'right'];

// ── behaviour ───────────────────────────────────────────────────────────────────────────────────────────────────────
test('a jittery tap under 5 px writes neither top nor left, and the tab tap still expands', () => {
  const t = timer();
  assert.deepEqual(t.state(), DOCKED_RIGHT, 'docked right after _rtInit');
  const from = t.anchor.log.length;
  fire(t.tab, 'pointerdown', 355, 330);
  fire(t.tab, 'pointermove', 358, 332); // dx 3, dy 2
  fire(t.tab, 'pointermove', 352, 328); // dx -3, dy -2
  assert.deepEqual(t.writes(from, POSITION), [], 'nothing is written mid-tap');
  fire(t.tab, 'pointerup', 352, 328);
  assert.deepEqual(t.writes(from, POSITION), [], 'nothing is written by the tap');
  assert.deepEqual(t.state(), DOCKED_RIGHT, 'the timer stays docked right');
  assert.equal(t.expanded(), true, 'the tab tap expands the card');
  assert.equal(t.dragging(), false, 'the drag flag is cleared');
});

test('a jittery tap on the open card collapses it during the intro and does nothing outside it', () => {
  const t = timer();
  t.eval('_rtSetExpanded(true);_rtIntroTO=424242;');
  let from = t.anchor.log.length;
  fire(t.card, 'pointerdown', 300, 400);
  fire(t.card, 'pointermove', 303, 401);
  fire(t.card, 'pointerup', 303, 401);
  assert.deepEqual(t.writes(from, POSITION), []);
  assert.equal(t.expanded(), false, 'the intro tap folds the card');
  assert.equal(t.eval('_rtIntroTO'), null, 'the intro is dismissed');

  t.eval('_rtSetExpanded(true);');
  from = t.anchor.log.length;
  fire(t.card, 'pointerdown', 300, 400);
  fire(t.card, 'pointermove', 297, 404);
  fire(t.card, 'pointerup', 297, 404);
  assert.deepEqual(t.writes(from, POSITION), []);
  assert.equal(t.expanded(), true, 'outside the intro the card stays open');
  assert.deepEqual(t.state(), DOCKED_RIGHT);
});

test('a drag past 5 px that ends in pointercancel docks to the nearer edge', () => {
  const t = timer();
  // Drag A: the tab, from the right edge to x 100, cancelled by iOS.
  fire(t.tab, 'pointerdown', 355, 330);
  fire(t.tab, 'pointermove', 100, 340);
  assert.deepEqual(t.state(), { top: A.top, left: A.left, right: 'auto' }, 'the drag moves the timer');
  assert.equal(t.transition(), 'none', 'no transition while dragging');
  assert.equal(t.guard(), 1, 'the page does not scroll mid-drag');
  let from = t.anchor.log.length;
  assert.equal(fire(t.tab, 'pointercancel', 100, 340), 1);
  assert.equal(t.side(), 'left', 'centre x 100 is left of 187.5');
  assert.deepEqual(t.writes(from, ['left']).map((w) => w[1]), ['', '0'], 'left is cleared, then docked by _rtApplySide');
  assert.deepEqual(t.state(), { top: A.top, left: '0', right: 'auto' }, 'docked left at the height it was dropped');
  assert.equal(t.transition(), SNAP_TRANSITION, 'the snap transition is restored');
  assert.equal(t.expanded(), false, 'a cancel runs no tap action');
  assert.equal(t.dragging(), false, 'the drag is over');
  assert.equal(t.guard(), 0, 'the page scrolls again');

  // Drag B: the card, now docked left, to x 300, cancelled.
  fire(t.card, 'pointerdown', 20, 400);
  fire(t.card, 'pointermove', 300, 395);
  assert.deepEqual(t.state(), { top: B.top, left: B.left, right: 'auto' });
  from = t.anchor.log.length;
  fire(t.card, 'pointercancel', 300, 395);
  assert.equal(t.side(), 'right', 'centre x 300 is right of 187.5');
  assert.deepEqual(t.writes(from, ['left']).map((w) => w[1]), ['', 'auto']);
  assert.deepEqual(t.state(), { top: B.top, left: 'auto', right: '0' }, 'docked right at the height it was dropped');
  assert.equal(t.transition(), SNAP_TRANSITION);
  assert.equal(t.dragging(), false);
});

test('a jitter that ends in pointercancel writes nothing and runs no tap action', () => {
  const t = timer();
  const from = t.anchor.log.length;
  fire(t.tab, 'pointerdown', 355, 330);
  fire(t.tab, 'pointermove', 358, 332);
  fire(t.tab, 'pointercancel', 358, 332);
  assert.deepEqual(t.writes(from, POSITION), []);
  assert.equal(t.side(), 'right');
  assert.equal(t.expanded(), false);
  assert.equal(t.dragging(), false);
});

test('a cancel outside a drag never re-docks', () => {
  const t = timer();
  // A drag ended by pointerup docks left (drag A's arithmetic) and does not expand.
  fire(t.tab, 'pointerdown', 355, 330);
  fire(t.tab, 'pointermove', 100, 340);
  fire(t.tab, 'pointerup', 100, 340);
  assert.equal(t.side(), 'left');
  assert.deepEqual(t.state(), { top: A.top, left: '0', right: 'auto' });
  assert.equal(t.expanded(), false);
  // Then a cancel with no drag in flight, on the tab and on the card, with a stale drag flag.
  const from = t.anchor.log.length;
  t.eval('_rtDragging=true;');
  assert.equal(fire(t.tab, 'pointercancel', 100, 340), 1);
  assert.equal(fire(t.card, 'pointercancel', 100, 340), 1);
  assert.deepEqual(t.writes(from), [], 'nothing is written to the anchor');
  assert.equal(t.side(), 'left', 'the side is kept');
  assert.equal(t.dragging(), false, 'only the flag is cleared');
  assert.equal(t.expanded(), false);
});

// ── the stopwatch and the island ────────────────────────────────────────────────────────────────────────────────────
const T92 = 92340;
const T93 = 93340;
const TAB92 = '1:32';
const CS92 = '.34';
const TAB93 = '1:33';
const ZERO = '0:00';
/** The other clock's step: 10 minutes, which would read 10:00 if the stopwatch followed it. */
const SKEW = 600000;
/** A step for the clock under test's twin that no assertion reads. */
const NOISE = 7;

test('the stopwatch hand values are self-consistent', () => {
  const show = (ms: number) => {
    const ts = Math.floor(ms / 1000);
    const s = ts % 60;
    return Math.floor(ts / 60) + ':' + (s < 10 ? '0' : '') + s;
  };
  assert.equal(show(T92), TAB92);
  assert.equal('.' + (Math.floor(T92 / 10) % 100), CS92);
  assert.equal(T92 + 1000, T93);
  assert.equal(show(T93), TAB93);
  assert.equal(show(0), ZERO);
  assert.equal(show(SKEW), '10:00');
});

test('the rig starts on a training day at 10:00 with no plugin and a zeroed stopwatch', () => {
  const r = stopwatchRig();
  assert.equal(new Date(r.dayStart()).getHours(), 10);
  assert.equal(r.eval('typeof window.iaIsland'), 'undefined');
  assert.equal(r.now(), 0);
  assert.equal(r.tab().mini, ZERO);
  assert.equal(r.tab().toggle, 'Start');
  assert.equal(r.tab().display, 'block', 'This Week shows the tab');
});

test('on the PWA the stopwatch follows performance.now, never the wall clock', () => {
  const r = stopwatchRig();
  assert.equal(r.eval('typeof window.iaIsland'), 'undefined', 'no plugin on the PWA');
  assert.equal(r.seam('rtToggleBtn()'), null, 'Start');
  r.adv(SKEW, T92);
  assert.equal(r.now(), T92, 'running: performance moved 92340, the wall clock 600000');
  assert.deepEqual(r.tab(), { mini: TAB92, big: TAB92, cs: CS92, toggle: 'Stop', display: 'block' });
  assert.equal(r.seam('rtToggleBtn()'), null, 'Stop');
  r.adv(SKEW, 5000);
  assert.equal(r.now(), T92, 'frozen');
  assert.deepEqual(r.tab(), { mini: TAB92, big: TAB92, cs: CS92, toggle: 'Start', display: 'block' });
  assert.equal(r.seam('rtToggleBtn()'), null, 'resume');
  r.adv(SKEW, 1000);
  assert.equal(r.now(), T93, 'resumed where it stopped');
  assert.equal(r.tab().mini, TAB93);
  assert.equal(r.tab().toggle, 'Stop');
  assert.equal(r.seam('rtResetBtn()'), null, 'Reset');
  assert.equal(r.now(), 0);
  assert.equal(r.tab().mini, ZERO);
  assert.equal(r.tab().toggle, 'Start');
  assert.equal(r.eval('typeof window.iaIsland'), 'undefined', 'still no plugin');
});

test('on the PWA Done and a day open zero the stopwatch, and Home hides the tab while it keeps counting', () => {
  const r = stopwatchRig();
  // Done on the open day with the clock running.
  assert.equal(r.open(), null, 'the day opens');
  assert.equal(r.seam('rtToggleBtn()'), null);
  r.adv(SKEW, 4000);
  assert.equal(r.seam("handleDayStatus('" + r.day + "','x','complete')"), null, 'Done');
  assert.equal(r.now(), 0, 'Done zeroes the clock');
  assert.equal(r.tab().mini, ZERO);
  r.seam('popClose()');
  // A day open on a stopped clock.
  r.fresh();
  r.seam('rtToggleBtn()');
  r.adv(SKEW, 4000);
  r.seam('rtToggleBtn()');
  assert.equal(r.open(), null);
  assert.equal(r.now(), 0, 'a day open zeroes a stopped clock');
  assert.equal(r.tab().mini, ZERO);
  assert.equal(r.isOpen(), true, 'the day opened');
  r.seam('closeDetail()');
  // Home with the clock running.
  r.fresh();
  r.seam('rtToggleBtn()');
  assert.equal(r.seam("showScreen('screenHome')"), null);
  r.adv(SKEW, 30000);
  assert.equal(r.now(), 30000, 'it keeps counting on performance.now');
  assert.equal(r.tab().display, 'none', 'Home hides the tab');
  assert.equal(r.seam("showScreen('screenWeek')"), null);
  assert.equal(r.seam('rtResetBtn()'), null);
  assert.equal(r.eval('typeof window.iaIsland'), 'undefined');
});

test('inside the native app the stopwatch follows the wall clock, never performance.now', () => {
  const r = stopwatchRig();
  r.attach(islandStub());
  assert.equal(r.eval('typeof window.iaIsland'), 'object', 'a plugin installed after boot is seen');
  r.seam('rtToggleBtn()');
  r.adv(T92, SKEW);
  assert.equal(r.now(), T92, 'running: the wall clock moved 92340, performance 600000');
  assert.equal(r.tab().mini, TAB92);
  assert.equal(r.tab().cs, CS92);
  r.seam('rtToggleBtn()');
  r.adv(5000, SKEW);
  assert.equal(r.now(), T92, 'frozen');
  assert.equal(r.tab().mini, TAB92);
  assert.equal(r.tab().toggle, 'Start');
  r.seam('rtToggleBtn()');
  r.adv(1000, SKEW);
  assert.equal(r.now(), T93, 'resumed where it stopped');
  assert.equal(r.tab().mini, TAB93);
});

test('Start tells the island run with the wall-clock time of the tap', () => {
  const r = stopwatchRig();
  const s = r.attach(islandStub());
  assert.equal(r.seam('rtToggleBtn()'), null);
  assert.deepEqual(s.log, [['run', r.dayStart()]]);
  assert.equal(r.tab().toggle, 'Stop');
});

test('Stop tells the island stop with the frozen elapsed time', () => {
  const r = stopwatchRig();
  const s = r.attach(islandStub());
  r.seam('rtToggleBtn()');
  r.adv(T92, NOISE);
  r.seam('rtToggleBtn()');
  assert.deepEqual(s.log, [['run', r.dayStart()], ['stop', T92]]);
  assert.equal(r.tab().mini, TAB92);
  assert.equal(r.tab().toggle, 'Start');
});

test('Start after a Stop tells the island run with the start moved on by the pause', () => {
  const r = stopwatchRig();
  const s = r.attach(islandStub());
  r.seam('rtToggleBtn()');
  r.adv(T92, NOISE);
  r.seam('rtToggleBtn()');
  r.adv(5000, NOISE);
  r.seam('rtToggleBtn()');
  // Now is dayStart + 97340 and 92340 has elapsed, so the run started at dayStart + 5000.
  assert.equal(s.log.length, 3);
  assert.deepEqual(s.log[2], ['run', r.dayStart() + 5000]);
  r.adv(1000, NOISE);
  assert.equal(r.now(), T93);
  assert.equal(r.tab().mini, TAB93);
});

test('the reset button ends the island and zeroes the clock, running or stopped', () => {
  for (const mode of ['running', 'stopped']) {
    const r = stopwatchRig();
    const s = r.attach(islandStub());
    r.seam('rtToggleBtn()');
    r.adv(T92, NOISE);
    if (mode === 'stopped') r.seam('rtToggleBtn()');
    const mark = s.log.length;
    assert.ok(mark > 0, `${mode}: the island heard the start`);
    assert.equal(r.seam('rtResetBtn()'), null);
    const after = s.log.slice(mark);
    assert.deepEqual(after[after.length - 1], ['end'], `${mode}: the last call is end()`);
    assert.ok(!after.some((c) => c[0] === 'run'), `${mode}: no run() after the reset`);
    assert.equal(r.now(), 0, mode);
    assert.equal(r.tab().mini, ZERO, mode);
    assert.equal(r.tab().toggle, 'Start', mode);
  }
});

test('Done and Skip end the island and zero the clock', () => {
  for (const status of ['complete', 'skipped']) {
    const r = stopwatchRig();
    const s = r.attach(islandStub());
    assert.equal(r.open(), null, `${status}: the day opens`);
    r.seam('rtToggleBtn()');
    r.adv(T92, NOISE);
    const mark = s.log.length;
    assert.ok(mark > 0, `${status}: the island heard the start`);
    assert.equal(r.seam("handleDayStatus('" + r.day + "','x','" + status + "')"), null);
    const after = s.log.slice(mark);
    assert.deepEqual(after[after.length - 1], ['end'], `${status}: the last call is end()`);
    assert.ok(!after.some((c) => c[0] === 'run'), `${status}: no run() after the tap`);
    assert.equal(r.now(), 0, status);
    assert.equal(r.tab().mini, ZERO, status);
    r.seam('popClose()');
  }
});

test('opening a day on a stopped clock zeroes it and ends the island', () => {
  const r = stopwatchRig();
  const s = r.attach(islandStub());
  r.seam('rtToggleBtn()');
  r.adv(T92, NOISE);
  r.seam('rtToggleBtn()');
  const mark = s.log.length;
  assert.equal(r.open(), null);
  assert.deepEqual(s.log.slice(mark), [['end']], 'the open sends exactly end()');
  assert.equal(r.now(), 0);
  assert.equal(r.tab().mini, ZERO);
  assert.equal(r.isOpen(), true, 'the day opened');
});

test('opening a day on a running clock leaves it running and tells the island nothing', () => {
  const r = stopwatchRig();
  const s = r.attach(islandStub());
  r.seam('rtToggleBtn()');
  r.adv(10000, NOISE);
  assert.equal(s.log.length, 1, 'the start was sent');
  assert.equal(r.open(), null);
  assert.deepEqual(s.log.slice(1), [], 'the open sends nothing');
  r.adv(1000, SKEW);
  assert.equal(r.now(), 11000, 'it keeps counting on the wall clock');
  assert.equal(r.tab().toggle, 'Stop');
  assert.equal(r.isOpen(), true);
});

test('Home and the wizard hide the tab and tell the island nothing while the clock keeps counting', () => {
  const r = stopwatchRig();
  const s = r.attach(islandStub());
  r.seam('rtToggleBtn()');
  r.adv(10000, NOISE);
  assert.equal(s.log.length, 1, 'the start was sent');
  assert.equal(r.seam("showScreen('screenHome')"), null);
  r.adv(30000, SKEW);
  assert.equal(r.now(), 40000, 'Home');
  assert.equal(r.tab().display, 'none', 'Home hides the tab');
  assert.equal(r.seam("showScreen('screenWizard')"), null);
  r.adv(20000, SKEW);
  assert.equal(r.now(), 60000, 'the wizard');
  assert.equal(r.tab().display, 'none', 'the wizard hides the tab');
  assert.equal(r.seam("showScreen('screenWeek')"), null);
  assert.equal(r.now(), 60000, 'This Week');
  assert.equal(r.tab().display, 'block', 'This Week shows it again');
  assert.equal(r.tab().toggle, 'Stop');
  assert.deepEqual(s.log.slice(1), [], 'nothing was sent while it was hidden');
});

test('a page load with the island plugin present ends the island and reaches Home', () => {
  const s = islandStub();
  const IA = loadWithIsland(s);
  assert.deepEqual(s.log, [['end']], 'the load sends exactly end()');
  assert.equal(IA.eval('_curScreen'), 'screenHome', 'no program is stored, so the app opens on Home');
});

test('an island plugin that throws on every call never breaks the stopwatch or the page load', () => {
  const r = stopwatchRig();
  const s = r.attach(islandStub(true));
  const reads: unknown[] = [];
  assert.equal(r.seam('rtToggleBtn()'), null, 'Start');
  r.adv(T92, SKEW);
  reads.push(r.now());
  assert.equal(r.seam('rtToggleBtn()'), null, 'Stop');
  r.adv(5000, SKEW);
  reads.push(r.now());
  assert.equal(r.tab().toggle, 'Start');
  assert.equal(r.open(), null, 'day open');
  reads.push(r.now());
  assert.equal(r.seam('rtToggleBtn()'), null, 'Start');
  r.adv(4000, SKEW);
  assert.equal(r.seam("handleDayStatus('" + r.day + "','x','complete')"), null, 'Done');
  reads.push(r.now());
  r.seam('popClose()');
  assert.equal(r.seam('rtToggleBtn()'), null, 'Start');
  r.adv(4000, SKEW);
  assert.equal(r.seam('rtResetBtn()'), null, 'Reset');
  reads.push(r.now());
  assert.deepEqual(reads, [T92, T92, 0, 0, 0]);
  assert.equal(r.tab().mini, ZERO);
  // Start, Stop, the open, Start, Done, Start and Reset all reach the plugin, and every call throws.
  assert.ok(s.log.length >= 6, `${s.log.length} calls reached the plugin`);
  assert.equal(s.thrown.length, s.log.length, 'every call threw');

  const s2 = islandStub(true);
  const IA = loadWithIsland(s2);
  assert.equal(IA.eval('_curScreen'), 'screenHome', 'a load with a throwing plugin reaches Home');
  assert.deepEqual(s2.thrown, ['end']);
});
