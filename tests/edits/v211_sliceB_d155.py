#!/usr/bin/env python3
# V211 slice B — D155, option (c) (coach, V210 session; measure first). On a day whose run is a
# tier B long run by _longRunTier (the predicate d18LongRunDayPass reads), recoveryDeload's
# one-accessory arbitration keeps the first block the TIER admits: no item tier B drops
# (_D18_LEG_RX, or hinge/hip_ext by _pattern via _isPostChain) and no power/explosive label or core
# header. On the loaded full-body day that is Upper superset. Everywhere else D91 is untouched.
# A posterior Main does not suppress the tier B pick (tier B strips the Main's hinge as well). No
# admitted block: D91's pick stands. Candidacy = D91's own four tests in the loop's order.
# THREE edits: the signature takes the day's cardio, the tier B pick, the call site passes it.
# Run AFTER slice A. No ia-version bump (Mario owns the bump).
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()

if src.count("&&!/^(hinge|hip_ext)$/.test(_pattern(it.name||'')||''))}));") != 1:
    print('ABORT: slice A (D153) is not in the tree; run v211_sliceA_d153.py first'); sys.exit(1)

EDITS = [
 ("B1 recoveryDeload takes the day's cardio",
  "function recoveryDeload(sections){\n",
  "function recoveryDeload(sections, cardio){\n"),
 ("B2 tier B pick (D155)",
  "    if((s.items||[]).some(it=>it&&_isPostChain(it.name))){ pickIdx=i; break; }    // first posterior accessory block wins\n  }\n",
  "    if((s.items||[]).some(it=>it&&_isPostChain(it.name))){ pickIdx=i; break; }    // first posterior accessory block wins\n  }\n"
  "  // D155 (V211): THE TIER PICKS ON A TIER B LONG-RUN DAY. _longRunTier is the predicate\n"
  "  // d18LongRunDayPass reads, so both passes agree on which day this is. D91's posterior block is\n"
  "  // exactly what tier B strips, which left the loaded full-body long day in a recovery week with\n"
  "  // no lifting at all. Here the surviving accessory block is the first one the tier admits: no\n"
  "  // item tier B drops (_D18_LEG_RX, or hinge/hip_ext by _isPostChain) and no power or explosive\n"
  "  // label or core header. A posterior Main does not suppress this pick, because tier B strips the\n"
  "  // Main's hinge too. Candidacy is D91's own four tests in the loop's order. If no block is\n"
  "  // admitted, D91's pick stands. Every other day never enters this branch.\n"
  "  if(_longRunTier(cardio)==='B'){\n"
  "    const _tierAdmits=s=>!/power|explosive/i.test(s.label||'')&&!/power|explosive/i.test(s.coreHeader||'')\n"
  "      &&!(s.items||[]).some(it=>it&&(_D18_LEG_RX.test(it.name||'')||_isPostChain(it.name||'')));\n"
  "    for(let i=0;i<sections.length;i++){\n"
  "      const s=sections[i]; if(!s) continue;\n"
  "      const L=(s.label||'').toLowerCase();\n"
  "      if(/^main\\b|^primer|^power\\b|^strength\\b/.test(L)) continue;\n"
  "      if(s.hip||/hip|mobility|stretch/.test(L)) continue;\n"
  "      if(s.optional||/carry|finisher|conditioning|explosive/.test(L)) continue;\n"
  "      if(!(s.items||[]).some(it=>it&&_pattern(it.name))) continue;\n"
  "      if(_tierAdmits(s)){ pickIdx=i; break; }    // first block the tier admits wins\n"
  "    }\n"
  "  }\n"),
 ("B3 call site passes the day's cardio",
  "(_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)",
  "(_s=>isRecoveryWeek(w)?recoveryDeload(_s,cardio):_s)"),
]

for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1:
        print('ABORT: anchor', tag, 'count', n); sys.exit(1)
for tag, a, b in EDITS:
    src = src.replace(a, b, 1)
    print('applied', tag)
io.open(P, 'w', encoding='utf-8').write(src)
print('slice B written: %d edit(s)' % len(EDITS))
