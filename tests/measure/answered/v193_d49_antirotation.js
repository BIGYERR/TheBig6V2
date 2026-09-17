// MEASURE v193 slice 4 — D49 (two gear-free anti_rotation members) + the Pallof press gear
// tag. Read-only census of ONE artifact so two artifacts can be differenced:
//   per-tier _auxGearOK verdicts for every CORE_PILLARS member, legal member counts per
//   pillar (floor is 2), Pallof press / carry occurrences, distinct anti_rotation pairs,
//   coach's six-item acceptance bar, same-day duplicate names, and determinism.
// usage: node tests/measure/v193_d49_antirotation.js <file.html> [--json out.json]
const path = require('path'); const fs = require('fs');
const { load, fixtures, DAYS, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html';
const JSONOUT = (process.argv.indexOf('--json') > 0) ? process.argv[process.argv.indexOf('--json') + 1] : null;
const IA = load(FILE);
const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const SEEDS = [1013, 3039, 6078, 10130, 76308];
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const NAME_PREHAB = /clamshell|side-lying|side steps|banded|band pull|face pull|external rotation|scap|wall sit|spanish squat|calf raise|tibialis|toe |ankle|monster walk|glute bridge|bird dog|dead bug|pallof|lateral raise|cuff|y-raise|w-raise|t-raise/i;
const CARRY = ['Farmer carry','Suitcase carry','Overhead carry','Trap bar farmer carry'];

// ── 1. the legality table straight off the engine's own lens, per tier ────────
const legal = IA.eval(`(function(){
  var P=CORE_PILLARS, EQ=['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
  var lists={}; Object.keys(P).forEach(function(k){
    var it=P[k].items||P[k].static||[]; lists[k]=it.map(function(x){return x.name;});
    if(P[k].loaded) lists[k+'_loaded']=P[k].loaded.map(function(x){return x.name;});
    if(P[k].static) lists[k+'_static']=P[k].static.map(function(x){return x.name;});
  });
  var out={};
  Object.keys(lists).forEach(function(k){
    out[k]={members:lists[k],byTier:{}};
    EQ.forEach(function(e){ out[k].byTier[e]=lists[k].filter(function(n){return _auxGearOK(n,e);}); });
  });
  return out;
})()`);

const out = { file: FILE, legal, tiers: {}, digests: {} };

for (const equipment of EQUIP){
  const T = { days:0, sections:0, items:0, coreSec:0, coreItems:0, thinCore:0, emptySec:0,
              optSec:0, nonOptSec:0, nonOptByLabel:{}, prehabName:0, byName:{},
              arPairs:{}, arBlocks:0, arNames:{}, pillarCarry:0, otherCarry:0, sameDayDupes:{} };
  for (const seed of SEEDS){
    const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment, seed }));
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        T.days++;
        const dayNames = {};
        for (const s of (day.sections || [])){
          if(!s) continue;
          T.sections++;
          const L = clean(s.label || s.coreHeader || '');
          const items = (s.items||[]).filter(Boolean);
          T.items += items.length;
          if (s.optional) T.optSec++; else { T.nonOptSec++; T.nonOptByLabel[L]=(T.nonOptByLabel[L]||0)+1; }
          if (items.length === 0) T.emptySec++;
          if (s.core){ T.coreSec++; T.coreItems += items.length; if (items.length !== 2) T.thinCore++; }
          if (s.core && s.pillar === 'anti_rotation'){
            T.arBlocks++;
            const pair = items.map(it=>clean(it.name)).sort().join(' + ');
            T.arPairs[pair] = (T.arPairs[pair]||0)+1;
            items.forEach(it=>{ const n=clean(it.name); T.arNames[n]=(T.arNames[n]||0)+1;
                                if (CARRY.indexOf(n)>=0) T.pillarCarry++; });
          }
          for (const it of items){
            const n = clean(it.name);
            T.byName[n] = (T.byName[n]||0)+1;
            if (NAME_PREHAB.test(n)) T.prehabName++;
            if (CARRY.indexOf(n)>=0 && !(s.core && s.pillar==='anti_rotation')) T.otherCarry++;
            dayNames[n] = (dayNames[n]||0)+1;
          }
        }
        Object.keys(dayNames).forEach(n=>{ if(dayNames[n]>1) T.sameDayDupes[n]=(T.sameDayDupes[n]||0)+1; });
      }
    if (equipment==='commercial' && seed===76308) out.digests[equipment]=progDigest(prog);
  }
  out.tiers[equipment] = T;
}

// determinism: same cfg twice must digest identically
let detOK = true;
for (const equipment of EQUIP){
  const a = progDigest(IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment, seed: 76308 })));
  const b = progDigest(IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment, seed: 76308 })));
  out.digests['det_'+equipment] = a;
  if (a !== b) detOK = false;
}
out.determinism = detOK;

console.log('FILE ' + FILE);
console.log('\n== _auxGearOK verdicts, anti_rotation members ==');
const arm = legal.anti_rotation.members;
console.log('member'.padEnd(26) + EQUIP.map(e=>e.slice(0,5).padStart(7)).join(''));
for (const m of arm)
  console.log(m.padEnd(26) + EQUIP.map(e=>(legal.anti_rotation.byTier[e].indexOf(m)>=0?'ok':'NO').padStart(7)).join(''));

console.log('\n== legal member count per pillar per tier (floor 2) ==');
const pk = Object.keys(legal);
console.log('pillar'.padEnd(26) + EQUIP.map(e=>e.slice(0,5).padStart(7)).join(''));
let floorViol = [];
for (const k of pk){
  console.log(k.padEnd(26) + EQUIP.map(e=>String(legal[k].byTier[e].length).padStart(7)).join(''));
  for (const e of EQUIP) if (legal[k].byTier[e].length < 2) floorViol.push(k+'/'+e+'='+legal[k].byTier[e].length);
}
console.log('FLOOR VIOLATIONS: ' + (floorViol.length ? floorViol.join(', ') : 'none'));

console.log('\n== emitted (5 seeds x HALF_MANNY) ==');
console.log('tier          days  sect  items coreSec coreItm thin empty  Pallof BirdDog PlShTap SidePlk  arBlk arPairs pCarry oCarry prehab');
for (const e of EQUIP){
  const T = out.tiers[e]; const g = n => T.byName[n]||0;
  console.log(e.padEnd(13)+String(T.days).padStart(5)+String(T.sections).padStart(6)+String(T.items).padStart(7)
    +String(T.coreSec).padStart(8)+String(T.coreItems).padStart(8)+String(T.thinCore).padStart(5)+String(T.emptySec).padStart(6)
    +String(g('Pallof press')).padStart(8)+String(g('Bird dogs')).padStart(8)+String(g('Plank shoulder taps')).padStart(8)
    +String(g('Side plank')).padStart(8)+String(T.arBlocks).padStart(7)+String(Object.keys(T.arPairs).length).padStart(8)
    +String(T.pillarCarry).padStart(7)+String(T.otherCarry).padStart(7)+String(T.prehabName).padStart(7));
}
console.log('\n== anti_rotation pairs emitted ==');
for (const e of EQUIP) console.log(e.padEnd(13)+JSON.stringify(out.tiers[e].arPairs));
console.log('\n== same-day duplicate names (day count) ==');
for (const e of EQUIP) console.log(e.padEnd(13)+JSON.stringify(out.tiers[e].sameDayDupes));
console.log('\ndeterminism: ' + (detOK ? 'STABLE' : 'UNSTABLE'));

if (JSONOUT){ fs.writeFileSync(JSONOUT, JSON.stringify(out)); console.log('wrote ' + JSONOUT); }
