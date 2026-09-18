#!/usr/bin/env python3
# Tooling edit, no ia-version bump. Third and last script of the fuzz-sharding trio.
# Compose in this order, each on the output of the previous:
#   1. tests/edits/fuzz_shard_driver_edit.py   -- sharding, tests/fuzz.sh, the equivalence gate
#   2. tests/edits/fuzz_shard_preran_edit.py   -- preRan flag + the "pre ran exactly once" check
#   3. tests/edits/fuzz_shard_hygiene_edit.py  -- THIS FILE
#
# Fixes gatekeeper's two non-blocking findings on the GREEN verdict:
#   Fix 1  the gate's mkdtemp dir leaked on every early exit (done() is called at the
#          no-candidate / missing-file stage BEFORE the dir exists, and again at two
#          mid-run aborts). Cleanup moves INTO done(), guarded on a var that is empty
#          until mkdtemp returns, and wrapped so a cleanup failure cannot change the
#          gate's verdict or exit code.
#   Fix 2  the merge summed counters and threw idx away, so a well-formed all-zero
#          shard was invisible on the full lattice (no sequential reference exists in
#          production). The merge now asserts the union of the shards' idx sets is
#          exactly the lattice's config index set, sized from the axis constants, so
#          it still never loads the HTML. Failure = named indices, NO FUZZTOTAL, rc 3.
#
# NOTE: IDX.push(cidx) stays where it is -- after the shard-residue filter and BEFORE the
# two try/catch build blocks -- so a config whose build THROWS is still recorded as walked.
# Moving it below the try/catch would make a legitimate build error read as a missing
# index and abort a valid run on the assertion this script adds.
#
# Every anchor is asserted count == 1 and nothing is written if any anchor misses.
import io, os, sys

ROOT = os.environ.get('IA_EDIT_ROOT') or '/Users/CanasBangin/Desktop/TheBig6V2'
JS   = os.path.join(ROOT, 'tests/measure/v195_gk_identity_fuzz.js')
GATE = os.path.join(ROOT, 'tests/gates/g_fuzz_shard_equiv.js')
SH   = os.path.join(ROOT, 'tests/fuzz.sh')

EDITS = []
def rep(path, old, new, why):
    EDITS.append((path, old, new, why))

# ---------------------------------------------------------- Fix 1: the mkdtemp leak
rep(GATE,
"""function done(){ console.log('PASS '+pass+' FAIL '+fail); process.exit(fail?1:0); }""",
"""// Every exit path of this gate goes through done(), and done() is the ONLY place the
// scratch dir is removed. TMPDIR stays '' until mkdtemp returns, so the two argument
// checks below -- which run before the dir exists -- cannot throw on it. The rm is in
// its own try/catch: a cleanup failure must never change the verdict or the exit code.
var TMPDIR='';
function done(){
  try{ if(TMPDIR) fs.rmSync(TMPDIR,{recursive:true,force:true}); }catch(e){}
  console.log('PASS '+pass+' FAIL '+fail); process.exit(fail?1:0);
}""",
'cleanup moves into done(), guarded and isolated')

rep(GATE,
"""const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fuzzshard-'));""",
"""const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fuzzshard-'));
TMPDIR=dir;   // armed the instant the dir exists; every done() from here on removes it""",
'arm the cleanup as soon as the dir exists')

rep(GATE,
"""try{ fs.rmSync(dir,{recursive:true,force:true}); }catch(e){}
done();""",
"""done();   // removes TMPDIR itself""",
'drop the single-path cleanup at the tail')

# ------------------------------------------- Fix 2: the merge asserts partition coverage
rep(JS,
"""if(MODE==='merge'){
  for(let i=-1;i<MERGE_N;i++){""",
"""if(MODE==='merge'){
  const MIDX=[];                 // union of the shards' walked-index sets, pre excluded
  for(let i=-1;i<MERGE_N;i++){""",
'merge collects the union of the shard index sets')

rep(JS,
"""    (j.preViol||[]).forEach(v=>viol.push(v)); (j.viol||[]).forEach(v=>lviol.push(v));
  }
  process.exit(emitSummary());
}""",
"""    (j.preViol||[]).forEach(v=>viol.push(v)); (j.viol||[]).forEach(v=>lviol.push(v));
    if(i>=0) (j.idx||[]).forEach(v=>MIDX.push(v));   // pre.json walks no configs by design
  }
  // Partition coverage. Summing counters cannot see a well-formed all-zero shard, and in
  // production there is no sequential reference to compare against. The expected size is
  // computed from the axis constants for the ACTIVE lattice, so the merge still needs no
  // reference run and still never loads the HTML.
  const MEXP=LGOALS.length*LEQUIP.length*LFOCUS.length*LEXPER.length*LSEEDS.length*LREST.length*LAGE.length;
  const mcount=new Map();
  MIDX.forEach(v=>mcount.set(v,(mcount.get(v)||0)+1));
  const mdup=[], moor=[];
  mcount.forEach((n,v)=>{ if(n>1) mdup.push(v); if(!(v>=0&&v<MEXP)) moor.push(v); });
  const mmiss=[]; for(let v=0;v<MEXP;v++) if(!mcount.has(v)) mmiss.push(v);
  if(mmiss.length||mdup.length||moor.length){
    const head=a=>a.slice().sort((x,y)=>x-y).slice(0,10).join(',')+(a.length>10?' ...':'');
    console.log('FUZZ ABORT: shard partition does not cover the lattice. --lattice '+LATTICE+
      ' has '+MEXP+' configs; the '+MERGE_N+' shards walked '+MIDX.length+'.');
    console.log('  missing '+mmiss.length+(mmiss.length?': '+head(mmiss):''));
    console.log('  duplicated '+mdup.length+(mdup.length?': '+head(mdup):''));
    console.log('  out of range '+moor.length+(moor.length?': '+head(moor):''));
    process.exit(3);
  }
  process.exit(emitSummary());
}""",
'merge asserts the union is exactly 0..MEXP-1, no gaps no dupes, rc 3 and no FUZZTOTAL')

# ------------------------------------- Fix 2b: the driver must tell the merge its lattice
rep(SH,
"""node "$JS" --merge "$OUT" --shards "$N\"""",
"""node "$JS" --merge "$OUT" --shards "$N" ${LAT:+--lattice "$LAT"}""",
'--lattice reaches the merge, or it sizes the partition against the wrong lattice')

# ---- read everything, assert every anchor, write nothing until all of them hit ----
files = {}
for path, old, new, why in EDITS:
    if path not in files:
        files[path] = io.open(path, encoding='utf-8').read()
for path, old, new, why in EDITS:
    n = files[path].count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor count %d (want 1) in %s for: %s\n' % (n, path, why))
        sys.exit(1)
    files[path] = files[path].replace(old, new, 1)
for path in files:
    io.open(path, 'w', encoding='utf-8').write(files[path])
    print('patched %s' % path)
print('%d replacements across %d files' % (len(EDITS), len(files)))
