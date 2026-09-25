#!/usr/bin/env python3
# V221 slice T5b: era rows, test files only (tests/harness.js, tests/gates/g193_samecard.js).
# Four alias rows [221] = [220], each ruled UNMOVED (standing ruling 5). index.html is not touched.
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
HARNESS = ROOT + 'tests/harness.js'
G193 = ROOT + 'tests/gates/g193_samecard.js'

V220_CITE = ("// V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only, "
             "no hunk reaches buildProgram; standing ruling 5: coach's P-BARERX re-baseline states "
             "MANNY_DIGEST_BY_VERSION[<next>] = the [219] row; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / "
             "9d14801a63111081 printed from base_V219 before the build)")

V221_CITE = ("// V221 (D177/D178/D179/D180): ruled UNMOVED (D177 adds a _REP_FLOOR row that scheme() reads and "
             "0 engine cards change: measure 0/1,201,231 on the V220 rebase, tests/measure/v221_rebase_swapfloor.out.txt; "
             "D178/D179/D180 are zero-engine; standing ruling 5: all four rulings state HALF_MANNY 0ac7da6b1691a8e1 "
             "unchanged, and the D180 re-ruling (p_active_ruling.md, RE-RULING ON V220) printed it on the working tree "
             "with the V221 slices landed; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by "
             "gatekeeper pre-flight on the V221 candidate before these rows)")

G193_V220 = ("OPEN_UNRULED_BY_VERSION[220] = OPEN_UNRULED_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED "
             "(zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; "
             "the swing class stays a ruled 0)\n")
G193_V221 = ("OPEN_UNRULED_BY_VERSION[221] = OPEN_UNRULED_BY_VERSION[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED "
             "(D177 adds a _REP_FLOOR row that scheme() reads and 0 engine cards change: measure 0/1,201,231, "
             "tests/measure/v221_rebase_swapfloor.out.txt; D178/D179/D180 are zero-engine: no hunk reaches buildProgram "
             "or anything it calls; the swing class stays a ruled 0)\n")

def row(table, n):
    return '%s[%d] = %s[%d];   ' % (table, n, table, n - 1)

TABLES = ['MANNY_DIGEST_BY_VERSION', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION', 'MANNY_CORE_OFF_DIGEST_BY_VERSION']

def die(msg):
    sys.stderr.write('ABORT: ' + msg + '\n')
    sys.exit(1)

h = open(HARNESS, encoding='utf-8').read()
g = open(G193, encoding='utf-8').read()

# Guard: no [221] row exists yet in either file (no double landing).
for t in TABLES:
    c = h.count(t + '[221]')
    if c != 0: die('harness already carries %s[221] (count %d)' % (t, c))
c = g.count('OPEN_UNRULED_BY_VERSION[221]')
if c != 0: die('g193 already carries OPEN_UNRULED_BY_VERSION[221] (count %d)' % c)

# Assert every anchor count==1 before writing anything.
plan = []   # (label, file_key, anchor, insert)
for t in TABLES:
    anchor = '\n' + row(t, 220) + V220_CITE + '\n'
    plan.append((t + '[220]', 'h', anchor, anchor + row(t, 221) + V221_CITE + '\n'))
g_anchor = '\n' + G193_V220
plan.append(('OPEN_UNRULED_BY_VERSION[220]', 'g', g_anchor, g_anchor + G193_V221))

src = {'h': h, 'g': g}
for label, k, anchor, _ in plan:
    c = src[k].count(anchor)
    print('anchor %-40s count=%d' % (label, c))
    if c != 1: die('anchor %s count %d != 1' % (label, c))

for label, k, anchor, new in plan:
    src[k] = src[k].replace(anchor, new, 1)

# Post-conditions: each new row exactly once, each alias is [N] = [N-1] (no self-map, no chain).
for t in TABLES:
    c = src['h'].count(row(t, 221))
    if c != 1: die('post: %s[221] count %d' % (t, c))
if src['g'].count(G193_V221) != 1: die('post: g193 [221] row count != 1')
if len(src['h']) - len(h) != sum(len(row(t, 221)) + len(V221_CITE) + 1 for t in TABLES):
    die('post: harness grew by an unexpected byte count')
if len(src['g']) - len(g) != len(G193_V221):
    die('post: g193 grew by an unexpected byte count')

open(HARNESS, 'w', encoding='utf-8').write(src['h'])
open(G193, 'w', encoding='utf-8').write(src['g'])
print('WROTE tests/harness.js (+3 rows) and tests/gates/g193_samecard.js (+1 row)')
