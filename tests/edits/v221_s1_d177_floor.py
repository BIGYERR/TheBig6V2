#!/usr/bin/env python3
# V221 build 2, slice S1 of D177 (P-SWAPFLOOR). Ruling: tests/measure/v221_rulings/p_swapfloor_ruling.md
# (R1, R2, R5; R3 as re-ruled by RR2 then RR4). ia-version is NOT bumped in this slice (stays 220).
#   (A) _REP_FLOOR unilateral row gains `landmine (reverse lunge|rotational press)`   [RR4 literal alternation]
#   (B) _swapDetailFor gains the R1 window branch, scoped by the wave Main grammar      [R1, R2]
#   (C) applySwapChoice: optional out-param tells the toast the window fired; third toast branch [R5]
#   (D) comments on those lines
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
# Literal bytes throughout (real ×, —, –). No escapes land in the file.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

with open(PATH, encoding='utf-8', newline='') as f:
    src = f.read()

VER = '<meta name="ia-version" content="220">'
if src.count(VER) != 1:
    sys.exit('ABORT: ia-version is not 220 (count=%d); this slice does not bump' % src.count(VER))

EDITS = []

# ── (A) _REP_FLOOR unilateral row ────────────────────────────────────────────
EDITS.append(('A _REP_FLOOR unilateral row',
r'''  [/split squat|step-?up|single-leg|single leg|pistol/i, [6,10]], // balance caps expressible load
''',
r'''  [/split squat|step-?up|single-leg|single leg|pistol|landmine (reverse lunge|rotational press)/i, [6,10]], // balance caps expressible load
  // V221 D177 (RR2, RR4): the two loaded landmine lifts, by name. Not a bare `landmine` token:
  // Landmine rotations is core and has no load window. A future landmine lift is added here on entry.
'''))

# ── (B) _swapDetailFor: R1 window branch, R2 grammar scope ───────────────────
EDITS.append(('B _swapDetailFor R1 branch',
r'''function _swapDetailFor(name,detail){
  if(!name||!detail) return detail;
  const fl=(typeof _repFloor==='function')?_repFloor(name):null;
  if(!(fl&&fl[1]===0)) return detail;                 // movement can express a rep target
''',
r'''function _swapDetailFor(name,detail,out){
  if(!name||!detail) return detail;
  const fl=(typeof _repFloor==='function')?_repFloor(name):null;
  // V221 D177 (R1, R2). A swapped Main is prescribed the way the engine would have
  // prescribed the candidate in that slot: scheme()'s floor branch, on the wave Main
  // grammar and nothing else. The detail must start `S×R — RPE ` with R a number or a
  // lo–hi range, and the low end is compared exactly as scheme() compares it. Under the
  // window's low end the rep token becomes the window; sets, RPE, note, ramp-up and rest
  // carry byte for byte. At or above it the donor carries verbatim. The null row never
  // gets here with a window, so barbell compounds carry verbatim too.
  // This sits BEFORE the _BW_KEEP_FIXED test on purpose: that regex holds `rotational`,
  // which would shut out Landmine rotational press, a loaded lift the unilateral row windows.
  // `out` is optional. A caller that passes one learns the window fired (the swap toast).
  if(fl&&fl[1]!==0){
    const m=/^(\d+×)(\d+(?:–\d+)?)( — RPE )/.exec(detail);
    if(m){
      const lo=parseInt(m[2],10);
      if(!(lo>=fl[0])){
        if(out) out.win=[fl[0],fl[1]];
        return m[1]+fl[0]+'–'+fl[1]+detail.slice(m[1].length+m[2].length);
      }
    }
    return detail;
  }
  if(!(fl&&fl[1]===0)) return detail;                 // movement can express a rep target
'''))

# ── (C) applySwapChoice: plumbing + comment ──────────────────────────────────
EDITS.append(('C applySwapChoice out-param',
r'''  // The ONE exception is a swap onto a movement with no load to move, where a rep target
  // is a guess rather than an instruction; _swapDetailFor converts those and only those.
  item.name=to;
  const _wasDetail=item.detail;
  item.detail=_swapDetailFor(to,item.detail);
  const _reRx=(item.detail!==_wasDetail);
''',
r'''  // The ONE exception is a swap onto a movement with no load to move, where a rep target
  // is a guess rather than an instruction; _swapDetailFor converts those and only those.
  // V221 D177 (R1): the second is a wave Main whose reps sit under the candidate's load
  // window; _swapDetailFor raises the rep token to the window and reports it in _rx.win.
  item.name=to;
  const _wasDetail=item.detail;
  const _rx={};
  item.detail=_swapDetailFor(to,item.detail,_rx);
  const _reRx=(item.detail!==_wasDetail);
'''))

# ── (C) applySwapChoice: third toast branch ──────────────────────────────────
EDITS.append(('C applySwapChoice toast',
r'''  showToast(_reRx
    ? to+' in, '+from.toLowerCase()+' out. No load to add here, so take the sets to the same effort.'
    : to+' in, '+from.toLowerCase()+' out. Same job, same numbers.');
''',
r'''  // V221 D177 (R5): the third branch fires only when the window branch moved the reps.
  // Never on the unloadable branch, which keeps its V119 copy, never on a verbatim pair.
  showToast(_rx.win
    ? to+' in, '+from.toLowerCase()+' out. The load runs out before the reps do here. Same sets, same effort. Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'.'
    : _reRx
    ? to+' in, '+from.toLowerCase()+' out. No load to add here, so take the sets to the same effort.'
    : to+' in, '+from.toLowerCase()+' out. Same job, same numbers.');
'''))

# Assert every anchor first; abort on the first miss, before anything is written.
for tag, old, new in EDITS:
    n = src.count(old)
    print('anchor %-32s count=%d' % (tag, n))
    if n != 1:
        sys.exit('ABORT: anchor "%s" count=%d (expected 1); nothing written' % (tag, n))

for tag, old, new in EDITS:
    src = src.replace(old, new, 1)

# Post-conditions on the in-memory result.
assert src.count(VER) == 1, 'ia-version moved'
assert src.count('landmine (reverse lunge|rotational press)') == 1, 'landmine literal must land exactly once (the row)'
assert src.count('function _swapDetailFor(name,detail,out){') == 1, 'R1 signature'
assert src.count("Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'.'") == 1, 'R5 toast'
with open(PATH, 'w', encoding='utf-8', newline='') as f:
    f.write(src)
print('WROTE', PATH)
