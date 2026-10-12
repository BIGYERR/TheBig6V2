'use strict';
// The leg accessory blocks: the "Leg isolation" slot and its pool (EXLIB.leg_accessory), and the Calves block beside it.
// Rulings:
//   D70b the equipment filter is not advisory: a pool that filters to nothing is never handed back whole (a leg press
//        no longer prints in a hotel room);
//   D75 four gear-free names are harvested into the pool (renamed leg_accessory) so it never empties; the hold dose is
//       25 seconds; coach excluded three names;
//   D76 names already on the day's card are subtracted, so one movement never prints twice;
//   D78 the bodyweight sweep has nothing to substitute for the harvested names, so the bodyweight section is all legs;
//   D84 Calves is pushed before Leg isolation, so on a day over budget the isolation slot leaves first (the trim's tie
//       goes to the later position);
//   D70c, D165 no machine or cable item reaches home_full; no same-card duplicates are left.
// The record is in the handoff and tests/measure/v197_rulings/ to v219_rulings/.
//
// This file runs the pool, the render surfaces and HALF_MANNY whole, and a sample of each lattice.
// tests/sweeps/leg-accessory.test.js runs the 3,528-config lattice and tests/sweeps/leg-accessory-trim-order.test.js
// the 1,728-config D84 comparison, with their current counts in tests/snapshots/leg-accessory-lattice.json and
// tests/snapshots/leg-accessory-trim-order.json.
//
// Oracles are typed by hand (tests/support/leg-accessory.js): the gear table from the wizard copy, the harvested,
// excluded and machine names, the hold dose, the leg vocabulary, the posterior table and cost rule. D84's comparison is
// the app with the two pushes swapped back.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, pinClock, fixtures } = require('../support/app.js');
const LA = require('../support/leg-accessory.js');
const { CLOCK } = require('../support/session-budget.js');
const { clone, HARVESTED, EXCLUDED, MACHINES, SECTION } = LA;

const IA = LA.page();
const POOL = Array.from(IA.EXLIB.leg_accessory || []);

// ── the pool ─────────────────────────────────────────────────────────────────────────────────────────────────────
test('the pool is EXLIB.leg_accessory: the five machines and the four harvested names, nine in all; leg_iso is gone', () => {
  // A1, A2, A3, A4, A5, A6
  assert.ok(Array.isArray(IA.EXLIB.leg_accessory), 'EXLIB.leg_accessory exists');
  assert.equal(IA.EXLIB.leg_iso, undefined);
  for (const n of HARVESTED) assert.ok(POOL.includes(n), 'harvested: ' + n);
  for (const n of MACHINES) assert.ok(POOL.includes(n), 'commercial keeps its machine: ' + n);
  for (const n of EXCLUDED) assert.ok(!POOL.includes(n), 'coach excluded: ' + n);
  assert.equal(POOL.length, 9);
});

test('every tier, travel Room-only included, owns at least two members of the pool; with no gear at all it is the four harvested names', () => {
  // A7, A8 (the hand gear table, never the app's)
  for (const t of LA.TIERS_PLUS) {
    const legal = POOL.filter((n) => LA.needs(n).every((g) => LA.OWNS[t].has(g)));
    assert.ok(legal.length >= 2, t + ': ' + legal.join(', '));
  }
  const free = POOL.filter((n) => LA.needs(n).every((g) => LA.OWNS.travel_room_only.has(g)));
  assert.deepEqual(free.slice().sort(), HARVESTED.slice().sort());
});

test('the bodyweight sweep has nothing to substitute for a harvested name (D78)', () => {
  // A11, A12, A13, A14
  const gear = IA.eval('_BW_GEAR'), subs = Object.keys(IA.eval('_BW_SUBS'));
  assert.equal(typeof gear.test, 'function');
  assert.ok(subs.length > 0);
  for (const n of HARVESTED) { assert.equal(gear.test(n), false, '_BW_GEAR matches ' + n); assert.ok(!subs.includes(n), '_BW_SUBS key ' + n); }
});

// ── the render surfaces ──────────────────────────────────────────────────────────────────────────────────────────
// Per tier, the first config in lattice order that opens a Leg isolation section, and the first that opens a core
// section (14 days).
const R = loadApp({ dom: true });
pinClock(R, CLOCK);
const renderDays = [];
{
  const seen = {};
  for (const c of LA.fullLattice()) {
    if (renderDays.length >= LA.TIERS_PLUS.length * 2) break;
    if (seen[c.tier] && seen['core_' + c.tier]) continue;
    const p = R.buildProgram(clone(c.cfg));
    for (const cell of LA.trainingDays(p)) {
      for (const s of cell.day.sections || []) {
        if ((s.label || '') === SECTION && !seen[c.tier]) { seen[c.tier] = 1; renderDays.push({ tier: c.tier, sec: s, day: cell.day }); }
      }
      if (!seen['core_' + c.tier] && (cell.day.sections || []).some((s) => s.core)) {
        seen['core_' + c.tier] = 1;
        renderDays.push({ tier: c.tier + ' (core day)', sec: cell.day.sections.filter((s) => s.core)[0], day: cell.day });
      }
    }
  }
}
// buildExItem writes one name slot per item: ex-name for a live row, ex-skipped-name for a struck one.
const slotText = (h) => [...String(h).matchAll(/<span class="ex-(?:skipped-)?name">([\s\S]*?)<\/span>/g)].map((m) => m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
const sectionsHTML = (sec) => { R.ctx.__SEC = [sec]; return String(R.eval('buildSectionsHTML(__SEC,0)')); };

test('on the four render surfaces every item reaches the card as its own row with a name, and the 25-second hold prints', () => {
  // C1, C3 (and a throw on any surface fails the test)
  assert.equal(renderDays.length, 14);
  let rows = 0, items = 0, blank = 0, dose = 0;
  for (const rd of renderDays) {
    R.ctx.__DAY = rd.day;
    for (const code of ['sessionLogProgress(__DAY)', 'sessionTimeEst(__DAY)', 'buildHeroPreview(__DAY)']) R.eval(code);
    const h = sectionsHTML(rd.sec);
    assert.ok(!/undefined/i.test(h), rd.tier + ' prints "undefined"');
    if (/wall sit/i.test(h) && new RegExp(LA.HOLD_DOSE_SEC + '\\s*sec', 'i').test(h)) dose++;
    const names = slotText(h);
    rows += names.length; items += (rd.sec.items || []).length; blank += names.filter((n) => !n).length;
  }
  assert.ok(rows > 0);
  assert.equal(rows, items);
  assert.equal(blank, 0);
  assert.ok(dose > 0);
});

test('the blank-row detector is not blind: a nameless second item renders as a blank row', () => {
  // C2
  const rd = renderDays.find((d) => d.sec && (d.sec.items || []).length > 0);
  const probe = Object.assign({}, rd.sec, { items: (rd.sec.items || []).slice(0, 1).concat([{ name: undefined, detail: '3×12' }]) });
  const got = slotText(sectionsHTML(probe));
  assert.equal(got.length, 2);
  assert.equal(got.filter((n) => !n).length, 1);
});

// ── HALF_MANNY ───────────────────────────────────────────────────────────────────────────────────────────────────
test("Leg isolation never opens on Mario's program, so no harvested name reaches him through that slot", () => {
  // D2, D3
  const p = IA.buildProgram(clone(fixtures.HALF_MANNY));
  const secs = LA.trainingDays(p).flatMap((c) => (c.day.sections || []).filter((s) => (s.label || '') === SECTION));
  assert.equal(secs.length, 0);
  assert.equal(secs.flatMap((s) => s.items || []).filter((i) => HARVESTED.includes(String(i.name || '').trim())).length, 0);
});

// ── the lattice, on a sample (the 3,528 are in the sweep) ────────────────────────────────────────────────────────
// Lift only on every tier and focus, plus hypertrophy for a half on every tier; experience, seed and rest rotate.
const SAMPLE = LA.fullLattice().filter((c) => {
  const ti = LA.TIERS_PLUS.indexOf(c.tier), fi = LA.FOCUSES.indexOf(c.cfg.liftingFocus), k = ti + fi;
  const goal = (c.cfg.cardioGoals.run || {}).id || 'liftonly';
  const rot = c.cfg.experience === LA.EXPS[k % 3] && c.cfg.seed === LA.SEEDS[k % 3] && c.cfg.restDays.length === 2 + (k % 2);
  return rot && (goal === 'liftonly' || (goal === 'run_half' && c.cfg.liftingFocus === 'hypertrophy'));
});
const S = LA.legSweep(IA, SAMPLE);

test('on the sample every config builds, no item lacks a name, and the section still opens and carries a harvested name', () => {
  // B0, B1, B2, B3
  assert.equal(SAMPLE.length, 56);
  assert.deepEqual(S.threw, []);
  assert.equal(S.undef, 0);
  assert.ok(S.secTotal > 0);
  assert.ok(S.secWithHarvest > 0);
});

test('on the sample no tier prints a machine or cable item it does not own (the filter is not advisory)', () => {
  // B4a to B4m, A9, A10
  for (const t of LA.TIERS_PLUS) assert.deepEqual(S.census[t], { machine: 0, cable: 0, names: {} }, t);
});

test('on the sample no name prints twice on one card, and every Wall sit in the section is n×25 sec', () => {
  // B5a to B5d, B6a, B6b
  assert.equal(S.harvestedDup, 0);
  assert.equal(S.dup, 0);
  assert.ok(S.wallInSection > 0);
  assert.equal(S.wallBadDose, 0);
});

test("on the sample the bodyweight section prints leg movements only, none of the old fallback's", () => {
  // B7a, B7b, B7c
  const bw = Object.keys(S.bwNames);
  assert.ok(bw.length > 0);
  for (const n of bw) assert.ok(LA.LEG_WORDS.test(n), n);
  assert.ok(!bw.some((n) => /pushup|inverted row|burpee|y-t-w/i.test(n)), bw.join(', '));
});

// ── D84, on a sample of the comparison (the 1,728 are in the trim-order sweep) ───────────────────────────────────
test('Calves is pushed before Leg isolation: each push is one line, and on a built day Calves comes first', () => {
  // E0a, E0b, E0c, E0d (the comparison app is the two lines swapped back)
  assert.equal(LA.countIn(LA.CALF_PUSH), 1);
  assert.equal(LA.countIn(LA.ISO_PUSH), 1);
  assert.equal(LA.countIn(LA.CALF_PUSH + LA.ISO_PUSH), 1);
  assert.equal(LA.countIn(LA.ISO_PUSH + LA.CALF_PUSH), 0);
  let both = 0;
  for (const c of LA.trimLattice().slice(0, 48)) {
    for (const cell of LA.trainingDays(IA.buildProgram(clone(c.cfg)))) {
      const labels = (cell.day.sections || []).map((s) => s.label);
      const ci = labels.indexOf('Calves'), li = labels.indexOf(SECTION);
      if (ci >= 0 && li >= 0) { both++; assert.ok(ci < li, c.key); }
    }
  }
  assert.ok(both > 0);
});

test('the Calves block is one item dosed 4 sets for an advanced athlete and 3 otherwise, so one slot costs at most 4 sets', () => {
  // E4h, E4i, E4j (the ceiling D84's cost claim uses, read off built days)
  const seen = { advanced: 0, other: 0 };
  // every tier, both experiences, every injury state (an advanced Calves block survives the budget only under one):
  // hypertrophy, lift only, rest sun+wed, seed 1013 (48 configs)
  for (const c of LA.trimLattice().filter((x) => /^[a-z_]+\|hypertrophy\|[a-z]+\|liftonly\|[a-z/]+\|sun\+wed\|1013$/.test(x.key))) {
    for (const cell of LA.trainingDays(IA.buildProgram(clone(c.cfg)))) for (const s of cell.day.sections || []) {
      if (s.label !== 'Calves') continue;
      assert.equal((s.items || []).length, 1);
      const want = c.cfg.experience === 'advanced' ? 4 : 3;
      assert.match(String(s.items[0].detail), new RegExp('^' + want + '(×15–20| sets)'), c.key);
      seen[c.cfg.experience === 'advanced' ? 'advanced' : 'other']++;
    }
  }
  assert.ok(seen.advanced > 0 && seen.other > 0);
  assert.equal(LA.CALF_SLOT_MAX, 4);
});

test('the posterior chain detector sees a hinge or hip extension and not a leg isolation slot', () => {
  // E3a (three probes; no app involved)
  assert.equal(LA.eZeroP({ labels: ['Calves'], names: ['Back squat', 'Dumbbell bench press', 'Dumbbell standing calf raise'] }), true);
  assert.equal(LA.eZeroP({ labels: ['Calves'], names: ['Back squat', 'Nordic hamstring curl (anchored)'] }), false);
  assert.equal(LA.eZeroP({ labels: ['Leg isolation'], names: ['Back squat', 'Leg extension'] }), true);
});

test('on a sample of the comparison Calves never falls and does rise; only Calves and Leg isolation move; a changed day costs 0 to 4 sets more', () => {
  // E1a to E1f, E2a to E2c, E3b, E3e, E4d, E4l on 72 of the 1,728 configs (every 24th)
  const r = LA.trimCompare(LA.trimLattice().filter((_, i) => i % 24 === 0));
  assert.deepEqual(r.threw, []);
  assert.equal(r.configs, 72);
  assert.ok(r.cells > 0);
  assert.deepEqual(r.fell, []);
  assert.ok(r.rose > 0);
  assert.deepEqual(Object.keys(r.labelDelta).filter((l) => r.labelDelta[l]).sort(), ['Calves', 'Leg isolation']);
  assert.ok(r.labelDelta.Calves > 0 && r.labelDelta['Leg isolation'] < 0);
  assert.deepEqual(r.costOut, []);
  assert.deepEqual(r.costDown, []);
  assert.deepEqual(Object.keys(r.zeroAll).filter((k) => k.split('|')[4] !== 'lowback/protect'), []);
});
