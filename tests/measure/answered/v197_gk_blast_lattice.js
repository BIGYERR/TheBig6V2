// GATEKEEPER V197 blast-radius / identity fuzz. Baseline vs candidate on a wide lattice.
// Keys on (equip, focus, exper, goal, inj, rest, seed, week, day, sectionLabel, movement),
// never on position. Also counts undefined items and diffs _swapUniverse.
// usage: node tests/measure/v197_gk_blast_lattice.js <base.html> <cand.html>
'use strict';
const path = require('path');
const crypto = require('crypto');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];

const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit','travel_room_only'];
const FOCUS = ['support_prevention','hypertrophy','strength'];
const EXPER = ['beginner','intermediate','advanced'];
const SEEDS = [1013, 3039, 76308, 42];
const INJ   = [null, {region:'shoulder',tier:'protect'}, {region:'lowback',tier:'protect'}, {region:'knee',tier:'protect'}];
const REST  = [['sun','wed'], ['sat','sun'], ['sun']];
const GOALS = [
  { tag:'half', over:{} },
  { tag:'pace', over:{ primaryPath:'test', eventTargeted:false, raceDate:null,
      cardioGoals:{ run:{ id:'run_pace', label:'2 Mile Pace', mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } } } },
];

const cfgs = [];
let n = 0;
for (const equipment of EQUIP) for (const liftingFocus of FOCUS) for (const experience of EXPER)
for (const g of GOALS) for (const injury of INJ) for (const seed of SEEDS) {
  const restDays = REST[n++ % REST.length];
  cfgs.push({
    key: [equipment, liftingFocus, experience, g.tag, injury?injury.region+'/'+injury.tier:'healthy', restDays.join('+'), seed].join('|'),
    cfg: Object.assign({}, fixtures.HALF_MANNY, g.over, { equipment, liftingFocus, experience, injury, seed, restDays })
  });
}

function dump(file){
  const ia = load(file);
  const out = { cells:{}, digest:{}, undef:0, undefWhere:[], threw:0, swap:{}, days:0 };
  for (const c of cfgs){
    let p; try { p = ia.buildProgram(JSON.parse(JSON.stringify(c.cfg))); } catch(e){ out.threw++; continue; }
    out.digest[c.key] = progDigest(p);
    const su = p._swapUniverse;
    out.swap[c.key] = su ? (Array.isArray(su) ? su.slice().sort() : Object.keys(su).sort()) : null;
    for (const w of Object.keys(p.weeks||{})) for (const d of DAYS){
      const day = (p.weeks[w]||{})[d]; if (!day) continue;
      out.days++;
      const rows = [];
      for (const s of (day.sections||[])){
        if (!s) continue;
        const lbl = String(s.label||s.coreHeader||'(none)').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
        for (const it of (s.items||[])){
          if (it === undefined || it === null){ out.undef++; if(out.undefWhere.length<5) out.undefWhere.push(c.key+' w'+w+' '+d+' '+lbl+' LITERAL-UNDEFINED-ITEM'); continue; }
          if (it.name === undefined || it.name === null || String(it.name).trim()===''){ out.undef++; if(out.undefWhere.length<5) out.undefWhere.push(c.key+' w'+w+' '+d+' '+lbl+' NAMELESS'); }
          rows.push(lbl + ' :: ' + String(it.name) + ' :: ' + String(it.detail||''));
        }
      }
      out.cells[c.key+'|'+w+'|'+d] = rows.sort();
    }
  }
  return out;
}

const A = dump(process.argv[2]), B = dump(process.argv[3]);
console.log('configs ' + cfgs.length + '   day-cells base ' + A.days + ' / cand ' + B.days + '   builds-threw base ' + A.threw + ' / cand ' + B.threw);
console.log('UNDEFINED/NAMELESS items  base ' + A.undef + '   cand ' + B.undef);
A.undefWhere.concat(B.undefWhere).slice(0,6).forEach(w => console.log('    ' + w));

// identity: each side equals itself
const A2 = dump(process.argv[2]);
let selfDiff = 0;
for (const k of Object.keys(A.cells)) if (JSON.stringify(A.cells[k]) !== JSON.stringify(A2.cells[k])) selfDiff++;
console.log('SELF-IDENTITY of baseline (rebuilt in a fresh VM): ' + selfDiff + ' differing cells of ' + Object.keys(A.cells).length + (selfDiff?'  *** FUZZ REFERENCE UNSTABLE ***':'  OK'));

let movedBuilds = 0, movedCells = 0;
const byTier = {}, byLabel = {}, addedRows = {}, removedRows = {};
for (const c of cfgs){
  const tier = c.key.split('|')[0];
  byTier[tier] = byTier[tier] || { builds:0, cells:0, movedBuilds:0, movedCells:0 };
  byTier[tier].builds++;
  let moved = false;
  for (const w of Object.keys({}) ) {}
  for (const k of Object.keys(A.cells)){ /* noop */ break; }
  for (const dk of Object.keys(A.cells)){
    if (dk.indexOf(c.key + '|') !== 0) continue;
    byTier[tier].cells++;
    const a = A.cells[dk] || [], b = B.cells[dk] || [];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    moved = true; movedCells++; byTier[tier].movedCells++;
    const as = new Set(a), bs = new Set(b);
    for (const r of a) if (!bs.has(r)) { const L = r.split(' :: ')[0]; removedRows[L] = (removedRows[L]||0)+1; byLabel[L] = (byLabel[L]||0)+1; }
    for (const r of b) if (!as.has(r)) { const L = r.split(' :: ')[0]; addedRows[L]   = (addedRows[L]||0)+1;   byLabel[L] = (byLabel[L]||0)+1; }
  }
  if (moved) { movedBuilds++; byTier[tier].movedBuilds++; }
}
console.log('\nMOVED builds ' + movedBuilds + '/' + cfgs.length + '   MOVED day-cells ' + movedCells + '/' + Object.keys(A.cells).length);
console.log('per tier:');
for (const t of EQUIP) console.log('   ' + t.padEnd(17) + ' builds ' + String(byTier[t].movedBuilds).padStart(4) + '/' + String(byTier[t].builds).padStart(4) + '   cells ' + String(byTier[t].movedCells).padStart(5) + '/' + String(byTier[t].cells).padStart(6));
console.log('\nSECTION LABELS touched by any changed row (added or removed), with counts:');
Object.keys(byLabel).sort((a,b)=>byLabel[b]-byLabel[a]).forEach(l => console.log('   ' + String(byLabel[l]).padStart(6) + '  "' + l + '"   (removed ' + (removedRows[l]||0) + ' / added ' + (addedRows[l]||0) + ')'));

// Mario
const ia = load(process.argv[3]);
console.log('\nMARIO HALF_MANNY digest cand ' + progDigest(ia.buildProgram(fixtures.HALF_MANNY)));
const iaB = load(process.argv[2]);
console.log('MARIO HALF_MANNY digest base ' + progDigest(iaB.buildProgram(fixtures.HALF_MANNY)));

// _swapUniverse
let swapMoved = 0; const swapDetail = [];
for (const c of cfgs){
  const a = A.swap[c.key], b = B.swap[c.key];
  if (JSON.stringify(a) !== JSON.stringify(b)){
    swapMoved++;
    if (swapDetail.length < 400) {
      const as = new Set(a||[]), bs = new Set(b||[]);
      const lost = (a||[]).filter(x=>!bs.has(x)), gain = (b||[]).filter(x=>!as.has(x));
      swapDetail.push({ key:c.key, len:(a||[]).length+'->'+(b||[]).length, lost, gain });
    }
  }
}
console.log('\n_swapUniverse: ' + swapMoved + '/' + cfgs.length + ' configs changed');
const lostAgg = {}, gainAgg = {}, tierLen = {};
swapDetail.forEach(d => { const t=d.key.split('|')[0]; tierLen[t]=d.len; d.lost.forEach(x=>lostAgg[x]=(lostAgg[x]||0)+1); d.gain.forEach(x=>gainAgg[x]=(gainAgg[x]||0)+1); });
console.log('   names LOST from _swapUniverse anywhere: ' + JSON.stringify(lostAgg));
console.log('   names GAINED anywhere:                  ' + JSON.stringify(gainAgg));
console.log('   sample len change per tier: ' + JSON.stringify(tierLen));
