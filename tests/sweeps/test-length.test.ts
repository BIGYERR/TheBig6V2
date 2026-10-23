// The test length lattices whole (CI only), in both zones: tests/integration/test-length.test.js runs each claim on a
// sample. Ruling D184 (P-TESTLEN), with D187 R3's refusal. Oracles as in the integration file: Monday week arithmetic
// on integer civil days, 26 typed from the ruling, the ruling's sentences, dates printed by Intl in UTC.
process.env.TZ = 'America/New_York';
import { test, describe, beforeAll } from 'vitest';
import assert from 'node:assert/strict';
import * as L from '../support/test-length.ts';
for (const [zone, tz] of [['New York', 'America/New_York'], ['UTC', 'UTC']]) {
  describe('in ' + zone, () => {
    let V: L.WizardVM;
    beforeAll(() => { process.env.TZ = tz; V = L.wizardVM('2026-09-22', 21, 16); });

    test('the length lattice: weeks 1 to 26 print the test week on every surface, 27 to 30 the goal length and the interim sentence', () => {
      // B1248 and K27: 8 goals x 3 experience x 2 mile states x test weeks 1..30 = 1,440 cells; the refusal population
      // (a non-beginner with no mile) is exactly 2 x 1 x 8 x 26 = 416 inside Table 6 and 2 x 1 x 8 x 4 = 64 past it.
      V.today('2026-09-22');
      const weeks = Array.from({ length: 30 }, (_, i) => i + 1);
      let inN = 0, outN = 0, refuseIn = 0, refuseOut = 0; const bad = [];
      for (const g of L.LENGTH_GROUPS) {
        const r = L.lengthGroup(V, g, weeks);
        inN += r.inN; outN += r.outN; refuseIn += r.refuseIn; refuseOut += r.refuseOut; bad.push(...r.bad);
      }
      assert.deepEqual([inN, outN, refuseIn, refuseOut], [1248, 192, 416, 64]);
      assert.deepEqual(bad, []);
    });

    test('every point of the snap lattice: (c) points keep the entered day with holdsTest, no other point moves', () => {
      // R1: 120,050 points
      const r = L.resolverPoints(V, L.SNAP_LATTICE);
      assert.deepEqual([r.cN, r.cOk, r.moved], [1206, 1206, 0]);
      assert.deepEqual(r.bad, []);
    });

    test('every (c) cell of the 1.5 mi goal at every experience level builds one week from the entered day with only the trial', () => {
      // R2: 603 cells x 3 = 1,809 builds, no sampling
      const r = L.snapBuilds(V, L.C_CELLS, L.EXPERIENCE);
      assert.equal(r.n, 1809);
      assert.deepEqual(r.seg, { '==': 63, '>': 1701, '<': 45 });
      assert.deepEqual(r.bad, []);
    });

    test('every (c) cell: the name step sentence and the race date card', () => {
      // R3, R4: 603 cells (21 entered today, 567 after, 15 before)
      const n = L.snapNameStep(V, L.C_CELLS);
      assert.deepEqual(n.seg, { '==': 21, '>': 567, '<': 15 });
      assert.deepEqual(n.bad, []);
      const c = L.snapCallout(V, L.C_CELLS);
      assert.deepEqual(c.bad, []);
    });
  });
}
