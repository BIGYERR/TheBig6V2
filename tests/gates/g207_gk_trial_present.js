// g207_gk_trial_present.js — gatekeeper gate (V207 proof), for behaviour D106a claims but no
// gate asserted: a dated test goal that ENDS ON ITS TEST WEEK carries its test.
//
// D106a: "a dated test goal (run_pace_goal family) ends on the test week", with the trial in
// that week's quality slot. doGenerate writes _testWeek / _raceDateCappedWeeks whenever
// cardioTypes includes 'run' and the run goal is in PACE_GOALS, so a multi-sport program
// (run + bike, run + swim) is pinned and truncated exactly like a run-only one.
//
// ORACLES (independent of the engine):
//   * the test weekday is a calendar fact computed here from the test date (local date);
//   * the program length the athlete gets is the pin itself (tw);
//   * P1: exactly one card anywhere whose subtype carries TIME TRIAL, on week tw, test weekday;
//   * P2: the test day is titled Test Day and carries no lift section (race week doctrine:
//         nothing on race day, V189 D37/D38).
// Lattice: run-only, run+bike, run+swim x tw 3, 6, 9 x Mon/Thu/Sat x three rest patterns. The third
// (three train days) was added by builder at slice E: it is the one that deals a multi-sport week a
// SINGLE run (the long card alone), the case where dropping the long-LSD limb prints no trial at all.
//
// OWNERSHIP: written by gatekeeper at the V207 proof (P1, P2 red on 72 of 108 rows: every
// multi-sport pace week dealt no quality run, so the pin fired with no trial). Owned by
// builder from slice E, which is the fix (coach option 2: the trial takes the week's hardest
// run by one hierarchy, CHI, else INT, else the LONG LSD, else the only LSD). Rows P3-P6 are
// coach's oracle for slice E, each read against the SAME cfg built without the test pin (the
// pre-pin week, which the pin post-pass is the only thing to change):
//   * P3: the test day carries zero sections (race-day doctrine, V189 D38).
//   * P4: when the pre-pin week dealt no INT or CHI run, the trial was drawn from the long
//         card, so no long card (the Taper-tagged LSD) survives in the week. The easy LSD may.
//   * P5: no INT or CHI run the day before the test or two days out, read across the week
//         boundary (D38's window).
//   * P6: every bike and swim card in weeks tw-1 and tw before the test day is byte-identical
//         to the pre-pin week, and every day after the test day rests.
//
// VERSION PREDICATE (standing ruling 4): D106a ships on ia-version 207. Below 207 every row
// is NOT APPLICABLE and skipped, never a bare PASS.
'use strict';
const path = require('path');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const VER = +IA.version, ERA = 207;
let pass = 0, fail = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D106a (V' + ERA + ').'); console.log('SKIP P1 P2 P3 P4 P5 P6 skipped below the D106a era'); done(); }
function canon(v){
  if(v === null || typeof v !== 'object') return JSON.stringify(v) || 'null';
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const HARD = /^(Interval \(INT\)|Continuous High Intensity \(CHI\))/;
const LONG = /^Long Slow Distance \(LSD\) — Taper/;
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const clone = v => JSON.parse(JSON.stringify(v));
const run = {id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'},
  targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'};
const MIX = { run: {types:['run'], goals:{run}},
              'run+bike': {types:['run','bike'], goals:{run, bike:{id:'bike_base', label:'Bike base'}}},
              'run+swim': {types:['run','swim'], goals:{run, swim:{id:'swim_base', label:'Swim base'}}} };
const START = new Date(2026, 9, 5);   // Mon 2026-10-05
const isoOff = n => { const d = new Date(START); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
for(const mk of Object.keys(MIX)) for(const rest of [['sun','wed'], ['sat','sun'], ['sun','tue','thu','sat']]) for(const tw of [3, 6, 9]) for(const wd of [0, 3, 5]){
  const rd = isoOff(7 * (tw - 1) + wd), td = DAYS[wd];
  const cfg = {name:'GK', primaryPath:'event', eventTargeted:true, raceDate:rd, _testWeek:tw, _raceDateCappedWeeks:tw,
    cardioTypes:MIX[mk].types.slice(), cardioGoals:clone(MIX[mk].goals), liftingFocus:'balanced', experience:'intermediate',
    ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:rest, days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:185, squat:255, deadlift:315, startDate:isoOff(0), seed:24865};
  let p; try { p = clone(IA.buildProgram(clone(cfg))); } catch(e){ ok(`P0 ${mk} rest ${rest.join('')} tw ${tw} ${td}: builds`, false, e.message); continue; }
  const trials = [];
  for(const w of Object.keys(p.weeks)) for(const d of DAYS){ const x = p.weeks[w][d]; if(x) [].concat(x.cardio || []).forEach(c => { if(c && /TIME TRIAL/.test(String(c.subtype || ''))) trials.push('W' + w + ' ' + d); }); }
  const tag = `${mk} rest ${rest.join('')} tw ${tw} test ${rd} (${td}), ${p.totalWeeks} weeks`;
  ok(`P1 ${tag}: exactly one TIME TRIAL, on W${tw} ${td}`, trials.length === 1 && trials[0] === 'W' + tw + ' ' + td, trials.join(',') || 'none');
  const day = p.weeks[tw] && p.weeks[tw][td];
  const lifts = day ? (day.sections || []).filter(s => (s.items || []).length).map(s => s.label) : [];
  ok(`P2 ${tag}: test day titled Test Day with no lift section`, !!day && day.title === 'Test Day' && lifts.length === 0, day ? day.title + ' / ' + lifts.join('+') : 'no day');
  // ── slice E rows, against the pre-pin week ──
  ok(`P3 ${tag}: test day carries zero sections`, !!day && (day.sections || []).length === 0, day ? (day.sections || []).length : 'no day');
  const preCfg = clone(cfg); delete preCfg._testWeek;
  let pre = null; try { pre = clone(IA.buildProgram(preCfg)); } catch(e){ ok(`P4 ${tag}: pre-pin build`, false, e.message); continue; }
  const runsOf = (q, w) => DAYS.map(d => q.weeks[w] && q.weeks[w][d] && q.weeks[w][d].cardio).filter(c => c && c.type === 'run');
  const preRuns = runsOf(pre, tw), pinRuns = runsOf(p, tw);
  if(!preRuns.some(c => HARD.test(c.subtype || ''))){
    ok(`P4 ${tag}: no quality run was dealt, so the trial took the long card and none survives`,
       preRuns.some(c => LONG.test(c.subtype || '')) && !pinRuns.some(c => LONG.test(c.subtype || '')),
       'pre ' + preRuns.map(c => c.subtype).join('|') + ' / pinned ' + pinRuns.map(c => c.subtype).join('|'));
  }
  const flat = []; [tw - 1, tw].forEach(w => { if(p.weeks[w]) DAYS.forEach(d => flat.push({w, d})); });
  const ti = flat.findIndex(x => x.w === tw && x.d === td);
  const eveHard = [1, 2].map(k => flat[ti - k]).filter(Boolean).filter(x => { const c = p.weeks[x.w][x.d] && p.weeks[x.w][x.d].cardio; return c && c.type === 'run' && HARD.test(c.subtype || ''); }).map(x => 'W' + x.w + ' ' + x.d);
  ok(`P5 ${tag}: no INT or CHI run at T-1 or T-2`, eveHard.length === 0, eveHard.join(','));
  const moved = [];
  flat.slice(0, ti).forEach(x => { const a = pre.weeks[x.w] && pre.weeks[x.w][x.d] && pre.weeks[x.w][x.d].cardio;
    if(a && a.type !== 'run'){ const b = p.weeks[x.w][x.d] && p.weeks[x.w][x.d].cardio; if(canon(a) !== canon(b)) moved.push('W' + x.w + ' ' + x.d + ' ' + a.type); } });
  const notRest = DAYS.slice(wd + 1).filter(d => !(p.weeks[tw][d] && p.weeks[tw][d].rest));
  ok(`P6 ${tag}: bike and swim cards before the test day untouched, every day after it rests`, moved.length === 0 && notRest.length === 0,
     'moved ' + (moved.join(',') || 'none') + '; not resting ' + (notRest.join(',') || 'none'));
}
done();
