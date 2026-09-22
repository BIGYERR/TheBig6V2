// V202 measure — pass 4D: COMPRESSION. What happens to an already-running program
// when D106 shortens it from 11 weeks to 5, PRT landing on the final week?
// READ-ONLY. Never edits index.html. Oracle for dates/lengths is hand date
// arithmetic in this file, never raceAlignment (which is NRC-only and returns null
// on run_pace_goal) and never the wizard cap at index.html:6613.
//
// HOW THE COMPRESSED PROGRAM IS CONSTRUCTED (stated per Q-D1):
//   NOT source surgery. The app already has the cap field: index.html:6704
//     const totalWeeks = cfg._raceDateCappedWeeks || cardioLength.weeks;
//   and index.html:6613 currently writes `WD._raceDateCappedWeeks = totalWeeksPreview`
//   (i.e. the goal length — the cap is a live no-op today). D106's arithmetic
//   tw = min(goalLength, weeksOut+1) is therefore expressed by setting that same
//   cfg field to 5. Same code path, same line 6704, no surgery.
//
// STUBS: harness makeContext's localStorage (Map-backed) persists for the life of the
// IA instance, so "reload" == calling refreshProgram(storedProg) again against the same
// store. That IS the boot path (index.html:16331). No clock stub: TODAY is pinned by
// passing explicit ISO dates everywhere the measure compares, and the engine's own
// date reads are only used where noted.
const path = require('path');
const fs = require('fs');
const H = require(path.join(__dirname,'..','harness.js'));
// The export shim only captures names listed in EXPORT_NAMES; extend it IN PLACE
// before load() so the record-key helpers are reachable. Top-level `let` (index.html:1503
// activeProgId/activeProg/currentWeek/currentDayKey) never lands on the VM context, so
// snapshotDay()/logExerciseWeight() cannot be driven directly — their writes are forged
// below from the exact writer bodies, quoted at each site.
H.EXPORT_NAMES.push('logKey','completedKey','_progDayDate','getPrograms','savePrograms',
  'getDayHistFor','getLogsFor','getExWeightsFor','saveExWeightsFor','_parseLocalDate','_isoOf',
  'exStoreKey','applyOverlays','overlayWeekRange');
const HTML = process.argv[2] || path.join(__dirname,'..','..','index.html');
const SRC = fs.readFileSync(HTML,'utf8').split('\n');
const line = n => SRC[n-1];

const TODAY = '2026-09-21';   // pinned: Monday
const RACE  = '2026-10-19';   // Mario's PRT, a Monday
const SEED  = 24865;
const TRAIN = ['mon','tue','thu','fri','sat'];   // restDays sun+wed
const D7 = 86400000;
const iso = d => d.toISOString().slice(0,10);
const parse = s => { const p=s.split('-').map(Number); const d=new Date(p[0],p[1]-1,p[2]); d.setHours(0,0,0,0); return d; };

function mk(){ return H.load(HTML); }
const IA0 = mk();
console.log('ia-version', IA0.version, '| HTML', HTML);

// ═══════════════════════════════════════════════════════════════════
// 0. KEY SHAPE — established here, independently. Quoted with line numbers.
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ Q-0  RECORD KEY SHAPE ══');
const KEYSITES = [
  ['ia_programs', 1185], ['ia_programs', 1186],
  ['ia_logs_',  1189], ['ia_logs_',  1197],
  ['ia_hist_',  1269], ['ia_hist_',  1270],
  ['ia_comp_',  1198], ['ia_comp_',  1199],
  ['ia_exw_',   12091],['ia_exw_',   12092],
  ['logKey',    1202], ['completedKey', 1251],
  ['exStoreKey',1789],
  ['snapshotDay-key', 1289],
  ['freeze-loop', 14587],
  ['week->date',10434],
  ['cap-read',  6704], ['cap-write', 6613],
];
KEYSITES.forEach(([n,l])=>console.log(`  index.html:${l}  [${n}]  ${String(line(l)).trim().slice(0,150)}`));
const COUNTS = ['ia_hist_','ia_exw_','ia_logs_','ia_comp_','ia_moves_','ia_swaps_','ia_edits_','ia_wild_','ia_programs','_raceDateCappedWeeks','totalWeeks'];
const raw = fs.readFileSync(HTML,'utf8');
console.log('  grep counts (whole file, comments included):');
COUNTS.forEach(t=>{ const c=(raw.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length; console.log(`    ${t.padEnd(22)} ${c}`); });
console.log('  KEY COMPOSITION:');
console.log("    ia_logs_<progId>  -> key logKey(w,d) = 'w'+w+'_'+d      => WEEK INDEX + weekday name. No date, no session id.");
console.log("    ia_comp_<progId>  -> key completedKey(w,d) = 'w'+w+'_'+d => WEEK INDEX + weekday name.");
console.log("    ia_hist_<progId>  -> key completedKey(week,dayKey)       => WEEK INDEX + weekday name.");
console.log("    ia_exw_<progId>   -> key exStoreKey(exName) = EXERCISE SLUG; each entry carries {week:<WEEK INDEX>, day:<weekday>}.");
console.log("    ia_programs       -> array; program identity is prog.id (uuid-ish), not a date.");
console.log("    NO record key anywhere is an ISO DATE. Week identity is ORDINAL.");

// ═══════════════════════════════════════════════════════════════════
// ORACLE — hand date arithmetic for D106
// ═══════════════════════════════════════════════════════════════════
const weeksOutHand = Math.floor((parse(RACE) - parse(TODAY))/D7/7);
console.log('\n══ ORACLE (hand arithmetic, not the engine) ══');
console.log(`  today ${TODAY}  race ${RACE}  days apart ${(parse(RACE)-parse(TODAY))/D7}  weeksOut = floor(28/7) = ${weeksOutHand}`);
console.log(`  D106 tw = min(goalLength, weeksOut+1) = min(goalLength, ${weeksOutHand+1})`);
console.log(`  start Mon ${TODAY} => week N covers ${TODAY}+7*(N-1) .. +6 ; race ${RACE} sits in week ${Math.floor((parse(RACE)-parse(TODAY))/D7/7)+1}`);

// ═══════════════════════════════════════════════════════════════════
// CFG
// ═══════════════════════════════════════════════════════════════════
const baseCfg = (over) => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:RACE,
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs',
  restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:185, squat:245, deadlift:315, seed:SEED,
  cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',
    targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'30', targetTime:'10:30',
    mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, baselineDist:'3', baseline:'3mi'}},
}, over||{});

// ═══════════════════════════════════════════════════════════════════
// FORGED WRITERS — copied byte-for-byte in shape from the app's own writers.
//   snapshotDay  index.html:1287-1296 : h[completedKey(week,dayKey)] = deep copy of
//                activeProg.weeks[week][dayKey]; saveDayHist -> 'ia_hist_'+id
//   saveCompleted index.html:1199     : localStorage 'ia_comp_'+id, key completedKey(w,d)
//   writeSetDraft/persistLogFields    : logs[logKey(w,d)] = {week:w, ts:...}
//   logExerciseWeight index.html:12149-12171 : store[exStoreKey(name)].entries.push(
//                {weight,setsReps,setsDone,setsW,week:w,day:dk,ts})
// ═══════════════════════════════════════════════════════════════════
// DAY SHAPE (probed, index.html engineD output): {title,dot,tags,cardio,sections[]},
// sections[i] = {label, superset?, rounds?, hip?, items:[{name,detail}]}.
function exNamesOf(day){
  const out=[];
  if(!day || !Array.isArray(day.sections)) return out;
  day.sections.forEach(sec=>{ (sec.items||[]).forEach(it=>{ if(it && it.name) out.push(it.name); }); });
  return out;
}
// Canonical digest: recursive key sort. (An earlier cut of this script used
// JSON.stringify(day, Object.keys(day).sort()) — that second argument is an ALLOWLIST
// applied at EVERY nesting level, so it stripped sections/items and made every day
// compare equal. Instrument defect, fixed here.)
function canon(v){
  if(v===null||typeof v!=='object') return JSON.stringify(v)||'null';
  if(Array.isArray(v)) return '['+v.map(canon).join(',')+']';
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
}
function dayDigest(day){ return day ? canon(day) : '(none)'; }
function dayLine(day){
  if(!day) return '(no day)';
  const secs=(day.sections||[]).map(s=>`${s.label}${s.superset?' [SS x'+(s.rounds||1)+']':''}: `+(s.items||[]).map(i=>`${i.name} ${i.detail||''}`).join(' / ')).join('  ||  ');
  const c=day.cardio?`${day.cardio.subtype} :: ${String(day.cardio.detail||'').split('\n')[0]}`:'no cardio';
  return `title="${day.title}" | CARDIO ${c} | ${secs}`;
}
function logWeeks(IA, prog, weeks, only){
  const hist={}, comp={}, logs={}, exw={};
  weeks.forEach(w=>{
    const wk = prog.weeks[w]; if(!wk) return;
    Object.keys(wk).forEach(d=>{
      if(!TRAIN.includes(d)) return;
      const k = 'w'+w+'_'+d;
      hist[k] = JSON.parse(JSON.stringify(wk[d]));
      comp[k] = true;
      logs[k] = {week:w, ts:1, rpe:8};
      exNamesOf(wk[d]).forEach((nm,i)=>{
        const key = IA.exStoreKey(nm);
        if(!exw[key]) exw[key]={name:nm, entries:[]};
        exw[key].entries.push({weight:135+i, setsReps:'3x5', setsDone:[], setsW:[], week:w, day:d, ts:1});
      });
    });
  });
  const want = k => !only || only.indexOf(k)>=0;
  if(want('hist')) IA.localStorage.setItem('ia_hist_'+prog.id, JSON.stringify(hist));
  if(want('comp')) IA.localStorage.setItem('ia_comp_'+prog.id, JSON.stringify(comp));
  if(want('logs')) IA.localStorage.setItem('ia_logs_'+prog.id, JSON.stringify(logs));
  if(want('exw'))  IA.localStorage.setItem('ia_exw_'+prog.id,  JSON.stringify(exw));
  return {hist, comp, logs, exw};
}
function makeLive(IA, capWeeks, loggedWeeks, only){
  const cfg = baseCfg(capWeeks ? {_raceDateCappedWeeks:capWeeks} : {});
  const prog = IA.buildProgram(cfg);
  prog.id = 'p_prt';
  const r = IA.resolveStartDate(TODAY, ['sun','wed']);
  prog.startDate = (r && r.start) || TODAY;
  IA.localStorage.setItem('ia_programs', JSON.stringify([prog]));
  IA.localStorage.setItem('ia_active','p_prt');
  const rec = logWeeks(IA, prog, loggedWeeks, only);
  return {prog, rec, cfg};
}

// ═══════════════════════════════════════════════════════════════════
// Q-D0  BASELINE: does the 11-week program exist, and does the cap field persist?
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ Q-D0  BASELINE ══');
const IAa = mk();
const L = makeLive(IAa, null, [1,2,3]);
console.log('  built totalWeeks =', L.prog.totalWeeks, '| week keys =', Object.keys(L.prog.weeks).length, '| startDate =', L.prog.startDate);
console.log('  prog.cfg._raceDateCappedWeeks persisted into stored cfg =', JSON.stringify(L.prog.cfg._raceDateCappedWeeks));
const capped = IAa.buildProgram(baseCfg({_raceDateCappedWeeks:5}));
console.log('  cfg._raceDateCappedWeeks:5 => totalWeeks =', capped.totalWeeks, '| week keys =', Object.keys(capped.weeks).length);
// PROVE BASELINE EQUALS ITSELF before diffing anything.
const selfA = IAa.buildProgram(baseCfg({})), selfB = IAa.buildProgram(baseCfg({}));
console.log('  baseline self-identity (seed pinned, clock fields stripped):',
  H.progDigest(selfA) === H.progDigest(selfB) ? 'EQUAL ✓' : 'NOT EQUAL ✗');

// ═══════════════════════════════════════════════════════════════════
// Q-D1 pre  — WIZARD-ONLY D106 (edit 6613 only): does a LIVE program compress at all?
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ Q-D1pre  D106 APPLIED AT THE WIZARD ONLY (index.html:6613) ══');
{
  const IA = mk();
  const live = makeLive(IA, 11, [1,2,3]);   // cfg carries the V201 cap value, as a real stored program does
  const stored = JSON.parse(IA.localStorage.getItem('ia_programs'))[0];
  const reb = IA.refreshProgram(stored);
  console.log('  stored cfg._raceDateCappedWeeks =', stored.cfg._raceDateCappedWeeks);
  console.log('  after reload: rebuilt.totalWeeks =', reb.totalWeeks, '| week keys =', Object.keys(reb.weeks).length);
  console.log('  => a wizard-only D106 leaves the LIVE program at', reb.totalWeeks, 'weeks. Existing programs do NOT compress.');
}

// ═══════════════════════════════════════════════════════════════════
// Q-D1  COMPRESSION 11 -> 5 with weeks 1-3 logged
// ═══════════════════════════════════════════════════════════════════
function compress(loggedWeeks, only){
  const IA = mk();
  const live = makeLive(IA, null, loggedWeeks, only);            // 11-week build, logged
  const before = JSON.parse(JSON.stringify(live.prog));
  const stored = JSON.parse(IA.localStorage.getItem('ia_programs'))[0];
  stored.cfg = Object.assign({}, stored.cfg, {_raceDateCappedWeeks:5});  // D106 arithmetic, on the app's own field
  const after = IA.refreshProgram(stored);
  return {IA, before, after, rec: live.rec, stored};
}
console.log('\n══ Q-D1  COMPRESSION (11 -> 5), weeks 1-3 logged ══');
const C = compress([1,2,3]);
console.log('  before: totalWeeks', C.before.totalWeeks, 'weeks', Object.keys(C.before.weeks).length);
console.log('  after : totalWeeks', C.after.totalWeeks,  'weeks', Object.keys(C.after.weeks).length,
            '| keys =', Object.keys(C.after.weeks).sort((a,b)=>a-b).join(','));

// (a) record attachment
function classify(C){
  const res = {attached:0, orphaned:0, misattributed:0, total:0, mis:[], orph:[]};
  const hist = JSON.parse(C.IA.localStorage.getItem('ia_hist_p_prt')||'{}');
  Object.keys(hist).forEach(k=>{
    res.total++;
    const m = /^w(\d+)_(\w+)$/.exec(k); const w=+m[1], d=m[2];
    const now = C.after.weeks[w] && C.after.weeks[w][d];
    if(!now){ res.orphaned++; res.orph.push(k); return; }
    if(dayDigest(now) === dayDigest(hist[k])) res.attached++;
    else { res.misattributed++; res.mis.push(k); }
  });
  return res;
}
const cls = classify(C);
console.log(`  (a) ia_hist_ day records: ${cls.total} total | attached ${cls.attached} | orphaned ${cls.orphaned} | MISATTRIBUTED ${cls.misattributed}`);
if(cls.mis.length) console.log('      misattributed keys:', cls.mis.join(','));
if(cls.orph.length) console.log('      orphaned keys:', cls.orph.join(','));
// exw: does the logged exercise still appear on the card its entry points at?
function exClassify(C){
  const exw = JSON.parse(C.IA.localStorage.getItem('ia_exw_p_prt')||'{}');
  let tot=0, ok=0, noWeek=0, noEx=0; const bad=[];
  Object.keys(exw).forEach(key=>{
    exw[key].entries.forEach(e=>{
      tot++;
      const day = C.after.weeks[e.week] && C.after.weeks[e.week][e.day];
      if(!day){ noWeek++; return; }
      if(exNamesOf(day).map(n=>C.IA.exStoreKey(n)).includes(key)) ok++;
      else { noEx++; bad.push(`w${e.week}_${e.day}:${key}`); }
    });
  });
  return {tot, ok, noWeek, noEx, bad};
}
const ex = exClassify(C);
console.log(`  (a) ia_exw_ load entries: ${ex.tot} total | still on their card ${ex.ok} | week gone ${ex.noWeek} | exercise gone from that card ${ex.noEx}`);
if(ex.bad.length) console.log('      loads now under a card lacking that movement:', ex.bad.slice(0,20).join(','), ex.bad.length>20?`(+${ex.bad.length-20})`:'');

// (c) weeks 1-3 before/after, card by card
console.log('\n  (c) WEEKS 1-3 CARD BEFORE vs AFTER (the "is a logged week silently rewritten" question)');
let rewritten=0, same=0;
[1,2,3].forEach(w=>{
  TRAIN.forEach(d=>{
    const b = C.before.weeks[w] && C.before.weeks[w][d];
    const a = C.after.weeks[w]  && C.after.weeks[w][d];
    const eq = dayDigest(b)===dayDigest(a);
    if(eq) same++; else rewritten++;
    if(!eq){
      console.log(`      w${w}_${d} CHANGED`);
      console.log(`        before: ${dayLine(b)}`);
      console.log(`        after : ${dayLine(a)}`);
    }
  });
});
console.log(`      => logged days byte-identical ${same}/${same+rewritten}, rewritten ${rewritten}/${same+rewritten}`);
// control: what would weeks 1-3 look like with NO logs at all (pure 5-week build)?
{
  const IA = mk();
  const clean = IA.buildProgram(baseCfg({_raceDateCappedWeeks:5}));
  let diff=0, tot=0;
  [1,2,3].forEach(w=>TRAIN.forEach(d=>{ tot++; if(dayDigest(clean.weeks[w][d])!==dayDigest(C.before.weeks[w][d])) diff++; }));
  console.log(`      CONTROL — unlogged 5-week build vs 11-week build, weeks 1-3: ${diff}/${tot} days DIFFER.`);
  console.log(`      (this is what the freeze is suppressing; without a log those days DO change)`);
}

// weeks 4-5: UNTRAINED, so live-rebuilt. This is where the PRT lands after compression.
console.log('\n  (c2) WEEKS 4-5 (untrained -> rebuilt live). PRT week under D106 = week 5.');
[4,5].forEach(w=>{
  TRAIN.forEach(d=>{
    const b = C.before.weeks[w] && C.before.weeks[w][d];
    const a = C.after.weeks[w]  && C.after.weeks[w][d];
    const eq = dayDigest(b)===dayDigest(a);
    console.log(`      w${w}_${d} ${eq?'same':'CHANGED'}`);
    if(!eq){ console.log(`        before: ${dayLine(b)}`); console.log(`        after : ${dayLine(a)}`); }
  });
});

// (d) freeze predicate
console.log('\n  (d) FREEZE PREDICATE (index.html:14580-14620), quoted:');
[14583,14584,14585,14586,14587,14601,14602,14603,14608,14609,14614,14615,14616,14617,14620,14621,14622].forEach(l=>console.log(`      ${l}: ${String(line(l)).trim()}`));

// (b) weeks 6-11: no logs there vs logs there
console.log('\n══ Q-D1b  WEEKS 6-11 ══');
{
  console.log('  case 1: nothing logged past week 3');
  console.log('    after.weeks keys =', Object.keys(C.after.weeks).sort((a,b)=>a-b).join(','),
              '| stored weeks 6-11 present in rebuild:', [6,7,8,9,10,11].filter(w=>C.after.weeks[w]).join(',')||'none');
  const C8 = compress([1,2,3,4,5,6,7,8]);
  console.log('  case 2: athlete further along — weeks 1-8 logged');
  console.log('    after.totalWeeks =', C8.after.totalWeeks, '| after.weeks keys =', Object.keys(C8.after.weeks).sort((a,b)=>a-b).join(','));
  const beyond = Object.keys(C8.after.weeks).map(Number).filter(w=>w>C8.after.totalWeeks);
  console.log('    week objects living ABOVE totalWeeks:', beyond.join(',')||'none', '=>', beyond.length, 'weeks');
  const cls8 = classify(C8), ex8 = exClassify(C8);
  console.log(`    ia_hist_: ${cls8.total} total | attached ${cls8.attached} | orphaned ${cls8.orphaned} | MISATTRIBUTED ${cls8.misattributed}`);
  console.log(`    ia_exw_ : ${ex8.tot} total | on card ${ex8.ok} | week gone ${ex8.noWeek} | exercise gone ${ex8.noEx}`);
  // what does the week renderer iterate?
  console.log('    renderers that bound the week list by totalWeeks:');
  [10476,10776,13974,15924].forEach(l=>console.log(`      index.html:${l}: ${String(line(l)).trim()}`));
}


// ── Q-D1b2: stores that make a week "touched". _touched reads ia_comp_ + ia_logs_ ONLY.
console.log('\n══ Q-D1e  WHICH STORE PROTECTS A WEEK? (freeze _touched source, index.html:14525-14527) ══');
[14525,14526,14527,14528,14529,14533,14537,14538,14539].forEach(l=>console.log(`    ${l}: ${String(line(l)).trim()}`));
[['hist+comp+logs+exw (normal)',null],
 ['exw ONLY (a load logged, no completion, no log field)',['exw']],
 ['hist ONLY (snapshot with no completion and no log)',['hist']],
 ['comp+logs, NO hist (legacy pre-V133 athlete)',['comp','logs','exw']]].forEach(([label,only])=>{
  const CC = compress([1,2,3], only);
  let same=0, ch=0; const changed=[];
  [1,2,3].forEach(w=>TRAIN.forEach(d=>{
    const b=CC.before.weeks[w][d], a=CC.after.weeks[w]&&CC.after.weeks[w][d];
    if(dayDigest(b)===dayDigest(a)) same++; else { ch++; changed.push('w'+w+'_'+d); }
  }));
  const e = exClassify(CC);
  console.log(`  ${label}`);
  console.log(`    weeks 1-3 logged days preserved ${same}/15, REWRITTEN ${ch}/15${ch?' -> '+changed.join(','):''}`);
  console.log(`    ia_exw_ entries ${e.tot} | exercise still on that card ${e.ok} | exercise GONE from that card ${e.noEx} | week gone ${e.noWeek}`);
});

console.log('\n══ Q-D1f  ATHLETE AT THE END: weeks 1-11 all logged, then compressed to 5 ══');
{
  const C11 = compress([1,2,3,4,5,6,7,8,9,10,11]);
  const keys = Object.keys(C11.after.weeks).map(Number).sort((a,b)=>a-b);
  console.log('    after.totalWeeks =', C11.after.totalWeeks, '| after.weeks keys =', keys.join(','));
  console.log('    week objects above totalWeeks:', keys.filter(w=>w>C11.after.totalWeeks).join(',')||'none');
  const c=classify(C11), e=exClassify(C11);
  console.log(`    ia_hist_ ${c.total} | attached ${c.attached} | orphaned ${c.orphaned} | misattributed ${c.misattributed}`);
  console.log(`    ia_exw_  ${e.tot} | on card ${e.ok} | exercise gone ${e.noEx} | week gone ${e.noWeek}`);
  console.log('    REACHABILITY of weeks 6-11 after compression — the week list is bounded by totalWeeks:');
  [10341,10476,10776,16511,14801,15019].forEach(l=>console.log(`      index.html:${l}: ${String(line(l)).trim().slice(0,140)}`));
  console.log('    calcCurrentWeek (index.html:10470-10478) clamps to totalWeeks:');
  [10474,10475,10476,10477].forEach(l=>console.log(`      ${l}: ${String(line(l)).trim()}`));
}

// ═══════════════════════════════════════════════════════════════════
// Q-D2  CALENDAR
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ Q-D2  CALENDAR ══');
console.log('  week->date mapping, index.html:10432-10436 (_progDayDate):');
[10432,10433,10434,10435,10436].forEach(l=>console.log(`    ${l}: ${String(line(l)).trim()}`));
console.log('  startDate carry-over, index.html:14454:', String(line(14454)).trim());
console.log(`  before.startDate = ${C.before.startDate}  after.startDate = ${C.after.startDate}  moved: ${C.before.startDate!==C.after.startDate}`);
let dateMoved=0, dateTot=0;
for(let w=1;w<=5;w++){
  TRAIN.forEach(d=>{
    dateTot++;
    const b = C.IA._progDayDate(C.before,w,d), a = C.IA._progDayDate(C.after,w,d);
    if(!b||!a||b.getTime()!==a.getTime()) dateMoved++;
  });
}
console.log(`  records in weeks 1-5 whose DISPLAYED DATE changes: ${dateMoved}/${dateTot}`);
console.log('  week -> ISO Monday, before and after:');
for(let w=1;w<=11;w++){
  const b = C.IA._progDayDate(C.before,w,'mon'), a = C.IA._progDayDate(C.after,w,'mon');
  console.log(`    w${String(w).padStart(2)}  before ${b?iso(b):'-'}  after ${a?iso(a):'-'}  ${w>5?'(week no longer in the program)':''}`);
}
const raceWeekBefore = Math.floor((parse(RACE)-parse(C.before.startDate))/D7/7)+1;
console.log(`  race ${RACE} falls in program week ${raceWeekBefore} in BOTH builds (dates are ordinal off startDate, which does not move)`);

// ═══════════════════════════════════════════════════════════════════
// Q-D3  BLAST DENOMINATOR
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ Q-D3  BLAST DENOMINATOR (NSW event-dated lattice) ══');
{
  const IA = mk();
  const GOALS = {
    run_pace_goal:{id:'run_pace_goal',label:'Pace',targetDist:'1.5',paceUnit:'mi',targetMins:'10',targetSecs:'30',targetTime:'10:30',mileBestMins:'8',mileBestSecs:'15',baselineDist:'3',baseline:'3mi'},
    run_mile_time:{id:'run_mile_time',label:'Mile',targetMins:'8',targetSecs:'15',targetTime:'8:15',mileBestMins:'9',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},
    run_15_under10:{id:'run_15_under10',label:'1.5u10',targetMins:'10',targetSecs:'0',targetTime:'10:00',mileBestMins:'8',mileBestSecs:'45',baselineDist:'3',baseline:'3mi'},
    run_base:{id:'run_base',label:'Base',targetDist:'5',baselineDist:'2',baseline:'2mi'},
  };
  const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','36-54','55+'];
  const OFFSETS=[14,21,28,35,42,56,70,84,112,140];   // days from today to the event
  const FOCI=['support_prevention','strength','hypertrophy','balanced'];
  const LENCACHE={};
  const dist={}, byGoal={}, byExp={}, byOff={};
  let n=0, changed=0, shrink=0, grow=0, unchanged=0; let shrinkSum=0, maxShrink=0;
  Object.keys(GOALS).forEach(g=>Object.keys(GOALS[g]).length&&EXPS.forEach(exp=>AGES.forEach(age=>FOCI.forEach(f=>OFFSETS.forEach(off=>{
    const race = iso(new Date(parse(TODAY).getTime()+off*D7));
    const goals = {run:Object.assign({},GOALS[g]), _experience:exp, _ageBracket:age, _eventTargeted:true};
    const ck = g+'|'+exp+'|'+age+'|'+f;
    if(!(ck in LENCACHE)) LENCACHE[ck] = IA.buildProgram(baseCfg({experience:exp, ageBracket:age, liftingFocus:f,
        cardioGoals:{run:Object.assign({},GOALS[g])}})).totalWeeks;
    const goalLen = LENCACHE[ck];
    const wOut = Math.floor((parse(race)-parse(TODAY))/D7/7);   // hand arithmetic
    const tw = Math.min(goalLen, wOut+1);
    const delta = tw - goalLen;
    n++;
    if(delta===0){unchanged++;} else if(delta<0){shrink++; shrinkSum+=-delta; maxShrink=Math.max(maxShrink,-delta);} else grow++;
    if(delta!==0) changed++;
    dist[delta]=(dist[delta]||0)+1;
    byGoal[g]=byGoal[g]||{n:0,ch:0}; byGoal[g].n++; if(delta!==0) byGoal[g].ch++;
    byExp[exp]=byExp[exp]||{n:0,ch:0}; byExp[exp].n++; if(delta!==0) byExp[exp].ch++;
    byOff[off]=byOff[off]||{n:0,ch:0,sum:0}; byOff[off].n++; if(delta!==0){byOff[off].ch++; byOff[off].sum+=-delta;}
  })))));
  console.log(`  lattice: ${n} configs (4 goals x 3 experience x 3 age x 4 focus x 10 event offsets)`);
  console.log(`  UNCHANGED ${unchanged}/${n} (${(100*unchanged/n).toFixed(1)}%) | SHRINK ${shrink}/${n} (${(100*shrink/n).toFixed(1)}%) | GROW ${grow}/${n}`);
  console.log(`  mean shrink among shrinkers ${shrink?(shrinkSum/shrink).toFixed(2):0} weeks | max shrink ${maxShrink} weeks`);
  console.log('  delta distribution (tw - goalLength):');
  Object.keys(dist).map(Number).sort((a,b)=>a-b).forEach(d=>console.log(`    ${d>0?'+':''}${d} weeks : ${dist[d]}/${n}`));
  console.log('  by goal:'); Object.keys(byGoal).forEach(k=>console.log(`    ${k.padEnd(16)} ${byGoal[k].ch}/${byGoal[k].n}`));
  console.log('  by experience:'); Object.keys(byExp).forEach(k=>console.log(`    ${k.padEnd(16)} ${byExp[k].ch}/${byExp[k].n}`));
  console.log('  by event offset (days out):');
  Object.keys(byOff).map(Number).sort((a,b)=>a-b).forEach(k=>console.log(`    ${String(k).padStart(4)}d  changed ${byOff[k].ch}/${byOff[k].n}  mean shrink ${byOff[k].ch?(byOff[k].sum/byOff[k].ch).toFixed(2):'0.00'}`));
  // validate calcProgramLength against buildProgram on a sample
  let vN=0, vOK=0;
  Object.keys(GOALS).forEach(g=>EXPS.forEach(exp=>{
    const cfg = baseCfg({experience:exp, cardioGoals:{run:Object.assign({},GOALS[g])}});
    const p = IA.buildProgram(cfg);
    const gl = IA.calcProgramLength(['run'],{run:Object.assign({},GOALS[g]),_experience:exp,_ageBracket:'18-35',_eventTargeted:true}, IA.LIFTING_FOCUS_TO_GOAL['support_prevention']).weeks;
    vN++; if(p.totalWeeks===gl) vOK++; else console.log(`    calcProgramLength DISAGREES with buildProgram: goal=${g} exp=${exp}: buildProgram=${p.totalWeeks} calcProgramLength=${gl}  (legacy goal ids alias to run_pace_goal inside buildProgram before length is taken)`);
  }));
  console.log(`  NOTE: goalLength in the lattice above is buildProgram().totalWeeks, NOT calcProgramLength().`);
  console.log(`  calcProgramLength() agreed with buildProgram() on only ${vOK}/${vN} sampled configs — it is not a safe oracle for legacy goal ids.`);
  console.log(`  raceDate independence check (length must not already depend on the date):`);
  const dA=IA.buildProgram(baseCfg({raceDate:'2026-10-05'})).totalWeeks, dB=IA.buildProgram(baseCfg({raceDate:'2027-06-01'})).totalWeeks;
  console.log(`    same cfg, race 2026-10-05 => ${dA} weeks ; race 2027-06-01 => ${dB} weeks ; date-independent: ${dA===dB}`);
}

// ═══════════════════════════════════════════════════════════════════
// Q-D4  PRIOR ART
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ Q-D4  PRIOR ART (see the shell block after this script for git/handoff greps) ══');
console.log('  in-artifact mechanisms that could serve a length change:');
const probes = ['MIGRATION','migrate','schemaVersion','ia_schema','purgeProgData','pruneSwaps','pruneDayEdits','_raceDateCappedWeeks','totalWeeks =','ia_ver'];
probes.forEach(p=>{
  const c=(raw.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;
  console.log(`    ${p.padEnd(24)} ${c}`);
});
console.log('  prune* signatures (the only existing "records above a cut" handlers):');
['function pruneSwaps','function pruneDayEdits'].forEach(f=>{
  const i = SRC.findIndex(l=>l.indexOf(f)>=0);
  if(i>=0) console.log(`    index.html:${i+1}: ${SRC[i].trim().slice(0,180)}`);
  else console.log(`    ${f}: NOT FOUND`);
});

console.log('\n══ Q-D1e2  IS exw-ONLY REACHABLE IN THE APP? (writers of each store) ══');
[[12936,'logExerciseWeight <- selectKBSize'],[13007,'logExerciseWeight <- the set logger'],
 [1236,'snapshotDay <- writeSetDraft (also writes ia_logs_)'],
 [13325,'snapshotDay <- toggleComplete (also writes ia_comp_)'],
 [13330,'snapshotDay <- markDayComplete (also writes ia_comp_)'],
 [13339,'snapshotDay <- handleDayStatus (also persistLogFields + ia_comp_)'],
 [13390,'persistLogFields -> ia_logs_'],
 [16635,'snapshotDay <- (see site)']].forEach(([l,w])=>console.log(`    index.html:${l}  ${w}\n        ${String(line(l)).trim().slice(0,150)}`));
console.log('    selectKBSize (index.html:12934-12938) writes ia_exw_ and NOTHING ELSE:');
[12934,12935,12936,12937].forEach(l=>console.log(`        ${l}: ${String(line(l)).trim()}`));

console.log('\n══ Q-D4  PRIOR ART — the handoff\'s own words ══');
console.log("  IRON_ASYLUM_HANDOFF_1_1.md:947 (D5, V145, RULED):");
console.log("    'program length is already pinned into cfg._raceDateCappedWeeks at wizard creation,");
console.log("     so a mid-program switch CAN NEVER MOVE totalWeeks'");
console.log("  IRON_ASYLUM_HANDOFF_1_1.md:928 (§12 parked): 'Goal changes stay a new program — program length");
console.log("     is goal-derived, so trained weeks aren\'t the right base'");
console.log('  => the one prior ruling that came near this DECLINED to move length, and named the pin as the reason.');
console.log('  no migration machinery exists: MIGRATION 0 / schemaVersion 0 / ia_schema 0 hits in index.html;');
console.log('  git log --all -i --grep=migrat returns 0 commits.');
console.log('  the only "records above a cut" handlers are pruneSwaps(pid,cutWeek) index.html:9281 and');
console.log('  pruneDayEdits(pid,cutWeek) index.html:9239 — neither touches ia_hist_/ia_logs_/ia_comp_/ia_exw_.');
console.log('  purgeProgData(id) index.html:14680 is all-or-nothing per program, not per week.');

console.log('\n══ DONE ══');
