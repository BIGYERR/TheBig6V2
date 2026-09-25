#!/usr/bin/env python3
# V221 S4 of D178 (P-ACTIVE), RESUMED: boot, the wizard commit and both arms of _handoffActiveFrom
# route through loadActiveProgram (S3). Ruling: tests/measure/v221_rulings/p_active_ruling.md,
# "What changes", Loader bullet (Mario CONCURRED 2026-09-24), plus "RE-RULING ON V220 (parked S4)"
# sections 3 and 4 and "MARIO DECISION ON P-BLOCKOPEN" (SHIP, so R2 resumes as written).
# Runs on the working tree with S1/S2 (D177), S3 (D178 loader), S5a/S5b (copy) and S6 (P-DONENAV)
# landed. ia-version is NOT bumped in this slice. P-BLOCKOPEN (refreshProgram copy-back of
# blockOpen) is a separate slice after this one and is NOT in this script.
#
# Four replacements:
#   R1 (H' + M) one contiguous region, loader line through the handoff arms. The loader gains
#      the null clear (checked before the lookup, so the archived/unknown refusal cannot fire
#      on it) and a pre-refresh hook; both handoff arms call it. The text between the two
#      anchors is carried through byte-identical (sliced from the file, asserted unchanged).
#      Byte-identical to the parked script.
#   R2 (L) wizard commit: loader call after the store; the wizard's own currentWeek=1 stays,
#      because calcCurrentWeek() at commit is not 1 for back-dated starts (race-aligned NRC).
#      Byte-identical to the parked script.
#   R3 (K) boot resolver: loader call with the alias fold as the pre-refresh hook, so the fold
#      keeps its place (after activeProgId, before refreshProgram) and the fallback writes back.
#      Parked R3 text unchanged as a prefix; re-ruling section 3 adds the fallthrough clear: a
#      pointer (aid truthy) that resolved to nothing loadable is cleared before Home. The anchor
#      is extended by the following showScreen('screenHome') line to pin the clear's placement.
#   R4 (S) deleteProg: the filtered list is saved BEFORE the handoff (archiveProg's order), so
#      the loader's write-back of the next program is not overwritten by the stale array.
#      Re-ruling section 4. Which program becomes active, the purge and the confirm tiers stay.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
orig_len = len(src)

def rep(s, old, new, tag):
    n = s.count(old)
    print(f'{tag}: anchor count {n}')
    if n != 1:
        print(f'ABORT {tag}: expected 1'); sys.exit(1)
    return s.replace(old, new, 1)

def need(s, needle, want, tag):
    n = s.count(needle)
    print(f'{tag}: count {n} (want {want})')
    if n != want:
        print(f'ABORT {tag}'); sys.exit(1)

# ---- pre-flight -------------------------------------------------------------------------
need(src, '<meta name="ia-version" content="220">', 1, 'pre: ia-version 220')
need(src, 'function loadActiveProgram(', 1, 'pre: loader defined once')
need(src, 'setActiveProgId(', 4, 'pre: setActiveProgId( (def + loader + wizard + handoff)')
need(src, "localStorage.removeItem('ia_active')", 1, "pre: ia_active remover")
need(src, 'loadActiveProgram(', 2, 'pre: loadActiveProgram( (def + setActive)')
need(src, '_handoffActiveFrom(id,programs)', 3, 'pre: _handoffActiveFrom(id,programs) (def + archive + delete)')

# ---- R1 (H' + M): loader extension and both handoff arms, one region --------------------
A_OLD = ("function loadActiveProgram(id){const stored=getPrograms().find(p=>p.id===id);if(!stored)return false;"
         "if(stored.archived){showToast('Restore this program first');return false;}"
         "setActiveProgId(id);activeProgId=id;activeProg=refreshProgram(stored);currentWeek=calcCurrentWeek();"
         "currentDayKey=null;return true;}\n")
A_NEW = ("// S4: loadActiveProgram(null) is the one clear (ia_active removed, both globals null, week 1,\n"
         "// no day). It is checked before the lookup, so the archived and unknown refusals cannot fire\n"
         "// on it. beforeRefresh, when given, runs once the globals name the new id and before\n"
         "// refreshProgram (boot passes its ex-weight alias fold there, the order boot always had).\n"
         "function loadActiveProgram(id,beforeRefresh){"
         "if(id===null){localStorage.removeItem('ia_active');activeProgId=null;activeProg=null;currentDayKey=null;currentWeek=1;return true;}"
         "const stored=getPrograms().find(p=>p.id===id);if(!stored)return false;"
         "if(stored.archived){showToast('Restore this program first');return false;}"
         "setActiveProgId(id);activeProgId=id;if(beforeRefresh)beforeRefresh();activeProg=refreshProgram(stored);"
         "currentWeek=calcCurrentWeek();currentDayKey=null;return true;}\n")
B_OLD = ("    if(nx){setActiveProgId(nx.id);activeProgId=nx.id;activeProg=refreshProgram(nx);currentWeek=calcCurrentWeek();currentDayKey=null;}\n"
         "    else{localStorage.removeItem('ia_active');activeProgId=null;activeProg=null;currentDayKey=null;currentWeek=1;}\n")
B_NEW = ("    // V221 D178: both arms switch through the loader. Next program: the loader sets\n"
         "    // currentWeek=calcCurrentWeek() and currentDayKey=null, the values this arm set. None left:\n"
         "    // the loader's null clear removes ia_active and nulls activeProgId and activeProg.\n"
         "    if(nx)loadActiveProgram(nx.id);\n"
         "    else loadActiveProgram(null);\n")
nA = src.count(A_OLD); nB = src.count(B_OLD)
print(f'R1 anchor A (loader) count {nA}; anchor B (handoff arms) count {nB}')
if nA != 1 or nB != 1: print('ABORT R1: anchors'); sys.exit(1)
i = src.index(A_OLD); j = src.index(B_OLD)
if not i < j: print('ABORT R1: loader must precede the handoff'); sys.exit(1)
middle = src[i + len(A_OLD):j]
need(middle, 'function _handoffActiveFrom(id,programs){', 1, 'R1 middle holds the handoff head')
need(middle, 'function setActive(id){if(!loadActiveProgram(id))return;', 1, 'R1 middle holds setActive (unchanged)')
print(f'R1 middle carried verbatim: {len(middle)} chars, {middle.count(chr(10))} lines')
src = rep(src, A_OLD + middle + B_OLD, A_NEW + middle + B_NEW, 'R1 loader+handoff region')

# ---- R2 (L): wizard commit through the loader, landing week unchanged --------------------
W_OLD = ("    programs.push(prog);savePrograms(programs);\n"
         "    setActiveProgId(prog.id);activeProgId=prog.id;activeProg=prog;\n"
         "    currentWeek=1;\n")
W_NEW = ("    programs.push(prog);savePrograms(programs);\n"
         "    // V221 D178: the wizard commits through the loader; the program is stored on the line\n"
         "    // above, so the loader reads it. The wizard still lands on week 1: calcCurrentWeek() is\n"
         "    // later than 1 for a back-dated start (race-aligned NRC), and the landing does not move.\n"
         "    loadActiveProgram(prog.id);\n"
         "    currentWeek=1;\n")
src = rep(src, W_OLD, W_NEW, 'R2 wizard commit')

# ---- R3 (K): boot resolver through the loader, fallback writes back ----------------------
BOOT_OLD = ("  if(aid&&programs.length){const stored=programs.find(p=>p.id===aid&&!p.archived)||programs.find(p=>!p.archived);"
            "if(stored){activeProgId=stored.id;try{const _x=getExWeights();if(foldExAliasKeys(_x))saveExWeights(_x);}catch(e){}"
            "activeProg=refreshProgram(stored);currentWeek=calcCurrentWeek();showScreen('screenWeek');renderWeekView();"
            "setTimeout(maybeShowReminder,600);return;}}\n")
BOOT_NEW = ("  // V221 D178: boot switches through the loader, so a fallback pick is written back to ia_active.\n"
            "  // The alias fold rides in as the loader's pre-refresh step: after activeProgId, before refreshProgram.\n"
            "  if(aid&&programs.length){const stored=programs.find(p=>p.id===aid&&!p.archived)||programs.find(p=>!p.archived);"
            "if(stored&&loadActiveProgram(stored.id,()=>{try{const _x=getExWeights();if(foldExAliasKeys(_x))saveExWeights(_x);}catch(e){}})){"
            "showScreen('screenWeek');renderWeekView();setTimeout(maybeShowReminder,600);return;}}\n")
HOME = "  showScreen('screenHome');\n"
BOOT_CLEAR = ("  // V221 D178: a pointer that resolved to nothing loadable (every program archived, or none\n"
              "  // stored) is cleared through the loader before Home, so ia_active never names a program that\n"
              "  // is not loaded. No pointer at all: this line is skipped and nothing is written, as before.\n"
              "  if(aid)loadActiveProgram(null);\n")
src = rep(src, BOOT_OLD + HOME, BOOT_NEW + BOOT_CLEAR + HOME, 'R3 boot resolver (+ fallthrough clear)')

# ---- R4 (S): deleteProg saves the filtered list before the handoff -----------------------
DEL_OLD = ("function deleteProg(id,fromProgress){\n"
           "  let programs=getPrograms();\n"
           "  _handoffActiveFrom(id,programs);\n"
           "  programs=programs.filter(p=>p.id!==id);savePrograms(programs);\n"
           "  purgeProgData(id);\n")
DEL_NEW = ("function deleteProg(id,fromProgress){\n"
           "  let programs=getPrograms();\n"
           "  // V221 D178: save before the handoff (archiveProg's order). The loader persists the next\n"
           "  // program's backfill; saving the stale array after it would overwrite that write.\n"
           "  programs=programs.filter(p=>p.id!==id);savePrograms(programs);\n"
           "  _handoffActiveFrom(id,programs);\n"
           "  purgeProgData(id);\n")
src = rep(src, DEL_OLD, DEL_NEW, 'R4 deleteProg save-before-handoff')

# ---- post-flight --------------------------------------------------------------------------
need(src, '<meta name="ia-version" content="220">', 1, 'post: ia-version still 220')
need(src, 'function loadActiveProgram(', 1, 'post: loader defined once')
need(src, 'setActiveProgId(', 2, 'post: setActiveProgId( (def + loader only)')
need(src, "localStorage.removeItem('ia_active')", 1, 'post: ia_active remover (loader only)')
for w in ('activeProgId=prog.id', 'activeProgId=nx.id', 'activeProgId=stored.id', 'activeProg=prog;'):
    need(src, w, 0, f'post: old writer gone [{w}]')
need(src, 'loadActiveProgram(', 8, 'post: loadActiveProgram( raw (def + setActive + 2 handoff + wizard + boot + boot clear + 1 comment)')
code_only = '\n'.join(l for l in src.split('\n') if not l.lstrip().startswith('//'))
need(code_only, 'loadActiveProgram(', 7, 'post: loadActiveProgram( comments excluded (def + setActive + 2 handoff + wizard + boot + boot clear)')
need(src, '_handoffActiveFrom(id,programs)', 3, 'post: _handoffActiveFrom(id,programs) unchanged')
_d = src[src.index('function deleteProg(id,fromProgress){'):]
_d = _d[:_d.index('\n}\n')]
if not (0 <= _d.index('savePrograms(programs);') < _d.index('_handoffActiveFrom(id,programs);')):
    print('ABORT post: deleteProg must save before the handoff'); sys.exit(1)
print('post: deleteProg saves before the handoff')
if src[src.index('function loadActiveProgram('):].find(middle) < 0: print('ABORT post: middle moved'); sys.exit(1)

open(P, 'w', encoding='utf-8').write(src)
print(f'WROTE {P} ({orig_len} -> {len(src)} chars)')
