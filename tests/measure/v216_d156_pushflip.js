// V216 measure (sibling of v216_d156_longday.js) — locate the Push-day knock-on of the D156 counterfactual.
// Run: node tests/measure/v216_d156_pushflip.js [index.html]
// Copies: BASE / CF (D156 shape), each instrumented in deconflictAdjacentDupes to (a) log every rename
// {w,d,was,to,prev-day} to globalThis.__DD and (b) honour globalThis.__NODD (skip the pass entirely).
// Proof standard: with the pass disabled on BOTH copies, the off-long-run Push flips must go to 0;
// with it live, every flipped item must be a logged rename on exactly one side.
const fs = require('fs'), path = require('path');
const { load } = require('../harness');
const SRC = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'index.html'));
const SCR = process.env.SCR || require('os').tmpdir();
const html = fs.readFileSync(SRC, 'utf8');
const cnt = (s, a) => s.split(a).length - 1;
const A1 = 'const _longDay=!!(_c&&_c.subtype&&(';
const D0 = 'function deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks){';
const D1 = '        it.name=to;\n        if(sec.label&&sec.label.indexOf(was)>=0) sec.label=sec.label.split(was).join(to);';
[A1, D0, D1].forEach(a => { if(cnt(html, a) !== 1){ console.log('ANCHOR FAIL', cnt(html, a), a.slice(0, 60)); process.exit(2); } });
const inst = h => h.replace(D0, () => D0 + ' if(globalThis.__NODD) return 0; globalThis.__DDU=(typeof _swapUniverseList===\'function\')?_swapUniverseList().slice():[];')
  .replace(D1, () => D1 + '\n        (globalThis.__DD||(globalThis.__DD=[])).push({w:wB,d:dB,was:was,to:to,prev:wA+\'|\'+dA,sec:sec.label||\'\'});');
const wr = (n, s) => { const f = path.join(SCR, n); try { fs.unlinkSync(f); } catch(e){} fs.writeFileSync(f, s); return f; };
const BA = load(wr('v216_pf_base.html', inst(html)));
const CF = load(wr('v216_pf_cf.html', inst(html).replace(A1, () => "const _longDay=!!(_c&&_c.dose&&_c.dose.key==='long')||!!(_c&&_c.subtype&&(")));
const RAW = load(SRC); const tierOf = RAW.eval('_longRunTier');
console.log('ia-version ' + RAW.version + '  deconflictAdjacentDupes at index.html:' + (html.slice(0, html.indexOf(D0)).split('\n').length) + ', called at :' + (html.slice(0, html.indexOf('  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);')).split('\n').length));
const cl = o => JSON.parse(JSON.stringify(o));
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
function build(IA, c, nodd){ IA.window.__NODD = !!nodd; IA.window.__DD = []; try { const p = IA.buildProgram(cl(c)); p.__dd = IA.window.__DD; p.__ddu = IA.window.__DDU || []; return p; } finally { IA.window.__NODD = false; } }
const STAND = {name:'M',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'x',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:['sun','mon','tue','wed','thu','fri','sat'],bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']], EXP = ['beginner','intermediate','advanced'];
const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
const L = [];
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of ['strength','hypertrophy']) for(const q of ['commercial','home_full']) for(const r of RESTS) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; L.push({lat:'NSW', seg:g, c}); }
let ii = 0;
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const ex of EXTRAS) for(const f of ['strength','hypertrophy']) for(const q of ['commercial','home_full']) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.liftingFocus = f; c.equipment = q; c.experience = e; c.restDays = RESTS[ii++ % 5].slice();
  if(ex.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = {id:ex.bike,label:ex.bike,baselineDist:'10',baseline:'10mi'}; }
  if(ex.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = {id:ex.swim,label:ex.swim,baselineDist:'1000',baseline:'1000m'}; }
  L.push({lat:'NSW multi', seg:g + '+' + Object.keys(ex).join('+'), c}); }
const names = y => [].concat(...((y && y.sections) || []).map(s => (s.items || []).map(i => i.name)));
const grid = y => y ? (y.rest ? 'Rest' : '"' + y.title + '"' + (y.cardio && !Array.isArray(y.cardio) ? ' {' + String(y.cardio.subtype).split(' — ')[0] + '}' : '') + ' ' + (y.sections || []).map(s => (s.label || s.coreHeader || '') + '[' + (s.items || []).map(i => i.name).join(', ') + ']').join(' | ')) : '-';
const R = {};
L.forEach(x => {
  const S = R[x.lat] || (R[x.lat] = {cfg:0, off:0, offNoDD:0, explained:0, unexplained:0, prevLong:0, prevTitle:{}, kind:{}, uniDiff:0, ex:[]});
  const b = build(BA, x.c, false), c = build(CF, x.c, false), bn = build(BA, x.c, true), cn = build(CF, x.c, true);
  S.cfg++;
  if(JSON.stringify(b.__ddu.slice().sort()) !== JSON.stringify(c.__ddu.slice().sort())) S.uniDiff++;
  const flat = []; for(let w = 1; w <= b.totalWeeks; w++) ['sun','mon','tue','wed','thu','fri','sat'].forEach(d => flat.push([w, d]));
  flat.forEach(([w, d], fi) => {
    const yb = b.weeks[w][d], yc = c.weeks[w][d]; if(!yb) return;
    const cd = yb.cardio; if(cd && !Array.isArray(cd) && tierOf(cd)) return;          // off long-run days only
    if(JSON.stringify(yb) === JSON.stringify(yc)) return;
    S.off++;
    if(JSON.stringify(bn.weeks[w][d]) !== JSON.stringify(cn.weeks[w][d])) S.offNoDD++;
    const nb = names(yb), nc = names(yc);
    const logB = b.__dd.filter(r => r.w === w && r.d === d), logC = c.__dd.filter(r => r.w === w && r.d === d);
    const diffs = nb.map((n, i) => [n, nc[i]]).filter(p => p[0] !== p[1]);
    const ok = diffs.length && diffs.every(([nB, nC]) => logB.some(r => r.to === nB && r.was === nC && !logC.some(q => q.was === nC)) || logC.some(r => r.to === nC && r.was === nB && !logB.some(q => q.was === nB)));
    if(ok) S.explained++; else S.unexplained++;
    diffs.forEach(([nB, nC]) => { const r = logB.find(r => r.to === nB && r.was === nC); bump(S.kind, (r ? 'BASE renamed drawn "' + nC + '" -> "' + nB + '" (dupe of prev day)' : 'other: ' + nB + ' | ' + nC)); });
    const pr = logB.concat(logC)[0]; if(pr){ const [pw, pd] = pr.prev.split('|'); const P = b.weeks[pw][pd]; bump(S.prevTitle, (P && P.title) + (P && P.cardio && !Array.isArray(P.cardio) ? ' tier ' + (tierOf(P.cardio) || '-') : '')); if(P && P.cardio && !Array.isArray(P.cardio) && tierOf(P.cardio)) S.prevLong++; }
    if(S.ex.length < 2 && ok && pr){ const [pw, pd] = pr.prev.split('|');
      const wk = (p, w) => ['sun','mon','tue','wed','thu','fri','sat'].map(dd => '        ' + dd + ' ' + grid(p.weeks[w][dd])).join('\n');
      S.ex.push(x.seg + ' ' + x.c.liftingFocus + '/' + x.c.equipment + '/' + x.c.experience + ' rest ' + x.c.restDays.join(',') + ' — W' + w + ' ' + d + ' (prev day ' + pr.prev + ')\n     rename log BASE: ' + JSON.stringify(logB) + '\n     rename log CF:   ' + JSON.stringify(logC) + '\n     BASE week ' + w + ':\n' + wk(b, w) + '\n     CF week ' + w + ':\n' + wk(c, w)); }
  });
});
function bump(o, k){ o[k] = (o[k] || 0) + 1; }
Object.keys(R).forEach(k => { const S = R[k];
  console.log('\n=== ' + k + ': ' + S.cfg + ' configs ===');
  console.log('  off-long-run days changed CF vs BASE: ' + S.off);
  console.log('  ... with deconflictAdjacentDupes disabled on both copies: ' + S.offNoDD);
  console.log('  changed days fully explained by one-sided dedupe renames: ' + S.explained + '   unexplained: ' + S.unexplained);
  console.log('  changed days whose dedupe partner (previous calendar day) is a long-run day: ' + S.prevLong + ' of ' + S.off);
  console.log('  configs where the dedupe candidate universe differs BASE vs CF: ' + S.uniDiff + ' of ' + S.cfg);
  console.log('  previous-day titles:', JSON.stringify(S.prevTitle));
  Object.keys(S.kind).sort().forEach(q => console.log('    ' + S.kind[q] + '  ' + q));
  S.ex.forEach(e => console.log('\n  EX ' + e));
});
// ── appendix: how many BASE dedupe renames were triggered by a name the shipped previous day no longer prints ──
// (dedupe runs before d18LongRunDayPass, so it can dodge a finisher item D18 later strips)
(function(){
  let n = 0, ghost = 0; const byT = {};
  L.forEach(x => { const b = build(BA, x.c, false), c = build(CF, x.c, false);
    b.__dd.forEach(r => { const [pw, pd] = r.prev.split('|'); const P = b.weeks[pw] && b.weeks[pw][pd];
      const cd = P && P.cardio; const t = cd && !Array.isArray(cd) ? tierOf(cd) : null;
      const cP = c.weeks[pw] && c.weeks[pw][pd];
      // only the renames that CF does not make (the knock-on set)
      if(c.__dd.some(q => q.w === r.w && q.d === r.d && q.was === r.was)) return;
      const Y = b.weeks[r.w][r.d], yc0 = Y && Y.cardio; if(yc0 && !Array.isArray(yc0) && tierOf(yc0)) return;   // renamed day must be off a long-run day
      n++; const shown = names(P).includes(r.was); if(!shown){ ghost++; byT[t || 'none'] = (byT[t || 'none'] || 0) + 1; } }); });
  console.log('\n=== appendix: BASE-only dedupe renames on off-long-run days ' + n + '; of them the triggering name is ABSENT from the shipped previous day: ' + ghost + ' ' + JSON.stringify(byT));
})();
