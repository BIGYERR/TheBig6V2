#!/usr/bin/env python3
# Post-V235 tooling slice (tests only, no build; index.html untouched, ia-version stays 235).
# Ruling (Mario, Post-V235, 2026-10-07, verbatim): "era rows written by tests/era_bump.py do not make
# tests/harness.js cross-cutting."
# tests/chain.js: record whether era_bump.py --era-only-diff <ref> lists tests/harness.js as era-only;
# when it does, drop tests/harness.js from the CROSS-CUTTING reasons and print one line saying so.
# harness.js listed `edited`, or absent from the era-only output while git shows it differing: unchanged
# (cross-cutting). tests/gate.sh: unchanged (any diff stays cross-cutting).
# All anchors asserted count == 1 before any write; all-or-nothing.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = os.path.join(ROOT, 'tests', 'chain.js')
src = open(P, encoding='utf-8').read()

EDITS = [
    # 1. header comment: one line
    (
        "// line with its reasons; and the mechanical verdict. Exit 0 on a printed list, 2 on bad input.\n",
        "// line with its reasons; and the mechanical verdict. Exit 0 on a printed list, 2 on bad input.\n"
        "// Verdict: tests/harness.js differing from --ref by era rows only (era_bump.py --era-only-diff lists it era-only) is not cross-cutting (Mario, Post-V235); edited, or any tests/gate.sh diff, still is.\n",
    ),
    # 2. era-only parse: record harness.js era-only before the tests/gates filter
    (
        "const eraOnly = [], otherEdits = [];\n"
        "for (const ln of eb.stdout.split('\\n')) {\n"
        "  const x = /^(edited|era-only)\\s+(\\S+)\\s+\\((.*)\\)\\s*$/.exec(ln); if (!x) continue;\n",
        "const eraOnly = [], otherEdits = [];\n"
        "let harnessEraOnly = false;   // Mario, Post-V235: era rows era_bump.py wrote do not make tests/harness.js cross-cutting\n"
        "for (const ln of eb.stdout.split('\\n')) {\n"
        "  const x = /^(edited|era-only)\\s+(\\S+)\\s+\\((.*)\\)\\s*$/.exec(ln); if (!x) continue;\n"
        "  if (x[2] === 'tests/harness.js') { harnessEraOnly = x[1] === 'era-only'; continue; }\n",
    ),
    # 3. verdict: skip tests/harness.js when era-only, and say so
    (
        "for (const f of infra) cross.push(f + ' differs from ' + ref);\n",
        "for (const f of infra) {\n"
        "  if (f === 'tests/harness.js' && harnessEraOnly) { console.log('tests/harness.js differs from ' + ref + ' by era rows only (era_bump.py --era-only-diff): not cross-cutting'); continue; }\n"
        "  cross.push(f + ' differs from ' + ref);\n"
        "}\n",
    ),
]

for i, (old, new) in enumerate(EDITS, 1):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %d count %d (want 1); nothing written' % (i, n))

out = src
for old, new in EDITS:
    out = out.replace(old, new, 1)
if out == src:
    sys.exit('ABORT: no change; nothing written')
open(P, 'w', encoding='utf-8').write(out)
print('post_v235_chain_era_harness: %d edits written to %s' % (len(EDITS), P))
