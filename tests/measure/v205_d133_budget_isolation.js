// v205_d133_budget_isolation — MEASURE (read-only). Companion to v205_d133_carry_budget.js.
// Three questions the first pass left confounded or blank:
//  (a) BUDGET ISOLATION. "items trimmed" is a net outcome: it moves when the CAP moves
//      (cap = max(12, SESSION_SET_BUDGET - round(ci*2)), :9987) and ALSO when the day's
//      input changes. Five transitions came back REFUTES on the net number. Here the two
//      are separated: cap (hand-recomputed from the recorded ci and the recorded
//      SESSION_SET_BUDGET, never read back from capSessionBudget), input cost entering the
//      budget, and overflow = inputCost - cap. A reader responding correctly has
//      trimmed ~= max(0, overflow) regardless of direction.
//  (b) THE TRUNK FLOOR. Trunk items on the day BEFORE and AFTER the budget, and the count
//      of days landing on ZERO trunk. Oracle is D50 as written at :10010-10035 retyped by
//      hand: family is /^Trunk /, floor is one ITEM on the DAY, suspended on long-run tiers
//      and on race day / time trial.
//  (c) legLoad cells' cardio SUBTYPE (assignedType is not on the built session; it printed blank).
// usage: node tests/measure/v205_d133_budget_isolation.js [shards]
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));
const ROOT=path.join(__dirname,'..','..');
const SCRATCH='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad';
const ARTS={v204:path.join(SCRATCH,'v204.html'), v205:path.join(ROOT,'index.html')};
const E_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS=['hypertrophy','balanced'], E_EXPS=['beginner','advanced'];
const E_GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const E_INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
  {k:'lowback/protect',v:{region:'lowback',tier:'protect'}},{k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const E_RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const E_SEEDS=[1013,3039];
function eCfg(tier,focus,exp,g,inj,rest,seed){
  const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,
    ageBracket:'18-35',equipment:tier,unit:'lbs',restDays:rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
}
const LAT=[];
for(const t of E_TIERS)for(const f of E_FOCUS)for(const x of E_EXPS)for(const g of E_GOALS)
  for(const i of E_INJ)for(const r of E_RESTS)for(const sd of E_SEEDS){
    const c=eCfg(t,f,x,g,i,r,sd); if(i.v) c.injury={region:i.v.region,tier:i.v.tier};
    LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,cfg:c});
  }
// HAND COST MODEL — retyped from the contract at :9982-9984, NOT called from the engine.
const H_STRETCH=/stretch|mobility|90\/90|foam|worlds greatest/i;
const H_HALF=/carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i;
function hSets(det){const m=String(det||'').match(/(\d+)\s*[x×]/);return m?+m[1]:0;}
function hCost(n,d){ if(H_STRETCH.test(n||''))return 0; const s=hSets(d); return H_HALF.test(n||'')?s*0.5:s; }
const A_BUD="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });";
const A_BUD_R=[
"    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){",
"      var __bi=globalThis.__SNAP2(_day.sections);",
"      _day.sections=capSessionBudget(_day.sections,_day.cardio);",
"      var __bo=globalThis.__SNAP2(_day.sections);",
"      if(globalThis.__BUD)globalThis.__BUD.push({w:String(w),d:String(_d),bi:__bi,bo:__bo,",
"        ci:(function(){try{return _cardioInterference(_day.cardio);}catch(e){return null;}})(),",
"        SSB:(typeof SESSION_SET_BUDGET!=='undefined'?SESSION_SET_BUDGET:null),",
"        cs:_day.cardio?String(_day.cardio.subtype||''):'', ct:_day.cardio?String(_day.cardio.type||''):'',",
"        ll:!!(_day.cardio&&_day.cardio.legLoad), ttl:String(_day.title||'')});",
"    } });"].join("\n");
const SNAP2="globalThis.__SNAP2=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),n:it.map(function(i){return [String((i&&i.name)||''),String((i&&i.detail)||'')];})};});};";
function instrument(art,tag){
  let RAW=fs.readFileSync(art,'utf8');
  const n=RAW.split(A_BUD).length-1;
  if(n!==1) throw new Error('A_BUD count=='+n+' in '+art+' — MEASUREMENT FAILED');
  const out=path.join(os.tmpdir(),'v205d133bi_'+tag+'_'+process.pid+'.html');
  fs.writeFileSync(out,RAW.replace(A_BUD,A_BUD_R)); return out;
}
const TRUNK=/^Trunk /;
const cost=c=>(c||[]).reduce((a,s)=>a+(s.n||[]).reduce((b,p)=>b+hCost(p[0],p[1]),0),0);
const items=c=>(c||[]).reduce((a,s)=>a+(s.n||[]).length,0);
const trunkItems=c=>(c||[]).reduce((a,s)=>a+(TRUNK.test(s.l)?(s.n||[]).length:0),0);
function sweep(ver,mine){
  const f=instrument(ARTS[ver],ver); const IA=load(f);
  IA.eval(SNAP2+"globalThis.__BUD=[];");
  const cells={}; let n=0;
  mine.forEach(L=>{ IA.eval("globalThis.__BUD.length=0;");
    IA.buildProgram(L.cfg);
    const B=IA.eval('globalThis.__BUD');
    B.forEach(b=>{ n++;
      cells[L.key+'|'+b.w+'|'+b.d]={ci:b.ci,SSB:b.SSB,cs:b.cs,ct:b.ct,ll:b.ll,ttl:b.ttl,
        cIn:cost(b.bi),cOut:cost(b.bo),iIn:items(b.bi),iOut:items(b.bo),
        tIn:trunkItems(b.bi),tOut:trunkItems(b.bo)};
    });
  });
  try{fs.unlinkSync(f);}catch(e){}
  return {cells,n};
}
if(process.env.MSHARD!==undefined){
  const si=+process.env.MSHARD, sn=+process.env.MSHARDS;
  const mine=LAT.filter((_,i)=>i%sn===si); const out={};
  ['v204','v205'].forEach(v=>{ out[v]=sweep(v,mine); });
  fs.writeFileSync(process.env.MOUT,JSON.stringify(out)); process.exit(0);
}
const SH=+(process.argv[2]||8); const outs=[],kids=[];
for(let i=0;i<SH;i++){ const o=path.join(os.tmpdir(),'m133bi_'+i+'_'+process.pid+'.json'); outs.push(o);
  try{fs.unlinkSync(o);}catch(e){}
  kids.push(new Promise((res,rej)=>{const k=fork(__filename,[],{env:Object.assign({},process.env,
    {MSHARD:String(i),MSHARDS:String(SH),MOUT:o}),stdio:'inherit'});
    k.on('exit',c=>c===0?res():rej(new Error('shard '+i+' exit '+c)));})); }
Promise.all(kids).then(()=>{
  const A={v204:{cells:{},n:0},v205:{cells:{},n:0}};
  outs.forEach(o=>{const j=JSON.parse(fs.readFileSync(o,'utf8'));
    ['v204','v205'].forEach(v=>{Object.assign(A[v].cells,j[v].cells);A[v].n+=j[v].n;});
    try{fs.unlinkSync(o);}catch(e){}});
  report(A);
}).catch(e=>{console.error('MEASUREMENT FAILED:',e.message);process.exit(1);});
function pct(a,b){return b?((100*a/b).toFixed(2)+'%'):'n/a';}
function top(m,n){return Object.keys(m).sort((a,b)=>m[b]-m[a]).slice(0,n).map(k=>'    '+String(m[k]).padStart(7)+'  '+k).join('\n')||'    (none)';}
function bump(o,k,v){o[k]=(o[k]||0)+(v===undefined?1:v);}
function report(A){
  const C4=A.v204.cells,C5=A.v205.cells,keys=Object.keys(C5).filter(k=>C4[k]);
  console.log('=== 0. DENOMINATORS ===');
  console.log('lattice configs '+LAT.length+'   budget calls V204/V205 '+A.v204.n+' / '+A.v205.n+'   keyed both '+keys.length);
  const ssb=new Set(); keys.forEach(k=>{ssb.add(C4[k].SSB+'/'+C5[k].SSB);});
  console.log('SESSION_SET_BUDGET seen (204/205): '+[...ssb].join(', '));
  const cap=c=>Math.max(12,c.SSB-Math.round((c.ci||0)*2));   // hand, from :9987
  console.log('\n=== 1. BUDGET ISOLATION — cap, input cost, overflow ===');
  let capUp=0,capDn=0,capSame=0; const capT={};
  keys.forEach(k=>{const a=cap(C4[k]),b=cap(C5[k]); if(b>a)capUp++;else if(b<a)capDn++;else capSame++;
    if(a!==b)bump(capT,'cap '+a+' -> '+b+'   (ci '+C4[k].ci+' -> '+C5[k].ci+')');});
  console.log('cap moved: up '+capUp+'  down '+capDn+'  same '+capSame+'  of '+keys.length);
  console.log(top(capT,14));
  const sum=(f)=>keys.reduce((s,k)=>s+f(k),0);
  console.log('input COST entering budget   V204='+sum(k=>C4[k].cIn).toFixed(1)+'   V205='+sum(k=>C5[k].cIn).toFixed(1));
  console.log('output COST leaving budget   V204='+sum(k=>C4[k].cOut).toFixed(1)+'   V205='+sum(k=>C5[k].cOut).toFixed(1));
  const ov=(c)=>Math.max(0,c.cIn-cap(c));
  console.log('HAND overflow (cIn-cap, floored at 0)  V204='+sum(k=>ov(C4[k])).toFixed(1)+'   V205='+sum(k=>ov(C5[k])).toFixed(1));
  // per-transition isolation
  console.log('\n  per interference transition: is the change in trimming explained by the CAP or by the INPUT?');
  const TR={}; keys.forEach(k=>{const a=C4[k].ci,b=C5[k].ci; if(a==null||b==null||a===b)return;
    const t=a.toFixed(2)+' -> '+b.toFixed(2); (TR[t]=TR[t]||[]).push(k);});
  console.log('  transition          n     cap        meanCostIn      meanOverflow     meanTrimCost   respondsToCap?');
  Object.keys(TR).sort((a,b)=>TR[b].length-TR[a].length).slice(0,12).forEach(t=>{
    const ks=TR[t],N=ks.length,m=f=>(ks.reduce((s,k)=>s+f(k),0)/N);
    const c4=cap(C4[ks[0]]),c5=cap(C5[ks[0]]);
    const oi4=m(k=>C4[k].cIn),oi5=m(k=>C5[k].cIn);
    const ov4=m(k=>ov(C4[k])),ov5=m(k=>ov(C5[k]));
    const tr4=m(k=>C4[k].cIn-C4[k].cOut),tr5=m(k=>C5[k].cIn-C5[k].cOut);
    // ORACLE: the budget must not leave the day above the cap. Checked per cell below.
    const capDir=c5<c4?'TIGHTER':c5>c4?'LOOSER ':'same   ';
    console.log('  '+t.padEnd(16)+String(N).padStart(5)+'  '+String(c4+'->'+c5).padStart(9)+' '+capDir
      +'  '+oi4.toFixed(1).padStart(6)+'->'+oi5.toFixed(1).padStart(6)
      +'   '+ov4.toFixed(1).padStart(6)+'->'+ov5.toFixed(1).padStart(6)
      +'   '+tr4.toFixed(1).padStart(6)+'->'+tr5.toFixed(1).padStart(6)
      +'   input '+(Math.abs(oi5-oi4)>0.5?'MOVED':'flat '));
  });
  // ORACLE: no day may leave the budget above its own cap (unless nothing was trimmable)
  let over4=0,over5=0; const oEx={};
  keys.forEach(k=>{ if(C4[k].cOut>cap(C4[k])+1e-9)over4++;
    if(C5[k].cOut>cap(C5[k])+1e-9){over5++;bump(oEx,C5[k].ttl+'  cost '+C5[k].cOut+' > cap '+cap(C5[k]));} });
  console.log('\n  ORACLE: day cost AFTER the budget exceeds its own hand-computed cap');
  console.log('    V204 = '+over4+' / '+keys.length+'    V205 = '+over5+' / '+keys.length+'   (protected sections make this legal; reported as a level, not a verdict)');
  if(over5)console.log(top(oEx,8));
  console.log('\n=== 2. THE TRUNK FLOOR (D50) — zero trunk on the day ===');
  const hadT4=keys.filter(k=>C4[k].tIn>0), hadT5=keys.filter(k=>C5[k].tIn>0);
  console.log('cells with >=1 trunk item ENTERING the budget   V204='+hadT4.length+'   V205='+hadT5.length+'   of '+keys.length);
  const z4=hadT4.filter(k=>C4[k].tOut===0), z5=hadT5.filter(k=>C5[k].tOut===0);
  console.log('*** budget took the day to ZERO trunk          V204='+z4.length+' ('+pct(z4.length,hadT4.length)+')   V205='+z5.length+' ('+pct(z5.length,hadT5.length)+')   delta='+(z5.length-z4.length));
  if(z5.length){const m={};z5.forEach(k=>{const p=k.split('|');bump(m,p[3]+' / '+p[4]+' / '+p[0]+'  ci='+C5[k].ci+'  sub='+C5[k].cs);});
    console.log('  V205 zero-trunk cells by goal/injury/tier:');console.log(top(m,20));}
  if(z4.length){const m={};z4.forEach(k=>{const p=k.split('|');bump(m,p[3]+' / '+p[4]+' / '+p[0]+'  ci='+C4[k].ci+'  sub='+C4[k].cs);});
    console.log('  V204 zero-trunk cells by goal/injury/tier:');console.log(top(m,20));}
  const tl4=keys.reduce((s,k)=>s+(C4[k].tIn-C4[k].tOut),0), tl5=keys.reduce((s,k)=>s+(C5[k].tIn-C5[k].tOut),0);
  console.log('trunk ITEMS removed by the budget  V204='+tl4+'   V205='+tl5+'   delta='+(tl5-tl4>=0?'+':'')+(tl5-tl4));
  const t4=keys.reduce((s,k)=>s+C4[k].tOut,0), t5=keys.reduce((s,k)=>s+C5[k].tOut,0);
  console.log('trunk items SURVIVING the budget   V204='+t4+'   V205='+t5+'   delta='+(t5-t4>=0?'+':'')+(t5-t4));
  console.log('\n=== 3. legLoad cardio subtypes (the blank assignedType) ===');
  const l4=keys.filter(k=>C4[k].ll), l5=keys.filter(k=>C5[k].ll);
  console.log('legLoad cells V204='+l4.length+'  V205='+l5.length+'  of '+keys.length);
  const m4={},m5={}; l4.forEach(k=>bump(m4,C4[k].ct+' | '+C4[k].cs+'  ci='+C4[k].ci));
  l5.forEach(k=>bump(m5,C5[k].ct+' | '+C5[k].cs+'  ci='+C5[k].ci));
  console.log('  V204:');console.log(top(m4,14));console.log('  V205:');console.log(top(m5,14));
  const leg=k=>/leg/i.test(C5[k].ttl);
  const legs5=l5.filter(k=>/leg/i.test(C5[k].ttl)), legs4=l4.filter(k=>/leg/i.test(C4[k].ttl));
  console.log('  legLoad cells whose day TITLE matches /leg/i  V204='+legs4.length+'   V205='+legs5.length);
  const mm={}; legs5.forEach(k=>bump(mm,C5[k].ttl+'  <= '+C5[k].cs));
  console.log(top(mm,14));
  console.log('\nDONE');
}
