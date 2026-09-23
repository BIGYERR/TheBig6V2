#!/usr/bin/env python3
# V208 close 3 — coach-ruled: a program with NO lift day prints no lift-placement note. legRecoveryNote
# is null when no day of the built program carries a lifting section. Before V208 the 1-2 week dated test
# programs printed the speed-session note, equally false; V208 swapped one wrong sentence for another.
# The em-dash and hyphen inside the 48h strings stay with D109a (the strings are not touched).
# The guard sits where the note is SET on the program, buildProgram's return, after every pass that can
# strip a section (raceEveLiftPass, singletonSupersetSweep), so it covers every arm (NRC, pace, run_base,
# the 48h rule) at once. A lifting day, for the guard, is the week strip's own notion (dayCode): a
# non-rest day with a section that has items and is neither core nor hip.
#   index.html E1: the lift-day predicate, computed after the last section pass.
#   index.html E2: the return writes the note only when the program has a lifting day.
#   gate: g208_d104a_runbase R8a (lift-free programs print no note; oracle: the day's 'lift' tag AND its
#         sections, so the gate does not share the guard's predicate) and R8b (programs with a lift day
#         are byte-identical to the pre-edit tree; build pair only, same ia-version).
#   spec: v208_d104a M5, the guard removed.
# No meta change (ia-version is already 208). Every anchor asserted count==1; all-or-nothing.
import sys, json
R = '/Users/CanasBangin/Desktop/TheBig6V2/'
IDX = [
 ("  delete cfg._racePin;   // V188 (D14a): derived at build time, never stored — refreshProgram recomputes it\n  return {id,name:",
  "  delete cfg._racePin;   // V188 (D14a): derived at build time, never stored — refreshProgram recomputes it\n"
  "  // V208 (coach): a program with no lifting day prints no lift-placement note, on every arm. Read after\n"
  "  // the last pass that can strip a section; a lifting day is the week strip's (dayCode): a non-rest day\n"
  "  // with a section that has items and is neither core nor hip.\n"
  "  const _liftDay = Object.keys(weeks).some(w => _ISO_ORDER.some(d => { const x = weeks[w] && weeks[w][d];\n"
  "    return !!x && !x.rest && (x.sections||[]).some(s => !s.core && !s.hip && (s.items||[]).length); }));\n"
  "  return {id,name:"),
 ("raceDateWeeks:cfg.raceDateWeeks||null,legRecoveryNote,liftRecoveryWeeks,",
  "raceDateWeeks:cfg.raceDateWeeks||null,legRecoveryNote:_liftDay ? legRecoveryNote : null,liftRecoveryWeeks,"),
]
GATE = [
 ("//   R7  undated pace/mile and NRC role grids and notes equal the baseline's.\n",
  "//   R7  undated pace/mile and NRC role grids and notes equal the baseline's.\n"
  "//   R8a a program with no lift day prints no lift-placement note (coach, V208 close): dated 1-2 week\n"
  "//       test programs and NRC race windows. Oracle: a lift day is a non-rest day tagged 'lift' OR\n"
  "//       carrying a non-core, non-hip section with items; a program is lift-free only if neither holds.\n"
  "//   R8b programs WITH a lift day are byte-identical to the pre-edit tree (build pair only: the baseline\n"
  "//       carries the candidate's ia-version; against V207 it prints SKIP).\n"),
 ("const ROWS = ['R0','R0b','R1','R2','R3','R4','R5','R6','R7','M1'];",
  "const ROWS = ['R0','R0b','R1','R2','R3','R4','R5','R6','R7','R8a','R8b','M1'];"),
 ("{ let hm; try { hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n",
  "// ── R8: no lift day, no lift-placement note ─────────────────────────────────────────\n"
  "{ const START = new Date(2026, 9, 5);   // Mon 2026-10-05\n"
  "  const isoOff = n => { const d = new Date(START); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };\n"
  "  const PACE = {id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'};\n"
  "  const MILE = {id:'run_mile_time', mileBestMins:'8', mileBestSecs:'15', targetDist:'1', targetMins:'7', targetSecs:'30', paceUnit:'mi'};\n"
  "  const CF = [];\n"
  "  for(const g of [PACE, MILE]) for(const mix of ['', 'bike', 'swim']) for(const rest of [[], ['sun'], ['sat'], ['sun','wed'], ['sat','sun'], ['mon','fri'], ['sun','tue','thu','sat']]) for(const tw of [1, 2]) for(let wd = 0; wd < 7; wd++){\n"
  "    const cg = {run:clone(g)}; if(mix === 'bike') cg.bike = {id:'bike_base'}; if(mix === 'swim') cg.swim = {id:'swim_base'};\n"
  "    CF.push({fam:g.id + (mix ? '+' + mix : '') + ' tw' + tw, cfg:{name:'GK', primaryPath:'event', eventTargeted:true, raceDate:isoOff(7 * (tw - 1) + wd), _testWeek:tw, _raceDateCappedWeeks:tw, cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg,\n"
  "      liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:rest.slice(), days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:isoOff(0), seed:24865}}); }\n"
  "  for(const g of ['run_5k','run_10k']) for(const mix of ['', 'bike']) for(const rest of [['sun'], ['sun','wed']]) for(const off of [2, 5, 9, 12]){\n"
  "    const cg = {run:{id:g, label:g}}; if(mix) cg.bike = {id:'bike_base', label:'Bike'};\n"
  "    CF.push({fam:'NRC ' + g + (mix ? '+' + mix : ''), cfg:Object.assign(clone(fixtures.HALF_MANNY), {cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, restDays:rest, seed:76308, startDate:isoOff(0), raceDate:isoOff(off)})}); }\n"
  "  const liftDay = x => !!x && !x.rest && ((x.tags || []).includes('lift') || (x.sections || []).some(s => !s.core && !s.hip && (s.items || []).length));\n"
  "  const hasLift = p => Object.keys(p.weeks).some(w => ISO.some(d => liftDay(p.weeks[w][d])));\n"
  "  const free = [], bad = [], withLift = []; let crash = 0;\n"
  "  CF.forEach((e, i) => { let p; try { p = IA.buildProgram(clone(e.cfg)); } catch(x){ crash++; return; }\n"
  "    if(hasLift(p)) withLift.push(i); else { free.push(i); if(p.legRecoveryNote != null) bad.push(e.fam + ' race ' + e.cfg.raceDate + ' rest=[' + e.cfg.restDays + '] ' + JSON.stringify(String(p.legRecoveryNote).slice(0, 50))); } });\n"
  "  ok(`R8a a program with no lift day prints no lift-placement note (${free.length} lift-free of ${CF.length} short dated programs, ${crash} crashes)`, crash === 0 && free.length > 0 && bad.length === 0, bad.length + ' carry a note: ' + bad.slice(0, 3).join('; '));\n"
  "  if(!BASEFILE) skip('R8b no baseline passed as argv[3]');\n"
  "  else { const IB = load(BASEFILE);\n"
  "    if(+IB.version !== VER) skip('R8b runs only against the pre-edit tree at the same ia-version (build proof for the V208 close guard); this pair is ' + VER + ' vs ' + IB.version);\n"
  "    else { const strip = p => { const q = clone(p); delete q.created; delete q.id; return JSON.stringify(q); }; const moved = [];\n"
  "      withLift.forEach(i => { if(strip(IA.buildProgram(clone(CF[i].cfg))) !== strip(IB.buildProgram(clone(CF[i].cfg)))) moved.push(CF[i].fam + ' race ' + CF[i].cfg.raceDate); });\n"
  "      ok(`R8b the ${withLift.length} programs with a lift day are byte-identical to the pre-edit tree`, withLift.length > 0 && moved.length === 0, moved.length + ' moved: ' + moved.slice(0, 3).join('; ')); } } }\n"
  "{ let hm; try { hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"),
]
plans = {}
h = open(R + 'index.html', encoding='utf-8').read()
if '<meta name="ia-version" content="208">' not in h: sys.exit('ABORT: index.html is not ia-version 208')
for a, b in IDX:
    if h.count(a) != 1: sys.exit('ABORT: index.html anchor count=%d: %r — nothing written' % (h.count(a), a[:70]))
    h = h.replace(a, b, 1)
plans['index.html'] = h
g = open(R + 'tests/gates/g208_d104a_runbase.js', encoding='utf-8').read()
for a, b in GATE:
    if g.count(a) != 1: sys.exit('ABORT: gate anchor count=%d: %r — nothing written' % (g.count(a), a[:70]))
    g = g.replace(a, b, 1)
plans['tests/gates/g208_d104a_runbase.js'] = g
sp = R + 'tests/sabotage/v208_d104a.json'
spec = json.load(open(sp, encoding='utf-8'))
if any(m['name'].startswith('M5 ') for m in spec): sys.exit('ABORT: spec already has an M5 — nothing written')
M5 = {"name": "M5 -> the no-lift-day guard is removed: a 1-2 week dated test program with no lifting day again prints a lift-placement note (the 48h tier or the speed-session sentence) about lifting it does not have",
      "anchor": "raceDateWeeks:cfg.raceDateWeeks||null,legRecoveryNote:_liftDay ? legRecoveryNote : null,liftRecoveryWeeks,",
      "replacement": "raceDateWeeks:cfg.raceDateWeeks||null,legRecoveryNote,liftRecoveryWeeks,",
      "gate": "gates/g208_d104a_runbase.js",
      "note": "Added at the V208 close (coach). NAMED TRIP: R8a (lift-free programs carry a note again). R8b needs a same-version baseline and prints SKIP under sabotage.py; every other row reads programs with lift days and stays green. EXPECTED: R8a only."}
if h.count(M5['anchor']) != 1: sys.exit('ABORT: M5 anchor count=%d on the edited tree — nothing written' % h.count(M5['anchor']))
spec.append(M5)
plans['tests/sabotage/v208_d104a.json'] = json.dumps(spec, indent=2, ensure_ascii=False) + '\n'
for f, s in plans.items():
    open(R + f, 'w', encoding='utf-8').write(s)
print('V208 close 3 written:', ', '.join(plans))
