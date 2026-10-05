// g231_d198_hepdraw.js — GATE for D198 P-HEPDRAW (V231): the full-lower day's hip-extension pick never repeats the
// day's hinge pick (`Hip extension + push` never re-draws the name `Lower strength` already holds in its hinge slot).
//
//   node tests/gates/g231_d198_hepdraw.js <candidate.html> [baseline_V230.html]
//
// THE RULING THIS DEFENDS (standing ruling 4)
//   tests/measure/v231_rulings/v231_reruling2_d196a2_d198.md, D198, "Gate rows for D198 (keyed VER ≥ 231, ruling D198;
//   each fails on V230 by its conjunct)":
//   D198-a  "on the g199 lattice's `sun` cells (or the 37-program shard above): days where `Lower strength` and `Hip
//           extension + push` share a name = 0 (V230 and candidate 70); `Hip extension + push` sections of one item whose
//           day's `Lower strength` hinge is a `hipExtBW` name and whose V230 twin had two items = 0 (candidate 21)."
//   D198-b  "typed cards: the three cells quoted above read the after-cards at 231 (bridge + pushups W3/W4 sat; single-leg
//           hip thrust + diamond pushups W9 sat; Nordic + pike pushups W1 sat) and the before-cards on V230 (and, for the
//           first, the one-item HEP on the candidate)."
//   D198-c  (main session's brief, 2026-10-04; the ruling's own D198-c is gatekeeper's differential, not a gate) the
//           counterfactual: the pre-D198 tree (the candidate with the D198 line reverted in-gate, presence-checked) reads 70
//           shared-name days and 21 one-item HEP on the same cells; this proves the instrument discriminates.
//   Sabotage S-e: "revert the D198 line to the plain pick → D198-a (70 doubled, 21 one-item HEP) and D198-b."
//   D-code D198, ships on ia-version 231. Surgery: tests/edits/v231_s7_d198_hepdraw.py (one line, :9474).
//   "The candidate" in the ruling's figures is the pre-D198 tree (sha256 prefix 1249c248a6794d1c); "CF" is this build.
//
// D198 AMENDMENT 1 (RE-RULING 3, same file, "D198-a, restated for the gate builder") — the row as gated:
//   "on the g199 lattice's `sun` cells, shipped cards: (i) days where `Lower strength` has two items and its second item
//   names an item of `Hip extension + push` == 0 at VER >= 231 (V230 and candidate 70); (ii) one-item `Hip extension +
//   push` whose day's `Lower strength` hinge is a `hipExtBW` name and whose V230 twin had two items == 0 (candidate 21),
//   unchanged; (iii) CENSUS, no assertion: lead-slot shared days (first `Lower strength` item in HEP) printed, 80 expected,
//   P-HEPSINGLETON's denominator. The g199 stage instrument is not D198-a's census."
//   Coach's printed census (576 configs, 3,070 shipped days carrying both sections): hinge-slot V230 70 / candidate 70 /
//   CF 0; lead-slot 80 / 80 / 80; one-item HEP 557 / 578 / 497. "A conjunct over 'any shared name' reads 80 on CF and
//   cannot pass; it is never written as a pass." None is written here: (i) is the hinge slot only, (iii) prints and
//   asserts nothing. (ii)'s hinge is the second item of a two-item `Lower strength`; a lone item is taken as the hinge
//   (conservative, can only overcount) and the number of (ii) days resting on that fallback is printed (0 on every tree).
//
// STAGE (Amendment 1 (2)). D198-a counts SHIPPED cards only: the program `buildProgram` returns. The stage-only shared
//   names on bodyweight knee/protect s3039 Saturdays are LEAD-slot (the knee/protect lungePool of hip-extension names,
//   :8593) and ship byte-identical; they are P-HEPSINGLETON's, not D198's. The names as bodyweightSweep is entered are
//   printed as INFO only (hinge slot and lead slot, as the census defines them), read by a side-channel wrap of
//   bodyweightSweep on a separate VM (the wrap records names and mutates nothing; no conjunct reads it).
//
// VERSION PREDICATE (standing rulings 2 and 4). Every row RUNS on every tree; `VER >= 231` (VER = the candidate's
//   ia-version meta) is the first conjunct of every row. On V230 as candidate the expected failures are: D198-a version and
//   a-doubled (70); D198-b version, the three typed cards and b-pre (no D198 line to revert); D198-c version and c-surgery
//   (and every conjunct that needs the reverted tree).
//
// PRESENTATION. Lattice = g199's LAT copied verbatim (tests/gates/g199_deload_arbitration.js, E_* constants + eCfg +
//   key), filtered to the rest pattern `sun` (576 of 1,728 keys): the only cells that build a `Full Body — Lower` day
//   (the ruling: "every one a g199 `sun`-rest Saturday"). cfg.seed pinned by the lattice (1013 / 3039); clock pinned to
//   2026-08-24 12:00 in every VM (coach4's clock). One plain (unwrapped) VM per tree, reused across cells; the a-lens
//   conjunct proves a reused-VM build == a fresh-VM build (id/created stripped) on probe cells, on every tree; the
//   baseline is proven self-identical (two fresh VMs) before any twin is read from it.
//
// ORACLES. Nothing below asks the engine what the answer should be.
//   TYPED      the ruling's figures: hinge collisions V230 70 on 20 programs, pre-D198 70 on 20, 231 0; one-item HEP with
//              a hipExtBW hinge and a two-item V230 twin pre-D198 21 on 5 programs, 231 0; D198-1's landing
//              `Single-leg hip thrust` (70), D198-2's landing for the D196-made 21 `Single-leg glute bridge`; loaded tiers
//              commercial, crossfit, home_basic, home_full, minimal; weeks W9–W12.
//   HAND       `hipExtBW` copied from the source line (:8496 region; the ruling: "hipExtBW (content, order)" deliberately
//              does not change), both lens branches, keyed by tier; a-pool proves the candidate still carries that literal.
//   CARDS      the three D198-b cells, verbatim from coach's prints in coach4's card format (label, ` (SS n)` when the
//              section is a superset, ` :: `, `name detail` joined by ` | `): cell 1 from the ruling's grid (population
//              (iii), V230 / cand / after) and tests/measure/v231_coach4_d198.prep.out.txt :153–155; cells 2 and 3 from
//              tests/measure/v231_coach4_d198.sweep.out.txt :318–324 and :336–341 (ABx = V230's card on these cells;
//              PREf = the after-card). Each verified by builder against one build of the candidate, the pre-D198 tree and
//              V230 on 2026-10-04 before typing.
//   COUNTERFACTUAL  pre-D198 = the CANDIDATE text with the D198 line (typed below, the ruling's replacement text) put back
//              to the ruling's anchor. The D198 line must occur exactly once in the candidate (presence check; on a tree
//              that lacks it the conjunct FAILS by name), and the reverted text must carry the anchor one more time than
//              the candidate and the D198 line zero times.
//
// ROWS
//   D198-a  a-ver, a-doubled, a-collapse, a-pool, a-cover, a-lens, a-inst.
//   D198-b  b-ver, b-c1 (W3 + W4 sat), b-c2 (W9 sat), b-c3 (W1 sat), b-pre (pre-D198 cell 1 one-item HEP), b-inst (V230
//           reads the before-cards on all three).
//   D198-c  c-ver, c-surgery, c-doubled (70 on 20, loaded lowback/protect, W9–W12), c-collapse (21 on 5, bodyweight
//           lowback/protect), c-after (on the candidate every one of the 91 counterfactual days carries a two-item `Hip
//           extension + push` superset without the hinge name, landing `Single-leg hip thrust` 70 / `Single-leg glute
//           bridge` 21).
//   SABOTAGE S-e (tests/sabotage/v231_d198.json): the D198 line reverted to the plain pick → D198-a (70 doubled, 21
//           one-item HEP), D198-b (cards) and D198-c (c-surgery: the candidate no longer carries the line).
//
// Temp files: the pre-D198 tree and (if needed) the git copy of V230 go under os.tmpdir() (run with TMPDIR set to the
//   scratch path) and are removed on exit.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const H = require(path.join(ROOT, 'tests', 'harness.js'));
const { load } = H;

const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEFILE = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ERA = 231, BASE_ERA = 230, V230_COMMIT = '71c76d8';
const CLOCK = '2026-08-24';

// ── LITERALS FROM THE RULING ──────────────────────────────────────────────────────────────────────────────────────
const ANCH = "const lowerHipExt=pick(hipExtBW,1,blockSeed(w)+20)[0];";
const D198_LINE = "const _lhe0=pick(hipExtBW,1,blockSeed(w)+20)[0];const lowerHipExt=(_lhe0===lowerHinge)?(pick(hipExtBW.filter(x=>x!==lowerHinge),1,blockSeed(w)+20)[0]||_lhe0):_lhe0;";
const PRE_SHA = '1249c248a6794d1c';     // the ruling's "candidate" (pre-D198), INFO only
const FIG = { doubled:70, doubledProgs:20, collapse:21, collapseProgs:5 };   // pre-D198 (and V230 for doubled)
// Amendment 1, coach's printed census (576 configs): shipped days carrying both sections; lead slot (all three trees);
// one-item HEP V230 / pre-D198 / D198. hepDays is asserted on V230 only (a-inst); the rest prints, never asserted.
const CENSUS = { hepDays:3070, lead:80, hep1:[557, 578, 497] };
const LOADED = ['commercial', 'crossfit', 'home_basic', 'home_full', 'minimal'];
const WEEKS_D1 = ['9', '10', '11', '12'];
const LS = 'Lower strength', HEP = 'Hip extension + push';
const BED = 'Single-leg hip thrust (shoulders on bed)', BRIDGE = 'Single-leg glute bridge', SLHT = 'Single-leg hip thrust';
const LAND = { loaded:SLHT, bodyweight:BRIDGE };   // D198-1 landing / D198-2's landing on the D196-made 21

// ── HAND: hipExtBW, both lens branches (source :8496 region; "hipExtBW (content, order)" does not change) ─────────────
const HIPEXT_LIT = "const hipExtBW=_bw(['Single-leg hip thrust (shoulders on bed)','Single-leg glute bridge','Nordic hamstring curl (anchored)','Bodyweight back extension'],['Single-leg hip thrust','Single-leg glute bridge (weighted)','Nordic hamstring curl (anchored)','Bodyweight back extension','Banded hip thrust']);";
const HIPEXT_BW = [BED, BRIDGE, 'Nordic hamstring curl (anchored)', 'Bodyweight back extension'];
const HIPEXT_LD = [SLHT, 'Single-leg glute bridge (weighted)', 'Nordic hamstring curl (anchored)', 'Bodyweight back extension', 'Banded hip thrust'];
const hipExtFor = eq => eq === 'bodyweight' ? HIPEXT_BW : HIPEXT_LD;

// ── TYPED D198-b CARDS (coach's prints, coach4 card format) ─────────────────────────────────────────────────────────
const R7_2 = '2 sets — RPE 7 (leave 3 or more in reserve)';
const R7_4 = '4 sets — RPE 7 (leave 3 or more in reserve)', R8_4 = '4 sets — RPE 8 (stop 2 reps short of failure)';
const C1_LS231 = 'Lower strength (SS 2) :: Reverse lunge ' + R7_2 + ' | ' + BED + ' ' + R7_2;
const C1_HEP231 = 'Hip extension + push (SS 2) :: ' + BRIDGE + ' ' + R7_2 + ' | Pushups (slow 3s eccentric) ' + R7_2;
const C1_HEPPRE = 'Hip extension + push :: Pushups (slow 3s eccentric) ' + R7_2;
const C1_LS230 = 'Lower strength (SS 2) :: Reverse lunge ' + R7_2 + ' | Burpees 2×10 — hold RPE 7, three in the tank';
const C1_HEP230 = 'Hip extension + push (SS 2) :: ' + BED + ' ' + R7_2 + ' | Pushups (slow 3s eccentric) ' + R7_2;
const C2_LS = 'Lower strength (SS 2) :: Reverse lunge (KB) 2×8–12 each @ RPE 8 | Banded hip thrust ' + R7_2;
const C2_HEP231 = 'Hip extension + push (SS 2) :: ' + SLHT + ' 2×10 — hold RPE 7, three in the tank | Diamond pushups ' + R7_2;
const C2_HEP230 = 'Hip extension + push (SS 2) :: Banded hip thrust ' + R7_2 + ' | Diamond pushups ' + R7_2;
const C3_LS = 'Lower strength (SS 4) :: Bulgarian split squat (foot on chair) ' + R8_4 + ' | ' + BRIDGE + ' ' + R7_4;
const C3_HEP231 = 'Hip extension + push (SS 4) :: Nordic hamstring curl (anchored) ' + R7_4 + ' | Pike pushups ' + R7_4;
const C3_HEP230 = 'Hip extension + push :: Pike pushups ' + R7_4;
// g199 keys (t|f|x|g.k|i.k|r.k|seed); the ruling's names in coach4's key form are in the comment
const CELLS_B = [
  { tag:'b-c1', k:'bodyweight|balanced|beginner|liftonly|lowback/protect|sun|1013', ruling:'bodyweight|balanced|none|lowback/protect|beginner|s1013|sun',
    at:[['3', 'sat'], ['4', 'sat']], c231:[C1_LS231, C1_HEP231], c230:[C1_LS230, C1_HEP230], cpre:[C1_LS231, C1_HEPPRE] },
  { tag:'b-c2', k:'commercial|balanced|beginner|pace|lowback/protect|sun|1013', ruling:'commercial|balanced|run_pace_goal|lowback/protect|beginner|s1013|sun',
    at:[['9', 'sat']], c231:[C2_LS, C2_HEP231], c230:[C2_LS, C2_HEP230] },
  { tag:'b-c3', k:'bodyweight|hypertrophy|advanced|liftonly|lowback/protect|sun|1013', ruling:'bodyweight|hypertrophy|none|lowback/protect|advanced|s1013|sun',
    at:[['1', 'sat']], c231:[C3_LS, C3_HEP231], c230:[C3_LS, C3_HEP230] },
];

// ── LATTICE: g199's LAT, verbatim (tests/gates/g199_deload_arbitration.js), filtered to rest `sun` ─────────────────────
const E_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS=['hypertrophy','balanced'], E_EXPS=['beginner','advanced'];
const E_GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const E_INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
  {k:'lowback/protect',v:{region:'lowback',tier:'protect'}},{k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const E_RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const E_SEEDS=[1013,3039];
function eCfg(tier,focus,exp,g,inj,rest,seed){
  const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,
    ageBracket:'18-35',equipment:tier,unit:'lbs',restDays:rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
}
const LAT=[];
for(const t of E_TIERS)for(const f of E_FOCUS)for(const x of E_EXPS)for(const g of E_GOALS)
  for(const i of E_INJ)for(const r of E_RESTS)for(const sd of E_SEEDS){
    const c=eCfg(t,f,x,g,i,r,sd); if(i.v) c.injury={region:i.v.region,tier:i.v.tier};
    LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,cfg:c});
  }
const SUN = LAT.filter(x => x.key.split('|')[5] === 'sun');
const PROBES = [0, 97, 194, 291, 388, 485].filter(i => i < SUN.length);

// ── HELPERS ─────────────────────────────────────────────────────────────────────────────────────────────────────
const clone = x => JSON.parse(JSON.stringify(x));
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const J = p => JSON.stringify(p, (k, v) => (k === 'id' || k === 'created') ? undefined : v);
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const cnt = (t, s) => t.split(s).length - 1;
const progsOf = rows => new Set(rows.map(r => r.k)).size;
const TMPS = [];
process.on('exit', () => TMPS.forEach(f => { try { fs.unlinkSync(f); } catch(e){} }));
function tmpWrite(tag, text){ const f = path.join(os.tmpdir(), 'g231_d198_' + tag + '_' + process.pid + '.html'); fs.writeFileSync(f, text); TMPS.push(f); return f; }
function pinned(file){   // a fresh VM with the clock pinned to CLOCK 12:00 (new Date() and Date.now())
  const X = load(file); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  X.ctx.Date = FD; return X; }
const liveSec = (p, w, d, lab) => { const dy = p && p.weeks && p.weeks[w] && p.weeks[w][d];
  return ((dy && !dy.rest && dy.sections) || []).find(s => clean(s && s.label) === lab && (s.items || []).length) || null; };
const namesOf = s => s ? (s.items || []).map(i => clean(i && i.name)) : [];
// coach4's card format (tests/measure/v231_coach4_d198.js `card`), one section
const cardOf = s => s ? clean(s.label || s.coreHeader || '') + (s.superset ? ' (SS ' + (s.rounds || '') + ')' : '') + ' :: ' + (s.items || []).map(it => clean(it.name) + ' ' + clean(it.detail || '')).join(' | ') : '(absent)';
const hingeOf = ln => ln.length === 2 ? ln[1] : ln[ln.length - 1];   // (ii) only: template [lead, hinge]; a lone item counts as the hinge
const hingeSlot = (ln, hn) => ln.length === 2 && hn.includes(ln[1]);  // Amendment 1 (i): two items, the SECOND names a HEP item
const leadSlot = (ln, hn) => ln.length >= 1 && hn.includes(ln[0]);    // Amendment 1 (iii) census: the FIRST names a HEP item

// ── PLUMBING ────────────────────────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const R = {
  'D198-a': 'row D198-a (D198 + Am. 1, VER >= 231) g199 LAT `sun` cells (576), shipped cards: (i) 0 days where `Lower strength` has two items and its second names a `Hip extension + push` item (V230 and pre-D198 70); (ii) 0 one-item `Hip extension + push` whose day\'s hinge is a hipExtBW name and whose V230 twin had two items (pre-D198 21); (iii) lead-slot census printed, not asserted',
  'D198-b': 'row D198-b (D198, VER >= 231) typed cards: lowback/protect bodyweight balanced beginner s1013 W3/W4 sat, commercial balanced run_pace_goal beginner s1013 W9 sat, bodyweight hypertrophy advanced s1013 W1 sat read the after-cards; V230 reads the before-cards; the pre-D198 tree reads the one-item HEP on the first',
  'D198-c': 'row D198-c (D198 counterfactual, VER >= 231) the candidate with the D198 line reverted in-gate (presence-checked) reads 70 hinge-shared days on 20 programs and 21 one-item HEP on 5 programs on the same cells; the candidate carries the ruled after-state on all 91',
};
const ROW_ORDER = ['D198-a', 'D198-b', 'D198-c'];
function row(key, cj){ cj.forEach(([n, c, d]) => P('    ' + key + ' ' + n + ' ' + (c ? 'ok' : 'FAIL') + ' :: ' + d));
  const bad = cj.filter(x => !x[1]).map(x => x[0]); ok(R[key], !bad.length, bad.length ? 'failing conjuncts: ' + bad.join(', ') : cj.length + '/' + cj.length + ' conjuncts'); }
const info = s => P('    INFO ' + s);

// ── LOAD + VERSION ──────────────────────────────────────────────────────────────────────────────────────────────
let VER = NaN, CAND_TEXT = '';
try { const IA = load(ART); VER = +IA.version; CAND_TEXT = fs.readFileSync(ART, 'utf8'); }
catch(e){ P('FAIL boot: ' + String(e && e.message || e).slice(0, 200)); fail++; ROW_ORDER.forEach(k => ok(R[k] + ' (candidate did not boot)', false)); done(); }
P('g231 D198 P-HEPDRAW | candidate ' + ART + ' ia-version ' + VER + (VER >= ERA ? '' : ' (below ' + ERA + ': every row runs and must FAIL by its own conjuncts)'));
let BF = null, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ BF = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!BF){
  try { const f = tmpWrite('v230', cp.execFileSync('git', ['-C', ROOT, 'show', V230_COMMIT + ':index.html'], { maxBuffer:1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ BF = f; baseWhy += 'git show ' + V230_COMMIT + ':index.html written to ' + f + ' (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
P('  V' + BASE_ERA + ' baseline: ' + (BF ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
P('  lattice: g199 LAT ' + LAT.length + ' keys, rest `sun` ' + SUN.length + ' (bodyweight ' + SUN.filter(x => x.cfg.equipment === 'bodyweight').length + ')');

// ── THE COUNTERFACTUAL TREE (pre-D198 = candidate with the D198 line reverted) ──────────────────────────────────────
const SURG = { file:null, ok:false, why:'' };
{ const nLine = cnt(CAND_TEXT, D198_LINE), nAnch = cnt(CAND_TEXT, ANCH);
  if(nLine !== 1) SURG.why = 'the D198 line occurs ' + nLine + ' times in the candidate (expected 1: presence check)';
  else { const t = CAND_TEXT.replace(D198_LINE, () => ANCH); const a2 = cnt(t, ANCH), l2 = cnt(t, D198_LINE);
    if(a2 !== nAnch + 1 || l2 !== 0) SURG.why = 'reverted text: anchor ' + a2 + ' (candidate ' + nAnch + '), D198 line ' + l2;
    else { try { SURG.file = tmpWrite('pre', t); SURG.sha = sha(t); SURG.ok = true; SURG.why = 'D198 line 1 -> 0, anchor ' + nAnch + ' -> ' + a2 + ', reverted sha256 prefix ' + SURG.sha; } catch(e){ SURG.why = 'write failed: ' + String(e && e.message || e).slice(0, 80); } } } }
P('  pre-D198 tree: ' + (SURG.ok ? 'BUILT (' + SURG.why + ')' : 'NOT BUILT (' + SURG.why + ')'));

// ── ONE PASS PER TREE (shipped cards) ───────────────────────────────────────────────────────────────────────────
// Returns the programs and every figure the rows read. Never asks the tree what the answer should be.
function survey(file){
  const S = { progs:{}, doubled:[], lead:[], hepDays:0, hep1:0, hep1All:0, reuse:0, reuseN:0, self:0, selfN:0, cards:{} };
  const X = pinned(file);
  SUN.forEach((cell, ci) => {
    const p = X.buildProgram(clone(cell.cfg)); S.progs[cell.key] = p;
    if(PROBES.includes(ci)){ S.reuseN++; const f1 = pinned(file).buildProgram(clone(cell.cfg)); if(J(p) === J(f1)) S.reuse++;
      S.selfN++; if(J(f1) === J(pinned(file).buildProgram(clone(cell.cfg)))) S.self++; }
    Object.keys(p.weeks || {}).forEach(w => ORDER.forEach(d => {
      const ls = liveSec(p, w, d, LS), he = liveSec(p, w, d, HEP); if(he && (he.items || []).length === 1) S.hep1All++;
      if(!ls || !he) return; S.hepDays++; if((he.items || []).length === 1) S.hep1++;
      const ln = namesOf(ls), hn = namesOf(he), id = { k:cell.key, eq:cell.cfg.equipment, inj:cell.key.split('|')[4], w, d };
      if(hingeSlot(ln, hn)) S.doubled.push(id);
      if(leadSlot(ln, hn)) S.lead.push(id);
    }));
  });
  for(const C of CELLS_B){ const p = S.progs[C.k]; S.cards[C.tag] = p ? C.at.map(([w, d]) => [cardOf(liveSec(p, w, d, LS)), cardOf(liveSec(p, w, d, HEP))]) : []; }
  return S; }
// one-item HEP whose day's hinge is a hipExtBW name and whose V230 twin had two items
function collapses(S, B){ const out = [];
  SUN.forEach(cell => { const p = S.progs[cell.key], q = B.progs[cell.key], L = hipExtFor(cell.cfg.equipment);
    Object.keys(p.weeks || {}).forEach(w => ORDER.forEach(d => {
      const ls = liveSec(p, w, d, LS), he = liveSec(p, w, d, HEP); if(!ls || !he || (he.items || []).length !== 1) return;
      const lnm = namesOf(ls), hinge = hingeOf(lnm); if(!L.includes(hinge)) return;
      const tw = liveSec(q, w, d, HEP); if(tw && (tw.items || []).length === 2) out.push({ k:cell.key, eq:cell.cfg.equipment, inj:cell.key.split('|')[4], w, d, hinge, lone:lnm.length !== 2 }); })); });
  return out; }
// INFO only: names of `Lower strength` / `Hip extension + push` as they stand when bodyweightSweep is entered
const SNAPWRAP = "var __SNAP=null;var __origBWS=bodyweightSweep; bodyweightSweep=function(weeks){ try{ if(__SNAP){ Object.keys(weeks||{}).forEach(function(w){ Object.keys(weeks[w]||{}).forEach(function(d){ var dy=weeks[w][d]; if(!dy||dy.rest) return; __SNAP[w+' '+d]=((dy.sections)||[]).map(function(s){ return [String(s&&s.label||''),((s&&s.items)||[]).map(function(i){ return String(i&&i.name||''); })]; }); }); }); } }catch(e){} return __origBWS.apply(this,arguments); };";
function preSweep(file, S){
  const X = pinned(file); X.eval(SNAPWRAP); const out = { doubled:[], cells:0, same:0 };
  SUN.filter(c => c.cfg.equipment === 'bodyweight').forEach(cell => { out.cells++;
    X.eval('__SNAP={}'); X.ctx.__C = clone(cell.cfg); const p = X.eval('buildProgram(__C)'); if(S && J(p) === J(S.progs[cell.key])) out.same++;
    const snap = JSON.parse(X.eval('JSON.stringify(__SNAP)'));
    Object.keys(snap).forEach(wd => { const secs = snap[wd]; const f = lab => (secs.find(s => clean(s[0]) === lab && s[1].length) || [null, null])[1];
      const ln = f(LS), hn = f(HEP); if(!ln || !hn) return; const L2 = ln.map(clean), H2 = hn.map(clean);
      const slot = hingeSlot(L2, H2) ? 'hinge' : leadSlot(L2, H2) ? 'lead' : null;
      if(slot){ const [w, d] = wd.split(' '); const sh = liveSec(p, w, d, HEP), sl = liveSec(p, w, d, LS);
        out.doubled.push({ slot, k:cell.key, w, d, pre:L2.join('/') + ' || ' + H2.join('/'), ship:namesOf(sl).join('/') + ' || ' + namesOf(sh).join('/') }); } }); });
  return out; }

let C = null, candErr = '';
try { C = survey(ART); } catch(e){ candErr = String(e && e.stack || e).slice(0, 300); P('    candidate survey CRASH ' + candErr); }
let B = null, baseErr = '';
if(BF){ try { B = survey(BF); } catch(e){ baseErr = String(e && e.stack || e).slice(0, 300); } } else baseErr = 'no V230 tree: ' + baseWhy;
let Q = null, preErr = '';
if(SURG.ok){ try { Q = survey(SURG.file); } catch(e){ preErr = String(e && e.stack || e).slice(0, 300); } } else preErr = 'pre-D198 tree not built: ' + SURG.why;
const CC = (C && B) ? collapses(C, B) : null, QC = (Q && B) ? collapses(Q, B) : null;

// ── ROW D198-a ──────────────────────────────────────────────────────────────────────────────────────────────────
function rowA(){
  const cj = [];
  cj.push(['a-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  cj.push(['a-doubled', C.doubled.length === 0, '(i) hinge slot: days where `Lower strength` has two items and its second names a `Hip extension + push` item: ' + C.doubled.length + ' on ' + progsOf(C.doubled) + ' programs' + (C.doubled.length ? ' | ' + fmt(tally(C.doubled, x => x.eq + ' ' + x.inj + ' W' + x.w)) : '') + ' over ' + SUN.length + ' builds, ' + C.hepDays + ' shipped days carrying both sections; ruled 0 (V230 and pre-D198 70)']);
  cj.push(['a-collapse', !!CC && CC.length === 0, CC ? '(ii) one-item `Hip extension + push` with a hipExtBW hinge and a two-item V230 twin: ' + CC.length + ' on ' + progsOf(CC) + ' programs' + (CC.length ? ' | ' + fmt(tally(CC, x => x.eq + ' ' + x.inj + ' ' + x.hinge)) : '') + ' (resting on the lone-item fallback ' + CC.filter(x => x.lone).length + '); ruled 0 (pre-D198 21)' : 'no V230 twins: ' + baseErr]);
  const nLit = cnt(CAND_TEXT, HIPEXT_LIT);
  cj.push(['a-pool', nLit === 1, 'the candidate carries the typed hipExtBW literal ' + nLit + ' time(s) (expected 1; the hand table is the pool the draw reads)']);
  cj.push(['a-cover', C.hepDays > 0, 'shipped days carrying both sections ' + C.hepDays + ' (> 0: not vacuous; coach\'s census ' + CENSUS.hepDays + ')']);
  const lensOK = [C, B, Q].every(S => !S || (S.reuseN > 0 && S.reuse === S.reuseN));
  cj.push(['a-lens', lensOK && !!B, 'reused-VM build == fresh-VM build (id/created stripped) on probe cells: candidate ' + C.reuse + '/' + C.reuseN + (B ? ', V230 ' + B.reuse + '/' + B.reuseN : ', V230 not surveyed') + (Q ? ', pre-D198 ' + Q.reuse + '/' + Q.reuseN : ', pre-D198 not surveyed')]);
  if(!B) cj.push(['a-inst', false, 'V230 not surveyed: ' + baseErr]);
  else { const iok = B.self === B.selfN && B.selfN > 0 && B.doubled.length === FIG.doubled && progsOf(B.doubled) === FIG.doubledProgs && B.hepDays === CENSUS.hepDays;
    cj.push(['a-inst', iok, 'V230 self-identical in two fresh VMs ' + B.self + '/' + B.selfN + '; V230 (i) hinge-slot days ' + B.doubled.length + ' on ' + progsOf(B.doubled) + ' programs, ruled ' + FIG.doubled + ' on ' + FIG.doubledProgs + '; V230 shipped days carrying both sections ' + B.hepDays + ', coach\'s census ' + CENSUS.hepDays + ' (the lattice is the ruled lattice)']); }
  // (iii) CENSUS, no assertion (Amendment 1): P-HEPSINGLETON's denominator, parked
  const tr = [['V230', B], ['pre-D198', Q], ['D198 tree', C]].filter(x => x[1]);
  info('CENSUS (iii), no assertion, P-HEPSINGLETON (parked): lead-slot shared days (first `Lower strength` item names a HEP item) ' + tr.map(([n, S]) => n + ' ' + S.lead.length).join(', ') + ' (coach: ' + CENSUS.lead + ' on all three) | candidate by tier ' + fmt(tally(C.lead, x => x.eq + ' ' + x.inj)) + ' | one-item HEP on days carrying both sections ' + tr.map(([n, S]) => n + ' ' + S.hep1).join(', ') + ', on all days carrying HEP ' + tr.map(([n, S]) => n + ' ' + S.hep1All).join(', ') + ' (coach: ' + CENSUS.hep1.join(' / ') + ')');
  try { const PS = preSweep(ART, C); const PQ = Q ? preSweep(SURG.file, Q) : null;
    const id = x => x.slot + ' ' + x.k + ' W' + x.w + ' ' + x.d, qk = new Set((PQ ? PQ.doubled : []).map(id)), isNew = x => !!PQ && !qk.has(id(x));
    const by = (o, s) => o.doubled.filter(x => x.slot === s).length;
    info('STAGE (not D198-a\'s census, Amendment 1 (2)): shared names as bodyweightSweep is entered, bodyweight `sun` cells (' + PS.cells + '; wrapped build == plain build on ' + PS.same + '/' + PS.cells + '): candidate hinge slot ' + by(PS, 'hinge') + ', lead slot ' + by(PS, 'lead') + (PQ ? ' | pre-D198 hinge slot ' + by(PQ, 'hinge') + ', lead slot ' + by(PQ, 'lead') + ' | on the candidate only (D198-created stage names): ' + PS.doubled.filter(isNew).length : '') + '; shipped hinge slot (counted above) candidate ' + C.doubled.filter(x => x.eq === 'bodyweight').length);
    PS.doubled.filter(isNew).forEach(x => info('  stage-only on the candidate [' + x.slot + ' slot] ' + x.k + ' W' + x.w + ' ' + x.d + ' :: ' + x.pre + '  ->  shipped ' + x.ship));
  } catch(e){ info('pre-sweep instrument CRASH (INFO only) ' + String(e && e.message || e).slice(0, 160)); }
  row('D198-a', cj);
}

// ── ROW D198-b ──────────────────────────────────────────────────────────────────────────────────────────────────
function rowB(){
  const cj = [];
  cj.push(['b-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  const eq = (got, want, n) => got.length === n && got.every(g => g[0] === want[0] && g[1] === want[1]);
  const show = (C0, got) => C0.at.map(([w, d], i) => 'W' + w + ' ' + d + ': ' + (got[i] ? got[i].join(' // ') : '(no program)')).join(' || ');
  for(const X of CELLS_B){ const got = C.cards[X.tag] || []; const okC = eq(got, X.c231, X.at.length);
    cj.push([X.tag, okC, X.ruling + ' ' + show(X, got) + (okC ? '' : ' | typed 231: ' + X.c231.join(' // '))]); }
  const X1 = CELLS_B[0];
  if(!Q) cj.push(['b-pre', false, 'pre-D198 tree not surveyed: ' + preErr]);
  else { const got = Q.cards[X1.tag] || []; const okP = eq(got, X1.cpre, X1.at.length);
    cj.push(['b-pre', okP, 'pre-D198 ' + X1.ruling + ' ' + show(X1, got) + (okP ? ' (the one-item HEP: the label with no hip extension)' : ' | typed pre-D198: ' + X1.cpre.join(' // '))]); }
  if(!B) cj.push(['b-inst', false, 'V230 not surveyed: ' + baseErr]);
  else { const bad = CELLS_B.filter(X => !eq(B.cards[X.tag] || [], X.c230, X.at.length));
    cj.push(['b-inst', !bad.length, bad.length ? bad.map(X => X.tag + ' V230 ' + show(X, B.cards[X.tag] || [])).join('; ') : 'V230 reads the typed before-cards on all three cells (both sections, every typed week)']); }
  row('D198-b', cj);
}

// ── ROW D198-c ──────────────────────────────────────────────────────────────────────────────────────────────────
function rowC(){
  const cj = [];
  cj.push(['c-ver', VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]);
  cj.push(['c-surgery', SURG.ok && !!Q, SURG.ok ? SURG.why + (Q ? '' : ' | survey failed: ' + preErr) : 'NOT BUILT: ' + SURG.why]);
  info('pre-D198 tree sha256 prefix ' + (SURG.sha || '-') + (SURG.sha ? (SURG.sha === PRE_SHA ? ' == ' : ' != ') + 'the ruling\'s candidate ' + PRE_SHA : '') + ' (INFO: equal only while the candidate is V231 as built)');
  if(!Q){ ['c-doubled', 'c-collapse', 'c-after'].forEach(n => cj.push([n, false, 'pre-D198 tree not surveyed: ' + preErr])); row('D198-c', cj); return; }
  const dq = Q.doubled, dShape = dq.every(x => LOADED.includes(x.eq) && x.inj === 'lowback/protect' && WEEKS_D1.includes(x.w) && x.d === 'sat');
  cj.push(['c-doubled', dq.length === FIG.doubled && progsOf(dq) === FIG.doubledProgs && dShape, 'pre-D198 (i) hinge-slot days ' + dq.length + ' on ' + progsOf(dq) + ' programs, ruled ' + FIG.doubled + ' on ' + FIG.doubledProgs + '; all loaded lowback/protect W9–W12 sat: ' + dShape + ' | ' + fmt(tally(dq, x => x.eq + ' W' + x.w))]);
  if(!QC){ cj.push(['c-collapse', false, 'no V230 twins: ' + baseErr]); cj.push(['c-after', false, 'no V230 twins: ' + baseErr]); row('D198-c', cj); return; }
  const cShape = QC.every(x => x.eq === 'bodyweight' && x.inj === 'lowback/protect' && x.d === 'sat');
  cj.push(['c-collapse', QC.length === FIG.collapse && progsOf(QC) === FIG.collapseProgs && cShape, 'pre-D198 one-item HEP with a hipExtBW hinge and a two-item V230 twin ' + QC.length + ' on ' + progsOf(QC) + ' programs, ruled ' + FIG.collapse + ' on ' + FIG.collapseProgs + '; all bodyweight lowback/protect sat: ' + cShape + ' | hinge ' + fmt(tally(QC, x => x.hinge))]);
  // the candidate's after-state on exactly those 91 days
  const flagged = dq.map(x => Object.assign({ cls:'loaded' }, x)).concat(QC.map(x => Object.assign({ cls:'bodyweight' }, x)));
  const bad = [], land = {};
  flagged.forEach(x => { const p = C.progs[x.k]; const ls = liveSec(p, x.w, x.d, LS), he = liveSec(p, x.w, x.d, HEP);
    const ln = namesOf(ls), hn = namesOf(he); const good = !!he && !!he.superset && hn.length === 2 && !hn.includes(hingeOf(ln)) && hn[0] === LAND[x.cls];
    land[x.cls + ' ' + (hn[0] || '-')] = (land[x.cls + ' ' + (hn[0] || '-')] || 0) + 1; if(!good && bad.length < 6) bad.push(x.k + ' W' + x.w + ' ' + x.d + ' ' + cardOf(he)); });
  const okA = flagged.length === FIG.doubled + FIG.collapse && !bad.length;
  cj.push(['c-after', okA, 'on the candidate, the ' + flagged.length + ' counterfactual days each carry a two-item `Hip extension + push` superset without the hinge name, landing `' + SLHT + '` on the loaded 70 and `' + BRIDGE + '` on the bodyweight 21: ' + fmt(land) + (bad.length ? ' | BAD ' + bad.join('; ') : '')]);
  // INFO: candidate vs pre-D198, whole-day differential on the sun cells (gatekeeper's blast radius; not a gate)
  let dd = 0; const dp = new Set(); SUN.forEach(cell => { const a = C.progs[cell.key], b = Q.progs[cell.key];
    Object.keys(b.weeks || {}).forEach(w => ORDER.forEach(d => { if(J(a.weeks[w] && a.weeks[w][d]) !== J(b.weeks[w] && b.weeks[w][d])){ dd++; dp.add(cell.key); } })); });
  info('candidate vs pre-D198 on the ' + SUN.length + ' `sun` cells: ' + dd + ' days differ on ' + dp.size + ' programs (the ruling: 151 days on 37 programs over 9,270 configs, every one a g199 `sun` Saturday)');
  row('D198-c', cj);
}

const ROWS = { 'D198-a':rowA, 'D198-b':rowB, 'D198-c':rowC };
for(const k of ROW_ORDER){ try { if(!C) throw new Error('candidate survey failed: ' + candErr); ROWS[k](); } catch(e){ P('    ' + k + ' CRASH ' + String(e && e.stack || e).slice(0, 400)); ok(R[k] + ' (crashed)', false); } }
done();
