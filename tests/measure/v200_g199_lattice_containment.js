// v200_g199_lattice_containment — V200 D93 slice 2 follow-up. READ-ONLY measure pass.
// QUESTION: why is the pull A/B swap population ZERO on g199's lattice, and what is the
// smallest lattice change that contains it?
//
// INSTRUMENT: the p1/p2 stage record, taken with the SAME anchor g199 uses (A_PIPE), so the
// numbers here are commensurable with g199's pullSwapCensus. Written to tmp; the artifact is
// never written.
// ORACLE: the E_PAT hand table, typed from doctrine movement names, with a blindness probe.
// _isPostChain / _pattern are never asked what "posterior" means.
//
// usage: node tests/measure/v200_g199_lattice_containment.js <art.html> <spec>[,<spec>...] [shards]
//   spec := g199 | seed:<n> | goal:<k> | exp:<k> | rest:<k> | focus:<k> | inj:none
// Each non-g199 spec measures ONLY THE ADDED SLICE (the cells a lattice extension would add),
// because the g199 baseline slice is measured separately and the two simply sum.
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));
const ART=path.resolve(process.argv[2]||path.join(__dirname,'..','..','index.html'));

// ── HAND ORACLE (copy of g199 E_PAT, independent of the engine) ──
const E_PAT=[['calf_iso',/calf|calves|plantarflex/i],
 ['hip_ext',/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
 ['leg_iso',/leg curl|leg extension|hamstring curl/i],
 ['hinge',/deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i]];
const ePat=n=>{const t=String(n||'');for(const[p,r]of E_PAT)if(r.test(t))return p;return null;};
const isPost=n=>{const p=ePat(n);return p==='hinge'||p==='hip_ext';};
const PROBE=[['Back squat',0],['Leg extension',0],['Lying leg curl',0],['Leg press',0],
 ['Dumbbell standing calf raise',0],['Wall sit',0],['Barbell row',0],['Lat pulldown',0],
 ['Nordic hamstring curl (anchored)',1],['Single-leg glute bridge',1],['Barbell Romanian deadlift',1],
 ['45° back extension',1],['Kettlebell swing',1],['Dumbbell split-stance deadlift',1]];

// ── instrument (g199's anchor, verbatim) ──
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__G199)globalThis.__G199.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const SNAP_FN="globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),n:it.map(function(i){return String((i&&i.name)||'');})};});};";
function instrument(art,tag){const RAW=fs.readFileSync(art,'utf8');const n=RAW.split(A_PIPE).length-1;
 if(n!==1)return{err:n};const out=path.join(os.tmpdir(),'v200lc_'+tag+'_'+process.pid+'.html');
 fs.writeFileSync(out,RAW.replace(A_PIPE,A_PIPE_R));return{file:out};}

// ── axes ──
const G={liftonly:{k:'liftonly',id:null},pace:{k:'pace',id:'run_pace_goal'},mile:{k:'mile',id:'run_mile_goal'},
 half:{k:'half',id:'run_half'},'5k':{k:'5k',id:'run_5k'},'10k':{k:'10k',id:'run_10k'},marathon:{k:'marathon',id:'run_marathon'}};
const INJ={healthy:{k:'healthy',v:null},'shoulder/protect':{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
 'lowback/protect':{k:'lowback/protect',v:{region:'lowback',tier:'protect'}},'knee/protect':{k:'knee/protect',v:{region:'knee',tier:'protect'}}};
const RST={sun:{k:'sun',v:['sun']},'sun+wed':{k:'sun+wed',v:['sun','wed']},'sat+sun':{k:'sat+sun',v:['sat','sun']},
 wed:{k:'wed',v:['wed']},'fri+sun':{k:'fri+sun',v:['fri','sun']},sat:{k:'sat',v:['sat']}};
const B_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const B_FOCUS=['hypertrophy','balanced'], B_EXPS=['beginner','advanced'];
const B_GOALS=['liftonly','pace','half'], B_INJ=['healthy','shoulder/protect','lowback/protect','knee/protect'];
const B_RESTS=['sun','sun+wed','sat+sun'], B_SEEDS=[1013,3039];
function eCfg(tier,focus,exp,g,inj,rest,seed){const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
 const c={name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
  cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
   baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
  eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,
  ageBracket:'18-35',equipment:tier,unit:'lbs',restDays:rest.v.slice(),
  days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
 if(inj.v)c.injury={region:inj.v.region,tier:inj.v.tier}; return c;}
function latOf(spec){ // returns the CELLS THIS SPEC ADDS to the g199 lattice (g199 => the base itself)
 let T=B_TIERS,F=B_FOCUS,X=B_EXPS,GG=B_GOALS,I=B_INJ,R=B_RESTS,S=B_SEEDS;
 if(spec==='g199'){}
 else if(/^seed:/.test(spec)) S=[parseInt(spec.slice(5),10)];
 else if(/^goal:/.test(spec)) GG=[spec.slice(5)];
 else if(/^exp:/.test(spec))  X=[spec.slice(4)];
 else if(/^focus:/.test(spec))F=[spec.slice(6)];
 else if(/^rest:/.test(spec)) R=[spec.slice(5)];
 else if(spec==='inj:none')   I=['healthy'];
 else if(/^mini:/.test(spec)){T=B_TIERS.filter(x=>x!=='bodyweight');F=['balanced'];X=['beginner','advanced'];GG=['half','marathon'];I=['healthy'];R=B_RESTS;S=spec.slice(5).split('+').map(Number);}
 else throw new Error('bad spec '+spec);
 const L=[];
 for(const t of T)for(const f of F)for(const x of X)for(const gk of GG)for(const ik of I)for(const rk of R)for(const sd of S)
  L.push({key:[t,f,x,gk,ik,rk,sd].join('|'),t,f,x,g:gk,i:ik,r:rk,seed:sd,cfg:eCfg(t,f,x,G[gk],INJ[ik],RST[rk],sd)});
 return L;}

const hasLab=(c,lb)=>(c||[]).some(s=>s.l===lb&&(s.n||[]).length);
const secPost=s=>(s.n||[]).reduce((a,n)=>a+(isPost(n)?1:0),0);
const labPost=(c,lb)=>(c||[]).some(s=>s.l===lb&&secPost(s)>0);
const bump=(o,k)=>{o[k]=(o[k]||0)+1;};
function blank(){return{configs:0,dayCells:0,dlDayBuilds:0,pullAp1all:0,pullBp1all:0,pullBothP1:0,
 postP1dl:0,census:{},swapCards:0,bPostAnyDl:0,bySeed:{},byTier:{},byGoal:{},byExp:{},byFocus:{},byInj:{},byRest:{},
 bItems:{},shapeSeed:{},examples:[]};}
function sweep(mine,file){const IA=load(file);IA.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;");
 const S=blank();
 mine.forEach(L=>{IA.eval("globalThis.__G199.length=0;");IA.buildProgram(L.cfg);
  const REC=IA.eval('globalThis.__G199');S.configs++;
  const sh=S.shapeSeed[L.seed]=S.shapeSeed[L.seed]||{cells:0,dl:0,A:0,B:0,post:0};
  REC.forEach(r=>{S.dayCells++;sh.cells++;
   if(hasLab(r.p1,'Pull superset A')){S.pullAp1all++;sh.A++;}
   if(hasLab(r.p1,'Pull superset B')){S.pullBp1all++;sh.B++;}
   (r.p1||[]).forEach(s=>{sh.post+=secPost(s);});
   if(!r.dl)return; S.dlDayBuilds++;
   (r.p1||[]).forEach(s=>{S.postP1dl+=secPost(s);});
   const bp=labPost(r.p1,'Pull superset B');
   if(bp)S.bPostAnyDl++;
   if(!(hasLab(r.p1,'Pull superset A')&&hasLab(r.p1,'Pull superset B')))return;
   S.pullBothP1++;
   const ap=labPost(r.p1,'Pull superset A');
   const srv=((hasLab(r.p2,'Pull superset A')?'A':'')+(hasLab(r.p2,'Pull superset B')?'B':''))||'none';
   bump(S.census,'enterPost='+((ap?'A':'')+(bp?'B':'')||'none')+' surv='+srv);
   if(!bp)return;                      // the swap population: B holds posterior -> B survives, A did under V198
   S.swapCards++;
   bump(S.bySeed,String(L.seed));bump(S.byTier,L.t);bump(S.byGoal,L.g);bump(S.byExp,L.x);
   bump(S.byFocus,L.f);bump(S.byInj,L.i);bump(S.byRest,L.r);
   (r.p1||[]).forEach(s=>{if(s.l==='Pull superset B')(s.n||[]).forEach(n=>{if(isPost(n))bump(S.bItems,n);});});
   if(S.examples.length<4)S.examples.push({cfg:L.key,card:r.w+'|'+r.d,
     B:(r.p1||[]).filter(s=>s.l==='Pull superset B').map(s=>s.n.join(' + ')),
     A:(r.p1||[]).filter(s=>s.l==='Pull superset A').map(s=>s.n.join(' + ')),surv:srv});});});
 return S;}
function merge(a,b){Object.keys(b).forEach(k=>{if(typeof b[k]==='number')a[k]=(a[k]||0)+b[k];
 else if(Array.isArray(b[k]))a[k]=(a[k]||[]).concat(b[k]).slice(0,6);
 else if(b[k]&&typeof b[k]==='object'){a[k]=a[k]||{};merge(a[k],b[k]);}});return a;}

if(process.env.LCSHARD!==undefined){
 const si=+process.env.LCSHARD,sn=+process.env.LCSHARDS,spec=process.env.LCSPEC;
 const ins=instrument(ART,'s'+si);
 if(ins.err!==undefined){fs.writeFileSync(process.env.LCOUT,JSON.stringify({anchor:ins.err}));process.exit(0);}
 const R=sweep(latOf(spec).filter((_,i)=>i%sn===si),ins.file);
 try{fs.unlinkSync(ins.file);}catch(e){}
 fs.writeFileSync(process.env.LCOUT,JSON.stringify(R));process.exit(0);}

// ── parent ──
const bad=PROBE.filter(([n,e])=>(isPost(n)?1:0)!==e);
console.log('hand-oracle blindness probe: '+(PROBE.length-bad.length)+'/'+PROBE.length+(bad.length?'  MISREADS '+bad.map(x=>x[0]).join(','):''));
if(bad.length)process.exit(2);
const an=fs.readFileSync(ART,'utf8').split(A_PIPE).length-1;
console.log('instrument anchor count = '+an+' in '+ART);
if(an!==1){console.log('REFUSED: instrument could not be placed. NOTHING WAS MEASURED.');process.exit(2);}
const SPECS=String(process.argv[3]||'g199').split(',');
const SH=Math.max(1,parseInt(process.argv[4]||String(Math.min(6,os.cpus().length)),10));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v200lc-'));
(async()=>{
 for(const spec of SPECS){
  const n=latOf(spec).length;const t0=Date.now();const outs=[];
  await new Promise((res,rej)=>{let fin=0;
   for(let i=0;i<SH;i++){const o=path.join(tmp,spec.replace(/[^a-z0-9]/gi,'_')+'_'+i+'.json');outs.push(o);
    fork(__filename,[ART],{env:Object.assign({},process.env,{LCSHARD:String(i),LCSHARDS:String(SH),LCOUT:o,LCSPEC:spec}),stdio:'inherit'})
     .on('exit',c=>{if(c!==0)return rej(new Error('shard '+i+' exited '+c));if(++fin===SH)res();});}});
  let R={};outs.forEach(o=>{R=merge(R,JSON.parse(fs.readFileSync(o,'utf8')));fs.unlinkSync(o);});
  console.log('\n=== SPEC '+spec+'  configs='+R.configs+' (lattice '+n+')  dayCells='+R.dayCells
   +'  dlDayBuilds='+R.dlDayBuilds+'  ['+((Date.now()-t0)/1000).toFixed(0)+'s]');
  console.log('  pull A enters p1 (all day builds) '+R.pullAp1all+' | B enters '+R.pullBp1all+' | both enter on deload '+R.pullBothP1);
  console.log('  SWAP POPULATION (both enter on a deload card AND B holds an E_PAT posterior item) = '+R.swapCards+' of '+R.pullBothP1+' both-enter deload cards, of '+R.dlDayBuilds+' deload day builds');
  console.log('  census '+JSON.stringify(R.census));
  console.log('  B-holds-posterior on any deload card (A present or not) = '+R.bPostAnyDl+' of '+R.dlDayBuilds);
  if(R.swapCards){['bySeed','byTier','byGoal','byExp','byFocus','byInj','byRest'].forEach(k=>console.log('   '+k.padEnd(8)+' '+JSON.stringify(R[k])));
   console.log('   B posterior items '+JSON.stringify(R.bItems));
   console.log('   examples '+JSON.stringify(R.examples));}
  console.log('  SHAPE per seed (all day builds): '+JSON.stringify(R.shapeSeed));
 }
 try{fs.rmdirSync(tmp);}catch(e){}
})().catch(e=>{console.log('FAILED MEASUREMENT: '+e.message);process.exit(1);});
