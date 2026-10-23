// The adjacent-day dedupe (deconflictAdjacentDupes): a loaded accessory that repeats the previous calendar day's name
// is renamed. Rulings: D160 (the trigger set is the previous day as it ships, read through _d18View on a copy), D167
// and D167a (the pairs walk the calendar the week renders), D171 (the hinge clamp reads the calendar's tomorrow),
// D212 (a delt repeat is licensed only when the tier's family is used up). Helpers: tests/support/adjacent-day-dedupe.js.
//
// Oracles: Monday-start date arithmetic, the shipped cards, the old walk typed by hand, the frozen V218 pattern lens,
// D18's doctrine for the long-run day typed by hand, and D212's family by tier. This file runs a 249-config sample of
// the 15,180-config calendar lattice; tests/sweeps/adjacent-day-dedupe.test.js runs the lattice.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, fixtures, progDigest } from '../support/app.ts';
import * as D from '../support/duplicate-movements.ts';
import * as A from '../support/adjacent-day-dedupe.ts';
import type { Cardio, Day, DayKey, Program } from '@ia/core';
const IA = loadApp();
const TEXT = D.appText();
const INST = A.instrumentedApp(TEXT);
const LW = A.legacyWalkApp(TEXT);
const U = A.calendarLattice();
const SAMPLE = U.filter((_, i) => i % 61 === 0);

test('the lattice start dates are Mondays, so calendar index 0 is W1 Monday', () => {
  for (const s of ['2026-09-21', '2026-10-05']) assert.equal(new Date(s + 'T12:00:00Z').getUTCDay(), 1, s);
});

test('the rename logger and the view wrapper change no program', () => {
  const cfgs = [fixtures.HALF_MANNY].concat(SAMPLE.slice(0, 12).map((x) => x.c));
  for (const c of cfgs) assert.equal(progDigest(INST.buildProgram(D.clone(c))), progDigest(IA.buildProgram(D.clone(c))));
});

// ── _d18View, called directly ─────────────────────────────────────────────────────────────────────────────────
const VIEW = IA.eval('_d18View');
const tierFn = IA.eval('_longRunTier');
const names = (y: Day | null | undefined): string[] => ([] as string[]).concat(...((y && y.sections) || []).map((s) => (s.items || []).map((i) => String((i && i.name) || ''))));
const objects = (o: unknown, set = new Set<unknown>()): Set<unknown> => { if (o && typeof o === 'object') { set.add(o); Object.keys(o).forEach((k) => objects((o as Record<string, unknown>)[k], set)); } return set; };
// One real shipped day per long-run tier (A >= 75 min, B 45 to 75, C under 45) and one training day with a non-long card.
const EX: Record<string, { p: Program; w: string; d: DayKey; card: Cardio }> = {};
for (const x of SAMPLE.filter((y) => /^NRC/.test(y.mix))) {
  const p = IA.buildProgram(D.clone(x.c));
  for (const w of Object.keys(p.weeks))
    for (const d of A.ISO) {
      const y = p.weeks[w][d];
      if (!y || y.rest || !Array.isArray(y.sections) || !y.cardio || Array.isArray(y.cardio)) continue;
      const t: string = tierFn(y.cardio) || 'none';
      if (!EX[t] && (t !== 'none' || y.sections.length)) EX[t] = { p, w, d, card: y.cardio };
    }
  if (['A', 'B', 'C', 'none'].every((t) => EX[t])) break;
}

test('_d18View on real shipped days leaves the program untouched and shares no object with it', () => {
  for (const t of ['A', 'B', 'C', 'none']) {
    const e = EX[t];
    assert.ok(e, 'the sample holds a tier ' + t + ' day');
    const before = JSON.stringify(e.p.weeks), inp = e.p.weeks[e.w][e.d], v = VIEW(inp, e.w, e.d);
    assert.equal(JSON.stringify(e.p.weeks), before, 'tier ' + t);
    assert.notEqual(v, inp, 'tier ' + t + ' returns a copy');
    const mine = objects(inp);
    assert.equal([...objects(v)].filter((o) => mine.has(o)).length, 0, 'tier ' + t + ' shares no object');
  }
});

test('_d18View reads a hand day the way D18 prints it under each tier, and leaves the day untouched', () => {
  const MOB = ['Standing calf stretch', 'Couch stretch', 'Hip 90/90 stretch', 'T-spine mobility', 'Foam roll'];
  const hand = (c: Cardio) => ({ title: 'Hand day', cardio: D.clone(c), tags: ['lift'], sections: [
    { label: 'Main — Deadlift', items: [{ name: 'Deadlift', detail: '4×5 — RPE 8' }] },
    { label: 'Loaded carry', items: [{ name: 'Farmer carry', detail: '3×40 yd' }] },
    { label: 'Accessory', items: [{ name: 'Dumbbell bench press', detail: '3×10 — RPE 7' }] }] });
  const want: Record<string, (n: string[]) => void> = {
    A: (n) => assert.deepEqual(n, MOB, 'tier A prints only the mobility block'),
    B: (n) => assert.ok(n.includes('Dumbbell bench press') && !n.includes('Deadlift') && !n.includes('Farmer carry'), 'tier B keeps the bench only: ' + n),
    C: (n) => assert.ok(n.includes('Deadlift') && n.includes('Dumbbell bench press') && !n.includes('Farmer carry'), 'tier C drops only the carry: ' + n),
    none: (n) => assert.deepEqual(n, ['Deadlift', 'Farmer carry', 'Dumbbell bench press'], 'a non-long card leaves the day whole'),
  };
  for (const t of Object.keys(want)) {
    const day = hand(EX[t].card), before = JSON.stringify(day), v = VIEW(day, 1, 'mon');
    want[t](names(v));
    assert.equal(JSON.stringify(day), before, 'tier ' + t + ' input untouched');
    if (t === 'none') assert.equal(JSON.stringify(v), before);
  }
});

// ── the calendar sample ───────────────────────────────────────────────────────────────────────────────────────
const T = A.surveyCalendar(SAMPLE, { inst: INST, lw: LW });

test('the sample builds whole and buildProgram leaves every config unchanged', () => {
  assert.equal(SAMPLE.length, 249);
  assert.deepEqual(T.crash, []);
  assert.deepEqual(T.cfgMutated, []);
});

test('no rename dodges a name the shipped long-run previous day does not print (D160, sample)', () => {
  assert.deepEqual(T.phantomEx, []);
  assert.deepEqual(T.limbEx, [], 'and none of any kind on the NSW multi-sport mixes');
});

test('_d18View never mutates the live previous day and never hands it back (sample)', () => {
  assert.ok(T.view.calls > 0);
  assert.equal(T.view.mutated, 0);
  assert.equal(T.view.returnedInput, 0);
});

test('every rename lands on a day whose calendar-previous card prints the renamed name (D167, sample)', () => {
  assert.ok(T.d1.renames > 0);
  assert.deepEqual([T.d1.unlocated, T.d1.firstDay, T.d1.notOnPrev], [0, 0, 0], T.d1.ex.join(' | '));
});

test('the legacy walk moves only Sundays and Mondays, or a licensed cascade, and no Sunday-rest program (D167, D167a, sample)', () => {
  assert.equal(T.z.programs, 0, T.z.ex.join(' | '));
  assert.ok(T.h.programs > 0, 'the walk is live');
  assert.deepEqual(T.h.unlicensed, []);
});

test('no hinge before a leg-load day keeps RPE 8, final Saturday included (D171, sample)', () => {
  assert.ok(T.t.finalSat > 0, 'the sample holds a final-Saturday hinge before a leg-load Sunday');
  assert.deepEqual(T.t.unclamped, []);
});

test('a delt accessory repeats on the next training day only when its tier\'s family is used up (D212, sample)', () => {
  assert.deepEqual(T.d212.unknownTier, []);
  assert.deepEqual(T.d212.violations, []);
  assert.ok(T.d212.licensed > 0, 'licensed repeats exist');
});
