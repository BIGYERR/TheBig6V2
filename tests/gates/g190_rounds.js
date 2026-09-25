// Gate G190 — V190 / D39: "the round count is a field, not a substring".
//
// Contract under test: handoff §5r ("The round count is a field, not a substring",
// line 163) and rulings D39-i..v (§11f, lines 524-528).
//
//   D39-i   the header shows the section LABEL; the round sentence is synthesized
//           only when there is a real N. NO FALLBACK CONSTANT anywhere in the path.
//           MIN across members, never items[0].
//   D39-ii  `rounds: null` means "not a round block"; OMITTED means "legacy".
//           A label that states its own count beats the not-a-round-block heuristic.
//   D39-iii `sessionTimeEst` reads the SAME resolver as the banner.
//   D39-iv  `preventionDoseSweep` (D2) halves the SECTION and normalises the members
//           to it. 3->2 only, supersets only; non-superset accessories keep the
//           per-item rewrite.
//   D39-v   the member strip is DISPLAY ONLY; `item.detail` is untouched in the data.
//
// ── BASELINE CAVEAT (read this before trusting a "fails on baseline" claim) ──
// V188 and V189 were never committed to this repo, and all three tags V188 / V189 /
// V190 point at the SAME V190 commit. The nearest real baseline is therefore V187,
// THREE builds back (/tmp/base_V187.html, verified: boots, self-stable, contains
// ZERO D39 symbols — no _secRounds, no _itemSets, no _stripLeadingSets, no
// _setLeadingSets, and no `rounds` field on any section).
// A D39 gate MUST fail on V187 because V187 predates the ruling entirely. This gate
// does NOT isolate D39 from D36/D37/D38 — but those were day-placement and race-week
// rulings, not round counts, so for round-count assertions the V187 baseline is sound.
//
// ── ORACLE INDEPENDENCE ──
// Nothing here calls `_secRounds` and asserts it equals itself. Expectations come from
// (a) hand tables written out of §5r, (b) a reference parser (refItemSets/refStrip)
// written in this file from the authoring contract, and (c) source-level scans of the
// resolver seam with comments stripped. On V187 `_secRounds` does not exist at all, so
// every resolver call is guarded and reports `FAIL <name>: threw ...`, never a crash.
//
// Named checks (sabotage targets one each):
//   G1  resolver precedence, hand table
//   G2  no fallback constant in the resolver seam (source scan)
//   G3  MIN across members, never items[0]
//   G4  both grammars parsed (`N×reps` and `N sets — RPE x`)
//   G5  `rounds:null` stays distinguishable from OMITTED
//   G6  a label that states its count beats the not-a-round-block heuristic
//   G7  every generated superset section carries an authored numeric count
//   G8  no section's count contradicts the set count its own members carry
//   G9  members of one superset agree with each other
//   G10 sessionTimeEst reads the same resolver as the banner
//   G11 the member strip is display-only (data untouched, banner synthesis)
//   G12 preventionDoseSweep halves the section and normalises its members
//
// Usage: node tests/gates/g190_rounds.js <candidate.html> [baseline.html]
// (argv[3] is accepted for runner compatibility and ignored: this gate is a
//  single-build assertion set. Run it a second time WITH the baseline as argv[2]
//  to prove it is not vacuous.)

const path = require('path');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness'));

let pass = 0, fail = 0;
function check(name, ok, why){ if(ok){ pass++; console.log('ok   ' + name); } else { fail++; console.log('FAIL ' + name + (why ? ': ' + why : '')); } }
function tryCheck(name, fn){ try { const r = fn(); check(name, r === true, r === true ? '' : String(r)); } catch(e){ check(name, false, 'threw ' + e.message); } }

const cand = process.argv[2];
if(!cand){ console.log('usage: node g190_rounds.js <candidate.html> [baseline.html]'); console.log('PASS 0 FAIL 1'); process.exit(1); }

let IA;
try { IA = load(cand); } catch(e){ console.log('FAIL G0 boot: ' + e.message); console.log('PASS 0 FAIL 1'); process.exit(1); }

// ───────────────────────── VM bridge ─────────────────────────
// Values cross into the app's realm as JSON and come back as JSON, so a missing
// function is a named failure instead of a ReferenceError that kills the summary.
function vmCall(fnName, argsSrc){
  const code = '(function(){ try{ if(typeof ' + fnName + '!=="function") return JSON.stringify({ok:true,v:"__MISSING__"});'
             + ' var _r = ' + fnName + '(' + argsSrc + '); return JSON.stringify({ok:true,v:(_r===undefined?"__UNDEF__":_r)}); }'
             + ' catch(e){ return JSON.stringify({ok:false,e:String((e&&e.message)||e)}); } })()';
  const r = JSON.parse(IA.eval(code));
  if(!r.ok) throw new Error(fnName + ' threw: ' + r.e);
  if(r.v === '__MISSING__') throw new Error(fnName + ' is not defined in this build (pre-D39?)');
  return r.v === '__UNDEF__' ? undefined : r.v;
}
const secRounds  = sec => vmCall('_secRounds', JSON.stringify(sec));
const timeEst    = day => vmCall('sessionTimeEst', JSON.stringify(day));
const renderSecs = secs => vmCall('buildSectionsHTML', JSON.stringify(secs) + ',0');
// Render and hand BACK the sections, so we can see whether the render mutated the data.
function renderAndReturnData(secs){
  const code = '(function(){ try{ if(typeof buildSectionsHTML!=="function") return JSON.stringify({ok:true,v:null});'
             + ' var S = ' + JSON.stringify(secs) + '; var h = buildSectionsHTML(S,0);'
             + ' return JSON.stringify({ok:true,v:{html:h,after:S}}); } catch(e){ return JSON.stringify({ok:false,e:String((e&&e.message)||e)}); } })()';
  const r = JSON.parse(IA.eval(code));
  if(!r.ok) throw new Error('buildSectionsHTML threw: ' + r.e);
  if(!r.v) throw new Error('buildSectionsHTML is not defined in this build');
  return r.v;
}

// ─────────────── reference parsers (written from §5r, not from the app) ───────────────
// Both authored grammars: 'N×reps' / 'Nxreps' and 'N sets — RPE x' / 'N sets of ...'.
function refItemSets(d){
  const s = String(d == null ? '' : d);
  let m = s.match(/^(\d+)\s*[x×]/);
  if(m) return parseInt(m[1], 10);
  m = s.match(/^(\d+)\s*sets?\b/i);
  return m ? parseInt(m[1], 10) : null;
}
function refStrip(d){
  return String(d == null ? '' : d)
    .replace(/^(\d+)\s*[x×]\s*/, '')
    .replace(/^(\d+)\s*sets?\s+of\s+/i, '')
    .replace(/^(\d+)\s*sets?\s*[—–-]\s*/i, '')
    .replace(/^(\d+)\s*sets?\b\s*/i, '');
}
const isSuperset = sec => !!(sec && (sec.superset || sec.type === 'superset')) && (sec.items || []).length > 1;

// ───────────────────────── the lattice ─────────────────────────
// goals x focuses x experience x equipment x rest patterns, cfg.seed pinned on every
// build (never null — engineA falls back to Date.now() and nothing is reproducible).
const GOALS = {
  run_half:      { id:'run_half',      label:'Half Marathon', mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' },
  run_5k:        { id:'run_5k',        label:'5K',            mileBestMins:'9',  mileBestSecs:'00', baselineDist:'3', baseline:'3mi' },
  run_base:      { id:'run_base',      label:'Base',          mileBestMins:'11', mileBestSecs:'00', baselineDist:'3', baseline:'3mi' },
  run_pace_goal: { id:'run_pace_goal', label:'Pace',          mileBestMins:'8',  mileBestSecs:'30', baselineDist:'3', baseline:'3mi', targetPace:'7:30' },
};
const FOCUSES = ['support_prevention','strength','hypertrophy','fatloss','balanced','support_athletic','support_strength'];
const EXPS    = ['beginner','intermediate','advanced'];
const EQUIP   = ['crossfit','commercial','home_full','home_basic','bodyweight'];
const RESTS   = [['sun','wed'], ['sun'], ['sat','sun','wed']];

function mkCfg(goal, focus, exp, equip, rest, i){
  const c = Object.assign({}, fixtures.HALF_MANNY, {
    cardioGoals: { run: GOALS[goal] },
    liftingFocus: focus, experience: exp, equipment: equip,
    restDays: rest.slice(), seed: 76308 + i * 97,
  });
  if(goal !== 'run_half' && goal !== 'run_5k'){ c.primaryPath = 'body'; c.eventTargeted = false; delete c.raceDate; }
  return c;
}
const LATTICE = [];
{
  let i = 0;
  for(const g of Object.keys(GOALS)) for(const f of FOCUSES) for(const e of EXPS) for(const q of EQUIP) for(const r of RESTS){
    i++;
    if(i % 3 !== 0) continue;                       // deterministic stride, ~420 of 1,260
    LATTICE.push({ key: [g,f,e,q,r.join('+')].join('/'), cfg: mkCfg(g,f,e,q,r,i) });
  }
}

function eachSection(cfgs, fn){
  let built = 0, errs = 0;
  for(const { key, cfg } of cfgs){
    let prog;
    try { prog = IA.buildProgram(cfg); built++; } catch(e){ errs++; continue; }
    const weeks = prog.weeks || {};
    for(const w of Object.keys(weeks)) for(const d of Object.keys(weeks[w] || {})){
      const day = weeks[w][d];
      if(!day || !day.sections) continue;
      for(const sec of day.sections) fn(sec, key + ' W' + w + ' ' + d, day);
    }
  }
  return { built, errs };
}

// ───────────────────────── the checks ─────────────────────────
function main(){

  // ══ G1 — resolver precedence, HAND TABLE (§5r) ══
  // Authored number wins; then a count stated in the label; then MIN across members;
  // then null. Legacy rows here carry UNIFORM members on purpose so that G1 stays a
  // precedence test and the MIN-vs-items[0] question belongs to G3 alone.
  const G1 = [
    // [why, section, expected]
    ['authored beats label',   { label:'Circuit 4 rounds', superset:true, rounds:5, items:[{detail:'2×10'},{detail:'2×10'}] }, 5],
    ['authored beats members', { label:'Pump',             superset:true, rounds:5, items:[{detail:'3×10'},{detail:'3×10'}] }, 5],
    ['label when no field',    { label:'Superset A — 4 rounds', superset:true, items:[{detail:'2×10'},{detail:'2×10'}] }, 4],
    ['label beats members',    { label:'8 rounds carry complex',     superset:true, items:[{detail:'3×10'},{detail:'3×10'}] }, 8],
    ['legacy members',         { label:'Pump',             superset:true, items:[{detail:'4×12'},{detail:'4×12'}] }, 4],
    ['nothing parses',         { label:'Pump',             superset:true, items:[{detail:'15 reps'},{detail:'10 reps'}] }, null],
    ['no items at all',        { label:'Pump',             superset:true, items:[] }, null],
  ];
  G1.forEach(([why, sec, want]) => tryCheck('G1 precedence: ' + why, () => {
    const got = secRounds(sec);
    return got === want ? true : 'want ' + JSON.stringify(want) + ' got ' + JSON.stringify(got);
  }));

  // ══ G2 — NO FALLBACK CONSTANT anywhere in the path (source assertion) ══
  // Partly a source claim, so it is asserted against the source. Comments are stripped
  // first (standing rule: strip comments before any "is this token gone" scan) — the
  // block comment above _itemSets talks ABOUT the hardcoded 3 that was removed.
  const JS = IA.js || '';
  function fnBody(name){
    const sig = 'function ' + name + '(';
    const i = JS.indexOf(sig);
    if(i < 0) return null;
    let j = JS.indexOf('{', i), d = 0, k = j;
    if(j < 0) return null;
    for(; k < JS.length; k++){
      if(JS[k] === '{') d++;
      else if(JS[k] === '}'){ d--; if(d === 0) break; }
    }
    return JS.slice(j, k + 1);
  }
  function literals(body){
    const b = String(body)
      .replace(/\\u[0-9a-fA-F]{4}/g, '')   // × / — are not numbers
      .replace(/^\s*\/\/.*$/gm, '')        // line comments
      .replace(/\/\*[\s\S]*?\*\//g, '');   // block comments
    return Array.from(new Set((b.match(/\b\d+\b/g) || []))).sort();
  }
  const SEAM = ['_itemSets','_secRounds','_stripLeadingSets','_setLeadingSets'];
  tryCheck('G2a resolver seam exists', () => {
    const missing = SEAM.filter(n => fnBody(n) === null);
    return missing.length === 0 ? true : 'missing ' + missing.join(', ');
  });
  // Only a regex-radix 10, a capture index 1 and the `>0` guard may appear. A `3` here
  // is the exact defect D39 closed.
  const ALLOWED = new Set(['0','1','10']);
  SEAM.forEach(n => tryCheck('G2b no fallback constant in ' + n, () => {
    const b = fnBody(n);
    if(b === null) return 'function not present in this build';
    const bad = literals(b).filter(x => !ALLOWED.has(x));
    return bad.length === 0 ? true : 'numeric literal(s) ' + bad.join(',') + ' in the resolver path';
  }));
  tryCheck('G2c render seam calls the single resolver', () => {
    const n = (JS.match(/const rounds=_secRounds\(sec\);/g) || []).length;
    if(n !== 1) return 'expected exactly 1 `const rounds=_secRounds(sec);` in the superset branch, found ' + n;
    return /hdrTxt\s*=\s*\(labelHasRounds\|\|rounds==null\)/.test(JS) ? true : 'the header no longer falls back to the label when rounds is null';
  });
  tryCheck('G2d sessionTimeEst shares the resolver (D39-iii)', () => {
    const b = fnBody('sessionTimeEst');
    if(b === null) return 'sessionTimeEst not found';
    if(b.indexOf('_secRounds(') < 0) return 'sessionTimeEst does not call _secRounds — it is carrying its own copy again';
    if(b.indexOf('_itemSets(') < 0) return 'sessionTimeEst does not call _itemSets — it is carrying its own copy again';
    if(b.indexOf('/^(\\d+)') >= 0) return 'sessionTimeEst holds its own leading-count regex';
    return true;
  });

  // ══ G3 — MIN across members, never items[0] ══
  // Min can only under-state; inflating above a capped member is the dangerous
  // direction. Every case puts the SMALLEST member somewhere other than index 0.
  [
    ['max first',      [{detail:'4×10'},{detail:'2×10'},{detail:'3×10'}], 2],
    ['max first, two', [{detail:'5×8'},{detail:'3×8'}], 3],
    ['capped last',    [{detail:'4×12'},{detail:'4×12'},{detail:'1×12'}], 1],
    ['unparseable first', [{detail:'as many as possible'},{detail:'4×10'},{detail:'2×10'}], 2],
  ].forEach(([why, items, want]) => tryCheck('G3 min not items[0]: ' + why, () => {
    const got = secRounds({ label:'Pump', superset:true, items });
    return got === want ? true : 'want ' + want + ' got ' + JSON.stringify(got) + ' (items[0] would give ' + JSON.stringify(refItemSets(items[0].detail)) + ')';
  }));

  // ══ G4 — BOTH grammars ══
  // bodyweightSweep rewrites 21.9% of items into 'N sets — RPE x'. A parser that knows
  // only 'N×reps' is the bug D39 closed.
  [
    ['sets-grammar alone',   [{detail:'3 sets — RPE 8'},{detail:'2 sets — RPE 8'}], 2],
    ['sets-grammar uniform', [{detail:'4 sets — RPE 7 (leave 3 or more in reserve)'},{detail:'4 sets — RPE 7'}], 4],
    ['mixed grammars',       [{detail:'4×10'},{detail:'2 sets — RPE 7'}], 2],
    ['sets of',              [{detail:'3 sets of 10'},{detail:'5×10'}], 3],
  ].forEach(([why, items, want]) => tryCheck('G4 both grammars: ' + why, () => {
    const got = secRounds({ label:'Pump', superset:true, items });
    return got === want ? true : 'want ' + want + ' got ' + JSON.stringify(got);
  }));

  // ══ G5 — `rounds:null` (authored "no round count") vs OMITTED (legacy) ══
  // Same items, two different authorings, two different answers. Collapse them and the
  // resolver can no longer tell an authored claim from a pre-V190 snapshot.
  const ITEMS = [{ name:'Kettlebell swing', detail:'3×10' }, { name:'Pushups', detail:'3×12' }];
  tryCheck('G5a rounds:null suppresses the count', () => {
    const got = secRounds({ label:'30 min AMRAP — pace yourself', superset:true, rounds:null, items: ITEMS });
    return got === null ? true : 'want null got ' + JSON.stringify(got);
  });
  tryCheck('G5b OMITTED recovers the legacy count', () => {
    const got = secRounds({ label:'30 min AMRAP — pace yourself', superset:true, items: ITEMS });
    return got === 3 ? true : 'want 3 got ' + JSON.stringify(got);
  });
  tryCheck('G5c null and OMITTED stay distinguishable', () => {
    const a = secRounds({ label:'Pump', superset:true, rounds:null, items: ITEMS });
    const b = secRounds({ label:'Pump', superset:true, items: ITEMS });
    return (a !== b) ? true : 'authored-null and omitted both resolve to ' + JSON.stringify(a);
  });

  // ══ G6 — a label that states its own count beats the heuristic (D39-ii) ══
  // '8 rounds each: 20s work / 10s rest' was caught by the not-a-round-block pattern
  // and deliberately reverted. The nine genuine not-a-round-blocks are a hand table
  // taken from the ruling (AMRAP, EMOM, every-N-min, for-time, alternate-every).
  const RP = IA.RAND_POOLS;
  tryCheck('G6a no label that states a count carries rounds:null', () => {
    if(!RP) return 'RAND_POOLS not exported';
    const bad = [];
    Object.keys(RP).forEach(k => (RP[k] || []).forEach(w => (w.sections || []).forEach(s => {
      if(/(\d+)\s*round/i.test(s.label || '') && s.rounds === null) bad.push(k + '/' + w.title + '/' + s.label);
    })));
    return bad.length === 0 ? true : 'heuristic beat the label on ' + bad.length + ': ' + bad.slice(0,3).join(' | ');
  });
  const NOT_A_ROUND_BLOCK = [
    ['fatloss','AMRAP 20 Min','As many rounds as possible'],
    ['fatloss','Gut Check','EMOM 20 min'],
    ['fatloss','Interval Strength','Every 2 min: 5 reps bench + 5 reps squat + 10 swings'],
    ['fatloss','EMOM Strength','Every min on the min for 20 min'],
    ['fatloss','The Long Shred','30 min AMRAP — pace yourself'],
    ['athletic','Mixed Modal','Alternate every 5 min for 30 min'],
    ['athletic','Power Endurance','AMRAP 25 min — pace yourself'],
    ['athletic','The Finisher','For time — as fast as possible'],
    ['balanced','The Grind','30 min AMRAP'],
  ];
  tryCheck('G6b the nine not-a-round-blocks carry an authored null', () => {
    if(!RP) return 'RAND_POOLS not exported';
    const bad = [];
    NOT_A_ROUND_BLOCK.forEach(([pool, title, label]) => {
      const w = (RP[pool] || []).find(x => x.title === title);
      const s = w && (w.sections || []).find(x => x.label === label);
      if(!s) bad.push(pool + '/' + title + ' (section not found)');
      else if(s.rounds !== null) bad.push(pool + '/' + title + ' rounds=' + JSON.stringify(s.rounds));
    });
    return bad.length === 0 ? true : bad.length + ' wrong: ' + bad.slice(0,3).join(' | ');
  });
  tryCheck('G6c Tabata Hell resolves 8 from its label', () => {
    if(!RP) return 'RAND_POOLS not exported';
    const w = (RP.fatloss || []).find(x => x.title === 'Tabata Hell');
    const s = w && (w.sections || [])[0];
    if(!s) return 'Tabata Hell not found';
    const got = secRounds(s);
    return got === 8 ? true : 'want 8 got ' + JSON.stringify(got) + ' (label: ' + s.label + ')';
  });

  // ══ G7 — every generated superset section carries an AUTHORED numeric count ══
  // Written at the call site from the same expression that writes the members
  // (vsets(3), hsets), so block and rows cannot disagree by construction.
  let nSS = 0, noCount = [], badCount = [];
  const stats = eachSection(LATTICE, (sec, where) => {
    if(!isSuperset(sec)) return;
    nSS++;
    if(typeof sec.rounds !== 'number'){ if(noCount.length < 4) noCount.push(where + ' "' + sec.label + '" rounds=' + JSON.stringify(sec.rounds)); }
    else if(!(sec.rounds > 0)){ if(badCount.length < 4) badCount.push(where + ' rounds=' + sec.rounds); }
  });
  check('G7 lattice built', stats.errs === 0 && stats.built === LATTICE.length,
        stats.built + '/' + LATTICE.length + ' built, ' + stats.errs + ' errors');
  check('G7 every generated superset carries an authored count', nSS > 0 && noCount.length === 0 && badCount.length === 0,
        nSS + ' superset sections; ' + noCount.length + ' with no authored count' + (noCount.length ? ' e.g. ' + noCount[0] : '') + '; ' + badCount.length + ' non-positive');

  // ══ G8 — no section's count contradicts the set count its own members carry ══
  // A section with no authored count at all is itself a violation here: an unauthored
  // generator section is the pre-V190 shape.
  let contradictions = [], nChecked = 0;
  eachSection(LATTICE, (sec, where) => {
    if(!isSuperset(sec)) return;
    nChecked++;
    if(typeof sec.rounds !== 'number'){
      if(contradictions.length < 4) contradictions.push(where + ' "' + sec.label + '" has no authored count');
      return;
    }
    const parsed = (sec.items || []).map(it => refItemSets(it && it.detail)).filter(v => v != null);
    const off = parsed.filter(v => v !== sec.rounds);
    if(off.length && contradictions.length < 4){
      contradictions.push(where + ' "' + sec.label + '" rounds=' + sec.rounds + ' members=' + JSON.stringify((sec.items||[]).map(i => i.detail)));
    }
  });
  check('G8 section never contradicts its own members', nChecked > 0 && contradictions.length === 0,
        nChecked + ' superset sections, ' + contradictions.length + ' contradictions' + (contradictions.length ? ': ' + contradictions[0] : ''));

  // ══ G9 — members of one superset agree with each other ══
  // 262/6,889 prevention supersets were desynced before D39-iv.
  let disagree = [], nSS9 = 0;
  eachSection(LATTICE, (sec, where) => {
    if(!isSuperset(sec)) return;
    nSS9++;
    const parsed = (sec.items || []).map(it => refItemSets(it && it.detail)).filter(v => v != null);
    if(parsed.length > 1 && new Set(parsed).size > 1 && disagree.length < 4){
      disagree.push(where + ' "' + sec.label + '" ' + JSON.stringify((sec.items||[]).map(i => i.detail)));
    }
  });
  check('G9 superset members agree with each other', nSS9 > 0 && disagree.length === 0,
        nSS9 + ' superset sections, ' + disagree.length + ' desynced' + (disagree.length ? ': ' + disagree[0] : ''));

  // ══ G10 — sessionTimeEst reads the same resolver as the banner (D39-iii) ══
  // Hand table. The published model: 8 min warmup, superset item = sets * 1.4 min,
  // total rounded to the nearest 5 and floored at 5. Item's own count first, then the
  // section, then 3 only for a detail with NO parseable count at all.
  const mkDay = (rounds, detail, n) => ({ sections: [ Object.assign({ label:'Pump', superset:true },
      (rounds === undefined ? {} : { rounds }),
      { items: Array.from({ length: n }, (_, i) => ({ name:'Kettlebell swing ' + i, detail })) }) ] });
  const r5 = m => Math.max(5, Math.round(m / 5) * 5);
  [
    ['section count drives an uncounted item (2 rounds x 6)', mkDay(2, '10 reps', 6),          r5(8 + 6 * 2 * 1.4)],
    ['section count drives an uncounted item (5 rounds x 4)', mkDay(5, '10 reps', 4),          r5(8 + 4 * 5 * 1.4)],
    ['item count wins over the section',                      mkDay(2, '4×10', 6),        r5(8 + 6 * 4 * 1.4)],
    ['item count wins in the sets-grammar',                   mkDay(5, '2 sets — RPE 8', 6), r5(8 + 6 * 2 * 1.4)],
    ['3 only when nothing parses at all',                     mkDay(undefined, '10 reps', 2),  r5(8 + 2 * 3 * 1.4)],
  ].forEach(([why, day, want]) => tryCheck('G10 sessionTimeEst: ' + why, () => {
    const got = timeEst(day);
    return got === want ? true : 'want ' + want + ' min got ' + JSON.stringify(got);
  }));

  // ══ G11 — the strip is DISPLAY-ONLY (D39-v) ══
  const SS3 = { label:'Pump', superset:true, rounds:3, items:[
    { name:'Kettlebell swing', detail:'3×10' }, { name:'Pushups', detail:'3×12' } ] };
  const SS2 = { label:'Pump', superset:true, rounds:2, items:[
    { name:'Kettlebell swing', detail:'2×10' }, { name:'Pushups', detail:'2×12' } ] };
  const SSNULL = { label:'30 min AMRAP', superset:true, rounds:null, items:[
    { name:'Kettlebell swing', detail:'3×10' }, { name:'Pushups', detail:'3×12' } ] };
  const details = html => (html.match(/class="ex-detail"[^>]*>([\s\S]*?)<\/div>/g) || [])
    .map(s => s.replace(/^[\s\S]*?class="ex-detail"[^>]*>/, '').replace(/<\/div>$/, ''));

  tryCheck('G11a rendering a superset does not touch item.detail', () => {
    const before = JSON.parse(JSON.stringify([SS3]));
    const out = renderAndReturnData([SS3]);
    const after = out.after;
    const diffs = [];
    before.forEach((s, i) => (s.items || []).forEach((it, j) => {
      const a = after[i] && after[i].items[j];
      if(!a || a.detail !== it.detail) diffs.push(it.detail + ' -> ' + (a && a.detail));
    }));
    return diffs.length === 0 ? true : 'the render mutated the data: ' + diffs.join(', ');
  });
  // ERA (standing rulings 2/4). G11b is the pre-D176 contract: a round block's row is the bare remainder
  // refStrip leaves. D176 (V220, P-BARERX) appends ' reps' to a bare remainder, so from ia-version 220 G11b
  // SKIPs by name and G11f carries the row. An ia-version that is not an integer FAILS both; it never skips.
  const D176_ERA = 220, VER_OK = /^\d+$/.test(String(IA.version)), VER = VER_OK ? parseInt(IA.version, 10) : NaN;
  if(!VER_OK) check('G11b era: ia-version is readable', false, 'ia-version ' + JSON.stringify(IA.version) + ' is missing or not an integer, so G11b cannot be keyed');
  else if(VER < D176_ERA) tryCheck('G11b rendered rows lose the leading count', () => {
    const d = details(renderSecs([SS3]));
    const want = SS3.items.map(i => refStrip(i.detail));
    return JSON.stringify(d) === JSON.stringify(want) ? true : 'want ' + JSON.stringify(want) + ' got ' + JSON.stringify(d);
  });
  else console.log("SKIP G11b: pre-D176 era; D176 appends ' reps' to a bare remainder, see G11f");
  tryCheck('G11c a rounds:null block keeps its rows intact', () => {
    const d = details(renderSecs([SSNULL]));
    const want = SSNULL.items.map(i => i.detail);
    return JSON.stringify(d) === JSON.stringify(want) ? true : 'want ' + JSON.stringify(want) + ' got ' + JSON.stringify(d);
  });
  tryCheck('G11d the data still carries the count for parseRx', () => {
    // The add sheet sums member details; the count must survive the render, and parseRx
    // must still read it. Independent expectation: 3 sets from '3x10'.
    const html = renderSecs([SS3]);
    if(html.indexOf('3×10') < 0) return 'the true detail vanished from the rendered payload — the data lost its count';
    const rx = vmCall('parseRx', JSON.stringify('3×10') + ',' + JSON.stringify('Kettlebell swing'));
    return (rx && rx.sets === 3) ? true : 'parseRx read ' + JSON.stringify(rx && rx.sets) + ' sets, want 3';
  });
  tryCheck('G11e the round sentence is synthesized only with a real N', () => {
    const hdr = h => ((h.match(/sshdr-txt">([\s\S]*?)<\/span>/) || [])[1] || '');
    const h3 = hdr(renderSecs([SS3])), h2 = hdr(renderSecs([SS2])), hn = hdr(renderSecs([SSNULL]));
    const want3 = /^3 Rounds — no rest between exercises · \d+s rest between rounds$/;
    const want2 = /^2 Rounds — no rest between exercises · \d+s rest between rounds$/;
    if(!want3.test(h3)) return 'rounds=3 header was ' + JSON.stringify(h3);
    if(!want2.test(h2)) return 'rounds=2 header was ' + JSON.stringify(h2);
    if(hn !== SSNULL.label) return 'rounds=null must show the label ' + JSON.stringify(SSNULL.label) + ', got ' + JSON.stringify(hn);
    return true;
  });

  // ══ G11f — D176 (V220, P-BARERX): a bare remainder in a round block reads "N reps" ══
  // Oracle: refStrip (this file's reference parser, written from §5r) plus this gate's OWN literal copy of the
  // ruled bare shape, applied over refStrip and never over the app's _stripLeadingSets (the ruling says so).
  // Two populations: a HAND TABLE typed out below, and every numeric-rounds superset on the lattice, rendered
  // one section at a time (an identical section is rendered once). Floor: the lattice must show at least one
  // bare and at least one non-bare row, else FAIL; a population with no bare row cannot catch a lost ' reps'.
  const BARE_D176 = /^\d+(\s*[–-]\s*\d+)?$/;
  const wantD176 = d => { const r = refStrip(d); return r + (BARE_D176.test(r) ? ' reps' : ''); };
  if(!VER_OK) check('G11f era: ia-version is readable', false, 'ia-version ' + JSON.stringify(IA.version) + ' is missing or not an integer, so G11f cannot be keyed');
  else if(VER < D176_ERA) console.log('SKIP G11f: ia-version ' + VER + ' predates D176 (V' + D176_ERA + '); G11b carries the row');
  else {
    const SSF = { label:'Pump', superset:true, rounds:3, items:[
      { name:'Kettlebell swing', detail:'3×10' }, { name:'Goblet squat', detail:'3×8–12' },
      { name:'Pushups', detail:'3×12 each side' }, { name:'Plank', detail:'3×30 sec' },
      { name:'Dumbbell row', detail:'3 sets — RPE 8' } ] };
    const HAND = ['10 reps', '8–12 reps', '12 each side', '30 sec', 'RPE 8'];
    tryCheck('G11f hand table: a bare count or range gains " reps", every other remainder is untouched', () => {
      const f = SSF.items.map(i => wantD176(i.detail));
      if(JSON.stringify(f) !== JSON.stringify(HAND)) return 'oracle self-check: refStrip + BARE gives ' + JSON.stringify(f) + ', the hand table says ' + JSON.stringify(HAND);
      const d = details(renderSecs([SSF]));
      return JSON.stringify(d) === JSON.stringify(HAND) ? true : 'want ' + JSON.stringify(HAND) + ' got ' + JSON.stringify(d);
    });
    const seen = new Set(), ex = [];
    let secs = 0, rows = 0, bare = 0, nonBare = 0, mism = 0, rErr = 0;
    const lat = eachSection(LATTICE, (sec, where) => {
      if(!isSuperset(sec) || typeof sec.rounds !== 'number') return;
      const k = JSON.stringify(sec); if(seen.has(k)) return; seen.add(k); secs++;
      const want = (sec.items || []).map(i => wantD176(i && i.detail));
      (sec.items || []).forEach(i => { rows++; if(BARE_D176.test(refStrip(i && i.detail))) bare++; else nonBare++; });
      let d; try { d = details(renderSecs([sec])); } catch(e){ rErr++; if(ex.length < 3) ex.push(where + ' "' + sec.label + '" render threw ' + e.message); return; }
      if(JSON.stringify(d) !== JSON.stringify(want)){ mism++; if(ex.length < 3) ex.push(where + ' "' + sec.label + '" want ' + JSON.stringify(want) + ' got ' + JSON.stringify(d)); }
    });
    check('G11f lattice: every numeric-rounds superset row reads refStrip + " reps" iff the remainder is bare (' + secs + ' unique sections, '
          + rows + ' rows, ' + lat.built + ' builds)', mism === 0 && rErr === 0,
          mism + ' sections disagree, ' + rErr + ' render throws' + (ex.length ? ': ' + ex.join(' | ') : ''));
    check('G11f floor: the lattice shows at least one bare and one non-bare round-block row (' + bare + ' bare, ' + nonBare + ' non-bare)',
          bare >= 1 && nonBare >= 1, bare + ' bare, ' + nonBare + ' non-bare: the population cannot fail both ways');
  }

  // ══ G12 — preventionDoseSweep owns the section and keeps the members in sync (D39-iv) ══
  // Scope: 3->2 only, supersets only. Non-superset accessories keep the per-item rewrite.
  const PREV = LATTICE.filter(x => x.cfg.liftingFocus === 'support_prevention');
  const CTRL = LATTICE.filter(x => x.cfg.liftingFocus === 'balanced');
  const prevRounds = {}, prevDesync = [];
  let prevAccessory3 = 0, prevAccessoryTotal = 0;
  eachSection(PREV, (sec) => {
    if(isSuperset(sec)){
      prevRounds[String(sec.rounds)] = (prevRounds[String(sec.rounds)] || 0) + 1;
      const parsed = (sec.items || []).map(it => refItemSets(it && it.detail)).filter(v => v != null);
      // A prevention superset with no authored count, a member that disagrees with the
      // section, or two members that disagree with each other are all the same defect:
      // D2 stopped being the single writer of the dose.
      const bad = (typeof sec.rounds !== 'number')
        || parsed.some(v => v !== sec.rounds)
        || (parsed.length > 1 && new Set(parsed).size > 1);
      if(bad && prevDesync.length < 4){
        prevDesync.push('"' + sec.label + '" rounds=' + JSON.stringify(sec.rounds) + ' members=' + JSON.stringify((sec.items||[]).map(i => i.detail)));
      }
      return;
    }
    (sec.items || []).forEach(it => {
      if(!it || !it.detail) return;
      if(/warmup|min rest/.test(it.detail)) return;
      if(!/@ RPE|sets — RPE/.test(it.detail)) return;
      prevAccessoryTotal++;
      if(refItemSets(it.detail) === 3) prevAccessory3++;
    });
  });
  let ctrlAccessory3 = 0;
  eachSection(CTRL, (sec) => {
    if(isSuperset(sec)) return;
    (sec.items || []).forEach(it => {
      if(!it || !it.detail) return;
      if(/warmup|min rest/.test(it.detail)) return;
      if(!/@ RPE|sets — RPE/.test(it.detail)) return;
      if(refItemSets(it.detail) === 3) ctrlAccessory3++;
    });
  });
  // Every prevention superset must carry an AUTHORED number, and that number is never 3:
  // requiring the number is what keeps this from passing vacuously on a pre-D39 build
  // where `rounds` is undefined and therefore never equal to 3.
  check('G12a prevention halves every 3-round superset section', (prevRounds['3'] || 0) === 0 && (prevRounds['undefined'] || 0) === 0 && (prevRounds['null'] || 0) === 0,
        (prevRounds['3'] || 0) + ' prevention supersets still at 3 rounds, ' + ((prevRounds['undefined'] || 0) + (prevRounds['null'] || 0)) + ' with no authored count; histo ' + JSON.stringify(prevRounds));
  check('G12b prevention members are normalised to the section', prevDesync.length === 0,
        prevDesync.length + ' desynced' + (prevDesync.length ? ': ' + prevDesync[0] : ''));
  check('G12c the sweep is 3->2 only (4-round sections survive)', (prevRounds['4'] || 0) > 0,
        'no 4-round prevention superset survived; histo ' + JSON.stringify(prevRounds));
  check('G12d non-superset accessories keep the per-item rewrite', prevAccessoryTotal > 0 && prevAccessory3 === 0,
        prevAccessory3 + ' of ' + prevAccessoryTotal + ' prevention accessories still at 3 sets');
  check('G12e control: the same grammar DOES carry 3 off prevention', ctrlAccessory3 > 0,
        'balanced builds carry ' + ctrlAccessory3 + ' 3-set accessories (0 would mean the probe is blind)');
}

try { main(); }
catch(e){ fail++; console.log('FAIL G0 gate-harness: unexpected throw ' + (e && e.message)); }

console.log(`PASS ${pass} FAIL ${fail}`);
process.exit(fail ? 1 : 0);
