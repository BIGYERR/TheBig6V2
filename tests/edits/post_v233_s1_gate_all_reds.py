#!/usr/bin/env python3
# post_v233_s1_gate_all_reds.py — Post-V233 tooling pass, slice 1. TESTS ONLY.
#
# THE DECISION (Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md,
# Message 1 item 1): "Kill the noise. ... Make g193 fail cleanly instead of crashing.
# Make gate.sh run every gate and report all failures at the end instead of stopping
# at the first red." CLAUDE.md rhythm step 5: "`gate.sh` reports every red, not the first."
#
# index.html is NOT touched and ia-version stays 233: there is no version bump in
# this script, so there is no meta replacement to put last.
#
# Diff classes:
#   (T-a) tests/gate.sh step 4 grades EVERY gate, collects the red names, prints
#         `GATES RED <k> of <m>: <names>`, still runs step 5, then exits 1.
#   (T-b) throw -> named FAIL + printed summary in g193_samecard (missing register
#         row), g205_d129_tiebreak and g205_d130_typed (missing source anchor in grab()).
#
# Every anchor is asserted count==1 against the text it is applied to, ALL anchors in
# ALL four files are checked before ANY file is written, and the script aborts on the
# first miss.
import sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)

EDITS = {}

# ── (T-a) tests/gate.sh ──────────────────────────────────────────────────────
EDITS[P('tests', 'gate.sh')] = [
# 1. the invariant comment that says stop-at-first-red matches the serial run
(r'''  # Run the gates across cores, then GRADE THEM SEQUENTIALLY in glob order.
  # One result file per gate, so nothing interleaves and the grader reads files,
  # not a live pipe: printed order, stop-at-first-red and exit codes are identical
  # to the serial run. Workers ALWAYS exit 0 — a red gate must reach the grader,
  # and any nonzero worker makes xargs return 1, which `set -e` would abort on
  # before a single result was read.
''',
r'''  # Run the gates across cores, then GRADE THEM SEQUENTIALLY in glob order.
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
  # then exits 1. Steps 0 to 3 still stop at once: nothing downstream of a bad
  # version, a syntax error, a new dupe or a failed boot means anything. Each
  # detail pipe ends `|| true`, because a grep that matches nothing (or a head
  # that closes early) must not let `set -e` end the grading of the gates after it.
'''),
# 2. the red list exists before step 4 so the end of the script can read it
(r'''GATES=("$HERE"/gates/*.js)
if [ ${#GATES[@]} -eq 0 ]; then echo "   (no gates yet)"; fi
''',
r'''GATES=("$HERE"/gates/*.js)
RED=()   # names of the red gates, in glob order; read after step 5 for the exit code
if [ ${#GATES[@]} -eq 0 ]; then echo "   (no gates yet)"; fi
'''),
# 3. the grading loop: every `exit 1` becomes collect-and-continue
(r'''  for g in "${GATES[@]}"; do
    GOUT="$TMP/gateout/$(basename "$g").out"
    [ -s "$GOUT" ] || { echo "FAIL: $(basename "$g") printed nothing"; exit 1; }
    SUMMARY="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$GOUT" || true)"
    [ -n "$SUMMARY" ] || { echo "FAIL: $(basename "$g") printed no PASS/FAIL summary (crash?)"; tail -20 "$GOUT"; exit 1; }
''',
r'''  for g in "${GATES[@]}"; do
    GOUT="$TMP/gateout/$(basename "$g").out"
    if [ ! -s "$GOUT" ]; then echo "FAIL: $(basename "$g") printed nothing"; RED+=("$(basename "$g")"); continue; fi
    SUMMARY="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$GOUT" || true)"
    if [ -z "$SUMMARY" ]; then echo "FAIL: $(basename "$g") printed no PASS/FAIL summary (crash?)"; tail -20 "$GOUT" || true; RED+=("$(basename "$g")"); continue; fi
'''),
(r'''    [ "$FAILS" = "0" ] || { grep -E '^[[:space:]]*FAIL' "$GOUT" | head -40; exit 1; }
    if [ "$REFUSED" != "0" ]; then
      echo "FAIL: $(basename "$g") REFUSED an assertion: a claim that did not run is not a pass (ruled, V198)"
      grep -E '^REFUSE' "$GOUT" | head -20
      exit 1
    fi
  done
fi
''',
r'''    if [ "$FAILS" != "0" ]; then grep -E '^[[:space:]]*FAIL' "$GOUT" | head -40 || true; RED+=("$(basename "$g")"); continue; fi
    if [ "$REFUSED" != "0" ]; then
      echo "FAIL: $(basename "$g") REFUSED an assertion: a claim that did not run is not a pass (ruled, V198)"
      grep -E '^REFUSE' "$GOUT" | head -20 || true
      RED+=("$(basename "$g")")
    fi
  done
  if [ ${#RED[@]} -gt 0 ]; then echo "GATES RED ${#RED[@]} of ${#GATES[@]}: ${RED[*]}"; fi
fi
'''),
# 4. step 5 runs on a red step 4; the exit code is decided after it
(r'''  cp "$TMP/diff.txt" "$HERE/../.last_diff.txt"; echo "   full diff -> .last_diff.txt"
fi

echo "ALL GATES PASS"
''',
r'''  cp "$TMP/diff.txt" "$HERE/../.last_diff.txt"; echo "   full diff -> .last_diff.txt"
fi

# Step 5 ran even if step 4 was red (its diff is still the blast radius to classify);
# the red gates decide the exit code here, and ALL GATES PASS prints only on zero reds.
if [ ${#RED[@]} -gt 0 ]; then exit 1; fi
echo "ALL GATES PASS"
'''),
]

# ── (T-b) tests/gates/g193_samecard.js ───────────────────────────────────────
EDITS[P('tests', 'gates', 'g193_samecard.js')] = [
(r'''if (!OPEN_UNRULED) throw new Error('g193: no OPEN_UNRULED_BY_VERSION row for V' + IA.version + ': an unruled register (D133)');
''',
r'''// A missing row is a NAMED FAIL with the summary printed, never a throw (post-V233, Mario:
// "Make g193 fail cleanly instead of crashing"). Nothing below can be graded without it.
if (!OPEN_UNRULED) {
  bad('G0 no OPEN_UNRULED_BY_VERSION row for V' + IA.version + ': an unruled register (D133)');
  console.log(`\nPASS ${PASS} FAIL ${FAIL}`);
  console.log('\nFAILURES:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1);
}
'''),
]

# ── (T-b) tests/gates/g205_d129_tiebreak.js ──────────────────────────────────
EDITS[P('tests', 'gates', 'g205_d129_tiebreak.js')] = [
(r'''const parts = ["const ALL_DAYS_ORDER=['sun','mon','tue','wed','thu','fri','sat'];"];
['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(src,n)));
const ctx = {out:null};
vm.runInNewContext(parts.join('\n')+'\nout={c:_nrcSpacedRunDays,gs:getSessionTypes,gn:getNRCSessionTypes,sp:isSpeedGoal};', ctx);
const E = ctx.out;
''',
r'''const parts = ["const ALL_DAYS_ORDER=['sun','mon','tue','wed','thu','fri','sat'];"];
const ctx = {out:null};
// A source anchor grab() cannot find (or cannot balance) is a NAMED FAIL with the summary
// printed, never a throw (post-V233, Mario: "Kill the noise"). Same shape as P0 above:
// no row below can run without the chooser, so the gate stops here, red and readable.
try {
  ['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(src,n)));
  vm.runInNewContext(parts.join('\n')+'\nout={c:_nrcSpacedRunDays,gs:getSessionTypes,gn:getNRCSessionTypes,sp:isSpeedGoal};', ctx);
} catch(e){
  console.log('FAIL P0b source surgery: ' + e.message + ' (the chooser cannot be extracted, so no row below can run)');
  console.log('PASS 0 FAIL 1');
  process.exit(1);
}
const E = ctx.out;
'''),
]

# ── (T-b) tests/gates/g205_d130_typed.js ─────────────────────────────────────
EDITS[P('tests', 'gates', 'g205_d130_typed.js')] = [
(r'''const parts=['const ALL_DAYS_ORDER='+JSON.stringify(DAYS)+';'];
['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(SRC,n)));
const ctx={out:null};vm.runInNewContext(parts.join('\n')+'\nout={c:_nrcSpacedRunDays,gs:getSessionTypes};',ctx);
const ENG=ctx.out.c;
''',
r'''const parts=['const ALL_DAYS_ORDER='+JSON.stringify(DAYS)+';'];
const ctx={out:null};
// A source anchor grab() cannot find (or cannot balance) is a NAMED FAIL with the summary
// printed, never a throw (post-V233, Mario: "Kill the noise"). The row prints only when
// it fails, so a green run's output is unchanged.
try {
  ['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(SRC,n)));
  vm.runInNewContext(parts.join('\n')+'\nout={c:_nrcSpacedRunDays,gs:getSessionTypes};',ctx);
} catch(e){ ok('S0 the chooser extracts from the source (isSpeedGoal, getNRCSessionTypes, getSessionTypes, _nrcSpacedRunDays)', false, e.message); summary(1); }
const ENG=ctx.out.c;
'''),
]

# ── check everything, then write everything ──────────────────────────────────
OUT = {}
for f, reps in EDITS.items():
    with open(f, 'r', encoding='utf-8') as fh:
        t = fh.read()
    for i, (old, new) in enumerate(reps):
        n = t.count(old)
        if n != 1:
            sys.exit('ABORT: %s anchor %d count=%d (need 1); nothing written' % (os.path.relpath(f, ROOT), i + 1, n))
        t = t.replace(old, new, 1)
        if t.count(new) != 1:
            sys.exit('ABORT: %s replacement %d did not land exactly once; nothing written' % (os.path.relpath(f, ROOT), i + 1))
    OUT[f] = t
for f, t in OUT.items():
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(t)
    print('wrote', os.path.relpath(f, ROOT))
print('done: %d files, %d replacements, index.html untouched' % (len(OUT), sum(len(r) for r in EDITS.values())))
