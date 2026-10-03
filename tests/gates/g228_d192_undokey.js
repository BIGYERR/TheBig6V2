// g228_d192_undokey.js — GATE for D192 (P-UNDOKEY): the undo chip names the lift that just left, and one undo walks back
// one step.
//
//   node tests/gates/g228_d192_undokey.js <candidate.html> [baseline_V227.html]
//   IA_ASSUME_VERSION=228 node tests/gates/g228_d192_undokey.js <tree stamped 227> [baseline_V227.html]   (discrimination only)
//
// THE RULING THIS DEFENDS: tests/measure/v228_rulings/d192_undokey_ruling.md, the RE-RULING for V228, sections 2, 3 and 5.
// D-code D192, ships on ia-version 228 (Mario, 2026-10-02, V228 chat: "2. concur": D192 P-UNDOKEY ships at V228).
//   §3 verbatim: "Changes: `swapOriginOf` :14179 takes the most recent record whose `to` is the card's name
//       (`.filter(...).pop()`). Nothing else. Deliberately does NOT change: `undoSwap` :14441 stays first-match (section 4).
//       `recordSwap` :10286's same-from filter stays (D191). `applySessionSwaps` replay order stays. `buildProgram`
//       untouched." And: "No pair row on U' boot: it would read created 2 and need the licence just refused."
//   §2 verbatim: "on every chain whose store is a complete history (hop `from` names pairwise distinct, read off the chain
//       tuple: D190's population U), boot == live after undo; on U' (a `from` repeats, so `recordSwap` :10286 has already
//       dropped a record) boot == live after undo is D191's claim to prove, and D192 neither owes it nor can deliver it."
//   §5 verbatim: "Oracle never asks `swapOriginOf` or `undoSwap`: the chip, the store and the undo target are read off the
//       chain tuple. Fresh VM per act and per boot (the 480 lesson)." And: "A created count above 2 on the same seed, or
//       any created chain whose froms are pairwise distinct, is a refutation, not INFO: stop and re-measure."
//
// ORACLE. The engine is never asked for an expected value. swapOriginOf and undoSwap are what the card does (the chip's
//   render calls swapOriginOf(i.name), its `put it back` button calls undoSwap(chip)), so the gate calls them exactly as
//   the card and the tap do and reads what they leave; every EXPECTED value comes off the chain tuple:
//   HAND CHIP   the last hop's `from`.
//   PRE         the whole day the live page showed before the last hop (clock fields stripped): d2-UNDO's expected day.
//   HAND STORE  on U, the day's store after undo is the chain's first n-1 hops as from->to in recording order
//               (recordSwap pushes; with pairwise distinct froms its same-from filter drops nothing).
//   U / U'      by hand: hop `from` names pairwise distinct / some `from` repeats (the store's population).
//   U_d / U_d'  by hand: hop `to` names pairwise distinct / some `to` repeats (the chip's population). A>B>C>B is in U and
//               in U_d'; A>B>A>B is in U' and in U_d' (ruling §5).
//   PIN         the ruling's Before/After chain, typed from the ruling: HALF_MANNY W3 Thu `Main — Trap bar deadlift`,
//               Trap bar deadlift > Barbell Romanian deadlift > Deadlift > Barbell Romanian deadlift. Chip `Deadlift`
//               (V227: Trap bar deadlift); store after undo [Trap bar deadlift->Barbell Romanian deadlift, Barbell Romanian
//               deadlift->Deadlift] (V227: [Barbell Romanian deadlift->Deadlift, Deadlift->Barbell Romanian deadlift]);
//               slot after undo: Deadlift. Folded into d2-CHIP (chip), d2-UNDO (store, slot) and d2-BOOT-U (the PIN is in
//               U and its fresh boot equals live; the name it boots to is d2-UNDO's claim, so the chip key stays out of
//               d2-BOOT-U).
//   V227        INFO only: the baseline's own act, chip, undo and boot of the same U' chain.
//   ERA TABLE   d2-MANNY: MANNY_DIGEST_BY_VERSION[VER] and the digest typed here, 0ac7da6b1691a8e1 (standing ruling 5,
//               unmoved; printed by coach on V227 and by measure on CF and CF2).
//
// POPULATION. Enumerated on the tree under test with measure's enumerator (tests/measure/v228_undokey.js :109-122, itself
//   g227's): a hop is taken only when its target is in the swap sheet's own candidate list for the item as it then stands
//   (swapCandidates tier1+tier2, or auxSwapCandidates for a null-pattern aux-family item) and the slot's canSwap flag is
//   on. Replay re-checks each hop (the card carries the hop's `from`, canSwap on, target offered); a chain with a hop not
//   offered at replay is dropped and counted.
//   WALK   the classes of g227's (d) walk (tests/gates/g227_d190_seam.js, ENUMERATE): hop1, hop2, cyc2, hop3, cyc3,
//          collide2, exch3. Configs: the ruling says "the five configs" and the g227 walk carries six, so the gate takes
//          the union: g227's six (MARIO under knee, ankle, hip, lowback, shoulder and elbow workaround) and measure's five
//          (mario knee/wa, lowback/wa, elbow/wa, HALF_MANNY, mario uninjured), eight configs, W3 and W5. hop3 is split by
//          shape off the chain tuple: A>B>C>D, A>B>C>B (strict revisit: the D192 class), A>B>A>B, A>B>A>C.
//          SAMPLED AT A FIXED SEED. The full walk (g227 P11: 15,202 chains) at one fresh VM per act and per boot does not
//          fit the runtime budget, so each (config, week, stratum) is a seeded reservoir (Algorithm R, seed
//          fnv1a(config|week|stratum)) over every reachable chain of that stratum on the seven days, KW per stratum
//          below. The denominators print; every stratum must be non-empty (d2-CHIP).
//   HOP4   lowback_wa W3 Mon+Tue: every 4-tap one-slot chain (measure enumerated 175,465), a seeded reservoir of K4 per
//          revisit shape A>B>C>D>B, A>B>C>D>C, A>B>C>A>C, A>B>A>C>A and K4O of every other shape.
//   HOP5   measure's sample exactly: lowback_wa W3 Mon+Tue, rnd = mulberry(0xC0FFEE + 3*7 + 'lowback_wa'.length*131),
//          1,000 draws off the hop3 enumeration in measure's order (v228_undokey.js :120-122), so its counts reproduce
//          (measure: U_d' 413, V227 wrong 191, U' boot != live CF 54 vs V227 76, created 2, healed 24).
//   PIN    the ruling's chain above.
//   Fixtures: MARIO = commercial|support_strength|beginner|liftonly, seed 76308, with injury {region, workaround} or none;
//   HALF_MANNY from the harness. cfg.seed is pinned on every config (checked). Program start 2026-08-24, clock pinned
//   2026-09-24.
// BOOT MODEL (the 480 lesson). Every chain is acted on its own fresh VM (fresh store, the stored program, a boot), and
//   every boot is its own fresh VM loaded with the device storage that act left. SELFCHECK proves a boot equals itself and
//   a fresh-page boot (whole W3 week) on every config and tree; it is folded into every row.
//
// VERSION PREDICATE (standing rulings 2 and 4). D192 ships at 228.
//   below 228      REFUSED, every row FAILS by name.
//   228 and up     every row asserts. No licence, no era list, no residue ceiling.
//   IA_ASSUME_VERSION=228 lifts a file stamped exactly 227 to 228 for a discrimination run. It is announced, ignored on any
//   other file, and gate.sh never sets it. Expected on V227 (assumed 228): d2-CHIP and d2-UNDO FAIL (every strict
//   A>B>C>B, every hop4 revisit shape, 191/1,000 hop5, the PIN); d2-BOOT-U, INFO and d2-MANNY hold.
//   V227 tree      INFO and d2-MANNY read the baseline from argv[3] if it reads 227, else from `git show
//                  5ce31e8a5f175e69009f6e1c46b93f3d5e62eb47:index.html` (V227) into os.tmpdir(), because tests/sabotage.py
//                  passes no argv[3] (g227's form). The run prints which source it used. No tree reading 227 FAILS
//                  d2-MANNY and the refutation guard by name, never PASS.
//
// ROWS
//   d2-CHIP    whole walk (WALK, HOP4, HOP5, PIN): the chip on the last hop's card is found and equals the last hop's
//              `from`. Residue 0; |U_d'| > 0; every class, hop3 shape, hop4 shape and HOP5 non-empty; PIN chip Deadlift.
//   d2-UNDO    whole walk: after undoSwap(chip) the live day, clock fields stripped, is byte-identical to the live day
//              before the last hop; on U the day's store equals the HAND STORE; on U' the store is not asserted.
//              Residue 0; PIN store after undo equals the typed list.
//   d2-BOOT-U  U only: after undo, a fresh-VM boot of the day (whole day, clock fields stripped) equals the live day.
//              Residue 0, |U| > 0, PIN in U boots equal to live; every class and config prints. An invariance (corollary of D190 a-U
//              and d2-UNDO); residue on collide2 or exch3 refutes a-U or the replay, not D192 (standing ruling 7: park).
//   INFO       D191 P-SWAPREVISIT, U' only: |U'|, boot != live after undo on candidate and V227, created, healed, every
//              created chain by name with its repeated `from`. Never asserted, never licensed; no pair row on U' boot
//              (ruling §3: it would read created 2 and need the licence just refused). V229: the comparator is the
//              projection D194 Amendment 2 R8 defines (tests/measure/v229_rulings/d194_injlens_ruling.md): each
//              section's label and each item's {name, detail, base}, base = the dose beneath the hold,
//              _stripCapCue(_preHold ?? detail), by a hand stripper typed in this file (the cue shape and the held-test
//              shape -> TEST_RX_TEXT), never asked of the tree. The whole-JSON counts and the D191 kept-dose shadow
//              (boot carries no `_preHold` where live does, projection equal) print beside it. No era key (R8).
//   GUARD      the §5 refutation, FAIL-only (it adds no PASS), judged on that projection (D194 Amendment 2 R8 is the
//              ruling that defines GUARD's comparator; d2-BOOT-U and every other row keep the whole-day JSON):
//              created above 2 on HOP5 (measure's seed), any created
//              chain on WALK or HOP4 (measure: 0 at hop3 and hop4), or a created chain with no repeated `from`. A created
//              chain in U cannot exist without a d2-BOOT-U residue (it boots != live on the candidate), so that half of
//              the refutation also FAILS d2-BOOT-U by name.
//   d2-MANNY   HALF_MANNY digest == MANNY_DIGEST_BY_VERSION[VER] == 0ac7da6b1691a8e1 == the V227 baseline's,
//              self-stable; and the D192 statement that one read-side line reaches no build: a counter wrapped on
//              swapOriginOf by name reads 0 across two buildProgram calls and a refreshProgram boot, and 1 after one
//              direct call (the counter is wired).
//
// MEASURED (builder, V228 slice 9, this file at these sizes; fresh VM per act and per boot):
//   V228           PASS 4 FAIL 0. 2,201 chains, 2,201 reachable; |U_d'| 744, |U| 1,587, |U'| 614. INFO: walk 18 vs 18,
//                  created 0; hop4 13 vs 81, created 0, healed 68; hop5 54 vs 76, created 2 (A>B>C>D>C>B, repeated from
//                  Dumbbell row; A>B>C>B>D>B, repeated from Incline dumbbell curl), healed 24. Runtime 85 to 93 s.
//   V227 assumed   d2-CHIP and d2-UNDO FAIL 448/2,201: walk strict A>B>C>B 96/96 (A>B>A>B 0/64), each hop4 revisit
//                  shape 40/40, hop5 191/1,000, the PIN (chip Trap bar deadlift; store after undo [Barbell Romanian
//                  deadlift->Deadlift, Deadlift->Barbell Romanian deadlift]); d2-UNDO store != hand on U 318/1,587.
//                  d2-BOOT-U residue 0/1,587, INFO (created 0), the guard and d2-MANNY hold.
//   M1 below       identical to V227 assumed on every row (git fallback baseline).
//
// SABOTAGE THIS FILE CATCHES (anchor as landed on V228):
//   M1  (tests/sabotage/v228_d192.json) `const hit=list.filter(e=>e&&e.to===name).pop();` -> `...[0];` in swapOriginOf:
//       d2-CHIP and d2-UNDO trip (strict A>B>C>B, the four hop4 revisit shapes, 191/1,000 hop5, the PIN); d2-BOOT-U,
//       INFO, the guard and d2-MANNY stay green. d2-BOOT-U green under it is the proof the spec hits the chip key and not
//       undo at large. Ruling §5: S6-D190 (drop undoSwap's rx restore) also trips d2-UNDO and d2-BOOT-U.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 228, BASE_ERA = 227;
const V227_COMMIT = '5ce31e8a5f175e69009f6e1c46b93f3d5e62eb47';   // V227: D190 (the V227 artifact, forever)
const MANNY_TYPED = '0ac7da6b1691a8e1';
const KW = { hop1:8, hop2:8, cyc2:8, 'hop3 A>B>C>D':4, 'hop3 A>B>C>B':6, 'hop3 A>B>A>B':4, 'hop3 A>B>A>C':4, cyc3:6, collide2:6, exch3:6 };
const H4SHAPES = ['A>B>C>D>B', 'A>B>C>D>C', 'A>B>C>A>C', 'A>B>A>C>A'], K4 = 40, K4O = 80, N5 = 1000;
const H5_SEED = 0xC0FFEE + 3 * 7 + 'lowback_wa'.length * 131;     // measure's mulberry(0xC0FFEE + w*7 + ck.length*131), w 3
let pass = 0, fail = 0;
const t0 = Date.now();
const sec = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('  runtime ' + sec()); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

const R = {
  CHIP:  "row d2-CHIP D192 whole walk: the chip on the last hop's card is found and equals the last hop's `from` (off the chain tuple); residue 0, |U_d'| > 0, every class and shape non-empty, PIN chip Deadlift",
  UNDO:  "row d2-UNDO D192 whole walk: after undoSwap(chip) the live day is byte-identical to the live day before the last hop, and on U the day's store is the chain's first n-1 hops in recording order; residue 0, PIN store typed",
  BOOTU: "row d2-BOOT-U D192 on U (hand: hop `from` names pairwise distinct): after undo a fresh-VM boot of the day equals the live day; residue 0, |U| > 0, PIN in U boots equal to live",
  MANNY: 'row d2-MANNY D192 HALF_MANNY digest == era table == 0ac7da6b1691a8e1 == V227, self-stable; swapOriginOf reached 0 times by buildProgram and refreshProgram (counter wired)',
};
const GUARD = 'GUARD D192 refutation (ruling §5, projection per D194 Amendment 2: section label, item name, detail and the dose beneath the hold _stripCapCue(_preHold ?? detail) by hand shape): created above 2 on the hop5 seed, created on the walk or hop4, or a created chain with no repeated from';
// D194 Amendment 2 (R8): the projection the athlete and the next tap read. Hand stripper, typed from D193 R4's cue shape and
// Amendment 3 section 2's held-test shape (-> the TEST_RX_TEXT literal, typed here); the tree is never asked.
const _CUE_HAND = / — hold RPE 7, (?:two|three) in the tank$/;
const _TEST_RX_HAND = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const _HELD_TEST_HAND = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
const _stripHand = d => { const s = String(d == null ? '' : d); return _HELD_TEST_HAND.test(s) ? _TEST_RX_HAND : s.replace(_CUE_HAND, ''); };
const PROJ = j => JSON.stringify((JSON.parse(j) || []).map(s => ({ label:(s && s.label) || null, items:((s && s.items) || []).map(it => ({ name:it && it.name, detail:it && it.detail, base:_stripHand(it && (it._preHold ?? it.detail)) })) })));
const PHN = j => (j.match(/"_preHold"/g) || []).length;


// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24';
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135, squat:155, deadlift:185, seed:76308 };
const wi = inj => { const c = clone(MARIO); if(inj) c.injury = inj; return c; };       // measure's wi(): injury appended
const wa = region => wi({ region, tier:'workaround' });
const CFGS = { knee_wa:wa('knee'), ankle_wa:wa('ankle'), hip_wa:wa('hip'), lowback_wa:wa('lowback'), shoulder_wa:wa('shoulder'), elbow_wa:wa('elbow'),
  manny:clone(fixtures.HALF_MANNY), mario_noinj:wi(null) };
const WEEKS = [3, 5], DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const CLS = ['hop1', 'hop2', 'cyc2', 'hop3', 'cyc3', 'collide2', 'exch3'];
const PIN = { ck:'manny', w:3, d:'thu', sec:'Main', A:'Trap bar deadlift', hops:['Barbell Romanian deadlift', 'Deadlift', 'Barbell Romanian deadlift'],
  chip:'Deadlift', storeAfter:['Trap bar deadlift->Barbell Romanian deadlift', 'Barbell Romanian deadlift->Deadlift'], slotAfter:'Deadlift' };

// ── HELPERS ──────────────────────────────────────────────────────────────────────────────────────────────────────
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i;
const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};"
  + "showToast=function(){};";
const stored = {}, FILES = { C:ART, B:null };
function fresh(which){ const T = load(FILES[which]); T.__tag = which; pin(T); E(T, HELP); return T; }
function setup(IA, ck){
  IA.localStorage.clear(); pin(IA);
  const key = IA.__tag + ck;
  if(!stored[key]){ const P = fresh(IA.__tag); const p = P.buildProgram(clone(CFGS[ck])); const st = clone(p);
    Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); stored[key] = JSON.stringify(st); }
  IA.ctx.__SP = JSON.parse(stored[key]); E(IA, 'savePrograms([__SP]);'); }
function boot(IA){ E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();"); }
function view(IA, w, d){ E(IA, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); }
function dayOf(IA, w, d){ return E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d); }
const storeDay = (IA, w, d) => ((JSON.parse(IA.localStorage.getItem('ia_swaps_PM') || '{}')['w' + w + '_' + d]) || []).map(e => e.from + '->' + e.to);
function putLS(IA, m){ IA.localStorage.clear(); for(const [k, v] of m) IA.localStorage.setItem(k, v); }
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hstr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h | 0; }
// a seeded reservoir per stratum (Algorithm R): deterministic in the enumeration order
function reservoirs(prefix, kOf){ const res = {};
  const take = (st, mk) => { const K = kOf(st); if(!K) return; const r = res[st] = res[st] || { seen:0, keep:[], rnd:mulberry(hstr(prefix + '|' + st)) }; r.seen++;
    if(r.keep.length < K) r.keep.push(mk()); else { const j = Math.floor(r.rnd() * r.seen); if(j < K) r.keep[j] = mk(); } };
  return { res, take }; }
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
// hand predicates, off the chain tuple only
const froms = c => c.hops.map(h => h.from), tos = c => c.hops.map(h => h.to);
const inU = c => new Set(froms(c)).size === c.hops.length;
const inUd = c => new Set(tos(c)).size === c.hops.length;
const handChip = c => c.hops[c.hops.length - 1].from;
const handStore = c => c.hops.slice(0, -1).map(h => h.from + '->' + h.to);
const repFrom = c => froms(c).filter((f, i, a) => a.indexOf(f) !== i).filter((f, i, a) => a.indexOf(f) === i);
const oneSlot = c => c.hops.every(h => h.si === c.hops[0].si && h.ii === c.hops[0].ii);
function shapeOf(c){ const L = new Map(), lt = x => { if(!L.has(x)) L.set(x, String.fromCharCode(65 + L.size)); return L.get(x); };
  return oneSlot(c) ? [c.hops[0].from].concat(tos(c)).map(lt).join('>') : c.hops.map(h => '[' + h.si + '][' + h.ii + ']' + lt(h.from) + '>' + lt(h.to)).join(' '); }
const tag = c => c.pop + ' ' + c.ck + ' W' + c.w + ' ' + c.d + ' ' + c.cls + ' ' + c.shape + ' : ' + c.hops[0].from + ' > ' + tos(c).join(' > ');

// one hop through the sheet, exactly as the sheet does it; 1 when the card does not carry the hop's `from` or the target
// is not offered
function hop(IA, c, h){
  view(IA, c.w, c.d); const dy = dayOf(IA, c.w, c.d); const it = dy && dy.sections && dy.sections[h.si] && dy.sections[h.si].items && dy.sections[h.si].items[h.ii];
  if(!it || it.name !== h.from) return 1;
  const ex = 'activeProg.weeks[' + c.w + '].' + c.d;
  const cands = Array.from(E(IA, '__cands(' + ex + ',' + c.w + ',' + JSON.stringify(it.name) + ')'));
  const can = E(IA, '__canSwap(' + ex + ',' + h.si + ',' + h.ii + ')');
  if(!can || !cands.includes(h.to)) return 1;
  IA.ctx.__c = { secIdx:h.si, itemIdx:h.ii, name:it.name, detail:it.detail }; IA.ctx.__to = h.to; E(IA, '_swapCtx=__c;applySwapChoice(__to);');
  return 0;
}
// the act: a fresh page, the chain, the chip the card reads, the tap on it; then a fresh page booted from that storage
function act(tg, c){
  const A = fresh(tg); setup(A, c.ck); boot(A);
  const n = c.hops.length, hl = c.hops[n - 1]; let prevJ = null;
  for(let k = 0; k < n; k++){ if(k === n - 1){ view(A, c.w, c.d); prevJ = JS(dayOf(A, c.w, c.d).sections); } if(hop(A, c, c.hops[k])) return { un:1 }; }
  view(A, c.w, c.d);
  const recBefore = storeDay(A, c.w, c.d);
  const nm = dayOf(A, c.w, c.d).sections[hl.si].items[hl.ii].name;
  const chip = E(A, 'swapOriginOf(' + JSON.stringify(nm) + ')') || '';
  if(chip) E(A, 'undoSwap(' + JSON.stringify(chip) + ');');
  const ad = dayOf(A, c.w, c.d), afterJ = JS(ad.sections), recAfter = storeDay(A, c.w, c.d);
  const slotAfter = clean(ad.sections[hl.si].items[hl.ii].name);
  const Bt = fresh(tg); putLS(Bt, A.localStorage._map); boot(Bt);
  const bd = dayOf(Bt, c.w, c.d), bootJ = JS(bd.sections);
  const bootSlot = clean(bd.sections[hl.si] && bd.sections[hl.si].items[hl.ii] && bd.sections[hl.si].items[hl.ii].name);
  let diff = '';
  if(bootJ !== afterJ){ const L = JSON.parse(afterJ), Bo = JSON.parse(bootJ);
    for(let si = 0; si < Math.max(L.length, Bo.length) && !diff; si++){ const li = (L[si] || {}).items || [], bi = (Bo[si] || {}).items || [];
      for(let ii = 0; ii < Math.max(li.length, bi.length) && !diff; ii++) if(JSON.stringify(li[ii]) !== JSON.stringify(bi[ii])){ const a = li[ii] || {}, b = bi[ii] || {};
        diff = '[' + si + '][' + ii + '] live ' + clean(a.name) + ' | ' + (a.detail || '') + ' ; boot ' + clean(b.name) + ' | ' + (b.detail || ''); } }
    if(!diff) diff = 'a section field'; }
  return { un:0, chip, undoEq:!!chip && afterJ === prevJ, recBefore, recAfter, slotAfter, bootSlot, bootEq:bootJ === afterJ, diff,
    projEq:PROJ(bootJ) === PROJ(afterJ), phLive:PHN(afterJ), phBoot:PHN(bootJ) };   // D194 Amendment 2 (R8)
}

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
let IA0, STAMP = NaN;
try { IA0 = load(ART); STAMP = +IA0.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION !== undefined){
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  } else console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
console.log('g228 D192 undokey | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '')
  + ' | KW ' + JSON.stringify(KW) + ' | hop4 K4 ' + K4 + ', K4O ' + K4O + ' | hop5 N5 ' + N5);
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D192 P-UNDOKEY (V' + ERA + '). No row may pass on it.');
  [R.CHIP, R.UNDO, R.BOOTU, R.MANNY].forEach(l => ok(l + ' (REFUSED)', false));
  console.log('  INFO D191 P-SWAPREVISIT: not run (REFUSED)');
  done();
}
// V227 baseline (INFO, the guard, d2-MANNY): argv[3] if it reads 227, else `git show <V227_COMMIT>:index.html` into
// os.tmpdir(), because tests/sabotage.py passes no argv[3]. fresh('B') reloads FILES.B on every chain, so the git copy
// lives until exit. No tree reading 227 leaves B null; d2-MANNY and the guard then FAIL setup by name, never PASS.
let B = null, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!B){
  const f = path.join(os.tmpdir(), 'g228_d192_undokey_v' + BASE_ERA + '_' + process.pid + '.html');
  try {
    try { fs.unlinkSync(f); } catch(e){}
    process.on('exit', () => { try { fs.unlinkSync(f); } catch(e){} });
    fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V227_COMMIT + ':index.html'], { maxBuffer: 1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ B = b; FILES.B = f; baseWhy += 'git show ' + V227_COMMIT.slice(0, 7) + ':index.html (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
console.log('  V227 tree: ' + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
// SELFCHECK: seeds pinned; a boot equals itself and a fresh-page boot (whole W3 week), every config, each tree
const self = {};
const seeds = Object.keys(CFGS).filter(ck => typeof CFGS[ck].seed !== 'number');
for(const tg of ['C', 'B']){ if(tg === 'B' && !B) continue; for(const ck of Object.keys(CFGS)){
  const X = fresh(tg); setup(X, ck); boot(X); const a = JS(X.eval('activeProg.weeks[3]')); boot(X); const b = JS(X.eval('activeProg.weeks[3]'));
  const Y = fresh(tg); putLS(Y, X.localStorage._map); boot(Y); const c = JS(Y.eval('activeProg.weeks[3]'));
  self[tg + ':' + ck] = a === b && a === c && a.length > 20; } }
const SELF = seeds.length === 0 && Object.values(self).every(Boolean);
console.log('  SELFCHECK cfg.seed pinned on ' + (Object.keys(CFGS).length - seeds.length) + '/' + Object.keys(CFGS).length + ' configs | boot==boot==fresh boot, whole W3: '
  + (Object.values(self).every(Boolean) ? 'all ' + Object.keys(self).length + ' true' : JSON.stringify(self)));

// ── ENUMERATE (tree under test) ───────────────────────────────────────────────────────────────────────────────────
const ALL = []; let nid = 0;
const mk = (pop, ck, cls, w, d, hops) => { const c = { id:nid++, pop, ck, cls, w, d, hops }; c.shape = shapeOf(c); return c; };
const DEN = {};
for(const ck of Object.keys(CFGS)){
  const IA = fresh('C'); setup(IA, ck); boot(IA);
  const cand = (w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')'));
  const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  for(const w of WEEKS){
    const { res, take } = reservoirs(ck + '|' + w, st => KW[st]);
    for(const d of DAYS){
      const live = dayOf(IA, w, d); if(!live || !live.sections) continue;
      const base = clone(live); IA.ctx.__D = base;
      const slots = []; base.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) slots.push({ si, ii, n:it.name }); }));
      // one-slot chains: measure's memo (the slot's candidates on the day with only that slot renamed)
      for(const sl of slots){
        const memo = {}; const cn = nm => { if(!(nm in memo)){ const dd = clone(base); dd.sections[sl.si].items[sl.ii].name = nm; IA.ctx.__D = dd; memo[nm] = (nm === sl.n || can(sl.si, sl.ii)) ? cand(w, nm) : []; } return memo[nm]; };
        const A = sl.n, H = (f, t) => ({ si:sl.si, ii:sl.ii, from:f, to:t });
        for(const Bn of cn(A)){ if(Bn === A) continue; take('hop1', () => ({ d, cls:'hop1', hops:[H(A, Bn)] }));
          for(const C of cn(Bn)){ if(C === Bn) continue; const two = [H(A, Bn), H(Bn, C)];
            if(C === A){ take('cyc2', () => ({ d, cls:'cyc2', hops:two }));
              for(const X of cn(A)) if(X !== A) take(X === Bn ? 'hop3 A>B>A>B' : 'hop3 A>B>A>C', () => ({ d, cls:'hop3', hops:two.concat([H(A, X)]) })); }
            else { take('hop2', () => ({ d, cls:'hop2', hops:two }));
              for(const X of cn(C)) if(X !== C) take(X === A ? 'cyc3' : X === Bn ? 'hop3 A>B>C>B' : 'hop3 A>B>C>D', () => ({ d, cls:X === A ? 'cyc3' : 'hop3', hops:two.concat([H(C, X)]) })); } } } }
      // collide2 / exch3: g227's cross-slot loop
      for(const si of slots) for(const sj of slots){ if(si === sj) continue;
        IA.ctx.__D = base; for(const X of cand(w, si.n)){ const d1 = clone(base); d1.sections[si.si].items[si.ii].name = X; IA.ctx.__D = d1;
          if(!cand(w, sj.n).includes(si.n)) continue;
          const h2 = [{ si:si.si, ii:si.ii, from:si.n, to:X }, { si:sj.si, ii:sj.ii, from:sj.n, to:si.n }]; take('collide2', () => ({ d, cls:'collide2', hops:h2 }));
          const d2 = clone(d1); d2.sections[sj.si].items[sj.ii].name = si.n; IA.ctx.__D = d2;
          if(can(si.si, si.ii) && cand(w, X).includes(sj.n)) take('exch3', () => ({ d, cls:'exch3', hops:h2.concat([{ si:si.si, ii:si.ii, from:X, to:sj.n }]) })); } }
    }
    for(const st of Object.keys(KW)){ const r = res[st]; DEN[ck + '|W' + w + '|' + st] = (r ? r.keep.length : 0) + '/' + (r ? r.seen : 0);
      (r ? r.keep : []).forEach(x => ALL.push(mk('walk', ck, x.cls, w, x.d, x.hops))); }
  }
  // PIN: the ruling's HALF_MANNY W3 Thu chain, located by name on the card (HAND)
  if(ck === PIN.ck){ const dy = dayOf(IA, PIN.w, PIN.d); const hits = [];
    ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name === PIN.A && clean(s.label).indexOf(PIN.sec) === 0) hits.push({ si, ii }); }));
    if(hits.length === 1){ const { si, ii } = hits[0]; const seq = [PIN.A].concat(PIN.hops);
      ALL.push(mk('pin', ck, 'hop3', PIN.w, PIN.d, PIN.hops.map((to, k) => ({ si, ii, from:seq[k], to })))); }
    console.log('  PIN ' + PIN.ck + ' W' + PIN.w + ' ' + PIN.d + ' ' + PIN.sec + ' :: ' + PIN.A + ' found ' + hits.length); }
}
console.log('  WALK sampled/denominator by config|week|stratum: ' + Object.keys(DEN).map(k => k + ' ' + DEN[k]).join(' | '));
// HOP4 + HOP5: lowback_wa W3 Mon+Tue, measure's enumerator verbatim in its order
{
  const ck = 'lowback_wa', w = 3; const IA = fresh('C'); setup(IA, ck); boot(IA);
  const cand = (n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')'));
  const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  const h3 = [], slots = []; let n4 = 0;
  const { res, take } = reservoirs(ck + '|' + w + '|h4', st => st === 'other' ? K4O : K4);
  const hops5 = (sl, names) => { const seq = [sl.n].concat(names); return names.map((to, k) => ({ si:sl.si, ii:sl.ii, from:seq[k], to })); };
  const L4 = (A, B4, C, X, Y) => { const L = new Map(), lt = x => { if(!L.has(x)) L.set(x, String.fromCharCode(65 + L.size)); return L.get(x); }; return [A, B4, C, X, Y].map(lt).join('>'); };
  for(const d of ['mon', 'tue']){ const live = dayOf(IA, w, d); if(!live || !live.sections) continue; const bs = clone(live); IA.ctx.__D = bs;
    const sl0 = []; bs.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) sl0.push({ si, ii, n:it.name }); }));
    for(const sl of sl0){ const memo = {}; const cn = nm => { if(!(nm in memo)){ const dd = clone(bs); dd.sections[sl.si].items[sl.ii].name = nm; IA.ctx.__D = dd; memo[nm] = (nm === sl.n || can(sl.si, sl.ii)) ? cand(nm) : []; } return memo[nm]; };
      const sk = slots.push(cn) - 1;
      for(const B4 of cn(sl.n)) for(const C of cn(B4)) for(const X of cn(C)){ h3.push({ d, sl, hops:[B4, C, X], sk });
        for(const Y of cn(X)){ n4++; const sh = L4(sl.n, B4, C, X, Y); take(H4SHAPES.includes(sh) ? sh : 'other', () => ({ d, hops:hops5(sl, [B4, C, X, Y]) })); } } } }
  for(const st of H4SHAPES.concat(['other'])){ const r = res[st]; DEN['hop4|' + st] = (r ? r.keep.length : 0) + '/' + (r ? r.seen : 0); (r ? r.keep : []).forEach(x => ALL.push(mk('hop4', ck, 'hop4', w, x.d, x.hops))); }
  const rnd = mulberry(H5_SEED); let n5 = 0;
  for(let t = 0; t < N5 * 5 && n5 < N5 && h3.length; t++){ const c = h3[Math.floor(rnd() * h3.length)]; const cn = slots[c.sk]; const c4 = cn(c.hops[2]); if(!c4.length) continue;
    const Y = c4[Math.floor(rnd() * c4.length)]; const c5 = cn(Y); if(!c5.length) continue; const Z = c5[Math.floor(rnd() * c5.length)];
    ALL.push(mk('hop5', ck, 'hop5', w, c.d, hops5(c.sl, c.hops.concat([Y, Z])))); n5++; }
  console.log('  HOP4 lowback_wa W3 Mon+Tue: hop3 ' + h3.length + ', hop4 ' + n4 + ' | sampled/denominator ' + H4SHAPES.concat(['other']).map(s => s + ' ' + DEN['hop4|' + s]).join(' | ')
    + '\n  HOP5 measure seed 0x' + H5_SEED.toString(16) + ': ' + n5 + ' chains');
}
console.log('  enumerated ' + ALL.length + ' chains (' + fmt(tally(ALL, c => c.pop)) + ') | ' + sec());

// ── RUN (candidate) ───────────────────────────────────────────────────────────────────────────────────────────────
for(const c of ALL) c.r = act('C', c);
const reach = ALL.filter(c => !c.r.un);
console.log('  ran ' + ALL.length + ', reachable ' + reach.length + ', dropped (a hop not offered at replay) ' + (ALL.length - reach.length) + ' ' + fmt(tally(ALL.filter(c => c.r.un), c => c.pop + '|' + c.cls)) + ' | ' + sec());
const pinC = reach.find(c => c.pop === 'pin');
const grp = c => c.pop === 'walk' ? 'walk ' + c.cls + (c.cls === 'hop3' ? ' ' + c.shape : '') : c.pop === 'hop4' ? 'hop4 ' + (H4SHAPES.includes(c.shape) ? c.shape : 'other') : c.pop;
const byGrp = (rows, bad) => { const g = {}; rows.forEach(c => { const k = grp(c); const o = g[k] = g[k] || [0, 0]; o[1]++; if(bad(c)) o[0]++; }); return Object.keys(g).sort().map(k => k + ' ' + g[k][0] + '/' + g[k][1]).join(' | '); };
if(pinC) console.log('  PIN ' + tag(pinC) + '\n    chip ' + JSON.stringify(pinC.r.chip) + ' (hand ' + JSON.stringify(PIN.chip) + ') | store before ' + JSON.stringify(pinC.r.recBefore)
  + '\n    after undo slot ' + pinC.r.slotAfter + ', store ' + JSON.stringify(pinC.r.recAfter) + ' (typed ' + JSON.stringify(PIN.storeAfter) + ') | fresh boot slot ' + pinC.r.bootSlot + ', boot == live ' + pinC.r.bootEq);
else console.log('  PIN not reached (not located, or a hop not offered at replay)');

// ── d2-CHIP ────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const bad = c => c.r.chip !== handChip(c);
  const res = reach.filter(bad), UdP = reach.filter(c => !inUd(c));
  const need = CLS.map(k => 'walk ' + k).concat(['hop3 A>B>C>D', 'hop3 A>B>C>B', 'hop3 A>B>A>B', 'hop3 A>B>A>C'].map(s => 'walk ' + s), H4SHAPES.map(s => 'hop4 ' + s), ['hop4 other', 'hop5', 'pin']);
  const have = k => reach.some(c => (c.pop === 'walk' && k === 'walk ' + c.cls) || k === grp(c));
  const empty = need.filter(k => !have(k));
  console.log("    d2-CHIP wrong/total by group: " + byGrp(reach, bad) + "\n            |U_d| " + (reach.length - UdP.length) + ", |U_d'| " + UdP.length + ', wrong on U_d ' + res.filter(inUd).length + ", on U_d' " + res.filter(c => !inUd(c)).length
    + ' | by config: ' + Object.keys(CFGS).map(ck => ck + ' ' + res.filter(c => c.ck === ck).length + '/' + reach.filter(c => c.ck === ck).length).join(' | ')
    + (empty.length ? ' | EMPTY strata: ' + empty.join(', ') : ' | every stratum non-empty (' + need.length + ')'));
  res.slice(0, 3).forEach(c => console.log('      ' + tag(c) + ' | chip ' + (c.r.chip || '(none)') + ', hand chip ' + handChip(c) + ' | store ' + JSON.stringify(c.r.recBefore)));
  const pinOk = !!pinC && pinC.r.chip === PIN.chip;
  ok(R.CHIP, SELF && reach.length > 0 && res.length === 0 && UdP.length > 0 && empty.length === 0 && pinOk,
    'wrong ' + res.length + '/' + reach.length + " (no chip " + res.filter(c => !c.r.chip).length + ", U_d' " + res.filter(c => !inUd(c)).length + '/' + UdP.length + ', hop5 ' + res.filter(c => c.pop === 'hop5').length + '/' + reach.filter(c => c.pop === 'hop5').length
    + '), empty strata ' + empty.length + ', PIN chip ' + (pinC ? JSON.stringify(pinC.r.chip) : 'not reached'));
}
// ── d2-UNDO ────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const storeBad = c => inU(c) && c.r.recAfter.join('|') !== handStore(c).join('|');
  const bad = c => !c.r.undoEq || storeBad(c);
  const res = reach.filter(bad);
  console.log('    d2-UNDO wrong/total by group: ' + byGrp(reach, bad) + '\n            day != pre ' + reach.filter(c => !c.r.undoEq).length + ', store != hand on U ' + reach.filter(storeBad).length + '/' + reach.filter(inU).length);
  res.slice(0, 3).forEach(c => console.log('      ' + tag(c) + ' | chip ' + (c.r.chip || '(none)') + ' | day == pre ' + c.r.undoEq + ' | store after ' + JSON.stringify(c.r.recAfter) + (inU(c) ? ' vs hand ' + JSON.stringify(handStore(c)) : " (U', not asserted)")));
  const pinOk = !!pinC && pinC.r.undoEq && pinC.r.recAfter.join('|') === PIN.storeAfter.join('|') && pinC.r.slotAfter === PIN.slotAfter;
  ok(R.UNDO, SELF && reach.length > 0 && res.length === 0 && pinOk, 'wrong ' + res.length + '/' + reach.length + ' (day != pre ' + reach.filter(c => !c.r.undoEq).length + ', store != hand on U ' + reach.filter(storeBad).length
    + ', hop5 ' + res.filter(c => c.pop === 'hop5').length + '), PIN ' + (pinC ? 'slot ' + pinC.r.slotAfter + ' store ' + JSON.stringify(pinC.r.recAfter) : 'not reached'));
}
// ── d2-BOOT-U ──────────────────────────────────────────────────────────────────────────────────────────────────────
const U = reach.filter(inU), UP = reach.filter(c => !inU(c));
{
  const res = U.filter(c => !c.r.bootEq);
  console.log('    d2-BOOT-U |U| ' + U.length + " (|U'| " + UP.length + ') residue/total by group: ' + byGrp(U, c => !c.r.bootEq)
    + '\n              by config: ' + Object.keys(CFGS).map(ck => ck + ' ' + res.filter(c => c.ck === ck).length + '/' + U.filter(c => c.ck === ck).length).join(' | '));
  res.slice(0, 4).forEach(c => console.log('      ' + tag(c) + ' | store after ' + JSON.stringify(c.r.recAfter) + ' | ' + c.r.diff));
  const pinOk = !!pinC && inU(pinC) && pinC.r.bootEq;
  ok(R.BOOTU, SELF && U.length > 0 && res.length === 0 && pinOk, 'residue ' + res.length + '/' + U.length + ', PIN ' + (pinC ? (inU(pinC) ? 'in U' : "in U'") + ', boots ' + pinC.r.bootSlot + ' == live ' + pinC.r.bootEq : 'not reached'));
}
// ── INFO D191 P-SWAPREVISIT (U', never asserted) + the §5 refutation guard ─────────────────────────────────────────
{
  if(B) for(const c of UP) c.rb = act('B', c);
  const both = UP.filter(c => c.rb && !c.rb.un);
  // D194 Amendment 2 (R8): GUARD and this INFO line compare U' on the projection; the whole-JSON counts print beside it.
  const created = both.filter(c => c.rb.projEq && !c.r.projEq), healed = both.filter(c => !c.rb.projEq && c.r.projEq);
  const createdW = both.filter(c => c.rb.bootEq && !c.r.bootEq), healedW = both.filter(c => !c.rb.bootEq && c.r.bootEq);
  const shadow = createdW.filter(c => created.indexOf(c) < 0), shadowPH = shadow.filter(c => c.r.phLive > c.r.phBoot);
  const P = ['walk', 'hop4', 'hop5', 'pin'];
  const line = P.map(p => { const g = UP.filter(c => c.pop === p), gb = both.filter(c => c.pop === p); return p + " |U'| " + g.length
    + ' boot != live whole JSON candidate ' + g.filter(c => !c.r.bootEq).length + ' / V227 ' + (B ? gb.filter(c => !c.rb.bootEq).length : 'n/a')
    + ', projection candidate ' + g.filter(c => !c.r.projEq).length + ' / V227 ' + (B ? gb.filter(c => !c.rb.projEq).length : 'n/a') + ' (on both ' + gb.length + ')'
    + ', created projection ' + created.filter(c => c.pop === p).length + ' (whole JSON ' + createdW.filter(c => c.pop === p).length + ')'
    + ', healed projection ' + healed.filter(c => c.pop === p).length + ' (whole JSON ' + healedW.filter(c => c.pop === p).length + ')'; }).join(' | ');
  console.log("  INFO D191 P-SWAPREVISIT (never asserted, never licensed; no pair row on U' boot, ruling §3; projection per D194 Amendment 2): " + line + ' | ' + sec());
  console.log("       U' boot != live on the candidate by group, projection: " + byGrp(UP, c => !c.r.projEq) + "\n       whole JSON: " + byGrp(UP, c => !c.r.bootEq));
  console.log('  INFO D191 kept-dose shadow (boot carries no `_preHold` where live does, projection equal): ' + shadow.length + ' of ' + createdW.length + ' created on whole JSON (' + P.map(p => p + ' ' + shadow.filter(c => c.pop === p).length).join(', ') + '); live carries more _preHold keys than boot on ' + shadowPH.length + ' of ' + shadow.length);
  created.forEach(c => console.log('       created ' + tag(c) + ' | repeated from ' + JSON.stringify(repFrom(c)) + ' | store before undo ' + JSON.stringify(c.r.recBefore)
    + ' after ' + JSON.stringify(c.r.recAfter) + ' | ' + c.r.diff));
  const c5 = created.filter(c => c.pop === 'hop5').length, cw = created.filter(c => c.pop !== 'hop5').length, noRep = created.filter(c => repFrom(c).length === 0).length;
  if(!B) ok(GUARD + ' (setup: no V227 tree: ' + baseWhy + ')', false);
  else if(c5 > 2 || cw > 0 || noRep > 0) ok(GUARD, false, 'hop5 created ' + c5 + ', walk+hop4 created ' + cw + ', created with no repeated from ' + noRep + ': stop and re-measure');
  else console.log('  INFO GUARD clear on the projection (ruling §5 refutation, FAIL-only, D194 Amendment 2): hop5 created ' + c5 + ' <= 2, walk+hop4 created ' + cw + ', created with no repeated from ' + noRep + ' | whole JSON beside it: hop5 ' + createdW.filter(c => c.pop === 'hop5').length + ', walk+hop4 ' + createdW.filter(c => c.pop !== 'hop5').length);
}
// ── d2-MANNY ───────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const X = fresh('C');
  E(X, 'globalThis.__soN=0;(function(){var o=swapOriginOf;swapOriginOf=function(){globalThis.__soN++;return o.apply(this,arguments);};})();');
  const d1 = progDigest(X.buildProgram(clone(fixtures.HALF_MANNY))), d2 = progDigest(X.buildProgram(clone(fixtures.HALF_MANNY)));
  setup(X, 'manny'); boot(X);
  const nBuild = E(X, 'globalThis.__soN'); E(X, 'swapOriginOf("Deadlift");'); const wired = E(X, 'globalThis.__soN') === nBuild + 1;
  const era = MANNY_DIGEST_BY_VERSION[VER];
  const dB = B ? progDigest(fresh('B').buildProgram(clone(fixtures.HALF_MANNY))) : null;
  console.log('    d2-MANNY candidate ' + d1 + ' (self-stable ' + (d1 === d2) + ') | era[' + VER + '] ' + era + ' | typed ' + MANNY_TYPED + ' | V227 ' + (dB || 'n/a (' + baseWhy + ')')
    + ' | swapOriginOf calls in 2 buildProgram + 1 refreshProgram: ' + nBuild + ', counter wired ' + wired);
  ok(R.MANNY + (B ? '' : ' (setup: no V227 tree: ' + baseWhy + ')'), d1 === d2 && d1 === era && d1 === MANNY_TYPED && dB === d1 && nBuild === 0 && wired, d1 + ', calls ' + nBuild);
}
done();
