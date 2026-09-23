// g208_d103a_chip.js — D103a slice 3: the chip and the history read both label eras as one.
//
// RULING (D103a, coach V206; slice 3 at V208): the chip (runSessionCode, through its two callers
// dayCode and _doseStripHTML) reads the dose key but prints TODAY's codes; chips change only at
// the LI/SI rename (slice 4). Keyed: int INT, chi CHI, steady STDY, bench TEST, trial TEST (coach:
// the test wears TEST, as the benchmark does; today it prints RUN). long and easy wear their
// label's code. Unkeyed and frozen strings: "long interval"/"(li)"/"continuous high" read CHI and
// "short interval"/"(si)" read INT BEFORE the generic interval test, so an old frozen label and a
// renamed one wear the same chip. NRC keeps its codes ("Speed Run — Intervals" INT).
// _runClass stays a string classifier of the stored record; the CHI's new name classes as Tempo
// with the CHI it replaces, the INT's new name as Interval; the test stays null.
//
// BUILDER DEVIATION (flagged in the V208 slice 3 handoff): only the rename tokens ((LI), long
// interval) run ahead of the interval test in _runClass. Moving the whole Tempo test ahead, as the
// brief wrote it, reclassifies NRC "Speed Run — Tempo" from Interval to Tempo; D1 pins that every
// label printed today keeps its class.
//
// SLICE 4a (the LI/SI rename; these rows updated at slice 4f). The chips moved with the names. At
// V208 the ruled chip is: keyed chi LI, keyed int SI, trial TEST, every other key its label's V207
// code. Unkeyed run strings: "long interval", "(li)" and a frozen "continuous high" read LI; "short
// interval", "(si)" and a frozen "(int)" read SI; a bare "interval" (NRC "Speed Run — Intervals")
// keeps INT. Bike and swim kept their CHI and INT names, so their chips keep CHI and INT (A3). The
// baseline rows B3 and D1 read the label V207 printed for the same session (V207_LABEL, a hand table
// of the rename), so the only moves they admit are the ruled ones.
//
// ORACLES: hand tables (the two label eras; today's chip per label, read off the V207 code as a
// table below; the ruled trial chip), and the baseline's own runSessionCode/_runClass on the same
// string for the "nothing printed moves" rows.
//
// VERSION PREDICATE (standing ruling 4): ships on ia-version 208. Below 208 every row prints SKIP.
// Rows reading a baseline (argv[3]) run when the baseline is V207 or the V208 pre-slice tree.
'use strict';
const path = require('path');
const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version, ERA = 208;
let pass = 0, fail = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skip = l => console.log('SKIP ' + l);
const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ ['A','B','C','D','M'].forEach(r => skip(r + ' rows: ia-version ' + VER + ' predates D103a slice 3 (V' + ERA + ')')); done(); }
const IB = BASEFILE ? load(BASEFILE) : null;
const BASE_OK = !!IB && VER === ERA && (+IB.version === 207 || +IB.version === 208);
const BASE_WHY = !IB ? 'no baseline passed as argv[3]' : 'baseline ia-version ' + IB.version + ' is neither V207 nor the V208 pre-slice tree';
const clone = v => JSON.parse(JSON.stringify(v));
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'], ALL = ['sun','mon','tue','wed','thu','fri','sat'];
const CODE = IA.eval('runSessionCode'), RC = IA.eval('_runClass'), DAYCODE = IA.eval('dayCode'), STRIP = IA.eval('_doseStripHTML');
const chipDay = c => DAYCODE({title:'', tags:[], sections:[], cardio:c}).bot;
const chipStrip = c => { const h = STRIP('run', c.dose, c.subtype || ''); const m = /ps-lbl">[^<·]*? — ([A-Z]+) · Planned/.exec(h); return m ? m[1] : 'RUN'; };
// ── A: the two label eras, unkeyed (a frozen string) ───────────────────────────────
const SUFFIX = ['', ' — Taper', ' (re-entry)', ' — Taper (re-entry)'];
const ERAS = [
  {fam:'CHI', v207:'Continuous High Intensity (CHI)', v4:'Long Interval (LI)', chip:'LI', cls:'Tempo'},
  {fam:'INT', v207:'Interval (INT)', v4:'Short Interval (SI)', chip:'SI', cls:'Interval'},
];
// The rename as a hand table (slice 4a): the label V207 printed for a run session printed today. The
// head moves; every suffix (Taper, re-entry) stays. Any other label is its own V207 label.
const V207_LABEL = s => String(s || '').replace(/^Long Interval \(LI\)/, 'Continuous High Intensity (CHI)').replace(/^Short Interval \(SI\)/, 'Interval (INT)');
for(const e of ERAS){
  const bad = [], badC = [];
  for(const sfx of SUFFIX) for(const lab of [e.v207 + sfx, e.v4 + sfx]){
    for(const t of [undefined, 'run']) if(CODE(lab, null, t) !== e.chip) bad.push('"' + lab + '"' + (t ? ' (' + t + ')' : '') + ' ' + CODE(lab, null, t));
    if(RC(lab) !== e.cls) badC.push('"' + lab + '" ' + RC(lab));
  }
  ok(`A1 ${e.fam}: "${e.v207}" and "${e.v4}" (and their Taper and re-entry forms) wear one chip, ${e.chip}`, bad.length === 0, bad.join('; '));
  ok(`A2 ${e.fam}: both label eras class as ${e.cls} in the run history`, badC.length === 0, badC.join('; '));
}
// A3 the rename is the run's only: a bike or swim CHI or INT (and its Taper form) keeps CHI or INT.
{ const bad = [];
  for(const t of ['bike', 'swim']) for(const sfx of ['', ' — Taper']) for(const [lab, w] of [['Continuous High Intensity (CHI)', 'CHI'], ['Interval (INT)', 'INT']])
    if(CODE(lab + sfx, null, t) !== w) bad.push(t + ' "' + lab + sfx + '" ' + CODE(lab + sfx, null, t));
  ok('A3 a bike or swim CHI or INT, plain or Taper, keeps its chip, CHI or INT (8 labels)', bad.length === 0, bad.join('; ')); }
// ── lattice ─────────────────────────────────────────────────────────────────────────
const START = new Date(2026, 9, 5);
const isoOff = n => { const d = new Date(START); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const LIFT = {liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs', days:ALL, bench:185, squat:255, deadlift:315, name:'C', startDate:isoOff(0)};
const PACE = {id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'};
const MILE = {id:'run_mile_time', label:'Mile', mileBestMins:'8', mileBestSecs:'15', targetDist:'1', targetMins:'7', targetSecs:'30', paceUnit:'mi'};
const INJ = [null, {region:'knee', tier:'workaround', halfstep:true}, {region:'knee', tier:'workaround'}];
const CFG = [];
for(const inj of INJ){
  for(const g of [PACE, MILE]) for(const mix of ['', 'bike', 'swim']) for(const rest of [['sun'], ['sun','wed']]) for(const tw of [0, 1, 3]){
    const cg = {run:clone(g)}; if(mix === 'bike') cg.bike = {id:'bike_base', label:'Bike'}; if(mix === 'swim') cg.swim = {id:'swim_base', label:'Swim'};
    const c = Object.assign({}, LIFT, {primaryPath:'event', eventTargeted:true, cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, restDays:rest, seed:24865});
    if(tw){ c.raceDate = isoOff(7 * (tw - 1) + 3); c._testWeek = tw; c._raceDateCappedWeeks = tw; } if(inj) c.injury = clone(inj); CFG.push({fam:'pace', cfg:c});
  }
  for(const mix of ['', 'bike']) for(const rest of [[], ['sun','wed']]) for(const seed of [24865, 7]){
    const cg = {run:{id:'run_base', label:'Build Running Base', mileBestMins:'8', mileBestSecs:'15', baseline:'2.5 miles'}}; if(mix) cg.bike = {id:'bike_base', label:'Bike'};
    const c = Object.assign({}, LIFT, {primaryPath:'event', eventTargeted:true, cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, restDays:rest, seed}); if(inj) c.injury = clone(inj); CFG.push({fam:'run_base freq', cfg:c});
  }
  for(const pp of ['fitness','event']) for(const rest of [['sun','wed'], []]){
    const c = Object.assign({}, clone(IA.fixtures.HALF_MANNY), {name:'RB', primaryPath:pp, cardioTypes:['run'], cardioGoals:{run:{id:'run_base', label:'Build Running Base', baselineDist:'0.1', baseline:'0.1mi'}},
      eventTargeted:pp === 'event', raceDate:pp === 'event' ? '2027-06-01' : '', ageBracket:'55+', restDays:rest, seed:76308}); if(inj) c.injury = clone(inj); CFG.push({fam:'run_base 55+', cfg:c});
  }
  for(const g of ['run_5k','run_10k','run_half','run_marathon']) for(const mix of ['', 'bike', 'swim']){
    const cg = {run:{id:g, label:g}}; if(mix === 'bike') cg.bike = {id:'bike_base', label:'Bike'}; if(mix === 'swim') cg.swim = {id:'swim_base', label:'Swim'};
    const c = Object.assign({}, clone(IA.fixtures.HALF_MANNY), {cardioTypes:mix ? ['run', mix] : ['run'], cardioGoals:cg, restDays:['sun'], seed:76308}); if(inj) c.injury = clone(inj); CFG.push({fam:'NRC', cfg:c});
  }
}
const cards = [];   // {c, nsw}
let crash = [];
CFG.forEach((e, i) => { let p; try { p = IA.buildProgram(clone(e.cfg)); } catch(x){ crash.push(e.fam + ' #' + i + ': ' + x.message); return; }
  Object.keys(p.weeks).forEach(w => DAYS.forEach(d => { const x = p.weeks[w][d]; if(x && x.cardio && !Array.isArray(x.cardio)) cards.push({c:x.cardio, fam:e.fam}); })); });
const keyOf = c => (c.dose && c.dose.key) || null;
const nsw = cards.filter(x => x.c.type === 'run' && keyOf(x.c));
const unkeyed = cards.filter(x => !keyOf(x.c));
// Today's chip, per label, read off the V207 runSessionCode as a hand table; plus the ruled trial chip.
function todayChip(s){ s = String(s || '').toLowerCase();
  if(s.includes('interval')) return 'INT'; if(s.includes('continuous high')) return 'CHI'; if(s.includes('steady aerobic')) return 'STDY';
  if(s.includes('easy run')) return 'EASY'; if(s.includes('benchmark')) return 'TEST'; if(s.includes('long slow') || /\blsd\b/.test(s)) return 'LSD'; return 'RUN'; }
// V208 (slice 4a): the ruled chip of a keyed run. chi LI, int SI, trial TEST; every other key wears
// the V207 code for its label (steady STDY, bench TEST, long and easy EASY or LSD).
const KEYCHIP = {chi:'LI', int:'SI', trial:'TEST'};
const want = c => KEYCHIP[keyOf(c)] || todayChip(c.subtype);
// ── B: keyed chips ──────────────────────────────────────────────────────────────────
{
  ok(`B0 ${CFG.length} programs build (pace, run_base both kinds, NRC x no injury, halfstep, easy); ${nsw.length} keyed NSW run cards, ${unkeyed.length} unkeyed cards`, crash.length === 0 && nsw.length > 0 && unkeyed.length > 0, crash.slice(0, 2).join('; '));
  const bad1 = [], bad2 = []; const byKey = {};
  nsw.forEach(({c}) => { const k = keyOf(c), a = chipDay(c), b = chipStrip(c); byKey[k + ' ' + a] = (byKey[k + ' ' + a] || 0) + 1;
    if(a !== want(c)) bad1.push(k + ' "' + c.subtype + '" ' + a + ' want ' + want(c)); if(b !== want(c)) bad2.push(k + ' "' + c.subtype + '" ' + b + ' want ' + want(c)); });
  ok(`B1 the day chip of every keyed NSW run is its ruled code, chi LI, int SI, the test TEST, every other key its label's V207 code (${Object.keys(byKey).sort().map(k => k + ' ' + byKey[k]).join(', ')})`, bad1.length === 0, bad1.length + ': ' + bad1.slice(0, 3).join('; '));
  ok(`B2 the planned dose strip names the same code (${nsw.length} cards)`, bad2.length === 0, bad2.length + ': ' + bad2.slice(0, 3).join('; '));
  if(!BASE_OK) skip('B3 ' + BASE_WHY);
  else { const CB = IB.eval('runSessionCode'); const moved = {}; let n = 0;
    nsw.forEach(({c}) => { const a = chipDay(c), b = CB(V207_LABEL(c.subtype)); if(a !== b){ n++; const k = keyOf(c) + ': ' + b + ' -> ' + a; moved[k] = (moved[k] || 0) + 1; } });
    const RULED = ['trial: RUN -> TEST', 'chi: CHI -> LI', 'int: INT -> SI'];
    ok(`B3 against the baseline reading the label V207 printed, the only chips that move are the ruled three: the test RUN to TEST, the CHI to LI, the INT to SI (${n} moved: ${Object.keys(moved).map(k => k + ' x' + moved[k]).join(', ') || 'none'})`,
       Object.keys(moved).every(k => RULED.includes(k)) && RULED.every(k => (moved[k] || 0) > 0), JSON.stringify(moved)); }
  // a keyed quality run wears its key's chip whatever it is named: the OTHER quality run's name in
  // either era (a label reader would print the wrong class), and a label no scan knows
  const badR = []; let nr = 0;
  const RELABEL = {chi:['Short Interval (SI)', 'Interval (INT)', 'Zqx Session (ZQX)'], int:['Long Interval (LI)', 'Continuous High Intensity (CHI)', 'Zqy Session (ZQY)']};
  nsw.filter(({c}) => keyOf(c) === 'int' || keyOf(c) === 'chi').forEach(({c}) => { for(const lab of RELABEL[keyOf(c)]){
    nr++; const r = clone(c); r.subtype = lab; const a = chipDay(r), b = chipStrip(r), w = KEYCHIP[keyOf(c)]; if(a !== w || b !== w) badR.push(keyOf(c) + ' as "' + lab + '" day ' + a + ' strip ' + b); } });
  ok(`B4 a keyed CHI or INT relabelled to the other quality run's name (either era) or a name no scan knows keeps its key's chip, LI or SI, on the day and on the strip (${nr} relabels)`, nr > 0 && badR.length === 0, badR.length + ': ' + badR.slice(0, 3).join('; '));
}
// ── C: NRC, bike, swim and every unkeyed string ────────────────────────────────────
{
  ok('C1 NRC spot rows: "Speed Run — Intervals" wears INT and classes Interval; "Speed Run — Tempo" classes Interval as before',
     CODE('Speed Run — Intervals') === 'INT' && RC('Speed Run — Intervals') === 'Interval' && RC('Speed Run — Tempo') === 'Interval', CODE('Speed Run — Intervals') + ' / ' + RC('Speed Run — Intervals') + ' / ' + RC('Speed Run — Tempo'));
  if(!BASE_OK) skip('C2 ' + BASE_WHY);
  else { const CB = IB.eval('runSessionCode'); const seen = new Set(), moved = [];
    unkeyed.forEach(({c}) => { const s = c.subtype || ''; if(seen.has(c.type + s)) return; seen.add(c.type + s);
      if(chipDay(c) !== DAYCODE_B(c)) moved.push(c.type + ' "' + s + '" ' + DAYCODE_B(c) + ' -> ' + chipDay(c)); });
    function DAYCODE_B(c){ return IB.eval('dayCode')({title:'', tags:[], sections:[], cardio:c}).bot; }
    ok(`C2 every unkeyed card (NRC run, bike, swim, protected and walk rewrites) wears the baseline's chip (${seen.size} distinct strings)`, seen.size > 0 && moved.length === 0, moved.length + ': ' + moved.slice(0, 3).join('; ')); }
}
// ── D: the run history ──────────────────────────────────────────────────────────────
if(!BASE_OK) skip('D1 ' + BASE_WHY);
else { const RB = IB.eval('_runClass'); const seen = new Set(), moved = [];
  cards.filter(({c}) => c.type === 'run').forEach(({c}) => { const s = c.subtype || ''; if(seen.has(s)) return; seen.add(s); const o = V207_LABEL(s); if(RC(s) !== RB(o)) moved.push('"' + s + '" (V207 "' + o + '") ' + RB(o) + ' -> ' + RC(s)); });
  ok(`D1 every run label printed today keeps the history class the baseline gives the label V207 printed for it, so no history splits across the rename (${seen.size} distinct run subtypes)`, seen.size > 0 && moved.length === 0, moved.length + ': ' + moved.slice(0, 3).join('; ')); }
{ const t = ['1.5 Mile Test — TIME TRIAL', '1 Mile Test — TIME TRIAL', 'Benchmark Run', 'Benchmark Run — Retest'].map(s => s + ' ' + RC(s));
  ok('D2 the test and the benchmark stay out of the run history (null class)', ['1.5 Mile Test — TIME TRIAL', '1 Mile Test — TIME TRIAL', 'Benchmark Run', 'Benchmark Run — Retest'].every(s => RC(s) === null), t.join('; ')); }
// ── M ───────────────────────────────────────────────────────────────────────────────
{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }
  ok('M1 HALF_MANNY digest is 0ac7da6b1691a8e1', hm === '0ac7da6b1691a8e1', hm); }
done();
