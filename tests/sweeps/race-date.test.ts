// The block open lattices whole (CI only): tests/integration/race-date.test.js runs each claim on a sample. Ruling
// D180 (P-BLOCKOPEN). Oracles as in the integration file: the Nike plan lengths and Monday arithmetic for a race
// program's start, the days before Thu 2026-09-24 by date arithmetic, and the ruling's blast radius: of the 365 aligned
// rows, 209 hold days outside (5K 25, 10K 25, half 67, marathon 91, HALF_MANNY 1).
process.env.TZ = 'America/New_York';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as R from '../support/race-date.ts';
test('every row of the refreshProgram lattice: aligned rows carry blockOpen, others carry no key, and the days held outside are the date-arithmetic set', () => {
  // I1a, I1b, I1c: 402 rows
  const L = R.lattice(R.LROWS);
  assert.deepEqual([R.LROWS.length, L.aligned, L.carry, L.plain, L.clean], [402, 365, 365, 37, 37]);
  assert.deepEqual(L.moves, { fixture: 1, run_5k: 25, run_10k: 25, run_half: 67, run_marathon: 91 });
  assert.deepEqual(L.startOff, []);
  assert.deepEqual(L.flips, []);
});

test('every wizard row lands on week 1 as it renders after a reboot and as its own program renders; every race row lands with its days before today greyed', () => {
  // I3a, I3b, I3c, I3d: 46 rows, 24 aligned, 16 of them with days before today in week 1
  const out = R.wizardRun(R.WROWS);
  assert.equal(out.length, 46);
  const aligned = out.filter(o => o.row.aligned);
  assert.deepEqual([aligned.length, aligned.filter(o => o.hPre).length], [24, 16]);
  for (const o of out) {
    assert.equal(o.cw, 1, o.row.name);
    assert.ok(o.landing && o.landing === o.rbW1, o.row.name);
    assert.equal(o.landing, o.capW1, o.row.name);
    assert.equal(o.keysDiff, 'overlays', o.row.name);
  }
  for (const o of aligned) assert.deepEqual([o.stored.blockOpen, o.stored.startDate, R.parseWeek(o.landing).pre], [R.TODAY_ISO, o.hStart, o.hPre], o.row.name);
  assert.equal(R.parseWeek(out.find(o => /HALF_MANNY/.test(o.row.name))!.landing).done, '0 /0 Done');
});
