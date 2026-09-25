// g200_pull_arbitration — V200 D93 (amended): the PULL side of the deload arbitration.
//
// WHY THIS FILE EXISTS AT ALL. P1 and P2 were first written into g199_deload_arbitration.js.
// They were vacuous there: on g199's 1,728-key lattice all 1,440 both-enter pull cards read
// enterPost=none, so the positive limb of the iff (B holds a posterior item, therefore B
// survives) was never exercised and V198 and V199 read byte-identical pull censuses. A pin
// that cannot tell the two artifacts apart is not a pin. Coach retracted the siting and the
// pull pins moved here, onto a small lattice chosen because it CONTAINS the population:
// 150 swap cards, all of them exercising the positive limb.
//
// THE LATTICE IS LIFTED, NOT RETYPED. tests/measure/v200_g200_pins.js is the single
// declaration of the axes and of MINI_LATTICE.expect; this gate requires it. A gate and its
// measure disagreeing about the lattice is how this item went wrong the first time. A3/A3b
// assert configs===60 and dayCells===5120 so a drift in that module cannot pass unnoticed.
//   5 tiers (bodyweight EXCLUDED) x focus balanced x exp {beginner, advanced}
//   x goal {half, marathon} x injury healthy x 3 rest patterns x seed 1 alone
//   = 60 configs / 5,120 day builds / 1,120 deload day builds / 150 swap cards.
//
// ORACLE INDEPENDENCE, AND THE SPLIT-LENS OBJECTION. "Posterior chain" is the hand table
// E_PAT below, byte-identical to g199's, proved by a 17-name blindness probe whose expected
// column is hand-typed (A4). The four candidacy tests of g199's cls() are carried here
// byte-identical too and proved by a second hand-typed probe (A5), so the two files cannot
// drift into two different notions of what an accessory candidate is. cls() is PROVED here
// rather than applied to engine snapshots, because applying it needs the engine's _pattern
// and this gate calls neither _pattern nor _isPostChain. Outcomes are read off the p1/p2/p3
// section snapshots and, where a pin says so, off the shipped card.
//
// THERE IS NO BASELINE-RELATIVE ASSERTION IN THIS FILE. tests/sabotage.py passes no argv[3].
// Every number is an absolute count with its denominator printed beside it (D95).
//
// ACCEPTANCE PROPERTY, RE-PINNED BY D94 (V201). There is no longer an ia-version licence in
// this file. It was deleted rather than re-keyed to 201: no ruling is queued that reverses
// D94, and §10b keys an expiry to the artifact only when an era is known to end. THE PROOF
// BELOW REPLACES IT, and it must hold on all four artifacts:
//   V201 (D94 shipped)      all green.
//   V200                    P2 FAIL with EXACTLY 150 violations, P4 FAIL 0 of 150,
//                           P7 FAIL 0 of 150 (the artifact ships no vertical pull on them).
//   V199                    P2 FAIL with EXACTLY 150 violations, P4 FAIL 0 of 150,
//                           P7 FAIL 0 of 150.
//   V198                    GREEN, AND THAT IS CORRECT. V198 predates D91, A survives there,
//                           and the D94 rule predicts A there too. Do not "fix" this green:
//                           the suite still separates V198 from the rest because V198 is red
//                           on g199_deload_arbitration.js, D91's leg family.
// If P2 is GREEN on V200 the re-pin has failed and this file is to be rewritten, not adjusted.
// FAIL-by-150 on the predecessor is the whole proof a prose licence could never give.
//
// usage: node tests/gates/g200_pull_arbitration.js <candidate.html> [ignored]
// env:   G200_SHARDS (default min(4, cpus))
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));
const PINS=require(path.join(__dirname,'..','measure','v200_g200_pins.js'));
const {MINI_LATTICE, miniLattice}=PINS;
const ART=path.resolve(process.argv[2]||path.join(__dirname,'..','..','index.html'));
const LAT=miniLattice();
const EXPECT=MINI_LATTICE.expect;

// ── HAND ORACLE: posterior chain. Byte-identical to g199_deload_arbitration.js ─────────
const E_PAT=[
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i]];
const ePat=n=>{const t=String(n||'');for(const [p,r] of E_PAT) if(r.test(t)) return p; return null;};
const isPost=n=>{const p=ePat(n);return p==='hinge'||p==='hip_ext';};   // {hinge, hip_ext} and nothing else
// 17-name blindness probe, expected column hand-typed from the doctrine movement names.
// Ten negatives (four of them pull-side, because this is the pull gate) and seven positives.
const PROBE=[['Back squat',0],['Leg extension',0],['Lying leg curl',0],['Leg press',0],
  ['Dumbbell standing calf raise',0],['Wall sit',0],['Barbell row',0],['Lat pulldown',0],
  ['Chin-up',0],['Face pull',0],
  ['Nordic hamstring curl (anchored)',1],['Single-leg glute bridge',1],['Barbell Romanian deadlift',1],
  ['45° back extension',1],['Kettlebell swing',1],['Dumbbell split-stance deadlift',1],['Barbell hip thrust',1]];

// ── HAND ORACLE 2: vertical pull. LIFTED VERBATIM from tests/measure/v201_d94_population.js,
// where the D94 population was measured. Typed from the movement names, never from an engine
// predicate: this file calls neither _isPostChain nor _pattern nor any classifier of the app's.
// A vertical pull loads the lat from overhead — bar, ring or rope above the shoulder, elbow
// travelling from overhead to the ribs. Rows are HORIZONTAL and must read 0; face pulls and
// pullovers are neither and must read 0. Those four negatives are what make the table an
// oracle rather than a substring search for the word "pull".
const V_PULL=/pull-?down|pull-?up|pullup|chin-?up|chinup|lat prayer|muscle-?up|\bhang(ing)? row\b(?!)|kneeling.*pulldown|straight-?arm pulldown|\bpull-?ups?\b/i;
const isVPull=n=>V_PULL.test(String(n||''));
// A6 probe: 14 names, seven positives and seven negatives, expected column hand-typed.
const VPROBE=[['Lat pulldown',1],['Neutral-grip pulldown',1],['Chinups',1],['Pull-ups',1],
  ['Assisted pull-up',1],['Kneeling band pulldown',1],['Straight-arm pulldown',1],
  ['Barbell row',0],['Pendlay row',0],['Chest-supported row',0],['Face pull',0],
  ['Dumbbell pullover',0],['Inverted row (supinated, under a table)',0],['Kettlebell swing',0]];

// ── the deload loop's four candidacy tests. Byte-identical to g199's cls() ─────────────
const KMAIN=/^main\b|^primer|^power\b|^strength\b/, KPREHAB=/hip|mobility|stretch/, KFLUFF=/carry|finisher|conditioning|explosive/;
function cls(s){
  const L=String(s.l||'').toLowerCase();
  if(KMAIN.test(L)) return 'main';
  if(s.hip||KPREHAB.test(L)) return 'prehab';
  if(s.opt||KFLUFF.test(L)) return 'fluff';
  if(!(s.p||[]).some(p=>p)) return 'none';
  return 'cand';
}
// A5 probe: hand-typed sections, hand-typed expected class. Every one of the four tests is
// exercised in both directions, and the three PULL FAMILY labels are shown to land on 'cand'
// — the accessory-candidate bucket the arbitration draws from. Nothing here touches the engine.
const CLS_PROBE=[
  [{l:'Pull superset A',p:['pull']},'cand'],
  [{l:'Pull superset B',p:['pull','hinge']},'cand'],
  [{l:'Pull',p:['hinge']},'cand'],
  [{l:'Main strength',p:['squat']},'main'],
  [{l:'Primer',p:['power']},'main'],
  [{l:'Power block',p:['power']},'main'],
  [{l:'Strength block',p:['press']},'main'],
  [{l:'Hip mobility',p:['hinge']},'prehab'],
  [{l:'Pull superset A',hip:true,p:['pull']},'prehab'],
  [{l:'Explosive finisher',p:['power']},'fluff'],
  [{l:'Loaded carry',p:['carry']},'fluff'],
  [{l:'Pull superset B',opt:true,p:['pull']},'fluff'],
  [{l:'Pull superset A',p:[null,null]},'none'],
  [{l:'Pull superset B',p:[]},'none']];

// ── INSTRUMENT. Byte-identical anchor to g199's A_PIPE, at the week-assembly seam, well
// clear of recoveryDeload's body and of capSessionBudget so a sabotage mutation aimed at the
// ruling cannot silently un-anchor it (that would read as a CRASH, not a trip). The copy is
// written to tmp; the artifact is never written. A2 proves the copy is inert.
// __SNAP records LABEL and ITEM NAMES only. It does NOT call _pattern, and nothing in this
// file calls _isPostChain.
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__G200)globalThis.__G200.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const SNAP_FN="globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),n:it.map(function(i){return String((i&&i.name)||'');})};});};";
// V211 (D155): recoveryDeload reads the day's long-run tier, so the call site passes cardio. The
// instrument follows whichever call-site form the artifact carries; the V211 split passes cardio
// too, so the instrumented copy stays inert (A2). A_PIPE and A_PIPE_R above are unchanged.
const A_PIPE_D155=A_PIPE.replace('recoveryDeload(_s):_s','recoveryDeload(_s,cardio):_s');
const A_PIPE_R_D155=A_PIPE_R.replace('recoveryDeload(__p1):__p1','recoveryDeload(__p1,cardio):__p1');
function pipeFor(RAW){ return RAW.split(A_PIPE_D155).length-1===1?[A_PIPE_D155,A_PIPE_R_D155]:[A_PIPE,A_PIPE_R]; }
function instrument(art,tag){
  const RAW=fs.readFileSync(art,'utf8');
  const [AP,APR]=pipeFor(RAW);
  const n=RAW.split(AP).length-1;
  if(n!==1) return {err:n};
  const out=path.join(os.tmpdir(),'g200_'+tag+'_'+process.pid+'.html');
  fs.writeFileSync(out,RAW.replace(AP,APR));
  return {file:out};
}

// ── readers ───────────────────────────────────────────────────────────────────────────
const FAM=['Pull superset A','Pull superset B','Pull'];
const shipSnap=day=>((day&&day.sections)||[]).map(s=>({l:String((s&&s.label)||''),
   n:((s&&s.items)||[]).map(i=>String((i&&i.name)||''))}));
const secOf=(c,lb)=>(c||[]).filter(s=>s.l===lb&&(s.n||[]).length);
const hasLab=(c,lb)=>secOf(c,lb).length>0;
const labPost=(c,lb)=>secOf(c,lb).some(s=>(s.n||[]).some(isPost));
const bump=(o,k)=>{o[k]=(o[k]||0)+1;};

function blank(){return{configs:0,dayCells:0,dlDayBuilds:0,
  famP2:0,famP2Cards:0,famP2ByLabel:{},famP1:0,famP1ByLabel:{},
  bothEnter:0,mainPostCards:0,swapCards:0,swapItems:{},swapByGoal:{},swapByTier:{},swapByExp:{},swapByRest:{},
  census:{},viol:0,violShape:{},
  mainPostSwap:0,p7VPull:0,p7Names:{},p7Miss:[],
  p4Survive:0,p4Loss:{},p4Examples:[]};}

function sweep(mine,instFile){
  const IA=load(instFile); IA.eval(SNAP_FN+"globalThis.__G200=[];");
  const S=blank();
  mine.forEach(L=>{
    IA.eval("globalThis.__G200.length=0;");
    const prog=IA.buildProgram(JSON.parse(JSON.stringify(L.cfg)));
    const REC=IA.eval('globalThis.__G200'); const W=(prog&&prog.weeks)||{};
    S.configs++;
    REC.forEach(r=>{
      S.dayCells++;
      const ship=shipSnap(((W[r.w]||{})[r.d])||null);
      // ── P1: the pull family present AFTER the deload (read at p2), ALL day builds ──
      let famHere=0;
      FAM.forEach(lb=>{
        const n2=secOf(r.p2,lb).length; if(n2){famHere+=n2;S.famP2ByLabel[lb]=(S.famP2ByLabel[lb]||0)+n2;}
        const n1=secOf(r.p1,lb).length; if(n1){S.famP1+=n1;S.famP1ByLabel[lb]=(S.famP1ByLabel[lb]||0)+n1;}
      });
      S.famP2+=famHere; if(famHere)S.famP2Cards++;
      if(!r.dl) return;
      S.dlDayBuilds++;
      const aPost=labPost(r.p1,'Pull superset A');
      const bPost=labPost(r.p1,'Pull superset B');
      // D94: a Main-class section holding a posterior item at p1 SUPPRESSES the pre-pass.
      // SAME LENS BOTH SIDES, which is the pool/post-filter rule: the app tests KMAIN on the
      // section label and _isPostChain on the item name; this gate tests the same KMAIN (via
      // cls(), whose 'main' limb is label-only, so a __SNAP section suffices) and E_PAT on the
      // item name (via isPost()). Neither _pattern nor _isPostChain is called from this file.
      const mainPost=(r.p1||[]).some(s=>cls(s)==='main'&&(s.n||[]).some(isPost));
      const bothEnter=hasLab(r.p1,'Pull superset A')&&hasLab(r.p1,'Pull superset B');
      if(!bothEnter) return;
      S.bothEnter++;
      if(mainPost) S.mainPostCards++;
      // ── P2: expected survivor at p2. STAGE record, never the shipped card ──
      const exp=(bPost&&!mainPost)?'B':'A';
      const ep=((aPost?'A':'')+(bPost?'B':''))||'none';
      const act=((hasLab(r.p2,'Pull superset A')?'A':'')+(hasLab(r.p2,'Pull superset B')?'B':''))||'none';
      bump(S.census,'enterPost='+ep+(ep==='none'?'':' mainPost='+(mainPost?'yes':'no'))+' exp='+exp+' surv='+act);
      if(act!==exp){S.viol++;bump(S.violShape,'exp='+exp+' got='+act+' (Bpost='+bPost+' mainPost='+mainPost+')');}
      if(!bPost) return;
      // ── P2c: the positive limb ──
      S.swapCards++;
      bump(S.swapByGoal,L.g);bump(S.swapByTier,L.t);bump(S.swapByExp,L.x);bump(S.swapByRest,L.r);
      secOf(r.p1,'Pull superset B').forEach(s=>s.n.forEach(n=>{if(isPost(n))bump(S.swapItems,n);}));
      // ── P2d: does the D94 conjunct actually FIRE on this positive-limb card? Read off p1,
      //    the deload's INPUT, with the same cls() 'main' limb and the same E_PAT the app's
      //    own __mainPost uses on its side of the seam. ──
      if(mainPost) S.mainPostSwap++;
      // ── P7: the vertical pull, read off the SHIPPED card. This is the only other pin in
      //    this file that reads a shipped card (P4 is the first), and it is deliberate: P7
      //    asserts what the athlete ends up holding, not what the arbitration selected. ──
      const vp=[].concat(...(ship||[]).map(s=>s.n||[])).filter(isVPull);
      if(vp.length){S.p7VPull++;vp.forEach(n=>bump(S.p7Names,n));}
      else if(S.p7Miss.length<3)S.p7Miss.push({cfg:L.key,card:'w'+r.w+' '+r.d,
        shipped:(ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});
      // ── P4 (D94): does A reach the SHIPPED card (past capRegionalFatigue and
      //    capSessionBudget)? The block D94 keeps is A, so A is the one tracked end to end. ──
      const aItems=[].concat(...secOf(r.p1,'Pull superset A').map(s=>s.n));
      const intact=(ship||[]).some(s=>(s.l==='Pull superset A')
        ||(s.l==='Pull'&&(s.n||[]).length&&s.n.every(n=>aItems.includes(n))));
      if(intact) S.p4Survive++;
      else{
        const at2=(r.p2||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
        const at3=(r.p3||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
        const atS=(ship||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
        bump(S.p4Loss,'p2='+at2+' p3(capRegional)='+at3+' shipped='+atS);
        if(S.p4Examples.length<3)S.p4Examples.push({cfg:L.key,card:'w'+r.w+' '+r.d,
          p1_A:aItems,p2:at2,p3:at3,shipped:(ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});
      }
    });
  });
  return S;
}

function merge(a,b){Object.keys(b).forEach(k=>{
  if(typeof b[k]==='number')a[k]=(a[k]||0)+b[k];
  else if(Array.isArray(b[k]))a[k]=(a[k]||[]).concat(b[k]).slice(0,4);
  else if(b[k]&&typeof b[k]==='object'){a[k]=a[k]||{};merge(a[k],b[k]);}});return a;}

// ── shard child ───────────────────────────────────────────────────────────────────────
if(process.env.G200SHARD!==undefined){
  const si=+process.env.G200SHARD, sn=+process.env.G200SHARDS;
  const ins=instrument(ART,'s'+si);
  if(ins.err!==undefined){ fs.writeFileSync(process.env.G200OUT,JSON.stringify({anchor:ins.err})); process.exit(0); }
  const R=sweep(LAT.filter((_,i)=>i%sn===si),ins.file);
  try{fs.unlinkSync(ins.file);}catch(e){}
  fs.writeFileSync(process.env.G200OUT,JSON.stringify(R));
  process.exit(0);
}

// ── parent ────────────────────────────────────────────────────────────────────────────
let PASS=0,FAIL=0;
const ok=(c,m)=>{ if(c){PASS++;console.log('  ok   '+m);} else {FAIL++;console.log('  FAIL '+m);} };
// THE ia-version LICENCE IS GONE (V201, D94). P2, P2c, P4 and P6 used to run through a
// licence wrapper that armed them at or below ia-version 200 and REFUSED them above it. That
// predicate did its one job: it fired on V201, the build D94 was ruled for, and forced this
// re-pin instead of letting D94 inherit a green pin. It is deleted rather than re-keyed to 201
// because no ruling is queued that reverses D94, and §10b keys an expiry to the artifact only
// when an era is known to END. A >= 201 arm was considered and rejected: a stray V200 candidate
// reading REFUSED is weaker than the same candidate reading FAIL by exactly 150, and that FAIL
// is the proof the rule wants. The four pins are plain ok() rows now, like P1 and the floor.
// The 'REFUSED A2-P4' line further down is NOT this machinery: it reports an instrument that
// could not be placed, which is a real did-not-run, and it stays.
const done=()=>{ console.log('PASS '+PASS+' FAIL '+FAIL); process.exit(FAIL?1:0); };
const g=(o,k)=>(o&&o[k])||0;
// Hard floor in the shape the baseline-free gates use: an equality pin alone cannot stop a
// future lattice edit from silently returning this gate to the else-limb-only state that
// reported PASS while proving nothing. P2c carries BOTH the equality and this floor.
const NOBASE_MIN=1;

console.log('── A. instrument sanity and oracle sanity (every number below is void without these) ──');
const RAW=fs.readFileSync(ART,'utf8');
// D94 SHIPPED, SO THE PREDICATE THAT GUARDED THE D91-ERA PINS IS GONE, NOT RE-KEYED. What
// stood here read ia-version off the candidate and refused P2, P2c, P4 and P6 above 200. It
// fired exactly once, on V201, which is what forced this re-pin. Keeping a mirrored >= 201
// arm would only make a stray V200 candidate read REFUSED instead of FAIL, and FAIL by exactly
// 150 on the predecessor is strictly the better signal. The acceptance table at the head of
// this file is the replacement, and it is checked by running this gate on four artifacts.
const anchorN=RAW.split(pipeFor(RAW)[0]).length-1;
ok(anchorN===1,'A1 week-assembly instrumentation anchor is unique (count '+anchorN+')');
if(anchorN!==1){ console.log('REFUSED A2-P4: the p1/p2/p3 instrument could not be placed, so nothing about the pull arbitration was measured. A claim that did not run is not a pass.'); done(); }
const ins=instrument(ART,'p');
const IP=load(ART), II=load(ins.file);
// ERA ROW (D133): the positive-limb population P2c, P2d, P4, P6 and P7 are pinned to. 150 through V218.
// V219 D166 (cf166c): when ex.cond[2] is the pull day's Main, Pull superset B prints the row alone, so the swing
// no longer enters p1 beside a swing Main (census enterPost=none 60 -> 72). No row -> all five FAIL.
const SWAP_BY_VERSION = { 218: 150 };
SWAP_BY_VERSION[219] = 138;   // D166: ruled MOVE (150 -> 138)
SWAP_BY_VERSION[220] = SWAP_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or the pull-day swap draw, so the p1 population stays 138)
SWAP_BY_VERSION[221] = SWAP_BY_VERSION[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED (D177 widens the _REP_FLOOR balance row [6,10] to the two loaded landmine lifts, read by scheme() and _swapDetailFor(), no draw, and moves 0 engine cards, 0/1,201,231 printed by measure and 0/903,969 by builder; D178, D179 and D180 are zero-engine; the rep floor sets reps, not which item Pull superset B holds at p1; 138 printed by gatekeeper pre-flight on the V221 candidate, so the p1 population stays 138)
const SWAP_N = SWAP_BY_VERSION[(+IP.version <= 218) ? 218 : +IP.version];
II.eval(SNAP_FN+"globalThis.__G200=null;");
let inert=0,inertN=0;
LAT.filter((_,i)=>i%7===0).forEach(L=>{ inertN++;
  if(progDigest(IP.buildProgram(JSON.parse(JSON.stringify(L.cfg))))===progDigest(II.buildProgram(JSON.parse(JSON.stringify(L.cfg))))) inert++; });
ok(inert===inertN,'A2 the instrumented copy is inert: '+inert+'/'+inertN+' sampled lattice configs keep the pristine program digest');
ok(LAT.length===EXPECT.configs&&EXPECT.configs===60,
  'A3 the lattice is the ruling\'s 60 config keys, LIFTED from tests/measure/v200_g200_pins.js (MINI_LATTICE.expect.configs='+EXPECT.configs+', built '+LAT.length+'). A gate and its measure disagreeing about the lattice is how this item went wrong the first time');
ok(EXPECT.dayCells===5120&&EXPECT.deloadDayBuilds===1120&&EXPECT.swapCards===150,
  'A3b the measure module still declares dayCells=5120, deloadDayBuilds=1120, swapCards=150 (got '+EXPECT.dayCells+' / '+EXPECT.deloadDayBuilds+' / '+EXPECT.swapCards+'): a drift in the shared axis definitions cannot pass unnoticed');
const probeBad=PROBE.filter(([n,e])=>(isPost(n)?1:0)!==e);
ok(probeBad.length===0,'A4 the hand posterior oracle passes its blindness probe on all '+PROBE.length+' names, '
  +PROBE.filter(x=>x[1]===1).length+' positives and '+PROBE.filter(x=>x[1]===0).length+' negatives, four of the negatives pull-side'
  +(probeBad.length?' — misreads '+probeBad.map(x=>x[0]).join(', '):''));
const clsBad=CLS_PROBE.filter(([s,e])=>cls(s)!==e);
ok(clsBad.length===0,'A5 SPLIT-LENS GUARD: the four candidacy tests carried here byte-identical from g199 pass a hand-typed probe on all '+CLS_PROBE.length+' sections, and the three pull-family labels land on cand'
  +(clsBad.length?' — misreads '+clsBad.map(x=>x[0].l+'=>'+cls(x[0])+' want '+x[1]).join(', '):''));
const vprobeBad=VPROBE.filter(([n,e])=>(isVPull(n)?1:0)!==e);
ok(vprobeBad.length===0,'A6 the hand VERTICAL-PULL oracle passes its blindness probe on all '+VPROBE.length+' names, '
  +VPROBE.filter(x=>x[1]===1).length+' positives and '+VPROBE.filter(x=>x[1]===0).length+' negatives. The negatives are the load-bearing half: three horizontal rows, a face pull and a pullover must all read 0, so P7 cannot be satisfied by a section that merely has the word pull in a movement name. P7 is void without this row'
  +(vprobeBad.length?' — misreads '+vprobeBad.map(x=>x[0]).join(', '):''));

console.log('── B. the fixture boots and builds ──');
const fdig=progDigest(IP.buildProgram(fixtures.HALF_MANNY));
const MANNY_DIGEST=MANNY_DIGEST_BY_VERSION[IP.version];             // era row, not a literal (D89)
ok(!!MANNY_DIGEST&&fdig===MANNY_DIGEST,'B1 HALF_MANNY progDigest matches the V'+IP.version+' row of MANNY_DIGEST_BY_VERSION ('+(MANNY_DIGEST||'NO ROW')+') (got '+fdig+')'+(MANNY_DIGEST?'':' — no MANNY_DIGEST_BY_VERSION row for V'+IP.version+': an unruled digest move'));

const SH=Math.max(1,parseInt(process.env.G200_SHARDS||String(Math.min(4,os.cpus().length)),10));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'g200-'));
let fin=0; const outs=[];
for(let i=0;i<SH;i++){
  const o=path.join(tmp,'s'+i+'.json'); outs.push(o);
  fork(__filename,[ART],{env:Object.assign({},process.env,{G200SHARD:String(i),G200SHARDS:String(SH),G200OUT:o}),stdio:'inherit'})
    .on('exit',c=>{ if(c!==0){ console.log('  FAIL shard '+i+' exited '+c); FAIL++; done(); } if(++fin===SH) report(); });
}

function report(){
  try{fs.unlinkSync(ins.file);}catch(e){}
  let R={}; outs.forEach(o=>R=merge(R,JSON.parse(fs.readFileSync(o,'utf8'))));
  try{ outs.forEach(o=>fs.unlinkSync(o)); fs.rmdirSync(tmp); }catch(e){}

  console.log('── A. measured lattice shape ──');
  ok(R.configs===60&&R.dayCells===5120,
    'A3c the sweep actually visited 60 configs and '+EXPECT.dayCells+' day builds (got configs '+R.configs+', dayCells '+R.dayCells+')');
  ok(R.dlDayBuilds===1120,'A3d deload day builds == 1,120 of the '+R.dayCells+' day builds (got '+R.dlDayBuilds+'): the denominator P2c and P4 are quoted against');

  console.log('     CENSUS pull family at p1 INPUT  '+JSON.stringify(R.famP1ByLabel)+'  total '+R.famP1);
  console.log('     CENSUS pull family at p2 OUTPUT '+JSON.stringify(R.famP2ByLabel)+'  total '+R.famP2);
  console.log('     CENSUS survivor '+JSON.stringify(R.census));
  console.log('     CENSUS posterior items held by Pull superset B at p1 '+JSON.stringify(R.swapItems));
  console.log('     CENSUS swap cards byGoal '+JSON.stringify(R.swapByGoal)+' byTier '+JSON.stringify(R.swapByTier)
    +' byExp '+JSON.stringify(R.swapByExp)+' byRest '+JSON.stringify(R.swapByRest));
  if(Object.keys(R.p4Loss||{}).length) console.log('     CENSUS P4 loss shapes '+JSON.stringify(R.p4Loss));
  (R.p4Examples||[]).forEach((e,i)=>console.log('     P4 LOSS EX '+(i+1)+' '+JSON.stringify(e)));

  console.log('── P1. family conservation: the ruling SWAPS which block survives, it ADDS NO BLOCKS ──');
  ok(R.famP2===1470,
    'P1 PULL-BLOCK CONSERVATION, FAMILY-COUNTED: {Pull superset A, Pull superset B, Pull} present AFTER the deload (read at p2) == 1,470. '
    + 'DENOMINATOR: all '+R.dayCells+' day builds, not just the deload ones, because non-deload cards pass through recoveryDeload untouched and belong in the total. '
    + 'THE PIN IS NOT A READBACK OF THE CODE UNDER TEST: 1,470 was taken through this same instrument off git show V198:index.html, an artifact that predates D91. '
    + 'V198 splits it {A 840, B 630, Pull 0} and V199 splits it {A 690, B 780, Pull 0} — A down 150, B up 150, exactly P2c\'s population moving from one label to the other. '
    + 'The family at p1 INPUT is 1,680 on both artifacts, so the deload deletes 210 sections on both. '
    + 'got '+R.famP2+' (A '+g(R.famP2ByLabel,'Pull superset A')+' + B '+g(R.famP2ByLabel,'Pull superset B')+' + bare Pull '+g(R.famP2ByLabel,'Pull')+'), p1 INPUT '+R.famP1);

  console.log('── P2. the per-card expected survivor, read off the p1/p2 STAGE record ──');
  // ── P2 IS NARROWED BY D94, NOT REVERSED ────────────────────────────────────────────
  // D91's iff is still here. D94 adds ONE conjunct to its positive limb: B wins only when no
  // Main-class section already holds a posterior item at p1. On a deload pull day the Main is
  // a deadlift variant by construction, so that conjunct is false on all 150 positive-limb
  // cards and every one of them keeps A. The else limb of D91 is untouched.
  //
  // Keyed on the p1/p2 STAGE record and never on the shipped card: g193_samecard.js:374 already
  // rules that the Pull superset A label is not asserted to survive to the card, and P2 must not
  // collide with that ruling. P4 below is the one that reads the shipped card, by design.
  ok(R.viol===0&&R.bothEnter===210&&R.swapCards>0,
    'P2 WHICH BLOCK SURVIVES (D93 amended, NARROWED by D94 V201): on every deload day build where BOTH Pull superset A and Pull superset B enter p1, exactly one survives to p2, and the survivor is Pull superset B if and only if B holds an E_PAT posterior item on p1 AND no Main-class section holds one on p1; else Pull superset A. D94 ADDED THE SECOND CONJUNCT AND NOTHING ELSE: D91\'s rule is narrowed, not reversed, and the else limb is byte-unchanged. THAT WHICH-BLOCK RULE IS THE WHOLE OF WHAT P2 CLAIMS: it claims NOTHING about the FIRST-posterior-wins clause, for the measured reason in the SCOPE paragraph below. '
    + 'VIOLATIONS '+R.viol+' of '+R.bothEnter+' both-enter deload day builds (want 0 of 210). The denominator is stated because a zero with no denominator is the vacuity defect this repo has caught three times; surv=AB and surv=none are BOTH scored as violations, so the exactly-one-survives claim sits inside this same number. '
    + 'THE MAIN CLAUSE FIRES ON '+R.mainPostCards+' of the '+R.bothEnter+' both-enter cards (want 210, i.e. ALL of them), which is the coaching fact D94 rests on: a deload PULL day draws its Main from the deadlift family by construction, so the day\'s hip extension is already on the card and is the heaviest thing on it. Keeping a conditioning-pool swing on top of it and deleting the day\'s only vertical pull is the defect D94 removes. '
    + 'THE POSITIVE LIMB OF D91 IS STILL EXERCISED '+R.swapCards+' TIMES (want 150): '+R.swapCards+' of the '+R.bothEnter+' cards enter with B holding a posterior item, and the remaining '+(R.bothEnter-R.swapCards)+' enter with neither block holding one. Under D94 all 210 keep A, but by TWO DIFFERENT ROUTES, and both routes are live: 150 by the Main clause and 60 by the plain no-posterior else limb. That is why P2 is not the same assertion as "A always survives" and why the 150 must stay visible in the census. '
    + 'CENSUS '+JSON.stringify(R.census)+' (want {"enterPost=B mainPost=yes exp=A surv=A":150,"enterPost=none exp=A surv=A":60}). SEPARATION, AND IT IS NOT SYMMETRIC: V200 and V199 both read enterPost=B surv=B on those 150 cards, so P2 FAILS on each of them with EXACTLY 150 violations, which is the whole re-pin proof. V198 predates D91, keeps A on all 210, and is GREEN here — correct and expected, not a hole: the suite separates V198 from the rest on g199_deload_arbitration.js, D91\'s leg family. '
    + 'SCOPE — MEASURED, DO NOT RE-DERIVE THIS, IT COST A FULL MEASURE PASS: the FIRST-wins clause (the `break` in the posterior pre-pass, index.html:9412) is STRUCTURALLY UNOBSERVABLE ON ANY PULL LATTICE. A pull card holds at most ONE posterior-candidate block by construction: Pull superset A is row plus vertical pull; Pull superset B has exactly one posterior-capable slot, the ex.cond[2] draw; Row volume is one row; Main backMain is skipped as a main; the rest are optional or fluff. With one posterior-holding block per card, first-wins and last-wins select IDENTICALLY, so removing the break changes nothing this gate can see. '
    + 'THE NUMBERS: over 217,728 deload day builds, 10,443 (4.80%) carry 2+ posterior-holding candidate blocks, and 0 of those involve the pull family. Eleven lattice extensions were costed; only two contain the population at all and both contain it as LEG cards, which this gate\'s FAM does not read. NO LATTICE CHANGE CAN FIX THIS and MINI_LATTICE must not be widened in an attempt to. '
    + 'THE FIRST-WINS CLAUSE IS COVERED ELSEWHERE, BY NAME: g199_deload_arbitration.js G1/G2/F3c/H5, on 1,776 M1-observable cards of 15,360 deload day builds (11.6%), of which the 1,350 containing Leg isolation reconcile G1\'s hand pin independently as 1,080 + 240 + 30. tests/sabotage/v200.json M1 is declared against g199 for exactly that reason. '
    + 'THERE IS NO LICENCE ON THIS ASSERTION ANY MORE. The ia-version predicate that refused it above 200 fired on V201, forced this re-pin, and was deleted rather than re-keyed. If a future ruling moves the pull arbitration again, re-derive this census from that ruling\'s after-grid; do not adjust a number to make a red go green.');

  console.log('── P2c. the positive-limb population, read off p1, the deload\'s INPUT ──');
  ok(SWAP_N!==undefined&&R.swapCards===SWAP_N,
    'P2c POSITIVE-LIMB POPULATION: both-enter deload pull cards whose Pull superset B holds an E_PAT posterior item at p1 == '+SWAP_N+' (the V'+IP.version+' row) of '+R.dlDayBuilds+' deload day builds ('+R.bothEnter+' of which offer both blocks); got '+R.swapCards+'. '
    + 'THIS IS A LEGITIMATE PIN BECAUSE IT IS READ OFF p1, THE DELOAD\'S INPUT, NOT ITS OUTPUT: V198 reads 150 and V199 reads 150, identical, so it is a property of the program builder UPSTREAM of the arbitration, which the arbitration cannot move. It is the denominator P2\'s positive limb and P4 are quoted against, and it is why a change to the pull pool shows up here first. '
    + 'ONE MOVEMENT CARRIES THE ENTIRE POSITIVE LIMB: Kettlebell swing, 150 of 150, identical on both artifacts. Segments: goal '+JSON.stringify(R.swapByGoal)+' (want half 60, marathon 90), tier '+JSON.stringify(R.swapByTier)+' (want 30 each across commercial, home_full, crossfit, home_basic, minimal), exp '+JSON.stringify(R.swapByExp)+' (want 75 each), rest '+JSON.stringify(R.swapByRest)+' (want 50 each). items '+JSON.stringify(R.swapItems));
  ok(R.swapCards>=NOBASE_MIN,
    'P2c-floor HARD FLOOR, separate from the equality above: the positive limb is exercised at least '+NOBASE_MIN+' time (got '+R.swapCards+'). '
    + 'A future edit to the shared lattice in tests/measure/v200_g200_pins.js that emptied this population would leave P2 asserting only its else limb and still reporting PASS. That is the exact failure this whole file exists to correct, and an equality pin alone does not name it.');

  console.log('── P2d. the D94 conjunct is EXERCISED on the positive limb, not merely asserted ──');
  ok(SWAP_N!==undefined&&R.mainPostSwap===SWAP_N&&R.swapCards===SWAP_N,
    'P2d THE NEW CONJUNCT FIRES ON EVERY CARD IT DECIDES: of the '+R.swapCards+' both-enter deload pull cards whose Pull superset B holds an E_PAT posterior item at p1 — D91\'s positive limb, which is exactly the set of cards D94 changes the answer on — '+R.mainPostSwap+' ALSO carry a Main-class section holding an E_PAT posterior item at p1. WANT '+SWAP_N+' OF '+SWAP_N+' (the V'+IP.version+' row). '
    + 'WHY THIS IS A SEPARATE ASSERTION FROM P2: P2 reads 0 violations of 210, and a clause that never fired would produce that same 0 on the 60 no-posterior cards while quietly leaving the other 150 selecting B — except it would not, because those 150 would then be violations. What P2 cannot show on its own is that all 210 reach A by the TWO different routes it claims. P2d pins the route: if this count were 149, one card would keep B, D94 would decide nothing there, and the conjunct would be carrying less than the ruling says it carries. The equality is what makes P2\'s green a consequence of D94 rather than an arithmetic coincidence. '
    + 'CONTEXT, PRINTED AND DELIBERATELY NOT PINNED: across ALL '+R.bothEnter+' both-enter cards the Main-class posterior count reads '+R.mainPostCards+' (measured 210 of 210 — a superset of the 150, because the 60 cards that enter with NO posterior accessory still carry a posterior Main). Coach ruled 150 of 150. 210 of 210 is a STRONGER claim than the one ruled, and a stronger claim than the ruling is still an unruled claim, so it is printed here for drift and pinned nowhere. '
    + 'THIS IS A LEGITIMATE PIN FOR THE SAME REASON P2c IS: it is read off p1, the deload\'s INPUT, so it is a property of the program builder UPSTREAM of the arbitration and the arbitration cannot move it. It therefore reads 150 on all four artifacts and SEPARATES NOTHING. That is correct and intended: separation is P2, P4 and P7. P2d\'s job is to stop the positive limb being declared decisive without being shown decisive.');

  console.log('── P6. the whole positive limb is ONE NAME, now said out loud as an equality ──');
  const P6N=Object.keys(R.swapItems||{}).sort();
  const P6OK=P6N.length===1&&P6N[0]==='Kettlebell swing'&&SWAP_N!==undefined&&R.swapItems['Kettlebell swing']===SWAP_N;
  ok(P6OK,
    'P6 ONE-NAME LIMB CENSUS, AS AN EQUALITY: the E_PAT posterior-name census held by Pull superset B at p1 on this lattice == {"Kettlebell swing":'+SWAP_N+'} (the V'+IP.version+' row) — one name, that count, and nothing else in the object; got '+JSON.stringify(R.swapItems)+'. THE NUMBER IS UNCHANGED BY D94 AND THE MEANING IS INVERTED. '
    + 'THIS IS NOW THE MOVEMENT THE FIX DECLINES TO KEEP. Until D94 the swing was the movement that WON the arbitration: it was the posterior item that lifted Pull superset B over A and cost the day its vertical pull. D94 does not remove it from the pool and does not stop it being drawn; it stops it OUTSCORING the block it was beating, because the Main on that day is already a deadlift variant. So the 150 is still the exact population under discussion, and it is now the population where the swing loses. Read it beside P2\'s Main-clause count, which is the reason it loses. '
    + 'WHY THIS IS ITS OWN ASSERTION: the entire positive limb of P2 rests on a single movement, and before this pin it rested there silently. Pull superset B\'s only posterior-capable slot is one draw off EXLIB.conditioning (index.html:1626) = [Ball slams, Kettlebell swing, Burpees, Broad jumps, Mountain climbers, Jump squats], of which EXACTLY ONE is E_PAT posterior. On bodyweight, _bwFlat (index.html:7922) substitutes six names of which ZERO are, which is why the bodyweight tier is excluded from this lattice. '
    + 'Over the wide lattice the same census reads {"Kettlebell swing":7200} — 7,200 of 7,200, 100%, one name — and no other posterior name appears anywhere in that section\'s 15-name occupancy census. '
    + 'A POOL EDIT THAT ADDS OR REMOVES A POSTERIOR NAME IN THAT LIST RE-PINS P6 AND P2c TOGETHER: P2c moves off 150 and P6 moves off the single name. Re-derive BOTH from the new pool; never relax one to match the other. This converts a silent single point of failure into a named one. tests/sabotage/v200.json M4 removes exactly this name and must trip P6, P2c and P2c-floor by name.');

  console.log('── P4. survival of the newly selected block all the way to the shipped card ──');
  ok(SWAP_N!==undefined&&R.p4Survive===SWAP_N&&R.swapCards===SWAP_N,
    'P4 END-TO-END, FLIPPED BY D94 (p1 -> shipped card, folding in capRegionalFatigue and capSessionBudget): of the '+R.swapCards+' cards where Pull superset B holds the hinge at p1, '+R.p4Survive+' arrive at the SHIPPED CARD with PULL SUPERSET A or its bare rename intact (want '+SWAP_N+' of '+SWAP_N+', zero losses). This pinned B before D94; A is now the block the arbitration keeps, so A is the block that has to survive the trip. '
    + 'This pin READS THE SHIPPED CARD BY DESIGN, which is what separates it from P2: P2 proves the arbitration kept A, P4 proves nothing downstream quietly took it back. The two are not redundant, and P4 is the only place in this file that reads a shipped card. '
    + 'COUNTERFACTUAL, MEASURED, NOT INFERRED: the revert is 150 of 150 and there are ZERO losses at capRegionalFatigue or capSessionBudget on the shipped card, so the block the arbitration selects is exactly the block the athlete reads. V200 and V199 are 0 of 150 here, every one of them in the single shape where A is gone by p2, because those artifacts select B. P4 is therefore RED on both predecessors with the whole population lost, and GREEN on V198, which never selected B at all. '
    + 'loss shapes '+JSON.stringify(R.p4Loss));

  console.log('── P7. the vertical pull: what D94 is FOR, read off the shipped card ──');
  console.log('     CENSUS vertical-pull names on the shipped positive-limb cards '+JSON.stringify(R.p7Names));
  (R.p7Miss||[]).forEach((e,i)=>console.log('     P7 MISS EX '+(i+1)+' '+JSON.stringify(e)));
  ok(SWAP_N!==undefined&&R.p7VPull===SWAP_N&&R.swapCards===SWAP_N,
    'P7 THE DAY KEEPS ITS VERTICAL PULL: of the '+R.swapCards+' positive-limb deload pull cards, '+R.p7VPull+' ship a card carrying at least one VERTICAL PULL by the V_PULL hand table (want '+SWAP_N+' of '+SWAP_N+'). This is the assertion that says what D94 is FOR. P2 proves WHICH BLOCK the arbitration selected and P4 proves the block survived the trip; neither of them says a word about what is IN it, and the defect D94 removes is not a label going missing, it is a MOVEMENT going missing. '
    + 'THE DEFECT, MEASURED: on the L-healthy lattice 135 of 135 cards shipped with ZERO vertical pull. The movements deleted were L-sit chinups on 90 of them and Neutral-grip chinups on 45. The day\'s only overhead pull was being thrown away to keep a conditioning-pool Kettlebell swing on a card whose Main is already a deadlift variant. On THIS mini lattice under D94 the census reads {"Weighted chinups":90,"L-sit chinups":60}; the names are printed above as context and are NOT pinned, because the ruled claim is that the vertical pull is THERE, not which one was drawn. '
    + 'ORACLE INDEPENDENCE: V_PULL is a hand table typed from the movement names and proved by A6\'s 14-name blindness probe, seven positives and seven negatives, the negatives including three horizontal rows, a face pull and a pullover. It is NEVER a call into the engine\'s classifier — this file calls neither _isPostChain nor _pattern, and P7 adds no exception to that. '
    + 'P7 READS THE SHIPPED CARD BY DESIGN, which is the point and which is what distinguishes it from P2: P2 keys on the p1/p2 stage record because g193_samecard.js:374 rules that the Pull superset A LABEL is not asserted to survive to the card. P7 asserts no label. It asserts that an overhead pull is on the card the athlete holds, by whatever label it ends up under, so it does not collide with that ruling. '
    + 'SEPARATION: V200 and V199 select Pull superset B on all 150 of these cards, and Pull superset B is a row-family accessory plus the ex.cond[2] conditioning draw — neither is a vertical pull — so P7 reads 0 of 150 and is RED on both. V198 never selects B, keeps A, and is GREEN here, correct and expected. IF P7 IS GREEN ON V200 IT IS NOT MEASURING WHAT IT CLAIMS: report that, do not adjust the pin.');

  console.log('── SCOPE NOTE ──');
  console.log('  P3 (shipped bare `Pull` carrying exactly one item, that item posterior) is deliberately');
  console.log('  ABSENT. Measure found its population is 0 on BOTH artifacts: zero shipped pull-family');
  console.log('  sections carry one item at all on this lattice, so there is nothing to pin and a pin');
  console.log('  would be the vacuity defect again. Coach is ruling its disposition separately.');
  done();
}
