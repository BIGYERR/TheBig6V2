#!/usr/bin/env python3
# v226_edit_7b2.py — build 5 (V226), slice 7b2: three edits to tests/gates/g226_d188_beginnermile.js, tests only.
# Ruling: tests/measure/v226_rulings/d188_d189_gate_amendment.md sections (a), (c), (e) and table (g);
#         tests/measure/v226_rulings/d188_d189_ruling.md governs everything the amendment does not change.
#   Edit 1 (a)  G5: the R3 token is exempted by index and the R3 literal is counted exactly once on its own row.
#               The four token-regex rows stay; nothing else in G5 is deleted.
#   Edit 2 (c)  G1f, new: the typed ceiling sentence (beginner, mile 9:00, goal 1.5 mi in 10:30) and hand length 11,
#               through paceCeilingSentence(assessRunPaceCeiling(11)) and through the wizard #paceFeasLine.
#   Edit 3 (e)  G1g, new: the run_pace_goal SI pair reinstated on a hand oracle (replaces the DROPPED line).
# Header comments for G1/G5 are rewritten to match. Every anchor is asserted count == 1 before any write;
# the file is written once, at the end, or not at all.
import sys, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g226_d188_beginnermile.js')
src = P.read_text(encoding='utf-8')

EDITS = []

# ── header: G1 DROPPED paragraph -> G1 SI PAIR (G1g) + G1 CEILING (G1f) ──────────────────────────────
EDITS.append(("header G1 DROPPED", r"""//   G1 DROPPED    NSW pace-goal 13:00 SI literal. The ruling writes it as "row.mile - 2 s ... as the file's SI builder
//                 derives it". It is not derivable by hand: doctrine A (physicaltrainingguide2020.txt:250-256) gives
//                 4 s per 400 m = 16 s/mi faster than the base pace, and the engine's SI is weekPace - 16, where
//                 weekPace (the week's clock) comes from the engine's pace progression, not from any doctrine rule.
//                 Per the brief the sub-assertion is DROPPED, never typed off the engine. The pace goal is still
//                 covered at 9:00 by the differential and at 13:00 by nothing in this file.
""", r"""//   G1 SI PAIR    (G1g, gate amendment (e); the slice 7b drop is withdrawn) run_pace_goal, beginner, mile 13:00, typed by
//                 hand: doctrine :160 row 12:00 (mile 720 s, 5K 12:40 = 760 s); ROW_PACE_COLS puts the 5K column at
//                 3.107 mi; the ruled D100 ln-distance interpolation at the 1.5 mi target: 720 + 40 ln1.5 / ln3.107 =
//                 734.31 s = 12:14 (goal pace); Guide A (physicaltrainingguide2020.txt:251) 4 s per 400 m = 16 s/mi
//                 faster: 718.31 s = 11:58 (SI). V225 truth: the 11:30 row (:159, 5K 735 s): 11:46 and 11:30.
//   G1 CEILING    (G1f, gate amendment (c)) the beginner's entered mile reaches assessRunPaceCeiling (E1): the sentence
//                 typed by hand arithmetic (see the row), through the function and through the wizard #paceFeasLine.
//                 The V225 arm's literal is the one licensed engine read in this file (see the row).
"""))

# ── header: G5 description gains the amendment (a) exemption ───────────────────────────────────────
EDITS.append(("header G5", r"""//   G5 TOKEN-GONE the comment-stripped source (tokenizer-safe stripper lifted verbatim from g225_d187_pacerate.js,
//                 itself from g221/g223: strings, template literals and regex literals are kept intact).
""", r"""//   G5 TOKEN-GONE the comment-stripped source (tokenizer-safe stripper lifted verbatim from g225_d187_pacerate.js,
//                 itself from g221/g223: strings, template literals and regex literals are kept intact).
//                 Gate amendment (a): the R3 token E6 mandates is exempted by its INDEX, never by a window width, and
//                 the R3 literal is counted on its own row (D188 exactly 1, V225 0).
"""))

# ── header: the discrimination list names G1f length as unchanged ─────────────────────────────────
EDITS.append(("header discrimination list", r"""//                 rows D188 changed go RED on V225, the unchanged ones (G1 no-mile length, G2, G3 blank and R3, G4
//                 intermediate pencil) stay green.
""", r"""//                 rows D188 changed go RED on V225, the unchanged ones (G1 no-mile length, G1f length, G2, G3 blank
//                 and R3, G4 intermediate pencil) stay green.
"""))

# ── Edit 3 (e): G1g replaces the DROPPED console line ─────────────────────────────────────────────
EDITS.append(("G1g", r"""console.log('  DROPPED G1 run_pace_goal 13:00 NSW SI literal: not derivable by hand from doctrine (SI = weekPace - 16 s/mi; weekPace is the engine clock). See header.');
""", r"""// G1g (gate amendment (e), the S1 cell): the run_pace_goal SI pair, reinstated on a hand oracle. Beginner, mile 13:00, goals
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
"""))

# ── Edit 2 (c): G1f after the G1e length cell ───────────────────────────────────────────────────
EDITS.append(("G1f", r"""  ok('G1 ' + TAG + ' length cell: same goal, no mile -> 11 (hand gap (690-540)/3 = 50 weeks, 1.5-mile cap 11)', l0 === 11, l0);
}
""", r"""  ok('G1 ' + TAG + ' length cell: same goal, no mile -> 11 (hand gap (690-540)/3 = 50 weeks, 1.5-mile cap 11)', l0 === 11, l0);
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
"""))

# ── Edit 1 (a): G5 exempts the R3 token by index ────────────────────────────────────────────────
EDITS.append(("G5 hits loop", r"""  const hits = [];
  for(let i = CS.indexOf(TOK); i >= 0; i = CS.indexOf(TOK, i + 1)){
    const win = CS.slice(Math.max(0, i - 120), i + TOK.length + 120);
""", r"""  // Gate amendment (a): the R3 token E6 mandates is exempted by its index; the R3 literal is counted once on its own row.
  const R3 = "if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true";
  const r3N = CS.split(R3).length - 1;
  const r3Tok = r3N === 1 ? CS.indexOf(R3) + R3.indexOf(TOK) : -1;
  const hits = [];
  for(let i = CS.indexOf(TOK); i >= 0; i = CS.indexOf(TOK, i + 1)){
    if(i === r3Tok) continue;
    const win = CS.slice(Math.max(0, i - 120), i + TOK.length + 120);
"""))
EDITS.append(("G5 rows", r"""  ok('G5 ' + TAG + " 'beginner' within 120 characters of mileBest / arguments[12] / mileBestSecs): " + want, cmp(hits.length), hits.length + (hits.length ? ': ' + hits.slice(0, 6).join(' || ') : ''));
""", r"""  ok('G5 ' + TAG + ' R3 literal (E6) occurs exactly ' + (D188 ? 1 : 0) + ' times', D188 ? r3N === 1 : r3N === 0, r3N);
  ok('G5 ' + TAG + " 'beginner' within 120 characters of mileBest / arguments[12] / mileBestSecs), R3 token exempted by index: " + want, cmp(hits.length), hits.length + (hits.length ? ': ' + hits.slice(0, 6).join(' || ') : ''));
"""))

# all anchors on the original text first, then apply in order with a fresh count each time
for name, old, new in EDITS:
    c = src.count(old)
    if c != 1:
        sys.exit('ABORT (nothing written): anchor %r count %d, want 1' % (name, c))
out = src
for name, old, new in EDITS:
    c = out.count(old)
    if c != 1:
        sys.exit('ABORT (nothing written): anchor %r count %d after earlier edits, want 1' % (name, c))
    out = out.replace(old, new, 1)
P.write_text(out, encoding='utf-8')
print('v226_edit_7b2: %d replacements applied to %s' % (len(EDITS), P))
