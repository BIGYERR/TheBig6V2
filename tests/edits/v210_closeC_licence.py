# v210_closeC_licence.py — V210 close, part C: re-scope g210_equipment_denials.js to what V210 ships.
# D149 (the GHD station, slices 4 and 5) is HELD out of V210 (coach). V210's scope ends at slice 3,
# so the whole-tier totals (O3z) and the HALF_MANNY era-row check (O6r) ENFORCE now. The GHD rows
# (O3g, O3g5, O4g) and the GHD share of O3z go under a D149 HELD licence keyed ia-version <= 210:
# SCOPED OUT (D149 held) with live counts, never PASS, FAIL above the licence. Renew by one per
# build until D149 ships (g202's D142 pattern; this gate's D154 scope-out). Tests only.
#   python3 tests/edits/v210_closeC_licence.py
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
F = os.path.join(ROOT, 'tests', 'gates', 'g210_equipment_denials.js')
s = open(F, encoding='utf-8').read()
EDITS = [
 # header: the slice list
 ("//   4  D149-D1..D3  the GHD station: hasGHD, its own clause in _gearOK, the same in _auxGearOK\n"
  "//   5  D149-D4a,D4b the two injury literals: ankle/protect's squat pool, hip/protect's hip pool\n"
  "//   FINAL           the whole-tier totals (O3z) and the HALF_MANNY era-table row (O6r)\n",
  "//   4  D149-D1..D3  the GHD station: HELD out of V210 (coach); its rows sit under the D149 licence\n"
  "//   5  D149-D4a,D4b the two injury literals (ankle/protect, hip/protect): HELD with slice 4\n"
  "//   FINAL = 3       V210's scope ends at slice 3: the whole-tier totals (O3z) and the HALF_MANNY\n"
  "//                   era-table row (O6r) ENFORCE on V210\n"),
 # header: the licence paragraph, after D154's
 ("// on the first build after V210 unless D154 has shipped.\n",
  "// on the first build after V210 unless D154 has shipped.\n"
  "//\n"
  "// D149 LICENCE (standing ruling 2, a predicate, not prose). D149 is HELD out of V210 by coach:\n"
  "// slice 4 met its lens targets but lost home_full sections on long-run tier B days and injured\n"
  "// cells (O5b); it is parked for a ruling. While ia-version <= 210 the GHD rows (O3g, O3g5, O4g)\n"
  "// print SCOPED OUT (D149 held) with their live counts, never PASS, and O3z leaves the GHD share\n"
  "// out of its total. Above 210 they enforce and fail loudly. RENEW BY ONE PER BUILD until D149\n"
  "// ships (g202's D142 pattern), always keyed on a number that exists today.\n"),
 # constants
 ("const SLICES_BUILT = 3;          // slices 1 (D70c-A1..A4), 2 (D70c-B1, B2), 2b, 3 (D150) landed. Slice 4 (D149) is PARKED (O5d deletions, with coach); it moves this to 4.",
  None),  # placeholder, resolved below
]
# the SLICES_BUILT comment text as written by the slice-4 parking step
old_sb = "const SLICES_BUILT = 3;          // slices 1 (D70c-A1..A4), 2 (D70c-B1, B2), 2b, 3 (D150) landed. Slice 4 (D149) is PARKED (O5b deletions, with coach); it moves this to 4."
EDITS[2] = (old_sb,
  "const SLICES_BUILT = 3;          // slices 1 (D70c-A1..A4), 2 (D70c-B1, B2), 2b, 3 (D150): V210's whole scope. D149 is HELD (licence below).")
EDITS += [
 ("const FINAL = 5;",
  "const FINAL = 3;                 // V210's scope ends at slice 3: O3z and O6r enforce now"),
 ("const D154_SCOPED = VER <= 210;  // the D154 licence: the elbow renamer is out of scope through V210 only\n",
  "const D154_SCOPED = VER <= 210;  // the D154 licence: the elbow renamer is out of scope through V210 only\n"
  "const D149_HELD = VER <= 210;    // the D149 licence: the GHD station is HELD out of V210. Renew by one per build until D149 ships.\n"),
 ("let pass = 0, fail = 0, skip = 0, nyb = 0, fixt = 0, scoped = 0;",
  "let pass = 0, fail = 0, skip = 0, nyb = 0, fixt = 0, scoped = 0, held = 0;"),
 ("function skipRow(label){ skip++; console.log('SKIP ' + label); }\n",
  "function skipRow(label){ skip++; console.log('SKIP ' + label); }\n"
  "function heldRow(label, cond, got){\n"
  "  if(D149_HELD){ held++; console.log('SCOPED OUT (D149 held) ' + label + ' [D149 licence, ia-version <= 210] (now ' + got + ')'); return; }\n"
  "  ok(label, cond, got);\n"
  "}\n"),
 ("  SCOPED OUT ' + scoped + ' (D154 licence, ia-version <= 210)  SKIP ' + skip",
  "  SCOPED OUT ' + scoped + ' (D154 licence, ia-version <= 210)  SCOPED OUT (D149 held) ' + held + ' (D149 licence, ia-version <= 210)  SKIP ' + skip"),
 ("forEach(t => owned(4, 'O3g ' + t + ' prints no GHD station item (D149), the ankle/protect and hip/protect literals apart',",
  "forEach(t => heldRow('O3g ' + t + ' prints no GHD station item (D149), the ankle/protect and hip/protect literals apart',"),
 ("forEach(t => owned(5, 'O3g5 ' + t + ' prints no GHD station item on an ankle/protect or hip/protect day (D149 literals)',",
  "forEach(t => heldRow('O3g5 ' + t + ' prints no GHD station item on an ankle/protect or hip/protect day (D149 literals)',"),
 ("DENIED_TIERS.forEach(t => { const got = (B.ALL[t] || 0) - (D154_SCOPED ? rOf(t) : 0);\n"
  "  owned(FINAL, 'O3z ' + t + ' prints no denied item at all, injury cells included' + (D154_SCOPED ? ' (D154 renamer scoped out)' : ''), got === 0, got); });",
  "const ghdOf = t => g('G', t + '|GHD') + g('G5', t + '|GHD');\n"
  "DENIED_TIERS.forEach(t => { const got = (B.ALL[t] || 0) - (D154_SCOPED ? rOf(t) : 0) - (D149_HELD ? ghdOf(t) : 0);\n"
  "  const out = [D154_SCOPED ? 'D154 renamer' : '', D149_HELD ? 'D149 GHD share' : ''].filter(Boolean).join(' and ');\n"
  "  owned(FINAL, 'O3z ' + t + ' prints no denied item at all, injury cells included' + (out ? ' (' + out + ' scoped out)' : ''), got === 0,\n"
  "        got + (D149_HELD ? '; GHD share held ' + ghdOf(t) : '') + (D154_SCOPED ? '; renamer scoped ' + rOf(t) : '')); });"),
 ("  owned(4, 'O4g ' + t + ': no GHD station name in the universe, the swap sheet or a travel universe (D149)', got === 0, got); });",
  "  heldRow('O4g ' + t + ': no GHD station name in the universe, the swap sheet or a travel universe (D149)', got === 0, got); });"),
]
for i, (a, b) in enumerate(EDITS, 1):
    c = s.count(a); print(f"edit {i:2d} anchor count={c}")
    if c != 1: sys.exit(f"ABORT: anchor {i} count {c}, nothing written")
for a, b in EDITS:
    s = s.replace(a, b, 1)
open(F, 'w', encoding='utf-8').write(s)
print("written", F)
