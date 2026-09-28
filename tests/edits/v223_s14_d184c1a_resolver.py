#!/usr/bin/env python3
# V223 build 3, slice (c1a) of D184 (P-TESTLEN): the D25 snap, resolver half.
# Ruling: tests/measure/v223_rulings/p_testlen_d184_ruling.md, Q2 (prior (c)) and "## D184 (c')" which supersedes
# the prior (c) copy; MARIO DECISION on (c'): SHIP in this build. Proven shape: measure surgery Sc2,
# tests/measure/v223_testlen_m9b.js (this script lands the RULED strings, not the surgery's).
#   E1 (D184-c-resolver) resolveStartDate(dateStr, restDays, raceIso): a partial week with no training day left
#      holds the test when the test date _rt falls from the entered day d through that week's Sunday; it keeps
#      the entered start (no snap: partial true, snapped false) and returns holdsTest:true. The key is present
#      only then, so the 2 argument return and every non holdsTest return are byte equal to today's.
#      _rsRace(cfg) beside it: the test date of a dated test goal (PACE_GOALS), else null, so NRC never moves.
#   E2 (D184-c-namestep-copy) startResolveCopy: first branch if(r.holdsTest) with the (c') Q2 string, before
#      r.snapped; the :1932-1933 comment rewritten (the toast never called this; both read the same return).
#   E3 (D184-c-pin-carry) wizardTestPin: one resolver call with _rsRace(WD); holdsTest copied onto
#      progTestPin's return (only when true; progTestPin's predicate is not touched).
#   E4 (D184-c-generate) doGenerate: the pin's resolver call passes _rsRace(WD).
# NOT in this slice (next slices): updateStartResolve :2011, _applyWizardStart :2030, the name step :2985,
# setProgStart :14620 and its toast, the callout holdsTest branch.
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

# ── E1 (D184-c-resolver) ─────────────────────────────────────────────────────────────────
rep('E1a resolver header comment',
"""//     moves to the next Monday and the copy says so. The one case "start now" is empty.
""",
"""//     moves to the next Monday and the copy says so. The one case "start now" is empty.
//   • holdsTest=true (D184 c) when that short week holds the test of a dated test goal: the
//     test date (from _rsRace) falls from the entered day through that Sunday. That week is
//     not empty, so it does not snap: the start stays the entered day and week 1 is the test week.
""")

rep('E1b _rsRace + resolver signature',
"""function resolveStartDate(dateStr, restDays){
""",
"""// D184 (c): the test date the resolver is given, or null. Only a dated test goal has one (the
// run_pace_goal family, PACE_GOALS); race goals, run_base, undated goals and non run programs get
// null, so the D25 snap is unchanged for them.
function _rsRace(c){
  const g = c && c.cardioGoals && c.cardioGoals.run;
  return (c && (c.cardioTypes||[]).includes('run') && g && PACE_GOALS.has(g.id) && c.eventTargeted !== false && c.raceDate) ? c.raceDate : null;
}
function resolveStartDate(dateStr, restDays, raceIso){
""")

rep('E1c resolver holdsTest predicate',
"""  const week1Train = _ISO_ORDER.slice(offset).filter(k => !rest.has(k));
  if(partial && week1Train.length === 0){
""",
"""  const week1Train = _ISO_ORDER.slice(offset).filter(k => !rest.has(k));
  // D184 (c): a short week with no training day left holds the test when the test date _rt
  // falls from the entered day d through that week's Sunday. It keeps the entered start (no
  // snap) and is week 1, the test week. Without raceIso nothing here changes.
  const _rt = raceIso ? _parseLocalDate(raceIso) : null;
  const _sun = new Date(mon); _sun.setDate(mon.getDate()+6); _sun.setHours(0,0,0,0);
  const holdsTest = !!(partial && week1Train.length === 0 && _rt && _rt >= d && _rt <= _sun);
  if(partial && week1Train.length === 0 && !holdsTest){
""")

rep('E1d resolver return',
"""  return {start:_isoOf(d), entered:_isoOf(d), mon:_isoOf(mon), partial, snapped:false,
          week1Train, nextMon:_isoOf(nm)};
}
""",
"""  const r = {start:_isoOf(d), entered:_isoOf(d), mon:_isoOf(mon), partial, snapped:false,
          week1Train, nextMon:_isoOf(nm)};
  return holdsTest ? {...r, holdsTest:true} : r;   // the key exists only when true: every other return is unchanged
}
""")

# ── E2 (D184-c-namestep-copy) ────────────────────────────────────────────────────────────
rep('E2 startResolveCopy comment + holdsTest branch',
"""// The one sentence under the picker (D21/D25). Same function feeds the wizard and the
// setProgStart toast so the two surfaces cannot disagree.
function startResolveCopy(r){
  const sunOf = iso => { const m=_parseLocalDate(iso); const s=new Date(m); s.setDate(m.getDate()+6); return _isoOf(s); };
  if(r.snapped){
""",
"""// The one sentence under the picker (D21/D25, D184 c). The setProgStart toast never called
// this function; the two surfaces agree because both read the same resolveStartDate return.
function startResolveCopy(r){
  const sunOf = iso => { const m=_parseLocalDate(iso); const s=new Date(m); s.setDate(m.getDate()+6); return _isoOf(s); };
  if(r.holdsTest){
    return 'That week holds your test, so this starts <b>'+_fmtStartDay(r.start)+'</b>. Nothing is left to train before it. Week 1 is the test week.';
  }
  if(r.snapped){
""")

# ── E3 (D184-c-pin-carry) ────────────────────────────────────────────────────────────────
rep('E3 wizardTestPin',
"""// D183 (P-SAFEPACE R3), D184 (P-TESTLEN b1): the wizard's dated test pin. It is progTestPin's answer
// from the resolved start, the same call doGenerate makes, so the header, the card, the fold and the
// name step print the length that builds: tw when the test pins, else len. Returns progTestPin's
// {tw, len, week, cap}, or null when the goal is not a dated test goal.
function wizardTestPin(){
  if(!WD) return null;
  return progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays||[]).start);
}
""",
"""// D183 (P-SAFEPACE R3), D184 (P-TESTLEN b1, c): the wizard's dated test pin. It is progTestPin's answer
// from the resolved start, the same calls doGenerate makes, so the header, the card, the fold and the
// name step print the length that builds: tw when the test pins, else len. The resolver is called once,
// with the test date (_rsRace), and its holdsTest is copied onto the pin, so the callout reads the
// resolver's own answer and carries no second predicate. Returns progTestPin's {tw, len, week, cap},
// with holdsTest:true added when the entered week holds the test, or null when the goal is not a dated
// test goal.
function wizardTestPin(){
  if(!WD) return null;
  const r = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));
  const p = progTestPin(WD, r.start);
  return (p && r.holdsTest) ? {...p, holdsTest:true} : p;
}
""")

# ── E4 (D184-c-generate) ─────────────────────────────────────────────────────────────────
rep('E4 doGenerate pin resolver call',
"""  // below), so buildProgram stays a pure function of cfg and never sees a date. A test before
  // the start, or past week 26, pins nothing and the program keeps its goal length. Race goals
  // align through raceAlignment; run_base has no test. Both pins are written on every
  // generate, so a pin from an earlier build cannot survive into this one.
  const _tp = progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || []).start);
""",
"""  // below), so buildProgram stays a pure function of cfg and never sees a date. The resolver is
  // given the test date (_rsRace, D184 c), so a short week that holds the test keeps the entered
  // day and pins week 1. A test before the start, or past week 26, pins nothing and the program
  // keeps its goal length. Race goals align through raceAlignment; run_base has no test. Both
  // pins are written on every generate, so a pin from an earlier build cannot survive into this one.
  const _tp = progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || [], _rsRace(WD)).start);
""")

open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE', PATH, '(no version bump; ia-version stays 222)')
