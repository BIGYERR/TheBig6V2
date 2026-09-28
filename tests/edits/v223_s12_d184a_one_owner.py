#!/usr/bin/env python3
# V223 build 3, slice (a) of D184 (P-TESTLEN): one owner of the dated test pin.
# Ruling: tests/measure/v223_rulings/p_testlen_d184_ruling.md, slice (a); scope from
# tests/measure/v223_rulings/p_safepace_ruling.md "P-TESTLEN — SCOPE RE-RULING" (a).
#   E1 progTestPin: predicate 1 <= week <= NSW_TABLE6_INT.length - 1 (rows 1 to 26), returns {tw, len, week}
#   E2 doGenerate: calls progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || []).start) instead
#      of carrying its own gate; writes WD._testWeek / WD._raceDateCappedWeeks from it
#   E3 boot backfill: guard == null, writes only when the re-derivation pins and the test is not past,
#      touches nothing otherwise; comment says what it does (no "one-time")
#   E4 not needed: setProgStart reads only _tp.tw and _tp.len, and the new return is a superset.
# NO version bump (stays 222). Anchors asserted count==1; the first miss aborts and nothing is written.
import sys, re

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, 'r', encoding='utf-8').read()
orig = src

def rep(label, old, new):
    global src
    n = src.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (label, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('%s: anchor count 1, replaced' % label)

# ── E1 progTestPin ────────────────────────────────────────────────────────────────────────
rep('E1 progTestPin',
"""// D106a (V207): a stored program's test week from a given start. The same rules as the
// writer in doGenerate: a run_pace_goal-family goal with a test date and eventTargeted; the
// week holding the test, null before the start or past the goal length (D138). Returns the
// week and the goal length (sized the way buildProgram sizes it), or null for any other program.
function progTestPin(cfg, startIso){
  const c = cfg || {}, g = c.cardioGoals && c.cardioGoals.run;
  if(!(c.cardioTypes||[]).includes('run') || !g || !PACE_GOALS.has(g.id) || c.eventTargeted === false || !c.raceDate) return null;
  const len = calcProgramLength(c.cardioTypes, {...c.cardioGoals, _experience:c.experience||'intermediate', _ageBracket:c.ageBracket||'18-35', _eventTargeted:c.eventTargeted},
    LIFTING_FOCUS_TO_GOAL[c.liftingFocus]||c.liftingFocus||'balanced').weeks;
  const tw = testWeekIndex(startIso, c.raceDate);
  return {tw: (tw >= 1 && tw <= len) ? tw : null, len};
}
""",
"""// D106a (V207), D184 (V223): the one owner of the dated test pin. A run_pace_goal-family goal
// with a test date and eventTargeted pins to the week holding its test whenever that week is a
// row of Table 6 (rows 1 to 26; index 0 is unused). A test before the start, or past week 26,
// pins nothing. doGenerate, setProgStart and the boot backfill read this predicate; none of them
// carries its own. Returns {tw, len, week}: tw the pinned week or null, len the goal length
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
""")

# ── E2 doGenerate ─────────────────────────────────────────────────────────────────────────
rep('E2 doGenerate pin',
"""  // D106a (V207): a test goal with a test date ends on the test week. The pin is written
  // here, once, from the RESOLVED start (the value _applyWizardStart stores below), so
  // buildProgram stays a pure function of cfg and never sees a date. A test before the
  // start, or beyond the goal length (D138), pins nothing and the program keeps its goal
  // length. Race goals align through raceAlignment; run_base has no test. Both pins are
  // written on every generate, so a pin from an earlier build cannot survive into this one.
  const _tg = (WD.cardioTypes||[]).includes('run') && WD.cardioGoals && WD.cardioGoals.run;
  let _testWeek = (_tg && PACE_GOALS.has(_tg.id) && WD.eventTargeted !== false && WD.raceDate)
    ? testWeekIndex(resolveStartDate(WD.startDate, WD.restDays || []).start, WD.raceDate) : null;
  if(!(_testWeek >= 1 && _testWeek <= totalWeeksPreview)) _testWeek = null;
  WD._testWeek = _testWeek;
  WD._raceDateCappedWeeks = _testWeek || totalWeeksPreview;
""",
"""  // D106a (V207), D184 (V223): a test goal with a test date ends on the test week. The pin is
  // progTestPin's, taken here once from the RESOLVED start (the value _applyWizardStart stores
  // below), so buildProgram stays a pure function of cfg and never sees a date. A test before
  // the start, or past week 26, pins nothing and the program keeps its goal length. Race goals
  // align through raceAlignment; run_base has no test. Both pins are written on every
  // generate, so a pin from an earlier build cannot survive into this one.
  const _tp = progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || []).start);
  WD._testWeek = (_tp && _tp.tw) || null;
  WD._raceDateCappedWeeks = WD._testWeek || totalWeeksPreview;
""")

# ── E3 boot backfill ──────────────────────────────────────────────────────────────────────
rep('E3 backfill',
"""  // D106a (V207): ONE-TIME BACKFILL. A dated test goal stored before V207 has no _testWeek.
  // Its test week is derived once from the program's own start and persisted, so the key
  // exists and this never runs again. A test that is past, before the start or beyond the
  // goal length writes the key null and the stored length stands. Untrained weeks re-pin;
  // the freeze below keeps every trained day byte-identical.
  if(prog.cfg._testWeek === undefined){
    const _tp = progTestPin(prog.cfg, prog.startDate);
    if(_tp){
      const _rd = _parseLocalDate(prog.cfg.raceDate), _td = _parseLocalDate(_isoToday());
      const _tw = (_rd && _td && _rd < _td) ? null : _tp.tw;   // a past test pins nothing
      prog.cfg._testWeek = _tw;
      prog.cfg._raceDateCappedWeeks = _tw || prog.cfg._raceDateCappedWeeks || _tp.len;
      try{ const _ps=getPrograms(); const _pi=_ps.findIndex(p=>p&&p.id===prog.id); if(_pi>=0){ _ps[_pi].cfg={..._ps[_pi].cfg,_testWeek:prog.cfg._testWeek,_raceDateCappedWeeks:prog.cfg._raceDateCappedWeeks}; savePrograms(_ps); } }catch(e){}
    }
  }
""",
"""  // D106a (V207), D184 (V223): BACKFILL. A stored program whose _testWeek is null or absent
  // re-derives its test week from its own start (progTestPin) each boot until it pins; it
  // writes nothing otherwise. It pins when the test is in weeks 1 to 26 and not past: the
  // week and the length are set and persisted, so the key is numeric and this stops running.
  // A test that is past, before the start or past week 26 leaves the key and the stored
  // length as they were. Untrained weeks re-pin; the freeze below keeps every trained day
  // byte-identical.
  if(prog.cfg._testWeek == null){
    const _tp = progTestPin(prog.cfg, prog.startDate);
    if(_tp && _tp.tw){
      const _rd = _parseLocalDate(prog.cfg.raceDate), _td = _parseLocalDate(_isoToday());
      if(!(_rd && _td && _rd < _td)){   // a past test pins nothing and writes nothing
        prog.cfg._testWeek = _tp.tw;
        prog.cfg._raceDateCappedWeeks = _tp.tw;
        try{ const _ps=getPrograms(); const _pi=_ps.findIndex(p=>p&&p.id===prog.id); if(_pi>=0){ _ps[_pi].cfg={..._ps[_pi].cfg,_testWeek:prog.cfg._testWeek,_raceDateCappedWeeks:prog.cfg._raceDateCappedWeeks}; savePrograms(_ps); } }catch(e){}
      }
    }
  }
""")

# ── post-conditions (before writing) ──────────────────────────────────────────────────────
def code_only(s):
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    return '\n'.join(re.sub(r'(^|[^:"\'\\])//.*$', r'\1', ln) for ln in s.split('\n'))
co = code_only(src)
n_pred = co.count('NSW_TABLE6_INT.length - 1')
print('post: code-only count of "NSW_TABLE6_INT.length - 1" = %d (want 1)' % n_pred)
if n_pred != 1:
    print('ABORT: predicate count %d; nothing written' % n_pred); sys.exit(1)
for tok in ['tw <= len', '_testWeek <= totalWeeksPreview', '_testWeek === undefined']:
    c = co.count(tok)
    print('post: code-only count of %r = %d (want 0)' % (tok, c))
    if c != 0:
        print('ABORT: stale gate token remains; nothing written'); sys.exit(1)
if 'ONE-TIME BACKFILL' in src:
    print('ABORT: one-time comment remains'); sys.exit(1)
if '<meta name="ia-version" content="222">' not in src:
    print('ABORT: version meta moved'); sys.exit(1)

open(PATH, 'w', encoding='utf-8').write(src)
print('written: %d -> %d bytes' % (len(orig.encode('utf-8')), len(src.encode('utf-8'))))
