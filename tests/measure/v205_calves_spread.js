// MEASURE v205 — Calves RED, part 3.
//  (a) counterfactual: same 14 fall-configs with injury removed / shoulder — where does the legs day sit?
//  (b) _nrcRunShape called DIRECTLY on week-1 cardio for both, to show why D127 placement never runs on protect.
//  (c) SPREAD: every section label and every ITEM the budget deletes across the whole lattice, not just Calves.
//  (d) exposure: HALF_MANNY digest, NRC goals, cap drops by goal.
const path=require('path'),fs=require('fs'),cp=require('child_process'),os=require('os');
const H=require(path.resolve(__dirname,'..','harness.js')), {load,progDigest,fixtures}=H;
const A=process.argv[2],B=process.argv[3];
const TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const FOCUS=['hypertrophy','balanced'],EXPS=['beginner','advanced'];
const GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
           {k:'lowback/protect',v:{region:'lowback',tier:'protect'}},{k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const SEEDS=[1013,3039];
function eCfg(t,f,x,g,i,r,sd){const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
   cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
   eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:f,experience:x,ageBracket:'18-35',
   equipment:t,unit:'lbs',restDays:r.v.slice(),days:['sun','mon','tue','wed','thu','fri','sat'],
   bench:135,squat:155,deadlift:185,seed:sd,...(i.v?{injury:{region:i.v.region,tier:i.v.tier}}:{})};}
const L=[];for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)for(const r of RESTS)for(const sd of SEEDS)
  L.push({key:[t,f,x,g.k,i.k,r.k,sd].join('|'),t,f,x,g:g.k,i:i.k,r:r.k,sd,cfg:eCfg(t,f,x,g,i,r,sd)});

const SH=process.argv.indexOf('--shard');
if(SH>0){
  const [si,sn]=process.argv[SH+1].split('/').map(Number),OUT=process.argv[process.argv.indexOf('--out')+1];
  const IAa=load(A),IAb=load(B);
  // pass-attributed deletion: the artifact under test, with and without the budget pass.
  const IAo=load(A); IAo.eval('globalThis.__CAP_OFF=true');
  const rec={secLost:{},itemLost:{},cellsWithLoss:0,cells:0,byGoal:{},capDropByGoal:{},lossByGoalInj:{}};
  const bump=(o,k)=>o[k]=(o[k]||0)+1;
  L.forEach((c,ix)=>{ if(ix%sn!==si) return;
    let P,O; try{P=IAa.buildProgram(c.cfg);O=IAo.buildProgram(c.cfg);}catch(e){return;}
    const W=P.weeks||{},Wo=O.weeks||{};
    Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{
      const day=W[w][d],od=Wo[w]&&Wo[w][d]; if(!day||day.rest||!od) return; rec.cells++;
      const sa=(day.sections||[]).map(s=>String(s.label||'')),so=(od.sections||[]).map(s=>String(s.label||''));
      const ia=[],io=[]; (day.sections||[]).forEach(s=>(s.items||[]).forEach(i=>ia.push(String(i.name))));
      (od.sections||[]).forEach(s=>(s.items||[]).forEach(i=>io.push(String(i.name))));
      const lostSec=so.filter(x=>sa.indexOf(x)<0), lostIt=io.filter(x=>ia.indexOf(x)<0);
      if(lostSec.length||lostIt.length){rec.cellsWithLoss++; bump(rec.lossByGoalInj,c.g+'|'+c.i);}
      lostSec.forEach(s=>bump(rec.secLost,s)); lostIt.forEach(n=>bump(rec.itemLost,n));
      bump(rec.byGoal,c.g);
    }));
  });
  fs.writeFileSync(OUT,JSON.stringify(rec)); process.exit(0);
}
// ── (a)+(b) counterfactual + direct _nrcRunShape, single process ──
const IAa=load(A),IAb=load(B);
const FALLS=JSON.parse(fs.readFileSync(path.join(__dirname,'v205_calves_sweep.out.json'),'utf8')).falls;
const fkeys=[...new Set(FALLS.map(f=>f.key))];
console.log('=== (a) the 14 fall-configs, and the SAME config with injury swapped ===');
function probe(IA,cfg,tag){
  const p=IA.buildProgram(cfg),wk=p.weeks['1']||{};
  const days=['mon','tue','wed','thu','fri','sat','sun'];
  const wk1={},trainDays=[];
  days.forEach(d=>{const day=wk[d]; if(!day||day.rest)return; trainDays.push(d); if(day.cardio)wk1[d]=day.cardio;});
  let shape=null,err='';
  try{ shape=IA.eval('_nrcRunShape')(wk1,trainDays); }catch(e){err=String(e.message);}
  const legsDay=days.filter(d=>wk[d]&&!wk[d].rest&&/leg/i.test(wk[d].title||'')).join(',');
  const runs=days.filter(d=>wk[d]&&wk[d].cardio).map(d=>d+':'+(wk[d].cardio.subtype||wk[d].cardio.type)+(wk[d].cardio.legLoad?'[legLoad]':''));
  return {tag,legsDay,runs:runs.join(' '),shape:shape?('long='+shape.long+' speed={'+[...shape.speed]+'} easy={'+[...shape.easy]+'}'):('NULL'+(err?' err='+err:'')),
          calvesOnLegs:legsDay.split(',').filter(Boolean).map(d=>d+'='+((wk[d].sections||[]).some(s=>s.label==='Calves')?'Calves':'—')).join(' ')};
}
fkeys.forEach(k=>{
  const [t,f,x,g,i,r,sd]=k.split('|');
  const gg=GOALS.find(z=>z.k===g), rr=RESTS.find(z=>z.k===r);
  [['as-reported',INJ.find(z=>z.k===i)],['healthy',INJ[0]],['shoulder/protect',INJ[1]]].forEach(([tag,ij])=>{
    const cfg=eCfg(t,f,x,gg,ij,rr,+sd);
    const pa=probe(IAa,cfg,tag), pb=probe(IAb,cfg,tag);
    if(tag==='as-reported')console.log('\n'+k);
    console.log('  ['+tag.padEnd(16)+'] V'+IAb.version+' legs='+pb.legsDay.padEnd(4)+' shape='+pb.shape+' | runs: '+pb.runs);
    console.log('  ['+tag.padEnd(16)+'] V'+IAa.version+' legs='+pa.legsDay.padEnd(4)+' shape='+pa.shape+' | runs: '+pa.runs+' | '+pa.calvesOnLegs);
  });
});
console.log('\n=== (d) HALF_MANNY + NRC exposure ===');
console.log('HALF_MANNY digest V'+IAb.version+'='+progDigest(IAb.buildProgram(fixtures.HALF_MANNY))+
            '  V'+IAa.version+'='+progDigest(IAa.buildProgram(fixtures.HALF_MANNY))+
            '  identical='+(progDigest(IAb.buildProgram(fixtures.HALF_MANNY))===progDigest(IAa.buildProgram(fixtures.HALF_MANNY))));
// ── (c) spread sweep ──
const N=6,SC=fs.mkdtempSync(path.join(os.tmpdir(),'v205spread-')),outs=[];let live=N;
const acc={secLost:{},itemLost:{},cellsWithLoss:0,cells:0,byGoal:{},lossByGoalInj:{}};
for(let i=0;i<N;i++){const of=path.join(SC,'s'+i+'.json');outs.push(of);
  cp.spawn(process.execPath,[__filename,A,B,'--shard',i+'/'+N,'--out',of],{stdio:['ignore','ignore','inherit']}).on('close',()=>{if(--live===0)rep();});}
function rep(){let bad=0;
  outs.forEach(f=>{let j=null;try{j=JSON.parse(fs.readFileSync(f,'utf8'));}catch(e){}
    if(!j){bad++;return;}
    ['secLost','itemLost','byGoal','lossByGoalInj'].forEach(m=>Object.keys(j[m]).forEach(k=>acc[m][k]=(acc[m][k]||0)+j[m][k]));
    acc.cellsWithLoss+=j.cellsWithLoss;acc.cells+=j.cells;});
  if(bad)console.log('!! '+bad+'/'+N+' spread shards produced nothing — MEASUREMENT FAILED');
  const top=(o,n)=>Object.keys(o).sort((a,b)=>o[b]-o[a]).slice(0,n).map(k=>k+':'+o[k]).join('  ');
  console.log('\n=== (c) SPREAD on V'+IAa.version+': what capSessionBudget deletes (__CAP_OFF vs on), whole lattice ===');
  console.log('day-cells '+acc.cells+', cells losing at least one item '+acc.cellsWithLoss+
              ' ('+(100*acc.cellsWithLoss/acc.cells).toFixed(2)+'%)');
  console.log('sections deleted outright, top 15: '+top(acc.secLost,15));
  console.log('items deleted, top 15: '+top(acc.itemLost,15));
  console.log('cells-with-loss by goal|injury: '+top(acc.lossByGoalInj,20));
}
