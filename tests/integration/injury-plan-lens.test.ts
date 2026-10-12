// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// The injury plan of the day (D194): outside buildProgram the plan that governs a card is the plan of the day the card
// is on. Since V98 an injury reaches a program only as an overlay, so the sheets (swap, aux, add), the swap tap and the
// boot replay all read the day's overlay stamp, and D193's hold reaches the athlete the app actually builds. Also the
// late plan change (D194 Amendment 5): a plan written after swaps re-filters whole days at boot.
// The parity table is docs/test-migration/13-injury-overlays.md; the lattices run in tests/sweeps/injury-overlays.test.js.
//
// PRESENTATIONS (tests/support/injury-overlays.js): CFG stores the injury in cfg (the fixture); OV writes it with the
// app's own overlay writer. The fixture column is the ruling's stated answer: an overlay program must read exactly as
// the fixture does. Every record is seeded and clock-pinned and shown to equal itself before records are compared.
// ORACLES: the judge (the injury filter on a fully injured cfg, in a separate app) says which listed names a plan
// rejects; the hand cap table, the R7 text, the hold sentence and every toast are typed.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { pinClock } from '../support/app.ts';
import * as I from '../support/injury-overlays.ts';

const { clean, host, E } = I;
const judge = I.judgeMaker();
const W5 = '2026-09-24';   // W5 Thursday
const W5MON = '2026-09-21';
const W1 = '2026-08-24';   // W1 Monday, the program's start
const KNEE = { region: 'knee', tier: 'workaround' };
const D8 = '2×6–10 @ RPE 8';
const D7 = '2×6–10 @ RPE 7';
const TSAME = (to: any, from: any) => `${to} in, ${from.toLowerCase()} out. Same job, same numbers.`;
const TSAMEH = (to: any, from: any) => `${to} in, ${from.toLowerCase()} out. Same sets, same reps.${I.HOLD}`;
const T119H = (to: any, from: any) => `${to} in, ${from.toLowerCase()} out. No load to add here.${I.HOLD}`;

// ── the records themselves ──────────────────────────────────────────────────────────────────────────────────────────
test('a stored record, fixture or overlay, written twice equals itself', () => {
  for (const ck of ['mario', 'elbow_wa']) for (const [pres, clock, from] of [['CFG', W5], ['CFG', W1], ['OV', W5, W5MON], ['OV', W1, W1]]) {
    const a = I.stored(I.sharedApp(clock, 3), I.L9[ck], pres, from);
    assert.equal(I.stored(I.sharedApp(clock, 4), I.L9[ck], pres, from), a, `${ck} ${pres} ${clock}`);
    assert.ok(a.length > 1000);
  }
});

test('the app\'s overlay writer stamps every carded day of the injured build, and each day equals the fixture\'s', () => {
  for (const ck of ['mario', 'elbow_wa', 'lowback_wa']) {
    const cfg = I.L9[ck];
    const ov = I.progAt(cfg, 'OV', W1, W1).X;
    const fx = I.progAt(cfg, 'CFG', W1, undefined, 1).X;
    const ovW = JSON.parse(E(ov, 'JSON.stringify(activeProg.weeks)'));
    const fxW = JSON.parse(E(fx, 'JSON.stringify(activeProg.weeks)'));
    // the synthetic stamp (applyOverlays' output shape) equals the writer's program on every day
    const syn = I.clone(I.sharedApp(W1, 3).buildProgram(I.clone(cfg)));
    const stamped = I.stampWeeks(syn.weeks, I.stampKey(cfg.injury));
    assert.ok(stamped > 0);
    for (const w of Object.keys(syn.weeks)) for (const d of Object.keys(syn.weeks[w])) assert.equal(JSON.stringify(syn.weeks[w][d]), JSON.stringify(ovW[w] && ovW[w][d]), `${ck} W${w} ${d} stamp`);
    let carded = 0;
    for (const w of Object.keys(fxW)) for (const d of Object.keys(fxW[w])) {
      const a = fxW[w][d];
      if (!a || !Array.isArray(a.sections) || !a.sections.length) continue;
      carded++;
      const b = { ...ovW[w][d] };
      assert.equal(typeof b._ovKey, 'string', `${ck} W${w} ${d} is stamped`);
      delete b._ovKey;
      assert.equal(JSON.stringify(b), JSON.stringify(a), `${ck} W${w} ${d}`);
    }
    assert.ok(carded > 20);
  }
});

// ── D193's build half reaches an overlay athlete ────────────────────────────────────────────────────────────────────
const itemsOf = (X: any, w: any) => {
  const wk = I.weekOf(X, w);
  const o = [];
  I.ISO_DAYS.forEach((d) => ((wk[d] && wk[d].sections) || []).forEach((s) => (s.items || []).forEach((it) => { if (it && it.name) o.push({ d, n: clean(it.name), det: it.detail || '' }); })));
  const carded = I.ISO_DAYS.filter((d) => wk[d] && wk[d].sections && wk[d].sections.length);
  return { o, carded: carded.length, stamped: carded.filter((d) => wk[d]._ovKey).length };
};
const pat = I.patternOf(I.sharedApp(W5, 3));

test('on the overlay path no capped card prints above RPE 7, and every overlay card equals the fixture\'s card', () => {
  const lowbackBW = I.withInj({ region: 'lowback', tier: 'workaround' }, { equipment: 'bodyweight' });
  for (const [cfg, n, cue] of [[I.L9.mario, 31, 1], [lowbackBW, 30, null]]) {
    const cap = I.capOf(cfg);
    const a = itemsOf(I.progAt(cfg, 'OV', W5, W5MON).X, 5);
    const b = itemsOf(I.progAt(cfg, 'CFG', W5, undefined, 1).X, 5);
    assert.deepEqual(a.o.filter((i) => cap.includes(pat(i.n)) && I.rpeMax(i.det) > 7).map((i) => `${i.d} ${i.n}`), []);
    if (cue !== null) assert.equal(a.o.filter((i) => I.CUE_RE.test(i.det)).length, cue, 'the cue prints once on Mario\'s W5');
    assert.equal(a.o.length, n);
    assert.deepEqual(a.o, b.o);
    assert.equal(a.stamped, a.carded);
  }
});

test('on the overlay path a held lift does not test: the knee plan\'s W6 box squat reads R7\'s text, the uncapped deadlift tests', () => {
  const cfg = I.withInj(KNEE, { liftingFocus: 'strength' });
  const { X } = I.progAt(cfg, 'OV', W5, W5MON);
  assert.equal(E(X, 'activeProg.totalWeeks'), 6);
  const main = (d) => { const s = I.dayOf(X, 6, d).sections[0]; return [clean(s.label), s.items[0].detail]; };
  assert.deepEqual(main('thu'), ['Main — Barbell box squat', I.R7_T]);
  assert.deepEqual(main('tue'), ['Main — Barbell Romanian deadlift', I.TEST_T]);
  const a = itemsOf(X, 6);
  const b = itemsOf(I.progAt(cfg, 'CFG', W5, undefined, 1).X, 6);
  assert.equal(a.o.length, 33);
  assert.deepEqual(a.o, b.o);
  assert.equal(a.stamped, a.carded);
});

// ── the sheets read the plan of the day ─────────────────────────────────────────────────────────────────────────────
test('Mario\'s knee overlay: W5 swap, aux and add sheets offer nothing the knee plan rejects, and equal the fixture\'s sheets', () => {
  const { X } = I.progAt(I.L9.mario, 'OV', W5, W5MON);
  assert.equal(E(X, 'JSON.stringify(activeProg.cfg.injury||null)'), 'null', 'the injury lives in the overlay, not cfg');
  assert.equal(I.stampOf(X, 5, 'thu'), I.stampKey(KNEE), 'W5 Thursday carries the knee stamp');
  assert.equal(I.stampOf(X, 3, 'thu'), null, 'W3 is before the overlay');
  const o5 = I.weekLists(X, 5);
  const swap = I.rejSum(o5, I.L9.mario, ['pat'], null, judge);
  const aux = I.rejSum(o5, I.L9.mario, ['aux'], null, judge);
  const add = I.rejSum(o5, I.L9.mario, ['add'], null, judge);
  assert.deepEqual([swap.rej, aux.rej, add.rej], [0, 0, 0], [...swap.ex, ...aux.ex, ...add.ex].join('; '));
  assert.deepEqual([swap.rows, swap.offers, aux.offers, add.rows, add.offers], [22, 222, 66, 5, 79]);
  const f5 = I.weekLists(I.progAt(I.L9.mario, 'CFG', W5, undefined, 1).X, 5);
  const eq = I.listsEqual(o5, f5);
  assert.ok(eq.all && eq.n === 32, JSON.stringify(eq));
  // before the overlay the sheets read the uninjured program's sheets
  const eq3 = I.listsEqual(I.weekLists(X, 3), I.weekLists(I.progAt(I.L9.mario_noinj, 'CFG', W5, undefined, 2).X, 3));
  assert.ok(eq3.all && eq3.n === 32, JSON.stringify(eq3));
});

test('a plan written from a Thursday governs Thursday on, and the days before it keep the uninjured sheets', () => {
  const { X } = I.progAt(I.L9.mario, 'OV', W5, '2026-09-24');
  const L = I.weekLists(X, 5);
  assert.deepEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((d) => !!L[d].stamp), [false, false, false, true, true, true]);
  for (const d of ['thu', 'fri', 'sat']) assert.equal(I.rejSum(L, I.L9.mario, ['pat', 'aux', 'add'], [d], judge).rej, 0, d);
  // an unstamped Tuesday is still the uninjured program's: it offers the jump squats the knee plan would refuse
  const tue = I.rejSum(L, I.L9.mario, ['pat', 'aux', 'add'], ['tue'], judge);
  assert.deepEqual([tue.rej, tue.offers, tue.ex], [2, 77, ['tue Sumo deadlift: Jump squats', 'tue (add): g:Jump squats']]);
  const U = I.weekLists(I.progAt(I.L9.mario_noinj, 'CFG', W5, undefined, 1).X, 5);
  for (const d of ['mon', 'tue']) assert.ok(I.listsEqual(L, U, [d]).all, d);
});

test('a travel-only overlay stamps its days with the substitute patch and no injury', () => {
  const { X } = I.progAt(I.L9.mario_noinj, 'CFG', W5);
  E(X, "_ovDraft.equipment='minimal';_ovDraft.from='2026-09-22';_ovDraft.to='2026-09-24';applyOverlayDraft();");
  const st = I.ISO_DAYS.filter((d) => /substitute/.test(String(I.stampOf(X, 5, d) || '')));
  assert.deepEqual(st, ['tue', 'thu']);
  assert.ok(st.every((d) => !/injury/.test(I.stampOf(X, 5, d))));
});

test('coming back from the injury: the bridge days offer nothing the knee plan rejects, then the half step', () => {
  const { X } = I.progAt(I.L9.mario, 'OV', W5, W5MON);
  pinClock(X, new Date(W5 + 'T12:01:00'));   // a minute on, so the new overlays get ids of their own
  const id = E(X, "activeProg.overlays.find(function(o){return o.type==='injury';}).id");
  E(X, `imBackFromInjury(${JSON.stringify(id)});`);
  const kinds = { bridge: [], halfstep: [] };
  let rej = 0;
  let offers = 0;
  for (const w of [5, 6, 7]) for (const d of I.DAYS) {
    const s = I.stampOf(X, w, d);
    if (typeof s !== 'string') continue;
    const p = (JSON.parse(s)[1] || {}).injury || {};
    const kind = p.bridge ? 'bridge' : p.halfstep ? 'halfstep' : null;
    if (!kind) continue;
    kinds[kind].push(`W${w}${d}`);
    if (kind === 'bridge') {
      const one = { [d]: JSON.parse(E(X, `JSON.stringify(__dayLists(${w},'${d}'))`)) };
      const r = I.rejSum(one, I.L9.mario, ['pat', 'aux', 'add'], [d], judge);
      rej += r.rej;
      offers += r.offers;
    }
  }
  assert.ok(kinds.bridge.length > 0 && kinds.halfstep.length > 0, JSON.stringify(kinds));
  assert.ok(offers > 100, `${offers} names offered on bridge days`);
  assert.equal(rej, 0);
});

// ── D194 part 2: the hold at the tap and at boot, delivered on an overlay exactly as on the fixture ───────────────────
// Typed routes on Mario's W5 Thursday, Leg superset B slot [3,1], Single-leg hip thrust "2×6–10 @ RPE 8" (hip_ext,
// uncapped under the knee plan): hops onto a capped leg extension hold at RPE 7 and keep the dose; hops off it restore.
const ROUTES = {
  U0: { hops: [{ n: 'Barbell hip thrust', d: D8, h: D8, t: TSAME('Barbell hip thrust', 'Single-leg hip thrust') },
    { n: 'Leg extension', d: D7, h: D8, t: TSAMEH('Leg extension', 'Barbell hip thrust') },
    { n: 'Barbell good mornings', d: D8, h: D8, t: TSAME('Barbell good mornings', 'Leg extension') }],
  rec: 'Single-leg hip thrust>Barbell hip thrust ph=- | Barbell hip thrust>Leg extension ph="2×6–10 @ RPE 8" | Leg extension>Barbell good mornings ph="2×6–10 @ RPE 8"',
  boot: { n: 'Barbell good mornings', d: D8, h: D8 }, chip: 'Leg extension', undo: { n: 'Leg extension', d: D7, h: D8 }, undoBoot: { n: 'Leg extension', d: D7, h: D8 } },
  U1: { hop: { n: 'Barbell hip thrust', d: D8, h: D8, t: TSAME('Barbell hip thrust', 'Single-leg hip thrust') }, chip: 'Single-leg hip thrust',
    undo: { n: 'Single-leg hip thrust', d: D8, h: null }, undoBoot: { n: 'Single-leg hip thrust', d: D8, h: null } },
  U2: { h1: { n: 'Leg extension', d: D7, h: D8, t: TSAMEH('Leg extension', 'Single-leg hip thrust') },
    h2: { n: 'Barbell good mornings', d: D8, h: D8, t: TSAME('Barbell good mornings', 'Leg extension') },
    rec: 'Single-leg hip thrust>Leg extension ph=- | Leg extension>Barbell good mornings ph="2×6–10 @ RPE 8"', chip: 'Leg extension', undo: { n: 'Leg extension', d: D7, h: D8 },
    h3: { n: 'Barbell hip thrust', d: D8, h: D8, t: TSAME('Barbell hip thrust', 'Leg extension') }, boot: { n: 'Barbell hip thrust', d: D8, h: D8 },
    direct: { n: 'Barbell hip thrust', d: D8, h: D8, t: TSAME('Barbell hip thrust', 'Single-leg hip thrust') } },
  RB: { h1: { n: 'Barbell hip thrust', d: D8, h: D8, t: TSAME('Barbell hip thrust', 'Single-leg hip thrust') },
    h2: { n: 'Leg extension', d: D7, h: D8, t: TSAMEH('Leg extension', 'Barbell hip thrust') }, reboot: { n: 'Leg extension', d: D7, h: D8 },
    h3: { n: 'Barbell good mornings', d: D8, h: D8, t: TSAME('Barbell good mornings', 'Leg extension') }, boot: { n: 'Barbell good mornings', d: D8, h: D8 },
    direct: { n: 'Barbell good mornings', d: D8, h: D8, t: TSAME('Barbell good mornings', 'Single-leg hip thrust') }, chip: 'Leg extension',
    undo: { n: 'Leg extension', d: D7, h: D8 }, undoBoot: { n: 'Leg extension', d: D7, h: D8 } },
};
const R7ROUTES = {
  'Leg press': { hop: { n: 'Leg press', d: I.R7_T, h: I.TEST_T, t: TSAMEH('Leg press', 'Barbell box squat') }, boot: { n: 'Leg press', d: I.R7_T, h: I.TEST_T },
    chip: 'Barbell box squat', undo: { n: 'Barbell box squat', d: I.R7_T, h: null } },
  'Barbell Romanian deadlift': { hop: { n: 'Barbell Romanian deadlift', d: I.TEST_T, h: I.TEST_T, t: TSAME('Barbell Romanian deadlift', 'Barbell box squat') },
    boot: { n: 'Barbell Romanian deadlift', d: I.TEST_T, h: I.TEST_T }, chip: 'Barbell box squat', undo: { n: 'Barbell box squat', d: I.R7_T, h: null } },
};
const slot3 = (s: any) => ({ n: clean(s.n), d: s.d, h: s.h });
const hop3 = (h: any) => { assert.ok(h.offered && h.landed, `${h.n} offered and landed`); return { n: h.n, d: h.d, h: h.h, t: h.t }; };

// Three apps, reused: setup() replaces a whole stored state, as a cold boot would (the legacy drivers batched the same way).
const POOL = [I.sharedApp(W5, 5), I.sharedApp(W5, 6), I.sharedApp(W5, 7)];
function driveRoutes(pres: any) {
  const [A, B, C] = POOL;
  const st = I.stored(A, I.L9.mario, pres, W5MON);
  const load = (Y) => { I.setup(Y, st); return Y; };
  const bootSlot = (Y, c, into) => { I.bootFrom(Y, into); return slot3(I.slotOf(into, c.w, c.d, c.si, c.ii)); };
  load(A);
  const c = I.findSlot(A, 5, 'thu', 'Leg superset B', 'Single-leg hip thrust');
  assert.deepEqual(c && [c.si, c.ii], [3, 1]);
  assert.deepEqual(slot3(I.slotOf(A, 5, 'thu', 3, 1)), { n: 'Single-leg hip thrust', d: D8, h: null });
  const before = JSON.stringify(I.dayOf(A, 5, 'thu'));
  const got = {};
  { const Y = load(A); const hops = ['Barbell hip thrust', 'Leg extension', 'Barbell good mornings'].map((to) => hop3(I.hop(Y, c, to)));
    const rec = I.swapRecord(Y, 'w5_thu'); const boot = bootSlot(Y, c, B); const u = I.undoLast(Y, c);
    got.U0 = { hops, rec, boot, chip: u.chip, undo: u.slot, undoBoot: bootSlot(Y, c, B) }; }
  { const Y = load(A); const hop = hop3(I.hop(Y, c, 'Barbell hip thrust')); const u = I.undoLast(Y, c);
    assert.equal(JSON.stringify(I.dayOf(Y, 5, 'thu')), before, `${pres}: undo restores the untouched day`);
    got.U1 = { hop, chip: u.chip, undo: u.slot, undoBoot: bootSlot(Y, c, B) }; }
  { const Y = load(A); const h1 = hop3(I.hop(Y, c, 'Leg extension')); const h2 = hop3(I.hop(Y, c, 'Barbell good mornings')); const rec = I.swapRecord(Y, 'w5_thu');
    const u = I.undoLast(Y, c); const h3 = hop3(I.hop(Y, c, 'Barbell hip thrust'));
    got.U2 = { h1, h2, rec, chip: u.chip, undo: u.slot, h3, boot: bootSlot(Y, c, B), direct: hop3(I.hop(load(C), c, 'Barbell hip thrust')) }; }
  { const Y = load(A); const h1 = hop3(I.hop(Y, c, 'Barbell hip thrust')); const h2 = hop3(I.hop(Y, c, 'Leg extension'));
    const Z = B; I.bootFrom(Y, Z); const reboot = slot3(I.slotOf(Z, 5, 'thu', 3, 1)); const h3 = hop3(I.hop(Z, c, 'Barbell good mornings')); const boot = bootSlot(Z, c, C);
    const direct = hop3(I.hop(load(A), c, 'Barbell good mornings')); const u = I.undoLast(Z, c);
    got.RB = { h1, h2, reboot, h3, boot, direct, chip: u.chip, undo: u.slot, undoBoot: bootSlot(Z, c, C) }; }
  // R7's held test on the knee plan's strength program, W6 Thursday Main
  const cfgS = I.withInj(KNEE, { liftingFocus: 'strength' });
  const stS = I.stored(A, cfgS, pres, W5MON);
  const XS = A;
  I.setup(XS, stS);
  const cS = I.findSlot(XS, 6, 'thu', 'Main — Barbell box squat', 'Barbell box squat');
  assert.ok(cS, `${pres}: W6 thu Main — Barbell box squat`);
  assert.deepEqual(slot3(I.slotOf(XS, 6, 'thu', cS.si, cS.ii)), { n: 'Barbell box squat', d: I.R7_T, h: null });
  const r7 = {};
  for (const to of Object.keys(R7ROUTES)) {
    const Y = A;
    I.setup(Y, stS);
    const hop = hop3(I.hop(Y, cS, to));
    const boot = bootSlot(Y, cS, B);
    const u = I.undoLast(Y, cS);
    r7[to] = { hop, boot, chip: u.chip, undo: u.slot };
  }
  return { routes: host(got), r7: host(r7) };
}

test('on Mario\'s overlay program the hold reaches the tap and the boot: every typed route reads as ruled', () => {
  const r = driveRoutes('OV');
  assert.deepEqual(r.routes, ROUTES);
  assert.deepEqual(r.r7, R7ROUTES);
});

test('on the fixture the same typed routes read the same, so the overlay and the fixture agree', () => {
  const r = driveRoutes('CFG');
  assert.deepEqual(r.routes, ROUTES);
  assert.deepEqual(r.r7, R7ROUTES);
});

// ── a single-hop sample (Mario's knee plan): a native onto a capped target holds, live and at boot, overlay == fixture ─
test('Mario\'s capped single hops hold at RPE 7 with the hold toast, live and at boot, the overlay equal to the fixture', () => {
  const cfg = I.L9.mario;
  const cap = I.capOf(cfg);
  const stFix = I.stored(I.sharedApp(W1, 3), cfg, 'CFG');
  const stOv = I.stored(I.sharedApp(W1, 3), cfg, 'OV', W1);
  const Q = I.sharedApp(W1, 3);
  I.setup(Q, stFix);
  const pairs = [];
  const W = JSON.parse(E(Q, 'JSON.stringify(activeProg.weeks)'));
  for (const w of Object.keys(W)) for (const d of Object.keys(W[w])) {
    const dy = W[w][d];
    if (!dy || !Array.isArray(dy.sections)) continue;
    dy.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => {
      if (!it || typeof it.detail !== 'string' || !(I.CUE_RE.test(it.detail) || I.rpeMax(it.detail) > 7)) return;
      E(Q, `currentWeek=${w};currentDayKey='${d}';`);
      host(E(Q, `__cands(activeProg.weeks[${w}].${d},${w},${JSON.stringify(it.name)})`)).forEach((to) => { if (cap.includes(pat(to))) pairs.push({ w: +w, d, si, ii, from: clean(it.name), to }); });
    }));
  }
  assert.ok(pairs.length >= 10, `${pairs.length} capped single hops`);
  const step = Math.max(1, Math.floor(pairs.length / 30));
  const A = I.sharedApp(W1, 0);
  const B = I.sharedApp(W1, 1);
  const run = (st, p) => {
    I.setup(A, st);
    const h = I.hop(A, p, p.to);
    I.bootFrom(A, B);
    return { live: { n: h.n, d: h.d, h: h.h }, t: h.t, boot: slot3(I.slotOf(B, p.w, p.d, p.si, p.ii)), stamp: I.stampOf(A, p.w, p.d) };
  };
  for (const p of pairs.filter((_, i) => i % step === 0)) {
    const o = run(stOv, p);
    const f = run(stFix, p);
    assert.ok(o.stamp, `W${p.w} ${p.d} is stamped on the overlay`);
    assert.deepEqual({ live: o.live, t: o.t, boot: o.boot }, { live: f.live, t: f.t, boot: f.boot }, `W${p.w} ${p.d} ${p.from} > ${p.to}`);
    assert.ok(!(I.rpeMax(o.live.d) > 7) && !(I.rpeMax(o.boot.d) > 7), `W${p.w} ${p.d} ${p.from} > ${p.to}: ${o.live.d}`);
    assert.equal(o.live.d, o.boot.d, 'live == boot');
    assert.ok(o.t.endsWith(I.HOLD) || I.CUE_RE.test(o.live.d), `the hold is announced or cued: ${o.t}`);
  }
});

// ── the late plan (D194 Amendment 5): a plan written after swaps re-filters whole days at boot ───────────────────────
const TYPED_LATE = [
  { id: 'T1', pres: 'PRE1', region: 'knee', w: 3, d: 'sat', from: 'Mountain climbers', to: 'High knees',
    boot: 'Strength{Decline pushups|2 sets — RPE 7 (leave 3 or more in reserve);Feet-elevated inverted rows|2 sets — RPE 7 (leave 3 or more in reserve)}' },
  { id: 'T2', pres: 'OVOV', region: 'ankle', w: 5, d: 'tue', from: 'Incline dumbbell curl', to: 'Barbell curl',
    boot: 'Main — Sumo deadlift{Sumo deadlift|4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest} Pull superset A{Barbell row|2×6–10 @ RPE 8;L-sit chinups|2 sets — RPE 8 (stop 2 reps short of failure)} Pull{Dumbbell row|2×8–12 each @ RPE 8} Biceps{Barbell curl|3×10–12 @ RPE 8}' },
  { id: 'T3', pres: 'OVT', region: 'hip', w: 5, d: 'sat', from: 'Mountain climbers', to: 'Burpees',
    boot: 'Strength{Decline pushups|2 sets — RPE 7 (leave 3 or more in reserve);Inverted rows (rings)|2 sets — RPE 8 (stop 2 reps short of failure)} Explosive finisher{Burpees|2×15}' },
];
const sig = (dy: any) => (!dy || !dy.sections ? '(none)' : dy.sections.map((s) => clean(s.label) + '{' + (s.items || []).map((it) => clean(it.name) + '|' + (it.detail || '')).join(';') + '}').join(' '));

test('a swap made before a late plan boots under the late plan, whole day re-filtered (three typed cards)', () => {
  const OTHER = { knee: 'ankle', ankle: 'hip', hip: 'lowback', lowback: 'shoulder', shoulder: 'elbow', elbow: 'knee' };
  for (const T of TYPED_LATE) {
    const late = T.pres === 'OVOV' ? { region: OTHER[T.region], tier: 'workaround' } : T.pres === 'OVT' ? { region: T.region, tier: 'protect' } : { region: T.region, tier: 'workaround' };
    const base = I.withInj({ region: T.region, tier: 'workaround' });
    // PRE1: an uninjured program; OVOV and OVT: the region's workaround overlay from W1 already on it
    const st = T.pres === 'PRE1' ? I.stored(I.sharedApp(W1, 3), I.L9.mario_noinj, 'CFG') : I.stored(I.sharedApp(W1, 3), base, 'OV', W1);
    const Y = I.sharedApp(W1, 0);
    I.setup(Y, st);
    const L = I.findSlot(Y, T.w, T.d, '', T.from);
    assert.ok(L, `${T.id}: ${T.from} on W${T.w} ${T.d}`);
    const h = I.hop(Y, L, T.to);
    assert.ok(h.offered && h.landed, `${T.id}: ${T.to} offered and landed`);
    I.writeInjury(Y, late, W1);
    const B = I.sharedApp(W1, 1);
    I.bootFrom(Y, B);
    assert.equal(sig(I.dayOf(B, T.w, T.d)), T.boot, T.id);
  }
});
