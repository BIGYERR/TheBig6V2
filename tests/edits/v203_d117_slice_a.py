#!/usr/bin/env python3
# V203 slice A — D117: the NRC easy-day ceiling and its single owner.
# E1 steadyCapSec owner fn; E2 recovery/dist; E3 recovery/time; E4 long run.
# NO ia-version bump in this slice (stays 202 until the final slice).
import io, sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(PATH, encoding='utf-8').read()

EDITS = []

# ---- E1: the owner function, inserted immediately before paceChartLookup ----
E1_OLD = "function paceChartLookup(anchorType, anchorSec) {"
E1_NEW = (
    "// V203 (D117): the single owner of the steady ceiling. Easy days never run faster than\n"
    "// the midpoint of Tempo and Recovery Pace; every easy-run cap in the app reads this and\n"
    "// nothing else, so there is exactly one place the ceiling can be wrong.\n"
    "function steadyCapSec(row){ return Math.round((row.tempo + row.recovery)/2); }\n\n"
    "function paceChartLookup(anchorType, anchorSec) {"
)
EDITS.append(('E1 owner fn', E1_OLD, E1_NEW))

# ---- E4a: long-run progression detail ----
E4A_OLD = "and average Recovery Pace (${paces.recovery}) across the run. Comfortable the whole way.`;"
E4A_NEW = ("and average Recovery Pace (${paces.recovery}) across the run. Comfortable the whole way."
           " Average no faster than ${fmt(steadyCapSec(chartRow))}.`;")
EDITS.append(('E4a long detail', E4A_OLD, E4A_NEW))

# ---- E4b: long-run doses, BOTH forms ----
E4B_OLD = ("      _dose = L.unit === 'min' ? {k:'time', mins:L.val, tgt:Math.round(chartRow.recovery)}"
           " : {k:'dist', mi:L.val, tgt:Math.round(chartRow.recovery)};")
E4B_NEW = ("      _dose = L.unit === 'min' ? {k:'time', mins:L.val, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)}"
           " : {k:'dist', mi:L.val, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)};")
EDITS.append(('E4b long doses', E4B_OLD, E4B_NEW))

# ---- E2a: recovery run, DISTANCE branch detail ----
E2A_OLD = ("      detail = `${_pick.label} recovery run — ${_mi} mi at Recovery Pace (${paces.recovery})."
           " 4–5/10 effort — easy enough to talk, laugh, or argue freely. ${_prog}`;")
E2A_NEW = ("      detail = `${_pick.label} recovery run — ${_mi} mi at Recovery Pace (${paces.recovery})."
           " 4–5/10 effort — easy enough to talk, laugh, or argue freely. ${_prog}"
           " Do not run faster than ${fmt(steadyCapSec(chartRow))}.`;")
EDITS.append(('E2a rec dist detail', E2A_OLD, E2A_NEW))

# ---- E2b: recovery run, DISTANCE branch dose ----
E2B_OLD = "      _dose = {k:'dist', mi:_mi, tgt:Math.round(chartRow.recovery)};"
E2B_NEW = "      _dose = {k:'dist', mi:_mi, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)};"
EDITS.append(('E2b rec dist dose', E2B_OLD, E2B_NEW))

# ---- E3a: recovery run, TIME branch detail ----
E3A_OLD = ("      detail = `${recMin}-minute recovery run at Recovery Pace (${paces.recovery})."
           " 4–5/10 effort — easy enough to talk, laugh, or argue freely. ${_prog}`;")
E3A_NEW = ("      detail = `${recMin}-minute recovery run at Recovery Pace (${paces.recovery})."
           " 4–5/10 effort — easy enough to talk, laugh, or argue freely. ${_prog}"
           " Do not run faster than ${fmt(steadyCapSec(chartRow))}.`;")
EDITS.append(('E3a rec time detail', E3A_OLD, E3A_NEW))

# ---- E3b: recovery run, TIME branch dose ----
E3B_OLD = "      _dose = {k:'time', mins:recMin, tgt:Math.round(chartRow.recovery)};"
E3B_NEW = "      _dose = {k:'time', mins:recMin, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)};"
EDITS.append(('E3b rec time dose', E3B_OLD, E3B_NEW))

# --- assert EVERY anchor count==1 BEFORE writing anything; abort on first miss ---
fail = False
for name, old, new in EDITS:
    n = src.count(old)
    print('anchor %-22s count=%d' % (name, n))
    if n != 1:
        print('ABORT: anchor %s matched %d times, expected 1' % (name, n))
        fail = True
if fail:
    sys.exit(1)

for name, old, new in EDITS:
    src = src.replace(old, new, 1)

io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE', PATH)
