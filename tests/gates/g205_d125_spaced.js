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

// ── ERA ROWS: how a run card names its quality session (standing ruling 4) ───────────
// Keyed to the RULING, D103a, which ships on ia-version 208, not to the version this gate
// shipped on. Through 207 the two NSW quality runs are named "Interval (INT)" and
// "Continuous High Intensity (CHI)" and carry no key, so a card is read by its name.
// From 208 the same two cards are named "Short Interval (SI)" and "Long Interval (LI)" and
// every NSW run card carries dose.key; a card is read by its key (int / chi), and E1
// requires its NSW name to agree with that key on every run card read, so every claim
// below is still about the named card the athlete sees. D103a moved words, not days: no
// expectation in this file changes with the era. A version with no row is a named FAIL.
const RUN_CARD_ERAS = [
  { hi: 207, name: { int: /^Interval/, chi: /^Continuous High Intensity/ }, key: null },
  { lo: 208, name: { int: /^Short Interval \(SI\)/, chi: /^Long Interval \(LI\)/ }, key: { int: 'int', chi: 'chi' } }
];
const CARD_ROWS = RUN_CARD_ERAS.filter(r => (r.lo === undefined || VER >= r.lo) && (r.hi === undefined || VER <= r.hi));
if(CARD_ROWS.length !== 1){
  ok('E0 ia-version ' + VER + ' reads its run cards through exactly one era row', false, CARD_ROWS.length + ' rows match');
  summary(1);
}
const CARD = CARD_ROWS[0];
console.log('NOTE run cards read through the ' + (CARD.key ? '208+ row (D103a names, dose.key)' : '207- row (INT / CHI names)'));
let cardsRead = 0, cardSplit = 0; const cardSplitAt = [];
function runQuality(c){
  const s = String(c.subtype || '');
  const byName = CARD.name.int.test(s) ? 'int' : CARD.name.chi.test(s) ? 'chi' : null;
  if(!CARD.key) return byName;
  const k = c.dose && c.dose.key;
  const byKey = k === CARD.key.int ? 'int' : k === CARD.key.chi ? 'chi' : null;
  cardsRead++;
  if(byKey !== byName){ cardSplit++; if(cardSplitAt.length < 4) cardSplitAt.push(s + ' key=' + k); }
  return byKey;
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
[0,1,2,3].forEach(nRest => combos(DAYS,nRest).forEach(rest => CAL.push({ rest, train: DAYS.filter(d=>rest.indexOf(d)<0) })));

// ── P1 the engine's layout is a lexicographic maximum of the whole space ───────
let p1bad = 0, p1rows = 0; const p1detail = [];
CAL.forEach(({rest, train}) => {
  [2,3,4].forEach(cap => {
    if(cap >= train.length) return;          // uncapped: no choice exists, nothing to prove
    p1rows++;
    const pick = CH(train, cap, 'run_pace_goal', true);
    const got = { days: pick.idxs.map(i=>train[i]), typeOf: pick.typeOf };
    const all = space(train, cap, TP, false);
    const mine = all.find(c => c.days.join()===got.days.join() && c.days.every(d=>c.typeOf[d]===got.typeOf[d]));
    if(!mine || cmpRank(mine.rank, maxRank(all)) !== 0){
      p1bad++;
      if(p1detail.length < 6) p1detail.push('rest=' + (rest.join('+')||'none') + ' cap=' + cap + ' got ' +
        got.days.map(d=>d+':'+got.typeOf[d]).join(' ') + ' rank ' + (mine?mine.rank.join(','):'OFF-SPACE') + ' best ' + maxRank(all).join(','));
    }
  });
});
ok('P1 every pace-family layout is lex-optimal under the ruling objective (' + p1rows + ' calendar x ceiling rows)',
   p1bad === 0, p1bad + ' suboptimal: ' + p1detail.join(' | '));

// ── P2 the UNSPLIT search space at a four-run ceiling (DESCRIPTIVE, NOT THE CRITERION) ──
// Superseded as the shipping criterion by D130. What ships is asserted by P1 and P8 below,
// and by P3e/P3f in tests/gates/g205_d125_ceiling.js.
const EXPECT_ZERO = { 4:21, 5:21, 6:7, 7:1 }, EXPECT_N = { 4:35, 5:21, 6:7, 7:1 };
const zero = {4:0,5:0,6:0,7:0}, tot = {4:0,5:0,6:0,7:0}, losers = [];
CAL.forEach(({rest, train}) => {
  const n = train.length; tot[n]++;
  const c = minColl(space(train, 4, TP, false));
  if(c === 0) zero[n]++; else losers.push({ rest: rest.join('+'), n, c });
});
let gridBad = '';
[4,5,6,7].forEach(n => { if(tot[n]!==EXPECT_N[n] || zero[n]!==EXPECT_ZERO[n]) gridBad += ' ' + n + 'd:' + zero[n] + '/' + tot[n]; });
ok('P2 DESCRIPTIVE (not the shipping criterion, see P1/P8): on the UNSPLIT collision total at a four-run ceiling, 50 of 64 calendars reach zero (21/35, 21/21, 7/7, 1/1)', !gridBad, gridBad);
ok('P2b DESCRIPTIVE (not a failure set): all 14 unsplit losers are four-day calendars stuck at coll=1. Under D130 these same 14 ship four runs and pay one TOLERATED adjacency, which P3f in g205_d125_ceiling.js owns',
   losers.length === 14 && losers.every(l => l.n === 4 && l.c === 1),
   losers.length + ' losers: ' + losers.map(l=>l.rest+'('+l.n+'d,coll='+l.c+')').join(' '));

// ── P3 the pin delta, and the vacuity guard on the relaxation ──────────────────
const RESCUED = ['mon+tue','mon+thu','wed+thu','mon+tue+thu','mon+wed+thu'];
const pinZero = {4:0,5:0,6:0,7:0}; const rescued = [];
CAL.forEach(({rest, train}) => {
  const n = train.length;
  const free = minColl(space(train, 4, TP, false)), pin = minColl(space(train, 4, TP, true));
  if(pin === 0) pinZero[n]++;
  if(free === 0 && pin > 0) rescued.push(rest.join('+') || 'none');
});
ok('P3 the pinned control reaches 19/35 at four days and 18/21 at five', pinZero[4] === 19 && pinZero[5] === 18,
   pinZero[4] + '/35 and ' + pinZero[5] + '/21');
ok('P3b relaxing the long-run pin rescues exactly the five ruled calendars',
   rescued.length === 5 && RESCUED.every(r => rescued.indexOf(r) >= 0), rescued.join(' '));

// ── P3c ATTRIBUTION: which HALF of the relaxation buys the five? ───────────────
// P3 and P3b relax BOTH pins at once. `pinned` in space() above gates the SUBSET rule
// (the chosen day set must END on the last training day) and the PERMUTATION rule (the
// long run must BE that last day) together, so P3b's five are the joint delta and the
// row's own label, "the long-run pin", reads as if one pin did the work. Split them and
// the credit does not divide the way it has been read. Restoring the SUBSET pin alone
// still reaches 50 of 64: it rescues NOTHING. Restoring the PERMUTATION pin alone drops
// to 48 and names two calendars. Both together drop to 45, which is P3b's control, so
// three of the five rescues need both pins relaxed and belong to neither half alone.
// Recorded here because the subset half's only observable anywhere in the build is ONE
// pace row -- rest wed+thu at a four-run ceiling -- and that row is decided at RANK 9,
// which g205_d129_tiebreak.js scores and this file does not. v205_d125.json S1 is
// pointed there for that reason. No engine value enters this row: it is this file's own
// exhaustive search filtered four ways.
{
  const mc = l => l.reduce((m,c)=>Math.min(m,c.coll), 99);
  const z = { free:0, subsetPin:0, permPin:0, both:0 }; const permRescue = [], subsetRescue = [];
  CAL.forEach(({rest, train}) => {
    const last = train[train.length-1];
    const all = space(train, 4, TP, false);
    const endOnly  = all.filter(c => c.days[c.days.length-1] === last);
    const permOnly = all.filter(c => { const L = c.days.find(d=>c.typeOf[d]===TP.long); return !L || L === c.days[c.days.length-1]; });
    const f = mc(all), s = mc(endOnly), p = mc(permOnly), b = mc(permOnly.filter(c=>c.days[c.days.length-1]===last));
    if(f === 0) z.free++;
    if(s === 0) z.subsetPin++;
    if(p === 0) z.permPin++;
    if(b === 0) z.both++;
    if(f === 0 && s > 0) subsetRescue.push(rest.join('+') || 'none');
    if(f === 0 && p > 0) permRescue.push(rest.join('+') || 'none');
  });
  ok('P3c the SUBSET half of the relaxation rescues no calendar at all (50 of 64 either way)',
     z.free === 50 && z.subsetPin === 50 && subsetRescue.length === 0,
     'free=' + z.free + ' subsetPin=' + z.subsetPin + ' rescued=[' + subsetRescue.join(' ') + ']');
  ok('P3d the PERMUTATION half alone rescues two (48 of 64), both pins together leave 45, and P3b\'s five is the JOINT delta',
     z.permPin === 48 && z.both === 45 && permRescue.slice().sort().join(' ') === 'mon+tue+thu mon+wed+thu',
     'permPin=' + z.permPin + ' both=' + z.both + ' permRescue=[' + permRescue.join(' ') + ']');
}

// ── P4 Mario's calendar ────────────────────────────────────────────────────────
{
  const train = DAYS.filter(d => ['sun','wed'].indexOf(d) < 0);
  const p = CH(train, 4, 'run_pace_goal', true);
  const got = p.idxs.map(i => train[i] + ':' + p.typeOf[train[i]]).join(' ');
  ok('P4 rest SUN+WED at a four-run ceiling is mon:int thu:chi fri:lsd_easy sat:lsd_long',
     got === 'mon:int thu:chi fri:lsd_easy sat:lsd_long', got);
}

// ── P5 the NRC contract: the hard pin survives, and the pace family breaks it ──
let nrcRows = 0, nrcBad = 0;
['run_5k','run_10k','run_half','run_marathon'].forEach(g => {
  CAL.forEach(({train}) => {
    for(let cap = 2; cap < Math.min(train.length, 6); cap++){
      if(GN(cap, g).length !== cap) continue;   // the >=5 NRC tables are shorter than the day count
      nrcRows++;
      const p = CH(train, cap, g, false);
      const longDay = Object.keys(p.typeOf).find(d => p.typeOf[d] === 'nrc_long');
      if(longDay && longDay !== train[train.length-1]) nrcBad++;
    }
  });
});
ok('P5 the NRC long run is still pinned to the last training day (' + nrcRows + ' rows)', nrcRows > 100 && nrcBad === 0, nrcBad + ' unpinned');
let paceBreaks = 0;
CAL.forEach(({train}) => {
  if(train.length <= 4) return;
  const p = CH(train, 4, 'run_pace_goal', true);
  const longDay = Object.keys(p.typeOf).find(d => p.typeOf[d] === 'lsd_long');
  if(longDay && longDay !== train[train.length-1]) paceBreaks++;
});
ok('P5b the pace family actually uses the escape somewhere (vacuity guard)', paceBreaks > 0, paceBreaks + ' escapes');

// ── P6 scope: run_base and the other sports keep the even-spread fallback ──────
ok('P6 PACE_GOALS is the three pace ids and excludes run_base',
   /PACE_GOALS\s*=\s*new Set\(\['run_pace_goal',\s*'run_mile_time',\s*'run_15_under10'\]\)/.test(SRC) && !/PACE_GOALS[^;]*run_base/.test(SRC));
ok('P6b the even-spread fallback still exists for everything not routed',
   /Math\.round\(k \* \(nCardio - 1\) \/ \(capDays - 1\)\)/.test(SRC));
// V205 (D125 amended, slice 6): the PACE gate widened from < to <=. With the ceiling at
// four, a four-training-day week has capDays === nCardio and its day SET is forced — but
// the long run's slot is not, and on a forced day set that permutation is the only lever
// that reaches zero collisions. Routing it to the even-spread fallback instead would deal
// the NSW table row blind and ship the collisions D125 exists to remove. NRC keeps the
// STRICT cap, and that half of this row is what makes the widening scoped rather than
// general: NRC's subset and permutation pins leave nothing to choose on a forced day set.
ok('P6c the pace chooser is entered whenever the ceiling is at or below the week, and NRC keeps the strict cap',
   /_paceCapped = PACE_GOALS\.has\(_soloRunGoal\) && capDays<=nCardio && capDays>=2/.test(SRC) &&
   /_nrcCapped = NRC_GOALS\.has\(_soloRunGoal\) && capDays<nCardio && capDays>=2/.test(SRC));

// ── built output ───────────────────────────────────────────────────────────────
function paceCfg(rest, seed, goalId){
  return { name:'P', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:{ id: goalId || 'run_pace_goal', label:'Pace', targetDist:'1.5',
      targetMins:'10', targetSecs:'0', mileBestMins:'8', mileBestSecs:'30',
      baselineDist:'3', baseline:'3mi' } },
    eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate',
    ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:rest, days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed };
}
function runLayout(w){
  const out = {};
  DAYS.forEach(d => {
    const c = w[d] && w[d].cardio; if(!c) return;
    (Array.isArray(c) ? c : [c]).forEach(s => {
      if(s.type !== 'run') return;
      const st = s.subtype || '';
      const q = runQuality(s);
      if(q) out[d] = q;
      else if(/^Long Slow Distance/.test(st)) out[d] = s.legLoad ? 'lsd_long' : 'lsd_easy';
    });
  });
  return out;
}
// THE 14, typed from the ruling: the calendars whose four-run floor is (untol 0, tol 1).
// Same literal as g205_d125_ceiling's TOL14, and deliberately duplicated rather than
// imported — a shared constant would let one edit move both oracles at once.
const TOL14 = [
  'sun,mon,tue', 'sun,mon,thu', 'sun,mon,sat', 'sun,wed,thu', 'sun,wed,sat',
  'sun,fri,sat', 'mon,tue,wed', 'mon,tue,fri', 'mon,thu,fri', 'tue,wed,thu',
  'tue,wed,sat', 'tue,fri,sat', 'wed,thu,fri', 'thu,fri,sat'
];
let wkTot = 0, untolHits = 0, tolHits = 0, p8rows = 0, p8bad = 0, p8skip = 0;
const p8detail = [], tolCals = {};
CAL.forEach(({rest, train}) => {
  const prog = IA.buildProgram(paceCfg(rest, 1001));
  Object.keys(prog.weeks).forEach(k => {
    const lay = runLayout(prog.weeks[k]); wkTot++;
    const hard = Object.keys(lay).filter(d => ['int','chi','lsd_long'].indexOf(lay[d]) >= 0);
    const longD = Object.keys(lay).find(d => lay[d] === 'lsd_long');
    for(let a=0;a<hard.length;a++) for(let b=a+1;b<hard.length;b++){
      if(circ(hard[a],hard[b])!==1) continue;
      const _x = hard[a], _y = hard[b];
      const chiEve = !!longD && ((lay[_x]==='chi' && _y===longD && _x===prevDay(longD))
                              || (lay[_y]==='chi' && _x===longD && _y===prevDay(longD)));
      if(chiEve){ tolHits++; tolCals[rest.join(',') || 'none'] = 1; } else untolHits++;
    }
  });
  // week 1 is the layout the chooser fixed; later weeks only swap INT for CHI in place
  const lay = runLayout(prog.weeks['1']);
  const days = DAYS.filter(d => lay[d]);
  if(days.length >= train.length || days.length < 2 || !NSW_TYPES[days.length]) { p8skip++; return; }
  p8rows++;
  const all = space(train, days.length, TP, false);
  const mine = all.find(c => c.days.join() === days.join() && c.days.every(d => c.typeOf[d] === lay[d]));
  if(!mine || cmpRank(mine.rank, maxRank(all)) !== 0){
    p8bad++;
    if(p8detail.length < 6) p8detail.push('rest=' + (rest.join('+')||'none') + ' built ' + days.map(d=>d+':'+lay[d]).join(' ') +
      ' rank ' + (mine?mine.rank.join(','):'OFF-SPACE') + ' best ' + maxRank(all).join(','));
  }
});
// RE-KEYED BY D130. The old claim was "0 collisions over 704 weeks". Under the split the
// untolerated half must still be exactly zero; the tolerated half is not zero and is not
// supposed to be, so the row pins WHERE it is allowed to appear instead of forbidding it.
ok('P7 no built pace week carries an untolerated hard-run adjacency (' + wkTot + ' weeks)',
   wkTot > 400 && untolHits === 0, untolHits + ' untolerated');
ok('P7b every tolerated CHI-on-eve that ships belongs to one of the 14 named calendars, and no other calendar pays one',
   tolHits > 0 && Object.keys(tolCals).sort().join(' | ') === TOL14.slice().sort().join(' | '),
   tolHits + ' tolerated across ' + Object.keys(tolCals).length + ' calendars: ' + Object.keys(tolCals).sort().join(' | '));
// THE GUARD IS RE-SCALED, NOT REMOVED (V205, D130). This row skips any calendar whose
// built run count equals its training-day count, because there is no choice to be optimal
// about. D130 stopped every single-sport pace calendar from falling back to three, so the
// four-training-day calendars all became uncapped and the capped population went 35 -> 29.
// The claim itself never failed: p8bad has been 0 throughout. A vacuity guard reading a
// population a ruling legitimately shrank gets re-scaled to the new floor; deleting it
// would leave the row able to pass on an empty set.
ok('P8 the built week the athlete gets is rank-optimal (' + p8rows + ' calendars, ' + p8skip + ' uncapped/skipped)',
   p8rows > 25 && p8bad === 0, p8bad + ' suboptimal of ' + p8rows + ' rows: ' + p8detail.join(' | '));

// ── P8b the consumer honours the plan OUTRIGHT, including over the last-day default ──
// This is a SHAPE row, and deliberately so. At the ceiling this artifact ships (three
// runs) the objective never puts the long run mid-week — measured 0 of 64 calendars — so
// no built week can distinguish "the plan wins" from "the last chosen day takes the long
// run back". At a four-run ceiling 2 of 29 capped calendars use the escape and the
// difference becomes visible output. The claim is ruled now, so it is pinned now, on the
// line that carries it; when the ceiling moves this row is backed by P8 as well.
ok('P8b the chooser plan outranks the last-day long-run default in the NSW type loop',
   /let st = _planned \|\| \(isLastSportDay \? 'lsd_long' : \(types\[sportIdx\] \|\| 'lsd_easy'\)\);/.test(SRC));
{
  let off = 0, rows = 0;
  CAL.forEach(({train}) => {
    if(train.length <= 3) return;
    rows++;
    const p = CH(train, 3, 'run_pace_goal', true);
    const days = p.idxs.map(i => train[i]);
    if(days.find(d => p.typeOf[d] === 'lsd_long') !== days[days.length-1]) off++;
  });
  ok('P8c at the three-run ceiling the long run is still the last run of the week (' + rows + ' calendars)', off === 0, off + ' mid-week');
}

// ── P9 run_base and bike keep the fallback: their layout must NOT be the chooser's ──
{
  const train = DAYS.filter(d => ['sun','wed'].indexOf(d) < 0);
  const prog = IA.buildProgram(paceCfg(['sun','wed'], 1001, 'run_base'));
  const lay = runLayout(prog.weeks['1']);
  const days = DAYS.filter(d => lay[d]);
  const longDay = days.find(d => lay[d] === 'lsd_long');
  ok('P9 run_base still ends its week on the long run (even-spread fallback, untouched)',
     !longDay || longDay === days[days.length-1], longDay + ' of ' + days.join('/'));
  ok('P9b run_base carries no INT or CHI (Lydiard block)', !days.some(d => lay[d] === 'int' || lay[d] === 'chi'),
     days.map(d=>d+':'+lay[d]).join(' '));
}
// ── E1 the 208+ row reads the key, and the key must say what the name says ──────────
if(CARD.key) ok('E1 every run card read at ia-version ' + VER + ' names the same quality session in its NSW name and its dose.key (' + cardsRead + ' run cards)',
  cardsRead > 0 && cardSplit === 0, cardSplit + ' disagree: ' + cardSplitAt.join(' | '));
summary(fail ? 1 : 0);
