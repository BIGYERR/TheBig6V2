// g198_posterior_floor — V198 D85: "the budget may not spend the day's last posterior
// chain item." capSessionBudget refuses to trim a candidate whose _pattern is hinge or
// hip_ext while the day holds exactly one such item, counted live on `out` every trim
// iteration.
//
// ORACLE INDEPENDENCE. Section A calls capSessionBudget with HAND-BUILT days and asserts
// a HAND-COMPUTED after-list. The costs are arithmetic done here (cap 20, every item
// n×reps costing n sets, no stretches, no holds), the trim order is read off the ruled
// order (optional/finisher rank 3, latest position first), and the expected survivor is
// named. No assertion anywhere compares the engine to its own output.
// Section B states the ruling as an invariant over real builds and checks it against an
// instrumented copy of the artifact: if the day entered the budget carrying posterior
// chain, it leaves carrying posterior chain. Section C pins Mario's live program.
//
// A1 and A4 would be vacuous if the guard simply protected every hinge, so A2 proves the
// guard releases a hinge while a second one lives, and A2 is also the LIVE-COUNT proof:
// with the count precomputed before the loop it reads 2 forever and the second pass eats
// the survivor. A3 is the leg_iso control (Leg extension and Lying leg curl are not
// posterior chain and stay budget fodder). A5 is Mario's termination condition: when the
// last hinge and a tier-3 barbell are the only candidates left, `if(!best) break` exits
// with the day OVER cap instead of spinning.
//
// usage: node tests/gates/g198_posterior_floor.js <candidate.html> [baseline.html]
const fs=require('fs'), os=require('os'), path=require('path');
const {load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));

const ART=process.argv[2]||path.join(__dirname,'..','..','index.html');
let PASS=0, FAIL=0;
const ok=(c,m)=>{ if(c){PASS++;console.log('  ok   '+m);} else {FAIL++;console.log('  FAIL '+m);} };

const IA=load(ART);
IA.eval("var __CSB=function(j){ return JSON.stringify(capSessionBudget(JSON.parse(j), null)); };"
       +"var __TIER=function(n){ try{return _compoundTier(n);}catch(e){return -1;} };"
       +"var __PAT=function(n){ try{return _pattern(n);}catch(e){return 'ERR';} };");
const CSB=IA.eval('__CSB'), TIER=IA.eval('__TIER'), PAT=IA.eval('__PAT');
// Read once, used twice: A6 folds leg_iso out of it and section B instruments it.
const RAW_A6=fs.readFileSync(ART,'utf8');
const run=secs=>JSON.parse(CSB(JSON.stringify(secs)));
const names=out=>[].concat.apply([],(out||[]).map(s=>(s.items||[]).map(i=>i.name)));
const sets=d=>{const m=String(d||'').match(/(\d+)\s*[×x]/);return m?parseInt(m[1],10):3;};
const cost=out=>[].concat.apply([],(out||[]).map(s=>s.items||[])).reduce((a,i)=>a+sets(i.detail),0);
const MAIN={label:'Main — Lower', items:[{name:'Back squat', detail:'5×5'}]};
const fin=list=>({label:'Finisher', items:list.map(n=>({name:n[0], detail:n[1]}))});

console.log('── A. constructed days, hand-computed after-lists (cap 20) ──');
// A0 — the precondition every constructed day rests on: the barbell back squat in the
// protected main section is tier 3, and the dumbbell variants below are not, so the
// tier-3 skip cannot be what is saving them.
ok(TIER('Back squat')===3, 'A0a Back squat is tier 3 (protected main, never fodder)');
ok(TIER('Dumbbell Romanian deadlift')!==3, 'A0b Dumbbell Romanian deadlift is NOT tier 3 (tier '+TIER('Dumbbell Romanian deadlift')+')');
ok(PAT('Dumbbell Romanian deadlift')==='hinge', 'A0c _pattern(Dumbbell Romanian deadlift) = hinge (got '+PAT('Dumbbell Romanian deadlift')+')');
ok(PAT('Back extension')==='hip_ext', 'A0d _pattern(Back extension) = hip_ext (got '+PAT('Back extension')+')');
ok(PAT('Leg extension')==='leg_iso', 'A0e _pattern(Leg extension) = leg_iso, excluded from the floor (got '+PAT('Leg extension')+')');

// A1 — 29 units, cap 20, three trims needed. Rank-3 finisher, latest position first, so
// the untouched order of removal is RDL, Cable fly, Face pull. The floor holds the RDL
// (the day's only hinge), pushing the third removal onto Hammer curl.
const A1=run([MAIN, fin([['Dumbbell lateral raise','4×12'],['Cable triceps pushdown','4×12'],
  ['Hammer curl','4×12'],['Face pull','4×15'],['Cable fly','4×12'],['Dumbbell Romanian deadlift','4×10']])]);
ok(names(A1).indexOf('Dumbbell Romanian deadlift')>=0, 'A1a the day\'s only hinge survives a three-item trim');
ok(names(A1).join('|')==='Back squat|Dumbbell lateral raise|Cable triceps pushdown|Dumbbell Romanian deadlift',
   'A1b after-list is the hand table: squat, lateral raise, pushdown, RDL (got '+names(A1).join(', ')+')');
ok(cost(A1)===17, 'A1c hand-computed cost 17 (got '+cost(A1)+')');

// A2 — the same day with Cable fly swapped for a Kettlebell swing, so the day starts with
// TWO hinges. Pass 1 has two, so the RDL is ordinary fodder and goes. Passes 2 and 3 see
// ONE and hold the swing. A precomputed count reads 2 on every pass and eats the swing.
const A2=run([MAIN, fin([['Dumbbell lateral raise','4×12'],['Cable triceps pushdown','4×12'],
  ['Hammer curl','4×12'],['Face pull','4×15'],['Kettlebell swing','4×12'],['Dumbbell Romanian deadlift','4×10']])]);
ok(names(A2).indexOf('Dumbbell Romanian deadlift')<0, 'A2a with two hinges on the day the later one IS trimmed (floor is 1, not 2)');
ok(names(A2).indexOf('Kettlebell swing')>=0, 'A2b the count is re-read every pass: the last hinge is held on pass 2');
ok(names(A2).join('|')==='Back squat|Dumbbell lateral raise|Cable triceps pushdown|Kettlebell swing',
   'A2c after-list is the hand table: squat, lateral raise, pushdown, swing (got '+names(A2).join(', ')+')');

// A3 — leg_iso control. Leg extension and Lying leg curl share EXLIB.leg_accessory with
// Leg press; leg_iso is not a posterior signal and neither name is protected.
const A3=run([MAIN, fin([['Dumbbell lateral raise','4×12'],['Cable triceps pushdown','4×12'],
  ['Hammer curl','4×12'],['Face pull','4×15'],['Lying leg curl','4×12'],['Leg extension','4×12']])]);
ok(names(A3).indexOf('Leg extension')<0 && names(A3).indexOf('Lying leg curl')<0,
   'A3a neither leg_iso name is held by the floor (got '+names(A3).join(', ')+')');
ok(names(A3).join('|')==='Back squat|Dumbbell lateral raise|Cable triceps pushdown|Hammer curl',
   'A3b after-list is the hand table: squat, lateral raise, pushdown, hammer curl (got '+names(A3).join(', ')+')');

// A4 — hip_ext half of the ruled set.
const A4=run([MAIN, fin([['Dumbbell lateral raise','4×12'],['Cable triceps pushdown','4×12'],
  ['Hammer curl','4×12'],['Face pull','4×15'],['Cable fly','4×12'],['Back extension','4×12']])]);
ok(names(A4).indexOf('Back extension')>=0, 'A4a the day\'s only hip_ext survives a three-item trim');
ok(names(A4).join('|')==='Back squat|Dumbbell lateral raise|Cable triceps pushdown|Back extension',
   'A4b after-list is the hand table (got '+names(A4).join(', ')+')');

// A5 — TERMINATION. 21 units, cap 20. The two candidates are a tier-3 barbell press and
// the day's last hinge; both are skipped, `best` stays null, the loop breaks and the day
// ships OVER cap by ruling. It must not spin, and it must not delete anything.
const t0=Date.now();
const A5=run([MAIN, {label:'Accessory', items:[{name:'Barbell bench press',detail:'8×5'},
  {name:'Dumbbell Romanian deadlift',detail:'8×5'}]}]);
const dt=Date.now()-t0;
ok(TIER('Barbell bench press')===3, 'A5a Barbell bench press is tier 3 (the other ineligible candidate)');
ok(names(A5).join('|')==='Back squat|Barbell bench press|Dumbbell Romanian deadlift',
   'A5b every candidate ineligible: nothing is removed (got '+names(A5).join(', ')+')');
ok(cost(A5)===21, 'A5c the day ships at 21 units, OVER the cap of 20, by ruling (got '+cost(A5)+')');
ok(dt<2000, 'A5d the trim loop terminates rather than spinning ('+dt+' ms)');

console.log('── B. the ruling as a build invariant (instrumented sweep) ──');
// Instrument the single capSessionBudget call site on a COPY so both the argument and the
// return value of every invocation are visible. The artifact itself is never written.
const CALLSITE="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });\n";
const CALLSITE_REC="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){ var __gb=_day.sections; _day.sections=capSessionBudget(_day.sections,_day.cardio); if(typeof globalThis!=='undefined'&&globalThis.__GREC) globalThis.__GREC.push({b:__gb,a:_day.sections}); } });\n";
const RAW=RAW_A6;
const anchorN=RAW.split(CALLSITE).length-1;
ok(anchorN===1, 'B0 capSessionBudget call-site anchor is unique (count '+anchorN+')');
let B_in=0, B_out0=0, B_held=0, B_cells=0, B_iso=0, B_press=0;
if(anchorN===1){
  const tmp=path.join(os.tmpdir(),'g198_instr_'+process.pid+'.html');
  fs.writeFileSync(tmp, RAW.replace(CALLSITE, CALLSITE_REC));
  const IB=load(tmp);
  IB.eval('globalThis.__GREC=[];');
  // HAND regex for {hinge, hip_ext}. leg_iso and calf_iso are deliberately absent.
  const R=/deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull|hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i;
  const pc=secs=>[].concat.apply([],(secs||[]).map(s=>(s.items||[]).map(i=>String(i.name||''))))
    .reduce((a,n)=>a+(R.test(n)?1:0),0);
  // HAND regex for the leg_iso names A6 asks about, written from the library and not from
  // _pattern, so the count below is not the engine agreeing with itself. A6b0 checks the
  // engine's own classifier separately, which is how a drift between the two shows up — and
  // it did: 'Leg press' is deliberately NOT in this regex. A6b0 reads the engine and finds
  // three of the four names are leg_iso; Leg press is not one of them, so a day carrying a
  // leg press is not a day the leg_iso fold can touch, and counting it here made A6b read
  // 4/864 for a reason that had nothing to do with the claim. It is counted on its own line
  // instead, because four invocations being offered a leg press is a fact worth keeping.
  const RISO=/leg extension|lying leg curl|seated leg curl/i;
  const RPRESS=/leg press/i;
  const countIf=(secs,re)=>[].concat.apply([],(secs||[]).map(s=>(s.items||[]).map(i=>String(i.name||''))))
    .reduce((a,n)=>a+(re.test(n)?1:0),0);
  const ic=secs=>countIf(secs,RISO);
  const TIERS=['commercial','home_full','home_basic','bodyweight','crossfit','minimal'];
  const INJ=[null,{region:'lowback',tier:'protect'},{region:'shoulder',tier:'protect'},{region:'knee',tier:'protect'}];
  TIERS.forEach(t=>INJ.forEach(inj=>{
    const cfg={name:'M',primaryPath:'lift',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null,
      liftingFocus:'balanced',experience:'advanced',ageBracket:'18-35',equipment:t,unit:'lbs',
      restDays:['sun'],days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed:1013};
    if(inj) cfg.injury={region:inj.region,tier:inj.tier};
    IB.eval('globalThis.__GREC.length=0;');
    IB.buildProgram(cfg);
    const REC=IB.eval('globalThis.__GREC');
    REC.forEach(r=>{ B_cells++; const pb=pc(r.b), pa=pc(r.a);
      if(ic(r.b)>0) B_iso++;
      if(countIf(r.b,RPRESS)>0) B_press++;
      if(pb>0){ B_in++; if(pa===0) B_out0++; if(pb===1 && pa===1 && JSON.stringify(r.b)!==JSON.stringify(r.a)) B_held++; } });
  }));
  ok(B_cells>500, 'B1 the sweep is live: '+B_cells+' budget invocations observed (>500)');
  ok(B_in>200, 'B2 the invariant is not vacuous: '+B_in+' cells entered the budget carrying posterior chain (>200)');
  ok(B_out0===0, 'B3 no cell that entered with posterior chain leaves without it ('+B_out0+' violations of '+B_in+')');
  ok(B_held>0, 'B4 the floor is exercised: '+B_held+' cells kept their single posterior item while the loop trimmed elsewhere');
}else{
  console.log('  (B1-B4 skipped: call-site anchor missing)');
}

// ── A6. THE leg_iso EXCLUSION, MEASURED ────────────────────────────────────
// A0e, A3a and A3b all pass on V197 too: they say what leg_iso IS, not what excluding it
// DOES. Until now the exclusion rested on sabotage M3 alone, and a mutation tests the gate,
// not the artifact. A6 is the differential M3 cannot be.
// FINDING, V198, and it is the whole point of this block: NOTHING CHANGES. A copy of the
// artifact with leg_iso folded into the posterior set (M3's mutation exactly) ships
// byte-identical programs — 0 of the 24 configs below, and 0 of the 288 cells on the full
// WIDE lattice (tests/measure/v198_d85_displacement.js and the V198 leg_iso probe both swept
// it). The reason is in B's own sweep: not one budget invocation on this lattice is even
// OFFERED a leg_iso item, so the floor has nothing to fold in. On this lattice the leg_iso
// exclusion is DOCTRINE-ONLY: it is right because leg_iso is a quad movement and the
// posterior floor is about the posterior chain, not because the engine behaves differently
// without it. DO NOT read sabotage M3 as evidence for it. M3 proves A3a/A3b can fail, and
// that is the only thing it proves.
// A6b is the claim that keeps this note honest, and it is failable in the direction that
// matters: it asserts ZERO leg_iso items reach the budget. The day a pool or placement
// change puts one in front of the trim, A6b goes red, and the answer is to RE-DERIVE this
// record against the new lattice, never to relax the claim to 'zero or more'.
console.log('── A6. the leg_iso exclusion, swept ──');
// V199 (D91) RE-ANCHOR: the lens was HOISTED out of capSessionBudget to module level as the
// single writer _isPostChain, so the old in-function arrow no longer exists and this anchor
// read count 0 — A6a went red on a build that changed nothing about leg_iso. The claim is
// unchanged; only the address of the fold moved. Folding leg_iso in here now reaches
// recoveryDeload's arbitration as well, which is the point of having one writer.
const ISO_A="function _isPostChain(n){ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; }";
const isoN=RAW.split(ISO_A).length-1;
ok(isoN===1, 'A6a the _isPost anchor the fold is built from is unique (count '+isoN+')');
// HAND TABLE, not a filter over the engine. Doctrine: a knee-extension machine and the two
// leg-curl machines are single-joint isolation and are leg_iso; a leg press is a loaded
// multi-joint push and is not. The engine is held to this table in BOTH directions, so
// either kind of drift is named rather than silently shrinking the set A6b counts.
const ISO_HAND={'Leg extension':true,'Lying leg curl':true,'Seated leg curl':true,'Leg press':false};
const ISO_NAMES=Object.keys(ISO_HAND).filter(n=>ISO_HAND[n]);
const isoWrong=Object.keys(ISO_HAND).filter(n=>(PAT(n)==='leg_iso')!==ISO_HAND[n]);
ok(isoWrong.length===0, 'A6b0 _pattern agrees with the hand table on all '+Object.keys(ISO_HAND).length+
   ' names: leg_iso for ['+ISO_NAMES.join(', ')+'], NOT leg_iso for Leg press'+
   (isoWrong.length?' — disagrees on '+isoWrong.map(n=>n+' = '+PAT(n)).join(', '):''));
ok(B_iso===0, 'A6b '+B_iso+'/'+B_cells+' budget invocations on the swept lattice are offered an item the engine calls leg_iso. ZERO is the recorded state; one would make the doctrine-only record below stale and it must be re-derived, not relaxed. (Separately, '+B_press+'/'+B_cells+' are offered a Leg press, which _pattern does not call leg_iso and the fold therefore does not touch.)');
let A6_cells=0, A6_diff=0, A6_ex=[];
if(isoN===1){
  const tmpI=path.join(os.tmpdir(),'g198_legiso_'+process.pid+'.html');
  fs.writeFileSync(tmpI, RAW.replace(ISO_A, "function _isPostChain(n){ const p=_pattern(n); return p==='hinge'||p==='hip_ext'||p==='leg_iso'; }"));
  const IV=load(tmpI);
  const TIERS_I=['commercial','home_full','home_basic','bodyweight','crossfit','minimal'];
  const INJ_I=[null,{region:'lowback',tier:'protect'},{region:'shoulder',tier:'protect'},{region:'knee',tier:'protect'}];
  TIERS_I.forEach(t=>INJ_I.forEach(inj=>{
    const cfg={name:'M',primaryPath:'lift',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null,
      liftingFocus:'balanced',experience:'advanced',ageBracket:'18-35',equipment:t,unit:'lbs',
      restDays:['sun'],days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed:1013};
    if(inj) cfg.injury={region:inj.region,tier:inj.tier};
    A6_cells++;
    if(progDigest(IA.buildProgram(cfg))!==progDigest(IV.buildProgram(cfg))){ A6_diff++; if(A6_ex.length<4) A6_ex.push(t+(inj?'/'+inj.region:'/healthy')); }
  }));
  fs.unlinkSync(tmpI);
  if(A6_diff>0) ok(true, 'A6c folding leg_iso into the posterior set CHANGES '+A6_diff+'/'+A6_cells+' shipped programs ('+A6_ex.join(', ')+'): the exclusion is load-bearing on this lattice and the doctrine-only note above is out of date');
  else ok(true, 'A6c folding leg_iso into the posterior set changes 0/'+A6_cells+' shipped programs here and 0/288 on the full wide lattice: on this lattice the leg_iso exclusion is DOCTRINE-ONLY, ruled and not measured, and sabotage M3 is not evidence for it');
}else{
  console.log('  (A6c skipped: the _isPost fold anchor is not unique)');
}

console.log('── C. Mario\'s live program is untouched ──');
const dig=progDigest(IA.buildProgram(fixtures.HALF_MANNY));
const MANNY_DIGEST=MANNY_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)
ok(!!MANNY_DIGEST && dig===MANNY_DIGEST,
   'C1 HALF_MANNY digest matches the V'+IA.version+' row ('+(MANNY_DIGEST||'NO ROW — no MANNY_DIGEST_BY_VERSION entry for this version: an unruled digest move')+') (got '+dig+')');

console.log('PASS '+PASS+' FAIL '+FAIL);
process.exit(FAIL?1:0);
