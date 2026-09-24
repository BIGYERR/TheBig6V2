// g214_d158_eve.js — GATE for D158 (coach, V213 session; built V214 slice 1): THE TEST EVE
// CARRIES A SHAKEOUT.
//
//   node tests/gates/g214_d158_eve.js [candidate] [baseline V213]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   D158  A training-day eve (T-1, read across the week boundary) before an NSW test carries a
//         shakeout built by the easy-run builder at that week's easy duration, and it REPLACES
//         whatever sat there, a bike or a swim included. A rest-day eve stays rest. INT at T-3 or
//         earlier is legal primer. B4's T-2 step is unchanged. The eve that holds the shakeout is
//         cleared from the pin's rest list (else the lift layer rests it, as D37 found on NRC).
//
// ORACLES, independent of the eve code path. dose.key is asserted as a conjunct of the card, as
// the ruling names it, but no row derives its expectation from the engine's eve builder:
//   eve        date arithmetic here: the calendar day before the test date, its program week
//              counted from the start date in whole days (Math.round, so a DST hour cannot shift
//              it) and its weekday from getDay(). A Monday test's eve is the Sunday of week tw-1.
//   training   the eve weekday is not in cfg.restDays.
//   shakeout   the card text: one card on the day, a run, subtype exactly "Long Slow Distance (LSD)"
//              (NSW's easy run, no Taper tag: the V208 ruling text), legLoad false, a distance dose
//              with key easy, the day titled Shakeout, no lift section on it.
//   dose       the week's easy duration read off a DIFFERENT route: the easy LSD cards the
//              scheduler dealt on the OTHER days of the same program week of the same cfg built
//              without the test pin (the pre-pin build, as g207 P4-P6 and Q3 read it). Every easy
//              LSD the scheduler deals in one week carries one distance; the shakeout must equal it.
//   hard       SI / LI by the D103a subtype text, an LSD with legLoad true, TIME TRIAL.
//   V213       the shipped artifact (argv[3] when it reads 213, else git bc3cccc) for the pair rows.
//
// ROWS
//   D0   every cfg builds; the lattice reaches training-day eves, rest-day eves, a training-day eve
//        in week tw-1, and pre-pin eve content of each kind the ruling replaces (bike, swim, run,
//        lift-only).
//   D1   every training-day eve carries the shakeout and nothing else (see oracle).
//   D2   the shakeout's distance equals the week's easy LSD distance from the pre-pin build. D2v:
//        the oracle is reached (a pre-pin easy LSD exists on another day of that week).
//   D3   every rest-day eve rests: rest flag, title Rest, no card.
//   D4   T-1 and T-2 carry no hard run and T-1 no lift section; exactly one TIME TRIAL, on the test day.
//   D5   PAIR. Dated NSW programs: every day of every week other than the eve byte-identical to V213,
//        except that the T-2 day's title may read Easy Run where V213 titled it Shakeout, and only
//        when the eve now holds the shakeout (raceEveLiftPass titles only the LAST run before the test).
//   D6   PAIR. NRC race-pinned programs and undated NSW programs byte-identical to V213.
//   D7   PAIR (V214 fix, coach). Across an injured dated lattice (7 injury modes), the lift role of T-2,
//        T-1 and the test day equals V213's. Lift-role re-deal is accepted at T-3 and earlier only.
//   D8   RULING-LEVEL, from 214 up (V214 fix, coach): D158 skips the protect-park modes (the D113a
//        exclusion key: noimpact, noimpact_swim, easy, reduce). Under them a training-day eve is handled
//        as V213 handles it: same card types and subtypes, same lift presence, same rest flag. V213 (git
//        bc3cccc) is the oracle the ruling names. Pre-existing lifts at T-1 / T-2 under a parked test are
//        ruled not a defect and are not asserted anywhere in this file.
//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (ruled unmoved: an NRC fixture, no test pin).
//
// VERSION PREDICATE (standing ruling 4). D158 ships on ia-version 214.
//   below 214: NOT APPLICABLE, every row skipped by name, clean exit.
//   D5 and D6 say "this build moved only the eve", so they run only on the build pair candidate 214
//   against baseline 213, and SKIP by name on every other pair. HM is typed and runs from 214 up.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version, ERA = 214, V213_COMMIT = 'bc3cccce3f048a9e0e4e45846bfe8315635c8430';
const ROWS = ['D0','D1','D2','D2v','D3','D4','D5','D6','D7','D8','HM'];
let pass = 0, fail = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D158 (V' + ERA + ').'); ROWS.forEach(r => console.log('SKIP ' + r + ' below the D158 era')); done(); }

const clone = v => JSON.parse(JSON.stringify(v));
function canon(v){
  if(v === null || typeof v !== 'object') return JSON.stringify(v) || 'null';
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const ISO = ['mon','tue','wed','thu','fri','sat','sun'], JSDAY = ['sun','mon','tue','wed','thu','fri','sat'];
const cards = x => (!x || !x.cardio) ? [] : [].concat(x.cardio).filter(Boolean);
const EASY = c => !!c && c.type === 'run' && !c.legLoad && c.subtype === 'Long Slow Distance (LSD)';
const HARD = c => !!c && c.type === 'run' && (/^(Short Interval \(SI\)|Long Interval \(LI\))/.test(c.subtype || '') || /TIME TRIAL/.test(c.subtype || '') || (!!c.legLoad && /^Long Slow Distance/.test(c.subtype || '')));
const lifted = x => (x && !x.rest ? x.sections || [] : []).filter(s => (s.items || []).length).map(s => s.label || '?');

// ── baseline V213, for the pair rows only ──
let BASE = null, baseWhy = '';
{   // V214 fix: read for every candidate from 214 up, because D8 (ruling-level) needs it; D5-D7 stay pair-scoped
  if(BASEFILE && fs.existsSync(BASEFILE)){ const b = load(BASEFILE); if(+b.version === 213){ BASE = b; baseWhy = 'argv ' + BASEFILE; } else baseWhy = 'argv baseline reads ' + b.version + ', not 213; '; }
  if(!BASE){
    try {
      const f = path.join(os.tmpdir(), 'g214_v213_' + process.pid + '.html'); try { fs.unlinkSync(f); } catch(e) {}
      fs.writeFileSync(f, cp.execFileSync('git', ['-C', path.join(__dirname, '..', '..'), 'show', V213_COMMIT + ':index.html'], {maxBuffer: 1 << 27}));
      const b = load(f); if(+b.version === 213){ BASE = b; baseWhy += 'git ' + V213_COMMIT.slice(0, 7); } else baseWhy += 'git copy reads ' + b.version;
      try { fs.unlinkSync(f); } catch(e) {}
    } catch(e) { baseWhy += 'git show failed: ' + String(e.message).slice(0, 80); }
  }
}
console.log('candidate ia-version ' + VER + '; baseline: ' + (BASE ? 'V213 from ' + baseWhy : (VER === ERA ? 'UNAVAILABLE (' + baseWhy + ')' : 'not read (pair rows are scoped to candidate 214)')));

// ── the dated NSW lattice ──
const START = new Date(2026, 9, 5);   // Mon 2026-10-05, local
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const weekOf = d => Math.floor(Math.round((d - START) / 864e5) / 7) + 1;
const GOALS = {
  pace: {id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'},
  mile: {id:'run_mile_time', label:'Mile', mileBestMins:'8', mileBestSecs:'15', targetDist:'1', targetMins:'7', targetSecs:'30', paceUnit:'mi', baselineDist:'3'},
};
const MIX = { run:{types:['run'], x:{}}, 'run+bike':{types:['run','bike'], x:{bike:{id:'bike_base', label:'Bike base'}}},
              'run+swim':{types:['run','swim'], x:{swim:{id:'swim_base', label:'Swim base'}}},
              'run+bike+swim':{types:['run','bike','swim'], x:{bike:{id:'bike_ftp', label:'FTP'}, swim:{id:'swim_base', label:'Swim base'}}} };
const RESTS = [[], ['sun'], ['sun','wed'], ['sat','sun'], ['mon','thu'], ['sun','tue','thu','sat'], ['fri']];
const mkCfg = (gk, mk, rest, tw, wd) => ({name:'GK', primaryPath:'event', eventTargeted:true, raceDate:ymd(addDays(START, 7 * (tw - 1) + wd)), _testWeek:tw, _raceDateCappedWeeks:tw,
  cardioTypes:MIX[mk].types.slice(), cardioGoals:Object.assign({run:clone(GOALS[gk])}, clone(MIX[mk].x)), liftingFocus:'balanced', experience:'intermediate',
  ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:rest.slice(), days:JSDAY.slice(), bench:185, squat:255, deadlift:315, startDate:ymd(START), seed:24865});

const A = {n:0, crash:[], te:0, re:0, tePrev:0, pre:{bike:0, swim:0, run:0, lift:0}, d1:[], d2:[], d2reach:0, d3:[], d4:[], d5n:0, d5:[], d5t2:0};
for(const gk of Object.keys(GOALS)) for(const mk of Object.keys(MIX)) for(const rest of RESTS) for(const tw of [2, 5]) for(let wd = 0; wd < 7; wd++){
  const cfg = mkCfg(gk, mk, rest, tw, wd);
  const test = addDays(START, 7 * (tw - 1) + wd), eve = addDays(test, -1), t2 = addDays(test, -2);
  const T0 = {w:weekOf(test), d:JSDAY[test.getDay()]}, T1 = {w:weekOf(eve), d:JSDAY[eve.getDay()]}, T2 = {w:weekOf(t2), d:JSDAY[t2.getDay()]};
  const tag = `${gk} ${mk} rest ${rest.join('') || 'none'} tw ${tw} test ${cfg.raceDate} (W${T0.w} ${T0.d}) eve W${T1.w} ${T1.d}`;
  let p, pre; try { p = clone(IA.buildProgram(clone(cfg))); const pc = clone(cfg); delete pc._testWeek; pre = clone(IA.buildProgram(pc)); } catch(e){ A.crash.push(tag + ': ' + e.message); continue; }
  A.n++;
  const at = (q, x) => q.weeks[x.w] ? q.weeks[x.w][x.d] : undefined;
  const train = !cfg.restDays.includes(T1.d), day = at(p, T1);
  if(train){
    A.te++; if(T1.w === tw - 1) A.tePrev++;
    const pc = cards(at(pre, T1)); if(pc.some(c => c.type === 'bike')) A.pre.bike++; if(pc.some(c => c.type === 'swim')) A.pre.swim++; if(pc.some(c => c.type === 'run')) A.pre.run++; if(!pc.length) A.pre.lift++;
    // D1: the card text says the week's easy run, nothing else on the day.
    const cs = cards(day), c = cs[0];
    const good = !!day && !day.rest && day.title === 'Shakeout' && cs.length === 1 && EASY(c) && c.legLoad === false
      && !!c.dose && c.dose.k === 'dist' && c.dose.key === 'easy' && lifted(day).length === 0;
    if(!good) A.d1.push(tag + ': ' + (day ? day.title + ' rest=' + !!day.rest + ' cards=' + cs.map(x => x.type + ':' + x.subtype + ' leg=' + x.legLoad + ' ' + canon(x.dose)).join(' + ') + ' lifts=' + lifted(day).join('+') : 'no day'));
    // D2: the week's easy distance, read from the pre-pin week's easy LSDs on the other days.
    const wk = pre.weeks[T1.w] || {};
    const ez = [...new Set(ISO.filter(d => d !== T1.d).flatMap(d => cards(wk[d]).filter(EASY)).map(x => x.dose && x.dose.mi))];
    if(ez.length){ A.d2reach++; if(!(ez.length === 1 && c && c.dose && c.dose.mi === ez[0])) A.d2.push(tag + ': shakeout ' + (c && c.dose ? c.dose.mi : '-') + ' mi, week easy LSD ' + ez.join('/') + ' mi'); }
  } else {
    A.re++;
    if(!(day && day.rest && day.title === 'Rest' && cards(day).length === 0)) A.d3.push(tag + ': ' + (day ? day.title + ' rest=' + !!day.rest + ' cards=' + cards(day).length : 'no day'));
  }
  // D4
  const bad = [];
  [[T1, 'T-1'], [T2, 'T-2']].forEach(([x, k]) => cards(at(p, x)).filter(HARD).forEach(c => bad.push(k + ' ' + c.subtype)));
  if(lifted(at(p, T1)).length) bad.push('T-1 lifts ' + lifted(at(p, T1)).join('+'));
  const trials = []; Object.keys(p.weeks).forEach(w => ISO.forEach(d => cards(p.weeks[w][d]).forEach(c => { if(/TIME TRIAL/.test(c.subtype || '')) trials.push('W' + w + ' ' + d); })));
  if(!(trials.length === 1 && trials[0] === 'W' + T0.w + ' ' + T0.d)) bad.push('trials ' + (trials.join(',') || 'none'));
  if(bad.length) A.d4.push(tag + ': ' + bad.join('; '));
  // D5 (pair)
  if(BASE){
    let b; try { b = clone(BASE.buildProgram(clone(cfg))); } catch(e){ A.d5.push(tag + ': V213 crash ' + e.message); continue; }
    A.d5n++;
    const shk = !!day && day.title === 'Shakeout';
    Object.keys(b.weeks).forEach(w => ISO.forEach(d => {
      if(+w === T1.w && d === T1.d) return;
      const x = b.weeks[w][d], y = p.weeks[w] && p.weeks[w][d];
      if(canon(x) === canon(y)) return;
      if(+w === T2.w && d === T2.d && shk && x && y && x.title === 'Shakeout' && y.title === 'Easy Run' && canon(Object.assign({}, x, {title:'Easy Run'})) === canon(y)){ A.d5t2++; return; }
      A.d5.push(tag + ': W' + w + ' ' + d + ' moved (' + (x && x.title) + ' -> ' + (y && y.title) + ')');
    }));
  }
}
const L = `${A.n} dated NSW test programs (pace + mile x 4 mixes x ${RESTS.length} rest sets x tw 2,5 x 7 test weekdays)`;
ok(`D0 ${L}: all build; reach: ${A.te} training-day eves (${A.tePrev} in week tw-1), ${A.re} rest-day eves; pre-pin eve content bike ${A.pre.bike}, swim ${A.pre.swim}, run ${A.pre.run}, lift-only ${A.pre.lift}`,
   A.crash.length === 0 && A.te > 0 && A.re > 0 && A.tePrev > 0 && A.pre.bike > 0 && A.pre.swim > 0 && A.pre.run > 0 && A.pre.lift > 0, 'crash ' + A.crash.slice(0, 2).join('; '));
ok(`D1 every training-day eve carries the shakeout and nothing else: one run card, "Long Slow Distance (LSD)", legLoad false, distance dose keyed easy, titled Shakeout, no lift (${A.te} eves)`,
   A.te > 0 && A.d1.length === 0, A.d1.length + '/' + A.te + ': ' + A.d1.slice(0, 3).join(' || '));
ok(`D2 the shakeout's distance is the week's easy LSD distance, read off the pre-pin week's other days (${A.d2reach} of ${A.te} eves reach the oracle)`,
   A.d2reach > 0 && A.d2.length === 0, A.d2.length + '/' + A.d2reach + ': ' + A.d2.slice(0, 3).join(' || '));
ok(`D2v the dose oracle reaches most training-day eves (${A.d2reach}/${A.te}, need at least half)`, A.te > 0 && A.d2reach * 2 >= A.te, A.d2reach + '/' + A.te);
ok(`D3 every rest-day eve rests: rest flag, title Rest, no card (${A.re} eves)`, A.re > 0 && A.d3.length === 0, A.d3.length + '/' + A.re + ': ' + A.d3.slice(0, 3).join(' || '));
ok(`D4 no hard run at T-1 or T-2, no lift at T-1, exactly one TIME TRIAL and it sits on the test day (${A.n} programs)`, A.n > 0 && A.d4.length === 0, A.d4.length + ': ' + A.d4.slice(0, 3).join(' || '));

// ── D5 / D6: the build pair ──
if(!(VER === ERA && BASE)){
  console.log('SKIP D5 scoped to the build pair candidate 214 against baseline 213; this pair is ' + VER + ' vs ' + (BASE ? 213 : 'none'));
  console.log('SKIP D6 scoped to the build pair candidate 214 against baseline 213; this pair is ' + VER + ' vs ' + (BASE ? 213 : 'none'));
} else {
  ok(`D5 PAIR: ${A.d5n} dated NSW programs byte-identical to V213 on every day but the eve (${A.d5t2} T-2 days retitled Shakeout to Easy Run because the eve now holds the shakeout)`,
     A.d5n === A.n && A.d5.length === 0, A.d5.length + ': ' + A.d5.slice(0, 3).join(' || '));
  const moved = []; let n = 0;
  const nrc = (g, rest, rd, mk) => ({name:'GK', primaryPath:'event', eventTargeted:true, raceDate:rd, cardioTypes:MIX[mk].types.slice(),
    cardioGoals:Object.assign({run:{id:g, label:g}}, clone(MIX[mk].x)), liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full',
    unit:'lbs', restDays:rest.slice(), days:JSDAY.slice(), bench:185, squat:255, deadlift:315, startDate:ymd(START), seed:76308});
  for(const g of ['run_5k','run_10k','run_half','run_marathon']) for(const rest of RESTS) for(const rd of ['2026-11-19','2026-11-22','2027-02-01']) for(const mk of ['run','run+bike']){
    const cfg = nrc(g, rest, rd, mk); n++;
    let a, b; try { a = progDigest(IA.buildProgram(clone(cfg))); } catch(e){ a = 'CRASH ' + e.message; } try { b = progDigest(BASE.buildProgram(clone(cfg))); } catch(e){ b = 'CRASH ' + e.message; }
    if(a !== b || /CRASH/.test(a)) moved.push(g + ' ' + rd + ' ' + mk + ' [' + rest + ']');
  }
  for(const gk of Object.keys(GOALS)) for(const mk of Object.keys(MIX)) for(const rest of RESTS){
    const cfg = mkCfg(gk, mk, rest, 5, 3); delete cfg.raceDate; delete cfg._testWeek; delete cfg._raceDateCappedWeeks; cfg.eventTargeted = false; cfg.primaryPath = 'goal'; n++;
    let a, b; try { a = progDigest(IA.buildProgram(clone(cfg))); } catch(e){ a = 'CRASH ' + e.message; } try { b = progDigest(BASE.buildProgram(clone(cfg))); } catch(e){ b = 'CRASH ' + e.message; }
    if(a !== b || /CRASH/.test(a)) moved.push('undated ' + gk + ' ' + mk + ' [' + rest + ']');
  }
  ok(`D6 PAIR: ${n} NRC race-pinned and undated NSW programs byte-identical to V213`, n > 0 && moved.length === 0, moved.length + ': ' + moved.slice(0, 3).join('; '));
}
// ── D7 / D8: the protect-park modes (V214 fix, coach; see header) ──────────────────────────────
{
  const INJ7 = {none:null, easy:{region:'lowback',tier:'workaround'}, noimpact:{region:'knee',tier:'protect'}, noimpact_swim:{region:'lowback',tier:'protect'},
                reduce:{region:'ankle',tier:'workaround'}, swimout:{region:'shoulder',tier:'protect'}, halfstep:{region:'knee',halfstep:true}};
  const EXCL = new Set(['noimpact','noimpact_swim','easy','reduce']);
  const R7 = [[], ['sun'], ['sun','wed'], ['sat','sun'], ['mon','thu'], ['sun','tue','thu','sat'], ['fri'], ['wed','thu','fri']];
  const PLACE = [[1, 3], [2, 5], [3, 6], [4, 0]];   // test on tw 1 Thu, tw 2 Sat, tw 3 Sun, tw 4 Mon (gatekeeper's placements)
  const isLift = s => !!s && (s.items || []).length && !/mobility|stretch|taper/i.test(s.label || '');
  const role = x => { const L = (x && !x.rest ? x.sections || [] : []).filter(isLift);
    return L.length ? (x.title || '') + ' [' + L.map(s => (s.label || '') + ':' + (s.items || []).map(i => String(i.name || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '')).join('/')).join('; ') + ']' : '-'; };
  const eveSig = x => canon({rest: !x || !!x.rest, lift: role(x) !== '-', cards: cards(x).map(c => c.type + ':' + (c.subtype || '')).sort()});
  if(!BASE){
    ok('D8 the excluded-mode eve row needs V213, the ruling\'s named oracle', false, baseWhy);
    if(VER === ERA) ok('D7 the lift-role pair row needs V213', false, baseWhy); else console.log('SKIP D7 scoped to the build pair candidate 214 against baseline 213');
  } else {
    const plan = IA.eval('injuryPlan'); let n = 0, crash = 0, d8n = 0; const d7 = [], d8 = [], reach = {};
    for(const mk of ['run','run+bike','run+swim']) for(const rest of R7) for(const [tw, wd] of PLACE) for(const ik of Object.keys(INJ7)){
      const cfg = mkCfg('pace', mk, rest, tw, wd); if(INJ7[ik]) cfg.injury = clone(INJ7[ik]);
      const mode = (plan(clone(cfg)) || {}).cardioMode || 'none';
      const test = addDays(START, 7 * (tw - 1) + wd);
      const T = [0, 1, 2].map(k => { const d = addDays(test, -k); return {k, w:weekOf(d), d:JSDAY[d.getDay()]}; });
      const tag = `${mk} rest ${rest.join('') || 'none'} ${ik} (${mode}) test ${cfg.raceDate}`;
      let a, b; try { a = clone(IA.buildProgram(clone(cfg))); b = clone(BASE.buildProgram(clone(cfg))); } catch(e){ crash++; continue; }
      n++;
      const at = (p, x) => p.weeks[x.w] ? p.weeks[x.w][x.d] : undefined;
      T.forEach(x => { const ra = role(at(a, x)), rb = role(at(b, x)); if(ra !== rb) d7.push(tag + ' T-' + x.k + ' W' + x.w + ' ' + x.d + ': ' + rb.slice(0, 60) + ' -> ' + ra.slice(0, 60)); });
      if(EXCL.has(mode) && !cfg.restDays.includes(T[1].d)){
        d8n++; reach[mode] = (reach[mode] || 0) + 1;
        const sa = eveSig(at(a, T[1])), sb = eveSig(at(b, T[1]));
        if(sa !== sb) d8.push(tag + ' eve W' + T[1].w + ' ' + T[1].d + ': V213 ' + sb + ' now ' + sa);
      }
    }
    if(VER === ERA) ok(`D7 PAIR: ${n} injured dated programs (3 mixes x ${R7.length} rest sets x 4 test placements x 7 injury modes): 0 lift-role changes against V213 on T-2, T-1 and the test day`,
                       n > 0 && crash === 0 && d7.length === 0, 'crash ' + crash + ', ' + d7.length + ': ' + d7.slice(0, 3).join(' || '));
    else console.log('SKIP D7 scoped to the build pair candidate 214 against baseline 213; this pair is ' + VER + ' vs 213');
    ok(`D8 under the protect-park modes the training-day eve is handled as V213 handles it: no shakeout card, no new lift, same rest flag (${d8n} eves, ${JSON.stringify(reach)})`,
       crash === 0 && [...EXCL].every(m => reach[m] > 0) && d8.length === 0, 'crash ' + crash + ', ' + d8.length + '/' + d8n + ': ' + d8.slice(0, 2).join(' || '));
  }
}
{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }
  ok('HM HALF_MANNY digest is 0ac7da6b1691a8e1 (ruled unmoved: an NRC fixture carries no test pin)', hm === '0ac7da6b1691a8e1', hm); }
done();
