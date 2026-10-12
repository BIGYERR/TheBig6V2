'use strict';
// A swap stays made until the athlete undoes it. Ruling D181 (P-SWAPDURABLE, V222): R1 a swap and an undo fold into
// the day's ia_hist_ record, R2 the per-exercise Log is a first touch, R3' no prune deletes a record below the freeze
// cut, R5 the boot never re-applies a swap onto a day the freeze restored from ia_hist_ (the record is kept), and the
// three things the fix must not do. The record is in the handoff and tests/measure/v222_rulings/p_swapdurable_ruling.md.
// The chain claims of the same ruling (R4', the replay order) are in tests/integration/swaps.test.js.
//
// Fixture: Mario's config (commercial, support_strength, beginner, lift only, knee workaround, seed 76308), W5 Thu
// Main, Barbell box squat 4×3. Oracle, typed by hand: the athlete's last live action (the name last chosen, the card
// and the ia_hist_ record as written before the reboot); the ruling's strings (the donor 4×3, the goblet squat
// 4×8–12, the leg press carrying the goblet's dose, Front squat keeping 4×3 as a null row); the clocks by date
// arithmetic (2026-08-24 is a Monday, so W5 Thu is 2026-09-24).
//
// This file runs a sample of each lattice; tests/sweeps/swaps.test.js runs the whole of each (504 cells, 42 add and skip
// orderings, 36 untouched cells).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const X = require('../support/swaps.js');

const { DUR } = X;
const V = X.durableWorld();
const WD = DUR.DONOR + ' :: ' + DUR.DONOR_M, WG = DUR.GOB + ' :: ' + DUR.EXPG, WL = DUR.LP + ' :: ' + DUR.EXPLP;

test('the hand clocks: 2026-08-24 is a Monday and W5 Thursday is 2026-09-24', () => {
  assert.equal(new Date(2026, 7, 24).getDay(), 1);
  assert.equal(Math.floor((new Date(2026, 8, 24) - new Date(2026, 7, 24)) / 864e5 / 7) + 1, 5);
  assert.equal(new Date(2026, 8, 24).getDay(), 4);
});

test('a lattice cell equals itself run twice', () => {
  const o = { dated: true, clock: 'today', pair: 'goblet', touch: 'draft', order: 'swap_then_touch', other: false, reboot: null };
  assert.deepEqual(V.cell(o), V.cell(o));
});

// The sample: dated, today's clock, no other-day touch, both pairs, every touch and order, rebooted today and next week.
const CELLS = V.lattice(o => o.dated && o.clock === 'today' && !o.other);

test('after a reboot the slot carries the last choice in name and detail, and a touched day\'s snapshot carries it too', () => {
  // durable row 1 (and its controls, row 1c: draft or done, then swap then touch)
  assert.equal(CELLS.length, 28);
  assert.deepEqual(CELLS.filter(x => x.r.err).map(x => x.r.err), []);
  assert.deepEqual(CELLS.filter(x => !x.r.durable).map(x => JSON.stringify(x.o) + ' boot ' + x.r.card + ' hist ' + x.r.hist), []);
  for (const [t, ord] of [['draft', 'swap_then_touch'], ['done', 'swap_then_touch']]) assert.ok(CELLS.some(x => x.o.touch === t && x.o.order === ord && x.r.durable), t + '|' + ord);
});

test('no logged weight is orphaned by the reboot, and the log store keeps every key and entry', () => {
  // durable rows 3 and 3d
  assert.deepEqual(CELLS.filter(x => x.r.orphan.length).map(x => JSON.stringify(x.o) + ' ' + x.r.orphan.join(',')), []);
  assert.deepEqual(CELLS.filter(x => !x.r.exwEq).map(x => JSON.stringify(x.o)), []);
});

test('undo still works after a reboot, for every touch and order, and the undone day holds through two more boots', () => {
  // durable row 2
  for (const [t, ord] of DUR.ORD) {
    const r = V.undoAfterReboot(t, ord);
    assert.equal(r.b1, WG, t + '|' + ord + ' boot 1');
    assert.equal(r.chip, DUR.DONOR, t + '|' + ord + ' chip');
    assert.equal(r.u, WD, t + '|' + ord + ' undo');
    assert.equal(r.recU, 'none', t + '|' + ord + ' record cleared');
    assert.equal(r.histU, t === 'none' ? 'none' : WD, t + '|' + ord + ' snapshot');
    assert.equal(r.b2, WD); assert.equal(r.b3, WD);
  }
});

test('adding, skipping and swapping on a frozen day boot as the live day, this week and next, with nothing applied twice', () => {
  // durable rows 4 and 4d (sample: a set draft as the touch, between the two acts)
  for (const seq of DUR.M3_SEQS) {
    const r = V.addSkip('draft', seq, 1);
    assert.equal(r.b1, r.live, r.ops + ' boot');
    assert.equal(r.b2, r.live, r.ops + ' next-week boot');
    assert.equal(r.dbl, false, r.ops + ' double apply');
  }
});

test('a second swap on a snapshotted day boots as the leg press, and two undos walk back through the goblet squat to the box squat', () => {
  // durable row 5s (the touch first, between or last)
  for (const pos of ['first', 'between', 'last']) {
    const r = V.secondSwap(pos);
    assert.deepEqual([r.live, r.b1, r.c1, r.u1, r.b2, r.c2, r.u2, r.b3, r.r3], [WL, WL, DUR.GOB, WG, WG, DUR.DONOR, WD, WD, 'none'], pos);
  }
});

test('a swap or an undo on an untouched day writes no snapshot and leaves the freeze cut where it was', () => {
  // durable row 6a (must-not (a)); sample: dated, two clocks, both pairs
  for (const clock of ['today', 'future_prevwk']) for (const pair of Object.keys(DUR.PAIRS)) {
    const r = V.untouched(true, clock, pair);
    assert.ok(r.sw && r.un, clock + '|' + pair + ' swapped and undone');
    assert.ok(r.histSame, clock + '|' + pair + ' no snapshot written');
    assert.equal(r.cuts[1], r.cuts[0]); assert.equal(r.cuts[2], r.cuts[0]);
  }
});

test('the record on a snapshot-restored day survives the boot byte for byte and the undo chip is offered', () => {
  // durable row 10
  for (const [t, ord] of [['draft', 'touch_then_swap'], ['draft', 'swap_then_touch'], ['tick', 'touch_then_swap'], ['tick', 'swap_then_touch'], ['done', 'touch_then_swap'], ['done', 'swap_then_touch'], ['draft', 'chain_lp']]) {
    const r = V.recordKept(t, ord);
    assert.ok(r.snap, t + '|' + ord + ' snapshot');
    assert.ok(r.raw0 && r.raw1 === r.raw0, t + '|' + ord + ' store byte-equal');
    assert.ok(r.kept, t + '|' + ord + ' the day keeps its record');
    assert.equal(r.card, r.shown); assert.equal(r.chip, r.origin);
  }
});
