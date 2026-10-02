// v228_caprpe_cf.js — MEASURE (read-only). D193 pre-builder measures M1-M3 on a source-surgery CF copy of V227
// carrying R1 (literal "three"), R2 (clamp inside applyInjuryFilter), R4 (_stripCapCue strips both wordings).
//   SCR=<scratch> node tests/measure/v228_caprpe_cf.js
// The R2 text below is MEASURE's reading of the ruling, written only so the after-grid can be printed; it is not the build.
// Oracles: ruling text (expected counts per class), rpeFromWave arithmetic rir=round(10-RPE), _bwSetsFromDetail's own RPE 7 line.
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures, progDigest } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n), HEAD = path.join(ROOT, 'index.html');
const OLD = ' — hold RPE 7, two in the tank', NEW = ' — hold RPE 7, three in the tank';
const START = '2026-08-24', CLOCK = '2026-09-24';
const out = []; const P = s => { out.push(s); console.log(s); };
const SRC = fs.readFileSync(HEAD, 'utf8');
P('V227 ia-version ' + (SRC.match(/ia-version" content="(\d+)"/) || [])[1]);
// ── CF surgery, every anchor count==1 ──
const ED = [
  ["const INJ_CAP_CUE=' — hold RPE 7, two in the tank';", "const INJ_CAP_CUE=' — hold RPE 7, three in the tank';"],
  ["function _stripCapCue(d){ return (typeof d==='string'&&d.endsWith(INJ_CAP_CUE))?d.slice(0,d.length-INJ_CAP_CUE.length):d; }",
   "function _stripCapCue(d){ if(typeof d!=='string') return d; const m=/ — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m?d.slice(0,m.index):d; }\n"
   + "function _capClamp(d){ if(typeof d!=='string') return d; const m=/^(\\d+) sets — RPE ([\\d.]+) \\(stop 2 reps short of failure\\)/.exec(d); if(m){ return +m[2]>7 ? m[1]+' sets — RPE 7 (leave 3 or more in reserve)'+d.slice(m[0].length) : d; }"
   + " let hi=false; const o=d.replace(/RPE\\s*([\\d.]+)(?:\\s*–\\s*([\\d.]+))?/g,function(t,a,b){ const v=Math.max(+a,b?+b:0); if(v>7){hi=true;return 'RPE 7';} return t; }); if(!hi) return d;"
   + " return o.replace(/leave ~\\d+ reps? in reserve/g,'leave ~3 reps in reserve').replace(/stop 2 reps short of failure/g,'leave 3 or more in reserve'); }"],
  ["if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail+INJ_CAP_CUE;",
   "if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail+INJ_CAP_CUE; else if(pat&&P.cap.has(pat)&&detail) detail=_capClamp(detail);"]];
let cf = SRC; ED.forEach(([a, b], i) => { const n = cf.split(a).length - 1; P('  anchor ' + (i + 1) + ' count ' + n + ' :: ' + a.slice(0, 90)); if(n !== 1) throw new Error('anchor ' + (i + 1) + ' count ' + n); cf = cf.replace(a, b); });
const CFP = F('cf_d193_227.html'); try { fs.unlinkSync(CFP); } catch(e){} fs.writeFileSync(CFP, cf);
const TREES = { V227:HEAD, CF:CFP };
const clone = x => JSON.parse(JSON.stringify(x));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const withInj = inj => { const c = clone(MARIO); if(inj) c.injury = inj; return c; };
const L9 = { mario:withInj({ region:'knee', tier:'workaround' }), manny:clone(fixtures.HALF_MANNY), mario_noinj:withInj(null), knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }), lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
const CAP = { knee:{ workaround:['squat','lunge','leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat','lunge'], protect:['squat'] }, hip:{ workaround:['hinge','lunge','hip_ext','squat'], protect:['squat'] }, lowback:{ workaround:['hinge','squat','row','hip_ext'], protect:['squat','hip_ext'] }, shoulder:{ workaround:['hpress','vpress','delt_iso'], protect:[] }, elbow:{ workaround:['hpress','tri_iso','bi_iso','row','vpull'], protect:['row','vpull'] } };
const capOf = c => c.injury ? CAP[c.injury.region][c.injury.tier] : [];
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};globalThis.__T=[];showToast=function(m){__T.push(String(m));};";
const VM = {}; const vm = t => VM[t] || (VM[t] = (X => (pin(X), E(X, HELP), X))(load(TREES[t])));
const PC = {}; const pat = n => (n in PC) ? PC[n] : (PC[n] = vm('V227').eval('_pattern(' + JSON.stringify(n) + ')') || '-');
const rpeMax = d => { const v = [...String(d || '').matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)); return v.length ? Math.max(...v) : null; };
const shapeKey = d => String(d || '').replace(/^\d+/, 'N').replace(/×\d+(–\d+)?/, '×R').replace(/ — hold RPE 7, (two|three) in the tank$/, ' — CUE($1)');
function cards(t, cfg){ const p = vm(t).buildProgram(clone(cfg)); const m = []; Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { const dy = p.weeks[w][d]; ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(it) m.push({ k:w + '|' + d + '|' + si + '|' + ii, w:+w, d, si, ii, label:clean(s.label), n:clean(it.name), raw:it.name, det:it.detail || '' }); })); })); return { m, p }; }
// gloss check on a capped end: R2 coverage flags
function flags(d){ const f = []; const toks = [...String(d).matchAll(/RPE\s*([\d.]+(?:\s*–\s*[\d.]+)?)/g)].map(x => x[1]);
  if(toks.length > 1) f.push('second RPE token'); if(toks.some(t => /–/.test(t))) f.push('range ' + toks.find(t => /–/.test(t)));
  const r = rpeMax(d); if(r !== null && r > 7) f.push('RPE ' + r + ' remains');
  if(r === 7 || r === null){ if(/stop 2 reps short of failure|leave ~2 reps? in reserve|2 reps left|heaviest/.test(d)) f.push('gloss disagrees with 7: ' + (d.match(/stop 2 reps short of failure|leave ~2 reps? in reserve|2 reps left|heaviest[^)]*/) || [])[0]);
    if(r === 7 && !/reserve|tank|failure/.test(d)) f.push('no gloss'); }
  return f; }
const stored = {}; function storedOf(ck, cfg){ if(!stored[ck]){ const X = load(HEAD); pin(X); const p = X.buildProgram(clone(cfg)); const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) }); stored[ck] = JSON.stringify(st); } return stored[ck]; }
const BOOT = {}; function bootVM(t){ if(!BOOT[t]){ BOOT[t] = load(TREES[t]); pin(BOOT[t]); } return BOOT[t]; }
function bootRead(t, st, sw, hist, w, d, si, ii){ const Z = bootVM(t); Z.localStorage.clear(); Z.ctx.__SP = JSON.parse(st); E(Z, 'savePrograms([__SP]);'); if(sw) Z.localStorage.setItem('ia_swaps_PM', sw); if(hist) Z.localStorage.setItem('ia_hist_PM', hist);
  return E(Z, "(function(){var p=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));var it=p.weeks[" + w + "]." + d + ".sections[" + si + "]&&p.weeks[" + w + "]." + d + ".sections[" + si + "].items[" + ii + "];return it?it.name+' :: '+it.detail:'(none) :: ';})()"); }
function liveVM(t, ck, cfg){ const Y = load(TREES[t]); pin(Y); E(Y, HELP); Y.localStorage.clear(); Y.ctx.__SP = JSON.parse(storedOf(ck, cfg)); E(Y, "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); return Y; }
function liveSwap(Y, w, d, si, ii, name, det, to){ E(Y, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); const snap = E(Y, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')');
  Y.ctx.__c = { secIdx:si, itemIdx:ii, name:String(name), detail:String(det) }; Y.ctx.__to = to; let o, sw; try { E(Y, '_swapCtx=__c;applySwapChoice(__to);'); o = E(Y, 'activeProg.weeks[' + w + '].' + d + '.sections[' + si + '].items[' + ii + '].detail'); } catch(e){ o = 'CRASH ' + e.message; }
  sw = E(Y, "localStorage.getItem('ia_swaps_PM')"); let ud; try { Y.ctx.__fr = String(name); E(Y, 'undoSwap(__fr);'); ud = E(Y, 'activeProg.weeks[' + w + '].' + d + '.sections[' + si + '].items[' + ii + '].detail'); } catch(e){ ud = 'CRASH ' + e.message; }
  Y.ctx.__S = JSON.parse(snap); E(Y, 'activeProg.weeks[' + w + '].' + d + "=__S;localStorage.removeItem('ia_swaps_PM');localStorage.removeItem('ia_swapct_PM');"); return { o, sw, ud }; }
const INJ9 = Object.keys(L9).filter(c => L9[c].injury);
const base9 = {}; INJ9.forEach(ck => { base9[ck] = cards('V227', L9[ck]).m; });

// ═══ M1 ═══
P('\n=== M1 uncued RPE>7 donors -> capped sheet targets, L9 (7 injured configs), live / boot / exSwapPrefs build, V227 vs CF');
const M1 = []; let m1pairs = 0;
for(const ck of INJ9){ const cfg = L9[ck]; const cap = capOf(cfg); const st = storedOf(ck, cfg); const Y = { V227:liveVM('V227', ck, cfg), CF:liveVM('CF', ck, cfg) };
  const donors = base9[ck].filter(c => !c.det.endsWith(OLD) && rpeMax(c.det) > 7);
  for(const c of donors){ E(Y.V227, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); Y.V227.ctx.__D = E(Y.V227, 'activeProg.weeks[' + c.w + '].' + c.d);
    const lv = Y.V227.ctx.__D && Y.V227.ctx.__D.sections[c.si] && Y.V227.ctx.__D.sections[c.si].items[c.ii]; if(!lv || clean(lv.name) !== c.n) continue; const ln = String(lv.name), ld = String(lv.detail);
    let tg; try { tg = Array.from(E(Y.V227, '__cands(__D,' + c.w + ',' + JSON.stringify(ln) + ')')); } catch(e){ tg = []; }
    for(const to of tg){ m1pairs++; if(!cap.includes(pat(to))) continue; const r = { ck, w:c.w, d:c.d, from:c.n, donor:ld, to, tp:pat(to) };
      for(const t of ['V227','CF']){ const s = liveSwap(Y[t], c.w, c.d, c.si, c.ii, ln, ld, to); r[t + 'live'] = s.o; const b = bootRead(t, st, s.sw, null, c.w, c.d, c.si, c.ii); r[t + 'bootName'] = b.split(' :: ')[0]; r[t + 'boot'] = b.split(' :: ').slice(1).join(' :: '); }
      M1.push(r); } } }
const hi = s => rpeMax(s) !== null && rpeMax(s) > 7;
P('   donor x candidate pairs ' + m1pairs + ' | capped targets ' + M1.length + ' | crash ' + M1.filter(r => /CRASH/.test(r.V227live + r.CFlive)).length + ' | boot landed V227 ' + M1.filter(r => clean(r.V227bootName) === r.to).length + ' CF ' + M1.filter(r => clean(r.CFbootName) === r.to).length);
P('   class (iii-b) RPE>7 on the capped end: live V227 ' + M1.filter(r => hi(r.V227live)).length + ' -> CF ' + M1.filter(r => hi(r.CFlive)).length + ' | boot (landed) V227 ' + M1.filter(r => clean(r.V227bootName) === r.to && hi(r.V227boot)).length + ' -> CF ' + M1.filter(r => clean(r.CFbootName) === r.to && hi(r.CFboot)).length + ' | by config ' + fmt(tally(M1.filter(r => hi(r.V227live)), r => r.ck)) + ' | live==boot V227 ' + M1.filter(r => r.V227live === r.V227boot).length + ' CF ' + M1.filter(r => r.CFlive === r.CFboot).length + ' /' + M1.length);
const shp = {}; M1.forEach(r => { const k = shapeKey(r.V227live); (shp[k] = shp[k] || { n:0, hi:0, cf:{}, fl:{} }).n++; if(hi(r.V227live)) shp[k].hi++; const ck2 = shapeKey(r.CFlive); shp[k].cf[ck2] = (shp[k].cf[ck2] || 0) + 1; flags(r.CFlive).forEach(f => shp[k].fl[f] = (shp[k].fl[f] || 0) + 1); });
P('   distinct live V227 end shapes ' + Object.keys(shp).length + ' (each with CF text and R2 coverage flags on the CF text):');
Object.keys(shp).sort((a, b) => shp[b].n - shp[a].n).forEach(k => P('     [' + shp[k].n + (shp[k].hi ? ', RPE>7 ' + shp[k].hi : '') + '] V227 ' + JSON.stringify(k) + '\n        CF ' + Object.keys(shp[k].cf).map(x => JSON.stringify(x) + ' x' + shp[k].cf[x]).join(' ; ') + (Object.keys(shp[k].fl).length ? '\n        FLAG ' + fmt(shp[k].fl) : '')));
const dsh = tally(M1.filter(r => hi(r.V227live)), r => shapeKey(r.donor)); P('   donor shapes behind iii-b: ' + fmt(dsh));
// build path
let bp = 0; const MB = []; const seenP = new Set();
for(const r of M1){ const key = r.ck + '|' + r.from + '>' + r.to; if(seenP.has(key)) continue; seenP.add(key); bp++; const cfg = clone(L9[r.ck]); cfg.exSwapPrefs = { [r.from]:r.to };
  const A = cards('V227', cfg).m, C = cards('CF', cfg).m; const cm = new Map(C.map(x => [x.k, x]));
  base9[r.ck].filter(x => x.n === r.from && !x.det.endsWith(OLD) && rpeMax(x.det) > 7).forEach(x => { const a = A.find(y => y.k === x.k), c = cm.get(x.k); if(a && a.n === r.to) MB.push({ ck:r.ck, to:r.to, a:a.det, c:c && c.n === r.to ? c.det : '(moved)' }); }); }
P('   BUILD exSwapPrefs: prefs ' + bp + ' | landed cards ' + MB.length + ' | RPE>7 V227 ' + MB.filter(x => hi(x.a)).length + ' -> CF ' + MB.filter(x => hi(x.c)).length + ' | CF flags ' + fmt(tally(MB.flatMap(x => flags(x.c)), x => x)));
const bsh = tally(MB.filter(x => hi(x.a)), x => shapeKey(x.a) + '  =>  ' + shapeKey(x.c)); P('   build iii-b shapes V227 => CF: ' + fmt(bsh));

// ═══ M2 ═══
P('\n=== M2 after-grid V227 vs CF, L432 (6 regions x 2 tiers x 4 equipment x 3 exp x 3 focus), positional, every differing card classified');
const REG = ['knee','ankle','hip','lowback','shoulder','elbow'], TIER = ['workaround','protect'], EQ = ['commercial','crossfit','home_full','bodyweight'], EXP = ['beginner','intermediate','advanced'], FOC = ['support_strength','support_athletic','support_prevention'];
const cls = {}; const uncl = []; let ncards = 0, nb = 0, capHiCF = []; const clampRe = /^(\d+) sets — RPE 8 \(stop 2 reps short of failure\)/;
for(const r of REG) for(const t of TIER) for(const eq of EQ) for(const ex of EXP) for(const fo of FOC){ nb++;
  const cfg = clone(MARIO); Object.assign(cfg, { injury:{ region:r, tier:t }, equipment:eq, experience:ex, liftingFocus:fo });
  const A = cards('V227', cfg).m, C = cards('CF', cfg).m; const cm = new Map(C.map(x => [x.k, x])); ncards += A.length;
  if(A.length !== C.length) uncl.push('CARD COUNT ' + [r, t, eq, ex, fo].join('/') + ' ' + A.length + ' vs ' + C.length);
  C.forEach(c => { if(capOf(cfg).includes(pat(c.n)) && rpeMax(c.det) > 7) capHiCF.push([r, t, eq, ex, fo].join('/') + ' W' + c.w + ' ' + c.d + ' [' + c.label + '] ' + c.n + ' ' + JSON.stringify(c.det)); });
  A.forEach(a => { const c = cm.get(a.k); if(!c){ uncl.push('MISSING ' + a.k); return; } if(c.n === a.n && c.det === a.det && c.label === a.label) return;
    let k = null;
    if(c.n === a.n && a.det.endsWith(OLD) && c.det === a.det.slice(0, -OLD.length) + NEW) k = '(i) literal';
    else if(c.n === a.n && clampRe.test(a.det) && c.det === a.det.replace(clampRe, '$1 sets — RPE 7 (leave 3 or more in reserve)')) k = /Burpees/.test(a.n) ? '(ii-b) clamp Burpees Main' : '(ii) clamp';
    if(k) (cls[k] = cls[k] || []).push({ seg:[r, t, eq, ex, fo].join('/'), a, c }); else uncl.push([r, t, eq, ex, fo].join('/') + ' ' + a.k + ' [' + a.label + '] ' + a.n + ' ' + JSON.stringify(a.det) + ' => [' + c.label + '] ' + c.n + ' ' + JSON.stringify(c.det)); }); }
P('   builds ' + nb + ' | cards ' + ncards + ' | classified ' + fmt(Object.fromEntries(Object.entries(cls).map(([k, v]) => [k, v.length]))) + ' | UNCLASSIFIED ' + uncl.length);
if(cls['(ii) clamp']) P('   (ii) by region/tier ' + fmt(tally(cls['(ii) clamp'], x => x.seg.split('/').slice(0, 2).join('/'))) + ' | by eq ' + fmt(tally(cls['(ii) clamp'], x => x.seg.split('/')[2])) + ' | by label ' + fmt(tally(cls['(ii) clamp'], x => x.a.label.replace(/ — .*/, ''))));
if(cls['(ii-b) clamp Burpees Main']) P('   (ii-b) ' + fmt(tally(cls['(ii-b) clamp Burpees Main'], x => x.seg + ' W' + x.a.w + ' ' + x.a.label)));
if(cls['(i) literal']) P('   (i) by region/tier ' + fmt(tally(cls['(i) literal'], x => x.seg.split('/').slice(0, 2).join('/'))) + ' | Burpees ' + cls['(i) literal'].filter(x => /Burpees/.test(x.a.n)).length);
(cls['(ii) clamp'] || []).slice(0, 2).forEach(x => P('     e.g. (ii) ' + x.seg + ' W' + x.a.w + ' ' + x.a.n + ' ' + JSON.stringify(x.a.det) + ' => ' + JSON.stringify(x.c.det)));
P('   (a′) capped cards still naming RPE>7 on CF: ' + capHiCF.length); capHiCF.forEach(s => P('     ' + s));
uncl.forEach(s => P('   UNCLASSIFIED ' + s));
// (iii) and (iv) on CF
P('\n   (iii) cued donor -> capped unloadable target, L9: live / boot / build, V227 vs CF');
const R3 = []; let p3 = 0;
for(const ck of INJ9){ const cfg = L9[ck]; const st = storedOf(ck, cfg); const Y = { V227:liveVM('V227', ck, cfg), CF:liveVM('CF', ck, cfg) };
  for(const c of base9[ck].filter(x => x.det.endsWith(OLD))){ E(Y.V227, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); Y.V227.ctx.__D = E(Y.V227, 'activeProg.weeks[' + c.w + '].' + c.d);
    const lv = Y.V227.ctx.__D.sections[c.si] && Y.V227.ctx.__D.sections[c.si].items[c.ii]; if(!lv) continue; const ln = String(lv.name), ld = String(lv.detail);
    for(const to of Array.from(E(Y.V227, '__cands(__D,' + c.w + ',' + JSON.stringify(ln) + ')'))){ p3++; if(!capOf(cfg).includes(pat(to))) continue; const rf = JSON.parse(E(Y.V227, 'JSON.stringify(_repFloor(' + JSON.stringify(to) + '))')); if(!(rf && rf[1] === 0)) continue;
      const r = { ck, from:c.n, to, w:c.w }; for(const t of ['V227','CF']){ const s = liveSwap(Y[t], c.w, c.d, c.si, c.ii, ln, ld, to); r[t + 'l'] = s.o; const b = bootRead(t, st, s.sw, null, c.w, c.d, c.si, c.ii); r[t + 'b'] = b.split(' :: ').slice(1).join(' :: '); r[t + 'bn'] = clean(b.split(' :: ')[0]); } R3.push(r); } } }
const bw = (s, v) => new RegExp('^\\d+ sets — RPE ' + v + ' ').test(s || '');
P('   pairs ' + p3 + ' | capped unloadable ' + R3.length + ' | live RPE 8: V227 ' + R3.filter(r => bw(r.V227l, 8)).length + ' CF ' + R3.filter(r => bw(r.CFl, 8)).length + ' | live RPE 7 CF ' + R3.filter(r => bw(r.CFl, 7)).length + ' | boot RPE 8: V227 ' + R3.filter(r => bw(r.V227b, 8)).length + ' CF ' + R3.filter(r => bw(r.CFb, 8)).length + ' | boot RPE 7 CF ' + R3.filter(r => bw(r.CFb, 7)).length + ' | live==boot CF ' + R3.filter(r => r.CFl === r.CFb).length + '/' + R3.length + ' | CF ends ' + fmt(tally(R3, r => shapeKey(r.CFl))));
const R3B = []; const sp = new Set(); for(const r of R3){ const k = r.ck + '|' + r.from + '>' + r.to; if(sp.has(k)) continue; sp.add(k); const cfg = clone(L9[r.ck]); cfg.exSwapPrefs = { [r.from]:r.to }; const A = cards('V227', cfg).m, C = cards('CF', cfg).m; const cm = new Map(C.map(x => [x.k, x]));
  base9[r.ck].filter(x => x.n === r.from && x.det.endsWith(OLD)).forEach(x => { const a = A.find(y => y.k === x.k), c = cm.get(x.k); if(a && a.n === r.to) R3B.push({ a:a.det, c:c ? c.det : '' }); }); }
P('   build: landed ' + R3B.length + ' | RPE 8 V227 ' + R3B.filter(x => bw(x.a, 8)).length + ' CF ' + R3B.filter(x => bw(x.c, 8)).length + ' | RPE 7 CF ' + R3B.filter(x => bw(x.c, 7)).length + ' | CF ends ' + fmt(tally(R3B, x => shapeKey(x.c))));
P('\n   (iv) grid stored by V227 (old literal), booted on V227 and CF; one live swap per cued W1-W4 card (first candidate), boot replay, undo');
const R4 = [];
for(const ck of INJ9){ const cfg = L9[ck]; const st = storedOf(ck, cfg); const Y = { V227:liveVM('V227', ck, cfg), CF:liveVM('CF', ck, cfg) };
  const B = JSON.parse(E(Y.CF, 'JSON.stringify(activeProg.weeks)'));
  let oldN = 0, newN = 0; Object.keys(B).forEach(w => Object.keys(B[w]).forEach(d => ((B[w][d] && B[w][d].sections) || []).forEach(s => (s.items || []).forEach(it => { if(it && it.detail){ if(it.detail.endsWith(OLD)) oldN++; if(it.detail.endsWith(NEW)) newN++; } }))));
  P('     ' + ck.padEnd(12) + ' booted CF: old-literal cards ' + oldN + ' new-literal ' + newN);
  Object.keys(B).filter(w => +w <= 4).forEach(w => Object.keys(B[w]).forEach(d => ((B[w][d] && B[w][d].sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { if(!it || !it.detail || !it.detail.endsWith(OLD)) return;
    E(Y.CF, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); Y.CF.ctx.__D = E(Y.CF, 'activeProg.weeks[' + w + '].' + d); const tg = Array.from(E(Y.CF, '__cands(__D,' + w + ',' + JSON.stringify(it.name) + ')')); if(!tg.length) return;
    const r = { ck, w, d, from:clean(it.name), to:tg[0], capT:capOf(cfg).includes(pat(tg[0])), old:it.detail };
    for(const t of ['V227','CF']){ const s = liveSwap(Y[t], w, d, si, ii, it.name, it.detail, tg[0]); r[t] = s; const b = bootRead(t, st, s.sw, null, w, d, si, ii); r[t + 'bn'] = clean(b.split(' :: ')[0]); r[t + 'b'] = b.split(' :: ').slice(1).join(' :: '); }
    R4.push(r); }))));
}
const g4 = o => (o || '').startsWith('CRASH') ? 'CRASH' : o.includes(OLD) ? 'OLD carried' : o.endsWith(NEW) ? 'new cue' : /^\d+ sets — RPE (\d)/.test(o) ? 'bwsets ' + /^\d+ sets — RPE (\d)/.exec(o)[1] : /RPE/.test(o) ? 'RPE ' + rpeMax(o) : 'no-RPE no-cue';
P('     live swaps ' + R4.length + ' | V227 tree ' + fmt(tally(R4, r => g4(r.V227.o))) + ' | CF tree ' + fmt(tally(R4, r => g4(r.CF.o))));
P('     CF capped targets ' + fmt(tally(R4.filter(r => r.capT), r => g4(r.CF.o))) + ' | CF uncapped targets ' + fmt(tally(R4.filter(r => !r.capT), r => g4(r.CF.o))));
const L4 = t => R4.filter(r => r[t + 'bn'] === r.to); P('     boot replay landed V227 ' + L4('V227').length + ' CF ' + L4('CF').length + ' | V227 ' + fmt(tally(L4('V227'), r => g4(r.V227b))) + ' | CF ' + fmt(tally(L4('CF'), r => g4(r.CFb))));
P('     undo restores the stored detail verbatim: V227 ' + R4.filter(r => r.V227.ud === r.old).length + '/' + R4.length + ' CF ' + R4.filter(r => r.CF.ud === r.old).length + '/' + R4.length);

// ═══ M3 ═══
P('\n=== M3 HALF_MANNY digest and uninjured byte-identity');
{ const a = progDigest(load(HEAD).buildProgram(clone(L9.manny))), b = progDigest(load(CFP).buildProgram(clone(L9.manny))), b2 = progDigest(load(CFP).buildProgram(clone(L9.manny)));
  P('   HALF_MANNY V227 ' + a + ' | CF ' + b + ' (CF self ' + (b === b2 ? 'equal' : 'MISMATCH') + ') | expected 0ac7da6b1691a8e1: ' + (b === '0ac7da6b1691a8e1' ? 'YES' : 'NO')); }
let same = 0, tot = 0; const diffs = [];
const UN = [clone(L9.mario_noinj)]; for(const eq of EQ) for(const ex of EXP) for(const fo of FOC){ const c = clone(MARIO); Object.assign(c, { equipment:eq, experience:ex, liftingFocus:fo }); UN.push(c); }
for(const c of UN){ tot++; const a = JSON.stringify(vm('V227').buildProgram(clone(c)).weeks), b = JSON.stringify(vm('CF').buildProgram(clone(c)).weeks), a2 = JSON.stringify(vm('V227').buildProgram(clone(c)).weeks); if(a !== a2) diffs.push('BASELINE SELF-MISMATCH ' + c.equipment + '/' + c.experience + '/' + c.liftingFocus); if(a === b) same++; else diffs.push(c.equipment + '/' + c.experience + '/' + c.liftingFocus); }
P('   uninjured builds (mario_noinj + the 36 uninjured L432 cells) weeks JSON byte-identical V227 vs CF: ' + same + '/' + tot + (diffs.length ? ' | ' + diffs.join(', ') : ''));
// _stripCapCue identity on non-cue details, HALF_MANNY + L9
{ let n = 0, fs2 = 0; const X = vm('CF'); for(const ck of Object.keys(L9)){ (ck in base9 ? base9[ck] : cards('V227', L9[ck]).m).forEach(c => { if(c.det.endsWith(OLD) || c.det.endsWith(NEW)) return; n++; X.ctx.__d = c.det; if(E(X, '_stripCapCue(__d)') !== c.det) fs2++; }); }
  P('   CF _stripCapCue on non-cue details (L9 incl. HALF_MANNY): false strips ' + fs2 + '/' + n); }
fs.writeFileSync(F('v228_caprpe_cf.summary.txt'), out.join('\n') + '\n');
console.log('DONE lines ' + out.length);
