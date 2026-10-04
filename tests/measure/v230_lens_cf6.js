// v230_lens_cf6.js — MEASURE (read-only). D194 part 2 ("the lens alone", Amendment 1 R3') before builder: CF6 = V229 +
//   the four-site surgery only (applySwapChoice guard + filter cfg, applySessionSwaps guard + filter cfg read
//   _dayPlanCfg(prog,day)). Prints D193's live rows and the equivalence row on the OVERLAY presentation (the app's writer,
//   applyInjuryDraft, cfg.injury null) beside the FIXTURE presentation (cfg.injury stored), V229 and CF6.
//   SCR=<scratch> PART=<prep|probe|chains|pairs|dump|hand|gates|report> node tests/measure/v230_lens_cf6.js
// Oracles: the fixture presentation on the same tree (the ruling: "the fixture column already measured is the expected
//   answer"), the hand CAP table (D193 Amendment 1), a hand RPE parse, the ruling's literal R7/R8 strings, the ruled
//   figures typed from D193 Amendments 2-4 / D194 Amendment 1. Nothing asks _dayPlanCfg or applyInjuryFilter for the answer.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process'), crypto = require('crypto');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures, progDigest } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const PRIOR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/measure';
const PI = n => path.join(PRIOR, 'in', n);
const PART = process.env.PART || 'none';
const TREES = { V228:F('v228.html'), V229:F('v229.html'), CF6:F('cf6.html'), CF6S22:F('cf6_s22.html'), CF6_230:F('cf6_230.html') };
const TEST9 = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const R7T = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const HOLD = ' Your injury plan holds this one at RPE 7.';
const CUE = / — hold RPE 7, (?:two|three) in the tank$/;
const START = '2026-08-24', CLOCK = '2026-09-24';
const FROMS = { OV5:'2026-09-21', OV1:'2026-08-24' };
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const withInj = inj => { const c = clone(MARIO); if(inj) c.injury = inj; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }), lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
const INJ = Object.keys(CFGS);
const CAP = { knee:{ workaround:['squat','lunge','leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat','lunge'], protect:['squat'] }, hip:{ workaround:['hinge','lunge','hip_ext','squat'], protect:['squat'] }, lowback:{ workaround:['hinge','squat','row','hip_ext'], protect:['squat','hip_ext'] }, shoulder:{ workaround:['hpress','vpress','delt_iso'], protect:[] }, elbow:{ workaround:['hpress','tri_iso','bi_iso','row','vpull'], protect:['row','vpull'] } };
const capOf = c => c && c.injury ? CAP[c.injury.region][c.injury.tier] : [];
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const rpeMax = d => { const v = [...String(d || '').matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)); return v.length ? Math.max(...v) : null; };
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const P = s => console.log(s);
function pin(IA, ck){ const T = new Date((ck || CLOCK) + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};"
  + "globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};try{closeRestSheet=function(){};}catch(e){}";
const clockOf = pres => (pres === 'OV1' || pres === 'CFG1') ? START : CLOCK;   // OV1: overlay from W1 Monday with the clock on W1 Monday, so every week is at or after the current week and pierces
function fresh(t, pres){ const X = load(TREES[t]); pin(X, clockOf(pres)); E(X, HELP); return X; }
function setup(IA, st){ IA.localStorage.clear(); IA.ctx.__SP = JSON.parse(st); E(IA, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
function bootFrom(src, dst){ const ls = new Map(src.localStorage._map); dst.localStorage.clear(); for(const [k, v] of ls) dst.localStorage.setItem(k, v); E(dst, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
const _stC = {};
function storedFor(t, ck, pres){ const key = t + '_' + ck + '_' + pres; if(_stC[key]) return _stC[key]; const f = F('stored_' + key + '.json'); if(fs.existsSync(f)) return (_stC[key] = fs.readFileSync(f, 'utf8'));
  const X = fresh(t, pres); const inj = CFGS[ck].injury; const base = clone(CFGS[ck]); delete base.injury; const cfg = (pres === 'CFG' || pres === 'CFG1') ? clone(CFGS[ck]) : base;
  const p = X.buildProgram(clone(cfg)); const s = clone(p); Object.assign(s, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) }); let j = JSON.stringify(s);
  if(pres === 'OV5' || pres === 'OV1'){ setup(X, j); E(X, "_ovDraft.injRegion=" + JSON.stringify(inj.region) + ";_ovDraft.injTier=" + JSON.stringify(inj.tier) + ";_ovDraft.from='" + FROMS[pres] + "';applyInjuryDraft();");
    const ps = JSON.parse(E(X, "localStorage.getItem('ia_programs')")); const o = ps.find(x => x.id === 'PM'); (o.overlays || []).forEach(v => { v.id = 'ov_fixed'; v.created = 1; }); j = JSON.stringify(o); }
  fs.writeFileSync(f, j); return (_stC[key] = j); }
const slotOf = (IA, w, d, si, ii) => JSON.parse(E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";var it=dy&&dy.sections[" + si + "]&&dy.sections[" + si + "].items[" + ii + "];return it?JSON.stringify({n:it.name,d:it.detail||'',h:(typeof it._preHold==='string')?it._preHold:null}):JSON.stringify({n:'(none)',d:'',h:null});})()"));
const dayJ = (IA, w, d) => E(IA, 'JSON.stringify(activeProg.weeks[' + w + ']&&activeProg.weeks[' + w + '].' + d + ')');
const stampOf = (IA, w, d) => E(IA, "(function(){var dy=activeProg.weeks[" + w + "]&&activeProg.weeks[" + w + "]." + d + ";return dy&&typeof dy._ovKey==='string'?dy._ovKey:null;})()");
function hop(IA, c, to){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); IA.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:cur.n, detail:cur.d }; IA.ctx.__to = to; E(IA, '__T.length=0;'); let bad = 0;
  try { E(IA, '_swapCtx=__c;applySwapChoice(__to);'); } catch(e){ bad = 1; } const after = slotOf(IA, c.w, c.d, c.si, c.ii); if(clean(after.n) !== clean(to)) bad = 1; return { d:after.d, n:after.n, h:after.h, t:Array.from(E(IA, '__T')).join(' / '), bad }; }
function undoLast(IA, c){ E(IA, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); const cur = slotOf(IA, c.w, c.d, c.si, c.ii); const chip = E(IA, 'swapOriginOf(' + JSON.stringify(cur.n) + ')') || ''; let err = null; if(chip){ try { E(IA, 'undoSwap(' + JSON.stringify(chip) + ');'); } catch(e){ err = e.message; } } return { chip, err, slot:slotOf(IA, c.w, c.d, c.si, c.ii) }; }
const stripC = s => s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:"'\\])\/\/[^\n]*/g, '$1');
function runJobs(jobs, par, envKey){ let i = 0; const t0 = Date.now(); const runOne = j => new Promise(res => { const p = cp.spawn(process.execPath, ['--max-old-space-size=4096', __filename], { env:Object.assign({}, process.env, { [envKey]:j, PART:'none' }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x); p.on('exit', code => { console.log(code ? 'WORKER CRASH ' + j + ' ' + o.slice(-600) : o.trim() + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  return Promise.all(Array.from({ length:par }, async () => { while(i < jobs.length){ await runOne(jobs[i++]); } })).then(() => console.log('jobs done ' + jobs.length + ' in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s')); }

// ─── PREP: trees, CF6 surgery, diff, HALF_MANNY, static reader inventory ───
if(PART === 'prep'){
  Object.values(TREES).forEach(f => { try { fs.unlinkSync(f); } catch(e){} });
  fs.readdirSync(SCR).filter(f => /^(stored_|res_|dump_)/.test(f)).forEach(f => fs.unlinkSync(F(f)));
  fs.writeFileSync(TREES.V229, cp.execSync('git show HEAD:index.html', { cwd:ROOT, maxBuffer:1 << 26 })); fs.writeFileSync(TREES.V228, cp.execSync('git show 2c1a89c:index.html', { cwd:ROOT, maxBuffer:1 << 26 }));
  const head = cp.execSync('git rev-parse --short HEAD', { cwd:ROOT }).toString().trim(), orig = cp.execSync('git rev-parse --short origin/main', { cwd:ROOT }).toString().trim();
  const v = fs.readFileSync(TREES.V229, 'utf8'); const ver = (v.match(/<meta name="ia-version" content="(\d+)"/) || [])[1];
  P('PREP HEAD ' + head + ' origin/main ' + orig + ' | V229 (HEAD) ia-version ' + ver + ' sha ' + sha(TREES.V229) + ' | working index.html sha ' + sha(path.join(ROOT, 'index.html')) + ' | V228 (2c1a89c) ia-version ' + (fs.readFileSync(TREES.V228, 'utf8').match(/ia-version" content="(\d+)"/) || [])[1]);
  if(ver !== '229') throw new Error('V229 ia-version ' + ver);
  const ED = [
    ['S1 applySwapChoice guard', "  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    item._preHold=_preF;\n", "  if(activeProg&&_dayPlanCfg(activeProg,day).injury){\n    item._preHold=_preF;\n"],
    ['S2 applySwapChoice filter cfg', "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n", "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],_dayPlanCfg(activeProg,day));\n"],
    ['S3 applySessionSwaps guard', "    if(hit && prog.cfg && prog.cfg.injury){\n", "    if(hit && _dayPlanCfg(prog,day).injury){\n"],
    ['S4 applySessionSwaps filter cfg', "      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n", "      day.sections=applyInjuryFilter(day.sections,_dayPlanCfg(prog,day));\n"]];
  let s = v; ED.forEach(([nm, a, b]) => { const n = s.split(a).length - 1; P('  anchor [' + nm + '] count ' + n + ' at line ' + (s.slice(0, s.indexOf(a)).split('\n').length)); if(n !== 1) throw new Error('anchor ' + nm + ' count ' + n); s = s.replace(a, b); });
  fs.writeFileSync(TREES.CF6, s);
  const S22a = "      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_fi.detail; }\n";
  const S22b = "      if(_fi&&_fi.name===to){ const _dm=/ — hold RPE 7, (?:two|three) in the tank$/.test(_wasDetail)?7:((/RPE\\s*(\\d+(?:\\.\\d+)?)/.exec(String(_wasDetail))||[])[1]); _held=(_dm!=null&&+_dm>7&&_fi.detail!==_preF); item.detail=_fi.detail; }\n";
  P('  S22 anchor count ' + (s.split(S22a).length - 1)); if(s.split(S22a).length - 1 !== 1) throw new Error('S22 anchor');
  fs.writeFileSync(TREES.CF6S22, s.replace(S22a, S22b));
  const m230 = '<meta name="ia-version" content="229">'; P('  version meta count ' + (s.split(m230).length - 1)); fs.writeFileSync(TREES.CF6_230, s.replace(m230, '<meta name="ia-version" content="230">'));
  try { fs.unlinkSync(F('diff_v229_cf6.txt')); } catch(e){}
  try { cp.execSync('diff ' + TREES.V229 + ' ' + TREES.CF6 + ' > ' + F('diff_v229_cf6.txt')); } catch(e){}
  const dt = fs.readFileSync(F('diff_v229_cf6.txt'), 'utf8'); P('\n[2] diff V229 -> CF6 (' + dt.split('\n').filter(l => /^[<>]/.test(l)).length + ' changed lines, hunks ' + dt.split('\n').filter(l => /^\d/.test(l)).length + ')'); P(dt.split('\n').map(l => '    ' + l.slice(0, 200)).join('\n'));
  const dg = t => progDigest(load(TREES[t]).buildProgram(clone(fixtures.HALF_MANNY)));
  P('[2] HALF_MANNY digest V229 ' + dg('V229') + ' | CF6 ' + dg('CF6') + ' | CF6 again ' + dg('CF6') + ' | CF6S22 ' + dg('CF6S22') + ' | expected 0ac7da6b1691a8e1');
  P('    trees: V229 ' + sha(TREES.V229) + ' CF6 ' + sha(TREES.CF6) + ' CF6S22 ' + sha(TREES.CF6S22) + ' CF6_230 ' + sha(TREES.CF6_230));
  // [1] static inventory on V229, comments stripped
  const src = stripC(v); const L = src.split('\n');
  const fnStarts = []; L.forEach((x, i) => { const m = /^(?:async\s+)?function\s+([\w$]+)\s*\(([^)]*)\)/.exec(x); if(m) fnStarts.push({ name:m[1], params:m[2], i }); });
  const fnAt = i => { let r = null; for(const f of fnStarts){ if(f.i <= i) r = f; else break; } return r; };
  const bodyOf = f => { const k = fnStarts.indexOf(f); const end = k + 1 < fnStarts.length ? fnStarts[k + 1].i : L.length; return L.slice(f.i, end).join('\n'); };
  const bpS = src.indexOf('function buildProgram(cfg){'); let depth = 0, k = src.indexOf('{', bpS), bpE = k; for(; k < src.length; k++){ if(src[k] === '{') depth++; else if(src[k] === '}'){ depth--; if(!depth){ bpE = k; break; } } }
  const bpL0 = src.slice(0, bpS).split('\n').length, bpL1 = src.slice(0, bpE).split('\n').length;
  P('\n[1] V229 comment-stripped: ' + fnStarts.length + ' top-level functions | buildProgram spans lines ' + bpL0 + '-' + bpL1);
  const names = new Set(fnStarts.map(f => f.name)); const calls = {}; fnStarts.forEach(f => { const b = bodyOf(f).split('\n').slice(1).join('\n'); const c = new Set(); for(const m of b.matchAll(/\b([\w$]+)\s*\(/g)) if(names.has(m[1]) && m[1] !== f.name) c.add(m[1]); calls[f.name] = c; });
  const reach = root => { const prev = { [root]:null }; const q = [root]; while(q.length){ const x = q.shift(); if(x === 'buildProgram') continue; for(const y of calls[x] || []) if(!(y in prev)){ prev[y] = x; q.push(y); } } return prev; };
  const ROOTS = { tap:'applySwapChoice', boot:'applySessionSwaps', undo:'undoSwap', reboot:'refreshProgram' }; const RR = {}; Object.entries(ROOTS).forEach(([k, r]) => RR[k] = reach(r));
  const pathTo = (prev, x) => { const p = []; let c = x; while(c !== null && c !== undefined && p.length < 12){ p.unshift(c); c = prev[c]; } return p.join('>'); };
  const callersOf = n => { const o = []; L.forEach((x, i) => { if(new RegExp('\\b' + n.replace('$', '\\$') + '\\s*\\(').test(x) && !/^\s*(?:async\s+)?function\s/.test(x)){ const f = fnAt(i); o.push((i + 1) + '<' + (f ? f.name : '?') + '>'); } }); return o; };
  const rows = []; L.forEach((x, i) => { for(const m of x.matchAll(/([\w$.\]\[)'"]*?)\.injury\b(\s*=(?!=))?/g)){ rows.push({ line:i + 1, expr:(m[1] + '.injury').replace(/^[^\w$]+/, ''), write:!!m[2], text:x.trim().slice(0, 170), fn:fnAt(i) }); } });
  const inBP = r => r.line >= bpL0 && r.line <= bpL1;
  P('[1] every `.injury` token in V229 (comments stripped): ' + rows.length + ' | inside buildProgram ' + rows.filter(inBP).length + ' | outside ' + rows.filter(r => !inBP(r)).length + ' | of the outside, `cfg.injury` reads (any prefix) ' + rows.filter(r => !inBP(r) && /cfg\.injury$/.test(r.expr) && !r.write).length);
  const SITE = r => (r.fn && r.fn.name === 'applySwapChoice' && /activeProg\.cfg\.injury/.test(r.expr)) || (r.fn && r.fn.name === 'applySessionSwaps' && /prog\.cfg\.injury/.test(r.expr));
  rows.filter(r => !inBP(r)).forEach(r => { const f = r.fn; const body = f ? bodyOf(f) : ''; let cls;
    if(SITE(r)) cls = 'ONE OF THE FOUR (guard)';
    else if(/^cfg\.injury$/.test(r.expr) && f && /\bconst cfg\s*=\s*_dayPlanCfg\(/.test(body)) cls = 'ALREADY ON THE LENS (local cfg = _dayPlanCfg)';
    else if(/^cfg\.injury$/.test(r.expr) && f && new RegExp('(^|,)\\s*cfg\\s*(,|$)').test(f.params)) cls = 'HELPER (cfg is a parameter: the caller decides which plan)';
    else cls = 'OTHER';
    const on = Object.keys(RR).filter(k => f && (f.name in RR[k])).map(k => k + ':' + pathTo(RR[k], f.name));
    P('    ' + r.line + ' [' + (f ? f.name + ':' + (f.i + 1) : '?') + '] ' + (r.write ? 'WRITE ' : 'read ') + r.expr + ' => ' + cls + (on.length ? ' | ON ROUTE ' + on.join(' ; ') : ' | on no tap/boot/undo/reboot route') + '\n        ' + r.text); });
  // helpers: who passes which cfg
  const helpers = [...new Set(rows.filter(r => !inBP(r) && /^cfg\.injury$/.test(r.expr) && r.fn && new RegExp('(^|,)\\s*cfg\\s*(,|$)').test(r.fn.params)).map(r => r.fn.name))].concat(['injuryPlan','applyInjuryFilter']).filter((x, i, a) => a.indexOf(x) === i);
  // also helpers that receive the injury value itself (e.g. _powerAllowed(n, exp, cfg.injury, age))
  P('[1] helper readers (take cfg, read cfg.injury) and every call site outside buildProgram with the cfg it passes:');
  helpers.forEach(h => { const cs = []; L.forEach((x, i) => { if(i + 1 >= bpL0 && i + 1 <= bpL1) return; for(const m of x.matchAll(new RegExp('\\b' + h + '\\s*\\(', 'g'))){ if(/^\s*(?:async\s+)?function\s/.test(x) && x.indexOf('function ' + h) >= 0) continue; const f = fnAt(i); const body = f ? bodyOf(f) : ''; const arg = x.slice(m.index, m.index + 160);
      const lens = /_dayPlanCfg\(/.test(arg) || (f && /\bconst cfg\s*=\s*_dayPlanCfg\(/.test(body) && /[(,]\s*cfg\s*[,)]/.test(arg));
      const on = Object.keys(RR).filter(k => f && (f.name in RR[k])).map(k => k);
      cs.push('      ' + (i + 1) + ' [' + (f ? f.name : '?') + '] ' + (lens ? 'LENS' : /activeProg\.cfg|prog\.cfg|\bp\.cfg/.test(arg) ? 'PROG.CFG' : 'OTHER-ARG') + (on.length ? ' route:' + on.join(',') : '') + ' :: ' + arg.trim()); } });
    P('    ' + h + ': ' + cs.length + ' call sites outside buildProgram'); cs.forEach(c => P(c)); });
  // _powerAllowed's injury argument
  { const cs = []; L.forEach((x, i) => { if(i + 1 >= bpL0 && i + 1 <= bpL1) return; if(/_powerAllowed\s*\(/.test(x) && !/function _powerAllowed/.test(x)){ const f = fnAt(i); cs.push('      ' + (i + 1) + ' [' + (f ? f.name : '?') + '] ' + x.trim().slice(0, 170)); } }); P('    _powerAllowed (takes the injury value): ' + cs.length + ' call sites outside buildProgram'); cs.forEach(c => P(c)); }
  { const f = fnStarts.find(x => x.name === '_dayPlanCfg'); P('[1] _dayPlanCfg defined at line ' + (f ? f.i + 1 : 'ABSENT') + ' | call sites ' + callersOf('_dayPlanCfg').join(' ')); P('    ' + (f ? bodyOf(f).split('\n').slice(0, 6).join('\n    ') : '')); }
}

// ─── PROBE: what each presentation stamps, per week; OV day == FIX day; baseline equals itself ───
if(PART === 'probe'){
  for(const t of ['V229','CF6']) for(const ck of ['mario','lowback_wa','elbow_wa']){ const ws = {};
    for(const pres of ['CFG','CFG1','OV5','OV1']){ const a = fresh(t, pres), b = fresh(t, pres); const st = storedFor(t, ck, pres); setup(a, st); setup(b, st); ws[pres] = JSON.parse(E(a, 'JSON.stringify(activeProg.weeks)')); const self = E(a, 'JSON.stringify(activeProg.weeks)') === E(b, 'JSON.stringify(activeProg.weeks)');
      const per = {}; Object.keys(ws[pres]).forEach(w => { const days = Object.keys(ws[pres][w]).filter(d => ws[pres][w][d] && Array.isArray(ws[pres][w][d].sections)); per[w] = days.filter(d => typeof ws[pres][w][d]._ovKey === 'string').length + '/' + days.length; });
      P('PROBE ' + t + ' ' + ck + ' ' + pres + ' self-identity ' + self + ' | cfg.injury ' + JSON.stringify(E(a, 'JSON.stringify(activeProg.cfg.injury||null)')) + ' | overlays ' + E(a, '(activeProg.overlays||[]).length') + ' | stamped days by week ' + JSON.stringify(per)); }
    for(const pres of ['CFG1','OV5','OV1']){ const per = {}; Object.keys(ws.CFG).forEach(w => { const days = Object.keys(ws.CFG[w]); let eq = 0, n = 0; days.forEach(d => { const a = ws.CFG[w][d], b = ws[pres][w] && ws[pres][w][d]; if(!a || !Array.isArray(a.sections)) return; n++; const bb = b ? Object.assign({}, b) : null; if(bb) delete bb._ovKey; if(JSON.stringify(a) === JSON.stringify(bb)) eq++; }); per[w] = eq + '/' + n; });
      P('  ' + pres + ' day == FIX day (stamp removed) by week ' + JSON.stringify(per)); } }
}

// ─── CHAINS worker ───
if(process.env.WORKER){
  const [mode, t, ck, pres] = process.env.WORKER.split(':'); let chains = JSON.parse(fs.readFileSync(PI('chains_' + ck + '.json'), 'utf8')); const st = storedFor(t, ck, pres);
  if(mode === 'U') chains = chains.filter(c => c.cls === 'hop3' && /h1/.test(c.fire));
  const by = {}; chains.forEach(c => (by[c.w + c.d] = by[c.w + c.d] || []).push(c)); const lists = Object.values(by); const nB = Math.max(0, ...lists.map(l => l.length)); const res = [];
  const A = fresh(t, pres), B2 = fresh(t, pres), B3 = fresh(t, pres);
  for(let b = 0; b < nB; b++){ const batch = lists.map(l => l[b]).filter(Boolean); setup(A, st); const r = {};
    batch.forEach(c => r[c.id] = { id:c.id, ck, cls:c.cls, fire:c.fire, w:c.w, d:c.d, si:c.si, ii:c.ii, hops:c.hops, stamp:stampOf(A, c.w, c.d), start:slotOf(A, c.w, c.d, c.si, c.ii), steps:[], toasts:[], kept:[], bad:0 });
    if(mode === 'S'){
      for(const c of batch){ const s = r[c.id]; for(const to of c.hops){ const h = hop(A, c, to); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; } s.live = slotOf(A, c.w, c.d, c.si, c.ii); s.liveDay = dayJ(A, c.w, c.d); }
      const rx = JSON.parse(E(A, "localStorage.getItem('ia_swaps_PM')") || '{}'); batch.forEach(c => { r[c.id].ph = ((rx['w' + c.w + '_' + c.d] || []).reduce((n, e) => n + (e.rx || []).filter(x => 'ph' in x).length, 0)); });
      bootFrom(A, B2); for(const c of batch){ r[c.id].boot = slotOf(B2, c.w, c.d, c.si, c.ii); r[c.id].bootDay = dayJ(B2, c.w, c.d); }
      for(const c of batch){ const u = undoLast(A, c); r[c.id].chip = u.chip; r[c.id].undo = u.slot; r[c.id].undoDay = dayJ(A, c.w, c.d); if(u.err) r[c.id].undoErr = u.err; }
      bootFrom(A, B3); for(const c of batch){ r[c.id].undoBoot = slotOf(B3, c.w, c.d, c.si, c.ii); r[c.id].undoBootDay = dayJ(B3, c.w, c.d); }
    } else if(mode === 'R'){
      for(const c of batch){ const s = r[c.id]; for(const to of c.hops.slice(0, -1)){ const h = hop(A, c, to); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; } }
      bootFrom(A, B2); for(const c of batch){ const s = r[c.id]; s.afterReboot = slotOf(B2, c.w, c.d, c.si, c.ii); const h = hop(B2, c, c.hops[c.hops.length - 1]); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; s.live = slotOf(B2, c.w, c.d, c.si, c.ii); }
      bootFrom(B2, B3); for(const c of batch) r[c.id].boot = slotOf(B3, c.w, c.d, c.si, c.ii);
    } else if(mode === 'U'){
      for(const c of batch){ const s = r[c.id]; const [Bn, Cn, Dn] = c.hops; for(const to of [Bn, Cn]){ const h = hop(A, c, to); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; }
        const u = undoLast(A, c); s.chip = u.chip; s.undone = u.slot; if(clean(u.slot.n) !== clean(Bn)) s.undoMiss = 1;
        const h = hop(A, c, Dn); s.steps.push(h.d); s.toasts.push(h.t); s.kept.push(h.h); s.bad += h.bad; s.live = slotOf(A, c.w, c.d, c.si, c.ii); }
      bootFrom(A, B2); for(const c of batch) r[c.id].boot = slotOf(B2, c.w, c.d, c.si, c.ii);
      setup(B3, st); for(const c of batch){ const h = hop(B3, c, c.hops[2]); r[c.id].direct = { d:h.d, n:h.n, t:h.t, bad:h.bad }; }
    }
    batch.forEach(c => res.push(r[c.id])); }
  fs.writeFileSync(F('res_' + mode + '_' + t + '_' + ck + '_' + pres + '.json'), JSON.stringify(res)); console.log('worker ' + process.env.WORKER + ' ' + res.length); process.exit(0);
}
if(PART === 'chains'){ const jobs = []; const big = ['elbow_wa','shoulder_wa','lowback_wa','hip_wa','knee_protect','mario','ankle_wa'];
  const SPEC = (process.env.JOBSPEC || 'S:V229:CFG,S:CF6:CFG,S:V229:OV5,S:CF6:OV5,S:V229:OV1,S:CF6:OV1,R:CF6:CFG,R:V229:OV1,R:CF6:OV1,R:CF6:OV5,U:CF6:CFG,U:V229:OV1,U:CF6:OV1,U:CF6:OV5').split(',');
  for(const ck of big) for(const s of SPEC){ const [m, t, p] = s.split(':'); jobs.push(m + ':' + t + ':' + ck + ':' + p); }
  for(const ck of big) for(const t of ['V229','CF6']) for(const p of ['CFG','OV5','OV1']) storedFor(t, ck, p);
  runJobs(jobs, +(process.env.PAR || 8), 'WORKER'); }
module.exports = { CFGS, CAP, TREES, F, PI, fresh, setup, bootFrom, storedFor, slotOf, hop, undoLast, clean, clone, pin, E, tally, fmt, capOf, rpeMax, TEST9, R7T, HOLD, CUE, START, CLOCK, FROMS, MARIO, stampOf, dayJ, runJobs, sha, stripC };

// ─── PAIRS: D193 (e) / (e′) / (k″) single-hop rows on L9, fixture vs overlay, V229 / CF6 / CF6+S22; synthetic stamp check ───
const isCue = d => CUE.test(String(d || ''));
const kindOf = d => { d = String(d || ''); if(d === R7T) return 'R7'; if(isCue(d)) return 'cue'; if(/^\d+ sets — RPE/.test(d)) return 'bwsets'; if(/@ RPE/.test(d)) return 'grammar@'; if(/RPE/.test(d)) return 'prose/other'; return 'no-RPE'; };
if(process.env.PAIRW){
  const ck = process.env.PAIRW; const cap = capOf(CFGS[ck]); const X0 = fresh('V229'); const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = E(X0, '_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const COMBOS = [['CF6','CFG1'],['CF6','OV1'],['V229','OV1'],['CF6S22','OV1'],['CF6S22','CFG1'],['CF6','CFG'],['CF6','OV5'],['V229','OV5'],['V229','CFG1']];
  const VM = {}, BVM = {}; const vm = (t, p) => VM[t + p] || (VM[t + p] = (Y => (setup(Y, storedFor(t, ck, p)), Y))(fresh(t, p)));
  const bvm = (t, p) => BVM[t + p] || (BVM[t + p] = fresh(t, p));
  const liveSwap = (Y, w, d, si, ii, to) => { E(Y, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); const snap = dayJ(Y, w, d); const cur = slotOf(Y, w, d, si, ii);
    Y.ctx.__c = { secIdx:si, itemIdx:ii, name:cur.n, detail:cur.d }; Y.ctx.__to = to; let o, h; E(Y, '__T.length=0;'); try { E(Y, '_swapCtx=__c;applySwapChoice(__to);'); const s = slotOf(Y, w, d, si, ii); o = s.d; h = s.h; } catch(e){ o = 'CRASH ' + e.message; }
    const sw = E(Y, "localStorage.getItem('ia_swaps_PM')"); const t2 = Array.from(E(Y, '__T')).join(' / '); Y.ctx.__S = JSON.parse(snap); E(Y, 'activeProg.weeks[' + w + '].' + d + "=__S;localStorage.removeItem('ia_swaps_PM');localStorage.removeItem('ia_swapct_PM');localStorage.removeItem('ia_hist_PM');"); return { donor:cur, o, h, sw, t:t2 }; };
  const bootRead = (t, p, sw, w, d, si, ii) => { const Z = bvm(t, p); Z.localStorage.clear(); Z.ctx.__SP = JSON.parse(storedFor(t, ck, p)); E(Z, 'savePrograms([__SP]);'); if(sw) Z.localStorage.setItem('ia_swaps_PM', sw); return JSON.parse(E(Z, "(function(){var p=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));var it=p.weeks[" + w + "]." + d + ".sections[" + si + "]&&p.weeks[" + w + "]." + d + ".sections[" + si + "].items[" + ii + "];return JSON.stringify(it?{n:it.name,d:it.detail,h:(typeof it._preHold==='string')?it._preHold:null}:{n:'(none)',d:'',h:null});})()")); };
  const Q = vm('CF6', 'CFG1'); const W = JSON.parse(E(Q, 'JSON.stringify(activeProg.weeks)')); const out = [];
  for(const w of Object.keys(W)) for(const d of Object.keys(W[w])){ const dy = W[w][d]; if(!dy || !Array.isArray(dy.sections)) continue;
    dy.sections.forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.name || typeof it.detail !== 'string') return; const cls = isCue(it.detail) ? 'e' : (rpeMax(it.detail) > 7 ? 'e2' : null); if(!cls) return;
      E(Q, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); let tg = []; try { tg = Array.from(E(Q, '__cands(activeProg.weeks[' + w + '].' + d + ',' + w + ',' + JSON.stringify(it.name) + ')')); } catch(e){}
      tg.forEach(to => { if(!cap.includes(pat(to))) return; if(cls === 'e'){ const rf = JSON.parse(E(Q, 'JSON.stringify(_repFloor(' + JSON.stringify(to) + '))')); if(!(rf && rf[1] === 0)) return; }
        const r = { ck, cls, w:+w, d, si, ii, from:clean(it.name), donor:it.detail, to, R:{} };
        for(const [t, p] of COMBOS){ if(p === 'OV5' || p === 'CFG'){ if(+w < 5) continue; } const Y = vm(t, p); const s = liveSwap(Y, +w, d, si, ii, to); const b = bootRead(t, p, s.sw, +w, d, si, ii); r.R[t + ':' + p] = { dn:s.donor.d, stamp:stampOf(Y, +w, d), o:s.o, h:s.h, t:s.t, b:b.d, bn:clean(b.n), bh:b.h }; }
        out.push(r); }); })); }
  // synthetic STAMP == real writer (OV1) on this config, every week
  const X = fresh('CF6', 'OV1'); const p = X.buildProgram(clone(CFGS[ck])); const ckey = JSON.stringify(['injury', { injury:{ region:CFGS[ck].injury.region, tier:CFGS[ck].injury.tier } }]);
  Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { const dy = p.weeks[w][d]; if(dy && !dy.rest && Array.isArray(dy.sections)) dy._ovKey = ckey; }));
  const ov = JSON.parse(E(vm('CF6', 'OV1'), 'JSON.stringify(activeProg.weeks)')); let n = 0, eq = 0; Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { n++; if(JSON.stringify(p.weeks[w][d]) === JSON.stringify(ov[w] && ov[w][d])) eq++; }));
  fs.writeFileSync(F('res_P_' + ck + '.json'), JSON.stringify({ rows:out, stamp:{ n, eq } })); console.log('pairs ' + ck + ' ' + out.length + ' stamp ' + eq + '/' + n); process.exit(0);
}
if(PART === 'pairs'){ INJ.forEach(ck => ['V229','CF6','CF6S22'].forEach(t => ['CFG','CFG1','OV1','OV5'].forEach(p => storedFor(t, ck, p)))); runJobs(INJ.slice(), +(process.env.PAR || 7), 'PAIRW'); }

// ─── DUMP: the g221 D177 L1 sweep (150k swap pairs, the (k)/(l) source) on the FIXTURE and on a STAMP presentation ───
//   STAMP = what applyOverlays writes for an injury overlay covering every week (checked == the real writer in PAIRS):
//   the injured build's days, each non-rest day stamped _ovKey = JSON.stringify(['injury',{injury:{region,tier}}]),
//   prog.cfg without injury, prog._swapUniverseByKey[key] = the injured build's universe.
if(PART === 'dump'){
  const src = fs.readFileSync(PI('gate_g221_dump.js'), 'utf8'); const a = '  S.cfgs++; const prog = Object.assign({}, p, { cfg }); IA.ctx.__P = prog;';
  if(src.split(a).length - 1 !== 1) throw new Error('dump anchor count ' + (src.split(a).length - 1));
  const b = "  S.cfgs++; let prog = Object.assign({}, p, { cfg }); if(process.env.PRES === 'STAMP' && cfg.injury){ const _ck = JSON.stringify(['injury', { injury:{ region:cfg.injury.region, tier:cfg.injury.tier } }]); const _c2 = Object.assign({}, cfg); delete _c2.injury; Object.keys(p.weeks).forEach(_w => Object.keys(p.weeks[_w]).forEach(_d => { const _dy = p.weeks[_w][_d]; if(_dy && !_dy.rest && Array.isArray(_dy.sections)) _dy._ovKey = _ck; })); prog = Object.assign({}, p, { cfg:_c2 }); prog._swapUniverseByKey = { [_ck]:p._swapUniverse }; } IA.ctx.__P = prog;";
  const dst = F('gate_g221_dump_pres.js'); fs.writeFileSync(dst, src.replace(a, b));
  const jobs = (process.env.DUMPS || 'CF6:CFG,CF6:STAMP,V229:STAMP,V229:CFG').split(','); let i = 0; const t0 = Date.now();
  const one = j => new Promise(res => { const [t, pr] = j.split(':'); const df = F('dump_' + t + '_' + pr + '.json'); try { fs.unlinkSync(df); } catch(e){}
    const p = cp.spawn(process.execPath, ['--max-old-space-size=8192', dst, TREES[t]], { cwd:path.join(ROOT, 'tests', 'gates'), env:Object.assign({}, process.env, { GATE_DUMP:df, PRES:pr }), stdio:['ignore','pipe','pipe'] }); let o = ''; p.stdout.on('data', x => o += x); p.stderr.on('data', x => o += x);
    p.on('exit', c => { console.log('dump ' + j + ' exit ' + c + ' ' + ((o.match(/DUMPED \d+/) || ['NO DUMP: ' + o.slice(-400)])[0]) + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  Promise.all(Array.from({ length:4 }, async () => { while(i < jobs.length) await one(jobs[i++]); })).then(() => console.log('dumps done'));
}

// ─── HAND: mario W5 thu routes (U0 in-session, U1, U2, RB with undo and undo+boot) and knee/wa strength W6 thu test, OV5 vs CFG, V229 vs CF6 ───
if(PART === 'hand'){
  const L1 = JSON.parse(fs.readFileSync(PI('gate_rows_V227.json.l1'), 'utf8'));
  const sl = s => clean(s.n) + ' ' + JSON.stringify(s.d) + ' _preHold ' + (s.h === null ? 'none' : JSON.stringify(s.h));
  for(const pres of ['OV5','CFG']) for(const t of ['V229','CF6']){ const st = storedFor(t, 'mario', pres); const X = fresh(t, pres); setup(X, st);
    const day = E(X, 'activeProg.weeks[5].thu'); let si = -1, ii = -1; day.sections.forEach((s, a) => (s.items || []).forEach((it, b) => { if(clean(it.name) === 'Single-leg hip thrust' && si < 0){ si = a; ii = b; } }));
    const c = { w:5, d:'thu', si, ii }; const nw = () => { const Y = fresh(t, pres); setup(Y, st); return Y; }; const bootS = Y => { const B = fresh(t, pres); bootFrom(Y, B); return slotOf(B, 5, 'thu', si, ii); };
    const recPh = Y => { const r = JSON.parse(E(Y, "localStorage.getItem('ia_swaps_PM')") || '{}').w5_thu || []; return r.map(e => e.from + '>' + e.to + (e.rx || []).map(x => ' ph=' + ('ph' in x ? JSON.stringify(x.ph) : '-')).join('')).join(' | '); };
    P('\n[6] mario knee/wa W5 thu [' + si + ',' + ii + '] ' + t + ' ' + pres + ' | stamp ' + stampOf(X, 5, 'thu') + ' | activeProg.cfg.injury ' + E(X, 'JSON.stringify(activeProg.cfg.injury||null)') + ' | native ' + sl(slotOf(X, 5, 'thu', si, ii)));
    { const Y = nw(); const a = ['Barbell hip thrust','Leg extension','Barbell good mornings'].map((to, k) => { const h = hop(Y, c, to); return 'hop' + (k + 1) + ' ' + clean(h.n) + ' ' + JSON.stringify(h.d) + ' _preHold ' + (h.h === null ? 'none' : JSON.stringify(h.h)) + ' | toast "' + h.t + '"'; });
      P('  U0 ' + a.join('\n     ') + '\n     record ' + recPh(Y) + '\n     BOOT ' + sl(bootS(Y))); const u = undoLast(Y, c); P('     UNDO chip ' + JSON.stringify(u.chip) + ' -> ' + sl(u.slot) + '\n     UNDO+BOOT ' + sl(bootS(Y))); }
    { const Y = nw(); const h = hop(Y, c, 'Barbell hip thrust'); const pre = dayJ(nw(), 5, 'thu'); const u = undoLast(Y, c); P('  U1 hop1 ' + clean(h.n) + ' ' + JSON.stringify(h.d) + ' _preHold ' + (h.h === null ? 'none' : JSON.stringify(h.h)) + ' | toast "' + h.t + '"\n     UNDO -> ' + sl(u.slot) + ' | day identical to the untouched day ' + (dayJ(Y, 5, 'thu') === pre) + ' | UNDO+BOOT ' + sl(bootS(Y))); }
    { const Y = nw(); const h1 = hop(Y, c, 'Leg extension'); const h2 = hop(Y, c, 'Barbell good mornings'); const rec = recPh(Y); const u = undoLast(Y, c); const h3 = hop(Y, c, 'Barbell hip thrust'); const Q = nw(); const dh = hop(Q, c, 'Barbell hip thrust');
      P('  U2 hop1 Leg extension ' + JSON.stringify(h1.d) + ' _preHold ' + (h1.h === null ? 'none' : JSON.stringify(h1.h)) + ' | toast "' + h1.t + '"\n     hop2 Barbell good mornings ' + JSON.stringify(h2.d) + ' | toast "' + h2.t + '" | record ' + rec + '\n     UNDO chip ' + JSON.stringify(u.chip) + ' -> ' + sl(u.slot) + '\n     hop3 Barbell hip thrust LIVE ' + JSON.stringify(h3.d) + ' | toast "' + h3.t + '"\n     BOOT ' + sl(bootS(Y)) + ' | DIRECT ' + JSON.stringify(dh.d)); }
    { const Y = nw(); hop(Y, c, 'Barbell hip thrust'); const h2 = hop(Y, c, 'Leg extension'); const Z = fresh(t, pres); bootFrom(Y, Z); const rs = slotOf(Z, 5, 'thu', si, ii); const h3 = hop(Z, c, 'Barbell good mornings'); const bt = bootS(Z); const Q = nw(); const dh = hop(Q, c, 'Barbell good mornings');
      const u = undoLast(Z, c); P('  RB hop2 Leg extension ' + JSON.stringify(h2.d) + ' _preHold ' + (h2.h === null ? 'none' : JSON.stringify(h2.h)) + ' | toast "' + h2.t + '"\n     REBOOT slot ' + sl(rs) + '\n     hop3 Barbell good mornings LIVE ' + JSON.stringify(h3.d) + ' | toast "' + h3.t + '"\n     BOOT ' + sl(bt) + ' | DIRECT ' + JSON.stringify(dh.d) + '\n     UNDO chip ' + JSON.stringify(u.chip) + ' -> ' + sl(u.slot) + '\n     UNDO+BOOT ' + sl(bootS(Z))); } }
  const cfgR7 = L1.find(c => c.injury && c.injury.region === 'knee' && c.injury.tier === 'workaround' && c.equipment === 'commercial' && c.liftingFocus === 'strength' && c.experience === 'beginner' && c.primaryPath === 'lift');
  if(!cfgR7) P('[6] knee/wa strength config NOT FOUND in L1 (FAILED MEASUREMENT)'); else { CFGS.R7 = cfgR7;
    for(const pres of ['OV5','CFG']) for(const t of ['V229','CF6']){ const st = storedFor(t, 'R7', pres); const X = fresh(t, pres); setup(X, st); const day = E(X, 'activeProg.weeks[6]&&activeProg.weeks[6].thu');
      if(!day){ P('[6] ' + t + ' ' + pres + ' no W6 thu'); continue; } let si = -1, ii = -1; day.sections.forEach((s, a) => (s.items || []).forEach((it, b) => { if(/Barbell box squat/.test(it.name) && si < 0){ si = a; ii = b; } }));
      if(si < 0){ P('[6] ' + t + ' ' + pres + ' W6 thu: no Barbell box squat'); continue; } const c = { w:6, d:'thu', si, ii };
      const go = to => { const Y = fresh(t, pres); setup(Y, st); const h = hop(Y, c, to); const B = fresh(t, pres); bootFrom(Y, B); const b = slotOf(B, 6, 'thu', si, ii); const u = undoLast(Y, c); return clean(h.n) + ' ' + JSON.stringify(h.d) + ' _preHold ' + (h.h === null ? 'none' : 'present') + ' | toast "' + h.t + '" | BOOT ' + JSON.stringify(b.d) + ' | UNDO -> ' + clean(u.slot.n) + ' ' + JSON.stringify(u.slot.d).slice(0, 60); };
      P('\n[6] knee/wa strength beginner commercial ' + t + ' ' + pres + ' (weeks ' + E(X, 'activeProg.totalWeeks') + ') W6 thu [' + si + ',' + ii + '] stamp ' + stampOf(X, 6, 'thu') + ' native ' + JSON.stringify(slotOf(X, 6, 'thu', si, ii).d) + '\n    -> Leg press: ' + go('Leg press') + '\n    -> Barbell Romanian deadlift: ' + go('Barbell Romanian deadlift')); } }
}

// ─── GATES: the shipped swap-driving families on V229, CF6 (stamped 229) and CF6_230 (stamped 230) ───
if(PART === 'gates'){
  const G = (process.env.GATES || 'g221_d177_swapfloor,g221_d178_active,g221_d179_donenav,g221_d180_blockopen,g222_d181_chain,g222_d181_durable,g227_d190_cuecap,g227_d190_prefpath,g227_d190_seam,g228_d192_undokey,g228_d193_cueword,g229_d193_build,g229_d194_lens').split(',');
  const T = (process.env.GT || 'V229,CF6,CF6_230').split(','); const jobs = []; T.forEach(t => G.forEach(g => jobs.push([t, g]))); fs.mkdirSync(F('tmp'), { recursive:true });
  let i = 0; const t0 = Date.now();
  const one = ([t, g]) => new Promise(res => { const of = F('gate_' + t + '_' + g + '.out'); try { fs.unlinkSync(of); } catch(e){} const fd = fs.openSync(of, 'w');
    const p = cp.spawn('bash', ['-c', 'set -eo pipefail; node --max-old-space-size=8192 ' + path.join(ROOT, 'tests', 'gates', g + '.js') + ' ' + TREES[t] + ' ' + TREES.V229], { cwd:ROOT, env:Object.assign({}, process.env, { TMPDIR:F('tmp') }), stdio:['ignore', fd, fd] });
    p.on('exit', c => { fs.closeSync(fd); const o = fs.readFileSync(of, 'utf8'); const sm = o.match(/\nPASS (\d+) FAIL (\d+)\s*$/) || o.match(/PASS (\d+) FAIL (\d+)/g); console.log('gate ' + t + ' ' + g + ' exit ' + c + ' ' + (sm ? (Array.isArray(sm) ? sm[sm.length - 1] : sm[0].trim()) : 'NO SUMMARY (CRASH)') + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); res(); }); });
  Promise.all(Array.from({ length:+(process.env.PAR || 4) }, async () => { while(i < jobs.length) await one(jobs[i++]); })).then(() => console.log('gates done'));
}
if(PART === 'gatesum'){
  const G = fs.readdirSync(SCR).filter(f => /^gate_.*\.out$/.test(f)).sort();
  G.forEach(f => { const o = fs.readFileSync(F(f), 'utf8'); const lines = o.split('\n'); const sm = lines.filter(l => /^PASS \d+ FAIL \d+$/.test(l)); const bad = lines.filter(l => /^(FAIL|SKIP [^\d]|REFUSED|INFO)/.test(l) || /REFUSED/.test(l));
    P(f.replace(/^gate_|\.out$/g, '') + ' :: ' + (sm.length ? sm[sm.length - 1] : 'NO SUMMARY (CRASH) last: ' + lines.filter(Boolean).slice(-2).join(' / ').slice(0, 300)));
    bad.forEach(l => P('    ' + l.slice(0, 700))); });
}

// ─── REPORT: equivalence row, (i)/(i-r)/(i-u), (q)-shape counts, pairs rows (e)/(e′)/(k″)/S22, dump rows (k)/(l) ───
if(PART === 'report'){
  const X = fresh('V229'); const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = E(X, '_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const CKS = ['elbow_wa','shoulder_wa','lowback_wa','hip_wa','knee_protect','mario','ankle_wa']; const miss = [];
  const rd = (m, t, ck, p) => { const f = F('res_' + m + '_' + t + '_' + ck + '_' + p + '.json'); if(!fs.existsSync(f)){ miss.push(path.basename(f)); return new Map(); } return new Map(JSON.parse(fs.readFileSync(f, 'utf8')).map(r => [r.id, r])); };
  const R = {}; for(const m of ['S','R','U']) for(const ck of CKS) for(const t of ['V229','CF6']) for(const p of ['CFG','CFG1','OV1','OV5']){ const f = F('res_' + m + '_' + t + '_' + ck + '_' + p + '.json'); if(fs.existsSync(f)) R[m + t + p + ck] = rd(m, t, ck, p); }
  const need = 'S:CF6:CFG,S:V229:CFG,S:CF6:CFG1,S:CF6:OV1,S:V229:OV1,S:CF6:OV5,S:V229:OV5,R:CF6:CFG1,R:CF6:OV1,R:V229:OV1,R:CF6:CFG,R:CF6:OV5,R:V229:OV5,U:CF6:CFG1,U:CF6:OV1,U:V229:OV1,U:CF6:CFG,U:CF6:OV5,U:V229:OV5'.split(',');
  need.forEach(s => { const [m, t, p] = s.split(':'); CKS.forEach(ck => { if(!R[m + t + p + ck]) miss.push(s + ':' + ck); }); });
  P('=== chain result files missing: ' + miss.length + (miss.length ? ' FAILED MEASUREMENT: ' + miss.slice(0, 20).join(', ') : ''));
  const noK = j => { if(typeof j !== 'string') return j; const o = JSON.parse(j); if(o && typeof o === 'object') delete o._ovKey; return JSON.stringify(o); };
  const sEq = (a, b) => a && b && a.n === b.n && a.d === b.d; const hEq = (a, b) => a && b && a.h === b.h;
  const FIELDS = { start:(a, b) => sEq(a.start, b.start), live:(a, b) => sEq(a.live, b.live), live_preHold:(a, b) => hEq(a.live, b.live), toasts:(a, b) => JSON.stringify(a.toasts) === JSON.stringify(b.toasts), boot:(a, b) => sEq(a.boot, b.boot), boot_preHold:(a, b) => hEq(a.boot, b.boot), undo:(a, b) => sEq(a.undo, b.undo) && a.chip === b.chip, undo_preHold:(a, b) => hEq(a.undo, b.undo), undoBoot:(a, b) => sEq(a.undoBoot, b.undoBoot), undoBoot_preHold:(a, b) => hEq(a.undoBoot, b.undoBoot), ph:(a, b) => a.ph === b.ph,
    liveDay:(a, b) => noK(a.liveDay) === noK(b.liveDay), bootDay:(a, b) => noK(a.bootDay) === noK(b.bootDay), undoDay:(a, b) => noK(a.undoDay) === noK(b.undoDay), undoBootDay:(a, b) => noK(a.undoBootDay) === noK(b.undoBootDay) };
  const CORE = ['live','toasts','boot','undo','undoBoot'];
  function cmp(lbl, ka, kb, wk){ let N = 0; const tot = {}; const per = {}; const ex = {}; const anyCore = { n:0 }, anyAll = { n:0 };
    for(const ck of CKS){ const A = R[ka + ck], B = R[kb + ck]; if(!A || !B) continue; const pc = { n:0, core:0, all:0 };
      for(const [id, a] of A){ if(wk && !wk(a)) continue; const b = B.get(id); if(!b) continue; N++; pc.n++; let c = false, al = false;
        for(const [f, fn] of Object.entries(FIELDS)){ if(!fn(a, b)){ tot[f] = (tot[f] || 0) + 1; al = true; if(CORE.includes(f)) c = true; if(!ex[f]) ex[f] = { ck, a, b }; } }
        if(c){ anyCore.n++; pc.core++; } if(al){ anyAll.n++; pc.all++; } } per[ck] = pc; }
    P('\n  ' + lbl + ': chains ' + N + ' | differ on live/toast/boot/undo/undo+boot ' + anyCore.n + ' | differ on any field incl. _preHold, ph and whole-day JSON ' + anyAll.n + ' | by field ' + fmt(tot));
    P('    per config ' + CKS.map(ck => ck + ' ' + (per[ck] ? per[ck].core + '/' + per[ck].all + ' of ' + per[ck].n : 'n/a')).join(' | '));
    Object.keys(ex).slice(0, 6).forEach(f => { const { ck, a, b } = ex[f]; const sh = (r, k) => k === 'toasts' ? JSON.stringify(r.toasts) : /Day$/.test(k) ? '(day json ' + String(r[k]).length + ' bytes)' : k === 'ph' ? r.ph : JSON.stringify(r[k.replace(/_preHold$/, '')]);
      P('    e.g. [' + f + '] ' + ck + ' ' + a.id + ' W' + a.w + ' ' + a.d + ' ' + clean(a.start.n) + ' > ' + a.hops.join(' > ') + '\n        ' + ka + ': ' + sh(a, f) + '\n        ' + kb + ': ' + sh(b, f)); });
    return { N, anyCore:anyCore.n, anyAll:anyAll.n, tot }; }
  const W5 = r => r.w === 5, W3 = r => r.w === 3;
  P('\n=== [4] EQUIVALENCE ROW (S chains: in-session hops, toasts, boot, undo, undo+boot; D190 lattice)');
  P('  baseline equals itself: S:V229:CFG vs S:CF6:CFG (the surgery does not touch the fixture)'); cmp('V229 CFG == CF6 CFG', 'SV229CFG', 'SCF6CFG');
  P('  clock control: CF6 CFG (W5 clock) vs CF6 CFG1 (W1 clock)'); cmp('CF6 CFG vs CF6 CFG1', 'SCF6CFG', 'SCF6CFG1');
  P('  OV1 (overlay from W1 Monday, clock W1 Monday: every week spliced) vs FIXTURE (CFG1, same clock)');
  cmp('CF6 OV1 vs CF6 CFG1 [all weeks]', 'SCF6OV1', 'SCF6CFG1'); cmp('CF6 OV1 vs CF6 CFG1 [W5]', 'SCF6OV1', 'SCF6CFG1', W5); cmp('CF6 OV1 vs CF6 CFG1 [W3]', 'SCF6OV1', 'SCF6CFG1', W3);
  cmp('V229 OV1 vs CF6 CFG1 (before: what V229 delivers on an overlay vs the fixture answer)', 'SV229OV1', 'SCF6CFG1');
  cmp('V229 OV1 vs CF6 OV1 (what CF6 moves on the overlay presentation)', 'SV229OV1', 'SCF6OV1');
  P('  OV5 (overlay from W5 Monday, clock W5 Thursday, the app state of the ruling and of (q))');
  cmp('CF6 OV5 vs CF6 CFG [W5, spliced]', 'SCF6OV5', 'SCF6CFG', W5); cmp('V229 OV5 vs CF6 OV5 [W5]', 'SV229OV5', 'SCF6OV5', W5); cmp('V229 OV5 vs CF6 OV5 [W3, unspliced]', 'SV229OV5', 'SCF6OV5', W3);
  // stamp coverage on the S chains
  for(const k of ['SCF6OV1','SCF6OV5']){ let n = 0, st = 0, st5 = 0, n5 = 0; CKS.forEach(ck => { const A = R[k + ck]; if(!A) return; for(const [, a] of A){ n++; if(a.stamp) st++; if(a.w === 5){ n5++; if(a.stamp) st5++; } } }); P('  ' + k.slice(1) + ' chains on a stamped day ' + st + '/' + n + ' (W5 ' + st5 + '/' + n5 + ')'); }
  // (i) and (q)-shape counts per presentation
  P('\n=== [3] (i) chain carry and the hold machinery, per presentation (S chains)');
  const ne = (a, b) => a.d !== b.d || clean(a.n) !== clean(b.n); const resid = {};
  for(const k of ['SCF6CFG1','SCF6OV1','SV229OV1','SCF6CFG','SCF6OV5','SV229OV5']){ let n = 0, lb = 0, kept = 0, ph = 0, hold = 0, bh = 0, hiCap = 0; const ids = new Set();
    CKS.forEach(ck => { const A = R[k + ck]; if(!A) return; const cap = capOf(CFGS[ck]); for(const [id, a] of A){ if(/OV5|SCF6CFG$|SV229CFG$/.test(k) && a.w !== 5) continue; n++; if(ne(a.live, a.boot)){ lb++; ids.add(id); } if(a.kept.some(h => h !== null)) kept++; ph += a.ph; hold += a.toasts.filter(t => t.endsWith(HOLD)).length; if(a.boot.h !== null) bh++; if(cap.includes(pat(a.live.n)) && rpeMax(a.live.d) > 7) hiCap++; } });
    resid[k] = ids; P('  ' + k.slice(1) + (/OV5|CFG$/.test(k) ? ' [W5]' : ' [all]') + ': chains ' + n + ' | live != boot ' + lb + ' | chains keeping _preHold at any hop ' + kept + ' | ph in record ' + ph + ' | hold toasts ' + hold + ' | booted slot carries _preHold ' + bh + ' | live end on a capped pattern above RPE 7 ' + hiCap); }
  const cs = (a, b) => { const both = [...a].filter(x => b.has(x)).length; return 'both ' + both + ', first only ' + (a.size - both) + ', second only ' + (b.size - both); };
  P('  residue ids (live != boot) CF6 OV1 vs CF6 CFG1: ' + cs(resid.SCF6OV1, resid.SCF6CFG1) + ' | CF6 OV5 vs CF6 CFG [W5]: ' + cs(resid.SCF6OV5, resid.SCF6CFG));
  // (i-r)
  P('\n=== [3] (i-r) reboot before the last hop');
  for(const [k, s] of [['RCF6CFG1','SCF6CFG1'],['RCF6OV1','SCF6OV1'],['RV229OV1','SV229OV1'],['RCF6CFG','SCF6CFG'],['RCF6OV5','SCF6OV5'],['RV229OV5','SV229OV5']]){ let n = 0, tri = 0, lb = 0, kept = 0, bad = 0;
    CKS.forEach(ck => { const A = R[k + ck], S = R[s + ck]; if(!A || !S) return; for(const [id, a] of A){ if(/OV5|CFG$/.test(k) && a.w !== 5) continue; n++; const sl = S.get(id); if(a.bad) bad++; if(!ne(a.live, a.boot)) lb++; if(!ne(a.live, a.boot) && sl && a.live.d === sl.live.d) tri++; if(a.afterReboot && a.afterReboot.h !== null) kept++; } });
    P('  ' + k.slice(1) + (/OV5|CFG$/.test(k) ? ' [W5]' : ' [all]') + ': chains ' + n + ' | live==boot==in-session end ' + tri + ' | live==boot ' + lb + ' | rebooted slot carries the kept dose ' + kept + ' | unreachable ' + bad); }
  { let n = 0, d = 0; const ex = []; CKS.forEach(ck => { const A = R['RCF6OV1' + ck], B = R['RCF6CFG1' + ck]; if(!A || !B) return; for(const [id, a] of A){ const b = B.get(id); if(!b) continue; n++; const f = !(sEq(a.afterReboot, b.afterReboot) && hEq(a.afterReboot, b.afterReboot) && sEq(a.live, b.live) && sEq(a.boot, b.boot) && JSON.stringify(a.toasts) === JSON.stringify(b.toasts)); if(f){ d++; if(ex.length < 2) ex.push(ck + ' ' + id + ' ' + a.hops.join('>') + ' OV1 ' + JSON.stringify([a.afterReboot, a.live.d, a.boot.d]) + ' CFG1 ' + JSON.stringify([b.afterReboot, b.live.d, b.boot.d])); } } });
    P('  R equivalence CF6 OV1 vs CF6 CFG1 (rebooted slot incl. _preHold, last-hop live, boot, toasts): differ ' + d + ' of ' + n); ex.forEach(s => P('    e.g. ' + s)); }
  // (i-u)
  P('\n=== [3] (i-u) undo onto a held intermediate then one more hop');
  for(const k of ['UCF6CFG1','UCF6OV1','UV229OV1','UCF6CFG','UCF6OV5','UV229OV5']){ let n = 0, lb = 0, ld = 0, kept = 0, miss2 = 0;
    CKS.forEach(ck => { const A = R[k + ck]; if(!A) return; for(const [, a] of A){ if(/OV5|CFG$/.test(k) && a.w !== 5) continue; n++; if(!ne(a.live, a.boot)) lb++; if(a.live.d === a.direct.d && clean(a.live.n) === clean(a.direct.n)) ld++; if(a.undone.h !== null) kept++; if(a.undoMiss) miss2++; } });
    P('  ' + k.slice(1) + (/OV5|CFG$/.test(k) ? ' [W5]' : ' [all]') + ': chains ' + n + ' | live==boot ' + lb + ' | live==direct ' + ld + ' | undone card carries the kept dose ' + kept + ' | undo missed hop 1 ' + miss2); }
  { let n = 0, d = 0; const ex = []; CKS.forEach(ck => { const A = R['UCF6OV1' + ck], B = R['UCF6CFG1' + ck]; if(!A || !B) return; for(const [id, a] of A){ const b = B.get(id); if(!b) continue; n++; const f = !(sEq(a.undone, b.undone) && hEq(a.undone, b.undone) && sEq(a.live, b.live) && sEq(a.boot, b.boot) && sEq(a.direct, b.direct) && JSON.stringify(a.toasts) === JSON.stringify(b.toasts)); if(f){ d++; if(ex.length < 2) ex.push(ck + ' ' + id + ' ' + a.hops.join('>')); } } });
    P('  U equivalence CF6 OV1 vs CF6 CFG1 (undone card incl. _preHold, live, boot, direct, toasts): differ ' + d + ' of ' + n); ex.forEach(s => P('    e.g. ' + s)); }
  // ── pairs ──
  P('\n=== [3] (e) / (e′) / (k″) single-hop rows, L9 (7 injured configs), live + boot');
  const PR = []; let stN = 0, stE = 0; CKS.forEach(ck => { const f = F('res_P_' + ck + '.json'); if(!fs.existsSync(f)){ P('  MISSING ' + f + ' (FAILED MEASUREMENT)'); return; } const j = JSON.parse(fs.readFileSync(f, 'utf8')); j.rows.forEach(r => PR.push(r)); stN += j.stamp.n; stE += j.stamp.eq; });
  P('  STAMP instrument check (synthetic applyOverlays shape == real writer OV1, every day of the 7 L9 configs): ' + stE + '/' + stN);
  const bw = (s, v) => new RegExp('^\\d+ sets — RPE ' + v + ' ').test(s || ''); const hi = s => rpeMax(s) !== null && rpeMax(s) > 7;
  for(const cls of ['e','e2']){ const rows = PR.filter(r => r.cls === cls);
    for(const k of ['CF6:CFG1','CF6:OV1','V229:OV1','CF6S22:OV1','CF6S22:CFG1','V229:CFG1','CF6:CFG','CF6:OV5','V229:OV5']){ const A = rows.filter(r => r.R[k]); const g = r => r.R[k];
      const base = /OV5|:CFG$/.test(k) ? 'CF6:CFG' : 'CF6:CFG1'; const eqF = A.filter(r => r.R[base] && g(r).o === r.R[base].o && g(r).t === r.R[base].t && g(r).b === r.R[base].b && g(r).h === r.R[base].h && g(r).bh === r.R[base].bh).length;
      const donorSame = A.filter(r => r.R[base] && g(r).dn === r.R[base].dn).length; const stamped = A.filter(r => g(r).stamp).length;
      P('  (' + (cls === 'e' ? 'e' : 'e′') + ') ' + k.padEnd(12) + ' pairs ' + A.length + ' | donor == fixture donor ' + donorSame + ' | on a stamped day ' + stamped
        + (cls === 'e' ? ' | live bwsets RPE 8 ' + A.filter(r => bw(g(r).o, 8)).length + ' RPE 7 ' + A.filter(r => bw(g(r).o, 7)).length + ' | live cue end ' + A.filter(r => isCue(g(r).o)).length + ' | boot RPE 8 ' + A.filter(r => bw(g(r).b, 8)).length
          : ' | live RPE>7 ' + A.filter(r => hi(g(r).o)).length + ' | boot RPE>7 ' + A.filter(r => g(r).bn === clean(r.to) && hi(g(r).b)).length)
        + ' | live==boot ' + A.filter(r => g(r).o === g(r).b).length + ' | hold toasts ' + A.filter(r => g(r).t.endsWith(HOLD)).length + ' (k″ on bwsets ends ' + A.filter(r => bw(g(r).o, 7) && g(r).t.endsWith(HOLD)).length + ') | "Same job, same numbers." ' + A.filter(r => /Same job, same numbers\.$/.test(g(r).t)).length + ' | _preHold live ' + A.filter(r => g(r).h !== null).length + ' boot ' + A.filter(r => g(r).bh !== null).length
        + ' | == ' + base + ' (live, toast, boot, _preHold) ' + eqF + '/' + A.length); }
    const dif = rows.filter(r => r.R['CF6:OV1'] && r.R['CF6:CFG1'] && (r.R['CF6:OV1'].o !== r.R['CF6:CFG1'].o || r.R['CF6:OV1'].t !== r.R['CF6:CFG1'].t || r.R['CF6:OV1'].b !== r.R['CF6:CFG1'].b));
    dif.slice(0, 3).forEach(r => P('    OV1 != CFG1 ' + r.ck + ' W' + r.w + ' ' + r.d + ' ' + r.from + ' ' + JSON.stringify(r.donor) + ' -> ' + r.to + ' | OV1 ' + JSON.stringify(r.R['CF6:OV1'].o) + ' "' + r.R['CF6:OV1'].t + '" | CFG1 ' + JSON.stringify(r.R['CF6:CFG1'].o) + ' "' + r.R['CF6:CFG1'].t + '"'));
    const ex = rows.find(r => r.R['V229:OV1'] && r.R['CF6:OV1'] && r.R['V229:OV1'].o !== r.R['CF6:OV1'].o); if(ex) P('    e.g. moved by CF6 on OV1: ' + ex.ck + ' W' + ex.w + ' ' + ex.d + ' ' + ex.from + ' ' + JSON.stringify(ex.donor) + ' -> ' + ex.to + '\n      V229 OV1 ' + JSON.stringify(ex.R['V229:OV1'].o) + ' "' + ex.R['V229:OV1'].t + '"\n      CF6 OV1  ' + JSON.stringify(ex.R['CF6:OV1'].o) + ' "' + ex.R['CF6:OV1'].t + '"'); }
  { const rows = PR.filter(r => r.cls === 'e' && r.R['CF6:OV1'] && r.R['CF6S22:OV1']); const lost = rows.filter(r => r.R['CF6:OV1'].t.endsWith(HOLD) && !r.R['CF6S22:OV1'].t.endsWith(HOLD)); const lostBW = lost.filter(r => bw(r.R['CF6:OV1'].o, 7));
    P('  [5] S22 (R8 trigger keyed on the donor as read, cue counted as RPE 7) on (e), OV1: hold toasts lost ' + lost.length + ' of ' + rows.filter(r => r.R['CF6:OV1'].t.endsWith(HOLD)).length + ' (on bwsets ends, the (k″) set: ' + lostBW.length + ') | cards moved by S22 ' + rows.filter(r => r.R['CF6:OV1'].o !== r.R['CF6S22:OV1'].o).length);
    const rf = PR.filter(r => r.cls === 'e' && r.R['CF6:CFG1'] && r.R['CF6S22:CFG1']); P('      same on the fixture (CFG1): hold toasts lost ' + rf.filter(r => r.R['CF6:CFG1'].t.endsWith(HOLD) && !r.R['CF6S22:CFG1'].t.endsWith(HOLD)).length + ' of ' + rf.filter(r => r.R['CF6:CFG1'].t.endsWith(HOLD)).length);
    if(lost[0]) P('      e.g. ' + lost[0].ck + ' ' + lost[0].from + ' ' + JSON.stringify(lost[0].donor) + ' -> ' + lost[0].to + ' | CF6 "' + lost[0].R['CF6:OV1'].t + '" | S22 "' + lost[0].R['CF6S22:OV1'].t + '"'); }
  fs.writeFileSync(F('report_done'), '1'); console.log('REPORT DONE');
}

// ─── DUMPREP: (k) toast truth and (l) D177 verbatim rows on the g221 L1 rows, FIXTURE vs STAMP, V229 vs CF6 ───
//   Hand classification copied from v229_caprpe_cf3.js (report part): the hand CAP table, the hand hold, the hand stripper,
//   V228's and V227's rows as the pre-clamp references (measure's own dumps, PRIOR scratch), g221's own stripRep.
if(PART === 'dumprep'){
  const X = fresh('V229'); const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = E(X, '_pattern(' + JSON.stringify(clean(n)) + ')') || '-');
  const OLD = ' — hold RPE 7, two in the tank';
  const TESTRE = /^Work up to one heavy set of 3 to 5 reps at RPE [\d.]+\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/;
  function handHold(d){ if(typeof d !== 'string') return d; if(TESTRE.test(d)) return R7T; return d.replace(/RPE (\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?\+?( \((stop 2 reps short of failure|leave ~\d+ reps? in reserve|heaviest pair you can find)\))?/g, (t, a, b, g, gl) => { if(!(Math.max(+a, b ? +b : 0) > 7)) return t; if(!g) return 'RPE 7'; if(/^stop/.test(gl)) return 'RPE 7 (leave 3 or more in reserve)'; if(/^heaviest/.test(gl)) return 'RPE 7 (leave ~3 in reserve)'; return 'RPE 7 (leave ~3 reps in reserve)'; }); }
  function handStrip(d){ if(typeof d !== 'string') return d; if(d === R7T) return TEST9; const m = / — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m ? d.slice(0, m.index) : d; }
  const slim = r => ({ where:r.where, k:r.k, hout:r.hout, isPow:r.isPow, to:r.to, from:r.from, D:r.D, O:r.O, toast:r.toast });
  const G = {}; const src = { V228:path.join(PRIOR, 'gate_rows_V228.json'), V227:PI('gate_rows_V227.json') };
  for(const k of ['CF6_CFG','CF6_STAMP','V229_CFG','V229_STAMP']) src[k] = F('dump_' + k + '.json');
  for(const [k, f] of Object.entries(src)){ if(!fs.existsSync(f)){ P('MISSING ' + f + ' (FAILED MEASUREMENT)'); continue; } G[k] = JSON.parse(fs.readFileSync(f, 'utf8')).map(slim); P('rows ' + k + ' ' + G[k].length); }
  const al = (a, b) => G[a] && G[b] && G[a].length === G[b].length && G[a].every((r, i) => r.where === G[b][i].where && r.to === G[b][i].to);
  P('aligned (where,to by index): CF6_STAMP~CF6_CFG ' + al('CF6_STAMP', 'CF6_CFG') + ' | V229_CFG~CF6_CFG ' + al('V229_CFG', 'CF6_CFG') + ' | V229_STAMP~CF6_CFG ' + al('V229_STAMP', 'CF6_CFG') + ' | V228~CF6_CFG ' + al('V228', 'CF6_CFG') + ' | V227~CF6_CFG ' + al('V227', 'CF6_CFG'));
  const idn = (a, b) => { if(!G[a] || !G[b]) return 'n/a'; let o = 0, t = 0, any = 0; const ex = []; G[a].forEach((r, i) => { const s = G[b][i]; const fo = r.O !== s.O, ft = r.toast !== s.toast; if(fo) o++; if(ft) t++; if(fo || ft){ any++; if(ex.length < 2) ex.push(r.where + ' :: ' + JSON.stringify(r.D) + ' | ' + a + ' ' + JSON.stringify(r.O) + ' "' + r.toast + '" | ' + b + ' ' + JSON.stringify(s.O) + ' "' + s.toast + '"'); } }); return 'card differs ' + o + ' | toast differs ' + t + ' | any ' + any + ' of ' + G[a].length + (ex.length ? '\n      e.g. ' + ex.join('\n      e.g. ') : ''); };
  P('\n=== [4] g221 L1 rows identity');
  P('  CF6 STAMP vs CF6 CFG (the lens on the overlay shape vs the fixture): ' + idn('CF6_STAMP', 'CF6_CFG'));
  P('  V229 CFG vs CF6 CFG (fixture unchanged by the surgery): ' + idn('V229_CFG', 'CF6_CFG'));
  P('  V229 STAMP vs CF6 STAMP (what CF6 moves on the overlay shape): ' + idn('V229_STAMP', 'CF6_STAMP'));
  if(!(G.V228 && G.V227 && al('V228', 'CF6_CFG'))){ P('  (k)/(l) hand classification needs V228/V227 rows aligned with CF6: NOT ALIGNED, FAILED MEASUREMENT'); }
  else {
    const capT = r => { const m = /\|(\w+)\/(\w+) W/.exec(r.where); return m ? (CAP[m[1]] && CAP[m[1]][m[2]] || []).includes(pat(r.to)) : false; };
    const blindBoth = s => (typeof s === 'string') ? s.replace(/ — hold RPE 7, (?:two|three) in the tank$/, '') : s;
    const bucket = d => /rpe\s*6|light|easy/i.test(d) ? 6 : /rpe\s*7/i.test(d) ? 7 : 8;
    const claims = t => /same numbers|same effort/i.test(String(t));
    const gs = fs.readFileSync(path.join(ROOT, 'tests', 'gates', 'g221_d177_swapfloor.js'), 'utf8'); const REPL = gs.split('\n').filter(l => /^const (REP_TOKEN|stripRep)\b/.test(l)).join('\n'); const { stripRep } = new Function(REPL + '\nreturn { stripRep };')();
    for(const key of ['CF6_CFG','CF6_STAMP','V229_STAMP','V229_CFG']){ if(!G[key]) continue;
      const J = G[key].map((r, i) => { const b8 = G.V228[i], b7 = G.V227[i]; const Ds = handStrip(r.D); const conv = r.k === 'zero' && blindBoth(b8.O) !== blindBoth(b8.D); const dr = conv ? bucket(Ds) : rpeMax(Ds); const ct = capT(r);
        const kind = r.k === 'win' && /The load runs out/.test(b8.toast) ? 'window' : conv ? 'unloadable' : 'verbatim'; return Object.assign({}, r, { b8, b7, Ds, conv, dr, ct, clampPair:ct && dr !== null && dr > 7, kind }); });
      const want = r => { const to = r.to, from = r.from.toLowerCase(); if(r.kind === 'window'){ const m = /Reps move to (\d+) to (\d+)\./.exec(r.b8.toast); return to + ' in, ' + from + ' out. The load runs out before the reps do here. Reps move to ' + (m ? m[1] : '?') + ' to ' + (m ? m[2] : '?') + '.' + HOLD; } if(r.kind === 'unloadable') return to + ' in, ' + from + ' out. No load to add here.' + HOLD; return to + ' in, ' + from + ' out. Same sets, same reps.' + HOLD; };
      const cl = J.filter(r => r.clampPair), non = J.filter(r => !r.clampPair); const hn = non.filter(r => r.toast.endsWith(HOLD));
      P('\n=== [3] (k) ' + key + ': clamp pairs ' + cl.length + ' | toast == hand hold variant ' + cl.filter(r => r.toast === want(r)).length + ' | by variant ' + fmt(tally(cl.filter(r => r.toast.endsWith(HOLD)), r => r.kind)) + ' | false same-numbers/effort claims on clamp pairs ' + cl.filter(r => claims(r.toast)).length + ' | hold toasts off the clamp set ' + hn.length + ' | non-clamp toasts == V227 ' + non.filter(r => r.toast === r.b7.toast).length + '/' + non.length
        + ' | INFO capped (card RPE != donor RPE, claims same, no hold) ' + J.filter(r => r.ct && rpeMax(r.Ds) !== null && rpeMax(r.O) !== null && rpeMax(r.Ds) !== rpeMax(r.O) && claims(r.toast) && !r.toast.endsWith(HOLD)).length);
      const fails = { G3a:r => !r.isPow && r.k !== 'zero' && r.O !== r.D && stripRep(r.O) !== stripRep(r.D), G3c_pow:r => r.isPow && r.k !== 'zero' && blindBoth(r.O) !== blindBoth(r.D), G3c_off:r => !r.isPow && r.k === 'offgram' && blindBoth(r.O) !== blindBoth(r.D), G3d:r => !r.isPow && r.k === 'atfloor' && r.O !== r.D, G3e:r => !r.isPow && r.k === 'null' && r.O !== r.D, G3f:r => !r.isPow && r.k === 'win' && r.O !== r.hout };
      const cls = r => { if(r.ct && blindBoth(r.O) === blindBoth(handHold(blindBoth(r.Ds)))) return 'capped: hold of donor'; if(r.ct && r.O === handHold(r.hout || '')) return 'capped: hold of window'; if(!r.ct && r.O === r.Ds) return 'uncapped: beneath-hold verbatim'; return (r.ct ? 'capped' : 'UNCAPPED') + ' OTHER'; };
      P('    (l) ' + Object.entries(fails).map(([g, f]) => { const fc = J.filter(f); return g + ' ' + fc.length + ' {' + fmt(tally(fc, cls)) + '}'; }).join(' ; '));
      const rx = J.filter(r => r.O === R7T); P('    (j) live: rows printing R7 text ' + rx.length + ' | R7-donor rows onto uncapped targets printing _testRx ' + J.filter(r => r.D === R7T && !r.ct && r.O === TEST9).length); }
  }
  console.log('DUMPREP DONE');
}
