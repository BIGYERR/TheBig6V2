const path=require('path'), H=require(path.join(__dirname,'..','harness'));
const B=H.load(process.argv[2]), C=H.load(process.argv[3]);
const TIERS=['commercial','home_full','home_basic','bodyweight','crossfit','minimal'];
const FOCUS=['hypertrophy','balanced','strength'], EXPS=['beginner','intermediate','advanced'];
const GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'mile',id:'run_mile_goal'},
             {k:'half',id:'run_half'},{k:'5k',id:'run_5k'},{k:'marathon',id:'run_marathon'}];
const RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const SEEDS=[1013,3039,7717];
function cfg(t,f,x,g,r,seed){const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:f,experience:x,ageBracket:'18-35',
    equipment:t,unit:'lbs',restDays:r.v.slice(),days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};}
const LAT=[];for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const r of RESTS)for(const sd of SEEDS)LAT.push(cfg(t,f,x,g,r,sd));
function secCensus(V,c){const p=V.buildProgram(JSON.parse(JSON.stringify(c)));const W=p.weeks||{};const out=[];
  Object.keys(W).forEach(wi=>Object.keys(W[wi]||{}).forEach(di=>{const d=W[wi][di];
    out.push({wi,di,labels:((d&&d.sections)||[]).map(s=>String((s&&s.label)||''))});}));return out;}
const CNT={b:{},c:{}}; let pullSwapCards=0, pullNonDeloadMoves=0, cards=0, otherLabelMoves={};
for(const cf of LAT){const b=secCensus(B,cf), c=secCensus(C,cf);
  for(let i=0;i<b.length;i++){cards++;const bl=b[i].labels, cl=c[i].labels;
    bl.forEach(l=>CNT.b[l]=(CNT.b[l]||0)+1); cl.forEach(l=>CNT.c[l]=(CNT.c[l]||0)+1);
    if(bl.join('|')===cl.join('|')) continue;
    const gone=bl.filter(l=>!cl.includes(l)), got=cl.filter(l=>!bl.includes(l));
    const isPull=gone.some(l=>/^Pull superset/.test(l))||got.some(l=>/^Pull superset/.test(l));
    if(isPull) pullSwapCards++;
    [...gone,...got].forEach(l=>{ if(!/^(Leg superset|Leg isolation|Explosive finisher|Pull superset)/.test(l)) otherLabelMoves[l]=(otherLabelMoves[l]||0)+1; });
  }}
const L=['Leg superset A','Leg superset B','Pull superset A','Pull superset B','Leg isolation','Explosive finisher','Push superset A','Push superset B'];
console.log('cards compared = '+cards);
L.forEach(l=>console.log(('  '+l).padEnd(26)+' V198 '+String(CNT.b[l]||0).padStart(7)+'  -> V199 '+String(CNT.c[l]||0).padStart(7)+'   delta '+((CNT.c[l]||0)-(CNT.b[l]||0))));
console.log('  LEG A+B  V198 '+((CNT.b['Leg superset A']||0)+(CNT.b['Leg superset B']||0))+' -> V199 '+((CNT.c['Leg superset A']||0)+(CNT.c['Leg superset B']||0)));
console.log('  PULL A+B V198 '+((CNT.b['Pull superset A']||0)+(CNT.b['Pull superset B']||0))+' -> V199 '+((CNT.c['Pull superset A']||0)+(CNT.c['Pull superset B']||0)));
console.log('pull-involved changed cards = '+pullSwapCards);
console.log('changed labels OUTSIDE {Leg superset*, Leg isolation, Explosive finisher, Pull superset*} = '+JSON.stringify(otherLabelMoves));
