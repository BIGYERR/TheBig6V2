// v210_closing_attrib.js — measure pass (V210 closing), companion to v210_closing_rows.js. Read-only.
// Usage: node tests/measure/v210_closing_attrib.js <scratchdir>     (needs v209.html, v210.html)
//        node tests/measure/v210_closing_attrib.js --worker <art.html> <lattice> <out.json>
// Question: which V210 mechanism moves which cells, and do the g199 DELOAD_ARB/E6 inputs move
// underneath an unchanged count (offsetting flips)?
// Method: counterfactual copies of v210 by source surgery, each reverting ONE mechanism to its
// V209 bytes (anchor count==1 or the arm is NOT-APPLIED and the pass aborts). A moved config
// (v210 digest != v209 digest) is ATTRIBUTED to mechanism X when v210-minus-X equals v209.
// Oracle for "posterior": g199's hand E_PAT table (copied verbatim), not the engine's _pattern.
// Lattices: G199 = g199's own 1,728 keys (18-35 only), copied verbatim;
//           AGE   = 6 tiers x 3 ages x 3 focus x 2 exp x 4 inj x 2 goals x 2 seeds = 1,728.
const fs=require('fs'), path=require('path'), cp=require('child_process'), crypto=require('crypto');
const H=require(path.join(__dirname,'..','harness.js'));
const E_PAT=[
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i]];
const ePat=n=>{const t=String(n||'');for(const [p,r] of E_PAT) if(r.test(t)) return p; return null;};
const isPost=n=>{const p=ePat(n);return p==='hinge'||p==='hip_ext';};
const E_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
function eCfg(tier,focus,exp,g,rest,seed,age){
  const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,
    ageBracket:age||'18-35',equipment:tier,unit:'lbs',restDays:rest.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
}
function lattice(name){
  const L=[];
  const GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
  const INJ={healthy:null,'shoulder/protect':{region:'shoulder',tier:'protect'},'lowback/protect':{region:'lowback',tier:'protect'},
    'knee/protect':{region:'knee',tier:'protect'},'elbow/protect':{region:'elbow',tier:'protect'}};
  if(name==='G199'){
    const RESTS={sun:['sun'],'sun+wed':['sun','wed'],'sat+sun':['sat','sun']};
    for(const t of E_TIERS)for(const f of ['hypertrophy','balanced'])for(const x of ['beginner','advanced'])for(const g of GOALS)
      for(const i of ['healthy','shoulder/protect','lowback/protect','knee/protect'])for(const r of Object.keys(RESTS))for(const sd of [1013,3039]){
        const c=eCfg(t,f,x,g,RESTS[r],sd); if(INJ[i]) c.injury=Object.assign({},INJ[i]);
        L.push({key:[t,f,x,g.k,i,r,sd,'18-35'].join('|'),seg:{tier:t,focus:f,exp:x,goal:g.k,inj:i,age:'18-35'},cfg:c}); }
  } else {
    for(const t of E_TIERS)for(const a of ['18-35','36-54','55+'])for(const f of ['hypertrophy','balanced','strength'])for(const x of ['beginner','advanced'])
      for(const i of ['healthy','shoulder/protect','elbow/protect','knee/protect'])for(const g of [GOALS[0],GOALS[2]])for(const sd of [1013,3039]){
        const c=eCfg(t,f,x,g,['sun','wed'],sd,a); if(INJ[i]) c.injury=Object.assign({},INJ[i]);
        L.push({key:[t,f,x,g.k,i,'sun+wed',sd,a].join('|'),seg:{tier:t,focus:f,exp:x,goal:g.k,inj:i,age:a},cfg:c}); }
  }
  return L;
}
if(process.argv[2]==='--worker'){
  const [,,,art,lat,out]=process.argv; const IA=H.load(art); const res={};
  lattice(lat).forEach(L=>{ let prog;
    try{ prog=IA.buildProgram(JSON.parse(JSON.stringify(L.cfg))); }catch(e){ res[L.key]={err:String(e&&e.message)}; return; }
    const W=prog.weeks||{}, wk={}, cells={}; const names={};
    Object.keys(W).forEach(w=>{ let tot=0; Object.keys(W[w]).forEach(d=>{ const day=W[w][d]; let n=0;
      ((day&&day.sections)||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{ const nm=String((it&&it.name)||''); if(isPost(nm)) n++; names[nm]=(names[nm]||0)+1; }));
      cells[w+'|'+d]=crypto.createHash('sha1').update(JSON.stringify(day)).digest('hex').slice(0,12); tot+=n; }); wk[w]=tot; });
    res[L.key]={dig:H.progDigest(prog),wk,cells,names,swu:(prog._swapUniverse||[]).slice().sort()};
  });
  fs.writeFileSync(out,JSON.stringify(res)); process.exit(0);
}
// ── driver ──
const S=path.resolve(process.argv[2]||'.');
const V210=fs.readFileSync(path.join(S,'v210.html'),'utf8');
const REV={
  GEAR_RE:[["if(!hasBarbell && /\\bbarbell\\b|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|close-grip bench|glute-ham/i.test(N)) return false;",
            "if(!hasBarbell && /^barbell |^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|glute-ham/i.test(N)) return false;"]],
  POOL_MAIN:[["let chestCompoundPool=hasBarbell?_gear(olderHyp?['Dumbbell bench press','Dumbbell incline press','Machine chest press','Close-grip bench press']:EXLIB.chest_compound):",
              "let chestCompoundPool=hasBarbell?(olderHyp?['Dumbbell bench press','Dumbbell incline press','Machine chest press','Close-grip bench press']:EXLIB.chest_compound):"],
             ["let squatPool=hasBarbell?_gear(olderHyp?EXLIB.squat_joint:EXLIB.squat):","let squatPool=hasBarbell?(olderHyp?EXLIB.squat_joint:EXLIB.squat):"]],
  POOL_ACC:[["const chestPoolRaw=isBW?(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc):_gear(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc);","const chestPoolRaw=isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc;"],
            ["_gear(isOlder?['Dumbbell incline press','Machine chest press','Dumbbell bench press','Dumbbell decline press']","isOlder?['Dumbbell incline press','Machine chest press','Dumbbell bench press','Dumbbell decline press']"],
            [":['Incline barbell press','Dumbbell bench press','Close-grip bench press','Dumbbell incline press'])",":['Incline barbell press','Dumbbell bench press','Close-grip bench press','Dumbbell incline press']"]],
  FINISHER:[["const _fA=_armsDay?(isBW?EXLIB.biceps:bicepsAccPool).filter(_noBar):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));","const _fA=_armsDay?EXLIB.biceps.filter(_noBar):EXLIB.shoulder_iso;"],
            ["const _fB=_armsDay?(isBW?EXLIB.triceps:_gear(EXLIB.triceps)):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));","const _fB=_armsDay?EXLIB.triceps:EXLIB.shoulder_iso;"]],
  FRONT_ADD:[["else if(olderHyp&&hasBarbell&&!hasCables&&cfg.experience==='advanced'&&cfg.ageBracket==='55+') squatPool=squatPool.concat(['Front squat']);","else if(false) squatPool=squatPool.concat(['Front squat']);"]],
  FRONT_WITHHOLD:[["if(_noRack) squatPool=squatPool.filter(n=>n!=='Front squat');","if(false) squatPool=squatPool.filter(n=>n!=='Front squat');"],
                  ["if(R==='shoulder'||R==='elbow') P.dropNames=new RegExp(","if(false) P.dropNames=new RegExp("]],
  D150:[["  { const _isBW=cfg.equipment==='bodyweight'; const _u=_swapUniverseList()","  if(false){ const _isBW=cfg.equipment==='bodyweight'; const _u=_swapUniverseList()"]]
};
const ARTS={v209:path.join(S,'v209.html'),v210:path.join(S,'v210.html')};
for(const k of Object.keys(REV)){ let t=V210;
  for(const [a,b] of REV[k]){ const n=t.split(a).length-1; if(n!==1){ console.log('NOT-APPLIED '+k+' anchor count '+n+': '+a.slice(0,80)); process.exit(3);} t=t.replace(a,()=>b); }
  const f=path.join(S,'v210_minus_'+k+'.html'); fs.rmSync(f,{force:true}); fs.writeFileSync(f,t); ARTS['-'+k]=f; }
console.log('counterfactual arms: '+Object.keys(ARTS).join(' ')+' (every anchor count==1)');
const OUTD=path.join(S,'v210_attrib'); fs.rmSync(OUTD,{recursive:true,force:true}); fs.mkdirSync(OUTD);
const jobs=[]; for(const lat of ['G199','AGE']) for(const a of Object.keys(ARTS)) jobs.push({lat,a,out:path.join(OUTD,lat+'_'+a.replace(/\W/g,'_')+'.json')});
let i=0, live=0; const N=8;
function next(){ if(i>=jobs.length){ if(!live) report(); return; } const j=jobs[i++]; live++;
  cp.execFile('node',[__filename,'--worker',ARTS[j.a],j.lat,j.out],{maxBuffer:1<<26,timeout:3000000},(e,so,se)=>{ if(e){console.log('WORKER FAIL '+j.lat+' '+j.a+' '+(se||e.message).slice(0,300));} live--; next(); }); }
for(let k=0;k<N;k++) next();
function report(){
  const R=(lat,a)=>JSON.parse(fs.readFileSync(jobs.find(j=>j.lat===lat&&j.a===a).out,'utf8'));
  const mech=Object.keys(REV);
  for(const lat of ['G199','AGE']){
    const L=lattice(lat), A=R(lat,'v209'), B=R(lat,'v210'); const CF={}; mech.forEach(m=>CF[m]=R(lat,'-'+m));
    let errs=0; L.forEach(x=>{ if(A[x.key].err||B[x.key].err) errs++; });
    console.log('\n==== lattice '+lat+': '+L.length+' configs, build errors '+errs);
    // self-check: v209 vs itself is implied by gate B6c; here prove each counterfactual reverts SOMETHING
    const moved=L.filter(x=>A[x.key].dig!==B[x.key].dig);
    let cellsTot=0, cellsMoved=0; L.forEach(x=>{ const ca=A[x.key].cells, cb=B[x.key].cells; Object.keys(ca).forEach(k=>{cellsTot++; if(ca[k]!==cb[k]) cellsMoved++;}); });
    console.log('configs whose progDigest moved v209->v210: '+moved.length+'/'+L.length+'; day cells moved '+cellsMoved+'/'+cellsTot);
    const seg={}; moved.forEach(x=>{ for(const d of ['tier','inj','age','focus','exp','goal']){ seg[d]=seg[d]||{}; seg[d][x.seg[d]]=(seg[d][x.seg[d]]||0)+1; } });
    const den={}; L.forEach(x=>{ for(const d of ['tier','inj','age','focus','exp','goal']){ den[d]=den[d]||{}; den[d][x.seg[d]]=(den[d][x.seg[d]]||0)+1; } });
    for(const d of Object.keys(den)) console.log('  by '+d+': '+Object.keys(den[d]).map(v=>v+' '+((seg[d]||{})[v]||0)+'/'+den[d][v]).join(', '));
    // attribution
    const attr={}; moved.forEach(x=>{ const who=mech.filter(m=>CF[m][x.key].dig===A[x.key].dig);
      const any=mech.filter(m=>CF[m][x.key].dig!==B[x.key].dig);
      const k=who.length?('restored by -'+who.join(',-')):('no single revert restores; reverts that change it: '+(any.join(',')||'none'));
      attr[k]=(attr[k]||0)+1; });
    console.log('  attribution of the '+moved.length+' moved configs:'); Object.keys(attr).sort((a,b)=>attr[b]-attr[a]).forEach(k=>console.log('    '+attr[k]+'  '+k));
    mech.forEach(m=>{ const n=L.filter(x=>CF[m][x.key].dig!==B[x.key].dig).length; console.log('  reverting '+m.padEnd(15)+' changes '+n+'/'+L.length+' v210 configs'); });
    // items that appeared/disappeared
    const dn={}; moved.forEach(x=>{ const na=A[x.key].names, nb=B[x.key].names; new Set(Object.keys(na).concat(Object.keys(nb))).forEach(n=>{ const d=(nb[n]||0)-(na[n]||0); if(d) dn[n]=(dn[n]||0)+d; }); });
    const top=Object.entries(dn).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,24);
    console.log('  net item-count change v209->v210 (top 24 by |delta|): '+top.map(([n,d])=>n+' '+(d>0?'+':'')+d).join('; '));
    // zero-posterior week flips (g199 C1 input)
    let wkTot=0, z9=0, z10=0, flipOn=0, flipOff=0; const flipSeg={};
    L.forEach(x=>{ const wa=A[x.key].wk, wb=B[x.key].wk; Object.keys(wa).forEach(w=>{ wkTot++; const a0=wa[w]===0, b0=wb[w]===0; if(a0) z9++; if(b0) z10++;
      if(!a0&&b0){flipOn++; flipSeg[x.seg.tier+'|'+x.seg.inj]=(flipSeg[x.seg.tier+'|'+x.seg.inj]||0)+1;} if(a0&&!b0){flipOff++; flipSeg[x.seg.tier+'|'+x.seg.inj]=(flipSeg[x.seg.tier+'|'+x.seg.inj]||0)+1;} }); });
    console.log('  zero-posterior weeks (hand E_PAT, shipped card, all weeks): v209 '+z9+' v210 '+z10+' of '+wkTot+'; weeks newly zero '+flipOn+', no longer zero '+flipOff+(flipOn+flipOff?' '+JSON.stringify(flipSeg):''));
    // posterior item totals
    let p9=0,p10=0; L.forEach(x=>{ Object.values(A[x.key].wk).forEach(v=>p9+=v); Object.values(B[x.key].wk).forEach(v=>p10+=v); });
    console.log('  posterior items (hand E_PAT) on shipped cards: v209 '+p9+' v210 '+p10);
    // swap universe (D150)
    let swuMoved=0, swuDrop={}, swuAdd={}; L.forEach(x=>{ const a=A[x.key].swu, b=B[x.key].swu; if(JSON.stringify(a)!==JSON.stringify(b)){ swuMoved++;
      const sb=new Set(b), sa=new Set(a); a.forEach(n=>{ if(!sb.has(n)) swuDrop[n]=(swuDrop[n]||0)+1; }); b.forEach(n=>{ if(!sa.has(n)) swuAdd[n]=(swuAdd[n]||0)+1; }); } });
    const swuSeg={}; L.forEach(x=>{ if(JSON.stringify(A[x.key].swu)!==JSON.stringify(B[x.key].swu)) swuSeg[x.seg.tier]=(swuSeg[x.seg.tier]||0)+1; });
    const swuD150=L.filter(x=>JSON.stringify(CF.D150[x.key].swu)!==JSON.stringify(B[x.key].swu)).length;
    const swuD150dig=L.filter(x=>CF.D150[x.key].dig!==B[x.key].dig).length;
    console.log('  _swapUniverse (excluded from progDigest) moved in '+swuMoved+'/'+L.length+' configs by tier '+JSON.stringify(swuSeg)+'; reverting D150 changes the universe in '+swuD150+' and the digest in '+swuD150dig);
    console.log('    names leaving the universe (configs): '+Object.entries(swuDrop).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([n,c])=>n+' '+c).join('; '));
    console.log('    names entering: '+(Object.entries(swuAdd).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([n,c])=>n+' '+c).join('; ')||'none'));
    // front squat census
    const fs9=L.reduce((s,x)=>s+(A[x.key].names['Front squat']||0),0), fs10=L.reduce((s,x)=>s+(B[x.key].names['Front squat']||0),0);
    const fsBy={}; L.forEach(x=>{ const d=(B[x.key].names['Front squat']||0)-(A[x.key].names['Front squat']||0); if(d){ const k=[x.seg.tier,x.seg.age,x.seg.focus,x.seg.exp,x.seg.inj].join('|'); fsBy[k]=(fsBy[k]||0)+d; } });
    console.log('  Front squat items: v209 '+fs9+' v210 '+fs10+'; delta by tier|age|focus|exp|inj: '+JSON.stringify(fsBy));
  }
}
