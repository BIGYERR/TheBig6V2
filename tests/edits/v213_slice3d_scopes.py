#!/usr/bin/env python3
# V213 slice 3d — two more build-pair rows scoped to the pair they were written for (standing ruling 4).
#   (i)  tests/gates/g208_d104a_runbase.js R8b: the V208 close-guard pair (candidate 208 against its 208
#        pre-edit tree). It ran on ANY same-version pair, so 212 against V212 before the bump ran it.
#        Now it runs only when the candidate reads 208, and SKIPs by name otherwise.
#   (ii) tests/gates/g212_d110a_swim.js P1: the 212-vs-211 pair only. PAIR (candidate reads 212) cannot
#        tell V212 from a later build before its bump, which also reads 212. The baseline source can:
#        when the baseline passed as argv[3] reads the candidate's own version, the candidate is a
#        later build and P1 SKIPs by name. With a V211 baseline, or none (V211 read from git), P1 runs
#        as before.
# No index.html change. No ia-version change.
import io, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'

def apply(fname, reps):
    p = ROOT + fname
    src = io.open(p, encoding='utf-8').read()
    bad = False
    for tag, old, new in reps:
        c = src.count(old)
        print('%-24s %-40s count=%d' % (fname, tag, c))
        if c != 1: bad = True
    if bad:
        sys.exit('ABORT: an anchor in %s did not appear exactly once. Nothing written.' % fname)
    for tag, old, new in reps:
        if src.count(old) != 1:
            sys.exit('ABORT: %s anchor %s drifted. Nothing written.' % (fname, tag))
        src = src.replace(old, new, 1)
    return p, src

GRB = [
("E1 R8b scoped to the V208 close pair",
"""    if(+IB.version !== VER) skip('R8b runs only against the pre-edit tree at the same ia-version (build proof for the V208 close guard); this pair is ' + VER + ' vs ' + IB.version);""",
"""    if(+IB.version !== VER) skip('R8b runs only against the pre-edit tree at the same ia-version (build proof for the V208 close guard); this pair is ' + VER + ' vs ' + IB.version);
    // V213 (standing ruling 4): R8b is the V208 close pair. A later build before its bump also reads the
    // same version as its baseline, and its ruled moves are not R8b's business.
    else if(VER !== ERA) skip('R8b scoped to the V208 close build pair (candidate 208 against its 208 pre-edit tree); this pair is ' + VER + ' vs ' + IB.version + ', a later build before its bump');"""),
]

G212 = [
("E1 record the argv baseline's version",
"""let BASE = null, baseWhy = '';
if(PAIR){
  if(BASEFILE && fs.existsSync(BASEFILE)){ const b = load(BASEFILE); if(+b.version === 211)""",
"""let BASE = null, baseWhy = '', ARGV_BASE_VER = null;
if(PAIR){
  if(BASEFILE && fs.existsSync(BASEFILE)){ const b = load(BASEFILE); ARGV_BASE_VER = +b.version; if(+b.version === 211)"""),
("E2 P1 keyed on the baseline source",
"""  pairRow('P1 run_pace_goal, NRC, bike and untimed swim goals byte-identical to V211 apart from the swim INT note (' + p1 + ' builds)', !!BASE && p1 >= 60 && p1bad.length === 0, BASE ? p1bad.join(' | ') : 'NO BASELINE');""",
"""  // V213 (standing ruling 4): P1 is the 212-vs-211 pair. A baseline that reads the candidate's own
  // version says the candidate is a later build before its bump (its ruled moves reach run_pace_goal
  // and NRC), so P1 SKIPs by name there. The other pair rows are untouched.
  if(PAIR && ARGV_BASE_VER === VER) skipRow('P1 scoped to the D110a build pair (212 vs 211): the baseline passed reads ' + ARGV_BASE_VER + ', the candidate\\'s own version, so this candidate is a later build before its bump');
  else
  pairRow('P1 run_pace_goal, NRC, bike and untimed swim goals byte-identical to V211 apart from the swim INT note (' + p1 + ' builds)', !!BASE && p1 >= 60 && p1bad.length === 0, BASE ? p1bad.join(' | ') : 'NO BASELINE');"""),
]

out = [apply('g208_d104a_runbase.js', GRB), apply('g212_d110a_swim.js', G212)]
for p, s in out:
    io.open(p, 'w', encoding='utf-8').write(s)
    print('WROTE', p)
