#!/usr/bin/env python3
# V223 slice S4 (D183 slice S1) of D183 (P-SAFEPACE), per tests/measure/v223_rulings/p_safepace_ruling.md
# R2 (as re-ruled: the one repaint KEEPS the name updateRaceDateFeedback; updatePaceFeasibility and
# updatePaceDisplay become its internals; the renderWizardStep tail calls it; the 80 ms timer goes) and
# R3's number source: wizardTestPin() with D184 (b1)'s name and return shape {tw, len, week}
# (tests/measure/v223_rulings/p_testlen_d184_ruling.md), carrying TODAY's gate (1 <= week <= len), so the
# header still equals the built length until D184 changes the predicate.
#   E1  D183-new-helper(wizardTestPin, progLenLineHTML)  inserted before `const _RACE_NAME = {run_5k:'5K'`.
#       progLenLineHTML is DEFINED here, rendered only from S5 (the template gets #progLenLine there).
#   E2  D183-repaint-fold(head)  updateRaceDateFeedback's head: sync, p, len, _f once; paint #progLenLine if
#       present; updatePaceDisplay(); updatePaceFeasibility(_f); only then the #raceDateFeedback check.
#       The old body stays; its block-scoped `const _f` shadows the head's legally.
#       L = (p && p.tw) || undefined is inert in this slice: assessRunPaceCeiling takes no L until S4, and
#       what L is when tw is null waits on the pending D183 amendment (plan flag 4).
#   E3  D183-timer-removal  renderWizardStep: the raceDate default-fill stays; setTimeout(...80) goes.
#   E4  D183-repaint-tail   the cardio_goal tail calls updateRaceDateFeedback() instead of updatePaceFeasibility().
# No ia-version bump (stays 222). Every anchor is asserted count==1 before anything is written; the first
# miss aborts and nothing is written.
# Usage: v223_s4_d183_repaint_core.py [target.html]
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

if '<meta name="ia-version" content="222">' not in src:
    print('ABORT: ia-version is not 222; nothing written'); sys.exit(1)
for tok in ('function wizardTestPin(', 'function progLenLineHTML(', 'progLenLine'):
    if src.count(tok) != 0:
        print('ABORT: %r already present; nothing written' % tok); sys.exit(1)
for tok in ('function wizardAlignment(){', 'function testWeekIndex(startIso, raceIso){',
            'function resolveStartDate(dateStr, restDays){', 'function assessRunPaceCeiling() {',
            'function updatePaceFeasibility() {', 'function updatePaceDisplay() {'):
    if src.count(tok) != 1:
        print('ABORT: precondition %r not found exactly once; nothing written' % tok); sys.exit(1)

_LEN_EXPR = ("calcProgramLength(WD.cardioTypes, {...WD.cardioGoals, _experience:WD.experience||'intermediate', "
             "_ageBracket:WD.ageBracket||'18-35', _eventTargeted:WD.eventTargeted}, "
             "LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced').weeks")

EDITS = []

# ── E1 ─────────────────────────────────────────────────────────────────────────────
E1_OLD = "const _RACE_NAME = {run_5k:'5K', run_10k:'10K', run_half:'half', run_marathon:'marathon'};\n"
E1_NEW = (
"// D183 (P-SAFEPACE R3), sited with D184 (b1)'s name and shape: the wizard's dated test pin. Every\n"
"// week number on the cardio goal step reads it. The predicate and the calcProgramLength arguments\n"
"// are doGenerate's; the gate (1 <= week <= len) is today's, so the header still equals the built\n"
"// length until D184 swaps this body for progTestPin. Returns {tw, len, week}, or null when the goal\n"
"// is not a dated test goal; week is the raw test week (null when the test falls before the start).\n"
"function wizardTestPin(){\n"
"  const g = WD && (WD.cardioTypes||[]).includes('run') && WD.cardioGoals && WD.cardioGoals.run;\n"
"  if(!g || !PACE_GOALS.has(g.id) || WD.eventTargeted === false || !WD.raceDate) return null;\n"
"  const len = " + _LEN_EXPR + ";\n"
"  const week = testWeekIndex(resolveStartDate(WD.startDate, WD.restDays||[]).start, WD.raceDate);\n"
"  return {tw: (week >= 1 && week <= len) ? week : null, len, week};\n"
"}\n"
"// D183 (P-SAFEPACE R3/R5): the header sentence on the cardio goal step. A dated test goal prints its\n"
"// test week, which is the length that builds; every other goal prints its goal length. The repaint\n"
"// passes the pin and the length it already computed; the template calls it bare.\n"
"function progLenLineHTML(p, len){\n"
"  if(p === undefined) p = wizardTestPin();\n"
"  if(len === undefined) len = p ? p.len : ((WD.cardioTypes||[]).length ? " + _LEN_EXPR + " : 6);\n"
"  const n = (p && p.tw) || len;\n"
"  return '<b style=\"color:var(--accent)\">Program length: '+n+(n === 1 ? ' week.' : ' weeks.')+'</b> '+"
"((p && p.tw) ? 'Your test sets it.' : 'Set by your longest cardio goal and your experience.');\n"
"}\n"
) + E1_OLD
EDITS.append(('E1 new-helper', E1_OLD, E1_NEW))

# ── E2 ─────────────────────────────────────────────────────────────────────────────
E2_OLD = (
"function updateRaceDateFeedback() {\n"
"  const input = document.getElementById('raceDateInput');\n"
"  const feedback = document.getElementById('raceDateFeedback');\n"
"  if(!feedback) return;\n"
"  // Sync WD.raceDate from input if present\n"
"  if(input && input.value) WD.raceDate = input.value;\n"
)
E2_NEW = (
"function updateRaceDateFeedback() {\n"
"  // D183 (P-SAFEPACE R2): the one repaint for the cardio goal step. It computes the test pin, the\n"
"  // length and the pace ceiling once from WD, then repaints the header, the pace line, the\n"
"  // feasibility line and this card synchronously, in one tick. updatePaceDisplay and\n"
"  // updatePaceFeasibility are its internals. No timer.\n"
"  const input = document.getElementById('raceDateInput');\n"
"  // Sync WD.raceDate from input if present\n"
"  if(input && input.value) WD.raceDate = input.value;\n"
"  const p = wizardTestPin();\n"
"  const len = p ? p.len : ((WD.cardioTypes||[]).length ? " + _LEN_EXPR + " : 6);\n"
"  const _f = assessRunPaceCeiling((p && p.tw) || undefined);   // L: the test week when one pins\n"
"  const _ll = document.getElementById('progLenLine');\n"
"  if(_ll) _ll.innerHTML = progLenLineHTML(p, len);\n"
"  updatePaceDisplay();\n"
"  updatePaceFeasibility(_f);\n"
"  const feedback = document.getElementById('raceDateFeedback');\n"
"  if(!feedback) return;\n"
)
EDITS.append(('E2 repaint-fold(head)', E2_OLD, E2_NEW))

# ── E3 ─────────────────────────────────────────────────────────────────────────────
E3_OLD = (
"  // Re-trigger race date feedback if returning to this step\n"
"  if(step === 'cardio_goal' && WD.eventTargeted) {\n"
"    // Default raceDate to today if not set, so feedback shows on first open\n"
"    if(!WD.raceDate) {\n"
"      const t = new Date();\n"
"      WD.raceDate = t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');\n"
"    }\n"
"    setTimeout(() => updateRaceDateFeedback(), 80);\n"
"  }\n"
)
E3_NEW = (
"  // Default raceDate to today on the cardio goal step if not set, so the card shows on first open.\n"
"  // D183 (P-SAFEPACE R2): the repaint runs synchronously from this step's tail below; no timer.\n"
"  if(step === 'cardio_goal' && WD.eventTargeted) {\n"
"    if(!WD.raceDate) {\n"
"      const t = new Date();\n"
"      WD.raceDate = t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');\n"
"    }\n"
"  }\n"
)
EDITS.append(('E3 timer-removal', E3_OLD, E3_NEW))

# ── E4 ─────────────────────────────────────────────────────────────────────────────
E4_OLD = "    updatePaceFeasibility(); // sync: body.innerHTML is set, so #paceFeasLine exists if rendered\n"
E4_NEW = ("    updateRaceDateFeedback(); // D183 (P-SAFEPACE R2): the one repaint, in this tick: body.innerHTML is set,"
          " so every node it paints exists if rendered\n")
EDITS.append(('E4 repaint-tail', E4_OLD, E4_NEW))

# ── assert all anchors first ───────────────────────────────────────────────────────
for name, old, new in EDITS:
    n = src.count(old)
    print('%s anchor count: %d' % (name, n))
    if n != 1:
        print('ABORT: %s anchor count %d != 1; nothing written' % (name, n)); sys.exit(1)
out = src
for name, old, new in EDITS:
    if out.count(old) != 1:
        print('ABORT: %s anchor moved by an earlier edit; nothing written' % name); sys.exit(1)
    out = out.replace(old, new, 1)
if out.count('setTimeout(() => updateRaceDateFeedback') != 0:
    print('ABORT: the 80 ms timer survived; nothing written'); sys.exit(1)
open(PATH, 'w', encoding='utf-8').write(out)
print('WROTE', PATH)
