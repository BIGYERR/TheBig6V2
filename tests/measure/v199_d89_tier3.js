// ════════════════════════════════════════════════════════════════════════════════════
// v199_d89_tier3.js — MEASURE PASS (read-only, rules nothing)
//
// Question on the table (D89, V199): capSessionBudget's tier-3 skip
//   V198 index.html:9558  (V197 index.html:9512)
//     if(_compoundTier(it.name)===3) return;   // barbell compounds are never budget fodder
// _compoundTier (V198 :9338) FALLS THROUGH to `return 3` for any compound name carrying
// no dumbbell/kettlebell/machine/cable/bodyweight marker, so an unrecognised name is
// classified as a barbell compound and made permanently exempt from the budget.
//
// WHAT IT PRINTS
//   1. the skip census: guard evaluations, cells engaged, implement-token vs fall-through.
//   2. the fall-through population partitioned by what each name actually is.
//   3. the blast radius of four candidate guard bodies, against base, incl. delete-all.
//   4. every name _isCompound / _isIsolation classify through a bare substring.
//   5. (report text) every reader of _compoundTier.
//
// ORACLE INDEPENDENCE
//   - the implement-token list is PARSED OUT OF THE ARTIFACT (the loaded-marker regex
//     literal inside _compoundTier), never typed from memory. Printed before use.
//   - EXLIB pool membership (the AUTHORING CONTRACT: which pool the author filed the
//     movement in) is the oracle for "what is this movement", never _compoundTier.
//   - _pattern is a SECOND, DIFFERENT classifier and is used only as a cross-check for
//     part 4; it is never asked whether _compoundTier is right.
//   - the guard is never asked what it should have said: every variant is a source-level
//     rewrite on a COPY, measured by its SHIPPED cards.
//
// LATTICE
//   verbatim from tests/measure/v198_d85_posterior_floor.js / tests/gates/g197c_d84_cmp.js
//   6 tiers x 2 focus x 2 exp x 3 goals x 4 injury x 3 rest x 2 seeds = 1728 config keys.
//   NOTE: this file does NOT reuse that script's posterior set (it wrongly includes
//   leg_iso at :91). No posterior claim is made here at all.
//
// USAGE  node tests/measure/v199_d89_tier3.js
// ════════════════════════════════════════════════════════════════════════════════════
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));

const ROOT=path.join(__dirname,'..','..');
const SCRATCH=process.env.V199_SCRATCH||fs.mkdtempSync(path.join(os.tmpdir(),'v199-'));

// ── lattice ────────────────────────────────────────────────────────────────────────
const E_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS=['hypertrophy','balanced'];
const E_EXPS=['beginner','advanced'];
const E_GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const E_INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
             {k:'lowback/protect',v:{region:'lowback',tier:'protect'}},
             {k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const E_RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const E_SEEDS=[1013,3039];
function eCfg(tier,focus,exp,g,inj,rest,seed){
  const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',
    cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,
    liftingFocus:focus,experience:exp,ageBracket:'18-35',
    equipment:tier,unit:'lbs',restDays:rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135,squat:155,deadlift:185,seed};
}
const LAT=[];
for(const t of E_TIERS)for(const f of E_FOCUS)for(const x of E_EXPS)for(const g of E_GOALS)
  for(const i of E_INJ)for(const r of E_RESTS)for(const sd of E_SEEDS){
    const c=eCfg(t,f,x,g,i,r,sd);
    if(i.v)c.injury={region:i.v.region,tier:i.v.tier};
    LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,tier:t,focus:f,exp:x,goal:g.k,inj:i.k,rest:r.k,seed:sd,cfg:c});
  }

// ── source surgery on a COPY. index.html is never written. ─────────────────────────
const A_GUARD="        if(_compoundTier(it.name)===3) return;            // barbell compounds are never budget fodder\n";
const A_EARLY="  if(_total(sections)<=cap) return sections;\n";
const A_CALL="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });\n";
const R_CALL="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){ globalThis.__CELL=String(w)+'/'+String(_d); _day.sections=capSessionBudget(_day.sections,_day.cardio); globalThis.__CELL=null; } });\n";
const R_EARLY="  if(_total(sections)<=cap){ if(globalThis.__T3M) globalThis.__T3M.early.push(globalThis.__CELL); return sections; } if(globalThis.__T3M) globalThis.__T3M.trim.push(globalThis.__CELL);\n";
// recorder: fires on EVERY guard evaluation, before the return. Pure observation.
const REC="        if(_compoundTier(it.name)===3){ if(globalThis.__T3M) globalThis.__T3M.hits.push({cell:globalThis.__CELL,it:it.iter,n:String(it.name||''),lab:String((s&&s.label)||''),opt:!!(s&&s.optional),core:!!(s&&s.core),hip:!!(s&&s.hip)}); ";
const A_SR="      const sr=_secRank(s); if(sr<0) return;\n";
// PRE-GUARD CENSUS: every section the loop walks, with its _secRank, and the tier-3
// items inside it. This is what the V198 report's method counted (a walk of the whole
// BEFORE card), so the two methods can be reconciled instead of argued about.
const R_SR="      const sr=_secRank(s); if(globalThis.__T3M){ globalThis.__T3M.pre.push({cell:globalThis.__CELL,g:guard,sr:sr,ns:((s&&s.items)||[]).filter(function(x){return _cost(x)>0&&_compoundTier(x.name)===3;}).map(function(x){return String(x.name||'');})}); } if(sr<0) return;\n";
const TOKTEST="/weighted|loaded|barbell|trap bar/.test((it.name||'').toLowerCase())";
const CORESEC="(!!(s&&s.core)||/^Trunk /.test((s&&s.label)||''))";
const CORENAME="/pallof|dead bug|bird dog|plank|hollow|anti-rotation|anti-extension|suitcase hold|side bench hold|ab wheel|hanging knee|leg raise|russian twist|wiper|l-sit|bracing/.test((it.name||'').toLowerCase())";
const VARIANTS={
  base:  {guard:A_GUARD, rec:true},
  del:   {guard:"", rec:false},
  token: {guard:"        if(_compoundTier(it.name)===3 && "+TOKTEST+") return;\n", rec:false},
  d89sec:{guard:"        if(_compoundTier(it.name)===3 && ("+TOKTEST+" || "+CORESEC+")) return;\n", rec:false},
  d89nam:{guard:"        if(_compoundTier(it.name)===3 && ("+TOKTEST+" || "+CORENAME+")) return;\n", rec:false},
};
function makeArtifact(src,variant,tag){
  const RAW=fs.readFileSync(src,'utf8');
  const nG=RAW.split(A_GUARD).length-1, nE=RAW.split(A_EARLY).length-1, nC=RAW.split(A_CALL).length-1;
  if(nG!==1||nE!==1||nC!==1){console.log('FAIL anchors on '+src+': guard='+nG+' early='+nE+' call='+nC+' (each must be 1)');process.exit(5);}
  const V=VARIANTS[variant];
  let body=V.guard;
  if(V.rec) body=REC+" return; }\n";
  let out=RAW.replace(A_GUARD,body).replace(A_EARLY,R_EARLY).replace(A_CALL,R_CALL);
  if(V.rec){ const nS=out.split(A_SR).length-1; if(nS!==1){console.log('FAIL _secRank anchor count='+nS);process.exit(5);} out=out.replace(A_SR,R_SR); }
  const p=path.join(SCRATCH,'art_'+tag+'_'+variant+'.html');
  try{fs.unlinkSync(p);}catch(e){}                       // delete before regenerating
  fs.writeFileSync(out.length?p:p,out);
  return p;
}

// ── shipped-card serialisation ─────────────────────────────────────────────────────
const CORE_NAME=/pallof|dead bug|bird dog|plank|hollow|anti-rotation|anti-extension|ab wheel|hanging knee|leg raise|russian twist|wiper|l-sit|suitcase hold/i;
function cardOf(day){
  return (day.sections||[]).map(s=>String(s.label||'')+'['+((s.items||[]).map(i=>String(i.name||'')).join(','))+']').join(' | ');
}
function sweep(artifact,variant,record){
  const IA=load(artifact);
  if(record) IA.eval("globalThis.__T3M={hits:[],early:[],trim:[],pre:[]}; globalThis.__CELL=null;");
  const R={configs:0,cells:0,cards:{},nameCount:{},labelCount:{},
           hits:0,hitCellKeys:{},hitNames:{},hitNameCells:{},hitLabels:{},hitFirstIter:0,
           hitTok:0,hitFall:0,fallNames:{},tokNames:{},hitSecOpt:0,hitSecCore:0,
           early:0,trim:0,cellsByKey:{},
           dTok:0,dCoreSec:0,dCoreNam:0,dCoreAny:0,dLose:0,
           preAll:0,preProt:0,preOpen:0,preProtTok:0,preOpenTok:0,
           preAll1:0,preProt1:0,preOpen1:0,preProt1Tok:0,preOpen1Tok:0,preCells1:{},
           chgSeg:{}};
  LAT.forEach(L=>{
    R.configs++;
    if(record) IA.eval("globalThis.__T3M.hits.length=0; globalThis.__T3M.early.length=0; globalThis.__T3M.trim.length=0; globalThis.__T3M.pre.length=0;");
    const prog=IA.buildProgram(L.cfg);
    const W=prog.weeks||{};
    Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{
      const day=W[w][d]; if(!day||day.rest||!Array.isArray(day.sections))return;
      R.cells++;
      R.cards[L.key+'|W'+w+'/'+d]=cardOf(day);
      (day.sections||[]).forEach(s=>{
        R.labelCount[String(s.label||'')]=(R.labelCount[String(s.label||'')]||0)+1;
        (s.items||[]).forEach(i=>{const n=String(i.name||'');R.nameCount[n]=(R.nameCount[n]||0)+1;});
      });
    }));
    if(record){
      const M=IA.eval("JSON.stringify({h:globalThis.__T3M.hits,e:globalThis.__T3M.early.length,t:globalThis.__T3M.trim.length,p:globalThis.__T3M.pre})");
      const m=JSON.parse(M);
      R.early+=m.e; R.trim+=m.t;
      const seen=new Set(), seenP=new Set();
      m.h.forEach(h=>{
        R.hits++;
        const ck=L.key+'|'+h.cell;
        R.hitCellKeys[ck]=1;
        R.hitNames[h.n]=(R.hitNames[h.n]||0)+1;
        R.hitLabels[h.lab]=(R.hitLabels[h.lab]||0)+1;
        if(h.opt)R.hitSecOpt++; if(h.core)R.hitSecCore++;
        const key=ck+'::'+h.n;
        if(!seen.has(key)){seen.add(key);R.hitNameCells[h.n]=(R.hitNameCells[h.n]||0)+1;R.hitFirstIter++;}
        const tok=/weighted|loaded|barbell|trap bar/.test(h.n.toLowerCase());
        if(tok){R.hitTok++;R.tokNames[h.n]=(R.tokNames[h.n]||0)+1;}
        else {R.hitFall++;R.fallNames[h.n]=(R.fallNames[h.n]||0)+1;}
        if(!seenP.has(key)){ seenP.add(key);
          if(tok) R.dTok++;
          else if(h.core||/^Trunk /.test(h.lab)) R.dCoreSec++;
          else if(CORE_NAME.test(h.n)) R.dCoreNam++;
          else R.dLose++;
          if(!tok&&(h.core||/^Trunk /.test(h.lab)||CORE_NAME.test(h.n))) R.dCoreAny++;
        }
      });
      // OLD-METHOD RECONCILIATION: tier-3 items counted by walking the card, split by
      // whether _secRank protects the section (sr<0 -> the real guard never sees them).
      m.p.forEach(pr=>{
        const first=pr.g<=1;
        pr.ns.forEach(n=>{
          const tok=/weighted|loaded|barbell|trap bar/.test(n.toLowerCase());
          R.preAll++; if(pr.sr<0){R.preProt++; if(tok)R.preProtTok++;} else {R.preOpen++; if(tok)R.preOpenTok++;}
          if(first){ R.preAll1++; if(pr.sr<0){R.preProt1++; if(tok)R.preProt1Tok++;} else {R.preOpen1++; if(tok)R.preOpen1Tok++;} }
        });
        if(first) R.preCells1[L.key+'|'+pr.cell]=1;
      });
    }
  });
  R.hitCells=Object.keys(R.hitCellKeys).length; delete R.hitCellKeys; delete R.cellsByKey;
  R.preCells1n=Object.keys(R.preCells1).length; delete R.preCells1;
  return R;
}

// ── child ──────────────────────────────────────────────────────────────────────────
if(process.env.V199_JOB){
  const [src,variant,tag,out]=process.env.V199_JOB.split('::');
  const art=makeArtifact(src,variant,tag);
  const R=sweep(art,variant,VARIANTS[variant].rec);
  fs.writeFileSync(out,JSON.stringify(R));
  try{fs.unlinkSync(art);}catch(e){}
  process.exit(0);
}

// ── parent ─────────────────────────────────────────────────────────────────────────
const V198=path.join(ROOT,'index.html');
const V197=process.env.V199_V197||path.join(SCRATCH,'v197.html');
const JOBS=[];
['base','del','token','d89sec','d89nam'].forEach(v=>JOBS.push({src:V198,variant:v,tag:'v198'}));
['base','del'].forEach(v=>JOBS.push({src:V197,variant:v,tag:'v197'}));
const ver=f=>(fs.readFileSync(f,'utf8').match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
console.log('V199 D89 TIER-3 MEASURE');
console.log('artifacts: V198='+V198+' (ia-version '+ver(V198)+')   V197='+V197+' (ia-version '+ver(V197)+')');
console.log('lattice: '+LAT.length+' config keys');
// implement-token list derived FROM THE ARTIFACT, printed before use
const TOKLINE=(fs.readFileSync(V198,'utf8').match(/if\(!\/([a-z| ]+)\/\.test\(N\)\n/)||[])[1];
console.log('implement-token regex parsed out of _compoundTier: /'+TOKLINE+'/  (loaded-marker test, V198 :9343)');
if(TOKLINE!=='weighted|loaded|barbell|trap bar'){console.log('FAIL: token regex not as parsed');process.exit(6);}
let done=0; const OUT={};
JOBS.forEach((j,i)=>{
  const o=path.join(SCRATCH,'r'+i+'.json');
  try{fs.unlinkSync(o);}catch(e){}
  const ch=fork(__filename,[],{env:Object.assign({},process.env,{V199_JOB:[j.src,j.variant,j.tag,o].join('::'),V199_SCRATCH:SCRATCH,V199_V197:V197}),stdio:'inherit'});
  ch.on('exit',c=>{
    if(c!==0){console.log('FAIL: job '+j.tag+'/'+j.variant+' exited '+c);process.exit(4);}
    OUT[j.tag+'/'+j.variant]=JSON.parse(fs.readFileSync(o,'utf8'));
    if(++done===JOBS.length) report();
  });
});
function pct(n,d){return d?(100*n/d).toFixed(2)+'%':'n/a';}
function top(o,n){return Object.keys(o).sort((a,b)=>o[b]-o[a]).slice(0,n).map(k=>k+' '+o[k]);}
function diffCards(base,cand){
  const keys=Object.keys(base.cards); let ch=0; const seg={};
  keys.forEach(k=>{if(base.cards[k]!==cand.cards[k]){ch++;
    const p=k.split('|');                              // tier|focus|exp|goal|inj|rest|seed|Ww/d
    const wk=(p[7]||'').split('/')[0];
    [['tier',p[0]],['focus',p[1]],['exp',p[2]],['goal',p[3]],['inj',p[4]],['week',wk]]
      .forEach(([a,v])=>{seg[a+'='+v]=(seg[a+'='+v]||0)+1;});
  }});
  const lab={},nam={};
  const all=new Set(Object.keys(base.labelCount).concat(Object.keys(cand.labelCount)));
  all.forEach(l=>{const d=(cand.labelCount[l]||0)-(base.labelCount[l]||0); if(d)lab[l]=d;});
  const alln=new Set(Object.keys(base.nameCount).concat(Object.keys(cand.nameCount)));
  alln.forEach(n=>{const d=(cand.nameCount[n]||0)-(base.nameCount[n]||0); if(d)nam[n]=d;});
  const secB=Object.values(base.labelCount).reduce((a,b)=>a+b,0);
  const secC=Object.values(cand.labelCount).reduce((a,b)=>a+b,0);
  const itB=Object.values(base.nameCount).reduce((a,b)=>a+b,0);
  const itC=Object.values(cand.nameCount).reduce((a,b)=>a+b,0);
  return {cellsChanged:ch,cells:keys.length,secDelta:secC-secB,itemDelta:itC-itB,lab,nam,seg};
}
function report(){
  const B=OUT['v198/base'], B7=OUT['v197/base'];
  console.log('\n══ 1. SKIP CENSUS, V198 (and V197) ════════════════════════════════════════');
  [['V198',B],['V197',B7]].forEach(([tag,R])=>{
    console.log(tag+': day cells '+R.cells+' / '+R.configs+' configs');
    console.log('  capSessionBudget: under cap on arrival '+R.early+', entered trim loop '+R.trim
      +' ('+pct(R.trim,R.early+R.trim)+' of '+(R.early+R.trim)+' invocations)');
    console.log('  GUARD EVALUATIONS (every loop iteration x item)  '+R.hits);
    console.log('  DISTINCT (cell,name) SKIPS                       '+R.hitFirstIter);
    console.log('  trimming cells with >=1 skip                     '+R.hitCells+' / '+R.trim);
    console.log('  implement token (/'+TOKLINE+'/)   '+R.hitTok+' ('+pct(R.hitTok,R.hits)+')');
    console.log('  FALL-THROUGH to return 3                         '+R.hitFall+' ('+pct(R.hitFall,R.hits)+')');
    console.log('  skips inside s.optional sections '+R.hitSecOpt+'   inside s.core sections '+R.hitSecCore);
    console.log('  top fall-through names (guard evals): '+top(R.fallNames,14).join('  |  '));
    console.log('  top token names (guard evals):        '+top(R.tokNames,8).join('  |  '));
    console.log('  top sections holding a skip:          '+top(R.hitLabels,10).join('  |  '));
  });
  console.log('\n══ 2. FALL-THROUGH POPULATION, PARTITIONED ════════════════════════════════');
  const IA=load(V198);
  const EX=IA.eval('EXLIB'), PAT=IA.eval('(function(n){try{return _pattern(n)||null;}catch(e){return "ERR";}})');
  const pool={};                                     // name -> authoring pool keys
  (function walk(o,p){ if(Array.isArray(o)){o.forEach(v=>{if(typeof v==='string'){(pool[v]=pool[v]||[]).push(p);} else if(v&&typeof v==='object')walk(v,p);});return;}
    if(o&&typeof o==='object'){Object.keys(o).forEach(k=>walk(o[k],p?p+'.'+k:k));} })(EX,'');
  const names=Object.keys(B.fallNames).sort((a,b)=>B.fallNames[b]-B.fallNames[a]);
  const CORE=/pallof|dead bug|bird dog|plank|hollow|anti-rotation|anti-extension|ab wheel|hanging knee|leg raise|russian twist|wiper|l-sit|suitcase hold/i;
  const buckets={};
  console.log('name | guard-evals | distinct(cell,name) | shipped items | EXLIB pool(s) | _pattern | bucket');
  names.forEach(n=>{
    const pk=(pool[n]||['(not in EXLIB)']).join(','),
          p=PAT(n),
          shipped=B.nameCount[n]||0;
    let b;
    if(CORE.test(n)||/^core\.|core_|trunk/i.test(pk)) b='CORE';
    else if(/carry|farmer|suitcase carry|overhead carry/i.test(n)) b='CARRY';
    else if(/jump|hop|bound|explosive|landmine/i.test(n)) b='EXPLOSIVE-ish';
    else if(/bodyweight|\(chair\)|\(table\)|band/i.test(n)) b='UNLOADED-variant';
    else b='LOADED-compound-candidate';
    buckets[b]=buckets[b]||{ev:0,cells:0,ship:0,names:[]};
    buckets[b].ev+=B.fallNames[n]; buckets[b].cells+=B.hitNameCells[n]||0;
    buckets[b].ship+=shipped; buckets[b].names.push(n);
    console.log('  '+n+' | '+B.fallNames[n]+' | '+(B.hitNameCells[n]||0)+' | '+shipped+' | '+pk+' | '+p+' | '+b);
  });
  console.log('\nbucket totals (hand table above; coach re-buckets, this script does not rule):');
  Object.keys(buckets).forEach(b=>console.log('  '+b.padEnd(26)+' guard-evals '+buckets[b].ev
    +'  distinct-cell-skips '+buckets[b].cells+'  shipped items '+buckets[b].ship+'  distinct names '+buckets[b].names.length));
  console.log('  denominator: '+B.hitFall+' fall-through guard evals / '+B.hits+' total / '+B.cells+' day cells');

  console.log('\n══ 3. BLAST RADIUS OF EACH CANDIDATE GUARD BODY ═══════════════════════════');
  console.log('base = V198 shipped. Each variant is a source rewrite of the guard on a COPY.');
  [['del','guard DELETED entirely'],
   ['token','tier3 && implement token (no core clause)'],
   ['d89sec','tier3 && (token || s.core || label ^Trunk )  [D89, core named by SECTION]'],
   ['d89nam','tier3 && (token || core MOVEMENT name)       [D89, core named by MOVEMENT]']]
   .forEach(([v,desc])=>{
    const D=diffCards(B,OUT['v198/'+v]);
    console.log('\n  --- '+v+': '+desc);
    console.log('  cells changed        '+D.cellsChanged+' / '+D.cells+' ('+pct(D.cellsChanged,D.cells)+')');
    console.log('  section count delta  '+D.secDelta+'    item count delta '+D.itemDelta);
    const lost=Object.keys(D.lab).filter(k=>D.lab[k]<0).sort((a,b)=>D.lab[a]-D.lab[b]).slice(0,10).map(k=>k+' '+D.lab[k]);
    const gain=Object.keys(D.lab).filter(k=>D.lab[k]>0).sort((a,b)=>D.lab[b]-D.lab[a]).slice(0,6).map(k=>k+' +'+D.lab[k]);
    console.log('  sections LOST  : '+(lost.length?lost.join('  |  '):'(none)'));
    console.log('  sections GAINED: '+(gain.length?gain.join('  |  '):'(none)'));
    const nl=Object.keys(D.nam).filter(k=>D.nam[k]<0).sort((a,b)=>D.nam[a]-D.nam[b]).slice(0,12).map(k=>k+' '+D.nam[k]);
    const ng=Object.keys(D.nam).filter(k=>D.nam[k]>0).sort((a,b)=>D.nam[b]-D.nam[a]).slice(0,12).map(k=>k+' +'+D.nam[k]);
    console.log('  names LOST  : '+(nl.length?nl.join('  |  '):'(none)'));
    console.log('  names GAINED: '+(ng.length?ng.join('  |  '):'(none)'));
    const legish=Object.keys(D.lab).filter(k=>/leg|squat|calf|calves|lunge/i.test(k)&&D.lab[k]<0)
      .reduce((a,k)=>a-D.lab[k],0);
    console.log('  leg-ish sections lost (label matches /leg|squat|calf|calves|lunge/i): '+legish);
    ['inj','tier','focus','exp','goal','week'].forEach(ax=>{
      const rows=Object.keys(D.seg).filter(k=>k.indexOf(ax+'=')===0).sort((a,b)=>D.seg[b]-D.seg[a]).map(k=>k+' '+D.seg[k]);
      console.log('    '+ax.padEnd(6)+' '+(rows.length?rows.join('  '):'(none)'));
    });
  });
  // protection accounting for the ruled fix
  let keepTok=0,keepCoreSec=0,lose=0,keepCoreNam=0,loseNam=0;
  console.log('\n  PROTECTION ACCOUNTING on the '+B.hitFirstIter+' DISTINCT (cell,name) skips:');
  console.log('    keeps protection via implement token        '+B.dTok+' ('+pct(B.dTok,B.hitFirstIter)+')');
  console.log('    keeps it via the CORE clause, section form   '+B.dCoreSec+' ('+pct(B.dCoreSec,B.hitFirstIter)+')');
  console.log('    keeps it via the CORE clause, movement form  '+(B.dCoreSec+B.dCoreNam)+' ('+pct(B.dCoreSec+B.dCoreNam,B.hitFirstIter)+')');
  console.log('    LOSES protection under D89                   '+B.dLose+' ('+pct(B.dLose,B.hitFirstIter)+')');
  console.log('\n  RECONCILIATION with the V198 report (17,992 / 13,176 / 28.81% token):');
  console.log('    tier-3 items found by walking the card, first loop iteration only: '+B.preAll1
    +' over '+B.preCells1n+' trimming cells');
  console.log('      of those, in sections _secRank PROTECTS (sr<0, the guard never sees them): '+B.preProt1
    +' ('+pct(B.preProt1,B.preAll1)+'), implement-token share '+pct(B.preProt1Tok,B.preProt1));
  console.log('      of those, in sections the loop actually walks: '+B.preOpen1
    +' ('+pct(B.preOpen1,B.preAll1)+'), implement-token share '+pct(B.preOpen1Tok,B.preOpen1));
  console.log('    same walk over every loop iteration: '+B.preAll+'  protected '+B.preProt+'  open '+B.preOpen);
  console.log('\n  protection accounting on the '+B.hits+' guard evaluations:');
  console.log('    kept by implement token          '+B.hitTok+' ('+pct(B.hitTok,B.hits)+')');
  console.log('    kept by s.core section flag      '+B.hitSecCore+' (of the fall-through '+B.hitFall+')');
  console.log('    remaining fall-through, loses protection under token-only: '+B.hitFall+' ('+pct(B.hitFall,B.hits)+')');

  console.log('\n══ 3b. V197 CROSS-CHECK (is any of this V198-specific?) ═══════════════════');
  const D7=diffCards(B7,OUT['v197/del']), D8=diffCards(B,OUT['v198/del']);
  console.log('  delete-guard blast radius  V197: '+D7.cellsChanged+' / '+D7.cells+' cells, sections '+D7.secDelta+', items '+D7.itemDelta);
  console.log('  delete-guard blast radius  V198: '+D8.cellsChanged+' / '+D8.cells+' cells, sections '+D8.secDelta+', items '+D8.itemDelta);
  const lostLab7=Object.keys(D7.lab).filter(k=>D7.lab[k]<0).sort((a,b)=>D7.lab[a]-D7.lab[b]).slice(0,10).map(k=>k+' '+D7.lab[k]);
  const lostNam7=Object.keys(D7.nam).filter(k=>D7.nam[k]<0).sort((a,b)=>D7.nam[a]-D7.nam[b]).slice(0,10).map(k=>k+' '+D7.nam[k]);
  console.log('    V197 del sections LOST: '+lostLab7.join('  |  '));
  console.log('    V197 del names LOST   : '+lostNam7.join('  |  '));
  console.log('    V197 del leg-ish sections lost: '+Object.keys(D7.lab).filter(k=>/leg|squat|calf|calves|lunge/i.test(k)&&D7.lab[k]<0).reduce((a,k)=>a-D7.lab[k],0));
  console.log('  V197 vs V198 base cards differing: '+Object.keys(B.cards).filter(k=>B.cards[k]!==B7.cards[k]).length+' / '+B.cells);

  console.log('\n══ 4. BARE-SUBSTRING CLASSIFICATIONS in _isCompound / _isIsolation ════════');
  const ISC=IA.eval('_isCompound'), ISO=IA.eval('_isIsolation');
  const uni=new Set(Object.keys(pool));
  Object.keys(B.nameCount).forEach(n=>uni.add(n));
  Object.keys(OUT['v198/del'].nameCount).forEach(n=>uni.add(n));
  const INC=/bench|squat|deadlift|press|row|pull|clean|snatch|lunge|dip|chinup|pullup|hinge|romanian|thruster/;
  const ISOR=/lateral|front raise|rear delt|face pull|curl|extension|pushdown|skullcrush|fly|calf raise|kickback/;
  const rows=[];
  Array.from(uni).sort().forEach(n=>{
    const L=n.toLowerCase(), c=ISC(n), iso=ISO(n), p=PAT(n);
    const mc=(L.match(INC)||[])[0]||null, mi=(L.match(ISOR)||[])[0]||null;
    // FLAG: the classifier fired, but the SECOND classifier (_pattern) and the AUTHORING
    // POOL both say this is not that movement.
    const pk=(pool[n]||[]).join(',');
    const compoundSuspect = c && (!p || !/hpress|vpress|row|vpull|squat|hinge|lunge/.test(String(p)));
    const isoSuspect = iso && p && /hpress|vpress|row|vpull|squat|hinge|lunge/.test(String(p));
    if(compoundSuspect||isoSuspect)
      rows.push({n,c,iso,p:String(p),mc,mi,pk,ship:(B.nameCount[n]||0),kind:compoundSuspect?'_isCompound':'_isIsolation'});
  });
  console.log('universe swept: '+uni.size+' distinct names (EXLIB pools + every name shipped by base or by delete-variant)');
  console.log('flagged: '+rows.length+'   rule: classifier fires AND _pattern (the second, independent classifier) disagrees');
  console.log('name | classifier | matched bare token | _pattern | EXLIB pool | shipped items (base)');
  rows.sort((a,b)=>b.ship-a.ship).forEach(r=>console.log('  '+r.n+' | '+r.kind+' | "'+(r.kind==='_isCompound'?r.mc:r.mi)+'" | '+r.p+' | '+(r.pk||'(not in EXLIB)')+' | '+r.ship));
  console.log('\nMEASURED '+B.cells+' day cells x '+JOBS.length+' artifact variants / '+B.configs+' configs. No ruling. No edit.');
}
