// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// The long-run day, every lattice whole: the claims tests/integration/long-run-day.test.js runs on a sample (D140, D153,
// D155, D156), here on every config the rulings were measured on. CI runs it, the 60-second check does not.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as T from '../support/long-run-day.ts';
test("D140's lattice whole (672 programs): every tier and both limbs populated; tier A mobility only and titled; tier B no leg item, no power, explosive or carry section, no power core pillar, 8 sets or fewer; no carry on any tier", () => {
  const X = T.tierTally(1);
  assert.equal(X.progs, 672);
  for (const t of ['A', 'B', 'C']) for (const limb of ['NSW', 'NRC']) assert.ok(X.n[t][limb] > 0, 'tier ' + t + ' ' + limb + ' ' + JSON.stringify(X.n));
  assert.ok(X.n.cPowerCore > 0, 'tier C days still deal a power core pillar');
  for (const k of Object.keys(X.bad)) assert.deepEqual(X.bad[k].slice(0, 5), [], k);
});

const L = T.hingeLattices();
function hingeClaims(name, list, reach) {
  const X = T.hingeTally(list);
  assert.equal(X.cfg, list.length, name + ' builds');
  assert.ok(X.tb > reach.tb && X.recFullBody > reach.rec, name + ': ' + X.tb + ' tier B days, ' + X.recFullBody + ' recovery-week loaded Full Body days');
  assert.deepEqual(X.zero.slice(0, 5), [], name + ': tier B days with no lift section');
  assert.deepEqual(X.hinge, {}, name + ': hinges on tier B days');
  assert.ok(X.hingeElse > 0, name + ': the hand list sees hinges off tier B');
  assert.deepEqual(X.over8.slice(0, 5), [], name + ': over 8 sets');
  assert.ok(X.g6n > 0, name + ': D155 days reached');
  assert.deepEqual(X.g6bad.slice(0, 5), [], name + ': D155 days without an Upper superset');
  return X;
}

test('NRC, 4,200 configs: no tier B long-run day without lifting or with a hinge, 8 sets at most, and the recovery-week loaded full-body day keeps its Upper superset', () => {
  hingeClaims('NRC', L.NRC, { tb: 1000, rec: 50 });
});

test('NSW, 3,600 configs: the same, and no Arms or Delts finisher on a long day', () => {
  const X = hingeClaims('NSW', L.NSW, { tb: 1000, rec: 50 });
  assert.deepEqual(X.finisher.slice(0, 5), []);
});

test("D153's population, 240 configs (where Cable pull-through once printed on a tier B day): no hinge, no empty tier B day, the Upper superset kept", () => {
  hingeClaims('D153', L.D153, { tb: 100, rec: 10 });
});

test('the loaded full-body slice on two more seeds (960) and with a bike or a swim (240): no Arms or Delts finisher on a long day, and every tier B long day lifts, at 8 sets or fewer', () => {
  const F = T.finisherLattices();
  assert.deepEqual([F.seeds.length, F.multi.length], [960, 240]);
  for (const [name, list] of [['seeds', F.seeds], ['multi', F.multi]]) {
    const X = T.hingeTally(list);
    assert.deepEqual(X.finisher.slice(0, 5), [], name);
    assert.ok(X.tb > 0, name + ' tier B days');
    assert.deepEqual(X.zero.slice(0, 5), [], name);
    assert.deepEqual(X.over8.slice(0, 5), [], name);
  }
});
