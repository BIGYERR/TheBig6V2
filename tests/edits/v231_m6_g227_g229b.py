#!/usr/bin/env python3
# V231 GATE MAINTENANCE G6: four row changes in two gate files, keyed to the V231 absorb ruling
# (tests/measure/v231_rulings/v231_absorb_ruling.md, section 3):
#   g227_d190_cuecap  c-DIGEST  RE-KEY at >= 231: manny wants MANNY_DIGEST_BY_VERSION[VER], mario_noinj still V226 (A-1)
#   g227_d190_cuecap  c-UNINJ   RE-KEY at >= 231: mario_noinj 0 of 719; manny 144 of 677, all on W3 tue or W5 tue (A-1)
#   g229_d193_build   b         SPLIT at >= 231: object row, _preHold 0, MANNY era row kept; byte-identical conjuncts
#                               scoped <= 230 with a SKIP line naming the successors
#   g229_d193_build   d-BWSETS  ABSORB at >= 231: same name 1,169 + renamed 70 (D196-1 names) = 1,239, FORBID 0, RPE != 7 0
# Rows j and f of g229_d193 are G7's and are not touched. index.html is not touched.
#
#   python3 tests/edits/v231_m6_g227_g229b.py            edit both gate files in place
#   python3 tests/edits/v231_m6_g227_g229b.py --out DIR  write the edited copies to DIR (same checks; repo untouched)
#
# Refuses unless index.html and the V230 baseline read the briefed sha256 prefixes, both gate files are clean against
# HEAD, and every anchor occurs exactly once. Aborts on the first miss and writes nothing.
import hashlib, os, subprocess, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/base_v230.html'
SHA = {os.path.join(ROOT, 'index.html'): '1249c248a6794d1c', BASE: '72ac41c8d34034ce'}
G227 = 'tests/gates/g227_d190_cuecap.js'
G229 = 'tests/gates/g229_d193_build.js'

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

out_dir = None
if len(sys.argv) == 3 and sys.argv[1] == '--out':
    out_dir = sys.argv[2]
elif len(sys.argv) != 1:
    die('usage: v231_m6_g227_g229b.py [--out DIR]')

for f, want in SHA.items():
    got = hashlib.sha256(open(f, 'rb').read()).hexdigest()[:16]
    if got != want:
        die('%s sha256 %s, want %s' % (f, got, want))
    print('sha ok %s %s' % (want, f))
harness = open(os.path.join(ROOT, 'tests/harness.js'), encoding='utf-8').read()
if harness.count("MANNY_DIGEST_BY_VERSION[231] = '2d35e8f743680cfa'") != 1:
    die('tests/harness.js does not carry MANNY_DIGEST_BY_VERSION[231] = 2d35e8f743680cfa exactly once')
for rel in (G227, G229):
    r = subprocess.run(['git', '-C', ROOT, 'diff', '--quiet', 'HEAD', '--', rel])
    if r.returncode != 0:
        die(rel + ' is not clean against HEAD')
    print('clean vs HEAD ' + rel)

EDITS = {G227: [], G229: []}

# ── g227 (1/3): VERSION PREDICATE header, the 231 era ───────────────────────────────────────────────────────────────
EDITS[G227].append(('header 231 era', r'''//                  Below 229 c-TOAST asserts exactly as before.
''', r'''//                  Below 229 c-TOAST asserts exactly as before.
//   231 and up     c-DIGEST and c-UNINJ re-keyed (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, class A-1:
//                  HALF_MANNY's W1 to W12 Tuesdays gain D195 Amendment 2's fourth item). c-DIGEST: manny wants the
//                  harness era row MANNY_DIGEST_BY_VERSION[VER] (standing ruling 5; 2d35e8f743680cfa at 231; an absent
//                  row FAILS by name), mario_noinj still wants V226. c-UNINJ: mario_noinj 0 moved of 719 chains; manny
//                  144 moved of 677, every moved chain on W3 tue or W5 tue (typed pins, the ruling's print). Below 231
//                  both rows assert exactly as before. c-MANNY needs no change (it already reads MD[VER]).
'''))

# ── g227 (2/3): c-UNINJ ───────────────────────────────────────────────────────────────────────────────────────────────
EDITS[G227].append(('c-UNINJ ok', r'''    ok(R.cUNINJ, SELF_C && SELF_B && PAIRSELF && n > 0 && liveMoved > 0 && undos > 0 && replays > 0 && moved === 0, 'moved ' + moved + '/' + n + ' chains (live, boot, toast, undo, undo-boot)');
''', r'''    // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g227:454 c-UNINJ RE-KEY, class A-1; standing
    // rulings 2 and 4): at 231 and up HALF_MANNY's Tuesdays carry D195 Amendment 2's fourth item, so the pair against
    // V226 moves on manny's W3 tue and W5 tue chains only. Typed pins (the ruling's print, never this run): mario_noinj
    // 0 moved of 719; manny 144 moved of 677, every moved chain on W3 tue or W5 tue. Below 231 the row is unchanged.
    const V231_ERA = 231, UNINJ_PIN = { manny:{ n:677, moved:144 }, mario_noinj:{ n:719, moved:0 } }, UNINJ_DAYS = ['3|tue', '5|tue'];
    if(VER >= V231_ERA){
      const mvOf = ck => mv.filter(m => m.c.ck === ck), offDay = mv.filter(m => !UNINJ_DAYS.includes(m.c.w + '|' + m.c.d));
      const pinOK = UNINJ_CK.every(ck => POP[ck].length === UNINJ_PIN[ck].n && mvOf(ck).length === UNINJ_PIN[ck].moved);
      console.log('    c-UNINJ V231 (A-1): moved by chain day ' + fmt(tally(mv, m => m.c.ck + ' W' + m.c.w + ' ' + m.c.d)) + ' | moved off W3 tue / W5 tue ' + offDay.length + ' | typed pins ' + UNINJ_CK.map(ck => ck + ' ' + UNINJ_PIN[ck].moved + '/' + UNINJ_PIN[ck].n).join(', '));
      offDay.slice(0, 3).forEach(m => console.log('      off-day move: ' + tag(m.c) + ' fields ' + m.diff.join(',')));
      ok(R.cUNINJ + ' [V231 A-1: mario_noinj ' + UNINJ_PIN.mario_noinj.moved + ' of ' + UNINJ_PIN.mario_noinj.n + ', manny ' + UNINJ_PIN.manny.moved + ' of ' + UNINJ_PIN.manny.n + ', every move on W3 tue or W5 tue]',
        SELF_C && SELF_B && PAIRSELF && n > 0 && liveMoved > 0 && undos > 0 && replays > 0 && pinOK && offDay.length === 0 && moved === UNINJ_PIN.manny.moved + UNINJ_PIN.mario_noinj.moved,
        UNINJ_CK.map(ck => ck + ' moved ' + mvOf(ck).length + '/' + POP[ck].length).join(', ') + ', off W3 tue / W5 tue ' + offDay.length);
    }
    else ok(R.cUNINJ, SELF_C && SELF_B && PAIRSELF && n > 0 && liveMoved > 0 && undos > 0 && replays > 0 && moved === 0, 'moved ' + moved + '/' + n + ' chains (live, boot, toast, undo, undo-boot)');
'''))

# ── g227 (3/3): c-DIGEST ──────────────────────────────────────────────────────────────────────────────────────────────
EDITS[G227].append(('c-DIGEST want + ok', r'''    const wantOf = ck => (VER >= 228 && Object.prototype.hasOwnProperty.call(D193_DIGEST, ck)) ? D193_DIGEST[ck] : DG.B[ck];
    if(VER >= 228) console.log('    c-DIGEST at ' + VER + ': ' + Object.keys(D193_DIGEST).map(ck => ck + ' want ' + D193_DIGEST[ck]).join(', ') + ' (D193 class (i), measure); manny, mario_noinj want V' + BASE_ERA);
    const eq = Object.keys(CFGS).filter(ck => !/SELF/.test(DG.C[ck]) && !/SELF/.test(DG.B[ck]) && DG.C[ck] === wantOf(ck)).length;
    ok(R.cDIGEST + (VER >= 228 ? ' (at 228 and above: the six injured against the D193 class (i) table)' : ''), eq === Object.keys(CFGS).length, eq + '/' + Object.keys(CFGS).length + ' configs equal'); }
''', r'''    // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g227:474 c-DIGEST RE-KEY, class A-1; standing
    // rulings 2 and 5): at 231 and up manny wants the harness era row MANNY_DIGEST_BY_VERSION[VER] (2d35e8f743680cfa at
    // 231), never this run; an absent row wants the string ABSENT and fails the row by name. mario_noinj still wants V226.
    const V231_ERA = 231, MDV = H.MANNY_DIGEST_BY_VERSION || {};
    const mannyWant = (Object.prototype.hasOwnProperty.call(MDV, VER) && typeof MDV[VER] === 'string') ? MDV[VER] : 'ABSENT MANNY_DIGEST_BY_VERSION[' + VER + ']';
    const wantOf = ck => (VER >= V231_ERA && ck === 'manny') ? mannyWant : (VER >= 228 && Object.prototype.hasOwnProperty.call(D193_DIGEST, ck)) ? D193_DIGEST[ck] : DG.B[ck];
    if(VER >= 228) console.log('    c-DIGEST at ' + VER + ': ' + Object.keys(D193_DIGEST).map(ck => ck + ' want ' + D193_DIGEST[ck]).join(', ') + ' (D193 class (i), measure); ' + (VER >= V231_ERA ? 'manny wants MANNY_DIGEST_BY_VERSION[' + VER + '] ' + mannyWant + ' (V231 A-1, standing ruling 5; V' + BASE_ERA + ' reads ' + DG.B.manny + '), mario_noinj wants V' + BASE_ERA : 'manny, mario_noinj want V' + BASE_ERA));
    const eq = Object.keys(CFGS).filter(ck => !/SELF/.test(DG.C[ck]) && !/SELF/.test(DG.B[ck]) && DG.C[ck] === wantOf(ck)).length;
    ok(R.cDIGEST + (VER >= 228 ? ' (at 228 and above: the six injured against the D193 class (i) table)' : '') + (VER >= V231_ERA ? ' (at 231 and above: manny against MANNY_DIGEST_BY_VERSION[' + VER + '], V231 A-1)' : ''), eq === Object.keys(CFGS).length, eq + '/' + Object.keys(CFGS).length + ' configs equal'); }
'''))

# ── g229_d193 (1/5): VERSION PREDICATE header, the 231 era ─────────────────────────────────────────────────────────────
EDITS[G229].append(('header 231 era', r'''//   229 and up     every row asserts.
''', r'''//   229 and up     every row asserts.
//   231 and up     (tests/measure/v231_rulings/v231_absorb_ruling.md section 3; standing rulings 2 and 4) row b SPLITS:
//                  it keeps the object row, 0 `_preHold` on any uninjured build, HALF_MANNY on the era row and > 0 clamp
//                  moves on L432, HB and L1; its "byte-identical to V228" conjuncts (injured builds outside the clamp
//                  population, the 133 uninjured builds; the candidate prints 565/1,053 and 50/133) assert at 230 and
//                  below only, and at 231 and up print one named SKIP line (counted neither PASS nor FAIL) naming the
//                  successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d.
//                  d-BWSETS ABSORBS D196-1: the hand hold reads on 1,169 cards under their V228 name plus 70 renamed to
//                  `Single-leg glute bridge` or `Single-leg hip thrust (shoulders on bed)`, 1,239 in all, FORBID 0,
//                  RPE != 7 0 (typed pins, the ruling's print; V230 renamed 0). Below 231 both rows assert as before.
'''))

# ── g229_d193 (2/5): d accumulator + the D196 typed oracle ──────────────────────────────────────────────────────────
EDITS[G229].append(('newD + D196 oracle', r'''  const D = {}; const newD = () => ({ pop:0, ok:0, forb:0, notSeven:0, bySet:{}, ex:[] });
''', r'''  const D = {}; const newD = () => ({ pop:0, ok:0, forb:0, notSeven:0, bySet:{}, ex:[], ren:0, renTab:{}, renSet:{} });
  // V231 (absorb ruling section 3, d-BWSETS, class D196-1): the two hip-extension names a renamed clamp card may carry,
  // typed, and the ruled split of the bwsets clamp population. V231_ERA also keys row b's split.
  const V231_ERA = 231, D196_REN = ['Single-leg glute bridge', 'Single-leg hip thrust (shoulders on bed)'], D196_BW = { same:1169, ren:70, pop:1239 };
'''))

# ── g229_d193 (3/5): d counting, the renamed tier (counted on every tree; asserted at 231 and up) ─────────────────────
EDITS[G229].append(('d renamed count', r'''      if(sameName && cd === want && !forb && seven) d.ok++; else if(d.ex.length < 3) d.ex.push(''', r'''      if(sameName && cd === want && !forb && seven) d.ok++;
      else if(!sameName && !!c && D196_REN.includes(c.n) && cd === want && !forb && seven){ d.ren++; tally(d.renTab, b.n + ' > ' + c.n); tally(d.renSet, tag); }
      else if(d.ex.length < 3) d.ex.push('''))

# ── g229_d193 (4/5): row b split ───────────────────────────────────────────────────────────────────────────────────────
EDITS[G229].append(('row b split', r'''  ok(R.b + (has ? '' : ' (row MANNY_DIGEST_BY_VERSION[' + ERA + '] ABSENT)'), selfAll && B.inj > 0 && B.injSame === B.inj && movedAll && B.un === UNINJ_N && B.unSame === B.un && B.preHold === 0 && mannyOK
    && OB.n > 0 && OB.same === OB.n && OB.rec === OB.n && OB.boot === OB.n && OB.undo === OB.n && OB.pre === 0 && OB.ph === 0 && OB.store === 0,
''', r'''  // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g229_d193:421 b SPLIT; standing rulings 2 and 4):
  // bKeep is every conjunct the row keeps at 231 and up (object row, 0 _preHold on uninjured builds, HALF_MANNY on the era
  // row, > 0 clamp moves, the baseline equal to itself). The two "byte-identical to V228" conjuncts assert at 230 and below
  // only; at 231 and up they print one named SKIP line at column 0, never PASS and never FAIL.
  const bKeep = selfAll && B.inj > 0 && movedAll && B.un === UNINJ_N && B.preHold === 0 && mannyOK
    && OB.n > 0 && OB.same === OB.n && OB.rec === OB.n && OB.boot === OB.n && OB.undo === OB.n && OB.pre === 0 && OB.ph === 0 && OB.store === 0;
  if(VER >= V231_ERA) console.log('SKIP row b byte-identical to V228 (injured builds outside the clamp population ' + B.injSame + '/' + B.inj + ', uninjured builds ' + B.unSame + '/' + B.un + ' on this tree): scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b, g231_d196_bwfallback D196-a..d. Never PASS, never FAIL.');
  ok(R.b + (has ? '' : ' (row MANNY_DIGEST_BY_VERSION[' + ERA + '] ABSENT)') + (VER >= V231_ERA ? ' [V231 split: object row, _preHold, MANNY era row, > 0 moved; the byte-identical conjuncts SKIP]' : ''),
    VER >= V231_ERA ? bKeep : bKeep && B.injSame === B.inj && B.unSame === B.un,
'''))

# ── g229_d193 (5/5): d-BWSETS absorb ──────────────────────────────────────────────────────────────────────────────────
EDITS[G229].append(('d-BWSETS absorb', r'''  dRow('dBW', 'bwsets', (D.bwsets && D.bwsets.bySet.L432 > 0 && D.bwsets.bySet.HB > 0 && D.bwsets.bySet.L1 > 0));
''', r'''  // V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g229_d193 d-BWSETS ABSORB, class D196-1; standing
  // rulings 2 and 4): at 231 and up a bwsets card in the clamp population reads its hand hold under its V228 name (1,169)
  // or renamed to one of D196_REN (70), 1,239 in all, FORBID 0, RPE != 7 0, typed pins. Below 231 the row is unchanged
  // (the renamed tier is counted on every tree and printed; V230 reads 0).
  const bwSets = !!(D.bwsets && D.bwsets.bySet.L432 > 0 && D.bwsets.bySet.HB > 0 && D.bwsets.bySet.L1 > 0);
  { const d = D.bwsets || newD(); console.log('    d bwsets renamed to a D196 name with the hand hold ' + d.ren + ' (' + fmt(d.renSet) + ') | ' + fmt(d.renTab)); }
  if(VER >= V231_ERA){ const d = D.bwsets || newD();
    ok(R.dBW + ' [V231 D196-1: ' + D196_BW.same + ' same name + ' + D196_BW.ren + ' renamed to a D196 name = ' + D196_BW.pop + ']',
      selfAll && bwSets && d.pop === D196_BW.pop && d.ok === D196_BW.same && d.ren === D196_BW.ren && d.ok + d.ren === d.pop && d.forb === 0 && d.notSeven === 0,
      d.ok + ' same name + ' + d.ren + ' renamed of ' + d.pop + ' hand hold, ' + d.forb + ' keep FORBID, ' + d.notSeven + ' RPE != 7'); }
  else dRow('dBW', 'bwsets', bwSets);
'''))

# ── apply: every anchor asserted count == 1 on the text as it stands; abort on the first miss, write nothing ──────────
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
for rel, src in result.items():
    dst = os.path.join(out_dir, os.path.basename(rel)) if out_dir else os.path.join(ROOT, rel)
    with open(dst, 'w', encoding='utf-8') as fh:
        fh.write(src)
    print('wrote ' + dst)
