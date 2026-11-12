// Measure for the engine check: does buildProgram read or write stored state, and can a phone's stored keys change a
// lattice digest? Counts every storage call during the 864 builds on an empty store, then loads the newest backup in
// the corpus into the store and builds the lattice again. Run: node tests/measure/engine-check_storage.js
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const H = require('../harness.js');
const L = require('../lattice193.js');
const golden = require('../snapshots/program-output-lattice.json');

const IA = H.load(path.join(__dirname, '..', '..', 'index.html'));
const ls = IA.localStorage;
const calls = { getItem: 0, setItem: 0, removeItem: 0, key: 0, clear: 0 };
for (const k of Object.keys(calls)) {
  const real = ls[k];
  ls[k] = function (...a) { calls[k]++; return real.apply(this, a); };
}
function sweep(label) {
  for (const k of Object.keys(calls)) calls[k] = 0;
  const before = JSON.stringify(Array.from(ls._map.entries()));
  let match = 0;
  for (const c of L.FULL) if (H.progDigest(IA.buildProgram({ ...H.fixtures.HALF_MANNY, ...c.over })) === golden[c.tag]) match++;
  const after = JSON.stringify(Array.from(ls._map.entries()));
  console.log(`${label}: lattice ${match}/${L.FULL.length}; storage calls ${JSON.stringify(calls)}; store ${before === after ? 'unchanged' : 'CHANGED'} (${ls._map.size} keys)`);
}
sweep('empty store');
const dir = path.join(__dirname, '..', 'snapshots', 'backups');
const newest = fs.readdirSync(dir).filter(f => f.endsWith('.gz')).sort().pop();
const backup = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir, newest))).toString('utf8'));
const data = backup.data || backup.keys || backup;
let n = 0;
for (const [k, v] of Object.entries(data)) if (k.startsWith('ia_')) { ls._map.set(k, typeof v === 'string' ? v : JSON.stringify(v)); n++; }
console.log('loaded', n, 'ia_ keys from', newest, '(top-level fields:', Object.keys(backup).join(','), ')');
sweep('store holding that backup');
