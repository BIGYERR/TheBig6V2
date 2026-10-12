'use strict';
// The floating rest timer: dragging the tab and the card (_rtWireDrag, wired by _rtInit). Rulings:
// docs/decisions/rest-timer.md (D235: a tap never strands the timer, a cancelled drag docks to an edge).
//
// The app boots in the VM harness with a document that keeps its elements (tests/support/app.js loadApp({dom:true})).
// The real _rtInit wires the real handlers onto stubs that keep every listener and run it; the test fires pointer
// events at them and reads every write to the anchor's style.
//
// Oracle: hand geometry, typed here and checked below, never the app's own handler. The frame (#restFloat) is 375 px
// wide at left 0, window.innerHeight is 852, the anchor (#rtAnchor) is 40 x 60 and sits at top 300 until a drag writes
// top. The anchor's offsetLeft follows its style as a browser lays it out: a px left reads as written, left '0' reads
// 0, right '0' reads 375 - 40 = 335.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('../support/app.js');

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
  const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, v));
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

/** A drag handle (#rtTab or #rtCard) that keeps every listener so the test can run it. */
function handle(id) {
  const listeners = {};
  return {
    id, style: {}, dataset: {}, innerHTML: '', textContent: '', listeners, classList: classList(),
    addEventListener(type, fn) {
      if (typeof fn === 'function') (listeners[type] = listeners[type] || []).push(fn);
    },
    removeEventListener() {}, setPointerCapture() {}, releasePointerCapture() {},
    querySelector: () => null, closest: () => null,
  };
}

/** #rtAnchor: logs every style write, and lays out offsetTop and offsetLeft the way a browser would. */
function anchor() {
  const raw = {};
  const log = [];
  const style = new Proxy(raw, {
    set(o, k, v) {
      log.push([String(k), String(v)]);
      o[k] = v;
      return true;
    },
  });
  return {
    id: 'rtAnchor', style, raw, log, offsetWidth: ANCHOR_W, offsetHeight: ANCHOR_H, classList: classList(),
    get offsetTop() {
      return /px$/.test(raw.top || '') ? parseFloat(raw.top) : TOP0;
    },
    get offsetLeft() {
      if (/px$/.test(raw.left || '')) return parseFloat(raw.left);
      if (raw.left === '0') return 0;
      return raw.right === '0' ? FRAME_W - ANCHOR_W : 0;
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
function fire(h, type, x, y) {
  const e = {
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
  IA.ctx.innerHeight = INNER_H;
  IA.docListeners.touchmove = [];
  IA.eval("_rtInited=false;_rtSide='right';_rtExpanded=false;_rtIntroTO=null;_rtDragging=false;_rtInit();");
  for (const h of [tab, card]) {
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      assert.equal((h.listeners[type] || []).length, 1, `${h.id} has one ${type} listener`);
    }
  }
  assert.equal(IA.docListeners.touchmove.length, 1, 'the touchmove guard is registered once');
  return {
    tab, card, anchor: a,
    state: () => ({ top: a.raw.top, left: a.raw.left, right: a.raw.right }),
    transition: () => a.raw.transition,
    /** The anchor's style writes since `from`, limited to `keys` when given. */
    writes: (from, keys) => a.log.slice(from).filter((w) => !keys || keys.includes(w[0])),
    side: () => IA.eval('_rtSide'),
    expanded: () => IA.eval('_rtExpanded'),
    dragging: () => IA.eval('_rtDragging'),
    eval: IA.eval,
    /** Runs the touchmove guard once; returns how many times it prevented the page from scrolling. */
    guard: () => {
      let prevented = 0;
      for (const fn of IA.docListeners.touchmove) fn({ cancelable: true, preventDefault: () => prevented++ });
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
