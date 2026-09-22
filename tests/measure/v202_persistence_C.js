// V202 measure pass 4C — ARCHITECTURE + THE SAME-LENGTH CASE.
// Read-only. Question: what happens to an already-running program when the engine
// changes under it, when the week COUNT does not change (V202 D100/D101 move paces).
//
// Oracles (never the suspect function):
//   * invariant text in CLAUDE.md, checked against index.html line numbers
//   * hand arithmetic for the pace delta string: |logged_sec - tgt_sec|, formatted by
//     the V191 D40 rule (<60 => "Ns/mi", >=60 => "m:ss/mi"), computed in THIS file
//     independently of updateDoseDerived
//   * deep JSON equality of a day object against its own ia_hist_ snapshot
//
// STUBS DECLARED: harness localStorage is a Map-backed stub (tests/harness.js:60-71);
// it persists inside one VM. A "reload" here = copy that Map into a FRESH VM booted
// from the other artifact, then call the app's own boot-path function refreshProgram().
// document.getElementById is wrapped (not replaced) so the app's real log form writers
// (buildLogHTML -> persistLogFields) read values we set. Every write to storage goes
// through an app function: savePrograms, setActiveProgId, snapshotDay, persistLogFields,
// markDayComplete/saveCompleted, logExerciseWeight. No key is hand-forged.

const path=require('path'), fs=require('fs');
const { load } = require(path.join(__dirname,'..','harness.js'));

const ROOT = path.join(__dirname,'..','..');
const V201 = path.join(ROOT,'index.html');
const SCRATCH = process.env.SCR || '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1580846a-7cbc-414f-9eda-cd358cd095ca/scratchpad';
const SURG = path.join(SCRATCH,'surgAB.html');

const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const fmt = s => Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');

// ─── ORACLE: the V191 D40 delta string, reimplemented from the doctrine of the rule,
// not from updateDoseDerived. index.html:12334 is the SUSPECT; this is the instrument.
function oracleDelta(loggedSec, tgtSec){
  if(!(tgtSec>0)||!(loggedSec>0)) return '(no target)';
  const df=Math.round(loggedSec-tgtSec), ad=Math.abs(df);
  if(ad<5) return 'on target';
  const mag = ad<60 ? (ad+'s/mi') : (Math.floor(ad/60)+':'+String(ad%60).padStart(2,'0')+'/mi');
  return mag+' '+(df<0?'faster than target':'slower than target');
}

// ─── the pinned reporter config (v202_run_path_A.js) ───
const SEED=24865, RACE='2026-10-19';
const base = over => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:RACE,
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs',
  restDays:['sun','wed'], days:DAYS.slice(),
  bench:185, squat:245, deadlift:315, seed:SEED,
}, over||{});
const paceGoal = o => ({run:Object.assign({id:'run_pace_goal',label:'Hit a Pace / Time Goal',
  targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, baselineDist:'3', baseline:'3mi'}, o||{})});
const PRT = base({cardioGoals:paceGoal()});

// ─── VM helpers: wrap getElementById so the real form writers work ───
function armForm(IA){
  IA.eval(`
    globalThis.__FORM = Object.create(null);
    (function(){
      var _g = document.getElementById;
      document.getElementById = function(id){
        if(globalThis.__FORM[id]) return globalThis.__FORM[id];
        return _g.call(document, id);
      };
    })();
    globalThis.__setField = function(id,val){
      globalThis.__FORM[id] = { id:id, value:String(val), innerHTML:'', textContent:'', style:{}, dataset:{},
        classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},
        addEventListener:function(){}, removeEventListener:function(){}, setAttribute:function(){},
        getAttribute:function(){return null;}, appendChild:function(c){return c;},
        querySelector:function(){return null;}, querySelectorAll:function(){return [];} };
    };
    globalThis.__clearFields = function(){ globalThis.__FORM = Object.create(null); };
  `);
}
const dump = IA => { const o={}; IA.localStorage._map.forEach((v,k)=>{o[k]=v;}); return o; };
const restore = (IA,o) => { IA.localStorage.clear(); Object.keys(o).forEach(k=>IA.localStorage.setItem(k,o[k])); };

// ─── install a program through the app's own creation writers ───
function install(IA,cfg){
  IA.eval('globalThis.__cfg = '+JSON.stringify(cfg)+';');
  return IA.eval(`(function(){
    var prog = buildProgram(__cfg);
    try{ _applyWizardStart(prog, __cfg); }catch(e){}
    savePrograms([prog]); setActiveProgId(prog.id);
    activeProgId = prog.id; activeProg = prog; currentWeek = 1;
    return { id:prog.id, totalWeeks:prog.totalWeeks, startDate:prog.startDate };
  })()`);
}

// first run session of each week, as the LIVE card sees it
function runDaysOf(IA, weeksLo, weeksHi){
  return IA.eval(`(function(){
    var out=[]; var W=activeProg.weeks||{};
    for(var w=${weeksLo}; w<=${weeksHi}; w++){
      var wk=W[w]; if(!wk) continue;
      ${JSON.stringify(DAYS)}.forEach(function(d){
        var day=wk[d]; if(!day) return;
        var c=day.cardio; if(!c) return; c=Array.isArray(c)?c[0]:c;
        if(!c || String(c.type||'').toLowerCase()!=='run') return;
        var dose = doseFromCardio(c);
        out.push({w:w,d:d,title:day.title||'',subtype:c.subtype||'',detail:c.detail||'',
                  dose:dose?JSON.parse(JSON.stringify(dose)):null,
                  lifts:(function(){var L=[];(day.sections||[]).forEach(function(sec){(sec.items||sec.exercises||[]).forEach(function(x){if(x&&x.name)L.push(x.name);});});return L;})()});
      });
    }
    return out;
  })()`);
}

// LOG a run day through buildLogHTML -> persistLogFields (the real path).
// Entered values are chosen so the derived pace lands EXACTLY on the old target:
// "the athlete was on target" is the crisp before-picture for the re-grade question.
function logRunDay(IA, rd){
  const dose=rd.dose; if(!dose) return null;
  let fields={log_rpe:'6', log_notes:''}, expectSec=null;
  if(dose.k==='time' && dose.tgt>0){ expectSec=dose.tgt; fields.log_run_mins=String(dose.mins); fields.log_run_dist=(dose.mins*60/dose.tgt).toFixed(2); }
  else if(dose.k==='dist' && dose.tgt>0){ expectSec=dose.tgt; fields.log_run_dist=String(dose.mi); fields.log_run_mins=(dose.mi*dose.tgt/60).toFixed(2); }
  else if(dose.k==='reps_dist' && dose.tgt>0){ expectSec=dose.tgt; fields.log_run_reps=String(dose.reps); fields.log_run_rep_time=fmt(dose.tgt*(dose.m/1609.34)); }
  else if(dose.k==='reps_time' && dose.tgt>0){ expectSec=dose.tgt; fields.log_run_reps=String(dose.reps); fields.log_run_dist=(dose.reps*dose.mins*60/dose.tgt).toFixed(2); }
  else return null;
  IA.eval('globalThis.__F='+JSON.stringify(fields)+';');
  const res = IA.eval(`(function(){
    currentWeek=${rd.w}; currentDayKey=${JSON.stringify(rd.d)};
    var day=activeProg.weeks[${rd.w}][${JSON.stringify(rd.d)}];
    var c=day.cardio; c=Array.isArray(c)?c[0]:c;
    __clearFields();
    buildLogHTML(${JSON.stringify(rd.d)}, c);          // sets _curLogDose off the LIVE card
    Object.keys(__F).forEach(function(k){ __setField(k,__F[k]); });
    persistLogFields(${JSON.stringify(rd.d)});          // snapshotDay + saveLogs
    try{ markDayComplete(${rd.w},${JSON.stringify(rd.d)},day.title||''); }
    catch(e){ snapshotDay(${rd.w},${JSON.stringify(rd.d)});
              var cc=getCompleted(); cc[completedKey(${rd.w},${JSON.stringify(rd.d)})]={title:day.title||'',ts:Date.now(),status:'complete'}; saveCompleted(cc); }
    var e=getLogs()[logKey(${rd.w},${JSON.stringify(rd.d)})]||{};
    return { run_pace:e.run_pace||'', run_dist:e.run_dist||'', run_mins:e.run_mins||'' };
  })()`);
  return Object.assign({expectSec}, res);
}

function logLifts(IA, rd){
  return IA.eval(`(function(){
    currentWeek=${rd.w}; currentDayKey=${JSON.stringify(rd.d)};
    var n=0; ${JSON.stringify(rd.lifts.slice(0,3))}.forEach(function(nm,i){
      logExerciseWeight(nm, 135+i*20, '3x5', ${rd.w}, [5,5,5], [135+i*20,135+i*20,135+i*20], ${JSON.stringify(rd.d)}); n++; });
    return n;
  })()`);
}

// ─── the "reload" ───
function reboot(htmlPath, store){
  const IA = load(htmlPath); armForm(IA); restore(IA, store);
  const info = IA.eval(`(function(){
    var progs=getPrograms(); var aid=getActiveProgId();
    var stored=progs.find(function(p){return p.id===aid;})||progs[0];
    activeProgId=stored.id;
    activeProg=refreshProgram(stored);
    currentWeek=calcCurrentWeek();
    return { storedHasWeeks: !!(stored.weeks&&Object.keys(stored.weeks).length),
             storedWeekCount: stored.weeks?Object.keys(stored.weeks).length:0,
             liveWeekCount: activeProg.weeks?Object.keys(activeProg.weeks).length:0,
             totalWeeks: activeProg.totalWeeks, currentWeek: currentWeek };
  })()`);
  return {IA, info};
}

function cardsOf(IA){
  return IA.eval(`(function(){
    var out={}; var W=activeProg.weeks||{};
    Object.keys(W).forEach(function(w){ Object.keys(W[w]).forEach(function(d){
      out['w'+w+'_'+d]=JSON.parse(JSON.stringify(W[w][d])); }); });
    return out;
  })()`);
}
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

// ═══════════════════════════════════════════════════════════════════════════
console.log('=== V202 measure 4C — persistence / same-length case ===');
if(!fs.existsSync(SURG)){ console.log('FATAL: surgAB.html missing at '+SURG); process.exit(3); }

// ── Q-C1 storage inventory (static, from the artifact) ──
const html = fs.readFileSync(V201,'utf8');
const KEYS = [
  ['ia_programs','savePrograms:1186','getPrograms:1185','GRID: the whole built program INCLUDING prog.weeks (created 6634, re-written 1385/13483/13495)'],
  ['ia_active','setActiveProgId:1188','getActiveProgId:1187','pointer only'],
  ['ia_logs_<pid>','saveLogs:1197 (persistLogFields:13386, writeSetDraft, applyRestCardio)','getLogs:1189/getLogsFor:1193','athlete-entered'],
  ['ia_comp_<pid>','saveCompleted:1199','getCompleted:1198','athlete-entered (status+title)'],
  ['ia_hist_<pid>','saveDayHist:1270 (snapshotDay:1288, resnapshotDayEdit:1276)','getDayHist:1269/getDayHistFor:1194','GRID: a deep clone of the DAY object as rendered — prescription, cardio.dose, cardio.dose.tgt'],
  ['ia_exw_<pid>','saveExWeights:12092 / saveExWeightsFor:1196 (logExerciseWeight:12133)','getExWeights:12091','athlete-entered loads (+ setsReps echo of the prescription)'],
  ['ia_wild_<pid>','saveWildcardDone:1201','getWildcardDone:1200','athlete-entered'],
  ['ia_moves_<pid>','saveRestMoves:1421','getRestMoves:1420','athlete edit (dest->origin day)'],
  ['ia_swaps_<pid>','saveSwaps:9246','getSwaps:9245','athlete edit (name->name)'],
  ['ia_swapct_<pid>','saveSwapCounts:9294','getSwapCounts:9293','counter'],
  ['ia_edits_<pid>','saveDayEdits:9168','getDayEdits:9167','athlete edit (adds/skips)'],
  ['ia_season_shown_<pid>','markSeasonShown:16571','seasonShown:16570','ui latch'],
  ['ia_reminded_<pid>','markReminded:16596','remindedSet:16595','ui latch'],
  ['ia_remind_last_<pid>','16613','16601','ui latch'],
  ['ia_pop_idx_/ia_pop_dismiss_','16416/16444','16413/16440','ui latch'],
];
console.log('\n--- Q-C1 STORAGE INVENTORY ('+KEYS.length+' key families) ---');
KEYS.forEach(k=>console.log('  '+k[0].padEnd(26)+' W:'+k[1].padEnd(52)+' R:'+k[2].padEnd(34)+' :: '+k[3]));
const gridKeys = KEYS.filter(k=>/^GRID/.test(k[3]));
console.log('  KEYS PERSISTING GENERATED PRESCRIPTION: '+gridKeys.length+'/'+KEYS.length+' -> '+gridKeys.map(k=>k[0]).join(', '));

// ── baseline self-stability first ──
const A1 = load(V201); armForm(A1);
const p1 = install(A1, PRT);
const A2 = load(V201); armForm(A2);
install(A2, PRT);
console.log('\n--- BASELINE SELF-STABILITY (V201 build == V201 build) ---');
console.log('  identical:', eq(cardsOf(A1), cardsOf(A2)) ? 'YES' : 'NO — do not diff against this');
console.log('  prog:', JSON.stringify(p1));

// ── does ia_programs really carry the grid? ──
const rawProgs = JSON.parse(A1.localStorage.getItem('ia_programs'));
console.log('  ia_programs[0].weeks present:', !!rawProgs[0].weeks,
            '| weeks stored:', rawProgs[0].weeks?Object.keys(rawProgs[0].weeks).length:0,
            '| bytes:', A1.localStorage.getItem('ia_programs').length);

// ── train weeks 1-3 through the app's own writers ──
const rds = runDaysOf(A1,1,3);
const logged=[];
rds.forEach(rd=>{ const r=logRunDay(A1,rd); if(r){ logged.push(Object.assign({},rd,r)); logLifts(A1,rd); } });
// also complete the non-run days of weeks 1-3 so the freeze sees a realistic frontier
A1.eval(`(function(){
  for(var w=1;w<=3;w++){ var wk=activeProg.weeks[w]; if(!wk) return;
    Object.keys(wk).forEach(function(d){
      currentWeek=w; currentDayKey=d;
      snapshotDay(w,d);
      var c=getCompleted(); var k=completedKey(w,d);
      if(!c[k]){ c[k]={title:wk[d].title||'',ts:Date.now(),status:'complete'}; saveCompleted(c); }
    }); }
})()`);
const store = dump(A1);
const histKeys = Object.keys(JSON.parse(store['ia_hist_'+p1.id]||'{}'));
const logKeys  = Object.keys(JSON.parse(store['ia_logs_'+p1.id]||'{}'));
console.log('\n--- TRAINED STATE WRITTEN (weeks 1-3, app writers only) ---');
console.log('  run sessions logged:', logged.length, '| ia_hist_ days:', histKeys.length, '| ia_logs_ days:', logKeys.length,
            '| ia_exw_ movements:', Object.keys(JSON.parse(store['ia_exw_'+p1.id]||'{}')).length);
logged.slice(0,4).forEach(l=>console.log('   logged w'+l.w+'_'+l.d+' ['+l.subtype+'] dose='+JSON.stringify(l.dose)+' -> run_pace='+l.run_pace));

// ── Q-C2 BOOT PATH: reboot on V201 (control) and on surgAB (treatment) ──
console.log('\n--- Q-C2 BOOT PATH ---');
const ctl = reboot(V201, store);
const trt = reboot(SURG, store);
console.log('  control  (V201 reboot):', JSON.stringify(ctl.info));
console.log('  treatment(surgAB     ):', JSON.stringify(trt.info));
const ctlCards=cardsOf(ctl.IA), trtCards=cardsOf(trt.IA), liveV201=cardsOf(A1);
console.log('  reboot on V201 reproduces the pre-reboot in-memory program:', eq(liveV201,ctlCards)?'YES':'NO');

// ── Q-C4a attachment ──
console.log('\n--- Q-C4a RECORD ATTACHMENT after the engine change ---');
const hist = JSON.parse(store['ia_hist_'+p1.id]||'{}');
function attachReport(cards,label){
  let att=0,orph=0,mis=0; const misEx=[];
  Object.keys(hist).forEach(k=>{
    const card=cards[k];
    if(!card){ orph++; return; }
    if(eq(card,hist[k])) att++;
    else { mis++; if(misEx.length<3) misEx.push(k); }
  });
  console.log('  '+label+': attached '+att+' / MISATTRIBUTED '+mis+' / orphaned '+orph+'  (denominator '+Object.keys(hist).length+' ia_hist_ day records)');
  if(misEx.length) console.log('     e.g. '+misEx.join(', '));
  return {att,mis,orph};
}
attachReport(ctlCards,'control  V201->V201 ');
const trtA = attachReport(trtCards,'treatment V201->surgAB');
// ia_exw_ attachment: does the logged movement still appear on the card it was logged against?
const exw = JSON.parse(store['ia_exw_'+p1.id]||'{}');
function exwReport(cards,label){
  let ok=0,gone=0,n=0;
  Object.keys(exw).forEach(key=>{
    exw[key].entries.forEach(e=>{
      n++; const k='w'+e.week+'_'+(e.day||'');
      const card=cards[k];
      const names=[]; if(card)(card.sections||[]).forEach(sec=>(sec.items||sec.exercises||[]).forEach(x=>{if(x&&x.name)names.push(x.name);}));
      if(names.some(nm=>nm===exw[key].name)) ok++; else gone++;
    });
  });
  console.log('  '+label+' ia_exw_ entries still on their card: '+ok+' / '+n+' (off-card '+gone+')');
}
exwReport(ctlCards,'control  ');
exwReport(trtCards,'treatment');

// ── Q-C4b RETROACTIVE RE-GRADING ──
console.log('\n--- Q-C4b RETROACTIVE RE-GRADE (logged pace vs the target now on the card) ---');
function regrade(IA,cards,label){
  let same=0,changed=0; const rows=[];
  logged.forEach(l=>{
    const k='w'+l.w+'_'+l.d, card=cards[k]; if(!card) return;
    let c=card.cardio; c=Array.isArray(c)?c[0]:c; if(!c) return;
    const liveDose = IA.eval('doseFromCardio('+JSON.stringify(c)+')');
    const oldTgt=l.dose&&l.dose.tgt, newTgt=liveDose&&liveDose.tgt;
    const loggedSec = IA.eval('_paceStrToSec('+JSON.stringify(l.run_pace)+')');
    const before=oracleDelta(loggedSec,oldTgt), after=oracleDelta(loggedSec,newTgt);
    if(before===after) same++; else { changed++; }
    if(rows.length<6) rows.push({k,st:l.subtype,logged:l.run_pace,oldTgt:oldTgt?fmt(oldTgt):null,newTgt:newTgt?fmt(newTgt):null,before,after});
  });
  console.log('  '+label+': delta string UNCHANGED '+same+' / CHANGED '+changed+' (denominator '+logged.length+' logged run sessions)');
  rows.forEach(r=>console.log('     '+r.k+' ['+r.st+'] logged '+r.logged+' | tgt '+r.oldTgt+' -> '+r.newTgt+' | "'+r.before+'" -> "'+r.after+'"'));
  return {same,changed};
}
regrade(ctl.IA,ctlCards,'control  V201->V201 ');
const trtB = regrade(trt.IA,trtCards,'treatment V201->surgAB');
// cross-check the oracle against the engine's own string for one row
const one=logged[0];
if(one){
  const s=trt.IA.eval(`(function(){
    var d=doseDerived(${JSON.stringify(one.dose)},{mins:'',dist:'',reps:'',rep:''});
    return d?1:0; })()`);
  console.log('  oracle cross-check: engine delta fn reachable =', s===1||s===0);
}

// ── Q-C4c per-day freeze: does it protect a LOGGED day from the new paces? ──
console.log('\n--- Q-C4c PER-DAY FREEZE vs a LOGGED day ---');
if(one){
  const k='w'+one.w+'_'+one.d;
  const pr=c=>{c=Array.isArray(c)?c[0]:c; return c?('['+c.subtype+'] '+c.detail+' | dose='+JSON.stringify(c.dose)):'(no cardio)';};
  console.log('  '+k+' LOGGED-day card BEFORE (V201, in memory): '+pr(liveV201[k].cardio));
  console.log('  '+k+' LOGGED-day card AFTER  (surgAB reboot)  : '+pr(trtCards[k].cardio));
  console.log('  byte-identical to ia_hist_ snapshot: '+(eq(trtCards[k],hist[k])?'YES (freeze held)':'NO (freeze pierced)'));
}
// an UNTOUCHED day in a future week, as the counterexample
const future = trt.IA.eval(`(function(){
  var W=activeProg.weeks||{}; var tw=activeProg.totalWeeks;
  for(var w=5;w<=tw;w++){ var wk=W[w]; if(!wk) continue;
    var ks=Object.keys(wk);
    for(var i=0;i<ks.length;i++){ var c=wk[ks[i]].cardio; c=Array.isArray(c)?c[0]:c;
      if(c&&String(c.type||'').toLowerCase()==='run') return {k:'w'+w+'_'+ks[i]}; } }
  return null; })()`);
if(future){
  const pr=c=>{c=Array.isArray(c)?c[0]:c; return c?('['+c.subtype+'] '+c.detail+' | dose='+JSON.stringify(c.dose)):'(none)';};
  console.log('  UNTOUCHED future day '+future.k+' BEFORE: '+pr(ctlCards[future.k].cardio));
  console.log('  UNTOUCHED future day '+future.k+' AFTER : '+pr(trtCards[future.k].cardio));
  console.log('  changed by the engine swap: '+(eq(ctlCards[future.k],trtCards[future.k])?'NO':'YES'));
}

// ── Q-C4d PROGRESS SURFACES ──
console.log('\n--- Q-C4d PROGRESS / HISTORY surfaces that read a STORED target ---');
function progress(IA,label){
  const r = IA.eval(`(function(){
    var logs=getLogs(), h=getDayHist(), tw=activeProg.totalWeeks;
    var rp=recoveryPaceWeekly(logs,h,tw);
    var ez=easyVsPrescribed(logs,h,tw);
    var pv=plannedVsLogged(logs,h,tw,null,false);
    return { rp_tgt: rp.tgt, rp_nWeeks: rp.nWeeks,
             ez_n: ez.length, ez_tgts: ez.slice(0,5).map(function(x){return x.tgt;}),
             pv_weeks: Object.keys(pv).length,
             pv_presc: Object.keys(pv).map(function(w){return w+':'+pv[w].presc.toFixed(1)+'/'+pv[w].act.toFixed(1);}) };
  })()`);
  console.log('  '+label+': '+JSON.stringify(r));
  return r;
}
const pc=progress(ctl.IA,'control  V201->V201 ');
const pt=progress(trt.IA,'treatment V201->surgAB');
console.log('  Progress reads ia_hist_ (snapshot) not the live card => identical across the engine change: '+(JSON.stringify(pc)===JSON.stringify(pt)?'YES':'NO'));
// and what the LIVE cards would say for the same weeks, to show the disagreement surface
function liveTgts(cards,label){
  const out=[];
  logged.forEach(l=>{ const c0=cards['w'+l.w+'_'+l.d]; if(!c0) return; let c=c0.cardio; c=Array.isArray(c)?c[0]:c;
    if(c&&c.dose&&c.dose.tgt) out.push('w'+l.w+'_'+l.d+'='+fmt(c.dose.tgt)); });
  console.log('  '+label+' live-card targets on logged days: '+out.join(' '));
}
liveTgts(ctlCards,'control  ');
liveTgts(trtCards,'treatment');

// ═══ LATTICE ═══
console.log('\n--- LATTICE SWEEP (same-length case, run_pace_goal) ---');
const EXP=['beginner','intermediate','advanced'];
const REST=[['sun','wed'],['sun'],['sat','sun','wed']];
const SEEDS=[24865,11111,42424,90210];
const TGTS=[{targetDist:'1.5',targetMins:'10',targetSecs:'30',targetTime:'10:30'},
            {targetDist:'1',targetMins:'8',targetSecs:'15',targetTime:'8:15'},
            {targetDist:'3',targetMins:'21',targetSecs:'00',targetTime:'21:00'}];
let nCfg=0,nHist=0,nAtt=0,nMis=0,nOrph=0,nLog=0,nSame=0,nChg=0,nFutureChg=0,nFuture=0,nLenChg=0;
const seg={};
EXP.forEach(ex=>REST.forEach(rd=>SEEDS.forEach(sd=>TGTS.forEach(tg=>{
  const cfg=base({experience:ex,restDays:rd,seed:sd,cardioGoals:paceGoal(tg)});
  let a,pid;
  try{ a=load(V201); armForm(a); pid=install(a,cfg).id; }catch(e){ console.log('  BUILD CRASH '+ex+'/'+rd.join('+')+'/'+sd+' '+e.message); return; }
  nCfg++;
  const rr=runDaysOf(a,1,3); const lg=[];
  rr.forEach(x=>{ const r=logRunDay(a,x); if(r) lg.push(Object.assign({},x,r)); });
  a.eval(`(function(){ for(var w=1;w<=3;w++){ var wk=activeProg.weeks[w]; if(!wk) return;
    Object.keys(wk).forEach(function(d){ currentWeek=w;currentDayKey=d; snapshotDay(w,d);
      var c=getCompleted(),k=completedKey(w,d); if(!c[k]){c[k]={title:'',ts:Date.now(),status:'complete'};saveCompleted(c);} }); } })()`);
  const st=dump(a);
  const H=JSON.parse(st['ia_hist_'+pid]||'{}');
  let t;
  try{ t=reboot(SURG,st); }catch(e){ console.log('  REBOOT CRASH '+ex+'/'+sd+' '+e.message); return; }
  const cds=cardsOf(t.IA);
  const preLen=JSON.parse(st['ia_programs'])[0].totalWeeks, postLen=t.info.totalWeeks;
  if(preLen!==postLen) nLenChg++;
  const key=ex+'|'+rd.length+'d';
  seg[key]=seg[key]||{hist:0,mis:0,log:0,chg:0};
  Object.keys(H).forEach(k=>{ nHist++; seg[key].hist++;
    const c=cds[k]; if(!c){nOrph++;return;} if(eq(c,H[k])) nAtt++; else {nMis++;seg[key].mis++;} });
  lg.forEach(l=>{ nLog++; seg[key].log++;
    const c0=cds['w'+l.w+'_'+l.d]; if(!c0) return; let c=c0.cardio; c=Array.isArray(c)?c[0]:c; if(!c) return;
    const nd=t.IA.eval('doseFromCardio('+JSON.stringify(c)+')');
    const ls=t.IA.eval('_paceStrToSec('+JSON.stringify(l.run_pace)+')');
    if(oracleDelta(ls,l.dose&&l.dose.tgt)===oracleDelta(ls,nd&&nd.tgt)) nSame++; else {nChg++;seg[key].chg++;}
  });
  // untouched future days: how many cards actually moved (proves the sweep has teeth)
  const c201=reboot(V201,st); const c2=cardsOf(c201.IA);
  Object.keys(c2).forEach(k=>{ const m=/^w(\d+)_/.exec(k); if(!m||+m[1]<4) return;
    nFuture++; if(!eq(c2[k],cds[k])) nFutureChg++; });
}))));
console.log('  configs built: '+nCfg+'  (3 experience x 3 rest patterns x 4 seeds x 3 targets)');
console.log('  program LENGTH changed by the engine swap: '+nLenChg+'/'+nCfg+' configs  (SAME-LENGTH case confirmed if 0)');
console.log('  ia_hist_ records: attached '+nAtt+' / MISATTRIBUTED '+nMis+' / orphaned '+nOrph+'  of '+nHist);
console.log('  logged run sessions: delta UNCHANGED '+nSame+' / CHANGED '+nChg+' of '+nLog);
console.log('  untouched future-week day cards CHANGED by the swap: '+nFutureChg+' of '+nFuture+
            ' ('+(nFuture?(100*nFutureChg/nFuture).toFixed(1):'0')+'%)  <- the sweep has teeth');
console.log('  segmented (experience|trainingDays): ');
Object.keys(seg).sort().forEach(k=>console.log('    '+k.padEnd(20)+' hist '+seg[k].hist+' mis '+seg[k].mis+' | logged '+seg[k].log+' regraded '+seg[k].chg));
// ═══ PART 2 — ADVERSE VARIANTS ═══════════════════════════════════════════════
// Part 1 trained weeks 1-3 COMPLETELY, so the freeze cut sat at week 4 and every
// record was covered by an ia_hist_ snapshot. Three states an already-running
// program can actually be in that Part 1 did not cover.
console.log('\n--- PART 2: ADVERSE VARIANTS (same PRT TING cfg, seed '+SEED+') ---');

function trainPartial(IA){                     // ONE logged day in week 3, rest untouched
  const rr=runDaysOf(IA,3,3); const out=[];
  if(rr.length){ const r=logRunDay(IA,rr[0]); if(r) out.push(Object.assign({},rr[0],r)); }
  return out;
}
function variantReport(label, store, lg, pid){
  const t=reboot(SURG,store), c=reboot(V201,store);
  const cds=cardsOf(t.IA), cds0=cardsOf(c.IA);
  const H=JSON.parse(store['ia_hist_'+pid]||'{}');
  let att=0,mis=0,orph=0;
  Object.keys(H).forEach(k=>{ const x=cds[k]; if(!x){orph++;return;} if(eq(x,H[k]))att++; else mis++; });
  let same=0,chg=0; const rows=[];
  lg.forEach(l=>{
    const k='w'+l.w+'_'+l.d, c0=cds[k]; if(!c0) return; let cc=c0.cardio; cc=Array.isArray(cc)?cc[0]:cc; if(!cc) return;
    const nd=t.IA.eval('doseFromCardio('+JSON.stringify(cc)+')');
    const ls=t.IA.eval('_paceStrToSec('+JSON.stringify(l.run_pace)+')');
    const before=oracleDelta(ls,l.dose&&l.dose.tgt), after=oracleDelta(ls,nd&&nd.tgt);
    if(before===after) same++; else chg++;
    rows.push({k,st:l.subtype,logged:l.run_pace,o:l.dose&&l.dose.tgt?fmt(l.dose.tgt):null,n:nd&&nd.tgt?fmt(nd.tgt):null,before,after});
  });
  console.log('  ['+label+'] hist records '+Object.keys(H).length+': attached '+att+' mis '+mis+' orph '+orph
    +' | logged runs '+lg.length+': delta UNCHANGED '+same+' CHANGED '+chg);
  rows.forEach(r=>console.log('      '+r.k+' ['+r.st+'] logged '+r.logged+' | tgt '+r.o+' -> '+r.n+' | "'+r.before+'" -> "'+r.after+'"'));
  return {att,mis,orph,same,chg,cds,cds0};
}

// V-1: PARTIAL WEEK. One logged day in w3; the other w3 days are untouched and pierce.
{
  const a=load(V201); armForm(a); const pid=install(a,PRT).id;
  const lg=trainPartial(a); const st=dump(a);
  const r=variantReport('V-1 partial week 3, 1 logged day', st, lg, pid);
  // do the SIBLING days of that same week change under the athlete?
  let sib=0,sibChg=0;
  Object.keys(r.cds0).forEach(k=>{ const m=/^w3_/.exec(k); if(!m) return;
    if(lg.some(l=>('w'+l.w+'_'+l.d)===k)) return;
    sib++; if(!eq(r.cds0[k],r.cds[k])) sibChg++; });
  console.log('      sibling untouched w3 day cards changed: '+sibChg+'/'+sib+' (logged day itself held: '+(r.mis===0)+')');
}

// V-2: LEGACY — log + completion exist, ia_hist_ does NOT (pre-V133 record, or a
// day touched before snapshots shipped). refreshProgram branch 2 (index.html:14601).
{
  const a=load(V201); armForm(a); const pid=install(a,PRT).id;
  const rr=runDaysOf(a,1,3); const lg=[];
  rr.forEach(x=>{ const r=logRunDay(a,x); if(r) lg.push(Object.assign({},x,r)); });
  const st=dump(a);
  delete st['ia_hist_'+pid];                       // <- the legacy state
  const r=variantReport('V-2 legacy: logs+completions, NO ia_hist_', st, lg, pid);
  console.log('      (denominator: '+lg.length+' logged runs; hist denominator is 0 by construction)');
}

// V-3: NO STORED GRID — ia_programs carries cfg but prog.weeks is absent, so the whole
// freeze block (index.html:14516 `if(prog.weeks)`) is skipped.
{
  const a=load(V201); armForm(a); const pid=install(a,PRT).id;
  const rr=runDaysOf(a,1,3); const lg=[];
  rr.forEach(x=>{ const r=logRunDay(a,x); if(r) lg.push(Object.assign({},x,r)); });
  const st=dump(a);
  const ps=JSON.parse(st['ia_programs']); delete ps[0].weeks; st['ia_programs']=JSON.stringify(ps);
  const r=variantReport('V-3 no stored prog.weeks (freeze block skipped)', st, lg, pid);
}

// V-4: which Progress modules actually have a SAMPLE on this goal? The pace charts key
// on run CLASS (_runClass, index.html:14996). run_pace_goal emits LSD/INT/CHI subtypes.
{
  const a=load(V201); armForm(a); install(a,PRT);
  const cls=a.eval(`(function(){
    var out={}; var W=activeProg.weeks||{};
    Object.keys(W).forEach(function(w){ Object.keys(W[w]).forEach(function(d){
      var c=W[w][d].cardio; c=Array.isArray(c)?c[0]:c;
      if(!c||String(c.type||'').toLowerCase()!=='run') return;
      var k=String(_runClass(c.subtype)); out[k]=(out[k]||0)+1; }); });
    return out; })()`);
  console.log('  [V-4] run-class census on PRT TING: '+JSON.stringify(cls));
  console.log('        recoveryPaceWeekly(14813) needs /recovery/i; easyVsPrescribed(15498) needs Recovery|Easy.');
}

// V-5: the stored grid is RE-STAMPED with the live rebuild by three user actions —
// applyRestMove(1385), setProgRace(13483), setProgStart(13495) all do
// `programs[i].weeks = activeProg.weeks; savePrograms(...)`. Does tapping one of those
// AFTER the engine change bake the new paces over the record?
{
  const a=load(V201); armForm(a); const pid=install(a,PRT).id;
  const rr=runDaysOf(a,1,3); const lg=[];
  rr.forEach(x=>{ const r=logRunDay(a,x); if(r) lg.push(Object.assign({},x,r)); });
  const st=dump(a);
  const t=reboot(SURG,st);
  const before=JSON.parse(t.IA.localStorage.getItem('ia_programs'))[0].weeks;
  const res=t.IA.eval(`(function(){
    try{ setProgStart(activeProg.startDate); }catch(e){ return 'THREW: '+e.message; }
    return 'ok'; })()`);
  const after=JSON.parse(t.IA.localStorage.getItem('ia_programs'))[0].weeks;
  console.log('  [V-5] setProgStart on surgAB: '+res+' | stored grid rewritten: '+(eq(before,after)?'NO':'YES'));
  // now boot AGAIN from the re-stamped store and re-grade
  const st2=dump(t.IA);
  const t2=reboot(SURG,st2); const c2=cardsOf(t2.IA);
  let same=0,chg=0;
  lg.forEach(l=>{ const c0=c2['w'+l.w+'_'+l.d]; if(!c0) return; let cc=c0.cardio; cc=Array.isArray(cc)?cc[0]:cc; if(!cc) return;
    const nd=t2.IA.eval('doseFromCardio('+JSON.stringify(cc)+')');
    const ls=t2.IA.eval('_paceStrToSec('+JSON.stringify(l.run_pace)+')');
    if(oracleDelta(ls,l.dose&&l.dose.tgt)===oracleDelta(ls,nd&&nd.tgt)) same++; else chg++; });
  console.log('        second boot after the re-stamp: delta UNCHANGED '+same+' CHANGED '+chg+' of '+lg.length);
  // and the same with ia_hist_ removed (legacy), where prog.weeks IS the only record
  const st3=dump(a); delete st3['ia_hist_'+pid];
  const t3=reboot(SURG,st3);
  t3.IA.eval('try{ setProgStart(activeProg.startDate); }catch(e){}');
  const t4=reboot(SURG,dump(t3.IA)); const c4=cardsOf(t4.IA);
  let s4=0,c4n=0;
  lg.forEach(l=>{ const c0=c4['w'+l.w+'_'+l.d]; if(!c0) return; let cc=c0.cardio; cc=Array.isArray(cc)?cc[0]:cc; if(!cc) return;
    const nd=t4.IA.eval('doseFromCardio('+JSON.stringify(cc)+')');
    const ls=t4.IA.eval('_paceStrToSec('+JSON.stringify(l.run_pace)+')');
    if(oracleDelta(ls,l.dose&&l.dose.tgt)===oracleDelta(ls,nd&&nd.tgt)) s4++; else c4n++; });
  console.log('        LEGACY (no ia_hist_) + re-stamp, second boot: delta UNCHANGED '+s4+' CHANGED '+c4n+' of '+lg.length);
}

// V-6: version gates / migration hooks present in the boot path (the sites a migration
// would hang off). Printed, not asserted.
console.log('  [V-6] boot-path conditional branches:');
console.log('        index.html:16331  boot: foldExAliasKeys(getExWeights()) -> saveExWeights   (the ONE lazy migration that exists)');
console.log('        index.html:14457  refreshProgram: cfg.seed==null && prog.seed==null -> RETURN prog UNBUILT (only early return)');
console.log('        index.html:14516  `if(prog.weeks){` -> the whole freeze block; absent grid = no freeze at all');
console.log('        index.html:14657  catch -> `return prog` (stored program shown verbatim if buildProgram throws)');
console.log('        NO ia-version predicate anywhere in the boot path:');

console.log('\n=== END 4C ===');
