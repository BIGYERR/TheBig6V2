// v200_m1_population — V200 D93. READ-ONLY measure pass. Does the M1-observable
// population exist at all?
//
// THE QUESTION. tests/sabotage/v200.json M1 removes the `break` at index.html:9412, so the
// posterior pre-pass in recoveryDeload picks the LAST posterior-holding accessory block
// instead of the FIRST. First-wins and last-wins can only DIFFER on a deload card that
// carries TWO OR MORE accessory-candidate blocks each holding a posterior item. This script
// counts that population, by section family, over the widest lattice it can afford.
//
// ORACLE INDEPENDENCE. "Posterior chain" is the E_PAT hand table, byte-identical to the copy
// in tests/gates/g199_deload_arbitration.js and tests/gates/g200_pull_arbitration.js, printed
// with its 17-name blindness probe before any number is measured. `_isPostChain` and
// `_pattern` are NEVER called. The four candidacy tests are the loop's own, carried
// byte-identical, applied to a snapshot that records label + hip flag + optional flag + item
// names only. The "hasLift" test is the one candidacy test that needs _pattern; it is NOT
// needed here, because any block holding an E_PAT posterior item passes it by construction.
//
// usage: node tests/measure/v200_m1_population.js <artifact.html> [shards]
// env:   M1LAT=<name>   one of the lattices in LATTICES below (default 'mini')
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));

// ══ HAND ORACLE (byte-identical to g199/g200) ══════════════════════════════
const E_PAT=[['calf_iso',/calf|calves|plantarflex/i],
 ['hip_ext',/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
 ['leg_iso',/leg curl|leg extension|hamstring curl/i],
 ['hinge',/deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i]];
const ePat=n=>{const t=String(n||'');for(const[p,r]of E_PAT)if(r.test(t))return p;return null;};
const isPost=n=>{const p=ePat(n);return p==='hinge'||p==='hip_ext';};
const PROBE=[['Back squat',0],['Leg extension',0],['Lying leg curl',0],['Leg press',0],
 ['Dumbbell standing calf raise',0],['Wall sit',0],['Barbell row',0],['Lat pulldown',0],
 ['Chin-up',0],['Face pull',0],
 ['Nordic hamstring curl (anchored)',1],['Single-leg glute bridge',1],['Barbell Romanian deadlift',1],
 ['45° back extension',1],['Kettlebell swing',1],['Dumbbell split-stance deadlift',1],['Barbell hip thrust',1]];

// ══ the deload loop's candidacy tests, carried byte-identical ═══════════════
const KMAIN=/^main\b|^primer|^power\b|^strength\b/, KPREHAB=/hip|mobility|stretch/, KFLUFF=/carry|finisher|conditioning|explosive/;
// s = {l,hip,opt,n}. Returns true for a block the pre-pass could pick, GIVEN it holds a
// posterior item (which subsumes the hasLift test).
function candidate(s){
  const L=String(s.l||'').toLowerCase();
  if(KMAIN.test(L)) return false;
  if(s.hip||KPREHAB.test(L)) return false;
  if(s.opt||KFLUFF.test(L)) return false;
  return true;
}
const famOf=l=>{const L=String(l||'');
  if(/^Pull\b/.test(L))return'pull'; if(/^Leg\b/.test(L))return'leg';
  if(/^Upper\b/.test(L))return'upper'; if(/^Push\b/.test(L))return'push';
  if(/^Row\b/.test(L))return'row'; if(/^Core\b/.test(L))return'core';
  return 'other:'+L;};

// ══ LATTICES ═══════════════════════════════════════════════════════════════
const ALL_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const MINI_TIERS=['commercial','home_full','crossfit','home_basic','minimal'];
const ALL_FOCUS=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const ALL_EXPS=['beginner','intermediate','advanced'];
const ALL_GOALS=['liftonly','pace','base','5k','10k','half','marathon'];
const ALL_INJ=['healthy','shoulder/protect','lowback/protect','knee/protect','shoulder/train_around','lowback/train_around'];
const ALL_RESTS=['sun','sun+wed','sat+sun'];
const M={tiers:MINI_TIERS,focus:['balanced'],exps:['beginner','advanced'],goals:['half','marathon'],
         injuries:['healthy'],rests:ALL_RESTS,seeds:[1]};
const ext=(o)=>Object.assign({},M,o);
const LATTICES={
  mini : M,                                                 // the shipped g200 lattice
  wide : {tiers:ALL_TIERS,focus:ALL_FOCUS,exps:ALL_EXPS,goals:ALL_GOALS,
          injuries:ALL_INJ,rests:ALL_RESTS,seeds:[1,1013]},
  // ── single-axis extensions of the shipped mini lattice ──
  c_focus    : ext({focus:ALL_FOCUS}),
  c_focusFL  : ext({focus:['balanced','fatloss']}),
  c_focusAth : ext({focus:['balanced','support_athletic']}),
  c_focusPrev: ext({focus:['balanced','support_prevention']}),
  c_exp      : ext({exps:ALL_EXPS}),
  c_goal     : ext({goals:ALL_GOALS}),
  c_goalLift : ext({goals:['half','marathon','liftonly']}),
  c_inj      : ext({injuries:ALL_INJ}),
  c_tierBW   : ext({tiers:ALL_TIERS}),
  c_seed     : ext({seeds:[1,1013]}),
  c_seed4    : ext({seeds:[1,1013,3039,7]}),
  // g199_deload_arbitration.js's own 1,728-key lattice, retyped from that gate's header.
  g199 : {tiers:ALL_TIERS,focus:['hypertrophy','balanced'],exps:['beginner','advanced'],
          goals:['liftonly','pace','half'],
          injuries:['healthy','shoulder/protect','lowback/protect','knee/protect'],
          rests:ALL_RESTS,seeds:[1013,3039]}
};
const GOAL_DEF={liftonly:null,pace:'run_pace_goal',base:'run_base','5k':'run_5k','10k':'run_10k',
                half:'run_half',marathon:'run_marathon'};
const REST_DEF={sun:['sun'],'sun+wed':['sun','wed'],'sat+sun':['sat','sun']};
const INJ_DEF={healthy:null,'shoulder/protect':{region:'shoulder',tier:'protect'},
 'lowback/protect':{region:'lowback',tier:'protect'},'knee/protect':{region:'knee',tier:'protect'},
 'shoulder/train_around':{region:'shoulder',tier:'train_around'},'lowback/train_around':{region:'lowback',tier:'train_around'}};
function mkCfg(tier,focus,exp,goalKey,injKey,restKey,seed){
  const id=GOAL_DEF[goalKey]; const isRace=!!id&&/5k|10k|half|marathon/.test(id);
  const c={name:'M',primaryPath:id?(isRace?'event':'cardio'):'lift',cardioTypes:id?['run']:[],
    cardioGoals:id?{run:{id,label:goalKey,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,
    ageBracket:'18-35',equipment:tier,unit:'lbs',restDays:REST_DEF[restKey].slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
  if(INJ_DEF[injKey])c.injury={region:INJ_DEF[injKey].region,tier:INJ_DEF[injKey].tier};
  return c;
}
function buildLattice(name){const A=LATTICES[name];if(!A)throw new Error('unknown lattice '+name);
  const L=[];
  for(const t of A.tiers)for(const f of A.focus)for(const x of A.exps)for(const gk of A.goals)
   for(const ik of A.injuries)for(const rk of A.rests)for(const sd of A.seeds)
    L.push({key:[t,f,x,gk,ik,rk,sd].join('|'),t,f,x,g:gk,i:ik,r:rk,seed:sd,
            cfg:mkCfg(t,f,x,gk,ik,rk,sd)});
  return L;}

// ══ INSTRUMENT: g199/g200's A_PIPE anchor verbatim; SNAP2 adds hip/optional ══
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__M1)globalThis.__M1.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),p1:globalThis.__SNAP2(__p1),p2:globalThis.__SNAP2(__p2),p3:globalThis.__SNAP2(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const SNAP_FN="globalThis.__SNAP2=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),hip:!!(s&&s.hip),opt:!!(s&&s.optional),"
 +"n:it.map(function(i){return String((i&&i.name)||'');})};});};";
function instrument(art,tag){const RAW=fs.readFileSync(art,'utf8');const n=RAW.split(A_PIPE).length-1;
 if(n!==1)return{err:n};const out=path.join(os.tmpdir(),'v200m1_'+tag+'_'+process.pid+'.html');
 fs.writeFileSync(out,RAW.replace(A_PIPE,A_PIPE_R));return{file:out};}

// ══ readers ════════════════════════════════════════════════════════════════
const FAM=['Pull superset A','Pull superset B','Pull'];
const shipSnap=day=>((day&&day.sections)||[]).map(s=>({l:String((s&&s.label)||''),
   n:((s&&s.items)||[]).map(i=>String((i&&i.name)||''))}));
const secOf=(c,lb)=>(c||[]).filter(s=>s.l===lb&&(s.n||[]).length);
const hasLab=(c,lb)=>secOf(c,lb).length>0;
const labPost=(c,lb)=>secOf(c,lb).some(s=>(s.n||[]).some(isPost));
const bump=(o,k)=>{o[k]=(o[k]||0)+1;};

function blank(){return{configs:0,dayCells:0,dlDayBuilds:0,
 // ── Q1: the M1-observable population ──
 postCandHist:{},           // how many posterior-holding candidate blocks per deload day build
 multi:0, multiByFamCombo:{}, multiByLabelCombo:{}, multiByFam:{}, multiByTier:{}, multiByFocus:{},
 multiByGoal:{}, multiByExp:{}, multiByInj:{}, multiByRest:{}, multiBySeed:{}, multiEx:[],
 multiPull:0, multiLeg:0, multiOther:0,
 one:0, oneByFam:{}, zero:0,
 lensMismatch:0, lensMismatchShape:{},
 // ── Q5: what can ever hold the posterior in a pull-family candidate block ──
 pullBPostItems:{}, pullBAllItems:{}, anyCandPostItems:{},
 // ── g200's four pins, re-measured on whatever lattice this is ──
 famP2:0, famP2ByLabel:{}, famP1:0, famP1ByLabel:{},
 bothEnter:0, swapCards:0, swapItems:{}, viol:0, violShape:{}, census:{}, p4Survive:0, p4Loss:{}
};}

function sweep(mine,instFile){
 const IA=load(instFile);IA.eval(SNAP_FN+"globalThis.__M1=[];");
 const S=blank();
 mine.forEach(L=>{
  IA.eval("globalThis.__M1.length=0;");
  const prog=IA.buildProgram(JSON.parse(JSON.stringify(L.cfg)));
  const REC=IA.eval('globalThis.__M1'); const W=(prog&&prog.weeks)||{};
  S.configs++;
  REC.forEach(r=>{
   S.dayCells++;
   const ship=shipSnap(((W[r.w]||{})[r.d])||null);
   // g200 P1: pull family present AFTER the deload, ALL day builds
   let famHere=0;
   FAM.forEach(lb=>{
     const n2=secOf(r.p2,lb).length; if(n2){famHere+=n2;S.famP2ByLabel[lb]=(S.famP2ByLabel[lb]||0)+n2;}
     const n1=secOf(r.p1,lb).length; if(n1){S.famP1+=n1;S.famP1ByLabel[lb]=(S.famP1ByLabel[lb]||0)+n1;}
   });
   S.famP2+=famHere;
   if(!r.dl) return;
   S.dlDayBuilds++;

   // ── Q1. posterior-holding accessory-candidate blocks entering the deload ──
   const pc=[];
   (r.p1||[]).forEach((s,i)=>{ if(!s) return;
     if(!(s.n||[]).length) return;
     if(!candidate(s)) return;
     if(!(s.n||[]).some(isPost)) return;
     pc.push({i,l:s.l,n:s.n}); });
   bump(S.postCandHist,String(pc.length));
   pc.forEach(b=>b.n.forEach(n=>{if(isPost(n))bump(S.anyCandPostItems,b.l+' :: '+n);}));
   if(pc.length===0) S.zero++;
   else if(pc.length===1){S.one++;bump(S.oneByFam,famOf(pc[0].l));}
   else {
     S.multi++;
     const fams=pc.map(b=>famOf(b.l));
     bump(S.multiByFamCombo,fams.join('+'));
     bump(S.multiByLabelCombo,pc.map(b=>b.l).join(' + '));
     fams.forEach(f=>bump(S.multiByFam,f));
     bump(S.multiByTier,L.t);bump(S.multiByFocus,L.f);bump(S.multiByGoal,L.g);
     bump(S.multiByExp,L.x);bump(S.multiByInj,L.i);bump(S.multiByRest,L.r);bump(S.multiBySeed,String(L.seed));
     if(fams.some(f=>f==='pull'))S.multiPull++;
     if(fams.some(f=>f==='leg'))S.multiLeg++;
     if(fams.every(f=>f!=='pull'&&f!=='leg'))S.multiOther++;
     if(S.multiEx.length<4)S.multiEx.push({cfg:L.key,card:'w'+r.w+' '+r.d,
       blocks:pc.map(b=>b.l+' ['+b.n.join(' + ')+']'),
       p2:(r.p2||[]).map(s=>s.l)});
   }
   // ── LENS CROSS-CHECK: my hand lens predicts FIRST posterior candidate survives.
   //    Compare against which candidate label actually survived at p2. A mismatch is a
   //    gap between the hand table and the engine's _isPostChain, reported, not hidden.
   if(pc.length){
     const want=pc[0].l;
     const gotSecs=(r.p2||[]).filter(s=>(s.n||[]).length&&candidate(s)).map(s=>s.l);
     if(!(gotSecs.length===1&&gotSecs[0]===want)){S.lensMismatch++;
       bump(S.lensMismatchShape,'want='+want+' got='+(gotSecs.join(',')||'none'));}
   }

   // ── Q5 / g200 P2c: pull-side item census ──
   secOf(r.p1,'Pull superset B').forEach(s=>s.n.forEach(n=>{bump(S.pullBAllItems,n);if(isPost(n))bump(S.pullBPostItems,n);}));

   // ── g200 P2 / P2c / P4 ──
   const aPost=labPost(r.p1,'Pull superset A');
   const bPost=labPost(r.p1,'Pull superset B');
   const bothEnter=hasLab(r.p1,'Pull superset A')&&hasLab(r.p1,'Pull superset B');
   if(!bothEnter) return;
   S.bothEnter++;
   const exp=bPost?'B':'A';
   const act=((hasLab(r.p2,'Pull superset A')?'A':'')+(hasLab(r.p2,'Pull superset B')?'B':''))||'none';
   bump(S.census,'enterPost='+((aPost?'A':'')+(bPost?'B':'')||'none')+' exp='+exp+' surv='+act);
   if(act!==exp){S.viol++;bump(S.violShape,'exp='+exp+' got='+act+' (Bpost='+bPost+')');}
   if(!bPost) return;
   S.swapCards++;
   secOf(r.p1,'Pull superset B').forEach(s=>s.n.forEach(n=>{if(isPost(n))bump(S.swapItems,n);}));
   const bItems=[].concat(...secOf(r.p1,'Pull superset B').map(s=>s.n));
   const intact=(ship||[]).some(s=>(s.l==='Pull superset B')
     ||(s.l==='Pull'&&(s.n||[]).length&&s.n.every(n=>bItems.includes(n))));
   if(intact)S.p4Survive++;
   else{const at2=(r.p2||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
     const at3=(r.p3||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
     const atS=(ship||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
     bump(S.p4Loss,'p2='+at2+' p3='+at3+' shipped='+atS);}
  });});
 return S;}

function merge(a,b){Object.keys(b).forEach(k=>{if(typeof b[k]==='number')a[k]=(a[k]||0)+b[k];
 else if(typeof b[k]==='string')a[k]=(a[k]?a[k]+';':'')+b[k];
 else if(Array.isArray(b[k]))a[k]=(a[k]||[]).concat(b[k]).slice(0,6);
 else if(b[k]&&typeof b[k]==='object'){a[k]=a[k]||{};merge(a[k],b[k]);}});return a;}

// ══ shard child ════════════════════════════════════════════════════════════
if(process.env.M1SHARD!==undefined){
 const si=+process.env.M1SHARD,sn=+process.env.M1SHARDS,ART=process.env.M1ART;
 const ins=instrument(ART,'s'+si);
 if(ins.err!==undefined){fs.writeFileSync(process.env.M1OUT,JSON.stringify({anchor:ins.err}));process.exit(0);}
 const R=sweep(buildLattice(process.env.M1LAT||'mini').filter((_,i)=>i%sn===si),ins.file);
 try{fs.unlinkSync(ins.file);}catch(e){}
 fs.writeFileSync(process.env.M1OUT,JSON.stringify(R));process.exit(0);}

// ══ parent ═════════════════════════════════════════════════════════════════
function topn(o,n){return JSON.stringify(Object.entries(o||{}).sort((a,b)=>b[1]-a[1]).slice(0,n));}
function main(){
const ART=path.resolve(process.argv[2]||path.join(__dirname,'..','..','index.html'));
const LATNAME=process.env.M1LAT||'mini';
const bad=PROBE.filter(([n,e])=>(isPost(n)?1:0)!==e);
console.log('hand-oracle blindness probe: '+(PROBE.length-bad.length)+'/'+PROBE.length+' correct'
 +(bad.length?'  MISREADS '+bad.map(x=>x[0]).join(','):''));
if(bad.length){console.log('FAILED MEASUREMENT: oracle probe');process.exit(2);}
const RAW=fs.readFileSync(ART,'utf8');
const ver=(RAW.match(/ia-version"\s+content="(\d+)"/)||[])[1];
const an=RAW.split(A_PIPE).length-1;
const LAT=buildLattice(LATNAME);
console.log('ARTIFACT '+ART+'  ia-version='+ver+'  A_PIPE anchor count='+an+'  LATTICE '+LATNAME+' = '+LAT.length+' configs');
if(an!==1){console.log('REFUSED: instrument could not be placed. NOTHING WAS MEASURED.');process.exit(2);}
const SH=Math.max(1,parseInt(process.argv[3]||String(Math.min(8,os.cpus().length)),10));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v200m1-'));
(async()=>{
 const t0=Date.now(),outs=[];
 await new Promise((res,rej)=>{let fin=0;
  for(let i=0;i<SH;i++){const o=path.join(tmp,'sh'+i+'.json');outs.push(o);
   fork(__filename,[ART],{env:Object.assign({},process.env,{M1SHARD:String(i),M1SHARDS:String(SH),
    M1OUT:o,M1ART:ART,M1LAT:LATNAME}),stdio:'inherit'})
    .on('exit',c=>{if(c!==0)return rej(new Error('shard '+i+' exited '+c));if(++fin===SH)res();});}});
 let R={};outs.forEach(o=>{R=merge(R,JSON.parse(fs.readFileSync(o,'utf8')));fs.unlinkSync(o);});
 try{fs.rmdirSync(tmp);}catch(e){}
 console.log('\n== LATTICE '+LATNAME+' == configs '+R.configs+'  dayCells '+R.dayCells
  +'  deloadDayBuilds '+R.dlDayBuilds+'  ['+((Date.now()-t0)/1000).toFixed(0)+'s]');
 console.log('\n-- Q1. posterior-holding accessory-candidate blocks per DELOAD day build (denominator '+R.dlDayBuilds+') --');
 console.log('   histogram '+JSON.stringify(R.postCandHist));
 console.log('   M1-OBSERVABLE CARDS (>=2 such blocks) = '+R.multi+' of '+R.dlDayBuilds+' deload day builds');
 console.log('     pull-involving '+R.multiPull+'  leg-involving '+R.multiLeg+'  neither '+R.multiOther);
 console.log('     family combos '+JSON.stringify(R.multiByFamCombo));
 console.log('     label combos '+topn(R.multiByLabelCombo,10));
 console.log('     byTier '+JSON.stringify(R.multiByTier)+' byFocus '+JSON.stringify(R.multiByFocus)
   +' byGoal '+JSON.stringify(R.multiByGoal)+' byExp '+JSON.stringify(R.multiByExp)
   +' byInj '+JSON.stringify(R.multiByInj)+' byRest '+JSON.stringify(R.multiByRest)+' bySeed '+JSON.stringify(R.multiBySeed));
 (R.multiEx||[]).forEach((e,i)=>console.log('     EX '+(i+1)+' '+JSON.stringify(e)));
 console.log('   exactly-one cards = '+R.one+'  byFamily '+JSON.stringify(R.oneByFam));
 console.log('   zero cards = '+R.zero);
 console.log('   LENS CROSS-CHECK (hand lens predicts FIRST posterior candidate survives at p2):');
 console.log('     mismatches '+R.lensMismatch+' of '+(R.one+R.multi)+' cards with >=1 posterior candidate; shapes '+topn(R.lensMismatchShape,6));
 console.log('\n-- Q5. item census --');
 console.log('   posterior items held by `Pull superset B` at p1 on deload cards: '+JSON.stringify(R.pullBPostItems));
 console.log('   ALL items ever in `Pull superset B` at p1 on deload cards: '+topn(R.pullBAllItems,20));
 console.log('   posterior items in ANY candidate block on deload cards: '+topn(R.anyCandPostItems,20));
 console.log('\n-- g200 PINS re-measured on this lattice --');
 console.log('   P1  pull family at p2 (all day builds, denom '+R.dayCells+') = '+R.famP2+'  byLabel '+JSON.stringify(R.famP2ByLabel)
   +'   [p1 INPUT '+R.famP1+' '+JSON.stringify(R.famP1ByLabel)+']');
 console.log('   P2c swap cards = '+R.swapCards+' of '+R.bothEnter+' both-enter, of '+R.dlDayBuilds+' deload day builds; items '+JSON.stringify(R.swapItems));
 console.log('   P2  violations = '+R.viol+' of '+R.bothEnter+'; shapes '+JSON.stringify(R.violShape));
 console.log('   P2  census '+JSON.stringify(R.census));
 console.log('   P4  survivors = '+R.p4Survive+' / '+R.swapCards+'; loss shapes '+JSON.stringify(R.p4Loss));
 console.log('\nDONE '+LATNAME+' '+ART);
})().catch(e=>{console.log('FAILED MEASUREMENT: '+e.message);process.exit(1);});
}
if(require.main===module)main();
module.exports={LATTICES,buildLattice,isPost,candidate};
