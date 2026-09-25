// g221_d177_swapfloor.js — GATE for D177 (P-SWAPFLOOR): a swapped Main is prescribed the way the engine would have
// prescribed the candidate in that slot.
//
//   node tests/gates/g221_d177_swapfloor.js <candidate.html> [baseline_V220.html]
//   IA_ASSUME_VERSION=221 node tests/gates/g221_d177_swapfloor.js <tree stamped 220> [baseline_V220.html]   (pre-bump dev only)
//
// THE RULING THIS DEFENDS: tests/measure/v221_rulings/p_swapfloor_ruling.md (R1, R2, R4, R5, RR1, RR2, RR3, RR4, RR5,
// "Gate scope ... gatekeeper must prove" items 1 to 4, RE-BASELINE ON V219) and the Rule and Floor table sections of
// p_swapfloor_ruling.v1.md (R3 there superseded by RR4). Mario (2026-09-23): the KB swing stays on strength Main swaps,
// floored 10–15. D-code D177, ships on ia-version 221.
//
// ORACLE. Hand-typed, never asked of the engine:
//   HAND_FLOOR   the floor table as the ruling adopts it ("all from _REP_FLOOR as it stands", RR1 rows, RR4 literal
//                `landmine (reverse lunge|rotational press)` in the unilateral [6,10] row). G2 is typed from RR1 by name.
//   GRAM         the wave Main grammar `S×R — RPE ` (R2), parsed by a gate-side regex; the rewrite keeps every byte but
//                the rep token (R1). Toast copy is R5's sentence and the V119 sentences, typed.
//   EXPG / EXPT  Mario's card and toast, the ruling's own strings.
//   DOCTRINE     knee/workaround copy "Jumps are out." is the oracle for the injury filter re-run (G7-1b).
//   Identity rows (G5) take the day's own JSON before the swap as the oracle: undo must give it back byte for byte.
// OBSERVATION is the live path: applySwapChoice / undoSwap / refreshProgram / buildProgram inside the harness VM.
//
// VERSION PREDICATE (standing rulings 2 and 4). D177 ships at 221.
//   below 221      REFUSED, every assertion row FAILS by name.
//   221 and up     hand and class rows (G1 G2 G3 G5 G6 G7-1 G7-2a G8b) assert.
//   pair rows      G4 G7-4 G8a assert only on D177's build pair: candidate 221 against baseline 220 (argv[3] when it
//                  reads 220, else git 8ee4385). Any other candidate: SKIP, scoped out, never PASS. G9 asserts on 221 only.
//   IA_ASSUME_VERSION=221 lifts a file stamped 220 to 221 for a pre-bump development run. It is announced, and it is
//   ignored on any file not stamped exactly 220. gate.sh never sets it.
// GATE-SCOPE ITEM 2, RESTATED (RE-RULING ON V220 (swap durability), item 3): "Frozen-day re-swap: a day with an
//   `ia_hist_` snapshot at `4×3`, re-swapped through `applySwapChoice`, shows the window live (G7-2a). Whether that
//   re-swap survives a reboot is not D177's claim; it is P-SWAPDURABLE's." The reboot assertion is row 1 of
//   P-SWAPDURABLE's gate (item 4). This gate carries no row for it.
//
// ROWS
//   G1a  Mario's card: commercial|support_strength|beginner|liftonly|knee/workaround, seed 76308, W5 Thu, Barbell box
//        squat -> Dumbbell goblet squat via applySwapChoice prints EXPG.            G1b  the toast is EXPT.
//   G2   _repFloor equals the hand table on 14 named movements.
//   G3   lite lattice L1 (seed 76308), every Main and Power swap pair, live applySwapChoice, hand parse and hand table:
//        G3a 0 changes outside the rep token   G3b 0 land under their window   G3c 0 power pairs and 0 off-grammar Main
//        donors change   G3d donors at or above the floor stay verbatim   G3e null-row pairs stay verbatim
//        G3f every pair under its window prints exactly the hand rewrite (and there are some).
//   G4   (pair) L1: 0 _pattern-null items differ under _swapDetailFor, candidate vs V220, while Main swap pairs do;
//        G4b Landmine rotations, G4c Dumbbell renegade rows: named no-change, present on the lattice.
//   G5   G5a L1 swap then undo leaves day.sections byte-identical (clock fields stripped) on every pair;
//        G5b including Close-grip bench press -> Dips; G5c a CONSTRUCTED duplicate-name day (tap, tap both, reboot
//        re-apply); G5d a legacy record without rx: name back, no throw, record cleared.
//   G6   G6a L1: the third toast fires exactly when the hand window fires, V119 copy on a changed [0,0] pair,
//        "Same job, same numbers." otherwise; G6b home_basic Dumbbell decline press -> Dips keeps the V119 copy;
//        G6c Dumbbell Romanian deadlift 4×6 -> Kettlebell single-leg deadlift prints "Same job, same numbers." verbatim.
//   G7   G7-1a cfg.exSwapPrefs {Barbell box squat: Dumbbell goblet squat}: the window on every week the pref lands, on a
//        build and on a reboot with W1 frozen (W1 byte-identical to its snapshot); cfg not mutated.
//        G7-1b the injury filter still re-runs after a pref (Box jumps pref: healthy lands it, knee/workaround drops it).
//        G7-2a a day restored from an ia_hist_ snapshot at 4×3, re-swapped through applySwapChoice, shows the window live.
//        G7-2a is gate-scope item 2 as restated above.   G7-4 (pair) lite lattice L2 at a second seed: 0 cards change
//        against V220.
//   G8   G8a (pair) L2: 0 add-path details change against V220. G8b addedDetailFor's fallback is `3×10 — RPE 7`: in the
//        Main grammar and at or above every hand window's low end, so no window can move it.
//   G9   HALF_MANNY digest 0ac7da6b1691a8e1 on the candidate, self-stable (221 only; standing ruling 5, no era row).
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 221, BASE_ERA = 220, V220_COMMIT = '8ee4385b6108a2eade639628aa99dee0ab201950';
const MANNY = '0ac7da6b1691a8e1';
let pass = 0, fail = 0, skip = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = (l, why) => { skip++; console.log('SKIP ' + l + ': ' + why); };
const done = () => { console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

// ── HAND ORACLE ──────────────────────────────────────────────────────────────
const EXPG = '4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const EXPT = 'Dumbbell goblet squat in, barbell box squat out. The load runs out before the reps do here. Same sets, same effort. Reps move to 8 to 12.';
const DONOR_M = '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
// The floor table as ruled. Order matters (first match wins), exactly as the table reads.
const HAND_FLOOR = [
  // null row (RR1: "the NULL row carries verbatim"): the wave's own barbell compounds, exact names
  [/^(barbell bench press|incline barbell press|close-grip bench press|barbell row|pendlay row|deadlift|sumo deadlift|trap bar deadlift|romanian deadlift|back squat|front squat|paused back squat|box squat|overhead press|push press|good mornings)$/i, null],
  // V119 unloadable rows [0,0] (kept exactly as V119 wrote them, R2)
  [/foot on chair|hands on bed|shoulders on bed|under a table|\(anchored\)|partner\/anchor/i, [0, 0]],
  [/banded|resistance band|band pull-apart/i, [0, 0]],
  [/glute bridge|bodyweight back extension|45° back extension/i, [0, 0]],
  [/nordic|glute-ham|\bghr\b/i, [0, 0]],
  [/inverted row|prone y-t-w|reverse snow angel/i, [0, 0]],
  [/wall sit|wall walk|assisted pistol|spanish squat/i, [0, 0]],
  [/\bdips\b|pushup|push-up|pike pushup/i, [0, 0]],
  [/squat \(slow/i, [0, 0]],
  // load-ceilinged windows (v1 Floor table, RR1)
  [/goblet/i, [8, 12]],
  [/pull-through|pull through/i, [8, 12]],
  [/straight-arm pulldown/i, [8, 12]],
  [/kettlebell swing|\bswing\b/i, [10, 15]],                 // Mario 2026-09-23: kept, 10–15
  [/hip thrust/i, [6, 10]],
  [/split squat|step-?up|single-leg|single leg|pistol|landmine (reverse lunge|rotational press)/i, [6, 10]],   // RR4 literal
  [/\brow\b/i, [6, 10]],
  [/dumbbell|kettlebell|\bdb\b|\bkb\b/i, [5, 8]],
  [/leg press|hack squat|machine|pulldown/i, [5, 8]],
  [/cable|crossover|pec deck|\bfly\b|flye/i, [8, 12]],
];
const handFloor = n => { for(const [re, w] of HAND_FLOOR) if(re.test(String(n || ''))) return w; return null; };
const HAND_G2 = [['Dumbbell goblet squat', [8, 12]], ['Kettlebell swing', [10, 15]], ['Barbell hip thrust', [6, 10]],
  ['Zercher single-leg deadlift', [6, 10]], ['Landmine reverse lunge', [6, 10]], ['Landmine rotational press', [6, 10]],
  ['Landmine rotations', null], ['Dumbbell row', [6, 10]], ['Dumbbell bench press', [5, 8]], ['Leg press', [5, 8]],
  ['Cable lateral raise', [8, 12]], ['Back squat', null], ['Barbell box squat', null], ['Step-ups (KB)', [6, 10]]];
const GRAM = /^(\d+)×(\d+)(?:–(\d+))? — RPE /;                       // R2: the wave Main grammar
const REP_TOKEN = /^(\d+)×\d+(?:–\d+)?/;
const handRewrite = (d, w) => d.replace(REP_TOKEN, (m, s) => s + '×' + w[0] + '–' + w[1]);
const stripRep = s => String(s).replace(REP_TOKEN, (m, sets) => sets + '×#');
function handKind(n, D){
  const W = handFloor(n);
  if(W === null) return { k:'null', W };
  if(W[1] === 0) return { k:'zero', W };
  const m = GRAM.exec(D || '');
  if(!m) return { k:'offgram', W };
  if(+m[2] < W[0]) return { k:'win', W, out:handRewrite(D, W) };
  return { k:'atfloor', W };
}
const T3 = (to, from, w) => to + ' in, ' + from.toLowerCase() + ' out. The load runs out before the reps do here. Same sets, same effort. Reps move to ' + w[0] + ' to ' + w[1] + '.';
const T119 = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. No load to add here, so take the sets to the same effort.';
const TSAME = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. Same job, same numbers.';
const DOCTRINE_KNEE = 'Jumps are out.';
const FALLBACK = '3×10 — RPE 7';

// ── FIXTURES ─────────────────────────────────────────────────────────────────
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLOCK = /^_?(ts|at|time|stamp|clock|now)$/i;
const J = v => JSON.stringify(v, (k, x) => CLOCK.test(k) ? undefined : x);
function mk(t, f, x, g, i, seed){
  const race = !!g.id && /half/.test(g.id);
  return { name:'M', primaryPath:g.id ? (race ? 'event' : 'cardio') : 'lift', cardioTypes:g.id ? ['run'] : [],
    cardioGoals:g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted:race, raceDate:race ? '2026-12-06' : null, liftingFocus:f, experience:x, ageBracket:'18-35', equipment:t, unit:'lbs',
    restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench:135, squat:155, deadlift:185, seed, ...(i.v ? { injury:i.v } : {}) };
}
const LO = { k:'liftonly', id:null }, HALF = { k:'half', id:'run_half' }, PACE = { k:'pace', id:'run_pace_goal' };
const INJ = (r, t) => ({ k:r + '/' + t, v:{ region:r, tier:t } }), HEALTHY = { k:'healthy', v:null };
const TIERS = ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal'];
const FOCUS = ['support_prevention', 'support_strength', 'hypertrophy', 'strength'];
const L1 = [], L2 = [];
for(const t of TIERS) for(const f of FOCUS) for(const x of ['beginner', 'advanced']) for(const g of [LO, HALF])
  for(const i of [HEALTHY, INJ('knee', 'workaround'), INJ('lowback', 'workaround'), INJ('shoulder', 'protect')]) L1.push(mk(t, f, x, g, i, 76308));
for(const t of TIERS) for(const f of FOCUS) for(const g of [LO, PACE, HALF])
  for(const i of [HEALTHY, INJ('knee', 'workaround'), INJ('hip', 'workaround')]) L2.push(mk(t, f, 'intermediate', g, i, 51407));
const MARIO = () => mk('commercial', 'support_strength', 'beginner', LO, INJ('knee', 'workaround'), 76308);

// ── ROWS (static, so a refused era fails every one by name) ──────────────────
const R = {
  G1a:"G1a Mario's card (commercial|support_strength|beginner|liftonly|knee/workaround, seed 76308, W5 Thu): Barbell box squat -> Dumbbell goblet squat via applySwapChoice prints `" + EXPG + '`',
  G1b:'G1b the toast is `' + EXPT + '`',
  G2:'G2 _repFloor equals the hand floor table on 14 named movements (RR1 rows, RR4 landmine literal, swing 10–15)',
  G3a:'G3a L1: 0 Main swap pairs change outside the rep token',
  G3b:'G3b L1: 0 Main swap pairs on a window row land under their window',
  G3c:'G3c L1: 0 power pairs change, 0 Main donors outside the S×R — RPE grammar change (R2)',
  G3d:'G3d L1: donors at or above the floor stay verbatim',
  G3e:'G3e L1: null-row pairs stay verbatim',
  G3f:'G3f L1: every Main pair under its window prints exactly the hand rewrite (and some do)',
  G4a:'G4a (pair) L1: 0 _pattern-null items differ under _swapDetailFor, candidate vs V220, while Main swap pairs do (RR5)',
  G4b:'G4b (pair) L1: Landmine rotations, named no-change under _swapDetailFor, present on the lattice',
  G4c:'G4c (pair) L1: Dumbbell renegade rows, named no-change under _swapDetailFor, present on the lattice',
  G5a:'G5a L1: swap then undo leaves day.sections byte-identical on every Main and Power pair (R4)',
  G5b:'G5b L1: Close-grip bench press -> Dips -> undo restores the donor detail, day byte-identical',
  G5c:'G5c constructed duplicate-name day (RR4 re-scope): tap / tap both / reboot re-apply, then undo, byte-identical',
  G5d:'G5d legacy record without rx: undo restores the name, throws nothing, clears the record (RR3)',
  G6a:'G6a L1: the third toast fires exactly when the hand window fires; V119 copy on a changed [0,0] pair; "Same job, same numbers." otherwise',
  G6b:'G6b home_basic|strength|beginner W1 Mon: Dumbbell decline press -> Dips keeps the V119 copy',
  G6c:'G6c home_basic|strength|beginner W1 Tue: Dumbbell Romanian deadlift 4×6 -> Kettlebell single-leg deadlift prints "Same job, same numbers." and the donor verbatim',
  G71a:'G7-1a cfg.exSwapPrefs {Barbell box squat: Dumbbell goblet squat}: every week the pref lands prints the window, on a build and on a reboot with W1 frozen; cfg not mutated',
  G71b:'G7-1b the injury filter still re-runs after a pref: Box jumps lands on healthy, never on knee/workaround ("' + DOCTRINE_KNEE + '")',
  G72a:'G7-2a a day restored from an ia_hist_ snapshot at 4×3, re-swapped through applySwapChoice, shows the window live',
  G74:'G7-4 (pair) L2 (seed 51407): 0 engine cards change against V220; V220 equals itself',
  G8a:'G8a (pair) L2: 0 add-path details change against V220',
  G8b:'G8b addedDetailFor fallback is `' + FALLBACK + '`: Main grammar, at or above every hand window low end, left verbatim',
  G9:'G9 HALF_MANNY digest ' + MANNY + ' on the candidate, self-stable (no era row)',
};
const PAIR_ROWS = ['G4a', 'G4b', 'G4c', 'G74', 'G8a'];

// ── RUN ──────────────────────────────────────────────────────────────────────
const t0 = Date.now();
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a pre-bump development run, not a ship proof');
}
console.log('g221 D177 | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + ' | L1 ' + L1.length + ' configs, L2 ' + L2.length);
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D177 P-SWAPFLOOR (V' + ERA + '). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
// Baseline for the pair rows: D177's build pair is 221 against 220.
let B = null, baseWhy = '';
if(VER === ERA){
  try {
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA) B = b; else baseWhy = 'argv[3] reads ' + b.version + '; '; }
    if(!B){
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g221d177-')), f = path.join(tmp, 'v220.html');
      fs.writeFileSync(f, cp.execFileSync('git', ['show', V220_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 }));
      const b = load(f); fs.rmSync(tmp, { recursive:true, force:true });
      if(+b.version === BASE_ERA){ B = b; baseWhy += 'baseline from git ' + V220_COMMIT.slice(0, 7); } else baseWhy += 'git reads ' + b.version;
    }
  } catch(e){ baseWhy += 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); B = null; }
}
const PAIR = VER === ERA && !!B;
console.log('  pair rows: ' + (PAIR ? 'LIVE (candidate ' + VER + ' vs V' + BASE_ERA + (baseWhy ? ', ' + baseWhy : ', argv[3]') + ')' : VER === ERA ? 'SETUP FAILED (' + baseWhy + ')' : 'scoped out (candidate ' + VER + ' is not D177\'s pair)'));
const pairRow = (key, cond, got) => {
  if(PAIR) return ok(R[key], cond, got);
  if(VER === ERA) return ok(R[key] + ' (setup: ' + baseWhy + ')', false);
  skipRow(R[key], 'scoped out, candidate ' + VER + " is not D177's build pair (221 vs 220)");
};
const LS = IA.localStorage;
IA.eval("globalThis.__T=null;showToast=function(m){globalThis.__T=m;};openDetail=function(){};closeSwapSheet=function(){};"
  + "renderWeekView=function(){};showScreen=function(){};bumpSwapCount=function(){return false;};activeProgId='P1';");
const sdE = IA.eval('_swapDetailFor'), rfE = IA.eval('_repFloor'), patE = IA.eval('_pattern'), scE = IA.eval('swapCandidates');
const sdB = PAIR ? B.eval('_swapDetailFor') : null;
const safe = fn => { try { return fn(); } catch(e){ return [false, 'threw ' + (e && e.message)]; } };
const row = (key, fn) => { const r = safe(fn); ok(R[key], r[0], r[0] ? undefined : r[1]); };
const mainIdx = day => (day.sections || []).findIndex(s => /^main/i.test(clean(s && s.label)));
function liveSwap(prog, w, d, si, ii, to){
  IA.ctx.__P = prog; const it = prog.weeks[w][d].sections[si].items[ii];
  IA.ctx.__c = { secIdx:si, itemIdx:ii, name:it.name, detail:it.detail || '' };
  IA.eval("activeProg=__P;activeProgId='P1';currentWeek=" + (+w) + ";currentDayKey='" + d + "';globalThis.__T=null;_swapCtx=__c;applySwapChoice(" + JSON.stringify(to) + ')');
  return { item:prog.weeks[w][d].sections[si].items[ii], toast:IA.eval('globalThis.__T') };
}

// G1 Mario's card
row('G1a', () => {
  LS.clear(); const cfg = MARIO(), p = IA.buildProgram(cfg); p.cfg = cfg; const day = p.weeks[5].thu, si = mainIdx(day);
  const it = day.sections[si].items[0];
  if(clean(it.name) !== 'Barbell box squat' || it.detail !== DONOR_M) return [false, 'fixture moved: ' + it.name + ' :: ' + it.detail];
  const r = liveSwap(p, 5, 'thu', si, 0, 'Dumbbell goblet squat'); globalThis.__G1 = r.toast;
  return [r.item.name === 'Dumbbell goblet squat' && r.item.detail === EXPG, r.item.name + ' :: ' + r.item.detail];
});
row('G1b', () => [globalThis.__G1 === EXPT, globalThis.__G1]);

// G2 hand floor table
row('G2', () => {
  const bad = HAND_G2.filter(([n, w]) => JSON.stringify(rfE(n)) !== JSON.stringify(w)).map(([n, w]) => n + ' want ' + JSON.stringify(w) + ' got ' + JSON.stringify(rfE(n)));
  return [!bad.length, bad.join('; ')];
});

// L1 sweep: G3, G4, G5a/b, G6a in one pass over every Main and Power swap pair.
const S = { cfgs:0, crash:[], days:0, pairs:0, main:0, pow:0, powChg:0, offN:0, offChg:0, winN:0, winBad:0, atN:0, atBad:0, nullN:0, nullBad:0,
  zeroN:0, zeroChg:0, outside:0, under:0, underN:0, idBad:0, throws:0, toastBad:0, t3:0, pn:0, pnDiff:0, mainDiff:0,
  lr:0, lrDiff:0, rr:0, rrDiff:0, cgbp:null, ex:{} };
const note = (k, s) => { (S.ex[k] = S.ex[k] || []).length < 3 && S.ex[k].push(s); };
const exs = k => (S.ex[k] || []).map(s => ' | e.g. ' + s).join('');
for(const cfg of L1){
  let p; try { p = IA.buildProgram(cfg); } catch(e){ S.crash.push(cfg.equipment + '|' + cfg.liftingFocus + ': ' + e.message); continue; }
  S.cfgs++; const prog = Object.assign({}, p, { cfg }); IA.ctx.__P = prog;
  const tag = [cfg.equipment, cfg.liftingFocus, cfg.experience, cfg.primaryPath, cfg.injury ? cfg.injury.region + '/' + cfg.injury.tier : 'healthy'].join('|');
  for(const w of Object.keys(p.weeks)) for(const d of Object.keys(p.weeks[w])){
    const day = p.weeks[w][d]; if(!day || day.rest || !Array.isArray(day.sections)) continue;
    S.days++;
    day.sections.forEach(s => ((s && s.items) || []).forEach(it => {
      if(!it || !it.name || typeof it.detail !== 'string' || patE(it.name) != null) return;
      S.pn++; const n = clean(it.name), differ = PAIR && sdB(it.name, it.detail) !== sdE(it.name, it.detail);
      if(differ){ S.pnDiff++; note('pn', n + ' :: ' + it.detail); }
      if(n === 'Landmine rotations'){ S.lr++; if(differ) S.lrDiff++; }
      if(n === 'Dumbbell renegade rows'){ S.rr++; if(differ) S.rrDiff++; }
    }));
    IA.eval("activeProg=__P;activeProgId='P1';currentWeek=" + (+w) + ";currentDayKey='" + d + "';localStorage.removeItem('ia_swaps_P1');");
    for(let si = 0; si < day.sections.length; si++){
      const L = clean(day.sections[si] && day.sections[si].label);
      const isMain = /^main/i.test(L), isPow = /^power|explosive finisher/i.test(L);
      if(!isMain && !isPow) continue;
      const nItems = (day.sections[si].items || []).length;
      for(let ii = 0; ii < nItems; ii++){
        const it0 = day.sections[si].items[ii]; if(!it0 || !it0.name || typeof it0.detail !== 'string') continue;
        let c = null; try { c = scE(clean(it0.name), day, w, prog); } catch(e){} if(!c) continue;
        const cands = [].concat(c.tier1 || [], c.tier2 || []).map(z => typeof z === 'string' ? z : z.name);
        for(const to of cands){
          const it = day.sections[si].items[ii], from = it.name, D = it.detail;
          const before = J(day.sections), raw = JSON.stringify(day.sections);
          const H = handKind(to, D), where = tag + ' W' + w + ' ' + d + ' ' + clean(from) + ' -> ' + to;
          let O = null, toast = null, after = null;
          try {
            IA.ctx.__c = { secIdx:si, itemIdx:ii, name:from, detail:D };
            IA.eval("globalThis.__T=null;_swapCtx=__c;applySwapChoice(" + JSON.stringify(to) + ')');
            O = day.sections[si].items[ii].detail; toast = IA.eval('globalThis.__T');
            IA.eval('undoSwap(' + JSON.stringify(from) + ')');
            after = J(day.sections);
          } catch(e){ S.throws++; note('throw', where + ' ' + e.message); }
          S.pairs++;
          if(after !== before){ S.idBad++; note('id', where + ' [' + H.k + ']'); }
          if(from === 'Close-grip bench press' && to === 'Dips' && !S.cgbp) S.cgbp = { where, ok:after === before, D, O };
          day.sections = JSON.parse(raw); IA.eval("localStorage.removeItem('ia_swaps_P1')");
          // G6a toast by hand kind
          const wantT = H.k === 'win' ? T3(to, from, H.W) : (H.k === 'zero' && O !== D) ? T119(to, from) : TSAME(to, from);
          if(toast !== wantT){ S.toastBad++; note('toast', where + ' [' + H.k + '] ' + toast); }
          if(/The load runs out before the reps do here/.test(String(toast))) S.t3++;
          if(isPow){
            if(H.k === 'zero') continue;
            S.pow++; if(O !== D){ S.powChg++; note('pow', where + ' :: ' + D + ' => ' + O); }
            continue;
          }
          S.main++;
          if(PAIR && sdB(to, D) !== O) S.mainDiff++;
          if(H.k === 'zero'){ S.zeroN++; if(O !== D) S.zeroChg++; continue; }
          if(O !== D && stripRep(O) !== stripRep(D)){ S.outside++; note('out', where + ' :: ' + D + ' => ' + O); }
          if(H.k === 'offgram'){ S.offN++; if(O !== D){ S.offChg++; note('off', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'null'){ S.nullN++; if(O !== D){ S.nullBad++; note('null', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'atfloor'){ S.atN++; if(O !== D){ S.atBad++; note('at', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'win'){ S.winN++; if(O !== H.out){ S.winBad++; note('win', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'win' || H.k === 'atfloor'){
            S.underN++; const m = GRAM.exec(O || ''); if(!m || +m[2] < H.W[0]){ S.under++; note('under', where + ' :: ' + O); }
          }
        }
      }
    }
  }
}
console.log('  L1: ' + S.cfgs + '/' + L1.length + ' builds, ' + S.days + ' training days, ' + S.pairs + ' swap pairs (' + S.main + ' Main, ' + S.pow + ' Power) | window ' + S.winN
  + ', at/over floor ' + S.atN + ', null row ' + S.nullN + ', off grammar ' + S.offN + ', [0,0] ' + S.zeroN + ' (' + S.zeroChg + ' changed) | third toast ' + S.t3
  + ' | _pattern-null items ' + S.pn + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
const crashNote = S.crash.length ? ' | build crashes ' + S.crash.length + ': ' + S.crash.slice(0, 2).join('; ') : '';
ok(R.G3a, !S.crash.length && S.main > 0 && S.outside === 0, S.outside + ' of ' + S.main + crashNote + exs('out'));
ok(R.G3b, !S.crash.length && S.underN > 0 && S.under === 0, S.under + ' of ' + S.underN + crashNote + exs('under'));
ok(R.G3c, !S.crash.length && S.pow > 0 && S.powChg === 0 && S.offN > 0 && S.offChg === 0, 'power ' + S.powChg + ' of ' + S.pow + ', off grammar ' + S.offChg + ' of ' + S.offN + crashNote + exs('pow') + exs('off'));
ok(R.G3d, !S.crash.length && S.atN > 0 && S.atBad === 0, S.atBad + ' of ' + S.atN + crashNote + exs('at'));
ok(R.G3e, !S.crash.length && S.nullN > 0 && S.nullBad === 0, S.nullBad + ' of ' + S.nullN + crashNote + exs('null'));
ok(R.G3f, !S.crash.length && S.winN > 0 && S.winBad === 0, S.winBad + ' of ' + S.winN + crashNote + exs('win'));
pairRow('G4a', S.pn > 0 && S.pnDiff === 0 && S.mainDiff > 0, S.pnDiff + ' of ' + S.pn + ' differ; Main pairs differing ' + S.mainDiff + exs('pn'));
pairRow('G4b', S.lr > 0 && S.lrDiff === 0, S.lrDiff + ' of ' + S.lr);
pairRow('G4c', S.rr > 0 && S.rrDiff === 0, S.rrDiff + ' of ' + S.rr);
ok(R.G5a, !S.crash.length && S.pairs > 0 && S.idBad === 0 && S.throws === 0 && S.winN > 0 && S.zeroChg > 0,
  S.idBad + ' of ' + S.pairs + ' not identical, throws ' + S.throws + crashNote + exs('id') + exs('throw'));
ok(R.G5b, !!S.cgbp && S.cgbp.ok && S.cgbp.O !== S.cgbp.D, S.cgbp ? JSON.stringify(S.cgbp) : 'pair not on L1');
ok(R.G6a, !S.crash.length && S.pairs > 0 && S.toastBad === 0 && S.t3 === S.winN && S.t3 > 0, S.toastBad + ' of ' + S.pairs + ', third toast ' + S.t3 + ' vs hand window ' + S.winN + exs('toast'));

// G5c constructed duplicate-name day, G5d legacy record
const store = () => JSON.parse(LS.getItem('ia_swaps_P1') || '{}');
function fixtureM(){
  LS.clear(); const cfg = MARIO(), p = IA.buildProgram(cfg), prog = Object.assign({}, p, { cfg }), day = prog.weeks[5].thu, si = mainIdx(day);
  IA.ctx.__P = prog; IA.eval("activeProg=__P;activeProgId='P1';currentWeek=5;currentDayKey='thu';"); return { prog, day, si };
}
function tap(day, si, ii, to){ const it = day.sections[si].items[ii]; IA.ctx.__c = { secIdx:si, itemIdx:ii, name:it.name, detail:it.detail || '' };
  IA.eval('_swapCtx=__c;applySwapChoice(' + JSON.stringify(to) + ')'); }
const DUP = '2×4 — RPE 8 (leave ~2 reps in reserve), 3 min rest';   // hand-written, differs from the donor, under the goblet window
function inject(day, si){ const X = day.sections[si].items[0].name, tsi = day.sections.findIndex((s, k) => k !== si && s && Array.isArray(s.items));
  day.sections[tsi].items.push({ name:X, detail:DUP }); return { X, tsi, tii:day.sections[tsi].items.length - 1 }; }
row('G5c', () => {
  const bad = [];
  { const { day, si } = fixtureM(), { X } = inject(day, si), before = J(day.sections);
    tap(day, si, 0, 'Dumbbell goblet squat'); IA.eval('undoSwap(' + JSON.stringify(X) + ')');
    if(J(day.sections) !== before) bad.push('tap A, undo'); }
  { const { day, si } = fixtureM(), { X, tsi, tii } = inject(day, si), before = J(day.sections);
    tap(day, si, 0, 'Dumbbell goblet squat'); tap(day, tsi, tii, 'Dumbbell goblet squat'); IA.eval('undoSwap(' + JSON.stringify(X) + ')');
    if(J(day.sections) !== before) bad.push('tap A, tap B, undo'); }
  { const { day, si } = fixtureM(), { X, tsi, tii } = inject(day, si), before = J(day.sections);
    tap(day, si, 0, 'Dumbbell goblet squat'); IA.ctx.__S = store(); IA.eval('applySessionSwaps(activeProg,__S)');
    const renamed = day.sections[tsi].items[tii].name === 'Dumbbell goblet squat';
    IA.eval('undoSwap(' + JSON.stringify(X) + ')');
    if(!renamed) bad.push('reboot re-apply did not rename B (fixture)'); else if(J(day.sections) !== before) bad.push('tap A, reboot re-apply, undo: B ' + day.sections[tsi].items[tii].detail); }
  return [!bad.length, bad.join('; ')];
});
row('G5d', () => {
  const { day, si } = fixtureM(), X = day.sections[si].items[0].name;
  tap(day, si, 0, 'Dumbbell goblet squat');
  const s = store(); s.w5_thu = (s.w5_thu || []).map(e => ({ from:e.from, to:e.to, ts:e.ts })); LS.setItem('ia_swaps_P1', JSON.stringify(s));
  let threw = null; try { IA.eval('undoSwap(' + JSON.stringify(X) + ')'); } catch(e){ threw = e.message; }
  const it = day.sections[si].items[0];
  return [threw === null && it.name === X && !store().w5_thu, 'threw ' + threw + ', ' + it.name + ', record ' + JSON.stringify(store().w5_thu || null)];
});

// G6b / G6c named pairs
function namedPair(cfg, w, d, fromName, to){
  LS.clear(); const p = IA.buildProgram(cfg), prog = Object.assign({}, p, { cfg }), day = prog.weeks[w][d];
  let si = -1, ii = -1; day.sections.forEach((s, a) => { if(si < 0 && /^main/i.test(clean(s.label))) (s.items || []).forEach((x, b) => { if(ii < 0 && clean(x.name) === fromName){ si = a; ii = b; } }); });
  if(si < 0) return { miss:'fixture moved: no Main ' + fromName + ' on W' + w + ' ' + d };
  const D = day.sections[si].items[ii].detail, r = liveSwap(prog, w, d, si, ii, to); return { D, O:r.item.detail, toast:r.toast };
}
const HB = () => mk('home_basic', 'strength', 'beginner', LO, HEALTHY, 76308);
row('G6b', () => { const r = namedPair(HB(), 1, 'mon', 'Dumbbell decline press', 'Dips'); if(r.miss) return [false, r.miss];
  return [r.toast === T119('Dips', 'Dumbbell decline press') && r.O !== r.D && !GRAM.test(r.O), r.toast + ' :: ' + r.O]; });
row('G6c', () => { const r = namedPair(HB(), 1, 'tue', 'Dumbbell Romanian deadlift', 'Kettlebell single-leg deadlift'); if(r.miss) return [false, r.miss];
  const m = GRAM.exec(r.D || '');
  return [!!m && +m[2] === 6 && r.O === r.D && r.toast === TSAME('Kettlebell single-leg deadlift', 'Dumbbell Romanian deadlift'), r.D + ' => ' + r.O + ' :: ' + r.toast]; });

// G7-1a build path and reboot with W1 frozen
row('G71a', () => {
  LS.clear(); const PREF = { 'Barbell box squat':'Dumbbell goblet squat' };
  const c0 = MARIO(), p0 = IA.buildProgram(c0), cP = Object.assign(MARIO(), { exSwapPrefs:Object.assign({}, PREF) }), cPj = JSON.stringify(cP);
  const pp = IA.buildProgram(cP); const bad = [];
  if(JSON.stringify(cP) !== cPj) bad.push('cfg mutated by buildProgram');
  const slots = [];
  Object.keys(p0.weeks).forEach(w => Object.keys(p0.weeks[w]).forEach(d => { const a = p0.weeks[w][d]; if(!a || !Array.isArray(a.sections)) return;
    a.sections.forEach((s, k) => (s.items || []).forEach((x, j) => { if(x.name === 'Barbell box squat') slots.push({ w, d, k, j, D:x.detail }); })); }));
  const want = sl => { const H = handKind('Dumbbell goblet squat', sl.D); return H.k === 'win' ? H.out : sl.D; };
  const wins = slots.filter(sl => handKind('Dumbbell goblet squat', sl.D).k === 'win');
  const at = (P, sl) => { const y = P.weeks[sl.w] && P.weeks[sl.w][sl.d]; const x = y && y.sections && y.sections[sl.k] && y.sections[sl.k].items[sl.j]; return x || {}; };
  slots.forEach(sl => { const x = at(pp, sl); if(x.name !== 'Dumbbell goblet squat' || x.detail !== want(sl)) bad.push('build W' + sl.w + ' ' + sl.d + ' ' + x.name + ' :: ' + x.detail); });
  // reboot: stored program carries the pref, W1's box squat day was trained (ia_hist_), no clock so the cut is 2
  const w1 = slots.filter(sl => +sl.w === 1)[0];
  if(!w1) bad.push('fixture: no W1 box squat');
  else {
    const stored = JSON.parse(JSON.stringify(pp)); Object.assign(stored, { id:'PF', name:'F', created:1, startDate:null, cfg:JSON.parse(cPj) });
    const snap = JSON.parse(JSON.stringify(p0.weeks[1][w1.d]));
    IA.ctx.__SP = stored; IA.eval('savePrograms([__SP]);');
    LS.setItem('ia_hist_PF', JSON.stringify({ ['w1_' + w1.d]:snap }));
    const rb = IA.eval("refreshProgram(getPrograms().find(function(x){return x.id==='PF';}))");
    if(J(rb.weeks[1][w1.d]) !== J(snap)) bad.push('frozen W1 ' + w1.d + ' not byte-identical to its snapshot');
    slots.filter(sl => +sl.w > 1).forEach(sl => { const x = at(rb, sl); if(x.name !== 'Dumbbell goblet squat' || x.detail !== want(sl)) bad.push('reboot W' + sl.w + ' ' + sl.d + ' ' + x.name + ' :: ' + x.detail); });
  }
  return [slots.length > 1 && wins.length > 0 && !bad.length, 'pref slots ' + slots.length + ', under window ' + wins.length + '; ' + bad.slice(0, 4).join('; ')];
});
row('G71b', () => {
  const html = IA.html.replace(/^\s*\/\/.*$/gm, '');
  const doctrine = html.indexOf(DOCTRINE_KNEE) >= 0;
  const PREF = { 'Barbell box squat':'Box jumps' }, count = P => { let n = 0; Object.values(P.weeks).forEach(W => Object.values(W).forEach(D =>
    ((D && D.sections) || []).forEach(s => ((s && s.items) || []).forEach(x => { if(x && /jump/i.test(x.name || '')) n++; })))); return n; };
  const h = MARIO(); delete h.injury; h.exSwapPrefs = Object.assign({}, PREF);
  const k = Object.assign(MARIO(), { exSwapPrefs:Object.assign({}, PREF) });
  const nh = count(IA.buildProgram(h)), nk = count(IA.buildProgram(k));
  return [doctrine && nh > 0 && nk === 0, 'doctrine ' + doctrine + ', healthy jump items ' + nh + ', knee/workaround ' + nk];
});

// G7-2 frozen day: ia_hist_ snapshot at 4×3, restored on boot, re-swapped live (gate-scope item 2, restated)
row('G72a', () => {
  LS.clear(); const cfg = MARIO(), p = IA.buildProgram(cfg);
  const stored = JSON.parse(JSON.stringify(p)); Object.assign(stored, { id:'PH', name:'H', created:1, startDate:null, cfg:MARIO() });
  const snap = JSON.parse(JSON.stringify(p.weeks[5].thu)), si = mainIdx(snap);
  if(clean(snap.sections[si].items[0].name) !== 'Barbell box squat' || snap.sections[si].items[0].detail !== DONOR_M) return [false, 'fixture moved'];
  IA.ctx.__SP = stored; IA.eval('savePrograms([__SP]);'); LS.setItem('ia_hist_PH', JSON.stringify({ w5_thu:snap }));
  const boot = () => IA.eval("activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PH';}));activeProgId='PH';currentWeek=5;currentDayKey='thu';activeProg.weeks[5].thu");
  const day = boot(); const restored = J(day) === J(snap);
  IA.ctx.__c = { secIdx:si, itemIdx:0, name:day.sections[si].items[0].name, detail:day.sections[si].items[0].detail };
  IA.eval("globalThis.__T=null;_swapCtx=__c;applySwapChoice('Dumbbell goblet squat')");
  const live = IA.eval('activeProg.weeks[5].thu').sections[si].items[0], toast = IA.eval('globalThis.__T');
  return [restored && live.name === 'Dumbbell goblet squat' && live.detail === EXPG && toast === EXPT, 'restored ' + restored + ', live ' + live.name + ' :: ' + live.detail + ' :: ' + toast];
});

// L2 (pair): G7-4 engine cards, G8a add path
if(PAIR){
  const Q = { cfgs:0, crash:[], cards:0, cardDiff:0, dig:0, self:0, selfBad:0, add:0, addDiff:0, days:0, ex:[] };
  const acE = IA.eval('addCandidates'), adE = IA.eval('addedDetailFor'), adB = B.eval('addedDetailFor');
  L2.forEach((cfg, n) => {
    let pb, pe; try { pb = B.buildProgram(cfg); pe = IA.buildProgram(cfg); } catch(e){ Q.crash.push(e.message); return; }
    Q.cfgs++;
    if(n % 6 === 0){ Q.self++; if(progDigest(B.buildProgram(cfg)) !== progDigest(pb)) Q.selfBad++; }
    if(progDigest(pb) !== progDigest(pe)) Q.dig++;
    const pbc = Object.assign({}, pb, { cfg }), pec = Object.assign({}, pe, { cfg });
    Object.keys(pe.weeks).forEach(w => Object.keys(pe.weeks[w]).forEach(d => {
      const de = pe.weeks[w][d], db = pb.weeks[w] && pb.weeks[w][d];
      if(!de || de.rest || !Array.isArray(de.sections)){ if(J(de) !== J(db)) Q.cardDiff++; return; }
      Q.days++;
      if(!db || !Array.isArray(db.sections) || db.sections.length !== de.sections.length){ Q.cardDiff++; return; }
      de.sections.forEach((s, si) => { const sb = db.sections[si]; (s.items || []).forEach((it, ii) => { Q.cards++;
        const ib = sb && sb.items && sb.items[ii]; if(!ib || ib.name !== it.name || ib.detail !== it.detail){ Q.cardDiff++; if(Q.ex.length < 3) Q.ex.push('W' + w + ' ' + d + ' ' + it.name); } }); });
      let ac = null; try { ac = acE(de, w, pec); } catch(e){}
      if(!ac) return;
      [].concat(ac.gap || [], ac.more || [], ac.off || []).forEach(nm => { Q.add++;
        let a, b; try { a = sdB(nm, adB(db, nm, w, pbc)); b = sdE(nm, adE(de, nm, w, pec)); } catch(e){ a = 'threw'; b = 'threw ' + e.message; }
        if(a !== b){ Q.addDiff++; if(Q.ex.length < 6) Q.ex.push('add ' + nm + ' :: ' + a + ' => ' + b); } });
    }));
  });
  console.log('  L2: ' + Q.cfgs + '/' + L2.length + ' builds, ' + Q.days + ' training days, ' + Q.cards + ' cards, ' + Q.add + ' add-path details | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  pairRow('G74', !Q.crash.length && Q.cards > 0 && Q.self > 0 && Q.selfBad === 0 && Q.cardDiff === 0 && Q.dig === 0 && S.mainDiff > 0,
    Q.cardDiff + ' cards, ' + Q.dig + ' digests moved; V220 self ' + (Q.self - Q.selfBad) + '/' + Q.self + '; crashes ' + Q.crash.length + ' ' + Q.ex.join('; '));
  pairRow('G8a', !Q.crash.length && Q.add > 0 && Q.addDiff === 0, Q.addDiff + ' of ' + Q.add + ' ' + Q.ex.filter(s => /^add/.test(s)).join('; '));
} else { pairRow('G74', false, 'no pair'); pairRow('G8a', false, 'no pair'); }

// G8b the add-path fallback, read from the candidate's source (comments stripped)
row('G8b', () => {
  const i = IA.js.indexOf('function addedDetailFor('), k = IA.js.indexOf('\nfunction ', i + 1);
  if(i < 0 || k < 0) return [false, 'addedDetailFor not found'];
  const body = IA.js.slice(i, k).replace(/^\s*\/\/.*$/gm, '');
  const m = body.match(/return\s+('(?:[^'\\]|\\.)*')\s*;\s*\}\s*$/);
  if(!m) return [false, 'no trailing literal return'];
  const lit = Function('"use strict";return ' + m[1])();
  const g = GRAM.exec(lit), lows = HAND_FLOOR.filter(r => r[1] && r[1][1] !== 0).map(r => r[1][0]), maxLo = Math.max.apply(null, lows);
  const probes = ['Dumbbell goblet squat', 'Kettlebell swing', 'Barbell hip thrust', 'Landmine rotational press', 'Dumbbell row', 'Leg press', 'Cable lateral raise'];
  const moved = probes.filter(n => sdE(n, lit) !== lit);
  return [lit === FALLBACK && !!g && +g[2] >= maxLo && !moved.length, JSON.stringify(lit) + ' grammar ' + !!g + ' low ' + (g && g[2]) + ' vs max window low ' + maxLo + ' moved ' + moved.join(',')];
});

// G9 HALF_MANNY
if(VER === ERA) row('G9', () => { const a = progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY)), b = progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY));
  return [a === MANNY && a === b, a + ' / ' + b]; });
else skipRow(R.G9, 'scoped out, candidate ' + VER + ': a later ruling owns HALF_MANNY (standing ruling 5)');
console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
done();
