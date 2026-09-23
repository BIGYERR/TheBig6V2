// g205_d125_spaced.js — D125 (amended): the NSW pace family takes the spacing-aware
// chooser's FULL objective, with the long run as a preference instead of a pin.
//
// THE RULING. run_pace_goal and its two V126 aliases route to _nrcSpacedRunDays whenever
// the per-sport ceiling caps run days below the training week. Types come from the NSW
// table instead of the NRC tables; HARD is {int, chi, lsd_long}; the recovery term reads
// lsd_easy and the long term reads lsd_long. Objective, highest priority first:
//   1. UNTOLERATED adjacencies minimised, and (V205, D130) that is not the same as
//      collisions minimised: CHI on the EVE of the long run is TOLERATED, every other
//      hard-day adjacency is untolerated.
//   1b. tolerated adjacencies minimised, under rank 1 and never traded against it.
//   2. long run on the LAST training day of the athlete's week
//   3. speeds after a rest day
//   4. a recovery run padding the long
//   5. canonical order (INT before CHI)
// Rank 2 is a PREFERENCE for the pace family: a test goal has no race day, and a long run
// followed by two rest days is coaching-good, so the long may move off the last training
// day to reach zero collisions. NRC keeps the hard pin, in both halves (the subset rule
// and the permutation rule).
//
// ORACLES, all independent of the engine:
//   * P1 is an EXHAUSTIVE SEARCH written in this file. Every subset of training days of
//     the right size, crossed with every permutation of the session types, scored by the
//     rank vector transcribed above from the ruling's prose. The engine's answer must be a
//     LEXICOGRAPHIC MAXIMUM of that space. Optimality, not equality: where the objective
//     ties, the ruling does not own the tiebreak and this gate does not assert one.
//   * P2 DESCRIBES THE UNSPLIT SEARCH SPACE and is not the shipping criterion. On the
//     unsplit collision total at a four-run ceiling, 50 of the 64 rest-day calendars reach
//     zero — 21/35, 21/21, 7/7, 1/1 — and all 14 losers are four-training-day calendars at
//     coll=1. That was D125's after-grid; D130 then split rank 1 into (untol, tol) and all
//     64 now ship four runs, so nothing keys on 50/64 any more. The rows that say what
//     SHIPS are P1 and P8 here, and P3e/P3f in tests/gates/g205_d125_ceiling.js. P2/P2b
//     stay because they are still true of the space the chooser searches.
//   * P3 is the PIN DELTA and the vacuity guard for the relaxation: the pinned control
//     reaches 19/35 and 18/21, and exactly five named calendars are rescued by dropping
//     the pin. If the relaxation ever stops mattering, this row says so.
//   * P4 is MARIO's own calendar, hand-checked in the ruling.
//   * P5 is the NRC CONTRACT: the hard pin still holds on every NRC layout the router can
//     produce, and the pace family demonstrably breaks it somewhere (vacuity).
//   * P6 is SCOPE: run_base and every bike/swim goal keep the even-spread fallback.
//   * P7/P8 are BUILT OUTPUT: no hard-run collisions the objective could have avoided, and
//     the week the athlete actually gets is rank-optimal under the same hand oracle.
//
// VERSION PREDICATE (standing ruling 4). D125 ships on ia-version 205.
//   * at 205 and above the PACE_GOALS routing MUST exist; its absence is a named FAIL.
//   * below 205 WITH it present is the pre-bump working artifact mid-slice; rows RUN.
//   * below 205 WITHOUT it is an older build: NOT APPLICABLE, skipped, clean exit.
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const SRC_RAW = fs.readFileSync(ART, 'utf8');
const SRC = SRC_RAW.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

let pass = 0, fail = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function summary(code){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(code); }

const VER = Number(IA.IA_VERSION);
const HAS = /PACE_GOALS/.test(SRC) && /_paceCapped/.test(SRC);
if(VER >= 205){
  ok('P0 at ia-version ' + VER + ' the D125 pace-family routing exists', HAS,
     'no PACE_GOALS / _paceCapped: D125 is not in this artifact');
  if(!HAS) summary(1);
} else if(!HAS){
  console.log('SKIP g205_d125_spaced: ia-version ' + VER + ' predates D125 (NOT APPLICABLE)');
  summary(0);
} else {
  console.log('NOTE ia-version ' + VER + ' with the D125 routing present: pre-bump working artifact, rows RUN');
}

// ── the calendar, written here ──────────────────────────────────────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const pos = d => DAYS.indexOf(d);
const circ = (a,b) => { const r = Math.abs(pos(a) - pos(b)); return Math.min(r, 7 - r); };
const prevDay = d => DAYS[(pos(d) + 6) % 7];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
function perms(a){ if(!a.length) return [[]]; const o=[]; a.forEach((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>o.push([x,...p]))); return o; }

// ── the NSW weekly template, hand-transcribed (NSW Table 7 / V115 compression) ──
// 4 sessions = 2 LSD + 1 long interval + 1 short interval → easy, INT, CHI, long.
// 3 sessions sits below the template floor: one quality slot survives, and on a speed
// goal that slot is the interval. 2 sessions keep the aerobic pair.
const NSW_TYPES = { 2:['lsd_easy','lsd_long'], 3:['lsd_easy','int','lsd_long'], 4:['lsd_easy','int','chi','lsd_long'] };
const TP = { long:'lsd_long', rec:'lsd_easy', s1:'int', s2:'chi' };
const TN = { long:'nrc_long', rec:'nrc_recovery', s1:'nrc_speed1', s2:'nrc_speed2' };

// ── source surgery: the chooser itself, so the objective is provable directly ───
function grab(src, name){
  const i = src.indexOf('function ' + name + '(');
  if(i < 0) throw new Error('not found: ' + name);
  let d = 0, mode = null;
  for(let k = src.indexOf('{', i); k < src.length; k++){
    const c = src[k], n = src[k+1];
    if(mode === 'line'){ if(c === '\n') mode = null; continue; }
    if(mode === 'block'){ if(c === '*' && n === '/'){ mode = null; k++; } continue; }
    if(mode){ if(c === '\\'){ k++; continue; } if(c === mode) mode = null; continue; }
    if(c === '/' && n === '/'){ mode = 'line'; k++; continue; }
    if(c === '/' && n === '*'){ mode = 'block'; k++; continue; }
    if(c === '"' || c === "'" || c === '`'){ mode = c; continue; }
    if(c === '{') d++; else if(c === '}'){ d--; if(d === 0) return src.slice(i, k+1); }
  }
  throw new Error('unbalanced: ' + name);
}
let CH = null, GN = null, SURGERY = '';
try {
  const parts = ['const ALL_DAYS_ORDER=' + JSON.stringify(DAYS) + ';'];
  ['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n => parts.push(grab(SRC_RAW, n)));
  const ctx = {};
  vm.runInNewContext(parts.join('\n') + '\nout={c:_nrcSpacedRunDays,gs:getSessionTypes,gn:getNRCSessionTypes};', ctx);
  CH = ctx.out.c; GN = ctx.out.gn;
  // the engine's own NSW table must agree with the hand transcription above
  Object.keys(NSW_TYPES).forEach(k => {
    const got = ctx.out.gs(Number(k), true, false, false);
    if(got.join() !== NSW_TYPES[k].join()) SURGERY += ' nDays=' + k + ' engine=' + got.join('/');
  });
} catch(e){ SURGERY = ' EXTRACTION FAILED: ' + e.message; CH = null; }
ok('P0b the chooser extracts and the NSW table matches the hand transcription', !!CH && !SURGERY, SURGERY);
if(!CH) summary(1);

// ── the hand oracle: exhaustive, scored by the ruling's objective ───────────────
function space(train, capDays, T, pinned){
  const types = T === TP ? NSW_TYPES[capDays] : GN(capDays, arguments[4]);
  const inTrain = new Set(train), last = train[train.length-1], out = [];
  combos(train, capDays).forEach(days => {
    if(pinned && days[days.length-1] !== last) return;
    perms(types).forEach(p => {
      const typeOf = {}; days.forEach((d,i)=>typeOf[d]=p[i]);
      const longDay = days.find(d=>typeOf[d]===T.long);
      if(pinned && longDay && longDay !== days[days.length-1]) return;
      const hard = days.filter(d=>d && [T.s1,T.s2,T.long].indexOf(typeOf[d])>=0);
      // V205 (D130) SPLITS THIS ORACLE'S RANK HEAD, and it had to be split or it would go
      // on printing PASS while scoring a different objective from the engine. P1 and P8
      // only ever see rows where the day set is NOT forced, and on those rows untol==0
      // and tol==0 together, so -coll and [-untol,-tol] agree and the disagreement is
      // invisible. It is still the wrong objective. NRC IS UNCHANGED BY CONSTRUCTION:
      // off the pace template chiEve is false, so untol===coll and tol===0, and
      // [-coll, 0, ...] orders exactly as the shipped [-coll, ...] did.
      let coll = 0, untol = 0, tol = 0;
      for(let a=0;a<hard.length;a++) for(let b=a+1;b<hard.length;b++){
        if(circ(hard[a],hard[b])!==1) continue;
        coll++;
        const _x = hard[a], _y = hard[b];
        const chiEve = T === TP && !!longDay
          && ((typeOf[_x]===T.s2 && _y===longDay && _x===prevDay(longDay))
           || (typeOf[_y]===T.s2 && _x===longDay && _y===prevDay(longDay)));
        if(chiEve) tol++; else untol++;
      }
      const sar = days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2).filter(d=>!inTrain.has(prevDay(d))).length;
      // V205 (D129) CORRECTS THIS ORACLE LINE, and it is the oracle that was wrong.
      // It read `circ(d,longDay)===1 && pos(d)<pos(longDay)` — a circular week through the
      // Sunday-first DAYS list — so a Sunday easy run scored as padding a Saturday long
      // run, the day AFTER it. "A recovery run padding the long" means the eve, and
      // prevDay above is circular-correct. The correction is PACE-FAMILY ONLY, matching
      // the fork in the engine: NRC keeps the shipped predicate by ruling.
      const rbl = longDay && days.some(d=>typeOf[d]===T.rec && (T === TP
        ? d === prevDay(longDay)
        : (circ(d,longDay)===1 && pos(d)<pos(longDay)))) ? 1 : 0;
      const ll = (!longDay || longDay===last) ? 1 : 0;
      const s1 = days.find(d=>typeOf[d]===T.s1), s2 = days.find(d=>typeOf[d]===T.s2);
      out.push({ days, typeOf, coll, untol, tol, rank:[-untol, -tol, ll, sar, rbl, (s1&&s2&&pos(s1)<pos(s2))?1:0] });
    });
  });
  return out;
}
const cmpRank = (a,b) => { for(let i=0;i<a.length;i++){ if(a[i]!==b[i]) return a[i]-b[i]; } return 0; };
const maxRank = list => list.reduce((m,c)=>cmpRank(c.rank,m)>0?c.rank:m, list[0].rank);
const minColl = list => list.reduce((m,c)=>Math.min(m,c.coll), 99);
const CAL = [];

// ─────────────────────────────────────────────────────────────────────────────
// MEASURE, V205 slice 7e. Why does v205_d125.json S1 (the subset pin restored
// for the pace family) SURVIVE g205_d125_spaced.js, and what row closes the gap?
// Head spliced from the gate so the hand oracle is literally the same one.
// ─────────────────────────────────────────────────────────────────────────────
[0,1,2,3].forEach(nRest => combos(DAYS,nRest).forEach(rest => CAL.push({ rest, train: DAYS.filter(d=>rest.indexOf(d)<0) })));

const A1 = "      if(acc.length===capDays){ if(paceFam || acc[acc.length-1]===n-1) subsets.push(acc.slice()); return; }";
const R1 = "      if(acc.length===capDays){ if(acc[acc.length-1]===n-1) subsets.push(acc.slice()); return; }";
console.log('S1 anchor count in artifact: ' + SRC_RAW.split(A1).length);
const MUT = SRC_RAW.replace(A1, R1);
let CHM = null;
{ const parts = ['const ALL_DAYS_ORDER=' + JSON.stringify(DAYS) + ';'];
  ['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n => parts.push(grab(MUT, n)));
  const c = {}; vm.runInNewContext(parts.join('\n') + '\nout={c:_nrcSpacedRunDays};', c); CHM = c.out.c; }

let moved=0, rows=0, offEnd=0, necessary=0, agree=0, disagree=[], mutSubopt=0, movedEx=[];
CAL.forEach(({rest, train}) => [2,3,4].forEach(cap => {
  if(cap >= train.length) return;
  rows++;
  const key = (rest.join('+')||'none') + ' cap' + cap;
  const last = train[train.length-1];
  const all = space(train, cap, TP, false);
  const end = all.filter(c => c.days[c.days.length-1] === last);
  const need = cmpRank(maxRank(all), maxRank(end)) > 0;   // every end-anchored layout is strictly worse
  const b = CH(train, cap, 'run_pace_goal', true), m = CHM(train, cap, 'run_pace_goal', true);
  const bd = b.idxs.map(i=>train[i]), md = m.idxs.map(i=>train[i]);
  const bOff = bd[bd.length-1] !== last;
  if(need) necessary++;
  if(bOff) offEnd++;
  if(need === bOff) agree++; else disagree.push(key + ' need=' + need + ' offEnd=' + bOff);
  const bs = bd.map(d=>d+':'+b.typeOf[d]).join(' '), ms = md.map(d=>d+':'+m.typeOf[d]).join(' ');
  if(bs !== ms){ moved++; if(movedEx.length<6) movedEx.push(key + ' base[' + bs + '] mut[' + ms + ']');
    const mine = all.find(c => c.days.join()===md.join() && c.days.every(d=>c.typeOf[d]===m.typeOf[d]));
    if(!mine || cmpRank(mine.rank, maxRank(all)) !== 0) mutSubopt++; }
}));
console.log('rows=' + rows + '  engine picks that MOVE under S1: ' + moved);
console.log('  examples: ' + movedEx.join(' | '));
console.log('  of the moved, rank-SUBOPTIMAL under the free objective (what P1 catches): ' + mutSubopt);
console.log('ORACLE: rows where every end-anchored layout is strictly worse = ' + necessary);
console.log('ENGINE: rows whose chosen day set does NOT end on the last training day = ' + offEnd);
console.log('agreement necessary<->offEnd: ' + agree + '/' + rows + '  disagreements: ' + (disagree.join(' | ')||'none'));

// ── ATTRIBUTION: which HALF of the D125 relaxation buys the five calendars? ──
// P3b relaxes BOTH pins at once (`pinned` gates the subset rule and the long-run
// permutation rule together). Split them and count the collision floor each way.
{
  const z = {free:0, subsetPin:0, permPin:0, both:0}, rescuedBySubset=[], rescuedByPerm=[];
  CAL.forEach(({rest, train}) => {
    const last = train[train.length-1];
    const all = space(train, 4, TP, false);
    const mc = l => l.reduce((m,c)=>Math.min(m,c.coll), 99);
    const endOnly  = all.filter(c => c.days[c.days.length-1] === last);
    const permOnly = all.filter(c => { const L = c.days.find(d=>c.typeOf[d]===TP.long); return !L || L === c.days[c.days.length-1]; });
    const f = mc(all), s = mc(endOnly), p = mc(permOnly), b = mc(permOnly.filter(c=>c.days[c.days.length-1]===last));
    if(f===0) z.free++; if(s===0) z.subsetPin++; if(p===0) z.permPin++; if(b===0) z.both++;
    if(f===0 && s>0) rescuedBySubset.push(rest.join('+')||'none');
    if(f===0 && p>0) rescuedByPerm.push(rest.join('+')||'none');
  });
  console.log('ATTRIBUTION at a four-run ceiling, 64 calendars reaching collision floor 0:');
  console.log('  neither pin (shipped)      : ' + z.free);
  console.log('  SUBSET pin only restored   : ' + z.subsetPin + '   rescued by the subset half: [' + rescuedBySubset.join(' ') + ']');
  console.log('  PERMUTATION pin only       : ' + z.permPin + '   rescued by the permutation half: [' + rescuedByPerm.join(' ') + ']');
  console.log('  both pins (P3b control)    : ' + z.both);
}
