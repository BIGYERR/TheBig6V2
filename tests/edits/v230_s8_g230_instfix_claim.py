#!/usr/bin/env python3
# v230_s8_g230_instfix_claim.py — V230 slice 8 (no index.html edit). tests/gates/g230_d194_lens2.js (slice 4's text,
# sha256 d49fc6528244…): row inst-fix stops gating the figure rows and becomes the claim row d194-fixture.
# Why: gatekeeper finding 2. Sabotage S22-D193 (tests/sabotage/v230_d194.json, R8's hold trigger keyed on the donor as
# read) moves the fixture presentation as well as the overlay, so inst-fix failed (L1 149,997 of 150,068, toast 71;
# CFG1 pairs 128 of 324) and every figure row printed "not read"; d193-k″'s own typed figure (hold toast on 196 of 196
# bwsets ends) was never observed under the mutation that exists to test it.
# Session call: tests/measure/v230_rulings/v230_session_calls.md item 12 ("inst-fix becomes a claim row (the fixture
# presentation did not move; R3′ "nothing else") that fails by name and blocks nothing; inst-self, inst-stamp and
# inst-ov1 stay as gating instruments"). Ruling: tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 R3′.
# Four anchored edits, each asserted count==1 on the running text before it is applied:
#   E1  header: POPULATION's pointer to the fixture row, the discrimination sentence (three instruments and the claim
#       row pass on V229), the ROWS block (inst-fix's entry renamed d194-fixture, marked CLAIM, moved after inst-ov1);
#   E2  the row table: the label renamed (CLAIM, gates no row) and placed after inst-ov1; INST = the three gating
#       instruments; FIG opens with d194-fixture, so it is read and printed like a figure row and gates nothing;
#   E3  the claim's computation: printed and stored under d194-fixture; its figures, populations and condition are
#       byte-identical (150,068 L1 pairs card and toast, rows aligned, 324 CFG1 pairs);
#   E4  (k″)'s comment: the baseline-named sets lean on no gating row.
# No figure, population or oracle changes; the row count stays 14 (3 instruments, 1 claim, 10 figure rows).
# The script writes only over slice 4's exact text (BEFORE_SHA256); on the new text it reports byte-identity; on
# anything else it refuses. The result is checked against EXPECT_SHA256 before any write.
import hashlib, pathlib, sys
P = pathlib.Path(__file__).resolve().parents[1] / 'gates' / 'g230_d194_lens2.js'
BEFORE_SHA256 = 'd49fc6528244763a403d87db0430c7d03bf2ca016e208daf6937926d5eb7f1aa'
EXPECT_SHA256 = 'a60a6478ecd74aa36f86f27e852ab72aa6b1208d3d1058813fa8416eb7f0a610'
EDITS = [
 # E1
 (r'''//                 candidate (row inst-fix proves the fixture is unmoved). The L1 sweep's capped flag reads the baseline's
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
''',
  r'''//                 candidate (row d194-fixture claims the fixture is unmoved; no population leans on that claim).
//                 The L1 sweep's capped flag reads the baseline's _pattern the same way. The classifier is not under
//                 test; the plan is.
//
// VERSION PREDICATE (standing rulings 2 and 4).
//   below 230   REFUSED: every row FAILS by name.
//   230 and up  every row asserts.
//   IA_ASSUME_VERSION=230 lifts a file stamped exactly 229 to 230 for a discrimination run; it is announced, ignored on
//   any other file, and gate.sh never sets it. On V229 that way every figure row FAILS at its V229 figure (d193-e live
//   bwsets at RPE 8 196; d193-k″ hold toasts 0 of 196; d193-e′ live and boot above RPE 7 114; d193-k 0 hold variants,
//   1,243 false claims, INFO capped 728; d193-l G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0) while the three instrument
//   rows and the claim row d194-fixture pass.
//   Each figure row also requires the BASELINE to read its V229 figure on the same presentation in the same run (the
//   baseline shows the defect, g229's precedent): V229 OV1 bwsets at RPE 8 196, hold toasts 0 of 196, live above RPE 7
//   114; V229 STAMP 0 hold variants, 1,243 false claims, INFO capped 728, G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0.
//   The baseline is argv[3] if it reads ia-version 229, else `git show <V229_COMMIT>:index.html` written under
//   os.tmpdir() (the runner sets TMPDIR to its scratch path); the run prints which path it used.
//
// ROWS (the three instrument rows first; if one fails, every other row FAILS by name, unread. Then the claim row
//   d194-fixture, which fails by name and gates nothing, then the figure rows, each read and asserted on its own.)
//   inst-self   every stored record (7 L9 configs × CFG, CFG1, OV1, OV5, both trees) written twice in two fresh VMs
//               equals itself; every L1 baseline build equals itself in two VMs (384/384), clock fields stripped.
//   inst-stamp  STAMP == the real writer (OV1) on every day of the 7 L9 configs, both trees (294/294 each; 210 stamped).
//   inst-ov1    an OV1 carded day == the CFG1 day with the stamp removed, every carded day of the 7 L9 configs, both
//               trees (210/210 each), and every OV1 carded day is stamped.
//   d194-fixture  CLAIM, not an instrument (R3′ "V230 moves two guards and two filter cfgs and nothing else"): the
//               fixture presentation did not move: candidate CFG == V229 CFG on the whole L1 sweep (150,068/150,068,
//               card and toast, rows aligned) and on every L9 single-hop pair at CFG1 (324/324: donor, live card,
//               _preHold, toast, boot card, boot name, boot _preHold). It gated the figure rows until gatekeeper's
//               finding 2 (tests/measure/v230_rulings/v230_session_calls.md item 12): S22 moves the fixture as well as
//               the overlay, so the gating row hid d193-k″'s own figure under the mutation that exists to test it.
'''),
 # E2
 (r'''  'inst-fix':   'row inst-fix    INSTRUMENT the fixture presentation did not move: candidate CFG == V229 CFG on the g221 L1 sweep (150,068/150,068 card and toast) and on the L9 single-hop pairs at CFG1 (324/324)',
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
''',
  r'''  'inst-ov1':   'row inst-ov1    INSTRUMENT an OV1 carded day == the CFG1 day with the stamp removed, every carded day of the 7 L9 configs, both trees (210/210 each), every one stamped',
  'd194-fixture': 'row d194-fixture CLAIM (R3′ "nothing else"; fails by name, gates no row) the fixture presentation did not move: candidate CFG == V229 CFG on the g221 L1 sweep (150,068/150,068 card and toast) and on the L9 single-hop pairs at CFG1 (324/324)',
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
const INST = ['inst-self', 'inst-stamp', 'inst-ov1'];   // the gating instruments: if one fails, every other row FAILS unread
const FIG = ['d194-fixture', 'd193-e', 'd193-k″', 'd193-e′', 'd193-k', 'd193-l', 'd193-i', 'd193-i-r', 'd193-i-u', 'd194-eq', 'd194-q′'];   // d194-fixture is a claim row: read like a figure row, gates nothing
'''),
 # E3
 (r'''  { const same = (a, b) => !!a && !!b && a.dn === b.dn && a.o === b.o && a.h === b.h && a.t === b.t && a.b === b.b && a.bn === b.bn && a.bh === b.bh;
    const fp = PR.filter(r => same(r.R['C:CFG1'], r.R['B:CFG1'])).length;
    const bad = PR.find(r => !same(r.R['C:CFG1'], r.R['B:CFG1']));
    P('    inst-fix L1 candidate CFG == V229 CFG: aligned ' + X.fix.align + ', card differs ' + X.fix.card + ', toast differs ' + X.fix.toast + ' of ' + X.fix.n + exs('fixcard', 'fixtoast', 'align') + ' | L9 pairs at CFG1 ' + fp + '/' + PR.length
      + (bad ? ' | e.g. ' + bad.ck + ' W' + bad.w + ' ' + bad.d + ' ' + clean(bad.from) + ' -> ' + bad.to + ' ' + JSON.stringify(bad.R['C:CFG1']) + ' vs ' + JSON.stringify(bad.R['B:CFG1']) : ''));
    RES['inst-fix'] = [pairsOK && l1OK && !crash.length && cfgs === W.L1.cfgs && X.fix.align && X.fix.n === W.L1.pairs && X.fix.card === 0 && X.fix.toast === 0 && PR.length === W.fixPairs && fp === PR.length,
''',
  r'''  // the claim row d194-fixture (R3′ "nothing else"): computed beside the instruments, printed with the figure rows, gates nothing
  { const same = (a, b) => !!a && !!b && a.dn === b.dn && a.o === b.o && a.h === b.h && a.t === b.t && a.b === b.b && a.bn === b.bn && a.bh === b.bh;
    const fp = PR.filter(r => same(r.R['C:CFG1'], r.R['B:CFG1'])).length;
    const bad = PR.find(r => !same(r.R['C:CFG1'], r.R['B:CFG1']));
    P('    d194-fixture (claim) L1 candidate CFG == V229 CFG: aligned ' + X.fix.align + ', card differs ' + X.fix.card + ', toast differs ' + X.fix.toast + ' of ' + X.fix.n + exs('fixcard', 'fixtoast', 'align') + ' | L9 pairs at CFG1 ' + fp + '/' + PR.length
      + (bad ? ' | e.g. ' + bad.ck + ' W' + bad.w + ' ' + bad.d + ' ' + clean(bad.from) + ' -> ' + bad.to + ' ' + JSON.stringify(bad.R['C:CFG1']) + ' vs ' + JSON.stringify(bad.R['B:CFG1']) : ''));
    RES['d194-fixture'] = [pairsOK && l1OK && !crash.length && cfgs === W.L1.cfgs && X.fix.align && X.fix.n === W.L1.pairs && X.fix.card === 0 && X.fix.toast === 0 && PR.length === W.fixPairs && fp === PR.length,
'''),
 # E4
 (r'''  // the two sets are named on the BASELINE fixture (B:CFG1, the ruled expected answer; inst-fix proves it == the
  // candidate's fixture), not by the card the overlay printed: its bwsets ends at RPE 7 and its cue ends.
''',
  r'''  // the two sets are named on the BASELINE fixture (B:CFG1, the ruled expected answer; the claim row d194-fixture says
  // it == the candidate's fixture and gates nothing), not by the card the overlay printed: its bwsets ends at RPE 7
  // and its cue ends. So under a mutation that moves the fixture too (S22) the row still reads its own figure.
'''),
]
if not P.exists():
    sys.exit('REFUSED: ' + str(P) + ' is missing; slices 3 and 4 write it first')
src = P.read_text(encoding='utf-8')
have = hashlib.sha256(src.encode('utf-8')).hexdigest()
if have == EXPECT_SHA256:
    print('already applied: ' + str(P) + ' is byte-identical to this record (sha256 ' + EXPECT_SHA256[:12] + ')'); sys.exit(0)
if have != BEFORE_SHA256:
    sys.exit('REFUSED: ' + str(P) + ' is neither slice 4\'s text (' + BEFORE_SHA256[:12] + ') nor this record (' + EXPECT_SHA256[:12] + '): sha256 ' + have[:12])
out = src
for i, (a, n) in enumerate(EDITS):
    c = out.count(a)
    if c != 1:
        sys.exit('ABORT: edit E' + str(i + 1) + ' anchor count ' + str(c) + ' (want 1); nothing written')
    out = out.replace(a, n)
got = hashlib.sha256(out.encode('utf-8')).hexdigest()
if got != EXPECT_SHA256:
    sys.exit('ABORT: result sha256 ' + got[:12] + ' is not the recorded ' + EXPECT_SHA256[:12] + '; nothing written')
with open(P, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(out)
print('wrote ' + str(P) + ' (' + str(len(out.encode('utf-8'))) + ' bytes, sha256 ' + got[:12] + ', over slice 4 ' + BEFORE_SHA256[:12] + ')')
