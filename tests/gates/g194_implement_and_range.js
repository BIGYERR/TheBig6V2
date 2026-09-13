// GATE g194_implement_and_range — V194. D53, D54, D55.
//
// THREE CLAIMS, one sentence each.
//   D53  The main-lift progress line states a NUMBER and a UNIT and never an IMPLEMENT.
//   D54  The travel overlay's holds copy never asserts an implement either.
//   D55  A lift's Range Ladder membership is decided by the most recent session that
//        CARRIES a range, never by whichever session happened to be logged last.
//
// WHY THIS GATE EXISTS. The app does not know what the athlete picked up. It knows a
// number in a log field. "up 20 lbs on the bar" was false on 245,323 of 315,892 reachable
// main-slot occurrences (77.7%), and 100% false on the bodyweight, home_basic and minimal
// tiers, where there is no bar at all. The same defect class sat in the travel overlay,
// where "the heaviest pair they have" was gated only on equipment!=='bodyweight' and so
// fired for "Full gym" too. D55 is the same family one level down: a claim about a lift
// ("this one runs on a rep range") was being read off the single most recent row, so a
// primer week — the least representative session in a block, prescribed fixed low reps by
// design — silently moved a lift out of the Range Ladder and into Other Accessory Work,
// then back, on nothing but log recency.
//
// ORACLES — none of these asks the engine what it did and then agrees with it.
//
//   O1  THE HAND-RENDERED LINE. The expected progress line is typed here by hand from the
//       ruling's after-grid: "Opened at 60×12 · up 20 lbs · heaviest in week 3". The kg
//       variant is computed by hand off the file's own rounding rule (round(w*0.453592*2)/2:
//       80 lbs -> 36.5 kg, 60 lbs -> 27 kg, gain 9.5 kg) and typed as a literal, not read
//       back out of disp().
//
//   O2  THE COPY RULE (CLAUDE.md, standing). The app sounds like a coach and never asserts
//       equipment it does not know. The banned vocabulary below is an implement list, not a
//       diff of the old string: any of these words in a line whose only input is a NUMBER is
//       a claim the app cannot support. No mid-sentence hyphens or em-dashes either.
//
//   O3  THE DOUBLE-PROGRESSION GRAMMAR, from the file's own prescription format and from
//       V137: a range row reads "N×lo–hi". A primer row reads "N×R". These are different
//       shapes, and _rxRangeFor is the reader. The D55 fixture is hand built from that
//       grammar — never from a generated program — so the gate cannot inherit an engine bug.
//
//   O4  A RULING THAT SELECTS IS NOT A RULING THAT DELETES. D55 may only MOVE a lift that
//       has a range somewhere in its history. A lift that never carried one must still fall
//       to Other Accessory Work, and a main-slot lift must still route to mains. Both are
//       negative controls below.
//
//   O5  THE CURRENT SET PERFORMANCE IS STILL THE LAST SESSION. D55 redirects the RANGE
//       lookup only. sets/wt stay _setsOf(last)/last.weight. The fixture is built so that a
//       wrong redirect is visible: the range-carrying session did 12s (ready), the last
//       session did 6s (not ready). If `ready` comes back true, sets was redirected.

const path = require('path');
const { load } = require(path.resolve(__dirname, '..', 'harness.js'));
const FILE = process.argv[2] || path.resolve(__dirname, '..', '..', 'index.html');
const IA = load(FILE);

let PASS = 0, FAIL = 0; const fails = [];
const ok = () => PASS++;
const bad = m => { FAIL++; fails.push(m); };

const ledgerModel = IA.eval('ledgerModel');
const buildMainLiftBlock = IA.eval('buildMainLiftBlock');
if (typeof ledgerModel !== 'function') bad('ledgerModel not reachable in the VM');
if (typeof buildMainLiftBlock !== 'function') bad('buildMainLiftBlock not reachable in the VM');

const text = h => String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// O2 vocabulary. Every one of these names a physical object the log field does not identify.
const IMPLEMENT_WORDS = [
  'on the bar', 'the bar', 'barbell', 'dumbbell', 'kettlebell',
  'plates', 'pair they have', 'machine', 'bands', 'sandbag'
];
const implementClaims = s => IMPLEMENT_WORDS.filter(w => s.toLowerCase().includes(w));

// ───────────────────────────── D53 ─────────────────────────────
// Hand-built model. Nothing here came out of buildProgram.
const MODEL = {
  name: 'Bench press',
  series: [{ w: 1, wt: 60 }, { w: 3, wt: 80 }],
  heavy: { wt: 80, reps: 12, week: 3 },
  first: { wt: 60, reps: 12 },
  hidden: 0
};
let d53Lbs = '', d53Kg = '', d53Flat = '';
{
  d53Lbs = text(buildMainLiftBlock(MODEL, 'lbs'));
  // O1, typed by hand from the ruling's after-grid.
  const want = 'Bench press 80×12 Opened at 60×12 · up 20 lbs · heaviest in week 3';
  if (d53Lbs.startsWith(want)) ok();
  else bad(`D53 lbs line: expected to start "${want}", got "${d53Lbs.slice(0, 90)}"`);

  d53Kg = text(buildMainLiftBlock(MODEL, 'kg'));
  const wantKg = 'Bench press 36.5×12 Opened at 27×12 · up 9.5 kg · heaviest in week 3';
  if (d53Kg.startsWith(wantKg)) ok();
  else bad(`D53 kg line: expected to start "${wantKg}", got "${d53Kg.slice(0, 90)}"`);

  // O2 on the rendered string, on both units.
  const cl = implementClaims(d53Lbs).concat(implementClaims(d53Kg));
  if (!cl.length) ok();
  else bad(`D53 implement claim survives in the rendered progress line: ${JSON.stringify(cl)}`);

  // O4 negative control: no gain -> the clause is absent entirely, not empty-rendered.
  const flat = { name: 'Bench press', series: [{ w: 1, wt: 60 }, { w: 2, wt: 60 }],
                 heavy: { wt: 60, reps: 10, week: 2 }, first: { wt: 60, reps: 10 }, hidden: 0 };
  d53Flat = text(buildMainLiftBlock(flat, 'lbs'));
  if (!d53Flat.includes(' up ') && d53Flat.includes('heaviest in week 2')) ok();
  else bad(`D53 no-gain control: got "${d53Flat.slice(0, 90)}"`);

  // The ruling forbade a lookup / regex / conditional on the implement. The only
  // conditional left in that expression is the numeric gain>0 test.
  const m = IA.html.match(/\+\(gain>0\?[^\n]*\n/);
  if (!m) bad('D53: the progress-line expression is gone from the file');
  else if (!/on the bar/.test(m[0]) && (m[0].match(/\?/g) || []).length === 1) ok();
  else bad(`D53: progress-line expression grew a branch or kept the claim: ${m[0].trim()}`);
}

// ───────────────────────────── D54 ─────────────────────────────
let holdsBw = '', holdsGear = '';
{
  const seam = IA.html.match(/const holds = _ovDraft\.equipment===[^\n]*\n[^\n]*\n[^\n]*\n/);
  if (!seam) { bad('D54: the travel-overlay holds seam is gone from the file'); }
  else {
    const src = seam[0];
    const lines = src.split('\n');
    holdsBw = (lines[1] || '').replace(/\\u2019/g, '’');
    holdsGear = (lines[2] || '').replace(/\\u2019/g, '’');

    // Hand-typed after-copy from the ruling.
    if (holdsGear.includes('Grab the heaviest load you can control and work in the 8 to 12 range.')) ok();
    else bad(`D54: the ruled sentence is not in the non-bodyweight branch: ${holdsGear.trim().slice(0, 120)}`);

    // O2: neither branch may assert an implement.
    const cl = implementClaims(holdsBw).concat(implementClaims(holdsGear));
    if (!cl.length) ok();
    else bad(`D54 implement claim in the travel overlay copy: ${JSON.stringify(cl)}`);

    // Copy rule: no mid-sentence hyphen, no em-dash, in either branch.
    const body = (holdsBw + holdsGear).replace(/^[^']*'/, '');
    if (!/\w-\w/.test(body) && !body.includes('—')) ok();
    else bad(`D54 copy rule: mid-sentence hyphen or em-dash in the holds copy`);

    // The gate stayed a two-branch bodyweight test. D54 ruled a copy change, not a
    // new equipment conditional (which would be the D53 defect wearing a fix's clothes).
    if (/_ovDraft\.equipment==='bodyweight'\s*$/.test(lines[0].trim()) && !/equipment===/.test(holdsGear)) ok();
    else bad(`D54: the holds branch grew an equipment conditional: ${lines[0].trim()}`);

    // O4: the instruction that is NOT an equipment claim must survive.
    if (holdsGear.includes('If that still feels easy, go single arm.')) ok();
    else bad('D54: "go single arm" was deleted; a ruling that rewords is not a ruling that deletes');
  }
}

// ───────────────────────────── D55 ─────────────────────────────
// Hand-built log. O3 grammar: "3×8–12" carries a range, "3×6" does not.
function fixture(rows) {
  const hist = {}, entries = [];
  rows.forEach(r => {
    hist['w' + r.week + '_' + r.day] = {
      sections: [{ label: 'Accessory', items: [{ name: r.name, detail: r.detail }] }]
    };
    entries.push({ week: r.week, day: r.day, ts: r.ts, weight: r.weight, setsDone: r.sets });
  });
  return { hist, entries };
}
const NAME = 'Dumbbell curl';
let ladderNames = [], plainNames = [];
{
  // PRIMER LAST. Week 1 carried 3×8–12 and the athlete hit 12s. Week 2 is a primer at
  // fixed 6s. Under V193 this lift fell out of the Range Ladder. It must not.
  const f = fixture([
    { name: NAME, week: 1, day: 'mon', ts: 100, weight: 30, sets: [12, 12, 12], detail: '3×8–12 — RPE 8' },
    { name: NAME, week: 2, day: 'mon', ts: 200, weight: 25, sets: [6, 6, 6], detail: '3×6 — RPE 5–6 (primer)' }
  ]);
  const r = ledgerModel({ k1: { name: NAME, entries: f.entries } }, f.hist);
  const row = r.ladder.find(x => x.name === NAME);
  ladderNames = r.ladder.map(x => x.name); plainNames = r.plain.map(x => x.name);
  if (row) ok(); else bad('D55 primer-last: the lift fell out of the Range Ladder');
  if (row && row.lo === 8 && row.hi === 12) ok();
  else bad(`D55 primer-last: expected lo 8 hi 12 from week 1, got ${row && row.lo}–${row && row.hi}`);
  // O5: set performance is still the LAST session (6s at 25), not the range-carrying one.
  if (row && row.wt === 25 && JSON.stringify(row.sets) === '[6,6,6]') ok();
  else bad(`D55: sets/wt were redirected off the last session: wt=${row && row.wt} sets=${JSON.stringify(row && row.sets)}`);
  if (row && row.ready === false) ok();
  else bad('D55: `ready` is true, so the primer week is being scored against the range it was never given');
}
{
  // MOST RECENT RANGE WINS. Week 1 said 5–8, week 3 said 8–12, week 4 is a primer.
  // Entries fed OUT OF ORDER, to prove the ascending sort at the top of ledgerModel
  // is what the backwards walk relies on.
  const f = fixture([
    { name: NAME, week: 3, day: 'tue', ts: 300, weight: 35, sets: [9, 9], detail: '3×8–12 — RPE 8' },
    { name: NAME, week: 1, day: 'mon', ts: 100, weight: 30, sets: [8, 8], detail: '3×5–8 — RPE 8' },
    { name: NAME, week: 4, day: 'mon', ts: 400, weight: 30, sets: [6, 6], detail: '3×6 — RPE 5' }
  ]);
  const r = ledgerModel({ k1: { name: NAME, entries: f.entries } }, f.hist);
  const row = r.ladder.find(x => x.name === NAME);
  if (row && row.lo === 8 && row.hi === 12) ok();
  else bad(`D55 recency: expected week 3's 8–12, got ${row && row.lo}–${row && row.hi} (walk is not backwards, or all is unsorted)`);
}
{
  // O4 negative control A: no session EVER carried a range -> Other Accessory Work.
  const f = fixture([
    { name: 'Dumbbell shrug', week: 1, day: 'mon', ts: 100, weight: 40, sets: [10], detail: '3×10 — RPE 7' },
    { name: 'Dumbbell shrug', week: 2, day: 'mon', ts: 200, weight: 45, sets: [10], detail: '3×10 — RPE 8' }
  ]);
  const r = ledgerModel({ k1: { name: 'Dumbbell shrug', entries: f.entries } }, f.hist);
  if (!r.ladder.length && r.plain.length === 1) ok();
  else bad(`D55 control A: a lift with no range anywhere reached the Range Ladder (ladder=${r.ladder.length})`);
}
{
  // O4 negative control B: the V193 behaviour is unchanged when the LAST session carries
  // the range. This gate must not be a one-way ratchet.
  const f = fixture([
    { name: NAME, week: 1, day: 'mon', ts: 100, weight: 30, sets: [8, 8], detail: '3×8–12 — RPE 8' },
    { name: NAME, week: 2, day: 'mon', ts: 200, weight: 35, sets: [12, 12], detail: '3×8–12 — RPE 8' }
  ]);
  const r = ledgerModel({ k1: { name: NAME, entries: f.entries } }, f.hist);
  const row = r.ladder.find(x => x.name === NAME);
  if (row && row.lo === 8 && row.hi === 12 && row.wt === 35 && row.ready === true) ok();
  else bad(`D55 control B: normal case regressed: ${JSON.stringify(row)}`);
}
{
  // O4 negative control C: a MAIN-slot lift still routes to mains and never to the ladder,
  // even though its last session is a primer with no range.
  const hist = {
    w1_mon: { sections: [{ label: 'Main — Back squat', items: [{ name: 'Back squat', detail: '3×8–12 — RPE 8' }] }] },
    w2_mon: { sections: [{ label: 'Main — Back squat', items: [{ name: 'Back squat', detail: '3×6 — RPE 5' }] }] }
  };
  const entries = [
    { week: 1, day: 'mon', ts: 100, weight: 155, setsDone: [12, 12] },
    { week: 2, day: 'mon', ts: 200, weight: 175, setsDone: [6, 6] }
  ];
  const r = ledgerModel({ k1: { name: 'Back squat', entries } }, hist);
  if (r.mains.length === 1 && !r.ladder.length && !r.plain.length) ok();
  else bad(`D55 control C: main-slot routing changed (mains=${r.mains.length} ladder=${r.ladder.length} plain=${r.plain.length})`);
}
{
  // Structural: rng is assigned in exactly one place in ledgerModel and the consumer
  // below still reads that binding.
  const body = IA.html.slice(IA.html.indexOf('function ledgerModel('));
  const seg = body.slice(0, body.indexOf('\n}\n'));
  const assigns = (seg.match(/\brng\s*=/g) || []).length;
  if (assigns === 2 && /if\(rng&&sets\.length\)/.test(seg) && /\blet rng=null;/.test(seg)) ok();
  else bad(`D55 structural: rng assignments=${assigns} (expected 2: the let and the loop), consumer intact=${/if\(rng&&sets\.length\)/.test(seg)}`);
}

console.log(`g194_implement_and_range: version=${IA.version}`);
console.log(`  D53 lbs :: ${d53Lbs.slice(0, 80)}`);
console.log(`  D53 kg  :: ${d53Kg.slice(0, 80)}`);
console.log(`  D53 flat:: ${d53Flat.slice(0, 80)}`);
console.log(`  D54 gear:: ${holdsGear.trim().slice(0, 130)}`);
console.log(`  D55 primer-last -> ladder=${JSON.stringify(ladderNames)} plain=${JSON.stringify(plainNames)}`);
fails.forEach(f => console.log('  FAIL ' + f));
console.log(`PASS ${PASS} FAIL ${FAIL}`);
process.exit(FAIL ? 1 : 0);
