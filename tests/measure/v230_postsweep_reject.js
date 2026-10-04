// v230_postsweep_reject.js — MEASURE (read-only). V230 measure pass 2: the Burpees boot drop (gatekeeper repro
//   tests/measure/v230_gk_burpees_bootdrop.js). Population = every built card that applyInjuryFilter, re-applied to the
//   built day with the plan's injury (the injury WE set, never read back through _dayPlanCfg), would drop, rename or
//   re-detail ("post-sweep reject"). Reach = what a swap of another card on that day does at boot, undo, undo+boot and a
//   reboot, V229 vs V230, overlay presentation (applyInjuryDraft, OV1 from W1 Monday and OV5 from W5) beside the fixture.
//   Source attribution by source surgery on a TAG tree (bodyweightSweep stamps __bw on every name it changes; a hook
//   just before bodyweightSweep measures the reject set at that point); the tag tree is proven neutral (names/details ==).
//   SCR=<scratch> PART=<prep|run|report|writers> node tests/measure/v230_postsweep_reject.js
// Oracles: the injury the config sets; expected boot under the hypothesis = live minus the reject set, computed by hand
//   from the names; the live tap's own card from the choice we typed. The suspect (_dayPlanCfg, the boot re-filter) is
//   never asked what the answer is.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const BASE229 = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1cdb8ea3-6810-4976-acce-c88cc911f698/scratchpad/base_v229.html';
const PART = process.env.PART || 'none';
const TREES = { V229:F('v229.html'), V230:F('v230.html'), TAG229:F('tag229.html'), TAG230:F('tag230.html') };
const START = '2026-08-24', FROMS = { OV1:'2026-08-24', OV5:'2026-09-21' }, CLOCKS = { OV1:START, FIX:START, OV5:'2026-09-24' };
const clone = x => JSON.parse(JSON.stringify(x)); const P = s => console.log(s);
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort((a, b) => m[b] - m[a] || (a < b ? -1 : 1)).map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const REGS = ['knee','ankle','hip','lowback','shoulder','elbow'], TIERS = ['workaround','protect'], EXPS = ['beginner','intermediate','advanced'];
function lattices(){ const out = [];
  // L432 verbatim shape from tests/gates/g229_d193_build.js grid(['commercial','crossfit','home_full','bodyweight'])
  for(const g of REGS) for(const t of TIERS) for(const eq of ['commercial','crossfit','home_full','bodyweight']) for(const ex of EXPS) for(const fo of ['support_strength','support_athletic','support_prevention'])
    out.push({ L:'L432', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|sun,wed', c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }) });
  // LBW: bodyweight + home_basic x every lifting focus x two rest patterns (gatekeeper's repro is balanced, sat/sun)
  for(const g of REGS) for(const t of TIERS) for(const eq of ['bodyweight','home_basic']) for(const ex of EXPS) for(const fo of ['balanced','strength','hypertrophy']) for(const rd of [['sun','wed'],['sat','sun']])
    out.push({ L:'LBW', k:g + '/' + t + '|' + eq + '|' + ex + '|' + fo + '|' + rd.join(','), c:Object.assign(clone(MARIO), { injury:{ region:g, tier:t }, equipment:eq, experience:ex, liftingFocus:fo, restDays:rd }) });
  out.push({ L:'MARIO', k:'knee/workaround|commercial|beginner|support_strength|sun,wed', c:Object.assign(clone(MARIO), { injury:{ region:'knee', tier:'workaround' } }) });
  return out; }
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};try{closeRestSheet=function(){};}catch(e){}"
  + "globalThis.__rej=function(sections,inj){var S=JSON.parse(JSON.stringify(sections||[]));S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(it)it.__k=si+'.'+ii;});});"
  + "var O=applyInjuryFilter(JSON.parse(JSON.stringify(S)),Object.assign({},activeProg?activeProg.cfg:{},{injury:inj}));var got={},neu=0;(O||[]).forEach(function(s){((s&&s.items)||[]).forEach(function(it){if(it.__k!=null)got[it.__k]=it;else neu++;});});"
  + "var r=[];S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it||!it.name)return;var k=si+'.'+ii,g=got[k];var row={si:si,ii:ii,n:it.name,lab:s.label||'',nItems:s.items.length,bw:it.__bw||null};"
  + "if(!g){row.kind='drop';r.push(row);}else if(g.name!==it.name){row.kind='rename';row.to=g.name;r.push(row);}else if((g.detail||'')!==(it.detail||'')){row.kind='redetail';row.d0=it.detail;row.d1=g.detail;r.push(row);}});});return {r:r,neu:neu};};";
const E = (X, c) => X.eval(c);
function fresh(t, pres){ const X = load(TREES[t]); const T = new Date(CLOCKS[pres] + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } X.ctx.Date = FD; E(X, HELP); return X; }
function setup(X, st){ X.localStorage.clear(); X.ctx.__SP = JSON.parse(st); E(X, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function bootFrom(src, dst){ const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function stored(t, c, pres){ const X = fresh(t, pres); const inj = c.injury; const base = clone(c); delete base.injury; const cfg = pres === 'FIX' ? clone(c) : base;
  const s = clone(X.buildProgram(clone(cfg))); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) }); let j = JSON.stringify(s);
  if(pres !== 'FIX'){ setup(X, j); E(X, "_ovDraft.injRegion=" + JSON.stringify(inj.region) + ";_ovDraft.injTier=" + JSON.stringify(inj.tier) + ";_ovDraft.from='" + FROMS[pres] + "';applyInjuryDraft();");
    const o = JSON.parse(E(X, "localStorage.getItem('ia_programs')")).find(x => x.id === 'PM'); (o.overlays || []).forEach(v => { v.id = 'ov_fixed'; v.created = 1; }); j = JSON.stringify(o); }
  return j; }
const weeksOf = X => JSON.parse(E(X, 'JSON.stringify(activeProg.weeks)'));
const dayKeys = W => { const o = []; Object.keys(W).forEach(w => Object.keys(W[w] || {}).forEach(d => { const dy = W[w][d]; if(dy && Array.isArray(dy.sections) && dy.sections.some(s => s && s.items && s.items.length)) o.push([+w, d]); })); return o; };
const namesOf = dy => (dy && dy.sections || []).map(s => (s.label || '') + ': ' + (s.items || []).map(i => i.name).join(' + '));
const cardsOf = dy => { const o = []; (dy && dy.sections || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name) o.push({ si, ii, n:it.name, d:it.detail || '', lab:s.label || '' }); })); return o; };
const strip = dy => { if(!dy) return dy; const c = clone(dy); delete c._ovKey; (c.sections || []).forEach(s => (s.items || []).forEach(it => { if(it){ delete it.__bw; delete it._preHold; } })); return c; };
const isPierced = (pres, w) => pres === 'FIX' || pres === 'OV1' || w >= 5;   // OV5 overlay from W5 Monday (2026-09-21 = W5 when W1 = 2026-08-24)
function trySwap(X, w, d, card, used){ E(X, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); let cs = [];
  try { cs = JSON.parse(E(X, "JSON.stringify(__cands(activeProg.weeks[" + w + "]." + d + "," + w + "," + JSON.stringify(card.n) + "))")); } catch(e){ return { err:'cands ' + e.message }; }
  cs = cs.map(x => typeof x === 'string' ? x : (x && x.name)).filter(Boolean).filter(x => !used.has(x.toLowerCase()));
  for(const to of cs.slice(0, 3)){ const before = JSON.parse(E(X, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')')); X.ctx.__c = { secIdx:card.si, itemIdx:card.ii, name:card.n, detail:card.d }; X.ctx.__to = to;
    try { E(X, '__T.length=0;_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ return { err:'apply ' + e.message }; }
    const after = JSON.parse(E(X, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')')); const slot = after.sections[card.si] && after.sections[card.si].items[card.ii];
    if(slot && slot.name === to) return { to, before, after };
    if(JSON.stringify(before) !== JSON.stringify(after)) return { to, before, after, landedOther:true }; }
  return { none:true }; }
function worker(spec){ const [t, pres, L, i0, i1] = spec.split(':'); const all = lattices().filter(x => x.L === L).slice(+i0, +i1); const out = [];
  for(const cell of all){ const inj = cell.c.injury; const st = stored(t, cell.c, pres); const X = fresh(t, pres); setup(X, st); const W0 = weeksOf(X); const rec = { k:cell.k, L, t, pres, days:0, rej:[], swaps:[], ctrl:[], neu:0, pre:null };
    const DK = dayKeys(W0).filter(([w]) => isPierced(pres, w)); rec.days = DK.length; const rejDays = [];
    for(const [w, d] of DK){ X.ctx.__S = W0[w][d].sections; const R = JSON.parse(E(X, 'JSON.stringify(__rej(__S,' + JSON.stringify(inj) + '))')); rec.neu += R.neu; if(R.r.length){ R.r.forEach(r => rec.rej.push(Object.assign({ w, d }, r))); rejDays.push([w, d, R.r]); } }
    if(t.startsWith('TAG')){ rec.pre = X.ctx.__preRej || null; out.push(rec); continue; }
    // REACH rounds: round r swaps the r-th non-reject card on every reject day (one boot per round); a control round swaps one card on up to 12 non-reject days
    const nonRej = DK.filter(([w, d]) => !rejDays.some(x => x[0] === w && x[1] === d));
    const maxR = Math.max(0, ...rejDays.map(([w, d, R]) => cardsOf(W0[w][d]).filter(c => !R.some(r => r.si === c.si && r.ii === c.ii)).length));
    const rounds = []; for(let r = 0; r < maxR; r++) rounds.push(rejDays.map(([w, d, R]) => { const oth = cardsOf(W0[w][d]).filter(c => !R.some(x => x.si === c.si && x.ii === c.ii)); return oth[r] ? { w, d, card:oth[r], R } : null; }).filter(Boolean));
    const ctrlPick = nonRej.filter((_, i) => i % Math.max(1, Math.floor(nonRej.length / 12)) === 0).slice(0, 12).map(([w, d], i) => { const cs = cardsOf(W0[w][d]); return { w, d, card:cs[(i * 7 + w) % cs.length], R:[], ctrl:true }; });
    if(ctrlPick.length) rounds.push(ctrlPick);
    for(const round of rounds){ const Y = fresh(t, pres); setup(Y, st); const done = [];
      for(const job of round){ const day0 = JSON.parse(E(Y, 'JSON.stringify(activeProg.weeks[' + job.w + '].' + job.d + ')')); const used = new Set(cardsOf(day0).map(c => c.n.toLowerCase()));
        const s = trySwap(Y, job.w, job.d, job.card, used); if(!s.to){ done.push({ job, skip:s.err || 'no candidate' }); continue; }
        // (3) the live card at the tap: every other card unchanged in name and detail
        const bc = cardsOf(s.before), ac = cardsOf(s.after); let otherMoved = 0, rejGoneLive = 0;
        bc.forEach(c => { if(c.si === job.card.si && c.ii === job.card.ii) return; const a = ac.find(x => x.si === c.si && x.ii === c.ii); if(!a || a.n !== c.n || a.d !== c.d) otherMoved++; });
        job.R.forEach(r => { if(!ac.some(x => x.n === r.n)) rejGoneLive++; });
        done.push({ job, to:s.to, landedOther:!!s.landedOther, otherMoved, rejGoneLive, live:s.after }); }
      const B = fresh(t, pres); bootFrom(Y, B); const B2 = fresh(t, pres); bootFrom(B, B2);
      // undo every swap in the live session, then boot that
      done.filter(x => x.to).forEach(x => { E(Y, 'currentWeek=' + x.job.w + ";currentDayKey='" + x.job.d + "';"); let ok = true; try { E(Y, 'undoSwap(' + JSON.stringify(x.job.card.n) + ');'); } catch(e){ ok = false; } x.undoErr = !ok; });
      const U = fresh(t, pres); bootFrom(Y, U);
      for(const x of done){ if(!x.to){ (x.job.ctrl ? rec.ctrl : rec.swaps).push({ w:x.job.w, d:x.job.d, skip:x.skip }); continue; } const { w, d } = x.job;
        const boot = JSON.parse(E(B, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')')), reb = JSON.parse(E(B2, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')'));
        const undoLive = JSON.parse(E(Y, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')')), undoBoot = JSON.parse(E(U, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')'));
        const L0 = JSON.stringify(strip(x.live)), Bj = JSON.stringify(strip(boot));
        // hand expectation: live with every reject card removed by NAME (drops) / renamed (renames)
        const exp = clone(strip(x.live)); x.job.R.forEach(r => { exp.sections.forEach(s => { s.items = (s.items || []).filter(it => !(r.kind === 'drop' && it.name === r.n)); (s.items || []).forEach(it => { if(r.kind === 'rename' && it.name === r.n) it.name = r.to; }); }); }); exp.sections = exp.sections.filter(s => s.items && s.items.length);
        const nm = dy => JSON.stringify(namesOf(dy).map(s => s.replace(/^[^:]*: /, '')));
        const row = { w, d, from:x.job.card.n, to:x.to, landedOther:x.landedOther, otherMoved:x.otherMoved, rejGoneLive:x.rejGoneLive, bootEq:L0 === Bj, bootNamesEq:nm(x.live) === nm(boot), bootEqHand:nm(exp) === nm(boot),
          rebootEqBoot:JSON.stringify(strip(reb)) === Bj, undoErr:x.undoErr, undoLiveEqBuilt:JSON.stringify(strip(undoLive)) === JSON.stringify(strip(W0[w][d])), undoBootEqUndoLive:JSON.stringify(strip(undoBoot)) === JSON.stringify(strip(undoLive)),
          undoBootNamesEqBuilt:nm(undoBoot) === nm(W0[w][d]), secLive:(x.live.sections || []).length, secBoot:(boot.sections || []).length, emptySecBoot:(boot.sections || []).filter(s => !s.items || !s.items.length).length,
          mainLive:(x.live.sections || []).filter(s => /^Main/.test(s.label || '')).length, mainBoot:(boot.sections || []).filter(s => /^Main/.test(s.label || '')).length, R:x.job.R.map(r => r.kind + ':' + r.n) };
        if(!row.bootEq && !rec.ex) rec.ex = [];
        if(!row.bootEq && rec.ex.length < 2) rec.ex.push({ w, d, from:row.from, to:row.to, built:namesOf(W0[w][d]), live:namesOf(x.live), boot:namesOf(boot), undoBoot:namesOf(undoBoot) });
        (x.job.ctrl ? rec.ctrl : rec.swaps).push(row); } }
    out.push(rec); }
  fs.writeFileSync(F('res_' + spec.replace(/:/g, '_') + '.json'), JSON.stringify(out)); P('worker ' + spec + ' cells ' + out.length); }
if(process.env.WORKER){ worker(process.env.WORKER); }
else if(PART === 'prep'){
  Object.values(TREES).forEach(f => { try { fs.unlinkSync(f); } catch(e){} }); fs.readdirSync(SCR).filter(f => /^res_/.test(f)).forEach(f => fs.unlinkSync(F(f)));
  fs.copyFileSync(BASE229, TREES.V229); fs.copyFileSync(path.join(ROOT, 'index.html'), TREES.V230);
  const ver = f => (fs.readFileSync(f, 'utf8').match(/<meta name="ia-version" content="(\d+)"/) || [])[1];
  const g = cp.execSync('git show 0bec3ec:index.html', { cwd:ROOT, maxBuffer:1 << 26 });
  P('PREP V229 ia-version ' + ver(TREES.V229) + ' sha ' + sha(TREES.V229).slice(0, 16) + ' == git 0bec3ec ' + (crypto.createHash('sha256').update(g).digest('hex') === sha(TREES.V229)) + ' | V230 ia-version ' + ver(TREES.V230) + ' sha ' + sha(TREES.V230).slice(0, 16));
  const A1 = "        const _was=it.name;\n        if(_BW_SUBS[it.name]) it.name=_BW_SUBS[it.name];\n        else if(_BW_GEAR.test(it.name)) it.name=_bwFallback(it.name);\n";
  const B1 = A1 + "        if(_was!==it.name) it.__bw=(_BW_SUBS[_was]?'SUBS':'FB')+'<'+_was;\n";
  const A2 = "  if(cfg.equipment==='bodyweight') bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n";
  const B2 = "  if(cfg.injury&&globalThis.__rej){ var __pr=0,__pn=[]; Object.keys(weeks).forEach(function(w){Object.keys(weeks[w]||{}).forEach(function(d){var dy=weeks[w][d];if(dy&&Array.isArray(dy.sections)){var q=__rej(dy.sections,cfg.injury).r;__pr+=q.length;q.forEach(function(x){__pn.push(w+d+':'+x.kind+':'+x.n);});}});}); globalThis.__preRej={n:__pr,ex:__pn.slice(0,8)}; }\n" + A2;
  for(const [src, dst] of [[TREES.V229, TREES.TAG229], [TREES.V230, TREES.TAG230]]){ let s = fs.readFileSync(src, 'utf8'); for(const [a, b, nm] of [[A1, B1, 'bwSweep tag'], [A2, B2, 'pre-sweep hook']]){ const n = s.split(a).length - 1; P('  ' + path.basename(dst) + ' anchor [' + nm + '] count ' + n + ' line ' + s.slice(0, s.indexOf(a)).split('\n').length); if(n !== 1) throw new Error('anchor'); s = s.replace(a, b); } fs.writeFileSync(dst, s); }
  // neutrality + self-identity on 6 bodyweight cells
  const cells = lattices().filter(x => /bodyweight/.test(x.k)).filter((_, i) => i % 37 === 0).slice(0, 6); let neq = 0, self = 0, n = 0; const t0 = Date.now();
  for(const cell of cells){ n++; const a = fresh('V230', 'FIX'), b = fresh('V230', 'FIX'), c = fresh('TAG230', 'FIX'); const pa = a.buildProgram(clone(cell.c)), pb = b.buildProgram(clone(cell.c)), pc = c.buildProgram(clone(cell.c));
    if(JSON.stringify(pa.weeks) === JSON.stringify(pb.weeks)) self++; const sw = W => { const o = clone(W); Object.values(o).forEach(wk => Object.values(wk || {}).forEach(dy => (dy && dy.sections || []).forEach(s => (s.items || []).forEach(it => { if(it) delete it.__bw; })))); return JSON.stringify(o); };
    if(sw(pa.weeks) === sw(pc.weeks)) neq++; }
  P('PREP V230 self-identity ' + self + '/' + n + ' | TAG230 == V230 (with __bw stripped) ' + neq + '/' + n + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  P('PREP lattice sizes ' + JSON.stringify(tally(lattices(), x => x.L)));
}
else if(PART === 'run'){
  const jobs = []; const LS = tally(lattices(), x => x.L); const CH = 18;
  const add = (t, pres, L) => { for(let i = 0; i < LS[L]; i += CH) jobs.push([t, pres, L, i, Math.min(LS[L], i + CH)].join(':')); };
  for(const L of ['L432','LBW','MARIO']){ for(const t of ['TAG230']) add(t, 'FIX', L); for(const t of ['V229','V230']) for(const pres of ['OV1','FIX']) add(t, pres, L); }
  for(const t of ['V229','V230']) add(t, 'OV5', 'LBW'), add(t, 'OV5', 'MARIO');
  const par = +(process.env.PAR || 8); let i = 0; const t0 = Date.now();
  const one = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { WORKER:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { console.log((code ? 'WORKER CRASH ' + j + ' ' + o.slice(-800) : o.trim()) + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  Promise.all(Array.from({ length:par }, async () => { while(i < jobs.length) await one(jobs[i++]); })).then(() => P('jobs done ' + jobs.length));
}
else if(PART === 'report'){
  const R = []; fs.readdirSync(SCR).filter(f => /^res_.*\.json$/.test(f)).forEach(f => JSON.parse(fs.readFileSync(F(f), 'utf8')).forEach(x => R.push(x)));
  const seg = k => k.split('|'); P('cells loaded ' + R.length + ' ' + fmt(tally(R, x => x.t + '/' + x.pres + '/' + x.L)));
  // (1) population on the TAG tree, fixture build (OV1 pierced days == fixture days checked below by comparing reject sets)
  for(const L of ['L432','LBW','MARIO']){ const T = R.filter(x => x.t === 'TAG230' && x.L === L); const rows = []; T.forEach(c => c.rej.forEach(r => rows.push(Object.assign({ k:c.k }, r))));
    const days = T.reduce((a, c) => a + c.days, 0), rd = new Set(rows.map(r => r.k + r.w + r.d)).size, cardsTot = null;
    P('\n=== (1) ' + L + ' TAG230 fixture: ' + T.length + ' builds, ' + days + ' lifting days | post-sweep rejects ' + rows.length + ' cards on ' + rd + ' days in ' + new Set(rows.map(r => r.k)).size + ' builds | new items from refilter ' + T.reduce((a, c) => a + c.neu, 0));
    P('  pre-sweep reject count (hook just before bodyweightSweep, injured bodyweight builds) total ' + T.reduce((a, c) => a + (c.pre ? c.pre.n : 0), 0) + ' over ' + T.filter(c => c.pre).length + ' builds that reached the hook' + (T.filter(c => c.pre && c.pre.n).slice(0, 3).map(c => ' | ' + c.k + ' ' + c.pre.ex.join(',')).join('')));
    if(!rows.length) continue;
    P('  by kind ' + fmt(tally(rows, r => r.kind)));
    P('  by source ' + fmt(tally(rows, r => r.bw ? (r.bw.startsWith('FB') ? '_bwFallback catch-all/branch (' + r.bw + ')' : 'bodyweightSweep _BW_SUBS (' + r.bw + ')') : 'no bodyweightSweep tag')));
    P('  by region/tier ' + fmt(tally(rows, r => seg(r.k)[0]))); P('  by equipment ' + fmt(tally(rows, r => seg(r.k)[1]))); P('  by experience ' + fmt(tally(rows, r => seg(r.k)[2]))); P('  by focus ' + fmt(tally(rows, r => seg(r.k)[3]))); P('  by rest ' + fmt(tally(rows, r => seg(r.k)[4])));
    P('  by name ' + fmt(tally(rows, r => r.kind + ' ' + r.n + (r.to ? '>' + r.to : ''))));
    P('  by section ' + fmt(tally(rows, r => (/^Main/.test(r.lab) ? 'Main' : 'accessory') + (r.nItems === 1 ? ' (sole item)' : ' (of ' + r.nItems + ')'))));
    P('  by label ' + fmt(tally(rows, r => r.lab.replace(/<svg[\s\S]*?<\/svg>\s*/g, '').slice(0, 40))));
    P('  by week ' + fmt(tally(rows, r => 'W' + r.w))); P('  by day ' + fmt(tally(rows, r => r.d)));
    P('  by region/tier x name ' + fmt(tally(rows, r => seg(r.k)[0] + ' ' + r.n)));
    // the same set on the app presentations
    for(const t of ['V229','V230']) for(const pres of ['OV1','FIX','OV5']){ const C = R.filter(x => x.t === t && x.pres === pres && x.L === L); if(!C.length) continue; const key = c => c.rej.map(r => c.k + '|' + r.w + r.d + '|' + r.si + '.' + r.ii + '|' + r.kind + r.n);
      const tagSet = new Set(T.flatMap(c => key(c).filter(s => pres !== 'OV5' || +s.split('|')[5].match(/^\d+/)[0] >= 5))); const s = new Set(C.flatMap(key)); let inT = 0; s.forEach(x => { if(tagSet.has(x)) inT++; });
      P('  ' + t + ' ' + pres + ': rejects ' + s.size + ' over ' + C.reduce((a, c) => a + c.days, 0) + ' pierced lifting days | == TAG fixture set ' + inT + '/' + s.size + ' (TAG ' + tagSet.size + ')'); } }
  // (2)(3) reach
  for(const L of ['L432','LBW','MARIO']) for(const pres of ['OV1','FIX','OV5']) for(const t of ['V229','V230']){ const C = R.filter(x => x.t === t && x.pres === pres && x.L === L); if(!C.length) continue;
    const S = C.flatMap(c => c.swaps.map(s => Object.assign({ k:c.k }, s))), K = C.flatMap(c => c.ctrl.map(s => Object.assign({ k:c.k }, s))); const sw = S.filter(s => s.to), kw = K.filter(s => s.to);
    const cnt = (A, f) => A.filter(f).length;
    P('\n=== (2) ' + L + ' ' + t + ' ' + pres + ' | reject-day swaps tried ' + S.length + ' landed ' + sw.length + ' (skipped ' + (S.length - sw.length) + ': ' + fmt(tally(S.filter(s => !s.to), s => s.skip)) + ')');
    if(sw.length){ P('   boot != live ' + cnt(sw, s => !s.bootEq) + '/' + sw.length + ' (names differ ' + cnt(sw, s => !s.bootNamesEq) + ') | boot == hand (live minus rejects) ' + cnt(sw, s => s.bootEqHand) + '/' + sw.length + ' | boot names == live ' + cnt(sw, s => s.bootNamesEq));
      P('   on ' + new Set(sw.filter(s => !s.bootEq).map(s => s.k + s.w + s.d)).size + ' of ' + new Set(sw.map(s => s.k + s.w + s.d)).size + ' reject days | per day: swaps-that-drop / swaps ' + fmt(tally(Object.values(sw.reduce((m, s) => { const k = s.k + s.w + s.d; m[k] = m[k] || [0, 0]; m[k][1]++; if(!s.bootEq) m[k][0]++; return m; }, {})), v => v[0] + '/' + v[1])));
      P('   reboot (no new tap) == first boot ' + cnt(sw, s => s.rebootEqBoot) + '/' + sw.length + ' | undo: errors ' + cnt(sw, s => s.undoErr) + ', live after undo == built day ' + cnt(sw, s => s.undoLiveEqBuilt) + '/' + sw.length + ', undo+boot == undo live ' + cnt(sw, s => s.undoBootEqUndoLive) + '/' + sw.length + ', undo+boot names == built ' + cnt(sw, s => s.undoBootNamesEqBuilt) + '/' + sw.length);
      const dr = sw.filter(s => !s.bootEq); if(dr.length) P('   among drops: sections live>boot ' + fmt(tally(dr, s => s.secLive + '>' + s.secBoot)) + ' | Main sections live>boot ' + fmt(tally(dr, s => s.mainLive + '>' + s.mainBoot)) + ' | empty sections at boot ' + cnt(dr, s => s.emptySecBoot > 0) + ' | by reject ' + fmt(tally(dr, s => s.R.join(','))));
      P('   (3) live tap: other cards moved at the tap ' + cnt(sw, s => s.otherMoved > 0) + '/' + sw.length + ' | reject card gone from live at the tap ' + cnt(sw, s => s.rejGoneLive > 0) + '/' + sw.length + ' | choice landed elsewhere ' + cnt(sw, s => s.landedOther)); }
    P('   control (days with no reject): swaps ' + K.length + ' landed ' + kw.length + ' | boot != live ' + cnt(kw, s => !s.bootEq) + '/' + kw.length + ' | reboot == boot ' + cnt(kw, s => s.rebootEqBoot) + ' | undo+boot == undo live ' + cnt(kw, s => s.undoBootEqUndoLive) + ' | other cards moved at tap ' + cnt(kw, s => s.otherMoved > 0));
    kw.filter(s => !s.bootEq).slice(0, 4).forEach(s => P('     CONTROL MISMATCH ' + s.k + ' W' + s.w + ' ' + s.d + ' ' + s.from + '>' + s.to)); }
  // whole-day examples
  const exs = R.filter(x => x.t === 'V230' && x.pres === 'OV1' && x.ex); const pick = f => { for(const c of exs) for(const e of c.ex) if(f(e)) return [c.k, e]; return null; };
  const mainEx = pick(e => e.built.some(s => /^Main[^:]*: Burpees$/.test(s))), accEx = pick(e => !e.built.some(s => /^Main[^:]*: Burpees$/.test(s)));
  for(const [nm, x] of [['MAIN', mainEx], ['ACCESSORY/OTHER', accEx]]){ if(!x){ P('\n(2) ' + nm + ' example: none'); continue; } const [k, e] = x; P('\n(2) ' + nm + ' example V230 OV1 ' + k + ' W' + e.w + ' ' + e.d + ' swap ' + e.from + ' -> ' + e.to);
    for(const f of ['built','live','boot','undoBoot']){ P('   ' + f + ':'); e[f].forEach(s => P('      ' + s.replace(/<svg[\s\S]*?<\/svg>\s*/g, ''))); } }
}
else if(PART === 'writers'){
  const stripC = s => s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:"'\\])\/\/[^\n]*/g, '$1');
  const L = stripC(fs.readFileSync(TREES.V230, 'utf8')).split('\n'); const fns = []; L.forEach((x, i) => { const m = /^(?:async\s+)?function\s+([\w$]+)/.exec(x); if(m) fns.push([m[1], i]); }); const fnAt = i => { let r = '?'; for(const [n, j] of fns){ if(j <= i) r = n; else break; } return r; };
  const pats = [['.injury = (assignment)', /\.injury\s*=(?!=)/], ['injury: (object key)', /[{,]\s*injury\s*:/], ["['injury'] / \"injury\" key", /\[\s*['"]injury['"]\s*\]|['"]injury['"]\s*:/], ['delete .injury', /delete\s+[\w.$]*\.injury/], ['Object.assign(...cfg...) with injury', /Object\.assign\([^)]*injury/]];
  for(const [nm, rx] of pats){ const hits = []; L.forEach((x, i) => { if(rx.test(x)) hits.push((i + 1) + ' [' + fnAt(i) + '] ' + x.trim()); }); P('\n[6] V230 comment-stripped `' + nm + '`: ' + hits.length + ' lines'); hits.forEach(h => P('   ' + h)); }
}
// PART=writers2: bare `injury` tokens (not .injury, not injury:) and every ia_programs writer, V230 comment-stripped (run in the report as [6b])
if(PART === 'writers2'){
  const s = fs.readFileSync(TREES.V230, 'utf8').replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:"'\\])\/\/[^\n]*/g, '$1'); const L = s.split('\n');
  const fns = []; L.forEach((x, i) => { const m = /^(?:async\s+)?function\s+([\w$]+)/.exec(x); if(m) fns.push([m[1], i]); }); const fa = i => { let r = '?'; for(const [n, j] of fns){ if(j <= i) r = n; else break; } return r; };
  const o = []; L.forEach((x, i) => { const t = x.replace(/\.injury\b/g, '').replace(/\binjury\s*:/g, ''); if(/\binjury\b/.test(t)) o.push((i + 1) + ' [' + fa(i) + '] ' + x.trim().slice(0, 260)); }); P('[6b] bare `injury` tokens ' + o.length); o.forEach(x => P('  ' + x));
  const w = []; L.forEach((x, i) => { if(/savePrograms\s*\(|setItem\(\s*['"]ia_programs/.test(x) && !/function savePrograms/.test(x)) w.push((i + 1) + ' [' + fa(i) + '] ' + x.trim().slice(0, 200)); }); P('[6b] ia_programs writers ' + w.length); w.forEach(x => P('  ' + x));
  const wd = []; L.forEach((x, i) => { if(/\bWD\s*=(?!=)|Object\.assign\(\s*WD\b|\bWD\.injury\b/.test(x)) wd.push((i + 1) + ' [' + fa(i) + '] ' + x.trim().slice(0, 200)); }); P('[6b] WD (doGenerate cfg = buildProgram(WD)) writers ' + wd.length); wd.forEach(x => P('  ' + x)); }
