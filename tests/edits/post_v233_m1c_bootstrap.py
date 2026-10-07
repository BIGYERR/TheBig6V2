#!/usr/bin/env python3
# post-V233 slice M1c: a bootstrapped row check still checks skips and allow entries (CLAUDE.md Proof scope, Row
# manifest; Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Message 4: "On the first run under the
# check, expect reds: sort each one into real dark row or legitimate skip, add the legitimate ones to the allow list with
# their cause, and report the split to me"). As M1b built it, ROW_CHECK_BOOTSTRAP=1 with no manifest ran no check at all,
# so the first run never read a SKIP, SCOPED OUT or N/A line against tests/skip_allow.txt. The skip rule does not depend
# on the manifest.
# Tests only: index.html is not touched, ia-version stays 233.
#   (T-ak) tests/gate.sh               step 4b, ROW_CHECK_BOOTSTRAP=1 and no manifest: `rows.js manifest` of this run's
#                                      outputs into $TMP, then the same `rows.js check` against it with --allow (and
#                                      --ruled when ROW_RULED is set); the loud BOOTSTRAP lines stay; a green bootstrapped
#                                      check stays out of GATES RED's m, a red one joins RED and m. ROW_MANIFEST_OUT and
#                                      the manifest-present path are unchanged.
#   (T-al) tests/tooling_selftest.sh   mk_gate_tree copies rows.js and a header-only toy skip_allow.txt (every gate_run,
#                                      heavy and serial toy run is bootstrapped, so its step 4b now runs rows.js); rows
#                                      G28-G31 (bootstrap: a SKIP with no allow entry is red, with its entry green, a
#                                      stale and a causeless allow entry red, the BOOTSTRAP lines still print)
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script with nothing
# written.
import os, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = lambda *a: os.path.join(R, *a)

def die(msg):
    print('ABORT (nothing written): ' + msg); sys.exit(1)

def once(s, old, new, name):
    n = s.count(old)
    if n != 1: die('%s: anchor count %d, want 1' % (name, n))
    return s.replace(old, new)

def between(s, a, b, new, name):
    """Replace s[index(a) : index(b)) with new; a and b each count==1."""
    if s.count(a) != 1: die('%s: start anchor count %d, want 1' % (name, s.count(a)))
    if s.count(b) != 1: die('%s: end anchor count %d, want 1' % (name, s.count(b)))
    i = s.index(a); j = s.index(b)
    if j <= i: die('%s: end anchor before start anchor' % name)
    return s[:i] + new + s[j:]

def after_line(s, marker, block, name):
    """Insert block after the line holding marker (count==1)."""
    if s.count(marker) != 1: die('%s: anchor count %d, want 1' % (name, s.count(marker)))
    i = s.index(marker); j = s.index('\n', i) + 1
    return s[:j] + block + s[j:]

read = lambda p: open(p, encoding='utf-8').read()
OUT = {}

# ================================================================================================ (T-ak) gate.sh step 4b
f = P('tests', 'gate.sh'); s = read(f)
# E1: the bootstrap paragraph of the step 4b comment and the branch it describes. The ROW_MANIFEST_OUT comment, the
# mkdir and the manifest-present path are carried over unchanged; the check moves under `if [ -n "$RCMANI" ]` so the
# bootstrap branch runs the very same check against its own manifest.
s = between(s, "# No tests/row_manifest.txt is red (`row check: no manifest`) unless ROW_CHECK_BOOTSTRAP=1: then a loud BOOTSTRAP line\n",
            'if [ -n "${ROW_MANIFEST_OUT:-}" ]; then\n', r'''# No tests/row_manifest.txt is red (`row check: no manifest`) unless ROW_CHECK_BOOTSTRAP=1: then loud BOOTSTRAP lines
# print and the check STILL RUNS (post-V233 M1c; Mario, Message 4: the first run under the check sorts each skip red
# into a real dark row or an allowed skip). `rows.js manifest` of this run's outputs goes to $TMP/bootmanifest.txt and
# the same `rows.js check` runs against it, with the same --allow and --ruled. Vanished, new and arity cannot fire
# against a manifest built from the same run (so every ROW_RULED line reads stale there); a skip-status line with no
# allow entry, and a stale or malformed allow line, are red exactly as in a normal run. A green bootstrapped check stays
# out of GATES RED's m (no row was checked against a manifest); a red one joins RED and m like any red. Gatekeeper uses
# ROW_CHECK_BOOTSTRAP once, to generate the first manifest; with the manifest present it is ignored and the check runs.
# ROW_MANIFEST_OUT=<path> writes `rows.js manifest` of these outputs to <path>, its run line naming the candidate, its
# ia-version and the date. gate.sh never writes tests/row_manifest.txt itself (gatekeeper regenerates it from a proven
# run; builders never edit it), so a <path> naming that file is red and nothing is written.
mkdir -p "$TMP/gateout"
rm -f "$TMP/rowcheck.txt" "$TMP/manifest.out" "$TMP/bootmanifest.txt"   # delete artifacts before regenerating them
MANI="$HERE/row_manifest.txt"; ROWRED=0; ROWGRADED=1; RCMANI=""
if [ -f "$MANI" ]; then
  if [ "${ROW_CHECK_BOOTSTRAP:-}" = "1" ]; then echo "   ROW_CHECK_BOOTSTRAP=1 ignored: tests/row_manifest.txt exists, so the check runs"; fi
  RCMANI="$MANI"
elif [ "${ROW_CHECK_BOOTSTRAP:-}" = "1" ]; then
  ROWGRADED=0
  echo "BOOTSTRAP: row check NOT RUN against a manifest: no tests/row_manifest.txt and ROW_CHECK_BOOTSTRAP=1, so no row of any gate was checked for vanished, new or arity."
  echo "BOOTSTRAP: the skip check RUNS: rows.js check against a manifest built from this run's outputs, with tests/skip_allow.txt; a skip line with no allow entry, and a stale or malformed entry, are red."
  echo "BOOTSTRAP: gatekeeper writes the first tests/row_manifest.txt from this run's ROW_MANIFEST_OUT, then unsets ROW_CHECK_BOOTSTRAP."
  BMRC=0; node "$HERE/rows.js" manifest "$TMP/gateout" --run "bootstrap, candidate $CAND, ia-version $META" > "$TMP/bootmanifest.txt" 2>&1 || BMRC=$?
  if [ "$BMRC" = "0" ] && [ -s "$TMP/bootmanifest.txt" ]; then
    RCMANI="$TMP/bootmanifest.txt"
  else
    echo "FAIL: row check: BOOTSTRAP: rows.js manifest of this run's outputs exit $BMRC, so the skip check did not run"; tail -5 "$TMP/bootmanifest.txt" || true; ROWRED=1
  fi
else
  echo "FAIL: row check: no manifest: tests/row_manifest.txt is absent (gatekeeper bootstraps it once: ROW_CHECK_BOOTSTRAP=1 ROW_MANIFEST_OUT=<path>)"; ROWRED=1
fi
if [ -n "$RCMANI" ]; then
  RCARGS=(check "$RCMANI" "$TMP/gateout" --allow "$HERE/skip_allow.txt")
  if [ -n "${ROW_RULED:-}" ]; then RCARGS+=(--ruled "$ROW_RULED"); fi
  RCRC=0; node "$HERE/rows.js" "${RCARGS[@]}" > "$TMP/rowcheck.txt" 2>&1 || RCRC=$?
  RCSUM="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$TMP/rowcheck.txt" || true)"
  if [ "$RCRC" = "0" ] && [ -n "$RCSUM" ] && [ "$(echo "$RCSUM" | awk '{print $4}')" = "0" ]; then
    echo "   rows.js check: $RCSUM"
  elif [ -z "$RCSUM" ]; then
    echo "FAIL: row check: rows.js printed no PASS/FAIL summary (a crash or a refusal, exit $RCRC)"; tail -20 "$TMP/rowcheck.txt" || true; ROWRED=1
  else
    echo "FAIL: row check: $RCSUM (exit $RCRC)"; grep -E '^(FAIL|INFO)' "$TMP/rowcheck.txt" || true; ROWRED=1
  fi
fi
''', 'E1 gate.sh step 4b bootstrap')
# E2: the m comment: a bootstrapped check now checks skips and allow entries, so "checked nothing" is no longer true.
s = once(s, "# red is in RED. A bootstrapped row check (ROW_CHECK_BOOTSTRAP=1, no manifest) checked nothing, so m leaves it out.\n",
         "# red is in RED. A green bootstrapped row check (ROW_CHECK_BOOTSTRAP=1, no manifest) checked no row against a manifest,\n"
         "# so m leaves it out; a red one (a skip with no allow entry, a stale or bad allow line) is in RED and in m.\n",
         'E2 gate.sh m comment')
OUT[f] = s

# ============================================================================================= (T-al) tooling_selftest.sh
f = P('tests', 'tooling_selftest.sh'); s = read(f)
# E3: every toy gate tree carries rows.js under test and a header-only skip_allow.txt: gate_run, the heavy and the
# serial toy runs are bootstrapped, and a bootstrapped step 4b now runs `rows.js manifest` and `rows.js check`.
s = once(s, '''mk_gate_tree() { # <root>: gate.sh and version_scope.js under test, the repo's harness and lint list, an empty toy debt file
  mkdir -p "$1/tests/gates"
  cp "$T/gate.sh" "$T/version_scope.js" "$1/tests/"
  cp "$R/tests/harness.js" "$1/tests/"
  if [ -f "$R/tests/lint_allow.txt" ]; then cp "$R/tests/lint_allow.txt" "$1/tests/"; fi
  printf '# toy debt file: no toy gate carries debt\\n' > "$1/tests/version_scope_debt.txt"
}
gate_run() { # <out> <start log> <gate.sh> <args...>; ROW_CHECK_BOOTSTRAP=1, so a toy tree here needs no row manifest
  local out="$1" log="$2"; shift 2      # (the row check has its own rows, G22 to G27)
''', '''mk_gate_tree() { # <root>: gate.sh, version_scope.js and rows.js under test, the repo's harness and lint list, an empty toy
  mkdir -p "$1/tests/gates"     # debt file, and a header-only toy skip_allow.txt (a bootstrapped step 4b still runs
  cp "$T/gate.sh" "$T/version_scope.js" "$T/rows.js" "$1/tests/"   # rows.js check against it: post-V233 M1c)
  cp "$R/tests/harness.js" "$1/tests/"
  if [ -f "$R/tests/lint_allow.txt" ]; then cp "$R/tests/lint_allow.txt" "$1/tests/"; fi
  printf '# toy debt file: no toy gate carries debt\\n' > "$1/tests/version_scope_debt.txt"
  printf '# toy skip_allow.txt: no entries\\n' > "$1/tests/skip_allow.txt"
}
gate_run() { # <out> <start log> <gate.sh> <args...>; ROW_CHECK_BOOTSTRAP=1, so a toy tree here needs no row manifest
  local out="$1" log="$2"; shift 2      # (its skip check runs on one built from the run; the row check has its own rows, G22 to G31)
''', 'E3 selftest mk_gate_tree')
# E4: rows G28-G31 after G27. Every count is typed from the toy lines: the bootstrap manifest of RS holds 5 keys
# (r_a.js R1 R2, r_b.js B1, s_skip.js S0 S1), each once, so PASS = 5 + the allow lines that matched; GATES RED's m = 3 toy
# gates + version_scope.js + the row check (red, so in m) = 5.
s = after_line(s, 'row "G27 ROW_MANIFEST_OUT written:', r'''# BOOTSTRAP still checks skips and allow entries (post-V233 M1c; Mario, Message 4: the first run under the check sorts each
# skip red into a real dark row or an allowed skip). RS is a row tree with no manifest and a third toy gate, s_skip.js,
# printing S0 PASS and S1 SKIP. The manifest a bootstrapped run builds holds 5 keys (r_a.js R1 R2, r_b.js B1, s_skip.js
# S0 S1), each once, so PASS is 5 plus the allow lines that matched; m is 3 toy gates, version_scope.js and the row check.
RS="$W/rows_bootskip"; mk_row_tree "$RS"
printf "console.log('PASS S0 one');\nconsole.log('SKIP S1 the toy input file is absent');\nconsole.log('PASS 1 FAIL 0');\n" > "$RS/tests/gates/s_skip.js"
run "$W/r_bskip.out" env ROW_CHECK_BOOTSTRAP=1 bash "$RS/tests/gate.sh" "$R/index.html"
O="$W/r_bskip.out"
row "G28 BOOTSTRAP, a toy SKIP line (s_skip.js S1) with no allow entry: red at step 4b by gate and key (PASS 5 FAIL 1), GATES RED 1 of 5: rows.js, exit 1" 'rc_is "$O" 1 && has "$O" "^FAIL skip s_skip\.js S1 L2 .* SKIP with no tests/skip_allow\.txt entry" && hasX "$O" "FAIL: row check: PASS 5 FAIL 1 (exit 1)" && hasX "$O" "GATES RED 1 of 5: rows.js" && lacks "$O" "^ALL GATES PASS"' "$O"
printf '%s\n' "# toy skip_allow.txt" "s_skip.js S1  # toy: the input file is absent" > "$RS/tests/skip_allow.txt"
run "$W/r_ballow.out" env ROW_CHECK_BOOTSTRAP=1 bash "$RS/tests/gate.sh" "$R/index.html"
O="$W/r_ballow.out"
row "G29 the same BOOTSTRAP run with its allow entry: step 4b ran and passes (PASS 6 FAIL 0), ALL GATES PASS, exit 0, no GATES RED and no FAIL line" 'rc_is "$O" 0 && hasX "$O" "   rows.js check: PASS 6 FAIL 0" && hasX "$O" "ALL GATES PASS" && lacks "$O" "^GATES RED" && lacks "$O" "^FAIL"' "$O"
printf '%s\n' "# toy skip_allow.txt" "s_skip.js S1  # toy: the input file is absent" "r_a.js R1  # toy: R1 never skips" "r_b.js B1" > "$RS/tests/skip_allow.txt"
run "$W/r_bstale.out" env ROW_CHECK_BOOTSTRAP=1 bash "$RS/tests/gate.sh" "$R/index.html"
O="$W/r_bstale.out"
row "G30 BOOTSTRAP with a stale allow entry (r_a.js R1 prints PASS) and one with no cause (r_b.js B1): each red by line (PASS 6 FAIL 2), GATES RED 1 of 5: rows.js, exit 1" 'rc_is "$O" 1 && has "$O" "^FAIL stale allow line 3: r_a\.js R1  # toy: R1 never skips .* matched no SKIP" && has "$O" "^FAIL allow line 4: r_b\.js B1 .* no cause" && hasX "$O" "FAIL: row check: PASS 6 FAIL 2 (exit 1)" && hasX "$O" "GATES RED 1 of 5: rows.js"' "$O"
boot_lines() { has "$1" "^BOOTSTRAP: row check NOT RUN against a manifest" && has "$1" "^BOOTSTRAP: the skip check RUNS" && has "$1" "^BOOTSTRAP: gatekeeper writes the first tests/row_manifest\.txt" && lacks "$1" "row check: no manifest"; }
row "G31 the loud BOOTSTRAP lines still print on every bootstrapped run, red or green (G28, G29, G30), and say the skip check runs" 'boot_lines "$W/r_bskip.out" && boot_lines "$W/r_ballow.out" && boot_lines "$W/r_bstale.out"' "$W/r_bskip.out"
''', 'E4 selftest rows G28-G31')
OUT[f] = s

for p, t in OUT.items():
    open(p, 'w', encoding='utf-8').write(t)
    print('wrote ' + os.path.relpath(p, R))
