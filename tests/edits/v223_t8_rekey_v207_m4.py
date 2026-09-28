# V223 build 3, tests only: re-key sabotage mutation M4 in tests/sabotage/v207_d106a.json.
# Deferred by v223_t5_sabotage_rekey.py (DEFERRED-TO-(c)) because its only anchor site, doGenerate's
# resolveStartDate(...) call feeding the test pin, was still to be rewritten by D184 slice (c). That
# slice is landed: the V207 anchor `testWeekIndex(resolveStartDate(WD.startDate, WD.restDays || []).start,
# WD.raceDate)` counts 0 on the tree, and the pin is now
#   const _tp = progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || [], _rsRace(WD)).start);
# The claim M4 defends is unchanged: doGenerate's pin counts from the RESOLVED start, not the raw
# wizard field. The mutation feeds progTestPin the raw WD.startDate; _applyWizardStart still stores the
# resolved start, so only a start the resolver moves (G5: Sun 2026-09-27, Sunday rest, snaps to Mon
# 2026-09-28) can tell the two apart. Id and name kept; note prefixed "RE-KEYED V223 (D184 ...)".
# Literal bytes. The spec block and the new index.html anchor are both asserted count==1 before
# anything is written; abort on first miss.
import sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
P = ROOT + 'tests/sabotage/v207_d106a.json'
NEW_ANCHOR = 'progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || [], _rsRace(WD)).start)'
html = open(ROOT + 'index.html', encoding='utf-8').read()
n = html.count(NEW_ANCHOR)
if n != 1:
    sys.exit('ABORT: new M4 anchor counts %d on index.html, want 1' % n)
s = open(P, encoding='utf-8').read()
OLD = '''    "anchor": "testWeekIndex(resolveStartDate(WD.startDate, WD.restDays || []).start, WD.raceDate)",
    "replacement": "testWeekIndex(WD.startDate, WD.raceDate)",
    "gate": "gates/g207_test_week.js",
    "note": "NAMED TRIP: G5 goes red (stored _testWeek 5 and a 5-week program, want 4 from Mon 2026-09-28). Every Monday-start row agrees with the raw field and stays green, which is what isolates the resolved-start claim to G5. EXPECTED: G5 only."'''
NEW = '''    "anchor": "progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || [], _rsRace(WD)).start)",
    "replacement": "progTestPin(WD, WD.startDate)",
    "gate": "gates/g207_test_week.js",
    "note": "RE-KEYED V223 (D184 (a)/(c): doGenerate's pin is progTestPin(WD, resolveStartDate(..., _rsRace(WD)).start); the V207 testWeekIndex(resolveStartDate(...).start, ...) anchor is gone). The mutated pin counts from the raw wizard field while _applyWizardStart still stores the resolved start. NAMED TRIP: G5 goes red twice (stored _testWeek 5 and a 5-week program, want 4 from Mon 2026-09-28; the generate screen names 5 weeks, want 4). Every Monday-start row agrees with the raw field and stays green, which is what isolates the resolved-start claim to G5. EXPECTED: G5 only."'''
c = s.count(OLD)
if c != 1:
    sys.exit('ABORT: M4 spec block counts %d, want 1' % c)
s = s.replace(OLD, NEW)
import json
json.loads(s)
open(P, 'w', encoding='utf-8').write(s)
print('M4 re-keyed; anchor count on index.html = 1')
