#!/usr/bin/env python3
# V203 slice D — D117 slice 2 plus two authorised cleanups.
#   E1 relocate steadyCapSec + its own comment ABOVE the paceChartLookup doc block.
#   E2 run_base _steadySecL  -> steadyCapSec(_row)   (output-identical de-dup)
#   E3 run_base _steadySec   -> steadyCapSec(_row)   (output-identical de-dup)
#   E4 rewrite the _steadyCeilingFor header comment: it is a pre-V203 ia_hist_ fallback.
# ia-version STAYS at 202 in this slice; the bump is slice E.
# Literal bytes throughout (real em-dashes, real box-drawing). No escapes.
import io, sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(PATH, encoding='utf-8').read()

edits = []
def rep(tag, old, new):
    edits.append((tag, old, new))

# ── baseline guards ────────────────────────────────────────────────────────────
GUARDS = [
    ('ia-version still 202', '<meta name="ia-version" content="202">', 1),
    ('slice A landed',       'function steadyCapSec(row)',             1),
    # slice B's edited branch lands in two places: the `from` guard and the sentence.
    ('slice B landed',       "a.kind === 'edited'",                    2),
]
for name, tok, want in GUARDS:
    got = src.count(tok)
    if got != want:
        sys.exit('ABORT guard %s: count==%d, want %d' % (name, got, want))
    print('guard  %-22s count==%d OK' % (name, got))

# ── E1: move the owner above the doc block ─────────────────────────────────────
# The three doc lines describe paceChartLookup, not steadyCapSec. Pure relocation:
# neither the function body nor either comment's text changes.
E1_DOC = (
    "// Find the row from any anchor and interpolate between bracketing rows.\n"
    "// anchorType: 'mile' | 'fiveKbest' | 'tenKbest' | 'halfBest' | 'marBest'\n"
    "// Returns full pace set in sec/mile (avg training paces) + the row's race bests.\n"
)
E1_OWNER = (
    "// V203 (D117): the single owner of the steady ceiling. Easy days never run faster than\n"
    "// the midpoint of Tempo and Recovery Pace; every easy-run cap in the app reads this and\n"
    "// nothing else, so there is exactly one place the ceiling can be wrong.\n"
    "function steadyCapSec(row){ return Math.round((row.tempo + row.recovery)/2); }\n"
)
E1_TAIL = "\nfunction paceChartLookup(anchorType, anchorSec) {"
rep('E1 relocate owner',
    E1_DOC + E1_OWNER + E1_TAIL,
    E1_OWNER + "\n" + E1_DOC + "function paceChartLookup(anchorType, anchorSec) {")

# ── E2 / E3: de-duplicate the run_base steady ceiling onto its owner ───────────
# Both sites already compute Math.round((_row.tempo + _row.recovery)/2) inline, where
# _row is the PACE_CHART row from paceChartLookup('mile', ...). Output-identical.
rep('E2 run_base long easy',
    "      const _steadySecL = Math.round((_row.tempo + _row.recovery)/2);",
    "      const _steadySecL = steadyCapSec(_row);")
rep('E3 run_base easy',
    "      const _steadySec = Math.round((_row.tempo + _row.recovery)/2);",
    "      const _steadySec = steadyCapSec(_row);")

# ── E4: demote _steadyCeilingFor to the pre-V203 snapshot fallback it now is ───
# Body and call site are untouched. Only the coverage claim is rewritten: slice A
# falsified "only the run_base time-dosed branch writes dose.cap".
E4_OLD = (
    "// Ceiling coverage: `dose.cap` is only written by the run_base time-dosed branch, so a\n"
    "// distance-dosed easy run (every event program) carries `tgt` alone and would render\n"
    "// with no ceiling — the one element the chart exists for. Derived instead from the\n"
    "// app's own formula at the steady-pace site, read off PACE_CHART's tempo column. No\n"
    "// invented constant: this is the number the engine itself would have written.\n"
)
E4_NEW = (
    "// Ceiling coverage: this is a FALLBACK for history, not a second source of truth.\n"
    "// steadyCapSec() is the single owner of the steady ceiling for anything the engine\n"
    "// builds — every easy and recovery card, NSW and NRC, distance-dosed and time-dosed,\n"
    "// writes `dose.cap` from it. The only doses that reach this function are `ia_hist_`\n"
    "// snapshots frozen before V203 landed that writer: they carry `tgt` alone and would\n"
    "// otherwise render with no ceiling, the one element the chart exists for. That makes\n"
    "// the fallback self-expiring — no snapshot written from V203 on lacks a `cap`, so the\n"
    "// set of rows needing it is closed and only shrinks as old history ages out.\n"
    "// It reproduces steadyCapSec's own formula off PACE_CHART's tempo column rather than\n"
    "// inventing a constant: the number the engine itself would have written at the time.\n"
)
rep('E4 fallback comment', E4_OLD, E4_NEW)

# ── apply: assert count==1 for every anchor BEFORE any write ──────────────────
for tag, old, new in edits:
    n = src.count(old)
    print('anchor %-22s count==%d' % (tag, n))
    if n != 1:
        sys.exit('ABORT %s: anchor count==%d, want 1. Nothing written.' % (tag, n))

for tag, old, new in edits:
    src = src.replace(old, new, 1)

io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE %s (%d replacements)' % (PATH, len(edits)))
