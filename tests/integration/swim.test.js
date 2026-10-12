'use strict';
// Swim: the swim time goal's clock, the goal sheet, the required current time, and the program sizer. Rulings:
//   D110a one rate on one clock: the weekly split gain is the program sizer's 4 / 3 / 2 s per 100 x the age scale; a goal
//         not faster than the current split holds; the repeat split is the week's split less 2 s (guide A p12); the
//         notes quote the block target, the goal met line, the default anchor line, and guide A's cap of 8;
//   D144  the 100 goal anchors on a 500 (its pace moved by the 100 gap), floored at the anchor; its copy says "this
//         week's 500 pace"; the goal sheet carries each current time to where it lives;
//   M2    a current time is required (the 500 always, the 100 on a 100 goal), and must be a real time;
//   D157  the sizer reads the same total-seconds clock as the engine: seconds typed alone count, 0:00 is absent;
//   D183  the wizard's pace line reads "<time> is <pace> per 100 <unit>."
// The record is in the handoff and tests/measure/ (v212, v218).
//
// Oracles, typed by hand (tests/support/swim.js): the wizard contract, the rate table, the hand model, guide A's worked
// example, the sentences, the sizer's hand row and the m:ss twins of every seconds-only entry. This file runs each
// claim on hand fixtures and a sample of each lattice; tests/sweeps/swim.test.js runs the lattices whole. Swimmer B's
// rebuilt program digest is the golden value in tests/snapshots/swim.json (coach's surgery print, a0f2e847ed9473d7).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, pinClock, progDigest } = require('../support/app.js');
const { matchSnapshot } = require('../support/snapshot.js');
const S = require('../support/swim.js');
const { clone } = S;

const NOON = new Date(2026, 9, 11, 12, 0, 0);
const IA = loadApp();
pinClock(IA, NOON);
const build = cfg => IA.buildProgram(clone(cfg));
const fresh = () => { const A = loadApp(); pinClock(A, NOON); return A; };

test('a swim time program equals itself built twice', () => {
  const c = S.swimCfg({ goal: 'swim_100_time', exp: 'intermediate', age: '18-35', base: 90, b500: 500, tgt: 80, unit: 'yd', seed: 76308 });
  assert.equal(progDigest(build(c)), progDigest(build(c)));
});

// ── the clock (D110a, D144) ─────────────────────────────────────────────────────────────────────────────────────────
const LAT = S.swimLattice();
const SAMPLE = LAT.filter((_, i) => i % 7 === 0);
const CK = S.clockAudit(IA, SAMPLE);

test('the sample reaches every kind of goal: faster, at or slower than current, out of reach, no current time, a 0:00 entry', () => {
  // L0
  const { R } = CK;
  assert.equal(R.builds, SAMPLE.length);
  assert.ok(R.ints >= R.builds * 3, R.ints + ' INT cards');
  for (const k of ['faster', 'slower', 'damp', 'blank', 'rawZero', 'steps', 'w1F', 'w1S']) assert.ok(R[k] > 0, k);
});

test('week 1 prints the anchor split, every split is on the hand model, and every step is within the rate', () => {
  // R1, R3a, R3b, R3c
  assert.deepEqual(CK.bad.r1, []);
  assert.deepEqual(CK.bad.r3a, []);
  assert.deepEqual(CK.bad.r3b, []);
  assert.deepEqual(CK.bad.r3c, []);
});

test('every repeat split is the printed split less 2 s, in the detail and in the Main set (guide A p12)', () => {
  // R2
  assert.deepEqual(CK.bad.r2, []);
});

test('a goal at or slower than current holds at the anchor, and every INT note says so, and no other', () => {
  // R4, N2
  assert.ok(CK.R.met > 0 && CK.R.metCards > 0);
  assert.deepEqual(CK.bad.r4, []);
  assert.deepEqual(CK.nbad.n2, []);
  assert.equal(CK.N.metNote, CK.R.met);
});

test('an out-of-reach goal\'s note names a block target that a card of the same program prints', () => {
  // N1
  assert.deepEqual(CK.nbad.n1, []);
  assert.equal(CK.N.dampNote, CK.R.damp);
});

test('with no current time every INT note opens with the default anchor line, and with one entered none says "No current"', () => {
  // N3
  assert.deepEqual(CK.nbad.n3, []);
  assert.equal(CK.N.anchorProgs, CK.R.blank);
  assert.equal(CK.N.zeroEntry, CK.R.rawZero);
});

test('no swim note says build to 10 or cap at 10, both rep notes say build to 8, and no note carries a dash', () => {
  // N4, N5
  const N = clone(CK.N), nbad = { n4: CK.nbad.n4.slice(), n5: CK.nbad.n5.slice() };
  for (const [lbl, c] of S.distanceGoals([76308])) S.auditNotes(build(c), lbl, N, nbad);
  assert.deepEqual(nbad.n4, []);
  assert.deepEqual(nbad.n5, []);
  assert.ok(N.cap8Time > 0 && N.cap8Dist > 0 && N.swimNotes > 0);
});

test('guide A p12\'s worked example: a 500 in 10:30 is a 2:06 split and a 2:04 repeat in week 1', () => {
  // R1k
  const w1 = S.intCards(build(S.swimCfg({ goal: 'swim_500_time', exp: 'intermediate', age: '18-35', base: 630, tgt: 540, unit: 'yd', seed: 76308 }))).find(x => x.w === 1);
  assert.ok(w1);
  const det = String(w1.c.detail || '');
  assert.equal((det.match(S.DET_SPLIT) || [])[1], '2:06');
  assert.equal((det.match(S.DET_REP) || [])[2], '2:04');
});

test('buildProgram leaves a swim time cfg byte-identical', () => {
  // L:691f71a2 (CP)
  const c = S.swimCfg({ goal: 'swim_500_time', exp: 'beginner', age: '18-35', base: 390, tgt: 450, unit: 'yd', seed: 76308 });
  const before = JSON.stringify(c); IA.buildProgram(c);
  assert.equal(JSON.stringify(c), before);
});

test('every distance swim INT note, alone or beside a run, is the distance note: build to 8', () => {
  // P1n
  const A = S.distanceNoteAudit(IA, S.otherGoals(['intermediate'], [76308]));
  assert.ok(A.n > 0);
  assert.deepEqual(A.bad, []);
});

// ── the 100 goal anchors on a 500 (D144) ────────────────────────────────────────────────────────────────────────────
test('a 100 goal with a 10:16 500, a 1:30 current 100 and a 1:20 goal: week 1 is 2:03 (616 / 5) with a 2:01 repeat, on the hand line', () => {
  // D1 (both rows)
  const p = build(S.goal100({ base500Mins: '10', base500Secs: '16', baseMins: '1', baseSecs: '30', targetMins: '1', targetSecs: '20' }));
  const tw = Object.keys(p.weeks).length, s = S.splitsOf(p), w1 = s.find(x => x.w === 1);
  assert.deepEqual([w1.s, w1.r], ['2:03', '2:01']);
  const E = 616 / 5, gap = 90 - 80, r = Math.min(gap / tw, 3);
  assert.ok(s.length >= 3);
  for (const x of s) assert.ok(Math.abs(S.secs(x.s) - (E - r * (x.w - 1))) <= 0.55, 'W' + x.w + ' ' + x.s);
  const byW = new Map(); s.forEach(x => { if (!byW.has(x.w)) byW.set(x.w, S.secs(x.s)); });
  const ws = [...byW.keys()].sort((a, b) => a - b);
  for (let i = 1; i < ws.length; i++) if (ws[i] === ws[i - 1] + 1) assert.ok(byW.get(ws[i - 1]) - byW.get(ws[i]) <= 3);
  assert.equal(S.handClock(E - gap), '1:53');
});

test('a 100 goal slower than the current 100 holds at 2:03 with the goal met note', () => {
  // D2
  const s = S.splitsOf(build(S.goal100({ base500Mins: '10', base500Secs: '16', baseMins: '1', baseSecs: '20', targetMins: '1', targetSecs: '30' })));
  assert.ok(s.length >= 3);
  for (const x of s) { assert.equal(x.s, '2:03'); assert.ok(x.n.indexOf(S.GOAL_MET_NOTE) >= 0); }
});

test('a 100 goal with no 500 on file starts from the 2:00 default and says so; with no 100 either it holds there', () => {
  // D3 (both rows)
  const LINE = 'No current 500yd time was entered. This split starts from the intermediate default of 2:00/100, not from your own time. ';
  const s = S.splitsOf(build(S.goal100({ baseMins: '1', baseSecs: '30', targetMins: '1', targetSecs: '20' })));
  assert.ok(s.length >= 3); assert.equal(s[0].s, '2:00');
  for (const x of s) assert.equal(x.n.indexOf(LINE), 0);
  const s2 = S.splitsOf(build(S.goal100({ targetMins: '1', targetSecs: '20' })));
  assert.ok(s2.length >= 3);
  for (const x of s2) { assert.equal(x.s, '2:00'); assert.equal(x.n.indexOf(LINE + S.GOAL_MET_NOTE), 0); }
});

test('a 100 goal\'s card says "two seconds under this week\'s 500 pace"; a 500 goal\'s keeps "goal split"; no dash', () => {
  // D6
  const all100 = LAT.filter(o => o.goal === 'swim_100_time').slice(0, 10).flatMap(o => S.intCards(build(S.swimCfg(o))).map(x => x.c));
  const all500 = LAT.filter(o => o.goal === 'swim_500_time').slice(0, 10).flatMap(o => S.intCards(build(S.swimCfg(o))).map(x => x.c));
  assert.ok(all100.length > 0 && all500.length > 0);
  const MAIN100 = /^\d+ x 100(?:yd|m) at \d+:\d\d\/100\. Two seconds under this week's 500 pace of \d+:\d\d\/100\. /;
  for (const c of all100) {
    const m = (c.segments || []).find(z => /main/i.test(z.label || ''));
    assert.ok(m && MAIN100.test(m.text || '') && !S.DASH(m.text || ''), String(m && m.text));
    assert.ok(String(c.detail).indexOf("Two seconds under this week's 500 pace of") >= 0 && !/goal split/.test(c.detail));
  }
  for (const c of all500) assert.ok(String(c.detail).indexOf("Slightly faster than this week's goal split of") >= 0 && !/500 pace/.test(c.detail));
});

test('an out-of-reach 100 goal names the goal as "0:50 for 100yd", week 5 splits 1:51 (123.2 less 4 x 3), and the note quotes it', () => {
  // D7, D8 (both rows)
  const s = S.splitsOf(build(S.goal100({ base500Mins: '10', base500Secs: '16', baseMins: '1', baseSecs: '30', targetMins: '0', targetSecs: '50' })));
  assert.ok(s.length >= 3);
  for (const x of s) {
    assert.ok(x.n.indexOf('Your full goal of 0:50 for 100yd needs more weeks than this block has.') >= 0);
    assert.ok(x.n.indexOf('The target for this block is 1:51/100.') >= 0);
  }
  assert.equal(s.find(x => x.w === 5).s, '1:51');
});

test('the 100 goal floor: a gap at or past the advanced default holds at 1:35 with a 1:33 repeat, the anchor line and the goal met note', () => {
  // FL1 (both rows)
  const LINE = 'No current 500yd time was entered. This split starts from the advanced default of 1:35/100, not from your own time. ';
  for (const [cm, cs] of [['2', '40'], ['2', '35']]) {
    const s = S.splitsOf(build(S.goal100({ baseMins: cm, baseSecs: cs, targetMins: '1', targetSecs: '0' }, 'advanced')));
    assert.ok(s.length >= 3);
    for (const x of s) { assert.deepEqual([x.s, x.r], ['1:35', '1:33']); assert.equal(x.n.indexOf(LINE + S.GOAL_MET_NOTE), 0); }
  }
});

test('a seconds-only goal (0:55, minutes box empty) builds a progression from 1:00', () => {
  // GT1
  const s = S.splitsOf(build(S.goal100({ base500Mins: '5', base500Secs: '0', baseSecs: '58', targetSecs: '55' })));
  assert.ok(s.length >= 3);
  assert.deepEqual([s[0].w, s[0].s], [1, '1:00']);
  assert.ok(S.secs(s[s.length - 1].s) < 60);
});

test('a seconds-only current 100 (0:58) is read as entered: the gap applies, no goal met note, no "No current"', () => {
  // SO1
  const c = S.swimCfg({ goal: 'swim_100_time', exp: 'intermediate', age: '18-35', b500: 300, tgt: 55, unit: 'yd', seed: 76308, raw: { baseMins: '', baseSecs: '58' } });
  const s = S.splitsOf(build(c));
  assert.equal(s.find(x => x.w === 1).s, '1:00');
  assert.ok(S.secs(s[s.length - 1].s) < 60);
  assert.ok(!s.some(x => x.n.indexOf(S.GOAL_MET_NOTE) >= 0) && !s.some(x => /No current/.test(x.n)));
});

// ── the goal sheet carries each current time to where it lives (D144) ──────────────────────────────────────────────
const SHEET = fresh();
const KEYS = ['swimUnit', 'baseMins', 'baseSecs', 'base500Mins', 'base500Secs'];
const pick = g => { const o = {}; for (const k of KEYS) if (g && g[k] !== undefined) o[k] = g[k]; return o; };
function sheetChange(prev, sel, tgt) {
  const c = S.swimCfg({ goal: 'swim_500_time', exp: 'intermediate', age: '18-35', tgt: 570, unit: 'm', seed: 76308 });
  c.cardioGoals = { swim: clone(prev) };
  const pr = SHEET.buildProgram(clone(c)); pr.id = 'p_sheet'; pr.cfg = clone(c);
  SHEET.localStorage.setItem('ia_programs', JSON.stringify([pr]));
  SHEET.eval("_goalDraft={progId:'p_sheet',sport:'swim',sel:'" + sel + "',inputs:{targetMins:'" + tgt[0] + "',targetSecs:'" + tgt[1] + "'}};");
  let err = ''; try { SHEET.eval('commitGoalChange()'); } catch (e) { err = String(e && e.message || e); }
  let saved = null; try { saved = JSON.parse(SHEET.localStorage.getItem('ia_programs'))[0].cfg; } catch (e) { /* no write */ }
  return { saved, err };
}
const B500 = { id: 'swim_500_time', label: 'Improve 500 Time', swimUnit: 'm', baseMins: '10', baseSecs: '16', targetMins: '9', targetSecs: '30' };
const C100 = { id: 'swim_100_time', label: 'Improve 100 Time', swimUnit: 'yd', baseMins: '1', baseSecs: '45', base500Mins: '9', base500Secs: '50', targetMins: '1', targetSecs: '30' };
const C100ONLY = { id: 'swim_100_time', label: 'Improve 100 Time', swimUnit: 'yd', baseMins: '1', baseSecs: '45', targetMins: '1', targetSecs: '30' };
const TRI = { id: 'swim_tri', label: 'Triathlon Swim', baselineDist: '1000', baseline: '1000m', swimUnit: 'm' };
// [case, previous goal, new goal, target, the keys the hand table carries]
const CASES = [
  ['500->500 (swimmer B)', B500, 'swim_500_time', ['9', '0'], { swimUnit: 'm', baseMins: '10', baseSecs: '16' }],
  ['500->100', B500, 'swim_100_time', ['1', '50'], { swimUnit: 'm', base500Mins: '10', base500Secs: '16' }],
  ['100->500 with a 500 time', C100, 'swim_500_time', ['9', '0'], { swimUnit: 'yd', baseMins: '9', baseSecs: '50' }],
  ['100->500 current 100 only', C100ONLY, 'swim_500_time', ['9', '0'], { swimUnit: 'yd' }],
  ['100->100', C100, 'swim_100_time', ['1', '25'], { swimUnit: 'yd', baseMins: '1', baseSecs: '45', base500Mins: '9', base500Secs: '50' }],
  ['tri->500', TRI, 'swim_500_time', ['9', '0'], { swimUnit: 'm' }],
];
const SHEET_OUT = {};
for (const [lbl, prev, sel, tgt] of CASES) SHEET_OUT[lbl] = sheetChange(prev, sel, tgt);

test('the goal sheet saves every swim goal switch, carries the pool unit, and writes exactly the hand table\'s current times', () => {
  // SH0, SH1, SH2
  for (const [lbl, prev, sel, tgt, want] of CASES) {
    const { saved, err } = SHEET_OUT[lbl], g = saved && saved.cardioGoals && saved.cardioGoals.swim;
    assert.equal(err, '', lbl);
    assert.ok(g && g.id === sel && g.targetMins === tgt[0], lbl + ' reached the save');
    assert.equal(g.swimUnit, prev.swimUnit, lbl);
    assert.deepEqual(pick(g), want, lbl);
  }
});

test('a 100 goal switched to a 500 with no 500 on file prints the no current time line', () => {
  // SH3
  const c = SHEET_OUT['100->500 current 100 only'].saved;
  const w1 = S.intCards(build(c)).find(x => x.w === 1);
  assert.equal(String(w1.c.note || '').indexOf(S.anchorLineOf('yd', 'intermediate')), 0);
});

test('swimmer B rebuilt after a sheet change to 9:00 prints 100m repeats at 2:01 on a 2:03 split, and its program matches the snapshot', () => {
  // SH4, SH5
  const p = build(SHEET_OUT['500->500 (swimmer B)'].saved), w1 = S.intCards(p).find(x => x.w === 1), d = String(w1.c.detail || '');
  assert.match(d, /x 100m at 2:01\/100/);
  assert.match(d, /goal split of 2:03\/100/);
  matchSnapshot('swim', { swimmerBRebuilt: progDigest(p) });
});

test('the goal sheet carries a seconds-only current 100, both limbs as stored', () => {
  // SO2
  const SO = [['minutes box empty', { id: 'swim_100_time', label: 'x', swimUnit: 'yd', baseMins: '', baseSecs: '58', targetMins: '0', targetSecs: '55' }, { swimUnit: 'yd', baseMins: '', baseSecs: '58' }],
    ['no minutes key', { id: 'swim_100_time', label: 'x', swimUnit: 'yd', baseSecs: '58', targetMins: '0', targetSecs: '55' }, { swimUnit: 'yd', baseSecs: '58' }]];
  for (const [lbl, prev, want] of SO) {
    const { saved } = sheetChange(prev, 'swim_100_time', ['0', '54']);
    assert.deepEqual(pick(saved.cardioGoals.swim), want, lbl);
  }
});

// ── a current time is required (M2) ─────────────────────────────────────────────────────────────────────────────────
const REAL = 'That is not a real time. Check the minutes and seconds.';
const REQ = (d, u) => 'Required. Enter your most recent timed ' + d + u + '.';
const FASTER = 'Your 500 pace is faster than your 100 time. Check both entries.';
const LINE = 'Your repeats key off your 500 pace. Your 100 time sets the goal.';

test('_swimEntryState answers the hand table: the 500 prompt first, the 100 prompt, faster than, not a real time, ok', () => {
  // M2a, M2f
  const s5 = (m, s) => ({ base500Mins: m, base500Secs: s }), s1 = (m, s) => ({ baseMins: m, baseSecs: s });
  const G5 = (u, x) => Object.assign({ id: 'swim_500_time', label: 'x', swimUnit: u, targetMins: '9', targetSecs: '0' }, x || {});
  const G1 = (u, x) => Object.assign({ id: 'swim_100_time', label: 'x', swimUnit: u, targetMins: '1', targetSecs: '20' }, x || {});
  const OK = { ok: true, blank: false, msg: '' };
  const T = [
    ['500 goal, blank, yd', G5('yd'), { ok: false, blank: true, msg: REQ(500, 'yd') }],
    ['500 goal, blank, m', G5('m'), { ok: false, blank: true, msg: REQ(500, 'm') }],
    ['500 goal, 0:00', G5('yd', s1('0', '0')), { ok: false, blank: true, msg: REQ(500, 'yd') }],
    ['100 goal, 100 entered, 500 blank', G1('m', s1('1', '30')), { ok: false, blank: true, msg: REQ(500, 'm') }],
    ['100 goal, both blank (500 rule first)', G1('yd'), { ok: false, blank: true, msg: REQ(500, 'yd') }],
    ['100 goal, 500 entered, 100 blank', G1('yd', s5('10', '0')), { ok: false, blank: true, msg: REQ(100, 'yd') }],
    ['100 goal, 500 entered, 100 0:00', G1('yd', Object.assign(s5('10', '0'), s1('0', '0'))), { ok: false, blank: true, msg: REQ(100, 'yd') }],
    ['100 goal, 500 600 s, 100 130 s', G1('yd', Object.assign(s5('10', '0'), s1('2', '10'))), { ok: false, blank: false, msg: FASTER }],
    ['100 goal, 500 616 s, 100 90 s', G1('yd', Object.assign(s5('10', '16'), s1('1', '30'))), OK],
    ['100 goal, 500 600 s, 100 120 s (equal pace)', G1('yd', Object.assign(s5('10', '0'), s1('2', '0'))), OK],
    ['100 goal, 500 350 s, 100 0:58', G1('m', Object.assign(s5('5', '50'), s1('0', '58'))), OK],
    ['500 goal, 616 s', G5('yd', s1('10', '16')), OK],
    ['swim_tri', { id: 'swim_tri', label: 'x', baselineDist: '1000', baseline: '1000m' }, OK],
    ['swim_mile', { id: 'swim_mile', label: 'x' }, OK],
    ['swim_base', { id: 'swim_base', label: 'x' }, OK],
    ['no swim goal', null, OK],
    ['500 goal, minutes "abc"', G5('yd', s1('abc', '10')), { ok: false, blank: false, msg: REAL }],
    ['500 goal, seconds 60', G5('yd', s1('10', '60')), { ok: false, blank: false, msg: REAL }],
    ['100 goal, 500 seconds 75', G1('yd', Object.assign(s5('10', '75'), s1('1', '30'))), { ok: false, blank: false, msg: REAL }],
    ['100 goal, minutes Infinity', G1('yd', Object.assign(s5('10', '0'), s1('Infinity', '0'))), { ok: false, blank: false, msg: REAL }],
    ['100 goal, seconds 61 with the 500 blank (not real ahead of blank)', G1('yd', s1('1', '61')), { ok: false, blank: false, msg: REAL }],
  ];
  assert.equal(IA.eval('typeof _swimEntryState'), 'function');
  const msgs = new Set();
  for (const [lbl, g, want] of T) {
    const got = JSON.parse(IA.eval('JSON.stringify(_swimEntryState(' + JSON.stringify(g) + '))'));
    if (got.msg) msgs.add(got.msg);
    assert.deepEqual({ ok: got.ok, blank: !!got.blank, msg: got.msg || '' }, want, lbl);
  }
  const copy = [...msgs, LINE, 'Your most recent timed 500yd', 'Your most recent timed 100m'];
  assert.ok(copy.length >= 7);
  for (const t of copy) assert.ok(!S.DASH(t), t);
});

test('doGenerate checks the swim entry before it shows the generate screen, and base500 has three write sites', () => {
  // M2b, M2c
  const src = IA.html, a = src.indexOf('function doGenerate(){'), e = a >= 0 ? src.indexOf('\n}\n', a) : -1, dg = src.slice(a, e);
  assert.ok(a >= 0 && e > a);
  const iS = dg.indexOf('_swimEntryState('), iR = dg.indexOf('if(!_sv.ok){ showToast(_sv.msg);'), iG = dg.indexOf("showScreen('screenGenerate')");
  assert.ok(iS >= 0 && iR > iS && iG > iR, [iS, iR, iG].join(' '));
  const lit = src.match(/base500(Mins|Secs)\s*=(?!=)/g) || [];
  assert.equal(lit.length, 2);
  assert.ok(lit.some(x => /Mins/.test(x)) && lit.some(x => /Secs/.test(x)));
  assert.equal(src.split("_put('base500',").length - 1, 1);
});

test('doGenerate refuses a 500 goal with no current time, saving nothing and toasting the prompt; with 10:16 it saves one program', () => {
  // M2d (both rows)
  const A = fresh();
  const gen = goal => {
    const c = S.swimCfg({ goal: 'swim_500_time', exp: 'intermediate', age: '18-35', tgt: 540, unit: 'yd', seed: 76308 });
    c.cardioGoals = { swim: goal };
    A.localStorage.setItem('ia_programs', '[]'); A.eval('WD=' + JSON.stringify(c) + ';');
    A.eval('var __toasts=[]; showToast=function(m){__toasts.push(String(m))};');
    let err = ''; try { A.eval('doGenerate()'); } catch (e) { err = String(e.message); }
    A.flushTimers(50);
    return { n: JSON.parse(A.localStorage.getItem('ia_programs') || '[]').length, toast: JSON.parse(A.eval('JSON.stringify(__toasts)')), err };
  };
  const blank = gen({ id: 'swim_500_time', label: 'x', swimUnit: 'yd', targetMins: '9', targetSecs: '0' });
  assert.deepEqual([blank.n, blank.toast[0], blank.err], [0, REQ(500, 'yd'), '']);
  const ok = gen({ id: 'swim_500_time', label: 'x', swimUnit: 'yd', targetMins: '9', targetSecs: '0', baseMins: '10', baseSecs: '16' });
  assert.deepEqual([ok.n, ok.err], [1, '']);
});

test('the swim label is "Your most recent timed <dist><unit>", and the 100 goal\'s 500 label and coach\'s line appear once', () => {
  // M2e
  const cnt = t => IA.html.split(t).length - 1;
  assert.equal(cnt("Your most recent timed ${SWIM_GOAL_DIST[g.id]}${g.swimUnit||'yd'}</div>"), 1);
  assert.equal(cnt("Your most recent timed 500${g.swimUnit||'yd'}</div>"), 1);
  assert.equal(cnt(LINE), 1);
  assert.equal(cnt('Your current ${SWIM_GOAL_DIST[g.id]}'), 0);
});

// ── the sizer reads the engine's clock (D157) ───────────────────────────────────────────────────────────────────────
const LEN = S.sizer(IA);
const lenEq = (a, b) => a.weeks === b.weeks && a.warning === b.warning;
const weeksOf = cfg => { const c = clone(cfg), before = JSON.stringify(c), p = IA.buildProgram(c); return { p, pure: JSON.stringify(c) === before }; };

test('the unit entry, 0:55 against 0:59 typed as seconds alone, sizes as its m:ss twin: "needs 7 weeks" warned, 8 weeks built', () => {
  // U1, U2
  const e = LEN(S.UNIT, 'advanced', '18-35'), t = LEN(S.UNIT_TWIN, 'advanced', '18-35');
  // by hand: gap 59 - 55 = 4 s/100; advanced 18-35 gains 2 s/100/week; ceil(4 / 2) = 2; round(2 x 1.25) + 4 = 7
  assert.ok(String(e.warning).includes('100 Time (0:55/100yd) needs 7 weeks'), e.warning);
  assert.ok(lenEq(e, t));
  const be = weeksOf(S.sizerCfg({ g: S.UNIT, exp: 'advanced', age: '18-35' })), bt = weeksOf(S.sizerCfg({ g: S.UNIT_TWIN, exp: 'advanced', age: '18-35' }));
  assert.equal(be.p.totalWeeks, bt.p.totalWeeks);
  assert.equal(JSON.stringify(be.p.weeks), JSON.stringify(bt.p.weeks));
  assert.ok(be.pure && bt.pure);
  assert.deepEqual([be.p.totalWeeks, e.weeks], [8, 8]);
});

test('every seconds-only sizer entry sizes as its m:ss twin, weeks and warning byte for byte (advanced, 18-35)', () => {
  // L1 (a sample: one experience and age; the sweep runs all nine)
  let n = 0;
  for (const goal of Object.keys(S.SIZER_TIMES)) for (const t of S.SIZER_TIMES[goal].T) for (const c of S.SIZER_TIMES[goal].C) {
    const lt = LEN(S.sizerGoal(goal, t, c, 'mss', 'mss'), 'advanced', '18-35');
    for (const tf of S.FORMS) for (const cf of S.FORMS) {
      if (tf === 'mss' && cf === 'mss') continue;
      n++;
      const le = LEN(S.sizerGoal(goal, t, c, tf, cf), 'advanced', '18-35');
      assert.ok(lenEq(le, lt), `${goal} ${t}/${c} ${tf}/${cf}: ${le.weeks} "${le.warning}" vs ${lt.weeks} "${lt.warning}"`);
    }
  }
  assert.equal(n, 8 * (63 + 42));
});

test('every seconds-only full build equals its m:ss twin, and buildProgram leaves the cfg byte-identical (a sample)', () => {
  // L2 (a sample: intermediate 18-35, one time pair per goal; the sweep runs the 192-build lattice)
  const PAIRS = { swim_100_time: [55, 59], swim_500_time: [420, 480] };
  for (const goal of Object.keys(PAIRS)) for (const mix of ['swim', 'run+swim']) {
    const [t, c] = PAIRS[goal], tw = weeksOf(S.sizerCfg({ g: S.sizerGoal(goal, t, c, 'mss', 'mss'), exp: 'intermediate', age: '18-35', mix }));
    assert.ok(tw.pure);
    for (const [tf, cf] of [['undef', 'mss'], ['mss', 'undef'], ['undef', 'undef'], ['empty', 'empty']]) {
      const e = weeksOf(S.sizerCfg({ g: S.sizerGoal(goal, t, c, tf, cf), exp: 'intermediate', age: '18-35', mix }));
      assert.ok(e.pure);
      assert.equal(e.p.totalWeeks, tw.p.totalWeeks, `${goal} ${mix} ${tf}/${cf}`);
      assert.equal(JSON.stringify(e.p.weeks), JSON.stringify(tw.p.weeks), `${goal} ${mix} ${tf}/${cf}`);
    }
  }
});

test('a 0:00 target sizes as no target (no time label), and a 0:00 current time as no current time', () => {
  // Z1
  let n = 0;
  for (const goal of ['swim_100_time', 'swim_500_time']) for (const exp of ['beginner', 'intermediate', 'advanced']) for (const age of ['18-35', '55+']) {
    const base = goal === 'swim_100_time' ? { baseMins: '1', baseSecs: '5', base500Mins: '6', base500Secs: '0' } : { baseMins: '8', baseSecs: '0' };
    const absT = Object.assign({ id: goal, label: goal, swimUnit: 'yd' }, base), la = LEN(absT, exp, age);
    for (const z of S.ZERO_TARGETS) {
      n++;
      const lz = LEN(Object.assign({}, absT, z), exp, age);
      assert.ok(lenEq(lz, la) && !/\(\d+:\d+\//.test(String(lz.warning || '')), `${goal} ${exp} ${age} target ${JSON.stringify(z)}`);
    }
    const tgt = goal === 'swim_100_time' ? { targetMins: '0', targetSecs: '55' } : { targetMins: '6', targetSecs: '30' };
    const absC = Object.assign({ id: goal, label: goal, swimUnit: 'yd' }, tgt, goal === 'swim_100_time' ? { base500Mins: '6', base500Secs: '0' } : {}), lc = LEN(absC, exp, age);
    for (const z of S.ZERO_CURRENTS) { n++; assert.ok(lenEq(LEN(Object.assign({}, absC, z), exp, age), lc), `${goal} ${exp} ${age} current ${JSON.stringify(z)}`); }
  }
  assert.equal(n, 120);
});

// ── the wizard's pace line reads the total (D157, D183) ─────────────────────────────────────────────────────────────
const WZ = S.wizardApp();
pinClock(WZ, NOON);
const WLEN = S.sizer(WZ);

test('the pace line and the step\'s first render show a seconds-only target as its m:ss twin, by hand: "<t> is <pace> per 100 <unit>."', () => {
  // LB1, LB2
  const PT = { swim_100_time: [30, 45, 55, 59, 60, 65, 75, 90, 119, 120, 150], swim_500_time: [240, 300, 330, 420, 540, 599, 600, 660, 900] };
  let twins = 0, forms = 0;
  for (const goal of Object.keys(PT)) for (const unit of ['yd', 'm']) for (const t of PT[goal]) {
    const mk = form => S.put(Object.assign({ id: goal, label: goal, swimUnit: unit }, S.LABEL_CURRENT[goal]), 'target', t, form);
    const tw = { W: S.paceLine(WZ, mk('mss')), R: S.paceLineRendered(WZ, mk('mss')) }, want = S.paceLineText(t, goal, unit);
    for (const k of ['W', 'R']) { twins++; assert.deepEqual([tw[k].disp, tw[k].txt], ['block', want], `${k} ${goal} ${unit} ${t}`); }
    twins++; assert.ok(String(WLEN(mk('mss'), 'intermediate', '18-35').warning).includes(S.warningLabel(t, goal, unit)), `sizer ${goal} ${unit} ${t}`);
    for (const form of ['undef', 'empty']) for (const k of ['W', 'R']) {
      forms++;
      const x = (k === 'W' ? S.paceLine : S.paceLineRendered)(WZ, mk(form));
      assert.deepEqual([x.disp, x.txt], [tw[k].disp, tw[k].txt], `${k} ${goal} ${unit} ${t} ${form}`);
    }
  }
  assert.deepEqual([forms, twins], [160, 120]);
});

test('odd typed targets print their total at all three sites: 01:15, 00:55, 1.5:00, 1:30.5, 1:75', () => {
  // OT1
  let n = 0;
  for (const goal of ['swim_100_time', 'swim_500_time']) for (const [m, s] of [['01', '15'], ['00', '55'], ['1.5', '0'], ['1', '30.5'], ['1', '75']]) {
    const g = Object.assign({ id: goal, label: goal, swimUnit: 'yd', targetMins: m, targetSecs: s }, S.LABEL_CURRENT[goal]);
    const total = (+m || 0) * 60 + (+s || 0), want = S.paceLineText(total, goal, 'yd');
    for (const x of [S.paceLine(WZ, g), S.paceLineRendered(WZ, g)]) { n++; assert.deepEqual([x.disp, x.txt], ['block', want], goal + ' ' + m + ':' + s); }
    n++; assert.ok(String(WLEN(g, 'intermediate', '18-35').warning).includes(S.warningLabel(total, goal, 'yd')), goal + ' ' + m + ':' + s);
  }
  assert.equal(n, 30);
});

test('a zero-total target hides the pace line and the first render, and sizes as no target with no warning', () => {
  // Z2
  let n = 0;
  for (const goal of ['swim_100_time', 'swim_500_time']) for (const unit of ['yd', 'm']) for (const z of S.ZERO_TARGETS) {
    const absent = Object.assign({ id: goal, label: goal, swimUnit: unit }, S.LABEL_CURRENT[goal]), g = Object.assign({}, absent, z);
    assert.equal(S.paceLine(WZ, g).disp, 'none');
    assert.equal(S.paceLineRendered(WZ, g).disp, 'none');
    const lz = WLEN(g, 'advanced', '18-35'), la = WLEN(absent, 'advanced', '18-35');
    assert.ok(lenEq(lz, la));
    assert.equal(lz.warning, null);
    n++;
  }
  assert.equal(n, 20);
});

// ── a stored program keeps its length (D157) ────────────────────────────────────────────────────────────────────────
test('a stored seconds-only program pinned at 7 weeks boots at 7 with every trained day as its ia_hist_ snapshot; a fresh generate sizes 8', () => {
  // ST1. The stored record is the unit entry generated today with the pin and the 7-week grid the app stored before
  // D157 (cfg._raceDateCappedWeeks 7); weeks 1, 2 and week 3's Monday and Tuesday are trained.
  const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const WD = { primaryPath: 'goal', cardioTypes: ['swim'], experience: 'advanced', ageBracket: '18-35', eventTargeted: false, liftingFocus: 'support_prevention',
    equipment: 'crossfit', restDays: ['sun', 'wed'], unit: 'lbs', seed: 76308, name: 'S', bench: 135, squat: 155, deadlift: 185, cardioGoals: { swim: clone(S.UNIT) } };
  const G = S.wizardApp(); pinClock(G, new Date(2026, 8, 7, 9, 0, 0));
  G.localStorage._map.clear(); G.eval('activeProg=null');
  G.window.__W = WD; G.eval('WD=JSON.parse(JSON.stringify(__W))');
  G.eval('doGenerate()'); G.flushTimers(Infinity);
  assert.equal(G.eval('activeProg').totalWeeks, 8, 'a fresh generate sizes 8');
  const store = new Map(G.localStorage._map), rec = JSON.parse(store.get('ia_programs'))[0];
  rec.cfg._raceDateCappedWeeks = 7;
  const p7 = G.buildProgram(clone(rec.cfg)); rec.weeks = p7.weeks; rec.totalWeeks = p7.totalWeeks;
  assert.equal(rec.totalWeeks, 7);
  store.set('ia_programs', JSON.stringify([rec]));
  const hist = {}, comp = {};
  for (const w of [1, 2, 3]) for (const d of WEEK) {
    if (w === 3 && !['mon', 'tue'].includes(d)) continue;
    const day = rec.weeks[w] && rec.weeks[w][d]; if (!day || day.rest) continue;
    hist['w' + w + '_' + d] = clone(day); comp['w' + w + '_' + d] = 'done';
  }
  store.set('ia_hist_' + rec.id, JSON.stringify(hist)); store.set('ia_comp_' + rec.id, JSON.stringify(comp));
  const B = S.wizardApp(); pinClock(B, new Date(2026, 8, 24, 9, 0, 0));
  B.localStorage._map.clear(); for (const [k, v] of store) B.localStorage._map.set(k, v);
  B.eval('activeProg=null; activeProgId=null; init()'); B.flushTimers(50);
  const p = B.eval('activeProg');
  assert.equal(p.totalWeeks, 7);
  assert.equal(JSON.parse(B.localStorage.getItem('ia_programs'))[0].totalWeeks, 7);
  assert.equal(B.eval('currentWeek'), 3, 'the clock took');
  const keys = Object.keys(hist);
  assert.ok(keys.length > 0);
  for (const k of keys) { const [w, d] = k.slice(1).split('_'); assert.equal(JSON.stringify(p.weeks[w] && p.weeks[w][d]), JSON.stringify(hist[k]), k); }
});
