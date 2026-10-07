// v233_r2_repeats.js — measure mS4 (Post-V233, no build). The before-picture for g219 row R2
// ("CAND calendar repeats sat>sun 28, sun>mon 6"), retired/parked in the forward rewrite R9.
//
//   node tests/measure/v233_r2_repeats.js run <label> <artifact.html> <out.json> [s4] [shard/n]
//   node tests/measure/v233_r2_repeats.js report <out1.json> <out2.json> ...
//
// LATTICE: g219's lattice and swept subset, read VERBATIM out of `git show HEAD:tests/gates/g219_d167_pairs.js`
//   (the block between "// ── lattice" and "// ── hand pattern"), so the working-tree rewrite cannot move it.
// COUNT: g219 HEAD row R2's own `reps()` logic, copied: Monday-start calendar index (w-1)*7+{mon..sun}; for each
//   calendar day A and day A+1 that both train, every item on A+1 whose lower-cased name is on A's card (any section),
//   NOT in a Main/Primer/Power section, and eligible under the FROZEN V218 lens (isTrackableWeight && _pattern read off
//   git 44fd483). Bucket by A's weekday: sat>sun, sun>mon, interior. The artifact's own lens is never consulted.
// INSTRUMENT (descriptive only, not the oracle): an inert logging line before `if(!cands.length) return;` records
//   cands.length at every dedupe decision, so the 0 / 1 / >=2 split (what S4 moves) can be printed. Inertness is
//   checked by progDigest against the uninstrumented artifact on every 40th config.
// s4: applies tests/sabotage/v219.json S4-D167 (anchor -> replacement, count==1 asserted) before loading.
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const { load, progDigest, fixtures, DAYS } = require(path.join(ROOT, 'tests', 'harness.js'));
const cl = o => JSON.parse(JSON.stringify(o)), cnt = (s, a) => s.split(a).length - 1;
const OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}, ISO = Object.keys(OFF);
const V218_COMMIT = '44fd4830f9653e790aa43477787374cd29711988';
const SCR = process.env.MS4_SCRATCH || path.join(ROOT, '.ms4tmp');

function lattice(){
  const src = cp.execFileSync('git', ['show', 'HEAD:tests/gates/g219_d167_pairs.js'], { cwd:ROOT, maxBuffer:1 << 26 }).toString();
  const a = src.indexOf('// ── lattice'), b = src.indexOf('// ── hand pattern');
  if(a < 0 || b < 0) throw new Error('lattice markers not found in HEAD g219');
  const body = src.slice(a, b) + '\nreturn { U, SW, SUNREST };';
  return new Function('cl', 'fixtures', 'DAYS', body)(cl, fixtures, DAYS);
}
const calOf = p => { const m = {}; Object.keys((p && p.weeks) || {}).forEach(w => ISO.forEach(d => { const y = p.weeks[w] && p.weeks[w][d]; if(y !== undefined) m[(+w - 1) * 7 + OFF[d]] = { w:+w, d, y }; })); return m; };
const trains = y => !!(y && !y.rest && Array.isArray(y.sections));
const namesOn = y => new Set((trains(y) ? y.sections : []).flatMap(s => ((s && s.items) || []).map(i => String((i && i.name) || '').toLowerCase())));
const isMainSec = s => /^(main|primer|power)/i.test((s && s.label) || '');

if(process.argv[2] === 'run'){
  const [, , , label, art, out, flag, shardArg] = process.argv;
  const [si, sn] = (shardArg || '0/1').split('/').map(Number);
  fs.mkdirSync(SCR, { recursive:true });
  let H = fs.readFileSync(art, 'utf8');
  const ANCH = 'if(!cands.length) return;';
  if(flag === 's4'){ const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/sabotage/v219.json'), 'utf8'));
    const m = (Array.isArray(spec) ? spec : (spec.mutations || spec.specs)).find(z => /^S4-D167/.test(z.name));
    if(cnt(H, m.anchor) !== 1) throw new Error('S4 anchor count ' + cnt(H, m.anchor)); H = H.replace(m.anchor, () => m.replacement); }
  const ANCH2 = flag === 's4' ? 'if(cands.length<2) return;' : ANCH;
  const nA = cnt(H, ANCH2); if(nA !== 1) throw new Error('instrument anchor count ' + nA + ' in ' + label);
  const LOG = 'try{(globalThis.__MS4||(globalThis.__MS4=[])).push([String(dA),String(dB),cands.length]);}catch(e){}\n        ';
  const fPlain = path.join(SCR, label + '.plain.html'), fInst = path.join(SCR, label + '.inst.html');
  fs.writeFileSync(fPlain, H); fs.writeFileSync(fInst, H.replace(ANCH2, () => LOG + ANCH2));
  const I = load(fInst), P = load(fPlain), V = load(execV218());
  const TW = V.eval('isTrackableWeight'), PAT = V.eval('_pattern');
  const { U, SW, SUNREST } = lattice();
  const T = {}, REP = [], bump = (k, n = 1) => { T[k] = (T[k] || 0) + n; };
  for(let q = si; q < SW.length; q += sn){ const i = SW[q], x = U[i];
    I.eval('globalThis.__MS4=[]'); const p = I.buildProgram(cl(x.c)); const L = I.eval('globalThis.__MS4') || [];
    bump('cfg'); bump('cfg ' + (SUNREST(x) ? 'sunREST' : 'sunTRAIN'));
    if(q % 40 === 0){ bump('inert sampled'); if(progDigest(P.buildProgram(cl(x.c))) !== progDigest(p)) bump('inert FAIL'); }
    L.forEach(([dA, dB, n]) => { const pt = dA === 'sat' ? 'sat>sun' : dA === 'sun' ? 'sun>mon' : 'interior'; bump('dec ' + pt + ' n=' + (n === 0 ? '0' : n === 1 ? '1' : '2+')); });
    const c = calOf(p); let progReps = 0;
    Object.keys(c).map(Number).forEach(ix => { const a = c[ix], b = c[ix + 1]; if(!a || !b || !trains(a.y) || !trains(b.y)) return;
      const pt = a.d === 'sat' ? 'sat>sun' : a.d === 'sun' ? 'sun>mon' : 'interior'; const nA2 = namesOn(a.y); bump('pairs ' + pt);
      b.y.sections.forEach(sec => ((sec && sec.items) || []).forEach(it => { const n = String((it && it.name) || '').toLowerCase();
        if(!n || isMainSec(sec) || !TW(it.name) || !PAT(it.name)) return; bump('elig ' + pt);
        if(!nA2.has(n)) return; bump('R ' + pt); progReps++;
        if(pt !== 'interior') REP.push({ i, mix:x.mix, f:x.c.liftingFocus, eq:x.c.equipment, e:x.c.experience, goal:(x.c.cardioGoals.run || {}).id, rest:x.c.restDays.join(','), inj:x.ik, w:a.w, pt, name:it.name, sec:sec.label, lw:Math.max.apply(null, Object.keys(p.weeks).map(Number)) }); })); });
    if(progReps) bump('programs with any repeat');
  }
  fs.writeFileSync(out, JSON.stringify({ label, T, REP }));
  process.exit(0);
}
function execV218(){ const f = path.join(SCR, 'v218.html'); if(!fs.existsSync(f)) fs.writeFileSync(f, cp.execFileSync('git', ['show', V218_COMMIT + ':index.html'], { cwd:ROOT, maxBuffer:1 << 27 })); return f; }

if(process.argv[2] === 'report'){
  const R = {}; process.argv.slice(3).forEach(f => { const r = JSON.parse(fs.readFileSync(f, 'utf8')); const k = r.label.replace(/#\d+$/, '');
    R[k] = R[k] || { T:{}, REP:[] }; Object.keys(r.T).forEach(z => R[k].T[z] = (R[k].T[z] || 0) + r.T[z]); R[k].REP.push(...r.REP); });
  const g = (k, z) => R[k].T[z] || 0;
  console.log('label | cfg (sunTRAIN/sunREST) | R sat>sun / sun>mon / interior | pairs sat>sun / sun>mon | elig items sat>sun / sun>mon | programs w/ any repeat | dedupe decisions sat>sun n=0/1/2+ ; sun>mon n=0/1/2+ ; interior n=0/1/2+ | inert fail/sampled');
  Object.keys(R).forEach(k => console.log([k, g(k,'cfg') + ' (' + g(k,'cfg sunTRAIN') + '/' + g(k,'cfg sunREST') + ')', g(k,'R sat>sun') + '/' + g(k,'R sun>mon') + '/' + g(k,'R interior'),
    g(k,'pairs sat>sun') + '/' + g(k,'pairs sun>mon'), g(k,'elig sat>sun') + '/' + g(k,'elig sun>mon'), g(k,'programs with any repeat'),
    ['sat>sun','sun>mon','interior'].map(pt => ['0','1','2+'].map(n => g(k,'dec ' + pt + ' n=' + n)).join('/')).join(' ; '), g(k,'inert FAIL') + '/' + g(k,'inert sampled')].join(' | ')));
  const key = z => [z.i, z.w, z.pt, z.name.toLowerCase()].join('|');
  const ks = Object.keys(R);
  for(let j = 1; j < ks.length; j++){ const A = new Set(R[ks[j-1]].REP.map(key)), B = new Set(R[ks[j]].REP.map(key));
    const add = R[ks[j]].REP.filter(z => !A.has(key(z))), gone = R[ks[j-1]].REP.filter(z => !B.has(key(z)));
    if(add.length || gone.length){ console.log('\nDELTA ' + ks[j-1] + ' -> ' + ks[j] + ': +' + add.length + ' -' + gone.length);
      add.concat(gone.map(z => Object.assign({ GONE:1 }, z))).slice(0, 60).forEach(z => console.log('  ' + (z.GONE ? '-' : '+') + ' #' + z.i + ' ' + z.mix + ' ' + z.goal + ' ' + z.eq + '/' + z.f + '/' + z.e + ' rest ' + z.rest + ' ' + z.inj + ' W' + z.w + '/' + z.lw + ' ' + z.pt + ' ' + z.name + ' [' + z.sec + ']')); } }
  ks.forEach(k => { const seg = {}; R[k].REP.forEach(z => ['mix','f','eq','e','goal','name','sec'].forEach(d => { const s = d + '=' + (d === 'sec' ? String(z.sec).replace(/[—–].*$/, '').trim() : z[d]); seg[s] = (seg[s] || 0) + 1; }));
    console.log('\nSEG ' + k + ' (' + R[k].REP.length + ' sat>sun+sun>mon repeats): ' + Object.entries(seg).sort((a, b) => b[1] - a[1]).map(([s, n]) => s + ' ' + n).join(', ')); });
}

// node tests/measure/v233_r2_repeats.js week <cfgIndex> <week> <armA.html> <armB.html>
//   prints Sat, Sun of week W and Mon of W+1 (non-Main items, section label) on both arms, marking calendar repeats.
if(process.argv[2] === 'week'){
  const [, , , iS, wS, fa, fb] = process.argv; const i = +iS, W = +wS; const { U } = lattice(); const x = U[i];
  const V = load(execV218()), TW = V.eval('isTrackableWeight'), PAT = V.eval('_pattern');
  console.log('cfg #' + i + ' ' + x.mix + ' goal ' + (x.c.cardioGoals.run || {}).id + ' ' + x.c.equipment + '/' + x.c.liftingFocus + '/' + x.c.experience + ' rest ' + x.c.restDays.join(',') + ' ' + x.ik + ' seed ' + x.c.seed);
  [fa, fb].forEach(f => { const A = load(f); const p = A.buildProgram(cl(x.c)); console.log('== ' + path.basename(f));
    const days = [[W,'fri'],[W,'sat'],[W,'sun'],[W+1,'mon'],[W+1,'tue']]; let prev = null;
    days.forEach(([w, d]) => { const y = p.weeks[w] && p.weeks[w][d]; const pn = prev; prev = namesOn(y);
      if(!trains(y)){ console.log('  W' + w + ' ' + d + ': rest/none'); return; }
      console.log('  W' + w + ' ' + d + ': ' + y.sections.map(s => (s.label || '?') + ' [' + (s.items || []).map(it => { const r = pn && pn.has(String(it.name).toLowerCase()) && !isMainSec(s) && TW(it.name) && PAT(it.name); return (r ? '**' : '') + it.name + (r ? '** (also yesterday)' : ''); }).join('; ') + ']').join(' | ')); }); });
}
