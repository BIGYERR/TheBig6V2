// D270 P-OWNPLANS: before/after of the four seeded race programs (tests/support/programs.ts, typed here by hand) on two
// pages, the standing ruling 5 printing: each program's digest on both pages (each built twice) and a week table of the
// runs (long run, the speed session the layout prints, the recovery runs).
//   node tests/measure/race-plans_before-after.cjs <before.html> <after.html> > compare.md
// The after page is the build of a source-surgery copy: copy frontends/app/src/legacy/src and core/src/engine into a
// scratch folder at the same relative depth, run race-plans_derive-tables.mjs on the copy's nrc-race-bike-swim.ts, and
// write buildIndex(<copy>/frontends/app/src/legacy/src) from frontends/app/scripts/build-index.mjs to a file.
const path = require('node:path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const [, , beforePage, afterPage] = process.argv;
if (!beforePage || !afterPage) { console.error('usage: node race-plans_before-after.cjs <before.html> <after.html>'); process.exit(2); }

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const RUN = {
  k5: { id: 'run_5k', label: '5K', mileBestMins: '8', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  k10: { id: 'run_10k', label: '10K', mileBestMins: '8', mileBestSecs: '30', baselineDist: '4', baseline: '4mi' },
  marathon: { id: 'run_marathon', label: 'Marathon', mileBestMins: '9', mileBestSecs: '00', baselineDist: '8', baseline: '8mi' },
};
function cfg(o) {
  const c = { name: 'SNAPSHOT', primaryPath: o.race ? 'event' : 'fitness', cardioTypes: Object.keys(o.goals), cardioGoals: o.goals, eventTargeted: !!o.race,
    liftingFocus: o.focus, experience: o.experience, ageBracket: o.age || '18-35', equipment: o.equipment, unit: 'lbs', restDays: o.rest, days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed: o.seed };
  if (o.race) c.raceDate = o.race;
  return c;
}
const PROGRAMS = {
  'half-manny (Mario, NRC half, crossfit)': H.fixtures.HALF_MANNY,
  '5k race, commercial, strength, beginner': cfg({ goals: { run: RUN.k5 }, race: '2026-11-15', focus: 'strength', experience: 'beginner', equipment: 'commercial', rest: ['sun'], seed: 1013 }),
  '10k race, home basic, hypertrophy, advanced': cfg({ goals: { run: RUN.k10 }, race: '2026-11-29', focus: 'hypertrophy', experience: 'advanced', equipment: 'home_basic', rest: ['sat', 'sun'], seed: 3039 }),
  'marathon, crossfit, athletic support, 36-45': cfg({ goals: { run: RUN.marathon }, race: '2027-02-28', focus: 'support_athletic', experience: 'intermediate', age: '36-45', equipment: 'crossfit', rest: ['mon', 'thu'], seed: 76308 }),
};

function runsByWeek(prog) {
  const out = [];
  for (const wk of Object.keys(prog.weeks).sort((a, b) => +a - +b)) {
    const row = { long: '', speed: [], recovery: [] };
    for (const d of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
      const day = prog.weeks[wk][d]; if (!day || !day.cardio) continue;
      const list = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
      for (const c of list) {
        if (c.type !== 'run') continue;
        const head = String(c.detail || '').split('\n')[0].trim();
        const st = String(c.subtype || '');
        if (/long|race/i.test(st)) row.long = (/race/i.test(st) ? head.split('. Target')[0] + ' (RACE DAY)' : head.split(':')[0]);
        else if (/speed/i.test(st)) row.speed.push(head);
        else { const m = head.match(/^([\d.]+ ?(?:min|Mile|K|mi))\b/); row.recovery.push(m ? m[1] : head.slice(0, 20)); }
      }
    }
    out.push(row);
  }
  return out;
}
function build(page) {
  const IA = H.load(page);
  const res = {};
  for (const [name, c] of Object.entries(PROGRAMS)) {
    const a = IA.buildProgram(JSON.parse(JSON.stringify(c)));
    const b = IA.buildProgram(JSON.parse(JSON.stringify(c)));
    const da = H.progDigest(a), db = H.progDigest(b);
    if (da !== db) throw new Error(`${name} is not self-stable on ${page}: ${da} vs ${db}`);
    res[name] = { digest: da, weeks: runsByWeek(a) };
  }
  return res;
}
const B = build(beforePage), A = build(afterPage);
const md = [];
for (const name of Object.keys(PROGRAMS)) {
  md.push(`#### ${name}`, `Digest before ${B[name].digest} → after ${A[name].digest}`, '| Wk | Before: long | speed | recovery | After: long | speed | recovery |', '|---|---|---|---|---|---|---|');
  B[name].weeks.forEach((b, i) => { const a = A[name].weeks[i] || { long: '', speed: [], recovery: [] };
    md.push(`| ${i + 1} | ${b.long} | ${b.speed.join(' + ')} | ${b.recovery.join(', ')} | ${a.long} | ${a.speed.join(' + ')} | ${a.recovery.join(', ')} |`); });
  md.push('');
}
console.log(md.join('\n'));
console.error(Object.keys(PROGRAMS).map((n) => `${n}: ${B[n].digest} -> ${A[n].digest}`).join('\n'));
