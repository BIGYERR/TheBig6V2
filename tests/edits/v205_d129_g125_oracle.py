#!/usr/bin/env python3
# V205 slice 4 — g205_d125_spaced's rank-4 ORACLE is corrected, not the build.
# Line 133 transcribed the SHIPPED recBeforeLong predicate, `circ(d,longDay)===1 &&
# pos(d)<pos(longDay)`, on a Sunday-first day list. D129 rules that predicate WRONG for
# the pace family: it credits a Sunday easy run as padding a Saturday long run, the day
# AFTER it. `space()` in this gate is only ever called with TP (four call sites, all pace),
# so the correction is forked on the token set and TN behaviour is left alone.
import io, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, 'tests', 'gates', 'g205_d125_spaced.js')
with io.open(G, 'r', encoding='utf-8') as f: s = f.read()
old = """      const rbl = longDay && days.some(d=>typeOf[d]===T.rec && circ(d,longDay)===1 && pos(d)<pos(longDay)) ? 1 : 0;"""
new = """      // V205 (D129) CORRECTS THIS ORACLE LINE, and it is the oracle that was wrong.
      // It read `circ(d,longDay)===1 && pos(d)<pos(longDay)` — a circular week through the
      // Sunday-first DAYS list — so a Sunday easy run scored as padding a Saturday long
      // run, the day AFTER it. "A recovery run padding the long" means the eve, and
      // prevDay above is circular-correct. The correction is PACE-FAMILY ONLY, matching
      // the fork in the engine: NRC keeps the shipped predicate by ruling.
      const rbl = longDay && days.some(d=>typeOf[d]===T.rec && (T === TP
        ? d === prevDay(longDay)
        : (circ(d,longDay)===1 && pos(d)<pos(longDay)))) ? 1 : 0;"""
c = s.count(old)
print('oracle rank-4 line count=%d' % c)
if c != 1: sys.exit('ABORT')
with io.open(G, 'w', encoding='utf-8') as f: f.write(s.replace(old, new, 1))
print('WROTE tests/gates/g205_d125_spaced.js')
