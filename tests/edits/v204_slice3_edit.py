#!/usr/bin/env python3
# V204 slice 3 — D126: re-point the four athlete-data / display-value pace formatters
# at _clkMS (the single owner of the seconds limb). No suffix, no signature, no call
# site changes. ia-version stays at 203 (D126 ships across slices on one bump).
import io, sys

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"
src = io.open(PATH, encoding="utf-8").read()

EDITS = [
    # EDIT 1 — _benchStripHTML's local fmt. Input is base.sec / now.sec, derived from a
    # LOGGED distance and duration, so the domain is genuinely open (non-integer seconds).
    # No suffix inside fmt; the '/mi' lives in the caller's string concatenation.
    (
        "E1 _benchStripHTML fmt",
        "  const fmt=s=>Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');\n"
        "  const base=_benchmarkEntryFor(1);",
        "  const fmt=s=>_clkMS(s);   // D126 (V204): logged dist/duration is an open domain; _clkMS owns the limb\n"
        "  const base=_benchmarkEntryFor(1);",
    ),
    # EDIT 2 — _fmtPaceMi. Signature and null guard preserved verbatim; no suffix
    # (all six call sites append '/mi' themselves). Six call sites untouched.
    (
        "E2 _fmtPaceMi",
        "function _fmtPaceMi(sec){ if(!isFinite(sec)||sec<=0) return null; const m=Math.floor(sec/60), s=Math.round(sec%60); return m+':'+String(s).padStart(2,'0'); }",
        "function _fmtPaceMi(sec){ if(!isFinite(sec)||sec<=0) return null; return _clkMS(sec); }   // D126 (V204)",
    ),
    # EDIT 3 — _fmtMileAnchor. Output shape is exact: no '/mi' suffix, bare M:SS, embedded
    # in <b> markup by runAnchorSentence. Inputs are chart-integer today, so this is
    # output-identical; g203_mile_pencil / g203_ceiling_and_anchor / g202_pace_anchor /
    # g202_pace_copy all assert against these strings.
    (
        "E3 _fmtMileAnchor",
        "function _fmtMileAnchor(sec){ return `${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')}`; }",
        "function _fmtMileAnchor(sec){ return _clkMS(sec); }   // D126 (V204)",
    ),
    # EDIT 4 — _fmtPaceShort. Fifteen call sites (Progress charts, drift chart, projection
    # footer, ceiling labels) append their own '/mi' or no suffix; none touched here.
    (
        "E4 _fmtPaceShort",
        "function _fmtPaceShort(sec){ const mn=Math.floor(sec/60), ss=Math.round(sec%60); return mn+':'+String(ss).padStart(2,'0'); }",
        "function _fmtPaceShort(sec){ return _clkMS(sec); }   // D126 (V204)",
    ),
]

for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.stderr.write("ABORT %s: anchor count==%d (need 1)\n" % (name, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print("OK   %s  anchor count==1" % name)

# No ia-version bump in this slice: D126 is mid-ruling, artifact stays at 203.
assert src.count('<meta name="ia-version" content="203">') == 1, "ABORT: ia-version is not 203"

io.open(PATH, "w", encoding="utf-8").write(src)
print("WROTE", PATH)
