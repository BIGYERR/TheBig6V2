#!/usr/bin/env python3
# V192 D42-c slice 3 — the shoulder slot prints a side for one-hand presses.
# No ia-version bump in this slice.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()

EDITS = []

# ── 1) sidecar map + predicate, immediately after _CARRY_PER_SIDE / _carryRx ─────
A1 = """const _CARRY_PER_SIDE={'Suitcase carry':1,'Overhead carry':1};
function _carryRx(dist,name,qual){
  return dist + (_CARRY_PER_SIDE[String(name||'').trim()]?' each':'') + (qual?', '+qual:'');
}
"""
B1 = """const _CARRY_PER_SIDE={'Suitcase carry':1,'Overhead carry':1};
function _carryRx(dist,name,qual){
  return dist + (_CARRY_PER_SIDE[String(name||'').trim()]?' each':'') + (qual?', '+qual:'');
}
// ── PRESS SIDE (V192, D42-c) ─────────────────────────────────────────────────
// The shoulder slot never printed a side. A kettlebell single-arm press shipped as
// '3×12' with no arm named, so half the prescription was invisible: the athlete
// either guessed twelve total or twelve per arm, and either way the trunk work an
// offset press exists for is unspecified. Carries have printed a side since V177
// D-d and a one-hand press is the same claim, so the same shape settles it.
// Keyed off the pool, not a regex on the name, because the pool is the only place
// that knows a press is one-handed. Barbell overhead press, Dumbbell Arnold press,
// Dumbbell lateral raise and Barbell push press are two-hand or two-side movements
// and must NOT print 'each'.
const _PRESS_PER_SIDE={'Kettlebell single-arm press':1,'Landmine rotational press':1};
function _isOneArmPress(name){ return !!_PRESS_PER_SIDE[String(name||'').trim()]; }
"""
EDITS.append(('1: _PRESS_PER_SIDE sidecar', A1, B1))

# ── 2) push_light Main pairing — shoulder[1] at 3×12 ─────────────────────────────
A2 = "{name:ex.shoulder[1],detail:vsets(3)+'×12'}]});"
B2 = "{name:ex.shoulder[1],detail:vsets(3)+'×12'+(_isOneArmPress(ex.shoulder[1])?' each':'')}]});"
EDITS.append(('2: push_light Main pairing shoulder[1]', A2, B2))

# ── 3) heavy push Main pairing — shoulder[0] at 3×8 ─────────────────────────────
A3 = "{name:ex.shoulder[0],detail:vsets(3)+'×8'}]});"
B3 = "{name:ex.shoulder[0],detail:vsets(3)+'×8'+(_isOneArmPress(ex.shoulder[0])?' each':'')}]});"
EDITS.append(('3: heavy push Main pairing shoulder[0]', A3, B3))

# ── 4) Accessory superset — _sp.b is the shoulder leg (B list = shoulderAccPool) ──
A4 = "s.push({label:'Accessory',superset:_sp.ok,rounds:vsets(3),items:[{name:_sp.a,detail:vsets(3)+'×10'},{name:_sp.b,detail:vsets(3)+'×15'}]});"
B4 = "s.push({label:'Accessory',superset:_sp.ok,rounds:vsets(3),items:[{name:_sp.a,detail:vsets(3)+'×10'},{name:_sp.b,detail:vsets(3)+'×15'+(_isOneArmPress(_sp.b)?' each':'')}]});"
EDITS.append(('4: push Accessory superset _sp.b', A4, B4))

fail = False
for label, a, b in EDITS:
    n = src.count(a)
    print('ANCHOR %-42s count=%d' % (label, n))
    if n != 1:
        print('  ABORT: expected exactly 1')
        fail = True
if fail:
    sys.exit(1)

for label, a, b in EDITS:
    src = src.replace(a, b, 1)

io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE', P)
