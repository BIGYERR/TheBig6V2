#!/usr/bin/env python3
# V216 slice 1 — D154 (coach, re-ruled): the injury renamer reads the build's gear lens.
#   E1  _gearLens(equip) at top level: the predicate body Engine C's pools read as _gearOK, moved
#       verbatim (same lines, same indentation) so applyInjuryFilter can ask the same question.
#   E2  Engine C: const _gearOK = _gearLens(equip). The _gear line under it is unchanged.
#   E3  applyInjuryFilter: an illegal SOURCE is not renamed (bodyweightSweep converts it as before);
#       an illegal TARGET falls to its family's gear-legal member (Cable pushdown -> Close-grip pushups);
#       a target with no fallback row renames as it always did.
#   E4  _INJ_EFFECT elbow/workaround copy, exact text from the ruling.
# No ia-version bump in this slice (Mario owns the bump). Every anchor asserted count==1 before any
# write; the script aborts on the first miss and writes nothing.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()
orig = src

def need(s, anchor, label):
    n = s.count(anchor)
    if n != 1:
        print('ABORT: anchor %s count=%d' % (label, n))
        sys.exit(1)

# ── E1 + E2: move the _gearOK body to top level ────────────────────────────────────────────
HEAD = '  const _gearOK = n => {\n'
TAIL = '    return true;\n  };\n  const _gear = pool => (pool||[]).filter(_gearOK);\n'
need(src, HEAD, 'E2 head')
need(src, TAIL, 'E2 tail')
a = src.index(HEAD)
b = src.index(TAIL)
assert a < b and b - a < 6000, 'E2 span implausible'
# body = everything from '    const N=' through '    return true;\n  };\n' (the arrow's own lines)
BODY = src[a + len(HEAD): b] + '    return true;\n  };\n'
assert BODY.startswith("    const N=String(n||'');\n"), 'E2 body does not open on N'
assert 'if(!hasBarbell && ' in BODY and 'if(!hasGHD && ' in BODY and 'if(!hasCables && ' in BODY and 'if(!hasDumbbells && ' in BODY, 'E2 body missing a clause'

OLD_E2 = HEAD + BODY + '  const _gear = pool => (pool||[]).filter(_gearOK);\n'
need(src, OLD_E2, 'E2 whole')
NEW_E2 = ('  // V216 (D154): the predicate body lives in _gearLens (top level) so applyInjuryFilter can ask\n'
          '  // the same question of an injury rename, for the equipment of the build it filters.\n'
          '  const _gearOK = _gearLens(equip);\n'
          '  const _gear = pool => (pool||[]).filter(_gearOK);\n')

E1_ANCH = "function _tierHasBarbell(equip){ return equip==='home_full'||equip==='commercial'||equip==='crossfit'; }\n"
need(src, E1_ANCH, 'E1')
E1_NEW = (E1_ANCH +
    '// V216 (D154): THE GEAR LENS, one predicate for every reader. Engine C\'s pools read it as _gearOK;\n'
    '// applyInjuryFilter reads it for the build\'s own equipment, so an injury rename is judged by the\n'
    '// same lens the draw was. The four flags derive from the tier exactly as Engine C derives its own.\n'
    '// A pure function of the tier name; the body below moved here verbatim from Engine C.\n'
    'function _gearLens(equip){\n'
    '  const hasBarbell=_tierHasBarbell(equip);\n'
    "  const hasCables=equip==='commercial';\n"
    "  const hasGHD=equip==='commercial'||equip==='crossfit';\n"
    "  const hasDumbbells=equip!=='bodyweight';\n"
    '  return n => {\n' + BODY +
    '}\n')

# ── E3: the renamer ─────────────────────────────────────────────────────────────────────────
OLD_E3 = '      if(P.swapNames&&P.swapNames[name]) name=P.swapNames[name];\n'
need(src, OLD_E3, 'E3')
NEW_E3 = ('      // V216 (D154): the swap reads the build\'s gear lens (_gearLens, the predicate the pools use).\n'
          '      // A source the tier does not own is not renamed: bodyweightSweep converts it exactly as\n'
          '      // before. A target the tier does not own falls to its family\'s gear legal member, so the\n'
          '      // swap the copy promises still lands. A target with no fallback row renames as it always did.\n'
          "      if(P.swapNames&&P.swapNames[name]){\n"
          "        const _gOK=_gearLens((cfg&&cfg.equipment)||'home_full');\n"
          "        const SWAP_GEAR_FALLBACK={'Cable pushdown':'Close-grip pushups'};\n"
          '        if(_gOK(name)){ const to=P.swapNames[name]; name=_gOK(to)?to:(SWAP_GEAR_FALLBACK[to]||to); }\n'
          '      }\n')

# ── E4: the copy ────────────────────────────────────────────────────────────────────────────
OLD_E4 = "elbow:{workaround:'Straight bar work moves to neutral grips, skullcrushers become pushdowns, dips and carries are out, pressing holds RPE 7.',"
need(src, OLD_E4, 'E4')
NEW_E4 = "elbow:{workaround:'Straight bar work moves to neutral grips. Skullcrushers become pushdowns, or close grip pushups where there is no cable. Dips and carries are out. Pressing holds RPE 7.',"

# The fallback member must be spelled as the file's own tricep list spells it.
assert src.count("'Close-grip pushups'") >= 1, 'fallback spelling not in file'
assert "'Bench dips (chair)','Close-grip pushups','Diamond pushups'" in src, 'tricep list spelling moved'

# Apply (all anchors verified above against the untouched source).
src = src.replace(OLD_E2, NEW_E2, 1)
src = src.replace(E1_ANCH, E1_NEW, 1)
need(src, OLD_E3, 'E3 post')
src = src.replace(OLD_E3, NEW_E3, 1)
need(src, OLD_E4, 'E4 post')
src = src.replace(OLD_E4, NEW_E4, 1)

# Post-conditions
for tok, want in [('const _gearOK = n => {', 0), ('const _gearOK = _gearLens(equip);', 1), ('function _gearLens(equip){', 1),
                  ("if(!hasBarbell && /\\bbarbell\\b|^trap bar", 1), ('SWAP_GEAR_FALLBACK', 2), (NEW_E4, 1)]:
    got = src.count(tok)
    if got != want:
        print('ABORT: post-condition %r count=%d want %d' % (tok[:60], got, want)); sys.exit(1)
assert src != orig
open(PATH, 'w', encoding='utf-8').write(src)
print('OK: 4 edits written (E1 _gearLens, E2 Engine C reads it, E3 renamer lens, E4 elbow copy). No version bump.')
