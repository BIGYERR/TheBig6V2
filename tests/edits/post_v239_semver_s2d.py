#!/usr/bin/env python3
# Post-V239 semver pass, slice 2d: tooling_selftest.sh's version_scope.js base toys (V2 to V5) write CUR in the semver.js
# form (tests only, no build).
# Ruling (main session, slice 2d brief): 1. every base toy that writes the CURRENT version writes it as
# SV.cmp(VER, '$CUR') <op> 0, quoted, requiring SV from the toy tree's tests/semver.js the way G5's toy does, so the line is
# valid JS and read at a legacy CUR (239) and a dotted one (0.239.1). The operator of each line is kept: === and !== stay
# hits, >= stays an ordered compare (not a hit). 2. debt1 ALSO plants the legacy form against a fixed past legacy build,
# VER === 238, so debt1 carries 2 hits: its debt line says 2 and V4's expected line reads 3 hits over a line of 2.
# 3. nothing else changes, bar the header sentence that described the toys' legacy form.
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
TS = 'tests/tooling_selftest.sh'

pairs = [
# header: what the base toys write now
(r"""# era_bump.py's dotted path (Post-V239 semver). The version_scope.js toys' base files (V2 to V5) compare CUR in the legacy
# form (VER === CUR, a bare 3-digit literal), which reads only while CUR is a bare integer; the planted rows (G5, V3, V4)
# plant SV.cmp(VER, 'NEXT') === 0, a dotted NEXT, so version_scope.js's semver path is exercised (post-V239 slice 2c).
""",
r"""# era_bump.py's dotted path (Post-V239 semver). The version_scope.js toys' base files (V2 to V5) compare CUR in the semver
# form (SV.cmp(VER, 'CUR') <op> 0, quoted, so valid JS and read at a legacy or a dotted CUR), and debt1 also keeps one
# legacy hit against a fixed past build (VER === 238); the planted rows (G5, V3, V4) plant SV.cmp(VER, 'NEXT') === 0, a
# dotted NEXT, so version_scope.js's semver path is exercised (post-V239 slices 2c, 2d).
"""),
# V2 base toys: HDR requires SV as G5's toy does; clean, debt1 (plus the fixed legacy hit), debt2; the toy debt file
(r"""HDR="const IA = { version: '$CUR' }, VER = +IA.version;"
printf '%s\nif (VER >= %s) console.log("a minimum, not a hit");\n' "$HDR" "$CUR" > "$VT/gates/clean.js"
printf '%s\nif (VER === %s) console.log("one exact row");\n' "$HDR" "$CUR" > "$VT/gates/debt1.js"
printf '%s\nif (VER === %s) console.log("first exact row");\nif (VER !== %s) console.log("second exact row");\n' "$HDR" "$CUR" "$CUR" > "$VT/gates/debt2.js"
printf '# toy debt file\ndebt1.js 1  # toy: one hit\ndebt2.js 2  # toy: two hits\n' > "$VT/version_scope_debt.txt"
""",
r"""HDR="const path = require('path'), SV = require(path.join(__dirname, '..', 'semver.js'));
const IA = { version: '$CUR' }, VER = SV.parse(IA.version);"
printf "%s\nif (SV.cmp(VER, '%s') >= 0) console.log(\"a minimum, not a hit\");\n" "$HDR" "$CUR" > "$VT/gates/clean.js"
printf "%s\nif (SV.cmp(VER, '%s') === 0) console.log(\"one exact row, the semver form\");\nif (VER === 238) console.log(\"one exact row, the legacy form against a fixed past build\");\n" "$HDR" "$CUR" > "$VT/gates/debt1.js"
printf "%s\nif (SV.cmp(VER, '%s') === 0) console.log(\"first exact row\");\nif (SV.cmp(VER, '%s') !== 0) console.log(\"second exact row\");\n" "$HDR" "$CUR" "$CUR" > "$VT/gates/debt2.js"
printf '# toy debt file\ndebt1.js 2  # toy: two hits, the semver form and the legacy form\ndebt2.js 2  # toy: two hits\n' > "$VT/version_scope_debt.txt"
"""),
# V4: debt1 now carries 2, so the planted row makes 3 over a line of 2
(r"""row "V4 one hit over a debt count is red by name" 'rc_is "$W/v_over.out" 1 && has "$W/v_over.out" "^FAIL new exact-version row: debt1\.js has 2 exact-version hits, its debt line says 1" && hasX "$W/v_over.out" "PASS 2 FAIL 1"' "$W/v_over.out"
""",
r"""row "V4 one hit over a debt count is red by name" 'rc_is "$W/v_over.out" 1 && has "$W/v_over.out" "^FAIL new exact-version row: debt1\.js has 3 exact-version hits, its debt line says 2" && hasX "$W/v_over.out" "PASS 2 FAIL 1"' "$W/v_over.out"
"""),
# V5: debt2 rewritten with one exact row and one minimum
(r"""printf '%s\nif (VER === %s) console.log("first exact row");\nif (VER >= %s) console.log("now a minimum");\n' "$HDR" "$CUR" "$CUR" > "$VT/gates/debt2.js"
""",
r"""printf "%s\nif (SV.cmp(VER, '%s') === 0) console.log(\"first exact row\");\nif (SV.cmp(VER, '%s') >= 0) console.log(\"now a minimum\");\n" "$HDR" "$CUR" "$CUR" > "$VT/gates/debt2.js"
"""),
]

p = ROOT / TS
s = p.read_text(encoding='utf-8')
for i, (old, new) in enumerate(pairs):
    n = s.count(old)
    if n != 1:
        sys.exit('ABORT %s anchor %d: count %d, want 1:\n%s' % (TS, i + 1, n, old))
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('post_v239_semver_s2d: %s %d hunks' % (TS, len(pairs)))
