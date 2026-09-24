'use strict';
// v219_followups.js — MEASURE (Mode B), two follow-ups on the V219 chain. Reuses /tmp/base_V218.html, /tmp/v219_cf_step2.html,
// /tmp/v219_cf_step1a_d167only.html and /tmp/v219_cf_step1.html (built by v219_chain_rebaseline.js --build); rebuilds nothing.
//   node tests/measure/v219_followups.js --g199                 Q1: the 15 deload day builds D159 moves in g199 E1a/G1
//   SCR=<dir> node tests/measure/v219_followups.js --k2a i n    Q2 shard; --k2a-merge n  report
// Q1 uses g199's OWN lattice, instrument (A_PIPE/A_PIPE_R split, SNAP_FN) and hand posterior table (E_PAT/isPost),
// sliced out of tests/gates/g199_deload_arbitration.js and evaluated, never retyped. p1 = into the deload, p2 = out of it,
// shipped = the final card.
// Q2 logs every dedupe decision (rename at `it.name=to`, or trigger left in place at `if(!cands.length) return;`, anchors
// count==1) with its pair. ORACLE for location: Monday-start date arithmetic (mon=0..sun=6, index (w-1)*7+off). An event is
// a tuple (wA,dA,wB,dB,section,item,was,to); a changed event is one present in only one arm. Class by the B position
// (wB,dB,si,ii,was): A = same B position and same rename, different yesterday; B = same B position and yesterday, different
// outcome; C = only in the candidate; D = only in V218.
const fs = require('fs'), path = require('path');
const REPO = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures, progDigest, DAYS } = require(REPO + '/tests/harness.js');
const MODE = process.argv[2], SCR = process.env.SCR || '/tmp/v219_scr';
const cl = o => JSON.parse(JSON.stringify(o)), cnt = (s, a) => s.split(a).length - 1;
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const sig = secs => (secs || []).filter(s => (s.items || s.n || []).length).map(s => (s.label || s.l) + '[' + (s.items ? s.items.map(i => clean(i.name)) : s.n).join(', ') + ']').join(' | ');

if(MODE === '--g199'){
  const G = fs.readFileSync(REPO + '/tests/gates/g199_deload_arbitration.js', 'utf8');
  const slice = (a, b) => { const i = G.indexOf(a), j = G.indexOf(b, i); if(i < 0 || j < 0) throw new Error('slice ' + a); return G.slice(i, j); };
  const code = slice('const E_PAT=[', '\n', 0) && G.slice(G.indexOf('const E_PAT=['), G.indexOf('\n', G.indexOf('const isPost=')))
    + '\n' + slice('const E_TIERS=', 'function instrument(')
    + '\nreturn {isPost, LAT, SNAP_FN, pipeFor};';
  const M = new Function(code)();
  console.log('g199 lattice ' + M.LAT.length + ' configs (sliced from the gate)');
  const inst = (f, tag) => { const R = fs.readFileSync(f, 'utf8'); const [AP, APR] = M.pipeFor(R); const n = cnt(R, AP); console.log(tag + ' instrument anchor count ' + n); if(n !== 1) process.exit(2);
    const o = path.join(SCR, 'fu_g199_' + tag + '.html'); if(fs.existsSync(o)) fs.unlinkSync(o); fs.writeFileSync(o, R.replace(AP, APR)); const X = load(o); X.eval(M.SNAP_FN + 'globalThis.__G199=[];globalThis.__DELOAD_OFF=false;'); return { X, P: load(f) }; };
  const A = inst('/tmp/base_V218.html', 'V218'), B = inst('/tmp/v219_cf_step2.html', 's2');
  const secPost = s => (s.n || []).reduce((a, n) => a + (M.isPost(n) ? 1 : 0), 0), cardPost = c => (c || []).reduce((a, s) => a + secPost(s), 0);
  const LI = c => (c || []).find(s => s.l === 'Leg isolation' && (s.n || []).length);
  const run = (Z, cfg) => { Z.X.eval('globalThis.__G199.length=0;'); const p = Z.X.buildProgram(cl(cfg)); const R = Z.X.eval('globalThis.__G199').map(cl); return { p, R }; };
  let inert = 0, tot = { a:{e1a:0, g1:0}, b:{e1a:0, g1:0} }; const rows = [], cls = {};
  M.LAT.forEach((L, li) => { const a = run(A, L.cfg), b = run(B, L.cfg);
    if(li % 97 === 0){ inert += (progDigest(a.p) === progDigest(A.P.buildProgram(cl(L.cfg))) && progDigest(b.p) === progDigest(B.P.buildProgram(cl(L.cfg)))) ? 1 : 0; }
    const bm = {}; b.R.forEach(r => bm[r.w + '|' + r.d] = r);
    a.R.forEach(ra => { if(!ra.dl) return; const rb = bm[ra.w + '|' + ra.d];
      const ea = cardPost(ra.p1), eb = cardPost(rb.p1), da = !!LI(ra.p1) && !LI(ra.p2), db = !!LI(rb.p1) && !LI(rb.p2);
      tot.a.e1a += ea; tot.b.e1a += eb; tot.a.g1 += da ? 1 : 0; tot.b.g1 += db ? 1 : 0;
      if(ea === eb && da === db) return;
      const liA = LI(ra.p1), liB = LI(rb.p1); const others = c => { const m = {}; (c || []).forEach(s => { if(s.l !== 'Leg isolation') (s.n || []).forEach(n => m[n.toLowerCase()] = s.l); }); return m; };
      const oA = others(ra.p1); const dupNames = liA ? liA.n.filter(n => oA[n.toLowerCase()]).map(n => n + ' (also in ' + oA[n.toLowerCase()] + ')') : [];
      const dupInLI = liA ? liA.n.filter((n, i) => liA.n.indexOf(n) !== i) : [];
      const shipA = a.p.weeks[ra.w][ra.d], shipB = b.p.weeks[ra.w][ra.d]; const same = JSON.stringify(shipA) === JSON.stringify(shipB);
      const ia = (shipA.sections || []).reduce((x, s) => x + (s.items || []).length, 0), ib = (shipB.sections || []).reduce((x, s) => x + (s.items || []).length, 0);
      const k = (dupNames.length || dupInLI.length ? 'V218 Leg isolation held an on-card name' : 'V218 Leg isolation held NO on-card name') + ' | s2 p1 Leg isolation ' + (liB ? 'present [' + liB.n.join(', ') + ']' : 'ABSENT') + ' | shipped deload card ' + (same ? 'byte-identical' : ia === ib ? 'differs, same item count' : 'item count ' + ia + ' -> ' + ib);
      cls[k] = (cls[k] || 0) + 1;
      rows.push(['#' + (rows.length + 1) + ' ' + L.key + ' W' + ra.w + ' ' + ra.d + ' | E1a ' + ea + '->' + eb + ' | G1 drop ' + (da ? 1 : 0) + '->' + (db ? 1 : 0),
        '   V218 p1 Leg isolation: ' + (liA ? liA.n.join(', ') : '(none)') + '  | on-card duplicate: ' + (dupNames.concat(dupInLI.map(n => n + ' (twice in the block)')).join('; ') || 'no'),
        '   V218 p2 Leg isolation: ' + (LI(ra.p2) ? LI(ra.p2).n.join(', ') : '(dropped/none)'),
        '   s2   p1 Leg isolation: ' + (liB ? liB.n.join(', ') : '(none)') + '   | s2 p2: ' + (LI(rb.p2) ? LI(rb.p2).n.join(', ') : '(dropped/none)'),
        '   V218 p1 card: ' + sig(ra.p1), '   s2   p1 card: ' + sig(rb.p1),
        '   V218 shipped: ' + sig(shipA.sections), '   s2   shipped: ' + sig(shipB.sections)].join('\n')); }); });
  console.log('instrument inert on sampled configs: ' + inert + '/' + Math.ceil(M.LAT.length / 97));
  console.log('E1a V218 ' + tot.a.e1a + ' s2 ' + tot.b.e1a + ' | G1 V218 ' + tot.a.g1 + ' s2 ' + tot.b.g1 + ' | deload day builds that differ: ' + rows.length);
  console.log('CLASSES:'); Object.keys(cls).sort().forEach(k => console.log('  ' + cls[k] + '  ' + k)); console.log('  sum ' + Object.values(cls).reduce((a, b) => a + b, 0));
  console.log('\nROWS:\n' + rows.join('\n')); process.exit(0);
}

// ── Q2 ──
const EMP = 'if(!cands.length) return;', REN = '        it.name=to;\n';
function instr(f, tag){ const R = fs.readFileSync(f, 'utf8'); [EMP, REN].forEach(a => { if(cnt(R, a) !== 1){ console.log('ANCHOR FAIL ' + tag + ' ' + cnt(R, a) + ' ' + JSON.stringify(a)); process.exit(2); } });
  const S = R.replace(EMP, () => '(globalThis.__DE||(globalThis.__DE=[])).push([+wA,dA,+wB,dB,B.sections.indexOf(sec),ii,it.name,null]); ' + EMP)
             .replace(REN, () => '        (globalThis.__DE||(globalThis.__DE=[])).push([+wA,dA,+wB,dB,B.sections.indexOf(sec),ii,it.name,to]);\n' + REN);
  const o = path.join(SCR, 'fu_k2a_' + tag + '_' + process.pid + '.html'); if(fs.existsSync(o)) fs.unlinkSync(o); fs.writeFileSync(o, S); return { X: load(o), P: load(f) }; }
if(MODE === '--k2a'){
  const K = +process.argv[3], N = +process.argv[4];
  const CS = fs.readFileSync(REPO + '/tests/measure/v219_chain_rebaseline.js', 'utf8');
  const blk = CS.slice(CS.indexOf('const GOALS = [['), CS.indexOf('const LATN ='));
  const U = new Function('cl', 'fixtures', 'DAYS', blk + '\nreturn U;')(cl, fixtures, DAYS).filter(x => x.lat === 'C');
  const ARM = { base: instr('/tmp/base_V218.html', 'base'), s1a: instr('/tmp/v219_cf_step1a_d167only.html', 's1a'), s1: instr('/tmp/v219_cf_step1.html', 's1') };
  const OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}, dix = (w, d) => (w - 1) * 7 + OFF[d];
  const T = {}, EX = {}; const bump = (k, n = 1) => { T[k] = (T[k] || 0) + n; }; const ex = (k, s) => { EX[k] = EX[k] || []; if(EX[k].length < 3) EX[k].push(s); };
  let inertBad = 0;
  for(let i = K; i < U.length; i += N){ const x = U[i]; const E = {};
    for(const a of Object.keys(ARM)){ ARM[a].X.window.__DE = []; const p = ARM[a].X.buildProgram(cl(x.c)); E[a] = ARM[a].X.window.__DE.map(r => r.slice()); ARM[a].X.window.__DE = [];
      if(i % 50 === K % 50 && progDigest(p) !== progDigest(ARM[a].P.buildProgram(cl(x.c)))) inertBad++; }
    const sunTrain = !x.c.restDays.includes('sun'); const grp = sunTrain ? 'sun-training' : 'sun-rest';
    bump('configs | ' + grp); bump('configs | ' + x.mix + ' | ' + grp);
    E.base.forEach(e => { const g = dix(e[2], e[3]) - dix(e[0], e[1]); bump('V218 pair gap ' + g + ' | ' + (e[7] ? 'rename' : 'left')); });
    for(const arm of ['s1a', 's1']){
      E[arm].forEach(e => { const g = dix(e[2], e[3]) - dix(e[0], e[1]); if(g !== 1) bump(arm + ' | NON-CALENDAR pair used, gap ' + g); });
      const key = e => e.join('|'), pos = e => [e[2], e[3], e[4], e[5], e[6]].join('|');
      const SB = new Set(E.base.map(key)), SC = new Set(E[arm].map(key));
      const onlyB = E.base.filter(e => !SC.has(key(e))), onlyC = E[arm].filter(e => !SB.has(key(e)));
      const pB = {}; onlyB.forEach(e => (pB[pos(e)] = pB[pos(e)] || []).push(e)); const used = new Set();
      const rec = (e, c) => { const bd = e[3], ad = e[1]; const scope = sunTrain && (bd === 'sun' || bd === 'mon');
        bump(arm + ' | ' + grp + ' | class ' + c + ' | ' + (scope ? 'IN SCOPE (B on sun/mon)' : 'ELSEWHERE'));
        bump(arm + ' | ' + grp + ' | class ' + c + ' | B ' + bd + ' A ' + ad + ' (A->B calendar gap ' + (dix(e[2], e[3]) - dix(e[0], e[1])) + ')');
        bump(arm + ' | mix ' + x.mix + ' | ' + grp + ' | ' + (scope ? 'in-scope' : 'elsewhere'));
        bump(arm + ' | ' + grp + ' | ' + (scope ? 'in-scope' : 'elsewhere') + ' TOTAL');
        if(!scope) ex(arm + ' elsewhere class ' + c, x.mix + ' ' + x.c.equipment + '/' + x.c.liftingFocus + '/' + x.c.experience + ' rest ' + x.c.restDays.join(',') + ' seed ' + x.c.seed + ' :: ' + e.join(' ')); };
      onlyC.forEach(e => { const m = (pB[pos(e)] || []).find(z => !used.has(z));
        if(m){ used.add(m); rec(e, (m[7] === e[7]) ? 'A (yesterday differs, same rename)' : (m[0] === e[0] && m[1] === e[1]) ? 'B (same yesterday, outcome differs)' : 'A+B (yesterday and outcome differ)'); }
        else rec(e, 'C (candidate only)'); });
      onlyB.filter(e => !used.has(e)).forEach(e => rec(e, 'D (V218 only)'));
    } }
  const f = path.join(SCR, 'fu_k2a_' + K + '.json'); if(fs.existsSync(f)) fs.unlinkSync(f); fs.writeFileSync(f, JSON.stringify({ T, EX, inertBad })); console.log('shard ' + K + ' ok'); process.exit(0);
}
if(MODE === '--k2a-merge'){ const N = +process.argv[3], T = {}, EX = {}; let ib = 0;
  for(let s = 0; s < N; s++){ const f = path.join(SCR, 'fu_k2a_' + s + '.json'); if(!fs.existsSync(f)){ console.log('MISSING SHARD ' + s + ' -> FAILED'); process.exit(2); }
    const o = JSON.parse(fs.readFileSync(f, 'utf8')); ib += o.inertBad; Object.keys(o.T).forEach(k => T[k] = (T[k] || 0) + o.T[k]); Object.keys(o.EX).forEach(k => EX[k] = (EX[k] || []).concat(o.EX[k]).slice(0, 4)); }
  console.log('instrument not inert on sampled builds: ' + ib); Object.keys(T).sort().forEach(k => console.log('  ' + k + ': ' + T[k]));
  Object.keys(EX).sort().forEach(k => console.log('EX ' + k + '\n   ' + EX[k].join('\n   '))); process.exit(0); }

// ── Q3 (coach's amended D167): card-event weekday histograms on the D167 lattice. ORACLE: Monday-start date arithmetic.
//   node tests/measure/v219_followups.js --k2days i n ; --k2days-merge n
// A "card event" is a calendar day whose shipped JSON differs between the two arms. Cascade = a mid-week (tue..sat) event
// whose previous calendar day is also an event in the same program.
if(MODE === '--k2days'){
  const K = +process.argv[3], N = +process.argv[4];
  const CS = fs.readFileSync(REPO + '/tests/measure/v219_chain_rebaseline.js', 'utf8');
  const U = new Function('cl', 'fixtures', 'DAYS', CS.slice(CS.indexOf('const GOALS = [['), CS.indexOf('const LATN =')) + '\nreturn U;')(cl, fixtures, DAYS).filter(x => x.lat === 'C');
  const X = { base: load('/tmp/base_V218.html'), s1a: load('/tmp/v219_cf_step1a_d167only.html'), s1: load('/tmp/v219_cf_step1.html') };
  const OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}, ISO = Object.keys(OFF);
  const T = {}, EX = {}; const bump = k => T[k] = (T[k] || 0) + 1; const ex = (k, s) => { EX[k] = EX[k] || []; if(EX[k].length < 6) EX[k].push(s); };
  const noDet = y => JSON.stringify(y, (k, v) => k === 'detail' ? undefined : v);
  for(let i = K; i < U.length; i += N){ const x = U[i]; const P = {}; Object.keys(X).forEach(a => P[a] = X[a].buildProgram(cl(x.c)));
    const sunRest = x.c.restDays.includes('sun'); const tag = x.mix + ' ' + x.c.equipment + '/' + x.c.liftingFocus + '/' + x.c.experience + ' rest ' + x.c.restDays.join(',') + ' seed ' + x.c.seed;
    const ev = (a, b) => { const S = new Set(); Object.keys(P[a].weeks).forEach(w => ISO.forEach(d => { const ya = P[a].weeks[w] && P[a].weeks[w][d], yb = P[b].weeks[w] && P[b].weeks[w][d]; if(JSON.stringify(ya) !== JSON.stringify(yb)) S.add((w - 1) * 7 + OFF[d]); })); return S; };
    const A = ev('base', 's1a');
    A.forEach(ix => { const w = Math.floor(ix / 7) + 1, d = ISO[ix % 7]; bump('K2a days ' + d + ((d === 'sun' || d === 'mon') ? (sunRest ? ' | sunday REST config' : ' | sunday TRAINING config') : ''));
      if(d !== 'sun' && d !== 'mon'){ if(A.has(ix - 1)){ bump('K2a CASCADE mid-week (previous calendar day also changed)'); ex('K2a cascade', tag + ' W' + w + ' ' + d); } else { bump('K2a MID-WEEK NOT A CASCADE'); ex('K2a non-cascade', tag + ' W' + w + ' ' + d); } }
      if(d === 'mon' && A.has(ix - 1)) bump('K2a mon event whose sunday also changed'); });
    const B = ev('s1a', 's1');
    B.forEach(ix => { const w = Math.floor(ix / 7) + 1, d = ISO[ix % 7]; const ya = P.s1a.weeks[w][d], yb = P.s1.weeks[w][d];
      bump('K2b days ' + d + ' | ' + (w === P.s1.totalWeeks ? 'final week' : 'W' + w + ' of ' + P.s1.totalWeeks));
      if(noDet(ya) !== noDet(yb)) { bump('K2b NOT detail-only'); ex('K2b not detail-only', tag + ' W' + w + ' ' + d); return; }
      const ch = []; (ya.sections || []).forEach((s, si) => (s.items || []).forEach((it, ii) => { const z = yb.sections[si].items[ii]; if(it.detail !== z.detail) ch.push([it.detail, z.detail]); }));
      const rpeOnly = ch.every(([p, q]) => p.replace(/RPE.*$/, '') === q.replace(/RPE.*$/, '') && /RPE/.test(p) && /RPE/.test(q));
      bump('K2b detail changes ' + (rpeOnly ? 'RPE text only' : 'NON-RPE text')); ch.forEach(([p, q]) => bump('K2b text ' + p.replace(/^.*?(RPE)/, '$1') + ' -> ' + q.replace(/^.*?(RPE)/, '$1')));
      if(!rpeOnly) ex('K2b non-RPE', tag + ' W' + w + ' ' + d + ' ' + JSON.stringify(ch)); });
  }
  const f = path.join(SCR, 'fu_k2d_' + K + '.json'); if(fs.existsSync(f)) fs.unlinkSync(f); fs.writeFileSync(f, JSON.stringify({ T, EX })); console.log('shard ' + K + ' ok'); process.exit(0);
}
if(MODE === '--k2days-merge'){ const N = +process.argv[3], T = {}, EX = {};
  for(let s = 0; s < N; s++){ const f = path.join(SCR, 'fu_k2d_' + s + '.json'); if(!fs.existsSync(f)){ console.log('MISSING SHARD ' + s + ' -> FAILED'); process.exit(2); }
    const o = JSON.parse(fs.readFileSync(f, 'utf8')); Object.keys(o.T).forEach(k => T[k] = (T[k] || 0) + o.T[k]); Object.keys(o.EX).forEach(k => EX[k] = (EX[k] || []).concat(o.EX[k]).slice(0, 8)); }
  Object.keys(T).sort().forEach(k => console.log('  ' + k + ': ' + T[k])); Object.keys(EX).sort().forEach(k => console.log('EX ' + k + '\n   ' + EX[k].join('\n   '))); process.exit(0); }
