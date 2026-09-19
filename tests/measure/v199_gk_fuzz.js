// gatekeeper differential fuzz: V198 vs V199, keyed on (week, day, label, movement)
const path=require('path'), H=require(path.join(__dirname,'..','harness'));
const BASE=process.argv[2], CAND=process.argv[3];
const TIERS=['commercial','home_full','home_basic','bodyweight','crossfit','minimal'];
const FOCUS=['hypertrophy','balanced','strength'], EXPS=['beginner','intermediate','advanced'];
const GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'mile',id:'run_mile_goal'},
             {k:'half',id:'run_half'},{k:'5k',id:'run_5k'},{k:'marathon',id:'run_marathon'}];
const RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const SEEDS=[1013,3039,7717];
function cfg(t,f,x,g,r,seed){
  const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:f,experience:x,
    ageBracket:'18-35',equipment:t,unit:'lbs',restDays:r.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
}
const LAT=[];
for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const r of RESTS)for(const sd of SEEDS)
  LAT.push({key:`${t}|${f}|${x}|${g.k}|${r.k}|${sd}`,cfg:cfg(t,f,x,g,r,sd)});
function dump(V,c){
  const p=V.buildProgram(JSON.parse(JSON.stringify(c))); const rows=new Map();
  const W=p.weeks||{};
  Object.keys(W).forEach(wi=>Object.keys(W[wi]||{}).forEach(di=>{
    const d=W[wi][di]; ((d&&d.sections)||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{
      const k=`${wi}|${di}|${(s&&s.label)||''}|${(it&&it.name)||''}`;
      rows.set(k,(rows.get(k)||0)+1); }));
  }));
  return rows;
}
const B=H.load(BASE), C=H.load(CAND), B2=H.load(BASE);
let self=0, diffCells=0, classes={}, unclassified=[], cells=0, sessions=0;
const LEGA='Leg superset A', LEGB='Leg superset B', LEGISO='Leg isolation', EXPF='Explosive finisher';
for(const L of LAT){
  cells++;
  const b=dump(B,L.cfg), b2=dump(B2,L.cfg), c=dump(C,L.cfg);
  sessions+=b.size;
  // baseline self-identity FIRST
  let sd=0; const bk=new Set([...b.keys(),...b2.keys()]);
  for(const k of bk) if((b.get(k)||0)!==(b2.get(k)||0)) sd++;
  if(sd){ self+=sd; continue; }
  const all=new Set([...b.keys(),...c.keys()]);
  for(const k of all){
    const bv=b.get(k)||0, cv=c.get(k)||0; if(bv===cv) continue;
    diffCells++;
    const label=k.split('|')[2];
    let cl=null;
    if(label===LEGA) cl='D91 swap: Leg superset A no longer the first-come survivor';
    else if(label===LEGB) cl='D91 swap: Leg superset B survives as the posterior pick';
    else if(label===LEGISO) cl='D91 arbitration: Leg isolation loses the accessory slot';
    else if(label===EXPF) cl='D91 arbitration: Explosive finisher (fluff) census shift';
    if(cl){ classes[cl]=(classes[cl]||0)+1; }
    else { unclassified.push(k); classes['UNCLASSIFIED']=(classes['UNCLASSIFIED']||0)+1; }
  }
}
console.log('cells='+cells+' sessions(key-rows)='+sessions+' baseline-self-identity-violations='+self);
console.log('diff cells='+diffCells);
console.log('classes='+JSON.stringify(classes,null,1));
console.log('unclassified sample='+JSON.stringify(unclassified.slice(0,15),null,1));
