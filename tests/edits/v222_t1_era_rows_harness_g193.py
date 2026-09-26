#!/usr/bin/env python3
# V222 tooling slice T1 (build 2b): era rows for ia-version 222 (D181, P-SWAPDURABLE).
# Touches ONLY tests/harness.js and tests/gates/g193_samecard.js. index.html is not touched,
# so there is no version meta bump in this script.
# D181 is session-store only: "Nothing in `buildProgram`. HALF_MANNY digest unmoved"
# (tests/measure/v212_rulings/p_swapdurable_ruling.md, and its second re-ruling).
# Each [222] row is an alias of the [221] row, ruled UNMOVED (standing ruling 5).
# Before writing, builder printed on base_V221 and the V222 working tree, with the harness
# fixtures and g199's (__DELOAD_OFF) and g200's (core clause removed) methods:
#   0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 on both trees, equal to the [221] rows.
# Every anchor is asserted count==1 before anything is written; the first miss aborts the
# whole script and neither file is written.
import sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
HARNESS = ROOT + 'tests/harness.js'
G193 = ROOT + 'tests/gates/g193_samecard.js'

HARNESS_NOTE = ('// V222 (D181): ruled UNMOVED (D181 P-SWAPDURABLE is session-store only: swap and undo '
    'resnapshot, the per-exercise Log snapshots, the swap prune is deleted, records replay per record '
    'in recording order and never onto a day restored from ia_hist_; nothing in buildProgram; standing '
    'ruling 5: the ruling and its second re-ruling (p_swapdurable_ruling.md) state HALF_MANNY '
    '0ac7da6b1691a8e1 unchanged, printed on V221 and the working tree; 0ac7da6b1691a8e1 / '
    '1069cd7f86eed204 / 9d14801a63111081 printed by builder on base_V221 and the V222 working tree '
    'with the harness fixture and g199\'s and g200\'s methods before these rows)')

G193_NOTE = ('// V222 (D181): ruled UNMOVED (D181 P-SWAPDURABLE is session-store only, adds no card and '
    'changes 0 engine cards: no hunk reaches buildProgram or anything it calls; the swing class stays a ruled 0)')

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

def insert_after_line(src, anchor, newline, label):
    n = src.count(anchor)
    if n != 1:
        die(label + ': anchor count ' + str(n) + ' != 1: ' + anchor)
    i = src.index(anchor)
    j = src.index('\n', i + len(anchor))   # end of the anchored line
    return src[:j + 1] + newline + '\n' + src[j + 1:]

h = open(HARNESS, encoding='utf-8').read()
g = open(G193, encoding='utf-8').read()

for name, src in (('harness.js', h), ('g193_samecard.js', g)):
    if '[222]' in src:
        die(name + ' already carries a [222] row')

# harness.js: three rows, each inserted directly after its [221] row.
for tab in ('MANNY_DIGEST_BY_VERSION', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION', 'MANNY_CORE_OFF_DIGEST_BY_VERSION'):
    anchor = '\n' + tab + '[221] = ' + tab + '[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED'
    row = tab + '[222] = ' + tab + '[221];   ' + HARNESS_NOTE
    h = insert_after_line(h, anchor, row, 'harness.js ' + tab)

# g193_samecard.js: one row, directly after the [221] row.
anchor = '\nOPEN_UNRULED_BY_VERSION[221] = OPEN_UNRULED_BY_VERSION[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED'
row = 'OPEN_UNRULED_BY_VERSION[222] = OPEN_UNRULED_BY_VERSION[221];   ' + G193_NOTE
g = insert_after_line(g, anchor, row, 'g193_samecard.js OPEN_UNRULED_BY_VERSION')

# post-conditions before writing
for tab in ('MANNY_DIGEST_BY_VERSION', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION', 'MANNY_CORE_OFF_DIGEST_BY_VERSION'):
    if h.count('\n' + tab + '[222] = ' + tab + '[221];') != 1:
        die('harness.js ' + tab + '[222] row did not land exactly once')
if g.count('\nOPEN_UNRULED_BY_VERSION[222] = OPEN_UNRULED_BY_VERSION[221];') != 1:
    die('g193 [222] row did not land exactly once')

open(HARNESS, 'w', encoding='utf-8').write(h)
open(G193, 'w', encoding='utf-8').write(g)
print('OK: 3 rows into tests/harness.js, 1 row into tests/gates/g193_samecard.js')
