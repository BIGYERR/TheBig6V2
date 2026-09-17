// Isolate the 7 Leg superset B removals on the wide lattice: which configs, which slice
// causes them (D84 alone vs slices 1-4), and is the resulting card posterior-free?
const fs=require('fs'), path=require('path'), os=require('os');
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const SEP='@@';
const CAND='/Users/CanasBangin/Desktop/TheBig6V2/index.html';
const RAW=fs.readFileSync(CAND,'utf8');
const CALF="        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});\n";
const ISO ="        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});\n";
const PRE=path.join(os.tmpdir(),'gk2_pre_7.html');
fs.writeFileSync(PRE, RAW.replace(CALF+ISO, ISO+CALF));
const A=load(CAND), B=load('/tmp/gk2_base_V196.html'), P=load(PRE);
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
  const pairs=[],names=[];(day.sections||[]).forEach(s=>{const L=String(s.label||'');
   (s.items||[]).forEach(it=>{const n=String((it&&it.name)||'');names.push(n);
     pairs.push(L+SEP+n+SEP+String((it&&it.detail)||''));});});
  o[w+'/'+d]={pairs,names};}));return o;}
const POSTERIOR=/hamstring|glute|hip thrust|bridge|nordic|deadlift|romanian|\brdl\b|good morning|\bswing\b|back extension|hyperextension|reverse hyper|pull-?through|leg curl|ghr|glute-ham|\bclean\b|\bsnatch\b|rack pull|hinge/i;
const hits=[];
for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)
 for(const i of INJ)for(const r of RESTS)for(const sd of SEEDS){
  const cfg=cfgOf(t,f,x,g,i,r,sd);
  let sa,sb; try{sa=scan(A,cfg);sb=scan(B,cfg);}catch(e){continue;}
  for(const dk in sa){const a=sa[dk],b=sb[dk];if(!b)continue;
    const A1=new Set(a.pairs);
    const lost=b.pairs.filter(p=>!A1.has(p)&&p.split(SEP)[0]==='Leg superset B');
    if(!lost.length)continue;
    let sp; try{sp=scan(P,cfg);}catch(e){sp=null;}
    const pre=sp&&sp[dk]?sp[dk]:null;
    const preLost=pre?b.pairs.filter(p=>!new Set(pre.pairs).has(p)&&p.split(SEP)[0]==='Leg superset B'):null;
    hits.push({key:[t,f,x,g.k,i.k,'r'+r.length,sd].join('|'),dk,
      lost:lost.map(p=>p.split(SEP)[1]),
      v197_posteriorFree:!a.names.some(n=>POSTERIOR.test(n)),
      v196_posteriorFree:!b.names.some(n=>POSTERIOR.test(n)),
      alsoLostPreReorder:preLost?preLost.map(p=>p.split(SEP)[1]):'n/a',
      v197names:a.names.filter(n=>POSTERIOR.test(n))});
  }}
console.log('Leg superset B removals found: '+hits.length);
hits.forEach(h=>{console.log('\n  '+h.key+'  '+h.dk);
  console.log('    lost from Leg superset B : '+JSON.stringify(h.lost));
  console.log('    same loss WITHOUT D84 (pre-reorder vs V196)? '+JSON.stringify(h.alsoLostPreReorder));
  console.log('    V196 card posterior-free : '+h.v196_posteriorFree+'   V197 card posterior-free: '+h.v197_posteriorFree);
  console.log('    posterior names still on the V197 card: '+JSON.stringify(h.v197names));});
try{fs.unlinkSync(PRE);}catch(e){}
