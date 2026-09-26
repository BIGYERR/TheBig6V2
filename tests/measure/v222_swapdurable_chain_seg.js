// v222_swapdurable_chain_seg.js — MEASURE (read-only). Segments the result files v222_swapdurable_chain.js wrote to SCR.
//   SCR=<scratch> node tests/measure/v222_swapdurable_chain_seg.js
const fs = require('fs'), path = require('path'); const SCR = process.env.SCR;
const T = ['BASE', 'MAP', 'STEP', 'SKIPHIST'], CK = ['mario', 'manny'];
const R = (ck, t, m) => JSON.parse(fs.readFileSync(path.join(SCR, 'res_' + ck + '_' + t + '_' + m + '.json'), 'utf8'));
const chains = {}; CK.forEach(ck => { chains[ck] = {}; JSON.parse(fs.readFileSync(path.join(SCR, 'chains_' + ck + '.json'), 'utf8')).forEach(c => chains[ck][c.id] = c); });
const out = []; const P = s => { out.push(s); console.log(s); };
const secs = s => s.split(/(?<=\}) /);
function firstDiff(a, b){ const A = secs(a), B = secs(b); for(let i = 0; i < Math.max(A.length, B.length); i++) if(A[i] !== B[i]) return { i, a:(A[i] || '(none)').slice(0, 260), b:(B[i] || '(none)').slice(0, 260) }; return null; }
const isSets = d => /^\s*\d+\s*sets\b/.test(d);
// 1. MAP untouched, slot detail != live: cause
P('== 1. untouched (u), slot detail != live, by cause (hop2+cyc2+hop3+cyc3) ==');
for(const t of ['MAP', 'STEP', 'SKIPHIST', 'BASE']){ const m = {}; let n = 0, all = 0;
  for(const ck of CK) R(ck, t, 'u').filter(r => /hop|cyc/.test(r.cls)).forEach(r => { all++; if(r.slotBoot.d === r.slotLive.d) return; n++;
    const k = r.slotBoot.n !== r.slotLive.n ? 'name differs too' : isSets(r.slotLive.d) && !isSets(r.slotBoot.d) ? 'live carries unloadable "N sets" from a middle hop; boot re-derives from engine rx'
      : r.slotBoot.d.startsWith(r.slotLive.d) || r.slotLive.d.startsWith(r.slotBoot.d) ? 'one is a prefix of the other (suffix added/dropped)'
      : /^\d+×\d+–\d+/.test(r.slotLive.d) && !/^\d+×\d+–\d+/.test(r.slotBoot.d.split(' ')[0]) ? 'live carries a D177 window from a middle hop; boot does not' : 'other rep/effort token';
    m[k] = (m[k] || 0) + 1; });
  P('  ' + t.padEnd(9) + n + '/' + all + '  ' + JSON.stringify(m)); }
// 2. STEP untouched residue: whole day != live
P('\n== 2. STEP untouched residue (whole day != live), by config x class; first diffs ==');
{ const m = {}; const ex = [];
  for(const ck of CK) R(ck, 'STEP', 'u').filter(r => r.boot !== r.live).forEach(r => { const k = ck + '|' + r.cls; m[k] = (m[k] || 0) + 1; if(ex.length < 4) ex.push(Object.assign({ ck }, r)); });
  P('  ' + JSON.stringify(m));
  ex.forEach(r => { const f = firstDiff(r.live, r.boot); P('  ' + r.ck + ' W' + r.w + ' ' + r.d + ' ' + r.cls + ' rec=' + r.rec + '\n    live: ' + f.a + '\n    boot: ' + f.b); });
  // how many STEP residue rows equal the MAP boot? (i.e. a boot-side effect independent of the map shape)
  let same = 0, tot = 0; for(const ck of CK){ const M = {}; R(ck, 'MAP', 'u').forEach(r => M[r.id] = r); R(ck, 'STEP', 'u').filter(r => r.boot !== r.live).forEach(r => { tot++; if(M[r.id] && M[r.id].boot === r.boot) same++; }); }
  P('  STEP residue rows whose boot equals MAP boot: ' + same + '/' + tot); }
// 3. snapshotted days rewritten by MAP with slot unchanged (t1 hop2/cyc2/hop3)
P('\n== 3. MAP snapshotted rewrite, t1, hop2/cyc2/hop3 (boot != hist), by config x week; first diffs ==');
{ const m = {}; const ex = [];
  for(const ck of CK) R(ck, 'MAP', 't1').filter(r => /hop|cyc/.test(r.cls) && r.hist && r.boot !== r.hist).forEach(r => { const k = ck + '|W' + r.w + '|' + r.cls; m[k] = (m[k] || 0) + 1; if(ex.length < 3) ex.push(Object.assign({ ck }, r)); });
  P('  ' + JSON.stringify(m)); ex.forEach(r => { const f = firstDiff(r.hist, r.boot); P('  ' + r.ck + ' W' + r.w + ' ' + r.d + ' rec=' + r.rec + '\n    hist: ' + f.a + '\n    boot: ' + f.b); }); }
// 4. collide2 / exch3 snapshotted: what the rewrite does
P('\n== 4. MAP t1 collide2 / exch3 rewrites: slot i (first hop) and slot j names, boot vs hist ==');
for(const cls of ['collide2', 'exch3']){ const m = {}; let n = 0;
  for(const ck of CK) R(ck, 'MAP', 't1').filter(r => r.cls === cls && r.hist && r.boot !== r.hist).forEach(r => { n++; const c = chains[ck][r.id];
    const nm = (sig, h) => { const s = secs(sig)[h.si] || ''; const items = (s.match(/\{(.*)\}$/) || ['', ''])[1].split(';'); return (items[h.ii] || '').split('|')[0]; };
    const i = c.hops[0], j = c.hops[1];
    const k = 'slot i ' + (nm(r.boot, i) === nm(r.hist, i) ? 'same' : 'renamed') + ', slot j ' + (nm(r.boot, j) === nm(r.hist, j) ? 'same' : 'renamed') + ', duplicate name on booted card ' + (nm(r.boot, i) === nm(r.boot, j));
    m[k] = (m[k] || 0) + 1; });
  P('  ' + cls + ' ' + n + ': ' + JSON.stringify(m)); }
// 5. F1 exact: Mario W5 Thu box -> goblet -> Leg press, and box -> goblet -> box
P('\n== 5. F1 rows (mario W5 thu): slot live vs boot per tree x mode ==');
for(const [lbl, B, C] of [['box>goblet>LP', 'Dumbbell goblet squat', 'Leg press'], ['box>goblet>box', 'Dumbbell goblet squat', 'Barbell box squat']]){
  const id = Object.values(chains.mario).find(c => c.w === 5 && c.d === 'thu' && c.hops.length === 2 && c.hops[0].to === B && c.hops[1].to === C && c.hops[0].si === c.hops[1].si);
  if(!id){ P('  ' + lbl + ' NOT IN ENUMERATION (not reachable through the sheet)'); continue; }
  for(const m of ['u', 't1', 't2', 'up_ts', 'up_st', 'up_bt']) P('  ' + (lbl + '|' + m).padEnd(22) + T.map(t => { const r = R('mario', t, m).find(x => x.id === id.id); return t + ' ' + r.slotBoot.n.replace('Dumbbell ', 'DB ').replace('Barbell ', 'BB ') + ' ' + r.slotBoot.d.split(' ')[0] + (r.boot === r.live ? ' =live' : ' !=live(' + r.slotLive.d.split(' ')[0] + ')'); }).join(' | ')); }
// 6. C4 roll-up
P('\n== 6. C4 roll-up: whole day boot == last live card, hop2+cyc2 (untouched u; snapshotted t1 and t2) ==');
for(const m of ['u', 't1', 't2']) P('  ' + m.padEnd(3) + T.map(t => { let ok = 0, n = 0; CK.forEach(ck => R(ck, t, m).filter(r => r.cls === 'hop2' || r.cls === 'cyc2').forEach(r => { n++; if(r.boot === r.live) ok++; })); return t + ' ' + ok + '/' + n; }).join('   '));
P('  2-cycles reachable through the sheet: ' + CK.map(ck => ck + ' ' + Object.values(chains[ck]).filter(c => c.cls === 'cyc2').length).join(', ') + ' (of hop2+cyc2 ' + CK.map(ck => Object.values(chains[ck]).filter(c => c.cls === 'cyc2' || c.cls === 'hop2').length).join(' / ') + ')');
fs.writeFileSync(process.env.OUT || '/dev/null', out.join('\n') + '\n');
// 7. REACHABLE-ONLY recomputation: drop every row where a hop was not in the sheet's list at replay (unreach > 0)
P('\n== 7. REACHABLE ONLY (unreach == 0 at replay). cells: slot detail!=live / slot name!=live / whole day!=live ; snapshot rewrite = boot!=hist ==');
const CLS = ['hop2', 'cyc2', 'hop3', 'cyc3', 'collide2', 'exch3'];
for(const m of ['u', 't1', 't2', 'up_ts', 'up_st', 'up_bt']) for(const cls of CLS){
  P('  ' + (m + '|' + cls).padEnd(15) + T.map(t => { let rows = []; CK.forEach(ck => rows = rows.concat(R(ck, t, m).filter(r => r.cls === cls && !r.unreach)));
    const c = f => rows.filter(f).length; return t + ' ' + c(r => r.slotBoot.d !== r.slotLive.d) + '/' + c(r => r.slotBoot.n !== r.slotLive.n) + '/' + c(r => r.boot !== r.live) + (m === 'u' ? '' : ' rw ' + c(r => r.hist && r.boot !== r.hist)) + ' of ' + rows.length; }).join('  ')); }
P('  unreach rows dropped per mode (MAP): ' + ['u', 't1', 't2'].map(m => m + ' ' + CK.map(ck => R(ck, 'MAP', m).filter(r => r.unreach).length).reduce((a, b) => a + b, 0)).join(', '));
// 8. manny day stability across boots (fresh context, same clock) — why enumeration and replay disagree
{ const { load } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js'), fx = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js').fixtures;
  const IA = load('/Users/CanasBangin/Desktop/TheBig6V2/index.html'); const T0 = new Date('2026-09-24T12:00:00').getTime(); const RD = Date;
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T0); } static now(){ return T0; } } IA.ctx.Date = FD;
  const cl = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
  const sigD = dy => dy && dy.sections ? dy.sections.map(s => (s.items || []).map(i => cl(i.name)).join(';')).join(' | ') : '(none)';
  const snaps = [];
  for(let k = 0; k < 3; k++){ IA.localStorage.clear(); const p = IA.buildProgram(JSON.parse(JSON.stringify(fx.HALF_MANNY))); const st = JSON.parse(JSON.stringify(p));
    Object.assign(st, { id:'PM', name:'M', created:1, startDate:'2026-08-24', cfg:JSON.parse(JSON.stringify(fx.HALF_MANNY)) }); IA.ctx.__SP = st; IA.eval('savePrograms([__SP]);');
    IA.eval("activeProgId='PM';activeProg=refreshProgram(getPrograms()[0]);");
    snaps.push(['5.fri', '7.mon', '7.fri', '5.mon'].map(x => { const [w, d] = x.split('.'); return x + ' ' + sigD(IA.eval('activeProg.weeks[' + w + '].' + d)); })); }
  P('\n== 8. manny: same cfg, same clock, 3 fresh setups+boots: day item names identical? ' + (JSON.stringify(snaps[0]) === JSON.stringify(snaps[1]) && JSON.stringify(snaps[1]) === JSON.stringify(snaps[2])));
  snaps.forEach((s, i) => s.forEach(l => P('  boot' + i + ' ' + l.slice(0, 250)))); }
fs.writeFileSync(process.env.OUT || '/dev/null', out.join('\n') + '\n');
