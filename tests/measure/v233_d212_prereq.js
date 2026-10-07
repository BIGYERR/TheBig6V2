// v233_d212_prereq.js — measure mD (Post-V233, no build). Prerequisites for coach's D212 (the forward form of g219 R2).
//
//   node tests/measure/v233_d212_prereq.js run <label> <artifact.html> <out.json> [s4]
//   node tests/measure/v233_d212_prereq.js report <out1.json> ...
//   MD_SET=injwide node ... run ...   sweeps every injured config in U instead of the swept subset.
//
// LATTICE: g219 HEAD's lattice + swept subset, read verbatim from `git show HEAD:tests/gates/g219_d167_pairs.js`
//   (same extraction as v233_r2_repeats.js). 5,310 configs; healthy = x.ik==='healthy'.
// ORACLE (hand-typed from post_v233_ruling_d212.md, never from the engine): FAMILY by equipment tier; membership by name only,
//   no _pattern / isTrackableWeight consulted. CARDS: shipped program, Monday-start calendar, every adjacent pair of training days.
//   A family member X on B, outside Main/Primer/Power on B, whose name is anywhere on A's card = a delt repeat.
//   VIOLATION: some other gear-legal family member is on neither A's nor B's shipped card. LICENSED: none missing.
// D160 HAZARD instrument (descriptive): inert deep-copy snapshots of `weeks` right after deconflictAdjacentDupes returns (POSTDD)
//   and right before d18LongRunDayPass (PRE18). A violation whose missing member sat on A or B in a snapshot = a false FAIL
//   in the coach's sense only when the member sat on B (the dedupe excludes LIVE-B names; A is read post-D18). Inertness: progDigest vs the plain artifact every 40th config.
// s4: tests/sabotage/v219.json S4-D167 applied (anchor count==1 asserted).
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const { load, progDigest, fixtures, DAYS } = require(path.join(ROOT, 'tests', 'harness.js'));
const cl = o => JSON.parse(JSON.stringify(o)), cnt = (s, a) => s.split(a).length - 1;
const OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}, ISO = Object.keys(OFF);
const SCR = process.env.MD_SCRATCH || path.join(ROOT, '.mdtmp');
const DB = ['Dumbbell lateral raise','Dumbbell front raise','Dumbbell rear delt fly'], CABLE = ['Cable lateral raise','Face pull'];
const FAMILY = { crossfit:DB, commercial:DB.concat(CABLE), home_full:DB, home_basic:DB, minimal:DB, bodyweight:[] };
const ALLFAM = new Set(DB.concat(CABLE).map(s => s.toLowerCase()));
const NEAR = /lateral raise|front raise|rear delt|face pull|delt fly|reverse fly|upright row|y-raise|\by raise/i;

function lattice(){
  const src = cp.execFileSync('git', ['show', 'HEAD:tests/gates/g219_d167_pairs.js'], { cwd:ROOT, maxBuffer:1 << 26 }).toString();
  const a = src.indexOf('// ── lattice'), b = src.indexOf('// ── hand pattern');
  if(a < 0 || b < 0) throw new Error('lattice markers not found in HEAD g219');
  return new Function('cl', 'fixtures', 'DAYS', src.slice(a, b) + '\nreturn { U, SW, SUNREST };')(cl, fixtures, DAYS);
}
const calOf = p => { const m = {}; Object.keys((p && p.weeks) || {}).forEach(w => ISO.forEach(d => { const y = p.weeks[w] && p.weeks[w][d]; if(y !== undefined) m[(+w - 1) * 7 + OFF[d]] = { w:+w, d, y }; })); return m; };
const calW = W => calOf({ weeks:W });
const trains = y => !!(y && !y.rest && Array.isArray(y.sections));
const namesOn = y => new Set((trains(y) ? y.sections : []).flatMap(s => ((s && s.items) || []).map(i => String((i && i.name) || '').toLowerCase())));
const isMainSec = s => /^(main|primer|power)/i.test((s && s.label) || '');
const bk = d => d === 'sat' ? 'sat>sun' : d === 'sun' ? 'sun>mon' : 'interior';

if(process.argv[2] === 'run'){
  const [, , , label, art, out, flag] = process.argv;
  fs.mkdirSync(SCR, { recursive:true });
  let H = fs.readFileSync(art, 'utf8');
  if(flag === 's4'){ const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/sabotage/v219.json'), 'utf8'));
    const m = (Array.isArray(spec) ? spec : (spec.mutations || spec.specs)).find(z => /^S4-D167/.test(z.name));
    if(cnt(H, m.anchor) !== 1) throw new Error('S4 anchor count ' + cnt(H, m.anchor)); H = H.replace(m.anchor, () => m.replacement); }
  const A1 = 'deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);', A2 = 'd18LongRunDayPass(weeks);';
  if(cnt(H, A1) !== 1 || cnt(H, A2) !== 1) throw new Error('instrument anchors ' + cnt(H, A1) + '/' + cnt(H, A2) + ' in ' + label);
  const fPlain = path.join(SCR, label + '.plain.html'), fInst = path.join(SCR, label + '.inst.html');
  fs.writeFileSync(fPlain, H);
  fs.writeFileSync(fInst, H.replace(A1, () => A1 + ' try{globalThis.__POSTDD=JSON.parse(JSON.stringify(weeks));}catch(e){}')
                            .replace(A2, () => 'try{globalThis.__PRE18=JSON.parse(JSON.stringify(weeks));}catch(e){} ' + A2));
  const I = load(fInst), P = load(fPlain);
  const { U, SW } = lattice();
  const T = {}, VIO = [], LIC = [], HAZ = [], bump = (k, n = 1) => { T[k] = (T[k] || 0) + n; };
  // MD_SET=injwide: every injured config in U (not only the swept subset), for the injured watch beyond the 60.
  const LIST = process.env.MD_SET === 'injwide' ? U.map((x, i) => i).filter(i => U[i].ik !== 'healthy') : SW;
  for(let q = 0; q < LIST.length; q++){ const i = LIST[q], x = U[i]; const hk = x.ik === 'healthy' ? 'H' : 'INJ';
    I.eval('globalThis.__POSTDD=null;globalThis.__PRE18=null');
    let p; try { p = I.buildProgram(cl(x.c)); } catch(e){ bump('CRASH ' + hk); continue; }
    const S1 = I.eval('globalThis.__POSTDD'), S2 = I.eval('globalThis.__PRE18');
    if(!S1 || !S2) bump('snapshot missing ' + hk);
    const c1 = calW(S1 || {}), c2 = calW(S2 || {});
    bump('cfg ' + hk); if(hk === 'INJ') bump('cfg INJ ' + x.ik);
    if(q % 40 === 0){ bump('inert sampled'); if(progDigest(P.buildProgram(cl(x.c))) !== progDigest(p)) bump('inert FAIL'); }
    const fam = FAMILY[x.c.equipment]; if(!fam) { bump('UNKNOWN EQ ' + x.c.equipment); continue; }
    const famL = fam.map(s => s.toLowerCase());
    const c = calOf(p);
    Object.keys(c).map(Number).forEach(ix => { const a = c[ix], b = c[ix + 1]; if(!a || !b || !trains(a.y) || !trains(b.y)) return;
      const pt = bk(a.d), nA = namesOn(a.y), nB = namesOn(b.y); bump('pairs ' + hk + ' ' + pt);
      b.y.sections.forEach(sec => ((sec && sec.items) || []).forEach(it => { const n = String((it && it.name) || '').toLowerCase();
        if(!n || isMainSec(sec)) return;
        if(NEAR.test(n) && !ALLFAM.has(n)) bump('NEAR-MISS name ' + it.name);
        if(!ALLFAM.has(n)) return;
        if(!famL.includes(n)) bump('member off its gear tier ' + x.c.equipment + ' ' + it.name);
        if(!nA.has(n)) return;
        const miss = famL.filter(z => z !== n && !nA.has(z) && !nB.has(z));
        const r = { i, mix:x.mix, goal:(x.c.cardioGoals.run || {}).id, eq:x.c.equipment, f:x.c.liftingFocus, e:x.c.experience, rest:x.c.restDays.join(','), ik:x.ik, w:a.w, dA:a.d, dB:b.d, pt, name:it.name, sec:sec.label, miss };
        bump('REP ' + hk + ' ' + pt); bump('REP ' + hk + ' name=' + it.name);
        // D160 hazard: missing member present in a pre-ship snapshot on A or B
        const snapHas = (cc, z) => { const sa = cc[ix], sb = cc[ix + 1]; return (sa && namesOn(sa.y).has(z)) || (sb && namesOn(sb.y).has(z)); };
        const strippedAny = famL.filter(z => z !== n && !nA.has(z) && !nB.has(z) && (snapHas(c1, z) || snapHas(c2, z)));
        // D160 false FAIL is B-side only: the engine reads A through _d18View (post-D18) but excludes candidates on LIVE B,
        // so a missing member that sat on B at dedupe and was stripped later is the hazard. A-side presence is recorded apart
        // (hazA): the engine never saw it as yesterday's work, so a FAIL there is a true FAIL.
        const onSnapB = (cc, z) => { const sb = cc[ix + 1]; return !!(sb && namesOn(sb.y).has(z)); };
        if(miss.length){ bump('VIOL ' + hk + ' ' + pt); r.haz = miss.filter(z => onSnapB(c1, z) || onSnapB(c2, z));
          r.hazA = miss.filter(z => !r.haz.includes(z) && (snapHas(c1, z) || snapHas(c2, z)));
          if(r.haz.length) bump('D160 falseFAIL ' + hk + ' ' + pt);
          if(r.hazA.length) bump('A-side stripped (true FAIL) ' + hk + ' ' + pt);
          if(VIO.length < 400) VIO.push(r); }
        else { bump('LIC ' + hk + ' ' + pt); if(LIC.length < 400) LIC.push(r); }
        if(strippedAny.length){ bump('D160 exposure (member stripped after dedupe) ' + hk); if(HAZ.length < 50) HAZ.push(Object.assign({ stripped:strippedAny }, r)); }
      })); });
  }
  fs.writeFileSync(out, JSON.stringify({ label, T, VIO, LIC, HAZ }));
  console.log(label, 'done', JSON.stringify(T).length);
  process.exit(0);
}

if(process.argv[2] === 'report'){
  const R = process.argv.slice(3).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  const g = (r, k) => r.T[k] || 0, sum3 = (r, p) => ['sat>sun','sun>mon','interior'].map(b => g(r, p + ' ' + b));
  console.log('label | cfg H/INJ | crash | inert fail/sampled | snapshot missing | H REP s>s/s>m/int | H VIOL s>s/s>m/int | H LIC s>s/s>m/int | INJ REP | INJ VIOL | D160 falseFAIL H/INJ | D160 exposure H/INJ');
  R.forEach(r => console.log([r.label, g(r,'cfg H') + '/' + g(r,'cfg INJ'), g(r,'CRASH H') + g(r,'CRASH INJ'), g(r,'inert FAIL') + '/' + g(r,'inert sampled'),
    g(r,'snapshot missing H') + g(r,'snapshot missing INJ'), sum3(r,'REP H').join('/'), sum3(r,'VIOL H').join('/'), sum3(r,'LIC H').join('/'),
    sum3(r,'REP INJ').join('/'), sum3(r,'VIOL INJ').join('/'),
    sum3(r,'D160 falseFAIL H').reduce((a,b)=>a+b,0) + '/' + sum3(r,'D160 falseFAIL INJ').reduce((a,b)=>a+b,0),
    g(r,'D160 exposure (member stripped after dedupe) H') + '/' + g(r,'D160 exposure (member stripped after dedupe) INJ'),
    'A-side stripped H ' + sum3(r,'A-side stripped (true FAIL) H').join('/')].join(' | ')));
  R.forEach(r => { const other = Object.keys(r.T).filter(k => /^(REP . name|REP INJ name|NEAR|member off|UNKNOWN|cfg INJ )/.test(k));
    console.log('\n== ' + r.label + ' ' + other.map(k => k + ' ' + r.T[k]).join(', '));
    const seg = {}; r.VIO.forEach(z => ['ik','mix','goal','eq','f','e','name','sec','w'].forEach(d => { const s = d + '=' + (d === 'sec' ? String(z.sec).replace(/[—–].*$/, '').trim() : z[d]) + (z.ik === 'healthy' ? '' : ' [INJ]'); seg[s] = (seg[s] || 0) + 1; }));
    if(r.VIO.length) console.log('  VIOL seg (' + r.VIO.length + ' recorded): ' + Object.entries(seg).sort((a,b) => b[1]-a[1]).map(([s,n]) => s + ' ' + n).join(', '));
    const cfgs = new Set(r.VIO.filter(z => z.ik === 'healthy').map(z => z.i)); if(r.VIO.length) console.log('  VIOL healthy configs ' + cfgs.size);
    r.VIO.filter(z => z.ik !== 'healthy').slice(0, 6).concat(r.VIO.filter(z => z.ik === 'healthy').slice(0, 3)).forEach(z => console.log('  VIOL #' + z.i + ' ' + z.mix + ' ' + z.goal + ' ' + z.eq + '/' + z.f + '/' + z.e + ' rest ' + z.rest + ' ' + z.ik + ' W' + z.w + ' ' + z.dA + '>' + z.dB + ' ' + z.name + ' [' + z.sec + '] missing=' + JSON.stringify(z.miss) + ' haz=' + JSON.stringify(z.haz)));
    const ls = {}; r.LIC.forEach(z => { const s = z.name + ' ' + z.eq + ' ' + z.pt + (z.ik === 'healthy' ? '' : ' INJ'); ls[s] = (ls[s] || 0) + 1; });
    console.log('  LIC seg: ' + Object.entries(ls).map(([s,n]) => s + ' ' + n).join(', ') + ' | configs ' + new Set(r.LIC.map(z => z.i)).size);
    r.HAZ.slice(0, 3).forEach(z => console.log('  EXPOSURE #' + z.i + ' ' + z.ik + ' W' + z.w + ' ' + z.dA + '>' + z.dB + ' ' + z.name + ' stripped=' + JSON.stringify(z.stripped)));
  });
}
