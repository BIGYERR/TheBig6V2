// Measure (Post-v0.249.1, run logging): which log form every run session gets today.
// Usage: node tests/measure/run-logging_session-forms.js <page.html>
// Builds every run goal (four NRC races, two NSW test goals) at three experience levels, seed 1013, and for each
// run session reads its subtype and the dose `doseFromCardio` resolves (the form `cardioFieldHTML` draws: time,
// dist, reps_dist, reps_time, or none = the generic miles + pace wheels). Prints the keys a run cardio object
// carries, then per arm and session class: sessions, the dose kinds they get, and two sample details.
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const page = process.argv[2];
if (!page) { console.error('usage: node tests/measure/run-logging_session-forms.js <page.html>'); process.exit(2); }
const A = H.load(page);
const doseFromCardio = A.eval('doseFromCardio');
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const RUN = {
  run_5k: { id: 'run_5k', label: '5K', mileBestMins: '8', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  run_10k: { id: 'run_10k', label: '10K', mileBestMins: '8', mileBestSecs: '30', baselineDist: '4', baseline: '4mi' },
  run_half: { id: 'run_half', label: 'Half', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' },
  run_marathon: { id: 'run_marathon', label: 'Marathon', mileBestMins: '9', mileBestSecs: '00', baselineDist: '8', baseline: '8mi' },
  run_pace_goal: { id: 'run_pace_goal', label: 'Pace', targetDist: '1.5', paceUnit: 'mi', targetMins: '12', targetSecs: '0', mileBestMins: '8', mileBestSecs: '15' },
  run_base: { id: 'run_base', label: 'Base', mileBestMins: '11', mileBestSecs: '0', baselineDist: '2', baseline: '2mi' },
};
const NRC = new Set(['run_5k', 'run_10k', 'run_half', 'run_marathon']);
const cfg = (goal, experience) => ({ name: 'M', primaryPath: NRC.has(goal) ? 'event' : 'fitness', cardioTypes: ['run'],
  cardioGoals: { run: RUN[goal] }, eventTargeted: NRC.has(goal), ...(NRC.has(goal) ? { raceDate: '2027-06-06' } : {}),
  liftingFocus: 'support_prevention', experience, ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs',
  restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: 1013 });
const cls = st => String(st || '').replace(/\s*[—–-]\s*.*$/, '').replace(/\s*\(.*$/, '').replace(/\d+/g, '#').trim() || '(none)';
const keys = {}, tab = {};
for (const goal of Object.keys(RUN)) for (const exp of ['beginner', 'intermediate', 'advanced']) {
  const p = A.buildProgram(cfg(goal, exp));
  for (const wk of Object.keys(p.weeks)) for (const d of DAYS) {
    const day = p.weeks[wk][d]; if (!day || day.rest) continue;
    for (const c of [].concat(day.cardio || [])) {
      if (!c || c.type !== 'run') continue;
      Object.keys(c).forEach(k => { keys[k] = (keys[k] || 0) + 1; });
      const arm = NRC.has(goal) ? 'NRC' : 'NSW';
      const k = arm + ' ' + cls(c.subtype);
      const dose = doseFromCardio(c);
      const dk = dose ? dose.k + (dose.parsed ? '(parsed)' : '(emitted)') : 'none';
      const t = tab[k] = tab[k] || { n: 0, dose: {}, goals: new Set(), samples: [] };
      t.n++; t.dose[dk] = (t.dose[dk] || 0) + 1; t.goals.add(goal.replace('run_', ''));
      if (t.samples.length < 3 && !t.samples.some(s => s.st === c.subtype)) t.samples.push({ st: c.subtype, detail: String(c.detail || '').replace(/\s+/g, ' ').slice(0, 260) });
    }
  }
}
console.log('page', A.version);
console.log('run cardio keys:', Object.entries(keys).map(([k, n]) => k + '=' + n).join(' '));
let tot = { NRC: 0, NSW: 0 }, none = { NRC: 0, NSW: 0 };
for (const k of Object.keys(tab).sort()) {
  const t = tab[k], arm = k.slice(0, 3); tot[arm] += t.n; none[arm] += t.dose.none || 0;
  console.log(`\n${k}  n=${t.n}  goals=${[...t.goals].join(',')}  dose: ${Object.entries(t.dose).map(([d, n]) => d + ' ' + n).join(', ')}`);
  t.samples.forEach(s => console.log(`   [${s.st}] ${s.detail}`));
}
console.log(`\nNRC run sessions ${tot.NRC}, generic form ${none.NRC}; NSW run sessions ${tot.NSW}, generic form ${none.NSW}`);

// Part 2: what a speed session asks of a log. Per NRC speed session (weighted by how often programs print it):
// the pace zones its work lines name with a number on Nike's chart (Mile, 5K, 10K, Tempo, Half, Marathon), the
// zones with no number (Best Pace, hill Effort), the numbered zones holding an effort of a minute or more (a watch's
// pace settles in about a minute), its effort count (the headline's "N efforts", else the sum of
// "k ×" work lines, rounds multiplied in), and the zone holding the most work minutes.
const ZN = /at (Mile|5K|10K|Tempo|Half Marathon|Marathon|Best|Recovery) (Pace|Effort)/;
const mmss = s => { const m = String(s).match(/(\d+):(\d\d)/); return m ? +m[1] + +m[2] / 60 : 0; };
function shape(detail){
  const lines = String(detail).split('\n'), head = lines[0] || '';
  const zones = {}, maxLen = {}; let rounds = 1, efforts = 0, inRounds = false, hill = false;
  lines.slice(1).forEach(raw => {
    const line = raw.replace(/ /g, ' ');
    const r = line.match(/^(\d+) rounds of/); if (r) { rounds = +r[1]; inRounds = true; return; }
    if (/uphill/.test(line)) hill = true;
    const z = line.match(ZN); if (!z) return;
    if (/^Run the next|warm up|cool down/.test(line)) return;
    const k = line.match(/^\s*(\d+) × (\d+:\d\d)/), one = line.match(/^\s*(\d+:\d\d)/);
    const n = k ? +k[1] : 1, len = k ? mmss(k[2]) : (one ? mmss(one[1]) : 0);
    const mult = /^\s/.test(raw) && inRounds ? rounds : 1;
    const zone = z[1] + ' ' + z[2];
    zones[zone] = (zones[zone] || 0) + n * len * mult; efforts += n * mult;
    maxLen[zone] = Math.max(maxLen[zone] || 0, len);
    const chase = line.match(/→ (\d+:\d\d) at (Best) Pace/); if (chase) { zones['Best Pace'] = (zones['Best Pace'] || 0) + mmss(chase[1]); efforts += 1; }
  });
  const stated = head.match(/(\d+) efforts/); if (stated) efforts = +stated[1];
  const fart = head.match(/(\d+):(\d\d) fartlek — (\d+):00 hard, (\d+):00 easy/);
  if (fart) { const tot = +fart[1], h = +fart[3], e = +fart[4]; efforts = Math.ceil(tot / (h + e)); zones['hard (no number)'] = efforts * h; }
  const km = head.match(/(\d+(?:\.\d+)?)K tempo/); if (km) zones['Tempo Pace'] = zones['Tempo Pace'] || +km[1];
  const numbered = Object.keys(zones).filter(z => /Pace$/.test(z) && !/^(Best|Recovery)/.test(z));
  const main = Object.entries(zones).sort((a, b) => b[1] - a[1])[0];
  const readable = numbered.filter(z => (maxLen[z] || 0) >= 1 || /Tempo/.test(z));
  return { numbered, readable, all: Object.keys(zones), efforts, hill, main: main ? main[0] : '(none)' };
}
const speed = new Map();
for (const goal of ['run_5k', 'run_10k', 'run_half', 'run_marathon']) for (const exp of ['beginner', 'intermediate', 'advanced']) {
  const p = A.buildProgram(cfg(goal, exp));
  for (const wk of Object.keys(p.weeks)) for (const d of DAYS) {
    const day = p.weeks[wk][d]; if (!day || day.rest) continue;
    for (const c of [].concat(day.cardio || [])) {
      if (!c || c.type !== 'run' || !/^Speed/.test(c.subtype || '')) continue;
      const key = String(c.detail).split('\n')[0];
      const s = speed.get(key) || Object.assign(shape(c.detail), { n: 0, sub: c.subtype }); s.n++; speed.set(key, s);
    }
  }
}
const hist = (f) => { const h = {}; let n = 0; for (const s of speed.values()) { const k = f(s); h[k] = (h[k] || 0) + s.n; n += s.n; } return Object.entries(h).sort().map(([k, v]) => `${k}: ${v}/${n}`).join('  '); };
console.log('\n== Part 2: NRC speed sessions, distinct', speed.size, 'printed', [...speed.values()].reduce((a, s) => a + s.n, 0));
console.log('numbered pace zones per session ->', hist(s => s.numbered.length));
console.log('zones with an effort of 1:00+    ->', hist(s => s.readable.length));
console.log('efforts per session            ->', hist(s => s.hill ? 'hill ' + s.efforts : String(s.efforts).padStart(2, '0')));
console.log('main zone (most work minutes)   ->', hist(s => s.main));
const zc = {}; for (const s of speed.values()) s.numbered.forEach(z => { zc[z] = (zc[z] || 0) + s.n; });
console.log('sessions naming each zone      ->', Object.entries(zc).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '));
for (const [k, s] of [...speed.entries()].sort((a, b) => b[1].n - a[1].n)) console.log(`  ${String(s.n).padStart(3)}  ${s.sub.padEnd(24)} zones[${s.numbered.join(', ')}] efforts ${s.efforts}${s.hill ? ' (hill)' : ''}  main ${s.main}  | ${k.slice(0, 80)}`);
