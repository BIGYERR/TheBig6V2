#!/usr/bin/env python3
# V198 tooling slice E (tests only; index.html untouched, ia-version stays 198).
# Adds a third hand-built probe to the E3a family in tests/gates/g197c_d84_cmp.js:
# {Back squat, Leg extension} must read posterior-FREE. Fails if E_POSTERIOR is
# widened back to include leg_iso. Engine-free, lattice-free, same idiom as E3a1/E3a2.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g197c_d84_cmp.js'
src = io.open(P, encoding='utf-8').read()

REPL = []

OLD1 = """  ok('E3a detector probe: adding a Nordic makes the same card read as posterior-covered', !zero(seeing));
}
"""
NEW1 = """  ok('E3a detector probe: adding a Nordic makes the same card read as posterior-covered', !zero(seeing));
  // E3a lens probe (V198 tooling slice E). The ONLY assertion of the shipped lens that
  // exists. index.html:9523 (D85, V198) tests {hinge, hip_ext} and excludes leg_iso in
  // terms: EXLIB.leg_accessory holds 'Leg extension' and 'Leg press' beside 'Lying leg
  // curl', so leg_iso is a SLOT, not a muscle, and a quad movement is not a posterior
  // signal (Mario, V198 ruling). Why a hand card and not a sweep: gatekeeper's full
  // lattice probe read 2879 leg cells, 31 naming leg_iso, and all 31 ALSO named
  // hinge/hip_ext — 0 cells can distinguish the narrow lens from the wide one, so no
  // lattice sweep and no app mutation can ever red a widening. This line can.
  const lens = { labels:['Leg isolation'], names:['Back squat','Leg extension'], items:[] };
  ok('E3a lens probe: a card with squat + leg extension reads as posterior-free (leg_iso is a slot, not a muscle)',
     zero(lens));
}
"""
REPL.append((OLD1, NEW1))

for old, new in REPL:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor count=%d (expected 1) for:\n%s\n' % (n, old[:120]))
        sys.exit(1)
    src = src.replace(old, new, 1)

io.open(P, 'w', encoding='utf-8').write(src)
print('OK wrote ' + P)
