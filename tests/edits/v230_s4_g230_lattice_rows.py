#!/usr/bin/env python3
# v230_s4_g230_lattice_rows.py — V230 slice 4 (no index.html edit). Extends tests/gates/g230_d194_lens2.js (slice 3's text,
# sha256 faf6501f27fb…) with the D190-lattice rows, the equivalence row and the typed hand routes of D194 P-INJLENS part 2:
#   step 1  the lattice: measure's enumerator (tests/measure/v228_caprpe_carry.js PART enum) as job kind `enum` on the
#           baseline fixture, the drivers lifted from tests/measure/v230_lens_cf6.js (hop, undoLast, bootFrom; bootFrom
#           re-added), job kind `lat` (S mode), the dynamic pool that queues each config's shards when its enumeration
#           lands, and row d193-i;
#   step 2  R and U modes in `lat`, rows d193-i-r and d193-i-u;
#   step 3  row d194-eq (the equivalence row) from the S-mode comparisons;
#   step 4  job kind `hand`, the typed table HANDQ and row d194-q′ ((q) re-keyed: delivery on typed hand routes).
# Each step was run on the candidate before the next (PASS 10/0, 12/0, 13/0, 14/0). The header's ROWS and RUNTIME blocks
# describe the new rows. Ruling: tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 R3′; row definitions
# tests/measure/v228_rulings/d193_caprpe_ruling.md (Amendments 2 to 4); session form calls
# tests/measure/v230_rulings/v230_session_calls.md items 2 and 3; figures measure_lens_overlay_cf6_m12.md (M12) [3], [4], [6].
# One rewrite: the gate's new text is embedded whole and checked against its sha256 before any write. The script writes
# only over slice 3's exact text (BEFORE_SHA256); on the new text it reports byte-identity; on anything else it refuses.
import hashlib, pathlib, sys
P = pathlib.Path(__file__).resolve().parents[1] / 'gates' / 'g230_d194_lens2.js'
BEFORE_SHA256 = 'faf6501f27fb239b5513ade2f647036bae040d26d3865b75b8f403ebf56916fd'
EXPECT_SHA256 = 'd49fc6528244763a403d87db0430c7d03bf2ca016e208daf6937926d5eb7f1aa'
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
//   THE D190 CHAIN LATTICE (rows d193-i, d193-i-r, d193-i-u, d194-eq). Measure's enumerator (tests/measure/
//               v228_caprpe_carry.js PART enum), run here on the BASELINE tree's fixture (CFG): the 7 L9 configs, weeks 3,
//               5 and 7, every day, every swappable slot; a one-slot chain is kept when D193's clamp fires on hop 1 (every
//               two-hop chain, and every third hop off it) or on hop 2 (every third hop off it). The engine's _pattern,
//               _swapDetailFor and _capRpeClamp only select the population (the classifier is not under test). Expected
//               size 18,580 (W5 13,323, W3 5,257; elbow_wa 8,369, shoulder_wa 3,708, lowback_wa 3,531, hip_wa 1,405,
//               knee_protect 1,232, mario 320, ankle_wa 15); every lattice row asserts the size. Drivers lifted from
//               tests/measure/v230_lens_cf6.js (hop, undoLast, bootFrom; one chain per day per batch, each batch a fresh
//               setup of the stored record, every boot a VM loaded with the storage the act left). Modes: S the straight
//               chain (every hop, then boot, undo of the last hop by its chip, undo+boot); R a reboot before the last hop
//               (every hop but the last, boot, the last hop on the booted page, boot again); U, on the three-hop chains
//               whose hop 1 fires (11,096), undo onto the held intermediate then one more hop (hop 1, hop 2, undo of hop 2
//               by its chip, hop 3, boot; and the direct one-hop swap to the same end on a fresh setup). Day JSON is
//               compared with the stamp (`_ovKey`) and clock fields removed.
//   d193-i      S mode. On OV1 (all weeks): 18,580 chains, live != boot 487 and the same chain ids as CFG1 (0 on one side
//               only); chains keeping _preHold at any hop 18,580 (V229 0); ph in the record 35,949 (V229 0); hold toasts
//               39,203 (V229 0); booted slot carries _preHold 18,580 (V229 0); live end on a capped pattern (the baseline's
//               _pattern, the hand CAP table) above RPE 7 0 (V229 12,518). On OV5, W5: residue 330 (same ids as CFG),
//               capped above 7 0 (V229 8,489). The baseline must read V229 OV1 kept 0, ph 0, hold toasts 0, booted
//               _preHold 0, capped above 7 12,518 in the same run (on OV1, as d193-e reads its baseline; the baseline's OV5
//               runs only the unspliced W3 chains d194-eq compares).
//   d193-i-r    R mode. On OV1: live == boot == the S-mode in-session end 18,093 of 18,580 (live == boot 18,093); the
//               rebooted slot carries the kept dose 18,580 (V229 0); OV1 == CFG1 on the rebooted slot (with _preHold), the
//               last hop's live card, the boot and every toast, 0 of 18,580 differ. On OV5, W5: 12,993 of 13,323, kept dose
//               13,323 (V229 0). The baseline must read V229 OV1 kept dose 0 in the same run.
//   d193-i-u    U mode, 11,096 chains. On OV1: live == boot 11,096; the undo lands on hop 1's card on every chain; the undone
//               card carries the kept dose 11,096 (V229 0); OV1 == CFG1 on the undone card (with _preHold), live, boot,
//               the direct swap and every toast, 0 of 11,096 differ; live == direct prints (5,228) and its complement is
//               D193 Amendment 4's INFO, V222 note (3) (a rep target lost through an unloadable middle hop), pinned at
//               5,868 and never read as a defect of the hold. On OV5, W5: 8,269 chains, live == boot 8,269, kept dose
//               8,269 (live == direct prints). The baseline must read V229 OV1 kept dose 0 in the same run.
//   d194-eq     the equivalence row (R3′), S mode. OV1 vs CFG1, all weeks: 0 of 18,580 chains differ on the start card, the
//               live card and its _preHold, every toast, the boot card and its _preHold, the undo (with its chip) and its
//               _preHold, undo+boot and its _preHold, ph, and the whole day (stamp and clock fields removed) live, at boot,
//               after undo and at undo+boot. Per config printed (elbow_wa 8,369, shoulder_wa 3,708, lowback_wa 3,531,
//               hip_wa 1,405, knee_protect 1,232, mario 320, ankle_wa 15), the total asserted; every OV1 chain is on a
//               stamped day. OV5 vs CFG on W5 (every chain stamped): 0 of 13,323. OV5 on the unspliced W3 (no chain
//               stamped): candidate == V229, 0 of 5,257 move. The baseline must read V229 OV1 vs CFG1 18,580 of 18,580
//               differ (live 12,518, boot 12,518, undo 15,589, undo+boot 15,053, toasts 18,580, _preHold 18,580, ph
//               18,580) in the same run; V229 OV5 vs CFG on W5, 13,323 of 13,323, is the discrimination figure.
//   d194-q′     (q) re-keyed (session call 3): delivery on typed hand routes; every expected string is typed in HANDQ
//               below (M12 [6], and where M12 printed a fragment, the V229 fixture CFG read once and typed), never read
//               from a tree. mario (knee/workaround) W5 Thursday, Leg superset B slot [3,1], Single-leg hip thrust
//               "2×6–10 @ RPE 8": U0 (three hops, boot, undo, undo+boot), U1 (one hop, undo, the day identical to the
//               untouched day, undo+boot), U2 (hop, hop, undo onto the held Leg extension, hop, boot, direct), RB (two
//               hops, reboot, hop, boot, direct, undo, undo+boot); knee/workaround strength beginner commercial (the L1
//               config) W6 Thursday `Main — Barbell box squat` (R7's held test) onto Leg press (capped: R7's text, the
//               hold toast, kept dose TEST9) and onto Barbell Romanian deadlift (uncapped: TEST9, "Same job, same
//               numbers."), each with boot and undo. Asserted on OV5 (the day stamped) and on the fixture CFG (the same
//               table, no stamp). The baseline must read V229 on OV5 in the same run: every mario card "2×6–10 @ RPE 8"
//               with no kept dose, no ph in the record and no hold toast; Leg press TEST9 with "Same job, same numbers.".
//
// RUNTIME. Jobs run in a pool of 4 worker processes (fixed; no environment knob): the 7 lattice enumerations first,
//   then the 7 L9 pair configs and 8 shards of the L1 sweep; each enumeration, when it lands, queues its config's
//   lattice in shards of at most 300 batches (whole batches, one chain per day per batch), ahead of the jobs not yet
//   started. The lattice's cost is the boots (every setup and every boot is a refreshProgram), so it scales with the
//   batch count, not the chain count. Each prints one result line on stdout and writes no file. A worker that dies
//   fails the rows it owed, by name.
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
  // the D190 lattice (M12 [3] and [4])
  lat:{ n:18580, w5:13323, w3:5257, per:{ elbow_wa:8369, shoulder_wa:3708, lowback_wa:3531, hip_wa:1405, knee_protect:1232, mario:320, ankle_wa:15 } },
  i:{ resid:487, kept:18580, ph:35949, hold:39203, bh:18580, hi:0, w5resid:330, w5hi:0, v229:{ kept:0, ph:0, hold:0, bh:0, hi:12518 } },
  ir:{ tri:18093, w5tri:12993, v229:{ kept:0 } },
  eq:{ v229:{ all:18580, live:12518, boot:12518, undo:15589, undoBoot:15053, toasts:18580, live_preHold:18580, ph:18580 } },
  iu:{ n:11096, info:5868, w5n:8269, v229:{ kept:0 } },
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
// ── THE D190 CHAIN LATTICE ───────────────────────────────────────────────────────────────────────────────────────
const crypto = require('crypto');
const LAT_WEEKS = [3, 5, 7], LAT_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], LAT_SHARD = 300;
const CANSWAP = "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};";
// enum: one L9 config's chains, measure's enumerator verbatim (v228_caprpe_carry.js PART enum) on the baseline fixture
function jobEnum(spec){
  const ck = spec.ck, cfg = CFGS[ck], cap = capOf(cfg); const X = fresh(spec.base, PRES.CFG.clock); E(X, CANSWAP); setup(X, stored(X, cfg, 'CFG'));
  const fires = (to, prev) => { if(!cap.includes(E(X, '_pattern(' + JSON.stringify(to) + ')') || '-')) return false; X.ctx.__p = prev; X.ctx.__to = to; const pre = E(X, '_swapDetailFor(__to,_stripCapCue(__p))'); return /RPE/.test(pre || '') && E(X, '_capRpeClamp(' + JSON.stringify(pre) + ')') !== pre; };
  const cand = w => Array.from(E(X, '__cands(__D,' + w + ',__N)')); const can = (si, ii) => !!E(X, '__canSwap(__D,' + si + ',' + ii + ')');
  const chains = []; let id = 0;
  if(cap.length) for(const w of LAT_WEEKS) for(const d of LAT_DAYS){ const live = E(X, 'activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d); if(!live || !live.sections) continue; const bs = clone(live);
    bs.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.name) return; X.ctx.__D = bs; if(!can(si, ii)) return; X.ctx.__N = it.name; const dA = it.detail || '';
      for(const B of cand(w)){ const d1 = clone(bs); d1.sections[si].items[ii].name = B; X.ctx.__D = d1; if(!can(si, ii)) continue; X.ctx.__N = B; const f1 = fires(B, dA);
        X.ctx.__p = dA; X.ctx.__to = B; const dB = E(X, '(function(){var x=_swapDetailFor(__to,_stripCapCue(__p));var f=applyInjuryFilter([{label:"x",items:[{name:__to,detail:x}]}],activeProg.cfg);return f&&f[0]&&f[0].items[0]&&f[0].items[0].name===__to?f[0].items[0].detail:x;})()');
        for(const C of cand(w)){ const f2 = fires(C, dB); const cls = C === it.name ? 'cyc2' : 'hop2';
          if(f1) chains.push({ id:ck + '#' + id++, cls, fire:'h1', w, d, si, ii, hops:[B, C] });
          if(f1 || f2){ const d2 = clone(d1); d2.sections[si].items[ii].name = C; X.ctx.__D = d2; if(!can(si, ii)) continue; X.ctx.__N = C;
            for(const D of cand(w)) chains.push({ id:ck + '#' + id++, cls:'hop3', fire:(f1 ? 'h1' : '') + (f2 ? 'h2' : ''), w, d, si, ii, hops:[B, C, D] });
            X.ctx.__D = d1; X.ctx.__N = B; } } } })); }
  return { ck, chains };
}
// drivers, lifted from tests/measure/v230_lens_cf6.js
function bootFrom(src, dst){ const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function hop(IA, c, to){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); IA.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:cur.n, detail:cur.d }; IA.ctx.__to = to; E(IA, '__T.length=0;'); let bad = 0;
  try { E(IA, '_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ bad = 1; } const after = slotOf(IA, c.w, c.d, c.si, c.ii); if(clean(after.n) !== clean(to)) bad = 1; return { d:after.d, n:after.n, h:after.h, t:Array.from(E(IA, '__T')).join(' / '), bad }; }
function undoLast(IA, c){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); const chip = E(IA, 'swapOriginOf(' + JSON.stringify(cur.n) + ')') || ''; let err = null;
  if(chip){ try { E(IA, 'undoSwap(' + JSON.stringify(chip) + ');'); } catch(e){ err = String(e && e.message || e).slice(0, 80); } } return { chip, err, slot:slotOf(IA, c.w, c.d, c.si, c.ii) }; }
const dayH = (IA, w, d) => { const s = dayJ(IA, w, d); const o = typeof s === 'string' ? JSON.parse(s) : null; if(o && typeof o === 'object') delete o._ovKey; return crypto.createHash('sha1').update(String(J(o))).digest('hex').slice(0, 20); };
const sl3 = s => ({ n:s.n, d:s.d, h:s.h });
const batchesOf = chains => { const by = {}; chains.forEach(c => (by[c.w + c.d] = by[c.w + c.d] || []).push(c)); const lists = Object.values(by); const nB = Math.max(0, ...lists.map(l => l.length)); const out = [];
  for(let b = 0; b < nB; b++) out.push(lists.map(l => l[b]).filter(Boolean)); return out; };
// S: the straight chain (measure's mode S)
function latS(file, pres, st, chains){ const A = fresh(file, PRES[pres].clock), B2 = fresh(file, PRES[pres].clock), B3 = fresh(file, PRES[pres].clock); const res = new Map();
  for(const batch of batchesOf(chains)){ setup(A, st); const r = {};
    batch.forEach(c => { r[c.id] = { id:c.id, w:c.w, d:c.d, hops:c.hops, st:!!stampOf(A, c.w, c.d), start:sl3(slotOf(A, c.w, c.d, c.si, c.ii)), toasts:[], kept:[], bad:0 }; });
    for(const c of batch){ const s = r[c.id]; for(const to of c.hops){ const h = hop(A, c, to); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; } s.live = sl3(slotOf(A, c.w, c.d, c.si, c.ii)); s.liveDay = dayH(A, c.w, c.d); }
    const rx = JSON.parse(E(A, "localStorage.getItem('ia_swaps_PM')") || '{}');
    batch.forEach(c => { r[c.id].ph = (rx['w' + c.w + '_' + c.d] || []).reduce((n, e) => n + ((e && e.rx) || []).filter(x => x && typeof x === 'object' && 'ph' in x).length, 0); });
    bootFrom(A, B2); for(const c of batch){ r[c.id].boot = sl3(slotOf(B2, c.w, c.d, c.si, c.ii)); r[c.id].bootDay = dayH(B2, c.w, c.d); }
    for(const c of batch){ const u = undoLast(A, c); r[c.id].chip = u.chip; r[c.id].undo = sl3(u.slot); r[c.id].undoDay = dayH(A, c.w, c.d); if(u.err) r[c.id].undoErr = u.err; }
    bootFrom(A, B3); for(const c of batch){ r[c.id].undoBoot = sl3(slotOf(B3, c.w, c.d, c.si, c.ii)); r[c.id].undoBootDay = dayH(B3, c.w, c.d); }
    batch.forEach(c => res.set(c.id, r[c.id])); }
  return res; }
// R: a reboot before the last hop (measure's mode R)
function latR(file, pres, st, chains){ const A = fresh(file, PRES[pres].clock), B2 = fresh(file, PRES[pres].clock), B3 = fresh(file, PRES[pres].clock); const res = new Map();
  for(const batch of batchesOf(chains)){ setup(A, st); const r = {};
    batch.forEach(c => { r[c.id] = { id:c.id, w:c.w, d:c.d, hops:c.hops, start:sl3(slotOf(A, c.w, c.d, c.si, c.ii)), toasts:[], kept:[], bad:0 }; });
    for(const c of batch){ const s = r[c.id]; for(const to of c.hops.slice(0, -1)){ const h = hop(A, c, to); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; } }
    bootFrom(A, B2); for(const c of batch){ const s = r[c.id]; s.afterReboot = sl3(slotOf(B2, c.w, c.d, c.si, c.ii)); const h = hop(B2, c, c.hops[c.hops.length - 1]); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; s.live = sl3(slotOf(B2, c.w, c.d, c.si, c.ii)); }
    bootFrom(B2, B3); for(const c of batch) r[c.id].boot = sl3(slotOf(B3, c.w, c.d, c.si, c.ii));
    batch.forEach(c => res.set(c.id, r[c.id])); }
  return res; }
// U: undo onto a held intermediate then one more hop (measure's mode U), on the three-hop chains whose hop 1 fires
const isU = c => c.cls === 'hop3' && /h1/.test(c.fire);
function latU(file, pres, st, chains){ const A = fresh(file, PRES[pres].clock), B2 = fresh(file, PRES[pres].clock), B3 = fresh(file, PRES[pres].clock); const res = new Map();
  for(const batch of batchesOf(chains)){ setup(A, st); const r = {};
    batch.forEach(c => { r[c.id] = { id:c.id, w:c.w, d:c.d, hops:c.hops, start:sl3(slotOf(A, c.w, c.d, c.si, c.ii)), toasts:[], kept:[], bad:0 }; });
    for(const c of batch){ const s = r[c.id]; const [Bn, Cn, Dn] = c.hops; for(const to of [Bn, Cn]){ const h = hop(A, c, to); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; }
      const u = undoLast(A, c); s.chip = u.chip; s.undone = sl3(u.slot); if(clean(u.slot.n) !== clean(Bn)) s.undoMiss = 1; if(u.err) s.undoErr = u.err;
      const h = hop(A, c, Dn); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; s.live = sl3(slotOf(A, c.w, c.d, c.si, c.ii)); }
    bootFrom(A, B2); for(const c of batch) r[c.id].boot = sl3(slotOf(B2, c.w, c.d, c.si, c.ii));
    setup(B3, st); for(const c of batch){ const h = hop(B3, c, c.hops[2]); r[c.id].direct = { n:h.n, d:h.d, t:h.t, bad:h.bad }; }
    batch.forEach(c => res.set(c.id, r[c.id])); }
  return res; }
// the presentations each mode runs: [tree, presentation, week filter]
const LAT_RUN = { S:[['C', 'OV1', 0], ['C', 'CFG1', 0], ['B', 'OV1', 0], ['C', 'OV5', 0], ['C', 'CFG', 5], ['B', 'OV5', 3]],
  R:[['C', 'OV1', 0], ['C', 'CFG1', 0], ['B', 'OV1', 0], ['C', 'OV5', 5]], U:[['C', 'OV1', 0], ['C', 'CFG1', 0], ['B', 'OV1', 0], ['C', 'OV5', 5]] };
const WKF = { all:null, W5:a => a.w === 5, W3:a => a.w === 3 };
const neS = (a, b) => !a || !b || a.d !== b.d || clean(a.n) !== clean(b.n);
const sEq = (a, b) => !!a && !!b && a.n === b.n && a.d === b.d, hEq = (a, b) => !!a && !!b && a.h === b.h;
const FIELDS = { start:(a, b) => sEq(a.start, b.start), live:(a, b) => sEq(a.live, b.live), live_preHold:(a, b) => hEq(a.live, b.live), toasts:(a, b) => JSON.stringify(a.toasts) === JSON.stringify(b.toasts),
  boot:(a, b) => sEq(a.boot, b.boot), boot_preHold:(a, b) => hEq(a.boot, b.boot), undo:(a, b) => sEq(a.undo, b.undo) && a.chip === b.chip, undo_preHold:(a, b) => hEq(a.undo, b.undo),
  undoBoot:(a, b) => sEq(a.undoBoot, b.undoBoot), undoBoot_preHold:(a, b) => hEq(a.undoBoot, b.undoBoot), ph:(a, b) => a.ph === b.ph,
  liveDay:(a, b) => a.liveDay === b.liveDay, bootDay:(a, b) => a.bootDay === b.bootDay, undoDay:(a, b) => a.undoDay === b.undoDay, undoBootDay:(a, b) => a.undoBootDay === b.undoBootDay };
const CORE = ['live', 'toasts', 'boot', 'undo', 'undoBoot'];
// the S comparisons: [A, B, week filter]
const LAT_CMP = { 'OV1~CFG1':['C:OV1', 'C:CFG1', 'all'], 'OV5~CFG:W5':['C:OV5', 'C:CFG', 'W5'], 'OV5~V229OV5:W3':['C:OV5', 'B:OV5', 'W3'], 'V229OV1~CFG1':['B:OV1', 'C:CFG1', 'all'] };
// lat: one shard of one config's lattice, every presentation of every mode, compared in the worker (aggregates only)
function jobLat(spec){
  const ck = spec.ck, cfg = CFGS[ck], cap = capOf(cfg), files = { C:spec.art, B:spec.base }, chains = spec.chains;
  const Q = fresh(spec.base, PRES.CFG.clock); const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = E(Q, '_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const ST = {}; const stOf = (t, p) => ST[t + p] || (ST[t + p] = stored(fresh(files[t], PRES[p].clock), cfg, p));
  const sub = wk => wk ? chains.filter(c => c.w === wk) : chains;
  const out = { ck, n:chains.length, w5:chains.filter(c => c.w === 5).length, w3:chains.filter(c => c.w === 3).length, S:{}, res:{}, cmp:{}, R:{}, U:{}, req:{}, ueq:{} };
  const tag = (a, k) => a.id + ' W' + a.w + ' ' + a.d + ' ' + clean(a.start && a.start.n) + ' > ' + a.hops.join(' > ') + (k ? ' [' + k + ']' : '');
  // S
  const SM = {}; for(const [t, p, wk] of LAT_RUN.S) SM[t + ':' + p] = latS(files[t], p, stOf(t, p), sub(wk));
  const statS = (M, f) => { const o = { n:0, lb:0, kept:0, ph:0, hold:0, bh:0, hi:0, st:0, bad:0, uerr:0 };
    for(const a of M.values()){ if(f && !f(a)) continue; o.n++; if(neS(a.live, a.boot)) o.lb++; if(a.kept.some(h => h !== null)) o.kept++; o.ph += a.ph; o.hold += a.toasts.filter(t => t.endsWith(HOLD)).length;
      if(a.boot.h !== null) o.bh++; if(cap.includes(pat(a.live.n)) && above7(a.live.d)) o.hi++; if(a.st) o.st++; if(a.bad) o.bad++; if(a.undoErr) o.uerr++; } return o; };
  Object.keys(SM).forEach(K => { out.S[K] = {}; Object.keys(WKF).forEach(w => { out.S[K][w] = statS(SM[K], WKF[w]); }); });
  const resid = (MA, MB, f) => { const A = new Set(), B = new Set(); for(const a of MA.values()) if((!f || f(a)) && neS(a.live, a.boot)) A.add(a.id); for(const b of MB.values()) if((!f || f(b)) && neS(b.live, b.boot)) B.add(b.id);
    const both = [...A].filter(x => B.has(x)).length; return { both, a:A.size - both, b:B.size - both }; };
  out.res['OV1~CFG1'] = resid(SM['C:OV1'], SM['C:CFG1'], null); out.res['OV5~CFG:W5'] = resid(SM['C:OV5'], SM['C:CFG'], WKF.W5);
  const cmpS = (MA, MB, f) => { const o = { N:0, miss:0, core:0, all:0, by:{}, ex:{} };
    for(const a of MA.values()){ if(f && !f(a)) continue; const b = MB.get(a.id); if(!b){ o.miss++; continue; } o.N++; let c = false, al = false;
      for(const [k, fn] of Object.entries(FIELDS)) if(!fn(a, b)){ o.by[k] = (o.by[k] || 0) + 1; al = true; if(CORE.includes(k)) c = true;
        if(!o.ex[k]){ const v = r => k === 'toasts' ? JSON.stringify(r.toasts) : /Day$/.test(k) ? '(day json sha ' + r[k] + ')' : k === 'ph' ? r.ph : JSON.stringify(r[k.replace(/_preHold$/, '')]) + (k === 'undo' ? ' chip ' + JSON.stringify(r.chip) : ''); o.ex[k] = tag(a, k) + ' :: ' + String(v(a)).slice(0, 220) + ' | vs ' + String(v(b)).slice(0, 220); } }
      if(c) o.core++; if(al) o.all++; } return o; };
  Object.keys(LAT_CMP).forEach(n => { const [ka, kb, w] = LAT_CMP[n]; out.cmp[n] = cmpS(SM[ka], SM[kb], WKF[w]); });
  // R
  const RM = {}; for(const [t, p, wk] of LAT_RUN.R) RM[t + ':' + p] = latR(files[t], p, stOf(t, p), sub(wk));
  Object.keys(RM).forEach(K => { out.R[K] = {}; Object.keys(WKF).forEach(w => { const o = { n:0, tri:0, lb:0, kept:0, bad:0 }; const SK = SM[K];
    for(const a of RM[K].values()){ if(WKF[w] && !WKF[w](a)) continue; o.n++; const sl = SK && SK.get(a.id); if(a.bad) o.bad++; if(!neS(a.live, a.boot)){ o.lb++; if(sl && a.live.d === sl.live.d) o.tri++; } if(a.afterReboot && a.afterReboot.h !== null) o.kept++; }
    out.R[K][w] = o; }); });
  { const o = { N:0, miss:0, d:0, ex:'' }; for(const a of RM['C:OV1'].values()){ const b = RM['C:CFG1'].get(a.id); if(!b){ o.miss++; continue; } o.N++;
      if(!(sEq(a.afterReboot, b.afterReboot) && hEq(a.afterReboot, b.afterReboot) && sEq(a.live, b.live) && sEq(a.boot, b.boot) && JSON.stringify(a.toasts) === JSON.stringify(b.toasts))){ o.d++; if(!o.ex) o.ex = tag(a) + ' :: OV1 ' + JSON.stringify([a.afterReboot, a.live, a.boot]).slice(0, 300) + ' | CFG1 ' + JSON.stringify([b.afterReboot, b.live, b.boot]).slice(0, 300); } }
    out.req = o; }
  // U
  const UM = {}; for(const [t, p, wk] of LAT_RUN.U) UM[t + ':' + p] = latU(files[t], p, stOf(t, p), sub(wk).filter(isU));
  Object.keys(UM).forEach(K => { out.U[K] = {}; Object.keys(WKF).forEach(w => { const o = { n:0, lb:0, ld:0, kept:0, miss:0, bad:0, uerr:0 };
    for(const a of UM[K].values()){ if(WKF[w] && !WKF[w](a)) continue; o.n++; if(!neS(a.live, a.boot)) o.lb++; if(a.live.d === a.direct.d && clean(a.live.n) === clean(a.direct.n)) o.ld++; if(a.undone.h !== null) o.kept++; if(a.undoMiss) o.miss++; if(a.bad || a.direct.bad) o.bad++; if(a.undoErr) o.uerr++; }
    out.U[K][w] = o; }); });
  { const o = { N:0, miss:0, d:0, ex:'' }; for(const a of UM['C:OV1'].values()){ const b = UM['C:CFG1'].get(a.id); if(!b){ o.miss++; continue; } o.N++;
      if(!(sEq(a.undone, b.undone) && hEq(a.undone, b.undone) && sEq(a.live, b.live) && sEq(a.boot, b.boot) && sEq(a.direct, b.direct) && JSON.stringify(a.toasts) === JSON.stringify(b.toasts))){ o.d++; if(!o.ex) o.ex = tag(a) + ' :: OV1 ' + JSON.stringify([a.undone, a.live, a.boot, a.direct]).slice(0, 300) + ' | CFG1 ' + JSON.stringify([b.undone, b.live, b.boot, b.direct]).slice(0, 300); } }
    out.ueq = o; }
  return out;
}
// ── d194-q′: THE TYPED HAND ROUTES ──
const D8 = '2×6–10 @ RPE 8', D7 = '2×6–10 @ RPE 7';
const HANDQ = { mario:{ at:[[3, 1]], native:{ n:'Single-leg hip thrust', d:D8, h:null },
    U0:{ hops:[{ n:'Barbell hip thrust', d:D8, h:D8, t:'Barbell hip thrust in, single-leg hip thrust out. Same job, same numbers.' },
        { n:'Leg extension', d:D7, h:D8, t:'Leg extension in, barbell hip thrust out. Same sets, same reps. Your injury plan holds this one at RPE 7.' },
        { n:'Barbell good mornings', d:D8, h:D8, t:'Barbell good mornings in, leg extension out. Same job, same numbers.' }],
      rec:'Single-leg hip thrust>Barbell hip thrust ph=- | Barbell hip thrust>Leg extension ph="2×6–10 @ RPE 8" | Leg extension>Barbell good mornings ph="2×6–10 @ RPE 8"',
      boot:{ n:'Barbell good mornings', d:D8, h:D8 }, chip:'Leg extension', undo:{ n:'Leg extension', d:D7, h:D8 }, undoBoot:{ n:'Leg extension', d:D7, h:D8 } },
    U1:{ hop:{ n:'Barbell hip thrust', d:D8, h:D8, t:'Barbell hip thrust in, single-leg hip thrust out. Same job, same numbers.' }, chip:'Single-leg hip thrust',
      undo:{ n:'Single-leg hip thrust', d:D8, h:null }, same:true, undoBoot:{ n:'Single-leg hip thrust', d:D8, h:null } },
    U2:{ h1:{ n:'Leg extension', d:D7, h:D8, t:'Leg extension in, single-leg hip thrust out. Same sets, same reps. Your injury plan holds this one at RPE 7.' },
      h2:{ n:'Barbell good mornings', d:D8, h:D8, t:'Barbell good mornings in, leg extension out. Same job, same numbers.' },
      rec:'Single-leg hip thrust>Leg extension ph=- | Leg extension>Barbell good mornings ph="2×6–10 @ RPE 8"', chip:'Leg extension', undo:{ n:'Leg extension', d:D7, h:D8 },
      h3:{ n:'Barbell hip thrust', d:D8, h:D8, t:'Barbell hip thrust in, leg extension out. Same job, same numbers.' }, boot:{ n:'Barbell hip thrust', d:D8, h:D8 },
      direct:{ n:'Barbell hip thrust', d:D8, h:D8, t:'Barbell hip thrust in, single-leg hip thrust out. Same job, same numbers.' } },
    RB:{ h1:{ n:'Barbell hip thrust', d:D8, h:D8, t:'Barbell hip thrust in, single-leg hip thrust out. Same job, same numbers.' },
      h2:{ n:'Leg extension', d:D7, h:D8, t:'Leg extension in, barbell hip thrust out. Same sets, same reps. Your injury plan holds this one at RPE 7.' }, reboot:{ n:'Leg extension', d:D7, h:D8 },
      h3:{ n:'Barbell good mornings', d:D8, h:D8, t:'Barbell good mornings in, leg extension out. Same job, same numbers.' }, boot:{ n:'Barbell good mornings', d:D8, h:D8 },
      direct:{ n:'Barbell good mornings', d:D8, h:D8, t:'Barbell good mornings in, single-leg hip thrust out. Same job, same numbers.' }, chip:'Leg extension',
      undo:{ n:'Leg extension', d:D7, h:D8 }, undoBoot:{ n:'Leg extension', d:D7, h:D8 } } },
  r7:{ at:[[0, 0, 'Main — Barbell box squat']], native:{ n:'Barbell box squat', d:R7T, h:null },
    lp:{ hop:{ n:'Leg press', d:R7T, h:TEST9, t:'Leg press in, barbell box squat out. Same sets, same reps. Your injury plan holds this one at RPE 7.' }, boot:{ n:'Leg press', d:R7T, h:TEST9 },
      chip:'Barbell box squat', undo:{ n:'Barbell box squat', d:R7T, h:null } },
    rdl:{ hop:{ n:'Barbell Romanian deadlift', d:TEST9, h:TEST9, t:'Barbell Romanian deadlift in, barbell box squat out. Same job, same numbers.' }, boot:{ n:'Barbell Romanian deadlift', d:TEST9, h:TEST9 },
      chip:'Barbell box squat', undo:{ n:'Barbell box squat', d:R7T, h:null } } } };
// the V229 figure on OV5 (the baseline): every mario card the native dose, no kept dose, no ph, no hold toast; Leg press prints TEST9
const HANDQ_V229 = { d:D8, lp:{ d:TEST9, t:'Leg press in, barbell box squat out. Same job, same numbers.' } };
const R7CFG = () => L1.find(c => c.injury && c.injury.region === 'knee' && c.injury.tier === 'workaround' && c.equipment === 'commercial' && c.liftingFocus === 'strength' && c.experience === 'beginner' && c.primaryPath === 'lift');
// hand: drive the routes on one tree and presentation (measure's PART hand drivers)
function jobHand(spec){ const file = spec.file, clk = PRES[spec.pres].clock, out = { t:spec.t, pres:spec.pres };
  const hp = h => ({ n:clean(h.n), d:h.d, h:h.h, t:h.t, bad:h.bad }), sl = x => ({ n:clean(x.n), d:x.d, h:x.h });
  { const st = stored(fresh(file, clk), CFGS.mario, spec.pres); const nw = () => { const Y = fresh(file, clk); setup(Y, st); return Y; };
    const X = nw(); const day = JSON.parse(dayJ(X, 5, 'thu')); const at = []; day.sections.forEach((s, a) => (s.items || []).forEach((it, b) => { if(it && clean(it.name) === 'Single-leg hip thrust') at.push([a, b]); }));
    const M = out.mario = { at, stamp:stampOf(X, 5, 'thu') }; if(at.length !== 1) return out; const [si, ii] = at[0], c = { w:5, d:'thu', si, ii }; M.native = sl(slotOf(X, 5, 'thu', si, ii));
    const bootS = Y => { const B = fresh(file, clk); bootFrom(Y, B); return sl(slotOf(B, 5, 'thu', si, ii)); };
    const rec = Y => (JSON.parse(E(Y, "localStorage.getItem('ia_swaps_PM')") || '{}').w5_thu || []).map(e => e.from + '>' + e.to + ((e && e.rx) || []).map(x => ' ph=' + (x && typeof x === 'object' && 'ph' in x ? JSON.stringify(x.ph) : '-')).join('')).join(' | ');
    { const Y = nw(); M.U0 = { hops:['Barbell hip thrust', 'Leg extension', 'Barbell good mornings'].map(to => hp(hop(Y, c, to))) }; M.U0.rec = rec(Y); M.U0.boot = bootS(Y); const u = undoLast(Y, c); M.U0.chip = u.chip; M.U0.undo = sl(u.slot); M.U0.undoBoot = bootS(Y); }
    { const Y = nw(); const h = hp(hop(Y, c, 'Barbell hip thrust')); const pre = dayJ(nw(), 5, 'thu'); const u = undoLast(Y, c); M.U1 = { hop:h, chip:u.chip, undo:sl(u.slot), same:dayJ(Y, 5, 'thu') === pre, undoBoot:bootS(Y) }; }
    { const Y = nw(); const h1 = hp(hop(Y, c, 'Leg extension')), h2 = hp(hop(Y, c, 'Barbell good mornings')); const r = rec(Y); const u = undoLast(Y, c); const h3 = hp(hop(Y, c, 'Barbell hip thrust'));
      M.U2 = { h1, h2, rec:r, chip:u.chip, undo:sl(u.slot), h3, boot:bootS(Y), direct:hp(hop(nw(), c, 'Barbell hip thrust')) }; }
    { const Y = nw(); const h1 = hp(hop(Y, c, 'Barbell hip thrust')), h2 = hp(hop(Y, c, 'Leg extension')); const Z = fresh(file, clk); bootFrom(Y, Z); const rs = sl(slotOf(Z, 5, 'thu', si, ii)); const h3 = hp(hop(Z, c, 'Barbell good mornings')); const bt = bootS(Z);
      const dh = hp(hop(nw(), c, 'Barbell good mornings')); const u = undoLast(Z, c); M.RB = { h1, h2, reboot:rs, h3, boot:bt, direct:dh, chip:u.chip, undo:sl(u.slot), undoBoot:bootS(Z) }; } }
  { const cfg = R7CFG(); const K = out.r7 = { found:!!cfg }; if(!cfg) return out; const st = stored(fresh(file, clk), cfg, spec.pres); const X = fresh(file, clk); setup(X, st);
    const day = JSON.parse(dayJ(X, 6, 'thu') || 'null'); const at = []; ((day && day.sections) || []).forEach((s, a) => (s.items || []).forEach((it, b) => { if(it && clean(it.name) === 'Barbell box squat' && /^Main/.test(clean(s.label))) at.push([a, b, clean(s.label)]); }));
    K.at = at; K.stamp = stampOf(X, 6, 'thu'); if(at.length !== 1) return out; const c = { w:6, d:'thu', si:at[0][0], ii:at[0][1] }; K.native = sl(slotOf(X, 6, 'thu', c.si, c.ii));
    for(const [k, to] of [['lp', 'Leg press'], ['rdl', 'Barbell Romanian deadlift']]){ const Y = fresh(file, clk); setup(Y, st); const h = hp(hop(Y, c, to)); const B = fresh(file, clk); bootFrom(Y, B); const b = sl(slotOf(B, 6, 'thu', c.si, c.ii)); const u = undoLast(Y, c);
      K[k] = { hop:h, boot:b, chip:u.chip, undo:sl(u.slot) }; } }
  return out; }
// typed table vs the observed route: every leaf of the table, by path; a hop also must have taken (bad 0)
function handDiff(want, got, pfx, miss){ if(want === null || typeof want !== 'object'){ if(got !== want) miss.push(pfx + ' got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)); return miss; }
  if(got === null || typeof got !== 'object'){ miss.push(pfx + ' missing'); return miss; }
  if('t' in want && 'n' in want && got.bad !== 0) miss.push(pfx + '.bad got ' + got.bad);
  Object.keys(want).forEach(k => handDiff(want[k], got[k], pfx + '.' + k, miss)); return miss; }
// the parent splits one config's lattice into shards; a shard keeps whole batches (batch b goes to shard b mod k)
function latShards(chains){ const B = batchesOf(chains), k = Math.max(1, Math.ceil(B.length / LAT_SHARD)); const sh = Array.from({ length:k }, () => []);
  B.forEach((b, i) => { sh[i % k].push(...b); }); return sh.filter(s => s.length); }
const JOBK = { pairs:jobPairs, l1:jobL1, enum:jobEnum, lat:jobLat, hand:jobHand };
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
  'd193-i':     'row d193-i      D190 lattice (18,580 chains: W5 13,323, W3 5,257), S mode on OV1: live != boot 487 (same ids as CFG1), chains keeping _preHold 18,580 (V229 0), ph in record 35,949 (V229 0), hold toasts 39,203 (V229 0), booted slot carries _preHold 18,580 (V229 0), live end capped above RPE 7 0 (V229 12,518); OV5 W5 residue 330 (same ids as CFG), capped above 7 0 (V229 8,489)',
  'd193-i-r':   'row d193-i-r    D190 lattice, R mode (reboot before the last hop) on OV1: live == boot == in-session end 18,093 of 18,580; rebooted slot carries the kept dose 18,580 (V229 0); OV1 == CFG1 0 of 18,580 differ; OV5 W5 12,993 of 13,323, kept dose 13,323 (V229 0)',
  'd193-i-u':   'row d193-i-u    D190 lattice, U mode (undo onto a held intermediate, one more hop), 11,096 chains on OV1: live == boot 11,096; undone card carries the kept dose 11,096 (V229 0); OV1 == CFG1 0 of 11,096 differ; INFO V222 note (3) live != direct 5,868 (pinned); OV5 W5 8,269 chains, live == boot and kept dose 8,269',
  'd194-eq':    'row d194-eq     the equivalence row, S mode: OV1 == CFG1 on every field (live, _preHold, toasts, boot, undo with chip, undo+boot, ph, whole-day JSON live/boot/undo/undo+boot), 0 of 18,580 differ, every chain stamped; OV5 == CFG on W5 0 of 13,323; unspliced W3 on OV5 == V229 0 of 5,257 (V229 OV1: 18,580 of 18,580 differ)',
  'd194-q′':    'row d194-q′     (q) re-keyed: typed hand routes on OV5 and the fixture: mario W5 thu [3,1] U0/U1/U2/RB (Leg extension "2×6–10 @ RPE 7" with kept dose "2×6–10 @ RPE 8" and the hold toast, live, boot, undo, undo+boot, reboot, direct), knee/wa strength W6 thu Barbell box squat -> Leg press R7\'s held text + hold toast, -> Barbell Romanian deadlift TEST9 + "Same job, same numbers." (V229 OV5: "2×6–10 @ RPE 8", no kept dose, Leg press TEST9)',
};
const INST = ['inst-self', 'inst-stamp', 'inst-fix', 'inst-ov1'];
const FIG = ['d193-e', 'd193-k″', 'd193-e′', 'd193-k', 'd193-l', 'd193-i', 'd193-i-r', 'd193-i-u', 'd194-eq', 'd194-q′'];
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
const JOBS = CK7.map(ck => ({ kind:'enum', ck, base:BF })).concat([['C', 'OV5'], ['C', 'CFG'], ['B', 'OV5']].map(([t, p]) => ({ kind:'hand', t, pres:p, file:t === 'C' ? CF : BF })), CK7.map(ck => ({ kind:'pairs', ck, art:CF, base:BF })));
for(let s = 0; s < L1_SHARDS; s++) JOBS.push({ kind:'l1', shard:s, art:CF, base:BF, cis:L1.map((c, i) => i).filter(i => i % L1_SHARDS === s) });
const ENUM = {};   // ck -> the enumerated chains (an enum job that dies leaves its config absent, and every lattice row FAILS)
function runPool(jobs){ let i = 0, pend = jobs.filter(j => j.kind === 'enum').length, wake = []; const res = [];
  const landed = (j, r) => { if(j.kind !== 'enum') return; pend--; if(r && Array.isArray(r.chains)){ ENUM[j.ck] = r.chains;
      jobs.splice(i, 0, ...latShards(r.chains).map((ch, s) => ({ kind:'lat', ck:j.ck, shard:s, chains:ch, art:CF, base:BF }))); }
    const w = wake; wake = []; w.forEach(f => f()); };
  const one = k => new Promise(fin => { const j = jobs[k]; let out = '', err = '';
    const ch = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename, '--worker'], { stdio:['pipe', 'pipe', 'pipe'] });
    ch.stdout.setEncoding('utf8'); ch.stderr.setEncoding('utf8');   // a multi-byte character split across two chunks decodes whole
    ch.stdout.on('data', d => { out += d; }); ch.stderr.on('data', d => { err += d; }); ch.on('error', e => { err += String(e && e.message || e); });
    ch.on('close', code => { const line = out.split('\n').find(l => l.startsWith(MARK)); let r = null; try { r = line ? JSON.parse(line.slice(MARK.length)) : null; } catch(e){}
      if(!r || r.ok !== true) P('  worker ' + j.kind + ' ' + (j.ck || 'shard ' + j.shard) + ' unusable (exit ' + code + ')' + (r && r.err ? ': ' + r.err : '') + (err ? ' | stderr ' + err.slice(-500).trim() : ''));
      res[k] = r && r.ok === true ? r.r : null; landed(j, res[k]); fin(); });
    ch.stdin.end(JSON.stringify(j)); });
  const loop = async () => { for(;;){ if(i < jobs.length){ const k = i++; await one(k); continue; } if(pend <= 0) return; await new Promise(f => wake.push(f)); } };
  return Promise.all(Array.from({ length:POOL }, loop)).then(() => jobs.map((j, k) => res[k] === undefined ? null : res[k])); }
const tW = Date.now();
runPool(JOBS).then(res => {
  P('  jobs ' + res.filter(Boolean).length + '/' + JOBS.length + ' usable (' + ((Date.now() - tW) / 1000).toFixed(1) + ' s from spawn, pool ' + POOL + ')');
  const PJ = JOBS.map((j, i) => j.kind === 'pairs' ? res[i] : undefined).filter(x => x !== undefined), LJ = JOBS.map((j, i) => j.kind === 'l1' ? res[i] : undefined).filter(x => x !== undefined);
  const AJ = JOBS.map((j, i) => j.kind === 'lat' ? res[i] : undefined).filter(x => x !== undefined);
  const HJ = {}; JOBS.forEach((j, i) => { if(j.kind === 'hand') HJ[j.t + ':' + j.pres] = res[i]; });
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

  // ── THE D190 LATTICE ROWS ──
  // merge: numbers add, objects recurse, the first example string is kept
  const addInto = (d, s) => { Object.keys(s).forEach(k => { const v = s[k]; if(typeof v === 'number') d[k] = (d[k] || 0) + v; else if(v && typeof v === 'object') addInto(d[k] = d[k] || {}, v); else if(d[k] === undefined) d[k] = v; }); return d; };
  const LA = {}, LPC = {}; AJ.filter(Boolean).forEach(r => { addInto(LA, { n:r.n, w5:r.w5, w3:r.w3, S:r.S, res:r.res, cmp:r.cmp, R:r.R, U:r.U, req:r.req, ueq:r.ueq }); addInto(LPC[r.ck] = LPC[r.ck] || {}, { n:r.n, cmp:r.cmp }); });
  const enumN = CK7.reduce((n, ck) => n + (ENUM[ck] ? ENUM[ck].length : 0), 0), enumOK = CK7.every(ck => Array.isArray(ENUM[ck]));
  const latOK = enumOK && AJ.length > 0 && AJ.every(Boolean) && enumN === W.lat.n && LA.n === W.lat.n && LA.w5 === W.lat.w5 && LA.w3 === W.lat.w3;
  P('  D190 lattice: enumerated on the V' + BASE_ERA + ' fixture ' + enumN + ' chains (' + CK7.map(ck => ck + ' ' + (ENUM[ck] ? ENUM[ck].length : 'MISSING') + ' (ruled ' + W.lat.per[ck] + ')').join(', ') + ') | run ' + (LA.n || 0) + ' (W5 ' + (LA.w5 || 0) + ', W3 ' + (LA.w3 || 0) + ') in ' + AJ.length + ' shards, ' + AJ.filter(Boolean).length + ' usable');
  const lw = (K, w) => (LA.S && LA.S[K] && LA.S[K][w]) || { n:0, lb:0, kept:0, ph:0, hold:0, bh:0, hi:0, st:0, bad:0, uerr:0 };
  const sLine = (K, w) => { const s = lw(K, w); return K + ' [' + w + ']: chains ' + s.n + ' | live != boot ' + s.lb + ' | keeping _preHold ' + s.kept + ' | ph ' + s.ph + ' | hold toasts ' + s.hold + ' | booted _preHold ' + s.bh + ' | capped above 7 ' + s.hi + ' | stamped ' + s.st + ' | unreachable ' + s.bad + ' | undo errors ' + s.uerr; };
  const rsd = n => (LA.res && LA.res[n]) || { both:0, a:0, b:0 };
  // (i) chain carry and the hold machinery, S mode
  { ['C:OV1|all', 'C:CFG1|all', 'B:OV1|all', 'C:OV5|W5', 'C:CFG|W5'].forEach(x => { const [K, w] = x.split('|'); P('    d193-i ' + sLine(K, w)); });
    const r1 = rsd('OV1~CFG1'), r5 = rsd('OV5~CFG:W5'); P('    d193-i residue ids (live != boot) OV1 vs CFG1: both ' + r1.both + ', OV1 only ' + r1.a + ', CFG1 only ' + r1.b + ' | OV5 vs CFG [W5]: both ' + r5.both + ', OV5 only ' + r5.a + ', CFG only ' + r5.b);
    const s = lw('C:OV1', 'all'), o5 = lw('C:OV5', 'W5'), b = lw('B:OV1', 'all'), V = W.i.v229;
    const okB = b.n === W.lat.n && b.kept === V.kept && b.ph === V.ph && b.hold === V.hold && b.bh === V.bh && b.hi === V.hi;
    RES['d193-i'] = [latOK && okB && s.n === W.lat.n && s.bad === 0 && s.uerr === 0 && s.lb === W.i.resid && r1.both === W.i.resid && r1.a === 0 && r1.b === 0 && s.kept === W.i.kept && s.ph === W.i.ph && s.hold === W.i.hold && s.bh === W.i.bh && s.hi === W.i.hi
      && o5.n === W.lat.w5 && o5.bad === 0 && o5.lb === W.i.w5resid && r5.both === W.i.w5resid && r5.a === 0 && r5.b === 0 && o5.hi === W.i.w5hi,
      'chains ' + s.n + ', live != boot ' + s.lb + ' (same ids as CFG1 ' + r1.both + ', one side only ' + (r1.a + r1.b) + '), keeping _preHold ' + s.kept + ', ph ' + s.ph + ', hold toasts ' + s.hold + ', booted _preHold ' + s.bh + ', capped above 7 ' + s.hi + '; OV5 W5 residue ' + o5.lb + ' (same ids ' + r5.both + '), capped above 7 ' + o5.hi
      + (latOK ? '' : '; LATTICE not as ruled (enumerated ' + enumN + ', run ' + LA.n + ')') + (okB ? '' : '; BASELINE not as ruled: V229 OV1 keeping ' + b.kept + ', ph ' + b.ph + ', hold toasts ' + b.hold + ', booted ' + b.bh + ', capped above 7 ' + b.hi)]; }

  // (i-r) reboot before the last hop, R mode
  { const lr = (K, w) => (LA.R && LA.R[K] && LA.R[K][w]) || { n:0, tri:0, lb:0, kept:0, bad:0 };
    ['C:OV1|all', 'C:CFG1|all', 'B:OV1|all', 'C:OV5|W5'].forEach(x => { const [K, w] = x.split('|'), o = lr(K, w); P('    d193-i-r ' + K + ' [' + w + ']: chains ' + o.n + ' | live == boot == in-session end ' + o.tri + ' | live == boot ' + o.lb + ' | rebooted slot carries the kept dose ' + o.kept + ' | unreachable ' + o.bad); });
    const q = LA.req || { N:0, miss:0, d:0, ex:'' }; P('    d193-i-r R equivalence OV1 vs CFG1 (rebooted slot with _preHold, last-hop live, boot, toasts): differ ' + q.d + ' of ' + q.N + (q.miss ? ', unpaired ' + q.miss : '') + (q.ex ? '\n      e.g. ' + q.ex : ''));
    const a = lr('C:OV1', 'all'), b = lr('B:OV1', 'all'), o5 = lr('C:OV5', 'W5'), okB = b.n === W.lat.n && b.kept === W.ir.v229.kept;
    RES['d193-i-r'] = [latOK && okB && a.n === W.lat.n && a.bad === 0 && a.tri === W.ir.tri && a.lb === W.ir.tri && a.kept === W.lat.n && q.N === W.lat.n && q.miss === 0 && q.d === 0
      && o5.n === W.lat.w5 && o5.bad === 0 && o5.tri === W.ir.w5tri && o5.kept === W.lat.w5,
      'OV1 live == boot == in-session end ' + a.tri + ' of ' + a.n + ', kept dose ' + a.kept + ', OV1 vs CFG1 differ ' + q.d + ' of ' + q.N + '; OV5 W5 ' + o5.tri + ' of ' + o5.n + ', kept dose ' + o5.kept + (latOK ? '' : '; LATTICE not as ruled') + (okB ? '' : '; BASELINE not as ruled: V229 OV1 kept dose ' + b.kept + ' of ' + b.n)]; }
  // (i-u) undo onto a held intermediate then one more hop, U mode
  { const lu = (K, w) => (LA.U && LA.U[K] && LA.U[K][w]) || { n:0, lb:0, ld:0, kept:0, miss:0, bad:0, uerr:0 };
    ['C:OV1|all', 'C:CFG1|all', 'B:OV1|all', 'C:OV5|W5'].forEach(x => { const [K, w] = x.split('|'), o = lu(K, w); P('    d193-i-u ' + K + ' [' + w + ']: chains ' + o.n + ' | live == boot ' + o.lb + ' | live == direct ' + o.ld + ' (INFO V222 note (3) complement ' + (o.n - o.ld) + ') | undone card carries the kept dose ' + o.kept + ' | undo missed hop 1 ' + o.miss + ' | unreachable ' + o.bad + ' | undo errors ' + o.uerr); });
    const q = LA.ueq || { N:0, miss:0, d:0, ex:'' }; P('    d193-i-u U equivalence OV1 vs CFG1 (undone card with _preHold, live, boot, direct, toasts): differ ' + q.d + ' of ' + q.N + (q.miss ? ', unpaired ' + q.miss : '') + (q.ex ? '\n      e.g. ' + q.ex : ''));
    const a = lu('C:OV1', 'all'), b = lu('B:OV1', 'all'), o5 = lu('C:OV5', 'W5'), okB = b.n === W.iu.n && b.kept === W.iu.v229.kept;
    RES['d193-i-u'] = [latOK && okB && a.n === W.iu.n && a.bad === 0 && a.uerr === 0 && a.miss === 0 && a.lb === a.n && a.kept === a.n && a.n - a.ld === W.iu.info && q.N === W.iu.n && q.miss === 0 && q.d === 0
      && o5.n === W.iu.w5n && o5.bad === 0 && o5.uerr === 0 && o5.miss === 0 && o5.lb === o5.n && o5.kept === o5.n,
      'chains ' + a.n + ', live == boot ' + a.lb + ', kept dose on the undone card ' + a.kept + ', OV1 vs CFG1 differ ' + q.d + ' of ' + q.N + ', INFO live != direct ' + (a.n - a.ld) + '; OV5 W5 ' + o5.n + ' chains, live == boot ' + o5.lb + ', kept dose ' + o5.kept + (latOK ? '' : '; LATTICE not as ruled') + (okB ? '' : '; BASELINE not as ruled: V229 OV1 kept dose ' + b.kept + ' of ' + b.n)]; }

  // the equivalence row, S mode
  { const cm = n => (LA.cmp && LA.cmp[n]) || { N:0, miss:0, core:0, all:0, by:{}, ex:{} };
    const show = (lbl, o) => { P('    d194-eq ' + lbl + ': chains ' + o.N + (o.miss ? ' (unpaired ' + o.miss + ')' : '') + ' | differ on live/toast/boot/undo/undo+boot ' + o.core + ' | differ on any field incl. _preHold, ph and whole-day JSON ' + o.all
      + ' | by field ' + (Object.keys(o.by || {}).sort().map(k => k + ' ' + o.by[k]).join(' | ') || '(none)')); Object.keys(o.ex || {}).slice(0, 3).forEach(k => P('      e.g. ' + o.ex[k])); };
    const a = cm('OV1~CFG1'), f5 = cm('OV5~CFG:W5'), u3 = cm('OV5~V229OV5:W3'), b = cm('V229OV1~CFG1');
    show('OV1 vs CFG1 [all weeks]', a);
    P('      per config ' + CK7.map(ck => { const o = (LPC[ck] && LPC[ck].cmp && LPC[ck].cmp['OV1~CFG1']) || {}; return ck + ' ' + (o.all || 0) + ' of ' + (o.N || 0) + ' (ruled ' + W.lat.per[ck] + ')'; }).join(' | '));
    show('OV5 vs CFG [W5, spliced]', f5); show('OV5 candidate vs V229 [W3, unspliced]', u3); show('V229 OV1 vs candidate CFG1 [all weeks] (the baseline)', b);
    const s1 = lw('C:OV1', 'all'), s5 = lw('C:OV5', 'W5'), s3 = lw('C:OV5', 'W3');
    P('    d194-eq chains on a stamped day: OV1 ' + s1.st + '/' + s1.n + ' | OV5 W5 ' + s5.st + '/' + s5.n + ' | OV5 W3 ' + s3.st + '/' + s3.n);
    const V = W.eq.v229, by = b.by || {}, okB = b.N === W.lat.n && b.miss === 0 && b.all === V.all && b.core === V.all && ['live', 'boot', 'undo', 'undoBoot', 'toasts', 'live_preHold', 'ph'].every(k => (by[k] || 0) === V[k]);
    RES['d194-eq'] = [latOK && okB && a.N === W.lat.n && a.miss === 0 && a.all === 0 && s1.n === W.lat.n && s1.st === s1.n && f5.N === W.lat.w5 && f5.miss === 0 && f5.all === 0 && s5.n === W.lat.w5 && s5.st === s5.n
      && u3.N === W.lat.w3 && u3.miss === 0 && u3.all === 0 && s3.n === W.lat.w3 && s3.st === 0,
      'OV1 vs CFG1 differ ' + a.all + ' of ' + a.N + ' (stamped ' + s1.st + '), OV5 vs CFG W5 ' + f5.all + ' of ' + f5.N + ' (stamped ' + s5.st + '), unspliced W3 vs V229 ' + u3.all + ' of ' + u3.N + ' (stamped ' + s3.st + ')' + (latOK ? '' : '; LATTICE not as ruled')
      + (okB ? '' : '; BASELINE not as ruled: V229 OV1 vs CFG1 ' + b.all + ' of ' + b.N + ' differ (' + ['live', 'boot', 'undo', 'undoBoot', 'toasts', 'live_preHold', 'ph'].map(k => k + ' ' + (by[k] || 0)).join(', ') + ')')]; }

  // d194-q′ the typed hand routes
  { const SK = stampKey({ region:'knee', tier:'workaround' });
    const one = K => { const r = HJ[K]; if(!r) return { ok:false, miss:['no result'] }; const miss = []; const ov = /OV5$/.test(K);
      handDiff(HANDQ.mario, r.mario, 'mario', miss); handDiff(HANDQ.r7, r.r7, 'r7', miss);
      if(!r.mario || r.mario.stamp !== (ov ? SK : null)) miss.push('mario W5 thu stamp ' + JSON.stringify(r.mario && r.mario.stamp)); if(!r.r7 || r.r7.stamp !== (ov ? SK : null)) miss.push('r7 W6 thu stamp ' + JSON.stringify(r.r7 && r.r7.stamp));
      return { ok:miss.length === 0, miss }; };
    const c5 = one('C:OV5'), cf = one('C:CFG');
    // the baseline's V229 figure on OV5: every mario card the native dose, no kept dose, no ph, no hold toast; Leg press TEST9 with "Same job, same numbers."
    const b = HJ['B:OV5']; const bm = []; const walk = (o, f) => { if(o && typeof o === 'object'){ if('d' in o && 'h' in o) f(o); Object.values(o).forEach(v => walk(v, f)); } };
    if(!b || !b.mario || !b.mario.U0) bm.push('no V229 mario routes'); else { walk(b.mario, o => { if(o.d !== HANDQ_V229.d || o.h !== null || (typeof o.t === 'string' && o.t.endsWith(HOLD))) bm.push(JSON.stringify(o).slice(0, 160)); });
      ['U0', 'U2'].forEach(k => { if(/ph="/.test(b.mario[k].rec)) bm.push(k + ' record keeps ph: ' + b.mario[k].rec); }); }
    if(!b || !b.r7 || !b.r7.lp || b.r7.lp.hop.d !== HANDQ_V229.lp.d || b.r7.lp.hop.t !== HANDQ_V229.lp.t || b.r7.lp.hop.h !== null || b.r7.lp.boot.d !== HANDQ_V229.lp.d) bm.push('V229 Leg press ' + JSON.stringify(b && b.r7 && b.r7.lp && b.r7.lp.hop).slice(0, 300));
    const okB = bm.length === 0;
    P('    d194-q′ candidate OV5: ' + (c5.ok ? 'every typed line holds' : c5.miss.length + ' lines off the table') + ' | candidate CFG: ' + (cf.ok ? 'every typed line holds' : cf.miss.length + ' lines off the table') + ' | V229 OV5: ' + (okB ? 'reads the V229 figure' : bm.length + ' lines off the V229 figure'));
    c5.miss.slice(0, 4).forEach(m => P('      OV5 ' + m)); cf.miss.slice(0, 4).forEach(m => P('      CFG ' + m)); bm.slice(0, 3).forEach(m => P('      V229 ' + m));
    if(c5.ok){ const m = HJ['C:OV5'].mario; P('      e.g. OV5 U0 hop2 ' + m.U0.hops[1].n + ' ' + JSON.stringify(m.U0.hops[1].d) + ' _preHold ' + JSON.stringify(m.U0.hops[1].h) + ' toast "' + m.U0.hops[1].t + '" | r7 Leg press "' + HJ['C:OV5'].r7.lp.hop.t + '"'); }
    RES['d194-q′'] = [okB && c5.ok && cf.ok, 'OV5 ' + (c5.ok ? 'all typed lines' : c5.miss.length + ' off (' + c5.miss[0] + ')') + ', CFG ' + (cf.ok ? 'all typed lines' : cf.miss.length + ' off (' + cf.miss[0] + ')') + (okB ? '' : '; BASELINE not as ruled: V229 OV5 ' + bm.length + ' lines off (' + bm[0] + ')')]; }

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
if not P.exists():
    sys.exit('REFUSED: ' + str(P) + ' is missing; slice 3 (tests/edits/v230_s3_g230_lens2_gate.py) writes it first')
have = hashlib.sha256(P.read_bytes()).hexdigest()
if have == EXPECT_SHA256:
    print('already written: ' + str(P) + ' is byte-identical to this record (sha256 ' + got[:12] + ')'); sys.exit(0)
if have != BEFORE_SHA256:
    sys.exit('REFUSED: ' + str(P) + ' is neither slice 3\'s text (' + BEFORE_SHA256[:12] + ') nor this record (' + got[:12] + '): sha256 ' + have[:12])
with open(P, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(CONTENT)
print('wrote ' + str(P) + ' (' + str(len(CONTENT.encode("utf-8"))) + ' bytes, sha256 ' + got[:12] + ', over slice 3 ' + BEFORE_SHA256[:12] + ')')
