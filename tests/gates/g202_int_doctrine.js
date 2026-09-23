// g202_int_doctrine.js — V202 slice 3 (D111 = E8, E10, E11) as amended by slice 6.
// E9 (D105 sequencing) was REVERTED by ruling in slice 6 and its rows are gone: the walk
// limb fired on 0 of 54 blocks, so it was a rule that could not trip. D105 moves to D114/D115.
//
// D112 governs which guide each claim comes from. Guide A rules wherever A speaks;
// guide B fills A's silences only.
//   A = doctrine/physicaltrainingguide2020.txt
//     251-252  "For running, your 400m interval pace should be about 4 seconds faster
//              than your base pace"                                   -> E8
//     259-263  "Your first Short Interval workout should consist of 4 repeats, and build
//              progressively toward completing 8 intervals... When you can complete all 8
//              intervals at high intensity, work on gradually performing the intervals a
//              little faster each week."                              -> D3b (the 4-to-8 ramp)
//     248-249  "allowing a recovery period of 2-2.5 times the amount of time it takes to
//              perform the work interval"
//     268-270  "(2-2.5 x the work time). To promote faster, more complete recovery, use
//              active recovery."                                      -> E10
//   A tables, HAND-TRANSCRIBED FROM SCREENSHOTS (not OCR):
//     doctrine/ptg2020_tables_p13_14_16_17.txt lines 9 and 41
//              "Recovery period: 2-2.5 x the work time"               -> E10
//   B = doctrine/nsw_ptg_sealswcc_11pg.txt p8 (A is SILENT on warm-up)
//              "For CHI and INT workouts, you should warm up for 10-15 minutes or more.
//              Gradually build intensity from an easy jog... Then add 4-5 high-intensity
//              bursts lasting from 15 to 30 seconds."                 -> E11
//
// ORACLE — independent of the engine by construction:
//   * 16 s/mi is TYPED HERE from A 251-252: 4 seconds per 400m, and A's own text calls a
//     400m a quarter mile, so four quarters carry 4 x 4 = 16 seconds per mile. The gate
//     never asks the app what its constant is.
//   * every expected pace is hand arithmetic on the progression array pinned by
//     g202_pace_anchor.js, which is itself derived from the athlete's ENTERED fields.
//   * the recovery band is hand arithmetic: tgt s/mi x 400 / 1609.344 metres-per-mile,
//     then x2 and x2.5, rounded. 1609.344 is a unit, typed here, not read from the app.
//   * the sequencing rule is applied HERE, in this file, to the rep grid. Rep counts are
//     NOT changed by this slice, so reading them is reading a quantity this build did not
//     write; the gate then computes what the pace SHOULD do and compares.
//   * every expected sentence is typed verbatim from coach's ruling.
//
// V204 slice 7 (D126): the lattice gains ONE named config, a 6:46 mile at seed 76308, and
// D10 at the foot of this file. Until that config existed nothing here reached a goal pace
// that carries across the minute, so this gate could not fail on the ":60" defect D126
// fixed. It fails on V203 now, which is the point of the row.
//
// V205 slice 15 (D122, pin shape): D7 stopped being six weeks of literals and became the
// RULE, applied to each build's own week grid. It now passes on V204 and on V205 by
// reading the era table below, and the three-run arm is a LICENCE that refuses above
// ia-version 205. Nothing in index.html moved for this amendment.
//
// Usage: node tests/gates/g202_int_doctrine.js [artifact]
// Prints PASS n FAIL n. Expected to FAIL on V201 and on the slice-2 artifact: neither
// carries E8-E11.

const path = require('path');
const fs = require('fs');
const { load, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);

let PASS = 0, FAIL = 0;
function ok(cond, msg){ if(cond){ PASS++; console.log('  ok   ' + msg); } else { FAIL++; console.log('  FAIL ' + msg); } }

console.log('g202 INT doctrine — artifact ia-version ' + IA.version);

// ── the doctrine constants, typed ────────────────────────────────────────────
const SEC_PER_400_FASTER = 4;                 // A 251-252
const QUARTERS_PER_MILE  = 4;                 // A's own "400m (1/4 mile)"
const INT_SUB            = SEC_PER_400_FASTER * QUARTERS_PER_MILE;   // 16 s/mi
const METRES_PER_MILE    = 1609.344;          // unit
const REC_LO_X = 2, REC_HI_X = 2.5;           // A 248-249 and the two table headers
const REPS_CEILING = 8;                       // A 259-263
const WARMUP = 'Warm up 10 to 15 minutes. Build from an easy jog. Add 4 to 5 bursts of 15 to 30 seconds. Cool down until breathing is easy.';

const clk = t => { const v = Math.round(t); return Math.floor(v/60) + ':' + String(v%60).padStart(2,'0'); };
const handRec = tgt => {
  const work = tgt * 400 / METRES_PER_MILE;
  return { lo: Math.round(work * REC_LO_X), hi: Math.round(work * REC_HI_X), work };
};
const handRecTxt = tgt => { const r = handRec(tgt);
  return 'Recovery: ' + clk(r.lo) + ' to ' + clk(r.hi) + ' of easy jogging or walking. Keep moving.'; };

// ── THE HAND ORACLE FOR CARD COUNT, REPS AND PACE (D122, V205 slice 15) ──────
// Everything below is TYPED HERE and derived HERE. Not one line of it calls the engine
// and compares the answer to itself. The Table 6 column is transcribed from the guide,
// Guide A's ceiling is the REPS_CEILING already typed at the top of this file from A
// 259-263, and the cutback, taper and crossover arithmetic is the ruled arithmetic
// written out as arithmetic. A mutation inside the app moves one side of every
// comparison below and one side only.

// Guide B, Table 6, the "Run/Swim (reps)" column, weeks 1 through 26, transcribed:
//   4 4 5 5 6 6 7 7 8 8 9 9 then 10 from week 13 to week 26.
// Line 61 of that page is the table's own tail rule (">26: do not increase"), which is
// why the reader below clamps the WEEK at 26 and reads row 26 forever after.
const T6_INT_RAW = [null, 4,4, 5,5, 6,6, 7,7, 8,8, 9,9, 10,10,10,10,10,10,10, 10,10,10,10,10,10,10];
const t6Raw  = w => T6_INT_RAW[Math.max(1, Math.min(Math.round(w) || 1, 26))];
// Guide A's ceiling sits OVER the table: start at 4, build progressively to 8, and past 8
// work on pace rather than on more repeats. Table 6's raw column reaches 9 at week 11 and
// 10 at week 13; A's cap holds the prescription at 8 from week 9 onward.
const t6Int  = w => Math.min(REPS_CEILING, t6Raw(w));

// The three week-shape predicates, as arithmetic.
const handTaperWks  = tw => Math.max(2, Math.round(tw * 0.12));     // event-targeted, non-base
const handIsTaper   = (w, tw) => w > tw - handTaperWks(tw);
const handIsCutback = (w, tw) => tw >= 10 && w % 4 === 0 && w !== tw;
const handBuildWks  = tw => tw - handTaperWks(tw);
// The compressed quality slot's crossover: first CHI week. NRC's 5K crosses at 5-of-8 and
// its 10K at 4-of-8; 0.55 splits them, floor of 3 so a short block still gets a real
// interval phase. This is the V115 mechanism, not doctrine, and the licence below says so.
const handCrossover = tw => Math.max(3, Math.ceil((tw || 6) * 0.55));

// REPS, V205 (Table 6): the calendar row, under A's ceiling, then the cutback branch,
// then the taper branch. Cutback steps back ~40% off the PRIOR week's build value and
// never progresses; taper holds intensity and cuts volume to 55%.
const handRepsT6 = (w, tw) => {
  const b = handIsCutback(w, tw) ? Math.max(3, Math.round(t6Int(w - 1) * 0.6)) : t6Int(w);
  return handIsTaper(w, tw) ? Math.max(2, Math.round(b * 0.55)) : b;
};
// REPS, <=V204 (V115 position ramp): 4 -> 8 spread by POSITION across a span, not by
// calendar week. The same cutback and taper branches sit over it.
const handRepsV115 = (w, tw, span) => {
  const s = Math.max(2, span || tw || 6);
  const ramp = x => Math.min(REPS_CEILING, 4 + Math.floor((x - 1) * 4 / Math.max(s - 1, 1)));
  const b = handIsCutback(w, tw) ? Math.max(3, Math.round(ramp(w - 1) * 0.6)) : ramp(w);
  return handIsTaper(w, tw) ? Math.max(2, Math.round(b * 0.55)) : b;
};

// PACE, the D101/D111 clock. D101: one safe rate, the age-scaled table value IS the cap,
// so an intermediate at 18-35 walks 5 s/mi/wk and never faster. D111: the INT target is
// that week's goal pace less A's 16 s/mi. Three limbs, and all three are load-bearing:
//   * the build weeks step by the gain;
//   * THE TAPER HOLDS. Taper weeks freeze at the realistic target, which is one whole
//     step BELOW the last build week and is then repeated. Extending the ramp linearly
//     through the taper is wrong: measure's own first pass did exactly that and produced
//     443 for an 11-week W11 where the engine and the ruling both say 448.
//   * a cutback week holds the PRIOR card's target, which is the sentence it prints.
const PACE_CAP_INT_18_35 = 5;                 // D101, intermediate x age scale 1.0
const handPaceRow = (anchor, goalPace, tw) => {
  const target = Math.min(goalPace, anchor);  // a goal already met parks the clock flat
  const bw     = handBuildWks(tw);
  const gain   = Math.min((anchor - target) / Math.max(bw, 1), PACE_CAP_INT_18_35);
  const real   = +(anchor - gain * bw).toFixed(1);
  const tgt = [];
  for(let w = 1; w <= tw; w++){
    const a = (w > bw) ? real : +(Math.max(anchor - gain * bw, anchor - gain * (w - 1))).toFixed(1);
    tgt.push(Math.round(a - INT_SUB));
  }
  for(let w = 2; w <= tw; w++) if(handIsCutback(w, tw)) tgt[w - 1] = tgt[w - 2];
  return tgt;
};

// The five ANCHORS the pace rows need, hand-derived from the athlete's entered mile and
// the pace chart the same way g202_pace_anchor.js derives its PIN. Four of them need no
// interpolation at all: an entered mile that lands ON a chart row, read at the MILE
// column, IS that row's mile value. Only the 3-mile goal interpolates, and its two
// bracketing columns are typed here.
const CHART_ROW_5_30 = { mile: 330, fiveK: 360 };   // the 5:30 row, mile and 5K columns
const COL_D_MILE = 1, COL_D_5K = 3.107;             // the columns' true distances in miles
const handRowPaceAt3mi = (row) =>
  row.mile + (row.fiveK - row.mile) * (Math.log(3 / COL_D_MILE) / Math.log(COL_D_5K / COL_D_MILE));

// ── the doctrine text itself, when the gitignored OCR is present ─────────────
(function(){
  const A = path.join(__dirname, '..', '..', 'doctrine', 'physicaltrainingguide2020.txt');
  const T = path.join(__dirname, '..', '..', 'doctrine', 'ptg2020_tables_p13_14_16_17.txt');
  const B = path.join(__dirname, '..', '..', 'doctrine', 'nsw_ptg_sealswcc_11pg.txt');
  if(!fs.existsSync(A) || !fs.existsSync(T) || !fs.existsSync(B)){
    console.log('  note  doctrine/*.txt absent (gitignored) — the quoted lines above are the oracle of record');
    return;
  }
  const a = fs.readFileSync(A, 'utf8'), t = fs.readFileSync(T, 'utf8'), b = fs.readFileSync(B, 'utf8');
  ok(a.indexOf('400m interval pace should be about 4 seconds') >= 0,
    'A0 guide A still says the 400m interval pace is about 4 seconds faster than base pace (A 251-252) — the source of the 16 s/mi above');
  ok(a.indexOf('build progressively toward \ncompleting 8 intervals') >= 0 || a.indexOf('completing 8 intervals') >= 0,
    'A0b guide A still says build progressively toward completing 8 intervals (A 259-263) — the source of the 4-to-8 ramp D3b pins');
  ok((t.match(/Recovery period: 2-2\.5 x the work time/g) || []).length === 2,
    'A0c both HAND-TRANSCRIBED Short Interval table headers still read "Recovery period: 2-2.5 x the work time" — the source of E10');
  ok(b.indexOf('warm up for 10-15 minutes or more') >= 0 && b.indexOf('4-5 high-intensity bursts lasting from 15 to 30 seconds') >= 0,
    'A0d guide B p8 still carries the CHI/INT warm-up A is silent on (D112 limb 2) — the source of E11');
})();

// ── lattice ──────────────────────────────────────────────────────────────────
const base = (o) => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'], eventTargeted:true,
  raceDate:'2026-10-19', liftingFocus:'support_prevention', experience:'intermediate',
  ageBracket:'18-35', equipment:'full_gym', unit:'lbs',
  restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:185, squat:245, deadlift:315, seed:24865 }, o||{});
const paceGoal = (g, over) => base(Object.assign({ cardioGoals:{ run: Object.assign(
  { id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi', baselineDist:'3', baseline:'3mi' }, g) } }, over||{}));

function runSessions(prog){
  const out = [];
  const wks = prog.weeks || {};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
    const day = wks[w][d]; if(!day) return;
    let c = day.cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(s => { if(s && s.type === 'run')
      out.push({ w:+w, d, st:s.subtype||'', detail:s.detail||'', dose:s.dose||null }); });
  }));
  return out;
}
const ints = prog => runSessions(prog).filter(r => /Interval \(INT\)/.test(r.st));

const LAT = [];
for(const [mm,ss] of [['5','30'],['6','30'],['8','15'],['9','30'],['11','00'],['12','00']])
  for(const dist of ['1','1.5','3'])
    for(const seed of [24865, 777, 31337])
      LAT.push(paceGoal({ targetDist:dist, targetMins:'10', targetSecs:'30', targetTime:'10:30',
        mileBestMins:mm, mileBestSecs:ss, mileBestSrc:{kind:'entered'} }, { seed }));

// ── the fractional-pace row (D126, V204 slice 7) ─────────────────────────────
// COVERAGE, stated out loud rather than smuggled in as one more lattice point. Every
// config above lands on a goal pace a whole second away from the minute, so a formatter
// that splits the minutes off BEFORE it rounds the seconds prints exactly what one that
// rounds first prints. That is why the ":60" defect D126 names survived this gate on
// V203: not because a row was wrong, but because nothing here could reach the carry.
// This config reaches it. A 6:46 mile (406 s) at seed 76308 walks the INT goal pace onto
// 419.5 s/mi. Rounded first, 419.5 -> 420 s/mi -> "7:00/mi". Split first, it prints
// floor(419.5/60) = 6 and round(59.5) = 60, which is "6:60/mi" — the string V203 shipped
// on this very config, and not a time at all.
// Its purpose is written down in D10 at the foot of this file, and D10c fails loudly if
// the config ever stops reaching the carry.
const FRACTIONAL = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'6', mileBestSecs:'46', mileBestSrc:{kind:'entered'} }, { seed:76308 });
LAT.push(FRACTIONAL);

// ═════════════════════════════════════════════════════════════════════════════
// D1 — the subtraction IS A's, and it is not a proportion
// ═════════════════════════════════════════════════════════════════════════════
// The gate does not need the engine's progression array: for every INT card the app
// prints BOTH the prescribed interval pace and the goal pace it was derived from
// ("This week's goal pace is M:SS/mi", the sentence coach ruled in slice 6). The gap between those two
// printed numbers must be exactly INT_SUB, whatever the athlete's speed. A proportion
// cannot hold a constant gap across a 5:30 mile and a 12:00 mile; that is the whole
// reason D111 replaced it.
const toSec = p => { const m = /^(\d+):([0-5]\d)$/.exec(p); return m ? +m[1]*60 + +m[2] : null; };
let d1bad = [], d1n = 0, d1spanLo = 1e9, d1spanHi = -1e9;
for(const cfg of LAT){
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ d1bad.push('build crash: ' + e.message); continue; }
  for(const r of ints(prog)){
    const m = /at (\d+:[0-5]\d)\/mi\. This week's goal pace is (\d+:[0-5]\d)\/mi\./.exec(r.detail);
    if(!m) continue;                       // cutback cards quote no goal; covered by D3
    d1n++;
    const got = toSec(m[1]), goal = toSec(m[2]);
    d1spanLo = Math.min(d1spanLo, goal); d1spanHi = Math.max(d1spanHi, goal);
    if(Math.abs((goal - got) - INT_SUB) > 1)
      d1bad.push(`goal ${m[2]} printed ${m[1]} gap ${goal-got}s want ${INT_SUB}s`);
  }
}
ok(d1n > 0 && d1bad.length === 0,
  `D1 across ${d1n} INT cards the prescribed pace is exactly ${INT_SUB} s/mi faster than the goal pace printed beside it `
  + `(A 251-252: 4 s per 400m x 4 quarters), over goals spanning ${clk(d1spanLo)} to ${clk(d1spanHi)}/mi`
  + (d1bad.length ? ' — first miss: ' + d1bad[0] : ''));

// the proportion and the subtraction must DISAGREE somewhere in this lattice, or D1 is
// passing on a coincidence rather than on the rule.
let d1diverge = 0;
for(const g of [330, 390, 480, 570, 660, 720]) if(Math.abs((g - INT_SUB) - g*0.95) > 1) d1diverge++;
ok(d1diverge >= 4,
  `D1b the old x0.95 and A's minus ${INT_SUB} disagree by more than a second at ${d1diverge} of 6 hand goal paces, `
  + `so D1 distinguishes the two rules rather than passing on both`);

// ═════════════════════════════════════════════════════════════════════════════
// D2 — the PTG 400m oracle, in A's own units, residual zero
// ═════════════════════════════════════════════════════════════════════════════
// A prescribes in seconds per 400m, the app prescribes in seconds per mile. Convert the
// pinned week-1 goal pace to A's units, apply A's 4-second subtraction there, convert
// back, and the two routes must land on the same second.
const PIN_W1_GOAL = 509.3;                  // g202_pace_anchor.js PIN.arr[0], hand-derived there
const oracle400 = (PIN_W1_GOAL / QUARTERS_PER_MILE) - SEC_PER_400_FASTER;   // 123.325 s per 400m
const oracleMile = oracle400 * QUARTERS_PER_MILE;                            // 493.3 s per mile
const ruledMile  = PIN_W1_GOAL - INT_SUB;
ok(Math.abs(oracleMile - ruledMile) < 1e-9,
  `D2 the PTG oracle in A's units (${PIN_W1_GOAL.toFixed(1)}/4 = ${(PIN_W1_GOAL/4).toFixed(2)} s per 400m, less `
  + `${SEC_PER_400_FASTER} s = ${oracle400.toFixed(2)}, x4 = ${oracleMile.toFixed(1)} s/mi) and the ruled per-mile `
  + `subtraction agree to ${Math.abs(oracleMile - ruledMile).toExponential(0)} s residual`);

// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// D3 — D111's identity, on the card AND in the log
// ═════════════════════════════════════════════════════════════════════════════
// E9 (D105's sequencing) was REVERTED in V202 slice 6 by ruling: its walk limb fired on
// 0 of 54 blocks, because getINTReps first returns 8 at w === the INT span, so the 8-rep
// week is always the LAST INT week and there was nothing after it to walk. A rule that
// cannot trip is a pin that defends nothing (standing ruling 3). D105 is re-sited on
// D114/D115, where a table puts the 8-rep week in the phase INTERIOR.
// What this row asserts instead is D111's identity, which D1 proves on the two PRINTED
// numbers and this row proves between the printed number and the LOGGED one:
//   * a non-cutback card's dose.tgt is the goal pace it prints, less A's 16 s/mi;
//   * a cutback card holds the PRIOR card's target, which is the sentence it prints;
//   * inside a block the target never gets slower.
// One second of slack, and no more: both surfaces round the same fractional second.
let d3bad = [], d3blocks = 0, d3cards = 0, d3cut = 0, d3steps = 0;
for(const cfg of LAT){
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ continue; }
  const cards = ints(prog).filter(r => r.dose && r.dose.tgt != null);
  if(!cards.length) continue;
  d3blocks++;
  for(let i = 0; i < cards.length; i++){
    const c = cards[i]; d3cards++;
    const m = /This week's goal pace is (\d+:[0-5]\d)\/mi/.exec(c.detail);
    if(m){
      const goal = toSec(m[1]);
      if(Math.abs(c.dose.tgt - (goal - INT_SUB)) > 1)
        d3bad.push(`W${c.w} logged ${c.dose.tgt} but prints goal ${m[1]}: gap ${goal - c.dose.tgt}s, want ${INT_SUB}s`);
    } else if(/Cutback week\. Same target as last week, fewer reps\./.test(c.detail)){
      d3cut++;
      if(i > 0 && c.dose.tgt !== cards[i-1].dose.tgt)
        d3bad.push(`W${c.w} says "same target as last week" but logs ${c.dose.tgt} against ${cards[i-1].dose.tgt}`);
    } else {
      d3bad.push(`W${c.w} INT card prints neither the goal-pace sentence nor the cutback sentence: ${c.detail.slice(0,70)}`);
    }
    if(i > 0 && c.dose.tgt > cards[i-1].dose.tgt)
      d3bad.push(`W${c.w} target got SLOWER inside the block (${cards[i-1].dose.tgt} -> ${c.dose.tgt})`);
    if(i > 0 && c.dose.tgt < cards[i-1].dose.tgt) d3steps++;
  }
}
ok(d3blocks > 0 && d3cards > 0 && d3cut > 0 && d3bad.length === 0,
  `D3 across ${d3blocks} pace-goal blocks and ${d3cards} INT cards the LOGGED target is the goal pace the card `
  + `PRINTS less ${INT_SUB} s/mi, and each of ${d3cut} cutback cards logs the same target as the week before it, `
  + `exactly as its sentence claims (${d3steps} walking steps observed, never a step backwards)`
  + (d3bad.length ? ' — first miss: ' + d3bad[0] : ''));

// D3b — the rep ramp itself, which is the OTHER half of A 259-263 and IS built.
// Rep counts are not this slice's work, so this row reads a quantity the build did not
// write and holds it against A's own numbers: the first Short Interval workout is 4
// repeats and the build tops out at 8. The SEQUENCING A also implies (speed only after
// 8 reps are complete) shipped as E9 and was reverted in slice 6 as unreachable; it is
// re-sited on a phase whose interior contains the 8-rep week. Until that is built this
// is the whole of A 259-263 that the engine claims, and REPS_CEILING says so here.
let d3bBad = [], d3bBlocks = 0, d3bTop = 0, d3bMax = 0;
for(const cfg of LAT){
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ continue; }
  const cards = ints(prog).filter(r => r.dose && r.dose.reps != null);
  if(!cards.length) continue;
  d3bBlocks++;
  if(cards[0].dose.reps !== 4)
    d3bBad.push(`first INT week prescribes ${cards[0].dose.reps} repeats, A 259-263 says 4`);
  for(const c of cards){
    d3bMax = Math.max(d3bMax, c.dose.reps);
    if(c.dose.reps > REPS_CEILING) d3bBad.push(`W${c.w} prescribes ${c.dose.reps} repeats, above A's ${REPS_CEILING}`);
  }
  if(cards.some(c => c.dose.reps === REPS_CEILING)) d3bTop++;
}
ok(d3bBlocks > 0 && d3bTop > 0 && d3bBad.length === 0,
  `D3b every one of ${d3bBlocks} blocks opens on A's 4 repeats and none exceeds A's ${REPS_CEILING} `
  + `(highest seen ${d3bMax}); ${d3bTop} blocks reach ${REPS_CEILING}, so the ceiling is a live bound and not a vacuous one`
  + (d3bBad.length ? ' — first miss: ' + d3bBad[0] : ''));

// ═════════════════════════════════════════════════════════════════════════════
// D4 — recovery is 2 to 2.5 x the work interval, and it is printed as time
// ═════════════════════════════════════════════════════════════════════════════
let d4bad = [], d4n = 0, d4ratioLo = 1e9, d4ratioHi = -1e9;
for(const cfg of LAT){
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ continue; }
  for(const r of ints(prog)){
    if(!r.dose || r.dose.tgt == null) continue;
    d4n++;
    const h = handRec(r.dose.tgt);
    if(!r.dose.rec) { d4bad.push(`W${r.w} dose carries no rec band`); continue; }
    if(r.dose.rec.lo !== h.lo || r.dose.rec.hi !== h.hi)
      d4bad.push(`W${r.w} rec ${r.dose.rec.lo}-${r.dose.rec.hi}s want ${h.lo}-${h.hi}s at tgt ${r.dose.tgt}`);
    if(r.detail.indexOf(handRecTxt(r.dose.tgt)) < 0)
      d4bad.push(`W${r.w} detail does not carry "${handRecTxt(r.dose.tgt)}"`);
    d4ratioLo = Math.min(d4ratioLo, r.dose.rec.lo / h.work);
    d4ratioHi = Math.max(d4ratioHi, r.dose.rec.hi / h.work);
  }
}
ok(d4n > 0 && d4bad.length === 0,
  `D4 across ${d4n} INT cards the recovery band equals hand arithmetic on the session's own target `
  + `(tgt x 400 / ${METRES_PER_MILE} m per mile, then x${REC_LO_X} and x${REC_HI_X}) and is printed as m:ss to m:ss`
  + (d4bad.length ? ' — first miss: ' + d4bad[0] : ''));
ok(d4n > 0 && d4ratioLo >= REC_LO_X - 0.01 && d4ratioHi <= REC_HI_X + 0.01,
  `D4b every printed band sits inside A's ${REC_LO_X} to ${REC_HI_X} x the work interval `
  + `(observed ${d4ratioLo.toFixed(3)}x to ${d4ratioHi.toFixed(3)}x; the old fixed 200m measured 0.685x, `
  + `about a third of A's minimum)`);

// ═════════════════════════════════════════════════════════════════════════════
// D5 — the fixed 200m literal is gone from the LIVE arms, and the warm-up is B's
// ═════════════════════════════════════════════════════════════════════════════
let d5old = 0, d5oldWarm = 0, d5warm = 0, d5n = 0;
for(const cfg of LAT){
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ continue; }
  for(const r of ints(prog)){
    d5n++;
    if(/walk or jog 200m/.test(r.detail)) d5old++;
    if(/5 min easy warmup \+ cooldown/.test(r.detail)) d5oldWarm++;
    if(r.detail.indexOf(WARMUP) >= 0) d5warm++;
  }
}
ok(d5n > 0 && d5old === 0,
  `D5 none of ${d5n} INT cards still prescribes the fixed "walk or jog 200m" recovery (was 11,880 of 11,880)`);
ok(d5n > 0 && d5oldWarm === 0 && d5warm === d5n,
  `D5b all ${d5n} INT cards carry guide B p8's warm-up verbatim and none carries the old "5 min easy warmup + cooldown" `
  + `(A is silent on warm-up, so B fills it: D112 limb 2)`);

// ═════════════════════════════════════════════════════════════════════════════
// D6 — the copy rule on the two new sentences
// ═════════════════════════════════════════════════════════════════════════════
const MID_DASH = /\s[—–-]\s/;
const newSentences = [WARMUP, handRecTxt(493), handRecTxt(330), handRecTxt(720)];
ok(newSentences.every(s => !MID_DASH.test(s)),
  `D6 neither new sentence carries a mid-sentence hyphen or dash (Mario's standing copy rule); `
  + `sample recovery line: "${handRecTxt(493)}"`);
// and the rule is checked on what is RENDERED, not only on the fragments: slice 6 rewrote both
// INT detail sentences and both em-dashes they carried are gone.
let d6bad = [], d6n = 0;
for(const cfg of LAT){
  let prog; try { prog = IA.buildProgram(cfg); } catch(e){ continue; }
  for(const r of ints(prog)){
    d6n++;
    if(MID_DASH.test(r.detail)) d6bad.push(`W${r.w} |${r.detail}|`);
  }
}
ok(d6n > 0 && d6bad.length === 0,
  `D6b no INT card as rendered carries a mid-sentence hyphen or dash across ${d6n} cards: the two the old `
  + `copy carried ("(cutback — holding last week's target)" and "(week N interval target — slightly faster...)") `
  + `are both gone with the slice 6 rewrite`
  + (d6bad.length ? ' — first miss: ' + d6bad[0] : ''));

// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// D7 — the INT CARD COUNT is a RULE, read off the week grid, per build
// ═════════════════════════════════════════════════════════════════════════════
// AMENDED BY D122 (V205 slice 15), pin shape. This row used to be six weeks of literals.
// V205 made the INT slot weekly (D125/D130) and the same PRT TING cfg now prints ELEVEN
// cards, so the literal went red. Writing 11 in its place would have been green and would
// have been WRONG: a scalar 11 is a number transcribed out of a failure message, and
// measure proved it false on 2,232 of 3,240 pace builds. THE PIN IS A FUNCTION, NOT A
// SCALAR. What follows is the rule, applied to each build's own week grid.
//
// THE RULE
//   * FOUR-RUN WEEKS carry ONE INT card EVERY week, cutback and taper weeks INCLUDED.
//     A four-run week with no INT card is a miss. The cutback and the taper cut the DOSE
//     and keep the CARD; that is D114 and the taper ruling as built, and it is exactly
//     why eleven weeks give eleven cards rather than nine.
//   * THREE-RUN WEEKS carry `cross - 1` cards, in weeks 1 through cross - 1, where
//     cross = max(3, ceil(tw x 0.55)). That reproduces every low count measured:
//     11 weeks -> 6, 9 weeks -> 4, 6 weeks -> 3.
//   * a build whose weeks are neither uniformly four-run nor uniformly three-run is NOT
//     skipped. It is a named miss, so an unclassified shape cannot pass quietly.
//
// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 205.
// D113 and D122 have already ruled the crossover RETIRED on the pace family, and slice 7c
// which retires it is PARKED. So the three-run arm below pins THE ARTIFACT AS SHIPPED,
// NOT THE DOCTRINE AS RULED. It is keyed on 205, a number that exists today, and the
// build that ships D113/D122 must re-pin it as "one INT and one CHI every week at three
// runs" or fail here by name. It does not expire quietly and it does not expire never.
//
// THE ERA TABLE NAMES THREE MECHANISMS, not one mechanism at two lengths. Row existence
// is a conjunct of D7, so an artifact with no row fails loudly instead of skipping.
const INT_MECHANISM_BY_VERSION = [
  { upTo: 204, arm: 'three-run', reps: 'v115',
    // SIX cards on the 11-week PRT TING cfg, because the compressed quality slot runs INT
    // weeks 1 to cross-1 and CHI thereafter. Reps come from the V115 POSITION ramp spread
    // over intSpan = cross - 1, which on this cfg is a span of 6 and gives 4,4,5,3,7,8.
    // THIS ROW IS NOT DERIVABLE FROM TABLE 6, and a future reader who tries will fail:
    // Table 6 over the same six weeks gives 4,4,5,3,6,6. The two mechanisms agree for
    // four weeks and diverge at week 5. D7c below asserts that divergence out loud so
    // this sentence cannot rot into decoration.
    note: 'V115 position ramp over intSpan; six cards; NOT Table 6' },
  { upTo: 205, arm: 'four-run', reps: 'table6',
    // ELEVEN cards on the same cfg: the INT slot is weekly, and Table 6 is read on the
    // CALENDAR week, through the cutback branch at weeks 4 and 8 and the taper branch at
    // weeks 10 and 11. That is the second mechanism.
    //
    // The THIRD mechanism is the three-run arm as it still stands on this same artifact:
    // where a pace build still lands on three run days the card count is still the V115
    // crossover's cross - 1, and that arm is LICENSED TO 205 and no further.
    note: 'Table 6 on the calendar week through the cutback and taper branches; the '
        + 'three-run arm still runs the V115 crossover and is licensed to 205' }
];
const IAV = +IA.version;
const INT_ERA = INT_MECHANISM_BY_VERSION.filter(r => IAV <= r.upTo)[0] || null;
const THREE_RUN_LICENCE_TO = 205;
if(IAV > THREE_RUN_LICENCE_TO){
  FAIL++;
  console.log('  FAIL D7-LICENCE the three-run INT card rule in this file pins cross - 1 cards, which is '
    + 'THE ARTIFACT AS SHIPPED AT ia-version ' + THREE_RUN_LICENCE_TO + ' AND NOT THE DOCTRINE AS RULED. '
    + 'D113 and D122 retired the crossover on the pace family. This artifact is ia-version ' + IAV
    + ', above the licence, so the arm must be RE-PINNED as "one INT and one CHI every week at three '
    + 'runs" by the build that ships D113/D122. Re-point nothing; rewrite the arm.');
}
const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });

// The hand rows. REPS first: a pure function of the week and the block length, so these
// four rows are derived here and typed here as the answer the function must give.
const HAND_REPS_ROWS = { 6:  [4,4,5,5,3,3],
                         9:  [4,4,5,5,6,6,7,4,4],
                         11: [4,4,5,3,6,6,7,4,8,4,4],
                         15: [4,4,5,3,6,6,7,4,8,8,8,5,8,4,4] };
// Read them: at 6 and 9 weeks there is no cutback at all, because a cutback needs a block
// of ten weeks or more; the 3,3 and the 4,4 at the tail are the TAPER branch. At 11 and 15
// the 3 at week 4 and the 4 at week 8 are cutbacks off weeks 3 and 7, the 5 at week 12 is
// a cutback off week 11's capped 8, and the tail 4,4 is the taper again.
//
// PACE next. Five representative athletes, one per shape the clock can take, each with a
// hand anchor and a hand goal; the row itself is derived by handPaceRow.
const PACE_REPS = [
  { tag: '8:15 mile, 1.5 mi goal',  anchor: 509.3064395186472, goal: 630/1.5, tw: 11,
    cfg: paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} }),
    row: [493,488,483,483,473,468,463,463,453,448,448] },
  { tag: '5:30 mile, 3 mi goal',    anchor: handRowPaceAt3mi(CHART_ROW_5_30), goal: 630/3, tw: 15,
    cfg: paceGoal({ targetDist:'3', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'5', mileBestSecs:'30', mileBestSrc:{kind:'entered'} }),
    row: [343,338,333,333,323,318,313,313,303,298,293,293,283,278,278] },
  { tag: '12:00 mile, 1 mi goal',   anchor: 720, goal: 630, tw: 9,
    cfg: paceGoal({ targetDist:'1', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'12', mileBestSecs:'00', mileBestSrc:{kind:'entered'} }),
    row: [704,699,694,689,684,679,674,669,669] },
  // BELOW the D101 cap: the gap is 30 s/mi over 7 build weeks, so the clock walks
  // 30/7 = 4.286 s/mi/wk and the cap never binds. The row is not a multiple of 5.
  { tag: '11:00 mile, 1 mi goal',   anchor: 660, goal: 630, tw: 9,
    cfg: paceGoal({ targetDist:'1', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'11', mileBestSecs:'00', mileBestSrc:{kind:'entered'} }),
    row: [644,640,635,631,627,623,618,614,614] },
  // GOAL ALREADY MET: a 5:30 miler asked for 10:30 over a mile is already faster than the
  // goal, so the working target is his own anchor, the gain is zero and the clock parks.
  { tag: '5:30 mile, 1 mi goal',    anchor: 330, goal: 630, tw: 6,
    cfg: paceGoal({ targetDist:'1', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'5', mileBestSecs:'30', mileBestSrc:{kind:'entered'} }),
    row: [314,314,314,314,314,314] }
];

const ruledDetail = g => g.cb
  ? `${g.reps}x400m at ${clk(g.tgt)}/mi. Cutback week. Same target as last week, fewer reps. `
    + handRecTxt(g.tgt) + ' ' + WARMUP
  : `${g.reps}x400m at ${clk(g.tgt)}/mi. This week's goal pace is ${clk(g.tgt + INT_SUB)}/mi. `
    + handRecTxt(g.tgt) + ' ' + WARMUP;

// ── the arm each build is in, read off ITS OWN week grid ─────────────────────
function armOf(prog){
  const wks = prog.weeks || {}, tw = prog.totalWeeks || 0;
  const per = [];
  for(let w = 1; w <= tw; w++){
    let n = 0;
    DAYS.forEach(d => { const day = wks[w] && wks[w][d]; if(!day || !day.cardio) return;
      (Array.isArray(day.cardio) ? day.cardio : [day.cardio]).forEach(s => { if(s && s.type === 'run') n++; }); });
    per.push(n);
  }
  if(!per.length) return { arm:'none', tw, per };
  if(per.every(n => n >= 4)) return { arm:'four-run', tw, per, want: Array.from({length:tw}, (_,i) => i+1) };
  if(per.every(n => n === 3)) return { arm:'three-run', tw, per,
    want: Array.from({length: handCrossover(tw) - 1}, (_,i) => i+1) };
  return { arm:'mixed', tw, per };
}

let d7bad = [], d7four = 0, d7three = 0, d7lens = {};

// D7a — the hand functions reproduce the typed rows. The oracle checks itself before it
// is allowed to judge anything: a hand row and a hand function that disagree means the
// derivation below is not the derivation written down above it.
Object.keys(HAND_REPS_ROWS).forEach(k => {
  const tw = +k, got = Array.from({length:tw}, (_,i) => handRepsT6(i+1, tw));
  if(JSON.stringify(got) !== JSON.stringify(HAND_REPS_ROWS[k]))
    d7bad.push(`hand reps row ${tw}wk derives ${got.join(',')} but is typed ${HAND_REPS_ROWS[k].join(',')}`);
});
PACE_REPS.forEach(r => {
  const got = handPaceRow(r.anchor, r.goal, r.tw);
  if(JSON.stringify(got) !== JSON.stringify(r.row))
    d7bad.push(`hand pace row "${r.tag}" derives ${got.join(',')} but is typed ${r.row.join(',')}`);
});
if(!INT_ERA) d7bad.push(`no INT_MECHANISM_BY_VERSION row covers ia-version ${IAV}: the era table must name `
  + `this artifact's mechanism before any grid below can mean anything`);

// D7b — THE RULE, on every build in the lattice plus the pinned cfg.
const D7_POP = LAT.concat([PINNED]);
for(const cfg of D7_POP){
  let prog; try { prog = IA.buildProgram(JSON.parse(JSON.stringify(cfg))); }
  catch(e){ d7bad.push('build crash: ' + e.message); continue; }
  const a = armOf(prog);
  if(a.arm === 'mixed' || a.arm === 'none'){
    d7bad.push(`${a.tw}wk build is neither uniformly four-run nor uniformly three-run (runs per week `
      + `${a.per.join(',')}): the card rule has no arm for it and it must not pass unclassified`);
    continue;
  }
  if(a.arm === 'three-run'){
    d7three++;
    if(INT_ERA && INT_ERA.arm !== 'three-run')
      d7bad.push(`${a.tw}wk build is three-run but the era row for ia-version ${IAV} names the `
        + `${INT_ERA.arm} arm as this artifact's mechanism`);
  } else {
    d7four++;
    if(INT_ERA && INT_ERA.arm !== 'four-run')
      d7bad.push(`${a.tw}wk build is four-run but the era row for ia-version ${IAV} names the `
        + `${INT_ERA.arm} arm as this artifact's mechanism`);
  }
  d7lens[a.tw] = (d7lens[a.tw] || 0) + 1;
  const cards = ints(prog);
  const gotW = cards.map(c => c.w);
  if(JSON.stringify(gotW) !== JSON.stringify(a.want))
    d7bad.push(`${a.tw}wk ${a.arm} build carries INT cards in weeks ${gotW.join(',') || '(none)'} `
      + `but the rule says ${a.want.join(',')}`
      + (a.arm === 'four-run' ? ' (one every week, cutback and taper included)'
                              : ` (cross - 1 = ${handCrossover(a.tw) - 1} cards, cross = ${handCrossover(a.tw)})`));
  // reps, by the era's mechanism
  const span = handCrossover(a.tw) - 1;
  const wantReps = a.want.map(w => (INT_ERA && INT_ERA.reps === 'v115')
    ? handRepsV115(w, a.tw, span) : handRepsT6(w, a.tw));
  const gotReps = cards.map(c => c.dose && c.dose.reps);
  if(gotW.length === a.want.length && JSON.stringify(gotReps) !== JSON.stringify(wantReps))
    d7bad.push(`${a.tw}wk ${a.arm} build prescribes reps ${gotReps.join(',')} but the `
      + `${INT_ERA ? INT_ERA.reps : '?'} mechanism derives ${wantReps.join(',')}`);
  // structural pace laws, anchor-free, on every build
  const tg = cards.map(c => c.dose && c.dose.tgt);
  for(let k = 1; k < tg.length; k++) if(tg[k] > tg[k-1])
    d7bad.push(`${a.tw}wk build target got SLOWER at W${cards[k].w} (${tg[k-1]} -> ${tg[k]})`);
  a.want.forEach((w, k) => { if(handIsCutback(w, a.tw) && k > 0 && tg[k] !== tg[k-1])
    d7bad.push(`${a.tw}wk W${w} is a cutback and must hold W${w-1}'s target (${tg[k-1]}), logged ${tg[k]}`); });
  const tap = a.want.map((w,k) => handIsTaper(w, a.tw) ? tg[k] : null).filter(v => v !== null);
  if(tap.length > 1 && tap.some(v => v !== tap[0]))
    d7bad.push(`${a.tw}wk taper weeks must all HOLD one target, logged ${tap.join(',')}`);
}

// D7c — the era row's own claim, asserted rather than asserted-in-prose: the <=204 rep
// row is NOT derivable from Table 6. The two mechanisms agree for four weeks and diverge.
const V115_11 = Array.from({length:6}, (_,i) => handRepsV115(i+1, 11, 6));
const T6_11_6 = HAND_REPS_ROWS[11].slice(0, 6);
if(JSON.stringify(V115_11) === JSON.stringify(T6_11_6))
  d7bad.push(`the era table claims the <=204 row is not derivable from Table 6, but the V115 ramp and `
    + `Table 6 agree on all six weeks (${V115_11.join(',')}): the claim has gone vacuous`);

// D7d — the pinned PRT TING grid, card by card, whole sentence, era-keyed.
const pProg  = IA.buildProgram(JSON.parse(JSON.stringify(PINNED)));
const pArm   = armOf(pProg);
const pSpan  = handCrossover(pArm.tw) - 1;
const pPace  = handPaceRow(509.3064395186472, 630/1.5, pArm.tw);
const PIN_GRID = (pArm.want || []).map(w => ({
  w, reps: (INT_ERA && INT_ERA.reps === 'v115') ? handRepsV115(w, pArm.tw, pSpan) : handRepsT6(w, pArm.tw),
  tgt: pPace[w-1], cb: handIsCutback(w, pArm.tw) }));
const pCards = ints(pProg);
if(pCards.length !== PIN_GRID.length)
  d7bad.push(`PRT TING carries ${pCards.length} INT cards, the ${INT_ERA ? INT_ERA.arm : '?'} rule derives ${PIN_GRID.length}`);
PIN_GRID.forEach((g, i) => {
  const c = pCards[i]; if(!c){ d7bad.push(`PRT TING W${g.w} missing`); return; }
  if(c.w !== g.w) d7bad.push(`PRT TING card ${i} is W${c.w} want W${g.w}`);
  if(!c.dose) { d7bad.push(`PRT TING W${g.w} no dose`); return; }
  if(c.dose.reps !== g.reps) d7bad.push(`PRT TING W${g.w} reps ${c.dose.reps} want ${g.reps}`);
  if(c.dose.tgt !== g.tgt) d7bad.push(`PRT TING W${g.w} tgt ${c.dose.tgt} want ${g.tgt}`);
  const hr = handRec(g.tgt);
  if(!c.dose.rec || c.dose.rec.lo !== hr.lo || c.dose.rec.hi !== hr.hi)
    d7bad.push(`PRT TING W${g.w} rec ${JSON.stringify(c.dose.rec)} want {lo:${hr.lo},hi:${hr.hi}}`);
  if(c.detail !== ruledDetail(g)) d7bad.push(`PRT TING W${g.w} detail\n     got  |${c.detail}|\n     want |${ruledDetail(g)}|`);
});

// D7e — the five pace representatives, absolute targets, against their hand rows.
PACE_REPS.forEach(r => {
  let prog; try { prog = IA.buildProgram(JSON.parse(JSON.stringify(r.cfg))); }
  catch(e){ d7bad.push(`pace rep "${r.tag}" build crash: ` + e.message); return; }
  const a = armOf(prog);
  if(a.tw !== r.tw){ d7bad.push(`pace rep "${r.tag}" sizes to ${a.tw} weeks, the row is derived for ${r.tw}`); return; }
  if(!a.want) return;
  const want = a.want.map(w => r.row[w-1]);
  const got  = ints(prog).map(c => c.dose && c.dose.tgt);
  if(JSON.stringify(got) !== JSON.stringify(want))
    d7bad.push(`pace rep "${r.tag}" logs ${got.join(',')} but the D101/D111 clock derives ${want.join(',')}`);
});

const d7arms = `${d7four} four-run and ${d7three} three-run of ${D7_POP.length}`;
ok(d7bad.length === 0 && (d7four + d7three) === D7_POP.length && !!INT_ERA,
  `D7 the INT card count is a FUNCTION, not a scalar: across ${d7arms} builds at block lengths `
  + `${Object.keys(d7lens).sort((a,b)=>a-b).map(k=>k+'wk x'+d7lens[k]).join(', ')} every four-run week carries `
  + `exactly one INT card including its cutback and taper weeks, and every three-run block carries `
  + `cross - 1 cards with cross = max(3, ceil(tw x 0.55)); the era row for ia-version ${IAV} names the `
  + `${INT_ERA ? INT_ERA.arm + '/' + INT_ERA.reps : 'MISSING'} mechanism; reps come from `
  + `${INT_ERA && INT_ERA.reps === 'v115' ? 'the V115 position ramp' : 'raw Table 6 under A\'s ceiling of ' + REPS_CEILING}`
  + ` through the cutback and taper branches; and five hand pace rows, including one below the `
  + `${PACE_CAP_INT_18_35} s/mi/wk cap and one already-met goal, land on the second`
  + (d7bad.length ? ' — first miss: ' + d7bad[0] : ''));

// ═════════════════════════════════════════════════════════════════════════════
// D8 — what must NOT have moved
// ═════════════════════════════════════════════════════════════════════════════
// CHI keeps A's own worked-example multiplier and LSD keeps the recovery column. Both are
// pinned by hand in g202_pace_anchor.js; repeated here as literals so a stray edit to the
// shared clock inside the INT branch cannot pass this gate quietly.
const pAll = runSessions(IA.buildProgram(PINNED));
const chi10 = pAll.filter(r => r.w === 10 && /Continuous High Intensity/.test(r.st))[0];
const lsd1  = pAll.filter(r => r.w === 1  && /Long Slow Distance/.test(r.st))[0];
ok(chi10 && chi10.dose && chi10.dose.tgt === 501 && chi10.detail.indexOf('8:21/mi') >= 0,
  `D8 W10 CHI still reads 501 s/mi (8:21/mi): the x1.08 Long Interval multiplier is A's own worked example and D111 `
  + `does not touch it (got ${chi10 && chi10.dose && chi10.dose.tgt})`);
ok(lsd1 && lsd1.dose && lsd1.dose.tgt === 659 && lsd1.detail.indexOf('10:59/mi') >= 0,
  `D8b W1 LSD still reads 659 s/mi (10:59/mi): the recovery clock is INT-branch business only `
  + `(got ${lsd1 && lsd1.dose && lsd1.dose.tgt})`);
ok(!(chi10 && chi10.dose && chi10.dose.rec) && !(lsd1 && lsd1.dose && lsd1.dose.rec),
  `D8c the rec band is ADDITIVE and INT-only: no CHI or LSD dose grew one`);

// ═════════════════════════════════════════════════════════════════════════════
// D9 — the generic INT note states A's rep ceiling, and says it in Mario's voice
// ═════════════════════════════════════════════════════════════════════════════
// The four copies of this string claimed a build to 10 and a hard cap at 10. Guide A
// 259-260 says "Do not run or swim more than 8 intervals", and under D112 A governs; the
// engine's own getINTReps has capped at REPS_CEILING all along, so the sentence contradicted
// both the doctrine and the code. It also carried two mid-sentence em-dashes. Coach ruled
// one replacement string and ruled that the four sites be replaced AS A SET, so the edit is
// provably complete rather than four anchors that drift. The oracle here is that ruled
// string, typed, plus REPS_CEILING, typed above from A.
const RULED_INT_NOTE = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts. All out on each rep. '
  + 'Take the full recovery. Build from 4 reps to ' + REPS_CEILING + '. Hard cap at ' + REPS_CEILING + '. '
  + 'Quality over quantity. If pace drops, stop.';
const SRC = fs.readFileSync(ART, 'utf8');
const srcNew = SRC.split(RULED_INT_NOTE).length - 1;
const srcOld = SRC.split('Build from 4 reps to 10').length - 1;
ok(srcNew === 4 && srcOld === 0,
  `D9 all four copies of the generic INT note read coach's ruled sentence and none still claims a `
  + `cap of 10 (found ${srcNew} ruled, ${srcOld} legacy). Replaced as a SET, so completeness is provable`);

function notesOf(cfg){
  const p = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const out = []; const wks = p.weeks || {};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(dd => {
    const day = wks[w][dd]; if(!day || !day.cardio) return;
    (Array.isArray(day.cardio)?day.cardio:[day.cardio]).forEach(s => {
      if(s && s.type === 'run' && /Interval \(INT\)/.test(s.subtype||''))
        out.push({ w:+w, note:String(s.note||''), dose:s.dose||null });
    });
  }));
  return out;
}
// A cfg whose goal is reachable inside the block and is not already met: the one class that
// still reads the generic note at zero shift.
const GENERIC_CFG = paceGoal({ targetDist:'1.5', targetMins:'12', targetSecs:'30', targetTime:'12:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });
const gNotes = notesOf(GENERIC_CFG).filter(n => /Zone 5/.test(n.note));
ok(gNotes.length > 0 && gNotes.every(n => n.note === RULED_INT_NOTE),
  `D9b the generic note as RENDERED equals the ruled string verbatim on ${gNotes.length} INT cards `
  + `(a source match alone would pass on a string nothing reaches)`
  + (gNotes.length && gNotes[0].note !== RULED_INT_NOTE ? ` — got |${gNotes[0].note}|` : ''));
ok(gNotes.length > 0 && !MID_DASH.test(gNotes[0].note.replace(/^INT — Interval:/, '')),
  `D9c the ruled note carries no mid-sentence dash once the structural "INT — Interval:" label is `
  + `removed: four sentences, no em-dash, Mario's copy rule`);
// the number the athlete is told and the number the engine will actually prescribe
const latMaxReps = LAT.reduce((mx, cfg) => Math.max(mx, ints(IA.buildProgram(JSON.parse(JSON.stringify(cfg))))
  .reduce((m, r) => Math.max(m, (r.dose && r.dose.reps) || 0), 0)), 0);
ok(latMaxReps > 0 && latMaxReps <= REPS_CEILING && RULED_INT_NOTE.indexOf('Hard cap at ' + latMaxReps) >= 0,
  `D9d the cap the note STATES (${REPS_CEILING}) is the cap the engine PRESCRIBES: the highest rep count `
  + `across ${LAT.length} blocks is ${latMaxReps}, and A 259-260 allows no more than ${REPS_CEILING}`);

// ═════════════════════════════════════════════════════════════════════════════
// D10 — the fractional-pace row: the seconds limb and the parser are load-bearing
// ═════════════════════════════════════════════════════════════════════════════
// ORACLE — the clock contract, TYPED HERE and read from no formatter in the app: an m:ss
// clock carries a seconds limb of exactly two digits in 00..59. "6:60" is not a time.
// That contract plus the 16 s/mi hand arithmetic already typed at the top of this file is
// the whole oracle below.
//   D10a makes the parser at line 131 load-bearing on EVERY artifact, well-formed or not.
//   D10b/D10c/D10d make the config above load-bearing, and go red if it drifts off the carry.
const D10_MAL = '6:60', D10_GOOD = '7:00';
ok(toSec(D10_MAL) === null && toSec(D10_GOOD) === 420 && toSec('6:59') === 419 && toSec('6:5') === null,
  `D10a the goal-pace parser REJECTS "${D10_MAL}" instead of normalising it to 420 s: a clock's seconds limb `
  + `is two digits in 00..59, so "${D10_MAL}" is not a time and must not parse (got ${toSec(D10_MAL)}), while `
  + `"${D10_GOOD}" parses to ${toSec(D10_GOOD)} s and the one-digit "6:5" does not (got ${toSec('6:5')})`);

const CLOCK_TOK = /(\d+):(\d+)/g;
const fCards = ints(IA.buildProgram(JSON.parse(JSON.stringify(FRACTIONAL))));
let d10bad = [], d10carry = 0, d10goals = 0;
for(const c of fCards){
  CLOCK_TOK.lastIndex = 0; let m;
  while((m = CLOCK_TOK.exec(c.detail)))
    if(m[2].length !== 2 || +m[2] > 59) d10bad.push(`W${c.w} token "${m[0]}" in |${c.detail.slice(0,62)}|`);
  const g = /This week's goal pace is (\d+:\d\d)\/mi/.exec(c.detail);
  if(g){
    d10goals++;
    if(toSec(g[1]) === null) d10bad.push(`W${c.w} goal pace "${g[1]}" does not parse as a clock`);
    if(/:00$/.test(g[1])) d10carry++;
  }
}
ok(fCards.length > 0 && d10bad.length === 0,
  `D10b every clock printed on all ${fCards.length} INT cards of the 6:46 mile / seed 76308 config has a `
  + `two-digit seconds limb in 00..59; V203 printed "6:60/mi" on this config`
  + (d10bad.length ? ' — first miss: ' + d10bad[0] : ''));
ok(d10carry > 0,
  `D10c the config still REACHES the carry: ${d10carry} of its ${d10goals} goal-pace sentences land on the `
  + `minute, which is the one place split-then-round prints ":60". A zero here means this row went vacuous `
  + `and the lattice stopped covering the defect D126 names`);

const D10_TGT = 404, D10_GOAL = D10_TGT + INT_SUB;   // hand: 404 + 16 = 420 s/mi
const f1 = fCards[0];
ok(!!(f1 && f1.dose && f1.dose.tgt === D10_TGT
     && f1.detail.indexOf(`at ${clk(D10_TGT)}/mi`) >= 0
     && f1.detail.indexOf(`This week's goal pace is ${clk(D10_GOAL)}/mi`) >= 0),
  `D10d the reproducing card itself: its first INT week logs ${D10_TGT} s/mi and prints `
  + `"at ${clk(D10_TGT)}/mi. This week's goal pace is ${clk(D10_GOAL)}/mi." by hand, since ${D10_TGT} + `
  + `${INT_SUB} = ${D10_GOAL} s/mi and ${D10_GOAL} s is ${clk(D10_GOAL)} (got tgt `
  + `${f1 && f1.dose && f1.dose.tgt}, detail |${f1 ? f1.detail.slice(0,60) : 'no card'}|)`);

console.log(`PASS ${PASS} FAIL ${FAIL}`);
process.exit(FAIL ? 1 : 0);
