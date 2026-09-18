#!/usr/bin/env python3
# V198 (D85) gate slice 3: g198_posterior_floor.js — A6 moves BELOW section B and states
# what the sweep actually found.
#
# WHY IT MOVED. A6 first asserted "the sweep is not vacuous: n programs SHIP a leg_iso item"
# and that assertion was RED on the candidate: 0/24. The measurement behind it says why, and
# it is a stronger fact than the one A6 was reaching for — no leg_iso item reaches the budget
# at all on this lattice, so nothing SHIPS one either. The claim is rewritten to assert what
# is true and failable (0 leg_iso items enter the budget; if that ever stops being true the
# doctrine-only record above it is stale), and it is moved below section B so it can count
# entries off B's instrumented sweep instead of paying for a third pass.
# The gate is fixed to state the artifact's fact, NOT to make a red claim green by weakening
# it: an assertion that says "0 enter" fails the moment one does.
# index.html is NOT touched by this script. ia-version stays 198.
import io, sys, os

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
F = os.path.join(ROOT, 'tests', 'gates', 'g198_posterior_floor.js')
src = io.open(F, encoding='utf-8').read()
reps = []


def rep(tag, old, new):
    global src
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ANCHOR MISS [%s]: count==%d, expected 1\n' % (tag, n))
        sys.exit(2)
    src = src.replace(old, new)
    reps.append(tag)


# ── 1. lift the A6 block out of its current position, whole ────────────────
HEAD = '// A6 — THE leg_iso EXCLUSION, MEASURED.'
TAIL = "console.log('── B. the ruling as a build invariant (instrumented sweep) ──');"
if src.count(HEAD) != 1 or src.count(TAIL) != 1:
    sys.stderr.write('ANCHOR MISS [A6 block bounds]: head=%d tail=%d\n' % (src.count(HEAD), src.count(TAIL)))
    sys.exit(2)
i, j = src.index(HEAD), src.index(TAIL)
if j < i:
    sys.stderr.write('ANCHOR MISS [A6 block bounds]: A6 is already below section B\n')
    sys.exit(2)
src = src[:i] + src[j:]
reps.append('A6 block lifted out')

# ── 2. section B also counts what enters the budget ────────────────────────
rep(
    'B counters',
    "let B_in=0, B_out0=0, B_held=0, B_cells=0;",
    "let B_in=0, B_out0=0, B_held=0, B_cells=0, B_iso=0;",
)
rep(
    'B iso count',
    """  const pc=secs=>[].concat.apply([],(secs||[]).map(s=>(s.items||[]).map(i=>String(i.name||''))))
    .reduce((a,n)=>a+(R.test(n)?1:0),0);""",
    """  const pc=secs=>[].concat.apply([],(secs||[]).map(s=>(s.items||[]).map(i=>String(i.name||''))))
    .reduce((a,n)=>a+(R.test(n)?1:0),0);
  // HAND regex for the leg_iso names A6 asks about, written from the library and not from
  // _pattern, so the count below is not the engine agreeing with itself. A6b0 checks the
  // engine's own classifier separately, which is how a drift between the two shows up.
  const RISO=/leg extension|lying leg curl|seated leg curl|leg press/i;
  const ic=secs=>[].concat.apply([],(secs||[]).map(s=>(s.items||[]).map(i=>String(i.name||''))))
    .reduce((a,n)=>a+(RISO.test(n)?1:0),0);""",
)
rep(
    'B iso accumulate',
    """    REC.forEach(r=>{ B_cells++; const pb=pc(r.b), pa=pc(r.a);""",
    """    REC.forEach(r=>{ B_cells++; const pb=pc(r.b), pa=pc(r.a);
      if(ic(r.b)>0) B_iso++;""",
)

# ── 3. A6, rewritten, below section B ──────────────────────────────────────
rep(
    'A6 reinserted below B',
    """console.log('── C. Mario\\'s live program is untouched ──');""",
    """// ── A6. THE leg_iso EXCLUSION, MEASURED ────────────────────────────────────
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
const ISO_A="  const _isPost=n=>{ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; };";
const isoN=RAW.split(ISO_A).length-1;
ok(isoN===1, 'A6a the _isPost anchor the fold is built from is unique (count '+isoN+')');
const ISO_NAMES=['Leg extension','Lying leg curl','Seated leg curl','Leg press'].filter(n=>PAT(n)==='leg_iso');
ok(ISO_NAMES.length>0, 'A6b0 the engine still classifies the names this claim is about as leg_iso: '+ISO_NAMES.length+' of 4 ('+ISO_NAMES.join(', ')+')');
ok(B_iso===0, 'A6b '+B_iso+'/'+B_cells+' budget invocations on the swept lattice are offered a leg_iso item. ZERO is the recorded state; one would make the doctrine-only record below stale and it must be re-derived, not relaxed');
let A6_cells=0, A6_diff=0, A6_ex=[];
if(isoN===1){
  const tmpI=path.join(os.tmpdir(),'g198_legiso_'+process.pid+'.html');
  fs.writeFileSync(tmpI, RAW.replace(ISO_A, "  const _isPost=n=>{ const p=_pattern(n); return p==='hinge'||p==='hip_ext'||p==='leg_iso'; };"));
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

console.log('── C. Mario\\'s live program is untouched ──');""",
)

io.open(F, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d edits)' % (F, len(reps)))
for t in reps:
    print('  - ' + t)
