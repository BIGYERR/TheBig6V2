// v229_lens_cf4.js — MEASURE (read-only), M9 for D194 P-INJLENS part 1 on a CF4 copy.
//   CF4 = SL2 (V228 + V229 builder slices 1 and 2, working index.html, uncommitted) + measure's reading of R1/R2(2):
//   one helper _dayPlanCfg(prog,day) (the day's _ovKey injury, else prog.cfg) handed to _swapInjuryOK/_powerAllowed by
//   swapCandidates, auxSwapCandidates and addCandidates. Tap guard and applySessionSwaps untouched (R3/R4 dormant).
//   SCR=<scratch> PART=<trees|l1|chains|single|report> node tests/measure/v229_lens_cf4.js
// Oracles: "rejected by the plan" = V228's _swapInjuryOK on the fully injured cfg in a separate judge VM (the ruled
//   definition of the 1,451 figure; the function under test is which cfg each tree hands it, never the judge). Hand CAP
//   table and hand RPE parse for (o). Ruling-literal strings for R7 / TEST text. Tree-vs-tree and presentation-vs-
//   presentation identity for every "byte-identical" row. Clock pinned 2026-09-24, overlay id/created stripped.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const H = require(path.join(ROOT, 'tests', 'harness.js')); const { load } = H;
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const PRIOR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/measure';
const PRIOR2 = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/measure2';
const PART = process.env.PART || 'none';
const TREES = { V228:F('v228.html'), SL2:F('sl2.html'), CF4:F('cf4.html'), SL1:F('sl1.html') };
const CUE = / — hold RPE 7, (two|three) in the tank$/;
const R7T = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const TESTT = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const HOLDT = 'Your injury plan holds this one at RPE 7.';
const START = '2026-08-24', CLOCK = '2026-09-24', FROM = '2026-09-21', FROM_THU = '2026-09-24';
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const withInj = (inj, extra) => { const c = Object.assign(clone(MARIO), extra || {}); if(inj) c.injury = inj; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }), lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }),
  lowback_bw:withInj({ region:'lowback', tier:'workaround' }, { equipment:'bodyweight' }),
  strength6:withInj({ region:'knee', tier:'workaround' }, { liftingFocus:'strength' }), mario_noinj:withInj(null) };
const CAP = { knee:{ workaround:['squat','lunge','leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat','lunge'], protect:['squat'] }, hip:{ workaround:['hinge','lunge','hip_ext','squat'], protect:['squat'] }, lowback:{ workaround:['hinge','squat','row','hip_ext'], protect:['squat','hip_ext'] }, shoulder:{ workaround:['hpress','vpress','delt_iso'], protect:[] }, elbow:{ workaround:['hpress','tri_iso','bi_iso','row','vpull'], protect:['row','vpull'] } };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const rpeMax = d => { const v = [...String(d || '').matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)); return v.length ? Math.max(...v) : null; };
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const P = s => console.log(s);
function pin(IA, off){ const T = new Date(CLOCK + 'T12:00:00').getTime() + (off || 0); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};popFire=function(){};try{closeRestSheet=function(){};}catch(e){}"
  + "globalThis.__dayLists=function(w,d){var day=activeProg.weeks[w]&&activeProg.weeks[w][d];var out=[];if(!day||day.rest||!day.sections)return {stamp:null,rows:out};day.sections.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it||!it.name)return;var p=_pattern(it.name);if(p){var c=swapCandidates(it.name,day,w,activeProg);out.push({si:si,ii:ii,n:it.name,k:'pat',L:c.tier1.concat(c.tier2)});}else if(_auxFamily(it.name)){out.push({si:si,ii:ii,n:it.name,k:'aux',L:auxSwapCandidates(it.name,day,activeProg).slice()});}});});var a=addCandidates(day,w,activeProg);out.push({si:-1,ii:-1,n:'(add)',k:'add',L:[].concat(a.gap.map(function(x){return 'g:'+x;}),a.more.map(function(x){return 'm:'+x;}),a.off.map(function(x){return 'o:'+x;}))});return {stamp:day._ovKey||null,rows:out};};"
  + "globalThis.__judge=function(names,cfg){return names.filter(function(n){return !_swapInjuryOK(n,cfg);});};";
function fresh(t, off){ const X = load(TREES[t]); pin(X, off); E(X, HELP); return X; }
function setup(IA, st){ IA.localStorage.clear(); IA.ctx.__SP = JSON.parse(st); E(IA, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function bootFrom(src, dst){ const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function stripClock(j){ const o = JSON.parse(j); (o.overlays || []).forEach(v => { delete v.id; delete v.created; }); return JSON.stringify(o); }
// stored program: CFG = injured cfg stored (fixture presentation); OV = uninjured build + the app's writer applyInjuryDraft
const _st = {};
function storedFor(t, key, cfg, pres, from){ const k = t + '_' + key + '_' + pres + '_' + (from || FROM); if(_st[k]) return _st[k]; const f = F('stored_' + k + '.json'); if(fs.existsSync(f)) return (_st[k] = fs.readFileSync(f, 'utf8'));
  const X = fresh(t); const base = clone(cfg); delete base.injury; const c = pres === 'CFG' ? clone(cfg) : base;
  const p = X.buildProgram(clone(c)); const s = clone(p); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(c) }); let j = JSON.stringify(s);
  if(pres === 'OV' && cfg.injury){ setup(X, j); E(X, "_ovDraft.injRegion=" + JSON.stringify(cfg.injury.region) + ";_ovDraft.injTier=" + JSON.stringify(cfg.injury.tier) + ";_ovDraft.from='" + (from || FROM) + "';applyInjuryDraft();");
    j = JSON.stringify(JSON.parse(E(X, "localStorage.getItem('ia_programs')")).find(x => x.id === 'PM')); }
  fs.writeFileSync(f, j); return (_st[k] = j); }
const lists = (IA, w, d) => JSON.parse(E(IA, 'JSON.stringify(__dayLists(' + w + ',"' + d + '"))'));
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
function judgeMk(){ const J = fresh('V228'); const memo = new Map(); return (names, cfg) => { const key = JSON.stringify(cfg.injury) + '|' + cfg.equipment + '|' + cfg.experience + '|' + cfg.ageBracket; const out = [];
  names.forEach(n0 => { const n = n0.replace(/^[gmo]:/, ''); const mk = key + '|' + n; if(!memo.has(mk)){ J.ctx.__nn = [n]; J.ctx.__cc = cfg; memo.set(mk, Array.from(E(J, '__judge(__nn,__cc)')).length > 0); } if(memo.get(mk)) out.push(n0); }); return out; }; }

// ─── TREES: build every tree copy; CF4 surgery anchor-asserted ───
if(PART === 'trees'){
  const sh = c => cp.execSync(c, { cwd:ROOT, encoding:'utf8', maxBuffer:1 << 28 });
  ['v228.html','v226.html','sl2.html','sl1.html','cf4.html'].forEach(n => { if(fs.existsSync(F(n))) fs.unlinkSync(F(n)); });
  fs.writeFileSync(F('v228.html'), sh('git show HEAD:index.html')); fs.writeFileSync(F('v226.html'), sh('git show 637bc8e:index.html'));
  fs.copyFileSync(path.join(ROOT, 'index.html'), F('sl2.html'));
  // SL1 = V228 + builder slice 1 only (the edit script re-pointed at the scratch copy; its asserts run unchanged)
  fs.copyFileSync(F('v228.html'), F('sl1.html')); const s1 = fs.readFileSync(path.join(ROOT, 'tests', 'edits', 'v229_s1_d193_clamp.py'), 'utf8');
  const ip = "P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')"; if(s1.split(ip).length !== 2) throw new Error('slice-1 path anchor count != 1');
  fs.writeFileSync(F('s1_retarget.py'), s1.replace(ip, "P = pathlib.Path('" + F('sl1.html') + "')")); P('slice-1 on scratch copy: ' + sh('python3 ' + F('s1_retarget.py')).trim().split('\n').slice(-2).join(' / '));
  // CF4 surgery
  let src = fs.readFileSync(F('sl2.html'), 'utf8'); const cnt = (s, a) => s.split(a).length - 1;
  if(cnt(src, '_dayPlanCfg') !== 0) throw new Error('_dayPlanCfg already present');
  const HELPER = "// D194 R1 (P-INJLENS), measure CF4 reading: the plan that governs a card is the plan of the day the card is on.\n"
    + "// Outside buildProgram the injury is read off the day's own overlay stamp (_ovKey via dayOverlayInfo, the carrier\n"
    + "// swapUniverseFor already keys on). A day whose stamp carries no injury key (no stamp, or a travel stamp) keeps\n"
    + "// prog.cfg's injury, which is what that day's build used. Injury only: every other field is prog.cfg's.\n"
    + "function _dayPlanCfg(prog,day){\n  const base=(prog&&prog.cfg)||{};\n  const ov=dayOverlayInfo(day);\n"
    + "  if(!ov||!ov.patch||!Object.prototype.hasOwnProperty.call(ov.patch,'injury')) return base;\n"
    + "  return Object.assign({},base,{injury:ov.patch.injury});\n}\n";
  const EDITS = [
    ["// Survives the athlete's injury plan? Wrapped as a throwaway section so the real\n", HELPER + "// Survives the athlete's injury plan? Wrapped as a throwaway section so the real\n"],
    ["function swapCandidates(outName,day,week,prog){\n  const cfg=(prog&&prog.cfg)||{};\n", "function swapCandidates(outName,day,week,prog){\n  const cfg=_dayPlanCfg(prog,day);   // D194 R1\n"],
    ["function auxSwapCandidates(outName,day,prog){\n  const fam=_auxFamily(outName); if(!fam) return [];\n  const cfg=(prog&&prog.cfg)||{};\n", "function auxSwapCandidates(outName,day,prog){\n  const fam=_auxFamily(outName); if(!fam) return [];\n  const cfg=_dayPlanCfg(prog,day);   // D194 R1 (equipment unchanged: injury only)\n"],
    ["function addCandidates(day,week,prog){\n  const cfg=(prog&&prog.cfg)||{};\n", "function addCandidates(day,week,prog){\n  const cfg=_dayPlanCfg(prog,day);   // D194 R1\n"] ];
  EDITS.forEach(([a], i) => { const n = cnt(src, a); P('CF4 anchor E' + (i + 1) + ' count ' + n); if(n !== 1) throw new Error('anchor E' + (i + 1) + ' count ' + n); });
  EDITS.forEach(([a, b]) => { src = src.replace(a, b); }); fs.writeFileSync(F('cf4.html'), src);
  // remaining prog.cfg reads at the three sites and the two dormant sites, comments stripped
  const L = src.split('\n'); const g = re => L.map((x, i) => [i + 1, x]).filter(([, x]) => re.test(x.replace(/\/\/.*$/, '')));
  P('CF4 _dayPlanCfg sites: ' + g(/_dayPlanCfg/).map(([i, x]) => i + ' ' + x.trim().slice(0, 60)).join(' || '));
  P('CF4 _swapInjuryOK call sites: ' + g(/_swapInjuryOK\(/).map(([i]) => i).join(', ') + ' | activeProg.cfg.injury reads: ' + g(/activeProg\.cfg\.injury|activeProg\.cfg&&activeProg\.cfg\.injury/).map(([i]) => i).join(', ') + ' | prog.cfg.injury reads: ' + g(/[^e]prog\.cfg\.injury|prog\.cfg&&prog\.cfg\.injury/).map(([i]) => i).join(', '));
  for(const t of ['V228','SL2','SL1','CF4']) P('TREE ' + t + ' sha ' + sha(TREES[t]) + ' ia-version ' + (fs.readFileSync(TREES[t], 'utf8').match(/ia-version" content="(\d+)"/) || [])[1]);
  P('TREE V226 sha ' + sha(F('v226.html')) + ' ia-version ' + (fs.readFileSync(F('v226.html'), 'utf8').match(/ia-version" content="(\d+)"/) || [])[1] + ' | working index.html ' + sha(path.join(ROOT, 'index.html')));
  for(const t of ['SL1','CF4']){ const X = load(TREES[t]); P('BOOT ' + t + ' ok, typeof _dayPlanCfg ' + X.eval('typeof _dayPlanCfg')); }
}

// ─── L1 worker: D177 L1 injured slice, W3 + W5 lists (swap, aux, add) in OV and CFG presentations, one tree ───
if(process.env.LW){
  const [t, lo, hi] = process.env.LW.split(':'); const L1 = JSON.parse(fs.readFileSync(path.join(PRIOR, 'in', 'gate_rows_V227.json.l1'), 'utf8'));
  const judge = judgeMk(); const O = fresh(t), C = fresh(t); const res = [];
  for(let ci = +lo; ci < Math.min(+hi, L1.length); ci++){ const cfg = L1[ci]; if(!cfg.injury) continue;
    setup(O, storedFor(t, 'L' + ci, cfg, 'OV')); setup(C, storedFor(t, 'L' + ci, cfg, 'CFG'));
    for(const w of [3, 5]) for(const d of DAYS){ const lo_ = lists(O, w, d), lc = lists(C, w, d); const cm = new Map(lc.rows.map(r => [r.k + r.si + '_' + r.ii + r.n, r.L]));
      lo_.rows.forEach(r => { const Lc = cm.has(r.k + r.si + '_' + r.ii + r.n) ? cm.get(r.k + r.si + '_' + r.ii + r.n) : null;
        res.push({ ci, reg:cfg.injury.region + '/' + cfg.injury.tier, eq:cfg.equipment, exp:cfg.experience, w, d, si:r.si, ii:r.ii, n:r.n, k:r.k, stamp:!!lo_.stamp, O:r.L, C:Lc, rejO:judge(r.L, cfg), rejC:Lc ? judge(Lc, cfg) : null }); }); } }
  fs.writeFileSync(F('res_L_' + t + '_' + lo + '.json'), JSON.stringify(res)); console.log('L worker ' + process.env.LW + ' ' + res.length); process.exit(0);
}
// ─── chain worker (copied from v229_overlay_injury.js mode S, unchanged semantics) ───
const slotOf = (IA, w, d, si, ii) => JSON.parse(E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";var it=dy&&dy.sections[" + si + "]&&dy.sections[" + si + "].items[" + ii + "];return it?JSON.stringify({n:it.name,d:it.detail||'',h:(typeof it._preHold==='string')?it._preHold:null}):JSON.stringify({n:'(none)',d:'',h:null});})()"));
function hop(IA, c, to){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); IA.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:cur.n, detail:cur.d }; IA.ctx.__to = to; E(IA, '__T.length=0;'); let bad = 0;
  try { E(IA, '_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ bad = 1; } const after = slotOf(IA, c.w, c.d, c.si, c.ii); if(clean(after.n) !== clean(to)) bad = 1; return { d:after.d, n:after.n, h:after.h, t:Array.from(E(IA, '__T')).join(' / '), bad }; }
function undoLast(IA, c){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); const chip = E(IA, 'swapOriginOf(' + JSON.stringify(cur.n) + ')') || ''; let err = null; if(chip){ try { E(IA, 'undoSwap(' + JSON.stringify(chip) + ');'); } catch(e){ err = e.message; } } return { chip, err, slot:slotOf(IA, c.w, c.d, c.si, c.ii) }; }
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
    for(const c of batch){ const u = undoLast(A, c); r[c.id].undo = u.slot; }
    bootFrom(A, B3); for(const c of batch) r[c.id].undoBoot = slotOf(B3, c.w, c.d, c.si, c.ii);
    batch.forEach(c => res.push(r[c.id])); }
  fs.writeFileSync(F('res_C_' + t + '_' + ck + '_' + pres + '.json'), JSON.stringify(res)); console.log('C worker ' + process.env.CW + ' ' + res.length); process.exit(0);
}
function runJobs(env, jobs, par){ let i = 0; const t0 = Date.now(); const runOne = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { [env]:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { console.log(code ? 'WORKER CRASH ' + j + ' ' + o.slice(-600) : o.trim() + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  return Promise.all(Array.from({ length:par }, async () => { while(i < jobs.length){ await runOne(jobs[i++]); } })).then(() => console.log('jobs done ' + jobs.length + ' in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s')); }
if(PART === 'l1'){ const jobs = []; for(const t of ['V228','SL2','CF4']) for(let lo = 0; lo < 384; lo += 24) jobs.push(t + ':' + lo + ':' + (lo + 24)); runJobs('LW', jobs, +(process.env.PAR || 10)); }
if(PART === 'chains'){ const jobs = []; for(const ck of ['elbow_wa','shoulder_wa','lowback_wa','hip_wa','knee_protect','mario','ankle_wa']){ for(const t of ['V228','SL2','CF4']) jobs.push(t + ':' + ck + ':OV'); jobs.push('CF4:' + ck + ':CFG'); } runJobs('CW', jobs, +(process.env.PAR || 10)); }
module.exports = { CFGS };

// ─── SINGLE: named programs, every tree ───
const T3 = ['V228','SL2','CF4'];
const lensOf = (IA, w, d) => E(IA, "typeof _dayPlanCfg==='function'?JSON.stringify((_dayPlanCfg(activeProg,activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ").injury)||null):'(no helper)'");
const stampOf = (IA, w, d) => E(IA, "(activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + "&&activeProg.weeks[" + w + "]." + d + "._ovKey)||null");
function weekLists(IA, w){ const o = {}; DAYS.forEach(d => { o[d] = lists(IA, w, d); }); return o; }
function rejSummary(WL, cfg, judge, kinds){ let offers = 0, rej = 0, cards = 0, n = 0; const ex = [];
  Object.keys(WL).forEach(d => WL[d].rows.filter(r => kinds.includes(r.k)).forEach(r => { n++; offers += r.L.length; const j = judge(r.L, cfg); rej += j.length; if(j.length){ cards++; ex.push(d + ' ' + clean(r.n) + ' [' + r.k + ']: ' + j.join(', ')); } }));
  return { n, offers, rej, cards, ex }; }
function eqLists(A, B, days){ let n = 0, eq = 0; const ex = []; (days || DAYS).forEach(d => { const a = A[d].rows, b = B[d].rows; const m = new Map(b.map(r => [r.k + r.si + '_' + r.ii + r.n, JSON.stringify(r.L)]));
  a.forEach(r => { n++; const k = r.k + r.si + '_' + r.ii + r.n; if(m.get(k) === JSON.stringify(r.L)) eq++; else if(ex.length < 3) ex.push(d + ' ' + clean(r.n) + ' [' + r.k + '] A=' + JSON.stringify(r.L) + ' B=' + JSON.stringify(m.get(k) || null)); }); if(b.length !== a.length && ex.length < 3) ex.push(d + ' row count ' + a.length + ' vs ' + b.length); });
  return { n, eq, ex }; }
if(PART === 'single'){
  const judge = judgeMk(); const KN = CFGS.mario;
  // A. baseline equals itself
  for(const t of T3){ const k1 = F('stored_' + t + '_S_base_a.json'), k2 = F('stored_' + t + '_S_base_b.json'); [k1, k2].forEach(f => { if(fs.existsSync(f)) fs.unlinkSync(f); });
    const a = storedFor(t, 'S_base_a', KN, 'OV'), b = storedFor(t, 'S_base_b', KN, 'OV'); const X = fresh(t), Y = fresh(t); setup(X, a); setup(Y, a);
    const la = JSON.stringify([weekLists(X, 3), weekLists(X, 5)]), lb = JSON.stringify([weekLists(Y, 3), weekLists(Y, 5)]);
    P('[A] BASELINE ' + t + ' two independent OV writes equal after id/created strip: ' + (stripClock(a) === stripClock(b)) + ' (' + a.length + ' bytes) | raw equal (clock pinned) ' + (a === b) + ' | two VMs, same record: weeks equal ' + (E(X, 'JSON.stringify(activeProg.weeks)') === E(Y, 'JSON.stringify(activeProg.weeks)')) + ', W3+W5 lists equal ' + (la === lb) + ' (' + la.length + ' bytes, non-empty ' + (la.length > 1000) + ')');
    const pf = path.join(PRIOR2, 'stored_' + t + '_mario_OV.json'); if(fs.existsSync(pf)) P('    cross-session: measure2 stored_' + t + '_mario_OV == this session (strip) ' + (stripClock(fs.readFileSync(pf, 'utf8')) === stripClock(a))); }
  const R = {};
  // B/C. mario OV + CFG, W3/W5
  for(const t of T3){ const X = fresh(t), Y = fresh(t); setup(X, storedFor(t, 'S_mario', KN, 'OV')); setup(Y, storedFor(t, 'S_mario', KN, 'CFG'));
    R[t] = { mOV3:weekLists(X, 3), mOV5:weekLists(X, 5), mCF3:weekLists(Y, 3), mCF5:weekLists(Y, 5), stamps5:DAYS.map(d => d + ':' + (stampOf(X, 5, d) ? 'S' : '-')).join(' '), stamps3:DAYS.filter(d => stampOf(X, 3, d)).length,
      cfgInj:E(X, 'JSON.stringify(activeProg.cfg.injury||null)'), lens5thu:lensOf(X, 5, 'thu'), lens3thu:lensOf(X, 3, 'thu') };
    const s = rejSummary(R[t].mOV5, KN, judge, ['pat']), a = rejSummary(R[t].mOV5, KN, judge, ['aux']), d = rejSummary(R[t].mOV5, KN, judge, ['add']), sc = rejSummary(R[t].mCF5, KN, judge, ['pat','aux','add']);
    P('\n[p] mario knee/wa OV ' + t + ' | activeProg.cfg.injury ' + R[t].cfgInj + ' | W5 stamps ' + R[t].stamps5 + ' | W3 stamped days ' + R[t].stamps3 + ' | lens W5 thu ' + R[t].lens5thu + ' W3 thu ' + R[t].lens3thu);
    P('    W5 swap (patterned) cards ' + s.n + ': rejected ' + s.rej + ' of ' + s.offers + ' offers, cards with >=1 ' + s.cards + (s.ex.length ? ' -> ' + s.ex.join(' ; ') : ''));
    P('    W5 aux cards ' + a.n + ': rejected ' + a.rej + ' of ' + a.offers + (a.ex.length ? ' -> ' + a.ex.join(' ; ') : '') + ' | add picker days ' + d.n + ': rejected ' + d.rej + ' of ' + d.offers + (d.ex.length ? ' -> ' + d.ex.join(' ; ') : ''));
    const eq = eqLists(R[t].mOV5, R[t].mCF5); P('    W5 OV lists == CFG (fixture) lists on same tree: ' + eq.eq + '/' + eq.n + (eq.ex.length ? ' e.g. ' + eq.ex.join(' ; ') : '') + ' | fixture W5 rejected ' + sc.rej + ' of ' + sc.offers); }
  for(const t of ['SL2','CF4']){ const e3 = eqLists(R[t].mOV3, R.V228.mOV3), e5 = eqLists(R[t].mOV5, R.V228.mOV5), c3 = eqLists(R[t].mCF3, R.V228.mCF3), c5 = eqLists(R[t].mCF5, R.V228.mCF5);
    P('[p] mario ' + t + ' vs V228: OV W3 (pre-from) ' + e3.eq + '/' + e3.n + ' | OV W5 ' + e5.eq + '/' + e5.n + (e5.ex.length && t === 'CF4' ? ' (moved: ' + e5.ex.join(' ; ') + ')' : '') + ' | fixture W3 ' + c3.eq + '/' + c3.n + ' | fixture W5 ' + c5.eq + '/' + c5.n); }
  // D. Thursday-from
  const TH = {}; for(const t of T3){ const X = fresh(t); setup(X, storedFor(t, 'S_mario_thu', KN, 'OV', FROM_THU)); TH[t] = weekLists(X, 5);
    P('\n[p] Thursday-from (' + FROM_THU + ') ' + t + ' W5 stamps ' + DAYS.map(d => d + ':' + (stampOf(X, 5, d) ? 'S' : '-')).join(' ') + ' | lens ' + DAYS.map(d => d + ':' + lensOf(X, 5, d).replace(/"region":|"tier":|[{}"]/g, '')).join(' '));
    DAYS.forEach(d => { if(!TH[t][d].rows.length) return; const r = rejSummary({ [d]:TH[t][d] }, KN, judge, ['pat','aux','add']); P('    ' + d + ' cards ' + r.n + ' rejected ' + r.rej + ' of ' + r.offers + (r.ex.length ? ' -> ' + r.ex.join(' ; ') : '')); }); }
  for(const t of ['SL2','CF4']){ P('[p] Thursday-from ' + t + ' vs V228 per day: ' + DAYS.filter(d => TH[t][d].rows.length).map(d => { const e = eqLists({ [d]:TH[t][d] }, { [d]:TH.V228[d] }, [d]); return d + ' ' + e.eq + '/' + e.n; }).join(' | ')); }
  // E. uninjured programs
  const MANNY = clone(H.fixtures.HALF_MANNY); P('\n[p] HALF_MANNY fixture seed ' + MANNY.seed + ' injury ' + JSON.stringify(MANNY.injury || null));
  const U = {}; for(const t of T3){ U[t] = {}; for(const [nm, cfg] of [['HALF_MANNY', MANNY], ['mario_noinj', CFGS.mario_noinj]]){ const X = fresh(t); setup(X, storedFor(t, 'S_' + nm, cfg, 'OV')); U[t][nm] = { w3:weekLists(X, 3), w5:weekLists(X, 5) }; } }
  for(const t of ['SL2','CF4']) for(const nm of ['HALF_MANNY','mario_noinj']){ const a = eqLists(U[t][nm].w3, U.V228[nm].w3), b = eqLists(U[t][nm].w5, U.V228[nm].w5); P('[p] uninjured ' + nm + ' ' + t + ' vs V228 lists: W3 ' + a.eq + '/' + a.n + ' | W5 ' + b.eq + '/' + b.n + (a.ex.concat(b.ex).length ? ' e.g. ' + a.ex.concat(b.ex).join(' ; ') : '')); }
  // F. travel-only overlay
  const TV = {}; for(const t of T3){ const X = fresh(t); setup(X, storedFor(t, 'S_mario_noinj', CFGS.mario_noinj, 'OV')); E(X, "_ovDraft.equipment='minimal';_ovDraft.from='2026-09-22';_ovDraft.to='2026-09-24';applyOverlayDraft();");
    TV[t] = weekLists(X, 5); TV[t].__st = DAYS.map(d => d + ':' + (stampOf(X, 5, d) ? JSON.parse(stampOf(X, 5, d))[0] : '-')).join(' '); TV[t].__lens = lensOf(X, 5, 'tue');
    P('\n[p] travel-only (minimal, 09-22..09-24) on mario_noinj ' + t + ' W5 stamps ' + TV[t].__st + ' | lens tue ' + TV[t].__lens); }
  for(const t of ['SL2','CF4']){ const st = DAYS.filter(d => /substitute/.test(TV[t].__st.split(' ').find(x => x.startsWith(d)) || '')); const e = eqLists(TV[t], TV.V228, st), all = eqLists(TV[t], TV.V228); P('[p] travel-only ' + t + ' vs V228: stamped days (' + st.join(',') + ') ' + e.eq + '/' + e.n + ' | whole W5 ' + all.eq + '/' + all.n); }
  // G. bridge + halfstep (imBackFromInjury on the mario OV program, clock +60 s for distinct ids)
  const BR = {}; for(const t of T3){ const X = fresh(t); setup(X, storedFor(t, 'S_mario', KN, 'OV')); pin(X, 60000); const id = E(X, "activeProg.overlays.find(function(o){return o.type==='injury';}).id"); let err = null; try { E(X, 'imBackFromInjury(' + JSON.stringify(id) + ');'); } catch(e){ err = e.message; }
    const ovs = JSON.parse(E(X, 'JSON.stringify(activeProg.overlays.map(function(o){return {type:o.type,from:o.from,to:o.to,patch:o.patch};}))')); BR[t] = {};
    const st = []; for(const w of [5, 6, 7]) DAYS.forEach(d => { const s = stampOf(X, w, d); if(!s) return; const p = JSON.parse(s)[1].injury || {}; const kind = p.bridge ? 'bridge' : p.halfstep ? 'halfstep' : 'other'; st.push('W' + w + d + ':' + kind); (BR[t][kind] = BR[t][kind] || {})['W' + w + d] = lists(X, w, d); });
    P('\n[p] bridge/halfstep ' + t + (err ? ' ERR ' + err : '') + ' overlays ' + JSON.stringify(ovs) + '\n    stamped days ' + st.join(' ') + ' | lens W5 fri ' + lensOf(X, 5, 'fri') + ' | lens W6 fri ' + lensOf(X, 6, 'fri'));
    const bcfg = Object.assign(clone(KN), { injury:{ region:'knee', tier:'workaround', bridge:true } }), hcfg = Object.assign(clone(KN), { injury:{ region:'knee', tier:'workaround', halfstep:true } });
    if(BR[t].bridge){ const r = rejSummary(BR[t].bridge, KN, judge, ['pat','aux','add']), rb = rejSummary(BR[t].bridge, bcfg, judge, ['pat','aux','add']); P('    bridge days ' + Object.keys(BR[t].bridge).length + ', cards ' + r.n + ': rejected by knee/workaround ' + r.rej + ' of ' + r.offers + ' | by the bridge patch itself ' + rb.rej + (r.ex.length ? ' -> ' + r.ex.slice(0, 4).join(' ; ') : '')); }
    if(BR[t].halfstep){ const r = rejSummary(BR[t].halfstep, hcfg, judge, ['pat','aux','add']), rk = rejSummary(BR[t].halfstep, KN, judge, ['pat','aux','add']); P('    halfstep days ' + Object.keys(BR[t].halfstep).length + ', cards ' + r.n + ': rejected by the halfstep patch ' + r.rej + ' of ' + r.offers + ' | by knee/workaround (contrast) ' + rk.rej); } }
  for(const t of ['SL2','CF4']) for(const kind of ['bridge','halfstep']){ if(!BR[t][kind] || !BR.V228[kind]) { P('[p] ' + kind + ' ' + t + ': no stamped days'); continue; } let n = 0, eq = 0; Object.keys(BR[t][kind]).forEach(k => { const e = eqLists({ x:BR[t][kind][k] }, { x:BR.V228[kind][k] || { rows:[] } }, ['x']); n += e.n; eq += e.eq; }); P('[p] ' + kind + ' ' + t + ' lists == V228 (uninjured read) ' + eq + '/' + n); }
  // H. stacked travel + injury (two creation orders)
  for(const order of ['injury_then_travel','travel_then_injury']) for(const t of T3){ const X = fresh(t); setup(X, storedFor(t, 'S_mario_noinj', CFGS.mario_noinj, 'OV'));
    const inj = () => E(X, "_ovDraft.injRegion='knee';_ovDraft.injTier='workaround';_ovDraft.from='" + FROM + "';applyInjuryDraft();"), trv = () => E(X, "_ovDraft.equipment='minimal';_ovDraft.from='2026-09-22';_ovDraft.to='2026-09-24';applyOverlayDraft();");
    if(order === 'injury_then_travel'){ inj(); pin(X, 60000); trv(); } else { trv(); pin(X, 60000); inj(); }
    const row = ['mon','tue','thu','fri'].map(d => { const s = stampOf(X, 5, d); const r = rejSummary({ [d]:lists(X, 5, d) }, KN, judge, ['pat','aux','add']); const cue = +E(X, "(activeProg.weeks[5]." + d + ".sections||[]).reduce(function(n,s){return n+(s.items||[]).filter(function(i){return / — hold RPE 7, (two|three) in the tank$/.test(i.detail||'');}).length;},0)");
      return d + ' stamp ' + (s ? s.slice(0, 70) : '-') + ' | build cue cards ' + cue + ' | lens ' + lensOf(X, 5, d) + ' | rejected ' + r.rej + '/' + r.offers; });
    P('\n[INFO] stacked ' + order + ' ' + t + ' overlays ' + E(X, "JSON.stringify(activeProg.overlays.map(function(o){return o.type+'@'+o.created;}))") + '\n    ' + row.join('\n    ')); }
  // I. hist-restored trained day
  for(const t of T3){ const X = fresh(t), Y = fresh(t), Z = fresh(t); setup(X, storedFor(t, 'S_mario', KN, 'OV')); E(X, "snapshotDay(5,'tue');"); const snap = JSON.parse(E(X, "localStorage.getItem('ia_hist_PM')") || '{}');
    bootFrom(X, Y); const dayY = E(Y, 'JSON.stringify(activeProg.weeks[5].tue)'); const r = rejSummary({ tue:lists(Y, 5, 'tue') }, KN, judge, ['pat','aux','add']);
    P('\n[INFO] hist ' + t + ': snapshot w5_tue present ' + !!snap.w5_tue + ', snapshot carries _ovKey ' + JSON.stringify((snap.w5_tue || {})._ovKey || null) + ' | booted W5 tue == snapshot ' + (dayY === JSON.stringify(snap.w5_tue)) + ', stamp ' + (stampOf(Y, 5, 'tue') ? 'yes' : 'no') + ', lens ' + lensOf(Y, 5, 'tue') + ', rejected ' + r.rej + '/' + r.offers);
    const id = E(Y, "activeProg.overlays.find(function(o){return o.type==='injury';}).id"); let err = null; try { E(Y, 'confirm=function(){return true;};removeOverlay(' + JSON.stringify(id) + ');'); } catch(e){ err = e.message; }
    bootFrom(Y, Z); const r2 = rejSummary({ tue:lists(Z, 5, 'tue') }, KN, judge, ['pat','aux','add']), r3 = rejSummary({ thu:lists(Z, 5, 'thu') }, KN, judge, ['pat','aux','add']);
    P('    after removeOverlay' + (err ? ' ERR ' + err : '') + ' + boot: overlays ' + E(Z, 'JSON.stringify((activeProg.overlays||[]).length)') + ' | W5 tue (snapshot) stamp ' + (stampOf(Z, 5, 'tue') ? 'yes' : 'no') + ' lens ' + lensOf(Z, 5, 'tue') + ' rejected(knee judge) ' + r2.rej + '/' + r2.offers + ' | W5 thu (no snapshot) stamp ' + (stampOf(Z, 5, 'thu') ? 'yes' : 'no') + ' lens ' + lensOf(Z, 5, 'thu') + ' rejected(knee judge) ' + r3.rej + '/' + r3.offers); }
  // J. (o) build half on overlay programs
  const pc = {}; const PX = fresh('V228'); const pat = n => (n in pc) ? pc[n] : (pc[n] = PX.eval('_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const items = (IA, w) => { const wk = JSON.parse(E(IA, 'JSON.stringify(activeProg.weeks[' + w + '])')); const o = []; DAYS.forEach(d => ((wk[d] && wk[d].sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name) o.push({ d, si, ii, n:it.name, det:it.detail || '' }); }))); return o; };
  for(const ck of ['lowback_bw','mario']){ const cap = CAP[CFGS[ck].injury.region][CFGS[ck].injury.tier];
    for(const t of T3){ const X = fresh(t), Y = fresh(t); setup(X, storedFor(t, 'S_' + ck, CFGS[ck], 'OV')); setup(Y, storedFor(t, 'S_' + ck, CFGS[ck], 'CFG')); const a = items(X, 5), b = items(Y, 5);
      const hi = a.filter(i => cap.includes(pat(i.n)) && rpeMax(i.det) > 7); const same = a.filter((i, k) => b[k] && b[k].n === i.n && b[k].det === i.det).length;
      P('[o] ' + ck + ' OV ' + t + ' W5 cards ' + a.length + ' | capped ' + a.filter(i => cap.includes(pat(i.n))).length + ' | capped RPE>7 ' + hi.length + (hi.length ? ' (' + hi.map(i => i.d + ' ' + clean(i.n) + ' ' + JSON.stringify(i.det.slice(0, 40))).join(' ; ') + ')' : '') + ' | cue ' + a.filter(i => CUE.test(i.det)).length + ' | OV == fixture cards ' + same + '/' + Math.max(a.length, b.length)); } }
  for(const t of T3){ const X = fresh(t), Y = fresh(t); setup(X, storedFor(t, 'S_strength6', CFGS.strength6, 'OV')); setup(Y, storedFor(t, 'S_strength6', CFGS.strength6, 'CFG'));
    const m = (IA, d) => JSON.parse(E(IA, "JSON.stringify((function(){var s=activeProg.weeks[6]&&activeProg.weeks[6]." + d + "&&activeProg.weeks[6]." + d + ".sections[0];var it=s&&s.items[0];return {l:s&&s.label,n:it&&it.name,d:it&&it.detail};})())"));
    const th = m(X, 'thu'), tu = m(X, 'tue'); const a = items(X, 6), b = items(Y, 6); const same = a.filter((i, k) => b[k] && b[k].n === i.n && b[k].det === i.det).length;
    P('[o] strength6 knee/wa OV ' + t + ' totalWeeks ' + E(X, 'activeProg.totalWeeks') + ' | W6 thu ' + JSON.stringify(th.l) + ' == R7 ' + (th.d === R7T) + ', == TEST ' + (th.d === TESTT) + ' | W6 tue ' + JSON.stringify(tu.l) + ' == TEST ' + (tu.d === TESTT) + ', == R7 ' + (tu.d === R7T) + ' | W6 OV == fixture cards ' + same + '/' + Math.max(a.length, b.length)); }
  // K. (q) mario W5 thu hand chain
  const HOPS = ['Barbell hip thrust','Leg extension','Barbell good mornings']; const CH = {};
  for(const t of T3){ const A = fresh(t), B = fresh(t), C = fresh(t); setup(A, storedFor(t, 'S_mario', KN, 'OV')); const thu = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[5].thu)')); let si = -1, ii = -1; thu.sections.forEach((s, x) => (s.items || []).forEach((it, y) => { if(si < 0 && clean(it.name) === 'Single-leg hip thrust'){ si = x; ii = y; } }));
    if(si < 0){ P('[q] chain ' + t + ' FAILED: no Single-leg hip thrust'); continue; } const c = { w:5, d:'thu', si, ii }; const lines = ['start ' + clean(slotOf(A, 5, 'thu', si, ii).n) + ' ' + JSON.stringify(slotOf(A, 5, 'thu', si, ii).d)];
    HOPS.forEach((to, k) => { const h = hop(A, c, to); lines.push('hop' + (k + 1) + ' ' + clean(h.n) + ' ' + JSON.stringify(h.d) + ' | _preHold ' + (h.h === null ? 'none' : JSON.stringify(h.h)) + ' | toast "' + h.t + '"' + (h.bad ? ' BAD' : '')); });
    const rx = []; Object.values(JSON.parse(E(A, "localStorage.getItem('ia_swaps_PM')") || '{}')).forEach(l => (l || []).forEach(e => (e.rx || []).forEach(x => rx.push(x)))); lines.push('record rx ' + rx.length + ' with ph ' + rx.filter(x => 'ph' in x).length);
    bootFrom(A, B); lines.push('BOOT ' + clean(slotOf(B, 5, 'thu', si, ii).n) + ' ' + JSON.stringify(slotOf(B, 5, 'thu', si, ii).d)); const u = undoLast(A, c); lines.push('UNDO ' + clean(u.slot.n) + ' ' + JSON.stringify(u.slot.d) + (u.err ? ' ERR ' + u.err : '')); bootFrom(A, C); lines.push('UNDO+BOOT ' + clean(slotOf(C, 5, 'thu', si, ii).n) + ' ' + JSON.stringify(slotOf(C, 5, 'thu', si, ii).d));
    CH[t] = lines; P('\n[q] mario OV W5 thu chain ' + t + ' [' + si + ',' + ii + ']\n    ' + lines.join('\n    ')); }
  for(const t of ['SL2','CF4']) P('[q] chain ' + t + ' == V228 line by line: ' + (CH[t] && CH.V228 ? CH[t].filter((l, i) => l === CH.V228[i]).length + '/' + CH.V228.length : 'MISSING'));
  // L. HALF_MANNY digest + uninjured builds
  for(const t of T3){ const X = load(TREES[t]); const d1 = H.progDigest(X.buildProgram(clone(H.fixtures.HALF_MANNY))), d2 = H.progDigest(X.buildProgram(clone(H.fixtures.HALF_MANNY))); P('\n[b] HALF_MANNY ' + t + ' digest ' + JSON.stringify(d1).slice(0, 160) + ' | self-stable ' + (JSON.stringify(d1) === JSON.stringify(d2))); }
  const L1 = JSON.parse(fs.readFileSync(path.join(PRIOR, 'in', 'gate_rows_V227.json.l1'), 'utf8')); const UN = L1.filter(c => !c.injury).concat([clone(MARIO), clone(H.fixtures.HALF_MANNY)]);
  const BX = {}; T3.forEach(t => { BX[t] = fresh(t); }); let n = 0, eqS = 0, eqC = 0; UN.forEach(c => { n++; const j = T3.map(t => JSON.stringify(BX[t].buildProgram(clone(c)))); if(j[1] === j[0]) eqS++; if(j[2] === j[0]) eqC++; });
  P('[b] uninjured builds (L1 uninjured + MARIO + HALF_MANNY) byte-identical to V228: SL2 ' + eqS + '/' + n + ' | CF4 ' + eqC + '/' + n);
}

// ─── REPORT: L1 lists and D190 chains ───
if(PART === 'report'){
  const LR = {}; for(const t of T3){ LR[t] = []; let miss = 0; for(let lo = 0; lo < 384; lo += 24){ const f = F('res_L_' + t + '_' + lo + '.json'); if(!fs.existsSync(f)){ miss++; continue; } JSON.parse(fs.readFileSync(f)).forEach(r => LR[t].push(r)); } P('[p] L1 ' + t + ' rows ' + LR[t].length + ' from ' + (16 - miss) + '/16 chunk files, injured cfgs ' + new Set(LR[t].map(r => r.ci)).size); }
  const key = r => r.ci + '|' + r.w + '|' + r.d + '|' + r.k + '|' + r.si + '|' + r.ii + '|' + r.n; const S = (A, f) => A.reduce((n, r) => n + f(r), 0); const C = (A, f) => A.filter(f).length;
  for(const k of ['pat','aux','add']){ P('\n[p] L1 W5 kind=' + k + ' (pat = swapCandidates tier1+tier2; aux = auxSwapCandidates incl. _powerAllowed; add = addCandidates gap+more+off per day)');
    for(const t of T3){ const A = LR[t].filter(r => r.w === 5 && r.k === k);
      P('  ' + t + ' cards ' + A.length + ' (stamped ' + C(A, r => r.stamp) + ') | rejected offered ' + S(A, r => r.rejO.length) + ' of ' + S(A, r => r.O.length) + ' | cards >=1 rejected ' + C(A, r => r.rejO.length > 0) + ' | prior def (OV-only extras that are rejected) ' + S(A, r => r.rejO.filter(n => !(r.C || []).includes(n)).length)
        + ' | OV list == fixture list ' + C(A, r => r.C && JSON.stringify(r.O) === JSON.stringify(r.C)) + '/' + C(A, r => r.C) + ' | OV longer ' + C(A, r => r.C && r.O.length > r.C.length) + ' | fixture rejected ' + S(A, r => (r.rejC || []).length));
      const bad = A.filter(r => r.rejO.length > 0); if(bad.length) P('     cards>=1 by reg ' + fmt(tally(bad, r => r.reg)) + ' || by eq ' + fmt(tally(bad, r => r.eq)) + ' || by exp ' + fmt(tally(bad, r => r.exp)));
      if(t === 'CF4') bad.slice(0, 5).forEach(r => P('     CF4 residual: cfg ' + r.ci + ' ' + r.reg + ' ' + r.eq + ' W5 ' + r.d + ' ' + clean(r.n) + ' offers ' + r.rejO.join(', ') + ' stamp ' + r.stamp));
      const ne = A.filter(r => r.C && JSON.stringify(r.O) !== JSON.stringify(r.C)); if(t === 'CF4' && ne.length) ne.slice(0, 4).forEach(r => P('     CF4 OV!=fixture: cfg ' + r.ci + ' ' + r.reg + ' W5 ' + r.d + ' ' + clean(r.n) + ' OV ' + JSON.stringify(r.O) + ' FIX ' + JSON.stringify(r.C))); } }
  P('\n[p] W3 stamped rows: ' + T3.map(t => t + ' ' + C(LR[t].filter(r => r.w === 3), r => r.stamp) + '/' + C(LR[t], r => r.w === 3)).join(' | '));
  for(const t of ['SL2','CF4']){ const m = new Map(LR.V228.map(r => [key(r), r])); for(const w of [3, 5]){ const A = LR[t].filter(r => r.w === w); let eqO = 0, eqC = 0, nC = 0, miss = 0;
      A.forEach(r => { const b = m.get(key(r)); if(!b){ miss++; return; } if(JSON.stringify(r.O) === JSON.stringify(b.O)) eqO++; if(r.C && b.C){ nC++; if(JSON.stringify(r.C) === JSON.stringify(b.C)) eqC++; } });
      P('[p] L1 ' + t + ' vs V228 W' + w + ': OV lists equal ' + eqO + '/' + A.length + ' | fixture lists equal ' + eqC + '/' + nC + ' | rows absent on V228 ' + miss + ' | by kind OV equal ' + ['pat','aux','add'].map(k => k + ' ' + C(A.filter(r => r.k === k), r => { const b = m.get(key(r)); return b && JSON.stringify(r.O) === JSON.stringify(b.O); }) + '/' + C(A, r => r.k === k)).join(' ')); } }
  { const m = new Map(LR.V228.map(r => [key(r), r])); const mv = LR.CF4.filter(r => r.w === 5 && m.get(key(r)) && JSON.stringify(r.O) !== JSON.stringify(m.get(key(r)).O));
    const onlyDrop = mv.filter(r => { const b = m.get(key(r)).O; const removed = b.filter(n => !r.O.includes(n)); return removed.length > 0 && removed.every(n => m.get(key(r)).rejO.includes(n)); });
    P('[p] CF4 W5 OV lists that moved vs V228 ' + mv.length + ' | every removed name was a rejected name ' + onlyDrop.length + '/' + mv.length + ' | moved on unstamped day ' + C(mv, r => !r.stamp) + ' | names added (backfill under the slice cap) ' + S(mv, r => r.O.filter(n => !m.get(key(r)).O.includes(n)).length) + ', of which rejected ' + S(mv, r => r.O.filter(n => !m.get(key(r)).O.includes(n) && r.rejO.includes(n)).length)); }
  // chains
  const CK = ['elbow_wa','shoulder_wa','lowback_wa','hip_wa','knee_protect','mario','ankle_wa']; const rd = (t, ck, pr, dir) => { const f = path.join(dir || SCR, 'res_C_' + t + '_' + ck + '_' + pr + '.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : null; };
  const cols = (a, b) => ({ live:a.live.d !== b.live.d || a.live.n !== b.live.n, toast:a.toasts.join('|') !== b.toasts.join('|'), boot:a.boot.d !== b.boot.d || a.boot.n !== b.boot.n, undo:a.undo.d !== b.undo.d || a.undo.n !== b.undo.n, undoBoot:a.undoBoot.d !== b.undoBoot.d || a.undoBoot.n !== b.undoBoot.n, start:a.start.d !== b.start.d || a.start.n !== b.start.n, kept:a.kept.join() !== b.kept.join(), ph:a.ph !== b.ph });
  const cmp = (lbl, ta, pa, tb, pb, w, dirB, only) => { const d = {}; let n = 0, miss = 0; const per = {};
    CK.forEach(ck => { const A = rd(ta, ck, pa), B0 = rd(tb, ck, pb, dirB); if(!A || !B0){ miss++; return; } const B = new Map(B0.map(r => [r.id, r]));
      A.filter(r => r.w === w).forEach(r => { const b = B.get(r.id); if(!b){ miss++; return; } n++; const f = cols(r, b); const fl = only ? only : Object.keys(f); let any = false; fl.forEach(k => { if(f[k]){ d[k] = (d[k] || 0) + 1; any = true; } }); if(any){ d.any = (d.any || 0) + 1; per[ck] = (per[ck] || 0) + 1; } }); });
    P('[q] ' + lbl + ' W' + w + ': n=' + n + (miss ? ' MISSING ' + miss : '') + ' | ' + fmt(d) + (Object.keys(per).length ? ' | per cfg ' + fmt(per) : '')); };
  P('');
  for(const w of [5, 3]){ cmp('V228 OV (this session) vs V228 OV (measure2 run) [baseline self]', 'V228', 'OV', 'V228', 'OV', w, PRIOR2, ['live','toast','boot','undo','undoBoot','start']);
    cmp('SL2 OV vs V228 OV', 'SL2', 'OV', 'V228', 'OV', w); cmp('CF4 OV vs V228 OV', 'CF4', 'OV', 'V228', 'OV', w); cmp('CF4 OV vs SL2 OV', 'CF4', 'OV', 'SL2', 'OV', w);
    cmp('CF4 OV vs CF4 fixture: start card only', 'CF4', 'OV', 'CF4', 'CFG', w, null, ['start']); }
  { let n = 0, hold = 0, ph = 0, kept = 0; CK.forEach(ck => { const A = rd('CF4', ck, 'OV'); if(!A) return; A.filter(r => r.w === 5).forEach(r => { n++; if(r.toasts.some(x => x.indexOf(HOLDT) >= 0)) hold++; if(r.kept.some(Boolean)) kept++; ph += r.ph; }); });
    P('[q] CF4 OV W5 chains ' + n + ': hold toasts ' + hold + ' | _preHold kept ' + kept + ' | ph entries ' + ph); }
}
// ─── REPORT2: the moved CF4 lists whose removed names include a name the judge accepts ───
if(PART === 'report2'){ const L = t => { const R = []; for(let lo = 0; lo < 384; lo += 24) JSON.parse(fs.readFileSync(F('res_L_' + t + '_' + lo + '.json'))).forEach(r => R.push(r)); return R; };
  const key = r => r.ci + '|' + r.w + '|' + r.d + '|' + r.k + '|' + r.si + '|' + r.ii + '|' + r.n; const m = new Map(L('V228').map(r => [key(r), r]));
  const rows = L('CF4').filter(r => r.w === 5).map(r => ({ r, b:m.get(key(r)) })).filter(x => x.b && JSON.stringify(x.r.O) !== JSON.stringify(x.b.O)).map(x => ({ ...x, rmOK:x.b.O.filter(n => !x.r.O.includes(n) && !x.b.rejO.includes(n)) })).filter(x => x.rmOK.length);
  P('[p] moved lists removing a judge-accepted name: ' + rows.length + ' | by kind ' + fmt(tally(rows, x => x.r.k)) + ' | by reg ' + fmt(tally(rows, x => x.r.reg)) + ' | removed names ' + fmt(tally(rows.flatMap(x => x.rmOK.map(n => ({ n }))), y => y.n)));
  const J = fresh('V228'); rows.slice(0, 4).forEach(x => { const n = x.rmOK[0].replace(/^[gmo]:/, ''); J.ctx.__n = n; const L1 = JSON.parse(fs.readFileSync(path.join(PRIOR, 'in', 'gate_rows_V227.json.l1'), 'utf8')); const c = L1[x.r.ci]; J.ctx.__c = c;
    P('    e.g. cfg ' + x.r.ci + ' ' + x.r.reg + ' ' + x.r.eq + ' ' + x.r.exp + ' W5 ' + x.r.d + ' ' + clean(x.r.n) + ' [' + x.r.k + '] removed ' + x.rmOK.join(', ') + ' | _powerAllowed(' + n + ', injured) ' + E(J, '_powerAllowed(__n,__c.experience,__c.injury,__c.ageBracket)') + ' uninjured ' + E(J, '_powerAllowed(__n,__c.experience,null,__c.ageBracket)') + ' | in fixture list ' + (x.r.C || []).includes(x.rmOK[0])); }); }
// ─── DU: g227 row d-U residue, field-level diff on the gate's first named case (fixture presentation, knee/wa) ───
if(PART === 'du'){
  const diff = (a, b, p, out) => { if(JSON.stringify(a) === JSON.stringify(b)) return out; if(a && b && typeof a === 'object' && typeof b === 'object'){ new Set(Object.keys(a).concat(Object.keys(b))).forEach(k => diff(a[k], b[k], p + '.' + k, out)); } else out.push(p + ': before ' + JSON.stringify(a) + ' | after undo ' + JSON.stringify(b)); return out; };
  for(const [w, d, from, to] of [[3, 'mon', 'Incline barbell press', 'Barbell push press'], [3, 'fri', 'Toes-to-bar', 'Band woodchopper (door anchor)'], [5, 'thu', 'Single-leg hip thrust', 'Barbell hip thrust']]) for(const pres of ['CFG','OV']) for(const t of ['V228','SL1','SL2','CF4']){
    const A = fresh(t); setup(A, storedFor(t, 'S_mario', CFGS.mario, pres)); const day = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')')); let si = -1, ii = -1; day.sections.forEach((s, x) => (s.items || []).forEach((it, y) => { if(si < 0 && clean(it.name) === from){ si = x; ii = y; } }));
    if(si < 0){ P('[du] ' + t + ' ' + pres + ' W' + w + ' ' + d + ': ' + from + ' not on day'); continue; }
    const before = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + '.sections)')); const c = { w, d, si, ii }; const h = hop(A, c, to); const u = undoLast(A, c); const after = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + '.sections)'));
    const df = diff(before, after, 'sections', []); P('[du] ' + t + ' ' + pres + ' W' + w + ' ' + d + ' ' + from + ' > ' + to + (h.bad ? ' HOPBAD' : '') + ' | chip ' + JSON.stringify(u.chip) + ' | undo identical ' + (df.length === 0) + (df.length ? ' | ' + df.slice(0, 3).join(' ; ') : '')); }
}
