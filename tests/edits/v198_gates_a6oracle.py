#!/usr/bin/env python3
# V198 (D85) gate slice 4: g198_posterior_floor.js — A6b's ORACLE LINE was wrong, and this
# fixes the oracle, not the claim.
#
# A6b counted "invocations offered a leg_iso item" with the hand regex
#     /leg extension|lying leg curl|seated leg curl|leg press/i
# and read 4/864 on the candidate. The wrong term is `leg press`: A6b0, on the same run and
# against the engine's own classifier, reports 3 of those 4 names are leg_iso and 'Leg press'
# is NOT one of them. So the regex counted four invocations that were offered a LEG PRESS,
# which the fold this claim is about does not touch — the fold protects items whose _pattern
# is leg_iso, and Leg press is not one. The count the claim needs is over the three names the
# engine agrees are leg_iso. The Leg press count is not thrown away: it is counted separately
# and printed, because "the budget is offered a leg press four times" is a real fact and the
# next session should not have to rediscover it to explain the number.
# index.html is NOT touched by this script. ia-version stays 198.
import io, sys, os

F = os.path.join('/Users/CanasBangin/Desktop/TheBig6V2', 'tests', 'gates', 'g198_posterior_floor.js')
src = io.open(F, encoding='utf-8').read()
reps = []


def rep(tag, old, new):
    global src
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ANCHOR MISS [%s]: count==%d, expected 1\n' % (tag, n))
        sys.exit(2)
    src = src.replace(old, new)
    reps.append(tag)


rep('A6 counters', "let B_in=0, B_out0=0, B_held=0, B_cells=0, B_iso=0;",
    "let B_in=0, B_out0=0, B_held=0, B_cells=0, B_iso=0, B_press=0;")

rep('A6 oracle regex',
    """  // HAND regex for the leg_iso names A6 asks about, written from the library and not from
  // _pattern, so the count below is not the engine agreeing with itself. A6b0 checks the
  // engine's own classifier separately, which is how a drift between the two shows up.
  const RISO=/leg extension|lying leg curl|seated leg curl|leg press/i;
  const ic=secs=>[].concat.apply([],(secs||[]).map(s=>(s.items||[]).map(i=>String(i.name||''))))
    .reduce((a,n)=>a+(RISO.test(n)?1:0),0);""",
    """  // HAND regex for the leg_iso names A6 asks about, written from the library and not from
  // _pattern, so the count below is not the engine agreeing with itself. A6b0 checks the
  // engine's own classifier separately, which is how a drift between the two shows up — and
  // it did: 'Leg press' is deliberately NOT in this regex. A6b0 reads the engine and finds
  // three of the four names are leg_iso; Leg press is not one of them, so a day carrying a
  // leg press is not a day the leg_iso fold can touch, and counting it here made A6b read
  // 4/864 for a reason that had nothing to do with the claim. It is counted on its own line
  // instead, because four invocations being offered a leg press is a fact worth keeping.
  const RISO=/leg extension|lying leg curl|seated leg curl/i;
  const RPRESS=/leg press/i;
  const countIf=(secs,re)=>[].concat.apply([],(secs||[]).map(s=>(s.items||[]).map(i=>String(i.name||''))))
    .reduce((a,n)=>a+(re.test(n)?1:0),0);
  const ic=secs=>countIf(secs,RISO);""")

rep('A6 press accumulate',
    """      if(ic(r.b)>0) B_iso++;""",
    """      if(ic(r.b)>0) B_iso++;
      if(countIf(r.b,RPRESS)>0) B_press++;""")

rep('A6b message',
    """ok(B_iso===0, 'A6b '+B_iso+'/'+B_cells+' budget invocations on the swept lattice are offered a leg_iso item. ZERO is the recorded state; one would make the doctrine-only record below stale and it must be re-derived, not relaxed');""",
    """ok(B_iso===0, 'A6b '+B_iso+'/'+B_cells+' budget invocations on the swept lattice are offered an item the engine calls leg_iso. ZERO is the recorded state; one would make the doctrine-only record below stale and it must be re-derived, not relaxed. (Separately, '+B_press+'/'+B_cells+' are offered a Leg press, which _pattern does not call leg_iso and the fold therefore does not touch.)');""")

io.open(F, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d replacements)' % (F, len(reps)))
for t in reps:
    print('  - ' + t)
