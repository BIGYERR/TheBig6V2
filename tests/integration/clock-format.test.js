'use strict';
// Every clock a run or swim card prints goes through the one carrying m:ss helper (D126), so no card ever reads :60.
// The helper alone is held by tests/unit/clock-format.test.js; this file reads the clocks off built programs: the
// tempo card, the NSW interval card (pace limb, recovery band and note), the NRC race plan, the swim interval card,
// and the wizard's seeded mile anchor (the one site that rounds inside the modulo and carries its own :60).
//
// Oracles, typed here and never asked of the app:
//   * the clock contract: round the whole number of seconds, then split at 60 (handClock).
//   * a card's printed pace is the clock of its own dose.tgt, a number the test divides itself.
//   * Guide A pp. 251-252: the 400 m interval is about 4 s faster than base pace, a flat 16 s per mile; PTG p13/p16:
//     interval recovery is 2x to 2.5x the work time, and one 400 takes pace x 400 / 1609.344 s.
//   * the NRC pace chart row at an 8:00 mile, typed from doctrine/nikerunclub5k.txt (5K 8:40, 10K 9:00, tempo 9:25,
//     half 9:30, marathon 9:45, recovery 10:30), and the steady ceiling, the midpoint of tempo and recovery.
//   * the swim progression re-derived from the cfg: 100 split = 500 yd time / 5, falling 3 s per 100 a week, never
//     past the realistic target, and the interval 2 s faster than the week's split (D110a, Guide A p12).
// The app's clock is pinned to 2026-10-11 12:00 local, the today every other program test builds on.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixtures } = require('../support/app.js');
const { loadAppAt, clone, cardioOf, sessions } = require('../support/pace-clock.js');

const IA = loadAppAt(new Date(2026, 9, 11, 12, 0, 0));
const WELL = /^-?\d+:[0-5]\d$/;
function handClock(sec) {
  const t = Math.round(sec);
  const r = t % 60;
  return (t - r) / 60 + ':' + (r < 10 ? '0' + r : String(r));
}
const secsOf = (c) => {
  const p = c.split(':');
  return +p[0] * 60 + +p[1];
};
const doseOf = (s) => s.dose || s._dose || {};

/** An undated 1.5 mi pace goal (or `dist`), intermediate, 18-35, seed 76308, from a mile anchor mm:ss. */
function paceCfg(anchorMins, anchorSecs, goalMins = '9', goalSecs = '30', dist = '1.5') {
  const c = clone(fixtures.HALF_MANNY);
  Object.assign(c, { experience: 'intermediate', seed: 76308, primaryPath: 'goal', eventTargeted: false, ageBracket: '18-35' });
  delete c.raceDate;
  c.cardioGoals = {
    run: {
      id: 'run_pace_goal', label: 'run_pace_goal', mileBestMins: String(anchorMins), mileBestSecs: String(anchorSecs),
      baselineDist: '5', baseline: '5mi', targetDist: String(dist), paceUnit: 'mi', targetMins: String(goalMins), targetSecs: String(goalSecs),
    },
  };
  return c;
}
const build = (cfg) => IA.buildProgram(clone(cfg));

test('the tempo card at week 11 prints the clock of its dose: 494.306 - 3 x 10 = 464.306, x 1.08 = 501.44 -> 8:21/mi', () => {
  // An 8:00 mile, a 1.5 mi goal of 9:30, undated: 11 weeks, 10 steps at the intermediate rate of 3 s/mi/wk from the
  // anchor 494.306 s/mi (the 8:00 row read at 1.5 mi). The tempo is the week's clock x 1.08.
  const cards = cardioOf(build(paceCfg(8, 0)), 11, 'thu');
  assert.ok(cards.length > 0, 'week 11 Thursday has a cardio session');
  assert.equal(doseOf(cards[0]).tgt, 501);
  const det = String(cards[0].detail || '');
  assert.ok(det.includes('Tempo Pace: 8:21/mi'), det.slice(0, 80));
  assert.doesNotMatch(det, /\d:60\b/);
});

test('the week 1 tempo card carries 479.52 s to 8:00/mi (a 7:24 mile x 1.08; the old idiom printed 7:60)', () => {
  // A mile of 7:24 = 444 s, a 1 mi goal of 6:00, undated. Week 1 is the anchor: 444 x 1.08 = 479.52 -> 480 -> 8:00.
  const cards = cardioOf(build(paceCfg(7, 24, '6', '00', '1')), 1, 'thu');
  assert.ok(cards.length > 0, 'week 1 Thursday has a cardio session');
  assert.equal(doseOf(cards[0]).tgt, 480);
  const det = String(cards[0].detail || '');
  assert.ok(det.includes('Tempo Pace: 8:00/mi'), det.slice(0, 80));
  assert.doesNotMatch(det, /\d:60\b/);
});

test('every tempo card over a lattice of mile anchors prints the clock of its own dose.tgt', () => {
  let checked = 0;
  const bad = [];
  for (let mins = 4; mins <= 12; mins++) {
    for (const secs of [0, 11, 23, 37, 49, 58]) {
      for (const { w, d, s } of sessions(build(paceCfg(mins, secs)))) {
        const tgt = doseOf(s).tgt;
        const det = String(s.detail || '');
        if (typeof tgt !== 'number' || !det.includes('Tempo Pace: ')) continue;
        checked++;
        const want = 'Tempo Pace: ' + handClock(tgt) + '/mi';
        if (!det.includes(want) && bad.length < 6) bad.push(`${mins}:${secs} W${w} ${d} tgt=${tgt} want "${want}"`);
      }
    }
  }
  assert.ok(checked >= 100, `the lattice produced tempo cards to check (${checked})`);
  assert.deepEqual(bad, []);
});

// The NSW interval card: `Nx400m at X/mi`, `This week's goal pace is Y/mi`, `Recovery: A to B of easy`, and a note.
const INT_LIMB = /(\d+)x400m at (\d+:\d+)\/mi/;
const INT_WEEK = /This week's goal pace is (\d+:\d+)\/mi/;
const INT_REC = /Recovery: (\d+:\d+) to (\d+:\d+) of easy/;
const INT_GOAL = /Your full goal of (\d+:\d+)\/mi/;
const INT_GAIN = 16; // Guide A 251-252: 4 s per 400 m x 4 quarters
const M_PER_MILE = 1609.344; // a unit

test('every NSW interval card prints its pace, the 16 s/mi rule, the 2x-2.5x recovery band and clean note clocks', () => {
  let cards = 0;
  let notes = 0;
  const bad = { pace: [], rule: [], recNum: [], recStr: [], note: [], frac: [] };
  const push = (k, v) => bad[k].length < 5 && bad[k].push(v);
  for (let mins = 5; mins <= 12; mins++) {
    for (const secs of [0, 17, 30, 44, 59]) {
      for (const { w, d, s } of sessions(build(paceCfg(mins, secs, 9, 30, 1.5)))) {
        const det = String(s.detail || '');
        const nte = String(s.note || '');
        const mL = det.match(INT_LIMB);
        if (!mL) continue;
        cards++;
        const dose = doseOf(s);
        const tag = `${mins}:${secs} W${w} ${d}`;
        if (mL[2] !== handClock(dose.tgt)) push('pace', `${tag} printed ${mL[2]} for tgt ${dose.tgt}`);
        const mW = det.match(INT_WEEK);
        if (mW && Math.abs(dose.tgt - (secsOf(mW[1]) - INT_GAIN)) > 1) push('rule', `${tag} week ${mW[1]} less 16 != ${dose.tgt}`);
        const lo = Math.round((dose.tgt * 400 / M_PER_MILE) * 2);
        const hi = Math.round((dose.tgt * 400 / M_PER_MILE) * 2.5);
        const rec = dose.rec || {};
        if (rec.lo !== lo || rec.hi !== hi) push('recNum', `${tag} rec ${JSON.stringify(rec)} want {lo:${lo},hi:${hi}}`);
        // The band's numbers are whole seconds today; a fraction here would make the idiom print :60 on the band.
        if (!Number.isInteger(dose.tgt) || !Number.isInteger(rec.lo) || !Number.isInteger(rec.hi)) push('frac', `${tag} ${dose.tgt} ${JSON.stringify(rec)}`);
        const mR = det.match(INT_REC);
        if (!mR || mR[1] !== handClock(lo) || mR[2] !== handClock(hi)) push('recStr', `${tag} printed ${mR ? mR[1] + ' to ' + mR[2] : 'NO BAND'}`);
        if (nte) {
          notes++;
          for (const m of nte.match(/\d+:\d+/g) || []) if (!WELL.test(m)) push('note', `${tag} note clock ${m}`);
        }
      }
    }
  }
  assert.ok(cards >= 100 && notes >= 100, `the lattice produced interval cards (${cards}) and notes (${notes})`);
  assert.deepEqual(bad, { pace: [], rule: [], recNum: [], recStr: [], note: [], frac: [] });
});

test('an interval note quotes a 2 mi goal of 13:59 (419.5 s/mi) as 7:00/mi (the old idiom printed 6:60)', () => {
  let note = '';
  for (const { s } of sessions(build(paceCfg(8, 0, 13, 59, 2)))) {
    if (INT_LIMB.test(String(s.detail || '')) && INT_GOAL.test(String(s.note || ''))) {
      note = String(s.note);
      break;
    }
  }
  assert.ok(note, 'an interval note quotes the goal');
  assert.equal(note.match(INT_GOAL)[1], '7:00');
});

test('the NRC half plan at an 8:00 mile prints exactly the chart row and its steady ceiling, and nothing else per mile', () => {
  // doctrine/nikerunclub5k.txt, the 8:00 row: 5K 8:40 = 520, 10K 9:00 = 540, tempo 9:25 = 565, half 9:30 = 570,
  // marathon 9:45 = 585, recovery 10:30 = 630. The steady ceiling is (565 + 630) / 2 = 597.5 -> 598 -> 9:58.
  const ROW = { mile: '8:00', fiveK: '8:40', tenK: '9:00', tempo: '9:25', half: '9:30', marathon: '9:45', recovery: '10:30' };
  const CEILING = '9:58';
  const c = clone(fixtures.HALF_MANNY);
  Object.assign(c, { experience: 'intermediate', seed: 76308 });
  c.cardioGoals.run.mileBestMins = '8';
  c.cardioGoals.run.mileBestSecs = '0';
  let text = '';
  for (const { s } of sessions(build(c))) text += [s.detail, s.note, s.subtype].map((x) => String(x || '')).join('\n') + '\n';
  for (const [col, clock] of Object.entries(ROW)) assert.ok(text.includes(clock + '/mi'), `the ${col} column prints as ${clock}/mi`);
  assert.ok(text.includes(CEILING + '/mi'), 'the steady ceiling prints as 9:58/mi');
  const allowed = new Set(Object.values(ROW).concat([CEILING]).map((x) => x + '/mi'));
  const stray = [...new Set(text.match(/\d+:\d+\/mi/g) || [])].filter((t) => !allowed.has(t));
  assert.deepEqual(stray, [], 'every per-mile clock on the plan is explained by the typed row');
});

test('the NRC formatter is only ever handed whole seconds (so it can never meet a :60)', () => {
  assert.equal(IA.eval('PACE_CHART.every(r => Object.keys(r).every(k => Number.isInteger(r[k])))'), true, 'PACE_CHART is typed in whole seconds');
  const frac = [];
  for (let a = 280; a <= 740; a++) {
    const row = IA.eval(`paceChartLookup("mile", ${a})`);
    for (const k of Object.keys(row)) if (!Number.isInteger(row[k]) && frac.length < 5) frac.push(`${a}.${k}=${row[k]}`);
    const cap = IA.eval(`steadyCapSec(paceChartLookup("mile", ${a}))`);
    if (!Number.isInteger(cap) && frac.length < 5) frac.push(`${a}.steadyCap=${cap}`);
  }
  assert.deepEqual(frac, [], 'every looked-up chart value and steady ceiling over 461 anchors is whole');
});

// Swim: a 500 yd time trial goal, base 10:16, goal 4:00, intermediate, 18-35, undated.
const SWIM_DIST = 500;
const SWIM_RATE = 3; // s per 100 per week (D110a: the sizer's rate, age scale 1.0)
const SWIM_TARGET = 240 / (SWIM_DIST / 100); // 48 s per 100
const swimInt = (wp) => wp - 2; // D110a, Guide A p12
function swimCfg(baseMins = '10', baseSecs = '16') {
  const c = clone(fixtures.HALF_MANNY);
  Object.assign(c, { cardioTypes: ['swim'], experience: 'intermediate', seed: 76308, ageBracket: '18-35', primaryPath: 'goal', eventTargeted: false });
  delete c.raceDate;
  c.cardioGoals = { swim: { id: 'swim_500_time', label: 'swim_500_time', swimUnit: 'yd', baseMins, baseSecs, targetMins: '4', targetSecs: '0' } };
  return c;
}
const SWIM_MAIN = /at (\d+:\d+)\/100/;
const SWIM_SPLIT = /goal split of (\d+:\d+)\/100/;
const isSwimInt = (s) => s.type === 'swim' && /Interval/.test(String(s.subtype || ''));
function firstSwimInt(prog, wk) {
  for (const d of ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']) for (const s of cardioOf(prog, wk, d)) if (isSwimInt(s)) return String(s.detail || '');
  return '';
}

test('every swim interval card prints the split re-derived from the cfg, 2 s faster than the week', () => {
  const prog = build(swimCfg());
  const tw = Object.keys(prog.weeks).length;
  const initial = 616 / (SWIM_DIST / 100); // 10:16 = 616 s over 500 yd -> 123.2 s per 100
  const realistic = initial - SWIM_RATE * tw;
  assert.ok((initial - SWIM_TARGET) / tw > SWIM_RATE, 'the weekly gain is clamped at 3 s per 100, so the hand model is the one that runs');
  let n = 0;
  const bad = [];
  for (const { w, s } of sessions(prog)) {
    if (!isSwimInt(s)) continue;
    n++;
    const wp = Math.max(realistic, initial - SWIM_RATE * (w - 1));
    const det = String(s.detail || '');
    const mM = det.match(SWIM_MAIN);
    const mS = det.match(SWIM_SPLIT);
    if (!mM || mM[1] !== handClock(swimInt(wp))) bad.push(`W${w} interval ${mM && mM[1]} want ${handClock(swimInt(wp))}`);
    if (!mS || mS[1] !== handClock(wp)) bad.push(`W${w} split ${mS && mS[1]} want ${handClock(wp)}`);
    for (const m of (det + ' ' + String(s.note || '')).match(/\d+:\d+/g) || []) if (!WELL.test(m)) bad.push(`W${w} clock ${m}`);
  }
  assert.ok(n >= 4, `the swim plan has interval cards (${n})`);
  assert.deepEqual(bad, []);
  // Week 1: 123.2 - 2 = 121.2 -> 2:01 at a 2:03 split. Week 6: 123.2 - 3 x 5 = 108.2 -> 1:48 split, 106.2 -> 1:46.
  const w1 = firstSwimInt(prog, 1);
  const w6 = firstSwimInt(prog, 6);
  assert.equal((w1.match(SWIM_MAIN) || [])[1], '2:01');
  assert.equal((w1.match(SWIM_SPLIT) || [])[1], '2:03');
  assert.equal((w6.match(SWIM_MAIN) || [])[1], '1:46');
  assert.equal((w6.match(SWIM_SPLIT) || [])[1], '1:48');
});

test('a swim base of 10:08 carries week 1 to 2:00/100 (608 / 5 - 2 = 119.6; the old idiom printed 1:60)', () => {
  const w1 = firstSwimInt(build(swimCfg('10', '8')), 1);
  assert.ok(w1, 'week 1 has a swim interval card');
  assert.equal((w1.match(SWIM_MAIN) || [])[1], '2:00');
});

// The rounding edges, read off rendered cards. Every program built here is kept for the last test.
const EDGE_BUILT = [];

test('pace: mile anchors whose week 1 tempo lands on m:59.5 or past print the carried clock', () => {
  // 333 x 1.08 = 359.64 -> 6:00; 444 x 1.08 = 479.52 -> 8:00; 611 x 1.08 = 659.88 -> 11:00 (the idiom: 5:60, 7:60, 10:60).
  // The 1 mi goal sits 84 s under the anchor.
  for (const r of [{ a: 333, tgt: 360, clock: '6:00' }, { a: 444, tgt: 480, clock: '8:00' }, { a: 611, tgt: 660, clock: '11:00' }]) {
    const gl = r.a - 84;
    const p = build(paceCfg(Math.floor(r.a / 60), r.a % 60, Math.floor(gl / 60), gl % 60, 1));
    EDGE_BUILT.push(p);
    const w1 = sessions(p).filter((x) => x.w === 1 && String(x.s.detail || '').includes('Tempo Pace: '));
    assert.ok(w1.length > 0, `anchor ${r.a}: week 1 has a tempo card`);
    for (const { s } of w1) {
      assert.ok(String(s.detail).includes('Tempo Pace: ' + r.clock + '/mi'), `anchor ${r.a}: ${String(s.detail).slice(0, 50)}`);
      assert.equal(doseOf(s).tgt, r.tgt);
    }
  }
});

test('interval notes quote an odd 2 mi goal time (x.5 s/mi) as the carried clock', () => {
  // t / 2 by hand: 359.5 -> 6:00; 419.5 -> 7:00; 420.5 -> 7:01; 450.5 -> 7:31; 479.5 -> 8:00; 539.5 -> 9:00; 599.5 -> 10:00.
  // The anchor a is the goal pace plus 60 s.
  const CASES = [
    { t: 719, a: 420, clock: '6:00' }, { t: 839, a: 480, clock: '7:00' }, { t: 841, a: 481, clock: '7:01' }, { t: 901, a: 511, clock: '7:31' },
    { t: 959, a: 540, clock: '8:00' }, { t: 1079, a: 600, clock: '9:00' }, { t: 1199, a: 660, clock: '10:00' },
  ];
  for (const r of CASES) {
    const p = build(paceCfg(Math.floor(r.a / 60), r.a % 60, Math.floor(r.t / 60), r.t % 60, 2));
    EDGE_BUILT.push(p);
    const quoted = sessions(p).map((x) => (String(x.s.note || '').match(INT_GOAL) || [])[1]).filter(Boolean);
    assert.ok(quoted.length > 0, `goal ${r.t} s: some note quotes it`);
    assert.deepEqual([...new Set(quoted)], [r.clock], `goal ${r.t} s over 2 mi`);
  }
});

test('swim bases whose week 1 interval lands on m:59.6 or m:59.8 print the carried clock on every interval card', () => {
  // 608/5 = 121.6, 609/5 = 121.8, 908/5 = 181.6, 909/5 = 181.8 s per 100. Week 1 interval (minus 2): 119.6 and 119.8 ->
  // 2:00; 179.6 and 179.8 -> 3:00 (the idiom: 1:60, 2:60). The week 1 split is the base itself: 2:02 and 3:02.
  for (const r of [{ b: 608, w1: '2:00', split: '2:02' }, { b: 609, w1: '2:00', split: '2:02' }, { b: 908, w1: '3:00', split: '3:02' }, { b: 909, w1: '3:00', split: '3:02' }]) {
    const p = build(swimCfg(String(Math.floor(r.b / 60)), String(r.b % 60)));
    EDGE_BUILT.push(p);
    const tw = Object.keys(p.weeks).length;
    const init = r.b / (SWIM_DIST / 100);
    const real = init - SWIM_RATE * tw;
    assert.ok((init - SWIM_TARGET) / tw > SWIM_RATE, `base ${r.b}: the weekly gain is clamped`);
    const w1 = firstSwimInt(p, 1);
    assert.equal((w1.match(SWIM_MAIN) || [])[1], r.w1, `base ${r.b}: week 1 interval`);
    assert.equal((w1.match(SWIM_SPLIT) || [])[1], r.split, `base ${r.b}: week 1 split`);
    let n = 0;
    for (const { w, s } of sessions(p)) {
      if (!isSwimInt(s)) continue;
      n++;
      const wp = Math.max(real, init - SWIM_RATE * (w - 1));
      const det = String(s.detail || '');
      assert.equal((det.match(SWIM_MAIN) || [])[1], handClock(swimInt(wp)), `base ${r.b} W${w} interval`);
      assert.equal((det.match(SWIM_SPLIT) || [])[1], handClock(wp), `base ${r.b} W${w} split`);
    }
    assert.ok(n >= 4, `base ${r.b}: ${n} interval cards`);
  }
});

test('the wizard seeds a mile from logged runs as carried minutes and seconds', () => {
  // mileSec -> minutes, seconds by hand: 59.5 -> 1:0; 419.6 -> 7:0; 450.4 -> 7:30; 479.4 -> 7:59; 479.5 -> 8:0;
  // 3599.5 -> 60:0. The site floors the minutes off the raw value, rounds the remainder and carries its own 60.
  const SEED = [[59.5, '1', '0'], [419.6, '7', '0'], [450.4, '7', '30'], [479.4, '7', '59'], [479.5, '8', '0'], [3599.5, '60', '0']];
  IA.eval('var __wdSaved = { cg: WD.cardioGoals, seed: WD._seed, ap: WD._seedApplied };');
  try {
    for (const [ms, wm, ws] of SEED) {
      IA.eval(`WD.cardioGoals = { run: {} }; WD._seed = { mileSec: ${ms} };`);
      try {
        IA.eval('applySeedData()');
      } catch {
        // the wizard re-render after the write is DOM work the harness does not carry; the fields are written first
      }
      const g = JSON.parse(IA.eval('JSON.stringify(WD.cardioGoals.run)'));
      assert.equal(g.mileBestMins + ':' + g.mileBestSecs, wm + ':' + ws, `seeded mile ${ms} s`);
    }
  } finally {
    IA.eval('WD.cardioGoals = __wdSaved.cg; WD._seed = __wdSaved.seed; WD._seedApplied = __wdSaved.ap;');
  }
});

test('no clock on any card of the edge programs has a seconds field of 60 or more', () => {
  assert.ok(EDGE_BUILT.length >= 14, `the edge tests built their programs first (${EDGE_BUILT.length})`);
  let clocks = 0;
  const sixty = [];
  for (const p of EDGE_BUILT) {
    for (const { w, d, s } of sessions(p)) {
      for (const f of ['detail', 'note', 'subtype', 'label']) {
        for (const m of String(s[f] || '').match(/\d+:\d+/g) || []) {
          clocks++;
          if (+m.split(':')[1] >= 60) sixty.push(`W${w} ${d} ${f} ${m}`);
        }
      }
    }
  }
  assert.ok(clocks >= 300, `clocks read (${clocks})`);
  assert.deepEqual(sixty, []);
});

test('building a program leaves its cfg byte-identical', () => {
  const before = JSON.stringify(fixtures.HALF_MANNY);
  IA.buildProgram(fixtures.HALF_MANNY);
  assert.equal(JSON.stringify(fixtures.HALF_MANNY), before);
});
