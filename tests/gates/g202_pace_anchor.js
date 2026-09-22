// g202_pace_anchor.js — D100 / D101 (V202).
//
// D100 (AMENDED): the pace clock anchors on the athlete's OWN CHART ROW, READ AT THE DISTANCE
//       THEY ENTERED, and walks toward the goal they entered. One reader of that goal, so the
//       block is sized and paced on one number. The first cut anchored on the entered MILE
//       itself; measure showed that started a 1.5-mile goal at a pace the athlete only holds
//       for a mile, and 138 of this gate's 360 builds then had a goal "slower" than the anchor
//       and parked flat. The beginner keeps the 690 s/mi ROW, not the number 690.
// D101: ONE safe rate of pace improvement. The age-scaled table value IS the cap. There is no
//       12 s/mi/wk ceiling and no x2.5 multiplier; neither ever had a source.
//
// ORACLE — independent of the engine, by construction:
//   * the hand tables below are TYPED HERE (experience defaults from V176 D9, the improve table
//     and the age scale from the same ruling, the km->mi factor). The gate never asks the app
//     what its tables say; a mutation that moves the app's copy moves one side only.
//   * every expected pace is hand arithmetic on the athlete's ENTERED fields: entered mile
//     mm:ss -> seconds, entered goal mm:ss -> seconds, divided by the entered distance in miles.
//   * the pace chart's five distance columns are TRANSCRIBED below from the doctrine table and
//     read at the goal distance by the gate's OWN log interpolation, running maximum and clamps.
//     The gate never calls rowPaceAt to decide what rowPaceAt should have said; it types the
//     ruled arithmetic and compares. A mutation inside the app's helper moves one side only.
//   * the pinned "PRT TING" row is the AFTER-GRID of the ruling, quoted as literals, printed by
//     measure from a source-surgery copy BEFORE this build existed (tests/measure/
//     v202_d100_target_wiring.js). It is a pin, not a reading of this artifact.
//   * mm:ss rendering is checked against the gate's own seconds->clock arithmetic.
//
// Usage: node tests/gates/g202_pace_anchor.js [artifact]
// Prints PASS n FAIL n. Expected to FAIL on V201: none of D100/D101 is in that artifact.

const path = require('path');
const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));

const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);

let PASS = 0, FAIL = 0;
function ok(cond, msg){ if(cond){ PASS++; console.log('  ok   ' + msg); } else { FAIL++; console.log('  FAIL ' + msg); } }

// ── HAND TABLES (the gate's own copy; never read from the app) ────────────────
const EXP_DEFAULT = { beginner:690, intermediate:570, advanced:450 };      // V176 (D9)
const EXP_IMPROVE = { beginner:3,   intermediate:5,   advanced:7   };      // s/mi/wk, unscaled
const AGE_SCALE   = { '18-35':1.0,  '36-54':0.85,     '55+':0.65   };
const MI_PER_KM   = 0.621;                                                  // the ruled factor
const hand = {
  secs: (mm, ss) => (+mm) * 60 + (+ss),
  miles: (dist, unit) => (unit === 'km') ? (+dist) * MI_PER_KM : (+dist),
  clock: s => { const t = Math.round(s); return Math.floor(t/60) + ':' + String(t % 60).padStart(2, '0'); },
};

// The five distance columns of the pace chart, transcribed by hand. Columns sit at their true
// distances in miles; the gate reads a row at an arbitrary goal distance the way the ruling says
// to: log interpolation between the bracketing columns, a running maximum across the columns in
// distance order (a longer distance is never a faster pace), and a clamp to the table's own
// bounds at both ends. rowPaceAt(row, 1.0) must return the mile column exactly.
const HAND_COLS = [ {d:1,k:'mile'}, {d:3.107,k:'fiveK'}, {d:6.214,k:'tenK'},
                    {d:13.109,k:'half'}, {d:26.219,k:'marathon'} ];
const HAND_CHART = [
  //mile fiveK tenK half marathon
  [300, 330, 345, 360, 375], [330, 360, 375, 390, 410], [360, 390, 405, 435, 445],
  [390, 425, 440, 455, 480], [420, 460, 475, 500, 515], [450, 485, 505, 525, 550],
  [480, 520, 540, 570, 585], [510, 550, 570, 595, 615], [540, 580, 600, 640, 650],
  [570, 615, 635, 665, 685], [600, 640, 665, 705, 720], [630, 675, 695, 730, 755],
  [660, 700, 720, 775, 780], [690, 735, 755, 795, 800], [720, 760, 785, 845, 825],
].map(r => ({ mile:r[0], fiveK:r[1], tenK:r[2], half:r[3], marathon:r[4] }));
// interpolate a full row from a mile anchor, the way the chart has always been read
function handRow(mileSec){
  const R = HAND_CHART, K = ['mile','fiveK','tenK','half','marathon'];
  if(mileSec <= R[0].mile) return Object.assign({}, R[0]);
  if(mileSec >= R[R.length-1].mile) return Object.assign({}, R[R.length-1]);
  for(let i = 0; i < R.length - 1; i++){
    if(mileSec >= R[i].mile && mileSec <= R[i+1].mile){
      const f = (mileSec - R[i].mile) / (R[i+1].mile - R[i].mile), o = {};
      for(const k of K) o[k] = Math.round(R[i][k] + (R[i+1][k] - R[i][k]) * f);
      return o;
    }
  }
  return Object.assign({}, R[R.length-1]);
}
function handRowPaceAt(row, distMiles){
  let run = -Infinity;
  const v = HAND_COLS.map(c => { run = Math.max(run, +row[c.k]); return {d:c.d, p:run}; });
  const d = +distMiles;
  if(!(d > 0) || d <= v[0].d) return v[0].p;
  if(d >= v[v.length-1].d)    return v[v.length-1].p;
  for(let i = 0; i < v.length - 1; i++){
    if(d >= v[i].d && d <= v[i+1].d){
      const f = (Math.log(d) - Math.log(v[i].d)) / (Math.log(v[i+1].d) - Math.log(v[i].d));
      return v[i].p + (v[i+1].p - v[i].p) * f;
    }
  }
  return v[v.length-1].p;
}

const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const SEED = 24865;
const base = over => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:'2026-10-19',
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(),
  bench:185, squat:245, deadlift:315, seed:SEED,
}, over || {});
const paceGoal = (g, over) => base(Object.assign({ cardioGoals:{ run: Object.assign({
  id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi',
  baselineDist:'3', baseline:'3mi' }, g) } }, over || {}));

const build = cfg => IA.buildProgram(JSON.parse(JSON.stringify(cfg)));

// Read the progression the build just produced. The statics are set by buildRunSession on the
// call the build itself made; this re-runs the builder with the same arguments to READ them.
function progression(prog, cfg){
  const tw = prog.totalWeeks;
  const bm = parseFloat(cfg.cardioGoals.run.baselineDist) || 1.5;
  const r = IA.eval(`(function(){
    const p = buildRunProgressionForLength('run_pace_goal', ${tw}, ${bm}, '${cfg.experience}', true).paceProgression;
    return JSON.stringify({ arr:Array.from(p), dampened:p._dampened, gain:p._weeklyGain,
      real:p._realisticTarget, orig:p._originalTarget,
      ip:buildRunProgressionForLength._initialPace, tp:buildRunProgressionForLength._targetPace,
      imp:buildRunProgressionForLength._paceImprovePerWeek }); })()`);
  return JSON.parse(r);
}
// The single reader of the entered goal, as the SIZER sees it.
// Absent in any artifact before D100; a missing reader must FAIL a row, never crash the gate.
function sizerTarget(g){
  try { return JSON.parse(IA.eval(`JSON.stringify(paceGoalTarget(${JSON.stringify(g)}))`)); }
  catch(e){ return { tDist:NaN, tTotalSecs:NaN, tPacePerMile:NaN, _err:e.message }; }
}
function hasReader(){ try { return IA.eval('typeof paceGoalTarget'); } catch(e){ return 'missing'; } }

function runSessions(prog){
  const out = [];
  const wks = prog.weeks || {};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
    const day = wks[w][d]; if(!day) return;
    let c = day.cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(s => { if(s && s.type === 'run')
      out.push({ w:+w, d, st:s.subtype||'', detail:s.detail||'', note:s.note||'', dose:s.dose||null }); });
  }));
  return out;
}

console.log('g202 pace anchor — artifact ia-version ' + IA.version);

// ═════════════════════════════════════════════════════════════════════════════
// SWEEP: entered mile best x entered goal x experience x age x unit
// ═════════════════════════════════════════════════════════════════════════════
const MILES = [['6','00'], ['7','30'], ['8','15'], ['9','45']];
const GOALS = [
  { targetDist:'1.5', targetMins:'10', targetSecs:'30' },
  { targetDist:'1.5', targetMins:'9',  targetSecs:'00' },
  { targetDist:'2',   targetMins:'14', targetSecs:'00' },
  { targetDist:'3',   targetMins:'21', targetSecs:'30' },
  { targetDist:'5',   targetMins:'25', targetSecs:'00' },
];
const rows = [];
for(const exp of ['beginner','intermediate','advanced'])
  for(const age of ['18-35','36-54','55+'])
    for(const unit of ['mi','km'])
      for(const mb of MILES)
        for(const g of GOALS){
          const goal = Object.assign({ id:'run_pace_goal', label:'Hit a Pace / Time Goal',
            paceUnit:unit, baselineDist:'3', baseline:'3mi',
            mileBestMins:mb[0], mileBestSecs:mb[1] }, g,
            { targetTime: g.targetMins + ':' + g.targetSecs });
          const cfg = paceGoal(goal, { experience:exp, ageBracket:age });
          const prog = build(cfg);
          rows.push({ exp, age, unit, mb, goal, cfg, prog, pp: progression(prog, cfg) });
        }
console.log('sweep: ' + rows.length + ' builds (3 experience x 3 age x 2 unit x '
  + MILES.length + ' entered miles x ' + GOALS.length + ' entered goals)');

// ── P1 — amended D100 anchor: the athlete's own row, READ AT THE GOAL DISTANCE ──
let p1bad = [], p1beg = 0, p1nonbeg = 0;
for(const r of rows){
  const anchorMile = r.exp === 'beginner' ? EXP_DEFAULT.beginner : hand.secs(r.mb[0], r.mb[1]);
  const d = hand.miles(r.goal.targetDist, r.unit);
  r.handIP = handRowPaceAt(handRow(anchorMile), d);
  r.handMileCol = handRow(anchorMile).mile;
  r.handDist = d;
  if(r.exp === 'beginner') p1beg++; else p1nonbeg++;
  if(Math.abs(r.pp.ip - r.handIP) > 1e-9)
    p1bad.push(`${r.exp}/${r.mb.join(':')}/goal ${r.goal.targetDist}${r.unit} got ${r.pp.ip} want ${r.handIP.toFixed(4)}`);
}
ok(p1bad.length === 0, `P1 amended D100 _initialPace is the athlete's own chart row read at the goal `
  + `distance — the entered mile's row for every non-beginner, the 690 row for every beginner: `
  + `${rows.length - p1bad.length} of ${rows.length} (${p1nonbeg} non-beginner, ${p1beg} beginner)`
  + (p1bad.length ? ' — first miss: ' + p1bad[0] : ''));
const p1bBad = rows.filter(r => r.exp === 'beginner')
  .filter(r => Math.abs(r.pp.ip - handRowPaceAt(handRow(EXP_DEFAULT.beginner), r.handDist)) > 1e-9);
ok(p1bBad.length === 0,
  `P1b the V172 beginner rule survives the amendment: all ${p1beg} beginner builds anchor on the `
  + `690 s/mi ROW regardless of the mile time entered, converted to their own goal distance `
  + `(at a 1-mile goal that row reads 690 exactly; at 1.5 mi it reads 706.09, not 690)`
  + (p1bBad.length ? ' — first miss: ' + `${p1bBad[0].exp}/${p1bBad[0].mb.join(':')} got ${p1bBad[0].pp.ip}` : ''));
const p1cBad = rows.filter(r => r.exp !== 'beginner').filter(r => {
  const mine = handRowPaceAt(handRow(hand.secs(r.mb[0], r.mb[1])), r.handDist);
  const dflt = handRowPaceAt(handRow(EXP_DEFAULT[r.exp]), r.handDist);
  return Math.abs(r.pp.ip - mine) > 1e-9
      || (Math.abs(mine - dflt) > 1e-9 && Math.abs(r.pp.ip - dflt) < 1e-9);
});
ok(p1cBad.length === 0, 'P1c no non-beginner build silently falls back to its experience-default ROW '
  + 'while a mile time is on file');
// P1d — the SHAPE of the amendment, independent of the fitted numbers: at or below a mile the
// anchor IS the mile column; past a mile it is strictly slower. A revert to the mile-pace anchor
// fails this row without the gate needing to agree on a single interpolated second.
let p1dShort = 0, p1dLong = 0, p1dBad = [];
for(const r of rows){
  if(r.handDist <= 1){ p1dShort++; if(Math.abs(r.pp.ip - r.handMileCol) > 1e-9)
      p1dBad.push(`${r.exp}/${r.handDist.toFixed(4)} mi got ${r.pp.ip} want mile column ${r.handMileCol}`); }
  else { p1dLong++; if(r.pp.ip <= r.handMileCol + 1e-9)
      p1dBad.push(`${r.exp}/${r.handDist.toFixed(4)} mi anchor ${r.pp.ip} not slower than mile column ${r.handMileCol}`); }
}
ok(p1dBad.length === 0, `P1d the anchor equals the mile column at or below one mile (${p1dShort} builds) `
  + `and is strictly slower past it (${p1dLong} builds): a longer goal never starts the clock at the `
  + `athlete's mile pace` + (p1dBad.length ? ' — first miss: ' + p1dBad[0] : ''));

// ── P2 — D100 target: the goal the athlete entered, converted once ──
let p2bad = [];
for(const r of rows){
  const want = hand.secs(r.goal.targetMins, r.goal.targetSecs) / hand.miles(r.goal.targetDist, r.unit);
  if(Math.abs(r.pp.tp - want) > 1e-6) p2bad.push(`${r.unit}/${r.goal.targetDist}/${r.goal.targetMins}:${r.goal.targetSecs} got ${r.pp.tp} want ${want.toFixed(4)}`);
}
ok(p2bad.length === 0, `P2 D100 _targetPace equals entered seconds / entered distance in miles on `
  + `${rows.length - p2bad.length} of ${rows.length} builds, km rows converted once at ${MI_PER_KM}`
  + (p2bad.length ? ' — first miss: ' + p2bad[0] : ''));

// ── P3 — ONE arithmetic: the sizer's number and the progression's number are the same number ──
let p3bad = [];
for(const r of rows){
  const s = sizerTarget(r.goal);
  const wantDist = hand.miles(r.goal.targetDist, r.unit);
  const wantPace = hand.secs(r.goal.targetMins, r.goal.targetSecs) / wantDist;
  if(Math.abs(s.tDist - wantDist) > 1e-9 || Math.abs(s.tPacePerMile - wantPace) > 1e-6
     || Math.abs(s.tPacePerMile - r.pp.tp) > 1e-9)
    p3bad.push(`${r.unit}/${r.goal.targetDist} sizer ${s.tPacePerMile} progression ${r.pp.tp} hand ${wantPace.toFixed(4)}`);
}
ok(p3bad.length === 0, `P3 D100 the block is SIZED and PACED on one number: paceGoalTarget().tPacePerMile `
  + `== the progression's _targetPace == the hand value on ${rows.length - p3bad.length} of ${rows.length} builds`
  + (p3bad.length ? ' — first miss: ' + p3bad[0] : ''));
ok(hasReader() === 'function',
  'P3b there is a single named reader of the entered goal (paceGoalTarget) that both call sites can reach');

// ── P4 — D101: one safe rate. The age-scaled table value IS the ceiling ──
let p4over = [], p4damp = 0, p4dampBad = [];
for(const r of rows){
  // _weeklyGain is published at one decimal, so the hand table is compared at one decimal too:
  // intermediate x 36-54 is 4.25 s/mi/wk exactly and prints as 4.3.
  const cap = +(EXP_IMPROVE[r.exp] * AGE_SCALE[r.age]).toFixed(2);
  const capShown = +cap.toFixed(1);
  if(r.pp.gain > capShown + 1e-9) p4over.push(`${r.exp}/${r.age} gain ${r.pp.gain} > table ${cap}`);
  if(r.pp.dampened){ p4damp++; if(Math.abs(r.pp.gain - cap) > 0.051) p4dampBad.push(`${r.exp}/${r.age} gain ${r.pp.gain} cap ${cap}`); }
}
ok(p4over.length === 0, `P4 D101 no build improves faster than the age-scaled hand table allows: `
  + `${rows.length - p4over.length} of ${rows.length} at or under the table `
  + `(a 12 s/mi/wk ceiling or a x2.5 multiplier would put rows above it)`
  + (p4over.length ? ' — first miss: ' + p4over[0] : ''));
ok(p4dampBad.length === 0, `P4b every dampened build improves at EXACTLY the table rate: `
  + `${p4damp - p4dampBad.length} of ${p4damp} dampened builds`
  + (p4dampBad.length ? ' — first miss: ' + p4dampBad[0] : ''));
ok(p4damp > 0, `P4c the dampened branch is actually exercised by this sweep (${p4damp} of ${rows.length} builds)`);
const capSpread = new Set(rows.map(r => r.pp.gain)).size;
ok(capSpread > 1, `P4d the rate still varies with experience and age after D101 (${capSpread} distinct weekly gains in the sweep)`);

// ── P5 — the week array is the rate, applied ──
// SCOPE. D100 and D101 govern an athlete whose entered goal is FASTER than the pace they
// already run at the goal distance; E7 governs the other half. Two segments, two rows.
//
// E7 (V202 slice 5): THE CLOCK HOLDS AT CURRENT, IT NEVER DROPS TO A SLOWER GOAL. Until this
// build, an athlete whose entered goal was at or slower than their own distance-converted
// anchor had the whole block parked on the GOAL, which prescribes slower work than they
// already run. The working target is now min(goal, anchor), so the array is flat AT THE
// ANCHOR. _originalTarget still carries the ENTERED goal and _dampened is false: the goal is
// not out of reach, it is already met.
//
// WHY THIS ROW CAN NOW FAIL. The V202 P5b it replaces compared the engine's array against
// the ENGINE's own _initialPace and then printed its census from the gate's hand values only,
// so no mutation inside the app could move either. The expectation below is HAND-derived —
// handRowPaceAt(handRow(anchorMile), goalDistance), the gate's own chart and its own log
// interpolation — and it is compared against the ENGINE's published array. One side moves.
let p5bad = [], p5flatBad = [], p5improving = 0, p5slower = 0;
for(const r of rows){
  const a = r.pp.arr;
  const handTarget = hand.secs(r.goal.targetMins, r.goal.targetSecs) / hand.miles(r.goal.targetDist, r.unit);
  r.handTarget = handTarget;
  r.goalMetClass = handTarget >= r.handIP;
  if(r.goalMetClass){
    p5slower++;
    // E7's after-grid: one pace all block, and that pace is the HAND anchor, not the goal.
    const wantFlat = +r.handIP.toFixed(1);
    if(new Set(a).size !== 1 || a.some(v => Math.abs(v - wantFlat) > 1e-9))
      p5flatBad.push(`${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} goal ${r.goal.targetDist}${r.unit} `
        + `(${handTarget.toFixed(1)} s/mi, at or slower than the ${wantFlat} anchor): got [${a.join(' ')}], `
        + `want ${wantFlat} every week`);
    continue;
  }
  p5improving++;
  for(let i = 1; i < a.length; i++){
    if(a[i] > a[i-1] + 1e-9){ p5bad.push(`${r.exp}/${r.age} week ${i+1} regresses ${a[i-1]}->${a[i]}`); break; }
    if(a[i] < r.pp.real - 1e-9){ p5bad.push(`${r.exp}/${r.age} week ${i+1} passes the realistic target ${r.pp.real}`); break; }
    const step = +(a[i-1] - a[i]).toFixed(1);
    // Array entries are published at one decimal, so a true 1.95 s/mi/wk rate prints steps of
    // 1.9 and 2.0 alternately; one rounding unit of slack, no more.
    if(step > 1e-9 && Math.abs(step - r.pp.gain) > 0.11){ p5bad.push(`${r.exp}/${r.age} week ${i+1} step ${step} != gain ${r.pp.gain}`); break; }
  }
  if(a[0] !== +r.pp.ip.toFixed(1)) p5bad.push(`${r.exp}/${r.age} week 1 is ${a[0]}, not the anchor ${r.pp.ip}`);
}
ok(p5bad.length === 0, `P5 every improving build starts at the anchor, falls by exactly the weekly rate and never `
  + `passes the realistic target: ${p5improving - p5bad.length} of ${p5improving} builds whose entered goal is faster `
  + `than their own distance-converted anchor`
  + (p5bad.length ? ' — first miss: ' + p5bad[0] : ''));
ok(p5flatBad.length === 0, `P5b E7 — when the entered goal is at or SLOWER than the athlete's own `
  + `distance-converted anchor the block holds ONE pace and that pace is the ANCHOR, never the `
  + `slower goal: ${p5slower - p5flatBad.length} of ${p5slower} such builds flat at the gate's own `
  + `hand anchor (before E7 they were flat at the entered goal, which prescribes slower work than `
  + `the athlete already runs)`
  + (p5flatBad.length ? ' — first miss: ' + p5flatBad[0] : ''));
const p5cls = rows.filter(r => r.goalMetClass);
ok(p5slower > 0 && p5improving > 0, `P5c both segments are exercised by this sweep, so neither P5 `
  + `nor P5b is vacuous: ${p5slower} of ${rows.length} builds enter a goal at or slower than their own `
  + `distance-converted anchor, ${p5improving} improve (measure counted 138 of these under the FIRST `
  + `cut of E1, which anchored on the mile pace itself; the amended anchor leaves ${p5slower}, and `
  + `those are rows whose entered goal is genuinely undemanding — a 21:30 3 km against an 8:15 mile)`);
// E7 keeps the two metas honest: the goal is not out of reach, it is already met, so nothing is
// dampened; and the ENTERED goal survives on _originalTarget so copy can still name both numbers.
const p5dampBad = p5cls.filter(r => r.pp.dampened !== false)
  .map(r => `${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} dampened=${r.pp.dampened}`);
ok(p5dampBad.length === 0, `P5d E7 — nothing in this class is dampened; the goal is already met, not `
  + `out of reach: ${p5cls.length - p5dampBad.length} of ${p5cls.length}`
  + (p5dampBad.length ? ' — first miss: ' + p5dampBad[0] : ''));
const p5origBad = p5cls.filter(r => Math.abs(r.pp.orig - +r.handTarget.toFixed(1)) > 0.06)
  .map(r => `${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} _originalTarget ${r.pp.orig} `
    + `want the ENTERED goal ${r.handTarget.toFixed(1)}`);
ok(p5origBad.length === 0, `P5e E7 — clamping the WORKING target does not overwrite the ENTERED one: `
  + `_originalTarget still equals the goal the athlete typed, divided by the distance they typed, `
  + `in ${p5cls.length - p5origBad.length} of ${p5cls.length} builds`
  + (p5origBad.length ? ' — first miss: ' + p5origBad[0] : ''));

// ── E12 — the note for the class, TYPED HERE from coach's ruling ──
const E12 = 'Your goal pace is already within your current pace. This block holds your pace and builds your reps.';
let e12seen = 0, e12bad = [], e12tot = 0, e12damp = 0, e12gen = 0;
for(const r of p5cls){
  for(const s of runSessions(r.prog)){
    if(!/Interval/i.test(s.st)) continue;
    // A cutback week owns its own note by an older ruling and is not E12's business.
    if(/^CUTBACK WEEK:/.test(s.note)) continue;
    e12tot++;
    if(/needs more weeks than this block has/.test(s.note)) e12damp++;
    if(/Zone 5 \(95%\+ max HR\)/.test(s.note)) e12gen++;
    if(s.note === E12){ e12seen++; continue; }
    if(e12bad.length < 3) e12bad.push(`${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} W${s.w} reads |${s.note.slice(0, 80)}|`);
  }
}
ok(e12bad.length === 0 && e12seen > 0, `P5f E12 — every non-cutback interval week in this class carries `
  + `coach's ruled sentence verbatim and nothing else: ${e12seen} of ${e12tot} interval weeks across `
  + `${p5cls.length} builds, ${e12damp} carrying the dampened branch's "needs more weeks" text (false `
  + `for an athlete whose goal is already met) and ${e12gen} carrying the generic Zone 5 text this `
  + `class used to get`
  + (e12bad.length ? ' — first miss: ' + e12bad[0] : (e12seen ? '' : ' — the sentence never appeared')));
// The copy rule, applied to the string the athlete actually reads, not to the literal above.
const E12_SEEN = (() => { for(const r of p5cls) for(const s of runSessions(r.prog))
  if(/Interval/i.test(s.st) && !/^CUTBACK WEEK:/.test(s.note)) return s.note; return ''; })();
const MIDDASH = /\s[—–-]\s/;
ok(E12_SEEN !== '' && !MIDDASH.test(E12_SEEN) && E12_SEEN === E12,
  `P5g E12 obeys the standing copy rule: no mid-sentence hyphen or dash in the sentence this class `
  + `reads (/\\s[—–-]\\s/ finds nothing), and the rendered string is byte-identical to the ruling`
  + (MIDDASH.test(E12_SEEN) ? ' — reads: |' + E12_SEEN + '|' : ''));

// ═════════════════════════════════════════════════════════════════════════════
// THE PINNED ROW — the ruling's after-grid, printed by measure from a surgery copy
// ═════════════════════════════════════════════════════════════════════════════
const PINNED_CFG = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });
// Measure's surgery values under the AMENDED D100 (tests/measure/v202_d100_chart_interp.js):
// the 8:15 mile interpolates to row mile 495 / fiveK 535, read at 1.5 mi in log distance
// (fraction 0.35766) for an anchor of 509.306 s/mi. Mario confirmed the resulting 7:44/mi.
const PIN = {
  weeks: 11, initial: 509.3064395186472, target: 420, gain: 5, realistic: 464.3, dampened: true,
  arr: [509.3,504.3,499.3,494.3,489.3,484.3,479.3,474.3,469.3,464.3,464.3],
  // V202 slice 6 re-pin, by RULING not by drift. D111 (A 251-252) makes the interval pace the
  // base pace LESS 16 s/mi instead of x0.95. D105's sequencing (E9) was REVERTED in slice 6:
  // its walk limb fired on 0 of 54 blocks, so it was a pin that could not trip, and it moves to
  // D114/D115. The INT clock therefore walks with the array again, at D101's 5 s/mi/wk:
  //   W1 reads PIN.arr[0] 509.3 less 16 = 493.3 s/mi -> dose 493, printed 8:13/mi
  //   W6 reads PIN.arr[5] 484.3 less 16 = 468.3 s/mi -> dose 468, printed 7:48/mi
  // PIN.arr[5] is PIN.arr[0] less five weeks of the 5 s/mi/wk gain: 509.3 - 25 = 484.3.
  // Both rows are hand arithmetic on the array above, not a reading of the artifact.
  // The doctrine derivation and the recovery band live in tests/gates/g202_int_doctrine.js.
  cards: [ { w:1,  st:/Interval/,                tgt:493, pace:'8:13/mi'  },
           { w:6,  st:/Interval/,                tgt:468, pace:'7:48/mi'  },
           { w:10, st:/Continuous High Intensity/, tgt:501, pace:'8:21/mi' },
           { w:1,  st:/Long Slow Distance/,      tgt:659, pace:'10:59/mi' } ],
};
// the same number, derived here instead of quoted: the mile and 5K columns of the 8:15 row,
// read at 1.5 miles in log distance. Two independent routes to one pin.
const PIN_HAND = handRowPaceAt(handRow(495), 1.5);
const pProg = build(PINNED_CFG), pPP = progression(pProg, PINNED_CFG);
ok(pProg.totalWeeks === PIN.weeks, `Q1 the pinned PRT TING cfg still sizes to ${PIN.weeks} weeks (got ${pProg.totalWeeks})`);
ok(Math.abs(pPP.ip - PIN.initial) < 1e-9,
  `Q2 pinned anchor ${PIN.initial.toFixed(4)} s/mi = the 8:15 mile's chart row read at 1.5 mi `
  + `(got ${pPP.ip})`);
ok(Math.abs(pPP.ip - PIN_HAND) < 1e-9 && Math.abs(PIN_HAND - PIN.initial) < 1e-9,
  `Q2b the pinned anchor re-derives from the hand chart: 495 + (535-495) x ln(1.5)/ln(3.107) = `
  + `${PIN_HAND.toFixed(4)} (measure's surgery printed ${PIN.initial.toFixed(4)})`);
ok(pPP.tp === PIN.target, `Q3 pinned target ${PIN.target} s/mi = 10:30 over 1.5 mi (got ${pPP.tp})`);
ok(pPP.gain === PIN.gain, `Q4 pinned weekly gain ${PIN.gain} s/mi/wk = intermediate 5 x age 1.0 (got ${pPP.gain})`);
ok(pPP.real === PIN.realistic, `Q5 pinned realistic target ${PIN.realistic} s/mi = anchor `
  + `${PIN.initial.toFixed(1)} less ${PIN.gain} s/mi/wk over 9 walked weeks, printed 7:44/mi `
  + `(got ${pPP.real})`);
ok(pPP.dampened === PIN.dampened, `Q6 the dampened branch fires on the pinned cfg (got ${pPP.dampened})`);
ok(JSON.stringify(pPP.arr) === JSON.stringify(PIN.arr),
  `Q7 pinned week array is ${PIN.arr.join(' ')} — strictly stepwise, no held weeks inside the build (got ${pPP.arr.join(' ')})`);

const pRows = runSessions(pProg);
let qbad = [];
for(const c of PIN.cards){
  const s = pRows.filter(r => r.w === c.w && c.st.test(r.st))[0];
  if(!s){ qbad.push(`W${c.w} ${c.st} missing`); continue; }
  if(!s.dose || s.dose.tgt !== c.tgt) qbad.push(`W${c.w} ${c.st} tgt ${s.dose && s.dose.tgt} want ${c.tgt}`);
  if(s.detail.indexOf(c.pace) < 0) qbad.push(`W${c.w} ${c.st} detail has no ${c.pace}`);
  // independent clock arithmetic: what is printed IS what is prescribed
  if(s.dose && hand.clock(s.dose.tgt) + '/mi' !== c.pace) qbad.push(`W${c.w} printed ${c.pace} != clock(${s.dose.tgt})`);
}
ok(qbad.length === 0, `Q8 the four pinned cards read W1 INT 493 (8:13/mi) and W6 INT 468 (7:48/mi), `
  + `which are array weeks 1 and 6 (509.3 and 484.3) each less D111's 16 s/mi, `
  + `W10 CHI 501 (8:21/mi), W1 LSD 659 (10:59/mi), each printed pace equal to its own prescribed seconds`
  + (qbad.length ? ' — first miss: ' + qbad[0] : ''));

// ── R — the four ruled properties of the row reader, each on a hand-built row ──
// A missing helper must FAIL a row, never crash the gate: on any artifact before the amended
// D100 there is no rowPaceAt, and NaN fails every R row without taking the summary line with it.
const rowAt = (row, d) => { try { return IA.eval(`rowPaceAt(${JSON.stringify(row)}, ${d})`); }
                            catch(e){ return NaN; } };
const R495 = handRow(495);
ok(rowAt(R495, 1.0) === R495.mile,
  `R1 rowPaceAt(row, 1.0) returns the mile column EXACTLY (${R495.mile}, got ${rowAt(R495, 1.0)}): a `
  + `one-mile goal is anchored on the athlete's mile and nothing is lost to interpolation`);
const RBEG = handRow(EXP_DEFAULT.beginner);
ok(Math.abs(rowAt(RBEG, 1.5) - handRowPaceAt(RBEG, 1.5)) < 1e-9 && Math.abs(rowAt(RBEG, 1.5) - 706.09) < 0.01,
  `R2 the beginner's DEFAULT row converts on the same terms: 690/735 read at 1.5 mi is 706.09, not `
  + `690 (got ${rowAt(RBEG, 1.5)}). A beginner whose anchor did not convert would be the only athlete `
  + `anchored on the wrong distance`);
const INVERTED = { mile:720, fiveK:760, tenK:785, half:845, marathon:825 };
ok(rowAt(INVERTED, 26.219) === 845 && rowAt(INVERTED, 20) === 845,
  `R3 the running maximum holds: the slowest chart row inverts (half 845 then marathon 825) and the `
  + `goal-distance input is min="0.1" with no max, so that row IS reachable. A longer distance is `
  + `never a faster pace — 26.219 mi reads 845, not 825 (got ${rowAt(INVERTED, 26.219)})`);
ok(rowAt(R495, 0.5) === R495.mile && rowAt(R495, 0.1) === R495.mile
   && rowAt(R495, 50) === R495.marathon && rowAt(R495, 26.219) === R495.marathon,
  `R4 both clamps hold at the table's own bounds: below a mile reads the mile column `
  + `(${R495.mile}), above the marathon column reads the marathon column (${R495.marathon})`);
let rMono = [];
for(let d = 0.2; d <= 30; d += 0.1){ const a = rowAt(R495, d), b = rowAt(R495, d + 0.1);
  if(b < a - 1e-9) rMono.push(`${d.toFixed(1)} -> ${(d+0.1).toFixed(1)}: ${a} -> ${b}`); }
ok(rMono.length === 0, `R5 the reader is monotone non-decreasing in distance across 0.2 to 30 mi `
  + `(299 steps)` + (rMono.length ? ' — first miss: ' + rMono[0] : ''));

// ── blast radius: the fixture is ruled UNMOVED by D100/D101 ──
const row = MANNY_DIGEST_BY_VERSION[IA.version];
const mannyDigest = progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
ok(!!row && mannyDigest === row,
  `B1 HALF_MANNY matches the V${IA.version} row of MANNY_DIGEST_BY_VERSION (${row || 'NO ROW'}): got ${mannyDigest}. `
  + `D100 and D101 touch the run_pace_goal path only; a move here is an unruled digest move`);

console.log('PASS ' + PASS + ' FAIL ' + FAIL);
process.exit(FAIL ? 1 : 0);
