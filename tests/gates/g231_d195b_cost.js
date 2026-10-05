// g231_d195b_cost.js — GATE for D195 part B (V231): the budget's cost lens is brought to the V100 docstring (cost
// side). `_cost` prices an item at 0.5× when `_isHalf(name)` matches OR the name is a member of EXLIB.hip_stability,
// knee_stability, foot_ankle or foot_ankle_bw. Gate run 6 (builder): rows D195-B-a, D195-B-b, D195-B-c.
//
//   node tests/gates/g231_d195b_cost.js <candidate.html> [baseline_V230.html]
//
// THE RULING THIS DEFENDS (standing ruling 4)
//   tests/measure/v228_rulings/d194_hipext_ruling.md part B ("D194" there reads D195), re-ruled "B exactly as ruled" in
//   tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md. Gate rows: "D195-B rows as the prior ruling (PRT
//   W9 Mon/Tue typed cards, PRT digest `1119727db3f37832`, 0 removals vs `__BUDGET_OFF` on a shard except the typed
//   B-3 cell above)". Ruling text: "This change can only lower a day's total, so it can only make the loop stop earlier;
//   no day loses an item it prints today." Diff classes (final list, re-ruling):
//     B-1 items present in V230's `__BUDGET_OFF` build now print;
//     B-2 `Landmine rotational press 3×15 → 2×15` on loaded prevention W3 Push;
//     B-3 a restored superset member crossing a fixed station re-picks its partner, same label, same pattern (1:
//         knee/workaround | commercial | balanced | race | intermediate | s1234 | sat,sun W7 wed, `Leg superset B`
//         `Barbell good mornings` → `Dumbbell split-stance deadlift` beside the restored `Glute-ham raise`).
//   D-code D195 (B), ships on ia-version 231. B moves no HALF_MANNY byte (B-alone 0ac7da6b1691a8e1, byte-identical
//   weeks); HALF_MANNY's era row is D195-A-a's (tests/gates/g231_d195_hipext.js), not this gate's.
//
// VERSION PREDICATE (standing rulings 2 and 4). Every row RUNS on every tree; `VER >= 231` (VER = the candidate's
//   ia-version meta) is the first conjunct of every row. A tree below 231 is never skipped: its rows FAIL by their own
//   conjuncts as well as by the predicate. On V230 as candidate the expected failures are: D195-B-a version, the PRT
//   digest (3a053a2ac8cb2b44, not 1119727db3f37832), both W9 after-cards (V230 prints the before-cards), the cell count
//   (0 of 77, not 9) and the B-alone counterfactual's candidate-carries-the-surgery sub-conjunct; D195-B-b version and
//   b-surgery (the slice 1 replacement text is absent from the candidate); D195-B-c version and c-cfB (same presence
//   check). The B-alone tree itself is built from the BASELINE text either way, so its figures are the same on both runs.
//
// PRESENTATION. Every build runs with the clock pinned to 2026-08-24 12:00 (the coach's surgery clock; PRT TING and the
//   lattice are clock-independent at these cfgs, builder probe 2026-10-04: PRT digests equal on the live and pinned
//   clocks). PRT and HALF_MANNY are built twice, each in a fresh VM, and must equal themselves before anything is
//   compared. Digests are the harness's progDigest (clock fields and the universe stripped). A day cell is compared by
//   M15's daySig (live sections: label, coreHeader, rounds, superset flag, [name, detail] per item, html stripped).
//
// ORACLES. Nothing below asks the candidate's engine what the answer should be.
//   LITERAL       the ruling's digests: PRT on the candidate 1119727db3f37832 (B = whole V231), PRT on V230
//                 3a053a2ac8cb2b44, HALF_MANNY B-alone 0ac7da6b1691a8e1; the ruling's "PRT cells changed 9 of 77";
//                 the ruling's W9 Tue before/after cards and W9 Mon after ("`Conditioning :: Burpees 3×12` comes back; no
//                 core item comes back"), encoded as the structural specs RULE_* below from the ruling's own text.
//   TYPED CARDS   CARD_TUE_231 / CARD_MON_231 / CARD_TUE_230 / CARD_MON_230 are M15's printed cards
//                 (tests/measure/v231_hipext.out.txt lines 291–321: rows "B" and "V"), checked against the ruling's
//                 after-card text above element by element before typing (Front squat 4×3; Leg superset A (SS 3)
//                 Bulgarian + Terminal knee extension (band) 3×25 sec; Leg superset B (SS 3) KB single-leg deadlift +
//                 45° back extension 3 sets — RPE 8; Hip stability ×3; Foot & ankle ×2; Overhead carry 3×40 yards each);
//                 one candidate build by builder gate run 6 (2026-10-04) reproduced them.
//   PRT CFG       copied verbatim from M15 (tests/measure/v231_hipext.js `base` + `PRT`).
//   SHARD (B-b)   M15's FULL lattice constructor verbatim (tests/measure/v231_hipext.js lattice(), == coach's mk()):
//                 foci support_prevention + support_athletic (PRT's focus) + balanced (the B-3 cell's focus), three
//                 families, six tiers, three experiences, seeds 87747 and 76308 (SEEDS index 0 and 1, so the family goal
//                 index (si + ei) is M15's), both rests = 648 cfgs; plus the typed B-3 cell (coach's INJ cfg, mk with
//                 si = 2 → s1234, ri = 1 → sat,sun, ei = 1) and the typed B-2 cell M15 printed
//                 (tests/measure/v231_hipext.out.txt:1309, FULL support_prevention | race | commercial | intermediate |
//                 s1234 | sun,wed W3 tue `Landmine rotational press [3×15 each] -> [2×15 each]`). 650 cfgs.
//                 The B-1 oracle is V230's own `__BUDGET_OFF` build of the same cfg (the ruling names that build as the
//                 class's reference): an added item must appear in that day's budget-off card. The switch is
//                 `globalThis.__BUDGET_OFF` at capSessionBudget's head (index.html :10576, read 2026-10-04); conjunct
//                 b-bo proves it is live (budget-off differs from the shipped V230 build on some cell). The B-3
//                 pattern oracle is M15's hand classifier C2 (verbatim from v228_hip_volume.js), never `_pattern`.
//   COUNTERFACTUAL  in-gate source surgery on the BASELINE text: B-alone = V230 + slice 1's one replacement
//                 (tests/edits/v231_s1_d195b_cost.py), typed below. The anchor is asserted count == 1 on the V230 text
//                 and the replacement text count == 1 in the CANDIDATE (the surgery is the candidate's own code, so on a
//                 tree that lacks it the conjunct FAILS by name); a miss is a FAIL, never a skip.
//
// ROWS
//   D195-B-a  a-ver, a-digest, a-tue, a-mon, a-cells, a-cfB, a-v230, a-before.
//   D195-B-b  b-ver, b-surgery, b-self, b-bo, b-built, b-nonempty, b-removed, b-B3, b-added, b-detail, b-B2, b-other.
//   D195-B-c  c-ver, c-cfB, c-bytes, c-inst.
//
// Temp files: the B-alone tree and (if needed) the git copy of V230 go under os.tmpdir() (the runner sets TMPDIR to its
//   scratch path) and are removed on exit.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const { load, fixtures, progDigest, DAYS } = H;

const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEFILE = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ERA = 231, BASE_ERA = 230, V230_COMMIT = '71c76d8';
const CLOCK = '2026-08-24';

// ── LITERALS FROM THE RULING ──────────────────────────────────────────────────────────────────────────────────────
const DIG_PRT_231 = '1119727db3f37832';   // PRT TING, B = whole V231
const DIG_PRT_230 = '3a053a2ac8cb2b44';   // PRT TING on V230
const DIG_MANNY_BALONE = '0ac7da6b1691a8e1';  // HALF_MANNY, B alone (== V230, byte-identical weeks)
const DIG_MANNY_230 = '0ac7da6b1691a8e1';
const PRT_CELLS_CHANGED = 9, PRT_CELLS = 77;

// ── PRT TING cfg (verbatim from tests/measure/v231_hipext.js) ──────────────────────────────────────────────────────
const base = { primaryPath:'event', cardioTypes:['run'], eventTargeted:true, experience:'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185 };
const PRT = Object.assign({}, base, { name:'PRT TING', liftingFocus:'support_athletic', raceDate:'2026-10-20', seed:87747,
  cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'10', targetSecs:'30' } } });

// ── TYPED CARDS (M15 tests/measure/v231_hipext.out.txt:291–321; see header) ─────────────────────────────────────────
const HIP_LINE = 'Hip stability :: Seated banded hip flexion 2×15 each | Hip airplane (light KB) 2×6 each, slow | Weighted 90/90 hip switch 2×6 each';
const FA_LINE = 'Foot & ankle :: Tibialis raise (wall lean) 2×20 | Standing ankle CARs 2×5 each direction';
const FSQ_LINE = 'Main — Front squat :: Front squat 4×3 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const CARD_TUE_231 = [
  FSQ_LINE,
  'Leg superset A (SS 3) :: Dumbbell Bulgarian split squat 3×8–12 each @ RPE 8 | Terminal knee extension (band) 3×25 sec',
  'Leg superset B (SS 3) :: Kettlebell single-leg deadlift 3×6–10 @ RPE 8 | 45° back extension 3 sets — RPE 8 (stop 2 reps short of failure)',
  HIP_LINE, FA_LINE,
  'Loaded carry finisher :: Overhead carry 3×40 yards each, heavy',
];
const CARD_TUE_230 = [
  FSQ_LINE,
  'Leg superset A :: Dumbbell Bulgarian split squat 3×8–12 each @ RPE 8',
  'Leg superset B :: Kettlebell single-leg deadlift 3×6–10 @ RPE 8',
  HIP_LINE, FA_LINE,
];
const INC_LINE = 'Main — Incline barbell press :: Incline barbell press 4×3 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest | Barbell overhead press 3×6–10 @ RPE 8';
const CK_LINE = 'Chest + knee (SS 3) :: Dumbbell incline press 3×10–15 @ RPE 8 | Terminal knee extension (band) 3×25 sec';
const CORE_LINE = 'Core — Anti-Rotation :: Bird dogs 3×12 each';
const CARD_MON_231 = [INC_LINE, 'Conditioning :: Burpees 3×12', CK_LINE, CORE_LINE];
const CARD_MON_230 = [INC_LINE, CK_LINE, CORE_LINE];

// ── RULING-TEXT SPECS (structural, from the ruling's before/after card text; independent of the typed cards) ─────────
//   sec: { re: label, ss: rounds (a superset with these rounds) | false (not a superset) | undefined (either),
//          k: item count | undefined, has: [[name, detail regex]] }
const RULE_TUE_231 = { n:6, secs:[
  { re:/^Main — Front squat$/, k:1, has:[['Front squat', /^4×3\b/]] },
  { re:/^Leg superset A$/, ss:3, k:2, has:[['Dumbbell Bulgarian split squat', /^3×/], ['Terminal knee extension (band)', /^3×25 sec/]] },
  { re:/^Leg superset B$/, ss:3, k:2, has:[['Kettlebell single-leg deadlift', /^3×/], ['45° back extension', /^3 sets — RPE 8/]] },
  { re:/^Hip stability$/, k:3, has:[] },
  { re:/^Foot & ankle$/, k:2, has:[] },
  { re:/carry/i, k:1, has:[['Overhead carry', /^3×40 yards each/]] } ], none:[] };
const RULE_TUE_230 = { n:5, secs:[
  { re:/^Main — Front squat$/, k:1, has:[['Front squat', /^4×3 — RPE 8\.5/]] },
  { re:/^Leg superset A$/, ss:false, k:1, has:[['Dumbbell Bulgarian split squat', /^3×8–12 each/]] },
  { re:/^Leg superset B$/, ss:false, k:1, has:[['Kettlebell single-leg deadlift', /^3×6–10/]] },
  { re:/^Hip stability$/, k:3, has:[] },
  { re:/^Foot & ankle$/, k:2, has:[] } ], none:[/^Terminal knee extension/, /^45° back extension$/, /carry/i] };
// Mon after: the Burpees come back; no core item comes back (the core block is V230's one item)
const RULE_MON_231 = { secs:[
  { re:/^Conditioning$/, k:1, has:[['Burpees', /^3×12$/]] },
  { re:/^Core — /, k:1, has:[['Bird dogs', /^3×12 each$/]] } ], none:[] };
const RULE_MON_230 = { secs:[ { re:/^Core — /, k:1, has:[['Bird dogs', /^3×12 each$/]] } ], none:[/^Burpees$/] };

// ── SURGERY TEXT (typed from tests/edits/v231_s1_d195b_cost.py; old -> new) ────────────────────────────────────────
const S1 = [
  ['s1 B _cost membership',
   "  const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return _isHalf(it.name)?s*0.5:s; };",
   "  const _prehabHalf=new Set([].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw)); const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return (_isHalf(it.name)||_prehabHalf.has(it.name))?s*0.5:s; };"],
];
const BO_SWITCH = "if(typeof globalThis!=='undefined' && (globalThis.__CAP_OFF || globalThis.__BUDGET_OFF)) return sections;";

// ── SHARD (M15's FULL lattice constructor, verbatim; see header) ────────────────────────────────────────────────────
const FAM = { race:[['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]], test:[['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]], none:[[null,{}]] };
const TIERS = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const EXPS = ['beginner','intermediate','advanced'], SEEDS = [87747, 76308, 1234, 4242], RESTS = [['sun','wed'],['sat','sun']];
function mk(f, fam, eq, ei, si, ri, inj){ const g = FAM[fam][(si + ei) % FAM[fam].length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: g[0] ? ['run'] : [], cardioGoals: g[0] ? { run: Object.assign({ id:g[0], label:g[0], mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' }, g[1]) } : {},
    eventTargeted:false, liftingFocus:f, experience:EXPS[ei], ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:RESTS[ri].slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si] };
  if(inj) c.injury = inj; return c; }
const SH_FOCI = ['support_prevention', 'support_athletic', 'balanced'], SH_SEEDI = [0, 1];
// B-3 typed cell and op (the re-ruling's class text; card printed by coach, tests/measure/v231_coach2_surgery.cards3.out.txt:294–311)
const B3 = { tag:'B3 INJ knee/workaround|commercial|balanced|race|intermediate|s1234|sat,sun', c:mk('balanced', 'race', 'commercial', 1, 2, 1, { region:'knee', tier:'workaround' }),
  w:'7', d:'wed', label:'Leg superset B', gone:'Barbell good mornings', partner:'Dumbbell split-stance deadlift', restored:'Glute-ham raise' };
// B-2 typed cell (M15 printed, tests/measure/v231_hipext.out.txt:1309)
const B2 = { tag:'B2 FULL support_prevention|race|commercial|intermediate|s1234|sun,wed', c:mk('support_prevention', 'race', 'commercial', 1, 2, 0, null), w:'3', d:'tue' };
const B2_NAME = 'Landmine rotational press', B2_FROM = '3×15 each', B2_TO = '2×15 each';
// M15's hand classifier C2 (hinge), verbatim from v228_hip_volume.js
const C2 = /deadlift|\brdl\b|good morning|swing|back extension|glute-ham|\bghr\b|ghd|hip hinge|kettlebell clean|power clean|hang clean|snatch|nordic/i;

// ── HELPERS ─────────────────────────────────────────────────────────────────────────────────────────────────────
const clone = o => JSON.parse(JSON.stringify(o));
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const dayJ = day => JSON.stringify(day || null, (k, v) => (k === 'id' || k === 'created') ? undefined : v);
const liveSecs = day => (day && !day.rest && day.sections || []).filter(s => (s.items || []).length);
const daySig = day => JSON.stringify(liveSecs(day).map(s => [s.label || '', s.coreHeader || '', s.rounds || '', !!s.superset, s.items.map(it => [clean(it.name), clean(it.detail || '')])]));
const cardLines = day => liveSecs(day).map(s => clean(s.label || s.coreHeader || '') + (s.superset ? ' (SS ' + (s.rounds || '') + ')' : '') + ' :: ' + s.items.map(it => clean(it.name) + ' ' + clean(it.detail || '')).join(' | '));
const itemsOf = day => { const o = []; liveSecs(day).forEach(s => s.items.forEach(it => { if(it && it.name) o.push([clean(it.name), clean(it.detail || ''), clean(s.label || s.coreHeader || '')]); })); return o; };
const msetDiff = (a, b) => { const m = {}; a.forEach(x => m[x] = (m[x] || 0) + 1); b.forEach(x => { if(m[x]) m[x]--; }); const o = []; Object.keys(m).forEach(k => { for(let i = 0; i < m[k]; i++) o.push(k); }); return o; };  // a minus b
const wkeys = p => Object.keys((p && p.weeks) || {}).sort((a, b) => a - b);
function specMiss(day, spec){   // the ruling-text spec against one day -> list of misses
  const secs = liveSecs(day).map(s => ({ lab:clean(s.label || s.coreHeader || ''), ss:!!s.superset, rounds:s.rounds, it:s.items.map(i => [clean(i.name), clean(i.detail || '')]) }));
  const miss = [];
  if(spec.n !== undefined && secs.length !== spec.n) miss.push(secs.length + ' live sections, ruled ' + spec.n);
  for(const r of spec.secs){ const s = secs.find(x => r.re.test(x.lab)); if(!s){ miss.push('no section ' + r.re); continue; }
    if(r.ss === false && s.ss) miss.push(s.lab + ' is a superset');
    if(typeof r.ss === 'number' && !(s.ss && +s.rounds === r.ss)) miss.push(s.lab + ' not a superset of ' + r.ss + ' rounds');
    if(r.k !== undefined && s.it.length !== r.k) miss.push(s.lab + ' ' + s.it.length + ' items, ruled ' + r.k);
    for(const [n, dre] of r.has){ const i = s.it.find(x => x[0] === n); if(!i) miss.push(s.lab + ' lacks ' + n); else if(!dre.test(i[1])) miss.push(s.lab + ' ' + n + ' detail ' + i[1]); } }
  for(const re of spec.none){ const hit = secs.find(s => re.test(s.lab) || s.it.some(i => re.test(i[0]))); if(hit) miss.push('carries ' + re + ' (' + hit.lab + ')'); }
  return miss; }
const TMPS = [];
process.on('exit', () => TMPS.forEach(f => { try { fs.unlinkSync(f); } catch(e){} }));
function tmpWrite(tag, text){ const f = path.join(os.tmpdir(), 'g231_d195b_' + tag + '_' + process.pid + '.html'); fs.writeFileSync(f, text); TMPS.push(f); return f; }
function pinned(file){   // a fresh VM with the clock pinned to CLOCK 12:00 (new Date() and Date.now())
  const X = load(file); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  X.ctx.Date = FD; return X; }
function twice(file, cfg){   // cfg built in two fresh VMs: {prog, dig, self, dig2}
  const p1 = pinned(file).buildProgram(clone(cfg)), p2 = pinned(file).buildProgram(clone(cfg));
  const d1 = progDigest(p1), d2 = progDigest(p2); return { prog:p1, dig:d1, self:d1 === d2, dig2:d2 }; }
function surgery(text, reps, candText){   // -> {text, ok, why}
  let t = text; const why = [];
  for(const [tag, oldS, newS] of reps){
    const n = t.split(oldS).length - 1; if(n !== 1){ why.push(tag + ': anchor count ' + n + ' on the V230 text'); continue; }
    t = t.replace(oldS, () => newS);
    const c = candText.split(newS).length - 1; if(c !== 1) why.push(tag + ': replacement text count ' + c + ' in the candidate (expected 1)');
  }
  return { text:t, ok:!why.length, why }; }
const eqA = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── PLUMBING ────────────────────────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const R = {
  'D195-B-a': 'row D195-B-a (D195 B, VER >= 231) PRT TING s87747: digest 1119727db3f37832 (V230 3a053a2ac8cb2b44); W9 Tue after-card carries the TKE, the 45° back extension and the Overhead carry; W9 Mon carries Conditioning :: Burpees 3×12, no core item back; 9 of 77 day cells differ from V230; B alone == the candidate',
  'D195-B-b': 'row D195-B-b (D195 B, VER >= 231) shard, B alone vs V230: 0 items removed except the typed B-3 re-pick; every added item is in the same cfg\'s V230 __BUDGET_OFF build (B-1); detail changes within B-2 (Landmine rotational press 3×15 each -> 2×15 each, loaded prevention W3); no other change',
  'D195-B-c': 'row D195-B-c (D195 B, VER >= 231) HALF_MANNY: B alone 0ac7da6b1691a8e1, weeks byte-identical to V230',
};
const ORDER = ['D195-B-a', 'D195-B-b', 'D195-B-c'];
function row(key, cj){ cj.forEach(([n, c, d]) => P('    ' + key + ' ' + n + ' ' + (c ? 'ok' : 'FAIL') + ' :: ' + d));
  const bad = cj.filter(x => !x[1]).map(x => x[0]); ok(R[key], !bad.length, bad.length ? 'failing conjuncts: ' + bad.join(', ') : cj.length + '/' + cj.length + ' conjuncts'); }

// ── LOAD + VERSION ──────────────────────────────────────────────────────────────────────────────────────────────
let VER = NaN, CAND_TEXT = '';
try { const IA = load(ART); VER = +IA.version; CAND_TEXT = fs.readFileSync(ART, 'utf8'); }
catch(e){ P('FAIL boot: ' + String(e && e.message || e).slice(0, 200)); fail++; ORDER.forEach(k => ok(R[k] + ' (candidate did not boot)', false)); done(); }
P('g231 D195 part B (the cost lens) | candidate ' + ART + ' ia-version ' + VER + (VER >= ERA ? '' : ' (below ' + ERA + ': every row runs and must FAIL by its own conjuncts)'));
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
// the B-alone tree (baseline + slice 1), shared by all three rows
let SB = null, BALONE = null;
if(BF){ SB = surgery(BASE_TEXT, S1, CAND_TEXT); const n = SB.text.split(S1[0][2]).length - 1; if(n === 1) BALONE = tmpWrite('balone', SB.text); }
P('  B-alone tree: ' + (BALONE ? 'built (V230 + slice 1)' + (SB.ok ? '' : ', but SURGERY: ' + SB.why.join('; ')) : 'NOT BUILT' + (SB ? ' (' + SB.why.join('; ') + ')' : ' (no V230 tree)')));

// ── ROW D195-B-a ────────────────────────────────────────────────────────────────────────────────────────────────
function rowBa(){
  const cj = [];
  cj.push(['a-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const C = twice(ART, PRT), p = C.prog;
  cj.push(['a-digest', C.self && C.dig === DIG_PRT_231, 'candidate PRT TING ' + C.dig + (C.self ? ' (self-identical in two VMs)' : ' (NOT self-identical: ' + C.dig2 + ')') + ', weeks ' + wkeys(p).length + ', ruled ' + DIG_PRT_231]);
  const tue = (p.weeks[9] || {}).tue, mon = (p.weeks[9] || {}).mon;
  const tl = cardLines(tue), ml = cardLines(mon), tm = specMiss(tue, RULE_TUE_231), mm = specMiss(mon, RULE_MON_231);
  cj.push(['a-tue', eqA(tl, CARD_TUE_231) && !tm.length, 'W9 Tue == CARD_TUE_231 ' + eqA(tl, CARD_TUE_231) + (eqA(tl, CARD_TUE_230) ? ' (reads CARD_TUE_230)' : '') + ', ruling spec ' + (tm.length ? 'MISSES: ' + tm.join('; ') : 'holds (TKE, 45° back extension, Overhead carry printed; 6 sections)') + (eqA(tl, CARD_TUE_231) ? '' : ' | card: ' + tl.join(' || '))]);
  cj.push(['a-mon', eqA(ml, CARD_MON_231) && !mm.length, 'W9 Mon == CARD_MON_231 ' + eqA(ml, CARD_MON_231) + (eqA(ml, CARD_MON_230) ? ' (reads CARD_MON_230)' : '') + ', ruling spec ' + (mm.length ? 'MISSES: ' + mm.join('; ') : 'holds (Conditioning :: Burpees 3×12; core block Bird dogs only)') + (eqA(ml, CARD_MON_231) ? '' : ' | card: ' + ml.join(' || '))]);
  if(!BF){ ['a-cells', 'a-cfB', 'a-v230', 'a-before'].forEach(n => cj.push([n, false, 'no V230 tree: ' + baseWhy])); row('D195-B-a', cj); return; }
  const B = twice(BF, PRT), q = B.prog;
  let n = 0, t = 0; const L = [];
  wkeys(q).forEach(w => DAYS.forEach(d => { t++; if(daySig(q.weeks[w][d]) !== daySig(p.weeks[w] && p.weeks[w][d])){ n++; L.push('W' + w + ' ' + d); } }));
  cj.push(['a-cells', B.self && C.self && t === PRT_CELLS && n === PRT_CELLS_CHANGED, 'PRT day cells V230 -> candidate differing ' + n + '/' + t + ' (ruled ' + PRT_CELLS_CHANGED + '/' + PRT_CELLS + ')' + (L.length ? ': ' + L.join(', ') : '')]);
  let d = '(not built)', self = false;
  if(BALONE){ try { const M = twice(BALONE, PRT); d = M.dig; self = M.self; } catch(e){ d = 'CRASH ' + String(e && e.message || e).slice(0, 120); } }
  cj.push(['a-cfB', !!(SB && SB.ok) && self && d === DIG_PRT_231, 'B alone = V230 + slice 1: PRT ' + d + (self ? ' (self-identical)' : ' (not self-identical)') + ', ruled ' + DIG_PRT_231 + ' (B = whole V231)' + (SB && !SB.ok ? ' | SURGERY: ' + SB.why.join('; ') : '')]);
  cj.push(['a-v230', B.self && B.dig === DIG_PRT_230, 'V230 baseline PRT TING ' + B.dig + (B.self ? ' (self-identical in two VMs)' : ' (NOT self-identical: ' + B.dig2 + ')') + ', ruled ' + DIG_PRT_230]);
  const bt = (q.weeks[9] || {}).tue, bm = (q.weeks[9] || {}).mon, btm = specMiss(bt, RULE_TUE_230), bmm = specMiss(bm, RULE_MON_230);
  const e1 = eqA(cardLines(bt), CARD_TUE_230), e2 = eqA(cardLines(bm), CARD_MON_230);
  cj.push(['a-before', e1 && e2 && !btm.length && !bmm.length, 'V230 baseline W9 Tue == CARD_TUE_230 ' + e1 + ' (ruling spec ' + (btm.length ? 'MISSES: ' + btm.join('; ') : 'holds: TKE, 45° back extension and carry trimmed') + '), W9 Mon == CARD_MON_230 ' + e2 + ' (ruling spec ' + (bmm.length ? 'MISSES: ' + bmm.join('; ') : 'holds: no Burpees') + ')']);
  row('D195-B-a', cj);
}

// ── ROW D195-B-b ────────────────────────────────────────────────────────────────────────────────────────────────
function rowBb(){
  const cj = [];
  cj.push(['b-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  cj.push(['b-surgery', !!(SB && SB.ok && BALONE), SB ? (SB.ok ? 'slice 1 anchor count 1 on V230, replacement text count 1 in the candidate' : 'SURGERY: ' + SB.why.join('; ')) : 'no V230 tree: ' + baseWhy]);
  if(!BF || !BALONE){ ['b-self', 'b-bo', 'b-built', 'b-nonempty', 'b-removed', 'b-B3', 'b-added', 'b-detail', 'b-B2', 'b-other'].forEach(n => cj.push([n, false, 'no V230 / B-alone tree'])); row('D195-B-b', cj); return; }
  const LAT = [];
  for(const f of SH_FOCI) for(const fam of Object.keys(FAM)) for(const eq of TIERS) for(let ei = 0; ei < 3; ei++) for(const si of SH_SEEDI) for(let ri = 0; ri < 2; ri++)
    LAT.push({ tag:'FULL ' + [f, fam, eq, EXPS[ei], 's' + SEEDS[si], RESTS[ri].join(',')].join('|'), c:mk(f, fam, eq, ei, si, ri, null) });
  const nShard = LAT.length; LAT.push(B3, B2);
  // one VM per tree; the budget-off VM sets the switch once and never clears it
  const XV = pinned(BF), XO = pinned(BF), XB = pinned(BALONE), XV2 = pinned(BF), XB2 = pinned(BALONE);
  XO.eval('globalThis.__BUDGET_OFF=true;');
  const swN = BASE_TEXT.split(BO_SWITCH).length - 1;
  let built = 0, crashed = 0, cells = 0, live = 0, changed = 0, added = 0, addedBO = 0, boDiff = 0, selfN = 0, selfEq = 0;
  const removed = [], novel = [], details = [], other = [], crashes = []; let b3 = null, b2hit = 0, b2N = 0;
  LAT.forEach((r, i) => {
    let a, o, b;
    try { a = XV.buildProgram(clone(r.c)); o = XO.buildProgram(clone(r.c)); b = XB.buildProgram(clone(r.c)); } catch(e){ crashed++; crashes.push(r.tag + ': ' + String(e && e.message || e).slice(0, 80)); return; }
    built++;
    if(i % 8 === 0 || r === B3 || r === B2){ selfN++; if(progDigest(a) === progDigest(XV2.buildProgram(clone(r.c))) && progDigest(b) === progDigest(XB2.buildProgram(clone(r.c)))) selfEq++; }
    wkeys(a).forEach(w => DAYS.forEach(d => {
      const da = a.weeks[w][d], db = b.weeks[w] && b.weeks[w][d], dbo = o.weeks[w] && o.weeks[w][d]; cells++;
      if(liveSecs(da).length) live++;
      if(daySig(da) !== daySig(dbo)) boDiff++;
      if(daySig(da) === daySig(db)) return; changed++;
      const ia = itemsOf(da), ib = itemsOf(db), na = ia.map(x => x[0]), nb = ib.map(x => x[0]), nbo = itemsOf(dbo).map(x => x[0]);
      const rem = msetDiff(na, nb), add = msetDiff(nb, na);
      rem.forEach(n => removed.push({ tag:r.tag, r, w, d, n, lab:(ia.find(x => x[0] === n) || [])[2], card:{ a:cardLines(da), b:cardLines(db), bo:cardLines(dbo) } }));
      add.forEach(n => { added++; if(nbo.includes(n)) addedBO++; else novel.push(r.tag + ' W' + w + ' ' + d + ': ' + n); });
      let dd = 0;
      [...new Set(na.filter(n => nb.includes(n)))].forEach(n => { const x = ia.filter(z => z[0] === n).map(z => z[1]).sort(), y = ib.filter(z => z[0] === n).map(z => z[1]).sort();
        if(!eqA(x, y)){ dd++; const isB2 = n === B2_NAME && eqA(x, [B2_FROM]) && eqA(y, [B2_TO]) && w === '3' && r.c.liftingFocus === 'support_prevention' && r.c.equipment !== 'bodyweight';
          details.push({ s:r.tag + ' W' + w + ' ' + d + ': ' + n + ' ' + JSON.stringify(x) + ' -> ' + JSON.stringify(y), isB2 }); if(isB2) b2N++;
          if(isB2 && r === B2 && w === B2.w && d === B2.d) b2hit++; } });
      if(!rem.length && !add.length && !dd) other.push(r.tag + ' W' + w + ' ' + d);
      if(r === B3 && w === B3.w && d === B3.d) b3 = { a:ia, b:ib, bo:itemsOf(dbo), rem, add };
    }));
  });
  cj.push(['b-self', selfN > 0 && selfEq === selfN, 'V230 and B alone each equal themselves (second fresh VM) on ' + selfEq + '/' + selfN + ' sampled cfgs (every 8th + the B-3 and B-2 cells)']);
  cj.push(['b-bo', swN === 1 && boDiff > 0, '__BUDGET_OFF switch text count ' + swN + ' in the V230 text; V230 budget-off differs from V230 on ' + boDiff + '/' + cells + ' day cells (the pin is live)']);
  cj.push(['b-built', built === LAT.length && !crashed && LAT.length === 650, 'cfgs ' + LAT.length + ' (shard ' + nShard + ' = 3 foci × 3 families × 6 tiers × 3 experiences × 2 seeds × 2 rests, + B-3 cell + B-2 cell), built on three trees ' + built + ', crashed ' + crashed + (crashes.length ? ' | ' + crashes.slice(0, 3).join('; ') : '')]);
  cj.push(['b-nonempty', changed > 0 && added > 0, 'denominators: day cells ' + cells + ' (live ' + live + '), changed V230 -> B alone ' + changed + ', items added ' + added + ', removed ' + removed.length + ', detail changes ' + details.length + ' (an empty diff is a failure)']);
  const remOK = removed.length === 1 && removed[0].r === B3 && removed[0].w === B3.w && removed[0].d === B3.d && removed[0].n === B3.gone && removed[0].lab === B3.label;
  cj.push(['b-removed', remOK, 'items removed from any day ' + removed.length + ' (ruled: exactly the typed B-3 op, ' + B3.tag + ' W' + B3.w + ' ' + B3.d + ' [' + B3.label + '] ' + B3.gone + ')' + (removed.length ? ': ' + removed.slice(0, 4).map(x => x.tag + ' W' + x.w + ' ' + x.d + ' [' + x.lab + '] ' + x.n).join('; ') : '')]);
  // B-3: same label, same pattern (hand C2), the partner re-picked beside the restored Glute-ham raise, which V230's budget-off prints
  let b3ok = false, b3why = 'cell W' + B3.w + ' ' + B3.d + ' unchanged or absent';
  if(b3){ const secA = b3.a.filter(x => x[2] === B3.label).map(x => x[0]), secB = b3.b.filter(x => x[2] === B3.label).map(x => x[0]);
    b3ok = eqA(b3.rem, [B3.gone]) && eqA(secA, [B3.gone]) && eqA(secB.slice().sort(), [B3.partner, B3.restored].sort()) && C2.test(B3.gone) && C2.test(B3.partner) && b3.bo.map(x => x[0]).includes(B3.restored);
    b3why = 'V230 [' + B3.label + '] ' + JSON.stringify(secA) + ' -> B alone [' + B3.label + '] ' + JSON.stringify(secB) + '; removed ' + JSON.stringify(b3.rem) + ', added ' + JSON.stringify(b3.add) + '; hinge (C2) ' + C2.test(B3.gone) + '/' + C2.test(B3.partner) + '; ' + B3.restored + ' in V230 budget-off ' + b3.bo.map(x => x[0]).includes(B3.restored); }
  cj.push(['b-B3', b3ok, B3.tag + ': ' + b3why]);
  cj.push(['b-added', added > 0 && addedBO === added && !novel.length, 'items added ' + added + ', present in the same day of V230\'s __BUDGET_OFF build ' + addedBO + '/' + added + ', not present ' + novel.length + (novel.length ? ': ' + novel.slice(0, 4).join('; ') : '')]);
  const badDet = details.filter(x => !x.isB2);
  cj.push(['b-detail', !badDet.length, 'detail changes ' + details.length + ', B-2 (' + B2_NAME + ' ' + B2_FROM + ' -> ' + B2_TO + ', loaded prevention W3) ' + b2N + ', outside B-2 ' + badDet.length + (badDet.length ? ': ' + badDet.slice(0, 4).map(x => x.s).join('; ') : '')]);
  cj.push(['b-B2', b2hit === 1, B2.tag + ' W' + B2.w + ' ' + B2.d + ': ' + B2_NAME + ' ' + B2_FROM + ' -> ' + B2_TO + ' ' + (b2hit === 1 ? 'present' : 'ABSENT (' + b2hit + ')')]);
  cj.push(['b-other', !other.length, 'changed cells with no item added, removed or re-detailed ' + other.length + (other.length ? ': ' + other.slice(0, 4).join('; ') : '')]);
  row('D195-B-b', cj);
}

// ── ROW D195-B-c ────────────────────────────────────────────────────────────────────────────────────────────────
function rowBc(){
  const cj = [];
  cj.push(['c-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  if(!BF || !BALONE){ ['c-cfB', 'c-bytes', 'c-inst'].forEach(n => cj.push([n, false, 'no V230 / B-alone tree: ' + baseWhy])); row('D195-B-c', cj); return; }
  const M = twice(BALONE, fixtures.HALF_MANNY), V = twice(BF, fixtures.HALF_MANNY);
  cj.push(['c-cfB', SB.ok && M.self && M.dig === DIG_MANNY_BALONE, 'B alone = V230 + slice 1: HALF_MANNY ' + M.dig + (M.self ? ' (self-identical in two VMs)' : ' (NOT self-identical: ' + M.dig2 + ')') + ', ruled ' + DIG_MANNY_BALONE + (SB.ok ? '' : ' | SURGERY: ' + SB.why.join('; '))]);
  const wa = wkeys(M.prog), wb = wkeys(V.prog); let same = 0, n = 0; const bad = [];
  wb.forEach(w => DAYS.forEach(d => { n++; if(dayJ(M.prog.weeks[w] && M.prog.weeks[w][d]) === dayJ(V.prog.weeks[w][d])) same++; else bad.push('W' + w + ' ' + d); }));
  const wholeEq = dayJ(M.prog.weeks) === dayJ(V.prog.weeks);
  cj.push(['c-bytes', M.self && V.self && wholeEq && eqA(wa, wb) && same === n && n === 98, 'B alone HALF_MANNY weeks JSON (id/created stripped) == V230 ' + wholeEq + '; day cells equal ' + same + '/' + n + (bad.length ? ' | differ: ' + bad.slice(0, 6).join(', ') : '')]);
  cj.push(['c-inst', V.self && V.dig === DIG_MANNY_230, 'V230 baseline HALF_MANNY ' + V.dig + (V.self ? ' (self-identical in two VMs)' : ' (NOT self-identical: ' + V.dig2 + ')') + ', ruled ' + DIG_MANNY_230]);
  row('D195-B-c', cj);
}

// ── RUN (a crashing row FAILS by name; the summary always prints) ─────────────────────────────────────────────────
for(const [k, f] of [['D195-B-a', rowBa], ['D195-B-b', rowBb], ['D195-B-c', rowBc]]){
  try { f(); } catch(e){ ok(R[k] + ' (row crashed: ' + String(e && e.stack || e).slice(0, 240) + ')', false); }
}
done();
