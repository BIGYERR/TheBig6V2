// g223_d184_testlen.js — GATE for D184 (P-TESTLEN): a dated test goal pins to its test week whenever that week is a
// row of Table 6 (1 <= week <= 26); one owner (progTestPin), one length number on every surface; past week 26 the
// goal length builds and the card prints the interim sentence.
//
//   node tests/gates/g223_d184_testlen.js <candidate.html> [<V222 baseline.html>]      (gate.sh's call; no env needed)
//   IA_ASSUME_VERSION=223 node tests/gates/g223_d184_testlen.js <tree stamped 222>   (discrimination run only)
//
// THE RULING THIS DEFENDS: tests/measure/v223_rulings/p_testlen_d184_ruling.md, slices (a), (b1), (b2), the Before /
// After cell and Q3 as amended by the MARIO DECISION block (beyond 26: CONCUR, the full fix goes to another build and
// this build ships the interim sentence), and slice (c) as re-ruled in "## D184 (c')" (Mario: SHIP): every (c') row it
// lists is here (R1, R2, R3, R4, R5, R6 with the controls R3S, R4D, R4B, R6N) and its five mutations are in
// tests/sabotage/v223_d184.json. Nothing is owed: R5's pre-(c) tree comparison ran once as
// tests/measure/v223_testlen_r5_blast.js (output tests/measure/v223_testlen_r5_blast.out.txt). D-code D184, ships on ia-version 223.
// The ruling forbids pinning W1 to W3 identity before and after an extension; no row here does.
//
// TIMEZONE. Test weeks are counted across both 2026-11-01 (fall back) and 2027-03-14 (spring forward). This file is a
// PARENT that spawns itself twice, once under TZ=America/New_York and once under TZ=UTC, and sums the two children.
// Every row prints once per zone, tagged [NY] or [UTC]. A child that dies or prints no CHILD summary is a named FAIL.
//
// CLOCK. Each child pins Date() with no argument and Date.now to Tue 2026-09-22 21:16 local (M7/M8's clock) before
// the VM is built. Dated constructors are untouched.
//
// ORACLES. Never asked of the engine (no testWeekIndex, progTestPin, wizardTestPin, calcCurrentWeek):
//   the test week is Monday arithmetic on integer civil days (Hinnant's days_from_civil, Sakamoto's weekday):
//   week = (Monday(test) - Monday(start)) / 7 + 1, cross-checked (Z1) against a typed weekday table and the ruling's
//   printed weeks (2027-02-04 = 20, 2026-12-28 = 15, 2027-03-15 = 26, 2027-03-18 = 26, 2027-03-22 = 27,
//   2027-03-25 = 27, all from Mon 2026-09-21);
//   26 is Table 6's last row, typed from the ruling ("Table 6 is a 26-week block"), never read off NSW_TABLE6_INT;
//   the RD cell's length, trial string and generate sub are the ruling's After cell, typed;
//   the interim sentence is the MARIO DECISION text, typed with its three numbers as slots (raw week, 26, length);
//   K27's goal length L is the length the SAME inputs build with no test date (raceDate ''), the path D184 leaves
//   alone (calcProgramLength is ruled unchanged); its one typed anchor is PRT TING test 2027-03-25 = 27 / 26 / 11.
//
// VERSION PREDICATE (standing rulings 2 and 4). D184 ships at 223.
//   below 223      REFUSED, every row FAILS by name.
//   223 and up     every row asserts, in both zones, except NRC0 (below).
//   IA_ASSUME_VERSION=223 lifts a file stamped exactly 222 to 223 for a discrimination run. It is announced, and it
//   is ignored on any file not stamped exactly 222. gate.sh never sets it.
//   NRC0 is a BLAST-RADIUS comparison against the previous version, scoped to the build pair (candidate 223,
//   baseline V222). The V222 baseline is argv[3] when that file reads ia-version 222; otherwise it is read from git
//   at the V222 commit (2694374). At 224 and up NRC0 prints SCOPED OUT and is not counted. At 223 with no baseline
//   it FAILS: a claim that did not run is not a pass.
//
// ROWS (each printed once under [NY] and once under [UTC])
//   Z0    CONTROL  the child's zone is the one asked for (NY observes 2027-03-14; UTC has offset 0).
//   Z1    CONTROL  the hand week oracle agrees with a typed weekday table and with the ruling's printed weeks.
//   Z2    CONTROL  the clock pin reaches the VM.
//   RD    the ruling's Before/After cell through doGenerate: 1 mi 6:00, beginner, test Thu 2027-02-04, start
//         Mon 2026-09-21, rest sun/wed: start 2026-09-21, totalWeeks 20, stored _testWeek 20 and cap 20, trials
//         exactly ["W20 thu 1 Mile Test — TIME TRIAL"], generate sub "Building your 20-week program...".
//   B1248 M8's 4/5 cell (8 test goals x 3 experience x 2 mile states x test weeks 1..26, test on Thursday of week k
//         from Mon 2026-09-21): cardio goal step header == name step == generate screen == built length == hand week.
//   K27   the same lattice at test weeks 27..30 (192 cells) plus the typed PRT TING anchor: the card prints the
//         interim sentence exactly, header == name step == generate screen == built == goal length, no TIME TRIAL.
//   P1    source scan, comments stripped (the stripped code must still compile): `NSW_TABLE6_INT.length - 1` occurs
//         exactly once in code and inside function progTestPin; no `<= len`, `<= totalWeeksPreview` or
//         `<= recommended` gate anywhere in code.
//   NRC0  CONTROL (blast radius vs V222)  M7's 210 dated race and run_base builds (run_5k, run_10k, run_half,
//         run_marathon, run_base x 3 experience x 2 mile states x test weeks 4,8,12,16,20,26,30) are digest-identical
//         to the V222 baseline, the baseline equals itself first, the digests are input-sensitive, and HALF_MANNY is
//         0ac7da6b1691a8e1 (typed; standing ruling 5, D184 states it unchanged). It also carries the (c') ruling's R5
//         "210 NRC builds unmoved" part: against V222 that is this lattice, so R5 does not rebuild it.
//   (c') LATTICE (tests/measure/v223_testlen_m9b.js part A, reused): today = Mon 2026-09-21 .. Sun 2026-09-27, the
//         clock pinned to 21:16 local on each; entered start today-7 .. today+27; rest none, sun, sun/wed, sat/sun,
//         fri/sat/sun, mon/wed/fri, thu..sun; test date today .. today+34; 2 dated test goals = 120,050 points. The
//         (c) ORACLE is integer date arithmetic, never the resolver: the entered day is not a Monday, every weekday
//         from it through its Sunday is a rest day, and the test falls from the entered day through that Sunday.
//         Its counts are checked against the ruling's typed ones (1,206 = 42 entered == today, 1,134 after, 30
//         before; by rest pattern thu..sun 580, fri/sat/sun 344, sat/sun 170, sun 56, sun/wed 56). The resolver is
//         called with the test date itself as its third argument (both goals are dated test goals; the goal guard
//         _rsRace is R6's), so the two goals are the same resolver calls and the ruling's count is kept as ruled.
//   R1    every (c) point: start == entered and holdsTest true; every other point carries no holdsTest and its
//         3-argument start equals its 2-argument start (moved-not-(c) 0). BLAST RADIUS vs V222 (pair-scoped like
//         NRC0; at 224 and up these parts print SCOPED OUT and the oracle parts still assert): every non-(c) 3-argument
//         return and every 2-argument return is byte-equal (JSON) to V222's return for the same call, and no non-(c)
//         point moves against V222.
//   R2    every (c) cell of the 1.5 mi 12:00 (mile 8:00) goal x 3 experience levels (1,809 builds, all run, no
//         sampling), clock on that cell's today: start == entered, stored _testWeek 1 (hand week 1), totalWeeks 1,
//         trials exactly ["W1 <test weekday> 1.5 Mile Test — TIME TRIAL"] (the ruling's After cell), no day from the
//         start through the day before the test and no day after the test in W1 carries cardio or a section.
//   R3    the name step's startResolve markup on every (c) cell of the 1.5 mi goal (603 = 21 entered == today,
//         567 after, 15 before; each segment must be non-empty) equals the ruling's Q2 string with the date made by
//         the gate's own Intl.DateTimeFormat('en-US', weekday/month/day short, timeZone UTC) from the entered ISO,
//         and its text is non-empty with no "today", no "this week" (either case) and no U+2014.
//   R3S   CONTROL  the snap cell (today = entered = Thu 2026-09-24, rest thu..sun, test Tue 2026-09-29, outside the
//         entered week) prints the V222 snap sentence typed from the ruling's Before print: "Nothing left to train
//         that week, so this starts Mon, Sep 28. Week 1 runs Sep 28 – Oct 4." It passes on every tree.
//   R4    the step-3 callout (updateRaceDateFeedback) on every (c) cell of the 1.5 mi goal (603, the same cells as R3,
//         so cell A and the back-navigation shape of cell B are among them; both are asserted present): the card is
//         var(--signal), carries 0 `<svg`, its text opens with the ruling's Q3 sentence typed "Your test is in week 1.
//         Nothing is left to train before it. You get the test week only." and holds no "Primer" and no "shakeout"
//         (either case). The reach sentence after it is D183's and is not asserted here.
//   R4D   CONTROL  cell D (today Mon 2026-09-21, start today, rest sun, test Thu 2026-09-24; hand week 1, not a (c)
//         cell): the callout still opens with the ruling's "V222 tw 1 sentence", typed "Your test is this week. You get
//         the test week only. Primer lifts, a shakeout, then the test." That text is D183's (this build, before (c)):
//         the V222 file prints "Your test is less than a week away. ..." there. It passes on the D184 tree and the
//         pre-(c) tree and FAILS on V222 for D183's reason, not D184's.
//   R4B   CONTROL  cell B first pass (today Mon 2026-09-21, no start chosen yet, rest thu..sun, test Sat 2026-10-10;
//         hand week 3): the callout still opens with "Your test is in week 3. The program ends on it. The taper lands in
//         front of it." (D183's row). It passes on the D184 tree and the pre-(c) tree; V222 prints its own card there.
//   R5    CONTROL (pair-scoped like NRC0: at 224 and up it prints SCOPED OUT). Only parts with a permanent baseline
//         stay in the gate: HALF_MANNY 0ac7da6b1691a8e1 (typed; standing ruling 5) and g203 98/98. g203 (the lighter
//         choice): the PARENT runs tests/gates/g203_mile_pencil.js once on the candidate (0.5 s) and hands its PASS/FAIL
//         summary to both children; R5 asserts it reads exactly "PASS 98 FAIL 0". A missing summary is a FAIL.
//         The (c') ruling's R5 also names M7's 210 NRC builds unmoved: against the one permanent baseline (V222, git
//         2694374) that is NRC0's lattice, cfg for cfg, so NRC0 carries it and R5 does not build it twice.
//         The comparison against the PRE-(c) TREE (the D184 tree with (a)(b) landed and (c) not, stamped 223) is a
//         ONE-TIME blast-radius proof for this build, not a standing row: that tree exists only in the build session's
//         scratch. It is tests/measure/v223_testlen_r5_blast.js (M9's lattice, 2 goals x 3 experience x today Mon..Sun
//         2026-09-21..27 x test 0..7 days out x the 7 rest patterns = 2,352, start = today, split by the (c) oracle into
//         the ruling's typed 371 + 1,855 non-(c) and 21 + 105 (c); every non-(c) build and M7's 210 NRC builds
//         digest-identical to the pre-(c) tree, which equals itself first and is input-sensitive), run once on the
//         V223 candidate with its output kept in tests/measure/v223_testlen_r5_blast.out.txt.
//   R6    setProgStart re-dates into a (c) week, three cells by the (c) oracle, one per segment: cell A (today Thu
//         2026-09-24, built from Mon 2026-09-28, re-dated to Thu 2026-09-24, test Sat 2026-09-26), cell B (today Mon
//         2026-09-21, built from today, re-dated to Thu 2026-10-08, test Sat 2026-10-10) and a past entered day (today
//         Sun 2026-09-27, rest sat/sun, built from Mon 2026-09-28, re-dated to Sat 2026-09-26, test Sun 2026-09-27):
//         startDate == the entered day, stored _testWeek 1 and _raceDateCappedWeeks 1, and the toasts are exactly the
//         ruling's Q4 string typed "That week holds your test. Nothing left to train before it ✓" with no U+2014.
//   R6S   setProgStart re-dates into a snap week that does not hold the test (the R3S cell: today Thu 2026-09-24,
//         built from Mon 2026-09-21, re-dated to Thu 2026-09-24, test Tue 2026-09-29): startDate is the next Monday
//         by hand (2026-09-28) and the toast is the session's de-dashed snap string, "Nothing to train that week.
//         Starts " + the gate's Intl date of that Monday + " ✓", no U+2014. Not a control: the de-dash is (c)'s.
//   R6N   CONTROL (the _rsRace guard)  an NRC cfg, HALF_MANNY with rest thu..sun (goal run_half, race Sun 2026-12-06),
//         re-dated to race-week Thursday 2026-12-03, a (c) shape by date: it still snaps to Mon 2026-12-07 (by hand),
//         with one toast that opens "Nothing to train that week" and is not the Q4 string. It passes on every tree.
// Every non-CONTROL row FAILS on V222 (IA_ASSUME_VERSION=223 base_v222.html) and PASSES on the D184 tree. On V222 the
// controls R4D, R4B (D183's copy) and R5 (g203 reads 92/98 there) FAIL too; Z*, R3S, R6N and NRC0 pass. On the tree
// with (a)(b) landed and (c) not, R1, R2, R3, R4, R6 and R6S FAIL and R3S, R4D, R4B, R5 and R6N pass.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process'), vm = require('vm');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEARG = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ERA = 223, PREV = 222, PREV_COMMIT = '2694374';
const ZONES = [['NY', 'America/New_York'], ['UTC', 'UTC']];

const ROWS = {
  Z0: 'Z0 CONTROL: the child runs in the zone the parent asked for',
  Z1: 'Z1 CONTROL: the hand week oracle agrees with a typed weekday table and the ruling\'s printed weeks',
  Z2: 'Z2 CONTROL: the pinned clock reaches the VM',
  RD: 'RD the ruling\'s After cell (1 mi 6:00 beginner, test Thu 2027-02-04, start Mon 2026-09-21): 20 weeks, pin 20/20, trials ["W20 thu 1 Mile Test — TIME TRIAL"], sub "Building your 20-week program..."',
  B1248: 'B1248 test weeks 1..26 on M8\'s 4/5 cell: header == name step == generate screen == built length == hand week',
  K27: 'K27 test weeks 27..30: the interim sentence exact, header == name step == generate screen == built == goal length, no TIME TRIAL',
  P1: 'P1 one predicate: NSW_TABLE6_INT.length - 1 once in code, inside progTestPin; no <= len / <= totalWeeksPreview / <= recommended gate',
  R1: 'R1 (c\') resolver lattice, 120,050 points: the 1,206 (c) points keep start == entered with holdsTest true, moved-not-(c) 0; blast radius vs V222: every non-(c) return and every 2-argument return byte-equal to V222',
  R2: 'R2 (c\') builds on the (c) cells (1.5 mi goal x 3 experience): start == entered, tw 1, totalWeeks 1, the one trial on the test weekday, 0 train days start..test-1, 0 after the test in W1',
  R3: 'R3 (c\') name step on the (c) cells, entered ==, > and < today: the Q2 sentence with the gate\'s own Intl date of the entered day, non-empty, no "today", "this week" or U+2014',
  R3S: 'R3S CONTROL: the snap cell (entered Thu 2026-09-24, rest thu..sun, test Tue 2026-09-29) still prints the V222 snap sentence',
  R4: 'R4 (c\') step-3 callout on the (c) cells: var(--signal), 0 <svg, opens with the Q3 sentence, no "Primer" or "shakeout"',
  R4D: 'R4D CONTROL: cell D (today Mon, start today, rest sun, test Thu) still opens with the V222 tw 1 sentence',
  R4B: 'R4B CONTROL: cell B first pass (today Mon 2026-09-21, no start chosen, test Sat 2026-10-10) still prints "week 3"',
  R5: 'R5 CONTROL: HALF_MANNY 0ac7da6b1691a8e1, g203 98/98 (the 210 NRC builds vs V222 are NRC0\'s; the pre-(c) comparison is tests/measure/v223_testlen_r5_blast.out.txt)',
  R6: 'R6 (c\') setProgStart into a (c) week (==, >, < today): startDate == entered, _testWeek 1, _raceDateCappedWeeks 1, the Q4 toast, no U+2014',
  R6S: 'R6S setProgStart into a snap week without the test: snaps to the next Monday with the de-dashed snap toast',
  R6N: 'R6N CONTROL (the _rsRace guard): HALF_MANNY\'s goal, rest thu..sun, re-dated to race-week Thursday still snaps',
  NRC0: 'NRC0 CONTROL (blast radius vs V222): M7\'s 210 race and run_base builds digest-identical to V222, HALF_MANNY 0ac7da6b1691a8e1',
};
const ROW_KEYS = Object.keys(ROWS);
const isControl = key => /^Z/.test(key) || ['NRC0', 'R3S', 'R4D', 'R4B', 'R5', 'R6N'].includes(key);
const PAIR_ONLY = ['NRC0', 'R5'];                                                   // blast-radius rows scoped to this build's pair
const stampOf = f => +((fs.readFileSync(f, 'utf8').match(/<meta name="ia-version" content="(\d+)"/) || [])[1]);

// ═════════════════════════════════════════════ PARENT ═════════════════════════════════════════════
if(!process.env.G184_ZONE){
  let pass = 0, fail = 0;
  const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
  let tmpBase = null;
  const done = () => { if(tmpBase){ try { fs.unlinkSync(tmpBase); } catch(e){} } console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
  let STAMP = NaN;
  try { STAMP = stampOf(ART); H.load(ART); } catch(e){ ok('boot: the candidate loads in the harness', false, e.message); done(); }
  let VER = STAMP;
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  }
  console.log('g223 D184 testlen | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));
  if(!(VER >= ERA)){
    console.log('REFUSED: ia-version ' + VER + ' predates D184 P-TESTLEN (V' + ERA + '). No row may pass on it.');
    for(const [tag] of ZONES) for(const k of ROW_KEYS) ok('[' + tag + '] ' + ROWS[k] + ' (REFUSED)', false);
    done();
  }
  // The V222 baseline for NRC0 (pair-scoped: only at 223).
  const pair = VER === ERA;
  let basePath = '', baseWhy = '';
  if(pair){
    if(BASEARG && fs.existsSync(BASEARG) && stampOf(BASEARG) === PREV){ basePath = BASEARG; baseWhy = 'argv[3] ' + path.basename(BASEARG); }
    else {
      baseWhy = BASEARG ? 'argv[3] ' + path.basename(BASEARG) + ' is not ia-version ' + PREV + '; ' : '';
      try {
        tmpBase = path.join(os.tmpdir(), 'g223_d184_v222_' + process.pid + '.html'); try { fs.unlinkSync(tmpBase); } catch(e){}
        fs.writeFileSync(tmpBase, cp.execFileSync('git', ['-C', ROOT, 'show', PREV_COMMIT + ':index.html'], { maxBuffer: 1 << 27 }));
        if(stampOf(tmpBase) === PREV){ basePath = tmpBase; baseWhy += 'git ' + PREV_COMMIT; } else baseWhy += 'git copy reads ' + stampOf(tmpBase);
      } catch(e){ baseWhy += 'git show failed: ' + String(e.message).slice(0, 80); }
    }
    console.log('NRC0 baseline: ' + (basePath ? baseWhy : 'NONE (' + baseWhy + ')'));
  }
  // R5 (pair-scoped): g203, the lighter choice, run once here, its summary handed to both children.
  let g203 = '';
  if(pair){
    const gr = cp.spawnSync(process.execPath, [path.join(__dirname, 'g203_mile_pencil.js'), ART], { env: process.env, encoding: 'utf8', maxBuffer: 1 << 26 });
    const gs = [...String(gr.stdout || '').matchAll(/^PASS (\d+) FAIL (\d+)\s*$/mg)].pop();
    g203 = gs ? 'PASS ' + gs[1] + ' FAIL ' + gs[2] : 'NO SUMMARY (exit ' + gr.status + ')';
    console.log('R5 g203_mile_pencil.js, run once by the parent: ' + g203);
  }
  const want = ROW_KEYS.filter(k => pair || !PAIR_ONLY.includes(k));
  for(const [tag, tz] of ZONES){
    console.log('\n-- TZ=' + tz + ' [' + tag + '] --');
    const r = cp.spawnSync(process.execPath, [__filename, ART], { env: Object.assign({}, process.env,
      { TZ: tz, G184_ZONE: tag, G184_VER: String(VER), G184_PAIR: pair ? '1' : '', G184_BASE: basePath, G184_BASE_WHY: baseWhy,
        G184_G203: g203 }),
      encoding: 'utf8', maxBuffer: 1 << 26 });
    const out = r.stdout || '';
    for(const line of out.split('\n')){
      const m = /^(PASS|FAIL) (\[(\w+)\] (\w+) .*)$/.exec(line);
      if(m){ if(m[3] === tag && ROWS[m[4]]) (m[1] === 'PASS' ? pass++ : fail++); console.log(line); }
      else if(line.trim() && !/^CHILD /.test(line)) console.log('  ' + line);
    }
    if(r.stderr && r.stderr.trim()) console.log('  stderr: ' + r.stderr.trim().split('\n').slice(-4).join(' | '));
    const s = /^CHILD (\w+) PASS (\d+) FAIL (\d+)\s*$/m.exec(out);
    const seen = want.filter(k => new RegExp('^(PASS|FAIL) \\[' + tag + '\\] ' + k + ' ', 'm').test(out));
    ok('[' + tag + '] child under TZ=' + tz + ' ran every row and printed its CHILD summary (exit ' + r.status + ')',
       !!s && s[1] === tag && seen.length === want.length && +s[2] + +s[3] === want.length,
       (s ? s[0] : 'no CHILD summary') + '; rows seen ' + seen.length + '/' + want.length);
  }
  done();
}

// ═════════════════════════════════════════════ CHILD ══════════════════════════════════════════════
const TAG = process.env.G184_ZONE, VER = +process.env.G184_VER, PAIR = process.env.G184_PAIR === '1';
let cpass = 0, cfail = 0;
function row(key, bad, total, note){
  const label = '[' + TAG + '] ' + ROWS[key];
  const good = bad.length === 0 && total > 0;
  if(good){ cpass++; console.log('PASS ' + label + ' (' + total + '/' + total + ' cells' + (note ? '; ' + note : '') + ')'); }
  else { cfail++; console.log('FAIL ' + label + ' (' + (total - bad.length) + '/' + total + ' cells' + (note ? '; ' + note : '') + '; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '') + ')'); }
}

// ── the hand oracle: integers only ────────────────────────────────────────────────────────────────
const WD3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ymd = s => String(s).split('-').map(Number);
function sakamoto(y, m, d){ const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]; if(m < 3) y -= 1; return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[m - 1] + d) % 7; }
function civ(y, m, d){   // days from 1970-01-01, Hinnant's days_from_civil
  y -= m <= 2 ? 1 : 0; const era = Math.floor(y / 400), yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy - 719468;
}
function fromCiv(z){     // Hinnant's civil_from_days
  z += 719468; const era = Math.floor(z / 146097), doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)), mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp + (mp < 10 ? 3 : -9);
  return (yoe + era * 400 + (m <= 2 ? 1 : 0)) + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
const civI = s => civ(...ymd(s));
const monOf = s => civI(s) - ((sakamoto(...ymd(s)) + 6) % 7);                       // the Monday of s's week
const handWeek = (startIso, testIso) => civI(testIso) < civI(startIso) ? null : (monOf(testIso) - monOf(startIso)) / 7 + 1;
const W1MON = '2026-09-21';
const thuOfWeek = k => fromCiv(civI(W1MON) + (k - 1) * 7 + 3);                        // Thursday of program week k
const TABLE6_LAST = 26;                                                              // typed: Table 6 is a 26-week block
const interim = (week, len) => 'Your test is in week ' + week + '. The test block is ' + TABLE6_LAST + ' weeks. This program builds '
  + len + (len === 1 ? ' week' : ' weeks') + ' now. Start a test block when the test is ' + TABLE6_LAST + ' weeks out.';
const INTERIM_TYPED = 'Your test is in week 27. The test block is 26 weeks. This program builds 11 weeks now. Start a test block when the test is 26 weeks out.';
const WEEKDAY_TABLE = { '2026-09-21':'Mon', '2026-09-22':'Tue', '2026-11-01':'Sun', '2026-12-28':'Mon', '2027-02-04':'Thu', '2027-03-14':'Sun',
  '2027-03-15':'Mon', '2027-03-18':'Thu', '2027-03-22':'Mon', '2027-03-25':'Thu', '2027-04-15':'Thu' };
const RULING_WEEKS = [['2027-02-04', 20], ['2026-12-28', 15], ['2027-03-15', 26], ['2027-03-18', 26], ['2027-03-22', 27], ['2027-03-25', 27], ['2026-09-14', null]];

// ── clock pin, then the VMs ───────────────────────────────────────────────────────────────────────
const RD0 = Date, NOW0 = new RD0(2026, 8, 22, 21, 16, 0).getTime();
let NOW = NOW0;                                                                     // (c') rows move it per "today", then restore NOW0
const setToday = iso => { const [y, m, d] = ymd(iso); NOW = new RD0(y, m - 1, d, 21, 16, 0).getTime(); };
class FD extends RD0 { constructor(...a){ if(a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
globalThis.Date = FD;
function mkVM(file){
  const IA = H.load(file), els = new Map(), mk = IA.window.document.createElement;
  IA.window.document.getElementById = id => { if(!els.has(id)){ const e = mk('div'); e.id = id; els.set(id, e); } return els.get(id); };
  IA.eval('showToast = function(){}');
  return { IA, els };
}
const J = v => JSON.stringify(v);
const clone = v => JSON.parse(JSON.stringify(v));
const txt = h => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function setWD(V, o){ V.IA.window.__O = o; V.IA.eval('WD = JSON.parse(JSON.stringify(__O))'); V.els.clear(); }
function gen(V){
  const IA = V.IA; IA.localStorage._map.clear(); IA.eval('activeProg = null');
  try { IA.eval('doGenerate()'); } catch(e){ return { err: 'doGenerate threw ' + e.message }; }
  const sub = (V.els.get('generateSub') || {}).textContent; IA.flushTimers(Infinity);
  const p = IA.eval('activeProg'); if(!p) return { err: 'no program' };
  return { p, sub, cfg: p.cfg || {} };
}
function copy(V){
  const IA = V.IA;
  try {
    IA.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep(); updateRaceDateFeedback()');
    const body = V.els.get('wizardBody').innerHTML, fb = txt((V.els.get('raceDateFeedback') || { innerHTML: '' }).innerHTML);
    const h = String(body).replace(/<[^>]+>/g, '').match(/Program length: (\d+) weeks?/);
    IA.eval('wizardStep = WIZARD_STEPS.indexOf("name"); renderWizardStep()');
    const n = txt(V.els.get('wizardBody').innerHTML).match(/Program length\s*(\d+)\s*weeks?/i);
    return { hdr: h ? +h[1] : null, name: n ? +n[1] : null, fb };
  } catch(e){ return { err: 'wizard render threw ' + e.message }; }
}
const DAYS7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function trials(p){
  const t = [];
  for(let w = 1; w <= (p.totalWeeks || 0); w++) for(const d of DAYS7){
    const x = p.weeks && p.weeks[w] && p.weeks[w][d]; const cs = x ? [].concat(x.cardio || []) : [];
    for(const c of cs) if(c && c.type === 'run' && /TIME TRIAL/.test(String(c.subtype || ''))) t.push('W' + w + ' ' + d + ' ' + c.subtype);
  }
  return t;
}
const V = mkVM(ART);

// ── Z0 zone ──
{ const off = (y, m, d) => new RD0(y, m - 1, d, 12).getTimezoneOffset(), bad = [];
  if(TAG === 'NY'){ if(!(off(2027, 3, 13) === 300 && off(2027, 3, 15) === 240)) bad.push('NY offsets ' + off(2027, 3, 13) + '/' + off(2027, 3, 15) + ' (want 300/240)'); }
  else if(!(off(2027, 3, 13) === 0 && off(2027, 3, 15) === 0)) bad.push('UTC offsets ' + off(2027, 3, 13) + '/' + off(2027, 3, 15) + ' (want 0/0)');
  row('Z0', bad, 1, 'TZ=' + process.env.TZ); }
// ── Z1 hand oracle ──
{ const bad = []; let n = 0;
  for(const [iso, w] of Object.entries(WEEKDAY_TABLE)){ n++; const [y, m, d] = ymd(iso);
    if(WD3[sakamoto(y, m, d)] !== w || WD3[((civ(y, m, d) % 7) + 11) % 7] !== w || fromCiv(civ(y, m, d)) !== iso) bad.push(iso + ' ' + WD3[sakamoto(y, m, d)] + '/' + w); }
  for(const [t, w] of RULING_WEEKS){ n++; if(handWeek(W1MON, t) !== w) bad.push(W1MON + '->' + t + ' ' + handWeek(W1MON, t) + '/' + w); }
  for(let k = 1; k <= 30; k++){ n++; const t = thuOfWeek(k); if(WD3[sakamoto(...ymd(t))] !== 'Thu' || handWeek(W1MON, t) !== k || handWeek('2026-09-22', t) !== k) bad.push('thuOfWeek(' + k + ') ' + t); }
  n++; if(interim(27, 11) !== INTERIM_TYPED) bad.push('interim(27, 11) ' + J(interim(27, 11)));
  row('Z1', bad, n); }
// ── Z2 clock pin ──
{ const bad = [];
  const got = V.IA.eval('(function(){ const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + d.getHours() + ":" + d.getMinutes(); })()');
  if(got !== '2026-09-22 21:16') bad.push('VM reads ' + got);
  const now = V.IA.eval('Date.now()'); if(now !== NOW) bad.push('Date.now ' + now);
  row('Z2', bad, 2); }

// ── RD the ruling's Before/After cell ──
{ const bad = [];
  const o = { primaryPath:'event', cardioTypes:['run'], experience:'beginner', ageBracket:'18-35', eventTargeted:true, raceDate:'2027-02-04',
    liftingFocus:'support_prevention', equipment:'crossfit', restDays:['sun','wed'], unit:'lbs', seed:4242, name:'M', startDate:W1MON,
    cardioGoals:{ run:{ id:'run_pace_goal', label:'x', targetDist:'1', paceUnit:'mi', targetMins:'6', targetSecs:'0', targetTime:'6:00' } } };
  const tw = handWeek(W1MON, o.raceDate);   // 20 by hand (Z1 checks it against the ruling)
  setWD(V, o); const g = gen(V);
  if(g.err) bad.push(g.err);
  else {
    if(g.p.startDate !== W1MON) bad.push('start ' + g.p.startDate + ' want ' + W1MON);
    if(g.p.totalWeeks !== tw) bad.push('totalWeeks ' + g.p.totalWeeks + ' want ' + tw);
    if(!(g.cfg._testWeek === tw && g.cfg._raceDateCappedWeeks === tw)) bad.push('pin ' + J([g.cfg._testWeek, g.cfg._raceDateCappedWeeks]) + ' want [' + tw + ',' + tw + ']');
    const tr = trials(g.p); if(J(tr) !== J(['W' + tw + ' thu 1 Mile Test — TIME TRIAL'])) bad.push('trials ' + J(tr));
    if(g.sub !== 'Building your ' + tw + '-week program...') bad.push('sub ' + J(g.sub));
  }
  row('RD', bad, 1, 'hand week ' + tw); }

// ── B1248 / K27 M8's 4/5 cell ──
{ const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const GOALS = [];
  for(const t of [570, 660, 750, 855]) GOALS.push(['1.5mi ' + fmt(t), { id:'run_pace_goal', label:'x', targetDist:'1.5', paceUnit:'mi', targetMins:String(Math.floor(t / 60)), targetSecs:String(t % 60), targetTime:fmt(t) }]);
  for(const t of [360, 420, 480, 570]) GOALS.push(['1mi ' + fmt(t), { id:'run_pace_goal', label:'x', targetDist:'1', paceUnit:'mi', targetMins:String(Math.floor(t / 60)), targetSecs:String(t % 60), targetTime:fmt(t) }]);
  const bIn = [], bOut = []; let nIn = 0, nOut = 0;
  for(const [gl, run] of GOALS) for(const exp of ['beginner', 'intermediate', 'advanced']) for(const mile of [null, 480]){
    const base = { primaryPath:'event', cardioTypes:['run'], experience:exp, ageBracket:'18-35', eventTargeted:true, liftingFocus:'support_prevention',
      equipment:'crossfit', restDays:['sun','wed'], unit:'lbs', seed:4242, name:'M', cardioGoals:{ run:Object.assign({}, run, mile ? { mileBestMins:'8', mileBestSecs:'00' } : {}) } };
    const tag0 = gl + ' ' + exp + ' mile ' + (mile ? '8:00' : 'none');
    // the goal length for K27: the same inputs with no test date
    setWD(V, Object.assign({}, base, { raceDate:'' })); const u = gen(V); const L = u.err ? null : u.p.totalWeeks;
    for(let k = 1; k <= 30; k++){
      const o = Object.assign({}, base, { raceDate: thuOfWeek(k) }), tag = tag0 + ' k' + k;
      setWD(V, o); const c = copy(V); setWD(V, o); const g = gen(V);
      if(k <= TABLE6_LAST){
        nIn++;
        if(c.err || g.err){ bIn.push(tag + ' ' + (c.err || g.err)); continue; }
        const ow = handWeek(g.p.startDate, o.raceDate), subN = +((String(g.sub).match(/Building your (\d+)-week program/) || [])[1]);
        const got = [c.hdr, c.name, subN, g.p.totalWeeks];
        if(!(ow === k && got.every(x => x === ow))) bIn.push(tag + ': hdr/name/sub/built ' + J(got) + ' hand week ' + ow + ' (start ' + g.p.startDate + ')');
      } else {
        nOut++;
        if(c.err || g.err || L === null){ bOut.push(tag + ' ' + (c.err || g.err || 'undated sibling ' + u.err)); continue; }
        const ow = handWeek(g.p.startDate, o.raceDate), subN = +((String(g.sub).match(/Building your (\d+)-week program/) || [])[1]);
        const got = [c.hdr, c.name, subN, g.p.totalWeeks], tr = trials(g.p), w = interim(ow, L);
        if(!(ow === k && c.fb === w && got.every(x => x === L) && tr.length === 0))
          bOut.push(tag + ': card ' + J(c.fb) + (c.fb === w ? '' : ' want ' + J(w)) + ' hdr/name/sub/built ' + J(got) + ' goal length ' + L + ' trials ' + tr.length);
      }
    }
  }
  // K27 typed anchor: PRT TING (1.5 mi 11:00, intermediate, 8:15 mile), start Mon 2026-09-21, test Thu 2027-03-25 = week 27, 11 weeks.
  { nOut++;
    const o = { name:'PRT TING', primaryPath:'event', eventTargeted:true, cardioTypes:['run'], startDate:W1MON, liftingFocus:'balanced', experience:'intermediate',
      ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:185, squat:255, deadlift:315,
      seed:24865, raceDate:'2027-03-25', cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{ kind:'entered' },
      targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi' } } };
    setWD(V, o); const c = copy(V); setWD(V, o); const g = gen(V);
    if(c.err || g.err) bOut.push('PRT TING ' + (c.err || g.err));
    else if(!(c.fb === INTERIM_TYPED && c.hdr === 11 && c.name === 11 && g.sub === 'Building your 11-week program...' && g.p.totalWeeks === 11 && trials(g.p).length === 0))
      bOut.push('PRT TING 2027-03-25: card ' + J(c.fb) + ' hdr/name/sub/built ' + J([c.hdr, c.name, g.sub, g.p.totalWeeks]) + ' trials ' + trials(g.p).length);
  }
  row('B1248', bIn, nIn, 'test weeks 1..26');
  row('K27', bOut, nOut, 'test weeks 27..30 + the typed PRT TING anchor'); }

// ── P1 source scan, comments stripped ──
{ const bad = [];
  function strip(src){   // comments out, strings / templates / regex literals kept verbatim
    let i = 0, out = ''; const N = src.length;
    const prevSig = () => { let k = out.length - 1; while(k >= 0 && /\s/.test(out[k])) k--; return k >= 0 ? out[k] : ''; };
    const prevWord = () => { const m = /([A-Za-z_$][\w$]*)\s*$/.exec(out.slice(-40)); return m ? m[1] : ''; };
    const regexOk = () => { const p = prevSig(); if(p === '' || '(,=:[!&|?{};+-*%<>~^'.includes(p)) return true;
      return /[\w$]/.test(p) && /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/.test(prevWord()); };
    function code(inTmpl){
      let depth = 0;
      while(i < N){
        const c = src[i], d = src[i + 1];
        if(c === '/' && d === '/'){ while(i < N && src[i] !== '\n') i++; continue; }
        if(c === '/' && d === '*'){ const e = src.indexOf('*/', i + 2); i = e < 0 ? N : e + 2; out += ' '; continue; }
        if(c === '"' || c === "'"){ let j = i + 1; while(j < N && src[j] !== c){ if(src[j] === '\\') j++; j++; } out += src.slice(i, j + 1); i = j + 1; continue; }
        if(c === '`'){ out += c; i++; tmpl(); continue; }
        if(c === '/' && regexOk()){ let j = i + 1, cls = false;
          while(j < N){ const ch = src[j]; if(ch === '\\'){ j += 2; continue; } if(ch === '[') cls = true; else if(ch === ']') cls = false; else if((ch === '/' && !cls) || ch === '\n') break; j++; }
          j++; while(j < N && /[a-z]/i.test(src[j])) j++; out += src.slice(i, j); i = j; continue; }
        if(inTmpl){ if(c === '{') depth++; else if(c === '}'){ if(depth === 0) return; depth--; } }
        out += c; i++;
      }
    }
    function tmpl(){
      while(i < N){ const c = src[i];
        if(c === '\\'){ out += src.slice(i, i + 2); i += 2; continue; }
        if(c === '`'){ out += c; i++; return; }
        if(c === '$' && src[i + 1] === '{'){ out += '${'; i += 2; code(true); out += '}'; i++; continue; }
        out += c; i++; }
    }
    code(false); return out;
  }
  let code = '';
  try { code = strip(H.extractInlineJS(fs.readFileSync(ART, 'utf8'))); new vm.Script(code, { filename: 'g223_d184_stripped.js' }); }
  catch(e){ bad.push('the comment-stripped code does not compile: ' + e.message); }
  if(code){
    const hits = [...code.matchAll(/NSW_TABLE6_INT\.length\s*-\s*1\b/g)].map(m => m.index);
    const fnAt = [...code.matchAll(/function\s+progTestPin\s*\(/g)].map(m => m.index);
    let span = null;
    if(fnAt.length === 1){ const open = code.indexOf('{', fnAt[0]); let d = 0, j = open;
      for(; j < code.length; j++){ if(code[j] === '{') d++; else if(code[j] === '}'){ d--; if(d === 0) break; } } span = [open, j]; }
    if(fnAt.length !== 1) bad.push('function progTestPin declared ' + fnAt.length + ' times in code');
    if(hits.length !== 1) bad.push('NSW_TABLE6_INT.length - 1 occurs ' + hits.length + ' times in code (want 1)');
    else if(!span || !(hits[0] > span[0] && hits[0] < span[1])) bad.push('the one NSW_TABLE6_INT.length - 1 is outside function progTestPin');
    const gates = [...code.matchAll(/<=\s*(len|totalWeeksPreview|recommended)\b/g)].map(m => {
      const ls = code.lastIndexOf('\n', m.index) + 1, le = code.indexOf('\n', m.index); return code.slice(ls, le < 0 ? undefined : le).trim().slice(0, 100); });
    if(gates.length) bad.push(gates.length + ' week gate(s) of the old shape: ' + gates.join(' || '));
  }
  row('P1', bad, 1); }

// ── (c') R1 / R2 / R3 / R3S: the D25 snap when the entered week holds the test ─────────────────────────────
// A row whose code throws FAILS by name with the message (never a silent skip); the clock goes back to NOW0 after.
function guard(key, fn){ try { fn(); } catch(e){ row(key, ['threw ' + String(e && e.message || e).slice(0, 160)], 1); } finally { NOW = NOW0; } }
const ORD7 = DAYS7;                                                                   // mon .. sun
const offOf = iso => (sakamoto(...ymd(iso)) + 6) % 7;                                // Monday 0 .. Sunday 6
const addDays = (iso, n) => fromCiv(civI(iso) + n);
const RESTS = { none:[], sun:['sun'], 'sun,wed':['sun','wed'], 'sat,sun':['sat','sun'], 'fri,sat,sun':['fri','sat','sun'], 'mon,wed,fri':['mon','wed','fri'], 'thu..sun':['thu','fri','sat','sun'] };
const G15 = '1.5mi 12:00 mile 8:00';
const GOALS_C = { [G15]: { id:'run_pace_goal', label:'x', targetDist:'1.5', paceUnit:'mi', mileBestMins:'8', mileBestSecs:'00', targetMins:'12', targetSecs:'0', targetTime:'12:00' },
  '1mi 6:00 no mile': { id:'run_pace_goal', label:'x', targetDist:'1', paceUnit:'mi', targetMins:'6', targetSecs:'0', targetTime:'6:00' } };
const segOf = eo => eo < 0 ? '<' : eo === 0 ? '==' : '>';
// the (c) oracle, date arithmetic only: not a Monday, every weekday from the entered day through its Sunday is rest,
// and the test falls from the entered day through that Sunday
const isC = (start, rest, race) => { const off = offOf(start), sun = civI(start) + 6 - off;
  return off > 0 && ORD7.slice(off).every(d => rest.includes(d)) && civI(race) >= civI(start) && civI(race) <= sun; };
const LAT = [];
for(const gl of Object.keys(GOALS_C)) for(let wd = 0; wd < 7; wd++){ const today = addDays(W1MON, wd);
  for(let eo = -7; eo <= 27; eo++) for(const rk of Object.keys(RESTS)) for(let du = 0; du <= 34; du++){
    const start = addDays(today, eo), race = addDays(today, du);
    LAT.push({ gl, today, eo, start, rk, race, c: isC(start, RESTS[rk], race) }); } }
const CC = LAT.filter(x => x.c), CELLS = CC.filter(x => x.gl === G15);
const tagC = x => 'today ' + x.today + ' entered ' + x.start + ' rest ' + x.rk + ' test ' + x.race;
const baseC = (x, exp) => ({ primaryPath:'event', cardioTypes:['run'], experience:exp, ageBracket:'18-35', eventTargeted:true, raceDate:x.race,
  liftingFocus:'support_prevention', equipment:'crossfit', restDays:RESTS[x.rk], unit:'lbs', seed:4242, name:'M', startDate:x.start, cardioGoals:{ run:GOALS_C[x.gl] } });
function nameStep(V0){   // the raw markup inside the name step's startResolve element, or null
  V0.IA.eval('wizardStep = WIZARD_STEPS.indexOf("name"); renderWizardStep()');
  const m = String(V0.els.get('wizardBody').innerHTML).match(/id="startResolve"[^>]*>([\s\S]*?)<\/div>/);
  return m ? m[1] : null;
}
function callAll(V0, pts){   // [[3-argument JSON, 2-argument JSON], ...], stringified inside the VM
  V0.IA.window.__L = JSON.stringify(pts); V0.IA.window.__R = JSON.stringify(RESTS);
  return V0.IA.eval('(function(){ var L = JSON.parse(__L), R = JSON.parse(__R); return L.map(function(x){ return [JSON.stringify(resolveStartDate(x[0], R[x[1]], x[2])), JSON.stringify(resolveStartDate(x[0], R[x[1]]))]; }); })()');
}

// ── R1 resolver lattice ──
guard('R1', () => {
  const bad = [], seg = {}, byRest = {};
  for(const x of CC){ seg[segOf(x.eo)] = (seg[segOf(x.eo)] || 0) + 1; byRest[x.rk] = (byRest[x.rk] || 0) + 1; }
  const RULED_REST = { 'thu..sun':580, 'fri,sat,sun':344, 'sat,sun':170, sun:56, 'sun,wed':56 };   // typed from the ruling
  if(!(LAT.length === 120050 && CC.length === 1206 && seg['=='] === 42 && seg['>'] === 1134 && seg['<'] === 30 && J(byRest) === J(Object.fromEntries(Object.keys(byRest).map(k => [k, RULED_REST[k]]))) && Object.keys(byRest).length === 5))
    bad.push('oracle vs the ruling: points ' + LAT.length + ' (c) ' + CC.length + ' segments ' + J(seg) + ' by rest ' + J(byRest));
  const BP = PAIR ? process.env.G184_BASE : '';
  let B = null;
  if(PAIR){ if(!BP) bad.push('no V222 baseline (' + process.env.G184_BASE_WHY + '): the blast-radius part did not run, not a pass'); else B = mkVM(BP); }
  let cOk = 0, eqV = 0, eq2 = 0, movedV = 0, moved = 0, cMovedV = 0, selfOk = 0; const seenB = new Set();
  for(const gl of Object.keys(GOALS_C)) for(let wd = 0; wd < 7; wd++){
    const today = addDays(W1MON, wd), chunk = LAT.filter(x => x.gl === gl && x.today === today), pts = chunk.map(x => [x.start, x.rk, x.race]);
    setToday(today);
    const cr = callAll(V, pts), br = B ? callAll(B, pts) : null;
    if(br){ if(J(br) === J(callAll(B, pts))) selfOk++; else bad.push('the V222 baseline does not equal itself on ' + gl + ' today ' + today); for(const q of br) seenB.add(q[0]); }
    chunk.forEach((x, i) => {
      const why = [], c3 = cr[i][0], c2 = cr[i][1], r3 = JSON.parse(c3), r2 = JSON.parse(c2);
      if(x.c){ if(r3.start === x.start && r3.holdsTest === true) cOk++; else why.push('(c) point returns ' + c3); }
      else {
        if('holdsTest' in r3) why.push('holdsTest on a non-(c) point: ' + c3);
        if(r3.start !== r2.start){ moved++; why.push('moved by the test date ' + r2.start + ' -> ' + r3.start); }
      }
      if(br){ const b3 = br[i][0], b2 = br[i][1];
        if(c2 === b2) eq2++; else why.push('2-argument return ' + c2 + ' vs V222 ' + b2);
        if(!x.c){ if(c3 === b3) eqV++; else { why.push('return ' + c3 + ' vs V222 ' + b3); if(r3.start !== JSON.parse(b3).start) movedV++; } }
        else if(r3.start !== JSON.parse(b3).start) cMovedV++;
      }
      if(why.length) bad.push(gl + ' ' + tagC(x) + ': ' + why.join('; '));
    });
  }
  if(B && seenB.size < 2) bad.push('the V222 returns are not input-sensitive (' + seenB.size + ' distinct): an empty diff proves nothing');
  const nonC = LAT.length - CC.length;
  row('R1', bad, LAT.length + 1, 'oracle (c) ' + CC.length + ' = ' + seg['=='] + ' ==, ' + seg['>'] + ' >, ' + seg['<'] + ' <; (c) start == entered with holdsTest ' + cOk + '/' + CC.length
    + '; moved-not-(c) ' + moved + (B ? '; blast radius vs V222 (' + (process.env.G184_BASE_WHY || '') + '; baseline self-equal ' + selfOk + '/14 chunks, ' + seenB.size + ' distinct returns): non-(c) byte-equal ' + eqV + '/' + nonC + ', 2-argument byte-equal ' + eq2 + '/' + LAT.length
      + ', moved-not-(c) vs V222 ' + movedV + ', (c) moved vs V222 ' + cMovedV : PAIR ? '' : '; blast radius vs V222 SCOPED OUT (candidate ' + VER + ', not ' + ERA + ' vs ' + PREV + ')'));
});

// ── R2 builds on the (c) cells ──
guard('R2', () => {
  const bad = []; let n = 0; const segN = {};
  for(const x of CELLS) for(const exp of ['beginner', 'intermediate', 'advanced']){
    n++; segN[segOf(x.eo)] = (segN[segOf(x.eo)] || 0) + 1;
    setToday(x.today); setWD(V, baseC(x, exp)); const g = gen(V), tag = tagC(x) + ' ' + exp;
    if(g.err){ bad.push(tag + ' ' + g.err); continue; }
    const why = [], td = ORD7[offOf(x.race)], hw = handWeek(x.start, x.race);
    if(hw !== 1) why.push('hand week ' + hw + ' (oracle)');
    if(g.p.startDate !== x.start) why.push('start ' + g.p.startDate);
    if(g.cfg._testWeek !== 1) why.push('_testWeek ' + g.cfg._testWeek);
    if(g.p.totalWeeks !== 1) why.push('totalWeeks ' + g.p.totalWeeks);
    const tr = trials(g.p); if(J(tr) !== J(['W1 ' + td + ' 1.5 Mile Test — TIME TRIAL'])) why.push('trials ' + J(tr));
    const w1 = (g.p.weeks && g.p.weeks[1]) || {};
    const trains = d => { const q = w1[d]; return !!q && !q.rest && ([].concat(q.cardio || []).filter(Boolean).length > 0 || (q.sections || []).length > 0); };
    const before = ORD7.slice(offOf(x.start), offOf(x.race)).filter(trains), after = ORD7.slice(offOf(x.race) + 1).filter(trains);
    if(before.length) why.push('train days start..test-1 ' + before.join(','));
    if(after.length) why.push('train days after the test ' + after.join(','));
    if(why.length) bad.push(tag + ': ' + why.join('; '));
  }
  row('R2', bad, n, 'all ' + n + '/' + (CELLS.length * 3) + ' builds run, no sampling; entered == today ' + segN['=='] + ', > ' + segN['>'] + ', < ' + segN['<']);
});

// ── R3 name-step sentence on the three segments ──
guard('R3', () => {
  const bad = [], segN = { '==':0, '>':0, '<':0 }, segOk = { '==':0, '>':0, '<':0 };
  const FMT = new Intl.DateTimeFormat('en-US', { weekday:'short', month:'short', day:'numeric', timeZone:'UTC' });
  const dayOf = iso => { const [y, m, d] = ymd(iso); return FMT.format(RD0.UTC(y, m - 1, d)); };
  for(const x of CELLS){
    const s = segOf(x.eo); segN[s]++;
    setToday(x.today); setWD(V, baseC(x, 'intermediate')); const raw = nameStep(V), t = txt(raw), why = [];
    const want = 'That week holds your test, so this starts <b>' + dayOf(x.start) + '</b>. Nothing is left to train before it. Week 1 is the test week.';
    if(raw === null) why.push('no startResolve element');
    else {
      if(raw !== want) why.push(J(raw) + ' want ' + J(want));
      if(!t) why.push('empty');
      if(/today/i.test(t) || /this week/i.test(t) || t.includes('—')) why.push('forbidden token in ' + J(t));
    }
    if(why.length) bad.push(tagC(x) + ': ' + why.join('; ')); else segOk[s]++;
  }
  for(const s of ['==', '>', '<']) if(!segN[s]) bad.push('segment entered ' + s + ' today has no cell');
  row('R3', bad, CELLS.length, 'entered == today ' + segOk['=='] + '/' + segN['=='] + ', > ' + segOk['>'] + '/' + segN['>'] + ', < ' + segOk['<'] + '/' + segN['<']);
});

// ── R3S CONTROL the snap cell still prints the V222 snap sentence ──
guard('R3S', () => {
  const bad = [], x = { today:'2026-09-24', start:'2026-09-24', rk:'thu..sun', race:'2026-09-29', gl:G15, eo:0 };
  if(isC(x.start, RESTS[x.rk], x.race)) bad.push('oracle: the control cell is a (c) cell');
  setToday(x.today); setWD(V, baseC(x, 'intermediate')); const raw = nameStep(V), t = raw === null ? null : raw.replace(/<[^>]+>/g, '');   // tags out, no space added
  const want = 'Nothing left to train that week, so this starts Mon, Sep 28. Week 1 runs Sep 28 – Oct 4.';   // the ruling's Before print
  if(t !== want) bad.push(J(t) + ' want ' + J(want));
  row('R3S', bad, 1);
});

// ── (c') R4 / R4D / R4B / R6 / R6S / R6N / R5 ─────────────────────────────────────────────────────────────────
const Q3 = 'Your test is in week 1. Nothing is left to train before it. You get the test week only.';          // the ruling's Q3, typed
const TW1_V222 = 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.';  // V222's tw 1 row, typed
const WK3 = 'Your test is in week 3. The program ends on it. The taper lands in front of it.';                  // cell B's first pass, typed
const Q4 = 'That week holds your test. Nothing left to train before it ✓';                                    // the ruling's Q4 toast, typed
const FMTU = new Intl.DateTimeFormat('en-US', { weekday:'short', month:'short', day:'numeric', timeZone:'UTC' });
const dayU = iso => { const [y, m, d] = ymd(iso); return FMTU.format(RD0.UTC(y, m - 1, d)); };               // the gate's own date, never _fmtStartDay
const nextMon = iso => fromCiv(monOf(iso) + 7);
function callout(V0){   // the raw markup of the step-3 card
  V0.IA.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep(); updateRaceDateFeedback()');
  return String((V0.els.get('raceDateFeedback') || { innerHTML:'' }).innerHTML);
}
// build o (clock already set), then setProgStart(entered) with every toast captured; the pre-re-date state is read first
function redate(V0, o, entered){
  setWD(V0, o); const g = gen(V0); if(g.err) return { err:g.err };
  const pre = { start:g.p.startDate, tw:g.cfg._testWeek };
  V0.IA.window.__T = []; V0.IA.eval('showToast = function(m){ __T.push(String(m)); }');
  try { V0.IA.eval('setProgStart(' + J(entered) + ')'); V0.IA.flushTimers(Infinity); }
  catch(e){ return { err:'setProgStart threw ' + e.message }; }
  finally { V0.IA.eval('showToast = function(){}'); }
  const p = V0.IA.eval('activeProg') || {}, c = p.cfg || {};
  return { pre, start:p.startDate, tw:c._testWeek, cap:c._raceDateCappedWeeks, toasts:JSON.parse(V0.IA.eval('JSON.stringify(__T)')) };
}

// ── R4 the step-3 callout on the (c) cells ──
guard('R4', () => {
  const bad = [], segN = { '==':0, '>':0, '<':0 }, segOk = { '==':0, '>':0, '<':0 };
  const has = (t, s, r, q) => CELLS.some(x => x.today === t && x.start === s && x.rk === r && x.race === q);
  if(!has('2026-09-24', '2026-09-24', 'thu..sun', '2026-09-26')) bad.push('cell A is not among the (c) cells');
  if(!has('2026-09-21', '2026-10-08', 'thu..sun', '2026-10-10')) bad.push('cell B (back-navigation shape) is not among the (c) cells');
  for(const x of CELLS){
    const s = segOf(x.eo); segN[s]++;
    setToday(x.today); setWD(V, baseC(x, 'intermediate')); const raw = callout(V), t = txt(raw), why = [];
    if(!raw.startsWith('<div style="color:var(--signal);')) why.push('card ' + J(raw.slice(0, 44)) + ' is not var(--signal)');
    if(/<svg/i.test(raw)) why.push('an <svg> in the card');
    if(!t.startsWith(Q3)) why.push(J(t.slice(0, 140)) + ' does not open with Q3');
    if(/primer/i.test(t) || /shakeout/i.test(t)) why.push('"Primer" or "shakeout" in ' + J(t.slice(0, 140)));
    if(why.length) bad.push(tagC(x) + ': ' + why.join('; ')); else segOk[s]++;
  }
  row('R4', bad, CELLS.length + 2, 'entered == today ' + segOk['=='] + '/' + segN['=='] + ', > ' + segOk['>'] + '/' + segN['>'] + ', < ' + segOk['<'] + '/' + segN['<'] + '; cells A and B present');
});
// ── R4D CONTROL cell D keeps the V222 tw 1 sentence ──
guard('R4D', () => {
  const bad = [], x = { today:'2026-09-21', rk:'sun', race:'2026-09-24', gl:G15 };   // start today (no start chosen)
  if(isC(x.today, RESTS[x.rk], x.race) || handWeek(x.today, x.race) !== 1) bad.push('oracle: cell D must be hand week 1 and not a (c) cell');
  setToday(x.today); setWD(V, baseC(x, 'intermediate')); const t = txt(callout(V));
  if(!t.startsWith(TW1_V222)) bad.push(J(t.slice(0, 140)) + ' does not open with ' + J(TW1_V222));
  row('R4D', bad, 1);
});
// ── R4B CONTROL cell B first pass keeps "week 3" ──
guard('R4B', () => {
  const bad = [], x = { today:'2026-09-21', rk:'thu..sun', race:'2026-10-10', gl:G15 };   // first pass: no start chosen, so today
  if(isC(x.today, RESTS[x.rk], x.race) || handWeek(x.today, x.race) !== 3) bad.push('oracle: cell B first pass must be hand week 3 and not a (c) cell');
  setToday(x.today); setWD(V, baseC(x, 'intermediate')); const t = txt(callout(V));
  if(!t.startsWith(WK3)) bad.push(J(t.slice(0, 140)) + ' does not open with ' + J(WK3));
  row('R4B', bad, 1);
});

// ── R6 setProgStart into a (c) week ──
guard('R6', () => {
  const bad = [];
  const cells = [   // [label, today, rest key, test, built-from start (undefined = today), re-dated entered day]
    ['A ==', '2026-09-24', 'thu..sun', '2026-09-26', '2026-09-28', '2026-09-24'],
    ['B >',  '2026-09-21', 'thu..sun', '2026-10-10', undefined,    '2026-10-08'],
    ['C <',  '2026-09-27', 'sat,sun',  '2026-09-27', '2026-09-28', '2026-09-26'],
  ];
  for(const [lab, today, rk, race, built, entered] of cells){
    const why = [], eo = civI(entered) - civI(today);
    if(!isC(entered, RESTS[rk], race) || handWeek(entered, race) !== 1 || segOf(eo) !== lab.split(' ')[1]) why.push('oracle: not a (c) cell of segment ' + lab);
    setToday(today);
    const r = redate(V, baseC({ today, start:built, rk, race, gl:G15 }, 'intermediate'), entered);
    if(r.err) why.push(r.err);
    else {
      if(r.start !== entered) why.push('startDate ' + r.start + ' want ' + entered);
      if(r.tw !== 1 || r.cap !== 1) why.push('_testWeek/_raceDateCappedWeeks ' + J([r.tw, r.cap]) + ' want [1,1]');
      if(J(r.toasts) !== J([Q4])) why.push('toasts ' + J(r.toasts) + ' want ' + J([Q4]));
      if(r.toasts.some(m => m.includes('—'))) why.push('U+2014 in a toast');
    }
    if(why.length) bad.push('cell ' + lab + ' (today ' + today + ', entered ' + entered + ', rest ' + rk + ', test ' + race + (r && r.pre ? ', built ' + r.pre.start + ' tw ' + r.pre.tw : '') + '): ' + why.join('; '));
  }
  row('R6', bad, cells.length);
});
// ── R6S setProgStart into a snap week that does not hold the test ──
guard('R6S', () => {
  const bad = [], today = '2026-09-24', rk = 'thu..sun', race = '2026-09-29', entered = '2026-09-24', want = nextMon(entered);
  if(isC(entered, RESTS[rk], race) || want !== '2026-09-28') bad.push('oracle: the snap cell must not be a (c) cell and must snap to 2026-09-28');
  const wantT = 'Nothing to train that week. Starts ' + dayU(want) + ' ✓';
  setToday(today);
  const r = redate(V, baseC({ today, start:'2026-09-21', rk, race, gl:G15 }, 'intermediate'), entered);
  if(r.err) bad.push(r.err);
  else {
    if(r.start !== want) bad.push('startDate ' + r.start + ' want ' + want);
    if(J(r.toasts) !== J([wantT])) bad.push('toasts ' + J(r.toasts) + ' want ' + J([wantT]));
    if(r.toasts.some(m => m.includes('—'))) bad.push('U+2014 in a toast');
  }
  row('R6S', bad, 1, 'snap to ' + want);
});
// ── R6N CONTROL the _rsRace guard: an NRC re-date into its race week still snaps ──
guard('R6N', () => {
  const bad = [], o = Object.assign(clone(H.fixtures.HALF_MANNY), { restDays:['thu', 'fri', 'sat', 'sun'] }), entered = '2026-12-03', want = nextMon(entered);
  if(!(o.cardioGoals.run.id === 'run_half' && o.raceDate === '2026-12-06' && isC(entered, o.restDays, o.raceDate) && want === '2026-12-07'))
    bad.push('oracle: the NRC cell must be the (c) shape by date (race Sun 2026-12-06 inside Thu..Sun, all rest) and snap to 2026-12-07');
  const r = redate(V, o, entered);
  if(r.err) bad.push(r.err);
  else {
    if(r.start !== want) bad.push('startDate ' + r.start + ' want ' + want + ' (the guard lets a race goal through)');
    if(!(r.toasts.length === 1 && r.toasts[0].startsWith('Nothing to train that week') && r.toasts[0] !== Q4)) bad.push('toasts ' + J(r.toasts));
  }
  row('R6N', bad, 1, 'snap to ' + want);
});

// ── R5 CONTROL HALF_MANNY and g203 (pair-scoped). The 210 NRC builds vs V222 are NRC0's; the pre-(c) comparison
// was a one-time proof (tests/measure/v223_testlen_r5_blast.js, output in tests/measure/v223_testlen_r5_blast.out.txt). ──
if(!PAIR) console.log('SCOPED OUT [' + TAG + '] ' + ROWS.R5 + ': the pair is candidate ' + VER + ', not ' + ERA + ' vs ' + PREV);
else guard('R5', () => {
  const bad = [];
  let hm = 'none'; { const R2 = globalThis.Date; globalThis.Date = RD0; try { hm = H.progDigest(H.load(ART).buildProgram(clone(H.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; } globalThis.Date = R2; }
  if(hm !== '0ac7da6b1691a8e1') bad.push('HALF_MANNY ' + hm + ' want 0ac7da6b1691a8e1');
  const g203 = process.env.G184_G203 || 'NO SUMMARY';
  if(g203 !== 'PASS 98 FAIL 0') bad.push('g203_mile_pencil.js ' + g203 + ' want PASS 98 FAIL 0');
  row('R5', bad, 2, 'HALF_MANNY ' + hm + '; g203 ' + g203 + ' (run once by the parent)');
});

// ── NRC0 blast radius vs V222 (pair-scoped) ──
if(!PAIR) console.log('SCOPED OUT [' + TAG + '] ' + ROWS.NRC0 + ': the pair is candidate ' + VER + ', not ' + ERA + ' vs ' + PREV);
else {
  const bad = []; let n = 0, distinct = 0, selfOk = 0;
  const BP = process.env.G184_BASE;
  if(!BP) bad.push('no V222 baseline (' + process.env.G184_BASE_WHY + '): a claim that did not run is not a pass');
  else {
    const B = mkVM(BP), seen = new Set();
    const one = (VM, o) => { setWD(VM, o); const g = gen(VM); return g.err ? 'ERR ' + g.err : H.progDigest(g.p); };
    for(const gid of ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base']) for(const exp of ['beginner', 'intermediate', 'advanced']) for(const mile of [null, 480]) for(const k of [4, 8, 12, 16, 20, 26, 30]){
      n++;
      const o = { primaryPath:'event', cardioTypes:['run'], experience:exp, ageBracket:'18-35', eventTargeted:true, raceDate:thuOfWeek(k), liftingFocus:'support_prevention',
        equipment:'crossfit', restDays:['sun','wed'], unit:'lbs', seed:4242, name:'M', cardioGoals:{ run:Object.assign({ id:gid, label:'x', paceUnit:'mi' }, mile ? { mileBestMins:'8', mileBestSecs:'00' } : {}) } };
      const b1 = one(B, o), b2 = one(B, o), c = one(V, o), tag = gid + ' ' + exp + ' mile ' + (mile ? '8:00' : 'none') + ' k' + k;
      if(!/^[0-9a-f]{16}$/.test(b1) || b1 !== b2){ bad.push(tag + ': the baseline does not equal itself ' + b1 + '/' + b2); continue; }
      selfOk++; seen.add(b1);
      if(c !== b1) bad.push(tag + ': ' + c + ' vs V222 ' + b1);
    }
    distinct = seen.size;
    if(distinct < 2) bad.push('the 210 baseline digests are not input-sensitive (' + distinct + ' distinct): an empty diff proves nothing');
  }
  n++;
  let hm = 'none'; { const R2 = globalThis.Date; globalThis.Date = RD0; try { hm = H.progDigest(H.load(ART).buildProgram(clone(H.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; } globalThis.Date = R2; }
  if(hm !== '0ac7da6b1691a8e1') bad.push('HALF_MANNY ' + hm + ' want 0ac7da6b1691a8e1');
  row('NRC0', bad, n, 'baseline ' + (process.env.G184_BASE_WHY || 'none') + '; baseline self-equal ' + selfOk + '/210, ' + distinct + ' distinct digests; HALF_MANNY ' + hm);
}

console.log('CHILD ' + TAG + ' PASS ' + cpass + ' FAIL ' + cfail);
