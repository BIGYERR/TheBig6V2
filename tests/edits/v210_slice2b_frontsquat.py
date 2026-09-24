# v210_slice2b_frontsquat.py — V210 slice 2b (coach re-ruled, Mario informed).
# (1) An advanced 55+ older hypertrophy lifter on crossfit or home_full draws goblet OR front squat,
#     ONCE, for the whole program, through the existing per-program draw (hypertrophy does not
#     rotate: blockSeed returns the seed every week; the lock outranks alternation). Beginner and
#     intermediate stay goblet only; 36 to 54, commercial and every other goal are untouched.
#     Front squat is not in REP_AFFINITY, so _repFit keeps it at hypertrophy reps.
# (2) Front squat is WITHHELD under any shoulder or elbow plan, protect or workaround, every tier:
#     the front rack loads wrist extension, elbow flexion and shoulder rotation at once. Withheld
#     at the DRAW (so the slot draws another squat and nothing is deleted; dropNames alone would
#     drop the item and with it the day's main lift), and by NAME in injuryPlan's existing
#     dropNames, which is what the swap sheet's injury test (_swapInjuryOK) consults.
# Edit 1 inserts a statement after the squat pool and BEFORE the _preInj snapshot, so the injury
# guard never reads the withhold as a redirect. It leaves slice 1's A3 line byte-intact.
#   python3 tests/edits/v210_slice2b_frontsquat.py index.html
# No ia-version bump in this slice.
import sys
P = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
 ("  let rowPool=hasBarbell?EXLIB.back_row:",
  "  // V210 (2b): advanced 55+ older hypertrophy on crossfit or home_full draws goblet OR front\n"
  "  // squat, once, for the whole program (hypertrophy is locked; the lock outranks alternation).\n"
  "  // Under any shoulder or elbow plan the front rack is withheld on every tier: it loads wrist\n"
  "  // extension, elbow flexion and shoulder rotation at once. The goblet stays. Set here, before\n"
  "  // _preInj, so the injury guard does not read the withhold as a redirect.\n"
  "  { const _ip=injuryPlan(cfg), _noRack=!!(_ip&&_ip.tier!=='halfstep'&&(_ip.region==='shoulder'||_ip.region==='elbow'));\n"
  "    if(_noRack) squatPool=squatPool.filter(n=>n!=='Front squat');\n"
  "    else if(olderHyp&&hasBarbell&&!hasCables&&cfg.experience==='advanced'&&cfg.ageBracket==='55+') squatPool=squatPool.concat(['Front squat']); }\n"
  "  let rowPool=hasBarbell?EXLIB.back_row:"),
 ("  return P;\n}\n// Section post-filter — runs AFTER buildSections",
  "  // V210 (2b): the front rack is withheld under every shoulder and elbow plan. The draw never\n"
  "  // deals it (buildProgram's squat pool); this is the name-level net the swap sheet's injury\n"
  "  // test (_swapInjuryOK) reads, and it catches any path that reaches a card without that pool.\n"
  "  if(R==='shoulder'||R==='elbow') P.dropNames=new RegExp((P.dropNames?P.dropNames.source+'|':'')+'^front squat$','i');\n"
  "  return P;\n}\n// Section post-filter — runs AFTER buildSections"),
]
for i, (a, b) in enumerate(EDITS, 1):
    c = src.count(a)
    print(f"edit {i} anchor count={c}")
    if c != 1:
        sys.exit(f"ABORT: anchor {i} count {c}, nothing written")
for a, b in EDITS:
    src = src.replace(a, b, 1)
open(P, 'w', encoding='utf-8').write(src)
print("written", P)
