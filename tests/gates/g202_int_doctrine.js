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
// D7 — the pinned after-grid, as literals
// ═════════════════════════════════════════════════════════════════════════════
// The PRT TING cfg of g202_pace_anchor.js. Hand route: the pinned progression array is
// [509.3, 504.3, 499.3, 494.3, 489.3, 484.3, ...] at D101's 5 s/mi/wk. The rep grid is
// 4,4,5,3,7,8 and week 4 is the cutback, which holds the PRIOR week's array entry. Each
// week's interval target is its array entry less D111's 16 s/mi:
//   W1 509.3-16=493.3 -> 493 (8:13)   W2 504.3-16=488.3 -> 488 (8:08)
//   W3 499.3-16=483.3 -> 483 (8:03)   W4 cutback, holds W3's entry -> 483 (8:03)
//   W5 489.3-16=473.3 -> 473 (7:53)   W6 484.3-16=468.3 -> 468 (7:48)
// The recovery band is that week's own target: tgt x 400 / 1609.344, x2 and x2.5.
// Both ruled sentences are typed out here verbatim from coach's ruling and compared whole.
const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });
const PIN_GRID = [ {w:1,reps:4,tgt:493,pace:'8:13',goal:'8:29'}, {w:2,reps:4,tgt:488,pace:'8:08',goal:'8:24'},
                   {w:3,reps:5,tgt:483,pace:'8:03',goal:'8:19'}, {w:4,reps:3,tgt:483,pace:'8:03',cb:true},
                   {w:5,reps:7,tgt:473,pace:'7:53',goal:'8:09'}, {w:6,reps:8,tgt:468,pace:'7:48',goal:'8:04'} ];
const ruledDetail = g => g.cb
  ? `${g.reps}x400m at ${g.pace}/mi. Cutback week. Same target as last week, fewer reps. ` + handRecTxt(g.tgt) + ' ' + WARMUP
  : `${g.reps}x400m at ${g.pace}/mi. This week's goal pace is ${g.goal}/mi. ` + handRecTxt(g.tgt) + ' ' + WARMUP;
const pCards = ints(IA.buildProgram(PINNED));
let d7bad = [];
if(pCards.length !== PIN_GRID.length) d7bad.push(`${pCards.length} INT cards, want ${PIN_GRID.length}`);
PIN_GRID.forEach((g, i) => {
  const c = pCards[i]; if(!c){ d7bad.push(`W${g.w} missing`); return; }
  if(c.w !== g.w) d7bad.push(`card ${i} is W${c.w} want W${g.w}`);
  if(!c.dose) { d7bad.push(`W${g.w} no dose`); return; }
  if(c.dose.reps !== g.reps) d7bad.push(`W${g.w} reps ${c.dose.reps} want ${g.reps}`);
  if(c.dose.tgt !== g.tgt) d7bad.push(`W${g.w} tgt ${c.dose.tgt} want ${g.tgt}`);
  const hr = handRec(g.tgt);
  if(!c.dose.rec || c.dose.rec.lo !== hr.lo || c.dose.rec.hi !== hr.hi)
    d7bad.push(`W${g.w} rec ${JSON.stringify(c.dose.rec)} want {lo:${hr.lo},hi:${hr.hi}}`);
  if(c.detail !== ruledDetail(g)) d7bad.push(`W${g.w} detail\n     got  |${c.detail}|\n     want |${ruledDetail(g)}|`);
});
ok(d7bad.length === 0,
  `D7 the PRT TING after-grid: six INT weeks at ${PIN_GRID.map(g=>g.tgt).join(', ')} s/mi on reps `
  + `${PIN_GRID.map(g=>g.reps).join(',')}, the cutback week holding W3's target, each card's whole sentence `
  + `byte-identical to the ruling and each recovery band that week's own 2 to 2.5x`
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
