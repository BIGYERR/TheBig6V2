// v229_slice3_cf5.js — MEASURE (read-only), M10 for D194 Amendment 1 on a CF5 copy.
//   CF5 = CF4 (measure's M9 copy: SL2 + the lens on the three legality sites) + slice 3 per R6, measure's reading:
//   undo restores _preHold from the record's ph or deletes it; the boot replay stamps _preHold on the items the replay
//   renamed (identity list taken per pass, applySwapPrefs untouched) inside the existing prog.cfg.injury guard.
//   SCR=<scratch>/cf5 M9=<scratch> PART=<tree|gates|single|chains|report> node tests/measure/v229_slice3_cf5.js
// Oracles: the ruling's After-block strings for the hand routes; tree-vs-tree identity (V228, SL2) for name/detail;
//   Amendment 3 §4's persistence paragraph (where _preHold / ph may appear) as a hand rule; the shipped gates' own rows.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const H = require(path.join(ROOT, 'tests', 'harness.js')); const { load } = H;
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const M9 = process.env.M9 || path.dirname(SCR); const PRIOR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/measure';
const PART = process.env.PART || 'none';
const TREES = { V228:path.join(M9, 'v228.html'), SL2:path.join(M9, 'sl2.html'), CF4:path.join(M9, 'cf4.html'), CF5:F('cf5.html'), V226:F('v226.html') };
const START = '2026-08-24', CLOCK = '2026-09-24', FROM = '2026-09-21';
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const withInj = (inj, extra) => { const c = Object.assign(clone(MARIO), extra || {}); if(inj) c.injury = inj; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }), lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }), mario_noinj:withInj(null) };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12);
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const P = s => console.log(s);
function pin(IA, off){ const T = new Date(CLOCK + 'T12:00:00').getTime() + (off || 0); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};popFire=function(){};try{closeRestSheet=function(){};}catch(e){}"
  + "globalThis.__dayLists=function(w,d){var day=activeProg.weeks[w]&&activeProg.weeks[w][d];var out=[];if(!day||day.rest||!day.sections)return {stamp:null,rows:out};day.sections.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it||!it.name)return;var p=_pattern(it.name);if(p){var c=swapCandidates(it.name,day,w,activeProg);out.push({si:si,ii:ii,n:it.name,k:'pat',L:c.tier1.concat(c.tier2)});}else if(_auxFamily(it.name)){out.push({si:si,ii:ii,n:it.name,k:'aux',L:auxSwapCandidates(it.name,day,activeProg).slice()});}});});var a=addCandidates(day,w,activeProg);out.push({si:-1,ii:-1,n:'(add)',k:'add',L:[].concat(a.gap,a.more,a.off)});return {stamp:day._ovKey||null,rows:out};};"
  + "globalThis.__judge=function(names,cfg){return names.filter(function(n){return !_swapInjuryOK(n,cfg);});};";
function fresh(t, off){ const X = load(TREES[t]); pin(X, off); E(X, HELP); return X; }
function setup(IA, st){ IA.localStorage.clear(); IA.ctx.__SP = JSON.parse(st); E(IA, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function bootFrom(src, dst){ const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function stripClock(j){ const o = JSON.parse(j); (o.overlays || []).forEach(v => { delete v.id; delete v.created; }); return JSON.stringify(o); }
const _st = {};
function storedFor(t, key, cfg, pres){ const k = t + '_' + key + '_' + pres; if(_st[k]) return _st[k]; const f = F('stored_' + k + '.json'); if(fs.existsSync(f)) return (_st[k] = fs.readFileSync(f, 'utf8'));
  const X = fresh(t); const base = clone(cfg); delete base.injury; const c = pres === 'CFG' ? clone(cfg) : base;
  const p = X.buildProgram(clone(c)); const s = clone(p); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(c) }); let j = JSON.stringify(s);
  if(pres === 'OV' && cfg.injury){ setup(X, j); E(X, "_ovDraft.injRegion=" + JSON.stringify(cfg.injury.region) + ";_ovDraft.injTier=" + JSON.stringify(cfg.injury.tier) + ";_ovDraft.from='" + FROM + "';applyInjuryDraft();");
    j = JSON.stringify(JSON.parse(E(X, "localStorage.getItem('ia_programs')")).find(x => x.id === 'PM')); }
  fs.writeFileSync(f, j); return (_st[k] = j); }
const slotOf = (IA, w, d, si, ii) => JSON.parse(E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";var it=dy&&dy.sections[" + si + "]&&dy.sections[" + si + "].items[" + ii + "];return it?JSON.stringify({n:it.name,d:it.detail||'',h:(typeof it._preHold==='string')?it._preHold:null,hk:('_preHold' in it)}):JSON.stringify({n:'(none)',d:'',h:null,hk:false});})()"));
function hop(IA, c, to){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); IA.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:cur.n, detail:cur.d }; IA.ctx.__to = to; E(IA, '__T.length=0;'); let bad = 0;
  try { E(IA, '_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ bad = 1; } const after = slotOf(IA, c.w, c.d, c.si, c.ii); if(clean(after.n) !== clean(to)) bad = 1; return { d:after.d, n:after.n, h:after.h, t:Array.from(E(IA, '__T')).join(' / '), bad }; }
function undoLast(IA, c){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); const chip = E(IA, 'swapOriginOf(' + JSON.stringify(cur.n) + ')') || ''; let err = null; if(chip){ try { E(IA, 'undoSwap(' + JSON.stringify(chip) + ');'); } catch(e){ err = e.message; } } return { chip, err, slot:slotOf(IA, c.w, c.d, c.si, c.ii) }; }
const dayJ = (IA, w, d) => E(IA, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + '.sections)');

// ─── TREE: CF5 = CF4 + two hunks, anchor-asserted ───
if(PART === 'tree'){
  if(fs.existsSync(F('cf5.html'))) fs.unlinkSync(F('cf5.html'));
  let src = fs.readFileSync(TREES.CF4, 'utf8'); const cnt = (s, a) => s.split(a).length - 1;
  P('CF4 sha ' + sha(TREES.CF4) + ' (M9 68e0077e8096) | _renamed present before: ' + cnt(src, '_renamed'));
  const EDITS = [
    // U: undoSwap's restore block — the kept dose from the record, or nothing
    ["      if(it){it.detail=p.d;_put.push(it);}\n",
     "      // V229 D193 (Amendment 3 section 4) / D194 R6: the kept dose comes back from the record with the card, or nothing is kept.\n"
     + "      if(it){it.detail=p.d;if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;_put.push(it);}\n"],
    // B: applySessionSwaps — identity list of the items each replay pass renamed; stamped inside the existing injury guard
    ["    let hit=false;\n    list.forEach(e=>{\n      const m1=Object.create(null); m1[e.from]=e.to;\n      if(applySwapPrefs(day.sections,m1)) hit=true;\n    });\n    if(hit && prog.cfg && prog.cfg.injury){\n      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n",
     "    let hit=false;\n    const _renamed=[];   // V229 D193 (A3 s4) / D194 R6: the items this replay renamed, by identity\n    list.forEach(e=>{\n      const m1=Object.create(null); m1[e.from]=e.to;\n"
     + "      const _was=[]; day.sections.forEach(s=>((s&&s.items)||[]).forEach(it=>{ if(it&&it.name===e.from) _was.push(it); }));\n"
     + "      if(applySwapPrefs(day.sections,m1)) hit=true;\n      _was.forEach(it=>{ if(it.name!==e.from&&_renamed.indexOf(it)<0) _renamed.push(it); });\n    });\n"
     + "    if(hit && prog.cfg && prog.cfg.injury){\n      // the pre-filter replay result rides beside each renamed item; the filter copies item fields through\n"
     + "      _renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });\n      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n"] ];
  EDITS.forEach(([a], i) => { const n = cnt(src, a); P('CF5 anchor ' + ['U','B'][i] + ' count ' + n); if(n !== 1) throw new Error('anchor count ' + n); });
  EDITS.forEach(([a, b]) => { src = src.replace(a, b); }); fs.writeFileSync(F('cf5.html'), src);
  fs.writeFileSync(F('cf4_cf5.diff'), cp.spawnSync('diff', ['-U0', TREES.CF4, F('cf5.html')], { encoding:'utf8' }).stdout);
  const df = fs.readFileSync(F('cf4_cf5.diff'), 'utf8'); P('diff CF4 -> CF5: ' + df.length + ' bytes, hunks ' + (df.match(/^@@/mg) || []).length + ', -lines ' + (df.match(/^-(?!--)/mg) || []).length + ', +lines ' + (df.match(/^\+(?!\+\+)/mg) || []).length); P(df.split('\n').filter(l => /^[@+-]/.test(l) && !/^(\+\+\+|---)/.test(l)).join('\n'));
  P('TREE CF5 sha ' + sha(F('cf5.html')) + ' ia-version ' + (src.match(/ia-version" content="(\d+)"/) || [])[1] + ' | boot ok ' + (load(F('cf5.html')).eval('typeof applySessionSwaps') === 'function'));
  // the other callers of applySwapPrefs are untouched (boolean contract): list them
  P('applySwapPrefs call sites CF5: ' + src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /applySwapPrefs\(/.test(l)).map(([i, l]) => i + ' ' + l.trim().slice(0, 70)).join(' || '));
}

// ─── GATES: the swap families on CF5 and on V228, each with its own usage-line baseline ───
const GATES = [['g227_d190_seam','v226'], ['g228_d192_undokey','v227'], ['g221_d177_swapfloor','v220'], ['g227_d190_cuecap','v226'], ['g228_d193_cueword','v227'], ['g222_d181_chain','v221'], ['g222_d181_durable','v221'], ['g227_d190_prefpath','v226']];
if(PART === 'gates'){
  const tag = { v220:'V220', v221:'V221', v226:'V226', v227:'V227' }; Object.keys(tag).forEach(b => { const f = F(b + '.html'); if(fs.existsSync(f)) fs.unlinkSync(f); fs.writeFileSync(f, cp.execSync('git show ' + tag[b] + ':index.html', { cwd:ROOT, encoding:'utf8', maxBuffer:1 << 28 })); P(b + ' ' + sha(f) + ' ia-version ' + (fs.readFileSync(f, 'utf8').match(/ia-version" content="(\d+)"/) || [])[1]); });
  const jobs = []; for(const t of ['CF5','V228']) for(const [g, b] of GATES) jobs.push([t, g, b]); let i = 0; const t0 = Date.now();
  const run = ([t, g, b]) => new Promise(res => { const out = F('gate_' + g + '_' + t + '.out'); if(fs.existsSync(out)) fs.unlinkSync(out); const p = cp.spawn(process.execPath, ['--max-old-space-size=6144', path.join(ROOT, 'tests', 'gates', g + '.js'), TREES[t], F(b + '.html')], { cwd:ROOT }); const ws = fs.createWriteStream(out); p.stdout.pipe(ws); p.stderr.pipe(ws);
    p.on('exit', code => { ws.end(() => { const o = fs.readFileSync(out, 'utf8'); const s = (o.match(/^PASS \d+ FAIL \d+$/m) || ['NO SUMMARY (crash)'])[0]; P(t + ' ' + g + ' (baseline ' + b + ') exit ' + code + ' | ' + s + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); }); });
  Promise.all(Array.from({ length:+(process.env.PAR || 8) }, async () => { while(i < jobs.length) await run(jobs[i++]); })).then(() => P('gates done'));
}

// ─── SINGLE: (1) mario sheet, digest, uninjured; (3) hand routes; (5) stores; (b) uninjured object rows ───
function walk(o, p, out){ if(Array.isArray(o)) o.forEach((x, i) => walk(x, p + '[' + i + ']', out)); else if(o && typeof o === 'object') Object.keys(o).forEach(k => { const q = p + '.' + k; if(k === '_preHold' || k === 'ph') out.kp.push(q + '=' + JSON.stringify(o[k])); else if(k === 'name' || k === 'detail' || k === 'd' || k === 'from' || k === 'to') out.nd.push(q + '=' + JSON.stringify(o[k])); walk(o[k], q, out); }); return out; }
function stores(IA){ const r = {}; for(const k of ['ia_programs','ia_hist_PM','ia_swaps_PM']){ let v = null; try { v = JSON.parse(E(IA, "localStorage.getItem('" + k + "')") || 'null'); } catch(e){} r[k] = walk(v, k, { kp:[], nd:[] }); } return r; }
if(PART === 'single'){
  // (1) mario sheet on CF5 (judge = V228's _swapInjuryOK on the injured cfg)
  const J = fresh('V228'); const rej = (names, cfg) => { J.ctx.__nn = names; J.ctx.__cc = cfg; return Array.from(E(J, '__judge(__nn,__cc)')); };
  for(const t of ['CF4','CF5']){ const X = fresh(t); setup(X, storedFor(t, 'mario', CFGS.mario, 'OV')); const s = { pat:[0, 0, 0], aux:[0, 0, 0], add:[0, 0, 0] };
    ['mon','tue','wed','thu','fri','sat','sun'].forEach(d => JSON.parse(E(X, 'JSON.stringify(__dayLists(5,"' + d + '"))')).rows.forEach(r => { const x = s[r.k]; x[0]++; x[1] += r.L.length; x[2] += rej(r.L, CFGS.mario).length; }));
    P('[1] mario OV W5 ' + t + ': swap rejected ' + s.pat[2] + ' of ' + s.pat[1] + ' (' + s.pat[0] + ' cards) | aux ' + s.aux[2] + ' of ' + s.aux[1] + ' (' + s.aux[0] + ') | add ' + s.add[2] + ' of ' + s.add[1] + ' (' + s.add[0] + ' days)'); }
  for(const t of ['V228','CF5']){ const X = load(TREES[t]); const a = H.progDigest(X.buildProgram(clone(H.fixtures.HALF_MANNY))), b = H.progDigest(X.buildProgram(clone(H.fixtures.HALF_MANNY))); P('[1] HALF_MANNY ' + t + ' digest ' + a + ' self-stable ' + (a === b)); }
  const L1 = JSON.parse(fs.readFileSync(path.join(PRIOR, 'in', 'gate_rows_V227.json.l1'), 'utf8')); const UN = L1.filter(c => !c.injury).concat([clone(MARIO), clone(H.fixtures.HALF_MANNY)]);
  { const A = fresh('V228'), B = fresh('CF5'); let n = 0, eq = 0; UN.forEach(c => { n++; if(JSON.stringify(A.buildProgram(clone(c))) === JSON.stringify(B.buildProgram(clone(c)))) eq++; }); P('[1] uninjured builds CF5 == V228: ' + eq + '/' + n); }
  // (b) uninjured object rows: mario_noinj, every W5 thu card hopped to its first candidate, then boot, undo, undo+boot
  { let n = 0, ph = 0, eqv = 0; const res = {};
    for(const t of ['V228','CF5']){ const A = fresh(t), B = fresh(t), C = fresh(t); const st = storedFor(t, 'mario_noinj', CFGS.mario_noinj, 'OV'); setup(A, st); const thu = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[5].thu)')); const out = [];
      thu.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.name || !E(A, '_pattern(' + JSON.stringify(it.name) + ')')) return; A.ctx.__n = it.name; const c0 = JSON.parse(E(A, 'JSON.stringify(swapCandidates(__n,activeProg.weeks[5].thu,5,activeProg))')); const to = c0.tier1[0] || c0.tier2[0]; if(to) out.push({ si, ii, to }); }));
      const L = []; out.forEach(o => { hop(A, { w:5, d:'thu', si:o.si, ii:o.ii }, o.to); }); L.push(dayJ(A, 5, 'thu')); bootFrom(A, B); L.push(dayJ(B, 5, 'thu')); out.slice().reverse().forEach(o => undoLast(A, { w:5, d:'thu', si:o.si, ii:o.ii })); L.push(dayJ(A, 5, 'thu')); bootFrom(A, C); L.push(dayJ(C, 5, 'thu'));
      res[t] = { L, hops:out.length, ph:L.map(j => (j.match(/_preHold/g) || []).length), rec:(E(A, "localStorage.getItem('ia_swaps_PM')") || '').indexOf('"ph"') >= 0 }; }
    P('[b] uninjured mario_noinj W5 thu, ' + res.CF5.hops + ' hops then boot, undo-all, undo+boot: _preHold keys in day (live/boot/undo/undo+boot) CF5 ' + res.CF5.ph.join('/') + ' V228 ' + res.V228.ph.join('/') + ' | day JSON CF5 == V228 ' + res.CF5.L.map((j, i) => j === res.V228.L[i]).join('/') + ' | ph in record CF5 ' + res.CF5.rec); }
  // (3) hand routes U1, U2, RB on mario W5 thu, both presentations
  const fmtS = s => clean(s.n) + ' ' + JSON.stringify(s.d) + ' _preHold ' + (s.hk ? JSON.stringify(s.h) : 'none');
  const ROUTES = {};
  for(const pres of ['CFG','OV']) for(const t of ['V228','SL2','CF5']){ const st = storedFor(t, 'mario', CFGS.mario, pres); const find = A => { const thu = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[5].thu)')); let r = null; thu.sections.forEach((s, x) => (s.items || []).forEach((it, y) => { if(!r && clean(it.name) === 'Single-leg hip thrust') r = { w:5, d:'thu', si:x, ii:y }; })); return r; };
    const lines = [];
    let A = fresh(t); setup(A, st); const c = find(A); if(!c){ P('[3] ' + t + ' ' + pres + ' FAILED: no Single-leg hip thrust'); continue; }
    let pre = dayJ(A, 5, 'thu'); hop(A, c, 'Barbell hip thrust'); let hs = slotOf(A, 5, 'thu', c.si, c.ii); let u = undoLast(A, c);
    lines.push('U1 hop1 ' + fmtS(hs) + ' | undo(chip ' + JSON.stringify(u.chip) + ') -> ' + fmtS(u.slot) + ' | day identical to pre-hop ' + (dayJ(A, 5, 'thu') === pre));
    A = fresh(t); setup(A, st); const a1 = hop(A, c, 'Leg extension'); const s1 = slotOf(A, 5, 'thu', c.si, c.ii); pre = dayJ(A, 5, 'thu'); hop(A, c, 'Barbell good mornings'); const s2 = slotOf(A, 5, 'thu', c.si, c.ii); u = undoLast(A, c);
    const rx = []; Object.values(JSON.parse(E(A, "localStorage.getItem('ia_swaps_PM')") || '{}')).forEach(l => (l || []).forEach(e => (e.rx || []).forEach(x => rx.push(x))));
    lines.push('U2 hop1 ' + fmtS(s1) + ' | hop2 ' + fmtS(s2) + ' | undo -> ' + fmtS(u.slot) + ' | day identical to pre-hop2 ' + (dayJ(A, 5, 'thu') === pre) + ' | record after undo rx ' + rx.length + ' ph ' + JSON.stringify(rx.filter(x => 'ph' in x).map(x => x.ph)));
    A = fresh(t); setup(A, st); hop(A, c, 'Barbell hip thrust'); hop(A, c, 'Leg extension'); const B = fresh(t); bootFrom(A, B); const rb = slotOf(B, 5, 'thu', c.si, c.ii); const h3 = hop(B, c, 'Barbell good mornings'); const C = fresh(t); bootFrom(B, C); const bt = slotOf(C, 5, 'thu', c.si, c.ii);
    const D = fresh(t); setup(D, st); const dr = hop(D, c, 'Barbell good mornings');
    lines.push('RB REBOOT slot ' + fmtS(rb) + ' | hop3 LIVE ' + JSON.stringify(h3.d) + ' | BOOT ' + JSON.stringify(bt.d) + ' | DIRECT ' + JSON.stringify(dr.d) + ' | live==boot==direct ' + (h3.d === bt.d && bt.d === dr.d));
    ROUTES[t + pres] = lines; P('\n[3] mario W5 thu ' + t + ' ' + pres + '\n    ' + lines.join('\n    ')); }
  for(const t of ['SL2','CF5']) P('[3] OV ' + t + ' == V228 OV line by line: ' + ROUTES[t + 'OV'].filter((l, i) => l === ROUTES.V228OV[i]).length + '/' + ROUTES.V228OV.length);
  // (5) stores on the fixture: after a hop, after a reboot, after a trained-day swap (and its reboot)
  const ST = {};
  for(const t of ['V228','SL2','CF5']){ const st = storedFor(t, 'mario', CFGS.mario, 'CFG'); ST[t] = {};
    let A = fresh(t); setup(A, st); const thu = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[5].thu)')); let c = null; thu.sections.forEach((s, x) => (s.items || []).forEach((it, y) => { if(!c && clean(it.name) === 'Single-leg hip thrust') c = { w:5, d:'thu', si:x, ii:y }; }));
    ST[t].base = stores(A); hop(A, c, 'Barbell hip thrust'); hop(A, c, 'Leg extension'); ST[t].hop = stores(A); const B = fresh(t); bootFrom(A, B); ST[t].reboot = stores(B); ST[t].rebootSlot = slotOf(B, 5, 'thu', c.si, c.ii);
    A = fresh(t); setup(A, st); E(A, "currentWeek=5;currentDayKey='thu';snapshotDay(5,'thu');"); hop(A, c, 'Barbell hip thrust'); hop(A, c, 'Leg extension'); ST[t].trained = stores(A); const C = fresh(t); bootFrom(A, C); ST[t].trainedReboot = stores(C); ST[t].trainedSlot = slotOf(C, 5, 'thu', c.si, c.ii); }
  for(const ph of ['base','hop','reboot','trained','trainedReboot']){ for(const t of ['V228','SL2','CF5']){ const s = ST[t][ph]; P('[5] ' + ph + ' ' + t + ' | ' + Object.keys(s).map(k => k + ': _preHold/ph ' + s[k].kp.length + (s[k].kp.length ? ' [' + s[k].kp.map(x => x.replace(/^.*?\.weeks\./, 'weeks.').replace(/sections\[(\d+)\]\.items\[(\d+)\]/, 's$1i$2').slice(0, 90)).join(' ; ') + ']' : '') + ', name/detail paths ' + s[k].nd.length).join(' | ')); }
    for(const t of ['SL2','CF5']) P('    name/detail projection ' + t + ' == V228: ' + Object.keys(ST[t][ph]).map(k => k + ' ' + (JSON.stringify(ST[t][ph][k].nd) === JSON.stringify(ST.V228[ph][k].nd))).join(', ') + (t === 'CF5' ? ' | CF5 == SL2: ' + Object.keys(ST.CF5[ph]).map(k => k + ' ' + (JSON.stringify(ST.CF5[ph][k].nd) === JSON.stringify(ST.SL2[ph][k].nd))).join(', ') : '')); }
  for(const t of ['V228','SL2','CF5']) P('[5] slot after reboot ' + t + ': untrained ' + fmtS(ST[t].rebootSlot) + ' | trained (hist-restored) ' + fmtS(ST[t].trainedSlot));
}

// ─── CHAINS: D190 overlay chains on CF5 (and V228 mario again, for the baseline-self proof) ───
if(process.env.CW){
  const [t, ck, pres] = process.env.CW.split(':'); const st = storedFor(t, ck, CFGS[ck], pres); const res = [];
  const chains = JSON.parse(fs.readFileSync(path.join(PRIOR, 'in', 'chains_' + ck + '.json'), 'utf8'));
  const by = {}; chains.forEach(c => (by[c.w + c.d] = by[c.w + c.d] || []).push(c)); const ls = Object.values(by); const nB = Math.max(0, ...ls.map(l => l.length));
  const A = fresh(t), B2 = fresh(t), B3 = fresh(t);
  for(let b = 0; b < nB; b++){ const batch = ls.map(l => l[b]).filter(Boolean); setup(A, st); const r = {};
    batch.forEach(c => r[c.id] = { id:c.id, ck, w:c.w, d:c.d, si:c.si, ii:c.ii, hops:c.hops, start:slotOf(A, c.w, c.d, c.si, c.ii), steps:[], toasts:[], kept:[], bad:0 });
    for(const c of batch){ const s = r[c.id]; for(const to of c.hops){ const h = hop(A, c, to); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h !== null); s.bad += h.bad; } s.live = slotOf(A, c.w, c.d, c.si, c.ii); }
    const rx = JSON.parse(E(A, "localStorage.getItem('ia_swaps_PM')") || '{}'); batch.forEach(c => { r[c.id].ph = ((rx['w' + c.w + '_' + c.d] || []).reduce((n, e) => n + (e.rx || []).filter(x => 'ph' in x).length, 0)); });
    bootFrom(A, B2); for(const c of batch) r[c.id].boot = slotOf(B2, c.w, c.d, c.si, c.ii);
    const bootDays = {}; batch.forEach(c => { bootDays[c.w + c.d] = (E(B2, 'JSON.stringify(activeProg.weeks[' + c.w + '].' + c.d + '.sections)').match(/_preHold/g) || []).length; });
    for(const c of batch){ const u = undoLast(A, c); r[c.id].undo = u.slot; }
    const undoDays = {}; batch.forEach(c => { undoDays[c.w + c.d] = (dayJ(A, c.w, c.d).match(/_preHold/g) || []).length; });
    bootFrom(A, B3); for(const c of batch) r[c.id].undoBoot = slotOf(B3, c.w, c.d, c.si, c.ii);
    batch.forEach(c => { r[c.id].bootDayPH = bootDays[c.w + c.d]; r[c.id].undoDayPH = undoDays[c.w + c.d]; res.push(r[c.id]); }); }
  fs.writeFileSync(F('res_C_' + t + '_' + ck + '_' + pres + '.json'), JSON.stringify(res)); console.log('C worker ' + process.env.CW + ' ' + res.length); process.exit(0);
}
if(PART === 'chains'){ const jobs = ['elbow_wa','shoulder_wa','lowback_wa','hip_wa','knee_protect','mario','ankle_wa'].map(ck => 'CF5:' + ck + ':OV').concat(['V228:mario:OV']); let i = 0; const t0 = Date.now();
  const run = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { CW:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { P(code ? 'WORKER CRASH ' + j + ' ' + o.slice(-500) : o.trim() + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  Promise.all(Array.from({ length:8 }, async () => { while(i < jobs.length) await run(jobs[i++]); })).then(() => P('chains done')); }
if(PART === 'report'){
  const CK = ['elbow_wa','shoulder_wa','lowback_wa','hip_wa','knee_protect','mario','ankle_wa']; const rd = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : null;
  const cols = (a, b) => ({ live:a.live.d !== b.live.d || a.live.n !== b.live.n, toast:a.toasts.join('|') !== b.toasts.join('|'), boot:a.boot.d !== b.boot.d || a.boot.n !== b.boot.n, undo:a.undo.d !== b.undo.d || a.undo.n !== b.undo.n, undoBoot:a.undoBoot.d !== b.undoBoot.d || a.undoBoot.n !== b.undoBoot.n, start:a.start.d !== b.start.d || a.start.n !== b.start.n });
  { const a = rd(F('res_C_V228_mario_OV.json')), b = new Map(rd(path.join(M9, 'res_C_V228_mario_OV.json')).map(r => [r.id, r])); let n = 0, d = 0; a.forEach(r => { n++; if(Object.values(cols(r, b.get(r.id))).some(Boolean)) d++; }); P('[4] BASELINE V228 OV mario chains, this run vs M9 run: differ ' + d + ' of ' + n); }
  for(const w of [5, 3]){ let n = 0, miss = 0; const dd = {}; let bh = 0, uh = 0, ubh = 0, lh = 0, bdp = 0, udp = 0, phc = 0, hold = 0;
    CK.forEach(ck => { const A = rd(F('res_C_CF5_' + ck + '_OV.json')), B0 = rd(path.join(M9, 'res_C_V228_' + ck + '_OV.json')); if(!A || !B0){ miss++; return; } const B = new Map(B0.map(r => [r.id, r]));
      A.filter(r => r.w === w).forEach(r => { const b = B.get(r.id); if(!b){ miss++; return; } n++; const f = cols(r, b); let any = false; Object.keys(f).forEach(k => { if(f[k]){ dd[k] = (dd[k] || 0) + 1; any = true; } }); if(any) dd.any = (dd.any || 0) + 1;
        if(r.boot.hk) bh++; if(r.undo.hk) uh++; if(r.undoBoot.hk) ubh++; if(r.live.hk) lh++; if(r.bootDayPH) bdp++; if(r.undoDayPH) udp++; phc += r.ph; if(r.toasts.some(x => x.indexOf('Your injury plan holds this one at RPE 7.') >= 0)) hold++; }); });
    P('[4] CF5 OV vs V228 OV W' + w + ' chains n=' + n + (miss ? ' MISSING ' + miss : '') + ' | moved: ' + fmt(dd) + ' | _preHold key on slot: live ' + lh + ' boot ' + bh + ' undo ' + uh + ' undo+boot ' + ubh + ' | chains whose booted day carries any _preHold ' + bdp + ', whose undone day does ' + udp + ' | ph entries ' + phc + ' | hold toasts ' + hold); }
}
// ─── GUARD: the g228 undokey refutation's created chains, replayed by hand; whole-day key-level diff, boot vs live after undo ───
if(PART === 'guard'){
  const CLK = /^_?(ts|at|time|stamp|clock|now)$/i; const JS = v => JSON.stringify(v, (k, x) => CLK.test(k) ? undefined : x);
  const G = { knee_wa:'knee', ankle_wa:'ankle', hip_wa:'hip', lowback_wa:'lowback', shoulder_wa:'shoulder', elbow_wa:'elbow' };
  const lines = fs.readFileSync(F('gate_g228_d192_undokey_CF5.out'), 'utf8').split('\n').filter(l => /^\s+created /.test(l));
  const chains = lines.map(l => { const m = /created (\S+) (\S+) W(\d+) (\S+) (\S+) (\S+) : (.*?) \| repeated from/.exec(l); return m ? { pop:m[1], ck:m[2], w:+m[3], d:m[4], cls:m[5], shape:m[6], names:m[7].split(' > ') } : null; }).filter(Boolean);
  P('[guard] created chains parsed ' + chains.length + ' of ' + lines.length + ' lines | by pop ' + fmt(chains.reduce((m, c) => (m[c.pop] = (m[c.pop] || 0) + 1, m), {})) + ' | by shape ' + fmt(chains.reduce((m, c) => (m[c.shape] = (m[c.shape] || 0) + 1, m), {})));
  const keyDiff = (a, b) => { const out = new Set(); const A = JSON.parse(a), B = JSON.parse(b); const rec = (x, y, p) => { if(JSON.stringify(x) === JSON.stringify(y)) return; if(x && y && typeof x === 'object' && typeof y === 'object'){ new Set(Object.keys(x).concat(Object.keys(y))).forEach(k => rec(x[k], y[k], k)); } else out.add(p); }; rec(A, B, 'root'); return [...out].sort().join(','); };
  const res = {};
  for(const t of ['V228','SL2','CF5']){ const tally = {}; let n = 0, eq = 0, un = 0; const ex = [];
    for(const c of chains){ const cfg = clone(MARIO); cfg.injury = { region:G[c.ck], tier:'workaround' }; const st = storedFor(t, 'g_' + c.ck, cfg, 'CFG');
      const A = fresh(t); setup(A, st); const day = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[' + c.w + '].' + c.d + ')')); let slot = null; day.sections.forEach((s, x) => (s.items || []).forEach((it, y) => { if(!slot && it && it.name === c.names[0]) slot = { w:c.w, d:c.d, si:x, ii:y }; }));
      if(!slot){ un++; continue; } let bad = 0; for(let k = 1; k < c.names.length; k++){ const h = hop(A, slot, c.names[k]); bad += h.bad; } if(bad){ un++; continue; }
      const u = undoLast(A, slot); const afterJ = JS(JSON.parse(dayJ(A, c.w, c.d))); const B = fresh(t); bootFrom(A, B); const bootJ = JS(JSON.parse(dayJ(B, c.w, c.d))); n++;
      if(afterJ === bootJ){ eq++; continue; } const k = keyDiff(afterJ, bootJ); tally[k] = (tally[k] || 0) + 1;
      if(ex.length < 3 && t === 'CF5'){ const L = JSON.parse(afterJ), Bo = JSON.parse(bootJ); let d = ''; L.forEach((s, si) => (s.items || []).forEach((it, ii) => { const b = (Bo[si] || {}).items && Bo[si].items[ii]; if(!d && JSON.stringify(it) !== JSON.stringify(b)) d = '[' + si + '][' + ii + '] live ' + it.name + ' ' + JSON.stringify(it.detail) + ' _preHold ' + JSON.stringify(it._preHold) + ' ; boot ' + (b || {}).name + ' ' + JSON.stringify((b || {}).detail) + ' _preHold ' + JSON.stringify((b || {})._preHold); })); ex.push(c.pop + ' ' + c.ck + ' W' + c.w + ' ' + c.d + ' ' + c.shape + ' ' + c.names.join(' > ') + ' | chip ' + JSON.stringify(u.chip) + ' | ' + d); } }
    res[t] = { n, eq, un, tally }; P('[guard] ' + t + ': replayed ' + n + ' (unreplayable ' + un + ') | boot == live after undo ' + eq + ' | differing, by differing keys: ' + fmt(tally)); ex.forEach(e => P('    e.g. ' + e)); }
}

// ─── TOAST: c-TOAST corroboration on the D190 chain lattice, fixture presentation, CF5 vs V226, classes hop1/hop2/cyc2 ───
if(PART === 'toastjobs'){ const jobs = []; for(const ck of ['mario','ankle_wa','hip_wa','lowback_wa','shoulder_wa','elbow_wa']) for(const t of ['CF5','V226']) jobs.push(t + ':' + ck + ':CFG'); let i = 0; const t0 = Date.now();
  const run = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { CW:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { P(code ? 'WORKER CRASH ' + j + ' ' + o.slice(-500) : o.trim() + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  Promise.all(Array.from({ length:8 }, async () => { while(i < jobs.length) await run(jobs[i++]); })).then(() => P('toast jobs done')); }
if(PART === 'toast'){ const HOLD = ' Your injury plan holds this one at RPE 7.'; let n = 0, mv = 0, hv = 0, hvStrip = 0; const ex = [], seg = {};
  for(const ck of ['mario','ankle_wa','hip_wa','lowback_wa','shoulder_wa','elbow_wa']){ const A = JSON.parse(fs.readFileSync(F('res_C_CF5_' + ck + '_CFG.json'))), B = new Map(JSON.parse(fs.readFileSync(F('res_C_V226_' + ck + '_CFG.json'))).map(r => [r.id, r]));
    const cls = new Map(JSON.parse(fs.readFileSync(path.join(PRIOR, 'in', 'chains_' + ck + '.json'))).map(c => [c.id, c.cls]));
    A.forEach(r => { const k = cls.get(r.id); if(!['hop1','hop2','cyc2'].includes(k)) return; const b = B.get(r.id); r.toasts.forEach((t, i) => { n++; const bt = b.toasts[i]; if(t === bt) return; mv++; seg[ck] = (seg[ck] || 0) + 1; const isH = t.endsWith(HOLD); if(isH) hv++; else if(ex.length < 4) ex.push(ck + ' ' + r.hops.join(' > ') + ' hop' + (i + 1) + ' | CF5 ' + JSON.stringify(t) + ' | V226 ' + JSON.stringify(bt)); }); }); }
  P('[2] c-TOAST corroboration (D190 chain lattice, fixture, hop1/hop2/cyc2): hops ' + n + ' | toasts moved vs V226 ' + mv + ' | moved ending with the hold sentence ' + hv + ' | moved NOT a hold variant ' + (mv - hv) + ' | per cfg ' + fmt(seg)); ex.forEach(e => P('    not-hold e.g. ' + e)); }
