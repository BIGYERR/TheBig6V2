#!/usr/bin/env python3
# V223 build 3, D184 (P-TESTLEN) Q1 and Q5: re-key three existing gates.
# Ruling: tests/measure/v223_rulings/p_testlen_d184_ruling.md (Q1 rows, Q5 G4 label).
#   g207_test_week       G4 re-keyed to the D184 pin (week 15 of 11 pins 15/15/15), label drops
#                        "(D138, out of scope)"; G4b (week 26 pins) and G4c (week 27, control) added.
#   g207_test_calendar   C3g (past test writes nothing), C3h (week 15 of 11 pins), C3i (V209 null
#                        shape, week 14, re-pins), C3j (null, week 28, control). C3d and the D183
#                        C4 era split are untouched.
#   g202_d108_touchset_freeze  the fixture is made undated; rows R1c/R2c keep their text.
# Every anchor is asserted count==1 against the progressively edited text of its file; every
# file is checked before any file is written; the first miss aborts the whole script.
# index.html is not touched.
import sys, os

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'

EDITS = {}

# ── g207_test_week.js ─────────────────────────────────────────────────────────────────
EDITS['g207_test_week.js'] = [
# 1. the G oracle comment: D184 hand weeks
(r"""//        raw field. The undated case runs on the SAME WD after the dated one, so a pin
//        that is only written when set would survive into it (the latch rule).
""",
r"""//        raw field. The undated case runs on the SAME WD after the dated one, so a pin
//        that is only written when set would survive into it (the latch rule).
//        D184 (P-TESTLEN, V223; tests/measure/v223_rulings/p_testlen_d184_ruling.md Q1, Q5)
//        re-keys G4 and adds G4b and G4c, with no licence predicate (the ruling keeps no row's
//        old direction): a dated test goal pins to its test week whenever that week is 1 to 26,
//        the rows of Table 6. Hand weeks from Mon 2026-09-21: Mon 2026-12-28 is week 15 (14
//        Mondays later), Mon 2027-03-15 is week 26 (25 Mondays later), Mon 2027-03-22 is week
//        27; both long spans cross the 2026-11-01 fall-back and the 2027-03-14 spring-forward.
//        G4 and G4b fail on V222, whose pin stopped at the 11-week goal length. G4c, week 27,
//        pins nothing on either version (a control) and runs right after G4b on the same WD,
//        so a 26 pin that survived into it would fail it.
"""),
# 2. the skip list below the D106a era
(r"""'G1','G2','G3','G4','G5','G6','G7'];""",
 r"""'G1','G2','G3','G4','G4b','G4c','G5','G6','G7'];"""),
# 3. G4 re-keyed, G4b and G4c added
(r"""    ['G4 test past the goal length (D138, out of scope)', {eventTargeted:true, raceDate:'2026-12-28'}, null, 11, '2026-09-21', null],
""",
r"""    ['G4 test past the goal length pins its test week (D184): Mon 2026-12-28 is week 15 of an 11-week goal', {eventTargeted:true, raceDate:'2026-12-28'}, 15, 15, '2026-09-21', 'Building your 15-week program...'],
    ['G4b boundary (D184): Mon 2027-03-15 is week 26, the last row of Table 6, and pins', {eventTargeted:true, raceDate:'2027-03-15'}, 26, 26, '2026-09-21', 'Building your 26-week program...'],
    ['G4c control (D184): Mon 2027-03-22 is week 27, past Table 6, pins nothing and keeps the 11-week goal length', {eventTargeted:true, raceDate:'2027-03-22'}, null, 11, '2026-09-21', 'Building your 11-week program...'],
"""),
]

# ── g207_test_calendar.js ─────────────────────────────────────────────────────────────
EDITS['g207_test_calendar.js'] = [
# 1. the C3 header
(r"""//   C3 one-time backfill in refreshProgram: a STORED dated test goal with no _testWeek key gets
//      one from its stored start (null when the test is past, before the start, or beyond the
//      goal length), persisted, so the key exists and it never runs again. Trained days stay
//      byte-identical through the per-day freeze.
""",
r"""//   C3 the backfill in refreshProgram (D106a; C3g to C3j re-keyed V223 for D184 P-TESTLEN,
//      tests/measure/v223_rulings/p_testlen_d184_ruling.md Q1): a STORED dated test goal whose
//      _testWeek is absent or null re-derives its test week from its stored start each boot
//      until it pins. It pins when the test is in weeks 1 to 26 (the rows of Table 6) and not
//      past, and persists both pins, so the key is numeric and it stops running. Otherwise it
//      writes nothing: the key stays as it was (absent or null) and the stored length stands.
//      Trained days stay byte-identical through the per-day freeze.
"""),
# 2. the D184 oracle bullet
(r"""//   * COPY: coach's strings verbatim, and no dash in either new sentence.
""",
r"""//   * COPY: coach's strings verbatim, and no dash in either new sentence.
//   * D184 ROWS, no licence predicate (the ruling keeps no row's old direction): C3g, C3h and C3i
//     fail on V222 and pass on V223; C3j and C3d are controls and pass on both. Weeks are Monday
//     arithmetic from S: S + 7(k - 1) days is week k, so S + 91 is week 14, S + 98 is week 15 and
//     S + 189 is week 28 (past Table 6's 26 rows). "Writes nothing" is proved against the
//     fixture's OWN stored cfg bytes in ia_programs, read before the refresh (canon, keys sorted).
"""),
# 3. the skip list below the D106a era
(r"""'C3g','C3h','C1a',""",
 r"""'C3g','C3h','C3i','C3j','C1a',"""),
# 4. C3g and C3h re-keyed, C3i and C3j added
(r"""  const pStart = iso(addDays(S, -42)), pTest = iso(addDays(S, -14));   // week 5 of that start, and in the past
  const P = stored(pace({raceDate:pTest, _raceDateCappedWeeks:11}), pStart, 'p_c3_past');
  const q = tryRefresh(P.V, P.read());
  ok('C3g a past test (start ' + pStart + ', test ' + pTest + ', week 5 but before today) writes the key null and keeps 11 weeks',
     !q.crash && own(q.cfg, '_testWeek') && q.cfg._testWeek === null && q.cfg._raceDateCappedWeeks === 11 && q.totalWeeks === 11 && P.read().cfg._testWeek === null,
     q.crash || JSON.stringify({tw: q.cfg._testWeek, cap: q.cfg._raceDateCappedWeeks, weeks: q.totalWeeks}));
  const far = iso(addDays(S, 7 * 14));   // week 15 > the 11-week goal length (D138)
  const F = stored(pace({raceDate:far, _raceDateCappedWeeks:11}), S_ISO, 'p_c3_far');
  const f = tryRefresh(F.V, F.read());
  ok('C3h a test beyond the goal length (' + far + ', week 15 of 11) writes the key null and keeps 11 weeks',
     !f.crash && own(f.cfg, '_testWeek') && f.cfg._testWeek === null && f.cfg._raceDateCappedWeeks === 11 && f.totalWeeks === 11,
     f.crash || JSON.stringify({tw: f.cfg._testWeek, cap: f.cfg._raceDateCappedWeeks, weeks: f.totalWeeks}));
""",
r"""  // D184 (P-TESTLEN, V223): the backfill writes nothing unless the test pins. cfgBytes is the
  // fixture's own stored cfg in ia_programs; read before the refresh, it is the "no write" oracle.
  const cfgBytes = X => canon(X.read().cfg);
  const DOW = ['sun','mon','tue','wed','thu','fri','sat'];   // Date.getDay() order
  const pStart = iso(addDays(S, -42)), pTest = iso(addDays(S, -14));   // week 5 of that start, and in the past
  const P = stored(pace({raceDate:pTest, _raceDateCappedWeeks:11}), pStart, 'p_c3_past');
  const pBytes = cfgBytes(P);
  const q = tryRefresh(P.V, P.read());
  ok('C3g a past test (start ' + pStart + ', test ' + pTest + ', week 5 but before today) writes nothing (D184): no _testWeek key in memory or in ia_programs, the stored cfg bytes unchanged, cap 11, 11 weeks',
     !q.crash && !own(q.cfg, '_testWeek') && !own(P.read().cfg, '_testWeek') && cfgBytes(P) === pBytes
       && q.cfg._raceDateCappedWeeks === 11 && q.totalWeeks === 11,
     q.crash || JSON.stringify({memKey: own(q.cfg, '_testWeek'), storeKey: own(P.read().cfg, '_testWeek'), tw: q.cfg._testWeek, cap: q.cfg._raceDateCappedWeeks, weeks: q.totalWeeks, bytesEqual: cfgBytes(P) === pBytes}));
  const farD = addDays(S, 7 * 14), far = iso(farD), farDay = DOW[farD.getDay()];   // week 15 of the 11-week goal
  const F = stored(pace({raceDate:far, _raceDateCappedWeeks:11}), S_ISO, 'p_c3_far');
  const f = tryRefresh(F.V, F.read());
  const fp = F.read().cfg, fDay = !f.crash && f.weeks && f.weeks[15] && f.weeks[15][farDay];
  ok('C3h a test past the goal length (' + far + ', week 15 of 11) pins it (D184): _testWeek 15, _raceDateCappedWeeks 15, 15 weeks, both persisted, and the trial sits in W15 on the test weekday (' + farDay + ')',
     !f.crash && f.cfg._testWeek === 15 && f.cfg._raceDateCappedWeeks === 15 && f.totalWeeks === 15
       && fp._testWeek === 15 && fp._raceDateCappedWeeks === 15 && isTrial(fDay && fDay.cardio),
     f.crash || JSON.stringify({tw: f.cfg._testWeek, cap: f.cfg._raceDateCappedWeeks, weeks: f.totalWeeks, persisted: [fp._testWeek, fp._raceDateCappedWeeks], w15: fDay && fDay.cardio && fDay.cardio.subtype}));
  // C3i: the population the D184 backfill exists for, the V209 shape the ruling names (_testWeek
  // stored null because the old gate stopped at the goal length; the test in week 14 of 11, M8 S3's
  // example). It re-pins and persists, and the trained W1 Mon holds through the re-pin.
  const i14 = iso(addDays(S, 7 * 13));
  const I = stored(pace({raceDate:i14, _testWeek:null, _raceDateCappedWeeks:11}), S_ISO, 'p_c3_v209');
  const ii = tryRefresh(I.V, I.read());
  const ip = I.read().cfg, iW1 = !ii.crash && ii.weeks && ii.weeks[1] && ii.weeks[1].mon;
  const iFresh = I.V.buildProgram(clone(pace({raceDate:i14, _testWeek:14, _raceDateCappedWeeks:14})));
  ok('C3i the V209 shape (_testWeek null, test ' + i14 + ', week 14 of 11) re-pins (D184): _testWeek 14, _raceDateCappedWeeks 14, 14 weeks, both persisted, and the trained W1 Mon is byte-identical to the sentinel (a fresh build of it differs)',
     !ii.crash && ii.cfg._testWeek === 14 && ii.cfg._raceDateCappedWeeks === 14 && ii.totalWeeks === 14
       && ip._testWeek === 14 && ip._raceDateCappedWeeks === 14
       && !!iW1 && canon(iW1) === canon(I.SENT) && iFresh.weeks[1].mon.title !== I.SENT.title,
     ii.crash || JSON.stringify({tw: ii.cfg._testWeek, cap: ii.cfg._raceDateCappedWeeks, weeks: ii.totalWeeks, persisted: [ip._testWeek, ip._raceDateCappedWeeks], w1mon: iW1 && iW1.title}));
  // C3j (control, passes on both): _testWeek null with the test in week 28, past Table 6. No pin, no write.
  const j28 = iso(addDays(S, 7 * 27));
  const J = stored(pace({raceDate:j28, _testWeek:null, _raceDateCappedWeeks:11}), S_ISO, 'p_c3_w28');
  const jBytes = cfgBytes(J);
  const jj = tryRefresh(J.V, J.read());
  ok('C3j control: _testWeek null with the test in week 28 (' + j28 + ') stays null in memory and in ia_programs, the stored cfg bytes unchanged, cap 11, 11 weeks',
     !jj.crash && own(jj.cfg, '_testWeek') && jj.cfg._testWeek === null && J.read().cfg._testWeek === null && cfgBytes(J) === jBytes
       && jj.cfg._raceDateCappedWeeks === 11 && jj.totalWeeks === 11,
     jj.crash || JSON.stringify({tw: jj.cfg._testWeek, stored: J.read().cfg._testWeek, cap: jj.cfg._raceDateCappedWeeks, weeks: jj.totalWeeks, bytesEqual: cfgBytes(J) === jBytes}));
"""),
]

# ── g202_d108_touchset_freeze.js ──────────────────────────────────────────────────────
EDITS['g202_d108_touchset_freeze.js'] = [
# 1. undated fixture
(r"""  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:'2026-10-19',
""",
r"""  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:false, raceDate:'',
"""),
# 2. drop both pin keys; the comment says why
(r"""  // D106a (V207, ruled literal): the fixture is the 11-week program as stored with no test week.
  // With the key present, the one-time test-week backfill in refreshProgram does not fire, so
  // this gate never compresses the fixture onto its race date from a start of "today" (an
  // outcome that would depend on the date the gate runs). The D108 claim is unchanged.
  _testWeek:null, _raceDateCappedWeeks:11
};
""",
r"""  // D184 (P-TESTLEN, V223; tests/measure/v223_rulings/p_testlen_d184_ruling.md Q1): the fixture
  // is UNDATED (eventTargeted false, no raceDate, no pin keys), so progTestPin returns null on
  // every version and every run date and the test-week backfill in refreshProgram never touches
  // it. Through V222 it escaped the backfill with _testWeek:null; D184 re-pins exactly that shape,
  // which moved the control day, and a dated fixture would re-enter the past-test branch after
  // its race date and tie the outcome to the date the gate runs. The D108 claim is unchanged:
  // R1c and R2c keep their text and are D108 controls on every version.
};
"""),
]

# ── check every anchor in every file before writing anything ──────────────────────────
out = {}
for name, edits in EDITS.items():
    p = ROOT + name
    with open(p, 'r', encoding='utf-8') as fh:
        s = fh.read()
    for i, (old, new) in enumerate(edits, 1):
        n = s.count(old)
        if n != 1:
            sys.exit('ABORT %s anchor %d: count %d (want 1); nothing written' % (name, i, n))
        s = s.replace(old, new, 1)
        print('ok  %s anchor %d count 1' % (name, i))
    out[p] = s

for p, s in out.items():
    with open(p, 'w', encoding='utf-8') as fh:
        fh.write(s)
    print('wrote', p)
