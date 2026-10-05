// v231_bwfallback.js — MEASURE (read-only). V231 measure pass M14: before-picture for P-BWFALLBACK, D195 P-HIPEXT and
//   P-FILTERLAST ruled together. (1) census of every bodyweightSweep substitution that goes through _bwFallback (not
//   _BW_SUBS), by branch, source -> landing, source/landing _pattern, Main vs accessory, week/day, and the config's own
//   plan verdict on the landing (applyInjuryFilter on a clone of the BUILT day). (3) two counterfactual arms by source
//   surgery on scratch copies: CF-A every catch-all source whose _pattern is hip_ext lands on 'Single-leg glute bridge',
//   CF-B on 'Single-leg hip thrust (shoulders on bed)'. (4) M13's post-sweep re-filter differential on V230, CF-A, CF-B.
//   (5) day cards. Tag tree: the sweep stamps __bw on every name it changes and pushes an event; a hook right after the
//   sweep snapshots names so any post-sweep renamer is counted. Tag neutrality is proven (tag stripped == untagged).
//   SCR=<scratch> PART=<prep|run|report|all> node tests/measure/v231_bwfallback.js
// Oracles: the injury the config sets; (a″) by the CAP hand table copied from tests/gates/g229_d193_build.js (ruling
//   D193, not the engine); calendar adjacency by date order (mon..sun, sun -> next mon); same-day double by name equality;
//   the two landing names from Mario's doctrine (handoff §12 P-BWFALLBACK). The suspect (_bwFallback) is never asked.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const PART = process.env.PART || 'none';
const TREES = { V230:F('v230.html'), CFA:F('cfa.html'), CFB:F('cfb.html'), TAG:F('tag230.html'), TAGA:F('tagA.html'), TAGB:F('tagB.html') };
const ARMS = { V230:'TAG', CFA:'TAGA', CFB:'TAGB' };
const LAND = { CFA:'Single-leg glute bridge', CFB:'Single-leg hip thrust (shoulders on bed)' };
const CLOCK = '2026-08-24';
const clone = x => JSON.parse(JSON.stringify(x)); const P = s => console.log(s);
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort((a, b) => m[b] - m[a] || (a < b ? -1 : 1)).map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const REGS = ['knee','ankle','hip','lowback','shoulder','elbow'], TIERS = ['workaround','protect'], EXPS = ['beginner','intermediate','advanced'];
const GOAL = { lift:null, run_base:'run_base', run_5k:'run_5k', run_half:'run_half' };
function goalify(c, g){ if(!GOAL[g]) return c; const race = /5k|10k|half|marathon/.test(g);
  return Object.assign(c, { primaryPath: race ? 'event' : 'cardio', cardioTypes:['run'], cardioGoals:{ run:{ id:g, label:g, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } }, eventTargeted:race, raceDate: race ? '2026-12-06' : null }); }
function lattices(){ const out = []; const M = o => Object.assign(clone(MARIO), o);
  // L432 and LBW: M13's definitions verbatim (tests/measure/v230_postsweep_reject.js)
  for(const g of REGS) for(const t of TIERS) for(const eq of ['commercial','crossfit','home_full','bodyweight']) for(const ex of EXPS) for(const fo of ['support_strength','support_athletic','support_prevention'])
    out.push({ L:'L432', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|sun,wed', c:M({ injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }) });
  for(const g of REGS) for(const t of TIERS) for(const eq of ['bodyweight','home_basic']) for(const ex of EXPS) for(const fo of ['balanced','strength','hypertrophy']) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'LBW', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|' + rd.join(','), c:M({ injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo, restDays:rd }) });
  // M13 UNKNOWN cells
  for(const g of REGS) for(const t of TIERS) for(const eq of ['crossfit','home_full']) for(const ex of EXPS) for(const fo of ['balanced','strength','hypertrophy']) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'U_EQ', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|' + rd.join(','), c:M({ injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo, restDays:rd }) });
  for(const g of REGS) for(const t of TIERS) for(const eq of ['bodyweight','home_basic']) for(const ex of EXPS) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'U_FL', k:g + '/' + t + '|' + eq + '|' + ex + '|fatloss|' + rd.join(','), c:M({ injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:'fatloss', restDays:rd }) });
  for(const g of REGS) for(const t of TIERS) for(const eq of ['bodyweight','home_basic']) for(const go of ['run_base','run_5k','run_half']) for(const ex of ['beginner','advanced']) for(const fo of ['balanced','support_prevention'])
    out.push({ L:'U_PATH', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|sun,wed|' + go, c:goalify(M({ injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }), go) });
  for(const sd of [11, 90210]) out.filter(x => (x.L === 'L432' || x.L === 'LBW') && /\|bodyweight\|/.test(x.k)).slice().forEach(x => out.push({ L:'U_SEED', k:x.k + '|' + x.L + '|s' + sd, c:Object.assign(clone(x.c), { seed:sd }) }));
  for(const sd of [76308, 11]) for(const fo of ['support_prevention','strength','hypertrophy','fatloss','balanced','support_athletic','support_strength']) for(const ex of EXPS) for(const go of ['lift','run_base','run_half']) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'UNINJ', k:'none|bodyweight|' + ex + '|' + fo + '|' + rd.join(',') + '|' + go + '|s' + sd, c:goalify(M({ equipment:'bodyweight', experience:ex, liftingFocus:fo, restDays:rd, seed:sd }), go) });
  return out; }
const COND = ['L432','LBW','U_EQ','U_FL','U_PATH','U_SEED'];
// CAP hand table: tests/gates/g229_d193_build.js (D193 ruling), copied verbatim
const CAP = { knee:{ workaround:['squat', 'lunge', 'leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat', 'lunge'], protect:['squat'] },
  hip:{ workaround:['hinge', 'lunge', 'hip_ext', 'squat'], protect:['squat'] }, lowback:{ workaround:['hinge', 'squat', 'row', 'hip_ext'], protect:['squat', 'hip_ext'] },
  shoulder:{ workaround:['hpress', 'vpress', 'delt_iso'], protect:[] }, elbow:{ workaround:['hpress', 'tri_iso', 'bi_iso', 'row', 'vpull'], protect:['row', 'vpull'] } };
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const REJ = "globalThis.__rej=function(sections,cfg){var S=JSON.parse(JSON.stringify(sections||[]));S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(it)it.__k=si+'.'+ii;});});"
  + "var O=applyInjuryFilter(JSON.parse(JSON.stringify(S)),cfg);var got={},neu=[];(O||[]).forEach(function(s){((s&&s.items)||[]).forEach(function(it){if(it.__k!=null)got[it.__k]=it;else neu.push(it.name);});});"
  + "var r=[];S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it||!it.name)return;var k=si+'.'+ii,g=got[k];var row={si:si,ii:ii,n:it.name,lab:s.label||'',bw:it.__bw||null};"
  + "if(!g){row.kind='drop';r.push(row);}else if(g.name!==it.name){row.kind='rename';row.to=g.name;r.push(row);}else if((g.detail||'')!==(it.detail||'')){row.kind='redetail';row.d0=it.detail;row.d1=g.detail;r.push(row);}});});return {r:r,neu:neu};};"
  + "globalThis.__snapF=function(weeks){var o={};Object.keys(weeks).forEach(function(w){Object.keys(weeks[w]||{}).forEach(function(d){var dy=weeks[w][d];if(dy&&dy.sections)o[w+'|'+d]=dy.sections.map(function(s){return (s.items||[]).map(function(i){return i&&i.name;});});});});globalThis.__snap=o;};";
function vm(tree){ const X = load(TREES[tree]); const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } X.ctx.Date = FD; X.eval(REJ); return X; }
const stripJ = prog => JSON.stringify(prog, (k, v) => (k === 'id' || k === 'created' || k === '_swapUniverse' || k === '_swapUniverseByKey' || k === '__bw') ? undefined : v);
function buildOne(X, c){ X.ctx.__bwEv = []; X.ctx.__snap = null; const prog = X.buildProgram(clone(c)); return { prog, ev:X.ctx.__bwEv.slice(), snap:X.ctx.__snap }; }
const patC = {}; const pat = (X, n) => (n in patC) ? patC[n] : (patC[n] = X.eval('_pattern(' + JSON.stringify(n) + ')') || '-');
function branchOf(arm, was, to){ if(LAND[arm] && to === LAND[arm]) return 'CF hip_ext row'; if(to === 'Burpees') return /carry/i.test(was) ? 'carry' : 'catch-all';
  return { 'Pushups (slow 3s eccentric)':'press|pushup|dip', 'Inverted row (under a table)':'row|pull|chin', 'Squat (slow 3s tempo)':'squat|lunge|step', 'Single-leg Romanian deadlift (bodyweight)':'deadlift|hinge|swing|romanian', 'Inverted row (supinated, under a table)':'curl', 'Prone Y-T-W raises':'raise|fly|delt' }[to] || ('?' + to); }
function analyse(X, cell, arm){ const { prog, ev, snap } = buildOne(X, cell.c); const W = prog.weeks, inj = cell.c.injury || null, cfgF = prog.cfg;
  const rec = { L:cell.L, k:cell.k, arm, h:sha(stripJ(prog)), days:0, ev:[], cards:[], rej:[], neu:[], post:[], postN:0 };
  ev.filter(e => e.src === 'FB').forEach(e => rec.ev.push({ w:e.w, d:e.d, lab:e.lab, was:e.was, to:e.to, pw:pat(X, e.was), pt:pat(X, e.to), br:branchOf(arm, e.was, e.to) }));
  rec.evSubs = ev.filter(e => e.src === 'SUBS').length;
  const namesDay = dy => { const o = []; ((dy && dy.sections) || []).forEach(s => (s.items || []).forEach(i => { if(i && i.name) o.push(i.name.toLowerCase()); })); return o; };
  const adjOf = (w, d) => { const i = ORDER.indexOf(d), o = []; if(i > 0) o.push([w, ORDER[i - 1]]); else o.push([w - 1, 'sun']); if(i < 6) o.push([w, ORDER[i + 1]]); else o.push([w + 1, 'mon']); return o.map(([a, b]) => W[a] && W[a][b]).filter(x => x && !x.rest); };
  Object.keys(W).forEach(w => Object.keys(W[w] || {}).forEach(d => { const dy = W[w][d]; if(!dy || !Array.isArray(dy.sections)) return;
    if(dy.sections.some(s => s && s.items && s.items.length)) rec.days++;
    // post-sweep renames: names on the final day vs the snapshot right after bodyweightSweep
    if(snap && snap[w + '|' + d]){ const a = snap[w + '|' + d].flat().filter(Boolean).map(x => x.toLowerCase()), b = namesDay(dy); const ca = tally(a, x => x), cb = tally(b, x => x);
      Object.keys(cb).forEach(n => { if((cb[n] || 0) > (ca[n] || 0)) rec.post.push('+' + n); }); Object.keys(ca).forEach(n => { if((ca[n] || 0) > (cb[n] || 0)) rec.post.push('-' + n); }); }
    let R = { r:[], neu:[] }; if(inj){ X.ctx.__S = dy.sections; X.ctx.__C = cfgF; R = JSON.parse(X.eval('JSON.stringify(__rej(__S,__C))')); R.r.forEach(r => rec.rej.push(Object.assign({ w:+w, d }, r))); R.neu.forEach(n => rec.neu.push(w + d + ':' + n)); }
    const all = namesDay(dy);
    dy.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.__bw || it.__bw.src !== 'FB') return; const nm = it.name.toLowerCase();
      const v = R.r.find(r => r.si === si && r.ii === ii);
      rec.cards.push({ w:+w, d, si, ii, lab:s.label || '', main:/^Main/.test(s.label || ''), was:it.__bw.was, to:it.name, det:it.detail || '', pw:pat(X, it.__bw.was), pt:pat(X, it.name), br:branchOf(arm, it.__bw.was, it.name),
        verdict: inj ? (v ? v.kind + (v.to ? '>' + v.to : '') : 'keep') : 'n/a', same:all.filter(x => x === nm).length - 1, adj:adjOf(+w, d).filter(a => namesDay(a).includes(nm)).length }); })); }));
  return rec; }
function worker(spec){ const [arm, i0, i1] = spec.split(':'); const all = lattices().slice(+i0, +i1); const X = vm(ARMS[arm]); const out = all.map(c => analyse(X, c, arm));
  fs.writeFileSync(F('res_' + spec.replace(/:/g, '_') + '.json'), JSON.stringify(out)); P('worker ' + spec + ' cells ' + out.length); }
function prep(){
  Object.values(TREES).forEach(f => { try { fs.unlinkSync(f); } catch(e){} }); fs.readdirSync(SCR).filter(f => /^res_/.test(f)).forEach(f => fs.unlinkSync(F(f)));
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); const ver = (src.match(/<meta name="ia-version" content="(\d+)"/) || [])[1];
  const head = cp.execSync('git rev-parse --short HEAD', { cwd:ROOT }).toString().trim(), git = cp.execSync('git show HEAD:index.html', { cwd:ROOT, maxBuffer:1 << 26 }).toString();
  P('PREP V230 ia-version ' + ver + ' HEAD ' + head + ' working tree == HEAD:index.html ' + (git === src) + ' sha ' + sha(src));
  const A1 = "        const _was=it.name;\n        if(_BW_SUBS[it.name]) it.name=_BW_SUBS[it.name];\n        else if(_BW_GEAR.test(it.name)) it.name=_bwFallback(it.name);\n";
  const B1 = A1 + "        if(_was!==it.name){ it.__bw={src:(_BW_SUBS[_was]?'SUBS':'FB'),was:_was}; if(globalThis.__bwEv) globalThis.__bwEv.push({w:+w,d:d,lab:sec.label||'',was:_was,to:it.name,src:it.__bw.src}); }\n";
  const A2 = "  if(cfg.equipment==='bodyweight') bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n";
  const B2 = "  if(cfg.equipment==='bodyweight') { bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention'); if(typeof globalThis.__snapF==='function') globalThis.__snapF(weeks); }\n";
  const A3 = "  if(/raise|fly|delt/.test(N))              return 'Prone Y-T-W raises';\n  return 'Burpees';\n}\n";
  const B3 = n => "  if(/raise|fly|delt/.test(N))              return 'Prone Y-T-W raises';\n  if(_pattern(name)==='hip_ext') return '" + n + "';\n  return 'Burpees';\n}\n";
  const sub = (s, a, b, nm) => { const n = s.split(a).length - 1; P('  anchor [' + nm + '] count ' + n + ' line ' + s.slice(0, s.indexOf(a)).split('\n').length); if(n !== 1) throw new Error('anchor ' + nm); return s.replace(a, () => b); };
  fs.writeFileSync(TREES.V230, src);
  const cfa = sub(src, A3, B3(LAND.CFA), 'CF-A catch-all hip_ext row'), cfb = sub(src, A3, B3(LAND.CFB), 'CF-B catch-all hip_ext row');
  fs.writeFileSync(TREES.CFA, cfa); fs.writeFileSync(TREES.CFB, cfb);
  const tag = s => sub(sub(s, A1, B1, 'sweep tag'), A2, B2, 'post-sweep snapshot');
  fs.writeFileSync(TREES.TAG, tag(src)); fs.writeFileSync(TREES.TAGA, tag(cfa)); fs.writeFileSync(TREES.TAGB, tag(cfb));
  // HALF_MANNY digest (harness progDigest shape) on the untagged trees; self-identity; tag neutrality and VM reuse == fresh VM
  const { progDigest } = require(path.join(ROOT, 'tests', 'harness.js'));
  for(const t of ['V230','CFA','CFB']){ const a = vm(t), b = vm(t); P('PREP HALF_MANNY digest ' + t + ' ' + progDigest(a.buildProgram(clone(fixtures.HALF_MANNY))) + ' (fresh VM again ' + progDigest(b.buildProgram(clone(fixtures.HALF_MANNY))) + ')'); }
  const L = lattices(); const probe = L.filter((x, i) => i % 97 === 0 || /^lowback\/protect\|bodyweight\|advanced\|support_strength|^ankle\/protect\|bodyweight\|intermediate\|balanced\|sat,sun$/.test(x.k)); let tot = 0;
  for(const [u, t] of [['V230','TAG'], ['CFA','TAGA'], ['CFB','TAGB']]){ const U = vm(u), T1 = vm(t); let self = 0, neu = 0, reuse = 0, n = 0;
    for(const c of probe){ n++; const a = stripJ(U.buildProgram(clone(c.c))), a2 = stripJ(U.buildProgram(clone(c.c))), b = stripJ(T1.buildProgram(clone(c.c))), f = stripJ(vm(u).buildProgram(clone(c.c)));
      if(a === a2) self++; if(a === b) neu++; if(a === f) reuse++; }
    tot += n; P('PREP ' + u + ': self-identity (same VM twice) ' + self + '/' + n + ' | tag tree (__bw stripped) == untagged ' + neu + '/' + n + ' | reused VM == fresh VM ' + reuse + '/' + n); }
  P('PREP lattice sizes ' + JSON.stringify(tally(L, x => x.L)) + ' total ' + L.length);
}
function run(){ return new Promise(done => { const N = lattices().length, CH = 60, jobs = []; for(const arm of ['V230','CFA','CFB']) for(let i = 0; i < N; i += CH) jobs.push(arm + ':' + i + ':' + Math.min(N, i + CH));
  const par = +(process.env.PAR || 8); let i = 0, crash = 0; const t0 = Date.now();
  const one = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { WORKER:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { if(code){ crash++; P('WORKER CRASH ' + j + ' ' + o.slice(-600)); } res(); }); });
  Promise.all(Array.from({ length:par }, async () => { while(i < jobs.length) await one(jobs[i++]); })).then(() => { P('RUN jobs ' + jobs.length + ' crashes ' + crash + ' ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s'); done(); }); }); }
function report(){
  const R = []; fs.readdirSync(SCR).filter(f => /^res_.*\.json$/.test(f)).forEach(f => JSON.parse(fs.readFileSync(F(f), 'utf8')).forEach(x => R.push(x)));
  const LS = tally(lattices(), x => x.L); P('\nREPORT cells loaded ' + R.length + ' ' + fmt(tally(R, x => x.arm)) + ' | expected per arm ' + lattices().length);
  const by = (arm, L) => R.filter(x => x.arm === arm && (!L || x.L === L)); const seg = k => k.split('|'); const region = r => seg(r.k)[0];
  const ALL_L = ['L432','LBW','U_EQ','U_FL','U_PATH','U_SEED','UNINJ'];
  for(const arm of ['V230','CFA','CFB']){
    P('\n================ ARM ' + arm + (LAND[arm] ? ' (catch-all hip_ext -> ' + LAND[arm] + ')' : '') + ' ================');
    for(const L of ALL_L){ const C = by(arm, L); const ev = C.flatMap(c => c.ev.map(e => Object.assign({ k:c.k }, e))), cards = C.flatMap(c => c.cards.map(e => Object.assign({ k:c.k }, e)));
      const bwCells = C.filter(c => /\|bodyweight\|/.test(c.k)).length;
      P('\n--- (1) ' + arm + ' ' + L + ': ' + C.length + ' builds (' + bwCells + ' bodyweight = the only tier the sweep runs on), ' + C.reduce((a, c) => a + c.days, 0) + ' lifting days | _bwFallback substitutions at the sweep ' + ev.length + ' (in ' + new Set(ev.map(e => e.k)).size + ' builds); survive to the final card ' + cards.length + ' | _BW_SUBS substitutions ' + C.reduce((a, c) => a + c.evSubs, 0));
      if(!ev.length) continue;
      P('   at sweep, by branch: ' + fmt(tally(ev, e => e.br)));
      P('   at sweep, source{pat} -> landing{pat}: ' + fmt(tally(ev, e => e.was + '{' + e.pw + '} -> ' + e.to + '{' + e.pt + '}')));
      P('   final cards, by branch x Main/acc: ' + fmt(tally(cards, e => e.br + ' ' + (e.main ? 'Main' : 'acc'))));
      P('   final cards, source{pat} -> landing{pat} x Main/acc: ' + fmt(tally(cards, e => e.was + '{' + e.pw + '} -> ' + e.to + '{' + e.pt + '} ' + (e.main ? 'Main' : 'acc'))));
      P('   final cards, by region/tier x branch: ' + fmt(tally(cards, e => region(e) + ' ' + e.br)));
      P('   final cards, by week: ' + fmt(tally(cards, e => 'W' + e.w)) + ' | by day: ' + fmt(tally(cards, e => e.d)));
      P('   final cards, by label: ' + fmt(tally(cards, e => e.lab.replace(/<svg[\s\S]*?<\/svg>\s*/g, '').slice(0, 44))));
      P('   final cards, own plan verdict on the landing: ' + fmt(tally(cards, e => e.br + ' ' + e.verdict)));
      P('   final cards, same-day double (landing name elsewhere on the day) ' + cards.filter(e => e.same > 0).length + '/' + cards.length + ' ' + fmt(tally(cards.filter(e => e.same > 0), e => e.to + ' ' + region(e))) + ' | adjacent-day same name ' + cards.filter(e => e.adj > 0).length + '/' + cards.length + ' ' + fmt(tally(cards.filter(e => e.adj > 0), e => e.to)));
      const lost = ev.length - cards.length; if(lost) P('   at-sweep substitutions not on the final card ' + lost + ' (sweep in-section dedupe or a later pass)');
      // (a″): filter-lens capped (pattern of the name the filter judged = source), final-lens uncapped (landing pattern)
      if(L !== 'UNINJ'){ const capOf = k => { const [rg, tr] = region({ k }).split('/'); return CAP[rg] ? CAP[rg][tr] : []; };
        const a2 = cards.filter(e => capOf(e.k).includes(e.pw) && !capOf(e.k).includes(e.pt));
        P('   (a″) filter-lens capped, final-lens uncapped (CAP hand table, D193): ' + a2.length + ' of ' + cards.length + ' fallback cards | Main ' + a2.filter(e => e.main).length + ' acc ' + a2.filter(e => !e.main).length + ' | Main RPE>7 ' + a2.filter(e => e.main && Math.max(0, ...[...e.det.matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/g)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0))) > 7).length + ' | ' + fmt(tally(a2, e => region(e) + ' ' + e.was + '>' + e.to + ' ' + (e.main ? 'Main' : 'acc')))); }
      const mains = cards.filter(e => e.main);
      if(mains.length){ P('   Main landings: ' + mains.length + ' by region x landing x exp x focus: ' + fmt(tally(mains, e => region(e) + ' ' + e.to + ' ' + seg(e.k)[2] + ' ' + seg(e.k)[3])));
        P('   Main landing details: ' + fmt(tally(mains, e => e.to + ' :: ' + e.det))); }
      const accs = cards.filter(e => !e.main); if(accs.length) P('   accessory landing details: ' + fmt(tally(accs, e => e.to + ' :: ' + e.det)));
    }
    // post-sweep renamers
    const PS = by(arm).flatMap(c => c.post.map(p => c.L + ' ' + p)); P('\n--- (2) ' + arm + ' names that change between the post-sweep snapshot and the final program (bodyweight builds): ' + PS.length + ' over ' + by(arm).filter(c => /\|bodyweight\|/.test(c.k)).length + ' bodyweight builds ' + (PS.length ? fmt(tally(PS, x => x)) : ''));
    // (4) P-FILTERLAST
    let rows = [], neu = []; for(const L of COND){ const C = by(arm, L); C.forEach(c => { c.rej.forEach(r => rows.push(Object.assign({ L, k:c.k }, r))); c.neu.forEach(n => neu.push(L + ' ' + c.k + ' ' + n)); });
      const rr = rows.filter(r => r.L === L); P('\n--- (4) ' + arm + ' ' + L + ' post-sweep re-filter differential: ' + rr.length + ' cards on ' + new Set(rr.map(r => r.k + r.w + r.d)).size + ' of ' + C.reduce((a, c) => a + c.days, 0) + ' lifting days in ' + C.length + ' builds | ' + fmt(tally(rr, r => r.kind + ' ' + r.n + (r.to ? '>' + r.to : ''))) + ' | new items ' + neu.filter(x => x.startsWith(L + ' ')).length); }
    const drops = rows.filter(r => r.kind === 'drop').length, ren = rows.filter(r => r.kind === 'rename').length, red = rows.filter(r => r.kind === 'redetail');
    const pushRed = red.filter(r => /^Pushups/.test(r.n)).length;
    const meet = drops === 0 && ren === 0 && neu.length === 0 && red.length === 8 && pushRed === 8;
    P('  (4) ' + arm + ' TOTAL over ' + COND.join('+') + ': ' + rows.length + ' cards | drop ' + drops + ' rename ' + ren + ' redetail ' + red.length + ' (Pushups ' + pushRed + ') | new items ' + neu.length + ' | Amendment 4 condition (exactly 8 Pushups re-details, 0 drops, 0 new items): ' + (meet ? 'MET' : 'NOT MET'));
    if(rows.length <= 80) rows.forEach(r => P('     ' + r.L + ' ' + r.k + ' W' + r.w + ' ' + r.d + ' [' + r.lab.replace(/<svg[\s\S]*?<\/svg>\s*/g, '').slice(0, 30) + '] ' + r.kind + ' ' + r.n + (r.to ? ' > ' + r.to : '') + (r.kind === 'redetail' ? ' :: ' + JSON.stringify(r.d0) + ' -> ' + JSON.stringify(r.d1) : '') + (r.bw ? ' (sweep ' + r.bw.src + '<' + r.bw.was + ')' : '')));
    neu.slice(0, 20).forEach(x => P('     NEW ' + x));
  }
  // (3) counterfactual comparison against V230
  const H = {}; R.forEach(r => { H[r.arm + '|' + r.L + '|' + r.k] = r; });
  for(const arm of ['CFA','CFB']){ let noHip = 0, noHipSame = 0, hip = 0, hipDiff = 0; const bad = [];
    by('V230').forEach(v => { const c = H[arm + '|' + v.L + '|' + v.k]; if(!c) return; const has = v.ev.some(e => e.br === 'catch-all' && e.pw === 'hip_ext');
      if(has){ hip++; if(c.h !== v.h) hipDiff++; } else { noHip++; if(c.h === v.h) noHipSame++; else if(bad.length < 6) bad.push(v.L + ' ' + v.k); } });
    const left = by(arm).flatMap(c => c.cards.filter(e => e.br === 'catch-all').map(e => e.was + '{' + e.pw + '}'));
    P('\n--- (3) ' + arm + ' vs V230: builds with NO catch-all hip_ext substitution ' + noHip + ', byte-identical (__bw stripped, clock fields stripped) ' + noHipSame + '/' + noHip + (bad.length ? ' DIFFER: ' + bad.join(' ; ') : '') + ' | builds WITH one ' + hip + ', differ ' + hipDiff + '/' + hip);
    P('   catch-all landings left (final cards, all lattices): ' + left.length + ' ' + fmt(tally(left, x => x)));
    const cardsA = by(arm).flatMap(c => c.cards.filter(e => e.br === 'CF hip_ext row').map(e => Object.assign({ L:c.L, k:c.k }, e)));
    P('   new-row landings on the final card ' + cardsA.length + ' | same-day doubles ' + cardsA.filter(e => e.same > 0).length + ' ' + fmt(tally(cardsA.filter(e => e.same > 0), e => e.L + ' ' + region(e) + ' ' + e.lab.slice(0, 24))) + ' | adjacent-day same name ' + cardsA.filter(e => e.adj > 0).length + ' ' + fmt(tally(cardsA.filter(e => e.adj > 0), e => e.L + ' ' + region(e))));
    const evA = by(arm).flatMap(c => c.ev.filter(e => e.br === 'CF hip_ext row')); P('   new-row substitutions at the sweep ' + evA.length + ', lost before the final card ' + (evA.length - cardsA.length) + ' (sweep in-section dedupe when the landing already sits in that section, or a later pass)');
    const vB = by('V230').flatMap(c => c.cards.filter(e => e.br === 'catch-all' && e.pw === 'hip_ext')); P('   V230 catch-all hip_ext Burpees cards ' + vB.length + ' (same-day Burpees double ' + vB.filter(e => e.same > 0).length + ', adjacent ' + vB.filter(e => e.adj > 0).length + ')');
  }
}
async function main(){
  if(process.env.WORKER) return worker(process.env.WORKER);
  if(PART === 'prep' || PART === 'all') prep();
  if(PART === 'run' || PART === 'all') await run();
  if(PART === 'report' || PART === 'all') report();
  if(PART === 'extra' || PART === 'all') extra();
  if(PART === 'extra' || PART === 'all') extra2();
  if(PART === 'cards' || PART === 'all') cards();
}
function extra(){
  const R = []; fs.readdirSync(SCR).filter(f => /^res_.*\.json$/.test(f)).forEach(f => JSON.parse(fs.readFileSync(F(f), 'utf8')).forEach(x => R.push(x)));
  const reg = k => k.split('|')[0], seg = k => k.split('|');
  P('\n================ EXTRA ================');
  for(const arm of ['V230','CFA','CFB']){ const H = R.filter(x => x.arm === arm);
    const C = H.flatMap(c => c.cards.filter(e => e.br === 'catch-all' || e.br === 'CF hip_ext row').map(e => Object.assign({ L:c.L, k:c.k }, e)));
    P('\n[E1] ' + arm + ' catch-all / new-row cards ' + C.length + ' by lattice x region x Main/acc x verdict: ' + fmt(tally(C, e => e.L + ' ' + reg(e.k) + ' ' + (e.main ? 'Main' : 'acc') + ' ' + e.verdict)));
    P('[E1] ' + arm + ' sources at the catch-all (all lattices, at sweep): ' + fmt(tally(H.flatMap(c => c.ev.filter(e => e.br === 'catch-all' || e.br === 'CF hip_ext row' || e.br === 'carry')), e => e.br + ' ' + e.was + '{' + e.pw + '}')));
    const M = C.filter(e => e.main), A = C.filter(e => !e.main);
    P('[E2] ' + arm + ' Main landing details (' + M.length + '): ' + fmt(tally(M, e => e.to + ' :: ' + e.det)));
    P('[E2] ' + arm + ' Main landings by exp x week: ' + fmt(tally(M, e => seg(e.k)[2] + ' W' + e.w)));
    P('[E2] ' + arm + ' accessory landing details (' + A.length + '): ' + fmt(tally(A, e => e.lab.slice(0, 28) + ' | ' + e.to + ' :: ' + e.det)));
    if(arm === 'V230'){ const t = M.filter(e => /Work up to one/.test(e.det)); P('[E2] V230 Main Burpees carrying a test-shape detail: ' + t.length + ' ' + fmt(tally(t, e => e.L + ' ' + e.k + ' W' + e.w + e.d))); }
    // post-sweep renamers on injured lattices
    const PS = H.filter(c => c.L !== 'UNINJ').flatMap(c => c.post.map(p => c.L + ' ' + p.replace(/<svg[\s\S]*?<\/svg>\s*/g, '').slice(0, 50)));
    P('[E3] ' + arm + ' post-sweep name changes on injured lattices: ' + PS.length + ' ' + fmt(tally(PS, x => x)).slice(0, 1500));
  }
  // [E4] same-movement doubles: rebuild each build with a new-row landing; other items on that day with _pattern hip_ext, and the W3/W4 thu names
  for(const arm of ['CFA','CFB']){ const X = vm(ARMS[arm]); const L = lattices(); const hit = R.filter(x => x.arm === arm && x.cards.some(e => e.br === 'CF hip_ext row')); const rows = [];
    for(const h of hit){ const cell = L.find(x => x.L === h.L && x.k === h.k); const p = X.buildProgram(clone(cell.c));
      h.cards.filter(e => e.br === 'CF hip_ext row').forEach(e => { const dy = p.weeks[e.w][e.d]; const oth = [];
        dy.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(si === e.si && ii === e.ii) return; if(pat(X, it.name) === 'hip_ext') oth.push((s.label || '').slice(0, 22) + ': ' + it.name); }));
        rows.push({ L:h.L, k:h.k, w:e.w, d:e.d, main:e.main, oth }); }); }
    P('\n[E4] ' + arm + ' new-row landings ' + rows.length + ' | with another hip_ext item on the same day ' + rows.filter(r => r.oth.length).length + ' | by lattice x region x other: ' + fmt(tally(rows.filter(r => r.oth.length), r => r.L + ' ' + reg(r.k) + ' ' + (r.main ? 'Main' : 'acc') + ' + ' + r.oth.join(' ; '))));
    P('[E4] ' + arm + ' new-row landings by week/day: ' + fmt(tally(rows, r => 'W' + r.w + r.d)));
  }
}
function extra2(){
  // [E5] non-landing collateral: per day, V230 vs arm, every card other than the landing slot (name multiset), and same-movement doubles
  const R = []; fs.readdirSync(SCR).filter(f => /^res_.*\.json$/.test(f)).forEach(f => JSON.parse(fs.readFileSync(F(f), 'utf8')).forEach(x => R.push(x)));
  const L = lattices(), reg = k => k.split('|')[0], XV = vm('TAG'); const stem = n => n.toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const hitKeys = R.filter(x => x.arm === 'V230' && x.ev.some(e => e.br === 'catch-all' && e.pw === 'hip_ext')).map(x => x.L + '|' + x.k);
  const rpe = d => Math.max(0, ...[...String(d).matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/g)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)));
  P('\n================ EXTRA 2 ================');
  const V = R.filter(x => x.arm === 'V230').flatMap(c => c.cards.filter(e => e.br === 'catch-all').map(e => Object.assign({ L:c.L, k:c.k }, e)));
  P('[E5a] V230 catch-all Main landings with RPE>7 in the detail: ' + V.filter(e => e.main && rpe(e.det) > 7).length + '/' + V.filter(e => e.main).length + ' ' + fmt(tally(V.filter(e => e.main && rpe(e.det) > 7), e => e.L + ' ' + reg(e.k))));
  P('[E5a] V230 catch-all Main test-shape details by lattice x kind: ' + fmt(tally(V.filter(e => /Work up to one/.test(e.det)), e => e.L + ' ' + reg(e.k) + ' ' + (/RPE 9/.test(e.det) ? 'test RPE 9' : 'held R7') + ' W' + e.w)));
  for(const arm of ['CFA','CFB']){ const X = vm(ARMS[arm]); const lost = [], gained = [], det = [], stemD = [], exactD = []; let days = 0;
    for(const hk of hitKeys){ const cell = L.find(x => x.L + '|' + x.k === hk); const a = XV.buildProgram(clone(cell.c)), b = X.buildProgram(clone(cell.c));
      Object.keys(b.weeks).forEach(w => Object.keys(b.weeks[w] || {}).forEach(d => { const da = a.weeks[w][d], db = b.weeks[w][d]; if(!db || !db.sections) return;
        const isLand = (it, A) => it.__bw && it.__bw.src === 'FB' && it.__bw.was && X.eval('_pattern(' + JSON.stringify(it.__bw.was) + ')') === 'hip_ext' && (A ? it.name === 'Burpees' : it.name === LAND[arm]);
        const items = (dy, A) => { const o = []; ((dy && dy.sections) || []).forEach(s => (s.items || []).forEach(it => { if(it && it.name && !isLand(it, A)) o.push({ lab:(s.label || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').slice(0, 28), n:it.name, det:it.detail || '' }); })); return o; };
        const hasLand = (db.sections || []).some(s => (s.items || []).some(it => isLand(it, false)));
        if(!hasLand) return; days++;
        const ia = items(da, true), ib = items(db, false); const ca = tally(ia, x => x.n), cb = tally(ib, x => x.n);
        Object.keys(ca).forEach(n => { for(let i = 0; i < ca[n] - (cb[n] || 0); i++) lost.push({ L:cell.L, k:cell.k, w, d, lab:ia.find(x => x.n === n).lab, n }); });
        Object.keys(cb).forEach(n => { for(let i = 0; i < cb[n] - (ca[n] || 0); i++) gained.push({ L:cell.L, k:cell.k, w, d, lab:ib.find(x => x.n === n).lab, n, det:ib.find(x => x.n === n).det }); });
        ia.forEach(x => { const y = ib.find(z => z.n === x.n); if(y && (y.det !== x.det || y.lab !== x.lab)) det.push({ L:cell.L, k:cell.k, n:x.n, from:x.lab + ' :: ' + x.det, to:y.lab + ' :: ' + y.det }); });
        ib.forEach(x => { if(stem(x.n) === stem(LAND[arm])) stemD.push({ L:cell.L, k:cell.k, w, d, lab:x.lab, n:x.n }); });
      })); }
    P('\n[E5] ' + arm + ' over the ' + hitKeys.length + ' builds with a catch-all hip_ext landing, ' + days + ' landing days: non-landing cards LOST vs V230 ' + lost.length + ', GAINED ' + gained.length + ', kept card with changed label/detail ' + det.length);
    P('   LOST by lattice x region x label:name: ' + fmt(tally(lost, x => x.L + ' ' + reg(x.k) + ' ' + x.lab + ': ' + x.n)));
    P('   LOST by week/day: ' + fmt(tally(lost, x => 'W' + x.w + x.d)));
    P('   GAINED by lattice x region x label:name :: detail: ' + fmt(tally(gained, x => x.L + ' ' + reg(x.k) + ' ' + x.lab + ': ' + x.n + ' :: ' + x.det)));
    P('   changed kept cards: ' + fmt(tally(det, x => x.L + ' ' + reg(x.k) + ' ' + x.n + ' [' + x.from + ' -> ' + x.to + ']')).slice(0, 1500));
    P('   same-movement double (another card on the landing day whose name minus parentheses equals the landing\'s): ' + stemD.length + ' ' + fmt(tally(stemD, x => x.L + ' ' + reg(x.k) + ' ' + x.lab + ': ' + x.n)));
  }
}
function cards(){
  const L = lattices(); const want = ['ankle/protect|bodyweight|intermediate|balanced|sat,sun', 'ankle/protect|bodyweight|beginner|support_strength|sun,wed'];
  const XV = vm('TAG'); const pick = rg => L.filter(x => x.k.startsWith(rg + '|bodyweight|') && (x.L === 'L432' || x.L === 'LBW')).find(x => { const p = XV.buildProgram(clone(x.c)); return Object.values(p.weeks).some(wk => Object.values(wk || {}).some(dy => (dy && dy.sections || []).some(s => /^Main/.test(s.label || '') && (s.items || []).some(i => i.name === 'Burpees' && i.__bw && i.__bw.was === 'Banded hip thrust')))); });
  const lp = pick('lowback/protect'), lw = pick('lowback/workaround');
  const cellsP = want.map(k => L.find(x => x.k === k)).concat([lp, lw]).filter(Boolean);
  for(const cell of cellsP){ const days = [];
    const pv = XV.buildProgram(clone(cell.c)); Object.keys(pv.weeks).forEach(w => Object.keys(pv.weeks[w] || {}).forEach(d => { const dy = pv.weeks[w][d]; if((dy && dy.sections || []).some(s => (s.items || []).some(i => i.__bw && i.__bw.was === 'Banded hip thrust'))) days.push([+w, d]); }));
    const show = [[3, 'thu'], [4, 'thu']].concat(days.filter(([w, d]) => !(d === 'thu' && (w === 3 || w === 4))).slice(0, 2));
    P('\n=== (5) ' + cell.L + ' ' + cell.k + ' | days carrying a Banded hip thrust substitution on V230: ' + days.map(x => 'W' + x[0] + x[1]).join(' '));
    for(const arm of ['V230','CFA','CFB']){ const X = arm === 'V230' ? XV : vm(ARMS[arm]); const p = X.buildProgram(clone(cell.c));
      for(const [w, d] of show){ const dy = p.weeks[w] && p.weeks[w][d]; P('  [' + arm + '] W' + w + ' ' + d + ' ' + (dy ? (dy.title || '') + (dy.cardio ? ' {' + (dy.cardio.subtype || dy.cardio.type) + '}' : '') : '(none)'));
        (dy && dy.sections || []).forEach(s => { P('     ' + (s.label || s.coreHeader || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '') + (s.superset ? ' (superset, ' + (s.rounds || '') + ' rounds)' : ''));
          (s.items || []).forEach(i => P('        - ' + i.name + ' :: ' + (i.detail || '') + (i.__bw ? '   [sweep ' + i.__bw.src + ' < ' + i.__bw.was + ']' : ''))); }); } } }
}
main();
