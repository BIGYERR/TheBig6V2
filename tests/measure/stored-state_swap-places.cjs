// How often does a built day carry one lift twice? A swap records every place its lift stands (V221 D177 R4), and when
// the same pair is recorded again while its record stands, the record keeps the earlier places the new tap did not see.
// A day holding one lift twice is one way to get there. HALF_MANNY and the 864-config lattice, every day of every week.
// The answer is none, and the merge is reached another way (swap A for B, B for C, add A back, swap it for B again):
// docs/decisions/stored-state.md, v0.261.6.
// Run from the repo root: node tests/measure/stored-state_swap-places.cjs   (its report is the .md beside it)
const path = require('node:path');
const root = process.argv[2] || process.cwd();
const { load, fixtures } = require(path.join(root, 'tests', 'harness.js'));
const lattice = require(path.join(root, 'tests', 'lattice193.js'));
const IA = load(path.join(root, 'index.html'));
const cfgs = [['HALF_MANNY', fixtures.HALF_MANNY]];
lattice.FULL.forEach((c) => cfgs.push([c.tag, Object.assign({}, fixtures.HALF_MANNY, c.over)]));
let days = 0, dupDays = 0; const examples = [];
for (const [name, cfg] of cfgs) {
  let prog;
  try { prog = IA.buildProgram(JSON.parse(JSON.stringify(cfg))); } catch (e) { continue; }
  for (const w of Object.keys(prog.weeks || {})) for (const d of Object.keys(prog.weeks[w])) {
    const day = prog.weeks[w][d]; if (!day || !Array.isArray(day.sections)) continue;
    days++;
    const seen = {}; let dup = null;
    day.sections.forEach((s) => (s.items || []).forEach((it) => { if (!it || !it.name) return; if (seen[it.name]) dup = it.name; seen[it.name] = 1; }));
    if (dup) { dupDays++; if (examples.length < 5) examples.push(name + ' w' + w + ' ' + d + ': ' + dup); }
  }
}
console.log('configs ' + cfgs.length + ', days ' + days + ', days with one lift twice ' + dupDays);
examples.forEach((e) => console.log('  ' + e));
