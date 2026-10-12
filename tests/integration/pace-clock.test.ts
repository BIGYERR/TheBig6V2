// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// The pace clock of a pace goal (run_pace_goal): where it starts, what it walks toward, how fast, where the block
// ends, and what the interval note says about it.
//   D100 (amended): the clock anchors on the athlete's own chart row read at the distance entered, and walks toward
//     the goal entered, read once (paceGoalTarget) for both sizing and pacing.
//   D101 and D187: one planning rate, {beginner 3, intermediate 3, advanced 2} s/mi/wk scaled by age; no 12 s/mi/wk
//     ceiling, no x2.5 multiplier; PACE_IMPROVE is its one owner and no copy calls it safe.
//   E7 and E12: a goal at or slower than the athlete's own pace holds the anchor and says so.
//   D186: the block target is the last build week's pace and the taper holds it; the note drops "needs more weeks"
//     when the goal and the block target print the same clock.
//   D2b-iii: an injury pace shift appends the PACE CLOCK sentence to whichever interval note fires.
// The lattice claims run here on a sample; tests/sweeps/pace-clock.test.js runs the whole lattice.
//
// Oracles: the hand chart and rates in tests/support/pace-clock-lattices.js, the ruled sentences typed from the
// rulings, hand clocks, and date arithmetic. The pinned PRT TING row is the ruling's after-grid, re-derived by hand.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadAppAt, clone, runSessions, sessions, stripComments } from '../support/pace-clock.ts';
import { HAND, handRow, handRowPaceAt, paceGoal, prtTing, progression, anchorLatticeTests, appendixLatticeTests } from '../support/pace-clock-lattices.ts';
const IA = loadAppAt(new Date(2026, 9, 11, 12, 0, 0));
const build = (cfg) => IA.buildProgram(clone(cfg));
const clock = (s) => {
  const t = Math.round(s);
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
};
const SI = /Short Interval \(SI\)/;
const LI = /Long Interval \(LI\)/;
const MID_DASH = /\s[—–-]\s/;

anchorLatticeTests(IA, 'sample lattice (3 levels x 3 ages x mi and km, an 8:15 mile, goals 1.5 in 10:30 and 3 in 21:30)', {
  exps: ['beginner', 'intermediate', 'advanced'],
  ages: ['18-35', '36-54', '55+'],
  units: ['mi', 'km'],
  miles: [['8', '15']],
  goals: [{ targetDist: '1.5', targetMins: '10', targetSecs: '30' }, { targetDist: '3', targetMins: '21', targetSecs: '30' }],
});

test('a 6:00 mile at a 1.5 mi goal anchors at 370.73 s/mi for a beginner exactly as for an intermediate', () => {
  // The 6:00 row: mile 360, 5K 390. 360 + 30 x ln 1.5 / ln 3.107 = 360 + 30 x 0.405465 / 1.133657 = 370.73.
  for (const exp of ['beginner', 'intermediate']) {
    const cfg = paceGoal({ targetDist: '1.5', targetMins: '9', targetSecs: '00', mileBestMins: '6', mileBestSecs: '00' }, { experience: exp });
    const pp = progression(IA, build(cfg), cfg);
    assert.ok(Math.abs(pp.ip - 370.73) < 0.005, `${exp}: ${pp.ip}`);
  }
});

// ── The pinned row: PRT TING, an 8:15 mile, 1.5 mi in 10:30, intermediate, 18-35 ──
const PINNED = paceGoal({ targetDist: '1.5', targetMins: '10', targetSecs: '30', targetTime: '10:30', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' } });
// The 8:15 mile reads the chart row halfway between 8:00 and 8:30: mile 495, 5K 535. At 1.5 mi in log distance:
// 495 + 40 x ln 1.5 / ln 3.107 = 509.3064 s/mi. Intermediate rate 3 x age 1.0. The race taper is 2 weeks, so 11 weeks
// hold 9 build weeks, 8 steps (D186): realistic = 509.3064 - 3 x 8 = 485.3 (8:05/mi), held through the taper.
const PIN = {
  weeks: 11, initial: 509.3064395186472, target: 420, gain: 3, realistic: 485.3, dampened: true,
  arr: [509.3, 506.3, 503.3, 500.3, 497.3, 494.3, 491.3, 488.3, 485.3, 485.3, 485.3],
};

test('the pinned PRT TING block: 11 weeks, anchored on the 8:15 row at 1.5 mi, walking 3 s/mi a week to 8:05/mi', () => {
  const prog = build(PINNED);
  const pp = progression(IA, prog, PINNED);
  assert.equal(prog.totalWeeks, PIN.weeks, 'sized to its goal length');
  assert.ok(Math.abs(pp.ip - PIN.initial) < 1e-9, `anchor ${pp.ip}`);
  assert.ok(Math.abs(handRowPaceAt(handRow(495), 1.5) - PIN.initial) < 1e-9, 'the hand chart gives the same anchor by its own route');
  assert.equal(pp.tp, PIN.target, '10:30 over 1.5 mi is 420 s/mi');
  assert.equal(pp.gain, PIN.gain);
  assert.equal(pp.real, PIN.realistic);
  assert.equal(pp.dampened, PIN.dampened);
  assert.deepEqual(pp.arr, PIN.arr);
});

test('the pinned block prints its clock on the cards: W1 SI 8:13, W6 SI 7:58, W10 LI 8:44, W1 long slow distance 10:59', () => {
  // Week 1 SI: 509.3 less Guide A's 16 s/mi = 493.3 -> 493 (8:13). Week 6 SI: 494.3 - 16 = 478.3 -> 478 (7:58).
  // The taper week's long interval reads 524 (8:44); week 1 LSD is the anchor row's recovery, 659 (10:59).
  const CARDS = [
    { w: 1, st: SI, tgt: 493, pace: '8:13/mi' },
    { w: 6, st: SI, tgt: 478, pace: '7:58/mi' },
    { w: 10, st: LI, tgt: 524, pace: '8:44/mi' },
    { w: 1, st: /Long Slow Distance/, tgt: 659, pace: '10:59/mi' },
  ];
  const runs = runSessions(build(PINNED));
  for (const c of CARDS) {
    const hit = runs.find((r) => r.w === c.w && c.st.test(String(r.s.subtype || '')));
    assert.ok(hit, `week ${c.w} ${c.st} exists`);
    assert.equal(hit.s.dose && hit.s.dose.tgt, c.tgt, `week ${c.w} ${c.st} dose`);
    assert.ok(String(hit.s.detail).includes(c.pace), `week ${c.w} ${c.st} prints ${c.pace}`);
    assert.equal(clock(c.tgt) + '/mi', c.pace, 'the printed pace is the clock of the prescribed seconds');
  }
});

test('the pinned block\'s dampened interval note is the ruled sentence, with no safety claim and no dash', () => {
  // The rate 3, the goal 420 s/mi = 7:00, the block target 485.3 = 8:05. D187 R4 deleted "That is the safe rate ...".
  const RULED = 'SI: Pace moves 3 seconds per mile each week. Your full goal of 7:00/mi needs more weeks than this block has. The target for this block is 8:05/mi. Hit the prescribed pace precisely.';
  const damp = runSessions(build(PINNED)).filter((r) => SI.test(String(r.s.subtype || '')) && /Pace moves|Pace capped/.test(String(r.s.note || '')));
  assert.ok(damp.length > 0, 'the dampened note fires on the pinned cfg');
  for (const { w, s } of damp) {
    assert.equal(s.note, RULED, `week ${w}`);
    assert.doesNotMatch(s.note, /physiolog/i);
    assert.doesNotMatch(s.note, /—/);
    assert.doesNotMatch(s.note, MID_DASH);
  }
});

test('the chart row reader returns the mile column at one mile, converts the beginner default, holds the running maximum and both clamps', () => {
  const rowAt = (row, d) => IA.eval(`rowPaceAt(${JSON.stringify(row)}, ${d})`);
  const R495 = handRow(495);
  assert.equal(rowAt(R495, 1.0), R495.mile, 'a one mile goal reads the mile column exactly');
  const RBEG = handRow(HAND.EXP_DEFAULT.beginner);
  assert.ok(Math.abs(rowAt(RBEG, 1.5) - 706.09) < 0.01, 'the 11:30 row (690/735) read at 1.5 mi is 706.09');
  assert.ok(Math.abs(rowAt(RBEG, 1.5) - handRowPaceAt(RBEG, 1.5)) < 1e-9);
  const INVERTED = { mile: 720, fiveK: 760, tenK: 785, half: 845, marathon: 825 };
  assert.equal(rowAt(INVERTED, 26.219), 845, 'a longer distance is never a faster pace (the 12:00 row inverts)');
  assert.equal(rowAt(INVERTED, 20), 845);
  assert.equal(rowAt(R495, 0.5), R495.mile);
  assert.equal(rowAt(R495, 0.1), R495.mile);
  assert.equal(rowAt(R495, 50), R495.marathon);
  assert.equal(rowAt(R495, 26.219), R495.marathon);
  const mono = [];
  for (let d = 0.2; d <= 30; d += 0.1) {
    const a = rowAt(R495, d);
    const b = rowAt(R495, d + 0.1);
    if (b < a - 1e-9) mono.push(`${d.toFixed(1)}: ${a} -> ${b}`);
  }
  assert.deepEqual(mono, [], 'monotone non-decreasing in distance from 0.2 to 30 mi');
});

// ── D2b-iii: the PACE CLOCK appendix under an injury pace shift (sample; the sweep runs all 55 cfgs) ──
appendixLatticeTests(IA, 'sample lattice (miles 5:30 and 11:00, 1 and 3 mi, goals 10:30 and 13:00, beginner and advanced)', {
  exps: ['beginner', 'advanced'],
  miles: [['5', '30'], ['11', '00']],
  dists: ['1', '3'],
  times: [['10', '30'], ['13', '00']],
});

// ── D186: the clock ends where the block ends ──
// A second boot, its clock pinned to 2026-09-22 21:16 (week 1 is the week of Monday 2026-09-21), building through
// the wizard's own doGenerate. The race date of a dated cell is the Thursday of its week, by date arithmetic.
const GEN = loadAppAt(new Date(2026, 8, 22, 21, 16, 0));
{
  const els = new Map();
  const mk = GEN.window.document.createElement;
  GEN.window.document.getElementById = (id) => {
    if (!els.has(id)) els.set(id, Object.assign(mk('div'), { id }));
    return els.get(id);
  };
  GEN.eval('showToast = function(){};');
  // Hand back each progression array the build makes, keyed by program length; the function is never asked to grade it.
  GEN.eval('var __PPS = {}; (function(){ var o = buildRunProgressionForLength; buildRunProgressionForLength = function(){ var r = o.apply(this, arguments); var p = r && r.paceProgression; if(p) __PPS[arguments[1]] = { arr: Array.from(p), d: p._dampened, rt: p._realisticTarget, ot: p._originalTarget, met: p._goalMet }; return r; }; })();');
  GEN.__els = els;
}
const W1MON = Date.UTC(2026, 8, 21);
const raceFor = (wk) => new Date(W1MON + ((wk - 1) * 7 + 3) * 864e5).toISOString().slice(0, 10);
function generate(o) {
  GEN.eval(`WD = { primaryPath: "event", cardioTypes: ["run"], experience: ${JSON.stringify(o.exp)}, ageBracket: ${JSON.stringify(o.age)}, eventTargeted: ${o.ev}, raceDate: ${JSON.stringify(o.race || '')}, liftingFocus: "support_prevention", equipment: "crossfit", restDays: ["sun","wed"], unit: "lbs", seed: 24865, name: "M", cardioGoals: { run: ${JSON.stringify(o.run)} }, startDate: undefined }; __PPS = {};`);
  GEN.__els.clear();
  GEN.localStorage._map.clear();
  GEN.eval('activeProg = null;');
  GEN.eval('doGenerate()');
  GEN.flushTimers(Infinity);
  const p = GEN.eval('activeProg');
  assert.ok(p, 'doGenerate made a program');
  const pp = GEN.eval('__PPS')[p.totalWeeks];
  assert.ok(pp, `a progression was built for ${p.totalWeeks} weeks`);
  const tgt = new Set();
  const kinds = new Set();
  for (const { s } of runSessions(p)) {
    if (!(s.dose && s.dose.key === 'int')) continue;
    const n = String(s.note || '');
    const m = n.match(/target for this block is (\d+:\d\d)\/mi/);
    if (m) tgt.add(m[1]);
    kinds.add(/needs more weeks/.test(n) ? 'long' : /Hit the prescribed pace precisely/.test(n) ? 'short' : /already within/.test(n) ? 'met' : 'other');
  }
  return { L: p.totalWeeks, taper: (p.taperWeeks || []).length, pp, tgt: [...tgt], kinds: [...kinds] };
}
const DEF = { beginner: 690, intermediate: 570, advanced: 450 };
function cell(c) {
  const anchor = c.mile || DEF[c.exp];
  const goalPace = anchor - c.off;
  const tot = Math.round(goalPace * c.dist);
  const run = { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: String(c.dist), paceUnit: 'mi', targetMins: String(Math.floor(tot / 60)), targetSecs: String(tot % 60), targetTime: clock(tot) };
  if (c.mile) Object.assign(run, { mileBestMins: String(Math.floor(c.mile / 60)), mileBestSecs: String(c.mile % 60), mileBestSrc: { kind: 'entered' } });
  return { o: { exp: c.exp, age: c.age, ev: !!c.dt, race: c.dt ? raceFor(c.dt) : '', run }, goalPace };
}
const CELLS = [
  { lbl: 'beginner 55+, no mile, goal 11:20, 8 weeks dated', dist: 1.0, exp: 'beginner', age: '55+', mile: null, off: 10, dt: 8 },
  { lbl: 'dampened dated', dist: 3.1, exp: 'advanced', age: '55+', mile: 420, off: 100, dt: 12 },
  { lbl: 'dampened undated', dist: 3.1, exp: 'advanced', age: '55+', mile: 420, off: 100, dt: 0 },
  { lbl: 'undampened dated', dist: 1.5, exp: 'intermediate', age: '18-35', mile: 480, off: 10, dt: 8 },
  { lbl: 'undampened undated', dist: 1.5, exp: 'intermediate', age: '18-35', mile: 480, off: 10, dt: 0 },
  { lbl: 'goal met', dist: 1.5, exp: 'intermediate', age: '18-35', mile: 480, off: -20, dt: 8 },
  { lbl: 'beginner 18-35 undated', dist: 1.5, exp: 'beginner', age: '18-35', mile: null, off: 20, dt: 0 },
  { lbl: 'beginner 36-54 dated', dist: 1.5, exp: 'beginner', age: '36-54', mile: null, off: 20, dt: 8 },
  { lbl: 'intermediate 36-54 undated', dist: 1.5, exp: 'intermediate', age: '36-54', mile: 480, off: 20, dt: 0 },
  { lbl: 'intermediate 55+ dated', dist: 1.5, exp: 'intermediate', age: '55+', mile: 480, off: 20, dt: 8 },
  { lbl: 'advanced 18-35 undated', dist: 1.5, exp: 'advanced', age: '18-35', mile: 420, off: 20, dt: 0 },
  { lbl: 'advanced 36-54 dated', dist: 1.5, exp: 'advanced', age: '36-54', mile: 420, off: 20, dt: 8 },
  { lbl: '1 mi, 4 weeks dated', dist: 1.0, exp: 'intermediate', age: '18-35', mile: 480, off: 15, dt: 4 },
  { lbl: '3.1 mi, 12 weeks dated', dist: 3.1, exp: 'intermediate', age: '18-35', mile: 480, off: 15, dt: 12 },
  { lbl: '6.2 mi advanced, 8 weeks dated', dist: 6.2, exp: 'advanced', age: '18-35', mile: 420, off: 30, dt: 8 },
  { lbl: 'undampened dated advanced', dist: 1.5, exp: 'advanced', age: '18-35', mile: 420, off: 5, dt: 4 },
  { lbl: 'undampened undated 1 mi', dist: 1.0, exp: 'intermediate', age: '18-35', mile: 480, off: 3, dt: 0 },
];
let clockEnd;
const clockEndCells = () => clockEnd || (clockEnd = CELLS.map((c) => Object.assign({ c }, cell(c), { r: generate(cell(c).o) })));

test('a dated pace goal tapers max(2, round(0.12 L)) weeks and an undated one none; a goal at or slower than week 1 is met', () => {
  for (const { c, o, goalPace, r } of clockEndCells()) {
    assert.equal(r.taper, o.ev ? Math.max(2, Math.round(r.L * 0.12)) : 0, `${c.lbl}: taper weeks`);
    assert.equal(r.pp.met, r.pp.arr[0] - goalPace <= 0, `${c.lbl}: goal met`);
  }
});

test('the block target is the last build week\'s pace, the note names it, and the taper holds it', () => {
  let notMet = 0;
  for (const { c, r } of clockEndCells()) {
    if (r.pp.met) continue;
    notMet++;
    const bw = r.L - r.taper;
    const last = r.pp.arr[bw - 1];
    assert.ok(Math.abs(last - r.pp.rt) <= 0.1, `${c.lbl}: last build week ${last} vs block target ${r.pp.rt}`);
    if (r.tgt.length) assert.deepEqual(r.tgt, [clock(last)], `${c.lbl}: the note names the last build week`);
    for (const v of r.pp.arr.slice(bw)) assert.ok(Math.abs(v - last) <= 0.1, `${c.lbl}: taper week ${v} holds ${last}`);
  }
  assert.ok(notMet > 0);
});

test('an undampened block lands on the entered goal by its last build week; a met goal holds week 1 all block', () => {
  let undamped = 0;
  let met = 0;
  for (const { c, r } of clockEndCells()) {
    const bw = r.L - r.taper;
    if (r.pp.met) {
      met++;
      assert.ok(r.pp.arr.every((v) => v === r.pp.arr[0]), `${c.lbl}: ${r.pp.arr.join(' ')}`);
    } else if (!r.pp.d) {
      undamped++;
      assert.ok(Math.abs(r.pp.arr[bw - 1] - r.pp.ot) <= 0.1, `${c.lbl}: last build week ${clock(r.pp.arr[bw - 1])} vs goal ${clock(r.pp.ot)}`);
    }
  }
  assert.ok(undamped > 0 && met > 0, `both classes are reached (${undamped} undampened, ${met} met)`);
});

test('a dampened note drops "needs more weeks" exactly when the goal and the block target print the same clock', () => {
  let n = 0;
  let short = false;
  for (const { c, r } of clockEndCells()) {
    if (r.pp.met || !r.pp.d) continue;
    n++;
    const bw = r.L - r.taper;
    const same = clock(r.pp.ot) === clock(r.pp.arr[bw - 1]);
    const hasLong = r.kinds.includes('long');
    const hasShort = r.kinds.includes('short');
    if (hasShort) short = true;
    if (same) assert.ok(hasShort && !hasLong, `${c.lbl}: same clock, want the short form, got ${r.kinds}`);
    else if (hasLong || hasShort) assert.ok(hasLong && !hasShort, `${c.lbl}: different clocks, want the long form, got ${r.kinds}`);
  }
  assert.ok(n > 0 && short, `dampened cells ${n}, at least one prints the short form`);
});

test('an intermediate 55+ goal of 1.5 mi in 13:45 with no mile never prints the goal twice in the long form', () => {
  const cfg = {
    name: 'M', primaryPath: 'event', cardioTypes: ['run'], eventTargeted: false, raceDate: '', liftingFocus: 'balanced', experience: 'intermediate',
    ageBracket: '55+', equipment: 'crossfit', unit: 'lbs', restDays: ['sun', 'wed'], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    bench: 135, squat: 155, deadlift: 185, seed: 24865, startDate: '2026-09-21',
    cardioGoals: { run: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi', targetMins: '13', targetSecs: '45', targetTime: '13:45' } },
  };
  const LONG = /Your full goal of (\d+:\d\d)\/mi needs more weeks than this block has\. The target for this block is (\d+:\d\d)\/mi/;
  const notes = runSessions(GEN.buildProgram(clone(cfg))).filter((r) => r.s.dose && r.s.dose.key === 'int').map((r) => String(r.s.note || ''));
  assert.ok(notes.length > 0);
  const m = LONG.exec(notes[0]);
  assert.ok(!(m && m[1] === m[2]), `week 1 note: ${notes[0]}`);
});

// ── D187: one owner for the rate, the mile required where the clock needs it ──
const SRC = stripComments(IA.js);

test('the rate has one owner: PACE_IMPROVE is declared once, read on four lines, and the old 3/5/7 table is gone', () => {
  assert.equal((SRC.match(/\bPACE_IMPROVE\s*=\s*\{/g) || []).length, 1, 'declared once');
  assert.equal((SRC.match(/\{beginner\s*:\s*3\s*,\s*intermediate\s*:\s*5\s*,\s*advanced\s*:\s*7\s*\}/g) || []).length, 0, 'the old literal table');
  const readers = SRC.split('\n').filter((l) => /\bPACE_IMPROVE\b/.test(l) && !/\bPACE_IMPROVE\s*=\s*\{/.test(l));
  assert.equal(readers.length, 4, 'reader lines');
});

test('the rate is {beginner 3, intermediate 3, advanced 2} s/mi a week', () => {
  assert.deepEqual(JSON.parse(IA.eval('JSON.stringify(PACE_IMPROVE)')), { beginner: 3, intermediate: 3, advanced: 2 });
});

test('neither the run interval note nor the swim interval note calls a rate safe', () => {
  const run = (SRC.match(/note\s*=\s*`SI: Pace moves[^`]*`/) || SRC.match(/note\s*=\s*_sameFmt[\s\S]{0,800}?Hit the prescribed pace precisely\.`;/) || [''])[0];
  const swim = (SRC.match(/note\s*=\s*_anchorLine\s*\+\s*`INT: Split moves[^`]*`/) || [''])[0];
  assert.ok(run, 'the run note template is found');
  assert.ok(swim, 'the swim note template is found');
  assert.doesNotMatch(run, /safe rate|safely/i);
  assert.doesNotMatch(swim, /safe rate|safely/i);
});

test('a blank mile is refused on an intermediate pace goal, and only there', () => {
  const state = (g, exp) => JSON.parse(IA.eval(`JSON.stringify(_mileEntryState(${JSON.stringify(g)}, ${JSON.stringify(exp)}))`));
  const r1 = state({ id: 'run_pace_goal' }, 'intermediate');
  assert.equal(r1.ok, false);
  assert.equal(r1.blank, true);
  assert.equal(state({ id: 'run_5k' }, 'intermediate').ok, true, 'another run goal is unaffected');
  assert.equal(state({ id: 'run_pace_goal' }, 'beginner').ok, true, 'a beginner pace goal is unaffected');
});

test('every program in this file left its cfg byte-identical', () => {
  const before = JSON.stringify(PINNED);
  IA.buildProgram(PINNED);
  assert.equal(JSON.stringify(PINNED), before);
  assert.ok(sessions(build(prtTing({ cardioGoals: { run: { id: 'run_half', label: 'Half', mileBestMins: '9', mileBestSecs: '0' } } }))).length > 0);
});
