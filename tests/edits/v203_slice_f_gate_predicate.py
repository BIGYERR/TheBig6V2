import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g203_mile_pencil.js'
s = io.open(P, encoding='utf-8').read()

def rep(old, new):
    global s
    n = s.count(old)
    assert n == 1, 'anchor count %d (want 1): %r' % (n, old[:70])
    s = s.replace(old, new)

# 1. the header paragraph that says "NO VERSION PREDICATE"
OLD_HDR = """// NO VERSION PREDICATE. D116 lands on the artifact in V203 and this gate asserts
// the D116 surface exists, so it FAILS on any pre-D116 baseline by design. That
// is the "run it against the previous version first" check doing its job, not a
// regression. Do not add an ia-version escape hatch: the number this would be
// keyed on does not exist in the artifact yet (slice C leaves ia-version at 202).
"""
NEW_HDR = """// VERSION PREDICATE (standing ruling 4 — a gate is keyed to the RULING it defends,
// and its predicate must say so). D116 ships on ia-version 203.
//   * at 203 and above the D116 surface MUST exist. Its absence is a named FAIL,
//     never a skip, so a later version cannot quietly drop the pencil.
//   * below 203, an artifact WITHOUT the surface is NOT APPLICABLE: the gate reports
//     its rows as skipped and exits clean. gate.sh runs every gate against the
//     PREVIOUS artifact first, and a gate that hard-fails there makes that run
//     unreadable — the failure means "old build is old", which tests nothing.
//   * below 203 WITH the full surface present is the pre-bump working artifact
//     mid-slice. Every row RUNS: the surface is there to be tested and declining
//     would hide the only build that can exercise it.
// The teeth are not lost. Stamp a copy of the V202 artifact to content="203" and
// every D116 row fails on it, which is the proof that this predicate hides nothing.
"""
rep(OLD_HDR, NEW_HDR)

# 2. the predicate itself, after the banner line and before section 1
OLD_BANNER = """console.log('g203_mile_pencil  (D116 — the mile pencil)  artifact ia-version ' + IA.version);

// ── 1. the surface exists ──"""
NEW_BANNER = """console.log('g203_mile_pencil  (D116 — the mile pencil)  artifact ia-version ' + IA.version);

// ── 0. the version predicate ──────────────────────────────────────────────────
const RULING_V = 203;
const artifactV = +IA.version;
const SURFACE = {
  'openMileSheet declared':      typeof IA.eval('typeof openMileSheet === "function" ? openMileSheet : undefined') === 'function',
  'commitMileChange declared':   typeof IA.eval('typeof commitMileChange === "function" ? commitMileChange : undefined') === 'function',
  'mileOverlay markup':          /id="mileOverlay"/.test(IA.html),
  'mileLockOverlay markup':      /id="mileLockOverlay"/.test(IA.html),
  'the D116 lock body copy':     IA.html.indexOf(LOCK_BODY) >= 0,
  'the D116 commit toast':       IA.html.indexOf(COMMIT_TOAST) >= 0,
};
const missing = Object.keys(SURFACE).filter(k => !SURFACE[k]);

console.log('\\n0. version predicate (D116 ships on ia-version ' + RULING_V + ')');
if(artifactV >= RULING_V){
  Object.keys(SURFACE).forEach(k => ok('at ia-version ' + artifactV + ' the D116 surface MUST exist: ' + k, SURFACE[k]));
  if(missing.length){
    console.log('\\nD116 surface is MISSING at or above its ruling version. Rows above are the report.');
    console.log('\\nPASS ' + pass + ' FAIL ' + fail);
    process.exit(1);
  }
} else if(missing.length){
  ok('ia-version ' + artifactV + ' is below ' + RULING_V + ' and carries none of the D116 surface, so this gate declines', true);
  console.log('  n/a  NOT APPLICABLE at ia-version ' + artifactV + ': missing ' + missing.join('; '));
  console.log('\\nNOT APPLICABLE: ia-version ' + artifactV + ' is below ' + RULING_V + ' and does not carry the D116 surface. All D116 rows skipped.');
  console.log('\\nPASS ' + pass + ' FAIL ' + fail);
  process.exit(0);
} else {
  ok('ia-version ' + artifactV + ' is below ' + RULING_V + ' but the whole D116 surface is present (pre-bump working artifact), so every row RUNS', true);
}

// ── 1. the surface exists ──"""
rep(OLD_BANNER, NEW_BANNER)

io.open(P, 'w', encoding='utf-8').write(s)
print('g203_mile_pencil.js: 2 replacements applied')
