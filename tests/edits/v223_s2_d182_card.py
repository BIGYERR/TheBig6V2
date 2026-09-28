#!/usr/bin/env python3
# V223 slice S2 of D182 (P-RACEDATE), part (i) for the Programs card and the copy text:
#   E0  D182-countdown-field  raceCountdownWords(cd) lands beside raceCountdown: the ruling's
#                             table as one small pure formatter that takes the countdown object.
#   E1  D182-parse            progSelData raceStr prints _fmtStartDay(c.raceDate, true).
#   E2  D182-countdown-field  raceWeeks (stored c/p.raceDateWeeks) is replaced by raceOut, the
#                             live countdown words computed at render from raceCountdown(c.raceDate).
#   E3  D182-card-row         card "Time out" row prints whenever a race date is set and readable.
#   E4  D182-copytext         Event line: "(10 weeks out)" / "(6 days out)" / "(race day)" / "(behind you)".
# NOT touched here (next slice): mile sheet, wizard review, WD.raceDateWeeks writer, program literal.
# No ia-version bump in this slice (stays 222). Every anchor asserted count==1 before
# anything is written; the first miss aborts and nothing is written.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

# Preconditions: S1 is in the tree, and the new names are not.
if src.count('function raceCountdown(raceIso, todayIso){') != 1:
    print('ABORT: S1 raceCountdown not found exactly once; nothing written'); sys.exit(1)
for tok in ('function raceCountdownWords(', 'raceOut'):
    if src.count(tok) != 0:
        print('ABORT: %r already present; nothing written' % tok); sys.exit(1)

EDITS = []

# E0: D182-countdown-field. The table-to-words formatter, directly below raceCountdown.
E0_OLD = (
"  return {days, weeks: Math.floor(days/7)};\n"
"}\n"
"// raceAlignment(goalId, raceIso, eventOn, todayIso?) → null when not an aligned goal, else\n"
)
E0_NEW = (
"  return {days, weeks: Math.floor(days/7)};\n"
"}\n"
"// D182 (V223): raceCountdownWords(cd) → {card, copy} for a raceCountdown result, null on null.\n"
"// Pure: it takes the countdown, never the program. The ruling's table, key stays \"Time out\":\n"
"// 7 or more days counts weeks (the unit a plan is built in), race week counts days, day 0 is\n"
"// the header's own \"Race day\", and past the race is \"Behind you\" (neutral on whether he ran it).\n"
"function raceCountdownWords(cd){\n"
"  if(!cd || !isFinite(cd.days)) return null;\n"
"  const d = cd.days, w = cd.weeks;\n"
"  if(d >= 7){ const n = w+' week'+(w===1?'':'s'); return {card:n, copy:n+' out'}; }\n"
"  if(d >= 1){ const n = d+' day'+(d===1?'':'s');  return {card:n, copy:n+' out'}; }\n"
"  if(d === 0) return {card:'Race day', copy:'race day'};\n"
"  return {card:'Behind you', copy:'behind you'};\n"
"}\n"
"// raceAlignment(goalId, raceIso, eventOn, todayIso?) → null when not an aligned goal, else\n"
)
EDITS.append(('E0 D182-countdown-fn', E0_OLD, E0_NEW))

# E1: D182-parse. raceStr through the one parser and formatter (weekday on purpose).
E1_OLD = "  if(c.raceDate){try{raceStr=new Date(c.raceDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}catch(_){raceStr=String(c.raceDate);}}\n"
E1_NEW = (
"  // D182 (V223): _fmtStartDay is _parseLocalDate underneath, the parser the engine and the header\n"
"  // use; an unreadable date prints as stored rather than as a wrong day.\n"
"  if(c.raceDate){try{raceStr=String(_fmtStartDay(c.raceDate, true));}catch(_){raceStr=String(c.raceDate);}}\n"
)
EDITS.append(('E1 D182-parse', E1_OLD, E1_NEW))

# E2: D182-countdown-field. raceWeeks goes; raceOut is live at render.
E2_OLD = "    raceStr, raceWeeks:(c.raceDateWeeks||p.raceDateWeeks||null),\n"
E2_NEW = "    raceStr, raceOut:raceCountdownWords(c.raceDate ? raceCountdown(c.raceDate) : null),   // D182: live at render, never the stored raceDateWeeks\n"
EDITS.append(('E2 D182-countdown-field', E2_OLD, E2_NEW))

# E3: D182-card-row. No s.raceWeeks guard; prints whenever a (readable) race date is set.
E3_OLD = "${row('Race date',s.raceStr||'No date set')}${s.raceWeeks?row('Time out',s.raceWeeks+' weeks'):''}"
E3_NEW = "${row('Race date',s.raceStr||'No date set')}${s.raceOut?row('Time out',s.raceOut.card):''}"
EDITS.append(('E3 D182-card-row', E3_OLD, E3_NEW))

# E4: D182-copytext.
E4_OLD = "if(s.eventTargeted)lines.push('Event: '+(s.raceStr||'no date')+(s.raceWeeks?' ('+s.raceWeeks+' wks out)':''));"
E4_NEW = "if(s.eventTargeted)lines.push('Event: '+(s.raceStr||'no date')+(s.raceOut?' ('+s.raceOut.copy+')':''));"
EDITS.append(('E4 D182-copytext', E4_OLD, E4_NEW))

# Assert every anchor first; abort on first miss.
for name, old, new in EDITS:
    n = src.count(old)
    print('%-26s anchor count=%d' % (name, n))
    if n != 1:
        print('ABORT: %s anchor count %d != 1; nothing written' % (name, n))
        sys.exit(1)

out = src
for name, old, new in EDITS:
    out = out.replace(old, new, 1)

# Post-conditions.
assert out.count('function raceCountdownWords(') == 1
assert out.count('raceWeeks') == 0, 'a raceWeeks reader survived'
assert out.count('s.raceOut') == 4
assert out.count("raceStr=new Date(c.raceDate)") == 0
assert out.count("new Date(c.raceDate)") == 1   # the mile sheet's (next slice), untouched here
assert out.count('<meta name="ia-version" content="222">') == 1

open(PATH, 'w', encoding='utf-8').write(out)
print('WROTE', PATH)
