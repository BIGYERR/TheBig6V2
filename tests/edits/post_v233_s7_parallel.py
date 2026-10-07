#!/usr/bin/env python3
# Post-V233 tooling pass, slice 7: parallelize the slow gate first (Mario, post_v233_proof_scope_decisions.md: "Before
# trimming, tell me whether gates run in parallel. If the 18 to 26 minutes is sequential, parallelize the six slow
# gates first and only trim what's still over."). Evidence: measure mSG (gates already run 8 at a time; g230 is the
# critical path, its `const POOL = 4` caps it; longest-first start alone moves 1,188 s to 1,135 s, POOL 8 to 697 s).
# Tests only: index.html is not touched, ia-version stays 233, no bump.
#
# Diff classes:
#   (T-l) g230_d194_lens2.js: POOL from G230_POOL when a positive integer, else os.cpus().length, never 0; the
#         RUNTIME comment that said "fixed; no environment knob" says what the pool is now (same claim, same class).
#   (T-m) gate.sh step 4: gates start longest first by tests/gate_times.txt (missing gates first), grading and
#         printing stay in glob order; each grade line prints the gate's own wall seconds; GATE_TIMES_OUT, when set,
#         receives the measured `<gate> <seconds>` lines. gate.sh never writes the repo file.
#   (T-n) NEW tests/gate_times.txt seeded from mSG's alone wall (10 gates, alone.json time.wall) and T1 x 0.432.
#
# Every anchor is asserted count == 1 before anything is written; the first miss aborts the whole script.
import json, os, re, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/95d4b21f-2594-431f-a459-d740ba2b91b4/scratchpad'
G230 = os.path.join(ROOT, 'tests/gates/g230_d194_lens2.js')
GATE_SH = os.path.join(ROOT, 'tests/gate.sh')
TIMES = os.path.join(ROOT, 'tests/gate_times.txt')
T1_OUT = os.path.join(SCR, 'measure_T1/v233_time.out')
ALONE = os.path.join(SCR, 'measure_SG/alone.json')
SCALE = 0.432   # mSG: alone over T1, median of the 9 single-process gates


def die(msg):
    print('ABORT: ' + msg); sys.exit(1)


def rep(src, old, new, label):
    n = src.count(old)
    if n != 1: die(f'{label}: anchor count {n}, expected 1')
    return src.replace(old, new, 1)


# ── (T-l) g230 ────────────────────────────────────────────────────────────────────────────────────────────────────
g = open(G230, encoding='utf-8').read()
g = rep(g,
"// RUNTIME. Jobs run in a pool of 4 worker processes (fixed; no environment knob): the 7 lattice enumerations first,\n",
"// RUNTIME. Jobs run in a pool of POOL worker processes: G230_POOL when it is a positive integer, else the machine's core\n"
"//   count (os.cpus().length, never 0; post-V233, Mario), printed as \"pool N\": the 7 lattice enumerations first,\n",
'g230 RUNTIME comment')
g = rep(g,
"const POOL = 4, L1_SHARDS = 8, MARK = '__G230_RESULT__';\n",
"const POOL = /^[1-9][0-9]*$/.test(process.env.G230_POOL || '') ? +process.env.G230_POOL : Math.max(1, (os.cpus() || []).length),\n"
"  L1_SHARDS = 8, MARK = '__G230_RESULT__';\n",
'g230 POOL')

# ── (T-m) gate.sh step 4 ──────────────────────────────────────────────────────────────────────────────────────────
s = open(GATE_SH, encoding='utf-8').read()
s = rep(s,
"""  # then exits 1. Steps 0, 1, 2 and 3 still stop at once (2b does not): nothing downstream of a bad
  # version, a syntax error, a new dupe or a failed boot means anything. Each
  # detail pipe ends `|| true`, because a grep that matches nothing (or a head
  # that closes early) must not let `set -e` end the grading of the gates after it.
  rm -rf "$TMP/gateout" "$TMP/gatelist" "$TMP/rungate.sh"   # delete artifacts before regenerating them
  mkdir -p "$TMP/gateout"
  cat > "$TMP/rungate.sh" <<'WORKER'
#!/usr/bin/env bash
set -eo pipefail
node "$1" "$GATE_CAND" ${GATE_BASE:+"$GATE_BASE"} > "$GATE_OUT/$(basename "$1").out" 2>&1 || true
exit 0
WORKER
  chmod +x "$TMP/rungate.sh"
  for g in "${GATES[@]}"; do printf '%s\\0' "$g" >> "$TMP/gatelist"; done   # temp file, not <(...) — standing rule
  GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" \\
    xargs -0 -n 1 -P "$JOBS" "$TMP/rungate.sh" < "$TMP/gatelist"
""",
"""  # then exits 1. Steps 0, 1, 2 and 3 still stop at once (2b does not): nothing downstream of a bad
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
  # and the weekly full run refreshes gate_times.txt from that file.
  rm -rf "$TMP/gateout" "$TMP/gatelist" "$TMP/globlist" "$TMP/startkeys" "$TMP/rungate.sh" "$TMP/times.out"   # delete artifacts before regenerating them
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
awk -v a="$T0" -v b="$T1" 'BEGIN { if (a == "" || b == "") print "?"; else printf "%.1f\\n", b - a }' > "$GATE_OUT/$B.sec" || true
exit 0
WORKER
  chmod +x "$TMP/rungate.sh"
  TIMES="$HERE/gate_times.txt"
  if [ ! -f "$TIMES" ]; then echo "   no tests/gate_times.txt: every gate is unknown, so they start in glob order"; fi
  for g in "${GATES[@]}"; do printf '%s\\n' "$g" >> "$TMP/globlist"; done   # temp file, not <(...) — standing rule
  # key: <0 unknown | 1 timed> TAB <seconds> TAB <glob index> TAB <path>; sorted unknown first, then seconds
  # descending, then glob order. A missing file reads as no lines (getline returns -1), so every gate is unknown.
  awk -v tf="$TIMES" '
    BEGIN { while ((getline l < tf) > 0) { n = split(l, f, " "); if (n >= 2 && f[1] !~ /^#/ && f[2] ~ /^[0-9]+(\\.[0-9]+)?$/) T[f[1]] = f[2] } }
    { b = $0; sub(/.*\\//, "", b); if (b in T) printf "1\\t%s\\t%d\\t%s\\n", T[b], NR, $0; else printf "0\\t0\\t%d\\t%s\\n", NR, $0 }' "$TMP/globlist" \\
    | sort -t "$(printf '\\t')" -k1,1n -k2,2nr -k3,3n > "$TMP/startkeys"
  if [ "$(wc -l < "$TMP/startkeys" | tr -d ' ')" != "${#GATES[@]}" ]; then
    echo "FAIL: CONFIG: the start list has $(wc -l < "$TMP/startkeys" | tr -d ' ') gates, the glob has ${#GATES[@]}"; exit 1
  fi
  UNK="$(awk -F'\\t' '$1 == "0" { n = $4; sub(/.*\\//, "", n); printf "%s ", n }' "$TMP/startkeys")"
  NUNK="$(awk -F'\\t' '$1 == "0"' "$TMP/startkeys" | wc -l | tr -d ' ')"
  echo "   start order: longest first by gate_times.txt ($(( ${#GATES[@]} - NUNK )) of ${#GATES[@]} timed)${UNK:+; not in the file, started first: $UNK}"
  cut -f4- "$TMP/startkeys" | tr '\\n' '\\0' > "$TMP/gatelist"
  GATE_CAND="$CAND" GATE_BASE="$BASE" GATE_OUT="$TMP/gateout" \\
    xargs -0 -n 1 -P "$JOBS" "$TMP/rungate.sh" < "$TMP/gatelist"
""",
'gate.sh worker and start order')

s = rep(s,
"""  for g in "${GATES[@]}"; do
    GOUT="$TMP/gateout/$(basename "$g").out"
    if [ ! -s "$GOUT" ]; then echo "FAIL: $(basename "$g") printed nothing"; RED+=("$(basename "$g")"); continue; fi
    SUMMARY="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$GOUT" || true)"
    if [ -z "$SUMMARY" ]; then echo "FAIL: $(basename "$g") printed no PASS/FAIL summary (crash?)"; tail -20 "$GOUT" || true; RED+=("$(basename "$g")"); continue; fi
""",
"""  for g in "${GATES[@]}"; do
    GOUT="$TMP/gateout/$(basename "$g").out"
    SEC="$(cat "$TMP/gateout/$(basename "$g").sec" 2>/dev/null || true)"; SEC="${SEC:-?}"   # the gate's own wall seconds
    if [ ! -s "$GOUT" ]; then echo "FAIL: $(basename "$g") printed nothing (${SEC} s)"; RED+=("$(basename "$g")"); continue; fi
    SUMMARY="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$GOUT" || true)"
    if [ -z "$SUMMARY" ]; then echo "FAIL: $(basename "$g") printed no PASS/FAIL summary (crash?) (${SEC} s)"; tail -20 "$GOUT" || true; RED+=("$(basename "$g")"); continue; fi
""",
'gate.sh grade head')

s = rep(s,
"""    if [ "$REFUSED" != "0" ]; then
      echo "   $(basename "$g"): $SUMMARY  REFUSED (blocking)"
    else
      echo "   $(basename "$g"): $SUMMARY"
    fi
""",
"""    if [ "$REFUSED" != "0" ]; then
      echo "   $(basename "$g"): $SUMMARY  ${SEC} s  REFUSED (blocking)"
    else
      echo "   $(basename "$g"): $SUMMARY  ${SEC} s"
    fi
""",
'gate.sh grade line')

s = rep(s,
"""      RED+=("$(basename "$g")")
    fi
  done
fi
# m counts the version-scope lint""",
"""      RED+=("$(basename "$g")")
    fi
  done
  # GATE_TIMES_OUT: the measured seconds, glob order, in gate_times.txt's format. A gate with no measured time is named
  # and left out (it then starts first on a run that reads this file, as an unknown gate does).
  if [ -n "${GATE_TIMES_OUT:-}" ]; then
    echo "# gate.sh measured wall seconds per gate: GATE_JOBS $JOBS, $(date '+%Y-%m-%d %H:%M'), candidate $(basename "$CAND")" > "$TMP/times.out"
    for g in "${GATES[@]}"; do
      SEC="$(cat "$TMP/gateout/$(basename "$g").sec" 2>/dev/null || true)"
      if printf '%s' "$SEC" | grep -qE '^[0-9]+(\\.[0-9]+)?$'; then echo "$(basename "$g") $SEC" >> "$TMP/times.out"
      else echo "   no measured time for $(basename "$g"): left out of GATE_TIMES_OUT"; fi
    done
    cp "$TMP/times.out" "$GATE_TIMES_OUT"
    echo "   measured gate times ($(grep -vc '^#' "$TMP/times.out" | tr -d ' ') of ${#GATES[@]}) -> $GATE_TIMES_OUT"
  fi
fi
# m counts the version-scope lint""",
'gate.sh GATE_TIMES_OUT')

# ── (T-n) tests/gate_times.txt ───────────────────────────────────────────────────────────────────────────────────
if os.path.exists(TIMES): die('tests/gate_times.txt already exists')
glob = sorted(f for f in os.listdir(os.path.join(ROOT, 'tests/gates')) if f.endswith('.js'))
t1 = {}
for line in open(T1_OUT, encoding='utf-8'):
    m = re.match(r'^\s*([0-9]+(?:\.[0-9]+)?)s\s+(\S+\.js)\s+PASS \d+ FAIL \d+\s*$', line)
    if m: t1[m.group(2)] = float(m.group(1))
alone = {k + '.js': v['time']['wall'] for k, v in json.load(open(ALONE, encoding='utf-8')).items()}
if len(alone) != 10: die(f'alone.json has {len(alone)} gates, mSG measured 10')
if set(alone) - set(glob): die('alone.json names a gate not on disk: ' + ' '.join(sorted(set(alone) - set(glob))))
missing = [f for f in glob if f not in t1 and f not in alone]
if missing: die('no T1 time for ' + ' '.join(missing))
rows = []
for f in glob:
    sec = float(alone[f]) if f in alone else t1[f] * SCALE
    rows.append(f'{f} {sec:.1f}')
hdr = [
    '# Gate start order for tests/gate.sh step 4: `<gate file> <seconds>` per line; `#` lines are comments.',
    '# gate.sh starts gates longest first by these seconds; a gate missing here starts FIRST (its cost is unknown).',
    '# Grading and printing stay in glob order. gate.sh never writes this file: with GATE_TIMES_OUT=<path> it writes',
    '# the measured seconds to <path>, and the weekly full run refreshes this file from that output.',
    '# Seed (post-V233, slice 7): measure mSG alone wall (alone.json time.wall) for the 10 gates it timed alone;',
    '# every other gate is its T1 time (v233 gate phase, 8 jobs) x 0.432, mSG\'s median alone/T1 ratio.',
]
open(TIMES, 'w', encoding='utf-8').write('\n'.join(hdr + rows) + '\n')

open(G230, 'w', encoding='utf-8').write(g)
open(GATE_SH, 'w', encoding='utf-8').write(s)
print(f'ok: g230 2 hunks, gate.sh 4 hunks, gate_times.txt {len(rows)} gates ({len(alone)} alone, {len(rows) - len(alone)} T1 x {SCALE})')
