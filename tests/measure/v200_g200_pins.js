// v200_g200_pins — V200 D93 (amended). READ-ONLY measure pass.
// Gathers the four pins builder hard-codes into tests/gates/g200_pull_arbitration.js,
// plus the discriminating RED/GREEN pair that proves g200 is not a gate that passes on
// both versions (CLAUDE.md §10b).
//
// ORACLE: the E_PAT hand table, typed from doctrine movement names, with a blindness
// probe printed before anything is measured. `_isPostChain` and `_pattern` are NEVER
// consulted: the instrument must not ask the suspect what "posterior" means.
//
// usage: node tests/measure/v200_g200_pins.js <artifact.html> [shards]
//        (run it once per artifact: the V198 predecessor and shipped V199.)
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));

// ══ THE RULED MINI LATTICE (D93 amended, coach-fixed) ═══════════════════════
// Exported so tests/gates/g200_pull_arbitration.js can LIFT these axis definitions
// rather than retype them. A gate and its measure disagreeing about the lattice is
// how this item went wrong the first time.
//   5 tiers (bodyweight EXCLUDED: contributes 0) x focus balanced x exp {beginner,advanced}
//   x goal {half,marathon} x injury healthy x 3 rest patterns x seed 1 alone
//   = 60 configs / 5,120 dayCells / 1,120 deload day builds / 150 swap cards.
const MINI_LATTICE = {
  tiers : ['commercial','home_full','crossfit','home_basic','minimal'],  // bodyweight EXCLUDED
  focus : ['balanced'],
  exps  : ['beginner','advanced'],
  goals : ['half','marathon'],
  injuries:['healthy'],
  rests : ['sun','sun+wed','sat+sun'],
  seeds : [1],
  expect: {configs:60, dayCells:5120, deloadDayBuilds:1120, swapCards:150}
};
const GOAL_DEF={half:{k:'half',id:'run_half'},marathon:{k:'marathon',id:'run_marathon'}};
const REST_DEF={sun:['sun'],'sun+wed':['sun','wed'],'sat+sun':['sat','sun']};
// Injury map used ONLY by the PINSINJ diagnostic override below. The ruled lattice is
// healthy-only; this exists so the P3 singleton question can be asked of the axis the
// ruled lattice excludes, without changing MINI_LATTICE.
const INJ_DEF={healthy:null,'shoulder/protect':{region:'shoulder',tier:'protect'},
 'lowback/protect':{region:'lowback',tier:'protect'},'knee/protect':{region:'knee',tier:'protect'},
 'shoulder/train_around':{region:'shoulder',tier:'train_around'},'lowback/train_around':{region:'lowback',tier:'train_around'}};
function miniCfg(tier,focus,exp,goalKey,injKey,restKey,seed){
  const g=GOAL_DEF[goalKey], isRace=true;
  const c={name:'M',primaryPath:'event',cardioTypes:['run'],
    cardioGoals:{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}},
    eventTargeted:isRace,raceDate:'2026-12-06',liftingFocus:focus,experience:exp,
    ageBracket:'18-35',equipment:tier,unit:'lbs',restDays:REST_DEF[restKey].slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
  if(INJ_DEF[injKey])c.injury={region:INJ_DEF[injKey].region,tier:INJ_DEF[injKey].tier};
  return c;
}
function miniLattice(){const L=[],M=Object.assign({},MINI_LATTICE);
 if(process.env.PINSINJ)M.injuries=process.env.PINSINJ.split(',');
  for(const t of M.tiers)for(const f of M.focus)for(const x of M.exps)for(const gk of M.goals)
   for(const ik of M.injuries)for(const rk of M.rests)for(const sd of M.seeds)
    L.push({key:[t,f,x,gk,ik,rk,sd].join('|'),t,f,x,g:gk,i:ik,r:rk,seed:sd,
            cfg:miniCfg(t,f,x,gk,ik,rk,sd)});
  return L;}
module.exports={MINI_LATTICE,miniCfg,miniLattice};

// ══ HAND ORACLE ════════════════════════════════════════════════════════════
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

// ══ INSTRUMENT (g199's A_PIPE anchor, verbatim; count==1 asserted on BOTH artifacts) ══
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__G200)globalThis.__G200.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const SNAP_FN="globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),n:it.map(function(i){return String((i&&i.name)||'');})};});};";
function instrument(art,tag){const RAW=fs.readFileSync(art,'utf8');const n=RAW.split(A_PIPE).length-1;
 if(n!==1)return{err:n};const out=path.join(os.tmpdir(),'v200pins_'+tag+'_'+process.pid+'.html');
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
 // P1 — V198 family total, ALL day builds, read at p2 (present AFTER deload)
 p1FamSecs:0,p1FamCards:0,p1FamByLabel:{},p1FamSecsP1:0,
 // P2c — positive limb population, read off p1 (the deload's INPUT)
 bothEnterDl:0,p2cSwapCards:0,p2cByGoal:{},p2cByTier:{},p2cByExp:{},p2cByRest:{},p2cItems:{},
 // P3 — singleton census OFF THE SHIPPED CARD
 p3BareSingletonPost:0,p3ByGoal:{},p3Items:{},p3Examples:[],p3OfSwap:0,
 p3Census:{},p3SingleAny:0,p3SingleItems:{},p3SingleEx:[],p3ShipFamSecsDl:0,
 // P4 — survival of B to the shipped card
 p4Survive:0,p4Loss:{},p4Examples:[],
 // P5 — expected-survivor oracle violations at p2
 p5Viol:0,p5ViolShape:{},p5Census:{},
 // identity / neutrality
 shipDigest:''}}

function sweep(mine,instFile,plainFile){
 const IA=load(instFile);IA.eval(SNAP_FN+"globalThis.__G200=[];");
 const PL=plainFile?load(plainFile):null;
 const S=blank(); const dig=[];
 mine.forEach(L=>{
  IA.eval("globalThis.__G200.length=0;");
  const prog=IA.buildProgram(JSON.parse(JSON.stringify(L.cfg)));
  const REC=IA.eval('globalThis.__G200'); const W=(prog&&prog.weeks)||{};
  S.configs++;
  // neutrality: the same build on the UNINSTRUMENTED artifact must ship byte-identical sections
  if(PL){const p2=PL.buildProgram(JSON.parse(JSON.stringify(L.cfg)));
   const a=JSON.stringify(Object.keys(W).sort().map(w=>Object.keys(W[w]).sort().map(d=>shipSnap(W[w][d]))));
   const b=JSON.stringify(Object.keys(p2.weeks||{}).sort().map(w=>Object.keys(p2.weeks[w]).sort().map(d=>shipSnap(p2.weeks[w][d]))));
   dig.push(L.key+':'+(a===b?'SAME':'DIFF'));}
  REC.forEach(r=>{
   S.dayCells++;
   const ship=shipSnap(((W[r.w]||{})[r.d])||null);
   // ── P1: family present after deload, ALL day builds (p2 = post-deload stage) ──
   let famHere=0;
   FAM.forEach(lb=>{const n=secOf(r.p2,lb).length; if(n){famHere+=n;S.p1FamByLabel[lb]=(S.p1FamByLabel[lb]||0)+n;}});
   FAM.forEach(lb=>{S.p1FamSecsP1+=secOf(r.p1,lb).length;});
   S.p1FamSecs+=famHere; if(famHere)S.p1FamCards++;
   if(!r.dl)return;
   S.dlDayBuilds++;
   const bPost=labPost(r.p1,'Pull superset B');
   const aPost=labPost(r.p1,'Pull superset A');
   const bothEnter=hasLab(r.p1,'Pull superset A')&&hasLab(r.p1,'Pull superset B');
   // ── P3: shipped bare `Pull`, ONE item, that item E_PAT posterior ──
   // FULL shipped pull-family census on deload cards: label x item-count x posterior content
   (ship||[]).filter(s=>FAM.includes(s.l)).forEach(s=>{S.p3ShipFamSecsDl++;
     bump(S.p3Census,s.l+' n='+(s.n||[]).length+' post='+((s.n||[]).filter(isPost).length));
     if((s.n||[]).length===1){S.p3SingleAny++;bump(S.p3SingleItems,s.l+' :: '+s.n[0]+(isPost(s.n[0])?' <POST>':''));
       if(S.p3SingleEx.length<3)S.p3SingleEx.push({cfg:L.key,card:'w'+r.w+' '+r.d,
         p1:(r.p1||[]).filter(x=>FAM.includes(x.l)).map(x=>x.l+' ['+x.n.join(' + ')+']'),
         SHIPPED:(ship||[]).map(x=>x.l+' ['+x.n.join(' + ')+']')});}});
   const bare=(ship||[]).filter(s=>s.l==='Pull'&&(s.n||[]).length===1&&isPost(s.n[0]));
   const pullFamIn=bothEnter||hasLab(r.p1,'Pull superset A')||hasLab(r.p1,'Pull superset B');
   if(bare.length&&pullFamIn){
    S.p3BareSingletonPost++; bump(S.p3ByGoal,L.g); bump(S.p3Items,bare[0].n[0]);
    if(bothEnter&&bPost)S.p3OfSwap++;
    if(S.p3Examples.length<3)S.p3Examples.push({cfg:L.key,card:'w'+r.w+' '+r.d,
      p1_A:secOf(r.p1,'Pull superset A').map(s=>s.n.join(' + ')),
      p1_B:secOf(r.p1,'Pull superset B').map(s=>s.n.join(' + ')),
      p2:(r.p2||[]).map(s=>s.l+' ['+s.n.join(' + ')+']'),
      p3:(r.p3||[]).map(s=>s.l+' ['+s.n.join(' + ')+']'),
      SHIPPED:(ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});}
   if(!bothEnter)return;
   S.bothEnterDl++;
   // ── P5: expected-survivor oracle at p2 ──
   const exp=bPost?'B':'A';
   const act=((hasLab(r.p2,'Pull superset A')?'A':'')+(hasLab(r.p2,'Pull superset B')?'B':''))||'none';
   bump(S.p5Census,'enterPost='+((aPost?'A':'')+(bPost?'B':'')||'none')+' exp='+exp+' surv='+act);
   if(act!==exp){S.p5Viol++;bump(S.p5ViolShape,'exp='+exp+' got='+act+' (Bpost='+bPost+')');}
   if(!bPost)return;
   // ── P2c: the positive limb ──
   S.p2cSwapCards++;
   bump(S.p2cByGoal,L.g);bump(S.p2cByTier,L.t);bump(S.p2cByExp,L.x);bump(S.p2cByRest,L.r);
   secOf(r.p1,'Pull superset B').forEach(s=>s.n.forEach(n=>{if(isPost(n))bump(S.p2cItems,n);}));
   // ── P4: does B reach the shipped card (survive capRegionalFatigue + capSessionBudget)? ──
   const bItems=[].concat(...secOf(r.p1,'Pull superset B').map(s=>s.n));
   const intact=(ship||[]).some(s=>(s.l==='Pull superset B')
     ||(s.l==='Pull'&&(s.n||[]).length&&s.n.every(n=>bItems.includes(n))));
   if(intact)S.p4Survive++;
   else{
    const shipPull=(ship||[]).filter(s=>FAM.includes(s.l));
    const at3=(r.p3||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
    const at2=(r.p2||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
    bump(S.p4Loss,'p2='+at2+' p3(capRegional)='+at3+' shipped='+(shipPull.map(s=>s.l).join(',')||'none'));
    if(S.p4Examples.length<3)S.p4Examples.push({cfg:L.key,card:'w'+r.w+' '+r.d,
      p1_B:bItems,p2:at2,p3:at3,shipped:(ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});}
  });});
 S.shipDigest=dig.join(';');
 return S;}

function merge(a,b){Object.keys(b).forEach(k=>{if(typeof b[k]==='number')a[k]=(a[k]||0)+b[k];
 else if(typeof b[k]==='string')a[k]=(a[k]?a[k]+';':'')+b[k];
 else if(Array.isArray(b[k]))a[k]=(a[k]||[]).concat(b[k]).slice(0,4);
 else if(b[k]&&typeof b[k]==='object'){a[k]=a[k]||{};merge(a[k],b[k]);}});return a;}

// ══ shard child ════════════════════════════════════════════════════════════
if(process.env.PINSHARD!==undefined){
 const si=+process.env.PINSHARD,sn=+process.env.PINSHARDS,ART=process.env.PINART;
 const ins=instrument(ART,'s'+si);
 if(ins.err!==undefined){fs.writeFileSync(process.env.PINOUT,JSON.stringify({anchor:ins.err}));process.exit(0);}
 const R=sweep(miniLattice().filter((_,i)=>i%sn===si),ins.file,process.env.PINPLAIN?ART:null);
 try{fs.unlinkSync(ins.file);}catch(e){}
 fs.writeFileSync(process.env.PINOUT,JSON.stringify(R));process.exit(0);}

// ══ parent ═════════════════════════════════════════════════════════════════
function main(){
const ART=path.resolve(process.argv[2]||path.join(__dirname,'..','..','index.html'));
const bad=PROBE.filter(([n,e])=>(isPost(n)?1:0)!==e);
console.log('hand-oracle blindness probe: '+(PROBE.length-bad.length)+'/'+PROBE.length+' correct'
 +(bad.length?'  MISREADS '+bad.map(x=>x[0]).join(','):''));
if(bad.length)process.exit(2);
const RAW=fs.readFileSync(ART,'utf8');
const ver=(RAW.match(/ia-version"\s+content="(\d+)"/)||[])[1];
const an=RAW.split(A_PIPE).length-1;
console.log('ARTIFACT '+ART+'   ia-version='+ver+'   A_PIPE anchor count='+an);
if(an!==1){console.log('REFUSED: instrument could not be placed. NOTHING WAS MEASURED.');process.exit(2);}
const SH=Math.max(1,parseInt(process.argv[3]||String(Math.min(6,os.cpus().length)),10));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v200pins-'));
(async()=>{
 const t0=Date.now(),outs=[];
 await new Promise((res,rej)=>{let fin=0;
  for(let i=0;i<SH;i++){const o=path.join(tmp,'sh'+i+'.json');outs.push(o);
   fork(__filename,[ART],{env:Object.assign({},process.env,{PINSHARD:String(i),PINSHARDS:String(SH),
    PINOUT:o,PINART:ART,PINPLAIN:'1'}),stdio:'inherit'})
    .on('exit',c=>{if(c!==0)return rej(new Error('shard '+i+' exited '+c));if(++fin===SH)res();});}});
 let R={};outs.forEach(o=>{R=merge(R,JSON.parse(fs.readFileSync(o,'utf8')));fs.unlinkSync(o);});
 try{fs.rmdirSync(tmp);}catch(e){}
 const M=MINI_LATTICE.expect;
 console.log('\n── LATTICE ── configs='+R.configs+'/'+M.configs+'  dayCells='+R.dayCells+'/'+M.dayCells
  +'  deloadDayBuilds='+R.dlDayBuilds+'/'+M.deloadDayBuilds+'  ['+((Date.now()-t0)/1000).toFixed(0)+'s]');
 const diffs=(R.shipDigest||'').split(';').filter(x=>/:DIFF$/.test(x));
 console.log('INSTRUMENT NEUTRALITY (instrumented vs plain artifact, shipped sections): '
  +((R.shipDigest||'').split(';').filter(Boolean).length-diffs.length)+'/'
  +((R.shipDigest||'').split(';').filter(Boolean).length)+' SAME'+(diffs.length?'  DIFF: '+diffs.join(','):''));
 console.log('\nP1  family {Pull superset A|B|Pull} present AFTER deload, all day builds');
 console.log('    sections = '+R.p1FamSecs+'   cards = '+R.p1FamCards+'   of '+R.dayCells+' day builds');
 console.log('    by label '+JSON.stringify(R.p1FamByLabel)+'   (same family read at p1 INPUT = '+R.p1FamSecsP1+')');
 console.log('\nP2c positive limb: both-enter deload pull cards with an E_PAT posterior in `Pull superset B` at p1');
 console.log('    = '+R.p2cSwapCards+' of '+R.bothEnterDl+' both-enter deload cards, of '+R.dlDayBuilds+' deload day builds');
 console.log('    byGoal '+JSON.stringify(R.p2cByGoal)+' byTier '+JSON.stringify(R.p2cByTier)
  +' byExp '+JSON.stringify(R.p2cByExp)+' byRest '+JSON.stringify(R.p2cByRest));
 console.log('    posterior items in B '+JSON.stringify(R.p2cItems));
 console.log('\nP3  SHIPPED CARD bare `Pull`, exactly ONE item, that item E_PAT posterior');
 console.log('    = '+R.p3BareSingletonPost+' of '+R.dlDayBuilds+' deload day builds   ('+R.p3OfSwap+' of the '+R.p2cSwapCards+' swap cards)');
 console.log('    byGoal '+JSON.stringify(R.p3ByGoal)+'  items '+JSON.stringify(R.p3Items));
 console.log('    CENSUS of all '+R.p3ShipFamSecsDl+' shipped pull-family sections on the '+R.dlDayBuilds+' deload day builds:');
 console.log('      '+JSON.stringify(R.p3Census));
 console.log('      shipped pull-family sections carrying exactly ONE item = '+R.p3SingleAny+' ; contents '+JSON.stringify(R.p3SingleItems));
 (R.p3SingleEx||[]).forEach((e,i)=>console.log('      SINGLETON EX '+(i+1)+' '+JSON.stringify(e)));
 (R.p3Examples||[]).forEach((e,i)=>console.log('    EXAMPLE '+(i+1)+' '+JSON.stringify(e,null,1).replace(/\n/g,'\n      ')));
 console.log('\nP4  of the '+R.p2cSwapCards+' B-holds-posterior cards, B (or its bare rename) reaches the SHIPPED card');
 console.log('    survivors = '+R.p4Survive+' / '+R.p2cSwapCards+'   losses = '+(R.p2cSwapCards-R.p4Survive));
 console.log('    loss shapes '+JSON.stringify(R.p4Loss));
 (R.p4Examples||[]).forEach((e,i)=>console.log('    LOSS '+(i+1)+' '+JSON.stringify(e)));
 console.log('\nP5  expected-survivor oracle at p2 (survivor is B iff B holds E_PAT posterior at p1, else A)');
 console.log('    VIOLATIONS = '+R.p5Viol+' of '+R.bothEnterDl+' both-enter deload cards');
 console.log('    violation shapes '+JSON.stringify(R.p5ViolShape));
 console.log('    full census '+JSON.stringify(R.p5Census));
})().catch(e=>{console.log('FAILED MEASUREMENT: '+e.message);process.exit(1);});
}
if(require.main===module)main();
