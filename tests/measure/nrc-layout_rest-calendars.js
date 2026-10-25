// Measure (D244, Post-v0.243.0): every rest-day calendar (2^7) for run_half, its week 9 run layout on two pages.
// Usage: node tests/measure/nrc-layout_rest-calendars.js <before.html> <after.html>
// Pages come from `node tools/app-at.mjs <ref> <file>` or a source-surgery copy. Prints, per experience, lift focus
// and training-day count, how many calendars the second page lays out differently, then every moved row as
// Mo..Su cells: Q a speed run, E a recovery run, L the long run, - a lift-only day, x rest.
// Focus: Strength Support (four runs at most) on every calendar, and Athletic Support at six and seven training
// days, the only place the half reaches five runs. Seed 1013, mile 9:00; the layout does not read the seed.
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const [before, after] = process.argv.slice(2);
if (!before || !after) { console.error('usage: node tests/measure/nrc-layout_rest-calendars.js <before.html> <after.html>'); process.exit(2); }
const A = H.load(before), B = H.load(after);
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], ORD = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const AB = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' };
const cfg = (rest, experience, liftingFocus) => ({ name: 'M', primaryPath: 'event', cardioTypes: ['run'],
  cardioGoals: { run: { id: 'run_half', label: 'Half Marathon', mileBestMins: '9', mileBestSecs: '00', baselineDist: '5', baseline: '5mi' } },
  eventTargeted: true, liftingFocus, experience, ageBracket: '18-35', equipment: 'home_full', unit: 'lbs',
  restDays: rest, days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: 1013 });
const layout = p => ORD.map(d => { const day = p.weeks['9'][d]; if (!day || day.rest) return AB[d] + ':x';
  const r = [].concat(day.cardio || []).find(c => c && c.type === 'run'); if (!r) return AB[d] + ':-';
  const st = r.subtype || ''; return AB[d] + ':' + (/^Speed/.test(st) ? 'Q' : /^Long/.test(st) ? 'L' : /^Recovery/.test(st) ? 'E' : '?'); }).join(' ');
const tally = {}, moved = [];
for (let m = 0; m < 128; m++) {
  const rest = DAYS.filter((_, i) => m & (1 << i)), nTrain = 7 - rest.length;
  if (nTrain < 2) continue;
  for (const focus of ['support_strength', 'support_athletic']) for (const exp of ['beginner', 'intermediate', 'advanced']) {
    if (focus === 'support_athletic' && nTrain < 6) continue;
    const a = layout(A.buildProgram(cfg(rest, exp, focus))), b = layout(B.buildProgram(cfg(rest, exp, focus)));
    const k = `${exp.padEnd(12)} ${focus.padEnd(16)} train ${nTrain}`; const t = tally[k] = tally[k] || { n: 0, moved: 0 };
    t.n++; if (a !== b) { t.moved++; moved.push(`${(rest.join('+') || 'none').padEnd(16)} ${exp.padEnd(12)} ${focus}\n  before ${a}\n  after  ${b}`); }
  }
}
console.log('before', A.version, 'after', B.version);
let n = 0, mv = 0;
for (const k of Object.keys(tally).sort()) { const t = tally[k]; n += t.n; mv += t.moved; console.log(`${k}  calendars ${String(t.n).padStart(2)}  moved ${t.moved}`); }
console.log(`total: ${mv} of ${n} rows moved`);
console.log(moved.join('\n'));
