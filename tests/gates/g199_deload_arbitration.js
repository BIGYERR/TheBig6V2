// g199_deload_arbitration — V199 D91 (amendment, no new D-code): "recoveryDeload picks its
// one surviving accessory block by PATTERN, not by push order."
//
// WHAT IS GRADED. Every number below is an ABSOLUTE count on a self-contained 1,728-key
// lattice, checked against the ruling's after-grid and a HAND regex oracle for "posterior
// chain". THERE IS NO BASELINE-RELATIVE ASSERTION IN THIS FILE: tests/sabotage.py passes no
// argv[3], so an assertion that needs a baseline has zero mutation coverage (that is what
// hollowed out g197d before V198). "Better than V198" is never asserted; "zero-posterior
// deload weeks == 0" and "zero-posterior weeks == the candidate's DELOAD_ARB_BY_VERSION
// row" are (D133: the five arbitration counts are era rows, never bare literals).
//
// ORACLE INDEPENDENCE. Posterior chain is the hand table E_PAT below, typed from the
// doctrine movement names, with a blindness probe (A4). The engine's _isPostChain is NEVER
// the oracle for what counts as posterior. The engine's _pattern IS used for one narrow
// thing: deciding whether a section is an accessory CANDIDATE at all (the loop's own
// hasLift test, which spans every pattern, not just the posterior two). The OUTCOME of the
// arbitration is always read off the section snapshots.
//
// DENOMINATORS. Two different measurements of this ruling exist and they are not a
// disagreement; each assertion below names its own:
//   - STAGE-LOCAL (p1 -> p2, the deload's own arbitration): coach's grid. Days >0 -> 0 == 60.
//   - END-TO-END (p1 -> shipped card, folding in capRegionalFatigue and capSessionBudget):
//     builder's after-check. Days >0 -> 0 == 36. Reported by E6, never mixed into E3.
//   - Deload weeks by isRecoveryWeek == 2,880. Deload weeks that actually DIFFER with the
//     pass off == 2,880 minus the era row's dlIdentical, because that many are byte-
//     identical either way (D2). V198-V204: 21 identical, 2,859 differ. V205: 19 and 2,861.
// An unlabelled number in this file is a defect. Label it or delete it.
//
// THE TRAP AND THE SWAP ARE DISJOINT. The naive-pre-pass population (a posterior MAIN and
// no posterior accessory candidate) is 2,160 and the swap population (Leg superset A giving
// way to Leg superset B) is also 2,160. They share no cell: the swap REQUIRES a posterior
// accessory candidate and the trap requires there be none. H6 proves the intersection is
// empty; neither population is ever computed from the other.
//
// usage: node tests/gates/g199_deload_arbitration.js <candidate.html> [ignored]
// env:   G199_SHARDS (default min(4, cpus))
const path=require('path'), fs=require('fs'), os=require('os'), crypto=require('crypto');
const {fork}=require('child_process');
const {load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));
const ART=path.resolve(process.argv[2]||path.join(__dirname,'..','..','index.html'));

// ── ERA ROWS: the five arbitration counts, keyed by ia-version (D133) ──────────────
// Same D94-t convention as harness.js's digest tables. A row records a CLAIM, not a
// value: a LITERAL row asserts a RULED MOVE and cites its attribution; a REFERENCE row
// asserts RULED UNMOVED and is proved by gate.sh running this file on V(N-1) and V(N);
// a MISSING row fails loudly, because every consumer below asserts the row exists as a
// CONJUNCT before it compares. These five were bare literals until V205, which made
// them red on the candidate for a reason this gate does not test.
//
// THE CAP ITSELF IS PROVABLY UNCHANGED BY V205. On the 10,698 cells where
// capRegionalFatigue was handed identical input, its verdict differs on 0 and its output
// label list differs on 0. Every move in the V205 row below is an INPUT move: V205
// legitimately reaches capRegionalFatigue, which reads _cardioInterference(cardio) at
// index.html:10170 — the same call the session budget makes at :9986. recoveryDeload
// does NOT read cardio; C1/C3/C5 and D2 move because they count posterior sections
// AFTER the regional cap has run.
const DELOAD_ARB_BY_VERSION = {
  // V198/V199: the counts D91 was ruled against. Literal rows: this is the origin.
  198: { capLSBkilled: 714, zeroWeeks: 372, zeroWeeksNonDeload: 372, zeroWeeksDeloadOff: 40, dlIdentical: 21 },
};
DELOAD_ARB_BY_VERSION[199] = DELOAD_ARB_BY_VERSION[198];   // D91: ruled UNMOVED
DELOAD_ARB_BY_VERSION[200] = DELOAD_ARB_BY_VERSION[199];   // D89: ruled UNMOVED (core-tier clause, not the arbitration)
DELOAD_ARB_BY_VERSION[201] = DELOAD_ARB_BY_VERSION[200];   // D94: ruled UNMOVED
DELOAD_ARB_BY_VERSION[202] = DELOAD_ARB_BY_VERSION[201];   // V202: ruled UNMOVED (NSW run work only)
DELOAD_ARB_BY_VERSION[203] = DELOAD_ARB_BY_VERSION[202];   // D117: ruled UNMOVED (NRC dose copy, no section arbitration)
DELOAD_ARB_BY_VERSION[204] = DELOAD_ARB_BY_VERSION[203];   // D126: ruled UNMOVED (string-and-gate only)
// V205: ruled MOVE, so a LITERAL row, one attribution per number. Every figure below is
// measure's attribution pass, which reproduced all five V204 literals on the V204
// baseline FIRST (I3 714, C1 372, C3 372, C5 40, D2 21) before reading the candidate:
// the instrument was proved before it was used. These are not numbers copied out of a
// failure message.
DELOAD_ARB_BY_VERSION[205] = {
  // I3. 714 -> 496. "The cap trims less" is true of 44 cells ONLY: 44 cells where the cap
  // reads interference 0.75 -> 0 (the Incline Walk leaving the legs day). The remaining
  // net 174 comes from a 3,168-cell reshuffle of WHICH days are offered Leg superset B at
  // all, because 11,616 pace day-builds changed role under D127. Entering the cap is
  // unmoved at 15,720 (F2, untouched).
  capLSBkilled: 496,
  // C1. 372 -> 364 of 17,856 weeks. Same reader, opposite directions: +24 where the cap
  // KEEPS Leg superset B on a legs day whose interference dropped, -16 where the legs day
  // relocated onto Monday's INT at interference 1.40 with legLoad false -> true and the
  // cap kills it there.
  zeroWeeks: 364,
  // C3. 372 -> 364, the same weeks as C1. Deload zeros remain 0 (C2), so the claim the
  // gate exists to make survives the move intact.
  zeroWeeksNonDeload: 364,
  // C5. 40 -> 32 in the __DELOAD_OFF arm: +12 week-4 lowback/protect, -4 week-8
  // bodyweight. The C1 and C5 sets are DISJOINT — no week is counted by both.
  zeroWeeksDeloadOff: 32,
  // D2. 21 -> 19, so differing deload weeks go 2,859 -> 2,861 of 2,880. NOTE THE
  // DIRECTION: this went UP, not down. 2 deload weeks where interference 0.75 -> 0 makes
  // the cap spare Leg superset B in the __DELOAD_OFF arm only, while recoveryDeload still
  // drops it in the ON arm. The reader is capRegionalFatigue, not a next-day pass:
  // measure excluded index.html:6454, :7698/:8440, :10351 and :6689 by printed hotNext
  // and legLoad values on both weeks.
  dlIdentical: 19,
};
// V206: ruled UNMOVED, a REFERENCE row (D94-t). D109 rewrites cardio note and detail
// text only; _cardioInterference classifies on subtype first and its minute/mile parsers
// read "25 min" exactly as "25-minute", so no interference value moves. D137 moves a
// run_base Steady card 12 -> 20 min on weeks 13-15; the cap reads minutes only past 45
// and the 'steady' token is unchanged. No posterior-section count can move. Proof is the
// two-artifact run: the same five counts read off V205 and V206.
DELOAD_ARB_BY_VERSION[206] = DELOAD_ARB_BY_VERSION[205];   // V206 D109/D137: ruled UNMOVED

// ── HAND ORACLE ────────────────────────────────────────────────────────────────────
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

// ── LATTICE (1,728 keys; identical to tests/measure/v199_d91_deload_arbitration.js) ──
const E_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS=['hypertrophy','balanced'], E_EXPS=['beginner','advanced'];
const E_GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const E_INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
  {k:'lowback/protect',v:{region:'lowback',tier:'protect'}},{k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const E_RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const E_SEEDS=[1013,3039];
function eCfg(tier,focus,exp,g,inj,rest,seed){
  const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,
    ageBracket:'18-35',equipment:tier,unit:'lbs',restDays:rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
}
const LAT=[];
for(const t of E_TIERS)for(const f of E_FOCUS)for(const x of E_EXPS)for(const g of E_GOALS)
  for(const i of E_INJ)for(const r of E_RESTS)for(const sd of E_SEEDS){
    const c=eCfg(t,f,x,g,i,r,sd); if(i.v) c.injury={region:i.v.region,tier:i.v.tier};
    LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,cfg:c});
  }

// ── INSTRUMENT: split the four-pass composition so p1 (into the deload), p2 (out of it) and
// p3 (after capRegionalFatigue) are visible. ONE anchor, at the week-assembly seam — well
// clear of recoveryDeload's body and of capSessionBudget, so no sabotage mutation aimed at
// the ruling can silently un-anchor the instrument (that would read as a CRASH, not a trip).
// The copy is written to tmp; the artifact is never written. A2 proves the copy is inert.
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__G199)globalThis.__G199.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
// NOTE: __SNAP records the engine's _pattern per item ONLY so the four candidacy classifiers
// can be re-run here exactly as the loop runs them. "Posterior" is decided by the hand table.
const SNAP_FN="globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),hip:!!(s&&s.hip),opt:!!(s&&s.optional),"
 +"n:it.map(function(i){return String((i&&i.name)||'');}),"
 +"p:it.map(function(i){var q=null;try{q=_pattern(i&&i.name);}catch(e){q=null;}return q?String(q):null;})};});};";
function instrument(art,tag){
  const RAW=fs.readFileSync(art,'utf8');
  const n=RAW.split(A_PIPE).length-1;
  if(n!==1) return {err:n};
  const out=path.join(os.tmpdir(),'g199_'+tag+'_'+process.pid+'.html');
  fs.writeFileSync(out,RAW.replace(A_PIPE,A_PIPE_R));
  return {file:out};
}

// ── the loop's own four classifiers, re-implemented here from the ruling text ────────
const KMAIN=/^main\b|^primer|^power\b|^strength\b/, KPREHAB=/hip|mobility|stretch/, KFLUFF=/carry|finisher|conditioning|explosive/;
function cls(s){
  const L=String(s.l||'').toLowerCase();
  if(KMAIN.test(L)) return 'main';
  if(s.hip||KPREHAB.test(L)) return 'prehab';
  if(s.opt||KFLUFF.test(L)) return 'fluff';
  if(!(s.p||[]).some(p=>p)) return 'none';
  return 'cand';
}
// A5 probe, carried from g200_pull_arbitration.js byte-identical: hand-typed sections,
// hand-typed expected class. Every one of the four candidacy tests is exercised in both
// directions, and the three PULL FAMILY labels are shown to land on 'cand'. SPLIT-LENS
// GUARD: g199 and g200 both run this same array against the same cls(), so the two files
// cannot drift into two different notions of what an accessory candidate is. Nothing here
// touches the engine.
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
const secPost=s=>(s.n||[]).reduce((a,n)=>a+(isPost(n)?1:0),0);
const cardPost=c=>(c||[]).reduce((a,s)=>a+secPost(s),0);
const hasLab=(c,lab)=>(c||[]).some(s=>s.l===lab&&(s.n||[]).length);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
const LABELS=['Leg superset A','Leg superset B','Leg isolation','Explosive finisher'];
// D93 (V200) — PULL SIDE. Its OWN list and its OWN counters: LABELS drives lblP1all/
// lblP2all, which F1-F3c, G1-G5, H5 and I3 are pinned to, so adding a pull label there
// would silently move every one of those numbers. Three labels, not two: the bare `Pull`
// is what singletonSupersetSweep (index.html:10010) leaves when a superset is trimmed to
// one item and loses its partner. That sweep runs POST-BUILD over weeks (index.html:9895),
// downstream of p1/p2/p3, so `Pull` is expected to read 0 in the STAGE census and to be
// the only place it appears is the SHIPPED-card census. Both are captured below.
const PLABELS=['Pull superset A','Pull superset B','Pull'];
const bump=(o,k)=>{o[k]=(o[k]||0)+1;};

function blank(){return {configs:0,weeks:0,dayCells:0,dlDayBuilds:0,deloadWeeks:0,nonDeloadWeeks:0,
  zeroWeeks:0,zeroWeeksDeload:0,zeroWeeksNonDeload:0,postInP1:0,postOutP2:0,postOutP3:0,postShipped:0,
  killedByDeload:0,killedHeldByFinisher:0,killedKeepsMain:0,lblP1:{},lblP2:{},dropped:{},droppedPost:{},
  survCandViol:0,survCandMax:0,survCandGt1:0,trapAny:0,trapCand:0,trapNoCand:0,trapSurvViol:0,trapNoCandSurvViol:0,
  lblP1all:{},lblP2all:{},killHold:{},reBudLost:{},reBudShip:{},reBudNonMob:0,reBudTier:{},reBudRename:{},lensOnlyHand:{},lensOnlyEng:{},swapReBudgetWeekZero:0,
  trapAnyE:0,trapCandE:0,trapNoCandE:0,trapSurvViolE:0,trapNoCandSurvViolE:0,
  swapPop:0,swapBoth:0,swapReCap:0,swapReBudget:0,capLSBin:0,capLSBkilled:0,
  pullP1all:{},pullP2all:{},pullShipAll:{},pullP1:{},pullP2:{},pullBothP1:0,pullSwapCensus:{},
  orderViol:0,orderNonVac:0,legAfterHipViol:0,trapAndSwap:0};}

function sweep(mine,instrFile){
  const IA=load(instrFile);
  IA.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;");
  const R={on:blank(),off:blank(),wrongWay:0,endToEnd:0,ndIdentical:0,ndTotal:0,dlIdentical:0,dlTotal:0};
  mine.forEach(L=>{
    const arms={};
    ['on','off'].forEach(m=>{
      IA.eval("globalThis.__G199.length=0;globalThis.__DELOAD_OFF="+(m==='off')+";");
      const prog=IA.buildProgram(L.cfg);
      const REC=IA.eval('globalThis.__G199');
      const S=R[m]; S.configs++;
      const W=prog.weeks||{};
      const shipPost={}, shipLab={}, shipSec={}, wkShip={}, wkDeload={}, wkSha={};
      Object.keys(W).forEach(w=>{ let tot=0;
        Object.keys(W[w]).forEach(d=>{ const day=W[w][d]; let n=0;
          ((day&&day.sections)||[]).forEach(sec=>((sec&&sec.items)||[]).forEach(it=>{ if(isPost(it&&it.name)) n++; }));
          shipPost[w+'|'+d]=n; shipLab[w+'|'+d]=((day&&day.sections)||[]).map(sec=>String((sec&&sec.label)||''));
          const SM={}; ((day&&day.sections)||[]).forEach(sec=>{ SM[String((sec&&sec.label)||'')]=((sec&&sec.items)||[]).map(it=>String((it&&it.name)||'')); });
          shipSec[w+'|'+d]=SM; tot+=n; });
        wkShip[w]=tot; wkSha[w]=sha(JSON.stringify(W[w])); });
      REC.forEach(r=>{ S.dayCells++; if(r.dl) wkDeload[r.w]=true;
        const a1=cardPost(r.p1), a2=cardPost(r.p2), a3=cardPost(r.p3);
        if(a2>0&&a3===0){} // (p2->p3 loss is scored on the swap population only, see I1)
        if(hasLab(r.p2,'Leg superset B')){ S.capLSBin++; if(!hasLab(r.p3,'Leg superset B')) S.capLSBkilled++; }
        // label presence over ALL day builds (non-deload cards pass through untouched) — the
        // denominator coach's conservation total is stated on. The deload-only census is kept
        // separately below; the two are different denominators and never interchangeable.
        LABELS.forEach(lb=>{ if(hasLab(r.p1,lb)) bump(S.lblP1all,lb); if(hasLab(r.p2,lb)) bump(S.lblP2all,lb); });
        // ── D93 pull-side plumbing (no assertion in this slice) ──
        // pullP1all/pullP2all: the STAGE record, all day builds — the same denominator and
        // the same shape as lblP1all/lblP2all, kept in separate maps.
        // pullShipAll: the SHIPPED card, all day builds. This is the only census that can
        // see the bare `Pull` rename, and g193_samecard.js:374 already rules that the
        // `Pull superset A` LABEL is not asserted to survive to the card, so P2 must ask
        // its p1-vs-p2 question of the stage record and never of the shipped card.
        // pullP1/pullP2/pullBothP1/pullSwapCensus: DELOAD cards only, a second denominator.
        PLABELS.forEach(lb=>{ if(hasLab(r.p1,lb)) bump(S.pullP1all,lb); if(hasLab(r.p2,lb)) bump(S.pullP2all,lb); });
        { const SL=shipLab[r.w+'|'+r.d]||[]; PLABELS.forEach(lb=>{ if(SL.indexOf(lb)>=0) bump(S.pullShipAll,lb); }); }
        if(r.dl){
          PLABELS.forEach(lb=>{ if(hasLab(r.p1,lb)) bump(S.pullP1,lb); if(hasLab(r.p2,lb)) bump(S.pullP2,lb); });
          // raw facts only, no oracle: which pull block ENTERED holding posterior (hand
          // table), and which pull block came OUT. P2/P2b in slice 2 turn this into an
          // expected-survivor claim; slice 1 only records it.
          if(hasLab(r.p1,'Pull superset A')&&hasLab(r.p1,'Pull superset B')){ S.pullBothP1++;
            const pst=(lb)=>(r.p1||[]).some(s=>s.l===lb&&secPost(s)>0);
            const srv=(lb)=>hasLab(r.p2,lb);
            bump(S.pullSwapCensus,'enterPost='+((pst('Pull superset A')?'A':'')+(pst('Pull superset B')?'B':'')||'none')
              +' surv='+((srv('Pull superset A')?'A':'')+(srv('Pull superset B')?'B':'')||'none')); }
        }
        // lens census: names the hand table calls posterior and the engine's _pattern does not,
        // and the reverse. A nonempty first list is why a hand-oracle count can exceed an
        // engine-lens count on the same cards.
        (r.p1||[]).forEach(s=>(s.n||[]).forEach((n,i)=>{ const h=isPost(n), e=(s.p[i]==='hinge'||s.p[i]==='hip_ext');
          if(h&&!e) bump(S.lensOnlyHand,n); else if(e&&!h) bump(S.lensOnlyEng,n); }));
        if(!r.dl) return;
        S.dlDayBuilds++; S.postInP1+=a1; S.postOutP2+=a2; S.postOutP3+=a3;
        S.postShipped+=(shipPost[r.w+'|'+r.d]||0);
        LABELS.forEach(lb=>{ if(hasLab(r.p1,lb)) bump(S.lblP1,lb); if(hasLab(r.p2,lb)) bump(S.lblP2,lb);
          if(hasLab(r.p1,lb)&&!hasLab(r.p2,lb)){ bump(S.dropped,lb);
            if((r.p1||[]).some(s=>s.l===lb&&secPost(s)>0)) bump(S.droppedPost,lb); } });
        const killed=(a1>0&&a2===0);
        if(killed){ S.killedByDeload++;
          if((r.p1||[]).filter(s=>secPost(s)>0).every(s=>s.l==='Explosive finisher')) S.killedHeldByFinisher++;
          if((r.p2||[]).some(s=>KMAIN.test(String(s.l||'').toLowerCase()))) S.killedKeepsMain++;
          (r.p1||[]).forEach(s=>{ if(secPost(s)>0) bump(S.killHold, s.l||'(nolabel)'); }); }
        // ── candidacy, the loop's own four tests, re-run here ──
        const c1=(r.p1||[]).map(cls), c2=(r.p2||[]).map(cls);
        const cand=c1.filter(x=>x==='cand').length;
        const surv=c2.filter(x=>x==='cand').length;
        const postCand=(r.p1||[]).filter((s,i)=>c1[i]==='cand'&&secPost(s)>0).length;
        const mainPost=(r.p1||[]).some((s,i)=>c1[i]==='main'&&secPost(s)>0);
        if(surv>S.survCandMax) S.survCandMax=surv;
        if(surv>1) S.survCandGt1++;
        if(surv!==(cand>0?1:0)) S.survCandViol++;
        const inTrap=(mainPost&&postCand===0);
        if(inTrap){ S.trapAny++;
          if(cand>0){ S.trapCand++; if(surv!==1) S.trapSurvViol++; }
          else { S.trapNoCand++; if(surv!==0) S.trapNoCandSurvViol++; } }
        const inSwap=(hasLab(r.p1,'Leg superset A')&&hasLab(r.p1,'Leg superset B')
                      &&hasLab(r.p2,'Leg superset B')&&!hasLab(r.p2,'Leg superset A'));
        if(hasLab(r.p1,'Leg superset A')&&hasLab(r.p1,'Leg superset B')) S.swapBoth++;
        if(inSwap){ S.swapPop++;
          if(a2>0&&a3===0) S.swapReCap++;
          if(a3>0&&(shipPost[r.w+'|'+r.d]||0)===0){ S.swapReBudget++; if((wkShip[r.w]||0)===0) S.swapReBudgetWeekZero++;
            (r.p3||[]).forEach(s=>(s.n||[]).forEach((n,i)=>{ if(isPost(n)) bump(S.reBudLost, (s.p[i]==='hinge'||s.p[i]==='hip_ext'?'[engine-post] ':'[hand-only] ')+s.l+' :: '+n); }));
            const SL=shipLab[r.w+'|'+r.d]||[];
            bump(S.reBudShip, SL.join(' | ')||'(card has no sections at all)');
            if(SL.some(l=>!/mobility|stretch|foam/i.test(l))) S.reBudNonMob++;
            bump(S.reBudTier, String(L.key).split('|')[0]);
            const SM=shipSec[r.w+'|'+r.d]||{};
            (r.p3||[]).filter(sc=>secPost(sc)>0).forEach(sc=>bump(S.reBudRename, sc.l+': '+(sc.n||[]).filter(isPost).join(', ')+' -> '+((SM[sc.l]||[]).join(', ')||'(section gone)'))); } }
        if(inTrap&&inSwap) S.trapAndSwap++;
        // the SAME trap predicate read through the ENGINE's lens ({hinge,hip_ext} per _pattern),
        // which is the lens a naive pre-pass would actually have used.
        const secPostE=s=>(s.p||[]).reduce((a,q)=>a+((q==='hinge'||q==='hip_ext')?1:0),0);
        const postCandE=(r.p1||[]).filter((s,i)=>c1[i]==='cand'&&secPostE(s)>0).length;
        const mainPostE=(r.p1||[]).some((s,i)=>c1[i]==='main'&&secPostE(s)>0);
        if(mainPostE&&postCandE===0){ S.trapAnyE++;
          if(cand>0){ S.trapCandE++; if(surv!==1) S.trapSurvViolE++; }
          else { S.trapNoCandE++; if(surv!==0) S.trapNoCandSurvViolE++; } }
        // ── order: p2 labels must be a SUBSEQUENCE of p1 labels (nothing reordered, nothing appended) ──
        let pi=0, okSub=true;
        (r.p2||[]).forEach(s=>{ let f=-1; for(let i=pi;i<(r.p1||[]).length;i++) if(r.p1[i].l===s.l){f=i;break;}
          if(f<0) okSub=false; else pi=f+1; });
        if(!okSub) S.orderViol++;
        if((r.p2||[]).length<(r.p1||[]).length) S.orderNonVac++;
        const idx=(c,re)=>{ for(let i=0;i<(c||[]).length;i++) if(re.test(String(c[i].l||''))) return i; return -1; };
        const RLEG=/^Leg superset|^Leg isolation/i, RHIP=/Hip stability|Foot & ankle/i;
        const l1=idx(r.p1,RLEG), h1=idx(r.p1,RHIP), l2=idx(r.p2,RLEG), h2=idx(r.p2,RHIP);
        if(l2>=0&&h2>=0&&l1>=0&&h1>=0&&l1<h1&&l2>h2) S.legAfterHipViol++;
      });
      Object.keys(W).forEach(w=>{ S.weeks++;
        if(wkDeload[w]) S.deloadWeeks++; else S.nonDeloadWeeks++;
        if(wkShip[w]===0){ S.zeroWeeks++; if(wkDeload[w]) S.zeroWeeksDeload++; else S.zeroWeeksNonDeload++; } });
      arms[m]={wkShip,wkDeload,wkSha,shipPost};
    });
    // cross-arm: the __DELOAD_OFF comparator (coach's addition 4) and the identity claims
    const on=arms.on, off=arms.off;
    Object.keys(on.wkShip).forEach(w=>{
      if(on.wkShip[w]===0 && (off.wkShip[w]||0)>0) R.wrongWay++;
      if(on.wkDeload[w]){ R.dlTotal++; if(on.wkSha[w]===off.wkSha[w]) R.dlIdentical++; }
      else { R.ndTotal++; if(on.wkSha[w]===off.wkSha[w]) R.ndIdentical++; } });
    Object.keys(on.shipPost).forEach(k=>{ const w=k.split('|')[0];
      if(on.wkDeload[w] && (off.shipPost[k]||0)>0 && on.shipPost[k]===0) R.endToEnd++; });
  });
  return R;
}
function merge(a,b){Object.keys(b).forEach(k=>{ if(typeof b[k]==='number') a[k]=(a[k]||0)+b[k];
  else if(b[k]&&typeof b[k]==='object'){a[k]=a[k]||{};merge(a[k],b[k]);} }); return a;}

// ── shard child ────────────────────────────────────────────────────────────────────
if(process.env.G199SHARD!==undefined){
  const si=+process.env.G199SHARD, sn=+process.env.G199SHARDS;
  const ins=instrument(ART,'s'+si);
  if(ins.err!==undefined){ fs.writeFileSync(process.env.G199OUT,JSON.stringify({anchor:ins.err})); process.exit(0); }
  const R=sweep(LAT.filter((_,i)=>i%sn===si),ins.file);
  try{fs.unlinkSync(ins.file);}catch(e){}
  fs.writeFileSync(process.env.G199OUT,JSON.stringify(R));
  process.exit(0);
}

// ── parent ─────────────────────────────────────────────────────────────────────────
let PASS=0,FAIL=0;
const ok=(c,m)=>{ if(c){PASS++;console.log('  ok   '+m);} else {FAIL++;console.log('  FAIL '+m);} };
const done=()=>{ console.log('PASS '+PASS+' FAIL '+FAIL); process.exit(FAIL?1:0); };

console.log('── A. instrument sanity (every number below is void without these) ──');
const RAW=fs.readFileSync(ART,'utf8');
const anchorN=RAW.split(A_PIPE).length-1;
ok(anchorN===1,'A1 week-assembly instrumentation anchor is unique (count '+anchorN+')');
if(anchorN!==1){ console.log('REFUSED A2-J3: the p1/p2/p3 instrument could not be placed, so nothing about the deload stage was measured. A claim that did not run is not a pass.'); done(); }
const ins=instrument(ART,'p');
const IP=load(ART), II=load(ins.file);
II.eval(SNAP_FN+"globalThis.__G199=null;globalThis.__DELOAD_OFF=false;");
let inert=0,inertN=0;
LAT.filter((_,i)=>i%211===0).forEach(L=>{ inertN++; if(progDigest(IP.buildProgram(L.cfg))===progDigest(II.buildProgram(L.cfg))) inert++; });
ok(inert===inertN,'A2 the instrumented copy is inert: '+inert+'/'+inertN+' lattice configs keep the pristine program digest');
ok(LAT.length===1728,'A3 lattice is the ruling\'s 1,728 config keys (got '+LAT.length+')');
let probeBad=PROBE.filter(([n,e])=>(isPost(n)?1:0)!==e);
ok(probeBad.length===0,'A4 hand posterior oracle passes its blindness probe on all '+PROBE.length+' names, '
  +PROBE.filter(x=>x[1]===1).length+' positives and '+PROBE.filter(x=>x[1]===0).length+' negatives, four of the negatives pull-side. '
  +'SHARED ORACLE: this probe body and E_PAT are byte-identical to tests/gates/g200_pull_arbitration.js, and both files assert them'
  +(probeBad.length?' — misreads '+probeBad.map(x=>x[0]).join(', '):''));
const clsBad=CLS_PROBE.filter(([s,e])=>cls(s)!==e);
ok(clsBad.length===0,'A5 SPLIT-LENS GUARD: the four candidacy tests pass a hand-typed probe on all '+CLS_PROBE.length+' sections, and the three pull-family labels land on cand. cls() here is byte-identical to the copy in tests/gates/g200_pull_arbitration.js and BOTH files assert it against this same array, so neither can drift into its own private notion of an accessory candidate'
  +(clsBad.length?' — misreads '+clsBad.map(x=>x[0].l+'=>'+cls(x[0])+' want '+x[1]).join(', '):''));

console.log('── B. HALF_MANNY, and the proof the fixture is not blind to the deload ──');
const dig=progDigest(IP.buildProgram(fixtures.HALF_MANNY));
IP.eval("globalThis.__DELOAD_OFF=true;");
const digOff=progDigest(IP.buildProgram(fixtures.HALF_MANNY));
IP.eval("globalThis.__DELOAD_OFF=false;");
const MANNY_DIGEST=MANNY_DIGEST_BY_VERSION[IP.version];             // era row, not a literal (D89)
const MANNY_OFF=MANNY_DELOAD_OFF_DIGEST_BY_VERSION[IP.version];     // era row, not a literal (D89)
ok(!!MANNY_DIGEST&&dig===MANNY_DIGEST,'B1 HALF_MANNY progDigest matches the V'+IP.version+' row of MANNY_DIGEST_BY_VERSION ('+(MANNY_DIGEST||'NO ROW')+') (got '+dig+')'+(MANNY_DIGEST?'':' — no MANNY_DIGEST_BY_VERSION row for V'+IP.version+': an unruled digest move'));
ok(!!MANNY_OFF&&digOff===MANNY_OFF,'B2 with __DELOAD_OFF the same fixture matches the V'+IP.version+' row of MANNY_DELOAD_OFF_DIGEST_BY_VERSION ('+(MANNY_OFF||'NO ROW')+') (got '+digOff+'): B1 is MEANINGFUL, the fixture does pass through the deload (B1 would be vacuous if the two digests were equal)'+(MANNY_OFF?'':' — no MANNY_DELOAD_OFF_DIGEST_BY_VERSION row for V'+IP.version+': an unruled digest move'));
ok(dig!==digOff,'B3 the two fixture digests differ');

const SH=Math.max(1,parseInt(process.env.G199_SHARDS||String(Math.min(4,os.cpus().length)),10));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'g199-'));
let fin=0; const outs=[];
for(let i=0;i<SH;i++){
  const o=path.join(tmp,'s'+i+'.json'); outs.push(o);
  fork(__filename,[ART],{env:Object.assign({},process.env,{G199SHARD:String(i),G199SHARDS:String(SH),G199OUT:o}),stdio:'inherit'})
    .on('exit',c=>{ if(c!==0){ console.log('  FAIL shard '+i+' exited '+c); FAIL++; done(); } if(++fin===SH) report(); });
}
function report(){
  try{fs.unlinkSync(ins.file);}catch(e){}
  let R={}; outs.forEach(o=>R=merge(R,JSON.parse(fs.readFileSync(o,'utf8'))));
  try{ outs.forEach(o=>fs.unlinkSync(o)); fs.rmdirSync(tmp); }catch(e){}
  const N=R.on, F=R.off;
  // D133. The era row, looked up ONCE. Its existence is a conjunct in every assertion
  // that reads it, so an artifact with no row fails loudly instead of skipping.
  const ERA=DELOAD_ARB_BY_VERSION[IP.version]||null;
  const ERAv=k=>(ERA?ERA[k]:'NO ROW');
  const NOROW=(ERA?'':' — no DELOAD_ARB_BY_VERSION row for V'+IP.version+': an unpinned arbitration count (D133)');
  const g=(o,k)=>(o&&o[k])||0;
  const topn=(o,n)=>Object.keys(o||{}).sort((a,b)=>o[b]-o[a]).slice(0,n).map(k=>k+' '+o[k]).join(' | ');
  const D_DAY=N.dlDayBuilds, D_WK=N.deloadWeeks, ALLWK=N.weeks;

  console.log('── C. headline, shipped card, absolute counts (no baseline) ──');
  ok(!!ERA&&N.zeroWeeks===ERA.zeroWeeks,'C1 zero-posterior weeks on the SHIPPED card == '+ERAv('zeroWeeks')+' (the V'+IP.version+' DELOAD_ARB_BY_VERSION row) of '+ALLWK+' weeks (1,728 configs); got '+N.zeroWeeks+NOROW);
  ok(N.zeroWeeksDeload===0,'C2 zero-posterior DELOAD weeks == 0 of '+D_WK+' deload weeks; got '+N.zeroWeeksDeload);
  ok(!!ERA&&N.zeroWeeksNonDeload===ERA.zeroWeeksNonDeload,'C3 the surviving '+ERAv('zeroWeeksNonDeload')+' (the V'+IP.version+' row) are all NON-deload weeks (denominator '+N.nonDeloadWeeks+'), so C2\'s zero holds: got '+N.zeroWeeksNonDeload+NOROW);
  ok(R.wrongWay===0,'C4 weeks going the WRONG way == 0: no week ships zero posterior that would ship posterior with the deload off (got '+R.wrongWay+' of '+ALLWK+')');
  ok(!!ERA&&F.zeroWeeksDeload===ERA.zeroWeeksDeloadOff,'C5 __DELOAD_OFF comparator: with the pass disabled, '+ERAv('zeroWeeksDeloadOff')+' deload weeks (the V'+IP.version+' row) ship zero posterior. This set and C1\'s are DISJOINT; got '+F.zeroWeeksDeload+NOROW);
  ok(N.zeroWeeksDeload<=F.zeroWeeksDeload,'C6 shipped ('+N.zeroWeeksDeload+') <= __DELOAD_OFF ('+F.zeroWeeksDeload+'): arbitrated correctly the deload PROTECTS the chain rather than deleting it');

  console.log('── D. denominators, the conflict resolved rather than papered over ──');
  ok(D_WK===2880,'D1a deload weeks by isRecoveryWeek == 2,880 (got '+D_WK+')');
  ok(N.nonDeloadWeeks===14976,'D1b non-deload weeks == 14,976 (got '+N.nonDeloadWeeks+'); 2,880 + 14,976 == '+ALLWK);
  ok(!!ERA&&R.dlIdentical===ERA.dlIdentical,'D2 '+ERAv('dlIdentical')+' deload weeks (the V'+IP.version+' row) are byte-identical with the deload off, so the sha-method deload count is '+(ERA?R.dlTotal-ERA.dlIdentical:'NO ROW')+' ('+(R.dlTotal-R.dlIdentical)+' differ of '+R.dlTotal+'). '+R.dlTotal+' and '+(R.dlTotal-R.dlIdentical)+' are two measurements, not a disagreement; got '+R.dlIdentical+NOROW);
  ok(R.ndIdentical===R.ndTotal&&R.ndTotal===14976,'D3 non-deload weeks are byte-identical with the pass on and off: '+R.ndIdentical+'/'+R.ndTotal+' (week-level identity, not just HALF_MANNY)');

  console.log('── E. THE DELOAD MUST STILL CUT ──');
  ok(N.postInP1===12477,'E1a posterior items entering the deload == 12,477 across '+D_DAY+' deload day builds (got '+N.postInP1+')');
  ok(N.postOutP2===9771,'E1b posterior items leaving the deload == 9,771, a cut of '+(N.postInP1-N.postOutP2)+' ('+(100*(N.postInP1-N.postOutP2)/N.postInP1).toFixed(1)+'%); got '+N.postOutP2);
  ok(F.postInP1===12477&&F.postOutP2===12477,'E2 __DELOAD_OFF control cuts nothing: '+F.postInP1+' -> '+F.postOutP2+'. E1b is a real deletion, not an accounting artefact');
  ok(N.killedByDeload===60,'E3 STAGE-LOCAL (p1 -> p2): deload day builds taken from >0 posterior to 0 == 60 of '+D_DAY+'; got '+N.killedByDeload+'. This is coach\'s ruled CEILING, not a floor');
  ok(N.killedHeldByFinisher===60,'E4 on all 60, every section that held the dropped posterior is labelled Explosive finisher (got '+N.killedHeldByFinisher+'): the ceiling is BY LABEL, and a future widening into optional/fluff sections moves this number');
  ok(N.killedKeepsMain===60,'E5 all 60 still keep their main/strength section (got '+N.killedKeepsMain+')');
  ok(R.endToEnd===36,'E6 END-TO-END (p1 -> shipped card, folding in capRegionalFatigue and capSessionBudget): '+R.endToEnd+' deload day builds ship zero posterior where __DELOAD_OFF ships some. Reported beside E3\'s stage-local 60, never mixed into it');

  console.log('── F. ACCESSORY-BLOCK CONSERVATION (the ruling adds no sets) ──');
  ok(g(N.lblP2all,'Leg superset A')===14544,'F1 Leg superset A present after the deload == 14,544. DENOMINATOR: all '+N.dayCells+' day builds (non-deload cards pass through recoveryDeload untouched, so they belong in this total); got '+g(N.lblP2all,'Leg superset A'));
  ok(g(N.lblP2all,'Leg superset B')===15720,'F2 Leg superset B present after the deload == 15,720, same all-day-builds denominator; got '+g(N.lblP2all,'Leg superset B'));
  ok(g(N.lblP2all,'Leg superset A')+g(N.lblP2all,'Leg superset B')===30264,
    'F3 ACCESSORY-BLOCK CONSERVATION: A + B after the deload == 30,264, the identical total V198 shipped as 16,704 + 13,560. The ruling SWAPS which block survives, it ADDS NO SETS. Without this a build that kept BOTH blocks would satisfy every other criterion in this file; got '+(g(N.lblP2all,'Leg superset A')+g(N.lblP2all,'Leg superset B')));
  ok(g(N.lblP1all,'Leg superset A')===16704,'F3b the swap is exactly 2,160 wide in each direction: A enters on 16,704 cards and leaves on '+g(N.lblP2all,'Leg superset A')+', a loss of '+(g(N.lblP1all,'Leg superset A')-g(N.lblP2all,'Leg superset A'))+'; got '+g(N.lblP1all,'Leg superset A'));
  ok(g(N.lblP2,'Leg superset A')+g(N.lblP2,'Leg superset B')===2880,'F3c on DELOAD cards alone the same two blocks survive '+g(N.lblP2,'Leg superset A')+' + '+g(N.lblP2,'Leg superset B')+' == 2,880 times, one per card. A second, smaller denominator, stated so F1-F3 cannot be misread as a deload-only census');
  ok(N.survCandViol===0,'F4 per-card: exactly one accessory block survives wherever one was available, zero where none was ('+N.survCandViol+' violations of '+D_DAY+' deload day builds)');
  ok(N.survCandGt1===0,'F5 no deload card ever ships two surviving accessory blocks ('+N.survCandGt1+' cards with more than one, of '+D_DAY+')');

  // ══ D93 (V200, AMENDED) PULL SIDE — P0, g199's OWN BLINDNESS, RECORDED ══════════
  // RULED REMOVAL, NOT A CLEANUP. The P1 (pull-block conservation) and P2 (per-card expected
  // survivor) rows that stood here through slices 1 and 2 are OUT under D93 AMENDED. On this
  // gate's 1,728-key lattice they were VACUOUS: all 1,440 deload day builds that offer both
  // Pull superset A and Pull superset B enter with NEITHER block holding an E_PAT posterior
  // item, so the positive limb of the iff was never exercised, and both rows read identically
  // on V198 and V199 — a change-detector that cannot detect the change it names. Coverage of
  // the D93 pull swap now lives in tests/gates/g200_pull_arbitration.js (P1, P2, P2c, P2c-floor,
  // P4) on a mini-lattice built to CONTAIN the positive limb: 150 swap cards of 1,120 deload
  // day builds, red on V198 and green on V199. Do not re-add a pull-swap assertion to this
  // file without re-reading that one.
  //
  // P0 IS WHAT REPLACES THEM, and it is not a coverage claim. It is a BLINDNESS claim: it pins
  // the exact shape of this gate's inability to see the swap, so a silent vacuous PASS becomes
  // a RECORDED one. If the lattice, the pull pool or the conditioning draw ever changes such
  // that a Pull superset B enters a g199 deload card holding posterior work, P0 TRIPS and the
  // re-siting question comes back on the record instead of sliding through green. A TRIP HERE
  // IS A RE-SITING QUESTION, NOT AN ENGINE DEFECT.
  // PLABELS and the pull* counters above are kept precisely because P0 reads them.
  const enterPostB = Object.keys(N.pullSwapCensus||{})
    .reduce((a,k) => a + (/enterPost=\S*B/.test(String(k)) ? N.pullSwapCensus[k] : 0), 0);
  const PFAM_P2ALL = g(N.pullP2all,'Pull superset A') + g(N.pullP2all,'Pull superset B') + g(N.pullP2all,'Pull');
  ok(N.pullBothP1===1440 && enterPostB===0,
    'P0 RECORDED BLINDNESS: this gate CANNOT SEE the D93 pull swap. THE REAL ORACLE IS tests/gates/g200_pull_arbitration.js. '
    + 'BOTH POPULATIONS, WITH DENOMINATORS: deload day builds offering BOTH pull blocks at p1 == ' + N.pullBothP1 + ' (want 1,440) of ' + D_DAY + ' deload day builds, themselves of ' + N.dayCells + ' day builds across ' + N.configs + ' configs; of those both-enter cards, those whose Pull superset B holds an E_PAT posterior item at p1 == ' + enterPostB + ' (want 0). '
    + 'CENSUS ' + JSON.stringify(N.pullSwapCensus) + ' (want {"enterPost=none surv=A":1440}). STAGE pull-family census after the deload: A ' + g(N.pullP2all,'Pull superset A') + ' + B ' + g(N.pullP2all,'Pull superset B') + ' + bare Pull ' + g(N.pullP2all,'Pull') + ' = ' + PFAM_P2ALL + '. Bare `Pull` reads 0 at the stage BY CONSTRUCTION: singletonSupersetSweep (index.html:10010) runs post-build, downstream of p1/p2/p3. '
    + 'THE ZERO CARRIES ITS DENOMINATOR: 0 of ' + N.pullBothP1 + ', and that is the finding, not an omission. The positive limb of the D93 iff has population zero on this lattice, so nothing here distinguishes the V199 arbitration from V198 push order on the pull side; both artifacts read these same two numbers. g200 exercises that limb 150 times. '
    + 'STRUCTURAL REASON, not a shortfall: E_FOCUS here is [hypertrophy, balanced], and Pull superset B exists only on the else branch of the goal===strength || goal===hypertrophy guard at index.html:8223, so hypertrophy configs label the section Row volume and cannot contribute a B at all. B enters on only ' + g(N.pullP1all,'Pull superset B') + ' of ' + N.dayCells + ' day builds.');

  console.log('── G. Leg isolation and Explosive finisher, BOTH denominators pinned ──');
  ok(g(N.dropped,'Leg isolation')===1350,'G1 Leg isolation DROPPED by the deload == 1,350. DENOMINATOR: deload day builds (n='+D_DAY+'), of which '+g(N.lblP1,'Leg isolation')+' carried the block in. It only ever drops on a deload card, so the all-day-builds census moves by the same 1,350 ('+g(N.lblP1all,'Leg isolation')+' -> '+g(N.lblP2all,'Leg isolation')+'); got '+g(N.dropped,'Leg isolation'));
  ok(g(N.droppedPost,'Leg isolation')===1350,'G2 of those dropped Leg isolation blocks, POSTERIOR-HOLDING == 1,350. SECOND DENOMINATOR: dropped blocks, not killed days. Every Leg isolation block the deload drops was carrying hinge or hip_ext work; got '+g(N.droppedPost,'Leg isolation'));
  ok(g(N.killHold,'Leg isolation')===0,'G2b THIRD DENOMINATOR, and the one that moved: on days the deload takes from >0 posterior to 0, Leg isolation holds the dropped posterior '+g(N.killHold,'Leg isolation')+' times. V198\'s census put it at 1,080 of 2,220 such days; that 1,080 is a V198-arm number and this baseline-free gate asserts the candidate\'s 0 instead. Do not read 1,350, 1,350 and 0 as three readings of one quantity');
  ok(g(N.dropped,'Explosive finisher')===1744,'G3 Explosive finisher DROPPED == 1,744 of the '+g(N.lblP1,'Explosive finisher')+' entering on deload cards (same denominator as G1); got '+g(N.dropped,'Explosive finisher'));
  ok(g(N.droppedPost,'Explosive finisher')===84,'G4 of those, POSTERIOR-HOLDING == 84 (dropped-block denominator, as G2); got '+g(N.droppedPost,'Explosive finisher'));
  ok(g(N.killHold,'Explosive finisher')===60,'G4b on KILLED days it holds the dropped posterior 60 times (killed-day denominator, as G2b). 84 and 60 are different questions: on 24 of the 84 the day kept posterior elsewhere; got '+g(N.killHold,'Explosive finisher'));
  ok(Object.keys(N.killHold).length===1&&g(N.killHold,'Explosive finisher')===N.killedByDeload,
    'G5 the killed-day holder census is EXACTLY {Explosive finisher: '+N.killedByDeload+'}: no other label ever holds the posterior on a day the deload empties, so the 60 is a CEILING BY LABEL and a widening into optional or fluff sections would move it (got '+JSON.stringify(N.killHold)+')');

  console.log('     CENSUS lblP1all '+JSON.stringify(N.lblP1all)+' lblP2all '+JSON.stringify(N.lblP2all));
  console.log('     CENSUS killHold '+JSON.stringify(N.killHold));
  console.log('     CENSUS lens hand-only: '+topn(N.lensOnlyHand,10));
  console.log('     CENSUS lens engine-only: '+topn(N.lensOnlyEng,10));
  console.log('     CENSUS trapE any '+N.trapAnyE+' cand '+N.trapCandE+' nocand '+N.trapNoCandE+' viol '+N.trapSurvViolE+'/'+N.trapNoCandSurvViolE);
  console.log('     CENSUS swapReBudget '+N.swapReBudget+' of which the WEEK ships zero: '+N.swapReBudgetWeekZero);
  console.log('── H. the trap and the swap, two independent predicates ──');
  ok(N.trapAnyE===2166,'H1 ENGINE LENS ({hinge,hip_ext} per _pattern, the lens a naive pre-pass would itself have used): cards with a posterior MAIN and NO posterior accessory candidate == 2,166 of '+D_DAY+' deload day builds; got '+N.trapAnyE);
  ok(N.trapAny===2214,'H1b HAND-ORACLE LENS on the same cards: 2,214. The 48-card gap is '+topn(N.lensOnlyHand,4)+' — power-section items the hand table calls posterior chain and _pattern calls power. Both readings are stated because neither is wrong; got '+N.trapAny);
  ok(N.trapCandE===2160&&N.trapCand===2160,'H2 under BOTH lenses, cards that still have an accessory candidate to lose == 2,160 (engine '+N.trapCandE+', hand '+N.trapCand+'): the whole 48-card gap falls in the no-candidate bucket. This is the naive-pre-pass population');
  ok(N.trapSurvViolE===0&&N.trapSurvViol===0,'H3 on all 2,160, exactly one accessory block still survives ('+N.trapSurvViolE+' engine-lens / '+N.trapSurvViol+' hand-lens violations). A pre-pass that scored main sections would strip these cards bare');
  ok(N.trapNoCandE===6&&N.trapNoCandSurvViolE===0&&N.trapNoCand===54&&N.trapNoCandSurvViol===0,
    'H4 the remainder have no accessory candidate at all and correctly keep none: engine lens '+N.trapNoCandE+' cards ('+N.trapNoCandSurvViolE+' violations), hand lens '+N.trapNoCand+' ('+N.trapNoCandSurvViol+')');
  ok(N.swapPop===2160,'H5 the SWAP population (Leg superset A and B both offered, B survives, A does not) == 2,160 of '+N.swapBoth+' cards offering both; got '+N.swapPop);
  ok(N.trapAndSwap===0,'H6 trap and swap are DISJOINT: '+N.trapAndSwap+' cells in both. The swap needs a posterior accessory candidate and the trap needs none; their shared count of 2,160 is a coincidence and neither may stand in for the other');

  console.log('── I. re-loss downstream of the deload ──');
  ok(N.swapReCap===0,'I1 of the 2,160 newly-surviving swap cells, capRegionalFatigue empties '+N.swapReCap+'');
  ok(N.swapReBudget===108,'I2 of the same 2,160, '+N.swapReBudget+' cells reach the SHIPPED card with no posterior left, and NOT ONE of them loses it to a trim. capSessionBudget keeps the section and D85\'s floor keeps the item; what they carried entering is '+topn(N.reBudLost,2)+'. I2c names what actually happens to it');
  ok(g(N.reBudRename,'Leg superset B: Banded hip thrust -> Burpees')===N.swapReBudget,
    'I2c and the cause is named, once, for all '+N.swapReBudget+': a POST-BUILD RENAMER rewrites the item after capSessionBudget. The section survives in place, its content does not: '+topn(N.reBudRename,2));
  ok(g(N.reBudTier,'bodyweight')===N.swapReBudget,'I2d every one of them is on the bodyweight tier ('+JSON.stringify(N.reBudTier)+'). This is a RENAME-SURFACE defect that predates D91 and is only made visible by it: the tier renamer does not read the posterior-chain lens that capSessionBudget and recoveryDeload both defend. NOT fixed here, and not fixable in a gate — it needs a ruling');
  ok(N.swapReBudgetWeekZero===0,'I2b and not one of those '+N.swapReBudget+' cells leaves its WEEK without posterior ('+N.swapReBudgetWeekZero+'): the coaching claim behind criterion 2 holds at the level it is made');
  ok(!!ERA&&N.capLSBkilled===ERA.capLSBkilled,'I3 capRegionalFatigue kills exactly '+ERAv('capLSBkilled')+' Leg superset B sections (the V'+IP.version+' row), out of '+N.capLSBin+' entering the cap (all day builds, n='+N.dayCells+'); got '+N.capLSBkilled+NOROW);

  console.log('── J. card order preserved IN PLACE ──');
  ok(N.orderViol===0,'J1 the surviving sections are a subsequence of the entering sections on every deload card: nothing reordered, nothing appended ('+N.orderViol+' violations of '+D_DAY+')');
  ok(N.orderNonVac>0,'J2 J1 is not vacuous: '+N.orderNonVac+' deload cards actually lost at least one section');
  ok(N.legAfterHipViol===0,'J3 no card ends with a leg block behind Hip stability or Foot & ankle that did not enter that way ('+N.legAfterHipViol+' violations)');
  done();
}
