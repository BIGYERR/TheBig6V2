#!/usr/bin/env bash
# Iron Asylum gate runner. Usage: tests/gate.sh <candidate.html> [baseline.html]
#
# Hard invariants (handoff §9/§10b): `set -eo pipefail`, bash not sh, `;` not `&&`
# around heredocs, delete artifacts before regenerating them, fail closed on
# empty or missing output. A gate that prints nothing has failed.
set -eo pipefail

CAND="${1:?usage: tests/gate.sh <candidate.html> [baseline.html]}"
BASE="${2:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# GATE_JOBS: empty or unset means 8. Only a POSITIVE integer is accepted. 0 is NOT
# clamped and NOT allowed — BSD xargs reads `-P 0` as UNBOUNDED, which would spawn
# every gate at once; a clamp would silently hide the typo instead. Negative and
# non-numeric are rejected the same way. This is a CONFIGURATION error, not a gate
# result, and it fires before gate 0 so no work is done on a bad value.
JOBS="${GATE_JOBS:-8}"
if ! printf '%s' "$JOBS" | grep -qE '^[0-9]+$' || [ "$JOBS" -lt 1 ]; then
  echo "FAIL: CONFIG: GATE_JOBS must be a positive integer, or empty/unset which means 8; got '$GATE_JOBS'"; exit 1
fi

echo "== 0. version / filename invariant"
META="$(grep -oE '<meta name="ia-version" content="[0-9]+"' "$CAND" | grep -oE '[0-9]+' | tail -1)"
FNV="$(basename "$CAND" | grep -o 'V[0-9]*' | tr -d V || true)"
echo "   meta=$META filename=${FNV:-index}"
if [ -n "$FNV" ] && [ "$FNV" != "$META" ]; then echo "FAIL: ia-version ($META) != filename (V$FNV)"; exit 1; fi

echo "== 1. syntax"
rm -f "$TMP/inline.js"
node -e "const {extractInlineJS}=require('$HERE/harness');process.stdout.write(extractInlineJS(require('fs').readFileSync('$CAND','utf8')))" > "$TMP/inline.js"
[ -s "$TMP/inline.js" ] || { echo "FAIL: empty extraction"; exit 1; }
node --check "$TMP/inline.js"
echo "   node --check ok ($(wc -c < "$TMP/inline.js") bytes)"

echo "== 2. duplicate top-level declarations (node --check passes these silently)"
DUPES="$(grep -oE '^(function|const|let|var|class)\s+[A-Za-z_$][A-Za-z0-9_$]*' "$TMP/inline.js" | awk '{print $2}' | sort | uniq -d || true)"
ALLOW="$(grep -vE '^\s*(#|$)' "$HERE/lint_allow.txt" 2>/dev/null || true)"
echo "$DUPES" | sort -u > "$TMP/dupes.txt"; echo "$ALLOW" | sort -u > "$TMP/allow.txt"   # temp files, not <(...) — standing rule
NEW="$(comm -23 "$TMP/dupes.txt" "$TMP/allow.txt" | grep -v '^$' || true)"
if [ -n "$NEW" ]; then echo "FAIL: NEW duplicate top-level declarations:"; echo "$NEW"; exit 1; fi
KNOWN="$(comm -12 "$TMP/dupes.txt" "$TMP/allow.txt" | grep -v '^$' || true)"
[ -n "$KNOWN" ] && echo "   known dupes (debt, see lint_allow.txt): $(echo $KNOWN)"
echo "   0 new duplicates"

echo "== 2b. version scope (no gate row is scoped to one exact ia-version)"
# Post-V233 (Mario; CLAUDE.md Proof scope, Version scope): a row uses a range, a minimum, or an era row the era
# script bumps. version_scope.js scans tests/gates/*.js against tests/version_scope_debt.txt: a new exact-version
# row, or a debt line that no longer matches, is red. A red HERE is graded like a red gate, not like steps 0 to 3:
# its lines print, its name joins RED, the run goes on through step 5, and the script exits 1 at the end.
RED=()   # names of the red gates (and of this lint), in order; read after step 5 for the exit code
rm -f "$TMP/vscope.txt"   # delete artifacts before regenerating them
VSRC=0; node "$HERE/version_scope.js" > "$TMP/vscope.txt" 2>&1 || VSRC=$?
VSUM="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$TMP/vscope.txt" || true)"
if [ "$VSRC" = "0" ] && [ -n "$VSUM" ] && [ "$(echo "$VSUM" | awk '{print $4}')" = "0" ]; then
  echo "   version_scope.js: $VSUM"
elif [ -z "$VSUM" ]; then
  echo "FAIL: version_scope.js printed no PASS/FAIL summary (crash?, exit $VSRC)"; tail -20 "$TMP/vscope.txt" || true
  RED+=("version_scope.js")
else
  echo "FAIL: version_scope.js: $VSUM (exit $VSRC)"
  grep -E '^FAIL|^    ' "$TMP/vscope.txt" | head -60 || true
  RED+=("version_scope.js")
fi

echo "== 3. boot + self-stable baseline"
node "$HERE/harness.js" "$CAND" | tee "$TMP/boot.txt"
grep -q 'self-stable yes' "$TMP/boot.txt" || { echo "FAIL: build is not reproducible on a pinned seed"; exit 1; }

echo "== 4. behavioral gates (tests/gates/*.js)"
shopt -s nullglob
GATES=("$HERE"/gates/*.js)
# RED was declared at step 2b and may already hold version_scope.js; gate names append in glob order.
if [ ${#GATES[@]} -eq 0 ]; then echo "   (no gates yet)"; fi
if [ ${#GATES[@]} -gt 0 ]; then
  # Run the gates across cores, then GRADE THEM SEQUENTIALLY in glob order.
  # One result file per gate, so nothing interleaves and the grader reads files,
  # not a live pipe: printed order, per-gate detail and exit codes are identical
  # to the serial run. Workers ALWAYS exit 0 — a red gate must reach the grader,
  # and any nonzero worker makes xargs return 1, which `set -e` would abort on
  # before a single result was read.
  #
  # EVERY GATE IS GRADED (Mario, post-V233: "gate.sh reports every red, not the
  # first"). A red gate prints its detail exactly as before and its name is
  # collected; the loop goes on to the next gate. After the last gate the line
  # `GATES RED <k> of <m>: <names>` prints once, step 5 still runs, and the script
  # then exits 1. Steps 0, 1, 2 and 3 still stop at once (2b and 4b do not): nothing downstream of a bad
  # version, a syntax error, a new dupe or a failed boot means anything. Each
  # detail pipe ends `|| true`, because a grep that matches nothing (or a head
  # that closes early) must not let `set -e` end the grading of the gates after it.
  #
  # START ORDER (post-V233, Mario: parallelize before trimming; measure mSG). Gates START longest first by
  # tests/gate_times.txt (`<gate file> <seconds>` per line, `#` lines are comments), so the slowest gate is never
  # queued behind short ones. A gate missing from the file starts FIRST: a new gate's cost is unknown. Ties keep glob
  # order. Only the start order moves: grading and printing below stay in glob order exactly as before. Each grade
  # line prints the gate's own wall seconds (the worker's clock around its node process). gate.sh never writes
  # gate_times.txt; when GATE_TIMES_OUT is set it writes the measured `<gate> <seconds>` lines there after grading,
  # each gate's `pool=<n>` column carried over from gate_times.txt (post-V233 A2), and the weekly full run refreshes
  # gate_times.txt from that file.
  #
  # HEAVY SLOTS (post-V233 s11; Mario: parallelize first, trim only what is still over). A gate with a third column
  # `pool=<n>` in gate_times.txt runs <n> worker processes of its own (g230 today). It starts FIRST, in the background,
  # with GATE_POOL=<n> in its environment; the other gates go through xargs at -P max(2, JOBS - the sum of those pools),
  # so its workers and the other gates share the JOBS slots instead of multiplying (slice 7's core-count pool under -P 8
  # reached load 65). With no pool column xargs runs at -P JOBS exactly as before. A third column that is not
  # pool=<positive integer>, or a fourth column, is a CONFIGURATION error. Grading, RED, the per-gate seconds and
  # GATE_TIMES_OUT read the same result files in the same glob order as before. GATE_JOBS=1 is fully serial (post-V233
  # A2): each pool gate runs to completion first, in the foreground and one at a time (still with GATE_POOL=<n>), then
  # the other gates go through xargs at -P 1; with GATE_JOBS above 1 nothing here changes.
  rm -rf "$TMP/gateout" "$TMP/gatelist" "$TMP/globlist" "$TMP/startkeys" "$TMP/rungate.sh" "$TMP/times.out" "$TMP/pools" "$TMP/heavy" "$TMP/lightlist"   # delete artifacts before regenerating them
  mkdir -p "$TMP/gateout"
  cat > "$TMP/rungate.sh" <<'WORKER'
#!/usr/bin/env bash
set -eo pipefail
# perl's clock has sub-second resolution (bash 3.2 has no EPOCHREALTIME); without perl, date's whole seconds.
now() { perl -MTime::HiRes=time -e 'printf "%.3f", time' 2>/dev/null || date +%s; }
B="$(basename "$1")"
T0="$(now || true)"
node "$1" "$GATE_CAND" ${GATE_BASE:+"$GATE_BASE"} > "$GATE_OUT/$B.out" 2>&1 || true
T1="$(now || true)"
awk -v a="$T0" -v b="$T1" 'BEGIN { if (a == "" || b == "") print "?"; else printf "%.1f\n", b - a }' > "$GATE_OUT/$B.sec" || true
exit 0
WORKER
  chmod +x "$TMP/rungate.sh"
  TIMES="$HERE/gate_times.txt"
  if [ ! -f "$TIMES" ]; then echo "   no tests/gate_times.txt: every gate is unknown, so they start in glob order"; fi
  for g in "${GATES[@]}"; do printf '%s\n' "$g" >> "$TMP/globlist"; done   # temp file, not <(...) — standing rule
  # key: <0 unknown | 1 timed> TAB <seconds> TAB <glob index> TAB <path>; sorted unknown first, then seconds
  # descending, then glob order. A missing file reads as no lines (getline returns -1), so every gate is unknown.
  awk -v tf="$TIMES" '
    BEGIN { while ((getline l < tf) > 0) { n = split(l, f, " "); if (n >= 2 && f[1] !~ /^#/ && f[2] ~ /^[0-9]+(\.[0-9]+)?$/) T[f[1]] = f[2] } }
    { b = $0; sub(/.*\//, "", b); if (b in T) printf "1\t%s\t%d\t%s\n", T[b], NR, $0; else printf "0\t0\t%d\t%s\n", NR, $0 }' "$TMP/globlist" \
    | sort -t "$(printf '\t')" -k1,1n -k2,2nr -k3,3n > "$TMP/startkeys"
  if [ "$(wc -l < "$TMP/startkeys" | tr -d ' ')" != "${#GATES[@]}" ]; then
    echo "FAIL: CONFIG: the start list has $(wc -l < "$TMP/startkeys" | tr -d ' ') gates, the glob has ${#GATES[@]}"; exit 1
  fi
  UNK="$(awk -F'\t' '$1 == "0" { n = $4; sub(/.*\//, "", n); printf "%s ", n }' "$TMP/startkeys")"
  NUNK="$(awk -F'\t' '$1 == "0"' "$TMP/startkeys" | wc -l | tr -d ' ')"
  echo "   start order: longest first by gate_times.txt ($(( ${#GATES[@]} - NUNK )) of ${#GATES[@]} timed)${UNK:+; not in the file, started first: $UNK}"
  # HEAVY SLOTS (see above). pools: <gate> TAB <n> per pool-column line, or BAD TAB <line>.
  awk -v tf="$TIMES" 'BEGIN { while ((getline l < tf) > 0) { n = split(l, f, " "); if (n < 3 || f[1] ~ /^#/) continue
      if (n == 3 && f[3] ~ /^pool=[1-9][0-9]*$/) printf "%s\t%s\n", f[1], substr(f[3], 6); else printf "BAD\t%s\n", l } }' > "$TMP/pools"
  BADP="$(awk -F'\t' '$1 == "BAD" { print $2 }' "$TMP/pools")"
  if [ -n "$BADP" ]; then echo "FAIL: CONFIG: tests/gate_times.txt: a third column must be pool=<positive integer>, and nothing follows it; got: $BADP"; exit 1; fi
  : > "$TMP/heavy"; : > "$TMP/lightlist"
  awk -F'\t' -v pf="$TMP/pools" -v hv="$TMP/heavy" -v lt="$TMP/lightlist" '
    BEGIN { while ((getline l < pf) > 0) { split(l, p, "\t"); PL[p[1]] = p[2] } }
    { b = $4; sub(/.*\//, "", b); if (b in PL) printf "%s\t%s\n", PL[b], $4 > hv; else print $4 > lt }' "$TMP/startkeys"
  HSUM=0; HPIDS=(); HNAMES=""
  if [ "$JOBS" -eq 1 ]; then
  # GATE_JOBS=1 (post-V233 A2): fully serial. Every pool gate runs to completion here, in the foreground and one at a time,
  # before xargs starts the other gates at -P 1.
  while IFS=$'\t' read -r HP HG; do HSUM=$(( HSUM + HP )); HNAMES="$HNAMES${HNAMES:+, }$(basename "$HG") GATE_POOL=$HP"; done < "$TMP/heavy"
  if [ "$HSUM" -gt 0 ]; then
    echo "   heavy slots: GATE_JOBS 1 is serial: $HNAMES run to completion first, one at a time; the other $(wc -l < "$TMP/lightlist" | tr -d ' ') gates run -P 1"
    while IFS=$'\t' read -r HP HG; do
      GATE_POOL="$HP" GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" "$TMP/rungate.sh" "$HG" < /dev/null
    done < "$TMP/heavy"
  fi
  LP=1
  else
  HSUM=0; HPIDS=(); HNAMES=""
  while IFS=$'\t' read -r HP HG; do
    GATE_POOL="$HP" GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" "$TMP/rungate.sh" "$HG" < /dev/null &
    HPIDS+=("$!"); HSUM=$(( HSUM + HP )); HNAMES="$HNAMES${HNAMES:+, }$(basename "$HG") GATE_POOL=$HP"
  done < "$TMP/heavy"
  LP="$JOBS"
  if [ "$HSUM" -gt 0 ]; then
    LP=$(( JOBS - HSUM )); if [ "$LP" -lt 2 ]; then LP=2; fi
    echo "   heavy slots: started first in the background: $HNAMES; the other $(wc -l < "$TMP/lightlist" | tr -d ' ') gates run -P $LP (max(2, GATE_JOBS $JOBS - pools $HSUM))"
  fi
  fi
  tr '\n' '\0' < "$TMP/lightlist" > "$TMP/gatelist"
  if [ -s "$TMP/gatelist" ]; then
    GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" \
      xargs -0 -n 1 -P "$LP" "$TMP/rungate.sh" < "$TMP/gatelist"
  fi
  for HPID in ${HPIDS[@]+"${HPIDS[@]}"}; do wait "$HPID" || true; done   # the worker always exits 0; the grader reads its files

  for g in "${GATES[@]}"; do
    GOUT="$TMP/gateout/$(basename "$g").out"
    SEC="$(cat "$TMP/gateout/$(basename "$g").sec" 2>/dev/null || true)"; SEC="${SEC:-?}"   # the gate's own wall seconds
    if [ ! -s "$GOUT" ]; then echo "FAIL: $(basename "$g") printed nothing (${SEC} s)"; RED+=("$(basename "$g")"); continue; fi
    SUMMARY="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$GOUT" || true)"
    if [ -z "$SUMMARY" ]; then echo "FAIL: $(basename "$g") printed no PASS/FAIL summary (crash?) (${SEC} s)"; tail -20 "$GOUT" || true; RED+=("$(basename "$g")"); continue; fi
    # A REFUSED assertion is one that could not be PUT, announced by name. Mario ruled
    # (V198) that a refusal BLOCKS: a claim that did not run is not a pass, which is the
    # whole reason the refusal bucket is printed loudly instead of swallowed. It is echoed
    # beside the summary and it exits 1, exactly like a FAIL. Do not soften it to a warning.
    REFUSED="$(grep -cE '^REFUSED' "$GOUT" || true)"
    if [ "$REFUSED" != "0" ]; then
      echo "   $(basename "$g"): $SUMMARY  ${SEC} s  REFUSED (blocking)"
    else
      echo "   $(basename "$g"): $SUMMARY  ${SEC} s"
    fi
    FAILS="$(echo "$SUMMARY" | awk '{print $4}')"
    # Gates print FAIL at column 0 (13 of them) or indented as `  FAIL ` (10 of them). An
    # anchored `^FAIL` read only the first kind, so half the suite could exit 1 with no
    # detail printed at all.
    if [ "$FAILS" != "0" ]; then grep -E '^[[:space:]]*FAIL' "$GOUT" | head -40 || true; RED+=("$(basename "$g")"); continue; fi
    if [ "$REFUSED" != "0" ]; then
      echo "FAIL: $(basename "$g") REFUSED an assertion: a claim that did not run is not a pass (ruled, V198)"
      grep -E '^REFUSE' "$GOUT" | head -20 || true
      RED+=("$(basename "$g")")
    fi
  done
  # GATE_TIMES_OUT: the measured seconds, glob order, in gate_times.txt's format. A gate with no measured time is named
  # and left out (it then starts first on a run that reads this file, as an unknown gate does). Each gate's pool=<n>
  # column is carried over from gate_times.txt (post-V233 A2), so a refresh from this file never drops it.
  if [ -n "${GATE_TIMES_OUT:-}" ]; then
    echo "# gate.sh measured wall seconds per gate: GATE_JOBS $JOBS, $(date '+%Y-%m-%d %H:%M'), candidate $(basename "$CAND")" > "$TMP/times.out"
    for g in "${GATES[@]}"; do
      SEC="$(cat "$TMP/gateout/$(basename "$g").sec" 2>/dev/null || true)"
      PCOL="$(awk -F'\t' -v b="$(basename "$g")" '$1 == b { printf " pool=%s", $2; exit }' "$TMP/pools")"   # carried over
      if printf '%s' "$SEC" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then echo "$(basename "$g") $SEC$PCOL" >> "$TMP/times.out"
      else echo "   no measured time for $(basename "$g"): left out of GATE_TIMES_OUT"; fi
    done
    cp "$TMP/times.out" "$GATE_TIMES_OUT"
    echo "   measured gate times ($(grep -vc '^#' "$TMP/times.out" | tr -d ' ') of ${#GATES[@]}) -> $GATE_TIMES_OUT"
  fi
fi

echo "== 4b. row check (rows.js check: tests/row_manifest.txt, tests/skip_allow.txt${ROW_RULED:+, ROW_RULED $ROW_RULED})"
# Post-V233 M1b (Mario; CLAUDE.md Proof scope, Version scope and Row manifest). rows.js check reads the per-gate outputs
# graded above ($TMP/gateout/<gate>.js.out) against tests/row_manifest.txt, with tests/skip_allow.txt as --allow and,
# when ROW_RULED is set, that file as --ruled. Red: a manifest row with no status line, a row the manifest lacks, an
# arity move, a skip-status line (SKIP, SCOPED OUT, N/A, DEFER and the like) that no allow entry names, and a bad or
# stale allow or ruled line. A red HERE is graded like a red gate: its lines print, `rows.js` joins RED, step 5 still
# runs, and the script exits 1 at the end.
# No tests/row_manifest.txt is red (`row check: no manifest`) unless ROW_CHECK_BOOTSTRAP=1: then loud BOOTSTRAP lines
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
if [ -n "${ROW_MANIFEST_OUT:-}" ]; then
  MODIR="$(cd "$(dirname "$ROW_MANIFEST_OUT")" 2>/dev/null && pwd -P || true)"
  if [ -z "$MODIR" ]; then
    echo "FAIL: ROW_MANIFEST_OUT: no directory for $ROW_MANIFEST_OUT, nothing written"; ROWRED=1
  elif [ "$MODIR/$(basename "$ROW_MANIFEST_OUT")" = "$(cd "$HERE" && pwd -P)/row_manifest.txt" ]; then
    echo "FAIL: ROW_MANIFEST_OUT names tests/row_manifest.txt: gate.sh never writes it (gatekeeper copies a proven run's manifest there), nothing written"; ROWRED=1
  else
    RMRC=0; node "$HERE/rows.js" manifest "$TMP/gateout" --run "candidate $CAND, ia-version $META, $(date '+%Y-%m-%d %H:%M')" > "$TMP/manifest.out" 2>&1 || RMRC=$?
    if [ "$RMRC" = "0" ] && [ -s "$TMP/manifest.out" ]; then
      cp "$TMP/manifest.out" "$ROW_MANIFEST_OUT"; echo "   row manifest ($(grep -vc '^#' "$TMP/manifest.out" || true) rows) -> $ROW_MANIFEST_OUT"
    else
      echo "FAIL: ROW_MANIFEST_OUT: rows.js manifest exit $RMRC, nothing written"; tail -5 "$TMP/manifest.out" || true; ROWRED=1
    fi
  fi
fi
if [ "$ROWRED" = "1" ]; then RED+=("rows.js"); ROWGRADED=1; fi
# m counts the version-scope lint (step 2b) and the row check (step 4b) with the gates: each is graded like one, and its
# red is in RED. A green bootstrapped row check (ROW_CHECK_BOOTSTRAP=1, no manifest) checked no row against a manifest,
# so m leaves it out; a red one (a skip with no allow entry, a stale or bad allow line) is in RED and in m.
if [ ${#RED[@]} -gt 0 ]; then echo "GATES RED ${#RED[@]} of $(( ${#GATES[@]} + 1 + ROWGRADED )): ${RED[*]}"; fi

if [ -n "$BASE" ]; then
  echo "== 5. blast-radius diff vs $(basename "$BASE")"
  [ -f "$BASE" ] || { echo "FAIL: baseline missing"; exit 1; }
  set +e; diff -u "$BASE" "$CAND" > "$TMP/diff.txt"; RC=$?; set -e
  if [ $RC -eq 2 ]; then echo "FAIL: diff errored"; exit 1; fi
  if [ $RC -eq 0 ]; then echo "FAIL: candidate is byte-identical to baseline — nothing was built"; exit 1; fi
  HUNKS="$(grep -c '^@@' "$TMP/diff.txt" || true)"
  ADDED="$(grep -c '^+[^+]' "$TMP/diff.txt" || true)"; REMOVED="$(grep -c '^-[^-]' "$TMP/diff.txt" || true)"
  echo "   $HUNKS hunks, +$ADDED/-$REMOVED lines. Every hunk must be classified in the D-code before ship."
  cp "$TMP/diff.txt" "$HERE/../.last_diff.txt"; echo "   full diff -> .last_diff.txt"
fi

# Step 5 ran even if step 2b, step 4 or step 4b was red (its diff is still the blast radius to classify);
# the reds (gates, the version-scope lint and the row check) decide the exit code here, and ALL GATES PASS prints only on
# zero reds.
if [ ${#RED[@]} -gt 0 ]; then exit 1; fi
echo "ALL GATES PASS"
