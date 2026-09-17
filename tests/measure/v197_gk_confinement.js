// GATEKEEPER confinement: V197 is a lifting-pool change. The run engine (NSW test goals
// and NRC race goals) must be byte-identical. Dumps cardio only, no sections.
'use strict';
const crypto=require('crypto');
const { load, fixtures } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const DAYS=['mon','tue','wed','thu','fri','sat','sun'];
const GOALS=[['run_base','cardio'],['run_pace','cardio'],['run_mile','cardio'],['run_1_5','cardio'],
             ['run_5k','event'],['run_10k','event'],['run_half','event'],['run_marathon','event']];
const TIERS=['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const EXPER=['beginner','intermediate','advanced'];
const SEEDS=[1013,76308,90210];
const cfgs=[];
for(const [g,pp] of GOALS)for(const equipment of TIERS)for(const experience of EXPER)for(const seed of SEEDS){
  const isRace=pp==='event';
  cfgs.push({key:[g,equipment,experience,seed].join('|'),goal:g,
    cfg:Object.assign({},fixtures.HALF_MANNY,{primaryPath:pp,eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,
      cardioTypes:['run'],cardioGoals:{run:{id:g,label:g,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}},
      equipment,experience,seed})});
}
function dump(f){const ia=load(f);const m={};
 for(const c of cfgs){const p=ia.buildProgram(JSON.parse(JSON.stringify(c.cfg)));
  const rows=[];rows.push('WEEKS='+Object.keys(p.weeks||{}).length);
  for(const w of Object.keys(p.weeks||{}).sort((a,b)=>+a-+b))for(const d of DAYS){
   const day=(p.weeks[w]||{})[d];if(!day)continue;
   rows.push(w+'|'+d+'|rest='+(day.rest?1:0)+'|title='+String(day.title||'')+'|cardio='+JSON.stringify(day.cardio||null));}
  m[c.key]=rows.join('\n');}
 return m;}
const A=dump(process.argv[2]),B=dump(process.argv[3]);
let diff=0;const byGoal={};
for(const c of cfgs){const g=c.goal;byGoal[g]=byGoal[g]||{n:0,d:0};byGoal[g].n++;
 if(A[c.key]!==B[c.key]){diff++;byGoal[g].d++;if(diff<=3){
   const a=A[c.key].split('\n'),b=B[c.key].split('\n');
   for(let i=0;i<Math.max(a.length,b.length);i++) if(a[i]!==b[i]){console.log('   FIRST DIFF '+c.key+'\n     base '+a[i]+'\n     cand '+b[i]);break;}}}}
console.log('configs '+cfgs.length);
for(const g of Object.keys(byGoal))console.log('   '+g.padEnd(13)+' differing '+byGoal[g].d+'/'+byGoal[g].n);
const h=s=>crypto.createHash('sha256').update(Object.keys(s).sort().map(k=>k+'\n'+s[k]).join('\n@@\n')).digest('hex').slice(0,16);
console.log('CARDIO DUMP DIGEST  base '+h(A)+'   cand '+h(B)+'   byte-identical: '+(h(A)===h(B)));
console.log('total differing configs: '+diff+'/'+cfgs.length);
