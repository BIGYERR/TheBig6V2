#!/usr/bin/env python3
"""V201 / D94 slice 5 — sabotage specs only. No app edit, no gate edit.

Three edits, one per spec file, from coach's ruling D94-s after gatekeeper Phase B:

  1. tests/sabotage/v200.json — DELETE M2 and M3 (not repoint them). Both SURVIVED
     the re-pinned g200 though both are live (M2 moves 216 of 1,152 configs, M3 210
     of 1,152). Their `find` anchors are byte-identical to v199 M1 and M8; the PULL
     observable they proved was removed by construction in D94 (on every both-enter
     pull card the Main is a deadlift variant, so __mainPost is true on all 150
     positive-limb cards and pickIdx never leaves -1 there). What remains of them is
     the LEG observable, which IS v199 M1/M8, already red on V201 at 42/14 and 46/10.
     Repointing would make two rows score on another spec's proof. Count 9 -> 7.
     The supersession reason is carried as a `_file_header` key on the first row:
     tests/sabotage.py reads only name/anchor/replacement/gate and ignores extra
     keys, and a top-level header object is impossible because every array element
     is iterated as a mutation.

  2. tests/sabotage/v199.json — REWRITE M2. It is now a genuine no-op (0 of 1,152):
     D94's __mainPost guard skips the pre-pass loop exactly when a Main holds
     posterior, so no rewrite can restore its target. Obsolete, not broken. The
     claim it exercised (F4/H3) has no mutation on its ZERO side, so the rewrite
     probes that limb: drop the first-come fallback in the keep loop,
     (pickIdx<0||i===pickIdx) -> (i===pickIdx). Count stays 8.

  3. tests/sabotage/v201.json — M3's disclosed collateral must equal the MEASURED
     radius: five gates, not one. Count stays 4.

Anchors are asserted count==1 before anything is written; the first miss aborts the
whole script with no file touched. index.html is NOT an input and NOT an output.
"""
import hashlib
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V199 = os.path.join(ROOT, 'tests', 'sabotage', 'v199.json')
V200 = os.path.join(ROOT, 'tests', 'sabotage', 'v200.json')
V201 = os.path.join(ROOT, 'tests', 'sabotage', 'v201.json')
APP = os.path.join(ROOT, 'index.html')

fails = []


def read(path):
    with io.open(path, encoding='utf-8') as fh:
        return fh.read()


def need(hay, needle, label, n=1):
    got = hay.count(needle)
    if got != n:
        fails.append('%s: expected count==%d, got %d for %r' % (label, n, got, needle[:90]))
    return got == n


def sub(text, old, new, label):
    if not need(text, old, label):
        raise SystemExit('ABORT at %s' % label)
    return text.replace(old, new)


def cut(text, start, end, label):
    """Delete text[start_idx:end_idx) where both markers are unique."""
    if not need(text, start, label + ' (start)'):
        raise SystemExit('ABORT at %s' % label)
    if not need(text, end, label + ' (end)'):
        raise SystemExit('ABORT at %s' % label)
    i = text.index(start)
    j = text.index(end)
    if not i < j:
        fails.append('%s: start marker is not before end marker' % label)
        raise SystemExit('ABORT at %s' % label)
    return text[:i] + text[j:], text[i:j]


app_before = hashlib.sha1(read(APP).encode('utf-8')).hexdigest()

# ---------------------------------------------------------------------------
# EDIT 1 — tests/sabotage/v200.json: delete M2 and M3, header the reason on M1.
# ---------------------------------------------------------------------------
t200 = read(V200)

HEADER = (
    "V200 sabotage spec. ROWS M2 AND M3 WERE DELETED IN V201 (D94-s, coach on the record): "
    "M2/M3 superseded by D94 (pull arbitration is first-come when the Main holds posterior); "
    "leg-side coverage is v199 M1/M8. Both SURVIVED the re-pinned g200 while remaining live edits "
    "(M2 moves 216 of 1,152 configs, M3 210 of 1,152), because D94 removed the PULL observable they "
    "proved by construction: on every both-enter pull card the Main is a deadlift variant, so "
    "__mainPost is true on all 150 positive-limb cards and pickIdx never leaves -1 there. Pull "
    "direction is no longer a property of the engine, it is first-come, and v201 P2 and P7 pin that. "
    "What remained of M2/M3 was the LEG observable, whose find anchors are byte-identical to v199 M1 "
    "and M8 (M3's own note said so), and those are already red on V201 at 42/14 and 46/10. Repointing "
    "the two rows to g199 was proposed and REJECTED: it would make two rows score on another spec's "
    "proof. Sweep count 9 -> 7. M1 and M4 stay untouched, both still have a live observable on V201. "
    "This key is not a mutation field: tests/sabotage.py reads only name, anchor, replacement and gate, "
    "and a top-level header object is impossible because every array element is iterated as a mutation."
)

t200 = sub(
    t200,
    '[\n  {\n    "name": "M1 -> the `break` is removed,',
    '[\n  {\n    "_file_header": "' + HEADER + '",\n    "name": "M1 -> the `break` is removed,',
    'v200 M1 file header',
)

t200, cut200 = cut(
    t200,
    '  {\n    "name": "M2 -> the pull arbitration is reverted to V198 PUSH ORDER:',
    '  {\n    "name": "M4 -> the Pull superset B conditioning slot stops drawing',
    'v200 delete M2+M3',
)
if '"name": "M3 -> the one-accessory latch is dropped' not in cut200:
    fails.append('v200 delete M2+M3: M3 was not inside the removed slice')
    raise SystemExit('ABORT at v200 delete M2+M3')

# ---------------------------------------------------------------------------
# EDIT 2 — tests/sabotage/v199.json: rewrite M2 onto the zero side of F4/H3.
# ---------------------------------------------------------------------------
t199 = read(V199)

M2_NEW = (
    '  {\n'
    '    "name": "M2 -> the keep loop drops its first-come fallback: (pickIdx<0||i===pickIdx) becomes '
    '(i===pickIdx), so every deload card the posterior pre-pass did NOT pick ships with no accessory '
    'block at all and the ZERO side of the one-block claim is exercised",\n'
    '    "anchor": "    if(hasLift&&!accessoryKept&&(pickIdx<0||i===pickIdx)){ accessoryKept=true; '
    'keep.push(s); return; }",\n'
    '    "replacement": "    if(hasLift&&!accessoryKept&&(i===pickIdx)){ accessoryKept=true; '
    'keep.push(s); return; }",\n'
    '    "gate": "gates/g199_deload_arbitration.js",\n'
    '    "note": "REWRITTEN IN V201 (D94-s). The previous M2 probed \'the pre-pass scans MAIN sections '
    'too\'. D94\'s __mainPost guard skips the pre-pass loop exactly when a Main holds posterior chain '
    'work, so that mutation is now a genuine no-op (0 of 1,152 configs moved) and NO rewrite of it can '
    'restore its target. Coach ruled it OBSOLETE, NOT BROKEN. The CLAIM it exercised survives: g199 F4 '
    '(exactly one accessory block survives wherever one was available) and H3 (on the 2,160 trap cards '
    'exactly one still survives). That claim had no mutation on its ZERO side, because M5 and M8 both '
    'exercise the more-than-one side, so this rewrite probes the same assertion\'s other limb, '
    'single-site. THE ANCHOR IS THE M5/M8 LINE, so its count==1 is already established, and it is '
    'asserted again here. On V201 the mutant leaves every card the pre-pass did not pick with NO '
    'accessory block: the 2,160 trap cards, the 150 D94 pull cards, and every no-posterior card. '
    'DECLARED TRIPS: g199 F4, g199 H3, and g199 C1/C2 (zero-posterior deload weeks rise from 0). '
    'EXPECTED COLLATERAL: PENDING GATEKEEPER MEASUREMENT. It is deliberately NOT written here, because '
    'a disclosed radius that was guessed rather than measured is exactly the §12 defect recorded '
    'against tests/sabotage/v200.json M2, and this build is fixing that defect elsewhere in the same '
    'slice. Coach EXPECTS HALF_MANNY to move, since Mario\'s deload accessories are all first-come '
    'kept, which would take g199 B1 and every digest reader (g197a, g197b, g198, g200 B1) red. That '
    'expectation is a prediction, not the disclosed list, and gatekeeper replaces this sentence with '
    'the measured radius. IF GATEKEEPER READS 0 MOVED, this is a mutation defect and it comes back to '
    'coach, not to the gate."\n'
    '  },\n'
)

t199, cut199 = cut(
    t199,
    '  {\n    "name": "M2 -> the pre-pass scans MAIN sections too',
    '  {\n    "name": "M3 -> the hoisted posterior lens is narrowed to hinge alone',
    'v199 rewrite M2',
)
t199 = sub(
    t199,
    '  {\n    "name": "M3 -> the hoisted posterior lens is narrowed to hinge alone',
    M2_NEW + '  {\n    "name": "M3 -> the hoisted posterior lens is narrowed to hinge alone',
    'v199 insert rewritten M2 before M3',
)

# ---------------------------------------------------------------------------
# EDIT 3 — tests/sabotage/v201.json: M3's disclosed collateral == measured radius.
# ---------------------------------------------------------------------------
t201 = read(V201)

t201 = sub(
    t201,
    'EXPECTED COLLATERAL, DISCLOSED: g200 B1 goes red, because HALF_MANNY builds pull days and its '
    'progDigest moves off the V201 row of MANNY_DIGEST_BY_VERSION.',
    'EXPECTED COLLATERAL, DISCLOSED, AND THIS LIST IS THE WHOLE OF THE MEASURED RADIUS: the mutant '
    'takes FIVE gate files red, not one. g200 FAIL 2, g199 FAIL 3, g198 FAIL 1, g197a FAIL 1, g197b '
    'FAIL 4. The root cause is single and is the same as M4 below: HALF_MANNY builds pull days, its '
    'progDigest moves off the V201 row of MANNY_DIGEST_BY_VERSION, and all five files read that table. '
    'An earlier draft of this note disclosed only g200 B1, which is the §12 defect recorded '
    'against tests/sabotage/v200.json M2 repeated in the spec written this very build; the disclosed '
    'list is now equal to what gatekeeper measured, and the declared target (P7) is still not to be '
    'mistaken for the radius.',
    'v201 M3 measured radius',
)

# ---------------------------------------------------------------------------
if fails:
    for f in fails:
        print('ANCHOR FAIL: ' + f)
    raise SystemExit('ABORT: no file written')

for path, text in ((V200, t200), (V199, t199), (V201, t201)):
    with io.open(path, 'w', encoding='utf-8') as fh:
        fh.write(text)
    print('wrote %s (%d bytes)' % (path, len(text.encode('utf-8'))))

app_after = hashlib.sha1(read(APP).encode('utf-8')).hexdigest()
assert app_before == app_after, 'index.html changed; it must not'
print('index.html sha1 unchanged: ' + app_after)
sys.exit(0)
