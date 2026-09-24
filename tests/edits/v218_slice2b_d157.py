#!/usr/bin/env python3
# V218 slice 2b — D157 tests only (coach's label oracle, slice 2a). index.html is read, never written.
# E1  g218: L1 compares the sizer warning byte for byte (label normalisation dropped) and its label count
#     becomes an assertion; new rows LB1 (pace line + initial render == twin), LB2 (hand m:ss oracle, the
#     gate's own formatter, never _clkMS), OT1 (odd typed forms print their total, the class coach accepted),
#     Z2 (zero-total target hidden on both renders, sizer on the volume path), LB3 (pair only: canonical m:ss
#     labels at all three sites byte-identical to V217, git 7af6ad9).
# E2  sabotage v218_d157.json: S3 reverts slice 2a E6 (sizer label concatenated again), S4 reverts slice 2a
#     E5's display gate to the minutes box.
import sys, json
G = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g218_d157_swim_sizer.js'
J = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v218_d157.json'
H = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
gate = open(G, encoding='utf-8').read()
spec = open(J, encoding='utf-8').read()
html = open(H, encoding='utf-8').read()

S3_ANCHOR = "var sTimeLbl = _clkMS(tTotal);"
S3_REPL = "var sTimeLbl = (goal.targetMins||0)+':'+(String(goal.targetSecs||0).padStart(2,'0'));"
S4_ANCHOR = "display:${(((+g.targetMins||0)*60)+(+g.targetSecs||0))>0?'block':'none'}"
S4_REPL = "display:${(g.targetMins!==undefined&&g.targetMins!=='')?'block':'none'}"
for nm, a in (('S3', S3_ANCHOR), ('S4', S4_ANCHOR)):
    n = html.count(a)
    if n != 1:
        print('ABORT: sabotage anchor %s count %d in index.html' % (nm, n)); sys.exit(2)

LABEL_BLOCK = r"""// ── LB1 / LB2 / OT1 / Z2 / LB3: every swim target label reads the total (coach, slice 2a) ─────
{ const hand = s => { const t = Math.round(s), r = t % 60; return Math.floor(t / 60) + ':' + (r < 10 ? '0' : '') + r; };   // m:ss by hand, never _clkMS
  const DIST = { swim_100_time:100, swim_500_time:500 };
  const CUR = { swim_100_time:{ baseMins:'2', baseSecs:'0', base500Mins:'10', base500Secs:'0' }, swim_500_time:{ baseMins:'12', baseSecs:'0' } };
  function lvm(file){ const IA = load(file); const els = new Map(); const mk = IA.window.document.createElement;
    IA.window.document.getElementById = id => { if(!els.has(id)){ const e = mk('div'); e.id = id; els.set(id, e); } return els.get(id); }; IA.els = els; return IA; }
  const CL = lvm(ART), BL = PAIR ? lvm(V217FILE) : null;
  const strip = h => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const W = (IA, g) => { IA.els.clear(); IA.window.__G = g; IA.eval('WD={cardioTypes:["swim"],cardioGoals:{swim:JSON.parse(JSON.stringify(__G))}}; updateSwimPaceDisplay();');
    const el = IA.els.get('swimPaceLine'), raw = el ? String(el.innerHTML || '') : ''; return { disp:el ? String(el.style.display || '') : 'MISSING', raw, txt:strip(raw) }; };
  const R = (IA, g) => { IA.els.clear(); IA.window.__G = g;
    IA.eval('WD={primaryPath:"goal",cardioTypes:["swim"],experience:"advanced",ageBracket:"18-35",eventTargeted:false,liftingFocus:"support_prevention",equipment:"crossfit",restDays:["sun","wed"],unit:"lbs",seed:76308,name:"S",cardioGoals:{swim:JSON.parse(JSON.stringify(__G))}}; wizardStep=WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep();');
    const m = String(IA.els.get('wizardBody').innerHTML || '').match(/<div id="swimPaceLine"[^>]*display:([a-z]+)[^>]*>([\s\S]*?)<\/div>/);
    return m ? { disp:m[1], raw:m[0], txt:strip(m[2]) } : { disp:'MISSING', raw:'', txt:'' }; };
  const expTxt = (t, goal, unit) => hand(t) + ' — ' + hand(t * 100 / DIST[goal]) + '/100 (' + unit + ')';
  const expLbl = (t, goal, unit) => ' (' + hand(t) + '/' + DIST[goal] + unit + ') needs ';
  const ex = (o, s) => { if(o.ex.length < 3) o.ex.push(s); };
  // LB1 + LB2: seconds-only targets against their twins; twins against the hand formatter
  const PT = { swim_100_time:[30,45,55,59,60,65,75,90,119,120,150], swim_500_time:[240,300,330,420,540,599,600,660,900] };
  const A = { n:0, bad:0, ex:[] }, K = { n:0, bad:0, ex:[] };
  for(const goal of Object.keys(PT)) for(const unit of ['yd','m']) for(const t of PT[goal]){
    const mk = form => put(Object.assign({ id:goal, label:goal, swimUnit:unit }, CUR[goal]), 'target', t, form);
    const tw = { W:W(CL, mk('mss')), R:R(CL, mk('mss')) }, e = expTxt(t, goal, unit), wl = len(LC, mk('mss'), 'intermediate', '18-35').warning;
    for(const s of ['W','R']){ K.n++; if(!(tw[s].disp === 'block' && tw[s].txt === e)){ K.bad++; ex(K, s + ' ' + goal + ' ' + unit + ' ' + t + 's ' + tw[s].disp + ' "' + tw[s].txt + '" vs "' + e + '"'); } }
    K.n++; if(!String(wl).includes(expLbl(t, goal, unit))){ K.bad++; ex(K, 'sizer ' + goal + ' ' + unit + ' ' + t + 's "' + wl + '"'); }
    for(const form of ['undef','empty']) for(const s of ['W','R']){ A.n++; const x = (s === 'W' ? W : R)(CL, mk(form));
      if(!(x.disp === tw[s].disp && x.txt === tw[s].txt)){ A.bad++; ex(A, s + ' ' + goal + ' ' + unit + ' ' + t + 's ' + form + ' ' + x.disp + ' "' + x.txt + '" vs twin ' + tw[s].disp + ' "' + tw[s].txt + '"'); } } }
  ok('LB1 pace line + initial render: ' + (A.n - A.bad) + '/' + A.n + ' seconds-only targets (>= 60 s included, box untouched or "") show the m:ss twin\'s display and text' + (A.ex.length ? ' e.g. ' + A.ex.join('; ') : ''), A.n === 160 && A.bad === 0);
  ok('LB2 hand m:ss oracle: ' + (K.n - K.bad) + '/' + K.n + ' twin labels (pace line, initial render, sizer warning) read hand(total) and hand(pace)/100' + (K.ex.length ? ' e.g. ' + K.ex.join('; ') : ''), K.n === 120 && K.bad === 0);
  // OT1: odd typed forms print their total (coach accepted, slice 2a)
  const OT = [['01','15'],['00','55'],['1.5','0'],['1','30.5'],['1','75']], O = { n:0, bad:0, ex:[] };
  for(const goal of Object.keys(DIST)) for(const [m, s] of OT){ const g = Object.assign({ id:goal, label:goal, swimUnit:'yd', targetMins:m, targetSecs:s }, CUR[goal]);
    const tot = (+m || 0) * 60 + (+s || 0), e = expTxt(tot, goal, 'yd'), wl = len(LC, g, 'intermediate', '18-35').warning;
    for(const [nm, x] of [['W', W(CL, g)], ['R', R(CL, g)]]){ O.n++; if(!(x.disp === 'block' && x.txt === e)){ O.bad++; ex(O, nm + ' ' + goal + ' "' + m + '":"' + s + '" ' + x.disp + ' "' + x.txt + '" vs "' + e + '"'); } }
    O.n++; if(!String(wl).includes(expLbl(tot, goal, 'yd'))){ O.bad++; ex(O, 'sizer ' + goal + ' "' + m + '":"' + s + '" "' + wl + '"'); } }
  ok('OT1 odd typed forms print their total at all three sites ("01:15" -> 1:15, "00:55" -> 0:55, "1.5:00" -> 1:30, "1:30.5" -> 1:31, "1:75" -> 2:15): ' + (O.n - O.bad) + '/' + O.n + (O.ex.length ? ' e.g. ' + O.ex.join('; ') : ''), O.n === 30 && O.bad === 0);
  // Z2: zero-total target
  const ZT = [{ targetMins:'0', targetSecs:'0' }, { targetMins:'0', targetSecs:'' }, { targetMins:'', targetSecs:'0' }, { targetMins:'', targetSecs:'' }, { targetSecs:'0' }];
  const Z = { n:0, bad:0, ex:[], nul:0, cfg:0 };
  for(const goal of Object.keys(DIST)) for(const unit of ['yd','m']) for(const z of ZT){
    const absent = Object.assign({ id:goal, label:goal, swimUnit:unit }, CUR[goal]), g = Object.assign({}, absent, z), w = W(CL, g), r = R(CL, g);
    const lz = len(LC, g, 'advanced', '18-35'), la = len(LC, absent, 'advanced', '18-35'); Z.n += 3; Z.cfg++; if(lz.warning === null) Z.nul++;
    if(w.disp !== 'none'){ Z.bad++; ex(Z, 'W ' + goal + ' ' + unit + ' ' + JSON.stringify(z) + ' ' + w.disp + ' "' + w.txt + '"'); }
    if(r.disp !== 'none'){ Z.bad++; ex(Z, 'R ' + goal + ' ' + unit + ' ' + JSON.stringify(z) + ' ' + r.disp + ' "' + r.txt + '"'); }
    if(!(lz.weeks === la.weeks && lz.warning === la.warning && !/\(\d+:\d+\//.test(String(lz.warning || '')))){ Z.bad++; ex(Z, 'sizer ' + goal + ' ' + unit + ' ' + JSON.stringify(z) + ' ' + lz.weeks + 'wk "' + lz.warning + '" vs absent ' + la.weeks + 'wk "' + la.warning + '"'); } }
  ok('Z2 zero-total target: ' + (Z.n - Z.bad) + '/' + Z.n + ' (pace line hidden, initial render hidden, sizer == target absent with no time warning; warning null on ' + Z.nul + '/' + Z.cfg + ' advanced 18-35 configs)' + (Z.ex.length ? ' e.g. ' + Z.ex.join('; ') : ''), Z.n === 60 && Z.bad === 0 && Z.nul === Z.cfg);
  // LB3: canonical m:ss labels byte-identical to V217 (pair only)
  if(PAIR){ const MINS = [...Array(16).keys()].concat([20, 30, 45, 99]); const P = { n:0, W:0, R:0, S100:0, S500:0, ex:[] };
    for(const m of MINS) for(let s = 0; s < 60; s++) for(const sf of (s < 10 ? [String(s), '0' + s] : [String(s)])){ if(m === 0 && s === 0) continue; P.n++;
      const t = { targetMins:String(m), targetSecs:sf };
      const g1 = Object.assign({ id:'swim_100_time', label:'Improve 100 Time', swimUnit:'yd', baseMins:'1', baseSecs:'30', base500Mins:'8', base500Secs:'0' }, t);
      const g5 = Object.assign({ id:'swim_500_time', label:'Improve 500 Time', swimUnit:'yd', baseMins:'9', baseSecs:'0' }, t);
      const a = W(BL, g1), b = W(CL, g1); if(a.disp !== b.disp || a.raw !== b.raw){ P.W++; ex(P, 'W ' + m + ':' + sf + ' "' + a.txt + '" -> "' + b.txt + '"'); }
      const c = R(BL, g1), d = R(CL, g1); if(c.raw !== d.raw){ P.R++; ex(P, 'R ' + m + ':' + sf + ' "' + c.txt + '" -> "' + d.txt + '"'); }
      for(const [k, g] of [['S100', g1], ['S500', g5]]){ const x = len(LB, g, 'advanced', '18-35'), y = len(LC, g, 'advanced', '18-35');
        if(x.weeks !== y.weeks || x.warning !== y.warning){ P[k]++; ex(P, k + ' ' + m + ':' + sf + ' "' + x.warning + '" -> "' + y.warning + '"'); } } }
    ok('LB3 twin byte-compat vs V217 (git 7af6ad9): ' + P.n + ' canonical m:ss targets; differing pace line ' + P.W + ', initial render ' + P.R + ', sizer 100 ' + P.S100 + ', sizer 500 ' + P.S500 + (P.ex.length ? ' e.g. ' + P.ex.join('; ') : ''),
      P.n === 1398 && P.W + P.R + P.S100 + P.S500 === 0);
  } else skipRow('LB3 m:ss label byte-compat vs V217 (pair only)'); }

"""

DOC_RULING = r"""//   LB1  pace line (updateSwimPaceDisplay) and initial render (renderWizardStep, swimPaceLine): every seconds-only
//        target (minutes box untouched or "", 30 s to 900 s, >= 60 s included) x 100 / 500 x yd / m shows the m:ss
//        twin's display and text.
//   LB2  HAND m:ss oracle (the gate's own formatter, never _clkMS): each twin's pace line and initial render read
//        "<m:ss total> — <m:ss total*100/dist>/100 (<unit>)"; its sizer warning carries " (<m:ss total>/<dist><unit>) needs ".
//   OT1  CLASS (coach, accepted in slice 2a, one class with "0:75"): typed forms that are not canonical m:ss print their
//        TOTAL at all three sites, where V217 echoed the raw boxes: "01:15" -> 1:15, "00:55" -> 0:55, "1.5:00" -> 1:30,
//        "1:30.5" -> 1:31, "1:75" -> 2:15. Program length is unchanged by the label.
//   Z2   zero-total target ("0"/"0", "0"/"", ""/"0", ""/"", secs "0" alone): the pace line and the initial render are
//        hidden (V217's initial render showed "0:00"), and the sizer takes the volume path with no time warning
//        (== target absent; null on every advanced 18-35 config here).
"""
DOC_PAIR = r"""//   LB3  twin byte-compat: 1,398 canonical m:ss targets (minutes 0-15, 20, 30, 45, 99 x every second, seconds typed
//        "5" and "05", 0:00 excluded): the pace line innerHTML, the rendered swimPaceLine div, and the 100 / 500 sizer
//        warnings are byte-identical to V217.
"""

GATE_EDITS = [
  ("//          (time label normalised) and its full prog.weeks equal the twin's, on the candidate itself.",
   "//          (byte for byte, time label included) and its full prog.weeks equal the twin's, on the candidate itself."),
  ("every entry's weeks and normalised warning == twin.",
   "every entry's weeks and warning == twin, byte for byte;\n//        the count of warnings whose time label differs from the twin's is asserted 0 (no normalisation)."),
  ("// ROWS (pair, V217 -> 218 only; SKIP by name on every other version, standing ruling 4)\n",
   DOC_RULING + "// ROWS (pair, V217 -> 218 only; SKIP by name on every other version, standing ruling 4)\n"),
  ("//   below 218: NOT APPLICABLE, every row skipped by name, clean exit.\n",
   DOC_PAIR + "//   below 218: NOT APPLICABLE, every row skipped by name, clean exit.\n"),
  ("const ROWS = ['U1','L1','L2','Z1','ST1','F0','U2','C1','C2','ST2','HM'];",
   "const ROWS = ['U1','L1','L2','Z1','ST1','LB1','LB2','OT1','Z2','F0','U2','C1','C2','ST2','HM','LB3'];"),
  (r"""const norm = w => String(w).replace(/\(\d+:\d+\/(\d+)(yd|m)\)/g, '(T/$1$2)');
const lenEq = (a, b) => a.weeks === b.weeks && norm(a.warning) === norm(b.warning);""",
   "const lenEq = (a, b) => a.weeks === b.weeks && a.warning === b.warning;   // byte for byte: the label reads the total (slice 2a)"),
  ("""  console.log('  INFO L1 seconds-only entries whose warning time label differs from the twin (typed secs >= 60, e.g. "0:75"): ' + L.lbl + ' (D157 rules the clock, not the label; not asserted)');""",
   """  ok('L1 labels: ' + L.lbl + ' seconds-only sizer warnings differ from the m:ss twin\\'s byte for byte (0; no normalisation, the label reads the total)', L.lbl === 0);"""),
  ("// ── ST1 / ST2: a stored seconds-only program",
   LABEL_BLOCK + "// ── ST1 / ST2: a stored seconds-only program"),
]
for i, (a, b) in enumerate(GATE_EDITS):
    n = gate.count(a)
    if n != 1:
        print('ABORT: gate anchor %d count %d: %r' % (i, n, a[:80])); sys.exit(2)

TAIL = 'Needs ia-version >= 218."\n }\n]'
if spec.count(TAIL) != 1:
    print('ABORT: spec tail count %d' % spec.count(TAIL)); sys.exit(2)
S3 = {"name": "S3-D157 -> the sizer warning label is concatenated from the boxes again: a seconds-only 75 s target prints \"(0:75/100yd)\" where its twin prints \"(1:15/100yd)\", and \"01:15\" prints \"01:15\"",
      "anchor": S3_ANCHOR, "replacement": S3_REPL, "gate": "gates/g218_d157_swim_sizer.js",
      "note": "NAMED TRIP in g218_d157_swim_sizer.js rows L1 (warnings compared byte for byte; the label row counts the >= 60 s targets) and OT1 (sizer label of the odd typed forms). Reverts slice 2a E6. Needs ia-version >= 218."}
S4 = {"name": "S4-D157 -> the initial render's pace line display keys on the minutes box again: a seconds-only target renders hidden, and a typed \"0\" minutes box with 0 seconds renders \"0:00\"",
      "anchor": S4_ANCHOR, "replacement": S4_REPL, "gate": "gates/g218_d157_swim_sizer.js",
      "note": "NAMED TRIP in g218_d157_swim_sizer.js rows LB1 (initial render display differs from the twin) and Z2 (a \"0\" minutes box renders the line). OT1 does not trip: every odd typed form fills the minutes box, so the reverted gate still shows it. Reverts slice 2a E5's display gate only; the label half of E5 stays. Needs ia-version >= 218."}
add = ',\n' + ',\n'.join(' ' + json.dumps(m, indent=1, ensure_ascii=False).replace('\n', '\n ') for m in (S3, S4))
spec2 = spec.replace(TAIL, 'Needs ia-version >= 218."\n }' + add + '\n]', 1)
rows = json.loads(spec2)
if len(rows) != 4 or [r['anchor'] for r in rows[2:]] != [S3_ANCHOR, S4_ANCHOR]:
    print('ABORT: spec post-condition'); sys.exit(3)

for a, b in GATE_EDITS:
    gate = gate.replace(a, b, 1)
if 'norm(' in gate or 'INFO L1' in gate or gate.count("ok('LB3 twin byte-compat") != 1:
    print('ABORT: gate post-condition'); sys.exit(3)
open(G, 'w', encoding='utf-8').write(gate)
open(J, 'w', encoding='utf-8').write(spec2)
print('applied E1 (gate, %d anchors) and E2 (spec S3, S4)' % len(GATE_EDITS))
