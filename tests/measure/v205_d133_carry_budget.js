// v205_d133_carry_budget — MEASURE (read-only). The two readers of _cardioInterference that
// the attribution pass never counted: the CARRY GATE (index.html:8884 legs-day
// 'Loaded carry finisher' via _carryHardCardio at :8883, and :9027 full-day 'Carry') and the
// SESSION BUDGET (capSessionBudget :9978, called :10375).
//
// INSTRUMENT. Two anchors, both asserted count==1 on BOTH artifacts:
//   A_PIPE  (:10352 week-assembly) split into p0 (buildSections raw — the carry gate's own
//           output, before any filter), p1 (injury), p2 (deload), p3 (capRegionalFatigue),
//           plus role / wantCarry / cardio triple / cardio.legLoad / _cardioInterference.
//   A_BUD   (:10375 the capSessionBudget call) split into a before/after snapshot.
//   Shipped day is read from prog.weeks afterwards. Neither artifact is written.
//
// ORACLE. Carry presence is NOT read back from _carryHardCardio. It is a hand retyping of the
// authoring contract in the comments at :8879-8884 and :9027 ("carries are cheap after an
// easy/recovery run, but not after threshold, interval or long work ... >=1.0 = hard or long
// session"; bodyweight tier carries no implements):
//     legs day  carry expected iff  wantCarry && !denseHyp && !(ci>=1.0 || isBW)
//     full day  carry expected iff  wantCarry && !denseHyp && !isBW && ci<1.0
// denseHyp is not visible to this instrument, so the oracle is applied ONE-SIDED: a carry
// PRESENT while ci>=1.0 is an oracle violation with no escape; a carry ABSENT is not scored.
// Budget trims are counted structurally (items in minus items out), never asked of the budget.
//
// LATTICE. Byte-identical to g199 / v205_d133_cap_attribution: 1,728 configs.
// usage: node tests/measure/v205_d133_carry_budget.js [shards]
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));
const ROOT=path.join(__dirname,'..','..');
const SCRATCH='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad';
const ARTS={v204:path.join(SCRATCH,'v204.html'), v205:path.join(ROOT,'index.html')};

// ── LATTICE (byte-identical to g199) ───────────────────────────────────────────────
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
const BW=new Set(['bodyweight','home_basic','minimal']);   // hand list; probed below against ex.carry

// ── INSTRUMENTATION ────────────────────────────────────────────────────────────────
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p0=buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext});",
"      var __p1=applyInjuryFilter(__p0,cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__M133)globalThis.__M133.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),role:String(role),",
"        want:(d===carryHost),",
"        ci:(function(){try{return _cardioInterference(cardio);}catch(e){return null;}})(),",
"        ct:cardio?String(cardio.type||''):'',cs:cardio?String(cardio.subtype||''):'',cd:cardio?String(cardio.detail||''):'',",
"        ll:!!(cardio&&cardio.legLoad),at:cardio?String(cardio.assignedType||''):'',",
"        p0:globalThis.__SNAP(__p0),p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const A_BUD="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });";
const A_BUD_R=[
"    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){",
"      var __bi=globalThis.__SNAP(_day.sections);",
"      _day.sections=capSessionBudget(_day.sections,_day.cardio);",
"      var __bo=globalThis.__SNAP(_day.sections);",
"      if(globalThis.__BUD)globalThis.__BUD.push({w:String(w),d:String(_d),bi:__bi,bo:__bo});",
"    } });"].join("\n");
const SNAP_FN="globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),n:it.map(function(i){return String((i&&i.name)||'');})};});};";
function instrument(art,tag){
  let RAW=fs.readFileSync(art,'utf8');
  [[A_PIPE,'A_PIPE'],[A_BUD,'A_BUD']].forEach(([a,nm])=>{
    const n=RAW.split(a).length-1;
    if(n!==1) throw new Error(nm+' count=='+n+' in '+art+' (need exactly 1) — MEASUREMENT FAILED');
  });
  RAW=RAW.replace(A_PIPE,A_PIPE_R).replace(A_BUD,A_BUD_R);
  const out=path.join(os.tmpdir(),'v205d133cb_'+tag+'_'+process.pid+'.html');
  fs.writeFileSync(out,RAW); return out;
}

const CARRY_LAB=new Set(['Loaded carry finisher','Carry']);
const nCarry=c=>(c||[]).filter(s=>CARRY_LAB.has(s.l)).length;
const items=c=>(c||[]).reduce((a,s)=>a+(s.n||[]).length,0);

function sweep(ver,mine){
  const f=instrument(ARTS[ver],ver);
  const IA=load(f);
  IA.eval(SNAP_FN+"globalThis.__M133=[];globalThis.__BUD=[];");
  const cells={}; let nCells=0, nBud=0;
  mine.forEach(L=>{
    IA.eval("globalThis.__M133.length=0;globalThis.__BUD.length=0;");
    const prog=IA.buildProgram(L.cfg);
    const REC=IA.eval('globalThis.__M133'), BUD=IA.eval('globalThis.__BUD');
    const ship={}; const W=prog.weeks||{};
    Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{
      const day=W[w][d];
      ship[w+'|'+d]=((day&&day.sections)||[]).map(s=>({l:String((s&&s.label)||''),n:((s&&s.items)||[]).map(i=>String((i&&i.name)||''))}));
    }));
    const budMap={}; BUD.forEach(b=>{ budMap[b.w+'|'+b.d]=b; nBud++; });
    REC.forEach(r=>{ nCells++;
      const dk=L.key+'|'+r.w+'|'+r.d, b=budMap[r.w+'|'+r.d];
      const sh=ship[r.w+'|'+r.d]||[];
      const c={dl:r.dl,role:r.role,want:!!r.want,ci:r.ci,card:r.ct+'|'+r.cs+'|'+r.cd,ll:!!r.ll,at:r.at,
        c0:nCarry(r.p0),c1:nCarry(r.p1),c2:nCarry(r.p2),c3:nCarry(r.p3),
        cShip:nCarry(sh),
        i3:items(r.p3), bIn:b?items(b.bi):null, bOut:b?items(b.bo):null,
        secIn:b?(b.bi||[]).map(s=>s.l):null, secOut:b?(b.bo||[]).map(s=>s.l):null,
        lossBySec:null, gone:null, shipLab:sh.map(s=>s.l).join(' | ')};
      if(b){
        const inM={}, outM={};
        (b.bi||[]).forEach(s=>{inM[s.l]=(inM[s.l]||0)+(s.n||[]).length;});
        (b.bo||[]).forEach(s=>{outM[s.l]=(outM[s.l]||0)+(s.n||[]).length;});
        const loss={}, gone=[];
        Object.keys(inM).forEach(l=>{ const dn=inM[l]-(outM[l]||0); if(dn>0) loss[l]=dn;
          if(!(l in outM)) gone.push(l); });
        c.lossBySec=loss; c.gone=gone;
      }
      cells[dk]=c;
    });
  });
  try{fs.unlinkSync(f);}catch(e){}
  return {cells,nCells,nBud};
}

if(process.env.M133SHARD!==undefined){
  const si=+process.env.M133SHARD, sn=+process.env.M133SHARDS;
  const mine=LAT.filter((_,i)=>i%sn===si);
  const out={}; ['v204','v205'].forEach(v=>{ out[v]=sweep(v,mine); });
  fs.writeFileSync(process.env.M133OUT,JSON.stringify(out)); process.exit(0);
}
const SH=+(process.argv[2]||8); const outs=[], kids=[];
for(let i=0;i<SH;i++){ const o=path.join(os.tmpdir(),'m133cb_'+i+'_'+process.pid+'.json'); outs.push(o);
  try{fs.unlinkSync(o);}catch(e){}
  kids.push(new Promise((res,rej)=>{ const k=fork(__filename,[],{env:Object.assign({},process.env,
    {M133SHARD:String(i),M133SHARDS:String(SH),M133OUT:o}),stdio:'inherit'});
    k.on('exit',c=>c===0?res():rej(new Error('shard '+i+' exit '+c))); })); }
Promise.all(kids).then(()=>{
  const A={v204:{cells:{},nCells:0,nBud:0},v205:{cells:{},nCells:0,nBud:0}};
  outs.forEach(o=>{ const j=JSON.parse(fs.readFileSync(o,'utf8'));
    ['v204','v205'].forEach(v=>{ Object.assign(A[v].cells,j[v].cells); A[v].nCells+=j[v].nCells; A[v].nBud+=j[v].nBud; });
    try{fs.unlinkSync(o);}catch(e){} });
  report(A);
}).catch(e=>{ console.error('MEASUREMENT FAILED:',e.message); process.exit(1); });

function pct(n,d){return d?((100*n/d).toFixed(2)+'%'):'n/a';}
function top(m,n){return Object.keys(m).sort((a,b)=>m[b]-m[a]).slice(0,n).map(k=>'    '+String(m[k]).padStart(7)+'  '+k).join('\n')||'    (none)';}
function bump(o,k,v){o[k]=(o[k]||0)+(v===undefined?1:v);}
function seg(k){const p=k.split('|');return {tier:p[0],focus:p[1],exp:p[2],goal:p[3],inj:p[4],rest:p[5],seed:p[6],w:p[7],d:p[8]};}

function report(A){
  const C4=A.v204.cells, C5=A.v205.cells;
  const keys=Object.keys(C5), both=keys.filter(k=>C4[k]);
  console.log('=== 0. DENOMINATORS ===');
  console.log('lattice configs                 : '+LAT.length);
  console.log('day cells recorded  V204/V205   : '+A.v204.nCells+' / '+A.v205.nCells);
  console.log('budget calls seen   V204/V205   : '+A.v204.nBud+' / '+A.v205.nBud);
  console.log('keyed cells         V204/V205   : '+Object.keys(C4).length+' / '+keys.length+'   present in BOTH: '+both.length);
  console.log('cells only in V204 / only V205  : '+(Object.keys(C4).length-both.length)+' / '+(keys.length-both.length));

  // ── 1. CARRY GATE ────────────────────────────────────────────────────────────────
  console.log('\n=== 1. CARRY GATE (index.html:8883/:8884 legs, :9027 full) ===');
  const want4=both.filter(k=>C4[k].want).length, want5=both.filter(k=>C5[k].want).length;
  console.log('carry-ELIGIBLE cells (wantCarry=true)  V204='+want4+'  V205='+want5+'  of '+both.length);
  ['c0','c1','c2','c3','cShip'].forEach(st=>{
    const a=both.reduce((s,k)=>s+C4[k][st],0), b=both.reduce((s,k)=>s+C5[k][st],0);
    console.log('  carry sections at '+st.padEnd(6)+' V204='+String(a).padStart(6)+'  V205='+String(b).padStart(6)+'  delta='+(b-a>=0?'+':'')+(b-a));
  });
  const gate4=both.filter(k=>C4[k].c0>0), gate5=both.filter(k=>C5[k].c0>0);
  console.log('cells with a carry AT THE GATE (p0)    V204='+gate4.length+'  V205='+gate5.length+'  delta='+(gate5.length-gate4.length));
  const G4=new Set(gate4.map(String)), G5=new Set(gate5);
  const lost=gate4.filter(k=>C5[k].c0===0), gained=gate5.filter(k=>C4[k].c0===0);
  console.log('  carry LOST  (204 had, 205 none) : '+lost.length);
  console.log('  carry GAINED(204 none, 205 had) : '+gained.length);
  const ship4=both.filter(k=>C4[k].cShip>0), ship5=both.filter(k=>C5[k].cShip>0);
  console.log('cells with a carry ON THE CARD         V204='+ship4.length+'  V205='+ship5.length+'  delta='+(ship5.length-ship4.length));
  const shLost=ship4.filter(k=>C5[k].cShip===0), shGain=ship5.filter(k=>C4[k].cShip===0);
  console.log('  shipped carry LOST  : '+shLost.length+'     GAINED : '+shGain.length);
  ['goal','inj','role','tier','focus','exp'].forEach(dim=>{
    const m={}; lost.forEach(k=>bump(m,'LOST  '+(dim==='role'?C4[k].role:seg(k)[dim])));
    gained.forEach(k=>bump(m,'GAIN  '+(dim==='role'?C5[k].role:seg(k)[dim])));
    console.log('  by '+dim+':'); console.log(top(m,14));
  });
  {const m={}; lost.forEach(k=>bump(m,'LOST  ci '+C4[k].ci+' -> '+C5[k].ci));
   gained.forEach(k=>bump(m,'GAIN  ci '+C4[k].ci+' -> '+C5[k].ci));
   console.log('  by interference transition:'); console.log(top(m,20));}
  // ORACLE: one-sided. A carry present while ci>=1.0 violates the authoring contract.
  let viol4=0,viol5=0; const vEx={};
  both.forEach(k=>{ if(C4[k].c0>0 && C4[k].ci!=null && C4[k].ci>=1.0) viol4++;
    if(C5[k].c0>0 && C5[k].ci!=null && C5[k].ci>=1.0){viol5++; bump(vEx,C5[k].role+'  ci='+C5[k].ci+'  '+C5[k].card);} });
  console.log('  ORACLE (hand contract, one-sided): carry present while ci>=1.0');
  console.log('    V204 violations = '+viol4+' / '+gate4.length+'    V205 violations = '+viol5+' / '+gate5.length);
  if(viol5) console.log(top(vEx,10));

  // ── 2. SESSION BUDGET ────────────────────────────────────────────────────────────
  console.log('\n=== 2. SESSION BUDGET (capSessionBudget :9978, call :10375) ===');
  const bc=both.filter(k=>C4[k].bIn!=null&&C5[k].bIn!=null);
  console.log('cells with a budget call on both       : '+bc.length+' of '+both.length);
  const eng4=bc.filter(k=>C4[k].bIn>C4[k].bOut), eng5=bc.filter(k=>C5[k].bIn>C5[k].bOut);
  const t4=bc.reduce((s,k)=>s+(C4[k].bIn-C4[k].bOut),0), t5=bc.reduce((s,k)=>s+(C5[k].bIn-C5[k].bOut),0);
  console.log('cells where the budget TRIMMED >=1 item  V204='+eng4.length+'  ('+pct(eng4.length,bc.length)+')   V205='+eng5.length+'  ('+pct(eng5.length,bc.length)+')   delta='+(eng5.length-eng4.length));
  console.log('total items trimmed                      V204='+t4+'   V205='+t5+'   delta='+(t5-t4>=0?'+':'')+(t5-t4));
  const newTrim=bc.filter(k=>C4[k].bIn<=C4[k].bOut&&C5[k].bIn>C5[k].bOut);
  const noTrim =bc.filter(k=>C4[k].bIn>C4[k].bOut&&C5[k].bIn<=C5[k].bOut);
  console.log('  untrimmed@204 -> trimmed@205 : '+newTrim.length+'      trimmed@204 -> untrimmed@205 : '+noTrim.length);
  ['goal','inj','tier','focus','exp'].forEach(dim=>{
    const m={}; newTrim.forEach(k=>bump(m,'NEWTRIM '+seg(k)[dim])); noTrim.forEach(k=>bump(m,'UNTRIM  '+seg(k)[dim]));
    console.log('  by '+dim+':'); console.log(top(m,14)); });
  {const m={}; newTrim.forEach(k=>bump(m,'NEWTRIM '+C4[k].role+'  ci '+C4[k].ci+' -> '+C5[k].ci));
   noTrim.forEach(k=>bump(m,'UNTRIM  '+C4[k].role+'  ci '+C4[k].ci+' -> '+C5[k].ci));
   console.log('  by role + interference transition:'); console.log(top(m,24));}
  const L4={},L5={}; bc.forEach(k=>{ Object.keys(C4[k].lossBySec||{}).forEach(l=>bump(L4,l,C4[k].lossBySec[l]));
    Object.keys(C5[k].lossBySec||{}).forEach(l=>bump(L5,l,C5[k].lossBySec[l])); });
  console.log('  items lost BY SECTION LABEL, V204:'); console.log(top(L4,20));
  console.log('  items lost BY SECTION LABEL, V205:'); console.log(top(L5,20));
  const D={}; new Set(Object.keys(L4).concat(Object.keys(L5))).forEach(l=>{const d=(L5[l]||0)-(L4[l]||0); if(d) D[l]=d;});
  console.log('  DELTA in items lost per section (V205 minus V204), nonzero only:');
  console.log(Object.keys(D).sort((a,b)=>Math.abs(D[b])-Math.abs(D[a])).slice(0,25).map(l=>'    '+String(D[l]>0?'+'+D[l]:D[l]).padStart(7)+'  '+l).join('\n')||'    (none)');
  // SECTION DISAPPEARANCE — the shape that produced the first red
  const g4=bc.filter(k=>(C4[k].gone||[]).length), g5=bc.filter(k=>(C5[k].gone||[]).length);
  const gt4=bc.reduce((s,k)=>s+(C4[k].gone||[]).length,0), gt5=bc.reduce((s,k)=>s+(C5[k].gone||[]).length,0);
  console.log('  CELLS where the budget deleted a WHOLE section  V204='+g4.length+'  V205='+g5.length+'  delta='+(g5.length-g4.length));
  console.log('  SECTIONS deleted outright                        V204='+gt4+'  V205='+gt5+'  delta='+(gt5-gt4>=0?'+':'')+(gt5-gt4));
  const GS4={},GS5={}; bc.forEach(k=>{(C4[k].gone||[]).forEach(l=>bump(GS4,l));(C5[k].gone||[]).forEach(l=>bump(GS5,l));});
  console.log('  sections deleted outright, V204:'); console.log(top(GS4,20));
  console.log('  sections deleted outright, V205:'); console.log(top(GS5,20));
  const GD={}; new Set(Object.keys(GS4).concat(Object.keys(GS5))).forEach(l=>{const d=(GS5[l]||0)-(GS4[l]||0); if(d)GD[l]=d;});
  console.log('  DELTA in outright deletions per section (V205-V204):');
  console.log(Object.keys(GD).sort((a,b)=>Math.abs(GD[b])-Math.abs(GD[a])).slice(0,25).map(l=>'    '+String(GD[l]>0?'+'+GD[l]:GD[l]).padStart(7)+'  '+l).join('\n')||'    (none)');
  {const m={}; bc.forEach(k=>{const a=(C4[k].gone||[]).length,b=(C5[k].gone||[]).length; if(b>a) bump(m,'MORE-DELETED '+seg(k).goal+' / '+C5[k].role+' / ci '+C4[k].ci+'->'+C5[k].ci); else if(b<a) bump(m,'FEWER-DELETED '+seg(k).goal+' / '+C5[k].role+' / ci '+C4[k].ci+'->'+C5[k].ci);});
   console.log('  section-deletion movement by goal/role/ci transition:'); console.log(top(m,24));}

  // ── 3. CROSS: the four dominant interference transitions ─────────────────────────
  console.log('\n=== 3. CROSS — carry gate and budget response per interference transition ===');
  const TR={}; both.forEach(k=>{ const a=C4[k].ci,b=C5[k].ci; if(a==null||b==null||a===b) return;
    const t=a.toFixed(2)+' -> '+b.toFixed(2); TR[t]=TR[t]||[]; TR[t].push(k); });
  const moved=both.filter(k=>C4[k].ci!=null&&C5[k].ci!=null&&C4[k].ci!==C5[k].ci);
  console.log('cells whose interference MOVED V204->V205: '+moved.length+' of '+both.length+'  ('+pct(moved.length,both.length)+')');
  console.log('\n  transition            n    dir    carryGate(204->205)  carryShip  budgetTrimCells  itemsTrimmed  secsDeleted   VERDICT');
  Object.keys(TR).sort((a,b)=>TR[b].length-TR[a].length).slice(0,12).forEach(t=>{
    const ks=TR[t], up=parseFloat(t.split(' -> ')[1])>parseFloat(t.split(' -> ')[0]);
    const cg4=ks.filter(k=>C4[k].c0>0).length, cg5=ks.filter(k=>C5[k].c0>0).length;
    const cs4=ks.filter(k=>C4[k].cShip>0).length, cs5=ks.filter(k=>C5[k].cShip>0).length;
    const bk=ks.filter(k=>C4[k].bIn!=null&&C5[k].bIn!=null);
    const be4=bk.filter(k=>C4[k].bIn>C4[k].bOut).length, be5=bk.filter(k=>C5[k].bIn>C5[k].bOut).length;
    const bi4=bk.reduce((s,k)=>s+(C4[k].bIn-C4[k].bOut),0), bi5=bk.reduce((s,k)=>s+(C5[k].bIn-C5[k].bOut),0);
    const sd4=bk.reduce((s,k)=>s+(C4[k].gone||[]).length,0), sd5=bk.reduce((s,k)=>s+(C5[k].gone||[]).length,0);
    // EXPECTATION from the hand contract, not from the readers: interference UP => carries no
    // more available and budget no looser; interference DOWN => the mirror.
    const carryOK = up ? (cg5<=cg4) : (cg5>=cg4);
    const budOK   = up ? (bi5>=bi4) : (bi5<=bi4);
    console.log('  '+t.padEnd(18)+String(ks.length).padStart(6)+'  '+(up?'UP  ':'DOWN')
      +'   '+String(cg4+'->'+cg5).padStart(14)+'  '+String(cs4+'->'+cs5).padStart(10)
      +'  '+String(be4+'->'+be5).padStart(14)+'  '+String(bi4+'->'+bi5).padStart(12)
      +'  '+String(sd4+'->'+sd5).padStart(11)+'   carry '+(carryOK?'CONFIRMS':'REFUTES ')+' / budget '+(budOK?'CONFIRMS':'REFUTES'));
  });

  // ── 4. legLoad cardio on a legs-role day ─────────────────────────────────────────
  console.log('\n=== 4. legLoad:true cardio ON a legs-role day (UNKNOWN 3, printed not ruled) ===');
  const legs4=both.filter(k=>C4[k].role==='legs'), legs5=both.filter(k=>C5[k].role==='legs');
  console.log('legs-role day cells        V204='+legs4.length+'  V205='+legs5.length+'  of '+both.length);
  const ll4=legs4.filter(k=>C4[k].ll), ll5=legs5.filter(k=>C5[k].ll);
  console.log('legs-role AND legLoad cardio V204='+ll4.length+' ('+pct(ll4.length,legs4.length)+')   V205='+ll5.length+' ('+pct(ll5.length,legs5.length)+')   delta='+(ll5.length-ll4.length));
  const newLL=both.filter(k=>C5[k].role==='legs'&&C5[k].ll&&!(C4[k].role==='legs'&&C4[k].ll));
  const goneLL=both.filter(k=>C4[k].role==='legs'&&C4[k].ll&&!(C5[k].role==='legs'&&C5[k].ll));
  console.log('  NEW at V205 : '+newLL.length+'      GONE at V205 : '+goneLL.length);
  ['goal','tier','focus','exp','inj','rest','seed','w','d'].forEach(dim=>{
    const m={}; newLL.forEach(k=>bump(m,'NEW  '+seg(k)[dim])); goneLL.forEach(k=>bump(m,'GONE '+seg(k)[dim]));
    console.log('  by '+dim+':'); console.log(top(m,16)); });
  {const m={}; newLL.forEach(k=>bump(m,'NEW  at='+C5[k].at+'  ci '+C4[k].ci+'->'+C5[k].ci+'  (204 role '+C4[k].role+', 204 ll '+C4[k].ll+')'));
   goneLL.forEach(k=>bump(m,'GONE at='+C4[k].at+'  ci '+C4[k].ci+'->'+C5[k].ci+'  (205 role '+C5[k].role+', 205 ll '+C5[k].ll+')'));
   console.log('  by assignedType + ci transition:'); console.log(top(m,24));}
  {const m={}; ll5.forEach(k=>bump(m,C5[k].at||'(blank)')); console.log('  V205 legs+legLoad population by assignedType:'); console.log(top(m,12));}
  {const m={}; ll4.forEach(k=>bump(m,C4[k].at||'(blank)')); console.log('  V204 legs+legLoad population by assignedType:'); console.log(top(m,12));}
  // what those cells then do at the carry gate and the budget
  const cw=(set,C)=>set.filter(k=>C[k].c0>0).length;
  console.log('  carry present at the gate on legs+legLoad cells  V204='+cw(ll4,C4)+'/'+ll4.length+'   V205='+cw(ll5,C5)+'/'+ll5.length);
  const bt=(set,C)=>set.filter(k=>C[k].bIn!=null&&C[k].bIn>C[k].bOut).length;
  console.log('  budget trims on legs+legLoad cells               V204='+bt(ll4,C4)+'/'+ll4.length+'   V205='+bt(ll5,C5)+'/'+ll5.length);
  console.log('\nDONE');
}
