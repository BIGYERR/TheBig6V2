// v227_d190_premises.js — MEASURE (read-only). D190 (P-SWAPSEAM) premises P1–P8 on a source-surgery tree of V226.
//   SCR=<scratch> node tests/measure/v227_d190_premises.js > tests/measure/v227_d190_premises.out.txt
// Ruling: tests/measure/v227_rulings/d190_swapseam_ruling.md ("Premises for measure before builder").
// Trees (scratch copies; index.html is never written):
//   base_v226.html  git show HEAD:index.html
//   t_base.html     V226 + neutral boot re-filter probe (records whether applySessionSwaps' re-filter changed the day)
//   t_d190.html     V226 + D190 surgery (R2 strip at applySwapPrefs and applySwapChoice, cue literal hoisted, R3 live filter
//                   after _reRx, R4 _reRx vs stripped donor) + the same probe
//   d190_226.html   V226 + D190 surgery, no probe (gate runs); d190_227.html the same with ia-version 227
// Lattice: v227_swapseam.js's 9 configs x weeks 3,5,7 x every reachable hop1/hop2/cyc2 chain (full) + hop3/cyc3 (seeded walk,
//   <= N3 per day) + collide2/exch3 (seeded sample, <= NC per day). Fresh-page boot model (gate's BOOT MODEL).
// ORACLES: live = what the athlete last saw after the last applySwapChoice (never the boot path); undo = the day before the last
//   hop as the athlete saw it; cue literal typed; cap tables typed from the ruling's header (read from injuryPlan by coach),
//   class (iii) forms typed from the ruling's text; gate rows read from the gates' own printed lines.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const H = require(path.join(ROOT, 'tests', 'harness.js')); const { load, fixtures, progDigest } = H;
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset');
const CUE = ' — hold RPE 7, two in the tank';
const RPE7F = 'RPE 7 (leave 3 or more in reserve)', RPE8F = 'RPE 8 (stop 2 reps short of failure)';
const CAP = { 'knee/workaround':['squat','lunge','leg_iso'], 'ankle/workaround':['squat','lunge'], 'hip/workaround':['hinge','lunge','hip_ext','squat'],
  'lowback/workaround':['hinge','squat','row','hip_ext'], 'shoulder/workaround':['hpress','vpress','delt_iso'], 'elbow/workaround':['hpress','tri_iso','bi_iso','row','vpull'] };
const START = '2026-08-24', CLOCK = '2026-09-24', WEEKS = [3, 5, 7], DAYS = ['sun','mon','tue','wed','thu','fri','sat'], NT = 8, N3 = 6, NC = 8;
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135, squat:155, deadlift:185, seed:76308, injury:{ region:'knee', tier:'workaround' } };
const withInj = inj => { const c = JSON.parse(JSON.stringify(MARIO)); if(inj) c.injury = inj; else delete c.injury; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), manny:JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), mario_noinj:withInj(null),
  knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }),
  lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
const INJ = ck => CFGS[ck].injury ? CFGS[ck].injury.region + '/' + CFGS[ck].injury.tier : 'none';
const LAT = ['hop1','hop2','cyc2'], SAM = ['hop3','cyc3','collide2','exch3'];
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
// ── surgery ──
const BF_A = "    if(hit && prog.cfg && prog.cfg.injury){\n      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n    }";
const BF_B = "    if(hit && prog.cfg && prog.cfg.injury){\n      const __b=JSON.stringify(day.sections);\n      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n      const __a=JSON.stringify(day.sections);\n      if(typeof __BF!=='undefined') __BF.push({k:k,ch:__b!==__a});\n    }";
const D190 = [
  // R2: the literal hoisted to one constant, read by the appender and the stripper
  ["function applyInjuryFilter(sections,cfg){\n",
   "const INJ_CAP_CUE=' — hold RPE 7, two in the tank';\nfunction _stripCapCue(d){ return (typeof d==='string'&&d.endsWith(INJ_CAP_CUE))?d.slice(0,d.length-INJ_CAP_CUE.length):d; }\nfunction applyInjuryFilter(sections,cfg){\n"],
  ["detail=detail+' — hold RPE 7, two in the tank';", "detail=detail+INJ_CAP_CUE;"],
  // R2: boot / undo / exSwapPrefs hop
  ["      it.detail=_swapDetailFor(to,it.detail);\n", "      it.detail=_swapDetailFor(to,_stripCapCue(it.detail));\n"],
  // R2 + R4 + R3: live hop
  ["  const _wasDetail=item.detail;\n  const _rx={};\n  item.detail=_swapDetailFor(to,item.detail,_rx);\n  const _reRx=(item.detail!==_wasDetail);\n",
   "  const _wasDetail=item.detail;\n  const _base=_stripCapCue(_wasDetail);\n  const _rx={};\n  item.detail=_swapDetailFor(to,_base,_rx);\n  const _reRx=(item.detail!==_base);\n"
   + "  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    try{\n      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];\n      if(_fi&&_fi.name===to) item.detail=_fi.detail;\n    }catch(e){}\n  }\n"] ];
function surg(src, ed){ let s = src; for(const [a, b] of ed){ const n = s.split(a).length - 1; if(n !== 1) throw new Error('anchor count ' + n + ': ' + a.slice(0, 70)); s = s.replace(a, b); } return s; }
const F = n => path.join(SCR, n);
const TREES = { BASE:F('t_base.html'), D190:F('t_d190.html') };

let FILE = null;
function fresh(){ const T = load(FILE); pin(T); E(T, HELP); return T; }
const stored = {};
function setup(IA, ck){ IA.localStorage.clear(); pin(IA);
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
  if(!it) return 1; const ex = 'activeProg.weeks[' + c.w + '].' + c.d;
  const cands = Array.from(E(IA, '__cands(' + ex + ',' + c.w + ',' + JSON.stringify(it.name) + ')'));
  const can = E(IA, '__canSwap(' + ex + ',' + h.si + ',' + h.ii + ')');
  IA.ctx.__c = { secIdx:h.si, itemIdx:h.ii, name:it.name, detail:it.detail }; IA.ctx.__to = h.to; E(IA, '_swapCtx=__c;applySwapChoice(__to);');
  return (!can || !cands.includes(h.to)) ? 1 : 0;
}
function hstr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffled(a, seed){ const r = mulberry(hstr(seed)), b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

// ── WORKER ──
if(process.env.WORKER){
  const [tree, ck] = process.env.WORKER.split(':'); FILE = TREES[tree];
  const chains = JSON.parse(fs.readFileSync(F('chains_' + ck + '.json'), 'utf8'));
  const byDay = {}; chains.forEach(c => { (byDay[c.w + '_' + c.d] = byDay[c.w + '_' + c.d] || []).push(c); });
  const lists = Object.values(byDay), nB = Math.max(0, ...lists.map(l => l.length)); const out = [];
  const t1sample = new Set(); { const g = {}; chains.forEach(c => { const k = c.w + c.d + c.cls; g[k] = (g[k] || 0) + 1; if(g[k] <= NT) t1sample.add(c.id); }); }
  for(let b = 0; b < nB; b++){
    const batch = lists.map(l => l[b]).filter(Boolean);
    const A = fresh(); setup(A, ck); boot(A); const st = {};
    batch.forEach(c => { const h0 = c.hops[0]; st[c.id] = { pre:slotOf(dayOf(A, c.w, c.d), h0.si, h0.ii), steps:[], toasts:[], unreach:0 }; });
    for(const c of batch){ const s = st[c.id], L = c.hops.length - 1;
      c.hops.forEach((h, k) => { if(k === L){ const dy = dayOf(A, c.w, c.d); s.prevJS = JS(dy.sections); s.undoExp = slotOf(dy, h.si, h.ii); }
        E(A, '__T.length=0;'); s.unreach += hop(A, c, h); s.steps.push(slotOf(dayOf(A, c.w, c.d), h.si, h.ii)); s.toasts.push(Array.from(E(A, '__T')).join(' / ')); }); }
    batch.forEach(c => { const hl = c.hops[c.hops.length - 1], dy = dayOf(A, c.w, c.d);
      Object.assign(st[c.id], { liveSig:sig(dy), slotLive:slotOf(dy, hl.si, hl.ii), pat:E(A, '_pattern(' + JSON.stringify(hl.to) + ')') || '-',
        label:clean((dy.sections[hl.si] || {}).label) }); });
    const dev = dumpLS(A);
    const Rc = fresh(); putLS(Rc, dev); boot(Rc); const bf = Array.from(Rc.ctx.__BF || []);
    batch.forEach(c => { const k = 'w' + c.w + '_' + c.d, dy = dayOf(Rc, c.w, c.d), hl = c.hops[c.hops.length - 1]; const hits = bf.filter(x => x.k === k);
      Object.assign(st[c.id], { bootSig:sig(dy), slotBoot:slotOf(dy, hl.si, hl.ii), bfHit:hits.length, bfCh:hits.filter(x => x.ch).length }); });
    batch.forEach(c => { const hl = c.hops[c.hops.length - 1], s = st[c.id]; view(A, c.w, c.d);
      const chip = E(A, 'swapOriginOf(' + JSON.stringify(s.slotLive.n) + ')') || '';
      s.chip = chip; if(chip){ E(A, '__T.length=0;'); E(A, 'undoSwap(' + JSON.stringify(chip) + ');'); s.undoToast = Array.from(E(A, '__T')).join(' / '); }
      const dy = dayOf(A, c.w, c.d); s.slotUndo = slotOf(dy, hl.si, hl.ii); s.undoSig = sig(dy); s.undoJS = JS(dy.sections); });
    const U = fresh(); putLS(U, dumpLS(A)); boot(U);
    batch.forEach(c => { const hl = c.hops[c.hops.length - 1]; st[c.id].slotUndoBoot = slotOf(dayOf(U, c.w, c.d), hl.si, hl.ii); st[c.id].undoBootSig = sig(dayOf(U, c.w, c.d)); });
    const tb = batch.filter(c => t1sample.has(c.id));
    if(tb.length){ const T = fresh(); setup(T, ck); boot(T);
      tb.forEach(c => { view(T, c.w, c.d); E(T, "writeSetDraft('zz_touch',['1'],['1'],'');"); });
      for(const c of tb) for(const h of c.hops) hop(T, c, h);
      tb.forEach(c => { const hl = c.hops[c.hops.length - 1]; st[c.id].t1Live = slotOf(dayOf(T, c.w, c.d), hl.si, hl.ii); });
      const hist = Jget(T, 'ia_hist_PM'); const T2 = fresh(); putLS(T2, dumpLS(T)); boot(T2);
      tb.forEach(c => { const hl = c.hops[c.hops.length - 1], k = 'w' + c.w + '_' + c.d; st[c.id].t1Hist = hist[k] ? slotOf(hist[k], hl.si, hl.ii) : null; st[c.id].t1Boot = slotOf(dayOf(T2, c.w, c.d), hl.si, hl.ii); }); }
    batch.forEach(c => { const s = st[c.id]; s.undoDayEq = s.chip ? s.undoJS === s.prevJS : null; delete s.undoJS; delete s.prevJS;
      out.push(Object.assign({ id:c.id, ck, cls:c.cls, w:c.w, d:c.d, hops:c.hops.map(h => h.to) }, s)); });
  }
  fs.writeFileSync(F('res_' + tree + '_' + ck + '.json'), JSON.stringify(out));
  console.log('worker ' + tree + ':' + ck + ' rows ' + out.length); process.exit(0);
}

// ── DRIVER ──
const src = cp.execSync('git show HEAD:index.html', { cwd:ROOT, maxBuffer:1 << 28 }).toString();
for(const f of ['base_v226.html','t_base.html','t_d190.html','d190_226.html','d190_227.html']) try { fs.unlinkSync(F(f)); } catch(e){}
fs.writeFileSync(F('base_v226.html'), src);
const VER = +(/<meta name="ia-version" content="(\d+)"/.exec(src) || [])[1];
const head = cp.execSync('git rev-parse --short HEAD', { cwd:ROOT }).toString().trim();
console.log('v227_d190_premises | base ia-version ' + VER + ' HEAD ' + head + ' | HEAD == working index.html: ' + (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') === src));
const d190 = surg(src, D190);
fs.writeFileSync(F('d190_226.html'), d190);
fs.writeFileSync(F('d190_227.html'), surg(d190, [['<meta name="ia-version" content="226">', '<meta name="ia-version" content="227">']]));
fs.writeFileSync(TREES.BASE, surg(src, [[BF_A, BF_B]]));
fs.writeFileSync(TREES.D190, surg(d190, [[BF_A, BF_B]]));
// surgery diff, printed
{ fs.writeFileSync(F('_a.html'), src); try { cp.execSync('diff ' + F('_a.html') + ' ' + F('d190_226.html') + ' > ' + F('surgery.diff')); } catch(e){}
  console.log('\n=== SURGERY DIFF (V226 -> D190 tree, d190_226.html)\n' + fs.readFileSync(F('surgery.diff'), 'utf8')); }
// syntax
for(const f of ['d190_226.html','d190_227.html','t_d190.html','t_base.html']){
  fs.writeFileSync(F('_inl.js'), H.extractInlineJS(fs.readFileSync(F(f), 'utf8')));
  try { cp.execSync('node --check ' + F('_inl.js')); console.log('syntax ok ' + f); } catch(e){ console.log('SYNTAX FAIL ' + f + ' ' + e.message); process.exit(1); } }

// ── P5: digests, HALF_MANNY, exSwapPrefs ──
console.log('\n=== P5 buildProgram digests (clock pinned, seed pinned, each built twice per tree)');
{ const dg = {}; let eq = 0;
  for(const ck of Object.keys(CFGS)){ dg[ck] = {};
    for(const [t, f] of [['HEAD', F('base_v226.html')], ['D190', F('d190_226.html')]]){ const a = (X => (pin(X), progDigest(X.buildProgram(clone(CFGS[ck])))))(load(f)); const b = (X => (pin(X), progDigest(X.buildProgram(clone(CFGS[ck])))))(load(f)); dg[ck][t] = a === b ? a : 'SELF-MISMATCH'; }
    if(dg[ck].HEAD === dg[ck].D190 && dg[ck].HEAD !== 'SELF-MISMATCH') eq++; console.log('  ' + ck.padEnd(13) + ' HEAD ' + dg[ck].HEAD + '  D190 ' + dg[ck].D190); }
  console.log('  P5a digests equal ' + eq + '/' + Object.keys(CFGS).length + ' -> ' + (eq === 9 ? 'PASS' : 'FAIL'));
  const mh = progDigest(load(F('base_v226.html')).buildProgram(clone(fixtures.HALF_MANNY))), md = progDigest(load(F('d190_227.html')).buildProgram(clone(fixtures.HALF_MANNY)));
  console.log('  P5b HALF_MANNY (harness, unpinned clock as gates do): HEAD ' + mh + ' D190@227 ' + md + ' | MANNY_DIGEST_BY_VERSION[226] ' + H.MANNY_DIGEST_BY_VERSION[226] + ' [227] ' + H.MANNY_DIGEST_BY_VERSION[227]
    + ' -> ' + (md === '0ac7da6b1691a8e1' && mh === md ? 'PASS' : 'FAIL'));
  // exSwapPrefs: source Reverse lunge (KB) (natively cued on mario W3 thu), target a legal uncapped sheet candidate
  FILE = F('base_v226.html'); const IA = fresh(); setup(IA, 'mario'); boot(IA);
  const dy = dayOf(IA, 3, 'thu'); IA.ctx.__D = dy; const cands = Array.from(E(IA, '__cands(__D,3,"Reverse lunge (KB)")'));
  const capK = CAP['knee/workaround']; const pats = cands.map(n => [n, E(IA, '_pattern(' + JSON.stringify(n) + ')') || '-']);
  console.log('  P5c sheet candidates for Reverse lunge (KB), mario W3 thu: ' + pats.map(p => p[0] + '[' + p[1] + ']').join(', '));
  const uncapped = pats.filter(p => !capK.includes(p[1]));
  const targets = uncapped.length ? uncapped.map(p => p[0]) : ['Dumbbell split-stance deadlift'];
  if(!uncapped.length) console.log('  P5c no uncapped sheet candidate: fallback target Dumbbell split-stance deadlift (not a sheet candidate; pref map is name->name)');
  for(const tgt of targets.slice(0, 3)){
    const cfg = clone(CFGS.mario); cfg.exSwapPrefs = { 'Reverse lunge (KB)':tgt };
    const builds = {}; for(const [t, f] of [['HEAD', F('base_v226.html')], ['D190', F('d190_226.html')]]){ const X = load(f); pin(X); builds[t] = X.buildProgram(clone(cfg)); }
    const dh = progDigest(builds.HEAD), dd = progDigest(builds.D190); const ch = [];
    Object.keys(builds.HEAD.weeks).forEach(w => Object.keys(builds.HEAD.weeks[w]).forEach(d => { const a = builds.HEAD.weeks[w][d], b = builds.D190.weeks[w] && builds.D190.weeks[w][d];
      ((a && a.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { const o = b && b.sections[si] && b.sections[si].items[ii]; if(!o || o.name !== it.name || o.detail !== it.detail) ch.push('W' + w + ' ' + d + ' ' + clean(s.label) + ' :: ' + clean(it.name) + ' ' + JSON.stringify(it.detail) + ' => ' + (o ? clean(o.name) + ' ' + JSON.stringify(o.detail) : '(none)')); })); }));
    const kind = ch.map(x => /— hold RPE 7, two in the tank" => .*(?<!two in the tank)"$/.test(x) ? 'cue dropped' : 'other');
    console.log('  P5c exSwapPrefs {Reverse lunge (KB): ' + tgt + '} [' + (E(IA, '_pattern(' + JSON.stringify(tgt) + ')') || '-') + '] digest HEAD ' + dh + ' D190 ' + dd + ' | cards changed ' + ch.length + ' ' + JSON.stringify(kind.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {})));
    ch.forEach(x => console.log('    ' + x));
  }
}

// ── enumerate on BASE ──
FILE = TREES.BASE;
for(const ck of Object.keys(CFGS)){
  const IA = fresh(); setup(IA, ck); boot(IA); const chains = []; let id = 0; const stt = {};
  const cand = (w, n) => Array.from(E(IA, '__cands(__D,' + w + ',' + JSON.stringify(n) + ')'));
  const can = (si, ii) => !!E(IA, '__canSwap(__D,' + si + ',' + ii + ')');
  const add = (cls, w, d, hops) => { chains.push({ id:ck + '#' + id++, cls, w, d, hops }); const k = 'W' + w + '|' + cls; stt[k] = (stt[k] || 0) + 1; };
  for(const w of WEEKS) for(const d of DAYS){
    const live = dayOf(IA, w, d); if(!live || !live.sections) continue;
    const bs = clone(live); IA.ctx.__D = bs; const two = [], col = [], exc = [];
    const slots = []; bs.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && can(si, ii)) slots.push({ si, ii, n:it.name }); }));
    for(const sl of slots){ IA.ctx.__D = bs; const c1 = cand(w, sl.n);
      for(const Bn of c1){ add('hop1', w, d, [{ si:sl.si, ii:sl.ii, to:Bn }]);
        const d1 = clone(bs); d1.sections[sl.si].items[sl.ii].name = Bn; IA.ctx.__D = d1; if(!can(sl.si, sl.ii)) continue;
        for(const C of cand(w, Bn)){ const hops = [{ si:sl.si, ii:sl.ii, to:Bn }, { si:sl.si, ii:sl.ii, to:C }]; add(C === sl.n ? 'cyc2' : 'hop2', w, d, hops); two.push({ sl, d1, C, hops }); } } }
    for(const si of slots) for(const sj of slots){ if(si === sj) continue;
      IA.ctx.__D = bs; for(const X of cand(w, si.n)){ const d1 = clone(bs); d1.sections[si.si].items[si.ii].name = X; IA.ctx.__D = d1;
        if(!cand(w, sj.n).includes(si.n)) continue;
        col.push([{ si:si.si, ii:si.ii, to:X }, { si:sj.si, ii:sj.ii, to:si.n }]);
        const d2 = clone(d1); d2.sections[sj.si].items[sj.ii].name = si.n; IA.ctx.__D = d2;
        if(can(si.si, si.ii) && cand(w, X).includes(sj.n)) exc.push([{ si:si.si, ii:si.ii, to:X }, { si:sj.si, ii:sj.ii, to:si.n }, { si:si.si, ii:si.ii, to:sj.n }]); } }
    stt['W' + w + '|collide2_pop'] = (stt['W' + w + '|collide2_pop'] || 0) + col.length; stt['W' + w + '|exch3_pop'] = (stt['W' + w + '|exch3_pop'] || 0) + exc.length;
    shuffled(col, ck + w + d + 'col').slice(0, NC).forEach(h => add('collide2', w, d, h));
    shuffled(exc, ck + w + d + 'exc').slice(0, NC).forEach(h => add('exch3', w, d, h));
    let n3 = 0, nc3 = 0; const rnd = mulberry(hstr(ck + '|' + w + '|' + d + '|h3'));
    for(const t of shuffled(two, ck + '|' + w + '|' + d + '|two').slice(0, 120)){
      if(n3 >= N3 && nc3 >= N3) break;
      const d2 = clone(t.d1); d2.sections[t.sl.si].items[t.sl.ii].name = t.C; IA.ctx.__D = d2; if(!can(t.sl.si, t.sl.ii)) continue;
      const c3 = cand(w, t.C); if(!c3.length) continue;
      if(c3.includes(t.sl.n) && nc3 < N3){ nc3++; add('cyc3', w, d, t.hops.concat([{ si:t.sl.si, ii:t.sl.ii, to:t.sl.n }])); continue; }
      const others = c3.filter(x => x !== t.sl.n); if(others.length && n3 < N3){ n3++; add('hop3', w, d, t.hops.concat([{ si:t.sl.si, ii:t.sl.ii, to:others[Math.floor(rnd() * others.length)] }])); }
    }
  }
  fs.writeFileSync(F('chains_' + ck + '.json'), JSON.stringify(chains));
  console.log('ENUM ' + ck.padEnd(13) + ' ' + chains.length + ' ' + JSON.stringify(stt));
}

// ── jobs: lattice workers + gate runs ──
const GATES = fs.readdirSync(path.join(ROOT, 'tests', 'gates')).filter(f => f.endsWith('.js')).sort();
// scratch copy of g221 with G3c made cue-blind (the ruling's re-scope, shape only; strip both sides before the compare)
{ let g = fs.readFileSync(path.join(ROOT, 'tests', 'gates', 'g221_d177_swapfloor.js'), 'utf8');
  g = g.split("path.join(__dirname, '..', 'harness.js')").join(JSON.stringify(path.join(ROOT, 'tests', 'harness.js')));
  g = g.split("path.join(__dirname, '..', '..')").join(JSON.stringify(ROOT));
  g = surg(g, [["S.pow++; if(O !== D){ S.powChg++;", "S.pow++; if(__cb(O) !== __cb(D)){ S.powChg++;"],
               ["if(H.k === 'offgram'){ S.offN++; if(O !== D){", "if(H.k === 'offgram'){ S.offN++; if(__cb(O) !== __cb(D)){"],
               ["'use strict';\n", "'use strict';\nconst __cb = s => (typeof s === 'string' && s.endsWith(' — hold RPE 7, two in the tank')) ? s.slice(0, -' — hold RPE 7, two in the tank'.length) : s;\n"]]);
  try { fs.unlinkSync(F('g221_rescoped.js')); } catch(e){} fs.writeFileSync(F('g221_rescoped.js'), g); }
(async () => {
  const jobs = [];
  for(const t of ['BASE', 'D190']) for(const ck of Object.keys(CFGS)) jobs.push({ k:'W:' + t + ':' + ck, cmd:[__filename], env:{ WORKER:t + ':' + ck } });
  const ARTS = { HEAD:F('base_v226.html'), D190_226:F('d190_226.html'), D190_227:F('d190_227.html') };
  for(const g of GATES) for(const [an, af] of Object.entries(ARTS)) jobs.push({ k:'G:' + g + ':' + an, cmd:[path.join(ROOT, 'tests', 'gates', g), af, ARTS.HEAD] });
  for(const an of ['HEAD', 'D190_226', 'D190_227']) jobs.push({ k:'G:g221_RESCOPED:' + an, cmd:[F('g221_rescoped.js'), ARTS[an], ARTS.HEAD] });
  jobs.forEach(j => { j.out = F('job_' + j.k.replace(/[:]/g, '__') + '.out'); try { fs.unlinkSync(j.out); } catch(e){} });
  ['BASE','D190'].forEach(t => Object.keys(CFGS).forEach(ck => { try { fs.unlinkSync(F('res_' + t + '_' + ck + '.json')); } catch(e){} }));
  jobs.sort((a, b) => (a.k.startsWith('W') ? 0 : 1) - (b.k.startsWith('W') ? 0 : 1));
  let i = 0; const t0 = Date.now(); const code = {};
  const runOne = j => new Promise(res => { const fd = fs.openSync(j.out, 'w'); const p = cp.spawn(process.execPath, j.cmd, { cwd:ROOT, env:Object.assign({}, process.env, j.env || {}), stdio:['ignore', fd, fd] });
    const to = setTimeout(() => p.kill('SIGKILL'), 2400e3); p.on('exit', (c, s) => { clearTimeout(to); fs.closeSync(fd); code[j.k] = s || c; res(); }); });
  await Promise.all(Array.from({ length:7 }, async () => { while(i < jobs.length){ const j = jobs[i++]; await runOne(j); } }));
  console.log('\njobs done ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  // gate table
  const sum = j => { const t = fs.readFileSync(j.out, 'utf8'); const m = t.match(/PASS (\d+) FAIL (\d+)\s*$/); return { s:m ? 'PASS ' + m[1] + ' FAIL ' + m[2] : 'NO SUMMARY (crash, exit ' + code[j.k] + ')', t }; };
  const gk = (g, a) => jobs.find(j => j.k === 'G:' + g + ':' + a);
  console.log('\n=== GATES run directly (argv[3] = HEAD base_v226.html) — rows where any count differs from HEAD');
  let nsame = 0;
  for(const g of GATES.concat(['g221_RESCOPED'])){ const r = ['HEAD', 'D190_226', 'D190_227'].map(a => sum(gk(g, a)).s);
    if(r[0] === r[1] && r[0] === r[2]){ nsame++; continue; }
    console.log('  ' + g.padEnd(34) + ' HEAD ' + r[0] + ' | D190@226 ' + r[1] + ' | D190@227 ' + r[2]);
    for(const a of ['D190_226', 'D190_227']){ const s = sum(gk(g, a)), h = sum(gk(g, 'HEAD'));
      const hl = new Set(h.t.split('\n').filter(x => /^(PASS|FAIL|SKIP|REFUSED)/.test(x)).map(x => x.slice(0, 160)));
      s.t.split('\n').filter(x => /^(FAIL|REFUSED)/.test(x) && !hl.has(x.slice(0, 160))).forEach(x => console.log('      ' + a + ' ' + x.slice(0, 600))); } }
  console.log('  gates with identical summaries on all three artifacts: ' + nsame + '/' + (GATES.length + 1));
  // P7 / P1 rows printed whole
  for(const [g, a, re] of [['g221_d177_swapfloor.js', 'D190_226', /^(PASS|FAIL|SKIP).*(G1a|G3c|G5a|G6a|G7-1b|G7-2a)/], ['g221_RESCOPED', 'D190_226', /^(PASS|FAIL|SKIP).*(G3c|G6a)/], ['g221_RESCOPED', 'HEAD', /^(PASS|FAIL|SKIP).*(G3c)/],
    ['g222_d181_chain.js', 'D190_227', /^(PASS|FAIL|SKIP|REFUSED|  ENUM|  5L|.*licen)/i], ['g222_d181_chain.js', 'D190_226', /^(PASS|FAIL).*5L/]]){
    const s = sum(gk(g, a)); console.log('\n  [' + g + ' on ' + a + '] ' + s.s); s.t.split('\n').filter(x => re.test(x)).forEach(x => console.log('    ' + x.slice(0, 700))); }
  // lattice
  const R = {}; for(const t of ['BASE', 'D190']) for(const ck of Object.keys(CFGS)){ const f = F('res_' + t + '_' + ck + '.json'); if(!fs.existsSync(f)){ console.log('MISSING ' + t + ':' + ck + ' (failed measurement) ' + fs.readFileSync(jobs.find(j => j.k === 'W:' + t + ':' + ck).out, 'utf8').slice(-400)); continue; } R[t + ':' + ck] = JSON.parse(fs.readFileSync(f, 'utf8')); }
  report(R);
})();

const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const PF = b => b ? 'PASS' : 'FAIL';
function moveKind(a, b){ // a = V226 detail, b = D190 detail
  if(a === b) return 'same';
  if(b === a + CUE) return '(i) cue now at tap';
  if(a === b + CUE) return '(ii) cue dropped, loaded end';
  if(a.includes(RPE7F) && b.includes(RPE8F) && a.replace(RPE7F, RPE8F) === b) return '(iii) RPE 7 form -> RPE 8 form';
  return 'other: ' + JSON.stringify(a) + ' -> ' + JSON.stringify(b);
}
function report(R){
  const all = t => Object.keys(R).filter(j => j.startsWith(t + ':')).flatMap(j => R[j]);
  const B = new Map(all('BASE').map(r => [r.id, r])), D = new Map(all('D190').map(r => [r.id, r]));
  const ids = [...B.keys()].filter(id => D.has(id));
  const reach = (t, cls) => all(t).filter(r => !r.unreach && cls.includes(r.cls));
  console.log('\n=== LATTICE rows: BASE ' + B.size + ' D190 ' + D.size + ' joined ' + ids.length + ' | reachability moved BASE->D190 ' + ids.filter(id => !!B.get(id).unreach !== !!D.get(id).unreach).length);
  // P1
  console.log('\n=== P1 residue live != fresh-page boot');
  for(const t of ['BASE', 'D190']){ for(const [nm, cls] of [['lattice hop1/hop2/cyc2', LAT], ['samples hop3/cyc3/collide2/exch3', SAM]]){
    const rr = reach(t, cls), sl = rr.filter(r => r.slotBoot.d !== r.slotLive.d || r.slotBoot.n !== r.slotLive.n), dy = rr.filter(r => r.bootSig !== r.liveSig);
    console.log('  ' + t.padEnd(5) + ' ' + nm.padEnd(34) + ' last-hop slot ' + sl.length + '/' + rr.length + ' | whole day ' + dy.length + '/' + rr.length + (t === 'D190' ? '  -> ' + PF(rr.length > 0 && sl.length === 0 && dy.length === 0) : ''));
    if(sl.length || dy.length) console.log('      by config|class: slot ' + fmt(tally(sl, r => r.ck + '|' + r.cls)) + ' || day ' + fmt(tally(dy, r => r.ck + '|' + r.cls)));
    if(t === 'D190') dy.slice(0, 6).forEach(r => console.log('      ' + r.id + ' ' + r.cls + ' W' + r.w + ' ' + r.d + ' ' + r.pre.n + ' > ' + r.hops.join(' > ') + '\n        live ' + JSON.stringify(r.slotLive.d) + ' boot ' + JSON.stringify(r.slotBoot.d))); }
    const sc = tally(reach(t, SAM), r => r.ck + '|' + r.cls); if(t === 'D190') console.log('      sample denominators: ' + fmt(sc)); }
  // P2
  const J = ids.map(id => [B.get(id), D.get(id)]).filter(([b, d]) => !b.unreach && !d.unreach);
  const JL = J.filter(([b]) => LAT.includes(b.cls)), JS_ = J.filter(([b]) => SAM.includes(b.cls));
  const tmv = JL.filter(([b, d]) => b.toasts.join('#') !== d.toasts.join('#')), tmvS = JS_.filter(([b, d]) => b.toasts.join('#') !== d.toasts.join('#'));
  console.log('\n=== P2 toasts moved V226 -> D190 (every hop): lattice ' + tmv.length + '/' + JL.length + ' -> ' + PF(tmv.length === 0) + ' | samples ' + tmvS.length + '/' + JS_.length);
  tmv.concat(tmvS).slice(0, 5).forEach(([b, d]) => console.log('    ' + b.id + ' ' + b.hops.join('>') + ' :: ' + b.toasts.join(' # ') + ' => ' + d.toasts.join(' # ')));
  // P3
  console.log('\n=== P3 live / boot moved V226 -> D190 (last-hop slot), lattice ' + JL.length + ' joined reachable');
  const nat = r => r.pre.d.endsWith(CUE);
  const lm = JL.filter(([b, d]) => b.slotLive.d !== d.slotLive.d), bm = JL.filter(([b, d]) => b.slotBoot.d !== d.slotBoot.d);
  console.log('  live moved ' + lm.length + ' | by config|class|kind:'); Object.entries(tally(lm, ([b, d]) => b.ck + '|' + b.cls + '|' + moveKind(b.slotLive.d, d.slotLive.d).slice(0, 34) + (nat(b) ? '|natively-cued donor' : ''))).sort().forEach(([k, v]) => console.log('    ' + String(v).padStart(5) + ' ' + k));
  console.log('  boot moved ' + bm.length + ' | by config|class|kind:'); Object.entries(tally(bm, ([b, d]) => b.ck + '|' + b.cls + '|' + moveKind(b.slotBoot.d, d.slotBoot.d).slice(0, 34) + (nat(b) ? '|natively-cued donor' : ''))).sort().forEach(([k, v]) => console.log('    ' + String(v).padStart(5) + ' ' + k));
  const kl = ([b, d]) => moveKind(b.slotLive.d, d.slotLive.d), kb = ([b, d]) => moveKind(b.slotBoot.d, d.slotBoot.d);
  const ci = lm.filter(p => kl(p).startsWith('(i)')), cii = lm.filter(p => kl(p).startsWith('(ii)')), ciii = lm.filter(p => kl(p).startsWith('(iii)')), coth = lm.filter(p => kl(p).startsWith('other'));
  const ci_m = ci.filter(([b]) => b.ck === 'mario').length, ci_a = ci.filter(([b]) => b.ck === 'ankle_wa').length;
  console.log('  class (i) ' + ci.length + ' (mario ' + ci_m + ', ankle ' + ci_a + ', other cfgs ' + (ci.length - ci_m - ci_a) + ') | (ii) ' + cii.length + ' | (iii) ' + ciii.length + ' | other ' + coth.length);
  console.log('  (i) rows == V226 residue rows (BASE boot != live): ' + ci.filter(([b]) => b.slotBoot.d !== b.slotLive.d).length + '/' + ci.length + ' of V226 residue ' + JL.filter(([b]) => b.slotBoot.d !== b.slotLive.d).length);
  const iiSet = new Set(cii.concat(ciii).map(([b]) => b.id)), bSet = new Set(bm.map(([b]) => b.id));
  const bNotII = bm.filter(([b]) => !iiSet.has(b.id)), iiNotB = cii.concat(ciii).filter(([b]) => !bSet.has(b.id));
  const bKindAgree = bm.filter(p => iiSet.has(p[0].id) && kb(p) === kl(p)).length;
  console.log('  boot moved == (ii)+(iii): boot-moved not in (ii)+(iii) ' + bNotII.length + ', (ii)+(iii) whose boot did not move ' + iiNotB.length + ', same kind on both paths ' + bKindAgree + '/' + bm.length + ' -> ' + PF(bNotII.length === 0 && iiNotB.length === 0 && coth.length === 0));
  console.log('  natively-cued donor chains (lattice, reachable): ' + fmt(tally(JL.filter(([b]) => nat(b)), ([b]) => b.ck)));
  bNotII.slice(0, 4).concat(coth.slice(0, 4)).forEach(([b, d]) => console.log('    ' + b.id + ' ' + b.cls + ' ' + b.pre.n + ' (' + b.pre.d + ') > ' + b.hops.join(' > ') + ' | live ' + kl([b, d]) + ' | boot ' + kb([b, d])));
  { const lmS = JS_.filter(([b, d]) => b.slotLive.d !== d.slotLive.d); console.log('  samples: live moved ' + lmS.length + '/' + JS_.length + ' ' + fmt(tally(lmS, p => p[0].ck + '|' + kl(p).slice(0, 34)))); }
  // P4
  const un = J.filter(([b]) => !CFGS[b.ck].injury);
  const unMv = un.filter(([b, d]) => b.liveSig !== d.liveSig || b.bootSig !== d.bootSig || b.toasts.join('#') !== d.toasts.join('#') || b.undoSig !== d.undoSig || b.undoBootSig !== d.undoBootSig || b.undoToast !== d.undoToast);
  const unL = un.filter(([b]) => LAT.includes(b.cls));
  console.log('\n=== P4 uninjured (manny, mario_noinj) moved on live/boot/toast/undo: lattice ' + unMv.filter(([b]) => LAT.includes(b.cls)).length + '/' + unL.length + ' -> ' + PF(unMv.length === 0 && unL.length > 0) + ' | all classes ' + unMv.length + '/' + un.length);
  // P6
  console.log('\n=== P6 undo of the last hop (lattice hop1/hop2/cyc2)');
  for(const t of ['BASE', 'D190']){ const rr = reach(t, LAT).filter(r => r.chip), inj = rr.filter(r => CFGS[r.ck].injury);
    const sb = rr.filter(r => r.slotUndo.n !== r.undoExp.n || r.slotUndo.d !== r.undoExp.d), db = rr.filter(r => !r.undoDayEq), ub = rr.filter(r => r.undoBootSig !== r.undoSig);
    console.log('  ' + t.padEnd(5) + ' chip ' + rr.length + '/' + reach(t, LAT).length + ' | slot != pre-hop live ' + sb.length + ' | whole day not byte-identical to pre-hop (clock stripped) ' + db.length + ' (injured ' + db.filter(r => CFGS[r.ck].injury).length + '/' + inj.length + ') | undo-boot != undo-live (day) ' + ub.length
      + (t === 'D190' ? ' -> ' + PF(rr.length > 0 && sb.length === 0 && db.length === 0 && ub.length === 0) : ''));
    if(db.length || ub.length) console.log('    by config: day ' + fmt(tally(db, r => r.ck + '|' + r.cls)) + ' || undo-boot ' + fmt(tally(ub, r => r.ck + '|' + r.cls)));
    ub.slice(0, 3).forEach(r => console.log('    ' + r.id + ' ' + r.hops.join('>') + ' undo live ' + JSON.stringify(r.slotUndo.d) + ' boot ' + JSON.stringify(r.slotUndoBoot.d))); }
  // ia_hist_ reader (t1 sample)
  for(const t of ['BASE', 'D190']){ const t1 = all(t).filter(r => !r.unreach && r.t1Live); console.log('  IA_HIST t1 ' + t + ': rows ' + t1.length + ' | hist slot != live ' + t1.filter(r => !r.t1Hist || r.t1Hist.d !== r.t1Live.d).length + ' | boot slot != live ' + t1.filter(r => r.t1Boot.d !== r.t1Live.d).length); }
  // cue <=> cap (ruling gate claim b) on D190 live, every hop, workaround configs
  console.log('\n=== cue <=> cap on D190 live final slot (workaround configs; cap table typed from the ruling)');
  { const rows = all('D190').filter(r => !r.unreach && CAP[INJ(r.ck)]); let bad = [];
    rows.forEach(r => { const cap = CAP[INJ(r.ck)].includes(r.pat), d = r.slotLive.d, has = d.endsWith(CUE), base = has ? d.slice(0, -CUE.length) : d;
      const want = cap && !/RPE/.test(base) && !!base; if(has !== want) bad.push(r); });
    console.log('  violations ' + bad.length + '/' + rows.length + ' ' + fmt(tally(bad, r => r.ck + '|' + r.pat + '|' + (r.slotLive.d.endsWith(CUE) ? 'cued' : 'uncued'))));
    bad.slice(0, 4).forEach(r => console.log('    ' + r.id + ' ' + r.hops.join('>') + ' [' + r.pat + '] ' + JSON.stringify(r.slotLive.d)));
    const ex = (ck, a, b) => { for(const r of all('D190')) if(r.ck === ck && !r.unreach) for(let k = 0; k < r.hops.length; k++){ const from = k ? r.hops[k - 1] : r.pre.n; if(from === a && r.hops[k] === b) return r.id + ' hop' + (k + 1) + ' ' + JSON.stringify(r.steps[k].d); } return '(not on lattice)'; };
    console.log('  named: mario KB swing -> DB goblet squat: ' + ex('mario', 'Kettlebell swing', 'Dumbbell goblet squat'));
    console.log('  named: mario DB goblet squat -> DB split-stance DL: ' + ex('mario', 'Dumbbell goblet squat', 'Dumbbell split-stance deadlift'));
    console.log('  named: ankle DB goblet squat -> Nordic hamstring curl (anchored): ' + ex('ankle_wa', 'Dumbbell goblet squat', 'Nordic hamstring curl (anchored)'));
    console.log('  named: ankle KB swing -> DB goblet squat: ' + ex('ankle_wa', 'Kettlebell swing', 'Dumbbell goblet squat')); }
  // ruling's before/after table rows
  console.log('\n=== Ruling table rows on D190');
  for(const id of ['mario#5409','mario#5410','mario#5411','mario#5500','mario#7429','ankle_wa#1673','ankle_wa#1677']){ const b = B.get(id), d = D.get(id);
    if(!d){ console.log('  ' + id + ' (absent)'); continue; } console.log('  ' + id + ' ' + d.pre.n + ' (' + d.pre.d + ') > ' + d.hops.join(' > ') + ' | steps ' + d.steps.map(s => JSON.stringify(s.d)).join(' , ') + ' | live ' + JSON.stringify(d.slotLive.d) + ' boot ' + JSON.stringify(d.slotBoot.d) + ' | V226 live ' + JSON.stringify(b.slotLive.d) + ' boot ' + JSON.stringify(b.slotBoot.d)); }
  // P8
  console.log('\n=== P8 chains from natively cued items (mario, ankle_wa), every class, live vs boot on D190');
  for(const ck of ['mario', 'ankle_wa']){ const rr = all('D190').filter(r => r.ck === ck && !r.unreach && r.pre.d.endsWith(CUE) && r.cls !== 'collide2' && r.cls !== 'exch3');
    const items = tally(rr, r => 'W' + r.w + ' ' + r.d + ' ' + r.label.replace(/ — .*/, '') + ' :: ' + r.pre.n);
    const bad = rr.filter(r => r.slotLive.d !== r.slotBoot.d || r.liveSig !== r.bootSig);
    console.log('  ' + ck + ': chains ' + rr.length + ' from items ' + JSON.stringify(items) + ' | live != boot ' + bad.length + ' -> ' + PF(rr.length > 0 && bad.length === 0) + ' | by class ' + fmt(tally(rr, r => r.cls)));
    fs.writeFileSync(F('p8_' + ck + '.txt'), rr.map(r => r.id + ' ' + r.cls + ' W' + r.w + ' ' + r.d + ' ' + r.pre.n + ' (' + r.pre.d + ') > ' + r.hops.join(' > ') + ' | live ' + JSON.stringify(r.slotLive.d) + ' | boot ' + JSON.stringify(r.slotBoot.d) + ' | V226 live ' + JSON.stringify(B.get(r.id).slotLive.d)).join('\n') + '\n');
    console.log('    full list: ' + F('p8_' + ck + '.txt') + ' | final-detail kinds: ' + fmt(tally(rr, r => moveKind(B.get(r.id).slotLive.d, r.slotLive.d).slice(0, 34))));
    rr.filter((r, i, a) => a.findIndex(x => x.hops.join() === r.hops.join() && x.pre.n === r.pre.n) === i).slice(0, 8).forEach(r => console.log('    ' + r.cls + ' W' + r.w + ' ' + r.pre.n + ' > ' + r.hops.join(' > ') + ' | live ' + JSON.stringify(r.slotLive.d) + ' boot ' + JSON.stringify(r.slotBoot.d))); }
  // boot re-filter still load-bearing on D190
  for(const t of ['BASE', 'D190']){ const inj = reach(t, LAT).filter(r => CFGS[r.ck].injury), hit = inj.filter(r => r.bfHit), ch = inj.filter(r => r.bfCh);
    console.log('  boot re-filter ' + t + ': changed the day on ' + ch.length + '/' + hit.length + ' injured hit days (lattice) ' + fmt(tally(ch, r => r.ck))); }
}
