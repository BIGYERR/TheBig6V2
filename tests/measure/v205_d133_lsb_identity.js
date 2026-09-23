// v205_d133_lsb_identity — MEASURE (read-only). Correction pass on v205_d133_cap_attribution.js.
//
// WHY A SECOND PASS. Pass 1 classified an I3 "survivor" as `killed at V204 and not in the
// killed-set at V205`. That set also contains cells where Leg superset B was never OFFERED to
// the cap at V205 — a different event. Pass 1 also showed the day ROLE moves between versions
// on most of those cells, so `config|week|day` is not a stable identity for "the same training
// day". This pass classifies four ways on the intersection, and segments by role stability.
//
// Same anchor, same lattice, same hand oracle as pass 1. Neither artifact is written.
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));
const ROOT=path.join(__dirname,'..','..');
const SCRATCH='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad';
const ARTS={v204:path.join(SCRATCH,'v204.html'), v205:path.join(ROOT,'index.html')};
const E_PAT=[['calf_iso',/calf|calves|plantarflex/i],
  ['hip_ext',/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',/leg curl|leg extension|hamstring curl/i],
  ['hinge',/deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i]];
const ePat=n=>{const t=String(n||'');for(const [p,r] of E_PAT) if(r.test(t)) return p; return null;};
const isPost=n=>{const p=ePat(n);return p==='hinge'||p==='hip_ext';};
const hasLab=(c,lb)=>(c||[]).some(s=>s.l===lb);
const cardPost=c=>(c||[]).reduce((a,s)=>a+(s.n||[]).reduce((b,n)=>b+(isPost(n)?1:0),0),0);
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
    LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,cfg:c}); }
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__G199)globalThis.__G199.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),role:String(role),",
"        ci:(function(){try{return _cardioInterference(cardio);}catch(e){return null;}})(),",
"        ct:cardio?String(cardio.type||''):'',cs:cardio?String(cardio.subtype||''):'',",
"        p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const SNAP_FN="globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),n:it.map(function(i){return String((i&&i.name)||'');}),"
 +"dt:it.map(function(i){return String((i&&i.detail)||'');})};});};";
function instrument(art,tag){
  const RAW=fs.readFileSync(art,'utf8'); const n=RAW.split(A_PIPE).length-1;
  if(n!==1) throw new Error('ANCHOR count=='+n+' in '+art+' — MEASUREMENT FAILED');
  const out=path.join(os.tmpdir(),'v205d133b_'+tag+'.html'); fs.writeFileSync(out,RAW.replace(A_PIPE,A_PIPE_R)); return out; }
function sets(det){const m=String(det||'').match(/(\d+)\s*[x×]/);return m?+m[1]:0;}
function sweep(ver,mine){
  const f=instrument(ARTS[ver],ver+'_'+process.pid); const IA=load(f);
  IA.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;");
  const cells={};
  mine.forEach(L=>{
    IA.eval("globalThis.__G199.length=0;globalThis.__DELOAD_OFF=false;");
    IA.buildProgram(L.cfg);
    IA.eval('globalThis.__G199').forEach(r=>{
      const legSets=(list)=>(list||[]).reduce((a,s)=>a+(s.dt||[]).reduce((b,d)=>b+sets(d),0),0);
      cells[L.key+'|'+r.w+'|'+r.d]={role:r.role,ci:r.ci,dl:!!r.dl,sub:r.cs,typ:r.ct,
        lsbIn:hasLab(r.p2,'Leg superset B'),lsbOut:hasLab(r.p3,'Leg superset B'),
        n2:(r.p2||[]).length,n3:(r.p3||[]).length,s2:legSets(r.p2),s3:legSets(r.p3),
        a2:cardPost(r.p2),a3:cardPost(r.p3),
        p2:(r.p2||[]).map(s=>s.l).join(' | '),p3:(r.p3||[]).map(s=>s.l).join(' | ')};
    });
  });
  try{fs.unlinkSync(f);}catch(e){}
  return cells;
}
if(process.env.M133BSHARD!==undefined){
  const si=+process.env.M133BSHARD, sn=+process.env.M133BSHARDS;
  const mine=LAT.filter((_,i)=>i%sn===si);
  fs.writeFileSync(process.env.M133BOUT,JSON.stringify({v204:sweep('v204',mine),v205:sweep('v205',mine)}));
  process.exit(0);
}
const SH=+(process.argv[2]||8), outs=[], kids=[];
for(let i=0;i<SH;i++){ const o=path.join(os.tmpdir(),'m133b_'+i+'_'+process.pid+'.json'); outs.push(o);
  try{fs.unlinkSync(o);}catch(e){}
  kids.push(new Promise((res,rej)=>{ const k=fork(__filename,[],{env:Object.assign({},process.env,
    {M133BSHARD:String(i),M133BSHARDS:String(SH),M133BOUT:o}),stdio:'inherit'});
    k.on('exit',c=>c===0?res():rej(new Error('shard '+i+' exit '+c))); })); }
Promise.all(kids).then(()=>{
  const C4={},C5={};
  outs.forEach(o=>{const j=JSON.parse(fs.readFileSync(o,'utf8'));Object.assign(C4,j.v204);Object.assign(C5,j.v205);try{fs.unlinkSync(o);}catch(e){}});
  const bump=(m,k)=>{m[k]=(m[k]||0)+1;};
  const top=(m,n)=>Object.keys(m).sort((a,b)=>m[b]-m[a]).slice(0,n).map(k=>'    '+String(m[k]).padStart(5)+'  '+k).join('\n');
  const K=Object.keys(C5);
  console.log('cells  V204='+Object.keys(C4).length+'  V205='+K.length);
  const in4=K.filter(k=>C4[k]&&C4[k].lsbIn), in5=K.filter(k=>C5[k].lsbIn);
  const S4=new Set(in4), S5=new Set(in5);
  const both=in4.filter(k=>S5.has(k)), only4=in4.filter(k=>!S5.has(k)), only5=in5.filter(k=>!S4.has(k));
  console.log('\n=== A. LSB OFFERED TO THE CAP (p2 carries the label) ===');
  console.log('V204='+in4.length+'  V205='+in5.length+'  both='+both.length+'  only@204='+only4.length+'  only@205='+only5.length);
  console.log('\n=== B. FOUR-WAY on the '+both.length+' cells offered in BOTH versions ===');
  const kk=both.filter(k=>!C4[k].lsbOut&&!C5[k].lsbOut), ks=both.filter(k=>!C4[k].lsbOut&&C5[k].lsbOut),
        sk=both.filter(k=>C4[k].lsbOut&&!C5[k].lsbOut), ss=both.filter(k=>C4[k].lsbOut&&C5[k].lsbOut);
  console.log('killed@204 killed@205 : '+kk.length);
  console.log('killed@204 SURVIVES@205: '+ks.length+'   <= the genuine "cap trims less" population');
  console.log('survives@204 KILLED@205: '+sk.length);
  console.log('survives@204 survives  : '+ss.length);
  console.log('killed only@204-offered cells: '+only4.filter(k=>!C4[k].lsbOut).length+' of '+only4.length);
  console.log('killed only@205-offered cells: '+only5.filter(k=>!C5[k].lsbOut).length+' of '+only5.length);
  console.log('\n  I3 reconciliation: killed@204 = '+in4.filter(k=>!C4[k].lsbOut).length
    +'  killed@205 = '+in5.filter(k=>!C5[k].lsbOut).length);
  const rs=(k)=>C4[k].role===C5[k].role?'ROLE-SAME':'role '+C4[k].role+'->'+C5[k].role;
  const cs=(k)=>C4[k].ci===C5[k].ci?'ci-equal':(C5[k].ci<C4[k].ci?'ci-LOWER':'ci-HIGHER');
  [['ks',ks],['sk',sk]].forEach(([nm,arr])=>{
    console.log('\n--- '+nm+' ('+arr.length+') by role stability x interference direction ---');
    const m={}; arr.forEach(k=>bump(m,rs(k)+'  /  '+cs(k))); console.log(top(m,20));
    const seg={}; arr.forEach(k=>{const p=k.split('|');bump(seg,p[0]+' / '+p[3]+' / '+p[2]+' / '+p[1]+' / '+p[4]);});
    console.log('  segment:'); console.log(top(seg,20));
    const sub={}; arr.forEach(k=>bump(sub,'204 '+(C4[k].sub||'(no cardio)')+'  ->  205 '+(C5[k].sub||'(no cardio)')+'   ci '+C4[k].ci+'->'+C5[k].ci));
    console.log('  session subtype transition:'); console.log(top(sub,20));
  });
  console.log('\n=== C. COACH BLOCKING CONDITION, restricted to ROLE-STABLE cells offered in both ===');
  const ksRole=ks.filter(k=>C4[k].role===C5[k].role);
  let lo=0,eq=0,hi=0; const off=[];
  ksRole.forEach(k=>{ if(C5[k].ci<C4[k].ci) lo++; else if(C5[k].ci===C4[k].ci){eq++;off.push(k+'  EQUAL ci='+C5[k].ci);} else {hi++;off.push(k+'  HIGHER ci '+C4[k].ci+'->'+C5[k].ci);} });
  console.log('role-stable killed->survives cells: '+ksRole.length+' of '+ks.length);
  console.log('  strictly LOWER interference : '+lo);
  console.log('  EQUAL interference          : '+eq);
  console.log('  HIGHER interference         : '+hi);
  if(off.length){ console.log('  OFFENDERS (first 40):'); off.slice(0,40).forEach(o=>console.log('    '+o));
    const m={}; off.forEach(o=>{const k=o.split('  ')[0];bump(m,C4[k].role+'  '+C4[k].sub+'->'+C5[k].sub+'  ci '+C4[k].ci+'->'+C5[k].ci+'  legsets p2 '+C4[k].s2+'->'+C5[k].s2);});
    console.log('  offenders grouped:'); console.log(top(m,20)); }
  console.log('\n=== D. ROLE CHURN, whole lattice ===');
  let same=0,moved=0; const mv={};
  K.forEach(k=>{ if(!C4[k])return; if(C4[k].role===C5[k].role) same++; else {moved++; const p=k.split('|'); bump(mv,p[3]+'  '+C4[k].role+'->'+C5[k].role);} });
  console.log('role identical '+same+'  role moved '+moved+'  / '+K.length);
  console.log(top(mv,20));
  console.log('\n=== E. DID THE CAP ITSELF CHANGE BEHAVIOUR? same role, same ci, same p2 label list ===');
  const matched=both.filter(k=>C4[k].role===C5[k].role&&C4[k].ci===C5[k].ci&&C4[k].p2===C5[k].p2&&C4[k].s2===C5[k].s2);
  const diffOut=matched.filter(k=>C4[k].lsbOut!==C5[k].lsbOut);
  const diffP3=matched.filter(k=>C4[k].p3!==C5[k].p3);
  console.log('cells with identical cap INPUT (role, interference, p2 labels, p2 leg sets): '+matched.length+' of '+both.length);
  console.log('  of those, LSB verdict differs: '+diffOut.length+'   any p3 label-list differs: '+diffP3.length);
  if(diffP3.length){ const m={}; diffP3.slice(0,2000).forEach(k=>bump(m,C4[k].p3+'  =>  '+C5[k].p3)); console.log(top(m,15)); }
  console.log('\nINTERPRETATION GUARD: E is the only cut where capRegionalFatigue is asked the same');
  console.log('question twice. A zero there means the cap did not change; every I3 move is an INPUT move.');
}).catch(e=>{ console.error('MEASUREMENT FAILED:',e.message); process.exit(1); });
