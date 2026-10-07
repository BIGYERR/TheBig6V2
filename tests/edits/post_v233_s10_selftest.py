#!/usr/bin/env python3
# post_v233_s10_selftest.py: Post-V233 tooling pass, slice 10. TESTS ONLY.
#
# WHY (the brief): every tool in the post-V233 tooling pass was proven only by builder scratch scripts that die with
# their chat (builder_s1 .. builder_s8: prove.sh, proof_mech.sh, proof_light.py, proof_sab.py, toyA/, synth.js). A
# tool with no committed test is undefended: the next edit to gate.sh could quietly bring back stop-at-first-red.
#
# index.html is NOT touched and ia-version stays 233: no version bump, so no meta replacement to put last.
#
# Diff classes:
#   (T-t) NEW tests/tooling_selftest.sh: `bash tests/tooling_selftest.sh <scratch-dir> [tools-dir]` rebuilds the
#         builders' proofs of gate.sh, version_scope.js, era_bump.py, sabotage.py and chain.js as named rows on toy
#         trees, a scratch git tree and a scratch clone under <scratch-dir>, and prints `PASS n FAIL n`.
#   (T-u) tests/gates/g230_d194_lens2.js: the V229 baseline temp path in its LIVE line printed the per-process path
#         (os.tmpdir() + a pid), the one non-clock line that differs run to run (slice 8). It now prints a fixed label;
#         the file it writes, reads and unlinks is unchanged. Nothing else in g230 changes.
#
# The new file is checked absent and every anchor is asserted count==1 before ANY file is written; the script aborts
# on the first miss.
import sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)

NEW = {}
EDITS = []

# ---- (T-t) new file --------------------------------------------------------------------------------------------------
NEW[P('tests', 'tooling_selftest.sh')] = r'''#!/usr/bin/env bash
# tooling_selftest.sh: the committed proof of the post-V233 proof-scope tooling (post-V233 slice 10).
#
#   bash tests/tooling_selftest.sh <scratch-dir> [tools-dir]
#
# The tools of the post-V233 tooling pass (tests/gate.sh, version_scope.js, era_bump.py, sabotage.py, chain.js) were
# proven only by builder scratch scripts that died with their chat. This file rebuilds those proofs as named rows, so an
# edit that quietly undoes a ruled behaviour (gate.sh back to stop-at-first-red, say) turns a row red. Every expected
# value is typed here from the ruling, the documented list or a hand table; none is read back from the tool under test.
#
# <scratch-dir> must exist and must not be inside the repo. Everything the self-test makes (toy trees, a git clone,
# fixtures, TMPDIR) goes under a fresh <scratch-dir>/selftest.XXXXXX, kept for inspection. Nothing under the repo is
# written: row X1 proves it (the repo's file list is the same at the end as at the start, and no file under it is newer
# than the run's start marker; .git and .claude aside), so run the self-test alone, not beside a gate.sh run (that one
# writes .last_diff.txt).
# [tools-dir] (default: the directory this file sits in) holds the five tools under test. Point it at a copy with one
# tool sabotaged and that tool's rows go red. Everything else (index.html, harness.js, lint_allow.txt, the gates, the
# sabotage specs and lists, the tags V232 and V233, the reach map at HEAD) comes from the repo.
# No real gate runs: gate.sh grades toy gates (it still boots index.html at step 3), sabotage.py trips a toy gate.
# Rows scoped to a version read today's ia-version from index.html (CUR) and bump to CUR+1, never a typed version.
# Prints one row per claim, then `PASS n FAIL n`; a missing summary is a crash. Exit 0 only on FAIL 0, 2 on a refusal.
set -eo pipefail

usage() { echo "usage: bash tests/tooling_selftest.sh <scratch-dir> [tools-dir]"; }
if [ -z "${1:-}" ]; then usage; echo "REFUSED: no scratch dir: the self-test writes only under the dir it is given"; exit 2; fi
if [ ! -d "$1" ]; then usage; echo "REFUSED: scratch dir $1 does not exist"; exit 2; fi
HERE="$(cd "$(dirname "$0")" && pwd -P)"
R="$(cd "$HERE/.." && pwd -P)"
SCR="$(cd "$1" && pwd -P)"
case "$SCR/" in "$R/"*) usage; echo "REFUSED: scratch dir $SCR is inside the repo $R"; exit 2 ;; esac
TA="${2:-$HERE}"
if [ ! -d "$TA" ]; then usage; echo "REFUSED: tools dir $TA does not exist"; exit 2; fi
T="$(cd "$TA" && pwd -P)"
for f in gate.sh version_scope.js era_bump.py sabotage.py chain.js; do
  if [ ! -f "$T/$f" ]; then usage; echo "REFUSED: tools dir $T has no $f"; exit 2; fi
done

T0="$(date +%s)"
W="$(mktemp -d "$SCR/selftest.XXXXXX")"
mkdir -p "$W/tmp"
export TMPDIR="$W/tmp" PYTHONDONTWRITEBYTECODE=1
touch "$W/.start"
# X1's record of the repo: every file path (.git, .claude and Finder's .DS_Store aside). Files only: a directory's
# mtime here is restamped by an agent outside the self-test seconds after any write into it (seen in s10, whole-second
# stamps on the repo root, tests and tests/edits only), so a directory is no evidence either way.
repo_files() { find "$R" \( -path "$R/.git" -o -path "$R/.claude" \) -prune -o -type f ! -name .DS_Store -print | LC_ALL=C sort > "$1"; }
repo_files "$W/repo_files.before"
CUR="$(grep -oE '<meta name="ia-version" content="[0-9]+"' "$R/index.html" | grep -oE '[0-9]+' | tail -1 || true)"
if [ -z "$CUR" ]; then echo "setup: index.html carries no ia-version meta (crash)"; exit 1; fi
NEXT=$((CUR + 1))
echo "tooling self-test: tools $T"
echo "   repo $R, today's ia-version $CUR (era rows bump to $NEXT), run dir $W"

# ---- row helpers ---------------------------------------------------------------------------------------------------
P=0; F=0
row() { # row <name> <condition, eval'd> [file to point at on a FAIL]
  if eval "$2"; then P=$((P + 1)); echo "  ok    $1"
  else F=$((F + 1)); echo "FAIL  $1"; if [ -n "${3:-}" ]; then echo "        see $3"; fi; fi
}
run() { # run <out> <cmd...>: output and exit code captured, never fatal
  local out="$1" rc=0; shift
  "$@" > "$out" 2>&1 || rc=$?
  echo "$rc" > "$out.rc"
}
rc_is() { [ "$(cat "$1.rc")" = "$2" ]; }
has() { grep -qE -- "$2" "$1"; }      # a line matches the ERE
hasF() { grep -qF -- "$2" "$1"; }     # a line holds the fixed string
hasX() { grep -qxF -- "$2" "$1"; }    # a whole line equals the string
lacks() { ! grep -qE -- "$2" "$1"; }
words() { tr '\n' ' ' < "$1" | sed 's/ *$//'; }

# ---- oracle helpers (python, independent of the tools under test) -------------------------------------------------
cat > "$W/oracle.py" <<'PY'
import glob, json, os, re, sys

def known(path):
    """The documented-list format (`<spec>.json <mutation name>  # reason`): [(spec, name)] in file order."""
    out = []
    for raw in open(path, encoding='utf-8').read().split('\n'):
        l = raw.rstrip()
        if not l.strip() or l.lstrip().startswith('#'):
            continue
        sp, _, rest = l.partition(' ')
        out.append((sp, rest.partition('  # ')[0]))
    return out

def put(path, text):
    open(path, 'w', encoding='utf-8').write(text)

cmd, a = sys.argv[1], sys.argv[2:]
if cmd == 'anchors-exact':      # <out> <known>: the documented NOT-APPLIED lines are exactly the list, nothing else red
    out = open(a[0], encoding='utf-8').read().split('\n'); K = known(a[1])
    doc = [l for l in out if l.startswith('NOT-APPLIED  documented    ')]
    red = [l for l in out if l.startswith(('NOT-APPLIED  UNDOCUMENTED', 'STALE', 'CRASH', 'FAIL'))]
    each = all(any(l.startswith('NOT-APPLIED  documented    %s  %s  (' % k) for l in doc) for k in K)
    summ = any(re.fullmatch(r'ANCHORS \d+ checked, %d not-applied \(%d documented\)' % (len(K), len(K)), l) for l in out)
    sys.exit(0 if K and len(doc) == len(K) and each and summ and not red else 1)
if cmd == 'pick-live':          # <cand> <specdir> <known> <edited cand out> <spec out> <name out>
    src = open(a[0], encoding='utf-8').read(); K = set(known(a[2]))
    for p in sorted(glob.glob(os.path.join(a[1], '*.json'))):
        sp = os.path.basename(p)
        try:
            muts = json.load(open(p, encoding='utf-8'))
        except Exception:
            continue
        for m in (muts if isinstance(muts, list) else []):
            if not isinstance(m, dict) or not all(isinstance(m.get(f), str) for f in ('name', 'anchor', 'replacement', 'gate')):
                continue
            an = m['anchor']
            if len(an) < 2 or '\n' in m['name'] or (sp, m['name']) in K or src.count(an) != 1 or src.replace(an, m['replacement']) == src:
                continue
            mid = len(an) // 2
            bad = src.replace(an, an[:mid] + 'QSELFTEST' + an[mid:])
            if bad.count(an) != 0:
                continue
            put(a[3], bad); put(a[4], sp); put(a[5], m['name'])
            sys.exit(0)
    sys.exit(1)
if cmd == 'drop-first':         # <known> <list out> <spec out> <name out>: the list minus its first entry
    lines = open(a[0], encoding='utf-8').read().split('\n')
    k = next(i for i, l in enumerate(lines) if l.strip() and not l.lstrip().startswith('#'))
    sp, _, rest = lines[k].rstrip().partition(' ')
    put(a[1], '\n'.join(lines[:k] + lines[k + 1:])); put(a[2], sp); put(a[3], rest.partition('  # ')[0])
    sys.exit(0)
if cmd == 'toy-spec':           # <gate> <spec out>
    t = lambda n, an, rp: {'name': n, 'anchor': an, 'replacement': rp, 'gate': a[0]}
    put(a[1], json.dumps([t('T1 -> alpha breaks, the toy gate trips', 'alpha', 'BROKEN alpha'),
                          t('T2 -> beta is renamed, the toy gate cannot see it', 'beta', 'beta2'),
                          t('T3 -> delta is gone from the toy candidate, so this never applies', 'delta', 'delta2')], indent=1))
    sys.exit(0)
if cmd == 'chain-cands':        # <V233 html> <getPrograms cand out> <const cand out> <const line out>
    s = open(a[0], encoding='utf-8').read()
    g = list(re.finditer(r'^function getPrograms\([^)]*\)\s*\{', s, re.M))
    c = list(re.finditer(r'^const ([A-Z_][A-Z0-9_]*)\s*=\s*(\d+)\s*;', s, re.M))
    if len(g) != 1 or not c:
        print('chain-cands: getPrograms count %d, numeric top-level consts %d' % (len(g), len(c))); sys.exit(1)
    put(a[1], s[:g[0].end()] + 'var _chainProbe=0;' + s[g[0].end():])
    x = c[0]; v = str(int(x.group(2)) + 1)
    put(a[2], s[:x.start(2)] + v + s[x.end(2):]); put(a[3], s[x.start():x.start(2)] + v + s[x.end(2):x.end()])
    sys.exit(0)
sys.exit(2)
PY
oracle() { python3 "$W/oracle.py" "$@"; }

# =====================================================================================================================
echo "== gate.sh: toy gates on index.html (every red graded, GATES RED k of m, step 5, start order, GATE_TIMES_OUT)"
# The start order is read off xargs's own input: a shim first on PATH copies the list gate.sh feeds xargs (xargs starts
# its jobs in input order) and then execs the real xargs with the same arguments and the same input.
REAL_XARGS="$(command -v xargs)"
mkdir -p "$W/shim"
cat > "$W/shim/xargs" <<'SHIM'
#!/usr/bin/env bash
set -eo pipefail
cat > "$SELFTEST_XARGS_LOG.raw"
tr '\0' '\n' < "$SELFTEST_XARGS_LOG.raw" | sed 's#.*/##' > "$SELFTEST_XARGS_LOG"
exec "$SELFTEST_REAL_XARGS" "$@" < "$SELFTEST_XARGS_LOG.raw"
SHIM
chmod +x "$W/shim/xargs"
mk_gate_tree() { # <root>: gate.sh and version_scope.js under test, the repo's harness and lint list, an empty toy debt file
  mkdir -p "$1/tests/gates"
  cp "$T/gate.sh" "$T/version_scope.js" "$1/tests/"
  cp "$R/tests/harness.js" "$1/tests/"
  if [ -f "$R/tests/lint_allow.txt" ]; then cp "$R/tests/lint_allow.txt" "$1/tests/"; fi
  printf '# toy debt file: no toy gate carries debt\n' > "$1/tests/version_scope_debt.txt"
}
gate_run() { # <out> <start log> <gate.sh> <args...>
  local out="$1" log="$2"; shift 2
  run "$out" env PATH="$W/shim:$PATH" SELFTEST_XARGS_LOG="$log" SELFTEST_REAL_XARGS="$REAL_XARGS" GATE_TIMES_OUT="$out.times" bash "$@"
}
grade_order() { sed -nE 's/^   ([a-z]_[a-z]+\.js): PASS .*/\1/p; s/^FAIL: ([a-z]_[a-z]+\.js) printed .*/\1/p' "$1" | tr '\n' ' ' | sed 's/ *$//'; }
times_ok() { # <file>: gate.sh's header, then one `<gate> <seconds>` line per toy gate, in glob order
  head -1 "$1" | grep -q '^# gate.sh measured wall seconds per gate' || return 1
  [ "$(grep -v '^#' "$1" | awk '{print $1}' | tr '\n' ' ' | sed 's/ *$//')" = "a_pass.js b_fail.js c_crash.js d_refused.js e_pass.js" ] || return 1
  [ "$(grep -cE '^[a-z]_[a-z]+\.js [0-9]+(\.[0-9]+)?$' "$1" || true)" = 5 ]
}
GA="$W/gate_mixed"; mk_gate_tree "$GA"
printf "console.log('PASS 1 FAIL 0');\n" > "$GA/tests/gates/a_pass.js"
printf "console.log('  FAIL toy b row, red on purpose');\nconsole.log('PASS 0 FAIL 1');\n" > "$GA/tests/gates/b_fail.js"
printf "console.log('toy c starts');\nthrow new Error('toy c crashes before its summary');\n" > "$GA/tests/gates/c_crash.js"
printf "console.log('REFUSED toy d row: it could not be put');\nconsole.log('PASS 1 FAIL 0');\n" > "$GA/tests/gates/d_refused.js"
printf "const IA = { version: '%s' }, VER = +IA.version;\nif (VER === %s) console.log('planted exact-version row');\nconsole.log('PASS 2 FAIL 0');\n" "$CUR" "$NEXT" > "$GA/tests/gates/e_pass.js"
printf '# toy start times: e_pass.js is left out, so its cost is unknown and it starts first\na_pass.js 1.0\nb_fail.js 3.0\nc_crash.js 2.0\nd_refused.js 5.0\n' > "$GA/tests/gate_times.txt"
{ cat "$R/index.html"; printf '\n<!-- tooling self-test baseline: two lines apart from the candidate -->\n'; } > "$W/base.html"
gate_run "$W/g_mixed.out" "$W/g_mixed.start" "$GA/tests/gate.sh" "$R/index.html" "$W/base.html"
O="$W/g_mixed.out"
row "G1 gate.sh, mixed toy set (pass, FAIL, crash, REFUSED, pass with a planted row): exit 1" 'rc_is "$O" 1' "$O"
row "G2 the FAIL gate is graded with its detail" 'has "$O" "^   b_fail\.js: PASS 0 FAIL 1  " && hasX "$O" "  FAIL toy b row, red on purpose"' "$O"
row "G3 the crash after it (no summary) is graded and named" 'has "$O" "^FAIL: c_crash\.js printed no PASS/FAIL summary \(crash\?\)"' "$O"
row "G4 the REFUSED gate after that is graded red (blocking)" 'has "$O" "^   d_refused\.js: PASS 1 FAIL 0  .*REFUSED \(blocking\)$" && has "$O" "^FAIL: d_refused\.js REFUSED an assertion"' "$O"
row "G5 step 2b: the planted exact-version row is red by name" 'hasX "$O" "FAIL: version_scope.js: PASS 4 FAIL 1 (exit 1)" && has "$O" "^FAIL new exact-version row: e_pass\.js has 1 exact-version hit and no debt line"' "$O"
row "G6 every red is listed once: GATES RED 4 of 6 with the four names" 'hasX "$O" "GATES RED 4 of 6: version_scope.js b_fail.js c_crash.js d_refused.js"' "$O"
row "G7 step 5 runs after the reds (blast-radius diff written)" 'hasX "$O" "== 5. blast-radius diff vs base.html" && has "$O" "^   [0-9]+ hunks, \+[0-9]+/-[0-9]+ lines" && [ -s "$GA/.last_diff.txt" ]' "$O"
row "G8 no ALL GATES PASS on a red run" 'lacks "$O" "^ALL GATES PASS"' "$O"
row "G9 start order: the unknown gate first, then longest first (e d b c a)" '[ "$(words "$W/g_mixed.start")" = "e_pass.js d_refused.js b_fail.js c_crash.js a_pass.js" ] && hasF "$O" "not in the file, started first: e_pass.js"' "$W/g_mixed.start"
row "G10 grade order is glob order (a b c d e)" '[ "$(grade_order "$O")" = "a_pass.js b_fail.js c_crash.js d_refused.js e_pass.js" ]' "$O"
row "G11 GATE_TIMES_OUT written: header, then the five gates in glob order with seconds" 'times_ok "$O.times"' "$O.times"
GB="$W/gate_allpass"; mk_gate_tree "$GB"
for k in a b c; do printf "console.log('PASS 1 FAIL 0');\n" > "$GB/tests/gates/${k}_ok.js"; done
gate_run "$W/g_allpass.out" "$W/g_allpass.start" "$GB/tests/gate.sh" "$R/index.html"
O="$W/g_allpass.out"
row "G12 all-pass toy set: ALL GATES PASS, exit 0, no GATES RED line" 'rc_is "$O" 0 && hasX "$O" "ALL GATES PASS" && lacks "$O" "^GATES RED"' "$O"
row "G13 no gate_times.txt: every gate is unknown and starts in glob order" '[ "$(words "$W/g_allpass.start")" = "a_ok.js b_ok.js c_ok.js" ] && hasF "$O" "no tests/gate_times.txt: every gate is unknown"' "$O"

# =====================================================================================================================
echo "== version_scope.js: the repo tree, then a toy tree (planted row, over a debt count, stale debt)"
VR="$W/vs_repo/tests"; mkdir -p "$VR"
cp -R "$R/tests/gates" "$VR/gates"; cp "$T/version_scope.js" "$VR/"; cp "$R/tests/version_scope_debt.txt" "$VR/"
NG="$(ls "$VR/gates" | grep -c '\.js$' || true)"
run "$W/v_repo.out" node "$VR/version_scope.js"
row "V1 the repo's gates against the repo's debt file: PASS $NG FAIL 0 (one row per gate)" 'rc_is "$W/v_repo.out" 0 && hasX "$W/v_repo.out" "PASS $NG FAIL 0"' "$W/v_repo.out"
VT="$W/vs_toy/tests"; mkdir -p "$VT/gates" "$W/vs_toy/orig"; cp "$T/version_scope.js" "$VT/"
HDR="const IA = { version: '$CUR' }, VER = +IA.version;"
printf '%s\nif (VER >= %s) console.log("a minimum, not a hit");\n' "$HDR" "$CUR" > "$VT/gates/clean.js"
printf '%s\nif (VER === %s) console.log("one exact row");\n' "$HDR" "$CUR" > "$VT/gates/debt1.js"
printf '%s\nif (VER === %s) console.log("first exact row");\nif (VER !== %s) console.log("second exact row");\n' "$HDR" "$CUR" "$NEXT" > "$VT/gates/debt2.js"
printf '# toy debt file\ndebt1.js 1  # toy: one hit\ndebt2.js 2  # toy: two hits\n' > "$VT/version_scope_debt.txt"
cp "$VT/gates/"*.js "$W/vs_toy/orig/"
run "$W/v_toy.out" node "$VT/version_scope.js"
row "V2 toy tree at its debt (one clean gate, two at their counts): PASS 3 FAIL 0" 'rc_is "$W/v_toy.out" 0 && hasX "$W/v_toy.out" "PASS 3 FAIL 0"' "$W/v_toy.out"
printf 'if (VER === %s) console.log("planted");\n' "$NEXT" >> "$VT/gates/clean.js"
run "$W/v_plant.out" node "$VT/version_scope.js"; cp "$W/vs_toy/orig/clean.js" "$VT/gates/"
row "V3 a row planted in the clean gate is a new exact-version row, red by name" 'rc_is "$W/v_plant.out" 1 && has "$W/v_plant.out" "^FAIL new exact-version row: clean\.js has 1 exact-version hit and no debt line" && hasX "$W/v_plant.out" "PASS 2 FAIL 1"' "$W/v_plant.out"
printf 'if (VER === %s) console.log("planted");\n' "$NEXT" >> "$VT/gates/debt1.js"
run "$W/v_over.out" node "$VT/version_scope.js"; cp "$W/vs_toy/orig/debt1.js" "$VT/gates/"
row "V4 one hit over a debt count is red by name" 'rc_is "$W/v_over.out" 1 && has "$W/v_over.out" "^FAIL new exact-version row: debt1\.js has 2 exact-version hits, its debt line says 1" && hasX "$W/v_over.out" "PASS 2 FAIL 1"' "$W/v_over.out"
printf '%s\nif (VER === %s) console.log("first exact row");\nif (VER >= %s) console.log("now a minimum");\n' "$HDR" "$CUR" "$NEXT" > "$VT/gates/debt2.js"
run "$W/v_stale.out" node "$VT/version_scope.js"; cp "$W/vs_toy/orig/debt2.js" "$VT/gates/"
row "V5 one hit removed under a debt line is stale debt, red by name" 'rc_is "$W/v_stale.out" 1 && hasX "$W/v_stale.out" "FAIL stale debt: debt2.js now 1, lower the line" && hasX "$W/v_stale.out" "PASS 2 FAIL 1"' "$W/v_stale.out"

# =====================================================================================================================
echo "== era_bump.py: a scratch git tree of tests/harness.js + tests/gates (V$CUR rows present, V$NEXT written)"
# The 11 row-per-version tables (measure mT section 1; CLAUDE.md Proof scope, Era rows). A table added or retired is a
# ruling, and this list moves with it.
TABLES='tests/harness.js MANNY_DIGEST_BY_VERSION
tests/harness.js MANNY_DELOAD_OFF_DIGEST_BY_VERSION
tests/harness.js MANNY_CORE_OFF_DIGEST_BY_VERSION
tests/gates/g193_samecard.js OPEN_UNRULED_BY_VERSION
tests/gates/g197b_sweep.js HF_LEAK_BY_VERSION
tests/gates/g197b_sweep.js B5C_BY_VERSION
tests/gates/g199_deload_arbitration.js DELOAD_ARB_BY_VERSION
tests/gates/g199_deload_arbitration.js E6_BY_VERSION
tests/gates/g199_deload_arbitration.js DELOAD_HINGE_BY_VERSION
tests/gates/g200_pull_arbitration.js SWAP_BY_VERSION
tests/gates/g219_samecard_draws.js ERA'
ER="$W/era"; mkdir -p "$ER/tests"
cp -R "$R/tests/gates" "$ER/tests/gates"; cp "$R/tests/harness.js" "$ER/tests/"; cp "$T/era_bump.py" "$ER/tests/"
gitc() { git -c user.name=selftest -c user.email=selftest@invalid -c commit.gpgsign=false -c core.hooksPath=/dev/null -c init.defaultBranch=main "$@"; }
gitc -C "$ER" init -q; gitc -C "$ER" add -A; gitc -C "$ER" commit -q -m "tooling self-test: the tree before the era bump"
printf 'tooling self-test scratch ruling: V%s moves no table\n' "$NEXT" > "$W/ruling.md"
EB="$ER/tests/era_bump.py"
every_table() { # <file> <ERE with @F (file) @S (table)>: a line matches it for each of the 11 tables
  local f s pat
  while read -r f s; do
    pat="$(printf '%s' "$2" | sed -e "s#@F#$f#g" -e "s#@S#$s#g")"
    has "$1" "$pat" || return 1
  done <<EOF
$TABLES
EOF
}
tree_clean() { [ -z "$(git -C "$ER" status --porcelain)" ]; }
added_is() { [ "$(git -C "$ER" diff --numstat | awk '{a += $1; d += $2} END {print a + 0 " " d + 0}')" = "$1 0" ]; }
run "$W/e_check.out" python3 "$EB" --check "$CUR"
row "E1 --check $CUR: all 11 tables present, 0 unregistered, exit 0" 'rc_is "$W/e_check.out" 0 && every_table "$W/e_check.out" "^present +@F +@S\[$CUR\] line [0-9]+$" && hasX "$W/e_check.out" "era_bump --check $CUR: 11 present, 0 missing or duplicate, 0 unregistered"' "$W/e_check.out"
run "$W/e_dry.out" python3 "$EB" "$NEXT" --ruling "$W/ruling.md" --dry-run
row "E2 $NEXT --dry-run: 11 rows planned, nothing written" 'rc_is "$W/e_dry.out" 0 && hasX "$W/e_dry.out" "era_bump V$NEXT: DRY RUN, 11 row(s) in 6 file(s) would be written; 0 moved; nothing written" && every_table "$W/e_dry.out" "^WOULD +@F +@S\[$NEXT\] = @S\[$CUR\]  after line [0-9]+$" && tree_clean' "$W/e_dry.out"
run "$W/e_moved.out" python3 "$EB" "$NEXT" --ruling "$W/ruling.md" --moved MANNY_DIGEST_BY_VERSION
git -C "$ER" diff > "$W/e_moved.diff"
row "E3 $NEXT --moved MANNY_DIGEST_BY_VERSION: writes 10, the moved table is left to builder" 'rc_is "$W/e_moved.out" 0 && hasX "$W/e_moved.out" "era_bump V$NEXT: wrote 10 row(s) in 6 file(s); 1 moved (ruling $W/ruling.md)" && has "$W/e_moved.out" "^MOVED +tests/harness\.js +MANNY_DIGEST_BY_VERSION\[$NEXT\]: not written" && added_is 10 && lacks "$W/e_moved.diff" "MANNY_DIGEST_BY_VERSION\[$NEXT\]"' "$W/e_moved.out"
git -C "$ER" checkout -q -- .
run "$W/e_bump.out" python3 "$EB" "$NEXT" --ruling "$W/ruling.md"
git -C "$ER" diff -U0 > "$W/e_bump.diff"
row "E4 $NEXT: writes 11 rows, each [$NEXT] = [$CUR] in its own file, nothing removed" 'rc_is "$W/e_bump.out" 0 && hasX "$W/e_bump.out" "era_bump V$NEXT: wrote 11 row(s) in 6 file(s); 0 moved (ruling $W/ruling.md)" && added_is 11 && every_table "$W/e_bump.diff" "^\+[[:space:]]*@S\[$NEXT\] = @S\[$CUR\];   // era_bump V$NEXT: ruled UNMOVED, reference to \[$CUR\]; "' "$W/e_bump.out"
run "$W/e_check2.out" python3 "$EB" --check "$NEXT"
row "E5 the bumped tree reads --check $NEXT: 11 present, exit 0" 'rc_is "$W/e_check2.out" 0 && hasX "$W/e_check2.out" "era_bump --check $NEXT: 11 present, 0 missing or duplicate, 0 unregistered"' "$W/e_check2.out"
D0="$(git -C "$ER" diff | shasum)"
run "$W/e_rerun.out" python3 "$EB" "$NEXT" --ruling "$W/ruling.md"
row "E6 a second $NEXT run refuses every table and writes nothing (exit 2)" 'rc_is "$W/e_rerun.out" 2 && hasX "$W/e_rerun.out" "era_bump V$NEXT: REFUSED, 11 refusal(s); no file written" && [ "$(grep -c "already exists" "$W/e_rerun.out" || true)" = 11 ] && [ "$(git -C "$ER" diff | shasum)" = "$D0" ]' "$W/e_rerun.out"
run "$W/e_eod.out" python3 "$EB" --era-only-diff HEAD
row "E7 --era-only-diff HEAD after the bump: 6 era-only, 0 edited" 'rc_is "$W/e_eod.out" 0 && hasX "$W/e_eod.out" "era_bump --era-only-diff HEAD: 6 era-only, 0 edited"' "$W/e_eod.out"
printf '// a non-era line, tooling self-test\n' >> "$ER/tests/gates/g219_samecard_draws.js"
run "$W/e_eod2.out" python3 "$EB" --era-only-diff HEAD
row "E8 one non-era line flips that gate to edited" 'rc_is "$W/e_eod2.out" 0 && has "$W/e_eod2.out" "^edited +tests/gates/g219_samecard_draws\.js +\(non-era line at [0-9]+\)$" && hasX "$W/e_eod2.out" "era_bump --era-only-diff HEAD: 5 era-only, 1 edited"' "$W/e_eod2.out"

# =====================================================================================================================
echo "== sabotage.py: --anchors-only on index.html, then the survivors list on a toy spec and toy gate"
SB="$W/sab/tests"; mkdir -p "$SB"
cp "$T/sabotage.py" "$SB/"; cp -R "$R/tests/sabotage" "$SB/sabotage"
SAB="$SB/sabotage.py"; KN="$SB/sabotage/known_not_applied.txt"
run "$W/s_anchors.out" python3 "$SAB" --anchors-only "$R/index.html"
row "S1 --anchors-only index.html: exit 0, the NOT-APPLIED are exactly the documented list" 'rc_is "$W/s_anchors.out" 0 && oracle anchors-exact "$W/s_anchors.out" "$KN"' "$W/s_anchors.out"
oracle pick-live "$R/index.html" "$SB/sabotage" "$KN" "$W/cand_anchor_edited.html" "$W/live.spec" "$W/live.name"
LSP="$(cat "$W/live.spec")"; LNM="$(cat "$W/live.name")"
run "$W/s_edited.out" python3 "$SAB" --anchors-only "$W/cand_anchor_edited.html"
row "S2 a live anchor edited in the candidate: undocumented NOT-APPLIED by spec and name, exit 1" 'rc_is "$W/s_edited.out" 1 && hasF "$W/s_edited.out" "NOT-APPLIED  UNDOCUMENTED  $LSP  $LNM  (anchor count=0)"' "$W/s_edited.out"
oracle drop-first "$KN" "$W/known_missing.txt" "$W/missing.spec" "$W/missing.name"
MSP="$(cat "$W/missing.spec")"; MNM="$(cat "$W/missing.name")"
run "$W/s_missing.out" python3 "$SAB" --anchors-only "$R/index.html" --known "$W/known_missing.txt"
row "S3 a known list missing a line: that mutation is undocumented, exit 1" 'rc_is "$W/s_missing.out" 1 && hasF "$W/s_missing.out" "NOT-APPLIED  UNDOCUMENTED  $MSP  $MNM  ("' "$W/s_missing.out"
{ cat "$KN"; printf '\n%s %s  # tooling self-test: this anchor applies today\n' "$LSP" "$LNM"; } > "$W/known_stale.txt"
KL="$(wc -l < "$W/known_stale.txt" | tr -d ' ')"
run "$W/s_stale.out" python3 "$SAB" --anchors-only "$R/index.html" --known "$W/known_stale.txt"
row "S4 a known line whose anchor applies is STALE, exit 1" 'rc_is "$W/s_stale.out" 1 && hasF "$W/s_stale.out" "STALE        known list line $KL: $LSP  $LNM  (documented NOT-APPLIED, but its anchor now applies"' "$W/s_stale.out"
TY="$W/sab_toy"; mkdir -p "$TY"
printf "const s = require('fs').readFileSync(process.argv[2], 'utf8');\nif (s.includes('BROKEN')) { console.log('  FAIL toy gate: the candidate is broken'); console.log('PASS 0 FAIL 1'); }\nelse console.log('PASS 1 FAIL 0');\n" > "$TY/toy_gate.js"
printf '<p>alpha beta gamma</p>\n' > "$TY/cand.html"
oracle toy-spec "$TY/toy_gate.js" "$TY/toy_spec.json"
printf '# toy known list\ntoy_spec.json T3 -> delta is gone from the toy candidate, so this never applies  # toy: documented NOT-APPLIED\n' > "$TY/known.txt"
S2L='toy_spec.json T2 -> beta is renamed, the toy gate cannot see it  # toy: survives by design'
printf '# toy survivors\n%s\n' "$S2L" > "$TY/surv_ok.txt"
printf '# toy survivors: none\n' > "$TY/surv_none.txt"
printf '# toy survivors\n%s\ntoy_spec.json T1 -> alpha breaks, the toy gate trips  # toy: listed, but it trips\n' "$S2L" > "$TY/surv_trips.txt"
printf '# toy survivors\n%s\ntoy_spec.json T3 -> delta is gone from the toy candidate, so this never applies  # toy: listed, never applies\n' "$S2L" > "$TY/surv_noapply.txt"
printf '# toy survivors\n%s\ntoy_spec.json T9 -> no such mutation  # toy: names nothing\n' "$S2L" > "$TY/surv_noname.txt"
for s in ok none trips noapply noname; do
  run "$W/s_surv_$s.out" python3 "$SAB" --gates toy_gate "$TY/cand.html" "$TY/toy_spec.json" --known "$TY/known.txt" --survivors "$TY/surv_$s.txt"
done
O="$W/s_surv_ok.out"
row "S5 --gates on the toy: T1 trips, the listed T2 is a documented survivor, T3 documented NOT-APPLIED, exit 0" 'rc_is "$O" 0 && has "$O" "^TRIPPED +toy_spec\.json  T1 " && has "$O" "^SURVIVED +toy_spec\.json  T2 .*\(documented survivor\)$" && has "$O" "^NOT-APPLIED +toy_spec\.json  T3 .*\(documented\)$"' "$O"
O="$W/s_surv_none.out"
row "S6 the same survivor unlisted fails the run (its row carries no documented tag)" 'rc_is "$O" 1 && has "$O" "^SURVIVED +toy_spec\.json  T2 .*  toy_gate\.js PASS 1 FAIL 0$"' "$O"
O="$W/s_surv_trips.out"
row "S7 a listed survivor that trips is STALE" 'rc_is "$O" 1 && hasF "$O" "STALE        survivors list line 3: toy_spec.json  T1 -> alpha breaks, the toy gate trips  (documented SURVIVED, but it now trips;"' "$O"
O="$W/s_surv_noapply.out"
row "S8 a listed survivor whose anchor no longer applies is STALE" 'rc_is "$O" 1 && hasF "$O" "STALE        survivors list line 3: toy_spec.json  T3 -> delta is gone from the toy candidate, so this never applies  (documented SURVIVED, but it now does not apply;"' "$O"
O="$W/s_surv_noname.out"
row "S9 a survivors line naming no mutation is STALE" 'rc_is "$O" 1 && hasF "$O" "STALE        survivors list line 3: toy_spec.json  T9 -> no such mutation  (no mutation of that name in toy_spec.json;"' "$O"

# =====================================================================================================================
echo "== chain.js: a clean clone at HEAD (its gate.sh and harness.js are HEAD's), fixtures from the tags V232 and V233"
CL="$W/clone"
git clone -q --shared "$R" "$CL"
cp "$T/chain.js" "$T/era_bump.py" "$CL/tests/"
git -C "$R" show V232:index.html > "$W/V232.html"
git -C "$R" show V233:index.html > "$W/V233.html"
oracle chain-cands "$W/V233.html" "$W/cand_getprograms.html" "$W/cand_const.html" "$W/const.line"
CLINE="$(cat "$W/const.line")"
run "$W/c_bump.out" node "$CL/tests/chain.js" "$W/V232.html" "$W/V233.html"
O="$W/c_bump.out"
row "C1 V232 -> V233: the meta line is a VERSION BUMP, no OUTSIDE hunk, VERDICT LOCAL (mechanical)" 'rc_is "$O" 0 && hasX "$O" "VERSION BUMP hunks 1" && has "$O" "^  VERSION BUMP \(gate\.sh step 0\)  base L[0-9]+ V232  cand L[0-9]+ V233$" && hasX "$O" "OUTSIDE A FUNCTION hunks 0" && has "$O" "^VERDICT LOCAL \(mechanical\)"' "$O"
run "$W/c_getprograms.out" node "$CL/tests/chain.js" "$W/V233.html" "$W/cand_getprograms.html"
O="$W/c_getprograms.out"
row "C2 an edit inside getPrograms: one CHANGED function, VERDICT CROSS-CUTTING on its reach" 'rc_is "$O" 0 && hasX "$O" "FUNCTIONS changed 1, added 0, removed 0" && has "$O" "^  CHANGED  getPrograms  executed by [0-9]+ gates in the map$" && hasX "$O" "OUTSIDE A FUNCTION hunks 0" && has "$O" "^VERDICT CROSS-CUTTING: getPrograms executed by [0-9]+ gates \(> 20\)$"' "$O"
run "$W/c_const.out" node "$CL/tests/chain.js" "$W/V233.html" "$W/cand_const.html"
O="$W/c_const.out"
row "C3 an edited top-level const: OUTSIDE A FUNCTION, VERDICT CROSS-CUTTING" 'rc_is "$O" 0 && hasX "$O" "FUNCTIONS changed 0, added 0, removed 0" && hasX "$O" "VERSION BUMP hunks 0" && hasX "$O" "OUTSIDE A FUNCTION hunks 1" && has "$O" "^    \+ L[0-9]+ $CLINE" && hasX "$O" "VERDICT CROSS-CUTTING: 1 OUTSIDE A FUNCTION hunk(s)"' "$O"

# =====================================================================================================================
echo "== the repo"
repo_files "$W/repo_files.after"
find "$R" \( -path "$R/.git" -o -path "$R/.claude" \) -prune -o -type f ! -name .DS_Store -newer "$W/.start" -print > "$W/x_newer.txt"
row "X1 no file under the repo (.git and .claude aside) was created, deleted or modified by this run" 'cmp -s "$W/repo_files.before" "$W/repo_files.after" && [ ! -s "$W/x_newer.txt" ]' "$W/x_newer.txt"

echo "selftest wall $(( $(date +%s) - T0 )) s (run dir $W)"
echo "PASS $P FAIL $F"
if [ "$F" -gt 0 ]; then exit 1; fi
'''

# ---- (T-u) g230: a stable print of the V229 baseline temp path -----------------------------------------------------
EDITS.append((P('tests', 'gates', 'g230_d194_lens2.js'),
    "baseWhy += 'git show ' + V229_COMMIT.slice(0, 7) + ':index.html written to ' + f + ' (fallback)'; }",
    "baseWhy += 'git show ' + V229_COMMIT.slice(0, 7) + ':index.html written to os.tmpdir() as g230_d194_lens2_v' + BASE_ERA + '_<pid>.html (fallback)'; }"))

# ---- check everything, then write ------------------------------------------------------------------------------------
for path in NEW:
    if os.path.exists(path):
        print('ABORT: %s already exists' % os.path.relpath(path, ROOT)); sys.exit(1)
texts = {}
for path, old, new in EDITS:
    t = texts.get(path)
    if t is None:
        t = open(path, encoding='utf-8').read()
    n = t.count(old)
    if n != 1:
        print('ABORT: anchor count %d (want 1) in %s: %s' % (n, os.path.relpath(path, ROOT), old[:90])); sys.exit(1)
    texts[path] = t.replace(old, new)
for path, content in NEW.items():
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(content)
    os.chmod(path, 0o755)
    print('WROTE %s (%d lines)' % (os.path.relpath(path, ROOT), content.count('\n')))
for path, t in texts.items():
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(t)
    print('EDITED %s' % os.path.relpath(path, ROOT))
