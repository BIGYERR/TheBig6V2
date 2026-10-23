// The adjacent-day dedupe on the full calendar lattice (CI only; tests/integration/adjacent-day-dedupe.test.js runs a
// sample). Rulings: D160, D167, D167a, D171, D212. Helpers and lattice: tests/support/adjacent-day-dedupe.js.
//
// One pass: every config of D160's phantom lattices (NRC 3,600, NRC multi 600, NSW 3,600, injury 480) and its
// multi-sport limb (gk pace+bike 1,080, NSW multi 4,200), plus the D167 sweep (all 3,900 Sunday-training configs and
// every 8th of the 11,280 Sunday-rest configs, 1,410), each built once on the instrumented app; the swept configs are
// also built on the app with the legacy walk put back.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as D from '../support/duplicate-movements.ts';
import * as A from '../support/adjacent-day-dedupe.ts';
const U = A.calendarLattice();
const CELLS = U.filter((x) => x.swept || A.PHANTOM_LATTICE[x.mix] || A.multiLimb(x.mix));
let T: A.Survey | undefined;
function survey(): A.Survey {
  if (T) return T;
  const text = D.appText();
  T = A.surveyCalendar(CELLS, { inst: A.instrumentedApp(text), lw: A.legacyWalkApp(text) });
  return T;
}

test('the calendar lattice is 15,180 configs; the D167 sweep reads 3,900 Sunday-training and 1,410 Sunday-rest', () => {
  assert.equal(U.length, 15180);
  assert.equal(U.filter((x) => x.swept && !x.sunRest).length, 3900);
  assert.equal(U.filter((x) => x.swept && x.sunRest).length, 1410);
});

test('every config builds and buildProgram leaves every config unchanged', () => {
  const S = survey();
  assert.deepEqual(S.crash.slice(0, 3), []);
  assert.equal(S.cfg, CELLS.length);
  assert.deepEqual(S.cfgMutated.slice(0, 3), []);
  assert.deepEqual(S.lwCrash.slice(0, 3), []);
});

test('no rename dodges a name the shipped long-run previous day does not print, on each D160 lattice', () => {
  const S = survey();
  const want: Record<string, number> = { NRC: 3600, 'NRC multi': 600, NSW: 3600, injury: 480 };
  for (const l of Object.keys(want)) {
    assert.equal(S.phantom[l + ' configs'], want[l], l + ' configs');
    assert.equal(S.phantom[l] || 0, 0, l + ': ' + S.phantomEx.join(' | '));
  }
});

test('no rename of any kind dodges a name the calendar-previous shipped day does not print, on the multi-sport limb', () => {
  const S = survey();
  assert.equal(S.limb['gk configs'], 1080);
  assert.equal(S.limb['multi configs'], 4200);
  assert.equal(S.limb.gk || 0, 0, S.limbEx.join(' | '));
  assert.equal(S.limb.multi || 0, 0, S.limbEx.join(' | '));
});

test('_d18View never mutates the live previous day and never hands it back', () => {
  const S = survey();
  assert.ok(S.view.calls > 0);
  assert.equal(S.view.mutated, 0);
  assert.equal(S.view.returnedInput, 0);
});

test('every rename lands on a day whose calendar-previous card prints the renamed name; none on W1 Monday (D167)', () => {
  const S = survey();
  assert.ok(S.d1.renames > 0);
  assert.equal(S.d1.unlocated, 0);
  assert.equal(S.d1.firstDay, 0);
  assert.equal(S.d1.notOnPrev, 0, S.d1.ex.join(' | '));
});

test('the seed index is carried: with the legacy walk put back no Sunday-rest program moves, and the walk is live (D167)', () => {
  const S = survey();
  assert.equal(S.swept.sunRest, 1410);
  assert.equal(S.z.programs, 0, S.z.ex.join(' | '));
  assert.ok(S.h.programs > 0);
});

test('every day the legacy walk moves is a Sunday, a Monday or a licensed depth-1 cascade (D167a)', () => {
  const S = survey();
  assert.equal(S.swept.sunTrain, 3900);
  assert.deepEqual(S.h.unlicensed.slice(0, 5), []);
});

test('no hinge before a leg-load day keeps RPE 8, and final Saturdays are in the population (D171)', () => {
  const S = survey();
  assert.ok(S.t.finalSat > 0);
  assert.deepEqual(S.t.unclamped.slice(0, 5), []);
});

test('a delt accessory repeats on the next training day only when its tier\'s family is used up (D212, healthy configs)', () => {
  const S = survey();
  assert.deepEqual(S.d212.unknownTier, []);
  assert.deepEqual(S.d212.violations.slice(0, 5), []);
  assert.ok(S.d212.licensed > 0);
});
