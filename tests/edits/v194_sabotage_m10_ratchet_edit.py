#!/usr/bin/env python3
# V194 sabotage, EDIT 3: prove the restored per-tier ratchet does INDEPENDENT work.
#
# THE PROBLEM THIS SOLVES. tests/sabotage.py runs `node <gate> <mutant.html>` and nothing
# else — no baseline, by design (V194's REQUIRES_BASELINE = [] exists for that reason). The
# per-tier ratchet is a claim against the LIVE PREVIOUS VERSION, so under that invocation it
# DEFERS, and a mutation aimed at it would be reported SURVIVED. Measured, not assumed:
#   mutant, no baseline   -> g193_budget_floor PASS 22 FAIL 0   (invisible)
#   mutant, V193 baseline -> g193_budget_floor PASS 29 FAIL 2   (both lattices fire)
# So the mutation names a PROBE as its gate. The probe re-invokes g193_budget_floor.js with a
# V193 baseline it materialises itself (git tag V193), republishes B3's verdict in its own
# PASS/FAIL summary, and additionally machine-checks the DISCRIMINATION the ruling asks for:
# the ratchet fired AND the V192 census floor stayed silent. The probe lives in tests/sabotage/,
# NOT in tests/gates/, so tests/gate.sh does not pick it up and the heavy gate is not run twice
# in the suite. The ratchet itself is covered in the suite the normal way, because gate.sh does
# hand the baseline through as argv[3].
import json, os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
PROBE = os.path.join(ROOT, 'tests/sabotage/g194_b3_ratchet_probe.js')
SPEC = os.path.join(ROOT, 'tests/sabotage/v194.json')

PROBE_SRC = r'''// PROBE, not a gate. Lives in tests/sabotage/ on purpose: tests/gate.sh globs tests/gates/*.js
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
'''

if os.path.exists(PROBE):
    cur = open(PROBE, encoding='utf-8').read()
    if cur == PROBE_SRC:
        print('probe already present and identical: ' + PROBE)
    else:
        sys.exit('ABORT: %s exists with different content. Refusing to clobber.' % PROBE)
else:
    open(PROBE, 'w', encoding='utf-8').write(PROBE_SRC)
    print('wrote probe %s (%d bytes)' % (PROBE, len(PROBE_SRC)))

# ── the mutation. Anchor-asserted against the spec file, and the mutation's own anchor is
# asserted against index.html here too, so a NOT-APPLIED is caught at edit time, not at run time.
spec = open(SPEC, encoding='utf-8').read()
MUT_ANCHOR = 'const mob=pick(EXLIB.hip_mobility,1,seed+7);'
MUT_REPL = 'const mob=(!bodyweight&&seed%29===0)?[]:pick(EXLIB.hip_mobility,1,seed+7);'
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
n = html.count(MUT_ANCHOR)
print('mutation anchor in index.html count=%d' % n)
if n != 1:
    sys.exit('ABORT: mutation anchor matched %d times in index.html, expected 1' % n)

NEW = {
  "name": "M10 -> g193_budget_floor B3 per-tier RATCHET (via the sabotage probe, which hands the gate the V193 baseline the runner cannot): the hip mobility draw is dropped on 1-in-29 day seeds and only off the bodyweight tier, so prehab loses 32 items per wide tier on 5 of 6 tiers and 3 per narrow tier. That is a real regression that fits INSIDE the V192 census floor headroom (168 to 241 wide, 0 to 16 narrow), so the floor claims all stay green and only the live-baseline ratchet catches it",
  "anchor": MUT_ANCHOR,
  "replacement": MUT_REPL,
  "gate": "sabotage/g194_b3_ratchet_probe.js"
}

TAIL_ANCHOR = '''  "gate": "gates/g193_budget_floor.js"
 }
]'''
c = spec.count(TAIL_ANCHOR)
print('spec tail anchor count=%d' % c)
if c != 1:
    sys.exit('ABORT: spec tail anchor matched %d times, expected 1. No bytes written.' % c)

block = json.dumps(NEW, ensure_ascii=False, indent=1)
block = '\n'.join((' ' + l) if i else l for i, l in enumerate(block.split('\n')))
spec_new = spec.replace(TAIL_ANCHOR, '''  "gate": "gates/g193_budget_floor.js"
 },
 ''' + block + '''
]''', 1)
if spec_new == spec:
    sys.exit('ABORT: no change to the spec')
json.loads(spec_new)  # must still be valid JSON before a byte lands
open(SPEC, 'w', encoding='utf-8').write(spec_new)
print('wrote %s (%d -> %d chars, %d mutations)' % (SPEC, len(spec), len(spec_new), len(json.loads(spec_new))))
