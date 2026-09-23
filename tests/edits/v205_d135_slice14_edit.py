#!/usr/bin/env python3
# V205 slice 14 — D135. FORK BIKE INT OFF TABLE 6, exactly as D128 forked bike CHI.
#
# THE FINDING. Slice 13 moved getINTReps onto NSW Guide B Table 6's INT column. That
# column is headed "Run/Swim (reps)". Swim is NAMED in the header and moves; the bike is
# not named and must not. Left unforked, bike_century held 8 repeats for twelve straight
# weeks under a table written for 400 m repeats and 100 yd repeats.
#
# ia-version STAYS AT 205. No bump in this script.
import hashlib, io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
R = '/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md'
BASE_SHA = 'e183ce2832b73d155de8ce7c5c07c9bc448a2deba16e5dc8ade2ad70322f06bc'

src = io.open(P, encoding='utf-8').read()
got = hashlib.sha256(io.open(P, 'rb').read()).hexdigest()
if got != BASE_SHA:
    sys.exit('ABORT: baseline sha256 mismatch.\n  want %s\n  got  %s' % (BASE_SHA, got))
if '<meta name="ia-version" content="205">' not in src:
    sys.exit('ABORT: ia-version is not 205.')

EDITS = []

# ── EDIT 1: getINTBike, sited immediately after getINTReps, the twin of getCHIBike ──
A1 = """  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.6));
  return ramp(week);
}
"""

B1 = """  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.6));
  return ramp(week);
}

// ── D135 (V205): THE BIKE KEEPS THE V115 INT HAND RAMP, BYTE-IDENTICAL ───────
// Table 6's rep column is headed "Run/Swim (reps)" — 400 m repeats for the run, 100 yd
// repeats for the swim. SWIM IS NAMED IN THAT HEADER AND MOVES ONTO THE TABLE. The bike
// is not named and does not: a table that counts 400 m repeats does not claim cycling,
// and prescribing its rep counts on a bike would be an invention, not a transcription.
// Left unforked, a 17-week bike_century read row 9 onward and held EIGHT max-effort
// intervals for twelve straight weeks, because the calendar table has no bike ceiling in
// it to stop at.
//
// BE HONEST ABOUT WHAT THIS IS. The hand ramp below is not doctrine either. It is the
// UNRULED STATE, held rather than replaced by a table that does not claim the sport.
// Holding an unruled ramp is the smaller error than importing a source that is silent.
// Cycling intervals and cycling tempo are ONE open ruling, not two: when cycling is ruled
// on, this reader and getCHIBike are replaced together, and neither replacement touches
// Table 6 or the run path. That is why both forks are BY CALLER and not a flag inside the
// shared reader.
//
// The body is the V115 ramp unchanged except that the `isMilGoal && week > 26` limb is not
// carried over — the bike caller passed `false` literally, so that limb was already
// unreachable from here and dropping it moves no byte of bike output. `isMilGoal` is gone
// from the signature for the same reason. `rampSpan` is kept and IS read here, unlike in
// getINTReps: this ramp is position-based, so the span is the whole of its meaning. The
// bike caller passes no span, so it defaults to the block length, which is exactly what
// the old three-argument bike call into the shared reader resolved to.
function getINTBike(week, totalWeeks, rampSpan) {
  const _span = Math.max(2, rampSpan || totalWeeks || 6);
  const ramp = w => Math.min(8, 4 + Math.floor((w-1) * 4 / Math.max(_span-1,1)));
  // Cutback week: interval VOLUME steps back ~40% off the prior build week and never
  // progresses. Byte-identical to the rule getINTReps still states.
  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.6));
  return ramp(week);
}
"""
EDITS.append(('E1 getINTBike inserted after getINTReps', A1, B1))

# ── EDIT 2: the bike call site, re-pointed ─────────────────────────────────────────
A2 = """  let intReps = getINTReps(week, tw, false);
  let chi = getCHIBike(week, tw);   // D128 (V205): bike keeps the V115 hand ramp
"""

B2 = """  let intReps = getINTBike(week, tw);   // D135 (V205): bike keeps the V115 INT hand ramp
  let chi = getCHIBike(week, tw);   // D128 (V205): bike keeps the V115 CHI hand ramp
"""
EDITS.append(('E2 the bike INT call site re-pointed at getINTBike', A2, B2))

out = src
print('anchor counts (each must be exactly 1):')
for label, old, new in EDITS:
    n = out.count(old)
    print('  %-58s count=%d' % (label, n))
    if n != 1:
        sys.exit('ABORT: anchor "%s" matched %d times, expected 1. Nothing written.' % (label, n))
    out = out.replace(old, new, 1)

# No bike caller may still reach the run/swim reader.
if 'getINTReps(week, tw, false)' in out:
    sys.exit('ABORT: a bike caller still reaches getINTReps.')
if out.count('function getINTBike(') != 1:
    sys.exit('ABORT: getINTBike is not declared exactly once.')
if out.count('getINTBike(') != 2:
    sys.exit('ABORT: getINTBike must appear exactly twice (declaration + one call site).')
if '<meta name="ia-version" content="205">' not in out:
    sys.exit('ABORT: ia-version moved. It must stay at 205.')

io.open(P, 'w', encoding='utf-8').write(out)
print('\nWROTE %s' % P)
print('new sha256 %s' % hashlib.sha256(io.open(P, "rb").read()).hexdigest())

# ── EDIT 3: the D-code registry. Coach issued D135 (this fork) and D136 (Guide A's 8
# stands over Guide B's 10 — confirmed as already built, no code). ────────────────
reg = io.open(R, encoding='utf-8').read()
AR = 'highest assigned = D134. Next free = D135.'
BR = 'highest assigned = D136. Next free = D137.'
nr = reg.count(AR)
print('\nE3 registry anchor count=%d' % nr)
if nr != 1:
    sys.exit('ABORT: registry anchor matched %d times, expected 1. index.html IS WRITTEN; rerun only E3.' % nr)
io.open(R, 'w', encoding='utf-8').write(reg.replace(AR, BR, 1))
print('WROTE %s' % R)
