// v227_swapseam.js — MEASURE (read-only). §12 (C) P-SWAPSEAM before-picture + counterfactual.
//   SCR=<scratch> node tests/measure/v227_swapseam.js            (driver; spawns workers, aggregates)
// Question: the D181 5L residue (swap chain slot detail live != boot). Live path applySwapChoice never runs
// applyInjuryFilter; boot path applySessionSwaps runs it on a hit. Counterfactual S1 = applyInjuryFilter on the swapped
// item right after _swapDetailFor (before _reRx), keep filtered detail; S2 = same, placed after _reRx (toast unchanged).
// Trees (all source-surgery copies in SCR, index.html never written): BASE = HEAD (V226) + neutral instrumentation of the
// boot re-filter; S1, S2 = BASE + the surgery line. Instrumentation records, per boot hit, whether applyInjuryFilter
// changed the day (JSON before != after). It never changes a value.
// ORACLE: what the athlete last saw live (the day after the last applySwapChoice on a fresh page), the undo oracle is the
// live slot before the last hop (what the athlete saw), the cue oracle is the literal cue string typed below. The boot path
// is only ever the thing measured, never the expected value.
// Lattice: 9 configs (MARIO knee/workaround seed 76308; HALF_MANNY; MARIO uninjured; MARIO with knee/protect, ankle, hip,
// lowback, shoulder, elbow workaround) x weeks 3,5,7 x every reachable hop1 / hop2 / cyc2 chain (full enumeration, gate's
// enumerator) on each swappable slot; mode u (untouched) every chain, mode t1 (touch then chain) sampled <= NT per day/class.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset');
const CUE = ' — hold RPE 7, two in the tank';
const START = '2026-08-24', CLOCK = '2026-09-24', WEEKS = [3, 5, 7], DAYS = ['sun','mon','tue','wed','thu','fri','sat'], NT = 8;
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
const withInj = inj => { const c = JSON.parse(JSON.stringify(MARIO)); if(inj) c.injury = inj; else delete c.injury; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), manny:JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), mario_noinj:withInj(null),
  knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }),
  lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const CLK = /^_?(ts|at|time|stamp|clock|now)$/i;
const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
const clone = x => JSON.parse(JSON.stringify(x));
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};globalThis.__BF=[];";
const MAP_ASS = "function(prog,store){if(!prog||!prog.weeks||!store)return;Object.keys(store).forEach(function(k){"
  + "var m=/^w(\\d+)_(.+)$/.exec(k);if(!m)return;var w=+m[1],d=m[2];var day=prog.weeks[w]&&prog.weeks[w][d];"
  + "if(!day||!Array.isArray(day.sections))return;var list=(store[k]||[]).filter(function(e){return e&&e.from&&e.to;});"
  + "var map=Object.create(null);list.forEach(function(r){var cur=r.from;list.forEach(function(e){if(e.from===cur)cur=e.to;});map[r.from]=cur;});"
  + "if(applySwapPrefs(day.sections,map)&&prog.cfg&&prog.cfg.injury){day.sections=applyInjuryFilter(day.sections,prog.cfg);}});}";

// ── trees ──
const BF_A = "    if(hit && prog.cfg && prog.cfg.injury){\n      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n    }";
const BF_B = "    if(hit && prog.cfg && prog.cfg.injury){\n      const __b=JSON.stringify(day.sections);\n      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n      const __a=JSON.stringify(day.sections);\n      if(typeof __BF!=='undefined') __BF.push({k:k,ch:__b!==__a,b:__b!==__a?__b:'',a:__b!==__a?__a:''});\n    }";
const SW_A = "  item.detail=_swapDetailFor(to,item.detail,_rx);\n  const _reRx=(item.detail!==_wasDetail);\n";
const SURG = "  if(activeProg.cfg&&activeProg.cfg.injury){const _fs=applyInjuryFilter([{label:'',items:[{name:item.name,detail:item.detail}]}],activeProg.cfg);const _fi=_fs[0]&&_fs[0].items&&_fs[0].items[0];if(_fi&&_fi.name===item.name)item.detail=_fi.detail;}\n";
function surg(src, ed){ let s = src; for(const [a, b] of ed){ const n = s.split(a).length - 1; if(n !== 1) throw new Error('anchor count ' + n + ': ' + a.slice(0, 60)); s = s.replace(a, b); } return s; }
const TREES = { BASE:path.join(SCR, 't_base.html'), S1:path.join(SCR, 't_s1.html'), S2:path.join(SCR, 't_s2.html') };

let FILE = null;
function fresh(){ const T = load(FILE); pin(T); E(T, HELP); return T; }
const stored = {};
function setup(IA, ck){
  IA.localStorage.clear(); pin(IA);
  if(!stored[ck]){ const P = fresh(); const p = P.buildProgram(clone(CFGS[ck])); const st = clone(p);
    Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); stored[ck] = JSON.stringify(st); }
  IA.ctx.__SP = JSON.parse(stored[ck]); E(IA, 'savePrograms([__SP]);'); }
function boot(IA){ E(IA, '__BF.length=0;'); return E(IA, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));currentWeek=calcCurrentWeek();currentWeek"); }
function view(IA, w, d){ E(IA, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); }
function dayOf(IA, w, d){ return E(IA, 'activeProg&&activeProg.weeks&&activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d); }
function sig(dy){ if(!dy || !dy.sections) return '(none)'; return dy.sections.map(s => clean(s.label) + '{' + (s.items || []).map(it => clean(it.name) + '|' + (it.detail || '') + (it._skipped ? '[x]' : '')).join(';') + '}').join(' '); }
function slotOf(dy, si, ii){ const it = dy && dy.sections && dy.sections[si] && dy.sections[si].items && dy.sections[si].items[ii]; return it ? { n:clean(it.name), d:it.detail || '' } : { n:'(none)', d:'' }; }
const dumpLS = IA => new Map(IA.localStorage._map);
function putLS(IA, m){ IA.localStorage.clear(); for(const [k, v] of m) IA.localStorage.setItem(k, v); }
const Jget = (IA, k) => JSON.parse(IA.localStorage.getItem(k) || '{}');
function hop(IA, c, h){
  view(IA, c.w, c.d); const dy = dayOf(IA, c.w, c.d); const it = dy && dy.sections[h.si] && dy.sections[h.si].items[h.ii];
  if(!it) return 1;
  const ex = 'activeProg.weeks[' + c.w + '].' + c.d;
  const cands = Array.from(E(IA, '__cands(' + ex + ',' + c.w + ',' + JSON.stringify(it.name) + ')'));
  const can = E(IA, '__canSwap(' + ex + ',' + h.si + ',' + h.ii + ')');
  IA.ctx.__c = { secIdx:h.si, itemIdx:h.ii, name:it.name, detail:it.detail }; IA.ctx.__to = h.to; E(IA, '_swapCtx=__c;applySwapChoice(__to);');
  return (!can || !cands.includes(h.to)) ? 1 : 0;
}

// ── WORKER ──
if(process.env.WORKER){
  const [tree, ck] = process.env.WORKER.split(':'); FILE = TREES[tree];
  const chains = JSON.parse(fs.readFileSync(path.join(SCR, 'chains_' + ck + '.json'), 'utf8'));
  const byDay = {}; chains.forEach(c => { (byDay[c.w + '_' + c.d] = byDay[c.w + '_' + c.d] || []).push(c); });
  const lists = Object.values(byDay), nB = Math.min(+(process.env.LIMITB || 1e9), Math.max(0, ...lists.map(l => l.length))); const out = [];
  const t1sample = new Set(); { const g = {}; chains.forEach(c => { const k = c.w + c.d + c.cls; g[k] = (g[k] || 0) + 1; if(g[k] <= NT) t1sample.add(c.id); }); }
  for(let b = 0; b < nB; b++){
    const batch = lists.map(l => l[b]).filter(Boolean);
    // mode u
    const A = fresh(); setup(A, ck); boot(A);
    const st = {};
    batch.forEach(c => { const h0 = c.hops[0]; st[c.id] = { pre:slotOf(dayOf(A, c.w, c.d), h0.si, h0.ii), steps:[], toasts:[], unreach:0 }; });
    for(const c of batch){ const s = st[c.id];
      for(const h of c.hops){ E(A, '__T.length=0;'); s.unreach += hop(A, c, h); s.steps.push(slotOf(dayOf(A, c.w, c.d), h.si, h.ii)); s.toasts.push(Array.from(E(A, '__T')).join(' / ')); } }
    batch.forEach(c => { const h0 = c.hops[0], dy = dayOf(A, c.w, c.d); A.ctx.__D = dy;
      Object.assign(st[c.id], { liveSig:sig(dy), slotLive:slotOf(dy, h0.si, h0.ii),
        idem:E(A, "(function(){if(!activeProg.cfg||!activeProg.cfg.injury)return 'noinj';var f1=applyInjuryFilter(__D.sections,activeProg.cfg),f2=applyInjuryFilter(f1,activeProg.cfg);return (JSON.stringify(f1)===JSON.stringify(f2)?'f2=f1':'f2!=f1')+'|'+(JSON.stringify(f1)===JSON.stringify(__D.sections)?'f(live)=live':'f(live)!=live');})()"),
        pat:E(A, '_pattern(' + JSON.stringify(c.hops[c.hops.length - 1].to) + ')') || '-', patD:E(A, '_pattern(' + JSON.stringify(st[c.id].pre.n) + ')') || '-',
        label:clean((dy.sections[h0.si] || {}).label) }); });
    const dev = dumpLS(A);
    const Rc = fresh(); putLS(Rc, dev); boot(Rc); const bf = Array.from(Rc.ctx.__BF || []);
    batch.forEach(c => { const k = 'w' + c.w + '_' + c.d, dy = dayOf(Rc, c.w, c.d), h0 = c.hops[0];
      const hits = bf.filter(x => x.k === k);
      Object.assign(st[c.id], { bootSig:sig(dy), slotBoot:slotOf(dy, h0.si, h0.ii), bfHit:hits.length, bfCh:hits.filter(x => x.ch).length,
        bfDiff:hits.filter(x => x.ch).map(x => { const B = JSON.parse(x.b), Af = JSON.parse(x.a); return sig({ sections:B }) + '  ==>  ' + sig({ sections:Af }); })[0] || '' }); });
    if(tree === 'BASE'){ const res = batch.filter(c => st[c.id].slotBoot.d !== st[c.id].slotLive.d);
      if(res.length){ const M = fresh(); putLS(M, dev); E(M, 'applySessionSwaps=' + MAP_ASS + ';'); boot(M); res.forEach(c => { st[c.id].mapEq = sig(dayOf(M, c.w, c.d)) === st[c.id].bootSig; }); } }
    // undo of the last hop on the live page, then a boot of what it left
    batch.forEach(c => { const h0 = c.hops[0], s = st[c.id]; view(A, c.w, c.d);
      const chip = E(A, 'swapOriginOf(' + JSON.stringify(s.slotLive.n) + ')') || '';
      s.chip = chip; if(chip){ E(A, '__T.length=0;'); E(A, 'undoSwap(' + JSON.stringify(chip) + ');'); s.undoToast = Array.from(E(A, '__T')).join(' / '); }
      s.slotUndo = slotOf(dayOf(A, c.w, c.d), h0.si, h0.ii); s.undoSig = sig(dayOf(A, c.w, c.d));
      s.undoExp = c.hops.length > 1 ? s.steps[c.hops.length - 2] : s.pre; });
    const U = fresh(); putLS(U, dumpLS(A)); boot(U);
    batch.forEach(c => { const h0 = c.hops[0]; st[c.id].slotUndoBoot = slotOf(dayOf(U, c.w, c.d), h0.si, h0.ii); st[c.id].undoBootSig = sig(dayOf(U, c.w, c.d)); });
    // mode t1 (touch, then chain): the ia_hist_ reader
    const tb = batch.filter(c => t1sample.has(c.id));
    if(tb.length){ const T = fresh(); setup(T, ck); boot(T);
      tb.forEach(c => { view(T, c.w, c.d); E(T, "writeSetDraft('zz_touch',['1'],['1'],'');"); });
      for(const c of tb) for(const h of c.hops) hop(T, c, h);
      tb.forEach(c => { const h0 = c.hops[0]; st[c.id].t1Live = slotOf(dayOf(T, c.w, c.d), h0.si, h0.ii); });
      const hist = Jget(T, 'ia_hist_PM'); const T2 = fresh(); putLS(T2, dumpLS(T)); boot(T2);
      tb.forEach(c => { const h0 = c.hops[0], k = 'w' + c.w + '_' + c.d; st[c.id].t1Hist = hist[k] ? slotOf(hist[k], h0.si, h0.ii) : null; st[c.id].t1Boot = slotOf(dayOf(T2, c.w, c.d), h0.si, h0.ii); }); }
    batch.forEach(c => out.push(Object.assign({ id:c.id, ck, cls:c.cls, w:c.w, d:c.d, si:c.hops[0].si, ii:c.hops[0].ii, hops:c.hops.map(h => h.to) }, st[c.id])));
  }
  fs.writeFileSync(path.join(SCR, 'res_' + tree + '_' + ck + '.json'), JSON.stringify(out));
  console.log('worker ' + tree + ':' + ck + ' rows ' + out.length);
  process.exit(0);
}

// ── DRIVER ──
const src = fs.readFileSync(path.join(SCR, 'base_v226.html'), 'utf8');
const VER = +(/<meta name="ia-version" content="(\d+)"/.exec(src) || [])[1];
const head = cp.execSync('git rev-parse --short HEAD', { cwd:ROOT }).toString().trim();
const wt = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') === src;
console.log('v227_swapseam | base ia-version ' + VER + ' HEAD ' + head + ' | base == working index.html: ' + wt);
const base = surg(src, [[BF_A, BF_B]]);
['BASE', 'S1', 'S2'].forEach(t => { try { fs.unlinkSync(TREES[t]); } catch(e){} });
fs.writeFileSync(TREES.BASE, base);
fs.writeFileSync(TREES.S1, surg(base, [[SW_A, SW_A.split('\n')[0] + '\n' + SURG + SW_A.split('\n')[1] + '\n']]));
fs.writeFileSync(TREES.S2, surg(base, [[SW_A, SW_A + SURG]]));
// identity: instrumented BASE == base on buildProgram, and every tree's buildProgram digest for every config
{ const { progDigest } = require(path.join(ROOT, 'tests', 'harness.js')); const H = require(path.join(ROOT, 'tests', 'harness.js'));
  const files = { HEAD:path.join(SCR, 'base_v226.html'), BASE:TREES.BASE, S1:TREES.S1, S2:TREES.S2 }; const dg = {};
  for(const [t, f] of Object.entries(files)){ dg[t] = {}; for(const ck of Object.keys(CFGS)){ const X = load(f); pin(X); const a = progDigest(X.buildProgram(clone(CFGS[ck]))); const X2 = load(f); pin(X2); const b = progDigest(X2.buildProgram(clone(CFGS[ck]))); dg[t][ck] = a === b ? a : 'SELF-MISMATCH ' + a + '/' + b; } }
  const same = Object.keys(CFGS).filter(ck => ['BASE', 'S1', 'S2'].every(t => dg[t][ck] === dg.HEAD[ck])).length;
  console.log('IDENTITY buildProgram progDigest (clock pinned, seed pinned; each config built twice per tree): equal across HEAD/BASE/S1/S2 for ' + same + '/' + Object.keys(CFGS).length + ' configs');
  Object.keys(CFGS).forEach(ck => console.log('  ' + ck.padEnd(13) + ' HEAD ' + dg.HEAD[ck] + '  S1 ' + dg.S1[ck] + '  S2 ' + dg.S2[ck]));
  const MD = H.MANNY_DIGEST_BY_VERSION; if(MD) console.log('  MANNY_DIGEST_BY_VERSION[' + VER + '] = ' + MD[VER] + ' | harness HALF_MANNY digest (unpinned clock, as gates do) HEAD ' + progDigest(load(files.HEAD).buildProgram(clone(fixtures.HALF_MANNY))) + ' S1 ' + progDigest(load(files.S1).buildProgram(clone(fixtures.HALF_MANNY))));
  else console.log('  harness exports: ' + Object.keys(H).join(','));
}
// enumerate on BASE (gate's enumerator + hop1)
FILE = TREES.BASE;
const ENUM = {};
for(const ck of Object.keys(CFGS)){
  const IA = fresh(); setup(IA, ck); boot(IA); const chains = []; let id = 0; const stt = {};
  const cand = (w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')'));
  const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  const add = (cls, w, d, hops) => { chains.push({ id:ck + '#' + id++, cls, w, d, hops }); const k = 'W' + w + '|' + cls; stt[k] = (stt[k] || 0) + 1; };
  for(const w of WEEKS) for(const d of DAYS){
    const live = dayOf(IA, w, d); if(!live || !live.sections) continue;
    const bs = clone(live); IA.ctx.__D = bs;
    const slots = []; bs.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) slots.push({ si, ii, n:it.name }); }));
    for(const sl of slots){ IA.ctx.__D = bs; const c1 = cand(w, sl.n);
      for(const Bn of c1){ add('hop1', w, d, [{ si:sl.si, ii:sl.ii, to:Bn }]);
        const d1 = clone(bs); d1.sections[sl.si].items[sl.ii].name = Bn; IA.ctx.__D = d1; if(!can(sl.si, sl.ii)) continue;
        for(const C of cand(w, Bn)) add(C === sl.n ? 'cyc2' : 'hop2', w, d, [{ si:sl.si, ii:sl.ii, to:Bn }, { si:sl.si, ii:sl.ii, to:C }]); } }
  }
  fs.writeFileSync(path.join(SCR, 'chains_' + ck + '.json'), JSON.stringify(chains)); ENUM[ck] = chains.length;
  console.log('ENUM ' + ck.padEnd(13) + ' ' + chains.length + ' ' + JSON.stringify(stt));
}
// run workers, 6 at a time
(async () => {
  const jobs = []; for(const t of ['BASE', 'S1', 'S2']) for(const ck of Object.keys(CFGS)) jobs.push(t + ':' + ck);
  jobs.forEach(j => { try { fs.unlinkSync(path.join(SCR, 'res_' + j.replace(':', '_') + '.json')); } catch(e){} });
  let i = 0; const t0 = Date.now();
  const runOne = j => new Promise(res => { const p = cp.spawn(process.execPath, [__filename], { env:Object.assign({}, process.env, { WORKER:j }), stdio:['ignore', 'pipe', 'pipe'] });
    let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { if(code) console.log('WORKER CRASH ' + j + ' code ' + code + ' ' + o.slice(-400)); res(); }); });
  await Promise.all(Array.from({ length:6 }, async () => { while(i < jobs.length){ const j = jobs[i++]; await runOne(j); } }));
  console.log('workers done ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  const R = {}; for(const j of jobs){ const f = path.join(SCR, 'res_' + j.replace(':', '_') + '.json'); if(!fs.existsSync(f)){ console.log('MISSING ' + j + ' (failed measurement)'); continue; } R[j] = JSON.parse(fs.readFileSync(f, 'utf8')); }
  report(R);
})();

function kindOf(live, bootd){
  if(live === bootd) return 'same';
  if(bootd === live + CUE) return 'cue appended at boot';
  if(live === bootd + CUE) return 'cue on live, not at boot';
  let p = 0; while(p < live.length && live[p] === bootd[p]) p++;
  return 'other: live[' + p + ':]="' + live.slice(p) + '" boot[' + p + ':]="' + bootd.slice(p) + '"';
}
function tally(rows, key){ const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; }
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ');
function report(R){
  const INJ = ck => CFGS[ck].injury ? CFGS[ck].injury.region + '/' + CFGS[ck].injury.tier : 'none';
  const all = t => Object.keys(R).filter(j => j.startsWith(t + ':')).flatMap(j => R[j]);
  for(const t of ['BASE', 'S1', 'S2']){
    const rows = all(t), reach = rows.filter(r => !r.unreach), det = reach.filter(r => r.slotBoot.d !== r.slotLive.d), nm = reach.filter(r => r.slotBoot.n !== r.slotLive.n), day = reach.filter(r => r.bootSig !== r.liveSig);
    console.log('\n=== TREE ' + t + ' | chains ' + rows.length + ' reachable ' + reach.length + ' (unreachable at replay ' + (rows.length - reach.length) + ')');
    console.log('  slot detail live!=boot ' + det.length + '/' + reach.length + ' | slot name live!=boot ' + nm.length + '/' + reach.length + ' | whole day live!=boot ' + day.length + '/' + reach.length);
    const seg = {}; reach.forEach(r => { const k = r.ck + '|' + INJ(r.ck) + '|' + r.cls; const o = seg[k] = seg[k] || [0, 0, 0]; o[1]++; if(r.slotBoot.d !== r.slotLive.d) o[0]++; if(r.bootSig !== r.liveSig) o[2]++; });
    Object.keys(seg).sort().forEach(k => console.log('    ' + k.padEnd(40) + ' slot-detail residue ' + seg[k][0] + '/' + seg[k][1] + '   whole-day ' + seg[k][2] + '/' + seg[k][1]));
    const gw = reach.filter(r => (r.ck === 'mario' || r.ck === 'manny') && (r.cls === 'hop2' || r.cls === 'cyc2'));
    const gs = {}; gw.forEach(r => { const k = r.ck + '|W' + r.w; const o = gs[k] = gs[k] || [0, 0]; o[1]++; if(r.slotBoot.d !== r.slotLive.d) o[0]++; });
    console.log('  gate-lattice view (mario+manny hop2+cyc2, all chains, not the gate sample): ' + Object.keys(gs).sort().map(k => k + ' ' + gs[k][0] + '/' + gs[k][1]).join(' | '));
    if(det.length){
      console.log('  residue by week: ' + fmt(tally(det, r => r.ck + '|W' + r.w + '|' + r.d)));
      console.log('  residue by donor RPE-bearing (pre detail has RPE): ' + fmt(tally(det, r => /RPE/.test(r.pre.d) ? 'donor RPE' : 'donor no-RPE')) + ' | live detail has RPE: ' + fmt(tally(det, r => /RPE/.test(r.slotLive.d) ? 'yes' : 'no')));
      console.log('  RPE denominators (reachable, injured configs): donor RPE ' + reach.filter(r => CFGS[r.ck].injury && /RPE/.test(r.pre.d)).length + ', donor no-RPE ' + reach.filter(r => CFGS[r.ck].injury && !/RPE/.test(r.pre.d)).length);
      console.log('  residue by donor pattern > final pattern: ' + fmt(tally(det, r => r.patD + '>' + r.pat)));
      console.log('  residue by section label: ' + fmt(tally(det, r => r.label.replace(/ — .*/, ''))));
      console.log('  residue kind: '); Object.entries(tally(det, r => kindOf(r.slotLive.d, r.slotBoot.d))).forEach(([k, v]) => console.log('    ' + v + '× ' + k));
      console.log('  residue pairs: '); Object.entries(tally(det, r => r.slotLive.d + ' -> ' + r.slotBoot.d)).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('    ' + v + '× ' + k));
      if(t === 'BASE') console.log('  residue boot == MAP boot: ' + det.filter(r => r.mapEq).length + '/' + det.length);
    }
    if(day.length){ const dn = day.filter(r => r.slotBoot.d === r.slotLive.d); console.log('  whole-day diffs NOT on the swapped slot: ' + dn.length); dn.slice(0, 3).forEach(r => console.log('    ' + r.id + ' ' + r.cls + ' W' + r.w + ' ' + r.d + ' ' + r.hops.join('>') + '\n      live ' + r.liveSig.slice(0, 300) + '\n      boot ' + r.bootSig.slice(0, 300))); }
    // boot re-filter (Q5)
    const injR = reach.filter(r => CFGS[r.ck].injury), hits = injR.filter(r => r.bfHit > 0), ch = injR.filter(r => r.bfCh > 0);
    console.log('  BOOT RE-FILTER (applySessionSwaps on a hit): injured reachable chains ' + injR.length + ', days with a hit ' + hits.length + ', hits where the re-filter changed the day ' + ch.length + '/' + hits.length + ' | uninjured chains with a filter call ' + reach.filter(r => !CFGS[r.ck].injury && r.bfHit).length);
    if(ch.length){ console.log('    changed, by config|class: ' + fmt(tally(ch, r => r.ck + '|' + r.cls))); console.log('    changed, slot residue too: ' + ch.filter(r => r.slotBoot.d !== r.slotLive.d).length + '/' + ch.length);
      ch.filter(r => r.slotBoot.d === r.slotLive.d).slice(0, 3).forEach(r => console.log('    non-slot change ' + r.id + ' ' + r.hops.join('>') + ' :: ' + r.bfDiff.slice(0, 400))); }
    console.log('  idempotency on the live day (injured): ' + fmt(tally(injR, r => r.idem)));
    // readers
    const und = reach.filter(r => r.chip); const undBad = und.filter(r => r.slotUndo.n !== r.undoExp.n || r.slotUndo.d !== r.undoExp.d), undBoot = und.filter(r => r.slotUndoBoot.d !== r.slotUndo.d || r.slotUndoBoot.n !== r.slotUndo.n), undDay = und.filter(r => r.undoBootSig !== r.undoSig);
    console.log('  UNDO last hop: chip found ' + und.length + '/' + reach.length + ' | slot != what the athlete saw before the last hop ' + undBad.length + '/' + und.length + ' | undo boot slot != undo live ' + undBoot.length + '/' + und.length + ' | undo boot whole day != undo live ' + undDay.length + '/' + und.length);
    undBad.slice(0, 2).forEach(r => console.log('    ' + r.id + ' ' + r.cls + ' ' + r.hops.join('>') + ' exp ' + r.undoExp.n + ' :: ' + r.undoExp.d + ' | got ' + r.slotUndo.n + ' :: ' + r.slotUndo.d));
    undBoot.slice(0, 2).forEach(r => console.log('    undo-boot ' + r.id + ' ' + r.cls + ' ' + r.hops.join('>') + ' live ' + r.slotUndo.d + ' | boot ' + r.slotUndoBoot.d));
    const t1 = reach.filter(r => r.t1Live); console.log('  IA_HIST (t1, sampled): rows ' + t1.length + ' | hist slot != live ' + t1.filter(r => !r.t1Hist || r.t1Hist.d !== r.t1Live.d).length + ' | boot slot != live ' + t1.filter(r => r.t1Boot.d !== r.t1Live.d).length);
    const toastK = s => /Reps move to/.test(s) ? 'window' : /No load to add/.test(s) ? 'noload' : /Same job, same numbers/.test(s) ? 'same' : s ? 'other' : 'none';
    console.log('  TOASTS (every hop, reachable): ' + fmt(tally(reach.flatMap(r => r.toasts), toastK)));
    console.log('  HOP-1 window (Reps move to) on rows whose live slot carries the cue: ' + reach.filter(r => r.slotLive.d.endsWith(CUE) && r.toasts.some(x => /Reps move to/.test(x))).length);
  }
  // cross-tree joins
  const by = t => { const m = new Map(); all(t).forEach(r => m.set(r.id, r)); return m; };
  const B = by('BASE'), S1 = by('S1'), S2 = by('S2');
  console.log('\n=== BASE -> S1 / S2 per chain (joined by chain id)');
  for(const [nm, S] of [['S1', S1], ['S2', S2]]){
    const j = [...B.values()].filter(r => S.has(r.id)), mv = j.filter(r => JSON.stringify([r.slotLive, r.slotBoot, r.liveSig, r.bootSig]) !== JSON.stringify([S.get(r.id).slotLive, S.get(r.id).slotBoot, S.get(r.id).liveSig, S.get(r.id).bootSig]));
    const mvLive = j.filter(r => r.liveSig !== S.get(r.id).liveSig), mvBoot = j.filter(r => r.bootSig !== S.get(r.id).bootSig), reachMv = j.filter(r => !!r.unreach !== !!S.get(r.id).unreach);
    const tmv = j.filter(r => r.toasts.join('#') !== S.get(r.id).toasts.join('#')), umv = j.filter(r => (r.slotUndo && r.slotUndo.d) !== (S.get(r.id).slotUndo && S.get(r.id).slotUndo.d) || r.undoToast !== S.get(r.id).undoToast);
    console.log('  ' + nm + ': joined ' + j.length + ' | any field moved ' + mv.length + ' | live day moved ' + mvLive.length + ' | boot day moved ' + mvBoot.length + ' | reachability moved ' + reachMv.length + ' | toast moved ' + tmv.length + ' | undo result moved ' + umv.length);
    console.log('    live moved by config: ' + fmt(tally(mvLive, r => r.ck + '|' + r.cls)) + ' | boot moved by config: ' + fmt(tally(mvBoot, r => r.ck)));
    console.log('    uninjured configs (manny, mario_noinj): moved rows ' + j.filter(r => !CFGS[r.ck].injury && (mv.includes(r) || tmv.includes(r) || umv.includes(r))).length + '/' + j.filter(r => !CFGS[r.ck].injury).length);
    if(tmv.length){ console.log('    toast moves: ' + fmt(tally(tmv, r => r.toasts.map(x => x.replace(/^.* out\. /, '').slice(0, 40)).join('+') + ' => ' + S.get(r.id).toasts.map(x => x.replace(/^.* out\. /, '').slice(0, 40)).join('+')))); }
    mvLive.slice(0, 2).forEach(r => console.log('    e.g. ' + r.id + ' ' + r.hops.join('>') + ' live ' + r.slotLive.d + ' => ' + S.get(r.id).slotLive.d));
    const mvBootNotLive = mvBoot.filter(r => !mvLive.includes(r)); console.log('    boot moved without live moving: ' + mvBootNotLive.length);
  }
  // reporter's case: mario W5 hop2 residue, printed in full
  const rep = [...B.values()].filter(r => r.ck === 'mario' && r.w === 5 && r.cls === 'hop2' && !r.unreach && r.slotBoot.d !== r.slotLive.d);
  console.log('\n=== REPORTER CASE mario (knee/workaround, seed 76308, commercial, beginner, support_strength) W5 hop2 residue: ' + rep.length);
  console.log('    by day: ' + fmt(tally(rep, r => r.d)) + ' | by chain: '); Object.entries(tally(rep, r => r.pre.n + ' > ' + r.hops.join(' > '))).forEach(([k, v]) => console.log('      ' + v + '× ' + k));
  const pickRows = []; const seen = new Set(); rep.forEach(r => { const k = r.hops[1] + r.slotLive.d; if(!seen.has(k) && pickRows.length < 5){ seen.add(k); pickRows.push(r); } });
  pickRows.forEach(r => { const s1 = S1.get(r.id); console.log('  ' + r.id + ' mario W5 ' + r.d + ' slot [' + r.si + '][' + r.ii + '] section "' + r.label + '"\n    chain   ' + r.pre.n + ' (' + r.pre.d + ') -> ' + r.hops[0] + ' (' + r.steps[0].d + ') -> ' + r.hops[1]
    + '\n    live    ' + JSON.stringify(r.slotLive.d) + '\n    boot    ' + JSON.stringify(r.slotBoot.d) + '\n    diff    ' + kindOf(r.slotLive.d, r.slotBoot.d) + ' | name live ' + r.slotLive.n + ' boot ' + r.slotBoot.n + ' | toasts ' + r.toasts.map(x => x.replace(/^.* out\. /, '')).join(' + ')
    + '\n    S1 live ' + JSON.stringify(s1 && s1.slotLive.d) + ' | S1 boot ' + JSON.stringify(s1 && s1.slotBoot.d) + ' | S1 toasts ' + (s1 ? s1.toasts.map(x => x.replace(/^.* out\. /, '')).join(' + ') : '-')); });
}
