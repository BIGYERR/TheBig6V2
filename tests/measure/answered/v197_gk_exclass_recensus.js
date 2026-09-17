// GATEKEEPER independent recompute of B4's ex-class per-tier deletion table.
// Written from scratch against the artifacts, NOT read out of g193_budget_floor.js.
// Usage: node tests/measure/v197_gk_exclass_recensus.js <base.html> <cand.html>
'use strict';
const path = require('path');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const LAT = require(path.join(__dirname, '..', 'lattice193.js'));
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const EXCLUDE = 'Leg isolation';                       // D81's one member
const SEP = '~|~';
const strip = s => String(s||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();

function sig(s){ return [strip(s.label), strip(s.coreHeader), s.pillar||'', s.core?'C':'', s.hip?'H':'', s.optional?'O':''].join(SEP); }
function labelOf(k){ const p = k.split(SEP); return p[0] || p[1] || '(no label)'; }
function isOpt(k){ return k.split(SEP)[5] === 'O'; }

function census(file){
  const ia = load(file);
  const snap = off => {
    ia.eval('globalThis.__BUDGET_OFF = ' + (off?'true':'false') + ';');
    const m = {};
    for (const c of LAT.WIDE){
      const prog = ia.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over));
      for (const w of Object.keys(prog.weeks||{})) for (const d of DAYS){
        const day = (prog.weeks[w]||{})[d]; if(!day) continue;
        m[c.key+'|'+w+'|'+d] = (day.sections||[]).filter(Boolean).map(sig);
      }
    }
    ia.eval('globalThis.__BUDGET_OFF = false;');
    return m;
  };
  const OFF = snap(true), ON = snap(false);
  const per = {}; for (const e of LAT.EQUIP) per[e] = { gross:0, ex:0, ruled:0, opt:0 };
  const kinds = {}; let added = 0, days = 0;
  for (const dk of Object.keys(OFF)){
    days++;
    const tier = dk.split('|')[1];
    const A = {}, B = {};
    for (const k of OFF[dk]) A[k] = (A[k]||0)+1;
    for (const k of (ON[dk]||[])) B[k] = (B[k]||0)+1;
    for (const k of Object.keys(A)){
      const d = A[k] - (B[k]||0); if (d <= 0) continue;
      if (isOpt(k)) { per[tier].opt += d; continue; }
      const lbl = labelOf(k);
      per[tier].gross += d;
      if (lbl === EXCLUDE) per[tier].ruled += d; else per[tier].ex += d;
      kinds[lbl] = (kinds[lbl]||0) + d;
    }
    for (const k of Object.keys(B)) { const d = (B[k]||0) - (A[k]||0); if (d>0) added += d; }
  }
  return { per, kinds, added, days, cells: LAT.WIDE.length, ver: ia.version };
}

const files = process.argv.slice(2);
const R = {};
for (const f of files){
  const r = census(f); R[f] = r;
  console.log('== ' + path.basename(f) + '  ia-version ' + r.ver + '  cells ' + r.cells + '  day-builds ' + r.days + '  sections-added-by-budget ' + r.added);
  for (const e of LAT.EQUIP)
    console.log('   ' + e.padEnd(11) + ' gross ' + String(r.per[e].gross).padStart(5) +
                '   ex ' + String(r.per[e].ex).padStart(5) +
                '   ruled ' + String(r.per[e].ruled).padStart(5) +
                '   optional ' + String(r.per[e].opt).padStart(4));
  const g = LAT.EQUIP.reduce((a,e)=>a+r.per[e].gross,0), x = LAT.EQUIP.reduce((a,e)=>a+r.per[e].ex,0), u = LAT.EQUIP.reduce((a,e)=>a+r.per[e].ruled,0);
  console.log('   AGG         gross ' + g + '   ex ' + x + '   ruled ' + u);
  console.log('   classes ' + JSON.stringify(r.kinds));
}
if (files.length >= 2){
  const a = files[0], b = files[1];
  console.log('');
  console.log('== RATCHET cand=' + path.basename(b) + ' vs base=' + path.basename(a) + ', EX-CLASS, exclusion on BOTH sides ==');
  const rose = [];
  for (const e of LAT.EQUIP){
    const d = R[b].per[e].ex - R[a].per[e].ex;
    console.log('   ' + e.padEnd(11) + ' base ' + String(R[a].per[e].ex).padStart(5) + ' -> cand ' + String(R[b].per[e].ex).padStart(5) + '   delta ' + (d>=0?'+':'') + d + (d>0?'   *** ROSE ***':''));
    if (d > 0) rose.push(e);
  }
  console.log('   tiers that ROSE ex-class: ' + rose.length + '/' + LAT.EQUIP.length + (rose.length?' -> '+rose.join(', '):''));
  console.log('== same, GROSS (no exclusion, one-sided-check control) ==');
  const roseG = [];
  for (const e of LAT.EQUIP){
    const d = R[b].per[e].gross - R[a].per[e].gross;
    console.log('   ' + e.padEnd(11) + ' base ' + String(R[a].per[e].gross).padStart(5) + ' -> cand ' + String(R[b].per[e].gross).padStart(5) + '   delta ' + (d>=0?'+':'') + d);
    if (d>0) roseG.push(e);
  }
  console.log('   tiers that ROSE gross: ' + roseG.length + '/' + LAT.EQUIP.length);
}
