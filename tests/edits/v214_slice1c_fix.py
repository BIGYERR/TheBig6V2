#!/usr/bin/env python3
# V214 slice 1c (coach ruling, V214 proof): D158's eve insert SKIPS the protect-park modes.
# Under the D113a exclusion key (noimpact, noimpact_swim, easy, reduce) the test is parked: there is no
# race week, so the eve keeps V213's handling (no shakeout, and the eve stays in _pin.rest when the
# trial moved off it). Measured on a copy (tests/measure/v214_fix_split.js, scratchpad/fx/COPY): the
# excluded modes byte-identical to V213 (4,704/4,704), lift-role changes on T-2/T-1/T0 468 -> 0 and
# 141 -> 0, uninjured / halfstep / swimout identical to the V214 candidate, HALF_MANNY unmoved.
# 2 edits: (1) index.html guard (+ comment); (2) sabotage spec entry S4 in tests/sabotage/v214_d158.json.
# The g214 rows are v214_slice1c_rows.py. No ia-version change.
import io, sys, json
IDX = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
SPEC = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v214_d158.json'
x = io.open(IDX, encoding='utf-8').read()
OLD = "    if(_pin.test && cardioGoals.run){\n"
NEW = ("    // V214 (coach, fix): not under the protect-park modes (the D113a exclusion key: noimpact,\n"
       "    // noimpact_swim, easy, reduce). A parked test has no race week, so the eve keeps V213's handling.\n"
       "    if(_pin.test && cardioGoals.run && !_d113Excl){\n")
c = x.count(OLD); print('index.html  D158 guard anchor                     count=%d' % c)
d = x.count('const _d113Excl = '); print('index.html  _d113Excl declared once               count=%d' % d)
spec = json.load(io.open(SPEC, encoding='utf-8'))
have = [m['name'] for m in spec if m['name'].startswith('S4-')]; print('spec  S4 already present                            %d' % len(have))
if c != 1 or d != 1 or have:
    sys.exit('ABORT: an anchor did not appear exactly once (or S4 exists). Nothing written.')
spec.append({
  "name": "S4-D158 fix -> the eve insert ignores the exclusion key: under noimpact / noimpact_swim / easy / reduce a parked test's eve gets the shakeout and leaves _pin.rest, so it gains a lift role",
  "anchor": "    if(_pin.test && cardioGoals.run && !_d113Excl){",
  "replacement": "    if(_pin.test && cardioGoals.run){",
  "gate": "gates/g214_d158_eve.js",
  "note": "NAMED TRIP: D7 (pair 214/213: lift-role changes on T-2/T-1/T0) and D8 (ruling-level: an excluded-mode eve differs from V213's handling). The gate reads V213 from git bc3cccc when no baseline is passed, as sabotage.py runs it."
})
io.open(SPEC, 'w', encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n'); print('WROTE', SPEC)
io.open(IDX, 'w', encoding='utf-8').write(x.replace(OLD, NEW, 1)); print('WROTE', IDX)
