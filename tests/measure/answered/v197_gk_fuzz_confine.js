// gatekeeper V197: (1) Mario's HALF_MANNY digest on three artifacts, (2) identity fuzz
// with BASELINE SELF-IDENTITY PROVED FIRST, (3) confinement — the cardio/run engine dump
// must be byte-identical V196 vs V197, and _swapUniverse diffed SEPARATELY (progDigest
// is blind to it because the harness strips it).
const fs=require('fs'), path=require('path'), os=require('os'), crypto=require('crypto');
const H=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const {load,fixtures,progDigest}=H;
const CAND='/Users/CanasBangin/Desktop/TheBig6V2/index.html';
const BASE='/tmp/gk2_base_V196.html';
const RAW=fs.readFileSync(CAND,'utf8');
const CALF="        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});\n";
const ISO ="        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});\n";
const PRE=path.join(os.tmpdir(),'gk2_pre_fuzz.html');
fs.writeFileSync(PRE, RAW.replace(CALF+ISO, ISO+CALF));

console.log('== 1. HALF_MANNY digest on three artifacts ==');
const EXPECT='6e32421331693437';
for(const kf of [['V196',BASE],['PRE-REORDER',PRE],['V197',CAND]]){
  const IA=load(kf[1]); const d=progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY));
  const d2=progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY));
  console.log('   '+kf[0].padEnd(12)+' digest '+d+'  '+(d===EXPECT?'MATCH':'*** DIFFERS from '+EXPECT+' ***')+'  self-stable='+(d===d2));
}

console.log('\n== 2. identity fuzz — baseline self-identity FIRST ==');
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
const L=[];
for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)
 for(const i of INJ)for(const r of RESTS)for(const sd of SEEDS)
  L.push({key:t+'|'+f+'|'+x+'|'+g.k+'|'+i.k+'|r'+r.length+'|'+sd,tier:t,cfg:cfgOf(t,f,x,g,i,r,sd)});
console.log('   lattice: '+L.length+' configs');
const IA_A=load(CAND), IA_B=load(BASE);
// dumps: strip clock fields
function dumpLift(IA,cfg){const p=IA.buildProgram(cfg),W=p.weeks||{},o=[];
 Object.keys(W).sort().forEach(w=>Object.keys(W[w]).sort().forEach(d=>{const day=W[w][d];if(!day)return;
  (day.sections||[]).forEach(s=>{(s.items||[]).forEach(it=>
    o.push(w+'/'+d+'/'+String(s.label||'')+'/'+String((it&&it.name)||'')+'/'+String((it&&it.detail)||'')));});}));
 return o.join('\n');}
function dumpCardio(IA,cfg){const p=IA.buildProgram(cfg),W=p.weeks||{},o=[];
 Object.keys(W).sort().forEach(w=>Object.keys(W[w]).sort().forEach(d=>{const day=W[w][d];if(!day)return;
  o.push(w+'/'+d+'/'+JSON.stringify(day.cardio||null)+'/'+String(day.rest||''));}));
 return o.join('\n');}
function dumpSwap(IA,cfg){const p=IA.buildProgram(cfg);
 const su=p._swapUniverse||p.swapUniverse||null; return su?JSON.stringify(su):'<none>';}
const md5=s=>crypto.createHash('md5').update(s).digest('hex');
// (a) baseline self-identity
let selfBad=0, selfCells=0;
for(const c of L){const a=dumpLift(IA_B,c.cfg), b=dumpLift(IA_B,c.cfg);
  selfCells+=a.split('\n').length; if(a!==b){selfBad++;console.log('   SELF-IDENTITY VIOLATION '+c.key);} }
console.log('   baseline self-identity: '+selfBad+' violations over '+L.length+' configs / '+selfCells+' rows');
if(selfBad){console.log('   ABORT: baseline is not self-identical; nothing below can be trusted');process.exit(2);}
let candSelfBad=0;
for(const c of L){if(dumpLift(IA_A,c.cfg)!==dumpLift(IA_A,c.cfg))candSelfBad++;}
console.log('   candidate self-identity: '+candSelfBad+' violations');
// (b) the differential, keyed on (week, day, label, movement)
let liftDiff=0, cardioDiff=0, swapDiff=0, rows=0, undef=0;
const cardioEg=[], swapEg=[];
for(const c of L){
  const la=dumpLift(IA_A,c.cfg), lb=dumpLift(IA_B,c.cfg);
  rows+=la.split('\n').length;
  if(/\/undefined\//.test(la)||/\/undefined$/.test(la))undef++;
  if(la!==lb)liftDiff++;
  const ca=dumpCardio(IA_A,c.cfg), cb=dumpCardio(IA_B,c.cfg);
  if(ca!==cb){cardioDiff++;if(cardioEg.length<5)cardioEg.push(c.key);}
  const sa=dumpSwap(IA_A,c.cfg), sb=dumpSwap(IA_B,c.cfg);
  if(sa!==sb){swapDiff++;if(swapEg.length<5)swapEg.push(c.key+' '+md5(sa).slice(0,8)+' vs '+md5(sb).slice(0,8));}
}
console.log('   rows compared           : '+rows);
console.log('   configs with LIFT diff  : '+liftDiff+' of '+L.length+' (expected: the ruled leg-day change)');
console.log('   configs with UNDEFINED  : '+undef+'  (must be 0)');
console.log('\n== 3. CONFINEMENT ==');
console.log('   configs with CARDIO/RUN engine diff : '+cardioDiff+' of '+L.length+(cardioEg.length?'  e.g. '+cardioEg.join(', '):'')); 
console.log('   configs with _swapUniverse diff     : '+swapDiff+' of '+L.length+(swapEg.length?'  e.g. '+swapEg.join(', '):''));
const anySwap=dumpSwap(IA_A,L[0].cfg);
console.log('   _swapUniverse present on the program object? '+(anySwap==='<none>'?'NO (key absent — see note)':'yes, '+anySwap.length+' bytes'));
try{fs.unlinkSync(PRE);}catch(e){}
