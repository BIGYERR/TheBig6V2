#!/usr/bin/env bash
# Iron Asylum — TIMING PASS Part B (measure only, read-only).
# Wall-clock account of the verification chain at ia-version 196 (git 3f5d792, tag V196).
#
# NAMING: artifacts are v197_* because Part A will instrument the V197 push. The brief's
# "v195" naming predates V195/V196 shipping; a v195 script timing a V196 tree is the
# label-lag CLAUDE.md warns about.
# BASELINE: /tmp/base_V195.html (git show V195:index.html), not base_V194 — V195 is the
# actual previous version of the tree being timed.
#
# Standing rules honoured here (CLAUDE.md §10b):
#   - every measured command runs as  bash -c 'set -eo pipefail; …'  with ';' separators
#   - no process substitution; temp files only
#   - artifacts deleted before regeneration
#   - a step that printed NOTHING is reported as NO-OUTPUT (a FAILED measurement),
#     never as zero seconds
# This script never writes to index.html, a gate, a sabotage spec or the handoff.
set -eo pipefail

ROOT=/Users/CanasBangin/Desktop/TheBig6V2
CAND="$ROOT/index.html"
BASE=/tmp/base_V195.html
LOG="$ROOT/tests/measure/v197_timing.log"
TMPD=/tmp/v197_timing
SUMMARY="$TMPD/summary.tsv"

rm -rf "$TMPD"; mkdir -p "$TMPD"
rm -f "$LOG"; : > "$LOG"
rm -f "$SUMMARY"; : > "$SUMMARY"

log(){ printf '%s\n' "$*" | tee -a "$LOG"; }

# timed <label> <command string>  -> runs under /usr/bin/time -p, records real/rc/output size
timed(){
  local label="$1"; shift
  local cmdstr="$1"
  local o="$TMPD/$label.out" t="$TMPD/$label.time"
  rm -f "$o" "$t"
  local rc=0
  set +e
  /usr/bin/time -p bash -c "set -eo pipefail; $cmdstr" > "$o" 2> "$t"
  rc=$?
  set -e
  local real user sys bytes status
  real="$(grep -E '^[[:space:]]*real' "$t" | awk '{print $2}' | tail -1)"
  user="$(grep -E '^[[:space:]]*user' "$t" | awk '{print $2}' | tail -1)"
  sys="$(grep -E '^[[:space:]]*sys' "$t"  | awk '{print $2}' | tail -1)"
  bytes="$(wc -c < "$o" | tr -d ' ')"
  status=OK
  [ -z "$real" ] && status=TIME-MISSING
  if [ "$bytes" = "0" ]; then
    # stderr may legitimately carry the output; count non-time stderr bytes
    local ebytes
    ebytes="$(grep -vE '^[[:space:]]*(real|user|sys)[[:space:]]' "$t" | wc -c | tr -d ' ')"
    [ "$ebytes" = "0" ] && status=NO-OUTPUT-FAILED-MEASUREMENT
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$label" "${real:-NA}" "$rc" "$bytes" "$status" "${user:-NA}/${sys:-NA}" >> "$SUMMARY"
  log "[$label] real=${real:-NA}s rc=$rc stdout_bytes=$bytes status=$status"
}

log "=== v197_timing.sh  $(date -u '+%Y-%m-%dT%H:%M:%SZ')  (measure only, nothing is written to the app) ==="
log ""

# ---------------------------------------------------------------- 1. machine
log "== STEP 1  machine"
log "cpus            $( (nproc 2>/dev/null || sysctl -n hw.ncpu) )"
log "cpu_brand       $(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo NA)"
log "node            $(node --version)"
log "python3         $(python3 --version 2>&1)"
log "bash            $BASH_VERSION"
log "index.html      $(wc -c < "$CAND" | tr -d ' ') bytes   ia-version $(grep -oE '<meta name="ia-version" content="[0-9]+"' "$CAND" | grep -oE '[0-9]+' | tail -1)"
log "baseline        $BASE  $(wc -c < "$BASE" | tr -d ' ') bytes   ia-version $(grep -oE '<meta name="ia-version" content="[0-9]+"' "$BASE" | grep -oE '[0-9]+' | tail -1)"
log "gate files      $(ls "$ROOT"/tests/gates/*.js | wc -l | tr -d ' ')"
NEWEST_SPEC="$(ls "$ROOT"/tests/sabotage/v*.json | sort -V | tail -1)"
MUTS="$(python3 -c "import json,sys; d=json.load(open('$NEWEST_SPEC')); print(len(d))")"
log "newest spec     $(basename "$NEWEST_SPEC")  $MUTS mutations"
log "git HEAD        $(git -C "$ROOT" rev-parse --short HEAD)  tags: $(git -C "$ROOT" tag --points-at HEAD | tr '\n' ' ')"
log ""

# ---------------------------------------------------------------- 2. one VM boot
log "== STEP 2  one VM boot (harness load of index.html)"
timed vm_boot "node -e \"const {load}=require('$ROOT/tests/harness.js'); const IA=load('$CAND'); console.log('vm_boot ok ia-version '+IA.version+' buildProgram '+typeof IA.buildProgram);\""
cat "$TMPD/vm_boot.out" | tee -a "$LOG"
# 2b: split the 0.1s-class number into node process floor vs in-process VM work.
#     `node -e 0` is the floor every one of the 34 gate invocations below pays before
#     a single line of app code is compiled.
timed node_floor "node -e \"console.log('floor');\""
timed vm_boot_split "node -e \"const t0=Date.now(); const H=require('$ROOT/tests/harness.js'); const t1=Date.now(); const IA=H.load('$CAND'); const t2=Date.now(); const cfg=IA.fixtures.HALF_MANNY; const s=Date.now(); for(let i=0;i<20;i++){const p=IA.buildProgram(cfg); H.progDigest(p); H.weekGrid(p,{showRest:true});} const e=Date.now(); console.log('require_ms '+(t1-t0)+'  vm_load_ms '+(t2-t1)+'  build+digest+grid_ms_per_config '+((e-s)/20).toFixed(2));\""
cat "$TMPD/vm_boot_split.out" | tee -a "$LOG"
log ""

# ---------------------------------------------------------------- 3. each gate alone
for SIDE in candidate baseline; do
  if [ "$SIDE" = candidate ]; then TARGET="$CAND"; else TARGET="$BASE"; fi
  log "== STEP 3  each gate alone — $SIDE ($TARGET)"
  log "gate                               PASS/FAIL          real_s  exit"
  for g in "$ROOT"/tests/gates/*.js; do
    gn="$(basename "$g" .js)"
    lbl="gate_${SIDE}_${gn}"
    timed "$lbl" "node '$g' '$TARGET'" > /dev/null
    line="$(grep -hE '^PASS [0-9]+ FAIL [0-9]+' "$TMPD/$lbl.out" "$TMPD/$lbl.time" 2>/dev/null | tail -1 || true)"
    [ -z "$line" ] && line="NO-SUMMARY(crash or NO-OUTPUT)"
    rc="$(awk -F'\t' -v l="$lbl" '$1==l{print $3}' "$SUMMARY" | tail -1)"
    rl="$(awk -F'\t' -v l="$lbl" '$1==l{print $2}' "$SUMMARY" | tail -1)"
    st="$(awk -F'\t' -v l="$lbl" '$1==l{print $5}' "$SUMMARY" | tail -1)"
    printf '%-34s %-18s %7s  %s  %s\n' "$gn" "$line" "$rl" "$rc" "$st" | tee -a "$LOG"
  done
  log ""
done

# ---------------------------------------------------------------- 4. gate.sh e2e
log "== STEP 4  tests/gate.sh end to end (candidate vs V195 baseline)"
timed gate_sh_e2e "cd '$ROOT'; tests/gate.sh '$CAND' '$BASE'"
tail -6 "$TMPD/gate_sh_e2e.out" | tee -a "$LOG"
log ""

# ---------------------------------------------------------------- 5. sabotage e2e
log "== STEP 5  tests/sabotage.py end to end ($(basename "$NEWEST_SPEC"), $MUTS mutations)"
timed sabotage_e2e "cd '$ROOT'; python3 tests/sabotage.py '$CAND' '$NEWEST_SPEC'"
tail -6 "$TMPD/sabotage_e2e.out" | tee -a "$LOG"
log "NOTE: sabotage.py prints status/name/gate-summary per mutation and NO per-mutation"
log "      wall clock. It was NOT modified to add one. Per-mutation cost below is the"
log "      e2e total divided by $MUTS, which is an average, not a measurement."
log ""

# ---------------------------------------------------------------- 6. fuzz lattice
log "== STEP 6  identity fuzz lattice (tests/measure/v195_gk_identity_fuzz.js), index.html on both sides"
log "      self-identity run: candidate == baseline == index.html, which is also the"
log "      'prove the baseline equals itself' step the real gatekeeper run does first."
timed fuzz_lattice "node '$ROOT/tests/measure/v195_gk_identity_fuzz.js' '$CAND' '$CAND'"
tail -6 "$TMPD/fuzz_lattice.out" | tee -a "$LOG"
log ""

# ---------------------------------------------------------------- 7. deploy loop (READ ONLY, pushes nothing)
log "== STEP 7  deploy loop probes (read only — nothing is pushed, nothing is built)"
timed pages_api_call "gh api repos/bigyerr/TheBig6V2/pages/builds/latest --jq '.status, .commit'"
cat "$TMPD/pages_api_call.out" | tee -a "$LOG"
timed live_curl "curl -s \"https://bigyerr.github.io/TheBig6V2/?cb=\$(date +%s)\" | grep -oE 'content=\"[0-9]+\"' | head -1"
cat "$TMPD/live_curl.out" | tee -a "$LOG"
log ""

log "== RAW SUMMARY (label  real_s  rc  stdout_bytes  status  user/sys)"
cat "$SUMMARY" | tee -a "$LOG"
log ""
log "=== done  $(date -u '+%Y-%m-%dT%H:%M:%SZ') ==="
