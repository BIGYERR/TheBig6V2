// g222_d181_chain.js — GATE for D181 (P-SWAPDURABLE), second re-ruling: the boot replays the athlete's swaps the way the
// athlete made them (R4'), and never onto a day the freeze restored from ia_hist_ (R5).
//
//   node tests/gates/g222_d181_chain.js <candidate.html> [baseline_V221.html]
//   IA_ASSUME_VERSION=222 node tests/gates/g222_d181_chain.js <tree stamped 221> [baseline_V221.html]   (discrimination only)
//
// THE RULING THIS DEFENDS: tests/measure/v222_rulings/p_swapdurable_ruling.md, section "SECOND RE-RULING ON V222 PARKED
// SLICE 3 (chain detail, snapshot re-apply)": R4' (records on one day replay in recording order, one record per pass,
// through applySwapPrefs -> _swapDetailFor, the function the sheet used), R5 (session swaps are never re-applied to a day
// the freeze restored from ia_hist_; the record is skipped, never deleted), "What the athlete sees on an untouched day",
// the "Revised gate rows" table rows 5, 5c, 5L, 5X, 8, 8d, 9 and the sabotage list S1 to S4; and the MARIO DECISION
// blocks (final: V222 = R1 + R2 + R3' + R4' + R5; the up_ts trade ACCEPTED). D-code D181, ships on ia-version 222.
// Rows 1 to 4, 5s, 6, 7 and 10 of the same table are g222_d181_durable.js, not this gate.
//
// ORACLE. Never the boot path; the engine is never asked for an expected value:
//   HAND   rows 5 and 5c: the ruling's own strings, typed (Leg press 4×8–12, goblet 4×8–12, box 4×3, box 4×8–12).
//   LIVE   what the athlete last saw: the day after the last applySwapChoice, before any boot.
//   HIST   the ia_hist_ record as the act wrote it, read from storage BEFORE the boot.
//   V221   row 9a only: V221's own boot of the same device storage (the ruling's "what V221 boots").
//   MAP    row 5L residue only: the parked composed-name-map form (the ruling's S1 shape, typed below as MAP_ASS) put in
//          place of applySessionSwaps for one boot of the same storage: the ruling's "composed-map boot".
// POPULATION. Chains are enumerated on the tree under test with measure's enumerator (tests/measure/
//   v222_swapdurable_chain.js): a hop is taken only when its target is in the swap sheet's own candidate list for the item
//   as it then stands (swapCandidates tier1+tier2, or auxSwapCandidates for a null-pattern aux-family item) and the slot's
//   canSwap flag is on. Replay re-checks each hop against the sheet; a row with a hop not offered at replay is dropped
//   from 5L, 5X and 9b and counted. Classes: hop2 (slot A->B->C), cyc2 (A->B->A), hop3/cyc3 (three hops, sampled),
//   collide2 (slot i A->X, then slot j B->A), exch3 (collide2, then slot i X->B).
//   Fixtures: MARIO = commercial|support_strength|beginner|liftonly|knee/workaround, seed 76308; HALF_MANNY (harness, seed
//   76308, unmoved). Program start 2026-08-24, clock pinned 2026-09-24 (W5 Thu = today). Weeks 3 (past), 5, 7.
//   POP_U (untouched, rows 5L 5X): EVERY reachable hop2/cyc2/collide2/exch3 chain on MARIO W5, plus a fixed-seed sample
//          of at most NU per (config, week, day, class) on MARIO W3 and HALF_MANNY W3/W5/W7.
//   POP_H (snapshot modes, rows 8 8d 9): a fixed-seed sample of at most N8 per (config, week, day, class), six classes.
//   The full enumeration (measure's script, TREES = {BASE, FINAL}) is gatekeeper's one-off ship proof; this is the guard.
// BOOT MODEL. A boot in the app is a fresh page. The harness VM is not: HALF_MANNY's build hands out 25 items that are
//   shared by reference with module-level tables (V221 and V222 alike; MARIO 0), so the live path's in-place rename leaks
//   into the next buildProgram in the same VM, and an in-VM "reboot" starts from a card that already carries the swap
//   (manny W5 Fri collide2 woodchopper->Dead bug, wipers->woodchopper boots {Dead bug, Dead bug} in-VM, {Dead bug,
//   woodchopper} = live on a fresh page). So every act starts on a fresh VM and every boot is a fresh VM loaded with the
//   device storage the act left: load() is ~3 ms. SELFCHECK proves a boot equals itself and equals a fresh-page boot.
// MODES. u = untouched. t1 = touch then chain. t2 = chain then touch. "up_" = the V221 baseline acts and writes storage,
//   then the candidate boots that storage: up_ts = V221 touch, chain, no boot; up_st = V221 chain, touch, no boot;
//   up_bt = V221 chain, V221 boot, touch. A touch is writeSetDraft on the viewed day (a V104 first-touch hook).
//
// VERSION PREDICATE (standing rulings 2 and 4). D181 ships at 222.
//   below 222      REFUSED, every assertion row FAILS by name.
//   222 and up     every row asserts. Rows 8, 8d and 9a are CONTROLS: they pass on V221 too (V221's pruneSwaps deleted
//                  every record below _cut before any re-apply); sabotage S4 (drop R5) is what proves them.
//   5L licence     slot detail != live is licensed up to LIC5L_MAX (70, the residue STEP printed over 15,545 chains, the
//                  boot-side injury re-filter of section 12 (C)), each residue row's boot equal to the MAP boot. The licence
//                  is a predicate on ia-version == 222: above 222 it is REFUSED and 5L demands a residue of 0 until re-ruled.
//   IA_ASSUME_VERSION=222 lifts a file stamped exactly 221 to 222 for a discrimination run. It is announced, and ignored
//   on any other file. gate.sh never sets it.
//   V221 tree      the up_ modes of rows 8 and 8d, and row 9, load the baseline from argv[3] when it reads 221, else from
//                  git 57b9dee:index.html. If neither is available those rows FAIL setup by name, never PASS.
//
// ROWS
//   5   MARIO W5 Thu, untouched: Barbell box squat -> Dumbbell goblet squat -> Leg press through applySwapChoice. The last
//       live card is Leg press 4×8–12 (HAND); the booted card equals it in name AND detail (slot, HAND) and as a whole day
//       (LIVE); the chip offers goblet; undo -> goblet 4×8–12, survives a boot, chip offers box; undo -> Barbell box squat
//       4×3, survives a boot, the day's swap store is empty. Ruling: V221 goblet 0/1, parked MAP Leg press 4×5–8 0/1.
//   5c  MARIO W5 Thu, untouched 2-cycle through the sheet, box -> goblet -> box: last live card Barbell box squat 4×8–12
//       (HAND); boots 1 and 2 equal it (slot HAND, whole day LIVE). Ruling: V221 goblet 0/1, MAP box 4×3 0/1.
//   5L  POP_U hop2+cyc2, reachable: slot name != live 0; slot detail != live within the licence; every residue row's
//       boot equals the MAP boot (so the residue is the boot-side injury re-filter, not the form).
//   5X  POP_U collide2 and exch3, reachable: whole day == live, every one.
//   8   CONTROL. POP_H, every class (hop2 cyc2 hop3 cyc3 collide2 exch3) x every snapshot mode (t1 t2 up_st up_bt up_ts):
//       the booted day is byte-equal (clock fields stripped) to its ia_hist_ record as written. 0 rewrites.
//   8d  CONTROL. No duplicate item name on a booted hist-restored card (same population), as ruled: any name twice on
//       the booted card. The count of snapshots that already carry a duplicate is printed beside it (0 on this population
//       with fresh-page boots) so a failure can be told from an athlete-made duplicate. NOTE: on an injured config
//       (MARIO) the boot-side applyInjuryFilter collapses a rewritten {X, X} to {X}, so this count UNDERCOUNTS a rewrite
//       there; row 8's byte check is the one that catches it. HALF_MANNY (no injury) carries its signal.
//   9a  CONTROL. up_ts: the candidate boots day-for-day what V221 boots from the same storage (the snapshot, the donor),
//       byte-equal. This is the accepted up_ts trade.
//   9b  up_ts, then on the candidate one re-tap of the athlete's chain through the sheet, reboot: the booted day equals
//       the re-tapped live day (R1 folds the re-tap into the snapshot; R5 keeps it).
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const ERA = 222, BASE_ERA = 221, V221_COMMIT = '57b9dee80269743a40b350aa399351661dd9c06b';
const LIC5L_ERA = 222, LIC5L_MAX = 70, LIC5L_OF = 15545;
const NU = 40, N8 = 6;
let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { try { if(TMPD) fs.rmSync(TMPD, { recursive:true, force:true }); } catch(e){} console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

const R = {
  R5:  "row 5  untouched MARIO W5 Thu box->goblet->Leg press: boot = last live card in name AND detail (Leg press 4×8–12), chip offers goblet, two undos reach Barbell box squat 4×3 with the store empty",
  R5c: "row 5c untouched MARIO W5 Thu 2-cycle box->goblet->box: boots 1 and 2 = last live card (Barbell box squat 4×8–12)",
  R5L: "row 5L untouched reachable hop2+cyc2: slot name != live 0; slot detail != live within the V222 residue licence; every residue row boots equal to the composed-map boot",
  R5X: "row 5X untouched reachable collide2 and exch3: whole day == live, all of them",
  R8:  "row 8  CONTROL hist-restored day boots byte-equal to its ia_hist_ record, every class x t1 t2 up_st up_bt up_ts",
  R8d: "row 8d CONTROL no duplicate item name on a booted hist-restored card (undercounts on injured MARIO; row 8 is the byte check)",
  R9a: "row 9a CONTROL up_ts: candidate boots byte-equal, day for day, to V221's boot of the same storage",
  R9b: "row 9b up_ts then one re-tap on the candidate, reboot: holds (boot == re-tapped live day)",
};

// ── HAND ORACLE (the ruling's strings) ───────────────────────────────────────────────────────────────────────────
const DONOR = 'Barbell box squat', GOB = 'Dumbbell goblet squat', LP = 'Leg press';
const RX_TAIL = ' — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const RX812 = '4×8–12' + RX_TAIL, RX3 = '4×3' + RX_TAIL;
// MAP: the parked composed-name-map form (ruling S1 shape), typed. Used only for the 5L residue comparison.
const MAP_ASS = "function(prog,store){if(!prog||!prog.weeks||!store)return;Object.keys(store).forEach(function(k){"
  + "var m=/^w(\\d+)_(.+)$/.exec(k);if(!m)return;var w=+m[1],d=m[2];var day=prog.weeks[w]&&prog.weeks[w][d];"
  + "if(!day||!Array.isArray(day.sections))return;var list=(store[k]||[]).filter(function(e){return e&&e.from&&e.to;});"
  + "var map=Object.create(null);list.forEach(function(r){var cur=r.from;list.forEach(function(e){if(e.from===cur)cur=e.to;});map[r.from]=cur;});"
  + "if(applySwapPrefs(day.sections,map)&&prog.cfg&&prog.cfg.injury){day.sections=applyInjuryFilter(day.sections,prog.cfg);}});}";

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24';
const CFGS = {
  mario: { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
    experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } },
  manny: JSON.parse(JSON.stringify(fixtures.HALF_MANNY)) };
const WEEKS = [3, 5, 7], DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const clone = x => JSON.parse(JSON.stringify(x));
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i;
const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};"
  + "globalThis.__origASS=applySessionSwaps;globalThis.__mapASS=" + MAP_ASS + ";";
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
function dupName(dy){ const m = {}; (dy && dy.sections || []).forEach(s => (s.items || []).forEach(it => { const n = clean(it && it.name); if(n) m[n] = (m[n] || 0) + 1; })); return Object.keys(m).find(n => m[n] > 1) || null; }
const Jget = (IA, k) => JSON.parse(IA.localStorage.getItem(k) || '{}');
const dumpLS = IA => new Map(IA.localStorage._map);
function putLS(IA, m){ IA.localStorage.clear(); for(const [k, v] of m) IA.localStorage.setItem(k, v); }
function reboot(from, which){ const T = fresh(which || from.__tag); putLS(T, from.localStorage._map); boot(T); return T; }   // a fresh page on the same device
function touch(IA, c){ view(IA, c.w, c.d); E(IA, "writeSetDraft('zz_touch',['1'],['1'],'');"); }
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

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
let IA, STAMP = NaN;
try { IA = load(ART); IA.__tag = 'C'; STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let TMPD = null;
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION !== undefined){
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  } else console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
console.log('g222 D181 chain | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + ' | NU ' + NU + ', N8 ' + N8);
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D181 P-SWAPDURABLE R4\'/R5 (V' + ERA + '). No row may pass on it.');
  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
const LIC5L = VER === LIC5L_ERA;
console.log('  5L licence: ' + (LIC5L ? 'GRANTED at ia-version ' + VER + ' (residue <= ' + LIC5L_MAX + ', each residue row = MAP boot)' : 'REFUSED at ia-version ' + VER + ' (keyed on ' + LIC5L_ERA + ' only, standing ruling 2): residue must be 0 until re-ruled'));
// V221 baseline for the up_ modes and row 9
let B = null, baseWhy = '';
try {
  if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3]'; } else baseWhy = 'argv[3] reads ' + b.version + '; '; }
  if(!B){
    TMPD = fs.mkdtempSync(path.join(os.tmpdir(), 'g222d181-')); const f = path.join(TMPD, 'v221.html');
    fs.writeFileSync(f, cp.execFileSync('git', ['show', V221_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27, stdio:['ignore', 'pipe', 'ignore'] }));
    const b = load(f); if(+b.version === BASE_ERA){ B = b; FILES.B = f; baseWhy += 'git ' + V221_COMMIT.slice(0, 7); } else baseWhy += 'git reads ' + b.version;
  }
} catch(e){ baseWhy += 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); B = null; }
if(B) B.__tag = 'B';
console.log('  V221 tree: ' + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
pin(IA); E(IA, HELP); if(B){ pin(B); E(B, HELP); }
// the MAP override must actually reach refreshProgram's call
const mapLive = E(IA, "(function(){var o=applySessionSwaps;applySessionSwaps=__mapASS;var r=(applySessionSwaps===__mapASS);applySessionSwaps=__origASS;return r&&applySessionSwaps===o;})()");
// SELFCHECK: a boot equals itself on each tree and config, and the day is non-empty
const self = {};
for(const T of [IA, B].filter(Boolean)) for(const ck of Object.keys(CFGS)){
  const X = fresh(T.__tag); setup(X, ck); boot(X); const a = JS(dayOf(X, 5, 'thu')); boot(X); const b = JS(dayOf(X, 5, 'thu'));
  const c = JS(dayOf(reboot(X), 5, 'thu'));
  self[T.__tag + ck] = a === b && a === c && a.length > 20;
}
const SELF = Object.values(self).every(Boolean);
console.log('  SELFCHECK boot==boot==fresh boot, W5 Thu: ' + JSON.stringify(self) + ' | MAP override reaches refreshProgram: ' + mapLive);

// ── ENUMERATE (tree under test; measure's enumerator; hop3/cyc3 by a seeded walk) ───────────────────────────────────
const ALL = {}, ENUM = {};
for(const ck of Object.keys(CFGS)){
  const IA = fresh('C'); setup(IA, ck); boot(IA); const chains = []; let id = 0; const st = { days:0, slots:0 };
  const cand = (w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')'));
  const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  const add = (cls, w, d, hops) => { chains.push({ id:ck + id++, ck, cls, w, d, hops }); const k = 'W' + w + '|' + cls; st[k] = (st[k] || 0) + 1; };
  for(const w of WEEKS) for(const d of DAYS){
    const live = dayOf(IA, w, d); if(!live || !live.sections) continue;
    const base = clone(live); IA.ctx.__D = base;
    const slots = []; base.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) slots.push({ si, ii, n:it.name }); }));
    if(!slots.length) continue; st.days++; st.slots += slots.length;
    const two = [];
    for(const sl of slots){ IA.ctx.__D = base; const c1 = cand(w, sl.n);
      for(const Bn of c1){ const d1 = clone(base); d1.sections[sl.si].items[sl.ii].name = Bn; IA.ctx.__D = d1; if(!can(sl.si, sl.ii)) continue;
        for(const C of cand(w, Bn)){ const hops = [{ si:sl.si, ii:sl.ii, to:Bn }, { si:sl.si, ii:sl.ii, to:C }]; add(C === sl.n ? 'cyc2' : 'hop2', w, d, hops); two.push({ sl, d1, C, hops }); } } }
    for(const si of slots) for(const sj of slots){ if(si === sj) continue;
      IA.ctx.__D = base; for(const X of cand(w, si.n)){ const d1 = clone(base); d1.sections[si.si].items[si.ii].name = X; IA.ctx.__D = d1;
        if(!cand(w, sj.n).includes(si.n)) continue;
        add('collide2', w, d, [{ si:si.si, ii:si.ii, to:X }, { si:sj.si, ii:sj.ii, to:si.n }]);
        const d2 = clone(d1); d2.sections[sj.si].items[sj.ii].name = si.n; IA.ctx.__D = d2;
        if(can(si.si, si.ii) && cand(w, X).includes(sj.n)) add('exch3', w, d, [{ si:si.si, ii:si.ii, to:X }, { si:sj.si, ii:sj.ii, to:si.n }, { si:si.si, ii:si.ii, to:sj.n }]); } }
    // hop3 / cyc3: a seeded walk off the day's two-hop chains, N8 of each at most
    let n3 = 0, nc3 = 0; const rnd = mulberry(hstr(ck + '|' + w + '|' + d + '|h3'));
    for(const t of shuffled(two, ck + '|' + w + '|' + d + '|two').slice(0, 80)){
      if(n3 >= N8 && nc3 >= N8) break;
      const d2 = clone(t.d1); d2.sections[t.sl.si].items[t.sl.ii].name = t.C; IA.ctx.__D = d2; if(!can(t.sl.si, t.sl.ii)) continue;
      const c3 = cand(w, t.C); if(!c3.length) continue;
      if(c3.includes(t.sl.n) && nc3 < N8){ nc3++; add('cyc3', w, d, t.hops.concat([{ si:t.sl.si, ii:t.sl.ii, to:t.sl.n }])); continue; }
      const others = c3.filter(x => x !== t.sl.n); if(others.length && n3 < N8){ n3++; add('hop3', w, d, t.hops.concat([{ si:t.sl.si, ii:t.sl.ii, to:others[Math.floor(rnd() * others.length)] }])); }
    }
  }
  ALL[ck] = chains; ENUM[ck] = st;
  console.log('  ENUM ' + ck + ' (weeks ' + WEEKS.join(',') + '): ' + JSON.stringify(st));
}
// ── POPULATIONS ───────────────────────────────────────────────────────────────────────────────────────────────────
const U_CLS = ['hop2', 'cyc2', 'collide2', 'exch3'], H_CLS = ['hop2', 'cyc2', 'hop3', 'cyc3', 'collide2', 'exch3'];
function pick(ck, classes, n, full, tag){
  const g = {}; ALL[ck].filter(c => classes.includes(c.cls)).forEach(c => { const k = c.w + '|' + c.d + '|' + c.cls; (g[k] = g[k] || []).push(c); });
  let out = []; Object.keys(g).sort().forEach(k => { const w = +k.split('|')[0]; out = out.concat(full(w) ? g[k] : shuffled(g[k], ck + '|' + k + '|' + tag).slice(0, n)); }); return out;
}
const POP_U = { mario:pick('mario', U_CLS, NU, w => w === 5, 'U'), manny:pick('manny', U_CLS, NU, () => false, 'U') };
const POP_H = { mario:pick('mario', H_CLS, N8, () => false, 'H'), manny:pick('manny', H_CLS, N8, () => false, 'H') };
const census = rows => { const m = {}; rows.forEach(c => { const k = 'W' + c.w + '|' + c.cls; m[k] = (m[k] || 0) + 1; }); return JSON.stringify(m); };
for(const ck of Object.keys(CFGS)) console.log('  POP_U ' + ck + ' ' + POP_U[ck].length + ' ' + census(POP_U[ck]) + '\n  POP_H ' + ck + ' ' + POP_H[ck].length + ' ' + census(POP_H[ck]));

// ── RUN (measure's worker: one chain per day per batch, each batch a fresh page and a fresh store) ─────────────────
function run(ck, mode, chains){
  const up = mode.startsWith('up_'), out = [];
  const byDay = {}; chains.forEach(c => { (byDay[c.w + '_' + c.d] = byDay[c.w + '_' + c.d] || []).push(c); });
  const lists = Object.values(byDay), nB = Math.max(0, ...lists.map(l => l.length));
  for(let b = 0; b < nB; b++){
    const batch = lists.map(l => l[b]).filter(Boolean);
    const A = fresh(up ? 'B' : 'C'); setup(A, ck); boot(A);
    const pre = {}; batch.forEach(c => { pre[c.id] = sig(dayOf(A, c.w, c.d)); });
    if(mode === 't1' || mode === 'up_ts') batch.forEach(c => touch(A, c));
    const st = {};
    for(const c of batch){ let un = 0; for(const h of c.hops) un += hop(A, c, h); st[c.id] = { unreach:un }; }
    if(mode === 't2' || mode === 'up_st') batch.forEach(c => touch(A, c));
    const L = mode === 'up_bt' ? reboot(A) : A;                    // up_bt: V221 boots between the chain and the touch
    batch.forEach(c => { const dy = dayOf(L, c.w, c.d), h0 = c.hops[c.hops.length - 1]; Object.assign(st[c.id], { live:sig(dy), liveJ:JS(dy), slotLive:slotOf(dy, h0.si, h0.ii) }); });
    if(mode === 'up_bt') batch.forEach(c => touch(L, c));
    const dev = dumpLS(L);                                          // the device storage the act left
    const Rc = fresh('C'); putLS(Rc, dev);
    const recAll = Jget(Rc, 'ia_swaps_PM'), hist = Jget(Rc, 'ia_hist_PM');   // as written, before the boot
    boot(Rc);
    batch.forEach(c => { const k = 'w' + c.w + '_' + c.d, dy = dayOf(Rc, c.w, c.d), h0 = c.hops[c.hops.length - 1];
      Object.assign(st[c.id], { pre:pre[c.id], boot:sig(dy), bootJ:JS(dy), slotBoot:slotOf(dy, h0.si, h0.ii), histJ:hist[k] ? JS(hist[k]) : null,
        rec:(recAll[k] || []).length, dup:dupName(dy), histDup:hist[k] ? dupName(hist[k]) : null }); });
    if(mode === 'u'){
      const res = batch.filter(c => st[c.id].slotBoot.d !== st[c.id].slotLive.d);
      if(res.length){ const M = fresh('C'); putLS(M, dev); E(M, 'applySessionSwaps=__mapASS;'); boot(M); res.forEach(c => { st[c.id].mapBoot = sig(dayOf(M, c.w, c.d)); }); }
    }
    if(mode === 'up_ts'){
      const Vb = fresh('B'); putLS(Vb, dev); boot(Vb); batch.forEach(c => { st[c.id].v221J = JS(dayOf(Vb, c.w, c.d)); });
      for(const c of batch){ let un = 0; for(const h of c.hops) un += hop(Rc, c, h); st[c.id].rtUnreach = un; st[c.id].rtLiveJ = JS(dayOf(Rc, c.w, c.d)); }
      const R2 = reboot(Rc); batch.forEach(c => { st[c.id].rtBootJ = JS(dayOf(R2, c.w, c.d)); });
    }
    batch.forEach(c => out.push(Object.assign({ id:c.id, ck, cls:c.cls, w:c.w, d:c.d, mode, hops:c.hops.map(h => h.to).join('>') }, st[c.id])));
  }
  return out;
}
const tag = r => r.ck + ' W' + r.w + ' ' + r.d + ' ' + r.cls + ' ' + r.hops;

// ── ROW 5 / 5c (HAND) ────────────────────────────────────────────────────────────────────────────────────────────
{
  const W = 5, D = 'thu', k5 = 'w5_thu', C = { w:W, d:D };
  let A = fresh('C'); setup(A, 'mario'); boot(A); view(A, W, D);
  const d0 = dayOf(A, W, D); let L0 = null;
  (d0.sections || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!L0 && clean(it.name) === DONOR) L0 = { si, ii }; }));
  const slot = T => { const it = dayOf(T, W, D).sections[L0.si].items[L0.ii]; return clean(it.name) + ' | ' + clean(it.detail); };
  const daySig = T => sig(dayOf(T, W, D));
  const swapTo = (T, to) => hop(T, C, { si:L0.si, ii:L0.ii, to });
  const chip = T => { view(T, W, D); return E(T, 'swapOriginOf(' + JSON.stringify(clean(dayOf(T, W, D).sections[L0.si].items[L0.ii].name)) + ')') || '-'; };
  const undo = (T, from) => { view(T, W, D); E(T, 'undoSwap(' + JSON.stringify(from) + ');'); };
  const rb = T => { const X = reboot(T); view(X, W, D); return X; };
  if(!L0){ ok(R.R5 + ' (setup: ' + DONOR + ' not on MARIO W5 Thu, fixture moved)', false); ok(R.R5c + ' (setup: fixture moved)', false); }
  else {
    const H = { A:LP + ' | ' + RX812, G:GOB + ' | ' + RX812, D3:DONOR + ' | ' + RX3, B:DONOR + ' | ' + RX812 };
    const g = {}; g.pre = slot(A);
    g.un = swapTo(A, GOB) + swapTo(A, LP); g.live = slot(A); g.liveS = daySig(A);
    A = rb(A); g.boot = slot(A); g.bootS = daySig(A); g.chip = chip(A);
    undo(A, g.chip); g.u1 = slot(A); A = rb(A); g.bu1 = slot(A); g.chip2 = chip(A);
    undo(A, g.chip2); g.u2 = slot(A); A = rb(A); g.bu2 = slot(A);
    const left = Jget(A, 'ia_swaps_PM')[k5]; g.empty = !left || !left.length;
    console.log('  row 5 pre ' + g.pre + ' | live ' + g.live + ' (hops not offered ' + g.un + ')\n        BOOT ' + g.boot + ' chip=' + g.chip
      + ' | undo ' + g.u1 + ' BOOT ' + g.bu1 + ' chip=' + g.chip2 + ' | undo ' + g.u2 + ' BOOT ' + g.bu2 + ' store empty=' + g.empty);
    const c5 = g.pre === H.D3 && g.un === 0 && g.live === H.A && g.boot === H.A && g.bootS === g.liveS && g.chip === GOB
      && g.u1 === H.G && g.bu1 === H.G && g.chip2 === DONOR && g.u2 === H.D3 && g.bu2 === H.D3 && g.empty;
    ok(R.R5, SELF && c5, 'boot ' + g.boot + (g.bootS === g.liveS ? ' =live' : ' !=live') + ', chip ' + g.chip + ', ' + (c5 ? 1 : 0) + '/1');
    // 5c
    let Q = fresh('C'); setup(Q, 'mario'); boot(Q); view(Q, W, D);
    const q = {}; q.un = swapTo(Q, GOB) + swapTo(Q, DONOR); q.live = slot(Q); q.liveS = daySig(Q);
    Q = rb(Q); q.boot = slot(Q); q.bootS = daySig(Q); q.chip = chip(Q); Q = rb(Q); q.boot2 = slot(Q); q.boot2S = daySig(Q);
    console.log('  row 5c live ' + q.live + ' (hops not offered ' + q.un + ') | BOOT1 ' + q.boot + ' chip=' + q.chip + ' | BOOT2 ' + q.boot2);
    const c5c = q.un === 0 && q.live === H.B && q.boot === H.B && q.boot2 === H.B && q.bootS === q.liveS && q.boot2S === q.liveS;
    ok(R.R5c, SELF && c5c, 'BOOT1 ' + q.boot + (q.bootS === q.liveS ? ' =live' : ' !=live') + ', ' + (c5c ? 1 : 0) + '/1');
  }
}

// ── ROWS 5L / 5X (untouched) ─────────────────────────────────────────────────────────────────────────────────────
const U = [].concat(run('mario', 'u', POP_U.mario), run('manny', 'u', POP_U.manny));
console.log('  u rows ' + U.length + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
{
  const rows = U.filter(r => r.cls === 'hop2' || r.cls === 'cyc2'), reach = rows.filter(r => !r.unreach);
  const seg = {}; reach.forEach(r => { const k = r.ck + '|W' + r.w; const o = seg[k] = seg[k] || { n:0, name:0, det:0, resMap:0 }; o.n++;
    if(r.slotBoot.n !== r.slotLive.n) o.name++; if(r.slotBoot.d !== r.slotLive.d){ o.det++; if(r.mapBoot === r.boot) o.resMap++; } });
  Object.keys(seg).sort().forEach(k => console.log('    5L ' + k.padEnd(10) + ' n ' + seg[k].n + '  name!=live ' + seg[k].name + '  detail!=live ' + seg[k].det + '  residue boot==MAP ' + seg[k].resMap + '/' + seg[k].det));
  const name = reach.filter(r => r.slotBoot.n !== r.slotLive.n), det = reach.filter(r => r.slotBoot.d !== r.slotLive.d), resOff = det.filter(r => r.mapBoot !== r.boot);
  const moved = reach.filter(r => r.live !== r.pre).length, replayed = reach.filter(r => r.boot !== r.pre).length, multi = reach.filter(r => r.rec >= 2).length;
  console.log('    5L guard: chains that moved the live card ' + moved + ', boots that replayed a record ' + replayed + ', days booted with >=2 records ' + multi + ', hops not offered at replay (dropped) ' + (rows.length - reach.length));
  [name, resOff].forEach(l => l.slice(0, 3).forEach(r => console.log('      ' + tag(r) + '\n        live ' + r.slotLive.n + ' :: ' + r.slotLive.d.slice(0, 50) + '\n        boot ' + r.slotBoot.n + ' :: ' + r.slotBoot.d.slice(0, 50) + (r.mapBoot !== undefined ? '  (boot==MAP ' + (r.mapBoot === r.boot) + ')' : ''))));
  const cap = LIC5L ? LIC5L_MAX : 0;
  ok(R.R5L, SELF && mapLive && reach.length > 0 && moved > 0 && replayed > 0 && multi > 0 && name.length === 0 && det.length <= cap && resOff.length === 0,
    'name!=live ' + name.length + '/' + reach.length + ', detail!=live ' + det.length + '/' + reach.length + ' (licence ' + (LIC5L ? '<= ' + LIC5L_MAX + ' of ' + LIC5L_OF + ' at 222' : 'REFUSED above 222: 0') + '), residue rows unlike the MAP boot ' + resOff.length);
}
{
  const rows = U.filter(r => r.cls === 'collide2' || r.cls === 'exch3'), reach = rows.filter(r => !r.unreach);
  const seg = {}; reach.forEach(r => { const k = r.ck + '|' + r.cls; const o = seg[k] = seg[k] || { n:0, eq:0 }; o.n++; if(r.boot === r.live) o.eq++; });
  Object.keys(seg).sort().forEach(k => console.log('    5X ' + k.padEnd(15) + ' whole day == live ' + seg[k].eq + '/' + seg[k].n));
  const bad = reach.filter(r => r.boot !== r.live), moved = reach.filter(r => r.live !== r.pre).length;
  console.log('    5X guard: chains that moved the live card ' + moved + ', dropped (hop not offered) ' + (rows.length - reach.length));
  bad.slice(0, 3).forEach(r => { const A = r.live.split(/(?<=\}) /), Bs = r.boot.split(/(?<=\}) /); let i = 0; while(i < A.length && A[i] === Bs[i]) i++;
    console.log('      ' + tag(r) + ' rec=' + r.rec + '\n        live[' + i + '] ' + String(A[i]).slice(0, 220) + '\n        boot[' + i + '] ' + String(Bs[i]).slice(0, 220)); });
  const byCls = c => reach.filter(r => r.cls === c && r.boot === r.live).length + '/' + reach.filter(r => r.cls === c).length;
  ok(R.R5X, SELF && reach.length > 0 && moved > 0 && bad.length === 0 && reach.some(r => r.cls === 'collide2') && reach.some(r => r.cls === 'exch3'),
    'collide2 ' + byCls('collide2') + ', exch3 ' + byCls('exch3') + ' whole day == live');
}

// ── ROWS 8 / 8d / 9 (snapshot modes) ───────────────────────────────────────────────────────────────────────────────
const MODES = ['t1', 't2', 'up_st', 'up_bt', 'up_ts'];
const HROWS = [];
for(const m of MODES){ if(m.startsWith('up_') && !B) continue; for(const ck of Object.keys(CFGS)) HROWS.push(...run(ck, m, POP_H[ck])); }
console.log('  snapshot-mode rows ' + HROWS.length + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
{
  const line = []; let rw = 0, n = 0, noHist = 0, dup = 0, histDup = 0, carry = 0;
  for(const m of MODES){ const cells = [];
    for(const cls of H_CLS){ const rows = HROWS.filter(r => r.mode === m && r.cls === cls); if(!rows.length){ cells.push(cls + ' -'); continue; }
      const a = rows.filter(r => r.histJ && r.bootJ !== r.histJ).length, nh = rows.filter(r => !r.histJ).length, dd = rows.filter(r => r.histJ && r.dup).length;
      rw += a; n += rows.length; noHist += nh; dup += dd; histDup += rows.filter(r => r.histDup).length; carry += rows.filter(r => r.rec > 0).length;
      cells.push(cls + ' ' + a + '/' + rows.length + (nh ? ' nohist ' + nh : '') + (dd ? ' dup ' + dd : '')); }
    line.push('    8 ' + m.padEnd(6) + ' boot!=hist ' + cells.join('  ')); }
  line.forEach(l => console.log(l));
  HROWS.filter(r => r.histJ && r.bootJ !== r.histJ).slice(0, 2).forEach(r => console.log('      ' + r.mode + ' ' + tag(r) + ' duplicate=' + (r.dup || '-') + '\n        boot ' + r.boot.slice(0, 220)));
  console.log('    8 guard: rows ' + n + ', days carrying records into the boot ' + carry + ', snapshots that already carry a duplicate name ' + histDup);
  const setupOK = !!B && SELF && n > 0 && carry > 0 && MODES.every(m => HROWS.some(r => r.mode === m));
  ok(R.R8 + (B ? '' : ' (setup: no V221 tree: ' + baseWhy + ')'), setupOK && noHist === 0 && rw === 0, 'rewrites ' + rw + '/' + n + ', no snapshot ' + noHist);
  ok(R.R8d + (B ? '' : ' (setup: no V221 tree: ' + baseWhy + ')'), setupOK && noHist === 0 && dup === 0, 'booted hist-restored cards with a duplicate name ' + dup + '/' + n + ', snapshots carrying one ' + histDup);
}
{
  const rows = HROWS.filter(r => r.mode === 'up_ts');
  const eq = rows.filter(r => r.bootJ === r.v221J).length, lost = rows.filter(r => r.boot !== r.live).length, onHist = rows.filter(r => r.bootJ === r.histJ).length;
  const rt = rows.filter(r => !r.rtUnreach), hold = rt.filter(r => r.rtBootJ === r.rtLiveJ).length, moved = rt.filter(r => r.rtLiveJ !== r.bootJ).length;
  const segs = {}; rows.forEach(r => { const o = segs[r.cls] = segs[r.cls] || { n:0, eq:0, rt:0, hold:0 }; o.n++; if(r.bootJ === r.v221J) o.eq++; if(!r.rtUnreach){ o.rt++; if(r.rtBootJ === r.rtLiveJ) o.hold++; } });
  Object.keys(segs).forEach(k => console.log('    9 ' + k.padEnd(9) + ' boot==V221 boot ' + segs[k].eq + '/' + segs[k].n + '   re-tap holds ' + segs[k].hold + '/' + segs[k].rt));
  console.log('    9 info: up_ts boots on the snapshot ' + onHist + '/' + rows.length + ', boot != V221-era live card ' + lost + '/' + rows.length + ' (the accepted trade); re-taps that moved the card ' + moved + ', dropped (hop not offered) ' + (rows.length - rt.length));
  rt.filter(r => r.rtBootJ !== r.rtLiveJ).slice(0, 2).forEach(r => console.log('      ' + tag(r) + ' re-tap did not hold'));
  ok(R.R9a + (B ? '' : ' (setup: no V221 tree: ' + baseWhy + ')'), !!B && SELF && rows.length > 0 && eq === rows.length, eq + '/' + rows.length + ' byte-equal');
  ok(R.R9b + (B ? '' : ' (setup: no V221 tree: ' + baseWhy + ')'), !!B && SELF && rt.length > 0 && moved > 0 && hold === rt.length, hold + '/' + rt.length + ' hold, re-taps that moved the card ' + moved + ' (0 is an empty re-tap and proves nothing)');
}
done();
