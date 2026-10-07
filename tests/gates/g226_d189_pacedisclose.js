// g226_d189_pacedisclose.js — GATE for D189 (P-PACEDISCLOSE): a guessed pace says it is a guess, once at
// each place the athlete meets it: the wizard field (helper, D9, header, feasibility), the program card and
// clipboard (default sentence, run_base Run paces group), and the first paced W1 run card (the S1 note).
//
//   node tests/gates/g226_d189_pacedisclose.js <candidate.html> [baseline_V225.html]
//   IA_ASSUME_VERSION=226 node tests/gates/g226_d189_pacedisclose.js <tree stamped 225>   (discrimination run)
//
// THE RULING THIS DEFENDS: tests/measure/v226_rulings/d188_d189_ruling.md, D189 section, Copy section,
// Before/After block, Gate rows G6 to G10 (this file), accepted by Mario 2026-09-30. D-code D189.
//
// ORACLES (never the engine's own output as its own proof):
//   HAND TABLE    the default mile {beginner 690, intermediate 570, advanced 450} s, formatted m:ss by the
//                 hand formatter below (never _clkMS), with the article typed per level (an 11:30, a 9:30,
//                 a 7:30).
//   PACE CHART    the rows 5:00, 7:30, 9:00, 9:30, 10:30, 11:30, 12:00 typed from
//                 doctrine/nikerunclub5k.txt (mile, 5K, 10K, tempo, half, recovery columns).
//   COPY          every athlete-facing string typed from the ruling's Copy section and Before/After block.
//   S1 SITE       the target card is selected independently on the V225 artifact's own W1 grid (mon..sun,
//                 first run card with \d:\d\d/mi in detail and a subtype not matching
//                 RACE DAY|TIME TRIAL|^Benchmark Run), never read back from where the candidate put it.
//   BASELINE      the V225 artifact (default: git show of the V225 commit), built from the same pinned seed and clock
//                 as the candidate and proved self-equal before any diff. G6b's whole-program byte equality with it
//                 (the S1 note restored, asserted at 230 and below) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
//
// VERSION PREDICATE (standing rulings 2 and 4). D189 ships at 226.
//   226 and up    every row asserts the D189 truth.
//   231 and up    G6b SPLITS (tests/measure/v231_rulings/v231_absorb_ruling.md section 3; standing rulings 2 and 4):
//                 it keeps the S1 half (exactly one S1 note, on the V225 grid's first paced W1 run card, == the V225
//                 note + one space + S1) and adds "cells whose lifting days differ from V225 == 640" (D195-B's cost
//                 lens, class B-1, moved the lifting days of every cell: the ruling printed 640 cells, ops B-1 7,694,
//                 0 other; V230 reads 0). Its whole-program byte equality with V225 (asserted at 230 and below)
//                 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
//   225 and below every row asserts the V225 truth where one exists (0 S1 notes, the V209 card sentence,
//                 the "Optional. It sets your training paces." label, ...); a row with no V225 truth is counted
//                 in NA, never as a pass.
//   IA_ASSUME_VERSION=226 lifts a file stamped exactly 225 to 226 for a discrimination run (not a ship proof):
//   every row D189 changed must go red there, every row it left alone must stay green.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ARG_BASE = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ERA = 226, TAG = 'D189';
const V231_ERA = 231, V231_LIFT = 640;   // V231 absorb ruling section 3, G6b split: typed, the ruling's print (640/640 cells)
const V225_COMMIT = '35919943d766606dcbf5e09c98a08b5782dc2223';   // "V225: D186/D187 ..." (the V225 artifact, forever)

let pass = 0, fail = 0, na = 0;
const T0 = process.hrtime.bigint();
const J = v => JSON.stringify(v);
let ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const notApplicable = (l, why) => { na++; console.log('NA   ' + l + ' (' + why + ')'); };
let TMPD = null;
const done = () => {
  if(TMPD){ try { fs.rmSync(TMPD, { recursive: true, force: true }); } catch(e){} }
  console.log('  runtime ' + (Number(process.hrtime.bigint() - T0) / 1e9).toFixed(1) + ' s');
  console.log('NA ' + na); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0);
};

// ── the clock, pinned before any artifact boots (both artifacts see the same "now") ──
const RD = Date, NOW = new RD(2026, 8, 22, 21, 16, 0).getTime();
class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(NOW); } static now(){ return NOW; } }
globalThis.Date = FD;

let STAMP = NaN, IA = null;
try { IA = H.load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
} else if(process.env.IA_ASSUME_VERSION !== undefined){
  console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
const D189 = VER >= ERA;   // the one predicate every row is keyed on
if(!D189){ const ok0 = ok; ok = (l, c, g) => ok0(/\[V225 truth/.test(l) ? l : l + ' [V225 era]', c, g); }
console.log('g226 ' + TAG + ' pacedisclose | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '')
  + ' | era ' + (D189 ? 'D189 (>= 226)' : 'V225 truth (<= 225)'));

// ── hand oracles ──
const mss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');   // hand m:ss, never _clkMS
const HAND = { beginner: 690, intermediate: 570, advanced: 450 };
const ART_OF = { beginner: 'an', intermediate: 'a', advanced: 'a' };   // an 11:30, a 9:30, a 7:30
const MILE_OF = {};
for(const [e, s] of Object.entries(HAND)) MILE_OF[e] = mss(s);
const HAND_OK = MILE_OF.beginner === '11:30' && MILE_OF.intermediate === '9:30' && MILE_OF.advanced === '7:30';
// doctrine/nikerunclub5k.txt pace chart rows: mile -> 5K, 10K, tempo, half, recovery (per-mile paces)
const CHART = {
  '5:00':  { k5: '5:30',  k10: '5:45',  tempo: '6:05',  half: '6:00',  rec: '7:00'  },
  '7:30':  { k5: '8:05',  k10: '8:25',  tempo: '8:50',  half: '8:45',  rec: '9:55'  },
  '9:00':  { k5: '9:40',  k10: '10:00', tempo: '10:30', half: '10:40', rec: '11:35' },
  '9:30':  { k5: '10:15', k10: '10:35', tempo: '11:00', half: '11:05', rec: '12:10' },
  '10:30': { k5: '11:15', k10: '11:35', tempo: '12:00', half: '12:10', rec: '13:20' },
  '11:30': { k5: '12:15', k10: '12:35', tempo: '13:00', half: '13:15', rec: '14:05' },
  '12:00': { k5: '12:40', k10: '13:05', tempo: '13:35', half: '14:05', rec: '14:30' },
};
// The ruling's Copy section, typed.
const S1 = e => 'Paces here start from ' + ART_OF[e] + ' ' + MILE_OF[e] + ' mile, the ' + e + ' default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.';
const S1_STEM = 'Paces here start from ';
const TAIL_CHART = ' Every pace in this program comes from this row.';
const TAIL_PACE = ' Week 1 runs off this row. Every week after it moves toward your goal.';
const TAIL_BASE = ' Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.';
const CARD_DEF = (e, tail) => 'Anchored on ' + ART_OF[e] + ' ' + MILE_OF[e] + ' mile, the ' + e + ' default. No mile time was entered. Tap the pencil to enter one.' + tail;
const CARD_DEF_V225 = e => e === 'beginner'
  ? 'Anchored on an 11:30 mile, the beginner default. A mile time starts being used at intermediate.'
  : 'Anchored on ' + ART_OF[e] + ' ' + MILE_OF[e] + ' mile, estimated from experience; no mile time was entered.' + TAIL_CHART;
const HELP_REQ = 'Required. Your paces and your program length start from it.';
const HELP_OPT = {
  beginner:     'Optional. Leave it blank and your paces come from an 11:30 mile, the beginner default. Enter a mile only if you have timed one.',
  intermediate: 'Optional. Leave it blank and your paces come from a 9:30 mile, the intermediate default. Enter a mile only if you have timed one.',
  advanced:     'Optional. Leave it blank and your paces come from a 7:30 mile, the advanced default. Enter a mile only if you have timed one.',
};
const HELP_V225 = 'Optional. It sets your training paces.';
const D9_OVER = 'Over 25:00 reads as a walk, not a run. Check the entry.';
const D9_OVER_V225 = 'Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.';
const HDR_BLANK = 'Program length: your mile time sets it. Enter your current mile time and the length appears.';
const HDR_NUM = /^Program length: \d+ weeks?\. Set by your longest cardio goal and your experience\.$/;
const R3_MSG = 'Required. Enter your most recent timed mile.';
const FEAS_BEG = 'You have not entered a mile time. The beginner default is 11:30 per mile.';
const FEAS_BEG_V225 = 'Your paces start from the beginner default of 11:30 per mile.';
const FEAS_INT_V225 = 'You have not entered a mile time. The intermediate default is 9:30 per mile.';
const HM_CARD = 'Anchored on a 10:30 mile, the time you entered. Every pace in this program comes from this row.';
const COPY_RX = /\w\s?[-\u2013\u2014]\s?\w/;
const ASSERTED = [];   // every string G6 to G8 asserted, for G9
const seen = (where, s) => { if(typeof s === 'string' && s) ASSERTED.push([where, s]); };

const ROW = {
  G6a: 'G6a ' + TAG + ' hand oracle: 690/570/450 format by hand to 11:30/9:30/7:30; candidate (and at 226 the V225 baseline) builds are self-equal on a pinned seed',
  G6b: 'G6b ' + TAG + ' S1: every no-mile program (6 goals x 3 levels x 20 seeds x 2 rest, R3 cells excluded) carries exactly one S1 note, on the V225 grid\'s first paced W1 run card, appended to its V225 note; everything else equals V225',
  G6c: 'G6c ' + TAG + ' S1: every mile-entered program (8:00, 6 goals x 3 levels x 20 seeds x 2 rest) carries 0 S1 text anywhere',
  G6d: 'G6d ' + TAG + ' R3 cells: intermediate and advanced run_pace_goal with no mile are refused with R3\'s string (so excluded from G6b)',
  G7a: 'G7a ' + TAG + ' card: default sentence, 3 levels x {run_5k, run_half, run_base} + beginner run_pace_goal',
  G7b: 'G7b ' + TAG + ' clipboard: default Run anchor line, same 10 cells',
  G7c: 'G7c ' + TAG + ' run_base card: Run paces chips exactly [Mile, Recovery] with one pencil, 3 levels',
  G7d: 'G7d ' + TAG + ' HALF_MANNY card and clipboard read the entered form verbatim',
  G7e: 'G7e ' + TAG + ' seeded, clamped (slow, fast) and edited-from-a-time forms plus beginner entered and seeded: non-beginner forms unchanged, beginner entered and seeded forms read the athlete\'s mile (D188)',
  G7f: 'G7f ' + TAG + ' edited-from-default card names "the <level> default"',
  G8a: 'G8a ' + TAG + ' wizard helper under "Current mile time", 4 goals x 3 levels',
  G8b: 'G8b ' + TAG + ' D9 >25:00 string (validator and rendered #mileAdvisory)',
  G8c: 'G8c ' + TAG + ' intermediate/advanced run_pace_goal, no mile: #progLenLine header (template and repaint)',
  G8d: 'G8d ' + TAG + ' intermediate/advanced run_pace_goal, no mile: #paceFeasLine empty',
  G8e: 'G8e ' + TAG + ' intermediate/advanced run_pace_goal, 9:00 typed: "Your mile is 9:00." form and a numeric header',
  G8f: 'G8f ' + TAG + ' beginner run_pace_goal, no mile: the generic feasibility form',
  G9:  'G9 ' + TAG + ' copy: every string asserted in G6 to G8 has 0 mid-sentence dashes and 0 "Nike"',
  G10: 'G10 ' + TAG + ' HALF_MANNY: MANNY_DIGEST_BY_VERSION[ver] exists, is a 16 hex digest, and the build prints it',
};
const guard = (id, fn) => { try { fn(); } catch(e){ ok(ROW[id] + ' (CRASH)', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); } };

// ── lattice cfgs (the measure's shape: hybrid, undated, seeded) ──
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const MONSUN = ['mon','tue','wed','thu','fri','sat','sun'];
const GOALS = ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base', 'run_pace_goal'];
const EXPS = ['beginner', 'intermediate', 'advanced'];
const SEEDS = Array.from({ length: 20 }, (_, i) => 1000 + 37 * i);
const RESTS = [['sun','wed'], ['sat','sun']];
function goalObj(goal, mile, src){
  const g = { id: goal, label: goal, baselineDist: '', baseline: '' };
  if(goal === 'run_pace_goal') Object.assign(g, { targetDist: '1.5', paceUnit: 'mi', targetMins: '12', targetSecs: '0' });
  if(mile){ g.mileBestMins = String(Math.floor(mile / 60)); g.mileBestSecs = String(mile % 60); g.mileBestSrc = src || { kind: 'entered' }; }
  return g;
}
const cfgOf = (goal, exp, mile, seed, rest, src) => ({ name: 'M', primaryPath: 'hybrid', cardioTypes: ['run'], cardioGoals: { run: goalObj(goal, mile, src) },
  liftingFocus: 'balanced', experience: exp, ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(),
  eventTargeted: false, raceDate: '', seed });
const build = (A, cfg) => A.buildProgram(JSON.parse(JSON.stringify(cfg)));
const refused = (goal, exp) => goal === 'run_pace_goal' && exp !== 'beginner';
const countS1 = prog => JSON.stringify(prog).split(S1_STEM).length - 1;
// The independent S1 site: the V225 grid's first paced W1 run card, mon..sun.
function firstPaced(prog){
  const w1 = prog.weeks && (prog.weeks['1'] || prog.weeks[1]); if(!w1) return null;
  for(const d of MONSUN){ const day = w1[d]; if(!day || day.rest) continue;
    const cs = [].concat(day.cardio || []);
    for(let i = 0; i < cs.length; i++){ const c = cs[i]; if(!c || c.type !== 'run') continue;
      if(/RACE DAY|TIME TRIAL|^Benchmark Run/i.test(c.subtype || '')) continue;
      if(!/\d:\d\d\/mi/.test(c.detail || '')) continue;
      return { d, i, arr: Array.isArray(day.cardio), c }; } }
  return null;
}
const cardAt = (prog, s) => { const day = prog.weeks['1'] || prog.weeks[1]; const x = day[s.d].cardio; return s.arr ? x[s.i] : x; };

// ── the V225 artifact (needed only on the D189 arm) ──
let BASE = null, baseWhy = '';
if(D189){
  try {
    let f = ARG_BASE;
    if(f && fs.existsSync(f) && /<meta name="ia-version" content="225"/.test(fs.readFileSync(f, 'utf8'))){ /* use it */ }
    else {
      if(f) baseWhy = 'argv baseline ' + f + ' is not stamped 225; ';
      TMPD = fs.mkdtempSync(path.join(os.tmpdir(), 'g226d189-')); f = path.join(TMPD, 'v225.html');
      fs.writeFileSync(f, cp.execFileSync('git', ['show', V225_COMMIT + ':index.html'], { cwd: ROOT, maxBuffer: 1 << 27, stdio: ['ignore', 'pipe', 'ignore'] }));
    }
    BASE = H.load(f);
    if(+BASE.version !== 225){ baseWhy += 'baseline stamped ' + BASE.version + ', not 225'; BASE = null; }
    else console.log('  baseline V225: ' + f);
  } catch(e){ baseWhy += 'baseline unavailable: ' + String(e.message).slice(0, 120); BASE = null; }
}

// ── G6 ──
guard('G6a', () => {
  const c0 = cfgOf('run_5k', 'intermediate', 0, SEEDS[0], RESTS[0]);
  const bad = [];
  if(!HAND_OK) bad.push('hand table formats to ' + J(MILE_OF));
  const a1 = H.progDigest(build(IA, c0)), a2 = H.progDigest(build(IA, c0));
  if(a1 !== a2) bad.push('candidate not self-equal ' + a1 + ' != ' + a2);
  if(D189){
    if(!BASE) bad.push('no V225 baseline (' + baseWhy + ')');
    else { const b1 = H.progDigest(build(BASE, c0)), b2 = H.progDigest(build(BASE, c0)); if(b1 !== b2) bad.push('baseline not self-equal ' + b1 + ' != ' + b2); }
  }
  ok(ROW.G6a, bad.length === 0, bad.join('; ') || 'hand ' + J(MILE_OF) + ', self-equal' + (D189 ? ' on both artifacts' : ''));
});
guard('G6b', () => {
  let cells = 0, good = 0; const why = {}, ex = [];
  // V231 (absorb ruling section 3, G6b SPLIT): a lifting day is a day's `sections`; a cell's lifting days differ from V225
  // when any week/day's sections JSON differs. Counted on every D189 tree, asserted at 231 and up.
  const V231 = VER >= V231_ERA; let lcells = 0, lmoved = 0, ldays = 0, outEq = 0;
  const liftDays = (a, b) => { let n = 0; const wa = a.weeks || {}, wb = b.weeks || {};
    new Set(Object.keys(wa).concat(Object.keys(wb))).forEach(w => { const da = wa[w] || {}, db = wb[w] || {};
      new Set(Object.keys(da).concat(Object.keys(db))).forEach(d => { const sa = da[d] && da[d].sections, sb = db[d] && db[d].sections;
        if(JSON.stringify(sa === undefined ? null : sa) !== JSON.stringify(sb === undefined ? null : sb)) n++; }); }); return n; };
  const noLift = p => { const c = JSON.parse(JSON.stringify(p)); Object.keys(c.weeks || {}).forEach(w => Object.keys(c.weeks[w] || {}).forEach(d => { const dy = c.weeks[w][d]; if(dy && typeof dy === 'object') delete dy.sections; })); return c; };
  const miss = (k, tag) => { why[k] = (why[k] || 0) + 1; if(ex.length < 4) ex.push(k + ' @ ' + tag); };
  for(const goal of GOALS) for(const exp of EXPS){ if(refused(goal, exp)) continue;
    for(const seed of SEEDS) for(const rest of RESTS){
      cells++; const tag = goal + '|' + exp + '|' + seed + '|' + rest.join('/');
      const cfg = cfgOf(goal, exp, 0, seed, rest), pc = build(IA, cfg);
      if(!D189){ const n = countS1(pc); if(n === 0) good++; else miss('V225 truth: S1 text present (' + n + ')', tag); continue; }
      if(!BASE){ miss('no baseline', tag); continue; }
      const pb = build(BASE, cfg), site = firstPaced(pb);
      lcells++; { const ld = liftDays(pc, pb); if(ld){ lmoved++; ldays += ld; } }
      if(!site){ miss('V225 grid has no paced W1 run card', tag); continue; }
      const nS1 = countS1(pc); if(nS1 !== 1){ miss('S1 count ' + nS1, tag); continue; }
      const baseNote = site.c.note;
      const cc = (pc.weeks['1'] && pc.weeks['1'][site.d]) ? cardAt(pc, site) : null;
      if(!cc){ miss('site card missing on candidate', tag); continue; }
      const note = String(cc.note || ''), want = (baseNote ? baseNote + ' ' : '') + S1(exp);
      if(!note.endsWith(S1(exp))){ miss('S1 not on the V225 site (W1 ' + site.d + ') or wrong text', tag); continue; }
      if(!note.startsWith(baseNote || '')){ miss('V225 note not a prefix', tag); continue; }
      if(note !== want){ miss('note != V225 note + one space + S1', tag); continue; }
      const restored = JSON.parse(JSON.stringify(pc)), rc = cardAt(restored, site);
      if(baseNote === undefined) delete rc.note; else rc.note = baseNote;
      if(V231){ if(H.progDigest(noLift(restored)) === H.progDigest(noLift(pb))) outEq++; }
      // the whole-program byte equality with V225 (the else of V231; V231 absorb ruling section 3) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
      seen('G6 S1 ' + exp, note.slice(note.length - S1(exp).length));
      good++;
    } }
  const expectCells = 640;
  if(D189 && BASE) console.log('    G6b lifting days vs V225 (every week and day, its sections): cells differing ' + lmoved + ' of ' + lcells + ', days differing ' + ldays + (V231 ? ' | INFO, not asserted: cells equal to V225 outside the lifting sections with the S1 note restored ' + outEq + ' of ' + good : ''));
  if(V231) ok(ROW.G6b + ' [V231 split: the S1 half kept, the whole-program byte equality dropped; cells whose lifting days differ from V225 == ' + V231_LIFT + ', B-1]',
    cells === expectCells && good === cells && lcells === expectCells && lmoved === V231_LIFT,
    good + '/' + cells + ' cells (ruled 640), lifting days differ on ' + lmoved + '/' + lcells + ' cells (ruled ' + V231_LIFT + ')' + (Object.keys(why).length ? ' misses ' + J(why) + ' e.g. ' + ex.join(' ; ') : ''));
  else ok(ROW.G6b + ' [whole-program byte equality retired Post-V233]', cells === expectCells && good === cells, good + '/' + cells + ' cells (ruled 640)' + (Object.keys(why).length ? ' misses ' + J(why) + ' e.g. ' + ex.join(' ; ') : ''));
});
guard('G6c', () => {
  let cells = 0, good = 0; const ex = [];
  for(const goal of GOALS) for(const exp of EXPS) for(const seed of SEEDS) for(const rest of RESTS){
    cells++; const n = countS1(build(IA, cfgOf(goal, exp, 480, seed, rest)));
    if(n === 0) good++; else if(ex.length < 4) ex.push(goal + '|' + exp + '|' + seed + '|' + rest.join('/') + ' S1 x' + n);
  }
  ok(ROW.G6c, cells === 720 && good === cells, good + '/' + cells + ' cells (ruled 720)' + (ex.length ? ' e.g. ' + ex.join(' ; ') : ''));
});
guard('G6d', () => {
  const st = IA.eval('_mileEntryState'); const got = [];
  for(const exp of ['intermediate', 'advanced']){ const r = st(goalObj('run_pace_goal', 0), exp); got.push(exp + ' ' + J(r)); seen('G6d R3 ' + exp, r && r.msg);
    if(!(r && r.ok === false && r.blank === true && r.msg === R3_MSG)){ ok(ROW.G6d, false, got.join('; ')); return; } }
  ok(ROW.G6d, true, got.join('; '));
});

// ── G7: card (progDetailHTML) and clipboard (progSelLines), the production renderers ──
const strip = h => String(h || '').replace(/<[^>]+>/g, '');
function card(cfg){
  const html = String(IA.eval('progDetailHTML')({ id: 'g226', name: 'M', cfg: JSON.parse(JSON.stringify(cfg)) }));
  const grp = /<div class="det-label"[^>]*>Run paces([\s\S]*?)<div class="det-src">([\s\S]*?)<\/div><\/div>/.exec(html);
  const chips = grp ? (grp[1].match(/<div class="lc-k">([^<]*)<\/div>/g) || []).map(s => s.replace(/<[^>]+>/g, '')) : null;
  const pencils = grp ? (grp[0].match(/aria-label="Change mile time"/g) || []).length : 0;
  const lines = IA.eval('progSelLines')({ id: 'g226', name: 'M', cfg: JSON.parse(JSON.stringify(cfg)) }).filter(l => /^Run anchor:/.test(l));
  return { sentence: grp ? strip(grp[2]) : null, chips, pencils, clip: lines.length === 1 ? lines[0] : (lines.length ? 'MANY ' + lines.length : null) };
}
const clipOf = (m, prov, keys, scope) => 'Run anchor: ' + m + ' mile (' + prov + ') \u2192 ' + keys.map(([k, v]) => k + ' ' + v).join(' / ') + (scope || '');
const chartKeys = (m, race) => { const r = CHART[m]; return [['5k', r.k5], ['10k', r.k10], ['tempo', r.tempo]].concat(race ? [['half', r.half]] : []).concat([['recovery', r.rec]]); };
const G7_CELLS = [];
for(const exp of EXPS) for(const goal of ['run_5k', 'run_half', 'run_base']) G7_CELLS.push([goal, exp]);
G7_CELLS.push(['run_pace_goal', 'beginner']);
function want7(goal, exp, era226){
  const m = MILE_OF[exp];
  const keys = goal === 'run_base' ? [['recovery', CHART[m].rec]] : goal === 'run_pace_goal' ? [['mile', m]].concat(chartKeys(m, false)) : chartKeys(m, goal === 'run_half');
  if(era226){
    const tail = goal === 'run_pace_goal' ? TAIL_PACE : goal === 'run_base' ? TAIL_BASE : TAIL_CHART;
    return { sentence: CARD_DEF(exp, tail), clip: clipOf(m, exp + ' default, no mile time entered', keys, goal === 'run_pace_goal' ? ' | ' + TAIL_PACE.trim() : '') };
  }
  if(goal === 'run_base') return { sentence: null, clip: null };   // V225: run_base has no Run paces block and no anchor line
  return { sentence: CARD_DEF_V225(exp), clip: clipOf(m, exp === 'beginner' ? 'beginner default' : 'est. from experience', keys, '') };
}
for(const [id, field] of [['G7a', 'sentence'], ['G7b', 'clip']]) guard(id, () => {
  const bad = [];
  for(const [goal, exp] of G7_CELLS){ const got = card(cfgOf(goal, exp, 0, SEEDS[0], RESTS[0]))[field], w = want7(goal, exp, D189)[field];
    seen(id + ' ' + goal + '|' + exp, got);
    if(got !== w) bad.push(goal + '|' + exp + ' ' + J(got) + ' want ' + J(w)); }
  ok(ROW[id], bad.length === 0, bad.length ? bad.length + '/' + G7_CELLS.length + ' cells: ' + bad.slice(0, 2).join(' ; ') : G7_CELLS.length + '/' + G7_CELLS.length + ' cells');
});
guard('G7c', () => {
  const bad = [];
  for(const exp of EXPS){ const c = card(cfgOf('run_base', exp, 0, SEEDS[0], RESTS[0]));
    const good = D189 ? (J(c.chips) === J(['Mile', 'Recovery']) && c.pencils === 1) : (c.chips === null && c.sentence === null);
    if(!good) bad.push(exp + ' chips ' + J(c.chips) + ' pencils ' + c.pencils); }
  ok(ROW.G7c + (D189 ? '' : ' [V225 truth: no Run paces group on run_base]'), bad.length === 0, bad.join(' ; ') || '3/3 levels');
});
guard('G7d', () => {
  const c = card(H.fixtures.HALF_MANNY), wc = clipOf('10:30', 'entered', chartKeys('10:30', true), '');
  seen('G7d card', c.sentence); seen('G7d clip', c.clip);
  ok(ROW.G7d, c.sentence === HM_CARD && c.clip === wc, J(c.sentence) + ' | ' + J(c.clip));
});
guard('G7e', () => {
  const F = [
    ['seeded 9:00', 'intermediate', 540, { kind: 'seeded', prog: 'PRIOR', n: 6 },
      'Anchored on a 9:00 mile, worked back from 6 recovery runs you logged in PRIOR.' + TAIL_CHART, clipOf('9:00', 'seeded from PRIOR, 6 logged recovery runs', chartKeys('9:00'))],
    ['clamped slow 13:00', 'intermediate', 780, { kind: 'entered' },
      'Anchored on a 12:00 mile, the 13:00 you entered is slower than the chart goes, so its slowest row is used.' + TAIL_CHART, clipOf('12:00', "entry 13:00 clamped to the chart's slowest row", chartKeys('12:00'))],
    ['clamped fast 4:30', 'advanced', 270, { kind: 'entered' },
      'Anchored on a 5:00 mile, the 4:30 you entered is faster than the chart goes, so its fastest row is used.' + TAIL_CHART, clipOf('5:00', "entry 4:30 clamped to the chart's fastest row", chartKeys('5:00'))],
    ['edited from 9:30', 'intermediate', 540, { kind: 'edited', wk: 3, from: { kind: 'entered', mins: '9', secs: '30' } },
      'Anchored on a 9:00 mile, the time you entered in week 3. Before that it was 9:30.' + TAIL_CHART, clipOf('9:00', 'edited in week 3', chartKeys('9:00'))],
    // amendment (d): a beginner with a mile reads the entered and seeded forms at 226; V225 printed the beginner default over any mile.
    ['entered 9:00 beginner', 'beginner', 540, { kind: 'entered' },
      D189 ? 'Anchored on a 9:00 mile, the time you entered.' + TAIL_CHART : CARD_DEF_V225('beginner'),
      D189 ? clipOf('9:00', 'entered', chartKeys('9:00')) : clipOf('11:30', 'beginner default', chartKeys('11:30'))],
    ['seeded 9:00 beginner', 'beginner', 540, { kind: 'seeded', prog: 'PRIOR', n: 6 },
      D189 ? 'Anchored on a 9:00 mile, worked back from 6 recovery runs you logged in PRIOR.' + TAIL_CHART : CARD_DEF_V225('beginner'),
      D189 ? clipOf('9:00', 'seeded from PRIOR, 6 logged recovery runs', chartKeys('9:00')) : clipOf('11:30', 'beginner default', chartKeys('11:30'))],
  ];
  const bad = [];
  for(const [lbl, exp, mile, src, ws, wc] of F){ const c = card(cfgOf('run_5k', exp, mile, SEEDS[0], RESTS[0], src));
    seen('G7e ' + lbl, c.sentence); seen('G7e ' + lbl + ' clip', c.clip);
    if(c.sentence !== ws) bad.push(lbl + ' card ' + J(c.sentence)); if(c.clip !== wc) bad.push(lbl + ' clip ' + J(c.clip)); }
  ok(ROW.G7e, bad.length === 0, bad.join(' ; ') || F.length + ' forms x card and clipboard');
});
guard('G7f', () => {
  const bad = [];
  for(const exp of ['intermediate', 'advanced']){
    const c = card(cfgOf('run_5k', exp, 540, SEEDS[0], RESTS[0], { kind: 'edited', wk: 3, from: { kind: 'default' } }));
    const w = 'Anchored on a 9:00 mile, the time you entered in week 3. Before that it was ' + (D189 ? 'the ' + exp + ' default' : 'estimated from experience') + '.' + TAIL_CHART;
    seen('G7f ' + exp, c.sentence); if(c.sentence !== w) bad.push(exp + ' ' + J(c.sentence) + ' want ' + J(w)); }
  ok(ROW.G7f + (D189 ? '' : ' [V225 truth: "estimated from experience"]'), bad.length === 0, bad.join(' ; ') || '2/2 levels');
});

// ── G8: the wizard cardio_goal step, rendered by the production renderer in its own VM ──
let W = null;
try { W = H.load(ART); } catch(e){ console.log('FAIL wizard VM boot: ' + e.message); fail++; }
const els = new Map();
if(W){
  const mk = W.window.document.createElement;
  W.window.document.getElementById = id => { if(!els.has(id)){ const e = mk('div'); e.id = id; els.set(id, e); } return els.get(id); };
  W.eval('showToast = function(){}');
}
const BOOT_WD = W ? W.eval('JSON.stringify(WD)') : '{}';
const txt = h => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ([,.;])/g, '$1').trim();
function wiz(goal, exp, mile){
  const wd = Object.assign(JSON.parse(BOOT_WD), { name: 'M', primaryPath: 'hybrid', cardioTypes: ['run'], liftingFocus: 'balanced', experience: exp, ageBracket: '18-35',
    equipment: 'crossfit', unit: 'lbs', restDays: ['sun','wed'], eventTargeted: false, raceDate: '', seed: SEEDS[0] });
  wd.cardioGoals = { run: goalObj(goal, mile) };
  W.window.__G226WD = wd; W.eval('WD = JSON.parse(JSON.stringify(__G226WD))'); els.clear();
  W.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep(); updateRaceDateFeedback()');
  const body = String((els.get('wizardBody') || {}).innerHTML || '');
  const labels = []; const rx = /<div class="input-label">Current mile time <span[^>]*>([^<]*)<\/span><\/div>/g; let m;
  while((m = rx.exec(body))) labels.push(m[1]);
  const tpl = /<span id="progLenLine">([\s\S]*?)<\/span>/.exec(body);
  const pl = els.get('progLenLine'), pf = els.get('paceFeasLine');
  const adv = /<div id="mileAdvisory" style="[^"]*">([^<]*)<\/div>/.exec(body);
  return { labels, hdrTpl: tpl ? txt(tpl[1]) : null, hdrPaint: pl ? txt(pl.innerHTML) : null, hasFeasNode: /id="paceFeasLine"/.test(body),
    feas: pf ? (pf.style.display === 'none' ? '' : txt(pf.innerHTML)) : '', adv: adv ? adv[1] : null };
}
const wguard = (id, fn) => guard(id, () => { if(!W) throw new Error('no wizard VM'); fn(); });
wguard('G8a', () => {
  const bad = []; let n = 0;
  for(const goal of ['run_5k', 'run_half', 'run_pace_goal', 'run_base']) for(const exp of EXPS){ n++;
    const w = wiz(goal, exp, 0);
    const want = D189 ? [refused(goal, exp) ? HELP_REQ : HELP_OPT[exp]] : (exp === 'beginner' ? [] : [HELP_V225]);   // V225: beginners have no field
    w.labels.forEach(l => seen('G8a ' + goal + '|' + exp, l));
    if(J(w.labels) !== J(want)) bad.push(goal + '|' + exp + ' ' + J(w.labels) + ' want ' + J(want)); }
  ok(ROW.G8a, bad.length === 0, bad.length ? bad.length + '/' + n + ' cells: ' + bad.slice(0, 2).join(' ; ') : n + '/' + n + ' cells');
});
wguard('G8b', () => {
  const want = D189 ? D9_OVER : D9_OVER_V225, bad = [];
  for(const exp of ['intermediate', 'advanced']){
    const r = IA.eval('_mileEntryState')({ mileBestMins: '26', mileBestSecs: '0' }, exp); seen('G8b validator ' + exp, r && r.msg);
    if(!(r && r.ok === false && r.msg === want)) bad.push('validator ' + exp + ' ' + J(r));
    const w = wiz('run_5k', exp, 1560); seen('G8b advisory ' + exp, w.adv);
    if(w.adv !== want) bad.push('#mileAdvisory ' + exp + ' ' + J(w.adv)); }
  ok(ROW.G8b, bad.length === 0, bad.join(' ; ') || J(want));
});
wguard('G8c', () => {
  const bad = [];
  for(const exp of ['intermediate', 'advanced']){ const w = wiz('run_pace_goal', exp, 0);
    seen('G8c tpl ' + exp, w.hdrTpl); seen('G8c paint ' + exp, w.hdrPaint);
    const good = D189 ? (w.hdrTpl === HDR_BLANK && w.hdrPaint === HDR_BLANK) : (HDR_NUM.test(w.hdrTpl || '') && HDR_NUM.test(w.hdrPaint || ''));
    if(!good) bad.push(exp + ' template ' + J(w.hdrTpl) + ' repaint ' + J(w.hdrPaint)); }
  ok(ROW.G8c + (D189 ? '' : ' [V225 truth: a numeric header from the default]'), bad.length === 0, bad.join(' ; ') || '2/2 levels');
});
wguard('G8d', () => {
  const bad = [];
  for(const exp of ['intermediate', 'advanced']){ const w = wiz('run_pace_goal', exp, 0);
    if(!w.hasFeasNode){ bad.push(exp + ' no #paceFeasLine node in the step'); continue; }
    if(D189){ if(w.feas !== '') bad.push(exp + ' ' + J(w.feas)); }
    else if(exp === 'intermediate'){ seen('G8d V225 ' + exp, w.feas); if(!w.feas.startsWith(FEAS_INT_V225)) bad.push(exp + ' ' + J(w.feas)); } }
  if(!D189) notApplicable(ROW.G8d + ' advanced cell', 'no V225 truth is typed for the advanced no-mile reach line (7:30 default vs a 12:00 goal); the intermediate cell carries the V225 row');
  ok(ROW.G8d + (D189 ? '' : ' [V225 truth: intermediate quotes a reach from the 9:30 default]'), bad.length === 0, bad.join(' ; ') || (D189 ? '2/2 levels empty' : 'intermediate prints the default reach'));
});
wguard('G8e', () => {
  const bad = [];
  for(const exp of ['intermediate', 'advanced']){ const w = wiz('run_pace_goal', exp, 540);
    seen('G8e feas ' + exp, w.feas); seen('G8e hdr ' + exp, w.hdrPaint);
    if(!(w.feas.startsWith('Your mile is 9:00.') && w.feas.endsWith(' Keep it or change it above.'))) bad.push(exp + ' feas ' + J(w.feas));
    if(!(HDR_NUM.test(w.hdrTpl || '') && HDR_NUM.test(w.hdrPaint || ''))) bad.push(exp + ' header ' + J(w.hdrTpl) + ' / ' + J(w.hdrPaint)); }
  ok(ROW.G8e, bad.length === 0, bad.join(' ; ') || '2/2 levels');
});
wguard('G8f', () => {
  const w = wiz('run_pace_goal', 'beginner', 0), want = D189 ? FEAS_BEG : FEAS_BEG_V225; seen('G8f', w.feas);
  ok(ROW.G8f + (D189 ? '' : ' [V225 truth: the D183 beginner line]'), w.feas.startsWith(want), J(w.feas));
});

// ── G9: copy over every asserted string ──
guard('G9', () => {
  const bad = ASSERTED.filter(([, s]) => COPY_RX.test(s) || /nike/i.test(s));
  ok(ROW.G9, ASSERTED.length > 0 && bad.length === 0, bad.length ? bad.slice(0, 3).map(([w, s]) => w + ' ' + J(s)).join(' ; ') : ASSERTED.length + ' strings clean');
});

// ── G10: HALF_MANNY ──
// V231 MAINTENANCE (tests/measure/v231_rulings/v231_absorb_ruling.md sections 3 and 4; standing rulings 3, 4 and 5):
// this row defends D189's claim "my ruling did not move HALF_MANNY". The literal it compared
// against went: the only object that carries that claim across later rulings is the era table that
// standing ruling 5 governs, so the row reads MANNY_DIGEST_BY_VERSION[VER], fails loudly when that
// row is absent (row existence is a conjunct), and compares the built digest to it. Re-pointing the literal
// to a later digest would be the vacuous line standing ruling 3 forbids; the row stays keyed to
// D189 (standing ruling 4). Section 3: "literal + row -> row only"; VER is this gate's own version variable.
guard('G10', () => {
  const eraV = VER, eraHas = Object.prototype.hasOwnProperty.call(H.MANNY_DIGEST_BY_VERSION, eraV), eraRow = eraHas ? H.MANNY_DIGEST_BY_VERSION[eraV] : undefined, built = H.progDigest(build(IA, H.fixtures.HALF_MANNY));
  ok(ROW.G10, eraHas && typeof eraRow === 'string' && /^[0-9a-f]{16}$/.test(eraRow) && built === eraRow, built + ' vs era row [' + eraV + '] ' + (eraHas ? eraRow : 'ABSENT'));
});

done();
