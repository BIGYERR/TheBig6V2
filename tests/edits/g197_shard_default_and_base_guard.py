#!/usr/bin/env python3
# TOOLING EDIT (tests only, no ia-version bump, index.html untouched).
#
# 1. G197_SHARDS default 4 -> 2 in g197c_d84_cmp.js and g197d_d84_base.js. Gatekeeper
#    measured the suite at 24.96-25.11s with 4 and 21.38s with 2 at identical total CPU:
#    the cost is process oversubscription (8 concurrent gates, two of which fork their own
#    workers, on 8 cores), not a CPU wall. The env override and the positive-integer
#    validation are unchanged; only the default, the comments and the truthful default
#    named in the CONFIG failure message move.
# 2. g197d_d84_base.js gains E0, a baseline-free guard on the lattice enumeration, so the
#    file can never print `PASS 0 FAIL 0` under sabotage (which is indistinguishable from
#    a gate whose body was deleted). E0 is a 110th assertion, added, not substituted.
#
# Every anchor is asserted count == 1 for its file; nothing is written until all hit.
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
C = os.path.join(ROOT, 'tests', 'gates', 'g197c_d84_cmp.js')
D = os.path.join(ROOT, 'tests', 'gates', 'g197d_d84_base.js')

src = {}
for p in (C, D):
    with io.open(p, 'r', encoding='utf-8') as f:
        src[p] = f.read()

EDITS = []
def rep(path, old, new):
    EDITS.append((path, old, new))

# ── 1a. g197c prose ────────────────────────────────────────────────────────────────────
rep(C,
"// CONFIG INDEX across G197_SHARDS worker processes (default 4, not 8: this gate already\n"
"// runs inside gate.sh's own 8-wide fan-out) and EVERY counter is aggregated back into this\n",
"// CONFIG INDEX across G197_SHARDS worker processes (default 2, not 8: this gate already\n"
"// runs inside gate.sh's own 8-wide fan-out, and two of those eight fork workers of their\n"
"// own, so on 8 cores a wider fan-out only buys oversubscription. Measured in-suite: 4\n"
"// shards 24.96-25.11s, 2 shards 21.38s, at the same total CPU) and EVERY counter is\n"
"// aggregated back into this\n")

# ── 1b. g197c config block ─────────────────────────────────────────────────────────────
rep(C,
"// G197_SHARDS: empty or unset means 4. Only a POSITIVE integer is accepted — 0, negative\n",
"// G197_SHARDS: empty or unset means 2. Only a POSITIVE integer is accepted — 0, negative\n")

# ── 1c/1d. the default itself, and the default named in the CONFIG failure, in BOTH files.
for p in (C, D):
    rep(p, "  if (raw === '') return 4;\n", "  if (raw === '') return 2;\n")
    rep(p,
        "\"FAIL: CONFIG: G197_SHARDS must be a positive integer, or empty/unset which means 4; got '\"",
        "\"FAIL: CONFIG: G197_SHARDS must be a positive integer, or empty/unset which means 2; got '\"")

# ── 1e. g197d prose ────────────────────────────────────────────────────────────────────
rep(D,
"// INDEX across G197_SHARDS workers (default 4) and aggregated IN FULL before E1g and E1h\n",
"// INDEX across G197_SHARDS workers (default 2, because gate.sh already runs eight gates at\n"
"// once on 8 cores and more workers here only oversubscribe them) and aggregated IN FULL\n"
"// before E1g and E1h\n")

# ── 2a. g197d header: the file is no longer assertion-free without a baseline. ──────────
rep(D,
"// against the SHIPPED baseline (E1g / E1h) and the budget machinery is proved byte-\n"
"// identical to it (E5 × 3). Five assertions, every one of them baseline-only.\n",
"// against the SHIPPED baseline (E1g / E1h) and the budget machinery is proved byte-\n"
"// identical to it (E5 × 3). Six assertions: those five, which are baseline-only, plus E0,\n"
"// a guard that needs no baseline and runs on every invocation.\n")

rep(D,
"// WITH NO BASELINE THIS FILE ASSERTS NOTHING, ON PURPOSE. tests/sabotage.py runs\n"
"// `node <gate> mutated.html` with no argv[3], so under sabotage this file prints its two\n"
"// \"not run\" lines and `PASS 0 FAIL 0`. That is a valid summary, not a crash — gate.sh\n"
"// reads a MISSING summary as a crash, and this file must never produce one. It therefore\n"
"// has zero sabotage coverage by construction; every mutation that used to trip section E\n"
"// is re-pointed at g197c_d84_cmp.js.\n",
"// WITH NO BASELINE THE FIVE COMPARISON ASSERTIONS DO NOT RUN, ON PURPOSE. tests/sabotage.py\n"
"// runs `node <gate> mutated.html` with no argv[3], so under sabotage this file prints its\n"
"// two \"not run\" lines and E1g/E1h/E5 are skipped. Every mutation that used to trip\n"
"// section E is re-pointed at g197c_d84_cmp.js, so this file still carries no sabotage\n"
"// coverage of the app.\n"
"//\n"
"// WHAT IT MUST NEVER PRINT IS `PASS 0 FAIL 0`. gate.sh reads a MISSING summary as a crash,\n"
"// but it reads a summary of zero as green, and a zero summary is indistinguishable from a\n"
"// gate whose body was deleted. E0 therefore runs on every invocation, with or without a\n"
"// baseline: it needs no second artifact, it is answered by the lattice this file builds\n"
"// for itself, and it fails loudly if that enumeration is ever cut down. Under sabotage\n"
"// this file prints PASS 1 FAIL 0.\n")

# ── 2b. E0 itself. Placed at the head of afterSweep, the one funnel every non-worker path
# reaches: with a baseline, with no baseline, and after a rejected G197_SHARDS value. The
# oracle is a hand product, not the engine: 6 tiers × 2 focus × 2 experience × 3 goals
# × 4 injury states × 3 rest patterns × 2 seeds = 1728. The NAME is a fixed literal, with
# no filename, no path and no count in it — E1g and E1h embed both and are useless as
# oracle keys because of it; E0 must stay greppable across runs and across artifacts.
rep(D,
"function afterSweep(bCells, bFell, bRose, bEg) {\n"
"  if (BASE_HTML) {\n",
"function afterSweep(bCells, bFell, bRose, bEg) {\n"
"  ok('E0 lattice enumeration is the full tier × focus × experience × goal × injury × rest × seed product',\n"
"     E_L.length === 1728, E_L.length);\n"
"  if (BASE_HTML) {\n")

# ── assert every anchor, then write ────────────────────────────────────────────────────
miss = []
for path, old, new in EDITS:
    n = src[path].count(old)
    if n != 1:
        miss.append('%s: %d occurrences of %r' % (os.path.basename(path), n, old[:70]))
if miss:
    sys.stderr.write('ABORT, no file written:\n  ' + '\n  '.join(miss) + '\n')
    sys.exit(1)

for path, old, new in EDITS:
    src[path] = src[path].replace(old, new, 1)

for p in (C, D):
    with io.open(p, 'w', encoding='utf-8') as f:
        f.write(src[p])
    print('wrote ' + p)
print('%d replacements, all anchors count == 1' % len(EDITS))
