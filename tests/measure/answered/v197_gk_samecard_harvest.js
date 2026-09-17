// GATEKEEPER: does a harvested leg_accessory name print TWICE on one card in V197?
// D76's ruling (B5a in g197_leg_accessory) says never. Swept on a lattice wider than
// the gate's: adds knee/protect, beginner, strength focus, travel tier, extra seeds.
'use strict';
const { load, fixtures } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const DAYS=['mon','tue','wed','thu','fri','sat','sun'];
const HARVESTED=['Nordic hamstring curl (anchored)','Single-leg glute bridge','Single-leg hip thrust','Wall sit'];
const EQUIP=['bodyweight','minimal','home_basic','home_full','commercial','crossfit','travel_room_only'];
const FOCUS=['support_prevention','hypertrophy','strength'];
const EXPER=['beginner','intermediate','advanced'];
const SEEDS=[1013,3039,76308,42];
const INJ=[[null,'healthy'],[{region:'shoulder',tier:'protect'},'shoulder/protect'],[{region:'lowback',tier:'protect'},'lowback/protect'],[{region:'knee',tier:'protect'},'knee/protect']];
const cfgs=[];
for(const equipment of EQUIP)for(const liftingFocus of FOCUS)for(const experience of EXPER)
for(const [injury,itag] of INJ)for(const seed of SEEDS)
 cfgs.push({key:[equipment,liftingFocus,experience,itag,seed].join('|'),tier:equipment,
  cfg:Object.assign({},fixtures.HALF_MANNY,{equipment,liftingFocus,experience,injury,seed})});
const ia=load(process.argv[2]);
let cells=0,dupAny=0,dupHarv=0,mainCollide=0;
const byName={},byTier={},samples=[];
for(const c of cfgs){
 const p=ia.buildProgram(JSON.parse(JSON.stringify(c.cfg)));
 for(const w of Object.keys(p.weeks||{}))for(const d of DAYS){
  const day=(p.weeks[w]||{})[d];if(!day)continue;cells++;
  const seen={},where={};let dh=0,mc=0;
  for(const s of (day.sections||[])){if(!s)continue;
   const L=String(s.label||s.coreHeader||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
   for(const it of (s.items||[])){if(!it||it.name==null)continue;
    const nm=String(it.name).trim(),k=nm.toLowerCase();
    if(seen[k]){ dupAny++;
      if(HARVESTED.some(h=>h.toLowerCase()===k)){ dh++; dupHarv++; byName[nm]=(byName[nm]||0)+1;
        byTier[c.tier]=(byTier[c.tier]||0)+1;
        if(/^main/i.test(where[k]||'')||/^main/i.test(L)){ mc++; mainCollide++; }
        if(samples.length<12) samples.push(c.key+' w'+w+' '+d+'  "'+nm+'"  in ['+where[k]+'] and ['+L+']');
      }
    } else { seen[k]=1; where[k]=L; }
  }}
 }
}
console.log('ia-version '+ia.version+'  configs '+cfgs.length+'  day cells '+cells);
console.log('same-card duplicates (any name):            '+dupAny);
console.log('same-card duplicates OF A HARVESTED NAME:   '+dupHarv+'   <- D76 / B5a says this must be 0');
console.log('  of which one copy is in a MAIN section:   '+mainCollide);
console.log('  by name:  '+JSON.stringify(byName));
console.log('  by tier:  '+JSON.stringify(byTier));
samples.forEach(s=>console.log('   '+s));
