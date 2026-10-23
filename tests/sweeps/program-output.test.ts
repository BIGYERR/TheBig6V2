// Program output, swept: the digest of every program on the shared 864-config lattice (tests/lattice193.js FULL:
// eight injury cells, six equipment tiers, two focuses, three experience levels, three seeds, on HALF_MANNY) is a
// golden value in tests/snapshots/program-output-lattice.json. It replaces the legacy identity fuzz (tests/fuzz.sh,
// deleted in phase 3), which compared random programs between a build and the previous release: here any change to
// what the engine prescribes, on any of the 864 programs, turns this test red and shows as a reviewable diff of that
// file. The fast cut is tests/integration/program-output.test.ts (HALF_MANNY and nine seeded configs).
//
// Oracles: the golden file (regenerated only when a ruling moves program output: UPDATE_SNAPSHOTS=1, then review the
// git diff); each program built twice and equal to itself; the config untouched by the build.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { fixtures, loadApp, pinClock, progDigest } from '../support/app.ts';
import { matchSnapshot } from '../support/snapshot.ts';

interface LatticeCell {
  tag: string;
  over: Partial<Cfg>;
}
const LATTICE: { FULL: LatticeCell[]; FULL_N: number } = createRequire(import.meta.url)('../lattice193.js');

const IA = loadApp();
pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));

test('every program on the 864-config lattice equals itself built twice, leaves its config unchanged, and matches its golden digest', () => {
  assert.equal(LATTICE.FULL.length, 864, 'the lattice is 8 injury cells x 6 tiers x 2 focuses x 3 levels x 3 seeds');
  const digests: Record<string, string> = {};
  const unstable: string[] = [];
  const mutated: string[] = [];
  for (const { tag, over } of LATTICE.FULL) {
    const cfg = { ...fixtures.HALF_MANNY, ...over } as Cfg;
    const before = JSON.stringify(cfg);
    const first = progDigest(IA.buildProgram(cfg));
    const second = progDigest(IA.buildProgram(cfg));
    if (first !== second) unstable.push(tag);
    if (JSON.stringify(cfg) !== before) mutated.push(tag);
    assert.ok(!(tag in digests), `lattice tags are unique: ${tag}`);
    digests[tag] = first;
  }
  assert.deepEqual(unstable, [], 'a program that differs from itself built twice cannot be compared');
  assert.deepEqual(mutated, [], 'buildProgram never mutates the config it is given');
  matchSnapshot('program-output-lattice', digests);
});
