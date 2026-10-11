#!/usr/bin/env python3
# post_v239_semver_fix2_rowkey.py — Post-V239 semver pass, fix 2 (tests only, no build).
#
# FINDING (gatekeeper dry run of 0.239.1, step 4b): 23 fallback-keyed rows vanished and 23 appeared, paired 1:1 in 12
# gates. rows.js keys an id-less status line as L:<8 hex> of its normalized label; the digit rule
# (`\d+(?:\.\d+)?` -> <n>) turns "ia-version 239" into "<n>" but "0.239.1" into "<n>.<n>", so the key moves once, at
# the first dotted release.
#
# RULING (main session, tooling shape): in fallbackLabel(), a whole dotted version (`\b[vV]?\d+\.\d+\.\d+\b`) collapses
# to a single <n> BEFORE the general digit rule runs, so a label printing 0.239.1 keys exactly as the same label
# printing 239 does today. No other change to the key grammar. The FALLBACK KEYS comment gains one sentence saying a
# dotted version normalizes like an integer.
#
# RULING AMENDED (main session, after builder measured the ruled regex on the dry run): the ruled regex swallowed a
# leading V, so `'V' + IA.version` (g203_mile_pencil.js, "pinned to the V0.239.1 era row") keyed `<n>` where 239 keyed
# `V<n>`, and that one row still moved (12-gate check PASS 347 FAIL 2). Land the variant that keeps the letter:
# `.replace(/\b([vV]?)\d+\.\d+\.\d+\b/g, '$1<n>')`, and word the FALLBACK KEYS row to match (a dotted version is one
# <n>, an optional V/v prefix is kept, so a label keys as it did at 239).
#
# SHAPE: one new .replace() line placed directly above the digit rule (after the quote and clock rules, which are
# untouched), and one new row in the FALLBACK KEYS table between clock values and digits (the table is in run order).
# Every anchor is a whole source line (newline-bounded), asserted count==1; nothing is written unless every one hits.
# Usage: python3 tests/edits/post_v239_semver_fix2_rowkey.py [target]   (target defaults to tests/rows.js; a copy of
# the 3e8729c rows.js may be named instead, to prove the script reproduces the landed file)
import os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
F = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, 'tests', 'rows.js')

DIGIT_LINE = "    .replace(/\\d+(?:\\.\\d+)?/g, '<n>')\n"
VERSION_LINE = "    .replace(/\\b([vV]?)\\d+\\.\\d+\\.\\d+\\b/g, '$1<n>')   // a dotted version is one <n>, a V/v prefix kept: V0.239.1 keys as V239 did\n"

DOC_DIGITS = "//   digits         every other run of digits, with its decimals                                                -> <n>\n"
ARROW = DOC_DIGITS.index('-> <n>')
DOC_VERSION_TEXT = "//   versions       a dotted version is one <n>; a V or v prefix is kept, so a label keys as it did at 239"
assert len(DOC_VERSION_TEXT) < ARROW, 'doc row text overruns the arrow column'
DOC_VERSION = DOC_VERSION_TEXT.ljust(ARROW) + "-> <n>\n"

EDITS = [
    ('FALLBACK KEYS table: versions row above digits', DOC_DIGITS, DOC_VERSION + DOC_DIGITS),
    ('fallbackLabel(): dotted-version rule above the digit rule', DIGIT_LINE, VERSION_LINE + DIGIT_LINE),
]

with open(F, 'r', encoding='utf-8') as fh:
    src = fh.read()
out = src
for name, old, new in EDITS:
    n = out.count(old)
    if n != 1:
        print('ABORT: anchor "%s" found %d times (want 1); nothing written' % (name, n))
        sys.exit(1)
    out = out.replace(old, new, 1)
for name, old, new in EDITS:
    if out.count(new) != 1:
        print('ABORT: replacement "%s" not present exactly once after the edit; nothing written' % name)
        sys.exit(1)
with open(F, 'w', encoding='utf-8') as fh:
    fh.write(out)
print('post_v239_semver_fix2_rowkey: %d edits written to %s' % (len(EDITS), os.path.relpath(F, ROOT)))
