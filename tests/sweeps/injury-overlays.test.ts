// Injury and travel overlays, the slow half: the lattices behind tests/integration/injury-overlays.test.js and
// tests/integration/injury-plan-lens.test.js. CI runs them; the 60-second check does not.
//   the D154 renamer lattice (2,160 builds); the D193 filter-lens census over L432, home_basic, the D177 lite lattice and
//   the travel overlay; the D194 sheets on the lite lattice's 288 injured configs; the D194 part 2 single hops on the
//   seven D190 configs; every Main and Power swap pair of the lite lattice against the hand hold (D193 (k) and (l));
//   the post-sweep re-filter population (D197); and the late-plan presentations (D194 Amendment 5).
// Counts the rulings printed are typed beside their assertion. Oracles as in the integration files: hand tables, the
// judge, typed toasts; the engine's _pattern only names a pattern.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { loadApp } from '../support/app.ts';
import * as I from '../support/injury-overlays.ts';
import type { App } from '../support/app.ts';
import type { Cfg, Day, DayKey, Equipment, Injury, Item, Section } from '@ia/core';

const { clean, host, E } = I;
const W1 = '2026-08-24';
const W5 = '2026-09-24';
const W5MON = '2026-09-21';

// ── D154: the renamer lattice ───────────────────────────────────────────────────────────────────────────────────────
const OWNS: Record<string, Record<string, number>> = {
  commercial: { BARBELL: 1, DUMBBELL: 1, CABLE: 1, MACHINE: 1, GHD: 1, KETTLEBELL: 1 },
  crossfit: { BARBELL: 1, DUMBBELL: 1, CABLE: 0, MACHINE: 0, GHD: 1, KETTLEBELL: 1 },
  home_full: { BARBELL: 1, DUMBBELL: 1, CABLE: 0, MACHINE: 0, GHD: 0, KETTLEBELL: 1 },
  home_basic: { BARBELL: 0, DUMBBELL: 1, CABLE: 0, MACHINE: 0, GHD: 0, KETTLEBELL: 1 },
  bodyweight: { BARBELL: 0, DUMBBELL: 0, CABLE: 0, MACHINE: 0, GHD: 0, KETTLEBELL: 0 },
};
function implementsOf(name: any): Set<string> {
  const N = String(name).toLowerCase();
  const c = new Set<string>();
  if (/glute[- ]ham|\bghr\b|\bghd\b|45° back extension|roman chair/.test(N)) c.add('GHD');
  if (/\bbarbell\b|^back squat|^front squat|^bench press|close-grip bench|trap bar|power clean|hang clean|rack pull|landmine|\bez[- ]?bar|^good mornings?\b|^deadlift|^pendlay|^hip thrust$/.test(N)) c.add('BARBELL');
  if (/dumbbell|\bdb\b/.test(N) || (/goblet/.test(N) && !/kettlebell|\bkb\b/.test(N))) c.add('DUMBBELL');
  if (/cable|face pull|pull-?down|rope tricep|tricep rope/.test(N) && !/band/.test(N)) c.add('CABLE');
  if (/machine|leg press|leg extension|lying leg curl|seated leg curl|hack squat|smith|pec deck|preacher/.test(N)) c.add('MACHINE');
  if (/kettlebell|\bkb\b/.test(N)) c.add('KETTLEBELL');
  return c;
}
const gearLegal = (t: any, n: any) => [...implementsOf(n)].every((c) => OWNS[t][c] !== 0);

test('the renamer lattice: elbow and shoulder workaround programs print only what the tier owns, and the elbow swap lands', () => {
  const GOALS: [string, Record<string, string>][] = [['run_5k', {}], ['run_half', {}], ['run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '0' }], ['run_base', {}], ['run_10k', {}], ['run_marathon', {}]];
  const FOC = ['hypertrophy', 'strength', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention'];
  const EXPS = ['beginner', 'intermediate', 'advanced'];
  const AGES = ['18-35', '36-54', '55+'];
  const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
  const mk = (eq: string, focus: string, exp: string, age: string, si: number, inj: { region: string; tier: string }): Record<string, unknown> => {
    const [g, x] = GOALS[(si + FOC.indexOf(focus)) % GOALS.length];
    return { name: 'M', primaryPath: /^support_/.test(focus) ? 'event' : 'goal', cardioTypes: ['run'],
      cardioGoals: { run: Object.assign({ id: g, label: g, mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' }, x) },
      eventTargeted: false, liftingFocus: focus, experience: exp, ageBracket: age, equipment: eq, unit: 'lbs',
      restDays: [['sun', 'wed'], ['sat', 'sun']][si % 2].slice(), days: I.DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: SEEDS[si], injury: inj };
  };
  const CELLS: { eq: string; plan: string; cfg: Record<string, unknown> }[] = [];
  for (const eq of Object.keys(OWNS)) for (let si = 0; si < SEEDS.length; si++) for (const r of ['shoulder', 'elbow', 'lowback', 'hip', 'knee', 'ankle']) for (const ti of ['workaround', 'protect'])
    CELLS.push({ eq, plan: r + '/' + ti, cfg: mk(eq, 'hypertrophy', EXPS[si % 3], AGES[si % 3], si, { region: r, tier: ti }) });
  for (const eq of Object.keys(OWNS)) for (let si = 0; si < SEEDS.length; si++) for (const f of FOC) for (const e of EXPS) for (const r of ['elbow', 'shoulder'])
    CELLS.push({ eq, plan: r + '/workaround', cfg: mk(eq, f, e, AGES[(si + EXPS.indexOf(e)) % 3], si, { region: r, tier: 'workaround' }) });
  assert.equal(CELLS.length, 2160);
  const IA = loadApp();
  const DEN: Record<string, number> = {};
  const CGP: Record<string, number> = {};
  const SKULL: Record<string, number> = {};
  const CPC: Record<string, number> = {};
  const DUP: string[] = [];
  for (const c of CELLS) {
    const p = IA.buildProgram(I.clone(c.cfg));
    if (c.plan !== 'elbow/workaround' && c.plan !== 'shoulder/workaround') continue;
    for (const w of Object.keys(p.weeks)) for (const d of I.DAYS) {
      const y = p.weeks[w][d];
      if (!y) continue;
      const nm = ([] as string[]).concat(...(y.sections || []).map((s: Section) => (s.items || []).map((i: Item) => clean(i.name))));
      nm.forEach((n) => { if (!gearLegal(c.eq, n)) DEN[c.eq] = (DEN[c.eq] || 0) + 1; });
      if (nm.filter((n) => n === 'Close-grip pushups').length > 1) DUP.push(`${c.eq} W${w} ${d}`);
      if (c.plan === 'elbow/workaround') nm.forEach((n) => {
        if (n === 'Close-grip pushups') CGP[c.eq] = (CGP[c.eq] || 0) + 1;
        if (n === 'Dumbbell skullcrushers') SKULL[c.eq] = (SKULL[c.eq] || 0) + 1;
        if (n === 'Cable pushdown') CPC[c.eq] = (CPC[c.eq] || 0) + 1;
      });
    }
  }
  for (const t of ['crossfit', 'home_full', 'home_basic', 'bodyweight']) assert.equal(DEN[t] || 0, 0, `${t}: items the tier does not own`);
  for (const t of ['crossfit', 'home_full', 'home_basic']) {
    assert.ok((CGP[t] || 0) > 0, `${t}: the elbow swap lands as Close-grip pushups`);
    assert.equal((SKULL[t] || 0) + (CPC[t] || 0), 0, `${t}: no skullcrusher, no cable pushdown`);
  }
  assert.ok((CPC.commercial || 0) > 0, 'commercial still prints Cable pushdown');
  assert.deepEqual(DUP.slice(0, 3), [], 'no day prints Close-grip pushups twice');
});

// ── D193 build half: the filter-lens census ─────────────────────────────────────────────────────────────────────────
function lensCensus(cfgs: Cfg[]) {
  const X = I.lensApp();
  const pat = I.patternOf(I.appAt(W5));
  const r = { builds: 0, U: 0, hi: [] as string[], forbid: [] as string[], loadHead: 0, power: 0, powerCued: [] as string[], r7: 0, test: 0, r7Uncapped: [] as string[], testCapped: [] as string[], numOnly: [] as string[], preHold: 0 };
  for (const c of cfgs) {
    r.builds++;
    const cap = I.capOf(c);
    X.ctx.__C = I.clone(c);
    const b = E(X, 'globalThis.__BUILD=(globalThis.__BUILD||0)+1');
    const prog = E(X, 'buildProgram(__C)');
    if (/"_preHold"/.test(JSON.stringify(prog, (k, v) => (k === '__pre' ? undefined : v)))) r.preHold++;
    for (const k of I.cardsOf(prog, b)) {
      const inU = cap.includes(pat(k.pre));
      const where = `${c.injury ? c.injury.region + '/' + c.injury.tier : 'healthy'} ${c.equipment} ${c.experience} ${c.liftingFocus} W${k.w} ${k.d} ${k.n} :: ${k.det}`;
      if (inU) {
        r.U++;
        if (I.rpeMax(k.det)! > 7) r.hi.push(where);
        if (I.FORBID.some((f) => k.det.includes(f))) r.forbid.push(where);
        if (k.det.startsWith('3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)')) r.loadHead++;
      }
      if (I.POWER.test(k.det) || /^Power/.test(k.label)) { r.power++; if (I.CUE_RE.test(k.det)) r.powerCued.push(where); }
      if (k.det === I.R7_T) { r.r7++; if (!inU) r.r7Uncapped.push(where); }
      if (I.TEST_SHAPE.test(k.det)) { r.test++; if (inU) r.testCapped.push(where); }
      if (/at RPE 7\..*new baseline\./.test(k.det)) r.numOnly.push(where);
    }
  }
  return r;
}

test('L432 and home_basic: no card on a capped pattern prints above RPE 7 or keeps a pre-hold gloss, and no power card is cued', () => {
  for (const [tag, eqs] of [['L432', I.L432_EQ], ['home_basic', ['home_basic']]] satisfies [string, Equipment[]][]) {
    const cells = I.grid(eqs);
    assert.equal(cells.length, tag === 'L432' ? 432 : 108);
    const r = lensCensus(cells.map((x) => x.c));
    assert.ok(r.U > 0, `${tag}: cards in U`);
    assert.deepEqual(r.hi.slice(0, 3), [], `${tag}: capped above RPE 7`);
    assert.deepEqual(r.forbid.slice(0, 3), [], `${tag}: a pre-hold gloss on a capped card`);
    assert.ok(r.power > 0);
    assert.deepEqual(r.powerCued.slice(0, 3), [], `${tag}: a cued power card`);
  }
});

test('the travel overlay lattice: capped cards hold, and the load-limited hold prints', () => {
  const TL: Cfg[] = [];
  I.grid(['home_basic']).forEach((x) => { for (const eq of ['home_basic', 'minimal'] as const) TL.push({ ...Object.assign(I.clone(x.c), { equipment: 'commercial' }), equipment: eq, _travel: true }); });
  assert.equal(TL.length, 216);
  const r = lensCensus(TL);
  assert.deepEqual(r.hi.slice(0, 3), []);
  assert.deepEqual(r.forbid.slice(0, 3), []);
  assert.ok(r.loadHead > 0);
});

test('the lite lattice: 30 held test cards read R7\'s text, 102 unheld ones the test, none number-only; uninjured builds keep no pre-hold dose', () => {
  const lite = I.liteLattice();
  assert.equal(lite.length, 384);
  const r = lensCensus(lite.map((x) => x.c));
  assert.equal(r.r7, 30, 'held test cards');
  assert.equal(r.test, 102, 'unheld test cards');
  assert.deepEqual(r.r7Uncapped.slice(0, 3), []);
  assert.deepEqual(r.testCapped.slice(0, 3), []);
  assert.deepEqual(r.numOnly.slice(0, 3), []);
  assert.deepEqual(r.hi.slice(0, 3), []);
  const healthy = lite.filter((x) => !x.c.injury).map((x) => x.c);
  const un37 = [I.withInj(null)];
  for (const eq of I.L432_EQ) for (const ex of ['beginner', 'intermediate', 'advanced']) for (const fo of ['support_strength', 'support_athletic', 'support_prevention'])
    un37.push(Object.assign(I.withInj(null), { equipment: eq, experience: ex, liftingFocus: fo }));
  const u = lensCensus(healthy.concat(un37));
  assert.equal(u.builds, 133);
  assert.equal(u.preHold, 0, 'uninjured builds carrying _preHold');
  assert.equal(u.r7, 0, 'R7 text on an uninjured build');
});

// ── D194: the sheets of the lite lattice's injured configs, on the overlay path ─────────────────────────────────────
test('the lite lattice on the overlay path: W5 sheets offer nothing the plan rejects, and equal the fixture\'s sheets', () => {
  const judge = I.judgeMaker();
  const A = I.sharedApp(W5, 0);
  const B = I.sharedApp(W5, 1);
  const K: Record<string, { n5: number; st5: number; rej: number; rows: number; eqFix: number; n3: number; st3: number; rej3: number }> = {};
  for (const k of ['pat', 'aux', 'add']) K[k] = { n5: 0, st5: 0, rej: 0, rows: 0, eqFix: 0, n3: 0, st3: 0, rej3: 0 };
  const inj = I.liteLattice().filter((x) => x.c.injury);
  assert.equal(inj.length, 288);
  for (const { c: cfg } of inj) {
    I.setup(A, I.stored(B, cfg, 'OV', W5MON));
    const o5 = I.weekLists(A, 5);
    const o3 = I.weekLists(A, 3);
    I.setup(B, I.stored(B, cfg, 'CFG'));
    const f5 = I.weekLists(B, 5);
    const mf5 = new Map();
    I.ISO_DAYS.forEach((d) => f5[d].rows.forEach((r) => mf5.set(I.rowKey(d, r), JSON.stringify(r.L))));
    for (const d of I.ISO_DAYS) {
      for (const r of o5[d].rows) {
        const x = K[r.k];
        x.n5++;
        if (o5[d].stamp) x.st5++;
        const j = judge(r.L, cfg);
        x.rej += j.length;
        if (j.length) x.rows++;
        if (o5[d].stamp && mf5.get(I.rowKey(d, r)) === JSON.stringify(r.L)) x.eqFix++;
      }
      for (const r of o3[d].rows) { const x = K[r.k]; x.n3++; if (o3[d].stamp) x.st3++; x.rej3 += judge(r.L, cfg).length; }
    }
  }
  const WANT: Record<string, number> = { pat: 4626, aux: 1875, add: 1440 };   // pat 4608, aux 1814 until D241 widened the pools and families; pat 4613, aux 1829 until D243 re-laid the lite lattice's one-speed race weeks
  for (const k of Object.keys(WANT)) {
    const x = K[k];
    assert.deepEqual([x.n5, x.st5, x.rej, x.rows, x.eqFix], [WANT[k], WANT[k], 0, 0, WANT[k]], `${k}: rows, stamped, rejected names, rows with one, == fixture`);
    assert.ok(x.n3 > 0 && x.st3 === 0, `${k}: W3 is before the overlay`);
  }
  assert.ok(K.pat.rej3 + K.aux.rej3 + K.add.rej3 > 0, 'the judge is not blind: the uninjured W3 sheets offer names the plan rejects');
});

// ── D194 part 2: single hops onto a capped target, overlay == fixture, on the seven D190 configs ─────────────────────
test('every capped single hop of the seven D190 configs holds, live and at boot, the overlay equal to the fixture', () => {
  const pat = I.patternOf(I.appAt(W1));
  const A = I.sharedApp(W1, 0);
  const B = I.sharedApp(W1, 1);
  const Q = I.sharedApp(W1, 2);
  const tally = { cued: 0, bw7: 0, bw8: 0, above: 0, aboveHold: 0 };
  for (const ck of I.CK7) {
    const cfg = I.L9[ck];
    const cap = I.capOf(cfg);
    const stFix = I.stored(Q, cfg, 'CFG');
    const stOv = I.stored(Q, cfg, 'OV', W1);
    I.setup(Q, stFix);
    const W = JSON.parse(E(Q, 'JSON.stringify(activeProg.weeks)'));
    const unloadable = (n: string) => { const r = host(E(Q, `_repFloor(${JSON.stringify(n)})`)); return !!(r && r[1] === 0); };
    const pairs: (I.SlotAt & { cls: string; from: string; to: string })[] = [];
    for (const w of Object.keys(W)) for (const d of Object.keys(W[w])) {
      const dy = W[w][d];
      if (!dy || !Array.isArray(dy.sections)) continue;
      dy.sections.forEach((s: Section, si: number) => (s.items || []).forEach((it: Item, ii: number) => {
        if (!it || typeof it.detail !== 'string') return;
        const cls = I.CUE_RE.test(it.detail) ? 'e' : I.rpeMax(it.detail)! > 7 ? 'e2' : null;
        if (!cls) return;
        E(Q, `currentWeek=${w};currentDayKey='${d}';`);
        host(E(Q, `__cands(activeProg.weeks[${w}].${d},${w},${JSON.stringify(it.name)})`)).forEach((to: string) => {
          if (!cap.includes(pat(to)) || (cls === 'e' && !unloadable(to))) return;
          pairs.push({ cls, w: +w, d, si, ii, from: clean(it.name), to });
        });
      }));
    }
    const run = (st: string, p: I.SlotAt & { to: string }) => {
      I.setup(A, st);
      const h = I.hop(A, p, p.to);
      I.bootFrom(A, B);
      return { live: { n: h.n, d: h.d, h: h.h }, t: h.t, boot: { n: clean(I.slotOf(B, p.w, p.d, p.si, p.ii).n), d: I.slotOf(B, p.w, p.d, p.si, p.ii).d }, st: I.stampOf(A, p.w, p.d) };
    };
    for (const p of pairs) {
      const o = run(stOv, p);
      const f = run(stFix, p);
      const where = `${ck} W${p.w} ${p.d} ${p.from} > ${p.to}`;
      assert.ok(o.st, `${where} is stamped`);
      assert.deepEqual({ live: o.live, t: o.t, boot: o.boot }, { live: f.live, t: f.t, boot: f.boot }, where);
      assert.equal(o.live.d, o.boot.d, `${where}: live == boot`);
      if (p.cls === 'e') {
        if (I.CUE_RE.test(o.live.d)) { tally.cued++; assert.equal(o.t, `${p.to} in, ${p.from.toLowerCase()} out. Same job, same numbers.`, where); }
        else if (/^\d+ sets — RPE 7 /.test(o.live.d)) { tally.bw7++; assert.equal(o.t, `${p.to} in, ${p.from.toLowerCase()} out. No load to add here.${I.HOLD}`, where); }
        else if (/^\d+ sets — RPE 8 /.test(o.live.d)) tally.bw8++;
      } else {
        tally.above++;
        assert.ok(!(I.rpeMax(o.live.d)! > 7), `${where}: ${o.live.d}`);
        if (o.t.endsWith(I.HOLD)) tally.aboveHold++;
      }
    }
  }
  assert.deepEqual(tally, { cued: 8, bw7: 188, bw8: 0, above: 108, aboveHold: 108 });   // { 14, 196, 0, 114, 114 } until D241 reshuffled the hops; every hop above 7 still holds
});

// ── D193 (k) and (l): every Main and Power swap pair of the lite lattice, overlay shape and fixture ──────────────────
test('every Main and Power swap pair of the lite lattice reads the hand hold and its toast, the overlay shape equal to the fixture', () => {
  const X = I.appAt(W5);
  E(X, "activeProgId='P1';");
  const pat = I.patternOf(X);
  const S = I.newPairTally();
  const F = I.newPairTally();
  let differ = 0;
  for (const { c: cfg } of I.liteLattice()) {
    const st = I.swapPairs(X, cfg, 'STAMP');
    const fx = I.swapPairs(X, cfg, 'CFG');
    assert.equal(st.length, fx.length, `${cfg.equipment} ${cfg.liftingFocus}: the same pairs on both shapes`);
    st.forEach((r, i) => {
      I.tallyPair(S, r, I.classifyPair(cfg, r, pat));
      I.tallyPair(F, fx[i], I.classifyPair(cfg, fx[i], pat));
      if (r.key !== fx[i].key || r.O !== fx[i].O || r.toast !== fx[i].toast) differ++;
    });
  }
  assert.equal(differ, 0, 'the overlay shape and the fixture print the same card and toast on every pair');
  assert.deepEqual(S.ex, []);
  assert.deepEqual([S.pairs, S.thr], [156872, 0]);   // 150989 pairs until D241
  // 1253 clamp pairs (694 verbatim) until D241 reshuffled the draws; every pair still prints its toast
  assert.deepEqual([S.clamp, S.hv, S.hvK, S.hvMiss], [1241, 1241, { verbatim: 682, unloadable: 360, window: 199 }, 0], 'every clamp pair prints its hold toast');
  assert.deepEqual([S.fals, S.holdOff, S.info], [0, 0, 380], 'no false same-numbers claim on a clamp pair, no hold toast off it');   // 458 info toasts until D241
  assert.deepEqual([S.G3a, S.G3aCls, S.G3aMiss], [851, { donor: 529, window: 199, verbatim: 123 }, 0], 'every Main card is the hand card');   // 839 (verbatim 111) until D241
  assert.ok(S.pow > 0 && S.powChg === 0, 'power cards keep their dose');
  assert.deepEqual([S.off, S.offMiss, S.at, S.atMiss, S.nul, S.nulMiss, S.win, S.winMiss], [184, 0, 263, 0, 205, 0, 199, 0]);   // off 172 until D241
  assert.deepEqual({ clamp: S.bt.clamp, hv: S.bt.hv, G3a: S.bt.G3a, off: S.bt.off, nul: S.bt.nul }, { clamp: 10, hv: 10, G3a: 7, off: 4, nul: 3 }, 'the bed-thrust donor');
  for (const k of ['G3a', 'off', 'at', 'nul', 'win', 'hv', 'fals'] as const) assert.equal(F[k], S[k], `fixture ${k}`);
});

// ── D197 and D194 Amendment 4: no post-sweep reject on L432, on the overlay or the fixture ──────────────────────────
test('L432: no built card is one the plan\'s own filter, re-applied, would drop, rename or re-detail (overlay and fixture)', () => {
  const REJ = "globalThis.__rej=function(sections,inj){var S=JSON.parse(JSON.stringify(sections||[]));S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(it)it.__k=si+'.'+ii;});});"
    + "var O=applyInjuryFilter(JSON.parse(JSON.stringify(S)),Object.assign({},activeProg?activeProg.cfg:{},{injury:inj}));var got={};(O||[]).forEach(function(s){((s&&s.items)||[]).forEach(function(it){if(it.__k!=null)got[it.__k]=it;});});"
    + "var r=[];S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it||!it.name)return;var g=got[si+'.'+ii];if(!g)r.push('drop '+it.name);else if(g.name!==it.name)r.push('rename '+it.name+' > '+g.name);else if((g.detail||'')!==(it.detail||''))r.push('redetail '+it.name+': '+it.detail+' > '+g.detail);});});return r;};";
  const A = I.sharedApp(W1, 0);
  const Q = I.sharedApp(W1, 1);
  E(A, REJ);
  const rej: string[] = [];
  let days = 0;
  for (const x of I.grid(I.L432_EQ)) for (const [pres, from] of [['OV', W1], ['CFG']] satisfies [I.Pres, string?][]) {
    I.setup(A, I.stored(Q, x.c, pres, from));
    const W = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks)'));
    for (const w of Object.keys(W)) for (const d of Object.keys(W[w] || {})) {
      const dy = W[w][d];
      if (!dy || !Array.isArray(dy.sections) || !dy.sections.some((s: Section) => s && s.items && s.items.length)) continue;
      days++;
      A.ctx.__S = dy.sections;
      host(E(A, `__rej(__S,${JSON.stringify(x.c.injury)})`)).forEach((r: string) => rej.push(`${pres} ${x.k} W${w} ${d} ${r}`));
    }
  }
  assert.equal(days, 2 * 12960, 'lifting days on both presentations');
  assert.deepEqual(rej.slice(0, 5), []);
});

// ── D194 Amendment 5: late plans after app-written swaps ────────────────────────────────────────────────────────────
test('a late plan after app-written swaps: no name twice in a section, no jump on a knee or ankle day, reboot equals boot', () => {
  const OTHER: Record<string, string> = { knee: 'ankle', ankle: 'hip', hip: 'lowback', lowback: 'shoulder', shoulder: 'elbow', elbow: 'knee' };
  const JUMPS = new Set(['Broad jumps', 'Burpees', 'High knees', 'Jump squats', 'Lateral bounds', 'Skater bounds', 'Trap bar jump', 'Tuck jumps']);
  const PRES: Record<string, { from: string; clock: string; base: string }> = { PRE1: { from: W1, clock: W1, base: 'UNINJ' }, PRE5: { from: W5MON, clock: W5, base: 'UNINJ' }, OVOV: { from: W1, clock: W1, base: 'OV1' }, OVT: { from: W1, clock: W1, base: 'OV1' } };
  const lateInj = (pres: string, region: string): Injury => (pres === 'OVOV' ? { region: OTHER[region], tier: 'workaround' } : pres === 'OVT' ? { region, tier: 'protect' } : { region, tier: 'workaround' });
  const CLK = /^_?(ts|at|time|stamp|clock|now|created)$/i;
  const JS = (v: unknown) => JSON.stringify(v, (k, x) => (CLK.test(k) ? undefined : x));
  const t = { swaps: {} as Record<string, number>, judged: 0, judgedNJ: 0, dup: [] as string[], jump: [] as string[], boots: 0, rebootNe: [] as string[] };
  for (const pres of Object.keys(PRES)) for (const region of I.REGS) {
    const P = PRES[pres];
    const [Y, B, R] = [I.sharedApp(P.clock, 0), I.sharedApp(P.clock, 1), I.sharedApp(P.clock, 2)];
    const st = P.base === 'OV1' ? I.stored(R, I.withInj({ region, tier: 'workaround' }), 'OV', W1) : I.stored(R, I.L9.mario_noinj, 'CFG');
    assert.equal(P.base === 'OV1' ? I.stored(B, I.withInj({ region, tier: 'workaround' }), 'OV', W1) : I.stored(B, I.L9.mario_noinj, 'CFG'), st, 'the stored state equals itself');
    I.setup(Y, st);
    const W0 = JSON.parse(E(Y, 'JSON.stringify(activeProg.weeks)'));
    const dayKeys: [number, string][] = [];
    Object.keys(W0).forEach((w) => Object.keys(W0[w] || {}).forEach((d) => { const dy = W0[w][d]; if (dy && Array.isArray(dy.sections) && dy.sections.some((s: Section) => s && s.items && s.items.length) && (pres !== 'PRE5' || +w >= 5)) dayKeys.push([+w, d]); }));
    const cardsAt = (dy: Day | null | undefined) => { const o: { si: number; ii: number; n: string }[] = []; ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if (it && it.name) o.push({ si, ii, n: it.name }); })); return o; };
    const rounds = Math.min(8, Math.max(0, ...dayKeys.map(([w, d]) => cardsAt(W0[w][d]).length)));
    for (let r = 0; r < rounds; r++) {
      I.setup(Y, st);
      let landed = 0;
      for (const [w, d] of dayKeys) {
        const card = cardsAt(W0[w][d])[r];
        if (!card) continue;
        const used = new Set(cardsAt(I.dayOf(Y, w, d)).map((x) => x.n.toLowerCase()));
        E(Y, `currentWeek=${w};currentDayKey='${d}';`);
        const cs = host(E(Y, `__cands(activeProg.weeks[${w}].${d},${w},${JSON.stringify(card.n)})`)).filter((x: unknown) => !used.has(String(x).toLowerCase())).slice(0, 2);
        for (const to of cs) { const h = I.hop(Y, { w, d, si: card.si, ii: card.ii }, to); if (h.landed) { landed++; break; } }
      }
      if (!landed) continue;
      t.swaps[pres] = (t.swaps[pres] || 0) + landed;
      I.writeInjury(Y, lateInj(pres, region), P.from);
      I.bootFrom(Y, B);
      I.bootFrom(B, R);
      const WB = JSON.parse(E(B, 'JSON.stringify(activeProg.weeks)'));
      const WR = JSON.parse(E(R, 'JSON.stringify(activeProg.weeks)'));
      for (const w of Object.keys(WB)) for (const d of Object.keys(WB[w] || {})) {
        t.boots++;
        const a = WB[w][d];
        if (JS(a) !== JS(WR[w] && WR[w][d])) t.rebootNe.push(`${pres} ${region} W${w} ${d}`);
        const plan = pres === 'PRE5' && +w < 5 ? null : lateInj(pres, region);
        if (!plan || !a || !a.sections) continue;
        t.judged++;
        if (['knee', 'ankle'].includes(plan.region)) t.judgedNJ++;
        a.sections.forEach((s: Section) => {
          const names = (s.items || []).map((it) => clean(it && it.name));
          names.forEach((n, i) => {
            if (names.indexOf(n) !== i) t.dup.push(`${pres} ${region} W${w} ${d} ${clean(s.label)}: ${n}`);
            if (['knee', 'ankle'].includes(plan.region) && JUMPS.has(n)) t.jump.push(`${pres} ${region} W${w} ${d} ${n}`);
          });
        });
      }
    }
  }
  assert.ok(Object.keys(PRES).every((p) => t.swaps[p] > 0), JSON.stringify(t.swaps));
  assert.ok(t.judged > 0 && t.judgedNJ > 0);
  assert.deepEqual(t.dup.slice(0, 3), []);
  assert.deepEqual(t.jump.slice(0, 3), []);
  assert.deepEqual(t.rebootNe.slice(0, 3), []);
});

// ── D194 part 2 and D193's live rows: swap chains through a held lift (a sample of the D190 chain lattice) ──────────
// A chain starts on a W3, W5 or W7 card of one of the seven D190 configs (up to eight a day); hop 1 lands on a capped
// target whose swap detail the clamp changes (so the hold fires), hop 2 takes the first other name that target's sheet
// offers. Each chain runs three
// ways, on the overlay written from W1 and on the fixture: straight (hops, boot, undo by chip, boot again), with a
// reboot before the last hop, and undoing onto the held card then hopping again (with the direct swap beside it). The
// fixture is the expected answer for every field; the hold is asserted by the kept dose, the ph field and the toast.
/** A swap chain: where it starts and its two hops. */
type Chain = I.SlotAt & { id: string; hops: string[] };
/** What one way of running a chain read back (slots, toasts, days); the overlay's and the fixture's are compared whole. */
type ChainRead = Record<string, any>;
test('swap chains through a held lift read the same on the overlay and the fixture, live, at boot, after undo and after a reboot', () => {
  const pat = I.patternOf(I.appAt(W1));
  const [A, B, C, Q] = [I.sharedApp(W1, 0), I.sharedApp(W1, 1), I.sharedApp(W1, 2), I.sharedApp(W1, 3)];
  const CLKK = /^_?(ts|at|time|stamp|clock|now|id|created)$/i;
  const dayJ = (X: App, w: number, d: string) => { const o: (Day & { _ovKey?: string }) | null = I.dayOf(X, w, d); if (o) delete o._ovKey; return JSON.stringify(o, (k, v) => (CLKK.test(k) ? undefined : v)); };
  const sl = (X: App, c: I.SlotAt) => { const s = I.slotOf(X, c.w, c.d, c.si, c.ii); return { n: clean(s.n), d: s.d, h: s.h }; };
  const phOf = (X: App, c: I.SlotAt): number => (JSON.parse(E(X, "localStorage.getItem('ia_swaps_PM')") || '{}')[`w${c.w}_${c.d}`] || [])
    .reduce((n: number, e: { rx?: unknown[] }) => n + ((e && e.rx) || []).filter((x) => x && typeof x === 'object' && 'ph' in x).length, 0);
  const batches = (chains: Chain[]): Chain[][] => { const by: Record<string, Chain[]> = {}; chains.forEach((c) => (by[c.w + c.d] = by[c.w + c.d] || []).push(c)); const L = Object.values(by); const out: Chain[][] = [];
    for (let b = 0; b < Math.max(0, ...L.map((l) => l.length)); b++) out.push(L.map((l) => l[b]).filter(Boolean)); return out; };
  function straight(st: string, chains: Chain[]): Map<string, ChainRead> {
    const res = new Map<string, ChainRead>();
    for (const batch of batches(chains)) {
      I.setup(A, st);
      const r: Record<string, ChainRead> = {};
      for (const c of batch) {
        const s: ChainRead = (r[c.id] = { start: sl(A, c), toasts: [], kept: [], stamp: !!I.stampOf(A, c.w, c.d) });
        for (const to of c.hops) { const h = I.hop(A, c, to); s.toasts.push(h.t); s.kept.push(h.h); if (!h.landed) s.bad = 1; }
        s.live = sl(A, c);
        s.liveDay = dayJ(A, c.w, c.d);
        s.ph = phOf(A, c);
      }
      I.bootFrom(A, B);
      batch.forEach((c) => { r[c.id].boot = sl(B, c); r[c.id].bootDay = dayJ(B, c.w, c.d); });
      batch.forEach((c) => { const u = I.undoLast(A, c); r[c.id].chip = u.chip; r[c.id].undo = u.slot; r[c.id].undoDay = dayJ(A, c.w, c.d); });
      I.bootFrom(A, C);
      batch.forEach((c) => { r[c.id].undoBoot = sl(C, c); r[c.id].undoBootDay = dayJ(C, c.w, c.d); res.set(c.id, r[c.id]); });
    }
    return res;
  }
  function reboot(st: string, chains: Chain[]): Map<string, ChainRead> {
    const res = new Map<string, ChainRead>();
    for (const batch of batches(chains)) {
      I.setup(A, st);
      const r: Record<string, ChainRead> = {};
      for (const c of batch) { r[c.id] = { toasts: [] }; for (const to of c.hops.slice(0, -1)) r[c.id].toasts.push(I.hop(A, c, to).t); }
      I.bootFrom(A, B);
      for (const c of batch) { const s = r[c.id]; s.afterReboot = sl(B, c); s.toasts.push(I.hop(B, c, c.hops[c.hops.length - 1]).t); s.live = sl(B, c); }
      I.bootFrom(B, C);
      batch.forEach((c) => { r[c.id].boot = sl(C, c); res.set(c.id, r[c.id]); });
    }
    return res;
  }
  function undoOnto(st: string, chains: Chain[]): Map<string, ChainRead> {
    const res = new Map<string, ChainRead>();
    for (const batch of batches(chains)) {
      I.setup(A, st);
      const r: Record<string, ChainRead> = {};
      for (const c of batch) {
        const s: ChainRead = (r[c.id] = { toasts: [] });
        for (const to of c.hops) s.toasts.push(I.hop(A, c, to).t);
        const u = I.undoLast(A, c);
        s.chip = u.chip;
        s.undone = u.slot;
        s.toasts.push(I.hop(A, c, c.hops[1]).t);
        s.live = sl(A, c);
      }
      I.bootFrom(A, B);
      batch.forEach((c) => { r[c.id].boot = sl(B, c); });
      I.setup(C, st);
      batch.forEach((c) => { const h = I.hop(C, c, c.hops[1]); r[c.id].direct = { n: h.n, d: h.d, h: h.h, t: h.t }; res.set(c.id, r[c.id]); });
    }
    return res;
  }
  const t = { chains: 0, kept: 0, ph: 0, hold: 0, bootKept: 0, hiLive: [] as string[], unstamped: [] as string[], rebootKept: 0, undoneOnHeld: 0, liveIsBoot: 0, differ: [] as string[] };
  for (const ck of I.CK7) {
    const cfg = I.L9[ck];
    const cap = I.capOf(cfg);
    if (!cap.length) continue;
    const stF = I.stored(Q, cfg, 'CFG');
    const stO = I.stored(Q, cfg, 'OV', W1);
    // enumerate on the fixture (the engine's _swapDetailFor and _capRpeClamp only select the population)
    I.setup(Q, stF);
    const fires = (to: string, prev: string) => {
      if (!cap.includes(pat(to))) return false;
      Q.ctx.__p = prev;
      Q.ctx.__to = to;
      const pre = E(Q, '_swapDetailFor(__to,_stripCapCue(__p))');
      return /RPE/.test(pre || '') && E(Q, `_capRpeClamp(${JSON.stringify(pre)})`) !== pre;
    };
    const chains: Chain[] = [];
    for (const w of [3, 5, 7]) {
      const W: Partial<Record<DayKey, Day>> = I.weekOf(Q, w) || {};
      for (const d of I.ISO_DAYS) {
        const dy = W[d];
        if (!dy || !Array.isArray(dy.sections)) continue;
        dy.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => {
          if (!it || !it.name) return;
          const c = { w, d, si, ii };
          E(Q, `currentWeek=${w};currentDayKey='${d}';`);
          if (!E(Q, `__canSwap(activeProg.weeks[${w}].${d},${si},${ii})`)) return;
          for (const first of host(E(Q, `__cands(activeProg.weeks[${w}].${d},${w},${JSON.stringify(it.name)})`)).filter((x: string) => fires(x, it.detail || '')).slice(0, 3)) {
            if (chains.filter((x) => x.w === w && x.d === d).length >= 8) return;
            I.hop(Q, c, first);
            const second = host(E(Q, `__cands(activeProg.weeks[${w}].${d},${w},${JSON.stringify(first)})`)).find((x: string) => x !== it.name);
            I.undoLast(Q, c);
            if (second) chains.push({ id: `${ck} W${w} ${d} [${si},${ii}] ${first}`, ...c, hops: [first, second] });
          }
        }));
      }
    }
    const pairs = [[straight(stO, chains), straight(stF, chains)], [reboot(stO, chains), reboot(stF, chains)], [undoOnto(stO, chains), undoOnto(stF, chains)]];
    for (const c of chains) {
      t.chains++;
      const [[so, sf], [ro, rf], [uo, uf]] = pairs.map(([o, f]) => [o.get(c.id)!, f.get(c.id)!]);
      for (const [k, o, f] of [['straight', so, sf], ['reboot', ro, rf], ['undo', uo, uf]] satisfies [string, ChainRead, ChainRead][]) {
        const oo = { ...o };
        delete oo.stamp;
        const ff = { ...f };
        delete ff.stamp;
        if (JSON.stringify(oo) !== JSON.stringify(ff)) t.differ.push(`${c.id} ${c.hops.join(' > ')} [${k}]`);
      }
      if (!so.stamp) t.unstamped.push(c.id);
      if (so.kept[0] !== null) t.kept++;
      if (so.ph > 0) t.ph++;
      if (so.toasts.some((x: string) => x.endsWith(I.HOLD))) t.hold++;
      if (so.boot.h !== null) t.bootKept++;
      if (cap.includes(pat(so.live.n)) && I.rpeMax(so.live.d)! > 7) t.hiLive.push(c.id);
      if (ro.afterReboot.h !== null) t.rebootKept++;
      if (uo.undone.n === clean(c.hops[0]) && uo.undone.h !== null) t.undoneOnHeld++;
      if (so.live.d === so.boot.d && so.live.n === so.boot.n) t.liveIsBoot++;
    }
  }
  assert.ok(t.chains >= 50, `${t.chains} chains`);
  assert.deepEqual(t.differ.slice(0, 3), [], 'the overlay reads every chain as the fixture does');
  assert.deepEqual(t.unstamped.slice(0, 3), []);
  assert.deepEqual({ kept: t.kept, ph: t.ph, hold: t.hold, bootKept: t.bootKept, rebootKept: t.rebootKept, undoneOnHeld: t.undoneOnHeld },
    { kept: t.chains, ph: t.chains, hold: t.chains, bootKept: t.chains, rebootKept: t.chains, undoneOnHeld: t.chains }, 'the hold fires on hop 1 of every chain and its kept dose rides the chain');
  assert.deepEqual(t.hiLive.slice(0, 3), [], 'no chain ends on a capped card above RPE 7');
  assert.ok(t.liveIsBoot > 0);
});
