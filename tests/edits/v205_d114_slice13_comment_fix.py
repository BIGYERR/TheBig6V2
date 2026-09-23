#!/usr/bin/env python3
# V205 slice 13, follow-up: the >26 note in getINTReps overclaimed, so it is corrected.
#
# WHY. The first script's note said week 27 and week 400 "both read row 26 ... the same
# number". Probed directly, the built getINTReps(400, 30, true, null) returns 5, not 8:
# deleting the `isMilGoal && week > 26` limb also removed the SHORT-CIRCUIT it was giving
# the cutback branch, and 400 % 4 === 0 so the cutback now fires. The note as written was
# false, and a comment that lies is worse than no comment.
#
# WHY THE DELETION STILL STANDS. The limb was already unreachable in every buildable
# program. calcProgramLength caps run_pace_goal at Math.min(26, ...) ("doctrine ~26-week
# ceiling") with paceCap topping out at 21; the swim military goals cap at swim_tri 18 /
# swim_mile 16; the bike caps at bike_century 20. Weeks run 1..totalWeeks, so no build can
# present week 27 to this function. The divergence above is reachable only by calling the
# function directly from a harness. This is stated, not hidden, so a future reader and any
# gate author can see exactly where the two readers part company.
import hashlib, io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
BASE_SHA = '0b9d382f6c79e66d75294277f7a89405c028bd9b1da2557c24af0fe1fc4ab0fe'

src = io.open(P, encoding='utf-8').read()
got = hashlib.sha256(io.open(P, 'rb').read()).hexdigest()
if got != BASE_SHA:
    sys.exit('ABORT: expected the slice-13 artifact.\n  want %s\n  got  %s' % (BASE_SHA, got))

A = """  // D114 (V205): the `isMilGoal && week > 26` limb that used to sit here returned a
  // hardcoded 8. Its replacement already exists: intFromTable6 clamps at
  // Math.min(week, 26), so week 27 and week 400 both read row 26, and row 26 capped at
  // Guide A's 8 is 8 — the same number, for the athlete, on every goal rather than only
  // the military one. Deleted, not re-pointed, because the clamp IS the >26 rule. This is
  // the identical move D128 made on getCHI's sibling limb in slice 1.
"""

B = """  // D114 (V205): the `isMilGoal && week > 26` limb that used to sit here returned a
  // hardcoded 8, and it was ALREADY UNREACHABLE. calcProgramLength caps run_pace_goal at
  // Math.min(26, ...) — its own comment calls that the doctrine 26-week ceiling — with
  // paceCap topping out at 21; the swim military goals cap at 18 and 16; the bike caps at
  // 20. Weeks run 1..totalWeeks, so nothing this app can build ever hands week 27 to this
  // function. Deleted rather than re-pointed, which is the identical move D128 made on
  // getCHI's sibling limb in slice 1, and for the identical reason: the Math.min(week, 26)
  // clamp inside intFromTable6 IS the ">26: do not increase" rule, so row 26 is read
  // forever and nothing increases.
  //
  // Be precise about what the deletion changed, because it is not nothing. The old limb
  // returned BEFORE the cutback check, so it short-circuited it. Called directly with a
  // week past 26 that happens to be a multiple of 4 — getINTReps(400, 30, true) — the old
  // code returned 8 and this one returns the cutback value, 5. No build reaches that call;
  // only a harness can. It is written down here so the next reader does not rediscover it
  // as a surprise.
"""

n = src.count(A)
print('anchor count (must be 1): %d' % n)
if n != 1:
    sys.exit('ABORT: comment anchor matched %d times. Nothing written.' % n)
out = src.replace(A, B, 1)

CUT = "  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.6));"
if out.count(CUT) != 1:
    sys.exit('ABORT: the INT cutback branch is no longer byte-identical.')
if '<meta name="ia-version" content="205">' not in out:
    sys.exit('ABORT: ia-version moved. It must stay at 205.')

io.open(P, 'w', encoding='utf-8').write(out)
print('WROTE %s' % P)
print('new sha256 %s' % hashlib.sha256(io.open(P, "rb").read()).hexdigest())
