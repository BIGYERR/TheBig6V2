#!/usr/bin/env python3
# V205 slice 9 — three record/gate-licence edits. index.html is NOT touched.
#   E1  g205_d130_typed.js  : era predicate re-keyed 204 -> 205 (predicate + message)
#   E2  g205_d129_tiebreak.js: add the era licence it never had, keyed on 205
#   E3  IRON_ASYLUM_HANDOFF_1_1.md line 10: D-code registry advanced to D130/D131
# Every anchor is asserted count==1 before anything is written; first miss aborts all.
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D130 = os.path.join(ROOT, 'tests', 'gates', 'g205_d130_typed.js')
D129 = os.path.join(ROOT, 'tests', 'gates', 'g205_d129_tiebreak.js')
REG  = os.path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md')

def read(p):
    with io.open(p, encoding='utf-8') as f:
        return f.read()

def sub1(src, old, new, label):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT %s: anchor count==%d, expected 1' % (label, n))
    print('anchor %-22s count=1 OK' % label)
    return src.replace(old, new)

# ── E1 ──────────────────────────────────────────────────────────────────────
s130 = read(D130)
OLD130 = "if(!(VER>=204)){ console.log('SKIP g205_d130_typed: ia-version '+VER+' predates D130 (needs >= 204)'); console.log('PASS 0 FAIL 0'); process.exit(0); }"
NEW130 = "if(!(VER>=205)){ console.log('SKIP g205_d130_typed: ia-version '+VER+' predates D130 (needs >= 205)'); console.log('PASS 0 FAIL 0'); process.exit(0); }"
s130 = sub1(s130, OLD130, NEW130, 'd130.predicate')

# ── E2 ──────────────────────────────────────────────────────────────────────
s129 = read(D129)
OLD129 = "const src = fs.readFileSync(FILE, 'utf8');\n"
NEW129 = "const src = fs.readFileSync(FILE, 'utf8');\n" + """
// ── ERA PREDICATE (standing ruling 2: a licence is a predicate, never prose) ──
// D129 ships at ia-version 205. AT 205 AND ABOVE the tiebreak surface must be present,
// and its absence is a NAMED FAIL, never a skip: an old artifact stamped 205 still fails
// loudly here. Below 205 with the surface absent the gate is NOT APPLICABLE and skips
// clean. Below 205 WITH the surface present is the pre-bump working artifact and every
// row RUNS. The probe reads code with comments stripped, so the V205 comment blocks that
// name D129 cannot stand in for the terms themselves: _evenKey is rank 6's key and
// qualRest/qualFirst are ranks 8 and 9 in the candidate record.
const VER = parseInt((src.match(/name="ia-version" content="(\\d+)"/) || [])[1], 10);
const _codeOnly = src.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '').replace(/^[ \\t]*\\/\\/.*$/gm, '');
const HAS_D129 = /_evenKey/.test(_codeOnly) && /qualRest\\s*,\\s*qualFirst/.test(_codeOnly);
if(VER >= 205){
  if(!HAS_D129){
    console.log('FAIL P0 licence: ia-version ' + VER + ' is D129 era but the tiebreak surface (_evenKey, qualRest, qualFirst) is absent');
    console.log('PASS 0 FAIL 1');
    process.exit(1);
  }
  console.log('P0 licence: ia-version ' + VER + ' carries the D129 tiebreak surface');
} else if(!HAS_D129){
  console.log('SKIP g205_d129_tiebreak: ia-version ' + VER + ' predates D129 (NOT APPLICABLE)');
  console.log('PASS 0 FAIL 0');
  process.exit(0);
} else {
  console.log('NOTE ia-version ' + VER + ' with the D129 surface present: pre-bump working artifact, rows RUN');
}
"""
s129 = sub1(s129, OLD129, NEW129, 'd129.srcread')

# ── E3 ──────────────────────────────────────────────────────────────────────
sreg = read(REG)
sreg = sub1(sreg, 'highest assigned = D129. Next free = D130.',
                  'highest assigned = D130. Next free = D131.', 'registry')

for p, s in ((D130, s130), (D129, s129), (REG, sreg)):
    with io.open(p, 'w', encoding='utf-8') as f:
        f.write(s)
    print('wrote ' + p)
