// MEASURE v193 slice 4 — the protect-tier upper-limb trunk seam.
// Reports, for one artifact: Pallof press per tier under shoulder/elbow protect, same-day
// duplicate names on the two Trunk sections, and the anti-rotation legal-member count per
// tier. Run it against the baseline and the candidate; the numbers are the before/after.
// Usage: node tests/measure/v193_slice4_trunk.js <file.html>
const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const SEEDS = [1013, 3039, 6078, 10130, 76308];
const CFGS = [
  { tag:'healthy',  extra: {} },
  { tag:'shoulder', extra: { injury:{ region:'shoulder', tier:'protect' } } },
  { tag:'elbow',    extra: { injury:{ region:'elbow',    tier:'protect' } } },
];

let days = 0;
const pallof = {};                 // equip -> count of 'Pallof press' items (injury cfgs)
const dupDay = {};                 // name -> days where it printed twice on ONE day
const dupByCfg = {};
EQUIP.forEach(e => pallof[e] = 0);

for (const c of CFGS) for (const equipment of EQUIP) for (const seed of SEEDS){
  const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment, seed }, c.extra));
  const weeks = prog.weeks || {};
  for (const wk of Object.keys(weeks)) for (const d of DAYS){
    const day = weeks[wk][d]; if (!day) continue;
    days++;
    const seen = {};
    for (const s of (day.sections || [])) for (const it of (s.items || [])){
      if (!it || !it.name) continue;
      const n = clean(it.name);
      seen[n] = (seen[n] || 0) + 1;
      if (n === 'Pallof press' && c.tag !== 'healthy') pallof[equipment]++;
    }
    for (const n of Object.keys(seen)) if (seen[n] > 1){
      dupDay[n] = (dupDay[n] || 0) + 1;
      dupByCfg[n] = dupByCfg[n] || {};
      dupByCfg[n][c.tag + '/' + equipment] = (dupByCfg[n][c.tag + '/' + equipment] || 0) + 1;
    }
  }
}

console.log('FILE ' + FILE + '  ia-version ' + IA.version);
console.log('days swept: ' + days + ' (' + CFGS.length + ' cfgs x ' + EQUIP.length + ' tiers x ' + SEEDS.length + ' seeds)');
console.log('Pallof press under shoulder/elbow protect: ' + JSON.stringify(pallof));
console.log('same-day duplicate movement names (days):');
Object.keys(dupDay).sort((a,b)=>dupDay[b]-dupDay[a]).forEach(n =>
  console.log('  ' + n.padEnd(28) + String(dupDay[n]).padStart(4) + '  ' + JSON.stringify(dupByCfg[n])));
if (!Object.keys(dupDay).length) console.log('  (none)');

// anti-rotation legal members per tier, through the branch's own two filters.
const AR = IA.eval('CORE_PILLARS').anti_rotation.items.map(i => i.name);
const AE = IA.eval('CORE_PILLARS').anti_extension.static.map(i => i.name);
const gearOK = IA.eval('_auxGearOK');
console.log('anti_rotation legal members per tier (carries stripped, gear gated):');
for (const e of EQUIP){
  const legal = AR.filter(n => !/carry/i.test(n) && gearOK(n, e));
  const free  = legal.filter(n => AE.indexOf(n) < 0);
  console.log('  ' + e.padEnd(11) + legal.length + ' [' + legal.join(', ') + ']  not-in-anti-extension: ' + free.length);
}
console.log('anti_extension.static members: ' + AE.length + ' [' + AE.join(', ') + ']');
console.log('overlap: ' + AR.filter(n => AE.indexOf(n) >= 0).join(', '));
