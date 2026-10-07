// g204_clock_limb.js — the gate for D126, one carrying clock helper owns every seconds limb.
//
// ORACLES, all independent of the engine:
//   * C2 is a HAND TABLE. A carrying m:ss clock is defined here from the clock
//     contract: round the whole number of seconds FIRST, then minutes = the integer
//     quotient by 60 and seconds = the remainder, zero padded to two digits. Every
//     expected string below was computed by that arithmetic by hand and typed in.
//     The gate never calls _clkMS to learn what _clkMS should say.
//   * C3 is the well-formedness predicate itself, read off the contract: the seconds
//     limb of a clock is two digits in 00..59. Never 60. This is a regex written here.
//   * C4 is the EQUIVALENCE claim D126 makes: the helper must be output identical to
//     the idiom it replaces for every input the idiom already handled correctly. The
//     old idiom is re-implemented in this file so the comparison is against a typed
//     reference, not against the artifact.
//   * C5/C6 cross a STRING field against a NUMBER field. dose.tgt is the prescribed
//     pace in seconds; the printed tempo pace is the same number as text. The gate
//     does its own division on dose.tgt and requires the card to agree. Measure
//     proved dose is clean (0 non-integer tgt/cap across 269,613 doses), so the
//     number is the trustworthy side and the string is the side under test.
//   * C7a/C7b/C7c are the WIRING rows. C1-C4 prove the helper's arithmetic and C5/C6
//     prove the wiring through exactly ONE formatter. Eleven call sites are wired, so
//     without these rows ten of them could be re-pointed at the old idiom and this
//     gate would stay green. One row per remaining athlete-facing formatter, each
//     against its own independent oracle:
//       C7a  NSW INT — the doctrine arithmetic (A 251-252's 4 s per 400 m, and the
//            PTG p13/p16 2x-2.5x recovery band) computed here and required of the card.
//       C7b  NRC — a HAND-TYPED PACE_CHART row, the seven columns typed from the table.
//       C7c  swim — the swim progression formula re-derived here from the cfg.
//   * C8 is D126's claim read off RENDERED STRINGS at the rounding edges: a lattice of
//     durations (x.5, m:59.5, 3599.5, past the hour) through the owner and through every
//     formatter C1-C7 reach (pace, NSW INT, swim INT) plus the one site that carries its
//     own :60 (the seed mile anchor), each against arithmetic typed here. Until Post-V233
//     it was a SOURCE census of call sites; see the C8 block for why it moved.
//
// VERSION PREDICATE (standing ruling 4 — a gate is keyed to the RULING it defends).
// D126 ships on ia-version 204.
//   * at 204 and above _clkMS MUST exist; its absence is a named FAIL, never a skip.
//   * below 204 WITH _clkMS present is the pre-bump working artifact mid-slice. Every
//     row RUNS.
//   * below 204 WITHOUT _clkMS is an older build: NOT APPLICABLE, rows skipped, clean
//     exit, because gate.sh runs every gate against the previous artifact first.
const path = require('path');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);

let pass = 0, fail = 0, skip = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function eq(label, got, want){ ok(label + ' == ' + JSON.stringify(want), got === want, JSON.stringify(got)); }
function skipRow(label){ skip++; console.log('SKIP ' + label); }

const HAS = IA.eval("typeof _clkMS === 'function'");
const VER = IA.version;
const D126_ERA = 204;

if(!HAS && VER < D126_ERA){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D126 (V' + D126_ERA + ') and has no _clkMS.');
  for(const r of ['C1','C2','C3','C4','C5','C6','C7a','C7b','C7c','C8']) skipRow(r + ' skipped below the D126 era');
  console.log('\nPASS ' + pass + ' FAIL ' + fail);
  process.exit(0);
}

// ── C1 — the surface exists ────────────────────────────────────────────────
ok('C1 _clkMS is declared and is a function (D126 requires it at ia-version >= ' + D126_ERA + ')', HAS, String(HAS));
if(!HAS){
  console.log('\nPASS ' + pass + ' FAIL ' + fail);
  process.exit(1);
}
const clk = s => IA.eval('_clkMS(' + s + ')');

// ── C2 — the hand table ────────────────────────────────────────────────────
// input seconds -> the string, computed by hand from the contract. The interesting
// rows are the ones straddling a rounding boundary: 59.5 carries into the minute,
// 59.4 does not; 479.6 carries to 8:00, which is the exact shape of Mario's 7:60.
const HAND = [
  [0,       '0:00'],
  [7,       '0:07'],
  [59,      '0:59'],
  [59.4,    '0:59'],
  [59.5,    '1:00'],   // carries. the old idiom printed 0:60 here.
  [60,      '1:00'],
  [61.5,    '1:02'],
  [299.5,   '5:00'],   // the formatter probe's example. old idiom: 4:60.
  [450.6,   '7:31'],
  [479.4,   '7:59'],
  [479.6,   '8:00'],   // Mario's card. old idiom: 7:60.
  [480,     '8:00'],
  [518.4,   '8:38'],
  [570,     '9:30'],
  [689.7,   '11:30'],
  [3599,    '59:59'],
  [3600,    '60:00'],  // a carrying clock keeps counting minutes. no hours limb.
  [3660,    '61:00']
];
for(const [inp, want] of HAND) eq('C2 _clkMS(' + inp + ')', clk(inp), want);

// ── C3 — well formedness over the whole plausible domain ───────────────────
// Paces and recoveries in this app live under 20 minutes. Sweep at a tenth of a
// second, which is finer than any value the engine produces.
const WELL = /^-?\d+:[0-5]\d$/;
let swept = 0, malformed = [];
for(let x = 0; x <= 12000; x++){
  const s = x / 10;
  const out = clk(s);
  swept++;
  if(!WELL.test(out) && malformed.length < 5) malformed.push(s + ' -> ' + out);
}
ok('C3 every one of ' + swept + ' inputs over [0,1200] at 0.1s yields a two digit seconds limb in 00..59',
   malformed.length === 0, malformed.join(' | '));

// ── C4 — equivalence with the idiom D126 replaces ──────────────────────────
// The idiom, retyped: floor the minutes off the raw value, then round the
// remainder. It is correct everywhere except where the remainder rounds to 60.
const IDIOM = s => Math.floor(s/60) + ':' + String(Math.round(s % 60)).padStart(2,'0');
let same = 0, diff = 0, wrongDiff = [];
for(let x = 0; x <= 12000; x++){
  const s = x / 10;
  const a = IDIOM(s), b = clk(s);
  if(a === b){ same++; continue; }
  diff++;
  // A divergence is legitimate ONLY where the idiom was malformed.
  if(WELL.test(a) && wrongDiff.length < 5) wrongDiff.push(s + ' idiom=' + a + ' clkMS=' + b);
}
ok('C4 _clkMS differs from the old idiom ONLY where the old idiom was malformed (' + same + ' identical, ' + diff + ' changed)',
   wrongDiff.length === 0, wrongDiff.join(' | '));
ok('C4b the changed set is non-empty, so the helper is not a no-op rename', diff > 0, String(diff));

// ── C5 — the reproducing card ──────────────────────────────────────────────
// Mario's config. 480 s/mi is 8 minutes 0 seconds by hand: 480 / 60 = 8 exactly.
function mkCfg(anchorMins, anchorSecs, goalMins, goalSecs, dist){
  const c = JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
  c.experience = 'intermediate'; c.seed = 76308;
  c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate;
  c.ageBracket = '18-35';
  c.cardioGoals = { run: { id:'run_pace_goal', label:'run_pace_goal',
    mileBestMins:String(anchorMins), mileBestSecs:String(anchorSecs),
    baselineDist:'5', baseline:'5mi',
    targetDist: dist !== undefined ? String(dist) : '1.5', paceUnit:'mi',
    targetMins: goalMins !== undefined ? String(goalMins) : '9',
    targetSecs: goalSecs !== undefined ? String(goalSecs) : '30' } };
  return c;
}
const REPRO = IA.buildProgram(mkCfg(8, 0));
function sessionsOf(prog, wk, day){
  const w = prog.weeks[wk] || prog.weeks[String(wk)] || {};
  const d = w[day]; if(!d) return [];
  return d.cardio ? (Array.isArray(d.cardio) ? d.cardio : [d.cardio]) : [];
}
const reproCards = sessionsOf(REPRO, 11, 'thu');
ok('C5 the reproducing config builds a W11 THU cardio session', reproCards.length > 0, String(reproCards.length));
const reproDetail = reproCards.length ? String(reproCards[0].detail || '') : '';
const reproDose = reproCards.length ? (reproCards[0].dose || reproCards[0]._dose || {}) : {};
// D186/D187 amendment 3 item 2 (coach 2026-09-29): SAME MECHANISM as g202/g209 Class E --
// _tempoSec reads the same walked clock (paceProgression[idx] x 1.08), so this cell's W11 (the
// last build week; undated, tw 11, bw 11, no taper, 10 steps) moves with the rate. Hand anchor
// (the gate's own existing interpolation, unmoved): 494.306. Below 225: 494.306 - 5x10 = 444.306,
// x 1.08 = 479.85 -> 480, "8:00/mi". From 225: 494.306 - 3x10 = 464.306, x 1.08 = 501.44 -> 501,
// "8:21/mi" (D187's rate 3; the undated case has bw = tw so D186's steps = bw - 1 = 10 either way,
// only the rate moved here). Hand-verified against the live V225 engine before landing: W11 THU
// LI prints tgt 501, "Tempo Pace: 8:21/mi", exactly.
const C5_TGT = (+VER >= 225) ? 501 : 480, C5_TXT = (+VER >= 225) ? 'Tempo Pace: 8:21/mi' : 'Tempo Pace: 8:00/mi';
eq('C5 W11 THU dose.tgt is the prescribed tempo seconds', reproDose.tgt, C5_TGT);
ok('C5 W11 THU detail prints the tempo pace (' + C5_TXT + ')',
   reproDetail.indexOf(C5_TXT) !== -1, reproDetail.slice(0, 80));
ok('C5 W11 THU detail carries no :60 seconds limb', !/\d:60\b/.test(reproDetail), reproDetail.slice(0, 80));

// ── C5b — the carry cell, restored (D186/D187 amendment 3 item 2) ──────────
// C5 used to double as "the reproducing card" for the old-idiom ":60" carry (479.85 -> 8:00, old
// idiom 7:60), but 501.44 is nowhere near a :60 boundary, so that coverage silently vanished when
// C5's own value moved. Anchored at WEEK 1 instead, which neither D186 nor any rate change ever
// touches (week 1 is always the unmoved anchor pace), this cell reproduces the SAME carry
// identically on both eras: mile 7:24 (444 s), 1 mi goal 6:00, undated. Hand: 444 x 1.08 = 479.52
// -> 480, "8:00/mi", old idiom 7:60. Added as a NEW row keyed from 225 only (even though the
// printed value is identical pre- and post-D186/D187) to restore the coverage C5 used to give;
// hand-verified against the live engine on BOTH V224 and V225 before landing: both print W1 THU
// LI tgt 480, "Tempo Pace: 8:00/mi", identically.
if(+VER >= 225){
  const CARRY = IA.buildProgram(mkCfg(7, 24, '6', '00', '1'));
  const carryCards = sessionsOf(CARRY, 1, 'thu');
  ok('C5b the carry config builds a W1 THU cardio session', carryCards.length > 0, String(carryCards.length));
  const carryDetail = carryCards.length ? String(carryCards[0].detail || '') : '';
  const carryDose = carryCards.length ? (carryCards[0].dose || carryCards[0]._dose || {}) : {};
  eq('C5b W1 THU dose.tgt is the prescribed tempo seconds (the unmoved anchor, both eras)', carryDose.tgt, 480);
  ok('C5b W1 THU detail prints the tempo pace as 8:00/mi (479.52 -> 480, the old idiom\'s 7:60 carry)',
     carryDetail.indexOf('Tempo Pace: 8:00/mi') !== -1, carryDetail.slice(0, 80));
  ok('C5b W1 THU detail carries no :60 seconds limb', !/\d:60\b/.test(carryDetail), carryDetail.slice(0, 80));
}

// ── C6 — the string agrees with the number, across a lattice ───────────────
// For every tempo card that carries a numeric dose.tgt, the gate divides tgt by
// 60 itself and requires the printed pace to be that clock. This is the check
// that caught the defect: measure saw 67 printed-vs-dose mismatches on V203.
function handClock(sec){
  const t = Math.round(sec);
  const m = (t - (t % 60)) / 60;
  const r = t % 60;
  return m + ':' + (r < 10 ? '0' + r : String(r));
}
let checked = 0, mismatches = [];
for(let mins = 4; mins <= 12; mins++){
  for(const secs of [0, 11, 23, 37, 49, 58]){
    const prog = IA.buildProgram(mkCfg(mins, secs));
    for(const wk of Object.keys(prog.weeks || {})){
      for(const day of Object.keys(prog.weeks[wk] || {})){
        for(const s of sessionsOf(prog, wk, day)){
          const dose = s.dose || s._dose || {};
          const det = String(s.detail || '');
          if(typeof dose.tgt !== 'number' || det.indexOf('Tempo Pace: ') === -1) continue;
          checked++;
          const want = 'Tempo Pace: ' + handClock(dose.tgt) + '/mi';
          if(det.indexOf(want) === -1 && mismatches.length < 6)
            mismatches.push(mins + ':' + secs + ' W' + wk + ' ' + day + ' tgt=' + dose.tgt + ' want "' + want + '" in "' + det.slice(0, 60) + '"');
        }
      }
    }
  }
}
ok('C6 all ' + checked + ' tempo cards print the clock the gate computes from dose.tgt',
   checked > 0 && mismatches.length === 0, mismatches.join(' | '));
ok('C6b the lattice actually produced tempo cards to check', checked >= 100, String(checked));

// ── C7a — NSW INT: _intClk and the INT fmt, against the doctrine arithmetic ──
// This row owns the seconds limbs on the interval card: the `Nx400m at X/mi` limb,
// the `Recovery: A to B` band (both printed through _intClk) and the NOTE limb, which
// is where slice 2 cleared 55 session.note occurrences of the idiom. The oracle is
// NOT a re-render. It is three pieces of arithmetic typed out here:
//   * A 251-252: the 400 m interval pace is about 4 seconds faster than base pace.
//     400 m is A's own quarter mile, so the gain is a flat 16 s per mile.
//   * PTG p13/p16: interval recovery is 2x to 2.5x the work time. Work time for one
//     400 is pace x 400 / 1609.344 (metres in a mile — a unit, not a coaching number).
//   * the clock contract: round the WHOLE value, then split at 60.
const INT_GAIN_SEC_PER_MILE = 16;        // A 251-252: 4 s per 400 m x 4 quarters
const M_PER_MILE = 1609.344;             // unit
function mkPaceCfg(anchorMins, anchorSecs, targetDist, tMins, tSecs){
  const c = JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
  c.experience = 'intermediate'; c.seed = 76308;
  c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate;
  c.ageBracket = '18-35';
  c.cardioGoals = { run: { id:'run_pace_goal', label:'run_pace_goal',
    mileBestMins:String(anchorMins), mileBestSecs:String(anchorSecs),
    baselineDist:'5', baseline:'5mi',
    targetDist:String(targetDist), paceUnit:'mi',
    targetMins:String(tMins), targetSecs:String(tSecs) } };
  return c;
}
const INT_LIMB  = /(\d+)x400m at (\d+:\d+)\/mi/;              // \d+ on BOTH limbs, never \d\d:
const INT_WEEK  = /This week's goal pace is (\d+:\d+)\/mi/;   // a \d\d seconds limb would
const INT_REC   = /Recovery: (\d+:\d+) to (\d+:\d+) of easy/; // accept ":60" as well formed.
const INT_GOAL  = /Your full goal of (\d+:\d+)\/mi/;
const secsOf = clkStr => { const p = clkStr.split(':'); return (+p[0]) * 60 + (+p[1]); };

let intCards = 0, intNotes = 0;
const intPaceBad = [], intRuleBad = [], intRecNumBad = [], intRecStrBad = [], intNoteBad = [], intFrac = [];
for(let mins = 5; mins <= 12; mins++){
  for(const secs of [0, 17, 30, 44, 59]){
    const prog = IA.buildProgram(mkPaceCfg(mins, secs, 1.5, 9, 30));
    for(const wk of Object.keys(prog.weeks || {})){
      for(const day of Object.keys(prog.weeks[wk] || {})){
        for(const s of sessionsOf(prog, wk, day)){
          const det = String(s.detail || ''), nte = String(s.note || '');
          const mL = det.match(INT_LIMB);
          if(!mL) continue;
          const dose = s.dose || s._dose || {};
          intCards++;
          const tag = mins + ':' + secs + ' W' + wk + ' ' + day;
          // (1) the printed pace limb IS the clock of the numeric dose.
          if(mL[2] !== handClock(dose.tgt) && intPaceBad.length < 5)
            intPaceBad.push(tag + ' printed ' + mL[2] + ' but dose.tgt=' + dose.tgt + ' is ' + handClock(dose.tgt));
          // (2) A's 16 s per mile rule, read off the card's own two pace limbs.
          const mW = det.match(INT_WEEK);
          if(mW && Math.abs(dose.tgt - (secsOf(mW[1]) - INT_GAIN_SEC_PER_MILE)) > 1 && intRuleBad.length < 5)
            intRuleBad.push(tag + ' week ' + mW[1] + ' (' + secsOf(mW[1]) + 's) minus 16 != tgt ' + dose.tgt);
          // (3) the recovery band, by the 2x-2.5x doctrine, numbers then strings.
          const wantLo = Math.round(dose.tgt * 400 / M_PER_MILE * 2);
          const wantHi = Math.round(dose.tgt * 400 / M_PER_MILE * 2.5);
          const rec = dose.rec || {};
          if((rec.lo !== wantLo || rec.hi !== wantHi) && intRecNumBad.length < 5)
            intRecNumBad.push(tag + ' rec=' + JSON.stringify(rec) + ' doctrine says {lo:' + wantLo + ',hi:' + wantHi + '}');
          // The _intClk domain. Both band limbs are rounded by the engine, so today the
          // idiom and _clkMS agree on them and a re-point of _intClk alone is invisible by
          // output. The day a fraction reaches this limb, THIS conjunct fails.
          if((!Number.isInteger(dose.tgt) || !Number.isInteger(rec.lo) || !Number.isInteger(rec.hi)) && intFrac.length < 5)
            intFrac.push(tag + ' tgt=' + dose.tgt + ' rec=' + JSON.stringify(rec));
          const mR = det.match(INT_REC);
          if((!mR || mR[1] !== handClock(wantLo) || mR[2] !== handClock(wantHi)) && intRecStrBad.length < 5)
            intRecStrBad.push(tag + ' printed "' + (mR ? mR[1] + ' to ' + mR[2] : 'NO BAND') + '" want "' + handClock(wantLo) + ' to ' + handClock(wantHi) + '"');
          // (4) the NOTE limb. Every clock in it must be well formed.
          if(nte){
            intNotes++;
            for(const m of nte.match(/\d+:\d+/g) || [])
              if(!WELL.test(m) && intNoteBad.length < 5) intNoteBad.push(tag + ' note clock "' + m + '" in "' + nte.slice(0, 90) + '"');
          }
        }
      }
    }
  }
}
ok('C7a the lattice produced INT cards to test (' + intCards + ' cards, ' + intNotes + ' notes)', intCards >= 100 && intNotes >= 100, intCards + '/' + intNotes);
ok('C7a every INT `Nx400m at X/mi` limb is the clock of its own dose.tgt (' + intCards + ' cards)', intPaceBad.length === 0, intPaceBad.join(' | '));
ok("C7a every INT card obeys A 251-252: tgt == this week's goal pace minus " + INT_GAIN_SEC_PER_MILE + ' s/mi', intRuleBad.length === 0, intRuleBad.join(' | '));
ok('C7a every INT dose.rec is the PTG 2x-2.5x band of its own work time', intRecNumBad.length === 0, intRecNumBad.join(' | '));
ok('C7a every printed `Recovery: A to B` is the clock pair of that band (this limb is _intClk)', intRecStrBad.length === 0, intRecStrBad.join(' | '));
ok('C7a every clock in all ' + intNotes + ' INT notes has a seconds limb in 00..59', intNoteBad.length === 0, intNoteBad.join(' | '));
ok('C7a the _intClk domain is still whole seconds over ' + intCards + ' cards (a fraction here means the idiom would now print :60 on the recovery band, so _intClk must stay on _clkMS)',
   intFrac.length === 0, intFrac.join(' | '));

// C7a KILLER — the note limb at a hand-picked carrying value.
// A 2-mile goal of 13:59 is 839 s over 2 miles = 419.5 s/mi EXACTLY. The clock
// contract rounds the whole value first: 419.5 -> 420 -> 420/60 = 7 min 0 s -> "7:00".
// The idiom floors the minute (6) and rounds the remainder (59.5 -> 60) -> "6:60".
const CARRY = IA.buildProgram(mkPaceCfg(8, 0, 2, 13, 59));
let carryNote = '';
for(const wk of Object.keys(CARRY.weeks || {})){
  for(const day of Object.keys(CARRY.weeks[wk] || {})){
    for(const s of sessionsOf(CARRY, wk, day)){
      if(INT_LIMB.test(String(s.detail || '')) && INT_GOAL.test(String(s.note || ''))){ carryNote = String(s.note); break; }
    }
    if(carryNote) break;
  }
  if(carryNote) break;
}
ok('C7a the carrying config (2 mi goal of 13:59 = 419.5 s/mi) produced an INT note quoting the goal', !!carryNote, carryNote.slice(0, 60));
const carryGoal = (carryNote.match(INT_GOAL) || [])[1];
eq('C7a INT note prints 419.5 s/mi as the carried clock (the idiom prints 6:60 here)', carryGoal, '7:00');

// ── C7b — NRC: buildNRCSession's fmt, against a hand-typed PACE_CHART row ────
// THIS ROW EXISTS TO NOTICE A FRACTION. Every number the NRC formatter is handed
// today is an integer: PACE_CHART is typed in whole seconds, paceChartLookup rounds
// its interpolation, and steadyCapSec rounds. On an integer the old idiom and _clkMS
// agree, so a re-point alone cannot be caught here by output. What CAN be caught is
// the day the domain stops being integer — then the idiom starts printing :60 on this
// card and the last conjunct below fails and says so.
// The row anchor is a mile best of 8:00 = 480 s, which is PACE_CHART row 7 EXACTLY,
// so no interpolation runs and the seven columns are typed here straight off the table.
const NRC_ROW_480 = { mile:480, fiveK:520, tenK:540, tempo:565, half:570, marathon:585, recovery:630 };
const NRC_ROW_480_CLOCKS = { mile:'8:00', fiveK:'8:40', tenK:'9:00', tempo:'9:25', half:'9:30', marathon:'9:45', recovery:'10:30' };
// 520/60 = 8 r 40 -> 8:40. 540 = 9 r 0 -> 9:00. 565 = 9 r 25. 570 = 9 r 30.
// 585 = 9 r 45. 630 = 10 r 30. Each typed by hand from the column value above.
const NRC_STEADY_CAP_CLOCK = '9:58';   // (565 + 630) / 2 = 597.5 -> 598 -> 9 r 58
function mkNrcCfg(anchorMins, anchorSecs){
  const c = JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
  c.experience = 'intermediate'; c.seed = 76308;
  c.cardioGoals.run.mileBestMins = String(anchorMins);
  c.cardioGoals.run.mileBestSecs = String(anchorSecs);
  return c;
}
const NRC = IA.buildProgram(mkNrcCfg(8, 0));
let nrcText = '';
for(const wk of Object.keys(NRC.weeks || {}))
  for(const day of Object.keys(NRC.weeks[wk] || {}))
    for(const s of sessionsOf(NRC, wk, day))
      nrcText += String(s.detail || '') + '\n' + String(s.note || '') + '\n' + String(s.subtype || '') + '\n';
for(const col of Object.keys(NRC_ROW_480_CLOCKS)){
  const want = NRC_ROW_480_CLOCKS[col] + '/mi';
  ok('C7b NRC prints the ' + col + ' column (' + NRC_ROW_480[col] + ' s, hand table ' + NRC_ROW_480_CLOCKS[col] + ') as "' + want + '"',
     nrcText.indexOf(want) !== -1, 'absent');
}
ok('C7b NRC prints the steady ceiling (565+630)/2 = 597.5 -> 598 as "' + NRC_STEADY_CAP_CLOCK + '/mi"',
   nrcText.indexOf(NRC_STEADY_CAP_CLOCK + '/mi') !== -1, 'absent');
// Closed world: the plan may print NO per-mile clock this hand table does not explain.
const NRC_ALLOWED = new Set(Object.keys(NRC_ROW_480_CLOCKS).map(k => NRC_ROW_480_CLOCKS[k] + '/mi').concat([NRC_STEADY_CAP_CLOCK + '/mi']));
const nrcStray = [...new Set((nrcText.match(/\d+:\d+\/mi/g) || []))].filter(t => !NRC_ALLOWED.has(t));
ok('C7b every /mi clock the NRC plan prints is explained by the hand-typed row (' + NRC_ALLOWED.size + ' allowed)',
   nrcStray.length === 0, nrcStray.join(' '));
// The tripwire. If this fails, the NRC formatter is being fed a fraction and MUST stay
// on _clkMS: re-pointing it at Math.round(x % 60) would print :60 on a race plan card.
const chartInts = IA.eval('PACE_CHART.every(r => Object.keys(r).every(k => Number.isInteger(r[k])))');
let lookupFrac = [];
for(let a = 280; a <= 740; a += 1){
  const row = IA.eval('paceChartLookup("mile",' + a + ')');
  for(const k of Object.keys(row)) if(!Number.isInteger(row[k]) && lookupFrac.length < 5) lookupFrac.push(a + '.' + k + '=' + row[k]);
  const cap = IA.eval('steadyCapSec(paceChartLookup("mile",' + a + '))');
  if(!Number.isInteger(cap) && lookupFrac.length < 5) lookupFrac.push(a + '.steadyCap=' + cap);
}
ok('C7b PACE_CHART is typed in whole seconds', chartInts === true, String(chartInts));
ok('C7b the NRC formatter domain is still integer over 461 anchors (a fraction here means the idiom would now print :60 on a race card, so this formatter must stay on _clkMS)',
   lookupFrac.length === 0, lookupFrac.join(' | '));

// ── C7c — swim: the swim fmt, against the progression re-derived here ────────
// THE FIRST INDEPENDENT ORACLE THE SWIM PACE DOMAIN HAS EVER HAD. Nothing in the
// suite has ever checked a swim split against anything but itself. The swim INT card
// is also the one place a FRACTION reaches a formatter by construction: the printed
// split is weekPace x 0.97, and 0.97 of a tenth-second value is almost never whole.
// The progression is re-derived here from the cfg, in the order the engine's own
// comments state it, so the expected clocks are computed, never read back:
//   initial  = base time / (dist/100)            = 616 / 5      = 123.2 s per 100
//   target   = goal time / (dist/100)            = 240 / 5      = 48 s per 100
//   maxGain  = min(6, 3 s/wk x age scale 1.0 x 2.5) = 6 s per 100 per week
//   weekPace(w) = initial - 6(w-1), floored at the realistic target
//   intPace(w)  = weekPace(w) x 0.97
// ERA-KEYED (standing ruling 4). D110a (coach ruled, ships on ia-version 212) replaces two
// of these terms, so from 212 on the SAME re-derivation runs with the ruled terms:
//   maxGain  = 3 s/wk x age scale 1.0 = 3 s per 100 per week (the sizer's rate, no 2.5x, no 6)
//   intPace(w)  = weekPace(w) - 2        (Guide A p12)
// and the carrying killer is re-sited, because 123.2 - 2 = 121.2 is whole-ish and no longer
// carries: 10:08 for 500 yd = 121.6 s per 100, minus 2 = 119.6 -> "2:00" (the idiom: 1:60).
//   ia-version <= 211: maxGain 6, x0.97, week 1 2:00 at a 2:03 split.
//   ia-version  > 211: maxGain 3, -2 s, week 1 2:01 at 2:03, week 6 1:46 at 1:48 (123.2 - 15).
const SWIM_D110A = +VER > 211;
const SWIM_BASE_SEC = 10*60 + 16;     // 10:16 for 500 yd
const SWIM_GOAL_SEC = 4*60 + 0;       // 4:00 for 500 yd
const SWIM_FIXED_DIST = 500;
const SWIM_INITIAL = SWIM_BASE_SEC / (SWIM_FIXED_DIST/100);   // 123.2
const SWIM_TARGET  = SWIM_GOAL_SEC / (SWIM_FIXED_DIST/100);   // 48
const SWIM_MAX_GAIN = SWIM_D110A ? 3 : 6;
const swimIntOf = wp => SWIM_D110A ? wp - 2 : wp * 0.97;
const SWIM_INT_RULE = SWIM_D110A ? 'weekPace - 2' : 'weekPace x 0.97';
function mkSwimCfg(){
  const c = JSON.parse(JSON.stringify(fixtures.HALF_MANNY));
  c.cardioTypes = ['swim'];
  c.experience = 'intermediate'; c.seed = 76308; c.ageBracket = '18-35';
  c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate;
  c.cardioGoals = { swim: { id:'swim_500_time', label:'swim_500_time', swimUnit:'yd',
    baseMins:'10', baseSecs:'16', targetMins:'4', targetSecs:'0' } };
  return c;
}
const SWIM = IA.buildProgram(mkSwimCfg());
const SWIM_TW = Object.keys(SWIM.weeks || {}).length;
const swimRealistic = SWIM_INITIAL - SWIM_MAX_GAIN * SWIM_TW;
// Precondition: the weekly gain must be CLAMPED at 6, or the hand model below is not
// the model the engine runs. (123.2 - 48) / tw must exceed 6.
ok('C7c the swim lattice clamps the weekly gain at ' + SWIM_MAX_GAIN + ' s/100 (raw ' + ((SWIM_INITIAL - SWIM_TARGET)/SWIM_TW).toFixed(3) + ' over ' + SWIM_TW + ' weeks)',
   (SWIM_INITIAL - SWIM_TARGET) / SWIM_TW > SWIM_MAX_GAIN, String(SWIM_TW));
const SWIM_MAIN = /at (\d+:\d+)\/100/;
const SWIM_SPLIT = /goal split of (\d+:\d+)\/100/;
let swimInts = 0; const swimBad = [], swimSplitBad = [], swimWell = [];
for(const wk of Object.keys(SWIM.weeks || {})){
  for(const day of Object.keys(SWIM.weeks[wk] || {})){
    for(const s of sessionsOf(SWIM, wk, day)){
      const det = String(s.detail || ''), nte = String(s.note || '');
      if(s.type !== 'swim' || !/Interval/.test(String(s.subtype || ''))) continue;
      swimInts++;
      const w = +wk;
      const weekPace = Math.max(swimRealistic, SWIM_INITIAL - SWIM_MAX_GAIN * (w - 1));
      const wantInt = handClock(swimIntOf(weekPace));
      const wantWeek = handClock(weekPace);
      const mM = det.match(SWIM_MAIN), mS = det.match(SWIM_SPLIT);
      if((!mM || mM[1] !== wantInt) && swimBad.length < 5)
        swimBad.push('W' + wk + ' printed ' + (mM ? mM[1] : 'NONE') + ' want ' + wantInt + ' (weekPace ' + weekPace.toFixed(1) + ', ' + SWIM_INT_RULE + ' = ' + swimIntOf(weekPace).toFixed(3) + ')');
      if((!mS || mS[1] !== wantWeek) && swimSplitBad.length < 5)
        swimSplitBad.push('W' + wk + ' split ' + (mS ? mS[1] : 'NONE') + ' want ' + wantWeek);
      for(const m of (det + ' ' + nte).match(/\d+:\d+/g) || [])
        if(!WELL.test(m) && swimWell.length < 5) swimWell.push('W' + wk + ' "' + m + '"');
    }
  }
}
ok('C7c the swim config produced INT cards to test', swimInts >= 4, String(swimInts));
ok('C7c every swim INT prints ' + SWIM_INT_RULE + ' as the clock this gate computes (' + swimInts + ' cards, ia-version ' + VER + (SWIM_D110A ? ', D110a era' : ', pre-D110a era') + ')', swimBad.length === 0, swimBad.join(' | '));
ok("C7c every swim INT prints this week's goal split as the clock of weekPace", swimSplitBad.length === 0, swimSplitBad.join(' | '));
ok('C7c every clock on a swim INT card has a seconds limb in 00..59', swimWell.length === 0, swimWell.join(' | '));
// C7c KILLER — week 1. 123.2 x 0.97 = 119.504. Round the whole value: 120 -> "2:00".
// The idiom floors the minute (1) and rounds the remainder (59.504 -> 60) -> "1:60".
let swimW1 = '';
for(const day of Object.keys(SWIM.weeks['1'] || SWIM.weeks[1] || {}))
  for(const s of sessionsOf(SWIM, 1, day))
    if(s.type === 'swim' && /Interval/.test(String(s.subtype || ''))) swimW1 = String(s.detail || '');
ok('C7c week 1 swim INT card exists', !!swimW1, swimW1.slice(0, 40));
if(!SWIM_D110A){
  eq('C7c week 1 swim INT prints 123.2 x 0.97 = 119.504 as the carried clock (the idiom prints 1:60 here)',
     (swimW1.match(SWIM_MAIN) || [])[1], '2:00');
  eq("C7c week 1 swim INT prints the goal split 123.2 as 2:03", (swimW1.match(SWIM_SPLIT) || [])[1], '2:03');
} else {
  // D110a era: the fixture's hand rows, then the carrying killer re-sited to 10:08 / 500 yd.
  const firstInt = (prog, wk) => { let t = '';
    for(const day of Object.keys(prog.weeks[String(wk)] || prog.weeks[wk] || {}))
      for(const s of sessionsOf(prog, wk, day))
        if(s.type === 'swim' && /Interval/.test(String(s.subtype || '')) && !t) t = String(s.detail || '');
    return t; };
  eq('C7c week 1 swim INT prints 123.2 - 2 = 121.2 as 2:01 (D110a, Guide A p12)', (swimW1.match(SWIM_MAIN) || [])[1], '2:01');
  eq("C7c week 1 swim INT prints the goal split 123.2 as 2:03", (swimW1.match(SWIM_SPLIT) || [])[1], '2:03');
  const swimW6 = firstInt(SWIM, 6);
  ok('C7c week 6 swim INT card exists', !!swimW6, swimW6.slice(0, 40));
  eq('C7c week 6 swim INT prints 123.2 - 3x5 - 2 = 106.2 as 1:46 (D110a rate 3)', (swimW6.match(SWIM_MAIN) || [])[1], '1:46');
  eq('C7c week 6 swim INT prints the goal split 123.2 - 3x5 = 108.2 as 1:48', (swimW6.match(SWIM_SPLIT) || [])[1], '1:48');
  const killCfg = mkSwimCfg(); killCfg.cardioGoals.swim.baseMins = '10'; killCfg.cardioGoals.swim.baseSecs = '8';
  const killW1 = firstInt(IA.buildProgram(killCfg), 1);
  ok('C7c the re-sited killer (10:08 / 500 yd) builds a week 1 swim INT card', !!killW1, killW1.slice(0, 40));
  eq('C7c week 1 swim INT prints 608/5 - 2 = 119.6 as the carried clock (the idiom prints 1:60 here)',
     (killW1.match(SWIM_MAIN) || [])[1], '2:00');
}

// ── C8 — D126 read off the RENDERED STRING, at the rounding edges ─────────────
// D126 (V204, "the clock that printed 7:60"): the seconds limb has ONE owner, _clkMS, which
// rounds the WHOLE value and then splits, so ':60' cannot be constructed and every clock the
// app prints reads 00..59 in its seconds field.
// UNTIL POST-V233 THIS ROW WAS A SOURCE CENSUS: tests/measure/v204_idiom_census.js counted
// _clkMS call sites in the artifact text (era table 11/13/16/27/26) and the surviving
// Math.round(x % 60) sites (one, the applySeedData mile anchor, plus its ss===60 line). It
// went red at V207 and V223 with no behaviour change, each time a ruled build added a call
// THROUGH the owner (measure mH class B; mT BRITTLE PINS), and no count can see a formatter
// that keeps its call and stops carrying. Mario, Post-V233: "Convert brittle line and text
// checks (like g224) to content checks." It is now put on output: durations chosen AT THE
// ROUNDING EDGES, driven through every formatter C1-C7 already reach, each against arithmetic
// typed here. The gate never asks _clkMS or a card what a clock should say.
//   C8a  the owner: a hand table of edge rows, then every half second in [0, 7200] against
//        the round-then-split clock this file computes (handClock, C6).
//   C8b  pace, the tempo card. Week 1 tempo is the mile anchor x 1.08 (C5b's arithmetic), and
//        three anchors put it at m:59.5 or past: 333 x 1.08 = 359.64, 444 x 1.08 = 479.52,
//        611 x 1.08 = 659.88. Keyed from 225 with C5b, the era that row verified week 1 as
//        the unmoved anchor.
//   C8c  NSW INT. The note quotes the full goal pace, goal time / 2 mi, which is x.5 for every
//        odd goal time. Five of the seven land on m:59.5; 841 and 901 are x.5 inside a minute.
//   C8d  swim INT. Per 100 = base / 5, so a 500 yd base of 608, 609, 908 or 909 s puts week
//        1's interval at m:59.6 or m:59.8; every week re-derived with C7c's own progression.
//   C8e  the one site that rounds INSIDE the modulo and carries its own correction, the
//        applySeedData mile anchor: edge mile seconds land as carried minutes and seconds.
//   C8f  the ceiling, everywhere C8 looked: no clock in any detail, note, subtype or label of
//        any session C8 built has a seconds field of 60 or more.
const secField = t => +String(t).split(':')[1];
const C8_BUILT = [];
// C8a. Each row by hand: round the whole value (half up), then minutes = quotient by 60,
// seconds = remainder. 0.5 -> 1 -> 0:01. 3599.5 -> 3600 -> 60:00. 3600.5 -> 3601 -> 60:01.
// 3659.5 -> 3660 -> 61:00. 5999.5 -> 6000 -> 100:00. 7199.5 -> 7200 -> 120:00.
const C8_EDGE = [
  [0.4, '0:00'], [0.5, '0:01'], [29.5, '0:30'], [59.5, '1:00'], [119.5, '2:00'], [359.5, '6:00'],
  [599.5, '10:00'], [3599.4, '59:59'], [3599.5, '60:00'], [3600.5, '60:01'], [3659.5, '61:00'],
  [5999.5, '100:00'], [7199.5, '120:00']
];
const c8EdgeBad = C8_EDGE.filter(([s, w]) => clk(s) !== w).map(([s, w]) => s + ' -> ' + clk(s) + ' want ' + w);
ok('C8a _clkMS prints all ' + C8_EDGE.length + ' hand-typed rounding edges (x.5, m:59.5, 3599.5, past the hour)',
   c8EdgeBad.length === 0, c8EdgeBad.join(' | '));
let c8Half = 0; const c8HalfBad = [];
for(let i = 0; i <= 14400; i++){
  const s = i / 2, got = clk(s), want = handClock(s);
  c8Half++;
  if((got !== want || !WELL.test(got)) && c8HalfBad.length < 5) c8HalfBad.push(s + ' -> ' + got + ' want ' + want);
}
ok('C8a every one of ' + c8Half + ' half seconds over [0,7200] prints the round-then-split clock computed here, seconds 00..59',
   c8HalfBad.length === 0, c8HalfBad.join(' | '));
// C8b. 333 x 1.08 = 359.64 -> 360 -> 6 r 0; 444 x 1.08 = 479.52 -> 480 -> 8 r 0; 611 x 1.08 =
// 659.88 -> 660 -> 11 r 0. The idiom printed 5:60, 7:60 and 10:60. The 1 mi goal sits 84 s
// under the anchor, as C5b's 7:24 -> 6:00 does.
const C8_PACE = [ { a: 333, tgt: 360, clock: '6:00' }, { a: 444, tgt: 480, clock: '8:00' }, { a: 611, tgt: 660, clock: '11:00' } ];
if(+VER >= 225){
  for(const r of C8_PACE){
    const gl = r.a - 84;
    const p = IA.buildProgram(mkCfg(Math.floor(r.a / 60), r.a % 60, Math.floor(gl / 60), gl % 60, 1));
    C8_BUILT.push(p);
    const w1 = [];
    for(const day of Object.keys(p.weeks['1'] || p.weeks[1] || {}))
      for(const s of sessionsOf(p, 1, day)) if(String(s.detail || '').indexOf('Tempo Pace: ') !== -1) w1.push(s);
    const bad = w1.filter(s => String(s.detail).indexOf('Tempo Pace: ' + r.clock + '/mi') === -1 || (s.dose || s._dose || {}).tgt !== r.tgt);
    ok('C8b pace: a mile anchor of ' + r.a + ' s x 1.08 prints week 1 tempo as ' + r.clock + '/mi (tgt ' + r.tgt + '; the idiom printed :60 here)',
       w1.length > 0 && bad.length === 0, w1.length + ' cards: ' + w1.map(s => String(s.detail).slice(0, 50)).join(' | '));
  }
} else for(const r of C8_PACE) skipRow('C8b pace anchor ' + r.a + ' s skipped below 225 (C5b era: week 1 tempo is the unmoved anchor)');
// C8c. t / 2 by hand: 359.5 -> 360 -> 6:00; 419.5 -> 7:00; 420.5 -> 421 -> 7:01; 450.5 -> 451
// -> 7:31; 479.5 -> 8:00; 539.5 -> 9:00; 599.5 -> 10:00. The anchor a is the goal pace + 60 s.
const C8_INT = [ { t: 719, a: 420, clock: '6:00' }, { t: 839, a: 480, clock: '7:00' }, { t: 841, a: 481, clock: '7:01' },
                 { t: 901, a: 511, clock: '7:31' }, { t: 959, a: 540, clock: '8:00' }, { t: 1079, a: 600, clock: '9:00' },
                 { t: 1199, a: 660, clock: '10:00' } ];
for(const r of C8_INT){
  const p = IA.buildProgram(mkPaceCfg(Math.floor(r.a / 60), r.a % 60, 2, Math.floor(r.t / 60), r.t % 60));
  C8_BUILT.push(p);
  const q = [];
  for(const wk of Object.keys(p.weeks || {})) for(const day of Object.keys(p.weeks[wk] || {})) for(const s of sessionsOf(p, wk, day)){
    const m = String(s.note || '').match(INT_GOAL); if(m) q.push(m[1]);
  }
  ok('C8c NSW INT: a 2 mi goal of ' + Math.floor(r.t / 60) + ':' + String(r.t % 60).padStart(2, '0') + ' (' + (r.t / 2) + ' s/mi) is quoted as '
     + r.clock + '/mi on every INT note that quotes it (' + q.length + ')', q.length > 0 && q.every(x => x === r.clock), q.join(','));
}
// C8d. 608/5 = 121.6, 609/5 = 121.8, 908/5 = 181.6, 909/5 = 181.8 s per 100. Week 1 interval,
// D110a era (minus 2): 119.6 and 119.8 -> 120 -> 2:00, 179.6 and 179.8 -> 180 -> 3:00 (the
// idiom: 1:60, 2:60). Pre-D110a (x 0.97): 117.952 and 118.146 -> 1:58, 176.152 and 176.346
// -> 2:56. The week 1 split is the base itself: 121.6/121.8 -> 2:02, 181.6/181.8 -> 3:02.
const C8_SWIM = [ { b: 608, w1: SWIM_D110A ? '2:00' : '1:58', split: '2:02' }, { b: 609, w1: SWIM_D110A ? '2:00' : '1:58', split: '2:02' },
                  { b: 908, w1: SWIM_D110A ? '3:00' : '2:56', split: '3:02' }, { b: 909, w1: SWIM_D110A ? '3:00' : '2:56', split: '3:02' } ];
for(const r of C8_SWIM){
  const sc = mkSwimCfg(); sc.cardioGoals.swim.baseMins = String(Math.floor(r.b / 60)); sc.cardioGoals.swim.baseSecs = String(r.b % 60);
  const p = IA.buildProgram(sc); C8_BUILT.push(p);
  const tw = Object.keys(p.weeks || {}).length, init = r.b / (SWIM_FIXED_DIST / 100), real = init - SWIM_MAX_GAIN * tw;
  const bad = []; let n = 0, w1 = '', w1s = '';
  for(const wk of Object.keys(p.weeks || {})) for(const day of Object.keys(p.weeks[wk] || {})) for(const s of sessionsOf(p, wk, day)){
    if(s.type !== 'swim' || !/Interval/.test(String(s.subtype || ''))) continue;
    n++;
    const wp = Math.max(real, init - SWIM_MAX_GAIN * (+wk - 1));
    const d = String(s.detail || ''), mM = d.match(SWIM_MAIN), mS = d.match(SWIM_SPLIT);
    if(+wk === 1 && !w1){ w1 = mM ? mM[1] : 'NONE'; w1s = mS ? mS[1] : 'NONE'; }
    if((!mM || mM[1] !== handClock(swimIntOf(wp)) || !mS || mS[1] !== handClock(wp)) && bad.length < 4)
      bad.push('W' + wk + ' ' + (mM ? mM[1] : 'NONE') + '/' + (mS ? mS[1] : 'NONE') + ' want ' + handClock(swimIntOf(wp)) + '/' + handClock(wp));
  }
  ok('C8d swim INT: a 500 yd base of ' + r.b + ' s (' + init.toFixed(1) + ' s/100) prints week 1 as ' + r.w1 + ' at a ' + r.split
     + ' split and all ' + n + ' interval cards as the clock re-derived here (' + SWIM_INT_RULE + ')',
     (init - SWIM_TARGET) / tw > SWIM_MAX_GAIN && n >= 4 && w1 === r.w1 && w1s === r.split && bad.length === 0,
     'W1 ' + w1 + '/' + w1s + (bad.length ? ' | ' + bad.join(' | ') : '') + ' | clamp ' + ((init - SWIM_TARGET) / tw).toFixed(3));
}
// C8e. mileSec -> minutes, seconds by hand: 59.5 -> 60 -> 1 r 0; 419.6 -> 420 -> 7 r 0; 450.4
// -> 450 -> 7 r 30; 479.4 -> 479 -> 7 r 59; 479.5 -> 480 -> 8 r 0; 3599.5 -> 3600 -> 60 r 0.
// The site floors the minutes off the RAW value and rounds the remainder, then carries its own
// ss===60: that carry is what is under test. Wizard state is saved and restored around it.
const C8_SEED = [ [59.5, '1', '0'], [419.6, '7', '0'], [450.4, '7', '30'], [479.4, '7', '59'], [479.5, '8', '0'], [3599.5, '60', '0'] ];
const seedBad = []; let seedErr = '';
try {
  IA.eval('var __g204wd = { cg: WD.cardioGoals, seed: WD._seed, ap: WD._seedApplied };');
  for(const [ms, wm, ws] of C8_SEED){
    IA.eval('WD.cardioGoals = { run: {} }; WD._seed = { mileSec: ' + ms + ' };');
    // The wizard re-render that follows the write is DOM work the harness may not carry; the
    // two fields under test are written before it, so a throw there is not a clock defect.
    try { IA.eval('applySeedData()'); } catch(e) { }
    const sg = JSON.parse(IA.eval('JSON.stringify(WD.cardioGoals.run)'));
    if(sg.mileBestMins !== wm || sg.mileBestSecs !== ws) seedBad.push(ms + ' -> ' + sg.mileBestMins + ':' + sg.mileBestSecs + ' want ' + wm + ':' + ws);
  }
  IA.eval('WD.cardioGoals = __g204wd.cg; WD._seed = __g204wd.seed; WD._seedApplied = __g204wd.ap;');
} catch(e) { seedErr = String((e && e.message) || e); }
ok('C8e the applySeedData mile anchor (the one site that rounds inside the modulo and carries its own :60) lands all '
   + C8_SEED.length + ' edge mile times as the hand-carried minutes and seconds', !seedErr && seedBad.length === 0, seedErr || seedBad.join(' | '));
// C8f. The ceiling over everything C8 built.
let c8Clocks = 0; const c8Sixty = [];
for(const p of C8_BUILT) for(const wk of Object.keys(p.weeks || {})) for(const day of Object.keys(p.weeks[wk] || {})) for(const s of sessionsOf(p, wk, day))
  for(const f of ['detail', 'note', 'subtype', 'label']) for(const m of String(s[f] || '').match(/\d+:\d+/g) || []){
    c8Clocks++;
    if(secField(m) >= 60 && c8Sixty.length < 5) c8Sixty.push('W' + wk + ' ' + day + ' ' + f + ' "' + m + '"');
  }
ok('C8f no clock among the ' + c8Clocks + ' clock strings on the ' + C8_BUILT.length + ' programs C8 built has a seconds field of 60 or more',
   c8Clocks >= 300 && c8Sixty.length === 0, c8Sixty.join(' | ') || String(c8Clocks));

// ── HALF_MANNY and cfg purity ──────────────────────────────────────────────
const H = require(path.join(__dirname, '..', 'harness.js'));
const ERA = H.MANNY_DIGEST_BY_VERSION[IA.version];
ok('MANNY_DIGEST_BY_VERSION has a row for ia-version ' + IA.version, !!ERA, String(ERA));
eq('HALF_MANNY digest unmoved by D126 (a clock fix may not move a build)',
   progDigest(IA.buildProgram(fixtures.HALF_MANNY)), ERA);

const cfgBefore = JSON.stringify(fixtures.HALF_MANNY);
IA.buildProgram(fixtures.HALF_MANNY);
eq('buildProgram left cfg byte-identical (no scratch)', JSON.stringify(fixtures.HALF_MANNY), cfgBefore);

console.log('\nPASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
