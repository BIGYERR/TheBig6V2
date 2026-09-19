#!/usr/bin/env python3
# TOOLING PASS V198 slice A, edit 2 of 2. NOT an app change: index.html is untouched and
# ia-version stays 198.
#
# E1h asserts D84's HISTORICAL footprint ("Calves rises somewhere"). That is a FIXED
# comparison, but it was pointed at the MOVING release baseline. Every release chain from
# V199 on uses the previous release as baseline (all >= 197), so E1h refused forever; with
# gate.sh now blocking on a refusal that is a permanent red on a correct refusal.
#
# The bug is the wiring, not the claim. E1h is RE-POINTED at a fixed pre-D84 artifact,
# baselines/V196.html (the last release before D84). Not deleted, not retired: same call
# Mario made on E5 this session. E1g keeps the moving baseline, which is right for it, since
# E1g is a regression guard ("Calves falls nowhere since the last release").
#
# When the release baseline IS V196, one load and one scan serve both assertions.
import pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g197d_d84_base.js')
s = P.read_text(encoding='utf-8')
edits = []

# ── 1. header: fan-out doc now describes three artifacts ──────────────────────────────
edits.append(("""// INTERNAL FAN-OUT. 1,728 configs built twice (candidate + baseline). Fanned by CONFIG
""", """// INTERNAL FAN-OUT. 1,728 configs built against the candidate, the moving release
// baseline (E1g) and the fixed V196 artifact (E1h) — twice per config when the release
// baseline IS V196, since then one load and one scan serve both. Fanned by CONFIG
"""))

# ── 2. header: the E1h paragraph ──────────────────────────────────────────────────────
edits.append(("""//   E1h ('Calves rises somewhere') is D84's own footprint. It is satisfiable ONLY against
//   a pre-D84 baseline, and it FAILED when V197 was compared to itself. It is now
//   baseline-version-aware. On a baseline it cannot be satisfied against it does not
//   quietly skip — a no-op assertion is the vacuity defect this repo keeps paying for —
//   it prints a named REFUSE line and is counted in the REFUSED bucket, which is NOT a
//   pass and is printed beside the PASS/FAIL summary.
""", """//   E1h ('Calves rises somewhere') is D84's own footprint. It is satisfiable ONLY against
//   a pre-D84 baseline, and it FAILED when V197 was compared to itself. It was first made
//   baseline-version-aware, which was only half the fix: every release chain from V199 on
//   carries a baseline >= 197, so E1h refused on every healthy run, forever. A FIXED
//   historical claim needs a FIXED artifact, so E1h is now RE-POINTED at
//   baselines/V196.html (the last release before D84) and no longer reads the moving
//   release baseline at all. E1g keeps that baseline: 'Calves falls nowhere since the last
//   release' is a regression guard and is SUPPOSED to move.
//   The refusal MACHINERY stays and still blocks (gate.sh greps REFUSED): it now fires
//   only when no pre-D84 artifact exists, which is a broken checkout and not a healthy
//   run. A no-op assertion is the vacuity defect this repo keeps paying for, so a claim
//   that cannot be put is still named, counted and red — never quietly skipped.
"""))

# ── 3. argv: accept --v196 and resolve the fixed artifact ─────────────────────────────
edits.append(("""var SHARD_I = null, SHARD_N = 0, OUT = '';
""", """var SHARD_I = null, SHARD_N = 0, OUT = '', V196_ARG = '';
"""))

edits.append(("""    else if (a[i] === '--out') OUT = a[++i];
""", """    else if (a[i] === '--out') OUT = a[++i];
    else if (a[i] === '--v196') V196_ARG = a[++i];
"""))

edits.append(("""const BASE_HTML = POS[1] && fs.existsSync(POS[1]) ? POS[1] : null;
""", """const BASE_HTML = POS[1] && fs.existsSync(POS[1]) ? POS[1] : null;

// ── E1h's FIXED artifact. D84's footprint is a historical claim, so it is compared against
// a pinned pre-D84 release and never against the moving release baseline. baselines/V196.html
// is the committed copy of V196 (`git show V196:index.html`); it is preferred over extracting
// the tag at gate time because a gate must not depend on a .git directory, on a tag that can
// be moved, or on a subprocess per worker — and because this repo's rule is that when file and
// tag disagree, the file wins. The parent resolves the path once and hands it to every worker,
// so a worker never re-resolves and cannot disagree with its parent.
const V196_PATH = path.join(__dirname, '..', '..', 'baselines', 'V196.html');
function resolveV196() {
  if (BASE_HTML && iaVersion(fs.readFileSync(BASE_HTML, 'utf8')) === 196) return BASE_HTML;
  if (fs.existsSync(V196_PATH) && iaVersion(fs.readFileSync(V196_PATH, 'utf8')) === 196) return V196_PATH;
  return null;
}
const V196_HTML = WORKER ? (V196_ARG && fs.existsSync(V196_ARG) ? V196_ARG : null)
                         : (BASE_HTML ? resolveV196() : null);
"""))

# ── 4. worker: load and scan the fixed artifact ───────────────────────────────────────
edits.append(("""  let bFell = 0, bRose = 0, bCells = 0; const bEg = [];
  var walked = 0;
  try {
    if (!BASE_HTML) throw new Error('worker started with no baseline');
    const IA_B = load(BASE_HTML);
""", """  let bFell = 0, bRose = 0, bCells = 0, rCells = 0; const bEg = [];
  var walked = 0;
  try {
    if (!BASE_HTML) throw new Error('worker started with no baseline');
    const IA_B = load(BASE_HTML);
    // E1g reads the moving release baseline, E1h the fixed V196 artifact. When they are the
    // same file (a V197-vs-V196 run) one load and one scan serve both.
    const IA_R = !V196_HTML ? null : (V196_HTML === BASE_HTML ? IA_B : load(V196_HTML));
"""))

edits.append(("""      let A1s, B1s;
      try { A1s = eScan(IA, c.cfg); B1s = eScan(IA_B, c.cfg); } catch (e) { continue; }
      for (const dk of Object.keys(A1s)) {
        const A1 = A1s[dk], B1 = B1s[dk]; if (!B1) continue;
        bCells++;
        const hasL = (o,l) => o.labels.indexOf(l) >= 0;
        if (!hasL(A1,'Calves') && hasL(B1,'Calves')) { bFell++; if (bEg.length < 5) bEg.push(c.key + ' ' + dk); }
        if (hasL(A1,'Calves') && !hasL(B1,'Calves')) bRose++;
      }
""", """      let A1s, B1s, R1s = null;
      try {
        A1s = eScan(IA, c.cfg); B1s = eScan(IA_B, c.cfg);
        if (IA_R) R1s = (IA_R === IA_B) ? B1s : eScan(IA_R, c.cfg);
      } catch (e) { continue; }
      const hasL = (o,l) => o.labels.indexOf(l) >= 0;
      for (const dk of Object.keys(A1s)) {
        const A1 = A1s[dk], B1 = B1s[dk];
        if (B1) {
          bCells++;
          if (!hasL(A1,'Calves') && hasL(B1,'Calves')) { bFell++; if (bEg.length < 5) bEg.push(c.key + ' ' + dk); }
        }
        const R1 = R1s ? R1s[dk] : null;
        if (R1) { rCells++; if (hasL(A1,'Calves') && !hasL(R1,'Calves')) bRose++; }
      }
"""))

edits.append(("""    fs.writeFileSync(OUT, JSON.stringify({ ok: true, n: walked, bFell: bFell, bRose: bRose, bCells: bCells, bEg: bEg }));
""", """    fs.writeFileSync(OUT, JSON.stringify({ ok: true, n: walked, bFell: bFell, bRose: bRose,
                                           bCells: bCells, rCells: rCells, bEg: bEg }));
"""))

# ── 5. merge: carry rCells ────────────────────────────────────────────────────────────
edits.append(("""  let bFell = 0, bRose = 0, bCells = 0, walked = 0; let bEg = [];
""", """  let bFell = 0, bRose = 0, bCells = 0, rCells = 0, walked = 0; let bEg = [];
"""))

edits.append(("""    walked += j.n; bFell += j.bFell; bRose += j.bRose; bCells += j.bCells; bEg = bEg.concat(j.bEg);
""", """    walked += j.n; bFell += j.bFell; bRose += j.bRose; bCells += j.bCells;
    rCells += (j.rCells || 0); bEg = bEg.concat(j.bEg);
"""))

edits.append(("""  afterSweep(bCells, bFell, bRose, bEg);
""", """  afterSweep(bCells, bFell, bRose, bEg, rCells);
"""))

# ── 6. parent: hand the fixed artifact to every worker ────────────────────────────────
edits.append(("""  if (!BASE_HTML) return afterSweep(0, 0, 0, []);
  const N = shardCount();
  if (!N) return afterSweep(0, 0, 0, []);
""", """  if (!BASE_HTML) return afterSweep(0, 0, 0, [], 0);
  const N = shardCount();
  if (!N) return afterSweep(0, 0, 0, [], 0);
"""))

edits.append(("""      [__filename, FILE, BASE_HTML, '--shard', i + '/' + N, '--out', of],
""", """      [__filename, FILE, BASE_HTML, '--shard', i + '/' + N, '--out', of]
        .concat(V196_HTML ? ['--v196', V196_HTML] : []),
"""))

# ── 7. the assertion itself ───────────────────────────────────────────────────────────
edits.append(("""function afterSweep(bCells, bFell, bRose, bEg) {
""", """function afterSweep(bCells, bFell, bRose, bEg, rCells) {
"""))

edits.append(("""    // E1h is D84's own footprint: Calves must appear on cells where the baseline had none.
    // D84 shipped IN V197, so only a baseline built before it can show the rise. Against a
    // V197-or-later baseline the claim is unsatisfiable by construction (it FAILED on
    // V197-vs-itself) and the honest answer is a refusal, not a pass and not a skip.
    const BV = iaVersion(fs.readFileSync(BASE_HTML, 'utf8'));
    if (BV !== null && BV < 197) {
      ok('E1h vs ' + path.basename(BASE_HTML) + ': Calves rises somewhere', bRose > 0, bRose);
    } else {
      refuse('E1h vs ' + path.basename(BASE_HTML) + ': Calves rises somewhere',
        'NOT RUN: this claim needs a pre-D84 baseline (ia-version < 197); this baseline reads '
        + (BV === null ? 'no ia-version meta' : 'ia-version ' + BV)
        + '. D84 landed in V197, so a V197-or-later baseline already carries the rise and the claim '
        + 'cannot be satisfied against it. Re-run with base_V196.html to put this assertion.');
    }
""", """    // E1h is D84's own footprint: Calves must appear on cells where a PRE-D84 artifact had
    // none. D84 shipped IN V197, so the comparison is FIXED at V196 and does NOT read the
    // moving release baseline — pointed there it became unsatisfiable from V197 on and
    // refused forever. The claim is unchanged and still true; only its second artifact was
    // wrong. It now runs on every invocation that has a baseline at all.
    if (V196_HTML) {
      ok('E1h vs ' + path.basename(V196_HTML) + ' (fixed pre-D84 artifact, ia-version 196): '
         + 'Calves rises somewhere (' + rCells + ' day-cells compared)',
         rCells > 0 && bRose > 0, rCells + ' cells compared, ' + bRose + ' rises');
    } else {
      refuse('E1h vs a fixed pre-D84 artifact: Calves rises somewhere',
        'NOT RUN: no pre-D84 artifact to compare against. E1h needs baselines/V196.html '
        + '(ia-version 196, the last release before D84); it is missing or carries another '
        + 'version. Restore it with: git show V196:index.html > baselines/V196.html');
    }
"""))

for old, new in edits:
    n = s.count(old)
    assert n == 1, 'anchor count %d (want 1): %r' % (n, old[:90])
    s = s.replace(old, new, 1)

P.write_text(s, encoding='utf-8')
print('g197d_d84_base.js: %d replacement(s) applied' % len(edits))
