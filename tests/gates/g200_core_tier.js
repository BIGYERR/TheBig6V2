// ════════════════════════════════════════════════════════════════════════════════════
// g200_core_tier — V200 D89: "a drill declared family 'core' in _AUX_FAMILY is a core
// drill, never a loaded compound." The clause lives in _compoundTier, immediately after
// the _isCompound gate, and returns 0.
//
// WHAT SHIPPED, STATED EXACTLY (coach's amendment, and this gate does not overclaim it).
// _isCompound has exactly TWO readers: _compoundTier and _itemCost. _itemCost is ruled
// OUT of V200. So what changed is that capSessionBudget no longer SKIPS `Pallof press`
// as a protected tier-3 barbell compound. It STILL PRICES it at sets x 1.5, because
// _itemCost asks _isCompound directly and _isCompound is untouched (assertion C1 below
// is the proof the edit landed in the right function). No assertion in this file says
// the budget "treats Pallof press like a core drill": the skip changed, the price did not.
//
// ORACLE INDEPENDENCE
//   A  the 23 declared-core names are a HAND TABLE, typed once off the artifact. The
//      gate never iterates _AUX_FAMILY and asserts it equals itself; it asserts the
//      source text declares exactly 23 names ':'core'' and that the hand table is that
//      set, then asserts the ENGINE returns 0 for each.
//   B  the D96 negative-control tiers are a hand table (V198/V199 population, untouched).
//   D  R5's threshold and copy template are PARSED OUT OF THE ARTIFACT and asserted
//      before use; the V199 sentence is READ BACK from a real swapLoadNote() call on the
//      counterfactual, never retyped.
//   E  R6's predicate is PARSED OUT OF THE ARTIFACT as source text and asserted before
//      use, the way tests/measure/v200_d89_tier3_readers.js does. The threshold is never
//      retyped.
//   F/G the counterfactual is the CANDIDATE with the one clause line removed. F1 proves
//      that counterfactual matches its era row in MANNY_CORE_OFF_DIGEST_BY_VERSION, the
//      harness table that records the clause-off HALF_MANNY digest per version, and that
//      the shipped arm matches its row in MANNY_DIGEST_BY_VERSION. Row existence is a
//      conjunct, so a missing row fails loudly. On V200 to V202 the clause-off row is
//      6e32421331693437, the digest V198 and V199 shipped and four other gates pin; D117
//      moved BOTH arms on V203, which is why neither arm is a literal here any more (D120).
//      Every before/after number is measured against the counterfactual on a stated
//      lattice, and every population is printed with a denominator.
//
// LATTICE (stated, fixed, deterministic)
//   HALF_MANNY  +  6 equipment x 2 liftingFocus x 2 experience x 2 seeds = 48
//   = 49 configs, 1798 grid lines.
//
// ACCEPTANCE: RED on V199, green on V200. On V199 the clause is absent, so F0 fails, the
// counterfactual collapses onto the candidate and the before/after pins fail with it.
//
// usage: node tests/gates/g200_core_tier.js <candidate.html> [baseline.html — ignored]
// ════════════════════════════════════════════════════════════════════════════════════
const fs=require('fs'), os=require('os'), path=require('path');
const {load, fixtures, weekGrid, progDigest, DAYS,
       MANNY_DIGEST_BY_VERSION, MANNY_CORE_OFF_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));

const ART=process.argv[2]||path.join(__dirname,'..','..','index.html');
let PASS=0, FAIL=0;
const ok=(c,m)=>{ if(c){PASS++;console.log('  ok   '+m);} else {FAIL++;console.log('  FAIL '+m);} };

const RAW=fs.readFileSync(ART,'utf8');
const IA=load(ART);
IA.eval("var __T=function(n){ try{return _compoundTier(n);}catch(e){return -1;} };"
       +"var __IC=function(n){ try{return !!_isCompound(n);}catch(e){return null;} };"
       +"var __PAT=function(n){ var p; try{p=_pattern(n);}catch(e){return 'ERR';} return (p===null||p===undefined)?'NULL':String(p); };"
       +"var __LN=function(a,b){ try{return swapLoadNote(a,b);}catch(e){return 'ERR:'+e.message;} };");
const T=IA.eval('__T'), IC=IA.eval('__IC'), PAT=IA.eval('__PAT'), LN=IA.eval('__LN');

// ── the clause, and the counterfactual built by removing it ────────────────────────
const CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";
const CLAUSE_N=RAW.split(CLAUSE).length-1;

console.log('── A. the declared-core family returns tier 0 (hand table, 23 names) ──');
// Typed off index.html:8780-8792 once. These are the names the author filed as family
// 'core'; the map is the authority on what a core drill is, which is the whole ruling.
const CORE23=['Ab wheel rollouts','Bird dogs','Dead bugs','Dead bug (slow tempo)',
 'Garhammer raises','Hanging knee raises','Hanging leg raises','Hanging hold',
 'L-sit hold','McGill curl-up','Pallof press','Plank hold','RKC plank',
 'Side plank','Superman','Toes-to-bar','Windshield wipers',
 'Cable woodchoppers','Landmine rotations','Medicine ball rotary toss',
 'Standing torso rotations (slow)','Side plank thread-the-needle',
 'Band woodchopper (door anchor)'];
// A0 — the denominator is not allowed to drift underneath the hand table. Counted as
// SOURCE TEXT inside the _AUX_FAMILY literal, not by asking the engine.
const MAPSRC=(RAW.match(/const _AUX_FAMILY=\{[\s\S]*?\n\};/)||[''])[0];
const DECLARED=(MAPSRC.match(/'[^']+':'core'/g)||[]).map(s=>s.slice(1,s.indexOf("':'")));
ok(DECLARED.length===23, 'A0a the artifact declares exactly 23 names as family core (got '+DECLARED.length+')');
ok(CORE23.length===23 && CORE23.every(n=>DECLARED.indexOf(n)>=0) && DECLARED.every(n=>CORE23.indexOf(n)>=0),
   'A0b the 23-name hand table is exactly the declared-core set (hand-only: '
   +CORE23.filter(n=>DECLARED.indexOf(n)<0).join(', ')+' | source-only: '+DECLARED.filter(n=>CORE23.indexOf(n)<0).join(', ')+')');
const nz=CORE23.filter(n=>T(n)!==0);
ok(nz.length===0, 'A1 all 23 declared-core names return _compoundTier 0; nonzero '+nz.length+' of 23 ['
   +nz.map(n=>n+':'+T(n)).join(', ')+']');
ok(T('Pallof press')===0, 'A2 Pallof press returns _compoundTier 0 (got '+T('Pallof press')
   +'); it was the ONE of 23 reading 3 on V199');

console.log('── B. D96 negative controls: the tier-3 population is untouched ──');
// Hand table. These are V198/V199 values, deliberately NOT part of D89. An assertion
// that any of them MOVED is a regression, not a finding.
const CTRL=[['Jump squats',3],['TRX row (if available)',3],['Straight-arm pulldown',3],
 ['Back squat',3],['Bench press',3],['Overhead press',3],['Barbell row',3],['Barbell deadlift',3],
 ['Dumbbell bench press',2],['Chinups',1],['Band pull-apart',1]];
const bad=CTRL.filter(r=>T(r[0])!==r[1]);
ok(bad.length===0, 'B1 all 11 D96 control tiers hold; moved '+bad.length+' of 11 ['
   +bad.map(r=>r[0]+' expected '+r[1]+' got '+T(r[0])).join(', ')+']');
ok(T('Jump squats')===3 && T('TRX row (if available)')===3 && T('Straight-arm pulldown')===3,
   'B2 D96\'s three fall-through names still read 3 (the ruling SELECTS a family, it does not delete a tier)');
ok(['Back squat','Bench press','Overhead press','Barbell row','Barbell deadlift'].every(n=>T(n)===3),
   'B3 the five barbell compounds still read 3');

console.log('── C. the clause is in _compoundTier and NOT in _isCompound ──');
ok(IC('Pallof press')===true, 'C1 _isCompound(Pallof press) is still TRUE (got '+IC('Pallof press')
   +'): the edit landed in _compoundTier, which is what coach ruled, and _itemCost still prices it at sets x 1.5');
// Source-slice proof, independent of the runtime: the clause sits inside _compoundTier's
// body and nowhere inside _isCompound's body.
const ICSRC=(RAW.match(/\nfunction _isCompound\(name\)\{[\s\S]*?\n\}\n/)||[''])[0];
const CTSRC=(RAW.match(/\nfunction _compoundTier\(name\)\{[\s\S]*?\n\}\n/)||[''])[0];
ok(CLAUSE_N===1, 'C2a the family-core clause appears exactly once in the artifact (got '+CLAUSE_N+')');
ok(CTSRC.indexOf(CLAUSE)>=0, 'C2b the clause is inside _compoundTier\'s body');
ok(ICSRC.length>0 && ICSRC.indexOf("_auxFamily")<0, 'C2c _isCompound\'s body does not mention _auxFamily at all');

console.log('── D. R5 swapLoadNote — ATHLETE-FACING COPY ──');
const R5=RAW.match(/\n(  const d=_compoundTier\(outName\)-_compoundTier\(candName\);\n  if\(d<(\d)\) return '';\n  return '([^']+)'\+outName\.toLowerCase\(\)\+'([^']+)';)\n/);
ok(!!R5, 'D0a R5\'s source parses to the expected shape (threshold + copy template)');
const R5MIN=R5?+R5[2]:null;
ok(R5MIN===2, 'D0b R5\'s parsed threshold is d<2 (got '+R5MIN+'); every claim below uses the PARSED value');
// D1 is the assertion that must survive a `return 2` mutation: the candidate is tier 0
// and NOT family core, so a clause returning 2 gives d=2, which does NOT clear d<2 and
// the sentence comes back. That is exactly why coach rejected the token model.
ok(T('Plank shoulder taps')===0, 'D1a the probe candidate Plank shoulder taps is tier 0 and not family core (got '+T('Plank shoulder taps')+')');
ok(LN('Pallof press','Plank shoulder taps')==='', 'D1b swapLoadNote(Pallof press, Plank shoulder taps) is the empty string (got '
   +JSON.stringify(LN('Pallof press','Plank shoulder taps'))+')');
ok(LN('Pallof press','Chinups')==='', 'D1c swapLoadNote(Pallof press, Chinups) [tier 1] is the empty string (got '
   +JSON.stringify(LN('Pallof press','Chinups'))+')');

console.log('── E. R6 openSwapSheet HEAVY COMPOUND tag — ATHLETE-FACING COPY ──');
const R6=RAW.match(/\n(  const isHeavyCompound=!isMainSlot&&_compoundTier\(item\.name\)>=(\d);)\n/);
ok(!!R6, 'E0a R6\'s predicate parses out of the artifact as source text');
const R6MIN=R6?+R6[2]:null;
ok(R6MIN===3, 'E0b R6\'s parsed threshold is >=3 (got '+R6MIN+'); the threshold is never retyped below');
const heavy=(n,isMainSlot)=>!isMainSlot && T(n)>=R6MIN;
ok(heavy('Pallof press',false)===false, 'E1 the HEAVY COMPOUND predicate is FALSE for Pallof press in a non-main slot');
ok(heavy('Back squat',false)===true, 'E2 the predicate is still TRUE for Back squat in a non-main slot (the tag is not dead)');
ok(heavy('Back squat',true)===false, 'E3 the predicate is FALSE in a main slot (MAIN LIFT wins the tag)');

console.log('── F/G. the counterfactual: the candidate with the one clause line removed ──');
ok(CLAUSE_N===1, 'F0 the V200 clause is present exactly once, so the counterfactual is constructible (count '+CLAUSE_N+')');
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'g200ct-'));
const MP=path.join(TMP,'counterfactual.html');
fs.writeFileSync(MP, RAW.replace(CLAUSE,''));
const MO=load(MP);
MO.eval("var __LN=function(a,b){ try{return swapLoadNote(a,b);}catch(e){return 'ERR:'+e.message;} };"
       +"var __T=function(n){ try{return _compoundTier(n);}catch(e){return -1;} };");
const MLN=MO.eval('__LN'), MT=MO.eval('__T');

const digC=progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
const digM=progDigest(MO.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
const CORE_OFF_ROW=MANNY_CORE_OFF_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)
ok(!!CORE_OFF_ROW&&digM===CORE_OFF_ROW, 'F1a the counterfactual matches the V'+IA.version+' row of MANNY_CORE_OFF_DIGEST_BY_VERSION ('+(CORE_OFF_ROW||'NO ROW')+') (got '+digM+')'+(CORE_OFF_ROW?'':' — no MANNY_CORE_OFF_DIGEST_BY_VERSION row for V'+IA.version+': an unruled counterfactual digest move'));
const SHIPPED_ROW=MANNY_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)
ok(!!SHIPPED_ROW&&digC===SHIPPED_ROW, 'F1b the candidate ships the V'+IA.version+' row of MANNY_DIGEST_BY_VERSION ('+(SHIPPED_ROW||'NO ROW')+') (got '+digC+')'+(SHIPPED_ROW?'':' — no MANNY_DIGEST_BY_VERSION row for V'+IA.version+': an unruled digest move'));

// D3 / E-non-vacuity: the V199 sentence and the V199 tag, read back from real calls on
// the counterfactual. Without these, D1 and E1 would also pass on a build where
// swapLoadNote had simply been deleted.
const V199NOTE=MLN('Pallof press','Plank shoulder taps');
const TEMPLATE=R5?(R5[3]+'Pallof press'.toLowerCase()+R5[4]):null;
ok(V199NOTE.length>0 && V199NOTE===TEMPLATE,
   'D2a on the counterfactual the same call returns the V199 sentence, read back from a real call: '+JSON.stringify(V199NOTE));
ok(MT('Pallof press')===3, 'D2b on the counterfactual Pallof press is tier 3 (got '+MT('Pallof press')+'): D1b is not vacuous');
ok((!false && MT('Pallof press')>=R6MIN)===true, 'E4 on the counterfactual the HEAVY COMPOUND predicate is TRUE for Pallof press: E1 is not vacuous');

// ── the lattice ────────────────────────────────────────────────────────────────────
const EQ=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const FOC=['balanced','support_prevention'];
const EXP=['intermediate','advanced'];
const SEEDS=[4242,9001];
const CFGS=[Object.assign({},fixtures.HALF_MANNY)];
EQ.forEach(e=>FOC.forEach(f=>EXP.forEach(x=>SEEDS.forEach(sd=>CFGS.push({
  name:'L', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null,
  liftingFocus:f, experience:x, ageBracket:'18-35', equipment:e, unit:'lbs',
  restDays:['sun'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:sd})))));

const HOOK="var __CRF=function(j){ return JSON.stringify(capRegionalFatigue(JSON.parse(j),null,null,'base')); };"
 +"var __DED=function(wj,cj,s,t){ var w=JSON.parse(wj); var m=deconflictAdjacentDupes(w,JSON.parse(cj),s,t); return JSON.stringify([m,w]); };"
 +"var __SC=function(n,dj,w,pj){ return JSON.stringify(swapCandidates(n,JSON.parse(dj),w,JSON.parse(pj))); };"
 +"var __AC=function(dj,w,pj){ return JSON.stringify(addCandidates(JSON.parse(dj),w,JSON.parse(pj))); };";
IA.eval(HOOK); MO.eval(HOOK);
const CRF=[IA.eval('__CRF'),MO.eval('__CRF')], DED=[IA.eval('__DED'),MO.eval('__DED')];
const SC=[IA.eval('__SC'),MO.eval('__SC')], AC=[IA.eval('__AC'),MO.eval('__AC')];

let lines=0, changed=0, pallofCells=0, coreLost=0, lenMismatch=0, ruledShape=0, otherShape=[];
let cellIds=[];
let r1n=0,r1d=0,r2n=0,r2d=0,r3n=0,r3d=0,r4n=0,r4d=0;
const BEFORE='Core — Anti-Rotation[Pallof press]';
const AFTER ='Core — Anti-Rotation[Plank shoulder taps]';
CFGS.forEach((cfg,ci)=>{
  const pc=IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const pm=MO.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const gc=weekGrid(pc).split('\n'), gm=weekGrid(pm).split('\n');
  if(gc.length!==gm.length) lenMismatch++;
  lines+=gm.length;
  for(let i=0;i<Math.min(gc.length,gm.length);i++){
    if(/Pallof press/.test(gm[i])) pallofCells++;
    if(gc[i]===gm[i]) continue;
    changed++;
    const headB=gm[i].split(' :: ')[0], headA=gc[i].split(' :: ')[0];
    const bb=(gm[i].split(' :: ')[1]||'').split(' | '), aa=(gc[i].split(' :: ')[1]||'').split(' | ');
    const diffIdx=[]; for(let k=0;k<Math.max(bb.length,aa.length);k++) if(bb[k]!==aa[k]) diffIdx.push(k);
    const isRuled = headB===headA && bb.length===aa.length && diffIdx.length===1
      && bb[diffIdx[0]]===BEFORE && aa[diffIdx[0]]===AFTER;
    if(isRuled) ruledShape++; else otherShape.push('cfg'+ci+' :: '+gm[i]+'  -->  '+gc[i]);
    cellIds.push('cfg'+ci+' '+headB.split(' ').slice(0,2).join(' '));
    if(aa.filter(s=>/^Core/.test(s)).length < bb.filter(s=>/^Core/.test(s)).length) coreLost++;
  }
  const wj=JSON.stringify(pm.weeks), cj=JSON.stringify(pm.cfg||cfg), tw=Object.keys(pm.weeks).length;
  r2d++; if(DED[0](wj,cj,cfg.seed,tw)!==DED[1](wj,cj,cfg.seed,tw)) r2n++;
  const pj=JSON.stringify(pm);
  Object.keys(pm.weeks).forEach(wk=>{['mon','tue','wed','thu','fri','sat','sun'].forEach(dk=>{
    const day=pm.weeks[wk][dk]; if(!day||!day.sections||!day.sections.length) return;
    const sj=JSON.stringify(day.sections);
    r1d++; if(CRF[0](sj)!==CRF[1](sj)) r1n++;
    const names=[].concat.apply([],day.sections.map(s=>(s.items||[]).map(i=>i.name)));
    if(names.indexOf('Pallof press')<0) return;
    const dj=JSON.stringify(day);
    r4d++; if(AC[0](dj,+wk,pj)!==AC[1](dj,+wk,pj)) r4n++;
    names.forEach(n=>{ r3d++; if(SC[0](n,dj,+wk,pj)!==SC[1](n,dj,+wk,pj)) r3n++; });
  });});
});
try{ fs.unlinkSync(MP); fs.rmdirSync(TMP); }catch(e){}

console.log('── F. R7 the ruled card shape, on the stated 49-config lattice ──');
ok(CFGS.length===49, 'F2a the lattice is 49 configs (got '+CFGS.length+')');
ok(lines===1798, 'F2b the lattice is 1798 grid lines (got '+lines+')');
ok(lenMismatch===0, 'F2c 0 of 49 configs change their day count (got '+lenMismatch+')');
ok(pallofCells===35, 'F3 the before-population is 35 of 1798 cells carrying Pallof press (got '+pallofCells
   +'): the lattice reaches the movement, so F4 is a measurement and not an empty set');
ok(changed===1, 'F4a EXACTLY 1 of 1798 cells changes (got '+changed+') ['+cellIds.join(', ')+']');
ok(ruledShape===1 && otherShape.length===0,
   'F4b all 1 changed cells are the ruled shape "Core — Anti-Rotation[Pallof press]" -> "[Plank shoulder taps]" with the rest of the card byte-identical; unclassified '
   +otherShape.length+' ['+otherShape.slice(0,3).join(' ;; ')+']');
ok(cellIds.length===1 && cellIds[0]==='cfg0 W11 MON',
   'F4c the changed cell is the ruling\'s cell: HALF_MANNY W11 MON (got '+(cellIds.join(', ')||'none')+')');
ok(coreLost===0, 'F5 0 of 1798 days lose a core section (got '+coreLost+'): the ruling SELECTS a drill, it does not delete a section');

console.log('── G. R1 R2 R3 R4 move by EXACTLY ZERO ──');
ok(PAT('Pallof press')==='NULL', 'G0 _pattern(Pallof press) is null (got '+PAT('Pallof press')
   +'): R3 and R4 drop null-pattern names before ranking, which is the structural reason they cannot see this tier change');
ok(r1n===0, 'G1 R1 capRegionalFatigue decides identically on '+(r1d-r1n)+' of '+r1d+' harvested days (differences '+r1n+', required 0)');
ok(r1d===1796, 'G1d the R1 denominator is the stated 1796 harvested days (got '+r1d+')');
ok(r2n===0, 'G2 R2 deconflictAdjacentDupes decides identically on '+(r2d-r2n)+' of '+r2d+' week-sets (differences '+r2n+', required 0)');
ok(r3n===0, 'G3 R3 swapCandidates returns identically on '+(r3d-r3n)+' of '+r3d+' (name, day) pairs (differences '+r3n+', required 0)');
ok(r3d===213, 'G3d the R3 denominator is the stated 213 pairs (got '+r3d+')');
ok(r4n===0, 'G4 R4 addCandidates returns identically on '+(r4d-r4n)+' of '+r4d+' Pallof-carrying days (differences '+r4n+', required 0)');
ok(r4d===35, 'G4d the R4 denominator is the stated 35 days (got '+r4d+')');

console.log('PASS '+PASS+' FAIL '+FAIL);
process.exit(FAIL?1:0);
