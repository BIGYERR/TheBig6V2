#!/usr/bin/env python3
# V227 build, SLICE 4 of D190 P-SWAPSEAM: four era rows in two gate files.
# Ruling: tests/measure/v227_rulings/d190_swapseam_ruling.md, RE-RULING 1 section C,
# "Era rows the build adds, all [227] = [226] by reference (standing ruling 5)".
# This slice does NOT bump ia-version (slice 2 did, 226 -> 227).
#
# Premise check, run by builder BEFORE this script, on the V227 working tree (slices 1
# and 2 landed) with these rows absent:
#   g199_deload_arbitration.js  43/13, the 13 FAILs are only the NO ROW assertions
#     (C1 C3 C5 D2 E1a E1b E2 E3 E6 G1 G2 G5 I3); computed C1 264 C3 264 C5 0 D2 19
#     I3 18; E6 28; E1a 12369 E1b 9319 E3 44 G1 1275 G5 {"Explosive finisher":44},
#     all equal to the [226] rows.
#   g219_samecard_draws.js  5/10, the 10 FAILs are only NO ERA ROW (F1 F2 R1..R8);
#     computed dup 0 li 0 tgt 0 ck 4770 ckNo 891 bic1 412 c165 0 c166 0, fixture
#     "Pec deck 3×12–15 @ RPE 6–7" with no twin, all equal to ERA[226].
#
# Discipline: literal bytes; every anchor asserted count==1 (and at its expected line)
# before any write; refuses if any [227] row already exists in either file; refuses
# unless index.html reads ia-version 227. Both files are written only after every
# check on both has passed.
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IDX = os.path.join(ROOT, 'index.html')
G199 = os.path.join(ROOT, 'tests', 'gates', 'g199_deload_arbitration.js')
G219 = os.path.join(ROOT, 'tests', 'gates', 'g219_samecard_draws.js')

def die(msg):
    sys.stderr.write('ABORT: ' + msg + '\n')
    sys.exit(1)

RULED = ("V227 (D190 P-SWAPSEAM): ruled UNMOVED, reference to [226]; the engine moves only on a "
         "config carrying `cfg.exSwapPrefs` sourced from a natively cued item under a plan with a "
         "cap, and this file's population carries none.")
PRINTED = ("printed equal to [226] on the V227 working tree (slices 1 and 2 landed) by builder "
           "with this gate before this row")

def row(name, carry):
    return name + '[227] = ' + name + '[226];   // ' + RULED + ' (' + PRINTED + '; ' + carry + ')'

# (file, the [226] row's line prefix, expected 1-based line of that row, the new row)
EDITS = [
    (G199, 'DELOAD_ARB_BY_VERSION[226] = DELOAD_ARB_BY_VERSION[225];', 175,
     row('DELOAD_ARB_BY_VERSION', 'C1 264 C3 264 C5 0 D2 19 I3 18 carry')),
    (G199, 'E6_BY_VERSION[226] = E6_BY_VERSION[225];', 178,
     row('E6_BY_VERSION', 'E6 28 carries')),
    (G199, 'DELOAD_HINGE_BY_VERSION[226] = DELOAD_HINGE_BY_VERSION[225];', 181,
     row('DELOAD_HINGE_BY_VERSION', 'E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry')),
    (G219, 'ERA[226] = ERA[225];', 147,
     row('ERA', 'dup 0 li 0 tgt 0 ck 4770 ckNo 891 bic1 412 c165 0 c166 0 and the Pec deck fixture carry')),
]

# Guard 1: index.html must read 227 (standing ruling 2: the licence is today's ia-version).
with open(IDX, 'r', encoding='utf-8') as f:
    idx = f.read()
meta = re.findall(r'<meta name="ia-version" content="(\d+)">', idx)
if meta != ['227']:
    die('index.html ia-version meta is %r, want exactly one reading 227' % (meta,))

# Guard 2: read both gate files; refuse if any [227] row already exists.
src = {}
for p in (G199, G219):
    with open(p, 'r', encoding='utf-8') as f:
        src[p] = f.read()
    if '[227]' in src[p]:
        die('%s already carries a [227] row; this slice has run or been overtaken' % os.path.basename(p))

# Guard 3: every anchor count==1, as a whole-line prefix, at its expected line. All
# checks against the PRISTINE text, before any substitution.
for p, prefix, want_line, new in EDITS:
    text = src[p]
    if text.count(prefix) != 1:
        die('%s: anchor %r count %d, want 1' % (os.path.basename(p), prefix, text.count(prefix)))
    lines = text.split('\n')
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    if len(hits) != 1:
        die('%s: anchor %r starts %d lines, want 1' % (os.path.basename(p), prefix, len(hits)))
    if hits[0] + 1 != want_line:
        die('%s: anchor %r at line %d, want %d' % (os.path.basename(p), prefix, hits[0] + 1, want_line))
    if new.count('\n') or '[227]' not in new:
        die('malformed new row for %r' % prefix)

# Apply: insert each row on the line directly after its [226] row. Applied bottom-up
# per file so earlier insertions do not shift later anchors (anchors are by prefix, so
# order only matters for the line assertion, already made above).
out = dict(src)
for p, prefix, want_line, new in sorted(EDITS, key=lambda e: -e[2]):
    lines = out[p].split('\n')
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1
    lines.insert(hits[0] + 1, new)
    out[p] = '\n'.join(lines)

# Post-conditions before writing: exactly the rows we meant, each directly after its [226] row.
for p in (G199, G219):
    want = sum(1 for e in EDITS if e[0] == p)
    if out[p].count('[227] = ') != want:
        die('%s: %d [227] rows after edit, want %d' % (os.path.basename(p), out[p].count('[227] = '), want))
    if len(out[p].split('\n')) != len(src[p].split('\n')) + want:
        die('%s: line count moved by other than %d' % (os.path.basename(p), want))
for p, prefix, want_line, new in EDITS:
    lines = out[p].split('\n')
    i = [k for k, l in enumerate(lines) if l.startswith(prefix)][0]
    if lines[i + 1] != new:
        die('%s: row for %r did not land directly after it' % (os.path.basename(p), prefix))

for p in (G199, G219):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(out[p])
for p, prefix, want_line, new in EDITS:
    lines = out[p].split('\n')
    i = [k for k, l in enumerate(lines) if l.startswith(new.split('   //')[0])][0]
    print('%s:%d  %s' % (os.path.relpath(p, ROOT), i + 1, new.split('   //')[0]))
print('OK: 4 era rows written (3 in g199_deload_arbitration.js, 1 in g219_samecard_draws.js); ia-version untouched at 227')
