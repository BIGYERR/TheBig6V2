# v215_slice3_gates.py — V215 slice 3: g210's D149 licence is RETIRED, not renewed. D149 ships on
# ia-version 215, so D149_HELD_TO (renewed by one per build since V210) becomes a fixed era boundary,
# D149_SHIPS = 215. At or below 214 the GHD rows (O3g, O3g5, O4g) and O3z's GHD share keep their
# SCOPED OUT (D149 held) behaviour byte for byte; from 215 they enforce and assert 0. There is no
# renewal left to make: a later closeB that still tries to renew D149_HELD_TO misses its anchor and
# aborts, which is the loud outcome standing ruling 2 wants.
# D149's own rows live in tests/gates/g215_d149_ghd.js (written directly, not by this script).
# The D154 licence (D154_SCOPED_TO) is NOT touched here: it is renewed at close, as every closeB has.
# No index.html change.
#   python3 tests/edits/v215_slice3_gates.py
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g210_equipment_denials.js'
src = io.open(P, encoding='utf-8').read()
EDITS = [
 ("licence prose",
  "// cells (O5b); it is parked for a ruling. While ia-version <= D149_HELD_TO (212, renewed at V212)\n"
  "// the GHD rows (O3g, O3g5, O4g) print SCOPED OUT (D149 held) with their live counts, never PASS,\n"
  "// and O3z leaves the GHD share out of its total. Above it they enforce and fail loudly. RENEW BY ONE PER BUILD until D149\n"
  "// ships (g202's D142 pattern), always keyed on a number that exists today.\n",
  "// cells (O5b); it was parked for a ruling. While ia-version < D149_SHIPS (215) the GHD rows\n"
  "// (O3g, O3g5, O4g) print SCOPED OUT (D149 held) with their live counts, never PASS, and O3z leaves\n"
  "// the GHD share out of its total. RETIRED AT V215: D149 ships on 215 (coach's ruling with two\n"
  "// knee/protect floors; its own rows are tests/gates/g215_d149_ghd.js), so from 215 the GHD rows\n"
  "// enforce and assert 0. The boundary is fixed. It is never renewed again.\n"),
 ("the constant",
  "const D149_HELD_TO = 214; // D149 builds after V214\n",
  "const D149_SHIPS = 215;   // D149 shipped on V215: the licence is retired, never renewed\n"),
 ("the predicate",
  "const D149_HELD = VER <= D149_HELD_TO;      // the D149 licence: the GHD station is HELD. Renew by one per build until D149 ships.\n",
  "const D149_HELD = VER < D149_SHIPS;         // the D149 licence, retired: <= 214 the GHD station is HELD, from 215 its rows enforce.\n"),
 ("heldRow label",
  "' [D149 licence, ia-version <= ' + D149_HELD_TO + '] (now ' + got + ')'); return; }",
  "' [D149 licence, ia-version < ' + D149_SHIPS + '] (now ' + got + ')'); return; }"),
 ("summary label",
  "' (D149 licence, ia-version <= ' + D149_HELD_TO + ')  SKIP '",
  "' (D149 licence, ia-version < ' + D149_SHIPS + ')  SKIP '"),
]
for tag, a, b in EDITS:
    c = src.count(a)
    print(f"{tag}: anchor count={c}")
    if c != 1:
        sys.exit(f"ABORT: {tag} anchor count {c}, nothing written")
for tag, a, b in EDITS:
    src = src.replace(a, b, 1)
if 'D149_HELD_TO' in src:
    sys.exit("ABORT: D149_HELD_TO still referenced, nothing written")
io.open(P, 'w', encoding='utf-8').write(src)
print("written", P)
