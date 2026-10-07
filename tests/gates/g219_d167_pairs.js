// g219_d167_pairs.js — GATE for D167 (+ D167a) and D171 (coach): THE ADJACENT-DAY DEDUPE WALKS THE CALENDAR THE WEEK RENDERS.
//
//   node tests/gates/g219_d167_pairs.js [candidate] [baseline V218]
//
// THE RULINGS THIS DEFENDS (not the version they ship on):
//   D167   `_adjDayPairs` walked Sun..Sat and paired W sat with W+1 sun (8 days apart) while the week renders Mon..Sun.
//          CFs: pairs Mon..Sun plus W sun -> W+1 mon, walked in calendar order, each pair keeping the seed index its
//          A day holds today. "CFs moves 370 programs / 859 days, almost all Sunday and Monday. The legacy index is a
//          label the RNG reads; a later ruling may reseed it. Sunday-resting athletes are byte-identical."
//   D167a  a mid-week event is licensed only when (a) the previous calendar day is itself in the A set, (b) the day's
//          diff is confined to the dedupe swap (equal item count, 0 losses), (c) the swap stays within pattern, depth 1.
//   D171   the two Sunday-first "tomorrow" readers read the calendar's tomorrow: "155 Saturday hinge accessories stay
//          RPE 8 before a hot Sunday, 2 Sundays clamped for nothing." hotNextHingeClampSweep is defended by D171.T;
//          buildProgram's inline `hotNext` (the `_ISO_ORDER.length-1` form) is UNDEFENDED: not a callable unit, and
//          reverting it is inert on all 15,180 lattice configs.
//
// ORACLES, independent of the engine under test:
//   CAL    Monday-start date arithmetic: a day's calendar index is (w-1)*7 + {mon:0 .. sun:6}; its predecessor is
//          index-1, its tomorrow index+1; the block's first day is W1 Monday (index 0) and has no predecessor, the
//          final Sunday has no tomorrow. The pinned startDates of the lattice (2026-09-21, 2026-10-05) are Mondays.
//          `_adjDayPairs` is never called or read for what a pair is.
//   CARD   the shipped day cards themselves (JSON per calendar day), read off prog.weeks.
//   WALK   the legacy walk typed by hand from D167's text (Sun..Sat, W sat -> W+1 sun, no 5th element, so every pair
//          seeds from its position in that walk: the index each A day held before D167).
//   PAT    a hand table (below) for "within pattern" on the licensed cascade swaps; a name not in it fails.
//   LENS   hinge membership (D171.T) is read through the FROZEN V218 artifact's _pattern. The candidate's own lens
//          is never consulted.
//
// ARMS
//   V218   git 44fd483 (or argv[3] when it reads 218). Frozen before-picture for B0/F0 and the LENS.
//   CAND   the candidate, with one inert logging line at the dedupe rename (`        it.name=to;` count==1) that
//          records [the day object being renamed, the name before]. The day is LOCATED by object identity in the
//          shipped program, never by the engine's pair coordinates. D1 and D171.T read CAND.
//   LW     CAND with its `function _adjDayPairs(...)` replaced by WALK (anchor count==1). D167.Z/D167.H read CAND vs LW.
//
// LATTICE: the D167 lattice of tests/measure/v219_chain_rebaseline.js (lat 'C', 15,180 configs), copied verbatim.
//   Swept: ALL 3,900 Sunday-training configs + every 8th Sunday-rest config in lattice order (1,410 of 11,280).
//
// ROWS (every build >= 219)
//   B0   V218 reads 218; V218 equals itself; both logging lines are inert (progDigest) on every 50th swept config.
//   F0   fixture: V218's dedupe makes renames whose name is NOT on the calendar-previous card (so D1 can fail).
//   D1   every dedupe rename in CAND lands on a day located in the shipped program whose calendar predecessor's
//        shipped card carries the renamed name; 0 renames on W1 Monday; renames > 0.
//   D167.Z  FORWARD (K2a.Z's claim; v219 S1-D167's guard): 0 swept Sunday-rest configs differ, CAND vs LW; and LW moves
//           > 0 Sunday-training programs, so the walk is live (V218, whose own walk is WALK, fails it).
//   D167.H  FORWARD (K2a.H, K2a.P and D167a's claims; S1-D167's guards): every day LW moves on a Sunday-training
//           config is a Sunday or a Monday, or a mid-week day licensed by D167a (a)(b)(c) at depth 1; moved > 0.
//   D171.T  FORWARD (K2b.N and K2b.T's claim; v219 S3-D171's guard): no hinge item (LENS) on a training day whose
//           calendar tomorrow (CAL) carries legLoad cardio (CARD) keeps '@ RPE 8' or 'RPE 8 (stop 2 reps short of
//           failure)'; > 0 such items sit on a final Saturday.
//   K2a.H, K2a.P, K2a.L, K2a.Z, D167a, K2b.N, K2b.T, R1 and R2 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
//        They pinned D167/D171 on the build pair (219 vs V218 and the XP transplant). PARKED (standing ruling 7):
//        R2's claim ("CAND calendar repeats sat>sun 28, sun>mon 6", v219 S4-D167's only guard) has no forward form
//        with an independent oracle (whether a swap was legal needs the build's own swap universe), and its count
//        form (a ceiling of 28 / 6) does not hold at 233: 36 / 6 from V226 (D188/D189, measure mE's bisect).
//
// VERSION PREDICATE (standing rulings 2 and 4). D167/D171 ship on ia-version 219.
//   below 219: REFUSED, every row FAILS by name (never a vacuous pass). 219 and above: every row runs.
// env: G219_SHARDS (default min(4, cpus)).
'use strict';
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { load, progDigest, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEFILE = process.argv[3] || null;
const ERA = 219, V218_COMMIT = '44fd4830f9653e790aa43477787374cd29711988';
const DUR_ROWS = ['B0','F0','D1','D167.Z','D167.H','D171.T'];
const cl = o => JSON.parse(JSON.stringify(o)), cnt = (s, a) => s.split(a).length - 1;
const OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}, ISO = Object.keys(OFF);

// ── lattice (verbatim from tests/measure/v219_chain_rebaseline.js, lat 'C') ─────────────────────────
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const U = [];
{ const WD = ['sun','mon','tue','wed','thu','fri','sat'];
  const STAND = {name:'M',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'x',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
    liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:WD.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
  const FOC6 = ['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
  const EQ = ['crossfit','commercial','home_full','home_basic','bodyweight'], EXP = ['beginner','intermediate','advanced'], AGE = ['18-35','36-54','55+'];
  const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
  const P = x => U.push(Object.assign({ lat:'C', eq:x.c.equipment, ik: x.c.injury ? x.c.injury.region + '/' + x.c.injury.tier : 'healthy', f:x.c.liftingFocus }, x));
  const PLANS = ['run_5k','run_10k','run_half','run_marathon'], RACED = ['2026-12-06','2027-01-17','2027-03-28'], MILE = [['7','30'],['8','15'],['10','30'],['12','0']];
  const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
  const nrc = (plan, o, i) => { const goals = {run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}}, types = ['run'];
    if(o.ex && o.ex.bike){ types.push('bike'); goals.bike = {id:o.ex.bike,label:o.ex.bike,baselineDist:'10',baseline:'10mi'}; }
    if(o.ex && o.ex.swim){ types.push('swim'); goals.swim = {id:o.ex.swim,label:o.ex.swim,baselineDist:'1000',baseline:'1000m'}; }
    return Object.assign(cl(fixtures.HALF_MANNY), {name:'M',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:AGE[i%3],equipment:o.q,restDays:o.r.slice(),seed:76308}); };
  let ii = 0;
  for(const plan of PLANS) for(const e of EXP) for(const r of RESTS) for(const q of EQ) for(const f of FOC6) for(const dated of [true,false]) P({mix:'NRC solo', c:nrc(plan, {e,r,q,f,dated}, ii++)});
  for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC6) for(const q of EQ) P({mix:'NRC multi', c:nrc(plan, {ex,e:EXP[ii%3],r:RESTS[ii%2],q,f,dated:ii%2===0}, ii++)});
  for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
    const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; P({mix:'NSW solo', c}); }
  for(const q of EQ) for(let si = 0; si < 8; si++) for(const rg of ['shoulder','elbow','lowback','hip','knee','ankle']) for(const t of ['workaround','protect']){ const [g, x] = GOALS[si % 6];
    P({mix:'injury', c:{ name:'M', primaryPath:'goal', cardioTypes:['run'], cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) }, eventTargeted:false, liftingFocus:'hypertrophy', experience:EXP[si % 3], ageBracket:AGE[si % 3], equipment:q, unit:'lbs', restDays:[['sun','wed'],['sat','sun']][si % 2].slice(), days:WD.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si], injury:{region:rg,tier:t} }}); }
  const MIX = [['pace+bike','run_pace_goal',{bike:1}],['pace+swim','run_pace_goal',{swim:1}],['pace+bike+swim','run_pace_goal',{bike:1,swim:1}],['base+bike','run_base',{bike:1}]];
  for(const [mk2, g, o] of MIX) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6.concat(['fatloss'])) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
    const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e;
    if(o.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = {id:'bike_base',label:'Bb',baselineDist:'10',baseline:'10mi'}; }
    if(o.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = {id:'swim_base',label:'Sb',baselineDist:'1000',baseline:'1000m'}; }
    P({mix:'NSW multi ' + mk2, c}); }
  const ALL = ['sun','mon','tue','wed','thu','fri','sat'], mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}}; const INJ4 = [null, null, {region:'knee',tier:'workaround'}, {region:'elbow',tier:'workaround'}]; let j = 0;
  for(const eq of ['commercial','crossfit','home_full','home_basic','bodyweight']) for(const fo of ['strength','hypertrophy','balanced','support_prevention','support_athletic','fatloss']) for(const ex of EXP) for(const rs of [['sun','wed'], ['sat','sun'], ['mon','thu','sun'], ['sun']]) for(const seed of [24865, 76308, 99991]){ const inj = INJ4[(j++) % 4];
    const c = {name:'GK', primaryPath:'event', eventTargeted:false, raceDate:'', cardioTypes:['run','bike'], cardioGoals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_base', label:'Bb'}}, liftingFocus:fo, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:rs, days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed};
    if(inj) c.injury = inj; P({mix:'gk pace+bike', c}); }
  const RS2 = [[], ['mon'], ['wed'], ['fri'], ['sat'], ['mon','fri'], ['wed','sat'], ['tue','fri'], ['mon','thu']];
  for(const [g, nrcp] of [['run_half', true], ['run_pace_goal', false]]) for(const r of RS2) for(const f of FOC6) for(const q of EQ) for(const e of EXP){
    const c = nrcp ? Object.assign(cl(fixtures.HALF_MANNY), {name:'M', primaryPath:'fitness', eventTargeted:false, raceDate:'', startDate:'2026-09-21', cardioTypes:['run'], cardioGoals:{run:{id:g,label:g,mileBestMins:'8',mileBestSecs:'15',baselineDist:'5',baseline:'5mi'}}, liftingFocus:f, experience:e, equipment:q, restDays:r.slice(), seed:76308}) : Object.assign(cl(STAND), {liftingFocus:f, experience:e, equipment:q, restDays:r.slice()});
    P({mix:'rest sweep ' + (nrcp ? 'NRC half' : 'NSW pace'), c}); }
}
const SUNREST = x => x.c.restDays.includes('sun');
const SW = []; { let k = 0; U.forEach((x, i) => { if(!SUNREST(x)) SW.push(i); else if((k++) % 8 === 0) SW.push(i); }); }

// ── hand pattern table for D167a (c): hip-hinge family, by doctrine, typed by hand ─────────────────
const HAND_PAT = { 'dumbbell romanian deadlift':'hinge', 'kettlebell swing':'hinge' };
// ── WALK: the legacy walk, typed by hand from D167's text (Sun..Sat, W sat -> W+1 sun, 4-element pairs) ────────
const WALK = "function _adjDayPairs(totalWeeks){\n  const SS=['sun','mon','tue','wed','thu','fri','sat'], out=[];\n"
  + "  for(let w=1;w<=totalWeeks;w++){\n    for(let i=1;i<7;i++) out.push([w,SS[i-1],w,SS[i]]);\n"
  + "    if(w<totalWeeks) out.push([w,'sat',w+1,'sun']);\n  }\n  return out;\n}\n";

// ── card oracles ────────────────────────────────────────────────────────────────────────────────────
const calOf = p => { const m = {}; Object.keys((p && p.weeks) || {}).forEach(w => ISO.forEach(d => { const y = p.weeks[w] && p.weeks[w][d]; if(y !== undefined) m[(+w - 1) * 7 + OFF[d]] = { w:+w, d, y }; })); return m; };
const lastWeek = p => Math.max.apply(null, Object.keys(p.weeks).map(Number));
const trains = y => !!(y && !y.rest && Array.isArray(y.sections));
const namesOn = y => new Set((trains(y) ? y.sections : []).flatMap(s => ((s && s.items) || []).map(i => String((i && i.name) || '').toLowerCase())));
const noKey = (y, key) => JSON.stringify(y, (k, v) => k === key ? undefined : v);
function swapOnly(ya, yb){   // D167a (b): same day shell, same sections, same item counts; differing items are swaps
  if(!trains(ya) || !trains(yb)) return { ok:false, why:'not a training day' };
  if(noKey(ya, 'sections') !== noKey(yb, 'sections')) return { ok:false, why:'day shell differs' };
  if(ya.sections.length !== yb.sections.length) return { ok:false, why:'section count' };
  const sw = [];
  for(let si = 0; si < ya.sections.length; si++){ const a = ya.sections[si], b = yb.sections[si];
    if(noKey(a, 'items') !== noKey(b, 'items')) return { ok:false, why:'section shell ' + si };
    const ia = (a && a.items) || [], ib = (b && b.items) || []; if(ia.length !== ib.length) return { ok:false, why:'item count ' + si };
    for(let k = 0; k < ia.length; k++){ if(ia[k].name === ib[k].name){ if(JSON.stringify(ia[k]) !== JSON.stringify(ib[k])) return { ok:false, why:'same name, other field differs' }; }
      else sw.push([ia[k].name, ib[k].name, a.label]); } }
  return sw.length ? { ok:true, sw } : { ok:false, why:'no swap' };
}

// ── worker ──────────────────────────────────────────────────────────────────────────────────────────
if(process.env.G219SHARD !== undefined){
  const si = +process.env.G219SHARD, sn = +process.env.G219SHARDS, DIR = process.env.G219DIR;
  const A = JSON.parse(fs.readFileSync(path.join(DIR, 'arts.json'), 'utf8'));
  const Vi = load(A.v218i), Ci = load(A.candi), LW = A.lw ? load(A.lw) : null, V = load(A.v218), C = load(ART);
  const PAT = Vi.eval('_pattern');
  const T = {}, EX = {}, CAS = []; const bump = (k, n = 1) => { T[k] = (T[k] || 0) + n; }; const ex = (k, s) => { (EX[k] = EX[k] || []); if(EX[k].length < 4) EX[k].push(s); };
  const runLog = (X, cfg) => { X.eval('globalThis.__G219R=[]'); const p = X.buildProgram(cl(cfg)); const R = X.eval('globalThis.__G219R') || []; X.eval('globalThis.__G219R=[]'); return { p, R }; };
  const audit = (p, R, pre, tag) => { const dl = new Map(); Object.keys(p.weeks).forEach(w => ISO.forEach(d => { const y = p.weeks[w] && p.weeks[w][d]; if(y && typeof y === 'object') dl.set(y, (+w - 1) * 7 + OFF[d]); }));
    const cal = calOf(p);
    R.forEach(([day, was]) => { bump(pre + 'renames'); const ix = dl.get(day);
      if(ix === undefined){ bump(pre + 'unlocated'); ex(pre + 'unlocated', tag); return; }
      if(ix === 0){ bump(pre + 'first day'); ex(pre + 'first day', tag + ' W1 mon was ' + was); return; }
      const A0 = cal[ix - 1]; if(!(A0 && namesOn(A0.y).has(String(was).toLowerCase()))){ bump(pre + 'not on prev'); ex(pre + 'not on prev', tag + ' W' + (Math.floor(ix / 7) + 1) + ' ' + ISO[ix % 7] + ' was ' + was); } }); };
  for(let q = si; q < SW.length; q += sn){ const i = SW[q], x = U[i], sr = SUNREST(x), grp = sr ? 'sunREST' : 'sunTRAIN';
    const tag = x.mix + ' ' + x.c.equipment + '/' + x.c.liftingFocus + '/' + x.c.experience + ' rest ' + (x.c.restDays.join(',') || '-') + ' seed ' + x.c.seed + ' #' + i;
    bump('cfg ' + grp);
    const v = runLog(Vi, x.c), c = runLog(Ci, x.c);
    if(q % 50 === si % 50){ bump('B0 sampled'); const v1 = V.buildProgram(cl(x.c)), v2 = V.buildProgram(cl(x.c)), c1 = C.buildProgram(cl(x.c));
      if(progDigest(v1) !== progDigest(v2)) bump('B0 V218 != itself'); if(progDigest(v1) !== progDigest(v.p)) bump('B0 V218 log not inert'); if(progDigest(c1) !== progDigest(c.p)) bump('B0 CAND log not inert'); }
    audit(v.p, v.R, 'F0 ', tag); audit(c.p, c.R, 'D1 ', tag);
    // D171.T (forward, CAND alone): a hinge item on the eve of a legLoad day carries no RPE 8 clamp grammar
    { const cc = calOf(c.p), LWK = lastWeek(c.p);
      Object.keys(cc).map(Number).forEach(ix => { const a = cc[ix], b = cc[ix + 1]; if(!a || !b || !trains(a.y) || !(b.y && b.y.cardio && b.y.cardio.legLoad)) return;
        const fin = a.w === LWK && a.d === 'sat';
        a.y.sections.forEach(sec => ((sec && sec.items) || []).forEach(it => { if(!it || !it.name || PAT(it.name) !== 'hinge') return; const det = String(it.detail || '');
          bump('T eve hinge'); if(fin) bump('T final sat hinge');
          if(det.indexOf('@ RPE 8') >= 0 || det.indexOf('RPE 8 (stop 2 reps short of failure)') >= 0){ bump('T unclamped'); if(fin) bump('T unclamped final sat'); ex('T unclamped', tag + ' W' + a.w + ' ' + a.d + ' ' + it.name + ' ' + JSON.stringify(det)); }
          else if(det.indexOf('@ RPE 7') >= 0 || det.indexOf('RPE 7 (leave 3 or more in reserve)') >= 0){ bump('T clamp form'); if(fin) bump('T clamp form final sat'); } })); }); }
    if(!LW) continue;
    // D167.Z / D167.H (forward): CAND vs LW, the candidate with the hand-typed Sun..Sat walk put back
    const xl = LW.buildProgram(cl(x.c)); const cc2 = calOf(c.p), cl2 = calOf(xl);
    const EV = new Set(); new Set(Object.keys(cc2).concat(Object.keys(cl2))).forEach(k => { if(JSON.stringify(cc2[k] && cc2[k].y) !== JSON.stringify(cl2[k] && cl2[k].y)) EV.add(+k); });
    if(sr){ if(EV.size){ bump('Z sunREST programs'); ex('Z sunREST', tag + ' ' + [...EV].slice(0, 4).map(ix => 'W' + (Math.floor(ix / 7) + 1) + ' ' + ISO[ix % 7]).join(',')); } continue; }
    if(EV.size) bump('H programs');
    const mid = ix => { const d = ISO[ix % 7]; return d !== 'sun' && d !== 'mon'; };
    const depth = ix => (EV.has(ix - 1) && mid(ix - 1)) ? 1 + depth(ix - 1) : 1;
    EV.forEach(ix => { const d = ISO[ix % 7], w = Math.floor(ix / 7) + 1; bump('H days ' + d); if(!mid(ix)) return;
      const ya = cl2[ix] && cl2[ix].y, yb = cc2[ix] && cc2[ix].y, sw = swapOnly(ya, yb);
      const pat = sw.ok && sw.sw.every(([p0, q0]) => HAND_PAT[String(p0).toLowerCase()] && HAND_PAT[String(p0).toLowerCase()] === HAND_PAT[String(q0).toLowerCase()]);
      const z = { tag, w, d, a:EV.has(ix - 1), b:sw.ok, why:sw.why || '', c:!!pat, depth:depth(ix), sw:(sw.sw || []).map(q => q[0] + ' -> ' + q[1] + ' [' + q[2] + ']').join('; ') };
      if(!(z.a && z.b && z.c && z.depth === 1)) bump('H unlicensed'); if(CAS.length < 40) CAS.push(z); else bump('H cascades unlisted'); });
  }
  fs.writeFileSync(process.env.G219OUT, JSON.stringify({ T, EX, CAS }));
  process.exit(0);
}

// ── main ────────────────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0, skip = 0, TMP = null;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { if(TMP) try { fs.rmSync(TMP, { recursive:true, force:true }); } catch(e){}
  console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const IA = load(ART), VER = +IA.version;
console.log('g219 D167/D171 | candidate ' + ART + ' ia-version ' + VER + ' | lattice ' + U.length + ' configs, swept ' + SW.length + ' (' + U.filter(x => !SUNREST(x)).length + ' Sunday-training + every 8th of ' + U.filter(SUNREST).length + ' Sunday-rest)');
if(VER < ERA){ console.log('REFUSED: ia-version ' + VER + ' predates D167/D171 (V' + ERA + '). No row may pass on it.');
  DUR_ROWS.forEach(r => ok(r + ' refused: candidate ' + VER + ' is below the D167 era', false)); done(); }
const MONDAY = ['2026-09-21', '2026-10-05'].every(s => new Date(s + 'T12:00:00Z').getUTCDay() === 1);

let setupErr = null, lwErr = null;
try {
  TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'g219d167-'));
  let vFile = null;
  if(BASEFILE){ const b = load(BASEFILE); if(+b.version === 218) vFile = path.resolve(BASEFILE); else console.log('  argv[3] reads ' + b.version + ', using git ' + V218_COMMIT.slice(0, 7)); }
  if(!vFile){ vFile = path.join(TMP, 'v218.html'); fs.writeFileSync(vFile, cp.execFileSync('git', ['show', V218_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 })); }
  const V = fs.readFileSync(vFile, 'utf8'), C = fs.readFileSync(ART, 'utf8');
  if(+load(vFile).version !== 218) throw new Error('V218 baseline reads ' + load(vFile).version);
  const LOGA = '        it.name=to;\n', LOGI = '        (globalThis.__G219R||(globalThis.__G219R=[])).push([(typeof B!=="undefined"?B:null),it.name]);\n';
  [['V218', V], ['candidate', C]].forEach(([n, s]) => { if(cnt(s, LOGA) !== 1) throw new Error('rename anchor count ' + cnt(s, LOGA) + ' in ' + n); });
  const arts = { v218:vFile, v218i:path.join(TMP, 'v218i.html'), candi:path.join(TMP, 'candi.html'), lw:null };
  fs.writeFileSync(arts.v218i, V.replace(LOGA, () => LOGI + LOGA)); fs.writeFileSync(arts.candi, C.replace(LOGA, () => LOGI + LOGA));
  try {
    const FN = 'function _adjDayPairs(', Ci = fs.readFileSync(arts.candi, 'utf8');
    if(cnt(Ci, FN) !== 1) throw new Error(FN + ' count ' + cnt(Ci, FN) + ' in the candidate');
    const i0 = Ci.indexOf(FN), k0 = Ci.indexOf('\n}\n', i0); if(k0 < 0) throw new Error('no close of _adjDayPairs in the candidate');
    const X = Ci.slice(0, i0) + WALK + Ci.slice(k0 + 3); if(cnt(X, WALK) !== 1 || cnt(X, FN) !== 1) throw new Error('legacy walk did not land');
    arts.lw = path.join(TMP, 'lw.html'); fs.writeFileSync(arts.lw, X);
    console.log('  legacy walk: candidate _adjDayPairs ' + (Ci.slice(i0, k0 + 3) === WALK ? 'IDENTICAL to' : 'replaced by') + ' the hand-typed Sun..Sat walk');
  } catch(e){ lwErr = String(e && e.message || e).slice(0, 200); }
  fs.writeFileSync(path.join(TMP, 'arts.json'), JSON.stringify(arts));
} catch(e){ setupErr = String(e && e.message || e).slice(0, 300); }
if(setupErr){ console.log('SETUP FAILED: ' + setupErr); DUR_ROWS.forEach(r => ok(r + ' (setup: ' + setupErr + ')', false)); done(); }

const SH = Math.max(1, parseInt(process.env.G219_SHARDS || String(Math.min(4, os.cpus().length)), 10));
const t0 = Date.now(); let fin = 0, crashed = 0; const outs = [];
for(let s = 0; s < SH; s++){ const o = path.join(TMP, 's' + s + '.json'); outs.push(o);
  cp.fork(__filename, [ART], { env:Object.assign({}, process.env, { G219SHARD:String(s), G219SHARDS:String(SH), G219OUT:o, G219DIR:TMP }), stdio:'inherit' })
    .on('exit', code => { if(code !== 0){ crashed++; console.log('  shard ' + s + ' exited ' + code); } if(++fin === SH) report(); }); }

function report(){
  const T = {}, EX = {}, CAS = [];
  outs.forEach(o => { if(!fs.existsSync(o)) return; const r = JSON.parse(fs.readFileSync(o, 'utf8')); Object.keys(r.T).forEach(k => T[k] = (T[k] || 0) + r.T[k]);
    Object.keys(r.EX).forEach(k => EX[k] = (EX[k] || []).concat(r.EX[k]).slice(0, 4)); r.CAS.forEach(z => CAS.push(z)); });
  const g = k => T[k] || 0, sumP = p => Object.keys(T).filter(k => k.indexOf(p) === 0).reduce((a, k) => a + T[k], 0);
  const exs = k => (EX[k] || []).map(s => '\n      e.g. ' + s).join('');
  console.log('  swept ' + (g('cfg sunTRAIN') + g('cfg sunREST')) + ' configs (' + g('cfg sunTRAIN') + ' Sunday-training, ' + g('cfg sunREST') + ' Sunday-rest) in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s on ' + SH + ' shards');
  ok('SH all ' + SH + ' shards exited clean and wrote a result', crashed === 0 && outs.every(o => fs.existsSync(o)), crashed + ' crashed');
  const swept = g('cfg sunTRAIN') + g('cfg sunREST');
  // B0 / F0 / D1 (durable)
  ok('B0 baselines: V218 reads 218; V218 equals itself on ' + g('B0 sampled') + ' sampled configs; both logging lines inert (progDigest); lattice startDates are Mondays',
    swept === SW.length && g('B0 sampled') > 0 && !g('B0 V218 != itself') && !g('B0 V218 log not inert') && !g('B0 CAND log not inert') && MONDAY,
    'swept ' + swept + '/' + SW.length + ', self ' + g('B0 V218 != itself') + ', V log ' + g('B0 V218 log not inert') + ', C log ' + g('B0 CAND log not inert') + ', mondays ' + MONDAY);
  const f0bad = g('F0 not on prev') + g('F0 first day');
  ok('F0 fixture: V218 makes renames whose name is not on the calendar-previous card (' + f0bad + ' of ' + g('F0 renames') + ': ' + g('F0 first day') + ' on W1 Monday, ' + g('F0 not on prev') + ' elsewhere), so D1 can fail',
    f0bad > 0 && g('F0 unlocated') === 0, f0bad + ' / unlocated ' + g('F0 unlocated'));
  ok('D1 DURABLE: every one of ' + g('D1 renames') + ' dedupe renames lands on a day located in the shipped program whose calendar-previous card carries the renamed name; 0 on W1 Monday',
    g('D1 renames') > 0 && !g('D1 unlocated') && !g('D1 first day') && !g('D1 not on prev'),
    'renames ' + g('D1 renames') + ', unlocated ' + g('D1 unlocated') + ', W1 Monday ' + g('D1 first day') + ', not on prev ' + g('D1 not on prev') + exs('D1 not on prev') + exs('D1 first day') + exs('D1 unlocated'));
  // K2a.H, K2a.P, K2a.L, K2a.Z, D167a, K2b.N, K2b.T, R1 and R2 retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it). They pinned D167/D171 on the
  // build pair (219 vs V218 and the XP transplant). The claims that were v219 S1-D167's and S3-D171's only guards are
  // the forward rows below (standing ruling 3 as amended); R2's (S4-D167's only guard) is parked, see the header.
  if(lwErr){ console.log('LEGACY WALK FAILED: ' + lwErr); ['D167.Z', 'D167.H'].forEach(r => ok(r + ' (legacy walk: ' + lwErr + ')', false)); }
  else {
    const H = g('H programs'), Z = g('Z sunREST programs'), hist = ISO.map(d => d + ' ' + g('H days ' + d)).join(', '), midN = CAS.length + g('H cascades unlisted');
    ok('D167.Z FORWARD (every build >= 219): the seed index is carried, so 0 of the ' + g('cfg sunREST') + ' Sunday-rest configs swept differ from the candidate with the hand-typed Sun..Sat walk put back, and that walk is live (' + H + ' Sunday-training programs move)',
      g('cfg sunREST') === 1410 && Z === 0 && H > 0, Z + ' Sunday-rest programs differ, Sunday-training programs moved ' + H + exs('Z sunREST'));
    CAS.slice(0, 12).forEach(z => console.log('    D167a ' + z.tag + ' W' + z.w + ' ' + z.d + ' | (a) prev moved ' + z.a + ' | (b) swap only ' + z.b + (z.why ? ' (' + z.why + ')' : '') + ' | (c) within pattern ' + z.c + ' | depth ' + z.depth + ' | ' + z.sw));
    if(midN > 12) console.log('    D167a ... ' + (midN - 12) + ' more mid-week days');
    ok('D167.H FORWARD (every build >= 219): every day the hand-typed Sun..Sat walk moves on the ' + g('cfg sunTRAIN') + ' Sunday-training configs is a Sunday or a Monday, or a D167a cascade (previous calendar day moved, swap only, within pattern by the hand table, depth 1) [' + H + ' programs; ' + hist + ']',
      H > 0 && !g('H unlicensed'), H + ' programs [' + hist + '], mid-week ' + midN + ', unlicensed ' + g('H unlicensed'));
  }
  ok('D171.T FORWARD (every build >= 219): no hinge item (V218 lens) on a training day whose calendar tomorrow carries legLoad cardio keeps an RPE 8 clamp grammar (' + g('T eve hinge') + ' items, ' + g('T final sat hinge') + ' on a final Saturday, ' + g('T clamp form') + ' read the clamped form)',
    g('T final sat hinge') > 0 && !g('T unclamped'), 'unclamped ' + g('T unclamped') + ' (final Saturday ' + g('T unclamped final sat') + '), final-Saturday items ' + g('T final sat hinge') + exs('T unclamped'));
  done();
}
