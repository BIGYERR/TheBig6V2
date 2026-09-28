#!/usr/bin/env python3
# V223 slice S1 of D182 (P-RACEDATE), parts (ii) and (v) first half:
#   E1  D182-helper    raceCountdown(raceIso, todayIso) lands beside raceAlignment.
#   E2  D182-weeksOut  raceAlignment's weeksOut becomes raceCountdown(raceIso, todayIso).weeks.
# No ia-version bump in this slice (stays 222). Every anchor asserted count==1 before
# anything is written; the first miss aborts and nothing is written.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

EDITS = []

# E1: D182-helper. Inserted directly above raceAlignment's header comment.
E1_OLD = (
"const NRC_SHORTER    = {run_marathon:'run_half', run_half:'run_10k', run_10k:'run_5k'};\n"
"// raceAlignment(goalId, raceIso, eventOn, todayIso?) → null when not an aligned goal, else\n"
)
E1_NEW = (
"const NRC_SHORTER    = {run_marathon:'run_half', run_half:'run_10k', run_10k:'run_5k'};\n"
"// D182 (V223): raceCountdown(raceIso, todayIso?) → {days, weeks} from local midnight today\n"
"// to the race, or null when a date is unreadable. Pure like raceAlignment: dates in, numbers\n"
"// out, no DOM, no WD, no program object. It takes the ISO, not an alignment, so a test goal\n"
"// carrying a date (D106a) counts down too. Days are rounded BEFORE weeks are floored, so a\n"
"// span across a DST change still counts whole days (a raw floor of ms/7 days loses a week).\n"
"function raceCountdown(raceIso, todayIso){\n"
"  const race = _parseLocalDate(raceIso); if(!race) return null;\n"
"  const today = todayIso ? _parseLocalDate(todayIso) : new Date(); if(!today) return null;\n"
"  today.setHours(0,0,0,0);\n"
"  const days = Math.round((race - today)/86400000);\n"
"  return {days, weeks: Math.floor(days/7)};\n"
"}\n"
"// raceAlignment(goalId, raceIso, eventOn, todayIso?) → null when not an aligned goal, else\n"
)
EDITS.append(('E1 D182-helper', E1_OLD, E1_NEW))

# E2: D182-weeksOut. The one weeksOut line.
E2_OLD = "  const weeksOut = Math.floor((race - today)/86400000/7);\n"
E2_NEW = "  const weeksOut = raceCountdown(raceIso, todayIso).weeks;   // D182: one day-count in the file\n"
EDITS.append(('E2 D182-weeksOut', E2_OLD, E2_NEW))

# Assert every anchor first; abort on first miss.
for name, old, new in EDITS:
    n = src.count(old)
    print('%-20s anchor count=%d' % (name, n))
    if n != 1:
        print('ABORT: %s anchor count %d != 1; nothing written' % (name, n))
        sys.exit(1)
# Guard: the helper name must not already exist.
if src.count('function raceCountdown(') != 0:
    print('ABORT: raceCountdown already defined; nothing written'); sys.exit(1)

out = src
for name, old, new in EDITS:
    out = out.replace(old, new, 1)

# Post-conditions.
assert out.count('function raceCountdown(') == 1
assert out.count('Math.floor((race - today)/86400000/7)') == 0
assert out.count('raceCountdown(raceIso, todayIso).weeks') == 1
assert out.count('<meta name="ia-version" content="222">') == 1

open(PATH, 'w', encoding='utf-8').write(out)
print('WROTE', PATH)
