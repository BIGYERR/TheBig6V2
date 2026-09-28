#!/usr/bin/env python3
# V223 slice S6 (D183 slice S3) of D183 (P-SAFEPACE), per tests/measure/v223_rulings/p_safepace_ruling.md
# R2 (as re-ruled): the one repaint is `updateRaceDateFeedback`; `updatePaceFeasibility`/`updatePaceDisplay`
# are its internals; the goal, mile, date and toggle handlers call it.
# R5 mile label row: '(optional — personalizes your training paces)' -> 'Optional. It sets your training paces.'
# D183 AMENDMENT 2, Not-for-this-build item (1): the run baseline inputs come IN, each handler appends
# `updateRaceDateFeedback()` (calcProgramLength reads baselineDist, so the header moves on a distance edit).
# Session decision on plan flag F2: the shared generic baseline line (run, bike and swim goals) calls the
# fold for run only (`t==='run'`); bike and swim baselineDist staleness goes to section 12.
#   E1  Pace-goal block A region (unique start: the "e.g. 1.5" baseline input, through block A's mile-secs input):
#       D183-handler-repoint(baseline) baseline oninput gains ;updateRaceDateFeedback()
#       D183-copy(R5 mile label)       label -> Optional. It sets your training paces.
#       D183-handler-repoint(mile)     x2 updatePaceFeasibility();updateMileAdvisory() -> updateRaceDateFeedback();updateMileAdvisory()
#   E2  Generic block region (unique start: the shared ${t} baseline input, through the generic mile-secs input):
#       D183-handler-repoint(baseline) baseline oninput gains ${t==='run'?';updateRaceDateFeedback()':''}
#       plus the same label and mile-pair changes as E1.
#   E3  D183-handler-repoint(mile)  applySeedData tail: guarded updatePaceFeasibility() -> updateRaceDateFeedback()
#   E4  D183-internal-decouple      updatePaceFeasibility(f) uses the ceiling the fold passes; its own
#       assessRunPaceCeiling() call goes; the event+dated hide rule stays (amendment (c)); comment
#       "offer" -> "sentence".
# The two mile-block tails are byte-identical in the tree, so both region anchors are built from one literal
# MILE_TAIL; each region is asserted count==1 in the file, each in-region change is asserted at its exact count.
# No ia-version bump (stays 222). The first miss aborts and nothing is written.
# Usage: v223_s6_d183_mile_handlers.py [target.html]
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

if '<meta name="ia-version" content="222">' not in src:
    print('ABORT: ia-version is not 222; nothing written'); sys.exit(1)
# S1 and S2 must be on the tree: the fold passes the ceiling to updatePaceFeasibility, and the goal
# handlers already route through the fold.
for tok in ('function updateRaceDateFeedback() {',
            '  updatePaceDisplay();\n  updatePaceFeasibility(_f);\n  const feedback = document.getElementById(\'raceDateFeedback\');',
            "oninput=\"WD.cardioGoals['run'].targetDist=this.value;updateRaceDateFeedback()\""):
    if src.count(tok) != 1:
        print('ABORT: precondition %r not found exactly once; nothing written' % tok); sys.exit(1)

LABEL_OLD = '(optional — personalizes your training paces)'
LABEL_NEW = 'Optional. It sets your training paces.'
MILE_OLD = 'updatePaceFeasibility();updateMileAdvisory()'
MILE_NEW = 'updateRaceDateFeedback();updateMileAdvisory()'

MILE_TAIL = r'''              <div class="input-label">Current mile time <span style="color:var(--muted);font-weight:400">(optional — personalizes your training paces)</span></div>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="min" value="${g.mileBestMins||''}" oninput="WD.cardioGoals['run'].mileBestMins=this.value;WD.cardioGoals['run'].mileBestSrc={kind:'entered'};updatePaceFeasibility();updateMileAdvisory()" min="3" max="20">
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">minutes</div>
                </div>
                <div style="font-size:24px;color:var(--muted);font-weight:300;flex-shrink:0;padding-bottom:14px">:</div>
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="sec" value="${g.mileBestSecs||''}" oninput="WD.cardioGoals['run'].mileBestSecs=this.value;WD.cardioGoals['run'].mileBestSrc={kind:'entered'};updatePaceFeasibility();updateMileAdvisory()" min="0" max="59">
'''

BASE_A_OLD = r'''oninput="WD.cardioGoals['run'].baselineDist=this.value;WD.cardioGoals['run'].baseline=this.value+(WD.cardioGoals['run']?.paceUnit||'mi')" min="0" step="0.1">'''
BASE_A_NEW = r'''oninput="WD.cardioGoals['run'].baselineDist=this.value;WD.cardioGoals['run'].baseline=this.value+(WD.cardioGoals['run']?.paceUnit||'mi');updateRaceDateFeedback()" min="0" step="0.1">'''

HEAD_A = r'''                <input type="number" class="input-field" style="flex:1" placeholder="e.g. 1.5" value="${g.baselineDist||''}" oninput="WD.cardioGoals['run'].baselineDist=this.value;WD.cardioGoals['run'].baseline=this.value+(WD.cardioGoals['run']?.paceUnit||'mi')" min="0" step="0.1">
                <span style="font-size:13px;color:var(--muted);flex-shrink:0">${WD.cardioGoals['run']?.paceUnit||'mi'}</span>
              </div>
            </div>
            ${WD.experience !== 'beginner' ? `<div class="input-group" style="margin-top:8px">
'''

BASE_B_OLD = r'''oninput="WD.cardioGoals['${t}'].baselineDist=this.value;WD.cardioGoals['${t}'].baseline=this.value+'${t==='run'?' mi':t==='bike'?' min':' yd'}'" min="0" step="${t==='swim'?'50':'0.5'}">'''
BASE_B_NEW = r'''oninput="WD.cardioGoals['${t}'].baselineDist=this.value;WD.cardioGoals['${t}'].baseline=this.value+'${t==='run'?' mi':t==='bike'?' min':' yd'}'${t==='run'?';updateRaceDateFeedback()':''}" min="0" step="${t==='swim'?'50':'0.5'}">'''

HEAD_B = r'''                <input type="number" class="input-field" style="flex:1" placeholder="${t==='run'?'e.g. 3':t==='bike'?'e.g. 20':'e.g. 400'}" value="${g.baselineDist||''}" oninput="WD.cardioGoals['${t}'].baselineDist=this.value;WD.cardioGoals['${t}'].baseline=this.value+'${t==='run'?' mi':t==='bike'?' min':' yd'}'" min="0" step="${t==='swim'?'50':'0.5'}">
                <span style="font-size:13px;color:var(--muted);flex-shrink:0">${t==='run'?'mi':t==='bike'?'min':'yards'}</span>
              </div>
            </div>
            ${(t==='run' && WD.experience !== 'beginner') ? `<div class="input-group" style="margin-top:8px">
'''

def region(name, head, base_old, base_new):
    old = head + MILE_TAIL
    new = old
    for sub_old, sub_new, want in ((base_old, base_new, 1), (LABEL_OLD, LABEL_NEW, 1), (MILE_OLD, MILE_NEW, 2)):
        n = new.count(sub_old)
        if n != want:
            print('ABORT: %s in-region anchor %r count %d != %d; nothing written' % (name, sub_old[:60], n, want)); sys.exit(1)
        new = new.replace(sub_old, sub_new)
    return old, new

EDITS = []
EDITS.append(('E1 block A: handler-repoint(baseline,mile) + copy(R5 mile label)',) + region('E1', HEAD_A, BASE_A_OLD, BASE_A_NEW))
EDITS.append(('E2 generic block: handler-repoint(baseline run-only,mile) + copy(R5 mile label)',) + region('E2', HEAD_B, BASE_B_OLD, BASE_B_NEW))

E3_OLD = "  renderWizardStep();\n  try{ if(typeof updatePaceFeasibility==='function') updatePaceFeasibility(); }catch(e){}\n}\n"
E3_NEW = "  renderWizardStep();\n  try{ updateRaceDateFeedback(); }catch(e){}\n}\n"
EDITS.append(('E3 applySeedData handler-repoint(mile)', E3_OLD, E3_NEW))

E4_OLD = '''// No-race surface for the pace ceiling. When event+dated, the race-date panel owns pace
// messaging (it appends the same offer to its own card), so this stays hidden to avoid a
// double offer.
function updatePaceFeasibility() {
  const el = document.getElementById('paceFeasLine');
  if(!el) return;
  const hide = () => { el.style.display = 'none'; el.innerHTML = ''; };
  if(WD.primaryPath === 'event' && WD.eventTargeted && WD.raceDate) return hide();
  const f = assessRunPaceCeiling();
  if(!f) return hide();
'''
E4_NEW = '''// No-race surface for the pace ceiling. When event+dated, the race-date panel owns pace
// messaging (the card carries the sentence), so this stays hidden to avoid a
// double sentence. D183 (R2): an internal of updateRaceDateFeedback, which passes the ceiling
// it computed once; this line never computes its own.
function updatePaceFeasibility(f) {
  const el = document.getElementById('paceFeasLine');
  if(!el) return;
  const hide = () => { el.style.display = 'none'; el.innerHTML = ''; };
  if(WD.primaryPath === 'event' && WD.eventTargeted && WD.raceDate) return hide();
  if(!f) return hide();
'''
EDITS.append(('E4 internal-decouple updatePaceFeasibility(f)', E4_OLD, E4_NEW))

for name, old, new in EDITS:
    n = src.count(old)
    print('%s anchor count: %d' % (name, n))
    if n != 1:
        print('ABORT: %s anchor count %d != 1; nothing written' % (name, n)); sys.exit(1)

out = src
for name, old, new in EDITS:
    if out.count(old) != 1:
        print('ABORT: %s anchor drifted during apply; nothing written' % name); sys.exit(1)
    out = out.replace(old, new, 1)

for tok, want in ((MILE_OLD, 0), (MILE_NEW, 4), ('personalizes', 0), (LABEL_NEW, 2),
                  ("if(typeof updatePaceFeasibility==='function')", 0), ('function updatePaceFeasibility(f) {', 1)):
    n = out.count(tok)
    if n != want:
        print('ABORT: post-count %r = %d, want %d; nothing written' % (tok, n, want)); sys.exit(1)

open(PATH, 'w', encoding='utf-8').write(out)
print('WROTE', PATH)
