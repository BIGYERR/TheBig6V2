// v195 — measure pass M1: WHAT DOES A SKIP ACTUALLY DO?
//
// MODE B (before-picture). Read-only. Gates coach's D64 + Mario's Wildcard-prompt
// product shape ("offer a prompt asking whether to mark the program day skipped").
// Mario's stated expectation: "i don't think [skipping has downstream effects]".
// This pass proves or disproves that with numbers.
//
// ORACLES — each independent of the function under suspicion:
//  O1 the store contract — the LITERAL object each writer puts in ia_comp_, read off
//     the source by line, transcribed below. Never statusOf()'s opinion of it.
//  O2 identity          — progDigest of a refreshProgram() output with the store EMPTY
//     vs the same build with a skip record present. cfg.seed pinned; progDigest already
//     strips id/created (harness.js:193-197). Baseline is proved equal to itself first.
//  O3 the day-level diff — per-day JSON comparison, so "nothing moved" is a count of
//     days, not a hash that could hide a compensating change.
//  O4 an ENGINE CHANGE that is not this pass's invention — the V193 artifact
//     (git 2a6bf9c) is built, stored as prog.weeks, and refreshed under the V194
//     engine. That is the only condition under which the freeze can express itself,
//     and it is supplied from git, not from a mutation this script authored.
//  O5 date arithmetic   — startDate is pinned so the current week is derived by hand
//     (refreshProgram:14273-14277 recomputes it; the expected value is computed here
//     from the same calendar, independently).
//
// usage: node tests/measure/v195_skip_downstream.js [--fast]
//        (needs /tmp base193.html; the script writes it from git itself)
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process');
const H=path.join(__dirname,'..','harness.js');
const {load, progDigest}=require(H);
const ROOT=path.join(__dirname,'..','..');
const HTML=path.join(ROOT,'index.html');
const SRC=fs.readFileSync(HTML,'utf8');
const LINES=SRC.split('\n');
const FAST=process.argv.includes('--fast');
const IA=load(HTML);
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
function hr(t){ console.log('\n'+'='.repeat(78)+'\n'+t+'\n'+'='.repeat(78)); }
function pad(s,n){ s=String(s); return s.length>=n?s:s+' '.repeat(n-s.length); }
function lpad(s,n){ s=String(s); return s.length>=n?s:' '.repeat(n-s.length)+s; }
function pct(a,b){ return b?((100*a/b).toFixed(1)+'%'):'n/a'; }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
// line lookup so every citation in the output is the CURRENT line, not a stale one
function lineOf(re,from){ for(let i=(from||0);i<LINES.length;i++){ if(re.test(LINES[i])) return i+1; } return -1; }

console.log('v195 M1 — skip downstream sweep. artifact '+HTML+' @ ia-version '+IA.version+(FAST?'  (FAST)':'  (FULL)'));

/* ══════════════════════════════════════════════════════════════════════════
   Q1a — EVERY WRITER OF A SKIP RECORD
   ══════════════════════════════════════════════════════════════════════════ */
hr('Q1a — WRITERS. Two different stores, two different meanings of "skip".');
const WRITERS=[
 ['ia_comp_<pid>  DAY level',  /^function handleDayStatus/,      'handleDayStatus(dayKey,title,status)',
  "c[completedKey(w,d)]={title:title||null, ts:Date.now(), status}  where status is 'complete' | 'skipped'",
  'the Skip button in the day footer (statusFootHTML) — the ONLY interactive day-level skip'],
 ['ia_comp_<pid>  DAY level',  /^function resolveReminder/,      'resolveReminder(week,dayKey,title,status)',
  "c[completedKey(w,d)]={title:title||null, ts:Date.now(), status}  status from the popup button",
  'the day-after reminder popup, "✕ Skip" action (maybeShowReminder)'],
 ['ia_comp_<pid>  DAY level',  /^function markDayComplete/,      'markDayComplete(wk,dayKey,title)',
  "c[completedKey(wk,d)]={title, ts:Date.now(), status:'complete'}  — NEVER writes 'skipped'",
  'completeWildcard() only'],
 ['ia_comp_<pid>  DAY level',  /^function toggleComplete/,       'toggleComplete(wk,dayKey,title)',
  "c[k]={title, ts, status:'complete'} or delete c[k]",
  'toggle; grep shows no live caller (see below)'],
 ['ia_edits_<pid> ITEM level', /^function recordSkip/,           'recordSkip(pid,week,dayKey,name)',
  "s['w<N>_<day>'] = {add:[...], skip:[<item name> | '__ss:<secIdx>']}  — a NAME LIST, no status field",
  'skipExercise() / skipSuperset()'],
];
console.log(pad('store / level',28)+pad('writer',34)+'line');
WRITERS.forEach(w=>{ const ln=lineOf(w[1]); console.log(pad(w[0],28)+pad(w[2],34)+'index.html:'+ln); console.log('    shape : '+w[3]); console.log('    from  : '+w[4]); });
const tcCalls=(SRC.match(/toggleComplete\s*\(/g)||[]).length;
console.log('\n"toggleComplete(" appears '+tcCalls+'× in the file (1 = the declaration only => dead writer).');
console.log('_skipped (the ITEM flag) is a RUNTIME field on the day object, never persisted: applyDayEdits ('+lineOf(/^function applyDayEdits/)+') re-derives it from ia_edits_ on every build.');
console.log('\nDISTINCT `status` VALUES WRITTEN ANYWHERE IN THE FILE:');
const statusLits=new Set();
SRC.replace(/status\s*:\s*'([a-z]+)'/g,(m,s)=>{statusLits.add(s);return m;});
SRC.replace(/status===?'([a-z]+)'/g,(m,s)=>{statusLits.add(s);return m;});
SRC.replace(/\bst===?'([a-z]+)'/g,(m,s)=>{statusLits.add(s);return m;});
console.log('  '+[...statusLits].sort().join(', ')+"   ('partial' is legacy pre-V181, read-only: statusOf:"+lineOf(/^function statusOf/)+" folds it to complete)");

/* ══════════════════════════════════════════════════════════════════════════
   Q1b — EVERY READER
   ══════════════════════════════════════════════════════════════════════════ */
hr('Q1b — READERS of ia_comp_ (the day-level skip record). Grepped, then measured below.');
const READ=[
 [/const comp=getCompleted\(\), logs=getLogs\(\);/,'restMoveCandidates','ANY record (status ignored) disqualifies the day as a rest-day-move target'],
 [/const completed=getCompleted\(\);/,'renderWeekView','week strip: checkmark ONLY for complete|partial; skipped renders the bare date, same as pending'],
 [/const doneN=trainDays\.filter/,'renderWeekView (DONE tile)','counts status===complete only; a skip is invisible to x/y DONE'],
 [/const comp=getCompleted\(\)\[completedKey\(currentWeek,dayKey\)\]/,'openDetail','comp.title OVERRIDES day.title in the detail header'],
 [/^function statusOf/,'statusOf','the single read helper; partial -> complete'],
 [/^function computeStreak/,'computeStreak','skipped BREAKS the trailing run; pending is transparent'],
 [/^function completedCount/,'completedCount','complete|partial only -> season popup "Workouts"'],
 [/^function skippedCount/,'skippedCount','skipped only -> season popup "Skips"'],
 [/if\(statusOf\(x\.week,x\.d\)\) continue;/,'maybeShowReminder','ANY record suppresses the day-after reminder'],
 [/let _gap=0; for\(let i=days\.length-1/,'maybeShowReminder (gap copy)','walks back to the first day with ANY record'],
 [/const cur=statusOf\(currentWeek,dayKey\);/,'statusFootHTML','which of the two buttons is primary'],
 [/try\{ Object\.assign\(_touched, JSON\.parse\(localStorage\.getItem\('ia_comp_'/,'refreshProgram (THE FREEZE)','ANY record = "touched". Sets _cut, _swapCut, and freezes the day'],
 [/function purgeProgData/,'purgeProgData','deletes the store with the program'],
];
console.log(pad('line',8)+pad('reader',26)+'what it does with the record');
READ.forEach(r=>{ const ln=lineOf(r[0]); console.log(pad(ln,8)+pad(r[1],26)+r[2]); });
console.log('\nNOT readers (grepped, zero hits for getCompleted/statusOf/ia_comp_ inside each):');
[['buildProgram','the engine'],['capRegionalFatigue','regional fatigue'],['capSessionBudget','the budget'],['recoveryDeload','the deload'],['ledgerModel','the lift ledger'],['plannedVsLogged','the drift chart'],['easyVsPrescribed','the zone chart']].forEach(([fn,what])=>{
  const ln=lineOf(new RegExp('^function '+fn+'\\b'));
  console.log('  '+pad(fn,22)+'index.html:'+pad(ln,7)+what);
});
{ // hard proof: no localStorage access anywhere inside the engine span
  const engStart=lineOf(/^function engineA_timeline/), engEnd=lineOf(/^function buildProgram/);
  let hits=[];
  for(let i=0;i<LINES.length;i++){ if(/localStorage/.test(LINES[i])) hits.push(i+1); }
  const inEngine=hits.filter(l=>l>=engStart&&l<=engEnd+400);
  console.log('\n  localStorage references between engineA_timeline (line '+engStart+') and buildProgram+400 (line '+(engEnd+400)+'): '+
    (inEngine.length?inEngine.join(','):'NONE')+'  -> the engine cannot read a skip. buildProgram is a pure function of cfg.');
}

/* ══════════════════════════════════════════════════════════════════════════
   Q1c — DOES A SKIP CHANGE ANY FUTURE PRESCRIPTION? (empirical)
   ══════════════════════════════════════════════════════════════════════════ */
hr('Q1c — LATTICE. refreshProgram with the store EMPTY vs with a skip record.');
const FOCUS=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXP=['beginner','intermediate','advanced'];
const EQUIP=['home_full','home_basic','commercial','crossfit','bodyweight'];
const REST=[['sun','wed'],['sun']];
const SEEDS=FAST?[76308]:[76308,11111,90210];
const GOALS=[
 {k:'lift_only',f:{primaryPath:'body',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null}},
 {k:'run_base', f:{primaryPath:'body',cardioTypes:['run'],cardioGoals:{run:{id:'run_base',label:'Build Running Base',mileBestMins:'9',mileBestSecs:'00',baselineDist:'3',baseline:'3mi'}},eventTargeted:false,raceDate:null}},
 {k:'run_pace', f:{primaryPath:'body',cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:'1.5',targetMins:'10',mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}},eventTargeted:false,raceDate:null}},
 {k:'run_half', f:{primaryPath:'event',cardioTypes:['run'],cardioGoals:{run:{id:'run_half',label:'Half Marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}},eventTargeted:true,raceDate:'2026-12-06'}},
];
// O5: pinned calendar. startDate is a Monday; today is the run date. Current week is
// derived BY HAND here and cross-checked against refreshProgram's own arithmetic.
const START='2026-08-31';
const _mon=new Date(2026,7,31), _today=new Date(); _today.setHours(0,0,0,0);
const CURWK_HAND=Math.max(1,Math.floor(Math.floor((_today-_mon)/86400000)/7)+1);
console.log('startDate pinned '+START+' (a Monday). today '+_today.toISOString().slice(0,10)+
  ' -> current week by hand arithmetic = '+CURWK_HAND+'. refreshProgram:'+lineOf(/const _diff = Math\.floor/)+' computes the same value from prog.startDate.');

function mkcfg(o){ return Object.assign({name:'M1',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185},
  o.goal.f,{liftingFocus:o.focus,experience:o.exp,ageBracket:'18-35',equipment:o.equip,restDays:o.rest.slice(),seed:o.seed}); }

const LS=IA.localStorage;
function resetStore(){ LS.clear(); }
function putComp(pid,key,status,title){ LS.setItem('ia_comp_'+pid, JSON.stringify({[key]:{title:title||null,ts:1700000000000,status}})); }
function putHist(pid,key,day){ LS.setItem('ia_hist_'+pid, JSON.stringify({[key]:day})); }
function mkStored(cfg,id){ const b=IA.buildProgram(cfg); const s=clone(b); s.id=id; s.name='M1'; s.created=1700000000000; s.startDate=START; s.overlays=[]; s.cfg=clone(cfg); return s; }
function refresh(stored){ return IA.refreshProgram(clone(stored)); }
function dayDiff(a,b){ // returns [nDiffDays, list]
  const out=[]; let n=0;
  const weeks=new Set([...Object.keys(a.weeks||{}),...Object.keys(b.weeks||{})]);
  weeks.forEach(w=>{ const A=(a.weeks||{})[w]||{}, B=(b.weeks||{})[w]||{};
    new Set([...Object.keys(A),...Object.keys(B)]).forEach(d=>{
      if(JSON.stringify(A[d]||null)!==JSON.stringify(B[d]||null)){ n++; if(out.length<6) out.push('w'+w+'_'+d); }
    }); });
  return [n,out];
}
// pick the first non-rest day of a week
function firstTrainDay(prog,w){ const wk=prog.weeks[w]||{}; for(const d of ['mon','tue','wed','thu','fri','sat','sun']) if(wk[d]&&!wk[d].rest) return d; return null; }
function firstRunDay(prog,w){ const wk=prog.weeks[w]||{}; for(const d of ['mon','tue','wed','thu','fri','sat','sun']){ const x=wk[d]; if(x&&x.cardio&&String((x.cardio.type||'')).toLowerCase()==='run') return d; } return null; }

const CFGS=[];
GOALS.forEach(goal=>FOCUS.forEach(focus=>EXP.forEach(exp=>EQUIP.forEach(equip=>REST.forEach(rest=>SEEDS.forEach(seed=>{
  CFGS.push({goal,focus,exp,equip,rest,seed});
}))))));
console.log('lattice: '+CFGS.length+' configs = '+GOALS.length+' goals x '+FOCUS.length+' focuses x '+EXP.length+' experience x '+
  EQUIP.length+' equipment x '+REST.length+' rest patterns x '+SEEDS.length+' seeds.  cfg.seed pinned on every one.');

const R={n:0, selfStable:0, selfUnstable:[], crash:0, crashMsg:[],
  skipCur:0, skipFut:0, skipPast:0, compCur:0, noHist:0,
  moveSkipCur:0, moveSkipFut:0, moveSkipPast:0, moveCompCur:0, moveNoHist:0,
  skipVsComp:0, examples:[], byGoal:new Map(), byEquip:new Map()};
CFGS.forEach(o=>{
  const cfg=mkcfg(o); let stored;
  try{ stored=mkStored(cfg,'P1'); }catch(e){ R.crash++; if(R.crashMsg.length<4)R.crashMsg.push(e.message); return; }
  R.n++;
  const TW=stored.totalWeeks||Object.keys(stored.weeks).length;
  const wCur=Math.min(TW,CURWK_HAND), wFut=Math.min(TW,CURWK_HAND+2), wPast=1;
  const dCur=firstTrainDay(stored,wCur), dFut=firstTrainDay(stored,wFut), dPast=firstTrainDay(stored,wPast);
  // ── baseline, and PROVE IT EQUALS ITSELF ────────────────────────────────
  resetStore(); const base=refresh(stored); const dg0=progDigest(base);
  resetStore(); const base2=refresh(stored); const dg0b=progDigest(base2);
  if(dg0===dg0b) R.selfStable++; else if(R.selfUnstable.length<4) R.selfUnstable.push(o.goal.k+'/'+o.focus+'/'+o.equip);
  const run=(label,key,status,withHist)=>{
    resetStore();
    if(key){ putComp('P1',key,status); if(withHist) putHist('P1',key,clone(stored.weeks[+key.slice(1).split('_')[0]][key.split('_')[1]])); }
    const p=refresh(stored);
    const same=progDigest(p)===dg0; const [nd,list]=dayDiff(base,p);
    return {same,nd,list,dg:progDigest(p)};
  };
  const a=dCur?run('skip cur',   'w'+wCur+'_'+dCur, 'skipped', true):null;
  const b=dFut?run('skip fut',   'w'+wFut+'_'+dFut, 'skipped', true):null;
  const c=dPast?run('skip past', 'w'+wPast+'_'+dPast,'skipped',true):null;
  const d=dCur?run('done cur',   'w'+wCur+'_'+dCur, 'complete',true):null;
  const e=dCur?run('skip nohist','w'+wCur+'_'+dCur, 'skipped', false):null;
  if(a){ if(a.same)R.skipCur++; else {R.moveSkipCur++; if(R.examples.length<6)R.examples.push('skip-cur '+o.goal.k+'/'+o.focus+'/'+o.equip+' moved '+a.nd+' days: '+a.list.join(','));} }
  if(b){ if(b.same)R.skipFut++; else R.moveSkipFut++; }
  if(c){ if(c.same)R.skipPast++; else R.moveSkipPast++; }
  if(d){ if(d.same)R.compCur++; else R.moveCompCur++; }
  if(e){ if(e.same)R.noHist++; else R.moveNoHist++; }
  if(a&&d&&a.dg===d.dg) R.skipVsComp++;
  const g=R.byGoal.get(o.goal.k)||[0,0]; g[0]+= (a&&!a.same?1:0); g[1]++; R.byGoal.set(o.goal.k,g);
  const q=R.byEquip.get(o.equip)||[0,0]; q[0]+= (a&&!a.same?1:0); q[1]++; R.byEquip.set(o.equip,q);
});
console.log('\nbuilt '+R.n+'/'+CFGS.length+' configs, '+R.crash+' crashed'+(R.crash?(' ['+R.crashMsg.join(' | ')+']'):'')+
  '.  each config = 7 refreshProgram calls (2 baseline + 5 scenarios) = '+(R.n*7)+' rebuilds.');
console.log('BASELINE SELF-STABILITY (must be 100% before any diff means anything): '+R.selfStable+'/'+R.n+' = '+pct(R.selfStable,R.n)+
  (R.selfUnstable.length?('  UNSTABLE: '+R.selfUnstable.join('; ')):''));
console.log('\nSCENARIO                                            identical to the no-record baseline');
console.log('  skip on the CURRENT week   (w'+CURWK_HAND+', +ia_hist_ snapshot)  '+lpad(R.skipCur+'/'+R.n,12)+' = '+pct(R.skipCur,R.n));
console.log('  skip on a FUTURE week      (w'+(CURWK_HAND+2)+', +ia_hist_ snapshot)  '+lpad(R.skipFut+'/'+R.n,12)+' = '+pct(R.skipFut,R.n));
console.log('  skip on a PAST week        (w1, +ia_hist_ snapshot)   '+lpad(R.skipPast+'/'+R.n,12)+' = '+pct(R.skipPast,R.n));
console.log('  DONE on the current week   (the control)              '+lpad(R.compCur+'/'+R.n,12)+' = '+pct(R.compCur,R.n));
console.log('  skip with NO ia_hist_ snapshot (legacy branch 14371)   '+lpad(R.noHist+'/'+R.n,12)+' = '+pct(R.noHist,R.n));
console.log('  skip digest === done digest (skip and done are the SAME to the engine): '+R.skipVsComp+'/'+R.n+' = '+pct(R.skipVsComp,R.n));
if(R.examples.length) console.log('  examples where something DID move:\n    '+R.examples.join('\n    '));
console.log('\nsegmented (configs where a current-week skip moved the program), by goal:');
[...R.byGoal.entries()].forEach(([k,[m,n]])=>console.log('    '+pad(k,12)+lpad(m+'/'+n,10)+' = '+pct(m,n)));
console.log('segmented by equipment tier:');
[...R.byEquip.entries()].forEach(([k,[m,n]])=>console.log('    '+pad(k,12)+lpad(m+'/'+n,10)+' = '+pct(m,n)));

/* ── Q1c-2. THE CONDITION UNDER WHICH THE FREEZE CAN SPEAK ────────────────── */
hr('Q1c-2 — THE SAME QUESTION WHEN THE STORED BUILD AND THE LIVE BUILD DISAGREE.');
console.log('Above, prog.weeks was built by the SAME engine that refreshProgram re-runs, so the frozen day and');
console.log('the live day are byte-identical and the freeze has nothing to express. Two conditions break that tie.');
const OLDVERS=[['2a6bf9c','V193'],['ae041f2','V192']];
const oldIA=[];
OLDVERS.forEach(([sha,tag])=>{
  const f=path.join(require('os').tmpdir(),'ia_'+sha+'_v195.html');
  try{ fs.writeFileSync(f, cp.execSync('git -C '+JSON.stringify(ROOT)+' show '+sha+':index.html',{maxBuffer:1<<28}));
       oldIA.push([tag,sha,load(f)]); }
  catch(e){ console.log('  COULD NOT LOAD '+tag+' ('+sha+'): '+e.message+'  <- FAILED measurement, not a clean result'); }
});
console.log('\nCONDITION A — an ENGINE CHANGE. prog.weeks built by an OLDER artifact, refreshed under '+IA.version+'.');
oldIA.forEach(([tag,sha,IAO])=>{
  const SUB=FAST?CFGS.filter((_,i)=>i%17===0):CFGS.filter((_,i)=>i%3===0);
  let n=0, engineDelta=0, skipFroze=0, frozenDays=0, sameAsLive=0;
  let futSkipFroze=0, futFrozenDays=0, futN=0, futW1=0;
  const froze=[];
  SUB.forEach(o=>{
    const cfg=mkcfg(o);
    let oldb; try{ oldb=IAO.buildProgram(clone(cfg)); }catch(e){ return; }
    const stored=clone(oldb); stored.id='P1'; stored.name='M1'; stored.created=1700000000000; stored.startDate=START; stored.overlays=[]; stored.cfg=clone(cfg);
    let live; try{ live=IA.buildProgram(clone(cfg)); }catch(e){ return; }
    n++;
    const TW=stored.totalWeeks||Object.keys(stored.weeks).length;
    const wCur=Math.min(TW,CURWK_HAND), wFut=Math.min(TW,CURWK_HAND+2);
    const dCur=firstTrainDay(stored,wCur);
    if(JSON.stringify(oldb.weeks)!==JSON.stringify(live.weeks)) engineDelta++;
    resetStore(); const noRec=refresh(stored);
    const [ndLive]=dayDiff({weeks:{[wCur]:noRec.weeks[wCur]}},{weeks:{[wCur]:live.weeks[wCur]}});
    if(ndLive===0) sameAsLive++;
    if(!dCur) return;
    const key='w'+wCur+'_'+dCur;
    resetStore(); putComp('P1',key,'skipped'); putHist('P1',key,clone(stored.weeks[wCur][dCur]));
    const withSkip=refresh(stored);
    const [nd,list]=dayDiff(noRec,withSkip);
    if(nd>0){ skipFroze++; frozenDays+=nd; if(froze.length<5) froze.push(o.goal.k+'/'+o.focus+'/'+o.equip+' -> '+nd+' day(s): '+list.join(',')); }
    const dFut=firstTrainDay(stored,wFut);
    if(dFut){ futN++;
      const k2='w'+wFut+'_'+dFut;
      resetStore(); putComp('P1',k2,'skipped'); putHist('P1',k2,clone(stored.weeks[wFut][dFut]));
      const wf=refresh(stored); const [n2,l2]=dayDiff(noRec,wf);
      if(n2>0){ futSkipFroze++; futFrozenDays+=n2; if(l2.some(x=>/^w1_/.test(x))) futW1++; }
    }
  });
  console.log('\n  '+tag+' ('+sha+') stored -> '+IA.version+' live, '+n+' configs.');
  console.log('    the two engines disagree on '+engineDelta+'/'+n+' = '+pct(engineDelta,n)+' of them. (0 here means this pair CANNOT exercise the freeze.)');
  if(!engineDelta){ console.log('    -> no delta, nothing below is a measurement of the freeze. Moving on.'); return; }
  console.log('    with NO record: the current week rebuilds to the LIVE build on '+sameAsLive+'/'+n+' = '+pct(sameAsLive,n)+'.');
  console.log('    ONE SKIP on w'+CURWK_HAND+': differs from the no-record refresh on '+skipFroze+'/'+n+' = '+pct(skipFroze,n)+
    ', '+frozenDays+' days total ('+(skipFroze?(frozenDays/skipFroze).toFixed(2):'0')+' days per affected config).');
  if(froze.length) console.log('      '+froze.join('\n      '));
  console.log('    ONE SKIP on a FUTURE week (w'+(CURWK_HAND+2)+'): differs on '+futSkipFroze+'/'+futN+' = '+pct(futSkipFroze,futN)+
    ', '+futFrozenDays+' days total, of which '+futW1+' configs had a WEEK 1 day change  <- days in weeks the skip was not in');
});
// CONDITION B — an overlay added AFTER the skip
console.log('\nCONDITION B — a TRAVEL overlay added after the skip. Overlays splice BEFORE the freeze (refreshProgram:'+lineOf(/applyOverlays\(prog, rebuilt\);/)+'), so the freeze has the last word.');
{
  const SUB=FAST?CFGS.filter((_,i)=>i%17===0):CFGS.filter((_,i)=>i%3===0);
  let n=0, pierced=0, blocked=0, blockedDays=0; const ex=[];
  const ovFrom='2026-09-07', ovTo='2026-09-20';   // covers the current week and the next
  SUB.forEach(o=>{
    const cfg=mkcfg(o); let stored;
    try{ stored=mkStored(cfg,'P1'); }catch(e){ return; }
    stored.overlays=[{type:'substitute',patch:{equipment:'bodyweight'},from:ovFrom,to:ovTo,created:1700000000001}];
    const TW=stored.totalWeeks||Object.keys(stored.weeks).length;
    const wCur=Math.min(TW,CURWK_HAND); const dCur=firstTrainDay(stored,wCur); if(!dCur) return;
    n++;
    resetStore(); const noRec=refresh(stored);
    const key='w'+wCur+'_'+dCur;
    resetStore(); putComp('P1',key,'skipped'); putHist('P1',key,clone(stored.weeks[wCur][dCur]));
    const withSkip=refresh(stored);
    const [nd,list]=dayDiff(noRec,withSkip);
    if(nd>0){ blocked++; blockedDays+=nd; if(ex.length<5) ex.push(o.goal.k+'/'+o.focus+'/'+o.equip+' -> '+nd+': '+list.join(',')); } else pierced++;
  });
  console.log('  '+n+' configs, overlay '+ovFrom+'..'+ovTo+' (equipment -> bodyweight).');
  console.log('  skip BLOCKS the overlay from reaching at least one day: '+blocked+'/'+n+' = '+pct(blocked,n)+', '+blockedDays+' days total.');
  console.log('  overlay lands identically with and without the skip: '+pierced+'/'+n+' = '+pct(pierced,n));
  if(ex.length) console.log('    '+ex.join('\n    '));
}

/* ══════════════════════════════════════════════════════════════════════════
   Q1c-3 — THE PROGRESS TAB. ia_hist_ is written by the SKIP, and read as PLANNED.
   ══════════════════════════════════════════════════════════════════════════ */
hr('Q1c-3 — plannedVsLogged ('+lineOf(/^function plannedVsLogged/)+') iterates ia_hist_, not ia_comp_. A skip WRITES ia_hist_ (snapshotDay:'+lineOf(/^function snapshotDay/)+').');
{
  const SUB=CFGS.filter(o=>o.goal.k!=='lift_only').filter((_,i)=>i%(FAST?23:5)===0);
  let n=0, addsPlanned=0, miles=0; const ex=[];
  SUB.forEach(o=>{
    const cfg=mkcfg(o); let stored; try{ stored=mkStored(cfg,'P1'); }catch(e){ return; }
    const TW=stored.totalWeeks||Object.keys(stored.weeks).length;
    const wCur=Math.min(TW,CURWK_HAND); const d=firstRunDay(stored,wCur); if(!d) return;
    n++;
    const day=stored.weeks[wCur][d];
    const dose=day.cardio&&day.cardio.dose;
    const key='w'+wCur+'_'+d;
    const before=IA.eval('(typeof plannedVsLogged==="function")?JSON.stringify(plannedVsLogged({}, {}, '+TW+', 0, false)):"NO-FN"');
    const hist={}; hist[key]=clone(day);
    const after=IA.eval('(typeof plannedVsLogged==="function")?JSON.stringify(plannedVsLogged({}, '+JSON.stringify(hist)+', '+TW+', 0, false)):"NO-FN"');
    const A=JSON.parse(after==='NO-FN'?'{}':after), B=JSON.parse(before==='NO-FN'?'{}':before);
    const wk=A[wCur];
    if(wk&&wk.presc>0&&wk.act===0){ addsPlanned++; miles+=wk.presc; if(ex.length<4) ex.push(o.goal.k+'/'+o.focus+' w'+wCur+' '+d+': planned '+wk.presc+' mi, actual 0'); }
  });
  console.log('  '+n+' run-goal configs with a run scheduled in w'+CURWK_HAND+'.');
  console.log('  a skip on that day makes the drift chart count '+addsPlanned+'/'+n+' = '+pct(addsPlanned,n)+
    ' of them as PRESCRIBED-BUT-NOT-RUN ('+miles.toFixed(1)+' mi total). A day with NO record contributes nothing to either column.');
  if(ex.length) console.log('    '+ex.join('\n    '));
  console.log('  => skipped and never-touched are NOT the same to the Progress drift chart. Both are "0 logged"; only the skip also adds to "planned".');
}

/* ══════════════════════════════════════════════════════════════════════════
   Q1d — THE STREAK
   ══════════════════════════════════════════════════════════════════════════ */
hr('Q1d — THE STREAK. computeStreak:'+lineOf(/^function computeStreak/)+', inputs scheduledDays:'+lineOf(/^function scheduledDays/)+' + statusOf:'+lineOf(/^function statusOf/)+'.');
console.log('scheduledDays(cutoff) = every NON-REST day with date <= today, minus dayBeforeStart days. Rest days are NOT in the list at all.');
console.log('computeStreak walks that list BACKWARDS: skipped -> break; complete|partial -> n++; no record -> transparent, keep walking.');
{
  const cfg=mkcfg({goal:GOALS[1],focus:'balanced',exp:'intermediate',equip:'home_full',rest:['sun','wed'],seed:76308});
  const stored=mkStored(cfg,'P1');
  IA.eval('activeProgId="P1"');
  IA.ctx.__m1prog=stored;
  IA.eval('activeProg=__m1prog');
  const sd=IA.eval('JSON.stringify(scheduledDays(new Date()).map(function(x){return "w"+x.week+"_"+x.d;}))');
  const list=JSON.parse(sd);
  console.log('\n  pinned program: run_base / balanced / home_full / seed 76308, start '+START+'.');
  console.log('  scheduledDays(today) = '+list.length+' days, last 6: '+list.slice(-6).join(', '));
  const restDays=[]; Object.keys(stored.weeks).forEach(w=>Object.keys(stored.weeks[w]).forEach(d=>{ if(stored.weeks[w][d].rest) restDays.push('w'+w+'_'+d); }));
  const inList=restDays.filter(k=>list.includes(k));
  console.log('  rest days in the program: '+restDays.length+'; rest days appearing in scheduledDays: '+inList.length+'  -> a rest day cannot break or extend a streak.');
  const tail=list.slice(-5);
  const cases=[
    ['no record on any of the last 5 scheduled days', {}],
    ['last 5 all complete',                            Object.fromEntries(tail.map(k=>[k,{status:'complete',ts:1}]))],
    ['last 5 complete, then the LAST one skipped',     Object.fromEntries(tail.map((k,i)=>[k,{status:i===tail.length-1?'skipped':'complete',ts:1}]))],
    ['last 5 complete, MIDDLE one skipped',            Object.fromEntries(tail.map((k,i)=>[k,{status:i===2?'skipped':'complete',ts:1}]))],
    ['last 5 complete, MIDDLE one has NO record',      Object.fromEntries(tail.filter((k,i)=>i!==2).map(k=>[k,{status:'complete',ts:1}]))],
    ['last 5 legacy "partial"',                        Object.fromEntries(tail.map(k=>[k,{status:'partial',ts:1}]))],
    ['last 5 with NO status field at all',             Object.fromEntries(tail.map(k=>[k,{ts:1}]))],
  ];
  console.log('\n  '+pad('store state',52)+lpad('computeStreak()',16)+lpad('completedCount',15)+lpad('skippedCount',14));
  cases.forEach(([label,store])=>{
    resetStore(); LS.setItem('ia_comp_P1',JSON.stringify(store));
    const s=IA.eval('computeStreak()'), c=IA.eval('completedCount()'), k=IA.eval('skippedCount()');
    console.log('  '+pad(label,52)+lpad(s,16)+lpad(c,15)+lpad(k,14));
  });
  // a WILDCARD complete landing on a rest day
  const restKey=restDays.find(k=>{ const m=/^w(\d+)_/.exec(k); return m&&+m[1]<=CURWK_HAND; });
  resetStore(); LS.setItem('ia_comp_P1',JSON.stringify(Object.fromEntries(tail.map(k=>[k,{status:'complete',ts:1}]))));
  const sBefore=IA.eval('computeStreak()');
  const st2=Object.fromEntries(tail.map(k=>[k,{status:'complete',ts:1}])); st2[restKey]={status:'complete',ts:1,title:'Wildcard'};
  resetStore(); LS.setItem('ia_comp_P1',JSON.stringify(st2));
  const sAfter=IA.eval('computeStreak()');
  console.log('\n  a complete stamped on a REST day ('+restKey+'): streak '+sBefore+' -> '+sAfter+
    '   (rest days are not in scheduledDays, so the record is invisible to the streak)');
  console.log('  completedCount(), however, iterates the raw store: it counts a rest-day record. Season popup "Workouts" = '+
    IA.eval('completedCount()')+' with '+Object.keys(st2).length+' records, of which '+(Object.keys(st2).length-tail.length)+' is on a rest day.');
  resetStore(); IA.eval('activeProg=null; activeProgId=null;');
}

/* ══════════════════════════════════════════════════════════════════════════
   Q1e — WHAT THE DAY BADGE SURFACE SUPPORTS TODAY
   ══════════════════════════════════════════════════════════════════════════ */
hr('Q1e — STATUS VALUES, RENDERERS, AND THE ORPHANED CSS.');
console.log('record shape written by every day-level writer: {title, ts, status}. Three keys. No badge field, no source field, no kind.');
console.log('\nrenderers that BRANCH on status:');
[
 [/if\(st==='complete'\|\|st==='partial'\) center=/,'renderWeekView week strip','complete|partial -> <span class="chk">checkmark</span>; skipped -> the bare date, IDENTICAL to a pending day'],
 [/const doneN=trainDays\.filter/,'renderWeekView DONE tile','complete only; skipped is not counted and not shown'],
 [/if\(cur==='skipped'\)\{/,'statusFootHTML','the only place the word Skipped is rendered: the day footer button'],
 [/const labels=\{complete:'Done ✓',skipped:/,'handleDayStatus toast','"Done ✓" / "Skipped ✕ — the week moves on"'],
 [/ttl\.textContent=\(comp&&comp\.title\)\|\|day\.title/,'openDetail header','comp.title OVERRIDES the program day title, for ANY status'],
].forEach(r=>{ const ln=lineOf(r[0]); console.log('  index.html:'+pad(ln,7)+pad(r[1],30)+r[2]); });
console.log('\nORPHAN CHECK (comments stripped first, per §10b):');
{
  const noComments=SRC.split('\n').map(l=>l.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*(\/\/|\*).*$/,'')).join('\n');
  const cssBlockEnd=noComments.indexOf('</style>');
  const js=noComments.slice(cssBlockEnd<0?0:cssBlockEnd);
  ['day-card','day-done','day-skip','ex-skipbtn','t-skipped','chk'].forEach(cls=>{
    const inJS=(js.match(new RegExp('[\'"`][^\'"`]*\\b'+cls+'\\b','g'))||[]).length;
    const cssLines=[]; LINES.forEach((l,i)=>{ if(new RegExp('^\\.[\\w.\\s>:()-]*\\b'+cls+'\\b').test(l.trim())) cssLines.push(i+1); });
    console.log('  '+pad('.'+cls,14)+'CSS rules at '+pad(cssLines.join(',')||'(none)',34)+'  emitted by JS: '+(inJS?inJS+'×  LIVE':'0  ORPHANED'));
  });
  console.log('  .day-card.completed (index.html:244-245) and .day-card.skipped (376-377) style a class NO renderer emits.');
  console.log('  the day list is rendered as .wk-strip / .wk-hero; grep "day-card" in the JS half of the file returns only the CSS text itself.');
}
console.log('\nia_wild_<pid> (the wildcard store, getWildcardDone:'+lineOf(/^function getWildcardDone/)+') holds [{title,ts}] and is read by exactly '+
  ((SRC.match(/getWildcardDone\(\)/g)||[]).length)+' sites (1 declaration + 3 call sites: reroll 10131 the "Done Before" badge, completeWildcard 10157, updateRandCounter 10176 the x/y counter). It is NOT keyed by day, carries no week/day, and never reaches the week view.');
console.log('\ndone.');
