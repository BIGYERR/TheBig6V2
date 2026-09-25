// v212 measure: Programs page — does SET ACTIVE do anything visible; what does OPEN do instead?
// Usage: node tests/measure/v221_open_vs_active.js <artifact.html>
// Oracle: button labels on the card ("Set Active", "Active ✓", "Open") and the storage contract
// getActiveProgId()==localStorage.ia_active (declared :1215). Expected = label semantics, observed = real handlers.
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const ART=process.argv[2]||path.join(__dirname,'..','..','index.html');
const IA=H.load(ART); const ctx=IA.ctx, ev=IA.eval, LS=IA.localStorage;
console.log('artifact',ART,'ia-version',IA.version);
// retaining DOM + call recorders
const els={}; const doc=ctx.document; const og=doc.getElementById;
doc.getElementById=id=>(els[id]||(els[id]=og(id)));
const calls=[]; const wrap=n=>{const f=ctx[n]; if(typeof f!=='function'){console.log('MISSING',n);return;} ctx[n]=function(...a){calls.push(n+(a.length?'('+String(a[0]).slice(0,20)+')':'()')); try{return f.apply(this,a);}catch(e){calls.push(n+' THREW '+e.message);}};};
// function declarations are context props; handlers call via global lookup so wrapping ctx works
['renderProgList','renderWeekView','showScreen','showToast','refreshProgram','calcCurrentWeek'].forEach(wrap);
const fx=typeof H.fixtures==='function'?H.fixtures():H.fixtures; const cfgs=Object.values(fx);
let pass=0,fail=0; const R=(k,v)=>console.log('  '+k.padEnd(44),v);
// three programs, A active at boot
const _t=c=>{const p=IA.buildProgram(Object.assign({},c,{seed:1000}));return Object.keys(p.weeks[1]).map(d=>d+':'+(p.weeks[1][d]&&p.weeks[1][d].title));};
const _t0=_t(cfgs[0]); let _j=1,_best=-1; cfgs.forEach((c,j)=>{if(!j)return; const t=_t(c); const n=t.filter(x=>!_t0.includes(x)).length; if(n>_best){_best=n;_j=j;}});
console.log('P1 fixture index',_j,'week-1 days with a different title from P0:',_best,'of',_t0.length);
const progs=[0,_j,2].map((fi,i)=>{const c=Object.assign({},cfgs[fi%cfgs.length],{seed:1000+i},i===1?{cardioTypes:[],cardioGoals:{},eventTargeted:false,primaryPath:'lift',raceDate:undefined,name:'LIFT VARIANT'}:{}); const p=IA.buildProgram(c); p.id='P'+i; p.name='Prog'+i; p.startDate='2026-09-07'; return p;});
progs[2].archived=true;
LS.setItem('ia_programs',JSON.stringify(progs)); LS.setItem('ia_active','P0');
ev('activeProgId=null;activeProg=null;'); calls.length=0;
try{ ev('init()'); }catch(e){ console.log('init THREW',e.message); }
const state=tag=>{const html=(els.progList&&els.progList.innerHTML)||''; const activeCard=(html.match(/id="pcard_(P\d)"[\s\S]*?(?=id="pcard_|$)/g)||[]).filter(s=>/Active \\u2713|Active ✓/.test(s)).map(s=>s.match(/pcard_(P\d)/)[1]);
  const s={ia_active:LS.getItem('ia_active'),activeProgId:ev('activeProgId'),activeProgName:ev('activeProg&&activeProg.name'),cardShowingActiveCheck:activeCard.join(',')||'(none)',calls:calls.splice(0).join(' ')}; console.log(tag); for(const k in s) R(k,s[k]); return s;};
state('BOOT (ia_active=P0)');
ev('setActive("P1")'); const a=state('AFTER setActive("P1")');
// oracle: label says P1 is now the active program -> week view must follow
const chk=(name,ok)=>{ok?pass++:fail++; console.log((ok?'  PASS ':'  FAIL ')+name);};
chk('SET ACTIVE: ia_active==P1',a.ia_active==='P1');
chk('SET ACTIVE: card list repainted, check on P1',a.cardShowingActiveCheck==='P1');
chk('SET ACTIVE: This Week global activeProgId==P1',a.activeProgId==='P1');
chk('SET ACTIVE: renderWeekView called',/renderWeekView/.test(a.calls));
// reset, then OPEN a non-active program
LS.setItem('ia_active','P0'); ev('activeProgId=null;activeProg=null;'); try{ev('init()');}catch(e){} calls.length=0;
ev('openProg("P1")'); const o=state('AFTER openProg("P1") from P0');
chk('OPEN: This Week shows P1',o.activeProgId==='P1');
chk('OPEN: ia_active persisted as P1',o.ia_active==='P1');
ev('renderProgList()'); const o2=state('  ...then return to Programs (renderProgList)');
chk('OPEN: card check follows opened program',o2.cardShowingActiveCheck==='P1');
// reboot after OPEN: which program comes back?
ev('activeProgId=null;activeProg=null;'); try{ev('init()');}catch(e){} const rb=state('REBOOT after OPEN P1 (no Set Active)');
chk('OPEN survives reboot',rb.activeProgId==='P1');
// OPEN on archived program: reachable from card? archived cards are filtered out of progList
LS.setItem('ia_active','P0'); ev('activeProgId="P0"'); calls.length=0;
ev('openProg("P2")'); const ar=state('openProg("P2") on ARCHIVED program (direct call)');
ev('setActive("P2")'); state('setActive("P2") on ARCHIVED');
// the split state: after setActive(P1) then logging — which id keys ia_hist_/ia_logs_ ?
LS.setItem('ia_active','P0'); ev('activeProgId=null;activeProg=null;'); try{ev('init()');}catch(e){}
ev('setActive("P1")');
console.log('SPLIT after setActive(P1): writes keyed on activeProgId =',ev('activeProgId'),'while card shows',LS.getItem('ia_active'));
console.log(`PASS ${pass} FAIL ${fail}`);

// ===== PART 2: coach's claim — does the split misattribute data, or only lie in display/persistence? =====
// Oracle: each program's OWN stored grid (ia_programs) at the logged week/day, read by id, not via activeProg.
console.log('\n== PART 2: attribution ==');
let p2=0,f2=0; const ck=(n,ok)=>{ok?p2++:f2++; console.log((ok?'  PASS ':'  FAIL ')+n);};
const ownDay=(pid,wk,dk)=>{const p=JSON.parse(LS.getItem('ia_programs')).find(x=>x.id===pid); const pr=ev('refreshProgram')(p); return pr.weeks[wk]&&pr.weeks[wk][dk];};
const keysFor=pid=>['ia_logs_','ia_comp_','ia_hist_','ia_exw_'].filter(k=>LS.getItem(k+pid)&&LS.getItem(k+pid)!=='{}');
function wipe(){for(const pid of ['P0','P1','P2'])['ia_logs_','ia_comp_','ia_hist_','ia_exw_'].forEach(k=>LS.removeItem(k+pid));}
function logOne(tag){
  const wk=1; const ap=ev('activeProg'); const dk=Object.keys(ap.weeks[wk]).find(d=>{const a=ownDay("P0",wk,d),b=ownDay("P1",wk,d);return a&&b&&a.title&&b.title&&a.title!==b.title;}); if(!dk){console.log("  NO DISCRIMINATING DAY: title check would be vacuous");}
  const day=ap.weeks[wk][dk]; const title=day.title;
  ev('currentWeek=1;currentDayKey='+JSON.stringify(dk)+';');
  try{ev('writeSetDraft')('bench_press',[5,5],[100,100],'');}catch(e){console.log('  writeSetDraft THREW',e.message);}
  try{ev('logExerciseWeight')('Bench Press',100,'3×5',wk,3,[100,100,100],dk);}catch(e){console.log('  logExerciseWeight THREW',e.message);}
  try{ev('markDayComplete')(wk,dk,title);}catch(e){console.log('  markDayComplete THREW',e.message);}
  const onScreen=ev('activeProgId'), card=LS.getItem('ia_active');
  const where={}; for(const pid of ['P0','P1','P2']) where[pid]=keysFor(pid);
  console.log(`  [${tag}] onScreen(activeProgId)=${onScreen} cardCheck(ia_active)=${card} day=${dk} title="${title}"`);
  console.log('   keys written:',JSON.stringify(where));
  return {wk,dk,title,onScreen,card,where};
}
function verify(r,expect){
  const other=expect==='P0'?'P1':'P0';
  ck(`${expect}: all 4 families under ${expect}`,r.where[expect].length===4);
  ck(`${expect}: nothing under ${other}`,r.where[other].length===0);
  const comp=JSON.parse(LS.getItem('ia_comp_'+expect)||'{}')['w'+r.wk+'_'+r.dk];
  const own=ownDay(expect,r.wk,r.dk), oth=ownDay(other,r.wk,r.dk);
  console.log(`   comp.title="${comp&&comp.title}" | ${expect} own title="${own&&own.title}" | ${other} title="${oth&&oth.title}"`);
  ck(`${expect}: ia_comp_ title == ${expect}'s own card title`,comp&&own&&comp.title===own.title);
  const hist=JSON.parse(LS.getItem('ia_hist_'+expect)||'{}')['w'+r.wk+'_'+r.dk];
  ck(`${expect}: ia_hist_ snapshot == ${expect}'s own day`,hist&&own&&JSON.stringify(hist)===JSON.stringify(own));
}
function boot(){ev('activeProgId=null;activeProg=null;');try{ev('init()');}catch(e){console.log('init THREW',e.message);}}
// (a1) setActive(P1) then log with P0 on screen
wipe(); LS.setItem('ia_active','P0'); boot(); ev('setActive("P1")');
const r1=logOne('after setActive(P1)'); verify(r1,'P0');
boot(); console.log(`   REBOOT -> This Week shows ${ev('activeProgId')}; its ia_comp_ has ${Object.keys(JSON.parse(LS.getItem('ia_comp_'+ev('activeProgId'))||'{}')).length} entries; logged session lives under P0 (${Object.keys(JSON.parse(LS.getItem('ia_comp_P0')||'{}')).length})`);
// (a2) openProg(P1) then log
wipe(); LS.setItem('ia_active','P0'); boot(); ev('openProg("P1")');
const r2=logOne('after openProg(P1)'); verify(r2,'P1');
boot(); console.log(`   REBOOT -> This Week shows ${ev('activeProgId')}; its ia_comp_ has ${Object.keys(JSON.parse(LS.getItem('ia_comp_'+ev('activeProgId'))||'{}')).length} entries; logged session lives under P1 (${Object.keys(JSON.parse(LS.getItem('ia_comp_P1')||'{}')).length})`);
console.log(`PART2 PASS ${p2} FAIL ${f2}`);
