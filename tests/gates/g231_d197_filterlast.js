// g231_d197_filterlast.js — GATE for D197 P-FILTERLAST (V231): after bodyweightSweep, inside the bodyweight branch and
// only when cfg.injury is set, every day is filtered once more with the core re-filter's whole-day call.
//
//   node tests/gates/g231_d197_filterlast.js <candidate.html> [baseline_V230.html]
//
// THE RULING THIS DEFENDS (standing ruling 4)
//   tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, D197 (Mario: "Fold into V231"), amended by
//   tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, D197 Amendment 1 (class D197-2, no code change).
//   "After `bodyweightSweep`, inside the bodyweight branch and only when `cfg.injury` is set, every day is filtered once
//   more with the whole-day call the core re-filter already uses (`_day.sections=applyInjuryFilter(_day.sections,cfg)`)
//   ... Sited inside the bodyweight branch because the loaded tiers' last name change is already filtered; so no
//   loaded-tier build can move."
//   D197-a  "(independent oracle): the 20 typed cells read `RPE 7 (leave 3 or more in reserve)` on `Chest volume: Pushups
//           (slow 3s eccentric)` at 231 and `RPE 8` on V230." The cells (prior ruling, Before / After): "elbow/workaround |
//           bodyweight | advanced | W3 and W4 mon, `Chest volume: Pushups (slow 3s eccentric)` (swept from `Dumbbell
//           incline press`): L432 support_strength and support_athletic (sun,wed) at s76308; LBW balanced sun,wed and
//           sat,sun at s76308; U_SEED the same four cells at s90210 (none at s11); U_FL fatloss sun,wed and sat,sun. Before
//           `4 sets — RPE 8 (stop 2 reps short of failure)`, after `4 sets — RPE 7 (leave 3 or more in reserve)`. Nothing
//           else on any card."
//   D197-c  (re-ruling, new) "the g215 LAT_G cell above reads no `Burpees` item on W1 Mon at 231 and `Chest volume ::
//           Burpees 3×15` on V230." The cell: "bodyweight | hypertrophy | ankle/workaround | intermediate | 55+ | s4242 |
//           sun,wed, W1–W3, W5–W7, W9–W11 Mon: 9 days" (class D197-2: sweep source `Pec deck`, the plan is noJumps).
//   D197-L  (session call, from the ruling's own claim "no loaded-tier build can move"): on the candidate source, the
//           re-filter line sits inside the `cfg.equipment==='bodyweight'` block: it appears once, after the
//           `bodyweightSweep(` call, before the `else { unloadableRxSweep` line, inside the braces; comments are stripped
//           before the scan.
//   D197-b (the re-keyed INFO row, post-sweep own-plan rejects) belongs to tests/gates/g230_d194_lens2.js, not here.
//   D-code D197 ships on ia-version 231 (tests/edits/v231_s6_d197_bump.py).
//
// VERSION PREDICATE (standing rulings 2 and 4). Every row RUNS on every tree; `VER >= 231` (VER = the candidate's
//   ia-version meta) is the first conjunct of every row. A tree below 231 is never skipped or refused: its rows FAIL by
//   their own conjuncts as well as by the predicate. On V230 as candidate the expected failures are: D197-a a-ver,
//   a-cells (0/20: every cell reads RPE 8), a-diff (the candidate equals V230 on every day: an empty diff is a failure);
//   D197-c c-ver, c-w1, c-mon9, c-noburp, c-diff; D197-L L-ver, L-brace, L-close, L-once, L-guard (V230's bodyweight
//   branch is the unbraced `if(cfg.equipment==='bodyweight') bodyweightSweep(...);` and carries no re-filter).
//
// PRESENTATION. D197-a: each cfg exactly as tests/measure/v231_bwfallback.js (M14) builds it: the MARIO literal copied
//   from there, `injury` set directly to elbow/workaround, equipment bodyweight, experience advanced, the cell's focus /
//   restDays / seed on top (cfg.seed pinned), clock pinned to 2026-08-24 12:00 (M14's clock). D197-c: the cfg exactly as
//   tests/gates/g215_d149_ghd.js builds it (its GOALS/FOC/EXPS/AGES/SEEDS/REG/ITIER tables and mk() copied, the LAT_G
//   loop run, the one ruled cell picked); g215 does not pin the clock, so neither does this row, and c-self proves the
//   build clock-free (a third build with the clock pinned to 2026-08-24 must equal the two real-clock builds). Every
//   build is in a fresh VM; `id` and `created` are stripped from day JSON; a card is [clean(label), [[clean(name),
//   clean(detail)], ...]] per section. Every program (candidate and baseline) is built twice in two VMs and must equal
//   itself before anything is compared.
//
// ORACLES. Nothing below asks the candidate's engine what the answer should be.
//   LITERAL       the ruling's strings: `Chest volume`, `Pushups (slow 3s eccentric)`, `4 sets — RPE 8 (stop 2 reps short
//                 of failure)` before, `4 sets — RPE 7 (leave 3 or more in reserve)` after; `Chest volume`, `Burpees`,
//                 `3×15`; the ruled cells; the ruled Mondays W1–W3, W5–W7, W9–W11; the ruled day sets (W3/W4 mon on each
//                 of the 10 programs; the nine Mondays on the LAT_G program); the whole-day call text.
//   TYPED V230    A_CARD (the four distinct W3/W4 Monday cards), A_CELLS (per program: V230 W3/W4 mon day sha, V230
//                 rest-of-program sha), G_CARD / G_DAY / G_REST (the LAT_G program's nine Monday cards, day shas before
//                 and with the `Chest volume` section spliced out, rest-of-program sha). Taken ONCE from the V230
//                 baseline (scratchpad/base_v230.html == `git show 71c76d8:index.html`, ia-version 230) by builder's
//                 probe on 2026-10-04 (scratchpad/builder_g4/gen.js), same presentation as above, and typed here; the
//                 gate never asks the baseline for them. The baseline is re-read in this run only for the instrument
//                 conjuncts (a-inst, c-inst: the typed tables are V230's) and the live differential (a-diff, c-diff).
//                 The expected candidate cards are DERIVED from the typed V230 cards by the ruling's own edit (one
//                 detail RPE 8 -> RPE 7; one `Chest volume :: Burpees 3×15` section out), never read off the candidate.
//   SOURCE        D197-L reads the candidate's text: the single <script> block, comments stripped by a string-, template-
//                 and regex-aware scanner (L-inst proves the stripped text still compiles, so the scanner ate no code).
//
// ROWS
//   D197-a  a-ver; a-cells (20 cells: card == typed V230 card with the one detail at RPE 7, and the day with that detail
//           put back == V230's typed day sha, so nothing else on the card moved); a-other (6 weeks, every other day ==
//           V230's typed rest-of-program sha, 10/10); a-self; a-diff (live candidate vs V230: exactly W3 mon and W4 mon
//           differ, 10/10); a-inst.
//   D197-c  c-ver; c-cell (the LAT_G cfg is the ruled cell); c-w1 (W1 Mon: no Burpees item; typed V230 W1 Mon carries
//           `Chest volume :: Burpees 3×15`); c-mon9 (nine Mondays: no Burpees item, card == typed V230 card minus that
//           section, day == V230's typed day with that section spliced out); c-noburp (no Burpees item on any day);
//           c-other (11 weeks, every other day == V230's typed rest sha); c-self; c-diff (live: exactly the nine Mondays
//           differ); c-inst.
//   D197-L  L-ver; L-call (one `bodyweightSweep(weeks` call); L-brace (the nearest `if(cfg.equipment==='bodyweight')`
//           before it opens a brace that the call begins); L-close (that block's `}` is followed only by whitespace and
//           `else { unloadableRxSweep(weeks, cfg)`); L-once (exactly one whole-day call between the sweep call and that
//           else) and it lies inside the braces; L-guard (its statement opens `if(cfg.injury)` and walks Object.keys(weeks)
//           and each week's days); L-inst.
//
// Temp files: only the git copy of V230 if argv[3] is absent or not ia-version 230, under os.tmpdir() (the runner sets
//   TMPDIR to its scratch path), removed on exit.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const { load, DAYS } = H;

const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEFILE = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ERA = 231, BASE_ERA = 230, V230_COMMIT = '71c76d8';
const CLOCK = '2026-08-24';

// ── LITERALS FROM THE RULING ───────────────────────────────────────────────────────────────────────────
const SEC_A = 'Chest volume', NAME_A = 'Pushups (slow 3s eccentric)';
const BEFORE_A = '4 sets — RPE 8 (stop 2 reps short of failure)';
const AFTER_A = '4 sets — RPE 7 (leave 3 or more in reserve)';
const A_DAYS = ['3 mon', '4 mon'];                     // the ruled W3 and W4 Mondays
const SEC_C = 'Chest volume', NAME_C = 'Burpees', DETAIL_C = '3×15';
const MON9 = [1, 2, 3, 5, 6, 7, 9, 10, 11];             // W1–W3, W5–W7, W9–W11 Mon
const BURPEE_RE = /burpee/i;
const A_WEEKS = 6;                                      // M14's lift-path MARIO builds six weeks (typed)

// ── CFG BUILDERS (copied, not re-derived) ──────────────────────────────────────────────────────────────
// tests/measure/v231_bwfallback.js :27 (M14), verbatim
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
// M14's M({ injury, equipment, experience, liftingFocus[, restDays] }) then U_SEED's { seed }: same keys, same order
const cellCfg = o => Object.assign(clone(MARIO), { injury:{ region:'elbow', tier:'workaround' }, equipment:'bodyweight', experience:'advanced' }, clone(o));
// tests/gates/g215_d149_ghd.js :112-137, verbatim tables and mk(); the LAT_G loop as g215 runs it
const G215_OWNS_ORDER = ['commercial', 'crossfit', 'home_full', 'home_basic', 'bodyweight'];
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'], RESTS = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const REG = ['shoulder','elbow','lowback','hip','knee','ankle'], ITIER = ['workaround','protect'];
function mk(eq, gi, f, exp, age, si, inj){
  const [g, x] = GOALS[gi % GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes:['run'],
    cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:f, experience:exp, ageBracket:age, equipment:eq, unit:'lbs',
    restDays: RESTS[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: SEEDS[si] };
  if(inj) c.injury = inj;
  return c;
}
function latG(){ const L = [];
  for(const eq of G215_OWNS_ORDER) for(let si = 0; si < SEEDS.length; si++){
    FOC.forEach((f, fi) => L.push({ eq, si, inj:null, cfg: mk(eq, si + fi, f, EXPS[(si + fi) % 3], AGES[(si + 2 * fi) % 3], si, null) }));
    REG.forEach((r, ri) => ITIER.forEach((t, ti) => L.push({ eq, si, inj:{ region:r, tier:t },
      cfg: mk(eq, si + ri, FOC[(si + ri + ti) % 7], EXPS[(si + ri) % 3], AGES[(si + ti) % 3], si, { region:r, tier:t }) })));
  }
  return L; }

// ── TYPED V230 TABLES (builder probe on scratchpad/base_v230.html, 2026-10-04; see header) ─────────────────────────
// the four distinct V230 W3/W4 Monday cards of the 20 cells, [label, [[name, detail], ...]] per section, keyed 's<seed> <week>'
const A_CARD = {
  "s76308 3": [["Main — Archer pushups",[["Archer pushups","3 sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Decline pushups (feet elevated)",[["Decline pushups (feet elevated)","4 sets — RPE 7 (leave 3 or more in reserve)"]]],["Chest volume",[["Pushups (slow 3s eccentric)","4 sets — RPE 8 (stop 2 reps short of failure)"]]],["Delts",[["Wall slides","4×12"]]],["",[["Side plank","3×30–45 sec each"],["Plank shoulder taps","3×12 each"]]]],
  "s76308 4": [["Main — Archer pushups",[["Archer pushups","3 sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Decline pushups (feet elevated)",[["Decline pushups (feet elevated)","4 sets — RPE 7 (leave 3 or more in reserve)"]]],["Chest volume",[["Pushups (slow 3s eccentric)","4 sets — RPE 8 (stop 2 reps short of failure)"]]],["Delts",[["Wall slides","4×12"]]],["",[["Windshield wipers","3×16 (180° arc)"],["Standing torso rotations (slow)","3 sets — RPE 8 (stop 2 reps short of failure)"]]]],
  "s90210 3": [["Main — Decline pushups (feet elevated)",[["Decline pushups (feet elevated)","3 sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","4 sets — RPE 7 (leave 3 or more in reserve)"]]],["Chest volume",[["Pushups (slow 3s eccentric)","4 sets — RPE 8 (stop 2 reps short of failure)"]]],["Delts",[["Wall slides","4×12"]]],["",[["Side plank","3×30–45 sec each"],["Plank shoulder taps","3×12 each"]]]],
  "s90210 4": [["Main — Decline pushups (feet elevated)",[["Decline pushups (feet elevated)","3 sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","4 sets — RPE 7 (leave 3 or more in reserve)"]]],["Chest volume",[["Pushups (slow 3s eccentric)","4 sets — RPE 8 (stop 2 reps short of failure)"]]],["Delts",[["Wall slides","4×12"]]],["",[["Windshield wipers","3×16 (180° arc)"],["Standing torso rotations (slow)","3 sets — RPE 8 (stop 2 reps short of failure)"]]]],
};
// [cell, cfg overrides on MARIO + elbow/workaround bodyweight advanced, V230 W3 mon day sha, V230 W4 mon day sha, V230 rest-of-program sha]
const A_CELLS = [
  ["L432 support_strength sun,wed s76308", {"liftingFocus":"support_strength","seed":76308}, "c9179f4b41669a88", "40970983ee1d54be", "c6b47d3776579bdb"],
  ["L432 support_athletic sun,wed s76308", {"liftingFocus":"support_athletic","seed":76308}, "c9179f4b41669a88", "40970983ee1d54be", "d2ee8730a1ef5e35"],
  ["LBW balanced sun,wed s76308", {"liftingFocus":"balanced","restDays":["sun","wed"],"seed":76308}, "c9179f4b41669a88", "40970983ee1d54be", "66d144fd6b783996"],
  ["LBW balanced sat,sun s76308", {"liftingFocus":"balanced","restDays":["sat","sun"],"seed":76308}, "c9179f4b41669a88", "40970983ee1d54be", "5d58caa8cdffc1fd"],
  ["U_SEED support_strength sun,wed s90210", {"liftingFocus":"support_strength","seed":90210}, "e826be6ef57d5507", "13faddc489a21bbf", "66d938b2b3d9fe12"],
  ["U_SEED support_athletic sun,wed s90210", {"liftingFocus":"support_athletic","seed":90210}, "e826be6ef57d5507", "13faddc489a21bbf", "6c0ae4cf31dbae2c"],
  ["U_SEED balanced sun,wed s90210", {"liftingFocus":"balanced","restDays":["sun","wed"],"seed":90210}, "e826be6ef57d5507", "13faddc489a21bbf", "2f92156659c4506b"],
  ["U_SEED balanced sat,sun s90210", {"liftingFocus":"balanced","restDays":["sat","sun"],"seed":90210}, "e826be6ef57d5507", "13faddc489a21bbf", "c45d3c5f2755104a"],
  ["U_FL fatloss sun,wed s76308", {"liftingFocus":"fatloss","restDays":["sun","wed"],"seed":76308}, "c9179f4b41669a88", "40970983ee1d54be", "d2ee8730a1ef5e35"],
  ["U_FL fatloss sat,sun s76308", {"liftingFocus":"fatloss","restDays":["sat","sun"],"seed":76308}, "c9179f4b41669a88", "40970983ee1d54be", "1491f8d47840d403"],
];
// the LAT_G cell's nine V230 Monday cards (W1–W3, W5–W7, W9–W11), same shape
const G_CARD = {
  1: [["Main — Pushups (slow 3s eccentric)",[["Pushups (slow 3s eccentric)","3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","3 sets — RPE 8 (stop 2 reps short of failure)"]]],["Chest volume",[["Burpees","3×15"]]],["Delts",[["Wall slides","3×15"],["Prone Y-T-W raises","3×15"]]],["",[["Plank shoulder taps","3×12 each"]]]],
  2: [["Main — Pushups (slow 3s eccentric)",[["Pushups (slow 3s eccentric)","3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","3 sets — RPE 8 (stop 2 reps short of failure)"]]],["Chest volume",[["Burpees","3×15"]]],["Delts",[["Wall slides","3×15"],["Prone Y-T-W raises","3×15"]]],["",[["Standing torso rotations (slow)","3 sets — RPE 8 (stop 2 reps short of failure)"]]]],
  3: [["Main — Pushups (slow 3s eccentric)",[["Pushups (slow 3s eccentric)","3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","3 sets — RPE 8 (stop 2 reps short of failure)"]]],["Chest volume",[["Burpees","3×15"]]],["Delts",[["Wall slides","3×15"],["Prone Y-T-W raises","3×15"]]],["",[["Side plank","3×30–45 sec each"]]]],
  5: [["Main — Pushups (slow 3s eccentric)",[["Pushups (slow 3s eccentric)","3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","3 sets — RPE 8 (stop 2 reps short of failure)"]]],["Chest volume",[["Burpees","3×15"]]],["Delts",[["Wall slides","3×15"],["Prone Y-T-W raises","3×15"]]],["",[["Bird dogs","3×12 each"]]]],
  6: [["Main — Pushups (slow 3s eccentric)",[["Pushups (slow 3s eccentric)","3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","3 sets — RPE 8 (stop 2 reps short of failure)"]]],["Chest volume",[["Burpees","3×15"]]],["Delts",[["Wall slides","3×15"],["Prone Y-T-W raises","3×15"]]],["",[["Side plank thread-the-needle","3×10 each"]]]],
  7: [["Main — Pushups (slow 3s eccentric)",[["Pushups (slow 3s eccentric)","3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","3 sets — RPE 8 (stop 2 reps short of failure)"]]],["Chest volume",[["Burpees","3×15"]]],["Delts",[["Wall slides","3×15"],["Prone Y-T-W raises","3×15"]]],["",[["Plank shoulder taps","3×12 each"]]]],
  9: [["Main — Pushups (slow 3s eccentric)",[["Pushups (slow 3s eccentric)","3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","3 sets — RPE 8 (stop 2 reps short of failure)"]]],["Chest volume",[["Burpees","3×15"]]],["Delts",[["Wall slides","3×15"],["Prone Y-T-W raises","3×15"]]],["",[["Side plank","3×30–45 sec each"]]]],
  10: [["Main — Pushups (slow 3s eccentric)",[["Pushups (slow 3s eccentric)","3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","3 sets — RPE 8 (stop 2 reps short of failure)"]]],["Chest volume",[["Burpees","3×15"]]],["Delts",[["Wall slides","3×15"],["Prone Y-T-W raises","3×15"]]],["",[["Windshield wipers","3×16 (180° arc)"]]]],
  11: [["Main — Pushups (slow 3s eccentric)",[["Pushups (slow 3s eccentric)","3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"]]],["Secondary compound — Diamond pushups",[["Diamond pushups","3 sets — RPE 8 (stop 2 reps short of failure)"]]],["Chest volume",[["Burpees","3×15"]]],["Delts",[["Wall slides","3×15"],["Prone Y-T-W raises","3×15"]]],["",[["Bird dogs","3×12 each"]]]],
};
// [V230 day sha, V230 day sha with its `Chest volume` section spliced out] per Monday
const G_DAY = {
  1: ["8ccf8939e92b2b1e", "2a53f36fd764f488"],
  2: ["f9d198550b7672e5", "23329446ac3cd5ba"],
  3: ["b6d91119b604289d", "1d18488c0ed31c2c"],
  5: ["f7504ef18efc5944", "61966e41a501847d"],
  6: ["0be2052cac0de976", "5709441b3adf0e87"],
  7: ["e0782f47df53f81c", "81bfc411a071276f"],
  9: ["6e123da8cb5057d0", "63ace7a3d22478c9"],
  10: ["10b1d84a42b8f52e", "6d36e799b98c8f97"],
  11: ["7a169491f999b037", "3f715ee11199ee30"],
};
const G_WEEKS = 11, G_REST = "8ff3228b0ad016ab";   // V230 rest-of-program sha (every day but the nine Mondays)

// ── HELPERS ──────────────────────────────────────────────────────────────────────────
function clone(o){ return JSON.parse(JSON.stringify(o)); }
const sha16 = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const dayJ = day => JSON.stringify(day || null, (k, v) => (k === 'id' || k === 'created') ? undefined : v);
const card = d => (d && d.sections || []).map(s => [clean(s.label), (s.items || []).map(i => [clean(i.name), clean(i.detail)])]);
const cardLine = ([l, its]) => l + ' :: ' + its.map(x => x[0] + ' ' + x[1]).join(' | ');
function cardDiff(got, want){ const g = got.map(cardLine), w = want.map(cardLine);
  for(let i = 0; i < Math.max(g.length, w.length); i++) if(g[i] !== w[i]) return 'section ' + i + ' reads [' + (g[i] === undefined ? '(none)' : g[i]) + '], want [' + (w[i] === undefined ? '(none)' : w[i]) + ']';
  return 'equal'; }
const wkeys = p => Object.keys((p && p.weeks) || {}).sort((a, b) => a - b);
const progDays = p => wkeys(p).map(w => DAYS.map(d => w + ' ' + d + ' ' + dayJ(p.weeks[w][d])).join('\n')).join('\n');
const restSha = (p, skip) => sha16(wkeys(p).map(w => DAYS.map(d => skip.includes(w + ' ' + d) ? '' : w + ' ' + d + ' ' + dayJ(p.weeks[w][d])).join('\n')).join('\n'));
const burpees = p => { const o = []; for(const w of wkeys(p)) for(const d of DAYS){ const dy = p.weeks[w][d];
  (dy && dy.sections || []).forEach(s => (s.items || []).forEach(i => { if(i && BURPEE_RE.test(clean(i.name))) o.push(w + ' ' + d + ' ' + clean(s.label) + ' :: ' + clean(i.name) + ' ' + clean(i.detail)); })); } return o; };
function diffDays(p, q){ const o = []; const ws = new Set(wkeys(p).concat(wkeys(q)));
  for(const w of [...ws].sort((a, b) => a - b)) for(const d of DAYS) if(dayJ(((p.weeks || {})[w] || {})[d]) !== dayJ(((q.weeks || {})[w] || {})[d])) o.push(w + ' ' + d); return o; }
const TMPS = [];
process.on('exit', () => TMPS.forEach(f => { try { fs.unlinkSync(f); } catch(e){} }));
function tmpWrite(tag, text){ const f = path.join(os.tmpdir(), 'g231_d197_' + tag + '_' + process.pid + '.html'); fs.writeFileSync(f, text); TMPS.push(f); return f; }
function pinned(file, clock){   // a fresh VM; clock pinned to <clock> 12:00 (new Date() and Date.now()) unless clock is null
  const X = load(file); if(!clock) return X; const T = new Date(clock + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  X.ctx.Date = FD; return X; }
function twice(file, cfg, clock){   // the same cfg in two fresh VMs: {p, self}
  const p1 = pinned(file, clock).buildProgram(clone(cfg)), p2 = pinned(file, clock).buildProgram(clone(cfg));
  return { p:p1, self:progDays(p1) === progDays(p2) }; }

// ── PLUMBING ─────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const R = {
  'D197-a': 'row D197-a (D197, VER >= 231) the 20 typed cells (elbow/workaround bodyweight advanced W3+W4 Mon: L432 support_strength/support_athletic s76308, LBW balanced sun,wed/sat,sun s76308, U_SEED the same four at s90210, U_FL fatloss sun,wed/sat,sun) read Chest volume :: Pushups (slow 3s eccentric) 4 sets — RPE 7 (leave 3 or more in reserve), V230 RPE 8; nothing else on any card',
  'D197-c': 'row D197-c (D197 Am. 1, VER >= 231) g215 LAT_G bodyweight | hypertrophy | ankle/workaround | intermediate | 55+ | s4242 | sun,wed: no Burpees on W1 Mon (V230 Chest volume :: Burpees 3×15); the nine Mondays W1–W3, W5–W7, W9–W11 equal V230 minus that section; nothing else moves',
  'D197-L': 'row D197-L (D197 session call, VER >= 231) the post-sweep re-filter sits once inside the cfg.equipment===\'bodyweight\' braces, after bodyweightSweep(, before else { unloadableRxSweep (comments stripped)',
};
const ORDER = ['D197-a', 'D197-c', 'D197-L'];
// a row = list of [conjunct name, bool, detail]; it passes only if every conjunct holds
function row(key, cj){ cj.forEach(([n, c, d]) => P('    ' + key + ' ' + n + ' ' + (c ? 'ok' : 'FAIL') + ' :: ' + d));
  const bad = cj.filter(x => !x[1]).map(x => x[0]); ok(R[key], !bad.length, bad.length ? 'failing conjuncts: ' + bad.join(', ') : cj.length + '/' + cj.length + ' conjuncts'); }

// ── LOAD + VERSION ───────────────────────────────────────────────────────────────────────
let IA, VER = NaN, CAND_TEXT = '';
try { IA = load(ART); VER = +IA.version; CAND_TEXT = fs.readFileSync(ART, 'utf8'); }
catch(e){ P('FAIL boot: ' + String(e && e.message || e).slice(0, 200)); fail++; ORDER.forEach(k => ok(R[k] + ' (candidate did not boot)', false)); done(); }
P('g231 D197 P-FILTERLAST | candidate ' + ART + ' ia-version ' + VER + (VER >= ERA ? '' : ' (below ' + ERA + ': every row runs and must FAIL by its own conjuncts)'));
let BF = null, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ BF = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot; '; } }
} else baseWhy = 'no argv[3]; ';
if(!BF){
  try { const f = tmpWrite('v230', cp.execFileSync('git', ['-C', ROOT, 'show', V230_COMMIT + ':index.html'], { maxBuffer:1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ BF = f; baseWhy += 'git show ' + V230_COMMIT + ':index.html written to ' + f + ' (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
P('  V' + BASE_ERA + ' baseline: ' + (BF ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));

// ── ROW D197-a ────────────────────────────────────────────────────────────────────────
function rowA(){
  const cj = [];
  cj.push(['a-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  // the expected candidate card: the typed V230 card with the ruled detail moved RPE 8 -> RPE 7 (exactly one hit)
  const EXP = {}, derBad = [];
  for(const k of Object.keys(A_CARD)){ const c = clone(A_CARD[k]); let n = 0;
    c.forEach(([lab, its]) => its.forEach(it => { if(lab === SEC_A && it[0] === NAME_A && it[1] === BEFORE_A){ it[1] = AFTER_A; n++; } }));
    if(n !== 1) derBad.push(k + ': ' + n + ' typed hits'); EXP[k] = c; }
  let nC = 0, okC = 0, okO = 0, okS = 0, okD = 0, okI = 0; const bC = [], bO = [], bS = [], bD = [], bI = [];
  for(const [key, o, d3, d4, rest] of A_CELLS){
    const cfg = cellCfg(o); let C = null, B = null;
    try { C = twice(ART, cfg, CLOCK); } catch(e){ bS.push(key + ' CRASH ' + String(e && e.message || e).slice(0, 100)); }
    if(BF) try { B = twice(BF, cfg, CLOCK); } catch(e){ bI.push(key + ' V230 CRASH ' + String(e && e.message || e).slice(0, 100)); }
    const dsha = { 3:d3, 4:d4 };
    if(C){
      if(C.self) okS++; else bS.push(key + ' not self-identical');
      for(const w of [3, 4]){ nC++;
        const day = (C.p.weeks[w] || {}).mon, got = card(day), want = EXP['s' + o.seed + ' ' + w];
        let why = '';
        if(!want) why = 'no typed card';
        else if(JSON.stringify(got) !== JSON.stringify(want)) why = cardDiff(got, want);
        else { const dd = clone(day); let n = 0;
          dd.sections.forEach(s => (s.items || []).forEach(it => { if(clean(s.label) === SEC_A && clean(it.name) === NAME_A && clean(it.detail) === AFTER_A){ it.detail = BEFORE_A; n++; } }));
          const h = sha16(dayJ(dd)); if(n !== 1 || h !== dsha[w]) why = 'with the detail put back (' + n + ' hit) the day hashes ' + h + ', V230 typed ' + dsha[w] + ' (another field moved)'; }
        if(why) bC.push(key + ' W' + w + ' mon: ' + why); else okC++; }
      const ws = wkeys(C.p).length, rh = restSha(C.p, A_DAYS);
      if(ws === A_WEEKS && rh === rest) okO++; else bO.push(key + ' weeks ' + ws + ' rest ' + rh + ' (V230 typed ' + rest + ')');
    }
    if(C && B){ const dd = diffDays(C.p, B.p);
      if(B.self && JSON.stringify(dd) === JSON.stringify(A_DAYS)) okD++; else bD.push(key + (B.self ? '' : ' (V230 not self-identical)') + ' differs on [' + dd.join(', ') + ']'); }
    if(B){ let why = '';
      if(!B.self) why = 'not self-identical';
      else { for(const w of [3, 4]){ const day = (B.p.weeks[w] || {}).mon, h = sha16(dayJ(day));
          if(JSON.stringify(card(day)) !== JSON.stringify(A_CARD['s' + o.seed + ' ' + w])) why += ' W' + w + ' card ' + cardDiff(card(day), A_CARD['s' + o.seed + ' ' + w]);
          else if(h !== dsha[w]) why += ' W' + w + ' day ' + h + ' != typed ' + dsha[w]; }
        const rh = restSha(B.p, A_DAYS); if(rh !== rest) why += ' rest ' + rh + ' != typed ' + rest;
        if(wkeys(B.p).length !== A_WEEKS) why += ' weeks ' + wkeys(B.p).length; }
      if(why) bI.push(key + ':' + why); else okI++; }
  }
  const N = A_CELLS.length;
  cj.push(['a-cells', !derBad.length && nC === 20 && okC === 20, 'cells reading ' + SEC_A + ' :: ' + NAME_A + ' ' + AFTER_A + ' on the typed V230 card, nothing else on the day moved: ' + okC + '/20' + (derBad.length ? ' | TYPED TABLE: ' + derBad.join('; ') : '') + (bC.length ? ' | ' + bC.slice(0, 3).join('; ') : '')]);
  cj.push(['a-other', okO === N, 'programs with ' + A_WEEKS + ' weeks and every day but W3/W4 mon == V230 typed: ' + okO + '/' + N + (bO.length ? ' | ' + bO.slice(0, 3).join('; ') : '')]);
  cj.push(['a-self', okS === N, 'candidate programs self-identical in two VMs: ' + okS + '/' + N + (bS.length ? ' | ' + bS.slice(0, 3).join('; ') : '')]);
  cj.push(['a-diff', !!BF && okD === N, BF ? 'live candidate vs V230: programs differing on exactly W3 mon and W4 mon: ' + okD + '/' + N + (bD.length ? ' | ' + bD.slice(0, 3).join('; ') : '') : 'no V230 tree: ' + baseWhy]);
  cj.push(['a-inst', !!BF && okI === N, BF ? 'V230 baseline self-identical and == the typed cards, day shas and rest shas: ' + okI + '/' + N + (bI.length ? ' | ' + bI.slice(0, 3).join('; ') : '') : 'no V230 tree: ' + baseWhy]);
  row('D197-a', cj);
}

// ── ROW D197-c ────────────────────────────────────────────────────────────────────────
function rowC(){
  const cj = [];
  cj.push(['c-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  // the ruled cell, picked out of g215's own LAT_G
  const hits = latG().filter(x => x.eq === 'bodyweight' && x.inj && x.inj.region === 'ankle' && x.inj.tier === 'workaround' && x.cfg.seed === 4242);
  const G = hits.length === 1 ? hits[0].cfg : null;
  const cellOK = !!G && G.liftingFocus === 'hypertrophy' && G.experience === 'intermediate' && G.ageBracket === '55+' && G.restDays.join(',') === 'sun,wed' && G.equipment === 'bodyweight';
  cj.push(['c-cell', cellOK, 'LAT_G hits ' + hits.length + (G ? ': ' + [G.equipment, G.liftingFocus, G.injury.region + '/' + G.injury.tier, G.experience, G.ageBracket, 's' + G.seed, G.restDays.join(',')].join(' | ') : '') + ', ruled bodyweight | hypertrophy | ankle/workaround | intermediate | 55+ | s4242 | sun,wed']);
  if(!G){ ['c-w1', 'c-mon9', 'c-noburp', 'c-other', 'c-self', 'c-diff', 'c-inst'].forEach(n => cj.push([n, false, 'no ruled cell'])); row('D197-c', cj); return; }
  // the expected candidate Monday: the typed V230 card minus its one `Chest volume :: Burpees 3×15` section
  const EXP = {}, derBad = [];
  for(const w of MON9){ const c = clone(G_CARD[w]); const idx = c.map((s, i) => (s[0] === SEC_C && JSON.stringify(s[1]) === JSON.stringify([[NAME_C, DETAIL_C]])) ? i : -1).filter(i => i >= 0);
    if(idx.length !== 1) derBad.push('W' + w + ': ' + idx.length + ' typed sections'); else c.splice(idx[0], 1); EXP[w] = c; }
  let C = null, C3 = null, B = null, err = '';
  try { C = twice(ART, G, null); C3 = pinned(ART, CLOCK).buildProgram(clone(G)); } catch(e){ err = 'CRASH ' + String(e && e.message || e).slice(0, 120); }
  if(BF) try { B = twice(BF, G, null); } catch(e){ err += ' V230 CRASH ' + String(e && e.message || e).slice(0, 120); }
  if(!C){ ['c-w1', 'c-mon9', 'c-noburp', 'c-other', 'c-self', 'c-diff'].forEach(n => cj.push([n, false, err])); }
  else {
    const p = C.p, w1 = (p.weeks[1] || {}).mon, w1b = burpees({ weeks:{ 1:{ mon:w1 } } });
    const typedW1 = G_CARD[1].some(s => s[0] === SEC_C && JSON.stringify(s[1]) === JSON.stringify([[NAME_C, DETAIL_C]]));
    cj.push(['c-w1', !!w1 && !w1b.length && typedW1, 'W1 Mon Burpees items on the candidate: ' + w1b.length + (w1b.length ? ' (' + w1b.join('; ') + ')' : '') + '; typed V230 W1 Mon carries ' + SEC_C + ' :: ' + NAME_C + ' ' + DETAIL_C + ': ' + typedW1]);
    let okM = 0; const bM = [];
    for(const w of MON9){ const day = (p.weeks[w] || {}).mon, got = card(day); let why = '';
      if(!day) why = 'no day';
      else if(burpees({ weeks:{ x:{ mon:day } } }).length) why = 'carries Burpees';
      else if(JSON.stringify(got) !== JSON.stringify(EXP[w])) why = cardDiff(got, EXP[w]);
      else if(sha16(dayJ(day)) !== G_DAY[w][1]) why = 'day ' + sha16(dayJ(day)) + ' != V230 typed day minus the section ' + G_DAY[w][1] + ' (another field moved)';
      if(why) bM.push('W' + w + ' ' + why); else okM++; }
    cj.push(['c-mon9', !derBad.length && okM === 9, 'Mondays W1–W3, W5–W7, W9–W11 == the typed V230 card minus ' + SEC_C + ' :: ' + NAME_C + ' ' + DETAIL_C + ', no Burpees: ' + okM + '/9' + (derBad.length ? ' | TYPED TABLE: ' + derBad.join('; ') : '') + (bM.length ? ' | ' + bM.slice(0, 3).join('; ') : '')]);
    const allB = burpees(p);
    cj.push(['c-noburp', !allB.length, 'Burpees items on any candidate day: ' + allB.length + (allB.length ? ' (' + allB.slice(0, 3).join('; ') + ')' : '')]);
    const ws = wkeys(p).length, rh = restSha(p, MON9.map(w => w + ' mon'));
    cj.push(['c-other', ws === G_WEEKS && rh === G_REST, 'weeks ' + ws + ' (typed ' + G_WEEKS + '), every day but the nine Mondays hashes ' + rh + ' (V230 typed ' + G_REST + ')']);
    const clk = C3 ? progDays(C3) === progDays(p) : false;
    cj.push(['c-self', C.self && clk, 'self-identical in two VMs on g215\'s (real) clock: ' + C.self + '; == the build with the clock pinned to ' + CLOCK + ': ' + clk]);
    if(!B) cj.push(['c-diff', false, BF ? 'V230 build failed ' + err : 'no V230 tree: ' + baseWhy]);
    else { const dd = diffDays(p, B.p), want = MON9.map(w => w + ' mon');
      cj.push(['c-diff', B.self && JSON.stringify(dd) === JSON.stringify(want), 'live candidate vs V230 (V230 self-identical ' + B.self + '): differing days [' + dd.join(', ') + '], ruled the nine Mondays']); }
  }
  if(!B) cj.push(['c-inst', false, BF ? 'V230 build failed ' + err : 'no V230 tree: ' + baseWhy]);
  else { const q = B.p; let why = '';
    if(!B.self) why += ' not self-identical;';
    for(const w of MON9){ const day = (q.weeks[w] || {}).mon; if(!day){ why += ' W' + w + ' missing;'; continue; }
      if(JSON.stringify(card(day)) !== JSON.stringify(G_CARD[w])) why += ' W' + w + ' card ' + cardDiff(card(day), G_CARD[w]) + ';';
      else { const h = sha16(dayJ(day)), dd = clone(day), si = dd.sections.findIndex(s => clean(s.label) === SEC_C); if(si >= 0) dd.sections.splice(si, 1);
        const h2 = sha16(dayJ(dd)); if(h !== G_DAY[w][0] || h2 !== G_DAY[w][1]) why += ' W' + w + ' day ' + h + '/' + h2 + ' != typed ' + G_DAY[w].join('/') + ';'; } }
    const rh = restSha(q, MON9.map(w => w + ' mon')); if(rh !== G_REST || wkeys(q).length !== G_WEEKS) why += ' rest ' + rh + ' weeks ' + wkeys(q).length + ';';
    const qb = burpees(q), wantB = MON9.map(w => w + ' mon ' + SEC_C + ' :: ' + NAME_C + ' ' + DETAIL_C);
    if(JSON.stringify(qb) !== JSON.stringify(wantB)) why += ' V230 Burpees items [' + qb.slice(0, 3).join('; ') + '] (' + qb.length + '), ruled exactly the nine Mondays;';
    cj.push(['c-inst', !why, 'V230 baseline self-identical and == the typed Monday cards, day shas, rest sha; its only Burpees are the nine ' + SEC_C + ' :: ' + NAME_C + ' ' + DETAIL_C + ':' + (why || ' yes')]); }
  row('D197-c', cj);
}

// ── ROW D197-L ────────────────────────────────────────────────────────────────────────
// Comment stripper: string-, template- (with ${} nesting) and regex-aware; block comments keep their newlines.
const KW = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'yield', 'await', 'instanceof']);
function stripJS(src){
  let out = '', i = 0, depth = 0, prev = ''; const n = src.length, stack = [];
  const tplBody = () => { while(i < n){ const ch = src[i];
      if(ch === '\\'){ out += src.slice(i, i + 2); i += 2; continue; }
      if(ch === '`'){ out += ch; i++; prev = '0'; return; }
      if(ch === '$' && src[i + 1] === '{'){ out += '${'; i += 2; stack.push(depth); depth++; prev = '('; return; }
      out += ch; i++; } };
  while(i < n){ const c = src[i], d = src[i + 1];
    if(c === '/' && d === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(c === '/' && d === '*'){ const e = src.indexOf('*/', i + 2), j = e < 0 ? n : e + 2; out += ' ' + src.slice(i, j).replace(/[^\n]/g, ''); i = j; continue; }
    if(c === '"' || c === "'"){ let j = i + 1; while(j < n && src[j] !== c && src[j] !== '\n'){ if(src[j] === '\\') j++; j++; } out += src.slice(i, j + 1); i = j + 1; prev = '0'; continue; }
    if(c === '`'){ out += c; i++; tplBody(); continue; }
    if(c === '/'){ const re = prev === '' || (/^[\w$]+$/.test(prev) ? KW.has(prev) : !/[)\]}0]/.test(prev));
      if(re){ let j = i + 1, cls = false; while(j < n && src[j] !== '\n'){ const ch = src[j]; if(ch === '\\'){ j += 2; continue; } if(cls){ if(ch === ']') cls = false; } else if(ch === '[') cls = true; else if(ch === '/') break; j++; }
        j++; while(j < n && /[a-z]/i.test(src[j])) j++; out += src.slice(i, j); i = j; prev = '0'; continue; }
      out += c; i++; prev = c; continue; }
    if(/[\w$]/.test(c)){ let j = i; while(j < n && /[\w$]/.test(src[j])) j++; const w = src.slice(i, j); out += w; i = j; prev = /^[0-9]/.test(w) ? '0' : w; continue; }
    if(/\s/.test(c)){ out += c; i++; continue; }
    if(c === '{'){ depth++; out += c; i++; prev = c; continue; }
    if(c === '}'){ if(stack.length && stack[stack.length - 1] === depth - 1){ stack.pop(); depth--; out += c; i++; tplBody(); continue; } depth--; out += c; i++; prev = c; continue; }
    out += c; i++; prev = c; }
  return out; }
// index of the bracket closing the one at `at` (string-aware; the text is already comment-free)
function closeOf(s, at){ const open = s[at], shut = open === '{' ? '}' : ')'; let k = 0;
  for(let j = at; j < s.length; j++){ const ch = s[j];
    if(ch === '"' || ch === "'" || ch === '`'){ let m = j + 1; while(m < s.length && s[m] !== ch){ if(s[m] === '\\') m++; m++; } j = m; continue; }
    if(ch === open) k++; else if(ch === shut){ k--; if(!k) return j; } }
  return -1; }
const allIdx = (s, re) => { const o = []; let m; const g = new RegExp(re.source, 'g'); while((m = g.exec(s))) o.push({ i:m.index, e:m.index + m[0].length, t:m[0] }); return o; };
function rowL(){
  const cj = [];
  cj.push(['L-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const opens = allIdx(CAND_TEXT, /<script\b[^>]*>/), shuts = allIdx(CAND_TEXT, /<\/script>/);
  const raw = (opens.length === 1 && shuts.length === 1 && shuts[0].i > opens[0].e) ? CAND_TEXT.slice(opens[0].e, shuts[0].i) : null;
  let S = null, instWhy = '';
  if(raw === null) instWhy = '<script> blocks ' + opens.length + ', </script> ' + shuts.length + ' (expected one each)';
  else { S = stripJS(raw);
    try { new vm.Script(raw, { filename:'raw.js' }); } catch(e){ instWhy += 'the raw script does not compile: ' + String(e.message).slice(0, 80) + '; '; }
    try { new vm.Script(S, { filename:'stripped.js' }); } catch(e){ instWhy += 'the stripped script does not compile: ' + String(e.message).slice(0, 80) + '; '; }
    const lc = (S.match(/\n/g) || []).length, lr = (raw.match(/\n/g) || []).length; if(lc !== lr) instWhy += 'line count ' + lc + ' != raw ' + lr + '; '; }
  const CALL_RE = /_day\.sections\s*=\s*applyInjuryFilter\s*\(\s*_day\.sections\s*,\s*cfg\s*\)/;
  const fails = why => ['L-call', 'L-brace', 'L-close', 'L-once', 'L-guard'].forEach(n => { if(!cj.some(x => x[0] === n)) cj.push([n, false, why]); });
  if(!S){ fails('no script text'); cj.push(['L-inst', false, instWhy]); row('D197-L', cj); return; }
  const lineOf = at => S.slice(0, at).split('\n').length + (CAND_TEXT.slice(0, opens[0].e).split('\n').length - 1);
  // L-call: the one call site (the definition `function bodyweightSweep(` is not a call)
  const calls = allIdx(S, /\bbodyweightSweep\s*\(\s*weeks\b/).filter(m => !/\bfunction\s*$/.test(S.slice(Math.max(0, m.i - 20), m.i)));
  cj.push(['L-call', calls.length === 1, 'bodyweightSweep(weeks call sites (comments stripped): ' + calls.length + (calls.length ? ' at line ' + calls.map(m => lineOf(m.i)).join(', ') : '')]);
  const elses = allIdx(S, /else\s*\{\s*unloadableRxSweep\s*\(\s*weeks\s*,\s*cfg\s*\)/);
  if(calls.length !== 1 || elses.length !== 1){ fails('call sites ' + calls.length + ', else { unloadableRxSweep(weeks, cfg) sites ' + elses.length + ' (need one each)'); cj.push(['L-inst', !instWhy, instWhy || 'one <script> block; raw and comment-stripped text both compile; line count kept']); row('D197-L', cj); return; }
  const call = calls[0], els = elses[0];
  // L-brace: the nearest bodyweight `if` before the call opens a brace, and the call is the first thing inside it
  const ifs = allIdx(S.slice(0, call.i), /if\s*\(\s*cfg\.equipment\s*===\s*'bodyweight'\s*\)/), lastIf = ifs[ifs.length - 1];
  const gap = lastIf ? S.slice(lastIf.e, call.i) : null, braced = gap !== null && /^\s*\{\s*$/.test(gap);
  cj.push(['L-brace', braced, lastIf ? 'between `' + lastIf.t + '` (line ' + lineOf(lastIf.i) + ') and the call: ' + JSON.stringify(gap.slice(0, 40)) + (braced ? ' (opens the block)' : ' (no brace: the branch is the bare call)') : 'no if(cfg.equipment===\'bodyweight\') before the call']);
  let open = -1, close = -1;
  if(braced){ open = lastIf.e + gap.indexOf('{'); close = closeOf(S, open); }
  const tail = close > 0 ? S.slice(close + 1, els.i) : null;
  cj.push(['L-close', braced && close > call.i && tail !== null && /^\s*$/.test(tail), braced ? 'the block closes at line ' + (close > 0 ? lineOf(close) : '?') + '; between its } and else { unloadableRxSweep (line ' + lineOf(els.i) + '): ' + JSON.stringify(tail === null ? '(n/a)' : tail.slice(0, 40)) : 'no braced block']);
  // L-once: exactly one whole-day call between the sweep call and the else, and it lies inside the braces
  const occ = allIdx(S, CALL_RE).filter(m => m.i > call.e && m.i < els.i), one = occ.length === 1 ? occ[0] : null;
  const inside = !!one && braced && close > 0 && one.i > open && one.e < close;
  cj.push(['L-once', occ.length === 1 && inside, 'whole-day calls _day.sections=applyInjuryFilter(_day.sections,cfg) between bodyweightSweep( and else { unloadableRxSweep: ' + occ.length + (occ.length ? ' at line ' + occ.map(m => lineOf(m.i)).join(', ') : '') + '; inside the bodyweight braces: ' + inside]);
  // L-guard: the statement holding it opens `if(cfg.injury)` right after the sweep call's `;` and walks every week's days
  let gWhy = 'no single call to inspect';
  if(one){ const pc = closeOf(S, S.indexOf('(', call.i)); const semi = pc > 0 ? S.indexOf(';', pc) : -1;
    const lead = (pc > 0 && semi > 0 && /^\s*$/.test(S.slice(pc + 1, semi))) ? S.slice(semi + 1, one.i) : null;
    const g1 = lead !== null && /^\s*if\s*\(\s*cfg\.injury\s*\)/.test(lead), g2 = lead !== null && /Object\.keys\s*\(\s*weeks\s*\)/.test(lead) && /Object\.keys\s*\(\s*weeks\s*\[/.test(lead);
    gWhy = lead === null ? 'the sweep call is not a `;`-terminated statement' : 'statement after the sweep call opens if(cfg.injury): ' + g1 + '; walks Object.keys(weeks) and Object.keys(weeks[...]): ' + g2 + ' :: ' + JSON.stringify(lead.trim().slice(0, 90));
    cj.push(['L-guard', g1 && g2, gWhy]); }
  else cj.push(['L-guard', false, gWhy]);
  cj.push(['L-inst', !instWhy, instWhy || 'one <script> block; raw and comment-stripped text both compile; line count kept']);
  row('D197-L', cj);
}

const ROWS = { 'D197-a':rowA, 'D197-c':rowC, 'D197-L':rowL };
for(const k of ORDER){ try { ROWS[k](); } catch(e){ P('    ' + k + ' CRASH ' + String(e && e.stack || e).slice(0, 400)); ok(R[k] + ' (crashed)', false); } }
done();
