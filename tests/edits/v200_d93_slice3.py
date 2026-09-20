#!/usr/bin/env python3
# v200_d93_slice3 - D93 (AMENDED), slice 3 of 4.
#
# index.html IS NOT TOUCHED BY THIS SCRIPT. 0 app hunks, no ia-version bump.
# The artifact stays at 199. This script creates exactly ONE new file:
#     tests/gates/g200_pull_arbitration.js
#
# WHY. Slice 2 disclosed that all 1,440 both-enter cards on g199's lattice read
# enterPost=none, so P1 and P2 as sited inside g199 were vacuous: the pull swap never
# fires there. Coach retracted the siting and moved P1/P2 out of g199 onto a lattice that
# actually contains the population. Slice 4 removes P1/P2 from g199 and lands P0.
#
# A new-file write needs no replacement anchor, but the script asserts the target does NOT
# already exist before writing, asserts the measure module it lifts the lattice from does
# exist and exports what the gate imports, asserts the instrumentation anchor is still
# unique in index.html, and asserts index.html is byte-identical afterwards.
import os, sys, io, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # tests/
REPO = os.path.dirname(ROOT)
TARGET  = os.path.join(ROOT, 'gates', 'g200_pull_arbitration.js')
PINS    = os.path.join(ROOT, 'measure', 'v200_g200_pins.js')
HARNESS = os.path.join(ROOT, 'harness.js')
APP     = os.path.join(REPO, 'index.html')

def die(m):
    sys.stderr.write('ABORT: ' + m + chr(10)); sys.exit(1)

if os.path.exists(TARGET):
    die('%s already exists. This slice CREATES it; refusing to overwrite.' % TARGET)
if not os.path.exists(PINS):
    die('missing %s - the gate lifts MINI_LATTICE/miniLattice from it.' % PINS)
if not os.path.exists(HARNESS):
    die('missing %s' % HARNESS)

pins_src = io.open(PINS, encoding='utf-8').read()
for sym in ['MINI_LATTICE', 'miniCfg', 'miniLattice',
            'module.exports={MINI_LATTICE,miniCfg,miniLattice}']:
    if pins_src.count(sym) < 1:
        die('%s does not export %s' % (PINS, sym))
for frag in ['configs:60', 'dayCells:5120', 'deloadDayBuilds:1120', 'swapCards:150']:
    if pins_src.count(frag) != 1:
        die('MINI_LATTICE.expect fragment %r not found exactly once in the measure module' % frag)

app_bytes = io.open(APP, 'rb').read()
APP_SHA_BEFORE = hashlib.sha256(app_bytes).hexdigest()
app_src = app_bytes.decode('utf-8')
A_PIPE = "      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};"
n = app_src.count(A_PIPE)
if n != 1:
    die('A_PIPE instrumentation anchor count==%d (want 1) in index.html' % n)

GATE = r'''// g200_pull_arbitration — V200 D93 (amended): the PULL side of the deload arbitration.
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
// ACCEPTANCE PROPERTY — this gate must be RED on the predecessor. Against
// `git show V198:index.html` it MUST read P1 PASS, P2c PASS, P4 FAIL (0 of 150) and P2 FAIL
// with exactly 150 violations. Against shipped V199 all four PASS. If it is green on BOTH
// artifacts it is not testing what it claims and it must be rewritten, not re-pinned.
//
// usage: node tests/gates/g200_pull_arbitration.js <candidate.html> [ignored]
// env:   G200_SHARDS (default min(4, cpus))
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load, fixtures, progDigest}=require(path.join(__dirname,'..','harness.js'));
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
function instrument(art,tag){
  const RAW=fs.readFileSync(art,'utf8');
  const n=RAW.split(A_PIPE).length-1;
  if(n!==1) return {err:n};
  const out=path.join(os.tmpdir(),'g200_'+tag+'_'+process.pid+'.html');
  fs.writeFileSync(out,RAW.replace(A_PIPE,A_PIPE_R));
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
  bothEnter:0,swapCards:0,swapItems:{},swapByGoal:{},swapByTier:{},swapByExp:{},swapByRest:{},
  census:{},viol:0,violShape:{},
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
      const bothEnter=hasLab(r.p1,'Pull superset A')&&hasLab(r.p1,'Pull superset B');
      if(!bothEnter) return;
      S.bothEnter++;
      // ── P2: expected survivor at p2. STAGE record, never the shipped card ──
      const exp=bPost?'B':'A';
      const act=((hasLab(r.p2,'Pull superset A')?'A':'')+(hasLab(r.p2,'Pull superset B')?'B':''))||'none';
      bump(S.census,'enterPost='+((aPost?'A':'')+(bPost?'B':'')||'none')+' exp='+exp+' surv='+act);
      if(act!==exp){S.viol++;bump(S.violShape,'exp='+exp+' got='+act+' (Bpost='+bPost+')');}
      if(!bPost) return;
      // ── P2c: the positive limb ──
      S.swapCards++;
      bump(S.swapByGoal,L.g);bump(S.swapByTier,L.t);bump(S.swapByExp,L.x);bump(S.swapByRest,L.r);
      secOf(r.p1,'Pull superset B').forEach(s=>s.n.forEach(n=>{if(isPost(n))bump(S.swapItems,n);}));
      // ── P4: does B reach the SHIPPED card (past capRegionalFatigue and capSessionBudget)? ──
      const bItems=[].concat(...secOf(r.p1,'Pull superset B').map(s=>s.n));
      const intact=(ship||[]).some(s=>(s.l==='Pull superset B')
        ||(s.l==='Pull'&&(s.n||[]).length&&s.n.every(n=>bItems.includes(n))));
      if(intact) S.p4Survive++;
      else{
        const at2=(r.p2||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
        const at3=(r.p3||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
        const atS=(ship||[]).filter(s=>FAM.includes(s.l)).map(s=>s.l).join(',')||'none';
        bump(S.p4Loss,'p2='+at2+' p3(capRegional)='+at3+' shipped='+atS);
        if(S.p4Examples.length<3)S.p4Examples.push({cfg:L.key,card:'w'+r.w+' '+r.d,
          p1_B:bItems,p2:at2,p3:at3,shipped:(ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});
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
const done=()=>{ console.log('PASS '+PASS+' FAIL '+FAIL); process.exit(FAIL?1:0); };
const g=(o,k)=>(o&&o[k])||0;
// Hard floor in the shape the baseline-free gates use: an equality pin alone cannot stop a
// future lattice edit from silently returning this gate to the else-limb-only state that
// reported PASS while proving nothing. P2c carries BOTH the equality and this floor.
const NOBASE_MIN=1;

console.log('── A. instrument sanity and oracle sanity (every number below is void without these) ──');
const RAW=fs.readFileSync(ART,'utf8');
const anchorN=RAW.split(A_PIPE).length-1;
ok(anchorN===1,'A1 week-assembly instrumentation anchor is unique (count '+anchorN+')');
if(anchorN!==1){ console.log('REFUSED A2-P4: the p1/p2/p3 instrument could not be placed, so nothing about the pull arbitration was measured. A claim that did not run is not a pass.'); done(); }
const ins=instrument(ART,'p');
const IP=load(ART), II=load(ins.file);
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

console.log('── B. the fixture boots and builds ──');
const fdig=progDigest(IP.buildProgram(fixtures.HALF_MANNY));
ok(fdig==='6e32421331693437','B1 HALF_MANNY progDigest is 6e32421331693437, byte-identical to V198 (got '+fdig+'). D93 is a gate-only ruling: 0 hunks in index.html, so this must not move');

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
  // ── P2 SELF-EXPIRING LICENCE — READ THIS BEFORE FIXING A TRIP ───────────────────────
  // Same expiry discipline as the D85 and D91 licence switches in g193_budget_floor.js:180-189,
  // written as a pin rather than a switch because this gate takes no baseline argv to arm one
  // from. P2 is a correct description of the engine at V199 and it is NOT a coaching endorsement.
  // Coach has ruled the direction P2 pins COACHING-WRONG on pull days under D94: the deload keeps
  // a hinge drawn from the conditioning pool while the Main is already a deadlift variant, and
  // deletes the day's only vertical pull. D94 IS THE RULING THAT RE-PINS P2. A TRIP ON P2 AFTER
  // D94 SHIPS IS EXPECTED, NOT A REGRESSION: re-derive the expected survivor from D94's
  // after-grid and rewrite this assertion. Until D94 ships, a trip here is a real defect.
  //
  // Keyed on the p1/p2 STAGE record and never on the shipped card: g193_samecard.js:374 already
  // rules that the Pull superset A label is not asserted to survive to the card, and P2 must not
  // collide with that ruling. P4 below is the one that reads the shipped card, by design.
  ok(R.viol===0&&R.bothEnter===210&&R.swapCards>0,
    'P2 PER-CARD EXPECTED SURVIVOR (D93, re-pinned by D94): on every deload day build where BOTH Pull superset A and Pull superset B enter p1, exactly one survives to p2, and the survivor is B if and only if B holds an E_PAT posterior item on p1, else A. '
    + 'VIOLATIONS '+R.viol+' of '+R.bothEnter+' both-enter deload day builds (want 0 of 210). The denominator is stated because a zero with no denominator is the vacuity defect this repo has caught three times; surv=AB and surv=none are BOTH scored as violations, so the exactly-one-survives claim sits inside this same number. '
    + 'THE POSITIVE LIMB IS EXERCISED '+R.swapCards+' TIMES (want 150): '+R.swapCards+' of the '+R.bothEnter+' cards enter with B holding a posterior item, and the remaining '+(R.bothEnter-R.swapCards)+' enter with neither block holding one and must keep A. Both limbs are live here, which is precisely what was NOT true when these pins sat in g199 on a lattice where all 1,440 both-enter cards read enterPost=none. '
    + 'CENSUS '+JSON.stringify(R.census)+'. V198 reads {"enterPost=B exp=B surv=A":150,"enterPost=none exp=A surv=A":60} through this same gate, so P2 is RED on the predecessor with exactly 150 violations and the 60 no-posterior cards survive as A on BOTH versions: the oracle is not trivially satisfiable. '
    + 'D94 REVERSES THE DIRECTION THIS PINS. A trip on P2 once D94 has shipped is EXPECTED and is not a regression.');

  console.log('── P2c. the positive-limb population, read off p1, the deload\'s INPUT ──');
  ok(R.swapCards===150,
    'P2c POSITIVE-LIMB POPULATION: both-enter deload pull cards whose Pull superset B holds an E_PAT posterior item at p1 == 150 of '+R.dlDayBuilds+' deload day builds ('+R.bothEnter+' of which offer both blocks); got '+R.swapCards+'. '
    + 'THIS IS A LEGITIMATE PIN BECAUSE IT IS READ OFF p1, THE DELOAD\'S INPUT, NOT ITS OUTPUT: V198 reads 150 and V199 reads 150, identical, so it is a property of the program builder UPSTREAM of the arbitration, which the arbitration cannot move. It is the denominator P2\'s positive limb and P4 are quoted against, and it is why a change to the pull pool shows up here first. '
    + 'ONE MOVEMENT CARRIES THE ENTIRE POSITIVE LIMB: Kettlebell swing, 150 of 150, identical on both artifacts. Segments: goal '+JSON.stringify(R.swapByGoal)+' (want half 60, marathon 90), tier '+JSON.stringify(R.swapByTier)+' (want 30 each across commercial, home_full, crossfit, home_basic, minimal), exp '+JSON.stringify(R.swapByExp)+' (want 75 each), rest '+JSON.stringify(R.swapByRest)+' (want 50 each). items '+JSON.stringify(R.swapItems));
  ok(R.swapCards>=NOBASE_MIN,
    'P2c-floor HARD FLOOR, separate from the equality above: the positive limb is exercised at least '+NOBASE_MIN+' time (got '+R.swapCards+'). '
    + 'A future edit to the shared lattice in tests/measure/v200_g200_pins.js that emptied this population would leave P2 asserting only its else limb and still reporting PASS. That is the exact failure this whole file exists to correct, and an equality pin alone does not name it.');

  console.log('── P4. survival of the newly selected block all the way to the shipped card ──');
  ok(R.p4Survive===150&&R.swapCards===150,
    'P4 END-TO-END (p1 -> shipped card, folding in capRegionalFatigue and capSessionBudget): of the '+R.swapCards+' cards where Pull superset B holds the hinge at p1, '+R.p4Survive+' arrive at the SHIPPED card with Pull superset B or its bare rename intact (want 150 of 150, zero losses). '
    + 'This pin READS THE SHIPPED CARD BY DESIGN, which is what separates it from P2: P2 proves the arbitration selected B, P4 proves nothing downstream quietly took it back. '
    + 'V199 is 150 of 150 with zero losses at capRegionalFatigue and capSessionBudget. V198 is 0 of 150, every one of them in the single shape p2/p3/shipped = Pull superset A, because V198 never selected B at all. P4 is therefore RED on the predecessor with the whole population lost. '
    + 'loss shapes '+JSON.stringify(R.p4Loss));

  console.log('── SCOPE NOTE ──');
  console.log('  P3 (shipped bare `Pull` carrying exactly one item, that item posterior) is deliberately');
  console.log('  ABSENT. Measure found its population is 0 on BOTH artifacts: zero shipped pull-family');
  console.log('  sections carry one item at all on this lattice, so there is nothing to pin and a pin');
  console.log('  would be the vacuity defect again. Coach is ruling its disposition separately.');
  done();
}
'''

with io.open(TARGET, 'w', encoding='utf-8') as fh:
    fh.write(GATE)

# ---- postconditions -----------------------------------------------------------
after = hashlib.sha256(io.open(APP, 'rb').read()).hexdigest()
if after != APP_SHA_BEFORE:
    die('index.html CHANGED. This slice must produce 0 app hunks.')

out = io.open(TARGET, encoding='utf-8').read()
for need in ["require(path.join(__dirname,'..','measure','v200_g200_pins.js'))",
             "PASS '+PASS+' FAIL '+FAIL",
             'R.famP2===1470', 'R.viol===0', 'R.swapCards===150', 'R.p4Survive===150',
             'NOBASE_MIN']:
    if out.count(need) < 1:
        die('written gate is missing %r' % need)

# CLAUDE.md: strip comments before any "is this token gone" scan. The header prose names
# both engine symbols in order to say the gate never calls them; only a CALL is a defect.
code = chr(10).join(L for L in out.split(chr(10)) if not L.strip().startswith('//'))
for banned in ['_isPostChain(', '_pattern(']:
    if banned in code:
        die('written gate CALLS %s outside a comment' % banned)

print('WROTE %s  (%d bytes, %d lines)' % (TARGET, len(out.encode('utf-8')), out.count(chr(10))))
print('index.html untouched, sha256 %s, ia-version unchanged' % APP_SHA_BEFORE)
