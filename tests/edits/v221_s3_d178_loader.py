#!/usr/bin/env python3
# V221 S3 of D178 (P-ACTIVE): one loader, Set Active routed through it and landing on
# This Week, OPEN / openProg deleted. Ruling: tests/measure/v221_rulings/p_active_ruling.md
# (Mario CONCURRED 2026-09-24). Runs on the working tree (S1/S2 of D177 already landed).
# ia-version is NOT bumped in this slice.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
BS = chr(92)

def rep(s, old, new, tag):
    n = s.count(old)
    print(f'{tag}: anchor count {n}')
    if n != 1:
        print(f'ABORT {tag}: expected 1'); sys.exit(1)
    return s.replace(old, new, 1)

# pre-flight: the Active check label is a literal backslash-u sequence; it must survive untouched
ACTIVE_LBL = 'cursor:default">Active ' + BS + 'u2713</button>'
pre_lbl = src.count(ACTIVE_LBL)
print('pre: Active check label count', pre_lbl)
if pre_lbl != 1: print('ABORT pre: Active label'); sys.exit(1)
pre_ids = src.count('openProgIds')
print('pre: openProgIds count', pre_ids)

# (H)+(J) E1: openProg deleted; the single loader takes its place beside setActive.
E1_OLD = ("function openProg(id){const programs=getPrograms();const stored=programs.find(p=>p.id===id);"
          "if(!stored)return;activeProgId=id;activeProg=refreshProgram(stored);currentWeek=calcCurrentWeek();"
          "showScreen('screenWeek');renderWeekView();}\n")
E1_NEW = ("// V221 D178: the one loader. Every switch of the active program writes ia_active and the\n"
          "// three globals together, so ia_active === activeProgId === activeProg.id holds after it.\n"
          "// Archived never loads (restore first); an unknown id is refused. It does not render or\n"
          "// navigate; callers do. currentWeek is computed as boot computes it.\n"
          "function loadActiveProgram(id){const stored=getPrograms().find(p=>p.id===id);if(!stored)return false;"
          "if(stored.archived){showToast('Restore this program first');return false;}"
          "setActiveProgId(id);activeProgId=id;activeProg=refreshProgram(stored);currentWeek=calcCurrentWeek();"
          "currentDayKey=null;return true;}\n")
src = rep(src, E1_OLD, E1_NEW, 'E1 openProg -> loadActiveProgram')

# (I) E2: setActive routes through the loader and lands on This Week.
E2_OLD = ("function setActive(id){const _p=getPrograms().find(x=>x.id===id);if(_p&&_p.archived){"
          "showToast('Restore this program first');return;}setActiveProgId(id);renderProgList();"
          "showToast('Active program updated');}\n")
E2_NEW = ("// V221 D178: Set Active is the one switch; a switch is complete when This Week shows the new block.\n"
          "function setActive(id){if(!loadActiveProgram(id))return;renderProgList();"
          "showScreen('screenWeek');renderWeekView();showToast('Active program updated');}\n")
src = rep(src, E2_OLD, E2_NEW, 'E2 setActive via loader')

# (J) E3: card loses Open; Set Active takes primary. Active check label bytes are not in the anchor's new text path.
E3_OLD = ("        <button class=\"prog-action-btn primary\" onclick=\"openProg('${p.id}')\">Open</button>\n"
          "        ${!isActive?`<button class=\"prog-action-btn\" onclick=\"setActive('${p.id}')\">Set Active</button>`")
E3_NEW = ("        ${!isActive?`<button class=\"prog-action-btn primary\" onclick=\"setActive('${p.id}')\">Set Active</button>`")
src = rep(src, E3_OLD, E3_NEW, 'E3 card: Open removed, Set Active primary')

# post-flight
post_lbl = src.count(ACTIVE_LBL)
print('post: Active check label count', post_lbl)
if post_lbl != 1: print('ABORT post: Active label moved'); sys.exit(1)
if src.count('openProgIds') != pre_ids: print('ABORT post: openProgIds touched'); sys.exit(1)
print('post: openProgIds count', src.count('openProgIds'))
print('post: openProg( count', src.count('openProg('))
print('post: loadActiveProgram( count', src.count('loadActiveProgram('))

open(P, 'w', encoding='utf-8').write(src)
print('WROTE', P)
