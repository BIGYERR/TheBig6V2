// g226_d188_beginnermile.js — GATE for D188 (P-BEGINNERMILE): a beginner may enter a mile, optionally,
// every engine read uses it, D9 judges it, and the wizard field and the program-card pencil reach him.
//
//   node tests/gates/g226_d188_beginnermile.js <candidate.html> [baseline_V225.html]
//   IA_ASSUME_VERSION=226 node tests/gates/g226_d188_beginnermile.js <tree stamped 225> [baseline_V225.html]  (discrimination)
//
// THE RULING THIS DEFENDS: tests/measure/v226_rulings/d188_d189_ruling.md, D188 section (E1-E10,
// "What deliberately does not change") and its Gate rows G1-G5. D-code D188. Accepted by Mario 2026-09-30.
//
// ORACLES (never the engine asked to confirm itself):
//   G1 CHART ROW  the Nike pace chart typed by hand from doctrine/nikerunclub5k.txt, PACE CHART page 8:
//                   :160  "12:00 39:30/12:40 81:30/13:05 13:35 3:05:00/14:05 6:00:00/13:45 14:30"
//                   :159  "11:30 38:00/12:15 78:30/12:35 13:00 2:55:00/13:15 5:50:00/13:20 14:05"
//                 columns: mile | 5k best/avg mile pace | 10k best/avg mile pace | tempo | half | marathon | recovery.
//                 13:00 is 780 s, slower than the D9 chart bound 720 s (12:00), so by hand it clamps to the 12:00 row.
//                 On V225 the beginner's mile is discarded and the hand default table (beginner 690 = 11:30, D9/V176)
//                 picks the 11:30 row: that is the era truth.
//   G1 DIFFERENTIAL  9:00 at 18-35: a beginner's W1 detail pace tokens equal the INTERMEDIATE cell with the same
//                 mile and seed (the ruling's "paces as an intermediate's", premise 4). This is a DIFFERENTIAL
//                 between two builds of the candidate, not a hand literal, and the row text says so. Era truth
//                 (V225): the beginner's 9:00 cell equals his own no-mile cell (the mile is ignored).
//   G1 LENGTH     beginner, goal 1.5 mi in 13:30, mile 9:00: 13:30 / 1.5 = 540 s/mi = the mile, gap 0 by hand, so the
//                 length is the beginner base-build floor, ruled 9. No mile: hand gap (690 - 540) / 3 s per week = 50
//                 weeks, which hits the 1.5-mile cap, ruled 11. V225 truth: the mile is ignored, 11 both ways.
//   G1 SI PAIR    (G1g, gate amendment (e); the slice 7b drop is withdrawn) run_pace_goal, beginner, mile 13:00, typed by
//                 hand: doctrine :160 row 12:00 (mile 720 s, 5K 12:40 = 760 s); ROW_PACE_COLS puts the 5K column at
//                 3.107 mi; the ruled D100 ln-distance interpolation at the 1.5 mi target: 720 + 40 ln1.5 / ln3.107 =
//                 734.31 s = 12:14 (goal pace); Guide A (physicaltrainingguide2020.txt:251) 4 s per 400 m = 16 s/mi
//                 faster: 718.31 s = 11:58 (SI). V225 truth: the 11:30 row (:159, 5K 735 s): 11:46 and 11:30.
//   G1 CEILING    (G1f, gate amendment (c)) the beginner's entered mile reaches assessRunPaceCeiling (E1): the sentence
//                 typed by hand arithmetic (see the row), through the function and through the wizard #paceFeasLine.
//                 The V225 arm's literal is the one licensed engine read in this file (see the row).
//   G1h LICENCE   (slice 7f) D188 Class A2 in BOTH directions and Class A1-L, as predicates (standing ruling 2), from
//                 tests/measure/v226_rulings/d188_a2_relicence.md (coach 2026-09-30, Mario "yes" 2026-10-01). Each cfg is
//                 built on the V225 artifact (twice: it must equal itself first) and on the candidate. The tier ORACLE is
//                 dose arithmetic typed from the doctrine lines (mins, or mi x tgt / 60; >= 75 A, >= 45 B, else C; NRC
//                 rehearsal A); _longRunTier is never called. The APPLIED tier is read off the printed day the way
//                 g209 reads it (A: only post-run mobility / taper sections; C: the day still carries what tier B bans;
//                 otherwise B or C, settled against the same (week, day) on the other artifact: one pre-pass draw, two
//                 tiers, so the side that lost items is B). Vocabularies lifted from g209 (D18/D140) plus D153's hinge
//                 pair. The block sits after G2 because it reads G2's V225 baseline.
//   G2 IDENTITY   two artifacts: the candidate with the D189 S1 suffix (typed below, ' ' + S1) stripped from every
//                 note must equal the V225 artifact's build, digest for digest, and V225 must equal itself first.
//                 Baseline: argv[3] if it reads ia-version 225, else `git show <V225 commit>:index.html`.
//   G3 VALIDATOR  the D9 strings and R3 string typed from the V226 source text; `_mileEntryState(g, exp)` called
//                 directly (D110a's model), compared by canonical deep equality.
//   G4 SURFACES   substring counts on the rendered wizard body and on progDetailHTML output.
//   G5 TOKEN-GONE the comment-stripped source (tokenizer-safe stripper lifted verbatim from g225_d187_pacerate.js,
//                 itself from g221/g223: strings, template literals and regex literals are kept intact).
//                 Gate amendment (a): the R3 token E6 mandates is exempted by its INDEX, never by a window width, and
//                 the R3 literal is counted on its own row (D188 exactly 1, V225 0).
//
// VERSION PREDICATE (standing rulings 2 and 4). D188 ships at 226.
//   226 and up    every row asserts the D188 after-state.
//   231 and up    three rows are SCOPED to 230 and below (tests/measure/v231_rulings/v231_absorb_ruling.md section 3;
//                 standing rulings 2 and 4): G2's identity row (the candidate minus S1 equals the V225 build), G1h-P2b
//                 (11:30 weekGrid identity) and G1h-P5 (unmoved days byte-identical). D195 moves those populations (the
//                 ruling prints G2 120 of 120 cells moved, ops B-1 657; the G1h lattice 384 of 384 cfgs moved, ops A-1
//                 1,806, B-1 3,155, B-2 7, 0 other). At 231 and up each prints one named SKIP line at column 0, never PASS
//                 and never FAIL, naming the successors g231_d195b_cost D195-B-b and g231_d195_hipext D195-A-b. G2's V225
//                 self-identity precondition and G1h-P0, P1, A1L, P2, P3, P4, L1 to L3 assert as before.
//   225 and below every row asserts the V225 truth (printed "era truth"), so the suite stays green on the previous
//                 artifact for the right reason. One block lacks a V225 truth: G1h (the A2 / A1-L licence compares
//                 V226 against V225, and V225 has no counterpart), so below 226 its 11 rows are counted NA by name.
//   IA_ASSUME_VERSION=226 lifts a file stamped exactly 225 to 226 for a discrimination run (not a ship proof): the
//                 rows D188 changed go RED on V225, the unchanged ones (G1 no-mile length, G1f length, G2, G3 blank
//                 and R3, G4 intermediate pencil) stay green.
//                 G1h: P0 to P5 stay green (V225 against V225 moves nothing) and the liveness rows L1 to L3 go RED.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');

// Clock pinned before any artifact loads (race-dated cells must not drift with the calendar).
const RealDate = Date;
const NOW = new RealDate(2026, 8, 30, 9, 0, 0).getTime();
class PinnedDate extends RealDate { constructor(...a){ if(a.length === 0) super(NOW); else super(...a); } static now(){ return NOW; } }
globalThis.Date = PinnedDate;

const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEFILE = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ERA = 226;
const V225_COMMIT = '35919943d766606dcbf5e09c98a08b5782dc2223';   // "V225: D186/D187 — the pace clock lands on the goal ..."
// V231 absorb ruling section 3 (g226_d188 G2, G1h-P2b, G1h-P5 SCOPE): those rows assert at 230 and below only; at 231 and
// up each prints this line at column 0, counted neither PASS nor FAIL.
const V231_ERA = 231;
const scopeSkip = (row, fig) => console.log('SKIP ' + row + ' (' + fig + ' on this tree): scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b. Never PASS, never FAIL.');

let pass = 0, fail = 0, na = 0;
const t0 = RealDate.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('  runtime ' + ((RealDate.now() - t0) / 1000).toFixed(1) + ' s'); console.log('NA ' + na); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

let IA = null, STAMP = NaN;
try { IA = H.load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
} else if(process.env.IA_ASSUME_VERSION !== undefined){
  console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
const D188 = VER >= ERA;
const TAG = D188 ? 'D188' : 'era truth V225';
console.log('g226 D188 beginnermile | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + ' | rows assert ' + (D188 ? 'the D188 after-state' : 'the V225 truth'));

// ── hand tables and typed literals ─────────────────────────────────────────────────────────────
const clk = s => Math.floor(s / 60) + ':' + String(Math.round(s) % 60).padStart(2, '0');
const ROW_1200 = { Mile: '12:00', '5K': '12:40', '10K': '13:05', Tempo: '13:35', Recovery: '14:30' };   // doctrine :160
const ROW_1130 = { Mile: '11:30', '5K': '12:15', '10K': '12:35', Tempo: '13:00', Recovery: '14:05' };   // doctrine :159
const BEG_DEFAULT_SEC = 690, CHART_SLOWEST_SEC = 720;                                                  // D9 / V176, hand
const MILE_SLOW = 780, MILE_FAST = 540;                                                               // 13:00, 9:00
const rowFor = sec => (Math.min(sec, CHART_SLOWEST_SEC) === 720 ? ROW_1200 : null);                   // 780 > 720 -> 12:00
const ROW_13 = D188 ? rowFor(MILE_SLOW) : (BEG_DEFAULT_SEC === 690 ? ROW_1130 : null);
// D189 S1, beginner default, typed (hand 690 s = 11:30; "an" because eleven opens on a vowel). Stripped as ' ' + S1.
const S1_BEG = 'Paces here start from an 11:30 mile, the beginner default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.';
// D9 / R3 strings typed from the V226 source text (_mileEntryState).
const MSG_UNDER3 = 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.';
const MSG_OVER25 = 'Over 25:00 reads as a walk, not a run. Check the entry.';
const MSG_R3 = 'Required. Enter your most recent timed mile.';
const ADV_SLOW_1300 = 'At 13:00 your paces come from the 12:00 row, the chart’s slowest. Consider a base block first.';
const ADV_FAST_0430 = 'At 4:30 your paces come from the chart’s fastest row, 5:00. It tops out there.';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const SEEDS = Array.from({ length: 20 }, (_, i) => 1000 + i * 37);
const RACE = new Set(['run_5k', 'run_10k', 'run_half', 'run_marathon']);
const WIZ_GOALS = ['run_pace_goal', 'run_5k', 'run_10k', 'run_half', 'run_base'];                 // the ruling's 5 run goals
const ALL6 = ['run_pace_goal', 'run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base'];

function cfgOf(goal, exp, seed, mileSec, tgt){
  const g = { id: goal, label: goal, baselineDist: '', baseline: '' };
  if(goal === 'run_pace_goal'){ g.targetDist = '1.5'; g.targetMins = tgt ? tgt[0] : '12'; g.targetSecs = tgt ? tgt[1] : '0'; }
  if(mileSec){ g.mileBestMins = String(Math.floor(mileSec / 60)); g.mileBestSecs = String(mileSec % 60); g.mileBestSrc = { kind: 'entered' }; }
  const c = { name: 'G226', primaryPath: RACE.has(goal) ? 'event' : 'hybrid', cardioTypes: ['run'], cardioGoals: { run: g },
    liftingFocus: 'balanced', experience: exp, ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs',
    restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed };
  if(RACE.has(goal)){ c.eventTargeted = true; c.raceDate = '2027-01-31'; }
  return c;
}
const build = (X, cfg) => X.buildProgram(JSON.parse(JSON.stringify(cfg)));
function w1Runs(p){
  const out = [], w = (p && p.weeks && (p.weeks['1'] || p.weeks[1])) || {};
  ORDER.forEach(d => { const day = w[d]; if(!day || day.rest) return;
    [].concat(day.cardio || []).forEach(c => { if(c && c.type === 'run') out.push({ d, st: c.subtype || '', detail: String(c.detail || '') }); }); });
  return out;
}
const paceToks = s => s.match(/\d{1,2}:\d\d\/mi/g) || [];
const tokSig = p => JSON.stringify(w1Runs(p).map(c => [c.d, c.st, paceToks(c.detail)]));
function labeled(s){ const out = [], re = /\b(Mile|5K|10K|Tempo|Recovery) Pace:? \(?(\d{1,2}:\d\d)\/mi/g; let m; while((m = re.exec(s))) out.push([m[1], m[2]]); return out; }
const canon = v => (v && typeof v === 'object' && !Array.isArray(v)) ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v);

// ══ G1 (D188 reads) ════════════════════════════════════════════════════════════════════════════
console.log('\nG1 reads: beginner x {pace, 5k, half, base} x mile {9:00, 13:00} x ' + SEEDS.length + ' seeds (' + TAG + ')');
// G1a/b: 13:00 on the NRC cards, chart row typed from doctrine.
for(const goal of ['run_5k', 'run_half']){
  const bad = []; let cells = 0, n5 = 0, nR = 0;
  for(const s of SEEDS){
    let p; try { p = build(IA, cfgOf(goal, 'beginner', s, MILE_SLOW)); } catch(e){ bad.push('seed ' + s + ' threw ' + e.message); continue; }
    const labs = [].concat(...w1Runs(p).filter(c => /^Speed Run|^Recovery Run|^Long Run/.test(c.st)).map(c => labeled(c.detail)));
    const wrong = labs.filter(([k, v]) => ROW_13[k] !== v);
    const has5 = labs.some(([k]) => k === '5K'), hasR = labs.some(([k]) => k === 'Recovery');
    if(has5) n5++; if(hasR) nR++;
    if(wrong.length || !has5 || !hasR) bad.push('seed ' + s + (wrong.length ? ' wrong ' + wrong.map(x => x.join(' ')).join(', ') : '') + (!has5 ? ' no 5K Pace' : '') + (!hasR ? ' no Recovery Pace' : ''));
    else cells++;
  }
  ok('G1 ' + TAG + ' ' + goal + ' beginner mile 13:00: every W1 NRC labeled pace equals the ' + ROW_13.Mile + ' chart row typed from doctrine (5K ' + ROW_13['5K'] + ', Recovery ' + ROW_13.Recovery + '), 5K and Recovery each on the week',
     bad.length === 0 && cells === SEEDS.length, cells + '/' + SEEDS.length + ' cells; 5K seen ' + n5 + ', Recovery seen ' + nR + (bad.length ? '; ' + bad.slice(0, 3).join(' | ') : ''));
}
// G1c: 13:00 on run_base: the easy run's "Around m:ss/mi" is the row's Recovery column.
{
  const bad = []; let cells = 0;
  for(const s of SEEDS){
    let p; try { p = build(IA, cfgOf('run_base', 'beginner', s, MILE_SLOW)); } catch(e){ bad.push('seed ' + s + ' threw ' + e.message); continue; }
    const arounds = w1Runs(p).map(c => (/Around (\d{1,2}:\d\d)\/mi/.exec(c.detail) || [])[1]).filter(Boolean);
    if(arounds.length && arounds.every(v => v === ROW_13.Recovery)) cells++; else bad.push('seed ' + s + ' Around ' + JSON.stringify(arounds));
  }
  ok('G1 ' + TAG + ' run_base beginner mile 13:00: W1 easy run "Around" pace equals the ' + ROW_13.Mile + ' row Recovery ' + ROW_13.Recovery + ' (doctrine)',
     bad.length === 0 && cells === SEEDS.length, cells + '/' + SEEDS.length + (bad.length ? '; ' + bad.slice(0, 3).join(' | ') : ''));
}
// G1g (gate amendment (e), the S1 cell): the run_pace_goal SI pair, reinstated on a hand oracle. Beginner, mile 13:00, goals
// 1.5 mi in 12:00 and 13:30, rest {sun, wed} and {sat, sun}, 20 seeds: every W1 run card carrying "4x400m at" prints
// "4x400m at 11:58/mi" and "goal pace is 12:14/mi", and every cell has at least one such card.
// Derivation, typed here and never asked of the engine (no rowPaceAt call, no paceProgression read):
//   doctrine nikerunclub5k.txt:160, the 12:00 row: mile 12:00 = 720 s, 5K 12:40 = 760 s. 13:00 (780 s) clamps to it (D9 bound 720).
//   ROW_PACE_COLS: the 5K column sits at 3.107 mi. D100 interpolates on ln distance at the 1.5 mi target:
//   720 + (760 - 720) x ln 1.5 / ln 3.107 = 720 + 40 x 0.357663 = 734.31 s = 12:14 (the goal pace).
//   Guide A, physicaltrainingguide2020.txt:251: 4 s per 400 m faster = 16 s/mi: 734.31 - 16 = 718.31 s = 11:58 (the SI pace).
// V225 arm: the mile is discarded and the beginner default 690 s picks the 11:30 row (doctrine :159: mile 690, 5K 12:15 = 735 s):
//   690 + 45 x 0.357663 = 706.09 s = 11:46; minus 16 = 690.09 s = 11:30.
// D100 is a ruled formula, not doctrine; typing it with doctrine numbers is the oracle class amendment (e) accepts. If D100 is
// ever re-ruled this row goes red and the change is classified, which is the pin's job.
{
  const PAIR = D188 ? { si: '11:58', gp: '12:14', mile: 720, k5: 760 } : { si: '11:30', gp: '11:46', mile: 690, k5: 735 };
  const gpSec = PAIR.mile + (PAIR.k5 - PAIR.mile) * Math.log(1.5) / Math.log(3.107);
  const arith = clk(gpSec) === PAIR.gp && clk(gpSec - 16) === PAIR.si;   // the typed pair re-derived from the typed doctrine numbers
  const SI = '4x400m at ' + PAIR.si + '/mi', GP = 'goal pace is ' + PAIR.gp + '/mi';
  const bad = []; let cells = 0, n = 0, cards = 0;
  for(const tgt of [['12', '0'], ['13', '30']]) for(const rest of [['sun', 'wed'], ['sat', 'sun']]) for(const s of SEEDS){
    n++; const where = tgt.join(':') + ' ' + rest.join('/') + ' seed ' + s;
    let p; try { p = build(IA, Object.assign(cfgOf('run_pace_goal', 'beginner', s, MILE_SLOW, tgt), { restDays: rest })); } catch(e){ bad.push(where + ' threw ' + e.message); continue; }
    const si = w1Runs(p).filter(c => c.detail.indexOf('4x400m at') >= 0);
    const wrong = si.filter(c => c.detail.indexOf(SI) < 0 || c.detail.indexOf(GP) < 0);
    cards += si.length;
    if(si.length && !wrong.length) cells++;
    else bad.push(where + (si.length ? ' ' + JSON.stringify(wrong[0].detail.slice(0, 160)) : ' no "4x400m at" card in W1'));
  }
  ok('G1g ' + TAG + ' run_pace_goal beginner mile 13:00 (goals 12:00 and 13:30, rest sun/wed and sat/sun): every W1 "4x400m at" card prints "' + SI + '" and "' + GP + '", at least one per cell (hand: doctrine row, D100 ln interpolation, Guide A 16 s/mi)',
     arith && bad.length === 0 && cells === n && n > 0, cells + '/' + n + ' cells, ' + cards + ' SI cards' + (arith ? '' : '; ORACLE ARITHMETIC DISAGREES WITH THE TYPED PAIR') + (bad.length ? '; ' + bad.slice(0, 2).join(' | ') : ''));
}
// G1d: 9:00 differential, per goal.
for(const goal of ['run_pace_goal', 'run_5k', 'run_half', 'run_base']){
  const bad = []; let cells = 0;
  for(const s of SEEDS){
    let a, b;
    try {
      a = tokSig(build(IA, cfgOf(goal, 'beginner', s, MILE_FAST)));
      b = D188 ? tokSig(build(IA, cfgOf(goal, 'intermediate', s, MILE_FAST))) : tokSig(build(IA, cfgOf(goal, 'beginner', s, 0)));
    } catch(e){ bad.push('seed ' + s + ' threw ' + e.message); continue; }
    if(a === b && a !== '[]') cells++; else bad.push('seed ' + s + ' beginner ' + a.slice(0, 160) + ' vs ' + b.slice(0, 160));
  }
  ok('G1 ' + TAG + ' ' + goal + ' beginner mile 9:00 at 18-35: W1 detail pace tokens equal ' + (D188 ? 'the INTERMEDIATE cell, same mile and seed (differential, not a hand literal)' : 'his own no-mile cell (differential: V225 ignores a beginner mile)'),
     bad.length === 0 && cells === SEEDS.length, cells + '/' + SEEDS.length + (bad.length ? '; ' + bad.slice(0, 2).join(' | ') : ''));
}
// G1e: length cell.
{
  const L = mile => { try { return build(IA, cfgOf('run_pace_goal', 'beginner', 1000, mile, ['13', '30'])).totalWeeks; } catch(e){ return 'threw ' + e.message; } };
  const l9 = L(MILE_FAST), l0 = L(0);
  const want9 = D188 ? 9 : 11;
  ok('G1 ' + TAG + ' length cell: beginner, goal 1.5 mi in 13:30, mile 9:00 -> ' + want9 + (D188 ? ' (gap 0 by hand, beginner base floor)' : ' (V225 ignores the mile)'), l9 === want9, l9);
  ok('G1 ' + TAG + ' length cell: same goal, no mile -> 11 (hand gap (690-540)/3 = 50 weeks, 1.5-mile cap 11)', l0 === 11, l0);
}
// G1f (gate amendment (c), the S4 cell; E1 is a D188 read so the row lives in this file). Beginner, 18-35, run_pace_goal
// 1.5 mi in 10:30, mile 9:00 entered, undated hybrid.
//   Hand L, D188: gap 540 - 420 = 120 s / PACE_IMPROVE.beginner 3 = 40 weeks; x 1.25 + 4 = 54; + 1 grace = 55; 1.5-mile cap 11.
//   Hand L, V225 truth: the mile is discarded, gap 690 - 420 = 270 / 3 = 90 weeks; the same cap, 11.
//   Hand sentence, D188: improvingWeeks ((11 - 1) / 1.0 - 4) / 1.25 = 4.8; 540 - 4.8 x 3 = 525.6 s/mi; x 1.5 = 788.4 s = 13:08.
//   V225 arm: the ONE engine read in this file, licensed by the slice 7b2 brief for the V225 arm's literal only: the V225
//   paceCeilingSentence(assessRunPaceCeiling(11)) run once on the V225 baseline with this WD, its output typed below.
//   The amendment quoted "You have not entered a mile time. The beginner default is 11:30 per mile." as the V225 string;
//   that is the S4 string on the candidate. V225 printed its own beginner line (deleted by D188 E2), typed here.
//   Hand cross-check of that literal: 690 - 4.8 x 3 = 675.6 s/mi; x 1.5 = 1013.4 s = 16:53.
{
  const SENT = D188 ? 'Your mile is 9:00. In 11 weeks that reaches about 1.5 mi in 13:08. Your goal is 10:30. Keep it or change it above.'
                    : 'Your paces start from the beginner default of 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 10:30. Keep it or change it above.';
  let L; try { L = build(IA, cfgOf('run_pace_goal', 'beginner', 1000, MILE_FAST, ['10', '30'])).totalWeeks; } catch(e){ L = 'threw ' + e.message; }
  ok('G1f ' + TAG + ' length: beginner, goal 1.5 mi in 10:30, mile 9:00 -> 11 (hand: ' + (D188 ? '120 / 3 = 40, x 1.25 + 4 = 54, + 1 = 55' : 'mile discarded, 270 / 3 = 90') + ', 1.5-mile cap 11)', L === 11, L);
  const RUN = { id: 'run_pace_goal', label: 'x', targetDist: '1.5', paceUnit: 'mi', targetMins: '10', targetSecs: '30', mileBestMins: '9', mileBestSecs: '0', mileBestSrc: { kind: 'entered' } };
  const WDX = { experience: 'beginner', ageBracket: '18-35', primaryPath: 'hybrid', cardioTypes: ['run'], eventTargeted: false, raceDate: '', name: 'G226',
    liftingFocus: 'balanced', equipment: 'crossfit', unit: 'lbs', restDays: ['sun', 'wed'], seed: 1000, cardioGoals: { run: RUN } };
  const doc = IA.window.document, own = Object.prototype.hasOwnProperty.call(doc, 'getElementById'), gebi = doc.getElementById, mk = doc.createElement, els = new Map();
  let saved = null, fn, wz;
  try {
    saved = IA.eval('JSON.stringify({ WD: WD, step: wizardStep })');
    IA.eval('WD = Object.assign(JSON.parse(JSON.stringify(WD)), ' + JSON.stringify(WDX) + ')');
    try { fn = IA.eval('paceCeilingSentence(assessRunPaceCeiling(11))'); } catch(e){ fn = 'threw ' + e.message; }
    try {
      doc.getElementById = id => { if(!els.has(id)){ const e = mk('div'); e.id = id; els.set(id, e); } return els.get(id); };
      IA.eval('activeProg = null; wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep(); updateRaceDateFeedback();');
      const pf = els.get('paceFeasLine');
      wz = !pf ? 'no #paceFeasLine node' : pf.style.display !== 'block' ? 'hidden (display ' + JSON.stringify(pf.style.display) + ')'
         : String(pf.innerHTML || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } catch(e){ wz = 'threw ' + e.message; }
  } catch(e){ fn = fn || 'setup threw ' + e.message; wz = wz || 'setup threw ' + e.message; }
  finally {
    if(own) doc.getElementById = gebi; else delete doc.getElementById;
    if(saved) try { IA.eval('(function(s){ WD = s.WD; wizardStep = s.step; })(' + saved + ')'); } catch(e){}
  }
  ok('G1f ' + TAG + ' paceCeilingSentence(assessRunPaceCeiling(11)) equals the typed sentence', fn === SENT, JSON.stringify(fn));
  ok('G1f ' + TAG + ' wizard #paceFeasLine (undated, shown) equals the same typed sentence', wz === SENT, JSON.stringify(wz));
}

// ══ G2 (D188 no-mile identity) ═════════════════════════════════════════════════════════════════
console.log('\nG2 no-mile identity: beginner, no mile, x 6 goals x ' + SEEDS.length + ' seeds (' + TAG + ')');
function stripS1(p){
  const q = JSON.parse(JSON.stringify(p)); let n = 0; const tail = ' ' + S1_BEG;
  (function walk(o){ if(!o || typeof o !== 'object') return;
    if(typeof o.note === 'string' && o.note.endsWith(tail)){ o.note = o.note.slice(0, o.note.length - tail.length); n++; }
    for(const k of Object.keys(o)) walk(o[k]); })(q);
  return { q, n };
}
const s1Count = p => { let n = 0; (function walk(o){ if(!o || typeof o !== 'object') return; if(typeof o.note === 'string' && o.note.indexOf(S1_BEG) >= 0) n++; for(const k of Object.keys(o)) walk(o[k]); })(p); return n; };
let BASE = null, baseWhy = '';
if(D188){
  if(BASEFILE && fs.existsSync(BASEFILE)){ try { const b = H.load(BASEFILE); if(+b.version === 225){ BASE = b; baseWhy = 'argv ' + BASEFILE; } else baseWhy = 'argv baseline reads ' + b.version + ', not 225; '; } catch(e){ baseWhy = 'argv baseline failed to boot: ' + e.message + '; '; } }
  if(!BASE){
    const f = path.join(os.tmpdir(), 'g226_d188_v225_' + process.pid + '.html');
    try {
      try { fs.unlinkSync(f); } catch(e){}
      fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V225_COMMIT + ':index.html'], { maxBuffer: 1 << 27 }));
      const b = H.load(f); if(+b.version === 225){ BASE = b; baseWhy += 'git ' + V225_COMMIT.slice(0, 7); } else baseWhy += 'git copy reads ' + b.version;
    } catch(e){ baseWhy += 'git show failed: ' + String(e.message).slice(0, 80); }
    try { fs.unlinkSync(f); } catch(e){}
  }
  console.log('  baseline: ' + (BASE ? 'V225 from ' + baseWhy : 'UNAVAILABLE (' + baseWhy + ')'));
}
{
  const REF = D188 ? BASE : IA;   // era truth: the candidate (V225) must be self-stable and carry no S1
  let selfEq = 0, same = 0, cells = 0, strips = 0; const bad = [], badSelf = [];
  if(!REF){
    ok('G2 ' + TAG + ' V225 baseline builds equal themselves (precondition)', false, 'no V225 baseline (fail closed, not a silent pass): ' + baseWhy);
    if(VER >= V231_ERA) scopeSkip('G2 ' + TAG + ' beginner no-mile program minus the S1 suffix equals the V225 build, digest for digest', 'no V225 baseline');
    else ok('G2 ' + TAG + ' beginner no-mile program minus the S1 suffix equals the V225 build, digest for digest', false, 'no V225 baseline');
  } else {
    for(const goal of ALL6) for(const s of SEEDS){
      cells++; const cfg = cfgOf(goal, 'beginner', s, 0);
      let r1, r2, c;
      try { r1 = H.progDigest(build(REF, cfg)); r2 = H.progDigest(build(REF, cfg)); } catch(e){ badSelf.push(goal + ' seed ' + s + ' baseline threw ' + e.message); continue; }
      if(r1 === r2) selfEq++; else { badSelf.push(goal + ' seed ' + s + ' ' + r1 + ' != ' + r2); continue; }
      try { c = build(IA, cfg); } catch(e){ bad.push(goal + ' seed ' + s + ' candidate threw ' + e.message); continue; }
      if(D188){ const st = stripS1(c); strips += st.n; const dc = H.progDigest(st.q); if(dc === r1) same++; else bad.push(goal + ' seed ' + s + ' cand ' + dc + ' != V225 ' + r1); }
      else { const k = s1Count(c); strips += k; if(k === 0 && H.progDigest(c) === r1) same++; else bad.push(goal + ' seed ' + s + ' S1 notes ' + k); }
    }
    ok('G2 ' + TAG + ' ' + (D188 ? 'V225 baseline' : 'candidate') + ' builds equal themselves before any diff (' + ALL6.length + ' goals x ' + SEEDS.length + ' seeds)', selfEq === cells && cells > 0, selfEq + '/' + cells + (badSelf.length ? '; ' + badSelf.slice(0, 3).join(' | ') : ''));
    if(VER >= V231_ERA) scopeSkip('G2 ' + TAG + ' beginner no-mile program with exactly \' \' + S1 stripped from every note equals the V225 build, digest for digest', same + '/' + cells + ' cells equal, ' + strips + ' S1 suffixes stripped');
    else ok('G2 ' + TAG + ' ' + (D188 ? 'beginner no-mile program with exactly \' \' + S1 stripped from every note equals the V225 build, digest for digest'
                                 : 'beginner no-mile program carries no S1 note (V225 truth: no disclosure pass)'),
       same === cells && cells > 0, same + '/' + cells + ' cells, ' + strips + ' S1 suffixes ' + (D188 ? 'stripped' : 'found') + (bad.length ? '; ' + bad.slice(0, 3).join(' | ') : ''));
  }
}

// ══ G3 (D188 validator) ════════════════════════════════════════════════════════════════════════
console.log('\nG3 validator: _mileEntryState(g, exp), typed literals (' + TAG + ')');
{
  const J = JSON.stringify;
  const call = (g, exp) => { try { return JSON.parse(IA.eval('JSON.stringify(_mileEntryState(' + J(g) + ',' + J(exp) + '))')); } catch(e){ return { crash: e.message }; } };
  const mile = (goal, mm, ss) => ({ id: goal, mileBestMins: mm, mileBestSecs: ss });
  const row = (label, cases, want) => {
    const bad = cases.map(([k, g, exp]) => { const got = call(g, exp); return canon(got) === canon(want) ? null : k + ' -> ' + J(got); }).filter(Boolean);
    ok(label + ' -> ' + J(want), bad.length === 0, (cases.length - bad.length) + '/' + cases.length + (bad.length ? '; ' + bad.slice(0, 2).join(' | ') : ''));
  };
  row('G3 ' + TAG + ' beginner blank mile on all 5 run goals', WIZ_GOALS.map(g => [g, { id: g }, 'beginner']), { ok: true });
  row('G3 ' + TAG + ' beginner 2:30 on all 5 run goals', WIZ_GOALS.map(g => [g, mile(g, '2', '30'), 'beginner']), D188 ? { ok: false, msg: MSG_UNDER3 } : { ok: true });
  row('G3 ' + TAG + ' beginner 30:00 on all 5 run goals', WIZ_GOALS.map(g => [g, mile(g, '30', '0'), 'beginner']), D188 ? { ok: false, msg: MSG_OVER25 } : { ok: true });
  row('G3 ' + TAG + ' beginner 13:00 on all 5 run goals', WIZ_GOALS.map(g => [g, mile(g, '13', '0'), 'beginner']), D188 ? { ok: true, adv: ADV_SLOW_1300 } : { ok: true });
  row('G3 ' + TAG + ' beginner 4:30 on all 5 run goals', WIZ_GOALS.map(g => [g, mile(g, '4', '30'), 'beginner']), D188 ? { ok: true, adv: ADV_FAST_0430 } : { ok: true });
  row('G3 ' + TAG + ' intermediate blank mile on run_pace_goal (R3 untouched)', [['run_pace_goal', { id: 'run_pace_goal' }, 'intermediate']], { ok: false, blank: true, msg: MSG_R3 });
  row('G3 ' + TAG + ' D116 sheet call _mileEntryState({mileBestMins:\'30\',mileBestSecs:\'0\'},\'beginner\')', [['sheet', { mileBestMins: '30', mileBestSecs: '0' }, 'beginner']], D188 ? { ok: false, msg: MSG_OVER25 } : { ok: true });
}

// ══ G4 (D188 surfaces) ═════════════════════════════════════════════════════════════════════════
console.log('\nG4 surfaces: wizard field, advisory slot, program-card pencil (' + TAG + ')');
{
  const els = new Map(), mkEl = IA.window.document.createElement;
  IA.window.document.getElementById = id => { if(!els.has(id)){ const e = mkEl('div'); e.id = id; els.set(id, e); } return els.get(id); };
  const count = (s, needle) => s.split(needle).length - 1;
  const wantField = D188 ? 1 : 0;
  const bad = []; let cells = 0;
  for(const goal of WIZ_GOALS){
    const run = { id: goal, label: goal, baselineDist: '', baseline: '' };
    if(goal === 'run_pace_goal'){ run.targetDist = '1.5'; run.targetMins = '12'; run.targetSecs = '0'; }
    const wd = { primaryPath: RACE.has(goal) ? 'event' : 'hybrid', cardioTypes: ['run'], experience: 'beginner', ageBracket: '18-35',
      eventTargeted: RACE.has(goal), raceDate: RACE.has(goal) ? '2027-01-31' : null, liftingFocus: 'balanced', equipment: 'crossfit',
      restDays: ['sun', 'wed'], unit: 'lbs', seed: 1000, name: 'G226', cardioGoals: { run } };
    let body = '';
    try { els.clear(); IA.eval('WD = ' + JSON.stringify(wd) + '; activeProg = null; wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep();'); body = els.get('wizardBody').innerHTML || ''; }
    catch(e){ bad.push(goal + ' render threw ' + e.message); continue; }
    const f = count(body, 'Current mile time'), a = count(body, 'id="mileAdvisory"');
    if(f === wantField && a === wantField && body.length > 0) cells++; else bad.push(goal + ' field ' + f + ' advisory ' + a + ' body ' + body.length);
  }
  ok('G4 ' + TAG + ' beginner wizard render on all 5 run goals: "Current mile time" exactly ' + wantField + ' and id="mileAdvisory" exactly ' + wantField,
     bad.length === 0 && cells === WIZ_GOALS.length, cells + '/' + WIZ_GOALS.length + (bad.length ? '; ' + bad.join(' | ') : ''));

  let detail = null; try { detail = IA.eval('progDetailHTML'); } catch(e){}
  const card = over => { try { return detail({ id: 'gQ', name: 'n', totalWeeks: 14, startDate: '2026-09-28', cfg: Object.assign(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)), over) }); } catch(e){ return 'THREW ' + e.message; } };
  const PENCIL = 'aria-label="Change mile time"';
  const begMile = count(card({ experience: 'beginner' }), PENCIL);
  const begNone = count(card({ experience: 'beginner', cardioGoals: { run: { id: 'run_5k', label: '5K' } } }), PENCIL);
  const intCard = count(card({}), PENCIL);
  const wantBeg = D188 ? 1 : 0;
  ok('G4 ' + TAG + ' beginner program card carries ' + PENCIL + ' exactly ' + wantBeg + ' (run_half with a 10:30 mile; run_5k no mile)',
     typeof detail === 'function' && begMile === wantBeg && begNone === wantBeg, 'with mile ' + begMile + ', no mile ' + begNone);
  ok('G4 ' + TAG + ' intermediate program card still carries ' + PENCIL + ' exactly 1', typeof detail === 'function' && intCard === 1, intCard);
}

// ══ G5 (D188 token-gone) ═══════════════════════════════════════════════════════════════════════
console.log('\nG5 token-gone: comment-stripped source (' + TAG + ')');
// ── comment stripper (lifted verbatim from tests/gates/g225_d187_pacerate.js, itself from g221/g223) ──
const BS = String.fromCharCode(92);
function stripComments(src){
  const out = [], n = src.length, tpl = [];
  let i = 0, depth = 0, prevSig = '', prevWord = '';
  const RX_PREV = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
  const RX_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
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
{
  const CS = stripComments(IA.js);
  const lineOf = idx => CS.slice(0, idx).split('\n').length;
  const TOK = "'beginner'", ANCH = ['mileBest', 'arguments[12]', 'mileBestSecs)'];
  // Gate amendment (a): the R3 token E6 mandates is exempted by its index; the R3 literal is counted once on its own row.
  const R3 = "if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true";
  const r3N = CS.split(R3).length - 1;
  const r3Tok = r3N === 1 ? CS.indexOf(R3) + R3.indexOf(TOK) : -1;
  const hits = [];
  for(let i = CS.indexOf(TOK); i >= 0; i = CS.indexOf(TOK, i + 1)){
    if(i === r3Tok) continue;
    const win = CS.slice(Math.max(0, i - 120), i + TOK.length + 120);
    const a = ANCH.filter(x => win.indexOf(x) >= 0);
    if(a.length) hits.push('cs:' + lineOf(i) + ' [' + a.join(',') + '] ' + CS.slice(Math.max(0, i - 60), i + TOK.length + 20).replace(/\s+/g, ' '));
  }
  const cnt = rx => (CS.match(rx) || []).length;
  const tokens = [
    ["kind === 'beginner'", /kind\s*===?\s*'beginner'/g],
    ["kind!=='beginner'", /kind\s*!==?\s*'beginner'/g],
    ["'beginner default'", /'beginner default'/g],
    ['beginner default of', /beginner default of/g],
  ];
  const cmp = k => (D188 ? k === 0 : k > 0);
  const want = D188 ? '0' : '> 0 (the V225 gates exist, so the scan is not vacuous)';
  ok('G5 ' + TAG + ' R3 literal (E6) occurs exactly ' + (D188 ? 1 : 0) + ' times', D188 ? r3N === 1 : r3N === 0, r3N);
  ok('G5 ' + TAG + " 'beginner' within 120 characters of mileBest / arguments[12] / mileBestSecs), R3 token exempted by index: " + want, cmp(hits.length), hits.length + (hits.length ? ': ' + hits.slice(0, 6).join(' || ') : ''));
  for(const [label, rx] of tokens){ const k = cnt(rx); ok('G5 ' + TAG + ' ' + label + ': ' + want, cmp(k), k); }
  console.log('  comment stripper: tokenizer-safe pass (strings, template literals and regex literals kept), stripped ' + (IA.js.length - CS.length) + ' chars');
}

// ══ G1h (D188 Class A2 both directions + Class A1-L: the re-licence as a predicate) ═════════════════════
// Ruling: tests/measure/v226_rulings/d188_a2_relicence.md; evidence measure_a2_tierflips_v226.md. Engine roots
// named there (index.html :11014 _longRunTier, :11022 minutes, :11024 thresholds, :3969 run_base long run,
// :3816-3818 the anchor) are NOT read here; the oracle below is typed from the doctrine text.
{
  const G1H_ROWS = ['G1h-P0 V225 self-identity', 'G1h-P1 population bound', 'G1h-A1L length licence', 'G1h-P2 long-run set and direction',
    'G1h-P2b 11:30 weekGrid identity', 'G1h-P3 oracle tier = applied tier, minutes direction', 'G1h-P4 new-tier content',
    'G1h-P5 unmoved days byte-identical', 'G1h-L1 liveness shorter tier', 'G1h-L2 liveness longer tier', 'G1h-L3 liveness A1-L'];
  console.log('\nG1h D188 A2 / A1-L licence (re-licence 2026-10-01): beginner x 4 goals x 2 path/focus cells x mile {none, 9:00, 11:30, 13:00} x 2 rest x 3 seeds, + the same intermediate lattice as the P1 control (' + TAG + ')');
  if(!D188){
    G1H_ROWS.forEach(r => { na++; console.log('  NA ' + r + ': the licence compares V226 against V225; ia-version ' + VER + ' has no counterpart'); });
  } else if(!BASE){
    ok('G1h D188 V225 baseline available (fail closed, not a silent pass)', false, baseWhy);
  } else {
    const tB = RealDate.now();
    const LRJ = v => JSON.stringify(v, (k, x) => (k === 'id' || k === 'created' || k === '_swapUniverse' || k === '_swapUniverseByKey') ? undefined : x);
    const HM = 690;   // the beginner default, hand (D9 / V176): 11:30
    const GL = [['base3mi', { id: 'run_base', baselineDist: '3', baseline: '3mi' }], ['base', { id: 'run_base' }], ['half', { id: 'run_half' }],
                ['pace1330', { id: 'run_pace_goal', targetDist: '1.5', targetMins: '13', targetSecs: '30', paceUnit: 'mi' }]];
    const PF = [['event', 'support_prevention'], ['hybrid', 'balanced']];
    const MI = [0, 540, 690, 780];                      // none, 9:00, 11:30, 13:00
    const RS = [['mon', 'thu', 'sun'], ['sun', 'wed']];
    const SD = [1000, 1001, 76308];
    const lrCfg = (g, exp, pth, foc, m, rest, seed) => {
      const run = Object.assign({}, g);
      if(m){ run.mileBestMins = String(Math.floor(m / 60)); run.mileBestSecs = String(m % 60); run.mileBestSrc = { kind: 'entered' }; }
      const race = RACE.has(g.id);
      return { name: 'G226h', primaryPath: pth, eventTargeted: race, raceDate: race ? '2026-12-20' : '', liftingFocus: foc, experience: exp,
        ageBracket: '18-35', equipment: 'commercial', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(), bench: 185, squat: 255, deadlift: 315,
        seed, startDate: '2026-10-05', cardioTypes: ['run'], cardioGoals: { run } };
    };
    // D189 S1 by level, typed (hand defaults D9 / V176: beginner 690 = 11:30, intermediate 570 = 9:30). Stripped as ' ' + S1.
    const S1_OF = { beginner: S1_BEG,
      intermediate: 'Paces here start from a 9:30 mile, the intermediate default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.' };
    const stripNote = (day, s) => { if(!s) return day; const q = JSON.parse(JSON.stringify(day)); const tail = ' ' + s;
      (function walk(o){ if(!o || typeof o !== 'object') return; if(typeof o.note === 'string' && o.note.endsWith(tail)) o.note = o.note.slice(0, o.note.length - tail.length);
        for(const k of Object.keys(o)) walk(o[k]); })(q); return q; };
    // ── the oracle: dose arithmetic and the doctrine lines, typed ──
    const minOf = d => !d ? 0 : d.k === 'time' ? (+d.mins || 0) : (+d.mi || 0) * (+d.tgt || 0) / 60;
    const lrOf = day => { const c = day && day.cardio; if(!c || Array.isArray(c) || !c.dose) return null;
      if(c.isNRC){ if(!/^long run/i.test(c.subtype || '') || /race day|time trial/i.test(c.subtype || '')) return null; }
      else if(c.type !== 'run' || c.dose.key !== 'long') return null;
      return c; };
    const oTier = day => { const c = lrOf(day); if(!c) return null; if(c.isNRC && /rehearsal/i.test(c.detail || '')) return 'A';
      const m = minOf(c.dose); if(!m) return null; return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C'; };
    const RK = { C: 0, B: 1, A: 2 };
    // ── content vocabularies (g209 D18/D140, plus D153's hinge pair) and the doctrine set count ──
    const LEGH = /swing|clean|snatch|deadlift|romanian|\brdl\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\bleg\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol|pull-?through|back extension/i;
    const STR = /stretch|mobility|90\/90|foam|worlds greatest/i, CAR = /carry|farmer|suitcase/i, PWR = /power|explosive/i;
    const dSets = det => { const s = String(det || ''); let x = /^(\d+)\s*[x×]/.exec(s); if(x) return +x[1]; x = /\b(\d+)\s*sets?\b/i.exec(s); return x ? +x[1] : 1; };
    const secs = day => day.sections || [];
    const its = day => secs(day).reduce((a, s) => a.concat(s.items || []), []);
    const nSets = day => its(day).filter(i => !STR.test(i.name || '')).reduce((a, i) => a + dSets(i.detail), 0);
    const mobOnly = day => secs(day).every(s => /post-run mobility|taper/i.test(s.label || ''));
    const bBan = day => its(day).some(i => LEGH.test(i.name || '')) || secs(day).some(s => PWR.test(s.label || '') || PWR.test(s.coreHeader || '')) || nSets(day) > 8;
    const carries = day => its(day).filter(i => CAR.test(i.name || '')).length + secs(day).filter(s => /carry/i.test(s.label || '') || /carry/i.test(s.coreHeader || '')).length;
    const shapeOf = day => (secs(day).map(s => '[' + (s.label || s.coreHeader || '') + '] ' + (s.items || []).map(i => i.name).join(', ')).join(' ; ') || '(none)').slice(0, 220);
    // ── the applied tier, read off the printed day ──
    //   '-' nothing printed (unreadable: any oracle tier agrees); 'A' post-run mobility shape; 'C' carries what B bans; '?' B or C.
    const read1 = day => !secs(day).length ? '-' : (mobOnly(day) && secs(day).some(s => /post-run mobility/i.test(s.label || ''))) ? 'A' : bBan(day) ? 'C' : '?';
    const names = day => its(day).map(i => i.name || '');
    const inside = (a, b) => { const r = b.slice(); for(const x of a){ const k = r.indexOf(x); if(k < 0) return false; r.splice(k, 1); } return r.length > 0; };
    const readPair = (d5, d6) => {
      let r5 = read1(d5), r6 = read1(d6);
      if(LRJ(secs(d5)) === LRJ(secs(d6))){ const k = r5 !== '?' ? r5 : r6; return [k, k]; }
      if(r5 === '?' && r6 === 'C') r5 = 'B';
      else if(r6 === '?' && r5 === 'C') r6 = 'B';
      else if(r5 === '?' && r6 === '?'){ if(inside(names(d5), names(d6))){ r5 = 'B'; r6 = 'C'; } else if(inside(names(d6), names(d5))){ r6 = 'B'; r5 = 'C'; } }
      return [r5, r6];
    };
    const agree = (o, a) => a === o || a === '-' || (a === '?' && (o === 'B' || o === 'C'));
    const sgn = x => x > 0 ? 1 : x < 0 ? -1 : 0;
    const nBad = { P0: 0, P1: 0, A1L: 0, P2: 0, P2b: 0, P3: 0, P4: 0, P5: 0 }, bad = { P0: [], P1: [], A1L: [], P2: [], P2b: [], P3: [], P4: [], P5: [] };
    const miss = (k, s) => { nBad[k]++; if(bad[k].length < 3) bad[k].push(s); };
    const cnt = { cfg: 0, lic: 0, pop1: 0, same: 0, a1l: 0, a1lHit: 0, at690: 0, pairs: 0, unmoved: 0, nonLR: 0, p4: 0, p4new: 0, minMv: 0, shorter: 0, longer: 0 };
    const p4 = (day, t, where, isNew) => {
      cnt.p4++; if(isNew) cnt.p4new++;
      const k = carries(day); if(k) miss('P4', where + ' tier ' + t + ' carries ' + k + ': ' + shapeOf(day));
      if(t === 'A' && !mobOnly(day)) miss('P4', where + ' tier A lifts: ' + shapeOf(day));
      if(t === 'B'){
        const hl = its(day).filter(i => LEGH.test(i.name || '')).map(i => i.name);
        const pw = secs(day).filter(s => PWR.test(s.label || '') || PWR.test(s.coreHeader || '')).map(s => s.label || s.coreHeader);
        const n = nSets(day);
        if(hl.length || pw.length || n > 8) miss('P4', where + ' tier B: hinge/leg [' + hl.join(', ') + '] power [' + pw.join(', ') + '] ' + n + ' sets');
      }
    };
    const LAT = [];
    for(const exp of ['beginner', 'intermediate']) for(const [gk, g] of GL) for(const [pth, foc] of PF) for(const m of MI) for(const rest of RS) for(const seed of SD)
      LAT.push({ exp, gk, g, pth, foc, m, rest, seed, tag: [exp, gk, pth + '/' + foc, m ? clk(m) : 'no mile', rest.join('+'), 's' + seed].join(' ') });
    for(const L of LAT){
      cnt.cfg++;
      const cfg = lrCfg(L.g, L.exp, L.pth, L.foc, L.m, L.rest, L.seed);
      let p5, p5b, p6;
      try { p5 = build(BASE, cfg); p5b = build(BASE, cfg); } catch(e){ miss('P0', L.tag + ' V225 threw ' + e.message); continue; }
      if(H.progDigest(p5) !== H.progDigest(p5b)){ miss('P0', L.tag + ' V225 build != itself'); continue; }
      try { p6 = build(IA, cfg); } catch(e){ miss('P2', L.tag + ' candidate threw ' + e.message); continue; }
      const lic = L.exp === 'beginner' && L.m > 0;          // the licence's population: a beginner who entered a mile
      const s = lic ? sgn(L.m - HM) : 0;
      if(lic) cnt.lic++; else cnt.pop1++;
      const len5 = p5.totalWeeks, len6 = p6.totalWeeks;
      if(len5 !== len6){
        // A1-L: only a beginner's pace goal with an entered mile off 11:30, in the direction of (m - 690).
        cnt.a1l++;
        const legal = L.g.id === 'run_pace_goal' && L.exp === 'beginner' && L.m > 0 && L.m !== HM && sgn(len6 - len5) === sgn(L.m - HM);
        if(!legal) miss('A1L', L.tag + ' ' + len5 + ' -> ' + len6 + ' weeks');
        if(legal && L.gk === 'pace1330' && L.m === 540 && len6 === 9) cnt.a1lHit++;
        for(let w = 1; w <= len6; w++) for(const d of DAYS){ const day = p6.weeks[w] && p6.weeks[w][d]; const t = day && oTier(day); if(t) p4(day, t, L.tag + ' W' + w + ' ' + d + ' (A1-L)', true); }
        continue;
      }
      cnt.same++;
      if(lic && L.m === HM){ cnt.at690++; if(H.weekGrid(p5) !== H.weekGrid(p6)) miss('P2b', L.tag + ' weekGrid differs at 11:30'); }
      const s1 = L.m ? null : S1_OF[L.exp];
      for(let w = 1; w <= len5; w++) for(const d of DAYS){
        const d5 = p5.weeks[w] && p5.weeks[w][d], d6 = p6.weeks[w] && p6.weeks[w][d], where = L.tag + ' W' + w + ' ' + d;
        if(!d5 || !d6){ if(d5 || d6) miss('P2', where + ' present on one side only'); continue; }
        const t5 = oTier(d5), t6 = oTier(d6);
        if(!t5 && !t6){ cnt.nonLR++; if(LRJ(secs(d5)) !== LRJ(secs(d6))) miss('P5', where + ' non-long-run day: ' + shapeOf(d5) + ' -> ' + shapeOf(d6)); continue; }
        if(!t5 || !t6){ miss('P2', where + ' long run on one side only (' + (t5 || '-') + ' / ' + (t6 || '-') + ')'); continue; }
        cnt.pairs++;
        const c5 = d5.cardio, c6 = d6.cardio, mv = sgn(RK[t6] - RK[t5]), dm = +(minOf(c6.dose) - minOf(c5.dose)).toFixed(2);
        const mins = minOf(c5.dose).toFixed(1) + ' -> ' + minOf(c6.dose).toFixed(1) + ' min';
        if((c5.subtype || '') !== (c6.subtype || '')) miss('P2', where + ' subtype ' + c5.subtype + ' -> ' + c6.subtype);
        if(!lic){
          if(mv !== 0 || LRJ(stripNote(d6, s1)) !== LRJ(d5)) miss('P1', where + ' ' + t5 + ' -> ' + t6 + ' (' + mins + ') ' + shapeOf(d5) + ' -> ' + shapeOf(d6));
        } else {
          if(mv !== 0 && mv !== s) miss('P2', where + ' tier ' + t5 + ' -> ' + t6 + ' against sign(m - 690) = ' + s);
          if(sgn(dm) !== 0){ cnt.minMv++; if(sgn(dm) !== s) miss('P3', where + ' ' + mins + ' against sign(m - 690) = ' + s); }
          if(mv < 0 && L.m === 540) cnt.shorter++;
          if(mv > 0 && L.m === 780 && L.g.id === 'run_base' && L.pth === 'event') cnt.longer++;
        }
        const [a5, a6] = readPair(d5, d6);
        if(!agree(t5, a5) || !agree(t6, a6)) miss('P3', where + ' oracle ' + t5 + '/' + t6 + ' (' + mins + ') applied ' + a5 + '/' + a6 + ': ' + shapeOf(d5) + ' -> ' + shapeOf(d6));
        if(mv === 0){ cnt.unmoved++; if(LRJ(secs(d5)) !== LRJ(secs(d6))) miss('P5', where + ' tier ' + t5 + ' unmoved: ' + shapeOf(d5) + ' -> ' + shapeOf(d6)); }
        p4(d6, t6, where, mv !== 0);
      }
    }
    const ex = k => nBad[k] + (bad[k].length ? ': ' + bad[k].join(' || ') : '');
    console.log('  lattice ' + cnt.cfg + ' cfgs (' + cnt.lic + ' licence population: beginner with a mile; ' + cnt.pop1 + ' P1 population: intermediate, or beginner with no mile); ' +
      cnt.same + ' same length, ' + cnt.a1l + ' length moves; long-run pairs ' + cnt.pairs + ' (tier unmoved ' + cnt.unmoved + ', minutes moved ' + cnt.minMv + '), non-long-run days ' + cnt.nonLR +
      '; V226 long-run days under P4 ' + cnt.p4 + ' (new tier or A1-L ' + cnt.p4new + ')');
    ok('G1h-P0 D188 the V225 baseline equals itself on every lattice cfg before any diff (' + LAT.length + ' cfgs, digest)', nBad.P0 === 0 && cnt.cfg === LAT.length, ex('P0'));
    ok('G1h-P1 D188 intermediate, or beginner with no mile (S1 suffix stripped): 0 tier moves and every long-run day byte-identical to V225 (' + cnt.pop1 + ' cfgs)', nBad.P1 === 0 && cnt.pop1 > 0, ex('P1'));
    ok('G1h-A1L D188 a length change only on a beginner pace goal with a mile off 11:30, sign(len226 - len225) = sign(m - 690) (' + cnt.a1l + ' cfgs; judged by P4 only)', nBad.A1L === 0, ex('A1L'));
    ok('G1h-P2 D188 same length: a long run on one side is a long run on the other with the same subtype; tier moves only toward sign(m - 690) (C<B<A)', nBad.P2 === 0 && cnt.pairs > 0, ex('P2'));
    if(VER >= V231_ERA) scopeSkip('G1h-P2b D188 beginner at 11:30 (m = 690): weekGrid byte-identical to V225 (' + cnt.at690 + ' cfgs)', nBad.P2b + ' of ' + cnt.at690 + ' cfgs differ');
    else ok('G1h-P2b D188 beginner at 11:30 (m = 690): weekGrid byte-identical to V225 (' + cnt.at690 + ' cfgs)', nBad.P2b === 0 && cnt.at690 > 0, ex('P2b'));
    ok('G1h-P3 D188 the hand tier (dose minutes, >= 75 A, >= 45 B) equals the tier read off the printed day, both sides; minutes move only toward sign(m - 690) (' + cnt.pairs + ' pairs)', nBad.P3 === 0 && cnt.pairs > 0, ex('P3'));
    ok('G1h-P4 D188 V226 long-run content: A no lifting; B no hinge/leg, no power, at most 8 working sets; no carry on any tier (' + cnt.p4 + ' days, ' + cnt.p4new + ' new tier or A1-L)', nBad.P4 === 0 && cnt.p4new > 0, ex('P4'));
    if(VER >= V231_ERA) scopeSkip('G1h-P5 D188 same length: every non-long-run day and every unmoved long-run day has V225\'s sections byte for byte (' + cnt.nonLR + ' + ' + cnt.unmoved + ' days)', nBad.P5 + ' days differ');
    else ok('G1h-P5 D188 same length: every non-long-run day and every unmoved long-run day has V225\'s sections byte for byte (' + cnt.nonLR + ' + ' + cnt.unmoved + ' days)', nBad.P5 === 0 && cnt.nonLR > 0 && cnt.unmoved > 0, ex('P5'));
    ok('G1h-L1 D188 liveness: a 9:00 beginner moves long runs to a shorter tier (' + cnt.shorter + ' days)', cnt.shorter > 0, cnt.shorter);
    ok('G1h-L2 D188 liveness: a 13:00 beginner on run_base, event, support focus moves long runs to a longer tier (' + cnt.longer + ' days)', cnt.longer > 0, cnt.longer);
    ok('G1h-L3 D188 liveness: pace goal 1.5 mi in 13:30 at a 9:00 mile shortens to 9 weeks under A1-L (' + cnt.a1lHit + ' cfgs)', cnt.a1lHit > 0, cnt.a1lHit);
    console.log('  G1h runtime ' + ((RealDate.now() - tB) / 1000).toFixed(1) + ' s (' + (LAT.length * 3) + ' builds)');
  }
}

done();
