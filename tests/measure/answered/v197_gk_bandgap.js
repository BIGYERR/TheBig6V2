// Is the band-on-minimal legality gap PRE-EXISTING (V196) or INTRODUCED by V197?
// Count total occurrences per artifact, per section label, on the minimal tier.
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const A=load('/Users/CanasBangin/Desktop/TheBig6V2/index.html');
const B=load('/tmp/gk2_base_V196.html');
const FOCUS=['hypertrophy','balanced'], EXPS=['beginner','advanced'];
const GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:['shoulder','protect']},
           {k:'lowback/protect',v:['lowback','protect']},{k:'knee/protect',v:['knee','protect']}];
const RESTS=[['sun'],['sun','wed'],['sat','sun']]; const SEEDS=[1013,3039];
function cfgOf(t,f,x,g,i,r,sd){const race=!!g.id&&/5k|10k|half|marathon/.test(g.id);
 return {name:'M',primaryPath:g.id?(race?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
  cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
  eventTargeted:race,raceDate:race?'2026-12-06':null,liftingFocus:f,experience:x,ageBracket:'18-35',
  equipment:t,unit:'lbs',restDays:r.slice(),days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135,squat:155,deadlift:185,seed:sd,...(i.v?{injury:{region:i.v[0],tier:i.v[1]}}:{})};}
const BAND=/\bband(ed)?\b|resistance band|\btrx\b/i;
for(const tier of ['minimal','bodyweight']){
  const res={};
  for(const kv of [['V197',A],['V196',B]]){
    const nm=kv[0], IA=kv[1]; let cells=0, hits=0; const byName={}, byLabel={};
    for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)
      for(const r of RESTS)for(const sd of SEEDS){
        let p; try{p=IA.buildProgram(cfgOf(tier,f,x,g,i,r,sd));}catch(e){continue;}
        const W=p.weeks||{};
        Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{const day=W[w][d];if(!day||day.rest)return;cells++;
          (day.sections||[]).forEach(s=>{const L=String(s.label||'');
            (s.items||[]).forEach(it=>{const n=String((it&&it.name)||'');
              if(BAND.test(n)){hits++;byName[n]=(byName[n]||0)+1;byLabel[L]=(byLabel[L]||0)+1;}});});}));
      }
    res[nm]={cells,hits,byName,byLabel};
  }
  console.log('\n===== tier '+tier+' (owns no bands: index.html:8823/8829) =====');
  for(const nm of ['V196','V197']) console.log('  '+nm+': '+res[nm].hits+' band items over '+res[nm].cells+' day-cells   byLabel='+JSON.stringify(res[nm].byLabel));
  console.log('  V196 names: '+JSON.stringify(res.V196.byName));
  console.log('  V197 names: '+JSON.stringify(res.V197.byName));
  const newNames=Object.keys(res.V197.byName).filter(n=>!res.V196.byName[n]);
  console.log('  names present in V197 but NEVER in V196: '+JSON.stringify(newNames));
}
