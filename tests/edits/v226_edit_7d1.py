#!/usr/bin/env python3
# V226 slice 7d1 (build 5, tests only): write tests/sabotage/v226.json (S1-S18, S20) and reword ROW.G7e in
# tests/gates/g226_d189_pacedisclose.js. Ruling: tests/measure/v226_rulings/d188_d189_ruling.md (Sabotage) as
# amended by d188_d189_gate_amendment.md (b) S8 and (g) the final table, which governs.
# S19 (LIC5L_ERAS without 226) is NOT written: its target is the gate file g222_d181_chain.js and
# tests/sabotage.py only ever mutates the candidate html (src.count / src.replace on argv[1]); no existing spec
# targets a gate file. Routed back to the session, not invented here.
# All or none: every anchor is asserted count==1 (sabotage anchors on index.html, the label on the gate) and every
# replacement differs from its anchor BEFORE either file is written.
# Re-run safe for the label only: if the old label is gone and the new one is present exactly once, it is reported
# as already applied (so the notes can be re-recorded after verification); any other count aborts.
import json, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HTML = os.path.join(ROOT, 'index.html')
GATE = os.path.join(ROOT, 'tests', 'gates', 'g226_d189_pacedisclose.js')
SPEC = os.path.join(ROOT, 'tests', 'sabotage', 'v226.json')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

src = open(HTML, encoding='utf-8').read()
if '<meta name="ia-version" content="226">' not in src:
    die('index.html is not ia-version 226')

D188 = 'gates/g226_d188_beginnermile.js'
D189 = 'gates/g226_d189_pacedisclose.js'

BTN = ("<button onclick=\"event.stopPropagation();openMileSheet('${p.id}')\" aria-label=\"Change mile time\" "
       "style=\"background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center\">"
       "${asyIcon('pencil',14)}</button>")

ROWS = [
  ('S1 -> D188 E4 reverted: buildRunSession ignores a beginner mile again (experience !== beginner restored on the arguments[12] read)',
   "const _mileBestSecs = arguments[12] ? arguments[12] : null;",
   "const _mileBestSecs = (experience !== 'beginner' && arguments[12]) ? arguments[12] : null;", D188,
   'NAMED TRIP: G1g (SI 4x400m pace off the 13:00 mile), G1 run_base 13:00 Around pace, G1 9:00 differential (G1c/G1d).'),
  ('S2 -> D188 E5 reverted: buildNRCSession ignores a beginner mile again (experience !== beginner restored on anchorSec)',
   "const anchorSec = mileBestSecs ? mileBestSecs : expCurrentPace;",
   "const anchorSec = (experience !== 'beginner' && mileBestSecs) ? mileBestSecs : expCurrentPace;", D188,
   'NAMED TRIP: G1 run_5k/run_half beginner mile 13:00 chart row (G1a/b), G1 9:00 differential (G1d).'),
  ('S3 -> D188 E3 reverted: calcProgramLength ignores a beginner mile again (experience !== beginner restored on _mileBestSecs)',
   "var _mileBestSecs = (goal.mileBestMins",
   "var _mileBestSecs = (experience !== 'beginner' && goal.mileBestMins", D188,
   'NAMED TRIP: G1 length cell beginner 13:30 goal, mile 9:00 -> 9 (G1e; mutant prints 11).'),
  ('S4 -> D188 E1 reverted: assessRunPaceCeiling ignores a beginner mile again (exp !== beginner restored on mileBest)',
   "const mileBest = (g.mileBestMins",
   "const mileBest = (exp !== 'beginner' && g.mileBestMins", D188,
   'NAMED TRIP: G1f (typed "Your mile is 9:00." sentence, function and wizard #paceFeasLine).'),
  ('S5 -> D188 E6 reverted: _mileEntryState returns ok for every beginner again (if(!g||exp===beginner) early return)',
   "  if(!g) return {ok:true};\n  if(g.mileBestMins===undefined",
   "  if(!g||exp==='beginner') return {ok:true};\n  if(g.mileBestMins===undefined", D188,
   'NAMED TRIP: G3 beginner 2:30 / 30:00 / 13:00 / 4:30 on all 5 run goals and the D116 sheet call.'),
  ('S6 -> D188 E6 beginner exemption dropped from R3: a beginner run_pace_goal with a blank mile is refused',
   "if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true",
   "if(g.id==='run_pace_goal') return {ok:false, blank:true", D188,
   'NAMED TRIP: G3 beginner blank mile on all 5 run goals, G5 R3 literal count (also g226_d189 G8f).'),
  ('S7 -> D188 E9 reverted: the wizard hides Current mile time from beginners again',
   "${(t==='run') ? `<div class=\"input-group\"",
   "${(t==='run' && WD.experience !== 'beginner') ? `<div class=\"input-group\"", D188,
   'NAMED TRIP: G4 beginner wizard render, Current mile time and mileAdvisory exactly 1 (also g226_d189 G8a).'),
  ('S8 -> D188 E10 reverted on exp (amendment b): the program card hides the mile pencil from beginners',
   'Run paces' + BTN,
   "Run paces${s.runAnchor.exp!=='beginner'?`" + BTN + "`:''}", D188,
   'NAMED TRIP: G4 beginner program card carries aria-label exactly 1 (also g226_d189 G7c, g203_mile_pencil D188 era).'),
  ('S9 -> D188 E7 reverted: runAnchorInfo classifies every beginner as kind beginner again, whatever mile he entered',
   "const kind = !entered ? 'default'",
   "const kind = exp === 'beginner' ? 'beginner' : !entered ? 'default'", D189,
   'NAMED TRIP: G6b (no S1 on beginners), G7e beginner entered and seeded rows.'),
  ('S10 -> D189 S1 pass not called: d189DefaultAnchorNote( removed from buildProgram',
   "d189DefaultAnchorNote(weeks, {...cfg, cardioTypes, cardioGoals});",
   ";", D189,
   'NAMED TRIP: G6b.'),
  ('S11 -> D189 S1 pass appends to every paced W1 run: return; after the append deleted',
   "rebuilds off it.';\n      return; } }",
   "rebuilds off it.';\n      } }", D189,
   'NAMED TRIP: G6b (many S1 notes per program).'),
  ('S12 -> D189 S1 lands on week 2 instead of week 1',
   "const w1 = weeks['1'] || weeks[1];",
   "const w1 = weeks['2'] || weeks[2];", D189,
   'NAMED TRIP: G6b (W2 placement).'),
  ('S13 -> D189 run_base dropped from _CHART_RUN_GOALS: run_base gets no run anchor',
   "'run_15_under10','run_base']);",
   "'run_15_under10']);", D189,
   'NAMED TRIP: G7a / G7b / G7c run_base cells.'),
  ('S14 -> D189 run_base chips branch removed: run_base prints the four race chips',
   "const list = a.goalId==='run_base' ? [['Mile',r.mile]] : ",
   "const list = ", D189,
   'NAMED TRIP: G7c run_base chips exactly [Mile, Recovery].'),
  ('S15 -> D189 D9 >25:00 copy reverted to the V225 Leave it blank tail',
   "Over 25:00 reads as a walk, not a run. Check the entry.'",
   "Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.'", D189,
   'NAMED TRIP: G8b D9 >25:00 string (also g226_d188 G3 beginner 30:00 and sheet call).'),
  ('S16 -> D189 F5 required blank header branch removed from #progLenLine',
   "if(!(p && p.tw) && _ms.blank) return ",
   "if(false) return ", D189,
   'NAMED TRIP: G8c #progLenLine header.'),
  ('S17 -> D189 F1 helper returns the V225 label on every goal and level',
   "function _mileFieldHelp(){",
   "function _mileFieldHelp(){ return 'Optional. It sets your training paces.';", D189,
   'NAMED TRIP: G8a wizard helper, 4 goals x 3 levels.'),
  ('S18 -> D189 feasibility suppression removed: a required blank mile quotes a reach from the default',
   "const _f = _mileEntryState().blank ? null : assessRunPaceCeiling(",
   "const _f = assessRunPaceCeiling(", D189,
   'NAMED TRIP: G8d #paceFeasLine empty.'),
  ('S20 -> D189 F10 reverted: the Week 1 scope tail is withheld from a beginner run_pace_goal clipboard line',
   "const scope = (a.goalId === 'run_pace_goal') ?",
   "const scope = (a.goalId === 'run_pace_goal' && a.exp !== 'beginner') ?", D189,
   'NAMED TRIP: G7b beginner run_pace_goal clipboard line.'),
]

# Recorded after slice 7d1 ran every mutant through both g226 gates directly (no baseline argv, as sabotage.py runs
# them; clean candidate d188 PASS 31 FAIL 0, d189 PASS 18 FAIL 0).
VERIFIED = {
  'S1': 'Verified: d188 PASS 26 FAIL 5: G1g SI, G1 run_base 13:00 Around, G1 run_pace_goal and run_base 9:00 differentials, G5 backstop. d189 green. EXPECTED: those five.',
  'S2': 'Verified: d188 PASS 26 FAIL 5: G1 run_5k and run_half 13:00 chart row, G1 run_5k and run_half 9:00 differentials, G5 backstop. d189 green. EXPECTED: those five.',
  'S3': 'Verified: d188 PASS 29 FAIL 2: G1 length cell 13:30 goal mile 9:00 -> 9, G5 backstop; the no-mile length cell and G1f length row stay green. d189 green.',
  'S4': 'Verified: d188 PASS 28 FAIL 3: both G1f sentence rows (function and wizard read "You have not entered a mile time"), G5 backstop; G1f length row green (E3, not E1). d189 green.',
  'S5': 'Verified: d188 PASS 25 FAIL 6: G3 2:30, 30:00, 13:00, 4:30 and the D116 sheet call, G5 backstop; G3 blank stays green. d189 green.',
  'S6': 'Verified: d188 PASS 29 FAIL 2: G3 beginner blank (run_pace_goal refused), G5 R3 literal count 0. d189 PASS 17 FAIL 1: G8f (got empty). EXPECTED: those three.',
  'S7': 'Verified: d188 PASS 30 FAIL 1: G4 wizard field count. d189 PASS 17 FAIL 1: G8a (3/12 cells, the beginner ones). G5 green (WD.experience token is not near a mile anchor).',
  'S8': 'Verified: d188 PASS 30 FAIL 1: G4 beginner program card pencil count. d189 PASS 17 FAIL 1: G7c (beginner run_base, no pencil). g203_mile_pencil PASS 98 FAIL 2: D188 era beginner -> 1 pencil and its aria-label row (clean g203 PASS 100 FAIL 0). Replaces v203 #3.',
  'S9': 'Verified: d189 PASS 16 FAIL 2: G6b and G7e (the two beginner rows). d188 PASS 30 FAIL 1: G5 backstop only. EXPECTED: those three.',
  'S10': 'Verified: d189 PASS 17 FAIL 1: G6b only. d188 green.',
  'S11': 'Verified: d189 PASS 17 FAIL 1: G6b only. d188 green.',
  'S12': 'Verified: d189 PASS 17 FAIL 1: G6b only. d188 green.',
  'S13': 'Verified: d189 PASS 13 FAIL 5: G7a, G7b, G7c (run_base cells), plus G6b and G8a (run_base drops out of the S1 and helper surfaces). d188 green.',
  'S14': 'Verified: d189 PASS 16 FAIL 2: G7c and G7b (run_base clipboard reads the four race chips). d188 green.',
  'S15': 'Verified: d189 PASS 17 FAIL 1: G8b. d188 PASS 29 FAIL 2: G3 beginner 30:00 and the D116 sheet call. EXPECTED: those three.',
  'S16': 'Verified: d189 PASS 17 FAIL 1: G8c only. d188 green.',
  'S17': 'Verified: d189 PASS 17 FAIL 1: G8a only (12/12 cells). d188 green.',
  'S18': 'Verified: d189 PASS 17 FAIL 1: G8d only (intermediate quotes a reach from the default). d188 green.',
  'S20': 'Verified: d189 PASS 17 FAIL 1: G7b only, 1/10 cells, run_pace_goal|beginner. d188 green. Successor of v202 #11.',
}

out = []
for name, anchor, repl, gate, note in ROWS:
    sid = name.split(' ')[0]
    n = src.count(anchor)
    if n != 1: die(sid + ' anchor count ' + str(n))
    if repl == anchor or src.replace(anchor, repl) == src: die(sid + ' replacement is a no-op')
    if not os.path.exists(os.path.join(ROOT, 'tests', gate)): die(sid + ' gate missing ' + gate)
    if sid not in VERIFIED: die(sid + ' has no verified note')
    note = note + ' ' + VERIFIED[sid]
    out.append({'name': name, 'anchor': anchor, 'replacement': repl, 'gate': gate, 'note': note})

OLD = r"""  G7e: 'G7e ' + TAG + ' seeded, clamped (slow, fast) and edited-from-a-time forms: card and clipboard unchanged',"""
NEW = r"""  G7e: 'G7e ' + TAG + ' seeded, clamped (slow, fast) and edited-from-a-time forms plus beginner entered and seeded: non-beginner forms unchanged, beginner entered and seeded forms read the athlete\'s mile (D188)',"""
g = open(GATE, encoding='utf-8').read()
no, nn = g.count(OLD), g.count(NEW)
if no == 1 and nn == 0:
    g2 = g.replace(OLD, NEW); label = 'label edited'
elif no == 0 and nn == 1:
    g2 = None; label = 'label already applied'
else:
    die('G7e label counts old ' + str(no) + ' new ' + str(nn))

body = json.dumps(out, indent=2, ensure_ascii=False) + '\n'
if json.loads(body) != out: die('spec does not round-trip')
open(SPEC, 'w', encoding='utf-8').write(body)
if g2 is not None: open(GATE, 'w', encoding='utf-8').write(g2)
print('OK: wrote ' + SPEC + ' (' + str(len(out)) + ' rows); ' + label)
