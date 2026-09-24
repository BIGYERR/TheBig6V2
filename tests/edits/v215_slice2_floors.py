# v215_slice2_floors.py — V215 slice 2: D149's two floors (coach). Both are APPEND ONLY WHEN SHORT,
# through one named helper, _floorPool(pool, min, add): a pool with at least `min` names comes back
# as is; a short pool gets exactly one named member appended. Nothing is replaced.
#   (a) knee/protect squat pool: the gear-filtered barbell list gets 'Single-leg glute bridge' only
#       when it holds fewer than 2 names. Behaviour-equal to measure's cfb arm (v215d149/arm_cfb.html).
#       Short on home_full only (barbell, no cables, no GHD station).
#   (b) the hip-extension reservation on knee/protect: when the remainder is empty, append
#       'Bodyweight back extension' instead of letting the slot vanish. Empty on home_full only.
#       The knee/protect lunge literal holds the same name, so _slot's drop still removes it on a
#       same-day collision. Coach: empty is worse than a duplicate drop.
#   python3 tests/edits/v215_slice2_floors.py index.html            (all three edits)
#   python3 tests/edits/v215_slice2_floors.py <copy.html> --a-only  (helper + floor a only; used to
#                                                                   prove behaviour-equality to cfb)
# No ia-version bump (Mario owns it; not in this slice).
import sys
P = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
A_ONLY = '--a-only' in sys.argv[2:]
src = open(P, encoding='utf-8').read()
EDITS = [
 # the named helper, next to the gear gate it floors
 ("  const _gear = pool => (pool||[]).filter(_gearOK);",
  "  const _gear = pool => (pool||[]).filter(_gearOK);\n"
  "  // V215 (D149 floors, coach): APPEND ONLY WHEN SHORT. A pool left with fewer than `min` names\n"
  "  // gets ONE named member appended; a pool that is long enough comes back untouched, so a floor\n"
  "  // can only fire where its list is actually short. Never a fallback to the raw pool (V197 D70b).\n"
  "  const _floorPool = (pool,min,add) => pool.length>=min ? pool : pool.concat([add]);"),
 # floor (a): knee/protect squat pool
 ("        squatPool = hasBarbell?_gear(['Barbell hip thrust','45° back extension','Cable pull-through']):['Banded hip thrust','Single-leg glute bridge','Bodyweight back extension'];",
  "        // V215 (D149 floor a): home_full owns neither the GHD station nor cables, so the gear\n"
  "        // gate leaves this list one name long. A second member is appended only when short.\n"
  "        squatPool = hasBarbell?_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):['Banded hip thrust','Single-leg glute bridge','Bodyweight back extension'];"),
 # floor (b): the hip-extension reservation on knee/protect
 ("      hipExtPool = _left;",
  "      // V215 (D149 floor b): knee/protect no longer empties the reservation. home_full lost\n"
  "      // 45° back extension to the GHD station, which left nothing here and dropped the slot.\n"
  "      // Bodyweight back extension is appended only when the remainder is empty. The lunge\n"
  "      // literal holds it too, so _slot's drop still removes it on a same-day collision.\n"
  "      hipExtPool = (_R==='knee'&&_T==='protect') ? _floorPool(_left,1,'Bodyweight back extension') : _left;"),
]
if A_ONLY:
    EDITS = EDITS[:2]
for i, (a, b) in enumerate(EDITS, 1):
    c = src.count(a)
    print(f"edit {i} anchor count={c}")
    if c != 1:
        sys.exit(f"ABORT: anchor {i} count {c}, nothing written")
for a, b in EDITS:
    src = src.replace(a, b, 1)
open(P, 'w', encoding='utf-8').write(src)
print("written", P, "(a-only)" if A_ONLY else "")
