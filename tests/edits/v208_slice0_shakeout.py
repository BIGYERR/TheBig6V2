#!/usr/bin/env python3
# V208 slice 0 — D106a fix-forward (coach ruling). No version bump in this slice (Mario owns it).
# (1) B4: the long LSD (slot lsd_long, legLoad true) at T-1 and T-2 takes the week's easy LSD
#     dose through the same mechanism as INT/CHI, captured before the pin moves anything.
# (2) raceEveLiftPass: the Shakeout title keys on the CARD: the LSD limb is the easy LSD only
#     (legLoad false). The recovery-run limb (NRC) is untouched.
# Every anchor asserted count==1 before anything is written; abort on the first miss.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
  ("B4 comment + finder: the long LSD joins INT/CHI",
   "      // D106a (V207, B4): nothing hard the day before the test or two days out (D38's window,\n"
   "      // read across the week boundary like raceEveLiftPass). A hard run there becomes that\n"
   "      // week's untagged easy LSD as it was dealt, captured here before the pin moves anything.\n"
   "      // A week with no easy LSD rests the day instead.\n",
   "      // D106a (V207, B4): nothing hard the day before the test or two days out (D38's window,\n"
   "      // read across the week boundary like raceEveLiftPass). A hard run there becomes that\n"
   "      // week's untagged easy LSD as it was dealt, captured here before the pin moves anything.\n"
   "      // A week with no easy LSD rests the day instead. V208: the long LSD is hard here too\n"
   "      // (legLoad), so it takes the easy dose by the same slot rule as INT and CHI.\n"),
  ("B4 slot predicate",
   "        const _h = _sl.find(r => r.w === x.w && r.d === x.d && (r.t === 'int' || r.t === 'chi') && r !== _q);\n",
   "        const _h = _sl.find(r => r.w === x.w && r.d === x.d && (r.t === 'int' || r.t === 'chi' || r.t === 'lsd_long') && r !== _q);\n"),
  ("raceEveLiftPass: Shakeout keys on the card (easy LSD only)",
   "    // D106a (V207): NSW's easy run is the long slow distance card, so it shakes out too. Run\n"
   "    // cards only: a bike or swim LSD on an NRC multi-sport eve keeps its title. A test goal's\n"
   "    // marker day is Test Day; NRC keeps Race Day.\n"
   "    const _rec = /^recovery run/i.test(day.cardio.subtype||'') || (day.cardio.type === 'run' && /^long slow distance/i.test(day.cardio.subtype||''));\n",
   "    // D106a (V207): NSW's easy run is the long slow distance card, so it shakes out too. Run\n"
   "    // cards only: a bike or swim LSD on an NRC multi-sport eve keeps its title. A test goal's\n"
   "    // marker day is Test Day; NRC keeps Race Day. V208: the claim is on the card, never the\n"
   "    // slot: only the EASY LSD (legLoad false) is the easy run, so a long card is never Shakeout.\n"
   "    const _rec = /^recovery run/i.test(day.cardio.subtype||'') || (day.cardio.type === 'run' && !day.cardio.legLoad && /^long slow distance/i.test(day.cardio.subtype||''));\n"),
]
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor "%s" count=%d (want 1); nothing written' % (name, n))
    src = src.replace(old, new, 1)
open(P, 'w', encoding='utf-8').write(src)
print('applied %d edits' % len(EDITS))
