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
// Lattice: run-only, run+bike, run+swim x tw 3, 6, 9 x Mon/Tue/Thu/Sat (Tue added at V208) x three rest patterns. The third
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
//
// V208 ROWS Q0-Q7 (builder, V208 slice 0: the D106a fix-forward, coach ruled). The V208
// re-measure found 392 of 1,092 Shakeout days carrying the week's LONG LSD (Taper tagged,
// legLoad true): B4 took INT and CHI off T-1 and T-2 but left the long card, and
// raceEveLiftPass titled it Shakeout by position. Ruling: (1) the long LSD at T-1 and T-2
// takes the week's easy LSD through the same B4 slot rule, captured before the pin moves
// anything; (2) the Shakeout title keys on the card: easy LSD only (legLoad false). NRC eves
// byte-identical. Oracles: the calendar (T-1, T-2 read across the week boundary from the test
// date), the pre-pin build of the same cfg (the deal before the pin post-pass, as P4-P6), the
// ruling text for the synthetic raceEveLiftPass rows, and the V207 artifact for the NRC eves.
// Q1 is scoped to RUN cards: P6 rules every bike and swim card before the test untouched, and
// a bike Long Ride (legLoad true) at T-1 or T-2 is a separate question the ruling does not reach.
// VERSION PREDICATE: keyed to this ruling, which ships on ia-version 208. Below 208 every Q row
// is skipped and printed as SKIP. Q6 is scoped to the build pair (candidate 208 vs baseline 207).
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
// D103a (V208) ERA ROWS (standing ruling 4): the quality-run labels P4, P5 and the Q rows read. Under
// the V208 rename the old regex saw no quality run at all, so P5 passed on nothing and P4 fired on
// every config. An artifact no row covers fails loudly; P5z proves the matcher sees quality runs.
const HARD_BY_VERSION = [
  { from: 207, to: 207,      ruling: 'D106a (V207)', re: /^(Interval \(INT\)|Continuous High Intensity \(CHI\))/ },
  { from: 208, to: Infinity, ruling: 'D103a (V208)', re: /^(Short Interval \(SI\)|Long Interval \(LI\))/ },
];
const HARD_ROW = HARD_BY_VERSION.filter(r => VER >= r.from && VER <= r.to)[0] || null;
if(!HARD_ROW) ok('P-ERA a HARD_BY_VERSION row covers ia-version ' + VER + ' (the quality-run labels have no ruled text here, so P4, P5 and the Q rows are void)', false, 'no row');
const HARD = HARD_ROW ? HARD_ROW.re : /(?!)/;
let hardSeen = 0, p5reach = 0;
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
// V208 (slice 4b): Tuesday joins the test weekdays. On Mon/Thu/Sat alone the quality run B4 must clear
// never survives to T-1 or T-2 once the trial takes its slot, so P5 had no case to fail on.
for(const mk of Object.keys(MIX)) for(const rest of [['sun','wed'], ['sat','sun'], ['sun','tue','thu','sat']]) for(const tw of [3, 6, 9]) for(const wd of [0, 1, 3, 5]){
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
  hardSeen += [tw - 1, tw].reduce((n, w) => n + (w >= 1 ? runsOf(pre, w).filter(c => HARD.test(c.subtype || '')).length : 0), 0);
  if(!preRuns.some(c => HARD.test(c.subtype || ''))){
    ok(`P4 ${tag}: no quality run was dealt, so the trial took the long card and none survives`,
       preRuns.some(c => LONG.test(c.subtype || '')) && !pinRuns.some(c => LONG.test(c.subtype || '')),
       'pre ' + preRuns.map(c => c.subtype).join('|') + ' / pinned ' + pinRuns.map(c => c.subtype).join('|'));
  }
  const flat = []; [tw - 1, tw].forEach(w => { if(p.weeks[w]) DAYS.forEach(d => flat.push({w, d})); });
  const ti = flat.findIndex(x => x.w === tw && x.d === td);
  p5reach += [1, 2].map(k => flat[ti - k]).filter(Boolean).filter(x => { const c = pre.weeks[x.w] && pre.weeks[x.w][x.d] && pre.weeks[x.w][x.d].cardio; return c && c.type === 'run' && HARD.test(c.subtype || ''); }).length;
  const eveHard = [1, 2].map(k => flat[ti - k]).filter(Boolean).filter(x => { const c = p.weeks[x.w][x.d] && p.weeks[x.w][x.d].cardio; return c && c.type === 'run' && HARD.test(c.subtype || ''); }).map(x => 'W' + x.w + ' ' + x.d);
  ok(`P5 ${tag}: no INT or CHI run at T-1 or T-2`, eveHard.length === 0, eveHard.join(','));
  const moved = [];
  flat.slice(0, ti).forEach(x => { const a = pre.weeks[x.w] && pre.weeks[x.w][x.d] && pre.weeks[x.w][x.d].cardio;
    if(a && a.type !== 'run'){ const b = p.weeks[x.w][x.d] && p.weeks[x.w][x.d].cardio; if(canon(a) !== canon(b)) moved.push('W' + x.w + ' ' + x.d + ' ' + a.type); } });
  const notRest = DAYS.slice(wd + 1).filter(d => !(p.weeks[tw][d] && p.weeks[tw][d].rest));
  ok(`P6 ${tag}: bike and swim cards before the test day untouched, every day after it rests`, moved.length === 0 && notRest.length === 0,
     'moved ' + (moved.join(',') || 'none') + '; not resting ' + (notRest.join(',') || 'none'));
}

ok(`P5z the quality-run matcher (${HARD_ROW ? HARD_ROW.ruling : 'NO ROW'}) sees ${hardSeen} INT/CHI runs in the pre-pin weeks tw-1 and tw, ${p5reach} of them at T-1 or T-2 before the pin, so P4 and P5 read real cards`, hardSeen > 0 && p5reach > 0, hardSeen + ' / ' + p5reach);

// ══ V208 slice 0: Q0-Q7 (see header) ═════════════════════════════════════════════════
const ERA208 = 208, QROWS = ['Q0','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8'];
if(VER < ERA208){ QROWS.forEach(r => console.log('SKIP ' + r + ' ia-version ' + VER + ' predates the D106a fix-forward (V' + ERA208 + ')')); done(); }
const { progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const EASY = c => !!c && c.type === 'run' && !c.legLoad && /^Long Slow Distance/.test(c.subtype || '');
const LONGC = c => !!c && c.type === 'run' && !!c.legLoad && /^Long Slow Distance/.test(c.subtype || '');
const runOf = day => day && !day.rest ? [].concat(day.cardio || []).find(c => c && c.type === 'run') || null : null;
const mile = {id:'run_mile_time', label:'Mile', mileBestMins:'8', mileBestSecs:'15', targetDist:'1', targetMins:'7', targetSecs:'30', paceUnit:'mi'};
const QGOALS = {run_pace_goal: run, run_mile_time: mile};
const QMIX = {run: {types:['run'], x:{}}, 'run+bike': {types:['run','bike'], x:{bike:{id:'bike_base', label:'Bike base'}}},
              'run+swim': {types:['run','swim'], x:{swim:{id:'swim_base', label:'Swim base'}}}};
const QREST = [['sun'], ['sun','wed'], ['sat','sun'], ['sun','tue','thu','sat'], []];
for(const gk of Object.keys(QGOALS)) for(const mk of Object.keys(QMIX)){
  const A = {progs:0, crash:[], reach:0, eveRuns:0, llEve:[], shk:0, shkBad:[], repl:0, rest:0, replBad:[], eveDays:0, liftEve:[]};
  for(const rest of QREST) for(const tw of [2, 3, 5]) for(const wd of [0, 1, 3, 5]){
    const rd = isoOff(7 * (tw - 1) + wd), td = DAYS[wd];
    const cfg = {name:'GK', primaryPath:'event', eventTargeted:true, raceDate:rd, _testWeek:tw, _raceDateCappedWeeks:tw,
      cardioTypes:QMIX[mk].types.slice(), cardioGoals:Object.assign({run:clone(QGOALS[gk])}, clone(QMIX[mk].x)), liftingFocus:'balanced',
      experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:rest.slice(),
      days:['sun','mon','tue','wed','thu','fri','sat'], bench:185, squat:255, deadlift:315, startDate:isoOff(0), seed:24865};
    const tag = `rest ${rest.join('') || 'none'} tw ${tw} ${td}`;
    let p, pre; try { p = clone(IA.buildProgram(clone(cfg))); const pc = clone(cfg); delete pc._testWeek; pre = clone(IA.buildProgram(pc)); }
    catch(e){ A.crash.push(tag + ': ' + e.message); continue; }
    A.progs++;
    const flat = []; [tw - 1, tw].forEach(w => { if(p.weeks[w]) DAYS.forEach(d => flat.push({w, d})); });
    const ti = flat.findIndex(x => x.w === tw && x.d === td);
    const preHardInTest = DAYS.some(d => { const c = runOf(pre.weeks[tw] && pre.weeks[tw][d]); return c && HARD.test(c.subtype || ''); });
    for(const k of [1, 2]){
      const x = flat[ti - k]; if(!x) continue;
      const lab = tag + ' T-' + k + ' W' + x.w + ' ' + x.d;
      const c = runOf(p.weeks[x.w][x.d]);
      // Q8: nothing is lifted at T-1 or T-2 (V189 D38). T-2 may keep a post-run mobility block.
      { const dd = p.weeks[x.w][x.d]; A.eveDays++; const ls = (dd && !dd.rest ? dd.sections || [] : []).filter(s => (s.items || []).length && !/post-run mobility/i.test(s.label || '')); if(ls.length) A.liftEve.push(lab + ' ' + ls.map(s => s.label).join('+')); }
      if(c){ A.eveRuns++; if(c.legLoad) A.llEve.push(lab + ' ' + c.subtype); }
      const a = runOf(pre.weeks[x.w] && pre.weeks[x.w][x.d]);
      if(!LONGC(a)) continue;
      A.reach++;
      // Q3 oracle: the pre-pin week's easy LSD as dealt, whole card (subtype, dose, detail, legLoad false).
      const ez = [...new Set(DAYS.map(d => runOf(pre.weeks[x.w][d])).filter(EASY).map(canon))];
      if(c){ A.repl++; if(!ez.includes(canon(c))) A.replBad.push(lab + ' got ' + c.subtype + ' ' + canon(c.dose) + ' want one of ' + ez.length + ' pre-pin easy LSD'); }
      else { A.rest++; if(ez.length && !(x.w === tw && !preHardInTest)) A.replBad.push(lab + ' rests, but the pre-pin week dealt an easy LSD and the long card was not the trial source'); }
    }
    for(const w of Object.keys(p.weeks)) for(const d of DAYS){ const day = p.weeks[w][d];
      if(day && day.title === 'Shakeout'){ A.shk++; const c = runOf(day); if(!c || c.legLoad) A.shkBad.push(tag + ' W' + w + ' ' + d + ' ' + (c ? c.subtype + ' legLoad ' + c.legLoad : 'no run card')); } }
  }
  const L = `${gk} ${mk} (${A.progs} dated programs, Mon/Tue/Thu/Sat tests x tw 2,3,5 x ${QREST.length} rest sets)`;
  ok(`Q0 ${L}: builds, and the lattice reaches the case (a pre-pin long LSD at T-1 or T-2)`, A.crash.length === 0 && A.reach > 0, 'crash ' + A.crash.slice(0, 2).join('; ') + ' reach ' + A.reach);
  ok(`Q1 ${L}: no run card at T-1 or T-2 has legLoad true (${A.eveRuns} eve run cards)`, A.llEve.length === 0, A.llEve.length + ': ' + A.llEve.slice(0, 3).join('; '));
  ok(`Q2 ${L}: every Shakeout day's run card is the easy LSD, legLoad false (${A.shk} Shakeout days)`, A.shk > 0 && A.shkBad.length === 0, A.shkBad.length + '/' + A.shk + ': ' + A.shkBad.slice(0, 3).join('; '));
  ok(`Q3 ${L}: a long LSD dealt at T-1 or T-2 became the week's pre-pin easy LSD card, dose and all (${A.repl} replaced, ${A.rest} rest, of ${A.reach})`,
     A.reach > 0 && A.replBad.length === 0, A.replBad.length + ': ' + A.replBad.slice(0, 3).join('; '));
  ok(`Q8 ${L}: T-1 and T-2 carry no lift section (${A.eveDays} eve days; coach: the 1-2 week lift re-deal is a ruled consequence, only this is asserted)`, A.eveDays > 0 && A.liftEve.length === 0, A.liftEve.length + ': ' + A.liftEve.slice(0, 3).join('; '));
}
// Q4: the stand-in (V208 re-measure): 1.5 mi in 11:00, mile 8:15, 5 days, rest Sun and Wed, start Mon
// 2026-09-28, test Mon 2026-10-26 (week 5 by the calendar: 28 days after the start). T-1 is W4 Sun
// (rest), T-2 is W4 Sat, which V207 printed as the 3.5 mi LSD Taper titled Shakeout.
{
  const cfg = {name:'M', primaryPath:'event', eventTargeted:true, raceDate:'2026-10-26', _testWeek:5, _raceDateCappedWeeks:5, cardioTypes:['run'],
    cardioGoals:{run:clone(run)}, liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs',
    restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:185, squat:255, deadlift:315, startDate:'2026-09-28', seed:24865};
  let p, pre; try { p = clone(IA.buildProgram(clone(cfg))); const pc = clone(cfg); delete pc._testWeek; pre = clone(IA.buildProgram(pc)); } catch(e){ p = null; ok('Q4 stand-in builds', false, e.message); }
  if(p){
    const sat = p.weeks[4] && p.weeks[4].sat, c = runOf(sat), preSat = runOf(pre.weeks[4] && pre.weeks[4].sat);
    const ez = DAYS.map(d => runOf(pre.weeks[4][d])).filter(EASY);
    ok('Q4 stand-in: premise holds (pre-pin W4 Sat is the long LSD, W4 Sun rests, the trial is W5 Mon)',
       LONGC(preSat) && !!(p.weeks[4].sun && p.weeks[4].sun.rest) && /TIME TRIAL/.test((runOf(p.weeks[5] && p.weeks[5].mon) || {}).subtype || ''),
       (preSat && preSat.subtype) + ' / sun ' + (p.weeks[4].sun && p.weeks[4].sun.title));
    ok('Q4 stand-in: W4 Sat is titled Shakeout and carries the week\'s one easy LSD, byte-equal to the pre-pin card (legLoad false, no Taper tag)',
       !!sat && sat.title === 'Shakeout' && ez.length === 1 && !!c && canon(c) === canon(ez[0]) && c.legLoad === false && !/Taper/.test(c.subtype || ''),
       sat ? sat.title + ' | ' + (c ? c.subtype + ' ' + canon(c.dose) + ' legLoad ' + c.legLoad : 'no run') + ' | want ' + (ez[0] ? ez[0].subtype + ' ' + canon(ez[0].dose) : 'none') : 'no day');
  }
}
// Q5: raceEveLiftPass on a hand-built two-week block, the ruling text as the oracle. Test Mon of
// week 2; T-1 (W1 Sun) is the last run before it. The title is a property of the card.
{
  const REP = IA.eval('raceEveLiftPass');
  const eve = (card) => { const w = {1:{}, 2:{}}; DAYS.forEach(d => { w[1][d] = {title:'Rest', rest:true, tags:['rest']}; w[2][d] = {title:'Rest', rest:true, tags:['rest']}; });
    w[2].mon = {title:'X', tags:['run'], sections:[], cardio:{type:'run', subtype:'1.5 Mile Test — TIME TRIAL', goalId:'run_pace_goal', legLoad:true}};
    w[1].sun = {title:'Pull', tags:['run','lift'], sections:[{label:'Main — Pull', items:[{name:'Row', detail:'3×8'}]}], cardio:card};
    REP(w, 2); return w; };
  const long = eve({type:'run', subtype:'Long Slow Distance (LSD) — Taper', goalId:'run_pace_goal', legLoad:true});
  const easy = eve({type:'run', subtype:'Long Slow Distance (LSD)', goalId:'run_pace_goal', legLoad:false});
  const nrc = eve({type:'run', subtype:'Recovery Run — 20 min', goalId:'run_half', legLoad:false});
  ok('Q5 raceEveLiftPass: a legLoad-true LSD on the eve is never titled Shakeout', long[1].sun.title !== 'Shakeout' && (long[1].sun.sections || []).length === 0, long[1].sun.title);
  ok('Q5 raceEveLiftPass control: the easy LSD (legLoad false) on the eve is titled Shakeout', easy[1].sun.title === 'Shakeout', easy[1].sun.title);
  ok('Q5 raceEveLiftPass control: an NRC recovery run on the eve is titled Shakeout', nrc[1].sun.title === 'Shakeout', nrc[1].sun.title);
}
// Q6: NRC eves (T-2 through race day, flattened across the week boundary) byte-identical to V207.
{
  const BASEFILE = process.argv[3] || null;
  if(!BASEFILE) console.log('SKIP Q6 no baseline passed as argv[3]; the NRC eve diff did not run');
  else {
    const IB = load(BASEFILE);
    if(!(VER === ERA208 && +IB.version === 207)) console.log('SKIP Q6 scoped to the V208 slice 0 build pair (candidate 208 vs baseline 207); this pair is ' + VER + ' vs ' + IB.version);
    else {
      const nrcBase = Object.assign({}, IA.fixtures.HALF_MANNY, {restDays:['sun'], seed:76308});
      const RACE = {run_5k:['2026-11-19','2026-11-22'], run_half:['2026-12-26','2026-12-28']};
      const window = q => { const tw = q.totalWeeks, fl = []; [tw - 1, tw].forEach(w => { if(q.weeks[w]) DAYS.forEach(d => fl.push(q.weeks[w][d] || null)); });
        const ri = fl.findIndex(x => x && x.cardio && /RACE DAY|TIME TRIAL/i.test(x.cardio.subtype || '')); return ri < 0 ? null : fl.slice(Math.max(0, ri - 2), ri + 1); };
      let n = 0, shk = 0; const moved = [];
      for(const g of Object.keys(RACE)) for(const rd of RACE[g]) for(const T of [['run'], ['run','bike']]) for(const R of [['sun'], ['sun','wed'], ['sat','sun']]){
        const cfg = Object.assign({}, nrcBase, {cardioTypes:T, restDays:R, eventTargeted:true, raceDate:rd,
          cardioGoals:Object.assign({run:{id:g, label:g}}, T.includes('bike') ? {bike:{id:'bike_base', label:'Bike'}} : {})});
        let a, b; try { a = window(IA.buildProgram(clone(cfg))); } catch(e){ a = 'CRASH ' + e.message; }
        try { b = window(IB.buildProgram(clone(cfg))); } catch(e){ b = 'CRASH ' + e.message; }
        n++; if(Array.isArray(a)) shk += a.filter(x => x && x.title === 'Shakeout').length;
        if(!Array.isArray(a) || canon(a) !== canon(b)) moved.push(g + ' ' + rd + ' ' + T.join('+') + ' [' + R + ']' + (Array.isArray(a) ? '' : ' ' + a));
      }
      ok('Q6 NRC eves: ' + n + ' dated run_5k and run_half builds, T-2 through race day byte-equal to V207 (' + shk + ' Shakeout eves seen)', moved.length === 0 && shk > 0, moved.length + ' moved: ' + moved.slice(0, 3).join('; '));
    }
  }
}
// Q7: HALF_MANNY is an NRC fixture; the fix-forward touches the NSW test pin and the LSD limb only.
{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }
  ok('Q7 HALF_MANNY digest is 0ac7da6b1691a8e1 (ruled unmoved: no NRC card moves)', hm === '0ac7da6b1691a8e1', hm); }
done();
