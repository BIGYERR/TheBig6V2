#!/usr/bin/env python3
# V221 S5a of D178 (P-ACTIVE): copy only, four string literals. Ruling:
# tests/measure/v221_rulings/p_active_ruling.md, "Mario's calls" item 5 plus the
# "What changes" copy bullet (card goal line and wizard review drop the dash), and the
# appended "AMENDMENT ON V220 (stale Open copy)" (showToast literals). Mario CONCURRED 2026-09-24.
# Runs on the working tree with S1/S2 (D177) and S3 (D178 loader) landed; S4 is PARKED and
# NOT applied. ia-version is NOT bumped in this slice.
#
# Four replacements, each confined to one string literal inside its anchor:
#   C1 (N) renderProgList card goal line: icon + ' ' + label (was icon + ' — ' + label).
#          asyIcon returns a bare inline <svg> with no margin or trailing text; the equipment
#          line on the same card already joins asyIcon(...,13)+' '+label, so ' ' is one gap.
#   C2 (N) wizard review 'name' step: 'Run: Label' (was 'Run — Label').
#   C3 (O) tabGo guard toast literal.
#   C4 (O) openRestSheet guard toast literal.
# The other four 'Open a program first' sites (openOverlaySheet, openInjurySheet,
# applyInjuryDraft, applyOverlayDraft) are S5b and are left alone here.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
orig_len = len(src)

NEW_TOAST = 'No active program. Tap Set Active or build a new one.'

def need(s, needle, want, tag):
    n = s.count(needle)
    print(f'{tag}: count {n} (want {want})')
    if n != want:
        print(f'ABORT {tag}'); sys.exit(1)

def rep_literal(s, anchor, lit_old, lit_new, tag):
    # anchor must be unique; inside it only lit_old -> lit_new moves (lit_old once in anchor)
    n = s.count(anchor)
    print(f'{tag}: anchor count {n}')
    if n != 1:
        print(f'ABORT {tag}: expected 1'); sys.exit(1)
    if anchor.count(lit_old) != 1:
        print(f'ABORT {tag}: literal not exactly once in anchor'); sys.exit(1)
    new = anchor.replace(lit_old, lit_new, 1)
    return s.replace(anchor, new, 1)

# ---- pre-flight -------------------------------------------------------------------------
need(src, '<meta name="ia-version" content="220">', 1, 'pre: ia-version 220')
need(src, 'function loadActiveProgram(id){', 1, 'pre: S3 loader landed, S4 signature absent')
need(src, 'loadActiveProgram(null)', 0, 'pre: S4 not applied')
need(src, "showToast('Open a program first')", 5, "pre: 'Open a program first' toasts")
need(src, "showToast('Open or build a program first')", 1, "pre: 'Open or build' toast")
need(src, NEW_TOAST, 0, 'pre: new toast absent')

# ---- C1 (N): Programs card goal line ------------------------------------------------------
C1 = ("      ? _cts.map(t=>asyIcon(({run:'🏃',bike:'🚴',swim:'🏊'})[t],13)"
      "+(p.cfg?.cardioGoals?.[t]?.label?' — '+p.cfg.cardioGoals[t].label:'')).join(' + ')\n")
src = rep_literal(src, C1, "?' — '+p.cfg.cardioGoals", "?' '+p.cfg.cardioGoals", 'C1 card goal line')

# ---- C2 (N): wizard review line -----------------------------------------------------------
C2 = ("      ? WD.cardioTypes.map(t => asyIcon(({run:'🏃',bike:'🚴',swim:'🏊'})[t],15)+' '"
      "+({run:'Run',bike:'Bike',swim:'Swim'})[t] + (WD.cardioGoals[t]?.label?' — '+WD.cardioGoals[t].label:'')).join(' + ')\n")
src = rep_literal(src, C2, "?' — '+WD.cardioGoals", "?': '+WD.cardioGoals", 'C2 wizard review line')

# ---- C3 (O): tabGo toast --------------------------------------------------------------------
C3 = ("  if(target==='screenBugs'){showScreen('screenBugs');return;}\n"
      "  if(!activeProg){showToast('Open or build a program first');return;}\n"
      "  if(target==='screenWeek'){showScreen('screenWeek');renderWeekView();return;}\n")
src = rep_literal(src, C3, "'Open or build a program first'", "'" + NEW_TOAST + "'", 'C3 tabGo toast')

# ---- C4 (O): openRestSheet toast ------------------------------------------------------------
C4 = ("function openRestSheet(w,dayKey,view){\n"
      "  if(!activeProg){showToast('Open a program first');return;}\n")
src = rep_literal(src, C4, "'Open a program first'", "'" + NEW_TOAST + "'", 'C4 openRestSheet toast')

# ---- post-flight --------------------------------------------------------------------------
need(src, '<meta name="ia-version" content="220">', 1, 'post: ia-version still 220')
need(src, "' — '+p.cfg.cardioGoals", 0, 'post: card dash joiner gone')
need(src, "' — '+WD.cardioGoals", 0, 'post: wizard dash joiner gone')
need(src, 'Open or build', 0, "post: 'Open or build'")
need(src, 'Open a program first', 4, "post: 'Open a program first' (S5b's four remain)")
need(src, "showToast('" + NEW_TOAST + "')", 2, 'post: new toast at tabGo + openRestSheet')
need(src, 'function loadActiveProgram(id){', 1, 'post: S4 anchor A region untouched')
need(src, 'loadActiveProgram(null)', 0, 'post: S4 still not applied')
delta = len(src) - orig_len
# C4 swaps 'Open a program first' once, C3 swaps 'Open or build...', C1/C2 swap the joiner
want =(len(NEW_TOAST) - len('Open a program first')) + (len(NEW_TOAST) - len('Open or build a program first')) \
       + (len("' '") - len("' — '")) + (len("': '") - len("' — '"))
print(f'post: char delta {delta} (want {want})')
if delta != want: print('ABORT post: char delta'); sys.exit(1)

open(P, 'w', encoding='utf-8').write(src)
print(f'WROTE {P} ({orig_len} -> {len(src)} chars)')
