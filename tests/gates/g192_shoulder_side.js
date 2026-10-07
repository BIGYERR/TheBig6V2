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

// Every row prints through the shared status helper tests/status.js (post-V233 V1; CLAUDE.md Proof scope, Row
// manifest): one status line per declared id; the per-build and per-name families each print ONE loop line.
const S = require('../status')('g192_shoulder_side');
S.declare([
  'L1-builds', 'L2-lattice', 'S1-onehand-side', 'S1-onehand-reach', 'S1-twohand-noside', 'S1-twohand-reach',
  'S2-onehand-side', 'S2-onehand-reach', 'S2-twohand-noside', 'S2-twohand-reach', 'S3-onehand-side',
  'S3-onehand-reach', 'S3-twohand-noside', 'S3-twohand-reach', 'H1-halfmanny', 'C1-copy-each',
]);

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
const LB = S.loop('L1-builds', 'every lattice build runs');
for (const equipment of EQUIP)
  for (const liftingFocus of FOCUS)
    for (const seed of SEEDS) {
      const cfg = Object.assign({}, fixtures.HALF_MANNY, { equipment, liftingFocus, seed });
      let prog;
      try { prog = IA.buildProgram(cfg); }
      catch (e) { LB.fail(`equipment=${equipment} focus=${liftingFocus} seed=${seed}`, `build threw: ${e.message}`); continue; }
      builds++;
      LB.pass(`equipment=${equipment} focus=${liftingFocus} seed=${seed}`);
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

LB.done();
S.check('L2-lattice', builds >= 100, 'the lattice built at least 100 programs', `lattice too thin: only ${builds} builds`);

// ── assertions ───────────────────────────────────────────────────────────────
const SITE_LABEL = {
  S1: 'heavy push Main pairing (raw 3×8)',
  S2: 'light push Main pairing (raw 3×12)',
  S3: 'push Accessory superset (raw 3×15)',
};

for (const site of ['S1', 'S2', 'S3']) {
  const table = seen[site];
  // every one-hand press that reached this site must print a side, every time
  const L1 = S.loop(site + '-onehand-side', `${SITE_LABEL[site]}: every one-hand press prints a side, every time`);
  let oneHandSeen = 0;
  for (const n of ONE_HAND) {
    const m = table[n];
    if (!m) continue;
    oneHandSeen++;
    L1.check(m.plain === 0, n, `${SITE_LABEL[site]}: '${n}' printed NO side in ${m.plain}/${m.each + m.plain} occurrences`);
  }
  L1.done();
  S.check(site + '-onehand-reach', oneHandSeen !== 0, `${SITE_LABEL[site]}: a one-hand press reaches this site`,
    `${SITE_LABEL[site]}: no one-hand press ever reached this site — site MISSING or unreachable, gate is blind`);

  // no two-hand movement may claim a side
  const L2 = S.loop(site + '-twohand-noside', `${SITE_LABEL[site]}: no two-hand movement prints a side`);
  let twoHandSeen = 0;
  for (const n of TWO_HAND) {
    const m = table[n];
    if (!m) continue;
    twoHandSeen++;
    L2.check(m.each === 0, n, `${SITE_LABEL[site]}: two-hand '${n}' printed a side in ${m.each}/${m.each + m.plain} occurrences`);
  }
  L2.done();
  S.check(site + '-twohand-reach', twoHandSeen !== 0, `${SITE_LABEL[site]}: negative control, a two-hand movement reaches this site`,
    `${SITE_LABEL[site]}: no two-hand movement reached this site — negative control is blind`);
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
  const HL = 'HALF MANNY: every one-hand shoulder prescription prints a side';
  if (n === 0) S.fail('H1-halfmanny', HL, 'HALF MANNY: no one-hand press in a shoulder slot — the reported case vanished, gate is blind');
  else S.check('H1-halfmanny', missing === 0, `${HL} (${n} prescriptions)`, `HALF MANNY: ${missing}/${n} one-hand shoulder prescriptions print NO side`);
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
  S.check('C1-copy-each', badCopy === 0, "copy: no detail hyphenates 'each'", `copy: ${badCopy} details hyphenate 'each'`);
}

console.log(`g192_shoulder_side: builds=${builds}`);
for (const site of ['S1', 'S2', 'S3']) {
  const names = Object.keys(seen[site]).filter(n => ONE_HAND.includes(n));
  console.log(`  ${site} ${SITE_LABEL[site]} one-hand: ` +
    (names.length ? names.map(n => `${n} each=${seen[site][n].each} plain=${seen[site][n].plain}`).join(' | ') : 'none'));
}
S.summary();
