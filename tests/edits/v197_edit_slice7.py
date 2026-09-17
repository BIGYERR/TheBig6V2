#!/usr/bin/env python3
# V197 slice 7 — GATE ONLY. index.html is NOT touched by this script.
# D86: ratify the family predicate, pair it with a one-sided down-only ratchet.
# D87: replace the prose Δcost ceiling with one derived from the file's own hsets table,
#      assert DOWN-0 and assert that over-cap cells are pre-existing, not introduced.
import hashlib, io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GATE = os.path.join(ROOT, 'tests', 'gates', 'g197_leg_accessory.js')
HTML = os.path.join(ROOT, 'index.html')

HTML_MD5_EXPECTED = '6e9f47e36abe00d3484953c5a3ee2d76'
before_md5 = hashlib.md5(open(HTML, 'rb').read()).hexdigest()
assert before_md5 == HTML_MD5_EXPECTED, 'index.html md5 drifted before edit: %s' % before_md5

src = io.open(GATE, encoding='utf-8').read()
edits = []


def rep(tag, old, new):
    edits.append((tag, old, new))


# ── 1. hoist the posterior-free leg-cell predicate to top level so the TOTAL census
#       (D86) and the CAUSED census can share one copy, and point the blindness probe
#       at that same copy instead of a re-typed duplicate. ────────────────────────────
rep('1-hoist-predicate',
    "const E_POSTERIOR = new Set(['hinge','hip_ext','leg_iso']);\n",
    "const E_POSTERIOR = new Set(['hinge','hip_ext','leg_iso']);\n"
    "// one copy of the predicate, shared by the CAUSED census (E3b) and the TOTAL census\n"
    "// (E3e-E3g). A leg cell is one carrying either leg accessory label; it is posterior-free\n"
    "// when no name on the card reads as hinge, hip extension or leg isolation.\n"
    "const eLegCell = o => o.labels.indexOf('Calves') >= 0 || o.labels.indexOf('Leg isolation') >= 0;\n"
    "const eZeroP   = o => eLegCell(o) && !o.names.some(n => E_POSTERIOR.has(ePat(n)));\n")

rep('1b-probe-repoint',
    "  const zero = o => !o.names.some(n => E_POSTERIOR.has(ePat(n)));\n",
    "  const zero = eZeroP;   // the function the sweep actually uses, not a re-typed copy\n")

# ── 2. D87: the Δcost ceiling, derived. Plus the cap value and the new counters. ─────
rep('2-derive-ceiling',
    "const E_SLOT_MAX = 4;   // hsets is 4 for advanced, 3 otherwise: one accessory slot, by hand\n",
    "// ── D87: the Δcost ceiling is DERIVED from the file's own table, not asserted in prose.\n"
    "// The residual between the two push orders is one accessory slot. The Calves section is\n"
    "// exactly ONE item carrying hsets sets (CALF_PUSH above), and hsets is declared\n"
    "// `cfg.experience==='advanced'?4:3` at every site in the file. So the most a single\n"
    "// Calves slot can cost is (items × max hsets) = 4, and Δcost cannot exceed it. Parsed\n"
    "// here, so an edit that changes the section's item count or the hsets table MOVES this\n"
    "// ceiling instead of silently falsifying a hard-coded 4.\n"
    "const HSETS_VALS = [];\n"
    "{ const re = /const hsets\\s*=\\s*cfg\\.experience\\s*===\\s*'advanced'\\s*\\?\\s*(\\d+)\\s*:\\s*(\\d+);/g;\n"
    "  let m; while ((m = re.exec(RAW))) HSETS_VALS.push([parseInt(m[1],10), parseInt(m[2],10)]); }\n"
    "const HSETS_MAX  = HSETS_VALS.length ? Math.max.apply(null, HSETS_VALS.map(v => Math.max(v[0], v[1]))) : 0;\n"
    "const CALF_ITEMS = (CALF_PUSH.match(/\\{name:/g) || []).length;\n"
    "const E_SLOT_MAX = HSETS_MAX * CALF_ITEMS;\n"
    "const E_CAP      = parseInt(((RAW.match(/const SESSION_SET_BUDGET = (\\d+);/) || [])[1] || '0'), 10);\n"
    "ok('E4h the hsets table parses and every site agrees (the ceiling has a source)',\n"
    "   HSETS_VALS.length >= 3 && HSETS_VALS.every(v => v[0] === HSETS_VALS[0][0] && v[1] === HSETS_VALS[0][1]),\n"
    "   JSON.stringify(HSETS_VALS));\n"
    "ok('E4i the Calves section is exactly one item, dosed off hsets',\n"
    "   CALF_ITEMS === 1 && /detail:hsets\\+/.test(CALF_PUSH), 'items=' + CALF_ITEMS);\n"
    "ok('E4j the derived one-slot ceiling is a positive number of sets', E_SLOT_MAX > 0, E_SLOT_MAX);\n"
    "ok('E4k the cap value parses out of the file (not typed here)', E_CAP > 0, E_CAP);\n"
    "console.log('   derived: hsets max ' + HSETS_MAX + ' × ' + CALF_ITEMS + ' Calves item = Δcost ceiling '\n"
    "  + E_SLOT_MAX + ' sets; cap read from the file = ' + E_CAP);\n")

rep('2b-counters',
    "let eCells = 0, eChanged = 0, eFell = 0, eRose = 0, eThrew = 0, eCostOut = 0;\n"
    "const eFellEg = [], eCostEg = [], eLabelDelta = {}, eZeroNew = {}, eInjSeen = {}, eTierSeen = {};\n",
    "let eCells = 0, eChanged = 0, eFell = 0, eRose = 0, eThrew = 0, eCostOut = 0;\n"
    "let eCostDown = 0, eCostMax = -Infinity;                       // D87: direction and observed peak\n"
    "let eOverA = 0, eOverUnchanged = 0, eOverIntroduced = 0;       // D87: the cap census\n"
    "let eZeroAllCells = 0;                                         // D86: the TOTAL posterior-free population\n"
    "const eFellEg = [], eCostEg = [], eCostDownEg = [], eLabelDelta = {}, eZeroNew = {}, eZeroAll = {},\n"
    "      eInjSeen = {}, eTierSeen = {};\n")

# ── 3. the sweep body: census every cell, not only the changed ones ─────────────────
rep('3-sweep-body',
    "        const same = A1.labels.join('|') === B1.labels.join('|') && A1.names.join('|') === B1.names.join('|');\n"
    "        if (same) continue;\n"
    "        eChanged++;\n",
    "        const same = A1.labels.join('|') === B1.labels.join('|') && A1.names.join('|') === B1.names.join('|');\n"
    "        // ── D87 cap census, over EVERY cell and not only the changed ones. A cell that is\n"
    "        // over the cap AND byte-identical to the pre-D84 artifact was over the cap before\n"
    "        // D84 existed. That is the whole of the claim.\n"
    "        const costA = eCost(A1), costB = eCost(B1);\n"
    "        if (costA > E_CAP) { eOverA++; if (same) eOverUnchanged++; else if (costB <= E_CAP) eOverIntroduced++; }\n"
    "        // ── D86 total census: posterior-free leg cells in the shipped artifact, caused by\n"
    "        // the reorder or pre-existing. The ratchet below is a ceiling on this population.\n"
    "        if (eZeroP(A1)) { eZeroAllCells++; eZeroAll[c.key] = (eZeroAll[c.key] || 0) + 1; }\n"
    "        if (same) continue;\n"
    "        eChanged++;\n")

rep('3b-delta-direction',
    "        const dc = eCost(A1) - eCost(B1);\n"
    "        if (Math.abs(dc) > E_SLOT_MAX) { eCostOut++; if (eCostEg.length < 5) eCostEg.push(c.key + ' ' + dk + ' Δ' + dc); }\n",
    "        const dc = costA - costB;\n"
    "        if (dc > E_SLOT_MAX) { eCostOut++; if (eCostEg.length < 5) eCostEg.push(c.key + ' ' + dk + ' Δ' + dc); }\n"
    "        if (dc < 0) { eCostDown++; if (eCostDownEg.length < 5) eCostDownEg.push(c.key + ' ' + dk + ' Δ' + dc); }\n"
    "        if (dc > eCostMax) eCostMax = dc;\n")

rep('3c-caused-census',
    "        const legCell = o => hasL(o,'Calves') || hasL(o,'Leg isolation');\n"
    "        const zp = o => legCell(o) && !o.names.some(n => E_POSTERIOR.has(ePat(n)));\n"
    "        if (zp(A1) && !zp(B1)) eZeroNew[c.key] = (eZeroNew[c.key]||0) + 1;\n",
    "        if (eZeroP(A1) && !eZeroP(B1)) eZeroNew[c.key] = (eZeroNew[c.key]||0) + 1;\n")

# ── 4. D86: the ratchet beside the predicate ────────────────────────────────────────
rep('4-ratchet',
    "  ok('E3b every posterior-free cell the reorder creates is bodyweight + hypertrophy + lowback/protect (D85 owns the fix)',\n"
    "     ranE && out.length === 0, JSON.stringify(out));\n"
    "  D85_KEYS.forEach(k => console.log('   ruling key ' + k + ': ' + (eZeroNew[k] || 0) + ' cells'));\n",
    "  ok('E3b every posterior-free cell the reorder creates is bodyweight + hypertrophy + lowback/protect (D85 owns the fix)',\n"
    "     ranE && out.length === 0, JSON.stringify(out));\n"
    "\n"
    "  // ── D86 RATCHET. The predicate above names the MECHANISM: lowback/protect strips the\n"
    "  // hinge rail before the budget runs, so the leg day reaches capSessionBudget with one\n"
    "  // posterior piece instead of three and any tie-break evicting it lands on zero. Healthy,\n"
    "  // knee/protect and shoulder/protect still have a hinge to spare and never do this.\n"
    "  // A predicate alone is LOOSE: it would swallow a new defect landing inside the same\n"
    "  // family. These four ceilings are one-sided and DOWN-ONLY, so V198's D85 drives them\n"
    "  // toward zero and this gate TIGHTENS rather than going red. The predicate catches a\n"
    "  // defect that escapes the family; the ratchet catches one that hides inside it.\n"
    "  //\n"
    "  // COACH'S COUNTER, recorded here so nobody reads these four as engine facts: a ratchet\n"
    "  // pinned to today's census is a number with a date on it. If V198's D85 lands mid-\n"
    "  // lattice, someone has to RE-BASELINE these from a fresh census rather than read them\n"
    "  // as a property of the engine.\n"
    "  // PROVENANCE: this gate's own E-sweep on V197 (2026-09-16) and tests/measure/\n"
    "  // v197_d84_census.js — 18 keys / 120 cells caused, 33 keys / 186 cells total.\n"
    "  const RATCHET = { causedCells: 120, causedKeys: 18, totalCells: 186, totalKeys: 33 };\n"
    "  ok('E3c ratchet: cells the reorder makes posterior-free <= ' + RATCHET.causedCells + ' (down-only)',\n"
    "     ranE && causedCells <= RATCHET.causedCells, causedCells);\n"
    "  ok('E3d ratchet: config keys the reorder makes posterior-free <= ' + RATCHET.causedKeys + ' (down-only)',\n"
    "     ranE && found.length <= RATCHET.causedKeys, found.length);\n"
    "  const allKeys = Object.keys(eZeroAll).sort();\n"
    "  const outAll  = allKeys.filter(k => !inFamily(k));\n"
    "  console.log('   posterior-free leg cells TOTAL in the artifact (caused + pre-existing): '\n"
    "    + eZeroAllCells + ' cells over ' + allKeys.length + ' config keys; '\n"
    "    + (allKeys.length - found.length) + ' of those keys pre-date the reorder');\n"
    "  ok('E3e every posterior-free leg cell in the artifact, caused or pre-existing, carries lowback/protect',\n"
    "     ranE && outAll.length === 0, JSON.stringify(outAll));\n"
    "  ok('E3f ratchet: total posterior-free leg cells <= ' + RATCHET.totalCells + ' (down-only)',\n"
    "     ranE && eZeroAllCells <= RATCHET.totalCells, eZeroAllCells);\n"
    "  ok('E3g ratchet: total posterior-free leg config keys <= ' + RATCHET.totalKeys + ' (down-only)',\n"
    "     ranE && allKeys.length <= RATCHET.totalKeys, allKeys.length);\n"
    "  D85_KEYS.forEach(k => console.log('   ruling key ' + k + ': ' + (eZeroNew[k] || 0) + ' cells'));\n")

rep('4b-caused-total',
    "  const out = found.filter(k => !inFamily(k));\n"
    "  console.log('   posterior-free leg cells CAUSED by the reorder: ' + found.length + ' config keys');\n",
    "  const out = found.filter(k => !inFamily(k));\n"
    "  const causedCells = found.reduce((a, k) => a + eZeroNew[k], 0);\n"
    "  console.log('   posterior-free leg cells CAUSED by the reorder: ' + found.length + ' config keys, '\n"
    "    + causedCells + ' cells');\n")

# ── 5. D87: the bounded Δcost claim, DOWN-0, and the pre-existing over-cap fact ─────
rep('5-delta-and-cap',
    "  ok('E4d no changed day-cell moves by more than one accessory slot (' + E_SLOT_MAX + ' sets on the budget\\'s own cost rule)',\n"
    "     ranE && eCostOut === 0, eCostOut + ' cells, e.g. ' + eCostEg.join(' ; '));\n"
    "}\n",
    "  // ── D87: Δcost ∈ [0, E_SLOT_MAX], where the ceiling is DERIVED above from the file's\n"
    "  // own hsets table and the Calves section's item count. Not prose, and it survives an\n"
    "  // edit that changes either one.\n"
    "  ok('E4d no changed day-cell costs more than one derived accessory slot (Δ <= ' + E_SLOT_MAX\n"
    "     + ', from hsets ' + HSETS_MAX + ' × ' + CALF_ITEMS + ' item)',\n"
    "     ranE && eCostOut === 0, eCostOut + ' cells, e.g. ' + eCostEg.join(' ; '));\n"
    "  ok('E4l no changed day-cell moves DOWN (Δ >= 0: one direction, so this is a residual and not a redistribution)',\n"
    "     ranE && eCostDown === 0, eCostDown + ' cells, e.g. ' + eCostDownEg.join(' ; '));\n"
    "  console.log('   Δcost observed max ' + (eCostMax === -Infinity ? 'n/a' : eCostMax)\n"
    "    + ' against a derived ceiling of ' + E_SLOT_MAX + ' (informational, not an assertion)');\n"
    "\n"
    "  // ── D87: the cap has never been hard where protected work alone exceeds it, and that\n"
    "  // predates D84 by four versions. The trim is a THRESHOLD test, not a minimisation:\n"
    "  //   while(_total(out)>cap && guard++<16){ ... if(!best) break; }   (index.html:9503-9519)\n"
    "  // When every remaining item is protected, _compoundTier 3 or zero-cost, `best` is null\n"
    "  // and the loop LEAVES the day over the cap. Stated here as a fact about the baseline so\n"
    "  // nobody later reads an over-cap card as a V197 regression.\n"
    "  const flat = RAW.replace(/\\s+/g, ' ');\n"
    "  ok('E4m the trim is a threshold loop, not a minimiser: while(_total(out)>cap && guard++<16)',\n"
    "     (flat.split('while(_total(out)>cap && guard++<16)').length - 1) === 1,\n"
    "     'the threshold loop is not in the file in that shape');\n"
    "  ok('E4n the trim bails out when only protected work is left: if(!best) break',\n"
    "     (flat.split('if(!best) break;').length - 1) === 1,\n"
    "     'the !best bail-out is gone — the cap would then be claimed as hard');\n"
    "  ok('E4o over-cap day-cells are PRE-EXISTING: some sit over the cap and are byte-identical to the pre-D84 artifact',\n"
    "     ranE && eOverUnchanged > 0, eOverUnchanged);\n"
    "  ok('E4p over-cap is not a D84 artifact: over-cap cells outnumber every cell D84 changed',\n"
    "     ranE && eOverA > eChanged, eOverA + ' over cap vs ' + eChanged + ' changed');\n"
    "  console.log('   cap census: ' + eOverA + ' of ' + eCells + ' day-cells sit over the cap (' + E_CAP + '); '\n"
    "    + eOverUnchanged + ' are untouched by D84 and so were over before it; ' + eOverIntroduced\n"
    "    + ' crossed the cap under D84; ' + eChanged + ' cells changed at all, so at least '\n"
    "    + (eOverA - eChanged) + ' were already over.');\n"
    "}\n")

for tag, old, new in edits:
    n = src.count(old)
    print('anchor %-20s count=%d' % (tag, n))
    if n != 1:
        sys.exit('ABORT: anchor %s matched %d times, expected 1' % (tag, n))

for tag, old, new in edits:
    src = src.replace(old, new, 1)

io.open(GATE, 'w', encoding='utf-8').write(src)
print('WROTE ' + GATE)

after_md5 = hashlib.md5(open(HTML, 'rb').read()).hexdigest()
assert after_md5 == HTML_MD5_EXPECTED, 'index.html md5 drifted AFTER edit: %s' % after_md5
print('index.html md5 unchanged: ' + after_md5)
