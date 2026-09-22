#!/usr/bin/env python3
# V204 slice 2 — D126 continued.
# _clkMS (index.html, top level) is the SINGLE OWNER of the seconds limb. Slice 1 re-pointed
# _fmtPace. This slice re-points the two INT formatters and the two remaining engine-side copies.
# Every anchor is asserted count==1 before any write. No ia-version bump (stays 203).
import sys, io

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"

with io.open(PATH, "r", encoding="utf-8") as f:
    src = f.read()

orig = src

# Guard: the helper this slice points at must exist exactly once, and the version must not move.
for guard, n in [("function _clkMS(sec){", 1), ('<meta name="ia-version" content="203">', 1)]:
    c = src.count(guard)
    if c != n:
        sys.exit("ABORT: guard %r count==%d, expected %d" % (guard, c, n))

EDITS = [
    # ---- EDIT 1 — _intClk (NSW INT recovery clock). Bare, NO suffix. ----
    (
        "EDIT 1 _intClk",
        "\n    const _intClk = t => Math.floor(t/60) + ':' + String(Math.round(t%60)).padStart(2,'0');",
        "\n    const _intClk = t => _clkMS(t);   // D126 (V204): seconds limb owned by _clkMS. Bare, no suffix.",
    ),
    # ---- EDIT 2 — fmt in the NSW INT block. Bare; callers append '/mi'. Owns session.note too. ----
    (
        "EDIT 2 INT fmt",
        "\n          const fmt = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;",
        "\n          const fmt = s => _clkMS(s);   // D126 (V204): seconds limb owned by _clkMS. Bare; callers append '/mi'.",
    ),
    # ---- EDIT 3 — fmt in buildNRCSession. Keeps its own '/mi' suffix. Output-identical today:
    #      paceChartLookup pre-rounds every column fed to it (0/451 reachable). Closes the domain. ----
    (
        "EDIT 3 NRC fmt",
        "\n  const fmt = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}/mi`;",
        "\n  const fmt = s => _clkMS(s) + '/mi';   // D126 (V204): seconds limb owned by _clkMS. Suffix stays here.",
    ),
    # ---- EDIT 4 — fmt in the swim INT block. Bare; callers append '/100'. ----
    (
        "EDIT 4 swim fmt",
        "\n      const fmt = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;",
        "\n      const fmt = s => _clkMS(s);   // D126 (V204): seconds limb owned by _clkMS. Bare; callers append '/100'.",
    ),
]

# Assert EVERY anchor count==1 BEFORE writing anything. Abort the whole script on the first miss.
for name, old, new in EDITS:
    c = src.count(old)
    if c != 1:
        sys.exit("ABORT: %s anchor count==%d, expected 1" % (name, c))
    if new in src:
        sys.exit("ABORT: %s replacement already present" % name)

for name, old, new in EDITS:
    src = src.replace(old, new, 1)
    print("ok  %s" % name)

if src == orig:
    sys.exit("ABORT: no change produced")

with io.open(PATH, "w", encoding="utf-8") as f:
    f.write(src)

print("wrote %s (%d -> %d bytes)" % (PATH, len(orig), len(src)))
