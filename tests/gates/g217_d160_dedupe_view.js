// g217_d160_dedupe_view.js — GATE for D160 CFb (coach): THE DEDUPE READS THE DAY THAT SHIPS.
//
//   node tests/gates/g217_d160_dedupe_view.js [candidate] [baseline V216]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   D160 CFb  deconflictAdjacentDupes runs before d18LongRunDayPass, so it renamed an item to dodge a
//             previous-day name that D18 later strips from the long-run day (phantom renames). The dedupe
//             stays where it is. Per pair, the trigger set is read from the previous day with D18 applied
//             to a deep copy of that day as it currently stands (the dedupe's own earlier renames are
//             seen). The live week is never mutated. Helper: _d18View(A, wA, dA).
//
// ORACLES, independent of the dedupe's own logic:
//   REN      every rename the dedupe writes, logged by source surgery at the one writer (it.name=to),
//            anchor asserted count==1: {w, d, was, to, pw, pd}. Inert: HALF_MANNY digest equals the raw file.
//   PHANTOM  a rename whose trigger name ('was', case folded, as the dedupe folds it) is absent from the
//            SHIPPED previous day's item names in the final output.
//   LONG     the previous day is a long-run day when _longRunTier (D18's own tier contract) gives A, B or C
//            for its shipped card (one card, not a stack). A phantom on a long-run previous day is in scope;
//            any other phantom is printed and not asserted (D160 does not rule on it).
//   DOCTRINE the view of a hand-built day (Main deadlift, a Farmer carry, a dumbbell bench accessory) under
//            a real card of each tier: A prints only the five-item mobility block (calves, couch, 90/90,
//            T-spine, foam roll); B keeps the bench and drops the deadlift and the carry; C drops only the
//            carry. A non-long card leaves the day byte-identical.
//   V216     the shipped artifact (argv[3] when it reads 216, else git 3dc0146) for the pair rows.
//
// LATTICES (tests/measure/v217_d160_dedupe_order.js, the dimensions measure ran; 8,280 configs):
//   NRC        4 plans x 3 experience x 5 rest patterns x 5 tiers x 6 focuses x dated/undated (3,600).
//   NRC multi  4 plans x 5 bike/swim extras x 6 focuses x 5 tiers (600).
//   NSW        4 NSW goals x 2 mile times x 6 focuses x 5 tiers x 5 rest patterns x 3 experience (3,600).
//   injury     5 tiers x 8 seeds x 6 regions x workaround/protect (480).
//
// ROWS
//   I0   instrumentation inert on candidate and baseline (HALF_MANNY digest, raw == instrumented).
//   F0   fixture, V216 before-picture as measure printed it (tests/measure/v217_d160_rebaseline_v216.js):
//        6,919 renames; 102 phantom, every one in scope, all NSW, previous day tier A 8 / tier B 94, every
//        trigger 'Kettlebell swing'; 983 unseen (the renamed item is not on the shipped renamed day). So P1 can fail.
//   P1   per lattice: the candidate makes 0 renames whose trigger its shipped long-run previous day lacks.
//   R1   PAIR, per lattice: the candidate's renames are exactly V216's renames minus V216's in-scope
//        phantoms (the dedupe's real work is kept, nothing new appears).
//   R2   PAIR, totals (measure's CFb): 6,817 renames, 0 phantoms of any kind, 983 unseen.
//   D1   PAIR, blast radius (measure's CFb): 62 programs and 102 days differ from V216. Every differing day is
//        a day V216 made an in-scope phantom rename on, every such day differs, and the diff is only the
//        reverted items: same day fields, section count, section fields (labels) and item counts; each
//        differing item prints the phantom's trigger on the candidate and its rename on V216, and differs in
//        name and detail only. 0 diffs in any top-level field (_swapUniverse included), clock fields stripped.
//   E1   PAIR, the reporter example (measure): NSW run_pace_goal, mile 8:15, support_athletic, beginner,
//        crossfit, rest mon/wed/fri, seed 24865. W5 sat ships with no Kettlebell swing on either build. W6 sun
//        Conditioning: V216 'Kettlebell single-leg deadlift 2×10–15 @ RPE 8 | Broad jumps 2×10', candidate
//        'Kettlebell swing 2×12 | Broad jumps 2×10'.
//   W1   on every call inside every lattice build, _d18View leaves the live previous day byte-identical and
//        never returns the object it was given; the helper is called at least once.
//   U1   direct: _d18View on real shipped days (tier A, B, C and a non-long day) leaves prog.weeks
//        byte-identical and the view shares no object with the input.
//   U2   direct: the DOCTRINE views above, and the hand-built input day is unchanged after each.
//   C1   buildProgram leaves every lattice cfg byte-identical (candidate).
//
// K LIMB, NSW multi-sport (gatekeeper went RED on it; coach re-ruled: CFb STANDS, every knock-on class is D160's).
//   Lattices: gk = gatekeeper's pace+bike slice (tests/measure/v217_gk_lattice.js construction, injury rotation
//   by the full 6,480 index; 1,080 configs); multi = measure's NSW extension, pace+bike, pace+swim,
//   pace+bike+swim, run_base+bike x 2 mile times x 7 focuses x 5 tiers x 5 rest patterns x 3 experience (4,200).
//   Instrument (measure's knock-on instrument, copied): at every trigger that reaches the candidate filter, log
//   {pair, B position, was, was-in-raw-A, was-in-D18-view-of-A, pool, top3, onB, to}; per pair, yesterday's raw
//   name set. Events compare the two logs position by position: P reverted phantom, A yesterday differs, B target
//   changed, C new rename, D a V216 rename gone that was not a phantom.
//   K0   knock-on instrument inert (HALF_MANNY raw == instrumented, both builds).
//   K1   phantoms V216 -> candidate per mix, independent oracle: the trigger is absent from the SHIPPED previous
//        day of the dedupe pair. gk pace+bike 124->0; pace+bike 163->0; pace+swim 141->0; pace+bike+swim 59->0;
//        base+bike 0->0. Config counts 1,080 / 4,200, 0 crashed.
//   K2   event classes vs V216 (3dc0146): gk P124 A18 B8 C16 D0; multi P363 A8 B30 C58 D0.
//   K3   every changed day carries exactly one class; item counts equal on every changed day; 0 _swapUniverse
//        diffs over the 5,280 program pairs of this limb (D1 covers the 8,280 above).
//   K4   calendar repeats (same accessory name on the calendar-adjacent shipped day, Monday-start, summed over
//        changed days, prev + next): gk 28->17, multi 78->16; class C days carry 0 on the candidate; the hand
//        calendar agrees with _progDayDate on every sampled day.
//   K5   SAMEDAY_TWIN_BY_VERSION: same-day duplicate names the candidate adds / removes vs V216 on changed days.
//   K6   FWD_MAIN_BY_VERSION: gk, an accessory today equals tomorrow's Main (within the Monday-start week).
//   INFO renames on the 8-day pair (_adjDayPairs: W(w) sat -> W(w+1) sun) printed, not asserted (D167 owns them).
//   Every K row is keyed on ia-version: its table row must exist (D160_MULTI_BY_VERSION for K1-K4,
//   SAMEDAY_TWIN_BY_VERSION for K5, FWD_MAIN_BY_VERSION for K6); above 217 an absent row FAILs (rulings 2/4).
//
// VERSION PREDICATE (standing ruling 4). D160 ships on ia-version 217.
//   below 217: NOT APPLICABLE, every row skipped by name, clean exit.
//   R1, R2, D1 and E1 say "this build moved only what D160 moves", so they run only on candidate 217 against
//   baseline 216
//   and SKIPs by name on every other pair. Every other row is ruling-level from 217 up.
//   V219 RESCOPE (standing ruling 4; session decision, coach concurred): K2, K3, K4, K5, K6 and K1's V216 ->
//   candidate delta are D160's build-scoped pair claims. For a candidate above 218 each prints
//   "SKIP pair row: candidate <v> is not D160's pair (217/218)" and does not count: from D170 on, later rulings
//   move V216-era cards by ruling, and D167's own class is asserted in its own gate. Durable on every build: I0,
//   F0 (a fixture of V216 itself), P1, W1, U1, U2, C1, K0 and K1's candidate side (0 phantoms). From 219 the
//   dedupe pairs by calendar (D167), so the candidate's previous day is the calendar previous day by
//   Monday-start date arithmetic (calPrev), never the pair the engine logged.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { load, progDigest, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const RAW = load(ART);
const VER = +RAW.version, ERA = 217, V216_COMMIT = '3dc0146e735e88aafec608d0a7d0f35f67cfa5e3';
const LATS = ['NRC','NRC multi','NSW','injury'];
const KNAMES = ['K0','K1 gk','K1 multi'];
const ROWS = ['I0','F0'].concat(LATS.map(l => 'P1 ' + l), ['W1','U1','U2','C1'], KNAMES);
// K limb era rows (coach, V217 re-ruling). A later version copies a row forward only by ruling.
const D160_MULTI_BY_VERSION = { 217: {
  phantoms: { 'gk pace+bike':[124,0], 'NSW pace+bike':[163,0], 'NSW pace+swim':[141,0], 'NSW pace+bike+swim':[59,0], 'NSW base+bike':[0,0] },
  events: { gk:{P:124,A:18,B:8,C:16,D:0}, multi:{P:363,A:8,B:30,C:58,D:0} },
  repeats: { gk:[28,17], multi:[78,16] } } };
D160_MULTI_BY_VERSION[218] = D160_MULTI_BY_VERSION[217];   // D157: ruled UNMOVED (phantoms 124/163/141/59/0 -> 0, events gk P124 A18 B8 C16 D0 multi P363 A8 B30 C58 D0, repeats gk 28->17 multi 78->16 printed by coach on the V218-stamped tree against V216)
let pass = 0, fail = 0, skip = 0, TMP = null;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = l => { skip++; console.log('SKIP ' + l); };
const CALPREV = VER >= 219;   // D167: the candidate's dedupe pairs by calendar
const ISO7 = ['mon','tue','wed','thu','fri','sat','sun'];
const calPrev = (w, d) => { const i = ISO7.indexOf(d); return i > 0 ? { w:+w, d:ISO7[i - 1] } : { w:+w - 1, d:'sun' }; };   // Monday-start date arithmetic
const done = () => { if(TMP) try { fs.rmSync(TMP, { recursive:true, force:true }); } catch(e){}
  console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D160 (V' + ERA + ').'); ROWS.forEach(r => skipRow(r + ' below the D160 era')); done(); }

// ── instrumented copies (source surgery, anchors count==1) ────────────────────────────────
TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'g217d160-'));
const cnt = (s, a) => s.split(a).length - 1;
const REN = '        it.name=to;\n        if(sec.label&&sec.label.indexOf(was)>=0) sec.label=sec.label.split(was).join(to);';
const LOG = '\n        (globalThis.__DD||(globalThis.__DD=[])).push({w:+wB,d:dB,was:was,to:to,pw:+wA,pd:dA});';
const HLP = 'function _d18View(A, wA, dA){';
const WRAP = 'function _d18View(A, wA, dA){ const _s=JSON.stringify(A), _r=_d18View__g217(A, wA, dA); globalThis.__VC=(globalThis.__VC||0)+1;'
  + ' if(JSON.stringify(A)!==_s) globalThis.__VM=(globalThis.__VM||0)+1; if(A&&_r===A) globalThis.__VS=(globalThis.__VS||0)+1; return _r; }\n'
  + 'function _d18View__g217(A, wA, dA){';
function instrument(src, tag, wantHelper){
  if(cnt(src, REN) !== 1) return { err: tag + ': rename writer anchor count ' + cnt(src, REN) };
  let s = src.replace(REN, () => REN + LOG), helper = false;
  if(wantHelper && cnt(s, HLP) === 1){ s = s.replace(HLP, () => WRAP); helper = true; }
  const f = path.join(TMP, tag + '.html'); fs.writeFileSync(f, s);
  return { X: load(f), helper };
}
const CAND = instrument(RAW.html, 'cand', true);
if(CAND.err){ ROWS.forEach(r => ok(r + ' (' + CAND.err + ')', false)); done(); }
let BASE = null, baseErr = '', BASE_RAW_DIGEST = null;
{ let src = null;
  if(BASEFILE){ const b = load(BASEFILE); if(+b.version === 216) src = b.html; else baseErr = 'argv[3] reads ' + b.version; }
  if(!src){ const s = cp.execFileSync('git', ['show', V216_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 26 }).toString('utf8');
    if(/ia-version" content="216"/.test(s)){ src = s; baseErr = ''; } else baseErr = 'git ' + V216_COMMIT.slice(0, 7) + ' does not read 216'; }
  if(src){ const r = instrument(src, 'v216', false); if(r.err) baseErr = r.err; else BASE = r.X;
    if(BASE){ const f = path.join(TMP, 'v216_raw.html'); fs.writeFileSync(f, src); BASE_RAW_DIGEST = progDigest(load(f).buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY)))); } } }

// ── oracles ──────────────────────────────────────────────────────────────────────────────
const tierFn = RAW.eval('_longRunTier');
const cl = o => JSON.parse(JSON.stringify(o));
const card = y => (y && !y.rest && y.cardio && !Array.isArray(y.cardio)) ? y.cardio : null;
const tierOf = y => { const c = card(y); return c ? (tierFn(c) || null) : null; };
const names = y => [].concat(...((y && y.sections) || []).map(s => (s.items || []).map(i => String((i && i.name) || ''))));
const dayOf = (p, w, d) => (p && p.weeks && p.weeks[w]) ? p.weeks[w][d] : undefined;
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const classify = (p, r, cal) => { const pv = cal ? calPrev(r.w, r.d) : { w:r.pw, d:r.pd }, P = dayOf(p, pv.w, pv.d); const ph = !names(P).map(n => n.toLowerCase()).includes(String(r.was).toLowerCase());
  const t = tierOf(P); return { ph, t, scope: ph && !!t }; };
function build(X, c){ X.window.__DD = []; const p = X.buildProgram(c); const dd = X.window.__DD; X.window.__DD = []; return { p, dd }; }

// ── I0 ───────────────────────────────────────────────────────────────────────────────────
{ const raw = progDigest(RAW.buildProgram(cl(fixtures.HALF_MANNY))), ins = progDigest(CAND.X.buildProgram(cl(fixtures.HALF_MANNY)));
  ok('I0 instrumentation inert: candidate HALF_MANNY raw ' + raw + ' == instrumented ' + ins
    + (BASE ? '; V216 raw ' + BASE_RAW_DIGEST + ' == instrumented ' + progDigest(BASE.buildProgram(cl(fixtures.HALF_MANNY))) : ''),
    raw === ins && (!BASE || BASE_RAW_DIGEST === progDigest(BASE.buildProgram(cl(fixtures.HALF_MANNY))))); }

// ── lattices (measure's) ─────────────────────────────────────────────────────────────────
const FOC6 = ['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const EQ = ['crossfit','commercial','home_full','home_basic','bodyweight'], EXP = ['beginner','intermediate','advanced'], AGE = ['18-35','36-54','55+'];
const WD = ['sun','mon','tue','wed','thu','fri','sat'];
const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
const PLANS = ['run_5k','run_10k','run_half','run_marathon'], RACED = ['2026-12-06','2027-01-17','2027-03-28'];
const MILE = [['7','30'],['8','15'],['10','30'],['12','0']];
const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
function nrcCfg(plan, o, i){
  const goals = {run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}}, types = ['run'];
  if(o.ex && o.ex.bike){ types.push('bike'); goals.bike = {id:o.ex.bike,label:o.ex.bike,baselineDist:'10',baseline:'10mi'}; }
  if(o.ex && o.ex.swim){ types.push('swim'); goals.swim = {id:o.ex.swim,label:o.ex.swim,baselineDist:'1000',baseline:'1000m'}; }
  return Object.assign(cl(fixtures.HALF_MANNY), {name:'M',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,
    eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:AGE[i%3],equipment:o.q,restDays:o.r.slice(),seed:76308}); }
const L = []; let ii = 0;
for(const plan of PLANS) for(const e of EXP) for(const r of RESTS) for(const q of EQ) for(const f of FOC6) for(const dated of [true,false]) L.push({lat:'NRC', c:nrcCfg(plan, {e,r,q,f,dated}, ii++)});
for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC6) for(const q of EQ) L.push({lat:'NRC multi', c:nrcCfg(plan, {ex,e:EXP[ii%3],r:RESTS[ii%2],q,f,dated:ii%2===0}, ii++)});
const STAND = {name:'M',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'x',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:WD.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; L.push({lat:'NSW', c}); }
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
for(const q of EQ) for(let si = 0; si < 8; si++) for(const rg of ['shoulder','elbow','lowback','hip','knee','ankle']) for(const t of ['workaround','protect']){
  const [g, x] = GOALS[si % 6];
  L.push({lat:'injury', c:{ name:'M', primaryPath:'goal', cardioTypes:['run'], cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:'hypertrophy', experience:EXP[si % 3], ageBracket:AGE[si % 3], equipment:q, unit:'lbs', restDays:[['sun','wed'],['sat','sun']][si % 2].slice(), days:WD.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si], injury:{region:rg,tier:t} }}); }

// ── sweep ────────────────────────────────────────────────────────────────────────────────
const S = {}; LATS.forEach(l => S[l] = { cfg:0, crash:0, cRen:0, cPh:{}, cOut:0, cUn:0, bRen:0, bPh:{}, bOut:0, bUn:0, ex:'' });
const EX = {}; let cfgMut = 0, cfgEx = '';
const TRIG = {}, TO = {};
CAND.X.window.__VC = 0; CAND.X.window.__VM = 0; CAND.X.window.__VS = 0;
L.forEach(x => {
  const s = S[x.lat]; let C, B = null;
  const cc = cl(x.c), snap = JSON.stringify(cc);
  try { C = build(CAND.X, cc); if(BASE) B = build(BASE, cl(x.c)); }
  catch(e){ s.crash++; if(s.crash < 3) console.log('CRASH ' + x.lat + ' ' + e.message); return; }
  s.cfg++;
  if(JSON.stringify(cc) !== snap){ cfgMut++; if(!cfgEx) cfgEx = x.lat + ' ' + x.c.equipment + '/' + x.c.liftingFocus; }
  // real days for U1, by the tier contract
  Object.keys(C.p.weeks).forEach(w => WD.forEach(d => { const y = dayOf(C.p, w, d); if(!y || y.rest || !Array.isArray(y.sections)) return;
    const t = tierOf(y) || (card(y) ? 'none' : null); if(t && !EX[t] && (t !== 'none' || y.sections.length)) EX[t] = { p:C.p, w, d, c:card(y) }; }));
  s.cRen += C.dd.length;
  C.dd.forEach(r => { if(!names(dayOf(C.p, r.w, r.d)).includes(r.to)) s.cUn++; const k = classify(C.p, r, CALPREV); if(k.scope){ bump(s.cPh, k.t); if(!s.ex) s.ex = x.lat + ' ' + x.c.equipment + '/' + x.c.liftingFocus + ' W' + r.w + ' ' + r.d + ' "' + r.was + '" -> "' + r.to + '" against W' + r.pw + ' ' + r.pd + ' (tier ' + k.t + ') shipping [' + names(dayOf(C.p, r.pw, r.pd)).join(', ') + ']'; } else if(k.ph) s.cOut++; });
  if(B){ s.bRen += B.dd.length;
    B.dd.forEach(r => { if(!names(dayOf(B.p, r.w, r.d)).includes(r.to)) s.bUn++; const k = classify(B.p, r); if(k.scope){ bump(s.bPh, k.t); bump(TRIG, r.was); bump(TO, r.to); } else { if(k.ph) s.bOut++; } });
  }
});
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
LATS.forEach(l => { const s = S[l];
  console.log('  ' + l + ': ' + s.cfg + ' configs, ' + s.crash + ' crashed | V216 renames ' + s.bRen + ', in-scope phantoms ' + sum(s.bPh) + ' ' + JSON.stringify(s.bPh) + ', other phantoms ' + s.bOut + ', unseen ' + s.bUn
    + ' | candidate renames ' + s.cRen + ', in-scope phantoms ' + sum(s.cPh) + ' ' + JSON.stringify(s.cPh) + ', other phantoms (not ruled) ' + s.cOut + ', unseen ' + s.cUn); });

// ── F0, P1, R1 ───────────────────────────────────────────────────────────────────────────
const tot = k => LATS.reduce((a, l) => a + (typeof S[l][k] === 'number' ? S[l][k] : sum(S[l][k])), 0);
if(BASE){ const byT = {}; LATS.forEach(l => Object.keys(S[l].bPh).forEach(t => bump(byT, t, S[l].bPh[t])));
  console.log('  V216 in-scope phantoms renamed to: ' + JSON.stringify(TO));
  ok('F0 fixture: V216 renames ' + tot('bRen') + ' (6919), in-scope phantoms ' + tot('bPh') + ' (102) NSW ' + sum(S.NSW.bPh) + ' (102) tiers ' + JSON.stringify(byT) + ' (A 8, B 94), other phantoms ' + tot('bOut') + ' (0), triggers ' + JSON.stringify(TRIG) + ', unseen ' + tot('bUn') + ' (983)',
    tot('bRen') === 6919 && tot('bPh') === 102 && sum(S.NSW.bPh) === 102 && byT.A === 8 && byT.B === 94 && Object.keys(byT).length === 2 && tot('bOut') === 0
    && JSON.stringify(TRIG) === JSON.stringify({'Kettlebell swing':102}) && tot('bUn') === 983 && tot('crash') === 0); }
else ok('F0 fixture: V216 baseline loads (' + baseErr + ')', false);
LATS.forEach(l => { const s = S[l];
  ok('P1 ' + l + ': 0 renames whose trigger the shipped long-run previous day does not print (' + s.cfg + ' configs, ' + s.crash + ' crashed)' + (s.ex ? ' e.g. ' + s.ex : ''), sum(s.cPh) === 0 && s.crash === 0 && s.cfg > 0, sum(s.cPh)); });
// R1, R2, D1 and E1 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it). They defended D160 CFb on its build pair (candidate 217 against V216): V216's renames minus its in-scope phantoms, the totals 6,817 / 0 / 983, the 62-program blast radius and the reporter example.

// ── W1, U1, U2, C1 ───────────────────────────────────────────────────────────────────────
{ const W = CAND.X.window;
  ok('W1 _d18View leaves the live previous day byte-identical on every call (' + (W.__VC || 0) + ' calls, ' + (W.__VM || 0) + ' mutated, ' + (W.__VS || 0) + ' returned the input)',
    CAND.helper && (W.__VC || 0) > 0 && !(W.__VM || 0) && !(W.__VS || 0), CAND.helper ? '' : 'helper _d18View absent'); }
const VIEW = CAND.helper ? RAW.eval('typeof _d18View==="function" ? _d18View : null') : null;
const objs = (o, set) => { if(o && typeof o === 'object'){ set.add(o); Object.keys(o).forEach(k => objs(o[k], set)); } return set; };
{ const got = [], need = ['A','B','C','none']; let good = !!VIEW;
  need.forEach(t => { const e = EX[t]; if(!e){ got.push(t + ':no day'); good = false; return; }
    if(!VIEW) return; const before = JSON.stringify(e.p.weeks), inp = e.p.weeks[e.w][e.d], v = VIEW(inp, e.w, e.d);
    const shared = [...objs(v, new Set())].filter(o => objs(inp, new Set()).has(o)).length;
    const same = JSON.stringify(e.p.weeks) === before; got.push(t + ':W' + e.w + ' ' + e.d + (same ? '' : ' WEEKS MUTATED') + (shared ? ' shares ' + shared : ''));
    if(!same || shared || v === inp) good = false; });
  ok('U1 _d18View on real shipped days leaves prog.weeks byte-identical and shares no object [' + got.join(', ') + ']', good, VIEW ? '' : 'helper absent'); }
{ const MOB = ['Standing calf stretch','Couch stretch','Hip 90/90 stretch','T-spine mobility','Foam roll'];
  const hand = c => ({ title:'Hand day', cardio:cl(c), tags:['lift'], sections:[
    { label:'Main — Deadlift', items:[{ name:'Deadlift', detail:'4×5 — RPE 8' }] },
    { label:'Loaded carry', items:[{ name:'Farmer carry', detail:'3×40 yd' }] },
    { label:'Accessory', items:[{ name:'Dumbbell bench press', detail:'3×10 — RPE 7' }] } ] });
  const want = { A: n => JSON.stringify(n) === JSON.stringify(MOB), B: n => n.includes('Dumbbell bench press') && !n.includes('Deadlift') && !n.includes('Farmer carry'),
    C: n => n.includes('Deadlift') && n.includes('Dumbbell bench press') && !n.includes('Farmer carry'), none: n => JSON.stringify(n) === JSON.stringify(['Deadlift','Farmer carry','Dumbbell bench press']) };
  const got = []; let good = !!VIEW;
  ['A','B','C','none'].forEach(t => { const e = EX[t]; if(!e || !e.c){ got.push(t + ':no card'); good = false; return; } if(!VIEW) return;
    const day = hand(e.c), before = JSON.stringify(day), v = VIEW(day, 1, 'mon'), n = names(v);
    const pass1 = want[t](n) && JSON.stringify(day) === before && (t !== 'none' || JSON.stringify(v) === before);
    got.push(t + ':[' + n.join(', ') + ']' + (JSON.stringify(day) === before ? '' : ' INPUT MUTATED')); if(!pass1) good = false; });
  ok('U2 the view is D18 by doctrine on a hand day, input untouched {' + got.join(' | ') + '}', good, VIEW ? '' : 'helper absent'); }
ok('C1 buildProgram leaves every lattice cfg byte-identical', cfgMut === 0, cfgMut + (cfgEx ? ' e.g. ' + cfgEx : ''));

// ── K LIMB: NSW multi-sport ──────────────────────────────────────────────────────────────
{ const IN6 = 'const inA=nameSet(A);', IN7 = 'const inA=nameSet(_d18View(A, wA, dA));', EMP = 'if(!cands.length) return;', KREN = '        it.name=to;\n';
  const VIEW6 = '(function(){const o={};o[wA]={};o[wA][dA]=JSON.parse(JSON.stringify(A));d18LongRunDayPass(o);return o[wA][dA];})()', VIEW7 = '_d18View(A, wA, dA)';
  const koInst = (h, IN, VIEW) => h.replace(IN, () => IN + ' const __pre=nameSet(A), __vw=nameSet(' + VIEW + '); (globalThis.__PA||(globalThis.__PA={}))[wA+"|"+dA+">"+wB+"|"+dB]=Object.keys(__pre).sort().join(",");')
    .replace(EMP, () => 'const __e={pw:+wA,pd:dA,w:+wB,d:dB,si:B.sections.indexOf(sec),ii:ii,was:it.name,pre:!!__pre[it.name.toLowerCase()],vw:!!__vw[it.name.toLowerCase()],n:cands.length,top:cands.slice(0,3),onB:Object.keys(onB).sort().join(","),to:null}; (globalThis.__TR||(globalThis.__TR=[])).push(__e); ' + EMP)
    .replace(KREN, () => KREN + '        __e.to=to;\n');
  let KO6 = null, KO7 = null, kErr = '', kMode = '';
  if(!BASE) kErr = 'no V216 baseline: ' + baseErr;
  else { const h6 = fs.readFileSync(path.join(TMP, 'v216_raw.html'), 'utf8'), h7 = RAW.html;
    const i7 = cnt(h7, IN7) === 1 ? [IN7, VIEW7] : cnt(h7, IN6) === 1 ? [IN6, VIEW6] : null;
    kMode = !i7 ? '' : i7[0] === IN7 ? 'candidate trigger reads the D18 view' : 'candidate trigger reads the raw day';
    const bad = [[h6, IN6], [h6, EMP], [h7, EMP], [h6, KREN], [h7, KREN]].filter(z => cnt(z[0], z[1]) !== 1).map(z => JSON.stringify(z[1]) + ' count ' + cnt(z[0], z[1]));
    if(!i7) bad.push('candidate trigger line matches neither form');
    if(bad.length) kErr = 'anchor: ' + bad.join('; ');
    else { const f6 = path.join(TMP, 'ko216.html'), f7 = path.join(TMP, 'ko217.html');
      fs.writeFileSync(f6, koInst(h6, IN6, VIEW6)); fs.writeFileSync(f7, koInst(h7, i7[0], i7[1])); KO6 = load(f6); KO7 = load(f7); } }
  if(kErr) KNAMES.forEach(r => ok(r + ' (' + kErr + ')', false));
  else {
    const ISO = ['mon','tue','wed','thu','fri','sat','sun'], OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6};
    const dix = (w, d) => (w - 1) * 7 + OFF[d];
    const lc = v => String(v == null ? '' : v).toLowerCase();
    const nK = y => [].concat(...((y && !y.rest && y.sections) || []).map(z => (z.items || []).map(i => String(i.name || ''))));
    const kb = (X, c) => { X.window.__TR = []; X.window.__PA = {}; const p = X.buildProgram(cl(c)); const r = { p, tr: X.window.__TR || [], pa: X.window.__PA || {} }; X.window.__TR = []; X.window.__PA = {}; return r; };
    const dig6 = progDigest(KO6.buildProgram(cl(fixtures.HALF_MANNY))), dig7 = progDigest(KO7.buildProgram(cl(fixtures.HALF_MANNY))), raw7 = progDigest(RAW.buildProgram(cl(fixtures.HALF_MANNY)));
    // lattices (copied): gk from tests/measure/v217_gk_lattice.js, pace+bike only, injury by the full 6,480 index
    const KL = [];
    { const ALL = ['sun','mon','tue','wed','thu','fri','sat'], mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
      const GOALS = [ {k:'pace', types:['run'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}}},
        {k:'base', types:['run'], goals:{run:{id:'run_base', label:'B', ...mb}}},
        {k:'half', types:['run'], goals:{run:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}}, race:'2026-12-06'},
        {k:'mara', types:['run'], goals:{run:{id:'run_marathon', label:'M', ...mb, baselineDist:'8', baseline:'8mi'}}},
        {k:'pace+bike', types:['run','bike'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_base', label:'Bb'}}},
        {k:'bike', types:['bike'], goals:{bike:{id:'bike_base', label:'Bb'}}} ];
      const INJ = [null, null, {region:'knee',tier:'workaround'}, {region:'elbow',tier:'workaround'}];
      const all = []; for(const G of GOALS) for(const eq of ['commercial','crossfit','home_full','home_basic','bodyweight']) for(const fo of ['strength','hypertrophy','balanced','support_prevention','support_athletic','fatloss']) for(const ex of ['beginner','intermediate','advanced']) for(const rs of [['sun','wed'], ['sat','sun'], ['mon','thu','sun'], ['sun']]) for(const seed of [24865, 76308, 99991]) all.push({G, eq, fo, ex, rs, seed});
      all.forEach((x, i) => { if(x.G.k !== 'pace+bike') return; const inj = INJ[i % 4];
        const c = {name:'GK', primaryPath:'event', eventTargeted:!!x.G.race, raceDate:x.G.race||'', cardioTypes:x.G.types.slice(), cardioGoals:cl(x.G.goals), liftingFocus:x.fo, experience:x.ex, ageBracket:'18-35', equipment:x.eq, unit:'lbs', restDays:x.rs, days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed:x.seed};
        if(inj) c.injury = inj; KL.push({lim:'gk', mix:'gk pace+bike', c}); }); }
    // multi from tests/measure/v217_d160_multisport_knockons.js (LAT=multi)
    { const MIX = [['pace+bike','run_pace_goal',{bike:1}],['pace+swim','run_pace_goal',{swim:1}],['pace+bike+swim','run_pace_goal',{bike:1,swim:1}],['base+bike','run_base',{bike:1}]];
      for(const [mk, g, o] of MIX) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6.concat(['fatloss'])) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
        const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e;
        if(o.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = {id:'bike_base',label:'Bb',baselineDist:'10',baseline:'10mi'}; }
        if(o.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = {id:'swim_base',label:'Sb',baselineDist:'1000',baseline:'1000m'}; }
        KL.push({lim:'multi', mix:'NSW ' + mk, c}); } }
    const KCOUNT = { gk:1080, multi:4200 };
    const KS = {}, kz = l => KS[l] || (KS[l] = { cfg:0, crash:0, progs:0, days:{} });
    const PH = {}, GAP = {};
    KL.forEach(x => {
      const s = kz(x.lim); let a, b;
      try { a = kb(KO6, x.c); b = kb(KO7, x.c); } catch(e){ s.crash++; if(s.crash < 3) console.log('CRASH K ' + x.mix + ' ' + e.message); return; }
      s.cfg++;
      const P = PH[x.mix] || (PH[x.mix] = [0, 0, 0, 0]), G = GAP[x.mix] || (GAP[x.mix] = {});
      [[a, 0], [b, 1]].forEach(([r, k]) => r.tr.forEach(e => { if(!e.to) return;
        { const pv = (k && CALPREV) ? calPrev(e.w, e.d) : { w:e.pw, d:e.pd }; if(!nK(dayOf(r.p, pv.w, pv.d)).map(lc).includes(lc(e.was))) P[k]++; }
        if(e.pre && !e.vw) P[k + 2]++;
        const gk = (k ? 'cand' : 'V216') + ' gap ' + (dix(e.w, e.d) - dix(e.pw, e.pd)); G[gk] = (G[gk] || 0) + 1; }));
      const posKey = e => e.w + '|' + e.d + '|' + e.si + '|' + e.ii, pairK = e => e.pw + '|' + e.pd + '>' + e.w + '|' + e.d;
      const m6 = new Map(a.tr.map(e => [posKey(e), e])), m7 = new Map(b.tr.map(e => [posKey(e), e])), dayCls = {};
      new Set([...m6.keys(), ...m7.keys()]).forEach(k => { const e6 = m6.get(k), e7 = m7.get(k), o6 = e6 ? e6.to : null, o7 = e7 ? e7.to : null; if(o6 === o7) return;
        const e = e6 || e7, aDiff = a.pa[pairK(e)] !== b.pa[pairK(e)];
        const c = (o6 && !o7 && e6.pre && !e6.vw && !aDiff) ? 'P' : aDiff ? 'A' : (o6 && o7) ? 'B' : (o7 && !o6) ? 'C' : 'D';
        (dayCls[e.w + '|' + e.d] = dayCls[e.w + '|' + e.d] || new Set()).add(c); });
      let chg = 0;
      for(const w of Object.keys(b.p.weeks)) for(const d of ISO){ const y6 = dayOf(a.p, w, d), y7 = dayOf(b.p, w, d); if(JSON.stringify(y6) === JSON.stringify(y7)) continue; chg++;
        const cs = dayCls[w + '|' + d] ? [...dayCls[w + '|' + d]].sort().join('+') : '';
        if(cs.length === 1) s.days[cs] = (s.days[cs] || 0) + 1; }
      if(chg) s.progs++;
    });
    const LIMS = ['gk','multi'];
    LIMS.forEach(l => { const s = kz(l); console.log('  K ' + l + ': ' + s.cfg + ' configs, ' + s.crash + ' crashed, ' + s.progs + ' programs changed, changed days by class ' + JSON.stringify(s.days)); });
    Object.keys(PH).forEach(m => console.log('  K ' + m + ': phantoms (shipped previous day) V216 ' + PH[m][0] + ' cand ' + PH[m][1] + ' | (instrument: raw A yes, D18 view no) V216 ' + PH[m][2] + ' cand ' + PH[m][3]));
    Object.keys(GAP).forEach(m => console.log('  INFO ' + m + ' renames by dedupe-pair calendar gap (8 = W(w) sat -> W(w+1) sun, D167, not asserted): ' + JSON.stringify(GAP[m])));
    ok('K0 knock-on instrument inert: V216 HALF_MANNY instrumented ' + dig6 + ' == raw ' + BASE_RAW_DIGEST + ', candidate instrumented ' + dig7 + ' == raw ' + raw7 + ' [' + kMode + ']', dig6 === BASE_RAW_DIGEST && dig7 === raw7);
    // K1's V216 -> candidate delta, K2 gk/multi, K3, K4 gk/multi, K5 gk/multi and K6 (D160's V217/218 pair claims, dark from PAIR_SCOPE = VER <= 218) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
    { const K1MIX = Object.keys(D160_MULTI_BY_VERSION[217].phantoms);
      LIMS.forEach(l => { const s = kz(l), mixes = K1MIX.filter(m => (/^gk /.test(m) ? 'gk' : 'multi') === l);
        ok('K1 ' + l + ' candidate phantoms == 0, trigger absent from the calendar previous shipped day (' + s.cfg + '/' + KCOUNT[l] + ' configs, ' + s.crash + ' crashed): ' + mixes.map(m => m + ' ' + (PH[m] || ['-', '-'])[1]).join(', '),
          s.cfg === KCOUNT[l] && s.crash === 0 && mixes.length > 0 && mixes.every(m => PH[m] && PH[m][1] === 0)); });
    }
  } }
done();
