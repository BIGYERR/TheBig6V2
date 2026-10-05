#!/usr/bin/env python3
# V231 GATE MAINTENANCE G5' (four row changes in two gate files), keyed to the V231 absorb ruling
# (tests/measure/v231_rulings/v231_absorb_ruling.md, sections 3 and 6; D198 (v231_reruling2_d196a2_d198.md) leaves the
# g221 pins, which g230's d193-k/l share, unchanged):
#   g230_d194_lens2  d194-fixture    SCOPE: asserts at VER === 230; at >= 231 one column-0 SKIP line, never PASS, never FAIL
#                                    ("V230's claim about V230; a later build's fixture moves by its own ruling (D195 A-1/B-1,
#                                    D196, D197)"; pair count 150,989 vs 150,068)
#   g230_d194_lens2  d193-k, d193-l  ABSORB at >= 231 with g221's pins: 150,989 pairs, clamp pairs 1,253 = hold variants
#                                    (verbatim 694 / unloadable 360 / window 199), non-clamp == V229 STAMP 141,557/141,557;
#                                    G3a 839 (529 / 199 / 111), G3c-off 172, G3d 263, G3e 205, G3f 199; plus the bed-thrust
#                                    donor conjunct (donor `Single-leg hip thrust (shoulders on bed)`: g221's out 7 / off 4 /
#                                    null 3 / toast-moved 10 == g230's G3a 7, G3c-off 4, G3e 3, clamp pairs 10 each the hold
#                                    variant; V230 0)
#   g230_d194_lens2  d194-postsweep  RE-KEY (section 6): the population jobs run at >= 230 (the :811 guard), the >= 231 branch
#                                    asserts rejects 0 on L432 for the candidate, OV1 and fixture, with V229 reading the typed
#                                    22 in the same run; (ii) dropped as vacuous (column-0 SKIP); the reach jobs run at 230 only
#   g226_d189        G6b             SPLIT at >= 231: the S1 half kept; the whole-program byte equality dropped (column-0
#                                    SKIP); conjunct "cells whose lifting days differ from V225 == 640" (V230 0)
# index.html is not touched.
#
#   python3 tests/edits/v231_m5_g230_g226d189.py         figures on both trees from scratch copies, then edit in place
#   python3 tests/edits/v231_m5_g230_g226d189.py --dry   figures only; the repo is untouched
#
# Refuses unless index.html and the V230 baseline read the briefed sha256 prefixes, g230 is clean against HEAD, g226_d189
# equals HEAD plus exactly G3d's g226_d189 hunks (re-applied from tests/edits/v231_m3d_manny_pins.py), and every anchor
# occurs exactly once. Then it runs the edited copies (scratch mirror, tests/harness.js symlinked to the repo's): g230 as
# a PROBE copy with the D190 lattice jobs removed (the lattice rows are untouched by this slice and fail in the probe by
# design; the full gate runs after the write), and g226_d189 whole, each on the candidate and on V230. A figure not as
# ruled parks the run (standing ruling 7): nothing is written. Aborts on the first miss.
import hashlib, os, re, subprocess, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad'
BASE = SCR + '/base_v230.html'
M5 = SCR + '/builder_m5'
CAND = os.path.join(ROOT, 'index.html')
SHA = {CAND: '1b403743f8ad1b16', BASE: '72ac41c8d34034ce'}
V229_COMMIT = '0bec3ecfdc53ecb71b74178a3d6c49398ae87018'   # g230's own V229_COMMIT
V225_COMMIT = '35919943d766606dcbf5e09c98a08b5782dc2223'   # g226_d189's own V225_COMMIT
G230 = 'tests/gates/g230_d194_lens2.js'
G189 = 'tests/gates/g226_d189_pacedisclose.js'
G3D = 'tests/edits/v231_m3d_manny_pins.py'
REF230 = SCR + '/measure5/per_v230/g230_d194_lens2.js.out'   # HEAD's g230 on V230 this session (PASS 15 FAIL 0)
REF230_ART = SCR + '/measure5/v230.html'

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

def sha16(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16]

dry = False
if len(sys.argv) == 2 and sys.argv[1] == '--dry':
    dry = True
elif len(sys.argv) != 1:
    die('usage: v231_m5_g230_g226d189.py [--dry]')

for f, want_sha in SHA.items():
    got = sha16(f)
    if got != want_sha:
        die('%s sha256 %s, want %s' % (f, got, want_sha))
    print('sha ok %s %s' % (want_sha, f))
if sha16(REF230_ART) != SHA[BASE]:
    die('the V230 reference run was not on V230: ' + REF230_ART)
if subprocess.run(['git', '-C', ROOT, 'diff', '--quiet', 'HEAD', '--', G230]).returncode != 0:
    die(G230 + ' is not clean against HEAD')
print('clean vs HEAD ' + G230)
# g226_d189: HEAD + G3d's g226_d189 hunks, byte for byte
g3d = open(os.path.join(ROOT, G3D), encoding='utf-8').read()
a, b = g3d.find('def note('), g3d.find('GONE = {')
if a < 0 or b < 0:
    die(G3D + ' does not carry its note()/EDITS block')
ns = {}
exec(g3d[a:b], ns)
head189 = subprocess.run(['git', '-C', ROOT, 'show', 'HEAD:' + G189], capture_output=True, check=True).stdout.decode('utf-8')
for old, new in ns['EDITS'][G189]:
    if head189.count(old) != 1:
        die('G3d hunk does not apply to HEAD:' + G189 + ': ' + old[:60])
    head189 = head189.replace(old, new)
if open(os.path.join(ROOT, G189), encoding='utf-8').read() != head189:
    die(G189 + " is not HEAD plus exactly G3d's hunks")
print('clean vs HEAD + G3d (%d hunks) %s' % (len(ns['EDITS'][G189]), G189))

RUL3 = 'tests/measure/v231_rulings/v231_absorb_ruling.md section 3'
EDITS = {G230: [], G189: []}

# ══ g230 ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
# (1) VERSION PREDICATE header, the 231 era
EDITS[G230].append(('header 231 era', r'''//   231 and up  every row asserts except d194-postsweep (INFO, D194 Amendment 4, keyed VER === 230), which prints a
//               column-0 REFUSED line and FAILS by name: P-BWFALLBACK + P-FILTERLAST (V231) must re-key it.
''', r'''//   231 and up  (tests/measure/v231_rulings/v231_absorb_ruling.md sections 3 and 6; standing rulings 2 and 4)
//               d194-fixture is SCOPED to 230: at 231 and up it prints one column-0 SKIP line with this tree's figures,
//               never PASS and never FAIL ("V230's claim about V230; a later build's fixture moves by its own ruling
//               (D195 A-1/B-1, D196, D197)"; the candidate's L1 sweep has 150,989 pairs, V229 150,068).
//               d193-k and d193-l ABSORB D196-1 at the swap sheet with g221's pins (W231 below, typed): 150,989 pairs,
//               clamp pairs 1,253 = hold variants (verbatim 694, unloadable 360, window 199), non-clamp toasts == V229
//               STAMP 141,557/141,557; G3a 839 (529 / 199 / 111), G3c-off 172, G3d 263, G3e 205, G3f 199; every other
//               conjunct as at 230; plus the bed-thrust donor conjunct: pairs whose donor is `Single-leg hip thrust
//               (shoulders on bed)` (the D196-1 card that was `Burpees` on V230) are clamp pairs 10, each the hold
//               variant (d193-k), and G3a 7, G3c-off 4, G3e 3 (d193-l); V230 has 0 such donors.
//               d194-postsweep is RE-KEYED (section 6): its population jobs run and the row asserts L432 post-sweep
//               rejects 0 for the candidate, OV1 and fixture (432 builds, 12,960 lifting days each; D196-1 closed the
//               18 Burpees drops, D197-1 the 4 Pushups re-details), with V229 reading the typed 22 in the same run (the
//               instrument is not blind); (ii) is dropped as vacuous (no reject day exists) and prints one column-0
//               SKIP line; the reach jobs, which serve (ii) and the typed-build re-read, run at 230 only.
'''))
# (2) the d194-postsweep description notes the re-key
EDITS[G230].append(('postsweep description', r'''//               (P-BWFALLBACK closes the 18 Burpees, P-FILTERLAST the 4 Pushups re-details), not the 4 the coach text
//               named before the fold.
''', r'''//               (P-BWFALLBACK closes the 18 Burpees, P-FILTERLAST the 4 Pushups re-details), not the 4 the coach text
//               named before the fold. V231 re-keyed it to 0 (absorb ruling section 6; VERSION PREDICATE above).
'''))
# (3) RUNTIME: which postsweep jobs run where
EDITS[G230].append(('runtime jobs', r'''//   then the 3 hand-route jobs, the 7 L9 pair configs and 8 shards of the L1 sweep, then (at ia-version 230 only)
//   d194-postsweep's 8 population shards (54 L432 configs each, both trees, OV1 and the fixture) and its 11 reach jobs
''', r'''//   then the 3 hand-route jobs, the 7 L9 pair configs and 8 shards of the L1 sweep, then d194-postsweep's 8 population
//   shards (54 L432 configs each, both trees, OV1 and the fixture; at 230 and up) and its 11 reach jobs (at 230 only)
'''))
# (4) the V231 era constant
EDITS[G230].append(('V231_ERA', r'''const ERA = 230, BASE_ERA = 229;
''', r'''const ERA = 230, BASE_ERA = 229, V231_ERA = 231;   // V231_ERA: the V231 absorb ruling (sections 3 and 6)
'''))
# (5) the V231 pins, typed
EDITS[G230].append(('W231 pins', r'''  iu:{ n:11096, info:5868, w5n:8269, v229:{ kept:0 } },
};
''', r'''  iu:{ n:11096, info:5868, w5n:8269, v229:{ kept:0 } },
};
// V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, d193-k and d193-l ABSORB, class D196-1 at the swap
// sheet; standing rulings 2 and 4): the pins at 231 and up, typed from the ruling (g221's D193_PIN era pins), never read
// from a tree. INFO capped, G3c power and the config count are carried from W unchanged. bed: pairs on candidate STAMP
// whose donor is BED_DONOR, the D196-1 card that was `Burpees` on V230 (g221's out 7 / off 4 / null 3 / toast-moved 10).
const BED_DONOR = 'Single-leg hip thrust (shoulders on bed)';
const W231 = {
  L1:{ cfgs:W.L1.cfgs, pairs:150989, clamp:1253, hv:1253, hvK:{ verbatim:694, unloadable:360, window:199 }, info:W.L1.info, nonClamp:141557 },
  l:{ G3a:839, G3aCls:{ donor:529, window:199, verbatim:111 }, pow:W.l.pow, off:172, at:263, nul:205, win:199 },
  bed:{ clamp:10, hv:10, G3a:7, off:4, nul:3 },
};
'''))
# (6) newL1 carries the bed-thrust donor tier
EDITS[G230].append(('newL1 bt', r'''const newL1 = () => ({ pairs:0, thr:0, clamp:0, hv:0, hvK:{ verbatim:0, unloadable:0, window:0 }, fals:0, holdOff:0, info:0, hvMiss:0,
''', r'''const newL1 = () => ({ pairs:0, thr:0, clamp:0, hv:0, hvK:{ verbatim:0, unloadable:0, window:0 }, fals:0, holdOff:0, info:0, hvMiss:0, bt:{ pairs:0, clamp:0, hv:0, G3a:0, off:0, nul:0, at:0, win:0 },
'''))
# (7..13) tallyL1 counts the bed-thrust donor tier beside each counter (every tree; asserted at 231 and up)
EDITS[G230].append(('tally bed pairs', r'''  S.pairs++; if(r.thr) S.thr++;
''', r'''  const bed = clean(r.from) === BED_DONOR;   // V231 (absorb ruling section 3): the bed-thrust donor tier, counted on every tree
  S.pairs++; if(r.thr) S.thr++; if(bed) S.bt.pairs++;
'''))
EDITS[G230].append(('tally bed clamp', r'''  if(c.clamp){ S.clamp++; if(r.toast === c.wantH && t.endsWith(HOLD)){ S.hv++; S.hvK[c.kind]++; }''',
r'''  if(c.clamp){ S.clamp++; if(bed) S.bt.clamp++; if(r.toast === c.wantH && t.endsWith(HOLD)){ S.hv++; S.hvK[c.kind]++; if(bed) S.bt.hv++; }'''))
EDITS[G230].append(('tally bed G3a', r'''S.G3aCls[c.capd ? (c.Hk.k === 'win' ? 'window' : 'donor') : 'verbatim']++; }''',
r'''S.G3aCls[c.capd ? (c.Hk.k === 'win' ? 'window' : 'donor') : 'verbatim']++; if(bed) S.bt.G3a++; }'''))
EDITS[G230].append(('tally bed off', r'''  if(c.Hk.k === 'offgram'){ S.offN++; if(cueBlind(O) !== cueBlind(D)) S.off++;''',
r'''  if(c.Hk.k === 'offgram'){ S.offN++; if(cueBlind(O) !== cueBlind(D)){ S.off++; if(bed) S.bt.off++; }'''))
EDITS[G230].append(('tally bed null', r'''  if(c.Hk.k === 'null'){ S.nulN++; if(O !== D) S.nul++;''',
r'''  if(c.Hk.k === 'null'){ S.nulN++; if(O !== D){ S.nul++; if(bed) S.bt.nul++; }'''))
EDITS[G230].append(('tally bed at', r'''  if(c.Hk.k === 'atfloor'){ S.atN++; if(O !== D) S.at++;''',
r'''  if(c.Hk.k === 'atfloor'){ S.atN++; if(O !== D){ S.at++; if(bed) S.bt.at++; }'''))
EDITS[G230].append(('tally bed win', r'''  if(c.Hk.k === 'win'){ S.winN++; if(O !== c.Hk.out) S.win++;''',
r'''  if(c.Hk.k === 'win'){ S.winN++; if(O !== c.Hk.out){ S.win++; if(bed) S.bt.win++; }'''))
# (14) PS_REFUSE goes (its only reader, the 231 REFUSED branch, is replaced by the re-key)
EDITS[G230].append(('PS_REFUSE gone', r'''const PS_REFUSE = 'D194 Amendment 4 pins V230\'s post-sweep reject class; P-BWFALLBACK + P-FILTERLAST (V231) must re-key this row (expected 0)';
''', ''))
# (15) the V231 labels of the re-keyed rows (at 230 every label reads as before)
EDITS[G230].append(('V231 labels', r'''  ORDER.forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
let BF = null, baseWhy = '';
''', r'''  ORDER.forEach(k => ok(R[k] + ' (REFUSED)', false));
  done();
}
// V231 (tests/measure/v231_rulings/v231_absorb_ruling.md sections 3 and 6; standing rulings 2 and 4): at 231 and up the
// re-keyed rows print their V231 labels; at 230 every label reads as above.
if(VER >= V231_ERA) Object.assign(R, {
  'd193-k':     'row d193-k      [V231 D196-1] g221 L1 sweep on STAMP (150,989 pairs, 384 configs): hand clamp pairs 1,253, toast == the hand hold variant 1,253 (verbatim 694, unloadable 360, window 199), 0 false same-numbers/effort claims, 0 hold toasts off the clamp set, INFO capped 458 pinned; STAMP == CFG card 0 and toast 0 differ; non-clamp toasts == V229 STAMP 141,557/141,557; bed-thrust donor clamp pairs 10, each the hold variant (V230 0) (V229: 0 hold variants, 1,243 false claims, INFO 728)',
  'd193-l':     'row d193-l      [V231 D196-1] g221 L1 sweep on STAMP, (l)\'s predicate (capped: hand hold of D177\'s card on the stripped donor; uncapped: D177\'s card on the stripped donor), 0 misses, moved counts == CFG\'s and pinned: G3a 839 (529 / 199 / 111), G3c power 0, G3c off grammar 172, G3d 263, G3e 205, G3f 199; bed-thrust donor G3a 7, G3c-off 4, G3e 3 (V230 0) (V229 STAMP: G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0)',
  'd194-postsweep': 'row d194-postsweep INFO [V231 re-key: D196-1 + D197-1] L432 post-sweep rejects 0 (V230 22: 18 Burpees drops, 4 Pushups re-details) on the candidate, OV1 and fixture (432 builds, 12,960 lifting days each); V229 == the typed table (22 in 11 builds) on OV1 and fixture in the same run; (ii) dropped as vacuous (no reject day exists)',
});
let BF = null, baseWhy = '';
'''))
# (16) the :811 guard becomes >= ERA with the branch
EDITS[G230].append((':811 guard', r'''if(VER === ERA){   // d194-postsweep (D194 Amendment 4) asserts at ia-version 230 only, so its jobs run only there
  for(let s = 0; s < PS_SHARDS; s++) JOBS.push({ kind:'ps', shard:s, art:CF, base:BF, cis:L432.map((c, i) => i).filter(i => i % PS_SHARDS === s) });
  [...new Set(PS_TABLE.map(psBuild))].forEach(k => JOBS.push({ kind:'reach', ck:k, art:CF, base:BF })); }
''', r'''// d194-postsweep (D194 Amendment 4; V231 absorb ruling section 6) asserts at 230 and up, so its population jobs run at 230
// and up; its reach jobs serve (ii) and the typed-build re-read, which assert at 230 only ((ii) is dropped as vacuous at
// 231 and up: no reject day exists), so they run only there.
if(VER >= ERA){
  for(let s = 0; s < PS_SHARDS; s++) JOBS.push({ kind:'ps', shard:s, art:CF, base:BF, cis:L432.map((c, i) => i).filter(i => i % PS_SHARDS === s) });
  if(VER === ERA) [...new Set(PS_TABLE.map(psBuild))].forEach(k => JOBS.push({ kind:'reach', ck:k, art:CF, base:BF })); }
'''))
# (17..20) d193-k: the era pins and the bed-thrust donor conjunct
EDITS[G230].append(('d193-k head', r'''  { const s = L.CSTAMP, f = L.CCFG; const kv = s.hvK;
''', r'''  // V231 (absorb ruling section 3, d193-k ABSORB, class D196-1; standing rulings 2 and 4): at 231 and up the row reads
  // the W231 pins and adds the bed-thrust donor conjunct (clamp pairs 10, each the hold variant; V230 0).
  { const s = L.CSTAMP, f = L.CCFG; const kv = s.hvK; const V231 = VER >= V231_ERA, WL = V231 ? W231.L1 : W.L1, bt = s.bt;
'''))
EDITS[G230].append(('d193-k bed print', r'''    const bS = L.BSTAMP, okB = bS.hv === W.L1.v229.hv && bS.fals === W.L1.v229.fals && bS.info === W.L1.v229.info;
''', r'''    const bS = L.BSTAMP, okB = bS.hv === W.L1.v229.hv && bS.fals === W.L1.v229.fals && bS.info === W.L1.v229.info;
    P('    d193-k bed-thrust donor (' + BED_DONOR + ') on candidate STAMP: pairs ' + bt.pairs + ' | clamp pairs ' + bt.clamp + ', hold variants ' + bt.hv + ' || V229 STAMP: pairs ' + bS.bt.pairs + ', clamp pairs ' + bS.bt.clamp + (V231 ? ' | ruled (V231) clamp pairs ' + W231.bed.clamp + ', hold variants ' + W231.bed.hv : ''));
    const btOK = !V231 || (bt.clamp === W231.bed.clamp && bt.hv === W231.bed.hv);
'''))
EDITS[G230].append(('d193-k RES', r'''    RES['d193-k'] = [l1OK && okB && !crash.length && cfgs === W.L1.cfgs && s.pairs === W.L1.pairs && s.thr === 0 && s.clamp === W.L1.clamp && s.hv === W.L1.hv && kv.verbatim === W.L1.hvK.verbatim && kv.unloadable === W.L1.hvK.unloadable && kv.window === W.L1.hvK.window
      && s.fals === 0 && s.holdOff === 0 && s.info === W.L1.info && X.sc.align && X.sc.n === W.L1.pairs && X.sc.card === 0 && X.sc.toast === 0 && X.nc.n === W.L1.nonClamp && X.nc.eq === X.nc.n,
''', r'''    RES['d193-k'] = [l1OK && okB && btOK && !crash.length && cfgs === WL.cfgs && s.pairs === WL.pairs && s.thr === 0 && s.clamp === WL.clamp && s.hv === WL.hv && kv.verbatim === WL.hvK.verbatim && kv.unloadable === WL.hvK.unloadable && kv.window === WL.hvK.window
      && s.fals === 0 && s.holdOff === 0 && s.info === WL.info && X.sc.align && X.sc.n === WL.pairs && X.sc.card === 0 && X.sc.toast === 0 && X.nc.n === WL.nonClamp && X.nc.eq === X.nc.n,
'''))
EDITS[G230].append(('d193-k detail', r'''', non-clamp == V229 ' + X.nc.eq + '/' + X.nc.n + (okB ? '' : '; BASELINE not as ruled: V229 STAMP hold variants ''',
r'''', non-clamp == V229 ' + X.nc.eq + '/' + X.nc.n + (V231 ? ', bed-thrust donor clamp pairs ' + bt.clamp + ' (hold variant ' + bt.hv + ')' : '') + (okB ? '' : '; BASELINE not as ruled: V229 STAMP hold variants '''))
# (21..24) d193-l: the era pins and the bed-thrust donor conjunct
EDITS[G230].append(('d193-l head', r'''  { const s = L.CSTAMP, f = L.CCFG; const ln = x => ''', r'''  // V231 (absorb ruling section 3, d193-l ABSORB, class D196-1; standing rulings 2 and 4): at 231 and up the row reads
  // the W231 pins and adds the bed-thrust donor conjunct (G3a 7, G3c-off 4, G3e 3; V230 0).
  { const s = L.CSTAMP, f = L.CCFG; const V231 = VER >= V231_ERA, WLl = V231 ? W231.l : W.l, bt = s.bt; const ln = x => '''))
EDITS[G230].append(('d193-l bed print', r'''    const bS = L.BSTAMP, okB = bS.G3a === W.l.v229.G3a && bS.off === W.l.v229.off && bS.at === W.l.v229.at && bS.nul === W.l.v229.nul && bS.win === W.l.v229.win;
''', r'''    const bS = L.BSTAMP, okB = bS.G3a === W.l.v229.G3a && bS.off === W.l.v229.off && bS.at === W.l.v229.at && bS.nul === W.l.v229.nul && bS.win === W.l.v229.win;
    P('    d193-l bed-thrust donor on candidate STAMP: G3a moved ' + bt.G3a + ', G3c-off ' + bt.off + ', G3e ' + bt.nul + ', G3d ' + bt.at + ', G3f ' + bt.win + ' || V229 STAMP: G3a ' + bS.bt.G3a + ', G3c-off ' + bS.bt.off + ', G3e ' + bS.bt.nul + (V231 ? ' | ruled (V231) G3a ' + W231.bed.G3a + ', G3c-off ' + W231.bed.off + ', G3e ' + W231.bed.nul : ''));
    const btOK = !V231 || (bt.G3a === W231.bed.G3a && bt.off === W231.bed.off && bt.nul === W231.bed.nul);
'''))
EDITS[G230].append(('d193-l RES', r'''    RES['d193-l'] = [l1OK && okB && !crash.length && cfgs === W.L1.cfgs && eqCFG && s.G3a === W.l.G3a && s.G3aCls.donor === W.l.G3aCls.donor && s.G3aCls.window === W.l.G3aCls.window && s.G3aCls.verbatim === W.l.G3aCls.verbatim
      && s.pow > 0 && s.powChg === W.l.pow && s.offN > 0 && s.off === W.l.off && s.atN > 0 && s.at === W.l.at && s.nulN > 0 && s.nul === W.l.nul && s.winN > 0 && s.win === W.l.win
''', r'''    RES['d193-l'] = [l1OK && okB && btOK && !crash.length && cfgs === W.L1.cfgs && eqCFG && s.G3a === WLl.G3a && s.G3aCls.donor === WLl.G3aCls.donor && s.G3aCls.window === WLl.G3aCls.window && s.G3aCls.verbatim === WLl.G3aCls.verbatim
      && s.pow > 0 && s.powChg === WLl.pow && s.offN > 0 && s.off === WLl.off && s.atN > 0 && s.at === WLl.at && s.nulN > 0 && s.nul === WLl.nul && s.winN > 0 && s.win === WLl.win
'''))
EDITS[G230].append(('d193-l detail', r'''      ln(s) + (eqCFG ? ', == CFG' : ', != CFG (' + ln(f) + ')') + (okB ? '' : '; BASELINE not as ruled: V229 STAMP ' + ln(bS))]; }
''', r'''      ln(s) + (eqCFG ? ', == CFG' : ', != CFG (' + ln(f) + ')') + (V231 ? ', bed-thrust donor G3a ' + bt.G3a + ', G3c-off ' + bt.off + ', G3e ' + bt.nul : '') + (okB ? '' : '; BASELINE not as ruled: V229 STAMP ' + ln(bS))]; }
'''))
# (25) d194-postsweep: the :1002 guard, the >= 231 branch
EDITS[G230].append((':1002 branch', r'''  // d194-postsweep (D194 Amendment 4, INFO): asserted at ia-version 230 only; from 231 a column-0 REFUSED line and a FAIL by name
  if(VER !== ERA){ P('REFUSED: row d194-postsweep at ia-version ' + VER + ': ' + PS_REFUSE); RES['d194-postsweep'] = [false, 'REFUSED at ia-version ' + VER + ': ' + PS_REFUSE]; }
''', r'''  // d194-postsweep (D194 Amendment 4, INFO): at 230 the typed table, the re-read and (ii) assert as ruled. V231 (absorb ruling
  // section 6, RE-KEY, classes D196-1 + D197-1; standing rulings 2 and 4): at 231 and up the same population jobs run and
  // the row asserts L432 rejects 0 for the candidate, OV1 and fixture, with V229 reading the typed table in the same run
  // (the instrument is not blind); (ii) is dropped as vacuous (no reject day exists) and prints one column-0 SKIP line.
  if(VER >= V231_ERA){ const SJ = JOBS.map((j, i) => j.kind === 'ps' ? res[i] : undefined).filter(x => x !== undefined);
    const N = PS_N, PB = [...new Set(PS_TABLE.map(psBuild))], TS = new Set(PS_TABLE.map(psLine)), K = PS_COMBO.map(([t, p]) => t + ':' + p);
    const NM = { 'C:OV1':'candidate OV1', 'C:CFG1':'candidate fixture', 'B:OV1':'V229 OV1', 'B:CFG1':'V229 fixture' };
    const psOK = SJ.length === PS_SHARDS && SJ.every(Boolean);
    const kinds = rows => ({ drop:rows.filter(x => x.split('|')[8] === 'drop').length, redetail:rows.filter(x => x.split('|')[8] === 'redetail').length, rename:rows.filter(x => x.split('|')[8] === 'rename').length,
      days:new Set(rows.map(x => x.split('|').slice(0, 6).join('|'))).size, builds:new Set(rows.map(x => x.split('|').slice(0, 4).join('|'))).size });
    const tq = kinds(PS_TABLE.map(psLine)), tableOK = PS_TABLE.length === N.rej && TS.size === N.rej && tq.drop === N.drop && tq.redetail === N.redetail && tq.days === N.rej && tq.builds === N.builds && PB.length === N.builds;
    const pop = {}; K.forEach(k => { const o = pop[k] = { builds:0, days:0, neu:0, rej:[], crash:[] };
      SJ.filter(Boolean).forEach(r => { const s = r.R[k]; o.builds += s.builds; o.days += s.days; o.neu += s.neu; o.rej.push(...s.rej); o.crash.push(...s.crash); }); });
    const setEq = o => { const s = new Set(o.rej); return o.rej.length === TS.size && s.size === TS.size && [...TS].every(x => s.has(x)); };
    const popOK = k => pop[k].builds === N.configs && pop[k].days === N.days && !pop[k].crash.length && setEq(pop[k]);
    const zero = k => pop[k].builds === N.configs && pop[k].days === N.days && !pop[k].crash.length && pop[k].rej.length === 0;
    K.forEach(k => { const o = pop[k], q = kinds(o.rej), cand = k.charAt(0) === 'C';
      P('    d194-postsweep (i) ' + NM[k] + ': builds ' + o.builds + ', lifting days ' + o.days + ' | rejects ' + o.rej.length + ' (drops ' + q.drop + ', re-details ' + q.redetail + ', renames ' + q.rename + ') on ' + q.days + ' days in ' + q.builds + ' builds | ' + (cand ? 'ruled 0 (V231 re-key)' : '== the typed table ' + setEq(o)) + ' | new items ' + o.neu
        + (o.crash.length ? ' | CRASH ' + o.crash[0] : '') + (cand && o.rej.length ? ' | e.g. ' + o.rej[0] : '')); });
    P('    d194-postsweep typed table ' + PS_TABLE.length + ' rows (drops ' + tq.drop + ', re-details ' + tq.redetail + ', builds ' + tq.builds + ') consistent ' + tableOK);
    P('SKIP row d194-postsweep (ii) the reach on the typed reject days: dropped at ia-version 231 and up as vacuous by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 6), no reject day exists on the candidate (OV1 ' + pop['C:OV1'].rej.length + ', fixture ' + pop['C:CFG1'].rej.length + ' rejects); its reach jobs do not run. Never PASS, never FAIL.');
    const cOK = zero('C:OV1') && zero('C:CFG1'), okB = popOK('B:OV1') && popOK('B:CFG1');
    RES['d194-postsweep'] = [psOK && tableOK && cOK && okB,
      '(i) candidate rejects OV1 ' + pop['C:OV1'].rej.length + ', fixture ' + pop['C:CFG1'].rej.length + ' (builds ' + pop['C:OV1'].builds + '/' + pop['C:CFG1'].builds + ', lifting days ' + pop['C:OV1'].days + '/' + pop['C:CFG1'].days + '); V229 == the typed table on OV1 ' + popOK('B:OV1') + ', fixture ' + popOK('B:CFG1')
      + (psOK ? '' : '; JOBS not usable (population ' + SJ.filter(Boolean).length + '/' + PS_SHARDS + ')') + (tableOK ? '' : '; TYPED TABLE inconsistent with its counts') + (okB ? '' : '; BASELINE not as ruled')]; }
'''))
# (26) the FIG loop: d194-fixture SKIPs at 231 and up
EDITS[G230].append(('FIG loop skip', r'''  FIG.forEach(k => { if(!INSTR_OK){ ok(R[k] + ' (not read: instrument ' + INST.filter(i => !(RES[i] && RES[i][0])).join(', ') + ' failed)', false); return; }
''', r'''  // V231 (absorb ruling section 3, g230 d194-fixture SCOPE; standing rulings 2 and 4): at 231 and up the claim row is
  // V230's claim about V230 and prints one column-0 SKIP line with this tree's figures, never PASS and never FAIL.
  FIG.forEach(k => { if(k === 'd194-fixture' && VER >= V231_ERA){ P('SKIP row d194-fixture CLAIM (R3′ "nothing else") scoped to ia-version 230 by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3): V230\'s claim about V230; a later build\'s fixture moves by its own ruling (D195 A-1/B-1, D196, D197). This tree: ' + (RES[k] ? RES[k][1] : 'not computed') + ' (V229 pairs ' + W.L1.pairs + '). Never PASS, never FAIL.'); return; }
    if(!INSTR_OK){ ok(R[k] + ' (not read: instrument ' + INST.filter(i => !(RES[i] && RES[i][0])).join(', ') + ' failed)', false); return; }
'''))

# ══ g226_d189 G6b ══════════════════════════════════════════════════════════════════════════════════════════════════
EDITS[G189].append(('header 231', r'''//   226 and up    every row asserts the D189 truth.
''', r'''//   226 and up    every row asserts the D189 truth.
//   231 and up    G6b SPLITS (tests/measure/v231_rulings/v231_absorb_ruling.md section 3; standing rulings 2 and 4):
//                 it keeps the S1 half (exactly one S1 note, on the V225 grid's first paced W1 run card, == the V225
//                 note + one space + S1) and adds "cells whose lifting days differ from V225 == 640" (D195-B's cost
//                 lens, class B-1, moved the lifting days of every cell: the ruling printed 640 cells, ops B-1 7,694,
//                 0 other; V230 reads 0). Its whole-program byte equality with V225 asserts at 230 and below only and
//                 at 231 and up prints one column-0 SKIP line, never PASS and never FAIL.
'''))
EDITS[G189].append(('V231 consts', r'''const ERA = 226, TAG = 'D189';
''', r'''const ERA = 226, TAG = 'D189';
const V231_ERA = 231, V231_LIFT = 640;   // V231 absorb ruling section 3, G6b split: typed, the ruling's print (640/640 cells)
'''))
EDITS[G189].append(('G6b counters', r'''  let cells = 0, good = 0; const why = {}, ex = [];
''', r'''  let cells = 0, good = 0; const why = {}, ex = [];
  // V231 (absorb ruling section 3, G6b SPLIT): a lifting day is a day's `sections`; a cell's lifting days differ from V225
  // when any week/day's sections JSON differs. Counted on every D189 tree, asserted at 231 and up.
  const V231 = VER >= V231_ERA; let lcells = 0, lmoved = 0, ldays = 0, outEq = 0;
  const liftDays = (a, b) => { let n = 0; const wa = a.weeks || {}, wb = b.weeks || {};
    new Set(Object.keys(wa).concat(Object.keys(wb))).forEach(w => { const da = wa[w] || {}, db = wb[w] || {};
      new Set(Object.keys(da).concat(Object.keys(db))).forEach(d => { const sa = da[d] && da[d].sections, sb = db[d] && db[d].sections;
        if(JSON.stringify(sa === undefined ? null : sa) !== JSON.stringify(sb === undefined ? null : sb)) n++; }); }); return n; };
  const noLift = p => { const c = JSON.parse(JSON.stringify(p)); Object.keys(c.weeks || {}).forEach(w => Object.keys(c.weeks[w] || {}).forEach(d => { const dy = c.weeks[w][d]; if(dy && typeof dy === 'object') delete dy.sections; })); return c; };
'''))
EDITS[G189].append(('G6b lift count', r'''      const pb = build(BASE, cfg), site = firstPaced(pb);
''', r'''      const pb = build(BASE, cfg), site = firstPaced(pb);
      lcells++; { const ld = liftDays(pc, pb); if(ld){ lmoved++; ldays += ld; } }
'''))
EDITS[G189].append(('G6b byte check', r'''      if(H.progDigest(restored) !== H.progDigest(pb)){ miss('another byte moved vs V225', tag); continue; }
''', r'''      if(V231){ if(H.progDigest(noLift(restored)) === H.progDigest(noLift(pb))) outEq++; }
      else if(H.progDigest(restored) !== H.progDigest(pb)){ miss('another byte moved vs V225', tag); continue; }
'''))
EDITS[G189].append(('G6b ok', r'''  const expectCells = 640;
  ok(ROW.G6b, cells === expectCells && good === cells, good + '/' + cells + ' cells (ruled 640)' + (Object.keys(why).length ? ' misses ' + J(why) + ' e.g. ' + ex.join(' ; ') : ''));
''', r'''  const expectCells = 640;
  if(D189 && BASE) console.log('    G6b lifting days vs V225 (every week and day, its sections): cells differing ' + lmoved + ' of ' + lcells + ', days differing ' + ldays + (V231 ? ' | INFO, not asserted: cells equal to V225 outside the lifting sections with the S1 note restored ' + outEq + ' of ' + good : ''));
  if(V231) console.log('SKIP row G6b whole-program byte equality with V225 (S1 note restored): asserted at ia-version 230 and below only; the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3) splits G6b at 231 and up (D195-B moved the lifting days of every cell, class B-1). Never PASS, never FAIL.');
  if(V231) ok(ROW.G6b + ' [V231 split: the S1 half kept, the whole-program byte equality dropped; cells whose lifting days differ from V225 == ' + V231_LIFT + ', B-1]',
    cells === expectCells && good === cells && lcells === expectCells && lmoved === V231_LIFT,
    good + '/' + cells + ' cells (ruled 640), lifting days differ on ' + lmoved + '/' + lcells + ' cells (ruled ' + V231_LIFT + ')' + (Object.keys(why).length ? ' misses ' + J(why) + ' e.g. ' + ex.join(' ; ') : ''));
  else ok(ROW.G6b, cells === expectCells && good === cells, good + '/' + cells + ' cells (ruled 640)' + (Object.keys(why).length ? ' misses ' + J(why) + ' e.g. ' + ex.join(' ; ') : ''));
'''))

# ── apply in memory: every anchor asserted count == 1 on the text as it stands; abort on the first miss ────────────
result = {}
for rel, edits in EDITS.items():
    src = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    for name, old, new in edits:
        n = src.count(old)
        if n != 1:
            die('%s anchor "%s" count %d (want 1)' % (rel, name, n))
        src = src.replace(old, new)
        print('anchor ok %s :: %s' % (rel, name))
    result[rel] = src
if 'PS_REFUSE' in result[G230]:
    die('PS_REFUSE survives in ' + G230)
# V231_ERA sites: g230 the definition line (the const and its comment, 2), the label override, d193-k, d193-l, the
# :1002 branch, the FIG loop (7); g226_d189 the definition and G6b's predicate (2)
if result[G230].count('V231_ERA') != 7 or result[G189].count('V231_ERA') != 2:
    die('V231_ERA not wired as expected (g230 %d, want 7; g226_d189 %d, want 2)' % (result[G230].count('V231_ERA'), result[G189].count('V231_ERA')))

# ── figures on both trees from scratch copies, before anything is written ───────────────────────────────────────────
MIR = M5 + '/mirror/tests/gates'
REFD = M5 + '/ref/tests/gates'
PRE = M5 + '/pre'
TMP = M5 + '/tmp'
for d in (MIR, REFD, PRE, TMP):
    os.makedirs(d, exist_ok=True)
for top in (M5 + '/mirror', M5 + '/ref'):
    hl = top + '/tests/harness.js'
    if os.path.lexists(hl):
        os.unlink(hl)
    os.symlink(os.path.join(ROOT, 'tests/harness.js'), hl)
B229, B225 = M5 + '/base_v229.html', M5 + '/base_v225.html'
for f, c in ((B229, V229_COMMIT), (B225, V225_COMMIT)):
    with open(f, 'wb') as fh:
        fh.write(subprocess.run(['git', '-C', ROOT, 'show', c + ':index.html'], capture_output=True, check=True).stdout)
for rel, src in result.items():
    with open(os.path.join(MIR, os.path.basename(rel)), 'w', encoding='utf-8') as fh:
        fh.write(src)
# the probe copy: the D190 lattice (enum, and the lat shards an enum queues) removed; every other job as the gate runs it
PROBE_ANCHOR = 'const ENUM = {};   // ck -> the enumerated chains'
if result[G230].count(PROBE_ANCHOR) != 1:
    die('probe anchor count != 1')
probe = result[G230].replace(PROBE_ANCHOR, "JOBS.splice(0, JOBS.length, ...JOBS.filter(j => j.kind !== 'enum'));   // PROBE ONLY (scratch): no D190 lattice\n" + PROBE_ANCHOR)
PROBE = MIR + '/g230_probe.js'
with open(PROBE, 'w', encoding='utf-8') as fh:
    fh.write(probe)
# the reference g226_d189: the file as it stands in the repo (HEAD + G3d)
with open(os.path.join(REFD, os.path.basename(G189)), 'w', encoding='utf-8') as fh:
    fh.write(open(os.path.join(ROOT, G189), encoding='utf-8').read())
for p in (os.path.join(MIR, os.path.basename(G230)), PROBE, os.path.join(MIR, os.path.basename(G189))):
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode != 0:
        die('node --check ' + p + ': ' + r.stderr[-400:])
    print('node --check ok ' + p)
env = dict(os.environ, TMPDIR=TMP)
env.pop('IA_ASSUME_VERSION', None)
RUNS = {
    ('g230', 'cand'): (PROBE, CAND, B229), ('g230', 'v230'): (PROBE, BASE, B229),
    ('g189', 'cand'): (os.path.join(MIR, os.path.basename(G189)), CAND, B225), ('g189', 'v230'): (os.path.join(MIR, os.path.basename(G189)), BASE, B225),
    ('g189ref', 'v230'): (os.path.join(REFD, os.path.basename(G189)), BASE, B225),
}
procs = {}
for k, (g, art, base) in RUNS.items():
    out = open('%s/%s_%s.out' % (PRE, k[0], k[1]), 'w')
    procs[k] = (subprocess.Popen(['bash', '-c', 'set -eo pipefail; node "$0" "$1" "$2"', g, art, base], stdout=out, stderr=subprocess.STDOUT, env=env), out)
OUT = {}
for k, (p, fh) in procs.items():
    p.wait(); fh.close()
    OUT[k] = open('%s/%s_%s.out' % (PRE, k[0], k[1]), encoding='utf-8').read()
    print('ran %s on %s: exit %d' % (k[0], k[1], p.returncode))

bad = []
def want(k, pat, label):
    if re.search(pat, OUT[k], re.M):
        print('  figure ok  %s %s: %s' % (k[0], k[1], label))
    else:
        bad.append('%s %s: %s' % (k[0], k[1], label))
        print('  FIGURE NOT AS RULED  %s %s: %s' % (k[0], k[1], label))
def show(k, pat):
    for line in re.findall(pat, OUT[k], re.M):
        print('    | ' + line[:420])
for t in ('cand', 'v230'):
    print('===== g230 probe %s' % t); show(('g230', t), r'^(?:  L1: .*|    d193-k .*|    d193-l .*|    d194-fixture .*|    d194-postsweep \(i\) .*|    d194-postsweep typed .*|SKIP row .*|(?:PASS|FAIL) row (?:inst-\S+|d194-fixture|d193-e|d193-k″|d193-e′|d193-k|d193-l|d194-postsweep) .*|PASS \d+ FAIL \d+)$')
    print('===== g226_d189 %s' % t); show(('g189', t), r'^(?:    G6b .*|SKIP row .*|(?:PASS|FAIL) G6b .*|FAIL .*|PASS \d+ FAIL \d+)$')
C, V = ('g230', 'cand'), ('g230', 'v230')
# d193-k on the candidate (with D198)
want(C, r'^    d193-k candidate STAMP: pairs 150989 \| clamp pairs 1253 \| hold variants 1253 \(verbatim 694, unloadable 360, window 199; clamp pairs without it 0\) \| false claims 0 \| hold toasts off the clamp set 0 \| INFO capped 458 ', 'd193-k pairs 150,989, clamp 1,253 = hold variants (694/360/199), false 0, off 0, INFO 458')
want(C, r'^    d193-k STAMP == CFG \(candidate\): aligned true, card differs 0, toast differs 0 of 150989 \| non-clamp toasts == V229 STAMP 141557/141557', 'd193-k STAMP == CFG 0/0 of 150,989, non-clamp 141,557/141,557')
want(C, r'^    d193-k bed-thrust donor \(Single-leg hip thrust \(shoulders on bed\)\) on candidate STAMP: pairs \d+ \| clamp pairs 10, hold variants 10 \|\| V229 STAMP: pairs 0, clamp pairs 0 ', 'd193-k bed-thrust donor clamp 10, hold variants 10 (V229 0)')
want(C, r'^PASS row d193-k +\[V231 D196-1\] ', 'd193-k PASS on the candidate')
# d193-l on the candidate
want(C, r'^    d193-l candidate STAMP: G3a 839 \(529 / 199 / 111, miss 0\), G3c power 0 of \d+, G3c-off 172 of \d+ \(miss 0\), G3d 263 of \d+ \(miss 0\), G3e 205 of \d+ \(miss 0\), G3f 199 of \d+ \(miss 0\)$', 'd193-l G3a 839 (529/199/111), power 0, off 172, G3d 263, G3e 205, G3f 199, misses 0')
want(C, r'^    d193-l bed-thrust donor on candidate STAMP: G3a moved 7, G3c-off 4, G3e 3, G3d 0, G3f 0 \|\| V229 STAMP: G3a 0, G3c-off 0, G3e 0 ', 'd193-l bed-thrust donor G3a 7, off 4, null 3 (G3d 0, G3f 0; V229 0)')
want(C, r'^PASS row d193-l +\[V231 D196-1\] ', 'd193-l PASS on the candidate')
# d194-fixture on the candidate
want(C, r'^SKIP row d194-fixture CLAIM .*This tree: L1 \d+/150989 \(card differs \d+, toast \d+, aligned (?:true|false)\), pairs \d+/\d+ \(V229 pairs 150068\)\. Never PASS, never FAIL\.$', 'd194-fixture SKIP at column 0 (150,989 vs 150,068)')
if re.search(r'^(?:PASS|FAIL) row d194-fixture', OUT[C], re.M):
    bad.append('g230 cand: d194-fixture printed PASS or FAIL at 231')
# d194-postsweep on the candidate
for nm in ('candidate OV1', 'candidate fixture'):
    want(C, r'^    d194-postsweep \(i\) %s: builds 432, lifting days 12960 \| rejects 0 \(drops 0, re-details 0, renames 0\) on 0 days in 0 builds \| ruled 0 \(V231 re-key\)' % nm, 'postsweep %s rejects 0 (432 builds, 12,960 days)' % nm)
for nm in ('V229 OV1', 'V229 fixture'):
    want(C, r'^    d194-postsweep \(i\) %s: builds 432, lifting days 12960 \| rejects 22 \(drops 18, re-details 4, renames 0\) on 22 days in 11 builds \| == the typed table true' % nm, 'postsweep %s == the typed 22' % nm)
want(C, r'^SKIP row d194-postsweep \(ii\) .*\(OV1 0, fixture 0 rejects\).*Never PASS, never FAIL\.$', 'postsweep (ii) SKIP at column 0')
want(C, r'^PASS row d194-postsweep INFO \[V231 re-key', 'postsweep PASS on the candidate')
for row in ('inst-self', 'inst-stamp', 'inst-ov1', 'd193-e', 'd193-k″', 'd193-e′'):
    want(C, r'^PASS row %s ' % re.escape(row), row + ' PASS on the candidate (untouched row)')
# V230 as the candidate: the 231 conjuncts fail there; no SKIP; row lines == HEAD's run
want(V, r'^    d193-k candidate STAMP: pairs 150068 \| clamp pairs 1243 ', 'V230 d193-k 150,068 / 1,243 (the 231 pins fail there)')
want(V, r'^    d193-k bed-thrust donor \(Single-leg hip thrust \(shoulders on bed\)\) on candidate STAMP: pairs \d+ \| clamp pairs 0, hold variants 0 ', 'V230 bed-thrust donor clamp 0 (the conjunct fails there)')
want(V, r'^    d193-l bed-thrust donor on candidate STAMP: G3a moved 0, G3c-off 0, G3e 0, ', 'V230 bed-thrust donor G3a 0, off 0, null 0')
want(V, r'^    d193-l candidate STAMP: G3a 832 \(529 / 199 / 104, miss 0\)', 'V230 G3a 832 (the 231 pin 839 fails there)')
want(V, r'^    d194-postsweep \(i\) candidate OV1: builds 432, lifting days 12960 \| rejects 22 \(drops 18, re-details 4, renames 0\)', 'V230 postsweep candidate OV1 rejects 22 (the 231 conjunct 0 fails there)')
want(V, r'^    d194-fixture \(claim\) L1 candidate CFG == V229 CFG: aligned true, card differs 0, toast differs 0 of 150068', 'V230 d194-fixture 150,068/150,068')
if re.search(r'^SKIP ', OUT[V], re.M):
    bad.append('g230 v230: a SKIP line printed at 230')
KEYS = r'(?:inst-self|inst-stamp|inst-ov1|d194-fixture|d193-e|d193-k″|d193-e′|d193-k|d193-l|d194-postsweep) '
rows230 = lambda s: [l for l in s.split('\n') if re.match(r'^(?:PASS|FAIL|SKIP) row ' + KEYS, l)]
ra, rb = rows230(open(REF230, encoding='utf-8').read()), rows230(OUT[V])
if ra == rb and len(ra) == 10:
    print('  V230 row lines unchanged g230 (%d rows vs %s; the lattice rows are not in the probe)' % (len(ra), REF230))
else:
    bad.append('g230 v230 row lines differ from ' + REF230)
    for x, y in zip(ra, rb):
        if x != y:
            print('    was ' + x[:300]); print('    now ' + y[:300])
# g226_d189 G6b
G, GV = ('g189', 'cand'), ('g189', 'v230')
want(G, r'^    G6b lifting days vs V225 \(every week and day, its sections\): cells differing 640 of 640, ', 'G6b cand lifting days differ on 640/640 cells')
want(G, r'^SKIP row G6b whole-program byte equality with V225 ', 'G6b SKIP at column 0')
want(G, r'^PASS G6b .*\[V231 split: .*\(640/640 cells \(ruled 640\), lifting days differ on 640/640 cells \(ruled 640\)\)$', 'G6b PASS on the candidate, S1 640/640')
want(G, r'^PASS \d+ FAIL 0$', 'g226_d189 candidate summary FAIL 0')
want(GV, r'^    G6b lifting days vs V225 \(every week and day, its sections\): cells differing 0 of 640, days differing 0$', 'G6b V230 lifting days differ on 0 cells (the 231 conjunct fails there)')
want(GV, r'^PASS \d+ FAIL 0$', 'g226_d189 V230 summary FAIL 0')
if re.search(r'^SKIP ', OUT[GV], re.M):
    bad.append('g226_d189 v230: a SKIP line printed at 230')
rows189 = lambda s: [l for l in s.split('\n') if re.match(r'^(?:PASS|FAIL|SKIP|NA) ', l)]
ra, rb = rows189(OUT[('g189ref', 'v230')]), rows189(OUT[GV])
if ra == rb and ra:
    print('  V230 row lines unchanged g226_d189 (%d lines vs the repo file as it stands)' % len(ra))
else:
    bad.append('g226_d189 v230 row lines differ from the repo file as it stands')
    for x, y in zip(ra, rb):
        if x != y:
            print('    was ' + x[:300]); print('    now ' + y[:300])
for k in OUT:
    if not re.search(r'^PASS \d+ FAIL \d+$', OUT[k], re.M):
        bad.append('%s %s: no PASS n FAIL n summary (crash)' % k)
if bad:
    die('PARKED (standing ruling 7), nothing written: ' + ' ; '.join(bad))
if dry:
    print('dry run: every figure as ruled; nothing written')
    sys.exit(0)
for rel, src in result.items():
    with open(os.path.join(ROOT, rel), 'w', encoding='utf-8') as fh:
        fh.write(src)
    r = subprocess.run(['node', '--check', os.path.join(ROOT, rel)], capture_output=True, text=True)
    if r.returncode != 0:
        die('node --check after write ' + rel + ': ' + r.stderr[-400:])
    print('wrote ' + os.path.join(ROOT, rel))
