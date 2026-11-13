// The engine check on the page (D286 P-ENGINECHECK, docs/decisions/engine-check.md): the Engine row on the Bugs screen,
// and what Run the check writes there. Fast: the page's case list is cut to HALF_MANNY and the first six lattice configs
// (the whole 865 runs in tests/sweeps/engine-check.test.ts). Every expected line is typed from the ruling. The date is
// pinned, and the check times itself on performance.now(), which each test sets: still, a check takes one slice and
// reads "Took 0 s."; moving 50 ms a reading, it takes one build a slice.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { beforeEach, describe, test } from 'vitest';
import { loadApp, pinClock, REPO } from '../support/app.ts';
import type { App } from '../support/app.ts';

const SEVEN = 'var _allCases = engineCheckCases; engineCheckCases = function(){ return _allCases().slice(0, 7); };';
/** Runs every timer the check queued; the count of zero timers it took. */
const finish = (IA: App) => { let n = 0; while (IA.flushTimers(1)) n++; return n; };

describe('the Engine row on the Bugs screen', () => {
  test('sits after Your data and before the version line, with its label, note, button and an empty line', () => {
    const IA = loadApp();
    const html: string = IA['html'];
    const bugs = html.slice(html.indexOf('<div class="screen" id="screenBugs">'), html.indexOf('<!-- BOTTOM TAB BAR -->'));
    const row = bugs.slice(bugs.indexOf('aria-label="Engine"'), bugs.indexOf('id="bugVersion"'));
    assert.ok(bugs.indexOf('aria-label="Your data"') < bugs.indexOf('aria-label="Engine"'), 'after Your data');
    assert.match(row, /<div class="look-lbl">Engine<\/div>/);
    assert.match(row, /<div class="look-note">Builds the tested programs on this phone\. Each one must match\.<\/div>/);
    assert.match(row, /<button class="look-opt" id="engineCheckRun" onclick="engineCheckRun\(\)">Run the check<\/button>/);
    assert.match(row, /<div class="look-note" id="engineCheckMsg" aria-live="polite"><\/div>/);
  });
});

describe('Run the check on the page', () => {
  let IA: App;
  let perfNow: () => number;
  beforeEach(() => {
    IA = loadApp({ dom: true });
    pinClock(IA, new Date(2026, 10, 12, 9, 0, 0));
    perfNow = () => 1000;
    IA.window['performance'] = { now: () => perfNow() };
    finish(IA);   // the app's own boot timers, so what follows counts the check's alone
  });

  test('times itself on performance.now, so a frozen date still gives slices: one build a slice at 50 ms a reading', () => {
    IA.eval(SEVEN);
    let t = 0;
    perfNow = () => (t += 50);
    IA.engineCheckRun();
    assert.equal(finish(IA), 7);
    // Readings: 50 at the start; two a slice (100 and 150 … 700 and 750); 800 at the end. 800 - 50 = 750 ms, 1 s.
    assert.equal(IA.els['engineCheckMsg'].textContent, 'Lattice 6 of 6 match. Half Manny matches. Took 1 s.');
  });

  test('every digest matching: the counts, and the button back to Run the check', () => {
    IA.eval(SEVEN);
    assert.equal(IA.engineCheckRun(), true);
    assert.equal(IA.els['engineCheckMsg'].textContent, 'Built 0 of 7.');
    assert.equal(IA.els['engineCheckRun'].textContent, 'Checking');
    assert.equal(finish(IA), 1);
    assert.equal(IA.els['engineCheckMsg'].textContent, 'Lattice 6 of 6 match. Half Manny matches. Took 0 s.');
    assert.equal(IA.els['engineCheckRun'].textContent, 'Run the check');
  });

  test('a lattice digest broken on purpose: counted out and named', () => {
    IA.eval(SEVEN + ' var _cut = engineCheckCases; engineCheckCases = function(){ var c = _cut(); c[3].digest = "0000000000000000"; return c; };');
    IA.engineCheckRun();
    finish(IA);
    assert.equal(IA.els['engineCheckMsg'].textContent,
      'Lattice 5 of 6 match. Half Manny matches. First miss: healthy bodyweight support_prevention beginner seed=76308. Took 0 s.');
  });

  test('HALF_MANNY\'s digest broken on purpose: its own miss, first', () => {
    IA.eval(SEVEN + ' var _cut = engineCheckCases; engineCheckCases = function(){ var c = _cut(); c[0].digest = "0000000000000000"; return c; };');
    IA.engineCheckRun();
    finish(IA);
    assert.equal(IA.els['engineCheckMsg'].textContent, 'Lattice 6 of 6 match. Half Manny does not match. First miss: Half Manny. Took 0 s.');
  });

  test('a tap while it runs does nothing; a finished check runs again', () => {
    IA.eval(SEVEN);
    assert.equal(IA.engineCheckRun(), true);
    assert.equal(IA.engineCheckRun(), false);
    assert.equal(finish(IA), 1);
    assert.deepEqual({ ...IA.engineCheckNow() }, { line: 'Lattice 6 of 6 match. Half Manny matches. Took 0 s.', running: false });
    assert.equal(IA.engineCheckRun(), true);
    assert.deepEqual({ ...IA.engineCheckNow() }, { line: 'Built 0 of 7.', running: true });
    finish(IA);
  });

  test('a listener takes the lines in place of the page\'s row', () => {
    IA.eval(SEVEN);
    const lines: [string, boolean][] = [];
    IA.engineCheckListen((line: string, running: boolean) => lines.push([line, running]));
    IA.engineCheckRun();
    finish(IA);
    assert.deepEqual(lines, [['Built 0 of 7.', true], ['Lattice 6 of 6 match. Half Manny matches. Took 0 s.', false]]);
    assert.equal(IA.els['engineCheckMsg'], undefined, 'the page\'s row is never asked for');
  });

  test('reads and writes no stored key: a backup\'s keys stay as they were, byte for byte', () => {
    const backup = JSON.parse(gunzipSync(readFileSync(join(REPO, 'tests', 'snapshots', 'backups', 'v0.261.0.json.gz'))).toString('utf8'));
    for (const [k, v] of Object.entries(backup.data as Record<string, string>)) IA.localStorage.setItem(k, v);
    const before = JSON.stringify([...IA.localStorage._map.entries()]);
    assert.equal(IA.localStorage._map.size, 8);
    const ls = IA.localStorage as unknown as Record<string, (...a: unknown[]) => unknown>;
    let calls = 0;
    for (const k of ['getItem', 'setItem', 'removeItem', 'key', 'clear']) {
      const real = ls[k]!;
      ls[k] = (...a: unknown[]) => { calls++; return real.apply(ls, a); };
    }
    IA.eval(SEVEN);
    IA.engineCheckRun();
    finish(IA);
    assert.equal(calls, 0);
    assert.equal(JSON.stringify([...IA.localStorage._map.entries()]), before);
  });
});
