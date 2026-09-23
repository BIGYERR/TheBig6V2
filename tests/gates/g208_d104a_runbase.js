// g208_d104a_runbase.js — D104a: run_base places its leg lifts by its own run week.
//
// RULING (D104a, coach V206 + V208-prep, RE-RULED at V208 slice 5):
//   * _nrcRunShape has a run_base arm keyed on dose.key: long = key `long` (the V159 budgeted
//     "Easy Run — Long", no legLoad), easy = the rest. _nrcLegCost unchanged. The steady -> speed
//     arm was removed at slice 5c (coach: an arm no lattice reaches is a claim no gate defends).
//   * deconflictLegLiftDays reads the FIRST week whose runs carry a `long` key (every NSW arm; NRC,
//     bike and swim carry no key and keep week 1), and the shape placement runs BEFORE the legLoad
//     early exit (re-ruling point 1: run_base's long run carries no legLoad).
//   * the run_base note is ONE string, BASE below. The steady variant was ruled dead copy after the
//     probe (tests/measure/v208_d104a_steady_probe.js): 0 of 2,160 programs on the 55+ low-baseline
//     lattice and 0 of 360 on the 18-35 lattice carry a steady run in their placement week.
//   * weeks before the first long-keyed run get no protection: they are easy runs (V159: a budgeted
//     run past 40 minutes is the designated long run, and it is labelled so). Programs with no
//     long-keyed run in any week stay on the 48h rule.
// THE WEEK-1-TRIAL PREMISE WAS EMPTY. The ruling expected ~840 dated pace programs with the test in
// week 1 to fall to week 2's long run. The test is always a program's LAST week (cfg._testWeek ===
// totalWeeks), so a test in week 1 is a one-week program with no week 2: 0 of 840 moved
// (tests/measure/v208_d104a_slice5.js). The first-long-week read is kept; it is what places the
// run_base programs whose first long-keyed run falls in week 6.
//
// ORACLES (independent of the placer):
//   * the long run by its LABEL, through g208_d103a_key's hand table: "Easy Run — Long", or
//     "Long Slow Distance (LSD)" with legLoad. R0b proves it agrees with dose.key on every card.
//   * the lower-body lift by the BUILT card: a "Main — <lift>" section whose lift is a squat/hinge/
//     lunge pattern by name. The eve by calendar arithmetic: Mon's eve is the previous week's Sun.
//   * the notes as hand-typed text: coach's BASE string and the three V153 48h tier openings.
//   * R7 against the baseline (argv[3], V207 or the V208 pre-slice tree).
// ROWS
//   R0  the lattice builds and reaches every class the rows read (placed in week 1, placed in a later
//       week, placed from a week with no legLoad card, no long run anywhere).
//   R0b the label hand table and dose.key name the same long run on every run_base run card.
//   R1  lower Main on a long-KEYED run or its eve, by calendar, over every week: 0 (run_base solo,
//       +bike, +swim). R1i prints the minutes-lens classifier count, UNASSERTED (coach).
//       R1 is also the WATCH on deconflictSameRegion (coach, slice 5c): it still reads week 1 while
//       the placement reads the first long-keyed week, so on the programs placed from a later week
//       (R0 proves the class is reached) the region pass judges a different week. R1 = 0 is the
//       outcome that read could break. Measured at slice 5c: blinding the region guard to the shape,
//       or zeroing its cardio cost, moves no leg role in this lattice (both survive R1), so the
//       watch has no mutation that trips it today; drift that ever lands a lift there trips R1.
//   R2  every program with a long-keyed run in any week prints BASE.
//   R3  every program with no long-keyed run in any week prints no note or a 48h tier only.
//   R4  BASE obeys the copy rule. R5 the steady variant is gone from the notes and the source.
//   R6  T-1 and T-2 of a dated pace or mile program still carry no lift (date arithmetic).
//   R7  undated pace/mile and NRC role grids and notes equal the baseline's.
//   R8a a program with no lift day prints no lift-placement note (coach, V208 close): dated 1-2 week
//       test programs and NRC race windows. Oracle: a lift day is a non-rest day tagged 'lift' OR
//       carrying a non-core, non-hip section with items; a program is lift-free only if neither holds.
//   R8b programs WITH a lift day are byte-identical to the pre-edit tree (build pair only: the baseline
//       carries the candidate's ia-version; against V207 it prints SKIP).
//   M1  HALF_MANNY digest 0ac7da6b1691a8e1.
// VERSION PREDICATE (standing ruling 4): D104a ships on ia-version 208. Below 208 every row prints
// SKIP. R7 runs only with a baseline whose ia-version is 207 or 208.
'use strict';
const path = require('path'), fs = require('fs');
const { load, progDigest, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version, ERA = 208;
let pass = 0, fail = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skip = l => console.log('SKIP ' + l);
const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const ROWS = ['R0','R0b','R1','R2','R3','R4','R5','R6','R7','R8a','R8b','M1'];
if(VER < ERA){ ROWS.forEach(r => skip(r + ' ia-version ' + VER + ' predates D104a (V' + ERA + ')')); done(); }

const BASE = 'Nothing heavy lands on your long run or the day before it. Your lifting days were placed around it.';
const STEADY_DEAD = 'Your hinge day rides your steady run so hard days stay hard.';
const TIER48 = ['Your training days are tightly packed', 'Your heavy lifting was kept off the same day as your hardest runs', 'Your heavy lifting was spaced out from your hardest runs'];
const D36 = 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.';
const ISO = ['mon','tue','wed','thu','fri','sat','sun'], ALL = ['sun','mon','tue','wed','thu','fri','sat'];
const clone = o => JSON.parse(JSON.stringify(o));
const stripSvg = n => String(n || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '');
const cardios = day => (!day || !day.cardio) ? [] : (Array.isArray(day.cardio) ? day.cardio : [day.cardio]);
const LOWER_MAIN = /squat|deadlift|\brdl\b|romanian|good morning|hip thrust|lunge|step-?up|\bclean\b|snatch|trap bar/i;
const mainLift = day => { const s = (day.sections || []).find(x => /^Main\s*—/.test(x.label || '')); return s ? stripSvg((s.items || [])[0] && s.items[0].name) : null; };
const lowerDay = day => !!day && !day.rest && LOWER_MAIN.test(mainLift(day) || '');
const labelLong = c => c.type === 'run' && (/^Easy Run — Long/.test(c.subtype || '') || (/^Long Slow Distance \(LSD\)/.test(c.subtype || '') && !!c.legLoad));
const keyLong = c => c.type === 'run' && !!c.dose && c.dose.key === 'long';
const eveOf = (w, d) => d === 'mon' ? [w - 1, 'sun'] : [w, ISO[ISO.indexOf(d) - 1]];
const tierOnly = n => n == null || TIER48.some(t => n.startsWith(t));

// ── the lattices ────────────────────────────────────────────────────────────────────
const REST = [[],['sun'],['sat'],['sun','wed'],['sat','sun'],['mon','fri'],['sun','wed','sat'],['tue','thu','sat'],['sun','tue','thu','sat'],['mon','wed','fri','sun']];
const LAT = [];
// (a) 18-35, 2.5 mile baseline, the V207 measure's cfgs (tests/measure/v208_remeasure_on_v207.js (a))
for(const mix of ['', 'bike']) for(const exp of ['beginner','intermediate','advanced']) for(const rest of REST) for(const seed of [24865, 7, 4242]) for(const wo of [4, 8, 12]) for(const focus of ['balanced','support_strength']){
  const race = new Date('2026-09-21T00:00:00'); race.setDate(race.getDate() + wo * 7);
  const cg = {run:{id:'run_base', mileBestMins:'8', mileBestSecs:'15', baseline:'2.5 miles'}}; if(mix) cg.bike = {id:'bike_base'};
  LAT.push({fam:'18-35 run_base' + (mix ? '+' + mix : ''), cfg:{primaryPath:'event', eventTargeted:true, raceDate:race.toISOString().slice(0, 10), cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg,
    liftingFocus:focus, experience:exp, ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:rest.slice(), days:ALL.slice(), bench:185, squat:255, deadlift:315, name:'M', startDate:'2026-09-21', seed}});
}
// (b) 55+, low baseline, the HALF_MANNY shape that prints the Steady Aerobic Run
for(const mix of ['', 'bike', 'swim']) for(const exp of ['intermediate','advanced']) for(const bd of ['0.1','1']) for(const rest of REST) for(const seed of [76308, 7]) for(const pp of ['fitness','event']){
  const cg = {run:{id:'run_base', label:'Build Running Base', baselineDist:bd, baseline:bd + 'mi'}}; if(mix === 'bike') cg.bike = {id:'bike_base', label:'Bike'}; if(mix === 'swim') cg.swim = {id:'swim_base', label:'Swim'};
  LAT.push({fam:'55+ run_base' + (mix ? '+' + mix : ''), cfg:Object.assign(clone(fixtures.HALF_MANNY), {name:'RB', primaryPath:pp, cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg,
    eventTargeted:pp === 'event', raceDate:pp === 'event' ? '2027-06-01' : '', experience:exp, ageBracket:'55+', restDays:rest, seed})});
}
const S = {progs:0, crash:[], cards:0, disagree:[], hits:{}, hitEx:[], minHits:{}, cls:{}, r2bad:[], r3bad:[], r3n:0, r2n:0, notes:new Set()};
const cnt = (m, k) => { m[k] = (m[k] || 0) + 1; };
for(const L of LAT){
  let p; try { p = IA.buildProgram(clone(L.cfg)); } catch(e){ S.crash.push(L.fam + ': ' + e.message); continue; }
  S.progs++;
  const train = ALL.filter(d => !L.cfg.restDays.includes(d));
  const wks = Object.keys(p.weeks).map(Number).sort((a, b) => a - b);
  const longDays = {}; let firstLong = null;
  for(const w of wks) ISO.forEach(d => cardios(p.weeks[w][d]).forEach(c => { if(c.type !== 'run') return; S.cards++;
    if(labelLong(c) !== keyLong(c)) S.disagree.push(L.fam + ' W' + w + ' ' + d + ' "' + c.subtype + '" key ' + (c.dose && c.dose.key) + ' legLoad ' + c.legLoad);
    if(labelLong(c)){ (longDays[w] = longDays[w] || []).push(d); if(firstLong === null && train.includes(d)) firstLong = w; } }));
  const hasLong = firstLong !== null;
  if(!hasLong) cnt(S.cls, 'no long run anywhere');
  else { cnt(S.cls, firstLong === 1 ? 'first long run in week 1' : 'first long run in a later week');
    const legLoadIn = ISO.some(d => cardios(p.weeks[firstLong][d]).some(c => !!c.legLoad));
    if(!legLoadIn) cnt(S.cls, 'placement week has no legLoad card'); }
  // R1: the key lens, by calendar
  for(const w of wks) for(const d of (longDays[w] || [])){
    const [ew, ed] = eveOf(w, d);
    for(const [hw, hd, where] of [[w, d, 'ON'], [ew, ed, 'EVE']]){ const day = p.weeks[hw] && p.weeks[hw][hd];
      if(lowerDay(day)){ cnt(S.hits, L.fam); if(S.hitEx.length < 4) S.hitEx.push(L.fam + ' W' + hw + ' ' + hd + ' ' + where + ' long W' + w + ' ' + d + ' ' + day.title + ' / ' + mainLift(day)); } } }
  // R1i: the minutes lens (v208_d104_hard_days.js classifier, rename-aware), unasserted
  for(const w of wks){ let ld = null, lm = -1;
    ISO.forEach(d => cardios(p.weeks[w][d]).forEach(c => { if(c.type !== 'run' || /\((INT|SI|CHI|LI)\)/.test(c.subtype || '')) return;
      if(!/Long Slow Distance|\bLSD\b|Easy Run|Steady Aerobic|Long/.test(c.subtype || '')) return;
      const m = (+((c.detail || '').match(/(\d+)\s*(?:-|–)?\s*min/) || [])[1] || 0) + (/Long/.test((c.subtype || '').replace(/Long Slow Distance/, '')) ? 1e6 : 0); if(m >= lm){ lm = m; ld = d; } }));
    if(!ld) continue; const [ew, ed] = eveOf(w, ld);
    if(lowerDay(p.weeks[w][ld]) || lowerDay(p.weeks[ew] && p.weeks[ew][ed])) cnt(S.minHits, L.fam); }
  // R2 / R3: the note
  const n = p.legRecoveryNote; S.notes.add(n);
  if(hasLong){ S.r2n++; if(!(n === BASE || (typeof n === 'string' && n.startsWith(BASE + ' ')))) S.r2bad.push(L.fam + ' ' + JSON.stringify(n)); }
  else { S.r3n++; if(!tierOnly(n)) S.r3bad.push(L.fam + ' ' + JSON.stringify(n)); }
}
const C = S.cls;
ok(`R0 ${S.progs}/${LAT.length} run_base programs build and reach every class (${Object.keys(C).sort().map(k => k + ' ' + C[k]).join(', ')})`,
   S.crash.length === 0 && C['first long run in week 1'] > 0 && C['first long run in a later week'] > 0 && C['placement week has no legLoad card'] > 0 && C['no long run anywhere'] > 0,
   S.crash.slice(0, 2).join('; ') + ' ' + JSON.stringify(C));
ok(`R0b the label hand table and dose.key name the same long run on every run_base run card (${S.cards} cards)`, S.cards > 0 && S.disagree.length === 0, S.disagree.length + ': ' + S.disagree.slice(0, 3).join('; '));
const hitN = Object.values(S.hits).reduce((a, b) => a + b, 0);
ok(`R1 no lower-body Main lands on a long-keyed run or its eve, by calendar, in any week (${S.progs} programs)`, hitN === 0, hitN + ' hits ' + JSON.stringify(S.hits) + ' e.g. ' + S.hitEx.join('; '));
console.log('INFO R1i minutes-lens classifier (unasserted, coach): lower Main on the week\'s longest aerobic run or its eve ' + JSON.stringify(S.minHits) + '; these weeks carry no long-keyed run (easy runs, V159) or the program has none (48h rule)');
ok(`R2 every program with a long-keyed run in any week prints the run_base note (${S.r2n} programs)`, S.r2n > 0 && S.r2bad.length === 0, S.r2bad.length + ': ' + S.r2bad.slice(0, 3).join('; '));
ok(`R3 every program with no long-keyed run in any week stays on the 48h rule: no note or a 48h tier only (${S.r3n} programs)`, S.r3n > 0 && S.r3bad.length === 0, S.r3bad.length + ': ' + S.r3bad.slice(0, 3).join('; '));
ok('R4 the run_base note obeys the copy rule: two short sentences, no mid-sentence hyphen or em-dash, no brand',
   !/\S\s*[–—]\s*\S/.test(BASE) && !/[a-z] - [a-z]/.test(BASE) && !/-/.test(BASE) && !/Nike/i.test(BASE) && BASE.split('.').filter(s => s.trim()).length === 2, JSON.stringify(BASE));
{ const SRC = fs.readFileSync(ART, 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const inNotes = [...S.notes].filter(n => typeof n === 'string' && n.indexOf(STEADY_DEAD) >= 0).length;
  ok('R5 the steady variant (ruled dead copy) is in no printed note and not in the source, comments stripped', inNotes === 0 && SRC.indexOf(STEADY_DEAD) < 0, inNotes + ' notes, source ' + SRC.indexOf(STEADY_DEAD)); }
// ── R6: T-1 and T-2 of a dated test, by date arithmetic ─────────────────────────────
{ const START = new Date(2026, 9, 5);   // Mon 2026-10-05
  const isoOff = n => { const d = new Date(START); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const PACE = {id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'};
  const MILE = {id:'run_mile_time', mileBestMins:'8', mileBestSecs:'15', targetDist:'1', targetMins:'7', targetSecs:'30', paceUnit:'mi'};
  let days = 0; const bad = [];
  for(const g of [PACE, MILE]) for(const mix of ['', 'bike']) for(const rest of [[], ['sun'], ['sun','wed'], ['sat','sun']]) for(const tw of [1, 2, 3]) for(let wd = 0; wd < 7; wd++){
    const cg = {run:clone(g)}; if(mix) cg.bike = {id:'bike_base'};
    const p = IA.buildProgram({name:'GK', primaryPath:'event', eventTargeted:true, raceDate:isoOff(7 * (tw - 1) + wd), _testWeek:tw, _raceDateCappedWeeks:tw, cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg,
      liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:rest.slice(), days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:isoOff(0), seed:24865});
    for(const k of [1, 2]){ const o = 7 * (tw - 1) + wd - k; if(o < 0) continue; const w = Math.floor(o / 7) + 1, d = ISO[o % 7], day = p.weeks[w] && p.weeks[w][d]; days++;
      if(day && (day.sections || []).some(s => (s.items || []).length)) bad.push(g.id + (mix ? '+' + mix : '') + ' tw' + tw + ' test ' + ISO[wd] + ' T-' + k + ' W' + w + ' ' + d); } }
  ok(`R6 T-1 and T-2 of a dated pace or mile test carry no section with items (${days} days)`, days > 0 && bad.length === 0, bad.length + ': ' + bad.slice(0, 3).join('; ')); }
// ── R7: undated pace/mile and NRC against the baseline ──────────────────────────────
if(!BASEFILE) skip('R7 no baseline passed as argv[3]');
else { const IB = load(BASEFILE);
  if(!(+IB.version === 207 || +IB.version === 208)) skip('R7 baseline ia-version ' + IB.version + ' is neither V207 nor the V208 pre-slice tree');
  else { const grid = p => Object.keys(p.weeks).map(w => ISO.map(d => { const x = p.weeks[w][d]; return !x || x.rest ? 'R' : (x.title || '?'); }).join(',')).join('|') + ' :: ' + p.legRecoveryNote;
    const CF = []; let n = 0; const moved = [];
    for(const g of ['run_pace_goal','run_mile_time']) for(const mix of ['', 'bike', 'swim']) for(const rest of REST.slice(0, 6)){
      const cg = {run:g === 'run_pace_goal' ? {id:g, label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'} : {id:g, mileBestMins:'8', mileBestSecs:'15', targetDist:'1', targetMins:'7', targetSecs:'30', paceUnit:'mi'}};
      if(mix === 'bike') cg.bike = {id:'bike_base'}; if(mix === 'swim') cg.swim = {id:'swim_base'};
      CF.push({fam:g + (mix ? '+' + mix : ''), cfg:{name:'U', primaryPath:'goal', eventTargeted:false, cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35',
        equipment:'home_full', unit:'lbs', restDays:rest.slice(), days:ALL.slice(), bench:185, squat:255, deadlift:315, seed:24865}}); }
    for(const g of ['run_5k','run_10k','run_half','run_marathon']) for(const mix of ['', 'bike', 'swim']) for(const rest of [['sun'], ['sun','wed'], [], ['sat','sun']]){
      const cg = {run:{id:g, label:g}}; if(mix === 'bike') cg.bike = {id:'bike_base', label:'Bike'}; if(mix === 'swim') cg.swim = {id:'swim_base', label:'Swim'};
      CF.push({fam:'NRC ' + g, cfg:Object.assign(clone(fixtures.HALF_MANNY), {cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, restDays:rest, seed:76308})}); }
    for(const e of CF){ n++; if(grid(IA.buildProgram(clone(e.cfg))) !== grid(IB.buildProgram(clone(e.cfg)))) moved.push(e.fam + ' rest=' + e.cfg.restDays.join('+')); }
    ok(`R7 undated pace/mile and NRC role grids and notes equal the baseline's (${n} programs)`, n > 0 && moved.length === 0, moved.length + ': ' + moved.slice(0, 3).join('; ')); } }
// ── M1 ─────────────────────────────────────────────────────────────────────────────
// ── R8: no lift day, no lift-placement note ─────────────────────────────────────────
{ const START = new Date(2026, 9, 5);   // Mon 2026-10-05
  const isoOff = n => { const d = new Date(START); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const PACE = {id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'};
  const MILE = {id:'run_mile_time', mileBestMins:'8', mileBestSecs:'15', targetDist:'1', targetMins:'7', targetSecs:'30', paceUnit:'mi'};
  const CF = [];
  for(const g of [PACE, MILE]) for(const mix of ['', 'bike', 'swim']) for(const rest of [[], ['sun'], ['sat'], ['sun','wed'], ['sat','sun'], ['mon','fri'], ['sun','tue','thu','sat']]) for(const tw of [1, 2]) for(let wd = 0; wd < 7; wd++){
    const cg = {run:clone(g)}; if(mix === 'bike') cg.bike = {id:'bike_base'}; if(mix === 'swim') cg.swim = {id:'swim_base'};
    CF.push({fam:g.id + (mix ? '+' + mix : '') + ' tw' + tw, cfg:{name:'GK', primaryPath:'event', eventTargeted:true, raceDate:isoOff(7 * (tw - 1) + wd), _testWeek:tw, _raceDateCappedWeeks:tw, cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg,
      liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:rest.slice(), days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:isoOff(0), seed:24865}}); }
  for(const g of ['run_5k','run_10k']) for(const mix of ['', 'bike']) for(const rest of [['sun'], ['sun','wed']]) for(const off of [2, 5, 9, 12]){
    const cg = {run:{id:g, label:g}}; if(mix) cg.bike = {id:'bike_base', label:'Bike'};
    CF.push({fam:'NRC ' + g + (mix ? '+' + mix : ''), cfg:Object.assign(clone(fixtures.HALF_MANNY), {cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, restDays:rest, seed:76308, startDate:isoOff(0), raceDate:isoOff(off)})}); }
  const liftDay = x => !!x && !x.rest && ((x.tags || []).includes('lift') || (x.sections || []).some(s => !s.core && !s.hip && (s.items || []).length));
  const hasLift = p => Object.keys(p.weeks).some(w => ISO.some(d => liftDay(p.weeks[w][d])));
  const free = [], bad = [], withLift = []; let crash = 0;
  CF.forEach((e, i) => { let p; try { p = IA.buildProgram(clone(e.cfg)); } catch(x){ crash++; return; }
    if(hasLift(p)) withLift.push(i); else { free.push(i); if(p.legRecoveryNote != null) bad.push(e.fam + ' race ' + e.cfg.raceDate + ' rest=[' + e.cfg.restDays + '] ' + JSON.stringify(String(p.legRecoveryNote).slice(0, 50))); } });
  ok(`R8a a program with no lift day prints no lift-placement note (${free.length} lift-free of ${CF.length} short dated programs, ${crash} crashes)`, crash === 0 && free.length > 0 && bad.length === 0, bad.length + ' carry a note: ' + bad.slice(0, 3).join('; '));
  if(!BASEFILE) skip('R8b no baseline passed as argv[3]');
  else { const IB = load(BASEFILE);
    if(+IB.version !== VER) skip('R8b runs only against the pre-edit tree at the same ia-version (build proof for the V208 close guard); this pair is ' + VER + ' vs ' + IB.version);
    else { const strip = p => { const q = clone(p); delete q.created; delete q.id; return JSON.stringify(q); }; const moved = [];
      withLift.forEach(i => { if(strip(IA.buildProgram(clone(CF[i].cfg))) !== strip(IB.buildProgram(clone(CF[i].cfg)))) moved.push(CF[i].fam + ' race ' + CF[i].cfg.raceDate); });
      ok(`R8b the ${withLift.length} programs with a lift day are byte-identical to the pre-edit tree`, withLift.length > 0 && moved.length === 0, moved.length + ' moved: ' + moved.slice(0, 3).join('; ')); } } }
{ let hm; try { hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }
  ok('M1 HALF_MANNY digest is 0ac7da6b1691a8e1 (NRC: D104a does not reach it)', hm === '0ac7da6b1691a8e1', hm); }
done();
