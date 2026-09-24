#!/usr/bin/env python3
# V219 gate slice G2, edit 2: rescope g217_d160_dedupe_view.js to D160's own build (standing ruling 4).
# Session decision, coach concurred. K2..K6 and K1's V216 -> candidate delta are D160's build-scoped pair claims:
# above 218 each prints "SKIP pair row: candidate <v> is not D160's pair (217/218)" and does not count.
# Durable on every build: I0, F0, P1, W1, U1, U2, C1, K0 and K1's candidate side (0 phantoms). From 219 the
# candidate pairs by calendar (D167), so its "previous day" is the calendar previous day by Monday-start date
# arithmetic (not the pair the engine logged). V216's side keeps its logged pair.
import sys
F = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g217_d160_dedupe_view.js'
s = open(F, encoding='utf-8').read()

K1_OLD_START = "    LIMS.forEach(l => { if(!KROW) return noRow('K1 ' + l);"
K6_LINE = "    if(FWD === undefined) noRow('K6'); else ok('K6 gk accessory today == Main tomorrow: candidate ' + FWDN[1] + ' (' + FWD + '), V216 ' + FWDN[0], FWDN[1] === FWD);\n"

EDITS = [
  # E0 header: the rescope, stated on the file.
  ("//   and SKIPs by name on every other pair. Every other row is ruling-level from 217 up.\n",
   "//   and SKIPs by name on every other pair. Every other row is ruling-level from 217 up.\n"
   "//   V219 RESCOPE (standing ruling 4; session decision, coach concurred): K2, K3, K4, K5, K6 and K1's V216 ->\n"
   "//   candidate delta are D160's build-scoped pair claims. For a candidate above 218 each prints\n"
   "//   \"SKIP pair row: candidate <v> is not D160's pair (217/218)\" and does not count: from D170 on, later rulings\n"
   "//   move V216-era cards by ruling, and D167's own class is asserted in its own gate. Durable on every build: I0,\n"
   "//   F0 (a fixture of V216 itself), P1, W1, U1, U2, C1, K0 and K1's candidate side (0 phantoms). From 219 the\n"
   "//   dedupe pairs by calendar (D167), so the candidate's previous day is the calendar previous day by\n"
   "//   Monday-start date arithmetic (calPrev), never the pair the engine logged.\n"),
  # E1 the scope predicate, the SKIP line, and the calendar oracle.
  ("const skipRow = l => { skip++; console.log('SKIP ' + l); };\n",
   "const skipRow = l => { skip++; console.log('SKIP ' + l); };\n"
   "const PAIR_SCOPE = VER <= 218;   // D160's own pair (217/218); above it the pair rows SKIP (V219 rescope)\n"
   "const skipPair = r => skipRow('pair row: candidate ' + VER + ' is not D160\\'s pair (217/218): ' + r);\n"
   "const CALPREV = VER >= 219;   // D167: the candidate's dedupe pairs by calendar\n"
   "const ISO7 = ['mon','tue','wed','thu','fri','sat','sun'];\n"
   "const calPrev = (w, d) => { const i = ISO7.indexOf(d); return i > 0 ? { w:+w, d:ISO7[i - 1] } : { w:+w - 1, d:'sun' }; };   // Monday-start date arithmetic\n"),
  # E2 P1: the candidate's previous day is the calendar previous day from 219.
  ("const classify = (p, r) => { const P = dayOf(p, r.pw, r.pd);",
   "const classify = (p, r, cal) => { const pv = cal ? calPrev(r.w, r.d) : { w:r.pw, d:r.pd }, P = dayOf(p, pv.w, pv.d);"),
  ("const k = classify(C.p, r); if(k.scope){ bump(s.cPh, k.t);",
   "const k = classify(C.p, r, CALPREV); if(k.scope){ bump(s.cPh, k.t);"),
  # E3 K limb: rows are read only inside D160's pair scope; K1's candidate count reads the calendar previous day.
  ("  else if(!KROW && !TWIN && FWD === undefined) kErr =",
   "  else if(PAIR_SCOPE && !KROW && !TWIN && FWD === undefined) kErr ="),
  ("        if(!nK(dayOf(r.p, e.pw, e.pd)).map(lc).includes(lc(e.was))) P[k]++;\n",
   "        { const pv = (k && CALPREV) ? calPrev(e.w, e.d) : { w:e.pw, d:e.pd }; if(!nK(dayOf(r.p, pv.w, pv.d)).map(lc).includes(lc(e.was))) P[k]++; }\n"),
  (K1_OLD_START,
   "    if(!PAIR_SCOPE){ const K1MIX = Object.keys(D160_MULTI_BY_VERSION[217].phantoms);\n"
   "      LIMS.forEach(l => { const s = kz(l), mixes = K1MIX.filter(m => (/^gk /.test(m) ? 'gk' : 'multi') === l);\n"
   "        ok('K1 ' + l + ' candidate phantoms == 0, trigger absent from the calendar previous shipped day (' + s.cfg + '/' + KCOUNT[l] + ' configs, ' + s.crash + ' crashed): ' + mixes.map(m => m + ' ' + (PH[m] || ['-', '-'])[1]).join(', '),\n"
   "          s.cfg === KCOUNT[l] && s.crash === 0 && mixes.length > 0 && mixes.every(m => PH[m] && PH[m][1] === 0));\n"
   "        skipPair('K1 ' + l + ' V216 -> candidate delta'); });\n"
   "      ['K2 gk','K2 multi','K3','K4 gk','K4 multi','K5 gk','K5 multi','K6'].forEach(skipPair);\n"
   "    } else {\n"
   + K1_OLD_START),
  (K6_LINE, K6_LINE + "    }\n"),
]
for i, (a, b) in enumerate(EDITS):
    n = s.count(a)
    print('anchor E%d count %d :: %r' % (i, n, a[:60]))
    if n != 1:
        print('ABORT: anchor %d count %d' % (i, n)); sys.exit(2)
    s = s.replace(a, b, 1)
open(F, 'w', encoding='utf-8').write(s)
print('written')
