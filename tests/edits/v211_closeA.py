#!/usr/bin/env python3
# V211 close, part A (coach ruled, after slices A+B and the g199/g200 instrument follow-up).
#   1. index.html: the inert hinge clause leaves D155's admit test. It changed 0 of 56,688 measured
#      programs (dead by construction goes); the definition stays in the comment; g211 proves the
#      outcome. Sabotage anchors S1..S3 are outside the removed text (S2's anchor is kept verbatim).
#   2. g199: E1b/E3/G5 read an era table, DELOAD_HINGE_BY_VERSION, and from 211 on exclude tier B
#      long-run days by _longRunTier (the predicate D18/D155 read). The 211 row was PRINTED by this
#      script's probe mode on the V210 tag (git show d8d2f5b:index.html) forced to 211, under the
#      same exclusion: an oracle rerun, not a readback of the candidate. Rows <=210 keep the
#      unexcluded values. DELOAD_ARB_BY_VERSION[211] and E6_BY_VERSION[211] are reference rows.
#   3. harness.js: the three HALF_MANNY era rows for 211 (ruled UNMOVED; coach printed them on the
#      V211 tree: 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081).
# No ia-version bump. Probe mode (E211 is None) writes nothing to the tree.
import io, os, re, subprocess, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
IDX, G199, HARN = ROOT + '/index.html', ROOT + '/tests/gates/g199_deload_arbitration.js', ROOT + '/tests/harness.js'
SP = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/788d23bc-397a-4c4b-9d6f-91ef5b233dad/scratchpad'

# Printed by probe mode on the V210 tag forced to 211 (tier B long-run days excluded). None = probe.
# Probe output: CENSUS deload-hinge excluding tier B long-run days (_longRunTier): E1b 9334 E3 44
# G5 {"Explosive finisher":44} | tier B deload day builds 576
E211 = {'E1b': 9334, 'E3': 44, 'G5': 44}

def rd(p): return io.open(p, encoding='utf-8').read()
def apply(src, edits, tag):
    for t, a, b in edits:
        n = src.count(a)
        if n != 1: print('ABORT:', tag, t, 'count', n); sys.exit(1)
    for t, a, b in edits: src = src.replace(a, b, 1)
    return src

# ── 1. index.html ───────────────────────────────────────────────────────────────────────────
IDX_EDITS = [
 ("D155 admit test: the inert hinge clause goes, the definition stays in the comment",
  "  // no lifting at all. Here the surviving accessory block is the first one the tier admits: no\n"
  "  // item tier B drops (_D18_LEG_RX, or hinge/hip_ext by _isPostChain) and no power or explosive\n"
  "  // label or core header. A posterior Main does not suppress this pick, because tier B strips the\n"
  "  // Main's hinge too. Candidacy is D91's own four tests in the loop's order. If no block is\n"
  "  // admitted, D91's pick stands. Every other day never enters this branch.\n"
  "  if(_longRunTier(cardio)==='B'){\n"
  "    const _tierAdmits=s=>!/power|explosive/i.test(s.label||'')&&!/power|explosive/i.test(s.coreHeader||'')\n"
  "      &&!(s.items||[]).some(it=>it&&(_D18_LEG_RX.test(it.name||'')||_isPostChain(it.name||'')));\n",
  "  // no lifting at all. Here the surviving accessory block is the first one the tier admits: no\n"
  "  // item tier B drops (_D18_LEG_RX, or hinge/hip_ext by _pattern under D153) and no power or\n"
  "  // explosive label or core header. The code tests _D18_LEG_RX alone: a hinge test here changed\n"
  "  // 0 of 56,688 measured programs, so it was dead and went (coach). D153 strips any hinge after\n"
  "  // this pick, and g211 proves the outcome. A posterior Main does not suppress this pick, because\n"
  "  // tier B strips the Main's hinge too. Candidacy is D91's own four tests in the loop's order. If\n"
  "  // no block is admitted, D91's pick stands. Every other day never enters this branch.\n"
  "  if(_longRunTier(cardio)==='B'){\n"
  "    const _tierAdmits=s=>!/power|explosive/i.test(s.label||'')&&!/power|explosive/i.test(s.coreHeader||'')\n"
  "      &&!(s.items||[]).some(it=>it&&_D18_LEG_RX.test(it.name||''));\n"),
]

# ── 2. g199 ─────────────────────────────────────────────────────────────────────────────────
def row211():
    if E211 is None: return "// DELOAD_HINGE_BY_VERSION[211]: PENDING (probe mode)\n"
    return ("DELOAD_HINGE_BY_VERSION[211] = { E1b: %d, E3: %d, G5: {'Explosive finisher': %d} };   // D155: ruled scope change\n"
            % (E211['E1b'], E211['E3'], E211['G5']))

def g199_edits():
    return [
 ("era table after E6_ROW_FOR",
  "const E6_ROW_FOR = v => E6_BY_VERSION[(+v <= 208) ? 208 : +v];\n",
  "const E6_ROW_FOR = v => E6_BY_VERSION[(+v <= 208) ? 208 : +v];\n"
  "// V211 (D155): on a tier B long-run day the deload's one-accessory pick yields to the\n"
  "// long-run tier, so the hinge leaves that day by ruling, not by the deload. E1b/E3/G5\n"
  "// assert the deload's own behaviour and exclude tier B long-run days (_longRunTier, the\n"
  "// predicate D18/D155 read) from 211 on. Rows ≥211 were printed on the V210 tag under the\n"
  "// same exclusion: an oracle rerun, not a readback of the candidate. Rows ≤210 keep the\n"
  "// unexcluded values.\n"
  "// The 210 row is the three literals E1b/E3/G5 carried from V199 through V210 (G5 was\n"
  "// {Explosive finisher: E3}, and E3 was 60 on every one of those artifacts).\n"
  "const DELOAD_HINGE_BY_VERSION = {};\n"
  "DELOAD_HINGE_BY_VERSION[210] = { E1b: 9771, E3: 60, G5: {'Explosive finisher': 60} };\n"
  + row211() +
  "const DELOAD_HINGE_ROW_FOR = v => DELOAD_HINGE_BY_VERSION[(+v <= 210) ? 210 : +v];   // no row -> E1b/E3/G5 FAIL\n"
  "const DELOAD_HINGE_EXCLUDES_TIER_B = v => +v >= 211;\n"
  "DELOAD_ARB_BY_VERSION[211] = DELOAD_ARB_BY_VERSION[210];   // D153/D155: ruled UNMOVED\n"
  "E6_BY_VERSION[211] = E6_BY_VERSION[210]; // D155: ruled UNMOVED (28 printed)\n"),
 ("sweep reads the candidate's own _longRunTier once",
  "  const R={on:blank(),off:blank(),wrongWay:0,endToEnd:0,ndIdentical:0,ndTotal:0,dlIdentical:0,dlTotal:0};\n",
  "  const LT=IA.eval(\"typeof _longRunTier==='function'?_longRunTier:null\");   // V211 (D155): the predicate D18/D155 read\n"
  "  const R={on:blank(),off:blank(),wrongWay:0,endToEnd:0,ndIdentical:0,ndTotal:0,dlIdentical:0,dlTotal:0};\n"),
 ("the three counts again with tier B long-run days excluded",
  "        const killed=(a1>0&&a2===0);\n",
  "        const killed=(a1>0&&a2===0);\n"
  "        // V211 (D155): E1b/E3/G5 again with tier B long-run days excluded (DELOAD_HINGE_BY_VERSION).\n"
  "        { const _day=W[r.w]&&W[r.w][r.d], _tb=!!(LT&&_day&&LT(_day.cardio)==='B');\n"
  "          S.tierBDl=(S.tierBDl||0)+(_tb?1:0); S.postInP1X=(S.postInP1X||0)+(_tb?0:a1); S.postOutP2X=(S.postOutP2X||0)+(_tb?0:a2);\n"
  "          S.killedByDeloadX=(S.killedByDeloadX||0)+((killed&&!_tb)?1:0); S.killHoldX=S.killHoldX||{};\n"
  "          if(killed&&!_tb) (r.p1||[]).forEach(s=>{ if(secPost(s)>0) bump(S.killHoldX, s.l||'(nolabel)'); }); }\n"),
 ("E1b reads the era row",
  "  ok(N.postOutP2===9771,'E1b posterior items leaving the deload == 9,771, a cut of '+(N.postInP1-N.postOutP2)+' ('+(100*(N.postInP1-N.postOutP2)/N.postInP1).toFixed(1)+'%); got '+N.postOutP2);\n",
  "  const HROW=DELOAD_HINGE_ROW_FOR(IP.version), HX=DELOAD_HINGE_EXCLUDES_TIER_B(IP.version);\n"
  "  const HNOROW=(HROW?'':' — no DELOAD_HINGE_BY_VERSION row for V'+IP.version);\n"
  "  const HSCOPE=(HX?' (tier B long-run days excluded by _longRunTier: '+(N.tierBDl||0)+' deload day builds)':'');\n"
  "  const hIn=HX?N.postInP1X:N.postInP1, hOut=HX?N.postOutP2X:N.postOutP2, hKill=HX?N.killedByDeloadX:N.killedByDeload, hHold=(HX?N.killHoldX:N.killHold)||{};\n"
  "  ok(!!HROW&&hOut===HROW.E1b,'E1b posterior items leaving the deload == '+(HROW?HROW.E1b:'NO ROW')+' (the V'+IP.version+' DELOAD_HINGE_BY_VERSION row)'+HSCOPE+', a cut of '+(hIn-hOut)+' ('+(100*(hIn-hOut)/hIn).toFixed(1)+'%); got '+hOut+HNOROW);\n"),
 ("E3 reads the era row",
  "  ok(N.killedByDeload===60,'E3 STAGE-LOCAL (p1 -> p2): deload day builds taken from >0 posterior to 0 == 60 of '+D_DAY+'; got '+N.killedByDeload+'. This is coach\\'s ruled CEILING, not a floor');\n",
  "  ok(!!HROW&&hKill===HROW.E3,'E3 STAGE-LOCAL (p1 -> p2): deload day builds taken from >0 posterior to 0 == '+(HROW?HROW.E3:'NO ROW')+' of '+D_DAY+' (the V'+IP.version+' DELOAD_HINGE_BY_VERSION row)'+HSCOPE+'; got '+hKill+'. This is coach\\'s ruled CEILING, not a floor'+HNOROW);\n"),
 ("G5 reads the era row",
  "  ok(Object.keys(N.killHold).length===1&&g(N.killHold,'Explosive finisher')===N.killedByDeload,\n"
  "    'G5 the killed-day holder census is EXACTLY {Explosive finisher: '+N.killedByDeload+'}: no other label ever holds the posterior on a day the deload empties, so the 60 is a CEILING BY LABEL and a widening into optional or fluff sections would move it (got '+JSON.stringify(N.killHold)+')');\n",
  "  ok(!!HROW&&JSON.stringify(hHold)===JSON.stringify(HROW.G5)&&g(hHold,'Explosive finisher')===hKill,\n"
  "    'G5 the killed-day holder census is EXACTLY '+(HROW?JSON.stringify(HROW.G5):'NO ROW')+' (the V'+IP.version+' DELOAD_HINGE_BY_VERSION row)'+HSCOPE+' and equals E3: no other label ever holds the posterior on a day the deload empties, so E3 is a CEILING BY LABEL and a widening into optional or fluff sections would move it (got '+JSON.stringify(hHold)+')'+HNOROW);\n"),
 ("census prints the excluded counts",
  "  console.log('     CENSUS killHold '+JSON.stringify(N.killHold));\n",
  "  console.log('     CENSUS killHold '+JSON.stringify(N.killHold));\n"
  "  console.log('     CENSUS deload-hinge excluding tier B long-run days (_longRunTier): E1b '+N.postOutP2X+' E3 '+N.killedByDeloadX+' G5 '+JSON.stringify(N.killHoldX||{})+' | tier B deload day builds '+(N.tierBDl||0));\n"),
    ]

# ── 3. harness.js ───────────────────────────────────────────────────────────────────────────
HARN_EDITS = [
 ("HALF_MANNY 211 rows",
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[210] = MANNY_CORE_OFF_DIGEST_BY_VERSION[209];   // ruled UNMOVED\n",
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[210] = MANNY_CORE_OFF_DIGEST_BY_VERSION[209];   // ruled UNMOVED\n"
  "// V211: ruled UNMOVED, written as a REFERENCE. D153 and D155 act on tier B long-run days only, and\n"
  "// none of HALF_MANNY's cards moves on any of the three arms.\n"
  "MANNY_DIGEST_BY_VERSION[211] = MANNY_DIGEST_BY_VERSION[210];   // D153/D155: ruled UNMOVED (printed by coach on the V211 tree)\n"
  "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[211] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[210];   // D153/D155: ruled UNMOVED (printed by coach on the V211 tree)\n"
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[211] = MANNY_CORE_OFF_DIGEST_BY_VERSION[210];   // D153/D155: ruled UNMOVED (printed by coach on the V211 tree)\n"),
]

idx, g199, harn = rd(IDX), rd(G199), rd(HARN)
if idx.count("_isPostChain(it.name||'')));") != 1 or g199.count('function pipeFor(RAW)') != 1:
    print('ABORT: tree is not slices A+B plus the g199/g200 instrument follow-up'); sys.exit(1)
if '<meta name="ia-version" content="210">' not in idx:
    print('ABORT: ia-version is not 210'); sys.exit(1)
new_idx = apply(idx, IDX_EDITS, 'index.html')
new_g199 = apply(g199, g199_edits(), 'g199')
new_harn = apply(harn, HARN_EDITS, 'harness.js')

if E211 is None:
    # PROBE: the edited g199 runs from the scratchpad (harness.js symlinked beside it) on the V210 tag forced to 211.
    pd = SP + '/probe'; os.makedirs(pd + '/gates', exist_ok=True)
    for f in [pd + '/harness.js', pd + '/gates/g199_probe.js', pd + '/v210_tag_forced211.html']:
        if os.path.lexists(f): os.unlink(f)
    os.symlink(HARN, pd + '/harness.js')
    io.open(pd + '/gates/g199_probe.js', 'w', encoding='utf-8').write(new_g199)
    tag = subprocess.run(['git', '-C', ROOT, 'show', 'd8d2f5b:index.html'], capture_output=True, check=True).stdout.decode('utf-8')
    a = '<meta name="ia-version" content="210">'
    assert tag.count(a) == 1
    io.open(pd + '/v210_tag_forced211.html', 'w', encoding='utf-8').write(tag.replace(a, '<meta name="ia-version" content="211">'))
    out = subprocess.run(['node', pd + '/gates/g199_probe.js', pd + '/v210_tag_forced211.html'], capture_output=True, text=True).stdout
    for l in out.splitlines():
        if 'CENSUS deload-hinge' in l or re.match(r'^PASS \d+ FAIL \d+', l) or 'E1b' in l or ' E3 ' in l or ' G5 ' in l or 'REFUSED' in l: print(l[:260])
    print('PROBE ONLY: nothing written to the tree. Fill E211 from the CENSUS line and rerun.')
    sys.exit(0)

io.open(IDX, 'w', encoding='utf-8').write(new_idx)
io.open(G199, 'w', encoding='utf-8').write(new_g199)
io.open(HARN, 'w', encoding='utf-8').write(new_harn)
print('closeA written: index.html 1 edit, g199 %d edits, harness.js 1 edit' % len(g199_edits()))
