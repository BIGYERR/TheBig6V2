#!/usr/bin/env python3
# V193 comment correction — TWO COMMENT LINES, ZERO BEHAVIOURAL SURFACE.
#
# Both comments state a per-tier legal-member count for CORE_PILLARS.anti_rotation and both
# are stale in the direction that UNDERSTATES the floor. That is the dangerous direction: a
# future reader deciding whether a pillar can afford to lose a member reads a number smaller
# than the truth and concludes the pillar is nearer the floor of two than it is.
#
#   index.html:6078 said  anti_rotation 3/4/6/6/7/6 after D49    actual 3/6/7/7/7/7
#   index.html:7935 said  2 bodyweight, 3 minimal, 4 gear tiers  actual 3/4/5/5/5/5
#
# Re-derived from the LIVE artifact, two independent ways, before writing:
#   (a) by hand off _AUX_GEAR (index.html:8705) and the regex clauses of _auxGearOK:
#       anti_rotation members are Bird dogs / Side plank / Plank shoulder taps (untagged,
#       no regex hit, legal on all six tiers), Pallof press (tagged 'band' by D49 -> not
#       bodyweight, not minimal), Dumbbell renegade rows (/dumbbell/ -> not bodyweight),
#       Farmer carry and Suitcase carry (tagged 'loaded' -> not bodyweight).
#         all seven members  -> 3 / 6 / 7 / 7 / 7 / 7
#         carries stripped   -> 3 / 4 / 5 / 5 / 5 / 5   (the protect-tier branch's own draw)
#   (b) by evaluating _auxGearOK against CORE_PILLARS inside the harness VM; identical.
#   AR_LEGAL in tests/gates/g193_gear_gates.js also carries 3/6/7/7/7/7, so the 6078 comment
#   was contradicting a live gate.
#
# Both replacements are comment text inside a function body. No token outside a // comment
# is touched, so the harness digest must be byte-identical either side. ia-version stays 193.

import io, sys, os

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html')
PATH = os.path.normpath(PATH)

with io.open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

REPLACEMENTS = []

# ── 1. getDynamicCoreBlock, the _pi lens comment (all seven members) ─────────────────
OLD1 = """  // (measured, all six tiers — rotational_power 3/3/4/5/7/6 for bodyweight / minimal /
  // home_basic / home_full / commercial / crossfit; anti_rotation 3/4/6/6/7/6 after D49
  // added two gear-free members and tagged the Pallof press as band gear; dynamic_bracing 4
  // everywhere), so the filter cannot empty a pillar. If a"""
NEW1 = """  // (measured, all six tiers — rotational_power 3/3/4/5/7/6 for bodyweight / minimal /
  // home_basic / home_full / commercial / crossfit; anti_rotation 3/6/7/7/7/7 after D49
  // added two gear-free members and tagged the Pallof press as band gear; dynamic_bracing 4
  // everywhere), so the filter cannot empty a pillar. These are MEASURED, not assumed: run
  // _auxGearOK over CORE_PILLARS[key].items for each tier and count, which is what the draw
  // on the line below does. The anti_rotation row is also the AR_LEGAL hand table in
  // tests/gates/g193_gear_gates.js, derived there from _AUX_GEAR (search '_AUX_GEAR=') and
  // the tier columns, so the two agree by two independent routes. Re-derive, do not trust
  // this line. If a"""
REPLACEMENTS.append(('6078 _pi lens legality row', OLD1, NEW1))

# ── 2. buildSections protect-tier upper-limb branch (carries stripped) ───────────────
OLD2 = """        // strip stays: it is this day's own rule, not a gear rule. Measured legal members
        // after both filters: 2 on bodyweight, 3 on minimal, 4 on the four gear tiers, so the
        // pair below always has two distinct names to draw and no fallback is needed."""
NEW2 = """        // strip stays: it is this day's own rule, not a gear rule. Legal members after BOTH
        // filters, measured over the five non-carry members of the pillar against the tier
        // table: 3 / 4 / 5 / 5 / 5 / 5 for bodyweight / minimal / home_basic / home_full /
        // commercial / crossfit. So the pair below always has two distinct names to draw and
        // no fallback is needed. Measured, not assumed: apply the same two predicates on the
        // line below to CORE_PILLARS.anti_rotation.items and count per tier. Bodyweight is
        // the floor case at 3 — Bird dogs, Side plank, Plank shoulder taps, the three members
        // _AUX_GEAR (search '_AUX_GEAR=') leaves untagged. Re-derive, do not trust this line."""
REPLACEMENTS.append(('7935 protect-tier branch legality row', OLD2, NEW2))

# Anchor-assert every replacement BEFORE writing anything; abort the whole script on the
# first miss so a partial edit can never land.
for label, old, new in REPLACEMENTS:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times, expected 1\n' % (label, n))
        sys.exit(1)
    print('anchor OK  count==1  %s' % label)

for label, old, new in REPLACEMENTS:
    src = src.replace(old, new, 1)

# No ia-version bump: this release is 193 and stays 193.
assert src.count('<meta name="ia-version" content="193">') == 1, 'ia-version must stay 193'

with io.open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)

print('wrote %s  (%d replacements, comment lines only)' % (PATH, len(REPLACEMENTS)))
