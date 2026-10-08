#!/usr/bin/env python3
# v237_s5_flip_g232_g235.py -- V237 builder slice 5: the g232 and g235 rows D220 flips.
# Ruling: tests/measure/v237_rulings/v237_ruling_d220_d222.md, "Existing rows this ruling flips". Names stay; each
# flipped claim splits VER <= 236 (dash, as shipped) / VER >= 237 (zero). No row leaves the manifest; no row label of a
# fallback-keyed row (g232 D199/D201/D204-forms, manifest key L:f232d23f) is touched.
#   g232 D203        DEC3 abc / . / -1 -> ['0','0','0'] from 237 (DEC3_V237, chosen at use).
#   g232 D202-open   free miles face DASH_MI -> '0.00' from 237 (FREE_MI): wantFaces time and reps_time, the four
#                    legacy time-form rows (getters), the open-lattice detail text.
#   g235 D215-rows   dist-dash / rept-dash conjuncts: column 0 first item '0', data-wrap '' from 237; pace-dash unchanged.
#   g235 D217-others dec3-table dash entries -> zeros from 237; the dist-dash / rept-dash format conjuncts stand.
#   g235 D216-wrap   no text change (the ruling).
# All or nothing: every anchor is asserted count == 1 on the text it is applied to; both files are written only after
# every replacement in both has matched.
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
G232 = ROOT / 'tests' / 'gates' / 'g232_d199_runwheel.js'
G235 = ROOT / 'tests' / 'gates' / 'g235_d215_hmszero.js'

E232 = [
  # 1 header oracle comment, DEC3
  ("//   DEC3         D203's typed table (.86 -> 0 . 8 6; abc, ., -1 -> dash; 3.456 -> 3 4 5; 100 -> 99).\n",
   "//   DEC3         D203's typed table (.86 -> 0 . 8 6; abc, ., -1 -> dash; 3.456 -> 3 4 5; 100 -> 99).\n"
   "//                V237 (D220; tests/measure/v237_rulings/v237_ruling_d220_d222.md, \"Existing rows this ruling flips\"):\n"
   "//                from VER 237 abc, ., -1 land on zero ['0','0','0'] (DEC3_V237); VER <= 236 keeps DEC3. The free\n"
   "//                miles wheel's blank face is the dash through 236 and 0.00 from 237 (FREE_MI).\n"),
  # 2 ROWS comment, D203 and D202-open
  ("//   D203        the dist (dec3) parse table.\n",
   "//   D203        the dist (dec3) parse table: DEC3 (VER <= 236) or DEC3_V237 (VER >= 237, D220).\n"),
  ("//               and the free miles wheel on the time form stays on the dash, D215); a legacy table opens writing nothing\n"
   "//               and seeds the hand faces.\n",
   "//               and the free miles wheel on the time form stays on the dash, D215); from 237 the free miles wheel on the\n"
   "//               time and reps_time forms opens on 0.00 (D220; VER <= 236 keeps the dash); a legacy table opens writing\n"
   "//               nothing and seeds the hand faces.\n"),
  # 3 DEC3_V237
  ("const DEC3 = [['.86', ['0', '8', '6']], ['abc', ['', '', '']], ['.', ['', '', '']], ['-1', ['', '', '']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];\n",
   "const DEC3 = [['.86', ['0', '8', '6']], ['abc', ['', '', '']], ['.', ['', '', '']], ['-1', ['', '', '']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];\n"
   "// V237 (D220): a string with no digits at the front lands on zero (no dash row); the numeric rows are DEC3's, unchanged.\n"
   "const DEC3_V237 = [['.86', ['0', '8', '6']], ['abc', ['0', '0', '0']], ['.', ['0', '0', '0']], ['-1', ['0', '0', '0']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];\n"),
  # 4 FREE_MI, and the comment that said the miles dash holds on every version
  ("// V235 (D215): the free time wheel's blank face from 235 is zero, a stopwatch not started. A function, read at use: VER is set\n"
   "// after load. The free miles wheel keeps DASH_MI on every version (D217).\n"
   "const ZERO_HMS = '0:00:00', FREE_HMS = () => VER >= 235 ? ZERO_HMS : DASH_HMS;\n",
   "// V235 (D215): the free time wheel's blank face from 235 is zero, a stopwatch not started. A function, read at use: VER is set\n"
   "// after load. V237 (D220, retiring D217): the free miles wheel's blank face is DASH_MI through 236 and the odometer's 0.00\n"
   "// from 237 (FREE_MI, read at use the same way).\n"
   "const ZERO_HMS = '0:00:00', FREE_HMS = () => VER >= 235 ? ZERO_HMS : DASH_HMS;\n"
   "const ZERO_MI = '0.00', FREE_MI = () => VER >= 237 ? ZERO_MI : DASH_MI;\n"),
  # 5 LEGACY: the four time-form rows carry the free miles face
  ("  ['time', { run_mins:'100' }, { log_run_mins:'1:40:00', log_run_dist:DASH_MI }],\n"
   "  ['time', { run_mins:'15.333' }, { log_run_mins:'0:15:20', log_run_dist:DASH_MI }],\n"
   "  // V233 D208 re-rules D200's shipped hours-only clamp to a whole-face peg (tests/measure/v233_rulings/v233_ruling_d207_d211.md); a getter, so VER is read at use.\n"
   "  ['time', { run_mins:'650' }, { get log_run_mins(){ return VER >= 233 ? '9:59:59' : '9:50:00'; }, log_run_dist:DASH_MI }],\n"
   "  ['time', { run_mins:'7.5' }, { log_run_mins:'0:07:30', log_run_dist:DASH_MI }],\n",
   "  // V237 (D220): the time form's free miles wheel is on the dash through 236 and on 0.00 from 237 (FREE_MI, a getter).\n"
   "  ['time', { run_mins:'100' }, { log_run_mins:'1:40:00', get log_run_dist(){ return FREE_MI(); } }],\n"
   "  ['time', { run_mins:'15.333' }, { log_run_mins:'0:15:20', get log_run_dist(){ return FREE_MI(); } }],\n"
   "  // V233 D208 re-rules D200's shipped hours-only clamp to a whole-face peg (tests/measure/v233_rulings/v233_ruling_d207_d211.md); a getter, so VER is read at use.\n"
   "  ['time', { run_mins:'650' }, { get log_run_mins(){ return VER >= 233 ? '9:59:59' : '9:50:00'; }, get log_run_dist(){ return FREE_MI(); } }],\n"
   "  ['time', { run_mins:'7.5' }, { log_run_mins:'0:07:30', get log_run_dist(){ return FREE_MI(); } }],\n"),
  # 6 row labels D203 and D202-open (ids unchanged; rows.js keys on the id)
  ("  'D203': 'row D203 (D203, VER >= 232) dist parse: .86 -> 0 . 8 6; abc, ., -1 -> dash; 3.456 -> 3 4 5; 100 -> 99',\n",
   "  'D203': 'row D203 (D203, VER >= 232) dist parse: .86 -> 0 . 8 6; abc, ., -1 -> dash (VER <= 236) or 0 . 0 0 (VER >= 237, D220); 3.456 -> 3 4 5; 100 -> 99',\n"),
  ("(from VER 235 the free time wheel is on 0:00:00, D215; the free miles wheel stays on the dash); the legacy table opens writing nothing on its hand faces',\n",
   "(from VER 235 the free time wheel is on 0:00:00, D215; the free miles wheel stays on the dash through VER 236 and is on 0.00 from VER 237, D220); the legacy table opens writing nothing on its hand faces',\n"),
  # 7 rowDec3 chooses the table at use
  ("  const t = DEC3.map(([s, w]) => { const g = tryv(() => PARSE('dist', s)); return [s, g, w, J(g) === J(w)]; });\n",
   "  const t = (VER >= 237 ? DEC3_V237 : DEC3).map(([s, w]) => { const g = tryv(() => PARSE('dist', s)); return [s, g, w, J(g) === J(w)]; });\n"),
  # 8 wantFaces: free miles FREE_MI() on the time and reps_time forms
  ("  const wantFaces = (k, dose) => k === 'time' ? { log_run_mins:hmsFace(dose.mins), log_run_dist:DASH_MI } : k === 'dist' ? { log_run_dist:miFace(dose.mi), log_run_mins:FREE_HMS() } : { log_run_dist:DASH_MI };\n",
   "  // V237 (D220): the free miles face is FREE_MI() (dash through 236, 0.00 from 237) on the time and reps_time forms.\n"
   "  const wantFaces = (k, dose) => k === 'time' ? { log_run_mins:hmsFace(dose.mins), log_run_dist:FREE_MI() } : k === 'dist' ? { log_run_dist:miFace(dose.mi), log_run_mins:FREE_HMS() } : { log_run_dist:FREE_MI() };\n"),
  # 9 open-lattice detail text
  ("(VER >= 235 ? 'its blank face (time 0:00:00, miles dash)' : 'the dash')",
   "(VER >= 237 ? 'its blank face (time 0:00:00, miles 0.00)' : VER >= 235 ? 'its blank face (time 0:00:00, miles dash)' : 'the dash')"),
]

E235 = [
  # 1 oracle comment
  ("//   (g232's typed list, unchanged by D217); rendered column lists '0'..'9' (10 rows, no nil row), 300-row minutes and\n"
   "//   seconds, dash-first dist / rept / pace (hand lists); HALF_MANNY digest 2d35e8f743680cfa (printed by the ruling\n",
   "//   (g232's typed list, unchanged by D217; from VER 237 its abc, ., -1 entries land on zero, D220); rendered column lists\n"
   "//   '0'..'9' (10 rows, no nil row), 300-row minutes and seconds, dash-first dist / rept / pace through VER 236 and from\n"
   "//   VER 237 zero-first dist and rept ('0', D220) with pace still dash-first (hand lists); HALF_MANNY digest\n"
   "//   2d35e8f743680cfa (printed by the ruling\n"),
  # 2 ROWS comment D215-rows
  ("//                 1 and 2 are 300 items with data-wrap 1; dist, rept and pace column 0 still begin with '' and carry\n"
   "//                 data-wrap ''.\n",
   "//                 1 and 2 are 300 items with data-wrap 1; dist, rept and pace column 0 still begin with '' and carry\n"
   "//                 data-wrap '' (VER <= 236). From VER 237 (D220; tests/measure/v237_rulings/v237_ruling_d220_d222.md,\n"
   "//                 \"Existing rows this ruling flips\") dist and rept column 0 begin with '0' and carry data-wrap ''; pace\n"
   "//                 still begins with '' (D222).\n"),
  # 3 ROWS comment D217-others
  ("//   D217-others   dist [dash,8,6] -> '', rept [dash,55] -> '', the D203 dist parse table, all unchanged (hand).\n",
   "//   D217-others   dist [dash,8,6] -> '', rept [dash,55] -> '' (the guard stays: a dash value still formats to ''), the\n"
   "//                 D203 dist parse table (hand): abc, ., -1 on the dash through VER 236, on zero from VER 237 (D220).\n"),
  # 4 labels D215-rows and D217-others (ids unchanged)
  ("mm and ss 300 wrapping; dist, rept, pace keep the dash\",\n",
   "mm and ss 300 wrapping; dist, rept, pace keep the dash (VER <= 236); from VER 237 dist and rept begin at 0 (D220), pace keeps the dash\",\n"),
  ("  'D217-others': \"D217-others (VER >= 235) dist [dash,8,6] -> '', rept [dash,55] -> '', the D203 dist parse table, unchanged\",\n",
   "  'D217-others': \"D217-others (VER >= 235) dist [dash,8,6] -> '', rept [dash,55] -> '', the D203 dist parse table (abc, ., -1 on the dash through VER 236, on zero from VER 237, D220)\",\n"),
  # 5 DEC3_V237
  ("const DEC3 = [['.86', ['0', '8', '6']], ['abc', ['', '', '']], ['.', ['', '', '']], ['-1', ['', '', '']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];\n",
   "const DEC3 = [['.86', ['0', '8', '6']], ['abc', ['', '', '']], ['.', ['', '', '']], ['-1', ['', '', '']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];\n"
   "// V237 (D220): a string with no digits at the front lands on zero (no dash row); the numeric rows are DEC3's, unchanged.\n"
   "const DEC3_V237 = [['.86', ['0', '8', '6']], ['abc', ['0', '0', '0']], ['.', ['0', '0', '0']], ['-1', ['0', '0', '0']], ['3.456', ['3', '4', '5']], ['100', ['99', '0', '0']]];\n"),
  # 6 D215-rows dist-dash / rept-dash
  ("  for(const k of ['dist', 'rept', 'pace']){ const c = renderCols(k)[0] || { vals:[] }; cj.push([k + '-dash', c.vals[0] === '' && c.wrap === '', 'col0 first ' + J(c.vals[0]) + ', data-wrap ' + J(c.wrap) + ' (hand \"\", \"\")']); }\n",
   "  // V237 (D220): from VER 237 dist and rept column 0 begins with '0' (no dash row) and still does not wrap; VER <= 236 keeps\n"
   "  // the dash first. Pace keeps its dash on every version (D222). Conjunct names stay.\n"
   "  for(const k of ['dist', 'rept', 'pace']){ const c = renderCols(k)[0] || { vals:[] }; const first = (VER >= 237 && k !== 'pace') ? '0' : '';\n"
   "    cj.push([k + '-dash', c.vals[0] === first && c.wrap === '', 'col0 first ' + J(c.vals[0]) + ', data-wrap ' + J(c.wrap) + ' (hand ' + J(first) + ', \"\")']); }\n"),
  # 7 D217-others dec3-table chooses the table at use
  ("  const t = DEC3.map(([s, w]) => { const r = PARSE('dist', s); return [s, r, w, J(r) === J(w)]; });\n",
   "  const t = (VER >= 237 ? DEC3_V237 : DEC3).map(([s, w]) => { const r = PARSE('dist', s); return [s, r, w, J(r) === J(w)]; });\n"),
]

def apply(path, edits):
    txt = path.read_text(encoding='utf-8')
    for i, (old, new) in enumerate(edits, 1):
        n = txt.count(old)
        if n != 1:
            sys.exit('ABORT %s anchor %d: count %d (want 1): %r' % (path.name, i, n, old[:90]))
        txt = txt.replace(old, new, 1)
        print('  %s anchor %d ok (count 1)' % (path.name, i))
    return txt

out232 = apply(G232, E232)
out235 = apply(G235, E235)
G232.write_text(out232, encoding='utf-8')
G235.write_text(out235, encoding='utf-8')
print('wrote %s (%d anchors), %s (%d anchors)' % (G232.name, len(E232), G235.name, len(E235)))
