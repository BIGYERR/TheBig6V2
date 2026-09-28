#!/usr/bin/env python3
# V223 build 3, slice (c1b) of D184 (P-TESTLEN): the D25 snap, the remaining resolver callers.
# Ruling: tests/measure/v223_rulings/p_testlen_d184_ruling.md, "## D184 (c')" Q4 and R6;
# SESSION DECISION: the two dashed toast arms are de-dashed in this edit; MARIO DECISION on (c'): SHIP in this build.
# Rides on (c1a) (tests/edits/v223_s14_d184c1a_resolver.py): _rsRace(c) and resolveStartDate(dateStr, restDays, raceIso).
#   E1 (D184-c-callers) updateStartResolve: the name step repaint passes _rsRace(WD).
#   E2 (D184-c-callers) _applyWizardStart(prog, wd): the generate path's start writer passes _rsRace(wd), so the
#      stored startDate is the entered day when that week holds the test (the pin in doGenerate already reads it).
#   E3 (D184-c-callers) name step first paint (_sr) passes _rsRace(WD).
#   E4 (D184-c-callers, D184-c-toast, D184-c-toast-dedash) setProgStart, one region: the resolver call passes
#      _rsRace(activeProg.cfg); the toast ternary gains the holdsTest first arm (Q4 string) and the two dashed arms
#      are de-dashed ('Nothing to train that week. Starts <day> ✓', 'Start date set. Short first week ✓').
#      'Start date set ✓' unchanged.
# NOT in this slice: the step 3 callout holdsTest branch, the version bump.
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

# ── E1 updateStartResolve ────────────────────────────────────────────────────────────────
rep('E1 updateStartResolve',
"""  const r = resolveStartDate(WD.startDate, WD.restDays||[]);
  const a = document.getElementById('startResolve'); if(a) a.innerHTML = startResolveCopy(r);
""",
"""  const r = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));   // D184 (c): given the test date
  const a = document.getElementById('startResolve'); if(a) a.innerHTML = startResolveCopy(r);
""")

# ── E2 _applyWizardStart ─────────────────────────────────────────────────────────────────
rep('E2 _applyWizardStart',
"""  const r = resolveStartDate(wd && wd.startDate, (wd && wd.restDays) || []);
  prog.startDate = r.start;
""",
"""  const r = resolveStartDate(wd && wd.startDate, (wd && wd.restDays) || [], _rsRace(wd));   // D184 (c): the start the pin was taken from
  prog.startDate = r.start;
""")

# ── E3 name step first paint ─────────────────────────────────────────────────────────────
rep('E3 name step _sr',
"""    const _sr = resolveStartDate(WD.startDate, WD.restDays||[]);            // V174 (D21/D24/D25)
""",
"""    const _sr = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));   // V174 (D21/D24/D25), D184 (c)
""")

# ── E4 setProgStart region (resolver call + toast) ───────────────────────────────────────
rep('E4 setProgStart region',
"""  // V174: same resolver as the wizard, so the D25 guard and the D21 statement hold here too.
  const _r=resolveStartDate(dateStr,(activeProg.cfg&&activeProg.cfg.restDays)||[]);
  activeProg.startDate=_r.start;
  // D106a (V207): a dated test goal re-pins its test week from the new start. Untrained
  // weeks re-pin; trained weeks stay frozen (refreshProgram), the same as setProgRace.
  const _tp=progTestPin(activeProg.cfg,_r.start);
  if(_tp){ activeProg.cfg._testWeek=_tp.tw; activeProg.cfg._raceDateCappedWeeks=_tp.tw||_tp.len; }
  const programs=getPrograms();const idx=programs.findIndex(p=>p.id===activeProgId);
  if(idx>=0){programs[idx]=activeProg;savePrograms(programs);}
  if(_tp) activeProg=refreshProgram(activeProg);   // untrained weeks re-pin; trained weeks stay frozen
  currentWeek=calcCurrentWeek();
  showToast(_r.snapped ? 'Nothing to train that week — starts '+_fmtStartDay(_r.start)+' ✓' : (_r.partial ? 'Start date set ✓ — short first week' : 'Start date set ✓'));
""",
"""  // V174: same resolver as the wizard, so the D25 guard and the D21 statement hold here too.
  // D184 (c): it is given the test date (_rsRace), so a re-date into a short week that holds
  // the test keeps the entered day and pins week 1; NRC and undated goals get null and snap as before.
  const _r=resolveStartDate(dateStr,(activeProg.cfg&&activeProg.cfg.restDays)||[],_rsRace(activeProg.cfg));
  activeProg.startDate=_r.start;
  // D106a (V207): a dated test goal re-pins its test week from the new start. Untrained
  // weeks re-pin; trained weeks stay frozen (refreshProgram), the same as setProgRace.
  const _tp=progTestPin(activeProg.cfg,_r.start);
  if(_tp){ activeProg.cfg._testWeek=_tp.tw; activeProg.cfg._raceDateCappedWeeks=_tp.tw||_tp.len; }
  const programs=getPrograms();const idx=programs.findIndex(p=>p.id===activeProgId);
  if(idx>=0){programs[idx]=activeProg;savePrograms(programs);}
  if(_tp) activeProg=refreshProgram(activeProg);   // untrained weeks re-pin; trained weeks stay frozen
  currentWeek=calcCurrentWeek();
  // D184 (c) Q4: the holdsTest arm is first (a holdsTest return is also partial). Both surfaces read
  // the same resolver return; the toast never went through startResolveCopy. No dashes in the arms.
  showToast(_r.holdsTest ? 'That week holds your test. Nothing left to train before it ✓'
    : (_r.snapped ? 'Nothing to train that week. Starts '+_fmtStartDay(_r.start)+' ✓'
    : (_r.partial ? 'Start date set. Short first week ✓' : 'Start date set ✓')));
""")

open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE', PATH)
