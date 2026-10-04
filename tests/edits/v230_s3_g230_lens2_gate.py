#!/usr/bin/env python3
# v230_s3_g230_lens2_gate.py — V230 slice 3 (no index.html edit). Writes tests/gates/g230_d194_lens2.js, part 1 of the
# gate for D194 P-INJLENS part 2 (the lens alone): the scaffold, the version predicate (below 230 REFUSED by name;
# IA_ASSUME_VERSION=230 lifts a file stamped exactly 229), the presentations (CFG, CFG1, OV5, OV1, STAMP), the
# instrument rows (inst-self, inst-stamp, inst-fix, inst-ov1) and the single-hop and L1-sweep rows (d193-e, d193-k″,
# d193-e′, d193-k, d193-l). Slice 4 appends the lattice rows (d193-i, d193-i-r, d193-i-u, d194-eq, d194-q′) by an
# anchored edit script of its own; this record is the slice-3 text.
# Ruling: tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 R3′; row definitions
# tests/measure/v228_rulings/d193_caprpe_ruling.md (Amendments 2 to 4); session form calls
# tests/measure/v230_rulings/v230_session_calls.md items 2 and 3; figures measure_lens_overlay_cf6_m12.md (M12).
# Writes once: refuses to overwrite. If the file already exists it reports whether it is byte-identical to this
# record. The embedded text is checked against its sha256 before any write, so a literal that did not round-trip
# aborts with nothing written.
import hashlib, pathlib, sys
P = pathlib.Path(__file__).resolve().parents[1] / 'gates' / 'g230_d194_lens2.js'
EXPECT_SHA256 = 'faf6501f27fb239b5513ade2f647036bae040d26d3865b75b8f403ebf56916fd'
CONTENT = r'''// g230_d194_lens2.js — GATE for D194 P-INJLENS part 2 (V230), the lens alone: outside buildProgram the plan that
// governs a card is the plan of the day the card is on (D194 R1), now at the tap and at boot as well (Amendment 1 R3′:
// the tap guard and its filter cfg, the boot guard and its filter cfg read _dayPlanCfg). So D193's live hold reaches
// the athlete the app actually builds, an overlay athlete, exactly as it already reached the fixture.
//
//   node tests/gates/g230_d194_lens2.js <candidate.html> [baseline_V229.html]
//   IA_ASSUME_VERSION=230 node tests/gates/g230_d194_lens2.js <tree stamped 229> [baseline_V229.html]   (discrimination only)
//
// THE RULINGS THIS DEFENDS
//   tests/measure/v229_rulings/d194_injlens_ruling.md: R1 (the plan of the day: the day's `_ovKey` patch, prog.cfg.injury
//   only on an unstamped day) and Amendment 1 R3′ ("V230 (D194 part 2) is the lens alone. The tap guard and filter cfg,
//   the boot guard and filter cfg, D193's live rows (e), (e′), (i), (i-r), (i-u), (k), (k″), (l)-live keyed to 230, (q)
//   re-keyed, and the equivalence row (overlay presentation == fixture presentation on every spliced-day chain of the
//   D190 lattice: live, toast, boot, undo, undo+boot)").
//   tests/measure/v228_rulings/d193_caprpe_ruling.md: the row definitions. (e) and (e′) as single-hop rows (Amendment 2
//   gate claims; Amendment 4 corrected claims "(e) unchanged (196/210 read 8 -> 0; live == boot 210/210 ...). Gains
//   (k″): the 196 bwsets ends print the unloadable hold toast ...; the 14 cue ends print "Same job, same numbers.""
//   and "(e′) unchanged (114 -> 0 ...)"); (k) (Amendment 4: "1,243 hold variants (verbatim 684, unloadable 360, window
//   199), 0 false claims, 0 hold toasts off the clamp set, non-clamp toasts == V227 148,825/148,825. INFO capped 458 |
//   458"); (l) (Amendment 4 "The rules" predicate and its rows G3a 832, G3d 263, G3e 202, G3f 199, G3c-off 168, G3c
//   power 0); R8's trigger restated (Amendment 4 "The rules").
//   tests/measure/v230_rulings/v230_session_calls.md items 2 and 3: one family, rows named for the ruling each defends;
//   the version predicate on the g229 idiom; (q) retired in g229, its delivery asserted here (d194-q′, slice 4).
//   Figures: tests/measure/v230_rulings/measure_lens_overlay_cf6_m12.md (M12), sections [3] and [5]. M12's CF6 is this
//   candidate byte for byte apart from the version stamp. Non-clamp toasts are compared with the V229 baseline instead
//   of V227 (M12: V229 -> CF6 moves exactly 1,243 toasts, so the complement is 148,825).
//   D-code D194 part 2, ships on ia-version 230. HALF_MANNY may not move (0ac7da6b1691a8e1, era row [230] = [229]); the
//   harness era table and g229_d193_build b assert that, not this file.
//
// PRESENTATIONS. Since V98 the app's injury reaches a program only as an overlay. Every presentation pins cfg.seed
//   76308 and the clock (12:00 on the date named), and every overlay id/created is fixed ('ov_fixed', 1) before a stored
//   record is used or compared.
//   CFG    the fixture: the config with `cfg.injury` stored, no overlay, clock 2026-09-24 (W5 Thursday).
//   CFG1   the same fixture at clock 2026-08-24 (W1 Monday).
//   OV5    the app's writer: an uninjured build stored with startDate 2026-08-24 and booted, then `_ovDraft.injRegion=…;
//          _ovDraft.injTier=…; _ovDraft.from='2026-09-21'; applyInjuryDraft()` (W5 Monday), read back from ia_programs,
//          clock W5 Thursday. Only W5 on are spliced (stamped).
//   OV1    the same writer from W1 Monday (2026-08-24) at the W1 clock, so every week is spliced (the freeze pierces only
//          weeks at or after the current week).
//   STAMP  applyOverlays' output shape built synthetically for the g221 L1 sweep: the injured build's days, every non-rest
//          carded day stamped `_ovKey = JSON.stringify(['injury',{injury:{region,tier}}])`, prog.cfg without injury,
//          prog._swapUniverseByKey[that key] = the injured build's universe (measure's method). Row inst-stamp proves it
//          equals the real writer.
//
// ORACLES. Nothing below asks the candidate's engine what the answer should be.
//   DIFFERENTIAL  the ruled equivalence: the overlay presentation (OV1, OV5, STAMP) equals the fixture presentation
//                 (CFG1, CFG) on the same tree. The fixture column is the ruling's stated expected answer.
//   TYPED         the hand CAP table (D193 Amendment 1), a hand RPE parse, the hand stripper (both cue wordings; R7's
//                 text by shape -> the strength test text), the hand hold (Amendment 1 §3 four shapes plus R7), D177's
//                 hand floor table and kinds (lifted from g221_d177_swapfloor.js), the unloadable reader's bucket, the
//                 cue shape, R7's held-test text, the strength test text, the hold sentence, R8's three hold toasts and
//                 "Same job, same numbers.", and the ruled counts (M12).
//   POPULATION    the single-hop pairs are drawn on the BASELINE tree's fixture (CFG1), with the baseline's _pattern and
//                 _repFloor naming a target's pattern and floor, so the population is the same whichever tree is the
//                 candidate (row inst-fix proves the fixture is unmoved). The L1 sweep's capped flag reads the baseline's
//                 _pattern the same way. The classifier is not under test; the plan is.
//
// VERSION PREDICATE (standing rulings 2 and 4).
//   below 230   REFUSED: every row FAILS by name.
//   230 and up  every row asserts.
//   IA_ASSUME_VERSION=230 lifts a file stamped exactly 229 to 230 for a discrimination run; it is announced, ignored on
//   any other file, and gate.sh never sets it. On V229 that way every figure row FAILS at its V229 figure (d193-e live
//   bwsets at RPE 8 196; d193-k″ hold toasts 0 of 196; d193-e′ live and boot above RPE 7 114; d193-k 0 hold variants,
//   1,243 false claims, INFO capped 728; d193-l G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0) while the instrument rows pass.
//   Each figure row also requires the BASELINE to read its V229 figure on the same presentation in the same run (the
//   baseline shows the defect, g229's precedent): V229 OV1 bwsets at RPE 8 196, hold toasts 0 of 196, live above RPE 7
//   114; V229 STAMP 0 hold variants, 1,243 false claims, INFO capped 728, G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0.
//   The baseline is argv[3] if it reads ia-version 229, else `git show <V229_COMMIT>:index.html` written under
//   os.tmpdir() (the runner sets TMPDIR to its scratch path); the run prints which path it used.
//
// ROWS (instrument rows first; if one fails, every figure row FAILS by name, unread)
//   inst-self   every stored record (7 L9 configs × CFG, CFG1, OV1, OV5, both trees) written twice in two fresh VMs
//               equals itself; every L1 baseline build equals itself in two VMs (384/384), clock fields stripped.
//   inst-stamp  STAMP == the real writer (OV1) on every day of the 7 L9 configs, both trees (294/294 each; 210 stamped).
//   inst-fix    the fixture presentation did not move: candidate CFG == V229 CFG on the whole L1 sweep (150,068/150,068,
//               card and toast, rows aligned) and on every L9 single-hop pair at CFG1 (324/324: donor, live card,
//               _preHold, toast, boot card, boot name, boot _preHold).
//   inst-ov1    an OV1 carded day == the CFG1 day with the stamp removed, every carded day of the 7 L9 configs, both
//               trees (210/210 each), and every OV1 carded day is stamped.
//   d193-e      L9 single-hop pairs (a cued native onto a capped unloadable target), 210, on OV1: live bwsets at RPE 8 0
//               (V229 196), at RPE 7 196, cue ends 14, live == boot 210/210, every pair on a stamped day, OV1 == CFG1
//               210/210 (donor, live, _preHold, toast, boot, boot _preHold); the W5-on subset on OV5 == CFG 72/72.
//   d193-k″     the 196 bwsets ends (named on the baseline fixture CFG1, the ruled expected answer: its card is
//               `N sets — RPE 7 …`) read RPE 7 on OV1 and print R8's unloadable hold toast `<to> in, <from> out. No load to add here.
//               Your injury plan holds this one at RPE 7.` 196/196 (V229 0 of 196); the other 14 (the fixture's cue ends) are cued and
//               print `<to> in, <from> out. Same job, same numbers.` 14/14.
//   d193-e′     L9 single-hop pairs (a native above RPE 7 onto a capped target), 114, all W5 on: on OV1 and on OV5 live
//               above RPE 7 0 (V229 114), boot above RPE 7 0 (V229 114), live == boot 114, hold toasts 114 (V229 0), OV1 ==
//               CFG1 and OV5 == CFG 114/114.
//   d193-k      the g221 D177 L1 sweep (150,068 Main and Power swap pairs on 384 configs) on STAMP: hand clamp pairs 1,243;
//               toast == the hand hold variant 1,243 (verbatim 684, unloadable 360, window 199); 0 false same-numbers or
//               same-effort claims on a clamp pair; 0 hold toasts off the clamp set; INFO capped 458 (pinned); STAMP ==
//               CFG on the candidate, card 0 differ and toast 0 differ; every non-clamp toast == the V229 baseline's STAMP
//               toast 148,825/148,825. V229: 0 hold variants, 1,243 false claims, INFO capped 728.
//   d193-l      the same sweep on STAMP, (l)'s predicate on every row's whole population (capped: the card is the hand hold
//               of D177's card on the stripped donor; uncapped: D177's card on the stripped donor) with 0 misses, and the
//               moved counts pinned and == CFG's: G3a 832 (hold of donor 529, hold of window 199, uncapped beneath-hold
//               104), G3c power 0, G3c off grammar 168, G3d 263, G3e 202, G3f 199. V229 STAMP: G3a 143, G3c-off 96, G3d 0,
//               G3e 47, G3f 0.
//
// RUNTIME. Jobs (the 7 L9 pair configs and 8 shards of the L1 sweep) run in a pool of 4 worker processes (fixed; no
//   environment knob). Each prints one result line on stdout and writes no file. A worker that dies fails the rows it
//   owed, by name.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const { load } = H;

const ROOT = path.join(__dirname, '..', '..');
const ERA = 230, BASE_ERA = 229;
const V229_COMMIT = '0bec3ecfdc53ecb71b74178a3d6c49398ae87018';   // index.html at this commit is the V229 artifact (== 5297b4b's)
const POOL = 4, L1_SHARDS = 8, MARK = '__G230_RESULT__';
const IS_WORKER = process.argv.includes('--worker');
const POS = process.argv.slice(2).filter(a => a !== '--worker');
const ART = POS[0] || path.join(ROOT, 'index.html');
const BASEFILE = POS[1] || null;

// ── TYPED ORACLE ─────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24';
const PRES = { CFG:{ clock:'2026-09-24', from:null }, CFG1:{ clock:'2026-08-24', from:null }, OV5:{ clock:'2026-09-24', from:'2026-09-21' }, OV1:{ clock:'2026-08-24', from:'2026-08-24' } };
const CUE = / — hold RPE 7, (?:two|three) in the tank$/;
const R7T = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const TEST9 = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const HOLD = ' Your injury plan holds this one at RPE 7.';
const CAP = { knee:{ workaround:['squat', 'lunge', 'leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat', 'lunge'], protect:['squat'] },
  hip:{ workaround:['hinge', 'lunge', 'hip_ext', 'squat'], protect:['squat'] }, lowback:{ workaround:['hinge', 'squat', 'row', 'hip_ext'], protect:['squat', 'hip_ext'] },
  shoulder:{ workaround:['hpress', 'vpress', 'delt_iso'], protect:[] }, elbow:{ workaround:['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'], protect:['row', 'vpull'] } };
function capOf(cfg){ if(!cfg || !cfg.injury) return []; const r = CAP[cfg.injury.region], c = r && r[cfg.injury.tier];
  if(!c) throw new Error('g230: no hand cap row for ' + cfg.injury.region + '/' + cfg.injury.tier); return c; }
const rpeHand = d => { const re = /RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?/g; let m, best = null; while((m = re.exec(String(d || '')))){ const v = Math.max(+m[1], m[2] ? +m[2] : 0); if(best === null || v > best) best = v; } return best; };
const isCue = d => CUE.test(String(d || ''));
const bwAt = (d, v) => new RegExp('^\\d+ sets — RPE ' + v + ' ').test(String(d || ''));
const above7 = d => { const r = rpeHand(d); return r !== null && r > 7; };
// D177's hand floor table and kinds, lifted from tests/gates/g221_d177_swapfloor.js (first match wins)
const HAND_FLOOR = [
  [/^(barbell bench press|incline barbell press|close-grip bench press|barbell row|pendlay row|deadlift|sumo deadlift|trap bar deadlift|romanian deadlift|back squat|front squat|paused back squat|box squat|overhead press|push press|good mornings)$/i, null],
  [/foot on chair|hands on bed|shoulders on bed|under a table|\(anchored\)|partner\/anchor/i, [0, 0]],
  [/banded|resistance band|band pull-apart/i, [0, 0]],
  [/glute bridge|bodyweight back extension|45° back extension/i, [0, 0]],
  [/nordic|glute-ham|\bghr\b/i, [0, 0]],
  [/inverted row|prone y-t-w|reverse snow angel/i, [0, 0]],
  [/wall sit|wall walk|assisted pistol|spanish squat/i, [0, 0]],
  [/\bdips\b|pushup|push-up|pike pushup/i, [0, 0]],
  [/squat \(slow/i, [0, 0]],
  [/goblet/i, [8, 12]],
  [/pull-through|pull through/i, [8, 12]],
  [/straight-arm pulldown/i, [8, 12]],
  [/kettlebell swing|\bswing\b/i, [10, 15]],
  [/hip thrust/i, [6, 10]],
  [/split squat|step-?up|single-leg|single leg|pistol|landmine (reverse lunge|rotational press)/i, [6, 10]],
  [/\brow\b/i, [6, 10]],
  [/dumbbell|kettlebell|\bdb\b|\bkb\b/i, [5, 8]],
  [/leg press|hack squat|machine|pulldown/i, [5, 8]],
  [/cable|crossover|pec deck|\bfly\b|flye/i, [8, 12]],
];
const handFloor = n => { for(const [re, w] of HAND_FLOOR) if(re.test(String(n || ''))) return w; return null; };
const GRAM = /^(\d+)×(\d+)(?:–(\d+))? — RPE /;
const REP_TOKEN = /^(\d+)×\d+(?:–\d+)?/;
const handRewrite = (d, w) => d.replace(REP_TOKEN, (m, s) => s + '×' + w[0] + '–' + w[1]);
const stripRep = s => String(s).replace(REP_TOKEN, (m, sets) => sets + '×#');
function handKind(n, D){ const W = handFloor(n); if(W === null) return { k:'null', W }; if(W[1] === 0) return { k:'zero', W };
  const m = GRAM.exec(D || ''); if(!m) return { k:'offgram', W }; if(+m[2] < W[0]) return { k:'win', W, out:handRewrite(D, W) }; return { k:'atfloor', W }; }
const cueBlind = s => { if(typeof s !== 'string') return s; const m = CUE.exec(s); return m ? s.slice(0, m.index) : s; };
// the hand stripper and the hand hold (g221's V229 D193 era oracle, D193 Amendment 1 §3 and Amendment 3 §2)
const TEST_SHAPE = /^Work up to one heavy set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/;
const R7_SHAPE = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
const CUE3 = ' — hold RPE 7, three in the tank';
const stripHand = d => typeof d !== 'string' ? d : R7_SHAPE.test(d) ? TEST9 : d.replace(CUE, '');
function holdHand(d){
  if(typeof d !== 'string' || !d) return d;
  if(!/RPE/.test(d)) return d + CUE3;
  if(TEST_SHAPE.test(d)) return R7T;
  return d.replace(/RPE (\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?( \((stop 2 reps short of failure|leave ~\d+ reps? in reserve|heaviest pair you can find)\))?/g, (t, a, b, g, gl) => {
    if(!(Math.max(+a, b ? +b : 0) > 7)) return t;
    if(!g) return 'RPE 7';
    return /^stop/.test(gl) ? 'RPE 7 (leave 3 or more in reserve)' : /^heaviest/.test(gl) ? 'RPE 7 (leave ~3 in reserve)' : 'RPE 7 (leave ~3 reps in reserve)';
  });
}
const CONVERTS_HAND = /^\s*\d+\s*[×x]\s*\d/;
const bucketHand = d => /rpe\s*6|light|easy/i.test(String(d || '')) ? 6 : /rpe\s*7/i.test(String(d || '')) ? 7 : 8;
const claims = t => /same numbers|same effort/i.test(String(t));
// R8's three hold toasts and D177/V119's sentence, typed
const T3H = (to, from, w) => to + ' in, ' + from.toLowerCase() + ' out. The load runs out before the reps do here. Reps move to ' + w[0] + ' to ' + w[1] + '.' + HOLD;
const T119H = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. No load to add here.' + HOLD;
const TSAMEH = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. Same sets, same reps.' + HOLD;
const TSAME = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. Same job, same numbers.';
// the ruled figures (M12 [3] and [5]; D193 Amendment 4; the V229 figure each must fail at)
const W = {
  stamp:{ days:294, stamped:210 }, ovday:210, self:{ records:56, l1:384 }, fixPairs:324,
  e:{ n:210, bw8:0, bw7:196, cue:14, w5:72, v229bw8:196 }, kpp:{ hold:196, same:14, v229hold:0 },
  e2:{ n:114, v229:114 },
  L1:{ cfgs:384, pairs:150068, clamp:1243, hv:1243, hvK:{ verbatim:684, unloadable:360, window:199 }, info:458, nonClamp:148825, v229:{ hv:0, fals:1243, info:728 } },
  l:{ G3a:832, G3aCls:{ donor:529, window:199, verbatim:104 }, pow:0, off:168, at:263, nul:202, win:199, v229:{ G3a:143, off:96, at:0, nul:47, win:0 } },
};

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const clone = x => JSON.parse(JSON.stringify(x));
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLOCKK = /^_?(ts|at|time|stamp|clock|now|id|created)$/i;
const J = v => JSON.stringify(v, (k, x) => CLOCKK.test(k) ? undefined : x);
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  bench:135, squat:155, deadlift:185, seed:76308 };
const withInj = inj => { const c = clone(MARIO); if(inj) c.injury = inj; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }),
  hip_wa:withInj({ region:'hip', tier:'workaround' }), lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }),
  elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
const CK7 = ['elbow_wa', 'shoulder_wa', 'lowback_wa', 'hip_wa', 'knee_protect', 'mario', 'ankle_wa'];   // largest first, for the pool
// L1: g221_d177_swapfloor.js's lite lattice, verbatim (384 configs: 96 healthy, 288 injured)
function mk(t, f, x, g, i, seed){
  const race = !!g.id && /half/.test(g.id);
  return { name:'M', primaryPath:g.id ? (race ? 'event' : 'cardio') : 'lift', cardioTypes:g.id ? ['run'] : [],
    cardioGoals:g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted:race, raceDate:race ? '2026-12-06' : null, liftingFocus:f, experience:x, ageBracket:'18-35', equipment:t, unit:'lbs',
    restDays:['sun', 'wed'], days:['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench:135, squat:155, deadlift:185, seed, ...(i.v ? { injury:i.v } : {}) };
}
const LO = { k:'liftonly', id:null }, HALF = { k:'half', id:'run_half' };
const INJ = (r, t) => ({ k:r + '/' + t, v:{ region:r, tier:t } }), HEALTHY = { k:'healthy', v:null };
const L1 = [];
for(const t of ['commercial', 'home_full', 'crossfit', 'home_basic', 'bodyweight', 'minimal']) for(const f of ['support_prevention', 'support_strength', 'hypertrophy', 'strength'])
  for(const x of ['beginner', 'advanced']) for(const g of [LO, HALF]) for(const i of [HEALTHY, INJ('knee', 'workaround'), INJ('lowback', 'workaround'), INJ('shoulder', 'protect')]) L1.push(mk(t, f, x, g, i, 76308));

// ── VM PLUMBING (shared by the parent and the workers) ───────────────────────────────────────────────────────────
function pin(IA, clock){ const T = new Date(clock + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__T=[];globalThis.__TL=null;showToast=function(m){__T.push(String(m));globalThis.__TL=m;};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};showScreen=function(){};closeRestSheet=function(){};try{popFire=function(){};}catch(e){}"
  + "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};";
function fresh(file, clock){ const X = load(file); pin(X, clock); E(X, HELP); return X; }
function setup(IA, st){ IA.localStorage.clear(); IA.ctx.__SP = JSON.parse(st); E(IA, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
const stampKey = inj => JSON.stringify(['injury', { injury:{ region:inj.region, tier:inj.tier } }]);
function stampWeeks(weeks, key){ let n = 0; Object.keys(weeks).forEach(w => Object.keys(weeks[w]).forEach(d => { const dy = weeks[w][d]; if(dy && !dy.rest && Array.isArray(dy.sections)){ dy._ovKey = key; n++; } })); return n; }
// the stored record: CFG/CFG1 = cfg.injury stored; OV1/OV5 = the uninjured build stored, booted, then the app's own writer.
// X must be pinned at the presentation's clock.
function stored(X, cfg, pres){ const P = PRES[pres]; const base = clone(cfg); delete base.injury; const c = P.from ? base : clone(cfg);
  const p = X.buildProgram(clone(c)); const s = clone(p); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(c) }); let j = JSON.stringify(s);
  if(P.from && cfg.injury){ setup(X, j);
    E(X, '_ovDraft.injRegion=' + JSON.stringify(cfg.injury.region) + ';_ovDraft.injTier=' + JSON.stringify(cfg.injury.tier) + ";_ovDraft.from='" + P.from + "';applyInjuryDraft();");
    const o = JSON.parse(E(X, "localStorage.getItem('ia_programs')")).find(x => x.id === 'PM'); (o.overlays || []).forEach(v => { v.id = 'ov_fixed'; v.created = 1; }); j = JSON.stringify(o); }
  return j; }
const slotOf = (IA, w, d, si, ii) => JSON.parse(E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";var it=dy&&dy.sections&&dy.sections[" + si + "]&&dy.sections[" + si + "].items[" + ii + "];return it?JSON.stringify({n:it.name,d:it.detail||'',hk:('_preHold' in it),h:(typeof it._preHold==='string')?it._preHold:null}):JSON.stringify({n:'(none)',d:'',hk:false,h:null});})()"));
const dayJ = (IA, w, d) => E(IA, 'JSON.stringify(activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d + ')');
const stampOf = (IA, w, d) => E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";return dy&&typeof dy._ovKey==='string'?dy._ovKey:null;})()");

// ── WORKER JOBS ──────────────────────────────────────────────────────────────────────────────────────────────────
// pairs: one L9 config. Instruments (self, stamp, ov-day) and the (e)/(e′) single-hop pairs, live + boot.
function jobPairs(spec){
  const ck = spec.ck, cfg = CFGS[ck], cap = capOf(cfg), files = { C:spec.art, B:spec.base };
  const out = { ck, self:[], stamp:{}, ovday:{}, rows:[] }; const ST = {};
  for(const t of ['C', 'B']) for(const p of Object.keys(PRES)){ const a = stored(fresh(files[t], PRES[p].clock), cfg, p), b = stored(fresh(files[t], PRES[p].clock), cfg, p);
    out.self.push({ t, p, eq:a === b && a.length > 1000, n:a.length }); ST[t + p] = a; }
  const VM = {}, BVM = {};
  const vm = (t, p) => VM[t + p] || (VM[t + p] = (Y => (setup(Y, ST[t + p]), Y))(fresh(files[t], PRES[p].clock)));
  const bvm = (t, p) => BVM[t + p] || (BVM[t + p] = fresh(files[t], PRES[p].clock));
  for(const t of ['C', 'B']){
    // STAMP (synthetic) == the real writer (OV1), every day
    const X = fresh(files[t], PRES.OV1.clock); const p = JSON.parse(JSON.stringify(X.buildProgram(clone(cfg)))); const nst = stampWeeks(p.weeks, stampKey(cfg.injury));
    const ov = JSON.parse(E(vm(t, 'OV1'), 'JSON.stringify(activeProg.weeks)')); let n = 0, eq = 0; const ex = [];
    Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { n++; if(JSON.stringify(p.weeks[w][d]) === JSON.stringify(ov[w] && ov[w][d])) eq++; else if(ex.length < 1) ex.push('W' + w + ' ' + d); }));
    out.stamp[t] = { n, eq, stamped:nst, ex };
    // OV1 carded day == CFG1 day with the stamp removed; every OV1 carded day stamped
    const fx = JSON.parse(E(vm(t, 'CFG1'), 'JSON.stringify(activeProg.weeks)')); let m = 0, me = 0, ms = 0; const ex2 = [];
    Object.keys(fx).forEach(w => Object.keys(fx[w]).forEach(d => { const a = fx[w][d]; if(!a || !Array.isArray(a.sections) || !a.sections.length) return; m++;
      const b = ov[w] && ov[w][d]; if(b && typeof b._ovKey === 'string') ms++; const bb = b ? Object.assign({}, b) : null; if(bb) delete bb._ovKey;
      if(JSON.stringify(a) === JSON.stringify(bb)) me++; else if(ex2.length < 1) ex2.push('W' + w + ' ' + d); }));
    out.ovday[t] = { n:m, eq:me, stamped:ms, ex:ex2 };
  }
  // population, drawn on the baseline fixture at the W1 clock
  const Q = vm('B', 'CFG1'); const Wk = JSON.parse(E(Q, 'JSON.stringify(activeProg.weeks)'));
  const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = E(Q, '_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const RF = {}; const unl = n => (n in RF) ? RF[n] : (RF[n] = (r => !!(r && r[1] === 0))(JSON.parse(E(Q, 'JSON.stringify(_repFloor(' + JSON.stringify(n) + '))'))));
  const liveSwap = (Y, w, d, si, ii, to) => { E(Y, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); const snap = dayJ(Y, w, d); const cur = slotOf(Y, w, d, si, ii);
    Y.ctx.__c = { secIdx:si, itemIdx:ii, name:cur.n, detail:cur.d }; Y.ctx.__to = to; let o, h; E(Y, '__T.length=0;');
    try { E(Y, '_swapCtx=__c;applySwapChoice(__to);'); const s = slotOf(Y, w, d, si, ii); o = s.d; h = s.h; } catch(e){ o = 'CRASH ' + String(e && e.message || e).slice(0, 80); h = null; }
    const sw = E(Y, "localStorage.getItem('ia_swaps_PM')"); const t2 = Array.from(E(Y, '__T')).join(' / '); const st = stampOf(Y, w, d);
    Y.ctx.__S = JSON.parse(snap); E(Y, 'activeProg.weeks[' + w + '].' + d + "=__S;localStorage.removeItem('ia_swaps_PM');localStorage.removeItem('ia_swapct_PM');localStorage.removeItem('ia_hist_PM');");
    return { donor:cur, o, h, sw, t:t2, st }; };
  const bootRead = (t, p, sw, w, d, si, ii) => { const Z = bvm(t, p); Z.localStorage.clear(); Z.ctx.__SP = JSON.parse(ST[t + p]); E(Z, 'savePrograms([__SP]);'); if(sw) Z.localStorage.setItem('ia_swaps_PM', sw);
    return JSON.parse(E(Z, "(function(){var p=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));var it=p.weeks[" + w + "]." + d + ".sections[" + si + "]&&p.weeks[" + w + "]." + d + ".sections[" + si + "].items[" + ii + "];return JSON.stringify(it?{n:it.name,d:it.detail,h:(typeof it._preHold==='string')?it._preHold:null}:{n:'(none)',d:'',h:null});})()")); };
  for(const w of Object.keys(Wk)) for(const d of Object.keys(Wk[w])){ const dy = Wk[w][d]; if(!dy || !Array.isArray(dy.sections)) continue;
    dy.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.name || typeof it.detail !== 'string') return;
      const cls = isCue(it.detail) ? 'e' : above7(it.detail) ? 'e2' : null; if(!cls) return;
      E(Q, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); let tg = []; try { tg = Array.from(E(Q, '__cands(activeProg.weeks[' + w + '].' + d + ',' + w + ',' + JSON.stringify(it.name) + ')')); } catch(e){}
      tg.forEach(to => { if(!cap.includes(pat(to))) return; if(cls === 'e' && !unl(to)) return;
        const r = { ck, cls, w:+w, d, si, ii, from:it.name, donor:it.detail, to, R:{} };
        const combos = [['C', 'CFG1'], ['C', 'OV1'], ['B', 'CFG1'], ['B', 'OV1']].concat(+w >= 5 ? [['C', 'CFG'], ['C', 'OV5']] : []);
        for(const [t, p] of combos){ const s0 = liveSwap(vm(t, p), +w, d, si, ii, to); const b = bootRead(t, p, s0.sw, +w, d, si, ii);
          r.R[t + ':' + p] = { dn:s0.donor.d, st:s0.st, o:s0.o, h:s0.h, t:s0.t, b:b.d, bn:clean(b.n), bh:b.h }; }
        out.rows.push(r); }); })); }
  return out;
}
// l1: a shard of g221's L1 sweep, every Main and Power swap pair, live applySwapChoice then undoSwap, on four
// presentations: candidate CFG and STAMP, baseline CFG and STAMP. Returns aggregates and cross-presentation counts.
function sweepL1(IA, cfg, pres){
  const p = IA.buildProgram(clone(cfg)); let prog = Object.assign({}, p, { cfg:clone(cfg) });
  if(pres === 'STAMP' && cfg.injury){ const key = stampKey(cfg.injury), c2 = clone(cfg); delete c2.injury; stampWeeks(p.weeks, key); prog = Object.assign({}, p, { cfg:c2 }); prog._swapUniverseByKey = { [key]:p._swapUniverse }; }
  IA.ctx.__P = prog; const scE = IA.eval('swapCandidates'); const rows = [];
  const tag = [cfg.equipment, cfg.liftingFocus, cfg.experience, cfg.primaryPath, cfg.injury ? cfg.injury.region + '/' + cfg.injury.tier : 'healthy'].join('|');
  for(const w of Object.keys(p.weeks)) for(const d of Object.keys(p.weeks[w])){
    const day = p.weeks[w][d]; if(!day || day.rest || !Array.isArray(day.sections)) continue;
    IA.eval("activeProg=__P;activeProgId='P1';currentWeek=" + (+w) + ";currentDayKey='" + d + "';localStorage.removeItem('ia_swaps_P1');");
    for(let si = 0; si < day.sections.length; si++){
      const L = clean(day.sections[si] && day.sections[si].label); const isMain = /^main/i.test(L), isPow = /^power|explosive finisher/i.test(L);
      if(!isMain && !isPow) continue;
      const nItems = (day.sections[si].items || []).length;
      for(let ii = 0; ii < nItems; ii++){
        const it0 = day.sections[si].items[ii]; if(!it0 || !it0.name || typeof it0.detail !== 'string') continue;
        let c = null; try { c = scE(clean(it0.name), day, w, prog); } catch(e){} if(!c) continue;
        const cands = [].concat(c.tier1 || [], c.tier2 || []).map(z => typeof z === 'string' ? z : z.name);
        for(const to of cands){
          const it = day.sections[si].items[ii], from = it.name, D = it.detail, raw = JSON.stringify(day.sections);
          let O = null, toast = null, thr = 0;
          try { IA.ctx.__c = { secIdx:si, itemIdx:ii, name:from, detail:D }; IA.eval("globalThis.__TL=null;_swapCtx=__c;applySwapChoice(" + JSON.stringify(to) + ')');
            O = day.sections[si].items[ii].detail; toast = IA.eval('globalThis.__TL'); IA.eval('undoSwap(' + JSON.stringify(from) + ')'); } catch(e){ thr = 1; }
          day.sections = JSON.parse(raw); IA.eval("localStorage.removeItem('ia_swaps_P1')");
          rows.push({ key:tag + ' W' + w + ' ' + d + ' [' + si + ',' + ii + '] ' + clean(from) + ' -> ' + to, isPow, to, from, D, O, toast, thr });
        }
      }
    }
  }
  return rows;
}
const newL1 = () => ({ pairs:0, thr:0, clamp:0, hv:0, hvK:{ verbatim:0, unloadable:0, window:0 }, fals:0, holdOff:0, info:0, hvMiss:0,
  pow:0, powChg:0, main:0, G3a:0, G3aCls:{ donor:0, window:0, verbatim:0 }, G3aMiss:0, offN:0, off:0, offMiss:0, nulN:0, nul:0, nulMiss:0, atN:0, at:0, atMiss:0, winN:0, win:0, winMiss:0 });
function classify(cfg, r, pat){ const Hk = handKind(r.to, r.D); const Db = stripHand(r.D); const capd = capOf(cfg).includes(pat(clean(r.to)));
  const conv = Hk.k === 'zero' && CONVERTS_HAND.test(Db);
  const pre = conv ? bucketHand(Db) : rpeHand(Hk.k === 'win' ? handRewrite(Db, Hk.W) : Db);
  const E9 = Hk.k === 'win' ? handRewrite(Db, Hk.W) : Db;
  return { Hk, Db, capd, conv, clamp:capd && pre !== null && pre > 7, kind:Hk.k === 'win' ? 'window' : conv ? 'unloadable' : 'verbatim',
    wantH:Hk.k === 'win' ? T3H(r.to, r.from, Hk.W) : conv ? T119H(r.to, r.from) : TSAMEH(r.to, r.from), X9:capd ? holdHand(E9) : E9 }; }
function tallyL1(S, r, c, note){ const O = r.O, D = r.D, t = String(r.toast);
  S.pairs++; if(r.thr) S.thr++;
  if(c.clamp){ S.clamp++; if(r.toast === c.wantH && t.endsWith(HOLD)){ S.hv++; S.hvK[c.kind]++; } else { S.hvMiss++; note('hv', r.key + ' [' + c.kind + '] ' + t + ' | want ' + c.wantH); } if(claims(t)) S.fals++; }
  else if(t.endsWith(HOLD)){ S.holdOff++; note('off', r.key + ' ' + t); }
  if(c.capd && rpeHand(c.Db) !== null && rpeHand(O) !== null && rpeHand(c.Db) !== rpeHand(O) && claims(t) && !t.endsWith(HOLD)) S.info++;
  if(r.isPow){ if(c.Hk.k === 'zero') return; S.pow++; if(cueBlind(O) !== cueBlind(D)) S.powChg++; return; }
  if(c.Hk.k === 'zero') return; S.main++;
  if(O !== D && stripRep(O) !== stripRep(D)){ S.G3a++; S.G3aCls[c.capd ? (c.Hk.k === 'win' ? 'window' : 'donor') : 'verbatim']++; }
  if(stripRep(O) !== stripRep(c.X9)){ S.G3aMiss++; note('A', r.key + ' :: ' + D + ' => ' + O + ' | want ' + c.X9); }
  if(c.Hk.k === 'offgram'){ S.offN++; if(cueBlind(O) !== cueBlind(D)) S.off++; if(cueBlind(O) !== cueBlind(c.X9)){ S.offMiss++; note('off', r.key + ' :: ' + D + ' => ' + O + ' | want ' + c.X9); } }
  if(c.Hk.k === 'null'){ S.nulN++; if(O !== D) S.nul++; if(O !== c.X9){ S.nulMiss++; note('null', r.key + ' :: ' + D + ' => ' + O + ' | want ' + c.X9); } }
  if(c.Hk.k === 'atfloor'){ S.atN++; if(O !== D) S.at++; if(O !== c.X9){ S.atMiss++; note('at', r.key + ' :: ' + D + ' => ' + O + ' | want ' + c.X9); } }
  if(c.Hk.k === 'win'){ S.winN++; if(O !== c.Hk.out) S.win++; if(O !== c.X9){ S.winMiss++; note('win', r.key + ' :: ' + D + ' => ' + O + ' | want ' + c.X9); } }
}
function jobL1(spec){
  const C = fresh(spec.art, PRES.CFG.clock), B = fresh(spec.base, PRES.CFG.clock), B2 = fresh(spec.base, PRES.CFG.clock);
  [C, B].forEach(X => E(X, "activeProgId='P1';"));
  const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = B.eval('_pattern(' + JSON.stringify(n) + ')') || '-');
  const out = { cfgs:0, crash:[], S:{ CCFG:newL1(), CSTAMP:newL1(), BCFG:newL1(), BSTAMP:newL1() },
    x:{ sc:{ n:0, align:true, card:0, toast:0 }, fix:{ n:0, align:true, card:0, toast:0 }, nc:{ n:0, eq:0 }, mv:{ card:0, toast:0 }, self:{ n:0, eq:0 } }, ex:{} };
  const note = (k, s) => { (out.ex[k] = out.ex[k] || []).length < 3 && out.ex[k].push(s); };
  const cmp = (X, a, b, nm) => { X.n += a.length; if(a.length !== b.length || a.some((r, i) => r.key !== b[i].key)){ X.align = false; note('align', nm + ' ' + a.length + ' vs ' + b.length); return; }
    a.forEach((r, i) => { if(r.O !== b[i].O){ X.card++; note(nm + 'card', r.key + ' :: ' + JSON.stringify(r.O) + ' vs ' + JSON.stringify(b[i].O)); } if(r.toast !== b[i].toast){ X.toast++; note(nm + 'toast', r.key + ' :: ' + r.toast + ' | vs ' + b[i].toast); } }); };
  for(const ci of spec.cis){ const cfg = L1[ci];
    try {
      out.x.self.n++; if(J(B.buildProgram(clone(cfg))) === J(B2.buildProgram(clone(cfg)))) out.x.self.eq++; else note('self', 'L1#' + ci);
      const R = { CCFG:sweepL1(C, cfg, 'CFG'), CSTAMP:sweepL1(C, cfg, 'STAMP'), BCFG:sweepL1(B, cfg, 'CFG'), BSTAMP:sweepL1(B, cfg, 'STAMP') };
      out.cfgs++;
      Object.keys(R).forEach(k => R[k].forEach(r => tallyL1(out.S[k], r, classify(cfg, r, pat), (n, s) => note(k + ':' + n, s))));
      cmp(out.x.sc, R.CSTAMP, R.CCFG, 'sc'); cmp(out.x.fix, R.CCFG, R.BCFG, 'fix');
      if(R.CSTAMP.length === R.BSTAMP.length) R.CSTAMP.forEach((r, i) => { const b = R.BSTAMP[i]; if(r.key !== b.key) return; const cl = classify(cfg, r, pat).clamp;
        if(r.O !== b.O) out.x.mv.card++; if(r.toast !== b.toast) out.x.mv.toast++;
        if(!cl){ out.x.nc.n++; if(r.toast === b.toast) out.x.nc.eq++; else note('nc', r.key + ' :: ' + r.toast + ' | V229 ' + b.toast); } });
      else note('align', 'CSTAMP vs BSTAMP ' + R.CSTAMP.length + ' vs ' + R.BSTAMP.length);
    } catch(e){ out.crash.push('L1#' + ci + ': ' + String(e && e.message || e).slice(0, 120)); }
  }
  return out;
}
const JOBK = { pairs:jobPairs, l1:jobL1 };
function workerMain(){ const spec = JSON.parse(fs.readFileSync(0, 'utf8')); const fn = JOBK[spec.kind]; if(!fn) throw new Error('unknown job kind ' + spec.kind);
  const r = fn(spec); process.stdout.write(MARK + JSON.stringify({ ok:true, r }) + '\n'); }

// ── PARENT ───────────────────────────────────────────────────────────────────────────────────────────────────────
function parentMain(){
let pass = 0, fail = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const R = {
  'inst-self':  'row inst-self   INSTRUMENT every stored record (7 L9 configs × CFG, CFG1, OV1, OV5, both trees) equals itself written in two fresh VMs (56/56); every L1 baseline build equals itself in two VMs (384/384)',
  'inst-stamp': 'row inst-stamp  INSTRUMENT STAMP (applyOverlays\' shape, synthetic) == the real writer (applyInjuryDraft from W1 Monday) on every day of the 7 L9 configs, both trees (294/294 each, 210 stamped)',
  'inst-fix':   'row inst-fix    INSTRUMENT the fixture presentation did not move: candidate CFG == V229 CFG on the g221 L1 sweep (150,068/150,068 card and toast) and on the L9 single-hop pairs at CFG1 (324/324)',
  'inst-ov1':   'row inst-ov1    INSTRUMENT an OV1 carded day == the CFG1 day with the stamp removed, every carded day of the 7 L9 configs, both trees (210/210 each), every one stamped',
  'd193-e':     'row d193-e      L9 single-hop pairs, a cued native onto a capped unloadable target (210), on OV1: live bwsets at RPE 8 0 (V229 196), at RPE 7 196, cue ends 14, live == boot 210/210, all on a stamped day, OV1 == CFG1 210/210 (donor, live, _preHold, toast, boot, boot _preHold); W5-on subset OV5 == CFG 72/72',
  'd193-k″':    'row d193-k″     on OV1 the 196 bwsets ends print R8\'s unloadable hold toast "<to> in, <from> out. No load to add here. Your injury plan holds this one at RPE 7." 196/196 (V229 0); the 14 cue ends print "<to> in, <from> out. Same job, same numbers." 14/14',
  'd193-e′':    'row d193-e′     L9 single-hop pairs, a native above RPE 7 onto a capped target (114, all W5 on), on OV1 and on OV5: live above RPE 7 0 (V229 114), boot above RPE 7 0 (V229 114), live == boot 114, hold toasts 114 (V229 0), OV1 == CFG1 and OV5 == CFG 114/114',
  'd193-k':     'row d193-k      g221 L1 sweep on STAMP (150,068 pairs, 384 configs): hand clamp pairs 1,243, toast == the hand hold variant 1,243 (verbatim 684, unloadable 360, window 199), 0 false same-numbers/effort claims, 0 hold toasts off the clamp set, INFO capped 458 pinned; STAMP == CFG card 0 and toast 0 differ; non-clamp toasts == V229 STAMP 148,825/148,825 (V229: 0 hold variants, 1,243 false claims, INFO 728)',
  'd193-l':     'row d193-l      g221 L1 sweep on STAMP, (l)\'s predicate (capped: hand hold of D177\'s card on the stripped donor; uncapped: D177\'s card on the stripped donor), 0 misses, moved counts == CFG\'s and pinned: G3a 832 (529 / 199 / 104), G3c power 0, G3c off grammar 168, G3d 263, G3e 202, G3f 199 (V229 STAMP: G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0)',
};
const INST = ['inst-self', 'inst-stamp', 'inst-fix', 'inst-ov1'];
const FIG = ['d193-e', 'd193-k″', 'd193-e′', 'd193-k', 'd193-l'];
const ORDER = INST.concat(FIG);

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
let IA, STAMP = NaN;
try { IA = load(ART); STAMP = +IA.version; } catch(e){ P('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION !== undefined){
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; P('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  } else P('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
P('g230 D194 P-INJLENS part 2 (the lens alone: D193 live rows on the overlay presentation) | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));
if(!(VER >= ERA)){
  P('REFUSED: ia-version ' + VER + ' predates D194 P-INJLENS part 2 (V' + ERA + '). No row may pass on it.');
  ORDER.forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
let BF = null, baseWhy = '';
if(BASEFILE){
  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';
  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ BF = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }
} else baseWhy = 'no argv[3]; ';
if(!BF){
  const f = path.join(os.tmpdir(), 'g230_d194_lens2_v' + BASE_ERA + '_' + process.pid + '.html');
  try {
    try { fs.unlinkSync(f); } catch(e){}
    process.on('exit', () => { try { fs.unlinkSync(f); } catch(e){} });
    fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V229_COMMIT + ':index.html'], { maxBuffer:1 << 27 }));
    const b = load(f); if(+b.version === BASE_ERA){ BF = f; baseWhy += 'git show ' + V229_COMMIT.slice(0, 7) + ':index.html written to ' + f + ' (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;
  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }
}
P('  V' + BASE_ERA + ' baseline: ' + (BF ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));
if(!BF){ ORDER.forEach(k => ok(R[k] + ' (setup: no V' + BASE_ERA + ' tree: ' + baseWhy + ')', false)); done(); }
const CF = ART;

// ── JOBS ────────────────────────────────────────────────────────────────────────────────────────────────────────
const JOBS = CK7.map(ck => ({ kind:'pairs', ck, art:CF, base:BF }));
for(let s = 0; s < L1_SHARDS; s++) JOBS.push({ kind:'l1', shard:s, art:CF, base:BF, cis:L1.map((c, i) => i).filter(i => i % L1_SHARDS === s) });
function runPool(jobs){ let i = 0; const res = new Array(jobs.length).fill(null);
  const one = k => new Promise(fin => { const j = jobs[k]; let out = '', err = '';
    const ch = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename, '--worker'], { stdio:['pipe', 'pipe', 'pipe'] });
    ch.stdout.setEncoding('utf8'); ch.stderr.setEncoding('utf8');   // a multi-byte character split across two chunks decodes whole
    ch.stdout.on('data', d => { out += d; }); ch.stderr.on('data', d => { err += d; }); ch.on('error', e => { err += String(e && e.message || e); });
    ch.on('close', code => { const line = out.split('\n').find(l => l.startsWith(MARK)); let r = null; try { r = line ? JSON.parse(line.slice(MARK.length)) : null; } catch(e){}
      if(!r || r.ok !== true) P('  worker ' + j.kind + ' ' + (j.ck || 'shard ' + j.shard) + ' unusable (exit ' + code + ')' + (r && r.err ? ': ' + r.err : '') + (err ? ' | stderr ' + err.slice(-500).trim() : ''));
      res[k] = r && r.ok === true ? r.r : null; fin(); });
    ch.stdin.end(JSON.stringify(j)); });
  return Promise.all(Array.from({ length:POOL }, async () => { while(i < jobs.length){ const k = i++; await one(k); } })).then(() => res); }
const tW = Date.now();
runPool(JOBS).then(res => {
  P('  jobs ' + res.filter(Boolean).length + '/' + JOBS.length + ' usable (' + ((Date.now() - tW) / 1000).toFixed(1) + ' s from spawn, pool ' + POOL + ')');
  const PJ = JOBS.map((j, i) => j.kind === 'pairs' ? res[i] : undefined).filter(x => x !== undefined), LJ = JOBS.map((j, i) => j.kind === 'l1' ? res[i] : undefined).filter(x => x !== undefined);
  const pairsOK = PJ.length === CK7.length && PJ.every(Boolean), l1OK = LJ.length === L1_SHARDS && LJ.every(Boolean);
  const RES = {};
  // pairs-side merge
  const PR = pairsOK ? PJ.flatMap(r => r.rows) : [];
  // L1-side merge
  const sumL1 = k => { const S = newL1(); LJ.filter(Boolean).forEach(r => { const s = r.S[k]; Object.keys(S).forEach(f => { if(typeof S[f] === 'number') S[f] += s[f]; else Object.keys(S[f]).forEach(g => { S[f][g] += s[f][g]; }); }); }); return S; };
  const L = { CCFG:sumL1('CCFG'), CSTAMP:sumL1('CSTAMP'), BCFG:sumL1('BCFG'), BSTAMP:sumL1('BSTAMP') };
  const X = { sc:{ n:0, align:true, card:0, toast:0 }, fix:{ n:0, align:true, card:0, toast:0 }, nc:{ n:0, eq:0 }, mv:{ card:0, toast:0 }, self:{ n:0, eq:0 } }; let cfgs = 0; const crash = [], EX = {};
  LJ.filter(Boolean).forEach(r => { cfgs += r.cfgs; crash.push(...r.crash); Object.keys(X).forEach(k => Object.keys(X[k]).forEach(f => { if(f === 'align') X[k].align = X[k].align && r.x[k].align; else X[k][f] += r.x[k][f]; }));
    Object.keys(r.ex).forEach(k => { EX[k] = (EX[k] || []).concat(r.ex[k]).slice(0, 3); }); });
  const exs = (...ks) => ks.flatMap(k => (EX[k] || []).map(s => ' | e.g. [' + k + '] ' + s)).join('');
  if(l1OK){ P('  L1: ' + cfgs + '/' + L1.length + ' configs | pairs CCFG ' + L.CCFG.pairs + ', CSTAMP ' + L.CSTAMP.pairs + ', BCFG ' + L.BCFG.pairs + ', BSTAMP ' + L.BSTAMP.pairs + ' | throws ' + [L.CCFG.thr, L.CSTAMP.thr, L.BCFG.thr, L.BSTAMP.thr].join('/') + (crash.length ? ' | CRASH ' + crash.slice(0, 2).join('; ') : ''));
    P('  L1: V229 STAMP -> candidate STAMP moves cards ' + X.mv.card + ', toasts ' + X.mv.toast); }

  // ── INSTRUMENT ROWS ──
  { const sf = pairsOK ? PJ.flatMap(r => r.self) : []; const sOK = sf.filter(s => s.eq).length;
    P('    inst-self stored records equal themselves ' + sOK + '/' + sf.length + (sf.filter(s => !s.eq).length ? ' (' + sf.filter(s => !s.eq).map(s => s.t + s.p).join(', ') + ')' : '') + ' | L1 baseline builds ' + X.self.eq + '/' + X.self.n + exs('self'));
    RES['inst-self'] = [pairsOK && l1OK && sf.length === W.self.records && sOK === sf.length && X.self.n === W.self.l1 && X.self.eq === X.self.n, 'records ' + sOK + '/' + sf.length + ', L1 baseline builds ' + X.self.eq + '/' + X.self.n]; }
  { const per = t => PJ.filter(Boolean).reduce((a, r) => ({ n:a.n + r.stamp[t].n, eq:a.eq + r.stamp[t].eq, st:a.st + r.stamp[t].stamped, ex:a.ex.concat(r.stamp[t].ex.map(x => r.ck + ' ' + x)) }), { n:0, eq:0, st:0, ex:[] });
    const c = per('C'), b = per('B');
    P('    inst-stamp candidate ' + c.eq + '/' + c.n + ' days (stamped ' + c.st + ')' + (c.ex.length ? ' first differing ' + c.ex[0] : '') + ' | V229 ' + b.eq + '/' + b.n + ' (stamped ' + b.st + ')' + (b.ex.length ? ' first differing ' + b.ex[0] : ''));
    RES['inst-stamp'] = [pairsOK && [c, b].every(x => x.n === W.stamp.days && x.eq === x.n && x.st === W.stamp.stamped), 'candidate ' + c.eq + '/' + c.n + ' (stamped ' + c.st + '), V229 ' + b.eq + '/' + b.n + ' (stamped ' + b.st + ')']; }
  { const same = (a, b) => !!a && !!b && a.dn === b.dn && a.o === b.o && a.h === b.h && a.t === b.t && a.b === b.b && a.bn === b.bn && a.bh === b.bh;
    const fp = PR.filter(r => same(r.R['C:CFG1'], r.R['B:CFG1'])).length;
    const bad = PR.find(r => !same(r.R['C:CFG1'], r.R['B:CFG1']));
    P('    inst-fix L1 candidate CFG == V229 CFG: aligned ' + X.fix.align + ', card differs ' + X.fix.card + ', toast differs ' + X.fix.toast + ' of ' + X.fix.n + exs('fixcard', 'fixtoast', 'align') + ' | L9 pairs at CFG1 ' + fp + '/' + PR.length
      + (bad ? ' | e.g. ' + bad.ck + ' W' + bad.w + ' ' + bad.d + ' ' + clean(bad.from) + ' -> ' + bad.to + ' ' + JSON.stringify(bad.R['C:CFG1']) + ' vs ' + JSON.stringify(bad.R['B:CFG1']) : ''));
    RES['inst-fix'] = [pairsOK && l1OK && !crash.length && cfgs === W.L1.cfgs && X.fix.align && X.fix.n === W.L1.pairs && X.fix.card === 0 && X.fix.toast === 0 && PR.length === W.fixPairs && fp === PR.length,
      'L1 ' + (X.fix.n - Math.max(X.fix.card, X.fix.toast)) + '/' + X.fix.n + ' (card differs ' + X.fix.card + ', toast ' + X.fix.toast + ', aligned ' + X.fix.align + '), pairs ' + fp + '/' + PR.length]; }
  { const per = t => PJ.filter(Boolean).reduce((a, r) => ({ n:a.n + r.ovday[t].n, eq:a.eq + r.ovday[t].eq, st:a.st + r.ovday[t].stamped, ex:a.ex.concat(r.ovday[t].ex.map(x => r.ck + ' ' + x)) }), { n:0, eq:0, st:0, ex:[] });
    const c = per('C'), b = per('B');
    P('    inst-ov1 candidate ' + c.eq + '/' + c.n + ' carded days (stamped ' + c.st + ')' + (c.ex.length ? ' first differing ' + c.ex[0] : '') + ' | V229 ' + b.eq + '/' + b.n + ' (stamped ' + b.st + ')' + (b.ex.length ? ' first differing ' + b.ex[0] : ''));
    RES['inst-ov1'] = [pairsOK && [c, b].every(x => x.n === W.ovday && x.eq === x.n && x.st === x.n), 'candidate ' + c.eq + '/' + c.n + ' (stamped ' + c.st + '), V229 ' + b.eq + '/' + b.n + ' (stamped ' + b.st + ')']; }
  const INSTR_OK = INST.every(k => RES[k] && RES[k][0]);

  // ── FIGURE ROWS ──
  const sameP = (a, b) => !!a && !!b && a.dn === b.dn && a.o === b.o && a.h === b.h && a.t === b.t && a.b === b.b && a.bh === b.bh && a.bn === b.bn;
  const lb = (r, k) => r.R[k].o === r.R[k].b && r.R[k].bn === clean(r.to);
  const cnt = (rows, f) => rows.filter(f).length;
  const exP = (r, k) => r.ck + ' W' + r.w + ' ' + r.d + ' ' + clean(r.from) + ' ' + JSON.stringify(r.donor) + ' -> ' + r.to + ' | ' + k + ' live ' + JSON.stringify(r.R[k].o) + ' toast "' + r.R[k].t + '" boot ' + JSON.stringify(r.R[k].b);
  const PE = PR.filter(r => r.cls === 'e'), PE2 = PR.filter(r => r.cls === 'e2');
  // (e) single-hop pairs, cued native onto a capped unloadable target
  { const k = 'C:OV1', E5 = PE.filter(r => r.w >= 5);
    const f = { n:PE.length, bw8:cnt(PE, r => bwAt(r.R[k].o, 8)), bw7:cnt(PE, r => bwAt(r.R[k].o, 7)), cue:cnt(PE, r => isCue(r.R[k].o)), lb:cnt(PE, r => lb(r, k)), st:cnt(PE, r => !!r.R[k].st),
      eq1:cnt(PE, r => sameP(r.R[k], r.R['C:CFG1'])), n5:E5.length, eq5:cnt(E5, r => sameP(r.R['C:OV5'], r.R['C:CFG'])), st5:cnt(E5, r => !!r.R['C:OV5'].st) };
    const ex = PE.find(r => bwAt(r.R[k].o, 8)) || PE.find(r => !sameP(r.R[k], r.R['C:CFG1'])) || PE.find(r => bwAt(r.R[k].o, 7));
    P('    d193-e OV1 pairs ' + f.n + ' | live bwsets RPE 8 ' + f.bw8 + ', RPE 7 ' + f.bw7 + ' | cue ends ' + f.cue + ' | live == boot ' + f.lb + ' | stamped ' + f.st + ' | OV1 == CFG1 ' + f.eq1 + '/' + f.n + ' | W5 on OV5 == CFG ' + f.eq5 + '/' + f.n5 + ' (stamped ' + f.st5 + ')' + (ex ? '\n      e.g. ' + exP(ex, k) : ''));
    const b8 = cnt(PE, r => bwAt(r.R['B:OV1'].o, 8)), okB = b8 === W.e.v229bw8;
    RES['d193-e'] = [pairsOK && okB && f.n === W.e.n && f.bw8 === W.e.bw8 && f.bw7 === W.e.bw7 && f.cue === W.e.cue && f.lb === f.n && f.st === f.n && f.eq1 === f.n && f.n5 === W.e.w5 && f.eq5 === f.n5 && f.st5 === f.n5,
      'pairs ' + f.n + ', live bwsets RPE 8 ' + f.bw8 + ' (V229 ' + W.e.v229bw8 + '), RPE 7 ' + f.bw7 + ', cue ends ' + f.cue + ', live == boot ' + f.lb + ', OV1 == CFG1 ' + f.eq1 + '/' + f.n + ', OV5 == CFG ' + f.eq5 + '/' + f.n5 + (okB ? '' : '; BASELINE not as ruled: V229 OV1 bwsets at RPE 8 ' + b8)]; }
  // (k″) the toasts on (e)'s ends, typed
  // the two sets are named on the BASELINE fixture (B:CFG1, the ruled expected answer; inst-fix proves it == the
  // candidate's fixture), not by the card the overlay printed: its bwsets ends at RPE 7 and its cue ends.
  { const k = 'C:OV1', B7 = PE.filter(r => bwAt(r.R['B:CFG1'].o, 7)), CU = PE.filter(r => isCue(r.R['B:CFG1'].o));
    const b7 = cnt(B7, r => bwAt(r.R[k].o, 7)), cu = cnt(CU, r => isCue(r.R[k].o));
    const hold = cnt(B7, r => r.R[k].t === T119H(r.to, r.from) && r.R[k].t.endsWith(HOLD)), same = cnt(CU, r => r.R[k].t === TSAME(r.to, r.from));
    const ex = B7.find(r => r.R[k].t !== T119H(r.to, r.from)) || CU.find(r => r.R[k].t !== TSAME(r.to, r.from)) || B7[0];
    const exC = CU[0];
    P('    d193-k″ fixture bwsets ends ' + B7.length + ': OV1 at RPE 7 ' + b7 + ', hold toast ' + hold + ' | fixture cue ends ' + CU.length + ': OV1 cued ' + cu + ', "Same job, same numbers." ' + same + (ex ? '\n      e.g. ' + exP(ex, k) : '') + (exC ? '\n      e.g. cue end ' + exP(exC, k) : ''));
    const bh = cnt(B7, r => r.R['B:OV1'].t.endsWith(HOLD)), okB = bh === W.kpp.v229hold;
    RES['d193-k″'] = [pairsOK && okB && B7.length + CU.length === PE.length && B7.length === W.kpp.hold && b7 === W.kpp.hold && hold === W.kpp.hold && CU.length === W.kpp.same && cu === W.kpp.same && same === W.kpp.same,
      'hold toast on the bwsets ends ' + hold + '/' + B7.length + ' (at RPE 7 ' + b7 + '), "Same job, same numbers." on the cue ends ' + same + '/' + CU.length + ' (cued ' + cu + ')' + (okB ? '' : '; BASELINE not as ruled: V229 OV1 hold toasts ' + bh)]; }
  // (e′) single-hop pairs, a native above RPE 7 onto a capped target
  { const one = k => ({ hi:cnt(PE2, r => above7(r.R[k].o)), bhi:cnt(PE2, r => r.R[k].bn === clean(r.to) && above7(r.R[k].b)), lb:cnt(PE2, r => lb(r, k)), hold:cnt(PE2, r => r.R[k].t.endsWith(HOLD)), st:cnt(PE2, r => !!r.R[k].st) });
    const n5 = cnt(PE2, r => r.w >= 5 && !!r.R['C:OV5']); const a = one('C:OV1'), b = n5 === PE2.length ? one('C:OV5') : null;
    const eq1 = cnt(PE2, r => sameP(r.R['C:OV1'], r.R['C:CFG1'])), eq5 = n5 === PE2.length ? cnt(PE2, r => sameP(r.R['C:OV5'], r.R['C:CFG'])) : 0;
    const ex = PE2.find(r => above7(r.R['C:OV1'].o)) || PE2.find(r => !sameP(r.R['C:OV1'], r.R['C:CFG1'])) || PE2[0];
    P('    d193-e′ pairs ' + PE2.length + ' (W5 on ' + n5 + ') | OV1 live above 7 ' + a.hi + ', boot above 7 ' + a.bhi + ', live == boot ' + a.lb + ', hold toasts ' + a.hold + ', stamped ' + a.st + ', == CFG1 ' + eq1
      + (b ? ' | OV5 live above 7 ' + b.hi + ', boot above 7 ' + b.bhi + ', live == boot ' + b.lb + ', hold toasts ' + b.hold + ', stamped ' + b.st + ', == CFG ' + eq5 : ' | OV5 missing') + (ex ? '\n      e.g. ' + exP(ex, 'C:OV1') : ''));
    const bhi = cnt(PE2, r => above7(r.R['B:OV1'].o)), okB = bhi === W.e2.v229;
    const n = PE2.length, good = x => !!x && x.hi === 0 && x.bhi === 0 && x.lb === n && x.hold === n && x.st === n;
    RES['d193-e′'] = [pairsOK && okB && n === W.e2.n && n5 === n && good(a) && good(b) && eq1 === n && eq5 === n,
      'pairs ' + n + ', OV1 live above 7 ' + a.hi + ' (V229 ' + W.e2.v229 + '), boot above 7 ' + a.bhi + ', hold toasts ' + a.hold + ', == CFG1 ' + eq1 + (b ? '; OV5 live above 7 ' + b.hi + ', boot above 7 ' + b.bhi + ', hold toasts ' + b.hold + ', == CFG ' + eq5 : '; OV5 missing') + (okB ? '' : '; BASELINE not as ruled: V229 OV1 live above 7 ' + bhi)]; }
  // (k) toast truth on the overlay shape (STAMP), the hand oracle; STAMP == CFG; non-clamp toasts == V229's
  { const s = L.CSTAMP, f = L.CCFG; const kv = s.hvK;
    P('    d193-k candidate STAMP: pairs ' + s.pairs + ' | clamp pairs ' + s.clamp + ' | hold variants ' + s.hv + ' (verbatim ' + kv.verbatim + ', unloadable ' + kv.unloadable + ', window ' + kv.window + '; clamp pairs without it ' + s.hvMiss + ') | false claims ' + s.fals + ' | hold toasts off the clamp set ' + s.holdOff + ' | INFO capped ' + s.info
      + ' || candidate CFG: hold variants ' + f.hv + ', false ' + f.fals + ', INFO ' + f.info + ' || V229 STAMP: hold variants ' + L.BSTAMP.hv + ', false ' + L.BSTAMP.fals + ', INFO ' + L.BSTAMP.info);
    P('    d193-k STAMP == CFG (candidate): aligned ' + X.sc.align + ', card differs ' + X.sc.card + ', toast differs ' + X.sc.toast + ' of ' + X.sc.n + ' | non-clamp toasts == V229 STAMP ' + X.nc.eq + '/' + X.nc.n + exs('CSTAMP:hv', 'CSTAMP:off', 'sccard', 'sctoast', 'nc'));
    const bS = L.BSTAMP, okB = bS.hv === W.L1.v229.hv && bS.fals === W.L1.v229.fals && bS.info === W.L1.v229.info;
    RES['d193-k'] = [l1OK && okB && !crash.length && cfgs === W.L1.cfgs && s.pairs === W.L1.pairs && s.thr === 0 && s.clamp === W.L1.clamp && s.hv === W.L1.hv && kv.verbatim === W.L1.hvK.verbatim && kv.unloadable === W.L1.hvK.unloadable && kv.window === W.L1.hvK.window
      && s.fals === 0 && s.holdOff === 0 && s.info === W.L1.info && X.sc.align && X.sc.n === W.L1.pairs && X.sc.card === 0 && X.sc.toast === 0 && X.nc.n === W.L1.nonClamp && X.nc.eq === X.nc.n,
      'clamp pairs ' + s.clamp + ', hold variants ' + s.hv + ' (verbatim ' + kv.verbatim + ', unloadable ' + kv.unloadable + ', window ' + kv.window + '), false claims ' + s.fals + ', hold toasts off the clamp set ' + s.holdOff + ', INFO capped ' + s.info + ', STAMP vs CFG card ' + X.sc.card + ' toast ' + X.sc.toast + ', non-clamp == V229 ' + X.nc.eq + '/' + X.nc.n + (okB ? '' : '; BASELINE not as ruled: V229 STAMP hold variants ' + bS.hv + ', false ' + bS.fals + ', INFO ' + bS.info)]; }
  // (l) D177's verbatim rows beneath the plan's hold, on STAMP, == CFG
  { const s = L.CSTAMP, f = L.CCFG; const ln = x => 'G3a ' + x.G3a + ' (' + x.G3aCls.donor + ' / ' + x.G3aCls.window + ' / ' + x.G3aCls.verbatim + ', miss ' + x.G3aMiss + '), G3c power ' + x.powChg + ' of ' + x.pow + ', G3c-off ' + x.off + ' of ' + x.offN + ' (miss ' + x.offMiss + '), G3d ' + x.at + ' of ' + x.atN + ' (miss ' + x.atMiss + '), G3e ' + x.nul + ' of ' + x.nulN + ' (miss ' + x.nulMiss + '), G3f ' + x.win + ' of ' + x.winN + ' (miss ' + x.winMiss + ')';
    const keys = ['main', 'G3a', 'G3aMiss', 'pow', 'powChg', 'offN', 'off', 'offMiss', 'nulN', 'nul', 'nulMiss', 'atN', 'at', 'atMiss', 'winN', 'win', 'winMiss'];
    const eqCFG = keys.every(k => s[k] === f[k]) && ['donor', 'window', 'verbatim'].every(k => s.G3aCls[k] === f.G3aCls[k]);
    P('    d193-l candidate STAMP: ' + ln(s) + '\n    d193-l candidate CFG:   ' + ln(f) + '\n    d193-l V229 STAMP:      ' + ln(L.BSTAMP) + exs('CSTAMP:A', 'CSTAMP:off', 'CSTAMP:null', 'CSTAMP:at', 'CSTAMP:win'));
    const bS = L.BSTAMP, okB = bS.G3a === W.l.v229.G3a && bS.off === W.l.v229.off && bS.at === W.l.v229.at && bS.nul === W.l.v229.nul && bS.win === W.l.v229.win;
    RES['d193-l'] = [l1OK && okB && !crash.length && cfgs === W.L1.cfgs && eqCFG && s.G3a === W.l.G3a && s.G3aCls.donor === W.l.G3aCls.donor && s.G3aCls.window === W.l.G3aCls.window && s.G3aCls.verbatim === W.l.G3aCls.verbatim
      && s.pow > 0 && s.powChg === W.l.pow && s.offN > 0 && s.off === W.l.off && s.atN > 0 && s.at === W.l.at && s.nulN > 0 && s.nul === W.l.nul && s.winN > 0 && s.win === W.l.win
      && s.G3aMiss === 0 && s.offMiss === 0 && s.atMiss === 0 && s.nulMiss === 0 && s.winMiss === 0,
      ln(s) + (eqCFG ? ', == CFG' : ', != CFG (' + ln(f) + ')') + (okB ? '' : '; BASELINE not as ruled: V229 STAMP ' + ln(bS))]; }

  // print rows in order: instruments, then figures (unread when an instrument failed)
  INST.forEach(k => { const r = RES[k] || [false, 'row not computed']; ok(R[k], r[0], r[1]); });
  FIG.forEach(k => { if(!INSTR_OK){ ok(R[k] + ' (not read: instrument ' + INST.filter(i => !(RES[i] && RES[i][0])).join(', ') + ' failed)', false); return; }
    const r = RES[k] || [false, 'row not computed']; ok(R[k], r[0], r[1]); });
  done();
}).catch(e => { P('  MERGE CRASH ' + String(e && e.stack || e).slice(0, 600)); ORDER.forEach(k => ok(R[k] + ' (merge crashed)', false)); done(); });
}

if(IS_WORKER){ try { workerMain(); } catch(e){ process.stdout.write(MARK + JSON.stringify({ ok:false, err:String(e && e.stack || e).slice(0, 600) }) + '\n'); } }
else parentMain();
'''
got = hashlib.sha256(CONTENT.encode('utf-8')).hexdigest()
assert got == EXPECT_SHA256, 'embedded gate text did not round-trip: ' + got
if P.exists():
    have = hashlib.sha256(P.read_bytes()).hexdigest()
    if have == EXPECT_SHA256:
        print('already written: ' + str(P) + ' is byte-identical to this record (sha256 ' + got[:12] + ')'); sys.exit(0)
    sys.exit('REFUSED: ' + str(P) + ' exists and differs from this record (sha256 ' + have[:12] + ' vs ' + got[:12] + '); this script never overwrites')
with open(P, 'x', encoding='utf-8', newline='\n') as fh:
    fh.write(CONTENT)
print('wrote ' + str(P) + ' (' + str(len(CONTENT.encode("utf-8"))) + ' bytes, sha256 ' + got[:12] + ')')
