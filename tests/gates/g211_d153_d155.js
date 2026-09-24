// g211_d153_d155.js — GATE for D153 (tier B reads the hinge through _pattern) and D155 option (c)
// (a tier B long-run day in a recovery week keeps the accessory block the TIER admits). Coach
// ruled both in the V210 session; Mario ordered D153 next; they ship together on ia-version 211
// because D153 alone empties 706 NRC and 560 NSW "Full Body" cards (measure, V210).
//
//   node tests/gates/g211_d153_d155.js [candidate] [baseline V210]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   D153  Tier B bans the pattern, not the load: a hinge or hip extension never prints on a tier B
//         long-run day (Cable pull-through and Bodyweight back extension survived it on V210).
//   D155  No tier B long-run day ends with no lifting. On the loaded full-body day of a recovery
//         week the deload keeps the block the tier admits, which is Upper superset. Everywhere
//         else D91 is untouched. Tier B stays at 8 working sets or fewer.
//
// ORACLES, independent of the engine. _longRunTier, _pattern, _isPostChain, _D18_LEG_RX and
// recoveryDeload are never called or read:
//   tier       from the dose minutes on the card (75 and 45 are the D18 ruling's cuts); the long run
//              by subtype on NRC ("Long Run", not race day or time trial) and by dose key 'long' on
//              NSW (D140); an NRC dress rehearsal is tier A (D34).
//   lift       a live section whose LABEL is not taper, core (coreHeader, core flag, trunk/core
//              label), mobility or stretch, and which is not a hip section.
//   hinge      the hand list typed below from the brief (deadlift, RDL/romanian, good morning,
//              hinge, swing, pull-through, back extension, hyperextension, reverse hyper,
//              glute-ham/GHR, hip thrust, glute bridge, nordic, hip extension).
//   sets       a hand parse of the printed prescription ("4×8" is 4, "3 sets" is 3, otherwise 1);
//              stretch and mobility items are free, as the D18 ruling says.
//   D38        the two days before a RACE DAY or TIME TRIAL card carry no lifting by doctrine, so
//              the backstop excludes them by hand (Monday-to-Sunday flattened, as D38 reads it).
//   identity   JSON byte identity of each day card against V210, built from the same cfg.
//
// ROWS
//   G1  the backstop: 0 tier B long-run days with zero lift sections (NRC and NSW lattices).
//   G2  0 hand-hinge items on tier B long-run days. G2v: the hand list sees hinges elsewhere on
//       the same lattice (vacuity). G2r (build pair): V210 prints hinges on this limb's own tier B
//       days, so the limb reaches the defect; the D153 limb must reach Cable pull-through (NRC seeds
//       99991 and 1234, NSW seed 1001, commercial advanced strength and hypertrophy, where V210 drew
//       it). HF: fixture guards on the typed list itself, counted apart.
//   G3  recovery weeks (V210's liftRecoveryWeeks), every day that is not a tier B long run:
//       byte-identical to V210. That is D91 untouched.
//   G4  every day that is not a long run: byte-identical to V210. G4b: tier A and C long runs too.
//   G5  8 hand-counted working sets or fewer on every tier B long-run day.
//   G6  D155's after-grid: a recovery-week tier B "Full Body" day on commercial or home_full,
//       strength or hypertrophy, with no Strength main and no hip section left, keeps Upper superset.
//   G0  identity fuzz: V210 built twice from the same cfg is identical (the diff is not noise).
//   HM  HALF_MANNY shipped digest, typed: 0ac7da6b1691a8e1 (ruled unmoved; outside the branch).
//
// VERSION PREDICATE (standing ruling 4). D153 and D155 ship on ia-version 211.
//   below 211: NOT APPLICABLE, every row skipped by name, clean exit.
//   G0, G3, G4 and G4b say "this build changed nothing else", so they are scoped to the build pair
//   (candidate 211, baseline V210) and print SCOPED OUT on any later candidate. G1, G2, G5, G6 and
//   HM are the ruling's own claims and enforce at every version from 211 up.
//   The V210 baseline is argv[3] when that file reads ia-version 210; otherwise it is read from git
//   at the V210 commit (d8d2f5b). A pair row with no baseline FAILS: a claim that did not run is
//   not a pass.
// Run on V210 forced to 211, G1 and G2 fail (zero-lift days and surviving hinges); on the V211
// build every row passes.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const { load, fixtures, progDigest, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version;
const ERA = 211;
const PAIR = VER === ERA;                 // build-pair rows run only for candidate 211 vs V210
const V210_COMMIT = 'd8d2f5ba89fa2d1630fa2b30fb76dceee55778f1';
const HM_DIGEST = '0ac7da6b1691a8e1';

let pass = 0, fail = 0, skip = 0, scoped = 0, fixt = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function fixture(label, cond, got){ fixt++; ok('HF ' + label, cond, got); }
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function pairRow(label, cond, got){
  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 211/210 only; candidate is ' + VER + '] (now ' + got + ')'); return; }
  ok(label, cond, got);
}
function summary(){
  console.log('\nfixture guards ' + fixt + '  SCOPED OUT ' + scoped + '  SKIP ' + skip);
  console.log('PASS ' + pass + ' FAIL ' + fail);
  process.exit(fail ? 1 : 0);
}
if(!(VER >= ERA)){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D153/D155 (V' + ERA + ').');
  ['HF','G0','G1','G2','G2v','G3','G4','G4b','G5','G6','HM'].forEach(r => skipRow(r + ' skipped below the D153/D155 era'));
  summary();
}

// ── the hand oracles ─────────────────────────────────────────────────────────────────────
const HINGE = /deadlift|\brdl\b|romanian|good morning|hinge|swing|pull-?through|back extension|hyperextension|reverse hyper|glute-ham|\bghr\b|hip thrust|glute bridge|nordic|hip extension/i;
const STR = /stretch|mobility|foam|90\/90|world'?s greatest|\bcars?\b/i;
const mins = d => !d ? 0 : d.k === 'time' ? (+d.mins || 0) : (+d.mi || 0) * (+d.tgt || 0) / 60;
const isLong = c => !!(c && c.dose && ((c.isNRC && /^long run/i.test(c.subtype || '') && !/race day|time trial/i.test(c.subtype || ''))
  || (!c.isNRC && c.type === 'run' && c.dose.key === 'long')));
const tier = c => { if(!isLong(c)) return null; const m = mins(c.dose); if(!m) return null;
  if(c.isNRC && /rehearsal/i.test(c.detail || '')) return 'A'; return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C'; };
const live = d => ((d && d.sections) || []).filter(s => s && (s.items || []).length);
const cls = s => /taper/i.test(s.label || '') ? 'taper' : (s.coreHeader || s.core || /^trunk|core/i.test(s.label || '')) ? 'core'
  : /mobility|stretch/i.test(s.label || '') ? 'mobility' : s.hip ? 'hip' : 'lift';
const sets = d => { let n = 0; live(d).forEach(s => s.items.forEach(it => { if(STR.test(it.name || '')) return;
  const t = it.detail || ''; const m = /^(\d+)\s*[x×]/.exec(t) || /\b(\d+)\s*sets?\b/i.exec(t); n += m ? +m[1] : 1; })); return n; };
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
function d38Window(p){
  const f = []; for(let w = 1; w <= p.totalWeeks; w++) ORDER.forEach(d => f.push(w + '|' + d));
  const ri = f.findIndex(k => { const [w, d] = k.split('|'); const y = p.weeks[w] && p.weeks[w][d];
    return !!(y && y.cardio && /RACE DAY|TIME TRIAL/i.test(y.cardio.subtype || '')); });
  const out = new Set(); if(ri >= 0) for(let j = 1; j <= 2; j++) if(f[ri - j]) out.add(f[ri - j]); return out;
}

// HF: the typed hinge list against typed names (artifact-independent; cannot fail for any index.html).
['Cable pull-through','Bodyweight back extension','Romanian deadlift','Single-leg RDL','Kettlebell swing','Good morning',
 'Glute-ham raise','GHR','Hip thrust','Single-leg glute bridge','Nordic curl','Reverse hyper','45° back extension',
 'Hyperextension','Cable hip extension','Trap bar deadlift'].forEach(n => fixture('hinge list catches ' + n, HINGE.test(n)));
['Goblet squat','Dumbbell bench press','Pull-up','Plank','Walking lunge','Face pull','Band pull-apart','Hip 90/90 stretch',
 'Dumbbell row','Overhead press'].forEach(n => fixture('hinge list passes ' + n, !HINGE.test(n)));

// ── lattices: the dimensions of tests/measure/v211_d153_tierb_hinge.js and v211_d155_tierb_draw.js,
// one seed per limb, age and mile best rotated by index ──────────────────────────────────
const cl = o => JSON.parse(JSON.stringify(o));
const PLANS = ['run_5k','run_10k','run_half','run_marathon'];
const EXP = ['beginner','intermediate','advanced'], AGE = ['18-35','36-54','55+'];
const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
const EQ = ['crossfit','commercial','home_full','home_basic','bodyweight'];
const FOC = ['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const RACED = ['2026-12-06','2027-01-17','2027-03-28'];
const MILE = [['7','30'],['8','15'],['10','30'],['12','0']];
const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
function nrcCfg(plan, o, i){
  const goals = {run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}};
  const types = ['run'];
  if(o.ex && o.ex.bike){ types.push('bike'); goals.bike = {id:o.ex.bike,label:o.ex.bike,baselineDist:'10',baseline:'10mi'}; }
  if(o.ex && o.ex.swim){ types.push('swim'); goals.swim = {id:o.ex.swim,label:o.ex.swim,baselineDist:'1000',baseline:'1000m'}; }
  return Object.assign(cl(fixtures.HALF_MANNY), {name:'G211',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,
    eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:AGE[i%3],
    equipment:o.q,restDays:o.r.slice(),seed:76308});
}
const NRC = []; let ii = 0;
for(const plan of PLANS) for(const e of EXP) for(const r of RESTS) for(const q of EQ) for(const f of FOC) for(const dated of [true,false])
  NRC.push({seg:plan, c:nrcCfg(plan, {e,r,q,f,dated}, ii++)});
for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC) for(const q of EQ)
  NRC.push({seg:plan + ' multi', c:nrcCfg(plan, {ex,e:EXP[ii%3],r:RESTS[ii%2],q,f,dated:ii%2===0}, ii++)});
const STAND = {name:'G211',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',
  mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],
  days:DAYS.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
const NSW = [];
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of FOC)
  for(const q of EQ) for(const r of RESTS) for(const e of EXP){
    const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1];
    c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; NSW.push({seg:g + '/' + mm.join(':'), c}); }

// ── the V210 baseline (build-pair rows only) ─────────────────────────────────────────────────
let BASE = null, baseWhy = '';
if(PAIR){
  if(BASEFILE && fs.existsSync(BASEFILE)){ const b = load(BASEFILE); if(+b.version === 210){ BASE = b; baseWhy = 'argv baseline ' + BASEFILE; } else baseWhy = 'argv baseline reads ' + b.version + ', not 210; '; }
  if(!BASE){
    try {
      const repo = path.join(__dirname, '..', '..');
      const f = path.join(os.tmpdir(), 'g211_v210_' + process.pid + '.html'); try { fs.unlinkSync(f); } catch(e) {}
      fs.writeFileSync(f, cp.execFileSync('git', ['-C', repo, 'show', V210_COMMIT + ':index.html'], {maxBuffer: 1 << 26}));
      const b = load(f); if(+b.version === 210){ BASE = b; baseWhy += 'git ' + V210_COMMIT.slice(0, 7); } else baseWhy += 'git copy reads ' + b.version;
    } catch(e) { baseWhy += 'git show failed: ' + String(e.message).slice(0, 80); }
  }
  console.log('baseline: ' + (BASE ? 'V210 from ' + baseWhy : 'UNAVAILABLE (' + baseWhy + ')'));
}

// ── run ──────────────────────────────────────────────────────────────────────────────────
function run(limb, list, fl){
  const R = {baseHinge:{}, cfg:0, crash:0, tb:0, zero:0, d38:0, hinge:0, hingeEx:{}, hingeElse:0, over8:0, maxSets:0,
    g6n:0, g6bad:0, g6ex:null, nonLong:0, nonLongDiff:0, acN:0, acDiff:0, recN:0, recDiff:0, diffEx:null, selfN:0, selfDiff:0, zeroEx:null, recFullB:0};
  list.forEach((x, idx) => {
    R.cfg++;
    let p, b = null;
    try { p = IA.buildProgram(cl(x.c)); if(BASE) b = BASE.buildProgram(cl(x.c)); } catch(e) { R.crash++; return; }
    if(BASE && idx % 25 === 0){ const b2 = BASE.buildProgram(cl(x.c)); R.selfN++; if(JSON.stringify(b.weeks) !== JSON.stringify(b2.weeks)) R.selfDiff++; }
    const eve = d38Window(p);
    const rw = new Set(((b || p).liftRecoveryWeeks) || []);
    for(let w = 1; w <= p.totalWeeks; w++) for(const d of DAYS){
      const y = p.weeks[w] && p.weeks[w][d]; if(!y) continue;
      const t = y.rest ? null : tier(y.cardio);
      if(b){ const y0 = b.weeks[w] && b.weeks[w][d]; const t0 = y0 && !y0.rest ? tier(y0.cardio) : null;
        if(t0 === 'B') live(y0).forEach(s => s.items.forEach(it => { if(HINGE.test(it.name || '')) R.baseHinge[it.name] = (R.baseHinge[it.name] || 0) + 1; }));
        if(t0 !== 'B'){ const same = JSON.stringify(y0) === JSON.stringify(y);
          if(!t0){ R.nonLong++; if(!same) R.nonLongDiff++; } else { R.acN++; if(!same) R.acDiff++; }
          if(rw.has(w)){ R.recN++; if(!same) R.recDiff++; }
          if(!same && !R.diffEx) R.diffEx = x.seg + ' ' + x.c.equipment + '/' + x.c.liftingFocus + ' W' + w + ' ' + d + ' "' + (y0 && y0.title) + '"'; } }
      if(t !== 'B'){ live(y).forEach(s => s.items.forEach(it => { if(HINGE.test(it.name || '')) R.hingeElse++; })); continue; }
      R.tb++;
      const lift = live(y).filter(s => cls(s) === 'lift');
      if(!lift.length){ if(eve.has(w + '|' + d)) R.d38++; else { R.zero++; if(!R.zeroEx) R.zeroEx = x.seg + ' ' + x.c.equipment + '/' + x.c.liftingFocus + ' W' + w + ' ' + d + ' "' + y.title + '"'; } }
      live(y).forEach(s => s.items.forEach(it => { if(HINGE.test(it.name || '')){ R.hinge++; R.hingeEx[it.name] = (R.hingeEx[it.name] || 0) + 1; } }));
      const n = sets(y); if(n > 8) R.over8++; if(n > R.maxSets) R.maxSets = n;
      if(rw.has(w) && /^Full Body/.test(y.title || '') && /^(commercial|home_full)$/.test(x.c.equipment) && /^(strength|hypertrophy)$/.test(x.c.liftingFocus)){
        R.recFullB++;
        if(!live(y).some(s => /^strength$/i.test(s.label || '') || /hip/i.test(s.label || '') || s.hip)){
          R.g6n++; if(!live(y).some(s => /^upper superset$/i.test(s.label || ''))){ R.g6bad++; if(!R.g6ex) R.g6ex = x.seg + ' ' + x.c.equipment + '/' + x.c.liftingFocus + ' W' + w + ' ' + d + ' [' + live(y).map(s => s.label || '(core)').join(' + ') + ']'; } }
      }
    }
  });
  const L = limb;
  ok(L + ' lattice builds without a crash (' + R.cfg + ' configs)', R.crash === 0 && R.cfg > 0, R.crash + ' crashes');
  ok(L + ' G1v the lattice reaches tier B long-run days (' + R.tb + ') and the recovery-week loaded Full Body population (' + R.recFullB + ')', R.tb > fl.tb && R.recFullB > fl.rec, R.tb + '/' + R.recFullB);
  ok(L + ' G1 0 tier B long-run days end with zero lift sections (' + R.tb + ' tier B days; D38 window excluded ' + R.d38 + ')', R.zero === 0, R.zero + ', first ' + R.zeroEx);
  ok(L + ' G2 0 hand-list hinge items on tier B long-run days', R.hinge === 0, R.hinge + ' ' + JSON.stringify(R.hingeEx));
  ok(L + ' G2v the hand list sees hinges on this lattice off tier B (' + R.hingeElse + ' items)', R.hingeElse > 0, R.hingeElse);
  ok(L + ' G5 every tier B long-run day holds 8 hand-counted working sets or fewer (max ' + R.maxSets + ')', R.over8 === 0, R.over8 + ' days over 8');
  ok(L + ' G6 recovery-week tier B loaded Full Body with no Strength or hip section keeps Upper superset (' + R.g6n + ' days)', R.g6n > 0 && R.g6bad === 0, R.g6bad + ' of ' + R.g6n + ', first ' + R.g6ex);
  if(!PAIR){ ['G0','G2r','G3','G4','G4b'].forEach(r => pairRow(L + ' ' + r, false, 'n/a')); return; }
  if(!BASE){ ok(L + ' G0/G3/G4/G4b need the V210 baseline', false, baseWhy); return; }
  const bh = Object.values(R.baseHinge).reduce((a, v) => a + v, 0), bpt = Object.keys(R.baseHinge).filter(n => /pull-?through/i.test(n)).reduce((a, n) => a + R.baseHinge[n], 0);
  pairRow(L + ' G2r the limb reaches the defect: V210 prints ' + bh + ' hand-list hinges on its tier B days (' + JSON.stringify(R.baseHinge) + ')', bh > 0 && (!fl.pullThrough || bpt > 0), bh + ' / pull-through ' + bpt);
  pairRow(L + ' G0 V210 built twice is identical (' + R.selfN + ' sampled configs)', R.selfN > 0 && R.selfDiff === 0, R.selfDiff);
  pairRow(L + ' G3 recovery weeks outside tier B long runs byte-identical to V210 (' + R.recN + ' days; D91 untouched)', R.recN > 0 && R.recDiff === 0, R.recDiff + ', first ' + R.diffEx);
  pairRow(L + ' G4 non-long-run days byte-identical to V210 (' + R.nonLong + ' days)', R.nonLong > 0 && R.nonLongDiff === 0, R.nonLongDiff + ', first ' + R.diffEx);
  pairRow(L + ' G4b tier A and C long-run days byte-identical to V210 (' + R.acN + ' days)', R.acN > 0 && R.acDiff === 0, R.acDiff + ', first ' + R.diffEx);
}
// D153 limb: the population where V210 drew Cable pull-through on a tier B day (probe on V210).
const D153 = [];
for(const seed of [99991,1234]) for(const plan of PLANS) for(const f of ['hypertrophy','strength']) for(const r of RESTS) for(const dated of [true,false]){
  const c = nrcCfg(plan, {e:'advanced',r,q:'commercial',f,dated}, D153.length); c.seed = seed; D153.push({seg:plan + ' s' + seed, c}); }
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of ['hypertrophy','strength']) for(const r of RESTS){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1];
  c.liftingFocus = f; c.equipment = 'commercial'; c.restDays = r.slice(); c.experience = 'advanced'; c.seed = 1001; D153.push({seg:g + '/' + mm.join(':') + ' s1001', c}); }
run('NRC', NRC, {tb:1000, rec:50});
run('NSW', NSW, {tb:1000, rec:50});
run('D153', D153, {tb:100, rec:10, pullThrough:true});
ok('HM HALF_MANNY shipped digest is ' + HM_DIGEST + ' (ruled unmoved)', progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY))) === HM_DIGEST, progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY))));
summary();
