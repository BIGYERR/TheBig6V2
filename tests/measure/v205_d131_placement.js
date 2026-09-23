// MEASURE v205 — D131 pre-build print. READ-ONLY on index.html.
//
// Counterfactuals are built by SOURCE SURGERY into the scratchpad. Three artifacts:
//   BASE  = the shipped V205 index.html (argv[2])
//   CF1   = BASE + D131 as ruled: (a) classifier returns a shape when there is no long
//           run (long null, forbidden empty), Incline Walk / Cross-Train named EASY;
//           (b) on a speedless shape the (pull,legs) tiebreak prefers the LOWER legs cost
//           before the earliest-legs-day rule.
//   CF2   = CF1 + the legTaxing early-return in deconflictLegLiftDays moved BELOW the
//           nrcLegLiftPlacement call. Measured separately and NOT ruled: it is printed
//           because CF1 alone cannot reach the placement on an all-walk week.
//   V204  = git show V204:index.html (argv[3]) — E1g's "since the last release" baseline.
//
// ORACLES, independent of the functions under test:
//   * cap  = max(12, 20 - round(interference*2))  — the authoring contract, same formula
//     the V205 calves measure pass used; interference read off the cardio object.
//   * "Calves present" = a section LABEL test on the built day, not a query to the budget.
//   * the expected placement for part 1 is COACH's printed expectation (legs on the clean
//     day at cap 20 with Calves, pull on a walk day at cap 18) — a hand table, typed here.
//   * the speedless population is counted from the cardio SUBTYPES on week 1, not from
//     _nrcRunShape's return value.
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');
const {load, fixtures, progDigest}=require(path.resolve(__dirname,'..','harness.js'));

const BASE=process.argv[2]||path.resolve(__dirname,'..','..','index.html');
const V204=process.argv[3];
const SC=process.env.V205_SC||fs.mkdtempSync(path.join(os.tmpdir(),'v205d131-'));

// ── source surgery ───────────────────────────────────────────────────────────
const A_CLASS_OLD =
`      else if(c.legLoad) long = d;
      else easy.add(d);
    } });
  if(!long) return null;`;
const A_CLASS_NEW =
`      else if(/^(Incline Walk|Cross-Train)/.test(_st)) easy.add(d);
      else if(c.legLoad) long = d;
      else easy.add(d);
    } });
  if(!long){ if(!speed.size && !easy.size) return null;
    return { long:null, eve:null, after:null, speed, easy, forbidden:new Set() }; }
  if(false) return null;`;

const A_TIE_OLD =
`      if(!best || c<best.c || (c===best.c && sp>best.sp) || (c===best.c && sp===best.sp && iso(l)<iso(best.days.legs))) best = {c, sp, days:{pull:p, legs:l}};`;
const A_TIE_NEW =
`      const lc = cost('legs',l);
      const _b = (!best) ? true : (c<best.c) ? true : (c>best.c) ? false
        : (sp>best.sp) ? true : (sp<best.sp) ? false
        : (!shape.speed.size && lc!==best.lc) ? (lc<best.lc)
        : iso(l)<iso(best.days.legs);
      if(_b) best = {c, sp, lc, days:{pull:p, legs:l}};`;

const A_GUARD_OLD =
`  if(!legTaxing.size) return { legRecoveryNote:null };
  // V189 (D36): race programs place by run shape.`;
const A_GUARD_NEW =
`  // V189 (D36): race programs place by run shape.`;
const A_GUARD_INS_OLD =
`  const _nrc = nrcLegLiftPlacement(dayRoles, trainDays, wk1);
  if(_nrc) return _nrc;`;
const A_GUARD_INS_NEW =
`  const _nrc = nrcLegLiftPlacement(dayRoles, trainDays, wk1);
  if(_nrc) return _nrc;
  if(!legTaxing.size) return { legRecoveryNote:null };`;

function anchor(src,a,b,tag){
  const n=src.split(a).length-1;
  if(n!==1){ console.log('ANCHOR FAIL '+tag+' count='+n); process.exit(2); }
  return src.split(a).join(b);
}
const RAW=fs.readFileSync(BASE,'utf8');
let cf1=anchor(RAW,A_CLASS_OLD,A_CLASS_NEW,'classifier');
cf1=anchor(cf1,A_TIE_OLD,A_TIE_NEW,'tiebreak');
let cf2=anchor(cf1,A_GUARD_OLD,A_GUARD_NEW,'guard-remove');
cf2=anchor(cf2,A_GUARD_INS_OLD,A_GUARD_INS_NEW,'guard-reinsert');
const F_CF1=path.join(SC,'cf1.html'), F_CF2=path.join(SC,'cf2.html');
fs.writeFileSync(F_CF1,cf1); fs.writeFileSync(F_CF2,cf2);

// ── lattice: byte-for-byte g197d_d84_base.js E_L ─────────────────────────────
const TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const FOCUS=['hypertrophy','balanced'], EXPS=['beginner','advanced'];
const GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
           {k:'lowback/protect',v:{region:'lowback',tier:'protect'}},{k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const SEEDS=[1013,3039];
function eCfg(t,f,x,g,i,r,sd){const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
   cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
   eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:f,experience:x,ageBracket:'18-35',
   equipment:t,unit:'lbs',restDays:r.v.slice(),days:['sun','mon','tue','wed','thu','fri','sat'],
   bench:135,squat:155,deadlift:185,seed:sd,...(i.v?{injury:{region:i.v.region,tier:i.v.tier}}:{})};}
const L=[];
for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)for(const r of RESTS)for(const sd of SEEDS)
  L.push({key:[t,f,x,g.k,i.k,r.k,sd].join('|'),t,f,x,g:g.k,i:i.k,r:r.k,sd,cfg:eCfg(t,f,x,g,i,r,sd)});

const CAP=iv=>Math.max(12,20-Math.round(iv*2));
function scan(IA,cfg){
  const interf=IA.eval('_cardioInterference');
  const p=IA.buildProgram(cfg),W=p.weeks||{},out={};
  Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{
    const day=W[w][d]; if(!day||day.rest) return;
    const ca=day.cardio||null, iv=ca?interf(ca):0;
    const labels=(day.sections||[]).map(s=>String(s.label||''));
    const items=[]; (day.sections||[]).forEach(s=>(s.items||[]).forEach(it=>items.push(String(s.label||'')+'␟'+String(it&&it.name||''))));
    out[w+'/'+d]={w:+w,d,labels,items,
      role:String(day.role||day.dayRole||''), title:String(day.title||''),
      calves:labels.indexOf('Calves')>=0,
      hasCardio:!!ca, csub:ca?String(ca.subtype||''):'', ctype:ca?String(ca.type||''):'',
      cat:ca?String(ca.assignedType||''):'', cll:ca?!!ca.legLoad:false, interf:iv, cap:CAP(iv)};
  }));
  return out;
}
const ROLE=r=>{ // role from the day title / section labels, not from dayRoles
  return r.role|| (/pull|back|deadlift/i.test(r.title)?'?':'');
};

// ── worker ───────────────────────────────────────────────────────────────────
const SH=process.argv.indexOf('--shard');
if(SH>0){
  const [si,sn]=process.argv[SH+1].split('/').map(Number);
  const OUT=process.argv[process.argv.indexOf('--out')+1];
  const which=process.argv[process.argv.indexOf('--cf')+1];
  const CAND=which==='cf1'?F_CF1:which==='cf2'?F_CF2:BASE;
  const IAc=load(CAND), IAb=load(V204), IAbase=load(BASE);
  const rec={cfgs:0,cells:0,fallsV204:0,risesV204:0,fallEg:[],riseInj:{},
             trimSec:{},trimCells:0,trimItems:0,addSec:{},addCells:0,
             pullTrimSec:{},pullTrimCells:0, moved:[], speedless:0, speedlessCfg:[], shapeNull:0,
             cellDiff:0, cfgDiff:0, byGoalDiff:{} };
  L.forEach((c,ix)=>{ if(ix%sn!==si) return;
    let a,b,z; try{a=scan(IAc,c.cfg); b=scan(IAb,c.cfg); z=scan(IAbase,c.cfg);}catch(e){return;}
    rec.cfgs++;
    // speedless population: week-1 cardio subtypes, read off the built program
    const w1=Object.keys(z).filter(k=>z[k].w===1);
    const runs=w1.filter(k=>z[k].hasCardio);
    const spd=runs.filter(k=>/^(Interval \(INT\)|Continuous High Intensity \(CHI\)|Speed Run)/i.test(z[k].csub));
    const lng=runs.filter(k=>z[k].cll);
    if(runs.length && !spd.length){ rec.speedless++; if(rec.speedlessCfg.length<40) rec.speedlessCfg.push(c.key+' runs='+runs.map(k=>z[k].d+':'+z[k].csub).join(',')); }
    if(runs.length && !lng.length) rec.shapeNull++;
    let cfgMoved=false;
    Object.keys(b).forEach(k=>{ const B1=b[k],A1=a[k]; if(!A1) return; rec.cells++;
      if(!A1.calves&&B1.calves){ rec.fallsV204++; if(rec.fallEg.length<8) rec.fallEg.push(c.key+' '+k+' cap'+B1.cap+'->'+A1.cap+' sub="'+A1.csub+'"'); }
      if(A1.calves&&!B1.calves){ rec.risesV204++; rec.riseInj[c.i]=(rec.riseInj[c.i]||0)+1; }
    });
    // CF vs shipped V205: what moved, and the accessory trims
    Object.keys(z).forEach(k=>{ const Z=z[k],A1=a[k]; if(!A1) return;
      const zi=Z.items.join('|'), ai=A1.items.join('|');
      if(zi!==ai||Z.csub!==A1.csub||Z.title!==A1.title){ rec.cellDiff++; cfgMoved=true;
        rec.byGoalDiff[c.g]=(rec.byGoalDiff[c.g]||0)+1;
        if(rec.moved.length<12) rec.moved.push(c.key+' '+k+' title "'+Z.title+'"->"'+A1.title+'" sub "'+Z.csub+'"->"'+A1.csub+'" cap '+Z.cap+'->'+A1.cap); }
      const zs=new Set(Z.items), as=new Set(A1.items);
      const lost=Z.items.filter(x=>!as.has(x)), gained=A1.items.filter(x=>!zs.has(x));
      if(lost.length){ rec.trimCells++; rec.trimItems+=lost.length;
        lost.forEach(x=>{const s=x.split('␟')[0]; rec.trimSec[s]=(rec.trimSec[s]||0)+1;});
        if(/pull|row|chin|pulldown|back/i.test(A1.title)){ rec.pullTrimCells++;
          lost.forEach(x=>{const s=x.split('␟')[0]; rec.pullTrimSec[s]=(rec.pullTrimSec[s]||0)+1;}); } }
      if(gained.length){ rec.addCells++; gained.forEach(x=>{const s=x.split('␟')[0]; rec.addSec[s]=(rec.addSec[s]||0)+1;}); }
    });
    if(cfgMoved) rec.cfgDiff++;
  });
  fs.writeFileSync(OUT,JSON.stringify(rec)); process.exit(0);
}

// ── parent ───────────────────────────────────────────────────────────────────
const FALL14=["commercial|hypertrophy|beginner|pace|lowback/protect|sun|1013",
"commercial|hypertrophy|beginner|pace|knee/protect|sun|1013",
"home_full|hypertrophy|beginner|pace|lowback/protect|sun|1013",
"crossfit|hypertrophy|beginner|pace|lowback/protect|sun|1013",
"home_basic|hypertrophy|beginner|pace|lowback/protect|sun|1013",
"minimal|hypertrophy|beginner|pace|lowback/protect|sun|1013",
"commercial|hypertrophy|beginner|pace|lowback/protect|sun|3039",
"commercial|hypertrophy|beginner|pace|knee/protect|sun|3039",
"home_full|hypertrophy|beginner|pace|lowback/protect|sun|3039",
"crossfit|hypertrophy|beginner|pace|lowback/protect|sun|3039",
"home_basic|hypertrophy|beginner|pace|lowback/protect|sun|3039",
"bodyweight|hypertrophy|beginner|pace|lowback/protect|sun|3039",
"bodyweight|hypertrophy|advanced|pace|knee/protect|sun|3039",
"minimal|hypertrophy|beginner|pace|lowback/protect|sun|3039"];
const BY={}; L.forEach(c=>BY[c.key]=c);

function part1(){
  console.log('\n######## PART 1 — the 14 fall-configs, week 1, BASE vs CF1 vs CF2 ########');
  console.log('oracle: coach\'s hand expectation = legs on the clean (no-cardio) day at cap 20 with Calves; pull on a walk day at cap 18.');
  const IAs={BASE:load(BASE),CF1:load(F_CF1),CF2:load(F_CF2)};
  const verdict={BASE:0,CF1:0,CF2:0};
  FALL14.forEach(key=>{
    const c=BY[key]; console.log('\n--- '+key+' ---');
    ['BASE','CF1','CF2'].forEach(v=>{
      const s=scan(IAs[v],c.cfg);
      const w1=Object.keys(s).filter(k=>s[k].w===1).sort((x,y)=>['sun','mon','tue','wed','thu','fri','sat'].indexOf(s[x].d)-['sun','mon','tue','wed','thu','fri','sat'].indexOf(s[y].d));
      const rows=w1.map(k=>{const r=s[k];
        return r.d+'{'+(r.hasCardio?r.csub:'-')+'|'+r.title.slice(0,34)+'|cap'+r.cap+(r.calves?'|CALVES':'')+'}';});
      // legs day = the day whose title/labels carry the squat/leg pattern; pull day likewise
      const legs=w1.filter(k=>/leg|squat|lower|hinge/i.test(s[k].title)||s[k].labels.some(x=>/^Leg superset/.test(x)));
      const pull=w1.filter(k=>/pull|back/i.test(s[k].title)||s[k].labels.some(x=>/^Pull superset|^Back/.test(x)));
      const legD=legs.map(k=>s[k].d+(s[k].hasCardio?'('+s[k].csub+',cap'+s[k].cap+(s[k].calves?',CALVES':',noCalves')+')':'(clean,cap'+s[k].cap+(s[k].calves?',CALVES':',noCalves')+')'));
      const pulD=pull.map(k=>s[k].d+(s[k].hasCardio?'('+s[k].csub+',cap'+s[k].cap+')':'(clean,cap'+s[k].cap+')'));
      const okLegs=legs.length===1&&!s[legs[0]].hasCardio&&s[legs[0]].cap===20&&s[legs[0]].calves;
      const okPull=pull.length===1&&s[pull[0]].hasCardio;
      if(okLegs&&okPull) verdict[v]++;
      console.log('  '+v.padEnd(4)+' '+rows.join(' '));
      console.log('       legs='+(legD.join(',')||'none')+'  pull='+(pulD.join(',')||'none')+'  -> coachExpect '+((okLegs&&okPull)?'MET':'NOT MET'));
    });
  });
  console.log('\nPART 1 VERDICT over 14 configs: BASE '+verdict.BASE+'/14  CF1 '+verdict.CF1+'/14  CF2 '+verdict.CF2+'/14');
}

function part5(){
  console.log('\n######## PART 5 — confinement (digest identity, CF vs shipped V205) ########');
  const IAs={BASE:load(BASE),CF1:load(F_CF1),CF2:load(F_CF2)};
  const mk=(goal,extra)=>({name:'M',primaryPath:goal?'cardio':'lift',cardioTypes:goal?['run']:[],
    cardioGoals:goal?{run:{id:goal,label:goal,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:false,raceDate:null,liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',
    equipment:'commercial',unit:'lbs',restDays:['sun'],days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:185,squat:225,deadlift:275,seed:1013,...(extra||{})});
  const race=(id)=>({...mk(id),primaryPath:'event',eventTargeted:true,raceDate:'2026-12-06'});
  const CASES=[
    ['run_base',mk('run_base')],
    ['run_base+lowback/protect',mk('run_base',{injury:{region:'lowback',tier:'protect'}})],
    ['run_5k(NRC)',race('run_5k')],['run_10k(NRC)',race('run_10k')],
    ['run_half(NRC)',race('run_half')],['run_marathon(NRC)',race('run_marathon')],
    ['run_half+knee/protect',{...race('run_half'),injury:{region:'knee',tier:'protect'}}],
    ['bike only',{...mk(null),primaryPath:'cardio',cardioTypes:['bike'],cardioGoals:{bike:{id:'bike_base',label:'bike'}}}],
    ['swim only',{...mk(null),primaryPath:'cardio',cardioTypes:['swim'],cardioGoals:{swim:{id:'swim_base',label:'swim'}}}],
    ['multi run+bike+swim',{...mk(null),primaryPath:'cardio',cardioTypes:['run','bike','swim'],
       cardioGoals:{run:{id:'run_base',label:'run'},bike:{id:'bike_base',label:'bike'},swim:{id:'swim_base',label:'swim'}}}],
    ['lift only',mk(null)],
    ['HALF_MANNY',fixtures.HALF_MANNY],
    ['pace (control, SHOULD move)',mk('run_pace_goal',{injury:{region:'lowback',tier:'protect'},experience:'beginner',liftingFocus:'hypertrophy'})],
  ];
  CASES.forEach(([n,cfg])=>{
    const d={}; ['BASE','CF1','CF2'].forEach(v=>{ try{ d[v]=progDigest(IAs[v].buildProgram(JSON.parse(JSON.stringify(cfg)))); }catch(e){ d[v]='ERR:'+e.message; } });
    console.log('  '+n.padEnd(30)+' BASE '+d.BASE+'  CF1 '+(d.CF1===d.BASE?'SAME':'MOVED '+d.CF1)+'  CF2 '+(d.CF2===d.BASE?'SAME':'MOVED '+d.CF2));
  });
}

function sweep(which,cb){
  const N=6, outs=[]; let live=N;
  for(let i=0;i<N;i++){ const of=path.join(SC,which+'_s'+i+'.json'); outs.push(of);
    try{fs.unlinkSync(of);}catch(e){}
    const ch=cp.spawn(process.execPath,[__filename,BASE,V204,'--shard',i+'/'+N,'--out',of,'--cf',which],
      {stdio:['ignore','ignore','inherit'],env:{...process.env,V205_SC:SC}});
    ch.on('close',()=>{ if(--live===0){
      const acc={cfgs:0,cells:0,fallsV204:0,risesV204:0,fallEg:[],riseInj:{},trimSec:{},trimCells:0,trimItems:0,
                 addSec:{},addCells:0,pullTrimSec:{},pullTrimCells:0,moved:[],speedless:0,speedlessCfg:[],shapeNull:0,
                 cellDiff:0,cfgDiff:0,byGoalDiff:{}};
      let bad=0;
      outs.forEach(f=>{ let j=null; try{j=JSON.parse(fs.readFileSync(f,'utf8'));}catch(e){}
        if(!j){bad++;return;}
        Object.keys(acc).forEach(k=>{ if(Array.isArray(acc[k])) acc[k]=acc[k].concat(j[k]||[]);
          else if(typeof acc[k]==='object'){ Object.keys(j[k]||{}).forEach(x=>acc[k][x]=(acc[k][x]||0)+j[k][x]); }
          else acc[k]+=(j[k]||0); }); });
      acc.__bad=bad; cb(acc); } });
  }
}

const PH2=process.argv.indexOf('--phase2')>0;
if(!PH2){
part1();
part5();
console.log('\n######## SWEEPS — lattice '+L.length+' configs ########');
sweep('cf1',a1=>{ sweep('cf2',a2=>{ sweep('base',a0=>{
  const P=(t,a)=>{
    console.log('\n--- '+t+' ---  dead shards: '+a.__bad+'  configs walked '+a.cfgs+'/'+L.length+'  day-cells compared vs V204: '+a.cells);
    console.log('  PART 2  E1g Calves FALLS vs V204: '+a.fallsV204+'   (examples: '+a.fallEg.slice(0,5).join(' ; ')+')');
    console.log('  PART 4  Calves RISES vs V204: '+a.risesV204+'  by injury '+JSON.stringify(a.riseInj));
    console.log('  PART 3  vs shipped V205: cells changed '+a.cellDiff+' over '+a.cells+', configs changed '+a.cfgDiff+'/'+a.cfgs+', by goal '+JSON.stringify(a.byGoalDiff));
    console.log('          items LOST '+a.trimItems+' on '+a.trimCells+' cells; by section '+JSON.stringify(a.trimSec));
    console.log('          items GAINED on '+a.addCells+' cells; by section '+JSON.stringify(a.addSec));
    console.log('          of the lost, on PULL-titled days: '+a.pullTrimCells+' cells; by section '+JSON.stringify(a.pullTrimSec));
    console.log('  moved examples: '); a.moved.slice(0,8).forEach(m=>console.log('     '+m));
  };
  P('CF1 (D131 as ruled)',a1); P('CF2 (D131 + legTaxing guard reordered)',a2); P('BASE vs BASE (identity control)',a0);
  console.log('\n######## PART 6 — speedless population (read off week-1 cardio subtypes on the SHIPPED build) ########');
  console.log('  configs whose week 1 has cardio but NO speed session: '+a0.speedless+' / '+a0.cfgs);
  console.log('  configs whose week 1 has cardio but NO legLoad (long) session: '+a0.shapeNull+' / '+a0.cfgs);
  a0.speedlessCfg.slice(0,25).forEach(s=>console.log('     '+s));
}); }); });
}

// ── PHASE 2 (node v205_d131_placement.js <base> <v204> --phase2) ─────────────
// Phase 1 showed CF1 is a no-op and CF2 moves falls the WRONG way. Phase 2 segments
// the CF2 falls and rises, and compares pull/legs ROLE-MATCHED (phase 1 compared
// day-matched, which is meaningless once the role rotation itself moves).
// Role is read from day.title against a hand list, not from dayRoles.

if(PH2){
  const ROLE_LEGS=/^(Legs|Posterior Chain|Legs \(spine-safe\)|Lower)/;
  const ROLE_PULL=/^Pull/;
  const ORD=['sun','mon','tue','wed','thu','fri','sat'];
  const IAs={BASE:load(BASE),CF2:load(F_CF2),V204:load(V204)};
  const AGG={};
  ['BASE','CF2'].forEach(v=>AGG[v]={fall:0,rise:0,fallSeg:{},riseSeg:{},
    pullCap:{},legsCap:{},pullItems:0,legsItems:0,pullDays:0,legsDays:0,
    pullOnWalk:0,legsOnWalk:0,pullCells:{},legsCells:{}});
  const pairs=[];
  L.forEach(c=>{
    let sB,sC,sV; try{ sB=scan(IAs.BASE,c.cfg); sC=scan(IAs.CF2,c.cfg); sV=scan(IAs.V204,c.cfg);}catch(e){return;}
    [['BASE',sB],['CF2',sC]].forEach(([v,s])=>{
      const A=AGG[v];
      Object.keys(s).forEach(k=>{ const r=s[k], o=sV[k]; if(!o) return;
        const seg=c.g+'|'+c.i+'|'+(r.hasCardio?r.csub:'clean')+'|'+ (ROLE_PULL.test(r.title)?'PULL': ROLE_LEGS.test(r.title)?'LEGS': r.title);
        if(!r.calves&&o.calves){ A.fall++; A.fallSeg[seg]=(A.fallSeg[seg]||0)+1; }
        if(r.calves&&!o.calves){ A.rise++; A.riseSeg[seg]=(A.riseSeg[seg]||0)+1; }
        if(ROLE_PULL.test(r.title)){ A.pullDays++; A.pullItems+=r.items.length; A.pullCap[r.cap]=(A.pullCap[r.cap]||0)+1; if(r.hasCardio)A.pullOnWalk++; A.pullCells[c.key+' '+k]=r.items.length+'@'+r.cap; }
        if(ROLE_LEGS.test(r.title)){ A.legsDays++; A.legsItems+=r.items.length; A.legsCap[r.cap]=(A.legsCap[r.cap]||0)+1; if(r.hasCardio)A.legsOnWalk++; A.legsCells[c.key+' '+k]=r.items.length+'@'+r.cap; }
      });
    });
  });
  const top=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>k+'='+v).join('  ');
  ['BASE','CF2'].forEach(v=>{ const A=AGG[v];
    console.log('\n===== '+v+' vs V204, role-matched =====');
    console.log(' Calves FALLS '+A.fall+'   top segments (goal|injury|cardio|role): '+top(A.fallSeg,14));
    console.log(' Calves RISES '+A.rise+'   top segments: '+top(A.riseSeg,10));
    console.log(' PULL days '+A.pullDays+'  items '+A.pullItems+'  avg '+(A.pullItems/A.pullDays).toFixed(3)+'  on a cardio day '+A.pullOnWalk+'  cap hist '+JSON.stringify(A.pullCap));
    console.log(' LEGS days '+A.legsDays+'  items '+A.legsItems+'  avg '+(A.legsItems/A.legsDays).toFixed(3)+'  on a cardio day '+A.legsOnWalk+'  cap hist '+JSON.stringify(A.legsCap));
  });
  // role-matched pull-day trim: same config+week, pull day in BASE vs pull day in CF2
  let trimmed=0, grew=0, same=0, deltaItems=0; const trimEg=[];
  const keysB=AGG.BASE.pullCells, keysC=AGG.CF2.pullCells;
  const byWk=(cells)=>{const m={};Object.keys(cells).forEach(k=>{const[cfg,cell]=k.split(' ');const w=cell.split('/')[0];m[cfg+'#'+w]=cells[k];});return m;};
  const mB=byWk(keysB), mC=byWk(keysC);
  Object.keys(mB).forEach(k=>{ if(!mC[k])return; const b=+mB[k].split('@')[0], c=+mC[k].split('@')[0];
    deltaItems+=(c-b); if(c<b){trimmed++; if(trimEg.length<6)trimEg.push(k+' '+mB[k]+' -> '+mC[k]);} else if(c>b)grew++; else same++; });
  console.log('\n===== PART 3 role-matched: the PULL day, BASE vs CF2, same config+week =====');
  console.log('  pull-days compared '+(trimmed+grew+same)+'   TRIMMED '+trimmed+'  GREW '+grew+'  unchanged '+same+'  net item delta '+deltaItems);
  trimEg.forEach(e=>console.log('    '+e));
  const mBL=byWk(AGG.BASE.legsCells), mCL=byWk(AGG.CF2.legsCells);
  let lt=0,lg=0,ls=0,ld=0; Object.keys(mBL).forEach(k=>{ if(!mCL[k])return; const b=+mBL[k].split('@')[0],c=+mCL[k].split('@')[0]; ld+=(c-b); if(c<b)lt++; else if(c>b)lg++; else ls++; });
  console.log('  legs-days compared '+(lt+lg+ls)+'   TRIMMED '+lt+'  GREW '+lg+'  unchanged '+ls+'  net item delta '+ld);
}
