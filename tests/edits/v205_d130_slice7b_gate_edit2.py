#!/usr/bin/env python3
# V205 slice 7b, follow-on: P2's LABEL still said "collision-free" after its oracle was
# re-keyed to untolerated-zero. A row whose printed claim and whose predicate disagree is
# the exact failure mode this slice exists to remove, so the label moves with the oracle.
import io, os, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g205_d125_ceiling.js'
OLD = "ok('P2 the engine deals four runs exactly where an exhaustive collision-free four-run layout exists, and three where it does not (64 calendars)',"
NEW = "ok('P2 the engine deals four runs exactly where an exhaustive search reaches ZERO UNTOLERATED adjacency at four, and three where it cannot (64 calendars)',"
s = io.open(P, encoding='utf-8').read()
n = s.count(OLD)
print('anchor P2 label count=%d' % n)
if n != 1:
    sys.stderr.write('ABORTED, nothing written\n'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(s.replace(OLD, NEW, 1))
print('WROTE ' + P)
