# V223 (D183, D184): re-key sabotage v207_d106a.json M18 and M19. D183 S4 deleted both anchors (the wizard's
# _tw = (_twz >= 1 && _twz <= recommended) and the red card's _tg1 branch); D184 (b1) made progTestPin the one
# owner of the dated pin, which wizardTestPin now returns. Each keeps its id and defends the same claim at 223:
#   M18: the wizard's test pin is gone, so a test inside the length is not told its test week (C4a C4b).
#   M19: the card loses its tw 1 branch, so a test in the start week is not told "this week" (C4b; C4d when tw 1).
# Literal bytes. Every anchor is asserted count==1 in the JSON text; abort on the first miss.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v207_d106a.json'
s = open(P, encoding='utf-8').read()
R = [
 ('''    "name": "M18 (slice C, builder) -> the wizard sentence is reverted: a test goal inside its goal length is still told its full program stays intact, which slice A made false",
    "anchor": "  const _tw = (_twz >= 1 && _twz <= recommended) ? _twz : null;",
    "replacement": "  const _tw = null;",
    "gate": "gates/g207_test_calendar.js",
    "note": "NAMED TRIP: C4a and C4b go red, and C4f goes red because the A4 sentence no longer renders. C4c stays green. EXPECTED: C4a C4b C4f."''',
  '''    "name": "M18 (slice C, builder) -> the wizard's test pin is dropped: a test goal inside its goal length is not told the week its program ends on",
    "anchor": "  return {tw: (week >= 1 && week <= cap) ? week : null, len, week, cap};",
    "replacement": "  return {tw: null, len, week, cap};",
    "gate": "gates/g207_test_calendar.js",
    "note": "RE-KEYED V223: D183 S4 deleted the wizard's own _tw expression and D184 (b1) made progTestPin the one owner of the dated pin (wizardTestPin returns it), so the pin's tw is where the wizard's week now comes from. At 223 a null tw sends the card to the D184 beyond 26 row. NAMED TRIP: C4a (week 5 sentence gone), C4b (tw 1 sentence gone), C4d (week 1 or 2 sentence gone), C4f (the typed sentences no longer render). C4c (week null) and C4e (NRC) stay green. C1a, C3a, C3c, C3d, C3h and C3i ride: progTestPin is the one owner, so doGenerate and setProgStart store no pin either. EXPECTED: C4a C4b C4d C4f."'''),
 ('''    "name": "M19 (slice C, builder) -> the red card loses its test-goal branch: a test goal under a week out is told there is not enough time to train, while the program still builds the test week",
    "anchor": "+(_tg1 ? ' Your test is less than a week away.",
    "replacement": "+(false ? ' Your test is less than a week away.",
    "gate": "gates/g207_test_calendar.js",
    "note": "NAMED TRIP: C4d goes red, and C4f goes red because the red-card sentence no longer renders. C4e stays green. EXPECTED: C4d C4f."''',
  '''    "name": "M19 (slice C, builder) -> the card loses its test-week-one branch: a test goal in the start week is not told it gets the test week only, while the program still builds the test week",
    "anchor": "    else if(p.tw === 1) feedback.innerHTML = card(",
    "replacement": "    else if(false) feedback.innerHTML = card(",
    "gate": "gates/g207_test_calendar.js",
    "note": "RE-KEYED V223: D183 S4 deleted the red card's _tg1 branch; at 223 a test under a week out is never red and its tw 1 row is R3's this-week sentence (C4b, C4d). NAMED TRIP: C4b (the tw 1 sentence gone) and C4f (it no longer renders). C4d rides when the run date gives tw 1 by hand (today + 3 in the start week, D25 snap included) and stays green when it gives tw 2. C4e stays green. EXPECTED: C4b C4f (C4d on tw 1 days)."'''),
]
for a, b in R:
    c = s.count(a)
    if c != 1: sys.exit('ANCHOR count %d: %s' % (c, a[:80]))
for a, b in R:
    s = s.replace(a, b)
open(P, 'w', encoding='utf-8').write(s)
print('re-keyed M18 M19 in', P)
