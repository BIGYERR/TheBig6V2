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
const LAT=[];for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const r of RESTS)for(const sd of SEEDS)LAT.push({t,cfg:cfg(t,f,x,g,r,sd)});
const ACC=/^(Leg superset [AB]|Leg|Leg isolation|Pull superset [AB]|Push superset [AB])$/;
function census(V,c){const p=V.buildProgram(JSON.parse(JSON.stringify(c)));const W=p.weeks||{};const out=[];
  Object.keys(W).forEach(wi=>Object.keys(W[wi]||{}).forEach(di=>{const d=W[wi][di];
    const labs=((d&&d.sections)||[]).map(s=>String((s&&s.label)||''));
    out.push({key:wi+'|'+di,labs,acc:labs.filter(l=>ACC.test(l))});}));return out;}
let gained=0,lost=0,cards=0,totB=0,totC=0,renamed=0,tierGain={},ex=[];
for(const L of LAT){const b=census(B,L.cfg), c=census(C,L.cfg);
  for(let i=0;i<b.length;i++){cards++;const nb=b[i].acc.length, nc=c[i].acc.length;
    totB+=nb; totC+=nc;
    if(nc>nb){gained++;tierGain[L.t]=(tierGain[L.t]||0)+1;if(ex.length<5)ex.push({tier:L.t,key:b[i].key,v198:b[i].acc,v199:c[i].acc});}
    if(nc<nb)lost++;
    if(nb===nc&&b[i].acc.join(',')!==c[i].acc.join(','))renamed++;}}
console.log('cards='+cards);
console.log('TOTAL surviving accessory blocks (Leg*/Pull*/Push*): V198 '+totB+' -> V199 '+totC+'   delta '+(totC-totB));
console.log('cards that GAINED a block = '+gained+'   cards that LOST a block = '+lost+'   same-count-but-swapped = '+renamed);
console.log('gains by tier = '+JSON.stringify(tierGain));
console.log('examples = '+JSON.stringify(ex,null,1));
