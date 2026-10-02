// v228_caprpe_cf2.js — MEASURE (read-only). D193 Amendment 2 pre-builder measures M4-M7 on a CF copy of the working
// tree (V227 + slices 1+2, ia-version 228) carrying R3 (kept pre-hold dose at the live tap), R7 (held test text),
// R8 (hold toasts). The surgery below is MEASURE's reading of the ruling, written only to print the after-picture.
//   SCR=<scratch>/cf2 CARRY=<scratch>/carry PART=<prep|chains|gate|report|all> node tests/measure/v228_caprpe_cf2.js
// Reuses v228_caprpe_carry.js artifacts in CARRY: chains_*.json (the 18,580 chains), res_V227/NOCLAMP_*.json,
// gate_g221_dump.js (the D177 gate's L1 sweep with a row dump spliced in) and gate_rows_V227/V228.json.
// Oracles: the ruling's exact strings (R7, R8), a hand RPE parse of donor and card, V227 and slices 1+2 as baselines,
// the pre-hold carry from the NOCLAMP tree (carry script).
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures, progDigest } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR, CARRY = process.env.CARRY; if(!SCR || !CARRY) throw new Error('SCR/CARRY unset'); const F = n => path.join(SCR, n), C = n => path.join(CARRY, n);
const PART = process.env.PART || 'all';
const TREES = { V227:C('t_v227.html'), V228:C('t_v228.html'), CF2:F('t_cf2.html') };
const OLD = ' — hold RPE 7, two in the tank', NEW = ' — hold RPE 7, three in the tank';
const TEST9 = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const R7T = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const HOLD = ' Your injury plan holds this one at RPE 7.';
const START = '2026-08-24', CLOCK = '2026-09-24';
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const withInj = inj => { const c = clone(MARIO); if(inj) c.injury = inj; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), manny:clone(fixtures.HALF_MANNY), mario_noinj:withInj(null), knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }), lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
const INJ = Object.keys(CFGS).filter(c => CFGS[c].injury);
const CAP = { knee:{ workaround:['squat','lunge','leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat','lunge'], protect:['squat'] }, hip:{ workaround:['hinge','lunge','hip_ext','squat'], protect:['squat'] }, lowback:{ workaround:['hinge','squat','row','hip_ext'], protect:['squat','hip_ext'] }, shoulder:{ workaround:['hpress','vpress','delt_iso'], protect:[] }, elbow:{ workaround:['hpress','tri_iso','bi_iso','row','vpull'], protect:['row','vpull'] } };
const capOf = c => c && c.injury ? CAP[c.injury.region][c.injury.tier] : [];
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const rpeMax = d => { const v = [...String(d || '').matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)); return v.length ? Math.max(...v) : null; };
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12);
const out = []; const P = s => { out.push(s); console.log(s); };
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};bumpSwapCount=function(){return false;};";
function fresh(t){ const X = load(TREES[t]); pin(X); E(X, HELP); return X; }
function setup(IA, st){ IA.localStorage.clear(); IA.ctx.__SP = JSON.parse(st); E(IA, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function storedFor(t, ck){ const f = t === 'CF2' ? F('stored_CF2_' + ck + '.json') : C('stored_' + t + '_' + ck + '.json'); if(fs.existsSync(f)) return fs.readFileSync(f, 'utf8'); const X = load(TREES[t]); pin(X); const p = X.buildProgram(clone(CFGS[ck])); const s = clone(p); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); const j = JSON.stringify(s); fs.writeFileSync(f, j); return j; }
const slotOf = (IA, w, d, si, ii) => JSON.parse(E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";var it=dy&&dy.sections[" + si + "]&&dy.sections[" + si + "].items[" + ii + "];return it?JSON.stringify({n:it.name,d:it.detail||''}):JSON.stringify({n:'(none)',d:''});})()"));

// ─── PREP: CF2 surgery on the working tree ───
if(PART === 'prep' || PART === 'all'){
  try { fs.unlinkSync(TREES.CF2); } catch(e){}
  fs.readdirSync(SCR).filter(f => /^(stored_|res_|gate_rows_)/.test(f)).forEach(f => fs.unlinkSync(F(f)));
  const wt = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  P('PREP working index.html ia-version ' + (wt.match(/ia-version" content="(\d+)"/) || [])[1] + ' sha ' + sha(path.join(ROOT, 'index.html')) + ' | carry V228 copy sha ' + sha(TREES.V228) + ' (equal: ' + (sha(path.join(ROOT, 'index.html')) === sha(TREES.V228)) + ') | V227 sha ' + sha(TREES.V227));
  const ED = [
    ['R7 fifth shape in _capRpeClamp', "function _capRpeClamp(d){\n  if(typeof d!=='string') return d;\n",
     "function _capRpeClamp(d){\n  if(typeof d!=='string') return d;\n  if(/^Work up to one heavy set of 3 to 5 reps at RPE [\\d.]+\\. Technique stays crisp\\. No grinding\\. Log the weight and the reps\\. That set is your new baseline\\.$/.test(d)) return " + JSON.stringify(R7T).replace(/"/g, "'") + ";\n"],
    ['R3 carry from the kept pre-hold dose', "  const _base=_stripCapCue(_wasDetail);\n", "  const _base=_stripCapCue((typeof item._preHold==='string')?item._preHold:_wasDetail);\n"],
    ['R3 keep the dose + R8 detect the hold', "      if(_fi&&_fi.name===to) item.detail=_fi.detail;\n    }catch(e){}\n  }\n",
     "      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_fi.detail; }\n    }catch(e){}\n  }\n  item._preHold=_preF;\n"],
    ['R3 _preF captured before the re-filter', "  const _reRx=(item.detail!==_base);\n  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    try{\n      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);",
     "  const _reRx=(item.detail!==_base);\n  const _preF=item.detail; let _held=false;\n  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    try{\n      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);"],
    ['R8 hold toasts', "  showToast(_rx.win\n", "  showToast(_held\n    ? (_rx.win ? to+' in, '+from.toLowerCase()+' out. The load runs out before the reps do here. Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'." + HOLD + "'\n       : _reRx ? to+' in, '+from.toLowerCase()+' out. No load to add here." + HOLD + "'\n       : to+' in, '+from.toLowerCase()+' out. Same sets, same reps." + HOLD + "')\n    : _rx.win\n"],
    ['R3 undo drops the kept dose of the restored item', "      if(it){it.detail=p.d;_put.push(it);}\n", "      if(it){it.detail=p.d;delete it._preHold;_put.push(it);}\n"]];
  let s = wt; ED.forEach(([nm, a, b]) => { const n = s.split(a).length - 1; P('  anchor [' + nm + '] count ' + n); if(n !== 1) throw new Error('anchor ' + nm + ' count ' + n); s = s.replace(a, b); });
  fs.writeFileSync(TREES.CF2, s); P('  CF2 written sha ' + sha(TREES.CF2));
  const X = load(TREES.CF2); P('  CF2 boots: ia-version ' + X.version + ' | _capRpeClamp(TEST9) === R7 text: ' + (E(X, '_capRpeClamp(' + JSON.stringify(TEST9) + ')') === R7T));
}
// ─── CHAINS worker (per hop: card + toast; boot; build; undo of the last hop) ───
if(process.env.WORKER){
  const [t, ck] = process.env.WORKER.split(':'); const chains = JSON.parse(fs.readFileSync(C('chains_' + ck + '.json'), 'utf8')); const st = storedFor(t, ck);
  const by = {}; chains.forEach(c => (by[c.w + c.d] = by[c.w + c.d] || []).push(c)); const lists = Object.values(by); const nB = Math.max(0, ...lists.map(l => l.length)); const res = [];
  const A = fresh(t), Bt = fresh(t), U = fresh(t);
  for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); setup(A, st); const r = {};
    for(const c of batch){ const s = r[c.id] = { steps:[], toasts:[], unreach:0 };
      for(const to of c.hops){ E(A, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(A, c.w, c.d, c.si, c.ii);
        A.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:cur.n, detail:cur.d }; A.ctx.__to = to; E(A, '__T.length=0;'); try { E(A, '_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ s.unreach++; }
        const after = slotOf(A, c.w, c.d, c.si, c.ii); if(clean(after.n) !== clean(to)) s.unreach++; s.steps.push(after.d); s.toasts.push(Array.from(E(A, '__T')).join(' / ')); }
      s.live = slotOf(A, c.w, c.d, c.si, c.ii); }
    const ls = new Map(A.localStorage._map); Bt.localStorage.clear(); for(const [k, v] of ls) Bt.localStorage.setItem(k, v);
    E(Bt, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");
    for(const c of batch) r[c.id].boot = slotOf(Bt, c.w, c.d, c.si, c.ii);
    // undo the last hop on the live page (chip = swapOriginOf), then read the slot live and after a boot
    for(const c of batch){ E(A, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const chip = E(A, 'swapOriginOf(' + JSON.stringify(r[c.id].live.n) + ')') || ''; r[c.id].chip = chip;
      if(chip){ try { E(A, 'undoSwap(' + JSON.stringify(chip) + ');'); } catch(e){ r[c.id].undoErr = e.message; } } r[c.id].undo = slotOf(A, c.w, c.d, c.si, c.ii); }
    const ls2 = new Map(A.localStorage._map); U.localStorage.clear(); for(const [k, v] of ls2) U.localStorage.setItem(k, v);
    E(U, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");
    for(const c of batch) r[c.id].undoBoot = slotOf(U, c.w, c.d, c.si, c.ii);
    batch.forEach(c => res.push(Object.assign({ id:c.id, ck, cls:c.cls, fire:c.fire, w:c.w, d:c.d, si:c.si, ii:c.ii, hops:c.hops }, r[c.id]))); }
  const X = load(TREES[t]); pin(X); const cache = {};
  res.forEach(r => { const pre = JSON.parse(st).weeks[r.w][r.d].sections[r.si].items[r.ii]; const names = [pre.name].concat(r.hops); const m = {}; for(let i = 0; i < r.hops.length; i++) m[names[i]] = names[i + 1]; const k = JSON.stringify(m);
    if(!(k in cache)){ const cfg = clone(CFGS[ck]); cfg.exSwapPrefs = m; try { cache[k] = X.buildProgram(cfg); } catch(e){ cache[k] = null; } } const p = cache[k];
    const it = p && p.weeks[r.w] && p.weeks[r.w][r.d] && p.weeks[r.w][r.d].sections[r.si] && p.weeks[r.w][r.d].sections[r.si].items[r.ii]; r.build = it ? { n:it.name, d:it.detail || '' } : { n:'(none)', d:'' }; });
  fs.writeFileSync(F('res_' + t + '_' + ck + '.json'), JSON.stringify(res)); console.log('worker ' + t + ':' + ck + ' ' + res.length); process.exit(0);
}
if(PART === 'chains' || PART === 'all'){
  const jobs = []; for(const t of ['V228','CF2']) for(const ck of INJ) jobs.push(t + ':' + ck);
  for(const t of ['V228','CF2']) for(const ck of INJ) storedFor(t, ck);
  let i = 0; const runOne = j => new Promise(res => { const p = cp.spawn(process.execPath, [__filename], { env:Object.assign({}, process.env, { WORKER:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { console.log(code ? 'WORKER CRASH ' + j + ' ' + o.slice(-600) : o.trim()); res(); }); });
  (async () => { await Promise.all(Array.from({ length:6 }, async () => { while(i < jobs.length){ await runOne(jobs[i++]); } })); console.log('chains done'); })();
}
// ─── GATE dump on CF2 ───
if(PART === 'gate'){
  const dump = F('gate_rows_CF2.json'); try { fs.unlinkSync(dump); } catch(e){}
  const o = cp.execFileSync(process.execPath, [C('gate_g221_dump.js'), TREES.CF2], { env:Object.assign({}, process.env, { GATE_DUMP:dump }), maxBuffer:1 << 26 }).toString(); console.log('gate CF2 ' + (o.match(/DUMPED \d+/) || ['NO DUMP'])[0]);
}
// ─── REPORT ───
if(PART === 'report'){
  const X = fresh('CF2'); const patOf = n => E(X, '_pattern(' + JSON.stringify(clean(n)) + ')') || '-';
  P('\n=== M4 the R3 carry on the D190 lattice chains (18,580; L9 injured configs, weeks 3/5/7)');
  const R = { V227:{}, V228:{}, CF2:{}, NOC:{} };
  for(const ck of INJ){ for(const [t, f] of [['V227', C('res_V227_' + ck + '.json')], ['NOC', C('res_NOCLAMP_' + ck + '.json')], ['V228', F('res_V228_' + ck + '.json')], ['CF2', F('res_CF2_' + ck + '.json')]]){ if(!fs.existsSync(f)){ P('  MISSING ' + f + ' (failed measurement)'); continue; } JSON.parse(fs.readFileSync(f, 'utf8')).forEach(r => R[t][r.id] = r); } }
  const ids = Object.keys(R.CF2).filter(id => R.V227[id] && R.V228[id] && R.NOC[id]); P('  chains on all four ' + ids.length + ' | unreachable CF2 ' + ids.filter(id => R.CF2[id].unreach).length + ' V228 ' + ids.filter(id => R.V228[id].unreach).length);
  const v227res = new Set(ids.filter(id => R.V227[id].live.d !== R.V227[id].boot.d)), cfres = new Set(ids.filter(id => R.CF2[id].live.d !== R.CF2[id].boot.d || R.CF2[id].live.n !== R.CF2[id].boot.n));
  const same = [...cfres].filter(id => v227res.has(id)).length;
  P('  live != boot: V227 ' + v227res.size + ' | V228 slices 1+2 ' + ids.filter(id => R.V228[id].live.d !== R.V228[id].boot.d).length + ' | CF2 ' + cfres.size + ' | CF2 residue chain ids == V227 residue ids: ' + (same === v227res.size && same === cfres.size) + ' (in both ' + same + ', CF2 only ' + [...cfres].filter(id => !v227res.has(id)).length + ', V227 only ' + [...v227res].filter(id => !cfres.has(id)).length + ')');
  [...cfres].filter(id => !v227res.has(id)).slice(0, 5).forEach(id => { const r = R.CF2[id]; P('    CF2-only ' + id + ' ' + r.hops.join(' > ') + ' live ' + JSON.stringify(r.live.d) + ' boot ' + JSON.stringify(r.boot.d)); });
  const endCap = id => capOf(CFGS[R.CF2[id].ck]).includes(patOf(R.CF2[id].live.n));
  const preC = id => { const n = R.NOC[id].live.d; if(!endCap(id)) return n; X.ctx.__d = n; return E(X, '_capRpeClamp(__d)'); };
  const unc = ids.filter(id => !endCap(id)), capd = ids.filter(endCap);
  P('  pre-hold carry (NOCLAMP live end, clamped when the end is capped): CF2 live equal ' + ids.filter(id => R.CF2[id].live.d === preC(id)).length + '/' + ids.length + ' (V228 ' + ids.filter(id => R.V228[id].live.d === preC(id)).length + ') | uncapped ends ' + unc.filter(id => R.CF2[id].live.d === preC(id)).length + '/' + unc.length + ' | capped ends ' + capd.filter(id => R.CF2[id].live.d === preC(id)).length + '/' + capd.length + ' | CF2 boot equal ' + ids.filter(id => R.CF2[id].boot.d === preC(id)).length + '/' + ids.length + ' | CF2 live-or-boot == pre-hold on non-residue ' + ids.filter(id => !v227res.has(id) && R.CF2[id].live.d === preC(id)).length + '/' + ids.filter(id => !v227res.has(id)).length);
  ids.filter(id => !v227res.has(id) && R.CF2[id].live.d !== preC(id)).slice(0, 5).forEach(id => { const r = R.CF2[id]; P('    pre-hold miss ' + id + ' ' + r.hops.join(' > ') + ' CF2 live ' + JSON.stringify(r.live.d) + ' pre-hold ' + JSON.stringify(preC(id)) + ' end ' + (endCap(id) ? 'capped' : 'uncapped')); });
  P('  boot vs slices 1+2 byte-identical ' + ids.filter(id => R.CF2[id].boot.d === R.V228[id].boot.d && R.CF2[id].boot.n === R.V228[id].boot.n).length + '/' + ids.length + ' | build vs slices 1+2 ' + ids.filter(id => R.CF2[id].build.d === R.V228[id].build.d && R.CF2[id].build.n === R.V228[id].build.n).length + '/' + ids.length);
  P('  undo (live slot after undoing the last hop) vs slices 1+2 ' + ids.filter(id => JSON.stringify(R.CF2[id].undo) === JSON.stringify(R.V228[id].undo)).length + '/' + ids.length + ' | undo then boot vs slices 1+2 ' + ids.filter(id => JSON.stringify(R.CF2[id].undoBoot) === JSON.stringify(R.V228[id].undoBoot)).length + '/' + ids.length + ' | chips equal ' + ids.filter(id => R.CF2[id].chip === R.V228[id].chip).length);
  ids.filter(id => JSON.stringify(R.CF2[id].undo) !== JSON.stringify(R.V228[id].undo)).slice(0, 5).forEach(id => P('    undo differs ' + id + ' ' + R.CF2[id].hops.join(' > ') + ' CF2 ' + JSON.stringify(R.CF2[id].undo) + ' V228 ' + JSON.stringify(R.V228[id].undo)));
  { const restores = t => ids.filter(id => { const r = R[t][id]; const prev = r.steps.length > 1 ? r.steps[r.steps.length - 2] : null; return prev !== null && r.undo.d === prev; }).length;
    const dif = ids.filter(id => JSON.stringify(R.CF2[id].undo) !== JSON.stringify(R.V228[id].undo));
    P('  undo restores the card as it stood before the last hop: CF2 ' + restores('CF2') + '/' + ids.length + ' | V228 ' + restores('V228') + '/' + ids.length + ' | of the ' + dif.length + ' undo differences, the pre-last-hop card also differs between trees ' + dif.filter(id => R.CF2[id].steps[R.CF2[id].steps.length - 2] !== R.V228[id].steps[R.V228[id].steps.length - 2]).length);
    P('  of the CF2 live changes, inside the V227 residue ' + ids.filter(id => R.CF2[id].live.d !== R.V228[id].live.d && v227res.has(id)).length + ' | outside ' + ids.filter(id => R.CF2[id].live.d !== R.V228[id].live.d && !v227res.has(id)).length); }
  P('  live CF2 vs slices 1+2 changed ' + ids.filter(id => R.CF2[id].live.d !== R.V228[id].live.d).length + ' (expected the 5,840) | of them uncapped end ' + ids.filter(id => R.CF2[id].live.d !== R.V228[id].live.d && !endCap(id)).length + ' | toasts changed on some hop ' + ids.filter(id => JSON.stringify(R.CF2[id].toasts) !== JSON.stringify(R.V228[id].toasts)).length + ' | CF2 hold toasts on hops ' + ids.reduce((a, id) => a + R.CF2[id].toasts.filter(t => t.endsWith(HOLD)).length, 0));
  const MC = ids.filter(id => R.CF2[id].ck === 'mario' && R.CF2[id].w === 5 && R.CF2[id].d === 'thu' && R.CF2[id].hops.join('>') === 'Barbell hip thrust>Leg extension>Barbell good mornings');
  MC.forEach(id => { const r = R.CF2[id]; P('  mario W5 thu ' + id + ' Single-leg hip thrust > ' + r.hops.join(' > ') + '\n    CF2 hop1 ' + JSON.stringify(r.steps[0]) + ' | ' + r.toasts[0] + '\n    CF2 hop2 ' + JSON.stringify(r.steps[1]) + ' | ' + r.toasts[1] + '\n    CF2 hop3 ' + JSON.stringify(r.steps[2]) + ' | ' + r.toasts[2] + '\n    CF2 boot ' + JSON.stringify(r.boot.d) + ' | build ' + JSON.stringify(r.build.d) + ' (' + clean(r.build.n) + ') | V228 live ' + JSON.stringify(R.V228[id].live.d)); });
  if(!MC.length) P('  mario W5 thu chain NOT FOUND in the lattice (failed measurement for that row)');
  { const Y = fresh('CF2'); setup(Y, storedFor('CF2', 'mario')); const day = E(Y, 'activeProg.weeks[5].thu'); let si = -1, ii = -1; day.sections.forEach((s, a) => (s.items || []).forEach((it, b) => { if(clean(it.name) === 'Single-leg hip thrust' && si < 0){ si = a; ii = b; } }));
    E(Y, "currentWeek=5;currentDayKey='thu';"); const cur = slotOf(Y, 5, 'thu', si, ii); Y.ctx.__c = { secIdx:si, itemIdx:ii, name:cur.n, detail:cur.d }; E(Y, "__T.length=0;_swapCtx=__c;applySwapChoice('Barbell good mornings');");
    P('  DIRECT one hop Single-leg hip thrust ' + JSON.stringify(cur.d) + ' -> Barbell good mornings ' + JSON.stringify(slotOf(Y, 5, 'thu', si, ii).d) + ' | ' + Array.from(E(Y, '__T')).join(' / ')); }
  // ── M5 toasts on the D177 L1 sweep ──
  P('\n=== M5 toasts, D177 gate L1 sweep (row dumps V227 / V228 / CF2 joined by position)');
  const G7 = JSON.parse(fs.readFileSync(C('gate_rows_V227.json'), 'utf8')), G8 = JSON.parse(fs.readFileSync(C('gate_rows_V228.json'), 'utf8')), G9 = JSON.parse(fs.readFileSync(F('gate_rows_CF2.json'), 'utf8'));
  P('  rows V227 ' + G7.length + ' V228 ' + G8.length + ' CF2 ' + G9.length + ' | (where,to) aligned ' + G9.filter((r, i) => G8[i] && G8[i].where === r.where && G8[i].to === r.to && G7[i].where === r.where).length);
  const capT = r => { const m = /\|(\w+)\/(\w+) W/.exec(r.where); return m ? (CAP[m[1]] && CAP[m[1]][m[2]] || []).includes(patOf(r.to)) : false; };
  const strip = d => String(d || '').replace(/ — hold RPE 7, (two|three) in the tank$/, '');
  const clampPair = r => capT(r) && rpeMax(strip(r.D)) !== null && rpeMax(r.O) !== null && rpeMax(r.O) !== rpeMax(strip(r.D)); // hand parse: the card's RPE differs from the RPE the donor named
  const claims = t => /same numbers|same effort/i.test(String(t));
  const J = G9.map((r, i) => Object.assign({}, r, { b8:G8[i], b7:G7[i], clamp:clampPair(r) }));
  const cl = J.filter(r => r.clamp);
  const want = r => { const to = r.to, from = r.from.toLowerCase(); if(/The load runs out/.test(r.b8.toast)){ const m = /Reps move to (\d+) to (\d+)\./.exec(r.b8.toast); return to + ' in, ' + from + ' out. The load runs out before the reps do here. Reps move to ' + m[1] + ' to ' + m[2] + '.' + HOLD; }
    if(/No load to add here/.test(r.b8.toast)) return to + ' in, ' + from + ' out. No load to add here.' + HOLD; return to + ' in, ' + from + ' out. Same sets, same reps.' + HOLD; };
  P('  clamp pairs (capped target, card RPE != donor RPE by hand parse): CF2 ' + cl.length + ' | V228 ' + J.filter(r => clampPair(r.b8)).length + ' | false effort/numbers claims: CF2 ' + cl.filter(r => claims(r.toast)).length + ' V228 ' + J.filter(r => clampPair(r.b8) && claims(r.b8.toast)).length);
  P('  CF2 toast on clamp pairs == expected hold variant (branch read from the V228 toast) ' + cl.filter(r => r.toast === want(r)).length + '/' + cl.length + ' | by variant ' + fmt(tally(cl, r => r.toast.endsWith(HOLD) ? (/The load runs out/.test(r.toast) ? 'window-hold' : /No load to add/.test(r.toast) ? 'unloadable-hold' : /Same sets, same reps/.test(r.toast) ? 'verbatim-hold' : 'hold-other') : 'NOT HOLD: ' + r.toast.replace(/^.*? out\. /, ''))));
  cl.filter(r => r.toast !== want(r)).slice(0, 5).forEach(r => P('    miss ' + r.where + ' :: ' + r.D + ' => ' + r.O + ' | toast ' + JSON.stringify(r.toast) + ' want ' + JSON.stringify(want(r))));
  const K = J.filter(r => capT(r) && rpeMax(r.b7.O) !== null && rpeMax(r.b7.O) > 7);
  P('  the clamp class (capped target, V227 card RPE > 7): ' + K.length + ' | CF2 toast == expected hold variant ' + K.filter(r => r.toast === want(r)).length + ' | false effort/numbers claims ' + K.filter(r => claims(r.toast)).length + ' | variants ' + fmt(tally(K, r => r.toast.endsWith(HOLD) ? (/The load runs out/.test(r.toast) ? 'window-hold' : /No load to add/.test(r.toast) ? 'unloadable-hold' : 'verbatim-hold') : 'NOT HOLD')));
  const pre458 = cl.filter(r => claims(r.toast)); P('  hand-parse pairs outside the clamp class still claiming same effort: ' + pre458.length + ' | V227 toast identical ' + pre458.filter(r => r.toast === r.b7.toast).length + ' | V227 card identical ' + pre458.filter(r => r.O === r.b7.O).length + ' | donor->card RPE ' + fmt(tally(pre458, r => rpeMax(strip(r.D)) + '->' + rpeMax(r.O))));
  const non = J.filter(r => !r.clamp); const hn = non.filter(r => r.toast.endsWith(HOLD));
  P('  non-clamp pairs ' + non.length + ': toast == V228 ' + non.filter(r => r.toast === r.b8.toast).length + ' | == V227 ' + non.filter(r => r.toast === r.b7.toast).length + ' | hold toast on a non-clamp pair ' + hn.length + ' ' + fmt(tally(hn, r => (capT(r) ? 'capped' : 'UNCAPPED') + ' D ' + (rpeMax(strip(r.D)) === null ? 'names no RPE' : 'RPE ' + rpeMax(strip(r.D))) + ' card RPE ' + rpeMax(r.O))));
  non.filter(r => r.toast !== r.b8.toast).slice(0, 6).forEach(r => P('    non-clamp toast moved ' + r.where + ' :: ' + r.D + ' => ' + r.O + ' | V228 ' + JSON.stringify(r.b8.toast) + ' | CF2 ' + JSON.stringify(r.toast)));
  P('  card text CF2 vs V228 on all pairs: equal ' + J.filter(r => r.O === r.b8.O).length + '/' + J.length + ' | changed ' + fmt(tally(J.filter(r => r.O !== r.b8.O), r => r.O === R7T ? 'R7 text' : 'OTHER')));
  J.filter(r => r.O !== r.b8.O && r.O !== R7T).slice(0, 5).forEach(r => P('    card moved ' + r.where + ' :: ' + r.b8.O + ' => ' + r.O));
  // ── M6 held test ──
  P('\n=== M6 R7 held test');
  const live7 = J.filter(r => r.O === R7T); P('  R7 text on an UNCAPPED target (donor a native held-test card): ' + live7.filter(r => !capT(r)).length + ' | V228 printed there ' + fmt(tally(live7.filter(r => !capT(r)), r => /at RPE 7\..*new baseline/.test(r.b8.O) ? 'number-only' : r.b8.O === r.b8.D ? 'donor verbatim' : 'other')) + ' | V227 ' + fmt(tally(live7.filter(r => !capT(r)), r => r.b7.O === TEST9 ? 'TEST9 (RPE 9 test)' : 'other'))); P('  live gate rows printing R7 text ' + live7.length + ' | donor texts ' + fmt(tally(live7, r => r.D === TEST9 ? 'TEST9' : r.D)) + ' | capped targets ' + live7.filter(capT).length + ' | number-only "at RPE 7 … new baseline" in CF2 rows ' + J.filter(r => /at RPE 7\..*new baseline\./.test(r.O)).length);
  const L1 = JSON.parse(fs.readFileSync(C('gate_rows_V228.json.l1'), 'utf8')); const B7 = load(TREES.V227), B9 = load(TREES.CF2); pin(B7); pin(B9);
  let r7 = 0, num = 0, uncT = 0, uncSame = 0, capT9 = 0, unin = 0, uninR7 = 0, uninSame = 0, uninTot = 0; const r7ex = [];
  for(const cfg of L1){ const a = B7.buildProgram(clone(cfg)), b = B9.buildProgram(clone(cfg)); const cap = capOf(cfg); if(!cfg.injury){ uninTot++; if(JSON.stringify(a.weeks) === JSON.stringify(b.weeks)) uninSame++; }
    Object.keys(b.weeks).forEach(w => Object.keys(b.weeks[w]).forEach(d => ((b.weeks[w][d] && b.weeks[w][d].sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it) return; const det = it.detail || ''; const ai = a.weeks[w] && a.weeks[w][d] && a.weeks[w][d].sections[si] && a.weeks[w][d].sections[si].items[ii];
      if(det === R7T){ r7++; if(!cfg.injury) uninR7++; if(r7ex.length < 2) r7ex.push([cfg.liftingFocus, cfg.experience, cfg.equipment, cfg.injury && cfg.injury.region + '/' + cfg.injury.tier].join('|') + ' W' + w + ' ' + d + ' [' + clean(s.label) + '] ' + clean(it.name) + ' V227 ' + JSON.stringify(ai && ai.detail)); }
      if(/at RPE 7\..*new baseline\./.test(det)) num++;
      if(ai && ai.detail === TEST9){ const isCap = cap.includes(patOf(ai.name)); if(isCap) capT9++; else { uncT++; if(det === TEST9 && it.name === ai.name) uncSame++; else r7ex.push('UNCAPPED-ON-V227 test card moved: ' + [cfg.liftingFocus, cfg.experience, cfg.equipment, cfg.injury && cfg.injury.region + '/' + cfg.injury.tier].join('|') + ' W' + w + ' ' + d + ' [' + clean(s.label) + '] V227 ' + clean(ai.name) + ' [' + patOf(ai.name) + '] -> CF2 ' + clean(it.name) + ' [' + patOf(it.name) + '] ' + JSON.stringify(det)); } } })))); }
  P('  BUILD (gate L1, ' + L1.length + ' builds): cards printing R7 text ' + r7 + ' (uninjured ' + uninR7 + ') | V227 test cards on a capped pattern ' + capT9 + ' | number-only shape ' + num + ' | uncapped test cards byte-identical to V227 ' + uncSame + '/' + uncT + ' | uninjured builds byte-identical to V227 ' + uninSame + '/' + uninTot);
  r7ex.forEach(x => P('    e.g. ' + x));
  // ── M7 ──
  P('\n=== M7 digests and uninjured byte-identity on CF2');
  { const dg = t => progDigest(load(TREES[t]).buildProgram(clone(fixtures.HALF_MANNY))); P('  HALF_MANNY (unpinned clock, as gates do) V227 ' + dg('V227') + ' V228 ' + dg('V228') + ' CF2 ' + dg('CF2') + ' | expected 0ac7da6b1691a8e1'); }
  const pd = (t, cfg) => { const a = load(TREES[t]); pin(a); const b = load(TREES[t]); pin(b); const x = progDigest(a.buildProgram(clone(cfg))), y = progDigest(b.buildProgram(clone(cfg))); return x === y ? x : 'SELF-MISMATCH ' + x + '/' + y; };
  const CK6 = ['mario','ankle_wa','hip_wa','lowback_wa','shoulder_wa','elbow_wa'];
  P('  g227_d190_cuecap c-DIGEST (progDigest(buildProgram), clock pinned 2026-09-24, built twice per tree; configs as the gate names them):');
  for(const ck of CK6.concat(['manny','mario_noinj'])){ const a = pd('V227', CFGS[ck]), b = pd('V228', CFGS[ck]), c = pd('CF2', CFGS[ck]); P('    c-DIGEST ' + ck.padEnd(12) + ' CF2 ' + c + ' | V228 slices 1+2 ' + b + ' | V227 ' + a + (c === b ? ' (CF2 == slices 1+2)' : ' (CF2 != slices 1+2)')); }
  const EQ = ['commercial','crossfit','home_full','bodyweight'], EXP = ['beginner','intermediate','advanced'], FOC = ['support_strength','support_athletic','support_prevention']; let s1 = 0, n1 = 0;
  const Y8 = load(TREES.V228), Y9 = load(TREES.CF2), Y7 = load(TREES.V227); [Y7, Y8, Y9].forEach(pin);
  const UN = [clone(CFGS.mario_noinj)]; for(const eq of EQ) for(const ex of EXP) for(const fo of FOC){ const c = clone(MARIO); Object.assign(c, { equipment:eq, experience:ex, liftingFocus:fo }); UN.push(c); }
  for(const c of UN){ n1++; const a = JSON.stringify(Y7.buildProgram(clone(c)).weeks), b = JSON.stringify(Y9.buildProgram(clone(c)).weeks); if(a === b) s1++; }
  P('  uninjured byte-identity CF2 vs V227: support lattice + mario_noinj ' + s1 + '/' + n1 + ' | gate L1 healthy configs ' + uninSame + '/' + uninTot + ' | total ' + (s1 + uninSame) + '/' + (n1 + uninTot));
  fs.writeFileSync(F('cf2_report.txt'), out.join('\n') + '\n');
}
