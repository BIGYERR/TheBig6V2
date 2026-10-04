#!/usr/bin/env python3
# V230 slice 5 of 5 (builder): D194 part 2 (Amendment 1 R3′).
#   E1-E3  tests/gates/g229_d194_lens.js: (q) is retired at ia-version 230, not inverted (session form calls 3 and 7,
#          tests/measure/v230_rulings/v230_session_calls.md). At VER === 229 it asserts exactly as before; past 229 it
#          prints one named SKIP line (b-ONECLASS's V229 idiom in tests/gates/g228_d193_cueword.js), never PASS, never
#          FAIL, on the live run and on the no-baseline setup run alike. Below 229 nothing changes.
#   E4     tests/sabotage/v230_d194.json (new): S22 (D193 R8, handoff section 12) and S28-S31 (one revert per R3′ site).
# No index.html edit. Every anchor is asserted count==1 before anything is written; the script writes once, at the end.
import json, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G229 = os.path.join(ROOT, 'tests', 'gates', 'g229_d194_lens.js')
SPEC = os.path.join(ROOT, 'tests', 'sabotage', 'v230_d194.json')
CAND = os.path.join(ROOT, 'index.html')
S22SRC = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1cdb8ea3-6810-4976-acce-c88cc911f698/scratchpad/measure/v230/cf6_s22.html'

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

g = open(G229, encoding='utf-8').read()
cand = open(CAND, encoding='utf-8').read()
if '<meta name="ia-version" content="230">' not in cand: die('candidate is not ia-version 230')
if os.path.exists(SPEC): die(SPEC + ' already exists')

# ── E1-E3: g229 (q) retirement ─────────────────────────────────────────────────────────────────────────────────────
E = []
# E3 header: the VERSION PREDICATE line for 230 and up
E.append(('E3 header 230-and-up line',
'''//   230 and up  (o) and (p) assert; (q) REFUSES with "D194 part 2 must re-key this row" (its predicate is VER === 229).
''',
'''//   230 and up  (o) and (p) assert. (q) is retired at 230 by D194 part 2 (Amendment 1 R3′), not inverted: past 229 it
//               prints one named `SKIP row q … retired at ia-version 230 by D194 part 2; delivery asserted by
//               g230_d194_lens2 d194-q′ and d194-eq` line, never PASS and never FAIL, on the live run and on the
//               no-baseline setup run alike (b-ONECLASS's V229 idiom, tests/gates/g228_d193_cueword.js: a column-0
//               REFUSED or a named FAIL would red gate.sh). What it pinned dormant is asserted delivered by
//               tests/gates/g230_d194_lens2.js rows d194-q′ (the typed hand routes) and d194-eq (overlay == fixture on
//               the D190 lattice); session form calls 3 and 7, tests/measure/v230_rulings/v230_session_calls.md. At 229
//               (q) asserts exactly as before.
'''))
# E1 the no-baseline setup branch: (q) past 229 prints the SKIP line instead of a named FAIL; the helper is defined here
E.append(('E1 no-baseline branch + Q_RETIRE',
'''if(!FILES.B){ ORDER.forEach(k => ok(R[k] + (k === 'q' && !Q_LIVE ? ' (REFUSED: ia-version ' + VER + ' is past V229; D194 part 2 must re-key this row)' : ' (setup: no V' + BASE_ERA + ' tree: ' + baseWhy + ')'), false)); done(); }
''',
'''// V230 (D194 part 2, Amendment 1 R3′): past 229 (q) is retired, not inverted (tests/measure/v230_rulings/
// v230_session_calls.md items 3 and 7). One named SKIP line at column 0, counted neither PASS nor FAIL (b-ONECLASS's
// V229 idiom, tests/gates/g228_d193_cueword.js); gate.sh reads only `^REFUSED`, `^\\s*FAIL` and the summary.
const Q_RETIRE = () => P('SKIP ' + R.q + ': retired at ia-version 230 by D194 part 2; delivery asserted by g230_d194_lens2 d194-q′ and d194-eq (Amendment 1 R3′; tests/measure/v230_rulings/v230_session_calls.md items 3 and 7; this file reads ia-version ' + VER + ', the row is era 229 only). Never PASS, never FAIL.');
if(!FILES.B){ ORDER.forEach(k => { if(k === 'q' && !Q_LIVE){ Q_RETIRE(); return; } ok(R[k] + ' (setup: no V' + BASE_ERA + ' tree: ' + baseWhy + ')', false); }); done(); }
'''))
# E2 the row loop
E.append(('E2 row loop',
'''  ORDER.forEach(k => { if(k === 'q' && !Q_LIVE){ ok(R.q + ' (REFUSED: ia-version ' + VER + ' is past V229; D194 part 2 must re-key this row)', false); return; }
''',
'''  ORDER.forEach(k => { if(k === 'q' && !Q_LIVE){ Q_RETIRE(); return; }
'''))
for name, a, r in E:
    n = g.count(a)
    if n != 1: die(name + ': anchor count ' + str(n))
for name, a, r in E:
    g = g.replace(a, r, 1)
if g.count('Q_RETIRE') != 3: die('Q_RETIRE references ' + str(g.count('Q_RETIRE')))
if 'D194 part 2 must re-key this row)' in g: die('a REFUSED-past-229 print survived')

# ── E4: tests/sabotage/v230_d194.json ──────────────────────────────────────────────────────────────────────────────
s22_lines = open(S22SRC, encoding='utf-8').read().split('\n')
cand_lines = cand.split('\n')
S22_A = "      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_fi.detail; }"
if cand_lines[14351] != S22_A: die('candidate line 14352 is not the S22 anchor')
S22_R = s22_lines[14351]
if S22_R == S22_A or 'const _dm=' not in S22_R: die('cf6_s22.html line 14352 is not the S22 mutation')
RULING = 'tests/measure/v229_rulings/d194_injlens_ruling.md'
M12 = 'tests/measure/v230_rulings/measure_lens_overlay_cf6_m12.md'
G230 = 'gates/g230_d194_lens2.js'
spec = [
 {"name": "S22-D193 R8 -> the hold trigger is keyed on the donor as read (cue = RPE 7, else the donor's first RPE)",
  "anchor": S22_A, "replacement": S22_R, "gate": G230,
  "note": "NAMED TRIP: row d193-k″ (IRON_ASYLUM_HANDOFF_1_1.md section 12 \"S22 (R8 trigger keyed on the donor as read → (k″) 196) lands with its row\"; figure: " + M12 + " [5], measure's exact mutation, cf6.html line 14352): R8's unloadable hold toast is lost on 196 of 196 bwsets ends on OV1 (and 196 of 196 on the fixture); cards moved 0. EXPECTED: d193-k″ (196 of 196). Side trips read on the run: (k) under S22 was not measured (M12 [5]); d193-i pins the hold-toast count 39,203. Cards do not move, so d194-eq (OV1 == CFG1) is not the trip."},
 {"name": "S28-D194 R3′ -> the tap guard back on activeProg.cfg (V229's form; the filter cfg left on the lens)",
  "anchor": "  if(activeProg&&_dayPlanCfg(activeProg,day).injury){\n    item._preHold=_preF;\n",
  "replacement": "  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    item._preHold=_preF;\n",
  "gate": G230,
  "note": "NAMED TRIP: row d194-eq, live (" + RULING + " Amendment 1 R3′: the tap guard reads the plan of the day): on an overlay program the tap keeps no dose and does not re-filter, so the live card, its _preHold, ph and the toasts differ from the fixture. Also d194-q′ (the typed mario routes print \"2×6–10 @ RPE 8\" with no hold toast on OV5). Figure: no per-site figure ruled; the bound is " + M12 + " [4], V229 OV1 vs CFG1 (both halves off) live 12,518, toasts 18,580, _preHold and ph 18,580 of 18,580; read on the run. EXPECTED: d194-eq (live) and d194-q′."},
 {"name": "S29-D194 R3′ -> the tap filter cfg back to activeProg.cfg (the guard left on the lens)",
  "anchor": "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],_dayPlanCfg(activeProg,day));\n",
  "replacement": "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n",
  "gate": G230,
  "note": "NAMED TRIP: row d194-eq, live (" + RULING + " Amendment 1 R3′: the tap filter cfg is the plan of the day): the dose is kept but the re-filter reads the overlay program's uninjured cfg, so the live card stays above RPE 7 with no hold toast where the fixture holds it. Figure: no per-site figure ruled; bound " + M12 + " [4], V229 OV1 vs CFG1 live 12,518 of 18,580; read on the run. EXPECTED: d194-eq (live card above RPE 7); d194-q′ side trip expected (U2 hop onto Leg extension)."},
 {"name": "S30-D194 R3′ -> the boot guard back on prog.cfg (V229's form; the filter cfg left on the lens)",
  "anchor": "    if(hit && _dayPlanCfg(prog,day).injury){\n",
  "replacement": "    if(hit && prog.cfg && prog.cfg.injury){\n",
  "gate": G230,
  "note": "NAMED TRIP: rows d193-i-r and d194-eq, boot (" + RULING + " Amendment 1 R3′: the boot guard reads the plan of the day): on an overlay program the boot replay keeps no dose and does not re-filter, so the rebooted slot carries no kept dose (d193-i-r: 18,580 of 18,580 on OV1 wanted) and the boot card differs from the fixture. Figure: no per-site figure ruled; bound " + M12 + " [4], V229 OV1 vs CFG1 boot 12,518, undo+boot 15,053 of 18,580; d193-i-r's V229 baseline kept dose 0; read on the run. EXPECTED: d193-i-r and d194-eq (boot)."},
 {"name": "S31-D194 R3′ -> the boot filter cfg back to prog.cfg (the guard left on the lens)",
  "anchor": "      day.sections=applyInjuryFilter(day.sections,_dayPlanCfg(prog,day));\n",
  "replacement": "      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n",
  "gate": G230,
  "note": "NAMED TRIP: row d194-eq, boot (" + RULING + " Amendment 1 R3′: the boot filter cfg is the plan of the day): the boot replay keeps the dose but re-filters with the overlay program's uninjured cfg, so the booted card stays above RPE 7 where the fixture holds it. Figure: no per-site figure ruled; bound " + M12 + " [4], V229 OV1 vs CFG1 boot 12,518 of 18,580; read on the run. EXPECTED: d194-eq (boot); d193-i-r side trip expected (live == boot)."},
]
for m in spec:
    n = cand.count(m['anchor'])
    if n != 1: die(m['name'] + ': candidate anchor count ' + str(n))
    if m['anchor'] == m['replacement']: die(m['name'] + ': no-op mutation')

# ── write once ─────────────────────────────────────────────────────────────────────────────────────────────────────
open(G229, 'w', encoding='utf-8').write(g)
open(SPEC, 'w', encoding='utf-8').write(json.dumps(spec, ensure_ascii=False, indent=1) + '\n')
print('wrote ' + G229 + ' (E1-E3) and ' + SPEC + ' (' + str(len(spec)) + ' mutations)')
