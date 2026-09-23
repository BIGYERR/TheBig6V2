#!/usr/bin/env python3
# V208 slice 4a — D103a rename, index.html only (coach's table). Table-driven: every old string's
# count is asserted against the table BEFORE anything is written; all-or-nothing.
#   (1) run subtypes, buildRunSession only: CHI -> "Long Interval (LI)", INT -> "Short Interval (SI)";
#       the " — Taper" suffix is built on the head, and the halfstep " (re-entry)" suffix is appended
#       at run time, so both keep their suffix with the head swapped. Detail bodies unchanged.
#   (2) run note heads, buildRunSession only: "CHI:" -> "LI:" (2 sites), "INT:" -> "SI:" (5 sites:
#       coach's table said 4; the fifth is the template note "INT: Pace moves N seconds per mile each
#       week" on the same INT card, flagged in the handoff). Bike and swim notes keep CHI:/INT:.
#   (3) chips: keyed chi LI, int SI. Unkeyed: "long interval"/"(li)" LI, "short interval"/"(si)" SI;
#       a frozen run's old "continuous high" LI and "(int)" SI; bare "interval" (NRC "Speed Run —
#       Intervals") keeps INT. BUILDER SCOPE, flagged: the old-token mapping is for RUN cards only
#       (the callers pass the card's type); bike and swim keep their own CHI and INT names, so their
#       chips keep CHI and INT.
# Usage: python3 tests/edits/v208_slice4a_rename.py [target.html]   (default: index.html)
import sys
P = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
CHI_NOTE = "'CHI: Zone 3-4 (85-95% max HR). Hard sustained effort at tempo pace. As fitness improves, add reps before adding pace.'"
INT_NOTE = "'INT: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.'"
TABLE = [
  # (1) subtypes
  ("1 CHI subtype", "    subtype = 'Continuous High Intensity (CHI)' + (isTaperWeek ? ' — Taper' : '');\n",
                    "    subtype = 'Long Interval (LI)' + (isTaperWeek ? ' — Taper' : '');\n", 1),
  ("1 INT subtype", "    subtype = 'Interval (INT)' + (isTaperWeek ? ' — Taper' : '');\n",
                    "    subtype = 'Short Interval (SI)' + (isTaperWeek ? ' — Taper' : '');\n", 1),
  # (2) note heads
  ("2 CHI note head x2", "note = " + CHI_NOTE + ";", "note = " + CHI_NOTE.replace("'CHI: ", "'LI: ", 1) + ";", 2),
  ("2 INT note head x4", "note = " + INT_NOTE + ";", "note = " + INT_NOTE.replace("'INT: ", "'SI: ", 1) + ";", 4),
  ("2 INT template note head", "note = `INT: Pace moves ", "note = `SI: Pace moves ", 1),
  # (3) chips
  ("3 runSessionCode",
   "function runSessionCode(sub, key){\n"
   "  // D103a (V208): a keyed NSW session wears the chip of its key, whatever its label says. The\n"
   "  // codes are today's; they change only at the LI/SI rename. long and easy have no row: their\n"
   "  // chip is the label's (LSD on the pace family, EASY on run_base). The test wears TEST, as the\n"
   "  // benchmark does.\n"
   "  var K={int:'INT', chi:'CHI', steady:'STDY', bench:'TEST', trial:'TEST'};\n"
   "  if(key && K[key]) return K[key];\n"
   "  var s=(sub||'').toLowerCase();\n"
   "  // Unkeyed and frozen strings: the CHI's names, old and new, before the generic interval test\n"
   "  // (\"long interval\" contains \"interval\"), so an old label and a renamed one wear one chip.\n"
   "  if(s.indexOf('long interval')>=0||s.indexOf('(li)')>=0||s.indexOf('continuous high')>=0) return 'CHI';\n"
   "  if(s.indexOf('short interval')>=0||s.indexOf('(si)')>=0) return 'INT';\n"
   "  if(s.indexOf('interval')>=0) return 'INT';\n",
   "function runSessionCode(sub, key, type){\n"
   "  // D103a (V208): a keyed NSW session wears the chip of its key, whatever its label says. The\n"
   "  // CHI is the Long Interval (LI) and the INT the Short Interval (SI). long and easy have no row:\n"
   "  // their chip is the label's (LSD on the pace family, EASY on run_base). The test wears TEST, as\n"
   "  // the benchmark does.\n"
   "  var K={int:'SI', chi:'LI', steady:'STDY', bench:'TEST', trial:'TEST'};\n"
   "  if(key && K[key]) return K[key];\n"
   "  var s=(sub||'').toLowerCase(), run=!type||type==='run';\n"
   "  // Unkeyed and frozen strings, before the generic interval test (\"long interval\" contains\n"
   "  // \"interval\"): both names of each run class wear one chip. A frozen run's old names read LI and\n"
   "  // SI; bike and swim keep their own CHI and INT names, so their chips keep CHI and INT. A bare\n"
   "  // \"interval\" with no parenthetical (Nike's \"Speed Run — Intervals\") keeps INT.\n"
   "  if(s.indexOf('long interval')>=0||s.indexOf('(li)')>=0) return 'LI';\n"
   "  if(s.indexOf('short interval')>=0||s.indexOf('(si)')>=0) return 'SI';\n"
   "  if(s.indexOf('continuous high')>=0) return run?'LI':'CHI';\n"
   "  if(s.indexOf('(int)')>=0) return run?'SI':'INT';\n"
   "  if(s.indexOf('interval')>=0) return 'INT';\n", 1),
  ("3 dayCode passes the type", "bot=runSessionCode(c.subtype||'', c.dose&&c.dose.key);",
                                "bot=runSessionCode(c.subtype||'', c.dose&&c.dose.key, c.type);", 1),
  ("3 strip passes the sport", "const code=runSessionCode(sub||'', dose&&dose.key);",
                               "const code=runSessionCode(sub||'', dose&&dose.key, sport);", 1),
]
bad = [(n, src.count(o), c) for n, o, _, c in TABLE if src.count(o) != c]
if bad:
    sys.exit('ABORT: ' + '; '.join('"%s" count=%d want %d' % b for b in bad) + ' — nothing written')
for n, o, new, c in TABLE:
    src = src.replace(o, new)
open(P, 'w', encoding='utf-8').write(src)
print('applied %d table rows to %s' % (len(TABLE), P))
