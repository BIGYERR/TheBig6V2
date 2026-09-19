// MEASURE v199 — D91 B3 displacement census, WIDE lattice.
// Re-derives, against the FINAL V199 artifact, the per-tier prehab fall vs the live V198
// baseline that B3's bare ratchet reports, and splits it BY NAME so the confined name set
// for the D91 licence is read off the engine rather than guessed.
// usage: node tests/measure/v199_d91_b3_displacement.js <cand.html> <base.html>
const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const LAT = require(path.join(__dirname, '..', 'lattice193.js'));
const EQUIP = LAT.EQUIP, CELLS = LAT.WIDE;
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const PREHAB_NAMES = [
  'Spanish squat hold (KB)','Wall sit','Terminal knee extension (band)','Single-leg wall sit',
  'Dumbbell lateral raise','Cable lateral raise','Dumbbell front raise','Dumbbell rear delt fly',
  'Face pull','Prone Y-T-W raises','Wall slides',
];
function census(ia){
  ia.eval('globalThis.__BUDGET_OFF = false;');
  const t = {};
  for (const e of EQUIP) t[e] = { prehab:0, prehabHip:0, prehabName:{} };
  for (const c of CELLS){
    const T = t[c.equipment];
    const prog = ia.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over));
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        for (const s of (day.sections || [])){
          if (!s) continue;
          for (const it of (s.items||[])){
            const nm = clean(it.name);
            if (!s.hip && PREHAB_NAMES.indexOf(nm) < 0) continue;
            T.prehab++;
            if (s.hip) T.prehabHip++; else T.prehabName[nm] = (T.prehabName[nm]||0) + 1;
          }
        }
      }
  }
  return t;
}
const C = census(load(process.argv[2])), B = census(load(process.argv[3]));
const disp = {}, other = {}; let sum = 0;
const fellNames = {};
for (const e of EQUIP){
  const d = B[e].prehab - C[e].prehab; disp[e] = d; sum += d;
  const per = [];
  const names = new Set(Object.keys(B[e].prehabName).concat(Object.keys(C[e].prehabName)));
  for (const n of names){
    const dd = (B[e].prehabName[n]||0) - (C[e].prehabName[n]||0);
    if (dd !== 0){ per.push(n + ' ' + (B[e].prehabName[n]||0) + ' -> ' + (C[e].prehabName[n]||0) + ' (' + (dd>0?'-':'+') + Math.abs(dd) + ')');
      if (dd > 0) fellNames[n] = (fellNames[n]||0) + dd; }
  }
  console.log(e.padEnd(11) + ' prehab ' + String(B[e].prehab).padStart(5) + ' -> ' + String(C[e].prehab).padStart(5) +
    '  delta ' + (d>0?'-':'+') + Math.abs(d) + '   hip ' + B[e].prehabHip + ' -> ' + C[e].prehabHip);
  for (const p of per) console.log('        ' + p);
}
console.log('DISPLACEMENT_WIDE = ' + JSON.stringify(disp));
console.log('SUM = ' + sum);
console.log('NAMES THAT FELL (all tiers) = ' + JSON.stringify(fellNames));
// off-licence table: prehab by NAME excluding the fallen names
const FELL = Object.keys(fellNames);
for (const e of EQUIP){
  let o = 0; for (const n of Object.keys(C[e].prehabName)) if (FELL.indexOf(n) < 0) o += C[e].prehabName[n];
  let ob = 0; for (const n of Object.keys(B[e].prehabName)) if (FELL.indexOf(n) < 0) ob += B[e].prehabName[n];
  other[e] = { base: ob, cand: o };
}
console.log('OFF-LICENCE (base vs cand) = ' + JSON.stringify(other));
console.log('HIP RAIL cand = ' + JSON.stringify(EQUIP.map(e => e + ':' + C[e].prehabHip).join(', ')));
console.log('HIP RAIL base = ' + JSON.stringify(EQUIP.map(e => e + ':' + B[e].prehabHip).join(', ')));
