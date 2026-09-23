import sys
src=open(sys.argv[1],encoding='utf-8').read()
edits=[
 # D70c-A1 + D149-D2: the barbell clause sees mid-name 'barbell' and the close-grip bench; GHD gets its own clause
 ("if(!hasBarbell && /^barbell |^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|glute-ham/i.test(N)) return false;",
  "if(!hasBarbell && /\\bbarbell\\b|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|close-grip bench/i.test(N)) return false;\n    if(!hasGHD && /glute-ham|\\bghr\\b|45° back extension/i.test(N)) return false;"),
 # D149-D1: the cell
 ("  const hasCables=equip==='commercial';",
  "  const hasCables=equip==='commercial';\n  const hasGHD=equip==='commercial'||isCrossfit;"),
 # D70c-A2
 ("let chestCompoundPool=hasBarbell?(olderHyp?['Dumbbell bench press','Dumbbell incline press','Machine chest press','Close-grip bench press']:EXLIB.chest_compound):",
  "let chestCompoundPool=hasBarbell?_gear(olderHyp?['Dumbbell bench press','Dumbbell incline press','Machine chest press','Close-grip bench press']:EXLIB.chest_compound):"),
 # D70c-A3
 ("let squatPool=hasBarbell?(olderHyp?EXLIB.squat_joint:EXLIB.squat):",
  "let squatPool=hasBarbell?_gear(olderHyp?EXLIB.squat_joint:EXLIB.squat):"),
 # D70c-A4
 ("const chestPoolRaw=isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc;",
  "const chestPoolRaw=isBW?(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc):_gear(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc);"),
 # D70c-B1
 ("          isOlder?['Dumbbell incline press','Machine chest press','Dumbbell bench press','Dumbbell decline press']",
  "          _gear(isOlder?['Dumbbell incline press','Machine chest press','Dumbbell bench press','Dumbbell decline press']"),
 ("                 :['Incline barbell press','Dumbbell bench press','Close-grip bench press','Dumbbell incline press']\n        ).filter(x=>x!==ex.chestMain);",
  "                 :['Incline barbell press','Dumbbell bench press','Close-grip bench press','Dumbbell incline press'])\n        ).filter(x=>x!==ex.chestMain);"),
 # D70c-B2
 ("const _fA=_armsDay?EXLIB.biceps.filter(_noBar):EXLIB.shoulder_iso;",
  "const _fA=_armsDay?(isBW?EXLIB.biceps:bicepsAccPool).filter(_noBar):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));"),
 ("const _fB=_armsDay?EXLIB.triceps:EXLIB.shoulder_iso;",
  "const _fB=_armsDay?(isBW?EXLIB.triceps:_gear(EXLIB.triceps)):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));"),
 # D150-C1: the universe passes the lens before anyone reads it
 ("  return { buildSections };",
  "  return { buildSections, gearOK:_gearOK };"),
 ("  const { buildSections } = C;",
  "  const { buildSections, gearOK } = C;"),
 ("  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);",
  "  { const _isBW=cfg.equipment==='bodyweight'; const _u=_swapUniverseList().filter(n=>gearOK(n)&&!(_isBW&&(_BW_SUBS[n]||_BW_GEAR.test(n)))); _swapUniverseReset(); _swapUniverseAdd(_u); }\n  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);"),
 # D149-D3: the sidecar lens agrees
 ("  if(/cable|pec deck/.test(N)) return equip==='commercial';",
  "  if(/glute-ham|\\bghr\\b|45° back extension/.test(N)) return equip==='commercial'||equip==='crossfit';\n  if(/cable|pec deck/.test(N)) return equip==='commercial';"),
 # D149-D4
 ("squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?['Barbell hip thrust','45° back extension']:['Banded hip thrust','Single-leg glute bridge'];",
  "squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):['Banded hip thrust','Single-leg glute bridge'];"),
 ("        hipExtPool = ['45° back extension'];",
  "        hipExtPool = hasGHD?['45° back extension']:['Bodyweight back extension'];"),
]
for i,(a,b) in enumerate(edits):
    c=src.count(a); print(f"edit {i+1:2d} anchor count={c}")
    assert c==1, f"anchor {i+1} count {c}"
    src=src.replace(a,b)
open(sys.argv[2],'w',encoding='utf-8').write(src); print("written",sys.argv[2])
