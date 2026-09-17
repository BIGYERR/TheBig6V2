// gatekeeper: classify EVERY moved (label,name,detail) triple V197 vs V196 that is not
// Calves / Leg isolation. Which names left, which arrived, on which tier, and does the
// departure fall inside D70b's ruled gear denial?
const fs=require('fs');
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const SEP='@@';
const IA_A=load('/Users/CanasBangin/Desktop/TheBig6V2/index.html');
const IA_B=load('/tmp/gk2_base_V196.html');
const TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const FOCUS=['hypertrophy','balanced'], EXPS=['beginner','advanced'];
const GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:['shoulder','protect']},
           {k:'lowback/protect',v:['lowback','protect']},{k:'knee/protect',v:['knee','protect']}];
const RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const SEEDS=[1013,3039];
function cfgOf(t,f,x,g,i,r,sd){const race=!!g.id&&/5k|10k|half|marathon/.test(g.id);
 return {name:'M',primaryPath:g.id?(race?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
  cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
  eventTargeted:race,raceDate:race?'2026-12-06':null,liftingFocus:f,experience:x,ageBracket:'18-35',
  equipment:t,unit:'lbs',restDays:r.v.slice(),days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135,squat:155,deadlift:185,seed:sd,...(i.v?{injury:{region:i.v[0],tier:i.v[1]}}:{})};}
const L=[];
for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)
 for(const i of INJ)for(const r of RESTS)for(const sd of SEEDS)
  L.push({tier:t,cfg:cfgOf(t,f,x,g,i,r,sd)});
function scan(IA,cfg){const p=IA.buildProgram(cfg),W=p.weeks||{},o={};
 Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{const day=W[w][d];if(!day||day.rest)return;
  const pairs=[];(day.sections||[]).forEach(s=>{const L2=String(s.label||'');
   (s.items||[]).forEach(it=>pairs.push(L2+SEP+String((it&&it.name)||'')+SEP+String((it&&it.detail)||'')));});
  o[w+'/'+d]=pairs;}));return o;}
// D70b's ruled denial, by the hand gear table (same shape g197 uses)
const NEEDS=[['machine',/\bmachine\b|hack squat|\bsmith\b|pec deck|\bleg press\b|leg extension|lying leg curl|seated leg curl|preacher/i],
 ['cable',/\bcable\b|pulldown|\brope\b|face pull/i],['barbell',/\bbarbell\b|trap bar|power clean|hang clean|\brack pull\b|back squat|front squat|^bench press$|good morning|landmine|glute-ham/i],
 ['dumbbell',/\bdumbbell\b|\bdb\b|goblet/i],['kettlebell',/kettlebell|\(kb\)|\bkb\b/i],['band',/(?<!it )\bband(ed)?\b|resistance band|trx/i],
 ['medball',/med ball|medicine ball|wall ball|ball slams/i],['pullbar',/hanging|toes-to-bar|garhammer|chinup|chin-up|pullup|pull-up|muscle-?up|\bl-sit\b/i],
 ['loadobj',/\bweighted\b|\bloaded\b|farmer carry|suitcase carry|overhead carry/i]];
const OWNS={home_full:['barbell','dumbbell','kettlebell','band','pullbar','loadobj'],
 home_basic:['dumbbell','kettlebell','band','pullbar','loadobj'],
 commercial:['machine','cable','barbell','dumbbell','kettlebell','band','pullbar','medball','loadobj'],
 crossfit:['barbell','dumbbell','kettlebell','band','pullbar','medball','loadobj'],
 bodyweight:['pullbar'],minimal:['dumbbell','kettlebell','loadobj']};
const illegal=(n,t)=>{const o=OWNS[t]||[];for(const nr of NEEDS){if(nr[1].test(n)&&o.indexOf(nr[0])<0)return nr[0];}return null;};
const left={},arrived={},leftIllegal={},arrivedIllegal={};
for(const c of L){let A,B;try{A=scan(IA_A,c.cfg);B=scan(IA_B,c.cfg);}catch(e){continue;}
 for(const dk in A){const a=A[dk],b=B[dk];if(!b)continue;
  const sa=new Set(a),sb=new Set(b);
  b.forEach(t=>{if(sa.has(t))return;const p=t.split(SEP);if(p[0]==='Calves'||p[0]==='Leg isolation')return;
    const k=p[0]+' :: '+p[1];left[k]=(left[k]||0)+1;const ill=illegal(p[1],c.tier);
    if(ill)leftIllegal[c.tier+' '+k+' (needs '+ill+')']=(leftIllegal[c.tier+' '+k+' (needs '+ill+')']||0)+1;});
  a.forEach(t=>{if(sb.has(t))return;const p=t.split(SEP);if(p[0]==='Calves'||p[0]==='Leg isolation')return;
    const k=p[0]+' :: '+p[1];arrived[k]=(arrived[k]||0)+1;const ill=illegal(p[1],c.tier);
    if(ill)arrivedIllegal[c.tier+' '+k+' (needs '+ill+')']=(arrivedIllegal[c.tier+' '+k+' (needs '+ill+')']||0)+1;});
 }}
const show=(t,o)=>{const k=Object.keys(o).sort((x,y)=>o[y]-o[x]);
 console.log('\n'+t+' ('+k.length+' distinct, '+k.reduce((a,x)=>a+o[x],0)+' occurrences)');
 k.slice(0,40).forEach(x=>console.log('   '+String(o[x]).padStart(5)+'  '+x));};
show('LEFT the card in V197 (present V196, absent V197), outside Calves/Leg isolation',left);
show('ARRIVED in V197 (absent V196), outside Calves/Leg isolation',arrived);
show('...of those LEFT, ILLEGAL for their tier by the hand gear table (D70b ruled denial)',leftIllegal);
show('...of those ARRIVED, ILLEGAL for their tier (MUST BE EMPTY)',arrivedIllegal);
