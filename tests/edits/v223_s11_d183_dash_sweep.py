#!/usr/bin/env python3
# V223 build 3, D183 (P-SAFEPACE) slice S8, the last D183 code slice: amendment 2 (e), the remaining
# athlete-facing em-dashes on the cardio step.
# Ruling: tests/measure/v223_rulings/p_safepace_ruling.md, amendment 2 (e), verbatim strings.
#   E1  alignedStartCopy: the two escaped U+2014 pairs.
#       '</b> — N weeks from now — so it peaks on race week, not early.'
#         -> '</b>, N weeks from now, so it peaks on race week and not early.'
#       ' so race week is week N — you open in <b>week '  ->  ' so race week is week N. You open in <b>week '
#       "30–45" and "Weeks 1–" are structural digit ranges and stay.
#   E2  _mileEntryState: the five strings exactly as (e). The D116 mid-program mile sheet shares this
#       validator, so it gets the same strings (intended by the ruling).
# Session decision on plan flag F1: formatPacePer100 and formatPacePerMile stay (no E3/E4).
# Kept byte-identical: buildProgram, every NRC session string, D14a numbers and structure, everything
# already landed. NO version bump (stays 222).
# Every \uXXXX escape that appears in the source is built with chr(92) (BS below), never typed; the
# em-dash in the _mileEntryState anchors is the literal U+2014 byte sequence actually in the file.
# Every anchor is asserted count==1 on the in-memory text before it is replaced; the first miss aborts
# the whole script and nothing is written.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
BS = chr(92)
U2014 = BS + 'u2014'
U2019 = BS + 'u2019'

src = open(PATH, encoding='utf-8').read()
orig = src

def rep(label, old, new):
    global src
    c = src.count(old)
    if c != 1:
        print('ABORT %s: anchor count=%d (expected 1). Nothing written.' % (label, c))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('OK    %s: anchor count=1, replaced' % label)

# ── E1  alignedStartCopy (amendment 2 (e), :1964 and :1966 in the ruling's numbering)
E1A_OLD = ("'</b> " + U2014 + " '+al.futureWeeks+' week'+(al.futureWeeks===1?'':'s')+' from now "
           + U2014 + " so it peaks on race week, not early.")
E1A_NEW = ("'</b>, '+al.futureWeeks+' week'+(al.futureWeeks===1?'':'s')+' from now, so it peaks on race week and not early.")
rep('E1a alignedStartCopy futureWeeks sentence', E1A_OLD, E1A_NEW)

E1B_OLD = "'</b> so race week is week '+al.tw+' " + U2014 + " you open in <b>week '+al.openWeek+'</b>.';"
E1B_NEW = "'</b> so race week is week '+al.tw+'. You open in <b>week '+al.openWeek+'</b>.';"
rep('E1b alignedStartCopy openWeek sentence', E1B_OLD, E1B_NEW)

# ── E2  _mileEntryState: the five strings (amendment 2 (e), :7497 to :7501 in the ruling's numbering)
E2_OLD = (
    "  if(!(mm>=0)||!(ss>=0)||ss>=60||!isFinite(sec)) return {ok:false,msg:'That mile time isn" + U2019 + "t a real time — check the minutes and seconds.'};\n"
    "  if(sec<180) return {ok:false,msg:'Under 3:00 isn" + U2019 + "t a mile time — the world record is 3:43. Check the entry.'};\n"
    "  if(sec>1500) return {ok:false,msg:'Over 25:00 reads as a walk, not a run — leave it blank and the program anchors on your experience level instead.'};\n"
    "  if(sec<300) return {ok:true,adv:'At '+_fmtMileAnchor(sec)+' your paces come from the chart" + U2019 + "s fastest row (5:00) — it tops out there.'};\n"
    "  if(sec>720) return {ok:true,adv:'At '+_fmtMileAnchor(sec)+' your paces come from the 12:00 row — the chart" + U2019 + "s slowest. Consider a base-building block first.'};\n"
)
E2_NEW = (
    "  // D183 (P-SAFEPACE amendment 2 (e)): no mid-sentence dashes; the D116 mile sheet shares these strings.\n"
    "  if(!(mm>=0)||!(ss>=0)||ss>=60||!isFinite(sec)) return {ok:false,msg:'That mile time is not a real time. Check the minutes and seconds.'};\n"
    "  if(sec<180) return {ok:false,msg:'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.'};\n"
    "  if(sec>1500) return {ok:false,msg:'Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.'};\n"
    "  if(sec<300) return {ok:true,adv:'At '+_fmtMileAnchor(sec)+' your paces come from the chart" + U2019 + "s fastest row, 5:00. It tops out there.'};\n"
    "  if(sec>720) return {ok:true,adv:'At '+_fmtMileAnchor(sec)+' your paces come from the 12:00 row, the chart" + U2019 + "s slowest. Consider a base block first.'};\n"
)
rep('E2 _mileEntryState five strings', E2_OLD, E2_NEW)

if src == orig:
    print('ABORT: no change produced. Nothing written.')
    sys.exit(1)
open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE %s (%d -> %d bytes)' % (PATH, len(orig.encode('utf-8')), len(src.encode('utf-8'))))
