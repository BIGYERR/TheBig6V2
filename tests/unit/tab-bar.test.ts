// The tab bar stays at the bottom after the on-screen keyboard closes: installKeyboardResync (rest-day-shell.ts), D256
// (docs/decisions/tab-bar.md). iOS 26 leaves the layout viewport stale once the keyboard closes, and fixed elements
// drift when the page scrolls up; a real scroll, one point and a frame later back, makes WebKit recompute them.
//
// The function is lifted out of the page and run on a hand-built window: a visual viewport whose height the test sets,
// a document whose focused element the test sets, scrollTo recorded, timers and animation frames queued and run by hand. Every expected call
// is typed from the ruling. WebKit's own behaviour is not in this file: only the phone shows it.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { readFileSync } from 'node:fs';
import { APP, appFunction, appScript } from '../support/app.ts';

type Listener = () => void;
interface Fake {
  win: Record<string, unknown>;
  calls: [number, number][];
  flush: () => void;
  vv: { height: number } | undefined;
  doc: { activeElement: { tagName: string } | null };
  fire: (target: 'vv' | 'doc', type: string) => void;
}
function fakeWindow(withViewport = true): Fake {
  const calls: [number, number][] = [];
  const timers: Listener[] = [];
  const on: Record<string, Listener> = {};
  const vv = withViewport ? { height: 800, addEventListener: (t: string, f: Listener) => { on['vv:' + t] = f; } } : undefined;
  const doc = { activeElement: null as { tagName: string } | null, addEventListener: (t: string, f: Listener) => { on['doc:' + t] = f; } };
  const win = {
    visualViewport: vv, document: doc, scrollX: 0, scrollY: 640,
    scrollTo: (x: number, y: number) => { calls.push([x, y]); },
    setTimeout: (f: Listener) => { timers.push(f); return timers.length; },
    requestAnimationFrame: (f: Listener) => { timers.push(f); return timers.length; },
  };
  return {
    win, calls, vv, doc,
    flush: () => { while (timers.length) timers.shift()!(); },
    fire: (target, type) => { const f = on[target + ':' + type]; assert.ok(f, 'no ' + target + ' ' + type + ' listener'); f(); },
  };
}
const install = (): ((win: unknown) => void) => appFunction('installKeyboardResync');

test('the keyboard closing (the viewport growing back by more than 100 points) scrolls one point up and a frame later back', () => {
  const f = fakeWindow();
  install()(f.win);
  f.vv!.height = 500; f.fire('vv', 'resize');   // the keyboard opens
  f.flush();
  assert.deepEqual(f.calls, [], 'opening scrolls nothing');
  f.vv!.height = 800; f.fire('vv', 'resize');   // and closes: 800 > 500 + 100
  f.flush();
  assert.deepEqual(f.calls, [[0, 639], [0, 640]]);
});

test('a viewport that grows by 100 points or less scrolls nothing', () => {
  const f = fakeWindow();
  install()(f.win);
  f.vv!.height = 700; f.fire('vv', 'resize');
  f.vv!.height = 800; f.fire('vv', 'resize');   // 800 is not more than 700 + 100
  f.flush();
  assert.deepEqual(f.calls, []);
});

test('focus leaving a field for the page scrolls one point and back; focus moving to another field does not', () => {
  const page = fakeWindow();
  install()(page.win);
  page.doc.activeElement = { tagName: 'BODY' };
  page.fire('doc', 'focusout');
  page.flush();
  assert.deepEqual(page.calls, [[0, 639], [0, 640]]);
  for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) {
    const next = fakeWindow();
    install()(next.win);
    next.doc.activeElement = { tagName: tag };
    next.fire('doc', 'focusout');
    next.flush();
    assert.deepEqual(next.calls, [], tag);
  }
});

test('without a visual viewport (an older browser) it installs, and the focus path still resyncs', () => {
  const f = fakeWindow(false);
  install()(f.win);
  f.doc.activeElement = null;
  f.fire('doc', 'focusout');
  f.flush();
  assert.deepEqual(f.calls, [[0, 639], [0, 640]]);
});

test('at the top of the page the nudge goes down a point, then back to the top', () => {
  const f = fakeWindow();
  f.win['scrollY'] = 0;
  install()(f.win);
  f.vv!.height = 500; f.fire('vv', 'resize');
  f.vv!.height = 800; f.fire('vv', 'resize');
  f.flush();
  assert.deepEqual(f.calls, [[0, 1], [0, 0]]);
});

test('the page installs it at load, on the window', () => {
  const code = appScript().replace(/\/\/[^\n]*/g, '');
  assert.equal((code.match(/\binstallKeyboardResync\(window\);/g) || []).length, 1);
});

// The tab highlight glides like liquid and can be dragged, and every press shows on the phone: installTabGlide and
// installPressFeel (rest-day-shell.ts), D266 (docs/decisions/tab-bar.md). Both are lifted out of the page and run on a
// hand-built window: a bar 12px from the left with a 1px border, holding four 90px buttons whose left edges sit 6, 96,
// 186 and 276px into it (centres 51, 141, 231, 321); animation frames queued and run by hand, 60 a second, on a clock
// the test moves; pointer events dispatched by hand. Every expected value is typed from the ruling. How it feels on the
// phone is not in this file: only the phone shows it.
type Handler = (e: Record<string, unknown>) => void;
interface Glide { aim: () => void }
interface Button {
  classes: Set<string>;
  vars: Record<string, string>;
  clicks: number;
  click: () => void;
}
interface FakeBar {
  win: Record<string, unknown>;
  buttons: Button[];
  barClasses: Set<string>;
  pill: { style: Record<string, string> };
  frames: number;
  setClock: (ms: number) => void;
  run: (seconds: number, each?: () => void) => void;
  fire: (type: string, e: Record<string, unknown>) => void;
  left: () => number;
  width: () => number;
  scaleY: () => number;
}
function fakeBar(opts: { reduce?: boolean; active?: number } = {}): FakeBar {
  let clock = 0;
  let queued: ((t: number) => void)[] = [];
  const on: Record<string, Handler[]> = {};
  const barClasses = new Set<string>(['show']);
  const pill = { className: '', style: {} as Record<string, string>, setAttribute: () => {} };
  const buttons: Button[] = [0, 1, 2, 3].map((i) => {
    const b: Button & { getBoundingClientRect: () => object; classList: object; style: object } = {
      classes: new Set(i === (opts.active ?? 1) ? ['active'] : []),
      vars: {},
      clicks: 0,
      click: () => { b.clicks++; },
      getBoundingClientRect: () => ({ left: 19 + 90 * i, right: 109 + 90 * i, width: 90 }),
      classList: { contains: (c: string) => b.classes.has(c), add: (c: string) => b.classes.add(c), remove: (c: string) => b.classes.delete(c) },
      style: { setProperty: (k: string, v: string) => { b.vars[k] = v; } },
    };
    return b;
  });
  const bar = {
    firstChild: null, clientLeft: 1,
    appendChild: () => pill,
    querySelectorAll: (sel: string) => (sel === 'button' ? buttons : []),
    getBoundingClientRect: () => ({ left: 12 }),
    classList: { contains: (c: string) => barClasses.has(c), add: (c: string) => barClasses.add(c), remove: (c: string) => barClasses.delete(c) },
    addEventListener: (t: string, f: Handler) => { (on[t] ??= []).push(f); },
    setPointerCapture: () => {},
  };
  const win = {
    document: { getElementById: (id: string) => (id === 'tabBar' ? bar : null), createElement: () => pill },
    matchMedia: () => ({ matches: !!opts.reduce }),
    performance: { now: () => clock },
    requestAnimationFrame: (f: (t: number) => void) => { queued.push(f); return queued.length; },
    cancelAnimationFrame: () => { queued = []; },
    addEventListener: () => {},
  };
  const num = (re: RegExp, s: string | undefined): number => {
    const m = re.exec(s ?? '');
    assert.ok(m, 'no match for ' + String(re) + ' in ' + String(s));
    return Number(m[1]);
  };
  const fb: FakeBar = {
    win, buttons, barClasses, pill,
    get frames() { return queued.length; },
    setClock: (ms) => { clock = ms; },
    run: (seconds, each) => {
      for (let n = 0; n < Math.round(seconds * 60); n++) {
        clock += 1000 / 60;
        const now = queued; queued = [];
        now.forEach((f) => f(clock));
        each?.();
      }
    },
    fire: (type, e) => { for (const f of on[type] ?? []) f(e); },
    left: () => num(/translateX\(([-\d.]+)px\)/, pill.style['transform']),
    width: () => num(/^([-\d.]+)px$/, pill.style['width']),
    scaleY: () => num(/scaleY\(([-\d.]+)\)/, pill.style['transform']),
  };
  return fb;
}
const glideOn = (f: FakeBar): Glide => {
  const g = appFunction<(win: unknown) => Glide | null>('installTabGlide')(f.win);
  assert.ok(g, 'installTabGlide found no bar');
  g.aim();
  return g;
};
const moveActive = (f: FakeBar, to: number): void => { f.buttons.forEach((b, i) => { if (i === to) b.classes.add('active'); else b.classes.delete('active'); }); };
const at = (f: FakeBar, ms: number, type: string, clientX: number): void => { f.setClock(ms); f.fire(type, { pointerId: 1, clientX }); };

test('the pill opens on the active tab, 90px wide at 96px, its tab in full signal, with no frame asked', () => {
  const f = fakeBar();
  glideOn(f);
  assert.equal(f.left(), 96);
  assert.equal(f.width(), 90);
  assert.deepEqual(f.buttons.map((b) => b.vars['--on']), ['0.000', '1.000', '0.000', '0.000']);
  assert.equal(f.frames, 0);
});

test('a tab change glides there like liquid: it stretches past 1.2 tabs, overshoots under 4px and rests within 0.6 s', () => {
  const f = fakeBar();
  const g = glideOn(f);
  moveActive(f, 2);
  g.aim();
  let widest = 0, overshoot = -Infinity, bothLit = false;
  f.run(0.6, () => {
    widest = Math.max(widest, f.width());
    overshoot = Math.max(overshoot, f.left() + f.width() - 276);
    const a = Number(f.buttons[1]!.vars['--on']), b = Number(f.buttons[2]!.vars['--on']);
    if (a > 0 && a < 1 && b > 0 && b < 1) bothLit = true;
  });
  assert.ok(widest > 108, 'widest ' + widest);
  assert.ok(overshoot <= 4, 'overshoot ' + overshoot);
  assert.ok(bothLit, 'the colour passes from tab to tab');
  assert.equal(f.left(), 186);
  assert.equal(f.width(), 90);
  assert.equal(f.frames, 0, 'at rest it asks no more frames');
  assert.deepEqual(f.buttons.map((b) => b.vars['--on']), ['0.000', '0.000', '1.000', '0.000']);
});

test('with Reduce Motion the pill is on the new tab at once, with no frame asked', () => {
  const f = fakeBar({ reduce: true });
  const g = glideOn(f);
  moveActive(f, 2);
  g.aim();
  assert.equal(f.left(), 186);
  assert.equal(f.frames, 0);
});

test('a bar that was hidden comes back with the pill already on its tab', () => {
  const f = fakeBar();
  const g = glideOn(f);
  f.barClasses.delete('show');
  moveActive(f, 3);
  g.aim();
  assert.equal(f.left(), 96, 'hidden, it stays put');
  f.barClasses.add('show');
  g.aim();
  assert.equal(f.left(), 276);
  assert.equal(f.frames, 0);
});

test('a finger moved 5px grabs nothing; past 8px the bar marks itself dragging', () => {
  const f = fakeBar();
  glideOn(f);
  at(f, 0, 'pointerdown', 154);   // the second tab's centre, 141px into the bar
  at(f, 50, 'pointermove', 159);
  assert.ok(!f.barClasses.has('dragging'));
  at(f, 100, 'pointermove', 163);   // 9px
  assert.ok(f.barClasses.has('dragging'));
});

test('held 200px past the last tab, the pill rubber bands 23.2px past its centre and sits 8% taller', () => {
  const f = fakeBar();
  glideOn(f);
  at(f, 0, 'pointerdown', 154);
  at(f, 100, 'pointermove', 164);
  at(f, 200, 'pointermove', 534);   // 521px into the bar, 200px past 321
  f.run(1);
  assert.ok(Math.abs(f.left() + 45 - 344.2) < 0.3, 'centre ' + (f.left() + 45));
  assert.equal(f.scaleY(), 1.08);
  assert.ok(f.frames > 0, 'held, it keeps tracking the finger');
});

test('a release with no velocity opens the tab under the finger by clicking its button', () => {
  const f = fakeBar();
  glideOn(f);
  at(f, 0, 'pointerdown', 154);
  at(f, 100, 'pointermove', 164);
  at(f, 200, 'pointermove', 334);   // the fourth tab's centre
  at(f, 400, 'pointerup', 334);
  assert.deepEqual(f.buttons.map((b) => b.clicks), [0, 0, 0, 1]);
  assert.ok(!f.barClasses.has('dragging'));
});

test('a release at 1250 px/s from the third tab carries to the fourth', () => {
  const f = fakeBar();
  glideOn(f);
  at(f, 0, 'pointerdown', 154);
  at(f, 100, 'pointermove', 164);
  at(f, 200, 'pointermove', 224);
  at(f, 216, 'pointermove', 244);   // 20px in 16ms, at the third tab's centre
  at(f, 216, 'pointerup', 244);
  assert.deepEqual(f.buttons.map((b) => b.clicks), [0, 0, 0, 1]);
});

test('a tab that refuses sends the pill back; one that opens keeps it', () => {
  const refused = fakeBar();
  glideOn(refused);
  at(refused, 0, 'pointerdown', 154);
  at(refused, 100, 'pointermove', 164);
  at(refused, 200, 'pointermove', 334);
  at(refused, 400, 'pointerup', 334);   // the click opens nothing: the second tab stays active
  refused.run(1);
  assert.equal(refused.left(), 96);
  const opened = fakeBar();
  const g = glideOn(opened);
  opened.buttons[3]!.click = () => { moveActive(opened, 3); g.aim(); };   // what tabGo and updateTabBar do
  at(opened, 0, 'pointerdown', 154);
  at(opened, 100, 'pointermove', 164);
  at(opened, 200, 'pointermove', 334);
  at(opened, 400, 'pointerup', 334);
  opened.run(1);
  assert.equal(opened.left(), 276);
});

test('the tap a drag ends in opens nothing itself; a plain tap and the click the release makes pass', () => {
  const click = (f: FakeBar, isTrusted: boolean): boolean => {
    let stopped = false;
    f.fire('click', { isTrusted, stopPropagation: () => { stopped = true; }, preventDefault: () => {} });
    return stopped;
  };
  const dragged = fakeBar();
  glideOn(dragged);
  at(dragged, 0, 'pointerdown', 154);
  at(dragged, 100, 'pointermove', 164);
  at(dragged, 200, 'pointerup', 164);
  dragged.setClock(300);
  assert.equal(click(dragged, true), true, 'the real click 100ms after the drag');
  assert.equal(click(dragged, false), false, 'the release clicking the tab');
  const tapped = fakeBar();
  glideOn(tapped);
  at(tapped, 0, 'pointerdown', 154);
  at(tapped, 80, 'pointerup', 154);
  tapped.setClock(100);
  assert.equal(click(tapped, true), false);
});

test('the press listener is a passive touchstart on the document, so the phone shows every press', () => {
  const got: [string, unknown][] = [];
  const win = { document: { addEventListener: (t: string, _f: unknown, o: unknown) => { got.push([t, o]); } } };
  appFunction('installPressFeel')(win);
  assert.deepEqual(got.map(([t, o]) => [t, JSON.stringify(o)]), [['touchstart', '{"passive":true}']]);   // the page's own object
});

test('the page installs the press listener at load, and updateTabBar aims the pill each time it marks a tab', () => {
  const code = appScript().replace(/\/\/[^\n]*/g, '');
  assert.equal((code.match(/\binstallPressFeel\(window\);/g) || []).length, 1);
  const update = appScript().match(/\nfunction updateTabBar\([\s\S]*?\n\}/);
  assert.ok(update, 'no updateTabBar');
  assert.match(update[0], /installTabGlide\(window\)[^\n]*\.aim\(\)/);
});

test('the active tab carries no background of its own, and the pill carries the old one', () => {
  const css = readFileSync(APP, 'utf8');
  assert.doesNotMatch(css, /\.tabbar button\.active\{[^}]*background/);
  assert.match(css, /\.tab-pill\{[^}]*position:absolute[^}]*background:var\(--nav-on\)/);
});

test('every press that scales a control sinks over 100ms and springs back over 340ms', () => {
  const css = readFileSync(APP, 'utf8');
  assert.match(css, /--press-in:100ms;--press-out:340ms;--press-sink:cubic-bezier\(\.2,0,\.2,1\);--press-back:cubic-bezier\(\.34,1\.56,\.64,1\);/);
  const scaling = ['.change-btn', '.change-chip-act', '.ex-logbtn', '.ex-skipbtn', '.ex-swapbtn', '.hurt-btn', '.log-nudge-btn',
    '.new-prog-btn', '.ov-apply', '.ov-clear', '.pop-act', '.prog-action-btn', '.reassess-acts button', '.rt-btn', '.rt-reset',
    '.ss-minus', '.status-btn', '.swap-cand', '.wizard-next', '.wk-hero-cta', '.wk-rest-act'];
  const rest = /\n([^{}\n]+)\{transition:transform var\(--press-out\) var\(--press-back\);\}/.exec(css);
  const sink = /\n([^{}\n]+)\{transition-duration:var\(--press-in\);transition-timing-function:var\(--press-sink\);\}/.exec(css);
  assert.ok(rest && sink, 'the two press rules');
  assert.deepEqual(rest[1]!.split(','), scaling);
  assert.deepEqual(sink[1]!.split(','), scaling.map((s) => s + ':active'));
  assert.match(css, /\.tabbar button:active \.tab-ico\{transform:scale\(\.84\);transition-duration:var\(--press-in\)/);
});
