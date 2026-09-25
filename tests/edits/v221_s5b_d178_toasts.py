#!/usr/bin/env python3
# V221 S5b of D178 (P-ACTIVE): copy only, four string literals. Ruling:
# tests/measure/v221_rulings/p_active_ruling.md, "## AMENDMENT ON V220 (stale Open copy)".
# Six showToast guards become 'No active program. Tap Set Active or build a new one.';
# S5a did tabGo and openRestSheet, this slice does the last four. Only the string inside
# showToast(...) moves; predicate, early return and the rest of each function stay byte-identical.
# Runs on the working tree with S1/S2 (D177), S3 (D178 loader) and S5a landed; S4 is PARKED
# and NOT applied. ia-version is NOT bumped in this slice.
#
# Four replacements, class (O) "D178 copy: stale Open verb", one line each. The four guard
# lines are identical, so each anchor carries its function header to reach count==1:
#   T1 openOverlaySheet guard toast literal.
#   T2 openInjurySheet guard toast literal.
#   T3 applyInjuryDraft guard toast literal.
#   T4 applyOverlayDraft guard toast literal.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
orig_len = len(src)

OLD_TOAST = 'Open a program first'
NEW_TOAST = 'No active program. Tap Set Active or build a new one.'
GUARD = "  if(!activeProg){showToast('" + OLD_TOAST + "');return;}\n"

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
need(src, GUARD, 4, "pre: 'Open a program first' guard lines")
need(src, OLD_TOAST, 4, "pre: 'Open a program first' anywhere")
need(src, 'Open or build', 0, "pre: 'Open or build' (S5a landed)")
need(src, "showToast('" + NEW_TOAST + "')", 2, 'pre: new toast at tabGo + openRestSheet (S5a landed)')

# ---- T1..T4 (O): guard toast literals -------------------------------------------------------
LIT_OLD = "'" + OLD_TOAST + "'"
LIT_NEW = "'" + NEW_TOAST + "'"
for tag, header in (
    ('T1 openOverlaySheet toast',  'function openOverlaySheet(){\n'),
    ('T2 openInjurySheet toast',   'function openInjurySheet(){\n'),
    ('T3 applyInjuryDraft toast',  'function applyInjuryDraft(){\n'),
    ('T4 applyOverlayDraft toast', 'function applyOverlayDraft(){\n'),
):
    src = rep_literal(src, header + GUARD, LIT_OLD, LIT_NEW, tag)

# ---- post-flight --------------------------------------------------------------------------
need(src, '<meta name="ia-version" content="220">', 1, 'post: ia-version still 220')
need(src, OLD_TOAST, 0, "post: 'Open a program first'")
need(src, 'Open a program', 0, "post: 'Open a program'")
need(src, 'Open or build', 0, "post: 'Open or build'")
need(src, "  if(!activeProg){showToast('" + NEW_TOAST + "');return;}\n", 6, 'post: new guard line, all six sites')
need(src, NEW_TOAST, 6, 'post: new toast anywhere')
need(src, 'function loadActiveProgram(id){', 1, 'post: S4 anchor A region untouched')
need(src, 'loadActiveProgram(null)', 0, 'post: S4 still not applied')
delta = len(src) - orig_len
want = 4 * (len(NEW_TOAST) - len(OLD_TOAST))
print(f'post: char delta {delta} (want {want})')
if delta != want: print('ABORT post: char delta'); sys.exit(1)

open(P, 'w', encoding='utf-8').write(src)
print(f'WROTE {P} ({orig_len} -> {len(src)} chars)')
