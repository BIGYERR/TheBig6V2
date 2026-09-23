#!/usr/bin/env python3
# V208 slice 3 — D103a chip + history (coach-ruled). The chip reads the key but prints TODAY's codes
# (chips change only at the rename, slice 4); unkeyed and frozen strings get an LI/SI fallback so an
# old label and a renamed one wear the same chip; _runClass classes both label eras identically.
#   E1 runSessionCode(sub, key): int INT, chi CHI, steady STDY, bench TEST, trial TEST (ruled; today the
#      trial prints RUN). long and easy keep the label's code (LSD on the pace family, EASY on run_base).
#      Fallback: "long interval"/"(li)"/"continuous high" -> CHI and "short interval"/"(si)" -> INT,
#      BEFORE the generic interval test.
#   E2/E3 the two callers (dayCode, _doseStripHTML) pass the dose key.
#   E4 _runClass: the CHI's rename tokens ((LI), long interval) class as Tempo BEFORE the interval
#      test. BUILDER DEVIATION, flagged: only the rename tokens move ahead; the rest of the Tempo test
#      stays where it was. Moving the whole Tempo test ahead reclassifies NRC "Speed Run — Tempo" from
#      Interval to Tempo (1 of 42 printed subtypes); this order flips 0.
# Usage: python3 tests/edits/v208_slice3_d103a_chip.py [target.html]   (default: index.html)
import sys
P = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
  ("E1 runSessionCode reads the key, prints today's codes, and knows both label eras",
   "function runSessionCode(sub){\n"
   "  var s=(sub||'').toLowerCase();\n"
   "  if(s.indexOf('interval')>=0) return 'INT';\n"
   "  if(s.indexOf('continuous high')>=0) return 'CHI';\n",
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
   "  if(s.indexOf('interval')>=0) return 'INT';\n"),
  ("E2 dayCode passes the key",
   "  else if(c){ bot=runSessionCode(c.subtype||''); botColor=topColor; }\n",
   "  else if(c){ bot=runSessionCode(c.subtype||'', c.dose&&c.dose.key); botColor=topColor; }\n"),
  ("E3 _doseStripHTML passes the key",
   "  const code=runSessionCode(sub||'');\n",
   "  const code=runSessionCode(sub||'', dose&&dose.key);\n"),
  ("E4 _runClass: the CHI's rename tokens class as Tempo before the interval test",
   "  if(/interval|\\(INT\\)|speed/i.test(s)) return 'Interval';\n",
   "  // D103a (V208): ORDER IS LOAD-BEARING. \"Long Interval (LI)\" is the CHI renamed and contains\n"
   "  // \"interval\", so its tokens class it as Tempo BEFORE the interval test; the INT's new name joins\n"
   "  // the interval test. One program's history never splits across the rename. Only the rename\n"
   "  // tokens move ahead: every label printed today keeps its class (NRC \"Speed Run — Tempo\" stays\n"
   "  // Interval).\n"
   "  if(/\\(LI\\)|long interval/i.test(s)) return 'Tempo';\n"
   "  if(/interval|\\(INT\\)|\\(SI\\)|short interval|speed/i.test(s)) return 'Interval';\n"),
]
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor "%s" count=%d (want 1); nothing written' % (name, n))
    src = src.replace(old, new, 1)
open(P, 'w', encoding='utf-8').write(src)
print('applied %d edits to %s' % (len(EDITS), P))
