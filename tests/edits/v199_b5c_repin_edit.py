#!/usr/bin/env python3
# V199 (D91) amendment - re-pin B5c in tests/gates/g197b_sweep.js from 235 to 187.
# No app change. index.html is NOT touched by this script.
# Anchors are asserted count==1 before anything is written; the first miss aborts everything.
import io, sys

GATE = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g197b_sweep.js'

with io.open(GATE, encoding='utf-8') as f:
    src = f.read()
orig = src

reps = []

# ── 1. section header comment: name D91/V199 alongside D85/V198 ──────────────────
OLD_HDR_PREFIX = '// ── D76: same-card duplicates (count re-pinned by D85, V198) '
NEW_HDR_PREFIX = '// ── D76: same-card duplicates (count re-pinned by D85, V198; again by D91, V199) '
assert src.count(OLD_HDR_PREFIX) == 1, 'anchor 1 (header prefix) count=%d' % src.count(OLD_HDR_PREFIX)
i = src.index(OLD_HDR_PREFIX)
j = i + len(OLD_HDR_PREFIX)
while j < len(src) and src[j] == '─':
    j += 1
old_hdr = src[i:j]
# keep the rule line the same character width as before
pad = len(old_hdr) - len(NEW_HDR_PREFIX)
assert pad > 0, 'header rule would have no trailing rule left'
new_hdr = NEW_HDR_PREFIX + ('─' * pad)
assert len(new_hdr) == len(old_hdr)
reps.append(('header comment', old_hdr, new_hdr))

# ── 2. the B5c assertion itself: coach's verbatim wording, still an EQUALITY ─────
OLD_B5C = "ok('B5c same-card duplicates == 235 (240 at V196/V197; D76 absorbs the whole +175 harvest cost, then D85 licenses the 5 that left: on 5 home_basic/advanced/run_half seed-11 Tuesday legs cards the posterior floor refuses the last hinge, so the trim takes the duplicate Step-ups (KB) instead, 7 items in and 7 items out)', dup === 235, dup);"
NEW_B5C = "ok('B5c same-card duplicates == 187 (240 at V196/V197; D76 absorbs the whole +175 harvest cost, then D85 licenses 5 and D91 licenses 48 more: on 48 deload leg cards — W12 TUE, run_half, seed 11, home_basic 24 + minimal 24 — recoveryDeload now keeps its surviving accessory block by PATTERN, so Leg superset B (hinge) survives where Leg superset A did, and the Step-ups (KB) that Leg superset A repeated from the Main slot leaves the card. Item count per card is unchanged on all 48 (46 at 8 items, 2 at 7): the repeat was replaced, not dropped. Every duplicate this assertion has ever counted is Step-ups (KB))', dup === 187, dup);"
reps.append(('B5c assertion', OLD_B5C, NEW_B5C))

# assert every anchor exactly once BEFORE writing anything
for label, old, new in reps:
    n = src.count(old)
    assert n == 1, 'anchor MISS: %s count=%d' % (label, n)
    assert new not in src, 'anchor already applied: %s' % label

for label, old, new in reps:
    src = src.replace(old, new, 1)
    print('applied: ' + label)

assert src != orig
# B5a / B5b / B5d keep their bytes
for keep in ["ok('B5a a harvested name NEVER prints twice on one card (D76 subtraction)', harvestedDup === 0, harvestedDup);",
             "ok('B5b total same-card duplicates did not grow past the ruling ceiling of 415', dup <= 415, dup);",
             "ok('B5d nowhere near 955 (that number means the three exclusions did not land)', dup < 955, dup);"]:
    assert src.count(keep) == 1, 'B5 sibling changed or missing: ' + keep[:24]

with io.open(GATE, 'w', encoding='utf-8') as f:
    f.write(src)
print('wrote ' + GATE)
