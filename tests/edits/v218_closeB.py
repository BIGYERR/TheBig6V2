#!/usr/bin/env python3
# V218 closeB — ruling-5 era rows for D157, tests only. Coach's comments copied verbatim.
# E1-E3 g199: [218] block (ARB, E6, HINGE, the file's order) directly after the [217] block.
# E4 g204: ruled MOVE. CLK_CALLS_BY_ERA's open row closes at 217 (its why text kept); the 218 row counts
#    16 _clkMS call sites (slice 2a routes three swim labels through the one clock owner).
# Guards: every anchor count==1; no [218] row exists yet. No version bump, no commit (brief).
import sys
G199 = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g199_deload_arbitration.js'
G204 = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g204_clock_limb.js'
a = open(G199, encoding='utf-8').read()
b = open(G204, encoding='utf-8').read()

ROWS199 = (
  "DELOAD_ARB_BY_VERSION[218] = DELOAD_ARB_BY_VERSION[217];   // D157: ruled UNMOVED (C1 364 C3 364 C5 32 D2 19 I3 496 printed; swim sizer length and labels, no lift section touched)\n"
  "E6_BY_VERSION[218] = E6_BY_VERSION[217];   // D157: ruled UNMOVED (28 printed)\n"
  "DELOAD_HINGE_BY_VERSION[218] = DELOAD_HINGE_BY_VERSION[217];   // D157: ruled UNMOVED (E1a 12384 E1b 9319 E3 44 G1 1290 G5 44 printed)\n")
A199 = "\nDELOAD_HINGE_BY_VERSION[217] = DELOAD_HINGE_BY_VERSION[216];"
OLD204 = "  { from: 207, to: Infinity, calls: 13, why: 'D106a (V207) test-card detail adds 2' },\n"
NEW204 = ("  { from: 207, to: 217,      calls: 13, why: 'D106a (V207) test-card detail adds 2' },\n"
          "  { from: 218, to: Infinity, calls: 16, why: 'D157 (V218) three swim labels read the total through _clkMS: pace line 2393, initial render 2817, sizer label 3330' },\n")

for t in ('DELOAD_ARB_BY_VERSION', 'E6_BY_VERSION', 'DELOAD_HINGE_BY_VERSION'):
    if a.count(t + '[218]') != 0:
        print('ABORT: %s[218] already exists' % t); sys.exit(2)
    if a.count('\n' + t + '[217] = ' + t + '[216];') != 1:
        print('ABORT: %s[217] sibling count %d' % (t, a.count('\n' + t + '[217] = ' + t + '[216];'))); sys.exit(2)
if a.count(A199) != 1:
    print('ABORT: E1-E3 anchor count %d' % a.count(A199)); sys.exit(2)
if b.count('from: 218') != 0 or b.count(OLD204) != 1:
    print('ABORT: E4 anchor count %d / from: 218 count %d' % (b.count(OLD204), b.count('from: 218'))); sys.exit(2)

i = a.index(A199) + 1
eol = a.index('\n', i)
a = a[:eol + 1] + ROWS199 + a[eol + 1:]
print('applied E1-E3 after: %s...' % a[i:i + 64])
b = b.replace(OLD204, NEW204, 1)
print('applied E4')
for t in ('DELOAD_ARB_BY_VERSION', 'E6_BY_VERSION', 'DELOAD_HINGE_BY_VERSION'):
    if a.count(t + '[218]') != 1:
        print('ABORT: post-condition %s' % t); sys.exit(3)
if b.count('from: 218, to: Infinity, calls: 16') != 1 or b.count('to: Infinity') != 1:
    print('ABORT: post-condition g204'); sys.exit(3)
open(G199, 'w', encoding='utf-8').write(a)
open(G204, 'w', encoding='utf-8').write(b)
print('written')
