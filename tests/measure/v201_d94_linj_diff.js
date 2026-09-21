// v201_d94_linj_diff — READ-ONLY. Reproduces the "L-injury 405 swapped pull cards" figure.
// THE L-INJURY LATTICE DEFINITION WAS NOT KEPT in tests/measure/. Two factorisations both
// give 1,296 configs and, at goals {half,marathon}, 112 cards/config = 145,152 cards:
//   linjA  6 tiers x 3 focus x 2 exps x 2 goals x 6 injuries x 3 rests x 1 seed
//   linjB  6 tiers x 3 focus x 3 exps x 2 goals x 4 injuries x 3 rests x 1 seed
// Both are measured; the one that reproduces 405 against V198 is the original.
// The "pull-involved changed card" predicate is v200_pullswap_coverage.js's, verbatim.
// usage: node tests/measure/v201_d94_linj_diff.js <base.html> <cand.html> [latnames]
const path=require('path');
const {load}=require(path.join(__dirname,'..','harness.js'));
const M=require(path.join(__dirname,'v201_d94_population.js'));
const BASE=process.argv[2], CAND=process.argv[3];
const NAMES=(process.argv[4]||'linjA,linjB,healthy').split(',');
const ACC=/^(Leg superset [AB]|Leg|Leg isolation|Pull superset [AB]|Push superset [AB])$/;
function census(V,c){const p=V.buildProgram(JSON.parse(JSON.stringify(c)));const W=p.weeks||{};const out=[];
 Object.keys(W).forEach(wi=>Object.keys(W[wi]||{}).forEach(di=>{const d=W[wi][di];
  const secs=((d&&d.sections)||[]).map(s=>({l:String((s&&s.label)||''),n:((s&&s.items)||[]).map(i=>String((i&&i.name)||''))}));
  out.push({key:wi+'|'+di,secs,labs:secs.map(s=>s.l),acc:secs.filter(s=>ACC.test(s.l))});}));return out;}
const B=load(BASE), C=load(CAND);
console.log('base ia-version='+B.version+'   cand ia-version='+C.version);
NAMES.forEach(nm=>{
 const lat=M.build(nm); let cards=0,pull=0,ctl=0;
 const gone={},got={},byInj={},byTier={},byGoal={},byFocus={},byExp={};
 lat.forEach(L=>{const b=census(B,L.cfg), c=census(C,L.cfg), s=census(C,L.cfg);
  for(let i=0;i<b.length;i++){cards++;
   if(JSON.stringify(c[i])!==JSON.stringify(s[i]))ctl++;
   const g=b[i].labs.filter(l=>!c[i].labs.includes(l)), t=c[i].labs.filter(l=>!b[i].labs.includes(l));
   if(!g.concat(t).some(l=>/^Pull superset/.test(l)))continue;
   pull++; byInj[L.i]=(byInj[L.i]||0)+1; byTier[L.t]=(byTier[L.t]||0)+1;
   byGoal[L.g]=(byGoal[L.g]||0)+1; byFocus[L.f]=(byFocus[L.f]||0)+1; byExp[L.x]=(byExp[L.x]||0)+1;
   [].concat(...b[i].secs.filter(s=>g.includes(s.l)&&/^Pull superset/.test(s.l)).map(s=>s.n)).forEach(n=>gone[n]=(gone[n]||0)+1);
   [].concat(...c[i].secs.filter(s=>t.includes(s.l)&&/^Pull superset/.test(s.l)).map(s=>s.n)).forEach(n=>got[n]=(got[n]||0)+1);
  }});
 console.log('\n'+nm+': configs='+lat.length+' cards='+cards+'  CONTROL cand-vs-cand differing cards='+ctl+(ctl?'  <<< NONDETERMINISTIC, NUMBERS VOID':'  (baseline equals itself)'));
 console.log('  PULL-INVOLVED CHANGED CARDS = '+pull);
 console.log('   byInj '+JSON.stringify(byInj)+'  byTier '+JSON.stringify(byTier));
 console.log('   byGoal '+JSON.stringify(byGoal)+'  byFocus '+JSON.stringify(byFocus)+'  byExp '+JSON.stringify(byExp));
 console.log('   items LOST '+JSON.stringify(gone));
 console.log('   items GAINED '+JSON.stringify(got));
});
