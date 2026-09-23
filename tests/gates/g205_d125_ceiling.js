// g205_d125_ceiling.js — D125 (amended), the CEILING half.
//
// THE RULING. SPORT_CEILINGS.run_pace_goal goes 3 -> 4 for the NSW pace family,
// CONDITIONALLY: the ceiling is 4 wherever the spacing chooser returns a collision-free
// layout (coll === 0), and falls back to 3 wherever it cannot. Keyed on the chooser's
// return alone — there is NO day-count conjunct, and every training-day count from 4 to 7
// is asked the same question. run_mile_time and run_15_under10 ride along through
// _GOAL_ALIAS. A crowded four-run week is never shipped; that is what the fallback is for.
// The three-run layout itself is out of scope here (D113 is a later slice).
//
// ORACLES, every one independent of the engine:
//   * P2 is an EXHAUSTIVE SEARCH written in this file. For each of the 64 rest-day
//     calendars it enumerates every subset of training days of size four crossed with
//     every permutation of the NSW four-day type row, and asks whether ANY layout reaches
//     zero UNTOLERATED hard-day adjacencies. That question is pure combinatorics over a
//     hand-written adjacency rule and a hand-written tolerated pair; the engine is never
//     consulted to answer it. The engine must deal four runs exactly where the search
//     says untolerated zero is reachable, and three exactly where it is not.
//   * P1 and P3 are the RULING'S AFTER-GRID typed in as literals. Under D130 that grid
//     moved: 64 of 64 calendars take four runs (35/35 at four training days, 21/21, 7/7,
//     1/1). The 50-versus-14 split SURVIVES, on the axis it belongs on — 50 calendars
//     land (untol 0, tol 0) and 14 land (untol 0, tol 1), and those 14 are still named
//     here one calendar per line. They are no longer the calendars that fall back;
//     nothing falls back on single-sport pace any more, and P3f says so.
//   * P4 is the SHIPPED WEEK read back by content, swept 64 calendars x 3 seeds x every
//     built week: 6,336 hard-run pairs, of which ZERO may be untolerated, and every
//     tolerated one must belong to one of the 14.
//   * P5 is MARIO's own calendar, hand-written from the ruling.
//   * P6 is THE 14, re-keyed: the calendars that used to fall back now ship four runs on
//     every seed and in every built week, each paying exactly one tolerated CHI-on-eve
//     and never an untolerated adjacency. P6c keeps the three-run coverage alive where it
//     is still REACHED — multi-sport pace, measured 29 of 64 calendars on run+bike and
//     29 of 64 on run+swim, because multiSportTargets takes max() of the leg ceilings and
//     the chooser never runs on a multi-sport week.
//   * P7 is SCOPE: the multi-sport path never reaches a chooser, so it has no untol===0 to
//     key on and the ruling's fallback holds there at three. run_base, NRC and bike/swim
//     are untouched.
//
// VERSION PREDICATE (standing ruling 4). D125's ceiling half ships on ia-version 205.
//   * at 205 and above the four-run pace ceiling MUST exist; its absence is a named FAIL.
//   * below 205 WITH it present is the pre-bump working artifact mid-slice; rows RUN.
//   * below 205 WITHOUT it is an older build: NOT APPLICABLE, skipped, clean exit.
const path = require('path');
const fs = require('fs');
const { load, weekGrid } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const SRC = fs.readFileSync(ART, 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

let pass = 0, fail = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function summary(code){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(code); }

const VER = Number(IA.IA_VERSION);
// The literal, read out of the source and not out of the engine. It is read INSIDE the
// SPORT_CEILINGS object: three unrelated tables earlier in the file key on the same goal
// id (program length, taper, long-run cap) and a bare match would read one of those.
const BLOCK_M = SRC.match(/SPORT_CEILINGS\s*=\s*\{[\s\S]*?\n\s*\};/);
const CEIL_M = BLOCK_M ? BLOCK_M[0].match(/run_pace_goal:\s*(\d)/) : null;
const CEIL = CEIL_M ? Number(CEIL_M[1]) : null;
const HAS = CEIL === 4 && /_paceCapped\s*&&\s*capDays\s*>\s*3/.test(SRC.replace(/\s+/g, ' '));
if(VER >= 205){
  ok('P0 at ia-version ' + VER + ' the D125 four-run pace ceiling and its fallback exist', HAS,
     'run_pace_goal ceiling ' + CEIL + ', fallback predicate ' + /_paceCapped\s*&&\s*capDays\s*>\s*3/.test(SRC.replace(/\s+/g,' ')));
  if(!HAS) summary(1);
} else if(!HAS){
  console.log('SKIP g205_d125_ceiling: ia-version ' + VER + ' predates the D125 ceiling (NOT APPLICABLE)');
  summary(0);
} else {
  console.log('NOTE ia-version ' + VER + ' with the D125 ceiling present: pre-bump working artifact, rows RUN');
}

// ── the calendar and the doctrine, written here ──────────────────────────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const ISO = IA._ISO_ORDER;
// NSW Table 7's four-day row: one easy, the quality pair, the long run.
const FOUR_ROW = ['lsd_easy','int','chi','lsd_long'];
// A hard run is interval work, continuous high intensity, or the long run.
const HARD = new Set(['int','chi','lsd_long']);
const cpos = d => ISO.indexOf(d);
const adj = (a,b) => { const r = Math.abs(cpos(a)-cpos(b)); return Math.min(r, 7-r) === 1; };

function combos(arr, k){
  if(k === 0) return [[]];
  if(arr.length < k) return [];
  const [h, ...t] = arr;
  return combos(t, k-1).map(c => [h, ...c]).concat(combos(t, k));
}
function perms(a){
  if(!a.length) return [[]];
  const o = [];
  a.forEach((x, i) => perms(a.slice(0, i).concat(a.slice(i+1))).forEach(p => o.push([x, ...p])));
  return o;
}
// D130: TWO HARD DAYS SIDE BY SIDE ARE NOT ONE THING. CHI on the EVE of the long run is
// TOLERATED — the long run is relative recovery under Guide A p.11, so a tempo the day
// before it is a legal pairing and not a collision to design out. Every other adjacency
// is UNTOLERATED. The pair is TYPED and DIRECTIONAL, not positional: prevDay is circular,
// so a Saturday CHI into a Sunday long counts and a Sunday CHI after a Saturday long does
// not. Written here from the ruling's prose; the engine is never asked.
const prevDay = d => ISO[(ISO.indexOf(d) + 6) % 7];
function classify(days, types){
  const typeOf = {}; days.forEach((d, i) => typeOf[d] = types[i]);
  const h = days.filter(d => HARD.has(typeOf[d]));
  const L = days.find(d => typeOf[d] === 'lsd_long');
  let untol = 0, tol = 0;
  for(let a = 0; a < h.length; a++) for(let b = a+1; b < h.length; b++){
    if(!adj(h[a], h[b])) continue;
    const x = h[a], y = h[b];
    const chiEve = !!L && ((typeOf[x] === 'chi' && y === L && x === prevDay(L))
                        || (typeOf[y] === 'chi' && x === L && y === prevDay(L)));
    if(chiEve) tol++; else untol++;
  }
  return { untol, tol };
}
// THE ORACLE: the best (untolerated, tolerated) pair a four-run week can reach on this
// training calendar, lexicographic, untolerated first. Four runs ship exactly where the
// untolerated half of that floor is zero.
const FOUR_PERMS = perms(FOUR_ROW);
function bestFour(train){
  let b = null;
  combos(train, 4).forEach(sub => FOUR_PERMS.forEach(p => {
    const s = classify(sub, p);
    if(!b || s.untol < b.untol || (s.untol === b.untol && s.tol < b.tol)) b = s;
  }));
  return b;
}

function paceCfg(rest, seed, goalId){
  return { name:'P', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:{ id: goalId || 'run_pace_goal', label:'Pace', targetDist:'1.5', targetMins:'10',
      targetSecs:'0', mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } },
    eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate',
    ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:rest, days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed };
}
// Read a built week's runs by CONTENT, never by position.
function runLayout(w){
  const lay = {};
  DAYS.forEach(d => {
    const day = w[d]; if(!day || !day.cardio) return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => {
      if(c.type !== 'run') return;
      const s = String(c.subtype || '');
      if(/Interval \(INT\)/.test(s)) lay[d] = 'int';
      else if(/Continuous High Intensity \(CHI\)/.test(s)) lay[d] = 'chi';
      else if(/Long Slow Distance \(LSD\)/.test(s)) lay[d] = c.legLoad ? 'lsd_long' : 'lsd_easy';
      else lay[d] = 'other';
    });
  });
  return lay;
}

// ── P1 the literal ───────────────────────────────────────────────────────────────────
ok('P1 SPORT_CEILINGS.run_pace_goal is 4 (was 3 before D125 amended)', CEIL === 4, CEIL);

// ── P2 the engine's four-or-three decision equals the exhaustive search ──────────────
// ── P3 the after-grid counts, typed from the ruling ──────────────────────────────────
// D130 moved this grid: every calendar reaches untolerated zero at four runs, so every
// calendar takes four. Before D130 this read 21/35 at four training days.
const AFTER = { 4: { four: 35, tot: 35 }, 5: { four: 21, tot: 21 }, 6: { four: 7, tot: 7 }, 7: { four: 1, tot: 1 } };
// THE 14, named in the ruling. Before D130 these were the calendars that fell back to
// three runs. Under D130 they are the calendars whose four-run floor is (untol 0, tol 1):
// they ship four runs and pay exactly one tolerated CHI-on-eve. Same 14 calendars, same
// literal, a different claim. Rest days, sorted week order.
const TOL14 = [
  'sun,mon,tue', 'sun,mon,thu', 'sun,mon,sat', 'sun,wed,thu', 'sun,wed,sat',
  'sun,fri,sat', 'mon,tue,wed', 'mon,tue,fri', 'mon,thu,fri', 'tue,wed,thu',
  'tue,wed,sat', 'tue,fri,sat', 'wed,thu,fri', 'thu,fri,sat'
];
const seen = { 4:{four:0,tot:0}, 5:{four:0,tot:0}, 6:{four:0,tot:0}, 7:{four:0,tot:0} };
const oracleMismatch = [], fellBack = [], tolFloor = [];
[3,2,1,0].forEach(nRest => combos(DAYS, nRest).forEach(rest => {
  const train = DAYS.filter(d => rest.indexOf(d) < 0);
  const nTrain = train.length;
  const prog = IA.buildProgram(paceCfg(rest, 1001));
  const lay = runLayout(prog.weeks['1']);
  const days = DAYS.filter(d => lay[d]);
  const key = rest.join(',') || 'none';
  seen[nTrain].tot++;
  if(days.length === 4) seen[nTrain].four++; else fellBack.push(key);
  // P2: the engine's count must equal the oracle's verdict, and the verdict is now keyed
  // on the UNTOLERATED half of the floor alone. A calendar that can only reach untol 0 by
  // paying a tolerated CHI-on-eve still gets four runs; that is the whole of D130.
  const floor = bestFour(train);
  const reachable = floor.untol === 0;
  if((days.length === 4) !== reachable)
    oracleMismatch.push(key + ' engine=' + days.length + ' runs, exhaustive search says untolerated zero at four is ' +
                        (reachable ? 'REACHABLE' : 'IMPOSSIBLE'));
  // P3f: the calendars whose floor is (0,1) — untolerated clean, one tolerated pair paid.
  if(floor.untol === 0 && floor.tol > 0) tolFloor.push(key);
}));
ok('P2 the engine deals four runs exactly where an exhaustive search reaches ZERO UNTOLERATED adjacency at four, and three where it cannot (64 calendars)',
   oracleMismatch.length === 0, oracleMismatch.join(' | '));
[4,5,6,7].forEach(n => ok('P3 at ' + n + ' training days ' + AFTER[n].four + ' of ' + AFTER[n].tot +
  ' calendars take four runs', seen[n].four === AFTER[n].four && seen[n].tot === AFTER[n].tot,
  seen[n].four + '/' + seen[n].tot));
ok('P3e all 64 rest-day calendars take four runs (was 50 of 64 before D130 split rank 1)',
   seen[4].four + seen[5].four + seen[6].four + seen[7].four === 64,
   seen[4].four + seen[5].four + seen[6].four + seen[7].four);
// RE-KEYED, NOT RETIRED. The old claim was "the 14 that fall back are exactly these".
// D130 empties the fallback on single-sport pace, so the row now carries BOTH halves of
// what replaced it: nothing falls back, AND the same 14 named calendars are exactly the
// ones whose four-run floor costs one tolerated CHI-on-eve. Deleting the row would have
// dropped the 14-calendar literal, which is the only hand-written name list in this file.
ok('P3f D130 empties the fallback on single-sport pace, and the 14 the ruling names are exactly the calendars whose four-run floor is (untol 0, tol 1)',
   fellBack.length === 0 && tolFloor.slice().sort().join(' | ') === TOL14.slice().sort().join(' | '),
   'fellBack=[' + fellBack.join(' ') + '] floor(0,1)=' + tolFloor.slice().sort().join(' | '));

// ── P4 nothing UNTOLERATED ever ships, anywhere ──────────────────────────────────────
// Widened from 64 week-1 layouts to 64 calendars x 3 seeds x every built week, because
// D130's claim is about a pair type and the later weeks swap INT and CHI in place: if
// that swap ever put INT on the long run's eve it would be an untolerated adjacency in a
// week nobody looked at. Denominator is hard-run PAIRS examined, not weeks.
{
  const SEEDS = [1001, 4004, 7007];
  let pairs = 0, untol = 0, tol = 0, weeks = 0; const stray = [], strayCal = {};
  [3,2,1,0].forEach(nRest => combos(DAYS, nRest).forEach(rest => {
    const key = rest.join(',') || 'none';
    SEEDS.forEach(seed => {
      const prog = IA.buildProgram(paceCfg(rest, seed));
      Object.keys(prog.weeks).forEach(wk => {
        const lay = runLayout(prog.weeks[wk]);
        const days = DAYS.filter(d => lay[d]);
        const h = days.filter(d => HARD.has(lay[d]));
        weeks++;
        pairs += h.length * (h.length - 1) / 2;
        const s = classify(days, days.map(d => lay[d]));
        untol += s.untol; tol += s.tol;
        if(s.untol > 0 && stray.length < 6) stray.push(key + ' seed' + seed + ' wk' + wk + ' -> ' + days.map(d => d + ':' + lay[d]).join(' '));
        if(s.tol > 0) strayCal[key] = 1;
      });
    });
  }));
  ok('P4 no built pace week carries an untolerated hard-run adjacency (' + pairs + ' hard-run pairs over ' + weeks + ' weeks)',
     pairs === 6336 && untol === 0,
     pairs + ' hard-run pairs (ruling says 6336) and ' + untol + ' untolerated: ' + stray.join(' | '));
  ok('P4b every tolerated adjacency that ships belongs to one of the 14, and no other calendar pays one',
     Object.keys(strayCal).sort().join(' | ') === TOL14.slice().sort().join(' | '),
     tol + ' tolerated across ' + Object.keys(strayCal).length + ' calendars: ' + Object.keys(strayCal).sort().join(' | '));
}

// ── P5 Mario ─────────────────────────────────────────────────────────────────────────
{
  const prog = IA.buildProgram(paceCfg(['sun','wed'], 76308));
  const lay = runLayout(prog.weeks['1']);
  const WANT = { mon:'int', thu:'chi', fri:'lsd_easy', sat:'lsd_long' };
  const got = DAYS.filter(d => lay[d]).map(d => d + ':' + lay[d]).join(' ');
  const want = Object.keys(WANT).map(d => d + ':' + WANT[d]).join(' ');
  ok('P5 Mario (rest sun+wed) gets four runs laid MON int / THU chi / FRI easy / SAT long', got === want, got);
  ok('P5b Mario\'s TUE is the run-free training day', !lay['tue'] && !prog.weeks['1'].tue.rest,
     'tue run=' + (lay['tue'] || 'none') + ' rest=' + prog.weeks['1'].tue.rest);
  // The eve of the long run is closed to pull and legs (D36/D127 doctrine, date arithmetic here).
  let eveHits = 0;
  Object.keys(prog.weeks).forEach(wk => {
    const w = prog.weeks[wk];
    const l = runLayout(w);
    const longDay = DAYS.find(d => l[d] === 'lsd_long'); if(!longDay) return;
    const eve = ISO[(ISO.indexOf(longDay) + 6) % 7];
    const t = (w[eve] && w[eve].title) || '';
    if(t === 'Posterior Chain' || t === 'Leg Strength + Mobility') eveHits++;
  });
  ok('P5c across Mario\'s whole block nothing heavy lands on the long-run eve', eveHits === 0, eveHits + ' weeks');
}

// ── P6 the fallback is a clean three, never a crowded four ───────────────────────────
{
  const SEEDS = [1001, 4004, 7007];
  let weeks = 0, offFour = 0, untol = 0, tolWrong = 0;
  TOL14.forEach(key => {
    const rest = key.split(',');
    SEEDS.forEach(seed => {
      const prog = IA.buildProgram(paceCfg(rest, seed));
      Object.keys(prog.weeks).forEach(wk => {
        const lay = runLayout(prog.weeks[wk]);
        const days = DAYS.filter(d => lay[d]);
        weeks++;
        if(days.length !== 4) offFour++;
        const s = classify(days, days.map(d => lay[d]));
        untol += s.untol;
        if(s.tol !== 1) tolWrong++;
      });
    });
  });
  ok('P6 the 14 build exactly four runs in every week on every seed (' + weeks + ' weeks, was three before D130)',
     weeks === 462 && offFour === 0, offFour + ' off four of ' + weeks);
  ok('P6b and every one of those weeks pays exactly one tolerated CHI-on-eve and nothing untolerated',
     untol === 0 && tolWrong === 0, untol + ' untolerated, ' + tolWrong + ' weeks not at exactly one tolerated');
}
// ── P6c the three-run layout is not dead — it moved to multi-sport pace ──────────────
// D130 means no SINGLE-sport pace program falls back to three runs, so the four-versus-
// three decision would have no live coverage at all if this row did not exist. It does
// have one: multiSportTargets takes max() of the leg ceilings and then trims for the lift
// floor, and the chooser never runs on a multi-sport week, so getSessionTypes' three-day
// row is still reached. Measured, built, both sports: 29 of 64 calendars each.
{
  const want = { bike: 29, swim: 29 };
  const got = {}, dirty = [];
  ['bike','swim'].forEach(other => {
    let three = 0;
    [3,2,1,0].forEach(nRest => combos(DAYS, nRest).forEach(rest => {
      const ms = paceCfg(rest, 1001);
      ms.cardioTypes = ['run', other];
      ms.cardioGoals = { run: ms.cardioGoals.run, bike:{ id:'bike_base', label:'Base', baselineDist:'10', baseline:'10mi' },
        swim:{ id:'swim_base', label:'Base', baselineDist:'1000', baseline:'1000m' } };
      delete ms.cardioGoals[other === 'bike' ? 'swim' : 'bike'];
      const lay = runLayout(IA.buildProgram(ms).weeks['1']);
      const days = DAYS.filter(d => lay[d]);
      if(days.length === 3){
        three++;
        const s = classify(days, days.map(d => lay[d]));
        if(s.untol > 0 && dirty.length < 6) dirty.push(other + ' ' + (rest.join(',') || 'none') + ' -> ' + days.map(d => d + ':' + lay[d]).join(' '));
      }
    }));
    got[other] = three;
  });
  ok('P6c multi-sport pace still reaches the three-run week on 29 of 64 calendars for run+bike and run+swim',
     got.bike === want.bike && got.swim === want.swim, 'bike ' + got.bike + '/64, swim ' + got.swim + '/64');
  ok('P6d and every one of those three-run weeks is free of untolerated adjacency',
     dirty.length === 0, dirty.join(' | '));
}

// ── P7 scope: no chooser means no four ───────────────────────────────────────────────
{
  const ms = paceCfg(['sun','wed'], 1001);
  ms.cardioTypes = ['run','bike'];
  ms.cardioGoals = { run: ms.cardioGoals.run, bike:{ id:'bike_base', label:'Base', baselineDist:'10', baseline:'10mi' } };
  const lay = runLayout(IA.buildProgram(ms).weeks['1']);
  const n = DAYS.filter(d => lay[d]).length;
  ok('P7 a multi-sport pace week never reaches the chooser, so the ruling\'s fallback holds it at three runs',
     n === 3, n);
  const rb = runLayout(IA.buildProgram(paceCfg(['sun','wed'], 1001, 'run_base')).weeks['1']);
  const rbDays = DAYS.filter(d => rb[d]);
  ok('P7b run_base keeps its own ceiling of four and its Lydiard block (no INT)',
     rbDays.length === 4 && !rbDays.some(d => rb[d] === 'int'), rbDays.map(d => d + ':' + rb[d]).join(' '));
  ok('P7c the two aliased pace ids move with run_pace_goal',
     ['run_mile_time','run_15_under10'].every(g =>
       DAYS.filter(d => runLayout(IA.buildProgram(paceCfg(['sun','wed'], 1001, g)).weeks['1'])[d]).length === 4),
     'alias run counts differ from run_pace_goal');
}
summary(fail ? 1 : 0);
