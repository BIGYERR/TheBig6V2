// gatekeeper V197 final pass — INDEPENDENT census. Own classifier, own counters.
// Verifies: the four D86 ratchet constants, the D84 severity table across three
// artifacts (V196 / pre-reorder / V197), Calves-loss two-sided, label movement,
// per-injury signature, and the moved-cell census keyed on (week, day, label, movement).
const fs=require('fs'), path=require('path'), os=require('os');
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const CAND='/Users/CanasBangin/Desktop/TheBig6V2/index.html';
const BASE='/tmp/gk2_base_V196.html';
const RAW=fs.readFileSync(CAND,'utf8');
const SEP='@@';
const CALF="        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});\n";
const ISO ="        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});\n";
if(RAW.split(CALF+ISO).length-1!==1){console.log('ABORT: D84 order not found exactly once');process.exit(2);}
const PRE=path.join(os.tmpdir(),'gk2_pre_reorder.html');
fs.writeFileSync(PRE, RAW.replace(CALF+ISO, ISO+CALF));
console.log('artifacts: V196='+BASE+'  PRE='+PRE+'  V197='+CAND);

// ---- MY posterior-chain classifier (written fresh, not the gate's table) ----
const POSTERIOR=/hamstring|glute|hip thrust|bridge|nordic|deadlift|romanian|\brdl\b|good morning|\bswing\b|back extension|hyperextension|reverse hyper|pull-?through|leg curl|ghr|glute-ham|\bclean\b|\bsnatch\b|rack pull|hinge/i;
const LEGLABEL=l=>l==='Calves'||l==='Leg isolation';
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
  L.push({key:t+'|'+f+'|'+x+'|'+g.k+'|'+i.k+'|'+r.k+'|'+sd,tier:t,inj:i.k,cfg:cfgOf(t,f,x,g,i,r,sd)});
console.log('lattice: '+L.length+' configs');

function scan(IA,cfg){const p=IA.buildProgram(cfg),W=p.weeks||{},o={};
 Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{const day=W[w][d];if(!day||day.rest)return;
  const labels=[],names=[],pairs=[];
  (day.sections||[]).forEach(s=>{const L2=String(s.label||'');labels.push(L2);
   (s.items||[]).forEach(it=>{const n=String((it&&it.name)||'');names.push(n);
     pairs.push(L2+SEP+n+SEP+String((it&&it.detail)||''));});});
  o[w+'/'+d]={labels,names,pairs};}));
 return o;}
const IAs={};
for(const kf of [['V196',BASE],['PRE',PRE],['V197',CAND]]) IAs[kf[0]]=load(kf[1]);

const cen={};
for(const k of ['V196','PRE','V197']){
  let cells=0,zero=0,threw=0;const keys={};
  for(const c of L){let s;try{s=scan(IAs[k],c.cfg);}catch(e){threw++;continue;}
    for(const dk in s){const o=s[dk];cells++;
      if(o.labels.some(LEGLABEL)&&!o.names.some(n=>POSTERIOR.test(n))){zero++;keys[c.key]=(keys[c.key]||0)+1;}}}
  cen[k]={cells:cells,zero:zero,keys:Object.keys(keys).length,threw:threw};
  console.log('CENSUS '+k.padEnd(5)+' posterior-free leg cells '+String(zero).padStart(5)+' in '+String(cen[k].keys).padStart(3)+' config keys   (of '+cells+' day-cells, '+threw+' threw)');
}
{
  let caused=0,fell=0,rose=0,changed=0,cells=0;const ck={},lab={},movedOther={};
  for(const c of L){let A,B;try{A=scan(IAs.V197,c.cfg);B=scan(IAs.PRE,c.cfg);}catch(e){continue;}
    for(const dk in A){const a=A[dk],b=B[dk];if(!b)continue;cells++;
      const za=a.labels.some(LEGLABEL)&&!a.names.some(n=>POSTERIOR.test(n));
      const zb=b.labels.some(LEGLABEL)&&!b.names.some(n=>POSTERIOR.test(n));
      if(za&&!zb){caused++;ck[c.key]=1;}
      const ha=a.labels.indexOf('Calves')>=0,hb=b.labels.indexOf('Calves')>=0;
      if(!ha&&hb)fell++; if(ha&&!hb)rose++;
      if(a.pairs.join('|')===b.pairs.join('|'))continue;
      changed++;
      const ca={},cb={};a.labels.forEach(l=>ca[l]=(ca[l]||0)+1);b.labels.forEach(l=>cb[l]=(cb[l]||0)+1);
      new Set(Object.keys(ca).concat(Object.keys(cb))).forEach(l=>{const d=(ca[l]||0)-(cb[l]||0);if(d)lab[l]=(lab[l]||0)+d;});
      const sa=new Set(a.pairs),sb=new Set(b.pairs);
      Array.from(sa).filter(x=>!sb.has(x)).concat(Array.from(sb).filter(x=>!sa.has(x))).forEach(t=>{
        const lb=t.split(SEP)[0]; if(!LEGLABEL(lb)) movedOther[lb]=(movedOther[lb]||0)+1;});
    }}
  console.log('');
  console.log('-- V197 vs PRE-REORDER (D84 alone) --');
  console.log('  cells compared        : '+cells);
  console.log('  Calves FELL           : '+fell+'   Calves ROSE: '+rose);
  console.log('  changed cells         : '+changed);
  console.log('  label delta           : '+JSON.stringify(lab));
  console.log('  CAUSED posterior-free : '+caused+' cells in '+Object.keys(ck).length+' config keys');
  console.log('  moved triples outside Calves/Leg isolation: '+JSON.stringify(movedOther));
}
{
  let cells=0,changed=0,fell=0,rose=0;const lab={},movedOther={},byInj={};
  for(const c of L){let A,B;try{A=scan(IAs.V197,c.cfg);B=scan(IAs.V196,c.cfg);}catch(e){continue;}
    byInj[c.inj]=byInj[c.inj]||{fell:0,rose:0,cells:0};
    for(const dk in A){const a=A[dk],b=B[dk];if(!b)continue;cells++;byInj[c.inj].cells++;
      const ha=a.labels.indexOf('Calves')>=0,hb=b.labels.indexOf('Calves')>=0;
      if(!ha&&hb){fell++;byInj[c.inj].fell++;} if(ha&&!hb){rose++;byInj[c.inj].rose++;}
      if(a.pairs.join('|')===b.pairs.join('|'))continue;
      changed++;
      const ca={},cb={};a.labels.forEach(l=>ca[l]=(ca[l]||0)+1);b.labels.forEach(l=>cb[l]=(cb[l]||0)+1);
      new Set(Object.keys(ca).concat(Object.keys(cb))).forEach(l=>{const d=(ca[l]||0)-(cb[l]||0);if(d)lab[l]=(lab[l]||0)+d;});
      const sa=new Set(a.pairs),sb=new Set(b.pairs);
      Array.from(sa).filter(x=>!sb.has(x)).concat(Array.from(sb).filter(x=>!sa.has(x))).forEach(t=>{
        const lb=t.split(SEP)[0]; if(!LEGLABEL(lb)) movedOther[lb]=(movedOther[lb]||0)+1;});
    }}
  console.log('');
  console.log('-- V197 vs V196 (all of slices 1-6) --');
  console.log('  cells compared : '+cells+'   changed: '+changed);
  console.log('  Calves FELL    : '+fell+'   Calves ROSE: '+rose);
  console.log('  label delta    : '+JSON.stringify(lab));
  console.log('  moved triples by SECTION LABEL outside Calves/Leg isolation: '+JSON.stringify(movedOther));
  console.log('  per-injury Calves signature: '+JSON.stringify(byInj));
}
try{fs.unlinkSync(PRE);}catch(e){}
