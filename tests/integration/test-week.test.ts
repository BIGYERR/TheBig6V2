// The test week of a dated NSW test goal: the program ends on the week that holds the test, the trial sits on the test
// day, the taper lands in front of it, and the days before it are a shakeout and rest. Rulings: D106a (a dated test
// goal ends on its test week; slice A the taper window, slice B the test week, slice E the trial taken from the
// week's hardest run, the V208 fix-forward at T-1 and T-2), D113a (the three-run and spacer weeks it reads) and D158
// (a training-day eve carries a shakeout at the week's easy distance; the protect-park injury modes are skipped).
// The record is in the handoff and tests/measure/v207_rulings/ to v214_rulings/.
//
// This file runs each claim on hand fixtures and a sample of each lattice (every fifth to eleventh cell, so every axis
// stays in play); tests/sweeps/test-week.test.js runs every lattice whole.
//
// Oracles, typed by hand: Monday week arithmetic on a calendar (tests/support/test-week.js, the hand calendar); the
// long run series for test weeks 1 to 8 (B = 2.5 mi, the intermediate pace goal's long run start; +max(0.5 mi, 10%)
// a week; a taper window of max(2, round(0.12 x weeks)) weeks stepping the peak by x 0.8667 and x 0.7333); coach's
// trial card text (11:00 over 1.5 mi is 440 s/mi, a 7:20 mile by hand); the week's easy distance read off the same cfg
// built without the test pin (the pre-pin week, which the pin post-pass is the only thing to change).
process.env.TZ = 'America/New_York';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixtures, progDigest } from '../support/app.ts';
import * as X from '../support/test-week.ts';
import type { Section } from '@ia/core';
const { ISO7, clone, canon, cards, runOf, isTrial, isEasy, isLong, quality, isQualityRun, isHardRun, trials, prtTing, build } = X;

const IA = X.engine('2026-09-21');
const SEEN: X.Prog[] = [];   // every program this file builds, for the card name test
const B = (cfg: X.TestCfg): X.Prog => { const p = build(IA, cfg); SEEN.push(p); return p; };
const SNAP = path.join(__dirname, '..', 'snapshots', 'test-week.json');

test('a dated test program equals itself built twice, so the comparisons below compare programs, not runs', () => {
  // The seed is pinned in every cfg and the clock in the app; progDigest strips the clock fields.
  for (const cfg of [prtTing({ _raceDateCappedWeeks: 5, _testWeek: 5 }), X.datedTest({ mix: 'run+bike', rest: ['sun', 'wed'], tw: 3, wd: 5 })]) {
    assert.equal(progDigest(IA.buildProgram(clone(cfg))), progDigest(IA.buildProgram(clone(cfg))));
  }
});

// ── the test week index ──────────────────────────────────────────────────────────────────────────────────────────
test('the test week is counted in Monday weeks from the start, across both daylight saving changes', () => {
  // Z0: the DST rows below are live only if this process observes DST.
  assert.notEqual(new Date(2026, 2, 2).getTimezoneOffset(), new Date(2026, 2, 9).getTimezoneOffset(), 'America/New_York observes 2026-03-08');
  const twi = IA.eval('testWeekIndex');
  const HAND: [string, string, number | null][] = [
    ['2026-09-21', '2026-10-19', 5],      // H1 a Monday test four weeks after a Monday start
    ['2026-09-21', '2026-10-18', 4],      // H2 the Sunday before that Monday
    ['2026-09-21', '2026-09-24', 1],      // H3 a Thursday test in the start week
    ['2026-09-21', '2026-09-18', null],   // H4 a test before the start
    ['2026-09-23', '2026-09-21', null],   // H5 the same Monday week, but the test precedes a Wednesday start
    ['2026-09-23', '2026-10-19', 5],      // H6 a partial week 1: Monday arithmetic, not 26 days / 7
    ['2026-10-05', '2026-11-02', 5],      // H7 the US fall-back, 2026-11-01, inside the span
    ['2026-03-02', '2026-03-09', 2],      // H8 the US spring-forward, 2026-03-08, inside the span (a 6 day 23 hour week)
    ['2026-09-21', 'soon', null],         // H9 an unreadable test date
  ];
  for (const [s, t, want] of HAND) {
    if (t !== 'soon') assert.equal(X.handWeek(s, t), want, `hand calendar ${s} to ${t}`);
    assert.equal(twi(s, t), want, `testWeekIndex(${s}, ${t})`);
  }
});

// ── PRT TING, the taper and the long run (D106a slice A) ─────────────────────────────────────────────────────────
const longOf = (p: X.Prog, w: number): number | null => { const ds = ISO7.flatMap(d => cards(p.weeks[w] && p.weeks[w][d])).filter(X.isLSD).map(c => parseFloat(String(c.detail || ''))); return ds.length ? Math.max(...ds) : null; };
const taperSet = (p: X.Prog): number[] => { const s = []; for (let w = 1; w <= p.totalWeeks; w++) if (ISO7.some(d => cards(p.weeks[w][d]).some(c => /Taper/.test(String(c.subtype || ''))))) s.push(w); return s; };

test('PRT TING pinned to its week 5 test builds 5 weeks, the same goal undated builds 11, and weeks 1 to 3 carry the same cardio', () => {
  // F1, F3
  const p5 = B(prtTing({ _raceDateCappedWeeks: 5, _testWeek: 5 })), p0 = B(prtTing());
  assert.equal(p5.totalWeeks, 5);
  assert.equal(p5.weeks[6], undefined);
  assert.equal(p0.totalWeeks, 11, 'the goal length');
  const sig = (p: X.Prog, w: number) => JSON.stringify(ISO7.map(d => cards((p.weeks[w] || {})[d]).map(c => [c.subtype, c.dose])));
  for (const w of [1, 2, 3]) assert.equal(sig(p5, w), sig(p0, w), 'week ' + w);
});

test('PRT TING with the length pin alone prints the taper on weeks 4 and 5', () => {
  // F2: the length pin only; with the test pin as well, week 5 is the test week (the next tests).
  assert.deepEqual(taperSet(B(prtTing({ _raceDateCappedWeeks: 5 }))), [4, 5]);
});

const LONG_HAND: Record<number, number[]> = { 1: [2.2], 2: [2.2, 1.8], 3: [3, 2.6, 2.2], 4: [3, 3.5, 3.0, 2.6], 5: [3, 3.5, 4, 3.5, 2.9],
  6: [3, 3.5, 4, 4.5, 3.9, 3.3], 7: [3, 3.5, 4, 4.5, 5, 4.3, 3.7], 8: [3, 3.5, 4, 4.5, 5, 5.5, 4.8, 4.0] };
const LONG_START = 2.5;
for (let tw = 1; tw <= 8; tw++) {
  test(`a test block of ${tw} week${tw === 1 ? '' : 's'}: the long run follows the hand series, and the taper is the last ${tw === 1 ? 'week' : 'two weeks'}, where it dips`, () => {
    // T<tw>a, T<tw>b, T<tw>c, T<tw>f (the length pin only)
    const p = B(prtTing({ _raceDateCappedWeeks: tw }));
    assert.equal(p.totalWeeks, tw);
    const L: number[] = []; for (let w = 1; w <= tw; w++) L.push(longOf(p, w)!);
    assert.deepEqual(L, LONG_HAND[tw], 'the long run read off the cards');
    const win: number[] = []; for (let w = Math.max(1, tw - 1); w <= tw; w++) win.push(w);
    assert.deepEqual(taperSet(p), win, 'the Taper-labelled weeks are the hand window');
    const dips: number[] = []; let hi = LONG_START;
    L.forEach((v, i) => { if (v < hi) dips.push(i + 1); if (v > hi) hi = v; });
    assert.deepEqual(dips, win, 'the weeks whose long run dips below every earlier week (and the start) are the window');
    const bad = [];
    for (let w = 1; w <= tw; w++) for (const c of ISO7.flatMap(d => cards(p.weeks[w][d]))) if (/Infinity|NaN/.test(String(c.detail || '') + JSON.stringify(c.dose || {}))) bad.push('W' + w + ' ' + c.subtype);
    assert.deepEqual(bad, [], 'every card is finite');
    if (tw <= 2) assert.ok(L.every(v => Number.isFinite(v) && v < LONG_START), 'with no build weeks every long run sits below the start');
  });
}

// ── the test week (D106a slice B) ────────────────────────────────────────────────────────────────────────────────
const TRIAL_DETAIL = '1.5 mi. Goal 11:00 (7:20/mi).';
const TRIAL_NOTE = 'TEST DAY: Run it like the real thing. Warm up fully. Log your time. It anchors your next block.';
const tpin = (over?: X.TestCfg) => prtTing(Object.assign({ _raceDateCappedWeeks: 5, _testWeek: 5 }, over || {}));
const runCells = (p: X.Prog, w: number) => ISO7.filter(d => { const x = p.weeks[w][d]; return x && !x.rest && x.cardio && x.cardio.type === 'run'; });
const notRest = (p: X.Prog, w: number, days: string[]) => days.filter(d => !(p.weeks[w][d] && p.weeks[w][d].rest));

test('a Monday test: week 5 carries one run, the time trial on Monday, titled Test Day with no sections, and the rest of the week rests', () => {
  // D1, D2
  const p = B(tpin()), m = p.weeks[5].mon, mc = m.cardio;
  assert.deepEqual(runCells(p, 5), ['mon']);
  assert.ok(isTrial(mc), mc && mc.subtype);
  assert.equal(mc.dose.k, 'dist');
  assert.equal(mc.dose.mi, 1.5);
  assert.equal((m.sections || []).length, 0);
  assert.equal(m.title, 'Test Day');
  assert.deepEqual(notRest(p, 5, ['tue', 'wed', 'thu', 'fri', 'sat', 'sun']), []);
});

test('two days before a Monday test is a Shakeout with no sections, and three days before keeps its Primer', () => {
  // D3
  const p = B(tpin()), sat = p.weeks[4].sat, fri = p.weeks[4].fri;
  assert.equal(sat.title, 'Shakeout');
  assert.equal((sat.sections || []).length, 0);
  assert.ok((fri.sections || []).some((s: Section) => /^Primer/.test(s.label || '')), JSON.stringify((fri.sections || []).map((s: Section) => s.label)));
});

test("the trial card prints coach's text exactly, with no dash in either string", () => {
  // D4
  const mc = B(tpin()).weeks[5].mon.cardio;
  assert.equal(mc.detail, TRIAL_DETAIL);
  assert.equal(mc.note, TRIAL_NOTE);
  assert.doesNotMatch(mc.detail + mc.note, /[-‐-―]/);
});

const TEST_DAY: Record<string, X.Prog> = {};
for (const [date, day, name] of [['2026-10-20', 'tue', 'Tuesday'], ['2026-10-22', 'thu', 'Thursday'], ['2026-10-24', 'sat', 'Saturday']]) {
  test(`a ${name} test, ${date}: the only time trial in the program sits on week 5 ${name}`, () => {
    // D5a, D5b, D5c
    assert.equal(X.dayKey(date), day, 'the calendar');
    const p = TEST_DAY[day] = B(tpin({ raceDate: date }));
    assert.deepEqual(trials(p), ['W5 ' + day]);
  });
}

test('a Saturday test: the Thursday two days before holds no interval run', () => {
  // D6
  const p = TEST_DAY.sat || B(tpin({ raceDate: '2026-10-24' })), t = p.weeks[5].thu;
  assert.ok(!(t && isQualityRun(t.cardio)), t && t.cardio && t.cardio.subtype);
});

test("a Tuesday test: Monday is the Shakeout, the week's easy run at 2.3 mi, and Wednesday to Sunday rest", () => {
  // D7a, D7b, D7c. The pre-move card is W5 Friday's easy LSD of the same cfg without the test pin; 2.3 mi by the long
  // run arithmetic (easy start 1.625: 2.1, 2.6, 3.1, peak 3.1 x 0.7333 = 2.3).
  const p = TEST_DAY.tue || B(tpin({ raceDate: '2026-10-20' }));
  const pre = B(prtTing({ _raceDateCappedWeeks: 5, raceDate: '2026-10-20' })), preEasy = pre.weeks[5].fri.cardio;
  const mo = p.weeks[5].mon;
  assert.equal(mo.title, 'Shakeout');
  assert.ok(!isQualityRun(mo.cardio));
  assert.equal(mo.cardio.subtype, 'Long Slow Distance (LSD)');
  assert.equal(preEasy.subtype, 'Long Slow Distance (LSD)');
  assert.deepEqual(mo.cardio.dose, preEasy.dose);
  assert.equal(mo.cardio.dose.mi, 2.3);
  assert.deepEqual(notRest(p, 5, ['wed', 'thu', 'fri', 'sat', 'sun']), []);
});

test('a Sunday test on a three-run week: the trial takes the long interval slot, no long interval is left, an interval run sits three or more days out, nothing hard at T-1 or T-2', () => {
  // D8a (test week 1), D8b (test week 2). D113a deals the three-run week interval, long interval and long run.
  const rest = ['sun', 'tue', 'thu', 'sat'];
  for (const [tw, date] of [[1, '2026-09-27'], [2, '2026-10-04']] satisfies [number, string][]) {
    assert.equal(X.dayKey(date), 'sun');
    const p = B(prtTing({ restDays: rest, _raceDateCappedWeeks: tw, _testWeek: tw, raceDate: date }));
    const pre = B(prtTing({ restDays: rest, _raceDateCappedWeeks: tw, raceDate: date }));
    const preW = pre.weeks[tw], wk = p.weeks[tw], q = (W: Record<string, X.Day>, d: string) => (W[d] && !W[d].rest && W[d].cardio ? quality(W[d].cardio) : null);
    const preQ = ISO7.map(d => q(preW, d));
    assert.ok(preQ.includes('int') && preQ.includes('chi'), 'premise: the week dealt an interval run and a long interval');
    assert.ok(ISO7.some(d => isLong(preW[d] && preW[d].cardio)), 'premise: and a long run');
    assert.deepEqual(trials(p), ['W' + tw + ' sun']);
    assert.deepEqual(ISO7.filter(d => q(wk, d) === 'chi'), [], 'no long interval left');
    for (const d of ISO7.filter(d => q(wk, d) === 'int')) assert.ok(6 - ISO7.indexOf(d) >= 3, 'an interval run left on ' + d);
    const hard = ['fri', 'sat'].filter(d => { const x = wk[d]; return x && !x.rest && isHardRun(x.cardio); });
    assert.deepEqual(hard, [], 'T-1 and T-2');
  }
});

test('a Thursday test on a Monday, Tuesday, Wednesday spacer week: the trial takes the interval slot, no quality run is left, nothing hard at T-1 or T-2', () => {
  // D8c (test week 1), D8d (test week 2). D113a's spacer fallback deals easy, interval and long, no long interval.
  const rest = ['thu', 'fri', 'sat', 'sun'];
  for (const [tw, date] of [[1, '2026-09-24'], [2, '2026-10-01']] satisfies [number, string][]) {
    assert.equal(X.dayKey(date), 'thu');
    const p = B(prtTing({ restDays: rest, _raceDateCappedWeeks: tw, _testWeek: tw, raceDate: date }));
    const pre = B(prtTing({ restDays: rest, _raceDateCappedWeeks: tw, raceDate: date }));
    const preW = pre.weeks[tw], wk = p.weeks[tw], q = (W: Record<string, X.Day>, d: string) => (W[d] && !W[d].rest && W[d].cardio ? quality(W[d].cardio) : null);
    const preQ = ISO7.map(d => q(preW, d));
    assert.equal(preQ.filter(v => v === 'int').length, 1, 'premise: one interval run');
    assert.ok(!preQ.includes('chi'), 'premise: no long interval');
    assert.ok(ISO7.some(d => preW[d] && !preW[d].rest && isLong(preW[d].cardio)), 'premise: a long run');
    assert.deepEqual(trials(p), ['W' + tw + ' thu']);
    assert.deepEqual(ISO7.filter(d => q(wk, d)), [], 'no quality run left in the test week');
    assert.deepEqual(['tue', 'wed'].filter(d => { const x = wk[d]; return x && !x.rest && isHardRun(x.cardio); }), [], 'T-1 and T-2');
  }
});

// ── NRC keeps its race day (D106a confinement) ───────────────────────────────────────────────────────────────────
function markerDays(p: X.Prog) {
  const flat: { w: number; d: string }[] = []; [p.totalWeeks - 1, p.totalWeeks].forEach(w => { if (p.weeks[w]) ISO7.forEach(d => flat.push({ w, d })); });
  const ri = flat.findIndex(x => { const y = p.weeks[x.w][x.d]; return y && y.cardio && /RACE DAY|TIME TRIAL/i.test(y.cardio.subtype || ''); });
  return { flat, ri };
}
const NRC_BASE = Object.assign(clone(fixtures.HALF_MANNY), { restDays: ['sun'], seed: 76308 });

test('an NRC 5K time trial with no race date is still titled Race Day', () => {
  // D10
  const p = B(Object.assign({}, NRC_BASE, { cardioGoals: { run: { id: 'run_5k', label: '5K', mileBestMins: '10', mileBestSecs: '30' } }, eventTargeted: false, raceDate: '' }));
  const { flat, ri } = markerDays(p);
  assert.ok(ri >= 0, 'the plan ends on a time trial');
  const x = p.weeks[flat[ri].w][flat[ri].d];
  assert.match(x.cardio.subtype, /TIME TRIAL/);
  assert.equal(x.title, 'Race Day');
});

test('an NRC 5K with a bike goal: the bike long ride in the race eve window keeps its own title', () => {
  // D11: never Shakeout or Easy Run; the fixture must hold one.
  const p = B(Object.assign({}, NRC_BASE, { cardioTypes: ['run', 'bike'], cardioGoals: { run: { id: 'run_5k', label: '5K' }, bike: { id: 'bike_base', label: 'Bike' } }, eventTargeted: true, raceDate: '2026-11-19' }));
  const { flat, ri } = markerDays(p), eves = [];
  for (const k of [1, 2]) {
    const x = ri - k >= 0 ? flat[ri - k] : null; if (!x) continue;
    const y = p.weeks[x.w][x.d];
    if (y && !y.rest && y.cardio && y.cardio.type !== 'run' && /^long slow distance/i.test(y.cardio.subtype || '')) eves.push({ title: y.title, head: String(y.cardio.subtype).split(' — ')[0] });
  }
  assert.ok(eves.length > 0, 'the fixture holds a bike LSD at T-1 or T-2');
  for (const e of eves) assert.equal(e.title, e.head);
});

// ── the trial week across mixes (D106a slice E) ──────────────────────────────────────────────────────────────────
const TRIAL = X.trialWeek(IA, X.every(X.TRIAL_CELLS, 5));

test('a dated test goal that ends on its test week carries one time trial, on the test day, titled Test Day with no section: run only, with a bike, with a swim', () => {
  // P1, P2, P3 on a sample (every fifth of 108 cells; the sweep runs all)
  assert.ok(TRIAL.n >= 20, TRIAL.n + ' cells');
  assert.deepEqual(TRIAL.P1, []);
  assert.deepEqual(TRIAL.P2, []);
  assert.deepEqual(TRIAL.P3, []);
});

test('when the test week dealt no quality run, the trial is the long card and no long card is left', () => {
  // P4 (and its reach)
  assert.ok(TRIAL.p4reach > 0, 'the sample reaches a week with no quality run');
  assert.deepEqual(TRIAL.P4, []);
});

test('no interval run at T-1 or T-2; bike and swim cards before the test day are untouched, the eve apart, and every day after the test rests', () => {
  // P5, P6, P5z (the quality-run names read real cards: some sit at T-1 or T-2 before the pin)
  assert.ok(TRIAL.hardSeen > 0 && TRIAL.p5reach > 0, `${TRIAL.hardSeen} quality runs in the pre-pin weeks, ${TRIAL.p5reach} at T-1 or T-2`);
  assert.deepEqual(TRIAL.P5, []);
  assert.deepEqual(TRIAL.P6, []);
});

// ── T-1 and T-2 (the D106a fix-forward, D158) ────────────────────────────────────────────────────────────────────
const EVE = X.eveWeek(IA, X.every(X.EVE_CELLS, 7));

test('a long run dealt at T-1 becomes the shakeout at the week easy distance, and at T-2 the week easy run, card and all', () => {
  // Q0, Q3 on a sample (every seventh of 360 cells over both goals and three mixes)
  assert.ok(EVE.progs >= 40 && EVE.reach > 0, `${EVE.progs} programs, ${EVE.reach} reach the case`);
  assert.deepEqual(EVE.Q3, []);
});

test('no run at T-1 or T-2 carries leg load, every Shakeout is the easy run, and T-1 and T-2 carry no lift', () => {
  // Q1, Q2, Q8 on the same sample
  assert.ok(EVE.eveRuns > 0 && EVE.shk > 0 && EVE.eveDays > 0);
  assert.deepEqual(EVE.Q1, []);
  assert.deepEqual(EVE.Q2, []);
  assert.deepEqual(EVE.Q8, []);
});

test("PRT TING's stand-in, test Mon 2026-10-26: W4 Saturday is the Shakeout and carries the week's one easy run, byte for byte", () => {
  // Q4: start Mon 2026-09-28, test 28 days later (week 5); T-1 is W4 Sunday (rest), T-2 W4 Saturday, which dealt the long LSD.
  assert.equal(X.handWeek('2026-09-28', '2026-10-26'), 5);
  const cfg = X.prtTing({ name: 'M', raceDate: '2026-10-26', _testWeek: 5, _raceDateCappedWeeks: 5, startDate: '2026-09-28' });
  const p = B(cfg), pre = B(X.prePin(cfg));
  const sat = p.weeks[4].sat, c = runOf(sat), ez = ISO7.map(d => runOf(pre.weeks[4][d])).filter(isEasy);
  assert.ok(isLong(runOf(pre.weeks[4].sat)), 'premise: the pre-pin W4 Saturday is the long run');
  assert.ok(p.weeks[4].sun.rest, 'premise: W4 Sunday rests');
  assert.ok(isTrial(runOf(p.weeks[5].mon)), 'premise: the trial is W5 Monday');
  assert.equal(sat.title, 'Shakeout');
  assert.equal(ez.length, 1);
  assert.equal(canon(c), canon(ez[0]));
  assert.equal(c.legLoad, false);
  assert.doesNotMatch(c.subtype, /Taper/);
});

test('raceEveLiftPass titles the eve by its card: a long run is never a Shakeout, the easy run and an NRC recovery run are', () => {
  // Q5, on a hand-built two-week block: test Monday of week 2, the eve is W1 Sunday.
  const REP = IA.eval('raceEveLiftPass');
  const eve = (card: X.Card) => {
    const w: Record<number, Record<string, X.Day>> = { 1: {}, 2: {} };
    ISO7.forEach(d => { w[1][d] = { title: 'Rest', rest: true, tags: ['rest'] }; w[2][d] = { title: 'Rest', rest: true, tags: ['rest'] }; });
    w[2].mon = { title: 'X', tags: ['run'], sections: [], cardio: { type: 'run', subtype: '1.5 Mile Test — TIME TRIAL', goalId: 'run_pace_goal', legLoad: true } };
    w[1].sun = { title: 'Pull', tags: ['run', 'lift'], sections: [{ label: 'Main — Pull', items: [{ name: 'Row', detail: '3×8' }] }], cardio: card };
    REP(w, 2);
    return w[1].sun;
  };
  const long = eve({ type: 'run', subtype: 'Long Slow Distance (LSD) — Taper', goalId: 'run_pace_goal', legLoad: true });
  assert.notEqual(long.title, 'Shakeout');
  assert.equal((long.sections || []).length, 0);
  assert.equal(eve({ type: 'run', subtype: 'Long Slow Distance (LSD)', goalId: 'run_pace_goal', legLoad: false }).title, 'Shakeout');
  assert.equal(eve({ type: 'run', subtype: 'Recovery Run — 20 min', goalId: 'run_half', legLoad: false }).title, 'Shakeout');
});

const B4 = X.b4Week(IA, X.every(X.B4_CELLS, 11));

test('wherever the week dealt a quality run two days before the test, that day now carries nothing hard', () => {
  // Q9 on a sample (every eleventh of 504 cells; the sweep runs all)
  assert.ok(B4.n >= 30 && B4.reach > 0, `${B4.n} programs, ${B4.reach} with a quality run at T-2 before the pin`);
  assert.deepEqual(B4.bad, []);
});

test('training Monday, Tuesday, Saturday, Sunday with a Thursday test in week 1: Tuesday held a quality run and now carries one card, the easy run', () => {
  // Q9x
  const cfg = X.datedTest({ mix: 'run', rest: ['wed', 'thu', 'fri'], tw: 1, wd: 3 });
  assert.equal(X.dayKey(cfg.raceDate), 'thu');
  const p = B(cfg), pre = B(X.prePin(cfg)), cs = cards(p.weeks[1].tue);
  assert.ok(cards(pre.weeks[1].tue).some(isQualityRun), 'premise: a quality run before the pin');
  assert.equal(cs.length, 1);
  assert.ok(isEasy(cs[0]) && !isHardRun(cs[0]), cs[0] && cs[0].subtype);
});

// ── the eve shakeout (D158) ──────────────────────────────────────────────────────────────────────────────────────
const SHK = X.eveShakeout(IA, X.every(X.SHAKEOUT_CELLS, 11));

test('every training-day eve carries the shakeout and nothing else: one easy run, distance keyed easy, titled Shakeout, no lift', () => {
  // D0 (every cell builds, and the sample reaches eves of each kind), D1
  assert.ok(SHK.n >= 60, SHK.n + ' cells');
  assert.ok(SHK.te > 0 && SHK.re > 0 && SHK.tePrev > 0, JSON.stringify({ te: SHK.te, re: SHK.re, tePrev: SHK.tePrev }));
  for (const k of ['bike', 'swim', 'run', 'lift'] as const) assert.ok(SHK.pre[k] > 0, 'the pre-pin eve held ' + k + ': ' + JSON.stringify(SHK.pre));
  assert.deepEqual(SHK.D1, []);
});

test("the shakeout's distance is the week's easy distance, read off the other days of the week before the pin", () => {
  // D2, D2v (the oracle reaches at least half the eves)
  assert.ok(SHK.d2reach * 2 >= SHK.te, `${SHK.d2reach} of ${SHK.te}`);
  assert.deepEqual(SHK.D2, []);
});

test('every rest-day eve rests, and the days before the test hold nothing hard and one trial, on the test day', () => {
  // D3, D4
  assert.deepEqual(SHK.D3, []);
  assert.deepEqual(SHK.D4, []);
});

test('under the protect-park injury modes a training-day eve keeps the cards, lift and rest it had before the shakeout ruling (tests/snapshots/test-week.json)', () => {
  // D8 on a sample (every eleventh of 672 cells); the sweep runs all and owns the snapshot.
  const { sigs, reach } = X.protectParkEves(IA, X.every(X.PARK_CELLS, 11));
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8')).protectParkEves;
  assert.ok(Object.keys(sigs).length >= 10 && Object.keys(reach).length >= 3, JSON.stringify(reach));
  for (const [k, v] of Object.entries(sigs)) assert.equal(v, snap[k], k);
});

// ── the names on the cards ───────────────────────────────────────────────────────────────────────────────────────
test("every run card names the same quality session in its NSW name and its dose key", () => {
  // E1: Short Interval (SI) is key int, Long Interval (LI) is key chi, on every run card this file built.
  let n = 0; const bad = [];
  for (const p of SEEN) for (const w of Object.keys(p.weeks)) for (const d of ISO7) for (const c of cards(p.weeks[w][d])) {
    if (c.type !== 'run') continue;
    n++;
    const byKey = c.dose && c.dose.key === 'int' ? 'int' : c.dose && c.dose.key === 'chi' ? 'chi' : null;
    if (byKey !== quality(c)) bad.push(c.subtype + ' key ' + (c.dose && c.dose.key));
  }
  assert.ok(n > 100, n + ' run cards');
  assert.ok(SEEN.some(p => (Object.values(p.weeks) as Record<string, X.Day>[]).some((wk) => ISO7.some(d => isQualityRun(wk[d] && wk[d].cardio)))), 'some card is a quality run');
  assert.deepEqual(bad, []);
});
