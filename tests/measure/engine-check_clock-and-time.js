// Measure for the engine check (MIGRATION.md phase 1 step 2): does a lattice digest depend on the clock or the time
// zone, and how long do the 864 builds take? Run: node tests/measure/engine-check_clock-and-time.js [index.html]
// (TZ=<zone> in front to change the zone). Prints matches against the golden files at several clocks, and timings.
'use strict';
const path = require('path');
const H = require('../harness.js');
const L = require('../lattice193.js');
const golden = require('../snapshots/program-output-lattice.json');
const manny = require('../snapshots/program-output.json').programs['half-manny (Mario, NRC half, crossfit)'].digest;

const file = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = H.load(file);
function pin(at) {
  const Real = Date; const t = at.getTime();
  class P extends Real { constructor(...a) { if (a.length === 0) super(t); else super(...a); } static now() { return t; } }
  IA.window.Date = P;
}
const clocks = [
  ['2026-10-11 12:00 (CI pin)', new Date(2026, 9, 11, 12)],
  ['2026-11-12 08:00', new Date(2026, 10, 12, 8)],
  ['2026-11-12 23:59', new Date(2026, 10, 12, 23, 59)],
  ['2026-12-06 06:00 (race day)', new Date(2026, 11, 6, 6)],
  ['2026-12-20 12:00 (after race)', new Date(2026, 11, 20, 12)],
  ['2027-04-01 12:00', new Date(2027, 3, 1, 12)],
];
console.log('TZ', process.env.TZ || '(system)', Intl.DateTimeFormat().resolvedOptions().timeZone, 'cells', L.FULL.length);
for (const [label, at] of clocks) {
  pin(at);
  const t0 = process.hrtime.bigint();
  let match = 0; let first = null;
  for (const c of L.FULL) {
    const d = H.progDigest(IA.buildProgram({ ...H.fixtures.HALF_MANNY, ...c.over }));
    if (d === golden[c.tag]) match++; else if (!first) first = c.tag;
  }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const m = H.progDigest(IA.buildProgram(H.fixtures.HALF_MANNY));
  console.log(`${label.padEnd(30)} lattice ${match}/${L.FULL.length} first-miss ${first || '-'} | HALF_MANNY ${m === manny ? 'match' : 'MISS ' + m} | ${ms.toFixed(0)} ms (${(ms / L.FULL.length).toFixed(2)} ms/build)`);
}
// Digest cost alone: JSON round trip + sha256 of one program, and the size hashed.
pin(clocks[0][1]);
const p = IA.buildProgram(H.fixtures.HALF_MANNY);
const s = JSON.stringify(p);
let t0 = process.hrtime.bigint();
for (let i = 0; i < 100; i++) H.progDigest(p);
console.log('progDigest of HALF_MANNY x100:', (Number(process.hrtime.bigint() - t0) / 1e8).toFixed(2), 'ms each; program JSON', s.length, 'chars');
// Largest single build, so a chunk size can be picked.
let worst = 0; let worstTag = '';
for (const c of L.FULL) {
  const a = process.hrtime.bigint();
  IA.buildProgram({ ...H.fixtures.HALF_MANNY, ...c.over });
  const ms = Number(process.hrtime.bigint() - a) / 1e6;
  if (ms > worst) { worst = ms; worstTag = c.tag; }
}
console.log('slowest single build', worst.toFixed(1), 'ms', worstTag);
