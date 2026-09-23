#!/usr/bin/env python3
# V207 slice A of D106a (coach, Mario concurred; guard added by coach re-ruling after
# builder's premise stop: A3 as ruled printed -Infinity mi on every LSD card at tw 1-2).
#   E1 (A1) testWeekIndex(startIso, raceIso) beside raceAlignment.
#   E2 (A2) doGenerate writes the two persisted pins _testWeek and _raceDateCappedWeeks
#           from the RESOLVED start; the generate screen names the capped length.
#   E3 (A3) buildRunProgressionForLength's taper count reads taperWeeksFor.
#   E4 (guard) build10pct steps the taper down from startMiles when there are no build weeks.
# NO version bump in this slice (the final V207 slice bumps). Every anchor count==1 or abort.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

EDITS = []

# ── E1 (A1): the pure helper, sited beside raceAlignment ─────────────────────────────
E1_OLD = "// The race-week pin: race day is the entered date's weekday; every train day AFTER it in\n"
E1_NEW = (
"// D106a (V207): the program week that holds a test date. Same Monday arithmetic as\n"
"// _progDayDate / getWeekMonday: week N runs from Mon(start) + 7(N-1) days to the Sunday\n"
"// after. Pure: dates in, a week number out, no DOM, no WD. Local dates only (no UTC parse),\n"
"// and the day count is rounded so a DST change inside the span cannot move the week.\n"
"// Null when a date is unreadable or the test falls before the start.\n"
"function testWeekIndex(startIso, raceIso){\n"
"  const s = _parseLocalDate(startIso), t = _parseLocalDate(raceIso);\n"
"  if(!s || !t || t < s) return null;\n"
"  const days = Math.round((getWeekMonday(_isoOf(t)) - getWeekMonday(_isoOf(s))) / 86400000);\n"
"  return Math.floor(days / 7) + 1;   // week 1 is the week holding the start\n"
"}\n"
) + E1_OLD
EDITS.append(('E1 testWeekIndex helper', E1_OLD, E1_NEW))

# ── E2 (A2): the writer in doGenerate, one hunk ──────────────────────────────────────
E2_OLD = (
"  // Program length is goal-driven only. A race date never compresses it — the user\n"
"  // is warned at the race-date step if their date is too soon, but the full program\n"
"  // is always built. The race simply lands on whatever week it falls on.\n"
"  WD._raceDateCappedWeeks = totalWeeksPreview;\n"
"  document.getElementById('generateSub').textContent='Building your '+totalWeeksPreview+'-week program...';\n"
)
E2_NEW = (
"  // D106a (V207): a test goal with a test date ends on the test week. The pin is written\n"
"  // here, once, from the RESOLVED start (the value _applyWizardStart stores below), so\n"
"  // buildProgram stays a pure function of cfg and never sees a date. A test before the\n"
"  // start, or beyond the goal length (D138), pins nothing and the program keeps its goal\n"
"  // length. Race goals align through raceAlignment; run_base has no test. Both pins are\n"
"  // written on every generate, so a pin from an earlier build cannot survive into this one.\n"
"  const _tg = (WD.cardioTypes||[]).includes('run') && WD.cardioGoals && WD.cardioGoals.run;\n"
"  let _testWeek = (_tg && PACE_GOALS.has(_tg.id) && WD.eventTargeted !== false && WD.raceDate)\n"
"    ? testWeekIndex(resolveStartDate(WD.startDate, WD.restDays || []).start, WD.raceDate) : null;\n"
"  if(!(_testWeek >= 1 && _testWeek <= totalWeeksPreview)) _testWeek = null;\n"
"  WD._testWeek = _testWeek;\n"
"  WD._raceDateCappedWeeks = _testWeek || totalWeeksPreview;\n"
"  totalWeeksPreview = WD._raceDateCappedWeeks;   // the screen names the length that builds\n"
"  document.getElementById('generateSub').textContent='Building your '+totalWeeksPreview+'-week program...';\n"
)
EDITS.append(('E2 doGenerate test-week pin', E2_OLD, E2_NEW))

# ── E3 (A3): the second taper formula reads the published window ─────────────────────
E3_OLD = "  const taperWeeks = (goalId !== 'run_base' && eventTargeted) ? Math.min(Math.max(2, Math.round(totalWeeks * 0.12)), totalWeeks - 4) : 0;\n"
E3_NEW = (
"  // D106a (V207): the array reads the published window, the one buildRunSession labels\n"
"  // from, so a block under six weeks never prints Taper on an undipped long run. The old\n"
"  // tw-4 clamp never bound at six weeks or more, so no longer program moves.\n"
"  const taperWeeks = taperWeeksFor(goalId !== 'run_base' && eventTargeted, false, totalWeeks);\n"
)
EDITS.append(('E3 taper count reads taperWeeksFor', E3_OLD, E3_NEW))

# ── E4 (guard): no build weeks means the taper steps down from startMiles ────────────
E4_OLD = "    const peak = Math.max(...weeks);\n"
E4_NEW = (
"    // D106a (V207): at one or two weeks the block IS the test week and tapers by race-week\n"
"    // doctrine, so there are no build weeks. The taper then steps down from startMiles (the\n"
"    // athlete's baseline or the experience default this array climbs from), never from\n"
"    // Math.max() of nothing, which is -Infinity.\n"
"    const peak = weeks.length ? Math.max(...weeks) : startMiles;\n"
)
EDITS.append(('E4 empty-peak guard', E4_OLD, E4_NEW))

# Assert every anchor before writing anything.
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        print('ABORT: anchor for %s count=%d (need 1). Nothing written.' % (name, n))
        sys.exit(1)
out = src
for name, old, new in EDITS:
    assert out.count(old) == 1, name
    out = out.replace(old, new, 1)
    print('applied', name)
# Post-conditions: the old claim and the clamp are gone, the helper and guard landed once.
for tok, want in [('A race date never compresses it', 0), ('totalWeeks - 4) : 0;', 0),
                  ('function testWeekIndex(', 1), ('weeks.length ? Math.max(...weeks) : startMiles', 1),
                  ('WD._testWeek = _testWeek;', 1), ('name="ia-version" content="206"', 1)]:
    got = out.count(tok)
    if got != want:
        print('ABORT: post-condition %r count=%d want %d. Nothing written.' % (tok, got, want))
        sys.exit(1)
open(PATH, 'w', encoding='utf-8').write(out)
print('OK: 4 edits written, ia-version unchanged (206)')
