#!/usr/bin/env python3
"""V203 slice I, edits 1 and 2.

EDIT 1  IRON_ASYLUM_HANDOFF_1_1.md line 10 — the D-CODE REGISTRY line. Coach issued
        D120 this session (the g200_core_tier era-row repoint), so highest assigned
        moves D119 -> D120 and next free D120 -> D121. ONLY those two numbers move;
        the collision history and the rest of the sentence stay verbatim.

EDIT 2  tests/measure/v203_core_off_arm.js — coach's clause-off measure script,
        copied verbatim out of the scratchpad so the MANNY_CORE_OFF_DIGEST_BY_VERSION
        rows have a reproducible source. Logic UNCHANGED; a header comment is prepended.

index.html is NOT touched by this script.
Every anchor is asserted count==1 before anything is written; the first miss aborts
the whole script with nothing written.
"""
import hashlib, os, sys

ROOT     = '/Users/CanasBangin/Desktop/TheBig6V2'
HANDOFF  = os.path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md')
SRC_CT   = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad/ct.js'
DST_CT   = os.path.join(ROOT, 'tests/measure/v203_core_off_arm.js')
INDEX    = os.path.join(ROOT, 'index.html')

INDEX_MD5_BEFORE = hashlib.md5(open(INDEX, 'rb').read()).hexdigest()
assert INDEX_MD5_BEFORE == '44237e045f9e40b68f186b34a1a08558', 'index.html is not the slice-H artifact: ' + INDEX_MD5_BEFORE

# ── EDIT 1 ───────────────────────────────────────────────────────────────────────
H_OLD = 'highest assigned = D119. Next free = D120.'
H_NEW = 'highest assigned = D120. Next free = D121.'

hand = open(HANDOFF, encoding='utf-8').read()
n = hand.count(H_OLD)
print('EDIT 1 anchor count =', n)
if n != 1:
    sys.exit('ABORT: EDIT 1 anchor count is %d, expected 1. Nothing written.' % n)

# ── EDIT 2 ───────────────────────────────────────────────────────────────────────
if not os.path.exists(SRC_CT):
    sys.exit('ABORT: coach measure script missing at ' + SRC_CT)
ct = open(SRC_CT, encoding='utf-8').read()

# Guard the copy: the logic must arrive unaltered, so pin the two lines that make it
# the D120 provenance script at all (the 5-version loop and the stripped clause).
for probe in ("for(const v of [199,200,201,202,203]){",
              "const CLAUSE=\"  if(_auxFamily(name)==='core') return 0;\\n\";"):
    c = ct.count(probe)
    print('EDIT 2 probe count =', c, '|', probe.strip()[:60])
    if c != 1:
        sys.exit('ABORT: EDIT 2 probe count is %d, expected 1. Nothing written.' % c)

HEADER = '''// ════════════════════════════════════════════════════════════════════════════════════
// v203_core_off_arm.js — D120 provenance for MANNY_CORE_OFF_DIGEST_BY_VERSION.
//
// D120 repointed g200_core_tier F1a off the literal 6e32421331693437 and onto the
// harness era table, because D117 moved BOTH arms on V203. This is the script that
// printed the numbers those rows carry. It walks the V199 to V203 tag artifacts and
// prints, for each one, the shipped HALF_MANNY digest and the counterfactual digest
// with the core clause stripped, so both arms of every era row are reproducible from
// the artifacts themselves rather than read back off the build that pinned them.
//
// Standing ruling 5: the V203 row was printed by coach from SOURCE SURGERY on a copy,
// BEFORE the pin was written into tests/harness.js. It is not a digest read off the
// built artifact after the fact.
//
// Copied VERBATIM from coach's pass. Logic unaltered; only this header was added.
//
// usage: node tests/measure/v203_core_off_arm.js <dir holding v199.html .. v203.html>
//        (artifacts extracted with `git show V<N>:index.html > <dir>/v<N>.html`)
// ════════════════════════════════════════════════════════════════════════════════════
'''

# ── write ────────────────────────────────────────────────────────────────────────
open(HANDOFF, 'w', encoding='utf-8').write(hand.replace(H_OLD, H_NEW))
print('WROTE', HANDOFF)
open(DST_CT, 'w', encoding='utf-8').write(HEADER + ct)
print('WROTE', DST_CT)

after = hashlib.md5(open(INDEX, 'rb').read()).hexdigest()
assert after == INDEX_MD5_BEFORE, 'index.html changed: ' + after
print('index.html md5 unchanged:', after)
