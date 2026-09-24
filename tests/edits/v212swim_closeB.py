#!/usr/bin/env python3
# V212 closing, part B (coach's exact text). Mario authorized the bump.
#   4  g202_int_doctrine: the three-run licence renewed to 212 (D142 at V212; D113a builds at V213):
#      the header lines, the INT_MECHANISM row upTo 212 with its comment and note tail, and
#      THREE_RUN_LICENCE_TO = 212. One region, sub-anchors each asserted count==1 inside it.
#   5  g210: D149_HELD_TO = 212 and D154_SCOPED_TO = 212, and the two header lines that name them.
#   6  index.html ia-version 211 -> 212 (LAST).
# Aborts on the first anchor miss, before writing anything.
import io, sys
T = '/Users/CanasBangin/Desktop/TheBig6V2/'
def region(s, start, end, subs, tag):
    if s.count(start) != 1 or s.count(end) != 1: print('ABORT:', tag, 'region bounds', s.count(start), s.count(end)); sys.exit(1)
    a = s.index(start); e = s.index(end) + len(end)
    if e <= a: print('ABORT:', tag, 'region order'); sys.exit(1)
    blk = s[a:e]
    for x, y in subs:
        n = blk.count(x)
        if n != 1: print('ABORT:', tag, 'sub-anchor count', n, repr(x[:60])); sys.exit(1)
        blk = blk.replace(x, y, 1)
    return s[:a] + blk + s[e:]

G202 = T + 'tests/gates/g202_int_doctrine.js'
G210 = T + 'tests/gates/g210_equipment_denials.js'
IDX = T + 'index.html'
g202 = io.open(G202, encoding='utf-8').read()
g202 = region(g202, '// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 211',
  'Renew by one per build until D113a ships.', [
  ('REFUSES ABOVE ia-version 211 (renewed from 210 by D142 at V211).', 'REFUSES ABOVE ia-version 212 (renewed from 211 by D142 at V212).'),
  ('It is keyed on 211, a number that exists today', 'It is keyed on 212, a number that exists today'),
  ("  { upTo: 211, arm: 'four-run', reps: 'table6',", "  { upTo: 212, arm: 'four-run', reps: 'table6',"),
  ('that arm is LICENSED TO 211 and no further (D142 renewal at V211).', 'that arm is LICENSED TO 212 and no further (D142 renewal at V212).'),
  ("is licensed to 211 (D142 renewal at V211; D113a ruled, builds at V213)' }", "is licensed to 212 (D142 renewal at V212; D113a builds at V213)' }"),
  ('const THREE_RUN_LICENCE_TO = 211; // V211 renewal (D142): D113a ruled by Mario with the fallback, builds at V213. Renew by one per build until D113a ships.',
   'const THREE_RUN_LICENCE_TO = 212; // V212 renewal (D142): D113a builds at V213. Renew by one per build until D113a ships.'),
  ], '4 g202')
print('OK 4 g202')
g210 = io.open(G210, encoding='utf-8').read()
g210 = region(g210, '// D154 LICENCE (standing ruling 2, a predicate, not prose).',
  "const D149_HELD_TO = 211; // D149 waits on D153+D155, both ship in V211; builds next\n", [
  ('// (211, renewed at V211) the R bucket is SCOPED OUT', '// (212, renewed at V212) the R bucket is SCOPED OUT'),
  ('While ia-version <= D149_HELD_TO (211, renewed at V211)', 'While ia-version <= D149_HELD_TO (212, renewed at V212)'),
  ('const D154_SCOPED_TO = 211; // D154 queued\n', 'const D154_SCOPED_TO = 212; // D154 queued\n'),
  ("const D149_HELD_TO = 211; // D149 waits on D153+D155, both ship in V211; builds next\n", "const D149_HELD_TO = 212; // D149 builds after V213\n"),
  ], '5 g210')
print('OK 5 g210')
idx = io.open(IDX, encoding='utf-8').read()
M = '<meta name="ia-version" content="211">'
if idx.count(M) != 1: print('ABORT: 6 meta count', idx.count(M)); sys.exit(1)
if idx.count('targetPace100 = gap100 >= initialPace100 ? initialPace100 : initialPace100 - gap100;') != 1:
    print('ABORT: slices 1-6b are not on the tree'); sys.exit(1)
idx = idx.replace(M, '<meta name="ia-version" content="212">', 1)
print('OK 6 meta 211 -> 212 (last)')
io.open(G202, 'w', encoding='utf-8').write(g202)
io.open(G210, 'w', encoding='utf-8').write(g210)
io.open(IDX, 'w', encoding='utf-8').write(idx)
print('WROTE 3 files')
