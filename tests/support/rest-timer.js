'use strict';
// The rest stopwatch rig for tests/integration/rest-timer.test.js. It boots the app in the VM harness with:
//   - two fake clocks a test moves by hand, Date (the wall clock) and performance.now. A test moves them by different
//     amounts, so the clock the stopwatch follows is read off the value it shows;
//   - a scheduler with a clock of its own that runs the 33 ms tick and the day-open timers and moves neither fake clock,
//     so the tab shows exactly the value under test;
//   - a document whose elements keep their classes, text and listeners (the tab #rtMini, #rtBig, #rtCs, #rtToggle and
//     #restFloat, the overlays #detailOverlay and #popOverlay, every .screen);
//   - Mario's program (fixtures.HALF_MANNY, seed pinned) stored as the active program from Monday 2026-09-21; the day
//     under test is week 1's first training day.
// A test drives only the app's own seams (rtToggleBtn, rtResetBtn, openDayKey, handleDayStatus, showScreen) and reads
// the stopwatch through _ruNow() and the tab. tests/support/app.js and tests/harness.js are not changed.
const vm = require('node:vm');
const { loadApp, fixtures } = require('./app.js');

const RealDate = Date;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const START_ISO = '2026-09-21'; // a Monday
/** 10:00 local on day `d` of week `w` of a program that starts Monday 2026-09-21. Date arithmetic, never the app. */
const dateOf = (w, d) => new RealDate(2026, 8, 21 + (w - 1) * 7 + DAYS.indexOf(d), 10, 0, 0).getTime();
/** The fake performance clock's origin (any value far from the wall clock's). */
const PERF0 = 5000000;

/**
 * A stand-in for the native plugin (window.iaIsland). run, stop and end each log [name, arg], or [name] when called
 * with no argument; with `throwing` every call throws after it is logged.
 */
function islandStub(throwing = false) {
  const log = [];
  const thrown = [];
  const call = (name) =>
    function (...args) {
      log.push(args.length ? [name, args[0]] : [name]);
      if (throwing) {
        thrown.push(name);
        throw new Error(`iaIsland.${name} threw (test stub)`);
      }
    };
  return { log, thrown, run: call('run'), stop: call('stop'), end: call('end') };
}

/**
 * A page load with `stub` already present as window.iaIsland when the app's script starts, as in the native app.
 * vm.runInContext is wrapped for exactly the one call that carries the page script, then restored.
 */
function loadWithIsland(stub) {
  const orig = vm.runInContext;
  vm.runInContext = function (code, ctx, o) {
    if (typeof code === 'string' && code.includes('globalThis.__IA')) {
      vm.runInContext = orig;
      ctx.iaIsland = stub;
    }
    return orig.call(vm, code, ctx, o);
  };
  try {
    return loadApp();
  } finally {
    vm.runInContext = orig;
  }
}

/** An element that keeps its classes, text and listeners. */
function element(id) {
  const cls = new Set();
  const listeners = {};
  const el = {
    id, value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, children: [],
    offsetWidth: 0, offsetHeight: 0, offsetTop: 0, offsetLeft: 0, scrollTop: 0,
    classList: {
      add: (...c) => c.forEach((x) => cls.add(x)),
      remove: (...c) => c.forEach((x) => cls.delete(x)),
      toggle: (c, force) => {
        const on = force === undefined ? !cls.has(c) : !!force;
        if (on) cls.add(c);
        else cls.delete(c);
        return on;
      },
      contains: (c) => cls.has(c),
    },
    addEventListener: (type, fn) => {
      (listeners[type] = listeners[type] || []).push(fn);
    },
    removeEventListener() {},
    dispatchEvent: (evt) => {
      (listeners[evt.type] || []).forEach((f) => f({ target: el, currentTarget: el, type: evt.type }));
      return true;
    },
    setAttribute() {}, getAttribute: () => null, appendChild() {}, removeChild() {}, remove() {}, insertAdjacentHTML() {},
    querySelector: () => null, querySelectorAll: () => [], closest: () => null, setPointerCapture() {},
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }),
    scrollIntoView() {}, focus() {}, blur() {},
    get className() {
      return [...cls].join(' ');
    },
    set className(v) {
      cls.clear();
      String(v).split(/\s+/).filter(Boolean).forEach((x) => cls.add(x));
    },
  };
  return el;
}

/**
 * Boots the app with the rig described at the top of this file, the stopwatch zeroed, no plugin, on This Week.
 * Returns the seams and readers a test uses.
 */
function stopwatchRig() {
  const IA = loadApp();
  const { ctx } = IA;
  const ev = IA.eval;

  let wall = dateOf(1, 'mon');
  let perf = PERF0;
  let clock = 0; // the scheduler's own clock
  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length) super(...args);
      else super(wall);
    }
    static now() {
      return wall;
    }
  }
  ctx.Date = FakeDate;
  ctx.performance = { now: () => perf };

  let nextId = 1;
  const timers = new Map();
  const timerErrors = [];
  const schedule = (fn, ms, every) => {
    const id = nextId++;
    timers.set(id, { fn, at: clock + Math.max(0, +ms || 0), every });
    return id;
  };
  ctx.setTimeout = (fn, ms) => schedule(fn, ms, 0);
  ctx.setInterval = (fn, ms) => schedule(fn, ms, Math.max(1, +ms || 1));
  ctx.requestAnimationFrame = (fn) => schedule(() => fn(clock), 16, 0);
  ctx.clearTimeout = ctx.clearInterval = ctx.cancelAnimationFrame = (id) => {
    timers.delete(id);
  };
  /** Runs every timer due in the next `ms` of the scheduler's clock, in order. Moves neither fake clock. */
  const runTimers = (ms) => {
    const end = clock + ms;
    for (let n = 0; n < 20000; n++) {
      let due = null;
      for (const [id, t] of timers) if (t.at <= end && (!due || t.at < due[1].at)) due = [id, t];
      if (!due) break;
      const [id, t] = due;
      clock = t.at;
      if (t.every) t.at += t.every;
      else timers.delete(id);
      try {
        t.fn();
      } catch (e) {
        timerErrors.push(e.message);
      }
    }
    clock = end;
  };
  if (ev('typeof Event') === 'undefined') ctx.Event = class { constructor(type) { this.type = type; } };

  const els = {};
  const doc = ctx.document;
  doc.getElementById = (id) => els[id] || (els[id] = element(id));
  if (!doc.addEventListener) doc.addEventListener = function () {};
  for (const id of ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'rtMini', 'rtBig', 'rtCs', 'rtToggle', 'restFloat', 'screenWeek', 'daysList']) {
    doc.getElementById(id);
  }
  const screens = [...new Set((IA.html.match(/class="screen[^"]*" id="(\w+)"/g) || []).map((s) => s.match(/id="(\w+)"/)[1]))];
  for (const s of screens) doc.getElementById(s).classList.add('screen');
  doc.querySelectorAll = (sel) => {
    if (sel === '.screen') return screens.map((s) => els[s]);
    if (sel === '.screen.with-tabbar') return screens.map((s) => els[s]).filter((x) => x.classList.contains('with-tabbar'));
    return [];
  };
  ctx.popConfetti = function () {};

  const cfg = JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
  const prog = IA.buildProgram(cfg);
  prog.id = 'rest-timer';
  prog.startDate = START_ISO;
  delete prog.blockOpen;
  delete prog.created;
  delete prog.createdAt;
  for (const k of [...IA.localStorage._map.keys()]) IA.localStorage.removeItem(k);
  IA.localStorage.setItem('ia_programs', JSON.stringify([prog]));
  ctx.__P = JSON.parse(JSON.stringify(prog));
  ev("activeProg=globalThis.__P; activeProgId='rest-timer'; currentWeek=1;");
  const week = 1;
  const day = DAYS.find((d) => prog.weeks[week][d] && !prog.weeks[week][d].rest);

  const rig = {
    IA, ctx, eval: ev, els, timerErrors, week, day, screens,
    /** The wall-clock time (ms) at 10:00 on the day under test: where Date stands after fresh(). */
    dayStart: () => dateOf(week, day),
    /** Runs `code` in the app; returns what it threw as a string, or null. */
    seam: (code) => {
      try {
        ev(code);
        return null;
      } catch (e) {
        return String((e && e.message) || e);
      }
    },
    /** Moves the wall clock by `dWall` ms and performance.now by `dPerf` ms, then lets the 33 ms tick render. */
    adv: (dWall, dPerf) => {
      wall += dWall;
      perf += dPerf;
      runTimers(50);
    },
    /** Installs `stub` as window.iaIsland after boot, as a plugin that arrives late would be. */
    attach: (stub) => {
      ctx.iaIsland = stub;
      return stub;
    },
    detach: () => {
      delete ctx.iaIsland;
    },
    /** No plugin, the stopwatch zeroed, no timers, nothing completed, This Week shown, both clocks at their origin. */
    fresh: () => {
      rig.detach();
      ev('ruReset()');
      timers.clear();
      ev('saveCompleted({});');
      ev('currentWeek=' + week + ';');
      wall = dateOf(week, day);
      perf = PERF0;
      ev("showScreen('screenWeek')");
      els.popOverlay.classList.remove('show');
      els.detailOverlay.classList.remove('open');
      runTimers(50);
    },
    /** Opens the day under test the way a tap on its row does; returns what it threw, or null. */
    open: () => {
      const e = rig.seam("openDayKey('" + day + "')");
      runTimers(300);
      return e;
    },
    /** The stopwatch's value in ms. */
    now: () => ev('_ruNow()'),
    /** What the tab shows: the mini clock (tags stripped), the big clock, the centiseconds, the button, the display. */
    tab: () => ({
      mini: String(els.rtMini.innerHTML || '').replace(/<[^>]+>/g, ''),
      big: els.rtBig.textContent,
      cs: els.rtCs.textContent,
      toggle: els.rtToggle.textContent,
      display: els.restFloat.style.display,
    }),
    isOpen: () => els.detailOverlay.classList.contains('open'),
  };
  rig.fresh();
  return rig;
}

module.exports = { islandStub, loadWithIsland, stopwatchRig, dateOf, DAYS, START_ISO, PERF0 };
