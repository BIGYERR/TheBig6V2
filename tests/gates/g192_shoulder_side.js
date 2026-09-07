// GATE g192_shoulder_side — V192 D42-c slice 3.
// Ruling: the shoulder slot must print a side when the movement drawn is a
// ONE-HAND press. Three call sites write that slot:
//   S1  heavy push  'Main — <chest main>' , items[1]  (raw 3×8)
//   S2  light push  'Main — <light press>', items[1]  (raw 3×12)
//   S3  push        'Accessory' superset  , items[1]  (raw 3×15)
//
// ORACLE (independent of the engine): a hand table of movement names. Whether a
// press is one-handed is a fact about the movement, read off the name and the
// doctrine, not off _PRESS_PER_SIDE. The gate never asks the engine what the
// answer should be; it asserts the hand table against printed details.
//   one hand  -> the detail MUST carry ' each'
//   two hands -> the detail MUST NOT carry 'each'
// Sites are identified structurally (section label + item index + the partner's
// detail signature), so a site that stops being written shows up as MISSING.

const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);

// ── hand table ───────────────────────────────────────────────────────────────
// One hand at a time: the load sits on one side and the trunk resists it.
const ONE_HAND = [
  'Kettlebell single-arm press',
  'Landmine rotational press',
];
// Two hands on the bar / both sides worked simultaneously.
const TWO_HAND = [
  'Barbell overhead press',
  'Dumbbell shoulder press',
  'Dumbbell Arnold press',
  'Dumbbell lateral raise',
  'Barbell push press',
  'Seated dumbbell press',
  'Pike pushups',
  'Cable lateral raise',
  'Machine shoulder press',
];

let PASS = 0, FAIL = 0;
const fails = [];
function ok(msg){ PASS++; }
function bad(msg){ FAIL++; fails.push(msg); }

const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const hasEach = d => /\beach\b/.test(String(d || ''));

// ── lattice ──────────────────────────────────────────────────────────────────
// The six real equipment tiers (index.html: hasBarbell = home_full|commercial|
// crossfit). 'full', 'home' and 'travel' are not tier ids — they fell through to
// hasBarbell=false, so this lattice used to exercise exactly ONE barbell tier.
const EQUIP = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];
const FOCUS = ['support_prevention', 'hypertrophy', 'strength', 'general'];
const SEEDS = [];
for (let i = 1; i <= 40; i++) SEEDS.push(i * 1013);

// site -> { name -> {each:n, plain:n} }
const seen = { S1: {}, S2: {}, S3: {} };
function note(site, name, detail){
  const m = (seen[site][name] = seen[site][name] || { each: 0, plain: 0 });
  if (hasEach(detail)) m.each++; else m.plain++;
}

let builds = 0;
for (const equipment of EQUIP)
  for (const liftingFocus of FOCUS)
    for (const seed of SEEDS) {
      const cfg = Object.assign({}, fixtures.HALF_MANNY, { equipment, liftingFocus, seed });
      let prog;
      try { prog = IA.buildProgram(cfg); }
      catch (e) { bad(`build threw equipment=${equipment} focus=${liftingFocus} seed=${seed}: ${e.message}`); continue; }
      builds++;
      const weeks = prog.weeks || {};
      for (const wk of Object.keys(weeks))
        for (const d of DAYS) {
          const day = weeks[wk][d];
          if (!day) continue;
          for (const sec of (day.sections || [])) {
            const label = String(sec.label || '');
            const items = sec.items || [];
            if (items.length !== 2) continue;
            const a = items[0], b = items[1];
            const bn = clean(b.name);
            if (/^Main — /.test(label)) {
              // light push Main pairing carries the reserve cue on item 0.
              const light = /leave 3\+ in reserve/.test(String(a.detail || ''));
              note(light ? 'S2' : 'S1', bn, b.detail);
            } else if (label === 'Accessory') {
              note('S3', bn, b.detail);
            }
          }
        }
    }

if (builds < 100) bad(`lattice too thin: only ${builds} builds`);
else ok('lattice built');

// ── assertions ───────────────────────────────────────────────────────────────
const SITE_LABEL = {
  S1: 'heavy push Main pairing (raw 3×8)',
  S2: 'light push Main pairing (raw 3×12)',
  S3: 'push Accessory superset (raw 3×15)',
};

for (const site of ['S1', 'S2', 'S3']) {
  const table = seen[site];
  // every one-hand press that reached this site must print a side, every time
  let oneHandSeen = 0;
  for (const n of ONE_HAND) {
    const m = table[n];
    if (!m) continue;
    oneHandSeen++;
    if (m.plain === 0) ok(`${site} ${n}`);
    else bad(`${SITE_LABEL[site]}: '${n}' printed NO side in ${m.plain}/${m.each + m.plain} occurrences`);
  }
  if (oneHandSeen === 0) bad(`${SITE_LABEL[site]}: no one-hand press ever reached this site — site MISSING or unreachable, gate is blind`);
  else ok(`${site} reached by ${oneHandSeen} one-hand press(es)`);

  // no two-hand movement may claim a side
  let twoHandSeen = 0;
  for (const n of TWO_HAND) {
    const m = table[n];
    if (!m) continue;
    twoHandSeen++;
    if (m.each === 0) ok(`${site} ${n} two-hand clean`);
    else bad(`${SITE_LABEL[site]}: two-hand '${n}' printed a side in ${m.each}/${m.each + m.plain} occurrences`);
  }
  if (twoHandSeen === 0) bad(`${SITE_LABEL[site]}: no two-hand movement reached this site — negative control is blind`);
  else ok(`${site} negative control: ${twoHandSeen} two-hand movement(s)`);
}

// Mario's own program: the reported case. W1 FRI / W5 MON / W6 MON printed 3×12
// with no arm named. Any shoulder-slot one-hand press on the live cfg must
// carry a side.
{
  const prog = IA.buildProgram(fixtures.HALF_MANNY);
  let n = 0, missing = 0;
  const weeks = prog.weeks || {};
  for (const wk of Object.keys(weeks))
    for (const d of DAYS) {
      const day = weeks[wk][d];
      if (!day) continue;
      for (const sec of (day.sections || [])) {
        const items = sec.items || [];
        const label = String(sec.label || '');
        if (items.length !== 2) continue;
        if (!(/^Main — /.test(label) || label === 'Accessory')) continue;
        const b = items[1];
        if (!ONE_HAND.includes(clean(b.name))) continue;
        n++;
        if (!hasEach(b.detail)) { missing++; console.log(`   HALF MANNY W${wk} ${d.toUpperCase()} ${label} :: ${clean(b.name)} :: ${b.detail}`); }
      }
    }
  if (n === 0) bad('HALF MANNY: no one-hand press in a shoulder slot — the reported case vanished, gate is blind');
  else if (missing === 0) ok(`HALF MANNY: ${n} one-hand shoulder prescriptions all print a side`);
  else bad(`HALF MANNY: ${missing}/${n} one-hand shoulder prescriptions print NO side`);
}

// Copy rule: 'each' is a bare word, never hyphenated into the spec.
{
  const prog = IA.buildProgram(fixtures.HALF_MANNY);
  let badCopy = 0;
  for (const wk of Object.keys(prog.weeks || {}))
    for (const d of DAYS) {
      const day = (prog.weeks[wk] || {})[d];
      if (!day) continue;
      for (const sec of (day.sections || []))
        for (const it of (sec.items || []))
          if (/-each\b|\beach-/.test(String(it.detail || ''))) badCopy++;
    }
  if (badCopy === 0) ok('copy: no hyphenated each');
  else bad(`copy: ${badCopy} details hyphenate 'each'`);
}

console.log(`g192_shoulder_side: builds=${builds}`);
for (const site of ['S1', 'S2', 'S3']) {
  const names = Object.keys(seen[site]).filter(n => ONE_HAND.includes(n));
  console.log(`  ${site} ${SITE_LABEL[site]} one-hand: ` +
    (names.length ? names.map(n => `${n} each=${seen[site][n].each} plain=${seen[site][n].plain}`).join(' | ') : 'none'));
}
fails.forEach(f => console.log('  FAIL ' + f));
console.log(`PASS ${PASS} FAIL ${FAIL}`);
process.exit(FAIL ? 1 : 0);
