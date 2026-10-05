#!/usr/bin/env python3
# V231 A5 — D194 Amendment 5 (tests/measure/v231_rulings/d194_amendment5_s32.md §3), gate tooling only.
#   (1) tests/sabotage/v230_d194.json, the S32 object: `gate` -> gates/g231_d194a4_lateplan.js and `note` -> the ruling's
#       text (the ruling's `<this file>` placeholder resolved to tests/measure/v231_rulings/d194_amendment5_s32.md, the
#       file the main session saved it as). Name, anchor and replacement unchanged.
#   (2) tests/gates/g230_d194_lens2.js, the `SKIP row d194-postsweep (ii)` line gains its successor (standing ruling 3's
#       spirit, the b-ONECLASS precedent).
# The new gate file tests/gates/g231_d194a4_lateplan.js is written directly (new file), not by this script.
# index.html is read (sha guard) and never written. Every anchor is asserted count==1 before anything is written.
import hashlib, json, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
CAND_SHA = '1b403743f8ad1b16'
SPEC = ROOT + '/tests/sabotage/v230_d194.json'
G230 = ROOT + '/tests/gates/g230_d194_lens2.js'

def die(m):
    print('ABORT: ' + m)
    sys.exit(1)

h = hashlib.sha256(open(ROOT + '/index.html', 'rb').read()).hexdigest()
if not h.startswith(CAND_SHA):
    die('index.html sha256 ' + h[:16] + ' is not the V231 candidate ' + CAND_SHA)

spec = open(SPEC, encoding='utf-8').read()
g230 = open(G230, encoding='utf-8').read()
before = json.loads(spec)

# ── (1) S32 gate + note ──
OLD_NOTE = '''NAMED TRIP: row d194-postsweep (ii) (tests/measure/v229_rulings/d194_injlens_ruling.md D194 Amendment 4, "Why not fix it inside V230", the first rejected option: narrowing the boot to the swapped items makes the boot LESS right and reopens the handoff :523 hole on overlay programs). The boot replay judges only the items it renamed, in the tap's single-item form, and leaves every other card as replayed, so on the 22 post-sweep reject days the booted day keeps `Burpees` and the RPE 8 `Pushups (slow 3s eccentric)` on both presentations: OV1 boot == fixture boot still, but boot == the hand oracle 0 of 88 (boot == live). Figure: M13 (tests/measure/v230_rulings/measure_postsweep_reject_m13.md [2]), V229 OV1 boot == live 88 of 88, is this shape. EXPECTED: d194-postsweep (ii). Other rows: none expected (d194-eq compares OV1 with the fixture and both narrow together; the D190 lattice, the L9 pairs and the hand routes run commercial builds, where no post-sweep reject exists); read on the run.'''
NEW_NOTE = '''NAMED TRIP: rows a4-dedupe (18: PRE1 4, PRE5 4, OVOV 2, OVT 8), a4-nojumps (26: PRE1 16, PRE5 4, OVOV 6) and a4-cards (0 of 3) (D194 Amendment 5, tests/measure/v231_rulings/d194_amendment5_s32.md; measure M20 tests/measure/v231_rulings/measure_s32_m20.md: equivalent on FIX/OV1/OV5/UNINJ/MIX, 22,647 differing booted days on PRE1/PRE5/OVOV/OVT). The narrowed boot judges only the renamed items in the tap's single-item form, so a late plan never drops, dedupes or relabels the rest of the day: a jump stays on a knee plan, a lift prints twice. EXPECTED: a4-dedupe, a4-nojumps, a4-cards; a4-ctl also fails on the mutant (its anchor is gone). g230 d194-postsweep (ii) was this mutation's row at 230 and is SKIP from 231 (absorb ruling §6); it is not expected to trip.'''
OLD_GATE = 'gates/g230_d194_lens2.js'
NEW_GATE = 'gates/g231_d194a4_lateplan.js'
S32_TAIL = 'if(_g&&_g.name===it.name) it.detail=_g.detail; });\\n",\n'   # end of S32's replacement line (JSON text)
A1 = S32_TAIL + '  "gate": ' + json.dumps(OLD_GATE) + ',\n  "note": ' + json.dumps(OLD_NOTE, ensure_ascii=False) + '\n }'
R1 = S32_TAIL + '  "gate": ' + json.dumps(NEW_GATE) + ',\n  "note": ' + json.dumps(NEW_NOTE, ensure_ascii=False) + '\n }'

# ── (2) g230 SKIP line ──
A2 = " rejects); its reach jobs do not run. Never PASS, never FAIL.');"
R2 = " rejects); its reach jobs do not run; its successor is g231_d194a4_lateplan a4-dedupe / a4-nojumps / a4-cards (D194 Amendment 5). Never PASS, never FAIL.');"
SKIP_HEAD = "P('SKIP row d194-postsweep (ii) the reach on the typed reject days:"

# ── anchors: all checked before any write ──
for nm, text, a in (('spec S32 gate+note', spec, A1), ('g230 SKIP tail', g230, A2), ('g230 SKIP head', g230, SKIP_HEAD)):
    n = text.count(a)
    if n != 1:
        die(nm + ' anchor count ' + str(n) + ' (expected 1)')
line = [l for l in g230.split('\n') if SKIP_HEAD in l]
if len(line) != 1 or A2 not in line[0]:
    die('g230 SKIP tail is not on the SKIP row d194-postsweep (ii) line')

spec2 = spec.replace(A1, R1)
g2302 = g230.replace(A2, R2)

# ── the JSON stays valid and only S32's gate/note moved ──
after = json.loads(spec2)
if len(after) != len(before):
    die('spec length changed')
for b, a in zip(before, after):
    if b['name'].startswith('S32-D194-A4'):
        if a['gate'] != NEW_GATE or a['note'] != NEW_NOTE:
            die('S32 gate/note not as ruled after replacement')
        if a['name'] != b['name'] or a['anchor'] != b['anchor'] or a['replacement'] != b['replacement'] or set(a) != set(b):
            die('S32 name/anchor/replacement/keys moved')
        if b['gate'] != OLD_GATE or b['note'] != OLD_NOTE:
            die('S32 old gate/note not the typed literal')
    elif a != b:
        die('a non-S32 object moved: ' + b['name'])
if g2302.count(R2) != 1 or g2302.count(A2) != 0:
    die('g230 SKIP replacement did not land once')

open(SPEC, 'w', encoding='utf-8').write(spec2)
open(G230, 'w', encoding='utf-8').write(g2302)
json.loads(open(SPEC, encoding='utf-8').read())   # parse after writing
print('OK v231_a5: S32 gate -> ' + NEW_GATE + ', note -> D194 Amendment 5 text; g230 SKIP row d194-postsweep (ii) names its successor; JSON valid; index.html untouched (' + h[:16] + ')')
