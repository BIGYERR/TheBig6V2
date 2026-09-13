// PROBE, not a gate. Lives in tests/sabotage/ on purpose: tests/gate.sh globs tests/gates/*.js
// and must not run the heavy budget gate twice.
//
// WHY IT EXISTS. tests/sabotage.py invokes `node <gate> <mutant.html>` with no baseline. The B3
// per-tier RATCHET (prehab per tier >= the live previous version) cannot be stated without one,
// so under the sabotage runner it DEFERS and any mutation aimed at it reads SURVIVED. This probe
// supplies the baseline the runner cannot, re-runs g193_budget_floor.js on the mutant, and
// republishes that gate's B3 verdict as its own PASS/FAIL summary in the shape sabotage.py binds.
//
// It makes two claims, and the second is the point:
//   1. the per-tier ratchet did NOT fire (ok) / DID fire (FAIL -> sabotage.py reads TRIPPED)
//   2. the V192 census FLOOR stayed silent, so a trip on claim 1 is the ratchet doing work the
//      floor cannot do. If the floor fired too, the mutation is too big to prove anything about
//      the ratchet and this claim says so by name.
// Crash is not a pass: if the child gate prints no PASS/FAIL summary the probe FAILS.
const fs = require('fs'), path = require('path'), cp = require('child_process');

const CAND = process.argv[2];
if (!CAND || !fs.existsSync(CAND)){
  console.log('  FAIL probe was handed no candidate file');
  console.log('\nPASS 0 FAIL 1'); process.exit(1);
}
const HERE = __dirname;
const GATE = path.join(HERE, '..', 'gates', 'g193_budget_floor.js');
const REPO = path.join(HERE, '..', '..');

// ── resolve a PREVIOUS-VERSION baseline. git tag first: it is the only source that cannot
// have been edited by the thing under test. Env override, then a conventional /tmp copy.
let base = null, src = null;
if (process.env.IA_RATCHET_BASELINE && fs.existsSync(process.env.IA_RATCHET_BASELINE)){
  base = process.env.IA_RATCHET_BASELINE; src = 'IA_RATCHET_BASELINE';
}
if (!base){
  const tmp = path.join(require('os').tmpdir(), 'ia_ratchet_base_V193.html');
  try {
    const out = cp.execFileSync('git', ['-C', REPO, 'show', 'V193:index.html'], { maxBuffer: 1 << 28 });
    if (out && out.length > 100000){ fs.writeFileSync(tmp, out); base = tmp; src = 'git show V193:index.html'; }
  } catch (e) { /* fall through */ }
}
if (!base && fs.existsSync('/tmp/base_V193.html')){ base = '/tmp/base_V193.html'; src = '/tmp/base_V193.html'; }

let PASS = 0, FAIL = 0;
const ok  = m => { PASS++; console.log('  ok   ' + m); };
const bad = m => { FAIL++; console.log('  FAIL ' + m); };

console.log('PROBE g194_b3_ratchet — ' + path.basename(CAND));
if (!base){
  bad('probe could not materialise a V193 baseline (tried IA_RATCHET_BASELINE, git tag V193, /tmp/base_V193.html). The ratchet claim cannot be stated and a probe that cannot state its claim fails closed');
  console.log('\nPASS ' + PASS + ' FAIL ' + FAIL); process.exit(1);
}
console.log('  --   baseline source: ' + src + ' -> ' + base);

const r = cp.spawnSync('node', [GATE, CAND, base], { encoding: 'utf8', maxBuffer: 1 << 28 });
const out = (r.stdout || '') + (r.stderr || '');
const summary = out.match(/^PASS (\d+) FAIL (\d+)\s*$/m);
if (!summary){
  bad('the child gate g193_budget_floor.js printed no PASS/FAIL summary on this file (crash). A dead gate reports nothing, and nothing is not a pass');
  console.log(out.split('\n').slice(-12).map(l => '       ' + l).join('\n'));
  console.log('\nPASS ' + PASS + ' FAIL ' + FAIL); process.exit(1);
}
console.log('  --   child g193_budget_floor.js: PASS ' + summary[1] + ' FAIL ' + summary[2]);

const lines = out.split('\n');
const fired = s => lines.filter(l => /^\s*FAIL /.test(l) && l.indexOf(s) >= 0);
const ratchet = fired('prehab FELL vs the live V');
const floor = fired('BELOW the V192 census');

if (!ratchet.length) ok('B3 per-tier RATCHET is silent on this file: prehab holds at or above the live baseline on every tier, both lattices');
else bad('B3 per-tier RATCHET fired on ' + ratchet.length + ' lattice(s):\n' + ratchet.map(l => '         ' + l.trim()).join('\n'));

if (!floor.length) ok('B3 V192 census FLOOR is silent on this file, so a ratchet trip above is the ratchet doing work the floor cannot do (the regression fits inside the floor headroom)');
else bad('B3 V192 census FLOOR fired too (' + floor.length + ' claim(s)) — this file is not a test of the ratchet in isolation; make the mutation smaller:\n' + floor.map(l => '         ' + l.trim()).join('\n'));

console.log('\nPASS ' + PASS + ' FAIL ' + FAIL);
process.exit(FAIL ? 1 : 0);
