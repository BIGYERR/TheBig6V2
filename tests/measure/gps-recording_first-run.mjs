// Measure: the first run on v0.263.0 against the watch (D293, D296, docs/decisions/gps-recording.md). It reads the Run
// recorder's GPX of one run, never committed (a track shows where a run starts and ends), turns it back into the
// recorder's lines (a fix for each point, a step counter or barometer line wherever `ia:steps` or `ia:ralt` changes, the
// Start mark at the GPX's start and the finish at its last point) and counts them with core's gpsSummary, as the screen
// counted. The watch's totals are typed from COROS's own records of the run, read through the connector: its distance
// and mile laps from the lap data (centimetres and hundredths of a second), its time, cadence and climb from the activity
// detail, which rounds them (cadence to 1 step a minute, climb to 1 m), so the steps print the range the rounding
// leaves. It prints counts, distances and times from Start only: never a coordinate, a date or a clock time.
//   node tests/measure/gps-recording_first-run.mjs <run.gpx> <watch m> <watch m:ss> <watch spm> <watch gain m> <watch loss m> [<watch mile laps, s,s,...>]
// Its output is saved beside it as gps-recording_first-run.md.
import fs from 'node:fs';
import { CLIMB_BAND_M, formatClock, gpsDistanceM, gpsSummary } from '../../core/src/index.ts';

const [file, metres, clock, spm, gain, loss, laps] = process.argv.slice(2);
if (loss === undefined) {
  console.error('usage: node tests/measure/gps-recording_first-run.mjs <run.gpx> <watch m> <watch m:ss> <watch spm> <watch gain m> <watch loss m> [<watch mile laps, s,s,...>]');
  process.exit(2);
}
const W = {
  m: Number(metres),
  laps: laps ? laps.split(',').map(Number) : [],
  s: clock.split(':').reduce((a, x) => a * 60 + Number(x), 0),
  spm: Number(spm),
  gain: Number(gain),
  loss: Number(loss),
};

const gpx = fs.readFileSync(file, 'utf8');
const start = Date.parse(/<metadata>[\s\S]*?<time>([^<]+)<\/time>/.exec(gpx)[1]);
const P = [...gpx.matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)">([\s\S]*?)<\/trkpt>/g)].map((m) => {
  const num = (tag) => {
    const x = new RegExp(`<${tag}>([^<]+)</${tag}>`).exec(m[3]);
    return x ? Number(x[1]) : undefined;
  };
  return {
    t: Date.parse(/<time>([^<]+)<\/time>/.exec(m[3])[1]),
    lat: Number(m[1]),
    lon: Number(m[2]),
    alt: num('ele'),
    ha: num('ia:ha'),
    spd: num('ia:spd'),
    steps: num('ia:steps'),
    ralt: num('ia:ralt'),
  };
});
const end = P.at(-1).t;
const segments = (gpx.match(/<trkseg>/g) ?? []).length;
if (segments !== 1) {
  console.error(`the GPX holds ${segments} segments; this measure reads a run with no pause`);
  process.exit(2);
}
const lines = [{ t: start, mark: 'start' }];
let lastSteps, lastRalt;
for (const p of P) {
  if (p.steps !== undefined && p.steps !== lastSteps) lines.push({ t: p.t, steps: (lastSteps = p.steps) });
  if (p.ralt !== undefined && p.ralt !== lastRalt) lines.push({ t: p.t, ralt: (lastRalt = p.ralt) });
  lines.push({ t: p.t, lat: p.lat, lon: p.lon, ha: p.ha, ...(p.alt !== undefined ? { alt: p.alt } : {}) });
}
lines.push({ t: end, mark: 'finish' });
const run = gpsSummary(lines);

const hist = (xs) => {
  const h = {};
  for (const x of xs) h[x] = (h[x] ?? 0) + 1;
  return Object.entries(h).map(([k, n]) => `${k} s ×${n}`).join(', ');
};
const pct = (x, of) => `${x >= of ? '+' : ''}${(((x - of) / of) * 100).toFixed(2)}%`;
const turnBand = (xs, h) => {
  let mark = null, dir = 0, up = 0, down = 0;
  for (const x of xs) {
    if (mark === null) mark = x;
    else if (x > mark && (dir === 1 || x - mark >= h)) [up, mark, dir] = [up + x - mark, x, 1];
    else if (x < mark && (dir === -1 || mark - x >= h)) [down, mark, dir] = [down + mark - x, x, -1];
  }
  return `${up.toFixed(1)} m up, ${down.toFixed(1)} m down`;
};

console.log('## The fixes');
const has = P.map((p) => p.ha).sort((a, b) => a - b);
console.log(`- ${P.length} fixes over ${formatClock((end - start) / 1000)} from Start, ${segments} segment; seconds between fixes: ${hist(P.slice(1).map((p, i) => Math.round((p.t - P[i].t) / 1000)))}.`);
console.log(`- Accuracy: median ${has[has.length >> 1].toFixed(1)} m, worst ${has.at(-1).toFixed(1)} m; worse than 10 m: ${P.filter((p) => p.ha > 10).length}; worse than 50 m: ${P.filter((p) => p.ha > 50).length}.`);

console.log('');
console.log('## Distance');
let joined = 0;
for (let i = 1; i < P.length; i++) joined += gpsDistanceM(P[i - 1], P[i]);
console.log(`- The watch: ${W.m.toFixed(2)} m in ${formatClock(W.s)}. The phone recorded ${formatClock((end - start) / 1000)}.`);
console.log(`- The recorder (the 10 m rule, as the screen counted): ${run.distanceM.toFixed(1)} m, ${pct(run.distanceM, W.m)} against the watch.`);
console.log(`- Every fix joined (the count before v0.263.0): ${joined.toFixed(1)} m, ${pct(joined, W.m)}.`);
console.log(`- Splits: ${run.splits.map((s) => `mile ${s.mile} ${formatClock(s.seconds)}`).join(', ')}.`);
if (W.laps.length) {
  // Each mile's time on the phone against the watch's auto lap, and where each mile ended from Start on both: the second
  // is how far one device's distance ran ahead of the other's, in seconds of running.
  let p = 0, w = 0;
  const rows = run.splits.slice(0, W.laps.length).map((s, i) => {
    p += s.seconds;
    w += W.laps[i];
    const d = s.seconds - W.laps[i];
    const c = p - w;
    return `mile ${s.mile}: phone ${formatClock(s.seconds)}, watch ${formatClock(W.laps[i])} (${d >= 0 ? '+' : ''}${d.toFixed(1)} s); ended ${c >= 0 ? '+' : ''}${c.toFixed(1)} s from the watch's`;
  });
  console.log(`- Against the watch's mile laps: ${rows.join('; ')}.`);
}

console.log('');
console.log('## Steps and cadence');
const steps = (c) => (c * W.s) / 60;
console.log(`- The phone: ${run.steps} steps, ${run.cadenceSpm.toFixed(1)} steps a minute over ${formatClock(run.movingS)} moving.`);
console.log(`- The watch: ${W.spm} steps a minute (${W.spm - 0.5} to ${W.spm + 0.5}) over ${formatClock(W.s)}, so ${steps(W.spm - 0.5).toFixed(0)} to ${steps(W.spm + 0.5).toFixed(0)} steps; the phone's ${run.steps} is ${pct(run.steps, steps(W.spm))} against the middle.`);

console.log('');
console.log('## Climb');
const ralt = P.filter((p) => p.ralt !== undefined).map((p) => p.ralt);
const ele = P.filter((p) => p.alt !== undefined).map((p) => p.alt);
console.log(`- The watch: ${W.gain} m up, ${W.loss} m down (net ${W.gain - W.loss >= 0 ? '+' : ''}${W.gain - W.loss} m).`);
console.log(`- The recorder (the barometer on the ${CLIMB_BAND_M} m turn band, as the screen counted): ${run.climbM.toFixed(1)} m up, ${run.descentM.toFixed(1)} m down; split net climb ${run.splits.map((s) => `${s.climbM >= 0 ? '+' : ''}${s.climbM.toFixed(1)}`).join(', ')} m.`);
for (const h of [3, 4, 5, 6]) console.log(`- The barometer on a ${h} m band: ${turnBand(ralt, h)}.`);
for (const h of [2, 5]) console.log(`- GPS altitude on a ${h} m band: ${turnBand(ele, h)}.`);
const pts = P.filter((p) => p.ralt !== undefined && p.alt !== undefined);
for (const w of [2, 5, 10, 20]) {
  // The barometer with its slow drift taken out by GPS altitude: plus the mean of (GPS altitude − barometer) over the
  // last w minutes.
  const q = [];
  let sum = 0;
  const out = pts.map((p) => {
    q.push(p.alt - p.ralt);
    sum += p.alt - p.ralt;
    if (q.length > w * 60) sum -= q.shift();
    return p.ralt + sum / q.length;
  });
  console.log(`- The barometer held to GPS altitude over ${w} min, on the ${CLIMB_BAND_M} m band: ${turnBand(out, CLIMB_BAND_M)}.`);
}
const mean10 = ralt.map((_, i) => {
  const a = ralt.slice(Math.max(0, i - 9), i + 1);
  return a.reduce((s, x) => s + x, 0) / a.length;
});
const dev = ralt.map((x, i) => Math.abs(x - mean10[i])).sort((a, b) => a - b);
console.log(`- The barometer against its own 10 s mean: median ${dev[dev.length >> 1].toFixed(2)} m, worst ${dev.at(-1).toFixed(2)} m.`);
const rows = [];
for (let m = 5; m * 60000 <= end - start; m += 5) {
  const p = P.find((x) => x.t - start >= m * 60000);
  rows.push(`${m} min: barometer ${p.ralt.toFixed(1)}, GPS ${(p.alt - P[0].alt).toFixed(1)}`);
}
console.log(`- Where each stood from Start, in m: ${rows.join('; ')}.`);

console.log('');
console.log('## The step counter and the barometer through the run');
for (const [key, name] of [['steps', 'step counter'], ['ralt', 'barometer']]) {
  const gaps = [];
  let prev, since, first;
  for (const p of P) {
    if (p[key] === undefined) continue;
    first ??= p.t;
    if (p[key] !== prev) {
      if (prev !== undefined) gaps.push(Math.round((p.t - since) / 1000));
      [prev, since] = [p[key], p.t];
    }
  }
  console.log(`- The ${name}: first reading ${Math.round((first - start) / 1000)} s after Start, ${gaps.length + 1} values, the longest wait for a new one ${Math.max(...gaps)} s; seconds between new values: ${hist(gaps)}.`);
}
