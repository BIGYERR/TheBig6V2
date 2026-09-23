#!/usr/bin/env python3
# V205 slice 13 — D114's INT half (ruled V202, never built).
#
# THE REGRESSION THIS FIXES. D125/D130 made the INT slot WEEKLY instead of six-weekly.
# The V115 hand ramp (4 -> 8 spread across `rampSpan`) was written for a 6-week span; run
# over an 11-week block it tops out at 7 because the final week is the taper and the ramp
# never reaches its last rung. Guide A p.12 says build progressively to EIGHT repeats.
# g202_int_doctrine's D3b ("0 blocks reach 8, highest seen 7") and D9d ("the cap the note
# STATES is the cap the engine PRESCRIBES") were catching that under-dose, not stale doctrine.
#
# D114 ruled the fix at V202: getINTReps reads NSW Guide B Table 6's INT column, capped at
# Guide A's 8. This is the twin of slice 1's chiFromTable6 and is sited and shaped to match.
#
# ia-version STAYS AT 205. No bump in this script, and therefore no version replacement.
import hashlib, io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
BASE_SHA = '24072b2d7752a508e217f5836a6910456f2c2becf0776c6d8ffd041c54b19add'

src = io.open(P, encoding='utf-8').read()
raw = io.open(P, 'rb').read()
got = hashlib.sha256(raw).hexdigest()
if got != BASE_SHA:
    sys.exit('ABORT: baseline sha256 mismatch.\n  want %s\n  got  %s' % (BASE_SHA, got))
if '<meta name="ia-version" content="205">' not in src:
    sys.exit('ABORT: ia-version is not 205.')

EDITS = []

# ── EDIT 3 (sited first): the table and its reader, the twin of NSW_TABLE6_CHI ──────
# Sited immediately above getINTReps, exactly as NSW_TABLE6_CHI sits immediately above
# chiFromTable6 and getCHI. The anchor is the tail of isCardioCutbackWeek.
A1 = """  return (totalWeeks||0) >= 10 && week % 4 === 0 && week !== totalWeeks;
}

function getINTReps(week, totalWeeks, isMilGoal, rampSpan) {
"""

B1 = """  return (totalWeeks||0) >= 10 && week % 4 === 0 && week !== totalWeeks;
}

// ── D114 (ruled V202, built V205): NSW GUIDE B, TABLE 6 — THE INT PROGRESSION ─────
// Source: doctrine/nsw_ptg_sealswcc_11pg.txt, the "INT" column of Table 6, headed
// "Run/Swim (reps)" — 400 m repeats for the run, 100 yd repeats for the swim.
// Transcribed verbatim, 26 rows, week 1 through week 26:
//   4 4 5 5 6 6 7 7 8 8 9 9 then 10 from week 13 to week 26.
// Line 61 of that file is the table's own tail rule: ">26: do not increase INT or CHI
// distances. Focus on increasing intensity." That rule is implemented by the
// Math.min(week, 26) clamp in the reader below and by nothing else — past week 26 the
// athlete keeps reading row 26 forever, which IS "do not increase".
//
// THE CEILING IS 8, AND IT COMES FROM THE OTHER GUIDE. Guide A is explicit that a Short
// Interval session should not exceed 8 repeats: start at 4, build progressively to 8, and
// once you can hold 8 at high intensity you work on PACE, not more reps. Past 8 x 400 m on
// 2 to 2.5x recovery the session stops being speed work and becomes a threshold session
// run at interval pace on incomplete rest, which trains neither. Table 6's raw column
// climbs to 9 at week 11 and 10 at week 13; Guide A's cap is applied over the top of it,
// so the prescription reaches 8 at week 9 and then holds 8 forever. The table is stored
// RAW and the cap lives in the reader on purpose: the transcription stays checkable
// against the page, and the doctrine that overrides it stays visible as an override.
//
// What this replaces: the V115 hand ramp, which spread 4 -> 8 across a `rampSpan` window
// by POSITION. Table 6 is a CALENDAR progression keyed on the training week, not a
// phase-relative ramp, which is the same thing D128 found for the CHI column.
var NSW_TABLE6_INT = [
  null,                       // index 0 unused: weeks are 1-based
  4, 4,                       // wk 1-2
  5, 5,                       // wk 3-4
  6, 6,                       // wk 5-6
  7, 7,                       // wk 7-8
  8, 8,                       // wk 9-10
  9, 9,                       // wk 11-12
  10, 10, 10, 10, 10, 10, 10, // wk 13-19
  10, 10, 10, 10, 10, 10, 10  // wk 20-26
];
// The reader. Returns a plain rep COUNT — INT's prescription is a number of repeats, so
// unlike chiFromTable6 there is no object to hand back and nothing a caller could mutate.
// Math.min(week, 26) is load-bearing doctrine, not defensive clamping: it is Table 6's
// ">26" row. Math.min(8, row) is Guide A's ceiling.
function intFromTable6(week){
  var _w = Math.max(1, Math.min(Math.round(week) || 1, 26));
  return Math.min(8, NSW_TABLE6_INT[_w]);
}

function getINTReps(week, totalWeeks, isMilGoal, rampSpan) {
"""
EDITS.append(('E3 NSW_TABLE6_INT + intFromTable6 inserted above getINTReps', A1, B1))

# ── EDIT 1a: the V115 header comment, and the >26 limb the clamp replaces ──────────
A2 = """  // ── V115: NSW'S CEILING IS 8, NOT 10 ────────────────────────────────────────
  // The PTG is explicit that a Short Interval session should not exceed 8 repeats:
  // start at 4, build progressively to 8, and once you can hold 8 at high intensity you
  // work on PACE, not more reps. The 10 here leaked out of the `isMilGoal && week > 26`
  // branch — the beyond-26-week military case — into the general ramp's Math.min, and
  // the old comment ("hard cap: 10") hardened the leak into a stated rule.
  // Past 8x400m on 2-2.5x recovery the session stops being speed work and becomes a
  // threshold session run at interval pace on incomplete rest, which trains neither.
  // The >26wk branch returns 8 for the same reason: NSW says do not add interval VOLUME
  // beyond 26 weeks, get faster instead — which is what getCHI's sibling branch says too.
  if(isMilGoal && week > 26) return 8;
"""

B2 = """  // D114 (V205): the `isMilGoal && week > 26` limb that used to sit here returned a
  // hardcoded 8. Its replacement already exists: intFromTable6 clamps at
  // Math.min(week, 26), so week 27 and week 400 both read row 26, and row 26 capped at
  // Guide A's 8 is 8 — the same number, for the athlete, on every goal rather than only
  // the military one. Deleted, not re-pointed, because the clamp IS the >26 rule. This is
  // the identical move D128 made on getCHI's sibling limb in slice 1.
"""
EDITS.append(('E1a >26 limb replaced by the Table 6 clamp', A2, B2))

# ── EDIT 1b: the ramp itself becomes the table read ───────────────────────────────
# NOTE the local name `ramp` is KEPT deliberately so that the cutback line below it is
# BYTE-IDENTICAL. Edit 2 of this slice is "the cutback and taper branches stay untouched",
# and the cheapest way to prove that is to leave them literally unmodified.
A3 = """  // `rampSpan` is the window the 4->8 build is spread across. It defaults to the whole
  // block, which is the un-periodized case. When the compressed quality slot splits the
  // block into an INT phase and a CHI phase (V115), the caller passes the INT phase
  // length instead — otherwise a 6-week interval phase inside a 12-week block would
  // ramp only halfway and top out at 5 repeats, under-dosing the exact thing NSW says
  // to build to 8. The CUTBACK branch deliberately still reads the real calendar week:
  // deloads are calendar-aligned and must not shift with the phase.
  const _span = Math.max(2, rampSpan || totalWeeks || 6);
  const ramp = w => Math.min(8, 4 + Math.floor((w-1) * 4 / Math.max(_span-1,1)));
"""

B3 = """  // `rampSpan` is kept in the signature and is no longer read, for the same reason
  // getCHI still takes `phaseFrom`/`phaseTo` after D128: the run and swim callers still
  // hand down the periodized INT window, and the parameter is left in place so those
  // call sites need no edit. It no longer RE-BASES anything. Table 6 is indexed on the
  // training week itself, so an INT phase that opens in week 7 opens on week 7's row
  // (7 repeats) instead of restarting the build at its first rung.
  //
  // This is what fixes the ramp. The V115 position-based build spread 4 -> 8 across
  // `_span`; when D125/D130 made the INT slot weekly across an 11-week block, the final
  // rung landed on the taper week and the athlete topped out at SEVEN repeats, never
  // reaching the eight Guide A tells him to build to. On the calendar table he reaches
  // 8 in week 9 and holds it, which is the progression as written.
  const ramp = w => intFromTable6(w);
"""
EDITS.append(('E1b the V115 position ramp replaced by the calendar table read', A3, B3))

out = src
print('anchor counts (each must be exactly 1):')
for label, old, new in EDITS:
    n = out.count(old)
    print('  %-62s count=%d' % (label, n))
    if n != 1:
        sys.exit('ABORT: anchor "%s" matched %d times, expected 1. Nothing written.' % (label, n))
    out = out.replace(old, new, 1)

# The cutback branch must be byte-identical after the rewrite — edit 2 is "do not touch".
CUT = "  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.6));"
if out.count(CUT) != 1:
    sys.exit('ABORT: the INT cutback branch was not left byte-identical.')
if '<meta name="ia-version" content="205">' not in out:
    sys.exit('ABORT: ia-version moved. It must stay at 205.')

io.open(P, 'w', encoding='utf-8').write(out)
print('\nWROTE %s' % P)
print('new sha256 %s' % hashlib.sha256(io.open(P, "rb").read()).hexdigest())
