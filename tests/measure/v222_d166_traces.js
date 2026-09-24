// v222_d166_traces.js — MEASURE, pre-build traces for D166 as ruled (cf166b: at the Pull superset B reader, print
// ex.cond[3] when ex.cond[2]===ex.backMain). Base V216 = 3dc0146. Tracer, lattice and surgery come from
// v221_d165_traces.js (same anchors, proven output-identical there and re-proven here on every moved config).
//   node tests/measure/v222_d166_traces.js
// Q4: the twin days whose substitute does not reach the card: which pass drops it, per day, with the injury cell and
//     injuryPlan(cfg).noJumps and the engine's own JUMPS regex (index.html:8050) read as a label, not as the oracle.
// Q5: cf166b moved days that carried no twin on base: per-day cause class, read off base's snapshots.
// Q6: replacement names on the twin days whose substitute survives, by age bracket.
'use strict';
const T = require('./v221_d165_traces.js');
const { rep1, BASE_SRC, CF166B, instr, loadI, traced, LAT3, ik, clean, stem, live, bump, top, classify, snapSig, killer, movedDays, load, progDigest, W } = T;
const fs = require('fs');
// ── --cfc: the RE-RULED shape cf166c (V222 coach): when ex.cond[2] is the Main, Pull superset B prints the row alone.
//    node tests/measure/v222_d166_traces.js --cfc
//    Blast on the full WIDE lattice (13,104, plain builds); per-day traces on the 3-tier slice (6,552).
//    Asserted, not assumed: 0 items added on any moved day. HALF_MANNY's three arms against the era pins.
if(process.argv.includes('--cfc')){
  const path = require('path'), os = require('os');
  const R166c = "          ...(ex.cond[2]===ex.backMain?[]:[{name:ex.cond[2],detail:vsets(3)+'×10'}])]});";
  const CF166C = rep1(BASE_SRC, T.A166r, R166c);
  const scrc = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/788d23bc-397a-4c4b-9d6f-91ef5b233dad/scratchpad/cf/cf166c.html';
  if(fs.existsSync(scrc)) console.log('cf166c rebuilt == scratch cf166c: ' + (fs.readFileSync(scrc, 'utf8') === CF166C));
  const IA = load(W('basec.html', BASE_SRC)), CA = load(W('cf166c.html', CF166C));
  const IB = loadI('basec_i.html', instr(BASE_SRC)), IC = loadI('cf166c_i.html', instr(CF166C));
  const strip = p => { const o = Object.assign({}, p); delete o.id; delete o.created; delete o.startDate; return o; };
  // (a) WIDE blast, plain builds
  let pm = 0, um = 0, ukm = 0, ofm = 0, dm = 0, selfDiff = 0; const byTier = {};
  T.LAT.forEach(x => { const a = IA.buildProgram(JSON.parse(JSON.stringify(x.cfg))), b = CA.buildProgram(JSON.parse(JSON.stringify(x.cfg)));
    if(JSON.stringify(a._swapUniverse || null) !== JSON.stringify(b._swapUniverse || null)) um++;
    if(JSON.stringify(a._swapUniverseByKey || null) !== JSON.stringify(b._swapUniverseByKey || null)) ukm++;
    const sa = strip(a), sb = strip(b); ['weeks','_swapUniverse','_swapUniverseByKey'].forEach(z => { delete sa[z]; delete sb[z]; });
    if(JSON.stringify(sa) !== JSON.stringify(sb)) ofm++;
    if(JSON.stringify(strip(a)) === JSON.stringify(strip(b))) return; pm++; bump(byTier, x.eq);
    Object.keys(a.weeks).forEach(w => T.DAYS.forEach(d => { if(JSON.stringify(a.weeks[w][d]) !== JSON.stringify(b.weeks[w][d])) dm++; })); });
  console.log('WIDE ' + T.LAT.length + ': programs moved ' + pm + ', days moved ' + dm + ', _swapUniverse moved ' + um + ', _swapUniverseByKey moved ' + ukm + ', other top-level fields moved ' + ofm + '; by tier ' + JSON.stringify(byTier));
  // (b) per-day traces on the 3-tier slice
  const M = movedDays(IA, CA, LAT3);
  let idOK = 0; const Q = { days:0, t166:0, hidden:0, other:0, added:0, addedEx:[], lostOther:0, lostOtherEx:[], secLost:0, secLostEx:[], emptyPB:0, form:{}, formT:{}, otherSec:{} };
  const pbOf = L => L.find(s => /^(Pull superset B|Pull)$/.test(stem(s.label)));
  const sig = s => s ? s.label + (s.superset ? '(ss)' : '') + '[' + s.items.map(i => clean(i.name)).join(', ') + ']' : '(none)';
  M.out.forEach(r => {
    const A = traced(IB, r.x.cfg), C = traced(IC, r.x.cfg); if(progDigest(A.p) === r.dA && progDigest(C.p) === r.dB) idOK++;
    r.days.forEach(({ w, d }) => {
      Q.days++;
      const da = A.p.weeks[w][d], db = C.p.weeks[w][d], ca = classify(da), k = w + '|' + d, tA = A.S[k] || [], tC = C.S[k] || [];
      const bb = (tA.find(([t]) => t === 'buildSections') || [0, []])[1]; const mS = (bb || []).find(s => stem(s[0]) === 'Main'); const pA = (bb || []).find(s => stem(s[0]) === 'Pull superset B');
      const hid = !ca.c166 && mS && pA && pA[1].indexOf(mS[1][0]) >= 0;
      const cls = ca.c166 ? 'TWIN' : hid ? 'HIDDEN' : 'OTHER'; if(ca.c166) Q.t166++; else if(hid) Q.hidden++; else Q.other++;
      const cb = (tC.find(([t]) => t === 'buildSections') || [0, []])[1]; const pC = (cb || []).find(s => stem(s[0]) === 'Pull superset B');
      if(pC && !(pC[1] || []).length) Q.emptyPB++;
      const La = live(da), Lb = live(db);
      const na = {}, nb = {}; La.forEach(s => s.items.forEach(i => bump(na, clean(i.name)))); Lb.forEach(s => s.items.forEach(i => bump(nb, clean(i.name))));
      const add = Object.keys(nb).filter(n => nb[n] > (na[n] || 0)), lost = Object.keys(na).filter(n => na[n] > (nb[n] || 0));
      const who = cls + ' ' + r.x.eq + ' ' + ik(r.x) + ' ' + r.x.f + ' ' + r.x.cfg.experience + ' seed ' + r.x.cfg.seed + ' W' + w + ' ' + d + ' "' + da.title + '"';
      if(add.length){ Q.added++; if(Q.addedEx.length < 5) Q.addedEx.push(who + ' +' + add.join(',') + '\n     base: ' + La.map(sig).join(' | ') + '\n     cf:   ' + Lb.map(sig).join(' | ')); }
      const lostX = lost.filter(n => n !== 'Kettlebell swing');
      if(lostX.length){ Q.lostOther++; if(Q.lostOtherEx.length < 5) Q.lostOtherEx.push(who + ' -' + lostX.join(',') + '\n     base: ' + La.map(sig).join(' | ') + '\n     cf:   ' + Lb.map(sig).join(' | ')); }
      if(Lb.length < La.length){ Q.secLost++; if(Q.secLostEx.length < 3) Q.secLostEx.push(who + '\n     base: ' + La.map(sig).join(' | ') + '\n     cf:   ' + Lb.map(sig).join(' | ')); }
      const pa = pbOf(La), pc = pbOf(Lb);
      const shape = s => s ? stem(s.label) + (s.superset ? '(ss)' : '') + ' x' + s.items.length : '(none)';
      bump(Q.form, cls + ' | Pull B: ' + shape(pa) + ' -> ' + shape(pc) + (pa && pc && pc.items.length === 1 && pa.items[0] && clean(pc.items[0].name) === clean(pa.items[0].name) ? ' (same row)' : ''));
      const restA = La.filter(s => s !== pa).map(sig).join(' | '), restB = Lb.filter(s => s !== pc).map(sig).join(' | ');
      if(restA !== restB){ const A2 = La.filter(s => s !== pa).map(sig), B2 = Lb.filter(s => s !== pc).map(sig); A2.filter(z => B2.indexOf(z) < 0).forEach(z => bump(Q.otherSec, cls + ' ' + z.replace(/\[.*$/, ''))); }
    });
  });
  console.log('\n3-tier slice ' + LAT3.length + ': programs moved ' + M.progMoved + ', days ' + Q.days + '; instrumented == plain on ' + idOK + '/' + M.out.length);
  console.log('  class: TWIN ' + Q.t166 + ', HIDDEN ' + Q.hidden + ', OTHER ' + Q.other);
  console.log('  ASSERT 0 items added on any moved day: ' + (Q.added === 0 ? 'HOLDS' : 'FAILS on ' + Q.added) + (Q.addedEx.length ? '\n  ' + Q.addedEx.join('\n  ') : ''));
  console.log('  days losing an item other than Kettlebell swing: ' + Q.lostOther + (Q.lostOtherEx.length ? '\n  ' + Q.lostOtherEx.join('\n  ') : ''));
  console.log('  days losing a live section: ' + Q.secLost + (Q.secLostEx.length ? '\n  ' + Q.secLostEx.join('\n  ') : '') + '; Pull superset B built EMPTY (no backRow[1]): ' + Q.emptyPB);
  console.log('  Pull superset B, base final -> cf final:\n' + top(Q.form, 30));
  console.log('  sections OTHER than Pull B that changed:\n' + top(Q.otherSec, 20));
  // (c) HALF_MANNY arms
  const PINS = ['0ac7da6b1691a8e1', '1069cd7f86eed204', '9d14801a63111081'];
  [['base', BASE_SRC], ['cf166c', CF166C]].forEach(([nm, SRC]) => {
    const X = load(W(nm + '_m.html', SRC)); const H = () => JSON.parse(JSON.stringify(X.fixtures.HALF_MANNY));
    const plain = progDigest(X.buildProgram(H())), again = progDigest(X.buildProgram(H()));
    X.eval('globalThis.__DELOAD_OFF=true;'); const dOff = progDigest(X.buildProgram(H())); X.eval('globalThis.__DELOAD_OFF=false;');
    const CL = "  if(_auxFamily(name)==='core') return 0;\n"; const n = SRC.split(CL).length - 1;
    const cOff = n === 1 ? progDigest(load(W(nm + '_core.html', SRC.replace(CL, ''))).buildProgram(H())) : 'CLAUSE count ' + n;
    console.log('  HALF_MANNY ' + nm + ' (self-stable ' + (plain === again) + '): ' + plain + ' / ' + dOff + ' / ' + cOff + ' vs pins ' + [plain, dOff, cOff].map((g, i) => g === PINS[i] ? 'EQ' : 'MOVED').join('/'));
  });
  process.exit(0);
}
const scr = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/788d23bc-397a-4c4b-9d6f-91ef5b233dad/scratchpad/cf/cf166b.html';
if(fs.existsSync(scr)) console.log('cf166b rebuilt == V220 scratch cf166b: ' + (fs.readFileSync(scr, 'utf8') === CF166B));
const IA = load(W('base6.html', BASE_SRC)), CA = load(W('cf166b.html', CF166B));
const IB = loadI('base6_i.html', instr(BASE_SRC)), IC = loadI('cf166b_i.html', instr(CF166B));
const JM = BASE_SRC.match(/const JUMPS=(\/[^\n]*?\/[a-z]*);/); const JUMPS = JM ? eval(JM[1]) : null;
console.log('JUMPS (index.html:8050) = ' + (JM ? JM[1] : 'NOT FOUND'));
const plan = IA.eval('injuryPlan');
const M = movedDays(IA, CA, LAT3);
console.log('cf166b moved programs ' + M.progMoved + '/' + LAT3.length + ', days ' + M.out.reduce((n, r) => n + r.days.length, 0));
let idOK = 0; const R = { tgt:0, kept:0, lost:0, lostBy:{}, lostEx:[], lostUnexpl:[], keptName:{}, bj55:0, bjAll:0, keptAge:{}, non:0, nonCls:{}, nonEx:{} };
const pullB = secs => (secs || []).find(s => stem(s[0]) === 'Pull superset B');
M.out.forEach(r => {
  const A = traced(IB, r.x.cfg), C = traced(IC, r.x.cfg);
  if(progDigest(A.p) === r.dA && progDigest(C.p) === r.dB) idOK++;
  const P = plan(JSON.parse(JSON.stringify(r.x.cfg))) || {};
  r.days.forEach(({ w, d }) => {
    const da = A.p.weeks[w][d], db = C.p.weeks[w][d], ca = classify(da), k = w + '|' + d, tA = A.S[k] || [], tC = C.S[k] || [];
    const cell = r.x.eq + ' ' + ik(r.x);
    const who = cell + ' | ' + r.x.f + ' ' + r.x.cfg.experience + ' ' + r.x.cfg.ageBracket + ' seed ' + r.x.cfg.seed + ' rest ' + r.x.cfg.restDays.join('/') + ' | W' + w + ' ' + d + ' "' + da.title + '"';
    const b0 = (tC.find(([t]) => t === 'buildSections') || [0, []])[1]; const pb = pullB(b0);
    const sub = pb ? pb[1][pb[1].length - 1] : null;   // the cond read is the section's LAST item (:9170-9172)
    if(ca.c166){
      R.tgt++;
      const onCard = live(db).some(s => s.items.some(i => clean(i.name) === sub));
      if(onCard){ R.kept++; bump(R.keptName, sub); bump(R.keptAge, sub + ' @ ' + r.x.cfg.ageBracket); if(sub === 'Broad jumps'){ R.bjAll++; if(r.x.cfg.ageBracket === '55+') R.bj55++; } return; }
      R.lost++;
      const kil = killer(tC, secs => secs.some(s => (s[1] || []).indexOf(sub) >= 0));
      const jm = JUMPS ? JUMPS.test(sub) : null;
      const key = 'dropped after ' + kil + ' | noJumps=' + !!P.noJumps + ' | JUMPS(' + sub + ')=' + jm + ' | ' + cell;
      bump(R.lostBy, key);
      const explained = /^applyInjuryFilter/.test(kil) && P.noJumps && jm;
      if(!explained && R.lostUnexpl.length < 10) R.lostUnexpl.push(who + ' | ' + key + '\n       ' + tC.map(([t, s]) => t + ': ' + snapSig(s)).join('\n       '));
      if(R.lostEx.length < 1) R.lostEx.push(who + '\n       ' + tC.map(([t, s]) => t + ': ' + snapSig(s)).join('\n       '));
      return;
    }
    R.non++;
    // base: did buildSections print the Main's name in Pull superset B (a hidden twin), and which pass removed it?
    const bb = (tA.find(([t]) => t === 'buildSections') || [0, []])[1]; const mainS = (bb || []).find(s => stem(s[0]) === 'Main');
    const mainN = mainS ? mainS[1][0] : null; const pbA = pullB(bb);
    let cls;
    if(!pbA) cls = 'no Pull superset B at buildSections on base';
    else if(mainN && pbA[1].indexOf(mainN) >= 0){
      const kil = killer(tA, secs => { const m = secs.find(s => stem(s[0]) === 'Main'); const p = secs.find(s => /^Pull superset B$|^Pull$/.test(stem(s[0])));
        return !!(m && p && m[1][0] && p[1].indexOf(m[1][0]) >= 0); });
      cls = 'HIDDEN TWIN: base built Main ' + mainN + ' + Pull superset B ' + mainN + ', twin removed after ' + kil;
    } else cls = 'base Pull superset B at buildSections has no Main name: [' + pbA[1].join(', ') + '] Main ' + mainN;
    const kc = cls + ' | cf substitute ' + sub + ' ' + (live(db).some(s => s.items.some(i => clean(i.name) === sub)) ? 'ON the card' : 'NOT on the card');
    bump(R.nonCls, kc); bump(R.nonCls, '  [by title] ' + String(da.title).replace(/\s*\(.*$/, '') + ' | ' + (cls.startsWith('HIDDEN') ? 'hidden twin' : 'other'));
    if(!R.nonEx[cls.slice(0, 40)]){ R.nonEx[cls.slice(0, 40)] = 1; console.log('\n  non-target example ' + who + '\n     base trail:\n       ' + tA.map(([t, s]) => t + ': ' + snapSig(s)).join('\n       ') + '\n     cf final: ' + live(db).map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | ')); }
  });
});
console.log('\ninstrumented == plain (base AND cf166b digests), moved configs: ' + idOK + '/' + M.out.length);
console.log('\n== Q4. twin days ' + R.tgt + ': substitute on the final card ' + R.kept + ', substitute absent ' + R.lost);
console.log('  absent, by killing pass | noJumps | JUMPS match | cell:\n' + top(R.lostBy));
console.log('  absent days NOT explained by (applyInjuryFilter AND noJumps AND JUMPS match): ' + R.lostUnexpl.length + (R.lostUnexpl.length ? '\n  ' + R.lostUnexpl.join('\n  ') : ''));
console.log('  one absent-day trail:\n  ' + R.lostEx.join('\n'));
console.log('\n== Q5. cf166b moved days with no twin on base: ' + R.non + '\n' + top(R.nonCls, 80));
console.log('\n== Q6. substitutes that reach the card (' + R.kept + '):\n' + top(R.keptName) + '\n  by age:\n' + top(R.keptAge) + '\n  Broad jumps at 55+: ' + R.bj55 + ' of ' + R.bjAll + ' Broad jumps substitutes, of ' + R.kept + ' surviving substitutes');
