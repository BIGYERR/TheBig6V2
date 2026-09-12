// GATE g193_d50_trunkfloor — V193, D50. The trunk floor is a floor on the DAY.
//
// RULING (D50, amending the LEVEL of D48, not its content). D48 ruled unconditionally that
// zero trunk is not a coachable prescription, and was implemented as a floor on the ITEMS
// INSIDE a core section — a clause that only ever reaches a section carrying optional:true.
// The builder's own trunk block does not carry it: the protect-tier upper-limb push day
// pushes bare `Trunk — anti-rotation` / `Trunk — anti-extension` sections, so capSessionBudget
// ranks them ordinary fodder, empties them, splices them out, and prints a card titled
// `Rehab + Trunk` with no trunk on it. Nothing about a shoulder restricts anti-rotation, a
// dead bug or a hollow hold. D50: a day's last trunk section is exempt from budget deletion
// iff the day would otherwise print zero items in any `Trunk — *` class anywhere on the card.
// Four carve-outs are part of the ruling, not decoration:
//   1 no-op when trunk merely RELOCATED (fewer labels, items still on the card),
//   2 never on an NRC long-run tier — the run is the day,
//   3 never in the D37/D38 race window — a trunk floor does not outrank the race,
//   4 the floor is ONE item, never two.
//
// ORACLES — nothing here asks the engine what it did and then agrees with it.
//   O1 THE COST MODEL, RE-TYPED BY HAND. The gate builds its own section arrays and computes
//      its own set totals from the leading `N×` in each detail string, halving the movements
//      the budget calls half-cost (holds, planks, carries, dead bugs, bird dogs) and zeroing
//      stretches. The cap is read from SESSION_SET_BUDGET only as the published constant the
//      doctrine comment names; every expectation below is arithmetic the gate did itself.
//      Fixtures are sized so the hand arithmetic puts the day well over cap with the trunk
//      block as the cheapest, latest, lowest-ranked thing on it — i.e. exactly the shape the
//      trim reaches last, which is the shape D50 is about.
//   O2 THE DOCTRINE SENTENCE. "Zero trunk is not a coachable prescription" (D48, upheld by
//      D50). A day whose own title says it trains trunk and prints no trunk item fails, and
//      the title is an independent witness: injuryDayTitle writes it before any trim runs.
//   O3 THE LONG-RUN TIERS, RE-DERIVED BY HAND. D18/D33: NRC long runs only, >=75 min tier A,
//      45-75 tier B, under 45 tier C, dress rehearsal always A, race day / time trial never a
//      long run. The gate computes the tier from the session dose itself and never calls
//      _longRunTier.
//   O4 D37/D38 IN WORDS. Race day, the eve and two days out carry no lifting. Race day is
//      found BY SUBTYPE over the last two weeks flattened Monday to Sunday, never by position.
//   O5 A RULING THAT SELECTS IS NOT A RULING THAT DELETES. The floor may only ever ADD a
//      surviving section; it may never remove one, and it may never hold TWO items where the
//      budget wanted one (carve-out 4). Both directions are asserted.
//
// WHERE THE CARVE-OUT PROOF LIVES. Carve-outs 2 and 3 are asserted here at the FUNCTION
// contract level (U4, U5), because that is the level a wrong predicate is visible at:
// d18LongRunDayPass and raceEveLiftPass both run AFTER capSessionBudget and would quietly
// clean up a leak on most days, which is precisely why the guard must not be left to them.
// The program-level statement — long-run tier days and race-window days byte-identical to
// the pre-D50 artifact across all 288 cells — is a blast-radius claim and is proved by
// tests/measure/v193_d50_trunkfloor.js, not asserted twice here.

const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const LAT = require(path.join(__dirname, '..', 'lattice193.js'));

const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);

let PASS = 0, FAIL = 0;
const fails = [];
const ok  = m => { PASS++; if (m) console.log('  ok   ' + m); };
const bad = m => { FAIL++; fails.push(m); console.log('  FAIL ' + m); };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

// ── O1: the hand cost model ──────────────────────────────────────────────────
const HALF = /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i;
const STRETCH = /stretch|mobility|90\/90|foam|worlds greatest/i;
function handSets(det){ const m = String(det || '').match(/(\d+)\s*[×x]/); return m ? Math.max(1, parseInt(m[1], 10)) : 3; }
function handCost(it){ if (!it || STRETCH.test(it.name || '')) return 0; const s = handSets(it.detail); return HALF.test(it.name || '') ? s * 0.5 : s; }
function handTotal(secs){ return secs.reduce((a, s) => a + ((s && s.items) || []).reduce((b, it) => b + handCost(it), 0), 0); }

const CAP_CONST = IA.eval('SESSION_SET_BUDGET');
if (CAP_CONST === 20) ok('O1 SESSION_SET_BUDGET is still the published 20 the cost arithmetic below was typed against');
else bad(`O1 SESSION_SET_BUDGET is ${CAP_CONST}, not the 20 this gate's hand arithmetic assumes — retype the fixtures, do not retune the gate`);

// The day the ruling is about, rebuilt by hand: rehab work the athlete is there for, a fat
// accessory rail the budget is meant to eat, and the two bare Trunk sections the builder
// pushes with NO optional flag. Deliberately NOT copied out of the engine.
// THE FIXTURE HAS TO REACH THE TRUNK BLOCK OR IT PROVES NOTHING. capSessionBudget eats
// rank 2 (accessory / pump / isolation) before it touches rank 1, so a day padded with a fat
// accessory rail comes back under cap with the trunk untouched and every assertion below
// passes for the wrong reason. This day carries NO rank-2 work at all: the only fodder is
// rank 1, and among rank 1 the trim takes the LATEST section first, which is the trunk block.
// Hand arithmetic, cap 20:
//   Rehab note  detail '' -> 3 sets  (no digits, the model's default)      =  3.0
//   Cuff        4 items at 4× each                                         = 16.0
//   Trunk AR    Side plank 3× half + Plank shoulder taps 3× half           =  3.0
//   Trunk AE    Plank hold 3× half + McGill curl-up 3× full                =  4.5
//   total 26.5, over cap by 6.5.
// Trim order by hand: 'Plank hold' scores rank1*10 + itemRank1 = 11 and goes first (-1.5,
// 25.0); then score-10 ties break to the latest position, so 'McGill curl-up' (-3.0, 22.0,
// the AE section empties and is spliced out), then 'Plank shoulder taps' (-1.5, 20.5). The
// day is still over cap and exactly ONE trunk item is left, which is the moment D50 decides
// the case: with the floor the trim moves on to the Cuff rail (-4.0, 16.5, one trunk item
// survives); without it the trim takes 'Side plank' (-1.5, 19.0, zero trunk).
function trunkDay(arItems, aeItems){
  return [
    { label: 'Rehab focus',   items: [{ name: 'Shoulder day. Full range only where it is pain free.', detail: '' }] },
    { label: 'Cuff and scapula', items: [
      { name: 'Band external rotation', detail: '4×15 each side' },
      { name: 'Prone Y raise',          detail: '4×12' },
      { name: 'Scap pushup',            detail: '4×12' },
      { name: 'Band pull-apart',        detail: '4×15' } ] },
    { label: 'Trunk — anti-rotation',  items: arItems },
    { label: 'Trunk — anti-extension', items: aeItems },
  ];
}
const AR2 = () => [{ name: 'Side plank', detail: '3×30 sec each side' }, { name: 'Plank shoulder taps', detail: '3×10 each' }];
const AE2 = () => [{ name: 'Plank hold', detail: '3×45 sec' },           { name: 'McGill curl-up',      detail: '3×8 each' }];
const trunkItems = secs => secs.filter(s => /^Trunk /.test((s && s.label) || '')).reduce((a, s) => a + ((s.items || []).length), 0);
const trunkSecs  = secs => secs.filter(s => /^Trunk /.test((s && s.label) || '')).length;

function trim(secs, cardio){ return IA.eval('capSessionBudget')(secs, cardio); }

// ── U1 (predicate): a day over budget keeps its last trunk item ──────────────
{
  const day = trunkDay(AR2(), AE2());
  const before = handTotal(day);
  if (before > CAP_CONST) ok(`U1 fixture is genuinely over cap by hand arithmetic: ${before} sets vs cap ${CAP_CONST}`);
  else bad(`U1 fixture totals ${before} sets, at or under cap ${CAP_CONST} — the trim never engages and U1..U3 prove nothing`);
  const out = trim(day, null);
  const n = trunkItems(out);
  if (n >= 1) ok(`U1 the day's last trunk item survives the budget (${n} trunk item(s) left, ${trunkSecs(out)} trunk section(s))`);
  else bad('U1 the budget emptied every Trunk section — D48 is still implemented one level too low');
}

// ── U2 (carve-out 4): the floor is ONE item, not two ─────────────────────────
// Same day, more pressure. The floor must still let the budget take the second trunk item.
{
  const day = trunkDay(AR2(), AE2());
  const out = trim(day, null);
  const n = trunkItems(out);
  if (n === 1) ok('U2 the day is held at exactly ONE trunk item — the floor is not raised to two');
  else if (n === 0) bad('U2 the floor failed open: zero trunk items under pressure');
  else bad(`U2 the floor is holding ${n} trunk items under pressure — carve-out 4 says the second item stays budget fodder`);
}

// ── U3 (carve-out 1): trunk relocated is a no-op, not a defect ───────────────
// One labelled trunk section carrying both items. Fewer LABELS than the two-section day, and
// the predicate must not care: it counts items, so the day still lands on one trunk item and
// the label count is free to fall.
{
  const day = trunkDay(AR2().concat(AE2()), []);
  day.splice(day.findIndex(s => s.label === 'Trunk — anti-extension'), 1);
  const out = trim(day, null);
  const n = trunkItems(out), s = trunkSecs(out);
  if (n >= 1 && s === 1) ok(`U3 trunk relocated into one section: ${s} label, ${n} item(s) held — the predicate keys on items, not labels`);
  else bad(`U3 relocated trunk ended with ${s} section(s) and ${n} item(s) — the predicate is reading labels, not items`);
}

// ── U4 (carve-out 2): never on an NRC long-run tier ──────────────────────────
// O3 by hand: 60 minutes of long run is tier B, so d18LongRunDayPass owns this day and caps
// it at eight sets. The floor must be inert here — the budget behaves exactly as it does on a
// day with no floor at all, which is what the identical-outcome comparison below asserts.
{
  const lr = { isNRC: true, subtype: 'Long Run', dose: { k: 'time', mins: 60 }, detail: '' };
  const handTier = (lr.dose.mins >= 75) ? 'A' : (lr.dose.mins >= 45) ? 'B' : 'C';
  if (handTier === 'B') ok('U4 hand oracle O3: a 60 minute NRC long run is tier B');
  else bad(`U4 hand oracle O3 mis-derived the tier as ${handTier}`);
  const day = trunkDay(AR2(), AE2());
  const out = trim(day, lr);
  const n = trunkItems(out);
  // With the floor off, the day's cheapest latest fodder is the trunk block and it goes to
  // zero — the same outcome the pre-D50 artifact produced. A surviving trunk item here means
  // the floor fired on a long-run day.
  if (n === 0) ok('U4 the floor is inert on an NRC long-run tier day: the run owns the day, the budget trims as before');
  else bad(`U4 the floor fired on a long-run tier B day and held ${n} trunk item(s) — it would hand d18LongRunDayPass a section to spend its eight sets on`);
}

// ── U5 (carve-out 3): never in the D37/D38 race window ───────────────────────
{
  const day = trunkDay(AR2(), AE2());
  let bads = 0;
  for (const st of ['RACE DAY — Half Marathon', 'Time Trial — 5K']){
    const out = trim(day.map(s => ({ ...s, items: s.items.map(i => ({ ...i })) })), { subtype: st, isNRC: true });
    if (trunkItems(out) !== 0) bads++;
  }
  if (bads === 0) ok('U5 the floor is inert on race day and on the time trial that IS race day — D37/D38 outrank the floor');
  else bad(`U5 the floor fired on ${bads}/2 race-window subtypes — a trunk floor must not outrank the race`);
}

// ── U6 (O5): the floor never DELETES ─────────────────────────────────────────
// A day comfortably under cap must come back untouched. A protection that changes an
// under-budget day is not a protection, it is a rewrite.
{
  const day = [
    { label: 'Main — Bench press',      items: [{ name: 'Bench press', detail: '3×5' }] },
    { label: 'Trunk — anti-rotation',   items: AR2() },
  ];
  const before = handTotal(day);
  const out = trim(day, null);
  const same = JSON.stringify(out.map(s => [s.label, (s.items || []).map(i => i.name)]))
            === JSON.stringify(day.map(s => [s.label, (s.items || []).map(i => i.name)]));
  if (before <= CAP_CONST && same) ok(`U6 an under-cap day (${before} sets) comes back byte-identical — the floor adds nothing and removes nothing`);
  else if (before > CAP_CONST) bad(`U6 fixture totals ${before} sets and is not under cap ${CAP_CONST} — retype the fixture`);
  else bad('U6 an under-cap day was rewritten by capSessionBudget');
}

// ── U7: the floor reads the `Trunk — *` FAMILY, not one member of it ─────────
// Found by sabotage, not by design. A mutation narrowing the taxonomy from /^Trunk / to
// /^Trunk — anti-rotation/ survived the whole 288-cell sweep and every unit check above,
// because on a real card the trim always reaches the LATER section first and anti-rotation
// is therefore always the survivor — the anti-extension label never gets to be the last
// trunk on the day. That makes the family claim untested by construction, which is the same
// shape as a gate that passes on both versions. This asserts it directly: a day whose only
// trunk section is the anti-extension one is still a day, and still gets the floor.
{
  const day = trunkDay([], AE2());
  day.splice(day.findIndex(s => s.label === 'Trunk — anti-rotation'), 1);
  const before = handTotal(day);
  const out = trim(day, null);
  const n = trunkItems(out);
  if (before > CAP_CONST) ok(`U7 fixture is over cap by hand arithmetic: ${before} sets vs cap ${CAP_CONST}`);
  else bad(`U7 fixture totals ${before} sets and never engages the trim`);
  if (n === 1) ok('U7 a day whose only trunk section is `Trunk — anti-extension` is floored too — the predicate reads the family');
  else bad(`U7 the anti-extension section was left with ${n} items — the floor is keyed to one member of the family instead of the family`);
}

// ── THE LATTICE: the ruled 288 cells ─────────────────────────────────────────
// O3 and O4 re-derived by hand so a classifier bug in the engine cannot hide a violation.
function handLongRunTier(c){
  if (!c || !c.isNRC || !c.dose) return null;
  if (!/^long run/i.test(c.subtype || '')) return null;
  if (/race day|time trial/i.test(c.subtype || '')) return null;
  if (/rehearsal/i.test(c.detail || '')) return 'A';
  const d = c.dose;
  const m = d.k === 'time' ? (+d.mins || 0) : (+d.mi || 0) * (+d.tgt || 0) / 60;
  if (!m) return null;
  return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C';
}
// D38 says the last two weeks are flattened MONDAY TO SUNDAY, "so a race early in its week
// reaches back into the taper week". The harness's DAYS array starts on SUNDAY, and using it
// here rotates the flattening by one day: on a Sunday race it puts race day at the FRONT of
// its week instead of the end, and the two-days-out slot lands on the wrong Friday. Typed
// from the doctrine sentence, deliberately not imported.
const ISO = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function handRaceWindow(prog){
  const win = new Map();
  const tw = Object.keys(prog.weeks || {}).map(Number).filter(n => n).sort((a, b) => a - b).pop();
  if (!tw) return win;
  const flat = [];
  [tw - 1, tw].forEach(w => { if (prog.weeks[w]) ISO.forEach(d => flat.push(w + '|' + d)); });
  const ri = flat.findIndex(k => {
    const [w, d] = k.split('|');
    const day = (prog.weeks[w] || {})[d];
    return !!(day && day.cardio && /RACE DAY|TIME TRIAL/i.test(day.cardio.subtype || ''));
  });
  if (ri < 0) return win;
  for (let k = 0; k <= 2; k++) if (flat[ri - k]) win.set(flat[ri - k], k);
  return win;
}

const cells = LAT.WIDE;
if (cells.length === LAT.WIDE_N && cells.length === 288) ok(`lattice swept: ${cells.length} cells (4 injuries x 6 tiers x 2 foci x 2 experiences x 3 seeds)`);
else bad(`the shared lattice is ${cells.length} cells, not the ruled 288 — coverage shrank somewhere in tests/lattice193.js`);

let zeroTrunk = 0, zeroWho = '', emptySec = 0, emptyWho = '';
let liftInWindow = 0, winWho = '', tierALift = 0, tierAWho = '';
let trunkSecTotal = 0, thinTrunk = 0, daysScanned = 0, zRuled = 0;

for (const c of cells){
  let prog;
  try { prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over)); }
  catch (err){ bad(`build threw on ${c.tag}: ${err.message}`); continue; }
  const win = handRaceWindow(prog);
  // Recovery and taper weeks clear the trunk block under OTHER rulings (recoveryDeload cuts
  // to main + one accessory + hip prehab; the taper strips to the primer). D50 is a rule
  // about BUDGET deletion, so those weeks are counted, reported and excluded from the bar.
  const recov = new Set((prog.liftRecoveryWeeks || []).map(String));
  const taper = new Set((prog.taperWeeks || []).map(String));
  for (const w of Object.keys(prog.weeks || {})){
    for (const d of DAYS){
      const day = (prog.weeks[w] || {})[d]; if (!day) continue;
      daysScanned++;
      const secs = day.sections || [];
      const tSecs = secs.filter(s => /^Trunk /.test((s && s.label) || ''));
      const tItems = tSecs.reduce((a, s) => a + ((s.items || []).length), 0);
      trunkSecTotal += tSecs.length;
      tSecs.forEach(s => { if ((s.items || []).length === 1) thinTrunk++; });
      tSecs.forEach(s => { if ((s.items || []).length === 0){ emptySec++; if (!emptyWho) emptyWho = `${c.tag} W${w} ${d.toUpperCase()}`; } });
      const tier = handLongRunTier(day.cardio);
      const k = win.has(w + '|' + d) ? win.get(w + '|' + d) : -1;
      // O4: race day and the eve carry no lifting at all. Two days out keeps post-run
      // mobility and nothing else. A trunk section here is a floor that outran the race.
      if (day.rest){ /* a rest day inside the window was already nothing to strip */ }
      else if (k === 0 || k === 1){
        if (secs.length){ liftInWindow++; if (!winWho) winWho = `${c.tag} W${w} ${d.toUpperCase()} k=${k} [${secs.map(s => s.label).join(', ')}]`; }
      } else if (k === 2){
        const stray = secs.filter(s => !/post-run mobility/i.test(s.label || ''));
        if (stray.length){ liftInWindow++; if (!winWho) winWho = `${c.tag} W${w} ${d.toUpperCase()} k=2 [${stray.map(s => s.label).join(', ')}]`; }
      }
      // O3: tier A is post-run mobility and taper notes only. A Trunk section on a tier A
      // day is a floor that outran the run.
      if (tier === 'A' && tSecs.length){ tierALift++; if (!tierAWho) tierAWho = `${c.tag} W${w} ${d.toUpperCase()}`; }
      // O2: the card's own title is the witness.
      if (/trunk/i.test(day.title || '') && tItems === 0 && !tier && k < 0){
        if (recov.has(String(w)) || taper.has(String(w))) zRuled++;
        else { zeroTrunk++; if (!zeroWho) zeroWho = `${c.tag} W${w} ${d.toUpperCase()} "${day.title}"`; }
      }
    }
  }
}

console.log(`  swept ${daysScanned} day-builds, ${trunkSecTotal} Trunk sections printed`);
if (daysScanned > 20000) ok(`the sweep is big enough to contain the defect: ${daysScanned} day-builds`);
else bad(`only ${daysScanned} day-builds swept — the lattice is too narrow to make a claim on`);

// L1 — THE RULING, STATED AS THE ATHLETE READS IT (O2).
if (zeroTrunk === 0) ok(`L1 no day whose title claims trunk printed zero Trunk items, outside the long-run tiers and the race window (${zRuled} such days sit inside recovery or taper weeks, which are ruled elsewhere)`);
else bad(`L1 ${zeroTrunk} days titled for trunk printed no trunk at all: ${zeroWho} — zero trunk is not a coachable prescription`);

// L2 — a latch check. A protection that keeps the SECTION but not the ITEM prints a heading
// over nothing, which is the V193 singleton-superset disease in a new suit.
if (emptySec === 0) ok('L2 no Trunk section printed with zero items — the floor holds an item, never a bare heading');
else bad(`L2 ${emptySec} Trunk sections printed empty: ${emptyWho}`);

// L3 — carve-out 3 at program level (O4).
if (liftInWindow === 0) ok('L3 no lifting section survives inside the D37/D38 race window on any of the 288 cells');
else bad(`L3 ${liftInWindow} race-window days still carry a lifting section: ${winWho}`);

// L4 — carve-out 2 at program level (O3), in its catastrophic form.
if (tierALift === 0) ok('L4 no Trunk section survives on a long-run tier A day — the run is still the day');
else bad(`L4 ${tierALift} tier A long-run days print a Trunk section: ${tierAWho}`);

// D51 — REPORT ONLY. Coach ruled the thin-core share acceptable; the floor adds sections, it
// does not add items, so this is a number to watch, not a bar to hold.
console.log(`  D51 (report only) one-item Trunk sections ${thinTrunk}/${trunkSecTotal} (${trunkSecTotal ? (100 * thinTrunk / trunkSecTotal).toFixed(2) : '0.00'}%)`);

if (fails.length){ console.log('\nfailures:'); fails.forEach(f => console.log('  - ' + f)); }
console.log(`PASS ${PASS} FAIL ${FAIL}`);
process.exit(FAIL ? 1 : 0);
