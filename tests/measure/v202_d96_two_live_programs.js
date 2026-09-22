// v202_d96_two_live_programs.js — MODE B before-picture for D96 ("reroute": run a 4-week
// 1.5-mile program alongside a fixed-date half, then rejoin the half at calendar week).
// Read-only. Measures: coexistence, per-program store isolation, A-disturbance on B create,
// the 4-week round trip (freeze provenance + weeks>=cut identity), setActive round trip.
// Oracles are independent of the functions under test: expected week numbers come from hand
// date arithmetic done here; expected store keys come from a source scan of localStorage call
// sites; freeze provenance comes from a sentinel stamped into the STORED build.
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const APP=path.join(__dirname,'..','..','index.html');
const IA=H.load(APP);
const L=IA.localStorage;
const out=[];const P=s=>{out.push(s);console.log(s);};
P('ia-version '+IA.version);

// ─────────────────────────────────────────────────────────────────────────────
// 0. Baseline equals itself (standing trap: prove identity before diffing).
const base1=IA.buildProgram(IA.fixtures.HALF_MANNY);
const base2=IA.buildProgram(IA.fixtures.HALF_MANNY);
P('[0] baseline self-stable: '+(H.progDigest(base1)===H.progDigest(base2))+'  digest='+H.progDigest(base1)+'  totalWeeks='+base1.totalWeeks);

// ─────────────────────────────────────────────────────────────────────────────
// 1. STORE KEY CENSUS (source-derived oracle). Every localStorage call site, with the
//    key expression as written. A shared/global key is anything not suffixed by a pid.
const js=IA.js;
const lines=js.split('\n');
const sites=[];
lines.forEach((ln,i)=>{
  const re=/localStorage\.(getItem|setItem|removeItem)\(([^;]{0,70})/g;let m;
  while((m=re.exec(ln))) sites.push({line:i+1,op:m[1],expr:m[2].split(',')[0].trim()});
});
P('\n[1] localStorage call sites: '+sites.length);
const byExpr={};
sites.forEach(s=>{(byExpr[s.expr]=byExpr[s.expr]||[]).push(s.line);});
Object.keys(byExpr).sort().forEach(e=>{
  const pid=/activeProgId|\+\s*pid|\+\s*id|\+\s*prog\b|\+\s*prog\.id|Key\(/.test(e);
  P('    '+(pid?'PER-PROG ':'GLOBAL   ')+e+'   @'+byExpr[e].join(','));
});
// key-builder helpers resolved
['editStoreKey','swapStoreKey','swapCountKey'].forEach(f=>{
  try{P('    helper '+f+'("PID") = '+IA.eval(f+'("PID")'));}catch(e){P('    helper '+f+' UNRESOLVED '+e.message);}
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. EMPIRICAL ISOLATION. Two programs live at once; write through every public store
//    writer while each is active; then assert no key is shared.
function mkProg(cfg,name){
  const p=IA.buildProgram(cfg);
  p.id=name; p.name=name; p.cfg=JSON.parse(JSON.stringify(cfg));
  delete p.cfg.startDate;
  return p;
}
const PACE_CFG={name:'PACE BLOCK',primaryPath:'event',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'1.5 Mile Time',mileBestMins:'10',mileBestSecs:'30',baselineDist:'1.5',baseline:'1.5mi'}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'crossfit',unit:'lbs',restDays:['sun','wed'],days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135,squat:155,deadlift:185,seed:76308};
const A=mkProg(IA.fixtures.HALF_MANNY,'PROG_A');
const B=mkProg(PACE_CFG,'PROG_B');
P('\n[2] A totalWeeks='+A.totalWeeks+' goal='+(A.cfg.cardioGoals.run.id)+' | B totalWeeks='+B.totalWeeks+' goal='+(B.cfg.cardioGoals.run.id));
L.clear();
IA.eval('activeProg=null;activeProgId=null;');
IA.eval('savePrograms(['+JSON.stringify([A,B]).slice(1,-1).length*0+'])'); // no-op guard
L.setItem('ia_programs',JSON.stringify([A,B]));
function writeAllStores(pid){
  IA.eval('activeProgId='+JSON.stringify(pid)+';');
  IA.eval('saveLogs({"w1_mon":{mark:'+JSON.stringify(pid)+'}});');
  IA.eval('saveCompleted({"w1_mon":true});');
  IA.eval('saveDayHist({"w1_mon":{title:'+JSON.stringify(pid)+'}});');
  IA.eval('saveWildcardDone(['+JSON.stringify(pid)+']);');
  IA.eval('saveExWeightsFor('+JSON.stringify(pid)+',{x:'+JSON.stringify(pid)+'});');
  IA.eval('saveRestMoves({"w1_mon":"tue"});');
  IA.eval('saveSwaps('+JSON.stringify(pid)+',{"w1_mon":[{from:"a",to:"b"}]});');
  IA.eval('saveSwapCounts('+JSON.stringify(pid)+',{"a>b":1});');
  IA.eval('saveDayEdits('+JSON.stringify(pid)+',{"w1_mon":{add:[],skip:["x"]}});');
  try{IA.eval('markReminded(1,"mon");');}catch(e){P('    markReminded threw for '+pid+': '+e.message);}
  try{IA.eval('popDismissText();');}catch(e){P('    popDismissText threw: '+e.message);}
  try{IA.eval('popPick("workout");');}catch(e){}
}
writeAllStores('PROG_A');
const afterA=new Map(L._map);
writeAllStores('PROG_B');
const keys=Array.from(L._map.keys()).sort();
P('    keys after writing every store for BOTH programs ('+keys.length+'):');
keys.forEach(k=>P('      '+k+' = '+String(L.getItem(k)).slice(0,60)));
// collision test: did writing B change any value written for A?
let clobbered=[];
afterA.forEach((v,k)=>{ if(L.getItem(k)!==v) clobbered.push(k); });
P('    A-values clobbered by writing B: '+clobbered.length+(clobbered.length?' -> '+clobbered.join(','):''));
const unsuffixed=keys.filter(k=>!/PROG_A$|PROG_B$/.test(k)&&k!=='ia_programs'&&k!=='ia_active');
P('    keys NOT suffixed by a program id: '+unsuffixed.length+(unsuffixed.length?' -> '+unsuffixed.join(','):''));

// ─────────────────────────────────────────────────────────────────────────────
// 3. DOES CREATING B DISTURB A? Drive the real create path (doGenerate) with A already
//    live, and diff every byte of A's row plus every A-suffixed store.
L.clear();
IA.eval('activeProg=null;activeProgId=null;WD=WD||{};');
const A0=mkProg(IA.fixtures.HALF_MANNY,'PROG_A');
// put A mid-plan: startDate such that TODAY is A's week 4 (hand arithmetic below)
function mondayOf(d){const x=new Date(d);x.setHours(0,0,0,0);const dow=x.getDay();const off=(dow===0?6:dow-1);x.setDate(x.getDate()-off);return x;}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const startWk4=mondayOf(TODAY);startWk4.setDate(startWk4.getDate()-21);
A0.startDate=iso(startWk4);
L.setItem('ia_programs',JSON.stringify([A0]));
L.setItem('ia_active','PROG_A');
IA.eval('activeProgId="PROG_A";');
// seed A with trained weeks 1-3 (logs + completions + hist snapshots)
const comp={},logs={},hist={};
['mon','tue','thu','fri','sat'].forEach(d=>{for(let w=1;w<=3;w++){comp['w'+w+'_'+d]=true;logs['w'+w+'_'+d]={done:1};hist['w'+w+'_'+d]={title:'HIST w'+w+' '+d};}});
L.setItem('ia_comp_PROG_A',JSON.stringify(comp));
L.setItem('ia_logs_PROG_A',JSON.stringify(logs));
L.setItem('ia_hist_PROG_A',JSON.stringify(hist));
const snapBefore=JSON.stringify(Array.from(L._map.entries()).sort());
const aRowBefore=JSON.stringify(JSON.parse(L.getItem('ia_programs')).find(p=>p.id==='PROG_A'));
// real create path
IA.eval('WD='+JSON.stringify(PACE_CFG)+';');
let genErr=null;
try{ IA.eval('doGenerate();'); IA.flushTimers(200); IA.flushTimers(200); }catch(e){ genErr=e.message; }
const progsAfter=JSON.parse(L.getItem('ia_programs')||'[]');
P('\n[3] doGenerate with A live: err='+genErr+'  programs now='+progsAfter.length+' -> ids '+progsAfter.map(p=>p.id).join(','));
P('    ia_active after create = '+L.getItem('ia_active'));
const aRowAfter=JSON.stringify(progsAfter.find(p=>p.id==='PROG_A'));
P('    A row byte-identical after creating B: '+(aRowBefore===aRowAfter));
const afterKeys=Array.from(L._map.keys()).sort();
const changed=[];
JSON.parse(snapBefore).forEach(([k,v])=>{ if(L.getItem(k)!==v) changed.push(k); });
P('    pre-existing keys whose value changed: '+(changed.length?changed.join(','):'NONE'));
P('    new keys created: '+afterKeys.filter(k=>!JSON.parse(snapBefore).some(e=>e[0]===k)).join(',')||'(none)');
const newB=progsAfter.find(p=>p.id!=='PROG_A');
if(newB) P('    B: startDate='+newB.startDate+' totalWeeks='+newB.totalWeeks+' blockOpen='+newB.blockOpen+' goal='+(newB.cfg&&newB.cfg.cardioGoals&&newB.cfg.cardioGoals.run&&newB.cfg.cardioGoals.run.id));

// ─────────────────────────────────────────────────────────────────────────────
// 4. THE ROUND TRIP.
// Oracle: hand date arithmetic. startDate = Monday(today)-21d  =>  today is week 4.
const handWeekNow=Math.floor((TODAY-mondayOf(new Date(A0.startDate+'T00:00:00')))/86400000/7)+1;
IA.eval('activeProgId="PROG_A";');
IA.eval('activeProg=getPrograms().find(p=>p.id==="PROG_A");');
const cw0=IA.eval('calcCurrentWeek()');
P('\n[4] A.startDate='+A0.startDate+'  hand-computed week today = '+handWeekNow+'  calcCurrentWeek() = '+cw0+'  AGREE='+(handWeekNow===cw0));

// Two ways to advance 4 weeks; prove they agree before relying on either.
function freshA(startISO,withDetourLogs){
  const p=mkProg(IA.fixtures.HALF_MANNY,'PROG_A');
  p.startDate=startISO;
  // SENTINEL: stamp the STORED build so freeze provenance is observable.
  Object.keys(p.weeks).forEach(w=>Object.keys(p.weeks[w]).forEach(d=>{
    p.weeks[w][d]=Object.assign({},p.weeks[w][d],{title:'[STORED]'+(p.weeks[w][d].title||'')});
  }));
  const c={},lg={},hs={};
  const upto=withDetourLogs?7:3;
  ['mon','tue','thu','fri','sat'].forEach(d=>{for(let w=1;w<=upto;w++){c['w'+w+'_'+d]=true;lg['w'+w+'_'+d]={done:1};}});
  L.setItem('ia_comp_PROG_A',JSON.stringify(c));
  L.setItem('ia_logs_PROG_A',JSON.stringify(lg));
  L.setItem('ia_hist_PROG_A',JSON.stringify(hs));
  L.setItem('ia_programs',JSON.stringify([p]));
  IA.eval('activeProgId="PROG_A";');
  return p;
}
const shifted=mondayOf(TODAY);shifted.setDate(shifted.getDate()-21-28);
const isoShift=iso(shifted);
// (i) startDate shifted back 4 weeks, real clock
const pI=freshA(isoShift,false);
const rI=IA.eval('refreshProgram(getPrograms()[0])');
IA.eval('activeProg=getPrograms()[0];');
const cwI=IA.eval('calcCurrentWeek()');
// (ii) startDate unchanged, Date overridden to today+28d
const pII=freshA(A0.startDate,false);
IA.eval(`(function(){var _RD=Date; var SHIFT=28*86400000;
  function FD(){ if(arguments.length===0) return new _RD(_RD.now()+SHIFT); return new (Function.prototype.bind.apply(_RD,[null].concat(Array.prototype.slice.call(arguments)))); }
  FD.now=function(){return _RD.now()+SHIFT;}; FD.parse=_RD.parse; FD.UTC=_RD.UTC; FD.prototype=_RD.prototype;
  globalThis.__REALDATE=_RD; globalThis.Date=FD; })();`);
const rII=IA.eval('refreshProgram(getPrograms()[0])');
IA.eval('activeProg=getPrograms()[0];');
const cwII=IA.eval('calcCurrentWeek()');
IA.eval('globalThis.Date=globalThis.__REALDATE;');
P('    +4wk via startDate shift:  calcCurrentWeek='+cwI);
P('    +4wk via Date override:    calcCurrentWeek='+cwII);
function stripTitleSent(o){return JSON.parse(JSON.stringify(o));}
const digI=H.progDigest({weeks:rI.weeks});
const digII=H.progDigest({weeks:rII.weeks});
P('    the two clock methods produce identical weeks: '+(digI===digII)+'  ('+digI+' / '+digII+')');

// Provenance of every week in the detour case (method i).
function provenance(prog){
  const rows=[];
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(w=>{
    let stored=0,live=0,tot=0;
    Object.keys(prog.weeks[w]).forEach(d=>{
      const t=String(prog.weeks[w][d].title||'');tot++;
      if(t.indexOf('[STORED]')===0) stored++; else live++;
    });
    rows.push({w:+w,stored,live,tot});
  });
  return rows;
}
P('\n    week provenance after the 4-week detour (nothing logged in weeks 4-7):');
provenance(rI).forEach(r=>P('      W'+String(r.w).padStart(2)+'  stored='+r.stored+'  live='+r.live+'  days='+r.tot));

// Counterfactual: the detour NEVER happened (weeks 4-7 trained), same clock.
const pC=freshA(isoShift,true);
const rC=IA.eval('refreshProgram(getPrograms()[0])');
P('\n    week provenance if weeks 4-7 HAD been trained (no detour):');
provenance(rC).forEach(r=>P('      W'+String(r.w).padStart(2)+'  stored='+r.stored+'  live='+r.live+'  days='+r.tot));

// Identity of weeks 8..N: detour vs no-detour vs pristine engine build.
const N=rI.totalWeeks||base1.totalWeeks;
const cutWk=cwI;
let same=0,diff=0,diffList=[];
for(let w=cutWk;w<=N;w++){
  const a=JSON.stringify(rI.weeks[w]),b=JSON.stringify(rC.weeks[w]);
  if(a===b)same++;else{diff++;diffList.push(w);}
}
P('\n    weeks '+cutWk+'..'+N+' detour-vs-no-detour byte-identical: '+same+'/'+(same+diff)+(diff?'  DIFFER at '+diffList.join(','):''));
// vs pristine build (sentinel-free)
const pristine=IA.buildProgram(IA.fixtures.HALF_MANNY);
let same2=0,diff2=0,d2=[];
for(let w=cutWk;w<=N;w++){
  const a=JSON.stringify(rI.weeks[w]),b=JSON.stringify(pristine.weeks[w]);
  if(a===b)same2++;else{diff2++;d2.push(w);}
}
P('    weeks '+cutWk+'..'+N+' detour-vs-pristine-engine-build byte-identical: '+same2+'/'+(same2+diff2)+(diff2?'  DIFFER at '+d2.join(','):''));
// and weeks 4..7 under the detour: do they equal the pristine build or the stored one?
let w47stored=0,w47live=0;
for(let w=4;w<=7;w++){Object.keys(rI.weeks[w]||{}).forEach(d=>{
  if(String(rI.weeks[w][d].title||'').indexOf('[STORED]')===0)w47stored++;else w47live++;});}
P('    weeks 4-7 under the detour: '+w47stored+' days from the STORED creation-day build, '+w47live+' days from the live rebuild');

// ─────────────────────────────────────────────────────────────────────────────
// 5. setActive ROUND TRIP  A -> B -> A
L.clear();
const A5=mkProg(IA.fixtures.HALF_MANNY,'PROG_A');A5.startDate=A0.startDate;
const B5=mkProg(PACE_CFG,'PROG_B');B5.startDate=iso(mondayOf(TODAY));
L.setItem('ia_programs',JSON.stringify([A5,B5]));
L.setItem('ia_active','PROG_A');
L.setItem('ia_logs_PROG_A',JSON.stringify(logs));
L.setItem('ia_comp_PROG_A',JSON.stringify(comp));
IA.eval('activeProgId="PROG_A";activeProg=getPrograms()[0];');
const before5=JSON.stringify(Array.from(L._map.entries()).sort());
const mem5before=IA.eval('JSON.stringify({activeProgId:activeProgId,activeName:activeProg&&activeProg.name,currentWeek:typeof currentWeek!=="undefined"?currentWeek:null})');
let e5=null;
try{ IA.eval('setActive("PROG_B");'); IA.eval('setActive("PROG_A");'); }catch(e){e5=e.message;}
const after5=JSON.stringify(Array.from(L._map.entries()).sort());
P('\n[5] setActive A->B->A err='+e5);
P('    localStorage byte-identical after the round trip: '+(before5===after5));
P('    in-memory before: '+mem5before);
P('    in-memory after:  '+IA.eval('JSON.stringify({activeProgId:activeProgId,activeName:activeProg&&activeProg.name,currentWeek:typeof currentWeek!=="undefined"?currentWeek:null})'));
P('    ia_active now = '+L.getItem('ia_active'));
// what openProg does instead
try{ IA.eval('openProg("PROG_B");'); }catch(e){P('    openProg threw: '+e.message);}
P('    after openProg(B): activeProgId='+IA.eval('activeProgId')+' activeProg.name='+IA.eval('activeProg&&activeProg.name')+' currentWeek='+IA.eval('currentWeek')+' ia_active='+L.getItem('ia_active'));
try{ IA.eval('openProg("PROG_A");'); }catch(e){}
P('    after openProg(A): activeProgId='+IA.eval('activeProgId')+' currentWeek='+IA.eval('currentWeek')+' ia_active='+L.getItem('ia_active'));

// ─────────────────────────────────────────────────────────────────────────────
// 6. HOME LIST with two non-archived programs.
L.setItem('ia_programs',JSON.stringify([A5,B5]));
L.setItem('ia_active','PROG_A');
let html='';
try{ IA.eval('openProgIds=new Set();editProgId=null;confirmProgId=null;confirmTier=0;'); IA.eval('renderProgList();');
     html=IA.eval('(function(){var l=document.getElementById("progList");return l&&l.innerHTML||"";})()'); }catch(e){P('    renderProgList threw: '+e.message);}
P('\n[6] renderProgList innerHTML length='+html.length+'  cards='+(html.match(/class="prog-card/g)||[]).length);
P('    "Set Active" buttons rendered: '+(html.match(/setActive\(/g)||[]).length);
P('    "Open" buttons rendered: '+(html.match(/openProg\(/g)||[]).length);
P('    active-prog class on: '+((html.match(/active-prog/g)||[]).length)+' card(s)');

// 7. Any cap on program count?
const capHits=[];
lines.forEach((ln,i)=>{ if(/programs\.length\s*[<>=]/.test(ln)) capHits.push((i+1)+': '+ln.trim().slice(0,120)); });
P('\n[7] source lines testing programs.length: '+capHits.length);
capHits.forEach(h=>P('    '+h));
P('\nDONE');
