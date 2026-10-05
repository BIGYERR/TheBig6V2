// g223_d183_safepace.js — GATE for D183 (P-SAFEPACE): the goal is the athlete's, the coach says what the block reaches,
// one repaint, one week number.
//
//   node tests/gates/g223_d183_safepace.js <candidate.html>
//   IA_ASSUME_VERSION=223 node tests/gates/g223_d183_safepace.js <tree stamped 222>   (discrimination run only)
//
// THE RULING THIS DEFENDS: tests/measure/v223_rulings/p_safepace_ruling.md, R1 to R5, the AMENDMENT, "D183 AMENDMENT 2",
// "D183 AMENDMENT 3" and "D183 AMENDMENT 4 (BL1)". D-code D183, ships on ia-version 223. Standing ruling 4: every row's
// config is invariant under D184 (P-TESTLEN), built after D183 in the same version: every dated test sits inside the goal
// length (1 <= week <= len, and len >= 6 on every row here), and no row is a D25 snap case (every start week holds
// training days before the test). The `week > len` row (plan S7) is D184's by construction and is NOT in this gate.
//
// TIMEZONE. The parent spawns itself twice, under TZ=America/New_York and TZ=UTC, and sums the two children, as
// g223_d182_racedate.js does. 21:16 in New York is 01:16 UTC the next day, so a UTC date parse shows up as a wrong day.
// A child that dies or prints no CHILD summary is a named FAIL, never a silent zero.
//
// CLOCK. Each child pins the VM clock (Date() with no argument, and Date.now) to 2026-09-22 21:16 local, Mario's screen.
// Dated constructors are untouched.
//
// DOM. An id-keyed registry: getElementById returns one stub per id until the case resets it. The four nodes the
// repaint owns (#progLenLine, #paceDisplayLine, #paceFeasLine, #raceDateFeedback) are born holding a sentinel, so a node
// nobody painted is visible as such. An input stub takes its value attribute from the rendered HTML, as the browser does.
// Rendered text is #wizardBody with each painted id's stub innerHTML substituted in (the template's own content where the
// stub was never painted; nothing where the node is display:none), then SVG and tags stripped.
//
// ORACLES. Never asked of the engine:
//   Monday-week arithmetic by Date.UTC (day numbers, getUTCDay), cross-checked against a typed weekday table. Mario's
//   case: Mon Sep 21 to Mon Oct 19 is 4 weeks, so the test is in week 5; weeksUntil = floor(28/7) = 4.
//   The R1 inversion typed from the ruling: the 3/5/7 s/mi/week table, the 0.65/0.85 age scalers, the D9 defaults
//   690/570/450, "undo the +1 grace, the age multiplier and raw*1.25 + 4", and the 45 s/mi tolerance. Every row here is
//   18-35 (age multiplier 1.0); the oracle refuses any other bracket rather than type an unruled number.
//   The km lens is the ruling's own "720 s / 1.242 mi" for 2 km, i.e. 0.621 mi per km.
//   Coach's copy typed verbatim: R3's card sentences, R5's header, amendment 2 (a)/(b) sentences and amendment 3's
//   A2/A3/A4 sentences. Z1 proves the hand inversion and the typed sentence shapes reproduce every printed number.
//
// VERSION PREDICATE (standing rulings 2 and 4). D183 ships at 223.
//   below 223      REFUSED, every row FAILS by name.
//   223 and up     every row asserts, in both zones.
//   IA_ASSUME_VERSION=223 lifts a file stamped exactly 222 to 223 for a discrimination run. It is announced, and it is
//   ignored on any file not stamped exactly 222. gate.sh never sets it.
//
// ROWS (each printed once under [NY] and once under [UTC]). Pass 1 of 2; pass 2 appends at the marker below.
//   Z0    CONTROL  the child's zone is the one asked for, and the clock pin reaches the VM.
//   Z1    CONTROL  the hand oracles reproduce the ruling's printed numbers and coach's sentences.
//   T1    renderWizardStep on Mario's dated WD queues 0 timers; the source (comments stripped) holds no 80 ms timer.
//   T2    the same render, unflushed, paints #progLenLine, #raceDateFeedback and #paceDisplayLine over sentinels.
//   H168  measure's 168 edit sequences: after the lifted field handler and after the lifted date handler, the header
//         is "Program length: 5 weeks. Your test sets it.", the card opens "Your test is in week 5.", header == card,
//         no Recommended, no red, no button; the 21:17 screen (header 6, at least 11, red, 14:15) in 0/168.
//   S1    dated tw 5, mile 8:00, goal 10:30: --accent card, R3 sentence then amendment 2 (a)'s mile sentence.
//   S2    dated tw 5, no mile, intermediate, goal 12:00: --accent, R3 then amendment 2 (a)'s no-mile sentence.
//   S3    dated tw 5, beginner, goal 12:00 (with and without a stale mile in WD): --accent, R3 then amendment 2 (b).
//   S4    Mario, mile 8:00, goal 12:00, no gap: --run, exactly the R3 sentence, no reach anywhere on the step.
//   S5    dated tw 1 (test Fri 2026-09-25), mile 8:00, goal 10:30: header "1 week", --accent, R3's tw 1 sentence then
//         "In 1 week that reaches about 1.5 mi in 12:00".
//   S6    dated, test before the first training day (start Mon 2026-10-26, test 2026-10-20), gap: --signal, the null
//         sentence exactly, no reach anywhere on the step.
//   S8    undated, the #paceFeasLine frame: amendment 3's A2/A3/A4 sentences exactly, visible, --accent, no button,
//         no "safe".
//   S9    dated tw 5, 2 km in 8:30, mile 8:00: the sentence reads "2 km" with the hand numbers.
//   NS1   the name step's Program length row: "5 weeks" on Mario's WD, "1 week" on tw 1.
//   HM    CONTROL  HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version], row existence a
//         conjunct (V231 absorb ruling section 4), self-stable (ruled unmoved; standing ruling 5).
// Pass 2:
//   RN    R3 non-test: dated bike_century, N read from the header (R5's goal header typed around it), at diff +2, +1, 0,
//         -1 (--accent) and 1 week out (--red, "1 week is short"): R3's sentences and colours typed; under a week is the red
//         line. NRC HALF_MANNY WD: amendment 2 (e)'s two alignedStartCopy shapes, numbers by hand (the NRC half is 14 weeks).
//   L1    amendment 2 (f): "In N weeks" == the #progLenLine number, dated tw 5 and undated run+swim (header 12), and the
//         whole sentence equals the hand inversion at that N.
//   L1C   CONTROL  some L1 case has a header number different from run-only calcProgramLength (else L1 is vacuous).
//   K1    amendment 2 brought in (2): 2 km in 12:00 reads "12:00 is 9:40 per mile." inline, repainted and after the
//         targetDist handler; 1.5 mi reads 8:00.
//   SW1   amendment 2 (d): 500 in 7:00 reads "7:00 is 1:24 per 100 yd." (and "m") inline and from updateSwimPaceDisplay.
//   BL1   amendment 4: undated beginner, 1.5 mi, no time, baselineDist 1 -> 4 through the lifted run baseline handler:
//         sentinel replaced, header 9 -> 6 as coach printed, equal to a fresh full render at 4.
//   BL1C  CONTROL  the fresh header at 1 differs from the fresh header at 4 (a stale header is visible to BL1).
//   A3E   amendment 3: the past-date line (test and non-test) and the non-test under-a-week line: exactly 1 <svg,
//         var(--red), unframed, the ruled text.
//   B1    no <button in #raceDateFeedback or #paceFeasLine over the sweep; 0 applySuggestedPace, achievablePacePerMile,
//         secsToMMSS, "Use this pace" in the comment-stripped source.
//   M2    comment-stripped call sites: updatePaceFeasibility, updatePaceDisplay, assessRunPaceCeiling 1 each;
//         updateRaceDateFeedback 13 (builder plan S6's print).
//   M6    amendment 2 (e): 0 U+2014 and 0 " - " in the step's rendered text over the sweep, textContent-written nodes
//         (the mile advisory) included; the sweep's coverage is asserted family by family.
//   M6C   CONTROL  the predicate trips typed dashed strings and passes "6-week" and U+2013 ranges.
//   A3S   amendment 3: 0 "safe progression" over the sweep.
//   A3F   amendment 3: every framed #raceDateFeedback card and #paceFeasLine frame in the sweep: 0 <svg, 0 bare check.
// THE SWEEP (B1, M6, A3S, A3F read it): the 168 lattice after each handler (336), pass 1's R1 screens, RN's bike and
// NRC screens, L1, K1, SW1 and the swim panel (500 and 100 in yd and m, swim_tri), the five mile advisories (2:00, 4:10,
// 13:00, 30:00, 8:75) at render and through the lifted mile handlers, beginner, BL1, the seed banner (offer and
// applied), and A3E's entry-error lines.
// Every non-CONTROL row FAILS on V222 (IA_ASSUME_VERSION=223 base_v222.html) and PASSES on the D183 tree.
'use strict';
const path = require('path'), cp = require('child_process'), fs = require('fs');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 223;
// D187 (V225): the rate table this file's handReach() inverts is read live by assessRunPaceCeiling
// (R1's own "3/5/7 s/mi/week paceImprove table") -- the same function backing every R1 sentence
// this gate pins. D187 moved it to {3,3,2} at V225. Read the artifact's REAL stamped ia-version
// directly from its text (independent of the D183 ERA/IA_ASSUME_VERSION machinery below, which is
// a different, unrelated predicate) so IMPROVE stays the rate the artifact under test actually runs.
const RATE_STAMP = +((fs.readFileSync(ART, 'utf8').match(/<meta name="ia-version" content="(\d+)"/) || [])[1] || NaN);
// D188 P-BEGINNERMILE / D189 P-PACEDISCLOSE (V226, tests/measure/v226_rulings/d188_d189_ruling.md), keyed on the
// same real stamp (standing rulings 2 and 4). D188 E1 reads a beginner's mile like anyone's (the hand oracle's
// `exp !== 'beginner' && mileSecs` -> `mileSecs`); E2 retires the beginner sentence so a beginner takes the
// generic form (Mario (b)); D189 F5/F6: while the mile is required and blank (intermediate/advanced pace goal)
// the feasibility line and the dated card's reach go quiet and a dated test pin keeps its week in the header.
const D188_STAMP = RATE_STAMP >= 226;
const ZONES = [['NY', 'America/New_York'], ['UTC', 'UTC']];
const ZONE_ENV = 'G223_D183_ZONE';

const ROWS = {
  Z0: 'Z0 CONTROL: the child runs in the zone the parent asked for, and the clock pin (2026-09-22 21:16 local) reaches the VM',
  Z1: 'Z1 CONTROL: the hand oracles reproduce the ruling\'s printed numbers (week 5, weeksUntil 4, 12:00, 14:15, 17:15, 11:35, 11:38, 13:53, 16:53, 9:40, 1:24; L12/A2/A3 re-derived for D187\'s rate, V225) and coach\'s sentences',
  T1: 'T1 renderWizardStep on Mario\'s dated WD queues 0 timers, and the source (comments stripped) holds no updateRaceDateFeedback 80 ms timer',
  T2: 'T2 the same render, unflushed, paints #progLenLine, #raceDateFeedback and #paceDisplayLine over seeded sentinels',
  H168: 'H168 168 edit sequences, field handler then date handler lifted from the rendered HTML: header "Program length: 5 weeks. Your test sets it." == card "Your test is in week 5." after each, no Recommended, red or button; the 21:17 screen 0/168',
  S1: 'S1 dated tw 5, mile 8:00, goal 10:30: --accent card, R3 sentence then "Your mile is 8:00. In 5 weeks that reaches about 1.5 mi in 12:00. ..."',
  S2: D188_STAMP ? 'S2 dated tw 5, no mile, intermediate, goal 12:00, D189 F5/F6 required and blank: --run card, the R3 sentence alone, no reach on the step, header keeps the test week'
                 : 'S2 dated tw 5, no mile, intermediate, goal 12:00: --accent card, R3 sentence then the no-mile sentence (9:30 default, 14:15)',
  S3: D188_STAMP ? 'S3 dated tw 5, beginner, goal 12:00: no mile --accent card, R3 sentence then the generic beginner sentence (11:30 default, 17:15, D188 E2); mile 8:00 is read (D188 E1), no gap, --run card, the R3 sentence alone'
                 : 'S3 dated tw 5, beginner, goal 12:00, with and without a stale mile in WD: --accent card, R3 sentence then the beginner sentence (11:30 default, 17:15)',
  S4: 'S4 Mario, mile 8:00, goal 12:00, no gap: --run card, exactly "Your test is in week 5. The program ends on it. The taper lands in front of it.", no reach on the step',
  S5: 'S5 dated tw 1 (test Fri 2026-09-25), mile 8:00, goal 10:30: header "1 week", --accent card, R3 tw 1 sentence then "In 1 week that reaches about 1.5 mi in 12:00"',
  S6: 'S6 dated, test before the first training day (start 2026-10-26, test 2026-10-20), with a gap: --signal card, the null sentence exactly, no reach on the step',
  S8: D188_STAMP ? 'S8 undated #paceFeasLine frame: A2 and A4 (D188 generic beginner form) exactly, visible, --accent, no button, no "safe"; A3 required and blank, the frame empty and hidden (D189 F6)'
                 : 'S8 undated #paceFeasLine frame: amendment 3 A2/A3/A4 sentences exactly, visible, --accent, no button, no "safe"',
  S9: 'S9 dated tw 5, 2 km in 8:30, mile 8:00: --accent card, the sentence reads "2 km" with the hand numbers',
  NS1: 'NS1 the name step\'s Program length row reads "5 weeks" on Mario\'s WD and "1 week" on tw 1',
  HM: 'HM CONTROL: HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version] (row present), self-stable',
  // ── pass 2 ──
  RN: 'RN R3 non-test: dated bike_century (N from the header) at diff +2, +1, 0, -1 and 1 week out reads R3\'s sentences and colours, under a week is the red line; NRC HALF_MANNY WD reads amendment 2 (e)\'s two alignedStartCopy shapes',
  L1: 'L1 amendment 2 (f): the sentence\'s "In N weeks" is the #progLenLine number (dated tw 5; undated run+swim), and the sentence is the hand inversion at that N',
  L1C: 'L1C CONTROL: some L1 case has a header number different from run-only calcProgramLength, so L1 can see a run-only L',
  K1: 'K1 amendment 2 brought in (2): 2 km in 12:00 reads "12:00 is 9:40 per mile." inline, repainted and after the targetDist handler; 1.5 mi reads "12:00 is 8:00 per mile."',
  SW1: 'SW1 amendment 2 (d): 500 in 7:00 reads "7:00 is 1:24 per 100 yd." and "7:00 is 1:24 per 100 m." inline and from updateSwimPaceDisplay',
  BL1: 'BL1 amendment 4: undated beginner, 1.5 mi, no time, baselineDist 1 -> 4 through the lifted run baseline handler: sentinel replaced, header 9 -> 6, equal to a fresh full render',
  BL1C: 'BL1C CONTROL: the fresh header at baselineDist 1 differs from the fresh header at 4, so a stale header is visible to BL1',
  A3E: 'A3E amendment 3: the past-date line (test and non-test goal) and the non-test under-a-week line carry exactly 1 <svg and var(--red), unframed, with their ruled text',
  B1: 'B1 no <button in #raceDateFeedback or #paceFeasLine over the sweep, and the comment-stripped source holds 0 applySuggestedPace, achievablePacePerMile, secsToMMSS, "Use this pace"',
  M2: 'M2 comment-stripped call sites: updatePaceFeasibility, updatePaceDisplay, assessRunPaceCeiling 1 each, updateRaceDateFeedback 13',
  M6: 'M6 amendment 2 (e): 0 U+2014 and 0 spaced hyphen in the cardio step\'s rendered text (textContent-written nodes included) over the whole sweep, every listed state family present',
  M6C: 'M6C CONTROL: the M6 predicate trips typed dashed strings and passes compound numerals and U+2013 ranges',
  A3S: 'A3S amendment 3: 0 "safe progression" in the rendered step text over the sweep',
  A3F: 'A3F amendment 3: every framed #raceDateFeedback card and #paceFeasLine frame in the sweep carries 0 <svg and 0 bare check',
};
const ROW_KEYS = Object.keys(ROWS);
const CONTROLS = new Set(['Z0', 'Z1', 'HM', 'L1C', 'BL1C', 'M6C']);
const isControl = key => CONTROLS.has(key);

// ═════════════════════════════════════════════ PARENT ═════════════════════════════════════════════
if(!process.env[ZONE_ENV]){
  let pass = 0, fail = 0;
  const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
  const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
  let STAMP = NaN;
  try { STAMP = +H.load(ART).version; } catch(e){ ok('boot: the candidate loads in the harness', false, e.message); done(); }
  let VER = STAMP;
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  }
  console.log('g223 D183 safepace | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));
  if(!(VER >= ERA)){
    console.log('REFUSED: ia-version ' + VER + ' predates D183 P-SAFEPACE (V' + ERA + '). No row may pass on it.');
    for(const [tag] of ZONES) for(const k of ROW_KEYS) ok('[' + tag + '] ' + ROWS[k] + ' (REFUSED)', false);
    done();
  }
  for(const [tag, tz] of ZONES){
    console.log('\n-- TZ=' + tz + ' [' + tag + '] --');
    const r = cp.spawnSync(process.execPath, [__filename, ART], { env: Object.assign({}, process.env, { TZ: tz, [ZONE_ENV]: tag }), encoding: 'utf8', maxBuffer: 1 << 26 });
    const out = r.stdout || '';
    for(const line of out.split('\n')){
      const m = /^(PASS|FAIL) (\[(\w+)\] (\w+) .*)$/.exec(line);
      if(m){ if(m[3] === tag && ROWS[m[4]]) (m[1] === 'PASS' ? pass++ : fail++); console.log(line); }
      else if(line.trim() && !/^CHILD /.test(line)) console.log('  ' + line);
    }
    if(r.stderr && r.stderr.trim()) console.log('  stderr: ' + r.stderr.trim().split('\n').slice(-4).join(' | '));
    const s = /^CHILD (\w+) PASS (\d+) FAIL (\d+)\s*$/m.exec(out);
    const seen = ROW_KEYS.filter(k => new RegExp('^(PASS|FAIL) \\[' + tag + '\\] ' + k + ' ', 'm').test(out));
    ok('[' + tag + '] child under TZ=' + tz + ' ran every row and printed its CHILD summary (exit ' + r.status + ')',
       !!s && s[1] === tag && seen.length === ROW_KEYS.length && +s[2] + +s[3] === ROW_KEYS.length,
       (s ? s[0] : 'no CHILD summary') + '; rows seen ' + seen.length + '/' + ROW_KEYS.length);
  }
  done();
}

// ═════════════════════════════════════════════ CHILD ══════════════════════════════════════════════
const TAG = process.env[ZONE_ENV];
let cpass = 0, cfail = 0;
function row(key, bad, total, note){
  const label = '[' + TAG + '] ' + ROWS[key];
  const good = bad.length === 0 && total > 0;
  if(good){ cpass++; console.log('PASS ' + label + ' (' + total + '/' + total + ' cells' + (note ? '; ' + note : '') + ')'); }
  else { cfail++; console.log('FAIL ' + label + ' (' + (total - bad.length) + '/' + total + ' cells; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '') + ')'); }
}
const J = v => JSON.stringify(v);
const tryDo = f => { try { return f(); } catch(e){ return { crash: e.message }; } };

// ── the hand oracles ──────────────────────────────────────────────────────────────────────────────
const RD = Date;
const ymd = s => s.split('-').map(Number);
const dayNo = iso => { const [y, m, d] = ymd(iso); return RD.UTC(y, m - 1, d) / 864e5; };
const dow = iso => { const [y, m, d] = ymd(iso); return new RD(RD.UTC(y, m - 1, d)).getUTCDay(); };   // 0 = Sun
const monNo = iso => dayNo(iso) - ((dow(iso) + 6) % 7);                                            // the Monday of iso's week
const WD3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Program week of the test: week 1 holds the start; null when the test day falls before the start day.
const handWeek = (startIso, testIso) => dayNo(testIso) < dayNo(startIso) ? null : (monNo(testIso) - monNo(startIso)) / 7 + 1;
const handWeeksUntil = (todayIso, testIso) => Math.floor((dayNo(testIso) - dayNo(todayIso)) / 7);
// Typed weekday table (from 2026-01-01 = Thu, counted by hand).
const WEEKDAY_TABLE = { '2026-09-21':'Mon', '2026-09-22':'Tue', '2026-09-25':'Fri', '2026-10-19':'Mon', '2026-10-20':'Tue', '2026-10-26':'Mon' };

// mm:ss, whole value rounded first (typed here; the engine's _clkMS is never called).
const clk = sec => { const t = Math.round(sec); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
// R1 inversion, typed from the ruling. D187 (V225): Mario ruled T1 {3,3,2} on 2026-09-23; the
// old {3,5,7} (V176 D9, R1's own "3/5/7 s/mi/week paceImprove table") is the ruled rate on every
// artifact BEFORE that ship. Era-gated by the artifact's REAL stamp, exactly as
// g202_pace_anchor.js's EXP_IMPROVE_BY_VERSION and g202_pace_copy.js's RATE_BY_VERSION are.
const IMPROVE = RATE_STAMP >= 225
  ? { beginner: 3, intermediate: 3, advanced: 2 }    // D187 (V225)
  : { beginner: 3, intermediate: 5, advanced: 7 };   // V176 (D9), pre-D187
const AGE_SCALE = { '18-35': 1.0, '36-54': 0.85, '55+': 0.65 };           // "the 0.65/0.85 age scalers"
const DEFAULT_MILE = { beginner: 690, intermediate: 570, advanced: 450 }; // D9 (R1: "690/570/450")
const TOLERANCE = 45;                                                     // R1: "the 45 s/mi tolerance ... stays as is"
const KM_MI = 0.621;                                                      // amendment 2 brought in (2): "720 s / 1.242 mi" for 2 km
function handReach(L, exp, age, mileSecs, dist, unit, goalSecs){
  if(age !== '18-35') throw new Error('hand oracle: age multiplier for ' + age + ' is not typed from the ruling');
  const ageMult = 1.0;                                                    // 18-35 only (see above)
  const cur = (D188_STAMP ? mileSecs : (exp !== 'beginner' && mileSecs)) ? mileSecs : DEFAULT_MILE[exp];   // D188 E1 from 226
  const improvingWeeks = Math.max(0, ((L - 1) / ageMult - 4) / 1.25);     // undo the +1 grace, the age multiplier, raw*1.25 + 4
  const rate = +(IMPROVE[exp] * AGE_SCALE[age]).toFixed(2);
  const ach = cur - improvingWeeks * rate;
  const mi = unit === 'km' ? dist * KM_MI : dist;
  const tPace = goalSecs / mi;
  return { L, cur, ach, total: ach * mi, tPace, gap: ach - tPace, shows: tPace < cur && ach - tPace >= TOLERANCE,
           fromMile: D188_STAMP ? !!mileSecs : (exp !== 'beginner' && !!mileSecs), exp, distLabel: dist + ' ' + unit, goalSecs };
}
const wk = L => L + (L === 1 ? ' week' : ' weeks');                      // amendment 2 (a): digits, singular at 1
// Amendment 2 (a)/(b) sentence shapes, typed.
function handSentence(r){
  const reach = ' In ' + wk(r.L) + ' that reaches about ' + r.distLabel + ' in ' + clk(r.total) + '. Your goal is ' + clk(r.goalSecs) + '.';
  if(r.fromMile) return 'Your mile is ' + clk(r.cur) + '.' + reach + ' Keep it or change it above.';
  if(!D188_STAMP && r.exp === 'beginner') return 'Your paces start from the beginner default of ' + clk(r.cur) + ' per mile.' + reach + ' Keep it or change it above.';   // retired by D188 E2 from 226
  return 'You have not entered a mile time. The ' + r.exp + ' default is ' + clk(r.cur) + ' per mile.' + reach + ' Enter your mile above and this updates.';
}
// Coach's copy, verbatim.
const V = {
  S1: 'Your mile is 8:00. In 5 weeks that reaches about 1.5 mi in 12:00. Your goal is 10:30. Keep it or change it above.',                                              // amendment 2 (a)
  S2: 'You have not entered a mile time. The intermediate default is 9:30 per mile. In 5 weeks that reaches about 1.5 mi in 14:15. Your goal is 12:00. Enter your mile above and this updates.',   // amendment 2 (a)
  S3: D188_STAMP
    ? 'You have not entered a mile time. The beginner default is 11:30 per mile. In 5 weeks that reaches about 1.5 mi in 17:15. Your goal is 12:00. Enter your mile above and this updates.'   // D188 E2 / Mario (b): D183's generic form at the hand L5 numbers
    : 'Your paces start from the beginner default of 11:30 per mile. In 5 weeks that reaches about 1.5 mi in 17:15. Your goal is 12:00. Keep it or change it above.',   // amendment 2 (b)
  A2: 'Your mile is 8:00. In 11 weeks that reaches about 1.5 mi in 11:38. Your goal is 9:30. Keep it or change it above.',                                              // amendment 3 After A2, re-derived for D187 (V225): intermediate rate 5 -> 3 s/mi/wk
  A3: 'You have not entered a mile time. The intermediate default is 9:30 per mile. In 11 weeks that reaches about 1.5 mi in 13:53. Your goal is 10:30. Enter your mile above and this updates.', // A3, re-derived for D187 (V225): intermediate rate 5 -> 3 s/mi/wk
  A4: D188_STAMP
    ? 'You have not entered a mile time. The beginner default is 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 12:00. Enter your mile above and this updates.'   // D188/D189 Copy "Feasibility, beginner no mile", verbatim
    : 'Your paces start from the beginner default of 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 12:00. Keep it or change it above.',  // A4
};
const CARD_TW = w => 'Your test is in week ' + w + '. The program ends on it. The taper lands in front of it.';                       // R3 _tw >= 2
const CARD_TW1 = 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.';                      // R3 _tw == 1
const CARD_NULL = 'Your test is before your first training day. This program starts after it and does not include it.';             // AMENDMENT R3 null row
const HDR_TEST = n => 'Program length: ' + wk(n) + '. Your test sets it.';                                                            // R5 dated test goal
const REACH_TOKEN = 'that reaches about';
const TODAY = '2026-09-22', TEST = '2026-10-20', TEST_TW1 = '2026-09-25', START_AFTER = '2026-10-26';

// ── comment stripper: lifted verbatim from tests/gates/g221_d178_active.js (itself from g220_d173) ──
const BS = String.fromCharCode(92);
function stripComments(src){
  const out = [], n = src.length, tpl = [];
  let i = 0, depth = 0, prevSig = '', prevWord = '';
  const RX_PREV = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
  const RX_WORDS = new Set(['return','typeof','case','do','else','in','of','new','delete','void','throw','instanceof','yield','await']);
  const readTemplate = () => {
    while(i < n){ const c = src[i];
      if(c === BS){ out.push(src.substr(i, 2)); i += 2; continue; }
      if(c === '`'){ out.push(c); i++; return; }
      if(c === '$' && src[i + 1] === '{'){ out.push('${'); i += 2; tpl.push(depth); depth++; return; }
      out.push(c); i++; } };
  while(i < n){
    const c = src[i], d = src[i + 1];
    if(c === '/' && d === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(c === '/' && d === '*'){ const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; out.push(' '); continue; }
    if(c === "'" || c === '"'){ let j = i + 1; while(j < n && src[j] !== c && src[j] !== '\n'){ if(src[j] === BS) j++; j++; }
      out.push(src.slice(i, j + 1)); i = j + 1; prevSig = c; prevWord = ''; continue; }
    if(c === '`'){ out.push(c); i++; readTemplate(); prevSig = '`'; prevWord = ''; continue; }
    if(c === '{'){ depth++; out.push(c); i++; prevSig = c; prevWord = ''; continue; }
    if(c === '}'){ depth--; out.push(c); i++; prevWord = '';
      if(tpl.length && tpl[tpl.length - 1] === depth){ tpl.pop(); readTemplate(); prevSig = '`'; } else prevSig = '}'; continue; }
    if(c === '/'){
      if(prevSig === '' || prevSig === '}' || RX_PREV.has(prevSig) || RX_WORDS.has(prevWord)){
        let j = i + 1, cls = false;
        while(j < n && src[j] !== '\n'){ const x = src[j]; if(x === BS){ j += 2; continue; }
          if(cls){ if(x === ']') cls = false; } else if(x === '[') cls = true; else if(x === '/') break; j++; }
        j++; while(j < n && /[a-z]/i.test(src[j])) j++;
        out.push(src.slice(i, j)); i = j; prevSig = 'r'; prevWord = ''; continue; }
      out.push(c); i++; prevSig = c; prevWord = ''; continue; }
    if(/[A-Za-z0-9_$]/.test(c)){ let j = i; while(j < n && /[A-Za-z0-9_$]/.test(src[j])) j++; const w = src.slice(i, j);
      out.push(w); i = j; prevWord = w; prevSig = 'w'; continue; }
    out.push(c); i++; if(!/\s/.test(c)){ prevSig = c; prevWord = ''; }
  }
  return out.join('');
}

// ── the VM: one per child, an id-keyed DOM, the clock pinned ──────────────────────────────────────
const IA = H.load(ART);
const doc = IA.window.document, reg = new Map(), baseGet = doc.getElementById;
const PAINTED = ['progLenLine', 'paceDisplayLine', 'paceFeasLine', 'raceDateFeedback'];
const SENT = id => 'G223SENTINEL:' + id, SENT_DISP = 'G223SENTINEL';
const bodyHTML = () => reg.has('wizardBody') ? String(reg.get('wizardBody').innerHTML || '') : '';
const openTagRe = id => new RegExp('<(\\w+)\\b[^>]*\\bid="' + id + '"[^>]*>');
doc.getElementById = function(id){
  if(!reg.has(id)){
    const el = baseGet.call(doc, id); el.id = id; const cls = new Set();
    el.classList = { add: c => cls.add(c), remove: c => cls.delete(c), toggle: (c, f) => ((f === undefined ? !cls.has(c) : f) ? cls.add(c) : cls.delete(c)), contains: c => cls.has(c) };
    if(PAINTED.includes(id)){ el.innerHTML = SENT(id); el.style.display = SENT_DISP; }
    const tag = openTagRe(id).exec(bodyHTML()); if(tag){ const v = /\bvalue="([^"]*)"/.exec(tag[0]); if(v) el.value = v[1]; }
    reg.set(id, el);
  }
  return reg.get(id);
};
const seed = () => { for(const id of PAINTED){ const el = doc.getElementById(id); el.innerHTML = SENT(id); el.style.display = SENT_DISP; } };
const painted = id => reg.has(id) && reg.get(id).innerHTML !== SENT(id);
const inBody = id => openTagRe(id).test(bodyHTML());
IA.eval('showToast = function(){}');
(function pin(){ const T = new RD(2026, 8, 22, 21, 16, 0).getTime();
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; })();

// Rendered HTML of the step: #wizardBody with every painted id's live content substituted in.
function composedHTML(){
  let b = bodyHTML();
  for(const id of PAINTED){
    const m = new RegExp('(<(\\w+)\\b[^>]*\\bid="' + id + '"[^>]*>)([\\s\\S]*?)(</\\2>)').exec(b); if(!m) continue;
    const el = reg.get(id), dispSet = !!el && el.style.display !== SENT_DISP;
    const hidden = dispSet ? el.style.display === 'none' : /display:\s*none/.test(m[1]);
    const inner = hidden ? '' : (el && painted(id) ? String(el.innerHTML) : m[3]);
    b = b.slice(0, m.index) + m[1] + inner + m[4] + b.slice(m.index + m[0].length);
  }
  return b;
}
const txt = h => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<\/?(?:div|p|br|li|ul|ol|h\d|section)\b[^>]*>/gi, ' ')
  .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const nodeHTML = id => { const m = new RegExp('(<(\\w+)\\b[^>]*\\bid="' + id + '"[^>]*>)([\\s\\S]*?)(</\\2>)').exec(composedHTML()); return m ? m[3] : null; };
const headerOf = t => { const m = /Program length: \d+ weeks?\.?[^.]*\./.exec(t); return m ? m[0] : null; };
const colorOf = h => { const m = /^\s*<div style="color:(var\(--[\w-]+\))/.exec(String(h || '')); return m ? m[1] : null; };
// A painted node's whole content (nodeHTML's lazy match stops at the first nested close tag, so a button appended after
// the card's reach <div> would be invisible to it); '' when hidden, the template's content when never painted.
function liveNode(id){
  const t = openTagRe(id).exec(bodyHTML()); if(!t) return null; const el = reg.get(id);
  const hidden = (el && el.style.display !== SENT_DISP) ? el.style.display === 'none' : /display:\s*none/.test(t[0]);
  return hidden ? '' : (el && painted(id)) ? String(el.innerHTML) : nodeHTML(id);
}
function screen(){
  const all = composedHTML(), card = liveNode('raceDateFeedback'), feas = liveNode('paceFeasLine');
  return { all, text: txt(all), header: headerOf(txt(all)), card, cardText: txt(card), cardColor: colorOf(card), feas, feasText: txt(feas) };
}

// ── WD cases ──
// The boot WD carries startDate from the host clock at load (before the pin). The wizard opened on Mario's day starts
// today, so BASE pins startDate to the typed TODAY: the measure's state (it booted under its pinned clock).
const BOOT_WD = IA.eval('JSON.stringify(WD)');
const BASE = { primaryPath:'event', cardioTypes:['run'], experience:'intermediate', ageBracket:'18-35', eventTargeted:true, raceDate:TEST,
  liftingFocus:'support_prevention', equipment:'crossfit', restDays:['sun','wed'], unit:'lbs', seed:4242, name:'M', startDate:TODAY };
const mileOf = s => ({ mileBestMins: String(Math.floor(s / 60)), mileBestSecs: String(s % 60).padStart(2, '0') });
const goalOf = s => ({ targetMins: String(Math.floor(s / 60)), targetSecs: String(s % 60).padStart(2, '0'), targetTime: clk(s) });
const runGoal = o => Object.assign({ id:'run_pace_goal', label:'Hit a Pace / Time Goal', targetDist:'1.5', paceUnit:'mi' }, o || {});
function setWD(over, run){ const wd = Object.assign(JSON.parse(BOOT_WD), BASE, over || {}); wd.cardioGoals = { run: runGoal(run) };
  IA.eval('WD = ' + JSON.stringify(wd) + ';'); }
function renderStep(step, flush){ reg.clear(); IA.eval('wizardStep = WIZARD_STEPS.indexOf(' + J(step) + '); renderWizardStep();'); if(flush) IA.flushTimers(); }
function drain(){ for(let k = 0; k < 20 && IA.flushTimers() > 0; k++); }
function lifted(re){ const all = []; let m; const g = new RegExp(re.source, 'g'); while((m = g.exec(bodyHTML()))) all.push(m[1]); return all; }
function runHandler(code, thisObj){ IA.ctx.__G223_THIS = thisObj; IA.eval('(function(){' + code + '}).call(__G223_THIS)'); }

// ── Z0 zone and clock ──
{ const bad = []; const off = (y, m, d) => new RD(y, m - 1, d, 12).getTimezoneOffset();
  if(TAG === 'NY'){ if(!(off(2026, 9, 22) === 240 && off(2026, 12, 1) === 300)) bad.push('NY offsets ' + off(2026, 9, 22) + '/' + off(2026, 12, 1) + ' (want 240/300)'); }
  else if(!(off(2026, 9, 22) === 0 && off(2026, 12, 1) === 0)) bad.push('UTC offsets ' + off(2026, 9, 22) + '/' + off(2026, 12, 1) + ' (want 0/0)');
  const got = IA.eval('(function(){ const d = new Date(); return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), Date.now() === d.getTime()].join(","); })()');
  if(got !== '2026,9,22,21,16,true') bad.push('VM clock ' + got + ' (want 2026,9,22,21,16,true)');
  row('Z0', bad, 2, 'TZ=' + process.env.TZ); }

// ── Z1 hand oracles against the ruling's printed numbers ──
{ const bad = []; let n = 0; const eq = (lbl, got, want) => { n++; if(got !== want) bad.push(lbl + ' ' + J(got) + ' want ' + J(want)); };
  for(const [iso, w] of Object.entries(WEEKDAY_TABLE)) eq('weekday ' + iso, WD3[dow(iso)], w);
  eq('Mario week (R3 "week 5")', handWeek(TODAY, TEST), 5);
  eq('Mario weeksUntil (F5 "floor(28/7) = 4")', handWeeksUntil(TODAY, TEST), 4);
  eq('tw 1 week', handWeek(TODAY, TEST_TW1), 1);
  eq('test before start', handWeek(START_AFTER, TEST), null);
  const r1 = handReach(5, 'intermediate', '18-35', 480, 1.5, 'mi', 630);
  eq('mile 8:00 goal 10:30 L5 reach', clk(r1.total), '12:00'); eq('gap', Math.round(r1.gap), 60); eq('S1 sentence', handSentence(r1), V.S1);
  const r2 = handReach(5, 'intermediate', '18-35', null, 1.5, 'mi', 720);
  eq('no mile intermediate L5 reach', clk(r2.total), '14:15'); eq('gap', Math.round(r2.gap), 90); eq('S2 sentence', handSentence(r2), V.S2);
  const r3 = handReach(5, 'beginner', '18-35', D188_STAMP ? null : 480, 1.5, 'mi', 720);   // D188 (V226): a beginner's mile is read, so S3's 17:15 is the no-mile beginner
  eq(D188_STAMP ? 'beginner L5 reach (no mile, D188)' : 'beginner L5 reach (mile ignored)', clk(r3.total), '17:15'); eq('gap', Math.round(r3.gap), 210); eq('S3 sentence', handSentence(r3), V.S3);
  if(D188_STAMP){ const r3m = handReach(5, 'beginner', '18-35', 480, 1.5, 'mi', 720);
    eq('D188 beginner 8:00 L5 reach (mile read)', clk(r3m.total), '12:00'); eq('D188 beginner 8:00 goal 12:00 shows no gap', r3m.shows, false); }
  eq('tw 1 L1 reach', clk(handReach(1, 'intermediate', '18-35', 480, 1.5, 'mi', 630).total), '12:00');
  eq('L12 goal 9:30', clk(handReach(12, 'intermediate', '18-35', 480, 1.5, 'mi', 570).total), '11:35');   // D187 (V225): was 11:18 at rate 5, re-derived at rate 3
  const a2 = handReach(11, 'intermediate', '18-35', 480, 1.5, 'mi', 570), a3 = handReach(11, 'intermediate', '18-35', null, 1.5, 'mi', 630), a4 = handReach(11, 'beginner', '18-35', null, 1.5, 'mi', 720);
  eq('A2 L11 goal 9:30', clk(a2.total), '11:38'); eq('A2 sentence', handSentence(a2), V.A2);
  eq('A3 L11 no mile 10:30', clk(a3.total), '13:53'); eq('A3 sentence', handSentence(a3), V.A3);
  eq('A4 L11 beginner 12:00', clk(a4.total), '16:53'); eq('A4 sentence', handSentence(a4), V.A4);
  eq('amendment 3 safeTotals 698/833/1013 (D187 V225, was 684/819/1013)', [a2, a3, a4].map(r => Math.round(r.total)).join('/'), '698/833/1013');
  eq('Mario 12:00 no gap', handReach(5, 'intermediate', '18-35', 480, 1.5, 'mi', 720).shows, false);
  eq('km label 2 km in 12:00', clk(720 / (2 * KM_MI)), '9:40');
  eq('swim label 500 yd in 7:00', clk(420 / (500 / 100)), '1:24');
  row('Z1', bad, n); }

// ── T1 / T2: one render of Mario's dated WD, no flush ──
{ const b1 = [], b2 = [];
  setWD({}, Object.assign(mileOf(480), goalOf(720))); drain(); reg.clear(); seed();
  const r = tryDo(() => { IA.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep();'); return true; });
  if(r !== true) { b1.push('render crashed ' + J(r)); b2.push('render crashed ' + J(r)); }
  for(const id of ['progLenLine', 'raceDateFeedback', 'paceDisplayLine']){
    if(!inBody(id)) b2.push('#' + id + ' is not in the rendered step');
    else if(!painted(id)) b2.push('#' + id + ' still holds its sentinel');
  }
  const queued = IA.flushTimers();
  if(queued !== 0) b1.push('the render queued ' + queued + ' timer(s)');
  const src = stripComments(IA.js);
  const t80 = (src.match(/updateRaceDateFeedback\(?\)?\s*,\s*80\s*\)/g) || []).length;
  const tAny = (src.match(/setTimeout\(\s*(?:\(\s*\)\s*=>\s*)?updateRaceDateFeedback\b/g) || []).length;
  if(t80 || tAny) b1.push('source holds ' + t80 + ' ", 80)" timer(s) and ' + tAny + ' setTimeout(updateRaceDateFeedback) call(s)');
  row('T1', b1, 2); row('T2', b2, 3); }

// ── H168: measure's lattice, lifted handlers ──
{ const bad = []; let n = 0, sig = 0, eqHC = 0;
  const W = handWeek(TODAY, TEST), HDR = HDR_TEST(W), OPEN = 'Your test is in week ' + W + '.';
  const FIELDS = ['mileBestMins', 'mileBestSecs', 'targetMins', 'targetSecs'];
  const VALS = ['', '0', '1', '5', '7', '8', '9', '10', '11', '12', '13', '14', '30', '45'];
  const check = (tag, after) => {
    n++; const b = [];
    for(const id of ['progLenLine', 'raceDateFeedback']) if(!inBody(id) || !painted(id)) b.push('#' + id + ' sentinel');
    const pd = reg.get('paceDisplayLine'); if(!(painted('paceDisplayLine') || (pd && pd.style.display === 'none'))) b.push('#paceDisplayLine sentinel');
    const s = screen(); const hN = s.header && +(/: (\d+) week/.exec(s.header) || [])[1], cN = +(/^Your test is in week (\d+)\./.exec(s.cardText) || [])[1];
    if(s.header !== HDR) b.push('header ' + J(s.header));
    if(s.cardText.indexOf(OPEN) !== 0) b.push('card ' + J(s.cardText.slice(0, 60)));
    if(hN && hN === cN) eqHC++; else b.push('header ' + hN + ' != card ' + cN);
    if(/Recommended/.test(s.card || '') || /var\(--red\)/.test(s.card || '') || /<button/.test(s.card || '')) b.push('Recommended/red/button on the card');
    if(hN === 6 && /Recommended: at least 11/.test(s.cardText) && s.cardColor === 'var(--red)' && /14:15/.test(s.cardText)) { sig++; b.push('the 21:17 screen'); }
    if(b.length) bad.push(tag + ' after ' + after + ': ' + b.join(', '));
  };
  for(const base of [null, 720, 780]) for(const field of FIELDS) for(const val of VALS){
    const tag = (base ? clk(base) : 'blank') + ' ' + field + '=' + J(val);
    const r = tryDo(() => {
      setWD({}, Object.assign(mileOf(480), base ? goalOf(base) : {})); renderStep('cardio_goal', true);
      const fh = lifted(new RegExp('oninput="(WD\\.cardioGoals\\[\'run\'\\]\\.' + field + '=this\\.value;[^"]*)"'));
      if(!fh.length) return 'no ' + field + ' handler in the rendered step';
      seed(); runHandler(fh[0], { value: val }); check(tag, field + ' handler');
      const dt = openTagRe('raceDateInput').exec(bodyHTML()), dh = dt && /\boninput="([^"]*)"/.exec(dt[0]);
      if(!dh) return 'no date handler in the rendered step';
      const inp = doc.getElementById('raceDateInput'); inp.value = TEST;
      seed(); runHandler(dh[1], inp); check(tag, 'date handler');
      return true;
    });
    if(r !== true) { n += 2; bad.push(tag + ' ' + J(r)); }
  }
  row('H168', bad, n, 'header == card ' + eqHC + '/' + n + ', 21:17 screen ' + sig + '/168'); }

// ── R1 sentence table (one bad entry per failing cell, so the cell count is honest) ──
function cardCase(over, run){ setWD(over, run); renderStep('cardio_goal', true); return screen(); }
function cardMsgs(s, color, text, header){
  const m = [];
  if(s.cardColor !== color) m.push('colour ' + J(s.cardColor) + ' want ' + color);
  if(s.cardText !== text) m.push('card ' + J(s.cardText) + ' want ' + J(text));
  if(header !== undefined && s.header !== header) m.push('header ' + J(s.header) + ' want ' + J(header));
  return m;
}
const cell = (bad, lbl, msgs) => { if(msgs.length) bad.push(lbl + ': ' + msgs.join('; ')); };
const W5 = handWeek(TODAY, TEST);
{ const bad = [];
  const s = tryDo(() => cardCase({}, Object.assign(mileOf(480), goalOf(630))));
  cell(bad, 'S1', s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--accent)', CARD_TW(W5) + ' ' + V.S1, HDR_TEST(W5)));
  row('S1', bad, 1); }
{ const bad = [];
  const s = tryDo(() => cardCase({}, goalOf(720)));
  if(D188_STAMP){   // D189 F5/F6: required and blank; the dated card quotes no reach (S4's no-gap shape), the header keeps the test week
    const m = s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--run)', CARD_TW(W5), HDR_TEST(W5));
    if(!s.crash && s.text.indexOf(REACH_TOKEN) >= 0) m.push('a reach sentence on the step');
    cell(bad, 'S2', m);
  } else
  cell(bad, 'S2', s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--accent)', CARD_TW(W5) + ' ' + V.S2, HDR_TEST(W5)));
  row('S2', bad, 1); }
{ const bad = [];
  for(const [lbl, run] of [['no mile', goalOf(720)], ['stale mile 8:00', Object.assign(mileOf(480), goalOf(720))]]){
    const s = tryDo(() => cardCase({ experience:'beginner' }, run));
    if(D188_STAMP && lbl !== 'no mile'){   // D188 E1: the 8:00 is read, not stale. Hand oracle: no gap at L5, so S4's shape
      const r = handReach(W5, 'beginner', '18-35', 480, 1.5, 'mi', 720);
      const m = r.shows ? ['oracle: beginner 8:00 at week ' + W5 + ' shows a gap'] : [];
      if(s.crash) m.push('crash ' + s.crash);
      else { m.push(...cardMsgs(s, 'var(--run)', CARD_TW(W5), HDR_TEST(W5))); if(s.text.indexOf(REACH_TOKEN) >= 0) m.push('a reach sentence on the step'); }
      cell(bad, 'S3 D188 mile 8:00 read', m); continue; }
    cell(bad, 'S3 ' + lbl, s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--accent)', CARD_TW(W5) + ' ' + V.S3, HDR_TEST(W5))); }
  row('S3', bad, 2); }
{ const bad = [];
  const s = tryDo(() => cardCase({}, Object.assign(mileOf(480), goalOf(720))));
  const m = s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--run)', CARD_TW(W5), HDR_TEST(W5));
  if(!s.crash && s.text.indexOf(REACH_TOKEN) >= 0) m.push('a reach sentence on the step');
  cell(bad, 'S4', m); row('S4', bad, 1); }
{ const bad = []; const W = handWeek(TODAY, TEST_TW1); const r = handReach(W, 'intermediate', '18-35', 480, 1.5, 'mi', 630);
  const m = (W !== 1 || !r.shows) ? ['oracle: week ' + W + ' shows ' + r.shows] : [];
  const s = tryDo(() => cardCase({ raceDate: TEST_TW1 }, Object.assign(mileOf(480), goalOf(630))));
  if(s.crash) m.push('crash ' + s.crash);
  else { m.push(...cardMsgs(s, 'var(--accent)', CARD_TW1 + ' ' + handSentence(r), HDR_TEST(W)));
    if(s.cardText.indexOf('In 1 week that reaches about 1.5 mi in 12:00.') < 0) m.push('no "In 1 week ... 12:00"'); }
  cell(bad, 'S5', m); row('S5', bad, 1); }
{ const bad = []; const W = handWeek(START_AFTER, TEST); const r = handReach(5, 'intermediate', '18-35', 480, 1.5, 'mi', 630);
  const m = (W !== null || !r.shows) ? ['oracle: week ' + W + ' gap ' + r.shows] : [];
  const s = tryDo(() => cardCase({ startDate: START_AFTER }, Object.assign(mileOf(480), goalOf(630))));
  if(s.crash) m.push('crash ' + s.crash);
  else { m.push(...cardMsgs(s, 'var(--signal)', CARD_NULL)); if(s.text.indexOf(REACH_TOKEN) >= 0) m.push('a reach sentence on the step'); }
  cell(bad, 'S6', m); row('S6', bad, 1); }
{ const bad = [];
  for(const [lbl, exp, run, want] of [['A2', 'intermediate', Object.assign(mileOf(480), goalOf(570)), V.A2], ['A3', 'intermediate', goalOf(630), V.A3], ['A4', 'beginner', goalOf(720), V.A4]]){
    const s = tryDo(() => cardCase({ experience: exp, eventTargeted: false, raceDate: '' }, run));
    if(s.crash){ cell(bad, lbl, ['crash ' + s.crash]); continue; }
    const m = [], el = reg.get('paceFeasLine');
    if(D188_STAMP && lbl === 'A3'){   // D189 F6: required and blank, the feasibility line is empty (ruling After: "feas: (empty)")
      if(!inBody('paceFeasLine') || !el) m.push('frame not in the step');
      else if(el.style.display === 'block') m.push('frame shown (display "block") with ' + J(s.feasText));
      if(s.feasText !== '') m.push('frame ' + J(s.feasText) + ' want ""');
      cell(bad, lbl, m); continue; }
    if(!inBody('paceFeasLine') || !el || el.style.display !== 'block') m.push('frame not shown (display ' + J(el && el.style.display) + ')');
    if(s.feasText !== want) m.push('frame ' + J(s.feasText) + ' want ' + J(want));
    if(colorOf(s.feas) !== 'var(--accent)') m.push('frame colour ' + J(colorOf(s.feas)));
    if(/<button/.test(s.feas || '')) m.push('a button in the frame');
    if(/safe/i.test(s.feas || '')) m.push('"safe" in the frame');
    cell(bad, lbl, m);
  }
  row('S8', bad, 3); }
{ const bad = []; const r = handReach(W5, 'intermediate', '18-35', 480, 2, 'km', 510);
  const m = r.shows ? [] : ['oracle: no gap'];
  const s = tryDo(() => cardCase({}, Object.assign({ targetDist: '2', paceUnit: 'km' }, mileOf(480), goalOf(510))));
  if(s.crash) m.push('crash ' + s.crash);
  else { m.push(...cardMsgs(s, 'var(--accent)', CARD_TW(W5) + ' ' + handSentence(r), HDR_TEST(W5)));
    if(s.cardText.indexOf('about 2 km in ') < 0) m.push('no "2 km"'); }
  cell(bad, 'S9', m); row('S9', bad, 1, 'hand sentence ' + J(handSentence(r))); }

// ── NS1: the name step ──
{ const bad = [];
  const kv = html => { const out = {}; const re = /<span class="(?:k|summary-key)">([^<]*)<\/span><span class="(?:v|summary-val)"[^>]*>([^<]*)<\/span>/g; let m;
    while((m = re.exec(String(html)))){ (out[m[1]] = out[m[1]] || []).push(m[2]); } return out; };
  for(const [lbl, raceDate, want] of [['Mario tw 5', TEST, wk(handWeek(TODAY, TEST))], ['tw 1', TEST_TW1, wk(handWeek(TODAY, TEST_TW1))]]){
    const got = tryDo(() => { setWD({ raceDate }, Object.assign(mileOf(480), goalOf(720))); renderStep('name', true); const v = kv(bodyHTML())['Program length']; return v ? v.join('/') : null; });
    if(got !== want) bad.push(lbl + ' ' + J(got) + ' want ' + J(want));
  }
  row('NS1', bad, 2); }

// ── HM: HALF_MANNY, ruled unmoved ──
// V231 MAINTENANCE (tests/measure/v231_rulings/v231_absorb_ruling.md sections 3 and 4; standing rulings 3, 4 and 5):
// this row defends D183's claim "my ruling did not move HALF_MANNY". The literal it compared
// against went: the only object that carries that claim across later rulings is the era table that
// standing ruling 5 governs, so the row reads MANNY_DIGEST_BY_VERSION[+IA.version], fails loudly when that
// row is absent (row existence is a conjunct), and compares the built digest to it. Re-pointing the literal
// to a later digest would be the vacuous line standing ruling 3 forbids; the row stays keyed to
// D183 (standing ruling 4). The child reads its own artifact's stamp, so [NY] and [UTC] read the same row.
{ const bad = [];
  const fx = H.fixtures.HALF_MANNY; if(fx.seed == null) bad.push('fixture seed is not pinned');
  const d = [0, 1].map(() => tryDo(() => H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fx))))));
  if(d[0] !== d[1]) bad.push('not self-stable ' + J(d));
  const eraV = +IA.version, eraHas = Object.prototype.hasOwnProperty.call(H.MANNY_DIGEST_BY_VERSION, eraV), eraRow = eraHas ? H.MANNY_DIGEST_BY_VERSION[eraV] : undefined;
  if(!(eraHas && typeof eraRow === 'string' && /^[0-9a-f]{16}$/.test(eraRow) && d[0] === eraRow)) bad.push('digest ' + J(d[0]) + ' vs era row [' + eraV + '] ' + (eraHas ? eraRow : 'ABSENT'));
  row('HM', bad, 2, 'era row [' + eraV + '] ' + eraRow); }

// ═════════════════════════════════════════════ PASS 2 ═════════════════════════════════════════════
// Every screen a row renders is also snapped into STATES, the sweep B1, M6, A3S and A3F read.
const STATES = [];
const deDash = h => String(h || '').replace(/&mdash;|&#8212;|&#x2014;/gi, '—');
function sweepText(){   // the step's rendered text, plus every node a handler wrote after the render (innerHTML or textContent)
  let t = txt(deDash(composedHTML()));
  for(const [id, el] of reg){
    if(id === 'wizardBody' || PAINTED.includes(id)) continue;
    const h = String(el.innerHTML || ''), c = String(el.textContent || '');
    if(h) t += ' ' + txt(deDash(h)); if(c) t += ' ' + c;
  }
  return t;
}
function snap(label, fam){ const adv = reg.get('mileAdvisory');
  STATES.push({ label, fam, text: sweepText(), card: liveNode('raceDateFeedback'), feas: liveNode('paceFeasLine'), adv: adv ? String(adv.textContent || '') : '' }); }
function setWDg(over, goals){ const wd = Object.assign(JSON.parse(BOOT_WD), BASE, over || {}); wd.cardioGoals = JSON.parse(JSON.stringify(goals));
  IA.eval('WD = ' + JSON.stringify(wd) + ';'); }
const hdrN = h => { const m = /Program length: (\d+) weeks?/.exec(h || ''); return m ? +m[1] : null; };
const HDR_GOAL = n => 'Program length: ' + wk(n) + '. Set by your longest cardio goal and your experience.';                      // R5, non-test
const isoOfNo = no => new RD(no * 864e5).toISOString().slice(0, 10);
const addDays = (iso, k) => isoOfNo(dayNo(iso) + k);
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayRe = no => { const d = new RD(no * 864e5); return WD3[d.getUTCDay()] + ',? ' + MON3[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const svgN = h => (String(h || '').match(/<svg\b/g) || []).length;
const framed = h => /padding:9px 11px/.test(String(h || ''));
const dashHits = t => String(t).match(/—| - /g) || [];                                                                   // amendment 2 (e)
const BIKE = { bike: { id:'bike_century', label:'Century Ride (100mi)' } };
const U = { eventTargeted:false, raceDate:'' };
const RED_PAST = 'That date has already passed.', RED_WEEK = 'Less than a week away. Not enough time to train.';               // amendment 3 F4(ii); R3 "< 1 week"

// ── RN: R3's dated non-test rows, and the NRC alignedStartCopy shapes ──
let RN_N = null;
{ const bad = []; let n = 0;
  const bike = raceDate => { setWDg({ cardioTypes:['bike'], raceDate }, BIKE); renderStep('cardio_goal', true); return screen(); };
  const s0 = tryDo(() => bike(addDays(TODAY, 7 * 40 + 2)));
  const N = RN_N = s0.crash ? null : hdrN(s0.header);
  n++; if(!(N >= 4)) bad.push('N from the header ' + J(s0.crash || s0.header) + ' (need N >= 4 so 1 week out is diff <= -3, the red row)');
  if(N >= 4){
    for(const [lbl, w, color, want] of [
      ['diff +2', N + 2, 'var(--run)', 'Your ' + N + '-week program finishes 2 weeks before race day. Use the extra time to stay sharp.'],
      ['diff +1', N + 1, 'var(--run)', 'Your ' + N + '-week program finishes 1 week before race day. Use the extra time to stay sharp.'],
      ['diff 0', N, 'var(--run)', 'Perfect timing. Your ' + N + '-week program peaks on race day.'],
      ['diff -1', N - 1, 'var(--accent)', wk(N - 1) + ' is short for this goal. The floor is ' + N + '. Your full ' + N + '-week program stays intact. Your race lands in week ' + (N - 1) + '.'],
      ['1 week out (diff ' + (1 - N) + ')', 1, 'var(--red)', '1 week is short for this goal. The floor is ' + N + '. Your full ' + N + '-week program stays intact. Your race lands in week 1.'],
    ]){
      n++; const date = addDays(TODAY, 7 * w + 2), m = [];
      if(handWeeksUntil(TODAY, date) !== w) m.push('oracle: ' + date + ' is ' + handWeeksUntil(TODAY, date) + ' weeks out, want ' + w);
      const s = tryDo(() => bike(date));
      if(s.crash) m.push('crash ' + s.crash);
      else { m.push(...cardMsgs(s, color, want, HDR_GOAL(N))); if(!framed(s.card)) m.push('not a framed card'); snap('RN bike ' + lbl, 'bike'); }
      cell(bad, 'bike ' + lbl + ' (' + date + ')', m);
    }
    n++; { const date = addDays(TODAY, 3), m = [];
      if(handWeeksUntil(TODAY, date) !== 0) m.push('oracle: ' + date + ' is not under a week');
      const s = tryDo(() => bike(date));
      if(s.crash) m.push('crash ' + s.crash);
      else { m.push(...cardMsgs(s, 'var(--red)', RED_WEEK, HDR_GOAL(N))); if(svgN(s.card) !== 1) m.push(svgN(s.card) + ' <svg, want 1'); snap('RN bike under a week', 'bike'); }
      cell(bad, 'bike under a week (' + date + ')', m); }
  }
  // NRC: the half plan is 14 weeks and race week is its last (D14a). Monday arithmetic by hand.
  const NRC_HALF_WEEKS = 14;
  const handAlign = race => { const raceMon = monNo(race), start = raceMon - (NRC_HALF_WEEKS - 1) * 7, todayMon = monNo(TODAY);
    const fw = Math.max(0, (start - todayMon) / 7);
    return { start, fw, open: fw ? 1 : Math.max(1, Math.min(NRC_HALF_WEEKS, (todayMon - start) / 7 + 1)), weeksOut: handWeeksUntil(TODAY, race), raceNo: dayNo(race) }; };
  const nrc = raceDate => { const fx = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY));
    IA.eval('WD = ' + JSON.stringify(Object.assign(JSON.parse(BOOT_WD), fx, { startDate: TODAY, raceDate })) + ';'); renderStep('cardio_goal', true); return screen(); };
  for(const [lbl, race, wantFw, wantOpen] of [['in progress (HALF_MANNY ' + H.fixtures.HALF_MANNY.raceDate + ')', H.fixtures.HALF_MANNY.raceDate, 0, 4], ['futureWeeks (2027-01-10)', '2027-01-10', 2, 1]]){
    n++; const a = handAlign(race), m = [];
    if(a.fw !== wantFw || a.open !== wantOpen) m.push('oracle: futureWeeks ' + a.fw + ' open ' + a.open);
    const re = new RegExp(esc('Your half is ') + dayRe(a.raceNo) + esc(', ' + wk(a.weeksOut) + ' out. The ' + NRC_HALF_WEEKS + '-week plan starts ') + dayRe(a.start) +
      (a.fw ? esc(', ' + wk(a.fw) + ' from now, so it peaks on race week and not early.')                          // amendment 2 (e), :1964
            : esc(' so race week is week ' + NRC_HALF_WEEKS + '. You open in week ' + a.open + '.')));              // amendment 2 (e), :1966
    const s = tryDo(() => nrc(race));
    if(s.crash) m.push('crash ' + s.crash);
    else { if(!re.test(s.cardText)) m.push('card ' + J(s.cardText) + ' want /' + re.source + '/');
      if(s.cardColor !== 'var(--run)') m.push('colour ' + J(s.cardColor));
      snap('RN NRC ' + lbl, 'NRC'); }
    cell(bad, 'NRC ' + lbl, m);
  }
  row('RN', bad, n, 'bike_century N=' + N + ' from the header'); }

// ── L1 (amendment 2 (f)): one length number ──
{ const bad = [], seen = []; let n = 0, differs = 0;
  const runOnly = () => IA.eval("calcProgramLength(['run'], {run:WD.cardioGoals.run,_experience:WD.experience||'intermediate',_ageBracket:WD.ageBracket||'18-35',_eventTargeted:WD.eventTargeted}, LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced').weeks");
  const SWIM500 = { id:'swim_500_time', label:'Improve 500 Time', targetMins:'7', targetSecs:'00', targetTime:'7:00', swimUnit:'yd', baseMins:'12', baseSecs:'00' };
  for(const [lbl, over, swim, mile, goal, where] of [
    ['dated tw 5 (mile 8:00, goal 10:30)', { cardioTypes:['run'] }, false, 480, 630, 'card'],
    ['undated run+swim (mile 8:00, goal 9:30, swim 500 yd in 7:00)', Object.assign({ cardioTypes:['run', 'swim'] }, U), true, 480, 570, 'feas'],
  ]){
    n++; const m = [];
    const s = tryDo(() => { const goals = { run: runGoal(Object.assign(mileOf(mile), goalOf(goal))) }; if(swim) goals.swim = SWIM500;
      setWDg(over, goals); renderStep('cardio_goal', true); snap('L1 ' + lbl, 'L1'); return screen(); });
    if(s.crash){ cell(bad, lbl, ['crash ' + s.crash]); continue; }
    const hN = hdrN(s.header), t = where === 'card' ? s.cardText : s.feasText;
    const sm = /In (\d+) weeks? that reaches about/.exec(t), sN = sm ? +sm[1] : null;
    if(!(hN > 0)) m.push('no header number in ' + J(s.header));
    else { if(sN !== hN) m.push('sentence "In ' + sN + '" != header ' + hN);
      const r = handReach(hN, 'intermediate', '18-35', mile, 1.5, 'mi', goal);
      if(!r.shows) m.push('oracle: no gap at L ' + hN);
      else if(t.indexOf(handSentence(r)) < 0) m.push((where === 'card' ? 'card ' : 'frame ') + J(t) + ' lacks ' + J(handSentence(r))); }
    cell(bad, lbl, m);
    const ro = tryDo(runOnly); seen.push(lbl.split(' (')[0] + ': header ' + hN + ', run-only ' + J(ro));
    if(typeof ro === 'number' && hN > 0 && ro !== hN) differs++;
  }
  row('L1', bad, n);
  row('L1C', differs ? [] : ['VACUOUS: no scanned case has a header number different from run-only calcProgramLength (' + seen.join('; ') + ')'], 1, seen.join('; ')); }

// ── K1 (amendment 2 brought in (2)): the km lens on the pace line ──
{ const bad = []; let n = 0;
  const want = (tot, dist, unit) => clk(tot) + ' is ' + clk(tot / (unit === 'km' ? dist * KM_MI : dist)) + ' per mile.';
  const inlineLine = () => { const m = /<div id="paceDisplayLine"[^>]*>([\s\S]*?)<\/div>/.exec(bodyHTML()); return m ? txt(m[1]) : null; };
  const liveLine = () => painted('paceDisplayLine') ? txt(reg.get('paceDisplayLine').innerHTML) : null;
  for(const [lbl, dist, unit] of [['2 km', '2', 'km'], ['control 1.5 mi', '1.5', 'mi']]){
    const w = want(720, +dist, unit); n += 2;
    const r = tryDo(() => { setWD({}, Object.assign({ targetDist: dist, paceUnit: unit }, mileOf(480), goalOf(720))); renderStep('cardio_goal', true);
      snap('K1 ' + lbl, unit === 'km' ? 'km' : 'K1'); return { inline: inlineLine(), live: liveLine() }; });
    if(r.crash){ bad.push(lbl + ' crash ' + r.crash, lbl + ' crash'); continue; }
    if(r.inline !== w) bad.push(lbl + ' inline ' + J(r.inline) + ' want ' + J(w));
    if(r.live !== w) bad.push(lbl + ' repaint ' + J(r.live) + ' want ' + J(w));
  }
  for(const [lbl, from, to, unit] of [['1.5 km -> 2 km', '1.5', '2', 'km'], ['control 2 mi -> 1.5 mi', '2', '1.5', 'mi']]){
    const w = want(720, +to, unit); n++;
    const r = tryDo(() => { setWD({}, Object.assign({ targetDist: from, paceUnit: unit }, mileOf(480), goalOf(720))); renderStep('cardio_goal', true);
      const h = lifted(/oninput="(WD\.cardioGoals\['run'\]\.targetDist=this\.value;[^"]*)"/); if(!h.length) return { crash: 'no targetDist handler in the rendered step' };
      seed(); runHandler(h[0], { value: to }); snap('K1 handler ' + lbl, unit === 'km' ? 'km' : 'K1'); return liveLine(); });
    if(r !== w) bad.push(lbl + ' after the targetDist handler ' + J(r) + ' want ' + J(w));
  }
  row('K1', bad, n); }

// ── SW1 (amendment 2 (d)): the swim unit ──
{ const bad = []; let n = 0;
  const swimWD = (unit, mins) => setWDg(Object.assign({ cardioTypes:['swim'] }, U), { swim: { id:'swim_500_time', label:'Improve 500 Time', swimUnit: unit, targetMins: mins, targetSecs:'00', targetTime: mins ? mins + ':00' : '', baseMins:'12', baseSecs:'00' } });
  const inlineSwim = () => { const m = /<div id="swimPaceLine"[^>]*>([\s\S]*?)<\/div>/.exec(bodyHTML()); return m ? txt(m[1]) : null; };
  for(const unit of ['yd', 'm']){
    const w = clk(420) + ' is ' + clk(420 / (500 / 100)) + ' per 100 ' + unit + '.';
    n++; { const r = tryDo(() => { swimWD(unit, '7'); renderStep('cardio_goal', true); snap('SW1 inline ' + unit, 'swim'); return inlineSwim(); });
      if(r !== w) bad.push(unit + ' inline ' + J(r) + ' want ' + J(w)); }
    n++; { const r = tryDo(() => { swimWD(unit, ''); renderStep('cardio_goal', true);
        const h = lifted(/oninput="(WD\.cardioGoals\['swim'\]\.targetMins=this\.value;[^"]*)"/); if(!h.length) return { crash: 'no swim targetMins handler' };
        runHandler(h[0], { value: '7' }); snap('SW1 updateSwimPaceDisplay ' + unit, 'swim');
        const el = reg.get('swimPaceLine'); return el && el.style.display === 'block' ? txt(el.innerHTML) : { crash: 'swimPaceLine display ' + J(el && el.style.display) }; });
      if(r !== w) bad.push(unit + ' updateSwimPaceDisplay ' + J(r) + ' want ' + J(w)); }
  }
  row('SW1', bad, n); }

// ── BL1 (amendment 4): the run baseline handler repaints the header ──
{ const bad = []; let n = 0;
  const HDR_BL1 = { 1: 'Program length: 9 weeks. Set by your longest cardio goal and your experience.',          // amendment 4, bd 1 (printed)
                    4: 'Program length: 6 weeks. Set by your longest cardio goal and your experience.' };        // amendment 4, bd 4 (printed)
  const blWD = bd => setWD(Object.assign({ experience:'beginner' }, U), { targetDist:'1.5', paceUnit:'mi', mileBestMins:'', mileBestSecs:'', targetMins:'', targetSecs:'', baselineDist: bd });
  const fresh = bd => { const r = tryDo(() => { blWD(bd); renderStep('cardio_goal', true); snap('BL1 fresh bd ' + bd, 'beginner'); return screen().header; }); return r && r.crash ? 'crash ' + r.crash : r; };
  const f1 = fresh('1'), f4 = fresh('4');
  n++; if(f1 !== HDR_BL1[1]) bad.push('fresh render at 1 ' + J(f1) + ' want ' + J(HDR_BL1[1]));
  n++; if(f4 !== HDR_BL1[4]) bad.push('fresh render at 4 ' + J(f4) + ' want ' + J(HDR_BL1[4]));
  const r = tryDo(() => { blWD('1'); renderStep('cardio_goal', true);
    const h = lifted(/oninput="(WD\.cardioGoals\['run'\]\.baselineDist=this\.value;[^"]*)"/); if(!h.length) return { crash: 'no run baselineDist handler in the rendered step' };
    seed(); runHandler(h[0], { value: '4' }); snap('BL1 handler 1 -> 4', 'beginner');
    return { there: inBody('progLenLine'), live: painted('progLenLine'), header: screen().header }; });
  n += 3;
  if(r.crash) bad.push('handler ' + r.crash, 'handler (no header)', 'handler (no header)');
  else {
    if(!r.there || !r.live) bad.push('#progLenLine ' + (r.there ? 'still holds its sentinel' : 'is not in the rendered step'));
    if(r.header !== HDR_BL1[4]) bad.push('after the handler ' + J(r.header) + ' want ' + J(HDR_BL1[4]));
    if(r.header !== f4) bad.push('after the handler ' + J(r.header) + ' != a fresh render ' + J(f4));
  }
  row('BL1', bad, n, 'after the handler ' + J(r.header));
  const c1 = hdrN(f1), c4 = hdrN(f4);
  row('BL1C', (c1 > 0 && c4 > 0 && c1 !== c4) ? [] : ['fresh header number at 1 (' + c1 + ') == at 4 (' + c4 + '): BL1 cannot tell stale from live'], 1, 'fresh header at 1: ' + c1 + ', at 4: ' + c4); }

// ── A3E (amendment 3 F4(ii)): the two entry-error lines ──
{ const bad = []; let n = 0; const PAST = '2026-09-15';
  for(const [lbl, set, want] of [
    ['past date, test goal (Mario)', () => setWD({ raceDate: PAST }, Object.assign(mileOf(480), goalOf(720))), RED_PAST],
    ['past date, non-test (bike_century)', () => setWDg({ cardioTypes:['bike'], raceDate: PAST }, BIKE), RED_PAST],
    ['under a week, non-test (bike_century, 3 days)', () => setWDg({ cardioTypes:['bike'], raceDate: addDays(TODAY, 3) }, BIKE), RED_WEEK],
  ]){
    n++; const m = [];
    const s = tryDo(() => { set(); renderStep('cardio_goal', true); snap('A3E ' + lbl, 'entry error'); return screen(); });
    if(s.crash) m.push('crash ' + s.crash);
    else { if(svgN(s.card) !== 1) m.push(svgN(s.card) + ' <svg, want 1'); if(s.cardColor !== 'var(--red)') m.push('colour ' + J(s.cardColor));
      if(framed(s.card)) m.push('framed'); if(s.cardText !== want) m.push('text ' + J(s.cardText) + ' want ' + J(want)); }
    cell(bad, lbl, m);
  }
  row('A3E', bad, n); }

// ── the rest of the sweep: no row of its own; B1, M6, A3S and A3F read it ──
{ const FIELDS = ['mileBestMins', 'mileBestSecs', 'targetMins', 'targetSecs'];
  const VALS = ['', '0', '1', '5', '7', '8', '9', '10', '11', '12', '13', '14', '30', '45'];
  for(const base of [null, 720, 780]) for(const field of FIELDS) for(const val of VALS){
    const tag = 'lattice ' + (base ? clk(base) : 'blank') + ' ' + field + '=' + J(val);
    tryDo(() => {
      setWD({}, Object.assign(mileOf(480), base ? goalOf(base) : {})); renderStep('cardio_goal', true);
      const fh = lifted(new RegExp('oninput="(WD\\.cardioGoals\\[\'run\'\\]\\.' + field + '=this\\.value;[^"]*)"')); if(!fh.length) return;
      runHandler(fh[0], { value: val }); snap(tag + ' after the field handler', 'lattice');
      const dt = openTagRe('raceDateInput').exec(bodyHTML()), dh = dt && /\boninput="([^"]*)"/.exec(dt[0]); if(!dh) return;
      const inp = doc.getElementById('raceDateInput'); inp.value = TEST; runHandler(dh[1], inp); snap(tag + ' after the date handler', 'lattice');
    });
  }
  for(const [lbl, fam, over, run] of [
    ['S1 dated mile gap', 'dated gap', {}, Object.assign(mileOf(480), goalOf(630))],
    ['S2 dated no mile', 'dated gap', {}, goalOf(720)],
    ['S3 dated beginner', 'beginner', { experience:'beginner' }, goalOf(720)],
    ['S4 Mario no gap', 'dated', {}, Object.assign(mileOf(480), goalOf(720))],
    ['S5 tw 1', 'dated gap', { raceDate: TEST_TW1 }, Object.assign(mileOf(480), goalOf(630))],
    ['S6 test before the start', 'dated', { startDate: START_AFTER }, Object.assign(mileOf(480), goalOf(630))],
    ['A2 undated mile gap', 'undated gap', U, Object.assign(mileOf(480), goalOf(570))],
    ['A3 undated no mile', 'undated gap', U, goalOf(630)],
    ['A4 undated beginner', 'beginner', Object.assign({ experience:'beginner' }, U), goalOf(720)],
    ['S9 km', 'km', {}, Object.assign({ targetDist:'2', paceUnit:'km' }, mileOf(480), goalOf(510))],
  ]) tryDo(() => { setWD(over, run); renderStep('cardio_goal', true); snap(lbl, fam); });
  for(const [mm, ss] of [['2', '00'], ['4', '10'], ['13', '00'], ['30', '00'], ['8', '75']]){
    tryDo(() => { setWD({}, Object.assign({ mileBestMins: mm, mileBestSecs: ss }, goalOf(720))); renderStep('cardio_goal', true); snap('mile ' + mm + ':' + ss + ' at render', 'mile advisory'); });
    tryDo(() => { setWD({}, goalOf(720)); renderStep('cardio_goal', true);
      const hm = lifted(/oninput="(WD\.cardioGoals\['run'\]\.mileBestMins=this\.value;[^"]*)"/), hs = lifted(/oninput="(WD\.cardioGoals\['run'\]\.mileBestSecs=this\.value;[^"]*)"/);
      if(!hm.length || !hs.length) return;
      runHandler(hm[0], { value: mm }); runHandler(hs[0], { value: ss }); snap('mile ' + mm + ':' + ss + ' through the mile handlers', 'mile handler'); });
  }
  for(const [id, mins, secs] of [['swim_500_time', '7', '00'], ['swim_100_time', '1', '30']]) for(const unit of ['yd', 'm'])
    tryDo(() => { setWDg(Object.assign({ cardioTypes:['swim'] }, U), { swim: { id, label:'x', swimUnit: unit, targetMins: mins, targetSecs: secs, targetTime: mins + ':' + secs,
      baseMins: id === 'swim_500_time' ? '8' : '1', baseSecs:'45', base500Mins:'8', base500Secs:'00' } }); renderStep('cardio_goal', true); snap('swim ' + id + ' ' + unit, 'swim'); });
  tryDo(() => { setWDg(Object.assign({ cardioTypes:['swim'] }, U), { swim: { id:'swim_tri', label:'Triathlon Swim', baselineDist:'400' } }); renderStep('cardio_goal', true); snap('swim swim_tri', 'swim'); });
  for(const applied of [false, true])
    tryDo(() => { setWD({ _seed: { progName:'Spring Block', avgRecSec:570, n:4, maxDist:5 }, _seedApplied: applied, _seedDismissed: false }, Object.assign(mileOf(480), goalOf(720)));
      renderStep('cardio_goal', true); snap('seed banner ' + (applied ? 'applied' : 'offer'), 'seed banner'); });
}

// ── B1: the button is gone ──
{ const bad = []; let n = 0;
  for(const st of STATES){ n++; const where = [['card', '#raceDateFeedback'], ['feas', '#paceFeasLine']].filter(([k]) => /<button\b/i.test(st[k] || '')).map(x => x[1]);
    if(where.length) bad.push(st.label + ': <button in ' + where.join(' and ')); }
  const src = stripComments(IA.js);
  for(const tok of ['applySuggestedPace', 'achievablePacePerMile', 'secsToMMSS', 'Use this pace']){ n++; const c = src.split(tok).length - 1; if(c) bad.push('source holds ' + c + ' x ' + J(tok)); }
  row('B1', bad, n, STATES.length + ' states, 4 source tokens'); }

// ── M2: one repaint, one caller each ──
{ const bad = []; const src = stripComments(IA.js);
  const calls = nm => (src.match(new RegExp('\\b' + nm + '\\s*\\(', 'g')) || []).length - (src.match(new RegExp('\\bfunction\\s+' + nm + '\\s*\\(', 'g')) || []).length;
  const WANT = { updatePaceFeasibility: 1, updatePaceDisplay: 1, assessRunPaceCeiling: 1, updateRaceDateFeedback: 13 };
  for(const [nm, w] of Object.entries(WANT)){ const c = calls(nm); if(c !== w) bad.push(nm + ' ' + c + ' call sites, want ' + w); }
  row('M2', bad, 4, Object.keys(WANT).map(k => k + ' ' + calls(k)).join(', ')); }

// ── M6: the dash sweep ──
{ const bad = []; let n = 0, hits = 0, dirty = 0; const fams = {};
  const around = t => { const i = t.search(/—| - /); return t.slice(Math.max(0, i - 45), i + 30); };
  for(const st of STATES){ n++; fams[st.fam] = (fams[st.fam] || 0) + 1; const h = dashHits(st.text);
    if(h.length){ hits += h.length; dirty++; bad.push(st.label + ': ' + h.length + ' hit(s), first ' + J(around(st.text))); } }
  n++; if(hits) bad.unshift('TOTAL ' + hits + ' dash hit(s) in ' + dirty + '/' + STATES.length + ' states');
  const NEED = { lattice: 336, NRC: 2, swim: 5, 'mile advisory': 5, 'mile handler': 5, beginner: 1, 'undated gap': 1, bike: 1, km: 1, 'seed banner': 2, 'entry error': 3 };
  for(const [f, min] of Object.entries(NEED)){ n++; if(!((fams[f] || 0) >= min)) bad.push('coverage: ' + (fams[f] || 0) + ' ' + f + ' state(s), want >= ' + min); }
  n++; { const k = STATES.filter(s => s.fam === 'mile handler' && s.adv).length; if(k < 5) bad.push('coverage: the mile advisory wrote textContent in ' + k + '/5 handler states'); }
  n++; { const k = STATES.filter(s => s.fam === 'seed banner' && /Seed from|Estimated from/.test(s.text)).length; if(k < 2) bad.push('coverage: the seed banner shows in ' + k + '/2 states'); }
  row('M6', bad, n, STATES.length + ' states, 0 hits; families ' + Object.keys(fams).map(f => f + ' ' + fams[f]).join(', ')); }

// ── M6C: the predicate is not vacuous ──
{ const bad = [];
  const CASES = [['a typed em dash', 'Program length: 6 weeks — based on your longest cardio goal', 1], ['a typed spaced hyphen', 'Tap to open calendar - the final weeks taper', 1],
                 ['V222\'s pace line', '12:00 — 8:00/mi per mile', 1], ['a compound numeral', 'Your 6-week program peaks on race day.', 0],
                 ['U+2013 ranges', 'Weeks 1–3 are behind you. 30–45 minutes.', 0]];
  for(const [lbl, s, w] of CASES){ const g = dashHits(s).length; if(g !== w) bad.push(lbl + ': ' + g + ' hit(s), want ' + w); }
  row('M6C', bad, CASES.length); }

// ── A3S / A3F (amendment 3) ──
{ const bad = []; let n = 0;
  for(const st of STATES){ n++; if(/safe progression/i.test(st.text + ' ' + txt(st.card) + ' ' + txt(st.feas))) bad.push(st.label); }
  row('A3S', bad, n, STATES.length + ' states'); }
{ const bad = []; let n = 0, cards = 0, frames = 0;
  for(const st of STATES) for(const [k, nm] of [['card', '#raceDateFeedback'], ['feas', '#paceFeasLine']]){
    const h = st[k]; if(!framed(h)) continue; n++; if(k === 'card') cards++; else frames++;
    const sv = svgN(h), ck = (String(h).match(/✓/g) || []).length;
    if(sv || ck) bad.push(st.label + ' ' + nm + ': ' + sv + ' <svg, ' + ck + ' bare check');
  }
  n += 2; if(!cards) bad.push('no framed #raceDateFeedback card in the sweep'); if(!frames) bad.push('no framed #paceFeasLine frame in the sweep');
  row('A3F', bad, n, cards + ' framed cards, ' + frames + ' framed frames'); }

console.log('CHILD ' + TAG + ' PASS ' + cpass + ' FAIL ' + cfail);
