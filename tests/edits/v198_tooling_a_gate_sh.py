#!/usr/bin/env python3
# TOOLING PASS V198 slice A, edit 1 of 2. NOT an app change: index.html is untouched and
# ia-version stays 198.
#
# gate.sh grades a gate on `^PASS n FAIL n` only. g197d prints an honest `REFUSED n` bucket
# for an assertion it COULD NOT PUT, and the runner could not see it: a refusal was green.
# RULED (Mario, V198): a refusal BLOCKS. A claim that did not run is not a pass. That is the
# whole reason the refusal was built loud rather than silent.
#
# Also fixes the §12 failure-detail defect in the same three lines: the detail grep was
# `^FAIL`, but 10 of 23 gates print an INDENTED `  FAIL `, so a real failure exited 1 with no
# detail lines at all. `^[[:space:]]*FAIL` reads both styles. The other §12 item, `|| true` in
# the worker, is NOT fixed: it is load-bearing by design (comment at line 58-62 — a nonzero
# worker makes xargs return 1 and `set -e` aborts before a single result is graded).
import io, sys, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/tests/gate.sh')
s = P.read_text(encoding='utf-8')
edits = []

OLD1 = """    echo "   $(basename "$g"): $SUMMARY"
    FAILS="$(echo "$SUMMARY" | awk '{print $4}')"
    [ "$FAILS" = "0" ] || { grep -E '^FAIL' "$GOUT" | head -40; exit 1; }
"""
NEW1 = """    # A REFUSED assertion is one that could not be PUT, announced by name. Mario ruled
    # (V198) that a refusal BLOCKS: a claim that did not run is not a pass, which is the
    # whole reason the refusal bucket is printed loudly instead of swallowed. It is echoed
    # beside the summary and it exits 1, exactly like a FAIL. Do not soften it to a warning.
    REFUSED="$(grep -cE '^REFUSED' "$GOUT" || true)"
    if [ "$REFUSED" != "0" ]; then
      echo "   $(basename "$g"): $SUMMARY  REFUSED (blocking)"
    else
      echo "   $(basename "$g"): $SUMMARY"
    fi
    FAILS="$(echo "$SUMMARY" | awk '{print $4}')"
    # Gates print FAIL at column 0 (13 of them) or indented as `  FAIL ` (10 of them). An
    # anchored `^FAIL` read only the first kind, so half the suite could exit 1 with no
    # detail printed at all.
    [ "$FAILS" = "0" ] || { grep -E '^[[:space:]]*FAIL' "$GOUT" | head -40; exit 1; }
    if [ "$REFUSED" != "0" ]; then
      echo "FAIL: $(basename "$g") REFUSED an assertion: a claim that did not run is not a pass (ruled, V198)"
      grep -E '^REFUSE' "$GOUT" | head -20
      exit 1
    fi
"""
edits.append((OLD1, NEW1))

for old, new in edits:
    n = s.count(old)
    assert n == 1, 'anchor count %d (want 1): %r' % (n, old[:90])
    s = s.replace(old, new, 1)

P.write_text(s, encoding='utf-8')
print('gate.sh: %d replacement(s) applied' % len(edits))
