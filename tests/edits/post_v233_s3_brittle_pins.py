#!/usr/bin/env python3
"""Post-V233 tooling pass, slice 3: brittle source pins -> content checks. TESTS ONLY.

Ruling: Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, Message 1:
"Convert brittle line and text checks (like g224) to content checks." Evidence: measure mT
(tests/measure/v233_rulings/measure_tooling_inventory_mT.md, BRITTLE PINS) and mH
(tests/measure/v232_rulings/measure_gate_history_mH.md, class B).

index.html is NOT touched and ia-version stays 233 (no bump in this script, by brief).

Diff classes this script may produce, and nothing else:
  (T-d) brittle pin -> content check in tests/gates/g197d_d84_base.js (E5 x 3) and
        tests/gates/g204_clock_limb.js (C8).
  (T-e) tests/sabotage/v198.json M7 rewritten as a behavioural mutation inside capSessionBudget.
        v204.json is NOT edited: the differential proved all five v204 mutations change a
        rendered clock string (M1 80, M2 1312, M3 12, M4 4, M5 63 differing clock lines).

Every replacement anchor is asserted count==1 before anything is written; the first miss
aborts the whole script with nothing written.
"""
import json, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G197D = os.path.join(ROOT, 'tests', 'gates', 'g197d_d84_base.js')
G204 = os.path.join(ROOT, 'tests', 'gates', 'g204_clock_limb.js')
V198 = os.path.join(ROOT, 'tests', 'sabotage', 'v198.json')
INDEX = os.path.join(ROOT, 'index.html')


def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)


def once(src, anchor, label):
    n = src.count(anchor)
    if n != 1:
        die('%s: anchor count %d, want 1: %r' % (label, n, anchor[:90]))


def rep(src, old, new, label):
    once(src, old, label)
    return src.replace(old, new, 1)


def rep_span(src, start, end, new, label):
    """Replace src[start .. end] inclusive of both markers, each asserted count==1."""
    once(src, start, label + ' start')
    once(src, end, label + ' end')
    a = src.index(start)
    b = src.index(end)
    if b < a:
        die(label + ': end marker precedes start marker')
    return src[:a] + new + src[b + len(end):]


# ════════════════════════════════════════════════════════════════════════════════
# 1. g197d E5 (and the :416 _itemCost/_setCount byte identity) -> behaviour digests
# ════════════════════════════════════════════════════════════════════════════════
g = open(G197D, encoding='utf-8').read()

g = rep(g,
"""// g197d_d84_base — V197 D84, the BASELINE half of section E: the candidate is swept
// against the SHIPPED baseline (E1g / E1h) and the budget machinery is proved byte-
// identical to it (E5 × 2). Six assertions. FOUR need a baseline: E1g, E1h and the two
// E5 byte-identity parts. TWO need none and run on every invocation: E0, the liveness
// guard, and the E5 sha256 pin on capSessionBudget's own slice, which reads the candidate
// alone and is this file's only sabotage coverage of the app.
""",
"""// g197d_d84_base — V197 D84, the BASELINE half of section E: the candidate is swept
// against the SHIPPED baseline (E1g / E1h) and the budget machinery is confined to the
// behaviour its last licensing ruling printed (E5 × 3). Six assertions. TWO need a
// baseline: E1g and E1h. FOUR need none and run on every invocation: E0, the liveness
// guard, and the three E5 behaviour digests (capSessionBudget, _itemCost, _setCount),
// which replay a frozen corpus through the candidate and are this file's only sabotage
// coverage of the app.
""", 'g197d header')

g = rep_span(g,
"// WITH NO BASELINE THE FOUR COMPARISON ASSERTIONS DO NOT RUN, ON PURPOSE.",
"// than a change in behaviour, under the harness that could not reach it at all before.\n",
"""// WITH NO BASELINE THE TWO COMPARISON ASSERTIONS DO NOT RUN, ON PURPOSE. tests/sabotage.py
// runs `node <gate> mutated.html` with no argv[3], so under sabotage E1g and E1h are
// skipped and this file prints their "not run" line. The mutations that used to trip
// section E's comparisons stay pointed at g197c_d84_cmp.js.
//
// E5 IS NOT ONE OF THEM. Since the V198 tooling pass it needs no baseline and runs on every
// invocation, which closed a real hole: before that every app-grading assertion in this
// file sat behind if (BASE_HTML), so under sabotage the file graded nothing and printed a
// green summary no matter what the mutation did. Until Post-V233 E5 was a sha256 of
// capSessionBudget's SOURCE slice, paired with a comment-only mutation. Post-V233 (Mario:
// "Convert brittle line and text checks (like g224) to content checks.") it is three
// digests of the budget machinery's BEHAVIOUR on a frozen corpus, and
// tests/sabotage/v198.json M7 is a behavioural edit inside capSessionBudget that trips E5
// by name. See the E5 block for the corpus, the era rows and their provenance.
""", 'g197d E5-not-one-of-them paragraph')

g = rep_span(g,
"// E0 IS NOW TWO PARTS, because moving E5 out took the no-baseline count from 1 to 2 and a\n",
"// missing summary are all red.\n",
"""// E0 IS TWO PARTS, because moving E5 out raised the no-baseline count, and a changing PASS
// count is exactly what once masked a dead gate body. The number is not relaxed, it is
// ASSERTED: done() computes how many assertions were actually PUT (passed, failed or
// refused) and fails by name if that is below NOBASE_MIN, the four that need no baseline
// (E0 and the three E5 behaviour digests). A body that stops executing anywhere above
// done() now produces a NAMED red instead of a shorter green, whichever assertions went
// missing — including the case E0's own lattice claim cannot see, where E0 passes and
// everything after it is gone. Under sabotage a clean artifact prints PASS 4 FAIL 0; fewer
// than four put, and a missing summary, are red.
""", 'g197d E0 paragraph')

g = rep(g,
"""//   suite that sees the D85 edit as an EDIT rather than as an outcome.
//
// Usage: node tests/gates/g197d_d84_base.js""",
"""//   suite that sees the D85 edit as an EDIT rather than as an outcome.
//   POST-V233 it is put on BEHAVIOUR instead of text (the E5 block): the text pin went red
//   at V198, V199 twice and V231 pre with no behaviour change, and never saw D89's ruled
//   move, which sat outside its slice.
//
// Usage: node tests/gates/g197d_d84_base.js""", 'g197d E5 history paragraph')

g = rep(g,
"""// The number of assertions this file puts with NO baseline at all: E0 (the lattice
// enumeration) and the E5 sha256 pin on capSessionBudget. Both are answered by the
// candidate alone. done() enforces it as a floor; see the E0 note in the header.
const NOBASE_MIN = 2;
""",
"""// The number of assertions this file puts with NO baseline at all: E0 (the lattice
// enumeration) and the three E5 behaviour digests (capSessionBudget, _itemCost, _setCount).
// All four are answered by the candidate and the committed V196 corpus source alone.
// done() enforces it as a floor; see the E0 note in the header.
const NOBASE_MIN = 4;
""", 'g197d NOBASE_MIN')

g = rep(g,
"""  // produced it ran. This file always PUTS at least NOBASE_MIN assertions, because neither
  // of them needs a second artifact, so a shorter count means assertions stopped executing.
""",
"""  // produced it ran. This file always PUTS at least NOBASE_MIN assertions, because none
  // of them needs a second artifact, so a shorter count means assertions stopped executing.
""", 'g197d done() comment')

g = rep(g,
"""      + NOBASE_MIN + ' (E0 lattice enumeration, E5 capSessionBudget digest pin) — neither '
      + 'needs a baseline, so the gate body stopped executing');
""",
"""      + NOBASE_MIN + ' (E0 lattice enumeration, E5 capSessionBudget/_itemCost/_setCount behaviour '
      + 'digests) — none needs a baseline, so the gate body stopped executing');
""", 'g197d done() message')

E5_NEW = r"""// ── E5: CONFINEMENT OF THE BUDGET MACHINERY, READ OFF BEHAVIOUR ─────────────────────
// THE CLAIM IS UNCHANGED, and is the one this block has made since V198: "nothing has edited
// budget machinery since D85 without a ruling", and, for _itemCost and _setCount, "D85 owns
// the capSessionBudget trim loop and nothing else". What changed is WHERE it is read. Until
// Post-V233 it was a sha256 of capSessionBudget's SOURCE slice (`function capSessionBudget(`
// up to `\nfunction capRegionalFatigue`) plus a byte comparison of the _itemCost/_setCount
// slices against the baseline. That text pin went red at V198, V199 twice and V231 pre with
// no behaviour change (an alias, a declaration placed inside a slice, a comment), and it never
// saw the one ruled move that sat OUTSIDE its slice (D89, below). Mario, Post-V233: "Convert
// brittle line and text checks (like g224) to content checks."
// (tests/measure/v233_rulings/post_v233_proof_scope_decisions.md; evidence
// measure_tooling_inventory_mT.md BRITTLE PINS and v232_rulings/measure_gate_history_mH.md
// class B.) This RETIRES the V198 doctrine that the confinement must see a comment-only EDIT:
// a comment is not budget machinery. tests/sabotage/v198.json M7 is now a behavioural edit.
//
// THE CORPUS IS FROZEN. It is every day capSessionBudget is handed while the FIXED V196
// artifact (baselines/V196.html, the committed file E1h already reads) builds the 144 configs
// of this gate's own lattice at rest sun+wed and seed 1013: every tier × goal × injury, with
// focus and experience crossed (hypertrophy/beginner, balanced/advanced). It is captured from
// V196 and NEVER from the candidate, on purpose: the candidate's days move with every DRAW
// ruling, and a budget confinement that reddened on a draw change would be a draw pin, the
// same brittleness moved one step. The capture wraps V196's global binding at run time; no
// source text is read or injected anywhere. Each captured day is replayed through the
// CANDIDATE's capSessionBudget with its own cardio (so the interference cap is exercised
// too), and every item on it through _setCount and _itemCost; each stream is digested.
//
// THE ORACLE IS AN ERA ROW, NOT A HAND TABLE, deliberately: the claim is "nothing has moved
// since the licensing ruling", and a claim that a build moved nothing is an era row (CLAUDE.md
// Version scope). The rows are RANGES keyed to the ruling that last moved the budget's
// behaviour, the newest open-ended, the same shape as the old `<` predicates, so a build that
// moves nothing needs no row and tests/era_bump.py has nothing to carry. A DIGEST IS REFRESHED
// ONLY BY A RULING: when a row fails, the question is which ruling licensed the move, and the
// answer is a range row printed from the ruled tree that closes the open one. Printed by
// builder with this block's own corpus and replay on every tag V196..V233 (Post-V233 slice 3,
// tests/edits/post_v233_s3_brittle_pins.py):
//   196..197  pre-D85      V196 and V197 replay identically (one pre-D85 text digest covered both)
//   198..199  D85 (V198)   the posterior floor. D91 (V199) hoisted the lens to _isPostChain:
//                          the TEXT moved and the behaviour did not, so D91 has no row
//   200..230  D89 (V200)   _compoundTier reads Pallof press as core (tier 0), so the tier-3
//                          skip stops shielding it. Outside the old slice: never seen by text
//   231..     D195 (V231)  D195-B `_cost` (the _prehabHalf set) and the Leg circuit ii>=3 score
//   _setCount and _itemCost replay identically on every tag V196..V233: one open row each.
  const BUDGET_BEHAVIOUR_BY_ERA = [
    { from: 196, to: 197,      rule: 'pre-D85',     csb: '3606c512520dc264d5b41b04313e367ac212b4c0d2e6c2fe21337ca64135f87b' },
    { from: 198, to: 199,      rule: 'D85 (V198)',  csb: '42b54ee6913b887dd1ba112636b505c6cee53ce23d51c4590f2608639ebed91a' },
    { from: 200, to: 230,      rule: 'D89 (V200)',  csb: '470b536d85a0747dd37cadd59c017d802fc715f8c75cc2b801dde38aa95bfd0d' },
    { from: 231, to: Infinity, rule: 'D195 (V231)', csb: '6be03983288738c911e207419b94562ca482169d477584880ef5d75cf4a904be' },
  ];
  const ITEM_HELPERS_BY_ERA = [
    { from: 196, to: Infinity, rule: 'V196',
      setCount: 'f5a34d9cf980d05e9b2a6594b4093361fbf7324561afc3b2686aa5ed8e0087f8',
      itemCost: 'f026dbc4b39d120546af57a4753b66f78adb56442ab7b8feb4f306b279a6e649' },
  ];
  const cv = iaVersion(RAW);
  // An unknown ia-version is held to the newest row, as the old predicate held it to the newest text.
  const eraOf = T => cv === null ? T[T.length - 1] : (T.find(r => cv >= r.from && cv <= r.to) || null);
  const bRow = eraOf(BUDGET_BEHAVIOUR_BY_ERA), hRow = eraOf(ITEM_HELPERS_BY_ERA);
  const E5_CFGS = E_L.filter(c => c.key.endsWith('|sun+wed|1013')
    && ((c.cfg.liftingFocus === 'hypertrophy') === (c.cfg.experience === 'beginner')));
  function e5Corpus(src) {
    const IA_C = load(src);
    IA_C.eval('var __e5corp = []; var __e5csb = capSessionBudget; capSessionBudget = function (s, c) {'
      + ' __e5corp.push(JSON.stringify([s, c === undefined ? null : c])); return __e5csb(s, c); };');
    E5_CFGS.forEach(c => IA_C.buildProgram(c.cfg));
    return Array.from(new Set(JSON.parse(IA_C.eval('JSON.stringify(__e5corp)'))));
  }
  function e5Replay(corpus) {
    const csbFn = IA.eval('capSessionBudget'), scFn = IA.eval('_setCount'), icFn = IA.eval('_itemCost');
    const outs = [], sets = [], costs = []; let moved = 0;
    corpus.forEach(s => {
      const pair = JSON.parse(s), sec = pair[0], c = pair[1];
      const before = JSON.stringify(sec);
      const o = JSON.stringify(csbFn(JSON.parse(before), c === null ? undefined : c));
      outs.push(o); if (o !== before) moved++;
      sec.forEach(x => ((x && x.items) || []).forEach(it => { sets.push(scFn(it.detail)); costs.push(icFn(it, null)); }));
    });
    const H = t => crypto.createHash('sha256').update(t).digest('hex');
    return { n: corpus.length, moved: moved, items: sets.length,
             csb: H(outs.join('\n')), setCount: H(sets.join(',')), itemCost: H(costs.join(',')) };
  }
  const E5_SRC = resolveV196();
  let e5 = null, e5err = '';
  if (E5_SRC) { try { e5 = e5Replay(e5Corpus(E5_SRC)); } catch (e) { e5err = String((e && e.message) || e); } }
  const E5_ROWS = [
    ['capSessionBudget', bRow, 'csb', 'the posterior floor, the trunk floor, the trim order and the cap'],
    ['_itemCost',        hRow, 'itemCost', 'D85 owns the capSessionBudget trim loop and nothing else'],
    ['_setCount',        hRow, 'setCount', 'D85 owns the capSessionBudget trim loop and nothing else'],
  ];
  E5_ROWS.forEach(([nm, row, k, what]) => {
    const label = 'E5 ' + nm + ' replays the ' + (row ? row.rule : 'NO ROW') + ' behaviour on the frozen V196 budget corpus'
      + (e5 ? ' (' + e5.n + ' days, ' + e5.moved + ' trimmed, ' + e5.items + ' items)' : '')
      + ' — nothing since ' + (row ? row.rule : '?') + ' has moved it (' + what + ')';
    if (!E5_SRC) {
      refuse(label, 'NOT RUN: the corpus is captured from baselines/V196.html (ia-version 196) and it is '
        + 'missing or carries another version. Restore it with: git show V196:index.html > baselines/V196.html');
    } else if (!e5) {
      ok(label, false, 'corpus capture or replay threw: ' + e5err);
    } else {
      ok(label, !!row && e5.n > 0 && e5[k] === row[k],
         !row ? 'ia-version ' + cv + ' has no era row'
              : 'ia-version ' + cv + ' digest ' + e5[k].slice(0, 16) + ' != ' + row.rule + ' ' + row[k].slice(0, 16)
                + ' — ' + nm + ' behaviour moved; name the ruling, then print its range row');
    }
  });
"""

g = rep_span(g,
"// ── E5: CONFINEMENT OF THE BUDGET MACHINERY. One claim, two mechanisms: nothing has\n",
"""    + '(the E5 capSessionBudget digest pin above needs none and DID run)');
}
""", E5_NEW, 'g197d E5 block')

# ════════════════════════════════════════════════════════════════════════════════
# 2. g204 C8 (call-site census + the :491 Math.round(x%60) survivor) -> rendered strings
# ════════════════════════════════════════════════════════════════════════════════
c = open(G204, encoding='utf-8').read()

c = rep(c,
"""//   * C8 is the SOURCE census, not a build check. It re-derives the idiom inventory
//     from the artifact text and pins it, so a twelfth copy cannot appear quietly.
""",
"""//   * C8 is D126's claim read off RENDERED STRINGS at the rounding edges: a lattice of
//     durations (x.5, m:59.5, 3599.5, past the hour) through the owner and through every
//     formatter C1-C7 reach (pace, NSW INT, swim INT) plus the one site that carries its
//     own :60 (the seed mile anchor), each against arithmetic typed here. Until Post-V233
//     it was a SOURCE census of call sites; see the C8 block for why it moved.
""", 'g204 header C8 bullet')

c = rep(c,
"""          // idiom and _clkMS agree on them and a re-point of _intClk alone shows up only
          // in the C8 census. The day a fraction reaches this limb, THIS conjunct fails.
""",
"""          // idiom and _clkMS agree on them and a re-point of _intClk alone is invisible by
          // output. The day a fraction reaches this limb, THIS conjunct fails.
""", 'g204 C7a census comment')

C8_NEW = r"""// ── C8 — D126 read off the RENDERED STRING, at the rounding edges ─────────────
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
"""

c = rep_span(c,
"// ── C8 — the SOURCE census. One helper, eleven call sites, one survivor",
"""  + ' maskerParse=' + (CENSUS.parseOk ? 'OK' : 'FAILED'));
""", C8_NEW, 'g204 C8 block')

# ════════════════════════════════════════════════════════════════════════════════
# 3. v198.json M7: comment-only -> behavioural mutation inside capSessionBudget
# ════════════════════════════════════════════════════════════════════════════════
v = open(V198, encoding='utf-8').read()
idx = open(INDEX, encoding='utf-8').read()
M7_ANCHOR = "  const _itemRank=n=>/carry/i.test(n||'')?2:(/wall sit|\\bhold\\b/i.test(n||'')?1:0);"
M7_REPL = "  const _itemRank=n=>/carry/i.test(n||'')?2:(/wall sit/i.test(n||'')?1:0);"
once(idx, M7_ANCHOR, 'M7 anchor in index.html')
# the anchor must sit inside capSessionBudget (between its header and capRegionalFatigue's)
a0, a1, ak = idx.index('function capSessionBudget(sections, cardio){'), idx.index('\nfunction capRegionalFatigue'), idx.index(M7_ANCHOR)
if not (a0 < ak < a1):
    die('M7 anchor is not inside capSessionBudget')
M7 = {
  "name": "M7 -> the hold rank leaves the trim's item order: _itemRank stops reading the word hold, so a tight day's holds are no longer spent before its ordinary work and the budget keeps a different item. An unruled edit to budget machinery that no licensing ruling printed",
  "anchor": M7_ANCHOR,
  "replacement": M7_REPL,
  "gate": "gates/g197d_d84_base.js",
  "note": "E5 capSessionBudget is the named trip: the frozen V196 corpus (3,708 days) replays to a digest no era row carries (printed on the mutant at Post-V233 slice 3: 6ab6a72212c60b4c, against the D195 row 6be03983288738c9). E5 _itemCost and E5 _setCount stay green: the edit is inside capSessionBudget and touches neither helper. REWRITTEN at Post-V233 slice 3 (Mario: \"Convert brittle line and text checks (like g224) to content checks.\"). The V198 M7 rewrote D85's <=1 rationale IN A COMMENT and tripped E5 only because E5 was then a sha256 of capSessionBudget's source text; a content check must not trip on a comment, so that M7 tested the pin's brittleness, not the claim. Proved on the slice: the old comment-only edit leaves all three E5 digests unmoved and the new E5 PASSes it."
}
start = '  {\n    "name": "M7 -> '
end = '\n  }\n]'
once(v, start, 'v198 M7 start')
once(v, end, 'v198 tail')
s0 = v.index(start)
if v.index(end) < s0:
    die('v198 M7 block order')
new_block = '  {\n' + ',\n'.join('    %s: %s' % (json.dumps(k), json.dumps(M7[k], ensure_ascii=False)) for k in ['name', 'anchor', 'replacement', 'gate', 'note'])
v_new = v[:s0] + new_block + v[v.index(end):]
spec = json.loads(v_new)
if len(spec) != 7 or spec[6]['anchor'] != M7_ANCHOR or spec[6]['gate'] != 'gates/g197d_d84_base.js':
    die('v198 rewrite did not parse to the intended seven mutations')
for i, m in enumerate(spec[:6]):
    if m != json.loads(v)[i]:
        die('v198 M%d changed' % (i + 1))

# ── residue checks before writing ────────────────────────────────────────────────
for tok in ['CSB_D195', 'CSB_PRE', 'createHash(\'sha256\').update(csb)', 'byte-identical to the baseline (D85']:
    if tok in g:
        die('g197d residue: ' + tok)
for tok in ["v204_idiom_census.js')).census", 'CLK_CALLS_BY_ERA', 'FIXIT', 'CENSUS.']:
    if tok in c:
        die('g204 residue: ' + tok)

open(G197D, 'w', encoding='utf-8').write(g)
open(G204, 'w', encoding='utf-8').write(c)
open(V198, 'w', encoding='utf-8').write(v_new)
print('wrote g197d_d84_base.js, g204_clock_limb.js, sabotage/v198.json (index.html untouched, no version bump)')
