// v227_d190_p9p10.js — MEASURE (read-only). D190 RE-RULING 1 section D premises P9 and P10.
//   SCR=<scratch> node tests/measure/v227_d190_p9p10.js > tests/measure/v227_d190_p9p10.out.txt
// Needs base_v226.html, d190_226.html, u2_moved_cards.txt in SCR (v227_d190_premises.js, v227_d190_unknowns.js).
// P9 the 6 "neither" U2 cards: V226 / D190 / uninjured+same-pref, inside or outside (c2-ii)'s structural population
//    (same name, same slot (week, day, section index, item index) on the uninjured+pref build; pattern uncapped on the plan,
//    cap table typed from the ruling header); P.swapNames rename check. Then U2's method on ankle/wa.
// P10 native unloadable accessories on capped patterns, no pref, no swap: final detail on V226, D190 and a counterfactual
//    V226 copy with the cue append neutralised (CF), which isolates whether the 7 comes from the cue.
'use strict';
const path = require('path'), fs = require('fs');
const { load } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const CUE = ' — hold RPE 7, two in the tank', CLOCK = '2026-09-24', START = '2026-08-24';
const CAP = { knee:['squat','lunge','leg_iso'], ankle:['squat','lunge'], hip:['hinge','lunge','hip_ext','squat'], lowback:['hinge','squat','row','hip_ext'], shoulder:['hpress','vpress','delt_iso'], elbow:['hpress','tri_iso','bi_iso','row','vpull'] };
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const CKR = { mario:'knee', ankle_wa:'ankle', lowback_wa:'lowback', hip_wa:'hip', elbow_wa:'elbow', shoulder_wa:'shoulder' };
const cfgOf = (ck, pref) => { const c = JSON.parse(JSON.stringify(MARIO)); if(ck !== 'noinj') c.injury = { region:CKR[ck], tier:'workaround' }; if(pref) c.exSwapPrefs = pref; return c; };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const tally = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + 1; }); return m; };
const fmt = m => Object.keys(m).sort().map(k => k + ' ' + m[k]).join(' | ') || '(none)';
// CF tree: V226 with the cue append neutralised (anchor count 1)
{ const s = fs.readFileSync(F('base_v226.html'), 'utf8'); const a = "detail=detail+' — hold RPE 7, two in the tank';"; const n = s.split(a).length - 1; if(n !== 1) throw new Error('CF anchor count ' + n);
  try { fs.unlinkSync(F('cf_nocue_226.html')); } catch(e){} fs.writeFileSync(F('cf_nocue_226.html'), s.replace(a, 'detail=detail;')); }
const VM = {}; const vm = f => VM[f] || (VM[f] = (X => (pin(X), X))(load(F(f))));
const pat = n => vm('base_v226.html').eval('_pattern(' + JSON.stringify(n) + ')') || '-';
const cards = (f, cfg) => { const p = vm(f).buildProgram(JSON.parse(JSON.stringify(cfg))); const m = [];
  Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { const dy = p.weeks[w][d]; ((dy && dy.sections) || []).forEach((s, si) => (s.items || []).forEach((it, ii) => m.push({ k:w + '|' + d + '|' + si + '|' + ii, w:+w, d, si, ii, label:clean(s.label), n:clean(it.name), det:it.detail || '' }))); })); return m; };
const SRC = fs.readFileSync(F('base_v226.html'), 'utf8').split('\n'); const lineOf = re => SRC.findIndex(l => re.test(l)) + 1;

// ── P9a: the six "neither" cards ──
console.log('=== P9a the U2 cards matching neither V226 nor D190 to the uninjured+same-pref build');
const re = /^(\S+) \{(.+?): (.+?)\} W(\d+) (\w+) (.+?) :: "(.*?)" => "(.*?)" \[(.+?)\]/;
const lines = fs.readFileSync(F('u2_moved_cards.txt'), 'utf8').trim().split('\n'); const neither = [];
for(const L of lines){ const m = re.exec(L); if(!m) continue; const [, ck, src, tgt, w, d, label, v226, d190] = m; const lab = label.replace(/ — .*/, '');
  const un = cards('base_v226.html', cfgOf('noinj', { [src]:tgt })); const r2 = un.find(c => c.w === +w && c.d === d && c.label.replace(/ — .*/, '') === lab && c.n === tgt);
  if(r2 && r2.det !== d190 && r2.det !== v226) neither.push({ ck, src, tgt, w:+w, d, lab, v226, d190 }); }
console.log('  found ' + neither.length + ' (expected 6) of ' + lines.length + ' moved cards');
const rows9 = [];
for(const r of neither){
  const pref = { [r.src]:r.tgt }; const A = cards('base_v226.html', cfgOf(r.ck, pref)), B = cards('d190_226.html', cfgOf(r.ck, pref)), U = cards('base_v226.html', cfgOf('noinj', pref));
  const a = A.find(c => c.w === r.w && c.d === r.d && c.label.replace(/ — .*/, '') === r.lab && c.n === r.tgt && c.det === r.v226); const b = B.find(c => c.k === a.k); const u = U.find(c => c.k === a.k);
  const uByLabel = U.filter(c => c.w === r.w && c.d === r.d && c.label.replace(/ — .*/, '') === r.lab).map(c => '[' + c.si + '][' + c.ii + '] ' + c.n + ' ' + JSON.stringify(c.det));
  const P = vm('base_v226.html').eval('(function(){var P=injuryPlan(' + JSON.stringify(cfgOf(r.ck)) + ');return P&&P.swapNames?JSON.stringify(P.swapNames):"{}";})()'); const SN = JSON.parse(P);
  const p = pat(r.tgt), capped = CAP[CKR[r.ck]].includes(p), sameSlot = !!u && u.n === a.n;
  const inside = sameSlot && !capped;
  const native = cards('base_v226.html', cfgOf(r.ck)).find(c => c.k === a.k);
  rows9.push({ r, a, b, u, p, capped, sameSlot, inside, sn:{ tgt:SN[r.tgt] || null, src:SN[r.src] || null, renamedOnCard:a.n !== r.tgt }, native, uByLabel });
  console.log('  ' + r.ck + ' {' + r.src + ' -> ' + r.tgt + '} W' + r.w + ' ' + r.d + ' slot [' + a.si + '][' + a.ii + '] "' + a.label + '"'
    + '\n    V226  ' + a.n + ' ' + JSON.stringify(a.det) + '\n    D190  ' + (b ? b.n + ' ' + JSON.stringify(b.det) : '(none)') + '\n    UNINJ+pref same [si][ii] ' + (u ? u.n + ' ' + JSON.stringify(u.det) : '(none)') + ' | same label section on uninjured: ' + uByLabel.join(' ; ')
    + '\n    injured no-pref same slot: ' + (native ? native.n + ' ' + JSON.stringify(native.det) : '(none)') + '\n    pattern ' + p + ' capped on ' + CKR[r.ck] + '/wa: ' + capped + ' | same name same slot on uninjured: ' + sameSlot + ' | P.swapNames[target] ' + JSON.stringify(SN[r.tgt] || null) + ' P.swapNames[source] ' + JSON.stringify(SN[r.src] || null)
    + '\n    => ' + (inside ? 'INSIDE (c2-ii) population, byte-equal ' + (b && u && b.det === u.det) : 'OUTSIDE (' + [!sameSlot ? 'not same name in same slot on uninjured' : '', capped ? 'capped pattern' : ''].filter(Boolean).join(', ') + ')'));
}
console.log('  P9a summary: inside ' + rows9.filter(x => x.inside).length + ' (of them not byte-equal ' + rows9.filter(x => x.inside && !(x.b && x.u && x.b.det === x.u.det)).length + ') | outside ' + rows9.filter(x => !x.inside).length + ' by reason ' + fmt(tally(rows9.filter(x => !x.inside), x => (x.sameSlot ? '' : 'slot-mismatch ') + (x.capped ? 'capped' : ''))));

// ── P9b: U2's method on ankle/wa ──
console.log('\n=== P9b U2 method on ankle/wa: one pref per natively cued source -> every sheet candidate (taken on a day the source is on)');
{ const IA = load(F('base_v226.html')); pin(IA);
  IA.eval("globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};globalThis.__T=[];showToast=function(m){__T.push(String(m));};");
  const p = IA.buildProgram(cfgOf('ankle_wa')); const st = JSON.parse(JSON.stringify(p)); Object.assign(st, { id:'PM', name:'M', created:1, startDate:START, cfg:cfgOf('ankle_wa') });
  IA.ctx.__SP = st; IA.eval("savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");
  const base = cards('base_v226.html', cfgOf('ankle_wa')); const cued = base.filter(c => c.det.endsWith(CUE)); const srcs = [...new Set(cued.map(c => c.n))];
  console.log('  natively cued cards ' + cued.length + ': ' + cued.map(c => 'W' + c.w + ' ' + c.d + ' ' + c.label + ' :: ' + c.n + ' ' + JSON.stringify(c.det)).join(' ; ') + ' | distinct sources ' + JSON.stringify(srcs));
  let pairs = 0, moved = 0, tot = 0; const kinds = {}, other = [], ex = [];
  for(const s of srcs){ const c0 = cued.find(c => c.n === s); IA.ctx.__D = IA.eval('activeProg.weeks[' + c0.w + '].' + c0.d); const tg = Array.from(IA.eval('__cands(__D,' + c0.w + ',' + JSON.stringify(s) + ')'));
    console.log('  source ' + s + ' (W' + c0.w + ' ' + c0.d + '): candidates ' + tg.map(t => t + '[' + pat(t) + (CAP.ankle.includes(pat(t)) ? ',capped' : '') + ']').join(', '));
    for(const t of tg){ pairs++; const A = cards('base_v226.html', cfgOf('ankle_wa', { [s]:t })), B = cards('d190_226.html', cfgOf('ankle_wa', { [s]:t })); const bm = new Map(B.map(x => [x.k, x])); let mv = 0;
      const U = cards('base_v226.html', cfgOf('noinj', { [s]:t })); const um = new Map(U.map(x => [x.k, x]));
      A.forEach(x => { const y = bm.get(x.k); if(x.n === t) tot++; if(y && y.n === x.n && y.det === x.det) return; mv++;
        const k = x.n !== t ? 'non-target card' : !y ? 'gone' : x.det === y.det + CUE ? 'ii (cue dropped only)' : (x.det.endsWith(CUE) && /@ RPE/.test(y.det) && !/@ RPE/.test(x.det)) ? 'ii+g' : (/RPE 7 \(leave 3 or more/.test(x.det) && /RPE 8 \(stop 2/.test(y.det)) ? 'iii' : 'other';
        kinds[k] = (kinds[k] || 0) + 1; const u = um.get(x.k);
        const line = '{' + s + ' -> ' + t + '} W' + x.w + ' ' + x.d + ' [' + x.si + '][' + x.ii + '] ' + x.label + ' :: ' + x.n + ' V226 ' + JSON.stringify(x.det) + ' => D190 ' + (y ? y.n + ' ' + JSON.stringify(y.det) : '(none)') + ' | uninj+pref ' + (u ? u.n + ' ' + JSON.stringify(u.det) : '(none)') + ' [' + k + ']';
        if(k === 'other' || k === 'gone' || k === 'non-target card') other.push(line); else if(ex.length < 6) ex.push(line);
        x.ref = u && u.n === x.n && !CAP.ankle.includes(pat(x.n)) ? (u.det === (y && y.det) ? 'c2ii-eq' : 'c2ii-NE') : 'c2ii-outside'; kinds['  ref ' + x.ref] = (kinds['  ref ' + x.ref] || 0) + 1; });
      if(mv) moved++; } }
  console.log('  ankle/wa: prefs ' + pairs + ' | builds moved ' + moved + '/' + pairs + ' | cards moved / target cards: ' + Object.keys(kinds).filter(k => !k.startsWith('  ')).reduce((a, k) => a + kinds[k], 0) + '/' + tot);
  console.log('  kinds: ' + fmt(kinds)); ex.forEach(x => console.log('    e.g. ' + x)); console.log('  OTHER / gone / non-target (printed in full): ' + other.length); other.forEach(x => console.log('    ' + x)); }

// ── P10 ──
console.log('\n=== P10 native unloadable accessories on capped patterns (no pref, no swap)');
console.log('  sites: applyInjuryFilter cue append :' + lineOf(/detail=detail\+' — hold RPE 7, two in the tank';/) + ' | build-time filter calls :' + lineOf(/applyInjuryFilter\(buildSections\(role,w,/) + ' and :' + lineOf(/if\(cfg\.injury\) Object\.keys\(weeks\[w\]\)\.forEach\(_d=>\{ const _day=weeks\[w\]\[_d\]; if\(_day&&Array\.isArray\(_day\.sections\)\) _day\.sections=applyInjuryFilter/)
  + ' | unloadableRxSweep :' + lineOf(/^function unloadableRxSweep\(/) + ' called :' + lineOf(/unloadableRxSweep\(weeks, cfg\); accessoryGrammarSweep\(weeks, cfg\);/) + ' -> _bwSetsFromDetail call :' + lineOf(/it\.detail=_bwSetsFromDetail\(it\.detail, \+w, _uCfg/) + ' | _bwSetsFromDetail :' + lineOf(/^function _bwSetsFromDetail\(/) + ' rpe read :' + lineOf(/let rpe=\/rpe\\s\*6\|light\|easy\/i\.test/) + ' | beginner floor :' + lineOf(/if\(exp==='beginner' && wk\)\{/));
const BWF = /^\d+ sets — RPE (\d)/;
const allP10 = [];
for(const ck of Object.keys(CKR)){
  const V = cards('base_v226.html', cfgOf(ck)), D = cards('d190_226.html', cfgOf(ck)), C = cards('cf_nocue_226.html', cfgOf(ck)); const dm = new Map(D.map(x => [x.k, x])), cm = new Map(C.map(x => [x.k, x]));
  const capItems = V.filter(c => CAP[CKR[ck]].includes(pat(c.n)));
  const unl = capItems.filter(c => BWF.test(c.det) || (cm.get(c.k) && BWF.test(cm.get(c.k).det)));
  const rows = unl.map(c => ({ ck, c, d:dm.get(c.k), cf:cm.get(c.k), rv:(BWF.exec(c.det) || [])[1] || '-', rcf:((cm.get(c.k) && BWF.exec(cm.get(c.k).det)) || [])[1] || '-' }));
  allP10.push(...rows);
  const w5 = rows.filter(r => r.c.w >= 5);
  console.log('  ' + ck.padEnd(12) + ' capped-pattern cards ' + capItems.length + ' | unloadable (bodyweight-sets form) ' + rows.length + ' | V226 form ' + fmt(tally(rows, r => 'RPE ' + r.rv)) + ' | D190 == V226 ' + rows.filter(r => r.d && r.d.det === r.c.det).length + '/' + rows.length
    + ' | cue-off CF form ' + fmt(tally(rows, r => 'RPE ' + r.rcf)) + ' || W5+ only (beginner floor off): n ' + w5.length + ', V226 RPE7 ' + w5.filter(r => r.rv === '7').length + ', CF RPE7 ' + w5.filter(r => r.rcf === '7').length + ', V226 7 & CF 8 ' + w5.filter(r => r.rv === '7' && r.rcf === '8').length);
}
const flip = allP10.filter(r => r.rv === '7' && r.rcf === '8');
console.log('  TOTAL unloadable capped native cards ' + allP10.length + ' | V226 RPE 7 form ' + allP10.filter(r => r.rv === '7').length + ' | of those, RPE 8 with the cue append neutralised (cue is the cause) ' + flip.length + ' | V226 RPE 7 and CF RPE 7 (beginner floor W3-4 or other) ' + allP10.filter(r => r.rv === '7' && r.rcf === '7').length + ' | D190 differs from V226 on ' + allP10.filter(r => !r.d || r.d.det !== r.c.det).length);
console.log('  by week (V226 form/CF form): ' + fmt(tally(allP10, r => 'W' + String(r.c.w).padStart(2, '0') + ' ' + r.rv + '/' + r.rcf)));
const seen = new Set(); flip.filter(r => { const k = r.ck; if(seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3).forEach(r => console.log('  e.g. ' + r.ck + ' W' + r.c.w + ' ' + r.c.d + ' ' + r.c.label + ' :: ' + r.c.n + ' [' + pat(r.c.n) + '] V226 ' + JSON.stringify(r.c.det) + ' | D190 ' + JSON.stringify(r.d && r.d.det) + ' | cue-off ' + JSON.stringify(r.cf && r.cf.det)));
{ const X = vm('base_v226.html'); console.log('  direct: _bwSetsFromDetail("2×10 each' + CUE + '", 5, "beginner", false) = ' + JSON.stringify(X.eval('_bwSetsFromDetail(' + JSON.stringify('2×10 each' + CUE) + ',5,"beginner",false)')) + ' | ("2×10 each", 5, "beginner", false) = ' + JSON.stringify(X.eval('_bwSetsFromDetail("2×10 each",5,"beginner",false)'))); }
