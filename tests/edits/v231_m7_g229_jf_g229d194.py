#!/usr/bin/env python3
# V231 GATE MAINTENANCE G7: four row changes in two gate files, keyed to the V231 absorb ruling
# (tests/measure/v231_rulings/v231_absorb_ruling.md, section 3):
#   g229_d193_build  j        ABSORB + split at >= 231: held 30 = 28 same name + 2 renamed to the bed thrust (final-name
#                             Burpees 0, bed thrust held 2), unheld 102/102, number-only 0, uninjured R7 0; the
#                             "L1 uninjured 96/96 byte-identical" conjunct scoped <= 230 with a SKIP line (D196-1)
#   g229_d193_build  f        ABSORB at >= 231: NONCUE_L9 era 1,734 (A-1); below 231 1,722
#   g229_d194_lens   p-SWAP / p-AUX / p-ADD  SPLIT at >= 231 (plain split; the durable form does not hold on the
#                             candidate, see below): keep rejected 0, rows 0, OV == FIX 4,608 / 1,814 / 1,440 (typed);
#                             W3 == V228, FIX == V228 and the row-set symmetry they rest on scoped <= 230 with a SKIP line
#   g229_d194_lens   p-UNSTAMPED  SPLIT at >= 231: keep Thursday-from, travel, mario_noinj W3/W5; the HALF_MANNY W3/W5 ==
#                             V228 conjunct scoped <= 230 with a SKIP line
# Durable form (session call: "a FIX list differs from V228 only on a day whose built card differs from V228's"), probed
# before this script was written (scratchpad builder_m7/probe): candidate 61 FIX rows differ from V228 on a V228-identical
# day (3,646 of 4,032 W3+W5 days identical; e.g. L1#262 bodyweight lowback/workaround W5 tue Single-leg hip thrust), V230
# 0. It does not hold, so the plain split is used.
# G6's hunks in g229_d193 (header, newD, row b, d-BWSETS) are left as they stand. index.html is not touched.
#
#   python3 tests/edits/v231_m7_g229_jf_g229d194.py            figures on both trees from scratch copies, then edit in place
#   python3 tests/edits/v231_m7_g229_jf_g229d194.py --dry      figures only; the repo is untouched
#
# Refuses unless index.html and the V230 baseline read the briefed sha256 prefixes, g229_d194 is clean against HEAD,
# g229_d193 equals HEAD plus exactly G6's five g229 hunks (re-applied from tests/edits/v231_m6_g227_g229b.py), and every
# anchor occurs exactly once. Then it runs both edited copies (a scratch mirror whose tests/harness.js is the repo's) on
# the candidate and on V230, each against the V228 tree, and checks every ruled figure; a figure not as ruled parks the
# run (nothing is written). Aborts on the first miss.
import hashlib, os, re, subprocess, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad'
BASE = SCR + '/base_v230.html'
M7 = SCR + '/builder_m7'
CAND = os.path.join(ROOT, 'index.html')
SHA = {CAND: '1249c248a6794d1c', BASE: '72ac41c8d34034ce'}
V228_COMMIT = '2c1a89c85fc5c3193b8646a49fe94eed3f221fb1'
G193 = 'tests/gates/g229_d193_build.js'
G194 = 'tests/gates/g229_d194_lens.js'
G6 = 'tests/edits/v231_m6_g227_g229b.py'

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

dry = False
if len(sys.argv) == 2 and sys.argv[1] == '--dry':
    dry = True
elif len(sys.argv) != 1:
    die('usage: v231_m7_g229_jf_g229d194.py [--dry]')

for f, want in SHA.items():
    got = hashlib.sha256(open(f, 'rb').read()).hexdigest()[:16]
    if got != want:
        die('%s sha256 %s, want %s' % (f, got, want))
    print('sha ok %s %s' % (want, f))
if subprocess.run(['git', '-C', ROOT, 'diff', '--quiet', 'HEAD', '--', G194]).returncode != 0:
    die(G194 + ' is not clean against HEAD')
print('clean vs HEAD ' + G194)
# g229_d193: HEAD + G6's five g229 hunks, byte for byte
g6src = open(os.path.join(ROOT, G6), encoding='utf-8').read()
a, b = g6src.find('EDITS = {G227: [], G229: []}'), g6src.find('# ── apply')
if a < 0 or b < 0:
    die(G6 + ' does not carry its EDITS block')
ns = {'G227': 'tests/gates/g227_d190_cuecap.js', 'G229': G193}
exec(g6src[a:b], ns)
head193 = subprocess.run(['git', '-C', ROOT, 'show', 'HEAD:' + G193], capture_output=True, check=True).stdout.decode('utf-8')
for name, old, new in ns['EDITS'][G193]:
    if head193.count(old) != 1:
        die('G6 hunk "%s" does not apply to HEAD:%s' % (name, G193))
    head193 = head193.replace(old, new)
if open(os.path.join(ROOT, G193), encoding='utf-8').read() != head193:
    die(G193 + ' is not HEAD plus exactly G6\'s five hunks')
print('clean vs HEAD + G6 (%d hunks) %s' % (len(ns['EDITS'][G193]), G193))

SUCC = 'successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d'
RUL = 'the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3)'
EDITS = {G193: [], G194: []}

# ── g229_d193 (1/7): VERSION PREDICATE header, rows j and f at 231 ─────────────────────────────────────────────────
EDITS[G193].append(('header j f', r'''//                  RPE != 7 0 (typed pins, the ruling's print; V230 renamed 0). Below 231 both rows assert as before.
''', r'''//                  RPE != 7 0 (typed pins, the ruling's print; V230 renamed 0). Below 231 both rows assert as before.
//                  j ABSORBS D196-1 and SPLITS: the 30 held L1 test cards read R7's text, 28 under their V228 name and 2
//                  renamed `Burpees` to `Single-leg hip thrust (shoulders on bed)` (final-name Burpees 0, bed thrust held
//                  2), unheld 102/102, number-only 0, uninjured R7 0; its "L1 uninjured 96/96 byte-identical" conjunct
//                  (the candidate prints 27/96) asserts at 230 and below only and at 231 and up prints one named SKIP line
//                  naming row b's successors (typed pins, the ruling's print; V230 bed thrust held 0). f ABSORBS A-1:
//                  the L9 non-cue population is 1,734 at 231 and up (V230 1,722; the one moved string is
//                  `2×6–10 each @ RPE 7`, 2 to 14). Below 231 both rows assert as before.
'''))

# ── g229_d193 (2/7): j accumulator + the typed D196-1 pins ──────────────────────────────────────────────────────────
EDITS[G193].append(('JJ + j pins', r'''  const JJ = { held:0, heldOK:0, burpees:0, unheld:0, unheldUn:0, unheldSame:0, r7L1:0, r7Un:0, r7Other:0, numOnly:0, l1Un:0, l1UnSame:0, heldOther:0, heldOtherOK:0, unheldOther:0, unheldOtherSame:0, ex:[] };
''', r'''  const JJ = { held:0, heldOK:0, burpees:0, unheld:0, unheldUn:0, unheldSame:0, r7L1:0, r7Un:0, r7Other:0, numOnly:0, l1Un:0, l1UnSame:0, heldOther:0, heldOtherOK:0, unheldOther:0, unheldOtherSame:0, ex:[],
    burpC:0, bed:0, ren:0, renBurp:0, renTab:{} };
  // V231 (absorb ruling section 3, g229_d193:456 j, class D196-1): on the candidate the held L1 test cards are read by
  // their final name too. Typed pins, the ruling's print: 28 same name + 2 renamed `Burpees` > the bed thrust with R7's
  // text, final-name Burpees 0, bed thrust held 2.
  const J_BURP = 'Burpees', J_BED = 'Single-leg hip thrust (shoulders on bed)', J_V231 = { same:28, ren:2, burpees:0, bed:2 };
'''))

# ── g229_d193 (3/7): j counting by the candidate's final name (counted on every tree; asserted at 231 and up) ──────
EDITS[G193].append(('j held count', r'''        if(tag === 'L1'){ JJ.held++; if(good) JJ.heldOK++; if(burp) JJ.burpees++; } else { JJ.heldOther++; if(good) JJ.heldOtherOK++; }
''', r'''        if(tag === 'L1'){ JJ.held++; if(good) JJ.heldOK++; if(burp) JJ.burpees++;
          if(!!c && c.n === J_BURP) JJ.burpC++;
          if(!!c && c.n === J_BED){ JJ.bed++; if(!sameName && cd === R7_T){ JJ.ren++; if(b.n === J_BURP) JJ.renBurp++; tally(JJ.renTab, b.n + ' > ' + c.n); } } }
        else { JJ.heldOther++; if(good) JJ.heldOtherOK++; }
'''))

# ── g229_d193 (4/7): row j absorb + split ───────────────────────────────────────────────────────────────────────────
EDITS[G193].append(('row j split', r'''  ok(R.j, selfAll && JJ.held === J_HELD && JJ.heldOK === J_HELD && JJ.burpees === J_BURPEES''', r'''  // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g229_d193:456 j ABSORB + split, class D196-1;
  // standing rulings 2 and 4): at 231 and up the row asserts held 30 = 28 same name + 2 renamed `Burpees` > the bed
  // thrust (R7's text), final-name Burpees 0, bed thrust held 2, unheld 102/102, number-only 0, uninjured R7 0; its
  // "L1 uninjured byte-identical to V228" conjunct asserts at 230 and below only and at 231 and up prints one named SKIP
  // line at column 0, never PASS and never FAIL. Below 231 the row is unchanged.
  console.log('    j L1 held test cards by the candidate\'s final name: ' + J_BURP + ' ' + JJ.burpC + ', ' + J_BED + ' ' + JJ.bed + ' (renamed with R7\'s text ' + JJ.ren + ', from ' + J_BURP + ' ' + JJ.renBurp + ': ' + fmt(JJ.renTab) + ')');
  if(VER >= V231_ERA){
    console.log('SKIP row j L1 uninjured byte-identical to V228 (' + JJ.l1UnSame + '/' + JJ.l1Un + ' on this tree): scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d. Never PASS, never FAIL.');
    ok(R.j + ' [V231 D196-1: held ' + J_HELD + ' = ' + J_V231.same + ' same name + ' + J_V231.ren + ' renamed to the bed thrust, final-name Burpees ' + J_V231.burpees + '; the L1 uninjured byte-identical conjunct SKIPs]',
      selfAll && JJ.held === J_HELD && JJ.heldOK === J_V231.same && JJ.ren === J_V231.ren && JJ.renBurp === J_V231.ren && JJ.heldOK + JJ.ren === JJ.held && JJ.burpC === J_V231.burpees && JJ.bed === J_V231.bed
        && JJ.unheld === J_UNHELD && JJ.unheldSame === J_UNHELD && JJ.r7L1 === J_HELD && JJ.r7Un === 0 && JJ.numOnly === 0 && JJ.l1Un === J_UNINJ && JJ.heldOtherOK === JJ.heldOther && JJ.unheldOtherSame === JJ.unheldOther,
      'R7 on ' + JJ.heldOK + ' same name + ' + JJ.ren + ' renamed of ' + JJ.held + ' held, final-name Burpees ' + JJ.burpC + ', bed thrust held ' + JJ.bed + ', unheld ' + JJ.unheldSame + '/' + JJ.unheld + ', number-only ' + JJ.numOnly + ', uninjured R7 ' + JJ.r7Un + ', L1 uninjured builds ' + JJ.l1Un);
  }
  else ok(R.j, selfAll && JJ.held === J_HELD && JJ.heldOK === J_HELD && JJ.burpees === J_BURPEES'''))

# ── g229_d193 (5/7): f era constant ─────────────────────────────────────────────────────────────────────────────────
EDITS[G193].append(('f era const', r'''  const lit = n => E(XF, 'typeof ' + n + "==='string'?" + n + ':null');
''', r'''  // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g229_d193:508 f ABSORB, class A-1; standing
  // rulings 2 and 4): the L9 non-cue population is 1,734 at 231 and up (typed, the ruling's print), 1,722 below.
  const V231_ERA = 231, NONCUE_V231 = 1734, nonCue = VER >= V231_ERA ? NONCUE_V231 : NONCUE_L9;
  const lit = n => E(XF, 'typeof ' + n + "==='string'?" + n + ':null');
'''))

# ── g229_d193 (6/7): f print reads the era figure ───────────────────────────────────────────────────────────────────
EDITS[G193].append(('f print', r'''' (ruled ' + NONCUE_L9 + ')''', r'''' (ruled ' + nonCue + ')'''))

# ── g229_d193 (7/7): f row asserts the era figure ───────────────────────────────────────────────────────────────────
EDITS[G193].append(('f ok', r'''  ok(R.f, litOK && viaConst === TEST_T && test !== null && stripAll([test])[0] === TEST_T && handBad.length === 0 && pop.length === NONCUE_L9 && ''',
r'''  ok(R.f + (VER >= V231_ERA ? ' [V231 A-1: L9 non-cue 1,734]' : ''), litOK && viaConst === TEST_T && test !== null && stripAll([test])[0] === TEST_T && handBad.length === 0 && pop.length === nonCue && '''))

# ── g229_d194 (1/4): VERSION PREDICATE header, the 231 era ─────────────────────────────────────────────────────────
EDITS[G194].append(('header 231 era', r'''//               (q) asserts exactly as before.
''', r'''//               (q) asserts exactly as before.
//   231 and up  (tests/measure/v231_rulings/v231_absorb_ruling.md section 3; standing rulings 2 and 4) p-SWAP, p-AUX and
//               p-ADD SPLIT: they keep rejected 0, rows >= 1 rejected 0, OV == FIX on every stamped W5 row, every W5 row
//               stamped, W3 unstamped and the judge not blind, at the V231 row counts 4,608 / 1,814 / 1,440 (typed, the
//               ruling's print; V230 4,529 / 1,754 / 1,440). Their "pre-from W3 == V228" and "FIX W3+W5 == V228"
//               conjuncts and the row-set symmetry those two rest on (the candidate prints 5,202/5,460, 1,506/1,602,
//               1,344/1,440 and 8,595/9,174, 3,491/3,704, 2,691/2,880) assert at 230 and below only. The durable form
//               ("a FIX list differs from V228 only on a day whose built card differs from V228's") was probed and does
//               not hold on the candidate (61 FIX rows differ on V228-identical days, e.g. bodyweight lowback/workaround
//               W5 tue Single-leg hip thrust; V230 0), so the split is plain. p-UNSTAMPED SPLITS: it keeps Thursday-from, the
//               travel-only overlay and mario_noinj W3/W5 == V228 32/32 32/32; its HALF_MANNY W3/W5 == V228 conjunct
//               (the candidate prints 27/31, 26/30, the moved lists on the A-1 Tuesday card) asserts at 230 and below
//               only. At 231 and up each scoped conjunct prints one named SKIP line at column 0 naming the successors
//               g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d, never PASS and never
//               FAIL. Below 231 the four rows assert exactly as before.
'''))

# ── g229_d194 (2/4): the V231 row counts ────────────────────────────────────────────────────────────────────────────
EDITS[G194].append(('W231', r'''  travel:32, manny:{ w3:30, w5:29 }, noinj:{ w3:32, w5:32 }, bridge:{ base:[9, 390] }, halfstep:19,
};
''', r'''  travel:32, manny:{ w3:30, w5:29 }, noinj:{ w3:32, w5:32 }, bridge:{ base:[9, 390] }, halfstep:19,
};
// V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, p-SWAP / p-AUX / p-ADD SPLIT): the W5 row counts the
// kept conjuncts read at 231 and up (typed, the ruling's print; V230 reads W.L1).
const V231_ERA = 231, W231 = { pat:4608, aux:1814, add:1440 };
'''))

# ── g229_d194 (3/4): p-UNSTAMPED split ──────────────────────────────────────────────────────────────────────────────
EDITS[G194].append(('p-UNSTAMPED split', r'''  lines.forEach(l => P('    p-UNSTAMPED ' + l));
  RES.pUNS = [SELF && okThu && okTV && okU, ''', r'''  const dayMv = (A, B) => DAYS.map(d => { const e = eqL(A, B, [d]); return (e.eq === e.n && e.nb === e.n) ? null : d + ' ' + e.eq + '/' + e.n + (e.nb !== e.n ? ' (V228 ' + e.nb + ' rows)' : ''); }).filter(Boolean).join(', ') || 'none';
  lines.push('HALF_MANNY lists differing from V228 by day: W3 ' + dayMv(U.mannyC.w3, U.mannyB.w3) + ' | W5 ' + dayMv(U.mannyC.w5, U.mannyB.w5));
  lines.forEach(l => P('    p-UNSTAMPED ' + l));
  // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, p-UNSTAMPED SPLIT; standing rulings 2 and 4): at
  // 231 and up the row keeps Thursday-from, travel-only and mario_noinj W3/W5 == V228; the HALF_MANNY W3/W5 == V228
  // conjunct asserts at 230 and below only and at 231 and up prints one named SKIP line at column 0.
  if(VER >= V231_ERA){ const okN = un3.all && un3.n === W.noinj.w3 && un5.all && un5.n === W.noinj.w5;
    P('SKIP row p-UNSTAMPED HALF_MANNY W3/W5 lists == V228 (W3 ' + um3.eq + '/' + um3.n + ', W5 ' + um5.eq + '/' + um5.n + ' on this tree): scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d. Never PASS, never FAIL.');
    R.pUNS += ' [V231 split: Thursday-from, travel-only, mario_noinj W3/W5 == V228; the HALF_MANNY W3/W5 conjunct SKIPs]';
    RES.pUNS = [SELF && okThu && okTV && okN, 'Thursday-from thu/fri/sat rejected ' + c.thu.rej + '/' + c.fri.rej + '/' + c.sat.rej + ', mon/tue == V228 ' + (eqMon.all && eqTue.all) + (okThu ? '' : ' (Thursday-from not as ruled)') + '; travel ' + eqTV.eq + '/' + eqTV.n + '; mario_noinj W3 ' + un3.eq + '/' + un3.n + ', W5 ' + un5.eq + '/' + un5.n + (okN ? '' : ' MOVED')]; }
  else RES.pUNS = [SELF && okThu && okTV && okU, '''))

# ── g229_d194 (4/4): p-SWAP / p-AUX / p-ADD split ───────────────────────────────────────────────────────────────────
EDITS[G194].append(('p-SWAP/AUX/ADD split', r'''    RES[row] = [c, 'rejected ' + S.rej + ' of ' + S.offers + ', rows >= 1 rejected ' ''', r'''    // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, p-SWAP / p-AUX / p-ADD SPLIT, classes B-1, A-1
    // and D196 via the cards; standing rulings 2 and 4): at 231 and up the row keeps every conjunct but the two "== V228"
    // ones and the row-set symmetry they rest on, at the W231 row counts; those print one named SKIP line at column 0.
    if(VER >= V231_ERA){ const w2 = W231[k], asym = L.filter(x => !x.sym.every(Boolean)).length;
      const c2 = allCfg && SELF && S.n5 === w2 && S.st5 === w2 && S.rej === 0 && S.cards === 0 && S.eqFix === w2 && S.fixMiss === 0 && S.n3 > 0 && S.st3 === 0 && S.rej3 > 0 && S.nf > 0;
      P('SKIP row ' + row.replace(/^p/, 'p-') + ' pre-from W3 OV lists == V228 (' + S.eq3 + '/' + S.n3 + '), FIX W3+W5 lists == V228 (' + S.eqf + '/' + S.nf + ') and the row-set symmetry they rest on (' + asym + ' of ' + seen.size + ' cfgs asymmetric) on this tree: scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d. Never PASS, never FAIL.');
      R[row] += ' [V231 split: rejected 0, rows 0, OV == FIX ' + w2 + '/' + w2 + '; W3 == V228, FIX == V228 and the row-set symmetry SKIP]';
      RES[row] = [c2, 'rejected ' + S.rej + ' of ' + S.offers + ', rows >= 1 rejected ' + S.cards + ' of ' + S.n5 + ', OV == FIX ' + S.eqFix + '/' + S.st5 + (allCfg ? '' : '; L1 sweep incomplete (' + seen.size + ' cfgs)') + (S.rej3 > 0 ? '' : '; judge blind on W3')]; }
    else RES[row] = [c, 'rejected ' + S.rej + ' of ' + S.offers + ', rows >= 1 rejected ' '''))

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

# ── figures on both trees from scratch copies, before anything is written ───────────────────────────────────────────
MIR = M7 + '/mirror/tests/gates'
PRE = M7 + '/pre'
TMP = M7 + '/tmp'
for d in (MIR, PRE, TMP):
    os.makedirs(d, exist_ok=True)
hl = M7 + '/mirror/tests/harness.js'
if os.path.lexists(hl):
    os.unlink(hl)
os.symlink(os.path.join(ROOT, 'tests/harness.js'), hl)
B228 = M7 + '/base_v228.html'
with open(B228, 'wb') as fh:
    fh.write(subprocess.run(['git', '-C', ROOT, 'show', V228_COMMIT + ':index.html'], capture_output=True, check=True).stdout)
for rel, src in result.items():
    with open(os.path.join(MIR, os.path.basename(rel)), 'w', encoding='utf-8') as fh:
        fh.write(src)
    r = subprocess.run(['node', '--check', os.path.join(MIR, os.path.basename(rel))], capture_output=True, text=True)
    if r.returncode != 0:
        die('node --check ' + rel + ': ' + r.stderr[-400:])
    print('node --check ok ' + rel)
env = dict(os.environ, TMPDIR=TMP)
env.pop('IA_ASSUME_VERSION', None)
TREES = {'cand': CAND, 'v230': BASE}
procs = {}
for g in ('g229_d193_build', 'g229_d194_lens'):
    for t, art in TREES.items():
        out = open('%s/%s_%s.out' % (PRE, g, t), 'w')
        procs[(g, t)] = (subprocess.Popen(['bash', '-c', 'set -eo pipefail; node "$0" "$1" "$2"', os.path.join(MIR, g + '.js'), art, B228], stdout=out, stderr=subprocess.STDOUT, env=env), out)
OUT = {}
for k, (p, fh) in procs.items():
    p.wait(); fh.close()
    OUT[k] = open('%s/%s_%s.out' % (PRE, k[0], k[1]), encoding='utf-8').read()
    print('ran %s on %s: exit %d' % (k[0], k[1], p.returncode))

bad = []
def want(k, pat, label):
    s = OUT[k]
    if re.search(pat, s, re.M):
        print('  figure ok  %s %s: %s' % (k[0], k[1], label))
    else:
        bad.append('%s %s: %s' % (k[0], k[1], label))
        print('  FIGURE NOT AS RULED  %s %s: %s' % (k[0], k[1], label))
def show(k, pat):
    for line in re.findall(pat, OUT[k], re.M):
        print('    | ' + line[:400])
D, P = 'g229_d193_build', 'g229_d194_lens'
for t in TREES:
    print('===== %s %s' % (D, t)); show((D, t), r'^(?:    j .*|    f .*|SKIP row [jbf] .*|(?:PASS|FAIL) row [bjf] .*|PASS \d+ FAIL \d+)$')
    print('===== %s %s' % (P, t)); show((P, t), r'^(?:    p[A-Z]{3,4} L1.*|    p-UNSTAMPED .*|SKIP row p.*|(?:PASS|FAIL) row p-.*|PASS \d+ FAIL \d+)$')
# j
want((D, 'cand'), r'^    j L1: held test cards 30 \(ruled 30; final-name uncapped Burpees 2, ruled 2\) reading R7 28 \| unheld test cards byte-identical 102/102 .*\| R7 on L1 30, elsewhere injured 0, on uninjured 0 \| number-only anywhere 0 \| L1 uninjured byte-identical 27/96', 'j held 30, same name 28, unheld 102/102, uninjured R7 0, number-only 0, L1 uninjured 27/96')
want((D, 'cand'), r"^    j L1 held test cards by the candidate's final name: Burpees 0, Single-leg hip thrust \(shoulders on bed\) 2 \(renamed with R7's text 2, from Burpees 2: Burpees > Single-leg hip thrust \(shoulders on bed\) 2\)$", 'j final-name Burpees 0, bed thrust held 2, renamed 2 from Burpees')
want((D, 'cand'), r'^SKIP row j L1 uninjured byte-identical to V228 \(27/96 on this tree\)', 'j SKIP line at column 0 (27/96)')
want((D, 'cand'), r'^PASS row j ', 'j PASS on the candidate')
want((D, 'v230'), r'^    j L1: held test cards 30 \(ruled 30; final-name uncapped Burpees 2, ruled 2\) reading R7 30 \| unheld test cards byte-identical 102/102 .*\| L1 uninjured byte-identical 96/96', 'j V230 held 30 reading R7 30, L1 uninjured 96/96')
want((D, 'v230'), r"^    j L1 held test cards by the candidate's final name: Burpees 2, Single-leg hip thrust \(shoulders on bed\) 0 \(renamed with R7's text 0, from Burpees 0: \(none\)\)$", 'j V230 bed thrust held 0 (the 231 conjunct fails there)')
# f
want((D, 'cand'), r'L9 non-cue cards false strips 0/1734 \(ruled 1734\) \| HALF_MANNY "tank" cards 9 \(ruled 9\), stripped 0 \| distinct non-cue details of every build false strips 0/360$', 'f 1,734, false strips 0, tank 9, distinct 0/360')
want((D, 'cand'), r'^PASS row f .*\[V231 A-1: L9 non-cue 1,734\]', 'f PASS on the candidate')
want((D, 'v230'), r'L9 non-cue cards false strips 0/1722 \(ruled 1722\)', 'f V230 1,722 (the 231 figure 1,734 fails there)')
# p-SWAP / p-AUX / p-ADD
for row, k, n5, off, w3, fx in (('pSWAP', 'pat', 4608, 39258, '5202/5460', '8595/9174'), ('pAUX', 'aux', 1814, 17549, '1506/1602', '3491/3704'), ('pADD', 'add', 1440, 19059, '1344/1440', '2691/2880')):
    want((P, 'cand'), r'^    %s L1 cfgs 288 \| W5 %s rows %d \(stamped %d\) \| rejected 0 of %d \| rows >= 1 rejected 0 \| OV == FIX %d/%d \(OV longer 0, FIX row missing 0\) \| W3 OV == V228 %s .*\| FIX W3\+W5 == V228 %s$' % (row, k, n5, n5, off, n5, n5, w3, fx),
         '%s rejected 0/%d, rows 0, OV == FIX %d/%d, W3 %s, FIX %s' % (row, off, n5, n5, w3, fx))
    want((P, 'cand'), r'^SKIP row %s pre-from W3 OV lists == V228 \(%s\), FIX W3\+W5 lists == V228 \(%s\)' % (row.replace('p', 'p-', 1), w3, fx), row + ' SKIP line at column 0')
    want((P, 'cand'), r'^PASS row %s ' % row.replace('p', 'p-', 1), row + ' PASS on the candidate')
for row, k, n5 in (('pSWAP', 'pat', 4529), ('pAUX', 'aux', 1754), ('pADD', 'add', 1440)):
    want((P, 'v230'), r'^    %s L1 cfgs 288 \| W5 %s rows %d \(stamped %d\) \| rejected 0 of \d+ \| rows >= 1 rejected 0 \| OV == FIX %d/%d .*\| W3 OV == V228 (\d+)/\1 .*\| FIX W3\+W5 == V228 (\d+)/\2$' % (row, k, n5, n5, n5, n5), row + ' V230 %d rows, W3 and FIX == V228 whole' % n5)
# p-UNSTAMPED
want((P, 'cand'), r'^    p-UNSTAMPED Thursday-from stamps C mon:- tue:- wed:- thu:S fri:S sat:S sun:- \| mon == V228 6/6, tue 7/7 .*\| rejected C thu 0/\d+ fri 0/\d+ sat 0/\d+ ', 'p-UNSTAMPED Thursday-from 0/0/0, mon 6/6, tue 7/7')
want((P, 'cand'), r'^    p-UNSTAMPED travel-only stamped tue,thu \| W5 == V228 32/32$', 'p-UNSTAMPED travel 32/32')
want((P, 'cand'), r'^    p-UNSTAMPED uninjured == V228: HALF_MANNY W3 27/31 W5 26/30 \| mario_noinj W3 32/32 W5 32/32$', 'p-UNSTAMPED HALF_MANNY 27/31 26/30, mario_noinj 32/32 32/32')
want((P, 'cand'), r'^SKIP row p-UNSTAMPED HALF_MANNY W3/W5 lists == V228 \(W3 27/31, W5 26/30 on this tree\)', 'p-UNSTAMPED SKIP line at column 0')
want((P, 'cand'), r'^PASS row p-UNSTAMPED ', 'p-UNSTAMPED PASS on the candidate')
want((P, 'v230'), r'^    p-UNSTAMPED uninjured == V228: HALF_MANNY W3 30/30 W5 29/29 \| mario_noinj W3 32/32 W5 32/32$', 'p-UNSTAMPED V230 HALF_MANNY 30/30 29/29')
want((P, 'v230'), r'^    p-UNSTAMPED HALF_MANNY lists differing from V228 by day: W3 none \| W5 none$', 'p-UNSTAMPED V230 no HALF_MANNY day moved')
# both gates whole on both trees; no SKIP of the new kind on V230; V230 row lines byte-identical to the current gates'
for k in OUT:
    want(k, r'^PASS \d+ FAIL 0$', 'summary FAIL 0')
for g in (D, P):
    if re.search(r'^SKIP row (?:j|p-SWAP|p-AUX|p-ADD|p-UNSTAMPED) ', OUT[(g, 'v230')], re.M):
        bad.append(g + ' v230: a V231 SKIP line printed below 231')
REF = {D: SCR + '/builder_m6/post_g229_v230.out', P: M7 + '/probe/d194_v230.out'}
rows = lambda s: [l for l in s.split('\n') if re.match(r'^(PASS|FAIL|SKIP) ', l)]
for g, ref in REF.items():
    a_, b_ = rows(open(ref, encoding='utf-8').read()), rows(OUT[(g, 'v230')])
    if a_ == b_ and a_:
        print('  V230 row lines unchanged %s (%d lines vs %s)' % (g, len(a_), ref))
    else:
        bad.append('%s v230 row lines differ from %s' % (g, ref))
        for x, y in zip(a_, b_):
            if x != y:
                print('    was ' + x[:300]); print('    now ' + y[:300])
if bad:
    die('PARKED (standing ruling 7), nothing written: ' + ' ; '.join(bad))
if dry:
    print('dry run: every figure as ruled; nothing written')
    sys.exit(0)
for rel, src in result.items():
    with open(os.path.join(ROOT, rel), 'w', encoding='utf-8') as fh:
        fh.write(src)
    print('wrote ' + os.path.join(ROOT, rel))
