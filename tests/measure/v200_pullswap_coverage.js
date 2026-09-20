// v200_pullswap_coverage — V200 tooling item 1. READ-ONLY measure pass.
// Q1 repro, Q2 what the pull A/B swap does, Q4 whether a per-card surviving-block-COUNT
// identity is capable of failing (mutation-probed), on scratch copies only.
// usage: node tests/measure/v200_pullswap_coverage.js <base.html> <cand.html> <scratchdir> [stride]
const path=require('path'), fs=require('fs'), os=require('os');
const H=require(path.join(__dirname,'..','harness'));
const BASE=process.argv[2], CAND=process.argv[3], SCR=process.argv[4], STRIDE=parseInt(process.argv[5]||'1',10);

// ── HAND posterior oracle, typed from doctrine movement names (copy of g199 E_PAT).
// NEVER _isPostChain / _pattern: the instrument must not ask the suspect.
const E_PAT=[['calf_iso',/calf|calves|plantarflex/i],
 ['hip_ext',/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
 ['leg_iso',/leg curl|leg extension|hamstring curl/i],
 ['hinge',/deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i]];
const ePat=n=>{const t=String(n||'');for(const[p,r]of E_PAT)if(r.test(t))return p;return null;};
const isPost=n=>{const p=ePat(n);return p==='hinge'||p==='hip_ext';};
const PROBE=[['Back squat',0],['Leg extension',0],['Lying leg curl',0],['Leg press',0],
 ['Dumbbell standing calf raise',0],['Wall sit',0],['Nordic hamstring curl (anchored)',1],
 ['Single-leg glute bridge',1],['Barbell Romanian deadlift',1],['45° back extension',1],['Kettlebell swing',1]];
const probeBad=PROBE.filter(([n,e])=>(isPost(n)?1:0)!==e);
console.log('A0 hand-oracle blindness probe: '+(PROBE.length-probeBad.length)+'/'+PROBE.length+' correct'+(probeBad.length?'  MISREADS '+probeBad.map(x=>x[0]).join(','):''));
if(probeBad.length) process.exit(2);

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
const LAT=[];for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const r of RESTS)for(const sd of SEEDS)
 LAT.push({key:[t,f,x,g.k,r.k,sd].join('|'),t,f,x,g:g.k,seed:sd,cfg:cfg(t,f,x,g,r,sd)});
const MINE=LAT.filter((_,i)=>i%STRIDE===0);

const ACC=/^(Leg superset [AB]|Leg|Leg isolation|Pull superset [AB]|Push superset [AB])$/;
function census(V,c){const p=V.buildProgram(JSON.parse(JSON.stringify(c)));const W=p.weeks||{};const out=[];
 Object.keys(W).forEach(wi=>Object.keys(W[wi]||{}).forEach(di=>{const d=W[wi][di];
  const secs=((d&&d.sections)||[]).map(s=>({l:String((s&&s.label)||''),n:((s&&s.items)||[]).map(i=>String((i&&i.name)||''))}));
  out.push({key:wi+'|'+di,secs,labs:secs.map(s=>s.l),acc:secs.filter(s=>ACC.test(s.l))});}));return out;}

// ── arm sweeps ───────────────────────────────────────────────────────────
function armPair(fileB,fileC,tag){
 const B=H.load(fileB), C=H.load(fileC);
 let cards=0,totB=0,totC=0,gained=0,lost=0,swapped=0,nameDiff=0,perCardMaxDelta=0;
 const pull={cards:0,byTier:{},byGoal:{},byFocus:{},byExp:{},survB:{},survC:{},itemsGone:{},itemsGot:{},
   postGoneHand:0,postGotHand:0,kbGot:0,kbGone:0,examples:[]};
 const lblB={},lblC={};
 for(const L of MINE){const b=census(B,L.cfg), c=census(C,L.cfg);
  for(let i=0;i<b.length;i++){cards++;
   const nb=b[i].acc.length,nc=c[i].acc.length; totB+=nb; totC+=nc;
   if(nc>nb)gained++; if(nc<nb)lost++;
   if(Math.abs(nc-nb)>perCardMaxDelta)perCardMaxDelta=Math.abs(nc-nb);
   b[i].labs.forEach(l=>lblB[l]=(lblB[l]||0)+1); c[i].labs.forEach(l=>lblC[l]=(lblC[l]||0)+1);
   const bs=b[i].acc.map(s=>s.l).join(','), cs=c[i].acc.map(s=>s.l).join(',');
   if(nb===nc&&bs!==cs)swapped++;
   if(b[i].labs.join('|')!==c[i].labs.join('|'))nameDiff++;
   // pull-involved changed card
   const gone=b[i].labs.filter(l=>!c[i].labs.includes(l)), got=c[i].labs.filter(l=>!b[i].labs.includes(l));
   if(!gone.concat(got).some(l=>/^Pull superset/.test(l))) continue;
   pull.cards++;
   pull.byTier[L.t]=(pull.byTier[L.t]||0)+1; pull.byGoal[L.g]=(pull.byGoal[L.g]||0)+1;
   pull.byFocus[L.f]=(pull.byFocus[L.f]||0)+1; pull.byExp[L.x]=(pull.byExp[L.x]||0)+1;
   pull.survB[bs]=(pull.survB[bs]||0)+1; pull.survC[cs]=(pull.survC[cs]||0)+1;
   const gs=b[i].secs.filter(s=>gone.includes(s.l)&&/^Pull superset/.test(s.l));
   const cs2=c[i].secs.filter(s=>got.includes(s.l)&&/^Pull superset/.test(s.l));
   const goneN=[].concat(...gs.map(s=>s.n)), gotN=[].concat(...cs2.map(s=>s.n));
   goneN.forEach(n=>pull.itemsGone[n]=(pull.itemsGone[n]||0)+1);
   gotN.forEach(n=>pull.itemsGot[n]=(pull.itemsGot[n]||0)+1);
   if(goneN.some(isPost))pull.postGoneHand++; if(gotN.some(isPost))pull.postGotHand++;
   if(gotN.some(n=>/kettlebell swing/i.test(n)))pull.kbGot++;
   if(goneN.some(n=>/kettlebell swing/i.test(n)))pull.kbGone++;
   if(pull.examples.length<6)pull.examples.push({cfg:L.key,card:b[i].key,
     before:gs.map(s=>s.l+' ['+s.n.join(' + ')+'] hand-post:'+s.n.filter(isPost).join(',')),
     after:cs2.map(s=>s.l+' ['+s.n.join(' + ')+'] hand-post:'+s.n.filter(isPost).join(',')),
     postAtEnd:cs2.map(s=>s.n.map(n=>n+(isPost(n)?'<POST>':'')).join(' + '))});
  }}
 return {tag,cards,totB,totC,gained,lost,swapped,nameDiff,perCardMaxDelta,pull,lblB,lblC};
}

// ── MUTANTS (scratch copies only; index.html is never written) ───────────
const RAW=fs.readFileSync(CAND,'utf8');
const A_BREAK="    if((s.items||[]).some(it=>it&&_isPostChain(it.name))){ pickIdx=i; break; }    // first posterior accessory block wins";
const A_MAIN="    if(/^main\\b|^primer|^power\\b|^strength\\b/.test(L)) continue;               // main work: never a candidate";
const A_KEEP="    if(hasLift&&!accessoryKept&&(pickIdx<0||i===pickIdx)){ accessoryKept=true; keep.push(s); return; }  // exactly ONE accessory block survives; D91 picks the posterior one when the card has one";
const MUTS=[
 {id:'M1 last-posterior-wins (swap target moves, count unchanged?)',a:A_BREAK,r:"    if((s.items||[]).some(it=>it&&_isPostChain(it.name))){ pickIdx=i; }"},
 {id:'M2 pre-pass scores MAIN too (the naive pre-pass D91 warns about)',a:A_MAIN,r:"    if(false) continue;"},
 {id:'M3 swap disabled (revert to V198 push order)',a:A_BREAK,r:"    if(false){ pickIdx=i; break; }"},
 {id:'M4 keep-both (drop the one-accessory latch)',a:A_KEEP,r:"    if(hasLift){ accessoryKept=true; keep.push(s); return; }"},
 {id:'M5 drop-all accessories',a:A_KEEP,r:"    if(hasLift&&false){ accessoryKept=true; keep.push(s); return; }"}];
if(!process.env.MUTS_OFF){
console.log('\n== Q4 MUTATION PROBE: does a per-card surviving-block-COUNT identity move? ==');
console.log('   denominator: '+MINE.length+' configs (stride '+STRIDE+' of '+LAT.length+')');
const CTL=armPair(CAND,CAND,'control');
console.log('  control cand-vs-cand: cards='+CTL.cards+' blocks '+CTL.totB+'->'+CTL.totC+' gained='+CTL.gained+' lost='+CTL.lost+' swapped='+CTL.swapped+' nameDiff='+CTL.nameDiff+'   (baseline equals itself: '+(CTL.gained+CTL.lost+CTL.swapped+CTL.nameDiff===0?'YES':'NO -- ENGINE NONDETERMINISTIC, EVERY NUMBER BELOW IS VOID')+')');
for(const m of MUTS){
 const n=RAW.split(m.a).length-1;
 if(n!==1){console.log('  NOT-APPLIED '+m.id+' anchor count='+n+' (this mutation measured nothing)');continue;}
 const f=path.join(SCR,'mut_'+m.id.split(' ')[0]+'.html');
 fs.writeFileSync(f,RAW.replace(m.a,m.r));
 let R; try{R=armPair(CAND,f,m.id);}catch(e){console.log('  CRASH '+m.id+': '+e.message);continue;}
 const countMoves=(R.gained+R.lost)>0;
 console.log('  '+m.id);
 console.log('     blocks '+R.totB+' -> '+R.totC+' (delta '+(R.totC-R.totB)+')  gained='+R.gained+' lost='+R.lost+' same-count-swapped='+R.swapped+' any-label-diff='+R.nameDiff);
 console.log('     => COUNT identity '+(countMoves?'TRIPS':'BLIND')+' | NAME-level oracle '+(R.nameDiff>0?'TRIPS':'BLIND')+' | pull-involved cards '+R.pull.cards);
}

}
// ── Q1/Q2: base vs cand on the full lattice ──────────────────────────────
console.log('\n== Q1/Q2 BASE vs CAND, denominator '+MINE.length+' configs (stride '+STRIDE+') ==');
const P=armPair(BASE,CAND,'base-vs-cand');
console.log('  cards='+P.cards+'  accessory blocks '+P.totB+' -> '+P.totC+'  gained='+P.gained+' lost='+P.lost+' same-count-swapped='+P.swapped+' max per-card |delta|='+P.perCardMaxDelta);
['Leg superset A','Leg superset B','Pull superset A','Pull superset B','Leg','Leg isolation','Explosive finisher']
 .forEach(l=>console.log('    '+l.padEnd(20)+' base '+String(P.lblB[l]||0).padStart(6)+' -> cand '+String(P.lblC[l]||0).padStart(6)+'  delta '+((P.lblC[l]||0)-(P.lblB[l]||0))));
console.log('    PULL A+B base '+((P.lblB['Pull superset A']||0)+(P.lblB['Pull superset B']||0))+' -> cand '+((P.lblC['Pull superset A']||0)+(P.lblC['Pull superset B']||0)));
const p=P.pull;
console.log('  PULL-INVOLVED CHANGED CARDS = '+p.cards+' of '+P.cards);
console.log('    by tier  '+JSON.stringify(p.byTier));
console.log('    by goal  '+JSON.stringify(p.byGoal));
console.log('    by focus '+JSON.stringify(p.byFocus));
console.log('    by exp   '+JSON.stringify(p.byExp));
console.log('    surviving accessory set BEFORE: '+JSON.stringify(p.survB));
console.log('    surviving accessory set AFTER : '+JSON.stringify(p.survC));
console.log('    items LOST (base pull block)   : '+JSON.stringify(p.itemsGone));
console.log('    items GAINED (cand pull block) : '+JSON.stringify(p.itemsGot));
console.log('    hand-oracle posterior present  : lost-block '+p.postGoneHand+'/'+p.cards+'   gained-block '+p.postGotHand+'/'+p.cards);
console.log('    Kettlebell swing in GAINED block: '+p.kbGot+'/'+p.cards+'   in LOST block: '+p.kbGone+'/'+p.cards);
console.log('    examples: '+JSON.stringify(p.examples,null,1));
