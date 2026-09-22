// v202_d96_progress_scope.js — Q9-Q12 of the D96 before-picture: what the Progress page
// aggregates, and what survives a two-program split. Read-only.
// Oracle: card presence is read out of the rendered innerHTML (a DOM stub that RETAINS
// what is written); scope per card is read from the accessor each render site calls.
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const IA=H.load(path.join(__dirname,'..','..','index.html'));
const L=IA.localStorage;const P=s=>console.log(s);
P('ia-version '+IA.version);
IA.eval(`(function(){var reg={};var mk=document.createElement;
  document.getElementById=function(id){ if(!reg[id]){reg[id]=mk('div');reg[id].id=id;} return reg[id]; };
  globalThis.__REG=reg;})();`);
function mondayOf(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-(x.getDay()===0?6:x.getDay()-1));return x;}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const PACE_CFG={name:'PACE BLOCK',primaryPath:'event',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'1.5 Mile Time',mileBestMins:'10',mileBestSecs:'30',baselineDist:'1.5',baseline:'1.5mi'}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'crossfit',unit:'lbs',restDays:['sun','wed'],days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135,squat:155,deadlift:185,seed:76308};
function mk(cfg,id,start){const p=IA.buildProgram(cfg);p.id=id;p.name=id==='PROG_A'?'THE HALF MANNY':'PACE BLOCK';p.cfg=JSON.parse(JSON.stringify(cfg));delete p.cfg.startDate;p.startDate=start;p.created=id==='PROG_A'?1:2;return p;}
const aStart=mondayOf(TODAY);aStart.setDate(aStart.getDate()-21);           // A is at week 4
const A=mk(IA.fixtures.HALF_MANNY,'PROG_A',iso(aStart));
const B=mk(PACE_CFG,'PROG_B',iso(mondayOf(TODAY)));
L.clear();L.setItem('ia_programs',JSON.stringify([A,B]));L.setItem('ia_active','PROG_A');

// ── seed A with three weeks of real training ────────────────────────────────
const now=Date.now();const logs={},comp={},hist={},exw={};
let ts=now-21*86400000;
for(let w=1;w<=3;w++){['mon','tue','thu','fri','sat'].forEach((d,di)=>{
  const k='w'+w+'_'+d;ts+=86400000;
  logs[k]={rpe:6+((w+di)%3),run_dist:(d==='sat'?6+w:3),notes:'felt ok w'+w,ts:ts};
  comp[k]={status:'complete'};hist[k]={title:'Easy Run',cardio:{type:'run',subtype:'easy'}};
});}
[['Barbell Bench Press','bench'],['Back Squat','squat'],['Deadlift','dead']].forEach(([nm])=>{
  const key=IA.eval('exStoreKey('+JSON.stringify(nm)+')');
  exw[key]={name:nm,entries:[1,2,3].map(w=>({week:w,day:'mon',weight:100+w*10,reps:5,ts:now-(4-w)*7*86400000}))};
});
L.setItem('ia_logs_PROG_A',JSON.stringify(logs));
L.setItem('ia_comp_PROG_A',JSON.stringify(comp));
L.setItem('ia_hist_PROG_A',JSON.stringify(hist));
L.setItem('ia_exw_PROG_A',JSON.stringify(exw));
IA.eval('activeProgId="PROG_A";activeProg=refreshProgram(getPrograms()[0]);currentWeek=calcCurrentWeek();progressViewId=null;');

function renderProgress(){IA.eval('renderProgressScreen();');return IA.eval('document.getElementById("progressBody").innerHTML');}
const CARDS=[
 ['program chips (switcher)',/setProgressView\(/g],
 ['Weekly Running Mileage',/Weekly Running Mileage/g],
 ['Long Run Ladder',/Ladder|ladder/g],
 ['Easy zone / bands',/Easy|easy-zone|Prescribed/g],
 ['Same Effort chart',/Same Effort/g],
 ['Projection card',/Projection|projected|On this trend|signup/g],
 ['Drift chart',/Drift/g],
 ['Swim volume',/Weekly Swimming Volume/g],
 ['Bike time',/Weekly Cycling Time/g],
 ['Average Session RPE',/Average Session RPE/g],
 ['Lift Ledger',/Ledger|ledger/g],
 ['Session Journal',/Session Journal/g],
 ['1RM Estimator',/1RM Estimator/g],
 ['No data yet',/No data yet/g],
 ['archived restore bar',/This program is archived/g],
];
function report(tag,html){
  P('\n  ['+tag+'] innerHTML length='+html.length);
  CARDS.forEach(([n,re])=>{const m=html.match(re);P('      '+(m?'PRESENT('+m.length+')':'absent   ')+'  '+n);});
  const nums=(html.match(/>\s*[\d]+(\.\d+)?\s*(mi|min|yd|lbs)?\s*</g)||[]).length;
  P('      numeric text nodes: '+nums);
}
P('\n[9/10] PROGRESS with A active, viewing A (default):');
report('A active / view A',renderProgress());

// make B active, as Mario would
IA.eval('setActive("PROG_B");');
IA.eval('activeProgId="PROG_B";activeProg=refreshProgram(getPrograms()[1]);currentWeek=calcCurrentWeek();progressViewId=null;');
P('\n[10] PROGRESS with B active, default view (progressViewId=null):');
const hB=renderProgress();
report('B active / default view',hB);
P('      which program does the default view resolve to? '+IA.eval('progressViewId')+'  (null = active = '+IA.eval('activeProgId')+')');
P('      chip labels: '+JSON.stringify((hB.match(/>([^<>]{1,30})<\/button>/g)||[]).slice(0,6)));
// tap count to see A again
P('      taps from here to A\'s numbers: 1 (tap the A chip -> setProgressView(id) @14929)');
IA.eval('setProgressView("PROG_A");');
const hBA=renderProgress();
P('\n[10] PROGRESS with B active, viewing A via chip:');
report('B active / view A',hBA);
P('      identical to the "A active / view A" render: '+(hBA===renderProgressFor('PROG_A')));
function renderProgressFor(pid){IA.eval('progressViewId='+JSON.stringify(pid)+';');return renderProgress();}

// projection card in isolation, for B
P('\n[10] buildProjectionCard for B (no logs): '+JSON.stringify(IA.eval('buildProjectionCard(easyEffortWeekly(getLogsFor("PROG_B"),getDayHistFor("PROG_B"),6),6,630)')).slice(0,80));
P('      buildProjectionCard for A: length '+IA.eval('buildProjectionCard(easyEffortWeekly(getLogsFor("PROG_A"),getDayHistFor("PROG_A"),14),14,630).length'));
P('      EASY_MIN_RUNS='+IA.eval('typeof EASY_MIN_RUNS!=="undefined"?EASY_MIN_RUNS:"n/a"')+'  A nRuns/nWeeks='+IA.eval('JSON.stringify((function(){var e=easyEffortWeekly(getLogsFor("PROG_A"),getDayHistFor("PROG_A"),14);return [e.nRuns,e.nWeeks];})())'));

// ── lifetime / all-time figures? ────────────────────────────────────────────
const lifetime=IA.js.split('\n').map((l,i)=>({l,i:i+1})).filter(o=>/all[- ]time|lifetime|career|total across|allPrograms/i.test(o.l));
P('\n[10] source lines mentioning all-time / lifetime / cross-program totals: '+lifetime.length);
lifetime.forEach(o=>P('      @'+o.i+' '+o.l.trim().slice(0,110)));
P('      cross-program READERS that exist: crossProgLastEntry @11334 (loaded-lift fallback, V168 D3), seedFromPriorPrograms @14765 (run-pace wizard seed), _purgeWarnsCrossProg @14899');

// ── [11] ia_exw_ across the split ───────────────────────────────────────────
P('\n[11] exStoreKey is a NAME->slug map, not a program key: exStoreKey("Back Squat")='+IA.eval('exStoreKey("Back Squat")'));
P('      store itself: getExWeightsFor(pid) -> ia_exw_<pid> @1195');
P('      A exw rows: '+Object.keys(JSON.parse(L.getItem('ia_exw_PROG_A'))).join(','));
P('      B exw rows at creation: '+JSON.stringify(Object.keys(JSON.parse(L.getItem('ia_exw_PROG_B')||'{}'))));
IA.eval('activeProgId="PROG_B";');
const sqKey=IA.eval('exStoreKey("Back Squat")');
const cross=IA.eval('JSON.stringify(crossProgLastEntry('+JSON.stringify(sqKey)+'))');
P('      crossProgLastEntry("'+sqKey+'") while B is active: '+cross);
IA.eval('activeProgId="PROG_A";');
P('      crossProgLastEntry same key while A is active (same-program wins, D4): '+IA.eval('JSON.stringify(crossProgLastEntry('+JSON.stringify(sqKey)+'))'));
// does returning to A restore A's loads?
P('      A exw after all of the above byte-identical to what was written: '+(L.getItem('ia_exw_PROG_A')===JSON.stringify(exw)));

// ── [12] archive / unarchive round trip ─────────────────────────────────────
const before=JSON.stringify(Array.from(L._map.entries()).sort());
IA.eval('activeProgId="PROG_B";activeProg=getPrograms()[1];progressViewId=null;confirmProgId=null;confirmTier=0;');
IA.eval('archiveProg("PROG_A");');
const archMap=Array.from(L._map.entries()).sort();
const changedByArchive=archMap.filter(([k,v])=>{const b=JSON.parse(before).find(e=>e[0]===k);return !b||b[1]!==v;}).map(e=>e[0]);
P('\n[12] archiveProg("PROG_A") changed keys: '+changedByArchive.join(',')+'   (A stores touched: '+changedByArchive.filter(k=>/PROG_A$/.test(k)).length+')');
const arow=JSON.parse(L.getItem('ia_programs')).find(p=>p.id==='PROG_A');
P('      A row fields added: '+Object.keys(arow).filter(k=>/archiv/i.test(k)).join(',')+' archived='+arow.archived);
IA.eval('progressViewId="PROG_A";');
const hArch=renderProgress();
P('      Progress viewing archived A: length='+hArch.length+'  restore bar present='+hArch.includes('This program is archived'));
P('      archived-A render equals live-A render except the restore bar: '+(hArch.replace(/<div style="display:flex;align-items:center;justify-content:space-between[\s\S]*?<\/div>\s*$/,'').length>0));
IA.eval('unarchiveProg("PROG_A");');
const after=JSON.stringify(Array.from(L._map.entries()).sort());
const diffs=JSON.parse(after).filter(([k,v])=>{const b=JSON.parse(before).find(e=>e[0]===k);return !b||b[1]!==v;}).map(e=>e[0]);
P('      after unarchive, keys differing from pre-archive: '+(diffs.length?diffs.join(','):'NONE'));
JSON.parse(before).forEach(([k,v])=>{ if(/PROG_A$/.test(k)&&L.getItem(k)!==v) P('      !! A store CHANGED: '+k); });
P('      ia_active after archive+unarchive: '+L.getItem('ia_active'));
P('\nDONE');
