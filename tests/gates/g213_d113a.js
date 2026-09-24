// g213_d113a.js — GATE for D113a (coach, as amended twice in the V213 session; Mario concurred:
// ship with the spacer fallback) and D146 (the multi-sport run days are placed by the spacing
// chooser, on NRC as on the pace family).
//
//   node tests/gates/g213_d113a.js [candidate] [baseline V212]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   D113a  The three-run pace week is INT / CHI / long, both qualities every week from week 1.
//          Where no layout of those three on the athlete's three days avoids an untolerated
//          hard-beside-hard pair (7 of the 35 three-day calendars), the week keeps the V212
//          shape, easy / INT / long, and its one quality slot crosses INT to CHI at the V115
//          crossover. A multi-sport pace week with three or more runs is placed by the same
//          chooser. Injury modes whose sweep rewrites every run (noimpact, noimpact_swim, easy,
//          reduce) are excluded: those builds stay as V212 shipped them.
//   D146   A multi-sport NRC week with two or more runs is placed by the spacing chooser, and
//          spaceHardCardio leaves that planned run week alone. Under the four excluded modes it is
//          not routed (coach, V213 slice 2c): those builds stay as V212 shipped them.
//
// ORACLES, independent of the engine. _nrcSpacedRunDays, getSessionTypes, qualityCrossoverWeek,
// PACE_GOALS and dose.key are never called or read:
//   class      from the card's subtype text with the D103a mapping: "Short Interval (SI)" is INT,
//              "Long Interval (LI)" is CHI, "Long Slow Distance (LSD)" is the long run when the card
//              loads the legs and the easy run when it does not; NRC "Speed Run" is quality, NRC
//              "Long Run" is the long run; RACE DAY and TIME TRIAL are the race.
//   adjacency  the D130 ruling text, typed: two hard runs on neighbouring days of the circular week
//              are a pair; the one TOLERATED pair is a run CHI on the calendar eve of the run long
//              run. Every other pair is UNTOLERATED.
//   calendars  the 7 spacer calendars are enumerated HERE, engine-free, from the typed adjacency:
//              the three-day calendars on which no order of INT / CHI / long reaches zero
//              untolerated. HF pins the enumeration to the 7 typed from measure.
//   crossover  cross = max(3, ceil(tw × 0.55)), typed from the V115 ruling text.
//   ISO week   Monday to Sunday, typed; "the last run of the week" is read in that order.
//   V212       the shipped artifact, read from argv[3] when it reads ia-version 212, else from git
//              at the V212 commit (169537c). It is the baseline for the pair rows and the source of
//              the NRC name set (NRC session names are a hard invariant; no V213 ruling adds one).
//
// ROWS
//   R1   pace, solo and multi-sport: 0 weeks with an untolerated hard run pair. R1v: the lattice
//        reaches multi-sport three-run weeks.
//   R2   NRC multi-sport (D146's population): 0 weeks with an untolerated hard run pair, and in every
//        week with a long run no run follows it in the ISO week. R2v: the lattice reaches long-run
//        weeks. Solo NRC is outside D146: its days are V153's chooser, which this build does not touch.
//   R3   excluded modes (noimpact, noimpact_swim, easy, reduce), pace solo and multi-sport: every
//        build byte-identical to V212. PAIR. R3v: all four modes reached, each with multi-sport builds.
//   R3n  the same claim on NRC multi-sport (slice 2c): run_5k + bike and run_half + swim under one
//        state per excluded mode, every calendar, byte-identical to V212. PAIR.
//   R8   RULING-LEVEL, from 213 up (V214 close C): pace multi-sport under the four excluded modes keeps
//        V212's day-by-day sport layout (the chooser does not route). R8n: the same on NRC multi-sport.
//        R8v: the lattice reaches every excluded mode, and the uninjured twins ARE routed (their layout
//        differs from V212), so R8 and R8n can fail. Not a pair row: V212 is the ruling's named oracle.
//   R4   the 7 spacer calendars at tw 6/9/11/15: three runs a week, one quality a week, INT weeks
//        1..cross-1, CHI weeks cross..tw. R4p: cardio byte-identical to V212 on every day. PAIR.
//   R5   the 28 spaceable three-day calendars at tw 6/9/11/15: three runs, one INT, one CHI and
//        one long run every week, and no untolerated pair.
//   R6   multi-sport pace builds whose V212 week never holds more than two runs: digest unmoved
//        against V212. PAIR.
//   R7   NRC run card names: every name the candidate prints on the NRC lattice is one V212 prints
//        on the same lattice. R7v: the name set is not empty.
//   R0   identity fuzz: V212 built twice from the same cfg is identical. PAIR.
//   HM   HALF_MANNY shipped digest, typed: 0ac7da6b1691a8e1 (ruled unmoved). PAIR.
//
// VERSION PREDICATE (standing ruling 4). D113a and D146 ship on ia-version 213.
//   below 213: NOT APPLICABLE, every row skipped by name, clean exit.
//   R0, R3, R3n, R4p, R6 and HM say "this build changed nothing else", so they are scoped to the build
//   pair (candidate 213, baseline V212) and print SCOPED OUT on any later candidate. R1, R2, R4, R5
//   and R7 are the ruling's own claims and enforce at every version from 213 up. A pair row with no
//   baseline FAILS: a claim that did not run is not a pass.
// Run on V212 forced to 213, R1, R2 and R5 fail; on the V213 build every row passes.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version;
const ERA = 213;
const PAIR = VER === ERA;                 // build-pair rows run only for candidate 213 vs V212
const V212_COMMIT = '169537cb615546b6b68c6826887a70fc11e1d5cd';
const HM_DIGEST = '0ac7da6b1691a8e1';

let pass = 0, fail = 0, skip = 0, scoped = 0, fixt = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function fixture(label, cond, got){ fixt++; ok('HF ' + label, cond, got); }
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function pairRow(label, cond, got){
  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 213/212 only; candidate is ' + VER + '] (now ' + got + ')'); return; }
  ok(label, cond, got);
}
function summary(){
  console.log('\nfixture guards ' + fixt + '  SCOPED OUT ' + scoped + '  SKIP ' + skip);
  console.log('PASS ' + pass + ' FAIL ' + fail);
  process.exit(fail ? 1 : 0);
}
if(!(VER >= ERA)){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D113a/D146 (V' + ERA + ').');
  ['HF','R0','R1','R1v','R2','R2v','R3','R3v','R3n','R8','R8n','R8v','R4','R4p','R5','R6','R7','R7v','HM'].forEach(r => skipRow(r + ' skipped below the D113a/D146 era'));
  summary();
}

// ── the hand oracles ─────────────────────────────────────────────────────────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];          // circular week, D130
const ISO = ['mon','tue','wed','thu','fri','sat','sun'];           // ISO week, "last run" order
const POS = d => DAYS.indexOf(d);
const CIRC = (a, b) => { const r = Math.abs(POS(a) - POS(b)); return Math.min(r, 7 - r); };
const PREV = d => DAYS[(POS(d) + 6) % 7];
const RHARD = new Set(['int','chi','long','hardq','nlong','race','hardx']);
function cls(c){
  const s = String(c.subtype || '');
  if(c.type !== 'run') return c.type;
  if(/TIME TRIAL|RACE DAY/i.test(s)) return 'race';
  if(/Short Interval \(SI\)/.test(s)) return 'int';
  if(/Long Interval \(LI\)/.test(s)) return 'chi';
  if(/^Long Slow Distance \(LSD\)/.test(s)) return c.legLoad ? 'long' : 'easy';
  if(/^Speed Run/.test(s)) return 'hardq';
  if(/^Long Run/.test(s)) return 'nlong';
  if(/^(Easy Run|Recovery Run|Shakeout)/.test(s)) return 'easy';
  return c.legLoad ? 'hardx' : 'easyx';
}
const cards = x => (!x || !x.cardio) ? [] : [].concat(x.cardio).filter(Boolean);
function runsOf(week){ const out = []; DAYS.forEach(d => cards(week && week[d]).forEach(c => { if(c.type === 'run') out.push({day:d, t:cls(c), c}); })); return out; }
// D130, typed: count untolerated hard-run pairs in one week.
function untol(R){
  const hard = R.filter(x => RHARD.has(x.t)); const L = R.find(x => x.t === 'long'); let u = 0;
  for(let a = 0; a < hard.length; a++) for(let b = a + 1; b < hard.length; b++){
    const x = hard[a], y = hard[b]; if(CIRC(x.day, y.day) !== 1) continue;
    const tol = !!L && ((x.t === 'chi' && y === L && x.day === PREV(L.day)) || (y.t === 'chi' && x === L && y.day === PREV(L.day)));
    if(!tol) u++;
  }
  return u;
}
function combos(a, k){ if(k === 0) return [[]]; if(a.length < k) return []; const [h, ...t] = a; return combos(t, k - 1).map(c => [h, ...c]).concat(combos(t, k)); }
const PERMS = [['int','chi','long'],['int','long','chi'],['chi','int','long'],['chi','long','int'],['long','int','chi'],['long','chi','int']];
const THREE = combos(DAYS, 3);
const SPACER = THREE.filter(c => Math.min(...PERMS.map(p => untol(c.map((d, i) => ({day:d, t:p[i]})))) ) > 0).map(c => c.join('+'));
const SPACER_TYPED = ['sun+mon+tue','sun+mon+sat','sun+fri+sat','mon+tue+wed','tue+wed+thu','wed+thu+fri','thu+fri+sat'];
const handCross = tw => Math.max(3, Math.ceil(tw * 0.55));

// HF: the oracles against typed facts (artifact-independent; cannot fail for any index.html).
fixture('35 three-day calendars enumerated', THREE.length === 35, THREE.length);
fixture('the spacer set is the 7 typed calendars', JSON.stringify(SPACER) === JSON.stringify(SPACER_TYPED), SPACER.join(' '));
fixture('D130: CHI on the eve of the long run is tolerated', untol([{day:'fri',t:'chi'},{day:'sat',t:'long'}]) === 0);
fixture('D130: INT on the eve of the long run is untolerated', untol([{day:'fri',t:'int'},{day:'sat',t:'long'}]) === 1);
fixture('D130: CHI the day AFTER the long run is untolerated', untol([{day:'sun',t:'chi'},{day:'sat',t:'long'}]) === 1);
fixture('D130: Saturday and Sunday are neighbours on the circular week', untol([{day:'sat',t:'int'},{day:'sun',t:'chi'}]) === 1);
fixture('D130: a rest day between breaks the pair', untol([{day:'mon',t:'int'},{day:'wed',t:'chi'}]) === 0);
fixture('crossover typed: tw 6/9/11/15 cross at 4/5/7/9', [6,9,11,15].map(handCross).join(',') === '4,5,7,9', [6,9,11,15].map(handCross).join(','));
fixture('class: "Short Interval (SI)" is INT, "Long Interval (LI)" is CHI',
  cls({type:'run', subtype:'Short Interval (SI) — 4 × 400m'}) === 'int' && cls({type:'run', subtype:'Long Interval (LI) — 2 × 1 mile'}) === 'chi');
fixture('class: LSD is the long run only when it loads the legs',
  cls({type:'run', subtype:'Long Slow Distance (LSD)', legLoad:true}) === 'long' && cls({type:'run', subtype:'Long Slow Distance (LSD)', legLoad:false}) === 'easy');

// ── cfg builders: the dimensions of tests/measure/v213_d113a_remeasure.js ────────────────
const cl = o => JSON.parse(JSON.stringify(o));
const FOCI = ['support_prevention','balanced','strength'];
const RUNG = { run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'}, run_5k:{}, run_10k:{}, run_half:{}, run_marathon:{} };
const CALS = []; [0,1,2,3,4].forEach(n => combos(DAYS, n).forEach(r => CALS.push(r)));
function mkCfg(g, ex, rest, focus, extra){
  const cg = {run:Object.assign({id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi'}, RUNG[g] || {})};
  const types = ['run'];
  if(ex.bike){ types.push('bike'); cg.bike = {id:ex.bike, label:ex.bike, baselineDist:'10', baseline:'10mi'}; }
  if(ex.swim){ types.push('swim'); cg.swim = {id:ex.swim, label:ex.swim, baselineDist:'1000', baseline:'1000m'}; }
  return Object.assign({name:'G213', primaryPath:'goal', cardioTypes:types, cardioGoals:cg, eventTargeted:false, liftingFocus:focus,
    experience:'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:rest.slice(), days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed:1001}, extra || {});
}
const BIKEG = ['bike_base','bike_ftp','bike_century'], SWIMG = ['swim_base','swim_500_time','swim_mile'];
const EXTRAS = []; BIKEG.forEach(b => EXTRAS.push({bike:b})); SWIMG.forEach(s => EXTRAS.push({swim:s}));
BIKEG.forEach(b => SWIMG.forEach(s => EXTRAS.push({bike:b, swim:s})));
const NRC_EX = [{bike:'bike_base'},{bike:'bike_ftp'},{swim:'swim_base'},{swim:'swim_mile'},{bike:'bike_base', swim:'swim_base'}];

// ── the V212 baseline ────────────────────────────────────────────────────────────────────
let BASE = null, baseWhy = '';
if(BASEFILE && fs.existsSync(BASEFILE)){ const b = load(BASEFILE); if(+b.version === 212){ BASE = b; baseWhy = 'argv baseline ' + BASEFILE; } else baseWhy = 'argv baseline reads ' + b.version + ', not 212; '; }
if(!BASE){
  try {
    const repo = path.join(__dirname, '..', '..');
    const f = path.join(os.tmpdir(), 'g213_v212_' + process.pid + '.html'); try { fs.unlinkSync(f); } catch(e) {}
    fs.writeFileSync(f, cp.execFileSync('git', ['-C', repo, 'show', V212_COMMIT + ':index.html'], {maxBuffer: 1 << 27}));
    const b = load(f); if(+b.version === 212){ BASE = b; baseWhy += 'git ' + V212_COMMIT.slice(0, 7); } else baseWhy += 'git copy reads ' + b.version;
    try { fs.unlinkSync(f); } catch(e) {}
  } catch(e) { baseWhy += 'git show failed: ' + String(e.message).slice(0, 80); }
}
console.log('baseline: ' + (BASE ? 'V212 from ' + baseWhy : 'UNAVAILABLE (' + baseWhy + ')'));
const build = (I, cfg) => I.buildProgram(cl(cfg));
const weeksOf = p => Object.keys(p.weeks).map(Number).sort((a, b) => a - b);
const maxRuns = p => Math.max(0, ...weeksOf(p).map(w => runsOf(p.weeks[w]).length));

// ── R1 / R6: pace, solo and multi-sport ──────────────────────────────────────────────────
{
  let n = 0, crash = 0, W = 0, uW = 0, ex = null, three = 0, r6n = 0, r6mv = 0, r6ex = null;
  const LAT = [];
  CALS.forEach((rest, i) => LAT.push({ex:{}, rest, f:FOCI[i % 3]}));
  EXTRAS.forEach((e, j) => CALS.forEach((rest, i) => LAT.push({ex:e, rest, f:FOCI[(i + j) % 3]})));
  LAT.forEach(x => {
    const cfg = mkCfg('run_pace_goal', x.ex, x.rest, x.f); let p;
    try { p = build(IA, cfg); } catch(e) { crash++; return; } n++;
    const multi = Object.keys(x.ex).length > 0;
    weeksOf(p).forEach(w => { const R = runsOf(p.weeks[w]); W++; if(multi && R.length === 3) three++;
      if(untol(R)){ uW++; if(!ex) ex = (multi ? JSON.stringify(x.ex) : 'solo') + ' rest=' + x.rest + ' W' + w + ' ' + R.map(r => r.day + ':' + r.t).join(' '); } });
    if(multi && BASE){ const b = build(BASE, cfg); if(maxRuns(b) <= 2){ r6n++; if(progDigest(b) !== progDigest(p)){ r6mv++; if(!r6ex) r6ex = JSON.stringify(x.ex) + ' rest=' + x.rest; } } }
  });
  ok('R1 pace lattice builds without a crash (' + LAT.length + ' configs)', crash === 0 && n === LAT.length, crash + ' crashes');
  ok('R1v the pace lattice reaches multi-sport three-run weeks (' + three + ')', three > 100, three);
  ok('R1 pace, solo and multi-sport: 0 weeks with an untolerated hard run pair (of ' + W + ' weeks)', uW === 0, uW + ', first ' + ex);
  if(!BASE) pairRow('R6 multi-sport pace builds with two runs a week at most need the V212 baseline', false, baseWhy);
  else pairRow('R6 multi-sport pace builds whose V212 week holds two runs at most are unmoved against V212 (' + r6n + ' builds)', r6n > 100 && r6mv === 0, r6mv + ', first ' + r6ex);
}

// ── R2 / R7: NRC, solo and multi-sport ───────────────────────────────────────────────────
{
  let n = 0, crash = 0, W = 0, uW = 0, uex = null, LW = 0, notLast = 0, lex = null;
  const names = new Set(), baseNames = new Set(); let bcrash = 0;
  const LAT = [];
  ['run_5k','run_10k','run_half','run_marathon'].forEach((g, gi) => {
    NRC_EX.forEach((e, j) => CALS.forEach((rest, i) => LAT.push({g, ex:e, rest, f:FOCI[(i + j + gi) % 3]})));
  });
  const IP = d => ISO.indexOf(d);
  LAT.forEach(x => {
    const cfg = mkCfg(x.g, x.ex, x.rest, x.f); let p;
    try { p = build(IA, cfg); } catch(e) { crash++; return; } n++;
    weeksOf(p).forEach(w => { const R = runsOf(p.weeks[w]); W++;
      R.forEach(r => names.add(String(r.c.subtype || '')));
      if(untol(R)){ uW++; if(!uex) uex = x.g + ' ' + JSON.stringify(x.ex) + ' rest=' + x.rest + ' W' + w + ' ' + R.map(r => r.day + ':' + r.t).join(' '); }
      const L = R.find(r => r.t === 'nlong');
      if(L){ LW++; if(R.some(r => IP(r.day) > IP(L.day))){ notLast++; if(!lex) lex = x.g + ' ' + JSON.stringify(x.ex) + ' rest=' + x.rest + ' W' + w + ' ' + R.map(r => r.day + ':' + r.t).join(' '); } } });
    if(BASE){ try { const b = build(BASE, cfg); weeksOf(b).forEach(w => runsOf(b.weeks[w]).forEach(r => baseNames.add(String(r.c.subtype || '')))); } catch(e) { bcrash++; } }
  });
  ok('R2 NRC lattice builds without a crash (' + LAT.length + ' configs)', crash === 0 && n === LAT.length, crash + ' crashes');
  ok('R2v the NRC lattice reaches long-run weeks (' + LW + ')', LW > 1000, LW);
  ok('R2 NRC multi-sport: 0 weeks with an untolerated hard run pair (of ' + W + ' weeks)', uW === 0, uW + ', first ' + uex);
  ok('R2 NRC multi-sport: the long run is the last run of its ISO week in every long-run week (' + LW + ' weeks)', notLast === 0, notLast + ', first ' + lex);
  if(!BASE) ok('R7 NRC run card names need the V212 name set', false, baseWhy);
  else {
    const extra = [...names].filter(s => !baseNames.has(s));
    ok('R7v V212 prints a non-empty NRC run name set on the same lattice (' + baseNames.size + ' names, ' + bcrash + ' baseline crashes)', baseNames.size > 10 && bcrash === 0, baseNames.size);
    ok('R7 NRC run card names are verbatim: every one of the candidate\'s ' + names.size + ' names is one V212 prints', extra.length === 0, extra.length + ' new: ' + JSON.stringify(extra.slice(0, 4)));
  }
}

// ── R3: excluded injury modes are byte-identical to V212 ─────────────────────────────────
{
  const MODES = new Set(['noimpact','noimpact_swim','easy','reduce']);
  const INJ = [{region:'knee',tier:'protect'},{region:'hip',tier:'protect'},{region:'knee',tier:'workaround'},{region:'ankle',tier:'workaround'}];
  const EXC = [{},{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp', swim:'swim_mile'}];
  if(!BASE){ pairRow('R3 excluded injury modes need the V212 baseline', false, baseWhy); pairRow('R3v excluded mode reach needs the V212 baseline', false, baseWhy); }
  else if(!PAIR){ pairRow('R3 excluded injury modes byte-identical to V212', false, 'n/a'); pairRow('R3v excluded mode reach', false, 'n/a'); }
  else {
    const plan = BASE.eval('injuryPlan');     // V212's own plan picks the population; the claim is the identity
    let n = 0, mv = 0, ex = null, crash = 0; const reach = {}, multiReach = {};
    EXC.forEach((e, j) => INJ.forEach(inj => CALS.forEach((rest, i) => {
      const cfg = mkCfg('run_pace_goal', e, rest, FOCI[(i + j) % 3], {injury:inj});
      const mode = (plan(cl(cfg)) || {}).cardioMode || 'none'; if(!MODES.has(mode)) return;
      let a, b; try { a = build(IA, cfg); b = build(BASE, cfg); } catch(err) { crash++; return; }
      n++; reach[mode] = (reach[mode] || 0) + 1; if(Object.keys(e).length) multiReach[mode] = (multiReach[mode] || 0) + 1;
      if(progDigest(a) !== progDigest(b)){ mv++; if(!ex) ex = mode + ' ' + JSON.stringify(e) + ' ' + inj.region + '/' + inj.tier + ' rest=' + rest; }
    })));
    pairRow('R3v the lattice reaches all four excluded modes, each with multi-sport builds (' + JSON.stringify(reach) + ' multi-sport ' + JSON.stringify(multiReach) + ')',
      crash === 0 && [...MODES].every(m => reach[m] > 0 && multiReach[m] > 0), JSON.stringify(multiReach) + ' crash ' + crash);
    pairRow('R3 excluded injury modes, pace solo and multi-sport: every build byte-identical to V212 (' + n + ' builds)', n > 0 && mv === 0, mv + ', first ' + ex);
  }
}

// ── R3n: NRC multi-sport under the excluded modes is byte-identical to V212 (slice 2c) ──────────
// Coach, V213: the NRC arm of the multi-sport routing honours the exclusion key as the pace arm does.
// Those modes rewrite every run, so there is nothing for the chooser to space and the week keeps the
// layout V212 dealt it. V212's own injuryPlan picks the population; the claim is the identity.
{
  const MODES = new Set(['noimpact','noimpact_swim','easy','reduce']);
  const INJ = [{region:'knee',tier:'protect'},{region:'hip',tier:'protect'},{region:'knee',tier:'workaround'},{region:'ankle',tier:'workaround'}];
  const SAMPLE = [['run_5k', {bike:'bike_base'}], ['run_half', {swim:'swim_base'}]];
  if(!BASE) pairRow('R3n NRC multi-sport excluded modes need the V212 baseline', false, baseWhy);
  else if(!PAIR) pairRow('R3n NRC multi-sport excluded modes byte-identical to V212', false, 'n/a');
  else {
    const plan = BASE.eval('injuryPlan');
    let n = 0, mv = 0, ex = null, crash = 0; const reach = {};
    SAMPLE.forEach(([g, e], j) => INJ.forEach(inj => CALS.forEach((rest, i) => {
      const cfg = mkCfg(g, e, rest, FOCI[(i + j) % 3], {injury:inj});
      const mode = (plan(cl(cfg)) || {}).cardioMode || 'none'; if(!MODES.has(mode)) return;
      let a, b; try { a = build(IA, cfg); b = build(BASE, cfg); } catch(err) { crash++; return; }
      n++; reach[mode] = (reach[mode] || 0) + 1;
      if(progDigest(a) !== progDigest(b)){ mv++; if(!ex) ex = g + ' ' + JSON.stringify(e) + ' ' + mode + ' ' + inj.region + '/' + inj.tier + ' rest=' + rest; }
    })));
    pairRow('R3n NRC multi-sport under the excluded modes (run_5k + bike, run_half + swim): every build byte-identical to V212 (' + n + ' builds, ' + JSON.stringify(reach) + ')',
      crash === 0 && [...MODES].every(m => reach[m] > 0) && mv === 0, mv + ' moved, first ' + ex + ', crash ' + crash);
  }
}

// ── R8 / R8n / R8v: the exclusion key keeps the chooser off (RULING-LEVEL, from 213 up) ─────────
// D113a amended and D146 slice 2c: under noimpact, noimpact_swim, easy and reduce the multi-sport week
// is not routed through the spacing chooser; it keeps the layout V212 dealt it. R3 / R3n proved that
// as byte identity for the 213/212 pair only, so from 214 nothing guarded the two exclusion conjuncts
// (sabotage v213_d113a S5 and S6 survived the V214 proof). These rows are the ruling's own claim:
// every week's day-by-day SPORT LAYOUT (which days carry a run, bike or swim card, by type and goal)
// equals V212's for the same cfg. Card content is not compared, so a later ruling that rewrites
// injured cards does not trip them; one that re-sites injured multi-sport days must re-pin them.
// The candidate's own injuryPlan picks the population. Calendars with 0 to 2 rest days: the ones with
// enough runs to route (pace from three runs, NRC from two).
{
  const MODES = new Set(['noimpact','noimpact_swim','easy','reduce']);
  const INJ = [{region:'knee',tier:'protect'},{region:'hip',tier:'protect'},{region:'knee',tier:'workaround'},{region:'ankle',tier:'workaround'}];
  const C02 = CALS.filter(r => r.length <= 2);
  const lay = p => Object.keys(p.weeks).map(w => DAYS.map(d => cards(p.weeks[w][d]).map(c => c.type + ':' + (c.goalId || '')).sort().join('+') || '-').join(',')).join('|');
  const POP = { R8: [['run_pace_goal', {bike:'bike_base'}], ['run_pace_goal', {swim:'swim_base'}], ['run_pace_goal', {bike:'bike_ftp', swim:'swim_mile'}]],
                R8n: [['run_5k', {bike:'bike_base'}], ['run_half', {swim:'swim_base'}]] };
  if(!BASE){ ['R8','R8n','R8v'].forEach(r => ok(r + ' the exclusion-key layout rows need V212, the ruling\'s named oracle', false, baseWhy)); }
  else {
    const plan = IA.eval('injuryPlan'); const R = {};
    Object.keys(POP).forEach(row => {
      const A = {n:0, mv:0, ex:null, crash:0, reach:{}, twins:0, twinMoved:0};
      POP[row].forEach(([g, e], j) => C02.forEach((rest, i) => {
        const foc = FOCI[(i + j) % 3];
        const twin = mkCfg(g, e, rest, foc);
        try { A.twins++; if(lay(build(IA, twin)) !== lay(build(BASE, twin))) A.twinMoved++; } catch(err) { A.crash++; }
        INJ.forEach(inj => {
          const cfg = mkCfg(g, e, rest, foc, {injury:inj});
          const mode = (plan(cl(cfg)) || {}).cardioMode || 'none'; if(!MODES.has(mode)) return;
          let a, b; try { a = build(IA, cfg); b = build(BASE, cfg); } catch(err) { A.crash++; return; }
          A.n++; A.reach[mode] = (A.reach[mode] || 0) + 1;
          if(lay(a) !== lay(b)){ A.mv++; if(!A.ex) A.ex = g + ' ' + JSON.stringify(e) + ' ' + mode + ' ' + inj.region + '/' + inj.tier + ' rest=' + (rest.join('') || 'none'); }
        });
      }));
      R[row] = A;
    });
    ok('R8 pace multi-sport under the excluded modes keeps V212\'s day-by-day sport layout, every week (' + R.R8.n + ' builds)', R.R8.n > 0 && R.R8.crash === 0 && R.R8.mv === 0, R.R8.mv + ' re-sited, first ' + R.R8.ex + ', crash ' + R.R8.crash);
    ok('R8n NRC multi-sport under the excluded modes keeps V212\'s day-by-day sport layout, every week (' + R.R8n.n + ' builds)', R.R8n.n > 0 && R.R8n.crash === 0 && R.R8n.mv === 0, R.R8n.mv + ' re-sited, first ' + R.R8n.ex + ', crash ' + R.R8n.crash);
    ok('R8v reach: every excluded mode (pace ' + JSON.stringify(R.R8.reach) + ', NRC ' + JSON.stringify(R.R8n.reach) + '), and the uninjured twins are routed (pace ' + R.R8.twinMoved + '/' + R.R8.twins + ', NRC ' + R.R8n.twinMoved + '/' + R.R8n.twins + ' differ from V212), so R8 and R8n can fail',
      [...MODES].every(m => R.R8.reach[m] > 0 && R.R8n.reach[m] > 0) && R.R8.twinMoved > 0 && R.R8n.twinMoved > 0, JSON.stringify({pace:R.R8.twinMoved, nrc:R.R8n.twinMoved}));
  }
}

// ── R4 / R5: the 35 three-day solo pace calendars at tw 6 / 9 / 11 / 15 ──────────────────
{
  const TW = [6, 9, 11, 15]; const spacer = new Set(SPACER_TYPED);
  let r4n = 0, r4bad = 0, r4ex = null, r5n = 0, r5bad = 0, r5ex = null, crash = 0, pN = 0, pCells = 0, pDiff = 0, pex = null;
  THREE.forEach(c => { const cal = c.join('+'); const rest = DAYS.filter(d => !c.includes(d));
    TW.forEach(tw => FOCI.forEach(f => {
      const cfg = mkCfg('run_pace_goal', {}, rest, f, {_raceDateCappedWeeks:tw}); let p;
      try { p = build(IA, cfg); } catch(e) { crash++; return; }
      const T = p.totalWeeks, cr = handCross(tw); const per = weeksOf(p).map(w => runsOf(p.weeks[w]));
      const cnt = (R, t) => R.filter(r => r.t === t).length;
      if(spacer.has(cal)){
        r4n++;
        const iW = per.map((R, i) => cnt(R, 'int') ? i + 1 : 0).filter(Boolean), cW = per.map((R, i) => cnt(R, 'chi') ? i + 1 : 0).filter(Boolean);
        const wantI = Array.from({length:cr - 1}, (_, i) => i + 1), wantC = Array.from({length:tw - cr + 1}, (_, i) => cr + i);
        const good = T === tw && per.length === tw && per.every(R => R.length === 3 && cnt(R, 'int') + cnt(R, 'chi') === 1)
          && JSON.stringify(iW) === JSON.stringify(wantI) && JSON.stringify(cW) === JSON.stringify(wantC);
        if(!good){ r4bad++; if(!r4ex) r4ex = cal + ' tw=' + tw + ' ' + f + ' T=' + T + ' runs/wk ' + per.map(R => R.length).join('') + ' INT wks [' + iW + '] CHI wks [' + cW + '] want INT 1..' + (cr - 1) + ' CHI ' + cr + '..' + tw; }
        if(PAIR && BASE){ pN++; const b = build(BASE, cfg);
          weeksOf(b).forEach(w => DAYS.forEach(d => { pCells++; if(JSON.stringify(cards(b.weeks[w][d])) !== JSON.stringify(cards((p.weeks[w] || {})[d]))){ pDiff++; if(!pex) pex = cal + ' tw=' + tw + ' ' + f + ' W' + w + ' ' + d; } })); }
      } else {
        r5n++;
        const good = T === tw && per.length === tw && per.every(R => R.length === 3 && cnt(R, 'int') === 1 && cnt(R, 'chi') === 1 && cnt(R, 'long') === 1 && untol(R) === 0);
        if(!good){ r5bad++; if(!r5ex){ const w = per.findIndex(R => !(R.length === 3 && cnt(R, 'int') === 1 && cnt(R, 'chi') === 1 && cnt(R, 'long') === 1 && untol(R) === 0));
          r5ex = cal + ' tw=' + tw + ' ' + f + ' T=' + T + ' W' + (w + 1) + ' ' + (per[w] || []).map(r => r.day + ':' + r.t).join(' '); } }
      }
    })); });
  ok('R4/R5 three-day pace lattice builds without a crash (' + (35 * TW.length * 3) + ' configs)', crash === 0 && r4n + r5n === 35 * TW.length * 3, crash + ' crashes');
  ok('R4 the 7 spacer calendars: three runs and one quality a week, INT weeks 1..cross-1 then CHI weeks cross..tw, cross = max(3, ceil(tw × 0.55)) (' + r4n + ' builds)', r4n === 84 && r4bad === 0, r4bad + ', first ' + r4ex);
  if(!BASE) pairRow('R4p the 7 spacer calendars need the V212 baseline', false, baseWhy);
  else pairRow('R4p the 7 spacer calendars: cardio byte-identical to V212 on every day (' + pN + ' builds, ' + pCells + ' day-cells)', pN === 84 && pDiff === 0, pDiff + ', first ' + pex);
  ok('R5 the 28 spaceable calendars: three runs, one INT, one CHI and one long run every week, no untolerated pair (' + r5n + ' builds)', r5n === 336 && r5bad === 0, r5bad + ', first ' + r5ex);
}

// ── R0 / HM ──────────────────────────────────────────────────────────────────────────────
if(!BASE) pairRow('R0 identity fuzz needs the V212 baseline', false, baseWhy);
else { const cfg = mkCfg('run_pace_goal', {bike:'bike_base'}, ['sun','wed'], 'balanced');
  pairRow('R0 V212 built twice from the same cfg is identical', progDigest(build(BASE, cfg)) === progDigest(build(BASE, cfg))); }
{ const got = progDigest(build(IA, fixtures.HALF_MANNY));
  pairRow('HM HALF_MANNY shipped digest is ' + HM_DIGEST + ' (ruled unmoved)', got === HM_DIGEST, got); }
summary();
