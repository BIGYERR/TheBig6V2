#!/usr/bin/env python3
# v223_t9_g204_census_row.py — tests only. g204_clock_limb C8 gets a [223] era row.
#
# RULING: tests/measure/v223_rulings/p_safepace_ruling.md, "## D183 AMENDMENT 2":
#   (a)/(b) the R1 sentence, "_clkMS for every time"; (d) "_clkMS(per100) at the call site";
#   brought-in (2) the km lens pace line; R5's pace-line shapes; R1 retired the button and the
#   achievablePacePerMile/applySuggestedPace offer, which held both Math.round(safeTotal) % 60 sites.
# Census on V223 (tests/measure/v204_idiom_census.js, masked): _clkMS calls 16 -> 27, round-OUTSIDE 2 -> 0.
#   +5 paceCeilingSentence :2456 x2 (safeTotal, tTotal), :2457/:2458/:2459 (cur, one per branch)
#   +2 updatePaceDisplay :2407 (tTotalSecs, tPacePerMile)
#   +2 #paceDisplayLine initial render :2844 (was a raw padStart line, no _clkMS)
#   +1 updateSwimPaceDisplay :2386 (per100; the total was already there, V218 D157)
#   +1 #swimPaceLine initial render :2802 (per100; same)
# New raw m:ss formatters in the D182/D183/D184 hunks: 0 (scan in the handoff).
# Standing ruling 3: this is a NEW era row for a ruled change. The 218 row keeps its predicate
# on 218..222; the round-OUTSIDE count, hard-coded at 2, becomes a per-era field (2 on every
# existing row, i.e. unchanged for 204..222).
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g204_clock_limb.js'
src = open(P, encoding='utf-8').read()

EDITS = [
 # 1. comment block: the stale "207 on" line, and the two eras that follow it
 ("//   207 on:   13. D106a (V207)",
  "//   207..217: 13. D106a (V207)"),
 ("// A version with no row fails loudly. It never falls back to a neighbouring row.\nconst CLK_CALLS_BY_ERA = [",
  "//   218..222: 16. D157 (V218) three swim labels read the total through _clkMS.\n"
  "//   223 on:   27, and round-OUTSIDE 2 -> 0. D183 (V223) amendment 2 (a)/(b) and (d), R5's\n"
  "//             pace-line shapes and brought-in (2) the km lens: every time in the R1 sentence\n"
  "//             and on both pace lines goes through _clkMS (+11). R1 retired the offer\n"
  "//             (achievablePacePerMile / applySuggestedPace), which held the safeTotal pair.\n"
  "// `outside` is the round-OUTSIDE Math.round(x) % 60 count for the era; it was a flat 2 until V223.\n"
  "// A version with no row fails loudly. It never falls back to a neighbouring row.\nconst CLK_CALLS_BY_ERA = ["),
 # 2. the table: split the open 218 row at 222, add the 223 row, carry `outside` on every row
 ("""  { from: 204, to: 206,      calls: 11, why: 'D126 inventory' },
  { from: 207, to: 217,      calls: 13, why: 'D106a (V207) test-card detail adds 2' },
  { from: 218, to: Infinity, calls: 16, why: 'D157 (V218) three swim labels read the total through _clkMS: pace line 2393, initial render 2817, sizer label 3330' },
];""",
  """  { from: 204, to: 206,      calls: 11, outside: 2, why: 'D126 inventory' },
  { from: 207, to: 217,      calls: 13, outside: 2, why: 'D106a (V207) test-card detail adds 2' },
  { from: 218, to: 222,      calls: 16, outside: 2, why: 'D157 (V218) three swim labels read the total through _clkMS: pace line 2393, initial render 2817, sizer label 3330' },
  { from: 223, to: Infinity, calls: 27, outside: 0, why: 'D183 (V223) amendment 2 (a)/(b)/(d), R5, brought-in (2) add 11: paceCeilingSentence 5 (2456 x2, 2457, 2458, 2459), updatePaceDisplay 2 (2407), paceDisplayLine initial render 2 (2844), swim pace line per100 +1 (2386), swim initial render per100 +1 (2802); R1 retired the offer and its Math.round(safeTotal) % 60 pair' },
];"""),
 # 3. the round-OUTSIDE row reads its count from the era row
 ("""ok('C8 exactly 2 round-OUTSIDE Math.round(x) % 60 sites, both the known-correct safeTotal pair' + FIXIT,
   CENSUS.roundOutside.length === 2 && CENSUS.roundOutside.every(h => /Math\\.round\\(safeTotal\\)\\s*%\\s*60/.test(h.text)),""",
  """const OUT_N = CLK_ROW ? CLK_ROW.outside : NaN;
ok('C8 exactly ' + (CLK_ROW ? OUT_N : '?') + ' round-OUTSIDE Math.round(x) % 60 sites at ia-version ' + VER
     + (OUT_N === 2 ? ', both the known-correct safeTotal pair' : OUT_N === 0 ? ' (D183 R1 retired the safeTotal pair with the offer)' : '') + FIXIT,
   !!CLK_ROW && CENSUS.roundOutside.length === OUT_N && CENSUS.roundOutside.every(h => /Math\\.round\\(safeTotal\\)\\s*%\\s*60/.test(h.text)),"""),
]
for a, _ in EDITS:
    n = src.count(a)
    if n != 1:
        sys.exit('ABORT: anchor count %d != 1: %r' % (n, a[:80]))
for a, b in EDITS:
    src = src.replace(a, b, 1)
open(P, 'w', encoding='utf-8').write(src)
print('OK: %d replacements in %s' % (len(EDITS), P))
