// v205_d133_cap_attribution — MEASURE (read-only). Why g199's five literals moved V204 -> V205.
//
// INSTRUMENT. The SAME week-assembly anchor g199 uses (A_PIPE), so p1/p2/p3 are visible, plus
// two extra fields per day cell that g199 never recorded: the day's cardio triple
// (type|subtype|detail) and _cardioInterference(cardio) evaluated ON THAT ARTIFACT. Both
// artifacts (V204 baseline, V205 candidate) are instrumented into tmp copies; neither is written.
//
// ORACLE. "Posterior" is g199's hand table E_PAT, retyped here, never the engine's _isPostChain.
// Interference is reported two ways: (a) the engine's own value on each artifact -- which is the
// quantity coach's blocking condition is stated in ("strictly lower than V204's"), a cross-VERSION
// comparison, so neither side is the suspect answering for the other; and (b) HCI, a hand
// re-typing of the documented contract at index.html:9082-9088 (modality base x intensity token
// tier + distance bump), used only as a blindness probe on (a).
//
// usage: node tests/measure/v205_d133_cap_attribution.js [shards]
const path=require('path'), fs=require('fs'), os=require('os'), crypto=require('crypto');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));
const ROOT=path.join(__dirname,'..','..');
const SCRATCH='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad';
const ARTS={v204:path.join(SCRATCH,'v204.html'), v205:path.join(ROOT,'index.html')};

// ── HAND ORACLE (retyped from g199) ────────────────────────────────────────────────
const E_PAT=[['calf_iso',/calf|calves|plantarflex/i],
  ['hip_ext',/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',/leg curl|leg extension|hamstring curl/i],
  ['hinge',/deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i]];
const ePat=n=>{const t=String(n||'');for(const [p,r] of E_PAT) if(r.test(t)) return p; return null;};
const isPost=n=>{const p=ePat(n);return p==='hinge'||p==='hip_ext';};
const cardPost=c=>(c||[]).reduce((a,s)=>a+(s.n||[]).reduce((b,n)=>b+(isPost(n)?1:0),0),0);
const hasLab=(c,lb)=>(c||[]).some(s=>s.l===lb);
const sha=s=>crypto.createHash('sha1').update(s).digest('hex');

// HCI — hand re-typing of the documented contract (blindness probe on the engine value)
function HCI(type,sub,det){
  if(!type) return 0;
  sub=String(sub||'').toLowerCase(); const s=(sub+' '+String(det||'')).toLowerCase();
  const base = type==='run'?1.0 : type==='bike'?0.5 : 0.15;
  const sc=t=>{ if(/interval|\bint\b|speed run|sprint|stride|zone 5|400m|800m|max effort|rpe 9/.test(t))return 1.4;
    if(/tempo pace|threshold|\bchi\b|fartlek|\bhills?\b|zone 3|zone 4|rpe 8/.test(t))return 1.05;
    if(/recovery|active recovery|zone 1|shakeout|very easy|\beasy\b/.test(t))return 0.55;
    if(/long run|peak|long slow|\blsd\b|steady|zone 2/.test(t))return 0.85; return null; };
  let i=sc(sub); if(i==null)i=sc(s); if(i==null)i=0.75;
  const mi=parseFloat((s.match(/([\d.]+)\s*(?:mi\b|mile)/)||[])[1])||0;
  const mn=parseFloat((s.match(/([\d.]+)[\s-]*min/)||[])[1])||0;
  const d = mi>3?Math.min(0.5,(mi-3)*0.08) : mn>45?Math.min(0.5,(mn-45)*0.01) : 0;
  return +(base*i+d).toFixed(2);
}

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

// ── INSTRUMENTATION ────────────────────────────────────────────────────────────────
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__G199)globalThis.__G199.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),role:String(role),",
"        ci:(function(){try{return _cardioInterference(cardio);}catch(e){return null;}})(),",
"        ct:cardio?String(cardio.type||''):'',cs:cardio?String(cardio.subtype||''):'',cd:cardio?String(cardio.detail||''):'',",
"        hot:!!hotNext,p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const SNAP_FN="globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),n:it.map(function(i){return String((i&&i.name)||'');})};});};";
function instrument(art,tag){
  const RAW=fs.readFileSync(art,'utf8');
  const n=RAW.split(A_PIPE).length-1;
  if(n!==1) throw new Error('ANCHOR count=='+n+' in '+art+' (need exactly 1) — MEASUREMENT FAILED');
  const out=path.join(os.tmpdir(),'v205d133_'+tag+'_'+process.pid+'.html');
  fs.writeFileSync(out,RAW.replace(A_PIPE,A_PIPE_R));
  return out;
}

// ── SWEEP one artifact over a shard of the lattice ─────────────────────────────────
function sweep(ver,mine){
  const f=instrument(ARTS[ver],ver+'_'+process.pid);
  const IA=load(f);
  IA.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;");
  const cells={};   // key cfg|w|d  -> lsb/interference/cardio/post facts (ON arm)
  const weeks={};   // key cfg|w    -> {dl, shipOn, shipOff, shaOn, shaOff}
  const dayOn={};   // key cfg|w|d  -> sha of shipped day (ON arm), for D2 attribution
  const dayOff={};
  let nCells=0;
  mine.forEach(L=>{
    ['on','off'].forEach(m=>{
      IA.eval("globalThis.__G199.length=0;globalThis.__DELOAD_OFF="+(m==='off')+";");
      const prog=IA.buildProgram(L.cfg);
      const REC=IA.eval('globalThis.__G199');
      const W=prog.weeks||{};
      Object.keys(W).forEach(w=>{ let tot=0;
        Object.keys(W[w]).forEach(d=>{ const day=W[w][d]; let n=0;
          ((day&&day.sections)||[]).forEach(sec=>((sec&&sec.items)||[]).forEach(it=>{ if(isPost(it&&it.name)) n++; }));
          tot+=n;
          const dk=L.key+'|'+w+'|'+d;
          (m==='on'?dayOn:dayOff)[dk]=sha(JSON.stringify(day));
          if(m==='on'){ cells[dk]=cells[dk]||{}; cells[dk].shipPost=n;
            cells[dk].shipLab=((day&&day.sections)||[]).map(s=>String((s&&s.label)||'')).join(' | '); }
        });
        const wk=L.key+'|'+w; weeks[wk]=weeks[wk]||{};
        weeks[wk][m==='on'?'shipOn':'shipOff']=tot;
        weeks[wk][m==='on'?'shaOn':'shaOff']=sha(JSON.stringify(W[w]));
      });
      if(m!=='on') return;
      REC.forEach(r=>{ nCells++;
        const dk=L.key+'|'+r.w+'|'+r.d, wk=L.key+'|'+r.w;
        weeks[wk]=weeks[wk]||{}; weeks[wk].dl=!!r.dl;
        const c=cells[dk]=cells[dk]||{};
        c.dl=!!r.dl; c.role=r.role; c.ci=r.ci; c.card=r.ct+'|'+r.cs+'|'+r.cd; c.hot=!!r.hot;
        c.hci=HCI(r.ct,r.cs,r.cd);
        c.lsbIn=hasLab(r.p2,'Leg superset B'); c.lsbOut=hasLab(r.p3,'Leg superset B');
        c.a1=cardPost(r.p1); c.a2=cardPost(r.p2); c.a3=cardPost(r.p3);
        c.p2lab=(r.p2||[]).map(s=>s.l).join(' | ');
        c.p3lab=(r.p3||[]).map(s=>s.l).join(' | ');
        c.lsbItems=((r.p2||[]).find(s=>s.l==='Leg superset B')||{n:[]}).n.join(', ');
      });
    });
  });
  try{fs.unlinkSync(f);}catch(e){}
  return {cells,weeks,dayOn,dayOff,nCells};
}

// ── shard child ────────────────────────────────────────────────────────────────────
if(process.env.M133SHARD!==undefined){
  const si=+process.env.M133SHARD, sn=+process.env.M133SHARDS;
  const mine=LAT.filter((_,i)=>i%sn===si);
  const out={};
  ['v204','v205'].forEach(v=>{ out[v]=sweep(v,mine); });
  fs.writeFileSync(process.env.M133OUT,JSON.stringify(out));
  process.exit(0);
}

// ── parent ─────────────────────────────────────────────────────────────────────────
const SH=+(process.argv[2]||8);
const outs=[], kids=[];
for(let i=0;i<SH;i++){ const o=path.join(os.tmpdir(),'m133_'+i+'_'+process.pid+'.json'); outs.push(o);
  try{fs.unlinkSync(o);}catch(e){}
  kids.push(new Promise((res,rej)=>{ const k=fork(__filename,[],{env:Object.assign({},process.env,
    {M133SHARD:String(i),M133SHARDS:String(SH),M133OUT:o}),stdio:'inherit'});
    k.on('exit',c=>c===0?res():rej(new Error('shard '+i+' exit '+c))); })); }
Promise.all(kids).then(()=>{
  const A={v204:{cells:{},weeks:{},dayOn:{},dayOff:{},nCells:0},v205:{cells:{},weeks:{},dayOn:{},dayOff:{},nCells:0}};
  outs.forEach(o=>{ const j=JSON.parse(fs.readFileSync(o,'utf8'));
    ['v204','v205'].forEach(v=>{ Object.assign(A[v].cells,j[v].cells); Object.assign(A[v].weeks,j[v].weeks);
      Object.assign(A[v].dayOn,j[v].dayOn); Object.assign(A[v].dayOff,j[v].dayOff); A[v].nCells+=j[v].nCells; });
    try{fs.unlinkSync(o);}catch(e){}; });
  report(A);
}).catch(e=>{ console.error('MEASUREMENT FAILED:',e.message); process.exit(1); });

function pct(n,d){return d?((100*n/d).toFixed(2)+'%'):'n/a';}
function topN(map,n){return Object.keys(map).sort((a,b)=>map[b]-map[a]).slice(0,n).map(k=>'    '+String(map[k]).padStart(6)+'  '+k).join('\n');}
function bump(o,k){o[k]=(o[k]||0)+1;}

function report(A){
  const C4=A.v204.cells, C5=A.v205.cells, W4=A.v204.weeks, W5=A.v205.weeks;
  const keys=Object.keys(C5);
  console.log('=== 0. DENOMINATORS ===');
  console.log('lattice configs            : '+LAT.length);
  console.log('day cells recorded  V204   : '+A.v204.nCells+'   V205: '+A.v205.nCells);
  console.log('cells keyed         V204   : '+Object.keys(C4).length+'   V205: '+keys.length);
  console.log('weeks keyed         V204   : '+Object.keys(W4).length+'   V205: '+Object.keys(W5).length);
  const kOnly4=Object.keys(C4).filter(k=>!C5[k]).length, kOnly5=keys.filter(k=>!C4[k]).length;
  console.log('cells only in V204 / V205  : '+kOnly4+' / '+kOnly5+'   (nonzero => program length moved; segment below)');

  // ── I3 ──
  console.log('\n=== 1. I3  capRegionalFatigue kills Leg superset B ===');
  const in4=Object.keys(C4).filter(k=>C4[k].lsbIn), in5=keys.filter(k=>C5[k].lsbIn);
  const kill4=in4.filter(k=>!C4[k].lsbOut), kill5=in5.filter(k=>!C5[k].lsbOut);
  console.log('LSB entering cap   V204='+in4.length+'   V205='+in5.length+'   (F2 denominator)');
  console.log('LSB killed by cap  V204='+kill4.length+'   V205='+kill5.length+'   delta='+(kill5.length-kill4.length));
  const K4=new Set(kill4), K5=new Set(kill5);
  const survived=kill4.filter(k=>C5[k]&&!K5.has(k));      // killed at 204, survives at 205
  const newlyKilled=kill5.filter(k=>C4[k]&&!K4.has(k));   // survived at 204, killed at 205
  console.log('killed@204 -> survives@205 : '+survived.length);
  console.log('survives@204 -> killed@205 : '+newlyKilled.length);

  console.log('\n--- 1a. COACH BLOCKING CONDITION: each survivor must sit on strictly LOWER interference ---');
  let lower=0,equal=0,higher=0,nullci=0; const offenders=[], byDelta={}, bySeg={}, byCard={};
  survived.forEach(k=>{ const a=C4[k].ci, b=C5[k].ci;
    if(a==null||b==null){nullci++; offenders.push({k,a,b,why:'NULL interference'}); return;}
    if(b<a) lower++; else if(b===a){equal++; offenders.push({k,a,b,why:'EQUAL'});}
    else {higher++; offenders.push({k,a,b,why:'HIGHER'});}
    bump(byDelta, a.toFixed(2)+' -> '+b.toFixed(2));
    const p=k.split('|'); bump(bySeg, p[0]+' / '+p[3]+' / '+p[2]+' / '+p[1]);
    bump(byCard, '204['+C4[k].card+']  =>  205['+C5[k].card+']');
  });
  console.log('SATISFIES (205 ci < 204 ci) : '+lower+' / '+survived.length+'  '+pct(lower,survived.length));
  console.log('FAILS     (equal)           : '+equal);
  console.log('FAILS     (higher)          : '+higher);
  console.log('FAILS     (null)            : '+nullci);
  console.log('VERDICT: '+(offenders.length===0?'benign — every survivor is on a strictly lower-interference day'
    :'*** CAP DEFECT CANDIDATE *** '+offenders.length+' survivor(s) on equal-or-higher interference'));
  if(offenders.length) offenders.slice(0,40).forEach(o=>console.log('   !! '+o.why+'  ci '+o.a+' -> '+o.b+'   '+o.k
    +'\n       204 cardio: '+C4[o.k].card+'\n       205 cardio: '+C5[o.k].card));
  console.log('\n  interference transitions (count  204 -> 205):');
  console.log(topN(byDelta,30));
  console.log('\n  survivors by segment (equipment / goal / experience / focus):');
  console.log(topN(bySeg,30));
  console.log('\n  survivors by cardio session text:');
  console.log(topN(byCard,25));
  const byWD={}; survived.forEach(k=>{const p=k.split('|');bump(byWD,'wk'+p[7]+' '+p[8]);});
  console.log('\n  survivors by week/day cell:');
  console.log(topN(byWD,40));
  const byRole={}; survived.forEach(k=>bump(byRole,C5[k].role+'  (204 role '+C4[k].role+')'));
  console.log('\n  survivors by day role:');
  console.log(topN(byRole,10));
  // blindness probe: engine ci vs hand HCI
  let agree=0,dis=0; const disEx={};
  keys.forEach(k=>{ const c=C5[k]; if(c.ci==null)return; if(Math.abs(c.ci-c.hci)<1e-9)agree++; else {dis++; bump(disEx,c.card+'  eng='+c.ci+' hand='+c.hci);} });
  console.log('\n  HCI blindness probe (V205, all cells): agree '+agree+' / '+(agree+dis)+'  disagree '+dis);
  if(dis) console.log(topN(disEx,10));
  if(newlyKilled.length){ console.log('\n  --- reverse direction (survived@204, killed@205) ---');
    const rv={}; newlyKilled.forEach(k=>bump(rv,'ci '+C4[k].ci+' -> '+C5[k].ci+'   '+k.split('|').slice(0,4).join('|')));
    console.log(topN(rv,20)); }

  // ── C1 / C3 ──
  console.log('\n=== 2. C1/C3  zero-posterior weeks on the SHIPPED card (ON arm) ===');
  const z4=Object.keys(W4).filter(k=>W4[k].shipOn===0), z5=Object.keys(W5).filter(k=>W5[k].shipOn===0);
  console.log('zero-posterior weeks V204='+z4.length+' of '+Object.keys(W4).length+'   V205='+z5.length+' of '+Object.keys(W5).length);
  console.log('  of which deload    V204='+z4.filter(k=>W4[k].dl).length+'   V205='+z5.filter(k=>W5[k].dl).length+'  (C3 wants 0)');
  const Z5=new Set(z5); const fixed=z4.filter(k=>W5[k]&&!Z5.has(k));
  const Z4=new Set(z4); const broke=z5.filter(k=>W4[k]&&!Z4.has(k));
  console.log('zero@204 -> nonzero@205 : '+fixed.length+'     nonzero@204 -> zero@205 : '+broke.length);
  console.log('\n  the '+fixed.length+' weeks that gained posterior, per cell:');
  const C1SET=new Set();
  fixed.forEach(wk=>{ console.log('   WEEK '+wk+'   dl='+W4[wk].dl+'   shipPost 204='+W4[wk].shipOn+' -> 205='+W5[wk].shipOn);
    C1SET.add(wk);
    keys.filter(k=>k.startsWith(wk+'|')).forEach(k=>{ const a=C4[k]||{}, b=C5[k];
      if((a.shipPost||0)===(b.shipPost||0) && a.ci===b.ci && (a.lsbOut===b.lsbOut)) return;
      console.log('      '+k.split('|').slice(-1)[0].padEnd(4)
        +' role '+String(a.role)+'->'+String(b.role)
        +' | ci '+a.ci+'->'+b.ci
        +' | p1/p2/p3 post '+a.a1+'/'+a.a2+'/'+a.a3+' -> '+b.a1+'/'+b.a2+'/'+b.a3
        +' | shipPost '+a.shipPost+'->'+b.shipPost
        +' | LSB in/out '+a.lsbIn+'/'+a.lsbOut+' -> '+b.lsbIn+'/'+b.lsbOut);
      console.log('           cardio 204: '+a.card+'\n           cardio 205: '+b.card);
      if(a.p3lab!==b.p3lab){console.log('           p3lab 204: '+a.p3lab+'\n           p3lab 205: '+b.p3lab);}
    }); });
  if(broke.length){ console.log('\n  *** '+broke.length+' weeks LOST all posterior at V205 (wrong direction):');
    broke.forEach(wk=>console.log('   '+wk+'  dl='+W5[wk].dl)); }

  // ── C5 ──
  console.log('\n=== 3. C5  __DELOAD_OFF comparator: deload weeks shipping zero posterior ===');
  const o4=Object.keys(W4).filter(k=>W4[k].dl&&W4[k].shipOff===0), o5=Object.keys(W5).filter(k=>W5[k].dl&&W5[k].shipOff===0);
  console.log('V204='+o4.length+'   V205='+o5.length+'   deload weeks total 204='+Object.keys(W4).filter(k=>W4[k].dl).length
    +' 205='+Object.keys(W5).filter(k=>W5[k].dl).length);
  const O5=new Set(o5), C5FIX=o4.filter(k=>W5[k]&&!O5.has(k)); const O4=new Set(o4), C5BRK=o5.filter(k=>W4[k]&&!O4.has(k));
  console.log('zero@204 -> nonzero@205 : '+C5FIX.length+'     new zeros : '+C5BRK.length);
  C5FIX.forEach(wk=>{ console.log('   WEEK '+wk+'  shipOff 204='+W4[wk].shipOff+' -> 205='+W5[wk].shipOff
    +'   (ON arm shipPost 204='+W4[wk].shipOn+' -> 205='+W5[wk].shipOn+')'); });
  const inter=C5FIX.filter(k=>C1SET.has(k));
  console.log('\n  SET IDENTITY: C1 fixed set ('+fixed.length+') vs C5 fixed set ('+C5FIX.length+') — intersection '+inter.length);
  console.log('  C1-only: '+fixed.filter(k=>!C5FIX.includes(k)).join(', ')||'  C1-only: (none)');
  console.log('  C5-only: '+C5FIX.filter(k=>!fixed.includes(k)).join(', ')||'  C5-only: (none)');

  // ── D2 ──
  console.log('\n=== 4. D2  deload weeks that DIFFER between ON and OFF arms ===');
  const dl4=Object.keys(W4).filter(k=>W4[k].dl), dl5=Object.keys(W5).filter(k=>W5[k].dl);
  const diff4=dl4.filter(k=>W4[k].shaOn!==W4[k].shaOff), diff5=dl5.filter(k=>W5[k].shaOn!==W5[k].shaOff);
  console.log('deload weeks V204='+dl4.length+' V205='+dl5.length);
  console.log('DIFFERING    V204='+diff4.length+' V205='+diff5.length+'   (identical-either-way 204='+(dl4.length-diff4.length)+' 205='+(dl5.length-diff5.length)+')');
  const D5=new Set(diff5), wentIdent=diff4.filter(k=>W5[k]&&!D5.has(k));
  const D4=new Set(diff4), wentDiff=diff5.filter(k=>W4[k]&&!D4.has(k));
  console.log('differed@204 -> identical@205 : '+wentIdent.length+'    identical@204 -> differs@205 : '+wentDiff.length);
  wentIdent.forEach(wk=>{ console.log('\n   WEEK '+wk+'  — now byte-identical with the deload pass off. Per-day forensics:');
    Object.keys(A.v204.dayOn).filter(k=>k.startsWith(wk+'|')).forEach(k=>{
      const d=k.split('|').slice(-1)[0];
      const s4on=A.v204.dayOn[k], s4off=A.v204.dayOff[k], s5on=A.v205.dayOn[k], s5off=A.v205.dayOff[k];
      const a=C4[k]||{}, b=C5[k]||{};
      const tag4=(s4on===s4off)?'same':'DIFF', tag5=(s5on===s5off)?'same':'DIFF';
      if(tag4==='same'&&tag5==='same'&&a.ci===b.ci) return;
      console.log('      '+d.padEnd(4)+' on/off 204='+tag4+'  205='+tag5
        +' | role '+a.role+'->'+b.role+' | ci '+a.ci+'->'+b.ci+' | hot '+a.hot+'->'+b.hot
        +' | post p1/p2/p3 '+a.a1+'/'+a.a2+'/'+a.a3+'->'+b.a1+'/'+b.a2+'/'+b.a3);
      console.log('           cardio 204: '+a.card+'\n           cardio 205: '+b.card);
      console.log('           p2lab 204: '+a.p2lab+'\n           p2lab 205: '+b.p2lab);
      console.log('           p3lab 204: '+a.p3lab+'\n           p3lab 205: '+b.p3lab);
      console.log('           ship  204: '+a.shipLab+'\n           ship  205: '+b.shipLab);
    }); });
  if(wentDiff.length) wentDiff.forEach(wk=>console.log('   (reverse) '+wk));

  // ── 5. era row ──
  console.log('\n=== 5. DERIVED V205 ERA ROW ===');
  console.log('  I3 capLSBkilled     : '+kill4.length+' -> '+kill5.length+'   (entering: '+in4.length+' -> '+in5.length+')');
  console.log('  C1 zeroWeeks        : '+z4.length+' -> '+z5.length+'   of '+Object.keys(W5).length);
  console.log('  C3 zeroWeeksNonDl   : '+z4.filter(k=>!W4[k].dl).length+' -> '+z5.filter(k=>!W5[k].dl).length);
  console.log('  C5 zeroWeeksDeload(off): '+o4.length+' -> '+o5.length);
  console.log('  D2 dlDiffering      : '+diff4.length+' -> '+diff5.length+'   of '+dl5.length);

  // ── 6. attribution completeness ──
  console.log('\n=== 6. ATTRIBUTION COMPLETENESS ===');
  const unattrib=[];
  survived.forEach(k=>{ if(!(C5[k].ci<C4[k].ci)) unattrib.push('I3 survivor not on lower ci: '+k); });
  fixed.forEach(wk=>{ const any=keys.filter(k=>k.startsWith(wk+'|')).some(k=>(C4[k]||{}).ci!==C5[k].ci);
    if(!any) unattrib.push('C1 week with NO interference change on any day: '+wk); });
  C5FIX.forEach(wk=>{ const any=keys.filter(k=>k.startsWith(wk+'|')).some(k=>(C4[k]||{}).ci!==C5[k].ci);
    if(!any) unattrib.push('C5 week with NO interference change on any day: '+wk); });
  wentIdent.forEach(wk=>{ const any=keys.filter(k=>k.startsWith(wk+'|')).some(k=>(C4[k]||{}).ci!==C5[k].ci);
    if(!any) unattrib.push('D2 week with NO interference change on any day: '+wk); });
  console.log(unattrib.length? ('*** '+unattrib.length+' UNATTRIBUTED CELLS — BLOCKS THE RE-PIN ***\n  '+unattrib.join('\n  '))
    : 'every moved cell has at least one day whose _cardioInterference changed V204 -> V205.');

  // ── 7. interference census, whole lattice ──
  console.log('\n=== 7. INTERFERENCE CENSUS (all cells, both versions) ===');
  let ciSame=0,ciDown=0,ciUp=0,ciMiss=0; const upEx={},downEx={};
  keys.forEach(k=>{ const a=C4[k]; if(!a){ciMiss++;return;} const b=C5[k];
    if(a.ci===b.ci) ciSame++; else if(b.ci<a.ci){ciDown++; bump(downEx,a.ci+'->'+b.ci+'  ['+a.card+'] => ['+b.card+']');}
    else {ciUp++; bump(upEx,a.ci+'->'+b.ci+'  ['+a.card+'] => ['+b.card+']');} });
  console.log('unchanged '+ciSame+'  lowered '+ciDown+'  raised '+ciUp+'  missing-in-204 '+ciMiss+'  / '+keys.length);
  console.log('  lowered, by transition + session text:'); console.log(topN(downEx,20));
  console.log('  raised, by transition + session text:'); console.log(topN(upEx,20));
  const segDown={}; keys.forEach(k=>{const a=C4[k];if(!a)return;const b=C5[k];if(b.ci===a.ci)return;
    const p=k.split('|'); bump(segDown,p[3]+' / '+(b.ci<a.ci?'down':'up'));});
  console.log('  ci moves by goal:'); console.log(topN(segDown,12));
}
