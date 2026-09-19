#!/usr/bin/env python3
"""V198 tooling pass, slice C. TESTS ONLY — index.html is not touched, ia-version stays 198.

Item 3 of 3 in the NEXT TOOLING PASS list: g197d_d84_base carried ZERO mutation
coverage. sabotage.py runs `node <gate> <mutated.html>` with no argv[3], and every
app-grading assertion in this file sat behind `if (BASE_HTML)`, so under sabotage the
file printed PASS 1 FAIL 0 and graded nothing at all.

Gatekeeper's ruling, Mario concurring: fix it as a PAIR.
  EDIT 1  move the E5 sha256 pin on capSessionBudget's own slice OUTSIDE the baseline
          branch. It stopped needing a baseline when D85 re-pinned it to licensed TEXT.
  EDIT 2  update the liveness guard AND the header contract together. Moving E5 out
          takes the no-baseline count from 1 to 2. The number is NOT simply relaxed:
          done() now refuses any summary that put fewer than NOBASE_MIN assertions, by
          name, as a FAIL. A short count is the symptom, so the count is asserted.
  EDIT 3  (separate script) the mutation that trips E5 by name under sabotage.py.
"""
import io, sys, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g197d_d84_base.js')
src = P.read_text(encoding='utf-8')
orig = src

REPL = []

# ── 1. header: the assertion census ────────────────────────────────────────────────
REPL.append((
"""// identical to it (E5 × 3). Six assertions: those five, which are baseline-only, plus E0,
// a guard that needs no baseline and runs on every invocation.""",
"""// identical to it (E5 × 2). Six assertions. FOUR need a baseline: E1g, E1h and the two
// E5 byte-identity parts. TWO need none and run on every invocation: E0, the liveness
// guard, and the E5 sha256 pin on capSessionBudget's own slice, which reads the candidate
// alone and is this file's only sabotage coverage of the app.""",
))

# ── 2. header: what does and does not run with no baseline ─────────────────────────
REPL.append((
"""// WITH NO BASELINE THE FIVE COMPARISON ASSERTIONS DO NOT RUN, ON PURPOSE. tests/sabotage.py
// runs `node <gate> mutated.html` with no argv[3], so under sabotage this file prints its
// two "not run" lines and E1g/E1h/E5 are skipped. Every mutation that used to trip
// section E is re-pointed at g197c_d84_cmp.js, so this file still carries no sabotage
// coverage of the app.""",
"""// WITH NO BASELINE THE FOUR COMPARISON ASSERTIONS DO NOT RUN, ON PURPOSE. tests/sabotage.py
// runs `node <gate> mutated.html` with no argv[3], so under sabotage E1g, E1h and the two
// E5 byte-identity parts are skipped and this file prints their "not run" lines. The
// mutations that used to trip section E's comparisons stay pointed at g197c_d84_cmp.js.
//
// THE E5 DIGEST PIN IS NOT ONE OF THEM (V198 tooling, item 3 of 3). It stopped needing a
// baseline when D85 re-pinned it to LICENSED TEXT: it is a sha256 of capSessionBudget's
// own slice, answered by the candidate alone. It is therefore OUTSIDE the baseline branch
// and runs on every invocation, which closes a real hole — until this change every
// app-grading assertion in this file sat behind if (BASE_HTML), so under sabotage the file
// graded nothing and printed a green summary no matter what the mutation did. The move is
// PAIRED with a mutation, because coverage that is assumed is not coverage:
// tests/sabotage/v198.json M7 is a COMMENT-ONLY edit inside capSessionBudget that trips E5
// by name. Comment-only on purpose — it proves E5 sees an EDIT to the licensed text rather
// than a change in behaviour, under the harness that could not reach it at all before.""",
))

# ── 3. header: the contract, and how the guard still catches a dead body ───────────
REPL.append((
"""// WHAT IT MUST NEVER PRINT IS `PASS 0 FAIL 0`. gate.sh reads a MISSING summary as a crash,
// but it reads a summary of zero as green, and a zero summary is indistinguishable from a
// gate whose body was deleted. E0 therefore runs on every invocation, with or without a
// baseline: it needs no second artifact, it is answered by the lattice this file builds
// for itself, and it fails loudly if that enumeration is ever cut down. Under sabotage
// this file prints PASS 1 FAIL 0.""",
"""// WHAT IT MUST NEVER PRINT IS `PASS 0 FAIL 0`. gate.sh reads a MISSING summary as a crash,
// but it reads a summary of zero as green, and a zero summary is indistinguishable from a
// gate whose body was deleted. E0 therefore runs on every invocation, with or without a
// baseline: it needs no second artifact, it is answered by the lattice this file builds
// for itself, and it fails loudly if that enumeration is ever cut down.
//
// E0 IS NOW TWO PARTS, because moving E5 out took the no-baseline count from 1 to 2 and a
// changing PASS count is exactly what once masked a dead gate body. The number is not
// relaxed, it is ASSERTED: done() computes how many assertions were actually PUT (passed,
// failed or refused) and fails by name if that is below NOBASE_MIN, the two that need no
// baseline (E0 and the E5 digest pin). A body that stops executing anywhere above done()
// now produces a NAMED red instead of a shorter green, whichever assertions went missing —
// including the case E0's own lattice claim cannot see, where E0 passes and everything
// after it is gone. Under sabotage this file prints PASS 2 FAIL 0; PASS 1, PASS 0 and a
// missing summary are all red.""",
))

# ── 4. the floor's constant, declared with the counters it guards ──────────────────
REPL.append((
"""let pass = 0, fail = 0, refused = 0;""",
"""let pass = 0, fail = 0, refused = 0;
// The number of assertions this file puts with NO baseline at all: E0 (the lattice
// enumeration) and the E5 sha256 pin on capSessionBudget. Both are answered by the
// candidate alone. done() enforces it as a floor; see the E0 note in the header.
const NOBASE_MIN = 2;""",
))

# ── 5. the floor itself, in done(), before the summary it protects ─────────────────
REPL.append((
"""function done() {
  cleanup();
  if (refused) console.log""",
"""function done() {
  cleanup();
  // E0, second part: the LIVENESS FLOOR. A summary is only worth reading if the body that
  // produced it ran. This file always PUTS at least NOBASE_MIN assertions, because neither
  // of them needs a second artifact, so a shorter count means assertions stopped executing.
  // That is the failure a summary of zero cannot express on its own, and the failure a
  // count that is merely adjusted upward would hide.
  const putN = pass + fail + refused;
  if (putN < NOBASE_MIN) {
    fail++;
    console.log('FAIL E0 liveness floor: only ' + putN + ' assertion(s) were put, minimum '
      + NOBASE_MIN + ' (E0 lattice enumeration, E5 capSessionBudget digest pin) — neither '
      + 'needs a baseline, so the gate body stopped executing');
  }
  if (refused) console.log""",
))

# ── 6. E5's digest pin leaves the baseline branch ──────────────────────────────────
REPL.append((
"""if (BASE_HTML) {
  const B = fs.readFileSync(BASE_HTML, 'utf8');
  const slice = (src, start, end) => { const a = src.indexOf(start); if (a < 0) return null;
    const b = src.indexOf(end, a); return b < 0 ? null : src.slice(a, b); };
""",
"""  // NO BASELINE BRANCH AROUND THE DIGEST PIN. The sha256 below is answered by the
  // candidate alone, so it runs on every invocation — including sabotage.py's
  // `node <gate> mutated.html`, which passes no argv[3]. This is the one app-grading
  // assertion in this file a mutation can reach.
  const slice = (src, start, end) => { const a = src.indexOf(start); if (a < 0) return null;
    const b = src.indexOf(end, a); return b < 0 ? null : src.slice(a, b); };
""",
))

# ── 7. the byte-identity parts keep their baseline branch, opened here ─────────────
REPL.append((
"""  const PARTS = [
    ['_itemCost',""",
"""  // The remaining two E5 parts DO need a second artifact: they are byte comparisons
  // against the shipped baseline, so they stay behind BASE_HTML and stay unreachable
  // from sabotage.py by construction.
  if (BASE_HTML) {
  const B = fs.readFileSync(BASE_HTML, 'utf8');
  const PARTS = [
    ['_itemCost',""",
))

# ── 8. the else arm names what is skipped now that the pin is not ──────────────────
REPL.append((
"""} else {
  console.log('   -- E5 not run: no baseline argv[3]');
}""",
"""} else {
  console.log('   -- E5 _itemCost/_setCount byte-identity not run: no baseline argv[3] '
    + '(the E5 capSessionBudget digest pin above needs none and DID run)');
}""",
))

for i, (a, b) in enumerate(REPL, 1):
    n = src.count(a)
    if n != 1:
        sys.stderr.write('ABORT: replacement %d anchor count==%d, expected 1\n--- anchor ---\n%s\n' % (i, n, a))
        sys.exit(1)
    src = src.replace(a, b, 1)

if src == orig:
    sys.stderr.write('ABORT: no change\n'); sys.exit(1)
P.write_text(src, encoding='utf-8')
print('wrote %s  (%d bytes -> %d bytes, %d replacements)' % (P, len(orig), len(src), len(REPL)))
