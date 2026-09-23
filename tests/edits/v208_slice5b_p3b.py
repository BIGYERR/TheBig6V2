#!/usr/bin/env python3
# V208 slice 5b — D104a era row for g205_pace_eve P3b (coach, re-ruling point 5). Test file ONLY.
# <=207 keeps the old row ("run_base keeps the 48h branch on every layout"). >=208 the row reads
# exactly: "run_base places by the run shape (D104a); the 48h branch is reached only by a program with
# no long-keyed run in any week." Its predicate, per program: a program with a long-keyed run in any
# week prints coach's run_base note (typed here) and never the 48h branch; a program without one
# prints no note or a 48h tier (the three V153 openings, typed here); nobody prints the D36 note; and
# the lattice reaches a long-keyed program (non-vacuity). An artifact no row covers fails P3b-ERA.
# The lattice is the old row's, built once; the old row's D36 count is the same predicate carries()
# computes. Anchor asserted count==1; nothing written on a miss.
import sys
F = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g205_pace_eve.js'
s = open(F, encoding='utf-8').read()
A = """let baseSeen = 0, baseTot = 0;
[3, 2].forEach(nRest => combos(DAYS, nRest).forEach(rest => SEEDS.forEach(seed => {
  const c = paceCfg(rest, seed);
  c.cardioGoals = { run:{ id:'run_base', label:'Base', baselineDist:'3', baseline:'3mi', mileBestMins:'8', mileBestSecs:'30' } };
  baseTot++; if(carries(c)) baseSeen++;
})));
ok('P3b run_base keeps the 48h branch on every layout (' + baseTot + ' programs)', baseSeen === 0, baseSeen + ' carried the D36 note');
"""
B = """// P3b ERA ROWS (standing ruling 4). D104a (V208) moved run_base onto the run shape: at 208 and
// above a program with a long-keyed run in any week prints coach's run_base note, and only a program
// with no long-keyed run reaches the 48h branch. Both strings typed here from the rulings.
const D104A_BASE = 'Nothing heavy lands on your long run or the day before it. Your lifting days were placed around it.';
const TIER48_OPEN = ['Your training days are tightly packed', 'Your heavy lifting was kept off the same day as your hardest runs', 'Your heavy lifting was spaced out from your hardest runs'];
const P3B_BY_VERSION = [
  { from: 204, to: 207,      ruling: 'D127 (V205)' },
  { from: 208, to: Infinity, ruling: 'D104a (V208)' },
];
const P3B = P3B_BY_VERSION.filter(r => VER >= r.from && VER <= r.to)[0] || null;
let baseSeen = 0, baseTot = 0, baseLong = 0, baseShaped = 0, base48 = 0; const baseBad = [];
[3, 2].forEach(nRest => combos(DAYS, nRest).forEach(rest => SEEDS.forEach(seed => {
  const c = paceCfg(rest, seed);
  c.cardioGoals = { run:{ id:'run_base', label:'Base', baselineDist:'3', baseline:'3mi', mileBestMins:'8', mileBestSecs:'30' } };
  baseTot++;
  const p = IA.buildProgram(c), n = p.legRecoveryNote;
  if(n && n.indexOf(D36) >= 0) baseSeen++;
  const hasLong = Object.keys(p.weeks).some(w => DAYS.some(d => { const x = p.weeks[w][d];
    return !!x && [].concat(x.cardio || []).some(k => !!k && k.type === 'run' && !!k.dose && k.dose.key === 'long'); }));
  const via48 = n == null || TIER48_OPEN.some(t => n.startsWith(t));
  const viaShape = typeof n === 'string' && (n === D104A_BASE || n.startsWith(D104A_BASE + ' '));
  if(hasLong){ baseLong++; if(viaShape) baseShaped++; else baseBad.push('rest=[' + rest + '] seed=' + seed + ' long-keyed, note ' + JSON.stringify(n)); }
  else { if(via48) base48++; else baseBad.push('rest=[' + rest + '] seed=' + seed + ' no long key, note ' + JSON.stringify(n)); }
})));
if(!P3B) ok('P3b-ERA a P3B_BY_VERSION row covers ia-version ' + VER, false, 'no ruled P3b text at this version');
else if(P3B.to === 207) ok('P3b run_base keeps the 48h branch on every layout (' + baseTot + ' programs)', baseSeen === 0, baseSeen + ' carried the D36 note');
else {
  ok('P3b run_base places by the run shape (D104a); the 48h branch is reached only by a program with no long-keyed run in any week.',
     baseLong > 0 && baseSeen === 0 && baseBad.length === 0, baseBad.length + ' off the ruling, D36 note ' + baseSeen + ', long-keyed ' + baseLong + ': ' + baseBad.slice(0, 3).join('; '));
  console.log('     P3b ' + baseTot + ' run_base programs: ' + baseLong + ' with a long-keyed run (' + baseShaped + ' placed by the shape), '
    + (baseTot - baseLong) + ' without (' + base48 + ' on the 48h branch); D36 note ' + baseSeen);
}
"""
n = s.count(A)
if n != 1:
    sys.exit('ABORT: P3b anchor count=%d — nothing written' % n)
open(F, 'w', encoding='utf-8').write(s.replace(A, B, 1))
print('P3b era rows written to', F)
