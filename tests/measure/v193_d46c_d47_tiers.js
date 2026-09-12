// MEASURE v193 slice 3 — D46-c (pillar gate through _auxGearOK) and D47 (budget does not
// protect an optional section). Read-only. Prints the per-tier picture for one artifact:
//   gear leaks by name, one-item core finishers, core sections, distinct rotational members,
//   and the full item-name multiset so two artifacts can be differenced.
// usage: node tests/measure/v193_d46c_d47_tiers.js <file.html> [--json out.json]
const path = require('path');
const fs = require('fs');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || 'index.html';
const JSONOUT = (process.argv.indexOf('--json') > 0) ? process.argv[process.argv.indexOf('--json') + 1] : null;
const IA = load(FILE);
const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const SEEDS = [1013, 3039, 6078, 10130, 76308];
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

const ROT = ['Windshield wipers','Medicine ball rotary toss','Cable woodchoppers','Landmine rotations',
             'Standing torso rotations (slow)','Side plank thread-the-needle','Band woodchopper (door anchor)'];

const out = { file: FILE, tiers: {}, names: {} };
for (const equipment of EQUIP){
  const T = { items:0, coreSections:0, coreItems:0, thinCore:0, emptyCoreDays:0, rot:{}, byName:{} };
  for (const seed of SEEDS){
    const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment, seed }));
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        for (const s of (day.sections || [])){
          if (s && s.core){ T.coreSections++; T.coreItems += (s.items||[]).length; if ((s.items||[]).length !== 2) T.thinCore++; }
          for (const it of (s.items || [])){
            const n = clean(it.name);
            T.items++;
            T.byName[n] = (T.byName[n]||0) + 1;
            out.names[n] = 1;
            if (ROT.indexOf(n) >= 0) T.rot[n] = (T.rot[n]||0) + 1;
          }
        }
      }
  }
  T.distinctRot = Object.keys(T.rot).length;
  out.tiers[equipment] = T;
}

console.log('FILE ' + FILE);
console.log('tier          items  coreSec coreItems thin  distinctRot  Cable  MedBall  Landmine  Band');
for (const e of EQUIP){
  const T = out.tiers[e];
  const g = n => T.byName[n] || 0;
  console.log(e.padEnd(13) + String(T.items).padStart(6) + String(T.coreSections).padStart(8) +
    String(T.coreItems).padStart(10) + String(T.thinCore).padStart(6) + String(T.distinctRot).padStart(13) +
    String(g('Cable woodchoppers')).padStart(7) + String(g('Medicine ball rotary toss')).padStart(9) +
    String(g('Landmine rotations')).padStart(10) + String(g('Band woodchopper (door anchor)')).padStart(6));
  console.log('    rot members reached: ' + JSON.stringify(T.rot));
}
if (JSONOUT){ fs.writeFileSync(JSONOUT, JSON.stringify(out)); console.log('wrote ' + JSONOUT); }
