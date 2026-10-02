// g227_d190_prefpath.js — GATE for D190 (P-SWAPSEAM), the BUILD PATH: cfg.exSwapPrefs through applySwapPrefs inside
// buildProgram. The plan's hold cue belongs to the plan and the movement on the card, never to the movement the
// preference took off the card. D-code D190, ships on ia-version 227.
//
//   node tests/gates/g227_d190_prefpath.js <candidate.html> [baseline_V226.html]
//   IA_ASSUME_VERSION=227 node tests/gates/g227_d190_prefpath.js <tree stamped 226> [baseline_V226.html]   (discrimination only)
//
// THE RULING THIS DEFENDS: tests/measure/v227_rulings/d190_swapseam_ruling.md, RE-RULING 1 (the live text where it
// differs from the original), section B "U2: the build path is licensed, as D190 Classes (ii+g) and (iii)": rows
// (c2-i), (c2-ii), (c2-iii), the "6 neither cards" paragraph, and the build-path rows of the RE-RULING 1 "Before (V226)
// and After (D190, expected)" table; R1 and R2 of the original ruling (one writer for the cue, a cue-blind carry at
// the applySwapPrefs hop). Mario: "Ship D190 at V227". Evidence: measure_d190_unknowns_v226.md (U2) and
// measure_d190_p9p10_v226.md (P9a, P9b). The live tap, the boot replay and undo are g227_d190_swapseam.js, not this gate.
//
// ORACLE. The engine is never asked for an expected value:
//   CUE     the plan's cue literal, typed here: ' — hold RPE 7, two in the tank' (real em-dash).
//   CAP     the workaround cap table, typed from the ruling header: knee squat, lunge, leg_iso; ankle squat, lunge;
//           hip hinge, lunge, hip_ext, squat; lowback hinge, squat, row, hip_ext; shoulder hpress, vpress, delt_iso;
//           elbow hpress, tri_iso, bi_iso, row, vpull. A movement's pattern comes from the engine's classifier
//           _pattern (not under test; D190 does not touch it); the HAND rows type their pattern too and assert the
//           classifier agrees.
//   UNINJ   row c2-ii's reference is the UNINJURED build carrying the same preference, built on the BASELINE (V226,
//           see VERSION PREDICATE), so it never meets the code under test and never meets a cue (an uninjured plan caps nothing).
//   V226    row c2-iii only: the baseline's build of the same injured config with the same preference.
//   HAND    the ruling's own strings for the build-path rows of its Before/After table.
//
// POPULATION. Full enumeration, no sample (about 820 builds, ~10 s). MARIO = commercial|support_strength|beginner|
//   liftonly, seed 76308, program start 2026-08-24, clock pinned 2026-09-24. The six injured workaround lattice configs:
//   MARIO with injury knee, ankle, lowback, hip, elbow, shoulder at the workaround tier (U2's five plus ankle, P9b).
//   Enumerated on the tree under test with measure's method (tests/measure/v227_d190_unknowns.js U2, v227_d190_p9p10.js
//   P9b): a NATIVELY CUED SOURCE is a movement on the injured no-pref build with a card whose detail ends with CUE; its
//   targets are the swap sheet's own candidate list for that movement (swapCandidates tier1+tier2, or
//   auxSwapCandidates for a null-pattern aux-family item) taken on the first day it is cued. One build per
//   (config, source, target) with cfg.exSwapPrefs = {source: target}. Measure's counts on V226: knee 2 sources /
//   12 prefs, ankle 1/5, lowback 4/40, hip 6/47, elbow 12/106, shoulder 8/63 = 273 builds. Every config must
//   contribute at least one pref build or every row FAILs (the sabotage classes live in all six).
//   A SLOT is (week, day, section index, item index). A TARGET CARD is a card whose name is the pref's target.
//
// BOOT MODEL. There are no swap acts and no gate boots. Every build is buildProgram on a fresh VM (load() is a few ms),
//   with the cfg cloned per build so cfg is never mutated. The only page load is the candidate enumeration: per
//   config, a fresh VM stores the injured no-pref program and refreshProgram boots it, so swapCandidates reads
//   activeProg exactly as the sheet does. SELFCHECK proves, on each tree: a build equals itself on two fresh VMs
//   (clock fields stripped, non-empty), cfg is unmutated by buildProgram, cfg.seed is pinned at 76308; and per config
//   the enumeration boot equals itself on a second fresh page (same candidate list for the first cued source).
//
// VERSION PREDICATE (standing rulings 2 and 4). D190 ships at 227.
//   below 227   REFUSED, every assertion row FAILS by name.
//   227 and up  every row asserts.
//   IA_ASSUME_VERSION=227 lifts a file stamped exactly 226 to 227 for a discrimination run. It is announced, ignored on
//   any other file, and gate.sh never sets it.
//   Baseline    rows c2-ii (its reference) and c2-iii (the pair) read the baseline from argv[3] if it reads 226, else
//               from `git show 637bc8e24a243daf3803a554125bba117f44281f:index.html` (V226) into os.tmpdir():
//               tests/sabotage.py passes no argv[3] (the V226 slice 7e defect; the fix is the g225_d187_pacerate.js
//               / g226 form). The run prints which source it used. If neither yields a tree reading 226 (git
//               missing, the commit unreadable), those rows FAIL setup by name, never PASS. Row c2-i and the HAND
//               row need no baseline.
//
// ROWS
//   c2-i    cue <=> cap on every built card of every pref build: a card ends with CUE iff the plan caps its pattern
//           (CAP, classifier) and the cue-free dose carries no "RPE". 0 violations, |cards| > 0. Measure: V226 fails on
//           192 cards (U2) plus ankle's 18 ii+g cards (P9b) = 210; D190 0. The baseline's count prints as INFO. Printed by
//           this file on V226: 210 cards in 71 builds (the ruling's "138 builds" is U2's count of builds that MOVED by
//           ii+g or iii; only the ii+g cards break cue <=> cap, and they sit in 71 builds). 49,218 cards in 273 builds.
//   c2-ii   the uninjured-plus-same-pref reference, restricted structurally: on every TARGET CARD of every pref build
//           where the uninjured build with the same pref (baseline) prints the same name in the same SLOT and the
//           injured plan does not cap that pattern, detail byte-equal. 0 mismatches, |population| > 0. The predicate,
//           never a name, excludes P9's 6 "neither" cards (2 lowback: different name in the slot and a capped pattern;
//           4 shoulder: capped). |population|, the excluded count by reason, and measure's label-keyed reconciliation
//           (U2's key: week, day, section label, name; 212 of 218 comparable cards on the five U2 configs) print as INFO.
//           Printed by this file on D190: by the SLOT above the population is 138 target cards (68 of them moved vs
//           V226, and V226 equals the reference on 0 of those 68), 0 mismatches; excluded 1,182 (capped 634, slot 180,
//           slot+capped 368). U2's label key reproduces measure exactly: 212 artifact == reference, 6 neither (lowback 2,
//           shoulder 4), 172 no reference, plus ankle 12 == reference and 6 no reference. The ruling's "212 of 212" is
//           that label-keyed count; the index SLOT is the stricter key this file asserts on.
//   c2-iii  PAIR vs V226: every card of the artifact's pref build equals the baseline's pref build of the same cfg, in
//           name and detail, slot for slot, except the pref target's cards. 0 non-target cards moved, |compared| > 0.
//   c2-hand HAND, the ruling's Before/After build-path rows: knee/wa pref {Reverse lunge (KB) -> Dumbbell split-stance
//           deadlift} [hinge, uncapped on knee], W3 THU and W4 THU Leg superset A, reads `2×8–12 each @ RPE 7`
//           (V226 `2×10 each — hold RPE 7, two in the tank`); shoulder/wa pref {Dumbbell incline press -> Cable
//           pushdown} [tri_iso, uncapped on shoulder], W1 MON, reads `3×8–12 @ RPE 6–7` (V226 `3×10 — hold RPE 7, two
//           in the tank`). Every such cell exists, reads exactly the D190 string, and the classifier agrees with the typed
//           pattern.
//
// DISCRIMINATION. On base_v226 with IA_ASSUME_VERSION=227 and argv[3] = base_v226: c2-i FAILS (210 cards in 71 builds
//   = U2's 192 plus P9b's 18 ankle ii+g), c2-ii FAILS (68 mismatches of 138: every moved in-population card; V226
//   matches 0 of them), c2-hand FAILS (3 cells, the V226 cued strings), and c2-iii PASSES as a control (the pair is V226
//   against itself). base_v226 plain: REFUSED, every row FAILS by name. On D190 (index.html V227, argv[3] base_v226):
//   4 PASS, about 8 s.
//
// SABOTAGE this file is meant to catch: M3, drop the boot-hop strip in applySwapPrefs
//   (`_swapDetailFor(to,_stripCapCue(it.detail))` -> `_swapDetailFor(to,it.detail)`): the build path carries the cue
//   again, c2-i trips at measure's count (210 cards in 71 builds) and c2-ii trips (68 of 138); c2-hand trips; c2-iii
//   stays green (the mutant is the baseline's behaviour).
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 227, BASE_ERA = 226;
const V226_COMMIT = '637bc8e24a243daf3803a554125bba117f44281f';   // V226: D188/D189 (the V226 artifact, forever)
let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

const R = {
  C2I:   'row c2-i    cue <=> cap on every built card of every pref build (natively cued source x every sheet candidate, six workaround regions): cue iff pattern capped and the cue-free dose carries no RPE',
  C2II:  'row c2-ii   uninjured-plus-same-pref reference (baseline), structural population (same name in the same slot on the uninjured build, pattern uncapped on the plan): target-card detail byte-equal',
  C2III: 'row c2-iii  PAIR vs V226: no card other than the pref target moves, slot for slot, on every pref build',
  C2H:   'row c2-hand HAND build-path rows of the ruling: knee/wa {Reverse lunge (KB) -> DB split-stance DL} W3/W4 THU `2×8–12 each @ RPE 7`; shoulder/wa {DB incline press -> Cable pushdown} W1 MON `3×8–12 @ RPE 6–7`',
};

// ── ORACLE (typed) ────────────────────────────────────────────────────────────────────────────────────────────────
// CUE is typed after the version predicate below (V228 D193 R1, split): it reads VER.
const CAP = { knee:['squat', 'lunge', 'leg_iso'], ankle:['squat', 'lunge'], hip:['hinge', 'lunge', 'hip_ext', 'squat'],
  lowback:['hinge', 'squat', 'row', 'hip_ext'], shoulder:['hpress', 'vpress', 'delt_iso'], elbow:['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'] };
const HAND = [
  { reg:'knee', src:'Reverse lunge (KB)', tgt:'Dumbbell split-stance deadlift', pat:'hinge', label:'Leg superset A',
    cells:[[3, 'thu'], [4, 'thu']], v226:'2×10 each — hold RPE 7, two in the tank', d190:'2×8–12 each @ RPE 7' },
  { reg:'shoulder', src:'Dumbbell incline press', tgt:'Cable pushdown', pat:'tri_iso', label:null,
    cells:[[1, 'mon']], v226:'3×10 — hold RPE 7, two in the tank', d190:'3×8–12 @ RPE 6–7' },
];

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24', SEED = 76308;
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  bench:135, squat:155, deadlift:185, seed:SEED };
const REGIONS = ['knee', 'ankle', 'lowback', 'hip', 'elbow', 'shoulder'];
const clone = x => JSON.parse(JSON.stringify(x));
const cfgOf = (reg, pref) => { const c = clone(MARIO); if(reg) c.injury = { region:reg, tier:'workaround' }; if(pref) c.exSwapPrefs = clone(pref); return c; };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i;
const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};";
const FILES = { C:ART, B:null };
function fresh(which){ const T = load(FILES[which]); T.__tag = which; pin(T); return T; }
let NBUILD = 0;
// one build on a fresh VM; the cfg handed to the engine is a clone, so the caller's cfg is never touched
function build(which, cfg){ const X = fresh(which); NBUILD++; return X.buildProgram(clone(cfg)); }
function cards(p){ const m = new Map(); if(!p || !p.weeks) return m;
  Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w] || {}).forEach(d => { const dy = p.weeks[w][d];
    ((dy && Array.isArray(dy.sections)) ? dy.sections : []).forEach((s, si) => ((s && s.items) || []).forEach((it, ii) => {
      if(!it) return; const k = w + '|' + d + '|' + si + '|' + ii; m.set(k, { k, w:+w, d, si, ii, label:clean(s.label), n:clean(it.name), det:typeof it.detail === 'string' ? it.detail : '' }); })); }));
  return m; }
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const cardTag = c => 'W' + c.w + ' ' + c.d + ' [' + c.si + '][' + c.ii + '] ' + c.label + ' :: ' + c.n + ' ' + JSON.stringify(c.det);

// ── LOAD + VERSION PREDICATE ─────────────────────────────────────────────────────────────────────────────────────
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION !== undefined){
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  } else console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
// V228 D193 R1 (split, Mario round 2; Amendment 2 "g227 gates"): the hand cue literal is version-predicated on the artifact's own ia-version, "three" at 228 and above, "two" at 227 and below, so the row still runs on V227. Sited here, after VER: VER is a `let` declared above, so the old site (the HAND ORACLE / ORACLE block) would read it in its temporal dead zone.
const CUE = VER >= 228 ? ' — hold RPE 7, three in the tank' : ' — hold RPE 7, two in the tank';
console.log('g227 D190 pref path | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + ' | baseline ' + (BASEFILE || '(none)'));
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D190 P-SWAPSEAM (V' + ERA + '). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
// V226 baseline for rows c2-ii and c2-iii (V227 slice 10, the V226 slice 7e form of g225_d187_pacerate.js and the g226
// gates): argv[3] if it reads 226, else `git show <V226_COMMIT>:index.html` into os.tmpdir(), because
// tests/sabotage.py passes no argv[3]. fresh('B') reloads FILES.B on every chain, so the git copy lives until
// exit. No tree reading 226 leaves B null and the pair rows FAIL setup by name, never PASS.
let B = null, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!B){
  const f = path.join(os.tmpdir(), 'g227_d190_prefpath_v' + BASE_ERA + '_' + process.pid + '.html');
  try {
    try { fs.unlinkSync(f); } catch(e){}
    process.on('exit', () => { try { fs.unlinkSync(f); } catch(e){} });
    fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V226_COMMIT + ':index.html'], { maxBuffer: 1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ B = b; FILES.B = f; baseWhy += 'git show ' + V226_COMMIT.slice(0, 7) + ':index.html (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
console.log('  V226 baseline: ' + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
const NOBASE = B ? '' : ' (setup: no V226 baseline: ' + baseWhy + ')';
// classifier (not under test): the artifact's _pattern
const PAT = {}; const pat = n => (n in PAT) ? PAT[n] : (PAT[n] = E(IA, '(function(){try{return _pattern(' + JSON.stringify(n) + ')||null;}catch(e){return null;}})()'));
const capped = (reg, n) => { const p = pat(n); return !!p && CAP[reg].includes(p); };
const stripCue = d => d.endsWith(CUE) ? d.slice(0, d.length - CUE.length) : d;
// the c2-i predicate, from the ruling's text
const cueViol = (reg, c) => c.det.endsWith(CUE) !== (capped(reg, c.n) && !/RPE/.test(stripCue(c.det)));

// ── SELFCHECK ────────────────────────────────────────────────────────────────────────────────────────────────────
const self = {};
for(const which of ['C', 'B']){ if(which === 'B' && !B) continue;
  const cfg = cfgOf(HAND[0].reg, { [HAND[0].src]:HAND[0].tgt }); const before = JSON.stringify(cfg);
  const X1 = fresh(which), X2 = fresh(which); const p1 = X1.buildProgram(cfg); const unmut = JSON.stringify(cfg) === before;
  const p2 = X2.buildProgram(clone(cfg)); const j1 = JS(p1), j2 = JS(p2);
  const p3 = X1.buildProgram(clone(cfg)); const sameVM = JS(p3) === j1;
  self[which] = j1 === j2 && j1.length > 1000 && unmut && cfg.seed === SEED && cards(p1).size > 0;
  console.log('  SELFCHECK ' + which + ': fresh build == fresh build ' + (j1 === j2) + ' (' + j1.length + ' bytes, ' + cards(p1).size + ' cards) | cfg unmutated ' + unmut + ' | seed ' + cfg.seed + ' | INFO same-VM rebuild equal ' + sameVM);
}

// ── ENUMERATE the population on the tree under test (measure's U2 / P9b method) ──────────────────────────────────
const POP = []; const enumInfo = {};
for(const reg of REGIONS){
  const X = fresh('C'); E(X, HELP); const cfg = cfgOf(reg); const p = X.buildProgram(clone(cfg)); const nat = [...cards(p).values()];
  const cued = nat.filter(c => c.det.endsWith(CUE)); const srcs = [...new Set(cued.map(c => c.n))];
  const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) });
  const bootPage = () => { const P = fresh('C'); E(P, HELP); P.localStorage.clear(); P.ctx.__SP = clone(st); E(P, 'savePrograms([__SP]);');
    E(P, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();"); return P; };
  const P = bootPage();
  const candsOf = (T, c0) => { T.ctx.__D = E(T, 'activeProg.weeks[' + c0.w + '].' + c0.d); return T.ctx.__D ? Array.from(E(T, '__cands(__D,' + c0.w + ',' + JSON.stringify(c0.n) + ')')) : []; };
  let nPref = 0; const perSrc = [];
  srcs.forEach((s, i) => { const c0 = cued.find(c => c.n === s); const tg = candsOf(P, c0);
    if(i === 0){ const P2 = bootPage(); self['enum ' + reg] = JSON.stringify(candsOf(P2, c0)) === JSON.stringify(tg) && tg.length > 0; }
    perSrc.push(s + ' (W' + c0.w + ' ' + c0.d + ') ' + tg.length);
    tg.forEach(t => { if(t === s) return; POP.push({ reg, src:s, tgt:t }); nPref++; }); });
  if(!srcs.length) self['enum ' + reg] = false;
  enumInfo[reg] = { cuedCards:cued.length, srcs:srcs.length, prefs:nPref, nativeViol:nat.filter(c => cueViol(reg, c)).length, nativeCards:nat.length };
  console.log('  POP ' + reg.padEnd(8) + ' natively cued cards ' + cued.length + ', sources ' + srcs.length + ', pref builds ' + nPref + ' | ' + perSrc.join('; ')
    + ' | INFO no-pref build cue<=>cap violations ' + enumInfo[reg].nativeViol + '/' + nat.length);
}
const SELF = Object.values(self).length > 0 && Object.values(self).every(Boolean);
const COVER = REGIONS.every(r => enumInfo[r] && enumInfo[r].prefs > 0);
console.log('  SELFCHECK ' + JSON.stringify(self) + ' => ' + SELF + ' | every region contributes a pref build: ' + COVER + ' | pref builds ' + POP.length);

// ── BUILD every pref config: artifact, baseline, uninjured+pref on the baseline ─────────────────────────────────────
const uniCache = new Map();
const S1 = { cards:0, viol:[], builds:new Set(), bViol:0, bBuilds:new Set() };
const S2 = { pop:0, ne:[], excl:{}, exclMoved:{}, popMoved:0, popMovedBaseEq:0, popMovedBaseNe:0, lab:{} };
const S3 = { compared:0, moved:[], tgtMoved:0, tgtCards:0, builds:0 };
const byReg = {};
for(const r of POP){
  const pref = { [r.src]:r.tgt }; const id = r.reg + ' {' + r.src + ' -> ' + r.tgt + '}';
  const A = cards(build('C', cfgOf(r.reg, pref)));
  const Bc = B ? cards(build('B', cfgOf(r.reg, pref))) : null;
  let U = null; if(B){ const uk = JSON.stringify(pref); if(!uniCache.has(uk)) uniCache.set(uk, cards(build('B', cfgOf(null, pref)))); U = uniCache.get(uk); }
  const br = byReg[r.reg] = byReg[r.reg] || { builds:0, cards:0, viol:0, pop:0, ne:0, moved:0, bViol:0 }; br.builds++;
  // c2-i
  for(const c of A.values()){ S1.cards++; br.cards++; if(cueViol(r.reg, c)){ S1.viol.push(id + ' ' + cardTag(c) + ' [' + (pat(c.n) || '-') + ']'); S1.builds.add(id); br.viol++; } }
  if(Bc) for(const c of Bc.values()) if(cueViol(r.reg, c)){ S1.bViol++; S1.bBuilds.add(id); br.bViol++; }
  // c2-ii (target cards of the artifact's build)
  if(U){
    const labMap = new Map(); for(const u of U.values()) labMap.set(u.w + '|' + u.d + '|' + u.label.replace(/ — .*/, '') + '|' + u.n, u.det);
    for(const a of A.values()){ if(a.n !== r.tgt) continue;
      const u = U.get(a.k), b = Bc.get(a.k); const sameSlot = !!u && u.n === a.n, cap = capped(r.reg, a.n);
      const moved = !b || b.n !== a.n || b.det !== a.det;
      if(sameSlot && !cap){ S2.pop++; br.pop++;
        if(u.det !== a.det){ S2.ne.push(id + ' ' + cardTag(a) + ' vs uninjured ' + JSON.stringify(u.det)); br.ne++; }
        if(moved){ S2.popMoved++; if(b && b.n === u.n && b.det === u.det) S2.popMovedBaseEq++; else S2.popMovedBaseNe++; } }
      else { const why = (sameSlot ? '' : 'slot') + (!sameSlot && cap ? '+' : '') + (cap ? 'capped' : ''); S2.excl[why] = (S2.excl[why] || 0) + 1; if(moved) S2.exclMoved[why] = (S2.exclMoved[why] || 0) + 1; }
      if(moved){ const ld = labMap.get(a.w + '|' + a.d + '|' + a.label.replace(/ — .*/, '') + '|' + a.n);
        const k = r.reg + ' ' + (ld === undefined ? 'no ref' : ld === a.det ? 'artifact == ref' : (b && ld === b.det) ? 'baseline == ref' : 'neither'); S2.lab[k] = (S2.lab[k] || 0) + 1; } }
  }
  // c2-iii (pair)
  if(Bc){ S3.builds++;
    const keys = new Set([...A.keys(), ...Bc.keys()]);
    for(const k of keys){ const a = A.get(k), b = Bc.get(k);
      const tgt = (a && a.n === r.tgt) || (b && b.n === r.tgt);
      if(tgt){ S3.tgtCards++; if(!a || !b || a.n !== b.n || a.det !== b.det){ S3.tgtMoved++; br.moved++; } continue; }
      S3.compared++;
      // V228 D193 R1 (split), class (i), predicate on VER: at 228 and above the V226 baseline detail's exact suffix
      // ' — hold RPE 7, two in the tank' is read as ' — hold RPE 7, three in the tank' before the byte compare, the word and nothing else;
      // below 228 the compare is unchanged. A cue that appears on or vanishes from a non-target card still moves it.
      const bDet = (b && VER >= 228 && b.det.endsWith(' — hold RPE 7, two in the tank')) ? b.det.slice(0, b.det.length - ' — hold RPE 7, two in the tank'.length) + ' — hold RPE 7, three in the tank' : (b && b.det);
      if(!a || !b || a.n !== b.n || a.det !== bDet) S3.moved.push(id + ' ' + k + ' V226 ' + (b ? b.n + ' ' + JSON.stringify(b.det) : '(none)') + ' => ' + (a ? a.n + ' ' + JSON.stringify(a.det) : '(none)')); } }
}
console.log('  built ' + NBUILD + ' programs (' + POP.length + ' pref configs; uninjured+pref references cached by pref: ' + uniCache.size + ')');
Object.keys(byReg).forEach(k => { const b = byReg[k]; console.log('    ' + k.padEnd(8) + ' builds ' + b.builds + ' | cards ' + b.cards + ' | c2-i violations ' + b.viol + (B ? ' (V226 INFO ' + b.bViol + ')' : '') + (B ? ' | c2-ii population ' + b.pop + ', mismatches ' + b.ne + ' | target cards moved vs V226 ' + b.moved : '')); });

// ── ROWS ─────────────────────────────────────────────────────────────────────────────────────────────────────────
{ // c2-i
  S1.viol.slice(0, 4).forEach(x => console.log('      c2-i violation: ' + x.slice(0, 300)));
  if(B) console.log('    c2-i INFO baseline (V226) on the same population: ' + S1.bViol + ' cards in ' + S1.bBuilds.size + ' builds (measure: U2 192 + P9b ankle 18 = 210)');
  ok(R.C2I, SELF && COVER && S1.cards > 0 && S1.viol.length === 0, S1.viol.length + ' violations of ' + S1.cards + ' cards, in ' + S1.builds.size + ' of ' + POP.length + ' builds');
}
{ // c2-ii
  const nExcl = Object.values(S2.excl).reduce((a, b) => a + b, 0);
  if(B){
    console.log('    c2-ii INFO |population| ' + S2.pop + ' target cards | excluded ' + nExcl + ' by reason ' + fmt(S2.excl) + ' | excluded and moved vs V226 ' + fmt(S2.exclMoved));
    console.log('    c2-ii INFO population cards moved vs V226 ' + S2.popMoved + ' (V226 == reference on ' + S2.popMovedBaseEq + ' of them, ruling: 0)');
    console.log('    c2-ii INFO measure U2 label-keyed reconciliation (week, day, section label, name; moved target cards): ' + fmt(S2.lab));
    S2.ne.slice(0, 4).forEach(x => console.log('      c2-ii mismatch: ' + x.slice(0, 300)));
  }
  ok(R.C2II + NOBASE, !!B && SELF && COVER && S2.pop > 0 && S2.ne.length === 0, B ? S2.ne.length + ' mismatches of ' + S2.pop + ' in population (excluded ' + nExcl + ')' : 'no baseline');
}
{ // c2-iii
  if(B){ console.log('    c2-iii INFO pref target cards moved vs V226 ' + S3.tgtMoved + ' of ' + S3.tgtCards + ' (licensed classes ii+g and iii; measure: 390 + ankle 18)');
    S3.moved.slice(0, 4).forEach(x => console.log('      c2-iii non-target moved: ' + x.slice(0, 300))); }
  ok(R.C2III + NOBASE, !!B && SELF && COVER && S3.builds === POP.length && S3.compared > 0 && S3.moved.length === 0,
    B ? S3.moved.length + ' non-target cards moved of ' + S3.compared + ' compared, ' + S3.builds + ' builds' : 'no baseline');
}
{ // c2-hand
  const bad = []; let cells = 0;
  for(const h of HAND){
    const pc = pat(h.tgt); if(pc !== h.pat) bad.push(h.tgt + ' classifier ' + pc + ' != typed ' + h.pat);
    if(CAP[h.reg].includes(h.pat)) bad.push(h.tgt + ' typed pattern ' + h.pat + ' is capped on ' + h.reg + ' (oracle broken)');
    const A = cards(build('C', cfgOf(h.reg, { [h.src]:h.tgt }))); const Bh = B ? cards(build('B', cfgOf(h.reg, { [h.src]:h.tgt }))) : null;
    for(const [w, d] of h.cells){
      const hit = [...A.values()].filter(c => c.w === w && c.d === d && c.n === h.tgt && (!h.label || c.label.replace(/ — .*/, '') === h.label));
      const bh = Bh ? [...Bh.values()].filter(c => c.w === w && c.d === d && c.n === h.tgt && (!h.label || c.label.replace(/ — .*/, '') === h.label)) : [];
      console.log('    c2-hand ' + h.reg + ' W' + w + ' ' + d + ' ' + h.tgt + ': ' + (hit.map(c => JSON.stringify(c.det)).join(', ') || '(no card)') + ' | expected ' + JSON.stringify(h.d190)
        + (Bh ? ' | INFO V226 ' + (bh.map(c => JSON.stringify(c.det)).join(', ') || '(no card)') + ' (ruling ' + JSON.stringify(h.v226) + ')' : ''));
      if(!hit.length) bad.push(h.reg + ' W' + w + ' ' + d + ' no ' + h.tgt + ' card');
      hit.forEach(c => { cells++; if(c.det !== h.d190) bad.push(h.reg + ' W' + w + ' ' + d + ' ' + JSON.stringify(c.det)); });
    }
  }
  ok(R.C2H, SELF && cells >= 3 && bad.length === 0, bad.length ? bad.join(' ; ').slice(0, 400) : cells + ' cells exact');
}
done();
