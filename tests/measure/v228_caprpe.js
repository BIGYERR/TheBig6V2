// v228_caprpe.js — MEASURE (read-only). P-CAPRPE before-picture on V227.
//   SCR=<scratch> PART=<src|lattice|swap|persist|supp|all> node tests/measure/v228_caprpe.js
// Oracles: the cap contract typed from injuryPlan's own authoring comment ("cap: patterns clamped to RPE 7") and its
// cap table typed by hand from source (cross-checked at runtime, mismatches printed); the RPE card text (index.html:1114,
// "RPE 8 ≈ 2 reps left in the tank"); counterfactual trees made by anchor-asserted surgery on a scratch copy:
//   CFN  cue append neutralised          (does an RPE come from the cue?)
//   CFS  _stripCapCue made the identity  (V226-style carry of the cue through a swap)
//   CFL  INJ_CAP_CUE literal changed     (persistence: what meets an old stored literal)
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures, progDigest } = require(path.join(ROOT, 'tests', 'harness.js'));
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const PART = process.env.PART || 'all';
const F = n => path.join(SCR, n), HEAD = path.join(ROOT, 'index.html');
const CUE = ' — hold RPE 7, two in the tank', NEWLIT = ' — hold RPE 7, three in the tank';
const START = '2026-08-24', CLOCK = '2026-09-24';
const SRC = fs.readFileSync(HEAD, 'utf8');
function surg(src, a, b){ const n = src.split(a).length - 1; if(n !== 1) throw new Error('anchor count ' + n + ': ' + a.slice(0, 70)); return src.replace(a, b); }
const TREES = { V227:HEAD, CFN:F('cfn_227.html'), CFS:F('cfs_227.html'), CFL:F('cfl_227.html') };
for(const t of ['CFN','CFS','CFL']) try { fs.unlinkSync(TREES[t]); } catch(e){}
fs.writeFileSync(TREES.CFN, surg(SRC, 'if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail+INJ_CAP_CUE;', 'if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail;'));
fs.writeFileSync(TREES.CFS, surg(SRC, "function _stripCapCue(d){ return (typeof d==='string'&&d.endsWith(INJ_CAP_CUE))?d.slice(0,d.length-INJ_CAP_CUE.length):d; }", 'function _stripCapCue(d){ return d; }'));
fs.writeFileSync(TREES.CFL, surg(SRC, "const INJ_CAP_CUE=' — hold RPE 7, two in the tank';", "const INJ_CAP_CUE='" + NEWLIT + "';"));
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength',
  experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135, squat:155, deadlift:185, seed:76308 };
const clone = x => JSON.parse(JSON.stringify(x));
const withInj = inj => { const c = clone(MARIO); if(inj) c.injury = inj; return c; };
const CFGS = { mario:withInj({ region:'knee', tier:'workaround' }), manny:clone(fixtures.HALF_MANNY), mario_noinj:withInj(null),
  knee_protect:withInj({ region:'knee', tier:'protect' }), ankle_wa:withInj({ region:'ankle', tier:'workaround' }), hip_wa:withInj({ region:'hip', tier:'workaround' }),
  lowback_wa:withInj({ region:'lowback', tier:'workaround' }), shoulder_wa:withInj({ region:'shoulder', tier:'workaround' }), elbow_wa:withInj({ region:'elbow', tier:'workaround' }) };
// cap table typed by hand from injuryPlan (index.html ~:7950-8080)
const CAP = { knee:{ workaround:['squat','lunge','leg_iso'], protect:['hinge'] }, ankle:{ workaround:['squat','lunge'], protect:['squat'] },
  hip:{ workaround:['hinge','lunge','hip_ext','squat'], protect:['squat'] }, lowback:{ workaround:['hinge','squat','row','hip_ext'], protect:['squat','hip_ext'] },
  shoulder:{ workaround:['hpress','vpress','delt_iso'], protect:[] }, elbow:{ workaround:['hpress','tri_iso','bi_iso','row','vpull'], protect:['row','vpull'] } };
const capOf = cfg => cfg.injury ? (CAP[cfg.injury.region][cfg.injury.tier] || []) : [];
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const E = (IA, c) => IA.eval(c);
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
const out = []; const P = s => { out.push(s); console.log(s); };
// sweeps called on `weeks` inside buildProgram, harvested from source, wrapped for last-writer attribution
const BP = SRC.slice(SRC.indexOf('function buildProgram(cfg){'), SRC.indexOf('function buildProgram(cfg){') + 60000);
const BPend = BP.indexOf('\nfunction ', 10); const BPbody = BP.slice(0, BPend);
const SWEEPS = [...new Set([...SRC.matchAll(/^function ([A-Za-z_]\w*)\(weeks\b/gm)].map(m => m[1]))]; // every top-level pass whose first parameter is the week grid
const WRAP = "globalThis.__LW={};(function(){var L=" + JSON.stringify(SWEEPS) + ";L.forEach(function(n){var o=globalThis[n];if(typeof o!=='function')return;globalThis[n]=function(weeks){var b={};Object.keys(weeks||{}).forEach(function(w){Object.keys(weeks[w]||{}).forEach(function(d){var dy=weeks[w][d];((dy&&dy.sections)||[]).forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(it)b[w+'|'+d+'|'+si+'|'+ii]={det:it.detail,name:it.name};});});});});var r=o.apply(this,arguments);Object.keys(weeks||{}).forEach(function(w){Object.keys(weeks[w]||{}).forEach(function(d){var dy=weeks[w][d];((dy&&dy.sections)||[]).forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it)return;var k=w+'|'+d+'|'+si+'|'+ii;if(k in b&&(b[k].det!==it.detail||b[k].name!==it.name))__LW[k]={by:n,from:b[k].det,fromName:b[k].name};});});});});return r;};});})();";
const VMS = {};
function vm(tree){ if(VMS[tree]) return VMS[tree]; const X = load(TREES[tree]); pin(X); E(X, WRAP); return (VMS[tree] = X); }
const PATC = {}; const pat = n => (n in PATC) ? PATC[n] : (PATC[n] = vm('V227').eval('_pattern(' + JSON.stringify(n) + ')') || '-');
const RFC = {}; const repFloor = n => (n in RFC) ? RFC[n] : (RFC[n] = JSON.parse(vm('V227').eval('JSON.stringify((typeof _repFloor==="function")?_repFloor(' + JSON.stringify(n) + '):null)')));
const POWER = /fast and crisp|crisp and explosive|explosive|max intent/i;
function shape(det){
  const d = det.endsWith(CUE) ? det.slice(0, -CUE.length) : det;
  if(det.endsWith(CUE)) return 'CUE+' + (POWER.test(d) ? 'power' : /\b(sec|min|s each|yd|yard|m)\b|\d+s\b|:\d\d/.test(d) ? 'time/hold' : /^\d+\s*[×x]\s*[\d–]+( each)?$/.test(d) ? 'fixed-rep' : /^\d+\s*sets\b/.test(d) ? 'sets' : 'other');
  if(/^\d+ sets — RPE (\d)/.test(d)) return 'bwsets';
  if(/@ RPE/.test(d)) return 'grammar@';
  if(/— RPE [\d.]+(–[\d.]+)?/.test(d)) return /RPE [\d.]+–[\d.]+/.test(d) ? 'wave-range' : 'wave-single';
  if(/RPE/.test(d)) return /RPE [\d.]+–[\d.]+/.test(d) ? 'other-range' : 'other-RPE';
  if(/\brpe\b/i.test(d)) return 'lowercase-rpe';
  if(/reserve|tank|RIR/i.test(d)) return 'RIR-words-noRPE';
  if(/%/.test(d)) return 'percent';
  if(POWER.test(d)) return 'power-noRPE';
  return 'no-effort';
}
const rpeMax = det => { const v = [...det.matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/gi)].map(m => Math.max(+m[1], m[2] ? +m[2] : 0)); return v.length ? Math.max(...v) : null; };
function cards(tree, cfg){
  const X = vm(tree); E(X, 'globalThis.__LW={};'); const p = X.buildProgram(clone(cfg)); const LW = JSON.parse(E(X, 'JSON.stringify(__LW)'));
  const capP = JSON.parse(E(X, '(function(){var P=injuryPlan(' + JSON.stringify(cfg) + ');return JSON.stringify(P?Array.from(P.cap):[]);})()'));
  const cap = capOf(cfg); const capMis = JSON.stringify([...capP].sort()) !== JSON.stringify([...cap].sort());
  const m = [];
  Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { const dy = p.weeks[w][d]; ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => {
    if(!it) return; const n = clean(it.name), det = it.detail || ''; const pt = pat(n); const lw = LW[w + '|' + d + '|' + si + '|' + ii];
    m.push({ k:w + '|' + d + '|' + si + '|' + ii, w:+w, d, si, ii, label:clean(s.label), n, det, pt, capped:cap.includes(pt), cued:det.endsWith(CUE), sh:shape(det), rm:rpeMax(det),
      power:POWER.test(det) || /^Power/.test(clean(s.label)), lw:lw ? lw.by : 'build-loop', lwFrom:lw ? lw.from : null, lwName:lw ? clean(lw.fromName) : null, core:!!s.core, hip:!!s.hip }); })); }));
  return { m, p, capMis, capP };
}
// ─────────────────────────────────────────────────────────── PART src
if(PART === 'src' || PART === 'all'){
  P('=== SRC scan of index.html (V227 ' + (SRC.match(/ia-version" content="(\d+)"/) || [])[1] + '), every hit, code vs comment');
  const L = SRC.split('\n');
  const pats = { 'in the tank':/in the tank/, 'hold RPE':/hold RPE/i, 'two in the tank':/two in the tank/, 'INJ_CAP_CUE':/INJ_CAP_CUE/, '_stripCapCue':/_stripCapCue/,
    '_bwSetsFromDetail':/_bwSetsFromDetail/, 'regex reading RPE from a detail':/\/[^/\n]*\b[Rr][Pp][Ee]\\s[^/\n]*\/|\/RPE\/\.test|\/rpe\\s/, '_rxShort':/_rxShort/, 'in reserve':/in reserve/,
    'localStorage.setItem':/localStorage\.setItem/, 'stored rx.d (undo)':/rx\.|\.rx\b|p\.d\b/ };
  for(const [k, re] of Object.entries(pats)){ const hits = []; L.forEach((l, i) => { if(re.test(l)) hits.push((i + 1) + (/^\s*\/\//.test(l) ? 'c' : '')); });
    P('  ' + k.padEnd(34) + ' hits ' + hits.length + ' (code ' + hits.filter(h => !h.endsWith('c')).length + '): ' + hits.join(',')); }
  P('  RPE card :1114 ' + JSON.stringify((L[1113].match(/<div class="rpe-info-note">(.*?)<\/div>/) || [])[1]));
  P('  rpeFromWave :8223-8224 rir = round(10 - rpe) -> RPE 7 => ' + Math.round(10 - 7) + ' in reserve, RPE 8 => ' + Math.round(10 - 8) + ' (date/arith oracle)');
  P('  cue append predicate :' + (L.findIndex(l => l.includes('detail=detail+INJ_CAP_CUE')) + 1) + ' ' + L.find(l => l.includes('detail=detail+INJ_CAP_CUE')).trim());
  P('  buildProgram sweeps on weeks (wrapped for last-writer): ' + SWEEPS.join(', '));
  // stores: does any persisted object carry an item detail
  const saveFns = ['savePrograms','saveDayHist','saveSwaps','saveExWeights','saveExWeightsFor','saveLogs','saveDayEdits','saveCompleted'];
  saveFns.forEach(fn => { const sites = []; L.forEach((l, i) => { if(new RegExp('\\b' + fn + '\\(').test(l) && !/^function /.test(l.trim())) sites.push(i + 1); }); P('  writer ' + fn.padEnd(18) + ' call sites ' + sites.length + ': ' + sites.join(',')); });
}
// ─────────────────────────────────────────────────────────── PART lattice
const allRows = {};
if(PART === 'lattice' || PART === 'all' || PART === 'swap'){
  P('\n=== LATTICE 9 configs (seed 76308, clock ' + CLOCK + '), V227 and CFN (cue append neutralised)');
  for(const ck of Object.keys(CFGS)){
    const A = cards('V227', CFGS[ck]), C = cards('CFN', CFGS[ck]); const cm = new Map(C.m.map(x => [x.k, x])); allRows[ck] = A;
    const rows = A.m, capd = rows.filter(r => r.capped);
    const s1 = progDigest(vm('V227').buildProgram(clone(CFGS[ck]))), s2 = progDigest(load(HEAD).buildProgram(clone(CFGS[ck])));
    P('-- ' + ck.padEnd(12) + ' injury ' + (CFGS[ck].injury ? CFGS[ck].injury.region + '/' + CFGS[ck].injury.tier : 'none') + ' | cap ' + JSON.stringify(capOf(CFGS[ck])) + (A.capMis ? ' MISMATCH engine ' + JSON.stringify(A.capP) : ' (engine agrees)') + ' | self-digest ' + (s1 === s2 ? 'equal' : 'MISMATCH (wrapper moves output?) ' + s1 + '/' + s2));
    P('   cards ' + rows.length + ' | capped ' + capd.length + ' | cued ' + rows.filter(r => r.cued).length + ' (on uncapped final pattern ' + rows.filter(r => r.cued && !r.capped).length + ')');
    P('   (c) capped shapes: ' + fmt(tally(capd, r => r.sh)));
    const hi = capd.filter(r => r.rm !== null && r.rm > 7);
    P('   (a) capped naming RPE > 7: ' + hi.length + '/' + capd.length + ' | by shape ' + fmt(tally(hi, r => r.sh + ' ' + r.rm)) + ' | by pattern ' + fmt(tally(hi, r => r.pt)) + ' | by last writer ' + fmt(tally(hi, r => r.lw)) + ' | by week ' + fmt(tally(hi, r => 'W' + String(r.w).padStart(2, '0'))));
    hi.slice(0, 4).forEach(r => P('      e.g. W' + r.w + ' ' + r.d + ' ' + r.label + ' :: ' + r.n + ' [' + r.pt + '] ' + JSON.stringify(r.det) + ' lastWriter ' + r.lw + (r.lwFrom ? ' from ' + JSON.stringify(r.lwFrom) : '')));
    const pw = capd.filter(r => r.power); P('   (b) capped power: ' + pw.length + ' | cued ' + pw.filter(r => r.cued).length + ' | ' + fmt(tally(pw, r => r.n + ' ' + (r.cued ? 'CUED' : 'nocue'))));
    pw.filter(r => r.cued).slice(0, 2).forEach(r => P('      e.g. W' + r.w + ' ' + r.d + ' ' + r.n + ' ' + JSON.stringify(r.det)));
    const nCap = rows.filter(r => !r.capped && r.rm !== null);
    // cue-sourced RPE: final cards whose RPE differs with the append neutralised
    const diff = rows.filter(r => { const c = cm.get(r.k); return c && c.n === r.n && c.det !== r.det; });
    P('   CFN diff (cards whose final detail moves when the append is neutralised): ' + diff.length + ' | ' + fmt(tally(diff, r => (r.cued ? 'cue dropped' : 'RPE ' + r.rm + '->' + cm.get(r.k).rm + ' ' + r.sh + '->' + cm.get(r.k).sh + ' via ' + r.lw))));
    const bw = capd.filter(r => r.sh === 'bwsets');
    P('   (d) capped bwsets: ' + bw.length + ' | V227 RPE ' + fmt(tally(bw, r => r.rm)) + ' | (V227,CFN) ' + fmt(tally(bw, r => r.rm + '/' + (cm.get(r.k) ? cm.get(r.k).rm : '-'))) + ' | writer ' + fmt(tally(bw, r => r.lw)));
    bw.filter(r => r.rm === 7).forEach(r => { const c = cm.get(r.k); const src = (r.lwFrom || ''); const why = c && c.rm === 8 ? 'CUE' : r.w <= 4 && CFGS[ck].experience === 'beginner' ? 'BEGINNER-FLOOR' : /rpe\s*7/i.test(src) && !src.endsWith(CUE) ? 'SOURCE-TEXT-RPE7' : CFGS[ck].liftingFocus === 'support_prevention' ? 'PREV-CEILING' : 'OTHER';
      r.why = why; P('      RPE7 W' + r.w + ' ' + r.d + ' [' + r.si + '][' + r.ii + '] ' + r.label + ' :: ' + r.n + ' [' + r.pt + '] input to ' + r.lw + ' ' + JSON.stringify(src) + ' | CFN ' + JSON.stringify(c && c.det) + ' => ' + why); });
  }
  const inj = Object.keys(CFGS).filter(ck => CFGS[ck].injury), T = inj.flatMap(ck => allRows[ck].m.map(r => ({ ...r, ck })));
  const capd = T.filter(r => r.capped);
  P('\n   TOTAL injured configs ' + inj.length + ': cards ' + T.length + ' | capped ' + capd.length + ' | cued ' + capd.filter(r => r.cued).length + ' | capped RPE>7 ' + capd.filter(r => r.rm > 7).length + ' | capped power ' + capd.filter(r => r.power).length + ' cued ' + capd.filter(r => r.power && r.cued).length);
  const p10 = ['mario','ankle_wa','lowback_wa','hip_wa','elbow_wa','shoulder_wa'].flatMap(ck => allRows[ck].m.filter(r => r.capped && r.sh === 'bwsets' && r.rm === 7).map(r => ({ ...r, ck })));
  P('   (d) P10 split on V227 (6 workaround configs): RPE-7 capped bwsets ' + p10.length + ' | ' + fmt(tally(p10, r => r.why + (r.w >= 5 ? ' W5+' : ' W1-4') + ' ' + r.ck)));
  const manny = allRows.manny.m; P('   (5) HALF_MANNY: injury ' + JSON.stringify(CFGS.manny.injury || null) + ' | cards ' + manny.length + ' | cued ' + manny.filter(r => r.cued).length + ' | containing "tank" ' + manny.filter(r => /tank/.test(r.det)).length + ' | "hold RPE" ' + manny.filter(r => /hold RPE/.test(r.det)).length + ' | V227 digest ' + progDigest(load(HEAD).buildProgram(clone(CFGS.manny))) + ' | CFN digest ' + progDigest(load(TREES.CFN).buildProgram(clone(CFGS.manny))) + ' | CFL digest ' + progDigest(load(TREES.CFL).buildProgram(clone(CFGS.manny))));
}
// ─────────────────────────────────────────────────────────── PART swap (class iii, live / build / boot)
if(PART === 'swap' || PART === 'all'){
  P('\n=== (e) class (iii): cued donor -> capped target whose final form is the bodyweight-sets form. live (applySwapChoice) / boot (refreshProgram replay) / build (exSwapPrefs). V227 vs CFS (strip identity = V226 carry)');
  const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};globalThis.__T=[];showToast=function(m){__T.push(String(m));};";
  const res = []; const tot = { pairs:0, cappedT:0 };
  for(const ck of Object.keys(CFGS).filter(c => CFGS[c].injury)){
    const cfg = CFGS[ck]; const base = allRows[ck].m; const cued = base.filter(r => r.cued);
    const stored = (() => { const X = load(HEAD); pin(X); const p = X.buildProgram(clone(cfg)); const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) }); return JSON.stringify(st); })();
    const X = {}; for(const t of ['V227','CFS']){ X[t] = load(TREES[t]); pin(X[t]); E(X[t], HELP); X[t].localStorage.clear(); X[t].ctx.__SP = JSON.parse(stored); E(X[t], "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
    let pairs = 0;
    for(const c of cued){
      E(X.V227, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';"); X.V227.ctx.__D = E(X.V227, 'activeProg.weeks[' + c.w + '].' + c.d);
      const _lv = X.V227.ctx.__D && X.V227.ctx.__D.sections[c.si] && X.V227.ctx.__D.sections[c.si].items[c.ii]; const live = _lv ? { name:String(_lv.name), detail:String(_lv.detail) } : null; if(!live || clean(live.name) !== c.n) { res.push({ ck, skip:'slot-moved' }); continue; }
      const tg = Array.from(E(X.V227, '__cands(__D,' + c.w + ',' + JSON.stringify(live.name) + ')'));
      for(const to of tg){ pairs++; const tp = pat(to), capT = capOf(cfg).includes(tp), rf = repFloor(to); if(!capT) continue; tot.cappedT++;
        const r = { ck, w:c.w, d:c.d, k:c.k, from:c.n, donor:live.detail, to, tp, unload:!!(rf && rf[1] === 0) };
        for(const t of ['V227','CFS']){ const Y = X[t]; E(Y, 'currentWeek=' + c.w + ";currentDayKey='" + c.d + "';");
          const snap = E(Y, 'JSON.stringify(activeProg.weeks[' + c.w + '].' + c.d + ')');
          Y.ctx.__c = { secIdx:c.si, itemIdx:c.ii, name:live.name, detail:live.detail }; Y.ctx.__to = to;
          try { E(Y, '_swapCtx=__c;applySwapChoice(__to);'); r[t + 'live'] = E(Y, 'activeProg.weeks[' + c.w + '].' + c.d + '.sections[' + c.si + '].items[' + c.ii + '].detail'); } catch(e){ r[t + 'live'] = 'CRASH ' + e.message; }
          if(r.unload){ // boot replay of the same record
            const sw = E(Y, "localStorage.getItem('ia_swaps_PM')");
            const Z = load(TREES[t]); pin(Z); Z.localStorage.clear(); Z.ctx.__SP = JSON.parse(stored); E(Z, 'savePrograms([__SP]);'); if(sw) Z.localStorage.setItem('ia_swaps_PM', sw);
            try { const bd = E(Z, "(function(){var p=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));var it=p.weeks[" + c.w + "]." + c.d + ".sections[" + c.si + "].items[" + c.ii + "];return it?it.name+' :: '+it.detail:'(none)';})()"); r[t + 'boot'] = bd.split(' :: ')[1]; r[t + 'bootName'] = bd.split(' :: ')[0]; r[t + 'sw'] = !!sw; r[t + 'swRaw'] = sw; r[t + 'bootDay'] = E(Z, "(function(){var p=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));return JSON.stringify(p.weeks[" + c.w + "]." + c.d + ".sections.map(function(s){return (s.items||[]).map(function(i){return i.name;});}));})()"); } catch(e){ r[t + 'boot'] = 'CRASH ' + e.message; } }
          Y.ctx.__S = JSON.parse(snap); E(Y, 'activeProg.weeks[' + c.w + '].' + c.d + "=__S;localStorage.removeItem('ia_swaps_PM');localStorage.removeItem('ia_swapct_PM');"); }
        res.push(r); }
    }
    tot.pairs += pairs;
  }
  const R = res.filter(r => !r.skip), U = R.filter(r => r.unload);
  P('   cued donor occurrences x sheet candidates: ' + tot.pairs + ' pairs | capped targets ' + R.length + ' (slot-moved skips ' + res.filter(r => r.skip).length + ') | capped unloadable targets ' + U.length);
  const f = s => (s || '').startsWith('CRASH') ? 'CRASH' : /^\d+ sets — RPE (\d)/.test(s || '') ? 'bwsets RPE ' + /^\d+ sets — RPE (\d)/.exec(s)[1] : (s || '').endsWith(CUE) ? 'CUED' : /RPE/.test(s || '') ? 'RPE ' + rpeMax(s) : 'no-RPE';
  P('   capped targets, live V227: ' + fmt(tally(R, r => f(r.V227live))) + ' || live CFS (V226 carry): ' + fmt(tally(R, r => f(r.CFSlive))));
  P('   capped UNLOADABLE targets: live V227 ' + fmt(tally(U, r => f(r.V227live))) + ' | live CFS ' + fmt(tally(U, r => f(r.CFSlive))) + ' | boot V227 ' + fmt(tally(U, r => f(r.V227boot))) + ' | boot CFS ' + fmt(tally(U, r => f(r.CFSboot))));
  P('   boot detail: record stored ' + U.filter(r => r.V227sw).length + '/' + U.length + ' | target name at the slot after boot ' + U.filter(r => clean(r.V227bootName) === clean(r.to)).length + '/' + U.length + ' | by week (name landed / n) ' + fmt(tally(U, r => 'W' + r.w + ' ' + (clean(r.V227bootName) === clean(r.to) ? 'landed' : 'NOT:' + clean(r.V227bootName)))));
  const UL = U.filter(r => clean(r.V227bootName) === clean(r.to)); P('   boot, name landed only: V227 ' + fmt(tally(UL, r => f(r.V227boot))) + ' | CFS ' + fmt(tally(UL, r => f(r.CFSboot))) + ' | live==boot ' + UL.filter(r => r.V227live === r.V227boot).length + '/' + UL.length);
  P('   boot landed by week ' + fmt(tally(U, r => 'W' + r.w + ' ' + (clean(r.V227bootName) === clean(r.to) ? 'landed' : 'not'))) + ' | CFS landed ' + U.filter(r => clean(r.CFSbootName) === clean(r.to)).length);
  U.filter(r => clean(r.V227bootName) !== clean(r.to)).slice(0, 2).forEach(r => P('      NOT-landed ' + r.ck + ' W' + r.w + ' ' + r.d + ' k ' + r.k + ' ' + r.from + ' -> ' + r.to + ' | store ' + r.V227swRaw + ' | boot day names ' + r.V227bootDay));
  UL.forEach(r => P('      landed ' + r.ck + ' W' + r.w + ' ' + r.d + ' ' + r.from + ' -> ' + r.to + ' | V227 live ' + JSON.stringify(r.V227live) + ' boot ' + JSON.stringify(r.V227boot) + ' | CFS live ' + JSON.stringify(r.CFSlive) + ' boot ' + clean(r.CFSbootName) + ' ' + JSON.stringify(r.CFSboot) + ' sw ' + r.CFSsw));
  const iii = U.filter(r => /RPE 8/.test(f(r.V227live)) && /RPE 7/.test(f(r.CFSlive))); const iiiB = U.filter(r => /RPE 8/.test(f(r.V227boot)) && /RPE 7/.test(f(r.CFSboot)));
  P('   CLASS (iii) live: ' + iii.length + '/' + U.length + ' | boot: ' + iiiB.length + '/' + U.length + ' | live!=boot on V227 ' + U.filter(r => r.V227live !== r.V227boot).length + ' | by config ' + fmt(tally(iii, r => r.ck)) + ' | by target ' + fmt(tally(iii, r => r.to + '[' + r.tp + ']')) + ' | by week ' + fmt(tally(iii, r => 'W' + r.w)));
  iii.slice(0, 3).forEach(r => P('      e.g. ' + r.ck + ' W' + r.w + ' ' + r.d + ' ' + r.from + ' ' + JSON.stringify(r.donor) + ' -> ' + r.to + ' | V227 ' + JSON.stringify(r.V227live) + ' | CFS ' + JSON.stringify(r.CFSlive)));
  // build path: exSwapPrefs
  let bpairs = 0; const BR = [];
  for(const ck of Object.keys(CFGS).filter(c => CFGS[c].injury)){
    const cued = allRows[ck].m.filter(r => r.cued); const seenPair = new Set();
    for(const r of U.filter(x => x.ck === ck)){ const key = r.from + '>' + r.to; if(seenPair.has(key)) continue; seenPair.add(key); bpairs++;
      const cfg = clone(CFGS[ck]); cfg.exSwapPrefs = { [r.from]:r.to };
      const A = cards('V227', cfg), S = cards('CFS', cfg); const sm = new Map(S.m.map(x => [x.k, x]));
      cued.filter(c => c.n === r.from).forEach(c => { const a = A.m.find(x => x.k === c.k), s = sm.get(c.k); if(a && a.n === r.to) BR.push({ ck, w:c.w, to:r.to, a:a.det, s:s && s.det }); }); } }
  const bi = BR.filter(x => /RPE 8/.test(f(x.a)) && /RPE 7/.test(f(x.s)));
  P('   BUILD path (exSwapPrefs, one pref per distinct cued-donor -> capped-unloadable pair): prefs ' + bpairs + ' | landed cards ' + BR.length + ' | V227 ' + fmt(tally(BR, x => f(x.a))) + ' | CFS ' + fmt(tally(BR, x => f(x.s))) + ' | CLASS (iii) ' + bi.length + '/' + BR.length + ' by config ' + fmt(tally(bi, x => x.ck)));
}
// ─────────────────────────────────────────────────────────── PART persist (literal change meets stored strings)
if(PART === 'persist' || PART === 'all'){
  P('\n=== PERSIST: grid stored by V227 (old literal), booted on CFL (literal changed to "' + NEWLIT + '"); ia_hist_ snapshots for every W1-W2 day; one live swap per cued card in W1-W4 (first candidate)');
  const HELP = "globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};globalThis.__T=[];showToast=function(m){__T.push(String(m));};";
  const agg = { old:{}, sw:[] };
  for(const ck of Object.keys(CFGS).filter(c => CFGS[c].injury)){
    const cfg = CFGS[ck]; const X0 = load(HEAD); pin(X0); const p = X0.buildProgram(clone(cfg)); const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) });
    const hist = {}; [1, 2].forEach(w => Object.keys(p.weeks[w] || {}).forEach(d => { if(p.weeks[w][d] && p.weeks[w][d].sections) hist['w' + w + '_' + d] = p.weeks[w][d]; }));
    for(const mode of ['grid-only','grid+hist']){ for(const t of ['V227','CFL']){
      const Y = load(TREES[t]); pin(Y); E(Y, HELP); Y.localStorage.clear(); Y.ctx.__SP = clone(st); E(Y, 'savePrograms([__SP]);'); if(mode === 'grid+hist') Y.localStorage.setItem('ia_hist_PM', JSON.stringify(hist));
      E(Y, "activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");
      const B = JSON.parse(E(Y, 'JSON.stringify(activeProg.weeks)')); const byW = {}; let oldN = 0, newN = 0;
      Object.keys(B).forEach(w => Object.keys(B[w]).forEach(d => ((B[w][d] && B[w][d].sections) || []).forEach(s => (s.items || []).forEach(it => { if(!it || !it.detail) return; if(it.detail.includes(CUE)) { oldN++; byW['W' + w] = (byW['W' + w] || 0) + 1; } if(it.detail.includes(NEWLIT)) newN++; }))));
      agg.old[ck + ' ' + mode + ' ' + t] = 'old-literal ' + oldN + ' new-literal ' + newN + (t === 'CFL' ? ' | old by week ' + fmt(byW) : '');
      if(t === 'CFL'){ // live swap on cards still carrying the old literal in W1-W4
        Object.keys(B).filter(w => +w <= 4).forEach(w => Object.keys(B[w]).forEach(d => ((B[w][d] && B[w][d].sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => {
          if(!it || !it.detail || !it.detail.endsWith(CUE)) return;
          E(Y, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); Y.ctx.__D = E(Y, 'activeProg.weeks[' + w + '].' + d); const tg = Array.from(E(Y, '__cands(__D,' + w + ',' + JSON.stringify(it.name) + ')')); if(!tg.length) return;
          const snap = E(Y, 'JSON.stringify(activeProg.weeks[' + w + '].' + d + ')'); Y.ctx.__c = { secIdx:si, itemIdx:ii, name:String(it.name), detail:String(it.detail) }; Y.ctx.__to = tg[0];
          let o; try { E(Y, '_swapCtx=__c;applySwapChoice(__to);'); o = E(Y, 'activeProg.weeks[' + w + '].' + d + '.sections[' + si + '].items[' + ii + '].detail'); } catch(e){ o = 'CRASH ' + e.message; }
          const sw = E(Y, "localStorage.getItem('ia_swaps_PM')");
          let bo; { const Z = load(TREES.CFL); pin(Z); Z.localStorage.clear(); Z.ctx.__SP = clone(st); E(Z, 'savePrograms([__SP]);'); if(mode === 'grid+hist') Z.localStorage.setItem('ia_hist_PM', JSON.stringify(hist)); if(sw) Z.localStorage.setItem('ia_swaps_PM', sw);
            try { bo = E(Z, "(function(){var p=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));var it=p.weeks[" + w + "]." + d + ".sections[" + si + "].items[" + ii + "];return it?it.name+' :: '+it.detail:'(none)';})()"); } catch(e){ bo = 'CRASH ' + e.message; } }
          // undo: does the stored rx carry the old literal back
          let ud; try { Y.ctx.__fr = it.name; E(Y, 'undoSwap(__fr);'); ud = E(Y, 'activeProg.weeks[' + w + '].' + d + '.sections[' + si + '].items[' + ii + '].detail'); } catch(e){ ud = 'CRASH ' + e.message; }
          Y.ctx.__S = JSON.parse(snap); E(Y, 'activeProg.weeks[' + w + '].' + d + "=__S;localStorage.removeItem('ia_swaps_PM');localStorage.removeItem('ia_swapct_PM');");
          agg.sw.push({ ck, mode, w:+w, d, from:clean(it.name), to:tg[0], tp:pat(tg[0]), capT:capOf(cfg).includes(pat(tg[0])), o, bo, ud, histDay:!!hist['w' + w + '_' + d] && mode === 'grid+hist', rxOld:(sw || '').includes(CUE) }); }))));
      } } }
  }
  Object.keys(agg.old).forEach(k => P('   ' + k.padEnd(34) + ' ' + agg.old[k]));
  const S = agg.sw; const g = o => (o || '').startsWith('CRASH') ? 'CRASH' : o.includes(CUE) ? 'OLD literal carried' : o.includes(NEWLIT) ? 'new literal' : /^\d+ sets — RPE (\d)/.test(o) ? 'bwsets RPE ' + /^\d+ sets — RPE (\d)/.exec(o)[1] : /RPE/.test(o) ? 'RPE ' + rpeMax(o) : 'no-RPE';
  P('   live swaps from an old-literal card on CFL: ' + S.length + ' | result ' + fmt(tally(S, x => g(x.o))) + ' | capped target ' + fmt(tally(S.filter(x => x.capT), x => g(x.o))) + ' | uncapped target ' + fmt(tally(S.filter(x => !x.capT), x => g(x.o))));
  P('   by mode/day-source: ' + fmt(tally(S, x => x.mode + (x.histDay ? ' hist-day' : ' grid-day') + ' ' + g(x.o))));
  P('   BOOT replay of that record on CFL: target landed ' + S.filter(x => (x.bo || '').startsWith(x.to + ' :: ')).length + '/' + S.length + ' | result ' + fmt(tally(S, x => (x.bo || '').startsWith(x.to + ' :: ') ? g(x.bo.split(' :: ')[1]) : 'not-landed (' + (x.histDay ? 'hist-day' : 'grid-day') + ')')));
  P('   swap store rx carrying the old literal ' + S.filter(x => x.rxOld).length + '/' + S.length + ' | undo restores old literal ' + S.filter(x => (x.ud || '').includes(CUE)).length + '/' + S.length);
  S.filter(x => g(x.o) === 'OLD literal carried').slice(0, 3).forEach(x => P('      e.g. ' + x.ck + ' W' + x.w + ' ' + x.d + ' ' + x.from + ' -> ' + x.to + ' [' + x.tp + '] ' + JSON.stringify(x.o)));
}
// ─────────────────────────────────────────────────────────── PART add (add-a-lift path: addedDetailFor -> _swapDetailFor, no strip, no filter)
if(PART === 'add' || PART === 'all'){
  P('\n=== ADD path: every addCandidates name on every W1-W6 training day, applyAddChoice, V227 vs CFN (cue append neutralised); 7 injured configs');
  const A = [];
  for(const ck of Object.keys(CFGS).filter(c => CFGS[c].injury)){
    const cfg = CFGS[ck]; const X0 = load(HEAD); pin(X0); const p = X0.buildProgram(clone(cfg)); const st = clone(p); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:clone(cfg) });
    const Y = {}; for(const t of ['V227','CFN']){ Y[t] = load(TREES[t]); pin(Y[t]); E(Y[t], "globalThis.__T=[];showToast=function(m){__T.push(String(m));};"); Y[t].localStorage.clear(); Y[t].ctx.__SP = clone(st); E(Y[t], "savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));"); }
    for(let w = 1; w <= 6; w++) for(const d of Object.keys(st.weeks[w] || {})){
      const day = st.weeks[w][d]; if(!day || !day.sections || !day.sections.length || (day.dot && day.dot !== 'lift' && !day.sections.some(s => (s.items || []).length))) continue;
      E(Y.V227, 'currentWeek=' + w + ";currentDayKey='" + d + "';");
      const raw = JSON.parse(E(Y.V227, 'JSON.stringify(addCandidates(_liveDay(),currentWeek,activeProg))'));
      const names = [...new Set((Array.isArray(raw) ? raw : Object.values(raw).flat()).map(x => typeof x === 'string' ? x : x && x.name).filter(Boolean))];
      for(const n of names){ const r = { ck, w, d, n, pt:pat(n), capped:capOf(cfg).includes(pat(n)) };
        for(const t of ['V227','CFN']){ const Z = Y[t]; E(Z, 'currentWeek=' + w + ";currentDayKey='" + d + "';"); const snap = E(Z, 'JSON.stringify(_liveDay())');
          Z.ctx.__n = n; try { r[t + 'donor'] = E(Z, 'addedDetailFor(_liveDay(),__n,currentWeek,activeProg)'); E(Z, 'applyAddChoice(__n);'); r[t] = E(Z, "(function(){var b=(_liveDay().sections||[]).filter(function(s){return s._added;})[0];var it=b&&b.items.filter(function(i){return i.name===__n;})[0];return it?it.detail:'(none)';})()"); r[t + 'store'] = E(Z, "localStorage.getItem('ia_edits_PM')") || ''; } catch(e){ r[t] = 'CRASH ' + e.message; }
          Z.ctx.__S = JSON.parse(snap); E(Z, 'activeProg.weeks[' + w + '].' + d + "=__S;localStorage.removeItem('ia_edits_PM');"); }
        A.push(r); } }
  }
  const g = o => (o || '').startsWith('CRASH') ? 'CRASH' : (o || '').endsWith(CUE) ? 'CUED' : /^\d+ sets — RPE (\d)/.test(o || '') ? 'bwsets ' + /^\d+ sets — RPE (\d)/.exec(o)[1] : /RPE/.test(o || '') ? 'RPE ' + rpeMax(o) : 'no-RPE';
  P('   adds ' + A.length + ' | crash ' + A.filter(r => g(r.V227) === 'CRASH').length + ' | capped added ' + A.filter(r => r.capped).length + ' | V227 capped result ' + fmt(tally(A.filter(r => r.capped), r => g(r.V227))) + ' | uncapped result ' + fmt(tally(A.filter(r => !r.capped), r => g(r.V227))));
  P('   cue on an UNCAPPED added movement (region-tier donor) ' + A.filter(r => !r.capped && g(r.V227) === 'CUED').length + '/' + A.filter(r => !r.capped).length + ' | capped added with no cue and no RPE ' + A.filter(r => r.capped && g(r.V227) === 'no-RPE').length + ' | capped added RPE>7 ' + A.filter(r => r.capped && rpeMax(r.V227 || '') > 7).length);
  const cueSrc = A.filter(r => r.capped && /bwsets 7/.test(g(r.V227)) && /bwsets 8/.test(g(r.CFN)));
  P('   capped added bwsets RPE 7 that read 8 with the cue off (the cue changes which donor addedDetailFor picks; see donor text): ' + cueSrc.length + '/' + A.filter(r => r.capped && /bwsets/.test(g(r.V227))).length + ' | by config ' + fmt(tally(cueSrc, r => r.ck)));
  const hi8 = A.filter(r => r.capped && rpeMax(r.V227 || '') > 7); P('   capped added RPE>7 by config ' + fmt(tally(hi8, r => r.ck)) + ' | by pattern ' + fmt(tally(hi8, r => r.pt)) + ' | by donor shape ' + fmt(tally(hi8, r => (r.V227donor || '').replace(/^\d+/, 'N').replace(/×\d+/, '×R'))) + ' | CFN same RPE ' + hi8.filter(r => rpeMax(r.CFN || '') === rpeMax(r.V227)).length + '/' + hi8.length);
  hi8.slice(0, 2).forEach(r => P('      e.g. capped RPE8 add ' + r.ck + ' W' + r.w + ' ' + r.d + ' + ' + r.n + ' [' + r.pt + '] donor ' + JSON.stringify(r.V227donor) + ' -> ' + JSON.stringify(r.V227)));
  P('   ia_edits_ add.detail stores the cue literal: ' + A.filter(r => r.V227store.includes(CUE)).length + '/' + A.length + ' adds');
  A.filter(r => !r.capped && g(r.V227) === 'CUED').slice(0, 3).forEach(r => P('      e.g. uncapped cued ' + r.ck + ' W' + r.w + ' ' + r.d + ' + ' + r.n + ' [' + r.pt + '] ' + JSON.stringify(r.V227)));
  A.filter(r => r.capped && g(r.V227) === 'no-RPE').slice(0, 3).forEach(r => P('      e.g. capped no-cue ' + r.ck + ' W' + r.w + ' ' + r.d + ' + ' + r.n + ' [' + r.pt + '] ' + JSON.stringify(r.V227)));
  cueSrc.slice(0, 2).forEach(r => P('      e.g. cue-read ' + r.ck + ' W' + r.w + ' ' + r.d + ' + ' + r.n + ' [' + r.pt + '] donor ' + JSON.stringify(r.V227donor) + ' -> ' + JSON.stringify(r.V227) + ' | CFN ' + JSON.stringify(r.CFN)));
}
// ─────────────────────────────────────────────────────────── PART supp (wider lattice)
if(PART === 'supp' || PART === 'all'){
  const REG = ['knee','ankle','hip','lowback','shoulder','elbow'], TIER = ['workaround','protect'], EQ = ['commercial','crossfit','home_full','bodyweight'], EXP = ['beginner','intermediate','advanced'], FOC = ['support_strength','support_athletic','support_prevention'];
  P('\n=== SUPP lattice: ' + REG.length + ' regions x ' + TIER.length + ' tiers x ' + EQ.length + ' equipment x ' + EXP.length + ' experience x ' + FOC.length + ' focus = ' + REG.length * TIER.length * EQ.length * EXP.length * FOC.length + ' builds per tree, seed 76308, mario base cfg; trees V227 and CFN');
  const T = []; let crash = 0;
  for(const r of REG) for(const t of TIER) for(const eq of EQ) for(const ex of EXP) for(const fo of FOC){
    const cfg = clone(MARIO); Object.assign(cfg, { injury:{ region:r, tier:t }, equipment:eq, experience:ex, liftingFocus:fo });
    try { const A = cards('V227', cfg), C = cards('CFN', cfg); const cm = new Map(C.m.map(x => [x.k, x]));
      A.m.forEach(x => { const c = cm.get(x.k); T.push({ r, t, eq, ex, fo, capped:x.capped, cued:x.cued, sh:x.sh, rm:x.rm, power:x.power, lw:x.lw, n:x.n, pt:x.pt, w:x.w, lwFrom:x.lwFrom, lwName:x.lwName, det:x.det, d:x.d, label:x.label, cfRm:c && c.n === x.n ? c.rm : null, cfSh:c && c.n === x.n ? c.sh : null }); }); }
    catch(e){ crash++; P('   CRASH ' + [r, t, eq, ex, fo].join('/') + ' ' + e.message); } }
  const capd = T.filter(x => x.capped);
  P('   builds crashed ' + crash + ' | cards ' + T.length + ' | capped ' + capd.length + ' | cued ' + capd.filter(x => x.cued).length + ' (cued on uncapped final pattern ' + T.filter(x => x.cued && !x.capped).length + ')');
  const hi = capd.filter(x => x.rm > 7);
  P('   (a) capped RPE>7: ' + hi.length + '/' + capd.length + ' | shape ' + fmt(tally(hi, x => x.sh + ' ' + x.rm)) + ' | writer ' + fmt(tally(hi, x => x.lw)));
  P('       by region/tier ' + fmt(tally(hi, x => x.r + '/' + x.t)) + ' | by eq ' + fmt(tally(hi, x => x.eq)) + ' | by exp ' + fmt(tally(hi, x => x.ex)) + ' | by focus ' + fmt(tally(hi, x => x.fo)) + ' | by pattern ' + fmt(tally(hi, x => x.pt)));
  P('       denominators capped per segment: eq ' + fmt(tally(capd, x => x.eq)) + ' | focus ' + fmt(tally(capd, x => x.fo)) + ' | exp ' + fmt(tally(capd, x => x.ex)));
  P('       (a) rename at last pass ' + fmt(tally(hi, x => x.lw + ' ' + (x.lwName && x.lwName !== x.n ? 'RENAMED ' + x.lwName + '[' + pat(x.lwName) + ',' + (CAP[x.r][x.t].includes(pat(x.lwName)) ? 'capped' : 'uncapped') + ']->' + x.n : 'same-name') + ' input ' + JSON.stringify((x.lwFrom || '').replace(/^\d+/, 'N')))));
  hi.filter(x => x.lw === 'build-loop').slice(0, 6).forEach(x => P('       build-loop RPE8 e.g. ' + [x.r, x.t, x.eq, x.ex, x.fo].join('/') + ' W' + x.w + ' ' + x.d + ' ' + x.label + ' :: ' + x.n + ' [' + x.pt + '] ' + JSON.stringify(x.det)));
  P('       build-loop RPE8 by label ' + fmt(tally(hi.filter(x => x.lw === 'build-loop'), x => x.label.replace(/ — .*/, '') + ' :: ' + x.n)));
  P('       RPE>7 by week ' + fmt(tally(hi, x => 'W' + String(x.w).padStart(2, '0'))) + ' | bodyweight capped by shape ' + fmt(tally(capd.filter(x => x.eq === 'bodyweight'), x => x.sh + (x.rm ? ' ' + x.rm : ''))));
  P('   all-card shapes (capped and uncapped, injured lattice) ' + fmt(tally(T, x => x.sh)));
  const unc = T.filter(x => x.cued && !x.capped);
  P('   cue on an UNCAPPED final pattern: ' + unc.length + '/' + T.filter(x => x.cued).length + ' cued | ' + fmt(tally(unc, x => x.lw + ' ' + (x.lwName || '?') + '->' + x.n + '[' + x.pt + '] ' + x.r + '/' + x.t)));
  const allPw = T.filter(x => x.power); P('   power census (all cards, injured lattice): ' + allPw.length + ' | cued ' + allPw.filter(x => x.cued).length + ' | capped ' + allPw.filter(x => x.capped).length + ' | by pattern ' + fmt(tally(allPw, x => x.pt)) + ' | by focus ' + fmt(tally(allPw, x => x.fo)));
  P('   power census by region/tier ' + fmt(tally(allPw, x => x.r + '/' + x.t)) + ' | names ' + fmt(tally(allPw, x => x.n + '[' + x.pt + ']')) + ' | hinge power on a hinge-capped plan ' + allPw.filter(x => x.pt === 'hinge' && CAP[x.r][x.t].includes('hinge')).length);
  const pw = capd.filter(x => x.power); P('   (b) capped power ' + pw.length + ' | cued ' + pw.filter(x => x.cued).length + ' | by region/tier ' + fmt(tally(pw.filter(x => x.cued), x => x.r + '/' + x.t)) + ' | movements ' + fmt(tally(pw.filter(x => x.cued), x => x.n)));
  P('   (c) capped shapes ' + fmt(tally(capd, x => x.sh)));
  P('       cued by region/tier ' + fmt(tally(capd.filter(x => x.cued), x => x.r + '/' + x.t)) + ' | by eq ' + fmt(tally(capd.filter(x => x.cued), x => x.eq)));
  const bw = capd.filter(x => x.sh === 'bwsets'); const cueSrc = bw.filter(x => x.rm === 7 && x.cfRm === 8);
  P('   (d) capped bwsets ' + bw.length + ' | RPE ' + fmt(tally(bw, x => x.rm)) + ' | RPE 7 only because of the cue (CFN reads 8): ' + cueSrc.length + '/' + bw.filter(x => x.rm === 7).length + ' | by writer ' + fmt(tally(cueSrc, x => x.lw)) + ' | by eq ' + fmt(tally(cueSrc, x => x.eq)) + ' | by focus ' + fmt(tally(cueSrc, x => x.fo)));
  P('       RPE 7 with cue off too, by writer/exp/focus: ' + fmt(tally(bw.filter(x => x.rm === 7 && x.cfRm === 7), x => x.lw + ' ' + x.ex + ' ' + x.fo + (x.w <= 4 ? ' W1-4' : ' W5+'))));
  P('       cue-off moved other capped cards: ' + fmt(tally(capd.filter(x => !x.cued && x.cfSh && (x.cfRm !== x.rm)), x => x.sh + ' ' + x.rm + '->' + x.cfRm + ' via ' + x.lw)));
}
fs.writeFileSync(F('v228_caprpe_' + PART + '.summary.txt'), out.join('\n') + '\n');
console.log('DONE lines ' + out.length);
