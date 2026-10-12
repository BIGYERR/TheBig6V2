'use strict';
// Core and trunk blocks, the slow half: the trunk floor on the day (D50) over the ruled 288-cell lattice (4 injuries x
// 6 tiers x 2 foci x 2 experiences x 3 seeds, V193's WIDE floor). The seed 76308 slice runs in
// tests/integration/core-trunk.test.js; CI runs this whole lattice.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, progDigest } = require('../support/app.js');
const CT = require('../support/core-trunk.js');

const IA = loadApp();

test('the trunk floor holds on every day of the 288-cell lattice', () => {
  const cells = CT.wideLattice();
  assert.equal(cells.length, 288);
  assert.equal(progDigest(IA.buildProgram(cells[0].cfg)), progDigest(IA.buildProgram(cells[0].cfg)), 'a cell is self-stable');
  const s = CT.trunkFloorScan(IA, cells);
  assert.ok(s.days > 20000, `the sweep is big enough to contain the defect: ${s.days} day builds`);
  assert.deepEqual(s.zeroTrunk.slice(0, 3), [], 'no day whose title claims trunk prints zero trunk items (L1)');
  assert.deepEqual(s.emptySec.slice(0, 3), [], 'no trunk section prints with zero items (L2)');
  assert.deepEqual(s.liftInWindow.slice(0, 3), [], 'no lifting section survives inside the race window (L3)');
  assert.deepEqual(s.tierALift.slice(0, 3), [], 'no trunk section on a long-run tier A day (L4)');
});
