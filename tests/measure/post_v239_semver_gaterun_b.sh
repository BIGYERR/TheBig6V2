#!/usr/bin/env bash
# Second pass of post_v239_semver_gaterun.sh, run after the first was stopped (host load average 130; g230 alone ran
# past 20 min). Usage: post_v239_semver_gaterun_b.sh <scratch> <label> <orig|wide> <239|semver>
# Runs every gate in <scratch>/gatelist_r.txt (all gates except g230_d194_lens2, pool=6, 1064 s nominal).
set -eo pipefail
S="$1"; L="$2"; HV="$3"; CV="$4"
rm -rf "$S/runs/$L"; mkdir -p "$S/runs/$L"
cp "$S/harness_$HV.js" "$S/tree/tests/harness.js"
export RT="$S/runs/$L" RC="$S/cand_$CV.html" RB="$S/base_v238.html"
xargs -n 1 -P 8 "$S/one.sh" < "$S/gatelist_r.txt"
echo "run $L done: $(ls "$S/runs/$L" | grep -c rc) gates"
