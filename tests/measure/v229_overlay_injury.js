// v229_overlay_injury.js — MEASURE (read-only). Builder's slice-3 park (standing ruling 7): on a real app program an injury
//   arrives only as an overlay (ov.type==='injury', ov.patch.injury); prog.cfg carries no injury. The live tap (activeProg.cfg.injury)
//   and boot replay (prog.cfg.injury) both read cfg.injury. This pass prints what an overlay-injured program receives vs the same
//   program presented with a stored cfg.injury (the presentation D190/D193/M8 measured), on V227, V228, the slice-2 tree and CF3.
//   SCR=<scratch> PART=<static|single|chains|l1|report> node tests/measure/v229_overlay_injury.js
// Oracles: the hand cap table (Amendment 1), the ruling's literal cue/R7/R8 strings, a hand RPE parse, source line order for
//   item 5, and presentation-vs-presentation identity (CFG presentation is the reference; OV is the app's real path). Nothing asks
//   _capRpeClamp, applyInjuryFilter or injuryPlan what the answer should be.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const PRIOR = process.env.PRIOR || '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/measure';
const PART = process.env.PART || 'none';
const TREES = { V227:F('v227.html'), V228:F('v228.html'), SL2:F('slice2.html'), CF3:F('cf3.html') };
const CUE = / — hold RPE 7, (two|three) in the tank$/;
const R7T = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const HOLDT = 'Your injury plan holds this one at RPE 7.';
const START = '2026-08-24', CLOCK = '2026-09-24', FROM = '2026-09-21';   // FROM = W5 Monday
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const withInj = (inj, extra) => { const c = Object.assign(clone(MARIO), extra || {}); if(inj) c.injury = inj; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }), lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }),
  lowback_bw:withInj({ region:'lowback', tier:'workaround' }, { equipment:'bodyweight' }) };
const CAP = { knee:{ workaround:['squat','lunge','leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat','lunge'], protect:['squat'] }, hip:{ workaround:['hinge','lunge','hip_ext','squat'], protect:['squat'] }, lowback:{ workaround:['hinge','squat','row','hip_ext'], protect:['squat','hip_ext'] }, shoulder:{ workaround:['hpress','vpress','delt_iso'], protect:[] }, elbow:{ workaround:['hpress','tri_iso','bi_iso','row','vpull'], protect:['row','vpull'] } };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const rpeMax = d => { const v = [...String(d || '').matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)); return v.length ? Math.max(...v) : null; };
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const P = s => console.log(s);
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};try{closeRestSheet=function(){};}catch(e){}";
function fresh(t){ const X = load(TREES[t]); pin(X); E(X, HELP); return X; }
function setup(IA, st){ IA.localStorage.clear(); IA.ctx.__SP = JSON.parse(st); E(IA, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function bootFrom(src, dst){ const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
// Stored program for a presentation. CFG: built from the injured cfg, cfg.injury stored (the D190/D193/M8 presentation).
// OV: built uninjured, then the app's own writer (applyInjuryDraft, :15690) adds the overlay; the stored record is read back.
const _stCache = {};
function storedFor(t, ck, pres){ const key = t + '_' + ck + '_' + pres; if(_stCache[key]) return _stCache[key]; const f = F('stored_' + key + '.json'); if(fs.existsSync(f)) return (_stCache[key] = fs.readFileSync(f, 'utf8'));
  const X = fresh(t); const inj = CFGS[ck].injury; const base = clone(CFGS[ck]); delete base.injury; const cfg = pres === 'CFG' ? clone(CFGS[ck]) : base;
  const p = X.buildProgram(clone(cfg)); const s = clone(p); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) }); let j = JSON.stringify(s);
  if(pres === 'OV'){ setup(X, j); E(X, "_ovDraft.injRegion=" + JSON.stringify(inj.region) + ";_ovDraft.injTier=" + JSON.stringify(inj.tier) + ";_ovDraft.from='" + FROM + "';applyInjuryDraft();");
    const ps = JSON.parse(E(X, "localStorage.getItem('ia_programs')")); j = JSON.stringify(ps.find(x => x.id === 'PM')); }
  fs.writeFileSync(f, j); return (_stCache[key] = j); }
const slotOf = (IA, w, d, si, ii) => JSON.parse(E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";var it=dy&&dy.sections[" + si + "]&&dy.sections[" + si + "].items[" + ii + "];return it?JSON.stringify({n:it.name,d:it.detail||'',h:(typeof it._preHold==='string')?it._preHold:null}):JSON.stringify({n:'(none)',d:'',h:null});})()"));
function hop(IA, c, to){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); IA.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:cur.n, detail:cur.d }; IA.ctx.__to = to; E(IA, '__T.length=0;'); let bad = 0;
  try { E(IA, '_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ bad = 1; } const after = slotOf(IA, c.w, c.d, c.si, c.ii); if(clean(after.n) !== clean(to)) bad = 1; return { d:after.d, n:after.n, h:after.h, t:Array.from(E(IA, '__T')).join(' / '), bad }; }
function undoLast(IA, c){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); const chip = E(IA, 'swapOriginOf(' + JSON.stringify(cur.n) + ')') || ''; let err = null; if(chip){ try { E(IA, 'undoSwap(' + JSON.stringify(chip) + ');'); } catch(e){ err = e.message; } } return { chip, err, slot:slotOf(IA, c.w, c.d, c.si, c.ii) }; }
const lastRx = IA => { const r = JSON.parse(E(IA, "localStorage.getItem('ia_swaps_PM')") || '{}'); const out = []; Object.values(r).forEach(l => (l || []).forEach(e => (e.rx || []).forEach(x => out.push(x)))); return out; };
function stripClock(j){ const o = JSON.parse(j); (o.overlays || []).forEach(v => { delete v.id; delete v.created; }); return JSON.stringify(o); }
module.exports = { CFGS, CAP, TREES };

// ─── STATIC: items 1, 2, 5 from source (comments stripped) ───
if(PART === 'static'){
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:"'\\])\/\/[^\n]*/g, '$1');
  P('TREES ' + Object.keys(TREES).map(t => t + ' ' + sha(TREES[t]) + ' ia-version ' + (fs.readFileSync(TREES[t], 'utf8').match(/ia-version" content="(\d+)"/) || [])[1]).join(' | ') + ' | working index.html ' + sha(path.join(ROOT, 'index.html')));
  for(const t of ['V228','SL2']){ const L = strip(fs.readFileSync(TREES[t], 'utf8')).split('\n');
    const fnAt = i => { for(let k = i; k >= 0; k--){ const m = /^\s*function\s+([\w$]+)\s*\(/.exec(L[k]); if(m) return m[1] + ':' + (k + 1); } return '?'; };
    const W = [], R = [];
    L.forEach((x, i) => { if(/\.injury\s*=[^=]/.test(x) || /\binjury\s*:/.test(x) || /delete\s+[\w.]*\.injury/.test(x) || /\[\s*['"]injury['"]\s*\]/.test(x)) W.push((i + 1) + ' [' + fnAt(i) + '] ' + x.trim().slice(0, 130));
      if(/\bcfg\.injury\b|\bcfg&&cfg\.injury|_cfg\.injury/.test(x)) R.push((i + 1) + ' [' + fnAt(i) + ']'); });
    P('\n[1] ' + t + ' comment-stripped sites with an injury write shape (=, key:, delete, [\'injury\']): ' + W.length); W.forEach(s => P('    ' + s));
    P('[2] ' + t + ' comment-stripped cfg.injury reads: ' + R.length + ' -> ' + R.join(', '));
    // which enclosing functions are reached from buildProgram's body (static: name appears in buildProgram's text)
    const src = L.join('\n'); const bpS = src.indexOf('function buildProgram(cfg){'); let depth = 0, k = src.indexOf('{', bpS), bpE = k; for(; k < src.length; k++){ if(src[k] === '{') depth++; else if(src[k] === '}'){ depth--; if(!depth){ bpE = k; break; } } }
    const bp = src.slice(bpS, bpE); const bpL0 = src.slice(0, bpS).split('\n').length, bpL1 = src.slice(0, bpE).split('\n').length;
    P('    buildProgram spans lines ' + bpL0 + '-' + bpL1);
    const fns = [...new Set(R.map(r => r.match(/\[(\w+):/)[1]))];
    fns.forEach(fn => { const inBP = new RegExp('\\b' + fn + '\\s*\\(').test(bp); const callers = []; L.forEach((x, i) => { if(new RegExp('\\b' + fn + '\\s*\\(').test(x) && !/^\s*function\s/.test(x)) callers.push((i + 1) + '<' + fnAt(i).split(':')[0] + '>'); });
      P('    reader fn ' + fn + ' | called inside buildProgram body: ' + inBP + ' | call sites ' + callers.length + ': ' + callers.slice(0, 14).join(' ')); });
    // item 5: order inside refreshProgram
    const rs = src.indexOf('function refreshProgram(prog){'); const rp = src.slice(rs, rs + 30000); const base = src.slice(0, rs).split('\n').length;
    const at = tok => { const i = rp.indexOf(tok); return i < 0 ? 'ABSENT' : (base + rp.slice(0, i).split('\n').length - 1); };
    P('[5] ' + t + ' refreshProgram order: buildProgram(prog.cfg) ' + at('buildProgram(prog.cfg)') + ' | applyOverlays ' + at('applyOverlays(prog, rebuilt)') + ' | freeze _pierce ' + at('const _pierce') + ' | applyRestDayMoves ' + at('applyRestDayMoves(rebuilt') + ' | applySessionSwaps ' + at('applySessionSwaps(rebuilt') + ' | pruneDayEdits ' + at('pruneDayEdits(prog.id'));
  }
  // history scan output (histscan.js over every .html blob in the repo)
  const hs = F('hist_writers.out'); if(fs.existsSync(hs)){ const t = fs.readFileSync(hs, 'utf8').split('\n').filter(l => /^v\d/.test(l)); const vers = t.map(l => +l.match(/^v(\d+)/)[1]);
    const rd = t.filter(l => /cfg\.injury-read:true/.test(l)).map(l => +l.match(/^v(\d+)/)[1]); const wr = t.filter(l => !/writers:0/.test(l));
    P('\n[1] history: ' + t.length + ' distinct .html blobs, ia-versions ' + Math.min(...vers.filter(Boolean)) + '..' + Math.max(...vers) + ' (+' + vers.filter(v => !v).length + ' unversioned) | first blob reading cfg.injury v' + Math.min(...rd) + ' | blobs with a non-overlay injury write shape: ' + wr.length + (wr.length ? ' -> ' + wr.map(l => l.slice(0, 60)).join(' ; ') : ''));
    P('    versions present ' + [...new Set(vers)].sort((a, b) => a - b).join(','));
  } else P('[1] history scan output MISSING');
  // handoff lines on Mario's own injury
  const HO = fs.readFileSync(path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md'), 'utf8').split('\n');
  const hits = []; HO.forEach((l, i) => { if(/Mario/.test(l) && /injur/i.test(l) && /(own|his|live|device)/.test(l)) hits.push((i + 1) + ': ' + l.slice(0, 220)); });
  P('\n[1] handoff lines with Mario + injury + own/his/live/device: ' + hits.length); hits.slice(0, 12).forEach(s => P('    ' + s));
}

// ─── SINGLE: item 3 on the two named programs, every tree, both presentations ───
if(PART === 'single'){
  const pat = (() => { const X = fresh('V228'); const c = {}; return n => (n in c) ? c[n] : (c[n] = X.eval('_pattern(' + JSON.stringify(clean(n)) + ')') || '-'); })();
  // baseline equals itself: two VMs, same stored record, pinned clock; overlay ids/created stripped
  for(const t of ['V228','SL2']) for(const pres of ['CFG','OV']){ const a = fresh(t), b = fresh(t); const st = storedFor(t, 'mario', pres); setup(a, st); setup(b, st);
    const ja = E(a, 'JSON.stringify(activeProg.weeks)'), jb = E(b, 'JSON.stringify(activeProg.weeks)'); P('BASELINE self ' + t + ' ' + pres + ' weeks equal ' + (ja === jb) + ' (' + ja.length + ' bytes) | stored record equal after clock strip: ' + (stripClock(storedFor(t, 'mario', pres)) === stripClock(st))); }
  // the two presentations must differ somewhere, or the instrument is blind
  for(const t of ['V228','SL2']){ const a = fresh(t), b = fresh(t); setup(a, storedFor(t, 'mario', 'CFG')); setup(b, storedFor(t, 'mario', 'OV'));
    const st = JSON.parse(storedFor(t, 'mario', 'OV'));
    P('PRESENTATION ' + t + ' mario: OV stored cfg.injury ' + JSON.stringify(st.cfg.injury) + ' overlays ' + JSON.stringify((st.overlays || []).map(o => ({ type:o.type, from:o.from, to:o.to, patch:o.patch }))) + ' | live activeProg.cfg.injury CFG ' + JSON.stringify(E(a, 'JSON.stringify(activeProg.cfg.injury)')) + ' OV ' + JSON.stringify(E(b, 'JSON.stringify(activeProg.cfg.injury||null)')));
    const wa = JSON.parse(E(a, 'JSON.stringify(activeProg.weeks)')), wb = JSON.parse(E(b, 'JSON.stringify(activeProg.weeks)'));
    const perW = {}; Object.keys(wa).forEach(w => { perW[w] = Object.keys(wa[w]).filter(d => JSON.stringify(wa[w][d]) !== JSON.stringify((wb[w] || {})[d])).length + '/' + Object.keys(wa[w]).length; });
    P('    days differing CFG vs OV by week ' + JSON.stringify(perW)); }
  const ROWS = [];
  for(const ck of ['mario','lowback_bw']){ const cap = CAP[CFGS[ck].injury.region][CFGS[ck].injury.tier];
    for(const t of ['V227','V228','SL2','CF3']) for(const pres of ['CFG','OV']){ const A = fresh(t); setup(A, storedFor(t, ck, pres));
      // W5 cards: cue / R7 / RPE>7 on a capped pattern
      const wk = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[5])')); let cards = 0, capd = 0, cue = 0, r7 = 0, hi = 0; const hiEx = [];
      Object.keys(wk).forEach(d => ((wk[d] && wk[d].sections) || []).forEach(s => (s.items || []).forEach(it => { if(!it || !it.name) return; cards++; const c = cap.includes(pat(it.name)); if(c) capd++; if(CUE.test(it.detail || '')) cue++; if(it.detail === R7T) r7++; if(c && rpeMax(it.detail) > 7){ hi++; if(hiEx.length < 3) hiEx.push(d + ' ' + clean(it.name) + ' ' + JSON.stringify(it.detail)); } })));
      P('\n[3] ' + ck + ' ' + t + ' ' + pres + ' W5 spliced cards ' + cards + ' | on capped pattern ' + capd + ' | cue ' + cue + ' | R7 text ' + r7 + ' | capped with RPE>7 ' + hi + (hiEx.length ? ' e.g. ' + hiEx.join(' ; ') : ''));
      ROWS.push({ ck, t, pres, cards, capd, cue, r7, hi }); } }
  // the named mario W5 thu chain: Single-leg hip thrust -> Barbell hip thrust -> Leg extension -> Barbell good mornings
  const HOPS = ['Barbell hip thrust','Leg extension','Barbell good mornings'];
  for(const t of ['V227','V228','SL2','CF3']) for(const pres of ['CFG','OV']){ const A = fresh(t), B = fresh(t), C = fresh(t); setup(A, storedFor(t, 'mario', pres));
    const thu = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[5].thu)')); let si = -1, ii = -1; thu.sections.forEach((s, a) => (s.items || []).forEach((it, b) => { if(si < 0 && clean(it.name) === 'Single-leg hip thrust'){ si = a; ii = b; } }));
    if(si < 0){ P('[3] chain ' + t + ' ' + pres + ' FAILED: no Single-leg hip thrust on W5 thu'); continue; }
    const c = { w:5, d:'thu', si, ii }; const s0 = slotOf(A, 5, 'thu', si, ii); P('\n[3] chain ' + t + ' ' + pres + ' W5 thu [' + si + ',' + ii + '] start ' + clean(s0.n) + ' ' + JSON.stringify(s0.d));
    HOPS.forEach((to, k) => { const h = hop(A, c, to); P('    hop' + (k + 1) + ' -> ' + clean(h.n) + ' (' + pat(to) + ', capped ' + CAP.knee.workaround.includes(pat(to)) + ') ' + JSON.stringify(h.d) + ' | _preHold ' + (h.h === null ? 'none' : JSON.stringify(h.h)) + ' | toast "' + h.t + '"' + (h.bad ? ' | BAD' : '')); });
    const rx = lastRx(A); P('    record rx entries ' + rx.length + ', with ph ' + rx.filter(x => 'ph' in x).length);
    bootFrom(A, B); const b = slotOf(B, 5, 'thu', si, ii); P('    BOOT  ' + clean(b.n) + ' ' + JSON.stringify(b.d) + ' | _preHold ' + (b.h === null ? 'none' : 'PRESENT'));
    const u = undoLast(A, c); P('    UNDO chip ' + JSON.stringify(u.chip) + ' -> ' + clean(u.slot.n) + ' ' + JSON.stringify(u.slot.d) + ' | _preHold ' + (u.slot.h === null ? 'none' : 'PRESENT') + (u.err ? ' ERR ' + u.err : ''));
    bootFrom(A, C); const ub = slotOf(C, 5, 'thu', si, ii); P('    UNDO+BOOT ' + clean(ub.n) + ' ' + JSON.stringify(ub.d)); }
  // item 5 trace: during a boot of an OV program carrying a swap on a spliced day, which runs first and what applySessionSwaps sees
  for(const t of ['V228','SL2']){ const A = fresh(t), B = fresh(t); setup(A, storedFor(t, 'mario', 'OV')); const thu = JSON.parse(E(A, 'JSON.stringify(activeProg.weeks[5].thu)')); let si = -1, ii = -1; thu.sections.forEach((s, a) => (s.items || []).forEach((it, b) => { if(si < 0 && clean(it.name) === 'Single-leg hip thrust'){ si = a; ii = b; } }));
    hop(A, { w:5, d:'thu', si, ii }, 'Barbell hip thrust');
    E(B, "globalThis.__TR=[];(function(){var o=applyOverlays;applyOverlays=function(p,r){__TR.push('applyOverlays');return o.apply(this,arguments);};var s=applySessionSwaps;applySessionSwaps=function(p,st){var d=p.weeks[5]&&p.weeks[5].thu;var cue=0;((d&&d.sections)||[]).forEach(function(x){(x.items||[]).forEach(function(i){if(/ — hold RPE 7, (two|three) in the tank$/.test(i.detail||''))cue++;});});__TR.push('applySessionSwaps(W5thu cue cards before='+cue+', prog.cfg.injury='+JSON.stringify(p.cfg&&p.cfg.injury||null)+')');return s.apply(this,arguments);};var f=applyInjuryFilter;applyInjuryFilter=function(sec,c){__TR.push('applyInjuryFilter(cfg.injury='+JSON.stringify(c&&c.injury||null)+')');return f.apply(this,arguments);};})();");
    bootFrom(A, B); const tr = Array.from(E(B, '__TR')); const comp = {}; const seq = []; tr.forEach(x => { const k = x.replace(/\(.*$/, '') + (x.indexOf('applyInjuryFilter') === 0 ? x.slice(17) : ''); if(seq.length && seq[seq.length - 1].k === k) seq[seq.length - 1].n++; else seq.push({ k, n:1, x }); });
    P('\n[5] ' + t + ' OV boot trace (consecutive repeats folded): ' + seq.map(s => s.x + (s.n > 1 ? ' x' + s.n : '')).join(' -> ').slice(0, 900)); }
}

// ─── CHAINS worker (mode S: in-session hops, boot, undo, undo+boot) over the D190 lattice chains, one presentation ───
if(process.env.WORKER){
  const [kind, t, ck, pres] = process.env.WORKER.split(':'); const st = kind === 'C' ? storedFor(t, ck, pres) : null; const res = [];
  if(kind === 'C'){ const chains = JSON.parse(fs.readFileSync(path.join(PRIOR, 'in', 'chains_' + ck + '.json'), 'utf8'));
    const by = {}; chains.forEach(c => (by[c.w + c.d] = by[c.w + c.d] || []).push(c)); const lists = Object.values(by); const nB = Math.max(0, ...lists.map(l => l.length));
    const A = fresh(t), B2 = fresh(t), B3 = fresh(t);
    for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); setup(A, st); const r = {};
      batch.forEach(c => r[c.id] = { id:c.id, ck, w:c.w, d:c.d, si:c.si, ii:c.ii, hops:c.hops, start:slotOf(A, c.w, c.d, c.si, c.ii), steps:[], toasts:[], kept:[], bad:0 });
      for(const c of batch){ const s = r[c.id]; for(const to of c.hops){ const h = hop(A, c, to); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h !== null); s.bad += h.bad; } s.live = slotOf(A, c.w, c.d, c.si, c.ii); }
      const rx = JSON.parse(E(A, "localStorage.getItem('ia_swaps_PM')") || '{}'); batch.forEach(c => { r[c.id].ph = ((rx['w' + c.w + '_' + c.d] || []).reduce((n, e) => n + (e.rx || []).filter(x => 'ph' in x).length, 0)); });
      bootFrom(A, B2); for(const c of batch) r[c.id].boot = slotOf(B2, c.w, c.d, c.si, c.ii);
      for(const c of batch){ const u = undoLast(A, c); r[c.id].undo = u.slot; if(u.err) r[c.id].undoErr = u.err; }
      bootFrom(A, B3); for(const c of batch) r[c.id].undoBoot = slotOf(B3, c.w, c.d, c.si, c.ii);
      batch.forEach(c => res.push(r[c.id])); } }
  if(kind === 'L'){ // D177 L1 injured slice: every W5 card with a pattern, one hop to the CFG presentation's first candidate
    const L1 = JSON.parse(fs.readFileSync(path.join(PRIOR, 'in', 'gate_rows_V227.json.l1'), 'utf8')); const lo = +ck.split('-')[0], hi = +ck.split('-')[1];
    const A = fresh(t), B = fresh(t), Q = fresh(t);
    for(let ci = lo; ci < Math.min(hi, L1.length); ci++){ const cfg = L1[ci]; if(!cfg.injury) continue; CFGS['L' + ci] = cfg;
      const stC = storedFor(t, 'L' + ci, 'CFG'), stO = storedFor(t, 'L' + ci, 'OV');
      setup(Q, stC); const wk = JSON.parse(E(Q, 'JSON.stringify(activeProg.weeks[5])')); const slots = [];
      Object.keys(wk).forEach(d => ((wk[d] && wk[d].sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it && it.name && E(Q, '_pattern(' + JSON.stringify(it.name) + ')')) slots.push({ w:5, d, si, ii, n:it.name }); })));
      // candidate lists in both presentations; illegal offers judged by the CFG VM's own legality on the injured cfg
      setup(B, stO); const pick = {};
      slots.forEach(s => { Q.ctx.__n = s.n; B.ctx.__n = s.n; const cC = Array.from(E(Q, '__cands(activeProg.weeks[5].' + s.d + ',5,__n)')); const cO = Array.from(E(B, '__cands(activeProg.weeks[5].' + s.d + ',5,__n)'));
        const extra = cO.filter(n => cC.indexOf(n) < 0); const illegal = extra.filter(n => { Q.ctx.__m = n; return !E(Q, '_swapInjuryOK(__m,activeProg.cfg)'); });
        s.cC = cC.length; s.cO = cO.length; s.extra = extra.length; s.illegal = illegal.length; s.illEx = illegal.slice(0, 2); s.to = cC[0] || null; });
      const byD = {}; slots.filter(s => s.to).forEach(s => (byD[s.d] = byD[s.d] || []).push(s)); const lists = Object.values(byD); const nB = Math.max(0, ...lists.map(l => l.length));
      slots.filter(s => !s.to).forEach(s => res.push({ cfg:ci, reg:cfg.injury.region + '/' + cfg.injury.tier, eq:cfg.equipment, ...s, noCand:1 }));
      for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); const out = {};
        for(const pr of ['CFG','OV']){ setup(A, pr === 'CFG' ? stC : stO); batch.forEach(s => { const st0 = slotOf(A, 5, s.d, s.si, s.ii); const h = hop(A, s, s.to); out[s.d + s.si + '_' + s.ii + pr] = { start:st0, live:{ n:h.n, d:h.d }, t:h.t, kept:h.h !== null, bad:h.bad }; });
          bootFrom(A, B); batch.forEach(s => { out[s.d + s.si + '_' + s.ii + pr].boot = slotOf(B, 5, s.d, s.si, s.ii); }); }
        batch.forEach(s => { const k = s.d + s.si + '_' + s.ii; res.push({ cfg:ci, reg:cfg.injury.region + '/' + cfg.injury.tier, eq:cfg.equipment, exp:cfg.experience, ...s, C:out[k + 'CFG'], O:out[k + 'OV'] }); }); } } }
  fs.writeFileSync(F('res_' + kind + '_' + t + '_' + ck + '_' + pres + '.json'), JSON.stringify(res)); console.log('worker ' + process.env.WORKER + ' ' + res.length); process.exit(0);
}
function runJobs(jobs, par){ let i = 0; const t0 = Date.now(); const runOne = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { WORKER:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { console.log(code ? 'WORKER CRASH ' + j + ' ' + o.slice(-600) : o.trim() + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  return Promise.all(Array.from({ length:par }, async () => { while(i < jobs.length){ await runOne(jobs[i++]); } })).then(() => console.log('jobs done ' + jobs.length + ' in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s')); }
if(PART === 'chains'){ const jobs = []; const cks = (process.env.CKS || 'elbow_wa,shoulder_wa,lowback_wa,hip_wa,knee_protect,mario,ankle_wa').split(','); const trees = (process.env.CT || 'V228,SL2').split(',');
  for(const ck of cks) for(const t of trees) for(const pres of ['CFG','OV']) jobs.push('C:' + t + ':' + ck + ':' + pres); runJobs(jobs, +(process.env.PAR || 8)); }
if(PART === 'l1'){ const jobs = []; const trees = (process.env.CT || 'V228,SL2').split(','); for(const t of trees) for(let lo = 0; lo < 384; lo += 24) jobs.push('L:' + t + ':' + lo + '-' + (lo + 24) + ':X'); runJobs(jobs, +(process.env.PAR || 8)); }

// ─── REPORT: item 4 ───
if(PART === 'report'){
  const X = fresh('V228'); const pc = {}; const pat = n => (n in pc) ? pc[n] : (pc[n] = X.eval('_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const trees = (process.env.CT || 'V228,SL2').split(',');
  for(const t of trees){ const rows = []; let crash = 0;
    for(const ck of Object.keys(CFGS).filter(k => k !== 'lowback_bw')){ const fc = F('res_C_' + t + '_' + ck + '_CFG.json'), fo = F('res_C_' + t + '_' + ck + '_OV.json'); if(!fs.existsSync(fc) || !fs.existsSync(fo)){ crash++; P('MISSING ' + fc); continue; }
      const C = JSON.parse(fs.readFileSync(fc)), O = new Map(JSON.parse(fs.readFileSync(fo)).map(r => [r.id, r])); const cap = CAP[CFGS[ck].injury.region][CFGS[ck].injury.tier];
      C.forEach(c => { const o = O.get(c.id); if(!o){ rows.push({ ck, w:c.w, k:'MISSING' }); return; } const last = c.hops[c.hops.length - 1]; const capT = cap.includes(pat(last));
        rows.push({ ck, w:c.w, startSame:c.start.n === o.start.n && c.start.d === o.start.d, live:c.live.d !== o.live.d || c.live.n !== o.live.n, toast:c.toasts.join('|') !== o.toasts.join('|'), boot:c.boot.d !== o.boot.d || c.boot.n !== o.boot.n, undo:c.undo.d !== o.undo.d || c.undo.n !== o.undo.n, undoBoot:c.undoBoot.d !== o.undoBoot.d || c.undoBoot.n !== o.undoBoot.n,
          holdC:c.toasts.some(x => x.indexOf(HOLDT) >= 0), holdO:o.toasts.some(x => x.indexOf(HOLDT) >= 0), keptC:c.kept.some(Boolean), keptO:o.kept.some(Boolean), phC:c.ph, phO:o.ph,
          cueC:CUE.test(c.live.d), cueO:CUE.test(o.live.d), capT, hiC:capT && rpeMax(c.live.d) > 7, hiO:capT && rpeMax(o.live.d) > 7, bootHiO:capT && rpeMax(o.boot.d) > 7, bootCueO:CUE.test(o.boot.d), bootCueC:CUE.test(c.boot.d), bootLiveO:o.boot.d !== o.live.d, bootLiveC:c.boot.d !== c.live.d, bad:c.bad + o.bad, ex:{ c, o } }); }); }
    const W5 = rows.filter(r => r.w === 5 && r.startSame), W3 = rows.filter(r => r.w === 3), mis = rows.filter(r => r.w === 5 && !r.startSame);
    P('\n[4] D190 lattice chains ' + t + ': ' + rows.length + ' chains (' + crash + ' missing files) | W3 (past week, outside overlay from ' + FROM + '; freeze serves the stored uninjured grid) ' + W3.length + ' excluded | W5 start card differs between presentations ' + mis.length + ' | W5 comparable ' + W5.length);
    const cnt = (A, f) => A.filter(f).length;
    const line = (A, lbl) => P('  ' + lbl + ' n=' + A.length + ' | live card differs ' + cnt(A, r => r.live) + ' | any toast differs ' + cnt(A, r => r.toast) + ' | boot card differs ' + cnt(A, r => r.boot) + ' | undo differs ' + cnt(A, r => r.undo) + ' | undo+boot differs ' + cnt(A, r => r.undoBoot) + ' | ANY differs ' + cnt(A, r => r.live || r.toast || r.boot || r.undo || r.undoBoot)
      + '\n      hold toast CFG ' + cnt(A, r => r.holdC) + ' OV ' + cnt(A, r => r.holdO) + ' | _preHold kept CFG ' + cnt(A, r => r.keptC) + ' OV ' + cnt(A, r => r.keptO) + ' | ph in record CFG ' + A.reduce((n, r) => n + r.phC, 0) + ' OV ' + A.reduce((n, r) => n + r.phO, 0)
      + '\n      final hop onto capped pattern ' + cnt(A, r => r.capT) + ': live cue CFG ' + cnt(A, r => r.capT && r.cueC) + ' OV ' + cnt(A, r => r.capT && r.cueO) + ' | live RPE>7 CFG ' + cnt(A, r => r.hiC) + ' OV ' + cnt(A, r => r.hiO) + ' | boot RPE>7 OV ' + cnt(A, r => r.bootHiO) + ' | boot cue CFG ' + cnt(A, r => r.capT && r.bootCueC) + ' OV ' + cnt(A, r => r.capT && r.bootCueO)
      + '\n      boot != live (same presentation) CFG ' + cnt(A, r => r.bootLiveC) + ' OV ' + cnt(A, r => r.bootLiveO) + ' | hop failures ' + cnt(A, r => r.bad));
    line(W5, 'W5 all');
    [...new Set(W5.map(r => r.ck))].forEach(ck => line(W5.filter(r => r.ck === ck), 'W5 ' + ck));
    W5.filter(r => r.hiO).slice(0, 4).forEach(r => P('    e.g. OV RPE>7 on capped ' + r.ck + ' ' + r.ex.c.d + ' ' + r.ex.c.hops.join(' > ') + ' | OV ' + JSON.stringify(r.ex.o.live.d) + ' | CFG ' + JSON.stringify(r.ex.c.live.d)));
    W5.filter(r => r.cueC && !r.cueO).slice(0, 2).forEach(r => P('    e.g. cue lost ' + r.ck + ' ' + r.ex.c.hops.join(' > ') + ' | OV ' + JSON.stringify(r.ex.o.live.d) + ' | CFG ' + JSON.stringify(r.ex.c.live.d)));
    mis.slice(0, 3).forEach(r => P('    start differs ' + r.ck + ' ' + r.ex.c.d + ' CFG ' + clean(r.ex.c.start.n) + ' ' + JSON.stringify(r.ex.c.start.d) + ' | OV ' + clean(r.ex.o.start.n) + ' ' + JSON.stringify(r.ex.o.start.d)));
    // L1
    const LR = []; let lmiss = 0; for(let lo = 0; lo < 384; lo += 24){ const f = F('res_L_' + t + '_' + lo + '-' + (lo + 24) + '_X.json'); if(!fs.existsSync(f)){ lmiss++; continue; } JSON.parse(fs.readFileSync(f)).forEach(r => LR.push(r)); }
    const hop = LR.filter(r => !r.noCand), same = hop.filter(r => r.C.start.n === r.O.start.n && r.C.start.d === r.O.start.d);
    P('\n[4] D177 L1 injured slice ' + t + ': ' + new Set(LR.map(r => r.cfg)).size + ' injured cfgs (' + lmiss + ' chunk files missing) | W5 patterned cards ' + LR.length + ' | with no CFG candidate ' + (LR.length - hop.length) + ' | hopped ' + hop.length + ' | start card same in both presentations ' + same.length);
    const L2 = (A, lbl) => P('  ' + lbl + ' n=' + A.length + ' | live differs ' + cnt(A, r => r.C.live.d !== r.O.live.d || r.C.live.n !== r.O.live.n) + ' | toast differs ' + cnt(A, r => r.C.t !== r.O.t) + ' | boot differs ' + cnt(A, r => r.C.boot.d !== r.O.boot.d || r.C.boot.n !== r.O.boot.n) + ' | hold toast CFG ' + cnt(A, r => r.C.t.indexOf(HOLDT) >= 0) + ' OV ' + cnt(A, r => r.O.t.indexOf(HOLDT) >= 0) + ' | kept CFG ' + cnt(A, r => r.C.kept) + ' OV ' + cnt(A, r => r.O.kept) + ' | OV live cue ' + cnt(A, r => CUE.test(r.O.live.d)) + ' CFG live cue ' + cnt(A, r => CUE.test(r.C.live.d)) + ' | hop failures ' + cnt(A, r => r.C.bad + r.O.bad));
    L2(same, 'L1 all');
    [...new Set(same.map(r => r.reg))].sort().forEach(g => L2(same.filter(r => r.reg === g), 'L1 ' + g));
    P('  [2] candidate lists (9990 _swapInjuryOK via swapCandidates/auxSwapCandidates on activeProg.cfg): W5 patterned cards ' + LR.length + ' | OV list longer than CFG ' + cnt(LR, r => r.cO > r.cC) + ' | cards offered >=1 name the injury plan rejects ' + cnt(LR, r => r.illegal > 0) + ' | rejected names offered ' + LR.reduce((n, r) => n + r.illegal, 0) + ' of ' + LR.reduce((n, r) => n + r.cO, 0) + ' OV offers');
    P('     by region/tier ' + fmt(LR.filter(r => r.illegal > 0).reduce((m, r) => (m[r.reg] = (m[r.reg] || 0) + 1, m), {})) + ' | by eq ' + fmt(LR.filter(r => r.illegal > 0).reduce((m, r) => (m[r.eq] = (m[r.eq] || 0) + 1, m), {})));
    LR.filter(r => r.illegal > 0).slice(0, 4).forEach(r => P('     e.g. ' + r.reg + ' ' + r.eq + ' W5 ' + r.d + ' ' + clean(r.n) + ' offers ' + r.illEx.join(', ')));
  }
}
// ─── DELTA: what the slice-2 tree moves, per presentation (V228 -> SL2), over the same W5 chains and L1 hops ───
if(PART === 'delta'){
  for(const pres of ['CFG','OV']){ let n = 0; const d = { live:0, toast:0, boot:0, undo:0, undoBoot:0, any:0 };
    for(const ck of Object.keys(CFGS).filter(k => k !== 'lowback_bw')){ const a = JSON.parse(fs.readFileSync(F('res_C_V228_' + ck + '_' + pres + '.json'))), b = new Map(JSON.parse(fs.readFileSync(F('res_C_SL2_' + ck + '_' + pres + '.json'))).map(r => [r.id, r]));
      a.filter(r => r.w === 5).forEach(r => { const s = b.get(r.id); n++; const f = { live:r.live.d !== s.live.d || r.live.n !== s.live.n, toast:r.toasts.join('|') !== s.toasts.join('|'), boot:r.boot.d !== s.boot.d || r.boot.n !== s.boot.n, undo:r.undo.d !== s.undo.d, undoBoot:r.undoBoot.d !== s.undoBoot.d }; Object.keys(f).forEach(k => { if(f[k]) d[k]++; }); if(Object.values(f).some(Boolean)) d.any++; }); }
    P('[4] D190 W5 chains V228 -> SL2, ' + pres + ' presentation: n=' + n + ' | ' + fmt(d)); }
  const L = t => { const R = []; for(let lo = 0; lo < 384; lo += 24) JSON.parse(fs.readFileSync(F('res_L_' + t + '_' + lo + '-' + (lo + 24) + '_X.json'))).filter(r => !r.noCand).forEach(r => R.push(r)); return R; };
  const A = L('V228'), B = L('SL2'); const key = r => r.cfg + '|' + r.d + '|' + r.si + '|' + r.ii; const bm = new Map(B.map(r => [key(r), r]));
  for(const pr of ['C','O']){ let n = 0, live = 0, toast = 0, boot = 0; A.forEach(r => { const s = bm.get(key(r)); if(!s) return; n++; if(r[pr].live.d !== s[pr].live.d) live++; if(r[pr].t !== s[pr].t) toast++; if(r[pr].boot.d !== s[pr].boot.d) boot++; });
    P('[4] D177 L1 hops V228 -> SL2, ' + (pr === 'C' ? 'CFG' : 'OV') + ' presentation: n=' + n + ' | live ' + live + ' | toast ' + toast + ' | boot ' + boot); }
}
// ─── DELTA2: the 96-type rows: OV L1 hops whose live card moved V228 -> SL2, split by the target's cap (hand CAP table) ───
if(PART === 'delta2'){
  const X = fresh('V228'); const pc = {}; const pat = n => (n in pc) ? pc[n] : (pc[n] = X.eval('_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const L = t => { const R = []; for(let lo = 0; lo < 384; lo += 24) JSON.parse(fs.readFileSync(F('res_L_' + t + '_' + lo + '-' + (lo + 24) + '_X.json'))).filter(r => !r.noCand).forEach(r => R.push(r)); return R; };
  const A = L('V228'), B = L('SL2'); const key = r => r.cfg + '|' + r.d + '|' + r.si + '|' + r.ii; const bm = new Map(B.map(r => [key(r), r]));
  const rows = []; A.forEach(r => { const s = bm.get(key(r)); if(s && r.O.live.d !== s.O.live.d){ const [rg, ti] = r.reg.split('/'); const cap = CAP[rg][ti]; rows.push({ r, s, fromCap:cap.includes(pat(r.n)), toCap:cap.includes(pat(r.to)), startMoved:r.O.start.d !== s.O.start.d, hiSL2:rpeMax(s.O.live.d) > 7, hiV228:rpeMax(r.O.live.d) > 7 }); } });
  P('[4] OV L1 live moved V228 -> SL2: ' + rows.length + ' | start card moved (build clamp on the spliced day) ' + rows.filter(x => x.startMoved).length + ' | from capped ' + rows.filter(x => x.fromCap).length + ' | to capped ' + rows.filter(x => x.toCap).length + ' | from capped AND to uncapped (held dose carried onto a free movement) ' + rows.filter(x => x.fromCap && !x.toCap).length + ' | to capped with RPE>7 on SL2 ' + rows.filter(x => x.toCap && x.hiSL2).length + ' | by region ' + fmt(tally(rows, x => x.r.reg)));
  rows.slice(0, 4).forEach(x => P('    e.g. ' + x.r.reg + ' ' + x.r.eq + ' W5 ' + x.r.d + ' ' + clean(x.r.n) + ' -> ' + clean(x.r.to) + ' (to capped ' + x.toCap + ') | V228 start ' + JSON.stringify(x.r.O.start.d) + ' live ' + JSON.stringify(x.r.O.live.d) + ' | SL2 start ' + JSON.stringify(x.s.O.start.d) + ' live ' + JSON.stringify(x.s.O.live.d) + ' | SL2 CFG live ' + JSON.stringify(x.s.C.live.d)));
  const fc = rows.filter(x => x.fromCap && !x.toCap); P('    held-dose-onto-free rows: SL2 OV live == SL2 CFG live ' + fc.filter(x => x.s.O.live.d === x.s.C.live.d).length + '/' + fc.length);
}
// ─── LEAK: a card the BUILD held (V228 start != SL2 start on the spliced W5 day), swapped onto an UNCAPPED movement.
//   Oracle: D193 R3's contract, "the dose that travels is the dose beneath the hold" = the V228 card's own dose carried
//   by V228's tap (V228 has no clamp anywhere). Run per L1 chunk: SCR=.. PART=leak (spawns LEAKW workers).
if(process.env.LEAKW){ const [lo, hi] = process.env.LEAKW.split('-').map(Number); const L1 = JSON.parse(fs.readFileSync(path.join(PRIOR, 'in', 'gate_rows_V227.json.l1'), 'utf8'));
  const X = fresh('V228'); const pc = {}; const pat = n => (n in pc) ? pc[n] : (pc[n] = X.eval('_pattern(' + JSON.stringify(clean(n)) + ')') || '-'); const out = [];
  const VM = { V228:fresh('V228'), SL2:fresh('SL2') };
  for(let ci = lo; ci < Math.min(hi, L1.length); ci++){ const cfg = L1[ci]; if(!cfg.injury) continue; CFGS['L' + ci] = cfg; const cap = CAP[cfg.injury.region][cfg.injury.tier];
    setup(VM.V228, storedFor('V228', 'L' + ci, 'OV')); setup(VM.SL2, storedFor('SL2', 'L' + ci, 'OV'));
    const a = JSON.parse(E(VM.V228, 'JSON.stringify(activeProg.weeks[5])')), b = JSON.parse(E(VM.SL2, 'JSON.stringify(activeProg.weeks[5])')); const slots = [];
    Object.keys(b).forEach(d => ((b[d] && b[d].sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { const o = a[d] && a[d].sections[si] && a[d].sections[si].items[ii]; if(o && o.name === it.name && o.detail !== it.detail && cap.includes(pat(it.name))) slots.push({ w:5, d, si, ii, n:it.name, pre:o.detail, held:it.detail }); })));
    if(!slots.length) continue;
    setup(VM.SL2, storedFor('SL2', 'L' + ci, 'CFG'));
    slots.forEach(s => { VM.SL2.ctx.__n = s.n; const cands = Array.from(E(VM.SL2, '__cands(activeProg.weeks[5].' + s.d + ',5,__n)')); s.to = cands.find(n => { const p = pat(n); return p !== '-' && !cap.includes(p); }) || null; });
    const byD = {}; slots.filter(s => s.to).forEach(s => (byD[s.d] = byD[s.d] || []).push(s)); const lists = Object.values(byD); const nB = Math.max(0, ...lists.map(l => l.length));
    slots.filter(s => !s.to).forEach(s => out.push({ ci, reg:cfg.injury.region + '/' + cfg.injury.tier, eq:cfg.equipment, ...s, noUncapped:1 }));
    for(let bi = 0; bi < nB; bi++){ const batch = lists.map(l => l[bi]).filter(Boolean); const res = {};
      for(const [t, pr] of [['V228','OV'], ['SL2','OV'], ['SL2','CFG']]){ setup(VM[t], storedFor(t, 'L' + ci, pr)); batch.forEach(s => { const h = hop(VM[t], s, s.to); res[s.d + s.si + '_' + s.ii + t + pr] = { d:h.d, t:h.t, kept:h.h, bad:h.bad }; }); }
      batch.forEach(s => { const k = s.d + s.si + '_' + s.ii; out.push({ ci, reg:cfg.injury.region + '/' + cfg.injury.tier, eq:cfg.equipment, ...s, toPat:pat(s.to), v228:res[k + 'V228OV'], ov:res[k + 'SL2OV'], cf:res[k + 'SL2CFG'] }); }); } }
  fs.writeFileSync(F('res_K_' + lo + '-' + hi + '.json'), JSON.stringify(out)); console.log('leak worker ' + lo + '-' + hi + ' ' + out.length); process.exit(0); }
if(PART === 'leak'){ let i = 0; const jobs = []; for(let lo = 0; lo < 384; lo += 24) jobs.push(lo + '-' + (lo + 24)); const t0 = Date.now();
  const runOne = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { LEAKW:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { if(code) console.log('WORKER CRASH ' + j + ' ' + o.slice(-500)); res(); }); });
  Promise.all(Array.from({ length:10 }, async () => { while(i < jobs.length) await runOne(jobs[i++]); })).then(() => {
    const R = []; let miss = 0; jobs.forEach(j => { const f = F('res_K_' + j + '.json'); if(!fs.existsSync(f)){ miss++; return; } JSON.parse(fs.readFileSync(f)).forEach(r => R.push(r)); });
    const H = R.filter(r => !r.noUncapped); const cnt = f => H.filter(f).length;
    P('[SPREAD] build-held W5 cards on SL2 (OV, L1 injured slice, ' + jobs.length + ' chunks, ' + miss + ' missing): ' + R.length + ' | with an uncapped same-sheet candidate ' + H.length + ' | hop failures ' + cnt(r => r.v228.bad + r.ov.bad + r.cf.bad));
    P('  swapped onto an uncapped movement: SL2 OV live == V228 OV live (dose beneath the hold travels) ' + cnt(r => r.ov.d === r.v228.d) + '/' + H.length + ' | SL2 OV live carries RPE<=7 where V228 carried RPE>7 ' + cnt(r => rpeMax(r.ov.d) <= 7 && rpeMax(r.v228.d) > 7) + ' | SL2 CFG live == V228 OV live ' + cnt(r => r.cf.d === r.v228.d) + '/' + H.length + ' | SL2 CFG _preHold kept ' + cnt(r => r.cf.kept !== null) + ' OV ' + cnt(r => r.ov.kept !== null));
    P('  by region ' + fmt(tally(H, r => r.reg)) + ' | by target pattern ' + fmt(tally(H, r => r.toPat)));
    H.slice(0, 3).forEach(r => P('    e.g. ' + r.reg + ' ' + r.eq + ' W5 ' + r.d + ' ' + clean(r.n) + ' (V228 ' + JSON.stringify(r.pre) + ', SL2 build ' + JSON.stringify(r.held) + ') -> ' + clean(r.to) + ' [' + r.toPat + '] | V228 OV ' + JSON.stringify(r.v228.d) + ' | SL2 OV ' + JSON.stringify(r.ov.d) + ' | SL2 CFG ' + JSON.stringify(r.cf.d)));
    P('  done ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }); }
