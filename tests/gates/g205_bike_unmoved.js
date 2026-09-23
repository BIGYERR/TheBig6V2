// g205_bike_unmoved.js — the CALLER-level half of D128.
//
// D128 forks the CHI reader BY CALLER: run and swim move onto NSW Guide B Table 6, the
// bike does not, because neither the NSW guide nor the NRC plans cover cycling. That is a
// claim about which function the BIKE BUILDER CALLS, and g205_chi_table6.js cannot make it:
// its T9a tests getCHIBike directly, so re-pointing the bike caller at getCHI leaves T9a
// green while cycling silently starts reading a run/swim table. This file closes that hole.
//
// ORACLES, both independent of the engine:
//   * B2 re-implements the V115 hand ramp and the cutback rule in this file, from the code
//     D128 replaced and from the prose the cutback branch states, and requires the BUILT
//     bike card to print those minutes. It is not a diff against the previous artifact, so
//     it does not mean "my build changed nothing" and it holds on any build that is correct.
//     Every cfg here is eventTargeted:false so no taper modifier is in play and the card's
//     minutes are the reader's minutes.
//   * B3 is the DIVERGENCE row. The V115 ramp and Table 6 must actually disagree on the
//     weeks being checked, otherwise B2 would pass no matter which reader the bike called.
//     A gate that cannot tell the two tables apart is not testing the fork.
//   * B4 is the SOURCE census: the bike call site names getCHIBike and the run/swim call
//     sites do not name it. One row per caller, comments stripped.
//
// VERSION PREDICATE (standing ruling 4). D128 ships on ia-version 205.
//   * at 205 and above getCHIBike MUST exist; its absence is a named FAIL, never a skip.
//   * below 205 WITH getCHIBike present is the pre-bump working artifact mid-slice; rows RUN.
//   * below 205 WITHOUT getCHIBike is an older build: NOT APPLICABLE, skipped, clean exit.
const path = require('path');
const fs = require('fs');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);

let pass = 0, fail = 0, skip = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function summary(code){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(code); }

const HAS = IA.eval("typeof getCHIBike === 'function'");
const VER = IA.version;
const D128_ERA = 205;

if(!HAS && VER < D128_ERA){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D128 (V' + D128_ERA + ') and has no getCHIBike.');
  for(const r of ['B1','B2','B3','B4']) skipRow(r + ' skipped below the D128 era');
  summary(0);
}
ok('B1 getCHIBike is declared and is a function (D128 requires it at ia-version >= ' + D128_ERA + ')', HAS, String(HAS));
if(!HAS) summary(1);

// ── the two references, both typed here ──────────────────────────────────────────
const isCut = (w, tw) => (tw || 0) >= 10 && w % 4 === 0 && w !== tw;
function cutOf(prev){
  return prev.reps > 1 ? {reps: prev.reps - 1, minPerRep: prev.minPerRep}
                       : {reps: 1, minPerRep: Math.max(10, Math.round(prev.minPerRep * 0.7))};
}
// The V115 hand ramp the bike KEEPS.
function v115(w, tw){
  const _pFrom = 1, _pTo = Math.max(2, tw || 6);
  const at = x => {
    const pct = Math.max(0, Math.min(1, (x - _pFrom) / Math.max(_pTo - _pFrom, 1)));
    return {reps: pct < 0.35 ? 1 : pct < 0.70 ? 2 : 3, minPerRep: Math.round(15 + pct * 5)};
  };
  return isCut(w, tw) ? cutOf(at(w - 1)) : at(w);
}
// Table 6, the reader the bike must NOT have moved onto. Typed from
// doctrine/nsw_ptg_sealswcc_11pg.txt:35-60.
const T6 = [null,
  {reps:1,minPerRep:15},{reps:1,minPerRep:15},{reps:1,minPerRep:16},{reps:1,minPerRep:16},
  {reps:1,minPerRep:17},{reps:1,minPerRep:17},{reps:1,minPerRep:18},{reps:1,minPerRep:18},
  {reps:1,minPerRep:19},{reps:1,minPerRep:19},{reps:1,minPerRep:20},{reps:1,minPerRep:20},
  {reps:2,minPerRep:12},{reps:2,minPerRep:12},{reps:2,minPerRep:12},
  {reps:2,minPerRep:14},{reps:2,minPerRep:14},{reps:2,minPerRep:14},
  {reps:2,minPerRep:16},{reps:2,minPerRep:16},{reps:2,minPerRep:16},
  {reps:2,minPerRep:18},{reps:2,minPerRep:18},{reps:2,minPerRep:18},
  {reps:2,minPerRep:20},{reps:2,minPerRep:20}];
const t6 = w => T6[Math.max(1, Math.min(Math.round(w) || 1, 26))];
function expT6(w, tw){ return isCut(w, tw) ? cutOf(t6(w - 1)) : t6(w); }

const ALL = ['sun','mon','tue','wed','thu','fri','sat'];
function bikeCfg(goalId, baseMin){
  return {name:'B', primaryPath:'goal', cardioTypes:['bike'],
    cardioGoals:{bike:{id:goalId, label:goalId, baseline:baseMin + ' min', baselineDist:String(baseMin)}},
    eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
    equipment:'full_gym', unit:'lbs', restDays:['sun','wed'], days:ALL.slice(),
    bench:185, squat:255, deadlift:315, seed:76308};
}
// The bike CHI card, index.html:4509 (single rep) and :4511 (multi rep).
function bikeChiCards(p){
  const out = [];
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w => ALL.forEach(d => {
    const day = p.weeks[w][d]; if(!day || day.rest || !day.cardio) return;
    (Array.isArray(day.cardio) ? day.cardio : [day.cardio]).forEach(c => {
      if(String(c.type) !== 'bike') return;
      const det = String(c.detail || '').replace(/\s+/g, ' ');
      const many = det.match(/^(\d+)\s*x\s*(\d+)\s*min at RPE 8-9, high resistance/i);
      const one = det.match(/^(\d+)\s*min sustained hard effort, high resistance/i);
      if(!many && !one) return;
      out.push({w:+w, reps: many ? +many[1] : 1, mins: many ? +many[2] : +one[1], det});
    });
  }));
  return out;
}

const CASES = [['bike_50', 40], ['bike_century', 60], ['bike_base', 30], ['bike_cals', 25]];
let totalCards = 0, divergent = 0;
const badB2 = [], badB3 = [];
for(const [goalId, baseMin] of CASES){
  let p;
  try { p = IA.buildProgram(Object.assign({}, bikeCfg(goalId, baseMin))); }
  catch(e){ badB2.push(goalId + ' BUILD ERROR ' + e.message); continue; }
  const tw = p.totalWeeks;
  const cards = bikeChiCards(p);
  totalCards += cards.length;
  for(const c of cards){
    const want = v115(c.w, tw);
    if(c.reps !== want.reps || c.mins !== want.minPerRep)
      badB2.push(goalId + ' W' + c.w + ' card ' + c.reps + 'x' + c.mins + ' want V115 ' + want.reps + 'x' + want.minPerRep);
    const other = expT6(c.w, tw);
    if(JSON.stringify(want) !== JSON.stringify(other)) divergent++;
    else badB3.push(goalId + ' W' + c.w + ' V115 and Table 6 agree (' + want.reps + 'x' + want.minPerRep + ')');
  }
}
ok('B2a the bike lattice built CHI cards at all (' + totalCards + ' across ' + CASES.length + ' goals)', totalCards >= 8, String(totalCards));
ok('B2b every bike CHI card prints the re-implemented V115 hand ramp, not Table 6', badB2.length === 0, badB2.slice(0, 8).join(' | '));
ok('B3 the two readers actually DISAGREE on ' + divergent + ' of the ' + totalCards + ' cards checked, so B2b can tell them apart',
   divergent >= Math.ceil(totalCards / 2), divergent + ' divergent, agreements at: ' + badB3.slice(0, 5).join(' | '));

// ── B4 — the source census, comments stripped ────────────────────────────────────
const SRC = fs.readFileSync(ART, 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const bikeCalls = (SRC.match(/getCHIBike\s*\(/g) || []).length;
const swimCalls = (SRC.match(/getCHISwim\s*\(/g) || []).length;
const plainCalls = (SRC.match(/(?<![A-Za-z0-9_])getCHI\s*\(/g) || []).length;
ok('B4a exactly one call site names getCHIBike (the bike builder) plus its declaration', bikeCalls === 2, String(bikeCalls));
ok('B4b exactly one call site names getCHISwim (the swim builder) plus its declaration', swimCalls === 2, String(swimCalls));
ok('B4c getCHI itself is called from exactly one place, the run builder, plus its declaration', plainCalls === 2, String(plainCalls));
ok('B4d the bike builder does not call getCHI: `getCHI(week, tw, false)` is gone from the source',
   !/getCHI\(week,\s*tw,\s*false\)/.test(SRC), 'the bike caller still reaches getCHI');

// ── D135 (V205): THE SAME CLAIM, ON THE INT COLUMN ───────────────────────────────
// Slice 13 moved getINTReps onto Table 6's rep column, headed "Run/Swim (reps)". Swim is
// NAMED in that header and moves. The bike is not named and does not, so D135 forks
// getINTBike off it exactly as D128 forked getCHIBike off the minutes column. These rows
// live here rather than in g205_d114_int_table6.js on purpose: that file's subject is the
// TABLE and its run/swim reader, and this file's subject is WHICH READER EACH SPORT CALLS.
// D135 is the second instance of this file's one claim, not a second claim.
//
// ORACLES, both independent of the engine, and both the INT twins of B2/B3 above:
//   * B6 re-implements the V115 INT hand ramp and its cutback rule in this file, from the
//     code slice 13 replaced and from the prose the cutback branch states, and requires
//     the BUILT bike card to print those rep counts. It is not a diff against a previous
//     artifact, so it does not mean "my build changed nothing".
//   * B7 is the DIVERGENCE row: the V115 ramp and Table 6's INT column must actually
//     disagree on the weeks being checked, or B6 could not tell the two readers apart.
//
// VERSION PREDICATE. D135 ships on ia-version 205, the same build as D128, so the file's
// existing NOT-APPLICABLE exit (no getCHIBike below 205) already covers older artifacts.
// Inside the D135 era getINTBike MUST exist: its absence is a named FAIL, never a skip,
// which is what makes these rows red on the mid-slice artifact that had not been forked.
const HAS_INT = IA.eval("typeof getINTBike === 'function'");
ok('B5 getINTBike is declared and is a function (D135 requires it at ia-version >= ' + D128_ERA + ')',
   HAS_INT, String(HAS_INT));

// The V115 INT hand ramp the bike KEEPS. Typed from the code D114 replaced:
//   const _span = Math.max(2, rampSpan || totalWeeks || 6);
//   const ramp  = w => Math.min(8, 4 + Math.floor((w-1) * 4 / Math.max(_span-1, 1)));
// with the cutback rule the branch states in prose: volume steps back ~40% off the prior
// BUILD week and never below 3. The bike caller passes no span, so the span is the block.
function v115Int(w, tw){
  const span = Math.max(2, tw || 6);
  const ramp = x => Math.min(8, 4 + Math.floor((x - 1) * 4 / Math.max(span - 1, 1)));
  return isCut(w, tw) ? Math.max(3, Math.round(ramp(w - 1) * 0.6)) : ramp(w);
}
// Table 6's INT column, the reader the bike must NOT have moved onto. Typed from
// doctrine/nsw_ptg_sealswcc_11pg.txt: 4 4 5 5 6 6 7 7 8 8 9 9 then 10 to week 26, under
// Guide A's ceiling of 8. Same cutback rule, so the only difference between the two
// oracles is the ramp underneath it.
const T6I = [null, 4,4, 5,5, 6,6, 7,7, 8,8, 9,9, 10,10,10,10,10,10,10, 10,10,10,10,10,10,10];
const t6i = w => Math.min(8, T6I[Math.max(1, Math.min(Math.round(w) || 1, 26))]);
function expT6Int(w, tw){ return isCut(w, tw) ? Math.max(3, Math.round(t6i(w - 1) * 0.6)) : t6i(w); }

// The bike INT card, index.html:4574.
function bikeIntCards(p){
  const out = [];
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w => ALL.forEach(d => {
    const day = p.weeks[w][d]; if(!day || day.rest || !day.cardio) return;
    (Array.isArray(day.cardio) ? day.cardio : [day.cardio]).forEach(c => {
      if(String(c.type) !== 'bike') return;
      const det = String(c.detail || '').replace(/\s+/g, ' ');
      const m = det.match(/^(\d+) x .+ max effort \/ .+ easy spin recovery/i);
      if(!m) return;
      out.push({w:+w, reps:+m[1], det});
    });
  }));
  return out;
}

let intCards = 0, intDivergent = 0;
const badB6 = [], agreeB7 = [];
for(const [goalId, baseMin] of CASES){
  let p;
  try { p = IA.buildProgram(Object.assign({}, bikeCfg(goalId, baseMin))); }
  catch(e){ badB6.push(goalId + ' BUILD ERROR ' + e.message); continue; }
  const tw = p.totalWeeks;
  for(const c of bikeIntCards(p)){
    intCards++;
    const want = v115Int(c.w, tw);
    if(c.reps !== want) badB6.push(goalId + ' W' + c.w + '/' + tw + ' card ' + c.reps + ' reps, want V115 ' + want);
    const other = expT6Int(c.w, tw);
    if(want !== other) intDivergent++;
    else agreeB7.push(goalId + ' W' + c.w + ' both say ' + want);
  }
}
ok('B6a the bike lattice built INT cards at all (' + intCards + ' across ' + CASES.length + ' goals)',
   intCards >= 12, String(intCards));
ok('B6b every bike INT card prints the re-implemented V115 rep ramp, not Table 6\'s INT column',
   badB6.length === 0, badB6.slice(0, 8).join(' | '));
ok('B7 the two INT readers actually DISAGREE on ' + intDivergent + ' of the ' + intCards + ' cards checked, so B6b can tell them apart',
   intDivergent >= Math.ceil(intCards / 3), intDivergent + ' divergent, agreements at: ' + agreeB7.slice(0, 5).join(' | '));

const bikeIntCalls = (SRC.match(/getINTBike\s*\(/g) || []).length;
const plainIntCalls = (SRC.match(/(?<![A-Za-z0-9_])getINTReps\s*\(/g) || []).length;
ok('B8a exactly one call site names getINTBike (the bike builder) plus its declaration', bikeIntCalls === 2, String(bikeIntCalls));
ok('B8b getINTReps is called from exactly two places, the run builder and the swim builder, plus its declaration',
   plainIntCalls === 3, String(plainIntCalls));
ok('B8c the bike builder does not call getINTReps: `getINTReps(week, tw, false)` is gone from the source',
   !/getINTReps\(week,\s*tw,\s*false\)/.test(SRC), 'the bike caller still reaches getINTReps');

summary(fail ? 1 : 0);
