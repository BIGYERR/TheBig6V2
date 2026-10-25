// Swaps and undo: the swap sheet, the card it prescribes, the toast, the undo chip, the boot that replays the athlete's
// swaps, the build-time swap preference, and the sport chip on a cardio day. Rulings:
//   D177 (P-SWAPFLOOR) a swapped Main is prescribed the way the engine would prescribe it in that slot;
//   D181 (P-SWAPDURABLE) a swap stays made until undone, and the boot replays swaps in recording order, never onto a day
//        the freeze restored from ia_hist_;
//   D190 (P-SWAPSEAM) the hold cue belongs to the plan and the movement on the card; D193 the cap says "three in the
//        tank" and holds a capped target at RPE 7 (the hand hold below);
//   D192 (P-UNDOKEY) the undo chip names the lift that just left, one undo walks back one step;
//   D213, D214 (P-SWAPKEEP) the sport chip credits, it never erases; the note says what is kept.
// The record is in the handoff and tests/measure/v221_rulings/ to v234_rulings/.
//
// This file runs each claim on hand fixtures and a small seeded sample of chains; tests/sweeps/swaps.test.ts runs the
// lattices (every Main and Power pair of 384 configs, the chain walk over eight configs, the 504-cell durability
// lattice, every preference build) with the pinned counts in tests/snapshots/swaps.json.
//
// Oracles are typed by hand (tests/support/swaps.ts): the floor table and window rewrite, the toast sentences, the cue
// and the hold, the cap table, the chain tuple (the chip is the last hop's `from`; the store after an undo is the
// first n-1 hops), the day as the athlete last saw it before the boot, the ia_hist_ record as written.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { appScript, progDigest, fixtures } from '../support/app.ts';
import type { App } from '../support/app.ts';
import * as X from '../support/swaps.ts';
const { clean, clone, JS, E } = X;

const EXPG = '4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const EXPT = 'Dumbbell goblet squat in, barbell box squat out. The load runs out before the reps do here. Same sets, same effort. Reps move to 8 to 12.';
const DONOR_M = '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const DONOR = 'Barbell box squat', GOB = 'Dumbbell goblet squat', LP = 'Leg press', FRONT = 'Front squat';

// ── the swap floor (D177) ────────────────────────────────────────────────────────────────────────────────────────
const F = X.floorPage();
const sdE = F.eval('_swapDetailFor'), rfE = F.eval('_repFloor');
const mainIdx = (day: any) => (day.sections || []).findIndex((s: any) => /^main/i.test(clean(s && s.label)));
function liveSwap(prog: any, w: number, d: string, si: number, ii: number, to: string) {
  F.ctx.__P = prog; const it = prog.weeks[w][d].sections[si].items[ii];
  F.ctx.__c = { secIdx: si, itemIdx: ii, name: it.name, detail: it.detail || '' };
  F.eval("activeProg=__P;activeProgId='P1';currentWeek=" + (+w) + ";currentDayKey='" + d + "';globalThis.__T=null;_swapCtx=__c;applySwapChoice(" + JSON.stringify(to) + ')');
  return { item: prog.weeks[w][d].sections[si].items[ii], toast: F.eval('globalThis.__T') };
}

test("Mario's W5 Thursday box squat swapped to a goblet squat moves the reps to 8 to 12 and says why", () => {
  // G1a, G1b
  F.localStorage.clear(); const cfg = X.MARIO(), p = F.buildProgram(cfg); p.cfg = cfg;
  const day = p.weeks[5].thu, si = mainIdx(day), it = day.sections[si].items[0];
  assert.equal(clean(it.name), DONOR);
  assert.equal(it.detail, DONOR_M);
  const r = liveSwap(p, 5, 'thu', si, 0, GOB);
  assert.equal(r.item.name, GOB);
  assert.equal(r.item.detail, EXPG);
  assert.equal(r.toast, EXPT);
});

test('the rep floor table, by movement', () => {
  // G2: the RR1 rows, the RR4 landmine literal, the swing kept at 10 to 15 (Mario 2026-09-23)
  const HAND: [string, number[] | null][] = [['Dumbbell goblet squat', [8, 12]], ['Kettlebell swing', [10, 15]], ['Barbell hip thrust', [6, 10]],
    ['Zercher single-leg deadlift', [6, 10]], ['Landmine reverse lunge', [6, 10]], ['Landmine rotational press', [6, 10]],
    ['Landmine rotations', null], ['Dumbbell row', [6, 10]], ['Dumbbell bench press', [5, 8]], ['Leg press', [5, 8]],
    ['Cable lateral raise', [8, 12]], ['Back squat', null], ['Barbell box squat', null], ['Step-ups (KB)', [6, 10]]];
  for (const [n, w] of HAND) assert.deepEqual(JSON.parse(JSON.stringify(rfE(n))), w, n);
});

test('a core rotation and a renegade row carry their detail verbatim', () => {
  // G4b, G4c: named no-change under _swapDetailFor (on the lattice they carry these details; the sweep checks all)
  for (const [n, d] of [['Landmine rotations', '3×8–12 each @ RPE 7'], ['Landmine rotations', '2×8–12 each @ RPE 6–7'], ['Dumbbell renegade rows', '3×8 each']]) {
    assert.equal(sdE(n, d), d, n);
  }
});

test('the add path fallback is 3×10 — RPE 7, in the Main grammar and at or above every window, so no window moves it', () => {
  // G8b
  const js = appScript(), i = js.indexOf('function addedDetailFor('), k = js.indexOf('\nfunction ', i + 1);
  assert.ok(i >= 0 && k > i);
  const body = js.slice(i, k).replace(/^\s*\/\/.*$/gm, '');
  const m = body.match(/return\s+('(?:[^'\\]|\\.)*')\s*;\s*\}\s*$/);
  assert.ok(m, 'addedDetailFor ends in a literal return');
  const lit = Function('"use strict";return ' + m[1])();
  assert.equal(lit, '3×10 — RPE 7');
  const g = X.GRAM.exec(lit), maxLo = Math.max(...X.HAND_FLOOR.filter(r => r[1] && r[1][1] !== 0).map(r => (r[1] as number[])[0]));
  assert.ok(g && +g[2] >= maxLo);
  for (const n of ['Dumbbell goblet squat', 'Kettlebell swing', 'Barbell hip thrust', 'Landmine rotational press', 'Dumbbell row', 'Leg press', 'Cable lateral raise']) assert.equal(sdE(n, lit), lit, n);
});

// A sample of the D177 lattice (the sweep runs all 384 configs): window swaps (Mario), the V119 conversion (Close-grip
// bench press to Dips), the home_basic named pairs, hold clamps (strength, low back workaround), bodyweight under a
// low back workaround, and a shoulder protect plan.
const L1_SAMPLE = [
  X.l1Cfg('commercial', 'support_strength', 'beginner', 'liftonly', { region: 'knee', tier: 'workaround' }),
  X.l1Cfg('commercial', 'support_prevention', 'beginner', 'liftonly', null),
  X.l1Cfg('home_basic', 'strength', 'beginner', 'liftonly', null),
  X.l1Cfg('commercial', 'strength', 'advanced', 'liftonly', { region: 'lowback', tier: 'workaround' }),
  X.l1Cfg('bodyweight', 'support_prevention', 'advanced', 'half', { region: 'lowback', tier: 'workaround' }),
  X.l1Cfg('crossfit', 'hypertrophy', 'advanced', 'half', { region: 'shoulder', tier: 'protect' }),
];
const S = X.floorLattice(L1_SAMPLE);
const ex = (k: string) => (S.ex[k] || []).join(' | ');

test('the sample lattice ran: every config built, Main and Power pairs of every kind present', () => {
  assert.deepEqual(S.crash, []);
  assert.equal(S.cfgs, L1_SAMPLE.length);
  for (const k of ['main', 'pow', 'winN', 'atN', 'nullN', 'offN', 'zeroChg', 'capPairs', 'clampT'] as const) assert.ok(S[k] > 0, k + ' > 0');
});

test('a swapped Main card is the donor beneath its hold, with the window applied, and the hold on a capped target', () => {
  // G3a, G3c (off grammar), G3d, G3e, G3f: D177's card on the donor read beneath its hold (D193 (l))
  assert.equal(S.bA, 0, 'outside the rep token: ' + ex('A'));
  assert.equal(S.bOff, 0, 'off grammar: ' + ex('off'));
  assert.equal(S.bAt, 0, 'at or above the floor: ' + ex('at'));
  assert.equal(S.bNull, 0, 'null row: ' + ex('null'));
  assert.equal(S.bWin, 0, 'under the window: ' + ex('win'));
});

test('no swapped Main lands under its window', () => {
  // G3b
  assert.ok(S.underN > 0);
  assert.equal(S.under, 0, ex('under'));
});

test('a power swap never changes the dose beyond the cue', () => {
  // G3c, power half
  assert.equal(S.powChg, 0, ex('pow'));
});

test('swap then undo puts the day back byte for byte, on every Main and Power pair', () => {
  // G5a
  assert.equal(S.throws, 0, ex('throw'));
  assert.equal(S.idBad, 0, ex('id'));
});

test('Close-grip bench press swapped to Dips and undone gives the donor back', () => {
  // G5b
  assert.ok(S.cgbp, 'the pair is on the sample');
  assert.ok(S.cgbp.ok, S.cgbp.where);
  assert.notEqual(S.cgbp.O, S.cgbp.D);
});

test('the swap toast names the window when it fires, the V119 line on a converted unloadable swap, the hold sentence on a clamp', () => {
  // G6a
  assert.equal(S.bT, 0, ex('t'));
  assert.equal(S.missT, 0, ex('miss'));
  assert.ok(S.t3 > 0);
  assert.equal(S.t3, S.winN);
});

// G5c, G5d: a constructed duplicate-name day, and a legacy record without rx
const store = () => JSON.parse(F.localStorage.getItem('ia_swaps_P1') || '{}');
function fixtureM() {
  F.localStorage.clear(); const cfg = X.MARIO(), p = F.buildProgram(cfg), prog = Object.assign({}, p, { cfg }), day = prog.weeks[5].thu, si = mainIdx(day);
  F.ctx.__P = prog; F.eval("activeProg=__P;activeProgId='P1';currentWeek=5;currentDayKey='thu';"); return { prog, day, si };
}
function tap(day: any, si: number, ii: number, to: string) { const it = day.sections[si].items[ii]; F.ctx.__c = { secIdx: si, itemIdx: ii, name: it.name, detail: it.detail || '' }; F.eval('_swapCtx=__c;applySwapChoice(' + JSON.stringify(to) + ')'); }
const DUP = '2×4 — RPE 8 (leave ~2 reps in reserve), 3 min rest';   // hand-written, differs from the donor, under the goblet window
function inject(day: any, si: number) { const n = day.sections[si].items[0].name, tsi = day.sections.findIndex((s: any, k: number) => k !== si && s && Array.isArray(s.items)); day.sections[tsi].items.push({ name: n, detail: DUP }); return { n, tsi, tii: day.sections[tsi].items.length - 1 }; }

test('on a day carrying the same lift twice, undo puts both cards back: one tap, both taps, a boot replay', () => {
  // G5c
  { const { day, si } = fixtureM(), { n } = inject(day, si), before = JS(day.sections);
    tap(day, si, 0, GOB); F.eval('undoSwap(' + JSON.stringify(n) + ')'); assert.equal(JS(day.sections), before, 'tap A, undo'); }
  { const { day, si } = fixtureM(), { n, tsi, tii } = inject(day, si), before = JS(day.sections);
    tap(day, si, 0, GOB); tap(day, tsi, tii, GOB); F.eval('undoSwap(' + JSON.stringify(n) + ')'); assert.equal(JS(day.sections), before, 'tap A, tap B, undo'); }
  { const { day, si } = fixtureM(), { n, tsi, tii } = inject(day, si), before = JS(day.sections);
    tap(day, si, 0, GOB); F.ctx.__S = store(); F.eval('applySessionSwaps(activeProg,__S)');
    assert.equal(day.sections[tsi].items[tii].name, GOB, 'the replay renamed the second card (fixture)');
    F.eval('undoSwap(' + JSON.stringify(n) + ')'); assert.equal(JS(day.sections), before, 'tap A, replay, undo'); }
});

test('undo of a legacy record with no rx puts the name back, throws nothing and clears the record', () => {
  // G5d
  const { day, si } = fixtureM(), n = day.sections[si].items[0].name;
  tap(day, si, 0, GOB);
  const s = store(); s.w5_thu = (s.w5_thu || []).map((e: any) => ({ from: e.from, to: e.to, ts: e.ts })); F.localStorage.setItem('ia_swaps_P1', JSON.stringify(s));
  F.eval('undoSwap(' + JSON.stringify(n) + ')');
  assert.equal(day.sections[si].items[0].name, n);
  assert.equal(store().w5_thu, undefined);
});

function namedPair(cfg: Record<string, any>, w: number, d: string, fromName: string, to: string) {
  F.localStorage.clear(); const p = F.buildProgram(cfg), prog = Object.assign({}, p, { cfg }), day = prog.weeks[w][d];
  let si = -1, ii = -1;
  day.sections.forEach((s: any, a: number) => { if (si < 0 && /^main/i.test(clean(s.label))) (s.items || []).forEach((x: any, b: number) => { if (ii < 0 && clean(x.name) === fromName) { si = a; ii = b; } }); });
  assert.ok(si >= 0, 'a Main ' + fromName + ' on W' + w + ' ' + d);
  const D = day.sections[si].items[ii].detail, r = liveSwap(prog, w, d, si, ii, to); return { D, O: r.item.detail, toast: r.toast };
}
const HB = () => X.l1Cfg('home_basic', 'strength', 'beginner', 'liftonly', null);

test('home_basic Dumbbell decline press to Dips keeps the V119 line and drops the rep target', () => {
  // G6b
  const r = namedPair(HB(), 1, 'mon', 'Dumbbell decline press', 'Dips');
  assert.equal(r.toast, X.T119('Dips', 'Dumbbell decline press'));
  assert.notEqual(r.O, r.D);
  assert.ok(!X.GRAM.test(r.O));
});

test('home_basic Dumbbell Romanian deadlift 4×6 to a kettlebell single-leg deadlift carries verbatim: "Same job, same numbers."', () => {
  // G6c
  const r = namedPair(HB(), 1, 'tue', 'Dumbbell Romanian deadlift', 'Kettlebell single-leg deadlift');
  const m = X.GRAM.exec(r.D || '');
  assert.ok(m && +m[2] === 6, r.D);
  assert.equal(r.O, r.D);
  assert.equal(r.toast, X.TSAME('Kettlebell single-leg deadlift', 'Dumbbell Romanian deadlift'));
});

test('a swap preference in the config prints the window on every week it lands, on a build and on a reboot with W1 frozen', () => {
  // G7-1a
  F.localStorage.clear(); const PREF = { [DONOR]: GOB };
  const c0 = X.MARIO(), p0 = F.buildProgram(c0), cP = Object.assign(X.MARIO(), { exSwapPrefs: Object.assign({}, PREF) }), cPj = JSON.stringify(cP);
  const pp = F.buildProgram(cP);
  assert.equal(JSON.stringify(cP), cPj, 'buildProgram leaves the config unchanged');
  const slots: { w: string; d: string; k: number; j: number; D: string }[] = [];
  Object.keys(p0.weeks).forEach(w => Object.keys(p0.weeks[w]).forEach(d => {
    const a = p0.weeks[w][d]; if (!a || !Array.isArray(a.sections)) return;
    a.sections.forEach((s: any, k: number) => (s.items || []).forEach((x: any, j: number) => { if (x.name === DONOR) slots.push({ w, d, k, j, D: x.detail }); }));
  }));
  const want = (sl: (typeof slots)[number]) => { const H = X.handKind(GOB, sl.D); return H.k === 'win' ? H.out : sl.D; };
  assert.ok(slots.length > 1);
  assert.ok(slots.some(sl => X.handKind(GOB, sl.D).k === 'win'), 'some slot is under the window');
  const at = (P: any, sl: (typeof slots)[number]) => { const y = P.weeks[sl.w] && P.weeks[sl.w][sl.d]; return (y && y.sections && y.sections[sl.k] && y.sections[sl.k].items[sl.j]) || {}; };
  for (const sl of slots) { const x = at(pp, sl); assert.equal(x.name, GOB, 'build W' + sl.w + ' ' + sl.d); assert.equal(x.detail, want(sl), 'build W' + sl.w + ' ' + sl.d); }
  const w1 = slots.find(sl => +sl.w === 1);
  assert.ok(w1, 'W1 carries a box squat');
  const stored = JSON.parse(JSON.stringify(pp)); Object.assign(stored, { id: 'PF', name: 'F', created: 1, startDate: null, cfg: JSON.parse(cPj) });
  const snap = JSON.parse(JSON.stringify(p0.weeks[1][w1.d]));
  F.ctx.__SP = stored; F.eval('savePrograms([__SP]);');
  F.localStorage.setItem('ia_hist_PF', JSON.stringify({ ['w1_' + w1.d]: snap }));
  const rb = F.eval("refreshProgram(getPrograms().find(function(x){return x.id==='PF';}))");
  assert.equal(JS(rb.weeks[1][w1.d]), JS(snap), 'frozen W1 is byte-identical to its snapshot');
  for (const sl of slots.filter(s => +s.w > 1)) { const x = at(rb, sl); assert.equal(x.name, GOB); assert.equal(x.detail, want(sl), 'reboot W' + sl.w + ' ' + sl.d); }
});

test('the injury filter still runs after a preference: Box jumps lands when healthy and never on a knee workaround ("Jumps are out.")', () => {
  // G7-1b
  assert.ok(F.html.replace(/^\s*\/\/.*$/gm, '').includes('Jumps are out.'), 'the doctrine line is in the app');
  const PREF = { [DONOR]: 'Box jumps' };
  const count = (P: any) => { let n = 0; Object.values(P.weeks).forEach((W: any) => Object.values(W).forEach((D: any) => ((D && D.sections) || []).forEach((s: any) => ((s && s.items) || []).forEach((x: any) => { if (x && /jump/i.test(x.name || '')) n++; })))); return n; };
  const h = X.MARIO(); delete h.injury; h.exSwapPrefs = Object.assign({}, PREF);
  const k = Object.assign(X.MARIO(), { exSwapPrefs: Object.assign({}, PREF) });
  assert.ok(count(F.buildProgram(h)) > 0);
  assert.equal(count(F.buildProgram(k)), 0);
});

test('a day restored from an ia_hist_ snapshot at 4×3 and swapped again shows the window live', () => {
  // G7-2a
  F.localStorage.clear(); const p = F.buildProgram(X.MARIO());
  const stored = JSON.parse(JSON.stringify(p)); Object.assign(stored, { id: 'PH', name: 'H', created: 1, startDate: null, cfg: X.MARIO() });
  const snap = JSON.parse(JSON.stringify(p.weeks[5].thu)), si = mainIdx(snap);
  assert.equal(clean(snap.sections[si].items[0].name), DONOR); assert.equal(snap.sections[si].items[0].detail, DONOR_M);
  F.ctx.__SP = stored; F.eval('savePrograms([__SP]);'); F.localStorage.setItem('ia_hist_PH', JSON.stringify({ w5_thu: snap }));
  const day = F.eval("activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PH';}));activeProgId='PH';currentWeek=5;currentDayKey='thu';activeProg.weeks[5].thu");
  assert.equal(JS(day), JS(snap), 'restored from the snapshot');
  F.ctx.__c = { secIdx: si, itemIdx: 0, name: day.sections[si].items[0].name, detail: day.sections[si].items[0].detail };
  F.eval("globalThis.__T=null;_swapCtx=__c;applySwapChoice('Dumbbell goblet squat')");
  const live = F.eval('activeProg.weeks[5].thu').sections[si].items[0];
  assert.equal(live.name, GOB); assert.equal(live.detail, EXPG); assert.equal(F.eval('globalThis.__T'), EXPT);
});

// ── the boot replays the athlete's swaps (D181 R4', R5), the cue (D190), the undo chip (D192) ──────────────────────
const RX_TAIL = ' — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const RX812 = '4×8–12' + RX_TAIL, RX3 = '4×3' + RX_TAIL;

test('a boot equals itself and a fresh-page boot (Mario, the ankle plan, HALF_MANNY)', () => {
  for (const ck of ['knee_wa', 'ankle_wa', 'manny']) {
    const A = X.page(); X.setup(A, ck, X.CFGS[ck]); X.boot(A);
    const a = JS(X.dayOf(A, 5, 'thu')); X.boot(A); const b = JS(X.dayOf(A, 5, 'thu')); const c = JS(X.dayOf(X.reboot(A), 5, 'thu'));
    assert.ok(a.length > 20, ck); assert.equal(b, a, ck); assert.equal(c, a, ck);
  }
});

/** Mario's W5 Thursday, untouched, with the box squat's slot. */
function marioThu() {
  const A = X.page(); X.setup(A, 'knee_wa', X.CFGS.knee_wa); X.boot(A); X.view(A, 5, 'thu');
  let L0 = null as { si: number; ii: number } | null;
  (X.dayOf(A, 5, 'thu').sections || []).forEach((s: any, si: number) => (s.items || []).forEach((it: any, ii: number) => { if (!L0 && clean(it.name) === DONOR) L0 = { si, ii }; }));
  assert.ok(L0, 'the box squat is on Mario W5 Thursday');
  const slot = (T: App) => { const it = X.dayOf(T, 5, 'thu').sections[L0!.si].items[L0!.ii]; return clean(it.name) + ' | ' + clean(it.detail); };
  const daySig = (T: App) => X.sig(X.dayOf(T, 5, 'thu'));
  const swapTo = (T: App, to: string) => X.hop(T, 5, 'thu', { si: L0!.si, ii: L0!.ii, to });
  const chip = (T: App) => { X.view(T, 5, 'thu'); return E(T, 'swapOriginOf(' + JSON.stringify(clean(X.dayOf(T, 5, 'thu').sections[L0!.si].items[L0!.ii].name)) + ')') || '-'; };
  const undo = (T: App, from: string) => { X.view(T, 5, 'thu'); E(T, 'undoSwap(' + JSON.stringify(from) + ');'); };
  const rb = (T: App) => { const R = X.reboot(T); X.view(R, 5, 'thu'); return R; };
  return { A, slot, daySig, swapTo, chip, undo, rb };
}

test('box squat to goblet squat to leg press boots as the last live card, and two undos walk back one step each', () => {
  // chain row 5: Leg press 4×8–12 ("Same job, same numbers." carries the goblet's dose), the chip names the goblet,
  // undo -> goblet 4×8–12, survives a boot, the chip names the box squat, undo -> box squat 4×3, survives a boot,
  // the day's swap store is empty
  const M = marioThu(); let A = M.A;
  assert.equal(M.slot(A), DONOR + ' | ' + RX3);
  assert.equal(M.swapTo(A, GOB) + M.swapTo(A, LP), 0, 'both hops offered by the sheet');
  const live = M.slot(A), liveS = M.daySig(A);
  assert.equal(live, LP + ' | ' + RX812);
  A = M.rb(A);
  assert.equal(M.slot(A), live); assert.equal(M.daySig(A), liveS);
  const chip1 = M.chip(A); assert.equal(chip1, GOB);
  M.undo(A, chip1); assert.equal(M.slot(A), GOB + ' | ' + RX812);
  A = M.rb(A); assert.equal(M.slot(A), GOB + ' | ' + RX812);
  const chip2 = M.chip(A); assert.equal(chip2, DONOR);
  M.undo(A, chip2); assert.equal(M.slot(A), DONOR + ' | ' + RX3);
  A = M.rb(A); assert.equal(M.slot(A), DONOR + ' | ' + RX3);
  const left = X.Jget(A, 'ia_swaps_PM').w5_thu; assert.ok(!left || !left.length);
});

test('a two-step cycle back to the box squat boots as the last live card, twice', () => {
  // chain row 5c: box -> goblet -> box carries the goblet's 4×8–12 back onto the box squat
  const M = marioThu(); let A = M.A;
  assert.equal(M.swapTo(A, GOB) + M.swapTo(A, DONOR), 0);
  const live = M.slot(A), liveS = M.daySig(A);
  assert.equal(live, DONOR + ' | ' + RX812);
  A = M.rb(A); assert.equal(M.slot(A), live); assert.equal(M.daySig(A), liveS);
  A = M.rb(A); assert.equal(M.slot(A), live); assert.equal(M.daySig(A), liveS);
});

// The chain sample: one chain per class per day (hop3 once off a hop2 and once off a cyc2), seeded, on W5 Thu and Sat
// of Mario (knee) and HALF_MANNY. The sweep walks eight configs, W3 and W5, every day.
const SAMPLE_CK = ['knee_wa', 'manny'];
const ONE = { hop1: 1, hop2: 1, cyc2: 1, hop3: 1, cyc3: 1, collide2: 1, exch3: 1 };
const CHAINS = ([] as X.Chain[]).concat(...SAMPLE_CK.map(ck => X.enumerate(ck, [5], ['thu', 'sat'], ONE)));
const RES = new Map<string, X.ChainRun>();
for (const ck of SAMPLE_CK) X.runChains(CHAINS.filter(c => c.ck === ck), 'u', true).forEach((v, k) => RES.set(k, v));
const ROWS = CHAINS.map(c => Object.assign({ c }, RES.get(c.id)));
const REACH = ROWS.filter(r => !r.unreach);
const tagOf = (r: { c: X.Chain }) => r.c.ck + ' W' + r.c.w + ' ' + r.c.d + ' ' + r.c.cls + ' ' + r.c.hops[0].from + ' > ' + r.c.hops.map(h => h.to).join(' > ');

test('the chain sample reaches every class', () => {
  for (const cls of X.CLASSES) assert.ok(REACH.some(r => r.c.cls === cls), cls);
  assert.ok(REACH.some(r => r.pre !== r.liveSig), 'some chain moved the live card');
  assert.ok(REACH.some(r => r.rec.length >= 2), 'some day boots with two records');
});

test('an untouched one-slot chain boots as the last live card, name and detail', () => {
  // chain row 5L (hop2, cyc2): the replay runs each record in recording order through the sheet's own function
  const bad = REACH.filter(r => (r.c.cls === 'hop2' || r.c.cls === 'cyc2') && !r.eq);
  assert.deepEqual(bad.map(tagOf), []);
});

test('an untouched chain across two slots boots as the whole live day', () => {
  // chain row 5X (collide2, exch3)
  const rows = REACH.filter(r => r.c.cls === 'collide2' || r.c.cls === 'exch3');
  assert.ok(rows.length > 0);
  assert.deepEqual(rows.filter(r => r.bootSig !== r.liveSig).map(tagOf), []);
});

test("the day's store keeps one record per hop exactly when the hops' from names are distinct", () => {
  // seam a-MEM: store membership == hand membership
  assert.deepEqual(REACH.filter(r => X.storeU(r.c, r.rec) !== X.inU(r.c)).map(tagOf), []);
  assert.ok(REACH.some(r => !X.inU(r.c)), 'the sample holds a revisit chain');
});

test('on a complete store, every touched slot boots as the live card', () => {
  // seam a-U
  const U = REACH.filter(r => X.inU(r.c));
  assert.ok(U.length > 0);
  assert.deepEqual(U.filter(r => !r.eq).map(tagOf), []);
});

test('the undo chip names the lift that just left: the last hop\'s from', () => {
  // undokey d2-CHIP (the whole walk, revisits included) and seam d-U's chip half
  assert.deepEqual(REACH.filter(r => r.chip !== X.handChip(r.c)).map(r => tagOf(r) + ' chip ' + r.chip), []);
  assert.ok(REACH.some(r => !X.inUd(r.c)), 'the sample holds a chain whose to names repeat');
});

test('one undo puts the day back as it was before the last hop, and on a complete store leaves the first hops recorded', () => {
  // undokey d2-UNDO, seam d-U's undo half
  assert.deepEqual(REACH.filter(r => !r.undoEq).map(tagOf), []);
  assert.deepEqual(REACH.filter(r => X.inU(r.c) && r.recAfter!.join('|') !== X.handStore(r.c).join('|')).map(r => tagOf(r) + ' ' + r.recAfter!.join(',')), []);
});

test('after an undo on a complete store, a fresh boot shows the day the athlete sees', () => {
  // undokey d2-BOOT-U
  assert.deepEqual(REACH.filter(r => X.inU(r.c) && r.bootAfterUndoJ !== r.afterJ).map(tagOf), []);
});

const patOf = (() => { const P = X.page(), c: Record<string, any> = {}; return (n: string) => (n in c) ? c[n] : (c[n] = E(P, '_pattern(' + JSON.stringify(n) + ')') || null); })();

// The four natively cued items (D190 (e)): Mario W3 Thu Reverse lunge (KB), W5 Thu Step-ups (KB), both in Leg superset
// A; the ankle plan's Dumbbell Bulgarian split squat, W3 and W5 Thu. Each is a lunge pattern, capped on both plans.
const CUED = [
  { ck: 'knee_wa', w: 3, d: 'thu', sec: 'Leg superset A', name: 'Reverse lunge (KB)', pat: 'lunge' },
  { ck: 'knee_wa', w: 5, d: 'thu', sec: 'Leg superset A', name: 'Step-ups (KB)', pat: 'lunge' },
  { ck: 'ankle_wa', w: 3, d: 'thu', sec: null, name: 'Dumbbell Bulgarian split squat', pat: 'lunge' },
  { ck: 'ankle_wa', w: 5, d: 'thu', sec: null, name: 'Dumbbell Bulgarian split squat', pat: 'lunge' },
];
const LOC = CUED.map(h => {
  const A = X.page(); X.setup(A, h.ck, X.CFGS[h.ck]); X.boot(A); const hits: { si: number; ii: number; label: string; detail: string }[] = [];
  ((X.dayOf(A, h.w, h.d) || {}).sections || []).forEach((s: any, si: number) => (s.items || []).forEach((it: any, ii: number) => { if (it && clean(it.name) === h.name) hits.push({ si, ii, label: clean(s.label), detail: it.detail || '' }); }));
  return { h, hits };
});
// The chains off the cued items: every hop1, one hop2 and one cyc2 per item (the sweep takes every chain).
const CUED_REACH: ({ c: X.Chain } & X.ChainRun)[] = [];
for (const ck of ['knee_wa', 'ankle_wa']) {
  const all = X.enumerate(ck, [3, 5], ['thu'], { hop1: Infinity, hop2: Infinity, cyc2: Infinity });
  const mine: X.Chain[] = [];
  for (const L of LOC.filter(x => x.h.ck === ck && x.hits.length === 1)) {
    const from = all.filter(c => c.w === L.h.w && c.hops[0].si === L.hits[0].si && c.hops[0].ii === L.hits[0].ii);
    mine.push(...from.filter(c => c.cls === 'hop1'), ...from.filter(c => c.cls === 'hop2').slice(0, 1), ...from.filter(c => c.cls === 'cyc2').slice(0, 1));
  }
  const res = X.runChains(mine, 'u', false);
  for (const c of mine) { const r = res.get(c.id) as X.ChainRun; if (!r.unreach) CUED_REACH.push(Object.assign({ c }, r)); }
}

test('after every live swap the card carries the plan\'s cue exactly when the plan caps the movement now on it', () => {
  // cuecap b-ALL (the chain sample and the chains off the cued items); an uninjured athlete never sees the cue
  let hops = 0, cued = 0, offCued = 0, plain = 0;
  const bad: string[] = [];
  for (const r of REACH.concat(CUED_REACH)) {
    const region = X.REGION(r.c.ck);
    r.c.hops.forEach((h, k) => {
      const st = r.steps[k], v = X.cueIff(region, patOf(h.to), st.d); hops++;
      if (v.want) cued++; else plain++;
      if (k > 0 && r.steps[k - 1].d.endsWith(X.CUE)) offCued++;
      if (!v.ok || st.n !== clean(h.to)) bad.push(tagOf(r) + ' hop' + (k + 1) + ' ' + st.n + ' :: ' + st.d);
    });
  }
  assert.ok(hops > 0 && cued > 0 && plain > 0, 'hops the plan cues and hops it does not');
  assert.ok(offCued > 0 || CUED_REACH.length > 0, 'hops off a cued donor');
  assert.deepEqual(bad, []);
});

test("a touched day boots byte for byte as its ia_hist_ record, with no name twice, whether touched before or after the chain", () => {
  // chain rows 8, 8d (modes t1 and t2)
  for (const mode of ['t1', 't2']) {
    for (const ck of ['knee_wa', 'manny']) {
      const chains = CHAINS.filter(c => c.ck === ck && c.d === 'thu' && ['hop2', 'cyc2', 'collide2', 'exch3'].includes(c.cls));
      const res = X.runChains(chains, mode, false);
      let n = 0;
      for (const c of chains) {
        const r = res.get(c.id) as X.ChainRun; if (r.unreach) continue; n++;
        assert.ok(r.histJ, mode + ' ' + ck + ' ' + c.cls + ': a snapshot was written');
        assert.equal(r.bootJ, r.histJ, mode + ' ' + ck + ' ' + c.cls + ': the boot is the snapshot');
        assert.equal(r.dup, null, mode + ' ' + ck + ' ' + c.cls + ': no name twice');
        assert.ok(r.rec.length > 0, 'the record is kept');
      }
      assert.ok(n > 0, mode + ' ' + ck);
    }
  }
});

test('the four natively cued items sit on their days once each, carry the cue, and their lunge pattern is capped', () => {
  // seam e-PRE
  for (const { h, hits } of LOC) {
    assert.equal(hits.length, 1, h.ck + ' W' + h.w + ' ' + h.name);
    if (h.sec) assert.ok(hits[0].label.startsWith(h.sec), hits[0].label);
    assert.ok(hits[0].detail.endsWith(X.CUE), hits[0].detail);
    assert.ok(X.CAP[X.REGION(h.ck)].includes(h.pat));
    assert.equal(patOf(h.name), h.pat);
  }
});

test('every chain off a natively cued item boots as the live day', () => {
  // seam e (sample: every hop1, one hop2 and one cyc2 per item; the sweep takes every chain)
  assert.ok(CUED_REACH.length >= 8);
  assert.deepEqual(CUED_REACH.filter(r => !(r.eq && r.liveSig === r.bootSig)).map(tagOf), []);
});

test("HALF_MANNY W3 Monday trap bar deadlift to RDL to deadlift to RDL: the chip says Deadlift and one undo walks back one step", () => {
  // undokey PIN (the D192 ruling's own chain). D243 (v0.243.0) moved his pull day, and this main with it, from
  // Thursday to Monday, his one speed day.
  const A = X.page(); X.setup(A, 'manny', X.CFGS.manny); X.boot(A);
  const hits: { si: number; ii: number }[] = [];
  (X.dayOf(A, 3, 'mon').sections || []).forEach((s: any, si: number) => (s.items || []).forEach((it: any, ii: number) => { if (it && it.name === 'Trap bar deadlift' && clean(s.label).startsWith('Main')) hits.push({ si, ii }); }));
  assert.equal(hits.length, 1);
  const { si, ii } = hits[0], seq = ['Trap bar deadlift', 'Barbell Romanian deadlift', 'Deadlift', 'Barbell Romanian deadlift'];
  const c = { id: 'pin', ck: 'manny', cls: 'hop3', w: 3, d: 'mon', hops: seq.slice(1).map((to, k) => ({ si, ii, from: seq[k], to })) };
  const r = X.runChains([c], 'u', true).get('pin') as X.ChainRun;
  assert.equal(r.unreach, 0);
  assert.equal(r.chip, 'Deadlift');
  assert.ok(r.undoEq);
  assert.deepEqual(r.recAfter, ['Trap bar deadlift->Barbell Romanian deadlift', 'Barbell Romanian deadlift->Deadlift']);
  assert.equal(r.slotAfter, 'Deadlift');
  assert.ok(X.inU(c));
  assert.equal(r.bootAfterUndoJ, r.afterJ);
});

test('no build and no boot reads the undo chip', () => {
  // undokey d2-MANNY's second half (its digest half is program-output's)
  const A = X.page();
  E(A, 'globalThis.__soN=0;(function(){var o=swapOriginOf;swapOriginOf=function(){globalThis.__soN++;return o.apply(this,arguments);};})();');
  const d1 = progDigest(A.buildProgram(clone(fixtures.HALF_MANNY))), d2 = progDigest(A.buildProgram(clone(fixtures.HALF_MANNY)));
  assert.equal(d1, d2);
  X.setup(A, 'manny', X.CFGS.manny); X.boot(A);
  const n = E(A, 'globalThis.__soN');
  assert.equal(n, 0);
  E(A, 'swapOriginOf("Deadlift");');
  assert.equal(E(A, 'globalThis.__soN'), 1, 'the counter is wired');
});

// ── the cue on the ruling's own chains (D190 (b)) ────────────────────────────────────────────────────────────────
const KB = 'Kettlebell swing', SSDL = 'Dumbbell split-stance deadlift', NORD = 'Nordic hamstring curl (anchored)';
const PAT_TYPED: Record<string, string> = { [KB]: 'hinge', [SSDL]: 'hinge', [GOB]: 'squat', [NORD]: 'hip_ext' };
const RX8 = '2×8', RX8C = RX8 + X.CUE, BW8 = '2 sets — RPE 8 (stop 2 reps short of failure)';
const TOAST_GOB = 'Dumbbell goblet squat in, kettlebell swing out. Same job, same numbers.';
for (const h of [
  { name: 'Mario W5 Thu: kettlebell swing to split-stance deadlift (2×8) to goblet squat, which takes the cue', ck: 'knee_wa', w: 5, hops: [SSDL, GOB], want: [RX8, RX8C], toast: [null, null] },
  { name: 'ankle plan W3 Thu: kettlebell swing to goblet squat (cued, "Same job, same numbers.") to split-stance deadlift, which drops it', ck: 'ankle_wa', w: 3, hops: [GOB, SSDL], want: [RX8C, RX8], toast: [TOAST_GOB, null] },
  { name: 'ankle plan W3 Thu: kettlebell swing to goblet squat (cued) to a Nordic curl, which prints its bodyweight sets', ck: 'ankle_wa', w: 3, hops: [GOB, NORD], want: [RX8C, BW8], toast: [TOAST_GOB, null] },
]) {
  test(h.name + ', and each hop boots as the live card', () => {
    // cuecap b-HAND-1, b-HAND-2, b-HAND-3 (Leg superset B, donor Kettlebell swing 2×8)
    const r = X.REGION(h.ck);
    h.hops.forEach((to, k) => assert.equal(X.CAP[r as string].includes(PAT_TYPED[to]), h.want[k].endsWith(X.CUE), 'the typed oracle agrees with itself'));
    for (const n of [KB].concat(h.hops)) assert.equal(patOf(n), PAT_TYPED[n], n);
    const A = X.page(); X.setup(A, h.ck, X.CFGS[h.ck]); X.boot(A); const d0 = X.dayOf(A, h.w, 'thu'); let L = null as { si: number; ii: number } | null;
    (d0.sections || []).forEach((s: any, si: number) => { if (!clean(s.label).startsWith('Leg superset B')) return; (s.items || []).forEach((it: any, ii: number) => { if (!L && clean(it.name) === KB) L = { si, ii }; }); });
    assert.ok(L, 'a kettlebell swing in Leg superset B');
    assert.deepEqual(X.slotOf(d0, L.si, L.ii), { n: KB, d: RX8 });
    for (let k = 1; k <= h.hops.length; k++) {
      const P = X.page(); X.setup(P, h.ck, X.CFGS[h.ck]); X.boot(P); let toast = '';
      for (let j = 0; j < k; j++) { E(P, '__T.length=0;'); assert.equal(X.hop(P, h.w, 'thu', { si: L.si, ii: L.ii, to: h.hops[j] }), 0, 'offered'); toast = Array.from(E(P, '__T')).join(' / '); }
      const live = X.slotOf(X.dayOf(P, h.w, 'thu'), L.si, L.ii), liveS = X.sig(X.dayOf(P, h.w, 'thu'));
      const R = X.reboot(P);
      assert.deepEqual(live, { n: h.hops[k - 1], d: h.want[k - 1] }, 'hop ' + k);
      assert.deepEqual(X.slotOf(X.dayOf(R, h.w, 'thu'), L.si, L.ii), live, 'hop ' + k + ' boots as live');
      assert.equal(X.sig(X.dayOf(R, h.w, 'thu')), liveS, 'hop ' + k + ' whole day');
      if (h.toast[k - 1] !== null) assert.equal(toast, h.toast[k - 1]);
    }
  });
}

// ── the build-time preference keeps the cue on the plan and the movement on the card (D190 build path) ─────────
const capped = (reg: string, n: string) => { const p = patOf(n); return !!p && X.CAP[reg].includes(p); };
const cueViol = (reg: string, c: X.Card) => c.det.endsWith(X.CUE) !== (capped(reg, c.n) && !/RPE/.test(X.stripCue(c.det)));

test("a preference for Reverse lunge (KB) on a knee plan prints the deadlift's own dose; Dumbbell incline press to Cable pushdown on a shoulder plan likewise", () => {
  // prefpath c2-hand: W3 and W4 Thu Leg superset A `2×8–12 each @ RPE 7`; W1 Mon `3×8–12 @ RPE 6–7`
  const HAND = [
    { reg: 'knee', src: 'Reverse lunge (KB)', tgt: SSDL, pat: 'hinge', label: 'Leg superset A', cells: [[3, 'thu'], [4, 'thu']], want: '2×8–12 each @ RPE 7' },
    { reg: 'shoulder', src: 'Dumbbell incline press', tgt: 'Cable pushdown', pat: 'tri_iso', label: null, cells: [[1, 'mon']], want: '3×8–12 @ RPE 6–7' },
  ];
  let n = 0;
  for (const h of HAND) {
    assert.equal(patOf(h.tgt), h.pat);
    assert.ok(!X.CAP[h.reg].includes(h.pat), 'uncapped on the plan');
    const A = X.cards(X.prefCfg(h.reg, { [h.src]: h.tgt }));
    for (const [w, d] of h.cells) {
      const hit = [...A.values()].filter(c => c.w === w && c.d === d && c.n === h.tgt && (!h.label || c.label.replace(/ — .*/, '') === h.label));
      assert.ok(hit.length > 0, h.reg + ' W' + w + ' ' + d + ' carries ' + h.tgt);
      for (const c of hit) { n++; assert.equal(c.det, h.want); }
    }
  }
  assert.ok(n >= 3);
});

// A sample of preference builds: two natively cued sources per region, one target each, seeded (the sweep builds every
// source and every target).
const PREFS = X.prefPopulation(X.PREF_REGIONS, 1, 2);
const PREF_BUILDS = PREFS.map(r => ({ r, A: X.cards(X.prefCfg(r.reg, { [r.src]: r.tgt })) }));

test('every card of a preference build carries the cue exactly when the plan caps it and its dose names no RPE', () => {
  // prefpath c2-i
  for (const reg of X.PREF_REGIONS) assert.ok(PREFS.some(r => r.reg === reg), reg + ' contributes a preference build');
  const bad: string[] = [];
  let n = 0;
  for (const { r, A } of PREF_BUILDS) for (const c of A.values()) { n++; if (cueViol(r.reg, c)) bad.push(r.reg + ' {' + r.src + ' -> ' + r.tgt + '} W' + c.w + ' ' + c.d + ' ' + c.n + ' ' + c.det); }
  assert.ok(n > 0);
  assert.deepEqual(bad.slice(0, 5), []);
});

test('an uncapped preference target prints what the uninjured build with the same preference prints in that slot', () => {
  // prefpath c2-ii (reference: the uninjured build with the same preference, which never meets a cue)
  let pop = 0;
  const bad: string[] = [];
  for (const { r, A } of PREF_BUILDS) {
    const U = X.cards(X.prefCfg(null, { [r.src]: r.tgt }));
    for (const a of A.values()) {
      if (a.n !== r.tgt) continue;
      const u = U.get(a.k);
      if (!u || u.n !== a.n || capped(r.reg, a.n)) continue;
      pop++; if (u.det !== a.det) bad.push(r.reg + ' ' + a.k + ' ' + a.n + ' ' + a.det + ' vs ' + u.det);
    }
  }
  assert.ok(pop > 0);
  assert.deepEqual(bad.slice(0, 5), []);
});
