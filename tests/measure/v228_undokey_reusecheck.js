// v228_undokey_reusecheck.js — MEASURE instrument check for v228_undokey.js. Compares the per-chain results of a run with one
// fresh VM per batch (dir A) against a run with REUSE=1 (one VM per worker, localStorage cleared and re-seeded per batch) (dir B).
//   node tests/measure/v228_undokey_reusecheck.js <dirA> <dirB>
'use strict';
const fs = require('fs'), path = require('path');
const [A, B] = process.argv.slice(2); const files = fs.readdirSync(A).filter(f => /^ur_.*\.json$/.test(f));
const K = ['unreach', 'chip', 'ok', 'dayEq', 'aH', 'bH', 'bootEq', 'bootPre', 'chipAfter', 'toast', 'sa', 'sb'];
let n = 0, same = 0, missing = 0, fileMissing = 0; const diffs = [];
for(const f of files){ const fb = path.join(B, f); if(!fs.existsSync(fb)){ fileMissing++; continue; }
  const ra = JSON.parse(fs.readFileSync(path.join(A, f), 'utf8')).rows, rb = new Map(JSON.parse(fs.readFileSync(fb, 'utf8')).rows.map(r => [r.id, r]));
  for(const r of ra){ n++; const s = rb.get(r.id); if(!s){ missing++; continue; } const bad = K.filter(k => JSON.stringify(r[k]) !== JSON.stringify(s[k])); if(!bad.length) same++; else if(diffs.length < 5) diffs.push(f + ' ' + r.id + ' ' + bad.join(',')); } }
console.log('reusecheck: files ' + files.length + ' (absent in B ' + fileMissing + ') | rows ' + n + ' | identical on ' + K.length + ' fields ' + same + ' | missing ' + missing + ' | differ ' + (n - same - missing));
diffs.forEach(d => console.log('  DIFF ' + d));
