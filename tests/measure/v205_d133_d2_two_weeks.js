// v205_d133_d2_two_weeks — MEASURE (read-only). Forensic on the two deload weeks whose
// ON-vs-OFF sha relation flipped (identical either way at V204, differing at V205), which is
// what moves g199's D2 count 2,859 -> 2,861. Four arms: {V204,V205} x {__DELOAD_OFF false,true}.
// Prints the day-by-day byte relation and the section content, so the reader that changed the
// bytes can be NAMED rather than guessed.
const path=require('path'), fs=require('fs'), os=require('os'), crypto=require('crypto');
const {load}=require(path.join(__dirname,'..','harness.js'));
const ROOT=path.join(__dirname,'..','..');
const SCRATCH='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad';
const ARTS={v204:path.join(SCRATCH,'v204.html'), v205:path.join(ROOT,'index.html')};
const sha=s=>crypto.createHash('sha1').update(s).digest('hex').slice(0,10);
function cfgFor(rest,seed){return {name:'M',primaryPath:'cardio',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'pace',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
    baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}},
  eventTargeted:false,raceDate:null,liftingFocus:'balanced',experience:'advanced',
  ageBracket:'18-35',equipment:'bodyweight',unit:'lbs',restDays:rest.slice(),
  days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed,
  injury:{region:'knee',tier:'protect'}};}
const CASES=[{k:'knee/protect|sun+wed|3039|wk8',rest:['sun','wed'],seed:3039,w:8},
             {k:'knee/protect|sat+sun|3039|wk8',rest:['sat','sun'],seed:3039,w:8}];
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__G199)globalThis.__G199.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),role:String(role),",
"        hot:!!hotNext,ci:(function(){try{return _cardioInterference(cardio);}catch(e){return null;}})(),",
"        cs:cardio?String(cardio.subtype||''):'',cl:!!(cardio&&cardio.legLoad),",
"        p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const SNAP_FN="globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),n:it.map(function(i){return String((i&&i.name)||'');}),"
 +"dt:it.map(function(i){return String((i&&i.detail)||'');})};});};";
function boot(ver){ const RAW=fs.readFileSync(ARTS[ver],'utf8'); const n=RAW.split(A_PIPE).length-1;
  if(n!==1) throw new Error('ANCHOR count=='+n+' in '+ver);
  const f=path.join(os.tmpdir(),'m133d2_'+ver+'_'+process.pid+'.html'); fs.writeFileSync(f,RAW.replace(A_PIPE,A_PIPE_R));
  const IA=load(f); IA.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;"); return {IA,f}; }
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const dumpDay=day=>((day&&day.sections)||[]).map(s=>'    ['+s.label+'] '
  +((s.items||[]).map(i=>i.name+' :: '+i.detail).join(' ; '))).join('\n');
CASES.forEach(C=>{
  console.log('\n================ '+C.k+' ================');
  const R={};
  ['v204','v205'].forEach(v=>{ const {IA,f}=boot(v);
    ['on','off'].forEach(m=>{ IA.eval("globalThis.__G199.length=0;globalThis.__DELOAD_OFF="+(m==='off')+";");
      const prog=IA.buildProgram(cfgFor(C.rest,C.seed));
      R[v+m]={week:prog.weeks[C.w], rec:IA.eval('globalThis.__G199').filter(r=>+r.w===C.w)}; });
    try{fs.unlinkSync(f);}catch(e){} });
  const wsha=x=>sha(JSON.stringify(R[x].week));
  console.log('week sha  204on='+wsha('v204on')+'  204off='+wsha('v204off')+'   => '+(wsha('v204on')===wsha('v204off')?'IDENTICAL':'DIFFER'));
  console.log('week sha  205on='+wsha('v205on')+'  205off='+wsha('v205off')+'   => '+(wsha('v205on')===wsha('v205off')?'IDENTICAL':'DIFFER'));
  DAYS.forEach(d=>{
    const g=(x)=>R[x].week&&R[x].week[d];
    const s=(x)=>g(x)?sha(JSON.stringify(g(x))):'(none)';
    const r=(x)=>R[x].rec.find(z=>z.d===d)||{};
    const rel4=s('v204on')===s('v204off')?'same':'DIFF', rel5=s('v205on')===s('v205off')?'same':'DIFF';
    const changed = s('v204on')!==s('v205on');
    console.log('\n  '+d+'   on/off 204='+rel4+'  205='+rel5+'   204on vs 205on: '+(changed?'CHANGED':'identical'));
    console.log('     role  '+r('v204on').role+' -> '+r('v205on').role
      +' | hotNext '+r('v204on').hot+' -> '+r('v205on').hot
      +' | ci '+r('v204on').ci+' -> '+r('v205on').ci
      +' | subtype "'+(r('v204on').cs||'')+'" -> "'+(r('v205on').cs||'')+'"'
      +' | legLoad '+r('v204on').cl+' -> '+r('v205on').cl);
    if(rel4==='DIFF'||rel5==='DIFF'||changed){
      ['v204on','v204off','v205on','v205off'].forEach(x=>{ console.log('     -- '+x+' --\n'+dumpDay(g(x))); });
    }
  });
});
