// v210_closing_rows.js — measure pass (V210 closing). Read-only. Adapted from v209_closing_rows.js.
// Usage: node tests/measure/v210_closing_rows.js <scratchdir>
//   <scratchdir> holds v208.html (HEAD~1), v209.html (HEAD, meta 209), v210.html (working tree, meta 209),
//   v210_forced210.html (same bytes, meta 210).
// Arms, every tests/gates/*.js, one process each:
//   CTRL      = (v209, base v208)              shipped chain, must be all green (proves the instrument)
//   CAND      = (v210_forced210, base v209)    the closing picture
//   V210AT209 = (v210 at meta 209, base v209)  V209's era rows applied to the V210 engine: a red here is
//                                              REAL MOVEMENT (or a licence keyed <=209), never a missing row
// Oracle for "moved": the V209 era rows as written in g199 / harness.js, and the same gate's reading of V209.
// Section (5) diffs every numeric line of CTRL vs V210AT209 per gate, so passing rows that moved show too.
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');
const S=path.resolve(process.argv[2]||'.'); const ROOT=path.join(__dirname,'..','..');
const GD=path.join(ROOT,'tests','gates');
const gates=fs.readdirSync(GD).filter(f=>f.endsWith('.js')).sort();
const OUT=path.join(S,'v210_gateouts'); fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT);
const ARMS=(process.argv.slice(3).length?process.argv.slice(3):['CTRL=v209.html:v208.html:all','CAND=v210_forced210.html:v209.html:all','V210AT209=v210.html:v209.html:all'])
  .map(a=>{const [tag,rest]=a.split('=');const [cand,base,set]=rest.split(':');return {tag,cand,base,set};});
const jobs=[]; gates.forEach(g=>ARMS.forEach(A=>jobs.push({tag:A.tag,g,cand:A.cand,base:A.base})));
ARMS.forEach(A=>console.log('arm '+A.tag+': '+A.cand+' vs '+A.base+' meta '+((fs.readFileSync(path.join(S,A.cand),'utf8').match(/ia-version" content="(\d+)"/)||[])[1])+' md5 '+require('crypto').createHash('md5').update(fs.readFileSync(path.join(S,A.cand))).digest('hex')));
const N=Math.max(2,Math.min(10,os.cpus().length)); let i=0, live=0;
function next(){ if(i>=jobs.length){ if(live===0) report(); return; }
  const j=jobs[i++]; live++; j.out=path.join(OUT,j.tag+'__'+j.g+'.out'); const t0=Date.now();
  cp.execFile('node',[path.join(GD,j.g),path.join(S,j.cand),path.join(S,j.base)],{maxBuffer:1<<28,timeout:2400000},(err,so,se)=>{
    fs.writeFileSync(j.out,(so||'')+(se||'')+(err&&err.killed?'\nKILLED-TIMEOUT\n':'')); j.ms=Date.now()-t0; live--; next(); });
}
for(let k=0;k<N;k++) next();
function rd(j){ return fs.readFileSync(j.out,'utf8'); }
function summ(t){ const m=t.match(/^PASS (\d+) FAIL (\d+)/m); return m?{p:+m[1],f:+m[2]}:null; }
function got(t,id){ const l=t.split('\n').find(x=>new RegExp('^\\s*(ok|FAIL)\\s+'+id+' ').test(x)); if(!l) return {st:'ABSENT'};
  const m=l.match(/got (-?\d+)/)||l.match(/: (\d+) deload day builds/); return {st:/^\s*ok/.test(l)?'ok':'FAIL',v:m?m[1]:null}; }
function gotHex(t,id){ const l=t.split('\n').find(x=>new RegExp('^\\s*(ok|FAIL)\\s+'+id+' ').test(x)); if(!l) return {st:'ABSENT'};
  const m=l.match(/\(got ([0-9a-f]{16})\)/)||l.match(/([0-9a-f]{16})/); return {st:/^\s*ok/.test(l)?'ok':'FAIL',v:m?m[1]:null}; }
function norm(t){ return t.split('\n').map(x=>x.replace(/\d+(\.\d+)?\s*m?s\b/g,'<t>').replace(/[0-9a-f]{32}/g,'<md5>').trim()).filter(x=>/\d/.test(x)); }
function report(){
  const J=(tag,g)=>jobs.find(j=>j.tag===tag&&j.g===g);
  console.log('== (1) g199 DELOAD_ARB + E6, by the gate\'s own method ==');
  const ids=[['E6',28],['C1',364],['C3',364],['C5',32],['D2',19],['I3',496]];
  ARMS.map(a=>a.tag).forEach(tag=>{ const t=rd(J(tag,'g199_deload_arbitration.js'));
    console.log(' '+tag.padEnd(10)+' '+ids.map(([id,v])=>{const r=got(t,id);return id+'='+r.v+'('+r.st+', V209 row '+v+')';}).join('  ')+'  '+JSON.stringify(summ(t))); });
  console.log('== (2) g197c E4p ==');
  ARMS.map(a=>a.tag).forEach(tag=>{ const t=rd(J(tag,'g197c_d84_cmp.js'));
    console.log(' '+tag+'  '+JSON.stringify(summ(t))); t.split('\n').filter(x=>/E4p|cap census|swept /.test(x)).forEach(x=>console.log('    '+x.trim().slice(0,400))); });
  console.log('== (3) HALF_MANNY arms ==');
  ARMS.map(a=>a.tag).forEach(tag=>{ const a=rd(J(tag,'g199_deload_arbitration.js')), c=rd(J(tag,'g200_core_tier.js'));
    console.log(' '+tag.padEnd(10)+' shipped(B1)='+JSON.stringify(gotHex(a,'B1'))+' deloadOff(B2)='+JSON.stringify(gotHex(a,'B2'))+' coreOff(F1a)='+JSON.stringify(gotHex(c,'F1a'))); });
  const FULL=ARMS.map(a=>a.tag);
  console.log('== (4) every gate, one process each ==');
  const red={}; FULL.forEach(t=>red[t]=0);
  gates.forEach(g=>{ let line=' '+g.padEnd(36);
    FULL.forEach(tag=>{ const b=rd(J(tag,g)), sb=summ(b), rb=(b.match(/^REFUSED/mg)||[]).length, sk=(b.match(/^\s*SKIP/mg)||[]).length;
      if(!sb||sb.f>0||rb>0) red[tag]++;
      line+=' '+tag+' '+(sb?('P'+sb.p+' F'+sb.f):'NO-SUMMARY')+(rb?' R'+rb:'')+(sk?' S'+sk:'')+' ('+Math.round(J(tag,g).ms/1000)+'s)  '; });
    console.log(line);
    FULL.forEach(tag=>{ const b=rd(J(tag,g)); b.split('\n').filter(x=>/^\s*FAIL|^REFUSE|KILLED|Error/.test(x)).slice(0,30).forEach(x=>console.log('     '+tag+' '+x.trim().slice(0,500))); });
  });
  console.log('gates '+gates.length+'  red: '+JSON.stringify(red));
  console.log('== (5) numeric lines that differ, CTRL vs V210AT209 (same meta 209; only the engine differs; baseline differs v208->v209) ==');
  gates.forEach(g=>{ const a=norm(rd(J('CTRL',g))), b=norm(rd(J('V210AT209',g)));
    const sa=new Set(a), sb=new Set(b); const onlyA=a.filter(x=>!sb.has(x)), onlyB=b.filter(x=>!sa.has(x));
    if(!onlyA.length&&!onlyB.length) return;
    console.log(' '+g+'  ('+onlyA.length+' V209-only / '+onlyB.length+' V210-only lines)');
    onlyA.slice(0,12).forEach(x=>console.log('   - '+x.slice(0,400))); onlyB.slice(0,12).forEach(x=>console.log('   + '+x.slice(0,400))); });
  console.log('raw outputs in '+OUT);
}
