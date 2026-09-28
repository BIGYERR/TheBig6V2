#!/usr/bin/env python3
# V223 tooling slice T3/T4: re-key tests/gates/g203_mile_pencil.js for D182 (P-RACEDATE).
# Ruling: tests/measure/v223_rulings/p_racedate_ruling.md (i), (ii), amendment (a) Q2.
# g203's section 3 oracle parsed the fixture race date as UTC midnight (new Date(raceDate)) and
# printed the bare {month,day,year} string. D182 replaces both on the mile lock sheet: "Race day"
# prints the weekday date from a local parse, "Days out" is the day count while days >= 1,
# "Race day" at 0, "Behind you" below. On the D182 tree the old rows fail 96/2 (NY) and 97/1 (UTC).
# Standing rulings 2 and 4: the V203 rows keep their text and are licensed by a predicate on the
# artifact's ia-version (<= 222, their era); above 222 they do not run and the D182 rows run in
# their place, against a y/m/d hand oracle (Sakamoto weekday, typed month table, days from civil).
# The summary prints which era ran, on the line directly above PASS n FAIL n.
# Every anchor is asserted count==1 before anything is written; the first miss aborts the script.
# Literal bytes only; the JS backslash in the summary line is built with chr(92).
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g203_mile_pencil.js'
src = open(PATH, encoding='utf-8').read()
BS = chr(92)

if 'D182_ERA' in src:
    sys.exit('ABORT: g203 already carries D182_ERA; nothing written')

REPS = []

# 1. header: document the second predicate
REPS.append(('''// every D116 row fails on it, which is the proof that this predicate hides nothing.
''', '''// every D116 row fails on it, which is the proof that this predicate hides nothing.
//
// SECOND PREDICATE, the two race-date rows of section 3 (re-keyed V223 for D182 P-RACEDATE,
// tests/edits/v223_t1_d182_g203_rekey.py). D182 changed what the lock sheet's "Days out" and
// "Race day" rows print. The V203 rows are licensed at ia-version <= 222 (their era) and do not
// run above it; the D182 rows run at >= 223. The summary names the era that ran.
'''))

# 2. section 3 facts: two eras, each a predicate on ia-version
REPS.append(('''// facts block: days out computed HERE from the fixture race date
const raceDate = IA.fixtures.HALF_MANNY.raceDate;
const rd = new Date(raceDate); rd.setHours(0,0,0,0);
const t0 = new Date(); t0.setHours(0,0,0,0);
const wantDaysOut = String(Math.round((rd - t0) / MS_DAY));
const wantRaceStr = new Date(raceDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
ok('days out line = ' + wantDaysOut, lock.indexOf(wantDaysOut) >= 0, JSON.stringify(lock));
ok('race day line = ' + wantRaceStr, lock.indexOf(wantRaceStr) >= 0, JSON.stringify(lock));
''', '''// facts block. TWO ERAS, each licensed by a predicate on the artifact's ia-version (standing
// rulings 2 and 4):
//   pre-D182 (ia-version <= 222): the V203 rows, written when the sheet parsed the race date as
//     UTC midnight and printed a bare "Dec 6, 2026". Their oracle does the same parse because that
//     was the shipped behaviour of their era. Above 222 these two rows do not run.
//   D182 (ia-version >= 223, P-RACEDATE, tests/measure/v223_rulings/p_racedate_ruling.md (i), (ii)
//     and amendment (a) Q2): "Race day" prints the weekday date ("Sun, Dec 6, 2026") from a local
//     parse; "Days out" is the day count while days >= 1, "Race day" at 0, "Behind you" below. The
//     oracle is y/m/d integers only: weekday by Sakamoto's algorithm, month from a typed table, days
//     by days-from-civil. The host clock supplies today's local y/m/d and nothing else.
const raceDate = IA.fixtures.HALF_MANNY.raceDate;
const D182_ERA = 223;
const RACEDATE_ERA = artifactV >= D182_ERA
  ? 'D182 era (ia-version ' + artifactV + ' >= ' + D182_ERA + '): hand y/m/d oracle, weekday date, local-parse Days out'
  : 'pre-D182 era (ia-version ' + artifactV + ' <= ' + (D182_ERA - 1) + '): UTC-parse oracle, bare month/day/year';
if(artifactV < D182_ERA){
  const rd = new Date(raceDate); rd.setHours(0,0,0,0);
  const t0 = new Date(); t0.setHours(0,0,0,0);
  const wantDaysOut = String(Math.round((rd - t0) / MS_DAY));
  const wantRaceStr = new Date(raceDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  ok('pre-D182 era: days out line = ' + wantDaysOut, lock.indexOf(wantDaysOut) >= 0, JSON.stringify(lock));
  ok('pre-D182 era: race day line = ' + wantRaceStr, lock.indexOf(wantRaceStr) >= 0, JSON.stringify(lock));
} else {
  console.log('  n/a  the two pre-D182 race-date rows are licensed at ia-version <= ' + (D182_ERA - 1) + ' only; ia-version ' + artifactV + ' runs the D182 rows in their place');
  const WD3 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MON3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sakamoto = (y, m, d) => { const t = [0,3,2,5,0,3,5,1,4,6,2,4]; if(m < 3) y -= 1; return (y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) + t[m-1] + d) % 7; };
  const civ = (y, m, d) => { y -= m <= 2 ? 1 : 0; const era = Math.floor(y/400), yoe = y - era*400;
    const doy = Math.floor((153*(m + (m > 2 ? -3 : 9)) + 2)/5) + d - 1;
    return era*146097 + yoe*365 + Math.floor(yoe/4) - Math.floor(yoe/100) + doy - 719468; };
  const [ry, rm, rdd] = raceDate.split('-').map(Number);
  const now = new Date();
  const days = civ(ry, rm, rdd) - civ(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const wantDaysOut = days >= 1 ? String(days) : days === 0 ? 'Race day' : 'Behind you';
  const wantRaceStr = WD3[sakamoto(ry, rm, rdd)] + ', ' + MON3[rm - 1] + ' ' + rdd + ', ' + ry;
  ok('D182 era: days out line = ' + wantDaysOut + ' (' + days + ' days by hand)', lock[lock.indexOf('Days out') + 1] === wantDaysOut, JSON.stringify(lock));
  ok('D182 era: race day line = ' + wantRaceStr, lock[lock.lastIndexOf('Race day') + 1] === wantRaceStr, JSON.stringify(lock));
}
'''))

# 3. the final summary names the era that ran, on the line directly above PASS n FAIL n
REPS.append(("console.log('" + BS + "nPASS ' + pass + ' FAIL ' + fail);" + '''
process.exit(fail ? 1 : 0);''',
             "console.log('" + BS + "nERA race-date rows: ' + RACEDATE_ERA);" + '''
console.log('PASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);'''))

for i, (a, _) in enumerate(REPS, 1):
    n = src.count(a)
    print('anchor %d count: %d' % (i, n))
    if n != 1:
        sys.exit('ABORT: anchor %d count %d != 1; nothing written' % (i, n))
out = src
for a, b in REPS:
    out = out.replace(a, b, 1)
open(PATH, 'w', encoding='utf-8').write(out)
print('WROTE', PATH)
