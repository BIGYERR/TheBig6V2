# V193 slice 2 of 3 — D46-a, correction pass on the same seam (does NOT touch ia-version).
#
# v193_d46a_edit.py passed the own-turn counter as rot()'s OFFSET argument. rot() is
#   rot=(arr,n)=>arr[(R-1+n) % len]
# so the effective index stayed R-1+T — still a function of the GLOBAL R, which is exactly
# what the ruling says the index must stop being. Measured consequence: on the gear-gated
# 6-member tiers (minimal, home_basic) the hot-tomorrow index became 3T-1 mod 6, gcd(3,6)=3,
# so reachable members went 6 -> 4. The slice must not shrink reachability.
#
# Correction: give rot an explicit CLOCK. rot(arr,n) keeps its exact old behaviour as
# rotOn(R,arr,n) — every existing caller is byte-equivalent — and the rotational_power draws
# run on their own clock, so the index is 2T-1 / 2T. That is the SAME shape the code already
# used (clock and offset are the same value, as in rot(arr,R) / rot(arr,R+1)), with the
# pillar's own turn counter substituted for R. Stride 2 on an odd base covers all 7 members;
# on the gated 6-member pillar it covers all 6 in three turns.
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

# --- 1. rot gains an explicit clock; rot() itself is unchanged for every existing caller ---
old1 = """  const rot = (arr,n)=>arr[(((R-1+n)%arr.length)+arr.length)%arr.length];"""
new1 = """  // V193 (D46): rotOn takes the rotation CLOCK explicitly. rot() is the same function it
  // always was — clock R — so every caller below reads identically. A pillar that only turns
  // on some steps of R passes its OWN turn count instead, which is the whole D46 fix: the
  // index must count the pillar's turns, not the global step.
  const rotOn = (clock,arr,n)=>arr[(((clock-1+n)%arr.length)+arr.length)%arr.length];
  const rot = (arr,n)=>rotOn(R,arr,n);"""
rep(old1, new1, 'rot gains an explicit clock (rotOn)')

# --- 2. hot-tomorrow branch runs on the branch's own clock -----------------------------
old2 = """    const T2 = Math.floor(R/2);
    items = [rot(_pi(pillar), T2), rot(_pi(pillar), T2+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);"""
new2 = """    const T2 = Math.floor(R/2);
    items = [rotOn(T2,_pi(pillar),T2), rotOn(T2,_pi(pillar),T2+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);"""
rep(old2, new2, 'hot-tomorrow pair runs on T2')

# --- 3. clear-runway rotational_power runs on its own clock ----------------------------
old3 = """        : [rot(_pi(key), T3), rot(_pi(key), T3+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);"""
new3 = """        : [rotOn(T3,_pi(key),T3), rotOn(T3,_pi(key),T3+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);"""
rep(old3, new3, 'clear-runway pair runs on T3')

assert s != orig
io.open(P, 'w', encoding='utf-8').write(s)
print('WROTE %s  (+%d bytes)' % (P, len(s)-len(orig)))
