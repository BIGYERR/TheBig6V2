#!/usr/bin/env python3
# V211 slice A — D153 (coach, V210 session; Mario: "D153 next"). Tier B reads the hinge through
# _pattern(): an item whose _pattern is hinge or hip_ext is dropped on a tier B long-run day, one
# lens with the rest of the engine. _D18_LEG_RX stays the belt for squat, lunge, calf and jump.
# No new name tokens. The clause is measure's counterfactual CF153 verbatim
# (tests/measure/v211_d155_tierb_draw.js F153_B), so measure's numbers are the ones this ships.
# Refills answer to tier B: every pass that writes items runs before d18LongRunDayPass, and the
# 8-set budget runs after this filter inside the same pass (order verified, not changed).
# ONE edit. No ia-version bump (Mario owns the bump).
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()

EDITS = [
 ("A1 tier B item filter reads _pattern (D153)",
  "        secs=secs.map(sec=>({...sec, items:(sec.items||[]).filter(it=>!_D18_LEG_RX.test(it.name||''))}));\n",
  "        // D153 (V211): tier B bans the pattern, not the load. An item _pattern() calls hinge or hip_ext\n"
  "        // goes (Cable pull-through, Bodyweight back extension), the same lens the deload and the caps\n"
  "        // read. _D18_LEG_RX stays the belt for squat, lunge, calf and jump. Every refill runs before\n"
  "        // this pass, so a refilled item answers to this filter and to the 8-set budget below.\n"
  "        secs=secs.map(sec=>({...sec, items:(sec.items||[]).filter(it=>!_D18_LEG_RX.test(it.name||'')&&!/^(hinge|hip_ext)$/.test(_pattern(it.name||'')||''))}));\n"),
]

for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1:
        print('ABORT: anchor', tag, 'count', n); sys.exit(1)
for tag, a, b in EDITS:
    src = src.replace(a, b, 1)
    print('applied', tag)
io.open(P, 'w', encoding='utf-8').write(src)
print('slice A written: %d edit(s)' % len(EDITS))
