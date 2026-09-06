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

echo "== 3. boot + self-stable baseline"
node "$HERE/harness.js" "$CAND" | tee "$TMP/boot.txt"
grep -q 'self-stable yes' "$TMP/boot.txt" || { echo "FAIL: build is not reproducible on a pinned seed"; exit 1; }

echo "== 4. behavioral gates (tests/gates/*.js)"
shopt -s nullglob
GATES=("$HERE"/gates/*.js)
if [ ${#GATES[@]} -eq 0 ]; then echo "   (no gates yet)"; fi
for g in "${GATES[@]}"; do
  rm -f "$TMP/gate.out"
  node "$g" "$CAND" ${BASE:+"$BASE"} > "$TMP/gate.out" 2>&1 || true
  [ -s "$TMP/gate.out" ] || { echo "FAIL: $(basename "$g") printed nothing"; exit 1; }
  SUMMARY="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$TMP/gate.out" || true)"
  [ -n "$SUMMARY" ] || { echo "FAIL: $(basename "$g") printed no PASS/FAIL summary (crash?)"; tail -20 "$TMP/gate.out"; exit 1; }
  echo "   $(basename "$g"): $SUMMARY"
  FAILS="$(echo "$SUMMARY" | awk '{print $4}')"
  [ "$FAILS" = "0" ] || { grep -E '^FAIL' "$TMP/gate.out" | head -40; exit 1; }
done

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

echo "ALL GATES PASS"
