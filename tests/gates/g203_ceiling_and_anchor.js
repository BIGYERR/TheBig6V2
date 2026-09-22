// g203_ceiling_and_anchor.js — the gate for D117, D118 and D119 (V203 slice F).
//
// Three rulings, one file, because they share one fixture family and one predicate.
//
//   D117  the easy-day ceiling. Every Recovery Run and every non-race Long Run on an
//         NRC build prints a ceiling and carries dose.cap. Speed, race day and the
//         time trial carry NONE.
//   D118  a goal change carries the anchor. commitGoalChange preserves mileBestMins /
//         mileBestSecs / mileBestSrc across a run-goal switch, still drops baseline and
//         baselineDist as D5 wrote them, and leaves a non-run sport alone.
//   D119  the provenance form. runAnchorSentence renders the edited sentence with the
//         week number and the prior value, and the degenerate kind:'edited' with no
//         `from` never falls through to "no mile time was entered".
//
// ORACLES, all independent of the engine:
//   * the ceiling is computed HERE, longhand, from a hand table of PACE_CHART rows
//     typed out below. steadyCapSec() is NEVER called by this gate. The hand table is
//     first checked against PACE_CHART itself, so a chart edit trips a named row
//     rather than silently re-basing the oracle.
//   * the two ceiling sentences are typed from the D117 ruling, character for
//     character, and the pace string is formatted here rather than read back.
//   * the D118 expectation is the cfg transform transcribed from the ruling as a
//     literal object shape, not a call into the app compared with itself.
//   * every D119 sentence is typed out in full. The gate builds the `a` record by
//     hand and compares the rendered string to the typed one.
//
// VERSION PREDICATE (standing ruling 4 — a gate is keyed to the RULING it defends).
//   D117/D118/D119 ship on ia-version 203. At 203 and above the surface MUST exist:
//   its absence is a named FAIL, never a skip. Below 203, an artifact WITHOUT the
//   surface is not-applicable and the gate declines instead of failing, so the
//   required previous-version run stays readable. Below 203 WITH the surface present
//   is the pre-bump working artifact mid-slice: the rows run, because the surface is
//   there to be tested and declining would hide it.

const path = require('path');
const crypto = require('crypto');
const H = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');

let pass = 0, fail = 0, na = 0;
function ok(name, cond, detail){
  if(cond){ pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
function eq(name, got, want){
  ok(name, got === want, 'got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want));
}

const IA = H.load(FILE);
console.log('g203_ceiling_and_anchor  (D117 ceiling / D118 anchor carry / D119 provenance)  artifact ia-version ' + IA.version);

// ── 0. the version predicate ──────────────────────────────────────────────────
const RULING_V = 203;
const artifactV = +IA.version;
const SURFACE = {
  'steadyCapSec declared':          /function steadyCapSec\(row\)/.test(IA.html),
  'recovery ceiling sentence':      IA.html.indexOf('Do not run faster than ') >= 0,
  'long-run ceiling sentence':      IA.html.indexOf('Average no faster than ') >= 0,
  'commitGoalChange carries mile':  /mileBestMins:prev\.mileBestMins/.test(IA.html),
  'edited provenance branch':       IA.html.indexOf("a.kind === 'edited' && a.from") >= 0,
};
const missing = Object.keys(SURFACE).filter(k => !SURFACE[k]);
const surfacePresent = missing.length === 0;

let SKIP = false;
console.log('\n0. version predicate (rulings D117/D118/D119 ship on ia-version ' + RULING_V + ')');
if(artifactV >= RULING_V){
  Object.keys(SURFACE).forEach(k => ok('at ia-version ' + artifactV + ' the D117/D118/D119 surface MUST exist: ' + k, SURFACE[k]));
  if(!surfacePresent) SKIP = true;      // the FAILs above are the report; do not cascade
} else if(!surfacePresent){
  SKIP = true;
  ok('ia-version ' + artifactV + ' is below ' + RULING_V + ' and carries none of the surface, so this gate declines', true);
  console.log('  n/a  NOT APPLICABLE at ia-version ' + artifactV + ': missing ' + missing.join('; '));
} else {
  ok('ia-version ' + artifactV + ' is below ' + RULING_V + ' but the whole surface is present (pre-bump working artifact), so every row RUNS', true);
}

if(!SKIP){

// ── D117 ──────────────────────────────────────────────────────────────────────
// Hand table, typed from PACE_CHART's tempo and recovery columns. `cap` and `capStr`
// are computed longhand below from tempo and recovery, never read off the app.
const ROWS = [
  { mileSec: 480, mile: '8:00',  tempo: 565, recovery: 630 },   // exact chart row
  { mileSec: 630, mile: '10:30', tempo: 720, recovery: 800 },   // exact chart row (HALF_MANNY)
  { mileSec: 570, mile: '9:30',  tempo: 660, recovery: 730 },   // the intermediate default row
];
// D117's formula, written out here: the midpoint of Tempo and Recovery Pace.
function capOf(row){ return Math.round((row.tempo + row.recovery) / 2); }
function paceStr(sec){ return Math.floor(sec/60) + ':' + String(Math.round(sec%60)).padStart(2,'0') + '/mi'; }
ROWS.forEach(r => { r.cap = capOf(r); r.capStr = paceStr(r.cap); });

console.log('\n1. D117 oracle: the hand table agrees with PACE_CHART, and the ceiling is the midpoint');
const CHART = IA.eval('PACE_CHART');
ROWS.forEach(r => {
  const row = CHART.find(x => x.mile === r.mileSec);
  ok('PACE_CHART has an exact row at mile ' + r.mile, !!row);
  if(!row) return;
  eq('mile ' + r.mile + ' tempo column is ' + r.tempo, row.tempo, r.tempo);
  eq('mile ' + r.mile + ' recovery column is ' + r.recovery, row.recovery, r.recovery);
});
// the arithmetic, spelled out, so the numbers below are auditable by eye
eq('8:00 row: round((565 + 630) / 2) = 598 = 9:58/mi',  ROWS[0].cap + ' ' + ROWS[0].capStr, '598 9:58/mi');
eq('10:30 row: round((720 + 800) / 2) = 760 = 12:40/mi', ROWS[1].cap + ' ' + ROWS[1].capStr, '760 12:40/mi');
eq('9:30 row: round((660 + 730) / 2) = 695 = 11:35/mi',  ROWS[2].cap + ' ' + ROWS[2].capStr, '695 11:35/mi');
ok('the ceiling is a moving number, not a constant', new Set(ROWS.map(r => r.cap)).size === 3, JSON.stringify(ROWS.map(r => r.cap)));
ok('the ceiling sits between Tempo and Recovery on every row',
   ROWS.every(r => r.cap > r.tempo && r.cap < r.recovery), JSON.stringify(ROWS.map(r => [r.tempo, r.cap, r.recovery])));

// the two ruled sentences, typed from D117
const REC_TAIL  = cap => 'Do not run faster than ' + cap + '.';
const LONG_TAIL = cap => 'Average no faster than ' + cap + '.';

function cards(goal, mm, ss, raceDate){
  const cfg = JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY));
  cfg.cardioGoals.run = { id: goal, label: goal, mileBestMins: mm, mileBestSecs: ss };
  if(raceDate){ cfg.raceDate = raceDate; }
  else { delete cfg.raceDate; cfg.primaryPath = 'test'; cfg.eventTargeted = false; }
  const prog = IA.buildProgram(cfg);
  const out = [];
  Object.keys(prog.weeks).forEach(w => Object.keys(prog.weeks[w]).forEach(d => {
    const c = prog.weeks[w][d] && prog.weeks[w][d].cardio;
    if(!c) return;
    (Array.isArray(c) ? c : [c]).forEach(x => { if(x && x.type === 'run') out.push(x); });
  }));
  return out;
}

const SWEEP = [
  { label: 'run_half @ 8:00, race on the calendar',  goal: 'run_half', row: ROWS[0], race: '2026-12-06' },
  { label: 'run_half @ 10:30, race on the calendar', goal: 'run_half', row: ROWS[1], race: '2026-12-06' },
  { label: 'run_10k @ 8:00, race on the calendar',   goal: 'run_10k',  row: ROWS[0], race: '2026-12-06' },
  { label: 'run_10k @ 10:30, no race (time trial)',  goal: 'run_10k',  row: ROWS[1], race: null },
];

const seenSpeedTypes = new Set();
let sawRaceDay = 0, sawTimeTrial = 0, totalRec = 0, totalLong = 0, totalSpeed = 0;

SWEEP.forEach(S => {
  console.log('\n2. D117 ceiling on cards — ' + S.label + ' (expected ceiling ' + S.row.capStr + ')');
  const mm = S.row.mile.split(':')[0], ss = S.row.mile.split(':')[1];
  const all = cards(S.goal, mm, ss, S.race);
  const rec   = all.filter(c => c.subtype === 'Recovery Run');
  const longs = all.filter(c => /^Long Run/.test(c.subtype));
  const speed = all.filter(c => /^Speed Run/.test(c.subtype));
  const easyLong = longs.filter(c => !/RACE DAY|TIME TRIAL/.test(c.subtype));
  const hardLong = longs.filter(c => /RACE DAY|TIME TRIAL/.test(c.subtype));

  ok('build emits recovery runs (' + rec.length + ')',  rec.length   > 0);
  ok('build emits long runs (' + longs.length + ')',    easyLong.length > 0);
  ok('build emits speed runs (' + speed.length + ')',   speed.length > 0);
  totalRec += rec.length; totalLong += easyLong.length; totalSpeed += speed.length;
  speed.forEach(c => seenSpeedTypes.add(c.subtype.replace('Speed Run — ', '')));
  hardLong.forEach(c => { if(/RACE DAY/.test(c.subtype)) sawRaceDay++; else sawTimeTrial++; });

  ok('EVERY recovery run ends "' + REC_TAIL(S.row.capStr) + '"',
     rec.every(c => String(c.detail).trim().endsWith(REC_TAIL(S.row.capStr))),
     JSON.stringify((rec.find(c => !String(c.detail).trim().endsWith(REC_TAIL(S.row.capStr))) || {}).detail));
  ok('EVERY recovery run carries dose.cap = ' + S.row.cap,
     rec.every(c => c.dose && c.dose.cap === S.row.cap),
     JSON.stringify(rec.map(c => c.dose && c.dose.cap)));
  ok('EVERY non-race long run ends "' + LONG_TAIL(S.row.capStr) + '"',
     easyLong.every(c => String(c.detail).trim().endsWith(LONG_TAIL(S.row.capStr))),
     JSON.stringify((easyLong.find(c => !String(c.detail).trim().endsWith(LONG_TAIL(S.row.capStr))) || {}).detail));
  ok('EVERY non-race long run carries dose.cap = ' + S.row.cap,
     easyLong.every(c => c.dose && c.dose.cap === S.row.cap),
     JSON.stringify(easyLong.map(c => c.dose && c.dose.cap)));

  ok('NO speed run carries dose.cap',
     speed.every(c => !c.dose || c.dose.cap === undefined),
     JSON.stringify(speed.filter(c => c.dose && c.dose.cap !== undefined).map(c => c.subtype)));
  ok('NO speed run prints a ceiling sentence',
     speed.every(c => !/faster than \d+:\d\d\/mi\./.test(String(c.detail))),
     JSON.stringify((speed.find(c => /faster than \d+:\d\d\/mi\./.test(String(c.detail))) || {}).subtype));
  ok('NO race day or time trial carries dose.cap',
     hardLong.every(c => !c.dose || c.dose.cap === undefined),
     JSON.stringify(hardLong.map(c => [c.subtype, c.dose && c.dose.cap])));
  ok('NO race day or time trial prints a ceiling sentence',
     hardLong.every(c => !/faster than \d+:\d\d\/mi\./.test(String(c.detail)) && !/no faster than/.test(String(c.detail))),
     JSON.stringify(hardLong.map(c => c.subtype)));
  // the ceiling must be THIS row's, not some other row's
  ok('no card anywhere prints a ceiling that is not ' + S.row.capStr,
     all.every(c => { const m = String(c.detail).match(/faster than (\d+:\d\d\/mi)\./); return !m || m[1] === S.row.capStr; }),
     JSON.stringify(all.map(c => String(c.detail).match(/faster than (\d+:\d\d\/mi)\./)).filter(Boolean).map(m => m[1])));
});

console.log('\n2b. D117 non-vacuity: the sweep actually reached every card class');
ok('sweep covered Intervals', seenSpeedTypes.has('Intervals'), [...seenSpeedTypes].join(','));
ok('sweep covered Tempo',     seenSpeedTypes.has('Tempo'),     [...seenSpeedTypes].join(','));
ok('sweep covered Fartlek',   seenSpeedTypes.has('Fartlek'),   [...seenSpeedTypes].join(','));
ok('sweep covered Hills',     seenSpeedTypes.has('Hills'),     [...seenSpeedTypes].join(','));
ok('sweep covered at least one RACE DAY', sawRaceDay >= 1, String(sawRaceDay));
ok('sweep covered at least one TIME TRIAL', sawTimeTrial >= 1, String(sawTimeTrial));
ok('sweep capped 20+ recovery runs (' + totalRec + ')',  totalRec   >= 20, String(totalRec));
ok('sweep capped 10+ non-race long runs (' + totalLong + ')', totalLong >= 10, String(totalLong));
ok('sweep left 20+ speed runs uncapped (' + totalSpeed + ')', totalSpeed >= 20, String(totalSpeed));

console.log('\n2c. D117 copy rule on the two athlete-facing ceiling sentences');
const midDash = s => /[A-Za-z0-9,)]\s*[—-]\s*[A-Za-z0-9(]/.test(s);
ok('recovery ceiling sentence carries no mid-sentence hyphen or em-dash', !midDash(REC_TAIL('12:40/mi')));
ok('long-run ceiling sentence carries no mid-sentence hyphen or em-dash', !midDash(LONG_TAIL('12:40/mi')));
ok('recovery ceiling sentence ships in the artifact verbatim', IA.html.indexOf('Do not run faster than ') >= 0);
ok('long-run ceiling sentence ships in the artifact verbatim', IA.html.indexOf('Average no faster than ') >= 0);
ok('no user-facing Nike in either ceiling sentence', !/Nike/.test(REC_TAIL('x') + LONG_TAIL('x')));

// ── D117 / slice D: run_base ──────────────────────────────────────────────────
// Slice D re-pointed run_base's two steady ceilings at steadyCapSec(_row). Nothing
// pinned that until now: breaking either site moves run_base output while every NRC
// row above stays green.
//
// ORACLE, and it is the SAME hand table as section 1 — steadyCapSec is still never
// called here. run_base holds ONE chart row for the whole block (no race, no
// progression), so at a given mile anchor every easy card must print the midpoint of
// that row's Tempo and Recovery columns, longhand: round((tempo + recovery) / 2).
// Two anchors are swept so the expected number MOVES (598 vs 760); a constant would
// pass a gate that only looked at one.
//
// The second claim is the pairing. Each sentence prints the row's Recovery Pace as
// "Around X" and the ceiling as "do not run faster than Y", and BOTH come from _row.
// A ceiling computed off some OTHER row still looks like a pace, and the only thing
// that catches it is that it stops agreeing with the Recovery pace beside it.
function baseCards(row){
  const cfg = JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY));
  cfg.cardioGoals.run = { id:'run_base', label:'Build Running Base', baselineDist:'5', baseline:'5mi',
                          mileBestMins: row.mile.split(':')[0], mileBestSecs: row.mile.split(':')[1] };
  delete cfg.raceDate; cfg.primaryPath = 'test'; cfg.eventTargeted = false;
  const prog = IA.buildProgram(cfg);
  const out = [];
  Object.keys(prog.weeks).forEach(w => Object.keys(prog.weeks[w]).forEach(d => {
    const c = prog.weeks[w][d] && prog.weeks[w][d].cardio;
    if(!c) return;
    (Array.isArray(c) ? c : [c]).forEach(x => { if(x && x.type === 'run') out.push(x); });
  }));
  return out;
}
// The two sites are told apart by the sentence each one owns, never by subtype: the
// lsd_easy site also prints "Easy Run — Long" when the weekly budget override runs
// past 40 min, so subtype cannot separate them and a site-level claim needs to.
const IS_L_SITE = c => /This is the longest run of your week/.test(String(c.detail));            // _steadySecL
const IS_E_SITE = c => /Distance is not the goal; time on feet is\./.test(String(c.detail));     // _steadySec
const BASE_TAIL = cap => 'do not run faster than ' + cap + '.';
const AROUND    = c => (String(c.detail).match(/Around (\d+:\d\d\/mi) is right for you/) || [])[1];
const CAPSTR    = c => (String(c.detail).match(/do not run faster than (\d+:\d\d\/mi)\./) || [])[1];

const baseCaps = [];
[ROWS[0], ROWS[1]].forEach(r => {
  console.log('\n2d. slice D: run_base reads the ceiling through steadyCapSec — mile ' + r.mile
              + ' (expected ceiling ' + r.capStr + ', Around ' + paceStr(r.recovery) + ')');
  const all = baseCards(r);
  const L = all.filter(IS_L_SITE), E = all.filter(IS_E_SITE);
  baseCaps.push(r.mile + ':' + L.concat(E).map(CAPSTR).join('|'));

  ok('mile ' + r.mile + ' _steadySecL site emits cards (' + L.length + ')', L.length > 0);
  ok('mile ' + r.mile + ' _steadySec site emits cards (' + E.length + ')',  E.length > 0);
  ok('mile ' + r.mile + ' the two sites are disjoint (no card answers to both sentences)',
     all.filter(c => IS_L_SITE(c) && IS_E_SITE(c)).length === 0);

  // ── _steadySecL (the long easy run) ──
  ok('mile ' + r.mile + ' _steadySecL: EVERY long easy run prints "' + BASE_TAIL(r.capStr) + '"',
     L.every(c => String(c.detail).indexOf(BASE_TAIL(r.capStr)) >= 0),
     JSON.stringify(L.map(CAPSTR)));
  ok('mile ' + r.mile + ' _steadySecL: EVERY long easy run carries dose.cap = ' + r.cap,
     L.every(c => c.dose && c.dose.cap === r.cap), JSON.stringify(L.map(c => c.dose && c.dose.cap)));
  ok('mile ' + r.mile + ' _steadySecL: the Around pace is the SAME row\'s Recovery (' + paceStr(r.recovery) + ')',
     L.every(c => AROUND(c) === paceStr(r.recovery)), JSON.stringify(L.map(AROUND)));

  // ── _steadySec (the week's other easy runs) ──
  ok('mile ' + r.mile + ' _steadySec: EVERY easy run prints "' + BASE_TAIL(r.capStr) + '"',
     E.every(c => String(c.detail).indexOf(BASE_TAIL(r.capStr)) >= 0),
     JSON.stringify(E.map(CAPSTR)));
  ok('mile ' + r.mile + ' _steadySec: EVERY easy run carries dose.cap = ' + r.cap,
     E.every(c => c.dose && c.dose.cap === r.cap), JSON.stringify(E.map(c => c.dose && c.dose.cap)));
  ok('mile ' + r.mile + ' _steadySec: the Around pace is the SAME row\'s Recovery (' + paceStr(r.recovery) + ')',
     E.every(c => AROUND(c) === paceStr(r.recovery)), JSON.stringify(E.map(AROUND)));

  // the benchmark run is the run_base card that must carry NO ceiling at all (V158)
  const bench = all.filter(c => /^Benchmark Run/.test(c.subtype));
  ok('mile ' + r.mile + ' run_base emits benchmark runs (' + bench.length + ')', bench.length > 0);
  ok('mile ' + r.mile + ' NO benchmark run carries a ceiling or a dose.cap',
     bench.every(c => !CAPSTR(c) && (!c.dose || c.dose.cap === undefined)),
     JSON.stringify(bench.map(c => [c.subtype, c.dose && c.dose.cap])));
});

console.log('\n2e. run_base non-vacuity: the expected ceiling MOVED with the anchor');
ok('the two anchors do not produce the same run_base ceilings', baseCaps[0] !== baseCaps[1],
   JSON.stringify(baseCaps));
ok('8:00 run_base cards print 9:58/mi and 10:30 run_base cards print 12:40/mi',
   baseCaps[0].indexOf('9:58/mi') > 0 && baseCaps[0].indexOf('12:40/mi') < 0
   && baseCaps[1].indexOf('12:40/mi') > 0 && baseCaps[1].indexOf('9:58/mi') < 0,
   JSON.stringify(baseCaps));

// ── D118 ──────────────────────────────────────────────────────────────────────
console.log('\n3. D118: a goal change carries the anchor');

// Drive the real sheet through its own public entry points. _goalDraft is a top-level
// `let`, so it is not reachable from IA.eval; openGoalSheet / selectGoalOpt / _goalSetInput
// are function declarations and are.
IA.eval('renderGoalSheet = function(){}');
IA.eval('renderProgList = function(){}');
IA.eval('showToast = function(){}');

const SRC = { kind:'edited', wk:3, at:'2026-09-01', from:{ kind:'entered', mins:'11', secs:'00' } };
function seedProgram(runGoal){
  const cfg = JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY));
  cfg.cardioGoals.run = Object.assign({ id:'run_half', label:'Half Marathon', baselineDist:'5', baseline:'5mi',
                                        mileBestMins:'10', mileBestSecs:'30', mileBestSrc: JSON.parse(JSON.stringify(SRC)) }, runGoal || {});
  cfg.cardioTypes = ['run','bike'];
  cfg.cardioGoals.bike = { id:'bike_ftp', label:'Improve FTP / Power', baseline:'200w', baselineDist:'20' };
  const p = { id:'gR', name:'THE HALF MANNY', totalWeeks:14, startDate:'2026-09-07', cfg: cfg };
  IA.localStorage.setItem('ia_programs', JSON.stringify([p]));
  return p;
}
function switchGoal(sport, sel, inputs){
  IA.eval('openGoalSheet')('gR', sport);
  IA.eval('selectGoalOpt')(sel);
  Object.keys(inputs || {}).forEach(k => IA.eval('_goalSetInput')(k, inputs[k]));
  IA.eval('commitGoalChange')();
  return JSON.parse(IA.localStorage.getItem('ia_programs'))[0].cfg;
}

seedProgram();
let after = switchGoal('run', 'run_10k');
let r = after.cardioGoals.run;
eq('run goal switched to run_10k', r.id, 'run_10k');
eq('run goal label follows the picker', r.label, 'Run a 10K');
eq('mileBestMins PRESERVED across the switch', r.mileBestMins, '10');
eq('mileBestSecs PRESERVED across the switch', r.mileBestSecs, '30');
eq('mileBestSrc PRESERVED across the switch', JSON.stringify(r.mileBestSrc), JSON.stringify(SRC));
eq('baseline still DROPPED as D5 wrote it (empty string)', r.baseline, '');
eq('baselineDist still DROPPED as D5 wrote it (absent)', r.baselineDist, undefined);
eq('no target inputs written for a goal that needs none', r.targetMins, undefined);
ok('the switched goal is still chart-anchored', !!IA.eval('runAnchorInfo')(after), JSON.stringify(r));

console.log('\n3b. a run goal with NO prior mile entry gains no phantom anchor');
seedProgram({ mileBestMins:'', mileBestSecs:'', mileBestSrc:undefined });
r = switchGoal('run', 'run_10k').cardioGoals.run;
eq('no mileBestMins invented', r.mileBestMins, undefined);
eq('no mileBestSecs invented', r.mileBestSecs, undefined);
eq('no mileBestSrc invented',  r.mileBestSrc,  undefined);

console.log('\n3c. a non-run sport is unaffected');
seedProgram();
const beforeRun = JSON.stringify(JSON.parse(IA.localStorage.getItem('ia_programs'))[0].cfg.cardioGoals.run);
after = switchGoal('bike', 'bike_50');
eq('bike goal switched', after.cardioGoals.bike.id, 'bike_50');
eq('the run goal is byte-identical after a BIKE switch', JSON.stringify(after.cardioGoals.run), beforeRun);
eq('the bike goal gains no mileBestMins', after.cardioGoals.bike.mileBestMins, undefined);
eq('the bike goal gains no mileBestSrc',  after.cardioGoals.bike.mileBestSrc,  undefined);
eq('bike baseline dropped the same way',  after.cardioGoals.bike.baseline, '');

console.log('\n3d. the round trip returns the ORIGINAL program');
// The real claim: buildProgram is pure in cfg, so a preserved anchor means a recoverable
// program. The digest is taken over prog.weeks — the prescription the athlete sees — and
// NOT over prog.cfg, because D5 deliberately rewrites baseline/baselineDist on every
// switch and those fields ride along inside prog.cfg without reaching a single card.
const weeksDigest = prog => crypto.createHash('sha256').update(JSON.stringify(prog.weeks)).digest('hex').slice(0,16);
seedProgram();
const cfg0 = JSON.parse(IA.localStorage.getItem('ia_programs'))[0].cfg;
const D0 = weeksDigest(IA.buildProgram(cfg0));
// D118's brief names run_15_under10. That id is the PRE-ALIAS form of the 1.5-mile
// pace goal (_GOAL_ALIAS maps run_15_under10 -> run_pace_goal) and it is NOT in
// CARDIO_GOALS_BY_TYPE.run, so commitGoalChange cannot select it. Asserted, then the
// round trip uses the selectable modern equivalent: run_pace_goal, 1.5 mi in 10:00.
ok('run_15_under10 is not a selectable picker option (it is the pre-alias id)',
   !IA.eval('CARDIO_GOALS_BY_TYPE').run.some(o => o.id === 'run_15_under10'));
// _GOAL_ALIAS is a function-scoped const and is not reachable from the VM context, so
// the alias claim is asserted against the artifact TEXT rather than skipped.
ok('the artifact aliases run_15_under10 to run_pace_goal',
   /_GOAL_ALIAS\s*=\s*\{[^}]*run_15_under10:\s*'run_pace_goal'/.test(IA.html));
const cfg1 = switchGoal('run', 'run_pace_goal', { targetDist:'1.5', targetMins:'10', targetSecs:'0', paceUnit:'mi' });
const D1 = weeksDigest(IA.buildProgram(cfg1));
eq('the 1.5-mile pace goal committed', cfg1.cardioGoals.run.id, 'run_pace_goal');
eq('the pace goal kept the mile anchor', cfg1.cardioGoals.run.mileBestMins + ':' + cfg1.cardioGoals.run.mileBestSecs, '10:30');
ok('the pace goal builds a DIFFERENT program (the round trip is not trivial)', D1 !== D0, D1 + ' vs ' + D0);
const cfg2 = switchGoal('run', 'run_half');
const D2 = weeksDigest(IA.buildProgram(cfg2));
eq('back on run_half the anchor survived both hops', cfg2.cardioGoals.run.mileBestMins + ':' + cfg2.cardioGoals.run.mileBestSecs, '10:30');
eq('back on run_half mileBestSrc survived both hops', JSON.stringify(cfg2.cardioGoals.run.mileBestSrc), JSON.stringify(SRC));
eq('ROUND TRIP: half -> 1.5mi pace goal -> half rebuilds the ORIGINAL program', D2, D0);
eq('the round trip did not resurrect baselineDist', cfg2.cardioGoals.run.baselineDist, undefined);

console.log('\n3e. cfg purity across the whole D118 path');
const pureCfg = JSON.parse(JSON.stringify(cfg0));
const pureBefore = JSON.stringify(pureCfg);
IA.buildProgram(pureCfg);
eq('buildProgram left cfg byte-identical (no _racePin, no scratch)', JSON.stringify(pureCfg), pureBefore);

// ── D119 ──────────────────────────────────────────────────────────────────────
console.log('\n4. D119: the provenance sentence, every kind typed out in full');
const sentence = IA.eval('runAnchorSentence');
const TAIL = ' Every pace in this program comes from this row.';
function A(o){ return Object.assign({ anchorSec:630, rawSec:630, clamped:null, row:{}, kind:'entered',
                                      prog:'', n:0, wk:0, from:null, race:'half', goalId:'run_half' }, o); }

eq('edited + from.kind entered names the week and the prior TIME',
   sentence(A({ kind:'edited', wk:4, from:{ kind:'entered', mins:'11', secs:'00' } })),
   'Anchored on a <b>10:30 mile</b>, the time you entered in week 4. Before that it was 11:00.' + TAIL);
eq('edited + from.kind default names the week and says it was estimated',
   sentence(A({ kind:'edited', wk:6, from:{ kind:'default', mins:'', secs:'' } })),
   'Anchored on a <b>10:30 mile</b>, the time you entered in week 6. Before that it was estimated from experience.' + TAIL);
eq('edited + from with a seconds value that needs padding',
   sentence(A({ kind:'edited', wk:11, from:{ kind:'entered', mins:'9', secs:'5' } })),
   'Anchored on a <b>10:30 mile</b>, the time you entered in week 11. Before that it was 9:05.' + TAIL);

console.log('\n4b. the degenerate case slice B guarded: kind edited with NO from');
// A throw is a FAILURE of these rows, not a reason for the gate to die (a crashed gate
// reports nothing, and nothing is never a pass). The marker can satisfy no row below.
function say(a){ try { return sentence(a); } catch(e){ return 'THREW ' + (e && e.message); } }
const degen = say(A({ kind:'edited', wk:4, from:null }));
eq('edited with no from falls to the plain entered sentence',
   degen, 'Anchored on a <b>10:30 mile</b>, the time you entered.' + TAIL);
ok('edited with no from does NOT print "no mile time was entered"', degen.indexOf('no mile time was entered') < 0, degen);
ok('edited with no from RENDERS (the sentence did not throw)', degen.indexOf('THREW') !== 0, degen);
ok('edited with no from does NOT print "Before that it was"', degen.indexOf('Before that it was') < 0, degen);
ok('edited with no from does NOT print a bare "week undefined"', !/week (undefined|NaN|0)\b/.test(degen), degen);
const degen2 = say(A({ kind:'edited', wk:0, from:undefined }));
eq('edited with from undefined behaves the same', degen2, degen);

console.log('\n4c. the other four kinds are unchanged');
eq('entered', sentence(A({ kind:'entered' })),
   'Anchored on a <b>10:30 mile</b>, the time you entered.' + TAIL);
eq('seeded, plural', sentence(A({ kind:'seeded', n:4, prog:'THE BASE' })),
   'Anchored on a <b>10:30 mile</b>, worked back from 4 recovery runs you logged in THE BASE.' + TAIL);
eq('seeded, singular', sentence(A({ kind:'seeded', n:1, prog:'THE BASE' })),
   'Anchored on a <b>10:30 mile</b>, worked back from 1 recovery run you logged in THE BASE.' + TAIL);
eq('seeded with no program name', sentence(A({ kind:'seeded', n:0, prog:'' })),
   'Anchored on a <b>10:30 mile</b>, worked back from the recovery runs you logged in your last program.' + TAIL);
eq('beginner (no tail, and the article is "an" at 11:30)',
   sentence(A({ kind:'beginner', anchorSec:690, rawSec:690 })),
   'Anchored on an <b>11:30 mile</b>, the beginner default. A mile time starts being used at intermediate.');
eq('default / estimated from experience', sentence(A({ kind:'default', anchorSec:570, rawSec:570 })),
   'Anchored on a <b>9:30 mile</b>, estimated from experience; no mile time was entered.' + TAIL);
eq('clamped beats every kind, including edited',
   sentence(A({ kind:'edited', wk:4, clamped:'fast', anchorSec:300, rawSec:240, from:{ kind:'entered', mins:'4', secs:'0' } })),
   'Anchored on a <b>5:00 mile</b>, the 4:00 you entered is faster than the chart goes, so its fastest row is used.' + TAIL);

console.log('\n4d. D119 copy rule');
const d119 = [sentence(A({ kind:'edited', wk:4, from:{ kind:'entered', mins:'11', secs:'00' } })),
              sentence(A({ kind:'edited', wk:6, from:{ kind:'default' } })), degen]
             .map(s => s.replace(/<[^>]+>/g, ''));
ok('no D119 sentence carries a mid-sentence hyphen or em-dash', d119.every(s => !midDash(s)), JSON.stringify(d119));
ok('no user-facing Nike in any D119 sentence', d119.every(s => !/Nike/.test(s)));

// ── the fixture must not have moved under any of this ─────────────────────────
console.log('\n5. HALF_MANNY is untouched by D117/D118/D119 cfg work');
// SCOPE (standing ruling 4): the MANNY_DIGEST_BY_VERSION era-row conjunct is NOT asserted
// here. Row existence is a real requirement (standing ruling 5) but it is the DIGEST gate's
// claim, and g203_mile_pencil already carries it. Duplicating it would turn two gates red
// for one bookkeeping omission and neither failure would name a D117/D118/D119 defect.
// D117 adds a sentence and a dose field to NRC cards, so HALF_MANNY's digest moves with it;
// the pin for that move belongs to the slice that bumps ia-version. What this gate needs
// from the fixture is only self-stability, which is what the round trip oracle rests on.
const s1 = H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY));
const s2 = H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY));
eq('HALF_MANNY is self-stable (the round trip oracle is meaningful)', s1, s2);

}  // end !SKIP

if(SKIP) console.log('\nNOT APPLICABLE: ia-version ' + artifactV + ' is below ' + RULING_V + ' and does not carry the D117/D118/D119 surface. All D117/D118/D119 rows skipped.');
console.log('\nPASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
