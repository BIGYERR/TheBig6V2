// v209_closing_rows.js — measure pass (V209 closing). Read-only.
// Usage: node tests/measure/v209_closing_rows.js <scratchdir>
//   <scratchdir> must hold v207.html, v208.html, v209.html (meta 208), v209_forced209.html (meta 209).
// Runs every tests/gates/*.js, one process each, on two pairs:
//   CTRL = (v208, base v207)      — the shipped chain, must be all green (proves the instrument)
//   CAND = (v209_forced209, base v208)
// plus g199 / g197c / g200_core_tier on v209.html at meta 208 (V208's era rows applied to V209 engine).
// Then extracts, BY EACH GATE'S OWN METHOD (its printed "got"), the five DELOAD_ARB counts,
// E4p's two operands and the three HALF_MANNY arms. Oracle for "moved": the V208 era rows as
// written in g199 / harness.js, and the same gate's reading of V208.
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');
const S=path.resolve(process.argv[2]||'.'); const ROOT=path.join(__dirname,'..','..');
const GD=path.join(ROOT,'tests','gates');
const gates=fs.readdirSync(GD).filter(f=>f.endsWith('.js')).sort();
const OUT=path.join(S,'v209_gateouts'); fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT);
// Arms: argv[3..] as TAG=cand.html:base.html:all|core3   (files relative to <scratchdir>)
// Default arms reproduce the first run. core3 = g199, g197c, g200_core_tier only.
const CORE3=['g199_deload_arbitration.js','g197c_d84_cmp.js','g200_core_tier.js'];
const ARMS=(process.argv.slice(3).length?process.argv.slice(3):['CTRL=v208.html:v207.html:all','CAND=v209_forced209.html:v208.html:all','V209AT208=v209.html:v208.html:core3'])
  .map(a=>{const [tag,rest]=a.split('=');const [cand,base,set]=rest.split(':');return {tag,cand,base,set};});
const jobs=[];
gates.forEach(g=>ARMS.forEach(A=>{ if(A.set==='all'||CORE3.indexOf(g)>=0) jobs.push({tag:A.tag,g,cand:A.cand,base:A.base}); }));
ARMS.forEach(A=>console.log('arm '+A.tag+': '+A.cand+' vs '+A.base+' ('+A.set+') meta '+((fs.readFileSync(path.join(S,A.cand),'utf8').match(/ia-version" content="(\d+)"/)||[])[1])+' md5 '+require('crypto').createHash('md5').update(fs.readFileSync(path.join(S,A.cand))).digest('hex')));
const N=Math.max(2,Math.min(8,os.cpus().length)); let i=0, live=0;
function next(){ if(i>=jobs.length){ if(live===0) report(); return; }
  const j=jobs[i++]; live++; j.out=path.join(OUT,j.tag+'__'+j.g+'.out');
  const t0=Date.now();
  cp.execFile('node',[path.join(GD,j.g),path.join(S,j.cand),path.join(S,j.base)],{maxBuffer:1<<28,timeout:1500000},(err,so,se)=>{
    fs.writeFileSync(j.out,(so||'')+(se||'')); j.ms=Date.now()-t0; live--; next(); });
}
for(let k=0;k<N;k++) next();
function rd(j){ return fs.readFileSync(j.out,'utf8'); }
function summ(t){ const m=t.match(/^PASS (\d+) FAIL (\d+)/m); return m?{p:+m[1],f:+m[2]}:null; }
function got(t,id){ const l=t.split('\n').find(x=>new RegExp('^\\s*(ok|FAIL)\\s+'+id+' ').test(x)); if(!l) return {st:'ABSENT'};
  const m=l.match(/got (-?\d+)/)||l.match(/got ([0-9a-f]{16})/); return {st:/^\s*ok/.test(l)?'ok':'FAIL',v:m?m[1]:null,line:l}; }
function gotHex(t,id){ const l=t.split('\n').find(x=>new RegExp('^\\s*(ok|FAIL)\\s+'+id+' ').test(x)); if(!l) return {st:'ABSENT'};
  const m=l.match(/\(got ([0-9a-f]{16})\)/); return {st:/^\s*ok/.test(l)?'ok':'FAIL',v:m?m[1]:null}; }
function report(){
  const J=(tag,g)=>jobs.find(j=>j.tag===tag&&j.g===g);
  console.log('== (1) g199 DELOAD_ARB counts, by the gate\'s own method (its printed "got") ==');
  const ids=[['E6','endToEnd(bare literal)',36],['C1','zeroWeeks',364],['C3','zeroWeeksNonDeload',364],['C5','zeroWeeksDeloadOff',32],['D2','dlIdentical',19],['I3','capLSBkilled',496]];
  ARMS.map(a=>a.tag).forEach(tag=>{ const t=rd(J(tag,'g199_deload_arbitration.js'));
    console.log(' '+tag.padEnd(10)+' '+ids.map(([id,k,v])=>{const r=got(t,id);return id+'='+r.v+'('+r.st+', row '+v+')';}).join('  ')+'  '+JSON.stringify(summ(t))); });
  console.log('== (2) g197c E4p (within-artifact: candidate vs its own D84-swapped copy; baseline ignored) ==');
  ARMS.map(a=>a.tag).forEach(tag=>{ const t=rd(J(tag,'g197c_d84_cmp.js'));
    const l=t.split('\n').filter(x=>/E4p|cap census|swept /.test(x)); console.log(' '+tag+'  '+JSON.stringify(summ(t))); l.forEach(x=>console.log('    '+x.trim())); });
  console.log('== (3) HALF_MANNY arms ==');
  ARMS.map(a=>a.tag).forEach(tag=>{ const a=rd(J(tag,'g199_deload_arbitration.js')), c=rd(J(tag,'g200_core_tier.js'));
    console.log(' '+tag.padEnd(10)+' shipped(B1)='+JSON.stringify(gotHex(a,'B1'))+' deloadOff(B2)='+JSON.stringify(gotHex(a,'B2'))+' coreOff(F1a)='+JSON.stringify(gotHex(c,'F1a'))); });
  const FULL=ARMS.filter(a=>a.set==='all').map(a=>a.tag);
  console.log('== (4) every gate, one process each: '+FULL.join(' | ')+' ==');
  const red={}; FULL.forEach(t=>red[t]=0);
  gates.forEach(g=>{ let line=' '+g.padEnd(36);
    FULL.forEach(tag=>{ const b=rd(J(tag,g)), sb=summ(b), rb=(b.match(/^REFUSED/mg)||[]).length, sk=(b.match(/^\s*SKIP/mg)||[]).length;
      if(!sb||sb.f>0||rb>0) red[tag]++;
      line+=' '+tag+' '+(sb?('P'+sb.p+' F'+sb.f):'NO-SUMMARY')+(rb?' R'+rb:'')+(sk?' S'+sk:'')+'  '; });
    console.log(line);
    FULL.forEach(tag=>{ const b=rd(J(tag,g)); b.split('\n').filter(x=>/^\s*FAIL|^REFUSE/.test(x)).slice(0,30).forEach(x=>console.log('     '+tag+' '+x.trim().slice(0,420))); });
  });
  console.log('gates '+gates.length+'  red: '+JSON.stringify(red)+'   raw outputs in '+OUT);
}
