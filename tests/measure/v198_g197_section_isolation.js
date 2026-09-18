// v198_g197_section_isolation — does one section of g197_leg_accessory.js leave state that
// changes a LATER section's result? Read-only: instruments COPIES of the gate, never the gate.
//
// Variants, each an anchor-asserted text surgery on a copy (count==1 enforced):
//   V0a / V0b  unmodified, run twice        -> proves the baseline equals itself (§10b)
//   V1         section C's WRITES skipped   -> C's assertions still run, its IA.window writes
//                                              and its four render probes do not
//   V2         B's sweep AND C skipped      -> D and E alone, as if in their own process
//   V4         D's build skipped            -> E alone after D
// Oracle: the gate's own stdout, sliced at its own section banners and BYTE-compared.
// A changed denominator with an unchanged verdict is the failure mode, so the comparison is
// on bytes, not on PASS/FAIL counts.
// Also snapshots, at every section boundary: VM global keys, localStorage entries, pending
// timers — so a mutation that has no effect TODAY is still reported as a mutation.
const fs=require('fs'), path=require('path'), os=require('os'), crypto=require('crypto');
const {spawnSync}=require('child_process');
const ROOT=path.join(__dirname,'..','..');
const GATE=path.join(ROOT,'tests','gates','g197_leg_accessory.js');
const CAND=process.argv[2]||path.join(ROOT,'index.html');
const BASE=process.argv[3]||null;
const OUT=process.env.V198_OUT||os.tmpdir();
const GATEDIR=path.join(ROOT,'tests','gates');
const HARNESS=path.join(ROOT,'tests','harness.js');

function build(){
  let src=fs.readFileSync(GATE,'utf8');
  const must=(n,r)=>{const c=src.split(n).length-1; if(c!==1){console.error('ANCHOR count='+c+': '+n.slice(0,60));process.exit(3);} src=src.replace(n,r);};
  // state probe
  must("const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));",
`const __H = require(${JSON.stringify(HARNESS)});
const load=__H.load, fixtures=__H.fixtures, progDigest=__H.progDigest;
const __crypto=require('crypto');
global.__SNAPS=[];
global.__snap=function(tag){
  try{
    const w=IA.window;
    const keys=Object.keys(w).sort();
    let ls='n/a'; try{ const m=IA.localStorage._map; ls=JSON.stringify(Array.from(m.entries()).sort()); }catch(e){ ls='ERR '+e.message; }
    let tm='n/a'; try{ tm=String(IA.ctx&&0); }catch(e){}
    __SNAPS.push({tag:tag, nkeys:keys.length,
      keyhash:__crypto.createHash('md5').update(keys.join('|')).digest('hex').slice(0,12),
      keys:keys.filter(k=>/^__|^_g197|^ia_/.test(k)),
      lslen:(ls==='n/a'?-1:JSON.parse(ls).length), lshash:__crypto.createHash('md5').update(ls).digest('hex').slice(0,12)});
  }catch(e){ __SNAPS.push({tag:tag, err:e.message}); }
};`);
  const MARKS=[["console.log('\\n-- A. the pool","A"],["console.log('\\n-- B. full lattice sweep --');","B"],
    ["console.log('\\n-- C. render surfaces","C"],["console.log('\\n-- D. HALF_MANNY --');","D"],
    ["console.log('\\n-- E. D84: Calves before Leg isolation --');","E"]];
  MARKS.forEach(([a,t])=>must(a,"__snap('before-"+t+"'); "+a));
  // the three skips
  must("for (const c of L) {","for (const c of (process.env.SKIP_B ? [] : L)) {");
  must("renderDays.forEach(rd => {","(process.env.SKIP_C ? [] : renderDays).forEach(rd => {");
  must("  const rd = renderDays.filter(d => d.sec && (d.sec.items || []).length > 0)[0];",
       "  const rd = process.env.SKIP_C ? null : renderDays.filter(d => d.sec && (d.sec.items || []).length > 0)[0];");
  must("{\n  const p = IA.buildProgram(fixtures.HALF_MANNY);","if(!process.env.SKIP_D){\n  const p = IA.buildProgram(fixtures.HALF_MANNY);");
  must("console.log('\\nPASS ' + pass + ' FAIL ' + fail);",
`__snap('end');
fs.writeFileSync(process.env.V198_SNAP, JSON.stringify(__SNAPS,null,1));
console.log('\\nPASS ' + pass + ' FAIL ' + fail);`);
  src=src.split('__dirname').join(JSON.stringify(GATEDIR));
  return src;
}
const COPY=path.join(OUT,'v198_iso_gate.js');
try{fs.unlinkSync(COPY);}catch(e){}
fs.writeFileSync(COPY,build());

const VARIANTS=[
  ['V0a',{}],['V0b',{}],
  ['V1_skipC',{SKIP_C:'1'}],
  ['V2_skipBC',{SKIP_B:'1',SKIP_C:'1'}],
  ['V4_skipD',{SKIP_D:'1'}],
];
const args=[COPY,CAND]; if(BASE) args.push(BASE);
const res={};
for(const [nm,env] of VARIANTS){
  const snapPath=path.join(OUT,'v198_iso_'+nm+'.snap.json');
  try{fs.unlinkSync(snapPath);}catch(e){}
  const t0=Date.now();
  const r=spawnSync('node',args,{env:Object.assign({},process.env,env,{V198_SNAP:snapPath}),encoding:'utf8',maxBuffer:1<<28});
  const out=r.stdout||'';
  fs.writeFileSync(path.join(OUT,'v198_iso_'+nm+'.out'),out);
  if(!fs.existsSync(snapPath)){ console.log('MEASUREMENT FAILED: '+nm+' produced no snapshot. exit='+r.status+'\n'+(r.stderr||'').slice(0,2000)); process.exit(2); }
  res[nm]={out:out, snaps:JSON.parse(fs.readFileSync(snapPath,'utf8')), secs:((Date.now()-t0)/1000).toFixed(1), status:r.status};
  console.log(nm+' done in '+res[nm].secs+'s, exit '+r.status+', '+(out.match(/PASS \d+ FAIL \d+/)||['?'])[0]);
}
// slice stdout at the gate's own banners
function slice(out,from,to){
  const i=out.indexOf(from); if(i<0) return null;
  const j=to?out.indexOf(to,i):-1; return out.slice(i, j<0?out.length:j);
}
const BAN={A:'-- A. the pool',B:'-- B. full lattice sweep',C:'-- C. render surfaces',D:'-- D. HALF_MANNY',E:'-- E. D84:'};
const SEC=[['A',BAN.A,BAN.B],['B',BAN.B,BAN.C],['C',BAN.C,BAN.D],['D',BAN.D,BAN.E],['E',BAN.E,null]];
const h=s=>s===null?'MISSING':crypto.createHash('md5').update(s).digest('hex').slice(0,10);
console.log('\n-- stdout slice hashes per section, per variant (byte compare) --');
console.log('   variant'.padEnd(14)+SEC.map(s=>s[0].padStart(12)).join(''));
const hashes={};
Object.keys(res).forEach(v=>{ hashes[v]=SEC.map(([n,a,b])=>h(slice(res[v].out,a,b)));
  console.log('   '+v.padEnd(14)+hashes[v].map(x=>x.padStart(12)).join('')); });
console.log('\n-- verdicts (vs V0a) --');
function verdict(v,secs){ return secs.map(s=>{const i=SEC.findIndex(x=>x[0]===s); return s+':'+(hashes[v][i]===hashes.V0a[i]?'IDENTICAL':(hashes[v][i]==='MISSING'?'not-run':'DIFFERS')); }).join('  '); }
console.log('   V0b  (self-identity, all five): '+verdict('V0b',['A','B','C','D','E']));
console.log('   V1   C writes skipped         : '+verdict('V1_skipC',['D','E']));
console.log('   V2   B+C skipped              : '+verdict('V2_skipBC',['D','E']));
console.log('   V4   D skipped                : '+verdict('V4_skipD',['E']));
// show the diff if any
['V1_skipC','V2_skipBC','V4_skipD'].forEach(v=>{
  ['D','E'].forEach(s=>{ const i=SEC.findIndex(x=>x[0]===s);
    if(hashes[v][i]!=='MISSING' && hashes[v][i]!==hashes.V0a[i]){
      const a=slice(res.V0a.out,SEC[i][1],SEC[i][2]).split('\n'), b=slice(res[v].out,SEC[i][1],SEC[i][2]).split('\n');
      console.log('   !! '+v+' section '+s+' differs. first 6 differing lines:');
      let n=0; for(let k=0;k<Math.max(a.length,b.length)&&n<6;k++) if(a[k]!==b[k]){ console.log('      V0a: '+String(a[k]).slice(0,150)); console.log('      '+v+': '+String(b[k]).slice(0,150)); n++; }
    }});
});
console.log('\n-- VM state at each section boundary (V0a): globals / localStorage --');
res.V0a.snaps.forEach(s=>console.log('   '+String(s.tag).padEnd(12)+' globals '+String(s.nkeys).padStart(5)+' keyhash '+s.keyhash
  +'  localStorage entries '+String(s.lslen).padStart(4)+' hash '+s.lshash+'  gate-owned: '+JSON.stringify(s.keys)));
console.log('\n-- same, V1 (C writes skipped) --');
res.V1_skipC.snaps.forEach(s=>console.log('   '+String(s.tag).padEnd(12)+' globals '+String(s.nkeys).padStart(5)+' keyhash '+s.keyhash
  +'  localStorage entries '+String(s.lslen).padStart(4)+' hash '+s.lshash+'  gate-owned: '+JSON.stringify(s.keys)));
console.log('\nartifacts in '+OUT);
