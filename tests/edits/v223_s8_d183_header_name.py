#!/usr/bin/env python3
# V223 slice S8 (D183 slice S5) of D183 (P-SAFEPACE), per tests/measure/v223_rulings/p_safepace_ruling.md
# R3 ("The header at :2903 reads `_tw` when a dated test goal is present, else `calcProgramLength`; the
# :2758 comment ("the race date never...") predates D106a and is rewritten"), R5 (header and sessions copy)
# and D183 AMENDMENT 2 (a) (singular: `L + (L===1 ? ' week' : ' weeks')`).
#   E1  D183-header-id+copy      the header line becomes <span id="progLenLine">${progLenLineHTML()}</span>
#                                (the sentence builder landed in S1; the S2 repaint already writes that id);
#                                the sessions line loses its em-dash (R5).
#   E2  D183-header-source       previewWeeks goes: its only reader was the header line E1 replaces.
#       D183-comment-rewrite     the stale "race date never compresses it" comment is rewritten (R3).
#   E3  D183-name-step-pin       name step programWeeks reads the wizard's test pin first, then the goal length.
#   E4  D183-name-step-pin       name row singular on programWeeks === 1 (amendment 2 (a)).
# Every anchor is asserted count==1 on the tree before any write; the first miss aborts and nothing is
# written. No ia-version bump (stays 222).
# Usage: v223_s8_d183_header_name.py [target.html]
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

def die(msg):
    print('ABORT: ' + msg + '; nothing written'); sys.exit(1)

def one(hay, tok, what):
    n = hay.count(tok)
    if n != 1: die('%s: anchor count %d, want 1: %r' % (what, n, tok[:120]))
    return hay.index(tok)

if '<meta name="ia-version" content="222">' not in src:
    die('ia-version is not 222')
# S1 and S2 must be on the tree: the pin, the sentence builder, and the repaint that writes #progLenLine.
for tok in ('function wizardTestPin(){',
            'function progLenLineHTML(p, len){',
            "  const _ll = document.getElementById('progLenLine');\n  if(_ll) _ll.innerHTML = progLenLineHTML(p, len);\n"):
    one(src, tok, 'precondition')
if src.count('id="progLenLine"') != 0: die('id="progLenLine" already in a template')

EDITS = []

# ---------------------------------------------------------------- E1 header line + sessions copy (R3/R5)
EDITS.append(('E1 header',
"""        <b style="color:var(--accent)">Program length: ${previewWeeks} weeks</b> — based on your longest cardio goal and experience level.
        ${WD.cardioTypes.length > 1 ? '<br>Sessions rotate across training days — each sport gets dedicated days.' : ''}
""",
"""        <span id="progLenLine">${progLenLineHTML()}</span>
        ${WD.cardioTypes.length > 1 ? '<br>Sessions rotate across training days. Each sport gets its own days.' : ''}
"""))

# ---------------------------------------------------------------- E2 previewWeeks out, comment rewritten (R3)
EDITS.append(('E2 previewWeeks',
"""    // Calculate longest required timeline across selected sports.
    // Program length is driven ONLY by the goal + experience — the race date never
    // compresses it. If the race is too soon we warn the user instead of cutting weeks.
    let previewWeeks = 6;
    if(WD.cardioTypes.length) {
      const _pg = {...WD.cardioGoals, _experience:WD.experience||'intermediate', _ageBracket:WD.ageBracket||'18-35', _eventTargeted:WD.eventTargeted};
      previewWeeks = calcProgramLength(WD.cardioTypes, _pg, LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced').weeks;
    }
""",
"""    // D183 (P-SAFEPACE R3): the program length header below prints progLenLineHTML(). A dated test
    // goal prints its test week (wizardTestPin().tw), the length that builds; every other goal prints
    // calcProgramLength's length for the goal and experience. updateRaceDateFeedback repaints it.
"""))

# ---------------------------------------------------------------- E3 name step reads the pin (R3)
EDITS.append(('E3 name step',
"""    const programWeeks = WD.cardioTypes.length ? calcProgramLength(WD.cardioTypes,_nameGoalsExp,internalGoal).weeks : 6;
""",
"""    const programWeeks = (wizardTestPin()||{}).tw || (WD.cardioTypes.length ? calcProgramLength(WD.cardioTypes,_nameGoalsExp,internalGoal).weeks : 6);   // D183 (P-SAFEPACE R3): a dated test pins the length
"""))

# ---------------------------------------------------------------- E4 name row singular (amendment 2 (a))
EDITS.append(('E4 name row',
"""        ['Program length', programWeeks + ' weeks'],
""",
"""        ['Program length', programWeeks + (programWeeks === 1 ? ' week' : ' weeks')],
"""))

# Assert every anchor on the untouched tree first, then apply in order (each still count==1 at apply time).
for what, old, new in EDITS:
    one(src, old, what + ' (pre-check)')
out = src
for what, old, new in EDITS:
    one(out, old, what)
    out = out.replace(old, new, 1)
    print('%s: anchor count 1, replaced (%d -> %d chars)' % (what, len(old), len(new)))

if out.count('previewWeeks') != 0: die('previewWeeks still present %d times' % out.count('previewWeeks'))
if out.count('id="progLenLine"') != 1: die('id="progLenLine" count %d, want 1' % out.count('id="progLenLine"'))
if '<meta name="ia-version" content="222">' not in out: die('ia-version moved')

open(PATH, 'w', encoding='utf-8').write(out)
print('written: %s' % PATH)
