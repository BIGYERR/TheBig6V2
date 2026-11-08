// Measure (Post-v0.256.0): what a logged run says about the mile anchor, before any ruling on a nudge.
// Questions: (1) on a recovery-pace card, how much faster than prescribed does a logged run have to be before the
// pace chart reads it as a whole row faster? (2) what do Mario's own watch runs (COROS, read 2026-11-07, typed here)
// imply, by column? (3) how many runs a week does a race program hand the rule, and in which weeks is the pencil
// unlocked (the last three weeks lock it, D189)? Nothing here asks the engine for an expected value: the chart is read
// as data and the arithmetic is the chart's own interpolation.
//   node tests/measure/mile-anchor_logged-pace.js [index.html]
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const IA = H.load(process.argv[2] || path.join(__dirname, '..', '..', 'index.html'));
const CHART = IA.eval('PACE_CHART'), lookup = IA.eval('paceChartLookup');
const fmt = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
const rowsFaster = (anchorSec, impliedSec) => (anchorSec - impliedSec) / 30;   // the chart's rows are 30 s of mile apart

console.log('== 1. A recovery-pace card: logged pace faster than prescribed → implied mile anchor (recovery column) → rows faster');
console.log('anchor   rx recovery | ' + [15, 30, 45, 60, 90, 120, 137].map(d => ('-' + d + 's').padStart(6)).join(' '));
for (const row of CHART) {
  const cells = [15, 30, 45, 60, 90, 120, 137].map(d => { const imp = lookup('recovery', row.recovery - d).mile; return rowsFaster(row.mile, imp).toFixed(1).padStart(6); });
  console.log(fmt(row.mile).padStart(6) + '   ' + fmt(row.recovery).padStart(5) + '/mi  | ' + cells.join(' '));
}
console.log('(a row is 30 s of mile; the recovery column steps 25 to 35 s/mi per row, so about 35 s/mi faster than prescribed reads as one row on most of the chart)');

console.log('\n== 2. Mario: anchor 10:30 (row mile 630, recovery 13:20, tempo 12:00, 10K 11:35). COROS runs, typed by hand:');
const anchor = 630;
const runs = [
  ['Mon 26 Oct tempo 36:24, 5.64 km', 'tempo', 10 * 60 + 23],
  ['Sat 31 Oct long 1:00:10, 8.79 km (HR 165)', 'recovery', 11 * 60 + 1],
  ['Wed 4 Nov run 20:14, 3.24 km (HR 168)', 'tempo', 10 * 60 + 4],
  ['Sat 7 Nov long 1:00:59, 8.88 km (HR 167, max 184)', 'recovery', 11 * 60 + 3],
];
for (const [what, col, sec] of runs) {
  const imp = lookup(col, sec).mile;
  console.log(`  ${what}: ${fmt(sec)}/mi read as ${col} → mile ${fmt(imp)}, ${rowsFaster(anchor, imp).toFixed(1)} rows faster than 10:30`);
}
const impT = lookup('tempo', 10 * 60 + 23).mile, impR = lookup('recovery', 11 * 60 + 3).mile;
console.log(`  the two columns disagree by ${((impT - impR) / 30).toFixed(1)} rows: the long runs were run at tempo effort (HR 88 to 92% of max), so the recovery column overstates him.`);
console.log(`  read by the tempo column (the honest one): mile about ${fmt(impT)}; a 9:00 anchor (row 540) prescribes recovery ${fmt(lookup('mile', 540).recovery)}/mi, tempo ${fmt(lookup('mile', 540).tempo)}/mi, 10K ${fmt(lookup('mile', 540).tenK)}/mi.`);

console.log('\n== 3. Race programs: paced run cards a week, by kind, and the weeks the pencil is unlocked (locked when totalWeeks − week < 3)');
const kinds = c => { const s = String(c.subtype || ''); return /^recovery run/i.test(s) ? 'recovery' : /^long run/i.test(s) ? 'long' : 'speed'; };
for (const g of ['run_5k', 'run_10k', 'run_half', 'run_marathon']) for (const exp of ['beginner', 'intermediate']) {
  const cfg = JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY)); cfg.cardioGoals.run.id = g; cfg.experience = exp;
  const p = IA.buildProgram(cfg); const tw = p.totalWeeks; const per = {}; let unlockedRuns = 0, lockedRuns = 0;
  Object.keys(p.weeks).forEach(w => { Object.values(p.weeks[w]).forEach(d => { const c = d && d.cardio; if (!c || c.type !== 'run' || !c.dose || !c.dose.tgt) return; const k = kinds(c); per[k] = (per[k] || 0) + 1; if (tw - (+w) < 3) lockedRuns++; else unlockedRuns++; }); });
  console.log(`  ${g.padEnd(12)} ${exp.padEnd(12)} ${tw} wk: paced run cards ${JSON.stringify(per)}; in unlocked weeks 1 to ${tw - 3}: ${unlockedRuns}, in the locked last three: ${lockedRuns}`);
}
console.log('  (a speed card\'s logged pace averages work and recovery, so only recovery and long cards can be read against their prescribed pace)');
