// The engine check (D286 P-ENGINECHECK, docs/decisions/engine-check.md): core's logic, with no page. The SHA-256 against
// the FIPS 180-2 examples (typed here) and Node's own crypto; the digest against the tests' progDigest; the shipped
// digests and cases against the golden files, tests/lattice193.js and fixtures.HALF_MANNY; the slices on a clock that
// moves 10 ms a reading; and the lines, every expected string typed from the ruling.
//
// When a ruling regenerates program output, the digest test here is red until `node tools/engine-check-digests.mjs` has
// written core/src/engine/engine-check-digests.ts again: the phone may never compare against digests CI no longer pins.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import type { Cfg } from '@ia/core';
import {
  engineCheckBase, engineCheckBegin, engineCheckCases, engineCheckDigest, engineCheckLine, engineCheckSlice, sha256Hex,
} from '../../core/src/engine/engine-check.ts';
import type { EngineCheckCase } from '../../core/src/engine/engine-check.ts';
import { ENGINE_CHECK_LATTICE_DIGESTS, ENGINE_CHECK_MANNY_DIGEST } from '../../core/src/engine/engine-check-digests.ts';
import { fixtures, progDigest, REPO } from '../support/app.ts';

const require = createRequire(import.meta.url);
const LATTICE: { FULL: { tag: string; over: Partial<Cfg> }[] } = require('../lattice193.js');
const GOLDEN_LATTICE: Record<string, string> = JSON.parse(readFileSync(join(REPO, 'tests', 'snapshots', 'program-output-lattice.json'), 'utf8'));
const GOLDEN_PROGRAMS: { programs: Record<string, { digest: string }> } = JSON.parse(readFileSync(join(REPO, 'tests', 'snapshots', 'program-output.json'), 'utf8'));
const nodeSha = (s: string) => createHash('sha256').update(s).digest('hex');

describe('the SHA-256', () => {
  test('gives the FIPS 180-2 example digests', () => {
    assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    assert.equal(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
    assert.equal(sha256Hex('a'.repeat(1000000)), 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
  });

  test('hashes a string as its UTF-8 bytes, as Node does, across every padding length', () => {
    for (const s of ['×', '—', '€', '😀', 'Squat 4×5 — RPE 8', 'a\u{1F3C3}b', '\uD800', 'x\uDC00y']) assert.equal(sha256Hex(s), nodeSha(s), JSON.stringify(s));
    for (let n = 0; n < 130; n++) assert.equal(sha256Hex('é'.repeat(n)), nodeSha('é'.repeat(n)), `${n} two-byte characters`);
  });
});

describe('the digest', () => {
  test('is the tests\' progDigest: the program without id, created and its swap universe, its first 16 hex', () => {
    const prog = { id: 'prog_9', created: 1794522563029, name: 'X', weeks: { '1': { mon: { title: 'Lift' } } }, _swapUniverse: ['a'], _swapUniverseByKey: { k: ['b'] } };
    const expected = nodeSha('{"name":"X","weeks":{"1":{"mon":{"title":"Lift"}}}}').slice(0, 16);
    assert.equal(engineCheckDigest(prog as never), expected);
    assert.equal(progDigest(prog as never), expected);
  });
});

describe('what the check builds', () => {
  const cases = engineCheckCases();

  test('HALF_MANNY first, as the tests pin it, with its golden digest', () => {
    assert.equal(cases.length, 865);
    assert.deepEqual(engineCheckBase(), fixtures.HALF_MANNY);
    assert.equal(cases[0]!.tag, 'Half Manny');
    assert.equal(cases[0]!.manny, true);
    assert.deepEqual(cases[0]!.cfg, fixtures.HALF_MANNY);
    assert.equal(ENGINE_CHECK_MANNY_DIGEST, '147f083be4e04e34');
    assert.equal(cases[0]!.digest, GOLDEN_PROGRAMS.programs['half-manny (Mario, NRC half, crossfit)']!.digest);
  });

  test('then the 864 lattice configs in the lattice\'s order, each laid over HALF_MANNY', () => {
    assert.equal(LATTICE.FULL.length, 864);
    assert.deepEqual(cases.slice(1, 7).map((c) => c.tag), [
      'healthy bodyweight support_prevention beginner seed=1013',
      'healthy bodyweight support_prevention beginner seed=3039',
      'healthy bodyweight support_prevention beginner seed=76308',
      'healthy bodyweight support_prevention intermediate seed=1013',
      'healthy bodyweight support_prevention intermediate seed=3039',
      'healthy bodyweight support_prevention intermediate seed=76308',
    ]);
    assert.equal(cases[864]!.tag, 'lowback/workaround crossfit hypertrophy advanced seed=76308');
    LATTICE.FULL.forEach((cell, i) => {
      const c = cases[i + 1]!;
      assert.equal(c.tag, cell.tag);
      assert.equal(c.manny, false);
      assert.deepEqual(c.cfg, { ...fixtures.HALF_MANNY, ...cell.over }, cell.tag);
    });
  });

  test('the shipped digests are the golden files, entry for entry', () => {
    assert.equal(ENGINE_CHECK_LATTICE_DIGESTS.length, 864);
    assert.equal(Object.keys(GOLDEN_LATTICE).length, 864);
    LATTICE.FULL.forEach((cell, i) => {
      assert.equal(ENGINE_CHECK_LATTICE_DIGESTS[i], GOLDEN_LATTICE[cell.tag], `${cell.tag}: run node tools/engine-check-digests.mjs`);
      assert.equal(cases[i + 1]!.digest, GOLDEN_LATTICE[cell.tag]);
    });
  });

  test('the digests file is what tools/engine-check-digests.mjs writes', async () => {
    const tool = (await import(join(REPO, 'tools', 'engine-check-digests.mjs'))) as { engineCheckDigestsText(): string };
    assert.equal(readFileSync(join(REPO, 'core', 'src', 'engine', 'engine-check-digests.ts'), 'utf8'), tool.engineCheckDigestsText(), 'run node tools/engine-check-digests.mjs');
  });
});

describe('a check in slices', () => {
  // Nine cases, HALF_MANNY's first: each builds { n } and pins the digest of {"n":<n>} (Node's SHA-256 of that JSON).
  const pin = (n: number) => nodeSha(`{"n":${n}}`).slice(0, 16);
  const nine = (): EngineCheckCase[] => Array.from({ length: 9 }, (_, n) => ({
    tag: n === 0 ? 'Half Manny' : `cell ${n}`, cfg: { seed: n } as never, digest: pin(n), manny: n === 0,
  }));
  const build = (cfg: { seed?: number }) => ({ n: cfg.seed, id: 'x', created: 7 }) as never;
  /** A clock that reads 0, 10, 20, … ms, one step a reading. */
  const ticking = () => { let t = -10; return () => (t += 10); };

  test('builds until 40 ms have passed, so nine cases take three slices of 4, 4 and 1', () => {
    const run = engineCheckBegin(nine(), 0);
    const now = ticking();
    assert.equal(engineCheckLine(run), 'Built 0 of 9.');
    assert.equal(engineCheckSlice(run, build, now), false);
    assert.equal(run.next, 4);
    assert.equal(engineCheckLine(run), 'Built 4 of 9.');
    assert.equal(engineCheckSlice(run, build, now), false);
    assert.equal(run.next, 8);
    assert.equal(engineCheckSlice(run, build, now), true);
    assert.equal(run.next, 9);
    // Readings: slice 1 reads 0 (start) then 10, 20, 30, 40; slice 2 reads 50 then 60, 70, 80, 90; slice 3 reads 100,
    // 110 after its one build, and 120 when it ends.
    assert.equal(run.endedAt, 120);
  });

  test('a slice builds at least one case, however slow', () => {
    const run = engineCheckBegin(nine(), 0);
    let t = 0;
    assert.equal(engineCheckSlice(run, build, () => (t += 1000)), false);
    assert.equal(run.next, 1);
  });

  test('every case matching reads the counts and the time', () => {
    const run = engineCheckBegin(nine(), 0);
    let t = 0;
    while (!engineCheckSlice(run, build, () => (t += 700))) { /* slices */ }
    // 700 ms a reading: one build a slice, nine slices of two readings, and one more when it ends, 19 x 700 = 13,300 ms.
    assert.equal(run.endedAt, 13300);
    assert.equal(engineCheckLine(run), 'Lattice 8 of 8 match. Half Manny matches. Took 13 s.');
  });

  test('a broken lattice digest is counted out and named first', () => {
    const cases = nine();
    cases[3] = { ...cases[3]!, digest: '0000000000000000' };
    cases[6] = { ...cases[6]!, digest: 'ffffffffffffffff' };
    const run = engineCheckBegin(cases, 0);
    while (!engineCheckSlice(run, build, ticking())) { /* slices */ }
    assert.equal(run.latticeMatched, 6);
    assert.equal(engineCheckLine(run), 'Lattice 6 of 8 match. Half Manny matches. First miss: cell 3. Took 0 s.');
  });

  test('HALF_MANNY broken reads as its own miss, first', () => {
    const cases = nine();
    cases[0] = { ...cases[0]!, digest: '0000000000000000' };
    cases[2] = { ...cases[2]!, digest: '0000000000000000' };
    const run = engineCheckBegin(cases, 0);
    while (!engineCheckSlice(run, build, ticking())) { /* slices */ }
    assert.equal(engineCheckLine(run), 'Lattice 7 of 8 match. Half Manny does not match. First miss: Half Manny. Took 0 s.');
  });

  test('a build that throws is a miss, and the check goes on', () => {
    const run = engineCheckBegin(nine(), 0);
    const throwsOnFive = (cfg: { seed?: number }) => { if (cfg.seed === 5) throw new Error('boom'); return build(cfg); };
    while (!engineCheckSlice(run, throwsOnFive as never, ticking())) { /* slices */ }
    assert.equal(run.next, 9);
    assert.equal(engineCheckLine(run), 'Lattice 7 of 8 match. Half Manny matches. First miss: cell 5. Took 0 s.');
  });

  test('rounds the time to whole seconds', () => {
    const cases = nine().slice(0, 2);
    for (const [end, words] of [[1499, 'Took 1 s.'], [1500, 'Took 2 s.'], [14400, 'Took 14 s.']] as const) {
      const run = engineCheckBegin(cases, 0);
      let reads = 0;
      engineCheckSlice(run, build, () => (++reads >= 3 ? end : 0));
      assert.equal(run.endedAt, end);
      assert.ok(engineCheckLine(run).endsWith(words), engineCheckLine(run));
    }
  });
});
