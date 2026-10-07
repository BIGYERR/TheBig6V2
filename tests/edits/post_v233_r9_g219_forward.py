#!/usr/bin/env python3
# Post-V233 tooling pass, slice R9 (tests only; index.html untouched, ia-version stays 233, no bump).
# Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Message 3: "retire the 121 except g219's D167
# rows, which get rewritten as forward checks so the V221 trio trips again." CLAUDE.md standing ruling 3 (amended):
# "When a planted bug survives and a retired or dark row was its only guard, that claim is rewritten as a forward
# check (g219's D167 rows, the V221 trio)." Evidence: measure mE ("g219 trio": PAIR = VER === ERA gates 9 rows) and
# measure mS (v219 S1-D167, S3-D171, S4-D167 trip on V219's tree, survive from V220 on).
#
# Gate: tests/gates/g219_d167_pairs.js.
#   (R-c) forward rows for the claims that guarded the trio on the 219-stamped HEAD app:
#         D167.Z  S1's guard K2a.Z, D167 "Sunday-resting athletes are byte-identical": 0 Sunday-rest configs differ from
#                 the candidate with a hand-typed Sun..Sat walk (4-element pairs) put in place of _adjDayPairs.
#         D167.H  S1's guards K2a.H / K2a.P / D167a, D167 "almost all Sunday and Monday" + the D167a licence: every day
#                 that walk moves on a Sunday-training config is Sun or Mon or a licensed cascade; it moves > 0.
#         D171.T  S3's guards K2b.N / K2b.T, D171 "155 Saturday hinge accessories stay RPE 8 before a hot Sunday": no
#                 hinge item (V218 lens) on the eve (calendar arithmetic) of a legLoad day keeps an RPE 8 clamp grammar.
#   (R-a) K2a.H, K2a.P, K2a.L, K2a.Z, D167a, K2b.N, K2b.T, R1, R2 retired (build-scoped, PAIR = VER === ERA), with the
#         XP transplant, reps(), nItems, isMainSec, TW and skipRow (nothing live reads them, comments stripped).
#         R2 (S4-D167's only guard) is PARKED: its forward form (a ceiling of 28 / 6) does not hold at 233.
#   (R-b) tests/version_scope_debt.txt: g219's line deleted (0 hits left).
# Every anchor counts exactly 1 before anything is written; the first miss aborts the whole script.
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GATE = os.path.join(ROOT, 'tests', 'gates', 'g219_d167_pairs.js')
DEBT = os.path.join(ROOT, 'tests', 'version_scope_debt.txt')
TAIL = 'retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).'


def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)


def rep(src, old, new):
    n = src.count(old)
    if n != 1:
        die(f'anchor count {n} != 1: {old[:100]!r}')
    return src.replace(old, new)


def cut(src, start, end, new, must=(), to_eof=False):
    n = src.count(start)
    if n != 1:
        die(f'start marker count {n} != 1: {start[:100]!r}')
    a = src.index(start)
    if to_eof:
        b = len(src)
    else:
        n = src.count(end)
        if n != 1:
            die(f'end marker count {n} != 1: {end[:100]!r}')
        b = src.index(end)
    if b <= a:
        die(f'end precedes start: {start[:60]!r}')
    for m in must:
        if m not in src[a:b]:
            die(f'cut lacks {m!r}')
    return src[:a] + new + src[b:]


def strip_comments(s):
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    return re.sub(r'(^|[^:\\])//[^\n]*', r'\1', s)


# ---- (R-d) run 2, only after the trip proof: python3 tests/edits/post_v233_r9_g219_forward.py --survivors -----------
# Deletes the v219 survivors-list lines that now TRIP on index.html at 233 (S1-D167 through D167.Z/D167.H, S3-D171
# through D171.T). S4-D167 stays listed: its only guard (R2) is parked. The list only shrinks.
SURV = os.path.join(ROOT, 'tests', 'sabotage', 'known_survivors.txt')
if sys.argv[1:] == ['--survivors']:
    v = open(SURV, encoding='utf-8').read()   # re-read immediately before writing
    for pre in ('v219.json S1-D167 -> each dedupe pair takes the seed index of its position in the walk again,',
                'v219.json S3-D171 -> the hinge clamp sweep reads tomorrow in Sun..Sat order again,'):
        n = v.count(pre)
        if n != 1:
            die(f'survivors line count {n} != 1: {pre[:80]!r}')
        a = v.index(pre)
        if a and v[a - 1] != '\n':
            die(f'survivors anchor is not a line start: {pre[:80]!r}')
        v = v[:a] + v[v.index('\n', a) + 1:]
    if v.count('v219.json S4-D167 -> ') != 1:
        die('S4-D167 survivors line must stay')
    open(SURV, 'w', encoding='utf-8').write(v)
    print('wrote tests/sabotage/known_survivors.txt')
    sys.exit(0)
if sys.argv[1:]:
    die('usage: post_v233_r9_g219_forward.py [--survivors]')

s0 = open(GATE, encoding='utf-8').read()
s = s0

# ---- 1. header: the rows, arms and version predicate this gate now has -------------------------------------------
s = cut(s, '// THE RULINGS THIS DEFENDS (not the version they ship on):\n', "'use strict';\n", """// THE RULINGS THIS DEFENDS (not the version they ship on):
//   D167   `_adjDayPairs` walked Sun..Sat and paired W sat with W+1 sun (8 days apart) while the week renders Mon..Sun.
//          CFs: pairs Mon..Sun plus W sun -> W+1 mon, walked in calendar order, each pair keeping the seed index its
//          A day holds today. "CFs moves 370 programs / 859 days, almost all Sunday and Monday. The legacy index is a
//          label the RNG reads; a later ruling may reseed it. Sunday-resting athletes are byte-identical."
//   D167a  a mid-week event is licensed only when (a) the previous calendar day is itself in the A set, (b) the day's
//          diff is confined to the dedupe swap (equal item count, 0 losses), (c) the swap stays within pattern, depth 1.
//   D171   the two Sunday-first "tomorrow" readers read the calendar's tomorrow: "155 Saturday hinge accessories stay
//          RPE 8 before a hot Sunday, 2 Sundays clamped for nothing." hotNextHingeClampSweep is defended by D171.T;
//          buildProgram's inline `hotNext` (the `_ISO_ORDER.length-1` form) is UNDEFENDED: not a callable unit, and
//          reverting it is inert on all 15,180 lattice configs.
//
// ORACLES, independent of the engine under test:
//   CAL    Monday-start date arithmetic: a day's calendar index is (w-1)*7 + {mon:0 .. sun:6}; its predecessor is
//          index-1, its tomorrow index+1; the block's first day is W1 Monday (index 0) and has no predecessor, the
//          final Sunday has no tomorrow. The pinned startDates of the lattice (2026-09-21, 2026-10-05) are Mondays.
//          `_adjDayPairs` is never called or read for what a pair is.
//   CARD   the shipped day cards themselves (JSON per calendar day), read off prog.weeks.
//   WALK   the legacy walk typed by hand from D167's text (Sun..Sat, W sat -> W+1 sun, no 5th element, so every pair
//          seeds from its position in that walk: the index each A day held before D167).
//   PAT    a hand table (below) for "within pattern" on the licensed cascade swaps; a name not in it fails.
//   LENS   hinge membership (D171.T) is read through the FROZEN V218 artifact's _pattern. The candidate's own lens
//          is never consulted.
//
// ARMS
//   V218   git 44fd483 (or argv[3] when it reads 218). Frozen before-picture for B0/F0 and the LENS.
//   CAND   the candidate, with one inert logging line at the dedupe rename (`        it.name=to;` count==1) that
//          records [the day object being renamed, the name before]. The day is LOCATED by object identity in the
//          shipped program, never by the engine's pair coordinates. D1 and D171.T read CAND.
//   LW     CAND with its `function _adjDayPairs(...)` replaced by WALK (anchor count==1). D167.Z/D167.H read CAND vs LW.
//
// LATTICE: the D167 lattice of tests/measure/v219_chain_rebaseline.js (lat 'C', 15,180 configs), copied verbatim.
//   Swept: ALL 3,900 Sunday-training configs + every 8th Sunday-rest config in lattice order (1,410 of 11,280).
//
// ROWS (every build >= 219)
//   B0   V218 reads 218; V218 equals itself; both logging lines are inert (progDigest) on every 50th swept config.
//   F0   fixture: V218's dedupe makes renames whose name is NOT on the calendar-previous card (so D1 can fail).
//   D1   every dedupe rename in CAND lands on a day located in the shipped program whose calendar predecessor's
//        shipped card carries the renamed name; 0 renames on W1 Monday; renames > 0.
//   D167.Z  FORWARD (K2a.Z's claim; v219 S1-D167's guard): 0 swept Sunday-rest configs differ, CAND vs LW; and LW moves
//           > 0 Sunday-training programs, so the walk is live (V218, whose own walk is WALK, fails it).
//   D167.H  FORWARD (K2a.H, K2a.P and D167a's claims; S1-D167's guards): every day LW moves on a Sunday-training
//           config is a Sunday or a Monday, or a mid-week day licensed by D167a (a)(b)(c) at depth 1; moved > 0.
//   D171.T  FORWARD (K2b.N and K2b.T's claim; v219 S3-D171's guard): no hinge item (LENS) on a training day whose
//           calendar tomorrow (CAL) carries legLoad cardio (CARD) keeps '@ RPE 8' or 'RPE 8 (stop 2 reps short of
//           failure)'; > 0 such items sit on a final Saturday.
//   K2a.H, K2a.P, K2a.L, K2a.Z, D167a, K2b.N, K2b.T, R1 and R2 """ + TAIL + """
//        They pinned D167/D171 on the build pair (219 vs V218 and the XP transplant). PARKED (standing ruling 7):
//        R2's claim ("CAND calendar repeats sat>sun 28, sun>mon 6", v219 S4-D167's only guard) has no forward form
//        with an independent oracle (whether a swap was legal needs the build's own swap universe), and its count
//        form (a ceiling of 28 / 6) does not hold at 233: 36 / 6 from V226 (D188/D189, measure mE's bisect).
//
// VERSION PREDICATE (standing rulings 2 and 4). D167/D171 ship on ia-version 219.
//   below 219: REFUSED, every row FAILS by name (never a vacuous pass). 219 and above: every row runs.
// env: G219_SHARDS (default min(4, cpus)).
'use strict';
""", must=('K2b    D171 text events', 'PAIR rows print'))

# ---- 2. row list, helpers -----------------------------------------------------------------------------------------
s = rep(s, "const PAIR_ROWS = ['K2a.H','K2a.P','K2a.L','K2a.Z','D167a','K2b.N','K2b.T','R1','R2'], DUR_ROWS = ['B0','F0','D1'];\n",
        "const DUR_ROWS = ['B0','F0','D1','D167.Z','D167.H','D171.T'];\n")
s = rep(s, "const HAND_PAT = { 'dumbbell romanian deadlift':'hinge', 'kettlebell swing':'hinge' };\n",
        "const HAND_PAT = { 'dumbbell romanian deadlift':'hinge', 'kettlebell swing':'hinge' };\n"
        "// ── WALK: the legacy walk, typed by hand from D167's text (Sun..Sat, W sat -> W+1 sun, 4-element pairs) ────────\n"
        "const WALK = \"function _adjDayPairs(totalWeeks){\\n  const SS=['sun','mon','tue','wed','thu','fri','sat'], out=[];\\n\"\n"
        "  + \"  for(let w=1;w<=totalWeeks;w++){\\n    for(let i=1;i<7;i++) out.push([w,SS[i-1],w,SS[i]]);\\n\"\n"
        "  + \"    if(w<totalWeeks) out.push([w,'sat',w+1,'sun']);\\n  }\\n  return out;\\n}\\n\";\n")
s = rep(s, "const nItems = y => ((y && y.sections) || []).reduce((a, s) => a + ((s && s.items) || []).length, 0);\n", '')
s = rep(s, "const isMainSec = s => /^(main|primer|power)/i.test((s && s.label) || '');\n", '')

# ---- 3. worker: LW arm in place of XP, forward rows in place of K2a/D167a/K2b/R1/R2 ----------------------------
s = rep(s, "const Vi = load(A.v218i), Ci = load(A.candi), XP = A.xp ? load(A.xp) : null, V = load(A.v218), C = load(ART);\n",
        "const Vi = load(A.v218i), Ci = load(A.candi), LW = A.lw ? load(A.lw) : null, V = load(A.v218), C = load(ART);\n")
s = rep(s, "  const TW = Vi.eval('isTrackableWeight'), PAT = Vi.eval('_pattern');\n", "  const PAT = Vi.eval('_pattern');\n")
s = cut(s, "  const reps = (p, pre) => {", "  for(let q = si; q < SW.length; q += sn){", '', must=("bump(pre + pt)",))
s = cut(s, "    if(!XP) continue;\n", "  }\n  fs.writeFileSync(process.env.G219OUT", """    // D171.T (forward, CAND alone): a hinge item on the eve of a legLoad day carries no RPE 8 clamp grammar
    { const cc = calOf(c.p), LWK = lastWeek(c.p);
      Object.keys(cc).map(Number).forEach(ix => { const a = cc[ix], b = cc[ix + 1]; if(!a || !b || !trains(a.y) || !(b.y && b.y.cardio && b.y.cardio.legLoad)) return;
        const fin = a.w === LWK && a.d === 'sat';
        a.y.sections.forEach(sec => ((sec && sec.items) || []).forEach(it => { if(!it || !it.name || PAT(it.name) !== 'hinge') return; const det = String(it.detail || '');
          bump('T eve hinge'); if(fin) bump('T final sat hinge');
          if(det.indexOf('@ RPE 8') >= 0 || det.indexOf('RPE 8 (stop 2 reps short of failure)') >= 0){ bump('T unclamped'); if(fin) bump('T unclamped final sat'); ex('T unclamped', tag + ' W' + a.w + ' ' + a.d + ' ' + it.name + ' ' + JSON.stringify(det)); }
          else if(det.indexOf('@ RPE 7') >= 0 || det.indexOf('RPE 7 (leave 3 or more in reserve)') >= 0){ bump('T clamp form'); if(fin) bump('T clamp form final sat'); } })); }); }
    if(!LW) continue;
    // D167.Z / D167.H (forward): CAND vs LW, the candidate with the hand-typed Sun..Sat walk put back
    const xl = LW.buildProgram(cl(x.c)); const cc2 = calOf(c.p), cl2 = calOf(xl);
    const EV = new Set(); new Set(Object.keys(cc2).concat(Object.keys(cl2))).forEach(k => { if(JSON.stringify(cc2[k] && cc2[k].y) !== JSON.stringify(cl2[k] && cl2[k].y)) EV.add(+k); });
    if(sr){ if(EV.size){ bump('Z sunREST programs'); ex('Z sunREST', tag + ' ' + [...EV].slice(0, 4).map(ix => 'W' + (Math.floor(ix / 7) + 1) + ' ' + ISO[ix % 7]).join(',')); } continue; }
    if(EV.size) bump('H programs');
    const mid = ix => { const d = ISO[ix % 7]; return d !== 'sun' && d !== 'mon'; };
    const depth = ix => (EV.has(ix - 1) && mid(ix - 1)) ? 1 + depth(ix - 1) : 1;
    EV.forEach(ix => { const d = ISO[ix % 7], w = Math.floor(ix / 7) + 1; bump('H days ' + d); if(!mid(ix)) return;
      const ya = cl2[ix] && cl2[ix].y, yb = cc2[ix] && cc2[ix].y, sw = swapOnly(ya, yb);
      const pat = sw.ok && sw.sw.every(([p0, q0]) => HAND_PAT[String(p0).toLowerCase()] && HAND_PAT[String(p0).toLowerCase()] === HAND_PAT[String(q0).toLowerCase()]);
      const z = { tag, w, d, a:EV.has(ix - 1), b:sw.ok, why:sw.why || '', c:!!pat, depth:depth(ix), sw:(sw.sw || []).map(q => q[0] + ' -> ' + q[1] + ' [' + q[2] + ']').join('; ') };
      if(!(z.a && z.b && z.c && z.depth === 1)) bump('H unlicensed'); if(CAS.length < 40) CAS.push(z); else bump('H cascades unlisted'); });
""", must=("const x1 = XP.buildProgram", "reps(v.p, 'R1 ');"))

# ---- 4. main: no pair predicate; the LW transplant always runs at >= 219 --------------------------------------
s = rep(s, "const skipRow = l => { skip++; console.log('SKIP ' + l); };\n", '')
s = rep(s, "  DUR_ROWS.concat(PAIR_ROWS).forEach(r => ok(r + ' refused: candidate ' + VER + ' is below the D167 era', false)); done(); }\n",
        "  DUR_ROWS.forEach(r => ok(r + ' refused: candidate ' + VER + ' is below the D167 era', false)); done(); }\n")
s = rep(s, "const PAIR = VER === ERA;\n", '')
s = rep(s, "let setupErr = null, xpErr = null;\n", "let setupErr = null, lwErr = null;\n")
s = rep(s, "candi:path.join(TMP, 'candi.html'), xp:null };\n", "candi:path.join(TMP, 'candi.html'), lw:null };\n")
s = cut(s, "  if(PAIR){ try {\n", "  fs.writeFileSync(path.join(TMP, 'arts.json'), JSON.stringify(arts));\n", """  try {
    const FN = 'function _adjDayPairs(', Ci = fs.readFileSync(arts.candi, 'utf8');
    if(cnt(Ci, FN) !== 1) throw new Error(FN + ' count ' + cnt(Ci, FN) + ' in the candidate');
    const i0 = Ci.indexOf(FN), k0 = Ci.indexOf('\\n}\\n', i0); if(k0 < 0) throw new Error('no close of _adjDayPairs in the candidate');
    const X = Ci.slice(0, i0) + WALK + Ci.slice(k0 + 3); if(cnt(X, WALK) !== 1 || cnt(X, FN) !== 1) throw new Error('legacy walk did not land');
    arts.lw = path.join(TMP, 'lw.html'); fs.writeFileSync(arts.lw, X);
    console.log('  legacy walk: candidate _adjDayPairs ' + (Ci.slice(i0, k0 + 3) === WALK ? 'IDENTICAL to' : 'replaced by') + ' the hand-typed Sun..Sat walk');
  } catch(e){ lwErr = String(e && e.message || e).slice(0, 200); }
""", must=("arts.xp = path.join(TMP, 'xp.html')",))
s = rep(s, "if(setupErr){ console.log('SETUP FAILED: ' + setupErr); DUR_ROWS.concat(PAIR ? PAIR_ROWS : []).forEach(r => ok(r + ' (setup: ' + setupErr + ')', false)); if(!PAIR) PAIR_ROWS.forEach(r => skipRow('pair row ' + r + ': candidate ' + VER + \" is not D167's pair\")); done(); }\n",
        "if(setupErr){ console.log('SETUP FAILED: ' + setupErr); DUR_ROWS.forEach(r => ok(r + ' (setup: ' + setupErr + ')', false)); done(); }\n")

# ---- 5. report: the forward rows in place of the pair rows ------------------------------------------------------
s = cut(s, "  if(!PAIR){ PAIR_ROWS.forEach(r => skipRow(", None, """  // K2a.H, K2a.P, K2a.L, K2a.Z, D167a, K2b.N, K2b.T, R1 and R2 """ + TAIL + """ They pinned D167/D171 on the
  // build pair (219 vs V218 and the XP transplant). The claims that were v219 S1-D167's and S3-D171's only guards are
  // the forward rows below (standing ruling 3 as amended); R2's (S4-D167's only guard) is parked, see the header.
  if(lwErr){ console.log('LEGACY WALK FAILED: ' + lwErr); ['D167.Z', 'D167.H'].forEach(r => ok(r + ' (legacy walk: ' + lwErr + ')', false)); }
  else {
    const H = g('H programs'), Z = g('Z sunREST programs'), hist = ISO.map(d => d + ' ' + g('H days ' + d)).join(', '), midN = CAS.length + g('H cascades unlisted');
    ok('D167.Z FORWARD (every build >= 219): the seed index is carried, so 0 of the ' + g('cfg sunREST') + ' Sunday-rest configs swept differ from the candidate with the hand-typed Sun..Sat walk put back, and that walk is live (' + H + ' Sunday-training programs move)',
      g('cfg sunREST') === 1410 && Z === 0 && H > 0, Z + ' Sunday-rest programs differ, Sunday-training programs moved ' + H + exs('Z sunREST'));
    CAS.slice(0, 12).forEach(z => console.log('    D167a ' + z.tag + ' W' + z.w + ' ' + z.d + ' | (a) prev moved ' + z.a + ' | (b) swap only ' + z.b + (z.why ? ' (' + z.why + ')' : '') + ' | (c) within pattern ' + z.c + ' | depth ' + z.depth + ' | ' + z.sw));
    if(midN > 12) console.log('    D167a ... ' + (midN - 12) + ' more mid-week days');
    ok('D167.H FORWARD (every build >= 219): every day the hand-typed Sun..Sat walk moves on the ' + g('cfg sunTRAIN') + ' Sunday-training configs is a Sunday or a Monday, or a D167a cascade (previous calendar day moved, swap only, within pattern by the hand table, depth 1) [' + H + ' programs; ' + hist + ']',
      H > 0 && !g('H unlicensed'), H + ' programs [' + hist + '], mid-week ' + midN + ', unlicensed ' + g('H unlicensed'));
  }
  ok('D171.T FORWARD (every build >= 219): no hinge item (V218 lens) on a training day whose calendar tomorrow carries legLoad cardio keeps an RPE 8 clamp grammar (' + g('T eve hinge') + ' items, ' + g('T final sat hinge') + ' on a final Saturday, ' + g('T clamp form') + ' read the clamped form)',
    g('T final sat hinge') > 0 && !g('T unclamped'), 'unclamped ' + g('T unclamped') + ' (final Saturday ' + g('T unclamped final sat') + '), final-Saturday items ' + g('T final sat hinge') + exs('T unclamped'));
  done();
}
""", must=("ok('R2 CAND calendar repeats",), to_eof=True)

# ---- 6. proofs on the written text, before anything lands -------------------------------------------------------
code = strip_comments(s)
for w in ('PAIR', 'PAIR_ROWS', 'XP', 'xpErr', 'nItems', 'isMainSec', 'TW', 'skipRow', 'K2a', 'K2b', "'R1", "'R2"):
    if re.search(r'(?<![\w.])' + re.escape(w) + r'(?![\w])', code):
        die(f'retired name still in code: {w}')
if re.search(r'(?<![\w.])reps\s*[(=]', code):   # the helper; the word itself lives on in the grammar text 'stop 2 reps short'
    die('retired helper still in code: reps')
for w in ('swapOnly', 'noKey', 'HAND_PAT', 'lastWeek', 'WALK', 'PAT(', 'namesOn', 'trains(', 'MONDAY', 'V218_COMMIT', 'progDigest'):
    if w not in code:
        die(f'live helper missing: {w}')
if re.search(r'VER\s*===?\s*ERA', code):
    die('an exact-version predicate is left')
for row in ("ok('SH all '", "ok('B0 baselines:", "ok('F0 fixture:", "ok('D1 DURABLE:"):
    if s.count(row) != 1 or s0.count(row) != 1:
        die(f'live row moved: {row}')
    i, j = s.index(row), s0.index(row)
    if s[i:s.index('\n', i)] != s0[j:s0.index('\n', j)]:
        die(f'live row line changed: {row}')

# ---- 7. version_scope_debt.txt: g219's line goes (0 hits); re-read immediately before writing --------------------
d = open(DEBT, encoding='utf-8').read()
d = rep(d, 'g219_d167_pairs.js 1  # 9 rows, mE classes 0/8/1\n', '')

open(GATE, 'w', encoding='utf-8').write(s)
print('wrote tests/gates/g219_d167_pairs.js')
open(DEBT, 'w', encoding='utf-8').write(d)
print('wrote tests/version_scope_debt.txt')
