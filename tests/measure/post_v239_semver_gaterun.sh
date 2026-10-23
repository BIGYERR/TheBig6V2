#!/usr/bin/env bash
# Post-V239 semver before-picture, dynamic half (measure, read-only).
# Usage: post_v239_semver_gaterun.sh <worktree> <scratch> <base.html>
#   <base.html> = the V238 index.html as released (a legacy integer baseline, as a real proof passes one).
# Copies the tree to <scratch>/tree, writes a 0.239.1-relabelled candidate, and runs every tests/gates/*.js directly
# (node gate cand base, -P 8) four ways:
#   R0  harness as shipped, candidate 239                  (control)
#   R1  harness as shipped, candidate 0.239.1              (what happens today)
#   R2c harness meta regex widened to [^"]+, cand 239      (proves the widening is neutral: must equal R0)
#   R2s harness meta regex widened to [^"]+, cand 0.239.1  (each gate's own reads, once harness lets the string through)
set -eo pipefail
WT="$1"; S="$2"; BASE="$3"
rm -rf "$S/tree" "$S/runs"; mkdir -p "$S/runs"
rsync -a --exclude node_modules --exclude app --exclude backend --exclude worktrees "$WT/" "$S/tree/"
cp "$WT/index.html" "$S/cand_239.html"
sed 's/<meta name="ia-version" content="239">/<meta name="ia-version" content="0.239.1">/' "$WT/index.html" > "$S/cand_semver.html"
echo "semver meta lines: $(grep -c 'content="0.239.1"' "$S/cand_semver.html")"
cp "$S/tree/tests/harness.js" "$S/harness_orig.js"
sed 's|content="(\\d+)"/|content="([^"]+)"/|' "$S/harness_orig.js" > "$S/harness_wide.js"
echo "widened harness lines changed: $(diff "$S/harness_orig.js" "$S/harness_wide.js" | grep -c '^>' || true)"
printf '%s\n' '#!/usr/bin/env bash' 'b=$(basename "$1" .js); rc=0; node "$1" "$RC" "$RB" > "$RT/$b.out" 2>&1 || rc=$?; echo $rc > "$RT/$b.rc"' > "$S/one.sh"; chmod +x "$S/one.sh"
for g in "$S/tree/tests/gates/"*.js; do echo "$g"; done > "$S/gatelist.txt"
for spec in "R0 orig 239" "R1 orig semver" "R2c wide 239" "R2s wide semver"; do
  set -- $spec
  mkdir -p "$S/runs/$1"
  cp "$S/harness_$2.js" "$S/tree/tests/harness.js"
  export RT="$S/runs/$1" RC="$S/cand_$3.html" RB="$BASE"
  xargs -n 1 -P 8 "$S/one.sh" < "$S/gatelist.txt"
  echo "run $1 done: $(ls "$S/runs/$1"/*.out | wc -l) gates"
done
cp "$S/harness_orig.js" "$S/tree/tests/harness.js"
echo ALLDONE
