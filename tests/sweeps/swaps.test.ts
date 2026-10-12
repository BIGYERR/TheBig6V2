// Swaps and undo, the lattices. The same claims as tests/integration/swaps.test.ts, swap-durability.test.ts and
// sport-swap.test.ts, which run them on samples; this file runs them whole. CI runs it, the 60-second check does not.
//   - the D177 floor lattice: every Main and Power swap pair of 384 configs (6 tiers x 4 focuses x 2 experiences x lift
//     only or half x healthy, knee and low back workaround, shoulder protect; seed 76308), swapped live and undone;
//   - the chain walk: eight configs (Mario under each workaround region, HALF_MANNY, Mario uninjured), W3 and W5, every
//     day, a seeded sample per class; every chain off the four natively cued items; snapshot modes on Mario and
//     HALF_MANNY;
//   - the D181 durability lattice (504 cells, 42 add and skip orderings, 36 untouched cells);
//   - every swap preference build (every natively cued source, every sheet target, six regions);
//   - the sport chip matrix (96 rows).
// Golden values, current, in tests/snapshots/swaps.json: how many floor pairs the D193 hold moves against D177's own
// card and toast (a ruling that moves them regenerates the file), and the program digests of the injured lattice.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { progDigest } from '../support/app.ts';
import { matchSnapshot } from '../support/snapshot.ts';
import * as X from '../support/swaps.ts';
import * as SP from '../support/sport-swap.ts';
const { clean, clone, E } = X;

// ── the D177 floor lattice ───────────────────────────────────────────────────────────────────────────────────────
const S = X.floorLattice(X.l1All());
const ex = (k: string) => (S.ex[k] || []).join(' | ');

test('the floor lattice builds all 384 configs and reaches every kind of pair', () => {
  assert.deepEqual(S.crash, []);
  assert.equal(S.cfgs, 384);
  for (const k of ['main', 'pow', 'winN', 'atN', 'nullN', 'offN', 'zeroChg', 'capPairs', 'clampT', 'lr', 'rr'] as const) assert.ok(S[k] > 0, k);
});

test('every swapped Main card is D177\'s card on the donor beneath its hold, held on a capped target', () => {
  // G3a, G3c, G3d, G3e, G3f (D193 (l))
  assert.equal(S.bA, 0, ex('A')); assert.equal(S.bOff, 0, ex('off')); assert.equal(S.bAt, 0, ex('at'));
  assert.equal(S.bNull, 0, ex('null')); assert.equal(S.bWin, 0, ex('win'));
});

test('no Main lands under its window, no power dose moves beyond the cue, swap then undo is byte-identical', () => {
  // G3b, G3c (power), G5a, G5b
  assert.equal(S.under, 0, ex('under')); assert.equal(S.powChg, 0, ex('pow'));
  assert.equal(S.throws, 0, ex('throw')); assert.equal(S.idBad, 0, ex('id'));
  assert.ok(S.cgbp && S.cgbp.ok && S.cgbp.O !== S.cgbp.D, 'Close-grip bench press -> Dips -> undo');
});

test('every swap toast is the hand toast for its kind, and every hold clamp says so', () => {
  // G6a
  assert.equal(S.bT, 0, ex('t')); assert.equal(S.missT, 0, ex('miss')); assert.equal(S.t3, S.winN);
});

test('Landmine rotations and Dumbbell renegade rows carry their detail verbatim wherever they appear', () => {
  // G4b, G4c
  assert.equal(S.lrMoved, 0); assert.equal(S.rrMoved, 0);
});

// ── the injured lattice programs ─────────────────────────────────────────────────────────────────────────────────
const DIGESTS: Record<string, string> = {};
for (const ck of ['knee_wa', 'ankle_wa', 'hip_wa', 'lowback_wa', 'shoulder_wa', 'elbow_wa', 'mario_noinj']) {
  const a = progDigest(X.page().buildProgram(clone(X.CFGS[ck]))), b = progDigest(X.page().buildProgram(clone(X.CFGS[ck])));
  DIGESTS[ck] = a === b ? a : 'NOT SELF-STABLE ' + a + ' ' + b;
}

test('the floor lattice and the injured lattice programs match tests/snapshots/swaps.json', () => {
  // G3a, G3c, G3d, G3e, G3f, G6a moved counts (D193 Amendment 4, D196-1 bed thrust donor); cuecap c-DIGEST
  matchSnapshot('swaps', {
    floorMovedByTheHold: {
      outsideTheRepToken: S.outside, power: S.powChg, offGrammar: S.offChg, atOrAboveTheFloor: S.atChg, nullRow: S.nullChg,
      underTheWindow: S.winChg, toast: S.mvT, bedThrustDonor: S.bed,
    },
    injuredLatticeDigests: DIGESTS,
  });
});

// ── the chain walk ───────────────────────────────────────────────────────────────────────────────────────────────
const N = { hop1: 3, hop2: 3, cyc2: 3, hop3: 3, cyc3: 3, collide2: 3, exch3: 3 };
const ROWS = [];
for (const ck of Object.keys(X.CFGS)) {
  const chains = X.enumerate(ck, [3, 5], X.DAYS, N), res = X.runChains(chains, 'u', true);
  for (const c of chains) ROWS.push(Object.assign({ c }, res.get(c.id)));
}
const REACH = ROWS.filter(r => !r.unreach);
const tagOf = (r: { c: X.Chain }) => r.c.ck + ' W' + r.c.w + ' ' + r.c.d + ' ' + r.c.cls + ' ' + r.c.hops[0].from + ' > ' + r.c.hops.map(h => h.to).join(' > ');
const patOf = (() => { const P = X.page(), c: Record<string, any> = {}; return (n: string) => (n in c) ? c[n] : (c[n] = E(P, '_pattern(' + JSON.stringify(n) + ')') || null); })();

test('the walk reaches every class on every config', () => {
  for (const ck of Object.keys(X.CFGS)) for (const cls of X.CLASSES) assert.ok(REACH.some(r => r.c.ck === ck && r.c.cls === cls), ck + ' ' + cls);
});

test('untouched chains boot as the live card (one slot) and the live day (two slots)', () => {
  // chain rows 5L, 5X
  assert.deepEqual(REACH.filter(r => (r.c.cls === 'hop2' || r.c.cls === 'cyc2') && !r.eq).map(tagOf), []);
  assert.deepEqual(REACH.filter(r => (r.c.cls === 'collide2' || r.c.cls === 'exch3') && r.bootSig !== r.liveSig).map(tagOf), []);
});

test('store membership is hand membership, and on a complete store every touched slot boots as live', () => {
  // seam a-MEM, a-U
  assert.deepEqual(REACH.filter(r => X.storeU(r.c, r.rec) !== X.inU(r.c)).map(tagOf), []);
  assert.deepEqual(REACH.filter(r => X.inU(r.c) && !r.eq).map(tagOf), []);
});

test('the chip is the last hop\'s from, one undo restores the day before the last hop, and the boot after it agrees', () => {
  // undokey d2-CHIP, d2-UNDO, d2-BOOT-U; seam d-U
  assert.deepEqual(REACH.filter(r => r.chip !== X.handChip(r.c)).map(tagOf), []);
  assert.deepEqual(REACH.filter(r => !r.undoEq).map(tagOf), []);
  assert.deepEqual(REACH.filter(r => X.inU(r.c) && r.recAfter!.join('|') !== X.handStore(r.c).join('|')).map(tagOf), []);
  assert.deepEqual(REACH.filter(r => X.inU(r.c) && r.bootAfterUndoJ !== r.afterJ).map(tagOf), []);
});

// every chain off the four natively cued items (seam e)
const CUED = [
  { ck: 'knee_wa', w: 3, name: 'Reverse lunge (KB)' }, { ck: 'knee_wa', w: 5, name: 'Step-ups (KB)' },
  { ck: 'ankle_wa', w: 3, name: 'Dumbbell Bulgarian split squat' }, { ck: 'ankle_wa', w: 5, name: 'Dumbbell Bulgarian split squat' },
];
const CUED_ROWS: ({ c: X.Chain } & X.ChainRun)[] = [];
for (const ck of ['knee_wa', 'ankle_wa']) {
  const A = X.page(); X.setup(A, ck, X.CFGS[ck]); X.boot(A);
  const all = X.enumerate(ck, [3, 5], ['thu'], { hop1: Infinity, hop2: Infinity, cyc2: Infinity });
  const mine = all.filter(c => CUED.some(h => h.ck === ck && h.w === c.w && clean(c.hops[0].from) === h.name));
  const res = X.runChains(mine, 'u', false);
  for (const c of mine) { const r = res.get(c.id) as X.ChainRun; if (!r.unreach) CUED_ROWS.push(Object.assign({ c }, r)); }
}

test('every chain off a natively cued item boots as the live day', () => {
  // seam e
  for (const h of CUED) assert.ok(CUED_ROWS.some(r => r.c.ck === h.ck && r.c.w === h.w && clean(r.c.hops[0].from) === h.name), h.ck + ' W' + h.w + ' ' + h.name);
  assert.deepEqual(CUED_ROWS.filter(r => !(r.eq && r.liveSig === r.bootSig)).map(tagOf), []);
});

test('after every live hop the card carries the cue exactly when the plan caps the movement on it', () => {
  // cuecap b-ALL
  const bad: string[] = []; let cued = 0;
  for (const r of REACH.concat(CUED_ROWS)) r.c.hops.forEach((h, k) => {
    const st = r.steps[k], v = X.cueIff(X.REGION(r.c.ck), patOf(h.to), st.d); if (v.want) cued++;
    if (!v.ok || st.n !== clean(h.to)) bad.push(tagOf(r) + ' hop' + (k + 1) + ' ' + st.n + ' :: ' + st.d);
  });
  assert.ok(cued > 0);
  assert.deepEqual(bad.slice(0, 5), []);
});

test('a touched day boots byte for byte as its ia_hist_ record, every class, touched before or after the chain', () => {
  // chain rows 8, 8d
  for (const mode of ['t1', 't2']) for (const ck of ['knee_wa', 'manny']) {
    const chains = X.enumerate(ck, [3, 5], X.DAYS, { hop2: 2, cyc2: 2, hop3: 2, cyc3: 2, collide2: 2, exch3: 2 }), res = X.runChains(chains, mode, false);
    let n = 0;
    for (const c of chains) {
      const r = res.get(c.id) as X.ChainRun; if (r.unreach) continue; n++;
      assert.ok(r.histJ && r.bootJ === r.histJ && r.dup === null && r.rec.length > 0, mode + ' ' + c.ck + ' W' + c.w + ' ' + c.d + ' ' + c.cls);
    }
    assert.ok(n > 0);
  }
});

// ── a swap stays made until undone (D181) ────────────────────────────────────────────────────────────────────────
const V = X.durableWorld();
const { DUR } = X;
const WD = DUR.DONOR + ' :: ' + DUR.DONOR_M;

test('the durability lattice, 504 cells: durable, no orphaned log, the log store intact', () => {
  // durable rows 1, 1c, 3, 3d
  const cells = V.lattice();
  assert.equal(cells.length, 504);
  assert.deepEqual(cells.filter(x => x.r.err).map(x => x.r.err), []);
  assert.deepEqual(cells.filter(x => !x.r.durable).map(x => JSON.stringify(x.o)), []);
  assert.deepEqual(cells.filter(x => x.r.orphan.length || !x.r.exwEq).map(x => JSON.stringify(x.o)), []);
});

test('all 42 add and skip orderings on a frozen day boot as live, this week and next, nothing applied twice', () => {
  // durable rows 4, 4d
  let n = 0;
  for (const tk of ['draft', 'tick']) for (const seq of DUR.M3_SEQS) for (const tpos of [0, 1, 2]) {
    const r = V.addSkip(tk, seq, tpos); n++;
    assert.ok(r.b1 === r.live && r.b2 === r.live && !r.dbl, r.ops + ' LIVE ' + r.live + ' | BOOT ' + r.b1 + ' | NXWK ' + r.b2);
  }
  assert.equal(n, 42);
});

test('all 36 untouched cells: a swap or an undo writes no snapshot and leaves the freeze cut', () => {
  // durable row 6a
  let n = 0;
  for (const dated of [true, false]) for (const clock of Object.keys(DUR.CLOCKS)) for (const pair of Object.keys(DUR.PAIRS)) for (const rb of [null, 'past_nextwk']) {
    if (rb === clock) continue; n++;
    const r = V.untouched(dated, clock, pair);
    assert.ok(r.sw && r.un && r.histSame && r.cuts[1] === r.cuts[0] && r.cuts[2] === r.cuts[0], clock + '|' + pair + '|' + dated + ' ' + JSON.stringify(r));
  }
  assert.equal(n, 36);
  assert.ok(WD);
});

// ── every swap preference build ──────────────────────────────────────────────────────────────────────────────────
test('every preference build: cue exactly on capped, RPE-free cards; uncapped targets print the uninjured build\'s dose', () => {
  // prefpath c2-i, c2-ii
  const capped = (reg: string, n: string) => { const p = patOf(n); return !!p && X.CAP[reg].includes(p); };
  const pop = X.prefPopulation(X.PREF_REGIONS, Infinity);
  for (const reg of X.PREF_REGIONS) assert.ok(pop.some(r => r.reg === reg), reg);
  const bad = [], uni = new Map(); let cards = 0, ref = 0;
  for (const r of pop) {
    const A = X.cards(X.prefCfg(r.reg, { [r.src]: r.tgt })), uk = r.src + '>' + r.tgt;
    if (!uni.has(uk)) uni.set(uk, X.cards(X.prefCfg(null, { [r.src]: r.tgt })));
    const U = uni.get(uk);
    for (const c of A.values()) {
      cards++;
      if (c.det.endsWith(X.CUE) !== (capped(r.reg, c.n) && !/RPE/.test(X.stripCue(c.det)))) bad.push('cue ' + r.reg + ' ' + c.k + ' ' + c.n + ' ' + c.det);
      if (c.n !== r.tgt) continue;
      const u = U.get(c.k); if (!u || u.n !== c.n || capped(r.reg, c.n)) continue;
      ref++; if (u.det !== c.det) bad.push('ref ' + r.reg + ' ' + c.k + ' ' + c.n + ' ' + c.det + ' vs ' + u.det);
    }
  }
  assert.ok(cards > 0 && ref > 0);
  assert.deepEqual(bad.slice(0, 5), []);
});

// ── the sport chip matrix ────────────────────────────────────────────────────────────────────────────────────────
test('the sport chip matrix, 96 rows: every typed field parks on the swap and returns on the return', () => {
  // swapkeep L1
  const rows = SP.swapMatrix(SP.sportWorld());
  assert.equal(rows.length, 96);
  assert.deepEqual(rows.filter(r => r.bad.length).map(r => r.name + ': ' + r.bad.slice(0, 3).join('; ')), []);
});
