// The tab bar stays at the bottom after the on-screen keyboard closes: installKeyboardResync (rest-day-shell.ts), D256
// (docs/decisions/tab-bar.md). iOS 26 leaves the layout viewport stale once the keyboard closes, and fixed elements
// drift when the page scrolls up; a real scroll, one point and a frame later back, makes WebKit recompute them.
//
// The function is lifted out of the page and run on a hand-built window: a visual viewport whose height the test sets,
// a document whose focused element the test sets, scrollTo recorded, timers and animation frames queued and run by hand. Every expected call
// is typed from the ruling. WebKit's own behaviour is not in this file: only the phone shows it.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { appFunction, appScript } from '../support/app.ts';

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
