// The rest stopwatch rig for tests/integration/rest-timer.test.ts. It boots the app in the VM harness with:
//   - two fake clocks a test moves by hand, Date (the wall clock) and performance.now. A test moves them by different
//     amounts, so the clock the stopwatch follows is read off the value it shows;
//   - a scheduler with a clock of its own that runs the 33 ms tick and the day-open timers and moves neither fake clock,
//     so the tab shows exactly the value under test;
//   - a document whose elements keep their classes, text and listeners (the tab #rtMini, #rtBig, #rtCs, #rtToggle and
//     #restFloat, the overlays #detailOverlay and #popOverlay, every .screen);
//   - Mario's program (fixtures.HALF_MANNY, seed pinned) stored as the active program from Monday 2026-09-21; the day
//     under test is week 1's first training day.
// A test drives only the app's own seams (rtToggleBtn, rtResetBtn, openDayKey, handleDayStatus, showScreen) and reads
// the stopwatch through _ruNow() and the tab. tests/support/app.ts and tests/harness.js are not changed.
import { createRequire } from 'node:module';
import type * as VM from 'node:vm';
import type { DayKey, Program } from '@ia/core';
import { loadApp, fixtures } from './app.ts';
import type { App } from './app.ts';

const require = createRequire(import.meta.url);
/** The same node:vm module object harness.js calls, so a hook placed on it reaches the harness. */
const vm: typeof VM = require('node:vm');

const RealDate = Date;
export const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const START_ISO = '2026-09-21'; // a Monday
/** 10:00 local on day `d` of week `w` of a program that starts Monday 2026-09-21. Date arithmetic, never the app. */
export const dateOf = (w: number, d: DayKey): number => new RealDate(2026, 8, 21 + (w - 1) * 7 + DAYS.indexOf(d), 10, 0, 0).getTime();
/** The fake performance clock's origin (any value far from the wall clock's). */
export const PERF0 = 5000000;

/** A call the island stub logged: [name, arg], or [name] when called with no argument. */
export type IslandCall = [string, unknown?];

/** A stand-in for the native plugin (window.iaIsland). */
export interface IslandStub {
  log: IslandCall[];
  thrown: string[];
  run(...args: unknown[]): void;
  stop(...args: unknown[]): void;
  end(...args: unknown[]): void;
}

/**
 * A stand-in for the native plugin (window.iaIsland). run, stop and end each log [name, arg], or [name] when called
 * with no argument; with `throwing` every call throws after it is logged.
 */
export function islandStub(throwing = false): IslandStub {
  const log: IslandCall[] = [];
  const thrown: string[] = [];
  const call = (name: string) =>
    function (...args: unknown[]): void {
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
export function loadWithIsland(stub: IslandStub): App {
  const orig = vm.runInContext;
  vm.runInContext = function (code: string, ctx: VM.Context, o?: VM.RunningCodeOptions | string) {
    if (typeof code === 'string' && code.includes('globalThis.__IA')) {
      vm.runInContext = orig;
      ctx['iaIsland'] = stub;
    }
    return orig.call(vm, code, ctx, o);
  } as typeof vm.runInContext;
  try {
    return loadApp();
  } finally {
    vm.runInContext = orig;
  }
}

type Listener = (e: { target: unknown; currentTarget: unknown; type: string }) => void;

/** An element that keeps its classes, text and listeners. */
export interface Element {
  id: string;
  value: string;
  innerHTML: string;
  textContent: string;
  style: Record<string, string>;
  classList: {
    add(...c: string[]): void;
    remove(...c: string[]): void;
    toggle(c: string, force?: boolean): boolean;
    contains(c: string): boolean;
  };
  className: string;
  [other: string]: unknown;
}

/** An element that keeps its classes, text and listeners. */
function element(id: string): Element {
  const cls = new Set<string>();
  const listeners: Record<string, Listener[]> = {};
  const el: Element = {
    id, value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, children: [],
    offsetWidth: 0, offsetHeight: 0, offsetTop: 0, offsetLeft: 0, scrollTop: 0,
    classList: {
      add: (...c: string[]) => c.forEach((x) => cls.add(x)),
      remove: (...c: string[]) => c.forEach((x) => cls.delete(x)),
      toggle: (c: string, force?: boolean) => {
        const on = force === undefined ? !cls.has(c) : !!force;
        if (on) cls.add(c);
        else cls.delete(c);
        return on;
      },
      contains: (c: string) => cls.has(c),
    },
    addEventListener: (type: string, fn: Listener) => {
      (listeners[type] = listeners[type] || []).push(fn);
    },
    removeEventListener() {},
    dispatchEvent: (evt: { type: string }) => {
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
    set className(v: string) {
      cls.clear();
      String(v).split(/\s+/).filter(Boolean).forEach((x) => cls.add(x));
    },
  };
  return el;
}

interface Timer {
  fn: () => void;
  at: number;
  every: number;
}

/** What the tab shows: the mini clock (tags stripped), the big clock, the centiseconds, the button, the display. */
export interface TabView {
  mini: string;
  big: string;
  cs: string;
  toggle: string;
  display: string | undefined;
}

/** The rig a stopwatch test drives. */
export interface StopwatchRig {
  IA: App;
  ctx: VM.Context;
  eval: (code: string) => unknown;
  els: Record<string, Element>;
  timerErrors: string[];
  week: number;
  day: DayKey;
  screens: string[];
  /** The wall-clock time (ms) at 10:00 on the day under test: where Date stands after fresh(). */
  dayStart(): number;
  /** Runs `code` in the app; returns what it threw as a string, or null. */
  seam(code: string): string | null;
  /** Moves the wall clock by `dWall` ms and performance.now by `dPerf` ms, then lets the 33 ms tick render. */
  adv(dWall: number, dPerf: number): void;
  /** Installs `stub` as window.iaIsland after boot, as a plugin that arrives late would be. */
  attach(stub: IslandStub): IslandStub;
  detach(): void;
  /** No plugin, the stopwatch zeroed, no timers, nothing completed, This Week shown, both clocks at their origin. */
  fresh(): void;
  /** Opens the day under test the way a tap on its row does; returns what it threw, or null. */
  open(): string | null;
  /** The stopwatch's value in ms. */
  now(): number;
  tab(): TabView;
  isOpen(): boolean;
}

/**
 * Boots the app with the rig described at the top of this file, the stopwatch zeroed, no plugin, on This Week.
 * Returns the seams and readers a test uses.
 */
export function stopwatchRig(): StopwatchRig {
  const IA = loadApp();
  const { ctx } = IA;
  const ev = IA.eval;

  let wall = dateOf(1, 'mon');
  let perf = PERF0;
  let clock = 0; // the scheduler's own clock
  class FakeDate extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length) super(...(args as [string | number]));
      else super(wall);
    }
    static override now(): number {
      return wall;
    }
  }
  ctx['Date'] = FakeDate;
  ctx['performance'] = { now: () => perf };

  let nextId = 1;
  const timers = new Map<number, Timer>();
  const timerErrors: string[] = [];
  const schedule = (fn: () => void, ms: unknown, every: number): number => {
    const id = nextId++;
    timers.set(id, { fn, at: clock + Math.max(0, Number(ms) || 0), every });
    return id;
  };
  ctx['setTimeout'] = (fn: () => void, ms: unknown) => schedule(fn, ms, 0);
  ctx['setInterval'] = (fn: () => void, ms: unknown) => schedule(fn, ms, Math.max(1, Number(ms) || 1));
  ctx['requestAnimationFrame'] = (fn: (t: number) => void) => schedule(() => fn(clock), 16, 0);
  ctx['clearTimeout'] = ctx['clearInterval'] = ctx['cancelAnimationFrame'] = (id: number) => {
    timers.delete(id);
  };
  /** Runs every timer due in the next `ms` of the scheduler's clock, in order. Moves neither fake clock. */
  const runTimers = (ms: number): void => {
    const end = clock + ms;
    for (let n = 0; n < 20000; n++) {
      let due: [number, Timer] | null = null;
      for (const [id, t] of timers) if (t.at <= end && (!due || t.at < due[1].at)) due = [id, t];
      if (!due) break;
      const [id, t] = due;
      clock = t.at;
      if (t.every) t.at += t.every;
      else timers.delete(id);
      try {
        t.fn();
      } catch (e) {
        timerErrors.push((e as Error).message);
      }
    }
    clock = end;
  };
  if (ev('typeof Event') === 'undefined') {
    ctx['Event'] = class {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    };
  }

  const els: Record<string, Element> = {};
  const doc = ctx['document'];
  const byId = (id: string): Element => els[id] || (els[id] = element(id));
  doc.getElementById = byId;
  if (!doc.addEventListener) doc.addEventListener = function () {};
  for (const id of ['popOverlay', 'toast', 'detailOverlay', 'detailBody', 'rtMini', 'rtBig', 'rtCs', 'rtToggle', 'restFloat', 'screenWeek', 'daysList']) {
    byId(id);
  }
  const screens = [...new Set((IA.html.match(/class="screen[^"]*" id="(\w+)"/g) || []).map((s) => (s.match(/id="(\w+)"/) as RegExpMatchArray)[1] as string))];
  for (const s of screens) byId(s).classList.add('screen');
  doc.querySelectorAll = (sel: string) => {
    if (sel === '.screen') return screens.map((s) => els[s]);
    if (sel === '.screen.with-tabbar') return screens.map((s) => byId(s)).filter((x) => x.classList.contains('with-tabbar'));
    return [];
  };
  ctx['popConfetti'] = function () {};

  const cfg = JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
  const prog: Program & { blockOpen?: unknown; createdAt?: unknown } = IA.buildProgram(cfg);
  prog.id = 'rest-timer';
  prog.startDate = START_ISO;
  delete prog.blockOpen;
  delete (prog as Partial<Program>).created;
  delete prog.createdAt;
  for (const k of [...IA.localStorage._map.keys()]) IA.localStorage.removeItem(k);
  IA.localStorage.setItem('ia_programs', JSON.stringify([prog]));
  ctx['__P'] = JSON.parse(JSON.stringify(prog));
  ev("activeProg=globalThis.__P; activeProgId='rest-timer'; currentWeek=1;");
  const week = 1;
  const weekOne = prog.weeks[week];
  const day = DAYS.find((d) => weekOne && weekOne[d] && !(weekOne[d] as { rest?: boolean }).rest);
  if (!weekOne || !day) throw new Error('stopwatchRig: week 1 has no training day');

  const rig: StopwatchRig = {
    IA, ctx, eval: ev, els, timerErrors, week, day, screens,
    dayStart: () => dateOf(week, day),
    seam: (code) => {
      try {
        ev(code);
        return null;
      } catch (e) {
        return String((e && (e as Error).message) || e);
      }
    },
    adv: (dWall, dPerf) => {
      wall += dWall;
      perf += dPerf;
      runTimers(50);
    },
    attach: (stub) => {
      ctx['iaIsland'] = stub;
      return stub;
    },
    detach: () => {
      delete ctx['iaIsland'];
    },
    fresh: () => {
      rig.detach();
      ev('ruReset()');
      timers.clear();
      ev('saveCompleted({});');
      ev('currentWeek=' + week + ';');
      wall = dateOf(week, day);
      perf = PERF0;
      ev("showScreen('screenWeek')");
      byId('popOverlay').classList.remove('show');
      byId('detailOverlay').classList.remove('open');
      runTimers(50);
    },
    open: () => {
      const e = rig.seam("openDayKey('" + day + "')");
      runTimers(300);
      return e;
    },
    now: () => ev('_ruNow()') as number,
    tab: () => ({
      mini: String(byId('rtMini').innerHTML || '').replace(/<[^>]+>/g, ''),
      big: byId('rtBig').textContent,
      cs: byId('rtCs').textContent,
      toggle: byId('rtToggle').textContent,
      display: byId('restFloat').style['display'],
    }),
    isOpen: () => byId('detailOverlay').classList.contains('open'),
  };
  rig.fresh();
  return rig;
}
