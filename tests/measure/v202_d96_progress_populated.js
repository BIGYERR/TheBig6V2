// v202_d96_progress_populated.js — Q9/Q10 with a fixture that SATISFIES every Progress
// module's own predicate (easy runs: run_pace + RPE 3-4 + hist cardio subtype easy,
// >=EASY_MIN_RUNS; lifts: hist sections labelled 'Main' so _slotOfEntry returns 'main').
// Without these the earlier pass under-reports card presence. Read-only.
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const IA=H.load(path.join(__dirname,'..','..','index.html'));
const L=IA.localStorage;const P=s=>console.log(s);
P('ia-version '+IA.version+'  EASY_RPE_LO/HI='+IA.eval('EASY_RPE_LO')+'/'+IA.eval('EASY_RPE_HI')+'  EASY_MIN_RUNS='+IA.eval('EASY_MIN_RUNS'));
IA.eval(`(function(){var reg={};var mk=document.createElement;
  document.getElementById=function(id){ if(!reg[id]){reg[id]=mk('div');reg[id].id=id;} return reg[id]; };})();`);
function mondayOf(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-(x.getDay()===0?6:x.getDay()-1));return x;}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const PACE_CFG={name:'PACE BLOCK',primaryPath:'event',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'1.5 Mile Time',mileBestMins:'10',mileBestSecs:'30',baselineDist:'1.5',baseline:'1.5mi'}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'crossfit',unit:'lbs',restDays:['sun','wed'],days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135,squat:155,deadlift:185,seed:76308};
function mk(cfg,id,nm,start){const p=IA.buildProgram(cfg);p.id=id;p.name=nm;p.cfg=JSON.parse(JSON.stringify(cfg));delete p.cfg.startDate;p.startDate=start;p.created=id==='PROG_A'?1:2;return p;}
const aStart=mondayOf(TODAY);aStart.setDate(aStart.getDate()-21);
const A=mk(IA.fixtures.HALF_MANNY,'PROG_A','THE HALF MANNY',iso(aStart));
const B=mk(PACE_CFG,'PROG_B','PACE BLOCK',iso(mondayOf(TODAY)));
L.clear();L.setItem('ia_programs',JSON.stringify([A,B]));L.setItem('ia_active','PROG_A');
const now=Date.now(),logs={},comp={},hist={},exw={};
const LIFTS=['Barbell Bench Press','Back Squat','Deadlift'];
let ts=now-21*86400000, paceSec=640;
for(let w=1;w<=3;w++){['mon','tue','thu','fri','sat'].forEach((d,di)=>{
  const k='w'+w+'_'+d; ts+=86400000; paceSec-=3;
  const mm=Math.floor(paceSec/60), ss=String(paceSec%60).padStart(2,'0');
  logs[k]={rpe:(di<3?3:4),run_pace:mm+':'+ss+'/mi',run_dist:(d==='sat'?6+w:3),notes:'felt ok w'+w,ts:ts};
  comp[k]={status:'complete'};
  const lift=LIFTS[(w+di)%3];
  hist[k]={title:'Session',cardio:{type:'run',subtype:(d==='sat'?'Long Run':'Easy Run'),dose:{tgt:paceSec+30},dist:(d==='sat'?6+w:3)},
           sections:[{label:'Main',items:[{name:lift,detail:'4×5'},{name:'Plank',detail:'3×45s'}]}]};
});}
LIFTS.forEach(nm=>{const key=IA.eval('exStoreKey('+JSON.stringify(nm)+')');
  const ens=[];
  for(let w=1;w<=3;w++)['mon','tue','thu','fri','sat'].forEach((d,di)=>{ if(LIFTS[(w+di)%3]===nm) ens.push({week:w,day:d,weight:100+w*10,reps:5,sets:[100+w*10],ts:now-(4-w)*7*86400000}); });
  exw[key]={name:nm,entries:ens};});
L.setItem('ia_logs_PROG_A',JSON.stringify(logs));L.setItem('ia_comp_PROG_A',JSON.stringify(comp));
L.setItem('ia_hist_PROG_A',JSON.stringify(hist));L.setItem('ia_exw_PROG_A',JSON.stringify(exw));
const exwWritten=JSON.stringify(exw);
IA.eval('activeProgId="PROG_A";activeProg=refreshProgram(getPrograms()[0]);currentWeek=calcCurrentWeek();progressViewId=null;');
P('A logged days='+Object.keys(logs).length+'  exw rows='+Object.keys(exw).length+'  easyEffort='+IA.eval('JSON.stringify((function(){var e=easyEffortWeekly(getLogsFor("PROG_A"),getDayHistFor("PROG_A"),14);return[e.nRuns,e.nWeeks];})())'));
const CARDS=[['chips/switcher',/setProgressView\(/g],['Weekly Running Mileage',/Weekly Running Mileage/g],
 ['Long Run Ladder',/Long Run Ladder/g],['Easy zone chart',/Easy Zone|Prescribed Zone|Easy Days/gi],
 ['Same Effort chart',/Same Effort/g],['Projection card',/Projection|Where This Is Heading|projected/gi],
 ['Drift chart',/Drift/gi],['Average Session RPE',/Average Session RPE/g],['Lift Ledger',/Lift Ledger|ledger-/gi],
 ['Session Journal',/Session Journal/g],['1RM Estimator',/1RM Estimator/g],['No data yet',/No data yet/g]];
function render(){IA.eval('renderProgressScreen();');return IA.eval('document.getElementById("progressBody").innerHTML');}
function report(tag,h){P('\n  ['+tag+'] length='+h.length);CARDS.forEach(([n,re])=>{const m=h.match(re);P('      '+(m?'PRESENT('+m.length+')':'absent    ')+'  '+n);});}
report('A active / view A (default)',render());
P('      A exw rewritten by the render (fold+dedupe re-save @15917-15920): '+(L.getItem('ia_exw_PROG_A')!==exwWritten));
const after=JSON.parse(L.getItem('ia_exw_PROG_A'));
P('      exw rows after render: '+Object.keys(after).join(',')+'  entry counts: '+Object.keys(after).map(k=>k+'='+after[k].entries.length).join(' ')+'  (written: '+Object.keys(exw).map(k=>k+'='+exw[k].entries.length).join(' ')+')');
// B active
IA.eval('setActive("PROG_B");activeProgId="PROG_B";activeProg=refreshProgram(getPrograms()[1]);currentWeek=calcCurrentWeek();progressViewId=null;');
report('B active / default view',render());
IA.eval('setProgressView("PROG_A");');
const hBA=render();
report('B active / view A via chip',hBA);
IA.eval('activeProgId="PROG_A";activeProg=refreshProgram(getPrograms()[0]);progressViewId=null;');
const hAA=render();
P('\n      "B active view A" identical to "A active view A": '+(hBA===hAA)+'  (lengths '+hBA.length+' / '+hAA.length+')');
// projection card, both programs
P('\n  projection card A: '+IA.eval('buildProjectionCard(easyEffortWeekly(getLogsFor("PROG_A"),getDayHistFor("PROG_A"),14),14,630).length')+' chars');
P('  projection card B (no logs): '+IA.eval('buildProjectionCard(easyEffortWeekly(getLogsFor("PROG_B"),getDayHistFor("PROG_B"),6),6,630).length')+' chars');
P('  projection card B given A-shaped logs written under B: '+IA.eval('(function(){localStorage.setItem("ia_logs_PROG_B",localStorage.getItem("ia_logs_PROG_A"));localStorage.setItem("ia_hist_PROG_B",localStorage.getItem("ia_hist_PROG_A"));var e=easyEffortWeekly(getLogsFor("PROG_B"),getDayHistFor("PROG_B"),6);return buildProjectionCard(e,6,630).length;})()')+' chars');
P('  (the projection is a HALF-marathon projection: _halfFromMileSec @'+(IA.js.split('\n').findIndex(l=>/function _halfFromMileSec/.test(l))+1)+' — it renders on any run program whose easy-run coverage passes)');
IA.eval('localStorage.removeItem("ia_logs_PROG_B");localStorage.removeItem("ia_hist_PROG_B");');
// streak / completion counters: which program?
IA.eval('activeProgId="PROG_B";activeProg=refreshProgram(getPrograms()[1]);currentWeek=calcCurrentWeek();');
P('\n  with B active: computeStreak()='+IA.eval('computeStreak()')+' completedCount()='+IA.eval('completedCount()')+' skippedCount()='+IA.eval('skippedCount()'));
IA.eval('activeProgId="PROG_A";activeProg=refreshProgram(getPrograms()[0]);currentWeek=calcCurrentWeek();');
P('  with A active: computeStreak()='+IA.eval('computeStreak()')+' completedCount()='+IA.eval('completedCount()')+' skippedCount()='+IA.eval('skippedCount()'));
P('  (computeStreak @16531 / completedCount @16542 read getCompleted() = ia_comp_<activeProgId>, NOT the viewed program)');
P('\nDONE');
