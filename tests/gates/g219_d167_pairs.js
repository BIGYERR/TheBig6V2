// g219_d167_pairs.js — GATE for D167 (+ D167a) and D171 (coach): THE ADJACENT-DAY DEDUPE WALKS THE CALENDAR THE WEEK RENDERS.
//
//   node tests/gates/g219_d167_pairs.js [candidate] [baseline V218]
//
// THE RULINGS THIS DEFENDS (not the version they ship on):
//   D167   `_adjDayPairs` walked Sun..Sat and paired W sat with W+1 sun (8 days apart) while the week renders Mon..Sun.
//          CFs: pairs Mon..Sun plus W sun -> W+1 mon, walked in calendar order, each pair keeping the seed index its
//          A day holds today. 370 programs / 859 days; repeats sat>sun 347->28, sun>mon 48->6; 0 losses; 0 cardio or
//          rest diffs; HALF_MANNY unchanged (the harness digest row owns that, not this gate).
//   K2a    every A event (card event) lands on a Sunday or a Monday of a config whose Sunday is not a rest day.
//   D167a  a mid-week event is licensed only when (a) the previous calendar day is itself in the A set, (b) the day's
//          diff is confined to the dedupe swap (equal item count, 0 losses), (c) the swap stays within pattern.
//          Pinned at 4 days / 2 configs / Tuesday only / depth 1.
//   K2b    D171 text events: final week only, RPE text only, 157; any not on Sat or Sun or not in the final week fails.
//
// ORACLES, independent of the engine under test:
//   CAL    Monday-start date arithmetic: a day's calendar index is (w-1)*7 + {mon:0 .. sun:6}; its predecessor is
//          index-1; the block's first day is W1 Monday (index 0) and has no predecessor. The pinned startDates of the
//          lattice (2026-09-21, 2026-10-05) are Mondays. `_adjDayPairs` is never called or read for what a pair is.
//   CARD   the shipped day cards themselves (JSON per calendar day), read off prog.weeks.
//   PAT    a hand table (below) for "within pattern" on the licensed cascade swaps; a name not in it fails.
//   LENS   repeat eligibility (loaded, has a pattern, not a Main/Primer/Power section) is the dedupe contract read
//          through the FROZEN V218 artifact's isTrackableWeight/_pattern, exactly as measure pinned 347/48 -> 28/6.
//          The candidate's own lens is never consulted.
//
// ARMS
//   V218   git 44fd483 (or argv[3] when it reads 218). Frozen before-picture.
//   XP     the TRANSPLANT: V218 with the candidate's `function _adjDayPairs(...)` and its dedupe seed line
//          (`const to=top[...]`) sliced out of the candidate and put in place of V218's (anchors count==1 in both).
//          The ruling's after-grid is "D167 on V218"; XP is that, built from the candidate's own D167 code. On the
//          measured lattice XP equals the D167-only artifact byte for byte (15,180/15,180). K2a/D167a read V218 vs XP.
//          TWO NUMBERS, ONE PIN. D167 ISOLATED (V218 vs XP): 859 days = Sun 748 + Mon 107 + Tue 4 cascades, 370
//          programs. D167 IN CHAIN (full chain vs the chain with V218's walk put back): 870 days, Mon 116, Tue 6
//          cascades, 371 programs. The gate pins the ISOLATED figure because that is what coach ruled (D167/K2a/
//          D167a are stated against V218). The in-chain delta is D167 interacting with D165/D166's card changes;
//          it is not a D167 claim, gatekeeper classifies it against D167a's shape, and it is not pinned here.
//   D171 has two sites. hotNextHingeClampSweep (the `_last` form) is defended by K2b. buildProgram's inline
//          `hotNext` (the `_ISO_ORDER.length-1` form, read by scheme()'s hinge-main clamp) is UNDEFENDED: it is
//          not a callable unit, and reverting it is inert on all 15,180 lattice configs.
//   CAND   the candidate, with one inert logging line at the dedupe rename (`        it.name=to;` count==1) that
//          records [the day object being renamed, the name before]. The day is LOCATED by object identity in the
//          shipped program, never by the engine's pair coordinates. K2b and R2 read V218 vs CAND; D1 reads CAND.
//
// LATTICE: the D167 lattice of tests/measure/v219_chain_rebaseline.js (lat 'C', 15,180 configs), copied verbatim.
//   Swept: ALL 3,900 Sunday-training configs (every K2a/K2b event and every sat>sun / sun>mon repeat lives there, so
//   the pins reproduce exactly) + every 8th Sunday-rest config in lattice order (1,410 of 11,280) for the zero rows.
//
// ROWS
//   B0   V218 reads 218; V218 equals itself; both logging lines are inert (progDigest) on every 50th swept config.
//   F0   fixture: V218's dedupe makes renames whose name is NOT on the calendar-previous card (so D1 can fail).
//   D1   DURABLE (every build >= 219): every dedupe rename in CAND lands on a day located in the shipped program whose
//        calendar predecessor's shipped card carries the renamed name; 0 renames on W1 Monday; renames > 0.
//   K2a.H  PAIR. V218 vs XP card events: 859 = Sun 748 + Mon 107 + Tue 4, Wed..Sat 0; every Sun/Mon event on a
//          Sunday-training config.
//   K2a.P  PAIR. 370 programs carry an event.
//   K2a.L  PAIR. 0 losses (items or sections), 0 cardio diffs, 0 rest-flag diffs on event days.
//   K2a.Z  PAIR. 0 events on the Sunday-rest subset.
//   D167a  PAIR. mid-week events: 4, all Tuesday, 2 configs, all cascades (a), swap-only (b), within pattern (c), depth 1;
//          0 non-cascade mid-week days, 0 depth-2 chains.
//   K2b.N  PAIR. V218 vs CAND detail-only days: 157 = final Sat 155 + final Sun 2; none elsewhere; none on Sunday-rest.
//   K2b.T  PAIR. every changed detail is RPE text only: RPE 8->7 155, reserve-text variant 6, RPE 7->8 2.
//   R1   PAIR. V218 calendar repeats sat>sun 347, sun>mon 48 (the before-picture).
//   R2   PAIR. CAND calendar repeats sat>sun 28, sun>mon 6.
//
// VERSION PREDICATE (standing rulings 2 and 4). D167/D171 ship on ia-version 219.
//   below 219: REFUSED, every row FAILS by name (never a vacuous pass).
//   219: every row runs. above 219: PAIR rows print "SKIP pair row: candidate <v> is not D167's pair"; B0/F0/D1 run.
// env: G219_SHARDS (default min(4, cpus)).
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { load, progDigest, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEFILE = process.argv[3] || null;
const ERA = 219, V218_COMMIT = '44fd4830f9653e790aa43477787374cd29711988';
const PAIR_ROWS = ['K2a.H','K2a.P','K2a.L','K2a.Z','D167a','K2b.N','K2b.T','R1','R2'], DUR_ROWS = ['B0','F0','D1'];
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

// ── card oracles ────────────────────────────────────────────────────────────────────────────────────
const calOf = p => { const m = {}; Object.keys((p && p.weeks) || {}).forEach(w => ISO.forEach(d => { const y = p.weeks[w] && p.weeks[w][d]; if(y !== undefined) m[(+w - 1) * 7 + OFF[d]] = { w:+w, d, y }; })); return m; };
const lastWeek = p => Math.max.apply(null, Object.keys(p.weeks).map(Number));
const trains = y => !!(y && !y.rest && Array.isArray(y.sections));
const namesOn = y => new Set((trains(y) ? y.sections : []).flatMap(s => ((s && s.items) || []).map(i => String((i && i.name) || '').toLowerCase())));
const nItems = y => ((y && y.sections) || []).reduce((a, s) => a + ((s && s.items) || []).length, 0);
const noKey = (y, key) => JSON.stringify(y, (k, v) => k === key ? undefined : v);
const isMainSec = s => /^(main|primer|power)/i.test((s && s.label) || '');
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
  const Vi = load(A.v218i), Ci = load(A.candi), XP = A.xp ? load(A.xp) : null, V = load(A.v218), C = load(ART);
  const TW = Vi.eval('isTrackableWeight'), PAT = Vi.eval('_pattern');
  const T = {}, EX = {}, CAS = []; const bump = (k, n = 1) => { T[k] = (T[k] || 0) + n; }; const ex = (k, s) => { (EX[k] = EX[k] || []); if(EX[k].length < 4) EX[k].push(s); };
  const runLog = (X, cfg) => { X.eval('globalThis.__G219R=[]'); const p = X.buildProgram(cl(cfg)); const R = X.eval('globalThis.__G219R') || []; X.eval('globalThis.__G219R=[]'); return { p, R }; };
  const audit = (p, R, pre, tag) => { const dl = new Map(); Object.keys(p.weeks).forEach(w => ISO.forEach(d => { const y = p.weeks[w] && p.weeks[w][d]; if(y && typeof y === 'object') dl.set(y, (+w - 1) * 7 + OFF[d]); }));
    const cal = calOf(p);
    R.forEach(([day, was]) => { bump(pre + 'renames'); const ix = dl.get(day);
      if(ix === undefined){ bump(pre + 'unlocated'); ex(pre + 'unlocated', tag); return; }
      if(ix === 0){ bump(pre + 'first day'); ex(pre + 'first day', tag + ' W1 mon was ' + was); return; }
      const A0 = cal[ix - 1]; if(!(A0 && namesOn(A0.y).has(String(was).toLowerCase()))){ bump(pre + 'not on prev'); ex(pre + 'not on prev', tag + ' W' + (Math.floor(ix / 7) + 1) + ' ' + ISO[ix % 7] + ' was ' + was); } }); };
  const reps = (p, pre) => { const c = calOf(p); Object.keys(c).map(Number).forEach(ix => { const a = c[ix], b = c[ix + 1]; if(!a || !b || !trains(a.y) || !trains(b.y)) return;
    const pt = a.d === 'sat' ? 'sat>sun' : a.d === 'sun' ? 'sun>mon' : 'interior'; const nA = namesOn(a.y);
    b.y.sections.forEach(sec => ((sec && sec.items) || []).forEach(it => { const n = String((it && it.name) || '').toLowerCase(); if(n && nA.has(n) && !isMainSec(sec) && TW(it.name) && PAT(it.name)) bump(pre + pt); })); }); };
  for(let q = si; q < SW.length; q += sn){ const i = SW[q], x = U[i], sr = SUNREST(x), grp = sr ? 'sunREST' : 'sunTRAIN';
    const tag = x.mix + ' ' + x.c.equipment + '/' + x.c.liftingFocus + '/' + x.c.experience + ' rest ' + (x.c.restDays.join(',') || '-') + ' seed ' + x.c.seed + ' #' + i;
    bump('cfg ' + grp);
    const v = runLog(Vi, x.c), c = runLog(Ci, x.c);
    if(q % 50 === si % 50){ bump('B0 sampled'); const v1 = V.buildProgram(cl(x.c)), v2 = V.buildProgram(cl(x.c)), c1 = C.buildProgram(cl(x.c));
      if(progDigest(v1) !== progDigest(v2)) bump('B0 V218 != itself'); if(progDigest(v1) !== progDigest(v.p)) bump('B0 V218 log not inert'); if(progDigest(c1) !== progDigest(c.p)) bump('B0 CAND log not inert'); }
    audit(v.p, v.R, 'F0 ', tag); audit(c.p, c.R, 'D1 ', tag);
    if(!XP) continue;
    // K2a / D167a: V218 vs XP
    const x1 = XP.buildProgram(cl(x.c)); const cv = calOf(v.p), cx = calOf(x1);
    const EV = new Set(); new Set(Object.keys(cv).concat(Object.keys(cx))).forEach(k => { if(JSON.stringify(cv[k] && cv[k].y) !== JSON.stringify(cx[k] && cx[k].y)) EV.add(+k); });
    if(EV.size){ bump('K2a programs'); if(sr){ bump('K2a sunREST programs'); ex('K2a sunREST', tag); } }
    const mid = ix => { const d = ISO[ix % 7]; return d !== 'sun' && d !== 'mon'; };
    const depth = ix => (EV.has(ix - 1) && mid(ix - 1)) ? 1 + depth(ix - 1) : 1;
    EV.forEach(ix => { const d = ISO[ix % 7], w = Math.floor(ix / 7) + 1, ya = cv[ix] && cv[ix].y, yb = cx[ix] && cx[ix].y;
      bump('K2a days ' + d + ' ' + grp);
      if(nItems(yb) < nItems(ya) || ((yb && yb.sections) || []).length < ((ya && ya.sections) || []).length){ bump('K2a loss'); ex('K2a loss', tag + ' W' + w + ' ' + d); }
      if(!!(ya && ya.rest) !== !!(yb && yb.rest)) bump('K2a rest diff'); if(JSON.stringify(ya && ya.cardio) !== JSON.stringify(yb && yb.cardio)) bump('K2a cardio diff');
      if(mid(ix)){ const s = swapOnly(ya, yb); const pat = s.ok && s.sw.every(([a, b]) => HAND_PAT[String(a).toLowerCase()] && HAND_PAT[String(a).toLowerCase()] === HAND_PAT[String(b).toLowerCase()]);
        CAS.push({ cfg:i, tag, w, d, a:EV.has(ix - 1), b:s.ok, why:s.why || '', c:!!pat, depth:depth(ix), sw:(s.sw || []).map(z => z[0] + ' -> ' + z[1] + ' [' + z[2] + ']').join('; ') }); } });
    // K2b: V218 vs CAND, detail-only days
    const cc = calOf(c.p), LW = lastWeek(c.p);
    new Set(Object.keys(cv).concat(Object.keys(cc))).forEach(k => { const ya = cv[k] && cv[k].y, yb = cc[k] && cc[k].y; if(JSON.stringify(ya) === JSON.stringify(yb)) return;
      if(noKey(ya, 'detail') !== noKey(yb, 'detail')) return; const ix = +k, d = ISO[ix % 7], w = Math.floor(ix / 7) + 1;
      bump('K2b days ' + d + (w === LW ? ' final' : ' W' + w + ' not final') + ' ' + grp); if(!((d === 'sat' || d === 'sun') && w === LW)) ex('K2b misplaced', tag + ' W' + w + ' ' + d);
      (ya.sections || []).forEach((s, si2) => ((s && s.items) || []).forEach((it, k2) => { const z = yb.sections[si2].items[k2]; if(it.detail === z.detail) return; const p0 = String(it.detail || ''), q0 = String(z.detail || '');
        const rpe = /RPE/.test(p0) && /RPE/.test(q0) && p0.replace(/RPE.*$/, '') === q0.replace(/RPE.*$/, '');
        if(!rpe){ bump('K2b non-RPE change'); ex('K2b non-RPE', tag + ' W' + w + ' ' + d + ' ' + JSON.stringify([p0, q0])); }
        else bump('K2b text ' + p0.replace(/^.*?(RPE)/, '$1') + ' -> ' + q0.replace(/^.*?(RPE)/, '$1')); })); });
    reps(v.p, 'R1 '); reps(c.p, 'R2 ');
  }
  fs.writeFileSync(process.env.G219OUT, JSON.stringify({ T, EX, CAS }));
  process.exit(0);
}

// ── main ────────────────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0, skip = 0, TMP = null;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = l => { skip++; console.log('SKIP ' + l); };
const done = () => { if(TMP) try { fs.rmSync(TMP, { recursive:true, force:true }); } catch(e){}
  console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
const IA = load(ART), VER = +IA.version;
console.log('g219 D167/D171 | candidate ' + ART + ' ia-version ' + VER + ' | lattice ' + U.length + ' configs, swept ' + SW.length + ' (' + U.filter(x => !SUNREST(x)).length + ' Sunday-training + every 8th of ' + U.filter(SUNREST).length + ' Sunday-rest)');
if(VER < ERA){ console.log('REFUSED: ia-version ' + VER + ' predates D167/D171 (V' + ERA + '). No row may pass on it.');
  DUR_ROWS.concat(PAIR_ROWS).forEach(r => ok(r + ' refused: candidate ' + VER + ' is below the D167 era', false)); done(); }
const PAIR = VER === ERA;
const MONDAY = ['2026-09-21', '2026-10-05'].every(s => new Date(s + 'T12:00:00Z').getUTCDay() === 1);

let setupErr = null, xpErr = null;
try {
  TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'g219d167-'));
  let vFile = null;
  if(BASEFILE){ const b = load(BASEFILE); if(+b.version === 218) vFile = path.resolve(BASEFILE); else console.log('  argv[3] reads ' + b.version + ', using git ' + V218_COMMIT.slice(0, 7)); }
  if(!vFile){ vFile = path.join(TMP, 'v218.html'); fs.writeFileSync(vFile, cp.execFileSync('git', ['show', V218_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 })); }
  const V = fs.readFileSync(vFile, 'utf8'), C = fs.readFileSync(ART, 'utf8');
  if(+load(vFile).version !== 218) throw new Error('V218 baseline reads ' + load(vFile).version);
  const LOGA = '        it.name=to;\n', LOGI = '        (globalThis.__G219R||(globalThis.__G219R=[])).push([(typeof B!=="undefined"?B:null),it.name]);\n';
  [['V218', V], ['candidate', C]].forEach(([n, s]) => { if(cnt(s, LOGA) !== 1) throw new Error('rename anchor count ' + cnt(s, LOGA) + ' in ' + n); });
  const arts = { v218:vFile, v218i:path.join(TMP, 'v218i.html'), candi:path.join(TMP, 'candi.html'), xp:null };
  fs.writeFileSync(arts.v218i, V.replace(LOGA, () => LOGI + LOGA)); fs.writeFileSync(arts.candi, C.replace(LOGA, () => LOGI + LOGA));
  if(PAIR){ try {
    const FN = 'function _adjDayPairs(', SEEDL = /\n[ \t]*const to=top\[[^\n]*\n/g;
    const fnOf = (s, n) => { if(cnt(s, FN) !== 1) throw new Error(FN + ' count ' + cnt(s, FN) + ' in ' + n); const i = s.indexOf(FN), k = s.indexOf('\n}\n', i); if(k < 0) throw new Error('no close of _adjDayPairs in ' + n); return s.slice(i, k + 3); };
    const seedOf = (s, n) => { const m = s.match(SEEDL) || []; if(m.length !== 1) throw new Error('dedupe seed line count ' + m.length + ' in ' + n); return m[0]; };
    const fV = fnOf(V, 'V218'), fC = fnOf(C, 'candidate'), sV = seedOf(V, 'V218'), sC = seedOf(C, 'candidate');
    const X = V.replace(fV, () => fC).replace(sV, () => sC); if(cnt(X, fC) !== 1 || cnt(X, sC) !== 1) throw new Error('transplant did not land');
    arts.xp = path.join(TMP, 'xp.html'); fs.writeFileSync(arts.xp, X);
    console.log('  transplant: candidate _adjDayPairs ' + (fC === fV ? 'IDENTICAL to V218' : 'differs from V218') + ', seed line ' + (sC === sV ? 'IDENTICAL to V218' : 'differs from V218'));
  } catch(e){ xpErr = String(e && e.message || e).slice(0, 200); } }
  fs.writeFileSync(path.join(TMP, 'arts.json'), JSON.stringify(arts));
} catch(e){ setupErr = String(e && e.message || e).slice(0, 300); }
if(setupErr){ console.log('SETUP FAILED: ' + setupErr); DUR_ROWS.concat(PAIR ? PAIR_ROWS : []).forEach(r => ok(r + ' (setup: ' + setupErr + ')', false)); if(!PAIR) PAIR_ROWS.forEach(r => skipRow('pair row ' + r + ': candidate ' + VER + " is not D167's pair")); done(); }

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
  if(!PAIR){ PAIR_ROWS.forEach(r => skipRow('pair row ' + r + ': candidate ' + VER + " is not D167's pair")); done(); }
  // pair rows (219 only)
  if(xpErr){ console.log('TRANSPLANT FAILED: ' + xpErr); PAIR_ROWS.filter(r => /^K2a|^D167a/.test(r)).forEach(r => ok(r + ' (transplant: ' + xpErr + ')', false)); }
  else {
    const day = d => g('K2a days ' + d + ' sunTRAIN') + g('K2a days ' + d + ' sunREST'), tot = sumP('K2a days ');
    const hist = ISO.map(d => d + ' ' + day(d)).join(', ');
    const sunTrainSM = g('K2a days sun sunTRAIN') + g('K2a days mon sunTRAIN');
    ok('K2a.H V218 vs XP card events 859 = Sun 748 + Mon 107 + Tue 4, Wed..Sat 0, every Sun/Mon event on a Sunday-training config [' + hist + '; denominator ' + tot + ']',
      tot === 859 && day('sun') === 748 && day('mon') === 107 && day('tue') === 4 && ['wed','thu','fri','sat'].every(d => day(d) === 0) && sunTrainSM === 855, tot + ' [' + hist + '], Sun/Mon on Sunday-training ' + sunTrainSM);
    ok('K2a.P 370 programs carry a card event', g('K2a programs') === 370, g('K2a programs'));
    ok('K2a.L event days: 0 losses (items or sections), 0 cardio diffs, 0 rest-flag diffs', tot > 0 && !g('K2a loss') && !g('K2a cardio diff') && !g('K2a rest diff'),
      'events ' + tot + ', losses ' + g('K2a loss') + ', cardio ' + g('K2a cardio diff') + ', rest ' + g('K2a rest diff') + exs('K2a loss'));
    ok('K2a.Z 0 events on the ' + g('cfg sunREST') + ' Sunday-rest configs swept (every 8th of 11,280)', g('cfg sunREST') === 1410 && sumP('K2a days ') - ISO.reduce((a, d) => a + g('K2a days ' + d + ' sunTRAIN'), 0) === 0 && !g('K2a sunREST programs'),
      g('K2a sunREST programs') + ' programs' + exs('K2a sunREST'));
    const cfgs = new Set(CAS.map(z => z.cfg)), good = CAS.filter(z => z.a && z.b && z.c && z.depth === 1 && z.d === 'tue');
    CAS.forEach(z => console.log('    D167a ' + z.tag + ' W' + z.w + ' ' + z.d + ' | (a) prev in A ' + z.a + ' | (b) swap only ' + z.b + (z.why ? ' (' + z.why + ')' : '') + ' | (c) within pattern ' + z.c + ' | depth ' + z.depth + ' | ' + z.sw));
    ok('D167a mid-week events: 4 days, 2 configs, Tuesday only, each (a) previous day in A (b) swap only (c) within pattern, depth 1; 0 non-cascade, 0 depth-2',
      CAS.length === 4 && good.length === 4 && cfgs.size === 2 && !CAS.some(z => !z.a) && !CAS.some(z => z.depth > 1),
      CAS.length + ' days, ' + cfgs.size + ' configs, ' + good.length + ' clean, non-cascade ' + CAS.filter(z => !z.a).length + ', depth>1 ' + CAS.filter(z => z.depth > 1).length);
  }
  const kb = sumP('K2b days '), kbSat = g('K2b days sat final sunTRAIN'), kbSun = g('K2b days sun final sunTRAIN');
  ok('K2b.N V218 vs CAND detail-only days 157 = final Saturday 155 + final Sunday 2, none elsewhere, none on Sunday-rest', kb === 157 && kbSat === 155 && kbSun === 2,
    kb + ' [' + Object.keys(T).filter(k => /^K2b days /.test(k)).map(k => k.slice(10) + ' ' + T[k]).join(', ') + ']' + exs('K2b misplaced'));
  const t1 = g('K2b text RPE 8 -> RPE 7'), t2 = g('K2b text RPE 8 (stop 2 reps short of failure) -> RPE 7 (leave 3 or more in reserve)'), t3 = g('K2b text RPE 7 -> RPE 8'), tAll = sumP('K2b text ');
  ok('K2b.T every changed detail is RPE text only: RPE 8->7 155, reserve-text variant 6, RPE 7->8 2 (163 items)', kb > 0 && !g('K2b non-RPE change') && t1 === 155 && t2 === 6 && t3 === 2 && tAll === 163,
    'non-RPE ' + g('K2b non-RPE change') + ', 8->7 ' + t1 + ', variant ' + t2 + ', 7->8 ' + t3 + ', all ' + tAll + exs('K2b non-RPE'));
  ok('R1 V218 calendar repeats (V218 lens) sat>sun 347, sun>mon 48 [interior ' + g('R1 interior') + ']', g('R1 sat>sun') === 347 && g('R1 sun>mon') === 48, g('R1 sat>sun') + '/' + g('R1 sun>mon'));
  ok('R2 CAND calendar repeats (V218 lens) sat>sun 28, sun>mon 6 [interior ' + g('R2 interior') + ']', g('R2 sat>sun') === 28 && g('R2 sun>mon') === 6, g('R2 sat>sun') + '/' + g('R2 sun>mon'));
  done();
}
