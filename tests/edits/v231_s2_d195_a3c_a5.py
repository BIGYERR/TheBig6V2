#!/usr/bin/env python3
# V231 slice 2 of 6 — D195 Amendment 2, A3c + A5 (engine, dormant by construction).
# Ruling: tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md
#   A3c: _moveCapFor (live read on `out`) after _capFor; the two _moveCap(r) reads in
#        overAmt and over become _moveCapFor(r). No signature change, no call-site change.
#   A5:  capRegionalFatigue rank(): a leg circuit's index >= 3 ranks 3, else 2, inserted
#        immediately before the rank-2 line.
# Dormant: no four-item leg circuit exists until A2r (slice 3) lands, so output == slice 1.
# No ia-version bump here (slice 6 does it).
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

with open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

def fail(msg):
    print('ABORT:', msg)
    sys.exit(1)

RANK2 = "    if(/superset b|biceps|triceps|leg isolation|calves|accessory|pump|chest \\+ knee/.test(L)) return 2;\n"
A5_LINE = "    if(/^leg circuit/.test(L)) return (itemIdx>=3) ? 3 : 2;\n"

CAPFOR = "  const _capFor = r => Math.max(6, _setCap(r) - (r==='legs' ? _legCut : _uppCut));\n"
MOVECAPFOR = "  const _moveCapFor = r => _moveCap(r) + ((role==='legs' && r==='legs' && out.some(s=>/^leg circuit/i.test((s&&s.label)||'')&&((s&&s.items)||[]).length>=4)) ? 1 : 0);\n"

OVERAMT_OLD = "      ((regionMoves[r]||0)-_moveCap(r))*4\n"
OVERAMT_NEW = "      ((regionMoves[r]||0)-_moveCapFor(r))*4\n"

OVER_OLD = "      .filter(r=>(regionScore[r]||0)>_ceil(r) || (regionSets[r]||0)>_capFor(r) || (regionMoves[r]||0)>_moveCap(r))\n"
OVER_NEW = "      .filter(r=>(regionScore[r]||0)>_ceil(r) || (regionSets[r]||0)>_capFor(r) || (regionMoves[r]||0)>_moveCapFor(r))\n"

reps = [
    ('A5 rank-2 line',      RANK2,       A5_LINE + RANK2),
    ('A3c _capFor line',    CAPFOR,      CAPFOR + MOVECAPFOR),
    ('A3c overAmt read',    OVERAMT_OLD, OVERAMT_NEW),
    ('A3c over filter read', OVER_OLD,   OVER_NEW),
]

# Assert every anchor count==1 before any write; abort on the first miss.
for name, old, _ in reps:
    n = src.count(old)
    print('anchor %-22s count=%d' % (name, n))
    if n != 1:
        fail('%s anchor count %d != 1' % (name, n))

# Guard: the new symbols must not already exist (no double application).
for tok in ('_moveCapFor', "/^leg circuit/.test(L)"):
    if tok in src:
        fail('token already present: %s' % tok)

# Guard: _capFor must precede the overAmt/over reads, and A5's anchor sits inside capRegionalFatigue.
fn = src.index('function capRegionalFatigue(')
if not (fn < src.index(RANK2) < src.index(CAPFOR) < src.index(OVERAMT_OLD) < src.index(OVER_OLD)):
    fail('anchor order inside capRegionalFatigue is not as ruled')

out = src
for name, old, new in reps:
    out = out.replace(old, new, 1)

if out.count('_moveCapFor(r)') != 2 or out.count('const _moveCapFor') != 1:
    fail('post-check: _moveCapFor read/definition counts wrong')
if out.count('_moveCap(r)') != 1:  # only the one inside _moveCapFor's own body remains
    fail('post-check: stray _moveCap(r) read remains')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(out)
print('WROTE', PATH)
