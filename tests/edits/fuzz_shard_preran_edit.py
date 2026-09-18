#!/usr/bin/env python3
# Follow-up to fuzz_shard_driver_edit.py. `pre` is 0 on a green build, so a shard that
# wrongly ran the pre-blocks would double count nothing visible and no gate would trip.
# Record WHETHER the pre-blocks ran, structurally, and let the gate assert exactly one
# part of the fan-out ran them. Anchors asserted count == 1.
import io, os, sys
ROOT=os.environ.get('IA_EDIT_ROOT') or '/Users/CanasBangin/Desktop/TheBig6V2'
PAIRS=[
 (os.path.join(ROOT,'tests/measure/v195_gk_identity_fuzz.js'),
  """function dump(){ return {cells:cells,sessions:sessions,keys:keys,dDigest:dDigest,dGrid:dGrid,
  dKeys:dKeys,dLen:dLen,build:build,pre:pre,viol:lviol,preViol:viol,idx:IDX}; }""",
  """function dump(){ return {cells:cells,sessions:sessions,keys:keys,dDigest:dDigest,dGrid:dGrid,
  dKeys:dKeys,dLen:dLen,build:build,pre:pre,viol:lviol,preViol:viol,idx:IDX,preRan:RUNPRE}; }""",
  'dump() records whether the pre-blocks ran'),
 (os.path.join(ROOT,'tests/gates/g_fuzz_shard_equiv.js'),
  """if(parts[0].cells===0 && parts[0].idx.length===0) ok('the --pre stage walked no configs, so `pre` is counted exactly once');
else bad('the --pre stage walked configs, pre-block counters would be double counted');""",
  """if(parts[0].cells===0 && parts[0].idx.length===0) ok('the --pre stage walked no configs');
else bad('the --pre stage walked configs, its builds would be counted twice');
// `pre` is 0 on a green build, so a shard that ALSO ran the pre-blocks would double count
// nothing visible. Assert it structurally instead of trusting the counter.
const ran=parts.map((p,i)=>p.preRan?i:-1).filter(i=>i>=0);
if(ran.length===1 && ran[0]===0) ok('the pre-blocks ran in exactly one part of the fan-out (the --pre stage)');
else bad('the pre-blocks ran in '+ran.length+' parts of the fan-out ['+ran.join(',')+'], `pre` would be counted '+ran.length+' times');""",
  'gate asserts the pre-blocks ran exactly once'),
]
for path, old, new, why in PAIRS:
    src=io.open(path,encoding='utf-8').read()
    n=src.count(old)
    if n!=1:
        sys.stderr.write('ABORT: anchor count %d (want 1) for: %s\n'%(n,why)); sys.exit(1)
    io.open(path,'w',encoding='utf-8').write(src.replace(old,new,1))
    print('patched %s -- %s'%(path,why))
