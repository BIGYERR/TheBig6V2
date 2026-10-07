#!/usr/bin/env python3
# Post-V233 tooling pass, slice 9 (tests only; index.html untouched, ia-version stays 233).
# Decision (Mario; CLAUDE.md Proof scope, Version scope): no gate row is scoped to one exact ia-version.
# Evidence: measure mE (tests/measure/v233_rulings/measure_exact_version_mE.md), class (i) rows, state claims that
# hold at 233, so a minimum keeps them: g212_d110a_swim P1n and SH5; g213_d113a R3v; g218_d157_swim_sizer U2;
# g221_d177_swapfloor G4b and G4c.
# Each row is scoped by a minimum (VER >= ERA, the gate's own ERA). Every one of them shares its `VER === ERA`
# predicate with class ii/iii rows, so each gets its own minimum predicate and the shared one stays for the others.
# The row's claim and expected values do not change (standing ruling 3). Wiring that rides the pair:
#   g212 P1n: its audit loop was fused with P1's V211 comparison (V211 loads only on the pair); off the pair the
#             same audit runs on the candidate alone, and the run guard reads "the audit ran" (P1N_RAN).
#   g213 R3v: its computation sat in the PAIR branch with R3; it now runs whenever V212 is loaded (it always is),
#             and R3 keeps its pair scoping and its exact lines and order.
#   g221 G4b/G4c: their differ was `PAIR && sdB(...)`; off the pair they load V220 themselves (B4, sdB4).
# Every anchor is asserted count == 1 before anything is written; the first miss aborts the whole script.
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
G = ROOT / 'tests' / 'gates'

EDITS = {}

# ---------------------------------------------------------------------------------------------------------------
# g212_d110a_swim: P1n and SH5
EDITS['g212_d110a_swim.js'] = [
(r"""//   SH5  (build pair) swimmer B's rebuilt digest is coach's surgery print, a0f2e847ed9473d7.
""",
r"""//   SH5  (from 212 up, Version scope) swimmer B's rebuilt digest is coach's surgery print, a0f2e847ed9473d7.
"""),
(r"""//        from the swim INT note (D110a rewrites it). P1n: that note is the typed D110a text.
""",
r"""//        from the swim INT note (D110a rewrites it). P1n: that note is the typed D110a text. P1n runs from 212 up
//        (Version scope, post-V233): off the build pair its audit runs on the candidate alone.
"""),
(r"""function pairRow(label, cond, got){
  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 212/211 only; candidate is ' + VER + '] (now ' + got + ')'); return; }
  ok(label, cond, got);
}
""",
r"""function pairRow(label, cond, got){
  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 212/211 only; candidate is ' + VER + '] (now ' + got + ')'); return; }
  ok(label, cond, got);
}
// Version scope (post-V233): a row that holds from the D110a era onward is a minimum row, live on every candidate from
// 212 up. P1n and SH5 are minimum rows; the pair rows keep PAIR.
function minRow(label, cond, got){
  if(!(VER >= ERA)){ skipRow(label + ' skipped below the D110a era'); return; }
  ok(label, cond, got);
}
"""),
(r"""  pairRow('P1n every swim INT note on those builds opens with the typed D110a distance note, build to 8 (' + p1n + ' cards)', !!BASE && p1n >= 20 && p1nBad.length === 0, BASE ? p1nBad.join(' | ') : 'NO BASELINE');
""",
r"""  // P1n runs from the D110a era onward (Version scope): it audits the candidate's own swim INT notes on the P1 builds.
  // On the build pair the audit rides the P1 loop above; off it (no V211 loaded) the same audit runs on the candidate.
  const P1N_RAN = !!BASE || (VER >= ERA && (P1.forEach(([, c]) => WN(IA, c, true)), true));
  minRow('P1n every swim INT note on those builds opens with the typed D110a distance note, build to 8 (' + p1n + ' cards)', P1N_RAN && p1n >= 20 && p1nBad.length === 0, P1N_RAN ? p1nBad.join(' | ') : 'NO BASELINE');
"""),
(r"""  pairRow('SH5 swimmer B rebuilt digest is coach\'s surgery print ' + SWIMMER_B_DIGEST, hB === SWIMMER_B_DIGEST, hB);
""",
r"""  // SH5 runs from the D110a era onward (Version scope): swimmer B's rebuilt digest is the candidate's own state.
  minRow('SH5 swimmer B rebuilt digest is coach\'s surgery print ' + SWIMMER_B_DIGEST, hB === SWIMMER_B_DIGEST, hB);
"""),
]

# ---------------------------------------------------------------------------------------------------------------
# g213_d113a: R3v
EDITS['g213_d113a.js'] = [
(r"""//        build byte-identical to V212. PAIR. R3v: all four modes reached, each with multi-sport builds.
""",
r"""//        build byte-identical to V212. PAIR. R3v: all four modes reached, each with multi-sport builds; R3v runs
//        from 213 up (Version scope, post-V233), a minimum row and not the pair's.
"""),
(r"""function pairRow(label, cond, got){
  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 213/212 only; candidate is ' + VER + '] (now ' + got + ')'); return; }
  ok(label, cond, got);
}
""",
r"""function pairRow(label, cond, got){
  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 213/212 only; candidate is ' + VER + '] (now ' + got + ')'); return; }
  ok(label, cond, got);
}
// Version scope (post-V233): a row that holds from the D113a/D146 era onward is a minimum row, live on every candidate
// from 213 up. R3v is one; the pair rows keep PAIR.
function minRow(label, cond, got){
  if(!(VER >= ERA)){ skipRow(label + ' skipped below the D113a/D146 era'); return; }
  ok(label, cond, got);
}
"""),
(r"""  if(!BASE){ pairRow('R3 excluded injury modes need the V212 baseline', false, baseWhy); pairRow('R3v excluded mode reach needs the V212 baseline', false, baseWhy); }
  else if(!PAIR){ pairRow('R3 excluded injury modes byte-identical to V212', false, 'n/a'); pairRow('R3v excluded mode reach', false, 'n/a'); }
  else {
""",
r"""  // R3v runs from the D113a/D146 era onward (Version scope): the reach of V212's excluded-mode population on the
  // candidate lattice is a state claim, so it is a minimum row. R3, the identity to V212, stays the build pair's.
  if(!BASE){ pairRow('R3 excluded injury modes need the V212 baseline', false, baseWhy); minRow('R3v excluded mode reach needs the V212 baseline', false, baseWhy); }
  else {
    if(!PAIR) pairRow('R3 excluded injury modes byte-identical to V212', false, 'n/a');
"""),
(r"""    pairRow('R3v the lattice reaches all four excluded modes, each with multi-sport builds (' + JSON.stringify(reach) + ' multi-sport ' + JSON.stringify(multiReach) + ')',
      crash === 0 && [...MODES].every(m => reach[m] > 0 && multiReach[m] > 0), JSON.stringify(multiReach) + ' crash ' + crash);
    pairRow('R3 excluded injury modes, pace solo and multi-sport: every build byte-identical to V212 (' + n + ' builds)', n > 0 && mv === 0, mv + ', first ' + ex);
""",
r"""    minRow('R3v the lattice reaches all four excluded modes, each with multi-sport builds (' + JSON.stringify(reach) + ' multi-sport ' + JSON.stringify(multiReach) + ')',
      crash === 0 && [...MODES].every(m => reach[m] > 0 && multiReach[m] > 0), JSON.stringify(multiReach) + ' crash ' + crash);
    if(PAIR) pairRow('R3 excluded injury modes, pace solo and multi-sport: every build byte-identical to V212 (' + n + ' builds)', n > 0 && mv === 0, mv + ', first ' + ex);
"""),
]

# ---------------------------------------------------------------------------------------------------------------
# g218_d157_swim_sizer: U2
EDITS['g218_d157_swim_sizer.js'] = [
(r"""//   U2   the unit entry builds 8 weeks on the candidate (the ruling's after-grid).
""",
r"""//   U2   (from 218 up, Version scope: a minimum row, not the pair's) the unit entry builds 8 weeks on the candidate
//        (the ruling's after-grid).
"""),
(r"""    ok('U2 the unit entry builds ' + be.p.totalWeeks + ' weeks on the candidate (8, the after-grid)', be.p.totalWeeks === 8 && e.weeks === 8);
  } else { skipRow('F0 unit before-picture (pair V217 -> 218 only)'); skipRow('U2 unit after-grid length (pair V217 -> 218 only)'); } }
""",
r"""  } else skipRow('F0 unit before-picture (pair V217 -> 218 only)');
  // U2 runs from the D157 era onward (Version scope): the unit entry's 8-week after-grid is the candidate's own state.
  if(VER >= ERA) ok('U2 the unit entry builds ' + be.p.totalWeeks + ' weeks on the candidate (8, the after-grid)', be.p.totalWeeks === 8 && e.weeks === 8);
  else skipRow('U2 unit after-grid length below the D157 era'); }
"""),
]

# ---------------------------------------------------------------------------------------------------------------
# g221_d177_swapfloor: G4b and G4c
EDITS['g221_d177_swapfloor.js'] = [
(r"""//   pair rows      G4 G7-4 G8a assert only on D177's build pair: candidate 221 against baseline 220 (argv[3] when it
//                  reads 220, else git 8ee4385). Any other candidate: SKIP, scoped out, never PASS. G9 asserts on 221 only.
""",
r"""//   pair rows      G4a G7-4 G8a assert only on D177's build pair: candidate 221 against baseline 220 (argv[3] when it
//                  reads 220, else git 8ee4385). Any other candidate: SKIP, scoped out, never PASS. G9 asserts on 221 only.
//   minimum rows   G4b and G4c run from 221 up (Version scope, post-V233): Landmine rotations and Dumbbell renegade rows
//                  are named no-change under _swapDetailFor against V220 at every version, so off the pair they load
//                  V220 themselves (argv[3] when it reads 220, else git 8ee4385). No V220: FAIL, never PASS.
"""),
(r"""  G4b:'G4b (pair) L1: Landmine rotations, named no-change under _swapDetailFor, present on the lattice',
  G4c:'G4c (pair) L1: Dumbbell renegade rows, named no-change under _swapDetailFor, present on the lattice',
""",
r"""  G4b:'G4b (from 221, against V220) L1: Landmine rotations, named no-change under _swapDetailFor, present on the lattice',
  G4c:'G4c (from 221, against V220) L1: Dumbbell renegade rows, named no-change under _swapDetailFor, present on the lattice',
"""),
(r"""const PAIR_ROWS = ['G4a', 'G4b', 'G4c', 'G74', 'G8a'];
""",
r"""const PAIR_ROWS = ['G4a', 'G74', 'G8a'];   // G4b and G4c are minimum rows from 221 up (Version scope)
"""),
(r"""  skipRow(R[key], 'scoped out, candidate ' + VER + " is not D177's build pair (221 vs 220)");
};
""",
r"""  skipRow(R[key], 'scoped out, candidate ' + VER + " is not D177's build pair (221 vs 220)");
};
// G4b and G4c run from D177's era onward (Version scope): the named no-change under _swapDetailFor is against V220 at
// every version from 221 up, so off the build pair they load V220 themselves. The pair rows keep B and PAIR above.
let B4 = B, base4Why = baseWhy;
if(VER >= ERA && !B4){
  base4Why = '';
  try {
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA) B4 = b; else base4Why = 'argv[3] reads ' + b.version + '; '; }
    if(!B4){
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'g221d177-')), f = path.join(tmp, 'v220.html');
      fs.writeFileSync(f, cp.execFileSync('git', ['show', V220_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 }));
      const b = load(f); fs.rmSync(tmp, { recursive:true, force:true });
      if(+b.version === BASE_ERA){ B4 = b; base4Why += 'baseline from git ' + V220_COMMIT.slice(0, 7); } else base4Why += 'git reads ' + b.version;
    }
  } catch(e){ base4Why += 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); B4 = null; }
}
const sdB4 = B4 ? B4.eval('_swapDetailFor') : null;
const minRow = (key, cond, got) => {
  if(VER >= ERA && sdB4) return ok(R[key], cond, got);
  return ok(R[key] + ' (setup: ' + base4Why + ')', false);
};
"""),
(r"""      if(n === 'Landmine rotations'){ S.lr++; if(differ) S.lrDiff++; }
      if(n === 'Dumbbell renegade rows'){ S.rr++; if(differ) S.rrDiff++; }
""",
r"""      // G4b and G4c (minimum rows) read V220 through sdB4 at every version from 221 up; on the build pair sdB4 is sdB.
      if(n === 'Landmine rotations'){ S.lr++; if(!!sdB4 && sdB4(it.name, it.detail) !== sdE(it.name, it.detail)) S.lrDiff++; }
      if(n === 'Dumbbell renegade rows'){ S.rr++; if(!!sdB4 && sdB4(it.name, it.detail) !== sdE(it.name, it.detail)) S.rrDiff++; }
"""),
(r"""pairRow('G4b', S.lr > 0 && S.lrDiff === 0, S.lrDiff + ' of ' + S.lr);
pairRow('G4c', S.rr > 0 && S.rrDiff === 0, S.rrDiff + ' of ' + S.rr);
""",
r"""minRow('G4b', S.lr > 0 && S.lrDiff === 0, S.lrDiff + ' of ' + S.lr);
minRow('G4c', S.rr > 0 && S.rrDiff === 0, S.rrDiff + ' of ' + S.rr);
"""),
]

# ---------------------------------------------------------------------------------------------------------------
# Assert every anchor first (count == 1, applied in order on the evolving text), then write all files.
out = {}
for name, reps in EDITS.items():
    p = G / name
    s = p.read_text(encoding='utf-8')
    for k, (old, new) in enumerate(reps):
        c = s.count(old)
        if c != 1:
            sys.exit('ABORT: %s anchor %d count %d (want 1): %r' % (name, k + 1, c, old[:90]))
        s = s.replace(old, new, 1)
    out[p] = s
for p, s in out.items():
    p.write_text(s, encoding='utf-8')
    print('wrote', p.relative_to(ROOT))
print('OK: %d files, %d replacements' % (len(out), sum(len(r) for r in EDITS.values())))
