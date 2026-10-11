#!/usr/bin/env python3
# Post-V239 tests-only pass, slice 1 of 1 (no build; ia-version stays 239, index.html untouched).
#
# DECISION (Mario, Post-V239): delete the whole baselines/ folder (V188.html, V189.html, V196.html,
# README.md); it is the old workflow. Its only live reader is tests/gates/g197d_d84_base.js, rows
# E1h (D84's footprint vs a FIXED pre-D84 artifact) and E5 (the frozen V196 budget corpus). Those
# rows keep running with byte-identical LABELS; the gate now reads V196 from git at a pinned
# COMMIT (a tag can move), checked against the file's sha256.
#
#   B1  resolveV196(): V196_COMMIT / V196_SHA256 pins; BASE_HTML that reads 196 is returned as is;
#       otherwise ONE `git show <commit>:index.html` per process, accepted only if it reads
#       ia-version 196 AND hashes to V196_SHA256, written to a private mkdtemp dir as V196.html,
#       removed by its own exit handler and never with SCRATCH: done() clears SCRATCH, and the
#       V196 dir must outlive every read (the workers' sweep, then E5 in the parent). Any failure
#       is null, so the REFUSE machinery fires. A worker never runs git: it keeps V196_ARG.
#   B2  the two refuse() WHY strings name the pinned commit; both refuse() labels are untouched.
#   B3  the comments that described the committed copy describe the pinned commit.
#   B4  git rm -r -q baselines
#
# Every anchor is asserted count==1 on the original text before anything is written; the first
# miss aborts with no write. Premise checks (standing ruling 7) run first and PARK on a miss:
# the tag still resolves to the pinned commit, the commit's bytes hash to the pin, and nothing
# outside the archival record reads baselines/.
#
# Usage: python3 tests/edits/post_v239_baselines_s1.py --scratch <session scratch dir>
import hashlib, os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, 'tests', 'gates', 'g197d_d84_base.js')
COMMIT = '3f5d792d40b503bcfe123ddd9fb9f98e3541f6d4'
SHA = 'f20b7c39583a3111b10a16024ef97aa675ca51d7c84f3d4b75f1f50dea599aca'

def die(m):
    print('ABORT: ' + m + ' (nothing written)')
    sys.exit(1)

def park(m):
    print('PARK (standing ruling 7): ' + m + ' (nothing written)')
    sys.exit(2)

if '--scratch' not in sys.argv: die('--scratch <dir> is required (never bare /tmp)')
SCR = sys.argv[sys.argv.index('--scratch') + 1]
os.makedirs(SCR, exist_ok=True)

def git(*a, binary=False):
    r = subprocess.run(['git', '-C', ROOT] + list(a), capture_output=True)
    if r.returncode: die('git ' + ' '.join(a) + ' failed: ' + r.stderr.decode('utf-8', 'replace').strip())
    return r.stdout if binary else r.stdout.decode('utf-8')

# ── premise ──────────────────────────────────────────────────────────────────────────────
if git('rev-parse', 'V196^{commit}').strip() != COMMIT: park('tag V196 no longer resolves to ' + COMMIT)
blob = git('show', COMMIT + ':index.html', binary=True)
if hashlib.sha256(blob).hexdigest() != SHA: park('git show ' + COMMIT[:7] + ':index.html does not hash to ' + SHA[:16])
if os.path.exists(os.path.join(ROOT, 'baselines', 'V196.html')):
    if open(os.path.join(ROOT, 'baselines', 'V196.html'), 'rb').read() != blob:
        park('baselines/V196.html is not byte-identical to the pinned commit')
# Live readers: every tracked file mentioning baselines, minus the archival record and the word's
# unrelated uses (index.html's "Smart experience-based baselines", g219's B0 row, g193's comment).
ALLOWED = {'IRON_ASYLUM_HANDOFF_1_1.md', 'index.html', 'tests/gates/g197d_d84_base.js',
           'tests/gates/g219_d167_pairs.js', 'tests/gates/g193_budget_floor.js'}
hits = [f for f in git('grep', '-l', 'baselines').split('\n') if f]
live = [f for f in hits if f not in ALLOWED and not f.startswith('baselines/')
        and not f.startswith('tests/edits/') and not f.startswith('tests/measure/')]
if live: park('a second reader of baselines/: ' + ', '.join(live))

# ── edits ────────────────────────────────────────────────────────────────────────────────
txt = open(G, encoding='utf-8').read()

B1_OLD = """// ── E1h's FIXED artifact. D84's footprint is a historical claim, so it is compared against
// a pinned pre-D84 release and never against the moving release baseline. baselines/V196.html
// is the committed copy of V196 (`git show V196:index.html`); it is preferred over extracting
// the tag at gate time because a gate must not depend on a .git directory, on a tag that can
// be moved, or on a subprocess per worker — and because this repo's rule is that when file and
// tag disagree, the file wins. The parent resolves the path once and hands it to every worker,
// so a worker never re-resolves and cannot disagree with its parent.
const V196_PATH = path.join(__dirname, '..', '..', 'baselines', 'V196.html');
function resolveV196() {
  if (BASE_HTML && isV196(fs.readFileSync(BASE_HTML, 'utf8'))) return BASE_HTML;
  if (fs.existsSync(V196_PATH) && isV196(fs.readFileSync(V196_PATH, 'utf8'))) return V196_PATH;
  return null;
}
"""
B1_NEW = """// ── E1h's FIXED artifact. D84's footprint is a historical claim, so it is compared against
// a pinned pre-D84 release and never against the moving release baseline. That release is
// V196, read from git at a PINNED COMMIT (Post-V239: the committed copy this once read is
// retired, and tags are the record). The reasons once given for a committed copy are answered
// here. A commit hash cannot move the way a tag can. V196_SHA256 is the file's identity: bytes
// that do not hash to it are not V196, whatever their meta says. The PARENT runs `git show`
// once per process and hands every worker the path through --v196, so no worker runs git or
// can disagree with its parent. And a checkout without the history (no git, no .git, a
// shallow clone) gets null, so E1h and the three E5 rows REFUSE by name: never a silent pass,
// never a fallback to another artifact. A run whose baseline IS V196 keeps reading that file.
// The bytes go to a private mkdtemp directory under the basename V196.html (E1h's label
// prints it). That directory has its own exit handler and is NOT tied to SCRATCH: done()
// clears SCRATCH, and the workers and then E5 must all have read V196 first.
const V196_COMMIT = '3f5d792d40b503bcfe123ddd9fb9f98e3541f6d4';
const V196_SHA256 = 'f20b7c39583a3111b10a16024ef97aa675ca51d7c84f3d4b75f1f50dea599aca';
var V196_DIR = '', V196_GIT, V196_WHY = 'not attempted';   // V196_GIT: undefined until the one attempt, then a path or null
function v196Cleanup() { try { if (V196_DIR) fs.rmSync(V196_DIR, { recursive: true, force: true }); } catch (e) {} V196_DIR = ''; }
process.on('exit', v196Cleanup);
function v196FromGit() {
  let stage = 'git show ' + V196_COMMIT.slice(0, 7) + ':index.html';
  try {
    const buf = cp.execFileSync('git', ['show', V196_COMMIT + ':index.html'],
      { cwd: path.join(__dirname, '..', '..'), maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    stage = 'the ia-version check';
    if (!isV196(buf.toString('utf8'))) { V196_WHY = 'the content does not read ia-version 196'; return null; }
    const h = crypto.createHash('sha256').update(buf).digest('hex');
    if (h !== V196_SHA256) { V196_WHY = 'sha256 ' + h.slice(0, 16) + ' is not V196'; return null; }
    stage = 'writing the private V196.html';
    V196_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'g197v196-'));
    const f = path.join(V196_DIR, 'V196.html');
    fs.writeFileSync(f, buf);
    V196_WHY = '';
    return f;
  } catch (e) {
    V196_WHY = stage + ' failed: '
      + String((e && e.stderr && String(e.stderr).trim()) || (e && e.message) || e).split('\\n')[0];
    return null;
  }
}
function resolveV196() {
  if (WORKER) return V196_ARG && fs.existsSync(V196_ARG) ? V196_ARG : null;   // a worker never runs git
  if (BASE_HTML && isV196(fs.readFileSync(BASE_HTML, 'utf8'))) return BASE_HTML;
  V196_GIT = V196_GIT === undefined ? v196FromGit() : V196_GIT;   // once per process, a null included
  return V196_GIT;
}
"""

B2A_OLD = """      refuse('E1h vs a fixed pre-D84 artifact: Calves rises somewhere',
        'NOT RUN: no pre-D84 artifact to compare against. E1h needs baselines/V196.html '
        + '(ia-version 196, the last release before D84); it is missing or carries another '
        + 'version. Restore it with: git show V196:index.html > baselines/V196.html');
"""
B2A_NEW = """      refuse('E1h vs a fixed pre-D84 artifact: Calves rises somewhere',
        'NOT RUN: no pre-D84 artifact to compare against. E1h reads V196 (ia-version 196, the last '
        + 'release before D84) from git commit ' + V196_COMMIT.slice(0, 7) + ' (sha256 '
        + V196_SHA256.slice(0, 8) + '...); git show failed or the content did not match: ' + V196_WHY);
"""

B2B_OLD = """      refuse(label, 'NOT RUN: the corpus is captured from baselines/V196.html (ia-version 196) and it is '
        + 'missing or carries another version. Restore it with: git show V196:index.html > baselines/V196.html');
"""
B2B_NEW = """      refuse(label, 'NOT RUN: the corpus is captured from V196 (ia-version 196), read from git commit '
        + V196_COMMIT.slice(0, 7) + ' (sha256 ' + V196_SHA256.slice(0, 8) + '...); git show failed or the '
        + 'content did not match: ' + V196_WHY);
"""

B3A_OLD = """//   historical claim needs a FIXED artifact, so E1h is now RE-POINTED at
//   baselines/V196.html (the last release before D84) and no longer reads the moving
//   release baseline at all."""
B3A_NEW = """//   historical claim needs a FIXED artifact, so E1h is now RE-POINTED at
//   V196 (the last release before D84), read from a pinned git commit since Post-V239,
//   and no longer reads the moving release baseline at all."""

B3B_OLD = """//   only when no pre-D84 artifact exists, which is a broken checkout and not a healthy
//   run."""
B3B_NEW = """//   only when V196 cannot be read from its pinned commit (no git, a checkout without the
//   history, a hash mismatch), which is a broken checkout and not a healthy
//   run."""

B3C_OLD = "// All four are answered by the candidate and the committed V196 corpus source alone.\n"
B3C_NEW = "// All four are answered by the candidate and the pinned V196 corpus source alone.\n"

B3D_OLD = "// artifact (baselines/V196.html, the committed file E1h already reads) builds the 144 configs\n"
B3D_NEW = "// artifact (V196 at its pinned git commit, the same bytes E1h already reads) builds the 144 configs\n"

EDITS = [('B1 resolveV196', B1_OLD, B1_NEW),
         ('B2a E1h refuse WHY', B2A_OLD, B2A_NEW),
         ('B2b E5 refuse WHY', B2B_OLD, B2B_NEW),
         ('B3a header re-point', B3A_OLD, B3A_NEW),
         ('B3b header refusal', B3B_OLD, B3B_NEW),
         ('B3c NOBASE_MIN comment', B3C_OLD, B3C_NEW),
         ('B3d E5 corpus comment', B3D_OLD, B3D_NEW)]

for lab, old, _ in EDITS:
    n = txt.count(old)
    if n != 1: die('%s: anchor count %d on the original text, expected 1' % (lab, n))
new = txt
for lab, old, rep in EDITS:
    n = new.count(old)
    if n != 1: die('%s: anchor count %d after the earlier edits, expected 1' % (lab, n))
    new = new.replace(old, rep)

# ── post-conditions, all before any write ───────────────────────────────────────────────
if new == txt: die('empty diff')
if 'baselines' in new: die('the word baselines survives in the gate')
if 'V196_PATH' in new: die('V196_PATH survives')
for lab in ("refuse('E1h vs a fixed pre-D84 artifact: Calves rises somewhere',",
            "refuse(label, 'NOT RUN: the corpus is captured from V196",
            "ok('E1h vs ' + path.basename(V196_HTML) + ' (fixed pre-D84 artifact, ia-version 196): '",
            "    const label = 'E5 ' + nm + ' replays the ' + (row ? row.rule : 'NO ROW') + ' behaviour on the frozen V196 budget corpus'"):
    if new.count(lab) != 1: die('label line not exactly once: ' + lab)
if new.count('cp.execFileSync(') != 1: die('git must be spawned from exactly one place')
if new.count("process.on('exit', ") != 2: die('expected two exit handlers (SCRATCH, V196)')

td = tempfile.mkdtemp(prefix='pv239_bl_', dir=SCR)
try:
    chk = os.path.join(td, 'g197d_d84_base.js')
    open(chk, 'w', encoding='utf-8').write(new)
    r = subprocess.run(['node', '--check', chk], capture_output=True, text=True)
    if r.returncode: die('node --check failed: ' + r.stderr)
finally:
    shutil.rmtree(td, ignore_errors=True)

open(G, 'w', encoding='utf-8').write(new)
print('WROTE tests/gates/g197d_d84_base.js (%d edits, %d -> %d bytes)' % (len(EDITS), len(txt.encode()), len(new.encode())))

# ── B4: the folder goes last ─────────────────────────────────────────────────────────────
if os.path.isdir(os.path.join(ROOT, 'baselines')):
    git('rm', '-r', '-q', 'baselines')
    print('B4 git rm -r -q baselines: done')
else:
    print('B4 baselines/ already absent: nothing to remove')
if os.path.exists(os.path.join(ROOT, 'baselines')): die('baselines/ still exists after git rm')
