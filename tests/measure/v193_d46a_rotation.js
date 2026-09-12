// MEASURE v193 D46-a — rotational_power reachability per equipment tier.
// usage: node tests/measure/v193_d46a_rotation.js <file.html>
const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);

const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const SEEDS = [1013, 3039, 6078, 10130, 76308];
const clean = s => String(s||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();

const perTier = {}, woodchop = {}, thin = {}, blocks = {};
let thinTotal = 0, blocksTotal = 0, thinSample = '';
for (const e of EQUIP){
  const seen = new Set(); let wc = 0, th = 0, bl = 0;
  for (const seed of SEEDS){
    const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment: e, seed }));
    for (const wk of Object.keys(prog.weeks||{}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if(!day) continue;
        for (const s of (day.sections||[])) if (s && s.core){
          bl++;
          const names = (s.items||[]).map(i=>clean(i.name));
          if (names.length !== 2){ th++; if(!thinSample) thinSample = `${e} seed=${seed} W${wk} ${d} n=${names.length} [${names.join(', ')}]`; }
          if (s.pillar === 'rotational_power') names.forEach(n=>seen.add(n));
          wc += names.filter(n=>n==='Cable woodchoppers').length;
        }
      }
  }
  perTier[e] = [...seen].sort(); woodchop[e] = wc; thin[e] = th; blocks[e] = bl;
  thinTotal += th; blocksTotal += bl;
}

console.log('FILE ' + FILE + '  (ia-version ' + IA.version + ')');
for (const e of EQUIP)
  console.log(`  ${e.padEnd(11)} distinct rotational_power = ${String(perTier[e].length).padEnd(2)} [${perTier[e].join(' | ')}]`);
console.log('  Cable woodchoppers by tier ' + JSON.stringify(woodchop));
console.log('  core blocks by tier        ' + JSON.stringify(blocks));
console.log('  thin (<2 item) core blocks ' + JSON.stringify(thin) + `  total ${thinTotal}/${blocksTotal}`);
if (thinSample) console.log('  thin sample: ' + thinSample);

// Frozen-pair signature: ask the draw directly at the R values coach cited.
for (const tier of ['home_basic','commercial']){
  const sig = [2,4,6,8,10,12].map(R => {
    const b = IA.eval(`getDynamicCoreBlock(${R}, 'push', false, true, 0, '${tier}')`);
    return `R=${R} ${b.pillar}: ` + (b.items||[]).map(i=>clean(i.name)).join(' + ');
  });
  console.log('  hot-tomorrow draw, ' + tier + ':');
  sig.forEach(l => console.log('    ' + l));
}
for (const tier of ['home_basic','commercial']){
  const sig = [3,6,9,12,15,18].map(R => {
    const b = IA.eval(`getDynamicCoreBlock(${R}, 'push', false, false, 0, '${tier}')`);
    return `R=${R} ${b.pillar}: ` + (b.items||[]).map(i=>clean(i.name)).join(' + ');
  });
  console.log('  clear-runway draw, ' + tier + ':');
  sig.forEach(l => console.log('    ' + l));
}
