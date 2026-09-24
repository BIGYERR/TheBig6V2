# v215_closeB.py — V215 close, part B (3 edits). Coach's text. The ia-version meta is LAST.
#   1  tests/gates/g199_deload_arbitration.js: G1 and G2 read the DELOAD_HINGE row's G1 (1,350 on <= 214,
#      1,290 on 215) instead of the bare 1350. The replacement is built from the anchor itself, so the
#      label text between the two changes is carried byte for byte.
#   2  tests/gates/g210_equipment_denials.js: the D154 licence renews to 215 (D154 queued). D149_SHIPS = 215
#      stands (slice 3); the D149 licence is retired and is not touched here.
#   3  index.html: ia-version 214 -> 215, LAST.
#   python3 tests/edits/v215_closeB.py
import io, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
G1A = "  ok(g(N.dropped,'Leg isolation')===1350,'G1 Leg isolation DROPPED by the deload == 1,350. DENOMINATOR:"
G1B = "so the all-day-builds census moves by the same 1,350 ("
G2A = "  ok(g(N.droppedPost,'Leg isolation')===1350,'G2 of those dropped Leg isolation blocks, POSTERIOR-HOLDING == 1,350. SECOND DENOMINATOR:"
f199 = ROOT + 'tests/gates/g199_deload_arbitration.js'
s199 = io.open(f199, encoding='utf-8').read()
for a in (G1A, G1B, G2A):
    if s199.count(a) != 1: sys.exit(f"ABORT: g199 anchor count {s199.count(a)}: {a[:60]}, nothing written")
i = s199.index(G1A); j = s199.index(G2A) + len(G2A)
if not (i < s199.index(G1B) < s199.index(G2A)): sys.exit("ABORT: G1/G2 anchors out of order, nothing written")
blockA = s199[i:j]                      # one contiguous anchor: G1's line through G2's label head
blockB = (blockA
  .replace(G1A, "  ok(!!HROW&&g(N.dropped,'Leg isolation')===HROW.G1,'G1 Leg isolation DROPPED by the deload == '+(HROW?HROW.G1:'NO ROW')+' (the V'+IP.version+' DELOAD_HINGE_BY_VERSION row). DENOMINATOR:", 1)
  .replace(G1B, "so the all-day-builds census moves by the same '+(HROW?HROW.G1:'NO ROW')+' (", 1)
  .replace(G2A, "  ok(!!HROW&&g(N.droppedPost,'Leg isolation')===HROW.G1,'G2 of those dropped Leg isolation blocks, POSTERIOR-HOLDING == '+(HROW?HROW.G1:'NO ROW')+' (the row\\'s G1). SECOND DENOMINATOR:", 1))
if blockB.count('===1350') != 0 or blockB == blockA: sys.exit("ABORT: G1/G2 rewrite incomplete, nothing written")
EDITS = [
 ('tests/gates/g199_deload_arbitration.js', blockA, blockB),
 ('tests/gates/g210_equipment_denials.js', "const D154_SCOPED_TO = 214; // D154 queued", "const D154_SCOPED_TO = 215; // D154 queued"),
 ('index.html', '<meta name="ia-version" content="214">', '<meta name="ia-version" content="215">'),   # LAST
]
src = {}
for f, a, b in EDITS:
    if f not in src: src[f] = io.open(ROOT + f, encoding='utf-8').read()
    c = src[f].count(a)
    print(f"{f}: anchor count={c}")
    if c != 1: sys.exit(f"ABORT: {f} anchor count {c}, nothing written")
for f, a, b in EDITS:
    src[f] = src[f].replace(a, b, 1)
for f, a, b in EDITS:             # written in list order: the meta is the last byte to land
    io.open(ROOT + f, 'w', encoding='utf-8').write(src[f])
    print('written', f)
