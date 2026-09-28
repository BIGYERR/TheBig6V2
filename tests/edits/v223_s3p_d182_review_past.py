#!/usr/bin/env python3
# V223 slice S3' of D182 (P-RACEDATE), per D182 AMENDMENT (a) Q3
# (tests/measure/v223_rulings/p_racedate_ruling.md):
#   E2'  D182-parse   Wizard review row past the race: PRINT "(behind you)". E2's expression becomes
#                     return !w ? '' : cd.days<=0 ? ' ('+w.copy+')' : ' ('+w.card+' away)';
#                     giving "(13 weeks away)", "(6 days away)", "(race day)", "(behind you)".
#                     The E2 comment is made true of the new expression; nothing else on the line moves.
# S3's E4 stays PARKED (not touched here). No ia-version bump (stays 222).
# The anchor is asserted count==1 before anything is written; a miss aborts and nothing is written.
# Usage: v223_s3p_d182_review_past.py [target.html]
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

if '<meta name="ia-version" content="222">' not in src:
    print('ABORT: ia-version is not 222; nothing written'); sys.exit(1)
for tok in ('function raceCountdown(raceIso, todayIso){', 'function raceCountdownWords(cd){'):
    if src.count(tok) != 1:
        print('ABORT: precondition %r not found exactly once; nothing written' % tok); sys.exit(1)

OLD = ("/* D182 (V223): the number is raceCountdown's, so this row and the card cannot drift; "
       "past the race, no phrase */ const cd=raceCountdown(WD.raceDate), w=raceCountdownWords(cd); "
       "return !w||cd.days<0 ? '' : cd.days===0 ? ' ('+w.copy+')' : ' ('+w.card+' away)'; })()")
NEW = ("/* D182 (V223): the number is raceCountdown's, so this row and the card cannot drift; "
       "past the race, \"behind you\" */ const cd=raceCountdown(WD.raceDate), w=raceCountdownWords(cd); "
       "return !w ? '' : cd.days<=0 ? ' ('+w.copy+')' : ' ('+w.card+' away)'; })()")

n = src.count(OLD)
print("E2' anchor count:", n)
if n != 1:
    print("ABORT: E2' anchor count %d != 1; nothing written" % n); sys.exit(1)
out = src.replace(OLD, NEW, 1)
open(PATH, 'w', encoding='utf-8').write(out)
print("WROTE", PATH)
