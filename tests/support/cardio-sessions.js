'use strict';
// Helpers for the cardio session tests (tests/integration/cardio-sessions.test.js and tests/sweeps/cardio-sessions.test.js):
// the hand oracles for NSW Guide B Table 6, Guide A's interval rules, the V115 ramps the bike keeps, and the configs the
// tests build. Built on tests/support/app.js. Nothing here asks the engine what it should say.
//
// The doctrine: A = doctrine/physicaltrainingguide2020.txt (and its hand-transcribed tables,
// doctrine/ptg2020_tables_p13_14_16_17.txt), B = doctrine/nsw_ptg_sealswcc_11pg.txt (Table 6). The doctrine text is
// gitignored (copyright); doctrineText() returns null when it is absent, and the tests that read it say so by name.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { REPO } = require('./app.js');

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const clone = v => JSON.parse(JSON.stringify(v));

// ── the doctrine text ────────────────────────────────────────────────────────────────────────────────────────────────
const GUIDE_A = 'physicaltrainingguide2020.txt';
const GUIDE_A_TABLES = 'ptg2020_tables_p13_14_16_17.txt';
const GUIDE_B = 'nsw_ptg_sealswcc_11pg.txt';
/** The doctrine file's text, or null when the gitignored doctrine tree is absent. */
function doctrineText(file) {
  const f = path.join(REPO, 'doctrine', file);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
}
const DOCTRINE_ABSENT = 'doctrine/*.txt is absent (gitignored; restore it per doctrine/README.md)';
/** node:test skip option for a test that reads the doctrine text: the reason when a file is missing, else false. */
const needsDoctrine = (...files) => (files.every(f => doctrineText(f) !== null) ? false : DOCTRINE_ABSENT);

/**
 * Table 6 read straight out of guide B's text: the CHI column ("Run/Swim (minutes)", a single piece or "2 x N") and the
 * INT column ("Run/Swim (reps)"), weeks 1 to 26, and whether the ">26: do not increase" tail rule is there.
 */
function table6FromText(txt) {
  const lines = txt.split('\n');
  const chi = [null], chiRaw = [null], int = [null];
  for (const L of lines) {
    const m = L.match(/^\s*(\d+)\s*\|[^|]*\|[^|]*\|\s*([^|]*?)\s*\|/);
    if (m) {
      const wk = +m[1];
      if (wk >= 1 && wk <= 26 && chiRaw[wk] === undefined) {
        chiRaw[wk] = m[2];
        const p = m[2].match(/^(?:(\d+)\s*x\s*)?(\d+)$/);
        chi[wk] = p ? { reps: p[1] ? +p[1] : 1, minPerRep: +p[2] } : null;
      }
    }
    const n = L.match(/^\s*(\d{1,2})\s*\|[^|]*\|[^|]*\|[^|]*\|\s*(\d{1,2})\s*$/);
    if (n && +n[1] >= 1 && +n[1] <= 26 && +n[1] === int.length) int.push(+n[2]);
  }
  const tail = lines.some(L => />\s*26\s*:/.test(L) && /do not increase/i.test(L));
  return { chi, chiRaw, int, tail };
}

// ── Table 6, typed by hand from guide B ─────────────────────────────────────────────────────────────────────────────
// CHI min: wk 1-2 1x15 | 3-4 1x16 | 5-6 1x17 | 7-8 1x18 | 9-10 1x19 | 11-12 1x20 | 13-15 2x12 | 16-18 2x14 | 19-21 2x16 |
// 22-24 2x18 | 25-26 2x20. INT reps (raw, uncapped): 4 4 5 5 6 6 7 7 8 8 9 9, then 10 from week 13 to week 26.
const T6_CHI = [null,
  { reps: 1, minPerRep: 15 }, { reps: 1, minPerRep: 15 }, { reps: 1, minPerRep: 16 }, { reps: 1, minPerRep: 16 },
  { reps: 1, minPerRep: 17 }, { reps: 1, minPerRep: 17 }, { reps: 1, minPerRep: 18 }, { reps: 1, minPerRep: 18 },
  { reps: 1, minPerRep: 19 }, { reps: 1, minPerRep: 19 }, { reps: 1, minPerRep: 20 }, { reps: 1, minPerRep: 20 },
  { reps: 2, minPerRep: 12 }, { reps: 2, minPerRep: 12 }, { reps: 2, minPerRep: 12 },
  { reps: 2, minPerRep: 14 }, { reps: 2, minPerRep: 14 }, { reps: 2, minPerRep: 14 },
  { reps: 2, minPerRep: 16 }, { reps: 2, minPerRep: 16 }, { reps: 2, minPerRep: 16 },
  { reps: 2, minPerRep: 18 }, { reps: 2, minPerRep: 18 }, { reps: 2, minPerRep: 18 },
  { reps: 2, minPerRep: 20 }, { reps: 2, minPerRep: 20 }];
const T6_INT_RAW = [null, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
/** Guide A's ceiling: build to 8 intervals, no more ("Do not run or swim more than 8 intervals"). */
const REPS_CEILING = 8;
/** The table's tail rule: past week 26 read row 26 forever (">26: do not increase INT or CHI distances"). */
const t6Week = w => Math.max(1, Math.min(Math.round(w) || 1, 26));
const t6Chi = w => T6_CHI[t6Week(w)];
const t6IntRaw = w => T6_INT_RAW[t6Week(w)];
const t6Int = w => Math.min(REPS_CEILING, t6IntRaw(w));

/** The cutback clock: blocks of 10 weeks or more step back every fourth week, never on the last week. */
const isCutback = (w, tw) => (tw || 0) >= 10 && w % 4 === 0 && w !== tw;
/** The CHI cutback: one rep off the prior build week; a single piece cuts to 70% of its minutes, floored at 10. */
const chiCutOf = prev => (prev.reps > 1 ? { reps: prev.reps - 1, minPerRep: prev.minPerRep }
  : { reps: 1, minPerRep: Math.max(10, Math.round(prev.minPerRep * 0.7)) });
/** The run's CHI dose by calendar week: Table 6, or its cutback off the week before. */
const runChi = (w, tw) => (isCutback(w, tw) ? chiCutOf(t6Chi(w - 1)) : t6Chi(w));
/** The INT reps by calendar week: Table 6 under A's ceiling; a cutback steps back ~40% off the prior week, floor 3. */
const intReps = (w, tw) => (isCutback(w, tw) ? Math.max(3, Math.round(t6Int(w - 1) * 0.6)) : t6Int(w));

/** The V115 CHI ramp the bike keeps: 1 to 3 pieces over the block by position, 15 to 20 minutes. */
function v115Chi(w, tw) {
  const pFrom = 1, pTo = Math.max(2, tw || 6);
  const at = x => {
    const pct = Math.max(0, Math.min(1, (x - pFrom) / Math.max(pTo - pFrom, 1)));
    return { reps: pct < 0.35 ? 1 : pct < 0.7 ? 2 : 3, minPerRep: Math.round(15 + pct * 5) };
  };
  return isCutback(w, tw) ? chiCutOf(at(w - 1)) : at(w);
}
/** The V115 INT ramp the bike keeps: 4 to 8 spread over the block by position, the same cutback. */
function v115Int(w, tw) {
  const span = Math.max(2, tw || 6);
  const ramp = x => Math.min(8, 4 + Math.floor((x - 1) * 4 / Math.max(span - 1, 1)));
  return isCutback(w, tw) ? Math.max(3, Math.round(ramp(w - 1) * 0.6)) : ramp(w);
}
const pieces = o => ({ reps: o.reps, minPerRep: o.minPerRep });

// ── Guide A's interval rules ─────────────────────────────────────────────────────────────────────────────────────────
// A 251-252: "your 400m interval pace should be about 4 seconds faster than your base pace"; A calls a 400 m a quarter
// mile, so four quarters carry 16 seconds per mile. A 248-249 and both table headers: recovery is 2 to 2.5 x the work
// time. Guide B p8 (A is silent): warm up 10 to 15 minutes, build from an easy jog, add 4 to 5 bursts of 15 to 30 s.
const SEC_PER_400_FASTER = 4;
const QUARTERS_PER_MILE = 4;
const INT_SUB = SEC_PER_400_FASTER * QUARTERS_PER_MILE;
const METRES_PER_MILE = 1609.344;
const REC_LO_X = 2, REC_HI_X = 2.5;
const WARMUP = 'Warm up 10 to 15 minutes. Build from an easy jog. Add 4 to 5 bursts of 15 to 30 seconds. Cool down until breathing is easy.';
/** m:ss, rounding the whole value first (the clock contract: a seconds limb is two digits in 00..59). */
const clk = t => { const v = Math.round(t); return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0'); };
/** An m:ss clock to seconds, or null when the seconds limb is not two digits in 00..59 ("6:60" is not a time). */
const toSec = p => { const m = /^(\d+):([0-5]\d)$/.exec(p); return m ? +m[1] * 60 + +m[2] : null; };
const handRec = tgt => { const work = tgt * 400 / METRES_PER_MILE; return { lo: Math.round(work * REC_LO_X), hi: Math.round(work * REC_HI_X), work }; };
const handRecTxt = tgt => { const r = handRec(tgt); return 'Recovery: ' + clk(r.lo) + ' to ' + clk(r.hi) + ' of easy jogging or walking. Keep moving.'; };
/** A copy rule predicate: a mid-sentence dash between spaces. */
const MID_DASH = /\s[—–-]\s/;

// The block shape, as arithmetic: an event-targeted non-base block tapers its last max(2, round(12%)) weeks.
const handTaperWks = tw => Math.max(2, Math.round(tw * 0.12));
const handIsTaper = (w, tw) => w > tw - handTaperWks(tw);
const handBuildWks = tw => tw - handTaperWks(tw);
/** The spacer calendars' crossover week (first CHI week): max(3, ceil(tw x 0.55)). */
const handCrossover = tw => Math.max(3, Math.ceil((tw || 6) * 0.55));
/** INT reps on a block: Table 6 by calendar week, the cutback, then the taper (55% of the dose, floor 2). */
const handRepsT6 = (w, tw) => {
  const b = isCutback(w, tw) ? Math.max(3, Math.round(t6Int(w - 1) * 0.6)) : t6Int(w);
  return handIsTaper(w, tw) ? Math.max(2, Math.round(b * 0.55)) : b;
};
/** The hand reps rows the function above must give (6 and 9 weeks: no cutback, taper tail; 11 and 15: cutbacks). */
const HAND_REPS_ROWS = { 6: [4, 4, 5, 5, 3, 3], 9: [4, 4, 5, 5, 6, 6, 7, 4, 4], 11: [4, 4, 5, 3, 6, 6, 7, 4, 8, 4, 4],
  15: [4, 4, 5, 3, 6, 6, 7, 4, 8, 8, 8, 5, 8, 4, 4] };

// The pace clock (D101 one planning rate, capped; D111 the INT target is the week's goal pace less 16 s/mi; D186 N build
// weeks are N - 1 steps and the taper holds the last build week; D187 the intermediate 18-35 rate is 3 s/mi/wk).
const PACE_CAP_INT_18_35 = 3;
function handPaceRow(anchor, goalPace, tw) {
  const target = Math.min(goalPace, anchor);
  const bw = handBuildWks(tw);
  const gain = Math.min((anchor - target) / Math.max(bw - 1, 1), PACE_CAP_INT_18_35);
  const real = +(anchor - gain * Math.max(bw - 1, 0)).toFixed(1);
  const tgt = [];
  for (let w = 1; w <= tw; w++) {
    const a = w > bw ? real : +Math.max(anchor - gain * bw, anchor - gain * (w - 1)).toFixed(1);
    tgt.push(Math.round(a - INT_SUB));
  }
  for (let w = 2; w <= tw; w++) if (isCutback(w, tw)) tgt[w - 1] = tgt[w - 2];
  return tgt;
}
// The pace chart's 5:30 row (mile and 5K columns) and the columns' distances, for the one anchor that interpolates.
const CHART_ROW_5_30 = { mile: 330, fiveK: 360 };
const COL_D_MILE = 1, COL_D_5K = 3.107;
const handRowPaceAt3mi = row => row.mile + (row.fiveK - row.mile) * (Math.log(3 / COL_D_MILE) / Math.log(COL_D_5K / COL_D_MILE));

/** The whole INT card sentence the ruling prints, cutback or not. */
const ruledIntDetail = g => (g.cb
  ? `${g.reps}x400m at ${clk(g.tgt)}/mi. Cutback week. Same target as last week, fewer reps. ` + handRecTxt(g.tgt) + ' ' + WARMUP
  : `${g.reps}x400m at ${clk(g.tgt)}/mi. This week's goal pace is ${clk(g.tgt + INT_SUB)}/mi. ` + handRecTxt(g.tgt) + ' ' + WARMUP);
/** The generic SI note (D9 tail, D103a head): guide A's ceiling in Mario's voice. */
const RULED_SI_NOTE = 'SI: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to '
  + REPS_CEILING + '. Hard cap at ' + REPS_CEILING + '. Quality over quantity. If pace drops, stop.';

// ── the run builder's quality labels (D103a: the CHI is the Long Interval, the INT the Short Interval) ──────────────
const SI = /Short Interval \(SI\)/;
const LI = /Long Interval \(LI\)/;

// ── configs ──────────────────────────────────────────────────────────────────────────────────────────────────────────
/** PRT TING: an intermediate 18-35 pace athlete, rest Sunday and Wednesday, seed 24865. */
const prtBase = over => Object.assign({
  name: 'PRT TING', primaryPath: 'event', cardioTypes: ['run'], eventTargeted: true,
  raceDate: '2026-10-19', liftingFocus: 'support_prevention', experience: 'intermediate',
  ageBracket: '18-35', equipment: 'full_gym', unit: 'lbs',
  restDays: ['sun', 'wed'], days: DAYS.slice(),
  bench: 185, squat: 245, deadlift: 315, seed: 24865 }, over || {});
const paceGoal = (g, over) => prtBase(Object.assign({ cardioGoals: { run: Object.assign(
  { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', paceUnit: 'mi', baselineDist: '3', baseline: '3mi' }, g) } }, over || {}));
const mileGoal = (mm, ss, dist, over) => paceGoal({ targetDist: dist, targetMins: '10', targetSecs: '30', targetTime: '10:30',
  mileBestMins: mm, mileBestSecs: ss, mileBestSrc: { kind: 'entered' } }, over);

/** The pace lattice: six entered miles x three goal distances x three seeds, plus the 6:46 mile that reaches the carry. */
const LAT_MILES = [['5', '30'], ['6', '30'], ['8', '15'], ['9', '30'], ['11', '00'], ['12', '00']];
function paceLattice() {
  const out = [];
  for (const [mm, ss] of LAT_MILES) for (const dist of ['1', '1.5', '3']) for (const seed of [24865, 777, 31337])
    out.push(mileGoal(mm, ss, dist, { seed }));
  out.push(FRACTIONAL());
  return out;
}
/** A 6:46 mile at seed 76308 walks the goal pace onto 419.5 s/mi, which rounds to 7:00, never "6:60". */
const FRACTIONAL = () => mileGoal('6', '46', '1.5', { seed: 76308 });
/** PRT TING's own goal: an entered 8:15 mile, 10:30 over 1.5 mi, 11 weeks. */
const PINNED = () => mileGoal('8', '15', '1.5');
/** The six pace representatives: a hand anchor and goal per shape the clock can take, and the hand row. */
const PACE_REPS = () => [
  { tag: '8:15 mile, 1.5 mi goal', anchor: 509.3064395186472, goal: 630 / 1.5, tw: 11, cfg: mileGoal('8', '15', '1.5'),
    row: [493, 490, 487, 487, 481, 478, 475, 475, 469, 469, 469] },
  { tag: '5:30 mile, 3 mi goal', anchor: handRowPaceAt3mi(CHART_ROW_5_30), goal: 630 / 3, tw: 15, cfg: mileGoal('5', '30', '3'),
    row: [343, 340, 337, 337, 331, 328, 325, 325, 319, 316, 313, 313, 307, 307, 307] },
  { tag: '12:00 mile, 1 mi goal', anchor: 720, goal: 630, tw: 9, cfg: mileGoal('12', '00', '1'),
    row: [704, 701, 698, 695, 692, 689, 686, 686, 686] },
  { tag: '11:00 mile, 1 mi goal', anchor: 660, goal: 630, tw: 9, cfg: mileGoal('11', '00', '1'),
    row: [644, 641, 638, 635, 632, 629, 626, 626, 626] },
  { tag: '5:30 mile, 1 mi goal (already met)', anchor: 330, goal: 630, tw: 6, cfg: mileGoal('5', '30', '1'),
    row: [314, 314, 314, 314, 314, 314] },
  { tag: '10:45 mile, 1 mi goal (below the cap)', anchor: 645, goal: 630, tw: 9, cfg: mileGoal('10', '45', '1'),
    row: [629, 627, 624, 622, 619, 617, 614, 614, 614] },
];
/** The athlete whose 1 mi goal is reachable and not met, so his INT cards read the generic SI note. */
const GENERIC = () => mileGoal('10', '45', '1');

// The three-training-day calendars. D130: two hard runs on neighbouring days of the circular week are an untolerated pair,
// except a CHI on the eve of the long run. The spacer calendars are the ones where no order of INT, CHI and long avoids one.
const SPACER7 = ['sun+mon+tue', 'sun+mon+sat', 'sun+fri+sat', 'mon+tue+wed', 'tue+wed+thu', 'wed+thu+fri', 'thu+fri+sat'];
function combos(a, k) { if (k === 0) return [[]]; if (a.length < k) return []; const [h, ...t] = a; return combos(t, k - 1).map(c => [h, ...c]).concat(combos(t, k)); }
function untolerated(slots) {
  const at = d => DAYS.indexOf(d), nb = (a, b) => { const r = Math.abs(at(a) - at(b)); return Math.min(r, 7 - r) === 1; };
  const L = slots.find(s => s.t === 'long'); let u = 0;
  for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++) {
    const x = slots[i], y = slots[j]; if (!nb(x.d, y.d)) continue;
    const eve = L ? DAYS[(at(L.d) + 6) % 7] : null;
    if (!((x.t === 'chi' && y === L && x.d === eve) || (y.t === 'chi' && x === L && y.d === eve))) u++;
  }
  return u;
}
/** The spacer calendars the D130 sentence derives, in DAYS order. */
function deriveSpacers() {
  const P = [['int', 'chi', 'long'], ['int', 'long', 'chi'], ['chi', 'int', 'long'], ['chi', 'long', 'int'], ['long', 'int', 'chi'], ['long', 'chi', 'int']];
  return combos(DAYS, 3).filter(c => Math.min(...P.map(p => untolerated(c.map((d, i) => ({ d, t: p[i] }))))) > 0).map(c => c.join('+'));
}
/** PINNED's athlete on each of the 35 three-training-day calendars. */
const threeRunCalendars = () => combos(DAYS, 3).map(c => ({ cal: c.join('+'), cfg: mileGoal('8', '15', '1.5', { restDays: DAYS.filter(d => c.indexOf(d) < 0) }) }));

// ── reading a program ────────────────────────────────────────────────────────────────────────────────────────────────
const cardsOfDay = day => (!day || !day.cardio ? [] : [].concat(day.cardio).filter(Boolean));
/** Every run card of a program, week order then day order (Sunday first). */
function runSessions(prog) {
  const out = [], wks = prog.weeks || {};
  Object.keys(wks).sort((a, b) => +a - +b).forEach(w => DAYS.forEach(d => {
    for (const s of cardsOfDay(wks[w][d])) if (s.type === 'run')
      out.push({ w: +w, d, st: s.subtype || '', detail: s.detail || '', note: String(s.note || ''), dose: s.dose || null });
  }));
  return out;
}
const siCards = prog => runSessions(prog).filter(r => SI.test(r.st));

/**
 * The INT card rule's arm for a build, read off its own week grid: four runs every week (one SI card every week), three
 * runs on a spacer calendar (SI weeks 1..cross-1, LI weeks cross..tw), three runs elsewhere (one SI and one LI every
 * week), or neither (a named miss).
 */
function armOf(prog) {
  const wks = prog.weeks || {}, tw = prog.totalWeeks || 0, per = [];
  for (let w = 1; w <= tw; w++) {
    let n = 0;
    DAYS.forEach(d => { for (const s of cardsOfDay(wks[w] && wks[w][d])) if (s.type === 'run') n++; });
    per.push(n);
  }
  const weeks = n => Array.from({ length: n }, (_, i) => i + 1);
  if (!per.length) return { arm: 'none', tw, per };
  if (per.every(n => n >= 4)) return { arm: 'four-run', tw, per, want: weeks(tw) };
  if (per.every(n => n === 3)) {
    const run1 = runSessions(prog).filter(r => r.w === 1).map(r => r.d);
    const cal = DAYS.filter(d => run1.indexOf(d) >= 0).join('+'), cr = handCrossover(tw);
    if (SPACER7.indexOf(cal) >= 0) return { arm: 'three-run', shape: 'spacer', cal, tw, per,
      want: weeks(cr - 1), wantChi: Array.from({ length: tw - cr + 1 }, (_, i) => cr + i) };
    return { arm: 'three-run', shape: 'two-quality', cal, tw, per, want: weeks(tw), wantChi: weeks(tw) };
  }
  return { arm: 'mixed', tw, per };
}

/**
 * The INT doctrine audit over a set of built programs (each {cfg, prog}): every claim's misses and counts. The tests
 * assert on the tally; the integration file passes a sample, the sweep the whole lattice.
 */
function intDoctrineAudit(built) {
  const T = { d1: [], d1n: 0, d3: [], d3blocks: 0, d3cards: 0, d3cut: 0, d3steps: 0, d3b: [], d3bBlocks: 0, d3bTop: 0, maxReps: 0,
    d4: [], d4n: 0, ratioLo: 1e9, ratioHi: -1e9, d5old: 0, d5oldWarm: 0, d5warm: 0, d5n: 0, d6: [] };
  for (const { prog } of built) {
    const cards = siCards(prog);
    // D1: the printed pace is the printed goal pace less 16 s/mi
    for (const r of cards) {
      const m = /at (\d+:[0-5]\d)\/mi\. This week's goal pace is (\d+:[0-5]\d)\/mi\./.exec(r.detail);
      if (!m) continue;
      T.d1n++;
      const got = toSec(m[1]), goal = toSec(m[2]);
      if (Math.abs((goal - got) - INT_SUB) > 1) T.d1.push(`goal ${m[2]} printed ${m[1]} gap ${goal - got}s`);
    }
    // D3: the logged target is the printed goal less 16, a cutback logs last week's target, the target never slows
    const dosed = cards.filter(r => r.dose && r.dose.tgt != null);
    if (dosed.length) T.d3blocks++;
    dosed.forEach((c, i) => {
      T.d3cards++;
      const m = /This week's goal pace is (\d+:[0-5]\d)\/mi/.exec(c.detail);
      if (m) {
        if (Math.abs(c.dose.tgt - (toSec(m[1]) - INT_SUB)) > 1) T.d3.push(`W${c.w} logged ${c.dose.tgt} but prints goal ${m[1]}`);
      } else if (/Cutback week\. Same target as last week, fewer reps\./.test(c.detail)) {
        T.d3cut++;
        if (i > 0 && c.dose.tgt !== dosed[i - 1].dose.tgt) T.d3.push(`W${c.w} says same target but logs ${c.dose.tgt} against ${dosed[i - 1].dose.tgt}`);
      } else T.d3.push(`W${c.w} prints neither the goal pace sentence nor the cutback sentence: ${c.detail.slice(0, 70)}`);
      if (i > 0 && c.dose.tgt > dosed[i - 1].dose.tgt) T.d3.push(`W${c.w} target got slower (${dosed[i - 1].dose.tgt} -> ${c.dose.tgt})`);
      if (i > 0 && c.dose.tgt < dosed[i - 1].dose.tgt) T.d3steps++;
    });
    // D3b: the first INT week is A's 4 repeats, none above A's 8
    const repped = cards.filter(r => r.dose && r.dose.reps != null);
    if (repped.length) {
      T.d3bBlocks++;
      if (repped[0].dose.reps !== 4) T.d3b.push(`first INT week prescribes ${repped[0].dose.reps}`);
      for (const c of repped) {
        T.maxReps = Math.max(T.maxReps, c.dose.reps);
        if (c.dose.reps > REPS_CEILING) T.d3b.push(`W${c.w} prescribes ${c.dose.reps}`);
      }
      if (repped.some(c => c.dose.reps === REPS_CEILING)) T.d3bTop++;
    }
    for (const r of cards) {
      // D4: the recovery band is hand arithmetic on the card's own target, printed as m:ss
      if (r.dose && r.dose.tgt != null) {
        T.d4n++;
        const h = handRec(r.dose.tgt);
        if (!r.dose.rec) T.d4.push(`W${r.w} carries no rec band`);
        else {
          if (r.dose.rec.lo !== h.lo || r.dose.rec.hi !== h.hi) T.d4.push(`W${r.w} rec ${r.dose.rec.lo}-${r.dose.rec.hi} want ${h.lo}-${h.hi}`);
          T.ratioLo = Math.min(T.ratioLo, r.dose.rec.lo / h.work);
          T.ratioHi = Math.max(T.ratioHi, r.dose.rec.hi / h.work);
        }
        if (r.detail.indexOf(handRecTxt(r.dose.tgt)) < 0) T.d4.push(`W${r.w} detail lacks "${handRecTxt(r.dose.tgt)}"`);
      }
      // D5: no fixed 200 m recovery and no old warm-up; guide B's warm-up verbatim
      T.d5n++;
      if (/walk or jog 200m/.test(r.detail)) T.d5old++;
      if (/5 min easy warmup \+ cooldown/.test(r.detail)) T.d5oldWarm++;
      if (r.detail.indexOf(WARMUP) >= 0) T.d5warm++;
      // D6: no mid-sentence dash on any rendered INT card
      if (MID_DASH.test(r.detail)) T.d6.push(`W${r.w} |${r.detail}|`);
    }
  }
  return T;
}

/** The INT card count rule (D7: four-run every week, three-run spacer or two-quality), reps, and the structural pace laws. */
function intCardRuleAudit(built) {
  const T = { bad: [], four: 0, three: 0, spacer: 0, twoq: 0, lens: {} };
  for (const { prog } of built) {
    const a = armOf(prog);
    if (a.arm === 'mixed' || a.arm === 'none') {
      T.bad.push(`${a.tw}wk build is neither uniformly four-run nor uniformly three-run (runs per week ${a.per.join(',')})`);
      continue;
    }
    if (a.arm === 'three-run') T.three++; else T.four++;
    T.lens[a.tw] = (T.lens[a.tw] || 0) + 1;
    const cards = siCards(prog), gotW = cards.map(c => c.w);
    if (JSON.stringify(gotW) !== JSON.stringify(a.want))
      T.bad.push(`${a.tw}wk ${a.arm}${a.shape ? ' ' + a.shape : ''} build carries SI cards in weeks ${gotW.join(',') || '(none)'} but the rule says ${a.want.join(',')}`);
    if (a.wantChi) {
      if (a.shape === 'spacer') T.spacer++; else T.twoq++;
      const chiW = runSessions(prog).filter(r => LI.test(r.st)).map(r => r.w);
      if (JSON.stringify(chiW) !== JSON.stringify(a.wantChi))
        T.bad.push(`${a.tw}wk three-run ${a.shape} build on ${a.cal} carries LI cards in weeks ${chiW.join(',') || '(none)'} but the rule says ${a.wantChi.join(',')}`);
    }
    const wantReps = a.want.map(w => handRepsT6(w, a.tw)), gotReps = cards.map(c => c.dose && c.dose.reps);
    if (gotW.length === a.want.length && JSON.stringify(gotReps) !== JSON.stringify(wantReps))
      T.bad.push(`${a.tw}wk ${a.arm} build prescribes reps ${gotReps.join(',')} but Table 6 derives ${wantReps.join(',')}`);
    const tg = cards.map(c => c.dose && c.dose.tgt);
    for (let k = 1; k < tg.length; k++) if (tg[k] > tg[k - 1]) T.bad.push(`${a.tw}wk build target got slower at W${cards[k].w}`);
    a.want.forEach((w, k) => { if (isCutback(w, a.tw) && k > 0 && tg[k] !== tg[k - 1]) T.bad.push(`${a.tw}wk W${w} is a cutback and must hold W${w - 1}'s target`); });
    const tap = a.want.map((w, k) => (handIsTaper(w, a.tw) ? tg[k] : null)).filter(v => v !== null);
    if (tap.length > 1 && tap.some(v => v !== tap[0])) T.bad.push(`${a.tw}wk taper weeks must hold one target, logged ${tap.join(',')}`);
  }
  return T;
}

// ── other configs ────────────────────────────────────────────────────────────────────────────────────────────────────
/** Mario's goal-length pace block (no test pin): an 8:00 mile, 10:00 over 1.5 mi, 11 weeks, seed 76308. */
const marioPace = () => ({ name: 'M', primaryPath: 'goal', cardioTypes: ['run'],
  cardioGoals: { run: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi',
    targetMins: '10', targetSecs: '0', mileBestMins: '8', mileBestSecs: '0', baseline: '' } },
  eventTargeted: false, liftingFocus: 'support_prevention', experience: 'intermediate', ageBracket: '18-35',
  equipment: 'full_gym', unit: 'lbs', restDays: ['sun', 'wed'], days: DAYS.slice(),
  bench: 185, squat: 255, deadlift: 315, seed: 76308 });
/** The same block on Mario's crossfit gear with a 3 mi baseline (the INT reps fixture). */
const marioPaceCrossfit = () => ({ name: 'M', primaryPath: 'goal', cardioTypes: ['run'],
  cardioGoals: { run: { id: 'run_pace_goal', label: 'Pace', targetDist: '1.5', targetMins: '10',
    targetSecs: '0', mileBestMins: '8', mileBestSecs: '0', baselineDist: '3', baseline: '3mi' } },
  eventTargeted: false, liftingFocus: 'support_prevention', experience: 'intermediate',
  ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs', restDays: ['sun', 'wed'],
  days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: 76308 });
const GOAL_BASE = { primaryPath: 'goal', eventTargeted: false, liftingFocus: 'support_prevention',
  experience: 'intermediate', ageBracket: '18-35', equipment: 'full_gym', unit: 'lbs',
  restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 185, squat: 255, deadlift: 315, seed: 76308 };
const swimMile = () => Object.assign({ name: 'S', cardioTypes: ['swim'],
  cardioGoals: { swim: { id: 'swim_mile', label: 'Swim a Mile', baseline: '400 yd', baselineDist: '400' } } }, clone(GOAL_BASE));
const bikeGoal = (goalId, baseMin) => Object.assign({ name: 'B', cardioTypes: ['bike'],
  cardioGoals: { bike: { id: goalId, label: goalId, baseline: baseMin + ' min', baselineDist: String(baseMin) } } }, clone(GOAL_BASE));
/** The four bike goals the readers are checked on, with their baseline minutes. */
const BIKE_GOALS = [['bike_50', 40], ['bike_century', 60], ['bike_base', 30], ['bike_cals', 25]];

/** run_base on HALF_MANNY's lifts, intermediate, 55+, a 0.1 mi baseline, rest Sunday and Wednesday, seed 76308. */
const runBase55 = (fixture, evt) => Object.assign(clone(fixture), { name: 'RB', primaryPath: 'fitness', cardioTypes: ['run'],
  cardioGoals: { run: { id: 'run_base', label: 'Build Running Base', baselineDist: '0.1', baseline: '0.1mi' } },
  eventTargeted: evt, raceDate: evt ? '2027-06-01' : '', experience: 'intermediate', ageBracket: '55+',
  restDays: ['sun', 'wed'], seed: 76308 });
/** PRT TING as the run path measure built it (11:00 over 1.5 mi, balanced, home gear, a 2026-09-21 start). */
const prtRunPath = over => Object.assign({
  primaryPath: 'event', eventTargeted: true, raceDate: '2026-10-19', cardioTypes: ['run'],
  cardioGoals: { run: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal',
    mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' },
    targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' } },
  liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35',
  equipment: 'home_full', unit: 'lbs', restDays: ['sun', 'wed'], days: DAYS.slice(),
  bench: 185, squat: 255, deadlift: 315, name: 'PRT TING', startDate: '2026-09-21', seed: 24865 }, over || {});
/** A beginner 36-54 pace goal with a bike_50 goal: 14 weeks, no event, so its run LI cards reach Table 6 rows 13 and 14. */
const paceAndBike = fixture => Object.assign(clone(fixture), { name: 'PG', primaryPath: 'fitness', cardioTypes: ['run', 'bike'],
  cardioGoals: { run: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15',
    targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' }, bike: { id: 'bike_50', label: 'bike_50' } },
  eventTargeted: false, raceDate: '', experience: 'beginner', ageBracket: '36-54', restDays: ['sun', 'wed'], seed: 76308 });

/** A series by week (1..totalWeeks) of what `read` gives on the cards `pred` picks, '-' for a week with none. */
function seriesOf(prog, pred, read) {
  const s = [];
  for (let w = 1; w <= prog.totalWeeks; w++) {
    const hits = [];
    for (const d of DAYS) for (const c of cardsOfDay(prog.weeks[w] && prog.weeks[w][d])) if (pred(c)) hits.push(read(String(c.detail || '').replace(/\s+/g, ' ')));
    s.push(hits.length ? hits.join('/') : '-');
  }
  return s;
}

// ── the copy rule on the four cardio builders (D109) ─────────────────────────────────────────────────────────────────
// Mario's standing copy rule: no mid-sentence em-dash and no letter-hyphen-letter compound in athlete copy.
const EM = '—';
const HY = /[A-Za-z]-[A-Za-z]/;
const breaksCopyRule = s => { const t = String(s || ''); return t.indexOf(EM) >= 0 || HY.test(t); };
const BUILDERS = { run: 'buildRunSession', nrc: 'buildNRCSession', bike: 'buildBikeSession', swim: 'buildSwimSession' };
/** A builder's body: "function name(" to the first line that opens with "}". */
function builderBody(src, fn) {
  const head = 'function ' + fn + '(';
  const n = src.split(head).length - 1;
  if (n !== 1) return { err: head + ' appears ' + n + ' times' };
  const a = src.indexOf(head), re = /^\}/mg; re.lastIndex = a;
  const m = re.exec(src);
  return m ? { text: src.slice(a, m.index + 1) } : { err: 'no closing line after ' + head };
}
/** The body with comments removed (newlines kept), and every string literal and template text chunk with its line. */
function scanLiterals(t) {
  const REGEX_PREV = '(,=:[!&|?{};+-*%<>~^';
  const REGEX_WORDS = /(?:^|[^\w$])(return|typeof|case|in|of|new|delete|void|throw|else|do)$/;
  let i = 0, line = 0, out = '';
  const lits = [];
  const lastSig = () => out.replace(/\s+$/, '');
  function readQuoted(q) {
    const start = line; let s = ''; i++;
    while (i < t.length && t[i] !== q) {
      if (t[i] === '\\') { s += t[i] + (t[i + 1] || ''); i += 2; continue; }
      if (t[i] === '\n') line++;
      s += t[i]; i++;
    }
    i++;
    lits.push({ line: start, text: s });
    out += q + s + q;
  }
  function readTemplate() {
    let start = line, s = ''; out += '`'; i++;
    while (i < t.length && t[i] !== '`') {
      if (t[i] === '\\') { s += t[i] + (t[i + 1] || ''); out += t[i] + (t[i + 1] || ''); i += 2; continue; }
      if (t[i] === '$' && t[i + 1] === '{') { lits.push({ line: start, text: s }); s = ''; out += '${'; i += 2; code(true); out += '}'; i++; start = line; continue; }
      if (t[i] === '\n') line++;
      s += t[i]; out += t[i]; i++;
    }
    lits.push({ line: start, text: s }); out += '`'; i++;
  }
  function readRegex() {
    let inClass = false; out += '/'; i++;
    while (i < t.length) {
      const c = t[i];
      if (c === '\\') { out += c + (t[i + 1] || ''); i += 2; continue; }
      if (c === '\n') break;
      if (c === '[') inClass = true; else if (c === ']') inClass = false;
      else if (c === '/' && !inClass) { out += c; i++; break; }
      out += c; i++;
    }
    while (i < t.length && /[a-z]/.test(t[i])) { out += t[i]; i++; }
  }
  function code(stopAtBrace) {
    let depth = 0;
    while (i < t.length) {
      const c = t[i], d = t[i + 1];
      if (c === '/' && d === '/') { while (i < t.length && t[i] !== '\n') i++; continue; }
      if (c === '/' && d === '*') {
        i += 2;
        while (i < t.length && !(t[i] === '*' && t[i + 1] === '/')) { if (t[i] === '\n') { line++; out += '\n'; } i++; }
        i += 2; continue;
      }
      if (c === "'" || c === '"') { readQuoted(c); continue; }
      if (c === '`') { readTemplate(); continue; }
      if (c === '/') {
        const s = lastSig(), p = s.slice(-1);
        if (!p || REGEX_PREV.indexOf(p) >= 0 || REGEX_WORDS.test(s)) { readRegex(); continue; }
      }
      if (c === '{') depth++;
      if (c === '}') { if (stopAtBrace && depth === 0) return; depth--; }
      if (c === '\n') line++;
      out += c; i++;
    }
  }
  code(false);
  return { code: out, lits };
}
/** A line that names a session (assigns `subtype` or `phaseTag`) is a name, not a sentence, and is out of the rule. */
const ASSIGNS_NAME = /\b(subtype|phaseTag)\s*(\+?=(?!=)|:)/;
/** The copy rule audit of one builder body: em-dash lines and letter-hyphen-letter literals, names excluded. */
function copyRuleAudit(bodyText) {
  const sc = scanLiterals(bodyText), lines = sc.code.split('\n');
  const skip = new Set(); lines.forEach((l, j) => { if (ASSIGNS_NAME.test(l)) skip.add(j); });
  const em = [], hy = [];
  lines.forEach((l, j) => { if (!skip.has(j) && l.indexOf(EM) >= 0) em.push(l.trim().slice(0, 70)); });
  sc.lits.forEach(x => { if (!skip.has(x.line) && HY.test(x.text)) hy.push(x.text.slice(0, 70)); });
  return { lits: sc.lits.length, em, hy };
}

// Coach's D109 replacement table (tests/measure/v206_d109_table.txt, 56 entries, the ruled record, sha256 pinned) and the
// later rulings that rewrote some of its new texts: D103a renamed the run heads (CHI: is LI:, INT: is SI:), D110a and
// D187 rewrote three swim INT notes, D186 wrote entry 21 once per branch of its copy guard (so it appears twice).
const D109_TABLE = path.join(REPO, 'tests', 'measure', 'v206_d109_table.txt');
const D109_TABLE_SHA256 = '8dfe5e17e8b0bad0ca7838dc834030690afa9ceccb1f3ceb538ff4d2c9918894';
const D109_RANGE = { run: [1, 22], nrc: [23, 37], bike: [38, 45], swim: [46, 56] };
const D109_SUPERSEDED = [
  { ruling: 'D103a', entry: 20, was: 'CHI: Zone 3-4 (85-95% max HR). Hard sustained effort at tempo pace.',
    now: 'LI: Zone 3-4 (85-95% max HR). Hard sustained effort at tempo pace.' },
  { ruling: 'D103a', entry: 21, was: 'INT: Pace moves ${pp._weeklyGain} seconds per mile each week.',
    now: 'SI: Pace moves ${pp._weeklyGain} seconds per mile each week.' },
  { ruling: 'D103a', entry: 22, was: 'INT: Zone 5 (95%+ max HR) on work efforts.', now: 'SI: Zone 5 (95%+ max HR) on work efforts.' },
  { ruling: 'D110a', entry: 53,
    was: 'INT: Split capped at +${swimPace._weeklyGain}s/100/week (safe progression limit). Full goal of ${fmt(swimPace._originalTarget)}/100 needs more time. The realistic target for this block is',
    now: 'INT: Split moves ${swimPace._weeklyGain} seconds per 100 each week. That is the safe rate for your experience and age. Your full goal of ${_goalPhrase} needs more weeks than this block has. The target for this block is' },
  { ruling: 'D110a', entry: 54, was: 'INT: 100 repeats at your target split. Start at 4, build to 10. Hard cap at 10.',
    now: 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8.' },
  { ruling: 'D110a', entry: 55, was: 'INT: 100 yard repeats. Start at 4, build to 10. Hard cap at 10.',
    now: 'INT: 100 yard repeats. Start at 4, build to 8. Hard cap at 8.' },
  { ruling: 'D186', entry: 21, n: 2, was: 'SI: Pace moves ${pp._weeklyGain} seconds per mile each week.',
    now: 'SI: Pace moves ${pp._weeklyGain} seconds per mile each week.' },
  { ruling: 'D187', entry: 53,
    was: 'INT: Split moves ${swimPace._weeklyGain} seconds per 100 each week. That is the safe rate for your experience and age. Your full goal of ${_goalPhrase} needs more weeks than this block has. The target for this block is',
    now: 'INT: Split moves ${swimPace._weeklyGain} seconds per 100 each week. Your full goal of ${_goalPhrase} needs more weeks than this block has. The target for this block is' },
];
/**
 * The table's 56 entries as they stand today ({n, old, neu, gone, by}), with each supersession applied in order, or
 * {err}. A supersession whose "was" is not the entry's text at that point is an error: the two would describe
 * different strings.
 */
function d109Entries() {
  if (!fs.existsSync(D109_TABLE)) return { err: 'table file missing' };
  const raw = fs.readFileSync(D109_TABLE);
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  if (sha !== D109_TABLE_SHA256) return { err: 'table sha256 ' + sha.slice(0, 12) + ' is not the ruled table' };
  const L = raw.toString('utf8').split('\n'); if (L[L.length - 1] === '') L.pop();
  const ents = []; let k = 0;
  while (k < L.length) {
    const m = /^@@ (\d+)$/.exec(L[k]); if (!m) return { err: 'bad header at table line ' + (k + 1) };
    const o = [], nw = []; k++;
    while (k < L.length && L[k] !== '--') o.push(L[k++]);
    k++;
    while (k < L.length && !/^@@ \d+$/.test(L[k])) nw.push(L[k++]);
    ents.push({ n: +m[1], old: o.join('\n'), neu: nw.join('\n'), gone: [] });
  }
  if (ents.length !== 56) return { err: 'table parses to ' + ents.length + ' entries, want 56' };
  const bad = [];
  for (const s of D109_SUPERSEDED) {
    const e = ents[s.entry - 1];
    if (e.neu !== s.was) { bad.push('#' + s.entry + ' (' + s.ruling + ') supersedes text the entry does not hold'); continue; }
    ents[s.entry - 1] = { n: s.n !== undefined ? s.n : e.n, old: e.old, neu: s.now,
      gone: s.was === s.now ? e.gone : e.gone.concat([s.was]), by: s.ruling };
  }
  return bad.length ? { err: bad.join('; ') } : { ents };
}

module.exports = {
  DAYS, clone,
  GUIDE_A, GUIDE_A_TABLES, GUIDE_B, doctrineText, needsDoctrine, table6FromText,
  T6_CHI, T6_INT_RAW, REPS_CEILING, t6Chi, t6IntRaw, t6Int, isCutback, chiCutOf, runChi, intReps, v115Chi, v115Int, pieces,
  SEC_PER_400_FASTER, QUARTERS_PER_MILE, INT_SUB, METRES_PER_MILE, REC_LO_X, REC_HI_X, WARMUP, clk, toSec, handRec, handRecTxt, MID_DASH,
  handTaperWks, handIsTaper, handBuildWks, handCrossover, handRepsT6, HAND_REPS_ROWS, PACE_CAP_INT_18_35, handPaceRow,
  ruledIntDetail, RULED_SI_NOTE, SI, LI,
  prtBase, paceGoal, mileGoal, paceLattice, FRACTIONAL, PINNED, PACE_REPS, GENERIC,
  SPACER7, deriveSpacers, threeRunCalendars, cardsOfDay, runSessions, siCards, armOf, intDoctrineAudit, intCardRuleAudit,
  marioPace, marioPaceCrossfit, swimMile, bikeGoal, BIKE_GOALS, runBase55, prtRunPath, paceAndBike, seriesOf,
  EM, HY, breaksCopyRule, BUILDERS, builderBody, scanLiterals, copyRuleAudit, D109_RANGE, d109Entries,
};
