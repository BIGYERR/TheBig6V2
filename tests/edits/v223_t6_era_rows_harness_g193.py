#!/usr/bin/env python3
# V223 tooling slice T6 (build 3): era rows for ia-version 223 (D182 P-RACEDATE, D183 P-SAFEPACE,
# D184 P-TESTLEN). Touches ONLY tests/harness.js and tests/gates/g193_samecard.js. index.html is
# not touched, so there is no version meta bump in this script.
# D182 amendment (a) (tests/measure/v223_rulings/p_racedate_ruling.md, "## D182 AMENDMENT (a)"):
#   "Era rows owed by V223: MANNY_DIGEST_BY_VERSION[223] = [222], MANNY_DELOAD_OFF_DIGEST_BY_VERSION[223]
#   = [222], MANNY_CORE_OFF_DIGEST_BY_VERSION[223] = [222]"; (iv) withdrawn into §12 debt.
# D183 (tests/measure/v223_rulings/p_safepace_ruling.md, "What does not change" and amendment 2):
#   HALF_MANNY is NRC and never reaches the wizard cardio_goal card; digest 0ac7da6b1691a8e1 unchanged.
# D184 (tests/measure/v223_rulings/p_testlen_d184_ruling.md): "HALF_MANNY 0ac7da6b1691a8e1, unchanged
#   by every slice (M7/M8 0/210 race and run_base builds move); no era row owed" beyond the alias.
# Each [223] row is an alias of the [222] row, ruled UNMOVED (standing ruling 5).
# Before writing, builder printed on base_V222 and the V223 working tree snapshot (D182 S1–S3,
# D183, D184 (a)(b) landed; ia-version 222 stamp and the as223 restamp), with the harness fixture
# and g199's (__DELOAD_OFF) and g200's (core clause removed) methods, baseline self-equal:
#   0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 on every tree, equal to the [222] rows.
# Every anchor is a whole [222] line asserted count==1 before anything is written; no [223] row
# may exist yet; the first miss aborts the whole script and neither file is written.
import sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
HARNESS = ROOT + 'tests/harness.js'
G193 = ROOT + 'tests/gates/g193_samecard.js'

# The [222] notes exactly as tests/edits/v222_t1_era_rows_harness_g193.py wrote them (whole-line anchors).
V222_HARNESS_NOTE = ('// V222 (D181): ruled UNMOVED (D181 P-SWAPDURABLE is session-store only: swap and undo '
    'resnapshot, the per-exercise Log snapshots, the swap prune is deleted, records replay per record '
    'in recording order and never onto a day restored from ia_hist_; nothing in buildProgram; standing '
    'ruling 5: the ruling and its second re-ruling (p_swapdurable_ruling.md) state HALF_MANNY '
    '0ac7da6b1691a8e1 unchanged, printed on V221 and the working tree; 0ac7da6b1691a8e1 / '
    '1069cd7f86eed204 / 9d14801a63111081 printed by builder on base_V221 and the V222 working tree '
    'with the harness fixture and g199\'s and g200\'s methods before these rows)')

V222_G193_NOTE = ('// V222 (D181): ruled UNMOVED (D181 P-SWAPDURABLE is session-store only, adds no card and '
    'changes 0 engine cards: no hunk reaches buildProgram or anything it calls; the swing class stays a ruled 0)')

HARNESS_NOTE = ('// V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display; its amendment (a) '
    '(p_racedate_ruling.md) rules "D182: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 '
    'printed by coach on the V222 tree with S1–S3 landed; (iv) withdrawn, see §12)"; D183 P-SAFEPACE is the '
    'wizard cardio_goal step, and its ruling and amendment 2 (p_safepace_ruling.md) state HALF_MANNY is NRC, never '
    'reaches that card, digest 0ac7da6b1691a8e1 unchanged; D184 P-TESTLEN pins dated test goals to their test '
    'week in the resolver, never NRC, and its ruling (v223_rulings/p_testlen_d184_ruling.md) states HALF_MANNY '
    '0ac7da6b1691a8e1 unchanged by every slice, M7/M8 0/210 race and run_base builds move; standing ruling 5: '
    '0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on base_V222 and the V223 working '
    'tree (D182 S1–S3, D183, D184 (a)(b) landed) with the harness fixture and g199\'s and g200\'s methods before '
    'these rows)')

G193_NOTE = ('// V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display, D183 P-SAFEPACE is the '
    'wizard cardio_goal step, D184 P-TESTLEN pins dated test goals to their test week in the resolver; none adds '
    'a card and together they change 0 engine cards on this class: buildProgram is deliberately unchanged in '
    'p_racedate_ruling.md amendment (a), p_safepace_ruling.md amendment 2 and p_testlen_d184_ruling.md, and all '
    'three state HALF_MANNY 0ac7da6b1691a8e1 unchanged; the swing class stays a ruled 0)')

TABS = ('MANNY_DIGEST_BY_VERSION', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION', 'MANNY_CORE_OFF_DIGEST_BY_VERSION')

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

def insert_after_line(src, line, newline, label):
    anchor = '\n' + line + '\n'          # the whole [222] line, nothing more, nothing less
    n = src.count(anchor)
    if n != 1:
        die(label + ': whole-line anchor count ' + str(n) + ' != 1: ' + line[:120])
    j = src.index(anchor) + len(anchor)  # just past the anchored line's newline
    return src[:j] + newline + '\n' + src[j:]

h = open(HARNESS, encoding='utf-8').read()
g = open(G193, encoding='utf-8').read()

for name, src in (('harness.js', h), ('g193_samecard.js', g)):
    if '[223]' in src:
        die(name + ' already carries a [223] row')

# check every anchor in both files before touching either
for tab in TABS:
    line = tab + '[222] = ' + tab + '[221];   ' + V222_HARNESS_NOTE
    if h.count('\n' + line + '\n') != 1:
        die('harness.js ' + tab + ': whole [222] line count ' + str(h.count('\n' + line + '\n')) + ' != 1')
G193_LINE = 'OPEN_UNRULED_BY_VERSION[222] = OPEN_UNRULED_BY_VERSION[221];   ' + V222_G193_NOTE
if g.count('\n' + G193_LINE + '\n') != 1:
    die('g193_samecard.js OPEN_UNRULED_BY_VERSION: whole [222] line count ' + str(g.count('\n' + G193_LINE + '\n')) + ' != 1')

# harness.js: three rows, each inserted directly after its [222] row.
for tab in TABS:
    line = tab + '[222] = ' + tab + '[221];   ' + V222_HARNESS_NOTE
    row = tab + '[223] = ' + tab + '[222];   ' + HARNESS_NOTE
    h = insert_after_line(h, line, row, 'harness.js ' + tab)

# g193_samecard.js: one row, directly after the [222] row.
row = 'OPEN_UNRULED_BY_VERSION[223] = OPEN_UNRULED_BY_VERSION[222];   ' + G193_NOTE
g = insert_after_line(g, G193_LINE, row, 'g193_samecard.js OPEN_UNRULED_BY_VERSION')

# post-conditions before writing
for tab in TABS:
    if h.count('\n' + tab + '[223] = ' + tab + '[222];') != 1:
        die('harness.js ' + tab + '[223] row did not land exactly once')
if h.count('[223]') != 3:
    die('harness.js carries ' + str(h.count('[223]')) + ' [223] tokens, want 3')
if g.count('\nOPEN_UNRULED_BY_VERSION[223] = OPEN_UNRULED_BY_VERSION[222];') != 1:
    die('g193 [223] row did not land exactly once')
if g.count('[223]') != 1:
    die('g193 carries ' + str(g.count('[223]')) + ' [223] tokens, want 1')

open(HARNESS, 'w', encoding='utf-8').write(h)
open(G193, 'w', encoding='utf-8').write(g)
print('OK: 3 rows into tests/harness.js, 1 row into tests/gates/g193_samecard.js')
