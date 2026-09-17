// GATEKEEPER independent denial census: does a machine/cable movement reach a tier that
// owns no machine/cable? Hand gear table, written here, not read from _gearOK.
'use strict';
const { load, fixtures } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const DAYS=['mon','tue','wed','thu','fri','sat','sun'];
const OWNS={bodyweight:new Set(),travel_room_only:new Set(),minimal:new Set(),
  home_basic:new Set(),home_full:new Set(),crossfit:new Set(),commercial:new Set(['machine','cable'])};
const MACHINE=/\bmachine\b|\bleg press\b|leg extension|lying leg curl|seated leg curl|hack squat|\bsmith\b|pec deck|preacher/i;
const CABLE=/\bcable\b|\brope\b|face pull|pulldown/i;
const TIERS=['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const FOCUS=['support_prevention','hypertrophy','strength','balanced','fatloss'];
const EXPER=['beginner','intermediate','advanced'];
const SEEDS=[11,1013,76308,90210];
const cfgs=[];
for(const equipment of TIERS)for(const liftingFocus of FOCUS)for(const experience of EXPER)for(const seed of SEEDS)
  cfgs.push({tier:equipment,cfg:Object.assign({},fixtures.HALF_MANNY,{equipment,liftingFocus,experience,seed})});
// travel
for(const liftingFocus of FOCUS)for(const experience of EXPER)for(const seed of SEEDS)
  cfgs.push({tier:'travel_room_only',cfg:Object.assign({},fixtures.HALF_MANNY,{equipment:'bodyweight',_travel:true,liftingFocus,experience,seed})});
function run(f){
  const ia=load(f); const cen={}; let cells=0,wall=0,wallBad=0;
  Object.keys(OWNS).forEach(t=>cen[t]={machine:0,cable:0,names:{}});
  for(const c of cfgs){const p=ia.buildProgram(JSON.parse(JSON.stringify(c.cfg)));
   for(const w of Object.keys(p.weeks||{}))for(const d of DAYS){const day=(p.weeks[w]||{})[d];if(!day)continue;cells++;
    for(const s of (day.sections||[])){if(!s)continue;
     for(const it of (s.items||[])){if(!it||it.name==null)continue;const nm=String(it.name);
      if(/^wall sit$/i.test(nm.trim())){wall++;if(!/^\d+×25 sec$/.test(String(it.detail||'').trim())&&String(s.label||'')==='Leg isolation')wallBad++;}
      if(MACHINE.test(nm)&&!OWNS[c.tier].has('machine')){cen[c.tier].machine++;cen[c.tier].names[nm]=(cen[c.tier].names[nm]||0)+1;}
      if(CABLE.test(nm)&&!OWNS[c.tier].has('cable')){cen[c.tier].cable++;cen[c.tier].names[nm]=(cen[c.tier].names[nm]||0)+1;}
  }}}}
  console.log('== '+f+'  ia'+ia.version+'  configs '+cfgs.length+'  day cells '+cells);
  Object.keys(OWNS).forEach(t=>console.log('   '+t.padEnd(17)+' machine '+String(cen[t].machine).padStart(5)+'  cable '+String(cen[t].cable).padStart(4)+'  '+JSON.stringify(cen[t].names)));
  console.log('   Wall sit prescriptions '+wall+'   bad dose inside "Leg isolation" '+wallBad);
}
run(process.argv[2]); run(process.argv[3]);
