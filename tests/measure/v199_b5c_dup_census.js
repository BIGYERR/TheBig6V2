// v199_b5c_dup_census — the census behind g197b_sweep's B5c pin.
//
// WHY THIS EXISTS: B5c has moved twice (240 at V196/V197 -> 235 at V198/D85 -> 187 at
// V199/D91) and nothing committed reproduced its arithmetic. This script REGENERATES
// the census from two artifacts; it hardcodes no count. Run it whenever B5c moves and
// paste the numbers it prints into the re-pin.
//
//   node tests/measure/v199_b5c_dup_census.js [before.html] [after.html]
//   defaults: /tmp/base_V198.html   index.html
//
// It replays g197b_sweep's EXACT lattice (3,528 builds) and its EXACT duplicate
// predicate (case-folded name seen twice anywhere on one card, across all sections,
// UNDEFINED names skipped) and prints:
//   1. total same-card duplicates, before -> after, with the card denominator;
//   2. the per-name duplicate census, before -> after;
//   3. every card whose duplicate set changed, with item counts and section labels;
//   4. the invariants D91's re-pin claims: item count preserved, every lost duplicate
//      is Step-ups (KB), and the Leg superset A -> Leg superset B swap on every card;
//   5. the MASK-LEAK check: on-card name repeats must equal counted duplicates on every
//      card of both artifacts. If a label change could hide a repeat, this is where it
//      shows up as a nonzero exception count.
// Read-only. Builds programs; never writes an artifact.

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { load } = require(path.join(ROOT, 'tests', 'harness.js'));

const BEFORE = process.argv[2] || '/tmp/base_V198.html';
const AFTER  = process.argv[3] || path.join(ROOT, 'index.html');

// g197b_sweep boots the app with a DOM stub before sweeping; same stub here.
const DOM_STUB = "__g197mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',placeholder:'',style:{},dataset:{},children:[],classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};__g197els={};document.getElementById=function(id){if(!__g197els[id])__g197els[id]=__g197mk(id);return __g197els[id];};document.querySelectorAll=function(){return[];};document.querySelector=function(){return null;};";

// the lattice, identical to the one g197b_sweep sweeps
const FOCUSES = ['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS    = ['beginner','intermediate','advanced'];
const SEEDS   = [11, 76308, 90210];
const RESTS   = [['sun','wed'], ['sat','sun','wed']];
const TIERS   = ['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const GOALS   = [
  { k:'liftonly', cardioTypes:[],      goal:null },
  { k:'run_base', cardioTypes:['run'], goal:'run_base' },
  { k:'run_5k',   cardioTypes:['run'], goal:'run_5k' },
  { k:'run_half', cardioTypes:['run'], goal:'run_half' }
];

function mkCfg(tier, focus, exp, g, seed, rest, travel) {
  const isRace = g.goal && /5k|10k|half|marathon/.test(g.goal);
  return {
    name:'M', primaryPath: g.goal ? (isRace ? 'event' : 'cardio') : 'lift',
    cardioTypes: g.cardioTypes.slice(),
    cardioGoals: g.goal ? { run:{ id:g.goal, label:g.goal, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } } : {},
    eventTargeted: !!isRace, raceDate: isRace ? '2026-12-06' : null,
    liftingFocus: focus, experience: exp, ageBracket:'18-35',
    equipment: travel ? 'bodyweight' : tier, unit:'lbs',
    restDays: rest.slice(), days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed,
    ...(travel ? { _travel:true } : {})
  };
}
function lattice(tiers, travel) {
  const out = [];
  for (const t of tiers) for (const f of FOCUSES) for (const e of EXPS)
    for (const g of GOALS) for (const s of SEEDS) for (let r = 0; r < RESTS.length; r++)
      out.push({ key:(travel?'travel_':'')+t+'|'+f+'|'+e+'|'+g.k+'|'+s+'|r'+r, cfg: mkCfg(t,f,e,g,s,RESTS[r],travel) });
  return out;
}
const L = lattice(TIERS, false).concat(lattice(['bodyweight'], true));

const UNDEF = '@@UNDEF';
const SEP_ITEM  = String.fromCharCode(2);
const SEP_FIELD = String.fromCharCode(1);

// Sweep one artifact. Returns per-card records keyed cfg#week#day, plus the totals.
function sweep(file) {
  const IA = load(file);
  IA.eval(DOM_STUB);
  const cards = new Map();
  let builds = 0, threw = 0, dup = 0, maskLeak = 0;
  for (const c of L) {
    let p;
    try { p = IA.buildProgram(c.cfg); } catch (e) { threw++; continue; }
    builds++;
    const W = p.weeks || {};
    Object.keys(W).sort((a, b) => +a - +b).forEach(w => {
      Object.keys(W[w]).forEach(d => {
        const day = W[w][d];
        if (!day || day.rest) return;
        const pairs = [];
        (day.sections || []).forEach(sec => {
          const label = String(sec.label == null ? '' : sec.label);
          (sec.items || []).forEach(it => {
            pairs.push([label, (it && it.name != null) ? String(it.name).trim() : UNDEF]);
          });
        });
        // B5c's predicate, verbatim: case-folded name already seen on this card.
        const seen = Object.create(null), dups = [];
        for (const pr of pairs) {
          const nm = pr[1];
          if (nm === UNDEF) continue;
          const k = nm.toLowerCase();
          if (seen[k]) { dup++; dups.push(nm); } else seen[k] = 1;
        }
        // MASK-LEAK: raw repeat count on this card, computed independently of the
        // predicate above. Must equal dups.length or a repeat is hiding somewhere.
        const cnt = Object.create(null);
        pairs.forEach(pr => { if (pr[1] === UNDEF) return; const k = pr[1].toLowerCase(); cnt[k] = (cnt[k] || 0) + 1; });
        const repeats = Object.keys(cnt).reduce((s, k) => s + (cnt[k] - 1), 0);
        if (repeats !== dups.length) maskLeak++;
        cards.set(c.key + '#w' + w + '#' + d, {
          n: pairs.length,
          dups,
          packed: pairs.map(pr => pr[0] + SEP_FIELD + pr[1]).join(SEP_ITEM)
        });
      });
    });
  }
  return { file, cards, builds, threw, dup, maskLeak };
}

function unpack(rec) {
  return rec.packed === '' ? [] : rec.packed.split(SEP_ITEM).map(s => s.split(SEP_FIELD));
}
function nameCounts(pairs) {
  const m = Object.create(null);
  pairs.forEach(pr => { m[pr[1]] = (m[pr[1]] || 0) + 1; });
  return m;
}
function census(cards) {
  const c = Object.create(null);
  for (const rec of cards.values()) rec.dups.forEach(n => { c[n] = (c[n] || 0) + 1; });
  return c;
}

console.log('B5c same-card duplicate census. Regenerated, nothing hardcoded');
console.log('  before: ' + BEFORE);
console.log('  after:  ' + AFTER + '\n');

const A = sweep(BEFORE);
console.log('BEFORE  builds ' + A.builds + ' (threw ' + A.threw + ')  cards ' + A.cards.size + '  same-card duplicates ' + A.dup);
const B = sweep(AFTER);
console.log('AFTER   builds ' + B.builds + ' (threw ' + B.threw + ')  cards ' + B.cards.size + '  same-card duplicates ' + B.dup);
console.log('\n=> B5c moves ' + A.dup + ' -> ' + B.dup + '  (delta ' + (B.dup - A.dup) + ') over ' + B.cards.size + ' cards');

// 1. per-name census
const cA = census(A.cards), cB = census(B.cards);
const names = [...new Set([...Object.keys(cA), ...Object.keys(cB)])].sort();
console.log('\n-- per-name same-card duplicate census (before -> after) --');
names.forEach(n => console.log('   ' + String(cA[n] || 0).padStart(5) + ' -> ' + String(cB[n] || 0).padStart(5) + '   ' + n));

// 2. the changed-card set
const rows = [];
let missing = 0, added = 0;
for (const [k, a] of A.cards) {
  const b = B.cards.get(k);
  if (!b) { missing++; continue; }
  const sa = JSON.stringify(a.dups.slice().sort()), sb = JSON.stringify(b.dups.slice().sort());
  if (sa === sb) continue;
  const pa = unpack(a), pb = unpack(b);
  const nmA = nameCounts(pa), nmB = nameCounts(pb);
  const secA = [...new Set(pa.map(p => p[0]))], secB = [...new Set(pb.map(p => p[0]))];
  rows.push({
    cfg: k.split('#')[0], w: k.split('#')[1], d: k.split('#')[2],
    iA: a.n, iB: b.n,
    dupA: a.dups.slice().sort(), dupB: b.dups.slice().sort(),
    gone: Object.keys(nmA).filter(n => !nmB[n]),
    newn: Object.keys(nmB).filter(n => !nmA[n]),
    blkA: secA.filter(s => /Leg superset/.test(s)).join(','),
    blkB: secB.filter(s => /Leg superset/.test(s)).join(','),
    occA: pa.filter(p => /^step-ups \(kb\)$/i.test(p[1])).map(p => p[0]),
    occB: pb.filter(p => /^step-ups \(kb\)$/i.test(p[1])).map(p => p[0])
  });
}
for (const k of B.cards.keys()) if (!A.cards.has(k)) added++;
if (missing || added) console.log('\n!! card-set mismatch: ' + missing + ' before-only, ' + added + ' after-only (the two artifacts do not cover the same lattice)');

console.log('\n-- ' + rows.length + ' cards whose duplicate set changed --');
console.log('   # | cfg | week | day | items before->after | dups before->after | Step-ups sections before -> after | gone | new | leg block before->after');
rows.forEach((r, i) => console.log('   ' + String(i + 1).padStart(3) + '. ' + r.cfg + ' | ' + r.w + ' | ' + r.d +
  ' | ' + r.iA + '->' + r.iB + ' | [' + r.dupA.join(', ') + '] -> [' + r.dupB.join(', ') + ']' +
  ' | ' + JSON.stringify(r.occA) + ' -> ' + JSON.stringify(r.occB) +
  ' | gone:' + JSON.stringify(r.gone) + ' | new:' + JSON.stringify(r.newn) +
  ' | ' + r.blkA + '->' + r.blkB));

// distribution of the changed set across the lattice axes
if (rows.length) {
  const by = f => { const m = {}; rows.forEach(r => { const p = r.cfg.split('|'); const k = f(p, r); m[k] = (m[k] || 0) + 1; }); return JSON.stringify(m); };
  console.log('\n-- where the changed cards sit --');
  console.log('   tier  ' + by(p => p[0]) + '\n   focus ' + by(p => p[1]) + '\n   exp   ' + by(p => p[2]));
  console.log('   goal  ' + by(p => p[3]) + '\n   seed  ' + by(p => p[4]) + '\n   rest  ' + by(p => p[5]));
  console.log('   week  ' + by((p, r) => r.w) + '\n   day   ' + by((p, r) => r.d));
  const cnts = {}; rows.forEach(r => { cnts[r.iB] = (cnts[r.iB] || 0) + 1; });
  console.log('   item count after ' + JSON.stringify(cnts));
}

// 3. the three invariants D91's re-pin claims, each computed, not assumed
const invItems  = rows.every(r => r.iA === r.iB);
const invLost   = rows.every(r => r.dupA.filter(n => r.dupB.indexOf(n) < 0).every(n => /^step-ups \(kb\)$/i.test(n)));
const invSwap   = rows.every(r => r.blkA === 'Leg superset A' && r.blkB === 'Leg superset B');
const invOneOcc = rows.every(r => r.occB.length <= 1);
console.log('\n-- invariants over the ' + rows.length + ' changed cards --');
console.log('   item count preserved on every card ............. ' + invItems);
console.log('   every lost duplicate is Step-ups (KB) .......... ' + invLost);
console.log('   Leg superset A -> Leg superset B on every card . ' + invSwap);
console.log('   at most one Step-ups (KB) left on each card .... ' + invOneOcc);

// 4. mask-leak: a label change must not be able to hide a repeat
console.log('\n-- mask-leak check (on-card name repeats vs counted duplicates) --');
console.log('   BEFORE exceptions ' + A.maskLeak + ' / ' + A.cards.size + ' cards');
console.log('   AFTER  exceptions ' + B.maskLeak + ' / ' + B.cards.size + ' cards');
console.log('   ' + ((A.maskLeak === 0 && B.maskLeak === 0)
  ? 'clean: the duplicate count sees every on-card repeat, whatever section label carries it'
  : 'LEAK: some card has a repeat the predicate did not count'));

console.log('\nB5c should be pinned at ' + B.dup + ' (equality, not a ceiling).');
