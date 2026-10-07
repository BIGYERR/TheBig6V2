// g227_d190_seam.js — GATE for D190 (P-SWAPSEAM): the hold cue belongs to the plan and the movement on the card, never
// to the chain that got it there. Claims (a), (d) and (e) of the ruling; (b), (c) and (c2) are the other D190 gate files.
//
//   node tests/gates/g227_d190_seam.js <candidate.html> [baseline_V226.html]
//   IA_ASSUME_VERSION=227 node tests/gates/g227_d190_seam.js <tree stamped 226> [baseline_V226.html]   (discrimination only)
//
// THE RULING THIS DEFENDS: tests/measure/v227_rulings/d190_swapseam_ruling.md, D190, RE-RULING 1 and RE-RULING 2 (where
// they differ, the later re-ruling is the live text; RE-RULING 2 governs row (d) only). D-code D190, ships on ia-version
// 227 (Mario: "Ship D190 at V227").
//   (a) RE-RULING 1 §A, verbatim: "Population U: every chain on the lattice (hop1, hop2, cyc2 fully enumerated; hop3, cyc3,
//       collide2, exch3 sampled) whose day store, read after the chain, holds exactly one record per hop. On U: live slot
//       detail == fresh-page boot slot detail, residue 0 of |U|, |U| > 0, no licence. Membership is proven, not assumed:
//       the gate also computes membership by hand (a chain is in U iff its hop `from` names are pairwise distinct) and
//       asserts the store-derived set equals the hand-derived set on every chain. The complement U' (store shorter than the
//       chain) carries one pair row, keyed to D190's own claim: every U' chain that boots equal to live on the baseline
//       (argv[3]) boots equal to live on the artifact (created 0; measured healed 580, created 0). |U'| and its residue
//       print as INFO under the name D191 P-SWAPREVISIT, never asserted, never licensed. Predicate `VER >= 227`, REFUSED
//       below." Lattice (original ruling): MARIO's config under knee/wa, ankle/wa, hip/wa, lowback/wa, shoulder/wa and
//       elbow/wa, weeks W3 and W5.
//   (d) RE-RULING 2 §1, verbatim (it amends the original "swap then undo byte-identical on the whole day on every
//       injured chain" and RE-RULING 1 "(d) stands"; RE-RULING 2 §3 WITHDRAWS builder 6's hop1/hop2/cyc2 narrowing as a
//       class list): "Population U_d: every chain the (a) walk produces (hop1, hop2, cyc2 enumerated; hop3, cyc3,
//       collide2, exch3 sampled) whose hop `to` names, listed by hand from the chain, are pairwise distinct across the
//       day. On U_d: the chip on the last hop's card is found and equals the last hop's `from` (store-derived chip ==
//       hand-derived chip; that conjunct is the membership proof, since the last record always survives and no other
//       record on the day carries that `to`); after `undoSwap(chip)` the whole day, clock fields stripped, is
//       byte-identical to the day the live page showed before the last hop. Residue 0 of |U_d|, |U_d| > 0, no licence.
//       Predicate `VER >= 227`, REFUSED below. PASS expected on V226 and V227 alike (an invariance row; its bite is the
//       named trip below). Complement U_d' (some `to` repeats on the day): prints |U_d'|, undo-wrong by shape, and
//       healed vs baseline as INFO under the name D192 P-UNDOKEY, never asserted, never licensed; |U_d'| > 0 is a
//       conjunct so the pair row is not vacuous. Pair row, keyed to R6: every U_d' chain that undoes byte-identical on
//       the baseline (argv[3]) undoes byte-identical on the artifact. Created 0 (measured: created 0, healed 0 on
//       28,246; A>B>A>B 2,344/2,344 right on both trees)."
//       P11 on this walk (tests/measure/v227_rulings/measure_d190_p11_v227.md): U_d 15,112 over 7 classes, every class
//       non-empty, 0 wrong, chip == hand chip 15,112/15,112; U_d' 90, all hop3 (35 A>B>C>B wrong on both trees, 55
//       A>B>A>B right), created 0, healed 0. The last hop's card is the slot the last hop renamed: collide2 slot j (it
//       holds A after B->A; the chip is the B->A record), exch3 slot i (the chip is X).
//   (e) original ruling, stands: the 2 natively cued mario items and the 2 ankle ones, every reachable chain from them,
//       live == boot (measured 127 + 112 chains, 0 differ).
//
// ORACLE. Never the boot path; the engine is never asked for an expected value:
//   LIVE   what the athlete last saw: the day after the last applySwapChoice on a fresh page, before any boot.
//   PRE    the whole day as the athlete saw it before the last hop (clock fields stripped): row (d)'s expected day.
//   HAND   the cue literal, typed here: ' — hold RPE 7, two in the tank'. The cap table, typed from the ruling header:
//          knee/wa squat, lunge, leg_iso; ankle/wa squat, lunge; hip/wa hinge, lunge, hip_ext, squat; lowback/wa hinge,
//          squat, row, hip_ext; shoulder/wa hpress, vpress, delt_iso; elbow/wa hpress, tri_iso, bi_iso, row, vpull. The
//          four natively cued items by the ruling's own strings (mario knee/wa `W3 thu Leg superset A :: Reverse lunge
//          (KB)`, `W5 thu Leg superset A :: Step-ups (KB)`; ankle/wa `Dumbbell Bulgarian split squat`, W3 and W5 thu),
//          each with its pattern typed: lunge (the ruling header: "reverse lunge and step-ups `lunge`"; the Bulgarian
//          split squat is a split-stance single-leg pattern, the same lunge pattern). The engine's classifier is read
//          only to agree with the typed pattern; it is not under test.
//   MEMBER by hand: a chain is in U iff its hop `from` names, computed from the chain tuple and the pre-chain card the
//          enumerator read, are pairwise distinct. The store-derived membership reads ia_swaps_PM for the chain's day
//          after the act and before the boot: exactly one record per hop, each hop's {from, to} matched once.
//   MEMBER_d by hand, row (d): a chain is in U_d iff its hop `to` names, from the chain tuple, are pairwise distinct (one
//          chain per day per batch, so the day's hops are the chain's). The hand chip is the last hop's `from`. The
//          store side is the chip the card reads (swapOriginOf of the name the last hop wrote into its slot); d-U
//          asserts store chip == hand chip on every U_d chain, which is the membership cross-check.
//   V226   rows a-U' and d-U' only: the baseline's own act, boot and undo of the same chain (argv[3] if it reads 226, else
//          the pinned V226 commit; see VERSION PREDICATE).
// POPULATION. Chains are enumerated on the tree under test with measure's enumerator (tests/measure/v227_swapseam.js,
//   v227_d190_premises.js): a hop is taken only when its target is in the swap sheet's own candidate list for the item
//   as it then stands (swapCandidates tier1+tier2, or auxSwapCandidates for a null-pattern aux-family item) and the
//   slot's canSwap flag is on. Replay re-checks each hop against the sheet; a chain with a hop not offered at replay is
//   dropped and counted. Classes: hop1 (A->B), hop2 (A->B->C), cyc2 (A->B->A), hop3 (three hops on one slot), cyc3
//   (A->B->C->A), collide2 (slot i A->X, then slot j B->A), exch3 (collide2, then slot i X->B).
//   Fixtures: MARIO = commercial|support_strength|beginner|liftonly|knee/workaround, seed 76308; the region configs are
//   MARIO with injury {ankle|hip|lowback|shoulder|elbow, workaround}. Program start 2026-08-24, clock pinned 2026-09-24.
//   Weeks 3 and 5.
//   FULL   every reachable hop1/hop2/cyc2 chain on knee/wa and ankle/wa, W3 and W5, on tue, thu and sat: the days that
//          carry the four natively cued items (thu) and every V226 residue row (measure: Explosive finisher sat, Pull
//          superset B tue, Leg superset B thu; 128 = mario 68 + ankle 60, all W3/W5), the ankle/wa W3 thu Leg superset B
//          class the live strip guards, and every chain of row (e).
//   SAMPLE a fixed-seed sample of at most N per (config, week, day, class) of hop1/hop2/cyc2 everywhere else (knee/ankle
//          mon and fri; hip, lowback, shoulder, elbow every day); hop3/cyc3 by a seeded walk off the day's two-hop chains
//          (at most N3 hop3 off a hop2, N3 hop3 off a cyc2, the revisit stratum where U' lives, and N3 cyc3 per day);
//          collide2/exch3 a seeded sample of at most NC per day. Denominators print.
//   measure's full enumeration (66,969 lattice chains, 269,588 three-swap chains) is the ship proof; this is the guard.
// BOOT MODEL. A boot in the app is a fresh page. Every act starts on a fresh VM and every boot is a fresh VM loaded with
//   the device storage that act left (g222's model; an in-VM reboot can start from a card that shares references with the
//   act). One chain per day per batch, so a day's store holds only its own chain. SELFCHECK proves a boot equals itself
//   and equals a fresh-page boot, on every config and tree; it is folded into every row.
//
// VERSION PREDICATE (standing rulings 2 and 4). D190 ships at 227.
//   below 227      REFUSED, every assertion row FAILS by name.
//   227 and up     every row asserts. No licence, no era list, no residue ceiling.
//   IA_ASSUME_VERSION=227 lifts a file stamped exactly 226 to 227 for a discrimination run. It is announced, ignored on any
//   other file, and gate.sh never sets it.
//   V226 tree      rows a-U' and d-U' read the baseline from argv[3] if it reads 226, else from `git show
//                  637bc8e24a243daf3803a554125bba117f44281f:index.html` (V226) into os.tmpdir(): tests/sabotage.py passes
//                  no argv[3] (the V226 slice 7e defect; the fix is the g225_d187_pacerate.js / g226 form). The run
//                  prints which source it used. If neither yields a tree reading 226 (git missing, the commit
//                  unreadable), the row FAILS setup by name, never PASS.
//   Self-expiring: when D191 ships a store that keeps one record per hop, U' empties into U by the predicate itself.
//
// ROWS
//   a-MEM  every reachable chain: store-derived membership (one record per hop) == hand-derived membership (hop froms
//          pairwise distinct). U and U' sizes print.
//   a-U    on U: every touched slot, live name and detail == fresh-page boot name and detail. Residue 0 of |U|, |U| > 0,
//          chains that moved the live card > 0. No licence.
//   a-U'   pair, U' only: every U' chain whose touched slots boot equal to live on V226 (argv[3]) boots equal to live on
//          the candidate. created 0.
//   INFO   D191 P-SWAPREVISIT: |U'| and its residue, never asserted, never licensed.
//   d-U    on U_d (MEMBER_d: hop `to` names pairwise distinct), every class of the (a) walk: the chip on the last hop's
//          card is found and equals the last hop's `from`, and after undoSwap(chip) the whole day (clock fields
//          stripped) is byte-identical to the day the live page showed before the last hop. Residue 0 of |U_d|,
//          |U_d| > 0, no licence; every class and config prints.
//   d-U'   pair, U_d' only (some `to` repeats on the day), keyed to R6: every U_d' chain that undoes byte-identical on
//          V226 (argv[3]) undoes byte-identical on the candidate. created 0; |U_d'| > 0 and at least one U_d' chain run
//          on both trees (the ruling's non-vacuity conjunct, read where the comparison happens).
//   INFO   D192 P-UNDOKEY: |U_d'|, undo wrong by shape, chip != hand chip, healed vs V226; never asserted, never licensed.
//          Self-expiring: when D192 ships the last-match chip every U_d' chain undoes right and this line goes quiet,
//          with no re-key of (d).
//          Builder 6's row d (asserted on hop1/hop2/cyc2 only, the sampled classes as INFO) is WITHDRAWN by RE-RULING 2.
//   e-PRE  HAND precondition: each of the four natively cued items is on its day by name, exactly once (mario's in Leg
//          superset A), carries the cue literal, and its typed pattern is in the plan's typed cap (the classifier agrees).
//   e      every reachable hop1/hop2/cyc2 chain from the four items (FULL): touched slot and whole day live == boot.
//
// SABOTAGE THIS FILE CATCHES (anchors as landed on V227):
//   M1  the live filter block in applySwapChoice (`if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){`) a no-op:
//       a-U trips (the boot cues a capped end the live card left bare).
//   M2  `const _base=_stripCapCue(_wasDetail);` -> `const _base=_wasDetail;`: a-U trips, on the ankle/wa W3 class among
//       others (a cue earned on a capped middle hop rides onto an uncapped end live, never at boot).
//   M3  `_swapDetailFor(to,_stripCapCue(it.detail))` -> `_swapDetailFor(to,it.detail)` in applySwapPrefs: e trips (the
//       boot carries a natively cued donor's cue onto the end, the live card does not).
//   M5  the boot re-filter in applySessionSwaps (`if(hit && prog.cfg && prog.cfg.injury){`) disabled: a-U trips.
//   M6  (S6-D190, RE-RULING 2 §1) the `if(Array.isArray(hit.rx)){...}` restore block in undoSwap dropped: d-U trips on
//       every U_d chain whose donor detail the rename alone does not reproduce (D177 window swaps, cued donors; P11:
//       1,886/15,112). The same mutation trips g221 G5a, G5b and G5c (its own spec row); G7-1a does not (P11: it never
//       calls undoSwap), so the spec does not name it.
// IDS (post-V233 V4: every row prints through tests/status.js; CLAUDE.md Proof scope, Row manifest). Each row above
//   is the id D190-<row>, keyed to the ruling it defends (standing ruling 4): D190-a-MEM, D190-a-U, D190-a-Uprime (a-U'),
//   D190-d-U, D190-d-Uprime (d-U'), D190-e-PRE, D190-e (the id grammar has no apostrophe). The INFO lines stay INFO (not
//   rows). A boot failure or a REFUSED version prints FAIL for every declared id by name.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 227, BASE_ERA = 226;
const V226_COMMIT = '637bc8e24a243daf3803a554125bba117f44281f';   // V226: D188/D189 (the V226 artifact, forever)
const N = 40, N3 = 6, NC = 8;
const t0 = Date.now();
// Rows print through tests/status.js (post-V233 V4). RID: row key -> status id. ok(row key, label, cond, got) is the
// row's one status line: got prints in the label on a PASS and as the detail on a FAIL, as before.
const S = require('../status')('g227_d190_seam');
const RID = { aMEM:'D190-a-MEM', aU:'D190-a-U', aUp:'D190-a-Uprime', dU:'D190-d-U', dUp:'D190-d-Uprime', ePRE:'D190-e-PRE',
  e:'D190-e' };
S.declare(Object.values(RID));
const ok = (k, l, c, g) => c ? S.pass(RID[k], l + (g === undefined ? '' : ' (' + g + ')')) : S.fail(RID[k], l, g === undefined ? '' : 'got ' + g);
const done = () => { console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); S.summary(); };
// a boot failure or a REFUSED version: FAIL for every declared id by name (R is read at call time, after it is typed)
const failAll = (why, detail) => { for(const k of Object.keys(RID)) S.fail(RID[k], R[k] + ' (' + why + ')', detail); done(); };

const R = {
  aMEM: 'membership proven: store-derived U (one ia_swaps_ record per hop, read after the chain) == hand-derived U (hop froms pairwise distinct), every reachable chain',
  aU:   'on U: every touched slot boots equal to the live card in name and detail, residue 0 of |U|, |U| > 0, no licence',
  aUp:  "pair on U' (store shorter than the chain): every U' chain that boots equal to live on V226 boots equal to live on the candidate, created 0",
  dU:   "R6 on U_d (hand: hop `to` names pairwise distinct on the day): the chip on the last hop's card is found and equals the last hop's `from`, and undoSwap(chip) leaves the whole day byte-identical to the day before the last hop; residue 0 of |U_d|, |U_d| > 0, no licence",
  dUp:  "R6 pair on U_d' (some `to` repeats on the day): every U_d' chain that undoes byte-identical on V226 undoes byte-identical on the candidate, created 0, |U_d'| > 0",
  ePRE: 'HAND precondition: the 2 natively cued mario items and the 2 ankle ones are on their days by name and carry the cue on a typed capped pattern',
  e:    'every reachable hop1/hop2/cyc2 chain from the 4 natively cued items: touched slot and whole day live == boot',
};

// ── HAND ORACLE ──────────────────────────────────────────────────────────────────────────────────────────────────
// CUE is typed after the version predicate below (V228 D193 R1, split): it reads VER.
const CAP = { knee:['squat', 'lunge', 'leg_iso'], ankle:['squat', 'lunge'], hip:['hinge', 'lunge', 'hip_ext', 'squat'],
  lowback:['hinge', 'squat', 'row', 'hip_ext'], shoulder:['hpress', 'vpress', 'delt_iso'], elbow:['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'] };
const CUED = [
  { ck:'knee_wa',  w:3, d:'thu', sec:'Leg superset A', name:'Reverse lunge (KB)', pat:'lunge' },
  { ck:'knee_wa',  w:5, d:'thu', sec:'Leg superset A', name:'Step-ups (KB)', pat:'lunge' },
  { ck:'ankle_wa', w:3, d:'thu', sec:null, name:'Dumbbell Bulgarian split squat', pat:'lunge' },
  { ck:'ankle_wa', w:5, d:'thu', sec:null, name:'Dumbbell Bulgarian split squat', pat:'lunge' } ];

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24';
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
const wa = region => { const c = JSON.parse(JSON.stringify(MARIO)); c.injury = { region, tier:'workaround' }; return c; };
const CFGS = { knee_wa:wa('knee'), ankle_wa:wa('ankle'), hip_wa:wa('hip'), lowback_wa:wa('lowback'), shoulder_wa:wa('shoulder'), elbow_wa:wa('elbow') };
const FULL = { knee_wa:['tue', 'thu', 'sat'], ankle_wa:['tue', 'thu', 'sat'] };
const WEEKS = [3, 5], DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], LAT = ['hop1', 'hop2', 'cyc2'];
const clone = x => JSON.parse(JSON.stringify(x));
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
function boot(IA){ return E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();currentWeek"); }
function view(IA, w, d){ E(IA, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); }
function dayOf(IA, w, d){ return E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d); }
function sig(dy){ if(!dy || !dy.sections) return '(none)'; return dy.sections.map(s => clean(s.label) + '{' + (s.items || []).map(it => clean(it.name) + '|' + (it.detail || '') + (it._skipped ? '[x]' : '')).join(';') + '}').join(' '); }
function slotOf(dy, si, ii){ const it = dy && dy.sections && dy.sections[si] && dy.sections[si].items && dy.sections[si].items[ii]; return it ? { n:clean(it.name), d:it.detail || '' } : { n:'(none)', d:'' }; }
const Jget = (IA, k) => JSON.parse(IA.localStorage.getItem(k) || '{}');
const dumpLS = IA => new Map(IA.localStorage._map);
function putLS(IA, m){ IA.localStorage.clear(); for(const [k, v] of m) IA.localStorage.setItem(k, v); }
function reboot(from){ const T = fresh(from.__tag); putLS(T, from.localStorage._map); boot(T); return T; }
// one hop through the sheet, exactly as the sheet does it; returns 1 when the target was not offered
function hop(IA, c, h){
  view(IA, c.w, c.d); const dy = dayOf(IA, c.w, c.d); const it = dy && dy.sections[h.si] && dy.sections[h.si].items[h.ii];
  if(!it) return 1;
  const ex = 'activeProg.weeks[' + c.w + '].' + c.d;
  const cands = Array.from(E(IA, '__cands(' + ex + ',' + c.w + ',' + JSON.stringify(it.name) + ')'));
  const can = E(IA, '__canSwap(' + ex + ',' + h.si + ',' + h.ii + ')');
  IA.ctx.__c = { secIdx:h.si, itemIdx:h.ii, name:it.name, detail:it.detail }; IA.ctx.__to = h.to; E(IA, '_swapCtx=__c;applySwapChoice(__to);');
  return (!can || !cands.includes(h.to)) ? 1 : 0;
}
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hstr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h | 0; }
function shuffled(arr, key){ const a = arr.slice(), r = mulberry(hstr(key)); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
// hand membership: the froms each hop renames, from the chain tuple and the card the enumerator read
const handU = c => new Set(c.hops.map(h => h.from)).size === c.hops.length;
// store membership: exactly one record per hop, each hop's {from, to} matched once
const storeU = (c, rec) => rec.length === c.hops.length && c.hops.every(h => rec.filter(e => e && e.from === h.from && e.to === h.to).length === 1);
const slotsOf = c => { const seen = new Set(), out = []; c.hops.forEach(h => { const k = h.si + ':' + h.ii; if(!seen.has(k)){ seen.add(k); out.push(h); } }); return out; };

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
let IA0, STAMP = NaN;
try { IA0 = load(ART); STAMP = +IA0.version; } catch(e){ failAll('boot', 'the candidate does not load in the harness: ' + e.message); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION !== undefined){
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  } else console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
// V228 D193 R1 (split, Mario round 2; Amendment 2 "g227 gates"): the hand cue literal is version-predicated on the artifact's own ia-version, "three" at 228 and above, "two" at 227 and below, so the row still runs on V227. Sited here, after VER: VER is a `let` declared above, so the old site (the HAND ORACLE / ORACLE block) would read it in its temporal dead zone.
const CUE = VER >= 228 ? ' — hold RPE 7, three in the tank' : ' — hold RPE 7, two in the tank';
console.log('g227 D190 seam | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + ' | N ' + N + ', N3 ' + N3 + ', NC ' + NC);
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D190 P-SWAPSEAM (V' + ERA + '). No row may pass on it.');
  failAll('REFUSED');
}
// V226 baseline for rows a-U' and d-U' (V227 slice 10, the V226 slice 7e form of g225_d187_pacerate.js and the g226
// gates): argv[3] if it reads 226, else `git show <V226_COMMIT>:index.html` into os.tmpdir(), because
// tests/sabotage.py passes no argv[3]. fresh('B') reloads FILES.B on every chain, so the git copy lives until
// exit. No tree reading 226 leaves B null and the pair rows FAIL setup by name, never PASS.
let B = null, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!B){
  const f = path.join(os.tmpdir(), 'g227_d190_seam_v' + BASE_ERA + '_' + process.pid + '.html');
  try {
    try { fs.unlinkSync(f); } catch(e){}
    process.on('exit', () => { try { fs.unlinkSync(f); } catch(e){} });
    fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V226_COMMIT + ':index.html'], { maxBuffer: 1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ B = b; FILES.B = f; baseWhy += 'git show ' + V226_COMMIT.slice(0, 7) + ':index.html (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
console.log('  V226 tree: ' + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
// SELFCHECK: a boot equals itself and a fresh-page boot, every config, each tree
const self = {};
for(const tg of ['C', 'B']) { if(tg === 'B' && !B) continue; for(const ck of Object.keys(CFGS)){
  const X = fresh(tg); setup(X, ck); boot(X); const a = JS(dayOf(X, 5, 'thu')); boot(X); const b = JS(dayOf(X, 5, 'thu'));
  const c = JS(dayOf(reboot(X), 5, 'thu'));
  self[tg + ':' + ck] = a === b && a === c && a.length > 20; } }
const SELF = Object.values(self).every(Boolean);
console.log('  SELFCHECK boot==boot==fresh boot, W5 Thu: ' + (SELF ? 'all ' + Object.keys(self).length + ' true' : JSON.stringify(self)));

// ── e-PRE: locate the four natively cued items (HAND) ─────────────────────────────────────────────────────────────
const LOC = [];   // {i, ck, w, d, si, ii} per located item
{
  const lines = []; let good = 0;
  for(let i = 0; i < CUED.length; i++){ const h = CUED[i];
    const X = fresh('C'); setup(X, h.ck); boot(X); const dy = dayOf(X, h.w, h.d); const hits = [];
    ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && clean(it.name) === h.name) hits.push({ si, ii, label:clean(s.label), detail:it.detail || '' }); }));
    const pat = E(X, '_pattern(' + JSON.stringify(h.name) + ')') || '-';
    const region = CFGS[h.ck].injury.region, capped = CAP[region].includes(h.pat);
    const hit = hits[0];
    const okI = hits.length === 1 && (!h.sec || hit.label.indexOf(h.sec) === 0) && hit.detail.endsWith(CUE) && capped && pat === h.pat;
    if(okI){ good++; LOC.push({ i, ck:h.ck, w:h.w, d:h.d, si:hit.si, ii:hit.ii }); }
    lines.push('    e-PRE ' + h.ck + ' W' + h.w + ' ' + h.d + ' ' + (h.sec || '*') + ' :: ' + h.name + ' | found ' + hits.length + (hit ? ' at [' + hit.si + '][' + hit.ii + '] "' + hit.label + '" ' + JSON.stringify(hit.detail) : '')
      + ' | typed ' + h.pat + (capped ? ' in ' : ' NOT in ') + region + '/wa cap | classifier ' + pat + ' | ' + (okI ? 'ok' : 'NO'));
  }
  lines.forEach(l => console.log(l));
  ok('ePRE', R.ePRE, SELF && good === CUED.length, good + '/' + CUED.length + ' located, cued, typed capped');
}

// ── ENUMERATE (tree under test; measure's enumerator; hand froms carried on every hop) ────────────────────────────────
const POP = {};
for(const ck of Object.keys(CFGS)){
  const IA = fresh('C'); setup(IA, ck); boot(IA); const all = { hop1:[], hop2:[], cyc2:[] }, pop = []; let id = 0;
  const den = {};
  const cand = (w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')'));
  const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  const mk = (cls, w, d, hops, full) => ({ id:ck + '#' + id++, ck, cls, w, d, hops, full:!!full, cued:-1 });
  for(const w of WEEKS) for(const d of DAYS){
    const live = dayOf(IA, w, d); if(!live || !live.sections) continue;
    const base = clone(live); IA.ctx.__D = base;
    const slots = []; base.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) slots.push({ si, ii, n:it.name }); }));
    if(!slots.length) continue;
    const full = (FULL[ck] || []).includes(d);
    const lat = { hop1:[], hop2:[], cyc2:[] }, two = [], col = [], exc = [];
    for(const sl of slots){ IA.ctx.__D = base; const c1 = cand(w, sl.n);
      for(const Bn of c1){ const h1 = { si:sl.si, ii:sl.ii, from:sl.n, to:Bn }; lat.hop1.push([h1]);
        const d1 = clone(base); d1.sections[sl.si].items[sl.ii].name = Bn; IA.ctx.__D = d1; if(!can(sl.si, sl.ii)) continue;
        for(const C of cand(w, Bn)){ const hops = [h1, { si:sl.si, ii:sl.ii, from:Bn, to:C }]; lat[C === sl.n ? 'cyc2' : 'hop2'].push(hops); two.push({ sl, d1, C, hops }); } } }
    for(const si of slots) for(const sj of slots){ if(si === sj) continue;
      IA.ctx.__D = base; for(const X of cand(w, si.n)){ const d1 = clone(base); d1.sections[si.si].items[si.ii].name = X; IA.ctx.__D = d1;
        if(!cand(w, sj.n).includes(si.n)) continue;
        const h2 = [{ si:si.si, ii:si.ii, from:si.n, to:X }, { si:sj.si, ii:sj.ii, from:sj.n, to:si.n }]; col.push(h2);
        const d2 = clone(d1); d2.sections[sj.si].items[sj.ii].name = si.n; IA.ctx.__D = d2;
        if(can(si.si, si.ii) && cand(w, X).includes(sj.n)) exc.push(h2.concat([{ si:si.si, ii:si.ii, from:X, to:sj.n }])); } }
    // hop3 / cyc3: a seeded walk off the day's two-hop chains; hop3 off a hop2 and hop3 off a cyc2 (the revisit stratum) apart
    const h3 = [], h3r = [], c3l = []; const rnd = mulberry(hstr(ck + '|' + w + '|' + d + '|h3'));
    for(const t of shuffled(two, ck + '|' + w + '|' + d + '|two').slice(0, 160)){
      const rv = t.C === t.sl.n;
      if(h3.length >= N3 && h3r.length >= N3 && c3l.length >= N3) break;
      const d2 = clone(t.d1); d2.sections[t.sl.si].items[t.sl.ii].name = t.C; IA.ctx.__D = d2; if(!can(t.sl.si, t.sl.ii)) continue;
      const c3 = cand(w, t.C); if(!c3.length) continue;
      if(!rv && c3.includes(t.sl.n) && c3l.length < N3){ c3l.push(t.hops.concat([{ si:t.sl.si, ii:t.sl.ii, from:t.C, to:t.sl.n }])); continue; }
      const others = c3.filter(x => x !== t.sl.n); if(!others.length) continue;
      const tgt = rv ? h3r : h3; if(tgt.length < N3) tgt.push(t.hops.concat([{ si:t.sl.si, ii:t.sl.ii, from:t.C, to:others[Math.floor(rnd() * others.length)] }]));
    }
    const k = 'W' + w;
    for(const cls of LAT){ den[k + '|' + cls] = (den[k + '|' + cls] || 0) + lat[cls].length;
      const take = full ? lat[cls] : shuffled(lat[cls], ck + '|' + w + '|' + d + '|' + cls).slice(0, N);
      take.forEach(h => pop.push(mk(cls, w, d, h, full))); }
    den[k + '|collide2'] = (den[k + '|collide2'] || 0) + col.length; den[k + '|exch3'] = (den[k + '|exch3'] || 0) + exc.length;
    shuffled(col, ck + w + d + 'col').slice(0, NC).forEach(h => pop.push(mk('collide2', w, d, h)));
    shuffled(exc, ck + w + d + 'exc').slice(0, NC).forEach(h => pop.push(mk('exch3', w, d, h)));
    h3.concat(h3r).forEach(h => pop.push(mk('hop3', w, d, h))); c3l.forEach(h => pop.push(mk('cyc3', w, d, h)));
  }
  // row (e): chains whose first hop leaves a located natively cued item
  pop.forEach(c => { if(!LAT.includes(c.cls)) return; const h0 = c.hops[0]; const L = LOC.find(x => x.ck === ck && x.w === c.w && x.d === c.d && x.si === h0.si && x.ii === h0.ii); if(L) c.cued = L.i; });
  POP[ck] = pop;
  console.log('  ENUM ' + ck.padEnd(11) + ' denominators ' + fmt(den) + '\n         population ' + pop.length + ' ' + fmt(tally(pop, c => 'W' + c.w + '|' + c.cls + (c.full ? '|FULL' : ''))));
}
console.log('  enumerated | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

// ── RUN (one chain per day per batch, each batch a fresh page and a fresh store; each boot a fresh page) ──────────────
function run(tg, ck, chains, withUndo){
  const out = [];
  const byDay = {}; chains.forEach(c => { (byDay[c.w + '_' + c.d] = byDay[c.w + '_' + c.d] || []).push(c); });
  const lists = Object.values(byDay), nB = Math.max(0, ...lists.map(l => l.length));
  for(let b = 0; b < nB; b++){
    const batch = lists.map(l => l[b]).filter(Boolean);
    const A = fresh(tg); setup(A, ck); boot(A); const st = {};
    for(const c of batch){ const s = st[c.id] = { pre:sig(dayOf(A, c.w, c.d)), unreach:0 }; const L = c.hops.length - 1;
      c.hops.forEach((h, k) => { if(k === L) s.prevJ = JS(dayOf(A, c.w, c.d).sections); s.unreach += hop(A, c, h); });
      const dy = dayOf(A, c.w, c.d); s.live = slotsOf(c).map(h => slotOf(dy, h.si, h.ii)); s.liveSig = sig(dy); }
    const dev = dumpLS(A), store = Jget(A, 'ia_swaps_PM');            // the device storage the act left, read before the boot
    batch.forEach(c => { st[c.id].rec = store['w' + c.w + '_' + c.d] || []; });
    const Rc = fresh(tg); putLS(Rc, dev); boot(Rc);
    batch.forEach(c => { const dy = dayOf(Rc, c.w, c.d); Object.assign(st[c.id], { boot:slotsOf(c).map(h => slotOf(dy, h.si, h.ii)), bootSig:sig(dy) }); });
    if(withUndo) batch.forEach(c => { const s = st[c.id], hl = c.hops[c.hops.length - 1]; view(A, c.w, c.d);
      const nm = dayOf(A, c.w, c.d).sections[hl.si].items[hl.ii].name;
      s.chip = E(A, 'swapOriginOf(' + JSON.stringify(nm) + ')') || '';
      if(s.chip) E(A, 'undoSwap(' + JSON.stringify(s.chip) + ');');
      s.undoEq = !!s.chip && JS(dayOf(A, c.w, c.d).sections) === s.prevJ; });
    batch.forEach(c => { const s = st[c.id]; delete s.prevJ;
      s.eq = s.live.every((x, i) => x.n === s.boot[i].n && x.d === s.boot[i].d); out.push(Object.assign({ c }, s)); });
  }
  return out;
}
const ROWS = [];
for(const ck of Object.keys(CFGS)){ const tc = Date.now(); ROWS.push(...run('C', ck, POP[ck], true)); console.log('  ran ' + ck + ' ' + POP[ck].length + ' chains in ' + ((Date.now() - tc) / 1000).toFixed(1) + ' s'); }
const tag = r => r.c.ck + ' W' + r.c.w + ' ' + r.c.d + ' ' + r.c.cls + ' ' + r.c.hops[0].from + ' > ' + r.c.hops.map(h => h.to).join(' > ');
const reach = ROWS.filter(r => !r.unreach);
console.log('  chains run ' + ROWS.length + ', reachable ' + reach.length + ', dropped (a hop not offered at replay) ' + (ROWS.length - reach.length) + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

// ── a-MEM ──────────────────────────────────────────────────────────────────────────────────────────────────────────
reach.forEach(r => { r.sU = storeU(r.c, r.rec); r.hU = handU(r.c); });
const U = reach.filter(r => r.sU), UP = reach.filter(r => !r.sU);
{
  const mis = reach.filter(r => r.sU !== r.hU);
  console.log('    a-MEM U ' + U.length + ' ' + fmt(tally(U, r => r.c.cls)) + '\n          U\' ' + UP.length + ' ' + fmt(tally(UP, r => r.c.cls)) + '\n          store != hand ' + mis.length);
  mis.slice(0, 4).forEach(r => console.log('      ' + tag(r) + ' | hand ' + (r.hU ? 'U' : "U'") + ' store ' + (r.sU ? 'U' : "U'") + ' ' + JSON.stringify(r.rec.map(e => e.from + '->' + e.to))));
  ok('aMEM', R.aMEM, SELF && reach.length > 0 && U.length > 0 && mis.length === 0, 'store != hand ' + mis.length + '/' + reach.length + ", |U| " + U.length + ", |U'| " + UP.length);
}
// ── a-U ────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const res = U.filter(r => !r.eq), moved = U.filter(r => r.liveSig !== r.pre).length;
  const seg = {}; U.forEach(r => { const k = r.c.ck + '|W' + r.c.w + '|' + r.c.cls; const o = seg[k] = seg[k] || [0, 0]; o[1]++; if(!r.eq) o[0]++; });
  console.log('    a-U residue by config|week|class: ' + Object.keys(seg).sort().map(k => k + ' ' + seg[k][0] + '/' + seg[k][1]).join(' | '));
  if(res.length){ console.log('    a-U residue by config|week|day|class: ' + fmt(tally(res, r => r.c.ck + '|W' + r.c.w + '|' + r.c.d + '|' + r.c.cls)));
    const pr = tally(res, r => { const i = r.live.findIndex((x, j) => x.n !== r.boot[j].n || x.d !== r.boot[j].d); return r.live[i].d + ' -> ' + r.boot[i].d; });
    Object.keys(pr).sort((a, b) => pr[b] - pr[a]).slice(0, 8).forEach(k => console.log('      ' + pr[k] + '× live ' + k.replace(' -> ', ' | boot ')));
    res.slice(0, 4).forEach(r => console.log('      ' + tag(r) + '\n        live ' + JSON.stringify(r.live) + '\n        boot ' + JSON.stringify(r.boot))); }
  ok('aU', R.aU, SELF && U.length > 0 && moved > 0 && res.length === 0, 'residue ' + res.length + '/' + U.length + ', chains that moved the live card ' + moved);
}
// ── a-U' (pair vs V226) + INFO D191 ───────────────────────────────────────────────────────────────────────────────
{
  const resP = UP.filter(r => !r.eq);
  console.log("    INFO D191 P-SWAPREVISIT (never asserted, never licensed): |U'| " + UP.length + ', residue ' + resP.length + ' | ' + fmt(tally(resP, r => r.c.ck + '|' + r.c.cls)));
  resP.slice(0, 3).forEach(r => console.log('      ' + tag(r) + ' store ' + JSON.stringify(r.rec.map(e => e.from + '->' + e.to)) + '\n        live ' + JSON.stringify(r.live) + '\n        boot ' + JSON.stringify(r.boot)));
  if(!B) ok('aUp', R.aUp + ' (setup: no V226 tree: ' + baseWhy + ')', false);
  else {
    const BR = new Map(); for(const ck of Object.keys(CFGS)){ const ch = UP.filter(r => r.c.ck === ck).map(r => r.c); if(ch.length) run('B', ck, ch, false).forEach(x => BR.set(x.c.id, x)); }
    const both = UP.filter(r => BR.has(r.c.id) && !BR.get(r.c.id).unreach);
    const bEq = both.filter(r => BR.get(r.c.id).eq), created = bEq.filter(r => !r.eq), healed = both.filter(r => !BR.get(r.c.id).eq && r.eq);
    console.log("    a-U' V226 run " + BR.size + ', reachable on both ' + both.length + ' | V226 boots == live ' + bEq.length + ', of those candidate != live (created) ' + created.length + ' | healed ' + healed.length);
    created.slice(0, 3).forEach(r => console.log('      created ' + tag(r) + '\n        live ' + JSON.stringify(r.live) + ' boot ' + JSON.stringify(r.boot)));
    ok('aUp', R.aUp, SELF && created.length === 0, "created " + created.length + " of " + bEq.length + " U' chains equal on V226 (|U'| " + UP.length + ', healed ' + healed.length + ')');
  }
}
// ── d (RE-RULING 2): d-U on U_d, INFO D192 P-UNDOKEY, d-U' pair on U_d' vs V226 ───────────────────────────────────────
{
  // MEMBER_d by hand: the hop `to` names from the chain tuple, pairwise distinct (one chain per day per batch, so the
  // day's hops are the chain's). The hand chip is the last hop's `from`; r.chip is what the card reads off the store
  // (swapOriginOf of the name the last hop wrote into its slot, run()), so chip == hand chip is the store-side check.
  const handUd = c => new Set(c.hops.map(h => h.to)).size === c.hops.length;
  const hChip = c => c.hops[c.hops.length - 1].from;
  const chipOk = r => !!r.chip && r.chip === hChip(r.c);
  const CLS = ['hop1', 'hop2', 'cyc2', 'hop3', 'cyc3', 'collide2', 'exch3'];
  // shape: one-slot chains as the name walk (A>B>C>B), cross-slot chains hop by hop; letters by first appearance
  const shape = c => { const L = new Map(), lt = x => { if(!L.has(x)) L.set(x, String.fromCharCode(65 + L.size)); return L.get(x); };
    const one = c.hops.every(h => h.si === c.hops[0].si && h.ii === c.hops[0].ii);
    return c.cls + ' ' + (one ? [c.hops[0].from].concat(c.hops.map(h => h.to)).map(lt).join('>') : c.hops.map(h => '[' + h.si + '][' + h.ii + ']' + lt(h.from) + '>' + lt(h.to)).join(' ')); };
  const Ud = reach.filter(r => handUd(r.c)), UdP = reach.filter(r => !handUd(r.c));
  const resU = Ud.filter(r => !chipOk(r) || !r.undoEq);
  console.log("    d-U |U_d| " + Ud.length + " (|U_d'| " + UdP.length + ') by class, chip == hand chip / undo byte-identical / |U_d|: '
    + CLS.map(k => { const g = Ud.filter(r => r.c.cls === k); return k + ' ' + g.filter(chipOk).length + '/' + g.filter(r => r.undoEq).length + '/' + g.length; }).join(' | '));
  console.log('          by config, chip == hand chip and undo byte-identical / |U_d|: ' + Object.keys(CFGS).map(ck => { const g = Ud.filter(r => r.c.ck === ck); return ck + ' ' + g.filter(r => chipOk(r) && r.undoEq).length + '/' + g.length; }).join(' | '));
  if(resU.length){ console.log('    d-U residue by config|week|class: ' + fmt(tally(resU, r => r.c.ck + '|W' + r.c.w + '|' + r.c.cls)));
    resU.slice(0, 4).forEach(r => console.log('      ' + tag(r) + ' | chip ' + (r.chip || '(none)') + ', hand chip ' + hChip(r.c) + (r.undoEq ? '' : ', undo not byte-identical'))); }
  ok('dU', R.dU, SELF && Ud.length > 0 && resU.length === 0, 'residue ' + resU.length + '/' + Ud.length + ' (no chip ' + Ud.filter(r => !r.chip).length
    + ', chip != hand chip ' + Ud.filter(r => r.chip && !chipOk(r)).length + ', undo not byte-identical ' + Ud.filter(r => !r.undoEq).length + ')');
  // U_d' on V226: the same chains acted, booted and undone on the baseline (fresh('B'))
  let BD = null;
  if(B){ BD = new Map(); for(const ck of Object.keys(CFGS)){ const ch = UdP.filter(r => r.c.ck === ck).map(r => r.c); if(ch.length) run('B', ck, ch, true).forEach(x => BD.set(x.c.id, x)); } }
  const both = BD ? UdP.filter(r => BD.has(r.c.id) && !BD.get(r.c.id).unreach) : [];
  const bEq = both.filter(r => BD.get(r.c.id).undoEq), created = bEq.filter(r => !r.undoEq), healed = both.filter(r => !BD.get(r.c.id).undoEq && r.undoEq);
  const wrongP = UdP.filter(r => !r.undoEq), byShape = tally(UdP, r => shape(r.c)), wrongShape = tally(wrongP, r => shape(r.c));
  console.log("    INFO D192 P-UNDOKEY (never asserted, never licensed): |U_d'| " + UdP.length + ', undo wrong ' + wrongP.length + ' | wrong/total by shape: '
    + (Object.keys(byShape).sort().map(k => k + ' ' + (wrongShape[k] || 0) + '/' + byShape[k]).join(' | ') || '(none)')
    + ' | chip != hand chip ' + UdP.filter(r => !chipOk(r)).length + ' | healed vs V226 ' + (BD ? healed.length : 'n/a (no V226 tree)'));
  wrongP.slice(0, 2).forEach(r => console.log('      ' + tag(r) + ' | chip ' + (r.chip || '(none)') + ', hand chip ' + hChip(r.c) + ' | store ' + JSON.stringify(r.rec.map(e => e.from + '->' + e.to))));
  if(!B) ok('dUp', R.dUp + ' (setup: no V226 tree: ' + baseWhy + ')', false);
  else {
    console.log("    d-U' V226 run " + BD.size + ', reachable on both ' + both.length + ' | V226 undoes byte-identical ' + bEq.length + ', of those candidate not (created) ' + created.length + ' | healed ' + healed.length);
    created.slice(0, 3).forEach(r => console.log('      created ' + tag(r) + ' | chip ' + (r.chip || '(none)') + ', V226 chip ' + (BD.get(r.c.id).chip || '(none)')));
    ok('dUp', R.dUp, SELF && UdP.length > 0 && both.length > 0 && created.length === 0, 'created ' + created.length + ' of ' + bEq.length + " U_d' chains byte-identical on V226 (|U_d'| " + UdP.length + ', on both ' + both.length + ', healed ' + healed.length + ')');
  }
}
// ── e ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const rows = reach.filter(r => r.c.cued >= 0), bad = rows.filter(r => !r.eq || r.liveSig !== r.bootSig);
  const per = CUED.map((h, i) => rows.filter(r => r.c.cued === i).length);
  console.log('    e chains per item: ' + CUED.map((h, i) => h.ck + ' W' + h.w + ' ' + h.name + ' ' + per[i]).join(' | ') + ' | ' + fmt(tally(rows, r => r.c.ck + '|' + r.c.cls)));
  bad.slice(0, 4).forEach(r => console.log('      ' + tag(r) + '\n        live ' + JSON.stringify(r.live) + '\n        boot ' + JSON.stringify(r.boot)));
  ok('e', R.e, SELF && LOC.length === CUED.length && per.every(n => n > 0) && bad.length === 0, 'live != boot ' + bad.length + '/' + rows.length + ' (' + per.join(' + ') + ')');
}
done();
