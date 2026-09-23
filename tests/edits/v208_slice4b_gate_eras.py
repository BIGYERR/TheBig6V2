#!/usr/bin/env python3
# V208 slice 4b — D103a era rows in four gate files (the g205_*/g206_*/g208_* set is another slice).
# Every row that finds a run card by its label or reads a run note head keys on ia-version: <=207 the
# old strings, >=208 the D103a strings (Long Interval (LI), Short Interval (SI), LI:, SI:). An artifact
# no row covers fails loudly and its matchers match nothing. g207_gk_trial_present's P4/P5 label
# regex was hollow under the rename (it could no longer see a quality run); it now keys on the era and
# a new row, P5z, proves it sees quality runs. Every anchor asserted count==1; all-or-nothing per file.
import sys
G = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'
ERA_BLOCK = (
  "// ── D103a (V208) ERA ROWS for the run builder's quality labels (standing ruling 4) ──\n"
  "// Every row below that finds a run card by its label reads this table. The CHI and the INT were\n"
  "// renamed Long Interval (LI) and Short Interval (SI) at V208 (coach, D103a slice 4). An artifact no\n"
  "// row covers fails loudly, and its matchers match nothing, so every row that reads them goes red.\n"
  "const RUN_LABEL_BY_VERSION = [\n"
  "  { from: 202, to: 207,      ruling: 'pre-D103a',    int: /Interval \\(INT\\)/,      chi: /Continuous High Intensity \\(CHI\\)/ },\n"
  "  { from: 208, to: Infinity, ruling: 'D103a (V208)', int: /Short Interval \\(SI\\)/, chi: /Long Interval \\(LI\\)/ },\n"
  "];\n"
  "const LBL = RUN_LABEL_BY_VERSION.filter(r => +IA.version >= r.from && +IA.version <= r.to)[0]\n"
  "  || { ruling: 'NO ROW', int: /(?!)/, chi: /(?!)/ };\n"
  "if(LBL.ruling === 'NO ROW'){ FAIL++; console.log('  FAIL LABEL-ERA no RUN_LABEL_BY_VERSION row covers ia-version ' + IA.version\n"
  "  + ': the run quality labels have no ruled text at this version, so every row that finds a card by label is void'); }\n")
EDITS = {
 'g202_int_doctrine.js': [
  ("console.log('g202 INT doctrine — artifact ia-version ' + IA.version);\n",
   "console.log('g202 INT doctrine — artifact ia-version ' + IA.version);\n\n" + ERA_BLOCK),
  ("const ints = prog => runSessions(prog).filter(r => /Interval \\(INT\\)/.test(r.st));",
   "const ints = prog => runSessions(prog).filter(r => LBL.int.test(r.st));"),
  ("const chi10 = pAll.filter(r => r.w === 10 && /Continuous High Intensity/.test(r.st))[0];",
   "const chi10 = pAll.filter(r => r.w === 10 && LBL.chi.test(r.st))[0];"),
  ("  { from: 206, to: Infinity, ruling: 'D109 (V206)', head: 'INT: Zone 5 (95%+ max HR) on work efforts.',\n",
   "  { from: 206, to: 207, ruling: 'D109 (V206)', head: 'INT: Zone 5 (95%+ max HR) on work efforts.',\n"),
  ("    label: null },                                       // D109: no label exemption\n];",
   "    label: null },                                       // D109: no label exemption\n"
   "  { from: 208, to: Infinity, ruling: 'D103a (V208)', head: 'SI: Zone 5 (95%+ max HR) on work efforts.',\n"
   "    label: null },                                       // D103a: the INT is the Short Interval; body unchanged\n];"),
  ("      if(s && s.type === 'run' && /Interval \\(INT\\)/.test(s.subtype||''))",
   "      if(s && s.type === 'run' && LBL.int.test(s.subtype||''))"),
 ],
 'g202_pace_anchor.js': [
  ("console.log('g202 pace anchor — artifact ia-version ' + IA.version);\n",
   "console.log('g202 pace anchor — artifact ia-version ' + IA.version);\n\n" + ERA_BLOCK),
  ("    if(!/Interval/i.test(s.st)) continue;", "    if(!LBL.int.test(s.st)) continue;"),
  ("  if(/Interval/i.test(s.st) && !/^CUTBACK WEEK:/.test(s.note)) return s.note; return ''; })();",
   "  if(LBL.int.test(s.st) && !/^CUTBACK WEEK:/.test(s.note)) return s.note; return ''; })();"),
  ("  cards: [ { w:1,  st:/Interval/,                tgt:493, pace:'8:13/mi'  },\n"
   "           { w:6,  st:/Interval/,                tgt:468, pace:'7:48/mi'  },\n"
   "           { w:10, st:/Continuous High Intensity/, tgt:501, pace:'8:21/mi' },\n",
   "  cards: [ { w:1,  st:LBL.int,                   tgt:493, pace:'8:13/mi'  },\n"
   "           { w:6,  st:LBL.int,                   tgt:468, pace:'7:48/mi'  },\n"
   "           { w:10, st:LBL.chi,                   tgt:501, pace:'8:21/mi' },\n"),
 ],
 'g202_pace_copy.js': [
  ("  { from: 206, to: Infinity, ruling: 'D109 (V206)', head: 'INT: ',            labelExempt: false },\n];\n",
   "  { from: 206, to: 207,      ruling: 'D109 (V206)', head: 'INT: ',            labelExempt: false },\n"
   "  { from: 208, to: Infinity, ruling: 'D103a (V208)', head: 'SI: ',            labelExempt: false },   // the INT is the Short Interval\n];\n"),
  ("const IAV = +IA.version;\n", "const IAV = +IA.version;\n" + ERA_BLOCK),
  ("const damp = notes.filter(n => /Interval/.test(n.st) && /Pace moves|Pace capped/.test(n.note));",
   "const damp = notes.filter(n => LBL.int.test(n.st) && /Pace moves|Pace capped/.test(n.note));"),
  ("      if(s && s.type === 'run' && /Interval/.test(s.subtype||'')) out.push({ w:+w, note:String(s.note||'') });",
   "      if(s && s.type === 'run' && LBL.int.test(s.subtype||'')) out.push({ w:+w, note:String(s.note||'') });"),
 ],
 'g207_gk_trial_present.js': [
  ("const HARD = /^(Interval \\(INT\\)|Continuous High Intensity \\(CHI\\))/;\n",
   "// D103a (V208) ERA ROWS (standing ruling 4): the quality-run labels P4, P5 and the Q rows read. Under\n"
   "// the V208 rename the old regex saw no quality run at all, so P5 passed on nothing and P4 fired on\n"
   "// every config. An artifact no row covers fails loudly; P5z proves the matcher sees quality runs.\n"
   "const HARD_BY_VERSION = [\n"
   "  { from: 207, to: 207,      ruling: 'D106a (V207)', re: /^(Interval \\(INT\\)|Continuous High Intensity \\(CHI\\))/ },\n"
   "  { from: 208, to: Infinity, ruling: 'D103a (V208)', re: /^(Short Interval \\(SI\\)|Long Interval \\(LI\\))/ },\n"
   "];\n"
   "const HARD_ROW = HARD_BY_VERSION.filter(r => VER >= r.from && VER <= r.to)[0] || null;\n"
   "if(!HARD_ROW) ok('P-ERA a HARD_BY_VERSION row covers ia-version ' + VER + ' (the quality-run labels have no ruled text here, so P4, P5 and the Q rows are void)', false, 'no row');\n"
   "const HARD = HARD_ROW ? HARD_ROW.re : /(?!)/;\n"
   "let hardSeen = 0;\n"),
  ("  const preRuns = runsOf(pre, tw), pinRuns = runsOf(p, tw);\n",
   "  const preRuns = runsOf(pre, tw), pinRuns = runsOf(p, tw);\n"
   "  hardSeen += [tw - 1, tw].reduce((n, w) => n + (w >= 1 ? runsOf(pre, w).filter(c => HARD.test(c.subtype || '')).length : 0), 0);\n"),
  ("\n// ══ V208 slice 0: Q0-Q7",
   "\nok(`P5z the quality-run matcher (${HARD_ROW ? HARD_ROW.ruling : 'NO ROW'}) sees ${hardSeen} INT/CHI runs in the pre-pin weeks tw-1 and tw, so P4 and P5 read real cards`, hardSeen > 0, hardSeen);\n"
   "\n// ══ V208 slice 0: Q0-Q7"),
 ],
}
plans = {}
for f, eds in EDITS.items():
    s = open(G + f, encoding='utf-8').read()
    for a, b in eds:
        n = s.count(a)
        if n != 1: sys.exit('ABORT: %s anchor count=%d: %r — nothing written' % (f, n, a[:70]))
        s = s.replace(a, b, 1)
    plans[f] = s
for f, s in plans.items(): open(G + f, 'w', encoding='utf-8').write(s)
print('era rows written to', ', '.join(plans))
# Follow-up in the same slice (applied by hand after the proof, recorded here): the P lattice gains
# Tuesday tests and P5z also requires a pre-pin quality run at T-1/T-2 (p5reach > 0). See the handoff.
