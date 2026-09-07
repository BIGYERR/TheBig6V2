// MEASURE v192 — label/item mismatch census on the injury post-filter.
//
// Question: how many section headings name a movement the athlete is not
// prescribed? Labels are written as '<slot> — <drawn movement>' at draw time;
// applyInjuryFilter can rewrite the ITEM name afterwards (P.swapNames /
// SPINE_SWAP) or delete the item (P.dropNames), and the heading does not follow.
//
// ORACLE (no engine call): a label of the form '<prefix> — <tail>' where <tail>
// is a movement name (it appears as an item name somewhere in the corpus) is a
// CLAIM about the section. The claim holds only if some item in that section is
// named <tail>. Mismatches are bucketed by cause:
//   SWAP  — <tail> is a key of a known swap map (name rewritten in place)
//   DROP  — otherwise (item deleted by dropNames / pattern drop, heading left)
//
// Usage: node tests/measure/v192_label_latch.js <html> [<html2> ...]
const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const REGIONS = [['shoulder','workaround']];
const SEEDS = []; for(let i=1;i<=12;i++) SEEDS.push(i*1013);
const clean = s => String(s||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();

// swap-map keys, transcribed by hand from the doctrine of the workaround tiers.
const SWAP_KEYS = new Set([
  'Dumbbell bench press',                                     // shoulder/workaround (D43)
  'Dumbbell skullcrushers','Barbell curl','Preacher curl',    // elbow/workaround
  'Ab wheel rollouts','Hanging knee raises','L-sit hold',
  'L-sit chinups','Hanging leg raises',                       // spine-safe core
]);

function census(file){
  const IA = load(file);
  // Movement vocabulary: gathered from a HEALTHY control lattice as well as the
  // injured one. A name the overlay swaps away everywhere (Dumbbell bench press on
  // shoulder/workaround) is still a movement name — reading the vocabulary off the
  // injured corpus alone would make the very mismatch we are counting invisible.
  const vocab = new Set(SWAP_KEYS);
  for(const equipment of EQUIP){
    const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, {equipment, seed: 1013}));
    for(const wk of Object.keys(prog.weeks||{})) for(const d of DAYS){
      const day = prog.weeks[wk][d]; if(!day) continue;
      for(const s of (day.sections||[])) for(const it of (s.items||[])){ const n = clean(it.name); if(n) vocab.add(n); }
    }
  }
  const secs = [];
  let builds = 0;
  for(const equipment of EQUIP)
    for(const [region,tier] of REGIONS)
      for(const seed of SEEDS){
        const cfg = Object.assign({}, fixtures.HALF_MANNY, {equipment, seed, injury:{region,tier}});
        const prog = IA.buildProgram(cfg); builds++;
        const weeks = prog.weeks||{};
        for(const wk of Object.keys(weeks)) for(const d of DAYS){
          const day = weeks[wk][d]; if(!day) continue;
          for(const s of (day.sections||[])){
            const names = (s.items||[]).map(i=>clean(i.name));
            names.forEach(n=>{ if(n) vocab.add(n); });
            secs.push({equipment, seed, wk:+wk, d, label:String(s.label||''), names,
                       weeks:Object.keys(weeks).length});
          }
        }
      }
  const out = {builds, total:secs.length, mismatch:0, swap:0, drop:0, byPrefix:{}, byEquip:{},
               primerSwap:0, primerRaceWeek:0, samples:[], d43fires:0, d43labelOK:0};
  for(const s of secs){
    const i = s.label.lastIndexOf(' — ');
    if(i < 0) continue;
    const prefix = s.label.slice(0,i), tail = s.label.slice(i+3).trim();
    if(!vocab.has(tail)) continue;              // not a movement claim
    if(s.names.includes(tail)) continue;        // claim holds
    out.mismatch++;
    const cause = SWAP_KEYS.has(tail) ? 'swap' : 'drop';
    out[cause]++;
    out.byPrefix[prefix+'/'+cause] = (out.byPrefix[prefix+'/'+cause]||0)+1;
    out.byEquip[s.equipment+'/'+cause] = (out.byEquip[s.equipment+'/'+cause]||0)+1;
    if(prefix==='Primer' && cause==='swap'){
      out.primerSwap++;
      if(s.wk === s.weeks) out.primerRaceWeek++;
    }
    if(out.samples.length < 8) out.samples.push(`${s.equipment} seed=${s.seed} W${s.wk} ${s.d.toUpperCase()} [${cause}] "${s.label}" :: ${s.names.join(', ')}`);
  }
  // D43 must still FIRE: the swapped item must be present somewhere.
  for(const s of secs){
    if(s.names.includes('Dumbbell floor press')) out.d43fires++;
    if(s.names.includes('Dumbbell floor press') && /Dumbbell floor press$/.test(s.label)) out.d43labelOK++;
  }
  return out;
}

for(const file of process.argv.slice(2)){
  const r = census(file);
  console.log('== ' + file);
  console.log(`   builds=${r.builds} sections=${r.total} labelClaimMismatch=${r.mismatch} (swap=${r.swap} drop=${r.drop})`);
  console.log('   byPrefix ' + JSON.stringify(r.byPrefix));
  console.log('   byEquip  ' + JSON.stringify(r.byEquip));
  console.log(`   Primer swap-mismatch=${r.primerSwap} of which race-week=${r.primerRaceWeek}`);
  console.log(`   D43 'Dumbbell floor press' prescribed in ${r.d43fires} sections; heading names it in ${r.d43labelOK}`);
  r.samples.forEach(s=>console.log('     ' + s));
}
