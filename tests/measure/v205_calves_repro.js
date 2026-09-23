// MEASURE v205 — Calves E1g RED. Phase 1: reproduce at the reporter's seed, then
// name the deleting pass by toggling the engine's own per-pass bypasses.
// Oracle for "which pass": the pass bypass flags (__CAP_OFF/__REGIONAL_OFF/__DELOAD_OFF)
// are independent of any hypothesis about WHY — they only turn a pass off.
const path=require('path');
const {load}=require(path.resolve(__dirname,'..','harness.js'));
const A=process.argv[2], B=process.argv[3];
function cfg(seed,inj,rest,tier,focus,exp,goal){
  const isRace=!!goal&&/5k|10k|half|marathon/.test(goal);
  return {name:'M',primaryPath:goal?(isRace?'event':'cardio'):'lift',cardioTypes:goal?['run']:[],
    cardioGoals:goal?{run:{id:goal,label:goal,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,ageBracket:'18-35',
    equipment:tier,unit:'lbs',restDays:rest.slice(),days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135,squat:155,deadlift:185,seed,...(inj?{injury:inj}:{})};
}
const REPRO=s=>cfg(s,{region:'lowback',tier:'protect'},['sun'],'commercial','hypertrophy','beginner','run_pace_goal');
function dump(IA,c,label){
  const p=IA.buildProgram(c),W=p.weeks||{},rows=[];
  Object.keys(W).sort((a,b)=>+a-+b).forEach(w=>Object.keys(W[w]).forEach(d=>{
    const day=W[w][d]; if(!day||day.rest) return;
    const ca=day.cardio||null;
    rows.push({k:w+'/'+d,w:+w,d,title:day.title||'',
      labels:(day.sections||[]).map(s=>String(s.label||'')),
      secs:(day.sections||[]).map(s=>String(s.label||'')+'['+(s.items||[]).map(i=>String(i.name)+' @'+String(i.detail||'')).join(', ')+']'),
      cty:ca?ca.type:'',csub:ca?String(ca.subtype||''):'',cdet:ca?String(ca.detail||''):'',
      cat:ca?String(ca.assignedType||''):'',cll:ca?!!ca.legLoad:false,
      interf:ca?IA.eval('_cardioInterference')(ca):0});
  }));
  return rows;
}
const IAa=load(A), IAb=load(B);
console.log('A(under test)='+IAa.version+'  B(baseline)='+IAb.version);
for(const seed of [1013,3039]){
  const c=REPRO(seed);
  const a=dump(IAa,c), b=dump(IAb,c);
  const bm={}; b.forEach(r=>bm[r.k]=r);
  const fell=a.filter(r=>bm[r.k]&&bm[r.k].labels.indexOf('Calves')>=0&&r.labels.indexOf('Calves')<0);
  console.log('\n=== seed '+seed+' : day-cells '+a.length+' , Calves fell on '+fell.length+' ===');
  fell.slice(0,3).forEach(r=>{
    const o=bm[r.k];
    console.log('  cell '+r.k+'  title='+r.title);
    console.log('   V'+IAb.version+' cardio: type='+o.cty+' sub="'+o.csub+'" assigned='+o.cat+' legLoad='+o.cll+' interf='+o.interf+' cap='+Math.max(12,20-Math.round(o.interf*2)));
    console.log('   V'+IAa.version+' cardio: type='+r.cty+' sub="'+r.csub+'" assigned='+r.cat+' legLoad='+r.cll+' interf='+r.interf+' cap='+Math.max(12,20-Math.round(r.interf*2)));
    console.log('   V'+IAb.version+' detail: '+o.cdet);
    console.log('   V'+IAa.version+' detail: '+r.cdet);
    console.log('   V'+IAb.version+' sections: '+o.secs.join(' | '));
    console.log('   V'+IAa.version+' sections: '+r.secs.join(' | '));
  });
  // ---- name the pass: turn each off on the ARTIFACT UNDER TEST and re-scan the same cells
  const keys=fell.map(r=>r.k);
  for(const flag of ['__CAP_OFF','__REGIONAL_OFF','__DELOAD_OFF','__CORE_OFF']){
    const IAx=load(A); IAx.eval('globalThis.'+flag+'=true');
    const x=dump(IAx,c); const xm={}; x.forEach(r=>xm[r.k]=r);
    const back=keys.filter(k=>xm[k]&&xm[k].labels.indexOf('Calves')>=0).length;
    console.log('  with '+flag+'=true on V'+IAa.version+': Calves present again on '+back+'/'+keys.length+' of the fallen cells');
  }
}
