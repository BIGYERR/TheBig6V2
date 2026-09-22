#!/usr/bin/env python3
# V203 slice G — the sabotage mutations owed by slices A, B and D, appended to the six
# slice C already carries. Touches NO index.html: it only writes tests/sabotage/v203.json.
# Every anchor is counted against index.html HERE, before the file is written, so a
# NOT-APPLIED mutation is caught as a mutation defect at authoring time instead of in
# the sweep. The first miss aborts the whole script.
import io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART  = os.path.join(ROOT, 'index.html')
SPEC = os.path.join(ROOT, 'tests', 'sabotage', 'v203.json')
CEIL = 'gates/g203_ceiling_and_anchor.js'

with io.open(ART, encoding='utf-8') as f: html = f.read()
with io.open(SPEC, encoding='utf-8') as f: spec = json.load(f)

NEW = []
def M(name, anchor, replacement, gate, note):
    NEW.append({'name': name, 'anchor': anchor, 'replacement': replacement, 'gate': gate, 'note': note})

# ── D117: the formula itself ──────────────────────────────────────────────────
M('M7 -> D117 steady ceiling formula: the midpoint of Tempo and Recovery becomes Recovery itself. Every easy card still prints a ceiling, still carries dose.cap, and the number is still a real pace off the same chart row. It is the ATHLETE-FACING ceiling that is gone: a ceiling set at Recovery Pace permits exactly the pace it was written to forbid, so an easy run can drift into the quality session with the sentence still on the card',
  'function steadyCapSec(row){ return Math.round((row.tempo + row.recovery)/2); }',
  'function steadyCapSec(row){ return Math.round(row.recovery); }',
  CEIL,
  'NAMED TRIP: g203_ceiling section 2, row \'EVERY recovery run carries dose.cap = 598\' in the run_half @ 8:00 sweep, with \'EVERY recovery run ends "Do not run faster than 9:58/mi."\' and the matching long-run pair red beside it, and the same four rows red at 10:30 (598 -> 630, 760 -> 800). '
  'WHAT DISCRIMINATES: section 1 must STAY GREEN IN FULL. Section 1 is the hand table checked against PACE_CHART and the longhand arithmetic 598 = round((565 + 630) / 2); it never calls steadyCapSec, so it cannot move when steadyCapSec does. A section 1 that went red with section 2 would mean the oracle was reading the engine, which is the one thing an oracle may not do. '
  'The row \'the ceiling sits between Tempo and Recovery on every row\' also stays green for the same reason and is the sentence of the ruling this mutant violates. '
  'EXPECTED COLLATERAL, DISCLOSED AND MEASURED, NOT NOISE: section 2d goes red too — all twelve run_base ceiling and dose.cap rows across both anchors. That is ONE root cause, not two: slice D pointed run_base at this same function, so a formula break is visible at three call sites by design. This mutation is what proves the run_base rows and the NRC rows share an owner. Sections 2b, 2c, 3, 4 and 5 stay GREEN: no card class disappears, no sentence is deleted, no cfg path is touched.')

# ── D117: the recovery ceiling sentence, deleted on the distance-based branch ──
rec_anchor = 'detail = `${_pick.label} recovery run — ${_mi} mi at Recovery Pace (${paces.recovery}). 4–5/10 effort — easy enough to talk, laugh, or argue freely. ${_prog} Do not run faster than ${fmt(steadyCapSec(chartRow))}.`;'
M('M8 -> the recovery ceiling sentence is deleted from the DISTANCE-based recovery run only. The time-based branch keeps it, so 41 of the 48 recovery runs in the sweep still print the ceiling and the app looks entirely correct. The 7 distance-based cards keep dose.cap, so the log readout still shows a delta against a ceiling the athlete was never told about',
  rec_anchor,
  rec_anchor.replace(' ${_prog} Do not run faster than ${fmt(steadyCapSec(chartRow))}.`;', ' ${_prog}`;'),
  CEIL,
  'NAMED TRIP: g203_ceiling section 2, row \'EVERY recovery run ends "Do not run faster than 9:58/mi."\' in the run_half @ 8:00 sweep, and its three counterparts in the other three sweeps (all four carry distance-based recovery entries: 2, 2, 1 and 2 cards respectively). '
  'WHAT DISCRIMINATES, AND IT IS THE POINT OF THE MUTATION: \'EVERY recovery run carries dose.cap = 598\' must STAY GREEN. The dose is untouched; only the sentence is gone. A suite where the dose row went red here would mean the two claims were not actually separate, and the ruling makes them separate on purpose (the cap is what the log reads, the sentence is what the athlete reads). '
  'The word EVERY in the row name is also under test: 7 of 48 cards is a minority, so a row that had checked "some recovery run prints a ceiling" would survive this untouched. '
  'EXPECTED COLLATERAL: none. Sections 1, 2b, 2c, 2d, 2e, 3, 4 and 5 stay GREEN — run_base never reaches this branch, it has its own sentence.')

# ── D117: the cap dropped from the minute-based long run dose ──────────────────
long_anchor = "_dose = L.unit === 'min' ? {k:'time', mins:L.val, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)} : {k:'dist', mi:L.val, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)};"
M('M9 -> dose.cap is dropped from the MINUTE-based long run only. The distance-based long runs, which are 38 of the 40 non-race long runs in the sweep, keep it. The card still prints "Average no faster than", so the prescription reads correctly and only the structured dose the log grades against is missing: the athlete is told the ceiling and then graded as though there were none',
  long_anchor,
  long_anchor.replace("{k:'time', mins:L.val, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)}", "{k:'time', mins:L.val, tgt:Math.round(chartRow.recovery)}"),
  CEIL,
  'NAMED TRIP: g203_ceiling section 2, row \'EVERY non-race long run carries dose.cap = 598\' in the run_half @ 8:00 sweep, and \'EVERY non-race long run carries dose.cap = 760\' at 10:30. '
  'WHAT DISCRIMINATES, TWICE OVER. First: the two run_10k sweeps must STAY GREEN on the same row name. Only the half carries a minute-based long run (Nike prints one per half plan, 1 card of 13); the 10K plans are all distance. A row that went red in all four sweeps would be reading a build-level fact, and this one reads per card. Second: \'EVERY non-race long run ends "Average no faster than 9:58/mi."\' must STAY GREEN — the sentence is untouched, and that is the mirror of M8. M8 deletes the sentence and keeps the dose; M9 deletes the dose and keeps the sentence. Between them the two claims are proved independent. '
  'One card in forty is the smallest real version of this defect and is what the word EVERY is defending. '
  'EXPECTED COLLATERAL: none. Sections 1, 2b, 2c, 2d, 2e, 3, 4, 5 stay GREEN.')

# ── D117: a cap ADDED to a speed run (the negative rows earn their keep) ───────
M("M10 -> a cap is ADDED to every speed run. D117 rules the ceiling onto easy work ONLY: a ceiling on an interval, tempo, fartlek or hill session tells the athlete not to run fast on the day whose entire purpose is running fast, and the log would grade a quality session against an easy-run pace. This is the mutation the NEGATIVE rows exist for. It is a plausible slip, because the natural reading of 'every run gets a ceiling' is exactly this",
  "subtype = 'Speed Run — ' + sp.type;",
  "subtype = 'Speed Run — ' + sp.type;\n    _dose = {k:'time', mins:30, cap:steadyCapSec(chartRow)};",
  CEIL,
  'NAMED TRIP: g203_ceiling section 2, row \'NO speed run carries dose.cap\', in all four sweeps (84 speed runs across the sweep, every one of them capped by the mutant). '
  'WHAT DISCRIMINATES: \'NO speed run prints a ceiling sentence\' must STAY GREEN. The detail string is untouched; only the structured dose gained a cap. The two negative rows are written separately for precisely this reason — the sentence and the dose are two different promises to two different readers, and a mutation can break either alone. '
  'The row \'sweep left 20+ speed runs uncapped (84)\' is a COUNT of speed runs, not of caps, so it stays green: it is a non-vacuity guard, and it is named here so no reader mistakes it for the pin. '
  'EXPECTED COLLATERAL: none inside this gate. Sections 1, 2b, 2c, 2d, 2e, 3, 4, 5 stay GREEN. Outside it, a dose on 84 NRC cards moves HALF_MANNY and would take every MANNY_DIGEST_BY_VERSION reader red; the runner scores the NAMED gate only, and that wider radius is gatekeeper\'s blast-radius pass, not this row.')

# ── D118: the anchor stops riding across a goal change ────────────────────────
next_anchor = """  const next={id:g.id,label:g.label,baseline:'',
    ...(sport==='run'&&prev.mileBestMins!==undefined&&prev.mileBestMins!==''
        ?{mileBestMins:prev.mileBestMins,mileBestSecs:prev.mileBestSecs,...(prev.mileBestSrc?{mileBestSrc:prev.mileBestSrc}:{})}:{})};"""
M('M11 -> D118 is reverted at the writer: a goal change rebuilds the run goal without the mile fields. Nothing throws and nothing looks broken. The athlete switches from the half to a 10K and the mile time they typed in week 3 is silently gone, so every pace in the new program falls back to the experience default and the whole plan re-paces without a word on screen',
  next_anchor,
  "  const next={id:g.id,label:g.label,baseline:''};",
  CEIL,
  'NAMED TRIP: g203_ceiling section 3, row \'mileBestMins PRESERVED across the switch\', with \'mileBestSecs PRESERVED across the switch\' and \'mileBestSrc PRESERVED across the switch\' red beside it, and section 3d\'s \'ROUND TRIP: half -> 1.5mi pace goal -> half rebuilds the ORIGINAL program\' red as the coaching consequence rather than the storage shape. '
  'WHAT DISCRIMINATES: section 3b must STAY GREEN IN FULL. 3b is the goal with NO prior mile entry, where the correct answer is that nothing is carried; the mutant also carries nothing there, so 3b cannot tell the two apart and 3 can. That is what makes 3 a test of PRESERVATION rather than of absence. Section 3c (the bike switch) stays GREEN too: a non-run sport was never meant to carry a mile. '
  '\'baseline still DROPPED as D5 wrote it (empty string)\' and \'baselineDist still DROPPED as D5 wrote it (absent)\' also stay GREEN, which pins the trip on the D118 addition and proves the mutant did not simply delete the whole object. '
  'EXPECTED COLLATERAL: none. Sections 1, 2, 2b, 2c, 2d, 2e, 4, 5 stay GREEN — no card is built differently, this is a cfg-write path only.')

# ── D119: the widened entered branch narrowed back ────────────────────────────
M("M12 -> the `entered` branch is narrowed back to `entered` alone, dropping the `|| a.kind === 'edited'` slice B added. An edited anchor carrying no `from` (the shape M2 above shows the writer can still produce) now falls all the way through to the default sentence and the athlete is told 'no mile time was entered' about the mile time they just entered by hand. The sentence is well formed, grammatical, and a flat lie",
  "  if(a.kind === 'entered' || a.kind === 'edited')  return ",
  "  if(a.kind === 'entered')  return ",
  CEIL,
  'NAMED TRIP: g203_ceiling section 4b, row \'edited with no from does NOT print "no mile time was entered"\' — the row the D119 ruling was written around — with \'edited with no from falls to the plain entered sentence\' and \'edited with from undefined behaves the same\' red beside it. '
  'WHAT DISCRIMINATES: section 4 must STAY GREEN IN FULL. Every row in 4 supplies a `from`, so the edited branch above catches them and the narrowed fall-through is never reached. Red in 4 AND 4b would mean the branch had been removed rather than the fall-through narrowed, which is M14 and a different defect. Section 4c stays GREEN, including \'default / estimated from experience\', which is the row that proves the default sentence itself is intact and that what moved is WHICH anchors reach it. '
  'EXPECTED COLLATERAL: none. Sections 1, 2, 2b, 2c, 2d, 2e, 3, 5 stay GREEN.')

# ── D119: the edited guard narrowed to the kind alone ─────────────────────────
M("M13 -> the edited guard is narrowed to `a.kind === 'edited'` alone, dropping the `&& a.from` conjunct. On the degenerate record the branch body now dereferences a null `from` and the provenance line throws. In the app that is a render that dies rather than a sentence that lies, which is a different failure from M12 and has to be caught by a different row",
  "  if(a.kind === 'edited' && a.from){",
  "  if(a.kind === 'edited'){",
  CEIL,
  'NAMED TRIP: g203_ceiling section 4b, row \'edited with no from RENDERS (the sentence did not throw)\', with \'edited with no from falls to the plain entered sentence\' and \'edited with from undefined behaves the same\' red beside it. '
  'WHAT DISCRIMINATES, AND READ THIS ONE CAREFULLY: \'edited with no from does NOT print "no mile time was entered"\' must STAY GREEN here, and it is GREEN FOR A HOLLOW REASON — a sentence that threw prints nothing at all, so it cannot print that phrase either. That is exactly why the RENDERS row was added alongside it: without it the gate would have scored a thrown render as a pass on the negative row, and a crashed render reads as "no failures" to anything that only asks what a string does not contain. M12 and M13 are the two halves of one guard and they trip different rows, which is the whole reason both are in the spec. '
  'Section 4 stays GREEN (every row there supplies a `from`, so the body never dereferences null). Sections 1, 2, 2b, 2c, 2d, 2e, 3, 4c, 4d, 5 stay GREEN.')

# ── D119: the edited branch removed outright ──────────────────────────────────
M('M14 -> the edited provenance branch is removed outright. Every edited anchor now renders the short entered sentence. Nothing throws, nothing lies, and the copy is clean: the athlete is simply never told which week they changed the anchor or what it used to be, which is the entire content of D119',
  "  if(a.kind === 'edited' && a.from){",
  "  if(false && a.kind === 'edited' && a.from){",
  CEIL,
  'NAMED TRIP: g203_ceiling section 4, row \'edited + from.kind entered names the week and the prior TIME\', with \'edited + from.kind default names the week and says it was estimated\' and \'edited + from with a seconds value that needs padding\' red beside it. All three name the ruling\'s two obligations: the week number and the prior value. '
  'WHAT DISCRIMINATES: section 4b must STAY GREEN IN FULL. 4b asserts that the degenerate no-`from` record renders the plain entered sentence, and the mutant renders exactly that for EVERY edited record, so 4b cannot see this at all. 4 sees it and 4b does not, which is the mirror image of M12 (4b sees it, 4 does not). A spec carrying only one of the two would have left half of D119 unpinned. '
  '\'clamped beats every kind, including edited\' in 4c stays GREEN, which proves the clamped branch still wins ahead of the removed one and the ordering was not what moved. '
  'EXPECTED COLLATERAL: none. Sections 1, 2, 2b, 2c, 2d, 2e, 3, 5 stay GREEN. Section 4d stays GREEN: the short sentence is still clean copy, which is the honest reading — the copy rule cannot see a missing sentence, only a badly written one.')

# ── slice D: the WRONG row handed to steadyCapSec at ONE of the two run_base sites ──
M("M15 -> the wrong chart row is handed to steadyCapSec at the lsd_easy site only. `_row` is replaced by the row one minute per mile faster, so run_base's ordinary easy runs print a ceiling from somebody else's fitness while the 'Around' pace in the same sentence still comes from the real row. The two numbers in one sentence stop describing one athlete: at an 8:00 mile the card reads 'Around 10:30/mi is right for you, do not run faster than 8:48/mi', a ceiling FASTER than the pace it recommends. The long easy run, built at the other site, stays correct, so half the week is right",
  '      const _steadySec = steadyCapSec(_row);',
  "      const _steadySec = steadyCapSec(paceChartLookup('mile', _row.mile - 60));",
  CEIL,
  'NAMED TRIP: g203_ceiling section 2d, rows \'mile 8:00 _steadySec: EVERY easy run prints "do not run faster than 9:58/mi."\', \'mile 8:00 _steadySec: EVERY easy run carries dose.cap = 598\' and \'mile 8:00 _steadySec: the Around pace is the SAME row\'s Recovery (10:30/mi)\' — that last one is the pairing row, and it is the one that would catch a wrong row even if the wrong row happened to produce a plausible number. The 10:30 counterparts go red with them (760 -> 695). '
  'WHAT DISCRIMINATES, AND THIS IS THE WHOLE REASON THE TWO SITES ARE ASSERTED SEPARATELY: every \'_steadySecL:\' row must STAY GREEN, at both anchors, including its own pairing row. Slice D re-pointed TWO call sites and proved byte-identity by hand across nine builds; nothing pinned either of them until now, and a single run_base assertion would have reported "run_base moved" without saying which site. Six green L rows beside six red E rows is the report that names the line. '
  'Section 2e stays GREEN: the ceilings still MOVE between the two anchors, they are simply the wrong ones, so the non-vacuity guard cannot see this — named here so it is not mistaken for a pin. Sections 1, 2, 2b, 2c, 3, 4, 5 stay GREEN: the NRC path never reaches this line, which is exactly the gap slice D left and this row closes.')

# ── anchor census before anything is written ──────────────────────────────────
bad = []
for m in NEW:
    c = html.count(m['anchor'])
    print('%-4s count=%d  %s' % (m['name'].split(' ')[0], c, 'OK' if c == 1 else 'NOT-APPLIED RISK'))
    if c != 1: bad.append((m['name'].split(' ')[0], c))
if bad:
    sys.exit('ABORT: anchors not unique in index.html: %s' % bad)

names = set(x['name'].split(' ')[0] for x in spec)
for m in NEW:
    if m['name'].split(' ')[0] in names:
        sys.exit('ABORT: duplicate mutation id %s' % m['name'].split(' ')[0])

spec = spec + NEW
with io.open(SPEC, 'w', encoding='utf-8') as f:
    f.write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
print('WROTE %s  (%d mutations)' % (SPEC, len(spec)))
