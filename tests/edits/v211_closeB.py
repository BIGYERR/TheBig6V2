#!/usr/bin/env python3
# V211 close, part B (coach's text; Mario authorized the bump). Run after v211_closeA.py.
#   1. g202_int_doctrine.js: the D142 three-run licence renews 210 -> 211 (THREE_RUN_LICENCE_TO, the
#      INT_MECHANISM four-run row's upTo and note tail, the header lines).
#   2. g210_equipment_denials.js: the two inline `VER <= 210` licences become named constants and
#      renew to 211 (D149_HELD_TO, D154_SCOPED_TO). The printed licence labels and the header prose
#      read the constants, so no line can say 210 while the predicate says 211.
#   3. g199: E6's label names the E3 era row it sits beside instead of a literal 60. E4, E5 and G4b
#      pins are unchanged (not ruled; they hold at 60).
#   4. index.html: ia-version meta 210 -> 211, the LAST replacement.
import io, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
F_G202 = ROOT + '/tests/gates/g202_int_doctrine.js'
F_G210 = ROOT + '/tests/gates/g210_equipment_denials.js'
F_G199 = ROOT + '/tests/gates/g199_deload_arbitration.js'
F_IDX = ROOT + '/index.html'

G202 = [
 ("header: licence refuses above 211",
  "// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 210 (renewed from 209 by D142 at V210).\n",
  "// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 211 (renewed from 210 by D142 at V211).\n"),
 ("header: keyed on 211",
  "// NOT THE DOCTRINE AS RULED. It is keyed on 210, a number that exists today, and the\n",
  "// NOT THE DOCTRINE AS RULED. It is keyed on 211, a number that exists today, and the\n"),
 ("INT_MECHANISM four-run row upTo 211 and note tail",
  "  { upTo: 210, arm: 'four-run', reps: 'table6',\n",
  "  { upTo: 211, arm: 'four-run', reps: 'table6',\n"),
 ("INT_MECHANISM comment: licensed to 211",
  "    // crossover's cross - 1, and that arm is LICENSED TO 210 and no further (D142 renewal at V210).\n",
  "    // crossover's cross - 1, and that arm is LICENSED TO 211 and no further (D142 renewal at V211).\n"),
 ("INT_MECHANISM note tail",
  "three-run arm still runs the V115 crossover and is licensed to 210 (D142 renewal at V210; D113a ruled, builds at V213)' }\n",
  "three-run arm still runs the V115 crossover and is licensed to 211 (D142 renewal at V211; D113a ruled, builds at V213)' }\n"),
 ("THREE_RUN_LICENCE_TO = 211",
  "const THREE_RUN_LICENCE_TO = 210; // V210 renewal (D142): D113a ruled by Mario with the fallback, builds at V213 (queue re-ordered at V210). Renew by one per build until D113a ships.\n",
  "const THREE_RUN_LICENCE_TO = 211; // V211 renewal (D142): D113a ruled by Mario with the fallback, builds at V213. Renew by one per build until D113a ships.\n"),
]

G210 = [
 ("header prose reads the constants",
  "// D154 LICENCE (standing ruling 2, a predicate, not prose). While ia-version <= 210 the R bucket\n"
  "// is SCOPED OUT: O3r prints SCOPED OUT with its live count (never PASS) and O3z leaves R out of\n"
  "// its total. Above 210 the licence expires, O3r enforces and O3z counts R, so the gap stays loud\n"
  "// on the first build after V210 unless D154 has shipped.\n",
  "// D154 LICENCE (standing ruling 2, a predicate, not prose). While ia-version <= D154_SCOPED_TO\n"
  "// (211, renewed at V211) the R bucket is SCOPED OUT: O3r prints SCOPED OUT with its live count\n"
  "// (never PASS) and O3z leaves R out of its total. Above it the licence expires, O3r enforces and\n"
  "// O3z counts R, so the gap stays loud on the first build after it unless D154 has shipped.\n"),
 ("header prose, D149",
  "// cells (O5b); it is parked for a ruling. While ia-version <= 210 the GHD rows (O3g, O3g5, O4g)\n"
  "// print SCOPED OUT (D149 held) with their live counts, never PASS, and O3z leaves the GHD share\n"
  "// out of its total. Above 210 they enforce and fail loudly. RENEW BY ONE PER BUILD until D149\n",
  "// cells (O5b); it is parked for a ruling. While ia-version <= D149_HELD_TO (211, renewed at V211)\n"
  "// the GHD rows (O3g, O3g5, O4g) print SCOPED OUT (D149 held) with their live counts, never PASS,\n"
  "// and O3z leaves the GHD share out of its total. Above it they enforce and fail loudly. RENEW BY ONE PER BUILD until D149\n"),
 ("named licence constants, renewed to 211",
  "const D154_SCOPED = VER <= 210;  // the D154 licence: the elbow renamer is out of scope through V210 only\n"
  "const D149_HELD = VER <= 210;    // the D149 licence: the GHD station is HELD out of V210. Renew by one per build until D149 ships.\n",
  "const D154_SCOPED_TO = 211; // D154 queued\n"
  "const D149_HELD_TO = 211; // D149 waits on D153+D155, both ship in V211; builds next\n"
  "const D154_SCOPED = VER <= D154_SCOPED_TO;  // the D154 licence: the elbow renamer is out of scope through D154_SCOPED_TO only\n"
  "const D149_HELD = VER <= D149_HELD_TO;      // the D149 licence: the GHD station is HELD. Renew by one per build until D149 ships.\n"),
 ("heldRow label reads D149_HELD_TO",
  "' [D149 licence, ia-version <= 210] (now ' + got + ')'); return; }\n",
  "' [D149 licence, ia-version <= ' + D149_HELD_TO + '] (now ' + got + ')'); return; }\n"),
 ("summary reads both constants",
  "' (D154 licence, ia-version <= 210)  SCOPED OUT (D149 held) ' + held + ' (D149 licence, ia-version <= 210)  SKIP '",
  "' (D154 licence, ia-version <= ' + D154_SCOPED_TO + ')  SCOPED OUT (D149 held) ' + held + ' (D149 licence, ia-version <= ' + D149_HELD_TO + ')  SKIP '"),
 ("O3r label reads D154_SCOPED_TO",
  "' [D154 licence, ia-version <= 210] (now ' + got + ')'); }\n",
  "' [D154 licence, ia-version <= ' + D154_SCOPED_TO + '] (now ' + got + ')'); }\n"),
]

G199 = [
 ("E6 label names the E3 row it sits beside",
  "Reported beside E3\\'s stage-local 60, never mixed into it');\n",
  "Reported beside E3\\'s stage-local '+(HROW?HROW.E3:'NO ROW')+' (the V'+IP.version+' DELOAD_HINGE_BY_VERSION row), never mixed into it');\n"),
]

IDX = [
 ("ia-version 210 -> 211 (LAST)",
  '<meta name="ia-version" content="210">',
  '<meta name="ia-version" content="211">'),
]

def rd(p): return io.open(p, encoding='utf-8').read()
PLAN = [(F_G202, G202), (F_G210, G210), (F_G199, G199), (F_IDX, IDX)]   # index.html last
srcs = {}
for f, E in PLAN:
    s = rd(f)
    for t, a, b in E:
        n = s.count(a)
        if n != 1: print('ABORT:', f.split('/')[-1], t, 'count', n); sys.exit(1)
    srcs[f] = s
if srcs[F_G199].count('const HROW=DELOAD_HINGE_ROW_FOR(IP.version)') != 1:
    print('ABORT: v211_closeA.py is not in the tree'); sys.exit(1)
for f, E in PLAN:
    s = srcs[f]
    for t, a, b in E: s = s.replace(a, b, 1); print('applied', f.split('/')[-1], '|', t)
    io.open(f, 'w', encoding='utf-8').write(s)
print('closeB written; ia-version is now 211')
