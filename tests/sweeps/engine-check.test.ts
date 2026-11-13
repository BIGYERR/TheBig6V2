// The engine check, whole (D286 P-ENGINECHECK, docs/decisions/engine-check.md): Run the check on the page as shipped
// builds HALF_MANNY and the 864 lattice configs, about 10 s under V8, and every digest matches; on a copy of the page
// with one lattice digest broken in its text, 863 match and that config is named. The clock runs free (a digest does
// not depend on it: tests/measure/engine-check_clock-and-time.js), so the time is read as whole seconds, not typed.
// Every other expected word is typed from the ruling. The fast cut is tests/integration/engine-check.test.ts.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, test } from 'vitest';
import { APP, loadApp, REPO } from '../support/app.ts';
import type { App } from '../support/app.ts';

let tmp = '';
afterAll(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

/** Runs the page's check to its end; the lines it showed and the zero timers it took. */
function runCheck(IA: App): { lines: string[]; ticks: number } {
  while (IA.flushTimers(1)) { /* the app's own boot timers first */ }
  const lines: string[] = [];
  IA.engineCheckListen((line: string) => lines.push(line));
  assert.equal(IA.engineCheckRun(), true);
  let ticks = 0;
  while (IA.flushTimers(1)) ticks++;
  return { lines, ticks };
}

test('the page as shipped: Lattice 864 of 864 match, Half Manny matches, in slices, no stored key touched', () => {
  const IA = loadApp();
  const { lines, ticks } = runCheck(IA);
  assert.equal(lines[0], 'Built 0 of 865.');
  assert.match(lines.at(-1)!, /^Lattice 864 of 864 match\. Half Manny matches\. Took \d+ s\.$/);
  assert.ok(ticks > 1, `more than one slice (${ticks})`);
  for (const l of lines.slice(1, -1)) assert.match(l, /^Built \d+ of 865\.$/);
  assert.equal(IA.localStorage._map.size, 0);
}, 120_000);

test('one lattice digest broken in the page\'s text: 863 of 864, and that config named first', () => {
  const html = readFileSync(APP, 'utf8');
  // The 100th lattice digest, as the golden file pins it for this config (index 99: healthy, the sixth tier, the
  // second focus, the first level, the first seed).
  const golden: Record<string, string> = JSON.parse(readFileSync(join(REPO, 'tests', 'snapshots', 'program-output-lattice.json'), 'utf8'));
  const digest = golden['healthy crossfit hypertrophy beginner seed=1013']!;
  assert.match(digest, /^[0-9a-f]{16}$/);
  assert.equal(html.split(`'${digest}'`).length - 1, 1, 'the page carries that digest once');
  tmp = mkdtempSync(join(tmpdir(), 'ia-engine-check-'));
  const broken = join(tmp, 'broken-digest.html');
  writeFileSync(broken, html.replace(`'${digest}'`, `'0000000000000000'`));
  const { lines } = runCheck(loadApp({ file: broken }));
  assert.match(lines.at(-1)!, /^Lattice 863 of 864 match\. Half Manny matches\. First miss: healthy crossfit hypertrophy beginner seed=1013\. Took \d+ s\.$/);
}, 120_000);
