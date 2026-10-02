// v227_d190_undo_post.js — MEASURE (read-only). Splits v227_d190_undo.js's "A>B>C>B" family (last target == first target)
// into strict A>B>C>B and A>B>A>B, on V227, from ur_V227_*_h3.json in SCR.
'use strict'; const fs = require('fs'), path = require('path'); const SCR = process.env.SCR;
const t = {}; fs.readdirSync(SCR).filter(f => /^ur_V227_.*_h3\.json$/.test(f)).forEach(f => JSON.parse(fs.readFileSync(path.join(SCR, f), 'utf8')).forEach(r => {
  if(r.unreach || r.hops[2] !== r.hops[0]) return; const k = r.ck + '|' + (r.hops[1] === r.pre ? 'A>B>A>B' : 'A>B>C>B'); const o = t[k] = t[k] || [0, 0, 0]; o[2]++;
  if(!r.chip || r.undo.n !== r.prevSlot.n || r.undo.d !== r.prevSlot.d) o[0]++; if(r.storeBefore.length < 3) o[1]++; }));
let W = 0, N = 0; Object.keys(t).sort().forEach(k => { console.log('  ' + k.padEnd(24) + ' undo wrong ' + t[k][0] + '/' + t[k][2] + ' | store collapsed ' + t[k][1]); W += t[k][0]; N += t[k][2]; }); console.log('  total ' + W + '/' + N);
