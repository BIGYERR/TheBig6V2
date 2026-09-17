// Classify every LIFT difference on the WIDE lattice (V197 vs V196) by section label,
// separating REMOVALS (present V196, absent V197) from ARRIVALS. A removal in any label
// that no ruling asked for is a red result.
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const SEP='@@';
const A=load('/Users/CanasBangin/Desktop/TheBig6V2/index.html');
const B=load('/tmp/gk2_base_V196.html');
const TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const FOCUS=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS=['beginner','intermediate','advanced'];
const GOALS=[{k:'liftonly',id:null},{k:'base',id:'run_base'},{k:'pace',id:'run_pace_goal'},
             {k:'5k',id:'run_5k'},{k:'10k',id:'run_10k'},{k:'half',id:'run_half'}];
const INJ=[{k:'healthy',v:null},{k:'knee/protect',v:['knee','protect']},{k:'lowback/protect',v:['lowback','protect']}];
const RESTS=[['sun'],['sun','wed'],['sat','sun','wed']];
const SEEDS=[11,1013,76308];
function cfgOf(t,f,x,g,i,r,sd){const race=!!g.id&&/5k|10k|half|marathon/.test(g.id);
 return {name:'M',primaryPath:g.id?(race?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
  cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
  eventTargeted:race,raceDate:race?'2026-12-06':null,liftingFocus:f,experience:x,ageBracket:'18-35',
  equipment:t,unit:'lbs',restDays:r.slice(),days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135,squat:155,deadlift:185,seed:sd,...(i.v?{injury:{region:i.v[0],tier:i.v[1]}}:{})};}
function scan(IA,cfg){const p=IA.buildProgram(cfg),W=p.weeks||{},o={};
 Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{const day=W[w][d];if(!day||day.rest)return;
  const pairs=[];(day.sections||[]).forEach(s=>{const L=String(s.label||'');
   (s.items||[]).forEach(it=>pairs.push(L+SEP+String((it&&it.name)||'')+SEP+String((it&&it.detail)||'')));});
  o[w+'/'+d]=pairs;}));return o;}
let cfgs=0,diffCfg=0,cells=0,diffCells=0;
const removedByLabel={}, arrivedByLabel={}, removedNames={};
for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)
 for(const i of INJ)for(const r of RESTS)for(const sd of SEEDS){
  const cfg=cfgOf(t,f,x,g,i,r,sd); cfgs++;
  let sa,sb; try{sa=scan(A,cfg);sb=scan(B,cfg);}catch(e){continue;}
  let any=false;
  for(const dk in sa){const a=sa[dk],b=sb[dk];if(!b)continue;cells++;
    if(a.join('|')===b.join('|'))continue; any=true; diffCells++;
    const A1=new Set(a),B1=new Set(b);
    b.forEach(p=>{if(A1.has(p))return;const q=p.split(SEP);
      removedByLabel[q[0]]=(removedByLabel[q[0]]||0)+1;
      removedNames[q[0]+' :: '+q[1]]=(removedNames[q[0]+' :: '+q[1]]||0)+1;});
    a.forEach(p=>{if(B1.has(p))return;const q=p.split(SEP);
      arrivedByLabel[q[0]]=(arrivedByLabel[q[0]]||0)+1;});
  }
  if(any)diffCfg++;
 }
const srt=o=>Object.keys(o).sort((x,y)=>o[y]-o[x]).map(k=>'      '+String(o[k]).padStart(6)+'  '+k).join('\n');
console.log('WIDE LATTICE  configs '+cfgs+'  differing configs '+diffCfg+'  day-cells '+cells+'  differing cells '+diffCells);
console.log('\nREMOVED triples by section label (present V196, absent V197):');
console.log(Object.keys(removedByLabel).length?srt(removedByLabel):'      (none)');
console.log('\nARRIVED triples by section label (absent V196, present V197):');
console.log(Object.keys(arrivedByLabel).length?srt(arrivedByLabel):'      (none)');
console.log('\nREMOVED movement names (top 25):');
console.log(Object.keys(removedNames).length?srt(removedNames).split('\n').slice(0,25).join('\n'):'      (none)');
