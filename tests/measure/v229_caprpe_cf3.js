// v229_caprpe_cf3.js — MEASURE (read-only). D193 Amendment 3's M8 on a CF3 copy:
//   CF3 = shipped V228 (git HEAD 2c1a89c, ia-version 228) + parked E3/E4 (tests/edits/v228_s1_d193_caprpe.py) + the CF2
//   surgeries with Amendment 3's changes: R7 fifth shape in the clamp; _stripCapCue maps R7's text back to _testRx's text;
//   the kept pre-hold dose (_preHold) at the live tap, at boot replay (applySessionSwaps) and from the ia_swaps_ record on
//   undo (rx entry field `ph`); R8 hold toasts; nothing kept on an uninjured program. MEASURE's reading, for printing only.
//   SCR=<scratch> PART=<prep|chains|gate|report> node tests/measure/v229_caprpe_cf3.js
// Inputs copied into SCR/in from the V228-chat carry pass: chains_*.json (the 18,580 D190-lattice chains),
//   res_V227_*.json (V227 in-session/boot), res_V228_*.json + res_CF2_*.json (slices tree and CF2), gate_g221_dump.js,
//   gate_rows_V227.json(.l1).
// Oracles: the hand cap table, a hand hold function typed from Amendment 1 sec.3 + R7 (never _capRpeClamp), a hand cue/R7
//   stripper, a hand RPE parse, the ruling's exact R7/R8 strings, V228 shipped (no clamp) as the pre-hold carry.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures, progDigest } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n), I = n => path.join(SCR, 'in', n);
const PART = process.env.PART || 'none';
const TREES = { V227:F('t_v227.html'), V228:F('t_v228.html'), CF3:F('t_cf3.html') };
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
// ── hand oracles (typed from the ruling, never read from the suspect) ──
const TESTRE = /^Work up to one heavy set of 3 to 5 reps at RPE [\d.]+\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/;
function handHold(d){ if(typeof d !== 'string') return d; if(TESTRE.test(d)) return R7T;
  return d.replace(/RPE (\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?\+?( \((stop 2 reps short of failure|leave ~\d+ reps? in reserve|heaviest pair you can find)\))?/g, (t, a, b, g, gl) => {
    if(!(Math.max(+a, b ? +b : 0) > 7)) return t; if(!g) return 'RPE 7'; if(/^stop/.test(gl)) return 'RPE 7 (leave 3 or more in reserve)'; if(/^heaviest/.test(gl)) return 'RPE 7 (leave ~3 in reserve)'; return 'RPE 7 (leave ~3 reps in reserve)'; }); }
function handStrip(d){ if(typeof d !== 'string') return d; if(d === R7T) return TEST9; const m = / — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m ? d.slice(0, m.index) : d; }
const kindOf = d => { d = String(d || ''); if(d === R7T) return 'R7'; if(TESTRE.test(d)) return 'prose(test)'; if(/ — hold RPE 7, (two|three) in the tank$/.test(d)) return 'cue'; if(/^\d+ sets — RPE/.test(d)) return 'bwsets'; if(/@ RPE/.test(d)) return 'grammar@'; if(/^\d+×[\d–]+ — RPE [\d.–]+ \(leave ~/.test(d)) return 'wave'; if(/sets of \d+ to \d+ — RPE/.test(d)) return 'loadCapped'; if(/RPE/.test(d)) return 'prose/other'; return 'no-RPE'; };
const out = []; const P = s => { out.push(s); console.log(s); };
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};bumpSwapCount=function(){return false;};try{closeRestSheet=function(){};}catch(e){}";
function fresh(t){ const X = load(TREES[t]); pin(X); E(X, HELP); return X; }
function setup(IA, st){ IA.localStorage.clear(); IA.ctx.__SP = JSON.parse(st); E(IA, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function bootFrom(src, dst){ const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function storedFor(t, ck){ const f = F('stored_' + t + '_' + ck + '.json'); if(fs.existsSync(f)) return fs.readFileSync(f, 'utf8'); const X = load(TREES[t]); pin(X); const p = X.buildProgram(clone(CFGS[ck])); const s = clone(p); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(CFGS[ck]) }); const j = JSON.stringify(s); fs.writeFileSync(f, j); return j; }
const slotOf = (IA, w, d, si, ii) => JSON.parse(E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";var it=dy&&dy.sections[" + si + "]&&dy.sections[" + si + "].items[" + ii + "];return it?JSON.stringify({n:it.name,d:it.detail||'',h:(typeof it._preHold==='string')?it._preHold:null}):JSON.stringify({n:'(none)',d:'',h:null});})()"));
function hop(IA, c, to){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); IA.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:cur.n, detail:cur.d }; IA.ctx.__to = to; E(IA, '__T.length=0;'); let bad = 0;
  try { E(IA, '_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ bad = 1; } const after = slotOf(IA, c.w, c.d, c.si, c.ii); if(clean(after.n) !== clean(to)) bad = 1; return { d:after.d, n:after.n, h:after.h, t:Array.from(E(IA, '__T')).join(' / '), bad }; }
function undoLast(IA, c){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); const chip = E(IA, 'swapOriginOf(' + JSON.stringify(cur.n) + ')') || ''; let err = null; if(chip){ try { E(IA, 'undoSwap(' + JSON.stringify(chip) + ');'); } catch(e){ err = e.message; } } return { chip, err, slot:slotOf(IA, c.w, c.d, c.si, c.ii) }; }

// ─── PREP: CF3 surgery on shipped V228 ───
if(PART === 'prep'){
  ['t_v227.html','t_v228.html','t_cf3.html'].forEach(f => { try { fs.unlinkSync(F(f)); } catch(e){} });
  fs.readdirSync(SCR).filter(f => /^(stored_|res_|gate_rows_)/.test(f)).forEach(f => fs.unlinkSync(F(f)));
  fs.writeFileSync(TREES.V228, cp.execSync('git show HEAD:index.html', { cwd:ROOT, maxBuffer:1 << 26 })); fs.writeFileSync(TREES.V227, cp.execSync('git show 5ce31e8:index.html', { cwd:ROOT, maxBuffer:1 << 26 }));
  const head = cp.execSync('git rev-parse --short HEAD', { cwd:ROOT }).toString().trim(), orig = cp.execSync('git rev-parse --short origin/main', { cwd:ROOT }).toString().trim();
  const v = fs.readFileSync(TREES.V228, 'utf8'); const ver = (v.match(/<meta name="ia-version" content="(\d+)"/) || [])[1];
  P('PREP HEAD ' + head + ' origin/main ' + orig + ' | V228 ia-version ' + ver + ' sha ' + sha(TREES.V228) + ' | working index.html sha ' + sha(path.join(ROOT, 'index.html')) + ' | V227 (5ce31e8) sha ' + sha(TREES.V227));
  if(ver !== '228') throw new Error('V228 ia-version ' + ver);
  // E3 and E4 are read out of the parked script, not retyped.
  const py = fs.readFileSync(path.join(ROOT, 'tests', 'edits', 'v228_s1_d193_caprpe.py'), 'utf8');
  const pyStr = s => s.replace(/\\\\/g, '\u0000').replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\u0000/g, '\\');
  const litsOf = blk => [...blk.matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/mg)].map(m => pyStr(m[1]));
  const blocks = py.split('EDITS.append((').slice(1).map(b => b.split('\n))')[0]);
  const L3 = litsOf(blocks[2]); const E3old = L3[0]; const E3new = L3.slice(1).join('');
  if(E3old !== "function applyInjuryFilter(sections,cfg){\n") throw new Error('parked E3 old anchor not as expected');
  const E4 = litsOf(blocks[3]);
  P('  parked E3 text read ' + E3new.length + ' chars (ends with applyInjuryFilter header: ' + E3new.endsWith(E3old) + ') | E4 old/new read: ' + E4.length);
  const ED = [
    ['E3 _capRpeClamp (parked) + R7 fifth shape', E3old,
      E3new.replace("function _capRpeClamp(d){\n  if(typeof d!=='string') return d;\n", "function _capRpeClamp(d){\n  if(typeof d!=='string') return d;\n  if(/^Work up to one heavy set of 3 to 5 reps at RPE [\\d.]+\\. Technique stays crisp\\. No grinding\\. Log the weight and the reps\\. That set is your new baseline\\.$/.test(d)) return INJ_HELD_TEST;   // M8 CF3: R7\n")],
    ['E4 capped branch clamps (parked)', E4[0], E4[1]],
    ['A3 sec.2 stripper reads beneath R7 text', "function _stripCapCue(d){ if(typeof d!=='string') return d; const m=/ — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m?d.slice(0,m.index):d; }\n",
      "const INJ_HELD_TEST=" + JSON.stringify(R7T).replace(/"/g, "'") + ";\nconst _TEST_RX_TEXT=" + JSON.stringify(TEST9).replace(/"/g, "'") + ";   // M8 CF3: copy of _testRx (siting: builder may hoist _testRx)\n"
      + "function _stripCapCue(d){ if(typeof d!=='string') return d; if(d===INJ_HELD_TEST) return _TEST_RX_TEXT; const m=/ — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m?d.slice(0,m.index):d; }\n"],
    ['A3 sec.4 boot replay keeps the dose (applySwapPrefs keep flag)', "function applySwapPrefs(sections,map){\n", "function applySwapPrefs(sections,map,keep){\n"],
    ['A3 sec.4 boot replay carry reads/writes the kept dose', "      it.detail=_swapDetailFor(to,_stripCapCue(it.detail));\n", "      it.detail=_swapDetailFor(to,_stripCapCue((keep&&typeof it._preHold==='string')?it._preHold:it.detail));\n      if(keep) it._preHold=it.detail;   // M8 CF3: pre-filter replay result\n"],
    ['A3 sec.4 applySessionSwaps passes keep on injured programs', "      if(applySwapPrefs(day.sections,m1)) hit=true;\n", "      if(applySwapPrefs(day.sections,m1,!!(prog.cfg&&prog.cfg.injury))) hit=true;\n"],
    ['A3 sec.4 record carries the from-card kept dose (rx[].ph)', "    if(it&&it.name===from&&typeof it.detail==='string') _undoRx.push({s:si,i:ii,d:it.detail});\n",
      "    if(it&&it.name===from&&typeof it.detail==='string'){ const _e={s:si,i:ii,d:it.detail}; if(typeof it._preHold==='string') _e.ph=it._preHold; _undoRx.push(_e); }\n"],
    ['R3 live carry reads the kept dose', "  const _base=_stripCapCue(_wasDetail);\n", "  const _base=_stripCapCue((typeof item._preHold==='string')?item._preHold:_wasDetail);\n"],
    ['R3 keep + R8 detect (injured only)', "  const _reRx=(item.detail!==_base);\n  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    try{\n      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];\n      if(_fi&&_fi.name===to) item.detail=_fi.detail;\n",
      "  const _reRx=(item.detail!==_base);\n  const _preF=item.detail; let _held=false;\n  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    item._preHold=_preF;\n    try{\n      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];\n      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_fi.detail; }\n"],
    ['R8 hold toasts', "  showToast(_rx.win\n", "  showToast(_held\n    ? (_rx.win ? to+' in, '+from.toLowerCase()+' out. The load runs out before the reps do here. Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'." + HOLD + "'\n       : _reRx ? to+' in, '+from.toLowerCase()+' out. No load to add here." + HOLD + "'\n       : to+' in, '+from.toLowerCase()+' out. Same sets, same reps." + HOLD + "')\n    : _rx.win\n"],
    ['A3 sec.4 undo: renamed-back items drop the undone dose', "  const back={}; back[hit.to]=from;\n  applySwapPrefs(day.sections,back);\n",
      "  const back={}; back[hit.to]=from;\n  const _bk=[]; (day.sections||[]).forEach(function(s){((s&&s.items)||[]).forEach(function(x){ if(x&&x.name===hit.to) _bk.push(x); });});\n  applySwapPrefs(day.sections,back);\n  _bk.forEach(function(x){ if(x.name===from) delete x._preHold; });\n"],
    ['A3 sec.4 undo restores the kept dose from the record', "      if(it){it.detail=p.d;_put.push(it);}\n", "      if(it){it.detail=p.d; if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold; _put.push(it);}\n"]];
  let s = v; ED.forEach(([nm, a, b]) => { const n = s.split(a).length - 1; P('  anchor [' + nm + '] count ' + n); if(n !== 1) throw new Error('anchor ' + nm + ' count ' + n); s = s.replace(a, b); });
  if(/\\u[0-9a-fA-F]{4}/.test(ED.map(x => x[2]).join(''))) throw new Error('escape typed into replacement');
  fs.writeFileSync(TREES.CF3, s); P('  CF3 written sha ' + sha(TREES.CF3) + ' | _capRpeClamp occurrences ' + (s.split('_capRpeClamp').length - 1) + ' | _preHold occurrences ' + (s.split('_preHold').length - 1));
  const X = fresh('CF3'); X.ctx.__a = TEST9; X.ctx.__b = R7T;
  P('  CF3 boots: ia-version ' + X.version + ' | _capRpeClamp(TEST9)===R7 ' + (E(X, '_capRpeClamp(__a)') === R7T) + ' | _stripCapCue(R7)===TEST9 ' + (E(X, '_stripCapCue(__b)') === TEST9) + ' | _stripCapCue(TEST9) identity ' + (E(X, '_stripCapCue(__a)') === TEST9));
  const probes = ['3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest', '2×6–10 @ RPE 8', '4×3 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest', '4×3 — RPE 9 (leave ~1 rep in reserve), ramp up with 2–3 warmup sets, 3 min rest', '3 sets of 8 to 12 — RPE 8 (heaviest pair you can find)', '3×8 @ RPE 7', 'RPE 6–7 (leave 3–4 in reserve — learn the movement)', TEST9, '3×10 @ RPE 7–8'];
  probes.forEach(p => { X.ctx.__p = p; const e = E(X, '_capRpeClamp(__p)'); P('    clamp probe ' + JSON.stringify(p).slice(0, 70) + ' -> ' + JSON.stringify(e).slice(0, 90) + ' | hand ' + (e === handHold(p) ? '==' : '!= ' + JSON.stringify(handHold(p)))); });
}
// ─── CHAINS worker: MODE S (in-session + boot + build + undo), R (reboot before the last hop), U (undo onto a held intermediate then one more hop) ───
if(process.env.WORKER){
  const [mode, t, ck] = process.env.WORKER.split(':'); let chains = JSON.parse(fs.readFileSync(I('chains_' + ck + '.json'), 'utf8')); const st = storedFor(t, ck);
  if(mode === 'U') chains = chains.filter(c => c.cls === 'hop3' && /h1/.test(c.fire));
  const by = {}; chains.forEach(c => (by[c.w + c.d] = by[c.w + c.d] || []).push(c)); const lists = Object.values(by); const nB = Math.max(0, ...lists.map(l => l.length)); const res = [];
  const A = fresh(t), B2 = fresh(t), B3 = fresh(t);
  for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); setup(A, st); const r = {};
    batch.forEach(c => r[c.id] = { id:c.id, ck, cls:c.cls, fire:c.fire, w:c.w, d:c.d, si:c.si, ii:c.ii, hops:c.hops, steps:[], toasts:[], kept:[], bad:0 });
    if(mode === 'S'){
      for(const c of batch){ const s = r[c.id]; for(const to of c.hops){ const h = hop(A, c, to); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; } s.live = slotOf(A, c.w, c.d, c.si, c.ii); }
      bootFrom(A, B2); for(const c of batch) r[c.id].boot = slotOf(B2, c.w, c.d, c.si, c.ii);
      for(const c of batch){ const u = undoLast(A, c); r[c.id].chip = u.chip; r[c.id].undo = u.slot; if(u.err) r[c.id].undoErr = u.err; }
      bootFrom(A, B3); for(const c of batch) r[c.id].undoBoot = slotOf(B3, c.w, c.d, c.si, c.ii);
    } else if(mode === 'R'){
      for(const c of batch){ const s = r[c.id]; for(const to of c.hops.slice(0, -1)){ const h = hop(A, c, to); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; } s.preReboot = slotOf(A, c.w, c.d, c.si, c.ii); }
      bootFrom(A, B2); for(const c of batch){ const s = r[c.id]; s.afterReboot = slotOf(B2, c.w, c.d, c.si, c.ii); const h = hop(B2, c, c.hops[c.hops.length - 1]); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; s.live = slotOf(B2, c.w, c.d, c.si, c.ii); }
      bootFrom(B2, B3); for(const c of batch) r[c.id].boot = slotOf(B3, c.w, c.d, c.si, c.ii);
    } else if(mode === 'U'){
      for(const c of batch){ const s = r[c.id]; const [Bn, Cn, Dn] = c.hops; for(const to of [Bn, Cn]){ const h = hop(A, c, to); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; }
        s.rec = (JSON.parse(E(A, "localStorage.getItem('ia_swaps_PM')") || '{}')['w' + c.w + '_' + c.d] || []).map(e => ({ from:e.from, to:e.to, rx:e.rx }));
        const u = undoLast(A, c); s.chip = u.chip; s.undone = u.slot; if(clean(u.slot.n) !== clean(Bn)) s.undoMiss = 1;
        const h = hop(A, c, Dn); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; s.live = slotOf(A, c.w, c.d, c.si, c.ii); }
      bootFrom(A, B2); for(const c of batch) r[c.id].boot = slotOf(B2, c.w, c.d, c.si, c.ii);
      setup(B3, st); for(const c of batch){ const h = hop(B3, c, c.hops[2]); r[c.id].direct = { d:h.d, n:h.n, t:h.t, bad:h.bad }; }
    }
    batch.forEach(c => res.push(r[c.id])); }
  if(mode === 'S' && t !== 'V227'){ const X = load(TREES[t]); pin(X); const cache = {};
    res.forEach(r => { const pre = JSON.parse(st).weeks[r.w][r.d].sections[r.si].items[r.ii]; const names = [pre.name].concat(r.hops); const m = {}; for(let i = 0; i < r.hops.length; i++) m[names[i]] = names[i + 1]; const k = JSON.stringify(m);
      if(!(k in cache)){ const cfg = clone(CFGS[ck]); cfg.exSwapPrefs = m; try { cache[k] = X.buildProgram(cfg); } catch(e){ cache[k] = null; } } const p = cache[k];
      const it = p && p.weeks[r.w] && p.weeks[r.w][r.d] && p.weeks[r.w][r.d].sections[r.si] && p.weeks[r.w][r.d].sections[r.si].items[r.ii]; r.build = it ? { n:it.name, d:it.detail || '', h:it._preHold === undefined ? null : 'PRESENT' } : { n:'(none)', d:'', h:null }; }); }
  fs.writeFileSync(F('res_' + mode + '_' + t + '_' + ck + '.json'), JSON.stringify(res)); console.log('worker ' + mode + ':' + t + ':' + ck + ' ' + res.length); process.exit(0);
}
if(PART === 'chains'){
  const jobs = []; const big = ['elbow_wa','shoulder_wa','lowback_wa','hip_wa','knee_protect','mario','ankle_wa'];
  for(const ck of big) for(const [m, t] of [['S','CF3'],['S','V228'],['R','CF3'],['R','V228'],['U','CF3'],['U','V228'],['S','V227']]) jobs.push(m + ':' + t + ':' + ck);
  for(const t of ['V227','V228','CF3']) for(const ck of INJ) storedFor(t, ck);
  let i = 0; const t0 = Date.now(); const runOne = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { WORKER:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { console.log(code ? 'WORKER CRASH ' + j + ' ' + o.slice(-800) : o.trim() + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  (async () => { await Promise.all(Array.from({ length:7 }, async () => { while(i < jobs.length){ await runOne(jobs[i++]); } })); console.log('chains done ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s'); })();
}
// ─── GATE dump (D177 L1 sweep with row dump; the V228-chat splice of g221, unchanged) ───
if(PART === 'gate'){
  const t = process.env.TREE; const dump = F('gate_rows_' + t + '.json'); try { fs.unlinkSync(dump); } catch(e){}
  const o = cp.execFileSync(process.execPath, ['--max-old-space-size=8192', I('gate_g221_dump.js'), TREES[t]], { env:Object.assign({}, process.env, { GATE_DUMP:dump }), maxBuffer:1 << 28 }).toString(); console.log('gate ' + t + ' ' + (o.match(/DUMPED \d+/) || ['NO DUMP'])[0]);
}
module.exports = { handHold, handStrip, kindOf, rpeMax, CAP, CFGS, INJ, MARIO, TREES, F, I, fresh, setup, bootFrom, storedFor, slotOf, hop, undoLast, clean, clone, pin, E, tally, fmt, capOf, TEST9, R7T, HOLD, OLD, NEW, TESTRE, START, CLOCK, sha };
// ─── BUILDS: lattices (a)/(a′)/(a″), home_basic, D177 L1 by class, (j) build, (e), (e′), wave rows, (f), stores, HALF_MANNY, uninjured, hand rows ───
if(PART === 'builds'){
  const REP = F('v229_builds.report.txt'); try { fs.unlinkSync(REP); } catch(e){}
  const L1 = JSON.parse(fs.readFileSync(I('gate_rows_V227.json.l1'), 'utf8'));
  const WRAP = "var __BUILD=0;var __origBWS=bodyweightSweep; bodyweightSweep=function(weeks){ try{ Object.keys(weeks||{}).forEach(function(w){ Object.keys(weeks[w]||{}).forEach(function(d){ var dy=weeks[w][d]; ((dy&&dy.sections)||[]).forEach(function(s){ (s.items||[]).forEach(function(it){ if(it&&it.name) it.__pre={n:it.name,b:__BUILD}; }); }); }); }); }catch(e){} return __origBWS.apply(this,arguments); };";
  const LV = {}, UV = {}; const lens = t => LV[t] || (LV[t] = (X => (E(X, WRAP), X))(fresh(t))); const plain = t => UV[t] || (UV[t] = fresh(t));
  const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = plain('V228').eval('_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const strip = k => k === '__pre' ? undefined : undefined;
  const repl = (k, v) => k === '__pre' ? undefined : v;
  function cards(t, cfg){ const X = lens(t); E(X, '__BUILD++'); const b = E(X, '__BUILD'); X.ctx.__C = clone(cfg); const p = E(X, 'buildProgram(__C)'); const m = [];
    Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { const dy = p.weeks[w][d]; ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it) return; const pre = it.__pre && it.__pre.b === b ? clean(it.__pre.n) : clean(it.name);
      m.push({ k:w + '|' + d + '|' + si + '|' + ii, w:+w, d, si, ii, label:clean(s.label), n:clean(it.name), raw:it.name, det:it.detail || '', pre, fp:pat(pre), np:pat(it.name) }); })); }));
    return { m, json:JSON.stringify(p.weeks, repl) }; }
  const plainJSON = (t, cfg) => JSON.stringify(plain(t).buildProgram(clone(cfg)).weeks);
  const REG = ['knee','ankle','hip','lowback','shoulder','elbow'], TIER = ['workaround','protect'], EQ = ['commercial','crossfit','home_full','bodyweight'], EXP = ['beginner','intermediate','advanced'], FOC = ['support_strength','support_athletic','support_prevention'];
  const mk = (r, t, eq, ex, fo) => { const c = clone(MARIO); Object.assign(c, { injury:{ region:r, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }); return c; };
  const segOf = c => [c.injury ? c.injury.region + '/' + c.injury.tier : 'healthy', c.equipment, c.experience, c.liftingFocus].join('|');
  // (0) the lens wrapper is neutral: wrapped-and-stripped == plain, on V228 and CF3, every bodyweight + home_basic L432-style cell
  { let n = 0, eq = 0; for(const t of ['V228','CF3']) for(const r of REG) for(const ti of TIER) for(const e of ['bodyweight','home_basic']) for(const ex of EXP){ const c = mk(r, ti, e, ex, 'support_strength'); n++; if(cards(t, c).json === plainJSON(t, c)) eq++; }
    P('LENS wrapper neutrality (wrapped build with __pre stripped == plain build): ' + eq + '/' + n); }
  // (0b) baseline equals itself
  { let n = 0, eq = 0; for(const ck of ['mario','lowback_wa','elbow_wa','manny','mario_noinj']) for(const t of ['V228','CF3']){ n++; const a = plainJSON(t, CFGS[ck]); const X = fresh(t); if(JSON.stringify(X.buildProgram(clone(CFGS[ck])).weeks) === a) eq++; }
    P('BASELINE self-identity (two VMs, pinned clock, same cfg): ' + eq + '/' + n); }
  function lattice(name, cfgs){
    const R = { V228:{ U:0, Uhi:0, fin:0, finHi:0, a1:0, a2:0, a2hi:0, shp:{} }, CF3:{ U:0, Uhi:0, fin:0, finHi:0, a1:0, a2:0, a2hi:0, shp:{} } }; const diff = [], uncl = []; let ncards = 0; const hiEx = [];
    for(const cfg of cfgs){ const cap = capOf(cfg); const A = cards('V228', cfg).m, C = cards('CF3', cfg).m; ncards += A.length; if(A.length !== C.length) uncl.push('CARD COUNT ' + segOf(cfg));
      for(const [t, M] of [['V228', A], ['CF3', C]]) for(const c of M){ const fc = cap.includes(c.fp), nc = cap.includes(c.np), hi = rpeMax(c.det) > 7; const r = R[t];
        if(fc){ r.U++; if(hi){ r.Uhi++; r.shp[kindOf(c.det)] = (r.shp[kindOf(c.det)] || 0) + 1; if(t === 'CF3' && hiEx.length < 6) hiEx.push(segOf(cfg) + ' W' + c.w + ' ' + c.d + ' [' + c.label + '] ' + c.n + ' (pre ' + c.pre + ') ' + JSON.stringify(c.det)); } }
        if(nc){ r.fin++; if(hi) r.finHi++; } if(nc && !fc && hi) r.a1++; if(fc && !nc){ r.a2++; if(hi) r.a2hi++; } }
      const cm = new Map(C.map(x => [x.k, x]));
      A.forEach(a => { const c = cm.get(a.k); if(!c){ uncl.push('MISSING ' + segOf(cfg) + ' ' + a.k); return; } if(c.n === a.n && c.det === a.det && c.label === a.label) return;
        let k = null; const fc = cap.includes(a.fp);
        if(c.n === a.n && c.label === a.label && fc && c.det === handHold(a.det)) k = 'clamp ' + kindOf(a.det) + (a.n !== a.pre ? ' [renamed after filter: ' + a.n + ']' : '');
        if(k) diff.push({ seg:segOf(cfg), k, a, c }); else uncl.push(segOf(cfg) + ' W' + a.w + ' ' + a.d + ' [' + a.label + '] ' + a.n + ' ' + JSON.stringify(a.det) + ' => [' + c.label + '] ' + c.n + ' ' + JSON.stringify(c.det)); }); }
    P('\n=== ' + name + ': ' + cfgs.length + ' builds, ' + ncards + ' cards (V228)');
    for(const t of ['V228','CF3']){ const r = R[t]; P('  ' + t + ' filter lens U ' + r.U + ' | U naming RPE>7 (gate a) ' + r.Uhi + ' ' + fmt(r.shp) + ' | final lens capped ' + r.fin + ', RPE>7 ' + r.finHi + ' | (a′) final-only RPE>7 ' + r.a1 + ' | (a″) filter-only ' + r.a2 + ' (RPE>7 ' + r.a2hi + ')'); }
    P('  CF3 vs V228 changed cards ' + diff.length + ' | ' + fmt(tally(diff, x => x.k)) + ' | UNCLASSIFIED ' + uncl.length);
    P('  changed by region/tier ' + fmt(tally(diff, x => x.seg.split('|')[0])) + ' | by eq ' + fmt(tally(diff, x => x.seg.split('|')[1])));
    hiEx.forEach(s => P('    CF3 U RPE>7: ' + s)); uncl.slice(0, 10).forEach(s => P('    UNCLASSIFIED ' + s));
    return { R, diff, uncl }; }
  const L432 = []; for(const r of REG) for(const t of TIER) for(const eq of EQ) for(const ex of EXP) for(const fo of FOC) L432.push(mk(r, t, eq, ex, fo));
  const HB = []; for(const r of REG) for(const t of TIER) for(const ex of EXP) for(const fo of FOC) HB.push(mk(r, t, 'home_basic', ex, fo));
  lattice('L432 (6 regions x 2 tiers x 4 equipment x 3 exp x 3 support focus)', L432);
  lattice('home_basic (6 x 2 x 3 x 3)', HB);
  // (3) D177 L1 (the gate's own 384 configs) by class, V227 -> V228 and V227 -> CF3; (j) build
  { const cls = { V228:[], CF3:[] }; let r7 = 0, r7un = 0, num = 0, unc = 0, uncSame = 0, capT = 0, uninSame = 0, uninTot = 0; const r7seg = [], ex = [];
    for(const cfg of L1){ const cap = capOf(cfg); const A = cards('V227', cfg).m; const B = cards('V228', cfg), C = cards('CF3', cfg);
      if(!cfg.injury){ uninTot++; if(B.json === C.json) uninSame++; }
      for(const [t, M] of [['V228', B.m], ['CF3', C.m]]){ const cm = new Map(M.map(x => [x.k, x]));
        A.forEach(a => { const c = cm.get(a.k); if(!c){ cls[t].push({ k:'MISSING' }); return; } if(c.n === a.n && c.det === a.det) return; const fc = cap.includes(a.fp); const lit = a.det.endsWith(OLD) ? a.det.slice(0, -OLD.length) + NEW : a.det; let k;
          if(c.n !== a.n) k = 'NAME CHANGED'; else if(c.det === lit) k = 'literal'; else if(fc && c.det === handHold(lit)) k = (a.det === TEST9 ? 'R7 text' : 'clamp ' + kindOf(a.det)) + (/Burpees/.test(a.n) ? ' (Burpees Main, filter-capped)' : ''); else k = 'UNCLASSIFIED';
          cls[t].push({ k, seg:segOf(cfg), a, c }); }); }
      C.m.forEach(c => { if(c.det === R7T){ r7++; if(!cfg.injury) r7un++; r7seg.push((cap.includes(c.np) ? 'final-capped' : 'final-UNCAPPED') + '/' + (cap.includes(c.fp) ? 'filter-capped' : 'filter-UNCAPPED') + ' ' + c.n); } if(/at RPE 7\..*new baseline\./.test(c.det)) num++; });
      const cm = new Map(C.m.map(x => [x.k, x])); A.forEach(a => { if(a.det !== TEST9) return; if(cap.includes(a.fp)){ capT++; return; } unc++; const c = cm.get(a.k); if(c && c.det === a.det && c.n === a.n) uncSame++; else if(ex.length < 4) ex.push(segOf(cfg) + ' W' + a.w + ' ' + a.d + ' ' + a.n + ' -> ' + (c && c.n) + ' ' + JSON.stringify(c && c.det)); }); }
    P('\n=== D177 L1 lattice (' + L1.length + ' builds; ' + L1.filter(c => c.injury).length + ' injured) changed cards vs V227');
    for(const t of ['V228','CF3']) P('  ' + t + ' changed ' + cls[t].length + ' | ' + fmt(tally(cls[t], x => x.k)));
    P('  CF3 clamp bwsets by name ' + fmt(tally(cls.CF3.filter(x => /^clamp bwsets/.test(x.k)), x => x.a.n)) + '\n  CF3 clamp grammar@ by name ' + fmt(tally(cls.CF3.filter(x => /^clamp grammar/.test(x.k)), x => x.a.n)));
    cls.CF3.filter(x => /UNCLASS|NAME|MISSING/.test(x.k)).slice(0, 8).forEach(x => P('    ' + x.k + ' ' + x.seg + ' ' + (x.a ? x.a.n + ' ' + JSON.stringify(x.a.det) + ' => ' + x.c.n + ' ' + JSON.stringify(x.c.det) : '')));
    P('\n=== (j) build, D177 L1: CF3 cards printing R7 text ' + r7 + ' (uninjured ' + r7un + ') ' + fmt(tally(r7seg, x => x)) + ' | number-only "at RPE 7 … new baseline" ' + num + ' | V227 _testRx cards on a filter-lens CAPPED pattern ' + capT + ' | filter-lens UNCAPPED _testRx cards byte-identical to V227 on CF3 ' + uncSame + '/' + unc + ' | uninjured builds CF3 == V228 (weeks JSON) ' + uninSame + '/' + uninTot);
    ex.forEach(s => P('    uncapped test moved: ' + s)); }
  // (4) L9 class (iii) (e) and class (iii-b) (e′): live, boot, build — V228 vs CF3
  { const stored = {}; const storedOf = (ck) => stored[ck] || (stored[ck] = storedFor('V228', ck));
    const BOOT = {}; const bootVM = t => BOOT[t] || (BOOT[t] = (X => (pin(X), X))(load(TREES[t])));
    const bootRead = (t, st, sw, w, d, si, ii) => { const Z = bootVM(t); Z.localStorage.clear(); Z.ctx.__SP = JSON.parse(st); E(Z, 'savePrograms([__SP]);'); if(sw) Z.localStorage.setItem('ia_swaps_PM', sw); return JSON.parse(E(Z, "(function(){var p=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));var it=p.weeks[" + w + "]." + d + ".sections[" + si + "]&&p.weeks[" + w + "]." + d + ".sections[" + si + "].items[" + ii + "];return JSON.stringify(it?{n:it.name,d:it.detail}:{n:'(none)',d:''});})()")); };
    const liveVM = (t, ck) => { const Y = fresh(t); setup(Y, storedOf(ck)); return Y; };
    const liveSwap = (Y, w, d, si, ii, to) => { E(Y, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); const snap = E(Y, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')'); const cur = slotOf(Y, w, d, si, ii);
      Y.ctx.__c = { secIdx:si, itemIdx:ii, name:cur.n, detail:cur.d }; Y.ctx.__to = to; let o; E(Y, '__T.length=0;'); try { E(Y, '_swapCtx=__c;applySwapChoice(__to);'); o = slotOf(Y, w, d, si, ii).d; } catch(e){ o = 'CRASH ' + e.message; }
      const sw = E(Y, "localStorage.getItem('ia_swaps_PM')"); const t2 = Array.from(E(Y, '__T')).join(' / '); Y.ctx.__S = JSON.parse(snap); E(Y, 'activeProg.weeks[' + w + '].' + d + "=__S;localStorage.removeItem('ia_swaps_PM');localStorage.removeItem('ia_swapct_PM');"); return { o, sw, t:t2 }; };
    const base9 = {}; INJ.forEach(ck => base9[ck] = cards('V228', CFGS[ck]).m);
    { let n = 0, same = 0; INJ.forEach(ck => { const C = cards('CF3', CFGS[ck]).m; base9[ck].forEach((a, i) => { n++; if(C[i] && C[i].det === a.det && C[i].n === a.n) same++; }); }); P('\n=== L9 natives CF3 == V228 (so V228 is the pre-hold carry on the D190 lattice): ' + same + '/' + n); }
    const isCue = d => / — hold RPE 7, (?:two|three) in the tank$/.test(d);
    const runPairs = (pick, keep) => { const rows = []; for(const ck of INJ){ const cap = capOf(CFGS[ck]); const st = storedOf(ck); const Y = { V228:liveVM('V228', ck), CF3:liveVM('CF3', ck) };
        for(const c of base9[ck].filter(pick)){ E(Y.V228, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); Y.V228.ctx.__D = E(Y.V228, 'activeProg.weeks[' + c.w + '].' + c.d); const lv = Y.V228.ctx.__D && Y.V228.ctx.__D.sections[c.si] && Y.V228.ctx.__D.sections[c.si].items[c.ii]; if(!lv || clean(lv.name) !== c.n) continue;
          let tg; try { tg = Array.from(E(Y.V228, '__cands(__D,' + c.w + ',' + JSON.stringify(String(lv.name)) + ')')); } catch(e){ tg = []; }
          for(const to of tg){ if(!cap.includes(pat(to))) continue; if(keep && !keep(Y.V228, to)) continue; const r = { ck, w:c.w, d:c.d, si:c.si, ii:c.ii, from:c.n, donor:String(lv.detail), to };
            for(const t of ['V228','CF3']){ const s = liveSwap(Y[t], c.w, c.d, c.si, c.ii, to); r[t + 'l'] = s.o; r[t + 't'] = s.t; const b = bootRead(t, st, s.sw, c.w, c.d, c.si, c.ii); r[t + 'b'] = b.d; r[t + 'bn'] = clean(b.n); } rows.push(r); } } } return rows; };
    const unl = (Y, to) => { const rf = JSON.parse(E(Y, 'JSON.stringify(_repFloor(' + JSON.stringify(to) + '))')); return !!(rf && rf[1] === 0); };
    const R3 = runPairs(c => isCue(c.det), unl); const bw = (s, v) => new RegExp('^\\d+ sets — RPE ' + v + ' ').test(s || '');
    P('\n=== (e) class (iii): cued donor -> capped unloadable target, L9 live/boot: pairs ' + R3.length + ' | live RPE 8 V228 ' + R3.filter(r => bw(r.V228l, 8)).length + ' CF3 ' + R3.filter(r => bw(r.CF3l, 8)).length + ' | live RPE 7 CF3 ' + R3.filter(r => bw(r.CF3l, 7)).length + ' | boot RPE 8 V228 ' + R3.filter(r => bw(r.V228b, 8)).length + ' CF3 ' + R3.filter(r => bw(r.CF3b, 8)).length + ' | live==boot V228 ' + R3.filter(r => r.V228l === r.V228b).length + ' CF3 ' + R3.filter(r => r.CF3l === r.CF3b).length + ' /' + R3.length + ' | CF3 ends ' + fmt(tally(R3, r => kindOf(r.CF3l) + ' RPE ' + rpeMax(r.CF3l))) + ' | CF3 toasts hold ' + R3.filter(r => r.CF3t.endsWith(HOLD)).length);
    const buildLand = (rows, pick) => { const out2 = []; const sp = new Set(); for(const r of rows){ const k = r.ck + '|' + r.from + '>' + r.to; if(sp.has(k)) continue; sp.add(k); const cfg = clone(CFGS[r.ck]); cfg.exSwapPrefs = { [r.from]:r.to };
        const A = cards('V228', cfg).m, C = cards('CF3', cfg).m; const am = new Map(A.map(x => [x.k, x])), cm = new Map(C.map(x => [x.k, x]));
        base9[r.ck].filter(x => x.n === r.from && pick(x)).forEach(x => { const a = am.get(x.k), c = cm.get(x.k); if(a && a.n === r.to) out2.push({ a:a.det, c:c && c.n === r.to ? c.det : '(moved)' }); }); } return out2; };
    const R3B = buildLand(R3, c => isCue(c.det));
    P('  build exSwapPrefs: landed ' + R3B.length + ' | RPE 8 V228 ' + R3B.filter(x => bw(x.a, 8)).length + ' CF3 ' + R3B.filter(x => bw(x.c, 8)).length + ' | RPE 7 CF3 ' + R3B.filter(x => bw(x.c, 7)).length + ' | CF3 ends ' + fmt(tally(R3B, x => kindOf(x.c) + ' RPE ' + rpeMax(x.c))));
    const hi = s => rpeMax(s) !== null && rpeMax(s) > 7;
    const M1 = runPairs(c => !isCue(c.det) && rpeMax(c.det) > 7, null);
    P('\n=== (e′) class (iii-b): uncued RPE>7 donor -> capped target, L9: pairs ' + M1.length + ' | live RPE>7 V228 ' + M1.filter(r => hi(r.V228l)).length + ' CF3 ' + M1.filter(r => hi(r.CF3l)).length + ' | boot RPE>7 V228 ' + M1.filter(r => r.V228bn === clean(r.to) && hi(r.V228b)).length + ' CF3 ' + M1.filter(r => r.CF3bn === clean(r.to) && hi(r.CF3b)).length + ' | live==boot CF3 ' + M1.filter(r => r.CF3l === r.CF3b).length + '/' + M1.length + ' | CF3 live == hand hold of V228 live ' + M1.filter(r => r.CF3l === handHold(r.V228l)).length + ' | CF3 ends ' + fmt(tally(M1.filter(r => hi(r.V228l)), r => kindOf(r.CF3l))));
    const MB = buildLand(M1, c => !isCue(c.det) && rpeMax(c.det) > 7);
    P('  build exSwapPrefs: landed ' + MB.length + ' | RPE>7 V228 ' + MB.filter(x => hi(x.a)).length + ' CF3 ' + MB.filter(x => hi(x.c)).length + ' | CF3 == hand hold of V228 ' + MB.filter(x => x.c === handHold(x.a)).length + '/' + MB.length);
    // wave rows (coach's four support_athletic configs, first two capped candidates per wave>7 donor)
    const WC = [['knee','workaround','commercial','beginner'],['lowback','workaround','commercial','advanced'],['ankle','protect','bodyweight','intermediate'],['knee','protect','home_full','advanced']]; const WR = [];
    for(const [r, ti, eq, ex] of WC){ const cfg = mk(r, ti, eq, ex, 'support_athletic'); const cap = capOf(cfg); const X0 = load(TREES.V228); pin(X0); const p = X0.buildProgram(clone(cfg)); const s0 = clone(p); Object.assign(s0, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) }); const st = JSON.stringify(s0);
      const Y = { V228:fresh('V228'), CF3:fresh('CF3') }; setup(Y.V228, st); setup(Y.CF3, st); const W = JSON.parse(E(Y.V228, 'JSON.stringify(activeProg.weeks)'));
      Object.keys(W).forEach(w => Object.keys(W[w]).forEach(d => ((W[w][d] && W[w][d].sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.detail) return; if(!/leave ~\d+ reps? in reserve/.test(it.detail) || !(rpeMax(it.detail) > 7)) return;
        E(Y.V228, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); Y.V228.ctx.__D = W[w][d]; let tg = []; try { tg = Array.from(E(Y.V228, '__cands(__D,' + w + ',' + JSON.stringify(it.name) + ')')); } catch(e){}
        tg.filter(to => cap.includes(pat(to))).slice(0, 2).forEach(to => { const row = { seg:[r, ti, eq, ex].join('/'), w, d, from:clean(it.name), to, donor:it.detail }; for(const t of ['V228','CF3']){ const s2 = liveSwap(Y[t], w, d, si, ii, to); row[t] = s2.o; row[t + 't'] = s2.t; row[t + 'b'] = bootRead(t, st, s2.sw, w, d, si, ii).d; } WR.push(row); }); }))));
      Object.keys(BOOT).forEach(k => delete BOOT[k]); }
    P('\n=== wave rows (four support_athletic configs): ' + WR.length + ' | live RPE>7 V228 ' + WR.filter(x => hi(x.V228)).length + ' CF3 ' + WR.filter(x => hi(x.CF3)).length + ' | CF3 live==boot ' + WR.filter(x => x.CF3 === x.CF3b).length + ' | CF3 == hand hold of V228 ' + WR.filter(x => x.CF3 === handHold(x.V228)).length + ' | CF3 toasts hold ' + WR.filter(x => x.CF3t.endsWith(HOLD)).length + ' | V228 toasts ' + fmt(tally(WR, x => x.V228t.replace(/^.*? out\. /, ''))));
    WR.filter(x => /Sumo deadlift/.test(x.from) || /Chinups/.test(x.from)).slice(0, 4).forEach(x => P('    ' + x.seg + ' W' + x.w + ' ' + x.d + ' ' + x.from + ' -> ' + x.to + '\n      V228 ' + JSON.stringify(x.V228) + ' | ' + x.V228t + '\n      CF3  ' + JSON.stringify(x.CF3) + ' | boot ' + JSON.stringify(x.CF3b) + ' | ' + x.CF3t));
    // (f) stripper identity
    { const X = plain('CF3'); let n = 0, fsx = 0, tank = 0, tankFs = 0; const fex = []; const seen = new Set();
      for(const ck of Object.keys(CFGS)){ cards('CF3', CFGS[ck]).m.forEach(c => { if(isCue(c.det) || c.det === R7T) return; n++; X.ctx.__d = c.det; if(E(X, '_stripCapCue(__d)') !== c.det){ fsx++; if(fex.length < 3) fex.push(c.det); } if(ck === 'manny' && /tank/.test(c.det)){ tank++; if(E(X, '_stripCapCue(__d)') !== c.det) tankFs++; } }); }
      let nd = 0, fd = 0; for(const cfg of L432.concat(HB, L1)) cards('CF3', cfg).m.forEach(c => { if(seen.has(c.det)) return; seen.add(c.det); if(isCue(c.det) || c.det === R7T) return; nd++; X.ctx.__d = c.det; if(E(X, '_stripCapCue(__d)') !== c.det) fd++; });
      X.ctx.__a = R7T; X.ctx.__b = TEST9;
      P('\n=== (f) CF3 _stripCapCue: (R7 text) === _testRx text ' + (E(X, '_stripCapCue(__a)') === TEST9) + ' | identity on _testRx ' + (E(X, '_stripCapCue(__b)') === TEST9) + ' | L9 incl. HALF_MANNY non-cue cards: false strips ' + fsx + '/' + n + ' (HALF_MANNY "tank" cards ' + tank + ', false strips ' + tankFs + ') | distinct non-cue details over L432+home_basic+L1 CF3: false strips ' + fd + '/' + nd); fex.forEach(s => P('    false strip ' + JSON.stringify(s))); }
  }
  // (5) HALF_MANNY and uninjured byte-identity
  { const dg = t => progDigest(load(TREES[t]).buildProgram(clone(fixtures.HALF_MANNY))); const dp = t => { const X = load(TREES[t]); pin(X); return progDigest(X.buildProgram(clone(fixtures.HALF_MANNY))); };
    P('\n=== HALF_MANNY digest (unpinned clock, as gates do): V227 ' + dg('V227') + ' V228 ' + dg('V228') + ' CF3 ' + dg('CF3') + ' CF3 again ' + dg('CF3') + ' | pinned 2026-09-24: V228 ' + dp('V228') + ' CF3 ' + dp('CF3') + ' | expected 0ac7da6b1691a8e1');
    const UN = [clone(CFGS.mario_noinj)]; for(const eq of EQ) for(const ex of EXP) for(const fo of FOC){ const c = clone(MARIO); Object.assign(c, { equipment:eq, experience:ex, liftingFocus:fo }); UN.push(c); }
    let s7 = 0, s8 = 0; UN.forEach(c => { const b = plainJSON('CF3', c); if(b === plainJSON('V228', c)) s8++; if(b === plainJSON('V227', c)) s7++; });
    P('  uninjured support lattice + mario_noinj (' + UN.length + '): CF3 == V228 ' + s8 + ' | CF3 == V227 ' + s7 + ' (healthy L1 configs reported under (j))'); }
  // (6) the uninjured live swap leaves no kept dose: every swappable slot of mario_noinj W5 (first candidate), item + day + record JSON V228 vs CF3
  { const st = storedFor('V228', 'mario_noinj'); const Y = { V228:fresh('V228'), CF3:fresh('CF3') }; let n = 0, same = 0, keptCF3 = 0, recSame = 0, undoSame = 0; const ex = [];
    const W = JSON.parse(storedFor('V228', 'mario_noinj')).weeks;
    for(const d of Object.keys(W[5] || {})){ const dy = W[5][d]; ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.name) return; const o = {};
      for(const t of ['V228','CF3']){ const X = Y[t]; setup(X, st); E(X, "currentWeek=5;currentDayKey='" + d + "';"); X.ctx.__D = E(X, 'activeProg.weeks[5].' + d); let tg = []; try { tg = Array.from(E(X, '__cands(__D,5,' + JSON.stringify(it.name) + ')')); } catch(e){} if(!tg.length) return;
        const c = { w:5, d, si, ii }; const h1 = hop(X, c, tg[0]); const h2 = tg[1] ? hop(X, c, tg[1]) : null; o[t] = { item:E(X, 'JSON.stringify(activeProg.weeks[5].' + d + '.sections[' + si + '].items[' + ii + '])'), day:E(X, 'JSON.stringify(activeProg.weeks[5].' + d + ')'), rec:E(X, "localStorage.getItem('ia_swaps_PM')") }; const u = undoLast(X, c); o[t].undo = E(X, 'JSON.stringify(activeProg.weeks[5].' + d + ')'); }
      if(!o.V228 || !o.CF3) return; n++; if(o.V228.item === o.CF3.item && o.V228.day === o.CF3.day) same++; else if(ex.length < 3) ex.push(o.V228.item + ' vs ' + o.CF3.item); if(/_preHold/.test(o.CF3.day + o.CF3.undo)) keptCF3++; if(o.V228.rec === o.CF3.rec) recSame++; if(o.V228.undo === o.CF3.undo) undoSame++; })); }
    P('\n=== (b) uninjured live swap object row, mario_noinj W5 every swappable slot, two hops then undo: slots ' + n + ' | item+day JSON CF3 == V228 ' + same + '/' + n + ' | ia_swaps_ record CF3 == V228 ' + recSame + '/' + n + ' | day after undo CF3 == V228 ' + undoSame + '/' + n + ' | CF3 days carrying _preHold ' + keptCF3); ex.forEach(s => P('    differs ' + s)); }
  // (7) stores after a hop, after a rest move, after a trained-day swap (mario knee/wa W5 thu, Single-leg hip thrust)
  { const st = { V228:storedFor('V228', 'mario'), CF3:storedFor('CF3', 'mario') }; const keysOf = j => j === null ? 'absent' : (j.match(/"_preHold"/g) || []).length + ' _preHold, ' + (j.match(/"ph"/g) || []).length + ' ph';
    const findSlot = X => { const day = E(X, 'activeProg.weeks[5].thu'); let si = -1, ii = -1; day.sections.forEach((s, a) => (s.items || []).forEach((it, b) => { if(clean(it.name) === 'Single-leg hip thrust' && si < 0){ si = a; ii = b; } })); return { w:5, d:'thu', si, ii }; };
    const stores = X => ({ prog:E(X, "localStorage.getItem('ia_programs')"), hist:E(X, "localStorage.getItem('ia_hist_PM')"), sw:E(X, "localStorage.getItem('ia_swaps_PM')") });
    const showS = (tag, s) => P('    ' + tag + ' ia_programs ' + keysOf(s.prog) + ' | ia_hist_PM ' + keysOf(s.hist) + ' | ia_swaps_PM ' + keysOf(s.sw));
    P('\n=== stores (mario knee/wa W5 thu Single-leg hip thrust; hop1 Barbell hip thrust, hop2 Leg extension)');
    for(const t of ['V228','CF3']){ P('  ' + t);
      { const X = fresh(t); setup(X, st[t]); const c = findSlot(X); hop(X, c, 'Barbell hip thrust'); const h2 = hop(X, c, 'Leg extension'); P('    after hops: card ' + JSON.stringify(h2.d) + ' kept ' + JSON.stringify(h2.h)); const s = stores(X); showS('after hop  ', s); if(s.sw) P('      ia_swaps_PM w5_thu ' + JSON.stringify(JSON.parse(s.sw).w5_thu));
        E(X, "_restDraft.w=5;_restDraft.day='wed';_restDraft.pick='fri';"); let err = ''; try { E(X, 'applyRestMove();'); } catch(e){ err = ' CRASH ' + e.message; } const s2 = stores(X); showS('after rest move' + err, s2);
        if(s2.prog){ const pg = JSON.parse(s2.prog).find(p => p.id === 'PM'); const it = pg && pg.weeks[5] && pg.weeks[5].thu && pg.weeks[5].thu.sections[c.si].items[c.ii]; P('      ia_programs W5 thu slot ' + JSON.stringify(it && { name:it.name, detail:it.detail, _preHold:it._preHold })); }
        const Z = fresh(t); bootFrom(X, Z); const sl = slotOf(Z, 5, 'thu', c.si, c.ii); P('      reboot after rest move: slot ' + JSON.stringify(sl)); const h3 = hop(Z, c, 'Barbell good mornings'); P('      hop3 Barbell good mornings live ' + JSON.stringify(h3.d) + ' | ' + h3.t); const Z2 = fresh(t); bootFrom(Z, Z2); P('      boot after hop3 ' + JSON.stringify(slotOf(Z2, 5, 'thu', c.si, c.ii).d)); }
      { const X = fresh(t); setup(X, st[t]); const c = findSlot(X); E(X, "currentWeek=5;currentDayKey='thu';snapshotDay(5,'thu');"); hop(X, c, 'Barbell hip thrust'); hop(X, c, 'Leg extension'); const s = stores(X); showS('trained-day swap (snapshotDay then hops)', s);
        if(s.hist){ const h = JSON.parse(s.hist); const it = h.w5_thu && h.w5_thu.sections[c.si].items[c.ii]; P('      ia_hist_PM w5_thu slot ' + JSON.stringify(it && { name:it.name, detail:it.detail, _preHold:it._preHold })); }
        const Z = fresh(t); bootFrom(X, Z); P('      reboot (hist-restored day): slot ' + JSON.stringify(slotOf(Z, 5, 'thu', c.si, c.ii))); const h3 = hop(Z, c, 'Barbell good mornings'); P('      hop3 Barbell good mornings live ' + JSON.stringify(h3.d) + ' | ' + h3.t); const Z2 = fresh(t); bootFrom(Z, Z2); P('      boot after hop3 ' + JSON.stringify(slotOf(Z2, 5, 'thu', c.si, c.ii).d)); } }
    // readers of _preHold in CF3 (comments stripped)
    const src = fs.readFileSync(TREES.CF3, 'utf8').split('\n'); const lines = []; src.forEach((l, i) => { const nc = l.replace(/\/\/.*$/, ''); if(/_preHold|\.ph\b/.test(nc)) lines.push((i + 1) + ': ' + nc.trim().slice(0, 170)); });
    P('  CF3 source lines touching _preHold / .ph (comments stripped): ' + lines.length); lines.forEach(l => P('    ' + l));
    const ser = []; src.forEach((l, i) => { const nc = l.replace(/\/\/.*$/, ''); if(/JSON\.stringify\((day|it|item|d|dy|x|s\.items|sec\.items|day\.sections|p\.weeks|prog\.weeks|activeProg\.weeks)[)\[.]/.test(nc)) ser.push(i + 1); });
    P('  generic serializers of a day/item in CF3 (JSON.stringify(day|it|item|...)) lines: ' + ser.length + ' ' + ser.slice(0, 40).join(',')); }
  // (8) hand rows: mario W5 thu, three routes, V228 and CF3; R7 rows
  { P('\n=== hand rows: mario knee/wa W5 thu [Single-leg hip thrust]');
    for(const t of ['V228','CF3']){ const st = storedFor(t, 'mario'); const X = fresh(t); setup(X, st); const day = E(X, 'activeProg.weeks[5].thu'); let si = -1, ii = -1; day.sections.forEach((s, a) => (s.items || []).forEach((it, b) => { if(clean(it.name) === 'Single-leg hip thrust' && si < 0){ si = a; ii = b; } })); const c = { w:5, d:'thu', si, ii };
      P('  ' + t + ' native ' + JSON.stringify(slotOf(X, 5, 'thu', si, ii).d));
      const direct = to => { const Q = fresh(t); setup(Q, st); const h = hop(Q, c, to); return JSON.stringify(h.d) + ' | ' + h.t; };
      { const a = []; ['Barbell hip thrust','Leg extension','Barbell good mornings'].forEach(to => { const h = hop(X, c, to); a.push(to + ' ' + JSON.stringify(h.d) + ' kept ' + JSON.stringify(h.h) + ' | ' + h.t); }); const B = fresh(t); bootFrom(X, B); P('    in-session: ' + a.join('\n                ') + '\n      boot ' + JSON.stringify(slotOf(B, 5, 'thu', si, ii).d) + ' | direct GM ' + direct('Barbell good mornings')); }
      { const Y = fresh(t); setup(Y, st); hop(Y, c, 'Barbell hip thrust'); const h2 = hop(Y, c, 'Leg extension'); const Z = fresh(t); bootFrom(Y, Z); const rs = slotOf(Z, 5, 'thu', si, ii); const h3 = hop(Z, c, 'Barbell good mornings'); const B = fresh(t); bootFrom(Z, B);
        P('    reboot route: hop2 Leg extension ' + JSON.stringify(h2.d) + ' kept ' + JSON.stringify(h2.h) + ' | REBOOT slot ' + JSON.stringify(rs.d) + ' kept ' + JSON.stringify(rs.h) + '\n      hop3 Barbell good mornings LIVE ' + JSON.stringify(h3.d) + ' | ' + h3.t + '\n      boot ' + JSON.stringify(slotOf(B, 5, 'thu', si, ii).d) + ' | direct ' + direct('Barbell good mornings')); }
      { const Y = fresh(t); setup(Y, st); const h1 = hop(Y, c, 'Leg extension'); const h2 = hop(Y, c, 'Barbell good mornings'); const rec = JSON.parse(E(Y, "localStorage.getItem('ia_swaps_PM')")).w5_thu; const u = undoLast(Y, c); const h3 = hop(Y, c, 'Barbell hip thrust'); const B = fresh(t); bootFrom(Y, B);
        P('    undo route: hop1 Leg extension ' + JSON.stringify(h1.d) + ' kept ' + JSON.stringify(h1.h) + ' | hop2 GM ' + JSON.stringify(h2.d) + '\n      records ' + JSON.stringify(rec.map(e => ({ from:e.from, to:e.to, rx:e.rx }))) + '\n      UNDO chip ' + JSON.stringify(u.chip) + ' -> ' + JSON.stringify(u.slot.n) + ' ' + JSON.stringify(u.slot.d) + ' kept ' + JSON.stringify(u.slot.h) + '\n      hop3 Barbell hip thrust LIVE ' + JSON.stringify(h3.d) + ' | ' + h3.t + '\n      boot ' + JSON.stringify(slotOf(B, 5, 'thu', si, ii).d) + ' | direct ' + direct('Barbell hip thrust')); } }
    const cfgR7 = L1.find(c => c.injury && c.injury.region === 'knee' && c.injury.tier === 'workaround' && c.equipment === 'commercial' && c.liftingFocus === 'strength' && c.experience === 'beginner' && c.primaryPath === 'lift');
    if(!cfgR7) P('  R7 hand row config NOT FOUND in L1 (failed measurement)'); else for(const t of ['V228','CF3']){ const X0 = load(TREES[t]); pin(X0); const p = X0.buildProgram(clone(cfgR7)); const s0 = clone(p); Object.assign(s0, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfgR7) }); const st = JSON.stringify(s0);
      const wk = Object.keys(p.weeks).find(w => p.weeks[w].thu && p.weeks[w].thu.sections.some(s => (s.items || []).some(it => /Barbell box squat/.test(it.name) && (it.detail === TEST9 || it.detail === R7T))));
      if(!wk){ P('  ' + t + ' R7 row: no test box squat found'); continue; } let si = -1, ii = -1; p.weeks[wk].thu.sections.forEach((s, a) => (s.items || []).forEach((it, b) => { if(/Barbell box squat/.test(it.name) && si < 0){ si = a; ii = b; } })); const c = { w:+wk, d:'thu', si, ii };
      const go = hops => { const Y = fresh(t); setup(Y, st); const r = hops.map(to => { const h = hop(Y, c, to); return to + ' ' + JSON.stringify(h.d) + ' | ' + h.t; }); const B = fresh(t); bootFrom(Y, B); return r.join('\n        ') + '\n        boot ' + JSON.stringify(slotOf(B, c.w, 'thu', si, ii).d); };
      P('  ' + t + ' strength beginner commercial knee/wa W' + wk + ' thu native ' + JSON.stringify(p.weeks[wk].thu.sections[si].items[ii].detail).slice(0, 80) + '\n    -> RDL: ' + go(['Barbell Romanian deadlift']) + '\n    -> Leg press: ' + go(['Leg press']) + '\n    -> Leg press -> RDL: ' + go(['Leg press','Barbell Romanian deadlift'])); } }
  fs.writeFileSync(REP, out.join('\n') + '\n'); console.log('BUILDS DONE');
}
// ─── REPORT: chains (i)/(i-r)/(i-u) and gate rows (j) live, (k), (l) ───
if(PART === 'report'){
  const X = fresh('V228'); const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = E(X, '_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const rd = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  const R = {}; const miss = [];
  const put = (key, f) => { const a = rd(f); if(!a){ miss.push(key + ' ' + f); return; } R[key] = R[key] || {}; a.forEach(r => R[key][r.id] = r); };
  for(const ck of INJ){ for(const m of ['S','R','U']) for(const t of ['V228','CF3']) put(m + t, F('res_' + m + '_' + t + '_' + ck + '.json')); put('SV227', F('res_S_V227_' + ck + '.json')); put('oldV227', I('res_V227_' + ck + '.json')); put('SL', I('res_SL_' + ck + '.json')); put('CF2', I('res_CF2_' + ck + '.json')); }
  P('=== chains: result files missing ' + miss.length + (miss.length ? ' FAILED MEASUREMENT: ' + miss.join(', ') : ''));
  const ids = Object.keys(R.SCF3).filter(id => R.SV228[id] && R.SV227[id] && R.oldV227[id]); const N = ids.length;
  const ne = (a, b) => a.d !== b.d || clean(a.n) !== clean(b.n);
  P('  chains S on all trees ' + N + ' | unreachable at some hop: V227 ' + ids.filter(id => R.SV227[id].bad).length + ' V228 ' + ids.filter(id => R.SV228[id].bad).length + ' CF3 ' + ids.filter(id => R.SCF3[id].bad).length);
  P('  BASELINE V227 re-run == V228-chat V227 run: live ' + ids.filter(id => R.SV227[id].live.d === R.oldV227[id].live.d && R.SV227[id].live.n === R.oldV227[id].live.n).length + '/' + N + ' boot ' + ids.filter(id => R.SV227[id].boot.d === R.oldV227[id].boot.d).length + '/' + N);
  const res7 = new Set(ids.filter(id => ne(R.SV227[id].live, R.SV227[id].boot))), res8 = new Set(ids.filter(id => ne(R.SV228[id].live, R.SV228[id].boot))), resC = new Set(ids.filter(id => ne(R.SCF3[id].live, R.SCF3[id].boot)));
  const cmpSet = (a, b) => { const both = [...a].filter(x => b.has(x)).length; return 'both ' + both + ', first only ' + (a.size - both) + ', second only ' + (b.size - both); };
  P('\n=== (i) in-session, D190 lattice: live != boot V227 ' + res7.size + ' | V228 ' + res8.size + ' | CF3 ' + resC.size + ' | CF3 vs V228 residue ids: ' + cmpSet(resC, res8) + ' | CF3 vs V227 residue ids: ' + cmpSet(resC, res7) + ' | V228 vs V227: ' + cmpSet(res8, res7));
  const endCap = id => capOf(CFGS[R.SCF3[id].ck]).includes(pat(R.SCF3[id].live.n));
  const preC = id => endCap(id) ? handHold(R.SV228[id].live.d) : R.SV228[id].live.d;
  const unc = ids.filter(id => !endCap(id)), capd = ids.filter(endCap);
  P('  CF3 live == pre-hold carry (V228 live end, hand hold when the end is capped) ' + ids.filter(id => R.SCF3[id].live.d === preC(id)).length + '/' + N + ' (uncapped ends ' + unc.filter(id => R.SCF3[id].live.d === preC(id)).length + '/' + unc.length + ', capped ' + capd.filter(id => R.SCF3[id].live.d === preC(id)).length + '/' + capd.length + ') | CF3 boot == pre-hold ' + ids.filter(id => R.SCF3[id].boot.d === preC(id)).length + '/' + N + ' | CF3 live==boot==pre-hold ' + ids.filter(id => R.SCF3[id].live.d === preC(id) && R.SCF3[id].boot.d === preC(id) && !resC.has(id)).length);
  ids.filter(id => !resC.has(id) && R.SCF3[id].live.d !== preC(id)).slice(0, 4).forEach(id => P('    pre-hold miss ' + id + ' ' + R.SCF3[id].hops.join(' > ') + ' CF3 ' + JSON.stringify(R.SCF3[id].live.d) + ' want ' + JSON.stringify(preC(id))));
  const c2 = ids.filter(id => R.CF2[id]), sl = ids.filter(id => R.SL[id]);
  P('  CF3 vs CF2 (V228-chat): live ' + c2.filter(id => R.CF2[id].live.d === R.SCF3[id].live.d).length + '/' + c2.length + ' boot ' + c2.filter(id => R.CF2[id].boot.d === R.SCF3[id].boot.d).length + ' build ' + c2.filter(id => R.CF2[id].build.d === R.SCF3[id].build.d && clean(R.CF2[id].build.n) === clean(R.SCF3[id].build.n)).length + ' undo ' + c2.filter(id => R.CF2[id].undo.d === R.SCF3[id].undo.d && clean(R.CF2[id].undo.n) === clean(R.SCF3[id].undo.n)).length + ' undoBoot ' + c2.filter(id => R.CF2[id].undoBoot.d === R.SCF3[id].undoBoot.d).length + ' chip ' + c2.filter(id => R.CF2[id].chip === R.SCF3[id].chip).length + ' toasts ' + c2.filter(id => JSON.stringify(R.CF2[id].toasts) === JSON.stringify(R.SCF3[id].toasts)).length);
  P('  CF3 vs slices 1+2: boot ' + sl.filter(id => R.SL[id].boot.d === R.SCF3[id].boot.d).length + '/' + sl.length + ' build ' + sl.filter(id => R.SL[id].build.d === R.SCF3[id].build.d && clean(R.SL[id].build.n) === clean(R.SCF3[id].build.n)).length + ' | build carries a kept dose: CF3 ' + ids.filter(id => R.SCF3[id].build.h).length);
  P('  V228 vs slices 1+2 (no clamp vs clamp): build equal ' + sl.filter(id => R.SL[id].build.d === R.SV228[id].build.d).length + '/' + sl.length + ' | V228 chips vs CF2 chips equal ' + c2.filter(id => R.CF2[id].chip === R.SV228[id].chip).length + '/' + c2.length);
  const chipMoved = c2.filter(id => R.CF2[id].chip !== R.SCF3[id].chip); P('  chip moved CF2 -> CF3 ' + chipMoved.length + ' | by class ' + fmt(tally(chipMoved, id => R.SCF3[id].cls)) + ' | undo slot moved CF2 -> CF3 ' + c2.filter(id => R.CF2[id].undo.d !== R.SCF3[id].undo.d || clean(R.CF2[id].undo.n) !== clean(R.SCF3[id].undo.n)).length);
  chipMoved.slice(0, 3).forEach(id => P('    chip moved ' + id + ' ' + R.SCF3[id].hops.join(' > ') + ' CF2 chip ' + JSON.stringify(R.CF2[id].chip) + ' CF3 chip ' + JSON.stringify(R.SCF3[id].chip) + ' | undo CF2 ' + JSON.stringify(clean(R.CF2[id].undo.n)) + ' CF3 ' + JSON.stringify(clean(R.SCF3[id].undo.n))));
  { const restores = k => ids.filter(id => { const r = R[k][id]; return r.steps.length > 1 && r.undo.d === r.steps[r.steps.length - 2]; }).length; const restoresN = k => ids.filter(id => { const r = R[k][id]; return clean(r.undo.n) === clean(r.hops.length > 1 ? r.hops[r.hops.length - 2] : ''); }).length;
    P('  undo restores the pre-last-hop card (detail): V228 ' + restores('SV228') + ' CF3 ' + restores('SCF3') + ' (CF2 ' + c2.filter(id => R.CF2[id].steps.length > 1 && R.CF2[id].undo.d === R.CF2[id].steps[R.CF2[id].steps.length - 2]).length + ') /' + N + ' | by name: V228 ' + restoresN('SV228') + ' CF3 ' + restoresN('SCF3') + ' (CF2 ' + c2.filter(id => clean(R.CF2[id].undo.n) === clean(R.CF2[id].hops[R.CF2[id].hops.length - 2])).length + ')'); }
  P('  CF3 hold toasts on hops ' + ids.reduce((a, id) => a + R.SCF3[id].toasts.filter(t => t.endsWith(HOLD)).length, 0) + ' | V228 ' + ids.reduce((a, id) => a + R.SV228[id].toasts.filter(t => t.endsWith(HOLD)).length, 0));
  const MC = ids.filter(id => R.SCF3[id].ck === 'mario' && R.SCF3[id].w === 5 && R.SCF3[id].d === 'thu' && R.SCF3[id].hops.join('>') === 'Barbell hip thrust>Leg extension>Barbell good mornings');
  MC.forEach(id => P('  mario W5 thu ' + id + ' in-session CF3 steps ' + JSON.stringify(R.SCF3[id].steps) + ' boot ' + JSON.stringify(R.SCF3[id].boot.d) + ' | V228 steps ' + JSON.stringify(R.SV228[id].steps)));
  // (i-r)
  const rids = ids.filter(id => R.RCF3[id] && R.RV228[id]);
  for(const t of ['V228','CF3']){ const rr = R['R' + t], ss = R['S' + t]; const tri = rids.filter(id => rr[id].live.d === rr[id].boot.d && clean(rr[id].live.n) === clean(rr[id].boot.n) && rr[id].live.d === ss[id].live.d); const notTri = new Set(rids.filter(id => !tri.includes(id)));
    P('\n=== (i-r) reboot before the last hop, ' + t + ': chains ' + rids.length + ' | unreachable ' + rids.filter(id => rr[id].bad).length + ' | live==boot==in-session end ' + tri.length + '/' + rids.length + ' | live==boot ' + rids.filter(id => !ne(rr[id].live, rr[id].boot)).length + ' | live==in-session ' + rids.filter(id => rr[id].live.d === ss[id].live.d).length + ' | not-equal ids vs V227 residue: ' + cmpSet(notTri, res7) + ' | rebooted slot carries a kept dose ' + rids.filter(id => rr[id].afterReboot && rr[id].afterReboot.h !== null).length);
    [...notTri].filter(id => !res7.has(id)).slice(0, 4).forEach(id => P('    outside residue ' + id + ' ' + rr[id].hops.join(' > ') + ' rebooted slot ' + JSON.stringify(rr[id].afterReboot) + ' live ' + JSON.stringify(rr[id].live.d) + ' boot ' + JSON.stringify(rr[id].boot.d) + ' in-session ' + JSON.stringify(ss[id].live.d)));
    const mr = rids.filter(id => MC.includes(id)); mr.forEach(id => P('    mario W5 thu reboot route ' + t + ': rebooted slot ' + JSON.stringify(rr[id].afterReboot) + ' | hop3 live ' + JSON.stringify(rr[id].live.d) + ' | ' + rr[id].toasts[2] + ' | boot ' + JSON.stringify(rr[id].boot.d))); }
  // (i-u)
  const uids = Object.keys(R.UCF3 || {}).filter(id => R.UV228[id]);
  for(const t of ['V228','CF3']){ const u = R['U' + t]; const pre = id => capOf(CFGS[u[id].ck]).includes(pat(u[id].live.n)) ? handHold(R.UV228[id].live.d) : R.UV228[id].live.d;
    const lb = uids.filter(id => !ne(u[id].live, u[id].boot)), ld = uids.filter(id => u[id].live.d === u[id].direct.d && clean(u[id].live.n) === clean(u[id].direct.n)), tri = uids.filter(id => lb.includes(id) && ld.includes(id));
    const notLB = new Set(uids.filter(id => ne(u[id].live, u[id].boot)));
    P('\n=== (i-u) undo onto a held intermediate then one more hop, ' + t + ': chains ' + uids.length + ' (hop3 chains whose hop 1 fires) | unreachable ' + uids.filter(id => u[id].bad).length + ' | undo did not land on hop 1 ' + uids.filter(id => u[id].undoMiss).length + ' | live==boot ' + lb.length + ' | live==direct ' + ld.length + ' | live==boot==direct ' + tri.length + ' | live == pre-hold (V228 route, hand hold if capped) ' + uids.filter(id => u[id].live.d === pre(id)).length + ' | undone card carries a kept dose ' + uids.filter(id => u[id].undone.h !== null).length + ' | live!=boot ids vs V227 residue: ' + cmpSet(notLB, res7));
    P('  live != direct by end ' + fmt(tally(uids.filter(id => !ld.includes(id)), id => (capOf(CFGS[u[id].ck]).includes(pat(u[id].live.n)) ? 'capped end ' : 'uncapped end ') + kindOf(u[id].live.d) + ' vs direct ' + kindOf(u[id].direct.d))));
    uids.filter(id => !ld.includes(id) && !notLB.has(id)).slice(0, 3).forEach(id => P('    live!=direct ' + id + ' ' + u[id].hops.join(' > ') + ' undone ' + JSON.stringify(u[id].undone) + ' live ' + JSON.stringify(u[id].live.d) + ' boot ' + JSON.stringify(u[id].boot.d) + ' direct ' + JSON.stringify(u[id].direct.d)));
    uids.filter(id => u[id].live.d !== pre(id)).slice(0, 3).forEach(id => P('    pre-hold miss ' + id + ' ' + u[id].hops.join(' > ') + ' live ' + JSON.stringify(u[id].live.d) + ' want ' + JSON.stringify(pre(id))));
    uids.filter(id => u[id].ck === 'mario' && u[id].w === 5 && u[id].d === 'thu' && u[id].hops.join('>') === 'Leg extension>Barbell good mornings>Barbell hip thrust').forEach(id => P('  mario W5 thu undo route ' + t + ' ' + id + ': undo chip ' + JSON.stringify(u[id].chip) + ' -> ' + JSON.stringify(u[id].undone) + ' | hop3 live ' + JSON.stringify(u[id].live.d) + ' | ' + u[id].toasts[2] + ' | boot ' + JSON.stringify(u[id].boot.d) + ' | direct ' + JSON.stringify(u[id].direct.d))); }
  // ── gate rows ──
  const gfile = t => t === 'V227old' ? I('gate_rows_V227.json') : F('gate_rows_' + t + '.json');
  const shaF = f => fs.existsSync(f) ? crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12) : 'MISSING';
  P('\n=== gate rows (D177 L1 sweep dump): sha V227 re-dump ' + shaF(gfile('V227')) + ' | V228-chat V227 dump ' + shaF(gfile('V227old')) + ' (baseline equals itself: ' + (shaF(gfile('V227')) === shaF(gfile('V227old'))) + ')');
  const slim = r => ({ where:r.where, k:r.k, hout:r.hout, isPow:r.isPow, to:r.to, from:r.from, D:r.D, O:r.O, toast:r.toast, wantT:r.wantT });
  const G = {}; for(const t of ['V227','V228','CF3']){ const f = gfile(t); if(!fs.existsSync(f)){ P('  MISSING ' + f + ' (FAILED MEASUREMENT)'); continue; } G[t] = JSON.parse(fs.readFileSync(f, 'utf8')).map(slim); }
  if(G.V227 && G.V228 && G.CF3){
    const n = G.CF3.length; P('  rows V227 ' + G.V227.length + ' V228 ' + G.V228.length + ' CF3 ' + n + ' | (where,to) aligned ' + G.CF3.filter((r, i) => G.V228[i] && G.V228[i].where === r.where && G.V228[i].to === r.to && G.V227[i].where === r.where && G.V227[i].to === r.to).length);
    const capT = r => { const m = /\|(\w+)\/(\w+) W/.exec(r.where); return m ? (CAP[m[1]] && CAP[m[1]][m[2]] || []).includes(pat(r.to)) : false; };
    const blindBoth = s => (typeof s === 'string') ? s.replace(/ — hold RPE 7, (?:two|three) in the tank$/, '') : s;
    const blindOld = s => (typeof s === 'string' && s.endsWith(OLD)) ? s.slice(0, -OLD.length) : s;
    const bucket = d => /rpe\s*6|light|easy/i.test(d) ? 6 : /rpe\s*7/i.test(d) ? 7 : 8;
    const J = G.CF3.map((r, i) => { const b8 = G.V228[i], b7 = G.V227[i]; const Ds = handStrip(r.D); const conv = r.k === 'zero' && blindBoth(b8.O) !== blindBoth(b8.D);
      const dr = conv ? bucket(Ds) : rpeMax(Ds); const ct = capT(r); const clampPair = ct && dr !== null && dr > 7; const clampNamed = ct && rpeMax(Ds) !== null && (conv ? bucket(Ds) : rpeMax(Ds)) > 7;
      const kind = r.k === 'win' && /The load runs out/.test(b8.toast) ? 'window' : conv ? 'unloadable' : 'verbatim';
      return Object.assign({}, r, { b8, b7, Ds, conv, dr, ct, clampPair, clampNamed, kind }); });
    const want = r => { const to = r.to, from = r.from.toLowerCase(); if(r.kind === 'window'){ const m = /Reps move to (\d+) to (\d+)\./.exec(r.b8.toast); return to + ' in, ' + from + ' out. The load runs out before the reps do here. Reps move to ' + (m ? m[1] : '?') + ' to ' + (m ? m[2] : '?') + '.' + HOLD; }
      if(r.kind === 'unloadable') return to + ' in, ' + from + ' out. No load to add here.' + HOLD; return to + ' in, ' + from + ' out. Same sets, same reps.' + HOLD; };
    const claims = t => /same numbers|same effort/i.test(String(t));
    const cl = J.filter(r => r.clampPair), clN = J.filter(r => r.clampNamed), non = J.filter(r => !r.clampPair);
    P('\n=== (k) toasts. Clamp pairs (hand: capped target + hand-bucketed converted-donor RPE > 7; no-RPE unloadable donors bucket to 8 per the reader rule) ' + cl.length + ' | of them donor names an RPE ' + clN.length + ', donor names none (cued/bare onto unloadable) ' + (cl.length - clN.length) + ' | donor is R7 text ' + cl.filter(r => r.D === R7T).length);
    P('  CF3 toast == expected hold variant ' + cl.filter(r => r.toast === want(r)).length + '/' + cl.length + ' | by variant ' + fmt(tally(cl, r => r.toast.endsWith(HOLD) ? r.kind + '-hold' : 'NOT HOLD (' + r.kind + ', donor ' + (rpeMax(r.Ds) === null ? 'no RPE' : 'RPE ' + rpeMax(r.Ds)) + ', card ' + kindOf(r.O) + ' RPE ' + rpeMax(r.O) + ')')) + ' | false same-numbers/effort claims on clamp pairs ' + cl.filter(r => claims(r.toast)).length);
    cl.filter(r => r.toast !== want(r)).slice(0, 4).forEach(r => P('    miss ' + r.where + ' :: ' + r.from + ' ' + JSON.stringify(r.D) + ' -> ' + r.to + ' ' + JSON.stringify(r.O) + ' | toast ' + JSON.stringify(r.toast)));
    const hn = non.filter(r => r.toast.endsWith(HOLD)); P('  hold toasts off the clamp set ' + hn.length + ' ' + fmt(tally(hn, r => (r.ct ? 'capped' : 'UNCAPPED') + ' donor ' + (rpeMax(r.Ds) === null ? 'no RPE' : 'RPE ' + rpeMax(r.Ds)) + ' ' + r.kind)));
    hn.slice(0, 3).forEach(r => P('    off-set hold ' + r.where + ' :: ' + JSON.stringify(r.D) + ' -> ' + r.to + ' ' + JSON.stringify(r.O) + ' | ' + r.toast));
    P('  non-clamp pairs ' + non.length + ': toast == V228 ' + non.filter(r => r.toast === r.b8.toast).length + ' | == V227 ' + non.filter(r => r.toast === r.b7.toast).length);
    non.filter(r => r.toast !== r.b8.toast).slice(0, 3).forEach(r => P('    non-clamp toast moved ' + r.where + ' :: ' + JSON.stringify(r.D) + ' -> ' + r.to + ' | V228 ' + JSON.stringify(r.b8.toast) + ' | CF3 ' + JSON.stringify(r.toast)));
    const info = non.filter(r => rpeMax(r.Ds) !== null && rpeMax(r.O) !== null && rpeMax(r.O) !== rpeMax(r.Ds) && claims(r.toast));
    P('  INFO (P-BWBUCKET): non-clamp pairs whose card RPE != donor RPE and toast claims same: CF3 ' + info.length + ' ' + fmt(tally(info, r => rpeMax(r.Ds) + '->' + rpeMax(r.O))) + ' | toast == V227 ' + info.filter(r => r.toast === r.b7.toast).length + ' | card == V227 ' + info.filter(r => r.O === r.b7.O).length);
    { const info8 = J.filter(r => !(r.b8.clampPairV) && rpeMax(handStrip(r.b8.D)) !== null && rpeMax(r.b8.O) !== null && rpeMax(r.b8.O) !== rpeMax(handStrip(r.b8.D)) && claims(r.b8.toast)); P('  same predicate on V228 rows (no clamp anywhere): ' + info8.length + ' ' + fmt(tally(info8, r => rpeMax(handStrip(r.b8.D)) + '->' + rpeMax(r.b8.O) + (r.ct ? ' capped' : ' uncapped')))); }
    // (j) live
    const r7 = J.filter(r => r.O === R7T); const r7d = J.filter(r => r.D === R7T && !r.ct);
    P('\n=== (j) live, gate rows: CF3 rows printing R7 text ' + r7.length + ' | donor ' + fmt(tally(r7, r => r.D === TEST9 ? 'TEST9' : r.D === R7T ? 'R7 native' : 'other')) + ' | on capped targets ' + r7.filter(r => r.ct).length + ' | R7-donor rows onto UNCAPPED targets ' + r7d.length + ': card == _testRx ' + r7d.filter(r => r.O === TEST9).length + ', == V228 card ' + r7d.filter(r => r.O === r.b8.O).length + ', == V227 card ' + r7d.filter(r => r.O === r.b7.O).length + ', toast "Same job, same numbers." ' + r7d.filter(r => / out\. Same job, same numbers\.$/.test(r.toast)).length + ' | R7-donor rows onto capped targets ' + J.filter(r => r.D === R7T && r.ct).length + ' (toast hold ' + J.filter(r => r.D === R7T && r.ct && r.toast.endsWith(HOLD)).length + ') | number-only "at RPE 7 … new baseline" in CF3 rows ' + J.filter(r => /at RPE 7\..*new baseline\./.test(r.O)).length);
    // (l) D177 verbatim rows
    const gs = fs.readFileSync(path.join(ROOT, 'tests', 'gates', 'g221_d177_swapfloor.js'), 'utf8'); const REPL = gs.split('\n').filter(l => /^const (REP_TOKEN|stripRep)\b/.test(l)).join('\n'); const { stripRep } = new Function(REPL + '\nreturn { stripRep };')();
    const fails = { G3a:r => !r.isPow && r.k !== 'zero' && r.O !== r.D && stripRep(r.O) !== stripRep(r.D), G3c_pow_twoOnly:r => r.isPow && r.k !== 'zero' && blindOld(r.O) !== blindOld(r.D), G3c_pow_both:r => r.isPow && r.k !== 'zero' && blindBoth(r.O) !== blindBoth(r.D), G3c_off_twoOnly:r => !r.isPow && r.k === 'offgram' && blindOld(r.O) !== blindOld(r.D), G3c_off_both:r => !r.isPow && r.k === 'offgram' && blindBoth(r.O) !== blindBoth(r.D), G3d:r => !r.isPow && r.k === 'atfloor' && r.O !== r.D, G3e:r => !r.isPow && r.k === 'null' && r.O !== r.D, G3f:r => !r.isPow && r.k === 'win' && r.O !== r.hout };
    P('\n=== (l) D177 verbatim rows (carry-pass predicates; "both" = cueBlind on both wordings, "twoOnly" = the V227-era gate reader)');
    for(const [g, f] of Object.entries(fails)){ const f8 = G.V228.filter(f), f7 = G.V227.filter(f), fc = J.filter(f);
      const cls = r => { if(r.ct && blindBoth(r.O) === blindBoth(handHold(blindBoth(r.Ds)))) return 'capped: hold of donor'; if(r.ct && r.O === handHold(r.hout || '')) return 'capped: hold of window'; if(!r.ct && r.O === r.Ds) return 'uncapped: beneath-hold verbatim (R7 donor -> _testRx)'; return (r.ct ? 'capped' : 'UNCAPPED') + ' OTHER'; };
      P('  ' + g.padEnd(16) + ' V227 ' + f7.length + ' | V228 ' + f8.length + ' | CF3 ' + fc.length + ' ' + fmt(tally(fc, cls)) + ' | CF3 by D shape ' + fmt(tally(fc, r => kindOf(r.D)))); }
  }
  fs.writeFileSync(F('v229_report.report.txt'), out.join('\n') + '\n'); console.log('REPORT DONE');
}
// ─── EXTRA: (a″) breakdown on V228 L432, P-HOLDBENEATH INFO and the capped INFO 458 on CF3 gate rows ───
if(PART === 'extra'){
  const X = fresh('V228'); E(X, "var __BUILD=0;var __origBWS=bodyweightSweep; bodyweightSweep=function(weeks){ try{ Object.keys(weeks||{}).forEach(function(w){ Object.keys(weeks[w]||{}).forEach(function(d){ var dy=weeks[w][d]; ((dy&&dy.sections)||[]).forEach(function(s){ (s.items||[]).forEach(function(it){ if(it&&it.name) it.__pre={n:it.name,b:__BUILD}; }); }); }); }); }catch(e){} return __origBWS.apply(this,arguments); };");
  const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = E(X, '_pattern(' + JSON.stringify(clean(n)) + ')') || '-'); const rows = [];
  for(const r of ['knee','ankle','hip','lowback','shoulder','elbow']) for(const t of ['workaround','protect']) for(const eq of ['commercial','crossfit','home_full','bodyweight']) for(const ex of ['beginner','intermediate','advanced']) for(const fo of ['support_strength','support_athletic','support_prevention']){
    const c = clone(MARIO); Object.assign(c, { injury:{ region:r, tier:t }, equipment:eq, experience:ex, liftingFocus:fo }); const cap = capOf(c); E(X, '__BUILD++'); const b = E(X, '__BUILD'); X.ctx.__C = c; const p = E(X, 'buildProgram(__C)');
    Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => ((p.weeks[w][d] && p.weeks[w][d].sections) || []).forEach(s => (s.items || []).forEach(it => { if(!it) return; const pre = it.__pre && it.__pre.b === b ? clean(it.__pre.n) : clean(it.name); if(cap.includes(pat(pre)) && !cap.includes(pat(it.name))) rows.push({ seg:r + '/' + t + '/' + eq + '/' + ex + '/' + fo, pre, n:clean(it.name), fp:pat(pre), np:pat(it.name), label:clean(s.label).replace(/ — .*/, ''), k:kindOf(it.detail), hi:rpeMax(it.detail) > 7, det:it.detail }); })))); }
  P('(a″) V228 L432 filter-capped, final-uncapped: ' + rows.length + ' | by pre>final ' + fmt(tally(rows, x => x.pre + '{' + x.fp + '}>' + x.n + '{' + x.np + '}')) + ' | by region/tier ' + fmt(tally(rows, x => x.seg.split('/').slice(0, 2).join('/'))) + ' | by label ' + fmt(tally(rows, x => x.label)) + ' | by detail kind ' + fmt(tally(rows, x => x.k + (x.hi ? ' RPE>7' : ''))));
  P('  Mains at or under RPE 7 ' + fmt(tally(rows.filter(x => x.label === 'Main' && !x.hi), x => x.seg.split('/')[3] + '/' + x.seg.split('/')[4] + ' ' + String(x.det).replace(/^\d+ sets — /, '').slice(0, 50))));
  const capT = (where, n) => { const m = /\|(\w+)\/(\w+) W/.exec(where); return m ? (CAP[m[1]] && CAP[m[1]][m[2]] || []).includes(pat(n)) : false; };
  const A = JSON.parse(fs.readFileSync(F('gate_rows_V228.json'), 'utf8')).map(r => ({ D:r.D, O:r.O })); const C = JSON.parse(fs.readFileSync(F('gate_rows_CF3.json'), 'utf8'));
  const claims = t => /same numbers|same effort/i.test(String(t));
  const nat = C.map((r, i) => Object.assign(r, { D8:A[i].D, O8:A[i].O })).filter(r => r.D !== r.D8); const unc = nat.filter(r => !capT(r.where, r.to));
  P('P-HOLDBENEATH (gate L1 rows): donor is a CF3 native the build held (D != V228 D) ' + nat.length + ' ' + fmt(tally(nat, r => kindOf(r.D))) + ' | onto UNCAPPED targets ' + unc.length + ' ' + fmt(tally(unc, r => kindOf(r.D) + ' -> card ' + (r.O === handStrip(r.D) ? (r.D === R7T ? '_testRx (beneath the prose hold)' : 'held RPE 7 dose verbatim') : 'other'))));
  const info = C.filter(r => capT(r.where, r.to)).filter(r => { const d = rpeMax(handStrip(r.D)), o = rpeMax(r.O); return d !== null && o !== null && d !== o && claims(r.toast) && !String(r.toast).includes('Your injury plan holds'); });
  P('INFO (k) capped targets, CF3: card RPE != donor RPE, toast claims same, no hold toast ' + info.length + ' ' + fmt(tally(info, r => rpeMax(handStrip(r.D)) + '->' + rpeMax(r.O))));
  fs.writeFileSync(F('v229_extra.report.txt'), out.join('\n') + '\n'); console.log('EXTRA DONE');
}
