// Measure: the power block's set count (Post-v0.249.1, the 7×3 trap bar jump Mario sent from W2 Saturday).
// Prints every power item's sets by experience, age and cost tier, the block's total sets, jumps and minutes,
// how often both slots are the same family, the HALF_MANNY digest, and which lattice programs carry power.
// Run on any body of the app: node tests/measure/power-block_set-count.js [app.html]
'use strict';
const path = require('path');
const H = require('../harness.js');
const L = require('../lattice193.js');
const app = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = H.load(app);

const GOALS = {
  pace: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi', targetMins: '12', targetSecs: '0', mileBestMins: '8', mileBestSecs: '15' },
  base: { id: 'run_base', label: 'Base', mileBestMins: '11', mileBestSecs: '0', baselineDist: '2', baseline: '2mi' },
};
const AGES = ['18-35', '36-54', '55+'];
const EXP = ['beginner', 'intermediate', 'advanced'];
const COST = n => { const N = String(n).toLowerCase();
  if (/seated box jump/.test(N)) return 1.0;
  if (/depth jump|depth fall|box jump|in-?depth/.test(N)) return 2.0;
  if (/single-?leg landing|\bsl landing\b/.test(N)) return 1.5;
  if (/single-?leg hop|single-?arm k[b] snatch|bounding|split[- ]?squat jump/.test(N)) return 1.5;
  if (/broad jump|jump squat|tuck jump|skater bound|lateral bound|trap bar jump|\bjump\b|pogo/.test(N)) return 1.0;
  if (/ball slam|wall ball|plyo push|clap push|kettlebell swing/.test(N)) return 0.5;
  if (/clean|snatch|jerk|push press|thruster/.test(N)) return 1.0;
  return 0; };
const FAMILY = n => { const N = String(n).toLowerCase();
  if (/broad jump/.test(N)) return 'horizontal jump';
  if (/single-?leg|split[- ]?squat jump|bound|skater|hop/.test(N) && !/pogo/.test(N)) return 'one-leg landing';
  if (/depth|box jump/.test(N) && !/seated/.test(N)) return 'shock';
  if (/jump|pogo/.test(N)) return 'two-leg vertical jump';
  if (/swing|clean|snatch|jerk|push press|thruster/.test(N)) return 'hip ballistic';
  return 'upper or med ball'; };
const REST = c => c >= 1.0 ? 2 : 1;   // minutes, read off _POWER_REST (3 min on 2.0 counted as 2 to stay conservative)

const rows = []; const blocks = []; let builds = 0;
function sweep(set, cfg, tag){
  builds++;
  const p = IA.buildProgram(cfg);
  for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) {
    const day = p.weeks[w][d]; if (!day || !day.sections) continue;
    for (const s of day.sections) {
      if (!/^power\b/i.test(s.label || '')) continue;
      const items = (s.items || []).map((it, ix) => {
        const m = /^(\d+)\s*[×x]\s*(\d+)/.exec(it.detail || ''), m2 = /^(\d+) sets/.exec(it.detail || '');   // a bodyweight sweep rewrites Plyo pushups to 'N sets — RPE'
        return { name: it.name, detail: it.detail, sets: m ? +m[1] : (m2 ? +m2[1] : null), reps: m ? +m[2] : (m2 ? 'rpe' : null), cost: COST(it.name), role: ix };
      });
      items.forEach(it => rows.push({ set, exp: cfg.experience, age: cfg.ageBracket || '18-35', wk: +w, ...it }));
      const fam = items.map(i => FAMILY(i.name));
      blocks.push({ set, exp: cfg.experience, sets: items.reduce((a, i) => a + (i.sets || 0), 0),
        reps: items.reduce((a, i) => a + (i.sets || 0) * (typeof i.reps === 'number' ? i.reps : 0), 0),
        mins: items.reduce((a, i) => a + (i.sets || 0) * REST(i.cost), 0),
        same: fam.length === 2 && fam[0] === fam[1], fam: fam.join(' + '), names: items.map(i => i.name + ' ' + i.detail).join(' | '),
        prog: tag, dayKey: tag + '|W' + w + d });
    }
  }
}
// Set A: the shared 864-config lattice on HALF_MANNY.
for (const c of L.FULL) sweep('lattice', { ...IA.fixtures.HALF_MANNY, ...c.over }, 'lattice ' + c.tag);
// Set B: NSW test goals, every experience and age, the focuses and tiers that build a power block.
for (const g of Object.keys(GOALS)) for (const focus of ['support_athletic', 'support_prevention']) for (const equipment of ['crossfit', 'commercial', 'home_full'])
for (const experience of EXP) for (const ageBracket of AGES) for (const seed of [1013, 3039, 76308])
  sweep('nsw', { name: 'M', primaryPath: 'test', cardioTypes: ['run'], cardioGoals: { run: GOALS[g] }, liftingFocus: focus, experience, ageBracket,
    equipment, unit: 'lbs', restDays: ['sun', 'wed'], days: H.DAYS.slice(), bench: 135, squat: 185, deadlift: 225, seed },
    ['nsw', g, focus, equipment, experience, ageBracket, seed].join(' '));

const out = [];
out.push('app ' + path.basename(app) + ' ia-version ' + IA.version + ' | builds ' + builds + ' (lattice ' + L.FULL.length + ' + nsw ' + (builds - L.FULL.length) + ')');
const hm = IA.buildProgram(IA.fixtures.HALF_MANNY), hm2 = IA.buildProgram(IA.fixtures.HALF_MANNY);
const hmPower = Object.values(hm.weeks).reduce((a, wk) => a + Object.values(wk).filter(d => d && (d.sections || []).some(s => /^power\b/i.test(s.label || ''))).length, 0);
out.push('HALF_MANNY digest ' + H.progDigest(hm) + ' (self-stable ' + (H.progDigest(hm) === H.progDigest(hm2)) + ') | days with a power block ' + hmPower);
out.push('power items ' + rows.length + ' | power blocks ' + blocks.length + ' | programs with any power block: lattice ' +
  new Set(blocks.filter(b => b.set === 'lattice').map(b => b.prog)).size + ' of ' + L.FULL.length + ', nsw ' + new Set(blocks.filter(b => b.set === 'nsw').map(b => b.prog)).size + ' of ' + (builds - L.FULL.length));
// Sets per item, by slot, cost, experience and age, non-deload weeks only (deload trims to 60%).
const key = r => 'slot ' + (r.role + 1) + ' cost ' + r.cost.toFixed(1) + ' ' + r.reps + ' reps | ' + r.exp.padEnd(12) + ' ' + r.age.padEnd(5);
const tab = {};
rows.forEach(r => { const k = key(r); (tab[k] = tab[k] || {}); tab[k][r.sets] = (tab[k][r.sets] || 0) + 1; });
out.push('\n--- sets per item (every week, deload weeks included): key -> {sets: count}');
Object.keys(tab).sort().forEach(k => out.push(k + ' -> ' + JSON.stringify(tab[k])));
const over5 = rows.filter(r => r.sets > 5).length;
out.push('\nitems over 5 sets: ' + over5 + ' of ' + rows.length + ' (' + (100 * over5 / rows.length).toFixed(1) + '%)');
out.push('items over 5 sets, cost > 0.5 only: ' + rows.filter(r => r.sets > 5 && r.cost > 0.5).length + ' of ' + rows.filter(r => r.cost > 0.5).length);
const dist = (arr, f) => { const t = {}; arr.forEach(x => { const v = f(x); t[v] = (t[v] || 0) + 1; }); return JSON.stringify(t); };
out.push('\n--- block total sets: ' + dist(blocks, b => b.sets));
out.push('--- block total reps (jumps and throws): median ' + blocks.map(b => b.reps).sort((a, b) => a - b)[Math.floor(blocks.length / 2)] + ', max ' + Math.max(...blocks.map(b => b.reps)));
out.push('--- block rest minutes (sets x rest): ' + dist(blocks, b => b.mins));
out.push('--- both slots the same family: ' + blocks.filter(b => b.same).length + ' of ' + blocks.filter(b => b.fam.includes('+')).length + ' two-item blocks');
out.push('    by pair: ' + dist(blocks.filter(b => b.same), b => b.fam));
out.push('\n--- the screenshot shape (intermediate, Trap bar jump lead):');
const seen = new Set();
blocks.filter(b => b.exp === 'intermediate' && /^Trap bar jump/.test(b.names)).forEach(b => { if (!seen.has(b.names)) { seen.add(b.names); out.push('  ' + b.names); } });
console.log(out.join('\n'));
