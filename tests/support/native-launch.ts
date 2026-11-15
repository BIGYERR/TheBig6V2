// Imported first, it makes every launch of every test phone (support/stored-state.ts) a launch of the Expo app's seam
// too, and holds the two equal. A file that imports this, then a stored-state test file, runs that file's histories
// with the check on (tests/integration/native-this-week.test.ts and the sweep of that name), as support/sqlite-phone.ts
// does for the store.
//
// At each launch, with the keys as they stood BEFORE the page launched, in the Expo app's SQLite store
// (support/sqlite-kv.ts) and at the page's own instant:
//
// 1. liveProgram (frontends/native/src/this-week/week-screen.ts) hands back the program today's page holds after its
//    launch (activeProg), whole, every field; or none where the page holds none.
// 2. Its store then holds every ia_ key as the page's own launch left it, value for value (D289: the launch is
//    handed the store itself, and writes what today's launch writes: the active program put right, the lift log's
//    old keys folded, an older program repaired, the day edits of frozen weeks dropped).
// 3. The seam reported an overlay that failed as often as the page showed its toast.
//
// The reference is today's page on purpose, as in tests/integration/native-this-week.test.ts: the page's launch stays
// the page's until the cutover. The page's timers are not run by a launch here (the day-after reminder waits 600 ms),
// so what they write is in neither. `launches` counts what was compared, so a test can say the check fired.
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import * as screen from '../../frontends/native/src/this-week/week-screen.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import { Phone } from './stored-state.ts';

/** Today's toast for an overlay that did not apply (program-manage.ts), typed here by hand. */
const TOAST = 'A plan change failed to apply. Flag it in Bugs.';

/** What the launches compared so far held. */
export const launches = { compared: 0, none: 0, wrote: 0, wroteKeys: 0, overlayFailed: 0, families: {} as Record<string, number> };

const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));
const filled = (keys: Record<string, string>): StateStore => { const s = sqliteTestStore(); for (const [k, v] of Object.entries(keys)) s.set(k, v); return s; };
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** One launch: the seam over `pre`, against the page `P` launched on those keys. */
export function sameLaunch(pre: Record<string, string>, P: Phone, what: string): void {
  const now: number = P.ev('Date.now()');
  const page = P.prog ? plain(P.prog) : null;
  const told = { overlay: 0, freeze: 0, rebuild: 0 };
  const report = { overlay: () => { told.overlay++; }, freeze: () => { told.freeze++; }, rebuild: () => { told.rebuild++; } };

  const store = filled(pre);
  const grid = screen.liveProgram(store, now, report);
  const after = held(store), post = P.dump();
  // 2: every key, as the page's own launch left it.
  assert.deepStrictEqual(after, post, what + ': the launch left the store other than the page\'s own launch left it');
  const wrote = [...new Set([...Object.keys(pre), ...Object.keys(after)])].filter((k) => pre[k] !== after[k]);
  if (wrote.length) {
    launches.wrote++;
    launches.wroteKeys += wrote.length;
    for (const k of wrote) { const f = k.replace(/_prog_.*$/, '_'); launches.families[f] = (launches.families[f] || 0) + 1; }
  }
  if (!page) {
    assert.equal(grid, null, what + ': the page holds no program, and the seam hands one back');
    launches.none++;
    return;
  }
  assert.ok(grid, what + ': the page holds a program, and the seam hands back none');
  assert.deepStrictEqual(plain(grid), page, what + ': the program the seam hands back is not the one the page holds');
  const toasts = P.toasts.filter((t) => t === TOAST).length;
  assert.equal(told.overlay, toasts, what + ': the seam reported ' + told.overlay + ' overlays that failed, the page showed its toast ' + toasts + ' times');
  launches.compared++;
  launches.overlayFailed += told.overlay;
}

const launch0 = Phone.prototype.launch;
Phone.prototype.launch = function (this: Phone, at: string, opts: { init?: boolean } = {}): Phone {
  if (opts.init === false) return launch0.call(this, at, opts);
  const pre = this.dump();
  launch0.call(this, at, opts);
  sameLaunch(pre, this, 'the launch at ' + at);
  return this;
};
