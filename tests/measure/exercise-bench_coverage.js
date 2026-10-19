// Measure (Post-v0.240.0): the exercise bench before Mario's screenshot harvest.
// Question: for each block a new movement could join, how many programs reach it, on which
// equipment tiers, and which names it prints today (with counts). Healthy athletes only.
// Run: node tests/measure/exercise-bench_coverage.js index.html > tests/measure/exercise-bench_coverage.out.txt
'use strict';
const path = require('path');
const { load, fixtures, weekGrid } = require(path.join(__dirname, '..', 'harness.js'));
const IA = load(process.argv[2] || 'index.html');

const TIERS = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];
const FOCUS = ['strength', 'hypertrophy', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention'];
const EXPER = ['beginner', 'intermediate', 'advanced'];
const CARDIO = {
  run: { cardioTypes: ['run'], cardioGoals: fixtures.HALF_MANNY.cardioGoals },
  bike: { cardioTypes: ['bike'], cardioGoals: { bike: { id: 'bike_base', label: 'Base' } }, eventTargeted: false, raceDate: '' },
};
const SEEDS = [1013, 76308];

// block key for a section: core sections by pillar, everything else by label
function blockOf(s) {
  if (s.core) return 'Core: ' + String(s.coreHeader || s.pillar).replace(/^Core — /, '');
  return String(s.label || '(no label)').replace(/\s*\d+$/, '');
}
const WANT = /^(Core: |Foot & ankle|Hip stability|Power|Explosive|Conditioning|Light finisher|Loaded carry|Leg superset|Knee stability|Chest|Accessory|Calves|Leg accessory|Posterior|Main|Lunge)/i;

const reach = {};   // block -> tier -> Set(program idx)
const reachF = {};  // block -> focus|cardio -> Set(program idx)
const names = {};   // block -> name -> tier -> count
let n = 0;
const progsByTier = {};
for (const tier of TIERS) for (const focus of FOCUS) for (const exp of EXPER) for (const [ck, c] of Object.entries(CARDIO)) for (const seed of SEEDS) {
  const cfg = Object.assign(JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), c, { equipment: tier, liftingFocus: focus, experience: exp, seed, primaryPath: focus.startsWith('support_') ? 'event' : 'body' });
  let prog;
  try { prog = IA.buildProgram(cfg); } catch (e) { console.log('BUILD FAIL', tier, focus, exp, ck, seed, e.message); continue; }
  const idx = n++;
  progsByTier[tier] = (progsByTier[tier] || 0) + 1;
  for (const wk of Object.keys(prog.weeks || {})) for (const d of Object.keys(prog.weeks[wk])) {
    const day = prog.weeks[wk][d];
    for (const s of (day && day.sections) || []) {
      const b = blockOf(s);
      if (!WANT.test(b)) continue;
      ((reach[b] = reach[b] || {})[tier] = reach[b][tier] || new Set()).add(idx);
      ((reachF[b] = reachF[b] || {})[focus + '|' + ck] = reachF[b][focus + '|' + ck] || new Set()).add(idx);
      for (const it of s.items || []) {
        const nm = String(it.name || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
        const r = ((names[b] = names[b] || {})[nm] = names[b][nm] || {});
        r[tier] = (r[tier] || 0) + 1;
      }
    }
  }
}
console.log(`PROGRAMS ${n} (per tier ${JSON.stringify(progsByTier)}) = ${TIERS.length} tiers x ${FOCUS.length} focuses x ${EXPER.length} exp x 2 cardio (run half, bike base) x ${SEEDS.length} seeds, healthy`);
console.log('Per block: programs reaching it per tier (of ' + n / TIERS.length + '), then each name with prints per tier [bw min hb hf com cf].\n');
for (const b of Object.keys(names).sort()) {
  const rr = TIERS.map(t => (reach[b][t] ? reach[b][t].size : 0));
  console.log(`## ${b}   reach ${rr.join('/')}   distinct names ${Object.keys(names[b]).length}`);
  if (!/^Main/.test(b)) console.log('   by focus (run/bike, of ' + (TIERS.length * EXPER.length * SEEDS.length) + '): ' + FOCUS.map(f => f + ' ' + ['run', 'bike'].map(ck => (reachF[b][f + '|' + ck] || new Set()).size).join('/')).join(', '));
  const rows = Object.entries(names[b]).map(([nm, r]) => [nm, TIERS.map(t => r[t] || 0)]).sort((a, z) => z[1].reduce((p, q) => p + q, 0) - a[1].reduce((p, q) => p + q, 0));
  for (const [nm, r] of rows) console.log(`   ${nm.padEnd(46)} ${r.join(' ')}`);
}
console.log('\n## HALF_MANNY, the blocks above, week by week');
const hm = IA.buildProgram(fixtures.HALF_MANNY);
const lines = weekGrid(hm).split('\n');
for (const l of lines) {
  const keep = l.split(' | ').filter(p => /Foot & ankle|Hip stability|Core|Power|Carry|Conditioning|finisher/i.test(p)).join(' | ');
  if (keep) console.log(l.split(' :: ')[0] + ' :: ' + keep.replace(/^.* :: /, ''));
}
