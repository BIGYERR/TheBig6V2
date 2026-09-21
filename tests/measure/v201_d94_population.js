// ═══════════════════════════════════════════════════════════════════════════════════════
// v201_d94_population.js — MEASURE PASS for D94 (read-only; rules nothing, fixes nothing).
//
// Runs §12's seven D94 items (4 STRUCK) on the SHIPPED V200 artifact, plus the D94
// counterfactual, plus the zeroth item: re-establishing the D94 baseline on V200 after
// V200 shipped D89.
//
// ORACLE INDEPENDENCE. "Posterior chain" is the E_PAT hand table typed from doctrine
// movement names, byte-identical to g199/g200/v200_m1_population, printed with its
// 17-name blindness probe before any number. `_isPostChain` and `_pattern` are NEVER
// consulted by the instrument. "Vertical pull" is a second hand table (V_PULL) with its
// own probe. The D91-flip and D94-revert populations are read by DIFFING three artifacts,
// never by re-implementing the pre-pass's own arithmetic.
//
// index.html is NEVER written. All mutants are scratch copies.
//
// usage: node tests/measure/v201_d94_population.js <artifact.html> <scratchdir> [items]
// ═══════════════════════════════════════════════════════════════════════════════════════
const path=require('path'), fs=require('fs'), os=require('os'), crypto=require('crypto');
const {load, fixtures, progDigest}=require(path.join(__dirname,'..','harness.js'));

const ART=path.resolve(process.argv[2]||path.join(__dirname,'..','..','index.html'));
const SCR=path.resolve(process.argv[3]||os.tmpdir());
const ONLY=(process.argv[4]||'').split(',').filter(Boolean);
const want=k=>!ONLY.length||ONLY.includes(k);

// ══ HAND ORACLE 1: posterior chain (byte-identical to g199/g200) ═════════════════════
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

// ══ HAND ORACLE 2: vertical pull (item 3). Typed from the movement names, not from any
//    engine predicate. A vertical pull loads the lat from overhead: bar/ring/rope above
//    the shoulder, elbow travelling from overhead to the ribs. Rows are horizontal and
//    must read 0; face pulls and pullovers are neither and must read 0.
const V_PULL=/pull-?down|pull-?up|pullup|chin-?up|chinup|lat prayer|muscle-?up|\bhang(ing)? row\b(?!)|kneeling.*pulldown|straight-?arm pulldown|\bpull-?ups?\b/i;
const isVPull=n=>V_PULL.test(String(n||''));
const VPROBE=[['Lat pulldown',1],['Neutral-grip pulldown',1],['Chinups',1],['Pull-ups',1],
 ['Assisted pull-up',1],['Kneeling band pulldown',1],['Straight-arm pulldown',1],
 ['Barbell row',0],['Pendlay row',0],['Chest-supported row',0],['Face pull',0],
 ['Dumbbell pullover',0],['Inverted row (supinated, under a table)',0],['Kettlebell swing',0]];

function probes(){
 const b1=PROBE.filter(([n,e])=>(isPost(n)?1:0)!==e);
 const b2=VPROBE.filter(([n,e])=>(isVPull(n)?1:0)!==e);
 console.log('ORACLE PROBE  E_PAT posterior '+(PROBE.length-b1.length)+'/'+PROBE.length
  +(b1.length?'  MISREADS '+b1.map(x=>x[0]).join(','):'')
  +'   |  V_PULL vertical '+(VPROBE.length-b2.length)+'/'+VPROBE.length
  +(b2.length?'  MISREADS '+b2.map(x=>x[0]).join(','):''));
 if(b1.length||b2.length){console.log('REFUSED: a hand oracle is blind. NOTHING MEASURED.');process.exit(2);}
}

// ══ the deload loop's own candidacy tests, carried byte-identical ════════════════════
const KMAIN=/^main\b|^primer|^power\b|^strength\b/, KPREHAB=/hip|mobility|stretch/, KFLUFF=/carry|finisher|conditioning|explosive/;
const isMainClass=s=>KMAIN.test(String(s.l||'').toLowerCase());
const isCandidate=s=>{const L=String(s.l||'').toLowerCase();
  if(KMAIN.test(L))return false; if(s.hip||KPREHAB.test(L))return false;
  if(s.opt||KFLUFF.test(L))return false; return true;};
const famOf=l=>{const L=String(l||'');
  if(/^Pull\b/.test(L))return'pull'; if(/^Leg\b/.test(L))return'leg';
  if(/^Push\b/.test(L))return'push'; if(/^Upper\b/.test(L))return'upper';
  if(/^Row\b/.test(L))return'row'; if(/^Core\b/.test(L))return'core';
  if(/^Lower\b/.test(L))return'lower'; if(/^Accessory\b/.test(L))return'accessory';
  return 'other:'+L;};
const bump=(o,k)=>{o[k]=(o[k]||0)+1;};
const secPost=s=>(s.n||[]).some(isPost);

// ══ LATTICES ═════════════════════════════════════════════════════════════════════════
const ALL_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const MINI_TIERS=['commercial','home_full','crossfit','home_basic','minimal'];
const ALL_INJ=['healthy','shoulder/protect','lowback/protect','knee/protect','shoulder/train_around','lowback/train_around'];
const E_INJ4=['healthy','shoulder/protect','lowback/protect','knee/protect'];
const RESTS=['sun','sun+wed','sat+sun'];
const LATTICES={
 // g200's ruled mini lattice, axes LIFTED from tests/measure/v200_g200_pins.js MINI_LATTICE
 mini:{tiers:MINI_TIERS,focus:['balanced'],exps:['beginner','advanced'],goals:['half','marathon'],
       injuries:['healthy'],rests:RESTS,seeds:[1]},
 // g200's PINSINJ diagnostic override (item 8)
 miniinj:{tiers:MINI_TIERS,focus:['balanced'],exps:['beginner','advanced'],goals:['half','marathon'],
       injuries:ALL_INJ,rests:RESTS,seeds:[1]},
 // L-healthy: tests/measure/v200_pullswap_coverage.js LAT, verbatim. 2,916 / 214,326.
 healthy:{tiers:ALL_TIERS,focus:['hypertrophy','balanced','strength'],exps:['beginner','intermediate','advanced'],
       goals:['liftonly','pace','mile','half','5k','marathon'],injuries:['healthy'],rests:RESTS,seeds:[1013,3039,7717]},
 // L-injury: THE DEFINITION WAS NOT KEPT in tests/measure/. Two factorisations both give
 // 1,296 configs and (at goals half+marathon) 112 cards/config = 145,152. Both measured.
 linjA:{tiers:ALL_TIERS,focus:['hypertrophy','balanced','strength'],exps:['beginner','advanced'],
       goals:['half','marathon'],injuries:ALL_INJ,rests:RESTS,seeds:[1]},
 linjB:{tiers:ALL_TIERS,focus:['hypertrophy','balanced','strength'],exps:['beginner','intermediate','advanced'],
       goals:['half','marathon'],injuries:E_INJ4,rests:RESTS,seeds:[1]},
 // item 7: every goal, on the mini lattice's other axes
 goals:{tiers:MINI_TIERS,focus:['balanced'],exps:['beginner','advanced'],
       goals:['liftonly','pace','base','mile','5k','10k','half','marathon'],injuries:['healthy'],rests:RESTS,seeds:[1]},
 // item 9 / D91: g199_deload_arbitration's 1,728-key lattice (v199_d91 E_* axes verbatim)
 g199:{tiers:ALL_TIERS,focus:['hypertrophy','balanced'],exps:['beginner','advanced'],
       goals:['liftonly','pace','half'],injuries:E_INJ4,rests:RESTS,seeds:[1013,3039]},
};
const GOAL_DEF={liftonly:null,pace:'run_pace_goal',base:'run_base',mile:'run_mile_goal',
 '5k':'run_5k','10k':'run_10k',half:'run_half',marathon:'run_marathon'};
const REST_DEF={sun:['sun'],'sun+wed':['sun','wed'],'sat+sun':['sat','sun']};
const INJ_DEF={healthy:null,'shoulder/protect':{region:'shoulder',tier:'protect'},
 'lowback/protect':{region:'lowback',tier:'protect'},'knee/protect':{region:'knee',tier:'protect'},
 'shoulder/train_around':{region:'shoulder',tier:'train_around'},'lowback/train_around':{region:'lowback',tier:'train_around'}};
function mkCfg(t,f,x,gk,ik,rk,sd){const id=GOAL_DEF[gk];const isRace=!!id&&/5k|10k|half|marathon/.test(id);
 const c={name:'M',primaryPath:id?(isRace?'event':'cardio'):'lift',cardioTypes:id?['run']:[],
  cardioGoals:id?{run:{id,label:gk,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
   baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
  eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:f,experience:x,
  ageBracket:'18-35',equipment:t,unit:'lbs',restDays:REST_DEF[rk].slice(),
  days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed:sd};
 if(INJ_DEF[ik])c.injury={region:INJ_DEF[ik].region,tier:INJ_DEF[ik].tier};
 return c;}
function build(name){const A=LATTICES[name],L=[];
 for(const t of A.tiers)for(const f of A.focus)for(const x of A.exps)for(const gk of A.goals)
  for(const ik of A.injuries)for(const rk of A.rests)for(const sd of A.seeds)
   L.push({key:[t,f,x,gk,ik,rk,sd].join('|'),t,f,x,g:gk,i:ik,r:rk,seed:sd,cfg:mkCfg(t,f,x,gk,ik,rk,sd)});
 return L;}

// ══ INSTRUMENT: g199/g200's A_PIPE anchor verbatim, extended with __p0 (PRE injury
//    filter) so item 5 can print the mechanism. SNAP3 records label/hip/optional/names.
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p0=buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext});",
"      var __p1=applyInjuryFilter(__p0,cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__V201)globalThis.__V201.push({w:String(w),d:String(d),role:String(role),dl:!!isRecoveryWeek(w),p0:globalThis.__SNAP3(__p0),p1:globalThis.__SNAP3(__p1),p2:globalThis.__SNAP3(__p2),p3:globalThis.__SNAP3(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const SNAP_FN="globalThis.__SNAP3=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),hip:!!(s&&s.hip),opt:!!(s&&s.optional),"
 +"n:it.map(function(i){return String((i&&i.name)||'');})};});};";

// ══ MUTANTS (scratch copies only) ════════════════════════════════════════════════════
const A_PREPASS="  let pickIdx=-1;\n  for(let i=0;i<sections.length;i++){";
// B = pre-D91 push order: the pre-pass never picks.
const R_NOPREPASS="  let pickIdx=-1;\n  for(let i=0;i<sections.length&&false;i++){";
// C = the proposed D94 fix: arbitrate ONLY when no Main-class section holds a posterior.
const R_D94FIX="  let pickIdx=-1;\n  const __mainPost=sections.some(s=>s&&/^main\\b|^primer|^power\\b|^strength\\b/.test((s.label||'').toLowerCase())&&(s.items||[]).some(it=>it&&_isPostChain(it.name)));\n  for(let i=0;i<sections.length&&!__mainPost;i++){";

function mkArtifact(tag, mutA, mutR){
 let RAW=fs.readFileSync(ART,'utf8');
 const nPipe=RAW.split(A_PIPE).length-1;
 if(nPipe!==1) throw new Error('A_PIPE anchor count='+nPipe+' — instrument NOT placed, nothing measured');
 RAW=RAW.replace(A_PIPE,A_PIPE_R);
 if(mutA){const n=RAW.split(mutA).length-1;
  if(n!==1) throw new Error('mutation anchor '+tag+' count='+n+' — NOT-APPLIED, nothing measured');
  RAW=RAW.replace(mutA,mutR);}
 const f=path.join(SCR,'v201_'+tag+'.html');
 try{fs.unlinkSync(f);}catch(e){}
 fs.writeFileSync(f,RAW);
 return f;
}

// ══ sweep: one artifact, one lattice -> per-card records ═════════════════════════════
const shipSnap=day=>((day&&day.sections)||[]).map(s=>({l:String((s&&s.label)||''),
 n:((s&&s.items)||[]).map(i=>String((i&&i.name)||''))}));
function sweep(file, lat, cb){
 const IA=load(file); IA.eval(SNAP_FN+"globalThis.__V201=[];");
 lat.forEach(L=>{
  IA.eval("globalThis.__V201.length=0;");
  const prog=IA.buildProgram(JSON.parse(JSON.stringify(L.cfg)));
  const REC=IA.eval('globalThis.__V201'); const W=(prog&&prog.weeks)||{};
  REC.forEach(r=>{r.ship=shipSnap(((W[r.w]||{})[r.d])||null);});
  cb(L,REC,prog);
 });
 return IA;
}
const secOf=(c,lb)=>(c||[]).filter(s=>s.l===lb&&(s.n||[]).length);
const hasLab=(c,lb)=>secOf(c,lb).length>0;
const survivors=c=>(c||[]).filter(isCandidate).filter(s=>(s.n||[]).length).map(s=>s.l).join(',');

module.exports={LATTICES,build,mkCfg,isPost,isVPull,E_PAT};

// ═════════════════════════════════════════════════════════════════════════════════════
if(require.main!==module) return;
probes();
const RAWV=fs.readFileSync(ART,'utf8');
console.log('ARTIFACT '+ART+'  ia-version='+((RAWV.match(/ia-version"\s+content="(\d+)"/)||[])[1]));
console.log('lattice sizes: '+Object.keys(LATTICES).map(k=>k+'='+build(k).length).join('  '));

const A_FILE=mkArtifact('A',null,null);
console.log('instrument placed (A_PIPE count==1). scratch: '+A_FILE);

// ── neutrality + self-stability: the instrumented artifact must ship what the plain one
//    ships, and the baseline must equal itself before anything is diffed.
{
 const PL=load(ART), IN=load(A_FILE);
 const d1=progDigest(PL.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
 const d2=progDigest(PL.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
 const d3=progDigest(IN.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
 console.log('BASELINE SELF-EQUAL  plain=='+(d1===d2?'YES':'NO -- ENGINE NONDETERMINISTIC, EVERY NUMBER VOID')
  +'   HALF_MANNY digest '+d1+'   instrumented=='+(d3===d1?'SAME':'DIFF '+d3));
 if(d1!==d2){process.exit(2);}
 let same=0,diff=0;
 build('mini').forEach(L=>{
  const a=JSON.stringify((PL.buildProgram(JSON.parse(JSON.stringify(L.cfg))).weeks));
  const b=JSON.stringify((IN.buildProgram(JSON.parse(JSON.stringify(L.cfg))).weeks));
  if(a===b)same++;else diff++;});
 console.log('INSTRUMENT NEUTRALITY on mini: '+same+' SAME / '+diff+' DIFF of '+(same+diff));
}

// ═════ ITEM 0 + 1 + 2 + 3 + 5 + 6 + 7 + 8 : single-artifact sweeps on V200 ═══════════
function blank(){return{configs:0,cards:0,dl:0,dlByGoal:{},cardsByGoal:{},
 bothEnter:0,swap:0,swapByGoal:{},swapByTier:{},swapByFocus:{},swapByExp:{},swapByInj:{},swapByRest:{},swapBySeed:{},
 swapPostMain:0,swapMainItems:{},swapNoPostMainEx:[],swapBItems:{},swapShipSurv:0,swapShipLoss:{},
 vpTotal:0,vpOnlyInA:0,vpLost:0,vpLostNames:{},vpElsewhere:0,vpByGoal:{},vpEx:[],
 br:0,brByFam:{},brByFamGoal:{},brCardFams:{},brByTier:{},brByExp:{},brEx:[],
 dlPostMain:0,dlAnyPostCand:0,
 lbEx:[],lbBpostP0:0,lbBpostP1:0,lbPullDl:0,
 ssdStage:{},ssdEx:[],
 singA2B:0,singA2Bpost:0,singA2BEx:[],
 pullDlByGoal:{},bothByGoal:{},
}}
function runSweep(latName){
 const S=blank(), lat=build(latName);
 sweep(A_FILE,lat,(L,REC)=>{
  S.configs++;
  REC.forEach(r=>{
   S.cards++; bump(S.cardsByGoal,L.g);
   // item 6: at which stage does `Dumbbell split-stance deadlift` first appear?
   ['p0','p1','p2','p3','ship'].forEach((st,k)=>{
    const here=(r[st]||[]).some(s=>(s.n||[]).some(n=>/split-stance deadlift/i.test(n)));
    const prev=k?(r[['p0','p1','p2','p3','ship'][k-1]]||[]).some(s=>(s.n||[]).some(n=>/split-stance deadlift/i.test(n))):false;
    if(here&&!prev){bump(S.ssdStage,st+(k?' (absent at '+['p0','p1','p2','p3','ship'][k-1]+')':' buildSections'));
     if(S.ssdEx.length<4)S.ssdEx.push({cfg:L.key,card:'w'+r.w+' '+r.d,role:r.role,stage:st,
       where:(r[st]||[]).filter(s=>(s.n||[]).some(n=>/split-stance deadlift/i.test(n))).map(s=>s.l+' ['+s.n.join(' + ')+']')});}
   });
   if(!r.dl) return;
   S.dl++; bump(S.dlByGoal,L.g);
   const mainPost=(r.p1||[]).some(s=>isMainClass(s)&&secPost(s));
   const cands=(r.p1||[]).filter(isCandidate).filter(s=>(s.n||[]).length);
   const postCands=cands.filter(secPost);
   if(mainPost)S.dlPostMain++;
   if(postCands.length)S.dlAnyPostCand++;
   // ── ITEM 2: blast radius = Main posterior AND >=1 posterior accessory candidate ──
   if(mainPost&&postCands.length){
    S.br++; bump(S.brByTier,L.t); bump(S.brByExp,L.x);
    const fams=[...new Set(postCands.map(s=>famOf(s.l)))].sort();
    bump(S.brCardFams,fams.join('+'));
    fams.forEach(f=>{bump(S.brByFam,f); bump(S.brByFamGoal,f+'|'+L.g);});
    if(S.brEx.length<3)S.brEx.push({cfg:L.key,card:'w'+r.w+' '+r.d,role:r.role,
      main:(r.p1||[]).filter(isMainClass).map(s=>s.l+' ['+s.n.join(' + ')+']'),
      postCands:postCands.map(s=>s.l+' ['+s.n.join(' + ')+']'),
      shipped:(r.ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});
   }
   // ── pull family ──
   const aIn=hasLab(r.p1,'Pull superset A'), bIn=hasLab(r.p1,'Pull superset B');
   if(aIn||bIn)bump(S.pullDlByGoal,L.g);
   // item 5 mechanism, lowback/protect: B posterior BEFORE vs AFTER the injury filter
   if(aIn||bIn||hasLab(r.p0,'Pull superset B')){
    S.lbPullDl++;
    const b0=secOf(r.p0,'Pull superset B').some(secPost);
    const b1=secOf(r.p1,'Pull superset B').some(secPost);
    if(b0)S.lbBpostP0++; if(b1)S.lbBpostP1++;
    if(b0&&!b1&&S.lbEx.length<3)S.lbEx.push({cfg:L.key,card:'w'+r.w+' '+r.d,
      p0:(r.p0||[]).filter(s=>/^Pull/.test(s.l)).map(s=>s.l+' ['+s.n.join(' + ')+']'),
      p1:(r.p1||[]).filter(s=>/^Pull|^Row/.test(s.l)).map(s=>s.l+' ['+s.n.join(' + ')+']'),
      shipped:(r.ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});
   }
   if(!(aIn&&bIn))return;
   S.bothEnter++; bump(S.bothByGoal,L.g);
   const bPost=secOf(r.p1,'Pull superset B').some(secPost);
   // ── ITEM 8: survivor moved from a SINGLETON A to a two-item B ──
   if(bPost&&secOf(r.p1,'Pull superset A').every(s=>s.n.length===1)&&secOf(r.p1,'Pull superset B').some(s=>s.n.length>=2)){
    S.singA2B++; if(mainPost)S.singA2Bpost++;
    if(S.singA2BEx.length<3)S.singA2BEx.push({cfg:L.key,card:'w'+r.w+' '+r.d,mainPost,
      main:(r.p1||[]).filter(isMainClass).map(s=>s.l+' ['+s.n.join(' + ')+']'),
      A:secOf(r.p1,'Pull superset A').map(s=>s.n.join(' + ')),
      B:secOf(r.p1,'Pull superset B').map(s=>s.n.join(' + ')),
      shipped:(r.ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});}
   if(!bPost)return;
   // ── THE D94 SWAP CARD (intrinsic definition, one artifact, read at p1) ──
   S.swap++; bump(S.swapByGoal,L.g);bump(S.swapByTier,L.t);bump(S.swapByFocus,L.f);
   bump(S.swapByExp,L.x);bump(S.swapByInj,L.i);bump(S.swapByRest,L.r);bump(S.swapBySeed,String(L.seed));
   // ITEM 1: posterior Main on the swap card
   if(mainPost){S.swapPostMain++;
    (r.p1||[]).filter(isMainClass).forEach(s=>s.n.filter(isPost).forEach(n=>bump(S.swapMainItems,n)));
   } else if(S.swapNoPostMainEx.length<4){
    S.swapNoPostMainEx.push({cfg:L.key,card:'w'+r.w+' '+r.d,role:r.role,
     main:(r.p1||[]).filter(isMainClass).map(s=>s.l+' ['+s.n.join(' + ')+']'),
     A:secOf(r.p1,'Pull superset A').map(s=>s.n.join(' + ')),
     B:secOf(r.p1,'Pull superset B').map(s=>s.n.join(' + '))});}
   secOf(r.p1,'Pull superset B').forEach(s=>s.n.forEach(n=>{if(isPost(n))bump(S.swapBItems,n);}));
   // survival of B to the shipped card
   const bItems=[].concat(...secOf(r.p1,'Pull superset B').map(s=>s.n));
   const intact=(r.ship||[]).some(s=>(s.l==='Pull superset B')||(s.l==='Pull'&&(s.n||[]).length&&s.n.every(n=>bItems.includes(n))));
   if(intact)S.swapShipSurv++; else bump(S.swapShipLoss,(r.ship||[]).filter(s=>/^Pull/.test(s.l)).map(s=>s.l).join(',')||'none');
   // ── ITEM 3: vertical-pull loss ──
   const vpA=[].concat(...secOf(r.p1,'Pull superset A').map(s=>s.n)).filter(isVPull);
   const vpAll=[].concat(...(r.p1||[]).map(s=>s.n)).filter(isVPull);
   if(vpAll.length)S.vpTotal++;
   if(vpA.length&&vpAll.length===vpA.length){
    S.vpOnlyInA++;
    const vpShip=[].concat(...(r.ship||[]).map(s=>s.n)).filter(isVPull);
    if(!vpShip.length){S.vpLost++; bump(S.vpByGoal,L.g); vpA.forEach(n=>bump(S.vpLostNames,n));
     if(S.vpEx.length<3)S.vpEx.push({cfg:L.key,card:'w'+r.w+' '+r.d,
       A:secOf(r.p1,'Pull superset A').map(s=>s.n.join(' + ')),
       B:secOf(r.p1,'Pull superset B').map(s=>s.n.join(' + ')),
       shipped:(r.ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});}
    else S.vpElsewhere++;
   }
  });
 });
 return S;
}
function report(name,S){
 const lat=LATTICES[name];
 console.log('\n╔═══ LATTICE '+name+' ═══  configs='+S.configs+'  dayCells='+S.cards+'  deloadDayBuilds='+S.dl);
 console.log('  deload builds by goal '+JSON.stringify(S.dlByGoal));
 console.log('  deload pull-family cards by goal '+JSON.stringify(S.pullDlByGoal)+'   both-A-and-B enter by goal '+JSON.stringify(S.bothByGoal));
 console.log('  [D94 SWAP CARDS] both enter AND B holds an E_PAT posterior = '+S.swap+' of '+S.bothEnter+' both-enter, of '+S.dl+' deload day builds');
 console.log('     byGoal '+JSON.stringify(S.swapByGoal)+' byTier '+JSON.stringify(S.swapByTier));
 console.log('     byFocus '+JSON.stringify(S.swapByFocus)+' byExp '+JSON.stringify(S.swapByExp)+' byInj '+JSON.stringify(S.swapByInj)+' byRest '+JSON.stringify(S.swapByRest)+' bySeed '+JSON.stringify(S.swapBySeed));
 console.log('     posterior items in the surviving B '+JSON.stringify(S.swapBItems));
 console.log('     B survives to the SHIPPED card '+S.swapShipSurv+'/'+S.swap+'   losses '+JSON.stringify(S.swapShipLoss));
 console.log('  ITEM 1  posterior MAIN under E_PAT on the swap cards = '+S.swapPostMain+'/'+S.swap
   +(S.swap?'  ('+(100*S.swapPostMain/S.swap).toFixed(1)+'%)':''));
 console.log('     main posterior items '+JSON.stringify(S.swapMainItems));
 if(S.swapNoPostMainEx.length)console.log('     EXCEPTIONS (swap card, NO posterior main): '+JSON.stringify(S.swapNoPostMainEx,null,1));
 console.log('  ITEM 2  BLAST RADIUS: deload builds with a posterior MAIN and >=1 posterior accessory candidate = '
   +S.br+' of '+S.dl+' deload builds ('+(S.dl?(100*S.br/S.dl).toFixed(2):'0')+'%)');
 console.log('     posterior-main deload builds '+S.dlPostMain+'/'+S.dl+'   any-posterior-candidate '+S.dlAnyPostCand+'/'+S.dl);
 console.log('     by candidate FAMILY '+JSON.stringify(S.brByFam));
 console.log('     by family|goal '+JSON.stringify(S.brByFamGoal));
 console.log('     card family-combination '+JSON.stringify(S.brCardFams));
 console.log('     byTier '+JSON.stringify(S.brByTier)+' byExp '+JSON.stringify(S.brByExp));
 if(S.brEx.length)console.log('     examples '+JSON.stringify(S.brEx,null,1));
 console.log('  ITEM 3  VERTICAL PULL: swap cards whose ONLY vertical pull sits in `Pull superset A` = '+S.vpOnlyInA+'/'+S.swap);
 console.log('     of those, ZERO vertical pull on the shipped card = '+S.vpLost+'   (survived elsewhere '+S.vpElsewhere+')');
 console.log('     movements lost '+JSON.stringify(S.vpLostNames)+'   byGoal '+JSON.stringify(S.vpByGoal));
 if(S.vpEx.length)console.log('     examples '+JSON.stringify(S.vpEx,null,1));
 console.log('  ITEM 5  pull-family deload cards '+S.lbPullDl+': `Pull superset B` holds a posterior BEFORE applyInjuryFilter = '
   +S.lbBpostP0+', AFTER = '+S.lbBpostP1+'  (dropped by the filter: '+(S.lbBpostP0-S.lbBpostP1)+')');
 if(S.lbEx.length)console.log('     examples '+JSON.stringify(S.lbEx,null,1));
 console.log('  ITEM 6  `Dumbbell split-stance deadlift` first appears at stage '+JSON.stringify(S.ssdStage));
 if(S.ssdEx.length)console.log('     examples '+JSON.stringify(S.ssdEx,null,1));
 console.log('  ITEM 8  survivor singleton-A -> two-item-B = '+S.singA2B+'   of which posterior MAIN = '+S.singA2Bpost);
 if(S.singA2BEx.length)console.log('     examples '+JSON.stringify(S.singA2BEx,null,1));
 return S;
}

const RES={};
['mini','goals','miniinj','healthy','linjA','linjB'].forEach(n=>{if(want(n))RES[n]=report(n,runSweep(n));});

// ═════ ITEM 9: THE COUNTERFACTUAL (three artifacts, diffed) ══════════════════════════
if(want('cf')){
 const B_FILE=mkArtifact('B_noprepass',A_PREPASS,R_NOPREPASS);   // pre-D91 push order
 const C_FILE=mkArtifact('C_d94fix',A_PREPASS,R_D94FIX);         // the proposed D94 fix
 console.log('\n╔═══ ITEM 9  COUNTERFACTUAL ═══');
 console.log('  A = V200 shipped   B = pre-pass disabled (pre-D91 push order)   C = proposed D94 fix');
 // HALF_MANNY digests
 [['A',A_FILE],['B',B_FILE],['C',C_FILE]].forEach(([t,f])=>{
  const IA=load(f); const d=progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
  console.log('  HALF_MANNY digest '+t+' = '+d);});
 ['mini','healthy','linjA','g199'].forEach(latName=>{
  if(ONLY.length&&!ONLY.includes('cf:'+latName)&&!ONLY.includes('cf'))return;
  const lat=build(latName);
  const snapOf={};
  [['A',A_FILE],['B',B_FILE],['C',C_FILE]].forEach(([t,f])=>{
   const M={}; snapOf[t]=M;
   sweep(f,lat,(L,REC)=>{REC.forEach(r=>{M[L.key+'#'+r.w+'#'+r.d]={dl:r.dl,role:r.role,
     surv:survivors(r.p2), ship:crypto.createHash('md5').update(JSON.stringify(r.ship)).digest('hex').slice(0,12),
     shipPost:(r.ship||[]).some(s=>(s.n||[]).some(isPost)),
     mainPost:(r.p1||[]).some(s=>isMainClass(s)&&secPost(s)),
     fam:(function(){const c=(r.p1||[]).filter(isCandidate).filter(s=>(s.n||[]).length&&secPost(s));
       return [...new Set(c.map(s=>famOf(s.l)))].sort().join('+');})(),
     key:L.key, w:r.w};});});
  });
  const A=snapOf.A,B=snapOf.B,C=snapOf.C, keys=Object.keys(A);
  let AB=0,AC=0,BC=0,dl=0;const acByFam={},acByRole={},abByFam={},acOther={};let acRevertToPushOrder=0;
  let d91flip=0,d91flipLeg=0,d91flipLegMainPost=0,d91flipReverted=0,d91flipLegReverted=0,d91flipPull=0,d91flipPullReverted=0;
  const d91flipByFam={},d91revByFam={};
  keys.forEach(k=>{const a=A[k],b=B[k],c=C[k];if(!a.dl)return;dl++;
   if(a.ship!==b.ship)AB++;
   if(a.ship!==c.ship){AC++;bump(acByFam,a.fam||'(none)');bump(acByRole,a.role);
     if(c.surv===b.surv)acRevertToPushOrder++; else bump(acOther,'A='+a.surv+' B='+b.surv+' C='+c.surv);}
   if(b.ship!==c.ship)BC++;
   if(a.surv!==b.surv){d91flip++;bump(d91flipByFam,a.fam||'(none)');
     if(/leg/.test(a.fam||''))d91flipLeg++;
     if(/pull/.test(a.fam||''))d91flipPull++;
     if(/leg/.test(a.fam||'')&&a.mainPost)d91flipLegMainPost++;
     if(c.surv===b.surv){d91flipReverted++;bump(d91revByFam,a.fam||'(none)');
       if(/leg/.test(a.fam||''))d91flipLegReverted++;
       if(/pull/.test(a.fam||''))d91flipPullReverted++;}}
  });
  // zero-posterior DELOAD WEEKS (D91's own metric), per artifact, off the SHIPPED card
  const zw={};[['A',A],['B',B],['C',C]].forEach(([t,M])=>{
   const wk={};Object.keys(M).forEach(k=>{const r=M[k];if(!r.dl)return;
    const wkey=r.key+'#'+r.w;if(!(wkey in wk))wk[wkey]=false;if(r.shipPost)wk[wkey]=true;});
   zw[t]={total:Object.keys(wk).length,zero:Object.keys(wk).filter(x=>!wk[x]).length};});
  console.log('\n  ── lattice '+latName+' ('+lat.length+' configs, '+keys.length+' day cells, '+dl+' deload day builds)');
  console.log('     shipped-card differences   A vs B (D91 itself) = '+AB+'   A vs C (D94 fix) = '+AC+'   B vs C = '+BC);
  console.log('     zero-posterior DELOAD WEEKS  B(pre-D91) '+zw.B.zero+'/'+zw.B.total
    +'   A(V200) '+zw.A.zero+'/'+zw.A.total+'   C(D94 fix) '+zw.C.zero+'/'+zw.C.total);
  console.log('     D91 flip cards (survivor A != survivor B) = '+d91flip+'   byFam '+JSON.stringify(d91flipByFam));
  console.log('       of which LEG = '+d91flipLeg+'   LEG with a posterior MAIN = '+d91flipLegMainPost);
  console.log('       REVERTED by the D94 fix (C survivor == B survivor) = '+d91flipReverted
    +'   byFam '+JSON.stringify(d91revByFam)+'   LEG reverted = '+d91flipLegReverted+'   PULL reverted = '+d91flipPullReverted);
  console.log('     A->C changed cards byFam '+JSON.stringify(acByFam)+' byRole '+JSON.stringify(acByRole));
  console.log('       of the '+AC+', revert exactly to push order = '+acRevertToPushOrder
    +'   OTHER (a third outcome, ruled by neither D91 nor D94) = '+JSON.stringify(acOther));
 });
}
console.log('\nDONE');
