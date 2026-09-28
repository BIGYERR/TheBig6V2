#!/usr/bin/env python3
# v223_t10_g222_5l_licence.py — tests only. g222_d181_chain row 5L licence: era 222 -> eras [222, 223].
#
# RULING: tests/measure/v223_rulings/d181_5l_licence_v223.md (coach, D181 5L licence re-ruling V223):
#   EXTEND by era list, same cap (LIC5L_MAX 70, LIC5L_OF 15545), same MAP conjunct (resOff.length === 0),
#   name.length === 0 unchanged, every other row unchanged. Predicate text exactly: LIC5L_ERAS.includes(VER).
#   (1) const LIC5L_ERA = 222 -> const LIC5L_ERAS = [222, 223]; the predicate -> LIC5L_ERAS.includes(VER)
#   (2) GRANTED/REFUSED console strings (the 5L licence line AND the R5L got-string, which printed "at 222" /
#       "REFUSED above 222: 0") and the header comment :48-50 name eras 222, 223; above the last listed era
#       REFUSED, residue 0 until re-ruled
#   (3) R5L label "within the V222 residue licence" -> "within the residue licence (eras 222, 223)"
#   (4) after `const name = ..., det = ..., resOff = ...`, one print of the residue's unique
#       `live detail -> boot detail` pairs with counts
# Other uses of LIC5L_ERA in the file: the declaration :85, the predicate :181, the REFUSED branch of the
# licence console line :182. None outside this gate (grep tests/). All three re-pointed below.
# Literal bytes for × and the em-dash; no \uXXXX escapes are needed here.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g222_d181_chain.js'
src = open(P, encoding='utf-8').read()

EDITS = [
 # (1a) declaration
 ("const LIC5L_ERA = 222, LIC5L_MAX = 70, LIC5L_OF = 15545;",
  "const LIC5L_ERAS = [222, 223], LIC5L_MAX = 70, LIC5L_OF = 15545;"),
 # (1b) predicate, (2) licence console line
 ("const LIC5L = VER === LIC5L_ERA;\n"
  "console.log('  5L licence: ' + (LIC5L ? 'GRANTED at ia-version ' + VER + ' (residue <= ' + LIC5L_MAX + ', each residue row = MAP boot)' : 'REFUSED at ia-version ' + VER + ' (keyed on ' + LIC5L_ERA + ' only, standing ruling 2): residue must be 0 until re-ruled'));",
  "const LIC5L = LIC5L_ERAS.includes(VER);\n"
  "console.log('  5L licence: ' + (LIC5L ? 'GRANTED at ia-version ' + VER + ' (eras ' + LIC5L_ERAS.join(', ') + '; residue <= ' + LIC5L_MAX + ', each residue row = MAP boot)' : 'REFUSED at ia-version ' + VER + ' (eras ' + LIC5L_ERAS.join(', ') + ' only, standing ruling 2; above the last listed era ' + LIC5L_ERAS[LIC5L_ERAS.length - 1] + '): residue must be 0 until re-ruled'));"),
 # (2) header comment :50
 ("//                  is a predicate on ia-version == 222: above 222 it is REFUSED and 5L demands a residue of 0 until re-ruled.\n",
  "//                  is a predicate on ia-version, LIC5L_ERAS.includes(VER): eras 222, 223 (each added by a re-ruling that\n"
  "//                  printed the same 68 rows); above the last listed era REFUSED, residue 0 until re-ruled.\n"),
 # (3) R5L label
 ("slot detail != live within the V222 residue licence;",
  "slot detail != live within the residue licence (eras 222, 223);"),
 # (4) residue pairs print, after the name/det/resOff line
 ("resOff = det.filter(r => r.mapBoot !== r.boot);\n",
  "resOff = det.filter(r => r.mapBoot !== r.boot);\n"
  "  { const pr = {}; det.forEach(r => { const k = r.slotLive.d + ' -> ' + r.slotBoot.d; pr[k] = (pr[k] || 0) + 1; });\n"
  "    const ks = Object.keys(pr).sort((a, b) => pr[b] - pr[a] || (a < b ? -1 : a > b ? 1 : 0));\n"
  "    console.log('    5L residue pairs (live detail -> boot detail): ' + (ks.length ? ks.length + ' unique' : 'none'));\n"
  "    ks.forEach(k => console.log('      ' + pr[k] + '× ' + k)); }\n"),
 # (2) R5L got-string: the licence clause names the era list
 ("' (licence ' + (LIC5L ? '<= ' + LIC5L_MAX + ' of ' + LIC5L_OF + ' at 222' : 'REFUSED above 222: 0') + ')",
  "' (licence ' + (LIC5L ? '<= ' + LIC5L_MAX + ' of ' + LIC5L_OF + ', eras ' + LIC5L_ERAS.join(', ') : 'REFUSED above ' + LIC5L_ERAS[LIC5L_ERAS.length - 1] + ': 0') + ')"),
]

for i, (a, b) in enumerate(EDITS):
    n = src.count(a)
    if n != 1:
        sys.exit('ABORT: anchor %d count %d (want 1): %r' % (i, n, a[:90]))
    src = src.replace(a, b)

if 'LIC5L_ERA ' in src or 'LIC5L_ERA)' in src or 'LIC5L_ERA;' in src:
    sys.exit('ABORT: a bare LIC5L_ERA reference survives')

open(P, 'w', encoding='utf-8').write(src)
print('OK: %d replacements written to %s' % (len(EDITS), P))
