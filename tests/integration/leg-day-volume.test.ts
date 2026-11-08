// Leg day volume: how much the squat-and-armor leg day carries against the week's long run. Rulings:
//   D273        P-PEAKLEGS: a lifting day whose role is legs, one or two days before a long run the engine reads as tier A
//               (75 minutes and up at the prescribed pace, the long-run day's own line), is a maintenance day: no carry,
//               no eccentric calf block, no glute block; the hip stability and foot & ankle drills stay whole; the day
//               never moves (D36). Tier B and C weeks, a leg day three or more days out, the taper primer and the
//               long-run day itself are untouched;
//   Amendment 1 the maintenance day keeps the main lift exactly as written (sets, reps, load, RPE) and the first
//               accessory block after it, whole; every other loaded block goes whole.
// The record is docs/decisions/leg-day-volume.md and the measure tests/measure/leg-day-volume_peak-week.md.
//
// Oracles are typed by hand from the ruling's after-cards and the v0.255.2 cards it was ruled against, never asked of
// the app; the long-run minutes are the card's own dose (tests/support/long-run-day.ts).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { Day, DayKey, Section } from '@ia/core';
import { fixtures, progDigest } from '../support/app.ts';
import * as R from '../support/run-week-layout.ts';
import * as T from '../support/long-run-day.ts';

/** Mario's live program: THE HALF MANNY, rest Sunday and Wednesday, the leg day on Thursday, the long run on Saturday. */
const HM = () => R.clone(fixtures.HALF_MANNY);
/** The same calendar on the support_strength template (Leg superset A and B instead of the circuit), a 10K plan. */
const STR = () => Object.assign(HM(), { liftingFocus: 'support_strength', experience: 'beginner', seed: 1013,
  cardioGoals: { run: { ...fixtures.HALF_MANNY.cardioGoals.run, id: 'run_10k' } } });
/** Rest Sunday and Thursday: the leg day lands on Wednesday, three days before the Saturday long run. */
const GAP3 = () => Object.assign(HM(), { experience: 'beginner', seed: 1013, restDays: ['sun', 'thu'],
  cardioGoals: { run: { ...fixtures.HALF_MANNY.cardioGoals.run, id: 'run_10k' } } });

let P: Record<string, any> = {};
const prog = (k: 'hm' | 'str' | 'gap3') => P[k] || (P[k] = R.build(k === 'hm' ? HM() : k === 'str' ? STR() : GAP3()));
const day = (k: 'hm' | 'str' | 'gap3', w: number, d: DayKey): Day => prog(k).weeks[w][d];
const labels = (y: Day): string[] => Array.from(y.sections || []).map((s: Section) => String(s.label || s.coreHeader || ''));
/** A loaded block: not hip-flagged, not trunk, and with at least one prescribed item. */
const loaded = (y: Day): Section[] => Array.from(y.sections || []).filter((s: Section) => !s.hip && !s.core && !s.coreHeader && (s.items || []).some(i => i && i.detail));
const loadedSets = (y: Day): number => loaded(y).reduce((a, s) => a + (s.items || []).reduce((b, i) => b + T.docSets(i.detail), 0), 0);
const text = (y: Day): string => T.items(y).map(i => (i.name || '') + ' ' + (i.detail || '')).join(' | ');
const minutes = (y: Day): number => Math.round(T.minutesOf(y.cardio && y.cardio.dose));

test('THE HALF MANNY and the two variants each equal themselves built twice', () => {
  for (const c of [HM(), STR(), GAP3()]) assert.equal(progDigest(R.build(c)), progDigest(R.build(c)), c.liftingFocus + '/' + c.restDays.join('+'));
});

test('the long runs the leg day answers to: Saturdays of weeks 4 to 11 are 83 83 107 127 133 133 107 167 minutes (tier A); weeks 1 to 3 and 12 are 41 53 67 60 (tiers C B B B)', () => {
  const m: number[] = [], t: (string | null)[] = [];
  for (let w = 1; w <= 12; w++) { const s = day('hm', w, 'sat'); m.push(minutes(s)); t.push(T.handTier(s.cardio)); }
  assert.deepEqual(m, [41, 53, 67, 83, 83, 107, 127, 133, 133, 107, 167, 60]);
  assert.equal(t.join(''), 'CBBAAAAAAAAB');
});

test('week 11 Thursday, two days before the 167-minute peak long run: the squat as written, the circuit, the drills, nothing else', () => {
  const y = day('hm', 11, 'thu');
  assert.equal(y.title, 'Leg Strength + Mobility');
  assert.equal(T.shape(y), '[Main — Back squat] Back squat ; [Leg circuit — runner armor] Goblet side lunge to knee drive, Wall sit, Kettlebell single-leg deadlift ; [Hip stability] Seated banded hip flexion, Hip airplane (light KB), Weighted 90/90 hip switch ; [Foot & ankle] Knee-to-wall ankle rocks, Single-leg bent-knee soleus raise');
  assert.match(String(y.sections![0].items![0].detail), /^2×8 — RPE 6\.5 /, 'the squat keeps its sets, reps and RPE');
  assert.equal(loadedSets(y), 8);
  assert.doesNotMatch(text(y), /carry|hip thrust|slow 3-sec lower/i);
});

test('weeks 4 to 11 Thursdays are maintenance days: the main squat whole, the circuit whole, both hip blocks whole; the glute block, the calf block and the carry are gone', () => {
  // The squat's sets by week, from the wave as v0.255.2 wrote it: 3×13 (deload) 3×8 3×8 3×10 3×13 (deload) 3×8 3×8 2×8.
  const SQUAT: Record<number, RegExp> = { 4: /^3×13 — RPE 6 \(recovery/, 5: /^3×8 — RPE 7 /, 6: /^3×8 — RPE 7 /, 7: /^3×10 — RPE 6\.5 /,
    8: /^3×13 — RPE 6 \(recovery/, 9: /^3×8 — RPE 7 /, 10: /^3×8 — RPE 7 /, 11: /^2×8 — RPE 6\.5 / };
  for (let w = 4; w <= 11; w++) {
    const y = day('hm', w, 'thu'), L = loaded(y);
    assert.equal(L.length, 2, 'W' + w + ' loaded blocks: ' + labels(y).join(' ; '));
    assert.match(String(L[0].label), /^Main — (Back|Front) squat$/, 'W' + w);
    assert.match(String(L[0].items![0].detail), SQUAT[w], 'W' + w + ' squat as written');
    assert.equal(L[1].label, 'Leg circuit — runner armor', 'W' + w);
    assert.equal(L[1].items!.length, 3, 'W' + w + ' the circuit whole');
    assert.equal(loadedSets(y), (w === 11 ? 2 : 3) + 6, 'W' + w + ' loaded sets');
    const hip = Array.from(y.sections || []).filter((s: Section) => s.hip);
    assert.deepEqual(hip.map(s => [s.label, (s.items || []).length]), [['Hip stability', 3], ['Foot & ankle', 2]], 'W' + w + ' the drills stay whole');
    assert.doesNotMatch(labels(y).join(';'), /Glute|Calf|carry/i, 'W' + w);
    assert.doesNotMatch(text(y), /carry|slow 3-sec lower/i, 'W' + w);
  }
});

test('Amendment 1: week 9 keeps its 3×8 squat whole and the circuit, nine loaded sets; the deload week 8 keeps its 3×13 recovery squat and the circuit, and the cap still takes the glute block', () => {
  const w9 = day('hm', 9, 'thu');
  assert.equal(T.shape(w9), '[Main — Back squat] Back squat ; [Leg circuit — runner armor] Dumbbell goblet side lunge, Spanish squat hold (KB), Dumbbell split-stance deadlift ; [Hip stability] Clamshells w/ band, Banded monster walks, Cossack squat shift ; [Foot & ankle] Banded dorsiflexion, Split-squat heel-raise hold');
  assert.equal(loadedSets(w9), 9);
  const w8 = day('hm', 8, 'thu');
  assert.equal(T.shape(w8), '[Main — Front squat] Front squat ; [Leg circuit — runner armor] Step-downs (KB), Wall sit, Kettlebell single-leg deadlift ; [Hip stability] Clamshells w/ band, Copenhagen plank (bent knee), Worlds greatest stretch ; [Foot & ankle] Standing ankle CARs, Knee-to-wall ankle rocks');
  assert.match(String(w8.sections![0].items![0].detail), /^3×13 — RPE 6 \(recovery — leave 4\+ reps in the tank\)/);
  assert.equal(loadedSets(w8), 9);
});

test('guard (passes on v0.255.2 too, must not change): weeks 1 to 3 (41, 53 and 67-minute long runs) keep the whole leg day: glute block, calf block and carry still print', () => {
  for (let w = 1; w <= 3; w++) {
    const l = labels(day('hm', w, 'thu'));
    assert.deepEqual(l, ['Main — ' + (w === 3 ? 'Back' : 'Front') + ' squat', 'Leg circuit — runner armor', 'Glute — runner armor', 'Calf — achilles armor', 'Hip stability', 'Foot & ankle', 'Loaded carry finisher'], 'W' + w);
    assert.equal(loadedSets(day('hm', w, 'thu')), (w === 3 ? 3 : 3) + 6 + 2 + 2 + 3, 'W' + w + ': 3-set squat, circuit, glute, calf, carry');
  }
});

test('guard (passes on v0.255.2 too, must not change): week 12, the 60-minute cutback (tier B), keeps its deload leg day with the glute block; week 13, the taper primer, is untouched', () => {
  assert.deepEqual(labels(day('hm', 12, 'thu')), ['Main — Back squat', 'Leg circuit — runner armor', 'Glute — runner armor', 'Hip stability', 'Foot & ankle']);
  const w13 = day('hm', 13, 'thu');
  assert.deepEqual(labels(w13), ['Primer — Front squat', 'Taper', 'Foot & ankle']);
  assert.match(String(w13.sections![0].items![0].detail), /^3×12 — RPE 5–6 \(primer/);
});

test('guard (passes on v0.255.2 too, must not change): a leg day three days before a tier A long run is untouched: rest Sunday and Thursday, Wednesday leg day, 83-minute Saturday long run in week 5', () => {
  const y = day('gap3', 5, 'wed');
  assert.equal(minutes(day('gap3', 5, 'sat')), 83);
  assert.equal(T.handTier(day('gap3', 5, 'sat').cardio), 'A');
  assert.deepEqual(labels(y), ['Main — Back squat', 'Leg circuit — runner armor', 'Glute — runner armor', 'Calf — achilles armor', 'Hip stability', 'Foot & ankle', 'Loaded carry finisher']);
  assert.equal(loadedSets(y), 3 + 6 + 2 + 2 + 3);
});

test('on the support_strength template the first accessory block is Leg superset A: week 5 Thursday keeps the 4×3 squat and superset A; superset B and the Farmer carry are gone', () => {
  const y = day('str', 5, 'thu');
  assert.equal(minutes(day('str', 5, 'sat')), 83);
  assert.equal(T.shape(y), '[Main — Back squat] Back squat ; [Leg superset A] Goblet side lunge to knee drive, Wall sit ; [Hip stability] Banded monster walks, Banded side steps, Pigeon lift-offs ; [Foot & ankle] Kettlebell tibialis raise (seated), Single-leg balance hold (eyes closed)');
  assert.match(String(y.sections![0].items![0].detail), /^4×3 — RPE 7 /);
  assert.equal(loadedSets(y), 4 + 4);
  // Week 4's 67-minute long run is tier B: the whole day prints.
  const w4 = labels(day('str', 4, 'thu'));
  assert.match(w4[0]!, /^Main — /);
  assert.deepEqual(w4.slice(1), ['Leg superset A', 'Leg superset B', 'Hip stability', 'Foot & ankle', 'Loaded carry finisher']);
});

test('guard (passes on v0.255.2 too, must not change): the long-run day itself is not this pass\'s to touch; week 11 Saturday is still Post-Run Mobility (D18), and this must not change', () => {
  const s = day('hm', 11, 'sat');
  assert.equal(s.title, 'Post-Run Mobility');
  assert.equal(T.shape(s), '[Post-run mobility] Standing calf stretch, Couch stretch, Hip 90/90 stretch, T-spine mobility, Foam roll');
});
