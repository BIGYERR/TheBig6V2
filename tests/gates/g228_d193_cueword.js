// g228_d193_cueword.js — GATE for D193 P-CAPRPE as Mario split it for V228: the plan's cap cue says "three in the
// tank" (R1), the stripper knows the cue by its shape in both wordings (R4), stored strings stay the record (R5), the
// readers do not move (R6), and nothing but the one word moves on any card (the split).
//
//   node tests/gates/g228_d193_cueword.js <candidate.html> [baseline_V227.html]
//   IA_ASSUME_VERSION=228 node tests/gates/g228_d193_cueword.js <tree stamped 227> [baseline_V227.html]   (discrimination only)
//
// THE RULING THIS DEFENDS: tests/measure/v228_rulings/d193_caprpe_ruling.md, R1, R4, R5 and R6 of the original ruling
// and "Mario's decisions, round 2" (2026-10-02): "V228 ships R1 (` — hold RPE 7, three in the tank`) and R4
// (`_stripCapCue` strips both wordings, identity on every non-cue detail) only ... Without R2, V228 moves no number:
// every injured card differs from V227 by the word "two" → "three" only, and class (iii) stays RPE 8 exactly as on
// V227." D-code D193, ships on ia-version 228. HALF_MANNY may not move (standing ruling 5; harness era row
// MANNY_DIGEST_BY_VERSION[228] = [227] by reference).
//
// NOT THIS FILE: the clamp family. R2 (the clamp in applyInjuryFilter, Amendment 1 §3's four shapes and R7's fifth),
// R3 (the kept pre-hold dose), R7 (a held pattern does not test) and R8 (hold toasts) moved to V229 with their gate
// claims (a), (d), (e), (e′), (h), (i), (i-r), (i-u), (j), (k), (l). Those rows are V229's gate, keyed to V229. This
// file asserts the opposite of a clamp on purpose: at V228 every number on every build card is V227's.
//
// ORACLE. Typed here or read from V227's own output; the engine is never asked for an expected value.
//   OLDC / NEWC  ' — hold RPE 7, two in the tank' and ' — hold RPE 7, three in the tank' (real em-dash), typed.
//   RIR          the hand rule reps in reserve = 10 − RPE, so RPE 7 leaves round(10 − 7) = 3, spelled from the typed
//                table NUMWORD; cross-checked against the RPE card's own sentence in the artifact HTML
//                ("RPE 8 ≈ 2 reps left in the tank": 8 + 2 = 10, the same rule).
//   SUBST        V227's build (the baseline tree) with every string that ends in OLDC re-ended in NEWC. That is the
//                whole expected grid: no other byte may differ.
//   HAND         the ruling's strings: `3×10` / `2×10 each` plus either wording strip to the bare dose; HALF_MANNY's
//                "tank" glosses (`RPE 6 (recovery — leave 4+ reps in the tank)`, `RPE 6 (leave plenty in the tank)`)
//                are not the cue; mario knee/wa W5 thu `Step-ups (KB)` `2×10 each — hold RPE 7, two in the tank`;
//                Reverse lunge (KB) lunge (capped under knee/wa: squat, lunge, leg_iso), Barbell good mornings hinge
//                (not capped); W5 thu Leg superset B Kettlebell swing `2×8` -> Dumbbell split-stance deadlift `2×8`
//                (g227 b-HAND-1 hop 1).
//   POWER        measure's typed text lens (tests/measure/v228_caprpe.js): the detail reads /fast and crisp|crisp and
//                explosive|explosive|max intent/i or the section label starts "Power".
//   ERA          the harness MANNY_DIGEST_BY_VERSION table (standing ruling 5).
//
// POPULATION. Builds: L9 (tests/measure/v227_swapseam.js's nine: MARIO knee/wa seed 76308, HALF_MANNY, MARIO
//   uninjured, knee/protect, ankle, hip, lowback, shoulder, elbow at workaround); L432 (region × tier × commercial,
//   crossfit, home_full, bodyweight × experience × focus, MARIO otherwise); home_basic 108 (the same grid on
//   home_basic, Amendment 1 §5); uninjured 47 (MARIO uninjured, HALF_MANNY, 45 cells over five equipment values). A
//   build costs about 7 ms, so the "fixed-seed sample" the brief sized is the whole lattice: every cell runs, in a
//   fixed order. All builds pin the clock (2026-09-24) and cfg.seed (76308), strip clock fields (ts, at, time, stamp,
//   clock, now, id, created), and the baseline is built twice and must equal itself before any diff is read.
//   165 of L432's injured builds carry no cue on V227 (they cap nothing the build drew), so "substitutions > 0" is
//   asserted per config on L9's seven injured configs and as a total on L432 and home_basic.
//
// VERSION PREDICATE (standing rulings 2 and 4). D193's split ships at 228.
//   below 228      REFUSED, every row FAILS by name.
//   228 and up     every row asserts.
//   229 and up     b-ONECLASS is retired: tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r) "b-ONECLASS era
//                  228 only, refuses at 229, its successor is D193 (a)/(b)" (g229_d193_build.js, V229). Its build pass still
//                  runs (it fills the caches f-STRIP and g-COUPLE read) and prints its lines; the row prints one named
//                  `SKIP ... REFUSED at ia-version N (era 228 only)` line, never PASS and never FAIL: the shape gate.sh
//                  accepts for an era-bound row past its era (g221's scoped-out pair rows and G9). c-LIT, f-STRIP, f-STORED
//                  and g-COUPLE (R1, R4, R5, R6) assert at every version from 228 up.
//   IA_ASSUME_VERSION=228 lifts a file stamped exactly 227 to 228 for a discrimination run. It is announced, and ignored
//   on any other file. gate.sh never sets it. Run on V227 that way: c-LIT, b-ONECLASS, f-STRIP and f-STORED FAIL with
//   their counts printed (the V227 cue says "two", its grid is not V227-substituted, its stripper misses "three", its
//   re-cue reads "two"); g-COUPLE PASSES (it is the invariant pair, true on both trees).
//   The baseline (b-ONECLASS, f-STORED) is argv[3] if it reads ia-version 227, else `git show <V227_COMMIT>:index.html`
//   into os.tmpdir(), because tests/sabotage.py passes no argv[3] (the g225/g226/g227 form). The run prints which
//   source it used; no tree reading 227 makes those rows FAIL setup by name, never PASS.
//
// ROWS
//   c-LIT       INJ_CAP_CUE (read off the VM) is NEWC exactly; its RPE is 7 and its number word is NUMWORD[10 − 7]
//               ("three"); the RPE card in the artifact HTML says "RPE a ≈ b reps left in the tank" with a = 8, b = 2,
//               a + b = 10. Defends R1's literal and R1's derivation.
//   b-ONECLASS  candidate build == SUBST(V227 build) on every L9, L432 and home_basic config; > 0 substitutions on each
//               of L9's 7 injured configs and in total on L432 and home_basic; 0 OLDC left on the candidate; uninjured
//               47 byte-identical; MANNY_DIGEST_BY_VERSION[228] exists and === [227], and HALF_MANNY's digest on the
//               artifact (harness way and pinned clock) equals the row for the artifact's era. Defends the split
//               ("nothing but the word changes", no clamp, class (iii) unmoved) and standing ruling 5.
//   f-STRIP     _stripCapCue on hand strings: both wordings strip from `3×10 …` and `2×10 each …` to the bare dose;
//               identity on the near misses (`four in the tank`, the cue mid-string), on HALF_MANNY's "tank" glosses,
//               on HALF_MANNY's 9 "tank" cards, and on every non-cue card of HALF_MANNY and L9 (0 false strips; measure
//               saw 1,722). Defends R4.
//   f-STORED    a V227 grid (built and stored on the BASELINE tree, carrying "two") booted on the candidate with the
//               clock in W6, so W5 is a dead past week shown verbatim (§11e, R5). W5 thu Step-ups (KB) reads the old
//               words; a live swap onto Reverse lunge (KB) (capped) ends `2×10 each — hold RPE 7, three in the tank`,
//               onto Barbell good mornings (uncapped) ends `2×10 each`; 0 old words on either; each equals V227's live
//               card on the same tap with OLDC -> NEWC, toast equal to V227's; the swap record keeps the old string and
//               undo restores it verbatim (R5). Defends R4 on the record V227 left and R5.
//   g-COUPLE    invariants, true on both trees: _addRxKind of a cued detail (either wording) is null while the bare
//               dose is not (R6, the "hold" fence); 0 POWER cards carry the cue on L9, L432 and home_basic (R6's
//               V170 note), with > 0 POWER cards seen; a loaded-to-loaded swap with no cue (mario knee/wa W5 thu
//               Kettlebell swing -> Dumbbell split-stance deadlift) carries `2×8` verbatim with "Same job, same
//               numbers." (D190 R2/R4 unmoved).
//
// SABOTAGE THIS FILE IS MEANT TO CATCH (scratch copies, each anchor count==1):
//   M1  INJ_CAP_CUE back to ' — hold RPE 7, two in the tank': trips c-LIT (and b-ONECLASS, f-STORED).
//   M2  _stripCapCue's `(?:two|three)` -> `three` (the retired wording forgotten): trips f-STRIP and f-STORED (the
//       capped target keeps "two", RPE named, no re-append).
//   M3  _stripCapCue's `$` anchor dropped from the regex (a mid-string strip): trips f-STRIP.
//   M4  `\bhold\b|` removed from _addRxKind's refusal: trips g-COUPLE.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const { load, fixtures, progDigest } = H;

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 228, BASE_ERA = 227;
const V227_COMMIT = '5ce31e8a5f175e69009f6e1c46b93f3d5e62eb47';   // V227: D190 (the V227 artifact, forever)
let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const done = () => { console.log('  runtime ' + secs()); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

const R = {
  cLIT:  'row c-LIT       INJ_CAP_CUE is ` — hold RPE 7, three in the tank`: three = 10 − 7 by hand, and the RPE card says RPE 8 ≈ 2 reps left (8 + 2 = 10)',
  bONE:  'row b-ONECLASS  every L9, L432 and home_basic build == V227 with ` — hold RPE 7, two in the tank` re-ended `three`, nothing else; uninjured 47 byte-identical; HALF_MANNY on the era row, [228] === [227]',
  fSTR:  'row f-STRIP     _stripCapCue strips both wordings to the bare dose, identity on every non-cue detail (hand near misses, HALF_MANNY "tank" cards, every non-cue card of HALF_MANNY and L9)',
  fSTO:  'row f-STORED    a V227-stored "two" card (mario knee/wa W5 thu Step-ups (KB)) swapped live on the candidate: capped target re-cued "three", uncapped no cue, 0 old words, undo restores the stored words',
  gCPL:  'row g-COUPLE    invariants: _addRxKind refuses a cued detail (either wording); 0 power cards cued; a loaded-to-loaded uncued swap carries the donor dose verbatim',
};

// ── TYPED ORACLE ─────────────────────────────────────────────────────────────────────────────────────────────────
const OLDC = ' — hold RPE 7, two in the tank', NEWC = ' — hold RPE 7, three in the tank';
const NUMWORD = { 1:'one', 2:'two', 3:'three', 4:'four', 5:'five' };
const RIR = rpe => Math.round(10 - rpe);                      // the hand rule
const CAP_KNEE = ['squat', 'lunge', 'leg_iso'];              // knee/wa cap, typed from the D190 ruling header
const STEP = 'Step-ups (KB)', STEP_OLD = '2×10 each' + OLDC;
const LUNGE = 'Reverse lunge (KB)', GM = 'Barbell good mornings';
const PAT_TYPED = { [STEP]:'lunge', [LUNGE]:'lunge', [GM]:'hinge' };
const STORED_WANT = { [LUNGE]:'2×10 each' + NEWC, [GM]:'2×10 each' };
const KB = 'Kettlebell swing', SSDL = 'Dumbbell split-stance deadlift', RX8 = '2×8';
const TOAST_SSDL = 'Dumbbell split-stance deadlift in, kettlebell swing out. Same job, same numbers.';
const STRIP_HAND = [
  ['3×10' + OLDC, '3×10'], ['3×10' + NEWC, '3×10'], ['2×10 each' + OLDC, '2×10 each'], ['2×10 each' + NEWC, '2×10 each'],
  ['3×10 — hold RPE 7, four in the tank', null], ['3×10' + OLDC + ', 2 min rest', null], ['3×10' + NEWC + ', 2 min rest', null],
  ['RPE 6 (recovery — leave 4+ reps in the tank)', null], ['RPE 6 (leave plenty in the tank)', null],
  ['3×13 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 2–3 min rest', null],
  ['2 sets — RPE 6 (leave plenty in the tank)', null], ['3×10', null], ['', null],
];
const MANNY_TANK = 9;                                         // the ruling's printed count of HALF_MANNY "tank" cards
const POWER = /fast and crisp|crisp and explosive|explosive|max intent/i;
const endsCue = d => typeof d === 'string' && (d.endsWith(OLDC) || d.endsWith(NEWC));
const cnt = (s, sub) => String(s).split(sub).length - 1;

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24', CLOCK_PAST = '2026-10-01';   // CLOCK_PAST: W6, so W5 is a dead past week
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
const withInj = inj => { const c = clone(MARIO); if(inj) c.injury = inj; else delete c.injury; return c; };
const seeded = c => { const x = clone(c); if(typeof x.seed !== 'number') x.seed = 76308; return x; };
const L9 = { mario:withInj({ region:'knee', tier:'workaround' }), manny:seeded(fixtures.HALF_MANNY), mario_noinj:withInj(null),
  knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }),
  lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
const REGS = ['knee', 'ankle', 'hip', 'lowback', 'shoulder', 'elbow'], TIERS = ['workaround', 'protect'], EXPS = ['beginner', 'intermediate', 'advanced'],
  FOCS = ['support_strength', 'support_athletic', 'support_prevention'];
const grid = EQ => { const r = []; for(const g of REGS) for(const t of TIERS) for(const eq of EQ) for(const ex of EXPS) for(const fo of FOCS)
  r.push({ k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo, c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }) }); return r; };
const UN47 = [{ k:'mario_noinj', c:withInj(null) }, { k:'HALF_MANNY', c:seeded(fixtures.HALF_MANNY) }];
for(const eq of ['commercial', 'crossfit', 'home_full', 'bodyweight', 'home_basic']) for(const ex of EXPS) for(const fo of FOCS)
  UN47.push({ k:'noinj|' + eq + '|' + ex + '|' + fo, c:Object.assign(withInj(null), { equipment:eq, experience:ex, liftingFocus:fo }) });
const SETS = [['L9', Object.keys(L9).map(k => ({ k, c:L9[k] }))], ['L432', grid(['commercial', 'crossfit', 'home_full', 'bodyweight'])], ['home_basic', grid(['home_basic'])], ['uninjured47', UN47]];

const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i;
const J = v => JSON.stringify(v, (k, x) => (CLK.test(k) || k === 'id' || k === 'created') ? undefined : x);
function pin(IA, day){ const T = new Date((day || CLOCK) + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};";
const FILES = { C:ART, B:null };
function fresh(which, day){ const T = load(FILES[which]); T.__tag = which; pin(T, day); E(T, HELP); return T; }
function cardsOf(p){ const m = []; Object.keys((p && p.weeks) || {}).forEach(w => Object.keys(p.weeks[w] || {}).forEach(d => { const dy = p.weeks[w][d];
  ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it) m.push({ w:+w, d, si, ii, label:clean(s.label), n:clean(it.name), det:typeof it.detail === 'string' ? it.detail : '' }); })); })); return m; }
// SUBST: every string leaf that ends with OLDC re-ended with NEWC; counts the re-endings and any OLDC left mid-string
function subst(v, tally){
  if(typeof v === 'string'){ if(v.endsWith(OLDC)){ tally.n++; v = v.slice(0, v.length - OLDC.length) + NEWC; } tally.mid += cnt(v, OLDC); return v; }
  if(Array.isArray(v)) return v.map(x => subst(x, tally));
  if(v && typeof v === 'object'){ const o = {}; for(const k of Object.keys(v)) o[k] = subst(v[k], tally); return o; }
  return v;
}
function firstDiff(a, b){ let k = 0; while(k < a.length && a[k] === b[k]) k++; return '@' + k + ' want …' + a.slice(Math.max(0, k - 60), k + 60) + '… got …' + b.slice(Math.max(0, k - 60), k + 60) + '…'; }

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION !== undefined){
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  } else console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
console.log('g228 D193 cue word (split: R1 + R4) | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D193 P-CAPRPE (V' + ERA + ', the R1 + R4 split). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
let B = null, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!B){
  const f = path.join(os.tmpdir(), 'g228_d193_cueword_v' + BASE_ERA + '_' + process.pid + '.html');
  try {
    try { fs.unlinkSync(f); } catch(e){}
    process.on('exit', () => { try { fs.unlinkSync(f); } catch(e){} });
    fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V227_COMMIT + ':index.html'], { maxBuffer: 1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ B = b; FILES.B = f; baseWhy += 'git show ' + V227_COMMIT.slice(0, 7) + ':index.html (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
console.log('  V' + BASE_ERA + ' baseline: ' + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
const setupNote = B ? '' : ' (setup: no V' + BASE_ERA + ' tree: ' + baseWhy + ')';

// ── c-LIT ─────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const X = fresh('C'); const lit = E(X, "typeof INJ_CAP_CUE==='string'?INJ_CAP_CUE:null");
  const m = /^ — hold RPE (\d+), (\w+) in the tank$/.exec(String(lit));
  const html = fs.readFileSync(ART, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const cards = [...html.matchAll(/<div class="rpe-info-note">[^<]*?RPE (\d+) ≈ (\d+) reps? left in the tank[^<]*<\/div>/g)];
  const a = cards.length === 1 ? +cards[0][1] : NaN, b = cards.length === 1 ? +cards[0][2] : NaN;
  const cardOK = cards.length === 1 && a === 8 && b === 2 && RIR(a) === b;
  const want = NUMWORD[RIR(7)];
  console.log('    c-LIT INJ_CAP_CUE ' + JSON.stringify(lit) + ' | parsed RPE ' + (m ? m[1] : '-') + ', word ' + (m ? m[2] : '-') + ' | hand: rir(7) = round(10 − 7) = ' + RIR(7) + ' -> "' + want + '" | RPE card matches ' + cards.length + ': RPE ' + a + ' ≈ ' + b + ' left, rir(' + a + ') = ' + RIR(a));
  ok(R.cLIT, !!m && m[1] === '7' && m[2] === want && lit === NEWC && cardOK, 'word ' + (m ? '"' + m[2] + '"' : 'unparsed') + ', want "' + want + '"; card ' + (cardOK ? 'agrees' : 'disagrees'));
}

// ── b-ONECLASS (plus the build caches f-STRIP and g-COUPLE read) ───────────────────────────────────────────────────
const BUILT = {};   // candidate builds by set|key
{
  // D194 Amendment 1 (r): "b-ONECLASS era 228 only, refuses at 229, its successor is D193 (a)/(b)" (g229_d193_build.js, V229).
  // The build pass below still runs (f-STRIP and g-COUPLE read its caches); from 229 the row prints one named SKIP line.
  const ONE_RETIRED = VER >= 229;
  if(!B && !ONE_RETIRED) ok(R.bONE + setupNote, false);
  const VC = fresh('C'), VB = B ? fresh('B') : null;
  // SELFCHECK: the shared VM is inert (a fresh-page build equals it) and each tree builds the same program twice
  const probe = [L9.mario, L9.manny, L9.elbow_wa];
  const selfC = probe.every(c => J(VC.buildProgram(clone(c))) === J(fresh('C').buildProgram(clone(c))));
  const selfB = !!VB && probe.every(c => J(VB.buildProgram(clone(c))) === J(fresh('B').buildProgram(clone(c))));
  console.log('    b SELFCHECK shared VM == fresh page (mario, HALF_MANNY, elbow/wa): candidate ' + selfC + (VB ? ', V' + BASE_ERA + ' ' + selfB : ''));
  let allOK = selfC && (!VB || selfB), baseSelf = 0, baseAll = 0; const lines = [], bad = [];
  for(const [tag, list] of SETS){
    let eq = 0, subsTot = 0, withSubs = 0, oldLeft = 0, newOnC = 0, mid = 0, ident = 0, inj = 0, injNoSub = [];
    for(const { k, c } of list){
      const pc = VC.buildProgram(clone(c)), jc = J(pc); BUILT[tag + '|' + k] = pc; oldLeft += cnt(jc, OLDC); newOnC += cnt(jc, NEWC);
      if(!VB) continue;
      const pb = VB.buildProgram(clone(c)), jb = J(pb), jb2 = J(VB.buildProgram(clone(c))); baseAll++; if(jb === jb2) baseSelf++; else { allOK = false; bad.push(tag + ' ' + k + ' BASELINE SELF-MISMATCH'); continue; }
      const t = { n:0, mid:0 }; const want = J(subst(JSON.parse(jb), t)); subsTot += t.n; mid += t.mid; if(t.n) withSubs++;
      if(c.injury){ inj++; if(!t.n) injNoSub.push(k); }
      if(jb === jc) ident++;
      if(want === jc) eq++; else if(bad.length < 4) bad.push(tag + ' ' + k + ' ' + firstDiff(want, jc));
    }
    const n = list.length;
    let setOK;
    if(tag === 'L9') setOK = eq === n && injNoSub.length === 0 && inj === 7 && subsTot > 0;
    else if(tag === 'uninjured47') setOK = eq === n && ident === n && subsTot === 0 && inj === 0;
    else setOK = eq === n && subsTot > 0;
    setOK = setOK && oldLeft === 0 && mid === 0 && newOnC === subsTot;
    if(!setOK) allOK = false;
    lines.push(tag + ': ' + (VB ? 'candidate == SUBST(V227) ' + eq + '/' + n + ' | re-ended ' + subsTot + ' cues on ' + withSubs + ' builds (injured ' + inj + ', injured with none ' + injNoSub.length + ') | OLDC mid-string on V227 ' + mid + ' | byte-identical outright ' + ident + ' | ' : '') + 'candidate: OLDC left ' + oldLeft + ', NEWC ' + newOnC);
  }
  lines.forEach(l => console.log('    b ' + l));
  if(VB) console.log('    b baseline == itself ' + baseSelf + '/' + baseAll);
  bad.forEach(s => console.log('      DIFF ' + s));
  // HALF_MANNY on the era table (standing ruling 5)
  const MD = H.MANNY_DIGEST_BY_VERSION || {};
  const has = Object.prototype.hasOwnProperty.call(MD, ERA) && typeof MD[ERA] === 'string', ref = has && MD[ERA] === MD[BASE_ERA];
  const row = MD[VER];
  const built = progDigest(load(ART).buildProgram(clone(fixtures.HALF_MANNY)));          // the harness way (real clock)
  const builtPin = progDigest(fresh('C').buildProgram(clone(fixtures.HALF_MANNY)));      // and on the gate's pinned clock
  console.log('    b MANNY MANNY_DIGEST_BY_VERSION[' + ERA + '] ' + (has ? MD[ERA] : 'ABSENT') + ', [' + BASE_ERA + '] ' + MD[BASE_ERA] + ', [' + VER + '] ' + row + ' | HALF_MANNY built ' + built + ', pinned ' + builtPin);
  const mannyOK = has && ref && typeof row === 'string' && built === row && builtPin === row;
  if(ONE_RETIRED) console.log('SKIP ' + R.bONE + ': REFUSED at ia-version ' + VER + ' (era 228 only: "nothing but the word changes" is V228\'s claim); its successor is D193 (a)/(b), g229_d193_build.js, V229 (tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r)). Never PASS, never FAIL.');
  else if(B) ok(R.bONE + (has ? '' : ' (row MANNY_DIGEST_BY_VERSION[' + ERA + '] ABSENT)'), allOK && baseSelf === baseAll && baseAll > 0 && mannyOK,
    lines.map(l => l.split(' | ')[0]).join('; ') + '; MANNY [' + ERA + ']' + (ref ? '===' : '!==') + '[' + BASE_ERA + '], ' + built + (built === row ? ' == ' : ' != ') + '[' + VER + ']');
}

// ── f-STRIP ───────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const X = fresh('C'); const strip = arr => { X.ctx.__arr = arr; return Array.from(E(X, '__arr.map(function(d){return _stripCapCue(d);})')); };
  const outs = strip(STRIP_HAND.map(r => r[0]));
  const handBad = [];
  STRIP_HAND.forEach(([d, w], i) => { const want = w === null ? d : w; if(outs[i] !== want) handBad.push(JSON.stringify(d) + ' -> ' + JSON.stringify(outs[i]) + ' want ' + JSON.stringify(want)); });
  // every non-cue card of HALF_MANNY and L9 (candidate builds), and HALF_MANNY's "tank" cards
  const pop = []; Object.keys(L9).forEach(k => cardsOf(BUILT['L9|' + k]).forEach(c => { if(!endsCue(c.det)) pop.push(c.det); }));
  const po = strip(pop); let falseStrips = 0; pop.forEach((d, i) => { if(po[i] !== d) falseStrips++; });
  const tank = cardsOf(BUILT['L9|manny']).filter(c => /tank/.test(c.det)).map(c => c.det); const to = strip(tank); let tankBad = 0; tank.forEach((d, i) => { if(to[i] !== d) tankBad++; });
  console.log('    f-STRIP hand strings ' + (STRIP_HAND.length - handBad.length) + '/' + STRIP_HAND.length + ' right | non-cue cards of HALF_MANNY + L9: false strips ' + falseStrips + '/' + pop.length + ' | HALF_MANNY "tank" cards ' + tank.length + ' (want ' + MANNY_TANK + '), stripped ' + tankBad);
  handBad.forEach(s => console.log('      ' + s));
  ok(R.fSTR, handBad.length === 0 && pop.length > 0 && falseStrips === 0 && tank.length === MANNY_TANK && tankBad === 0,
    'hand ' + handBad.length + ' wrong of ' + STRIP_HAND.length + ', false strips ' + falseStrips + '/' + pop.length + ', tank cards ' + tankBad + '/' + tank.length + ' stripped');
}

// ── f-STORED ──────────────────────────────────────────────────────────────────────────────────────────────────────
function bootStored(which, st, day){ const X = fresh(which, day); X.localStorage.clear(); X.ctx.__SP = JSON.parse(st);
  E(X, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();"); return X; }
function findSlot(X, w, d, sec, name){ const dy = E(X, 'activeProg.weeks[' + w + '].' + d); let L = null;
  ((dy && dy.sections) || []).forEach((s, si) => { if(clean(s.label).indexOf(sec) !== 0) return; (s.items || []).forEach((it, ii) => { if(!L && it && clean(it.name) === name) L = { si, ii }; }); }); return L; }
const slotNow = (X, w, d, L) => { const it = E(X, 'activeProg.weeks[' + w + '].' + d + '.sections[' + L.si + '].items[' + L.ii + ']'); return it ? { n:clean(it.name), d:String(it.detail || '') } : { n:'(none)', d:'' }; };
function tap(X, w, d, L, to){
  E(X, 'currentWeek=' + w + ";currentDayKey='" + d + "';__T.length=0;"); const ex = 'activeProg.weeks[' + w + '].' + d; const pre = slotNow(X, w, d, L);
  const offered = Array.from(E(X, '__cands(' + ex + ',' + w + ',' + JSON.stringify(pre.n) + ')')).includes(to) && !!E(X, '__canSwap(' + ex + ',' + L.si + ',' + L.ii + ')');
  X.ctx.__c = { secIdx:L.si, itemIdx:L.ii, name:pre.n, detail:pre.d }; X.ctx.__to = to; E(X, '_swapCtx=__c;applySwapChoice(__to);');
  return { pre, offered, live:slotNow(X, w, d, L), toast:Array.from(E(X, '__T')).join(' / ') };
}
{
  if(!B) ok(R.fSTO + setupNote, false);
  else {
    const P0 = fresh('B'); const st0 = clone(P0.buildProgram(clone(L9.mario))); Object.assign(st0, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(L9.mario) });
    const ST = JSON.stringify(st0);
    const PV = fresh('C'); const pat = n => E(PV, '_pattern(' + JSON.stringify(n) + ')') || null;
    const patOK = Object.keys(PAT_TYPED).every(n => pat(n) === PAT_TYPED[n]) && CAP_KNEE.includes(PAT_TYPED[LUNGE]) && !CAP_KNEE.includes(PAT_TYPED[GM]);
    let allOK = patOK; const res = [];
    for(const to of [LUNGE, GM]){
      const r = { to };
      for(const T of ['C', 'B']){
        const X = bootStored(T, ST, CLOCK_PAST); const cw = E(X, 'currentWeek'); const L = findSlot(X, 5, 'thu', 'Leg superset A', STEP);
        if(!L){ r[T] = { miss:true, cw }; continue; }
        const a = tap(X, 5, 'thu', L, to);
        const rec = E(X, "JSON.stringify((getSwaps('PM')['w5_thu'])||[])"); const recs = JSON.parse(rec); const last = recs[recs.length - 1] || {};
        const recD = Array.isArray(last.rx) && last.rx[0] ? last.rx[0].d : null;
        const chip = E(X, 'swapOriginOf(' + JSON.stringify(to) + ')') || '';
        if(chip) E(X, 'undoSwap(' + JSON.stringify(chip) + ');');
        r[T] = Object.assign(a, { cw, recD, chip, undo:slotNow(X, 5, 'thu', L) });
      }
      const c = r.C, b = r.B;
      if(c.miss || b.miss){ allOK = false; res.push(to + ': Step-ups (KB) not on W5 thu Leg superset A (C ' + !c.miss + ', B ' + !b.miss + '), fixture moved'); continue; }
      const pairWant = b.live.d.endsWith(OLDC) ? b.live.d.slice(0, b.live.d.length - OLDC.length) + NEWC : b.live.d;
      const okT = c.cw === 6 && c.pre.n === STEP && c.pre.d === STEP_OLD && b.pre.d === STEP_OLD && c.offered && b.offered
        && c.live.n === to && c.live.d === STORED_WANT[to] && cnt(c.live.d, 'two in the tank') === 0 && c.live.d === pairWant && c.toast === b.toast
        && c.recD === STEP_OLD && c.chip === STEP && c.undo.n === STEP && c.undo.d === STEP_OLD && b.undo.d === STEP_OLD;
      if(!okT) allOK = false;
      res.push(to + ' [' + pat(to) + (CAP_KNEE.includes(pat(to)) ? ', capped' : ', uncapped') + '] week ' + c.cw + ' | pre ' + JSON.stringify(c.pre.d) + ' | live ' + JSON.stringify(c.live.d) + ' (want ' + JSON.stringify(STORED_WANT[to]) + ', V227 ' + JSON.stringify(b.live.d) + ' -> ' + JSON.stringify(pairWant) + ') | offered ' + c.offered + ' | toast ' + (c.toast === b.toast ? '== V227' : JSON.stringify(c.toast) + ' vs V227 ' + JSON.stringify(b.toast)) + ' | record rx.d ' + JSON.stringify(c.recD) + ' | chip ' + c.chip + ' | undo ' + JSON.stringify(c.undo.d) + ' -> ' + (okT ? 'ok' : 'WRONG'));
    }
    console.log('    f-STORED V227 grid built on the baseline, booted at ' + CLOCK_PAST + ' (W6; W5 dead past) | patterns typed == classifier ' + patOK);
    res.forEach(s => console.log('      ' + s));
    ok(R.fSTO, allOK, res.map(s => s.split(' | ')[0] + ' ' + (s.endsWith('ok') ? 'ok' : 'WRONG')).join(', '));
  }
}

// ── g-COUPLE ──────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const X = fresh('C');
  const kinds = ['3×10' + OLDC, '3×10' + NEWC, '2×10 each' + OLDC, '2×10 each' + NEWC].map(d => E(X, '_addRxKind(' + JSON.stringify(d) + ',' + JSON.stringify(STEP) + ')'));
  const bare = E(X, '_addRxKind(' + JSON.stringify('3×10') + ',' + JSON.stringify(STEP) + ')');
  const fenceOK = kinds.every(k => k === null) && bare !== null && bare !== undefined;
  let pw = 0, pwCued = 0, cued = 0; const pwBad = [];
  for(const key of Object.keys(BUILT)){ if(key.startsWith('uninjured47|')) continue;
    cardsOf(BUILT[key]).forEach(c => { const cue = endsCue(c.det); if(cue) cued++;
      if(POWER.test(c.det) || /^Power/.test(c.label)){ pw++; if(cue){ pwCued++; if(pwBad.length < 3) pwBad.push(key + ' W' + c.w + ' ' + c.d + ' ' + c.n + ' :: ' + c.det); } } }); }
  const A = fresh('C'); A.localStorage.clear(); const st = clone(fresh('C').buildProgram(clone(L9.mario))); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(L9.mario) });
  A.ctx.__SP = st; E(A, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();");
  const L = findSlot(A, 5, 'thu', 'Leg superset B', KB); const sw = L ? tap(A, 5, 'thu', L, SSDL) : null;
  const swOK = !!sw && sw.pre.d === RX8 && sw.offered && sw.live.n === SSDL && sw.live.d === RX8 && sw.toast === TOAST_SSDL;
  console.log('    g-COUPLE _addRxKind ' + JSON.stringify(kinds) + ' on the cued details, ' + JSON.stringify(bare) + ' on the bare dose | POWER cards on L9 + L432 + home_basic ' + pw + ', cued ' + pwCued + ' (all cued cards ' + cued + ')'
    + ' | mario knee/wa W5 thu Leg superset B ' + KB + ' ' + (sw ? JSON.stringify(sw.pre.d) + ' -> ' + sw.live.n + ' ' + JSON.stringify(sw.live.d) + ', offered ' + sw.offered + ', toast ' + JSON.stringify(sw.toast) : '(slot not found, fixture moved)'));
  pwBad.forEach(s => console.log('      cued power: ' + s));
  ok(R.gCPL, fenceOK && pw > 0 && pwCued === 0 && cued > 0 && swOK, 'fence ' + (fenceOK ? 'holds' : 'BROKEN') + ', power cued ' + pwCued + '/' + pw + ', uncued swap ' + (swOK ? 'verbatim' : 'MOVED'));
}
done();
