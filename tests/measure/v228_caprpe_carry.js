// v228_caprpe_carry.js — MEASURE (read-only). Post-build pre-scan of D193 (V228 slices 1+2 in the working tree).
//   SCR=<scratch>/carry PART=<prep|enum|chains|gate|report|all> node tests/measure/v228_caprpe_carry.js
// Trees (frozen copies in SCR): V227 = scratchpad/base_v227.html; V228 = working index.html copied at prep;
//   NOCLAMP = V228 with the capped-branch call to _capRpeClamp neutralised (anchor count 1): the carry sees the donor's
//   pre-clamp dose, the D190 cue-blind analogue. PRECARRY(end) = capped end ? _capRpeClamp(NOCLAMP end) : NOCLAMP end.
// F1 chains: the D190 lattice (v227_swapseam.js configs, weeks 3/5/7, every day, every swappable slot), hop2 and cyc2
//   fully enumerated, then filtered to chains where the clamp FIRES on a non-final hop (capped hop end whose
//   _swapDetailFor(_stripCapCue(prev)) names RPE>7); hop3 = every third hop off those, plus every hop2 whose second hop
//   fires, extended by every candidate. Live = applySwapChoice per hop on one page (one chain per day per batch);
//   boot = refreshProgram on the page's storage; build = exSwapPrefs {A:B,B:C(,C:D)} in cfg.
// F2-F4: the D177 gate's own L1 sweep (tests/gates/g221_d177_swapfloor.js), copied to SCR with a row dump spliced in
//   (anchors count 1), run on V227 and V228; rows joined by position. Not an edit of the gate.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const PART = process.env.PART || 'all';
const BASE227 = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/base_v227.html';
const TREES = { V227:F('t_v227.html'), V228:F('t_v228.html'), NOCLAMP:F('t_noclamp.html') };
const OLD = ' — hold RPE 7, two in the tank', NEW = ' — hold RPE 7, three in the tank';
const START = '2026-08-24', CLOCK = '2026-09-24', WEEKS = [3, 5, 7], DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const withInj = inj => { const c = clone(MARIO); if(inj) c.injury = inj; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), manny:clone(fixtures.HALF_MANNY), mario_noinj:withInj(null), knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }), lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
const CAP = { knee:{ workaround:['squat','lunge','leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat','lunge'], protect:['squat'] }, hip:{ workaround:['hinge','lunge','hip_ext','squat'], protect:['squat'] }, lowback:{ workaround:['hinge','squat','row','hip_ext'], protect:['squat','hip_ext'] }, shoulder:{ workaround:['hpress','vpress','delt_iso'], protect:[] }, elbow:{ workaround:['hpress','tri_iso','bi_iso','row','vpull'], protect:['row','vpull'] } };
const capOf = c => c && c.injury ? CAP[c.injury.region][c.injury.tier] : [];
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const rpeMax = d => { const v = [...String(d || '').matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)); return v.length ? Math.max(...v) : null; };
const shapeKey = d => String(d || '').replace(/^\d+/, 'N').replace(/×\d+(–\d+)?/, '×R').replace(/ — hold RPE 7, (two|three) in the tank$/, ' — CUE($1)');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12);
const out = []; const P = s => { out.push(s); console.log(s); };
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__canSwap=function(day,si,ii){var s=day.sections[si];var it=s&&s.items&&s.items[ii];if(!it)return false;return !!exControlFlags(s,ii,it).canSwap;};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};bumpSwapCount=function(){return false;};";
function fresh(t){ const X = load(TREES[t]); pin(X); E(X, HELP); return X; }
function setup(IA, st){ IA.localStorage.clear(); IA.ctx.__SP = JSON.parse(st); E(IA, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function storedFor(t, ck){ const f = F('stored_' + t + '_' + ck + '.json'); if(fs.existsSync(f)) return fs.readFileSync(f, 'utf8'); const X = load(TREES[t]); pin(X); const p = X.buildProgram(clone(CFGS[ck])); const s = clone(p); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); const j = JSON.stringify(s); fs.writeFileSync(f, j); return j; }
const slotOf = (IA, w, d, si, ii) => E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";var it=dy&&dy.sections[" + si + "]&&dy.sections[" + si + "].items[" + ii + "];return it?JSON.stringify({n:it.name,d:it.detail||''}):JSON.stringify({n:'(none)',d:''});})()");

// ─── PREP ───
if(PART === 'prep' || PART === 'all'){
  for(const t of Object.keys(TREES)) try { fs.unlinkSync(TREES[t]); } catch(e){}
  fs.readdirSync(SCR).filter(f => /^(stored_|chains_|res_|gate_)/.test(f)).forEach(f => fs.unlinkSync(F(f)));
  fs.copyFileSync(BASE227, TREES.V227); fs.copyFileSync(path.join(ROOT, 'index.html'), TREES.V228);
  const s = fs.readFileSync(TREES.V228, 'utf8'); const a = 'detail=/RPE/.test(detail)?_capRpeClamp(detail):detail+INJ_CAP_CUE;'; const n = s.split(a).length - 1;
  P('PREP V227 ' + (fs.readFileSync(TREES.V227, 'utf8').match(/ia-version" content="(\d+)"/) || [])[1] + ' sha ' + sha(TREES.V227) + ' | V228 ' + (s.match(/ia-version" content="(\d+)"/) || [])[1] + ' sha ' + sha(TREES.V228) + ' (working index.html, HEAD ' + cp.execSync('git rev-parse --short HEAD', { cwd:ROOT }).toString().trim() + ') | NOCLAMP anchor count ' + n);
  if(n !== 1) throw new Error('NOCLAMP anchor count ' + n);
  fs.writeFileSync(TREES.NOCLAMP, s.replace(a, 'detail=/RPE/.test(detail)?detail:detail+INJ_CAP_CUE;'));
}
// ─── ENUM (on V228) ───
if(PART === 'enum' || PART === 'all'){
  const X = fresh('V228');
  const fires = (cfg, to, prev) => { if(!capOf(cfg).includes(E(X, '_pattern(' + JSON.stringify(to) + ')') || '-')) return false; X.ctx.__p = prev; X.ctx.__to = to; const pre = E(X, '_swapDetailFor(__to,_stripCapCue(__p))'); return /RPE/.test(pre || '') && E(X, '_capRpeClamp(' + JSON.stringify(pre) + ')') !== pre; };
  for(const ck of Object.keys(CFGS)){ const cfg = CFGS[ck]; setup(X, storedFor('V228', ck)); const chains = []; let id = 0; const st = { two:0, hop2fire1:0, hop2fire2:0, hop3:0 };
    const cand = w => Array.from(E(X, '__cands(__D,' + w + ',__N)')); const can = (si, ii) => !!E(X, '__canSwap(__D,' + si + ',' + ii + ')');
    if(capOf(cfg).length) for(const w of WEEKS) for(const d of DAYS){ const live = E(X, 'activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d); if(!live || !live.sections) continue; const bs = clone(live);
      bs.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.name) return; X.ctx.__D = bs; if(!can(si, ii)) return; X.ctx.__N = it.name; const dA = it.detail || '';
        for(const B of cand(w)){ const d1 = clone(bs); d1.sections[si].items[ii].name = B; X.ctx.__D = d1; if(!can(si, ii)) continue; X.ctx.__N = B; const f1 = fires(cfg, B, dA);
          X.ctx.__p = dA; X.ctx.__to = B; const dB = E(X, '(function(){var x=_swapDetailFor(__to,_stripCapCue(__p));var f=applyInjuryFilter([{label:"x",items:[{name:__to,detail:x}]}],activeProg.cfg);return f&&f[0]&&f[0].items[0]&&f[0].items[0].name===__to?f[0].items[0].detail:x;})()');
          for(const C of cand(w)){ st.two++; const f2 = fires(cfg, C, dB); const cls = C === it.name ? 'cyc2' : 'hop2';
            if(f1){ st.hop2fire1++; chains.push({ id:ck + '#' + id++, cls, fire:'h1', w, d, si, ii, hops:[B, C] }); }
            if(f1 || f2){ // hop3 off a chain whose first or second hop fires
              const d2 = clone(d1); d2.sections[si].items[ii].name = C; X.ctx.__D = d2; if(!can(si, ii)) continue; X.ctx.__N = C;
              if(f2) st.hop2fire2++;
              for(const D of cand(w)){ st.hop3++; chains.push({ id:ck + '#' + id++, cls:'hop3', fire:(f1 ? 'h1' : '') + (f2 ? 'h2' : ''), w, d, si, ii, hops:[B, C, D] }); }
              X.ctx.__D = d1; X.ctx.__N = B; } } } })); }
    fs.writeFileSync(F('chains_' + ck + '.json'), JSON.stringify(chains)); P('ENUM ' + ck.padEnd(13) + ' two-hop chains walked ' + st.two + ' | two-hop with hop1 firing ' + st.hop2fire1 + ' | two-hop with hop2 firing ' + st.hop2fire2 + ' | hop3 kept ' + st.hop3 + ' | total kept ' + chains.length);
  }
}
// ─── CHAINS worker ───
if(process.env.WORKER){
  const [t, ck] = process.env.WORKER.split(':'); const chains = JSON.parse(fs.readFileSync(F('chains_' + ck + '.json'), 'utf8')); const st = storedFor(t, ck);
  const by = {}; chains.forEach(c => (by[c.w + c.d] = by[c.w + c.d] || []).push(c)); const lists = Object.values(by); const nB = Math.max(0, ...lists.map(l => l.length)); const res = [];
  const A = fresh(t), Bt = fresh(t);
  for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); setup(A, st); const r = {};
    for(const c of batch){ const s = r[c.id] = { pre:JSON.parse(slotOf(A, c.w, c.d, c.si, c.ii)), steps:[], unreach:0 };
      for(const to of c.hops){ E(A, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = JSON.parse(slotOf(A, c.w, c.d, c.si, c.ii));
        A.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:cur.n, detail:cur.d }; A.ctx.__to = to; E(A, '__T.length=0;'); try { E(A, '_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ s.unreach++; }
        const after = JSON.parse(slotOf(A, c.w, c.d, c.si, c.ii)); if(clean(after.n) !== clean(to)) s.unreach++; s.steps.push(after.d); s.toast = Array.from(E(A, '__T')).join(' / '); }
      s.live = JSON.parse(slotOf(A, c.w, c.d, c.si, c.ii)); }
    const ls = new Map(A.localStorage._map); Bt.localStorage.clear(); for(const [k, v] of ls) Bt.localStorage.setItem(k, v);
    E(Bt, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");
    for(const c of batch) r[c.id].boot = JSON.parse(slotOf(Bt, c.w, c.d, c.si, c.ii));
    batch.forEach(c => res.push(Object.assign({ id:c.id, ck, cls:c.cls, fire:c.fire, w:c.w, d:c.d, hops:c.hops }, r[c.id]))); }
  // build path: exSwapPrefs as the chain's pref set, one build per distinct pref set
  const X = load(TREES[t]); pin(X); const seen = {};
  for(const c of chains){ const key = JSON.stringify([c.hops]) + '|' + c.w + c.d + c.si + c.ii; void key; }
  const prefSets = {}; chains.forEach(c => { const pre = JSON.parse(st).weeks[c.w][c.d].sections[c.si].items[c.ii]; const names = [pre.name].concat(c.hops); const m = {}; for(let i = 0; i < c.hops.length; i++) m[names[i]] = names[i + 1]; const k = JSON.stringify(m); (prefSets[k] = prefSets[k] || []).push(c.id); });
  const bmap = {}; for(const k of Object.keys(prefSets)){ const cfg = clone(CFGS[ck]); cfg.exSwapPrefs = JSON.parse(k); let p; try { p = X.buildProgram(cfg); } catch(e){ continue; } seen[k] = p; }
  res.forEach(r => { const c = chains.find(x => x.id === r.id); const pre = JSON.parse(st).weeks[c.w][c.d].sections[c.si].items[c.ii]; const names = [pre.name].concat(c.hops); const m = {}; for(let i = 0; i < c.hops.length; i++) m[names[i]] = names[i + 1]; const p = seen[JSON.stringify(m)];
    const it = p && p.weeks[c.w] && p.weeks[c.w][c.d] && p.weeks[c.w][c.d].sections[c.si] && p.weeks[c.w][c.d].sections[c.si].items[c.ii]; r.build = it ? { n:it.name, d:it.detail || '' } : { n:'(none)', d:'' }; });
  fs.writeFileSync(F('res_' + t + '_' + ck + '.json'), JSON.stringify(res)); console.log('worker ' + t + ':' + ck + ' ' + res.length); process.exit(0);
}
if(PART === 'chains' || PART === 'all'){
  const jobs = []; for(const t of ['V227','V228','NOCLAMP']) for(const ck of Object.keys(CFGS)) jobs.push(t + ':' + ck);
  for(const t of ['V227','V228','NOCLAMP']) for(const ck of Object.keys(CFGS)) storedFor(t, ck);
  let i = 0; const t0 = Date.now(); const runOne = j => new Promise(res => { const p = cp.spawn(process.execPath, [__filename], { env:Object.assign({}, process.env, { WORKER:j }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { if(code) console.log('WORKER CRASH ' + j + ' ' + o.slice(-500)); res(); }); });
  (async () => { await Promise.all(Array.from({ length:6 }, async () => { while(i < jobs.length){ await runOne(jobs[i++]); } })); console.log('workers ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s'); })();
}
module.exports = { TREES, CFGS, capOf, F, SCR };
// ─── GATE dump (F2-F4) ───
if(PART === 'gate' || PART === 'all'){
  const gsrc = fs.readFileSync(path.join(ROOT, 'tests', 'gates', 'g221_d177_swapfloor.js'), 'utf8');
  const ED = [["const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));", "const { load, progDigest } = require(" + JSON.stringify(path.join(ROOT, 'tests', 'harness.js')) + ");const __ROWS=[];"],
    ["const ROOT = path.join(__dirname, '..', '..');", "const ROOT = " + JSON.stringify(ROOT) + ";"],
    ["          if(/The load runs out before the reps do here/.test(String(toast))) S.t3++;", "          if(/The load runs out before the reps do here/.test(String(toast))) S.t3++;\n          __ROWS.push({where,k:H.k,hout:H.out||null,isPow,to,from:clean(from),D,O,toast,wantT});"],
    ["console.log('  L1: ' + S.cfgs", "fs.writeFileSync(process.env.GATE_DUMP, JSON.stringify(__ROWS)); fs.writeFileSync(process.env.GATE_DUMP + '.l1', JSON.stringify(L1)); console.log('DUMPED ' + __ROWS.length); process.exit(0);\nconsole.log('  L1: ' + S.cfgs"]];
  let g = gsrc; ED.forEach(([a, b], i) => { const n = g.split(a).length - 1; P('  gate splice ' + (i + 1) + ' anchor count ' + n); if(n !== 1) throw new Error('gate anchor ' + (i + 1) + ' count ' + n); g = g.replace(a, b); });
  const GF = F('gate_g221_dump.js'); fs.writeFileSync(GF, g);
  for(const t of ['V227','V228']){ const dump = F('gate_rows_' + t + '.json'); try { fs.unlinkSync(dump); } catch(e){}
    const o = cp.execFileSync(process.execPath, [GF, TREES[t]], { env:Object.assign({}, process.env, { GATE_DUMP:dump }), maxBuffer:1 << 26 }).toString(); P('  gate ' + t + ': ' + (o.match(/DUMPED \d+/) || ['NO DUMP'])[0]); }
}
// ─── REPORT ───
if(PART === 'report' || PART === 'all'){
  const X = fresh('V228'); const clamp = d => { X.ctx.__d = d; return E(X, '_capRpeClamp(__d)'); };
  const kindOf = d => { d = String(d || ''); if(/^\d+ sets — RPE/.test(d)) return 'bwsets'; if(/@ RPE/.test(d)) return 'grammar@'; if(/^\d+×[\d–]+ — RPE [\d.–]+ \(leave ~/.test(d)) return 'wave'; if(/sets of \d+ to \d+ — RPE/.test(d)) return 'loadCapped'; if(/RPE/.test(d)) return 'prose/other'; return 'no-RPE'; };
  // ── F1 chains ──
  P('\n=== F1 chains where the clamp fires on a non-final hop (D190 lattice, weeks 3/5/7, L9 injured configs)');
  const R = {}; for(const t of ['V227','V228','NOCLAMP']){ R[t] = {}; for(const ck of Object.keys(CFGS)){ const f = F('res_' + t + '_' + ck + '.json'); if(!fs.existsSync(f)){ P('  MISSING ' + t + ':' + ck + ' (failed measurement)'); continue; } JSON.parse(fs.readFileSync(f, 'utf8')).forEach(r => R[t][r.id] = r); } }
  const ids = Object.keys(R.V228); P('  chains ' + ids.length + ' | unreachable at some hop (V228) ' + ids.filter(id => R.V228[id].unreach).length);
  const rows = ids.filter(id => !R.V228[id].unreach && R.V227[id] && !R.V227[id].unreach && R.NOCLAMP[id] && !R.NOCLAMP[id].unreach).map(id => { const a = R.V228[id], b = R.V227[id], n = R.NOCLAMP[id]; const cfg = CFGS[a.ck]; const endN = clean(a.live.n); const endCap = capOf(cfg).includes(E(X, '_pattern(' + JSON.stringify(endN) + ')') || '-');
    const pre = endCap ? clamp(n.live.d) : n.live.d; return { id, ck:a.ck, cls:a.cls, fire:a.fire, w:a.w, d:a.d, hops:a.hops, endCap, l8:a.live.d, b8:a.boot.d, u8:a.build.d, bn8:clean(a.boot.n), un8:clean(a.build.n), l7:b.live.d, b7:b.boot.d, pre, nL:n.live.d, nB:n.boot.d }; });
  const lb = rows.filter(r => r.l8 !== r.b8);
  P('  reachable on all three trees ' + rows.length + ' | V228 live != boot ' + lb.length + ' | V227 live != boot ' + rows.filter(r => r.l7 !== r.b7).length + ' | NOCLAMP live != boot ' + rows.filter(r => r.nL !== r.nB).length);
  P('  V228 live != boot by end ' + fmt(tally(lb, r => r.endCap ? 'end capped' : 'end uncapped')) + ' | by class ' + fmt(tally(lb, r => r.cls + '/' + r.fire)) + ' | by config ' + fmt(tally(lb, r => r.ck)) + ' | by week ' + fmt(tally(lb, r => 'W' + r.w)));
  P('  which side equals the pre-clamp carry (PRECARRY): live ' + lb.filter(r => r.l8 === r.pre).length + ' | boot ' + lb.filter(r => r.b8 === r.pre).length + ' | neither ' + lb.filter(r => r.l8 !== r.pre && r.b8 !== r.pre).length + ' /' + lb.length);
  P('  live shape -> boot shape ' + fmt(tally(lb, r => kindOf(r.l8) + ' RPE ' + rpeMax(r.l8) + ' -> ' + kindOf(r.b8) + ' RPE ' + rpeMax(r.b8))));
  P('  all reachable chains, V228 live vs PRECARRY: equal ' + rows.filter(r => r.l8 === r.pre).length + ' | V228 boot vs PRECARRY: equal ' + rows.filter(r => r.b8 === r.pre).length + ' /' + rows.length);
  P('  build (exSwapPrefs map A>B>C(>D)): build slot name == chain end ' + rows.filter(r => r.un8 === clean(r.hops[r.hops.length - 1])).length + '/' + rows.length + ' | build name ' + fmt(tally(rows, r => r.un8 === clean(r.hops[r.hops.length - 1]) ? 'end' : r.un8 === clean(r.hops[0]) ? 'first hop only' : 'other')) + ' | where the end landed, build == boot ' + rows.filter(r => r.un8 === clean(r.hops[r.hops.length - 1]) && r.u8 === r.b8).length + ' build == live ' + rows.filter(r => r.un8 === clean(r.hops[r.hops.length - 1]) && r.u8 === r.l8).length);
  const nw = lb.filter(r => r.l7 === r.b7), pre7 = lb.filter(r => r.l7 !== r.b7);
  P('  NEW residue (V227 live == boot, V228 live != boot) ' + nw.length + ' | pre-existing (V227 live != boot too) ' + pre7.length + ' | V227 residue that V228 closed ' + rows.filter(r => r.l7 !== r.b7 && r.l8 === r.b8).length);
  P('  NEW by end ' + fmt(tally(nw, r => r.endCap ? 'end capped' : 'end uncapped')) + ' | NEW boot == PRECARRY ' + nw.filter(r => r.b8 === r.pre).length + ' live == PRECARRY ' + nw.filter(r => r.l8 === r.pre).length + ' | NEW live == V227 live ' + nw.filter(r => r.l8 === r.l7).length + ' boot == V227 boot ' + nw.filter(r => r.b8 === r.b7).length + ' (literal-blind: ' + nw.filter(r => r.b8.replace(NEW, OLD) === r.b7).length + ')');
  P('  NEW live shape -> boot shape ' + fmt(tally(nw, r => (r.endCap ? 'cap ' : 'uncap ') + kindOf(r.l8) + ' RPE ' + rpeMax(r.l8) + ' -> ' + kindOf(r.b8) + ' RPE ' + rpeMax(r.b8))));
  P('  NEW by class/fire ' + fmt(tally(nw, r => r.cls + '/' + r.fire)) + ' | by config ' + fmt(tally(nw, r => r.ck)));
  P('  pre-existing (V227 already live != boot) V228 shape ' + fmt(tally(pre7, r => (r.endCap ? 'cap ' : 'uncap ') + kindOf(r.l8) + ' -> ' + kindOf(r.b8))));
  P('  NEW end capped (both sides should be clamped): ' + fmt(tally(nw.filter(r => r.endCap), r => JSON.stringify(shapeKey(r.l8)) + ' vs ' + JSON.stringify(shapeKey(r.b8)))));
  const ex = {}; lb.forEach(r => { const k = (r.endCap ? 'cap' : 'uncap') + '|' + kindOf(r.l8) + '|' + kindOf(r.b8); if(!ex[k]) ex[k] = r; });
  Object.values(ex).forEach(r => P('    e.g. ' + r.ck + ' W' + r.w + ' ' + r.d + ' ' + r.cls + '/' + r.fire + ' ' + r.hops.join(' > ') + ' end ' + (r.endCap ? 'capped' : 'uncapped') + '\n       live ' + JSON.stringify(r.l8) + '\n       boot ' + JSON.stringify(r.b8) + '\n       build ' + JSON.stringify(r.u8) + ' (' + r.un8 + ')\n       pre-clamp carry ' + JSON.stringify(r.pre) + ' | V227 live ' + JSON.stringify(r.l7) + ' boot ' + JSON.stringify(r.b7)));
  // ── F2-F4 gate rows ──
  const A7 = JSON.parse(fs.readFileSync(F('gate_rows_V227.json'), 'utf8')), A8 = JSON.parse(fs.readFileSync(F('gate_rows_V228.json'), 'utf8'));
  P('\n=== F2-F4 the D177 gate L1 sweep, row dump V227 ' + A7.length + ' / V228 ' + A8.length + ' rows | joined by position, (where,to,D) equal ' + A8.filter((r, i) => A7[i] && A7[i].where === r.where && A7[i].D === r.D).length);
  const gs = fs.readFileSync(path.join(ROOT, 'tests', 'gates', 'g221_d177_swapfloor.js'), 'utf8'); const REP = gs.split('\n').filter(l => /^const (REP_TOKEN|stripRep)\b/.test(l)).join('\n'); const { stripRep } = new Function(REP + '\nreturn { stripRep };')();
  const oldBlind = s => (typeof s === 'string' && s.endsWith(OLD)) ? s.slice(0, -OLD.length) : s;
  const capT = r => { const m = /\|(\w+)\/(\w+) W/.exec(r.where); return m ? (CAP[m[1]] && CAP[m[1]][m[2]] || []).includes(E(X, '_pattern(' + JSON.stringify(r.to) + ')') || '-') : false; };
  const cOf = (b, a, r) => { if(a === b) return 'same'; if(typeof b === 'string' && b.endsWith(OLD) && a === b.slice(0, -OLD.length) + NEW) return 'literal'; if(r && capT(r) && a === clamp(b)) return 'clamp ' + kindOf(b); return 'UNCLASSIFIED'; };
  const J = A8.map((r, i) => { const b = A7[i]; let cls = 'same'; if(r.O !== b.O){ if(typeof b.O === 'string' && b.O.endsWith(OLD) && r.O === b.O.slice(0, -OLD.length) + NEW) cls = 'literal'; else if(capT(r) && r.O === clamp(b.O)) cls = 'clamp ' + kindOf(b.O); else cls = 'UNCLASSIFIED'; } const dcls = cOf(b.D, r.D, Object.assign({}, r, { to:r.from })); if(r.D !== b.D){ cls = (r.O === b.O ? 'O same' : r.O === r.D && b.O === b.D ? 'O verbatim both' : cOf(b.O, r.O, r)); } return Object.assign({}, r, { O7:b.O, D7:b.D, t7:b.toast, w7:b.wantT, cls, dcls, capT:capT(r) }); });
  const capF = r => { const m = /\|(\w+)\/(\w+) W/.exec(r.where); return m ? (CAP[m[1]] && CAP[m[1]][m[2]] || []).includes(E(X, '_pattern(' + JSON.stringify(r.from) + ')') || '-') : false; };
  const dch = J.filter(r => r.D !== r.D7); P('  rows whose DONOR changed between trees (build-path change on the native card) ' + dch.length + ' | donor change class (donor pattern capped ' + dch.filter(capF).length + ') ' + fmt(tally(dch, r => r.dcls + ' ' + kindOf(r.D7))) + ' | card result ' + fmt(tally(dch, r => r.cls)));
  P('  rows with the same donor: changed ' + fmt(tally(J.filter(r => r.D === r.D7 && r.cls !== 'same'), r => r.cls)) + ' | clamp rows on an uncapped target ' + J.filter(r => /^clamp/.test(r.cls) && !r.capT).length);
  J.filter(r => r.cls === 'UNCLASSIFIED' || /UNCLASS/.test(r.dcls) && r.D !== r.D7).slice(0, 20).forEach(r => P('    UNCLASSIFIED ' + r.where + ' :: ' + r.D + ' | V227 ' + r.O7 + ' | V228 ' + r.O));
  const fails = { G3a:r => !r.isPow && r.k !== 'zero' && r.O !== r.D && stripRep(r.O) !== stripRep(r.D), G3c_pow:r => r.isPow && r.k !== 'zero' && oldBlind(r.O) !== oldBlind(r.D), G3c_off:r => !r.isPow && r.k === 'offgram' && oldBlind(r.O) !== oldBlind(r.D), G3d:r => !r.isPow && r.k === 'atfloor' && r.O !== r.D, G3e:r => !r.isPow && r.k === 'null' && r.O !== r.D, G3f:r => !r.isPow && r.k === 'win' && r.O !== r.hout, G6a:r => r.toast !== r.wantT };
  const pop = { G3a:r => !r.isPow && r.k !== 'zero', G3c_pow:r => r.isPow && r.k !== 'zero', G3c_off:r => !r.isPow && r.k === 'offgram', G3d:r => !r.isPow && r.k === 'atfloor', G3e:r => !r.isPow && r.k === 'null', G3f:r => !r.isPow && r.k === 'win', G6a:r => true };
  for(const [g, f] of Object.entries(fails)){ const pp = J.filter(pop[g]); const ff = pp.filter(f); const was = pp.filter(r => f(Object.assign({}, r, { O:r.O7, D:r.D7, toast:r.t7, wantT:r.w7 })));
    P('  ' + g.padEnd(8) + ' fail V228 ' + ff.length + '/' + pp.length + ' (V227 ' + was.length + ') | by class ' + fmt(tally(ff, r => (r.D !== r.D7 ? 'donor ' + r.dcls + ' / ' : '') + r.cls + (r.capT ? ' [capped target]' : ' [UNCAPPED target]'))) + ' | by D shape ' + fmt(tally(ff, r => kindOf(r.D)))); }
  // F2 prose
  const prose = J.filter(r => kindOf(r.D) === 'prose/other' && rpeMax(r.D) > 7 && r.capT);
  P('\n  F2 prose/other RPE>7 donors onto capped targets (gate L1, live): ' + prose.length + ' rows | distinct donor texts ' + new Set(prose.map(r => r.D)).size + ' | V228 changed ' + prose.filter(r => r.O !== r.O7).length);
  const pd = {}; prose.forEach(r => { const k = r.D.replace(/^\d+/, 'N'); (pd[k] = pd[k] || { n:0, ex:r }).n++; });
  Object.entries(pd).forEach(([k, v]) => P('    [' + v.n + '] ' + v.ex.where + '\n       D/V227 ' + JSON.stringify(v.ex.O7) + '\n       V228   ' + JSON.stringify(v.ex.O)));
  { const L1 = JSON.parse(fs.readFileSync(F('gate_rows_V228.json.l1'), 'utf8')); const X7 = load(TREES.V227), X8 = load(TREES.V228); pin(X7); pin(X8); const bd = [];
    for(const cfg of L1){ if(!cfg.injury) continue; let a, b; try { a = X7.buildProgram(clone(cfg)); b = X8.buildProgram(clone(cfg)); } catch(e){ bd.push({ crash:e.message }); continue; } const tag = [cfg.equipment, cfg.liftingFocus, cfg.experience, cfg.primaryPath, cfg.injury.region + '/' + cfg.injury.tier].join('|');
      Object.keys(a.weeks).forEach(w => Object.keys(a.weeks[w]).forEach(d => { const A = a.weeks[w][d], B = b.weeks[w] && b.weeks[w][d]; ((A && A.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { const jt = B && B.sections[si] && B.sections[si].items[ii]; if(!it || !jt) { if(it || jt) bd.push({ tag, w, d, cls:'STRUCT' }); return; } if(it.name === jt.name && it.detail === jt.detail) return;
        const r = { where:tag + ' W' + w, to:clean(it.name) }; const k = it.name !== jt.name ? 'NAME' : cOf(it.detail || '', jt.detail || '', r); bd.push({ tag, w, d, n:clean(it.name), label:clean(s.label), cls:k, a:it.detail, b:jt.detail }); })); })); }
    P('\n  F2b BUILD path on the gate L1 injured configs (' + L1.filter(c => c.injury).length + ' builds): changed cards ' + bd.length + ' | ' + fmt(tally(bd, x => x.cls)) + ' | by focus ' + fmt(tally(bd.filter(x => /clamp/.test(x.cls)), x => x.tag.split('|')[1])));
    const pp2 = {}; bd.filter(x => /clamp/.test(x.cls)).forEach(x => { const k = x.cls + ' :: ' + String(x.a).replace(/^\d+/, 'N').replace(/×\d+(–\d+)?/, '×R'); (pp2[k] = pp2[k] || { n:0, x }).n++; });
    Object.entries(pp2).forEach(([k, v]) => P('    [' + v.n + '] ' + v.x.tag + ' W' + v.x.w + ' ' + v.x.d + ' [' + v.x.label + '] ' + v.x.n + '\n       V227 ' + JSON.stringify(v.x.a) + '\n       V228 ' + JSON.stringify(v.x.b)));
    bd.filter(x => !/clamp|literal/.test(x.cls)).slice(0, 10).forEach(x => P('    NON-CLAMP ' + JSON.stringify(x))); }
  // F4 toasts
  const cl = J.filter(r => /^clamp/.test(r.cls)); const tk = s => /The load runs out/.test(s) ? 'T3 "Same sets, same effort. Reps move…"' : /No load to add here/.test(s) ? 'T119 "…take the sets to the same effort."' : /Same job, same numbers/.test(s) ? 'TSAME "Same job, same numbers."' : 'other: ' + s;
  P('\n  F4 toasts on rows whose card the clamp changed: ' + cl.length + ' | by toast ' + fmt(tally(cl, r => tk(r.toast))) + ' | RPE donor -> card ' + fmt(tally(cl, r => rpeMax(r.D) + '->' + rpeMax(r.O))) + ' | G6a-failing among them ' + cl.filter(r => r.toast !== r.wantT).length + ' | G6a-failing not clamp rows ' + J.filter(r => r.toast !== r.wantT && !/^clamp/.test(r.cls)).length);
  fs.writeFileSync(F('carry_report.txt'), out.join('\n') + '\n');
}
