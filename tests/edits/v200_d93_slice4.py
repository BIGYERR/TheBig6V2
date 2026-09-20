# -*- coding: utf-8 -*-
# V200 / D93 (AMENDED), SLICE 4 of 4 — GATE-ONLY. index.html IS NOT TOUCHED, ia-version stays 199.
#
# DIFF CLASSES THIS SCRIPT PRODUCES, for gatekeeper's blast-radius pass:
#   CLASS R (RULED REMOVAL, not a cleanup): the P1 and P2 ok() rows and their dedicated
#     comment prose leave tests/gates/g199_deload_arbitration.js under D93 AMENDED. On g199's
#     1,728-key lattice both were VACUOUS — 1,440 both-enter deload cards, 0 of them with a
#     posterior-holding Pull superset B, and identical readings on V198 and V199. Coverage of
#     the D93 pull swap now lives in tests/gates/g200_pull_arbitration.js on a mini-lattice
#     built to contain the positive limb (150 swap cards). A removal that is not ruled is a
#     regression; this one is ruled and this comment is the ruling's fingerprint.
#     PLABELS and the pull census COLLECTION code (PLABELS const, pullP1all/pullP2all/
#     pullShipAll/pullP1/pullP2/pullBothP1/pullSwapCensus) are DELIBERATELY KEPT: P0 reads them.
#   CLASS P0 (ADD): one new ok() row recording g199's own blindness to the pull swap.
#   CLASS S (SHARED ORACLE): g199's 14-name posterior blindness probe is replaced by the
#     17-name probe g200 already asserts, and g200's cls() probe (A5) is carried into g199,
#     so BOTH files assert the identical hand-typed expected columns against a byte-identical
#     E_PAT and a byte-identical cls(). No shared module is extracted in this slice.
#
# PASS-COUNT ARITHMETIC (predicted): 56 - 2 (P1, P2) + 1 (P0) + 1 (A5) = 56.
#
# Every anchor is asserted count==1 before any byte is written; the first miss aborts.
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G199 = os.path.join(ROOT, 'tests', 'gates', 'g199_deload_arbitration.js')
G200 = os.path.join(ROOT, 'tests', 'gates', 'g200_pull_arbitration.js')

src = io.open(G199, encoding='utf-8').read()
g200 = io.open(G200, encoding='utf-8').read()
orig = src
edits = []

def rep(tag, old, new):
    global src
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d, want 1\n  %r\n' % (tag, n, old[:120]))
        sys.exit(1)
    src = src.replace(old, new, 1)
    edits.append(tag)

# ── EDIT 1 (CLASS S) — the 17-name posterior blindness probe, byte-identical to g200's ──
PROBE_OLD = u"""const PROBE=[['Back squat',0],['Leg extension',0],['Lying leg curl',0],['Leg press',0],
  ['Dumbbell standing calf raise',0],['Dumbbell Bulgarian split squat',0],['Wall sit',0],
  ['Nordic hamstring curl (anchored)',1],['Single-leg glute bridge',1],['Single-leg hip thrust',1],
  ['Barbell Romanian deadlift',1],['Banded hip thrust',1],['45° back extension',1],['Kettlebell swing',1]];
"""
PROBE_NEW = u"""// 17-name blindness probe, expected column hand-typed from the doctrine movement names.
// Ten negatives (four of them pull-side, because this is the pull gate) and seven positives.
const PROBE=[['Back squat',0],['Leg extension',0],['Lying leg curl',0],['Leg press',0],
  ['Dumbbell standing calf raise',0],['Wall sit',0],['Barbell row',0],['Lat pulldown',0],
  ['Chin-up',0],['Face pull',0],
  ['Nordic hamstring curl (anchored)',1],['Single-leg glute bridge',1],['Barbell Romanian deadlift',1],
  ['45° back extension',1],['Kettlebell swing',1],['Dumbbell split-stance deadlift',1],['Barbell hip thrust',1]];
"""
# The probe body must be the one g200 already asserts, byte for byte.
if g200.count(PROBE_NEW) != 1:
    sys.stderr.write('ABORT E1: the 17-name probe is not present exactly once in g200\n')
    sys.exit(1)
rep('E1 17-name posterior probe (shared with g200)', PROBE_OLD, PROBE_NEW)

# ── EDIT 2 (CLASS S) — carry g200's cls() probe into g199, array byte-identical ─────────
CLS_TAIL = u"""  if(!(s.p||[]).some(p=>p)) return 'none';
  return 'cand';
}
const secPost="""
CLS_PROBE_ARRAY = u"""const CLS_PROBE=[
  [{l:'Pull superset A',p:['pull']},'cand'],
  [{l:'Pull superset B',p:['pull','hinge']},'cand'],
  [{l:'Pull',p:['hinge']},'cand'],
  [{l:'Main strength',p:['squat']},'main'],
  [{l:'Primer',p:['power']},'main'],
  [{l:'Power block',p:['power']},'main'],
  [{l:'Strength block',p:['press']},'main'],
  [{l:'Hip mobility',p:['hinge']},'prehab'],
  [{l:'Pull superset A',hip:true,p:['pull']},'prehab'],
  [{l:'Explosive finisher',p:['power']},'fluff'],
  [{l:'Loaded carry',p:['carry']},'fluff'],
  [{l:'Pull superset B',opt:true,p:['pull']},'fluff'],
  [{l:'Pull superset A',p:[null,null]},'none'],
  [{l:'Pull superset B',p:[]},'none']];
"""
if g200.count(CLS_PROBE_ARRAY) != 1:
    sys.stderr.write('ABORT E2: CLS_PROBE is not present exactly once in g200\n')
    sys.exit(1)
CLS_NEW = u"""  if(!(s.p||[]).some(p=>p)) return 'none';
  return 'cand';
}
// A5 probe, carried from g200_pull_arbitration.js byte-identical: hand-typed sections,
// hand-typed expected class. Every one of the four candidacy tests is exercised in both
// directions, and the three PULL FAMILY labels are shown to land on 'cand'. SPLIT-LENS
// GUARD: g199 and g200 both run this same array against the same cls(), so the two files
// cannot drift into two different notions of what an accessory candidate is. Nothing here
// touches the engine.
""" + CLS_PROBE_ARRAY + u"""const secPost="""
rep('E2 cls() probe (shared with g200)', CLS_TAIL, CLS_NEW)

# ── EDIT 3 (CLASS S) — assert A5 next to A4 ────────────────────────────────────────────
A4_OLD = u"""ok(probeBad.length===0,'A4 hand posterior oracle passes its blindness probe on all '+PROBE.length+' names'
  +(probeBad.length?' — misreads '+probeBad.map(x=>x[0]).join(', '):''));
"""
A4_NEW = u"""ok(probeBad.length===0,'A4 hand posterior oracle passes its blindness probe on all '+PROBE.length+' names, '
  +PROBE.filter(x=>x[1]===1).length+' positives and '+PROBE.filter(x=>x[1]===0).length+' negatives, four of the negatives pull-side. '
  +'SHARED ORACLE: this probe body and E_PAT are byte-identical to tests/gates/g200_pull_arbitration.js, and both files assert them'
  +(probeBad.length?' — misreads '+probeBad.map(x=>x[0]).join(', '):''));
const clsBad=CLS_PROBE.filter(([s,e])=>cls(s)!==e);
ok(clsBad.length===0,'A5 SPLIT-LENS GUARD: the four candidacy tests pass a hand-typed probe on all '+CLS_PROBE.length+' sections, and the three pull-family labels land on cand. cls() here is byte-identical to the copy in tests/gates/g200_pull_arbitration.js and BOTH files assert it against this same array, so neither can drift into its own private notion of an accessory candidate'
  +(clsBad.length?' — misreads '+clsBad.map(x=>x[0].l+'=>'+cls(x[0])+' want '+x[1]).join(', '):''));
"""
rep('E3 A5 split-lens assertion', A4_OLD, A4_NEW)

# ── EDIT 4 (CLASS R + CLASS P0) — P1 and P2 out, P0 in ─────────────────────────────────
START = u"  // \u2550\u2550 D93 (V200) PULL SIDE \u2014 P1 conservation, P2 per-card expected survivor \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n"
END   = u"    + 'D94 REVERSES THE DIRECTION THIS PINS. A trip on P2 once D94 has shipped is EXPECTED and is not a regression.');\n"
for tag, mark in (('E4-start', START), ('E4-end', END)):
    if src.count(mark) != 1:
        sys.stderr.write('ABORT %s: marker count==%d, want 1\n' % (tag, src.count(mark)))
        sys.exit(1)
i0 = src.index(START)
i1 = src.index(END) + len(END)
if i1 <= i0:
    sys.stderr.write('ABORT E4: end marker precedes start marker\n')
    sys.exit(1)

P0_BLOCK = u"""  // \u2550\u2550 D93 (V200, AMENDED) PULL SIDE \u2014 P0, g199's OWN BLINDNESS, RECORDED \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  // RULED REMOVAL, NOT A CLEANUP. The P1 (pull-block conservation) and P2 (per-card expected
  // survivor) rows that stood here through slices 1 and 2 are OUT under D93 AMENDED. On this
  // gate's 1,728-key lattice they were VACUOUS: all 1,440 deload day builds that offer both
  // Pull superset A and Pull superset B enter with NEITHER block holding an E_PAT posterior
  // item, so the positive limb of the iff was never exercised, and both rows read identically
  // on V198 and V199 \u2014 a change-detector that cannot detect the change it names. Coverage of
  // the D93 pull swap now lives in tests/gates/g200_pull_arbitration.js (P1, P2, P2c, P2c-floor,
  // P4) on a mini-lattice built to CONTAIN the positive limb: 150 swap cards of 1,120 deload
  // day builds, red on V198 and green on V199. Do not re-add a pull-swap assertion to this
  // file without re-reading that one.
  //
  // P0 IS WHAT REPLACES THEM, and it is not a coverage claim. It is a BLINDNESS claim: it pins
  // the exact shape of this gate's inability to see the swap, so a silent vacuous PASS becomes
  // a RECORDED one. If the lattice, the pull pool or the conditioning draw ever changes such
  // that a Pull superset B enters a g199 deload card holding posterior work, P0 TRIPS and the
  // re-siting question comes back on the record instead of sliding through green. A TRIP HERE
  // IS A RE-SITING QUESTION, NOT AN ENGINE DEFECT.
  // PLABELS and the pull* counters above are kept precisely because P0 reads them.
  const enterPostB = Object.keys(N.pullSwapCensus||{})
    .reduce((a,k) => a + (/enterPost=\\S*B/.test(String(k)) ? N.pullSwapCensus[k] : 0), 0);
  const PFAM_P2ALL = g(N.pullP2all,'Pull superset A') + g(N.pullP2all,'Pull superset B') + g(N.pullP2all,'Pull');
  ok(N.pullBothP1===1440 && enterPostB===0,
    'P0 RECORDED BLINDNESS: this gate CANNOT SEE the D93 pull swap. THE REAL ORACLE IS tests/gates/g200_pull_arbitration.js. '
    + 'BOTH POPULATIONS, WITH DENOMINATORS: deload day builds offering BOTH pull blocks at p1 == ' + N.pullBothP1 + ' (want 1,440) of ' + D_DAY + ' deload day builds, themselves of ' + N.dayCells + ' day builds across ' + N.configs + ' configs; of those both-enter cards, those whose Pull superset B holds an E_PAT posterior item at p1 == ' + enterPostB + ' (want 0). '
    + 'CENSUS ' + JSON.stringify(N.pullSwapCensus) + ' (want {\"enterPost=none surv=A\":1440}). STAGE pull-family census after the deload: A ' + g(N.pullP2all,'Pull superset A') + ' + B ' + g(N.pullP2all,'Pull superset B') + ' + bare Pull ' + g(N.pullP2all,'Pull') + ' = ' + PFAM_P2ALL + '. Bare `Pull` reads 0 at the stage BY CONSTRUCTION: singletonSupersetSweep (index.html:10010) runs post-build, downstream of p1/p2/p3. '
    + 'THE ZERO CARRIES ITS DENOMINATOR: 0 of ' + N.pullBothP1 + ', and that is the finding, not an omission. The positive limb of the D93 iff has population zero on this lattice, so nothing here distinguishes the V199 arbitration from V198 push order on the pull side; both artifacts read these same two numbers. g200 exercises that limb 150 times. '
    + 'STRUCTURAL REASON, not a shortfall: E_FOCUS here is [hypertrophy, balanced], and Pull superset B exists only on the else branch of the goal===strength || goal===hypertrophy guard at index.html:8223, so hypertrophy configs label the section Row volume and cannot contribute a B at all. B enters on only ' + g(N.pullP1all,'Pull superset B') + ' of ' + N.dayCells + ' day builds.');
"""
src = src[:i0] + P0_BLOCK + src[i1:]
edits.append('E4 P1+P2 out (CLASS R), P0 in (CLASS P0)')

# ── POSTCONDITIONS ─────────────────────────────────────────────────────────────────────
if src == orig:
    sys.stderr.write('ABORT: no change written\n'); sys.exit(1)

# The two removed assertion IDs must be gone as ASSERTIONS. Matching on the ok( call text,
# never on header/comment prose (slice-3 lesson: a postcondition that can match this
# script's own narration proves nothing).
for dead in (u"'P1 PULL-BLOCK CONSERVATION", u"'P2 PER-CARD EXPECTED SURVIVOR"):
    if dead in src:
        sys.stderr.write('ABORT postcondition: %s still asserted in g199\n' % dead); sys.exit(1)
for live in (u"'P0 RECORDED BLINDNESS", u"'A5 SPLIT-LENS GUARD", u"const CLS_PROBE=["):
    if src.count(live) != 1:
        sys.stderr.write('ABORT postcondition: %s count==%d\n' % (live, src.count(live))); sys.exit(1)
# No dead references to the removed rows' locals.
for dead in (u"P2_VIOL", u"const pExp", u"const pEnter", u"const pSurv"):
    if dead in src:
        sys.stderr.write('ABORT postcondition: dead local %s survives\n' % dead); sys.exit(1)

io.open(G199, 'w', encoding='utf-8').write(src)
sys.stderr.write('WROTE %s\n' % G199)
for e in edits:
    sys.stderr.write('  applied %s\n' % e)

# ── SHARED-ORACLE PROOF: E_PAT, PROBE and cls() byte-identical across the two files ────
def region(text, a, b):
    i = text.index(a); j = text.index(b, i)
    return text[i:j]
pairs = [
    ('E_PAT+ePat+isPost+PROBE', u'const E_PAT=[', u'\n\n'),
    ('KMAIN+cls()',             u'const KMAIN=', u'\n// A5 probe'),
    ('CLS_PROBE',               u'const CLS_PROBE=[', u"'none']];\n"),
]
allsame = True
for name, a, b in pairs:
    try:
        x = region(src, a, b); y = region(g200, a, b)
    except ValueError as e:
        sys.stderr.write('SHARED-ORACLE %-24s UNRESOLVED (%s)\n' % (name, e)); allsame = False; continue
    same = (x == y)
    allsame = allsame and same
    sys.stderr.write('SHARED-ORACLE %-24s %s  (g199 %d bytes, g200 %d bytes)\n'
                     % (name, 'IDENTICAL' if same else 'DIFFERS', len(x.encode('utf-8')), len(y.encode('utf-8'))))
sys.stderr.write('SHARED-ORACLE VERDICT: %s\n' % ('all regions byte-identical' if allsame else 'DRIFT PRESENT - this is the finding'))
