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
// 2. It wrote nothing: the store holds the keys it held, value for value (the beta's copy is read only, D287).
// 3. The cutover's proof, kept beside it: core's launch on the same keys through a store that does write hands back the
//    same program, and leaves each key it changed as the page's own launch left it.
// 4. The seam reported an overlay that failed as often as the page showed its toast.
//
// The reference is today's page on purpose, as in tests/integration/native-this-week.test.ts: the page's launch stays
// the page's until the cutover. `launches` counts what was compared, so a test can say the check fired.
import assert from 'node:assert/strict';
import { refreshStoredProgram } from '@ia/core/engine/state-refresh.ts';
import type { StoredProgram } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import * as screen from '../../frontends/native/src/this-week/week-screen.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import { Phone } from './stored-state.ts';

/** Today's toast for an overlay that did not apply (program-manage.ts), typed here by hand. */
const TOAST = 'A plan change failed to apply. Flag it in Bugs.';

/** What the launches compared so far held. */
export const launches = { compared: 0, none: 0, wrote: 0, wroteKeys: 0, overlayFailed: 0 };

const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));
const filled = (keys: Record<string, string>): StateStore => { const s = sqliteTestStore(); for (const [k, v] of Object.entries(keys)) s.set(k, v); return s; };
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** One launch: the seam over `pre`, against the page `P` launched on those keys. */
export function sameLaunch(pre: Record<string, string>, P: Phone, what: string): void {
  const now: number = P.ev('Date.now()');
  const page = P.prog ? plain(P.prog) : null;
  const told = { overlay: 0, freeze: 0, rebuild: 0 };
  const report = { overlay: () => { told.overlay++; }, freeze: () => { told.freeze++; }, rebuild: () => { told.rebuild++; } };

  // 1 and 2: the seam, on the store the app hands it.
  const store = filled(pre);
  const grid = screen.liveProgram(store, now, report);
  if (!page) {
    assert.equal(grid, null, what + ': the page holds no program, and the seam hands one back');
    launches.none++;
    return;
  }
  assert.ok(grid, what + ': the page holds a program, and the seam hands back none');
  assert.deepStrictEqual(plain(grid), page, what + ': the program the seam hands back is not the one the page holds');
  assert.deepStrictEqual(held(store), pre, what + ': the seam wrote to its store');
  const toasts = P.toasts.filter((t) => t === TOAST).length;
  assert.equal(told.overlay, toasts, what + ': the seam reported ' + told.overlay + ' overlays that failed, the page showed its toast ' + toasts + ' times');
  launches.compared++;
  launches.overlayFailed += told.overlay;

  // 3: core's launch through a store that writes, as the app will call it once its store is the real one.
  const writing = filled(pre);
  const stored = screen.storedProgram(writing);
  assert.ok(stored, what + ': the stored program');
  const quiet = { overlay: () => {}, freeze: () => {}, rebuild: () => {} };
  assert.deepStrictEqual(plain(refreshStoredProgram(writing, stored as unknown as StoredProgram, now, quiet)), page, what + ': through a store that writes');
  const after = held(writing), post = P.dump();
  let wrote = 0;
  for (const k of new Set([...Object.keys(pre), ...Object.keys(after)])) {
    if (pre[k] === after[k]) continue;
    wrote++;
    assert.equal(after[k], post[k], what + ': the launch left ' + k + ' other than the page\'s own launch left it');
  }
  if (wrote) { launches.wrote++; launches.wroteKeys += wrote; }
}

const launch0 = Phone.prototype.launch;
Phone.prototype.launch = function (this: Phone, at: string, opts: { init?: boolean } = {}): Phone {
  if (opts.init === false) return launch0.call(this, at, opts);
  const pre = this.dump();
  launch0.call(this, at, opts);
  sameLaunch(pre, this, 'the launch at ' + at);
  return this;
};
