# v215_closeC_ledger.py — V215 close, part C (2 edits, tests only). g193_pool_overlay's NAMED DEBT after D149.
# D149-D4b wrote hip/protect's hipExtPool as hasGHD?['45° back extension']:['Bodyweight back extension'].
# The branch's own applyInjuryFilter still removes both names ("hinge/lunge/hip-extension sit out"), so
# the pool is as vestigial as before (coach queued removing the assignment; not done here). The new name
# is a new same-lens trip, and it only exists from 215.
#   1  g193_pool_overlay.js: a ledger line may open with an ia-version predicate ('>=N ' or '<=N ').
#      A line whose predicate does not hold for the artifact is not listed for it, so it neither excuses
#      a trip nor fails as stale there (standing ruling 4: the entry is keyed to the build that creates it).
#   2  g193_pool_overlay_debt.txt: '>=215 same-lens hip/protect hipExtPool Bodyweight back extension',
#      and the same-lens count reads 3 through V214, 4 from V215.
# The thin-pool line for hip/protect hipExtPool is KEPT: the pool is still one member on every tier.
# It read as stale only because the gate's hand gear table had no hasGHD, so the expression went
# unresolved; v215_closeC2_gear.py adds hasGHD to that table, as the gate's own header prescribes.
#   python3 tests/edits/v215_closeC_ledger.py
import io, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'
EDITS = [
 ('g193_pool_overlay.js',
  "const DEBT = fs.readFileSync(DEBT_FILE, 'utf8').split('\\n')\n"
  "  .map(l => l.trim()).filter(l => l && l[0] !== '#');\n",
  "// V215: a line may open with an ia-version predicate, '>=N ' or '<=N ' (standing ruling 4: an entry is\n"
  "// keyed to the build whose code creates the trip). A line whose predicate does not hold for this\n"
  "// artifact is not listed for it, so it can neither excuse a trip nor fail as stale on it.\n"
  "const DEBT = fs.readFileSync(DEBT_FILE, 'utf8').split('\\n')\n"
  "  .map(l => l.trim()).filter(l => l && l[0] !== '#')\n"
  "  .map(l => { const m = l.match(/^(>=|<=)(\\d+)\\s+(.*)$/); if (!m) return l;\n"
  "    const v = +IA.version, n = +m[2]; return (m[1] === '>=' ? v >= n : v <= n) ? m[3] : null; })\n"
  "  .filter(Boolean);\n"),
 ('g193_pool_overlay_debt.txt',
  "# vestigial, not wrong. Count: 3. Triage: delete the two assignments, or keep them and say\n"
  "# in the comment that they exist only to be filtered.\n"
  "same-lens hip/protect hingePool Bodyweight back extension\n"
  "same-lens hip/protect hingePool Barbell Romanian deadlift\n"
  "same-lens hip/protect hipExtPool 45° back extension\n",
  "# vestigial, not wrong. Count: 3 through V214, 4 from V215. Triage: delete the two assignments,\n"
  "# or keep them and say in the comment that they exist only to be filtered.\n"
  "# V215 (D149-D4b): hipExtPool reads the GHD station, hasGHD?['45° back extension']:['Bodyweight back\n"
  "# extension']. The plan removes both names, so the second is a new same-lens trip from 215. The pool is\n"
  "# still one member on every tier, so its thin-pool line below stays live. Removing the vestigial\n"
  "# assignment is an engine change, queued for coach.\n"
  "same-lens hip/protect hingePool Bodyweight back extension\n"
  "same-lens hip/protect hingePool Barbell Romanian deadlift\n"
  "same-lens hip/protect hipExtPool 45° back extension\n"
  ">=215 same-lens hip/protect hipExtPool Bodyweight back extension\n"),
]
src = {}
for f, a, b in EDITS:
    if f not in src: src[f] = io.open(ROOT + f, encoding='utf-8').read()
    c = src[f].count(a)
    print(f"{f}: anchor count={c}")
    if c != 1: sys.exit(f"ABORT: {f} anchor count {c}, nothing written")
for f, a, b in EDITS:
    src[f] = src[f].replace(a, b, 1)
for f in src:
    io.open(ROOT + f, 'w', encoding='utf-8').write(src[f])
    print('written', f)
