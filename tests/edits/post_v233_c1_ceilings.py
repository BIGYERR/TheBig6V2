#!/usr/bin/env python3
# Post-V233 tooling pass, ceiling-retirement slice C1 (tests only; index.html untouched, ia-version stays 233).
# Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Message 3, and standing ruling 3 as amended:
# a check written to switch off after its own build retires when the next build ships, and the previous-version run
# (Proof scope) is its replacement. Evidence: measure mC (tests/measure/v233_rulings/measure_ceilings_mC.md,
# tests/measure/v233_ceiling_rows.js): SILENT-CEILING predicates switch rows off above a version; all dark at 233.
# This slice retires four of them, each with its predicate or flag and any helper only the retired rows read:
#   g190_rounds          G11b (else of `VER < D176_ERA`; D176 P-BARERX, V220). G11f keeps D176_ERA/VER_OK/VER.
#   g199_deload_arbitration  I2c, I2d (flag I2_V231; V231 absorb ruling, D196). I2_V231 stays: it drives live I2.
#                        Unread after retirement: I2_SKIP, the worker's reBudTier / reBudRename accumulators and the
#                        shipSec map that only reBudRename read.
#   g217_d160_dedupe_view  K1 gk/multi V216 -> candidate delta, K2 gk/multi, K3, K4 gk/multi, K5 gk/multi, K6
#                        (PAIR_SCOPE = VER <= 218; D160 V217/218, V219 rescope). Live K0, K1 gk and K1 multi (the
#                        candidate side, which reads D160_MULTI_BY_VERSION[217].phantoms) are kept byte for byte, as
#                        are the INFO lines (K <lim>, K <mix> phantoms, INFO gap) and the computation feeding them.
#                        SAMEDAY_TWIN_BY_VERSION and FWD_MAIN_BY_VERSION have no live reader and are deleted with their
#                        CLOSED registrations in tests/era_bump.py; D160_MULTI_BY_VERSION stays (K1 reads it).
#   g224_d185_wctoday    the five positional rows "line 643".."line 647" (`artifactV <= 231`; D185, V232 D199 call 17);
#                        1b carries the claim position-free.
# Retired names also leave g217's KNAMES (the below-era skip list and the error-path FAIL lists).
# Diff classes: (R-e) silent-ceiling rows and conjuncts retired with their predicates/flags and unread helpers;
# (R-f) two CLOSED era-table registrations removed from tests/era_bump.py, their tables deleted.
# Every anchor counts exactly 1 before anything is written; the first miss aborts the whole script.
import os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = os.path.join(ROOT, 'tests', 'gates')
ERA_PY = os.path.join(ROOT, 'tests', 'era_bump.py')
TAIL = 'retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).'


def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)


def rep(name, src, old, new):
    n = src.count(old)
    if n != 1:
        die(f'{name}: anchor count {n} != 1: {old[:90]!r}')
    return src.replace(old, new)


def cut(name, src, start, end, must=(), new='', must_not=()):
    """Replace src[start_marker : end_marker) with new; both markers count 1, the cut holds every `must`."""
    for m in (start, end):
        n = src.count(m)
        if n != 1:
            die(f'{name}: marker count {n} != 1: {m[:90]!r}')
    a, b = src.index(start), src.index(end)
    if b <= a:
        die(f'{name}: end marker precedes start marker: {start[:60]!r}')
    piece = src[a:b]
    for m in must:
        if m not in piece:
            die(f'{name}: cut lacks {m!r}')
    for m in must_not:
        if m in piece:
            die(f'{name}: cut holds {m!r}, which is live')
    return src[:a] + new + src[b:]


def read(p):
    return open(p, encoding='utf-8').read()


out = {}

# ── g190_rounds: G11b ────────────────────────────────────────────────────────────────────────────────────────
n = 'g190'
p = os.path.join(G, 'g190_rounds.js')
s = read(p)
s = cut(n, s, "  // ERA (standing rulings 2/4). G11b is the pre-D176 contract: a round block's row is the bare remainder\n",
        "  const D176_ERA = 220, VER_OK = /^\\d+$/.test(String(IA.version)), VER = VER_OK ? parseInt(IA.version, 10) : NaN;\n",
        must=("SKIPs by name and G11f carries the row.",),
        new="  // G11b (the pre-D176 bare-remainder row, D176 P-BARERX V220, dark from `VER < D176_ERA`) " + TAIL + " G11f carries the row.\n")
s = cut(n, s, "  if(!VER_OK) check('G11b era: ia-version is readable', false,",
        "  tryCheck('G11c a rounds:null block keeps its rows intact', () => {",
        must=("else if(VER < D176_ERA) tryCheck('G11b rendered rows lose the leading count'", "SKIP G11b: pre-D176 era"),
        must_not=("tryCheck('G11f",))
out[p] = s

# ── g199_deload_arbitration: I2c, I2d ────────────────────────────────────────────────────────────────────────
n = 'g199'
p = os.path.join(G, 'g199_deload_arbitration.js')
s = read(p)
s = rep(n, s, 'reBudNonMob:0,reBudTier:{},reBudRename:{},lensOnlyHand:{}', 'reBudNonMob:0,lensOnlyHand:{}')
s = rep(n, s, 'const shipPost={}, shipLab={}, shipSec={}, wkShip={}', 'const shipPost={}, shipLab={}, wkShip={}')
s = rep(n, s, "          const SM={}; ((day&&day.sections)||[]).forEach(sec=>{ SM[String((sec&&sec.label)||'')]=((sec&&sec.items)||[]).map(it=>String((it&&it.name)||'')); });\n"
              "          shipSec[w+'|'+d]=SM; tot+=n; });\n",
          "          tot+=n; });\n")
s = rep(n, s, "S.reBudNonMob++;\n"
              "            bump(S.reBudTier, String(L.key).split('|')[0]);\n"
              "            const SM=shipSec[r.w+'|'+r.d]||{};\n"
              "            (r.p3||[]).filter(sc=>secPost(sc)>0).forEach(sc=>bump(S.reBudRename, sc.l+': '+(sc.n||[]).filter(isPost).join(', ')+' -> '+((SM[sc.l]||[]).join(', ')||'(section gone)'))); } }\n",
          "S.reBudNonMob++; } }\n")
s = cut(n, s, "  const I2_V231=IP.version>=231, I2_SKIP=r=>'SKIP '+r+': RETIRED at ia-version '",
        "  ok(N.swapReBudget===(I2_V231?0:108),",
        must=("Never PASS, never FAIL.\";\n",),
        new="  const I2_V231=IP.version>=231;\n")
s = cut(n, s, "  if(I2_V231) console.log(I2_SKIP('I2c')); else ok(g(N.reBudRename,",
        "  ok(N.swapReBudgetWeekZero===0,'I2b and not one of those '",
        must=("I2_SKIP('I2d')", "'I2d every one of them is on the bodyweight tier ("),
        new="  // I2c and I2d (the V230 Burpees renamer rows, D196 P-BWFALLBACK, dark from I2_V231 = IP.version>=231) " + TAIL + "\n")
out[p] = s

# ── g217_d160_dedupe_view: the K-limb pair rows ──────────────────────────────────────────────────────────────
n = 'g217'
p = os.path.join(G, 'g217_d160_dedupe_view.js')
s = read(p)
s = rep(n, s, "const KNAMES = ['K0','K1 gk','K1 multi','K2 gk','K2 multi','K3','K4 gk','K4 multi','K5 gk','K5 multi','K6'];",
        "const KNAMES = ['K0','K1 gk','K1 multi'];")
s = cut(n, s, "const SAMEDAY_TWIN_BY_VERSION = {}; SAMEDAY_TWIN_BY_VERSION[217] = ",
        "let pass = 0, fail = 0, skip = 0, TMP = null;\n",
        must=("SAMEDAY_TWIN_BY_VERSION[218] = SAMEDAY_TWIN_BY_VERSION[217];", "FWD_MAIN_BY_VERSION[217] = 609;",
              "FWD_MAIN_BY_VERSION[218] = FWD_MAIN_BY_VERSION[217];"),
        must_not=("D160_MULTI_BY_VERSION",))
s = cut(n, s, "const PAIR_SCOPE = VER <= 218;", "const CALPREV = VER >= 219;",
        must=("const skipPair = r => skipRow(",))
s = rep(n, s, "{ const KROW = D160_MULTI_BY_VERSION[VER], TWIN = SAMEDAY_TWIN_BY_VERSION[VER], FWD = FWD_MAIN_BY_VERSION[VER];\n  const IN6 = ",
        "{ const IN6 = ")
s = cut(n, s, "  else if(PAIR_SCOPE && !KROW && !TWIN && FWD === undefined) kErr = ",
        "  else { const h6 = fs.readFileSync(path.join(TMP, 'v216_raw.html'), 'utf8'), h7 = RAW.html;")
s = cut(n, s, "    const isStrK = n => /stretch|mobility|90\\/90|foam|worlds greatest|breath/i.test(n || '');\n",
        "    const kb = (X, c) => {",
        must=("const accK = ", "const svg = ", "const MAINRX = ", "const mainName = ", "const accF = ", "const calOf = "),
        must_not=("const nK = ", "const lc = ", "const dix = "))
s = rep(n, s, "ev:{P:0,A:0,B:0,C:0,D:0}, days:{}, one:0, itemCnt:0, rep6:0, rep7:0, repC7:0, add:0, rem:0, swu:0, pairs:0, ex:'' });",
        "days:{} });")
s = rep(n, s, "    const PH = {}, GAP = {}, FWDN = [0, 0]; let dateChk = 0, dateBad = 0;\n    const gd = RAW.eval('_progDayDate');\n",
        "    const PH = {}, GAP = {};\n")
s = rep(n, s, "    KL.forEach((x, idx) => {\n", "    KL.forEach(x => {\n")
s = cut(n, s, "      s.cfg++; s.pairs++;\n", "      const P = PH[x.mix] || (PH[x.mix] = [0, 0, 0, 0]), G = GAP[x.mix] || (GAP[x.mix] = {});\n",
        must=("const kex = m => ",), new="      s.cfg++;\n")
s = cut(n, s, "      if(idx % 97 === 0 && x.c.startDate){", "      const posKey = e => ",
        must=("dateChk++", "FWDN[k]++"))
s = rep(n, s, "        s.ev[c]++; (dayCls[e.w + '|' + e.d] = ", "        (dayCls[e.w + '|' + e.d] = ")
s = cut(n, s, "      const C6 = calOf(a.p), C7 = calOf(b.p), nb = ", "      let chg = 0;\n",
        must=("const shared = ", "const dup = "))
s = cut(n, s, "        if(cs.length !== 1){ s.one++; kex(", "      if(chg) s.progs++;\n",
        must=("s.itemCnt++", "s.add++", "s.rep6 += r6", "if(cs === 'C') s.repC7 += r7; }\n"),
        new="        if(cs.length === 1) s.days[cs] = (s.days[cs] || 0) + 1; }\n")
s = rep(n, s, "      if(JSON.stringify(a.p._swapUniverse) !== JSON.stringify(b.p._swapUniverse)){ s.swu++; kex('_swapUniverse differs'); }\n", "")
s = rep(n, s, "    const noRow = r => ok(r + ' NO ROW for ia-version ' + VER + ' (standing rulings 2/4: add the ruled row)', false);\n", "")
s = rep(n, s, "    if(!PAIR_SCOPE){ const K1MIX = Object.keys(D160_MULTI_BY_VERSION[217].phantoms);\n",
        "    // K1's V216 -> candidate delta, K2 gk/multi, K3, K4 gk/multi, K5 gk/multi and K6 (D160's V217/218 pair claims, dark from PAIR_SCOPE = VER <= 218) " + TAIL + "\n"
        "    { const K1MIX = Object.keys(D160_MULTI_BY_VERSION[217].phantoms);\n")
s = cut(n, s, "\n        skipPair('K1 ' + l + ' V216 -> candidate delta'); });\n", "\n  } }\ndone();",
        must=("['K2 gk','K2 multi','K3','K4 gk','K4 multi','K5 gk','K5 multi','K6'].forEach(skipPair);", "    } else {\n",
              "if(FWD === undefined) noRow('K6'); else ok('K6 gk accessory today == Main tomorrow:", "FWDN[1] === FWD);\n    }"),
        new=" });\n    }")
out[p] = s

# ── g224_d185_wctoday: the five positional rows ──────────────────────────────────────────────────────────────
n = 'g224'
p = os.path.join(G, 'g224_d185_wctoday.js')
s = read(p)
s = cut(n, s, "// Positional rows: the V224 layout premise (standing ruling 4), scoped to ia-version <= 231",
        "// ── 1b. position-free successor (V232 D199, session call 17)",
        must=("const POSITIONAL_MAX_V = 231;", "POSITIONAL.forEach(", "if (skip1) console.log("),
        must_not=("const V224_NAMES",),
        new="// The five positional rows (\"line 643\"..\"line 647\", the V224 layout premise, dark from `artifactV <= 231` by V232 D199 call 17) " + TAIL + " 1b carries the claim.\n\n")
out[p] = s

# ── tests/era_bump.py: the two CLOSED registrations whose tables were deleted ────────────────────────────────
n = 'era_bump'
s = read(ERA_PY)
s = rep(n, s, "    ('tests/gates/g217_d160_dedupe_view.js', 'SAMEDAY_TWIN_BY_VERSION'): 218,\n", "")
s = rep(n, s, "    ('tests/gates/g217_d160_dedupe_view.js', 'FWD_MAIN_BY_VERSION'): 218,\n", "")
out[ERA_PY] = s

for p, s in out.items():
    open(p, 'w', encoding='utf-8').write(s)
    print('wrote ' + os.path.relpath(p, ROOT))
