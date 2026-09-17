#!/usr/bin/env python3
# V197 slice 7b — ORACLE CORRECTION to slice 7's E3e. GATE ONLY.
#
# E3e went red on V197. The build is not wrong; the oracle line was. I reused `inFamily`,
# the CAUSED-family predicate (bodyweight + hypertrophy + lowback/protect), for the TOTAL
# population. D86 states the claim as "all 18 caused keys carry lowback/protect, and so do
# all 15 pre-existing ones" — the shared term is the MECHANISM, lowback/protect, not the
# caused family. The 15 pre-existing keys are balanced-focus and include commercial tier,
# and every one of them carries lowback/protect. So E3e asserts the mechanism.
import hashlib, io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GATE = os.path.join(ROOT, 'tests', 'gates', 'g197_leg_accessory.js')
HTML = os.path.join(ROOT, 'index.html')
HTML_MD5_EXPECTED = '6e9f47e36abe00d3484953c5a3ee2d76'
assert hashlib.md5(open(HTML, 'rb').read()).hexdigest() == HTML_MD5_EXPECTED

src = io.open(GATE, encoding='utf-8').read()
edits = [
    ('7b-mechanism-predicate',
     "  const allKeys = Object.keys(eZeroAll).sort();\n"
     "  const outAll  = allKeys.filter(k => !inFamily(k));\n"
     "  console.log('   posterior-free leg cells TOTAL in the artifact (caused + pre-existing): '\n"
     "    + eZeroAllCells + ' cells over ' + allKeys.length + ' config keys; '\n"
     "    + (allKeys.length - found.length) + ' of those keys pre-date the reorder');\n"
     "  ok('E3e every posterior-free leg cell in the artifact, caused or pre-existing, carries lowback/protect',\n"
     "     ranE && outAll.length === 0, JSON.stringify(outAll));\n",

     "  // The CAUSED set is the narrow family (bodyweight + hypertrophy + lowback/protect).\n"
     "  // The PRE-EXISTING set is wider in focus and tier, but shares the one MECHANISM that\n"
     "  // makes any of it possible: lowback/protect strips the hinge rail before the budget\n"
     "  // runs, so a leg day reaches capSessionBudget with one posterior piece instead of\n"
     "  // three and any eviction lands on zero. Healthy, knee/protect and shoulder/protect\n"
     "  // always keep a hinge to spare. So the TOTAL population is asserted against the\n"
     "  // mechanism, not against the caused family.\n"
     "  const carriesLowback = k => k.split('|')[4] === 'lowback/protect';\n"
     "  const allKeys = Object.keys(eZeroAll).sort();\n"
     "  const preKeys = allKeys.filter(k => found.indexOf(k) < 0);\n"
     "  const outAll  = allKeys.filter(k => !carriesLowback(k));\n"
     "  console.log('   posterior-free leg cells TOTAL in the artifact (caused + pre-existing): '\n"
     "    + eZeroAllCells + ' cells over ' + allKeys.length + ' config keys; '\n"
     "    + preKeys.length + ' of those keys pre-date the reorder:');\n"
     "  preKeys.forEach(k => console.log('      ' + eZeroAll[k] + ' cells  ' + k + '   <- pre-existing'));\n"
     "  ok('E3e every posterior-free leg cell in the artifact, caused or pre-existing, carries lowback/protect (the mechanism)',\n"
     "     ranE && outAll.length === 0, JSON.stringify(outAll));\n"),
]

for tag, old, new in edits:
    n = src.count(old)
    print('anchor %-24s count=%d' % (tag, n))
    if n != 1:
        sys.exit('ABORT: anchor %s matched %d times, expected 1' % (tag, n))
for tag, old, new in edits:
    src = src.replace(old, new, 1)
io.open(GATE, 'w', encoding='utf-8').write(src)
print('WROTE ' + GATE)
assert hashlib.md5(open(HTML, 'rb').read()).hexdigest() == HTML_MD5_EXPECTED
print('index.html md5 unchanged: ' + HTML_MD5_EXPECTED)
