// Engine modules, swept: the engine imported straight from the module sources (tests/support/engine-modules.ts) builds
// every program on the shared 864-config lattice (tests/lattice193.js FULL, on HALF_MANNY) with the digest the classic
// script builds, the golden tests/snapshots/program-output-lattice.json that tests/sweeps/program-output.test.ts holds
// against the harness. The fast cut is tests/integration/engine-modules.test.ts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, test, vi } from 'vitest';
import type { Cfg, Program } from '@ia/core';
import { fixtures, progDigest } from '../support/app.ts';
import { loadEngineModules } from '../support/engine-modules.ts';

interface LatticeCell {
  tag: string;
  over: Partial<Cfg>;
}
const LATTICE: { FULL: LatticeCell[] } = createRequire(import.meta.url)('../lattice193.js');
const SNAPSHOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'snapshots', 'program-output-lattice.json');
/** The day the golden file was built on (tests/sweeps/program-output.test.ts pins the same local noon). */
const TODAY = new Date(2026, 9, 11, 12, 0, 0);

let buildProgram: (cfg: Cfg) => Program;
beforeAll(async () => {
  vi.useFakeTimers({ now: TODAY, toFake: ['Date'] });
  ({ buildProgram } = await loadEngineModules());
});
afterAll(() => {
  vi.useRealTimers();
});

test('every program on the 864-config lattice, built by the engine modules, has the digest the classic script builds', () => {
  const golden = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as Record<string, string>;
  assert.equal(LATTICE.FULL.length, 864);
  const differ: string[] = [];
  for (const { tag, over } of LATTICE.FULL) {
    const cfg = { ...fixtures.HALF_MANNY, ...over } as Cfg;
    if (progDigest(buildProgram(cfg)) !== golden[tag]) differ.push(tag);
  }
  assert.deepEqual(differ, [], 'configs whose module-built program differs from the classic build');
});
