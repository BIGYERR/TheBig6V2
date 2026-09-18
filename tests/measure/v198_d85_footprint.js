// v198_d85_footprint.js — BUILDER SANITY FOOTPRINT for D85 (read-only).
// Builds the D85 lattice on the baseline and on the V198 artifact, compares the SHIPPED
// card of every day cell, and counts over-cap cells on the budget's OUTPUT against the
// interference-ADJUSTED cap (index.html:9424), so the number is comparable to the
// before figure of 4,425.
//
// ORACLE NOTE: the posterior classifier here is a HAND regex over {hinge, hip_ext} ONLY.
// It deliberately does NOT include leg_iso (Leg extension / Leg press live in the same
// EXLIB bucket as Lying leg curl), which is the defect in the measure pass's E_POSTERIOR.
//
// usage: node tests/measure/v198_d85_footprint.js <base.html> <new.html> [shards]
const path=require('path'), fs=require('fs'), os=require('os'), {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));

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
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',
      baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,
    liftingFocus:focus,experience:exp,ageBracket:'18-35',
    equipment:tier,unit:'lbs',restDays:rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135,squat:155,deadlift:185,seed};
}
const LAT=[];
for(const t of E_TIERS) for(const f of E_FOCUS) for(const x of E_EXPS) for(const g of E_GOALS)
 for(const i of E_INJ) for(const r of E_RESTS) for(const sd of E_SEEDS){
   const c=eCfg(t,f,x,g,i,r,sd); if(i.v) c.injury={region:i.v.region,tier:i.v.tier};
   LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,tier:t,focus:f,exp:x,goal:g.k,inj:i.k,seed:sd,cfg:c});
 }

// hand oracle: {hinge, hip_ext} only
const R_HINGE=/deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i;
const R_HIPEXT=/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i;
const isPost=n=>{const t=String(n||''); return R_HIPEXT.test(t)||R_HINGE.test(t);};
const eSets=d=>{const m=String(d||'').match(/(\d+)\s*[×x]/); return m?Math.max(1,parseInt(m[1],10)):3;};
const eStretch=n=>/stretch|mobility|90\/90|foam|worlds greatest/i.test(n||'');
const eHalf=n=>/carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i.test(n||'');
const eCost=items=>items.reduce((a,it)=>a+(eStretch(it.n)?0:(eHalf(it.n)?eSets(it.d)*0.5:eSets(it.d))),0);
const LEG_MOVE=/squat|lunge|step-?up|leg press|deadlift|hip thrust|glute|hamstring|leg curl|leg extension|calf|calves|wall sit|nordic|split squat|bridge|\bswing\b|good morning|romanian|back extension|hip airplane/i;

const CALLSITE="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });\n";
const CALLSITE_REC="    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){ var __mb=_day.sections; _day.sections=capSessionBudget(_day.sections,_day.cardio); if(typeof globalThis!=='undefined'&&globalThis.__MREC) globalThis.__MREC.push({w:String(w),d:String(_d),after:_day.sections,cardio:_day.cardio}); } });\n";
function instrument(artifact,tag){
  const RAW=fs.readFileSync(artifact,'utf8');
  const n=RAW.split(CALLSITE).length-1;
  if(n!==1){console.log('FAIL: call-site anchor count='+n+' in '+artifact);process.exit(5);}
  const out=path.join(os.tmpdir(),'v198f_'+tag+'_'+process.pid+'.html');
  fs.writeFileSync(out,RAW.replace(CALLSITE,CALLSITE_REC));
  return out;
}
function snapNames(sections){
  const names=[],items=[];
  (sections||[]).forEach(sec=>((sec&&sec.items)||[]).forEach(it=>{
    const n=String((it&&it.name)||''); names.push(n+'#'+String((it&&it.detail)||''));
    items.push({n,d:String((it&&it.detail)||'')});}));
  return {names,items};
}
function sweep(artifact,tag,mine){
  const IA=load(instrument(artifact,tag));
  IA.eval("globalThis.__MREC=[]; var __INTERF=function(c){try{return _cardioInterference(c);}catch(e){return 0;}};");
  const INTERF=IA.eval('__INTERF');
  const CAP=parseInt((IA.html.match(/const SESSION_SET_BUDGET = (\d+);/)||[])[1],10);
  const cells={}; const budget={}; const legCell={}; const R={dayCells:0,overCapAdj:0,overCapFlat:0,overCapShippedAdj:0,legDays:0,legDayPostFree:0};
  mine.forEach(L=>{
    IA.eval('globalThis.__MREC.length=0;');
    const prog=IA.buildProgram(L.cfg);
    const REC=IA.eval('globalThis.__MREC');
    const by=new Map(); REC.forEach(r=>by.set(r.w+'/'+r.d,r));
    const W=prog.weeks||{};
    Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{
      const day=W[w][d]; if(!day||day.rest||!Array.isArray(day.sections)) return;
      R.dayCells++;
      const sh=snapNames(day.sections);
      cells[L.key+'@'+w+'/'+d]=sh.names.join('|');
      if(sh.items.some(it=>LEG_MOVE.test(it.n))){ R.legDays++; if(!sh.items.some(it=>isPost(it.n))) R.legDayPostFree++; }
      const rec=by.get(String(w)+'/'+String(d)); if(!rec) return;
      const cap=Math.max(12,CAP-Math.round(INTERF(rec.cardio)*2));
      const af=snapNames(rec.after);
      budget[L.key+'@'+w+'/'+d]=af.names.join('|');
      const labs=(rec.after||[]).map(sec=>String((sec&&sec.label)||''));
      if(labs.indexOf('Calves')>=0||labs.indexOf('Leg isolation')>=0) legCell[L.key+'@'+w+'/'+d]=1;
      if(eCost(af.items)>cap) R.overCapAdj++;
      if(eCost(af.items)>CAP) R.overCapFlat++;
      if(eCost(sh.items)>cap) R.overCapShippedAdj++;
    }));
  });
  return {R,cells,budget,legCell};
}

const BASE=process.argv[2], NEW=process.argv[3];
const SH=parseInt(process.argv[4]||String(Math.min(6,os.cpus().length)),10);
if(process.env.V198F_SHARD!==undefined){
  const i=parseInt(process.env.V198F_SHARD,10);
  const mine=LAT.filter((_,k)=>k%SH===i);
  const b=sweep(BASE,'b'+i,mine), n=sweep(NEW,'n'+i,mine);
  const keys=Object.keys(b.cells);
  let changed=0, budChanged=0, budChangedLeg=0, shipChangedLeg=0; const segInj={}, segTier={};
  keys.forEach(k=>{ if(b.cells[k]!==n.cells[k]){ changed++;
    const inj=k.split('|')[4], tier=k.split('|')[0];
    segInj[inj]=(segInj[inj]||0)+1; segTier[tier]=(segTier[tier]||0)+1;
    if(b.legCell[k]||n.legCell[k]) shipChangedLeg++; }
   if(b.budget[k]!==n.budget[k]){ budChanged++; if(b.legCell[k]||n.legCell[k]) budChangedLeg++; }});
  process.send({changed,budChanged,budChangedLeg,shipChangedLeg,keys:keys.length,segInj,segTier,base:b.R,nw:n.R});
  process.exit(0);
}
let done=0; const A={changed:0,budChanged:0,budChangedLeg:0,shipChangedLeg:0,keys:0,segInj:{},segTier:{},base:{},nw:{}};
const merge=(o,s)=>{Object.keys(s||{}).forEach(k=>o[k]=(o[k]||0)+s[k]);};
for(let i=0;i<SH;i++){
  const c=fork(__filename,[BASE,NEW,String(SH)],{env:Object.assign({},process.env,{V198F_SHARD:String(i)})});
  c.on('message',m=>{A.changed+=m.changed;A.budChanged+=m.budChanged;A.budChangedLeg+=m.budChangedLeg;A.shipChangedLeg+=m.shipChangedLeg;A.keys+=m.keys;merge(A.segInj,m.segInj);merge(A.segTier,m.segTier);
    merge(A.base,m.base);merge(A.nw,m.nw);});
  c.on('exit',code=>{ if(code!==0){console.log('shard '+i+' exit '+code);process.exit(code);}
    if(++done===SH){
      console.log('── D85 FOOTPRINT ──────────────────────────────');
      console.log('configs '+LAT.length+' | day cells compared '+A.keys);
      console.log('CHANGED CELLS '+A.changed+'  ('+(100*A.changed/A.keys).toFixed(2)+'%)');
      console.log('budget-OUT changed cells '+A.budChanged+' | of those in a label-keyed leg cell '+A.budChangedLeg);
      console.log('shipped changed cells in a label-keyed leg cell '+A.shipChangedLeg);
      console.log('by injury: '+JSON.stringify(A.segInj));
      console.log('by tier  : '+JSON.stringify(A.segTier));
      console.log('over-cap (budget OUT vs ADJUSTED cap):  base '+A.base.overCapAdj+'  ->  V198 '+A.nw.overCapAdj);
      console.log('over-cap (budget OUT vs FLAT 20)     :  base '+A.base.overCapFlat+'  ->  V198 '+A.nw.overCapFlat);
      console.log('over-cap (SHIPPED card vs ADJ cap)   :  base '+A.base.overCapShippedAdj+'  ->  V198 '+A.nw.overCapShippedAdj);
      console.log('leg days '+A.base.legDays+' -> '+A.nw.legDays+' | posterior-free leg days '+A.base.legDayPostFree+' -> '+A.nw.legDayPostFree);
    }});
}
