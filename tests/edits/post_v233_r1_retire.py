#!/usr/bin/env python3
# Post-V233 tooling pass, retirement slice R1. Tests only: index.html untouched, ia-version stays 233.
#
# RULING (Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, Message 3): "retire the 121 except
# g219's D167 rows ... Amend standing ruling 3 to say a build-scoped claim retires when the next build ships, and the
# previous-version run is its replacement." Evidence: measure mE (tests/measure/v233_rulings/measure_exact_version_mE.md).
#
# Gates in this slice (node tests/version_scope.js --list before this script):
#   g206_d137_runbase_chi.js:166  VER !== D137_ERA                       S4a
#   g207_gk_trial_present.js:237  VER === ERA208, +IB.version === 207    Q6
#   g207_test_week.js:225         VER === 207, +IB.version === 206       B6 B7 B8 B11
#   g207_test_week.js:370         VER === 207                            D12
#   g208_d103a_chip.js:50         VER === ERA, +IB.version === 207/208   B3 C2 D1 (BASE_OK / B3_OK)
#
# Diff classes: (R-a) the exact-version rows above retired with their predicates, the row names in each gate's
# below-era skip list, and every helper / constant / loaded baseline nothing else reads (BASEFILE in g206,
# g207_test_week, g208_chip; IB, BASE_OK, BASE_WHY, BASE_PRE_S3, B3_OK, B3_WHY, V207_LABEL in g208_chip);
# (R-b) the four gates' lines in tests/version_scope_debt.txt deleted (each gate goes to 0 hits).
# Every anchor is asserted count == 1 before anything is written; the first miss aborts the whole script.
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = os.path.join(ROOT, 'tests', 'gates')
DEBT = os.path.join(ROOT, 'tests', 'version_scope_debt.txt')
RET = 'retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).'

EDITS = {
'g206_d137_runbase_chi.js': [
  # BASEFILE: read only by S4a
  ("const BASEFILE = process.argv[3] || null;\nconst IA = load(ART);\n",
   "const IA = load(ART);\n"),
  ("const ROWS = ['S1a','S1b','S1c','S1d','S2a','S2b','S2c','S3','S4a','S4b','S4c'];\n",
   "const ROWS = ['S1a','S1b','S1c','S1d','S2a','S2b','S2c','S3','S4b','S4c'];\n"),
  ("""// S4a — unmoved against the baseline, scoped to the D137 build pair only.
if(!BASEFILE){
  skipRow('S4a no baseline passed as argv[3]; the D137 pair diff did not run (S4b and S4c still stand)');
} else {
  const IB = load(BASEFILE);
  if(VER !== D137_ERA || +IB.version !== D137_ERA - 1){
    skipRow('S4a scoped to the D137 build pair (candidate 206 vs baseline 205); this pair is ' + VER + ' vs ' + IB.version);
  } else {
    const a = seriesOf(IA.buildProgram(prt()), isRunCHI, chiDose), b = seriesOf(IB.buildProgram(prt()), isRunCHI, chiDose);
    ok('S4a PRT TING (run_pace_goal, 11 weeks, evented) CHI series is identical to the V205 baseline: ' + b.join(' '),
       a.length === 11 && JSON.stringify(a) === JSON.stringify(b), a.join(' '));
  }
}
""",
   "// S4a (D137: PRT TING's CHI series unmoved against the V205 baseline) " + RET + "\n"),
],
'g207_gk_trial_present.js': [
  ("QROWS = ['Q0','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q9x'];\n",
   "QROWS = ['Q0','Q1','Q2','Q3','Q4','Q5','Q7','Q8','Q9','Q9x'];\n"),
  ("""// Q6: NRC eves (T-2 through race day, flattened across the week boundary) byte-identical to V207.
{
  const BASEFILE = process.argv[3] || null;
  if(!BASEFILE) console.log('SKIP Q6 no baseline passed as argv[3]; the NRC eve diff did not run');
  else {
    const IB = load(BASEFILE);
    if(!(VER === ERA208 && +IB.version === 207)) console.log('SKIP Q6 scoped to the V208 slice 0 build pair (candidate 208 vs baseline 207); this pair is ' + VER + ' vs ' + IB.version);
    else {
      const nrcBase = Object.assign({}, IA.fixtures.HALF_MANNY, {restDays:['sun'], seed:76308});
      const RACE = {run_5k:['2026-11-19','2026-11-22'], run_half:['2026-12-26','2026-12-28']};
      const window = q => { const tw = q.totalWeeks, fl = []; [tw - 1, tw].forEach(w => { if(q.weeks[w]) DAYS.forEach(d => fl.push(q.weeks[w][d] || null)); });
        const ri = fl.findIndex(x => x && x.cardio && /RACE DAY|TIME TRIAL/i.test(x.cardio.subtype || '')); return ri < 0 ? null : fl.slice(Math.max(0, ri - 2), ri + 1); };
      let n = 0, shk = 0; const moved = [];
      for(const g of Object.keys(RACE)) for(const rd of RACE[g]) for(const T of [['run'], ['run','bike']]) for(const R of [['sun'], ['sun','wed'], ['sat','sun']]){
        const cfg = Object.assign({}, nrcBase, {cardioTypes:T, restDays:R, eventTargeted:true, raceDate:rd,
          cardioGoals:Object.assign({run:{id:g, label:g}}, T.includes('bike') ? {bike:{id:'bike_base', label:'Bike'}} : {})});
        let a, b; try { a = window(IA.buildProgram(clone(cfg))); } catch(e){ a = 'CRASH ' + e.message; }
        try { b = window(IB.buildProgram(clone(cfg))); } catch(e){ b = 'CRASH ' + e.message; }
        n++; if(Array.isArray(a)) shk += a.filter(x => x && x.title === 'Shakeout').length;
        if(!Array.isArray(a) || canon(a) !== canon(b)) moved.push(g + ' ' + rd + ' ' + T.join('+') + ' [' + R + ']' + (Array.isArray(a) ? '' : ' ' + a));
      }
      ok('Q6 NRC eves: ' + n + ' dated run_5k and run_half builds, T-2 through race day byte-equal to V207 (' + shk + ' Shakeout eves seen)', moved.length === 0 && shk > 0, moved.length + ' moved: ' + moved.slice(0, 3).join('; '));
    }
  }
}
""",
   "// Q6 (the D106a fix-forward, V208 slice 0: NRC eves byte-equal to the V207 baseline) " + RET + "\n"),
],
'g207_test_week.js': [
  # BASEFILE: read only by B6-B11 and D12
  ("const BASEFILE = process.argv[3] || null;\nconst IA = load(ART);\n",
   "const IA = load(ART);\n"),
  ("  'T1..T8 (a hand series, b Taper set, c dip set, f finite)','B6','B7','B8','B11',\n"
   "  'D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12',\n",
   "  'T1..T8 (a hand series, b Taper set, c dip set, f finite)',\n"
   "  'D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11',\n"),
  ("""// ── B — no move at six weeks and up, scoped to the D106a build pair ───────────────────
const BROWS = [['B6', 6], ['B7', 7], ['B8', 8], ['B11', null]];
if(!BASEFILE){ for(const [r] of BROWS) skipRow(r + ' no baseline passed as argv[3]; the D106a pair diff did not run'); }
else {
  const IB = load(BASEFILE);
  if(!(VER === 207 && +IB.version === 206)){
    for(const [r] of BROWS) skipRow(r + ' scoped to the D106a build pair (candidate 207 vs baseline 206); this pair is ' + VER + ' vs ' + IB.version);
  } else for(const [r, tw] of BROWS){
    const cfg = tw ? pinned({_raceDateCappedWeeks:tw}) : pinned();   // length pin only (see SCOPING)
    let a, b; try { a = JSON.stringify(IA.buildProgram(JSON.parse(JSON.stringify(cfg))).weeks); } catch(e){ a = 'CRASH ' + e.message; }
    try { b = JSON.stringify(IB.buildProgram(JSON.parse(JSON.stringify(cfg))).weeks); } catch(e){ b = 'CRASH ' + e.message; }
    ok(r + ' ' + (tw ? tw + '-week' : 'unpinned 11-week') + ' PRT TING weeks byte-equal to the V206 baseline', a === b && !/^CRASH/.test(a), a.length + ' vs ' + b.length + ' bytes');
  }
}
""",
   "// B6 B7 B8 B11 (D106a: PRT TING at 6, 7, 8 and 11 weeks byte-equal to the V206 baseline) " + RET + "\n"),
  ("""if(!BASEFILE){ skipRow('D12 no baseline passed as argv[3]; the NRC confinement diff did not run'); }
else {
  const IB2 = load(BASEFILE);
  if(!(VER === 207 && +IB2.version === 206)) skipRow('D12 scoped to the D106a build pair (candidate 207 vs baseline 206); this pair is ' + VER + ' vs ' + IB2.version);
  else {
    const RACE = {run_5k:'2026-11-19', run_10k:'2026-11-21', run_half:'2026-12-26', run_marathon:'2027-01-24'};
    let n = 0; const moved = [];
    for(const g of Object.keys(RACE)) for(const T of [['run'], ['run','bike'], ['run','swim']]) for(const R of [['sun'], ['sun','wed']]) for(const evt of [true, false]){
      const cfg = Object.assign({}, nrcBase, {cardioTypes:T, restDays:R, eventTargeted:evt, raceDate: evt ? RACE[g] : '',
        cardioGoals: Object.assign({run:{id:g, label:g}}, T.includes('bike') ? {bike:{id:'bike_base', label:'Bike'}} : {}, T.includes('swim') ? {swim:{id:'swim_base', label:'Swim'}} : {})});
      let a, b; try { a = JSON.stringify(IA.buildProgram(JSON.parse(JSON.stringify(cfg))).weeks); } catch(e){ a = 'CRASH ' + e.message; }
      try { b = JSON.stringify(IB2.buildProgram(JSON.parse(JSON.stringify(cfg))).weeks); } catch(e){ b = 'CRASH ' + e.message; }
      n++; if(a !== b || /^CRASH/.test(a)) moved.push(g + ' ' + T.join('+') + ' [' + R + '] ' + evt);
    }
    ok('D12 NRC confinement: ' + n + ' NRC builds (4 goals x run, run+bike, run+swim x 2 rest sets x dated/undated) byte-equal to V206', moved.length === 0, moved.length + ' moved: ' + moved.slice(0, 3).join('; '));
  }
}
""",
   "// D12 (D106a: NRC confinement, NRC builds byte-equal to the V206 baseline) " + RET + "\n"),
],
'g208_d103a_chip.js': [
  # BASEFILE, IB and the baseline predicates: read only by B3, C2 and D1
  ("const BASEFILE = process.argv[3] || null;\nconst IA = load(ART);\n",
   "const IA = load(ART);\n"),
  ("""const IB = BASEFILE ? load(BASEFILE) : null;
const BASE_OK = !!IB && VER === ERA && (+IB.version === 207 || +IB.version === 208);
const BASE_WHY = !IB ? 'no baseline passed as argv[3]' : 'baseline ia-version ' + IB.version + ' is neither V207 nor the V208 pre-slice tree';
const BASE_PRE_S3 = !!BASEFILE && /function runSessionCode\\(sub\\)\\{/.test(require('fs').readFileSync(BASEFILE, 'utf8'));
const B3_OK = BASE_OK && BASE_PRE_S3;
const B3_WHY = !BASE_OK ? BASE_WHY : 'baseline ia-version ' + IB.version + ' already carries slice 3\\'s runSessionCode(sub, key), so it is not the pre-slice tree B3 was written against';
""",
   ""),
  # V207_LABEL: read only by B3 and D1
  ("""// The rename as a hand table (slice 4a): the label V207 printed for a run session printed today. The
// head moves; every suffix (Taper, re-entry) stays. Any other label is its own V207 label.
const V207_LABEL = s => String(s || '').replace(/^Long Interval \\(LI\\)/, 'Continuous High Intensity (CHI)').replace(/^Short Interval \\(SI\\)/, 'Interval (INT)');
""",
   ""),
  ("""  if(!B3_OK) skip('B3 ' + B3_WHY);
  else { const CB = IB.eval('runSessionCode'); const moved = {}; let n = 0;
    nsw.forEach(({c}) => { const a = chipDay(c), b = CB(V207_LABEL(c.subtype)); if(a !== b){ n++; const k = keyOf(c) + ': ' + b + ' -> ' + a; moved[k] = (moved[k] || 0) + 1; } });
    const RULED = ['trial: RUN -> TEST', 'chi: CHI -> LI', 'int: INT -> SI'];
    ok(`B3 against the baseline reading the label V207 printed, the only chips that move are the ruled three: the test RUN to TEST, the CHI to LI, the INT to SI (${n} moved: ${Object.keys(moved).map(k => k + ' x' + moved[k]).join(', ') || 'none'})`,
       Object.keys(moved).every(k => RULED.includes(k)) && RULED.every(k => (moved[k] || 0) > 0), JSON.stringify(moved)); }
""",
   "  // B3 (D103a slice 3: against the V207 baseline only the ruled chips move) " + RET + "\n"),
  ("""  if(!BASE_OK) skip('C2 ' + BASE_WHY);
  else { const CB = IB.eval('runSessionCode'); const seen = new Set(), moved = [];
    unkeyed.forEach(({c}) => { const s = c.subtype || ''; if(seen.has(c.type + s)) return; seen.add(c.type + s);
      if(chipDay(c) !== DAYCODE_B(c)) moved.push(c.type + ' "' + s + '" ' + DAYCODE_B(c) + ' -> ' + chipDay(c)); });
    function DAYCODE_B(c){ return IB.eval('dayCode')({title:'', tags:[], sections:[], cardio:c}).bot; }
    ok(`C2 every unkeyed card (NRC run, bike, swim, protected and walk rewrites) wears the baseline's chip (${seen.size} distinct strings)`, seen.size > 0 && moved.length === 0, moved.length + ': ' + moved.slice(0, 3).join('; ')); }
""",
   "  // C2 (D103a slice 3: every unkeyed card wears the baseline's chip) " + RET + "\n"),
  ("""if(!BASE_OK) skip('D1 ' + BASE_WHY);
else { const RB = IB.eval('_runClass'); const seen = new Set(), moved = [];
  cards.filter(({c}) => c.type === 'run').forEach(({c}) => { const s = c.subtype || ''; if(seen.has(s)) return; seen.add(s); const o = V207_LABEL(s); if(RC(s) !== RB(o)) moved.push('"' + s + '" (V207 "' + o + '") ' + RB(o) + ' -> ' + RC(s)); });
  ok(`D1 every run label printed today keeps the history class the baseline gives the label V207 printed for it, so no history splits across the rename (${seen.size} distinct run subtypes)`, seen.size > 0 && moved.length === 0, moved.length + ': ' + moved.slice(0, 3).join('; ')); }
""",
   "// D1 (D103a slice 3: every run label keeps the V207 baseline's history class) " + RET + "\n"),
],
}

# (R-b) debt lines: every gate in this slice goes to 0 hits, so its line is deleted.
DEBT_LINES = [
  'g206_d137_runbase_chi.js 1  # 1 rows, mE classes 0/1/0\n',
  'g207_gk_trial_present.js 2  # 1 rows, mE classes 0/1/0\n',
  'g207_test_week.js 3  # 5 rows, mE classes 0/5/0\n',
  'g208_d103a_chip.js 3  # 3 rows, mE classes 0/3/0\n',
]

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

# 1. read every gate and assert every anchor count == 1 against the progressively edited text
out = {}
for fn, eds in EDITS.items():
    p = os.path.join(G, fn)
    s = open(p, encoding='utf-8').read()
    for k, (a, r) in enumerate(eds):
        n = s.count(a)
        if n != 1:
            die(f'{fn} edit {k}: anchor count={n}: {a[:80]!r}')
        s = s.replace(a, r)
    out[fn] = s
for L in DEBT_LINES:   # pre-check, so a debt miss aborts before any gate is written
    n = open(DEBT, encoding='utf-8').read().count(L)
    if n != 1:
        die(f'debt line count={n}: {L!r}')

# 2. write the gates
for fn, s in out.items():
    open(os.path.join(G, fn), 'w', encoding='utf-8').write(s)
    print('wrote tests/gates/' + fn)

# 3. debt file: re-read immediately before writing (another builder edits other lines of it)
d = open(DEBT, encoding='utf-8').read()
for L in DEBT_LINES:
    n = d.count(L)
    if n != 1:
        die(f'debt line count={n}: {L!r} (gates already written; fix the debt file by hand against version_scope.js)')
    d = d.replace(L, '')
open(DEBT, 'w', encoding='utf-8').write(d)
print('wrote tests/version_scope_debt.txt (-%d lines)' % len(DEBT_LINES))
