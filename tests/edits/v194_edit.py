#!/usr/bin/env python3
# V194 — D53, D54, D55 + version bump. Literal bytes only, no escapes.
# Every anchor asserted count==1 before any write; abort on the first miss.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()

EDITS = []

# ── D53 — drop the implement claim from the main-lift progress line ──
# buildMainLiftBlock: "up 20 lbs on the bar" is false on 77.7% of reachable
# main-slot occurrences (100% on bodyweight / home_basic / minimal).
# Implement-neutral: nothing inferred from a name, no lookup, no conditional.
EDITS.append((
 'D53 main-lift progress line',
 """+(gain>0?' · up <b style="color:var(--lift)">'+gain+' '+u+'</b> on the bar':'')""",
 """+(gain>0?' · up <b style="color:var(--lift)">'+gain+' '+u+'</b>':'')""",
))

# ── D54 — travel overlay must not assert an implement ──
# The non-bodyweight holds string is gated only on equipment!=='bodyweight', so it
# also fires for commercial "Full gym". Same defect class as D53.
EDITS.append((
 'D54 travel overlay holds copy',
 'Grab the heaviest pair they have and work in the 8 to 12 range.',
 'Grab the heaviest load you can control and work in the 8 to 12 range.',
))

# ── D55 — the Range Ladder must not be decided by a primer week ──
EDITS.append((
 'D55 ledgerModel range lookback',
 """    const rng=_rxRangeFor(hist,name,last);""",
 """    // V194 D55: the range that decides Range Ladder vs Other Accessory Work is read from
    // the most recent session that CARRIES one, not strictly the last. A primer or taper
    // week is prescribed fixed low reps, so reading only `last` let the least
    // representative session in the block silently move a lift between two cards and
    // back again, on nothing but which session was logged most recently.
    let rng=null;
    for(let i=all.length-1;i>=0&&!rng;i--) rng=_rxRangeFor(hist,name,all[i]);""",
))

# ── VERSION — last replacement in the script, bump by exactly one ──
EDITS.append((
 'ia-version 193 to 194',
 '<meta name="ia-version" content="193">',
 '<meta name="ia-version" content="194">',
))

fail = False
for label, old, new in EDITS:
    n = src.count(old)
    print('anchor %-34s count=%d' % (label, n))
    if n != 1:
        print('ABORT: anchor "%s" matched %d times, expected exactly 1' % (label, n))
        fail = True
if fail:
    sys.exit(1)

for label, old, new in EDITS:
    src = src.replace(old, new, 1)

io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s' % P)
