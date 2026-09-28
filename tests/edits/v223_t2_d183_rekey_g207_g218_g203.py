#!/usr/bin/env python3
# V223 build 3, D183 gate slice G2: re-key three existing gates to D183 (P-SAFEPACE).
# Ruling: tests/measure/v223_rulings/p_safepace_ruling.md, R3 card table, D183 AMENDMENT 2 (d) swim line
# "<time> is <pace> per 100 <unit>." and (e) the _mileEntryState strings, D183 AMENDMENT 3 colours/glyphs.
# Plan: scratchpad/builder/d183_plan_v2.md "## D183 gate slice(s)", G2 (the three gate files only; the
# v207_d106a.json M18/M19 sabotage re-key is a separate slice).
#
# Standing rulings 2 and 4: every re-key is an era split on ia-version. The old-direction rows keep their
# text and are licensed at ia-version <= 222 (their era); they do not run above it. The D183 rows run at
# >= 223. IA_ASSUME_VERSION=223 lifts a file stamped exactly 222 (the g223_d182_racedate.js convention),
# announced, ignored on any other stamp.
#   g207_test_calendar   C4a..C4f: D106a era (A4 sentence, red card) vs D183 era (R3 card copy, colour).
#   g218_d157_swim_sizer expTxt (feeds LB2, OT1): D157 era "<t> — <pace>/100 (<unit>)" vs D183 era
#                        "<t> is <pace> per 100 <unit>.". LB1 is twin vs twin and has no era.
#   g203_mile_pencil     MSG_UNDER_3 / MSG_OVER_25: V176 (D9) strings vs D183 amendment 2 (e) strings. This
#                        extends the D182 split already in the file (v223_t1_d182_g203_rekey.py): both splits
#                        now read one lifted version, eraV, which is where IA_ASSUME_VERSION is honoured.
#
# Every anchor is asserted count==1 against the in-memory text before it is replaced; all three files are
# edited in memory and checked before any is written; the first miss aborts with nothing written.
# Literal bytes only; the one JS backslash (the newline escape already in g203's summary line) is built with chr(92).
import sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'
BS = chr(92)
DASH_RE = '/[-' + chr(0x2010) + '-' + chr(0x2015) + ']/'   # used only to CHECK the typed regex below

FILES = {}

# ── g207_test_calendar ───────────────────────────────────────────────────────────────────────────
G207 = [
('''// VERSION PREDICATE (standing ruling 4). D106a ships on ia-version 207. Below 207 every row is
// NOT APPLICABLE and skipped, never a bare PASS.
''', '''// VERSION PREDICATE (standing ruling 4). D106a ships on ia-version 207. Below 207 every row is
// NOT APPLICABLE and skipped, never a bare PASS.
//
// SECOND PREDICATE, the C4 copy rows (re-keyed V223 for D183 P-SAFEPACE R3 and amendments 2 and 3,
// tests/measure/v223_rulings/p_safepace_ruling.md; tests/edits/v223_t2_d183_rekey_g207_g218_g203.py).
// Standing rulings 2 and 4: the D106a C4 rows are licensed at ia-version <= 222 (their era) and do
// not run above it; the D183 C4 rows run at >= 223 and assert R3's card copy and colour, typed from
// the ruling. C4d derives its test week by hand (Monday weeks, the D25 start snap, rest sun/wed).
// IA_ASSUME_VERSION=223 lifts a file stamped exactly 222 to 223 for a discrimination run; it is
// announced, ignored on any other stamp, and gate.sh never sets it.
'''),
('''const D106A_ERA = 207;
''', '''const D106A_ERA = 207;
const D183_ERA = 223;
const ERA_V = (process.env.IA_ASSUME_VERSION === String(D183_ERA) && VER === D183_ERA - 1) ? D183_ERA : VER;
if(ERA_V !== VER) console.log('ASSUMED ia-version ' + ERA_V + ' on a file stamped ' + VER + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
'''),
('''{
  const h5 = feedback(wdPace({startDate:S_ISO, raceDate:R_ISO}));
''', '''const C4_ERA = ERA_V >= D183_ERA
  ? 'D183 era (ia-version ' + ERA_V + ' >= ' + D183_ERA + '): R3 card copy and colour'
  : 'D106a era (ia-version ' + ERA_V + ' <= ' + (D183_ERA - 1) + '): A4 sentence and the red card';
console.log('# C4 rows: ' + C4_ERA);
if(ERA_V < D183_ERA){
  const h5 = feedback(wdPace({startDate:S_ISO, raceDate:R_ISO}));
'''),
('''hr.includes(RED));
}
summary();
''', '''hr.includes(RED));
} else {
  console.log('  n/a  the D106a C4 rows are licensed at ia-version <= ' + (D183_ERA - 1) + ' only; ia-version ' + ERA_V + ' runs the D183 C4 rows in their place');
  // R3's card sentences, typed from the ruling (never read from the app).
  const T_W5 = 'Your test is in week 5. The program ends on it. The taper lands in front of it.';
  const T_TW1 = 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.';
  const T_NULL = 'Your test is before your first training day. This program starts after it and does not include it.';
  const T_WK = n => 'Your test is in week ' + n + '. The program ends on it. The taper lands in front of it.';
  const NT_1WK = 'Less than a week away. Not enough time to train.';
  const h5 = feedback(wdPace({startDate:S_ISO, raceDate:R_ISO}));
  ok('C4a D183 era, test in week 5 (start ' + S_ISO + ', test ' + R_ISO + '): the R3 sentence verbatim, and "stays intact" is gone',
     h5.includes(T_W5) && !h5.includes(INTACT), h5.slice(0, 200));
  const s1 = iso(addDays(S, 7)), t1 = iso(addDays(S, 10));   // test on the Thursday of the start week
  const h1 = feedback(wdPace({startDate:s1, raceDate:t1}));
  ok('C4b D183 era, test in the start week (start ' + s1 + ', test ' + t1 + '): the R3 tw 1 sentence verbatim', h1.includes(T_TW1), h1.slice(0, 200));
  const bs = iso(addDays(S, 35));
  const hb = feedback(wdPace({startDate:bs, raceDate:R_ISO}));
  ok('C4c D183 era, test before the start (start ' + bs + ', test ' + R_ISO + '): the --signal null row verbatim, neither "stays intact" nor "Your test is in week"',
     hb.includes('var(--signal)') && hb.includes(T_NULL) && !hb.includes(INTACT) && !hb.includes('Your test is in week'), hb.slice(0, 200));
  // The test week by hand: week 1 is the Monday week holding the start; a start whose remaining days of
  // that week are all rest (sun/wed here) snaps to the next Monday (D25). The test is today + 3.
  const ISO7 = ['mon','tue','wed','thu','fri','sat','sun'], REST = ['sun','wed'];
  const soonD = addDays(TODAY, 3), soon = iso(soonD);
  const off = (TODAY.getDay() + 6) % 7;                                   // 0 Mon .. 6 Sun
  const snapped = off > 0 && ISO7.slice(off).filter(k => !REST.includes(k)).length === 0;
  const startMon = addDays(TODAY, snapped ? 7 - off : -off);
  const testMon = addDays(soonD, -((soonD.getDay() + 6) % 7));
  const twHand = Math.round((testMon - startMon) / 86400000) / 7 + 1;
  const T_D = twHand === 1 ? T_TW1 : T_WK(twHand);
  const hr = feedback(wdPace({startDate:iso(TODAY), raceDate:soon}));
  ok('C4d D183 era, test goal under a week out (start ' + iso(TODAY) + ', test ' + soon + ', week ' + twHand + ' by hand' + (snapped ? ', D25 start snap to ' + iso(startMon) : '') + '): the matching R3 sentence verbatim, and never red',
     (twHand === 1 || twHand === 2) && hr.includes(T_D) && !hr.includes('var(--red)'), hr.slice(0, 200));
  const hn = feedback(wdPace({startDate:iso(TODAY), raceDate:soon, cardioGoals:{run:{id:'run_5k', label:'5K'}}}));
  ok('C4e D183 era, NRC 5K under a week out: the R3 sentence verbatim, and not the dashed text', hn.includes(NT_1WK) && !hn.includes(RED_OLD), hn.slice(0, 200));
  const NEW = [T_W5, T_TW1, T_NULL, T_WK(2), NT_1WK];
  ok('C4f D183 era, no dash in any typed sentence, and each renders on its case',
     !NEW.some(s => /[-‐-―]/.test(s)) && h5.includes(T_W5) && h1.includes(T_TW1) && hb.includes(T_NULL) && hr.includes(T_D) && hn.includes(NT_1WK));
}
summary();
'''),
]

# ── g218_d157_swim_sizer ─────────────────────────────────────────────────────────────────────────
G218 = [
('''//   LB2  HAND m:ss oracle (the gate's own formatter, never _clkMS): each twin's pace line and initial render read
//        "<m:ss total> — <m:ss total*100/dist>/100 (<unit>)"; its sizer warning carries " (<m:ss total>/<dist><unit>) needs ".
''', '''//   LB2  HAND m:ss oracle (the gate's own formatter, never _clkMS): each twin's pace line and initial render read,
//        by era (standing rulings 2 and 4): at ia-version <= 222 (D157, their era) "<m:ss total> — <m:ss total*100/dist>/100 (<unit>)";
//        at >= 223 (D183 P-SAFEPACE amendment 2 (d)) "<m:ss total> is <m:ss total*100/dist> per 100 <unit>.". Its sizer
//        warning carries " (<m:ss total>/<dist><unit>) needs " in both eras. OT1 reads the same era's text; LB1 is twin
//        against twin and has no era. IA_ASSUME_VERSION=223 lifts a file stamped exactly 222 to 223 for a
//        discrimination run; it is announced, ignored on any other stamp, and gate.sh never sets it.
'''),
('''const VER = +C.version, ERA = 218, V217_COMMIT = '7af6ad9d46f17e216e26901f3e0812797171fa9f';
''', '''const VER = +C.version, ERA = 218, V217_COMMIT = '7af6ad9d46f17e216e26901f3e0812797171fa9f';
const D183_ERA = 223, ERA_V = (process.env.IA_ASSUME_VERSION === String(D183_ERA) && VER === D183_ERA - 1) ? D183_ERA : VER;
if(ERA_V !== VER) console.log('ASSUMED ia-version ' + ERA_V + ' on a file stamped ' + VER + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
'''),
('''  const expTxt = (t, goal, unit) => hand(t) + ' — ' + hand(t * 100 / DIST[goal]) + '/100 (' + unit + ')';
''', '''  // the pace line text, one shape per era (standing rulings 2 and 4): D157's at ia-version <= 222 (their era),
  // D183's (P-SAFEPACE amendment 2 (d), "<time> is <pace> per 100 <unit>.") at >= 223
  const LB_ERA = ERA_V >= D183_ERA ? 'D183 era (ia-version ' + ERA_V + ' >= ' + D183_ERA + '): "<t> is <pace> per 100 <unit>."'
    : 'D157 era (ia-version ' + ERA_V + ' <= ' + (D183_ERA - 1) + '): "<t> — <pace>/100 (<unit>)"';
  const expTxt = ERA_V >= D183_ERA
    ? (t, goal, unit) => hand(t) + ' is ' + hand(t * 100 / DIST[goal]) + ' per 100 ' + unit + '.'
    : (t, goal, unit) => hand(t) + ' — ' + hand(t * 100 / DIST[goal]) + '/100 (' + unit + ')';
  console.log('  pace line text: ' + LB_ERA);
'''),
('''read hand(total) and hand(pace)/100' + (K.ex.length''', '''read hand(total) and hand(pace), ' + LB_ERA + (K.ex.length'''),
]

# ── g203_mile_pencil ─────────────────────────────────────────────────────────────────────────────
G203 = [
('''//   * the six mile-validation strings are the V176 (D9) literals, retyped here.
//     D116 reuses the wizard's validator; if anyone rewords one, this trips.
''', '''//   * the mile-validation strings are typed here, one pair per era: the V176 (D9)
//     literals at ia-version <= 222, D183's (P-SAFEPACE amendment 2 (e)) at >= 223.
//     D116 reuses the wizard's validator; if anyone rewords one, this trips.
'''),
('''// run above it; the D182 rows run at >= 223. The summary names the era that ran.
''', '''// run above it; the D182 rows run at >= 223. The summary names the era that ran.
// The same predicate keys section 6's two refusal strings (re-keyed V223 for D183 P-SAFEPACE
// amendment 2 (e), tests/edits/v223_t2_d183_rekey_g207_g218_g203.py): the V176 (D9) strings at
// ia-version <= 222 (their era), D183's at >= 223. Both splits read one version, eraV:
// IA_ASSUME_VERSION=223 lifts a file stamped exactly 222 to 223 for a discrimination run; it is
// announced, ignored on any other stamp, and gate.sh never sets it.
'''),
("""// V176 (D9) literals. Retyped; the app must still carry these exact strings.
const MSG_UNDER_3 = '""", """// The mile validator's two refusal strings, one pair per era (the predicate is eraV, section 0).
// V176 (D9) literals, licensed at ia-version <= 222 (their era). Retyped.
const MSG_UNDER_3_D9 = '"""),
('''const MSG_OVER_25 = 'Over 25:00''', '''const MSG_OVER_25_D9 = 'Over 25:00'''),
('''instead.';

// D116 lock predicate, hand table''', '''instead.';
// D183 (P-SAFEPACE amendment 2 (e), tests/measure/v223_rulings/p_safepace_ruling.md) at ia-version >= 223. Typed from the ruling.
const MSG_UNDER_3_D183 = 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.';
const MSG_OVER_25_D183 = 'Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.';

// D116 lock predicate, hand table'''),
('''const artifactV = +IA.version;
''', '''const artifactV = +IA.version;
// ERA PREDICATE for the re-keyed rows (standing rulings 2 and 4): section 3's D182 race-date rows and
// section 6's D183 refusal strings read one version, eraV. IA_ASSUME_VERSION=223 lifts a file stamped
// exactly 222 to 223 for a discrimination run; it is announced and ignored on any other stamp. The D116
// predicate and the era-row digest read the stamp, never eraV.
const REKEY_ASSUME = 223;
const eraV = (process.env.IA_ASSUME_VERSION === String(REKEY_ASSUME) && artifactV === REKEY_ASSUME - 1) ? REKEY_ASSUME : artifactV;
if(eraV !== artifactV) console.log('ASSUMED ia-version ' + eraV + ' on a file stamped ' + artifactV + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
const D183_ERA = 223;
const MILE_MSG_TAG = eraV >= D183_ERA ? 'D183' : 'D9';
const MILE_MSG_ERA = eraV >= D183_ERA
  ? 'D183 era (ia-version ' + eraV + ' >= ' + D183_ERA + '): P-SAFEPACE amendment 2 (e) strings'
  : 'D9 era (ia-version ' + eraV + ' <= ' + (D183_ERA - 1) + '): V176 (D9) strings';
const MSG_UNDER_3 = eraV >= D183_ERA ? MSG_UNDER_3_D183 : MSG_UNDER_3_D9;
const MSG_OVER_25 = eraV >= D183_ERA ? MSG_OVER_25_D183 : MSG_OVER_25_D9;
'''),
('''const RACEDATE_ERA = artifactV >= D182_ERA
  ? 'D182 era (ia-version ' + artifactV + ' >= ' + D182_ERA + '): hand y/m/d oracle, weekday date, local-parse Days out'
  : 'pre-D182 era (ia-version ' + artifactV + ' <= ' + (D182_ERA - 1) + '): UTC-parse oracle, bare month/day/year';
if(artifactV < D182_ERA){
''', '''const RACEDATE_ERA = eraV >= D182_ERA
  ? 'D182 era (ia-version ' + eraV + ' >= ' + D182_ERA + '): hand y/m/d oracle, weekday date, local-parse Days out'
  : 'pre-D182 era (ia-version ' + eraV + ' <= ' + (D182_ERA - 1) + '): UTC-parse oracle, bare month/day/year';
if(eraV < D182_ERA){
'''),
('''only; ia-version ' + artifactV + ' runs the D182 rows in their place');''',
 '''only; ia-version ' + eraV + ' runs the D182 rows in their place');'''),
('''eq('2:30 uses the D9 under-3:00 string', toasts[0], MSG_UNDER_3);''',
 '''eq('2:30 uses the ' + MILE_MSG_TAG + ' under-3:00 string', toasts[0], MSG_UNDER_3);'''),
('''eq('26:00 uses the D9 over-25:00 string', toasts[0], MSG_OVER_25);''',
 '''eq('26:00 uses the ' + MILE_MSG_TAG + ' over-25:00 string', toasts[0], MSG_OVER_25);'''),
("console.log('" + BS + """nERA race-date rows: ' + RACEDATE_ERA);
""",
 "console.log('" + BS + """nERA race-date rows: ' + RACEDATE_ERA);
console.log('ERA mile validator strings: ' + MILE_MSG_ERA);
"""),
]

PLAN = [('g207_test_calendar.js', G207), ('g218_d157_swim_sizer.js', G218), ('g203_mile_pencil.js', G203)]

out = {}
for name, reps in PLAN:
    p = ROOT + name
    src = open(p, encoding='utf-8').read()
    if 'D183_ERA' in src:
        sys.exit('ABORT: ' + name + ' already carries D183_ERA; nothing written')
    cur = src
    for i, (old, new) in enumerate(reps, 1):
        n = cur.count(old)
        if n != 1:
            sys.exit('ABORT: ' + name + ' anchor ' + str(i) + ' count ' + str(n) + ' (want 1); nothing written: ' + repr(old[:90]))
        cur = cur.replace(old, new, 1)
        print('ok   ' + name + ' anchor ' + str(i) + ' count 1')
    out[p] = cur

# post-checks before any write
g207 = out[ROOT + 'g207_test_calendar.js']
if DASH_RE not in g207.split('} else {')[-1]:
    sys.exit('ABORT: g207 D183 C4f dash regex is not the U+2010..U+2015 class; nothing written')
for p, s in out.items():
    if s.count(BS) != open(p, encoding='utf-8').read().count(BS):
        sys.exit('ABORT: backslash count changed in ' + p + '; nothing written')

for p, s in out.items():
    open(p, 'w', encoding='utf-8').write(s)
    print('wrote ' + p)
