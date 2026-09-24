// g218_d157_swim_sizer.js — GATE for D157 (coach): THE SIZER READS THE SAME CLOCK AS THE ENGINE.
//
//   node tests/gates/g218_d157_swim_sizer.js [candidate] [baseline V217]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   D157  calcProgramLength's two swim-time gates keyed on the MINUTES box (target: goal.targetMins !== undefined
//         && !== ''; current: goal.baseMins !== undefined && !== ''), while the engine (buildSwimSession, D110a)
//         keys on the TOTAL. Blank or "0" minutes with "55" seconds is 55 seconds. Both gates read the total with
//         the engine's parse (+m||0)*60+(+s||0) > 0. A 0:00 falls to the volume path (target) or the experience
//         default (current). The arithmetic after each gate already read the total and is untouched.
//         Surgery reference: tests/measure/v218_d157_swim_sizer.js anchors A1/R1, A2/R2.
//
// ORACLES, independent of the sizer:
//   D110a  a swim time is minutes*60 + seconds of what was typed, and it is entered when that total is > 0.
//   TWIN   every seconds-only entry (minutes box untouched, or cleared to "") has an m:ss twin with the same total
//          ("0"+"55", or "1"+"15" for a typed "75"). Same clock, same program: the entry's length, its warning
//          (byte for byte, time label included) and its full prog.weeks equal the twin's, on the candidate itself.
//   ABSENT a 0:00 field sizes exactly as that field absent (the sizer's own fallback): volume for the target,
//          the experience default for the current time.
//   HAND   the unit row by hand: gap 59 - 55 = 4 s/100; advanced safe gain 2 s/100/week at 18-35 (scale 1);
//          ceil(4/2) = 2; round(2 x 1.25) + 4 = 7; age multiplier 1; inside floor 6 / cap 10 -> "needs 7 weeks".
//   STORE  a program generated on V217 (git 7af6ad9) and written to ia_programs is the record; the candidate's
//          boot of that storage is compared to the stored record and to V217's boot of the same storage.
//   V217   argv[3] when it reads 217, else git 7af6ad9 (never HEAD). Clock pinned (Mon 7 Sep 2026 to generate,
//          Thu 24 Sep 2026 to boot), seed pinned, V217 boot proven equal to itself before any comparison.
//
// ROWS (ruling-level, 218 and up)
//   U1   unit row: swim_100_time, advanced, 18-35, yd, seed 76308, rest sun/wed, target _:55, current _:59,
//        500 5:30. Sizer warning "100 Time (0:55/100yd) needs 7 weeks" (HAND); sizer weeks and full-build
//        totalWeeks equal the m:ss twin's; full prog.weeks equal the twin's.
//   L1   lattice via calcProgramLength: swim_100_time / swim_500_time x 3 experience x 3 ages x times x 8 seconds-only
//        forms (target / current / both, box untouched or ""): every entry's weeks and warning == twin, byte for byte;
//        the count of warnings whose time label differs from the twin's is asserted 0 (no normalisation).
//   L2   lattice via buildProgram: 2 goals x 3 experience x 2 ages x 2 time pairs x 4 forms x swim / run+swim:
//        totalWeeks and prog.weeks == twin; buildProgram leaves every cfg byte-identical.
//   Z1   0:00 entries ("0"/"0", "0"/"", ""/"0", ""/"", secs "0" alone) size exactly as the field absent, and a
//        zero target prints no time label.
//   ST1  stored program: the unit entry generated on V217 stores 7 weeks with cfg._raceDateCappedWeeks 7; the
//        candidate's fresh generate of the same entry sizes 8 (D157 reaches it); the candidate's boot of the stored
//        program keeps totalWeeks 7, and every trained day equals its ia_hist_ snapshot.
//   LB1  pace line (updateSwimPaceDisplay) and initial render (renderWizardStep, swimPaceLine): every seconds-only
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
// ROWS (pair, V217 -> 218 only; SKIP by name on every other version, standing ruling 4)
//   F0   V217 before-picture (measure): the unit entry sizes 7 weeks with no swim warning; L1 and L2 seconds-only
//        entries that V217 sized off the twin: > 0 each. So U1/L1/L2 can fail.
//   U2   the unit entry builds 8 weeks on the candidate (the ruling's after-grid).
//   C1   controls, calcProgramLength: every m:ss twin (total > 0) and the non-time swim goals give the same weeks
//        and warning as V217.
//   C2   controls, buildProgram: m:ss swim time goals, the other swim goals, time goals with no time, run goals,
//        no cardio, bike: progDigest == V217's.
//   ST2  the candidate's boot of the V217-stored program equals V217's boot (progDigest and prog.weeks).
//   HM   HALF_MANNY progDigest == V217's (D157 does not touch a run program). Expect 0ac7da6b1691a8e1.
//   LB3  twin byte-compat: 1,398 canonical m:ss targets (minutes 0-15, 20, 30, 45, 99 x every second, seconds typed
//        "5" and "05", 0:00 excluded): the pace line innerHTML, the rendered swimPaceLine div, and the 100 / 500 sizer
//        warnings are byte-identical to V217.
//   below 218: NOT APPLICABLE, every row skipped by name, clean exit.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process'), crypto = require('crypto');
// clock pinned before the harness loads (measure's method, tests/measure/v218_d157_stored_pin.js)
const RD = Date; let NOW = new RD(2026, 8, 7, 9, 0, 0).getTime();
class FD extends RD { constructor(...a){ if(a.length === 0) super(NOW); else super(...a); } static now(){ return NOW; } }
globalThis.Date = FD;
const { load, progDigest, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const C = load(ART);
const VER = +C.version, ERA = 218, V217_COMMIT = '7af6ad9d46f17e216e26901f3e0812797171fa9f';
const ROWS = ['U1','L1','L2','Z1','ST1','LB1','LB2','OT1','Z2','F0','U2','C1','C2','ST2','HM','LB3'];
let pass = 0, fail = 0, skip = 0, TMP = null;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = l => { skip++; console.log('SKIP ' + l); };
const done = () => { if(TMP) try { fs.rmSync(TMP, { recursive:true, force:true }); } catch(e){}
  console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D157 (V' + ERA + ').'); ROWS.forEach(r => skipRow(r + ' below the D157 era')); done(); }

// ── V217 baseline (argv[3] if it reads 217, else git 7af6ad9) ────────────────────────────
const PAIR = VER === ERA;
TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'g218d157-'));
let V217FILE = null, v217err = null;
try {
  if(BASEFILE){ const b = load(BASEFILE); if(+b.version === 217) V217FILE = path.resolve(BASEFILE); else v217err = 'argv[3] reads ' + b.version; }
  if(!V217FILE){ const f = path.join(TMP, 'v217.html');
    fs.writeFileSync(f, cp.execFileSync('git', ['show', V217_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 26 }));
    if(+load(f).version === 217) V217FILE = f; else v217err = 'git ' + V217_COMMIT.slice(0, 7) + ' does not read 217'; }
} catch(e){ v217err = String(e && e.message || e).slice(0, 200); V217FILE = null; }
if(!V217FILE){ ok('V217 baseline loadable (' + v217err + ')', false); done(); }
const B = load(V217FILE);

// ── helpers ──────────────────────────────────────────────────────────────────────────────
const clone = o => JSON.parse(JSON.stringify(o));
const h16 = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const wsig = p => h16(JSON.stringify(p.weeks));
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'];
const FORMS = ['mss','undef','empty'];
function put(g, pre, t, form){ if(t == null) return g;
  if(form === 'mss'){ g[pre + 'Mins'] = String(Math.floor(t / 60)); g[pre + 'Secs'] = String(t % 60); }
  else if(form === 'undef'){ g[pre + 'Secs'] = String(t); }
  else if(form === 'empty'){ g[pre + 'Mins'] = ''; g[pre + 'Secs'] = String(t); }
  return g; }
function swimGoal(goal, t, c, tf, cf){ const g = { id:goal, label:goal, swimUnit:'yd' };
  put(g, 'target', t, tf); put(g, 'base', c, cf); if(goal === 'swim_100_time') put(g, 'base500', 5 * c + 30, 'mss'); return g; }
const LENFN = IA => IA.eval('(function(types,goals,exp,age,focus){return calcProgramLength(types,Object.assign({},goals,{_experience:exp,_ageBracket:age,_eventTargeted:false}),LIFTING_FOCUS_TO_GOAL[focus]||"balanced");})');
const LC = LENFN(C), LB = LENFN(B);
const len = (L, g, exp, age, types) => { const r = L(types || ['swim'], { swim:g }, exp, age, 'support_prevention'); return { weeks:r.weeks, warning:r.warning }; };
const lenEq = (a, b) => a.weeks === b.weeks && a.warning === b.warning;   // byte for byte: the label reads the total (slice 2a)
function mkCfg(o){ const c = clone(fixtures.HALF_MANNY);
  c.cardioTypes = o.mix === 'run+swim' ? ['run','swim'] : ['swim']; c.experience = o.exp; c.ageBracket = o.age; c.seed = o.seed || 76308;
  c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate; c.restDays = o.rest || ['sun','wed']; c.liftingFocus = 'support_prevention';
  c.cardioGoals = { swim:clone(o.g) };
  if(o.mix === 'run+swim') c.cardioGoals.run = { id:'run_base', label:'Run Base', mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' };
  return c; }
const build = (IA, c) => { const cc = clone(c), before = JSON.stringify(cc); const p = IA.buildProgram(cc); return { p, pure:JSON.stringify(cc) === before }; };

// ── U1 / F0 / U2: the unit row ───────────────────────────────────────────────────────────
const UNIT = { id:'swim_100_time', label:'Improve 100 Time', swimUnit:'yd', targetSecs:'55', baseSecs:'59', base500Mins:'5', base500Secs:'30' };
const UTWIN = { id:'swim_100_time', label:'Improve 100 Time', swimUnit:'yd', targetMins:'0', targetSecs:'55', baseMins:'0', baseSecs:'59', base500Mins:'5', base500Secs:'30' };
{ const e = len(LC, UNIT, 'advanced', '18-35'), t = len(LC, UTWIN, 'advanced', '18-35');
  const be = build(C, mkCfg({ g:UNIT, exp:'advanced', age:'18-35' })), bt = build(C, mkCfg({ g:UTWIN, exp:'advanced', age:'18-35' }));
  const HAND = '100 Time (0:55/100yd) needs 7 weeks';
  console.log('  unit entry: sizer ' + e.weeks + 'wk "' + e.warning + '" build ' + be.p.totalWeeks + 'wk | twin: sizer ' + t.weeks + 'wk "' + t.warning + '" build ' + bt.p.totalWeeks + 'wk');
  ok('U1 unit entry _:55 / _:59: sizer warning carries "' + HAND + '" (HAND); sizer weeks ' + e.weeks + ' == twin ' + t.weeks + '; build ' + be.p.totalWeeks + 'wk == twin ' + bt.p.totalWeeks + 'wk; prog.weeks == twin',
    String(e.warning).includes(HAND) && lenEq(e, t) && be.p.totalWeeks === bt.p.totalWeeks && wsig(be.p) === wsig(bt.p) && be.pure && bt.pure);
  if(PAIR){ const v = len(LB, UNIT, 'advanced', '18-35'), vb = build(B, mkCfg({ g:UNIT, exp:'advanced', age:'18-35' }));
    ok('F0 V217 before-picture: the unit entry sizes ' + v.weeks + 'wk (7), build ' + vb.p.totalWeeks + 'wk (7), warning ' + JSON.stringify(v.warning) + ' (no swim warning)',
      v.weeks === 7 && vb.p.totalWeeks === 7 && !/100 Time/.test(String(v.warning || '')));
    ok('U2 the unit entry builds ' + be.p.totalWeeks + ' weeks on the candidate (8, the after-grid)', be.p.totalWeeks === 8 && e.weeks === 8);
  } else { skipRow('F0 unit before-picture (pair V217 -> 218 only)'); skipRow('U2 unit after-grid length (pair V217 -> 218 only)'); } }

// ── L1: sizer lattice ────────────────────────────────────────────────────────────────────
const TIMES = { swim_100_time:{ T:[45,50,55,58,59,65,75,90,120], C:[50,56,59,60,70,90,150] },
                swim_500_time:{ T:[240,300,330,420,540,660,900], C:[300,360,420,540,720,900] } };
{ const L = { n:0, bad:0, ex:[], moved:0, lbl:0, twins:0, twinBad:0, twinEx:[] };
  for(const goal of Object.keys(TIMES)) for(const exp of EXPS) for(const age of AGES) for(const t of TIMES[goal].T) for(const c of TIMES[goal].C){
    const tw = swimGoal(goal, t, c, 'mss', 'mss'), lt = len(LC, tw, exp, age);
    L.twins++; if(PAIR){ const lb = len(LB, tw, exp, age); if(!(lb.weeks === lt.weeks && lb.warning === lt.warning)){ L.twinBad++; if(L.twinEx.length < 3) L.twinEx.push(goal + ' ' + exp + ' ' + age + ' ' + t + '/' + c + ' ' + lb.weeks + '->' + lt.weeks); } }
    for(const tf of FORMS) for(const cf of FORMS){ if(tf === 'mss' && cf === 'mss') continue;
      const g = swimGoal(goal, t, c, tf, cf), le = len(LC, g, exp, age); L.n++;
      if(!lenEq(le, lt)){ L.bad++; if(L.ex.length < 4) L.ex.push(goal + ' ' + exp + ' ' + age + ' ' + t + '/' + c + ' ' + tf + '/' + cf + ' ' + le.weeks + ' vs twin ' + lt.weeks); }
      if(le.warning !== lt.warning) L.lbl++;
      if(PAIR){ const lb = len(LB, g, exp, age); if(!lenEq(lb, lt)) L.moved++; } } }
  ok('L1 labels: ' + L.lbl + ' seconds-only sizer warnings differ from the m:ss twin\'s byte for byte (0; no normalisation, the label reads the total)', L.lbl === 0);
  ok('L1 sizer lattice: ' + (L.n - L.bad) + '/' + L.n + ' seconds-only entries size as their m:ss twin (weeks + warning)' + (L.ex.length ? ' e.g. ' + L.ex.join('; ') : ''), L.n === 9 * 8 * (63 + 42) && L.bad === 0);
  if(PAIR){ ok('F0 V217 sized ' + L.moved + '/' + L.n + ' L1 seconds-only entries off their twin (> 0, so L1 can fail)', L.moved > 0);
    ok('C1 controls, sizer: ' + (L.twins - L.twinBad) + '/' + L.twins + ' m:ss twins give V217\'s weeks and warning' + (L.twinEx.length ? ' e.g. ' + L.twinEx.join('; ') : ''), L.twinBad === 0 && L.twins === 9 * (63 + 42)); }
  else { skipRow('F0 L1 before-picture (pair only)'); skipRow('C1 m:ss sizer controls (pair only)'); } }

// C1 continued: the non-time swim goals and time goals with no time, via the sizer
if(PAIR){ let n = 0, bad = 0, ex = [];
  for(const exp of EXPS) for(const age of AGES) for(const g of [{ id:'swim_tri' }, { id:'swim_mile' }, { id:'swim_base' }, { id:'swim_tri', baselineDist:'600' }, { id:'swim_base', baselineDist:'300' },
      { id:'swim_100_time' }, { id:'swim_500_time' }, { id:'swim_100_time', baseMins:'1', baseSecs:'10' }, { id:'swim_500_time', baselineDist:'700' }]){
    const gg = Object.assign({ label:g.id, swimUnit:'yd' }, g), a = len(LB, gg, exp, age), b = len(LC, gg, exp, age); n++;
    if(!(a.weeks === b.weeks && a.warning === b.warning)){ bad++; if(ex.length < 3) ex.push(g.id + ' ' + exp + ' ' + age + ' ' + a.weeks + '->' + b.weeks); } }
  ok('C1 controls, sizer: ' + (n - bad) + '/' + n + ' non-time swim goals and time goals with no time give V217\'s weeks and warning' + (ex.length ? ' e.g. ' + ex.join('; ') : ''), n === 81 && bad === 0);
} else skipRow('C1 non-time sizer controls (pair only)');

// ── L2: full-build lattice ───────────────────────────────────────────────────────────────
{ const PAIRS = { swim_100_time:[[55,59],[75,90]], swim_500_time:[[420,480],[540,600]] };
  const F2 = [['undef','mss'],['mss','undef'],['undef','undef'],['empty','empty']];
  const S = { n:0, bad:0, ex:[], impure:0, moved:0, crash:0 };
  for(const goal of Object.keys(PAIRS)) for(const exp of EXPS) for(const age of ['18-35','55+']) for(const [t, c] of PAIRS[goal]) for(const mix of ['swim','run+swim']){
    let tw; try { tw = build(C, mkCfg({ g:swimGoal(goal, t, c, 'mss', 'mss'), exp, age, mix })); } catch(e){ S.crash++; continue; }
    if(!tw.pure) S.impure++;
    for(const [tf, cf] of F2){ S.n++; let e;
      try { e = build(C, mkCfg({ g:swimGoal(goal, t, c, tf, cf), exp, age, mix })); } catch(err){ S.crash++; S.bad++; continue; }
      if(!e.pure) S.impure++;
      if(!(e.p.totalWeeks === tw.p.totalWeeks && wsig(e.p) === wsig(tw.p))){ S.bad++; if(S.ex.length < 4) S.ex.push(goal + ' ' + exp + ' ' + age + ' ' + mix + ' ' + t + '/' + c + ' ' + tf + '/' + cf + ' ' + e.p.totalWeeks + 'wk vs twin ' + tw.p.totalWeeks + 'wk'); }
      if(PAIR){ try { const v = build(B, mkCfg({ g:swimGoal(goal, t, c, tf, cf), exp, age, mix })); if(!(v.p.totalWeeks === tw.p.totalWeeks && wsig(v.p) === wsig(tw.p))) S.moved++; } catch(err){ S.crash++; } } } }
  ok('L2 full-build lattice: ' + (S.n - S.bad) + '/' + S.n + ' seconds-only builds equal their m:ss twin (totalWeeks + prog.weeks), ' + S.crash + ' crashed' + (S.ex.length ? ' e.g. ' + S.ex.join('; ') : ''), S.n === 192 && S.bad === 0 && S.crash === 0);
  ok('L2 buildProgram leaves every lattice cfg byte-identical (' + S.impure + ' mutated)', S.impure === 0);
  if(PAIR) ok('F0 V217 built ' + S.moved + '/' + S.n + ' L2 seconds-only entries off their twin (> 0, so L2 can fail)', S.moved > 0);
  else skipRow('F0 L2 before-picture (pair only)'); }

// ── Z1: 0:00 takes the volume path (target) or the experience default (current) ─────────
{ const ZT = [{ targetMins:'0', targetSecs:'0' }, { targetMins:'0', targetSecs:'' }, { targetMins:'', targetSecs:'0' }, { targetMins:'', targetSecs:'' }, { targetSecs:'0' }];
  const ZC = [{ baseMins:'0', baseSecs:'0' }, { baseMins:'0', baseSecs:'' }, { baseMins:'', baseSecs:'0' }, { baseMins:'', baseSecs:'' }, { baseSecs:'0' }];
  let n = 0, bad = 0, ex = [], v217time = 0;
  for(const goal of ['swim_100_time','swim_500_time']) for(const exp of EXPS) for(const age of ['18-35','55+']){
    const base = goal === 'swim_100_time' ? { baseMins:'1', baseSecs:'5', base500Mins:'6', base500Secs:'0' } : { baseMins:'8', baseSecs:'0' };
    const absT = Object.assign({ id:goal, label:goal, swimUnit:'yd' }, base), la = len(LC, absT, exp, age);
    for(const z of ZT){ const g = Object.assign({}, absT, z), lz = len(LC, g, exp, age); n++;
      const good = lz.weeks === la.weeks && lz.warning === la.warning && !/\(\d+:\d+\//.test(String(lz.warning || ''));
      if(!good){ bad++; if(ex.length < 4) ex.push('target ' + JSON.stringify(z) + ' ' + goal + ' ' + exp + ' ' + lz.weeks + ' vs absent ' + la.weeks); }
      if(PAIR && /\(\d+:\d+\//.test(String(len(LB, g, exp, age).warning || ''))) v217time++; }
    const tgt = goal === 'swim_100_time' ? { targetMins:'0', targetSecs:'55' } : { targetMins:'6', targetSecs:'30' };
    const absC = Object.assign({ id:goal, label:goal, swimUnit:'yd' }, tgt, goal === 'swim_100_time' ? { base500Mins:'6', base500Secs:'0' } : {}), lc = len(LC, absC, exp, age);
    for(const z of ZC){ const lz = len(LC, Object.assign({}, absC, z), exp, age); n++;
      if(!lenEq(lz, lc)){ bad++; if(ex.length < 4) ex.push('current ' + JSON.stringify(z) + ' ' + goal + ' ' + exp + ' ' + lz.weeks + ' vs absent ' + lc.weeks); } } }
  if(PAIR) console.log('  INFO Z1 zero-target entries V217 sized on the time path (a typed "0" minutes box): ' + v217time + '/' + (n / 2) + '; D157 routes every one to the volume path');
  ok('Z1 0:00 sizes as the field absent: ' + (n - bad) + '/' + n + ' (target -> volume path with no time label, current -> experience default)' + (ex.length ? ' e.g. ' + ex.join('; ') : ''), n === 120 && bad === 0); }

// ── C2: full-build controls ──────────────────────────────────────────────────────────────
if(PAIR){ let n = 0, bad = 0, ex = [], crash = 0;
  const run = [fixtures.HALF_MANNY.cardioGoals.run, { id:'run_5k', label:'5K' }, { id:'run_pace_goal', label:'Pace', targetDist:'1.5', targetMins:'11', targetSecs:'30', mileBestMins:'8', mileBestSecs:'0' }, { id:'run_base', label:'Base', baselineDist:'3' }];
  const swims = [swimGoal('swim_100_time', 55, 59, 'mss', 'mss'), swimGoal('swim_100_time', 75, 90, 'mss', 'mss'), swimGoal('swim_500_time', 420, 480, 'mss', 'mss'),
    { id:'swim_100_time', label:'t', swimUnit:'yd' }, { id:'swim_500_time', label:'t', swimUnit:'yd' }, { id:'swim_tri', label:'t', swimUnit:'yd', baselineDist:'600' },
    { id:'swim_mile', label:'t', swimUnit:'yd', baselineDist:'600' }, { id:'swim_base', label:'t', swimUnit:'yd', baselineDist:'600' }];
  for(const seed of [76308, 24865]) for(const exp of EXPS){
    const cfgs = swims.map(g => mkCfg({ g, exp, age:'18-35', seed })).concat(swims.slice(0, 3).map(g => mkCfg({ g, exp, age:'55+', seed, mix:'run+swim' })));
    for(const r of run){ const c = clone(fixtures.HALF_MANNY); c.seed = seed; c.experience = exp; c.cardioGoals = { run:clone(r) }; if(r.id !== fixtures.HALF_MANNY.cardioGoals.run.id){ c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate; } cfgs.push(c); }
    { const c = clone(fixtures.HALF_MANNY); c.seed = seed; c.experience = exp; c.cardioTypes = []; c.cardioGoals = {}; c.primaryPath = 'goal'; delete c.raceDate; cfgs.push(c); }
    { const c = clone(fixtures.HALF_MANNY); c.seed = seed; c.experience = exp; c.cardioTypes = ['bike']; c.cardioGoals = { bike:{ id:'bike_ftp', label:'FTP' } }; c.primaryPath = 'goal'; delete c.raceDate; cfgs.push(c); }
    for(const c of cfgs){ n++; try { const a = progDigest(B.buildProgram(clone(c))), b = progDigest(C.buildProgram(clone(c)));
      if(a !== b){ bad++; if(ex.length < 3) ex.push(((c.cardioGoals.swim || c.cardioGoals.run || c.cardioGoals.bike || {}).id || 'none') + ' ' + exp + ' ' + seed); } } catch(e){ crash++; bad++; } } }
  ok('C2 controls, full build: ' + (n - bad) + '/' + n + ' m:ss swim, other swim, no-time, run, no-cardio and bike programs have V217\'s progDigest, ' + crash + ' crashed' + (ex.length ? ' e.g. ' + ex.join('; ') : ''), n === 102 && bad === 0);
  const hb = progDigest(B.buildProgram(clone(fixtures.HALF_MANNY))), hc = progDigest(C.buildProgram(clone(fixtures.HALF_MANNY)));
  ok('HM HALF_MANNY candidate ' + hc + ' == V217 ' + hb + ' (expect 0ac7da6b1691a8e1)', hc === hb && hc === '0ac7da6b1691a8e1');
} else { skipRow('C2 full-build controls (pair only)'); skipRow('HM HALF_MANNY vs V217 (pair only)'); }

// ── LB1 / LB2 / OT1 / Z2 / LB3: every swim target label reads the total (coach, slice 2a) ─────
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

// ── ST1 / ST2: a stored seconds-only program (measure's method, v218_d157_stored_pin.js) ─
{ const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
  function vm(file){ const IA = load(file); const els = new Map(); const mk = IA.window.document.createElement;
    IA.window.document.getElementById = id => { if(!els.has(id)){ const e = mk('div'); e.id = id; els.set(id, e); } return els.get(id); }; return IA; }
  const WD = { primaryPath:'goal', cardioTypes:['swim'], experience:'advanced', ageBracket:'18-35', eventTargeted:false, liftingFocus:'support_prevention', equipment:'crossfit',
    restDays:['sun','wed'], unit:'lbs', seed:76308, name:'S', bench:135, squat:155, deadlift:185, startDate:undefined, cardioGoals:{ swim:clone(UNIT) } };
  function generate(file){ NOW = new RD(2026, 8, 7, 9, 0, 0).getTime(); const IA = vm(file); IA.localStorage._map.clear(); IA.eval('activeProg=null');
    IA.window.__W = WD; IA.eval('WD=JSON.parse(JSON.stringify(__W))'); let err = null;
    try { IA.eval('doGenerate()'); IA.flushTimers(Infinity); } catch(e){ err = e.message; }
    return { p:IA.eval('activeProg'), store:new Map(IA.localStorage._map), err }; }
  function boot(file, store){ NOW = new RD(2026, 8, 24, 9, 0, 0).getTime(); const IA = vm(file); IA.localStorage._map.clear();
    for(const [k, v] of store) IA.localStorage._map.set(k, v);
    IA.eval('activeProg=null; activeProgId=null; init()'); IA.flushTimers(50);
    return { p:IA.eval('activeProg'), stored:JSON.parse(IA.localStorage.getItem('ia_programs'))[0], cw:IA.eval('currentWeek') }; }
  const g7 = generate(V217FILE), g8 = generate(ART);
  if(!g7.p || !g8.p){ ok('ST1 generate (V217 ' + (g7.p ? 'ok' : g7.err) + ', candidate ' + (g8.p ? 'ok' : g8.err) + ')', false); }
  else {
    const store = new Map(g7.store), rec = JSON.parse(store.get('ia_programs'))[0];
    const hist = {}, comp = {};
    for(const w of [1,2,3]) for(const d of DAYS){ if(w === 3 && !['mon','tue'].includes(d)) continue; const day = rec.weeks[w] && rec.weeks[w][d]; if(!day || day.rest) continue;
      hist['w' + w + '_' + d] = clone(day); comp['w' + w + '_' + d] = 'done'; }
    store.set('ia_hist_' + rec.id, JSON.stringify(hist)); store.set('ia_comp_' + rec.id, JSON.stringify(comp));
    const b1 = boot(V217FILE, store), b2 = boot(V217FILE, store), s1 = boot(ART, store);
    let tr = 0, trN = 0; for(const k of Object.keys(hist)){ trN++; const [w, d] = k.slice(1).split('_'); if(JSON.stringify(s1.p.weeks[w] && s1.p.weeks[w][d]) === JSON.stringify(hist[k])) tr++; }
    console.log('  stored: V217 generate ' + g7.p.totalWeeks + 'wk pin ' + rec.cfg._raceDateCappedWeeks + ' | candidate fresh ' + g8.p.totalWeeks + 'wk | boot currentWeek V217 ' + b1.cw + ' cand ' + s1.cw +
      ' | boot totalWeeks V217 ' + b1.p.totalWeeks + ' cand ' + s1.p.totalWeeks + ' | digest V217 ' + progDigest(b1.p) + ' cand ' + progDigest(s1.p));
    ok('ST1 stored seconds-only program: V217 stored ' + rec.totalWeeks + 'wk pin ' + rec.cfg._raceDateCappedWeeks + ' (7/7); candidate fresh generate ' + g8.p.totalWeeks + 'wk (8, D157 reaches it); candidate boot keeps ' + s1.p.totalWeeks +
      'wk (stored record after boot ' + s1.stored.totalWeeks + '); trained days == ia_hist_ ' + tr + '/' + trN + '; clock took (currentWeek ' + s1.cw + ' == 3)',
      rec.totalWeeks === 7 && rec.cfg._raceDateCappedWeeks === 7 && g8.p.totalWeeks === 8 && s1.p.totalWeeks === 7 && s1.stored.totalWeeks === 7 && trN > 0 && tr === trN && s1.cw === 3);
    if(PAIR){ const self = progDigest(b1.p) === progDigest(b2.p) && wsig(b1.p) === wsig(b2.p);
      ok('ST2 candidate boot of the V217-stored program == V217 boot (progDigest + prog.weeks); V217 boot self-stable ' + self, self && progDigest(b1.p) === progDigest(s1.p) && wsig(b1.p) === wsig(s1.p)); }
    else skipRow('ST2 stored boot vs V217 (pair only)'); } }

done();
