// g231_d196_bwfallback.js — GATE for D196 P-BWFALLBACK (V231): a band hip thrust is translated at the draw site,
// through the tier lens, onto the plan's other bodyweight hip extension (ankle/knee → Single-leg glute bridge, lowback →
// Single-leg hip thrust (shoulders on bed)); `_bwFallback` deliberately unchanged.
//
//   node tests/gates/g231_d196_bwfallback.js <candidate.html> [baseline_V230.html]
//
// THE RULING THIS DEFENDS (standing ruling 4)
//   tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, D196, "Gates (all keyed VER ≥ 231, ruling D196; every row
//   fails on V230 by the stated conjunct)":
//   D196-a  "on L432 bodyweight (108) + LBW bodyweight (216): count of `Burpees` items under a `Main —` label = 0 (V230
//           L432 54, LBW 180 Mains); and `(a″)` by the D193 CAP hand table (filter-lens capped, final-lens uncapped) = 0
//           (V230 L432 72, LBW 192). Oracle: typed table + the hand CAP table, never `_bwFallback`."
//   D196-b  "on the same cells, 0 days carrying both `Single-leg hip thrust` and `Single-leg hip thrust (shoulders on bed)`,
//           and 0 adjacent calendar days sharing `Single-leg glute bridge` (both 0 on V230 too, so this row carries
//           D196-a's Burpees conjunct to fail on V230). These are the two arms I rejected; a later change that flips a
//           lens trips here."
//   D196-c  "(typed cards): the four cells quoted above read the quoted Mains on W1/W2 tue (lowback ×2) and W3/W4 thu
//           (ankle/protect beginner support_strength, knee/protect intermediate support_strength) at 231, and `Burpees`
//           on V230."
//   D196-d  "HALF_MANNY era row 231 literal `2d35e8f743680cfa`, with the W5-alone counterfactual `0ac7da6b1691a8e1` as a
//           conjunct (row existence asserted)."
//   Amended by tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md (D196 Amendment 1, no code change):
//           "D196 rows a–d as the prior ruling (W5 unchanged), with D196-a counting `Primer — Burpees` too (0 at 231; 24 on
//           V230's INJ race cells) and D196-3 accepting `N×10`."
//   D-code D196 (+ Amendment 1), ships on ia-version 231. Surgery: tests/edits/v231_s4_d196_lens_ankle_knee.py (the two
//   lenses + the ankle/knee squat literals) and tests/edits/v231_s5_d196_lowback.py (the three lowback literals).
//
// SESSION CALLS (tests/measure/v231_rulings/v231_session_calls.md, calls 3–5; gate form and scope only, no ruling changed)
//   Call 3, D196-c: five typed cells. The ruling's parenthetical cell (knee/protect intermediate support_strength W3/W4 thu)
//       prints `Main — Bodyweight back extension` on V230, W5 and ALL at seed 76308 (coach1 cards :502–581; knee/protect
//       has 0 `Main — Burpees` on the 324 cells at s76308), so it is not typed; the class is real at other seeds. D196-c
//       types (a) the three unambiguous quoted cells, (b) builder's substitute `ankle/protect|bodyweight|intermediate|
//       balanced|sat,sun` W3/W4 wed (the ruling's printed "intermediate|balanced|sat,sun cell: W3/W4 wed ... at RPE 8"),
//       and (c) a knee/protect bodyweight cell at a seed where V230 prints `Main — Burpees`: M14's U_SEED cell
//       `knee/protect|bodyweight|intermediate|support_strength|sun,wed|L432|s11` (tests/measure/v231_bwfallback.js, the
//       U_SEED line copied below), W3/W4 thu. Its V230 card (Burpees) and its 231 card (`Main — Single-leg glute bridge`,
//       detail verbatim from the V230 Main) were printed by builder's probe on 2026-10-04 and are typed here. The s76308
//       parenthetical cell is still printed as INFO.
//   Call 4, D196-b: (i) 0 both-thrust days on the four D196 plans; (ii) over all 324 cells the both-thrust day set equals
//       V230's 82-day set, typed below as a literal list (no additions, no removals); (iii) 0 adjacent `Single-leg glute
//       bridge` days over all 324; plus the carried Burpees conjunct. The 82 days are PRE-EXISTING (V230 prints the same
//       82), all in plans D196 never touches; parked to §12 as P-BWTHRUSTDOUBLE.
//   Call 5, sabotage: S-a's named row is D196-c, not D196-a. With the ankle literal reverted, D197's post-sweep re-filter
//       drops the swept Burpees on ankle/protect and leaves no Main, so D196-a's Main-Burpees count reads 0; the day losing
//       its Main is caught by D196-c's typed card (c-AP, c-AI).
//
// VERSION PREDICATE (standing rulings 2 and 4). Every row RUNS on every tree; `VER >= 231` (VER = the candidate's
//   ia-version meta) is the first conjunct of every row. A tree below 231 is never skipped or refused: its rows FAIL by
//   their own conjuncts as well as by the predicate. On V230 as candidate the expected failures are: D196-a version,
//   Main Burpees (234), Primer Burpees (24), (a″) (264); D196-b version, its carried Burpees conjunct and b-cover (no bed
//   thrust on the lowback plans); D196-c version and the five typed Mains; D196-d version, digest, era row, and the
//   W5-alone surgery's candidate-carries-it check.
//
// PRESENTATION. Lattices copied verbatim: L432 and LBW from tests/measure/v230_postsweep_reject.js (M13; same text in
//   tests/measure/v231_bwfallback.js, M14), filtered to `|bodyweight|` (108 + 216); INJ from tests/measure/
//   v231_gate_attrib.js (M17), filtered to the race family (1,008 builds, 168 bodyweight). cfg.seed pinned in every
//   config (76308 for L432/LBW; M17's rotated SEEDS for INJ); cfg.injury set directly; clock pinned to 2026-08-24 12:00
//   (M14's clock) in every VM. HALF_MANNY = fixtures.HALF_MANNY, digest = harness progDigest, built twice in two fresh VMs
//   and self-identical before compared. One VM per tree per lattice pass; the a-lens conjunct proves the wrapped, reused
//   VM's build (__pre/id/created stripped) == a plain fresh-VM build on probe cells.
//
// ORACLES. Nothing below asks the candidate's engine what the answer should be; `_bwFallback` is never called.
//   TYPED      the ruling's figures (Main Burpees V230 L432 54 / LBW 180; Primer V230 24; (a″) V230 L432 72 / LBW 192;
//              0 at 231 for each), the ruling's names, four D196-c Mains typed from coach's printed cards
//              (tests/measure/v231_coach_surgery.cards3.out.txt :2–97, :98–128, :230–367, :368–425; [V] and [W5]/[ALL]
//              blocks), the fifth (s11 knee/protect) typed from builder's probe print of V230 and 231 (session call 3),
//              and the 82-day P-BWTHRUSTDOUBLE list typed from gate run 3's print (V230 and candidate identical; session
//              call 4). The V230 figures, cards and list are re-read from the baseline only as instrument conjuncts.
//   CAP        the D193 hand cap table, copied verbatim from tests/gates/g229_d193_build.js (ruling D193). (a″) = a card
//              whose PRE-SWEEP name's pattern is capped for the plan and whose FINAL name's pattern is not. The pre-sweep
//              name is stamped by g229's WRAP lens (copied verbatim: it wraps bodyweightSweep and records each item's
//              name before the sweep). A name's pattern is read from the BASELINE tree's `_pattern` (g229's convention),
//              and the a-pat conjunct proves the baseline classifier reads M14's printed patterns for the ruled names
//              (tests/measure/v231_bwfallback.out.txt: `Banded hip thrust{hip_ext} -> Burpees{-}`, bridge{hip_ext},
//              bed thrust{hip_ext}).
//   CALENDAR   adjacency by date order mon..sun, sun → next week's mon (M14's adjOf), rest days excluded; same-day double
//              by exact name equality.
//   LITERAL    HALF_MANNY 2d35e8f743680cfa (era row 231), W5 alone 0ac7da6b1691a8e1 (= V230's own digest).
//   COUNTERFACTUAL  W5 alone = the BASELINE text + slices 4 and 5's five replacements (typed below from the two edit
//              scripts). Every anchor count == 1 on the working text and every replacement text count == 1 in the
//              CANDIDATE (on a tree that lacks the surgery the conjunct FAILS by name). Because W5's digest equals V230's,
//              the conjunct also proves the surgery took: the W5 tree's L432 lowback/protect beginner support_strength
//              W1 tue Main is the bed thrust and its ankle/protect beginner support_strength W3 thu Main is the bridge.
//
// ROWS
//   D196-a  a-ver, a-main, a-primer, a-a2, a-pat, a-lens, a-inst.
//   D196-b  b-ver, b-burpees (D196-a's Main + Primer Burpees conjunct, carried), b-thrust (four plans), b-thrustset (all
//           324 cells: the day set == the typed 82-day P-BWTHRUSTDOUBLE list), b-adj (324 cells), b-cover (each plan's
//           landing name is on its cards), b-inst (V230: four-plan both-thrust 0, adjacency 0, all-cells set == the typed
//           82-day list).
//   D196-c  c-ver, c-AP, c-LP, c-LW, c-AI, c-KI (the five typed Mains, two weeks each), c-inst (V230 reads the typed
//           Burpees on all five).
//   SABOTAGE (ruling S-a..S-d, session call 5): S-a revert `_bwHTak` in the ankle literal → D196-c; S-b `_bwHTlb` set to
//           the bridge → D196-b (b-adj); S-c `_bwHTak` set to the bed thrust → D196-b (b-thrust); S-d revert the lowback
//           hinge literal only → D196-a (a-a2). Each also trips D196-d's d-cfW5 (the candidate no longer carries the
//           replaced text; session call 1's accepted cost).
//   D196-d  d-ver, d-digest, d-era (harness MANNY_DIGEST_BY_VERSION[231]; FAILS by name while absent, standing ruling 5),
//           d-cfW5, d-inst (the baseline's HALF_MANNY is V230's 0ac7da6b1691a8e1, self-identical).
//
// Temp files: the W5-alone tree and (if needed) the git copy of V230 go under os.tmpdir() (run with TMPDIR set to the
//   scratch path) and are removed on exit.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = H;

const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEFILE = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ERA = 231, BASE_ERA = 230, V230_COMMIT = '71c76d8';
const CLOCK = '2026-08-24';

// ── LITERALS FROM THE RULING ──────────────────────────────────────────────────────────────────────────────────────
const DIG_231 = '2d35e8f743680cfa';     // HALF_MANNY era row 231
const DIG_W5 = '0ac7da6b1691a8e1';      // W5 alone (D196 alone; HALF_MANNY unmoved)
const DIG_V230 = '0ac7da6b1691a8e1';    // V230's own digest (instrument)
const V230_FIG = { mainL432:54, mainLBW:180, primer:24, a2L432:72, a2LBW:192 };   // the ruling's V230 figures
const BED = 'Single-leg hip thrust (shoulders on bed)', SLHT = 'Single-leg hip thrust', BRIDGE = 'Single-leg glute bridge';
const PLANS4 = ['ankle/protect', 'knee/protect', 'lowback/protect', 'lowback/workaround'];
const LANDING = { 'ankle/protect':BRIDGE, 'knee/protect':BRIDGE, 'lowback/protect':BED, 'lowback/workaround':BED };   // Mario's landing
// M14's printed patterns (tests/measure/v231_bwfallback.out.txt), read on the baseline classifier as an instrument
const PAT_TYPED = { 'Banded hip thrust':'hip_ext', 'Burpees':'-', [BRIDGE]:'hip_ext', [BED]:'hip_ext' };

// ── CAP hand table: tests/gates/g229_d193_build.js (ruling D193), copied verbatim ─────────────────────────────────────
const CAP = { knee:{ workaround:['squat', 'lunge', 'leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat', 'lunge'], protect:['squat'] },
  hip:{ workaround:['hinge', 'lunge', 'hip_ext', 'squat'], protect:['squat'] }, lowback:{ workaround:['hinge', 'squat', 'row', 'hip_ext'], protect:['squat', 'hip_ext'] },
  shoulder:{ workaround:['hpress', 'vpress', 'delt_iso'], protect:[] }, elbow:{ workaround:['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'], protect:['row', 'vpull'] } };
// g229's lens wrapper, copied verbatim (stamps each item's pre-sweep name)
const WRAP = "var __BUILD=0;var __origBWS=bodyweightSweep; bodyweightSweep=function(weeks){ try{ Object.keys(weeks||{}).forEach(function(w){ Object.keys(weeks[w]||{}).forEach(function(d){ var dy=weeks[w][d]; ((dy&&dy.sections)||[]).forEach(function(s){ (s.items||[]).forEach(function(it){ if(it&&it.name) it.__pre={n:it.name,b:__BUILD}; }); }); }); }); }catch(e){} return __origBWS.apply(this,arguments); };";

// ── TYPED D196-c CARDS (coach's printed cards; label, then [name, detail] per item) ─────────────────────────────────
const D_AP = '3 sets — RPE 7 (leave ~3 in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const D_LB = '3 sets — RPE 6–7 (leave 3–4 in reserve — learn the movement), ramp up with 2–3 warmup sets, 3 min rest';
const D_AI = '3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest';
const D_KI = '3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest';   // s11 knee/protect, V230 Main detail
const mainOf = (n, d) => ({ label:'Main — ' + n, items:[[n, d]] });
const CELLS_C = [
  { tag:'c-AP', L:'L432', k:'ankle/protect|bodyweight|beginner|support_strength|sun,wed', at:[['3', 'thu'], ['4', 'thu']], c231:mainOf(BRIDGE, D_AP), c230:mainOf('Burpees', D_AP) },
  { tag:'c-LP', L:'L432', k:'lowback/protect|bodyweight|beginner|support_strength|sun,wed', at:[['1', 'tue'], ['2', 'tue']], c231:mainOf(BED, D_LB), c230:mainOf('Burpees', D_LB) },
  { tag:'c-LW', L:'L432', k:'lowback/workaround|bodyweight|beginner|support_strength|sun,wed', at:[['1', 'tue'], ['2', 'tue']], c231:mainOf(BED, D_LB), c230:mainOf('Burpees', D_LB) },
  { tag:'c-AI', L:'LBW', k:'ankle/protect|bodyweight|intermediate|balanced|sat,sun', at:[['3', 'wed'], ['4', 'wed']], c231:mainOf(BRIDGE, D_AI), c230:mainOf('Burpees', D_AI) },
  // session call 3: M14's U_SEED knee/protect cell at seed 11 (V230 prints `Main — Burpees` on W3/W4 thu)
  { tag:'c-KI', L:'U_SEED', k:'knee/protect|bodyweight|intermediate|support_strength|sun,wed|L432|s11', at:[['3', 'thu'], ['4', 'thu']], c231:mainOf(BRIDGE, D_KI), c230:mainOf('Burpees', D_KI) },
];
const KP_INFO = { L:'L432', k:'knee/protect|bodyweight|intermediate|support_strength|sun,wed', at:[['3', 'thu'], ['4', 'thu']] };

// ── P-BWTHRUSTDOUBLE: the 82 PRE-EXISTING days carrying both `Single-leg hip thrust` and the bed thrust (session call 4) ──
// Over all 324 bodyweight L432 + LBW cells at s76308. V230 prints exactly these 82 (gate run 3, 2026-10-04: candidate and
// V230 day sets identical), all in plans D196 never touches. Parked to §12 as P-BWTHRUSTDOUBLE (a bench-name thrust and
// the bed thrust on one bodyweight card; P-BWHTNAME's neighbour). D196 must add none and remove none.
const W16 = d => ['1', '2', '3', '4', '5', '6'].map(w => 'W' + w + ' ' + d);
const W1x = d => ['1', '2', '4', '5', '6'].map(w => 'W' + w + ' ' + d);
const THRUST82 = {
  'ankle/workaround|bodyweight|beginner|hypertrophy|sat,sun':W16('wed'), 'ankle/workaround|bodyweight|beginner|hypertrophy|sun,wed':W16('thu'),
  'ankle/workaround|bodyweight|intermediate|hypertrophy|sat,sun':W1x('wed'), 'ankle/workaround|bodyweight|intermediate|hypertrophy|sun,wed':W1x('thu'),
  'elbow/protect|bodyweight|beginner|hypertrophy|sat,sun':W16('wed'), 'elbow/protect|bodyweight|beginner|hypertrophy|sun,wed':W16('thu'),
  'elbow/workaround|bodyweight|beginner|hypertrophy|sat,sun':W16('wed'), 'elbow/workaround|bodyweight|beginner|hypertrophy|sun,wed':W16('thu'),
  'knee/workaround|bodyweight|beginner|hypertrophy|sat,sun':W16('wed'), 'knee/workaround|bodyweight|beginner|hypertrophy|sun,wed':W16('thu'),
  'shoulder/protect|bodyweight|beginner|hypertrophy|sat,sun':W16('wed'), 'shoulder/protect|bodyweight|beginner|hypertrophy|sun,wed':W16('thu'),
  'shoulder/workaround|bodyweight|beginner|hypertrophy|sat,sun':W16('wed'), 'shoulder/workaround|bodyweight|beginner|hypertrophy|sun,wed':W16('thu'),
};
const THRUST82_SET = [].concat(...Object.keys(THRUST82).map(k => THRUST82[k].map(x => k + ' ' + x))).sort();

// ── SURGERY TEXTS (typed from tests/edits/v231_s4_d196_lens_ankle_knee.py and v231_s5_d196_lowback.py; old -> new) ────
const S45 = [
  ['s4 L lenses',
   "  const _bw=(bwPool,other)=>isBW?_bwRung(bwPool):other;\n",
   "  const _bw=(bwPool,other)=>isBW?_bwRung(bwPool):other;\n"
   + "  const _bwHTlb=isBW?'Single-leg hip thrust (shoulders on bed)':'Banded hip thrust';\n"
   + "  const _bwHTak=isBW?'Single-leg glute bridge':'Banded hip thrust';\n"],
  ['s4 KP knee/protect squat',
   "        squatPool = hasBarbell?_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):['Banded hip thrust','Single-leg glute bridge','Bodyweight back extension'];\n",
   "        squatPool = hasBarbell?_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):[_bwHTak,'Single-leg glute bridge','Bodyweight back extension'];\n"],
  ['s4 AP ankle/protect squat',
   "        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):['Banded hip thrust','Single-leg glute bridge'];\n",
   "        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):[_bwHTak,'Single-leg glute bridge'];\n"],
  ['s5 lowback/protect back + hinge',
   "        backCompoundPool = hasBarbell?_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):['Banded hip thrust','Single-leg glute bridge'];\n"
   + "        hingePool = ['Banded hip thrust','Single-leg glute bridge'];\n",
   "        backCompoundPool = hasBarbell?_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):[_bwHTlb,'Single-leg glute bridge'];\n"
   + "        hingePool = [_bwHTlb,'Single-leg glute bridge'];\n"],
  ['s5 lowback/workaround back',
   "        backCompoundPool = hasBarbell?_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):['Banded hip thrust','Single-leg hip thrust'];\n",
   "        backCompoundPool = hasBarbell?_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):[_bwHTlb,'Single-leg hip thrust'];\n"],
];

// ── LATTICES ────────────────────────────────────────────────────────────────────────────────────────────────────
const clone = x => JSON.parse(JSON.stringify(x));
// L432 and LBW: verbatim from tests/measure/v230_postsweep_reject.js (M13) / tests/measure/v231_bwfallback.js (M14)
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const REGS = ['knee','ankle','hip','lowback','shoulder','elbow'], TIERS = ['workaround','protect'], EXPS = ['beginner','intermediate','advanced'];
function lattices(){ const out = [];
  for(const g of REGS) for(const t of TIERS) for(const eq of ['commercial','crossfit','home_full','bodyweight']) for(const ex of EXPS) for(const fo of ['support_strength','support_athletic','support_prevention'])
    out.push({ L:'L432', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|sun,wed', c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }) });
  for(const g of REGS) for(const t of TIERS) for(const eq of ['bodyweight','home_basic']) for(const ex of EXPS) for(const fo of ['balanced','strength','hypertrophy']) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'LBW', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|' + rd.join(','), c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo, restDays:rd }) });
  return out; }
// INJ: verbatim from tests/measure/v231_gate_attrib.js (M17)
const DAYS = H.DAYS;
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const FAM = { race:[['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]], test:[['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]], none:[[null,{}]] };
const ETIERS = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const SEEDS = [87747, 76308, 1234, 4242], RESTS = [['sun','wed'],['sat','sun']];
const ITIERS = ['workaround','protect'];
function mk(f, fam, eq, ei, si, ri, inj){ const g = FAM[fam][(si + ei) % FAM[fam].length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: g[0] ? ['run'] : [], cardioGoals: g[0] ? { run: Object.assign({ id:g[0], label:g[0], mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' }, g[1]) } : {},
    eventTargeted:false, liftingFocus:f, experience:EXPS[ei], ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:RESTS[ri].slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si] };
  if(inj) c.injury = inj; return c; }
function injLattice(){ const out = []; let k = 0;
  for(const r of REGS) for(const t of ITIERS) for(const f of FOC) for(const fam of Object.keys(FAM)) for(const eq of ETIERS) for(let ri = 0; ri < 2; ri++){ const ei = k % 3, si = (k >> 1) % 4; k++;
    out.push({ L:'INJ', f, fam, eq, exp:EXPS[ei], rest:RESTS[ri].join(','), inj:r + '/' + t, k:r + '/' + t + '|' + eq + '|' + EXPS[ei] + '|' + f + '|' + fam + '|s' + SEEDS[si] + '|' + RESTS[ri].join(','), c:mk(f, fam, eq, ei, si, ri, { region:r, tier:t }) }); }
  return out; }
const BW = lattices().filter(x => /\|bodyweight\|/.test(x.k));
// U_SEED: M14's line, verbatim (tests/measure/v231_bwfallback.js), over M13's L432 + LBW; read only for D196-c's c-KI cell
function uSeed(){ const out = lattices();
  for(const sd of [11, 90210]) out.filter(x => (x.L === 'L432' || x.L === 'LBW') && /\|bodyweight\|/.test(x.k)).slice().forEach(x => out.push({ L:'U_SEED', k:x.k + '|' + x.L + '|s' + sd, c:Object.assign(clone(x.c), { seed:sd }) }));
  return out.filter(x => x.L === 'U_SEED'); }
const U_SEED = uSeed();
const INJ_ALL = injLattice(), RACE = INJ_ALL.filter(x => x.fam === 'race');

// ── HELPERS ─────────────────────────────────────────────────────────────────────────────────────────────────────
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const J = p => JSON.stringify(p, (k, v) => (k === '__pre' || k === 'id' || k === 'created') ? undefined : v);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const planOf = k => k.split('|')[0];
const TMPS = [];
process.on('exit', () => TMPS.forEach(f => { try { fs.unlinkSync(f); } catch(e){} }));
function tmpWrite(tag, text){ const f = path.join(os.tmpdir(), 'g231_d196_' + tag + '_' + process.pid + '.html'); fs.writeFileSync(f, text); TMPS.push(f); return f; }
function pinned(file){   // a fresh VM with the clock pinned to CLOCK 12:00 (new Date() and Date.now())
  const X = load(file); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  X.ctx.Date = FD; return X; }
function manny(file){    // HALF_MANNY on two fresh VMs
  const p1 = pinned(file).buildProgram(clone(fixtures.HALF_MANNY)), p2 = pinned(file).buildProgram(clone(fixtures.HALF_MANNY));
  const d1 = progDigest(p1), d2 = progDigest(p2); return { prog:p1, dig:d1, self:d1 === d2, dig2:d2 }; }
function surgery(text, reps, candText){   // -> {text, ok, why}
  let t = text; const why = [];
  for(const [tag, oldS, newS] of reps){
    const n = t.split(oldS).length - 1; if(n !== 1){ why.push(tag + ': anchor count ' + n + ' on the V230 text'); continue; }
    t = t.replace(oldS, () => newS);
    const c = candText.split(newS).length - 1; if(c !== 1) why.push(tag + ': replacement text count ' + c + ' in the candidate (expected 1)');
  }
  return { text:t, ok:!why.length, why }; }
const secOf = (p, w, d) => { const dy = p && p.weeks && p.weeks[w] && p.weeks[w][d]; return (dy && !dy.rest && dy.sections) || []; };
const mainCard = (p, w, d) => { const s = secOf(p, w, d).find(x => /^Main —/.test(clean(x && x.label))); return s ? { label:clean(s.label), items:(s.items || []).map(i => [clean(i.name), String(i.detail == null ? '' : i.detail)]) } : null; };
const showCard = c => c ? c.label + ' :: ' + c.items.map(i => i[0] + ' :: ' + i[1]).join(' | ') : '(no Main)';

// ── PLUMBING ────────────────────────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const R = {
  'D196-a': 'row D196-a (D196 + Am. 1, VER >= 231) L432 bodyweight (108) + LBW bodyweight (216): 0 `Main —` Burpees (V230 54 + 180); INJ race: 0 `Primer —` Burpees (V230 24); (a″) by the D193 CAP hand table = 0 (V230 72 + 192)',
  'D196-b': 'row D196-b (D196, VER >= 231, session call 4) same cells: 0 days carrying both Single-leg hip thrust and the bed thrust on ankle/protect, knee/protect, lowback/protect, lowback/workaround; over all 324 cells the both-thrust day set == the typed 82-day P-BWTHRUSTDOUBLE list; 0 adjacent calendar days sharing Single-leg glute bridge; carries D196-a\'s Burpees conjunct',
  'D196-c': 'row D196-c (D196, VER >= 231, session call 3) five typed cards: ankle/protect beginner W3/W4 thu, the quoted ankle/protect intermediate balanced sat,sun W3/W4 wed and knee/protect intermediate support_strength s11 W3/W4 thu read Main — Single-leg glute bridge; lowback/protect and lowback/workaround W1/W2 tue read Main — Single-leg hip thrust (shoulders on bed); V230 reads Burpees on all five',
  'D196-d': 'row D196-d (D196, VER >= 231) HALF_MANNY era row 231 = 2d35e8f743680cfa; W5-alone counterfactual (V230 + slices 4 and 5) = 0ac7da6b1691a8e1; row existence asserted',
};
const ROW_ORDER = ['D196-a', 'D196-b', 'D196-c', 'D196-d'];
function row(key, cj){ cj.forEach(([n, c, d]) => P('    ' + key + ' ' + n + ' ' + (c ? 'ok' : 'FAIL') + ' :: ' + d));
  const bad = cj.filter(x => !x[1]).map(x => x[0]); ok(R[key], !bad.length, bad.length ? 'failing conjuncts: ' + bad.join(', ') : cj.length + '/' + cj.length + ' conjuncts'); }
const info = s => P('    INFO ' + s);

// ── LOAD + VERSION ──────────────────────────────────────────────────────────────────────────────────────────────
let VER = NaN, CAND_TEXT = '';
try { const IA = load(ART); VER = +IA.version; CAND_TEXT = fs.readFileSync(ART, 'utf8'); }
catch(e){ P('FAIL boot: ' + String(e && e.message || e).slice(0, 200)); fail++; ROW_ORDER.forEach(k => ok(R[k] + ' (candidate did not boot)', false)); done(); }
P('g231 D196 P-BWFALLBACK (+ Amendment 1) | candidate ' + ART + ' ia-version ' + VER + (VER >= ERA ? '' : ' (below ' + ERA + ': every row runs and must FAIL by its own conjuncts)'));
let BF = null, BASE_TEXT = '', baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ BF = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!BF){
  try { const f = tmpWrite('v230', cp.execFileSync('git', ['-C', ROOT, 'show', V230_COMMIT + ':index.html'], { maxBuffer:1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ BF = f; baseWhy += 'git show ' + V230_COMMIT + ':index.html written to ' + f + ' (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
if(BF) BASE_TEXT = fs.readFileSync(BF, 'utf8');
P('  V' + BASE_ERA + ' baseline: ' + (BF ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
P('  lattices: L432 bodyweight ' + BW.filter(x => x.L === 'L432').length + ' + LBW bodyweight ' + BW.filter(x => x.L === 'LBW').length + ' builds; INJ race ' + RACE.length + ' of ' + INJ_ALL.length + ' (bodyweight ' + RACE.filter(x => x.eq === 'bodyweight').length + ')');

// ── THE PATTERN CLASSIFIER (baseline tree, g229's convention) ───────────────────────────────────────────────────────
let PV = null; try { if(BF) PV = pinned(BF); } catch(e){ PV = null; }
const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = PV ? (PV.eval('_pattern(' + JSON.stringify(n) + ')') || '-') : '?');

// ── ONE PASS PER TREE ───────────────────────────────────────────────────────────────────────────────────────────
// Returns every figure the rows read. Never asks the tree what the answer should be.
function survey(file){
  const S = { mains:{ L432:0, LBW:0 }, mainsByPlan:{}, mainSecs:0, days:0, primer:[], primerDays:0, raceMainBurpees:0, a2:[], thrust:{}, thrustDays:{}, adj:{}, adjEx:[], land:{}, cards:{}, neutral:0, neutralN:0, err:'' };
  const X = pinned(file); X.eval(WRAP);
  const probeIdx = new Set([0, 37, 74, 111, 148, 185, 222, 259, 296].filter(i => i < BW.length));
  BW.forEach((cell, ci) => {
    X.eval('__BUILD++'); const b = X.eval('__BUILD'); X.ctx.__C = clone(cell.c); const p = X.eval('buildProgram(__C)');
    if(probeIdx.has(ci)){ S.neutralN++; if(J(p) === J(pinned(file).buildProgram(clone(cell.c)))) S.neutral++; }
    const plan = planOf(cell.k), [rg, tr] = plan.split('/'), cap = CAP[rg][tr];
    const names = (w, d) => { const o = new Set(); secOf(p, w, d).forEach(s => (s.items || []).forEach(i => { if(i && i.name) o.add(clean(i.name)); })); return o; };
    Object.keys(p.weeks || {}).forEach(w => ORDER.forEach((d, di) => {
      const secs = secOf(p, w, d); if(secs.some(s => (s.items || []).length)) S.days++;
      secs.forEach(s => { const lab = clean(s.label); if(/^Main —/.test(lab)) S.mainSecs++;
        (s.items || []).forEach(it => { if(!it || !it.name) return; const nm = clean(it.name);
          if(/^Main —/.test(lab) && nm === 'Burpees'){ S.mains[cell.L]++; S.mainsByPlan[plan] = (S.mainsByPlan[plan] || 0) + 1; }
          const pre = clean((it.__pre && it.__pre.b === b) ? it.__pre.n : it.name);
          if(cap.includes(pat(pre)) && !cap.includes(pat(nm))) S.a2.push({ L:cell.L, plan, k:cell.k, w, d, main:/^Main/.test(lab), pre, nm }); }); });
      const N = names(w, d);
      if(LANDING[plan] && N.has(LANDING[plan])) S.land[plan] = (S.land[plan] || 0) + 1;
      if(N.has(BED) && N.has(SLHT)){ S.thrust[plan] = (S.thrust[plan] || 0) + 1; (S.thrustDays[cell.k] = S.thrustDays[cell.k] || []).push('W' + w + ' ' + d); }
      const nw = di < 6 ? w : String(+w + 1), nd = di < 6 ? ORDER[di + 1] : 'mon';
      if(N.has(BRIDGE) && names(nw, nd).has(BRIDGE)){ S.adj[plan] = (S.adj[plan] || 0) + 1; if(S.adjEx.length < 8) S.adjEx.push(cell.k + ' W' + w + ' ' + d + ' > W' + nw + ' ' + nd); }
    }));
    for(const C of CELLS_C.concat([Object.assign({ tag:'KP' }, KP_INFO)])) if(C.L === cell.L && C.k === cell.k) S.cards[C.tag] = C.at.map(([w, d]) => mainCard(p, w, d));
  });
  const XR = pinned(file);
  for(const Cc of CELLS_C.filter(x => x.L === 'U_SEED')){ const cell = U_SEED.find(x => x.k === Cc.k);
    S.cards[Cc.tag] = cell ? (p => Cc.at.map(([w, d]) => mainCard(p, w, d)))(pinned(file).buildProgram(clone(cell.c))) : []; }   // a fresh VM per cell
  RACE.forEach(cell => { const p = XR.buildProgram(clone(cell.c));
    Object.keys(p.weeks || {}).forEach(w => ORDER.forEach(d => { let hit = false;
      secOf(p, w, d).forEach(s => { const lab = clean(s.label);
        (s.items || []).forEach(i => { if(!i || clean(i.name) !== 'Burpees') return;
          if(/^Primer —/.test(lab)){ S.primer.push({ k:cell.k, eq:cell.eq, w, d, det:i.detail }); hit = true; }
          if(/^Main —/.test(lab)) S.raceMainBurpees++; }); });
      if(hit) S.primerDays++; })); });
  return S; }

let C = null, candErr = '';
try { C = survey(ART); } catch(e){ candErr = String(e && e.stack || e).slice(0, 300); P('    candidate survey CRASH ' + candErr); }
let B = null, baseErr = '';
if(BF){ try { B = survey(BF); } catch(e){ baseErr = String(e && e.stack || e).slice(0, 300); } } else baseErr = 'no V230 tree: ' + baseWhy;
const plans4 = (S, key) => PLANS4.map(pl => pl + ' ' + ((S[key] || {})[pl] || 0)).join(', ');
const sum4 = (S, key) => PLANS4.reduce((a, pl) => a + ((S[key] || {})[pl] || 0), 0);
const sumAll = m => Object.values(m || {}).reduce((a, x) => a + x, 0);

// ── ROW D196-a ──────────────────────────────────────────────────────────────────────────────────────────────────
function rowA(){
  const cj = [];
  cj.push(['a-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const m = C.mains.L432 + C.mains.LBW;
  cj.push(['a-main', m === 0, '`Main —` Burpees items: L432 ' + C.mains.L432 + ', LBW ' + C.mains.LBW + ' (by plan ' + fmt(C.mainsByPlan) + ') over ' + BW.length + ' builds, ' + C.days + ' lifting days, ' + C.mainSecs + ' Main sections; ruled 0']);
  cj.push(['a-primer', C.primer.length === 0, '`Primer —` Burpees items on INJ race: ' + C.primer.length + ' (' + C.primerDays + ' days, ' + new Set(C.primer.map(x => x.k)).size + ' builds) over ' + RACE.length + ' race builds (' + RACE.filter(x => x.eq === 'bodyweight').length + ' bodyweight); ruled 0']);
  cj.push(['a-a2', C.a2.length === 0 && !!PV, '(a″) filter-lens capped, final-lens uncapped (CAP hand table, D193): L432 ' + C.a2.filter(x => x.L === 'L432').length + ', LBW ' + C.a2.filter(x => x.L === 'LBW').length + (C.a2.length ? ' | ' + fmt(tally(C.a2, x => x.plan + ' ' + x.pre + '>' + x.nm + ' ' + (x.main ? 'Main' : 'acc'))) : '') + (PV ? '' : ' | NO CLASSIFIER (no V230 tree)') + '; ruled 0']);
  const pOK = !!PV && Object.keys(PAT_TYPED).every(n => pat(n) === PAT_TYPED[n]) && CAP.lowback.protect.includes('hip_ext') && CAP.lowback.workaround.includes('hip_ext');
  cj.push(['a-pat', pOK, 'baseline _pattern: ' + Object.keys(PAT_TYPED).map(n => n + '{' + pat(n) + '}').join(', ') + ' vs M14 printed ' + Object.keys(PAT_TYPED).map(n => '{' + PAT_TYPED[n] + '}').join('') + '; CAP lowback protect/workaround carry hip_ext (hand)']);
  const lensOK = C.neutralN > 0 && C.neutral === C.neutralN && (!B || (B.neutralN > 0 && B.neutral === B.neutralN));
  cj.push(['a-lens', lensOK && !!B, 'wrapped reused-VM build (__pre/id/created stripped) == plain fresh-VM build: candidate ' + C.neutral + '/' + C.neutralN + (B ? ', V230 ' + B.neutral + '/' + B.neutralN : ', V230 not surveyed (' + baseErr + ')')]);
  if(!B) cj.push(['a-inst', false, 'V230 not surveyed: ' + baseErr]);
  else { const bf = { mainL432:B.mains.L432, mainLBW:B.mains.LBW, primer:B.primer.length, a2L432:B.a2.filter(x => x.L === 'L432').length, a2LBW:B.a2.filter(x => x.L === 'LBW').length };
    const iok = Object.keys(V230_FIG).every(k => bf[k] === V230_FIG[k]);
    cj.push(['a-inst', iok, 'V230 reads ' + JSON.stringify(bf) + ', ruled ' + JSON.stringify(V230_FIG) + ' (the lattices are the ruled lattices) | V230 Main Burpees by plan ' + fmt(B.mainsByPlan) + ' | V230 Primer by plan ' + fmt(tally(B.primer, x => planOf(x.k))) + ' on ' + B.primerDays + ' days, by tier ' + fmt(tally(B.primer, x => x.eq))]); }
  info('INJ race `Main —` Burpees (not ruled): candidate ' + C.raceMainBurpees + (B ? ', V230 ' + B.raceMainBurpees : ''));
  row('D196-a', cj);
}

// ── ROW D196-b ──────────────────────────────────────────────────────────────────────────────────────────────────
function rowB(){
  const cj = [];
  cj.push(['b-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const bur = C.mains.L432 + C.mains.LBW + C.primer.length;
  cj.push(['b-burpees', bur === 0, 'carried from D196-a: `Main —` Burpees ' + (C.mains.L432 + C.mains.LBW) + ' + `Primer —` Burpees ' + C.primer.length + '; ruled 0']);
  const t4 = sum4(C, 'thrust');
  cj.push(['b-thrust', t4 === 0, 'days carrying both ' + SLHT + ' and ' + BED + ', per plan: ' + plans4(C, 'thrust') + ' (lowback/workaround pool [_bwHTlb, ' + SLHT + ']: days carrying the bed thrust ' + ((C.land['lowback/workaround']) || 0) + ')']);
  // (ii) session call 4: the all-cells day set is the typed pre-existing P-BWTHRUSTDOUBLE list, no additions, no removals
  const setOf = S => [].concat(...Object.keys(S.thrustDays).map(k => S.thrustDays[k].map(x => k + ' ' + x))).sort();
  const cs = setOf(C), add = cs.filter(x => !THRUST82_SET.includes(x)), rem = THRUST82_SET.filter(x => !cs.includes(x));
  cj.push(['b-thrustset', THRUST82_SET.length === 82 && cs.length === 82 && !add.length && !rem.length, 'all ' + BW.length + ' cells: both-thrust days ' + cs.length + ' (' + fmt(C.thrust) + ') vs the typed pre-existing P-BWTHRUSTDOUBLE list ' + THRUST82_SET.length + ' | additions ' + add.length + (add.length ? ' ' + JSON.stringify(add.slice(0, 6)) : '') + ', removals ' + rem.length + (rem.length ? ' ' + JSON.stringify(rem.slice(0, 6)) : '')]);
  const aAll = sumAll(C.adj);
  cj.push(['b-adj', aAll === 0, 'adjacent calendar day pairs both carrying ' + BRIDGE + ' over all ' + BW.length + ' builds: ' + aAll + ' | per plan ' + plans4(C, 'adj') + (aAll ? ' | ' + C.adjEx.join('; ') : '')]);
  const cov = PLANS4.every(pl => (C.land[pl] || 0) > 0);
  cj.push(['b-cover', cov, 'days carrying the plan\'s landing name (bridge on ankle/knee, bed thrust on lowback): ' + plans4(C, 'land') + ' (every plan > 0: the four plans are exercised, not vacuous)']);
  if(!B) cj.push(['b-inst', false, 'V230 not surveyed: ' + baseErr]);
  else { const bs = setOf(B), bEq = JSON.stringify(bs) === JSON.stringify(THRUST82_SET);
    cj.push(['b-inst', sum4(B, 'thrust') === 0 && sumAll(B.adj) === 0 && bEq, 'V230 ("both 0 on V230 too", on the four plans): both-thrust days ' + plans4(B, 'thrust') + '; adjacent bridge pairs over all cells ' + sumAll(B.adj) + '; all-cells both-thrust set == the typed 82-day list: ' + bEq + ' (' + bs.length + ' days)']); }
  // INFO: P-BWTHRUSTDOUBLE (pre-existing, parked), days by name on the candidate
  const dayList = S => Object.keys(S.thrustDays).sort().map(k => k + ' :: ' + S.thrustDays[k].join(', '));
  info('P-BWTHRUSTDOUBLE (pre-existing, parked; not D196): candidate ' + sumAll(C.thrust) + ' days' + (B ? ', V230 ' + sumAll(B.thrust) + ' days' : '') + ' over all 324 cells:');
  dayList(C).forEach(s => info('  ' + s));
  row('D196-b', cj);
}

// ── ROW D196-c ──────────────────────────────────────────────────────────────────────────────────────────────────
function rowC(){
  const cj = [];
  cj.push(['c-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const want = c => JSON.stringify({ label:c.label, items:c.items });
  let instOK = !!B; const instWhy = [];
  for(const X of CELLS_C){
    const got = C.cards[X.tag] || [];
    const okC = got.length === X.at.length && got.every(g => g && want(g) === want(X.c231));
    cj.push([X.tag, okC, X.L + ' ' + X.k + ' ' + X.at.map(([w, d], i) => 'W' + w + ' ' + d + ': ' + showCard(got[i])).join(' || ') + (okC ? '' : ' | typed 231: ' + showCard(X.c231))]);
    if(B){ const gb = B.cards[X.tag] || []; const okB = gb.length === X.at.length && gb.every(g => g && want(g) === want(X.c230));
      if(!okB){ instOK = false; instWhy.push(X.tag + ' V230 ' + gb.map(showCard).join(' || ')); } }
  }
  cj.push(['c-inst', instOK, B ? (instOK ? 'V230 reads the typed `Main — Burpees` cards on all five cells, both weeks (detail verbatim)' : instWhy.join('; ')) : 'V230 not surveyed: ' + baseErr]);
  info('session call 3, the ruling parenthetical\'s s76308 cell (not typed): ' + KP_INFO.L + ' ' + KP_INFO.k + ' ' + KP_INFO.at.map(([w, d], i) => 'W' + w + ' ' + d + ': candidate ' + showCard((C.cards.KP || [])[i]) + (B ? ' / V230 ' + showCard((B.cards.KP || [])[i]) : '')).join(' || ') + ' (the ruling parenthetical\'s knee/protect cell; V230 knee/protect `Main —` Burpees on the 324 cells: ' + (B ? (B.mainsByPlan['knee/protect'] || 0) : '?') + ')');
  row('D196-c', cj);
}

// ── ROW D196-d ──────────────────────────────────────────────────────────────────────────────────────────────────
function rowD(){
  const cj = [];
  cj.push(['d-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const M = manny(ART);
  cj.push(['d-digest', M.self && M.dig === DIG_231, 'candidate HALF_MANNY ' + M.dig + (M.self ? ' (self-identical in two VMs)' : ' (NOT self-identical: ' + M.dig2 + ')') + ', ruled ' + DIG_231]);
  const era = MANNY_DIGEST_BY_VERSION[ERA];
  cj.push(['d-era', era !== undefined && era === DIG_231, era === undefined ? 'harness MANNY_DIGEST_BY_VERSION[' + ERA + '] ABSENT (row existence is a conjunct, standing ruling 5)' : 'harness MANNY_DIGEST_BY_VERSION[' + ERA + '] = ' + era + ', ruled ' + DIG_231]);
  if(!BF) cj.push(['d-cfW5', false, 'no V230 tree: ' + baseWhy]);
  else { const s = surgery(BASE_TEXT, S45, CAND_TEXT);
    let d = '(not built)', self = false, live = '';
    let liveOK = false;
    try { const f = tmpWrite('w5', s.text); const W = manny(f); d = W.dig; self = W.self;
      const X = pinned(f); const lp = BW.find(x => x.k === 'lowback/protect|bodyweight|beginner|support_strength|sun,wed'), ap = BW.find(x => x.k === 'ankle/protect|bodyweight|beginner|support_strength|sun,wed');
      const m1 = mainCard(X.buildProgram(clone(lp.c)), '1', 'tue'), m2 = mainCard(X.buildProgram(clone(ap.c)), '3', 'thu');
      liveOK = !!m1 && !!m2 && m1.items.length === 1 && m1.items[0][0] === BED && m2.items.length === 1 && m2.items[0][0] === BRIDGE;
      live = 'W5 tree lowback/protect W1 tue ' + showCard(m1) + ' ; ankle/protect W3 thu ' + showCard(m2);
    } catch(e){ d = 'CRASH ' + String(e && e.message || e).slice(0, 120); }
    cj.push(['d-cfW5', s.ok && self && d === DIG_W5 && liveOK, 'W5 alone = V230 + slices 4 and 5 (5 replacements): digest ' + d + (self ? '' : ' (not self-identical)') + ', ruled ' + DIG_W5 + ' | surgery took (bed thrust / bridge Mains): ' + liveOK + ' :: ' + live + (s.ok ? '' : ' | SURGERY: ' + s.why.join('; '))]); }
  if(!BF) cj.push(['d-inst', false, 'no V230 tree: ' + baseWhy]);
  else { const Bm = manny(BF); cj.push(['d-inst', Bm.self && Bm.dig === DIG_V230, 'V230 baseline HALF_MANNY ' + Bm.dig + (Bm.self ? ' self-identical' : ' NOT self-identical') + ', ruled ' + DIG_V230]); }
  row('D196-d', cj);
}

const ROWS = { 'D196-a':rowA, 'D196-b':rowB, 'D196-c':rowC, 'D196-d':rowD };
for(const k of ROW_ORDER){ try { ROWS[k](); } catch(e){ P('    ' + k + ' CRASH ' + String(e && e.stack || e).slice(0, 400)); ok(R[k] + ' (crashed)', false); } }
done();
