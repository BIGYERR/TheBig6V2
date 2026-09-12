# V193 slice 2 of 3 — D46-a: rotational_power rotation index counts the pillar's OWN turns.
# ia-version is ALREADY 193 (slice 1). This script must NOT touch the meta tag.
#
# Root cause (measured, pre-D46 artifact): getDynamicCoreBlock selects rotational_power on a
# PARITY of R and then indexes with R. rot(arr,n) reads arr[(R-1+n) % len], so passing R gives
# index 2R-1. In the hot-tomorrow branch the pillar is only live on even R, so 2R-1 mod 4 was
# the CONSTANT 3 and the pair was frozen: Landmine rotations + Windshield wipers at R=2,4,6,8,
# 10,12 on every tier. home_basic reached 2 distinct members across 2,335 core blocks and
# 'Cable woodchoppers' printed 0 times on commercial across 2,317 blocks.
#
# Fix: index each pillar by its OWN turn counter, derived from R (no new constant).
#   hot-tomorrow  : pillars alternate on R%2  -> own turn counter Math.floor(R/2)
#                   (even R -> R/2 for rotational_power; odd R -> (R-1)/2 for anti_rotation;
#                    one expression is the correct counter for both)
#   clear-runway  : key = [...][((R-1)%3+3)%3] -> own turn counter Math.floor((R-1)/3)
#                   (rotational_power is the index-2 slot, live when (R-1)%3===2, i.e. R%3===0;
#                    floor((R-1)/3) increments by exactly 1 on each such R. Verified against
#                    the selection expression in source, not assumed.)
#   and the surviving _pi(key).slice(0,2) on the clear-runway rotational_power path becomes the
#   same rot(...) dedup pair form V178 D6 gave dynamic_bracing (shape copied verbatim).
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
s = io.open(P, encoding='utf-8').read()
orig = s

def rep(old, new, label):
    global s
    n = s.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d (expected 1)\n' % (label, n))
        sys.exit(1)
    s = s.replace(old, new, 1)
    print('ok  %s' % label)

# --- 1. hot-tomorrow branch: index by the branch's own turn counter -------------------
old1 = """    items = [rot(_pi(pillar), R), rot(_pi(pillar), R+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);"""
new1 = """    // V193 (D46): was rot(...,R) — but this branch alternates its two pillars on R%2, so each
    // pillar only turns once per TWO steps of R. rot() reads arr[(R-1+n)%len], so n=R made the
    // index 2R-1 and rotational_power (live on even R only) froze at 2R-1 mod 4 === 3 forever:
    // Landmine rotations + Windshield wipers, every tier, all 14 weeks. Index by the pillar's
    // OWN turn count instead. Even R gives R/2, odd R gives (R-1)/2, so one expression is the
    // correct turn counter for whichever pillar this step selected.
    const T2 = Math.floor(R/2);
    items = [rot(_pi(pillar), T2), rot(_pi(pillar), T2+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);"""
rep(old1, new1, 'hot-tomorrow index -> own turn counter')

# --- 2 + 3. clear-runway branch: own turn counter AND kill the surviving slice(0,2) ----
old2 = """      pillar=key;
      items = (key==='dynamic_bracing')
        ? [rot(_pi('dynamic_bracing'), R), rot(_pi('dynamic_bracing'), R+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2)
        : _pi(key).slice(0,2);"""
new2 = """      pillar=key;
      // V193 (D46): key cycles three ways on ((R-1)%3), so rotational_power (the index-2 slot)
      // is live only when (R-1)%3===2. Its own turn counter is therefore Math.floor((R-1)/3),
      // which advances by exactly one per selection. The old ._pi(key).slice(0,2) was the last
      // survivor of the pattern V178 (D6) removed from the other pillars: the first two members,
      // every week, forever — so the members added in D46 could never be reached from here.
      // Same rotation + dedup shape dynamic_bracing already uses, one line below.
      const T3 = Math.floor((R-1)/3);
      items = (key==='dynamic_bracing')
        ? [rot(_pi('dynamic_bracing'), R), rot(_pi('dynamic_bracing'), R+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2)
        : [rot(_pi(key), T3), rot(_pi(key), T3+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);"""
rep(old2, new2, 'clear-runway index + slice(0,2) -> rot pair')

assert s != orig
io.open(P, 'w', encoding='utf-8').write(s)
print('WROTE %s  (+%d bytes)' % (P, len(s)-len(orig)))
