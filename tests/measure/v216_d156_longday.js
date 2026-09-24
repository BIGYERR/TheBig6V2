// V216 measure (Mode B, before-picture) — D156: loaded-full `_longDay` vs the NSW long run.
// Run: node tests/measure/v216_d156_longday.js [index.html]
// Copies (source surgery, anchors asserted count==1), each with a d18 toggle (globalThis.__NOD18)
// so the pre-D18 skeleton can be printed from the same artifact:
//   BASE = as shipped;  CF = `_longDay` also true when c.dose && c.dose.key==='long' (NRC/bike/swim subtype tests kept)
// Oracle for "long-run day": _longRunTier (the D18/D140 tier contract: NRC by /^long run/ subtype,
// NSW by dose.key 'long'), minutes -> tier by the doctrine thresholds 75/45. Loaded-full day identified
// by its skeleton label 'Upper superset' (written only at the _loadedFull branch). Sets counted by hand
// parse of the detail ("N×" or "N sets", stretches free) — the ≤8 doctrine line.
const fs = require('fs'), path = require('path');
const { load, fixtures, progDigest } = require('../harness');
const SRC = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'index.html'));
const SCR = process.env.SCR || require('os').tmpdir();
const html = fs.readFileSync(SRC, 'utf8');
const cnt = (s, a) => s.split(a).length - 1;
const A1 = 'const _longDay=!!(_c&&_c.subtype&&(', A2 = 'function d18LongRunDayPass(weeks){';
if(cnt(html, A1) !== 1 || cnt(html, A2) !== 1){ console.log('ANCHOR FAIL', cnt(html, A1), cnt(html, A2)); process.exit(2); }
const tog = h => h.replace(A2, () => A2 + ' if(globalThis.__NOD18) return;');
const wr = (n, s) => { const f = path.join(SCR, n); try { fs.unlinkSync(f); } catch(e){} fs.writeFileSync(f, s); return f; };
const BA = load(wr('v216_d156_base.html', tog(html)));
const CF = load(wr('v216_d156_cf.html', tog(html).replace(A1, () => "const _longDay=!!(_c&&_c.dose&&_c.dose.key==='long')||!!(_c&&_c.subtype&&(")));
const RAW = load(SRC);
console.log('ia-version ' + RAW.version);
const tierOf = RAW.eval('_longRunTier');
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const cl = o => JSON.parse(JSON.stringify(o));
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const isStr = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n || '');
const setsOf = d => { let m = /^(\d+)\s*[x×]/.exec(d || ''); if(m) return +m[1]; m = /\b(\d+)\s*sets?\b/i.exec(d || ''); return m ? +m[1] : 1; };
const daySets = y => (y && y.sections || []).reduce((a, s) => a + (s.items || []).reduce((b, it) => b + (isStr(it.name) ? 0 : setsOf(it.detail)), 0), 0);
const dayItems = y => (y && y.sections || []).reduce((a, s) => a + (s.items || []).length, 0);
const liftSecs = y => (y && y.sections || []).filter(s => !/mobility|taper/i.test(s.label || ''));
const grid = y => y ? '"' + y.title + '" ' + (y.sections || []).map(s => (s.label || s.coreHeader || '') + '[' + (s.items || []).map(i => clean(i.name) + ' ' + (i.detail || '').split(' — ')[0].split(' @')[0]).join(', ') + ']').join(' | ') : '(none)';
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
function build(IA, c, noD18){ IA.window.__NOD18 = !!noD18; try { return IA.buildProgram(cl(c)); } finally { IA.window.__NOD18 = false; } }

// ── lattices (g211 dimensions) ──
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
// L1: full g211 NSW lattice, seed 24865 (3,600 configs) — whole-lattice blast radius
for(const g of NSWG) for(const mm of MM) for(const f of FOC) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1];
  c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; L.push({lat:'NSW', seg:g + '/' + mm.join(':'), c}); }
// L2: the loaded-full slice (strength|hypertrophy x commercial|home_full) at two more seeds
for(const sd of [76308, 1234]) for(const g of NSWG) for(const mm of MM) for(const f of ['strength','hypertrophy']) for(const q of ['commercial','home_full']) for(const r of RESTS) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1];
  c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; c.seed = sd; L.push({lat:'NSW+seeds', seg:g + '/' + mm.join(':'), c}); }
// L3: NSW multi-sport, loaded-full slice (does a bike/swim card carry key 'long'?)
const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
let ii = 0;
for(const g of NSWG) for(const ex of EXTRAS) for(const f of ['strength','hypertrophy']) for(const q of ['commercial','home_full']) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.liftingFocus = f; c.equipment = q; c.experience = e; c.restDays = RESTS[ii++ % 5].slice();
  if(ex.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = {id:ex.bike,label:ex.bike,baselineDist:'10',baseline:'10mi'}; }
  if(ex.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = {id:ex.swim,label:ex.swim,baselineDist:'1000',baseline:'1000m'}; }
  L.push({lat:'NSW multi', seg:g + '+' + Object.keys(ex).join('+'), c}); }
// L4: NRC loaded-full slice (g211 nrcCfg shape) — must be unmoved
const PLANS = ['run_5k','run_10k','run_half','run_marathon'], RACED = ['2026-12-06','2027-01-17','2027-03-28'];
const MILE = [['7','30'],['8','15'],['10','30'],['12','0']], AGE = ['18-35','36-54','55+'];
let jj = 0;
for(const plan of PLANS) for(const e of EXP) for(const r of RESTS) for(const q of ['commercial','home_full']) for(const f of ['strength','hypertrophy']) for(const dated of [true,false]){
  const i = jj++; const c = Object.assign(cl(fixtures.HALF_MANNY), {name:'M',primaryPath:dated?'event':'fitness',cardioTypes:['run'],
    cardioGoals:{run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}},
    eventTargeted:dated,raceDate:dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:f,experience:e,ageBracket:AGE[i%3],equipment:q,restDays:r.slice(),seed:76308});
  L.push({lat:'NRC', seg:plan, c}); }

// ── run ──
const R = {};
const get = k => R[k] || (R[k] = {cfg:0, crash:0, days:0, lf:{}, lfFalse:{}, keys:{}, chg:{}, chgOff:0, pre:{}, post:{}, zeroB:{base:0, cf:0}, over8:{base:0, cf:0}, maxB:{base:0, cf:0}, tierB:0, secsLost:{}, ex:[]});
let selfN = 0, selfBad = 0;
L.forEach((x, idx) => {
  const S = get(x.lat); let b0, b1, c0, c1;
  try { b0 = build(BA, x.c, true); b1 = build(BA, x.c, false); c0 = build(CF, x.c, true); c1 = build(CF, x.c, false); } catch(e){ S.crash++; if(S.crash < 3) console.log('CRASH ' + x.lat + ' ' + e.message); return; }
  if(idx % 200 === 0){ selfN++; if(JSON.stringify(build(BA, x.c, false).weeks) !== JSON.stringify(b1.weeks)) selfBad++; }
  S.cfg++;
  for(let w = 1; w <= b1.totalWeeks; w++) for(const d of DAYS){
    const yb0 = b0.weeks[w] && b0.weeks[w][d], yb1 = b1.weeks[w] && b1.weeks[w][d], yc0 = c0.weeks[w] && c0.weeks[w][d], yc1 = c1.weeks[w] && c1.weeks[w][d];
    if(!yb1) continue; S.days++;
    const cd = yb0 && !yb0.rest ? yb0.cardio : null;
    const t = cd && !Array.isArray(cd) ? tierOf(cd) : null;
    const T = t || 'none';
    const lf = !!(yb0 && (yb0.sections || []).some(s => s.label === 'Upper superset'));
    const changed = JSON.stringify(yb1) !== JSON.stringify(yc1);
    if(changed){ bump(S.chg, T + (lf ? ' loaded-full' : ' other')); if(!t) S.chgOff++; }
    if(t === 'B'){ S.tierB++;
      for(const [nm, y] of [['base', yb1], ['cf', yc1]]){ if(!liftSecs(y).length) S.zeroB[nm]++; const n = daySets(y); if(n > 8) S.over8[nm]++; if(n > S.maxB[nm]) S.maxB[nm] = n; } }
    if(!lf) continue;
    const K = T + ' ' + (cd && cd.type) + (cd && cd.isNRC ? ' NRC' : '');
    bump(S.lf, K); bump(S.keys, (cd && cd.type) + ' key=' + (cd && cd.dose && cd.dose.key) + ' sub=' + String(cd && cd.subtype || '').split(' — ')[0].slice(0, 28) + ' tier=' + T);
    const fin = (yb0.sections || []).some(s => /finisher/i.test(s.label || ''));
    if(!fin) continue;
    bump(S.lfFalse, K);
    // skeleton before D18, and what D18 leaves
    const acc = (o, k, y) => { o[k] = o[k] || {n:0, secs:0, items:0, sets:0}; o[k].n++; o[k].secs += (y && y.sections || []).length; o[k].items += dayItems(y); o[k].sets += daySets(y); };
    acc(S.pre, T + ' base', yb0); acc(S.pre, T + ' cf', yc0); acc(S.post, T + ' base', yb1); acc(S.post, T + ' cf', yc1);
    const bl = new Set((yc1 && yc1.sections || []).map(s => s.label || s.coreHeader || '')); (yb1.sections || []).forEach(s => { const lab = s.label || s.coreHeader || ''; if(!bl.has(lab)) bump(S.secsLost, T + '|' + lab); });
    if(t === 'B' && S.ex.length < 3 && changed && !S.ex.some(e => e.startsWith(x.seg + ' ' + x.c.liftingFocus)))
      S.ex.push(x.seg + ' ' + x.c.liftingFocus + '/' + x.c.equipment + '/' + x.c.experience + ' rest ' + x.c.restDays.join(',') + ' seed ' + x.c.seed + ' W' + w + ' ' + d + ' {' + cd.subtype + ', ' + (cd.dose.mins || '') + (cd.dose.mi ? cd.dose.mi + 'mi@' + cd.dose.tgt : '') + '}' +
        '\n      BASE pre-D18 : ' + grid(yb0) + '\n      CF   pre-D18 : ' + grid(yc0) + '\n      BASE shipped : ' + grid(yb1) + '\n      CF   shipped : ' + grid(yc1));
  }
});
const pr = (t, o) => { const ks = Object.keys(o).sort(); console.log('  ' + t + (ks.length ? '' : ' (none)')); ks.forEach(k => console.log('     ' + k + ': ' + (typeof o[k] === 'object' ? JSON.stringify(o[k]) : o[k]))); };
Object.keys(R).forEach(k => { const S = R[k];
  console.log('\n=== ' + k + ': ' + S.cfg + ' configs, ' + S.crash + ' crashed, ' + S.days + ' days, tier B days ' + S.tierB + ' ===');
  pr('loaded-full days by long-run tier/type:', S.lf);
  pr('  of which BASE draws the finisher (_longDay false):', S.lfFalse);
  pr('cardio key/subtype on loaded-full days:', S.keys);
  pr('finisher days, pre-D18 totals {n, sections, items, sets}:', S.pre);
  pr('finisher days, shipped (post-D18) totals:', S.post);
  pr('sections in BASE shipped that CF does not print (tier|label):', S.secsLost);
  pr('days changed CF vs BASE (shipped), by tier:', S.chg);
  console.log('  days changed off a long-run day: ' + S.chgOff);
  console.log('  tier B zero-lift days: base ' + S.zeroB.base + ' cf ' + S.zeroB.cf + '   tier B >8 sets: base ' + S.over8.base + ' cf ' + S.over8.cf + '   max sets base ' + S.maxB.base + ' cf ' + S.maxB.cf);
  S.ex.forEach(e => console.log('   EX ' + e));
});
console.log('\nbase self-stable: ' + (selfN - selfBad) + '/' + selfN);
const hm = IA => { IA.window.__NOD18 = false; return progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY))); };
console.log('HALF_MANNY: raw ' + hm(RAW) + '  base(toggle off) ' + hm(BA) + '  cf ' + hm(CF) + '  (pin 0ac7da6b1691a8e1)');
// spread: every other site that finds a long day by /^Long Run/ subtype (comments stripped)
console.log('\n=== spread: code lines testing a Long Run subtype (comments stripped) ===');
RAW.js.split('\n').forEach((l, i) => { const s = l.replace(/(^|[^:'"\\])\/\/.*$/, '$1'); if(/Long Run|long run/.test(s) && /\.test\(|match\(|indexOf|startsWith/.test(s) && !/^\s*\*/.test(s)) console.log('  js:' + (i + 1) + '  ' + s.trim().slice(0, 200)); });
