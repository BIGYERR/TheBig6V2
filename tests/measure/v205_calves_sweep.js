// MEASURE v205 — Calves E1g RED, full lattice. Mirrors g197d_d84_base.js's E_L exactly
// (1728 configs) so the numbers are comparable to the gate's. Segments falls AND rises,
// and measures every other reader of _cardioInterference (carry gates, regional cap).
// Oracle: the cap formula is read from the authoring contract (cap = max(12, 20 - round(interf*2)))
// and the interference is recomputed by calling the engine's own _cardioInterference on the
// cardio object — but the CLAIM under test ("a day gained cardio it did not have") is a
// presence test on day.cardio, independent of both.
const path=require('path'),fs=require('fs'),cp=require('child_process'),os=require('os');
const {load}=require(path.resolve(__dirname,'..','harness.js'));
const A=process.argv[2], B=process.argv[3];
const TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const FOCUS=['hypertrophy','balanced'], EXPS=['beginner','advanced'];
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
const L=[];
for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)for(const r of RESTS)for(const sd of SEEDS)
  L.push({key:[t,f,x,g.k,i.k,r.k,sd].join('|'),t,f,x,g:g.k,i:i.k,r:r.k,sd,cfg:eCfg(t,f,x,g,i,r,sd)});

function scan(IA,cfg){
  const interf=IA.eval('_cardioInterference');
  const p=IA.buildProgram(cfg),W=p.weeks||{},out={};
  Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{
    const day=W[w][d]; if(!day||day.rest) return;
    const ca=day.cardio||null, iv=ca?interf(ca):0;
    const labels=(day.sections||[]).map(s=>String(s.label||''));
    out[w+'/'+d]={w:+w,d,labels,
      calves:labels.indexOf('Calves')>=0,
      carry:labels.some(s=>/carry/i.test(s)),
      nItems:(day.sections||[]).reduce((a,s)=>a+((s.items||[]).length),0),
      hasCardio:!!ca, csub:ca?String(ca.subtype||''):'', ctype:ca?String(ca.type||''):'',
      cat:ca?String(ca.assignedType||''):'', cll:ca?!!ca.legLoad:false,
      interf:iv, cap:Math.max(12,20-Math.round(iv*2))};
  }));
  return out;
}
const SH=process.argv.indexOf('--shard');
if(SH>0){
  const [si,sn]=process.argv[SH+1].split('/').map(Number), OUT=process.argv[process.argv.indexOf('--out')+1];
  const IAa=load(A),IAb=load(B); const rec={falls:[],rises:[],cells:0,cfgs:0,wkUneq:0,wkTot:0,
    carryFell:0,carryRose:0,capDrop:0,capRise:0,runDaysA:0,runDaysB:0,gainedCardio:0,lostCardio:0};
  L.forEach((c,ix)=>{ if(ix%sn!==si) return;
    let a,b; try{a=scan(IAa,c.cfg);b=scan(IAb,c.cfg);}catch(e){return;} rec.cfgs++;
    const wkA={},wkB={};
    Object.keys(b).forEach(k=>{ const B1=b[k],A1=a[k]; if(!A1) return; rec.cells++;
      wkA[B1.w]=(wkA[B1.w]||0)+(A1.calves?1:0); wkB[B1.w]=(wkB[B1.w]||0)+(B1.calves?1:0);
      if(A1.hasCardio)rec.runDaysA++; if(B1.hasCardio)rec.runDaysB++;
      if(A1.hasCardio&&!B1.hasCardio)rec.gainedCardio++; if(!A1.hasCardio&&B1.hasCardio)rec.lostCardio++;
      if(A1.cap<B1.cap)rec.capDrop++; if(A1.cap>B1.cap)rec.capRise++;
      if(!A1.carry&&B1.carry)rec.carryFell++; if(A1.carry&&!B1.carry)rec.carryRose++;
      const ev={key:c.key,t:c.t,f:c.f,x:c.x,g:c.g,i:c.i,r:c.r,sd:c.sd,cell:k,d:B1.d,w:B1.w,
        aCardio:A1.hasCardio,bCardio:B1.hasCardio,aSub:A1.csub,bSub:B1.csub,
        aInterf:A1.interf,bInterf:B1.interf,aCap:A1.cap,bCap:B1.cap,
        aN:A1.nItems,bN:B1.nItems,aLab:A1.labels.join('>'),bLab:B1.labels.join('>')};
      if(!A1.calves&&B1.calves)rec.falls.push(ev);
      if(A1.calves&&!B1.calves)rec.rises.push(ev);
    });
    Object.keys(wkB).forEach(w=>{rec.wkTot++; if((wkA[w]||0)!==(wkB[w]||0))rec.wkUneq++;});
  });
  fs.writeFileSync(OUT,JSON.stringify(rec)); process.exit(0);
}
const N=6, SC=fs.mkdtempSync(path.join(os.tmpdir(),'v205calves-')), outs=[];
let live=N; const acc={falls:[],rises:[],cells:0,cfgs:0,wkUneq:0,wkTot:0,carryFell:0,carryRose:0,
  capDrop:0,capRise:0,runDaysA:0,runDaysB:0,gainedCardio:0,lostCardio:0};
for(let i=0;i<N;i++){ const of=path.join(SC,'s'+i+'.json'); outs.push(of);
  const ch=cp.spawn(process.execPath,[__filename,A,B,'--shard',i+'/'+N,'--out',of],{stdio:['ignore','ignore','inherit']});
  ch.on('close',()=>{ if(--live===0) report(); });
}
function report(){
  let bad=0;
  outs.forEach(f=>{ let j=null; try{j=JSON.parse(fs.readFileSync(f,'utf8'));}catch(e){}
    if(!j){bad++;return;} Object.keys(acc).forEach(k=>{ if(Array.isArray(acc[k]))acc[k]=acc[k].concat(j[k]); else acc[k]+=j[k]; }); });
  if(bad){console.log('!! '+bad+'/'+N+' shards produced nothing — MEASUREMENT FAILED');}
  const seg=(rows,f)=>{const m={};rows.forEach(r=>{const k=f(r);m[k]=(m[k]||0)+1;});
    return Object.keys(m).sort((a,b)=>m[b]-m[a]).map(k=>k+':'+m[k]).join(' ');};
  console.log('LATTICE '+L.length+' configs, '+acc.cfgs+' built, '+acc.cells+' day-cells compared');
  console.log('program-weeks compared '+acc.wkTot+', unequal per-week Calves count '+acc.wkUneq);
  console.log('CALVES fell '+acc.falls.length+' , rose '+acc.rises.length+' (net '+(acc.rises.length-acc.falls.length)+')');
  console.log('cardio-day GAINED (A has, B had none) '+acc.gainedCardio+' ; LOST '+acc.lostCardio+
              ' ; cardio day-cells A='+acc.runDaysA+' B='+acc.runDaysB);
  console.log('budget cap DROPPED on '+acc.capDrop+' cells, ROSE on '+acc.capRise+' cells (of '+acc.cells+')');
  console.log('OTHER READER carry section: fell '+acc.carryFell+' , rose '+acc.carryRose);
  for(const [nm,rows] of [['FALLS',acc.falls],['RISES',acc.rises]]){
    console.log('\n--- '+nm+' n='+rows.length);
    ['g','i','t','f','x','r','d','sd'].forEach(k=>console.log('   by '+k+': '+seg(rows,r=>r[k])));
    console.log('   by week: '+seg(rows,r=>'w'+r.w));
    console.log('   cardio B->A: '+seg(rows,r=>(r.bCardio?('"'+r.bSub+'"'):'NONE')+' -> '+(r.aCardio?('"'+r.aSub+'"'):'NONE')));
    console.log('   cap B->A: '+seg(rows,r=>r.bCap+'->'+r.aCap));
    console.log('   interf B->A: '+seg(rows,r=>r.bInterf+'->'+r.aInterf));
    console.log('   section-label string identical apart from Calves: '+
      rows.filter(r=>r.aLab.split('>').filter(s=>s!=='Calves').join('>')===r.bLab.split('>').filter(s=>s!=='Calves').join('>')).length+'/'+rows.length);
    console.log('   item-count delta (A-B): '+seg(rows,r=>String(r.aN-r.bN)));
    console.log('   distinct configs: '+new Set(rows.map(r=>r.key)).size);
  }
  fs.writeFileSync(path.join(__dirname,'v205_calves_sweep.out.json'),JSON.stringify({falls:acc.falls,rises:acc.rises},null,1));
  console.log('\nraw -> tests/measure/v205_calves_sweep.out.json');
}
