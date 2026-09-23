#!/usr/bin/env python3
# V207 slice C of D106a: calendar controls and copy (coach; wizard sentence A4 moved here).
#   C1 progTestPin(cfg, startIso) helper + setProgStart re-pins a dated test goal and refreshes
#      (mirrors setProgRace: untrained weeks re-pin, trained weeks stay frozen).
#   C2 the red card under a week: a test goal gets coach's sentence; every other goal keeps its own.
#   C3 one-time backfill in refreshProgram beside the seed backfill: a stored dated test goal with
#      no _testWeek key gets one from its stored start (null when past or beyond goal length),
#      persisted, so the key exists and it never runs again.
#   A4 the wizard sentence: a test goal whose date is inside its goal length ends on the test.
# NO version bump. Every anchor count==1 or abort. Usage: v207_sliceC_d106a_edit.py [path]
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()
EDITS = []

# ── C1: helper + setProgStart ─────────────────────────────────────────────────────────
C1_OLD = r'''function setProgStart(dateStr){
  if(!dateStr||!activeProg) return;
  // V174: same resolver as the wizard, so the D25 guard and the D21 statement hold here too.
  const _r=resolveStartDate(dateStr,(activeProg.cfg&&activeProg.cfg.restDays)||[]);
  activeProg.startDate=_r.start;
  const programs=getPrograms();const idx=programs.findIndex(p=>p.id===activeProgId);
  if(idx>=0){programs[idx]=activeProg;savePrograms(programs);}
  currentWeek=calcCurrentWeek();
'''
C1_NEW = r'''// D106a (V207): a stored program's test week from a given start. The same rules as the
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
function setProgStart(dateStr){
  if(!dateStr||!activeProg) return;
  // V174: same resolver as the wizard, so the D25 guard and the D21 statement hold here too.
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
'''
EDITS.append(('C1 progTestPin + setProgStart', C1_OLD, C1_NEW))

# ── C2: the red card under a week ─────────────────────────────────────────────────────
C2_OLD = r'''    feedback.innerHTML = '<div style="color:var(--red);font-size:12px;margin-top:6px">'+asyIcon('⚠',13)+' Less than a week away — not enough time to train.</div>';
'''
C2_NEW = r'''    // D106a (V207): a test goal under a week out still builds: the test week alone. The card
    // stays red and says what the athlete gets. Every other goal keeps its own sentence.
    const _tg1 = (WD.cardioTypes||[]).includes('run') && WD.cardioGoals && WD.cardioGoals.run && PACE_GOALS.has(WD.cardioGoals.run.id);
    feedback.innerHTML = '<div style="color:var(--red);font-size:12px;margin-top:6px">'+asyIcon('⚠',13)+(_tg1 ? ' Your test is less than a week away. You get the test week only. Primer lifts, a shakeout, then the test.' : ' Less than a week away — not enough time to train.')+'</div>';
'''
EDITS.append(('C2 red card', C2_OLD, C2_NEW))

# ── C3: one-time backfill beside the seed backfill ────────────────────────────────────
C3_OLD = r'''    try{ const _ps=getPrograms(); const _pi=_ps.findIndex(p=>p&&p.id===prog.id); if(_pi>=0){ _ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed}; savePrograms(_ps); } }catch(e){}
  }
  let _swapCut=null;
'''
C3_NEW = r'''    try{ const _ps=getPrograms(); const _pi=_ps.findIndex(p=>p&&p.id===prog.id); if(_pi>=0){ _ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed}; savePrograms(_ps); } }catch(e){}
  }
  // D106a (V207): ONE-TIME BACKFILL. A dated test goal stored before V207 has no _testWeek.
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
  let _swapCut=null;
'''
EDITS.append(('C3 one-time backfill', C3_OLD, C3_NEW))

# ── A4: the wizard sentence ───────────────────────────────────────────────────────────
A4_OLD = r'''  const color = diff >= -2 ? 'var(--accent)' : 'var(--red)';
  let html =
    '<div style="font-weight:600">'+weeksUntil+' weeks isn\'t enough time to hit this pace safely. Recommended: at least '+recommended+' weeks.</div>'+
    '<div style="margin-top:5px;opacity:0.9">Your full '+recommended+'-week program stays intact — your race simply lands in week '+weeksUntil+'.</div>';
'''
A4_NEW = r'''  const color = diff >= -2 ? 'var(--accent)' : 'var(--red)';
  // D106a (V207): a test goal whose date falls inside its goal length ends on the test, so
  // "stays intact" would be false for it. Same week and null rules as the writer in
  // doGenerate. NRC never reaches here (aligned above); every other goal keeps its sentence.
  const _twz = ((WD.cardioTypes||[]).includes('run') && WD.cardioGoals.run && PACE_GOALS.has(WD.cardioGoals.run.id))
    ? testWeekIndex(resolveStartDate(WD.startDate, WD.restDays||[]).start, WD.raceDate) : null;
  const _tw = (_twz >= 1 && _twz <= recommended) ? _twz : null;
  let html =
    '<div style="font-weight:600">'+weeksUntil+' weeks isn\'t enough time to hit this pace safely. Recommended: at least '+recommended+' weeks.</div>'+
    '<div style="margin-top:5px;opacity:0.9">'+(_tw ? 'Your program ends on your test. ' + _tw + (_tw === 1 ? ' week.' : ' weeks.') + ' The taper lands in front of it.' : 'Your full '+recommended+'-week program stays intact — your race simply lands in week '+weeksUntil+'.')+'</div>';
'''
EDITS.append(('A4 wizard sentence', A4_OLD, A4_NEW))

for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        print('ABORT: anchor for %s count=%d (need 1). Nothing written.' % (name, n)); sys.exit(1)
out = src
for name, old, new in EDITS:
    assert out.count(old) == 1, name
    out = out.replace(old, new, 1); print('applied', name)
for tok, want in [('function progTestPin(', 1), ('progTestPin(', 3),
                  ('Your test is less than a week away. You get the test week only. Primer lifts, a shakeout, then the test.', 1),
                  ("'Your program ends on your test. '", 1), ('if(prog.cfg._testWeek === undefined){', 1),
                  ("' Test — TIME TRIAL'", 1), ('name="ia-version" content="206"', 1)]:
    got = out.count(tok)
    if got != want:
        print('ABORT: post-condition %r count=%d want %d. Nothing written.' % (tok, got, want)); sys.exit(1)
open(PATH, 'w', encoding='utf-8').write(out)
print('OK: slice C written to', PATH, '(ia-version unchanged)')
