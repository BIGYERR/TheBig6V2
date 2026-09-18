#!/usr/bin/env bash
# Iron Asylum identity-fuzz driver.
#   Usage: tests/fuzz.sh <candidate.html> [baseline.html] [--lattice small] [--shards N]
#   Env:   FUZZ_JOBS (xargs width, default 8), FUZZ_SHARDS (default 8),
#          FUZZ_OUT (caller-owned result dir, kept; unset means a private mktemp dir)
#
# Prints the SAME stdout and the SAME exit code as the sequential run of
# tests/measure/v195_gk_identity_fuzz.js on the same build. Proven by
# tests/gates/g_fuzz_shard_equiv.js.
#
# Hard invariants (handoff §9/§10b): `set -eo pipefail`, bash not sh, `;` not `&&`
# around heredocs, temp files not <(...), delete artifacts before regenerating them.
# Workers ALWAYS exit 0 -- a nonzero worker makes xargs return 1, which `set -e` would
# abort on before a single result file was read. The fan-out is graded from the FILES.
set -eo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
JS="$HERE/measure/v195_gk_identity_fuzz.js"

CAND=""; BASE=""; LAT=""; N="${FUZZ_SHARDS:-8}"
while [ $# -gt 0 ]; do
  case "$1" in
    --lattice) LAT="${2:-}"; shift 2;;
    --shards)  N="${2:-}"; shift 2;;
    --)        shift;;
    *) if [ -z "$CAND" ]; then CAND="$1"; elif [ -z "$BASE" ]; then BASE="$1"; fi; shift;;
  esac
done
[ -n "$CAND" ] || { echo "usage: tests/fuzz.sh <candidate.html> [baseline.html] [--lattice small]"; exit 2; }
[ -f "$JS" ]   || { echo "FAIL: CONFIG: fuzz script missing at $JS"; exit 1; }

# FUZZ_JOBS / FUZZ_SHARDS: empty or unset means 8. Only a POSITIVE integer is accepted.
# 0 is NOT clamped -- BSD xargs reads `-P 0` as UNBOUNDED. A clamp would hide the typo.
JOBS="${FUZZ_JOBS:-8}"
for pair in "FUZZ_SHARDS:$N" "FUZZ_JOBS:$JOBS"; do
  nm="${pair%%:*}"; vl="${pair#*:}"
  if ! printf '%s' "$vl" | grep -qE '^[0-9]+$' || [ "$vl" -lt 1 ]; then
    echo "FAIL: CONFIG: $nm must be a positive integer, or empty/unset which means 8; got '$vl'"; exit 1
  fi
done

# Never a fixed /tmp path: two overlapping fuzz runs (gatekeeper and builder, or two
# sessions) would clobber each other's counters, which is the exact shared-path failure
# the sharding is guarding against.
if [ -n "$FUZZ_OUT" ]; then
  OUT="$FUZZ_OUT"; mkdir -p "$OUT"
else
  TMPD="$(mktemp -d)"; trap 'rm -rf "$TMPD"' EXIT; OUT="$TMPD"
fi
rm -f "$OUT"/fuzz_*.json "$OUT"/fuzz_*.log "$OUT/pre.json" "$OUT/pre.txt" "$OUT/runshard.sh" "$OUT/shardlist"

# 1. pre-blocks, ONCE, synchronously, before any worker starts. They feed `pre`; running
#    them in all N shards would count them N times. The baseline is proven self-stable
#    here, before anything diffs.
set +e
node "$JS" "$CAND" ${BASE:+"$BASE"} ${LAT:+--lattice "$LAT"} --pre --out "$OUT/pre.json" > "$OUT/pre.txt" 2>&1
PRC=$?
set -e
cat "$OUT/pre.txt"
[ $PRC -eq 0 ] || exit $PRC
[ -s "$OUT/pre.json" ] || { echo "FUZZ ABORT: pre stage wrote no counters"; exit 1; }

# 2. fan out the config loop. One result file per shard, never a shared path.
cat > "$OUT/runshard.sh" <<'WORKER'
#!/usr/bin/env bash
set -eo pipefail
node "$FUZZ_JS" "$FUZZ_CAND" ${FUZZ_BASE:+"$FUZZ_BASE"} ${FUZZ_LAT:+--lattice "$FUZZ_LAT"} \
  --shard "$1/$FUZZ_N" --out "$FUZZ_OUTDIR/fuzz_$1.json" > "$FUZZ_OUTDIR/fuzz_$1.log" 2>&1 || true
exit 0
WORKER
chmod +x "$OUT/runshard.sh"
i=0; while [ "$i" -lt "$N" ]; do printf '%s\0' "$i" >> "$OUT/shardlist"; i=$((i+1)); done
FUZZ_JS="$JS" FUZZ_CAND="$CAND" FUZZ_BASE="$BASE" FUZZ_LAT="$LAT" FUZZ_N="$N" FUZZ_OUTDIR="$OUT" \
  xargs -0 -n 1 -P "$JOBS" "$OUT/runshard.sh" < "$OUT/shardlist"

# 3. merge. Missing or unreadable shard file = exit 3, never a quiet short sum.
set +e
node "$JS" --merge "$OUT" --shards "$N" ${LAT:+--lattice "$LAT"}
RC=$?
set -e
if [ $RC -gt 1 ]; then
  for f in "$OUT"/fuzz_*.log; do
    if [ -s "$f" ]; then echo "--- $(basename "$f") ---"; tail -20 "$f"; fi
  done
fi
exit $RC
