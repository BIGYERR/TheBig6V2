# V223 build 3, tests only: re-key the sabotage mutations whose anchors this build deleted.
# Scan (every tests/sabotage/*.json, counted the way tests/sabotage.py counts: str.count on the
# candidate, count==1 applies) against base_v222 and the D182+D183+D184(a)(b) tree: the only
# mutations count 1 on V222 and not count 1 on the tree are v207_d106a.json M4, M5, M14, M15, M17.
# D184 (a)/(b) rewrote doGenerate's pin (progTestPin is the one owner, doGenerate calls it) and the
# boot backfill (`== null` guard, writes only when the test pins and is not past).
#   M5  -> the latch now sits on `WD._testWeek = (_tp && _tp.tw) || null;` (G2 G3 G4c G6 G7).
#   M14 -> the inverted guard is `!= null` (C3a C3c C3d C3h C3i).
#   M15 -> the guard is `if(true)` again, on the D184 guard (C3d).
#   M17 -> the past rule is the D184 `if(!(... _rd < _td))` wrapper (C3g).
# M4 is NOT re-keyed: its claim (the pin counts from the RESOLVED start) can only be anchored on
# doGenerate's resolveStartDate(...) call line, which D184 slice (c) may still rewrite. It stays
# NOT-APPLIED at V223 and is reported DEFERRED-TO-(c).
# Ids and names are kept; each note is prefixed "RE-KEYED V223 (D184 ...)". Literal bytes. Every
# anchor is asserted count==1 on the spec text, all before anything is written; abort on first miss.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v207_d106a.json'
s = open(P, encoding='utf-8').read()
R = [
 # M5
 ('''    "name": "M5 -> the test-week pin becomes a latch: it is written only when there is a test week, so a later undated build on the same wizard draft stores the old pin",
    "anchor": "  WD._testWeek = _testWeek;",
    "replacement": "  if(_testWeek) WD._testWeek = _testWeek;",
    "gate": "gates/g207_test_week.js",
    "note": "NAMED TRIP: G2 goes red (stored _testWeek 5 on an undated 11-week build), and G3, G4, G6, G7 go red the same way. G1 and G5 set the pin and stay green. EXPECTED: G2 G3 G4 G6 G7."''',
  '''    "name": "M5 -> the test-week pin becomes a latch: it is written only when there is a test week, so a later undated build on the same wizard draft stores the old pin",
    "anchor": "  WD._testWeek = (_tp && _tp.tw) || null;",
    "replacement": "  if(_tp && _tp.tw) WD._testWeek = _tp.tw;",
    "gate": "gates/g207_test_week.js",
    "note": "RE-KEYED V223 (D184 (a)/(b): doGenerate's pin is progTestPin's, written as WD._testWeek = (_tp && _tp.tw) || null; the V207 _testWeek local is gone). NAMED TRIP: G2 goes red (stored _testWeek 5 on an undated 11-week build), and G3 (stale 5), G4c (stale 26 from G4b), G6 and G7 (stale 4 from G5) go red the same way. G1, G4, G4b and G5 set the pin and stay green; at 223 G4 pins week 15, so the null-pin row past the goal is G4c, week 27. EXPECTED: G2 G3 G4c G6 G7."'''),
 # M14
 ('''    "name": "M14 (slice C, coach) -> the backfill predicate is inverted: it runs only on programs that already carry the key, so a stored pre-V207 test goal is never repaired and keeps its 11-week grid with no test week",
    "anchor": "  if(prog.cfg._testWeek === undefined){",
    "replacement": "  if(prog.cfg._testWeek !== undefined){",
    "gate": "gates/g207_test_calendar.js",
    "note": "NAMED TRIP: C3a (no key, 11 weeks), C3c (no trial on W5 Mon), C3d (key absent after the second refresh), C3g and C3h (no null key written). EXPECTED: C3a C3c C3d C3g C3h."''',
  '''    "name": "M14 (slice C, coach) -> the backfill predicate is inverted: it runs only on programs that already carry the key, so a stored pre-V207 test goal is never repaired and keeps its 11-week grid with no test week",
    "anchor": "  if(prog.cfg._testWeek == null){",
    "replacement": "  if(prog.cfg._testWeek != null){",
    "gate": "gates/g207_test_calendar.js",
    "note": "RE-KEYED V223 (D184 (a): the backfill guard is == null, absent or null re-derives until it pins; the === undefined anchor is gone). Inverted, it runs only on programs that already carry a pin. NAMED TRIP: C3a (no key, 11 weeks), C3c (no trial on W5 Mon), C3d (key absent after the second refresh), C3h (week 15 never pinned), C3i (the V209 null never re-pins). C3g and C3j stay green: at 223 a past or beyond-26 test writes nothing, which the inverted guard also does. EXPECTED: C3a C3c C3d C3h C3i."'''),
 # M15
 ('''    "name": "M15 (slice C, coach) -> the backfill runs on every refresh instead of once: the stored start moving a week later re-derives the test week from it",
    "anchor": "  if(prog.cfg._testWeek === undefined){",
    "replacement": "  if(true){",
    "gate": "gates/g207_test_calendar.js",
    "note": "NAMED TRIP: C3d goes red (the second refresh derives 4 from the moved start; the ruled once-only backfill keeps 5). C3a-C3c, C3e-C3h stay green: a first run is identical. EXPECTED: C3d only."''',
  '''    "name": "M15 (slice C, coach) -> the backfill runs on every refresh instead of once: the stored start moving a week later re-derives the test week from it",
    "anchor": "  if(prog.cfg._testWeek == null){",
    "replacement": "  if(true){",
    "gate": "gates/g207_test_calendar.js",
    "note": "RE-KEYED V223 (D184 (a): the backfill guard is == null, and it stops once the key is numeric; the === undefined anchor is gone). NAMED TRIP: C3d goes red (the second refresh derives 4 from the moved start; the ruled backfill stops at the pinned 5). C3a to C3c and C3e to C3j stay green: a first run is identical. EXPECTED: C3d only."'''),
 # M17
 ('''    "name": "M17 (slice C, builder) -> the backfill's past rule is removed: a stored program whose test already happened is compressed onto a test week that is behind the athlete",
    "anchor": "      const _tw = (_rd && _td && _rd < _td) ? null : _tp.tw;   // a past test pins nothing",
    "replacement": "      const _tw = _tp.tw;",
    "gate": "gates/g207_test_calendar.js",
    "note": "NAMED TRIP: C3g goes red (key 5 and 5 weeks, want null and 11). EXPECTED: C3g only."''',
  '''    "name": "M17 (slice C, builder) -> the backfill's past rule is removed: a stored program whose test already happened is compressed onto a test week that is behind the athlete",
    "anchor": "      if(!(_rd && _td && _rd < _td)){   // a past test pins nothing and writes nothing",
    "replacement": "      if(true){   // a past test pins nothing and writes nothing",
    "gate": "gates/g207_test_calendar.js",
    "note": "RE-KEYED V223 (D184 (a): the past rule wraps the write, a past test writes nothing; the _tw ternary is gone). NAMED TRIP: C3g goes red (key 5, cap 5 and 5 weeks written and persisted, want no key, cfg bytes unchanged, 11). C3a to C3f and C3h to C3j are not past and stay green. EXPECTED: C3g only."'''),
]
for a, b in R:
    c = s.count(a)
    if c != 1: sys.exit('ANCHOR count %d: %s' % (c, a[:120]))
for a, b in R:
    s = s.replace(a, b)
open(P, 'w', encoding='utf-8').write(s)
print('re-keyed M5 M14 M15 M17 in', P, '(M4 DEFERRED-TO-(c), not written)')
