// tests/measure/v197_pool_fallback_noop.js
// MEASURE PASS — gating the equipment-inventory cluster (D70b per-tier gear tokens,
// D72 the bodyweight bar split). Artifact: index.html @ ia-version 196, HEAD 3f5d792.
//
// THE QUESTION: a filter whose empty result is silently replaced by the unfiltered
// input. Does withholding gear actually withhold anything, which pools empty, and what
// happens downstream when one does.
//
// ORACLE INDEPENDENCE (rule 3). Nothing here asks _gearOK what the right answer is.
// Tier legality is derived from the WIZARD COPY the athlete reads:
//   index.html:2681  home_full   'Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar, bands'
//   index.html:2682  home_basic  'Dumbbells, kettlebells, pull-up bar, bands. No barbell.'
//   index.html:2683  commercial  'Full gym — cables, machines, barbells, everything'
//   index.html:2684  crossfit    'Barbells, rig, bumpers, kettlebells, rower/bike, wall balls, bands'
//   index.html:2685  bodyweight  'You, the floor, and something to pull on. No weights.'
//   index.html:13999 travel Room only  'Nothing but you. A floor, a wall, and a chair.'
//   index.html:14000 travel Mini gym   'Dumbbells, a bench, a treadmill. The standard hotel setup.'
// 'minimal' is the retired travel tier with no wizard copy; it is carried as legacy
// (dumbbells + kettlebells, no barbell/cable/machine) and reported but never used as
// the oracle's subject.
//
// Run: node tests/measure/v197_pool_fallback_noop.js

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { load, fixtures, progDigest } = require('../harness');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC  = path.join(ROOT, 'index.html');
const TMP  = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-v197-'));
const RAW  = fs.readFileSync(SRC, 'utf8');

const hr = t => console.log('\n' + '='.repeat(78) + '\n' + t + '\n' + '='.repeat(78));
const sub = t => console.log('\n--- ' + t + ' ' + '-'.repeat(Math.max(0, 70 - t.length)));

// ─────────────────────────────────────────────────────────────────────────────
// HAND ORACLE — gear a movement NAME requires, and gear a TIER owns.
// Both tables are written here from the copy above and from ordinary gym English.
// Neither reads _gearOK, _auxGearOK, _AUX_GEAR or EQUIP_TOKENS.
// ─────────────────────────────────────────────────────────────────────────────
const NEEDS = [
  ['machine', /\bmachine\b|hack squat|\bsmith\b|pec deck|\bleg press\b|leg extension|lying leg curl|seated leg curl|preacher/i],
  ['cable',   /\bcable\b|pulldown|\brope\b|face pull/i],
  ['barbell', /\bbarbell\b|trap bar|power clean|hang clean|\brack pull\b|back squat|front squat|^bench press$|good morning|landmine|glute-ham/i],
  ['dumbbell',/\bdumbbell\b|\bdb\b|goblet/i],
  ['kettlebell',/kettlebell|\(kb\)|\bkb\b/i],
  // 'IT band' is anatomy, not an implement — the iliotibial band stretch needs nothing.
  ['band',    /(?<!it )\bband(ed)?\b|resistance band|trx/i],
  ['medball', /med ball|medicine ball|wall ball|ball slams/i],
  ['pullbar', /hanging|toes-to-bar|garhammer|chinup|chin-up|pullup|pull-up|muscle-?up|\bl-sit\b/i],
  ['loadobj', /\bweighted\b|\bloaded\b|farmer carry|suitcase carry|overhead carry/i],
];
function needs(name){
  const n = String(name||'');
  const out = [];
  for(const [g,re] of NEEDS) if(re.test(n)) out.push(g);
  return out;
}
// tier -> owned gear set, straight off the wizard copy
const OWNS = {
  home_full : new Set(['barbell','dumbbell','kettlebell','band','pullbar','loadobj']),
  home_basic: new Set(['dumbbell','kettlebell','band','pullbar','loadobj']),
  commercial: new Set(['machine','cable','barbell','dumbbell','kettlebell','band','pullbar','medball','loadobj']),
  crossfit  : new Set(['barbell','dumbbell','kettlebell','band','pullbar','medball','loadobj']),
  bodyweight: new Set(['pullbar']),                       // wizard bodyweight keeps the bar
  minimal   : new Set(['dumbbell','kettlebell','loadobj']), // legacy tier, no wizard copy
  travel_room_only: new Set([]),                          // D72 subject: no bar, no weights
};
const legal = (name, tier) => needs(name).every(g => OWNS[tier].has(g));
const TIERS = ['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const TIERS_PLUS = TIERS.concat(['travel_room_only']);

// ─────────────────────────────────────────────────────────────────────────────
// PATCHED ARTIFACTS. Every anchor is asserted count==1 before substitution.
// ─────────────────────────────────────────────────────────────────────────────
function patch(name, subs){
  let h = RAW;
  for(const [from, to] of subs){
    const n = h.split(from).length - 1;
    if(n !== 1) throw new Error(`patch ${name}: anchor count ${n} (want 1) for ${JSON.stringify(from.slice(0,70))}`);
    h = h.split(from).join(to);
  }
  const p = path.join(TMP, name + '.html');
  fs.writeFileSync(p, h);
  return p;
}
// NOTE: the identical text also appears inside the V127 comment at index.html:7388, so the
// anchor carries a leading newline + two spaces to stay count==1 (the strip-comments trap).
const GEAR_FALLBACK_SRC = "\n  const _gear = pool => { const f=(pool||[]).filter(_gearOK); return f.length ? f : pool; };";
const GEAR_HONEST_SRC   = "\n  const _gear = pool => { const f=(pool||[]).filter(_gearOK); return f; };";
const AUX_ANCHOR = "  const N=String(name||'').toLowerCase();\n  if(/cable|pec deck/.test(N)) return equip==='commercial';";
const AUX_D72    = "  const N=String(name||'').toLowerCase();\n  if(globalThis.__D72_NOBAR && equip==='bodyweight' && /hanging|toes-to-bar|garhammer|chinup|chin-up|pullup|pull-up|muscle-?up|l-sit/.test(N)) return false;\n  if(/cable|pec deck/.test(N)) return equip==='commercial';";

const F_HONEST = patch('honest', [[GEAR_FALLBACK_SRC, GEAR_HONEST_SRC]]);            // D70b: fallback removed
const F_D72    = patch('d72',    [[AUX_ANCHOR, AUX_D72]]);                            // D72: bar withheld from Room-only
const F_BOTH   = patch('both',   [[GEAR_FALLBACK_SRC, GEAR_HONEST_SRC],[AUX_ANCHOR, AUX_D72]]);
// D72 at the LIFT-pool lens: a hasBar bit inside _gearOK. Two artifacts, one with the
// existing fallback intact and one without, so the fallback's contribution is isolated.
const GEAR_OK_ANCHOR = "    if(!hasDumbbells && /\\bdumbbell|\\bdb\\b|goblet/i.test(N)) return false;\n    return true;";
const GEAR_OK_BAR    = "    if(!hasDumbbells && /\\bdumbbell|\\bdb\\b|goblet/i.test(N)) return false;\n    if(globalThis.__D72_NOBAR && equip==='bodyweight' && /hanging|toes-to-bar|garhammer|chinup|chin-up|pullup|pull-up|muscle-?up|l-sit/i.test(N)) return false;\n    return true;";
const F_BAR      = patch('bar',      [[GEAR_OK_ANCHOR, GEAR_OK_BAR],[AUX_ANCHOR, AUX_D72]]);
const F_BAR_HON  = patch('barhonest',[[GEAR_OK_ANCHOR, GEAR_OK_BAR],[AUX_ANCHOR, AUX_D72],[GEAR_FALLBACK_SRC, GEAR_HONEST_SRC]]);

// ─────────────────────────────────────────────────────────────────────────────
// LATTICE
// ─────────────────────────────────────────────────────────────────────────────
const FOCUSES = ['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS    = ['beginner','intermediate','advanced'];
const SEEDS   = [11, 76308, 90210];
const RESTS   = [['sun','wed'], ['sat','sun','wed']];
const GOALS   = [
  {k:'liftonly', cardioTypes:[], goal:null},
  {k:'run_base', cardioTypes:['run'], goal:'run_base'},
  {k:'run_5k',   cardioTypes:['run'], goal:'run_5k'},
  {k:'run_half', cardioTypes:['run'], goal:'run_half'},
];
function mkCfg(tier, focus, exp, g, seed, rest, travel){
  const isRace = g.goal && /5k|10k|half|marathon/.test(g.goal);
  return {
    name:'M', primaryPath: g.goal ? (isRace?'event':'cardio') : 'lift',
    cardioTypes: g.cardioTypes.slice(),
    cardioGoals: g.goal ? {run:{id:g.goal,label:g.goal,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}} : {},
    eventTargeted: !!isRace, raceDate: isRace ? '2026-12-06' : null,
    liftingFocus: focus, experience: exp, ageBracket:'18-35',
    equipment: travel ? 'bodyweight' : tier, unit:'lbs',
    restDays: rest.slice(), days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed,
    ...(travel ? {_travel:true} : {}),
  };
}
function lattice(tiers, travel){
  const out = [];
  for(const t of tiers) for(const f of FOCUSES) for(const e of EXPS)
    for(const g of GOALS) for(const s of SEEDS) for(let r=0;r<RESTS.length;r++)
      out.push({ key:`${travel?'travel_':''}${t}|${f}|${e}|${g.k}|${s}|r${r}`, tier: travel?'travel_room_only':t,
                 cfg: mkCfg(t,f,e,g,s,RESTS[r],travel) });
  return out;
}

// walk a built program into (week, day) cells
function cells(prog){
  const out = [];
  const W = prog.weeks || {};
  Object.keys(W).sort((a,b)=>+a-+b).forEach(w => Object.keys(W[w]).forEach(d => {
    const day = W[w][d];
    if(!day || day.rest) return;
    out.push({ w:+w, d, day });
  }));
  return out;
}
function itemsOf(day){
  const out = [];
  (day.sections||[]).forEach(sec => (sec.items||[]).forEach((it,ii) => out.push({sec, it, ii})));
  return out;
}
function cellSig(day){
  return (day.sections||[]).map(s => (s.label||s.coreHeader||'') + '[' +
    (s.items||[]).map(i => (i && i.name!=null) ? String(i.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,'') : '∅UNDEFINED').join('|') + ']').join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
hr('Q1 — THE FALLBACK MECHANICS');
// ─────────────────────────────────────────────────────────────────────────────
sub('Q1a. static census: every `length ? x : y` guard, comments stripped');
{
  // strip // and /* */ comments while preserving line numbers, then scan
  let s = RAW.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g,' '));
  s = s.split('\n').map(l => {
    const i = l.indexOf('//');
    if(i < 0) return l;
    // crude: only strip when the // is not inside a quote or a regex/url
    const before = l.slice(0,i);
    const q = (before.match(/'/g)||[]).length + (before.match(/"/g)||[]).length + (before.match(/`/g)||[]).length;
    if(q % 2 !== 0) return l;
    if(/[:=]\s*$/.test(before.trim())) return l;
    if(/https?$/.test(before)) return l;
    return before + ' '.repeat(l.length - i);
  }).join('\n');
  const lines = s.split('\n');
  const hits = [];
  lines.forEach((l,i) => { if(/\.length\s*\?/.test(l) || /\blength\s*\?\s*[A-Za-z_[]/.test(l)) hits.push([i+1, RAW.split('\n')[i].trim()]); });
  console.log(`sites matching /\\.length\\s*\\?/ in live code: ${hits.length}`);
  hits.forEach(([n,t]) => console.log(`  ${String(n).padStart(6)}  ${t.slice(0,150)}`));
}

sub('Q1b. the two named sites, verbatim');
{
  const L = RAW.split('\n');
  [7400, 6120, 6121, 6122, 6123, 6124, 6125, 6126].forEach(n => console.log(`  ${n}: ${L[n-1]}`));
  console.log('  NOTE: _pi (6120-6126) fallback `d.length ? d : g` falls back to the GEAR-FILTERED g,');
  console.log('        not to the raw pillar. If g itself is empty, _pi returns [].');
}

sub('Q1c. empirical: does the D70b withhold move anything? (baseline vs _gear-honest)');
const IA0 = load(SRC);
const IAH = load(F_HONEST);
const IAD = load(F_D72); IAD.window.__D72_NOBAR = true;
{
  const L = lattice(TIERS, false);
  let same = 0, diff = 0, threw0 = 0, threwH = 0, cellsTot = 0, cellsDiff = 0;
  const perTier = {};
  for(const c of L){
    let p0, pH;
    try { p0 = IA0.buildProgram(c.cfg); } catch(e){ threw0++; continue; }
    try { pH = IAH.buildProgram(c.cfg); } catch(e){ threwH++; continue; }
    const d0 = progDigest(p0), dH = progDigest(pH);
    perTier[c.tier] = perTier[c.tier] || {n:0, moved:0, cells:0, cellsMoved:0};
    perTier[c.tier].n++;
    if(d0 === dH) same++; else { diff++; perTier[c.tier].moved++; }
    const a = cells(p0), b = cells(pH);
    for(let i=0;i<a.length;i++){
      cellsTot++; perTier[c.tier].cells++;
      if(!b[i] || cellSig(a[i].day) !== cellSig(b[i].day)){ cellsDiff++; perTier[c.tier].cellsMoved++; }
    }
  }
  console.log(`builds ${L.length}  identical ${same}  moved ${diff}  baseline-threw ${threw0}  honest-threw ${threwH}`);
  console.log(`day cells ${cellsTot}  moved ${cellsDiff}  (${(100*cellsDiff/cellsTot).toFixed(2)}%)`);
  console.log('  tier         builds  moved   cells  cellsMoved');
  TIERS.forEach(t => { const r = perTier[t]; if(!r) return;
    console.log(`  ${t.padEnd(12)} ${String(r.n).padStart(6)} ${String(r.moved).padStart(6)} ${String(r.cells).padStart(7)} ${String(r.cellsMoved).padStart(11)}`); });
}

sub('Q1d. the DENIAL census: how often does a tier get gear its own copy denies it?');
{
  const L = lattice(TIERS, false);
  const tally = {}; // tier -> gear -> {count, names:Map, sections:Map}
  let items = 0, days = 0, builds = 0;
  for(const c of L){
    let p; try { p = IA0.buildProgram(c.cfg); } catch(e){ continue; }
    builds++;
    for(const cell of cells(p)){
      days++;
      for(const {sec, it} of itemsOf(cell.day)){
        if(!it || it.name == null) continue;
        items++;
        const nm = String(it.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
        for(const g of needs(nm)){
          if(OWNS[c.tier].has(g)) continue;
          tally[c.tier] = tally[c.tier] || {};
          const t = tally[c.tier][g] = tally[c.tier][g] || {count:0, names:new Map(), secs:new Map()};
          t.count++; t.names.set(nm,(t.names.get(nm)||0)+1);
          const sl = sec.label || sec.coreHeader || '(no label)';
          t.secs.set(sl,(t.secs.get(sl)||0)+1);
        }
      }
    }
  }
  console.log(`denominator: ${builds} builds / ${days} trained day-cells / ${items} prescribed items (V196 as shipped)`);
  for(const t of TIERS){
    const row = tally[t]; if(!row){ console.log(`  ${t}: 0 denial violations`); continue; }
    for(const g of Object.keys(row).sort()){
      const r = row[g];
      console.log(`  ${t.padEnd(12)} ${g.padEnd(10)} ${String(r.count).padStart(6)} items  |  ` +
        [...r.names.entries()].sort((a,b)=>b[1]-a[1]).map(([n,k])=>`${n} ×${k}`).join(', ').slice(0,300));
      console.log(`  ${''.padEnd(12)} ${''.padEnd(10)}        sections: ` +
        [...r.secs.entries()].sort((a,b)=>b[1]-a[1]).map(([n,k])=>`${n} ×${k}`).join(', ').slice(0,220));
    }
  }
}

sub('Q1e. the same denial census on the _gear-HONEST artifact (is the fallback the carrier?)');
{
  const L = lattice(TIERS, false);
  const tally = {}; let items = 0, undef = 0, builds = 0, threw = 0;
  const undefBySec = {};
  for(const c of L){
    let p; try{ p = IAH.buildProgram(c.cfg); }catch(e){ threw++; continue; }
    builds++;
    for(const cell of cells(p)) for(const {sec,it} of itemsOf(cell.day)){
      items++;
      if(!it || it.name == null){ undef++;
        const k = c.tier + ' :: ' + (sec.label||sec.coreHeader||'(no label)');
        undefBySec[k] = (undefBySec[k]||0)+1; continue; }
      const nm = String(it.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
      for(const g of needs(nm)){
        if(OWNS[c.tier].has(g)) continue;
        tally[c.tier] = tally[c.tier] || {};
        const t = tally[c.tier][g] = tally[c.tier][g] || {count:0, names:new Map()};
        t.count++; t.names.set(nm,(t.names.get(nm)||0)+1);
      }
    }
  }
  console.log(`  honest-_gear builds ${builds} (threw ${threw}) / ${items} items`);
  for(const t of TIERS){
    const row = tally[t];
    if(!row){ console.log(`  ${t.padEnd(12)} 0 denial violations`); continue; }
    for(const g of Object.keys(row).sort()) console.log(`  ${t.padEnd(12)} ${g.padEnd(10)} ${String(row[g].count).padStart(6)} items  |  ` +
      [...row[g].names.entries()].sort((a,b)=>b[1]-a[1]).map(([n,k])=>`${n} \u00d7${k}`).join(', ').slice(0,220));
  }
  console.log(`  UNDEFINED items introduced by removing the fallback: ${undef}`);
  Object.keys(undefBySec).sort().forEach(k => console.log(`    ${k} \u00d7${undefBySec[k]}`));
}

// ─────────────────────────────────────────────────────────────────────────────
hr('Q2 — WHICH POOLS EMPTY, AND WHERE');
// ─────────────────────────────────────────────────────────────────────────────
sub('Q2a. EXLIB survivor table under the hand oracle (members legal per tier)');
{
  const E = IA0.EXLIB;
  const keys = Object.keys(E).filter(k => Array.isArray(E[k]));
  console.log('  pool'.padEnd(26) + TIERS_PLUS.map(t=>t.slice(0,10).padStart(11)).join('') + '   n');
  const zero = [], one = [];
  for(const k of keys){
    const row = TIERS_PLUS.map(t => E[k].filter(n => legal(n,t)).length);
    console.log('  ' + k.padEnd(24) + row.map(v=>String(v).padStart(11)).join('') + String(E[k].length).padStart(4));
    TIERS_PLUS.forEach((t,i) => { if(row[i]===0) zero.push([k,t]); else if(row[i]===1) one.push([k,t]); });
  }
  console.log(`\n  EMPTY (0 legal members): ${zero.length} (pool,tier) pairs`);
  zero.forEach(([k,t]) => console.log(`    EXLIB.${k} @ ${t}`));
  console.log(`  SINGLETON (1 legal member): ${one.length} (pool,tier) pairs`);
  one.forEach(([k,t]) => console.log(`    EXLIB.${k} @ ${t}  -> ${IA0.EXLIB[k].filter(n=>legal(n,t)).join(', ')}`));
}

sub('Q2b. CORE_PILLARS survivor table — hand oracle AND the engine\'s own _auxGearOK');
{
  const P = IA0.eval('CORE_PILLARS');
  const auxOK = IA0.eval('_auxGearOK');
  const rows = [['anti_extension','static'],['anti_extension','loaded'],['anti_rotation','items'],
                ['dynamic_bracing','items'],['rotational_power','items']];
  const hdr = '  pillar'.padEnd(30) + TIERS_PLUS.map(t=>t.slice(0,10).padStart(11)).join('');
  console.log('ENGINE _auxGearOK (travel_room_only column = engine has no such tier, shown as bodyweight):');
  console.log(hdr);
  for(const [p,sub2] of rows){
    const arr = P[p][sub2] || [];
    const row = TIERS_PLUS.map(t => arr.filter(it => auxOK(it.name, t==='travel_room_only'?'bodyweight':t)).length);
    console.log('  ' + (p+'.'+sub2).padEnd(28) + row.map(v=>String(v).padStart(11)).join(''));
  }
  console.log('\nHAND ORACLE (travel_room_only = D72 withhold: no bar):');
  console.log(hdr);
  for(const [p,sub2] of rows){
    const arr = P[p][sub2] || [];
    const row = TIERS_PLUS.map(t => arr.filter(it => legal(it.name, t)).length);
    console.log('  ' + (p+'.'+sub2).padEnd(28) + row.map(v=>String(v).padStart(11)).join(''));
    const dead = TIERS_PLUS.filter((t,i)=>row[i]===0);
    if(dead.length) console.log('      EMPTY at: ' + dead.join(', ') + '  members: ' + arr.map(x=>x.name).join(' / '));
  }
  console.log('\n  _pi reads: anti_rotation, dynamic_bracing, rotational_power.');
  console.log('  anti_extension.static and .loaded are read RAW at index.html:6139, 6163 (no _auxGearOK).');
}

sub('Q2c. inline literal pools in buildSections that never pass a gear filter');
{
  // harvest every bracketed string-array literal on the pool-assignment lines
  const L = RAW.split('\n');
  const found = [];
  for(let i=7440;i<8500;i++){
    const l = L[i-1]; if(!l) continue;
    if(!/Pool\s*=|const \w+\s*=\s*_gear\(|_bw\(|_gear\(\[/.test(l)) continue;
    const arrs = l.match(/\[(?:\s*'[^']*'\s*,?)+\]/g) || [];
    arrs.forEach(a => {
      const mem = a.slice(1,-1).split(/'\s*,\s*'/).map(x=>x.replace(/^'|'$/g,''));
      const gearWrapped = /_gear\(\s*\[/.test(l) && l.indexOf(a) > l.indexOf('_gear(');
      found.push({line:i, members:mem, raw:!gearWrapped, ctx:l.trim().slice(0,90)});
    });
  }
  console.log(`  literal pools harvested from index.html:7440-8500 : ${found.length}`);
  let bad = 0;
  for(const f of found){
    const zeros = TIERS_PLUS.filter(t => f.members.filter(m=>legal(m,t)).length === 0);
    if(!zeros.length) continue;
    bad++;
    console.log(`  L${f.line} ${f.raw?'RAW  ':'_gear'} empty@[${zeros.join(',')}] :: ${f.members.join(' / ')}`);
    console.log(`        ${f.ctx}`);
  }
  console.log(`  literal pools that empty on at least one tier: ${bad} / ${found.length}`);
}

sub('Q2d. how many (config, day) cells does each emptying pool actually touch?');
{
  const L = lattice(TIERS, false);
  const secCount = {}; let days = 0, builds = 0;
  const WATCH = ['Leg isolation','Calves','Core — Dynamic Bracing'];
  for(const c of L){
    let p; try{ p = IA0.buildProgram(c.cfg); }catch(e){ continue; }
    builds++;
    for(const cell of cells(p)){
      days++;
      (cell.day.sections||[]).forEach(s => {
        const lab = s.label || s.coreHeader || '';
        if(!WATCH.includes(lab)) return;
        secCount[c.tier] = secCount[c.tier] || {};
        secCount[c.tier][lab] = (secCount[c.tier][lab]||0)+1;
      });
    }
  }
  console.log(`  denominator ${builds} builds / ${days} trained day-cells`);
  for(const t of TIERS) console.log(`  ${t.padEnd(12)} ` + JSON.stringify(secCount[t]||{}));
}

sub('Q2e. EXLIB.back_pull reachability — does _bw() really divert it on bodyweight?');
{
  const L = RAW.split('\n');
  console.log('  1539: ' + L[1538]);
  console.log('  7882: ' + L[7881].trim());
  console.log('  7423: ' + L[7422].trim() + '   <- _bw diverts ONLY when isBW');
  const members = IA0.EXLIB.back_pull;
  const lat = lattice(TIERS, false);
  const hits = {}; let builds = 0, items = 0;
  for(const c of lat){
    let p; try{ p = IA0.buildProgram(c.cfg); }catch(e){ continue; }
    builds++;
    for(const cell of cells(p)) for(const {it} of itemsOf(cell.day)){
      if(!it || it.name == null) continue; items++;
      const nm = String(it.name).trim();
      if(members.includes(nm)){ hits[c.tier] = hits[c.tier]||{}; hits[c.tier][nm] = (hits[c.tier][nm]||0)+1; }
    }
  }
  console.log(`  denominator ${builds} builds / ${items} items`);
  for(const t of TIERS) console.log(`  ${t.padEnd(12)} ` + JSON.stringify(hits[t]||{}));
}

sub('Q2f. the injury pool overrides — lowback/protect rowPool and friends, per tier');
{
  const L = RAW.split('\n');
  console.log('  7667: ' + L[7666].trim());
  console.log('  7668: ' + L[7667].trim());
  const lbp = ['Assisted pullups','Neutral-grip chinups','Chinups','Weighted chinups'];
  console.log('  members (before the hasDumbbells filter): ' + lbp.join(' / '));
  for(const t of TIERS_PLUS){
    const afterDB = lbp.filter(n => (t!=='bodyweight'&&t!=='travel_room_only') || !/weighted/i.test(n));
    console.log(`  ${t.padEnd(16)} after in-line filter ${afterDB.length}  gear-legal ${afterDB.filter(n=>legal(n,t)).length}  -> ${afterDB.filter(n=>legal(n,t)).join(', ')||'(EMPTY)'}`);
  }
}

sub('Q2g. injury sweep — every region x tier, on travel Room-only, D72 withhold applied');
{
  const REGIONS = ['shoulder','elbow','lowback','hip','knee','ankle'];
  const ITIERS = ['workaround','protect'];
  let builds = 0, threw = 0, items = 0, undef = 0;
  const bad = {};
  for(const R of REGIONS) for(const T of ITIERS) for(const f of FOCUSES) for(const s of SEEDS){
    const cfg = mkCfg('bodyweight', f, 'intermediate', GOALS[1], s, RESTS[0], true);
    cfg.injury = {region:R, tier:T};
    let p; try{ p = IAD.buildProgram(cfg); }catch(e){ threw++; continue; }
    builds++;
    for(const cell of cells(p)) for(const {sec,it} of itemsOf(cell.day)){
      items++;
      if(!it || it.name == null){ undef++;
        const k = `${R}/${T} :: ${sec.label||sec.coreHeader||'(no label)'}`;
        bad[k] = (bad[k]||0)+1; }
    }
  }
  console.log(`  travel Room-only + injury builds ${builds} (threw ${threw}) / ${items} items / UNDEFINED ${undef}`);
  Object.keys(bad).sort().forEach(k => console.log(`    ${k} \u00d7${bad[k]}`));
  // and the same sweep WITHOUT the D72 withhold, as the control
  let items0 = 0, undef0 = 0, b0 = 0;
  for(const R of REGIONS) for(const T of ITIERS) for(const f of FOCUSES) for(const s of SEEDS){
    const cfg = mkCfg('bodyweight', f, 'intermediate', GOALS[1], s, RESTS[0], true);
    cfg.injury = {region:R, tier:T};
    let p; try{ p = IA0.buildProgram(cfg); }catch(e){ continue; }
    b0++;
    for(const cell of cells(p)) for(const {it} of itemsOf(cell.day)){ items0++; if(!it||it.name==null) undef0++; }
  }
  console.log(`  CONTROL (V196, no withhold): builds ${b0} / items ${items0} / UNDEFINED ${undef0}`);
}

sub('Q2h. travel Room-only TODAY (V196): how much gear does a room with no bar get?');
{
  const lat = lattice(['bodyweight'], true);
  // plus the injury variants, since the lowback/protect rowPool is an injury-only literal
  const inj = [];
  for(const R of ['shoulder','elbow','lowback','hip','knee','ankle']) for(const T of ['workaround','protect'])
    for(const f of FOCUSES) for(const sd of SEEDS){
      const cfg = mkCfg('bodyweight', f, 'intermediate', GOALS[1], sd, RESTS[0], true);
      cfg.injury = {region:R, tier:T};
      inj.push({key:`travel_inj_${R}_${T}|${f}|${sd}`, tier:'travel_room_only', cfg});
    }
  const all = lat.concat(inj);
  let builds=0, items=0, days=0;
  const byGear = {}; const bySec = {};
  for(const c of all){
    let p; try{ p = IA0.buildProgram(c.cfg); }catch(e){ continue; }
    builds++;
    for(const cell of cells(p)){ days++;
      for(const {sec,it} of itemsOf(cell.day)){
        if(!it||it.name==null) continue; items++;
        const nm = String(it.name).trim();
        for(const g of needs(nm)){
          if(OWNS.travel_room_only.has(g)) continue;
          byGear[g] = byGear[g] || new Map();
          byGear[g].set(nm,(byGear[g].get(nm)||0)+1);
          const k = g+' :: '+(sec.label||sec.coreHeader||'(no label)');
          bySec[k] = (bySec[k]||0)+1;
        }
      }
    }
  }
  console.log(`  denominator ${builds} travel Room-only builds (${lat.length} healthy + ${inj.length} injury) / ${days} day-cells / ${items} items`);
  for(const g of Object.keys(byGear).sort()){
    const tot = [...byGear[g].values()].reduce((a,b)=>a+b,0);
    console.log(`  ${g.padEnd(11)} ${String(tot).padStart(6)} items  |  ` + [...byGear[g].entries()].sort((a,b)=>b[1]-a[1]).map(([n,k])=>`${n} \u00d7${k}`).join(', ').slice(0,260));
  }
  console.log('  by section (top 20):');
  Object.entries(bySec).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([k,v])=>console.log(`    ${k} \u00d7${v}`));
}

sub('Q2i. D72 as a hasBar bit inside _gearOK — with the fallback, then without');
{
  const IAbar = load(F_BAR);      IAbar.window.__D72_NOBAR = true;
  const IAbh  = load(F_BAR_HON);  IAbh.window.__D72_NOBAR  = true;
  const lat = lattice(['bodyweight'], true);
  let n=0, sameFB=0, sameHON=0, undefFB=0, undefHON=0, itemsFB=0, itemsHON=0;
  const leakFB = new Map(), leakHON = new Map(), undefSecs = {};
  for(const c of lat){
    let p0,pF,pH;
    try{ p0=IA0.buildProgram(c.cfg); pF=IAbar.buildProgram(c.cfg); pH=IAbh.buildProgram(c.cfg); }catch(e){ continue; }
    n++;
    const d0=progDigest(p0);
    if(progDigest(pF)===d0) sameFB++;
    if(progDigest(pH)===d0) sameHON++;
    for(const cell of cells(pF)) for(const {it} of itemsOf(cell.day)){ itemsFB++;
      if(!it||it.name==null){ undefFB++; continue; }
      const nm=String(it.name).trim(); if(needs(nm).includes('pullbar')) leakFB.set(nm,(leakFB.get(nm)||0)+1); }
    for(const cell of cells(pH)) for(const {sec,it} of itemsOf(cell.day)){ itemsHON++;
      if(!it||it.name==null){ undefHON++; undefSecs[sec.label||sec.coreHeader||'(no label)']=(undefSecs[sec.label||sec.coreHeader||'(no label)']||0)+1; continue; }
      const nm=String(it.name).trim(); if(needs(nm).includes('pullbar')) leakHON.set(nm,(leakHON.get(nm)||0)+1); }
  }
  console.log(`  travel Room-only builds ${n}`);
  console.log(`  WITH the _gear fallback   : digests identical to V196 on ${sameFB}/${n}; bar-needing items still printed ${[...leakFB.values()].reduce((a,b)=>a+b,0)} / ${itemsFB}`);
  console.log(`      ${[...leakFB.entries()].sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' \u00d7'+v).join(', ')||'(none)'}`);
  console.log(`      undefined items ${undefFB}`);
  console.log(`  WITHOUT the fallback      : digests identical to V196 on ${sameHON}/${n}; bar-needing items still printed ${[...leakHON.values()].reduce((a,b)=>a+b,0)} / ${itemsHON}`);
  console.log(`      ${[...leakHON.entries()].sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' \u00d7'+v).join(', ')||'(none)'}`);
  console.log(`      undefined items ${undefHON} in sections: ${JSON.stringify(undefSecs)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
hr('Q3 — THE rot([]) FAILURE');
// ─────────────────────────────────────────────────────────────────────────────
sub('Q3a. rot / rotOn verbatim');
{
  const L = RAW.split('\n');
  [6132,6133].forEach(n => console.log(`  ${n}: ${L[n-1]}`));
  const rotOn = (clock,arr,n)=>arr[(((clock-1+n)%arr.length)+arr.length)%arr.length];
  console.log('  driving the exact expression with an empty array:');
  console.log('    arr.length      =', [].length);
  console.log('    (clock-1+n)%0   =', (3-1+3)%0);
  console.log('    final index     =', (((3-1+3)%0)+0)%0);
  console.log('    rotOn(3,[],3)   =', rotOn(3,[],3));
}

sub('Q3b. the real path: D72 withhold on travel Room-only, over the travel lattice');
{
  const L = lattice(['bodyweight'], true);
  let builds = 0, threw = 0, coreSecs = 0, dbSecs = 0, undefItems = 0, undefSecs = 0, items = 0;
  const bySize = {};
  let sample = null;
  for(const c of L){
    let p; try{ p = IAD.buildProgram(c.cfg); }catch(e){ threw++; continue; }
    builds++;
    for(const cell of cells(p)){
      (cell.day.sections||[]).forEach(s => {
        if(s.core){ coreSecs++; if(s.pillar==='dynamic_bracing') dbSecs++; }
        let bad = 0;
        (s.items||[]).forEach(it => { items++; if(!it || it.name==null){ bad++; undefItems++; } });
        if(bad){ undefSecs++; bySize[(s.items||[]).length] = (bySize[(s.items||[]).length]||0)+1;
                 if(!sample) sample = {key:c.key, w:cell.w, d:cell.d, sec:s, day:cell.day}; }
      });
    }
  }
  console.log(`  travel Room-only builds ${builds} (threw ${threw}) / core sections ${coreSecs} / dynamic_bracing sections ${dbSecs}`);
  console.log(`  prescribed items ${items} | UNDEFINED items ${undefItems} | sections holding one ${undefSecs}`);
  console.log(`  section length histogram for affected sections: ${JSON.stringify(bySize)}`);
  console.log(`  BUILD DID NOT THROW. The program is produced and stored.`);
  if(sample){
    console.log(`  sample cell: ${sample.key}  W${sample.w} ${sample.d}`);
    console.log(`  section object: ${JSON.stringify(sample.sec)}`);
    sub('Q3c. what the athlete actually sees — drive the real renderers');
    IAD.window.__SEC = [sample.sec];
    IAD.window.__DAY = sample.day;
    const probes = [
      ['buildSectionsHTML(__SEC,0)', 'day sheet, lift block (index.html:10943)'],
      ['sessionLogProgress(__DAY)',  'day sheet, "n / n LOGGED" counter (index.html:12726)'],
      ['sessionTimeEst(__DAY)',      'week hero + strip, "~NN MIN" tag (index.html:10419)'],
      ['buildHeroPreview(__DAY)',    'week view hero preview rows (index.html:10458)'],
    ];
    for(const [code, where] of probes){
      try {
        const r = IAD.eval(code);
        console.log(`  ${where}\n      ${code} -> OK: ` + (typeof r==='string' ? JSON.stringify(r).slice(0,400) : JSON.stringify(r)));
      } catch(e) {
        console.log(`  ${where}\n      ${code} -> THREW ${e.constructor.name}: ${e.message}`);
      }
    }
    // the same probes on a HEALTHY day, to prove the probe is not the thing that is broken
    let healthy = null;
    const p = IAD.buildProgram(mkCfg('bodyweight','balanced','intermediate',GOALS[0],11,RESTS[0],true));
    for(const cell of cells(p)){ if(!itemsOf(cell.day).some(x=>!x.it||x.it.name==null)) { healthy = cell.day; break; } }
    if(healthy){
      IAD.window.__DAY = healthy;
      console.log('  CONTROL (a day with no undefined item, same build):');
      for(const [code] of probes.slice(1)){
        try{ const r = IAD.eval(code); console.log(`      ${code} -> OK ` + (typeof r==='string'?('len '+r.length):JSON.stringify(r))); }
        catch(e){ console.log(`      ${code} -> THREW ${e.message}`); }
      }
    }
  }
}

sub('Q3d. every other call site that indexes a possibly-empty array by modulo');
{
  const L = RAW.split('\n');
  const hits = [];
  L.forEach((l,i) => {
    if(/%\s*\w+\.length\s*\]/.test(l) || /\[\s*\w+\s*%\s*[\w.]+\.length\s*\]/.test(l) || /rot\(|rotOn\(/.test(l)) hits.push([i+1, l.trim()]);
  });
  console.log(`  modulo-index / rot call sites: ${hits.length}`);
  hits.forEach(([n,t]) => console.log(`    ${String(n).padStart(6)}  ${t.slice(0,150)}`));
}

// ─────────────────────────────────────────────────────────────────────────────
hr('Q4 — THE HARVEST CANDIDATES');
// ─────────────────────────────────────────────────────────────────────────────
const CANDS = ['Nordic hamstring curl (anchored)','Single-leg glute bridge','Wall sit',
               'Spanish squat hold (KB)','Step-ups (KB)','Single-leg hip thrust','Dumbbell Bulgarian split squat'];
{
  const E = IA0.EXLIB;
  const _pattern = IA0._pattern, _AUX_FAMILY = IA0._AUX_FAMILY;
  const _auxFamily = IA0.eval('typeof _auxFamily==="function"?_auxFamily:null');
  const _compoundTier = IA0.eval('typeof _compoundTier==="function"?_compoundTier:null');
  const _stationClass = IA0._stationClass;
  const L = RAW.split('\n');
  for(const n of CANDS){
    const lines = []; L.forEach((l,i)=>{ if(l.includes("'"+n+"'")) lines.push(i+1); });
    const pools = Object.keys(E).filter(k=>Array.isArray(E[k]) && E[k].includes(n));
    const tiersLegal = TIERS_PLUS.filter(t=>legal(n,t));
    console.log(`\n  ${n}`);
    console.log(`    lines            : ${lines.join(', ') || 'NOT FOUND'}`);
    console.log(`    gear needed      : [${needs(n).join(', ')||'none'}]`);
    console.log(`    legal tiers      : ${tiersLegal.join(', ')||'NONE'}`);
    console.log(`    EXLIB pools      : ${pools.length? pools.map(p=>'EXLIB.'+p).join(', ') : '(none — literal pools only)'}`);
    console.log(`    in EXLIB.leg_iso : ${E.leg_iso.includes(n) ? 'YES' : 'no'}`);
    console.log(`    _pattern         : ${_pattern ? _pattern(n) : 'n/a'}`);
    console.log(`    _auxFamily       : ${_auxFamily ? (_auxFamily(n)||'null') : 'n/a'}`);
    console.log(`    _compoundTier    : ${_compoundTier ? JSON.stringify(_compoundTier(n)) : 'n/a'}`);
    console.log(`    _stationClass    : ${_stationClass ? JSON.stringify(_stationClass(n)) : 'n/a'}`);
    console.log(`    REP_AFFINITY     : ${JSON.stringify((IA0.REP_AFFINITY||{})[n])}`);
  }
  sub('Q4a. after the harvest, does leg_iso have a legal member on every tier?');
  const after = IA0.EXLIB.leg_iso.concat(CANDS);
  console.log('  tier          before  after   after-members');
  for(const t of TIERS_PLUS){
    const b = IA0.EXLIB.leg_iso.filter(n=>legal(n,t));
    const a = after.filter(n=>legal(n,t));
    console.log(`  ${t.padEnd(13)} ${String(b.length).padStart(6)} ${String(a.length).padStart(6)}   ${a.join(', ')||'(none)'}`);
  }
  sub('Q4b. dynamic_bracing under D72 — is there a gear-free bracing movement in the file?');
  // harvest every distinct movement name in the file, score for "bracing" semantics
  const all = new Set();
  Object.keys(IA0.EXLIB).forEach(k => { if(Array.isArray(IA0.EXLIB[k])) IA0.EXLIB[k].forEach(n=>all.add(n)); });
  const P = IA0.eval('CORE_PILLARS');
  Object.keys(P).forEach(k => ['items','static','loaded'].forEach(s => (P[k][s]||[]).forEach(it=>all.add(it.name))));
  const RP = IA0.RAND_POOLS;
  try { JSON.stringify(RP, (k,v)=>{ if(typeof v==='string') all.add(v); return v; }); } catch(e){}
  const BRACE = /hollow|dead bug|deadbug|knee raise|leg raise|leg lift|v-?up|sit-?up|reverse crunch|flutter|scissor|toes|tuck|jackknife|hip flexion|candlestick/i;
  const cands = [...all].filter(n => BRACE.test(n));
  console.log(`  distinct movement names reachable from EXLIB + CORE_PILLARS + RAND_POOLS: ${all.size}`);
  console.log(`  names matching a hip-flexion / dynamic-bracing semantic: ${cands.length}`);
  cands.sort().forEach(n => console.log(`    ${legal(n,'travel_room_only')?'BAR-FREE ':'needs gear'}  ${n}   [${needs(n).join(',')||'-'}]`));
  sub('Q4c. anti_extension_loaded is read RAW — verify');
  const L2 = RAW.split('\n');
  [6160,6161,6162,6163].forEach(n=>console.log(`  ${n}: ${L2[n-1]}`));
  console.log('  anti_extension.loaded members and their tier legality:');
  P.anti_extension.loaded.forEach(it => console.log(`    ${it.name.padEnd(24)} needs[${needs(it.name).join(',')||'-'}]  legal@ ${TIERS_PLUS.filter(t=>legal(it.name,t)).join(',')||'NONE'}`));
  console.log('  engine _auxGearOK verdict on the same three, per tier:');
  const auxOK = IA0.eval('_auxGearOK');
  P.anti_extension.loaded.forEach(it => console.log(`    ${it.name.padEnd(24)} ` + TIERS.map(t=>`${t}:${auxOK(it.name,t)?'Y':'n'}`).join(' ')));
}

// ─────────────────────────────────────────────────────────────────────────────
hr('Q5 — BLAST RADIUS OF THE HARVEST');
// ─────────────────────────────────────────────────────────────────────────────
{
  const IAB = load(F_HONEST);            // fresh instance so the mutation is isolated
  IAB.EXLIB.leg_iso.push(...CANDS);
  const L = lattice(TIERS, false);
  let builds = 0, movedBuilds = 0, cellsTot = 0, cellsMoved = 0;
  const seg = {};
  for(const c of L){
    let p0, pB;
    try{ p0 = IA0.buildProgram(c.cfg); pB = IAB.buildProgram(c.cfg); }catch(e){ continue; }
    builds++;
    const moved = progDigest(p0) !== progDigest(pB);
    if(moved) movedBuilds++;
    const goalk = c.key.split('|')[3], focus = c.key.split('|')[1];
    const sk = c.tier + ' / ' + focus;
    seg[sk] = seg[sk] || {n:0,moved:0,cells:0,cellsMoved:0};
    seg[sk].n++; if(moved) seg[sk].moved++;
    const a = cells(p0), b = cells(pB);
    for(let i=0;i<a.length;i++){
      cellsTot++; seg[sk].cells++;
      if(!b[i] || cellSig(a[i].day)!==cellSig(b[i].day)){ cellsMoved++; seg[sk].cellsMoved++; }
    }
  }
  console.log(`  V196 vs (D70b honest _gear + 7 harvested leg_iso members)`);
  console.log(`  builds ${builds}  moved ${movedBuilds} (${(100*movedBuilds/builds).toFixed(1)}%)`);
  console.log(`  day cells ${cellsTot}  moved ${cellsMoved} (${(100*cellsMoved/cellsTot).toFixed(2)}%)`);
  console.log('  tier / focus                         builds moved   cells cellsMoved');
  Object.keys(seg).sort().forEach(k => { const r = seg[k];
    if(!r.moved && !r.cellsMoved) return;
    console.log(`  ${k.padEnd(36)} ${String(r.n).padStart(6)} ${String(r.moved).padStart(5)} ${String(r.cells).padStart(7)} ${String(r.cellsMoved).padStart(10)}`); });
  sub('Q5a. Mario\'s fixture');
  const m0 = progDigest(IA0.buildProgram(fixtures.HALF_MANNY));
  const mH = progDigest(IAH.buildProgram(fixtures.HALF_MANNY));
  const mB = progDigest(IAB.buildProgram(fixtures.HALF_MANNY));
  console.log(`  HALF_MANNY seed 76308 equipment=crossfit focus=support_prevention`);
  console.log(`    V196 digest                 ${m0}  (expected 6e32421331693437: ${m0==='6e32421331693437'?'MATCH':'MISMATCH'})`);
  console.log(`    honest _gear only           ${mH}  ${mH===m0?'UNCHANGED':'MOVED'}`);
  console.log(`    honest _gear + harvest      ${mB}  ${mB===m0?'UNCHANGED':'MOVED'}`);
  const pm = IA0.buildProgram(fixtures.HALF_MANNY);
  let li = 0, dh = 0;
  for(const cell of cells(pm)) (cell.day.sections||[]).forEach(s=>{ if((s.label||'')==='Leg isolation') li++; });
  console.log(`    'Leg isolation' sections in Mario's program: ${li}  (denseHypertrophy gate, index.html:6682/8292)`);
  sub('Q5b. same-card duplicates — Wall sit already lives in EXLIB.knee_stability (index.html:1584, 7831)');
  {
    const dupCount = prog => {
      let n = 0;
      for(const cell of cells(prog)){
        const seen = Object.create(null);
        for(const {it} of itemsOf(cell.day)){
          if(!it || it.name == null) continue;
          const k = String(it.name).trim().toLowerCase();
          if(seen[k]) { n++; } else seen[k] = 1;
        }
      }
      return n;
    };
    const L2 = lattice(TIERS, false);
    let d0 = 0, dB = 0, nb = 0;
    const byName = {};
    for(const c of L2){
      let p0, pB; try{ p0 = IA0.buildProgram(c.cfg); pB = IAB.buildProgram(c.cfg); }catch(e){ continue; }
      nb++; d0 += dupCount(p0); dB += dupCount(pB);
      for(const cell of cells(pB)){
        const seen = Object.create(null);
        for(const {it} of itemsOf(cell.day)){
          if(!it || it.name == null) continue;
          const k = String(it.name).trim();
          if(seen[k.toLowerCase()]) byName[k] = (byName[k]||0)+1; else seen[k.toLowerCase()] = 1;
        }
      }
    }
    console.log(`  builds ${nb}: duplicate-name-on-one-card items — V196 ${d0}, after harvest ${dB} (delta ${dB-d0})`);
    console.log('  duplicated names after harvest: ' + (Object.entries(byName).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' \u00d7'+v).join(', ')||'(none)'));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
hr('Q6 — IS THIS SHAPE ANYWHERE ELSE?');
// ─────────────────────────────────────────────────────────────────────────────
{
  const L = RAW.split('\n');
  const A = [], B = [], C = [];
  L.forEach((l,i)=>{
    const n = i+1, t = l.trim();
    if(/^\s*\/\//.test(l)) return;
    // (a) silent replacement: X.length ? X : <something else>
    if(/(\w[\w.]*)\.length\s*\?\s*\1\s*:/.test(l) || /\.length\s*\?\s*[\w.]+\s*:\s*\(?[\w.[]/.test(l)) A.push([n,t]);
    // (c) indexed without a length check
    if(/\.filter\([^)]*\)\s*\[\s*\d+\s*\]/.test(l) || /pick\([^;]*\)\s*\[\s*\d+\s*\]/.test(l)) C.push([n,t]);
    // (b) empty array allowed through into a consumer
    if(/pick\(\s*\w[\w.]*\.filter\(/.test(l) || /_slot\(/.test(l)) B.push([n,t]);
  });
  const show = (lbl, arr) => { console.log(`\n  ${lbl}: ${arr.length}`); arr.forEach(([n,t])=>console.log(`    ${String(n).padStart(6)}  ${t.slice(0,160)}`)); };
  show('(a) empty filter result SILENTLY REPLACED by the unfiltered input', A);
  show('(c) filter/pick result INDEXED with no length check', C);
  show('(b) filter result passed on as a possibly-empty array', B);
}

console.log('\n(patched artifacts in ' + TMP + ')');
