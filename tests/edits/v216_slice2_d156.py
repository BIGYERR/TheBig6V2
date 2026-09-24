#!/usr/bin/env python3
# V216 slice 2 — D156 (coach): `_longDay` on the loaded full-body day is a CLASS, the day carries the
# long run. NSW run cards carry no /^Long Run/ subtype; they say so on the dose (key 'long'), the same
# contract _longRunTier reads (D140). So _longDay is also true when c.dose && c.dose.key === 'long'.
# The NRC /^Long Run/, bike /^Long Ride/ and swim /^Long Slow Distance/ subtype tests are kept.
# run_base's key-long "Easy Run" belongs in (coach). The shape is the one measure's counterfactual
# (tests/measure/v216_d156_longday.js, CF copy) measured, byte for byte in the predicate.
# One edit. No ia-version bump (Mario owns the bump). Anchor asserted count==1 before any write.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

OLD = ("        const _c=opts.cardio;\n"
       "        const _longDay=!!(_c&&_c.subtype&&(\n")
NEW = ("        const _c=opts.cardio;\n"
       "        // V216 (D156): the long day is a CLASS, the day that carries the long run. An NSW run card\n"
       "        // has no Long Run subtype; it says so on its dose (key 'long'), the contract _longRunTier\n"
       "        // reads. NRC, bike and swim keep their subtype tests below.\n"
       "        const _longDay=!!(_c&&_c.dose&&_c.dose.key==='long')||!!(_c&&_c.subtype&&(\n")
n = src.count(OLD)
if n != 1:
    print('ABORT: anchor D156 count=%d' % n); sys.exit(1)
# the three kept subtype tests must still sit under it, untouched
KEEP = ("          (_c.type==='run'&&/^Long Run/.test(_c.subtype))||\n"
        "          (_c.type==='bike'&&/^Long Ride/.test(_c.subtype))||\n"
        "          (_c.type==='swim'&&/^Long Slow Distance/.test(_c.subtype))));\n")
if src.count(OLD + KEEP) != 1:
    print('ABORT: the kept subtype tests are not directly under the anchor'); sys.exit(1)
src = src.replace(OLD, NEW, 1)
if src.count("const _longDay=!!(_c&&_c.dose&&_c.dose.key==='long')||!!(_c&&_c.subtype&&(") != 1:
    print('ABORT: post-condition'); sys.exit(1)
open(PATH, 'w', encoding='utf-8').write(src)
print('OK: 1 edit written (D156 _longDay key test). No version bump.')
