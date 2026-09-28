// v223 measure — which existing gates read the D106a "test past the goal length pins nothing" behaviour?
// Runs every tests/gates/*.js (candidate arg only, no baseline) on the artifact and on the Sa / Sc / S26 counterfactual
// copies (v223_testlen_surgery.js) and prints each gate's own PASS/FAIL summary; a gate whose summary differs is a reader.
// Usage: node tests/measure/v223_testlen_gatesweep.js <base.html> <scratchdir>
const path=require('path'), fs=require('fs'), cp=require('child_process'); const SG=require('./v223_testlen_surgery.js');
const ART=path.resolve(process.argv[2]), SCR=path.resolve(process.argv[3]); const src=fs.readFileSync(ART,'utf8');
const FILES={base:ART, Sa:SG.write(SCR,'gs_Sa.html',SG.sa(src)), Sc:SG.write(SCR,'gs_Sc.html',SG.sc(src)), S26:SG.write(SCR,'gs_S26.html',SG.s26(src))};
const GD=path.resolve(__dirname,'..','gates'); const gates=fs.readdirSync(GD).filter(f=>f.endsWith('.js')).sort();
let differ=0;
for(const g of gates){ const row={};
  for(const [vk,f] of Object.entries(FILES)){ let out='',code=0; try{ out=cp.execFileSync('node',[path.join(GD,g),f],{encoding:'utf8',timeout:900000,maxBuffer:1<<27,env:Object.assign({},process.env)}); }catch(e){ out=(e.stdout||'')+(e.stderr||''); code=e.status; }
    const sums=out.match(/PASS \d+ FAIL \d+/g); row[vk]={code,sum:sums?sums[sums.length-1]:'NO SUMMARY',fails:out.split('\n').filter(l=>/^\s*FAIL\b/.test(l)).map(l=>l.trim().slice(0,200))}; }
  const same=['Sa','Sc','S26'].every(k=>row[k].sum===row.base.sum&&row[k].code===row.base.code);
  if(!same) differ++;
  console.log((same?'same  ':'DIFFER')+' '+g.padEnd(34)+Object.entries(row).map(([k,r])=>k+' '+r.code+' '+r.sum).join(' | '));
  if(!same) for(const k of ['Sa','Sc','S26']) for(const l of row[k].fails.filter(x=>!row.base.fails.includes(x)).slice(0,4)) console.log('         '+k+' new: '+l);
}
console.log('gates',gates.length,'differing',differ); console.log('DONE');
