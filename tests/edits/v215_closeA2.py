# v215_closeA2.py — V215 close, part A2 (4 edits), tests/gates/g199_deload_arbitration.js. Coach's text.
#   1  the ≤214 DELOAD_HINGE rows (210, and 211 which 212..214 reference) carry E1a 12477 and G1 1350: the
#      values the bare literals held on every artifact from 210 to 214.
#   2  the 215 rows: DELOAD_ARB and E6 UNMOVED (references); DELOAD_HINGE a ruled MOVE with coach's comment.
#   3  E1a reads the era row. HROW / HNOROW are declared one line earlier (they were declared right after
#      E1a); the declarations themselves are unchanged.
#   4  E2 follows E1a: both ends of the __DELOAD_OFF control equal the row's E1a.
# G1 and G2 read the row in part B (the cap is four edits per script).
#   python3 tests/edits/v215_closeA2.py
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g199_deload_arbitration.js'
s = io.open(P, encoding='utf-8').read()
E1A = "  ok(N.postInP1===12477,'E1a posterior items entering the deload == 12,477 across '+D_DAY+' deload day builds (got '+N.postInP1+')');\n"
HDECL = ("  const HROW=DELOAD_HINGE_ROW_FOR(IP.version), HX=DELOAD_HINGE_EXCLUDES_TIER_B(IP.version);\n"
         "  const HNOROW=(HROW?'':' — no DELOAD_HINGE_BY_VERSION row for V'+IP.version);\n")
EDITS = [
 ("DELOAD_HINGE_BY_VERSION[210] = { E1b: 9771, E3: 60, G5: {'Explosive finisher': 60} };\n"
  "DELOAD_HINGE_BY_VERSION[211] = { E1b: 9334, E3: 44, G5: {'Explosive finisher': 44} };   // D155: ruled scope change\n",
  "DELOAD_HINGE_BY_VERSION[210] = { E1b: 9771, E3: 60, G5: {'Explosive finisher': 60}, E1a: 12477, G1: 1350 };\n"
  "DELOAD_HINGE_BY_VERSION[211] = { E1b: 9334, E3: 44, G5: {'Explosive finisher': 44}, E1a: 12477, G1: 1350 };   // D155: ruled scope change. E1a and G1 added at V215 (D149): the bare literals' values on 210 to 214\n"),
 ("DELOAD_HINGE_BY_VERSION[214] = DELOAD_HINGE_BY_VERSION[213];   // D158: ruled UNMOVED, no lift section touched (printed: C1 364 C3 364 C5 32 D2 19 I3 496; E6 28; E1b 9334 E3 44 G5 44)\n",
  "DELOAD_HINGE_BY_VERSION[214] = DELOAD_HINGE_BY_VERSION[213];   // D158: ruled UNMOVED, no lift section touched (printed: C1 364 C3 364 C5 32 D2 19 I3 496; E6 28; E1b 9334 E3 44 G5 44)\n"
  "DELOAD_ARB_BY_VERSION[215] = DELOAD_ARB_BY_VERSION[214];   // D149: ruled UNMOVED (printed: C1 364 C3 364 C5 32 D2 19 I3 496)\n"
  "E6_BY_VERSION[215] = E6_BY_VERSION[214];   // D149: ruled UNMOVED (28 printed)\n"
  "DELOAD_HINGE_BY_VERSION[215] = { E1b: 9319, E3: 44, G5: {'Explosive finisher': 44}, E1a: 12384, G1: 1290 };   // D149: ruled MOVE. Glute-ham raise and 45° back extension are posterior items and leave home_full, so fewer enter the deload (12,477 -> 12,384), fewer leave (9,334 -> 9,319) and fewer Leg isolation blocks drop (1,350 -> 1,290). E1a, G1 and G2 lose their bare literals and read this row; rows <= 214 carry E1a 12477, G1 1350. E2 follows E1a.\n"),
 (E1A + HDECL,
  HDECL + "  ok(!!HROW&&N.postInP1===HROW.E1a,'E1a posterior items entering the deload == '+(HROW?HROW.E1a:'NO ROW')+' (the V'+IP.version+' DELOAD_HINGE_BY_VERSION row) across '+D_DAY+' deload day builds (got '+N.postInP1+')'+HNOROW);\n"),
 ("  ok(F.postInP1===12477&&F.postOutP2===12477,'E2 __DELOAD_OFF control cuts nothing: '",
  "  ok(!!HROW&&F.postInP1===HROW.E1a&&F.postOutP2===HROW.E1a,'E2 __DELOAD_OFF control cuts nothing (both ends == the row\\'s E1a, '+(HROW?HROW.E1a:'NO ROW')+'): '"),
]
for i, (a, b) in enumerate(EDITS, 1):
    c = s.count(a)
    print(f"edit {i} anchor count={c}")
    if c != 1: sys.exit(f"ABORT: anchor {i} count {c}, nothing written")
for a, b in EDITS:
    s = s.replace(a, b, 1)
if s.count('===12477') != 0: sys.exit("ABORT: a bare 12477 literal survives, nothing written")
io.open(P, 'w', encoding='utf-8').write(s)
print('written', P)
