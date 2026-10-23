// Run week layout, every lattice whole: the claims tests/integration/run-week-layout.test.js runs on one seed and a
// sample, here on every seed and every config the rulings were measured on (D125, D130, D132, D113a, D146). CI runs
// it, the 60-second check does not.
//
// Golden values, current, in tests/snapshots/run-week-layout.json: the NRC run card names the D146 lattice prints
// (11), and the day by day sport layout of every multi-sport week under the four excluded injury modes (348 pace and
// 232 NRC cells). Both were checked once against the build the rulings named as their oracle (V212, 169537c): the
// names are a subset of V212's on the same lattice and every layout equals V212's.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { matchSnapshot } from '../support/snapshot.ts';
import * as R from '../support/run-week-layout.ts';
import type { DayKey } from '@ia/core';
const { DAYS } = R;

const CAL64 = R.calendars([0, 1, 2, 3]);
const T14 = new Set(R.TOL14);

test('64 calendars on three seeds, every week: 6,336 hard run pairs and none untolerated; a tolerated pair only on the 14, and every run card names its key', () => {
  let weeks = 0, pairs = 0, cardsN = 0;
  const untol = [], tolCal = new Set(), names = [];
  for (const c of CAL64) for (const seed of [1001, 4004, 7007]) {
    const p = R.build(R.paceCfg(c.rest, seed));
    for (const r of R.runCards(p)) { cardsN++; if (!R.cardNameAgrees(r.c)) names.push(c.key + ' ' + r.c.subtype); }
    for (const w of R.weeksOf(p)) {
      const lay = R.runLayout(p.weeks[w]), days = R.runDays(lay);
      const hard = days.filter(d => ['int', 'chi', 'lsd_long'].includes(lay[d] ?? '')).length;
      const s = R.classify(days, lay);
      weeks++;
      pairs += hard * (hard - 1) / 2;
      if (s.untol) untol.push(c.key + ' seed ' + seed + ' W' + w + ' ' + R.layoutString(lay));
      if (s.tol) tolCal.add(c.key);
    }
  }
  assert.deepEqual({ weeks, pairs }, { weeks: 2112, pairs: 6336 });
  assert.deepEqual(untol, []);
  assert.deepEqual([...tolCal].sort(), R.TOL14.slice().sort());
  assert.ok(cardsN >= 8000, cardsN + ' run cards');
  assert.deepEqual(names.slice(0, 5), []);
});

test('the 14 on three seeds: four runs in every one of 462 weeks, each paying exactly one tolerated CHI eve and nothing untolerated', () => {
  let weeks = 0;
  const bad = [];
  for (const key of R.TOL14) for (const seed of [1001, 4004, 7007]) {
    const p = R.build(R.paceCfg(key.split(',') as DayKey[], seed));
    for (const w of R.weeksOf(p)) {
      const lay = R.runLayout(p.weeks[w]), days = R.runDays(lay), s = R.classify(days, lay);
      weeks++;
      if (days.length !== 4 || s.untol !== 0 || s.tol !== 1) bad.push(key + ' seed ' + seed + ' W' + w + ' ' + R.layoutString(lay));
    }
  }
  assert.equal(weeks, 462);
  assert.deepEqual(bad, []);
});

test('64 calendars on nine seeds, every week (6,336): four runs, no untolerated pair, the tolerated pair on all 99 weeks of each of the 14 (1,386) and none of the 50, no leg day on the long run or its eve, and every run card names its key', () => {
  const SEEDS = [1001, 2002, 3003, 4004, 5005, 6006, 7007, 8008, 9009];
  const HEAVY = new Set(['Posterior Chain', 'Leg Strength + Mobility']);
  let weeks = 0, tolWeeks = 0;
  const notFour: string[] = [], untol: string[] = [], perCal: Record<string, number> = {}, heavy: string[] = [], names: string[] = [];
  for (const c of CAL64) {
    perCal[c.key] = 0;
    for (const seed of SEEDS) {
      const p = R.build(R.paceCfg(c.rest, seed));
      for (const r of R.runCards(p)) if (!R.cardNameAgrees(r.c)) names.push(c.key + ' seed ' + seed + ' ' + r.c.subtype);
      for (const w of R.weeksOf(p)) {
        const wk = p.weeks[w], lay = R.runLayout(wk), days = R.runDays(lay), s = R.classify(days, lay);
        weeks++;
        if (days.length !== 4) notFour.push(c.key + ' seed ' + seed + ' W' + w);
        if (s.untol) untol.push(c.key + ' seed ' + seed + ' W' + w);
        if (s.tol) { tolWeeks++; perCal[c.key]++; }
        const L = days.find(d => lay[d] === 'lsd_long');
        if (L && (HEAVY.has((wk[L] || {}).title) || HEAVY.has((wk[R.prevDay(L)] || {}).title))) heavy.push(c.key + ' seed ' + seed + ' W' + w);
      }
    }
  }
  assert.equal(weeks, 6336);
  assert.deepEqual(notFour, []);
  assert.deepEqual(untol, []);
  assert.equal(tolWeeks, 1386);
  assert.deepEqual(Object.keys(perCal).filter(k => perCal[k] !== (T14.has(k) ? 99 : 0)), []);
  assert.deepEqual(heavy, []);
  assert.deepEqual(names.slice(0, 5), [], 'run cards whose name and key disagree');
});

test('multi-sport pace reaches the three-run week on 29 of 64 calendars with a bike and 29 with a swim, each free of untolerated pairs', () => {
  for (const other of ['bike', 'swim'] as const) {
    let three = 0;
    const dirty = [];
    for (const c of CAL64) {
      const lay = R.runLayout(R.build(R.paceMultiCfg(c.rest, 1001, other)).weeks[1]), days = R.runDays(lay);
      if (days.length !== 3) continue;
      three++;
      if (R.classify(days, lay).untol) dirty.push(c.key + ' ' + R.layoutString(lay));
    }
    assert.equal(three, 29, other);
    assert.deepEqual(dirty, [], other);
  }
});

test('the walking week, 64 calendars by 4 injury states by 2 seeds (512 programs): four sessions always carry INT and CHI; a walking week keeps three, a quality week four; every run card names its key', () => {
  const tally: Record<string, Record<string, number>> = {}, bad: string[] = [];
  let progs = 0;
  for (const c of CAL64) for (const inj of R.WALK_INJ) for (const seed of R.WALK_SEEDS) {
    const p = R.build(R.walkCfg(c.rest, seed, inj.v));
    progs++;
    for (const r of R.runCards(p)) if (!R.cardNameAgrees(r.c)) bad.push(c.key + ' ' + inj.k + ' ' + r.c.subtype + ' key ' + (r.c.dose && r.c.dose.key));
    tally[inj.k] = tally[inj.k] || {};
    for (const w of R.weeksOf(p)) {
      const s = R.scanWeek(p.weeks[w]);
      tally[inj.k][s.n] = (tally[inj.k][s.n] || 0) + 1;
      if (s.n >= 4 && !(s.hasInt && s.hasChi)) bad.push(c.key + ' ' + inj.k + ' seed ' + seed + ' W' + w);
    }
  }
  assert.equal(progs, 512);
  assert.deepEqual(bad, []);
  for (const inj of R.WALK_INJ) assert.deepEqual(Object.keys(tally[inj.k]), [inj.walks ? '3' : '4'], inj.k);
});

test('the walking-week ceiling leaves run_half, run_base and multi-sport pace alone on every one- and three-rest-day calendar', () => {
  const INJ = R.WALK_INJ.filter(i => i.k !== 'shoulder/protect');
  const cals = R.calendars([3, 1]);
  for (const row of R.WALK_OUT_OF_SCOPE) {
    const sig: Record<string, string> = {};
    for (const inj of INJ) sig[inj.k] = cals.map(c => { const p = R.build(R.walkCfg(c.rest, 1013, inj.v, row.types, row.goal)); return R.weeksOf(p).map(w => R.scanWeek(p.weeks[w]).n).join(''); }).join('|');
    for (const inj of INJ) assert.equal(sig[inj.k], sig.healthy, row.name + ' ' + inj.k);
  }
});

test('three-run pace weeks, 35 calendars by 4 block lengths by 3 focuses (420 builds): the 28 spaceable run INT, CHI, long; the 7 spacer calendars cross INT to CHI', () => {
  const n = { spacer: 0, spaceable: 0 };
  for (const cal of R.THREE_DAY) for (const tw of [6, 9, 11, 15]) for (const f of R.FOCI) {
    const rest = DAYS.filter(d => !cal.includes(d));
    const p = R.build(R.mkCfg('run_pace_goal', {}, rest, f, { _raceDateCappedWeeks: tw }));
    const per = R.weeksOf(p).map(w => R.runsOf(p.weeks[w]));
    const cnt = (Rr: R.WeekRun[], t: string) => Rr.filter(r => r.t === t).length;
    const where = cal.join('+') + ' tw ' + tw + ' ' + f;
    assert.equal(per.length, tw, where);
    if (R.SPACER_TYPED.includes(cal.join('+'))) {
      n.spacer++;
      const cr = R.handCross(tw);
      assert.ok(per.every(Rr => Rr.length === 3 && cnt(Rr, 'int') + cnt(Rr, 'chi') === 1), where);
      assert.deepEqual(per.map((Rr, i) => cnt(Rr, 'int') ? i + 1 : 0).filter(Boolean), Array.from({ length: cr - 1 }, (_, i) => i + 1), where);
      assert.deepEqual(per.map((Rr, i) => cnt(Rr, 'chi') ? i + 1 : 0).filter(Boolean), Array.from({ length: tw - cr + 1 }, (_, i) => cr + i), where);
    } else {
      n.spaceable++;
      per.forEach((Rr, i) => assert.ok(Rr.length === 3 && cnt(Rr, 'int') === 1 && cnt(Rr, 'chi') === 1 && cnt(Rr, 'long') === 1 && R.untolRuns(Rr) === 0, where + ' W' + (i + 1)));
    }
  }
  assert.deepEqual(n, { spacer: 84, spaceable: 336 });
});

test('the pace lattice of D113a (1,584 configs, solo and with 15 second sports): no week with an untolerated pair, and multi-sport three-run weeks reached', () => {
  let weeks = 0, three = 0;
  const bad = [];
  for (const x of R.paceLattice113()) {
    const p = R.build(x.cfg), multi = Object.keys(x.ex).length > 0;
    for (const w of R.weeksOf(p)) {
      const Rr = R.runsOf(p.weeks[w]);
      weeks++;
      if (multi && Rr.length === 3) three++;
      if (R.untolRuns(Rr)) bad.push(JSON.stringify(x.ex) + ' rest ' + x.rest + ' W' + w);
    }
  }
  assert.deepEqual(bad, []);
  assert.ok(three > 100, three + ' multi-sport three-run weeks');
  assert.ok(weeks > 20000, weeks + ' weeks');
});

/** The D146 lattice, built once: the NRC multi-sport claims, and the run card names it prints. */
/** The D146 lattice's tallies: long-run weeks, weeks with an untolerated pair, weeks whose long run is not last, the run names. */
interface Nrc146 { longWeeks: number; pairs: string[]; notLast: string[]; names: string[] }
let NRC146: Nrc146 | null = null;
function nrc146(): Nrc146 {
  if (NRC146) return NRC146;
  let longWeeks = 0;
  const pairs: string[] = [], notLast: string[] = [], names = new Set<string>();
  for (const x of R.nrcLattice146()) {
    const p = R.build(x.cfg);
    for (const w of R.weeksOf(p)) {
      const Rr = R.runsOf(p.weeks[w]);
      Rr.forEach(r => names.add(String(r.c.subtype || '')));
      if (R.untolRuns(Rr)) pairs.push(x.g + ' ' + JSON.stringify(x.ex) + ' rest ' + x.rest + ' W' + w);
      const L = Rr.find(r => r.t === 'nlong');
      if (!L) continue;
      longWeeks++;
      if (Rr.some(r => R.ISO.indexOf(r.day) > R.ISO.indexOf(L.day))) notLast.push(x.g + ' ' + JSON.stringify(x.ex) + ' rest ' + x.rest + ' W' + w);
    }
  }
  NRC146 = { longWeeks, pairs, notLast, names: [...names].sort() };
  return NRC146;
}

test('the NRC multi-sport lattice of D146 (1,980 configs): no week with an untolerated pair, and the long run is the last run of its ISO week', () => {
  const N = nrc146();
  assert.deepEqual(N.pairs, []);
  assert.deepEqual(N.notLast, []);
  assert.ok(N.longWeeks > 1000, N.longWeeks + ' long-run weeks');
});

test('every excluded injury mode is reached on the pace lattice of D113a, each with multi-sport builds', () => {
  const plan = R.app().eval('injuryPlan');
  const EXC = [{}, { bike: 'bike_base' }, { swim: 'swim_base' }, { bike: 'bike_ftp', swim: 'swim_mile' }];
  const reach: Record<string, number> = {}, multi: Record<string, number> = {};
  EXC.forEach((e, j) => R.EXCL_INJ.forEach(inj => R.CALS99.forEach((rest, i) => {
    const cfg = R.mkCfg('run_pace_goal', e, rest, R.FOCI[(i + j) % 3], { injury: inj });
    const mode = (plan(R.clone(cfg)) || {}).cardioMode || 'none';
    if (!R.EXCLUDED_MODES.includes(mode)) return;
    R.build(cfg);
    reach[mode] = (reach[mode] || 0) + 1;
    if (Object.keys(e).length) multi[mode] = (multi[mode] || 0) + 1;
  })));
  for (const m of R.EXCLUDED_MODES) assert.ok(reach[m] > 0 && multi[m] > 0, m + ' ' + JSON.stringify(multi));
});

/** The exclusion key's populations, built once: every cell's layout code, the twins' routing, the chooser's alternative. */
/** One exclusion row's population read (see excluded). */
interface ExclRow { cells: number; twins: number; layouts: Record<string, string>; reach: Record<string, number>; moved: number; routable: number; routed: number; twinOff: string[] }
let EXCL: Record<string, ExclRow> | null = null;
function excluded(): Record<string, ExclRow> {
  if (EXCL) return EXCL;
  const C = R.chooser();
  EXCL = {};
  for (const row of ['pace', 'nrc'] as const) {
    const pop = R.excludedPopulation(row);
    const layouts: Record<string, string> = {}, reach: Record<string, number> = {};
    let moved = 0, routable = 0, routed = 0;
    const twinOff: string[] = [];
    for (const cell of pop.cells) {
      const p = R.build(cell.cfg), train = R.cardioTrainDays(cell.cfg);
      layouts[cell.key] = R.layoutCode(p, cell.cfg);
      reach[cell.mode] = (reach[cell.mode] || 0) + 1;
      const days = R.weekRunDays(p, 1, train);
      if (days.length < R.ROUTE_FROM[row]) continue;
      routable++;
      const pick = C.choose(train, days.length, cell.cfg.cardioGoals.run.id, row === 'pace');
      if (pick.idxs.map(i => train[i]).join() !== days.join()) moved++;
    }
    for (const t of pop.twins) {
      const p = R.build(t.cfg), train = R.cardioTrainDays(t.cfg), days = R.weekRunDays(p, 1, train);
      if (days.length < R.ROUTE_FROM[row]) continue;
      routed++;
      const pick = C.choose(train, days.length, t.cfg.cardioGoals.run.id, row === 'pace');
      if (pick.idxs.map(i => train[i]).join() !== days.join()) twinOff.push(t.key);
    }
    EXCL[row] = { cells: pop.cells.length, twins: pop.twins.length, layouts, reach, moved, routable, routed, twinOff };
  }
  return EXCL;
}

test('the golden values match tests/snapshots/run-week-layout.json: the NRC run card names and every excluded-mode multi-sport layout', () => {
  const E = excluded();
  matchSnapshot('run-week-layout', {
    nrcRunNames: nrc146().names,
    excludedLayouts: { pace: E.pace.layouts, nrc: E.nrc.layouts },
  });
});

test('the exclusion key: every excluded mode is reached in both populations, the uninjured twins take the chooser\'s run days, and the chooser would move most excluded weeks', () => {
  const E = excluded();
  assert.deepEqual({ cells: E.pace.cells, twins: E.pace.twins, nrcCells: E.nrc.cells, nrcTwins: E.nrc.twins }, { cells: 348, twins: 87, nrcCells: 232, nrcTwins: 58 });
  for (const row of ['pace', 'nrc']) {
    for (const m of R.EXCLUDED_MODES) assert.ok(E[row].reach[m] > 0, row + ' ' + m);
    assert.deepEqual(E[row].twinOff, [], row + ': a routed twin off the chooser');
    assert.ok(E[row].routed > 0, row + ' routed twins');
    assert.ok(E[row].moved > 0, row + ': the chooser would move an excluded week, so the pinned layouts can fail');
  }
  assert.deepEqual({ pace: [E.pace.moved, E.pace.routable], nrc: [E.nrc.moved, E.nrc.routable] }, { pace: [36, 44], nrc: [112, 116] });
});
