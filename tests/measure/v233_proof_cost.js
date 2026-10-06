#!/usr/bin/env node
// Post-V233 measure: proof cost. Modes:
//   node v233_proof_cost.js time  <cand> <base> <outdir>   per-gate wall time, 8 at a time (GATE_JOBS)
//   node v233_proof_cost.js cover <cand> <base> <outdir>   same, each gate under its own NODE_V8_COVERAGE dir
//   node v233_proof_cost.js reach <cand> <prev> <outdir> <json>  parse coverage -> gate => executed top-level functions
// Oracle for "executed": V8 precise coverage (Node sets callCount+detailed) of the vm script whose
// filename the harness gives the candidate (<basename>.inline.js), function count>0, matched to
// top-level `function NAME` declarations by exact start offset in the same source the harness runs.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const H=require(path.join(__dirname,'..','harness.js'));
const [mode,cand,base,out,json]=process.argv.slice(2);
const GD=path.join(__dirname,'..','gates');
const gates=fs.readdirSync(GD).filter(f=>f.endsWith('.js')).sort();
const JOBS=+(process.env.GATE_JOBS||8);
function runAll(cover){
  fs.mkdirSync(out,{recursive:true});
  const res={};let i=0,live=0;const t0=Date.now();
  return new Promise(done=>{
    const next=()=>{
      while(live<JOBS&&i<gates.length){
        const g=gates[i++];live++;
        const env=Object.assign({},process.env);
        if(cover){const d=path.join(out,'cov',g);fs.rmSync(d,{recursive:true,force:true});fs.mkdirSync(d,{recursive:true});env.NODE_V8_COVERAGE=d;}
        const s=Date.now();
        const args=[path.join(GD,g),cand]; if(base) args.push(base);
        const p=cp.spawn('node',args,{env});
        let buf='';p.stdout.on('data',d=>buf+=d);p.stderr.on('data',d=>buf+=d);
        p.on('close',code=>{
          const sum=(buf.match(/^PASS \d+ FAIL \d+/m)||['NO-SUMMARY'])[0];
          res[g]={sec:(Date.now()-s)/1000,code,sum};
          fs.writeFileSync(path.join(out,g+'.out'),buf);
          live--; if(i>=gates.length&&live===0){done({res,wall:(Date.now()-t0)/1000});} else next();
        });
      }
    };next();
  });
}
function topDecls(src){ // offset -> name for column-0 function declarations
  const m=new Map();const re=/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/gm;let x;
  while((x=re.exec(src))) m.set(x.index,x[1]);
  return m;
}
function harnessSrc(file){ // exactly the string load() hands to vm
  const js=H.extractInlineJS(fs.readFileSync(file,'utf8'));
  return js+'\n;globalThis.__IA = {'+H.EXPORT_NAMES.map(n=>`${n}: (typeof ${n}!=='undefined' ? ${n} : undefined)`).join(',')+'};\n';
}
function chunks(src){ // name -> text from its declaration to the next column-0 declaration
  const d=[...topDecls(src).entries()].sort((a,b)=>a[0]-b[0]);const c={};
  d.forEach(([o,n],k)=>{const e=k+1<d.length?d[k+1][0]:src.length;c[n]=(c[n]||'')+src.slice(o,e);});
  return c;
}
(async()=>{
  if(mode==='time'||mode==='cover'){
    const r=await runAll(mode==='cover');
    const rows=Object.entries(r.res).sort((a,b)=>b[1].sec-a[1].sec);
    console.log(`MODE ${mode} gates ${rows.length} jobs ${JOBS} wall ${r.wall.toFixed(1)}s sum ${rows.reduce((s,x)=>s+x[1].sec,0).toFixed(1)}s`);
    console.log('nonzero-or-red: '+rows.filter(x=>x[1].code!==0||!/FAIL 0$/.test(x[1].sum)).map(x=>x[0]+' '+x[1].code+' '+x[1].sum).join(' | '));
    rows.forEach(([g,v])=>console.log(`${v.sec.toFixed(1).padStart(8)}s  ${g}  ${v.sum}`));
    fs.writeFileSync(path.join(out,mode+'_times.json'),JSON.stringify(r,null,1));
    return;
  }
  if(mode==='reach'){
    const prev=base;
    const csrc=harnessSrc(cand);const decl=topDecls(csrc);
    const names=[...decl.values()];
    const fname=path.basename(path.resolve(cand))+'.inline.js';
    const map={};let scriptsSeen={};
    for(const g of gates){
      const d=path.join(out,'cov',g);const ex=new Set();let files=0,hits=0,mism=0;
      for(const f of (fs.existsSync(d)?fs.readdirSync(d):[])){
        files++;
        const j=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));
        for(const s of j.result){
          const u=s.url||'';
          if(!(u===fname||u.endsWith('/'+fname))) continue;
          hits++;
          for(const fn of s.functions){
            const r0=fn.ranges[0];if(!r0||r0.count<=0) continue;
            const nm=decl.get(r0.startOffset);
            if(nm){ if(fn.functionName!==nm) mism++; ex.add(nm);}
          }
        }
      }
      map[g]={files,scripts:hits,nameMismatch:mism,executed:[...ex].sort()};
    }
    fs.writeFileSync(json,JSON.stringify({candidate:fname,topLevelDecls:names.length,gates:map},null,1));
    console.log(`top-level function decls ${names.length} (unique ${new Set(names).size}); gates ${gates.length}`);
    const nocov=gates.filter(g=>map[g].scripts===0);console.log(`gates with 0 candidate scripts in coverage: ${nocov.length} ${nocov.join(' ')}`);
    console.log(`name mismatches (offset matched, functionName differs): ${gates.reduce((s,g)=>s+map[g].nameMismatch,0)}`);
    const cnt={};for(const n of new Set(names)) cnt[n]=0;
    for(const g of gates) for(const n of map[g].executed) cnt[n]++;
    const v=Object.values(cnt);
    const b=(lo,hi)=>v.filter(x=>x>=lo&&x<=hi).length;
    console.log(`histogram over ${v.length} functions: 0 gates ${b(0,0)} | 1 ${b(1,1)} | 2-5 ${b(2,5)} | 6-20 ${b(6,20)} | >20 ${b(21,1e9)}`);
    console.log('top15: '+Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([n,c])=>n+' '+c).join(', '));
    const per=gates.map(g=>map[g].executed.length).sort((a,b)=>a-b);
    console.log(`functions per gate: min ${per[0]} median ${per[per.length>>1]} max ${per[per.length-1]}`);
    if(prev){
      const a=chunks(harnessSrc(prev)),c=chunks(csrc);
      const changed=Object.keys(c).filter(n=>a[n]!==c[n]);const removed=Object.keys(a).filter(n=>!(n in c));
      console.log(`V-prev -> cand changed/new top-level chunks: ${changed.length} [${changed.join(', ')}]; removed ${removed.length} [${removed.join(', ')}]`);
      for(const n of changed){const gs=gates.filter(g=>map[g].executed.includes(n));console.log(`  ${n}: executed by ${gs.length}/${gates.length} gates: ${gs.join(' ')}`);}
    }
  }
})();
