#!/usr/bin/env python3
# V193 — D52 comment block, two false claims corrected. COMMENT LINES ONLY.
# No behavioural surface: every replaced and inserted line begins with //.
# ia-version stays 193 (comment-only correction to a build gatekeeper already
# returned GREEN on), so there is NO version bump replacement in this script.
import io, sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(PATH, encoding='utf-8').read()

REPS = []

# ── Correction 1 ────────────────────────────────────────────────────────────
# The "108 Full Body day-builds" figure was never true at any definition. It is
# replaced with the figures gatekeeper measured by reverse-applying
# tests/edits/v193_d52_edit.py and swapping the SPINE_SWAP null for a sentinel,
# each count carrying the lattice it was counted on.
OLD1 = """        //     collapses the superset, and the athlete gets a lone press. 108 Full Body
        //     day-builds shipped with zero pulling. The membership is now derived, not
"""
NEW1 = """        //     collapses the superset, and the athlete gets a lone press. Measured on a
        //     reconstructed pre-D52 artifact with the SPINE_SWAP null replaced by a
        //     sentinel, so the deleted item stays visible: 'L-sit chinups' was DRAWN on
        //     632 day-builds of the 288-cell WIDE lattice and on 1392 of the 864-cell
        //     FULL lattice. On WIDE those draws sat in Pull superset A 520, Pull 50,
        //     Pull superset B 44, Upper superset 18. Of them, 18 on WIDE and 27 on FULL
        //     were Full Body days that lost their LAST pull. Zero-pull Full Body days on
        //     lowback/protect home_full ran V192 126, pre-D52 144, this candidate 126.
        //     The earlier "108" in this comment named no lattice and matched none of
        //     these; a count with no lattice is the same failure one size down.
        //     The membership is now derived, not
"""
REPS.append(('C1 108-figure', OLD1, NEW1))

# ── Correction 2 ────────────────────────────────────────────────────────────
# g193_pool_overlay.js does not hold the rule "for every branch". It carves the
# injury override chain out of the source and walks only the pools ASSIGNED
# INSIDE that chain. The sentence is rewritten to that exact scope.
OLD2 = """        //     tests/gates/g193_pool_overlay.js, which holds that for every branch and
        //     every gear tier and also holds D44's floor of two survivors.
"""
NEW2 = """        //     tests/gates/g193_pool_overlay.js. The gate's reach is narrower than the
        //     rule it defends, and the difference is the interesting part: it carves the
        //     injury pool-override chain out of the source at the chain's opening
        //     _R==='knee' test, then walks ONLY the *Pool assignments made inside that
        //     carved chain, resolving each across the six gear tiers of its hand table.
        //     Pools assigned anywhere else in the build are outside the walk entirely.
        //     Assignments inside the chain whose expression will not resolve from the
        //     gear predicates are reported UNRESOLVED and asserted on by nothing.
        //     D44's floor of two survivors is held at that same scope, not wider.
"""
REPS.append(('C2 gate-scope', OLD2, NEW2))

for name, old, new in REPS:
    n = src.count(old)
    print('anchor %-14s count==%d' % (name, n))
    if n != 1:
        sys.exit('ABORT: anchor %s matched %d times, expected exactly 1. Nothing written.' % (name, n))

for name, old, new in REPS:
    # comment-only guard: every line leaving and every line arriving must be //
    for tag, blob in (('old', old), ('new', new)):
        for line in blob.rstrip('\n').split('\n'):
            if not line.strip().startswith('//'):
                sys.exit('ABORT: %s %s line is not a comment: %r' % (name, tag, line))
    src = src.replace(old, new, 1)

io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE', PATH)
