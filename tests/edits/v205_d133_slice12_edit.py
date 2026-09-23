#!/usr/bin/env python3
# V205 slice 12 — D133: g199_deload_arbitration's five arbitration literals become era rows.
# NO engine change: index.html is not opened by this script.
# Every anchor asserted count==1 before any write; first miss aborts the whole script.
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G199 = os.path.join(ROOT, 'tests', 'gates', 'g199_deload_arbitration.js')
REG  = os.path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md')

def rd(p):
    with io.open(p, encoding='utf-8') as f: return f.read()
def wr(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

reps = []   # (label, path, old, new)

# ── EDIT 1. The era table itself, with the attribution for every moved number. ──
TABLE = '''
// ── ERA ROWS: the five arbitration counts, keyed by ia-version (D133) ──────────────
// Same D94-t convention as harness.js's digest tables. A row records a CLAIM, not a
// value: a LITERAL row asserts a RULED MOVE and cites its attribution; a REFERENCE row
// asserts RULED UNMOVED and is proved by gate.sh running this file on V(N-1) and V(N);
// a MISSING row fails loudly, because every consumer below asserts the row exists as a
// CONJUNCT before it compares. These five were bare literals until V205, which made
// them red on the candidate for a reason this gate does not test.
//
// THE CAP ITSELF IS PROVABLY UNCHANGED BY V205. On the 10,698 cells where
// capRegionalFatigue was handed identical input, its verdict differs on 0 and its output
// label list differs on 0. Every move in the V205 row below is an INPUT move: V205
// legitimately reaches capRegionalFatigue, which reads _cardioInterference(cardio) at
// index.html:10170 — the same call the session budget makes at :9986. recoveryDeload
// does NOT read cardio; C1/C3/C5 and D2 move because they count posterior sections
// AFTER the regional cap has run.
const DELOAD_ARB_BY_VERSION = {
  // V198/V199: the counts D91 was ruled against. Literal rows: this is the origin.
  198: { capLSBkilled: 714, zeroWeeks: 372, zeroWeeksNonDeload: 372, zeroWeeksDeloadOff: 40, dlIdentical: 21 },
};
DELOAD_ARB_BY_VERSION[199] = DELOAD_ARB_BY_VERSION[198];   // D91: ruled UNMOVED
DELOAD_ARB_BY_VERSION[200] = DELOAD_ARB_BY_VERSION[199];   // D89: ruled UNMOVED (core-tier clause, not the arbitration)
DELOAD_ARB_BY_VERSION[201] = DELOAD_ARB_BY_VERSION[200];   // D94: ruled UNMOVED
DELOAD_ARB_BY_VERSION[202] = DELOAD_ARB_BY_VERSION[201];   // V202: ruled UNMOVED (NSW run work only)
DELOAD_ARB_BY_VERSION[203] = DELOAD_ARB_BY_VERSION[202];   // D117: ruled UNMOVED (NRC dose copy, no section arbitration)
DELOAD_ARB_BY_VERSION[204] = DELOAD_ARB_BY_VERSION[203];   // D126: ruled UNMOVED (string-and-gate only)
// V205: ruled MOVE, so a LITERAL row, one attribution per number. Every figure below is
// measure's attribution pass, which reproduced all five V204 literals on the V204
// baseline FIRST (I3 714, C1 372, C3 372, C5 40, D2 21) before reading the candidate:
// the instrument was proved before it was used. These are not numbers copied out of a
// failure message.
DELOAD_ARB_BY_VERSION[205] = {
  // I3. 714 -> 496. "The cap trims less" is true of 44 cells ONLY: 44 cells where the cap
  // reads interference 0.75 -> 0 (the Incline Walk leaving the legs day). The remaining
  // net 174 comes from a 3,168-cell reshuffle of WHICH days are offered Leg superset B at
  // all, because 11,616 pace day-builds changed role under D127. Entering the cap is
  // unmoved at 15,720 (F2, untouched).
  capLSBkilled: 496,
  // C1. 372 -> 364 of 17,856 weeks. Same reader, opposite directions: +24 where the cap
  // KEEPS Leg superset B on a legs day whose interference dropped, -16 where the legs day
  // relocated onto Monday's INT at interference 1.40 with legLoad false -> true and the
  // cap kills it there.
  zeroWeeks: 364,
  // C3. 372 -> 364, the same weeks as C1. Deload zeros remain 0 (C2), so the claim the
  // gate exists to make survives the move intact.
  zeroWeeksNonDeload: 364,
  // C5. 40 -> 32 in the __DELOAD_OFF arm: +12 week-4 lowback/protect, -4 week-8
  // bodyweight. The C1 and C5 sets are DISJOINT — no week is counted by both.
  zeroWeeksDeloadOff: 32,
  // D2. 21 -> 19, so differing deload weeks go 2,859 -> 2,861 of 2,880. NOTE THE
  // DIRECTION: this went UP, not down. 2 deload weeks where interference 0.75 -> 0 makes
  // the cap spare Leg superset B in the __DELOAD_OFF arm only, while recoveryDeload still
  // drops it in the ON arm. The reader is capRegionalFatigue, not a next-day pass:
  // measure excluded index.html:6454, :7698/:8440, :10351 and :6689 by printed hotNext
  // and legLoad values on both weeks.
  dlIdentical: 19,
};
'''
reps.append(('E1 era table', G199,
  "const ART=path.resolve(process.argv[2]||path.join(__dirname,'..','..','index.html'));\n",
  "const ART=path.resolve(process.argv[2]||path.join(__dirname,'..','..','index.html'));\n" + TABLE))

# Header prose carried two of the same literals. A stale header is a lie in the same file.
reps.append(('E1b header C-claim', G199,
  '// deload weeks == 0" and "zero-posterior weeks == 372" are.',
  '// deload weeks == 0" and "zero-posterior weeks == the candidate\'s DELOAD_ARB_BY_VERSION\n'
  '// row" are (D133: the five arbitration counts are era rows, never bare literals).'))
reps.append(('E1c header denominator', G199,
  '//   - Deload weeks by isRecoveryWeek == 2,880. Deload weeks that actually DIFFER with the\n'
  '//     pass off == 2,859, because 21 of them are byte-identical either way (D2).',
  '//   - Deload weeks by isRecoveryWeek == 2,880. Deload weeks that actually DIFFER with the\n'
  '//     pass off == 2,880 minus the era row\'s dlIdentical, because that many are byte-\n'
  '//     identical either way (D2). V198-V204: 21 identical, 2,859 differ. V205: 19 and 2,861.'))

# ── EDIT 2. C1 / C3 / C5 read the row, row existence a conjunct. ──
reps.append(('E2 C1', G199,
  "  ok(N.zeroWeeks===372,'C1 zero-posterior weeks on the SHIPPED card == 372 of '+ALLWK+' weeks (1,728 configs); got '+N.zeroWeeks);",
  "  ok(!!ERA&&N.zeroWeeks===ERA.zeroWeeks,'C1 zero-posterior weeks on the SHIPPED card == '+ERAv('zeroWeeks')+' (the V'+IP.version+' DELOAD_ARB_BY_VERSION row) of '+ALLWK+' weeks (1,728 configs); got '+N.zeroWeeks+NOROW);"))
reps.append(('E2 C3', G199,
  "  ok(N.zeroWeeksNonDeload===372,'C3 the surviving 372 are all NON-deload weeks (denominator '+N.nonDeloadWeeks+'); got '+N.zeroWeeksNonDeload);",
  "  ok(!!ERA&&N.zeroWeeksNonDeload===ERA.zeroWeeksNonDeload,'C3 the surviving '+ERAv('zeroWeeksNonDeload')+' (the V'+IP.version+' row) are all NON-deload weeks (denominator '+N.nonDeloadWeeks+'), so C2\\'s zero holds: got '+N.zeroWeeksNonDeload+NOROW);"))
reps.append(('E2 C5', G199,
  "  ok(F.zeroWeeksDeload===40,'C5 __DELOAD_OFF comparator: with the pass disabled, 40 deload weeks ship zero posterior (got '+F.zeroWeeksDeload+')');",
  "  ok(!!ERA&&F.zeroWeeksDeload===ERA.zeroWeeksDeloadOff,'C5 __DELOAD_OFF comparator: with the pass disabled, '+ERAv('zeroWeeksDeloadOff')+' deload weeks (the V'+IP.version+' row) ship zero posterior. This set and C1\\'s are DISJOINT; got '+F.zeroWeeksDeload+NOROW);"))

# ── EDIT 3. D2 and I3 read the row. ──
reps.append(('E3 D2', G199,
  "  ok(R.dlIdentical===21,'D2 21 deload weeks are byte-identical with the deload off, so the sha-method deload count is 2,859 ('+(R.dlTotal-R.dlIdentical)+' differ of '+R.dlTotal+'). 2,880 and 2,859 are two measurements, not a disagreement');",
  "  ok(!!ERA&&R.dlIdentical===ERA.dlIdentical,'D2 '+ERAv('dlIdentical')+' deload weeks (the V'+IP.version+' row) are byte-identical with the deload off, so the sha-method deload count is '+(ERA?R.dlTotal-ERA.dlIdentical:'NO ROW')+' ('+(R.dlTotal-R.dlIdentical)+' differ of '+R.dlTotal+'). '+R.dlTotal+' and '+(R.dlTotal-R.dlIdentical)+' are two measurements, not a disagreement; got '+R.dlIdentical+NOROW);"))
reps.append(('E3 I3', G199,
  "  ok(N.capLSBkilled===714,'I3 capRegionalFatigue still kills exactly 714 Leg superset B sections, the same count V198 killed, out of '+N.capLSBin+' entering the cap (all day builds, n='+N.dayCells+'); got '+N.capLSBkilled);",
  "  ok(!!ERA&&N.capLSBkilled===ERA.capLSBkilled,'I3 capRegionalFatigue kills exactly '+ERAv('capLSBkilled')+' Leg superset B sections (the V'+IP.version+' row), out of '+N.capLSBin+' entering the cap (all day builds, n='+N.dayCells+'); got '+N.capLSBkilled+NOROW);"))

# The row lookup, sited where every consumer above can see it.
reps.append(('E3b row lookup', G199,
  "  const N=R.on, F=R.off;\n",
  "  const N=R.on, F=R.off;\n"
  "  // D133. The era row, looked up ONCE. Its existence is a conjunct in every assertion\n"
  "  // that reads it, so an artifact with no row fails loudly instead of skipping.\n"
  "  const ERA=DELOAD_ARB_BY_VERSION[IP.version]||null;\n"
  "  const ERAv=k=>(ERA?ERA[k]:'NO ROW');\n"
  "  const NOROW=(ERA?'':' — no DELOAD_ARB_BY_VERSION row for V'+IP.version+': an unpinned arbitration count (D133)');\n"))

# ── EDIT 4. The D-code registry. ──
reps.append(('E4 registry', REG,
  'highest assigned = D132. Next free = D133.',
  'highest assigned = D134. Next free = D135.'))

# ── assert every anchor count==1 BEFORE writing anything ──
src = {}
for label, p, old, new in reps:
    if p not in src: src[p] = rd(p)
counts = []
for label, p, old, new in reps:
    c = src[p].count(old)
    counts.append((label, c))
    if c != 1:
        sys.stderr.write('ABORT: anchor %s count==%d (want 1) in %s\n' % (label, c, p))
        sys.exit(1)

for label, p, old, new in reps:
    src[p] = src[p].replace(old, new, 1)
for p in src: wr(p, src[p])

for label, c in counts: print('anchor %-22s count==%d  OK' % (label, c))
print('WROTE %s' % ', '.join(sorted(src)))
