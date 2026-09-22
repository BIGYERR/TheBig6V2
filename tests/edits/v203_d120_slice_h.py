# -*- coding: utf-8 -*-
# V203 slice H — D120. The last two hardcoded HALF_MANNY digests in the suite
# (g200_core_tier F1a / F1b) become era rows. D117 moved both arms; a literal pin
# there is now a lie on the candidate and green-for-the-wrong-reason on the baseline.
#
# Touches TWO FILES: tests/harness.js and tests/gates/g200_core_tier.js.
# It does NOT touch index.html. The artifact is final for V203.
import io, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HARNESS = os.path.join(ROOT, 'tests', 'harness.js')
GATE    = os.path.join(ROOT, 'tests', 'gates', 'g200_core_tier.js')

def rd(p):
    with io.open(p, 'r', encoding='utf-8') as f: return f.read()
def wr(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

EDITS = []   # (path, label, old, new)

# ── GUARD. index.html must not be in this script's blast radius at all. ────────────
assert 'index.html' not in ' '.join([HARNESS, GATE])

# ══ EDIT 1 ═══ tests/harness.js: the third era table, declared and exported the same
# way as the other two. Starts at 200 deliberately: on V199 the clause does not exist,
# the counterfactual is not constructible, and a 199 row would be a dead pin dressed
# as a maintained one (standing ruling 3).
E1_OLD = """MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203] = '8fe23ae9eadde78c';   // D117: the ruled digest move

module.exports = { load, extractInlineJS, fixtures, weekGrid, progDigest, DAYS, EXPORT_NAMES,
                   MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION };"""

E1_NEW = """MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203] = '8fe23ae9eadde78c';   // D117: the ruled digest move

// D120. The THIRD counterfactual oracle, on the same D94-t convention as the two above:
// HALF_MANNY built from the candidate with the V200 declared-core clause line stripped.
// Its consumer is g200_core_tier F1a, which until V203 pinned a literal. D117 moved both
// arms of that gate, so the literal was a lie on the candidate and green-for-the-wrong-
// reason on the baseline; an era row is green on BOTH artifacts for the right reason.
// The table starts at 200 and has NO 199 row on purpose: on V199 the clause does not
// exist, the counterfactual is not constructible, and a 199 row would be a dead pin
// dressed as a maintained one. Every value below was printed by coach from source-surgery
// copies of the V199..V202 tag artifacts and the V203 working copy, reproducing the
// earlier rows on the same run so the new one is anchored. Not read off gate output.
const MANNY_CORE_OFF_DIGEST_BY_VERSION = {
  200: '6e32421331693437',   // D89: V200 with the clause stripped is V199's shipped digest
};
MANNY_CORE_OFF_DIGEST_BY_VERSION[201] = MANNY_CORE_OFF_DIGEST_BY_VERSION[200];   // D94: ruled UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[202] = MANNY_CORE_OFF_DIGEST_BY_VERSION[201];   // V202: UNMOVED
MANNY_CORE_OFF_DIGEST_BY_VERSION[203] = '658ad56c903ad829';   // D117 moved both arms; D120

module.exports = { load, extractInlineJS, fixtures, weekGrid, progDigest, DAYS, EXPORT_NAMES,
                   MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION,
                   MANNY_CORE_OFF_DIGEST_BY_VERSION };"""
EDITS.append((HARNESS, 'E1 harness: MANNY_CORE_OFF_DIGEST_BY_VERSION + export', E1_OLD, E1_NEW))

# ══ EDIT 2 ═══ g200_core_tier F1a: re-point at the era row, and reword the claim so it
# names the TABLE rather than V199. Part (a) puts the symbol in scope; part (b) is the
# assertion itself. Row existence is a CONJUNCT, so an ABSENT row fails loudly.
E2A_OLD = ("const {load, fixtures, weekGrid, progDigest, DAYS}"
           "=require(path.join(__dirname,'..','harness.js'));")
E2A_NEW = ("const {load, fixtures, weekGrid, progDigest, DAYS,\n"
           "       MANNY_DIGEST_BY_VERSION, MANNY_CORE_OFF_DIGEST_BY_VERSION}"
           "=require(path.join(__dirname,'..','harness.js'));")
EDITS.append((GATE, 'E2a gate: import the two era tables', E2A_OLD, E2A_NEW))

E2B_OLD = ("ok(digM==='6e32421331693437', 'F1a the counterfactual IS V199: "
           "HALF_MANNY digest 6e32421331693437 (got '+digM+')');")
E2B_NEW = (
"const CORE_OFF_ROW=MANNY_CORE_OFF_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)\n"
"ok(!!CORE_OFF_ROW&&digM===CORE_OFF_ROW, 'F1a the counterfactual matches the V'+IA.version"
"+' row of MANNY_CORE_OFF_DIGEST_BY_VERSION ('+(CORE_OFF_ROW||'NO ROW')+') (got '+digM+')'"
"+(CORE_OFF_ROW?'':' — no MANNY_CORE_OFF_DIGEST_BY_VERSION row for V'+IA.version"
"+': an unruled counterfactual digest move'));")
EDITS.append((GATE, 'E2b gate: F1a re-pointed at the era row', E2B_OLD, E2B_NEW))

# ══ EDIT 3 ═══ g200_core_tier F1b: the shipped arm, same treatment, same table every
# other gate in the suite already reads.
E3_OLD = ("ok(digC==='d4364dd3fa63a3a1', 'F1b the candidate ships the ruling\\'s after-digest "
          "d4364dd3fa63a3a1 (got '+digC+')');")
E3_NEW = (
"const SHIPPED_ROW=MANNY_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)\n"
"ok(!!SHIPPED_ROW&&digC===SHIPPED_ROW, 'F1b the candidate ships the V'+IA.version"
"+' row of MANNY_DIGEST_BY_VERSION ('+(SHIPPED_ROW||'NO ROW')+') (got '+digC+')'"
"+(SHIPPED_ROW?'':' — no MANNY_DIGEST_BY_VERSION row for V'+IA.version"
"+': an unruled digest move'));")
EDITS.append((GATE, 'E3 gate: F1b re-pointed at the era row', E3_OLD, E3_NEW))

# ══ EDIT 4 ═══ the header block's F/G paragraph carried the same stale claim as F1a's
# message: that the counterfactual IS V199. After D117 that is false. Name the TABLE.
E4_OLD = """//   F/G the counterfactual is the CANDIDATE with the one clause line removed. F1 proves
//      that counterfactual IS V199 (HALF_MANNY digest 6e32421331693437, the value V198
//      and V199 shipped and four other gates pin). Every before/after number is measured
//      against it on a stated lattice, and every population is printed with a denominator."""
E4_NEW = """//   F/G the counterfactual is the CANDIDATE with the one clause line removed. F1 proves
//      that counterfactual matches its era row in MANNY_CORE_OFF_DIGEST_BY_VERSION, the
//      harness table that records the clause-off HALF_MANNY digest per version, and that
//      the shipped arm matches its row in MANNY_DIGEST_BY_VERSION. Row existence is a
//      conjunct, so a missing row fails loudly. On V200 to V202 the clause-off row is
//      6e32421331693437, the digest V198 and V199 shipped and four other gates pin; D117
//      moved BOTH arms on V203, which is why neither arm is a literal here any more (D120).
//      Every before/after number is measured against the counterfactual on a stated
//      lattice, and every population is printed with a denominator."""
EDITS.append((GATE, 'E4 gate: header F/G paragraph names the table, not V199', E4_OLD, E4_NEW))

# ── PASS 1: assert every anchor count==1 across BOTH files before writing anything. ──
src = {HARNESS: rd(HARNESS), GATE: rd(GATE)}
fail = False
for p, label, old, new in EDITS:
    n = src[p].count(old)
    print('anchor %-58s count=%d' % (label, n))
    if n != 1:
        print('  ABORT: expected exactly 1 occurrence in %s' % os.path.basename(p)); fail = True
if fail:
    sys.exit('ABORTED — no file written.')

# ── PASS 2: apply in order, version meta bump is NOT part of this slice (tests only). ──
for p, label, old, new in EDITS:
    src[p] = src[p].replace(old, new, 1)
for p in src:
    wr(p, src[p])
print('WROTE %s' % HARNESS)
print('WROTE %s' % GATE)
print('index.html NOT touched by this script.')
