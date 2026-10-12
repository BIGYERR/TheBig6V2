// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// Cardio sessions: the NSW run, bike and swim session builders read their doses from the guides. Rulings:
//   D111, D112 the Short Interval (SI) follows guide A (16 s/mi under the week's goal pace, recovery 2 to 2.5 x the work,
//        build 4 to 8 repeats), guide B fills A's silence (the warm-up); D9 the generic SI note states A's cap of 8;
//   D114 the SI reps read Table 6's INT column by calendar week, capped at 8; D113a, D122 the SI card count per week;
//   D128 the Long Interval (LI) minutes and pieces come from Table 6's CHI column, the bike keeps its V115 ramp, the swim
//        takes the rep tier only; D135 the bike keeps its own INT reader too;
//   D137 run_base's Steady Aerobic Run holds Table 6's last single-piece row (20 min) from week 13;
//   D109 no mid-sentence dash in anything the four cardio builders print; D126 a clock never prints ":60".
// The record is in the handoff and tests/measure/ (v202 to v208).
//
// Oracles, typed by hand (tests/support/cardio-sessions.js): Table 6 transcribed from guide B, re-read from the doctrine
// text when it is present (it is gitignored, so those tests skip by name without it); guide A's 4 s per 400 m, the
// recovery multipliers and the cap of 8; the cutback, taper and V115 arithmetic; the ruled sentences. This file runs
// each claim on hand fixtures and a sample of the pace lattice; tests/sweeps/cardio-sessions.test.js runs the lattice whole.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, pinClock, appScript, fixtures, progDigest } from '../support/app.ts';
import * as X from '../support/cardio-sessions.ts';
const { clone, DAYS } = X;

const IA = loadApp();
pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));
const J = v => JSON.parse(JSON.stringify(v));
const call = (fn, ...args) => J(IA.eval(fn)(...args));
const build = cfg => IA.buildProgram(clone(cfg));
const SRC = appScript();
const SRC_NC = SRC.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const count = (s, t) => s.split(t).length - 1;

test('a seeded program equals itself built twice: pace, run_base, swim and bike', () => {
  for (const cfg of [X.PINNED(), X.runBase55(fixtures.HALF_MANNY, true), X.swimMile(), X.bikeGoal('bike_50', 40)]) {
    assert.equal(progDigest(build(cfg)), progDigest(build(cfg)), cfg.name);
  }
});

// ── the doctrine text ────────────────────────────────────────────────────────────────────────────────────────────────
test('guide A still says what the interval rules are typed from', { skip: X.needsDoctrine(X.GUIDE_A, X.GUIDE_A_TABLES, X.GUIDE_B) }, () => {
  // A0, A0b, A0c, A0d
  const a = X.doctrineText(X.GUIDE_A), t = X.doctrineText(X.GUIDE_A_TABLES), b = X.doctrineText(X.GUIDE_B);
  assert.ok(a.indexOf('400m interval pace should be about 4 seconds') >= 0, 'A 251-252: 4 s per 400 m');
  assert.ok(a.indexOf('completing 8 intervals') >= 0, 'A 259-263: build toward 8 intervals');
  assert.equal((t.match(/Recovery period: 2-2\.5 x the work time/g) || []).length, 2, 'both hand-transcribed table headers');
  assert.ok(b.indexOf('warm up for 10-15 minutes or more') >= 0 && b.indexOf('4-5 high-intensity bursts lasting from 15 to 30 seconds') >= 0,
    'guide B p8 warm-up');
});

test('the Table 6 hand transcription reproduces all 26 rows of guide B, both columns, and its tail rule', { skip: X.needsDoctrine(X.GUIDE_B) }, () => {
  // chi T2b, T2b2; int T2b, T2c; steady S2a, S2b
  const T = X.table6FromText(X.doctrineText(X.GUIDE_B));
  for (let w = 1; w <= 26; w++) {
    assert.deepEqual(T.chi[w], X.t6Chi(w), 'CHI week ' + w);
    assert.equal(T.int[w], X.t6IntRaw(w), 'INT week ' + w);
  }
  assert.equal(T.int.length, 27, 'the INT column yields 26 rows');
  assert.ok(T.tail, 'the ">26: do not increase" line');
  // the single-piece rows end at 12: the first "2 x" row is 13
  assert.deepEqual(T.chiRaw.slice(1, 13).map(c => +c), [15, 15, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20]);
  assert.equal(T.chiRaw.findIndex((c, i) => i >= 1 && /^2\s*x\s*\d+$/.test(c)), 13);
});

// ── Table 6, the CHI column (D128) ──────────────────────────────────────────────────────────────────────────────────
test('the CHI table reader and the per-sport readers exist, and the stored column is 26 rows', () => {
  // T1a, T1b, T1c
  assert.equal(IA.eval('typeof chiFromTable6'), 'function');
  assert.equal(IA.eval("typeof getCHIBike === 'function' && typeof getCHISwim === 'function'"), true);
  const raw = J(IA.eval('NSW_TABLE6_CHI'));
  assert.equal(raw.length, 27);
  assert.equal(raw[0], null);
});

test('chiFromTable6 returns the hand transcription for weeks 1 to 26 and row 26 past it', () => {
  // T2, T3
  for (let w = 1; w <= 26; w++) assert.deepEqual(X.pieces(call('chiFromTable6', w)), X.t6Chi(w), 'week ' + w);
  for (const w of [27, 28, 30, 40, 52, 104, 1000]) assert.deepEqual(X.pieces(call('chiFromTable6', w)), { reps: 2, minPerRep: 20 }, 'week ' + w);
});

test('the heaviest Table 6 CHI cell is 40 minutes of work and no row prescribes more than 2 pieces', () => {
  // T4a, T4b
  const raw = J(IA.eval('NSW_TABLE6_CHI')).slice(1);
  assert.equal(Math.max(...raw.map(r => r.reps * r.minPerRep)), 40);
  assert.equal(Math.max(...raw.map(r => r.reps)), 2);
});

test('getCHI reads Table 6 by calendar week for every phase window, and steps back on a cutback week', () => {
  // T5, T6a, T6b
  for (const tw of [6, 8, 9, 11, 12, 16, 20, 26]) for (let w = 1; w <= tw; w++) {
    if (X.isCutback(w, tw)) continue;
    for (const ph of [[null, null], [1, tw], [Math.ceil(tw / 2), tw], [tw - 1, tw]])
      assert.deepEqual(X.pieces(call('getCHI', w, tw, true, ph[0], ph[1])), X.t6Chi(w), `tw${tw} wk${w} phase ${ph}`);
  }
  let cuts = 0;
  for (const tw of [10, 11, 12, 16, 20, 26]) for (let w = 1; w <= tw; w++) {
    if (!X.isCutback(w, tw)) continue;
    cuts++;
    assert.deepEqual(X.pieces(call('getCHI', w, tw, true, null, null)), X.chiCutOf(X.t6Chi(w - 1)), `tw${tw} wk${w}`);
  }
  assert.ok(cuts >= 10, cuts + ' cutback weeks reached');
});

test('getCHI never prescribes 3 pieces or more than 40 minutes, and past week 26 reads row 26 or its cutback', () => {
  // T7, T8a, T8b
  for (const tw of [4, 6, 11, 16, 26, 40, 52]) for (let w = 1; w <= 60; w++) {
    const g = call('getCHI', w, tw, true, null, null);
    assert.ok(g.reps <= 2 && g.reps * g.minPerRep <= 40, `tw${tw} wk${w} ${g.reps}x${g.minPerRep}`);
  }
  for (const [w, tw] of [[27, 30], [27, null], [30, 40], [31, 40], [40, null], [45, 52], [99, 104]]) {
    const want = tw && X.isCutback(w, tw) ? X.chiCutOf(X.t6Chi(26)) : X.t6Chi(26);
    assert.deepEqual(X.pieces(call('getCHI', w, tw, true, null, null)), want, `wk${w} tw${tw}`);
  }
  assert.ok(!/isMilGoal\s*&&\s*week\s*>\s*26\s*\)\s*return\s*\{\s*reps\s*:\s*3/.test(SRC_NC), 'the hardcoded 3 x 20 limb is gone');
});

// ── Table 6, the INT column (D114) ──────────────────────────────────────────────────────────────────────────────────
test('the INT column is stored raw, 26 rows, and intFromTable6 reads it under guide A\'s cap of 8', () => {
  // T1, T2a, T2, T3, T4a, T4b, T4c, T4d, T4e
  assert.equal(IA.eval("typeof intFromTable6 === 'function' && Array.isArray(NSW_TABLE6_INT)"), true);
  const got = J(IA.eval('NSW_TABLE6_INT'));
  assert.equal(got.length, 27); assert.equal(got[0], null);
  for (let w = 1; w <= 26; w++) assert.equal(got[w], X.t6IntRaw(w), 'stored week ' + w);
  const rd = w => IA.eval('intFromTable6')(w);
  for (const w of [27, 28, 30, 40, 52, 104, 1000]) assert.equal(rd(w), 8, 'week ' + w);
  assert.ok(X.t6IntRaw(11) > 8 && X.t6IntRaw(13) > 8, 'the raw column climbs past 8, so the cap is a live bound');
  let max = 0, firstEight = 0;
  for (let w = 1; w <= 26; w++) { const v = rd(w); max = Math.max(max, v); if (!firstEight && v === 8) firstEight = w; if (w > 1) assert.ok(v >= rd(w - 1), 'week ' + w); }
  assert.equal(max, 8);
  assert.equal(firstEight, 9);
  assert.equal(rd(26), 8);
  assert.deepEqual([rd(1), rd(2)], [4, 4]);
});

test('getINTReps reads the calendar week, never the ramp span, with the cutback stepping back about 40%', () => {
  // T5, T6, T7
  const gi = IA.eval('getINTReps');
  for (const tw of [6, 8, 11, 12, 16, 20, 26]) for (let w = 1; w <= tw; w++) {
    const ref = gi(w, tw, false, null);
    for (const span of [2, 3, 4, 6, 8, 12, 26]) assert.equal(gi(w, tw, false, span), ref, `tw${tw} wk${w} span${span}`);
  }
  for (const tw of [6, 8, 10, 11, 12, 14, 16, 20, 26]) for (let w = 1; w <= tw; w++) assert.equal(gi(w, tw, false, null), X.intReps(w, tw), `tw${tw} wk${w}`);
  assert.deepEqual([gi(4, 11, false, null), gi(8, 11, false, null), gi(11, 11, false, null)], [3, 4, 8]);
});

// ── the bike keeps its own readers (D128, D135) ─────────────────────────────────────────────────────────────────────
test('getCHIBike keeps the bike\'s own position ramp, which is not Table 6', () => {
  // T9a, T9b
  for (const tw of [6, 7, 11, 13, 17, 20, 26]) for (let w = 1; w <= tw; w++)
    assert.deepEqual(X.pieces(call('getCHIBike', w, tw)), X.v115Chi(w, tw), `tw${tw} wk${w}`);
  assert.notDeepEqual(X.pieces(call('getCHIBike', 16, 16)), X.t6Chi(16));
});

function bikeCards(prog) {
  const chi = [], int = [];
  Object.keys(prog.weeks).sort((a, b) => +a - +b).forEach(w => DAYS.forEach(d => {
    const day = prog.weeks[w][d]; if (!day || day.rest) return;
    for (const c of X.cardsOfDay(day)) {
      if (String(c.type) !== 'bike') continue;
      const det = String(c.detail || '').replace(/\s+/g, ' ');
      const many = det.match(/^(\d+)\s*x\s*(\d+)\s*min at RPE 8-9, high resistance/i);
      const one = det.match(/^(\d+)\s*min sustained hard effort, high resistance/i);
      if (many || one) chi.push({ w: +w, reps: many ? +many[1] : 1, mins: many ? +many[2] : +one[1] });
      const m = det.match(/^(\d+) x .+ max effort \/ .+ easy spin recovery/i);
      if (m) int.push({ w: +w, reps: +m[1] });
    }
  }));
  return { chi, int };
}

test('every bike CHI and INT card prints the bike\'s position ramp, on weeks where Table 6 would print otherwise', () => {
  // B1, B5, B2a, B2b, B3, B6a, B6b, B7
  assert.equal(IA.eval('typeof getCHIBike'), 'function');
  assert.equal(IA.eval('typeof getINTBike'), 'function');
  let chiN = 0, chiDiff = 0, intN = 0, intDiff = 0;
  for (const [goal, base] of X.BIKE_GOALS) {
    const p = build(X.bikeGoal(goal, base)), tw = p.totalWeeks, { chi, int } = bikeCards(p);
    for (const c of chi) {
      chiN++;
      const want = X.v115Chi(c.w, tw);
      assert.deepEqual({ reps: c.reps, minPerRep: c.mins }, want, `${goal} W${c.w}`);
      if (JSON.stringify(want) !== JSON.stringify(X.runChi(c.w, tw))) chiDiff++;
    }
    for (const c of int) {
      intN++;
      assert.equal(c.reps, X.v115Int(c.w, tw), `${goal} W${c.w}/${tw}`);
      if (X.v115Int(c.w, tw) !== X.intReps(c.w, tw)) intDiff++;
    }
  }
  assert.ok(chiN >= 8, chiN + ' bike CHI cards');
  assert.ok(chiDiff >= Math.ceil(chiN / 2), `the two CHI readers disagree on ${chiDiff} of ${chiN} cards`);
  assert.ok(intN >= 12, intN + ' bike INT cards');
  assert.ok(intDiff >= Math.ceil(intN / 3), `the two INT readers disagree on ${intDiff} of ${intN} cards`);
});

test('each sport calls its own reader: the bike builder names getCHIBike and getINTBike, the run and swim builders the table readers', () => {
  // B4a, B4b, B4c, B4d, B8a, B8b, B8c
  assert.equal((SRC_NC.match(/getCHIBike\s*\(/g) || []).length, 2, 'one call plus the declaration');
  assert.equal((SRC_NC.match(/getCHISwim\s*\(/g) || []).length, 2);
  assert.equal((SRC_NC.match(/(?<![A-Za-z0-9_])getCHI\s*\(/g) || []).length, 2, 'the run builder plus the declaration');
  assert.ok(!/getCHI\(week,\s*tw,\s*false\)/.test(SRC_NC), 'the bike builder does not reach getCHI');
  assert.equal((SRC_NC.match(/getINTBike\s*\(/g) || []).length, 2);
  assert.equal((SRC_NC.match(/(?<![A-Za-z0-9_])getINTReps\s*\(/g) || []).length, 3, 'the run and swim builders plus the declaration');
  assert.ok(!/getINTReps\(week,\s*tw,\s*false\)/.test(SRC_NC), 'the bike builder does not reach getINTReps');
});

// ── the swim takes the rep tier only (D128) ─────────────────────────────────────────────────────────────────────────
test('getCHISwim takes Table 6\'s pieces (1 to week 12, 2 from week 13) and keeps the position ramp\'s minutes', () => {
  // T10a, T10b, T10c
  for (const tw of [9, 13, 16, 20, 26]) for (let w = 1; w <= tw; w++) {
    const got = X.pieces(call('getCHISwim', w, tw, true, null, null));
    const want = X.isCutback(w, tw) ? X.chiCutOf({ reps: X.t6Chi(w - 1).reps, minPerRep: X.v115Chi(w - 1, tw).minPerRep })
      : { reps: X.t6Chi(w).reps, minPerRep: X.v115Chi(w, tw).minPerRep };
    assert.deepEqual(got, want, `tw${tw} wk${w}`);
  }
  assert.equal(call('getCHISwim', 12, 16, true, null, null).reps, 1);
  assert.equal(call('getCHISwim', 13, 16, true, null, null).reps, 2);
});

test('swim_mile CHI cards keep the yard ramp, quantised to 25s with a 150 floor, at Table 6\'s piece count', () => {
  // T12a, T12b
  const p = build(X.swimMile()), tw = p.totalWeeks;
  const yardOf = w => (X.isCutback(w, tw) ? Math.max(150, Math.round((200 + ((w - 2) / Math.max(tw - 1, 1)) * 600) * 0.7))
    : Math.round(200 + ((w - 1) / Math.max(tw - 1, 1)) * 600));
  let n = 0;
  Object.keys(p.weeks).forEach(w => DAYS.forEach(d => {
    const day = p.weeks[w][d]; if (!day || day.rest) return;
    for (const c of X.cardsOfDay(day)) {
      const det = String(c.detail || '').replace(/\s+/g, ' ');
      if (!/CHI|Continuous High/i.test(String(c.subtype || c.type || '')) || !/90-95%/.test(det)) continue;
      n++;
      const many = det.match(/(\d+)\s*x\s*(\d+)\s*(?:yd|yards) at 90-95% pace/i), cont = det.match(/(\d+)\s*(?:yd|yards) continuous at 90-95%/i);
      const reps = many ? +many[1] : cont ? 1 : 0, yds = many ? +many[2] : cont ? +cont[1] : 0;
      const wantReps = X.isCutback(+w, tw) ? X.chiCutOf({ reps: X.t6Chi(+w - 1).reps, minPerRep: X.v115Chi(+w - 1, tw).minPerRep }).reps : X.t6Chi(+w).reps;
      assert.equal(reps, wantReps, 'W' + w + ' pieces');
      assert.equal(yds, Math.max(150, Math.round(yardOf(+w) / 25) * 25), 'W' + w + ' yards');
    }
  }));
  assert.ok(n > 0, n + ' swim CHI cards');
});

// ── Mario's blocks, end to end ───────────────────────────────────────────────────────────────────────────────────────
test('Mario\'s 11-week pace block prints the Table 6 LI dose on every card, never 3 x 20', () => {
  // T11a, T11b, T11c, T11d
  const p = build(X.marioPace());
  const cards = [];
  Object.keys(p.weeks).sort((a, b) => +a - +b).forEach(w => DAYS.forEach(d => {
    const day = p.weeks[w][d]; if (!day || day.rest) return;
    for (const c of X.cardsOfDay(day)) if (X.LI.test(String(c.subtype || c.type || ''))) cards.push({ w: +w, detail: String(c.detail || '').replace(/\s+/g, ' ') });
  }));
  assert.equal(p.totalWeeks, 11);
  assert.ok(cards.length > 0);
  let got = 0, want = 0;
  for (const c of cards) {
    const m = c.detail.match(/(\d+)\s*x\s*(\d+)\s*min/i), one = c.detail.match(/^(\d+)\s*min continuous/i);
    const reps = m ? +m[1] : one ? 1 : 0, min = m ? +m[2] : one ? +one[1] : 0, w = X.runChi(c.w, 11);
    assert.deepEqual([reps, min], [w.reps, w.minPerRep], 'W' + c.w);
    assert.ok(!/3\s*x\s*20\s*min/i.test(c.detail), 'W' + c.w);
    got += reps * min; want += w.reps * w.minPerRep;
  }
  assert.equal(got, want);
});

test('Mario\'s crossfit pace block prints one SI card a week reading 4,4,5,3,6,6,7,4,8,8,8, and reaches 8 before the last week', () => {
  // d114 T8a, T8, T9
  const p = build(X.marioPaceCrossfit());
  const cards = [];
  for (const wk of Object.keys(p.weeks).map(Number).sort((a, b) => a - b)) for (const d of DAYS) {
    const c = p.weeks[wk][d] && p.weeks[wk][d].cardio;
    if (c && !Array.isArray(c) && X.SI.test(c.subtype || '')) cards.push({ wk, reps: c.dose && c.dose.reps, detail: String(c.detail || '') });
  }
  assert.equal(Object.keys(p.weeks).length, 11);
  const WANT = [4, 4, 5, 3, 6, 6, 7, 4, 8, 8, 8];
  assert.deepEqual(cards.map(c => c.reps), WANT);
  assert.deepEqual(cards.map(c => +(c.detail.match(/^(\d+)x400m/) || [])[1]), WANT);
  assert.ok(cards.some(c => c.reps === 8 && c.wk < 11));
});

test('HALF_MANNY is an NRC plan and builds no LI card, and buildProgram leaves its cfg byte-identical', () => {
  // T13, T14
  const before = JSON.stringify(fixtures.HALF_MANNY);
  const p = IA.buildProgram(fixtures.HALF_MANNY);
  assert.equal(JSON.stringify(fixtures.HALF_MANNY), before);
  assert.equal(X.runSessions(p).filter(r => X.LI.test(r.st)).length, 0);
});

// ── run_base holds the last single-piece row (D137) ─────────────────────────────────────────────────────────────────
const isSteady = c => c.type === 'run' && /^Steady Aerobic Run/.test(String(c.subtype || ''));
const steadyMin = d => { const m = d.match(/^(\d+) min steady/); return m ? m[1] : '?'; };
const isRunLI = c => c.type === 'run' && X.LI.test(String(c.subtype || ''));
const liDose = d => { const m = d.match(/^(?:(\d+)\s*x\s*)?(\d+)\s*min/); return m ? (m[1] ? m[1] + 'x' + m[2] : m[2]) : '?'; };

test('run_base\'s Steady Aerobic Run reads the ruling\'s 16-week series and holds 20 min from week 13', () => {
  // S1a, S1b, S1c, S1d, S3
  const e = build(X.runBase55(fixtures.HALF_MANNY, true)), n = build(X.runBase55(fixtures.HALF_MANNY, false));
  assert.equal(e.totalWeeks, 16);
  assert.equal(n.totalWeeks, 16);
  assert.deepEqual(X.seriesOf(e, isSteady, steadyMin), ['-', '15', '16', '11', '17', '17', '18', '13', '19', '19', '20', '14', '20', '20', '12', '-']);
  const sN = X.seriesOf(n, isSteady, steadyMin);
  assert.deepEqual(sN, ['-', '15', '16', '11', '17', '17', '18', '13', '19', '19', '20', '14', '20', '20', '20', '-']);
  // not 12 (the two-piece rows' per-piece minutes as one piece) and not 14 (a clamped week argument)
  assert.deepEqual(sN.slice(12, 15), ['20', '20', '20']);
});

test('exactly one run call site passes run_base the single-piece cap, and it is 12 (the row before Table 6\'s first "2 x")', () => {
  // S2c
  const lits = SRC_NC.match(/getCHI\(week,[^;\n]*goalId\s*===\s*'run_base'\s*\?\s*(\d+)\s*:\s*0\s*\)/g) || [];
  assert.equal(lits.length, 1);
  assert.equal(+lits[0].match(/\?\s*(\d+)\s*:/)[1], 12);
  assert.equal(X.T6_CHI.findIndex((r, i) => i >= 1 && r.reps === 2) - 1, 12, 'the hand table agrees');
});

test('the cap stays on run_base: a pace goal reads Table 6 rows 1 to 11 with cutbacks, and rows 13 and 14 as 2 x 12', () => {
  // S4b, S4c
  const p = build(X.prtRunPath({ primaryPath: 'goal', eventTargeted: false, raceDate: '' }));
  assert.deepEqual(X.seriesOf(p, isRunLI, liDose), ['15', '15', '16', '11', '17', '17', '18', '13', '19', '19', '20']);
  const pc = build(X.paceAndBike(fixtures.HALF_MANNY)), s = X.seriesOf(pc, isRunLI, liDose);
  assert.equal(pc.totalWeeks, 14);
  assert.deepEqual([s[12], s[13]], ['2x12', '2x12']);
});

// ── the Short Interval doctrine (D111, D112) ────────────────────────────────────────────────────────────────────────
// The sample: one 1.5 mi goal per entered mile, the 6:46 mile, and PRT TING's own goal.
const SAMPLE = [['5', '30'], ['6', '30'], ['8', '15'], ['9', '30'], ['11', '00'], ['12', '00']]
  .map(([mm, ss], i) => X.mileGoal(mm, ss, ['1.5', '3', '1'][i % 3], { seed: [24865, 777, 31337][i % 3] }))
  .concat([X.FRACTIONAL(), X.PINNED()]);
const BUILT = SAMPLE.map(cfg => ({ cfg, prog: build(cfg) }));
const AUD = X.intDoctrineAudit(BUILT);

test('the 16 s/mi is guide A\'s 4 s per 400 m in per-mile units, and it is not a proportion', () => {
  // D2, D1b
  const goalW1 = 509.3, per400 = goalW1 / X.QUARTERS_PER_MILE - X.SEC_PER_400_FASTER;
  assert.ok(Math.abs(per400 * X.QUARTERS_PER_MILE - (goalW1 - X.INT_SUB)) < 1e-9);
  assert.equal(X.INT_SUB, 16);
  const disagree = [330, 390, 480, 570, 660, 720].filter(g => Math.abs((g - 16) - g * 0.95) > 1).length;
  assert.ok(disagree >= 4, disagree + ' of 6 goal paces');
});

test('every SI card\'s pace is exactly 16 s/mi under the goal pace printed beside it, and the logged target agrees', () => {
  // D1, D3
  assert.ok(AUD.d1n > 0); assert.deepEqual(AUD.d1, []);
  assert.ok(AUD.d3blocks > 0 && AUD.d3cards > 0 && AUD.d3cut > 0, JSON.stringify({ b: AUD.d3blocks, c: AUD.d3cards, cut: AUD.d3cut }));
  assert.deepEqual(AUD.d3, []);
});

test('every block opens on guide A\'s 4 repeats, none passes 8, and some reach 8', () => {
  // D3b
  assert.ok(AUD.d3bBlocks > 0 && AUD.d3bTop > 0);
  assert.deepEqual(AUD.d3b, []);
});

test('the recovery is 2 to 2.5 x the work interval, by hand, printed as m:ss to m:ss', () => {
  // D4, D4b
  assert.ok(AUD.d4n > 0); assert.deepEqual(AUD.d4, []);
  assert.ok(AUD.ratioLo >= X.REC_LO_X - 0.01 && AUD.ratioHi <= X.REC_HI_X + 0.01, AUD.ratioLo + ' to ' + AUD.ratioHi);
});

test('no SI card prescribes the fixed 200 m recovery, and every one carries guide B\'s warm-up verbatim', () => {
  // D5, D5b
  assert.ok(AUD.d5n > 0);
  assert.equal(AUD.d5old, 0);
  assert.equal(AUD.d5oldWarm, 0);
  assert.equal(AUD.d5warm, AUD.d5n);
});

test('the warm-up and recovery sentences, and every rendered SI card, carry no mid-sentence dash', () => {
  // D6, D6b
  for (const s of [X.WARMUP, X.handRecTxt(493), X.handRecTxt(330), X.handRecTxt(720)]) assert.ok(!X.MID_DASH.test(s), s);
  assert.deepEqual(AUD.d6, []);
});

test('the hand reps and pace rows are what their functions derive, and the spacer calendars are what the hard-day spacing rule derives', () => {
  // D7 (the oracle checks itself first)
  for (const k of Object.keys(X.HAND_REPS_ROWS)) assert.deepEqual(Array.from({ length: +k }, (_, i) => X.handRepsT6(i + 1, +k)), X.HAND_REPS_ROWS[k], k + ' weeks');
  for (const r of X.PACE_REPS()) assert.deepEqual(X.handPaceRow(r.anchor, r.goal, r.tw), r.row, r.tag);
  assert.deepEqual(X.deriveSpacers(), X.SPACER7);
});

test('PRT TING prints one SI card a week, each the ruled sentence on the hand reps, target and recovery', () => {
  // D7 (the pinned grid)
  const p = build(X.PINNED()), a = X.armOf(p), pace = X.handPaceRow(509.3064395186472, 630 / 1.5, a.tw);
  assert.equal(a.arm, 'four-run');
  const cards = X.siCards(p);
  assert.deepEqual(cards.map(c => c.w), a.want);
  a.want.forEach((w, i) => {
    const g = { w, reps: X.handRepsT6(w, a.tw), tgt: pace[w - 1], cb: X.isCutback(w, a.tw) }, c = cards[i], hr = X.handRec(g.tgt);
    assert.deepEqual([c.dose.reps, c.dose.tgt, c.dose.rec.lo, c.dose.rec.hi], [g.reps, g.tgt, hr.lo, hr.hi], 'W' + w);
    assert.equal(c.detail, X.ruledIntDetail(g), 'W' + w);
  });
});

test('the six pace representatives log their hand rows to the second', () => {
  // D7 (the pace representatives)
  for (const r of X.PACE_REPS()) {
    const p = build(r.cfg), a = X.armOf(p);
    assert.equal(a.tw, r.tw, r.tag);
    assert.deepEqual(X.siCards(p).map(c => c.dose && c.dose.tgt), a.want.map(w => r.row[w - 1]), r.tag);
  }
});

test('the SI card count is a rule: one a week at four runs; at three runs one SI and one LI a week, or a spacer crossover', () => {
  // D7 (the rule, on the sample and a sample of the three-training-day calendars; the sweep runs all 35)
  const three = X.threeRunCalendars().filter(c => ['sun+mon+tue', 'thu+fri+sat', 'sun+tue+thu', 'mon+wed+fri', 'sun+wed+fri'].includes(c.cal));
  const T = X.intCardRuleAudit(BUILT.concat(three.map(c => ({ cfg: c.cfg, prog: build(c.cfg) }))));
  assert.deepEqual(T.bad, []);
  assert.equal(T.four, BUILT.length);
  assert.deepEqual([T.three, T.spacer, T.twoq], [5, 2, 3]);
});

test('W10 LI keeps A\'s x1.08 worked example (524 s/mi, 8:44/mi), W1 LSD keeps 10:59/mi, and neither carries a recovery band', () => {
  // D8, D8b, D8c
  const all = X.runSessions(build(X.PINNED()));
  const li10 = all.find(r => r.w === 10 && X.LI.test(r.st)), lsd1 = all.find(r => r.w === 1 && /Long Slow Distance/.test(r.st));
  assert.equal(li10.dose.tgt, 524); assert.ok(li10.detail.indexOf('8:44/mi') >= 0);
  assert.equal(lsd1.dose.tgt, 659); assert.ok(lsd1.detail.indexOf('10:59/mi') >= 0);
  assert.ok(!li10.dose.rec && !lsd1.dose.rec);
});

test('all four copies of the generic SI note state guide A\'s cap of 8, and none still claims 10', () => {
  // D9
  assert.equal(count(SRC, X.RULED_SI_NOTE), 4);
  assert.equal(count(SRC, 'Build from 4 reps to 10'), 0);
  for (const head of ['INT: Zone 5 (95%+ max HR) on work efforts.', 'INT — Interval: Zone 5 (95%+ max HR) on work efforts.'])
    assert.equal(count(SRC, head), 0, head);
});

test('the generic SI note renders verbatim with no dash, and the cap it states is the cap the engine prescribes', () => {
  // D9b, D9c, D9d
  const notes = X.runSessions(build(X.GENERIC())).filter(r => X.SI.test(r.st) && /Zone 5/.test(r.note)).map(r => r.note);
  assert.ok(notes.length > 0);
  for (const n of notes) assert.equal(n, X.RULED_SI_NOTE);
  assert.ok(!X.MID_DASH.test(X.RULED_SI_NOTE) && X.RULED_SI_NOTE.indexOf('—') < 0);
  assert.equal(AUD.maxReps, 8);
  assert.ok(X.RULED_SI_NOTE.indexOf('Hard cap at ' + AUD.maxReps) >= 0);
});

test('a goal pace that lands on the minute prints 7:00, never 6:60, and the parser refuses 6:60', () => {
  // D10a, D10b, D10c, D10d
  assert.equal(X.toSec('6:60'), null); assert.equal(X.toSec('7:00'), 420); assert.equal(X.toSec('6:59'), 419); assert.equal(X.toSec('6:5'), null);
  const cards = X.siCards(build(X.FRACTIONAL()));
  assert.ok(cards.length > 0);
  let carry = 0;
  for (const c of cards) {
    for (const m of c.detail.matchAll(/(\d+):(\d+)/g)) assert.ok(m[2].length === 2 && +m[2] <= 59, `W${c.w} "${m[0]}"`);
    const g = /This week's goal pace is (\d+:\d\d)\/mi/.exec(c.detail);
    if (g) { assert.notEqual(X.toSec(g[1]), null); if (/:00$/.test(g[1])) carry++; }
  }
  assert.ok(carry > 0, 'the config still reaches the carry');
  // by hand: 404 + 16 = 420 s/mi, 7:00
  assert.equal(cards[0].dose.tgt, 404);
  assert.ok(cards[0].detail.indexOf('at 6:44/mi') >= 0 && cards[0].detail.indexOf("This week's goal pace is 7:00/mi") >= 0, cards[0].detail.slice(0, 60));
});

// ── the copy rule on the four cardio builders (D109) ────────────────────────────────────────────────────────────────
test('no line of the four cardio builders carries an em-dash and no literal a letter-hyphen-letter, names aside', () => {
  // D109-S-run, D109-S-nrc, D109-S-bike, D109-S-swim
  for (const [k, fn] of Object.entries(X.BUILDERS)) {
    const b = X.builderBody(SRC, fn);
    assert.ok(!b.err, k + ': ' + b.err);
    const a = X.copyRuleAudit(b.text);
    assert.ok(a.lits > 0, k);
    assert.deepEqual(a.em, [], k + ' em-dash lines');
    assert.deepEqual(a.hy, [], k + ' hyphenated literals');
  }
});

test('each builder carries coach\'s copy rule replacement texts as later rulings left them, as often as the table says, and no old text', () => {
  // D109-T-run, D109-T-nrc, D109-T-bike, D109-T-swim
  const E = X.d109Entries();
  assert.ok(!E.err, E.err);
  for (const [k, fn] of Object.entries(X.BUILDERS)) {
    const body = X.builderBody(SRC, fn).text, [lo, hi] = X.D109_RANGE[k], bad = [];
    for (let i = lo; i <= hi; i++) {
      const e = E.ents[i - 1];
      const nNew = count(body, e.neu), nOld = count(body, e.old), nGone = e.gone.reduce((a, g) => a + count(body, g), 0);
      if (nNew !== e.n || nOld !== 0 || nGone !== 0) bad.push(`#${i}${e.by ? ' (' + e.by + ')' : ''} new ${nNew}/${e.n} old ${nOld} superseded ${nGone}`);
    }
    assert.deepEqual(bad, [], k);
  }
});

test('no cardio card\'s note or detail breaks the copy rule, NRC Speed Run tables aside, on five fixtures', () => {
  // D109-R-HALF-MANNY, D109-R-run-base, D109-R-pace-goal, D109-R-bike, D109-R-swim
  const FIX = [['HALF_MANNY', 'run', clone(fixtures.HALF_MANNY)],
    ['run_base', 'run', Object.assign(clone(fixtures.HALF_MANNY), { name: 'RB', primaryPath: 'fitness',
      cardioGoals: { run: { id: 'run_base', label: 'Build Running Base', baselineDist: '0.1', baseline: '0.1mi' } },
      eventTargeted: true, raceDate: '2027-06-01', ageBracket: '55+' })],
    ['pace_goal', 'run', X.PINNED()], ['bike', 'bike', X.bikeGoal('bike_50', 30)], ['swim', 'swim', X.swimMile()]];
  for (const [tag, type, cfg] of FIX) {
    const p = build(cfg); let typed = 0, texts = 0; const hits = [];
    Object.keys(p.weeks).forEach(w => DAYS.forEach(d => {
      for (const c of X.cardsOfDay(p.weeks[w][d])) {
        if (c.type === type) typed++;
        for (const f of ['note', 'detail']) {
          const v = c[f]; if (v == null || v === '') continue;
          if (f === 'detail' && /^Speed Run/.test(String(c.subtype || ''))) continue;
          texts++;
          if (X.breaksCopyRule(v)) hits.push(`W${w} ${d} ${c.subtype || c.type} ${f}`);
        }
      }
    }));
    assert.ok(typed > 0 && texts > 0, tag);
    assert.deepEqual(hits, [], tag);
  }
});
