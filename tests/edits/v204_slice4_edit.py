#!/usr/bin/env python3
# V204 slice 4 — D126, final code slice.
# Re-point the last two reachable ':60' seconds limbs at _clkMS (declared at :2188).
# Both are wizard-time live pace lines; their inputs are non-integer by construction.
# ia-version STAYS at 203 this slice (no meta bump).
import sys, io

PATH = 'index.html'
with io.open(PATH, encoding='utf-8') as f:
    src = f.read()

orig = src
reps = []

# EDIT 1 — formatPacePerMile. Guard and '/mi' suffix preserved verbatim.
reps.append((
"""function formatPacePerMile(totalSecs, distMiles) {
  if(!totalSecs || !distMiles || distMiles <= 0) return '';
  const paceSecPerMile = totalSecs / distMiles;
  const pm = Math.floor(paceSecPerMile / 60);
  const ps = Math.round(paceSecPerMile % 60);
  return pm + ':' + String(ps).padStart(2,'0') + '/mi';
}""",
"""function formatPacePerMile(totalSecs, distMiles) {
  if(!totalSecs || !distMiles || distMiles <= 0) return '';
  const paceSecPerMile = totalSecs / distMiles;
  return _clkMS(paceSecPerMile) + '/mi';
}"""))

# EDIT 2 — formatPacePer100. Guard, the /100 divisor and the '/100' suffix preserved verbatim.
reps.append((
"""function formatPacePer100(totalSecs, dist) {
  if(!totalSecs || !dist || dist <= 0) return '';
  const per100 = totalSecs / (dist / 100);
  const m = Math.floor(per100 / 60);
  const s = Math.round(per100 % 60);
  return m + ':' + String(s).padStart(2, '0') + '/100';
}""",
"""function formatPacePer100(totalSecs, dist) {
  if(!totalSecs || !dist || dist <= 0) return '';
  const per100 = totalSecs / (dist / 100);
  return _clkMS(per100) + '/100';
}"""))

for i, (old, new) in enumerate(reps, 1):
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %d count==%d (expected 1)\n' % (i, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('anchor %d: count==1, replaced' % i)

if src == orig:
    sys.stderr.write('ABORT: no change\n')
    sys.exit(1)

with io.open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)
print('WROTE %s' % PATH)
