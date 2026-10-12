'use strict';
// Run week layout: which training days carry a run, and which run each one is. Rulings:
//   D125 (amended)  the NSW pace family (run_pace_goal, run_mile_time, run_15_under10) takes up to four runs, laid out
//                   by the spacing-aware run day chooser; its long run is a preference, not a pin;
//   D129            two tiebreaks under the ruled terms (identity: the even spread subset the athlete already has wins
//                   a tie; spread: the shortest longest run-free stretch), ranks 8 and 9 (rest into the long run,
//                   the earliest quality day), and "an easy run padding the long" means its eve, on the pace family;
//   D130            hard days side by side are not one thing: a CHI on the long run's eve is tolerated, every other
//                   hard pair is not and must be zero; the four-run ceiling reads the untolerated count;
//   D132            a walking week (a protected knee or low back) keeps three cardio sessions: the fourth run goes
//                   only to a week that carries quality;
//   D113a, D146     a three-run pace week is INT, CHI and the long run (or easy, INT, long where no layout of those
//                   three stays clean); a multi-sport week's runs are placed by the same chooser, except under the
//                   four injury modes that rewrite every run.
// NRC keeps both long run pins and its shipped objective. The record is in the handoff and tests/measure/v205_rulings/
// to v213_rulings/.
//
// The run day chooser is lifted out of the app and run alone (tests/support/run-week-layout.js chooser()); its pick
// must be a maximum of an exhaustive search over every layout, scored by the ruled objective typed in the support
// file. Built programs are read by content (the dose key, the printed name, legLoad). This file runs the chooser on
// every routed row (it builds nothing) and the built-week claims on one seed of each lattice;
// tests/sweeps/run-week-layout.test.js builds every seed and every lattice whole.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { progDigest } = require('../support/app.js');
const R = require('../support/run-week-layout.js');
const { DAYS, TP, TN, layouts, topBy, cmp, findPick, pickLayout, layoutOf } = R;

const SNAPSHOT = path.join(__dirname, '..', 'snapshots', 'run-week-layout.json');

// ── the chooser, alone ───────────────────────────────────────────────────────────────────────────────────────────

test('the run day chooser and its session tables lift out of the app and run alone', () => {
  const C = R.chooser();
  for (const f of ['choose', 'sessionTypes', 'nrcTypes', 'isSpeedGoal']) assert.equal(typeof C[f], 'function', f);
  const p = C.choose(['mon', 'tue', 'thu', 'fri', 'sat'], 4, 'run_pace_goal', true);
  assert.ok(p && Array.isArray(p.idxs) && p.idxs.length === 4, 'a four-run pick');
});

test('the NSW run table is Table 7 as the pace family deals it, and the NRC table is one speed day for the marathon, two for every other plan', () => {
  const C = R.chooser();
  // the pace flag on (D113a): two runs easy and long; three INT, CHI and long; four add the easy run
  for (const n of [2, 3, 4]) assert.deepEqual(C.sessionTypes(n, true, false, false, true), R.NSW_RUN_TYPES[n], 'pace, ' + n + ' runs');
  // the pace flag off (an excluded injury mode, and the row D129 was ruled on): three runs keep easy, INT and long
  assert.deepEqual(C.sessionTypes(3, true, false, false, false), R.NSW_FALLBACK3);
  assert.deepEqual(C.sessionTypes(4, true, false, false, false), R.NSW_RUN_TYPES[4]);
  for (const g of R.NRC_PLANS) for (let n = 1; n <= 7; n++) assert.deepEqual(C.nrcTypes(n, g), R.nrcTypesHand(n, g), g + ' ' + n + ' runs');
});

/** The routed pace rows: rest-day calendars with zero to five rest days, at a ceiling of two, three or four runs. */
const PACE_ALL = [];
R.calendars([0, 1, 2, 3, 4, 5]).forEach(c => [2, 3, 4].forEach(cap => { if (cap <= c.train.length) PACE_ALL.push(Object.assign({ cap }, c)); }));
/** D129's rows: three or four runs, capped strictly below the training week (93 rows). */
const PACE_ROWS = PACE_ALL.filter(r => r.cap >= 3 && r.cap < r.train.length);

test('every routed pace layout is a maximum of the full ruled objective, over every subset and every order of its types', () => {
  const C = R.chooser();
  const bad = [];
  for (const r of PACE_ALL) {
    const all = layouts(r.train, r.cap, R.paceTypes(r.train, r.cap), TP, true);
    const pick = C.choose(r.train, r.cap, 'run_pace_goal', true);
    const got = findPick(all, r.train, pick);
    const best = topBy(all, 'rank')[0];
    if (!got || cmp(got.rank, best.rank) !== 0) bad.push(r.key + ' cap ' + r.cap + ': ' + pickLayout(r.train, pick) + ' rank ' + (got ? got.rank : 'off the space') + ' best ' + best.rank);
  }
  assert.equal(PACE_ROWS.length, 93);
  assert.deepEqual(bad, []);
});

test('the day after the long run is never credited as padding it: no pick keeps a day-after easy run over a true eve', () => {
  const C = R.chooser();
  const bad = [];
  for (const r of PACE_ROWS) {
    const pick = C.choose(r.train, r.cap, 'run_pace_goal', true);
    const days = pick.idxs.map(i => r.train[i]);
    const L = days.find(d => pick.typeOf[d] === 'lsd_long');
    if (!L) continue;
    const afterOnly = days.some(d => pick.typeOf[d] === 'lsd_easy' && d === R.nextDay(L)) && !days.some(d => pick.typeOf[d] === 'lsd_easy' && d === R.prevDay(L));
    if (!afterOnly) continue;
    const all = layouts(r.train, r.cap, R.paceTypes(r.train, r.cap), TP, true);
    const got = findPick(all, r.train, pick);
    const better = all.find(c => cmp(c.ruled.slice(0, 4), got.ruled.slice(0, 4)) === 0 && c.ruled[4] > got.ruled[4]);
    if (better) bad.push(r.key + ' cap ' + r.cap + ' kept ' + pickLayout(r.train, pick) + ' over ' + layoutOf(better));
  }
  assert.deepEqual(bad, []);
});

/** The NRC rows: every plan, zero to five rest days, every ceiling from two to one below the training week (804 rows). */
const NRC_ROWS = [];
R.NRC_PLANS.forEach(g => R.calendars([0, 1, 2, 3, 4, 5]).forEach(c => { for (let cap = 2; cap < c.train.length; cap++) NRC_ROWS.push(Object.assign({ g, cap }, c)); }));

test('NRC keeps both long run pins: on every NRC layout the long run is the last training day, and the pace family uses the escape', () => {
  const C = R.chooser();
  let rows = 0;
  const unpinned = [];
  for (const g of R.NRC_PLANS) for (const c of R.calendars([0, 1, 2, 3])) for (let cap = 2; cap < Math.min(c.train.length, 6); cap++) {
    if (R.nrcTypesHand(cap, g).length !== cap) continue;
    rows++;
    const p = C.choose(c.train, cap, g, false);
    const L = Object.keys(p.typeOf).find(d => p.typeOf[d] === 'nrc_long');
    if (L && L !== c.train[c.train.length - 1]) unpinned.push(g + ' ' + c.key + ' cap ' + cap);
  }
  assert.equal(rows, 660);
  assert.deepEqual(unpinned, []);
  let escapes = 0;
  for (const c of R.calendars([0, 1, 2, 3])) {
    if (c.train.length <= 4) continue;
    const p = C.choose(c.train, 4, 'run_pace_goal', true);
    const L = Object.keys(p.typeOf).find(d => p.typeOf[d] === 'lsd_long');
    if (L && L !== c.train[c.train.length - 1]) escapes++;
  }
  assert.ok(escapes > 0, 'the pace family moves its long run off the last training day somewhere');
});

test('every NRC layout is a maximum of its five ruled terms, with the shipped easy run predicate, and carries untol equal to coll', () => {
  const C = R.chooser();
  const bad = [], split = [];
  for (const r of NRC_ROWS) {
    const all = layouts(r.train, r.cap, R.nrcTypesHand(r.cap, r.g), TN, false);
    if (!all.length) continue;
    const pick = C.choose(r.train, r.cap, r.g, false);
    const got = findPick(all, r.train, pick);
    if (!got || cmp(got.ruled, topBy(all, 'ruled')[0].ruled) !== 0) bad.push(r.g + ' ' + r.key + ' cap ' + r.cap);
    if (pick.untol !== pick.coll || pick.tol !== 0) split.push(r.g + ' ' + r.key + ' cap ' + r.cap + ' coll ' + pick.coll + ' untol ' + pick.untol);
  }
  assert.equal(NRC_ROWS.length, 804);
  assert.deepEqual(bad, []);
  assert.deepEqual(split, []);
});

test('identity is pace family only: NRC declines the even spread subset on 129 of the 357 five-term ties it is offered', () => {
  const C = R.chooser();
  let tieMulti = 0, offered = 0, takes = 0, declines = 0;
  for (const r of NRC_ROWS) {
    const all = layouts(r.train, r.cap, R.nrcTypesHand(r.cap, r.g), TN, false);
    if (!all.length) continue;
    const subs = new Set(topBy(all, 'ruled').map(c => c.idxs.join(',')));
    if (subs.size < 2) continue;
    tieMulti++;
    const ev = R.evenIdx(r.train.length, r.cap).join(',');
    if (!subs.has(ev)) continue;
    offered++;
    if (C.choose(r.train, r.cap, r.g, false).idxs.join(',') === ev) takes++; else declines++;
  }
  assert.deepEqual({ tieMulti, offered, takes, declines }, { tieMulti: 445, offered: 357, takes: 228, declines: 129 });
});

test('identity: where the even spread subset ties at the top of the ruled terms, the pace family keeps it (37 rows)', () => {
  const C = R.chooser();
  let n = 0;
  const moved = [];
  for (const r of PACE_ROWS) {
    const tied = topBy(layouts(r.train, r.cap, R.paceTypes(r.train, r.cap), TP, true), 'ruled');
    const ev = R.evenIdx(r.train.length, r.cap).join(',');
    if (!tied.some(c => c.idxs.join(',') === ev)) continue;
    n++;
    const pick = C.choose(r.train, r.cap, 'run_pace_goal', true);
    if (pick.idxs.join(',') !== ev) moved.push(r.key + ' cap ' + r.cap);
  }
  assert.equal(n, 37);
  assert.deepEqual(moved, []);
});

test('spread: among ties without the even spread subset, the pace family takes the tightest week (56 rows)', () => {
  const C = R.chooser();
  let n = 0;
  const loose = [];
  for (const r of PACE_ROWS) {
    const all = layouts(r.train, r.cap, R.paceTypes(r.train, r.cap), TP, true);
    const tied = topBy(all, 'ruled');
    if (tied.some(c => c.idxs.join(',') === R.evenIdx(r.train.length, r.cap).join(','))) continue;
    n++;
    const got = findPick(all, r.train, C.choose(r.train, r.cap, 'run_pace_goal', true));
    if (!got || got.lf !== Math.min(...tied.map(c => c.lf))) loose.push(r.key + ' cap ' + r.cap);
  }
  assert.equal(n, 56);
  assert.deepEqual(loose, []);
});

test("Mario's calendar (rest Sunday and Wednesday) at four runs: MON INT, THU CHI, FRI easy, SAT long, clean, ranked 0,1,2,1,1, longest gap 2", () => {
  const train = DAYS.filter(d => !R.MARIO_REST.includes(d));
  const pick = R.chooser().choose(train, 4, 'run_pace_goal', true);
  assert.equal(pickLayout(train, pick), 'mon:int thu:chi fri:lsd_easy sat:lsd_long');
  const got = findPick(layouts(train, 4, R.NSW_RUN_TYPES[4], TP, true), train, pick);
  assert.deepEqual({ untol: got.untol, tol: got.tol }, { untol: 0, tol: 0 });
  // the five ruled terms of D129: the head -(10 x untolerated + tolerated), the long run last, quality after rest, the
  // easy eve, INT before CHI
  assert.deepEqual([10 * got.ruled[0] + got.ruled[1], ...got.ruled.slice(2)].map(x => x + 0), [0, 1, 2, 1, 1]);
  assert.equal(got.lf, 2);
});

test('rest Friday at four runs: MON INT, WED CHI, THU easy, SAT long, with three days from the last quality day into the long run', () => {
  const train = DAYS.filter(d => d !== 'fri');
  const pick = R.chooser().choose(train, 4, 'run_pace_goal', true);
  assert.equal(pickLayout(train, pick), 'mon:int wed:chi thu:lsd_easy sat:lsd_long');
  assert.equal(findPick(layouts(train, 4, R.NSW_RUN_TYPES[4], TP, true), train, pick).qr, 3);
});

test('the eve correction moves 24 of the 93 pace rows on the type set D129 was ruled on', () => {
  let moved = 0;
  for (const r of PACE_ROWS) {
    const all = layouts(r.train, r.cap, R.D129_TYPES[r.cap], TP, true);
    const a = topBy(all, 'ruled')[0], b = topBy(all, 'shipped')[0];
    if (layoutOf(a) !== layoutOf(b)) moved++;
  }
  assert.equal(moved, 24);
});

test('ties after rank 9: 2 of 93 rows, both spanning two day sets with the hard days in place; rank 8 breaks 5 and rank 9 breaks 2 of the 9 left at rank 7', () => {
  let resid = 0, spanning = 0, hardSplit = 0, r8 = 0, r9 = 0;
  for (const r of PACE_ROWS) {
    const all = layouts(r.train, r.cap, R.D129_TYPES[r.cap], TP, true).map(c => Object.assign({}, c, { k7: c.rank.slice(0, 8), k8: c.rank.slice(0, 9) }));
    const tied = topBy(all, 'rank');
    if (tied.length >= 2) {
      resid++;
      if (new Set(tied.map(c => c.idxs.join(','))).size > 1) spanning++;
      if (new Set(tied.map(c => c.hard)).size > 1) hardSplit++;
    }
    const t7 = topBy(all, 'k7').length, t8 = topBy(all, 'k8').length, t9 = tied.length;
    if (t7 > t8) r8++;
    if (t8 > t9) r9++;
  }
  assert.deepEqual({ resid, spanning, hardSplit, r8, r9 }, { resid: 2, spanning: 2, hardSplit: 0, r8: 5, r9: 2 });
  assert.equal(r8 + r9 + resid, 9);
});

/** The 64 rest-day calendars with zero to three rest days. */
const CAL64 = R.calendars([0, 1, 2, 3]);
const minColl = list => Math.min(...list.map(c => c.coll));

test('the unsplit search space at four runs: 50 of 64 calendars reach zero pairs (21/35, 21/21, 7/7, 1/1); the 14 that do not are four-day calendars one pair short', () => {
  const zero = { 4: 0, 5: 0, 6: 0, 7: 0 }, tot = { 4: 0, 5: 0, 6: 0, 7: 0 }, losers = [];
  for (const c of CAL64) {
    const n = c.train.length;
    tot[n]++;
    const m = minColl(layouts(c.train, 4, R.NSW_RUN_TYPES[4], TP, true));
    if (m === 0) zero[n]++; else losers.push({ n, m });
  }
  assert.deepEqual(tot, { 4: 35, 5: 21, 6: 7, 7: 1 });
  assert.deepEqual(zero, { 4: 21, 5: 21, 6: 7, 7: 1 });
  assert.equal(losers.length, 14);
  assert.ok(losers.every(l => l.n === 4 && l.m === 1));
});

test('the long run pin: pinned, 19 of 35 four-day and 18 of 21 five-day calendars reach zero; relaxing it rescues the five ruled calendars, the subset half alone none, the permutation half two', () => {
  const pinZero = { 4: 0, 5: 0 }, rescued = [], permRescue = [];
  const z = { free: 0, subset: 0, perm: 0, both: 0 };
  for (const c of CAL64) {
    const n = c.train.length, last = c.train[n - 1];
    const all = layouts(c.train, 4, R.NSW_RUN_TYPES[4], TP, true);
    const pinned = layouts(c.train, 4, R.NSW_RUN_TYPES[4], TP, false);   // both pins, as NRC carries them
    const endOnly = all.filter(x => x.days[x.days.length - 1] === last);
    const permOnly = all.filter(x => { const L = x.days.find(d => x.typeOf[d] === 'lsd_long'); return !L || L === x.days[x.days.length - 1]; });
    const f = minColl(all), s = minColl(endOnly), p = minColl(permOnly), b = minColl(permOnly.filter(x => x.days[x.days.length - 1] === last));
    assert.equal(minColl(pinned), b, c.key + ': both pins together are the pinned control');
    if (n in pinZero && b === 0) pinZero[n]++;
    if (f === 0 && b > 0) rescued.push(c.rest.join('+'));
    if (f === 0 && p > 0) permRescue.push(c.rest.join('+'));
    z.free += f === 0; z.subset += s === 0; z.perm += p === 0; z.both += b === 0;
    assert.ok(!(f === 0 && s > 0), c.key + ': the subset half rescues nothing');
  }
  assert.deepEqual(pinZero, { 4: 19, 5: 18 });
  assert.deepEqual(rescued.sort(), ['mon+thu', 'mon+tue', 'mon+tue+thu', 'mon+wed+thu', 'wed+thu']);
  assert.deepEqual(z, { free: 50, subset: 50, perm: 48, both: 45 });
  assert.deepEqual(permRescue.sort(), ['mon+tue+thu', 'mon+wed+thu']);
});

test('at four runs on all 64 calendars: no untolerated pair; the 14 pay exactly one tolerated CHI eve, the 50 none and equal the unsplit winner; four of the 14 move the long run off the last day, as ruled', () => {
  const C = R.chooser();
  const OFF_LAST = {
    'mon,tue,fri': 'sun:lsd_long wed:int thu:lsd_easy sat:chi',
    'mon,thu,fri': 'sun:lsd_long tue:int wed:lsd_easy sat:chi',
    'wed,thu,fri': 'sun:lsd_long mon:lsd_easy tue:int sat:chi',
    'mon,tue,wed': 'sun:int thu:chi fri:lsd_long sat:lsd_easy',
  };
  const T14 = new Set(R.TOL14);
  const unsplit = c => [-c.coll].concat(c.rank.slice(2));
  const notBest = [], untol = [], tolOn = [], cleanOff = [], unsplitOff = [], offLast = {};
  for (const c of CAL64) {
    const all = layouts(c.train, 4, R.NSW_RUN_TYPES[4], TP, true).map(x => Object.assign(x, { unsplit: unsplit(x) }));
    const pick = C.choose(c.train, 4, 'run_pace_goal', true);
    const built = pickLayout(c.train, pick);
    const got = findPick(all, c.train, pick);
    if (built !== layoutOf(topBy(all, 'rank')[0])) notBest.push(c.key);
    if (got.untol) untol.push(c.key);
    if (got.tol) tolOn.push(c.key);
    if (T14.has(c.key) ? got.tol !== 1 : got.tol !== 0) cleanOff.push(c.key);
    if (!T14.has(c.key) && built !== layoutOf(topBy(all, 'unsplit')[0])) unsplitOff.push(c.key);
    const L = c.train.find(d => pick.typeOf[d] === 'lsd_long');
    if (T14.has(c.key) && L !== c.train[c.train.length - 1]) offLast[c.key] = built;
  }
  assert.deepEqual(notBest, [], 'the pick is the first maximum of the split objective');
  assert.deepEqual(untol, []);
  assert.deepEqual(tolOn.sort(), R.TOL14.slice().sort());
  assert.deepEqual(cleanOff, []);
  assert.deepEqual(unsplitOff, [], 'the 50 are what the unsplit objective picks');
  assert.deepEqual(offLast, OFF_LAST);
});

test('at three runs a mid-week long run ships only where every long-last layout ranks below it (7 of 64 calendars)', () => {
  const C = R.chooser();
  let mid = 0;
  const tied = [];
  for (const c of CAL64) {
    const p = C.choose(c.train, 3, 'run_pace_goal', true);
    const days = p.idxs.map(i => c.train[i]);
    if (days.find(d => p.typeOf[d] === 'lsd_long') === days[days.length - 1]) continue;
    mid++;
    const all = layouts(c.train, 3, R.paceTypes(c.train, 3), TP, true);
    const lastLong = all.filter(x => x.typeOf[x.days[x.days.length - 1]] === 'lsd_long');
    if (lastLong.length && cmp(topBy(lastLong, 'ruled')[0].ruled, topBy(all, 'ruled')[0].ruled) === 0) tied.push(c.key);
  }
  assert.equal(mid, 7);
  assert.deepEqual(tied, []);
});

// ── the source ───────────────────────────────────────────────────────────────────────────────────────────────────

test('the source: the pace ceiling drops to three only on an untolerated pick, and the rank key is the ruled order, split on the pace family only', () => {
  const src = R.code();
  assert.equal(R.occurrences(src, 'if(_paceCapped && capDays > 3 && (!_pick || _pick.untol > 0)){'), 1);
  assert.equal(R.occurrences(src, '_pick.coll > 0'), 0, 'the total-collision key is gone from the ceiling');
  assert.equal(R.occurrences(src, 'const _rank = c => [-c.untol, -c.tol, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst];'), 1);
  assert.equal(R.occurrences(src, 'const untol = paceFam ? _untol : coll;'), 1);
  assert.equal(R.occurrences(src, 'const tol   = paceFam ? _tol   : 0;'), 1);
  assert.equal(R.occurrences(src, "const identity = (paceFam && idxs.join(',') === _evenKey) ? 1 : 0;"), 1);
});

test('the source: PACE_GOALS is the three pace ids, the pace gate takes the whole week and NRC stays strictly below it, and every other goal keeps the even spread', () => {
  const src = R.code(), f = R.flat();
  assert.match(src, /PACE_GOALS\s*=\s*new Set\(\['run_pace_goal',\s*'run_mile_time',\s*'run_15_under10'\]\)/);
  assert.doesNotMatch(src, /PACE_GOALS[^;]*run_base/);
  assert.match(f, /_paceCapped = PACE_GOALS\.has\(_soloRunGoal\) && capDays<=nCardio && capDays>=2/);
  assert.match(f, /_nrcCapped = NRC_GOALS\.has\(_soloRunGoal\) && capDays<nCardio && capDays>=2/);
  assert.match(src, /Math\.round\(k \* \(nCardio - 1\) \/ \(capDays - 1\)\)/);
  // the chooser's plan outranks the last-day long-run default in the NSW type loop
  assert.equal(R.occurrences(src, "let st = _planned || (isLastSportDay ? 'lsd_long' : (types[sportIdx] || 'lsd_easy'));"), 1);
});

test('the source: the walking-week ceiling names both walking modes and is joined to the solo pace family', () => {
  const f = R.flat();
  assert.match(f, /_walkOnly\s*=\s*\(\s*cardioMode\s*===\s*'noimpact'\s*\|\|\s*cardioMode\s*===\s*'noimpact_swim'\s*\)/);
  assert.match(f, /PACE_GOALS\.has\(goalId\)\s*&&\s*\(\s*cardioTypes\.length\s*!==\s*1\s*\|\|\s*_walkOnly\s*\)/);
  assert.match(f, /function sportDayTargets\(cardioTypes, cardioGoals, totalDays, liftGoal, cardioMode\)/);
});

// ── the ceiling and the built week ───────────────────────────────────────────────────────────────────────────────

test('the pace family runs up to four days a week; a walking week or a second sport holds it at three; run_base and NRC keep four', () => {
  const T = (goal, types, mode) => R.app().sportDayTargets(types || ['run'], { run: { id: goal }, bike: { id: 'bike_base' } }, 7, 'balanced', mode || null).targets.run;
  for (const g of R.PACE_IDS) {
    assert.equal(T(g), 4, g);
    assert.equal(T(g, null, 'noimpact'), 3, g + ' on a protected knee');
    assert.equal(T(g, null, 'noimpact_swim'), 3, g + ' on a protected low back');
    assert.equal(T(g, ['run', 'bike']), 3, g + ' with a bike');
  }
  for (const g of ['run_base', 'run_half']) for (const mode of [null, 'noimpact', 'noimpact_swim']) assert.equal(T(g, null, mode), 4, g + ' ' + mode);
  // the literal itself, read inside the SPORT_CEILINGS table (three other tables key on the same goal id)
  const block = R.code().match(/SPORT_CEILINGS\s*=\s*\{[\s\S]*?\n\s*\};/);
  assert.ok(block, 'the SPORT_CEILINGS table');
  assert.match(block[0], /run_pace_goal:\s*4\b/);
});

/** The 64 calendars built once on seed 1001, every week. */
let CEIL = null;
function ceilingLattice() {
  if (!CEIL) CEIL = CAL64.map(c => Object.assign({ p: R.build(R.paceCfg(c.rest, 1001)) }, c));
  return CEIL;
}

test('a pace, run_base, NRC and multi-sport program each equal themselves built twice', () => {
  const cfgs = [R.paceCfg(R.MARIO_REST, R.MARIO_SEED), R.paceCfg(R.MARIO_REST, 1001, 'run_base'), R.mkCfg('run_half', { swim: 'swim_base' }, ['sun'], 'balanced'), R.paceMultiCfg(['sun', 'wed'], 1001, 'bike')];
  for (const c of cfgs) assert.equal(progDigest(R.build(c)), progDigest(R.build(c)), c.cardioGoals.run.id);
});

test('four runs ship exactly where an exhaustive search reaches zero untolerated pairs at four: all 64 calendars (35, 21, 7, 1 by training days)', () => {
  const seen = { 4: 0, 5: 0, 6: 0, 7: 0 }, four = { 4: 0, 5: 0, 6: 0, 7: 0 }, mismatch = [];
  for (const c of ceilingLattice()) {
    const n = R.runDays(R.runLayout(c.p.weeks[1])).length;
    seen[c.train.length]++;
    if (n === 4) four[c.train.length]++;
    const floor = Math.min(...layouts(c.train, 4, R.NSW_RUN_TYPES[4], TP, true).map(x => x.untol));
    if ((n === 4) !== (floor === 0)) mismatch.push(c.key + ' builds ' + n + ' runs, the search floor is ' + floor);
  }
  assert.deepEqual(mismatch, []);
  assert.deepEqual(seen, { 4: 35, 5: 21, 6: 7, 7: 1 });
  assert.deepEqual(four, seen);
});

test('nothing falls back to three, and the 14 named calendars are exactly the ones whose four-run floor is one tolerated pair', () => {
  const floorOne = [], fellBack = [];
  for (const c of ceilingLattice()) {
    if (R.runDays(R.runLayout(c.p.weeks[1])).length !== 4) fellBack.push(c.key);
    const all = layouts(c.train, 4, R.NSW_RUN_TYPES[4], TP, true);
    const best = topBy(all.map(x => Object.assign(x, { head: [-x.untol, -x.tol] })), 'head')[0];
    if (best.untol === 0 && best.tol > 0) floorOne.push(c.key);
  }
  assert.deepEqual(fellBack, []);
  assert.deepEqual(floorOne.sort(), R.TOL14.slice().sort());
});

test('no built pace week carries an untolerated hard pair; the 14 pay one tolerated CHI eve every week and the 50 never do; every week carries four runs', () => {
  const T14 = new Set(R.TOL14);
  let weeks = 0, pairs = 0;
  const untol = [], tolWrong = [], notFour = [];
  for (const c of ceilingLattice()) for (const w of R.weeksOf(c.p)) {
    const lay = R.runLayout(c.p.weeks[w]), days = R.runDays(lay);
    const s = R.classify(days, lay);
    const hard = days.filter(d => ['int', 'chi', 'lsd_long'].includes(lay[d])).length;
    weeks++;
    pairs += hard * (hard - 1) / 2;
    if (days.length !== 4) notFour.push(c.key + ' W' + w);
    if (s.untol) untol.push(c.key + ' W' + w + ' ' + R.layoutString(lay));
    if (s.tol !== (T14.has(c.key) ? 1 : 0)) tolWrong.push(c.key + ' W' + w + ' tolerated ' + s.tol);
  }
  assert.equal(weeks, 704);
  assert.equal(pairs, 2112);
  assert.deepEqual(untol, []);
  assert.deepEqual(tolWrong, []);
  assert.deepEqual(notFour, []);
});

test('the first week of every capped calendar is a maximum of the ruled objective (29 capped, 35 with the day set forced)', () => {
  let capped = 0, forced = 0;
  const bad = [];
  for (const c of ceilingLattice()) {
    const lay = R.runLayout(c.p.weeks[1]), days = R.runDays(lay);
    if (days.length >= c.train.length) { forced++; continue; }
    capped++;
    const all = layouts(c.train, days.length, R.paceTypes(c.train, days.length), TP, true);
    const got = all.find(x => x.days.join() === days.join() && x.days.every(d => x.typeOf[d] === lay[d]));
    if (!got || cmp(got.rank, topBy(all, 'rank')[0].rank) !== 0) bad.push(c.key + ' ' + R.layoutString(lay));
  }
  assert.deepEqual({ capped, forced }, { capped: 29, forced: 35 });
  assert.deepEqual(bad, []);
});

test('every NSW run card names its quality the way its dose key does: Short Interval (SI) is int, Long Interval (LI) is chi', () => {
  let n = 0;
  const bad = [];
  for (const c of ceilingLattice()) for (const r of R.runCards(c.p)) { n++; if (!R.cardNameAgrees(r.c)) bad.push(c.key + ' W' + r.w + ' ' + r.d + ' ' + r.c.subtype + ' key ' + (r.c.dose && r.c.dose.key)); }
  assert.ok(n > 2000, n + ' run cards');
  assert.deepEqual(bad.slice(0, 5), []);
});

test("Mario's calendar builds MON INT, THU CHI, FRI easy, SAT long, keeps TUE a run-free training day, and never lifts heavy on the long run's eve", () => {
  const p = R.build(R.paceCfg(R.MARIO_REST, R.MARIO_SEED));
  const lay = R.runLayout(p.weeks[1]);
  assert.equal(R.layoutString(lay), 'mon:int thu:chi fri:lsd_easy sat:lsd_long');
  assert.equal(lay.tue, undefined);
  assert.ok(!p.weeks[1].tue.rest);
  const heavy = [];
  for (const w of R.weeksOf(p)) {
    const l = R.runLayout(p.weeks[w]), L = DAYS.find(d => l[d] === 'lsd_long');
    if (!L) continue;
    const t = (p.weeks[w][R.prevDay(L)] || {}).title;
    if (t === 'Posterior Chain' || t === 'Leg Strength + Mobility') heavy.push('W' + w + ' ' + t);
  }
  assert.deepEqual(heavy, []);
});

test('the three-run week lives on in multi-sport pace: with a bike, every other calendar, each three-run week free of untolerated pairs', () => {
  let three = 0;
  const dirty = [];
  for (const c of R.every(CAL64, 2)) {
    const lay = R.runLayout(R.build(R.paceMultiCfg(c.rest, 1001, 'bike')).weeks[1]), days = R.runDays(lay);
    if (days.length !== 3) continue;
    three++;
    if (R.classify(days, lay).untol) dirty.push(c.key + ' ' + R.layoutString(lay));
  }
  assert.equal(three, 15);
  assert.deepEqual(dirty, []);
});

test("on Mario's calendar a multi-sport pace week holds three runs, run_base keeps four with no INT, and the two pace aliases take four", () => {
  const ms = R.paceMultiCfg(R.MARIO_REST, 1001, 'bike');
  assert.equal(R.runDays(R.runLayout(R.build(ms).weeks[1])).length, 3);
  const rb = R.runLayout(R.build(R.paceCfg(R.MARIO_REST, 1001, 'run_base')).weeks[1]);
  assert.equal(R.runDays(rb).length, 4);
  assert.ok(!R.runDays(rb).some(d => rb[d] === 'int'), R.layoutString(rb));
  for (const g of ['run_mile_time', 'run_15_under10']) assert.equal(R.runDays(R.runLayout(R.build(R.paceCfg(R.MARIO_REST, 1001, g)).weeks[1])).length, 4, g);
});

test("run_base on Mario's calendar ends its week on the long run and carries no INT or CHI", () => {
  const lay = R.runLayout(R.build(R.paceCfg(R.MARIO_REST, 1001, 'run_base')).weeks[1]);
  const days = R.runDays(lay), L = days.find(d => lay[d] === 'lsd_long');
  assert.ok(!L || L === days[days.length - 1], R.layoutString(lay));
  assert.ok(!days.some(d => lay[d] === 'int' || lay[d] === 'chi'), R.layoutString(lay));
});

// ── the walking week (D132) ──────────────────────────────────────────────────────────────────────────────────────

test('a pace week with four cardio sessions always carries an INT and a CHI card; a walking week keeps three, a quality week four; every run card names its key', () => {
  const cals = R.every(CAL64, 8);
  const tally = {}, bad = [];
  let progs = 0;
  for (const inj of R.WALK_INJ) {
    tally[inj.k] = {};
    for (const c of cals) {
      const p = R.build(R.walkCfg(c.rest, R.WALK_SEEDS[0], inj.v));
      progs++;
      for (const r of R.runCards(p)) if (!R.cardNameAgrees(r.c)) bad.push(c.key + ' ' + inj.k + ' ' + r.c.subtype + ' key ' + (r.c.dose && r.c.dose.key));
      for (const w of R.weeksOf(p)) {
        const s = R.scanWeek(p.weeks[w]);
        tally[inj.k][s.n] = (tally[inj.k][s.n] || 0) + 1;
        if (s.n >= 4 && !(s.hasInt && s.hasChi)) bad.push(c.key + ' ' + inj.k + ' W' + w + ' ' + s.n + ' sessions');
      }
    }
  }
  assert.equal(progs, 32);
  assert.deepEqual(bad, []);
  for (const inj of R.WALK_INJ) assert.deepEqual(Object.keys(tally[inj.k]), [inj.walks ? '3' : '4'], inj.k + ' ' + JSON.stringify(tally[inj.k]));
});

test('the walking-week ceiling leaves run_half, run_base and multi-sport pace alone: the same cardio count every week, healthy or protected', () => {
  const INJ = R.WALK_INJ.filter(i => i.k !== 'shoulder/protect');
  const cals = R.every(R.calendars([3, 1]), 14);
  for (const row of R.WALK_OUT_OF_SCOPE) {
    const sig = {};
    for (const inj of INJ) sig[inj.k] = cals.map(c => { const p = R.build(R.walkCfg(c.rest, 1013, inj.v, row.types, row.goal)); return R.weeksOf(p).map(w => R.scanWeek(p.weeks[w]).n).join(''); }).join('|');
    for (const inj of INJ) assert.equal(sig[inj.k], sig.healthy, row.name + ' ' + inj.k);
  }
});

test("Mario's calendar on a protected knee: three cardio sessions and no quality card; healthy it keeps MON INT, THU CHI, FRI easy, SAT long", () => {
  const healthy = R.runLayout(R.build(R.walkCfg(R.MARIO_REST, R.MARIO_SEED, null)).weeks[1]);
  assert.equal(R.layoutString(healthy), 'mon:int thu:chi fri:lsd_easy sat:lsd_long');
  const s = R.scanWeek(R.build(R.walkCfg(R.MARIO_REST, R.MARIO_SEED, { region: 'knee', tier: 'protect' })).weeks[1]);
  assert.deepEqual(s, { n: 3, hasInt: false, hasChi: false });
});

// ── three-run pace weeks and multi-sport placement (D113a, D146) ─────────────────────────────────────────────────

test('the hand oracles: 35 three-day calendars, 7 spacer calendars, the D130 pairs, the V115 crossover, the card classes', () => {
  assert.equal(R.THREE_DAY.length, 35);
  assert.deepEqual(R.SPACER, R.SPACER_TYPED);
  const u = R.untolRuns;
  assert.equal(u([{ day: 'fri', t: 'chi' }, { day: 'sat', t: 'long' }]), 0, 'CHI on the eve of the long run is tolerated');
  assert.equal(u([{ day: 'fri', t: 'int' }, { day: 'sat', t: 'long' }]), 1, 'INT on the eve is not');
  assert.equal(u([{ day: 'sun', t: 'chi' }, { day: 'sat', t: 'long' }]), 1, 'CHI the day after the long run is not');
  assert.equal(u([{ day: 'sat', t: 'int' }, { day: 'sun', t: 'chi' }]), 1, 'Saturday and Sunday are neighbours');
  assert.equal(u([{ day: 'mon', t: 'int' }, { day: 'wed', t: 'chi' }]), 0, 'a rest day between breaks the pair');
  assert.deepEqual([6, 9, 11, 15].map(R.handCross), [4, 5, 7, 9]);
  assert.equal(R.cls({ type: 'run', subtype: 'Short Interval (SI) — 4 × 400m' }), 'int');
  assert.equal(R.cls({ type: 'run', subtype: 'Long Interval (LI) — 2 × 1 mile' }), 'chi');
  assert.equal(R.cls({ type: 'run', subtype: 'Long Slow Distance (LSD)', legLoad: true }), 'long');
  assert.equal(R.cls({ type: 'run', subtype: 'Long Slow Distance (LSD)', legLoad: false }), 'easy');
});

/** One three-day solo pace build: the spacer calendars keep one quality a week crossing INT to CHI; the rest run INT, CHI and long. */
function threeDayClaim(cal, tw, f) {
  const rest = DAYS.filter(d => !cal.includes(d));
  const p = R.build(R.mkCfg('run_pace_goal', {}, rest, f, { _raceDateCappedWeeks: tw }));
  const per = R.weeksOf(p).map(w => R.runsOf(p.weeks[w]));
  const cnt = (Rr, t) => Rr.filter(r => r.t === t).length;
  const where = cal.join('+') + ' tw ' + tw + ' ' + f;
  assert.equal(p.totalWeeks, tw, where);
  assert.equal(per.length, tw, where);
  if (R.SPACER_TYPED.includes(cal.join('+'))) {
    const cr = R.handCross(tw);
    assert.ok(per.every(Rr => Rr.length === 3 && cnt(Rr, 'int') + cnt(Rr, 'chi') === 1), where + ': three runs, one quality');
    assert.deepEqual(per.map((Rr, i) => cnt(Rr, 'int') ? i + 1 : 0).filter(Boolean), Array.from({ length: cr - 1 }, (_, i) => i + 1), where + ': INT weeks');
    assert.deepEqual(per.map((Rr, i) => cnt(Rr, 'chi') ? i + 1 : 0).filter(Boolean), Array.from({ length: tw - cr + 1 }, (_, i) => cr + i), where + ': CHI weeks');
    return 'spacer';
  }
  per.forEach((Rr, i) => assert.ok(Rr.length === 3 && cnt(Rr, 'int') === 1 && cnt(Rr, 'chi') === 1 && cnt(Rr, 'long') === 1 && R.untolRuns(Rr) === 0,
    where + ' W' + (i + 1) + ' ' + Rr.map(r => r.day + ':' + r.t).join(' ')));
  return 'spaceable';
}

test('three-run pace weeks: the 28 spaceable calendars run INT, CHI and the long run every week; the 7 spacer calendars keep one quality, INT then CHI from the crossover', () => {
  const n = { spacer: 0, spaceable: 0 };
  R.THREE_DAY.forEach((cal, i) => { n[threeDayClaim(cal, [6, 9, 11, 15][i % 4], R.FOCI[i % 3])]++; });
  assert.deepEqual(n, { spacer: 7, spaceable: 28 });
});

test('pace, solo and multi-sport: no week carries an untolerated hard run pair, and multi-sport three-run weeks are reached', () => {
  const lat = R.every(R.paceLattice113(), 30);
  let weeks = 0, three = 0;
  const bad = [];
  for (const x of lat) {
    const p = R.build(x.cfg), multi = Object.keys(x.ex).length > 0;
    for (const w of R.weeksOf(p)) {
      const Rr = R.runsOf(p.weeks[w]);
      weeks++;
      if (multi && Rr.length === 3) three++;
      if (R.untolRuns(Rr)) bad.push(JSON.stringify(x.ex) + ' rest ' + x.rest + ' W' + w);
    }
  }
  assert.equal(lat.length, 53);
  assert.deepEqual(bad, []);
  assert.ok(three > 20, three + ' multi-sport three-run weeks');
});

/** Every thirty-third config of the NRC multi-sport lattice of D146, built once. */
let NRC_SAMPLE = null;
const nrcSample = () => NRC_SAMPLE || (NRC_SAMPLE = R.every(R.nrcLattice146(), 33).map(x => Object.assign({ p: R.build(x.cfg) }, x)));

test('NRC multi-sport: no week carries an untolerated hard run pair, and the long run is the last run of its ISO week', () => {
  const lat = nrcSample();
  let longWeeks = 0;
  const pairs = [], notLast = [];
  for (const x of lat) {
    const p = x.p;
    for (const w of R.weeksOf(p)) {
      const Rr = R.runsOf(p.weeks[w]);
      if (R.untolRuns(Rr)) pairs.push(x.g + ' ' + JSON.stringify(x.ex) + ' rest ' + x.rest + ' W' + w);
      const L = Rr.find(r => r.t === 'nlong');
      if (!L) continue;
      longWeeks++;
      if (Rr.some(r => R.ISO.indexOf(r.day) > R.ISO.indexOf(L.day))) notLast.push(x.g + ' ' + JSON.stringify(x.ex) + ' rest ' + x.rest + ' W' + w);
    }
  }
  assert.equal(lat.length, 60);
  assert.deepEqual(pairs, []);
  assert.deepEqual(notLast, []);
  assert.ok(longWeeks > 500, longWeeks + ' long-run weeks');
});

const snapshot = () => JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));

test('NRC run card names are only the names in tests/snapshots/run-week-layout.json', () => {
  const names = new Set(snapshot().nrcRunNames);
  assert.ok(names.size > 10);
  const extra = new Set();
  for (const x of nrcSample()) for (const r of R.runCards(x.p)) if (!names.has(String(r.c.subtype || ''))) extra.add(r.c.subtype);
  assert.deepEqual([...extra], []);
});

test('the excluded injury modes are all reached on the pace lattice, each with multi-sport builds', () => {
  const plan = R.app().eval('injuryPlan');
  const EXC = [{}, { bike: 'bike_base' }, { swim: 'swim_base' }, { bike: 'bike_ftp', swim: 'swim_mile' }];
  const reach = {}, multi = {};
  EXC.forEach((e, j) => R.EXCL_INJ.forEach(inj => R.every(R.CALS99, 9).forEach((rest, i) => {
    const mode = (plan(R.clone(R.mkCfg('run_pace_goal', e, rest, R.FOCI[(i + j) % 3], { injury: inj }))) || {}).cardioMode || 'none';
    if (!R.EXCLUDED_MODES.includes(mode)) return;
    reach[mode] = (reach[mode] || 0) + 1;
    if (Object.keys(e).length) multi[mode] = (multi[mode] || 0) + 1;
  })));
  for (const m of R.EXCLUDED_MODES) assert.ok(reach[m] > 0 && multi[m] > 0, m + ' ' + JSON.stringify(multi));
});

test('under the excluded modes a multi-sport week keeps its unrouted day layout (tests/snapshots/run-week-layout.json); uninjured, the same week takes the chooser\'s run days', () => {
  const snap = snapshot().excludedLayouts;
  const C = R.chooser();
  for (const row of ['pace', 'nrc']) {
    const pop = R.excludedPopulation(row);
    const cells = R.every(pop.cells, 16);
    for (const cell of cells) assert.equal(R.layoutCode(R.build(cell.cfg), cell.cfg), snap[row][cell.key], row + ' ' + cell.key);
    let routed = 0;
    for (const t of R.every(pop.twins, 6)) {
      const p = R.build(t.cfg), train = R.cardioTrainDays(t.cfg), days = R.weekRunDays(p, 1, train);
      if (days.length < R.ROUTE_FROM[row]) continue;
      routed++;
      const pick = C.choose(train, days.length, t.cfg.cardioGoals.run.id, row === 'pace');
      assert.deepEqual(days, pick.idxs.map(i => train[i]), row + ' twin ' + t.key);
    }
    assert.ok(cells.length >= 10 && routed >= 2, row + ': ' + cells.length + ' cells, ' + routed + ' routed twins');
  }
});
