#!/usr/bin/env python3
# Tooling edit, no ia-version bump. Shards tests/measure/v195_gk_identity_fuzz.js by
# config index and adds the driver + equivalence gate.
#   1. --shard i/N, --pre, --lattice small, --out FILE, --merge DIR --shards N
#   2. tests/fuzz.sh          -- runs --pre once, fans 8 shards out with xargs -P, merges
#   3. tests/gates/g_fuzz_shard_equiv.js -- proves the partition and the sums
# Every anchor is asserted count == 1 and the script aborts on the first miss.
import io, os, sys

ROOT = os.environ.get('IA_EDIT_ROOT') or '/Users/CanasBangin/Desktop/TheBig6V2'
JS   = os.path.join(ROOT, 'tests/measure/v195_gk_identity_fuzz.js')

src = io.open(JS, encoding='utf-8').read()
subs = []

def rep(old, new, why):
    subs.append((old, new, why))

# ---------------------------------------------------------------- 1. argv + modes
rep(
"""const {load,progDigest,weekGrid}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const crypto=require('crypto');
const CAND=process.argv[2], BASE=process.argv[3];
const A=load(BASE), B=load(CAND);
console.log('# baseline v'+A.version+'  candidate v'+B.version);
""",
"""const {load,progDigest,weekGrid}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const crypto=require('crypto');
const fs=require('fs');
// ---- argv -----------------------------------------------------------------
// Positional: <candidate.html> [baseline.html]   (unchanged)
//   --shard i/N       walk only the configs whose GLOBAL index % N == i. N==1 is the
//                     original sequential behaviour, pre-blocks included.
//   --pre             run ONLY the two pre-blocks (self-identity, cfg purity) and stop.
//   --lattice small   deterministic prefix slice of every axis, 72 configs.
//   --out FILE        write every raw counter + the violations as JSON to FILE.
//   --merge DIR --shards N   sum DIR/pre.json + DIR/fuzz_<i>.json and print the summary.
//                     Never loads the HTML. Used by tests/fuzz.sh.
// The pre-blocks feed `pre`, so they must run EXACTLY ONCE per fuzz: the driver runs
// them itself (--pre) before any shard starts, which also keeps the standing invariant
// literal -- the baseline is proven self-stable BEFORE anything diffs.
var SHARD_I=0, SHARD_N=1, MODE='full', LATTICE='full', OUTFILE='', MERGEDIR='', MERGE_N=0;
const POS=[];
for(let i=2;i<process.argv.length;i++){
  const a=process.argv[i];
  if(a==='--shard'){
    const m=/^([0-9]+)\\/([0-9]+)$/.exec(process.argv[++i]||'');
    if(!m){ console.log('FUZZ ABORT: --shard wants i/N'); process.exit(2); }
    SHARD_I=+m[1]; SHARD_N=+m[2];
    if(SHARD_N<1||SHARD_I>=SHARD_N){ console.log('FUZZ ABORT: --shard i/N needs N>=1 and 0<=i<N'); process.exit(2); }
  }
  else if(a==='--pre') MODE='pre';
  else if(a==='--merge'){ MODE='merge'; MERGEDIR=process.argv[++i]||''; }
  else if(a==='--shards') MERGE_N=+(process.argv[++i]||'0');
  else if(a==='--lattice') LATTICE=process.argv[++i]||'';
  else if(a==='--out') OUTFILE=process.argv[++i]||'';
  else POS.push(a);
}
const CAND=POS[0], BASE=POS[1];
if(LATTICE!=='full'&&LATTICE!=='small'){ console.log('FUZZ ABORT: --lattice wants full or small'); process.exit(2); }
const WORKER=(MODE==='full'&&SHARD_N>1);   // silent: JSON only, stdout belongs to the driver
if(WORKER&&!OUTFILE){ console.log('FUZZ ABORT: --shard i/N with N>1 requires --out FILE'); process.exit(2); }
if(MODE==='merge'&&(!MERGEDIR||!(MERGE_N>=1))){ console.log('FUZZ ABORT: --merge DIR needs --shards N'); process.exit(2); }
const RUNPRE=(MODE==='pre'||(MODE==='full'&&SHARD_N===1));
const RUNLOOP=(MODE==='full');
var A=null,B=null;
if(MODE!=='merge'){
  A=load(BASE); B=load(CAND);
  if(!WORKER) console.log('# baseline v'+A.version+'  candidate v'+B.version);
}
""", 'argv parsing, shard/pre/merge modes, conditional load')

# ---------------------------------------------------------------- 2. small lattice
rep(
"""];
function mkCfg(g,eq,fo,ex,se,rest,age){
""",
"""];
// --lattice small: deterministic prefix slice of every axis.
// 3 goals x 2 equip x 3 focus x 1 exper x 1 seed x 2 rest x 2 age = 72 configs, so each
// of 8 shards gets exactly 9 and the partition is non-trivial. The shard arithmetic does
// not depend on lattice size; the full 34020-config lattice stays a gatekeeper step.
const SM=(LATTICE==='small');
const LGOALS=SM?GOALS.slice(0,3):GOALS, LEQUIP=SM?EQUIP.slice(0,2):EQUIP, LFOCUS=SM?FOCUS.slice(0,3):FOCUS;
const LEXPER=SM?EXPER.slice(0,1):EXPER, LSEEDS=SM?SEEDS.slice(0,1):SEEDS;
const LREST=SM?REST.slice(0,2):REST, LAGE=SM?AGE.slice(0,2):AGE;
function mkCfg(g,eq,fo,ex,se,rest,age){
""", 'small lattice slices')

# ---------------------------------------------------------------- 3. counters + pre-block 1
rep(
"""let cells=0,sessions=0,keys=0,dDigest=0,dGrid=0,dKeys=0,dLen=0,build=0,pre=0;
const viol=[];
{
  let n=0,bad=0;
  GOALS.forEach(g=>EQUIP.forEach(eq=>{
""",
"""let cells=0,sessions=0,keys=0,dDigest=0,dGrid=0,dKeys=0,dLen=0,build=0,pre=0;
const viol=[];    // pre-block violations, strings, always printed first
const lviol=[];   // config-loop violations: {i: GLOBAL config index, s: seq within config, m: message}
const IDX=[];     // the global index of every config THIS process actually walked
let cidx=-1, cseq=0;
const lv=m=>lviol.push({i:cidx,s:cseq++,m:m});
if(RUNPRE){
  let n=0,bad=0;
  LGOALS.forEach(g=>LEQUIP.forEach(eq=>{
""", 'shard bookkeeping + pre-block 1 guard')

# ---------------------------------------------------------------- 4. pre-block 2
rep(
"""  if(bad){ console.log('FUZZ ABORT: baseline is not self-stable'); process.exit(2); }
}
{
  let bad=0,n=0;
  GOALS.forEach(g=>{ const cfg=mkCfg(g,'commercial','hypertrophy','advanced',1013,['sun'],'18-35');
""",
"""  if(bad){ console.log('FUZZ ABORT: baseline is not self-stable'); process.exit(2); }
}
if(RUNPRE){
  let bad=0,n=0;
  LGOALS.forEach(g=>{ const cfg=mkCfg(g,'commercial','hypertrophy','advanced',1013,['sun'],'18-35');
""", 'pre-block 2 guard')

# ---------------------------------------------------------------- 5. loop head + index
rep(
"""for(const g of GOALS) for(const eq of EQUIP) for(const fo of FOCUS) for(const ex of EXPER)
for(const se of SEEDS) for(const rest of REST) for(const age of AGE){
  const cfg=mkCfg(g,eq,fo,ex,se,rest,age);
""",
"""if(RUNLOOP)
for(const g of LGOALS) for(const eq of LEQUIP) for(const fo of LFOCUS) for(const ex of LEXPER)
for(const se of LSEEDS) for(const rest of LREST) for(const age of LAGE){
  cidx++;                                 // BEFORE the try/catch and before any continue, so
  if(cidx%SHARD_N!==SHARD_I) continue;    // membership is a pure function of loop position
  IDX.push(cidx); cseq=0;
  const cfg=mkCfg(g,eq,fo,ex,se,rest,age);
""", 'config index + shard skip')

# ---------------------------------------------------------------- 6. loop violations
rep(
"""  try{ pa=A.buildProgram(cfg); }catch(e){ build++; viol.push('BASE THREW '+tag+': '+e.message); continue; }
  try{ pb=B.buildProgram(JSON.parse(JSON.stringify(cfg))); }catch(e){ build++; viol.push('CAND THREW '+tag+': '+e.message); continue; }
  cells++;
  if(Object.keys(pa.weeks||{}).length!==Object.keys(pb.weeks||{}).length){dLen++;viol.push('WEEKS '+tag);}
  if(progDigest(pa)!==progDigest(pb)){dDigest++;viol.push('DIGEST '+tag+' '+progDigest(pa)+' -> '+progDigest(pb));}
  if(weekGrid(pa,{showRest:true})!==weekGrid(pb,{showRest:true})){dGrid++;viol.push('GRID '+tag);}
""",
"""  try{ pa=A.buildProgram(cfg); }catch(e){ build++; lv('BASE THREW '+tag+': '+e.message); continue; }
  try{ pb=B.buildProgram(JSON.parse(JSON.stringify(cfg))); }catch(e){ build++; lv('CAND THREW '+tag+': '+e.message); continue; }
  cells++;
  if(Object.keys(pa.weeks||{}).length!==Object.keys(pb.weeks||{}).length){dLen++;lv('WEEKS '+tag);}
  if(progDigest(pa)!==progDigest(pb)){dDigest++;lv('DIGEST '+tag+' '+progDigest(pa)+' -> '+progDigest(pb));}
  if(weekGrid(pa,{showRest:true})!==weekGrid(pb,{showRest:true})){dGrid++;lv('GRID '+tag);}
""", 'loop violations carry the global index')

rep(
"""    viol.push('KEYS '+tag+' :: '+only.join(' || '));
""",
"""    lv('KEYS '+tag+' :: '+only.join(' || '));
""", 'KEYS violation carries the global index')

# ---------------------------------------------------------------- 7. summary / dispatch
rep(
"""console.log('# '+cells+' configs / '+sessions+' day-builds / '+keys+' prescription keys compared');
console.log('# violations: digest='+dDigest+' grid='+dGrid+' keyed='+dKeys+' weeks='+dLen+' build-errors='+build+' pre='+pre);
if(viol.length){ console.log('--- first 25 violations ---'); viol.slice(0,25).forEach(v=>console.log('  '+v)); }
const total=dDigest+dGrid+dKeys+dLen+build+pre;
console.log('FUZZTOTAL configs='+cells+' sessions='+sessions+' keys='+keys+' violations='+total);
console.log('PASS '+(total?0:1)+' FAIL '+(total?1:0));
process.exit(total?1:0);
""",
"""// The summary is printed by whoever holds the WHOLE picture: the sequential run, or the
// merge pass over pre.json + the 8 shard files. Loop violations are re-sorted by
// (global index, within-config sequence), which is exactly sequential emission order.
function emitSummary(){
  console.log('# '+cells+' configs / '+sessions+' day-builds / '+keys+' prescription keys compared');
  console.log('# violations: digest='+dDigest+' grid='+dGrid+' keyed='+dKeys+' weeks='+dLen+' build-errors='+build+' pre='+pre);
  const all=viol.concat(lviol.slice().sort((a,b)=>(a.i-b.i)||(a.s-b.s)).map(v=>v.m));
  if(all.length){ console.log('--- first 25 violations ---'); all.slice(0,25).forEach(v=>console.log('  '+v)); }
  const total=dDigest+dGrid+dKeys+dLen+build+pre;
  console.log('FUZZTOTAL configs='+cells+' sessions='+sessions+' keys='+keys+' violations='+total);
  console.log('PASS '+(total?0:1)+' FAIL '+(total?1:0));
  return total?1:0;
}
function dump(){ return {cells:cells,sessions:sessions,keys:keys,dDigest:dDigest,dGrid:dGrid,
  dKeys:dKeys,dLen:dLen,build:build,pre:pre,viol:lviol,preViol:viol,idx:IDX}; }
if(MODE==='merge'){
  for(let i=-1;i<MERGE_N;i++){
    const f=MERGEDIR+'/'+(i<0?'pre.json':'fuzz_'+i+'.json');
    if(!fs.existsSync(f)||!fs.statSync(f).size){ console.log('FUZZ ABORT: missing or empty shard result '+f); process.exit(3); }
    let j; try{ j=JSON.parse(fs.readFileSync(f,'utf8')); }
    catch(e){ console.log('FUZZ ABORT: unreadable shard result '+f+': '+e.message); process.exit(3); }
    cells+=j.cells; sessions+=j.sessions; keys+=j.keys; dDigest+=j.dDigest; dGrid+=j.dGrid;
    dKeys+=j.dKeys; dLen+=j.dLen; build+=j.build; pre+=j.pre;
    (j.preViol||[]).forEach(v=>viol.push(v)); (j.viol||[]).forEach(v=>lviol.push(v));
  }
  process.exit(emitSummary());
}
if(OUTFILE) fs.writeFileSync(OUTFILE,JSON.stringify(dump()));
if(MODE==='pre'||WORKER) process.exit(0);
process.exit(emitSummary());
""", 'summary function, merge mode, JSON dump')

for old, new, why in subs:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor count %d (want 1) for: %s\n' % (n, why))
        sys.exit(1)
    src = src.replace(old, new, 1)

io.open(JS, 'w', encoding='utf-8').write(src)
print('patched %s (%d replacements)' % (JS, len(subs)))

# ============================== new files ====================================
SH = r'''#!/usr/bin/env bash
# Iron Asylum identity-fuzz driver.
#   Usage: tests/fuzz.sh <candidate.html> [baseline.html] [--lattice small] [--shards N]
#   Env:   FUZZ_JOBS (xargs width, default 8), FUZZ_SHARDS (default 8),
#          FUZZ_OUT (caller-owned result dir, kept; unset means a private mktemp dir)
#
# Prints the SAME stdout and the SAME exit code as the sequential run of
# tests/measure/v195_gk_identity_fuzz.js on the same build. Proven by
# tests/gates/g_fuzz_shard_equiv.js.
#
# Hard invariants (handoff §9/§10b): `set -eo pipefail`, bash not sh, `;` not `&&`
# around heredocs, temp files not <(...), delete artifacts before regenerating them.
# Workers ALWAYS exit 0 -- a nonzero worker makes xargs return 1, which `set -e` would
# abort on before a single result file was read. The fan-out is graded from the FILES.
set -eo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
JS="$HERE/measure/v195_gk_identity_fuzz.js"

CAND=""; BASE=""; LAT=""; N="${FUZZ_SHARDS:-8}"
while [ $# -gt 0 ]; do
  case "$1" in
    --lattice) LAT="${2:-}"; shift 2;;
    --shards)  N="${2:-}"; shift 2;;
    --)        shift;;
    *) if [ -z "$CAND" ]; then CAND="$1"; elif [ -z "$BASE" ]; then BASE="$1"; fi; shift;;
  esac
done
[ -n "$CAND" ] || { echo "usage: tests/fuzz.sh <candidate.html> [baseline.html] [--lattice small]"; exit 2; }
[ -f "$JS" ]   || { echo "FAIL: CONFIG: fuzz script missing at $JS"; exit 1; }

# FUZZ_JOBS / FUZZ_SHARDS: empty or unset means 8. Only a POSITIVE integer is accepted.
# 0 is NOT clamped -- BSD xargs reads `-P 0` as UNBOUNDED. A clamp would hide the typo.
JOBS="${FUZZ_JOBS:-8}"
for pair in "FUZZ_SHARDS:$N" "FUZZ_JOBS:$JOBS"; do
  nm="${pair%%:*}"; vl="${pair#*:}"
  if ! printf '%s' "$vl" | grep -qE '^[0-9]+$' || [ "$vl" -lt 1 ]; then
    echo "FAIL: CONFIG: $nm must be a positive integer, or empty/unset which means 8; got '$vl'"; exit 1
  fi
done

# Never a fixed /tmp path: two overlapping fuzz runs (gatekeeper and builder, or two
# sessions) would clobber each other's counters, which is the exact shared-path failure
# the sharding is guarding against.
if [ -n "$FUZZ_OUT" ]; then
  OUT="$FUZZ_OUT"; mkdir -p "$OUT"
else
  TMPD="$(mktemp -d)"; trap 'rm -rf "$TMPD"' EXIT; OUT="$TMPD"
fi
rm -f "$OUT"/fuzz_*.json "$OUT"/fuzz_*.log "$OUT/pre.json" "$OUT/pre.txt" "$OUT/runshard.sh" "$OUT/shardlist"

# 1. pre-blocks, ONCE, synchronously, before any worker starts. They feed `pre`; running
#    them in all N shards would count them N times. The baseline is proven self-stable
#    here, before anything diffs.
set +e
node "$JS" "$CAND" ${BASE:+"$BASE"} ${LAT:+--lattice "$LAT"} --pre --out "$OUT/pre.json" > "$OUT/pre.txt" 2>&1
PRC=$?
set -e
cat "$OUT/pre.txt"
[ $PRC -eq 0 ] || exit $PRC
[ -s "$OUT/pre.json" ] || { echo "FUZZ ABORT: pre stage wrote no counters"; exit 1; }

# 2. fan out the config loop. One result file per shard, never a shared path.
cat > "$OUT/runshard.sh" <<'WORKER'
#!/usr/bin/env bash
set -eo pipefail
node "$FUZZ_JS" "$FUZZ_CAND" ${FUZZ_BASE:+"$FUZZ_BASE"} ${FUZZ_LAT:+--lattice "$FUZZ_LAT"} \
  --shard "$1/$FUZZ_N" --out "$FUZZ_OUTDIR/fuzz_$1.json" > "$FUZZ_OUTDIR/fuzz_$1.log" 2>&1 || true
exit 0
WORKER
chmod +x "$OUT/runshard.sh"
i=0; while [ "$i" -lt "$N" ]; do printf '%s\0' "$i" >> "$OUT/shardlist"; i=$((i+1)); done
FUZZ_JS="$JS" FUZZ_CAND="$CAND" FUZZ_BASE="$BASE" FUZZ_LAT="$LAT" FUZZ_N="$N" FUZZ_OUTDIR="$OUT" \
  xargs -0 -n 1 -P "$JOBS" "$OUT/runshard.sh" < "$OUT/shardlist"

# 3. merge. Missing or unreadable shard file = exit 3, never a quiet short sum.
set +e
node "$JS" --merge "$OUT" --shards "$N"
RC=$?
set -e
if [ $RC -gt 1 ]; then
  for f in "$OUT"/fuzz_*.log; do
    if [ -s "$f" ]; then echo "--- $(basename "$f") ---"; tail -20 "$f"; fi
  done
fi
exit $RC
'''

GATE = r'''// GATE: the sharded fuzz driver is equivalent to the sequential fuzz run.
// Oracle is independent of the engine: the small lattice is 3 goals x 2 equip x 3 focus
// x 1 exper x 1 seed x 2 rest x 2 age = 72 configs by hand, so the partition must be
// exactly {0..71} with no overlap and no gap, and every raw counter must sum exactly.
// Usage: node g_fuzz_shard_equiv.js <candidate.html> [baseline.html]
// With no baseline, CAND is used as both sides: a self-identity run that still exercises
// the whole partition. Prints PASS n FAIL n.
const {execFileSync}=require('child_process');
const fs=require('fs'), os=require('os'), path=require('path');
const TESTS=path.resolve(__dirname,'..');
const JS=path.join(TESTS,'measure','v195_gk_identity_fuzz.js');
const SH=path.join(TESTS,'fuzz.sh');
const CAND=process.argv[2];
const BASE=process.argv[3]||CAND;
let pass=0, fail=0;
const ok=m=>{pass++; console.log('   ok: '+m);};
const bad=m=>{fail++; console.log('FAIL: '+m);};
function done(){ console.log('PASS '+pass+' FAIL '+fail); process.exit(fail?1:0); }
if(!CAND||!fs.existsSync(CAND)){ bad('no candidate html'); done(); }
for(const f of [JS,SH]) if(!fs.existsSync(f)){ bad('missing '+f); done(); }

const AXES={goals:3,equip:2,focus:3,exper:1,seeds:1,rest:2,age:2};
const M=Object.keys(AXES).reduce((n,k)=>n*AXES[k],1);   // 72, by hand, not by the engine
const NSH=8;

function run(cmd,args,env){
  try{ return {out:execFileSync(cmd,args,{encoding:'utf8',maxBuffer:256*1024*1024,
    env:Object.assign({},process.env,env||{})}), rc:0}; }
  catch(e){ return {out:String(e.stdout||'')+String(e.stderr||''), rc:(e.status==null?-1:e.status)}; }
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fuzzshard-'));
const fan=path.join(dir,'fan');
const SEQ=path.join(dir,'seq.json');

// 1. sequential, and the bare invocation it has to stay identical to
const seq=run(process.execPath,[JS,CAND,BASE,'--lattice','small','--shard','0/1','--out',SEQ]);
const bare=run(process.execPath,[JS,CAND,BASE,'--lattice','small']);
if(bare.out===seq.out && bare.rc===seq.rc) ok('--shard 0/1 is byte-identical to the bare invocation');
else bad('--shard 0/1 differs from the bare invocation (rc '+seq.rc+' vs '+bare.rc+')');

// 2. the driver
const drv=run('bash',[SH,CAND,BASE,'--lattice','small'],{FUZZ_OUT:fan});
if(drv.out===seq.out) ok('driver stdout is byte-identical to the sequential run ('+seq.out.split('\n').length+' lines)');
else {
  bad('driver stdout differs from the sequential run');
  const a=seq.out.split('\n'), b=drv.out.split('\n');
  for(let i=0;i<Math.max(a.length,b.length);i++) if(a[i]!==b[i]){
    console.log('     line '+(i+1)+' seq: '+JSON.stringify(a[i]));
    console.log('     line '+(i+1)+' drv: '+JSON.stringify(b[i])); break; }
}
if(drv.rc===seq.rc) ok('driver exit code matches the sequential run ('+seq.rc+')');
else bad('driver exit code '+drv.rc+' != sequential '+seq.rc);
const ft=s=>(s.split('\n').filter(l=>l.indexOf('FUZZTOTAL')===0)[0]||'');
if(ft(seq.out) && ft(drv.out)===ft(seq.out)) ok('FUZZTOTAL line identical: '+ft(seq.out));
else bad('FUZZTOTAL mismatch: seq '+JSON.stringify(ft(seq.out))+' drv '+JSON.stringify(ft(drv.out)));

// 3. raw counters. Summed HERE, not by the merge pass, so the gate does not grade
//    the merge with the merge's own arithmetic.
const KEYS=['cells','sessions','keys','dDigest','dGrid','dKeys','dLen','build','pre'];
function readJson(f){
  if(!fs.existsSync(f)||!fs.statSync(f).size) return null;
  try{ return JSON.parse(fs.readFileSync(f,'utf8')); }catch(e){ return null; }
}
const S=readJson(SEQ);
if(!S){ bad('sequential run wrote no counters'); done(); }
const parts=[readJson(path.join(fan,'pre.json'))];
for(let i=0;i<NSH;i++) parts.push(readJson(path.join(fan,'fuzz_'+i+'.json')));
if(parts.some(p=>!p)){ bad('a shard produced no result file: '+parts.map((p,i)=>p?'':(i?('fuzz_'+(i-1)):'pre')).filter(Boolean).join(' ')); done(); }
let sumsOk=true;
KEYS.forEach(k=>{
  const s=parts.reduce((n,p)=>n+p[k],0);
  if(s!==S[k]){ sumsOk=false; bad('counter '+k+': shards sum to '+s+', sequential says '+S[k]); }
});
if(sumsOk) ok('all 9 raw counters sum exactly: '+KEYS.map(k=>k+'='+S[k]).join(' '));

// 4. the partition itself, against the hand-computed lattice size
if(S.idx.length===M) ok('sequential walked '+M+' configs (hand arithmetic: 3x2x3x1x1x2x2)');
else bad('sequential walked '+S.idx.length+' configs, hand arithmetic says '+M);
const full=[]; for(let i=0;i<M;i++) full.push(i);
if(S.idx.join(',')===full.join(',')) ok('sequential index set is exactly 0..'+(M-1)+' in order');
else bad('sequential index set is not 0..'+(M-1));
let union=[], overlap=0, wrongRes=0, thin=0;
for(let i=0;i<NSH;i++){
  const ix=parts[i+1].idx;
  if(ix.length<2) thin++;
  ix.forEach(v=>{ if(v%NSH!==i) wrongRes++; });
  union=union.concat(ix);
}
const seen=new Set(); union.forEach(v=>{ if(seen.has(v)) overlap++; seen.add(v); });
if(!thin) ok('every one of the '+NSH+' shards got more than one config (min '+Math.min.apply(null,parts.slice(1).map(p=>p.idx.length))+')');
else bad(thin+' shard(s) got fewer than 2 configs, the partition is trivial');
if(!wrongRes) ok('every config index lands in the shard its residue names');
else bad(wrongRes+' config indices are in the wrong shard');
if(!overlap) ok('no config index appears in two shards');
else bad(overlap+' config indices appear in more than one shard');
const sorted=union.slice().sort((a,b)=>a-b);
if(sorted.length===M && sorted.join(',')===full.join(',')) ok('union of the '+NSH+' shards is exactly 0..'+(M-1)+': no gap, no overlap');
else bad('union of the shards is '+sorted.length+' indices, not the full 0..'+(M-1)+' set');
if(parts[0].cells===0 && parts[0].idx.length===0) ok('the --pre stage walked no configs, so `pre` is counted exactly once');
else bad('the --pre stage walked configs, pre-block counters would be double counted');

try{ fs.rmSync(dir,{recursive:true,force:true}); }catch(e){}
done();
'''

def put(rel, body, mode):
    p = os.path.join(ROOT, rel)
    d = os.path.dirname(p)
    if not os.path.isdir(d):
        os.makedirs(d)
    io.open(p, 'w', encoding='utf-8').write(body)
    os.chmod(p, mode)
    print('wrote %s (%d bytes)' % (p, len(body)))

put('tests/fuzz.sh', SH, 0o755)
put('tests/gates/g_fuzz_shard_equiv.js', GATE, 0o644)
