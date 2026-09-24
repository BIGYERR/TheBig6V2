// v213_nrc_excl.js — MODE B pre-build measure: NRC multi-sport routing honours _d113Excl. Read-only.
// Copies (scratch): V212 = git show HEAD:index.html; V213 = the working-tree candidate (meta 213, uncommitted), copied;
//   COPY = V213 with the D146 routing gate "(NRC_GOALS.has(_msG) && _k >= 2)" -> "(NRC_GOALS.has(_msG) && !_d113Excl && _k >= 2)".
//   node v213_nrc_excl.js prep   <outdir>
//   node v213_nrc_excl.js inj    <outdir> <shard> <nShards>   NRC x 15 bike/swim combos x 18 injury states x 99 calendars, built on all three
//   node v213_nrc_excl.js report <outdir> <nShards>
// ORACLES (independent of the engine): excluded mode = injuryPlan(cfg).cardioMode in {noimpact,noimpact_swim,easy,reduce}
// (read as a label, the key under test is _d113Excl); quality run card = run card whose TEXT is Speed Run / Long Run / RACE DAY /
// TIME TRIAL / SI / LI / Tempo / Interval / Fartlek / Hill, or legLoad true, or dose.key in {int,chi,long,steady,trial,bench};
// adjacency = D130 text (NRC: Speed Run and Long Run hard, all pairs untolerated); long-last = no run after the Long Run in the ISO week.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const REPO=path.join(__dirname,'..','..'); const H=require(path.join(REPO,'tests','harness.js'));
const DAYS=['sun','mon','tue','wed','thu','fri','sat'], ISO=['mon','tue','wed','thu','fri','sat','sun'];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
const CALS=[]; [0,1,2,3,4].forEach(n=>combos(DAYS,n).forEach(r=>CALS.push(r)));
const INJ=['shoulder','elbow','lowback','hip','knee','ankle'].flatMap(r=>['protect','workaround','return'].map(t=>({region:r,tier:t})));
const BIKEG=['bike_base','bike_ftp','bike_century'], SWIMG=['swim_base','swim_500_time','swim_mile'];
const EX=[]; BIKEG.forEach(b=>EX.push({bike:b})); SWIMG.forEach(s=>EX.push({swim:s})); BIKEG.forEach(b=>SWIMG.forEach(s=>EX.push({bike:b,swim:s})));
const NRCG=['run_5k','run_10k','run_half','run_marathon']; const EXCL=new Set(['noimpact','noimpact_swim','easy','reduce']);
function mkCfg(g,ex,rest,inj){ const cg={run:{id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}}; const types=['run'];
  if(ex.bike){ types.push('bike'); cg.bike={id:ex.bike,label:ex.bike,baselineDist:'10',baseline:'10mi'}; } if(ex.swim){ types.push('swim'); cg.swim={id:ex.swim,label:ex.swim,baselineDist:'1000',baseline:'1000m'}; }
  return {name:'M',primaryPath:'goal',cardioTypes:types,cardioGoals:cg,eventTargeted:false,liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'crossfit',unit:'lbs',restDays:rest.slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:1001,injury:inj}; }
const cards=x=>(!x||!x.cardio)?[]:[].concat(x.cardio).filter(Boolean);
const isQ=c=>c.type==='run'&&(!!c.legLoad||['int','chi','long','steady','trial','bench'].includes(c.dose&&c.dose.key)||/^Speed Run|^Long Run|RACE DAY|TIME TRIAL|\((SI|LI)\)|Tempo|Interval|Fartlek|Hill/i.test(c.subtype||''));
const cardioSig=p=>JSON.stringify(Object.keys(p.weeks).map(w=>DAYS.map(d=>cards(p.weeks[w][d]))));
function nrcStats(p){ let U=0,LL=0,W=0; Object.keys(p.weeks).forEach(w=>{ const runs=[]; ISO.forEach(d=>cards(p.weeks[w][d]).forEach(c=>{ if(c.type==='run') runs.push({d,hard:/^Speed Run|^Long Run|RACE DAY/i.test(c.subtype||''),long:/^Long Run/.test(c.subtype||'')}); }));
  W++; const h=runs.filter(r=>r.hard); for(let a=0;a<h.length;a++) for(let b=a+1;b<h.length;b++){ const x=Math.abs(ISO.indexOf(h[a].d)-ISO.indexOf(h[b].d)); if(Math.min(x,7-x)===1){ U++; } }
  const L=runs.find(r=>r.long); if(L&&runs.some(r=>ISO.indexOf(r.d)>ISO.indexOf(L.d))) LL++; }); return {U,LL,W}; }
function prep(outdir){
  const put=(n,s)=>{ fs.mkdirSync(path.join(outdir,n),{recursive:true}); fs.writeFileSync(path.join(outdir,n,'index.html'),s); };
  const v212=cp.execSync('git show HEAD:index.html',{cwd:REPO,encoding:'utf8',maxBuffer:1<<28}); const v213=fs.readFileSync(path.join(REPO,'index.html'),'utf8');
  const vv=s=>(s.match(/name="ia-version" content="(\d+)"/)||[])[1]; console.log('[prep] V212 meta',vv(v212),'| working tree meta',vv(v213),'| sha1',require('crypto').createHash('sha1').update(v213).digest('hex').slice(0,12));
  const A="(NRC_GOALS.has(_msG) && _k >= 2)", B="(NRC_GOALS.has(_msG) && !_d113Excl && _k >= 2)"; const c=v213.split(A).length-1; console.log('[prep] anchor',A,'count='+c); if(c!==1) throw new Error('anchor');
  const ln=v213.slice(0,v213.indexOf(A)).split('\n').length; console.log('[prep] at line',ln,':',v213.split('\n')[ln-1].trim().slice(0,160));
  put('V212',v212); put('V213',v213); put('COPY',v213.replace(A,B)); console.log('[prep] wrote V212 V213 COPY');
}
function inj(outdir,sh,n){
  const L=['V212','V213','COPY'].map(l=>H.load(path.join(outdir,l,'index.html'))); const plan=L[1].eval('injuryPlan');
  const rows=[]; let i=-1, crash=0;
  NRCG.forEach(g=>EX.forEach(ex=>[null,...INJ].forEach(ij=>CALS.forEach(rest=>{ i++; if(i%n!==sh) return;
    const cfg=mkCfg(g,ex,rest,ij); const mode=(ij&&(plan(cfg)||{}).cardioMode)||'none'; let P;
    try{ P=L.map(I=>I.buildProgram(JSON.parse(JSON.stringify(cfg)))); }catch(e){ crash++; return; }
    const d=P.map(p=>H.progDigest(p)), cs=P.map(cardioSig); const st=nrcStats(P[2]);
    let q=0,rc=0; Object.values(P[2].weeks).forEach(w=>DAYS.forEach(dd=>cards(w&&w[dd]).forEach(c=>{ if(c.type==='run'){ rc++; if(isQ(c)) q++; } })));
    rows.push({g,combo:(ex.bike?'B':'')+(ex.swim?'S':''),inj:ij?ij.region+'/'+ij.tier:'none',mode,excl:EXCL.has(mode),
      m13:d[0]!==d[1], mC:d[0]!==d[2], m13c:cs[0]!==cs[1], mCc:cs[0]!==cs[2], cv13:d[1]!==d[2], U:st.U, LL:st.LL, W:st.W, q, rc}); }))));
  fs.writeFileSync(path.join(outdir,'nx_'+sh+'.json'),JSON.stringify({crash,rows})); console.log(`[inj shard ${sh}/${n}] rows ${rows.length} crash ${crash}`);
}
function report(outdir,n){
  let rows=[],crash=0; for(let s=0;s<n;s++){ const j=JSON.parse(fs.readFileSync(path.join(outdir,'nx_'+s+'.json'),'utf8')); rows=rows.concat(j.rows); crash+=j.crash; }
  console.log(`[report] builds ${rows.length} (x3 artifacts) crash ${crash}`);
  const seg={}; rows.forEach(r=>{ const k=(r.excl?'EXCL ':'keep ')+'mode='+r.mode; const a=seg[k]=seg[k]||{n:0,m13:0,mC:0,m13c:0,mCc:0,cv:0,U:0,LL:0,W:0,q:0,rc:0}; a.n++; ['m13','mC','m13c','mCc'].forEach(f=>{ if(r[f]) a[f]++; }); if(r.cv13) a.cv++; a.U+=r.U; a.LL+=r.LL; a.W+=r.W; a.q+=r.q; a.rc+=r.rc; });
  console.log('   segment                    | moved vs V212: V213 (cardio) | COPY (cardio) | COPY != V213 | COPY untol pairs / long-not-last wks / weeks | COPY quality run cards');
  Object.keys(seg).sort().forEach(k=>{ const a=seg[k]; console.log(`   ${k.padEnd(26)} n=${String(a.n).padStart(6)} | ${a.m13} (${a.m13c}) | ${a.mC} (${a.mCc}) | ${a.cv} | ${a.U} / ${a.LL} / ${a.W} | ${a.q}/${a.rc}`); });
  const ex=rows.filter(r=>r.excl), re=ex.filter(r=>r.m13); console.log(`   (a) excluded-mode NRC multi-sport programs V213 moved vs V212: ${re.length}/${ex.length}; of those, COPY moved vs V212: ${re.filter(r=>r.mC).length}/${re.length}; COPY moved vs V212 over all excluded: ${ex.filter(r=>r.mC).length}/${ex.length}`);
  const bg={}; re.forEach(r=>{ const k=r.g+' '+r.combo+' '+r.inj; bg[k]=(bg[k]||0)+1; }); console.log('       V213-moved excluded by goal/combo/injury (top 12): '+Object.entries(bg).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>k+':'+v).join('  '));
  console.log(`   (b) quality run cards under excluded modes on COPY: ${ex.reduce((a,r)=>a+r.q,0)}/${ex.reduce((a,r)=>a+r.rc,0)}`);
  const kp=rows.filter(r=>!r.excl); console.log(`   (c) non-excluded (none/halfstep/swimout) COPY vs V213 moved: ${kp.filter(r=>r.cv13).length}/${kp.length}; COPY untol pairs ${kp.reduce((a,r)=>a+r.U,0)}, long-not-last weeks ${kp.reduce((a,r)=>a+r.LL,0)} of ${kp.reduce((a,r)=>a+r.W,0)}; moved vs V212 ${kp.filter(r=>r.mC).length}/${kp.length}`);
  const un=rows.filter(r=>r.inj==='none'); console.log(`       uninjured subset: COPY vs V212 moved ${un.filter(r=>r.mC).length}/${un.length}; V213 vs V212 ${un.filter(r=>r.m13).length}/${un.length}; COPY vs V213 ${un.filter(r=>r.cv13).length}/${un.length}`);
}
const [mode,a1,a2,a3]=process.argv.slice(2);
if(mode==='prep') prep(a1); else if(mode==='inj') inj(a1,+a2,+a3); else if(mode==='report') report(a1,+a2);
else { console.error('usage: prep|inj|report'); process.exit(2); }
