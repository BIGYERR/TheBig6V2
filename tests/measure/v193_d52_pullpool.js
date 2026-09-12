// MEASURE v193 D52 — the lowback/protect vertical-pull pool against its own overlay.
// Sweeps tests/lattice193.js WIDE (288 cells) and reports, for one artifact:
//   * Full Body days that ship with zero pulling, per injury cell and gear tier
//   * total pull items (pull volume proxy) and day-builds holding fewer than two pulls
//   * SPINE_SWAP null-drops of 'L-sit chinups' the overlay actually performs
//   * the branch's own vertical-pull literal, and how many members survive the overlay
//     at each gear tier (D44's floor is two)
//   * 'Main — X' names that print twice on the same card
// Usage: node tests/measure/v193_d52_pullpool.js <file.html> [wide|full]
const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const L = require(path.join(__dirname, '..', 'lattice193.js'));
const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const _pattern = IA.eval('_pattern');
const isPull = n => { const p = _pattern(n); return p === 'row' || p === 'vpull'; };

let days = 0, fullDays = 0, fullNoPull = 0, mainRepeat = 0, pullItems = 0, thinPull = 0;
const noPullBy = {}, repeatNames = {}, pullByInj = {};

const LAT = (process.argv[3] === 'full') ? L.FULL : L.WIDE;
const LATN = (process.argv[3] === 'full') ? 'FULL' : 'WIDE';
for (const c of LAT){
  const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over));
  const weeks = prog.weeks || {};
  for (const wk of Object.keys(weeks)) for (const d of DAYS){
    const day = weeks[wk][d]; if (!day || !day.sections) continue;
    days++;
    const names = [];
    let mainName = null;
    for (const s of day.sections){
      const m = clean(s.label || '').match(/^Main — (.+)$/);
      if (m) mainName = m[1];
      for (const it of (s.items || [])) if (it && it.name) names.push(clean(it.name));
    }
    const nPull = names.filter(isPull).length;
    pullItems += nPull;
    pullByInj[c.inj] = (pullByInj[c.inj] || 0) + nPull;
    if (/full body/i.test(String(day.title || ''))){
      fullDays++;
      if (!nPull){
        fullNoPull++;
        const k = c.inj + ' / ' + c.equipment;
        noPullBy[k] = (noPullBy[k] || 0) + 1;
      }
    }
    if (nPull === 1) thinPull++;
    if (mainName && names.filter(n => n === mainName).length > 1){
      mainRepeat++;
      repeatNames[mainName] = (repeatNames[mainName] || 0) + 1;
    }
  }
}

console.log('FILE ' + FILE + '  ia-version ' + IA.version);
console.log('cells ' + LAT.length + ' (lattice193 ' + LATN + ')  day-builds ' + days);
console.log('Full Body days ' + fullDays + '  |  ZERO pulling: ' + fullNoPull);
Object.keys(noPullBy).sort().forEach(k => console.log('   ' + k.padEnd(34) + noPullBy[k]));
if (!fullNoPull) console.log('   (none)');
console.log('pull items total ' + pullItems + '  ' + JSON.stringify(pullByInj));
console.log('day-builds holding exactly one pull: ' + thinPull);
console.log('"Main —" name repeats on one card: ' + mainRepeat + '  ' + JSON.stringify(repeatNames));

// ── the branch literal, read out of the source, and its survival per gear tier.
const applyInjuryFilter = IA.eval('applyInjuryFilter');
const SRC = require('fs').readFileSync(FILE, 'utf8');
const m = SRC.match(/rowPool = hasCables\?\['Straight-arm pulldown'\]:(\[[^\]]*\])/);
const LIT = m ? JSON.parse(m[1].replace(/'/g, '"')) : [];
console.log('lowback/protect vertical-pull literal: ' + JSON.stringify(LIT));
for (const equipment of L.EQUIP){
  const cfg = Object.assign({}, fixtures.HALF_MANNY, { equipment, seed:76308,
    injury:{ region:'lowback', tier:'protect' } });
  const survivors = LIT.filter(n =>
    ((applyInjuryFilter([{ label:'Probe', items:[{ name:n, detail:'3×5' }] }], cfg)[0] || {}).items || []).length === 1);
  console.log('  ' + equipment.padEnd(12) + survivors.length + '  ' + JSON.stringify(survivors));
}

// ── null-drops of 'L-sit chinups' the overlay performs across the WIDE lattice.
let drops = 0, applicable = 0;
for (const c of LAT){
  const cfg = Object.assign({}, fixtures.HALF_MANNY, c.over);
  applicable++;
  const out = applyInjuryFilter([{ label:'Probe', items:[{ name:'L-sit chinups', detail:'3×5' }] }], cfg);
  if (!((out[0] || {}).items || []).length) drops++;
}
console.log('cells whose overlay null-drops "L-sit chinups": ' + drops + ' / ' + applicable);
