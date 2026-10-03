#!/usr/bin/env python3
# V229 gate slice G4 (class (B), the last ruled absorb pair): g227_d190_cuecap c-TOAST and g228_d193_cueword b-ONECLASS.
# Rulings (cite only the files):
#   tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r): "`g227_d190_cuecap` c-TOAST 1,706 of 9,882 (D193 R8:
#   every moved toast ends with the hold sentence and its pair's clamp changed the number by the (k) hand oracle; count
#   pinned; the row parks if any moved toast is not a hold variant); `g228_d193_cueword` b-ONECLASS era 228 only, refuses
#   at 229, its successor is D193 (a)/(b). Comment on every fixture row: 'fixture presentation (`cfg.injury` stored); app
#   equivalence is D194 part 2's row'." Amendment 3: the beneath-the-hold lens (applied here to the dose handed to the
#   clamp; c-TOAST's "moved" compares artifact against artifact, V226 against the candidate, so it carries no stale hand
#   formula). tests/measure/v228_rulings/d193_caprpe_ruling.md Amendment 2 R8, Amendment 4 "The rules" (R8 trigger
#   restated) and its (k) "0 false claims". Standing rulings 2 and 4.
# Four edits, two files:
#   C1  cuecap header VERSION PREDICATE: the 229 line.
#   C2  cuecap c-TOAST: at 229 and up the (k) hand oracle per hop (measure's M8 method carried along the chain) and the
#       moved count pinned at 1,706; below 229 the original line verbatim in the else branch.
#   W1  cueword header VERSION PREDICATE: b-ONECLASS retired at 229, its successor named.
#   W2  cueword b-ONECLASS: the build pass still runs; at 229 the row prints one named SKIP line (REFUSED, era 228 only,
#       successor named), never PASS, never FAIL; at 228 the row asserts exactly as before.
# Why SKIP and not a named FAIL: tests/gate.sh exits 1 on any FAIL and on any line starting `REFUSED`, so a retired row
# printed as FAIL would red the V229 ship run. The precedent gate.sh accepts is g221's era-bound rows past their era
# (`SKIP <row>: scoped out, candidate N ...`, e.g. G9 "a later ruling owns HALF_MANNY"), never PASS.
# All or none: index.html must be the V229 candidate and both gates their shipped files; every anchor count==1.
import sys, re, hashlib, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
FILES = {'C': ROOT + '/tests/gates/g227_d190_cuecap.js', 'W': ROOT + '/tests/gates/g228_d193_cueword.js'}
SHA = {'C': '150281a5d9b3f4d1497121dc1726f9b6cdf7b184fd3e7aba1b7665d32eef1594',
       'W': 'ea1b2cadbe8b2d4b72793cffbfec19b29e9fcd00a023a113668ca57ee4c19515'}
CAND_SHA256 = 'd854af0a91f88a5d67c60dd458289bc0fff90c835c2f719775707f8548c56a71'

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

ib = open(ROOT + '/index.html', 'rb').read()
if hashlib.sha256(ib).hexdigest() != CAND_SHA256: die('index.html is not the V229 candidate (sha256 %s)' % hashlib.sha256(ib).hexdigest())
src = {}
for f, p in FILES.items():
    b = open(p, 'rb').read()
    if hashlib.sha256(b).hexdigest() != SHA[f]: die('%s is not the shipped file (sha256 %s)' % (p, hashlib.sha256(b).hexdigest()))
    src[f] = b.decode('utf-8')
for f, names in (('C', ['D193_ERA', 'D193_CTOAST_PIN', 'blindK', 'bucketK', 'mvK']), ('W', ['ONE_RETIRED'])):
    for nm in names:
        if re.search(r'\b' + nm + r'\b', src[f]): die('name already in %s: %s' % (FILES[f], nm))

EDITS = [
    ('C1 cuecap header: 229 and up', 'C',
     r"""//   227 and up     every row asserts.
""",
     r"""//   227 and up     every row asserts.
//   229 and up     c-TOAST re-keyed (D193's R8 hold toasts: tests/measure/v228_rulings/d193_caprpe_ruling.md Amendment 2
//                  R8 and Amendment 4 "The rules", R8 trigger restated; tests/measure/v229_rulings/d194_injlens_ruling.md
//                  Amendment 1 (r) and Amendment 3's beneath-the-hold lens): every toast that moved against V226 is the
//                  hold variant of its hand kind on a hand clamp pair, every hand clamp pair prints the hold sentence, and
//                  the moved count is pinned (1,706 of 9,882; 0 on V228).
//                  Fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
//                  Below 229 c-TOAST asserts exactly as before.
"""),
    ('C2 cuecap c-TOAST row', 'C',
     r"""    ok(R.cTOAST, SELF_C && SELF_B && PAIRSELF && hops > 0 && nonEmpty > 0 && cueHops > 0 && moved === 0, 'toasts moved ' + moved + '/' + hops + ' hops');
""",
     r"""    // V229 D193 R8 (Amendment 2 R8, Amendment 4 "The rules": R8 trigger restated, (k) "0 false claims"), D194 Amendment 1 (r)
    // ("c-TOAST 1,706 of 9,882 (D193 R8: every moved toast ends with the hold sentence and its pair's clamp changed the number
    // by the (k) hand oracle; count pinned; the row parks if any moved toast is not a hold variant)") and Amendment 3 (the
    // dose is judged beneath its hold). Fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
    // HAND (k) ORACLE, typed, never the tree under test, measure's M8 (k) method (tests/measure/v229_caprpe_cf3.js :359-368)
    // carried hop by hop: the dose handed to the clamp is the chain's dose read beneath its hold (both cue wordings; R7's
    // text by shape -> the strength test text), converted where V226 itself converted the same pair (its card != its
    // donor, both read beneath the cue, and no window toast) by the unloadable reader's bucket (Amendment 3 section 1: 6
    // for RPE 6.x, light or easy; 7 for RPE 7.x; else 8), else its named RPE (a range by its top). A clamp pair is a
    // target capped by CAP (the gate's hand table; `pat` is the classifier, not under test) with that RPE above 7. The
    // hold variant's body is typed from R8: window "The load runs out before the reps do here. Reps move to a to b."
    // (a and b off V226's window toast), unloadable "No load to add here.", verbatim "Same sets, same reps.", each ending
    // " Your injury plan holds this one at RPE 7.".
    const D193_ERA = 229, D193_CTOAST_PIN = 1706;
    if(VER >= D193_ERA){
      const HOLD_K = ' Your injury plan holds this one at RPE 7.';
      const CUE_K = / — hold RPE 7, (?:two|three) in the tank$/;
      const R7_K = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
      const TEST_K = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
      const blindK = s => typeof s !== 'string' ? '' : R7_K.test(s) ? TEST_K : s.replace(CUE_K, '');
      const rpeK = d => { const re = /RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?/g; let m, best = null; while((m = re.exec(String(d || '')))){ const v = Math.max(+m[1], m[2] ? +m[2] : 0); if(best === null || v > best) best = v; } return best; };
      const bucketK = d => /rpe\s*6|light|easy/i.test(String(d || '')) ? 6 : /rpe\s*7/i.test(String(d || '')) ? 7 : 8;
      const bwK = d => { const m = /^(\d+)\s*[×x]/.exec(d || ''); const s = m ? Math.min(4, Math.max(2, +m[1])) : 3, r = bucketK(d); return r === 8 ? s + ' sets — RPE 8 (stop 2 reps short of failure)' : s + ' sets — RPE ' + r + ' (leave 3 or more in reserve)'; };
      const bodyOf = t => { const i = String(t || '').indexOf(' out. '); return i < 0 ? null : String(t).slice(i + 6); };
      let mvK = 0, badK = 0, clampK = 0, missK = 0; const exK = [], kinds = {};
      for(const ck of INJ_CK){ const r = REG(ck);
        for(const c of POP[ck]){ const a = RES.C[ck][c.id], b = RES.B[ck][c.id]; let beneath = blindK(c.dt);
          c.hops.forEach((h, k) => {
            const bDon = k === 0 ? b.pre.d : b.steps[k - 1].d, bCard = b.steps[k].d, bT = b.toasts[k] || '', aT = a.toasts[k] || '';
            const wm = /The load runs out before the reps do here\. .*Reps move to (\d+) to (\d+)\./.exec(bT);
            const conv = !wm && blindK(bCard) !== blindK(bDon);
            const pre = conv ? bucketK(beneath) : rpeK(beneath);
            const clamp = !!r && CAP[r].includes(pat(h.to)) && pre !== null && pre > 7;
            const kind = wm ? 'window' : conv ? 'unloadable' : 'verbatim';
            const body = wm ? 'The load runs out before the reps do here. Reps move to ' + wm[1] + ' to ' + wm[2] + '.' + HOLD_K : conv ? 'No load to add here.' + HOLD_K : 'Same sets, same reps.' + HOLD_K;
            if(clamp){ clampK++; if(!aT.endsWith(HOLD_K)){ missK++; if(exK.length < 4) exK.push('clamp pair without the hold: ' + tag(c) + ' hop' + (k + 1) + ' [' + kind + '] ' + aT); } }
            if(aT !== bT || !!a.unreach !== !!b.unreach){ mvK++; kinds[kind] = (kinds[kind] || 0) + 1;
              if(!(clamp && aT.endsWith(HOLD_K) && bodyOf(aT) === body)){ badK++; if(exK.length < 8) exK.push('moved, not the hold variant on a hand clamp pair: ' + tag(c) + ' hop' + (k + 1) + ' [' + kind + (clamp ? ', clamp' : ', not clamp') + '] V' + BASE_ERA + ' ' + bT + ' | now ' + aT + ' | want body ' + body); } }
            if(conv) beneath = bwK(beneath);
          }); } }
      console.log('    c-TOAST D193 R8 (V' + VER + '): moved ' + mvK + ' by hand kind ' + fmt(kinds) + ' | hand clamp pairs ' + clampK + ', without the hold sentence ' + missK + ' | moved and not the hold variant on a hand clamp pair ' + badK);
      exK.forEach(s => console.log('      ' + s));
      ok(R.cTOAST + ' [V229 D193 R8, D194 Amendment 1 (r) / Amendment 3: moved ' + mvK + ' == pin ' + D193_CTOAST_PIN + ', every one the hold variant on a hand clamp pair (not ' + badK + '), hand clamp pairs ' + clampK + ' without the hold ' + missK + ']',
        SELF_C && SELF_B && PAIRSELF && hops > 0 && nonEmpty > 0 && cueHops > 0 && moved === mvK && badK === 0 && missK === 0 && mvK === D193_CTOAST_PIN,
        'toasts moved ' + moved + '/' + hops + ' hops (pin ' + D193_CTOAST_PIN + '), not a hold variant on a hand clamp pair ' + badK + ', hand clamp pairs without the hold ' + missK);
    }
    else ok(R.cTOAST, SELF_C && SELF_B && PAIRSELF && hops > 0 && nonEmpty > 0 && cueHops > 0 && moved === 0, 'toasts moved ' + moved + '/' + hops + ' hops');
"""),
    ('W1 cueword header: 229 and up', 'W',
     r"""//   228 and up     every row asserts.
""",
     r"""//   228 and up     every row asserts.
//   229 and up     b-ONECLASS is retired: tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r) "b-ONECLASS era
//                  228 only, refuses at 229, its successor is D193 (a)/(b)" (g229_d193_build.js, V229). Its build pass still
//                  runs (it fills the caches f-STRIP and g-COUPLE read) and prints its lines; the row prints one named
//                  `SKIP ... REFUSED at ia-version N (era 228 only)` line, never PASS and never FAIL: the shape gate.sh
//                  accepts for an era-bound row past its era (g221's scoped-out pair rows and G9). c-LIT, f-STRIP, f-STORED
//                  and g-COUPLE (R1, R4, R5, R6) assert at every version from 228 up.
"""),
    ('W2 cueword b-ONECLASS block', 'W',
     r"""  if(!B) ok(R.bONE + setupNote, false);
  const VC = fresh('C'), VB = B ? fresh('B') : null;
  // SELFCHECK: the shared VM is inert (a fresh-page build equals it) and each tree builds the same program twice
  const probe = [L9.mario, L9.manny, L9.elbow_wa];
  const selfC = probe.every(c => J(VC.buildProgram(clone(c))) === J(fresh('C').buildProgram(clone(c))));
  const selfB = !!VB && probe.every(c => J(VB.buildProgram(clone(c))) === J(fresh('B').buildProgram(clone(c))));
  console.log('    b SELFCHECK shared VM == fresh page (mario, HALF_MANNY, elbow/wa): candidate ' + selfC + (VB ? ', V' + BASE_ERA + ' ' + selfB : ''));
  let allOK = selfC && (!VB || selfB), baseSelf = 0, baseAll = 0; const lines = [], bad = [];
  for(const [tag, list] of SETS){
    let eq = 0, subsTot = 0, withSubs = 0, oldLeft = 0, newOnC = 0, mid = 0, ident = 0, inj = 0, injNoSub = [];
    for(const { k, c } of list){
      const pc = VC.buildProgram(clone(c)), jc = J(pc); BUILT[tag + '|' + k] = pc; oldLeft += cnt(jc, OLDC); newOnC += cnt(jc, NEWC);
      if(!VB) continue;
      const pb = VB.buildProgram(clone(c)), jb = J(pb), jb2 = J(VB.buildProgram(clone(c))); baseAll++; if(jb === jb2) baseSelf++; else { allOK = false; bad.push(tag + ' ' + k + ' BASELINE SELF-MISMATCH'); continue; }
      const t = { n:0, mid:0 }; const want = J(subst(JSON.parse(jb), t)); subsTot += t.n; mid += t.mid; if(t.n) withSubs++;
      if(c.injury){ inj++; if(!t.n) injNoSub.push(k); }
      if(jb === jc) ident++;
      if(want === jc) eq++; else if(bad.length < 4) bad.push(tag + ' ' + k + ' ' + firstDiff(want, jc));
    }
    const n = list.length;
    let setOK;
    if(tag === 'L9') setOK = eq === n && injNoSub.length === 0 && inj === 7 && subsTot > 0;
    else if(tag === 'uninjured47') setOK = eq === n && ident === n && subsTot === 0 && inj === 0;
    else setOK = eq === n && subsTot > 0;
    setOK = setOK && oldLeft === 0 && mid === 0 && newOnC === subsTot;
    if(!setOK) allOK = false;
    lines.push(tag + ': ' + (VB ? 'candidate == SUBST(V227) ' + eq + '/' + n + ' | re-ended ' + subsTot + ' cues on ' + withSubs + ' builds (injured ' + inj + ', injured with none ' + injNoSub.length + ') | OLDC mid-string on V227 ' + mid + ' | byte-identical outright ' + ident + ' | ' : '') + 'candidate: OLDC left ' + oldLeft + ', NEWC ' + newOnC);
  }
  lines.forEach(l => console.log('    b ' + l));
  if(VB) console.log('    b baseline == itself ' + baseSelf + '/' + baseAll);
  bad.forEach(s => console.log('      DIFF ' + s));
  // HALF_MANNY on the era table (standing ruling 5)
  const MD = H.MANNY_DIGEST_BY_VERSION || {};
  const has = Object.prototype.hasOwnProperty.call(MD, ERA) && typeof MD[ERA] === 'string', ref = has && MD[ERA] === MD[BASE_ERA];
  const row = MD[VER];
  const built = progDigest(load(ART).buildProgram(clone(fixtures.HALF_MANNY)));          // the harness way (real clock)
  const builtPin = progDigest(fresh('C').buildProgram(clone(fixtures.HALF_MANNY)));      // and on the gate's pinned clock
  console.log('    b MANNY MANNY_DIGEST_BY_VERSION[' + ERA + '] ' + (has ? MD[ERA] : 'ABSENT') + ', [' + BASE_ERA + '] ' + MD[BASE_ERA] + ', [' + VER + '] ' + row + ' | HALF_MANNY built ' + built + ', pinned ' + builtPin);
  const mannyOK = has && ref && typeof row === 'string' && built === row && builtPin === row;
  if(B) ok(R.bONE + (has ? '' : ' (row MANNY_DIGEST_BY_VERSION[' + ERA + '] ABSENT)'), allOK && baseSelf === baseAll && baseAll > 0 && mannyOK,
    lines.map(l => l.split(' | ')[0]).join('; ') + '; MANNY [' + ERA + ']' + (ref ? '===' : '!==') + '[' + BASE_ERA + '], ' + built + (built === row ? ' == ' : ' != ') + '[' + VER + ']');
""",
     r"""  // D194 Amendment 1 (r): "b-ONECLASS era 228 only, refuses at 229, its successor is D193 (a)/(b)" (g229_d193_build.js, V229).
  // The build pass below still runs (f-STRIP and g-COUPLE read its caches); from 229 the row prints one named SKIP line.
  const ONE_RETIRED = VER >= 229;
  if(!B && !ONE_RETIRED) ok(R.bONE + setupNote, false);
  const VC = fresh('C'), VB = B ? fresh('B') : null;
  // SELFCHECK: the shared VM is inert (a fresh-page build equals it) and each tree builds the same program twice
  const probe = [L9.mario, L9.manny, L9.elbow_wa];
  const selfC = probe.every(c => J(VC.buildProgram(clone(c))) === J(fresh('C').buildProgram(clone(c))));
  const selfB = !!VB && probe.every(c => J(VB.buildProgram(clone(c))) === J(fresh('B').buildProgram(clone(c))));
  console.log('    b SELFCHECK shared VM == fresh page (mario, HALF_MANNY, elbow/wa): candidate ' + selfC + (VB ? ', V' + BASE_ERA + ' ' + selfB : ''));
  let allOK = selfC && (!VB || selfB), baseSelf = 0, baseAll = 0; const lines = [], bad = [];
  for(const [tag, list] of SETS){
    let eq = 0, subsTot = 0, withSubs = 0, oldLeft = 0, newOnC = 0, mid = 0, ident = 0, inj = 0, injNoSub = [];
    for(const { k, c } of list){
      const pc = VC.buildProgram(clone(c)), jc = J(pc); BUILT[tag + '|' + k] = pc; oldLeft += cnt(jc, OLDC); newOnC += cnt(jc, NEWC);
      if(!VB) continue;
      const pb = VB.buildProgram(clone(c)), jb = J(pb), jb2 = J(VB.buildProgram(clone(c))); baseAll++; if(jb === jb2) baseSelf++; else { allOK = false; bad.push(tag + ' ' + k + ' BASELINE SELF-MISMATCH'); continue; }
      const t = { n:0, mid:0 }; const want = J(subst(JSON.parse(jb), t)); subsTot += t.n; mid += t.mid; if(t.n) withSubs++;
      if(c.injury){ inj++; if(!t.n) injNoSub.push(k); }
      if(jb === jc) ident++;
      if(want === jc) eq++; else if(bad.length < 4) bad.push(tag + ' ' + k + ' ' + firstDiff(want, jc));
    }
    const n = list.length;
    let setOK;
    if(tag === 'L9') setOK = eq === n && injNoSub.length === 0 && inj === 7 && subsTot > 0;
    else if(tag === 'uninjured47') setOK = eq === n && ident === n && subsTot === 0 && inj === 0;
    else setOK = eq === n && subsTot > 0;
    setOK = setOK && oldLeft === 0 && mid === 0 && newOnC === subsTot;
    if(!setOK) allOK = false;
    lines.push(tag + ': ' + (VB ? 'candidate == SUBST(V227) ' + eq + '/' + n + ' | re-ended ' + subsTot + ' cues on ' + withSubs + ' builds (injured ' + inj + ', injured with none ' + injNoSub.length + ') | OLDC mid-string on V227 ' + mid + ' | byte-identical outright ' + ident + ' | ' : '') + 'candidate: OLDC left ' + oldLeft + ', NEWC ' + newOnC);
  }
  lines.forEach(l => console.log('    b ' + l));
  if(VB) console.log('    b baseline == itself ' + baseSelf + '/' + baseAll);
  bad.forEach(s => console.log('      DIFF ' + s));
  // HALF_MANNY on the era table (standing ruling 5)
  const MD = H.MANNY_DIGEST_BY_VERSION || {};
  const has = Object.prototype.hasOwnProperty.call(MD, ERA) && typeof MD[ERA] === 'string', ref = has && MD[ERA] === MD[BASE_ERA];
  const row = MD[VER];
  const built = progDigest(load(ART).buildProgram(clone(fixtures.HALF_MANNY)));          // the harness way (real clock)
  const builtPin = progDigest(fresh('C').buildProgram(clone(fixtures.HALF_MANNY)));      // and on the gate's pinned clock
  console.log('    b MANNY MANNY_DIGEST_BY_VERSION[' + ERA + '] ' + (has ? MD[ERA] : 'ABSENT') + ', [' + BASE_ERA + '] ' + MD[BASE_ERA] + ', [' + VER + '] ' + row + ' | HALF_MANNY built ' + built + ', pinned ' + builtPin);
  const mannyOK = has && ref && typeof row === 'string' && built === row && builtPin === row;
  if(ONE_RETIRED) console.log('SKIP ' + R.bONE + ': REFUSED at ia-version ' + VER + ' (era 228 only: "nothing but the word changes" is V228\'s claim); its successor is D193 (a)/(b), g229_d193_build.js, V229 (tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r)). Never PASS, never FAIL.');
  else if(B) ok(R.bONE + (has ? '' : ' (row MANNY_DIGEST_BY_VERSION[' + ERA + '] ABSENT)'), allOK && baseSelf === baseAll && baseAll > 0 && mannyOK,
    lines.map(l => l.split(' | ')[0]).join('; ') + '; MANNY [' + ERA + ']' + (ref ? '===' : '!==') + '[' + BASE_ERA + '], ' + built + (built === row ? ' == ' : ' != ') + '[' + VER + ']');
"""),
]

for nm, f, old, new in EDITS:
    c = src[f].count(old)
    print('%s anchor count %d' % (nm, c))
    if c != 1: die('%s anchor count %d != 1' % (nm, c))
out = dict(src)
for nm, f, old, new in EDITS:
    out[f] = out[f].replace(old, new, 1)
if re.search(r'\\u[0-9a-fA-F]{4}', ''.join(n for _, _, _, n in EDITS)): die('a \\u escape in replacement text')
cOrig = "    ok(R.cTOAST, SELF_C && SELF_B && PAIRSELF && hops > 0 && nonEmpty > 0 && cueHops > 0 && moved === 0, 'toasts moved ' + moved + '/' + hops + ' hops');\n"
checks = [
    ('cuecap: c-TOAST original line carried verbatim below 229', out['C'].count('    else ' + cOrig.lstrip()), 1),
    ('cuecap: pin 1,706', out['C'].count('const D193_ERA = 229, D193_CTOAST_PIN = 1706;'), 1),
    ('cuecap: fixture comment', out['C'].count("app equivalence is D194 part 2's row"), 2),
    ('cueword: retired-row SKIP line', out['W'].count("console.log('SKIP ' + R.bONE + ': REFUSED at ia-version '"), 1),
    ('cueword: no column-0 REFUSED print added', len(re.findall(r"console\.log\('REFUSED", out['W'])) - len(re.findall(r"console\.log\('REFUSED", src['W'])), 0),
    ('cueword: gate-level predicate unchanged (VER >= ERA, ERA 228)', out['W'].count('if(!(VER >= ERA)){') + out['W'].count('const ERA = 228, BASE_ERA = 227;'), 2),
]
for nm, got, want in checks:
    print('post %s: %d' % (nm, got))
    if got != want: die('post-check %s: %d != %d' % (nm, got, want))
for f, p in FILES.items():
    open(p, 'w', encoding='utf-8').write(out[f])
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + p + ': ' + r.stderr)
    print('WROTE ' + p + ' (node --check ok)')
print('OK: 4 edits written')
