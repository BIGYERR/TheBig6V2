#!/usr/bin/env python3
# V207 slice B of D106a: the test week (coach limbs ii and iii, gaps 1 and 2 ruled).
#   B1 engineB: a test goal pinned to its test week takes raceWeekPin, weekday from the date alone.
#   B2 (two parts) the loop records run slots by assignedType in weeks tw-1..tw; the pin
#      post-pass turns the week's QUALITY slot (CHI, else INT) into the goal's own trial.
#   B4 (same post-pass hunk) T-1 / T-2 hard runs become that week's untagged easy LSD,
#      captured before the pin moves anything.
#   B3 raceEveLiftPass: the eve Shakeout regex gains NSW's easy run (run cards only), and the
#      NSW marker day is titled Test Day (goalId in PACE_GOALS); NRC keeps Race Day.
# NO version bump. Every anchor count==1 or abort. Usage: v207_sliceB_d106a_edit.py [path]
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()
EDITS = []

# ── B1: the pin ──────────────────────────────────────────────────────────────────────
B1_OLD = "  const _racePin = (_align && _align.tw === totalWeeks) ? raceWeekPin(_align, trainDays) : null;\n"
B1_NEW = (
"  // D106a (V207): a test goal pinned to its test week (cfg._testWeek, written by doGenerate)\n"
"  // takes the same race-week pin. The test weekday is a function of the test date alone, read\n"
"  // as a local date, so buildProgram stays pure. `test` tells the cardio post-pass to put the\n"
"  // goal's own trial in the week's quality slot.\n"
"  const _tRun = (!_align && cardioTypes.includes('run') && cardioGoals.run && PACE_GOALS.has(cardioGoals.run.id)\n"
"    && cfg._testWeek && cfg._testWeek === totalWeeks) ? _parseLocalDate(cfg.raceDate) : null;\n"
"  const _racePin = (_align && _align.tw === totalWeeks) ? raceWeekPin(_align, trainDays)\n"
"    : _tRun ? Object.assign(raceWeekPin({tw: totalWeeks, raceDay: _ISO_ORDER[(_tRun.getDay() + 6) % 7]}, trainDays), {test: true}) : null;\n"
)
EDITS.append(('B1 test pin', B1_OLD, B1_NEW))

# ── B2a: record the run slots the scheduler dealt, by slot ────────────────────────────
B2A_OLD = "      schedule[w][dayKey] = session;\n"
B2A_NEW = B2A_OLD + (
"      // D106a (V207): on a test pin, remember the run slots dealt in the test week and the week\n"
"      // before, by SLOT (assignedType), never by the card's name. The pin post-pass below puts\n"
"      // the trial in the quality slot and finds the easy run through these records.\n"
"      if(session && type === 'run' && cfg && cfg._racePin && cfg._racePin.test && w >= cfg._racePin.w - 1)\n"
"        (cfg._racePin.slots = cfg._racePin.slots || []).push({w, d: dayKey, t: assignedType});\n"
)
EDITS.append(('B2a slot records', B2A_OLD, B2A_NEW))

# ── B2b + B4: the trial in the quality slot, then nothing hard at T-1 / T-2 ───────────
B24_OLD = "    const wk = schedule[_pin.w];\n"
B24_NEW = B24_OLD + (
"    if(_pin.test){\n"
"      // D106a (V207): the test IS the week's quality slot: the CHI when the week has one, else\n"
"      // the INT (a three-run block at one or two weeks still deals the INT). The card is the\n"
"      // goal's own trial: distance fixed, the log takes the time, the pace derives. TIME TRIAL\n"
"      // in the subtype is what the finder below moves onto the test weekday.\n"
"      const _sl = _pin.slots || [];\n"
"      const _q = _sl.find(s => s.w === _pin.w && s.t === 'chi') || _sl.find(s => s.w === _pin.w && s.t === 'int');\n"
"      if(_q && wk[_q.d]){\n"
"        const _g = cardioGoals.run || {}, _pt = paceGoalTarget(_g), _u = _g.paceUnit === 'km' ? 'km' : 'mi';\n"
"        const _raw = parseFloat(_g.targetDist) || 1.5;\n"
"        const _dz = {k:'dist', mi: +_pt.tDist.toFixed(2)}; if(_pt.tPacePerMile) _dz.tgt = Math.round(_pt.tPacePerMile);\n"
"        wk[_q.d] = {type:'run', subtype: _raw + (_u === 'km' ? ' km' : ' Mile') + ' Test — TIME TRIAL',\n"
"          detail: _raw + ' ' + _u + '.' + (_pt.tTotalSecs ? ' Goal ' + _clkMS(_pt.tTotalSecs) + ' (' + _clkMS(_pt.tTotalSecs / _raw) + '/' + _u + ').' : ''),\n"
"          note: 'TEST DAY: Run it like the real thing. Warm up fully. Log your time. It anchors your next block.',\n"
"          week: _pin.w, goalId: wk[_q.d].goalId, dose: _dz, legLoad: true};\n"
"      }\n"
"      // D106a (V207, B4): nothing hard the day before the test or two days out (D38's window,\n"
"      // read across the week boundary like raceEveLiftPass). A hard run there becomes that\n"
"      // week's untagged easy LSD as it was dealt, captured here before the pin moves anything.\n"
"      // A week with no easy LSD rests the day instead.\n"
"      const _ez = {}; _sl.forEach(s => { if(s.t === 'lsd_easy' && !_ez[s.w] && schedule[s.w][s.d]) _ez[s.w] = schedule[s.w][s.d]; });\n"
"      const _fl = []; [_pin.w - 1, _pin.w].forEach(w => { if(schedule[w]) _ISO_ORDER.forEach(d => _fl.push({w, d})); });\n"
"      const _ti = _fl.findIndex(x => x.w === _pin.w && x.d === _pin.race);\n"
"      for(const _k of [1, 2]){\n"
"        const x = _ti - _k >= 0 ? _fl[_ti - _k] : null; if(!x) continue;\n"
"        const _h = _sl.find(r => r.w === x.w && r.d === x.d && (r.t === 'int' || r.t === 'chi') && r !== _q);\n"
"        if(!_h || !schedule[x.w][x.d]) continue;\n"
"        const _e = _ez[x.w];\n"
"        if(_e) schedule[x.w][x.d] = {..._e, dose: _e.dose ? {..._e.dose} : _e.dose}; else delete schedule[x.w][x.d];\n"
"      }\n"
"    }\n"
)
EDITS.append(('B2b+B4 trial and T-1/T-2', B24_OLD, B24_NEW))

# ── B3: the eve titles ────────────────────────────────────────────────────────────────
B3_OLD = (
"    const _rec = /^recovery run/i.test(day.cardio.subtype||'');\n"
"    day.title = k===0 ? 'Race Day' : "
)
B3_NEW = (
"    // D106a (V207): NSW's easy run is the long slow distance card, so it shakes out too. Run\n"
"    // cards only: a bike or swim LSD on an NRC multi-sport eve keeps its title. A test goal's\n"
"    // marker day is Test Day; NRC keeps Race Day.\n"
"    const _rec = /^recovery run/i.test(day.cardio.subtype||'') || (day.cardio.type === 'run' && /^long slow distance/i.test(day.cardio.subtype||''));\n"
"    day.title = k===0 ? (PACE_GOALS.has(day.cardio.goalId) ? 'Test Day' : 'Race Day') : "
)
EDITS.append(('B3 eve titles', B3_OLD, B3_NEW))

for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        print('ABORT: anchor for %s count=%d (need 1). Nothing written.' % (name, n)); sys.exit(1)
out = src
for name, old, new in EDITS:
    assert out.count(old) == 1, name
    out = out.replace(old, new, 1); print('applied', name)
for tok, want in [("' Test — TIME TRIAL'", 1), ("'Test Day' : 'Race Day'", 1), ('{test: true}', 1),
                  ("(cfg._racePin.slots = cfg._racePin.slots || [])", 1), ('function testWeekIndex(', 1),
                  ('name="ia-version" content="206"', 1)]:
    got = out.count(tok)
    if got != want:
        print('ABORT: post-condition %r count=%d want %d. Nothing written.' % (tok, got, want)); sys.exit(1)
open(PATH, 'w', encoding='utf-8').write(out)
print('OK: slice B written to', PATH, '(ia-version unchanged)')
