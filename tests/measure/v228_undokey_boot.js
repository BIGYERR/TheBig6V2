// v228_undokey_boot.js — MEASURE post-pass over v228_undokey.js result files: boot vs live after undo, V227 vs CF.
//   node tests/measure/v228_undokey_boot.js <dir> [<dir> ...]
// Collapse is read from the chain tuple by hand: a store that holds fewer records than the chain has hops lost a record to
// recordSwap's same-from filter (the D191 class). Nothing here asks swapOriginOf or undoSwap.
'use strict';
const fs = require('fs'), path = require('path');
const T = {}; const add = (k, v) => { T[k] = (T[k] || 0) + (v === undefined ? 1 : v); }; const created = [], ex = [];
for(const dir of process.argv.slice(2)){ const ch = fs.readdirSync(dir).filter(f => /^ur_V227_.*\.json$/.test(f)).map(f => f.slice(8));
  for(const c of ch){ const fc = path.join(dir, 'ur_CF_' + c); if(!fs.existsSync(fc)){ add('MISSING CF file'); continue; }
    const V = JSON.parse(fs.readFileSync(path.join(dir, 'ur_V227_' + c), 'utf8')).rows, C = new Map(JSON.parse(fs.readFileSync(fc, 'utf8')).rows.map(r => [r.id, r]));
    for(const v of V){ const r = C.get(v.id); if(!r || v.unreach || r.unreach) continue; const k = v.kind; const col = r.sb.length < r.n ? 'collapsed' : 'one-per-hop';
      add(k + ' n'); add(k + ' CF boot!=live', !r.bootEq ? 1 : 0); add(k + ' V227 boot!=live', !v.bootEq ? 1 : 0);
      if(!r.bootEq){ add(k + ' CF boot!=live | CF store before undo ' + col + ' | ' + (r.toRep ? "U_d'" : 'U_d') + ' | slot detail only ' + (r.bootSlotEq ? 'no' : (r.bootDiff && r.bootDiff.where === 'slot' && r.bootDiff.keys === 'detail' ? 'yes' : 'no'))); add(k + ' CF boot!=live by week W' + r.w); add(k + ' CF boot!=live by config ' + r.ck); }
      add(k + ' CF store collapsed (all chains)', col === 'collapsed' ? 1 : 0); if(col === 'collapsed') add(k + ' CF store collapsed and boot!=live', !r.bootEq ? 1 : 0);
      if(v.bootEq && !r.bootEq) created.push({ v, r });
      if(!v.bootEq && r.bootEq) add(k + ' healed by CF'); } } }
Object.keys(T).sort().forEach(k => console.log('  ' + k + '  ' + T[k]));
console.log('CF-created boot!=live rows: ' + created.length);
created.slice(0, 8).forEach(({ v, r }) => console.log('  ' + r.kind + ' ' + r.ck + ' W' + r.w + ' ' + r.d + ' ' + r.shape + ' : ' + r.pre + ' > ' + r.hops.join(' > ')
  + '\n    V227: store ' + JSON.stringify(v.sb) + ' chip ' + v.chip + ' undo ' + v.undo.n + ' ' + JSON.stringify(v.undo.d) + ' ok ' + v.ok + ' boot==live ' + v.bootEq
  + '\n    CF:   store ' + JSON.stringify(r.sb) + ' chip ' + r.chip + ' undo ' + r.undo.n + ' ' + JSON.stringify(r.undo.d) + ' ok ' + r.ok + ' store after ' + JSON.stringify(r.sa) + ' | boot diff ' + JSON.stringify(r.bootDiff)));
console.log('PASS-free post-pass: printed ' + Object.keys(T).length + ' tallies');
