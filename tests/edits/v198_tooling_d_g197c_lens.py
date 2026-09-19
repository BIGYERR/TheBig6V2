#!/usr/bin/env python3
# V198 tooling slice D — NOT an app change. index.html is NOT touched, ia-version stays 198.
# Defect: g197c_d84_cmp.js defined the posterior-chain set as {hinge, hip_ext, leg_iso},
# which is WIDER than the shipped lens at index.html:9523 (D85, V198) = {hinge, hip_ext}.
# leg_iso is excluded by ruling: EXLIB.leg_accessory holds 'Leg extension' and 'Leg press'
# beside 'Lying leg curl', so leg_iso is a SLOT, not a muscle.
import io, sys

P = 'tests/gates/g197c_d84_cmp.js'
src = io.open(P, encoding='utf-8').read()
orig = src

def rep(old, new):
    global src
    n = src.count(old)
    assert n == 1, 'anchor count %d (expected 1) for: %r' % (n, old[:90])
    src = src.replace(old, new, 1)

# ── 1. the set itself, plus provenance ──────────────────────────────────────────────
rep(
"const E_POSTERIOR = new Set(['hinge','hip_ext','leg_iso']);",
"""// THE SHIPPED LENS, and nothing wider. index.html:9523 (D85, V198) tests
// {hinge, hip_ext} and states the exclusion in terms: leg_iso is DELIBERATELY EXCLUDED
// because EXLIB.leg_accessory holds 'Leg extension' and 'Leg press' alongside
// 'Lying leg curl'. leg_iso is a SLOT, not a muscle — it carries pure quad movements, so
// it is not a posterior signal. This gate read {hinge, hip_ext, leg_iso} until V198
// tooling slice D, which made it count a leg extension as posterior chain and so let a
// card the engine calls posterior-free read as covered. A gate whose lens is wider than
// the guard's cannot see the guard's own boundary.
const E_POSTERIOR = new Set(['hinge','hip_ext']);"""
)

# ── 2. the prose describing that same predicate ─────────────────────────────────────
rep(
"// when no name on the card reads as hinge, hip extension or leg isolation.",
"// when no name on the card reads as hinge or hip extension (the shipped lens; leg\n// isolation is not posterior, see above)."
)

assert src != orig, 'no change written'
io.open(P, 'w', encoding='utf-8').write(src)
print('wrote', P)
