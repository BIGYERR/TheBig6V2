#!/usr/bin/env python3
# V223 build 3, slices (b1)+(b2) of D184 (P-TESTLEN): one length number on the wizard.
# Ruling: tests/measure/v223_rulings/p_testlen_d184_ruling.md, (b1)/(b2) and Q3; scope from
# tests/measure/v223_rulings/p_safepace_ruling.md "P-TESTLEN — SCOPE RE-RULING" (wizardTestPin returns
# progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays||[]).start)).
#   E1 (b1) wizardTestPin: body is the progTestPin call from the resolved start; comment says what is true now.
#      The header (progLenLineHTML), the name step, the card and the fold already read it (D183), and
#      doGenerate's totalWeeksPreview reads progTestPin since slice (a), so all four print tw || len.
#   E2 (b2) progTestPin: the Table 6 cap is named once (cap = NSW_TABLE6_INT.length - 1) and returned beside
#      {tw, len, week}, whose meanings do not change; the predicate is the same rule (1 <= week <= 26) and the
#      expression NSW_TABLE6_INT.length - 1 still occurs exactly once in code.
#   E3 (b2) the week > 26 card row: D184 Q3's sentence, numbers p.week, p.cap, p.len (singular "1 week").
# NO version bump (stays 222). Anchors asserted count==1; the first miss aborts and nothing is written.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, 'r', encoding='utf-8').read()

def rep(label, old, new):
    global src
    n = src.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (label, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('%s: anchor count 1, replaced' % label)

# ── E1 (b1) wizardTestPin ─────────────────────────────────────────────────────────────────
rep('E1 wizardTestPin',
"""// D183 (P-SAFEPACE R3), sited with D184 (b1)'s name and shape: the wizard's dated test pin. Every
// week number on the cardio goal step reads it. The predicate and the calcProgramLength arguments
// are doGenerate's; the gate (1 <= week <= len) is today's, so the header still equals the built
// length until D184 swaps this body for progTestPin. Returns {tw, len, week}, or null when the goal
// is not a dated test goal; week is the raw test week (null when the test falls before the start).
function wizardTestPin(){
  const g = WD && (WD.cardioTypes||[]).includes('run') && WD.cardioGoals && WD.cardioGoals.run;
  if(!g || !PACE_GOALS.has(g.id) || WD.eventTargeted === false || !WD.raceDate) return null;
  const len = calcProgramLength(WD.cardioTypes, {...WD.cardioGoals, _experience:WD.experience||'intermediate', _ageBracket:WD.ageBracket||'18-35', _eventTargeted:WD.eventTargeted}, LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced').weeks;
  const week = testWeekIndex(resolveStartDate(WD.startDate, WD.restDays||[]).start, WD.raceDate);
  return {tw: (week >= 1 && week <= len) ? week : null, len, week};
}
""",
"""// D183 (P-SAFEPACE R3), D184 (P-TESTLEN b1): the wizard's dated test pin. It is progTestPin's answer
// from the resolved start, the same call doGenerate makes, so the header, the card, the fold and the
// name step print the length that builds: tw when the test pins, else len. Returns progTestPin's
// {tw, len, week, cap}, or null when the goal is not a dated test goal.
function wizardTestPin(){
  if(!WD) return null;
  return progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays||[]).start);
}
""")

# ── E2 (b2) progTestPin names the Table 6 cap once and returns it ──────────────────────────
rep('E2 progTestPin cap',
"""// carries its own. Returns {tw, len, week}: tw the pinned week or null, len the goal length
// (sized the way buildProgram sizes it), week the raw test week (null before the start); null
// for any other program.
function progTestPin(cfg, startIso){
  const c = cfg || {}, g = c.cardioGoals && c.cardioGoals.run;
  if(!(c.cardioTypes||[]).includes('run') || !g || !PACE_GOALS.has(g.id) || c.eventTargeted === false || !c.raceDate) return null;
  const len = calcProgramLength(c.cardioTypes, {...c.cardioGoals, _experience:c.experience||'intermediate', _ageBracket:c.ageBracket||'18-35', _eventTargeted:c.eventTargeted},
    LIFTING_FOCUS_TO_GOAL[c.liftingFocus]||c.liftingFocus||'balanced').weeks;
  const week = testWeekIndex(startIso, c.raceDate);
  return {tw: (week >= 1 && week <= NSW_TABLE6_INT.length - 1) ? week : null, len, week};
}
""",
"""// carries its own. Returns {tw, len, week, cap}: tw the pinned week or null, len the goal length
// (sized the way buildProgram sizes it), week the raw test week (null before the start), cap the
// last row of Table 6 (26), the one place that number is taken, which the wizard's beyond 26 card
// prints; null for any other program.
function progTestPin(cfg, startIso){
  const c = cfg || {}, g = c.cardioGoals && c.cardioGoals.run;
  if(!(c.cardioTypes||[]).includes('run') || !g || !PACE_GOALS.has(g.id) || c.eventTargeted === false || !c.raceDate) return null;
  const len = calcProgramLength(c.cardioTypes, {...c.cardioGoals, _experience:c.experience||'intermediate', _ageBracket:c.ageBracket||'18-35', _eventTargeted:c.eventTargeted},
    LIFTING_FOCUS_TO_GOAL[c.liftingFocus]||c.liftingFocus||'balanced').weeks;
  const week = testWeekIndex(startIso, c.raceDate), cap = NSW_TABLE6_INT.length - 1;
  return {tw: (week >= 1 && week <= cap) ? week : null, len, week, cap};
}
""")

# ── E3 (b2) the week > 26 card row: D184 Q3's sentence ─────────────────────────────────────
rep('E3 beyond 26 card',
"""    else feedback.innerHTML = card('var(--accent)', 'Your test is in week '+p.week+'. This program is '+p.len+' weeks and ends before it.');
""",
"""    // D184 (P-TESTLEN Q3): the test is past Table 6's last row, so nothing pins and the goal length
    // builds. Numbers: the raw test week, the Table 6 cap, the goal length.
    else feedback.innerHTML = card('var(--accent)', 'Your test is in week '+p.week+'. The test block is '+p.cap+' weeks. This program builds '+p.len+(p.len === 1 ? ' week' : ' weeks')+' now. Start a test block when the test is '+p.cap+' weeks out.');
""")

open(PATH, 'w', encoding='utf-8').write(src)
print('written: 3 edits, no version bump')
