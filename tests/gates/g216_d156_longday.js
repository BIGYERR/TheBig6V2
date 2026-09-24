// g216_d156_longday.js — GATE for D156 (coach): THE LONG DAY IS A CLASS.
//
//   node tests/gates/g216_d156_longday.js [candidate] [baseline V215]
//
// THE RULING THIS DEFENDS (not the version it ships on):
//   D156  On the loaded full-body day (strength/hypertrophy on commercial or home_full) `_longDay` means
//         the day carries the long run. NSW run cards carry no Long Run subtype; they say so on the dose
//         (key 'long'), so `_longDay` is also true when the card's dose.key is 'long'. The NRC /^Long Run/,
//         bike /^Long Ride/ and swim /^Long Slow Distance/ subtype tests stay. run_base's key-long
//         "Easy Run" belongs in. The next-day knock-on (adjacent-day dedupe renames V215 made because the
//         long day's finisher shared a name, and V216 no longer has to make) is accepted by coach.
//
// ORACLES, independent of the engine:
//   LONG   a day is a long day when its cardio card (one card, not a stack) is not NRC and its dose key
//          reads 'long': the ruling's own words, read off the card, not through _longDay or _longRunTier.
//   TIER   time on feet by hand (dose minutes, or miles x target seconds per mile / 60) against the
//          doctrine lines: 75 min and up mobility only (A), 45 to 75 upper and trunk at most 8 sets (B),
//          under 45 normal (C). Sets are parsed by hand from the detail ("N×" or "N sets"), stretches free.
//   FIN    the loaded full-body finisher by its label: 'Arms finisher' or 'Delts finisher' (written only
//          by the loaded full-body branch).
//   NODD   a copy of the candidate with the adjacent-day dedupe pass switched off (source surgery, anchor
//          asserted count==1). A position where the candidate prints the NODD name is a name the candidate
//          did NOT rename; the knock-on class requires exactly that on every changed position.
//   V215   the shipped artifact (argv[3] when it reads 215, else git 7474f06) for the pair rows. D154, the
//          other V216 ruling, moves only injured cells; no config here carries an injury.
//
// LATTICES (tests/measure/v216_d156_longday.js, the dimensions measure ran):
//   NSW        g211's NSW lattice at seed 24865: 4 NSW goals x 2 mile times x 6 focuses x 5 tiers x 5 rest
//              patterns x 3 experience (3,600 configs).
//   NSW+seeds  the loaded full-body slice (strength|hypertrophy x commercial|home_full) at seeds 76308, 1234.
//   NSW multi  the loaded full-body slice with bike and swim goals added (240 configs).
//   NRC        g211's NRC shape on the loaded full-body slice (480 configs).
//
// ROWS
//   F0   fixture: V215 printed a finisher on long days of tier B and tier C (NSW), so F1 can fail.
//   F1   per NSW lattice: no long day prints an Arms or Delts finisher.
//   F2   PAIR. NSW: every tier C day V215 printed a finisher on loses it (count printed).
//   F3   PAIR. every tier A long day is byte-identical to V215 (D18 already strips it to mobility).
//   G1   tier B long days: none is left with no lifting section (guard).
//   G2   tier B long days: none prints more than 8 working sets (guard, doctrine line).
//   N1   PAIR. every NRC program byte-identical to V215.
//   K1   PAIR. per NSW lattice: every day that differs from V215 is a long day (the ruled change) or the
//        knock-on class K: not a long day; same title, section stems, item count and every detail; names
//        differ only outside a Main/Primer/Power section; the previous calendar day (the dedupe partner) is
//        a long day or itself differs from V215; and at every differing position the candidate prints the
//        name its NODD twin prints (a rename only V215 made). K is counted and printed. A long partner may
//        print identically in both builds: the dedupe reads the card BEFORE d18LongRunDayPass strips it, so
//        V215 renamed against a finisher its shipped long day no longer shows (measure's appendix). That is
//        D160 (the dedupe reads the post-D18 card), ruled for V217, not this build.
//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (an NRC race program; ruled unmoved).
//
// VERSION PREDICATE (standing ruling 4). D156 ships on ia-version 216.
//   below 216: NOT APPLICABLE, every row skipped by name, clean exit.
//   F2, F3, N1 and K1 say "this build moved only what D156 moves", so they run only on candidate 216
//   against baseline 215 and SKIP by name on every other pair. The rest is ruling-level from 216 up.
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const { load, progDigest, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version, ERA = 216, V215_COMMIT = '7474f0607bfdf50b768e95221a1f7e9ef52067b6';
const HM_DIGEST = '0ac7da6b1691a8e1';
const ROWS = ['F0','F1','F2','F3','G1','G2','N1','K1','HM'];
let pass = 0, fail = 0, skip = 0, TMP = null;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const skipRow = l => { skip++; console.log('SKIP ' + l); };
const done = () => { if(TMP) try { fs.rmSync(TMP, { recursive:true, force:true }); } catch(e){}
  console.log('\nSKIP ' + skip + '\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
if(VER < ERA){ console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D156 (V' + ERA + ').'); ROWS.forEach(r => skipRow(r + ' below the D156 era')); done(); }

// ── oracles ──────────────────────────────────────────────────────────────────────────────
const card = y => (y && !y.rest && y.cardio && !Array.isArray(y.cardio)) ? y.cardio : null;
const isLong = y => { const c = card(y); return !!(c && !c.isNRC && c.dose && c.dose.key === 'long'); };
const tierOf = y => { const c = card(y); if(!isLong(y) || c.type !== 'run') return null; const d = c.dose;
  const m = d.k === 'time' ? (+d.mins || 0) : (+d.mi || 0) * (+d.tgt || 0) / 60; if(!m) return null; return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C'; };
const FIN = /^(Arms|Delts) finisher$/;
const hasFin = y => ((y && y.sections) || []).some(s => FIN.test(String(s.label || '')));
const isStr = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n || '');
const setsOf = d => { let m = /^(\d+)\s*[x×]/.exec(d || ''); if(m) return +m[1]; m = /\b(\d+)\s*sets?\b/i.exec(d || ''); return m ? +m[1] : 1; };
const daySets = y => ((y && y.sections) || []).reduce((a, s) => a + (s.items || []).reduce((b, it) => b + (isStr(it.name) ? 0 : setsOf(it.detail)), 0), 0);
const liftSecs = y => ((y && y.sections) || []).filter(s => !/mobility|taper/i.test(s.label || ''));
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const stem = s => String(s.label || (s.coreHeader ? '{core}' : '(none)')).replace(/\s*—\s.*$/, '');
const cl = o => JSON.parse(JSON.stringify(o));
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const CAL = ['sun','mon','tue','wed','thu','fri','sat'];
const prevDay = (p, w, d) => { const i = CAL.indexOf(d); return i > 0 ? [w, CAL[i - 1]] : [+w - 1, 'sat']; };
const dayOf = (p, w, d) => (p && p.weeks && p.weeks[w]) ? p.weeks[w][d] : undefined;

// ── lattices (measure's) ─────────────────────────────────────────────────────────────────
const FOC = ['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const EQ = ['crossfit','commercial','home_full','home_basic','bodyweight'];
const EXP = ['beginner','intermediate','advanced'];
const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
const STAND = {name:'M',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',
  mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],
  days:['sun','mon','tue','wed','thu','fri','sat'],bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
const NSWG = ['run_pace_goal','run_mile_time','run_15_under10','run_base'], MM = [['8','15'],['12','0']];
const L = [];
for(const g of NSWG) for(const mm of MM) for(const f of FOC) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1];
  c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; L.push({lat:'NSW', k:[g, mm.join(':'), f, q, r.join(','), e].join('|'), c}); }
for(const sd of [76308, 1234]) for(const g of NSWG) for(const mm of MM) for(const f of ['strength','hypertrophy']) for(const q of ['commercial','home_full']) for(const r of RESTS) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1];
  c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; c.seed = sd; L.push({lat:'NSW+seeds', k:[sd, g, mm.join(':'), f, q, r.join(','), e].join('|'), c}); }
const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
let ii = 0;
for(const g of NSWG) for(const ex of EXTRAS) for(const f of ['strength','hypertrophy']) for(const q of ['commercial','home_full']) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.liftingFocus = f; c.equipment = q; c.experience = e; c.restDays = RESTS[ii++ % 5].slice();
  if(ex.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = {id:ex.bike,label:ex.bike,baselineDist:'10',baseline:'10mi'}; }
  if(ex.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = {id:ex.swim,label:ex.swim,baselineDist:'1000',baseline:'1000m'}; }
  L.push({lat:'NSW multi', k:[g, Object.keys(ex).join('+'), f, q, e].join('|'), c}); }
const PLANS = ['run_5k','run_10k','run_half','run_marathon'], RACED = ['2026-12-06','2027-01-17','2027-03-28'];
const MILE = [['7','30'],['8','15'],['10','30'],['12','0']], AGE = ['18-35','36-54','55+'];
let jj = 0;
for(const plan of PLANS) for(const e of EXP) for(const r of RESTS) for(const q of ['commercial','home_full']) for(const f of ['strength','hypertrophy']) for(const dated of [true,false]){
  const i = jj++; const c = Object.assign(cl(fixtures.HALF_MANNY), {name:'M',primaryPath:dated?'event':'fitness',cardioTypes:['run'],
    cardioGoals:{run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}},
    eventTargeted:dated,raceDate:dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:f,experience:e,ageBracket:AGE[i%3],equipment:q,restDays:r.slice(),seed:76308});
  L.push({lat:'NRC', k:[plan, e, r.join(','), q, f, dated].join('|'), c}); }
const NSW_LATS = ['NSW','NSW+seeds','NSW multi'];

// ── baseline and the NODD twin ───────────────────────────────────────────────────────────
const PAIR = VER === ERA;
let V215 = null, v215err = null, NODD = null, nodderr = null;
try {
  TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'g216d156-'));
  const src = fs.readFileSync(path.resolve(ART), 'utf8'), A = 'function deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks){', n = src.split(A).length - 1;
  if(n !== 1) nodderr = 'NODD anchor count ' + n;
  else { const f = path.join(TMP, 'nodd.html'); fs.writeFileSync(f, src.replace(A, () => A + ' return 0;')); NODD = load(f); }
} catch(e){ nodderr = String(e && e.message || e).slice(0, 200); NODD = null; }
if(PAIR){
  try {
    if(BASEFILE){ const b = load(BASEFILE); if(+b.version === 215) V215 = b; else v215err = 'argv[3] reads ' + b.version; }
    if(!V215){ const f = path.join(TMP, 'v215.html');
      fs.writeFileSync(f, cp.execFileSync('git', ['show', V215_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 26 }));
      V215 = load(f); if(+V215.version !== 215){ v215err = 'git ' + V215_COMMIT.slice(0, 7) + ' reads ' + V215.version; V215 = null; } }
  } catch(e){ v215err = String(e && e.message || e).slice(0, 200); V215 = null; }
}

// ── run ──────────────────────────────────────────────────────────────────────────────────
const S = {}; NSW_LATS.concat(['NRC']).forEach(l => S[l] = { cfg:0, crash:0, longFin:0, longFinEx:[], chgLong:{}, K:0, X:0, XEx:[], nrcDiff:0, nrcEx:[] });
const F0 = {}, F2 = { lost:0, of:0 }, F3 = { n:0, diff:0, ex:[] }, G = { bDays:0, zero:0, over8:0, max:0, ex:[] };
function kClass(p, b, w, d, x, y, nodd){
  if(isLong(y) || isLong(x) || !x || !y || x.title !== y.title) return 'title or long';
  const sx = (x.sections || []), sy = (y.sections || []);
  if(sx.length !== sy.length || sx.some((s, i) => stem(s) !== stem(sy[i]) || (s.items || []).length !== (sy[i].items || []).length)) return 'shape';
  let diffs = 0;
  for(let i = 0; i < sx.length; i++) for(let j = 0; j < (sx[i].items || []).length; j++){
    const a = sx[i].items[j], c = sy[i].items[j];
    if(String(a.detail || '') !== String(c.detail || '')) return 'detail';
    if(clean(a.name) === clean(c.name)) continue;
    diffs++;
    if(/^(main|primer|power)/i.test(String(sx[i].label || ''))) return 'main';
    const z = nodd && nodd.weeks[w] && nodd.weeks[w][d], zs = z && z.sections && z.sections[i], zi = zs && zs.items && zs.items[j];
    if(!zi || clean(zi.name) !== clean(c.name)) return 'candidate renamed';   // the candidate prints the drawn name here
  }
  if(!diffs) return 'no name diff';
  const [pw, pd] = prevDay(p, w, d);
  if(isLong(dayOf(p, pw, pd)) || JSON.stringify(dayOf(b, pw, pd)) !== JSON.stringify(dayOf(p, pw, pd))) return '';
  return 'prev day not long and unchanged';
}
L.forEach(x => {
  const R = S[x.lat]; let p, b = null;
  try { p = IA.buildProgram(cl(x.c)); if(PAIR && V215) b = V215.buildProgram(cl(x.c)); } catch(e){ R.crash++; return; }
  R.cfg++;
  let nodd = null;
  Object.keys(p.weeks || {}).forEach(w => CAL.forEach(d => {
    const y = p.weeks[w][d], o = b && b.weeks[w] && b.weeks[w][d];
    if(x.lat === 'NRC'){ if(b && JSON.stringify(o) !== JSON.stringify(y)){ R.nrcDiff++; if(R.nrcEx.length < 3) R.nrcEx.push(x.k + ' W' + w + ' ' + d); } return; }
    if(!y) return;
    const T = tierOf(y);
    if(isLong(y) && hasFin(y)){ R.longFin++; if(R.longFinEx.length < 3) R.longFinEx.push(x.k + ' W' + w + ' ' + d); }
    if(T === 'B'){ G.bDays++; if(!liftSecs(y).length) G.zero++; const n = daySets(y); if(n > 8){ G.over8++; if(G.ex.length < 3) G.ex.push(x.k + ' W' + w + ' ' + d + ' ' + n + ' sets'); } if(n > G.max) G.max = n; }
    if(!b) return;
    if(x.lat === 'NSW' && o && isLong(o) && hasFin(o)) bump(F0, tierOf(o) || 'other');
    if(x.lat === 'NSW' && T === 'C' && o && hasFin(o)){ F2.of++; if(!hasFin(y)) F2.lost++; }
    if(T === 'A'){ F3.n++; if(JSON.stringify(o) !== JSON.stringify(y)){ F3.diff++; if(F3.ex.length < 3) F3.ex.push(x.k + ' W' + w + ' ' + d); } }
    if(JSON.stringify(o) === JSON.stringify(y)) return;
    if(isLong(y)){ bump(R.chgLong, T || (card(y).type + ' long')); return; }
    if(NODD && !nodd) nodd = NODD.buildProgram(cl(x.c));
    const why = kClass(p, b, w, d, o, y, nodd);
    if(!why) R.K++; else { R.X++; bump(R.why = R.why || {}, why); if(R.XEx.length < 3) R.XEx.push(x.k + ' W' + w + ' ' + d + ' [' + why + ']'); }
  }));
});
const tot = l => S[l].cfg + ' configs';
Object.keys(S).forEach(l => { if(S[l].crash) ok('P0 ' + l + ': every config builds', false, S[l].crash + ' crashed'); });
if(!PAIR) skipRow('F0 fixture needs the 216/215 pair (V215 finisher counts)');
else if(!V215) ok('F0 fixture needs V215', false, v215err);
else ok('F0 fixture: V215 printed an Arms or Delts finisher on NSW long days of tier B and tier C (' + JSON.stringify(F0) + ')', (F0.B || 0) > 0 && (F0.C || 0) > 0, JSON.stringify(F0));
NSW_LATS.forEach(l => ok('F1 ' + l + ': no long day prints an Arms or Delts finisher (' + tot(l) + ')', !S[l].longFin, S[l].longFin + ' ' + S[l].longFinEx.join('; ')));
G.bDays && console.log('tier B long days ' + G.bDays + ', max working sets ' + G.max);
ok('G1 tier B long days: none is left with no lifting section (' + G.bDays + ' days)', G.bDays > 0 && !G.zero, G.zero);
ok('G2 tier B long days: none prints more than 8 working sets (' + G.bDays + ' days)', G.bDays > 0 && !G.over8, G.over8 + ' ' + G.ex.join('; '));
if(!PAIR){ ['F2','F3','N1','K1'].forEach(r => skipRow(r + ' pair row: candidate ' + VER + ' is not 216')); }
else if(!V215){ ['F2','F3','N1','K1'].forEach(r => ok(r + ' pair row needs V215', false, v215err)); }
else {
  ok('F2 PAIR NSW: every tier C day V215 printed a finisher on loses it (' + F2.lost + '/' + F2.of + ')', F2.of > 0 && F2.lost === F2.of, F2.lost + '/' + F2.of);
  ok('F3 PAIR every tier A long day is byte-identical to V215 (' + F3.n + ' days)', F3.n > 0 && !F3.diff, F3.diff + ' ' + F3.ex.join('; '));
  ok('N1 PAIR every NRC program byte-identical to V215 (' + tot('NRC') + ')', S.NRC.cfg > 0 && !S.NRC.nrcDiff, S.NRC.nrcDiff + ' days ' + S.NRC.nrcEx.join('; '));
  if(!NODD) NSW_LATS.forEach(l => ok('K1 PAIR ' + l + ' needs the NODD twin', false, nodderr));
  else NSW_LATS.forEach(l => { const R = S[l];
    console.log('   ' + l + ': changed long days ' + JSON.stringify(R.chgLong) + ', knock-on K ' + R.K + ', unclassified ' + R.X + (R.X ? ' ' + JSON.stringify(R.why) : ''));
    ok('K1 PAIR ' + l + ': every changed day is a long day or a knock-on rename only V215 made (K ' + R.K + ')', !R.X, R.X + ' ' + R.XEx.join('; ')); });
}
{ const d = progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY)));
  ok('HM HALF_MANNY digest is ' + HM_DIGEST + ' (ruled unmoved)', d === HM_DIGEST, d); }
done();
