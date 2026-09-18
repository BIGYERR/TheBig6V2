// GATE: the sharded fuzz driver is equivalent to the sequential fuzz run.
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
// Every exit path of this gate goes through done(), and done() is the ONLY place the
// scratch dir is removed. TMPDIR stays '' until mkdtemp returns, so the two argument
// checks below -- which run before the dir exists -- cannot throw on it. The rm is in
// its own try/catch: a cleanup failure must never change the verdict or the exit code.
var TMPDIR='';
function done(){
  try{ if(TMPDIR) fs.rmSync(TMPDIR,{recursive:true,force:true}); }catch(e){}
  console.log('PASS '+pass+' FAIL '+fail); process.exit(fail?1:0);
}
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
TMPDIR=dir;   // armed the instant the dir exists; every done() from here on removes it
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
if(parts[0].cells===0 && parts[0].idx.length===0) ok('the --pre stage walked no configs');
else bad('the --pre stage walked configs, its builds would be counted twice');
// `pre` is 0 on a green build, so a shard that ALSO ran the pre-blocks would double count
// nothing visible. Assert it structurally instead of trusting the counter.
const ran=parts.map((p,i)=>p.preRan?i:-1).filter(i=>i>=0);
if(ran.length===1 && ran[0]===0) ok('the pre-blocks ran in exactly one part of the fan-out (the --pre stage)');
else bad('the pre-blocks ran in '+ran.length+' parts of the fan-out ['+ran.join(',')+'], `pre` would be counted '+ran.length+' times');

done();   // removes TMPDIR itself
