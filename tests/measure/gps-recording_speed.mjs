// GPS recording: does the way a run's distance is counted depend on speed? (measure, Post-v0.262.4, behind D293's
// revision, docs/decisions/gps-recording.md). Prints no coordinate.
//
//   node tests/measure/gps-recording_speed.mjs <track.gpx> <road.gpx> <road.fit>
//
// A. Geometry, no noise: a 400 m track (lane 1's running line, bends of radius 36.8 m, straights of 84.39 m) and a
//    400 by 300 m city block with right angle turns of radius 8 m, one fix a second, from a walk to a fast ride. What each
//    count reads against the true path.
// B. The phone's own noise at higher speed: the track test (2026-11-17) and the road run (2026-11-13) with every 2nd, 3rd
//    or 4th fix kept, which is the same ground covered 2, 3 or 4 times as fast. The track against 1,600 m, the road
//    against the watch over the seconds both recorded.
//
// The counts: every fix joined; each fix the mean of 9 (D293 as first proposed); each fix the mean of the fixes within
// 9 m of path either side, at most 4 either side; a fix kept only once it is 10 m from the last kept fix, iOS accuracy
// 50 m or better; and a position only Kalman filter (measurement noise iOS's accuracy, process noise 3 m a second). The
// mean and the Kalman filter count nothing into a fix whose iOS speed is valid and under 0.5 m/s, as D293 first did.
import fs from 'node:fs';
import { fitTrack, gpsDistanceM, readFit } from '../../core/src/index.ts';

const [trackGpx, roadGpx, roadFit] = process.argv.slice(2);
if (!roadFit) {
  console.error('usage: node tests/measure/gps-recording_speed.mjs <track.gpx> <road.gpx> <road.fit>');
  process.exit(2);
}
const R0 = 6371008.8;
const toLL = (x, y) => ({ lat: (y / R0) * (180 / Math.PI), lon: (x / R0) * (180 / Math.PI) });

function readGpx(file) {
  return [...fs.readFileSync(file, 'utf8').matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)">([\s\S]*?)<\/trkpt>/g)].map((m) => {
    const num = (tag) => {
      const x = new RegExp(`<${tag}>([^<]+)</${tag}>`).exec(m[3]);
      return x ? Number(x[1]) : undefined;
    };
    return { t: Date.parse(/<time>([^<]+)<\/time>/.exec(m[3])[1]), lat: Number(m[1]), lon: Number(m[2]), ha: num('ia:ha'), spd: num('ia:spd') };
  });
}
const mean = (w) => ({ lat: w.reduce((s, x) => s + x.lat, 0) / w.length, lon: w.reduce((s, x) => s + x.lon, 0) / w.length });
const byCount = (pts, h) => pts.map((p, i) => ({ ...p, ...mean(pts.slice(Math.max(0, i - h), Math.min(pts.length, i + h + 1))) }));
function byGround(pts, L, hmax) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + gpsDistanceM(pts[i - 1], pts[i]));
  return pts.map((p, i) => {
    let a = i, b = i;
    while (a > 0 && i - (a - 1) <= hmax && cum[i] - cum[a - 1] <= L) a--;
    while (b < pts.length - 1 && b + 1 - i <= hmax && cum[b + 1] - cum[i] <= L) b++;
    return { ...p, ...mean(pts.slice(a, b + 1)) };
  });
}
/** The kept fixes carry speed -1, so counted() counts every step between them: this rule has no speed cut. */
function minStep(pts, m) {
  const kept = [];
  for (const p of pts) {
    if (p.ha !== undefined && p.ha > 50) continue;
    if (!kept.length || gpsDistanceM(kept.at(-1), p) >= m) kept.push({ ...p, spd: -1 });
  }
  return kept;
}
function kalman(pts, q) {
  let v = -1, lat = 0, lon = 0, t0 = 0;
  return pts.map((p) => {
    const acc = Math.max(1, p.ha ?? 5);
    if (v < 0) {
      lat = p.lat;
      lon = p.lon;
      v = acc * acc;
    } else {
      v += ((p.t - t0) / 1000) * q * q;
      const k = v / (v + acc * acc);
      lat += k * (p.lat - lat);
      lon += k * (p.lon - lon);
      v *= 1 - k;
    }
    t0 = p.t;
    return { ...p, lat, lon };
  });
}
/** Distance, no step into a fix whose iOS speed is valid and under 0.5 m/s. */
function counted(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const s = pts[i].spd;
    if (s === undefined || s < 0 || s >= 0.5) d += gpsDistanceM(pts[i - 1], pts[i]);
  }
  return d;
}
const pct = (d, ref) => `${d >= ref ? '+' : ''}${((d / ref - 1) * 100).toFixed(2)}%`;
const ways = [
  ['Every fix', (p) => p.map((x) => ({ ...x, spd: -1 }))],
  ['Mean of 9 fixes', (p) => byCount(p, 4)],
  ['Mean over 9 m of ground', (p) => byGround(p, 9, 4)],
  ['10 m rule', (p) => minStep(p, 10)],
  ['Kalman, 3 m/s', (p) => kalman(p, 3)],
];

function trackAt(s) {
  const R = 36.8, S = 84.39, lap = 2 * S + 2 * Math.PI * R;
  s %= lap;
  if (s < S) return [s, -R];
  s -= S;
  if (s < Math.PI * R) {
    const a = -Math.PI / 2 + s / R;
    return [S + R * Math.cos(a), R * Math.sin(a)];
  }
  s -= Math.PI * R;
  if (s < S) return [S - s, R];
  s -= S;
  const a = Math.PI / 2 + s / R;
  return [R * Math.cos(a), R * Math.sin(a)];
}
function blockAt(s) {
  const W = 400, H = 300, r = 8, q = (Math.PI / 2) * r;
  const legs = [W - 2 * r, q, H - 2 * r, q, W - 2 * r, q, H - 2 * r, q];
  s %= legs.reduce((a, b) => a + b, 0);
  const corner = (cx, cy, a0, u) => [cx + r * Math.cos(a0 + u / r), cy + r * Math.sin(a0 + u / r)];
  const segs = [
    (u) => [r + u, 0],
    (u) => corner(W - r, r, -Math.PI / 2, u),
    (u) => [W, r + u],
    (u) => corner(W - r, H - r, 0, u),
    (u) => [W - r - u, H],
    (u) => corner(r, H - r, Math.PI / 2, u),
    (u) => [0, H - r - u],
    (u) => corner(r, r, Math.PI, u),
  ];
  for (let k = 0; k < 8; k++) {
    if (s < legs[k]) return segs[k](s);
    s -= legs[k];
  }
  return segs[0](0);
}
const courses = [
  ['Track, 4 laps', trackAt, 4 * (2 * 84.39 + 2 * Math.PI * 36.8)],
  ['City block, 2 laps, 8 m corners', blockAt, 2 * (2 * (400 - 16) + 2 * (300 - 16) + 2 * Math.PI * 8)],
];
const speeds = [[1.4, 'walk'], [2.2, 'the track laps'], [3.0, '8:57 a mile'], [4.5, '5:58 a mile'], [6.5, 'easy ride'], [9, 'ride'], [12, 'fast ride']];
const head = `| Speed | ${ways.map(([w]) => w).join(' | ')} |`;
const rule = `|---|${ways.map(() => '---').join('|')}|`;

console.log('## A. Geometry, no noise, one fix a second, against the true path');
for (const [name, at, len] of courses) {
  console.log('');
  console.log(`${name}, ${len.toFixed(1)} m:`);
  console.log('');
  console.log(head);
  console.log(rule);
  for (const [v, label] of speeds) {
    const pts = [];
    for (let t = 0; t * v <= len; t++) {
      const [x, y] = at(t * v);
      pts.push({ t: t * 1000, ...toLL(x, y), spd: v });
    }
    console.log(`| ${v} m/s, ${label} | ${ways.map(([, f]) => pct(counted(f(pts)), len)).join(' | ')} |`);
  }
}

const watchAt = (track, t) => {
  let j = 0;
  while (j + 1 < track.length && track[j + 1].t <= t) j++;
  const a = track[j], b = track[j + 1] ?? a, k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
  return a.distM + k * (b.distM - a.distM);
};
const tp = readGpx(trackGpx);
const rp = readGpx(roadGpx);
const rw = fitTrack(readFit(new Uint8Array(fs.readFileSync(roadFit))));
const rFrom = Math.max(rp[0].t, rw[0].t), rTo = Math.min(rp.at(-1).t, rw.at(-1).t);
const rIn = rp.filter((p) => p.t >= rFrom && p.t <= rTo);
const rRef = watchAt(rw, rTo) - watchAt(rw, rFrom);
const meanSpeed = (pts, d) => (d / ((pts.at(-1).t - pts[0].t) / 1000)).toFixed(2);
console.log('');
console.log('## B. The two runs, every n-th fix kept: the same ground n times as fast, with the phone\'s own noise');
console.log('');
console.log(`The track test averaged ${meanSpeed(tp, 1600)} m/s over the whole recording; the road run ${meanSpeed(rIn, rRef)} m/s over the seconds both recorded.`);
for (const [name, pts, ref] of [['Track, against 1,600 m', tp, 1600], ['Road, against the watch', rIn, rRef]]) {
  console.log('');
  console.log(`${name}:`);
  console.log('');
  console.log(head.replace('Speed', 'Fixes kept'));
  console.log(rule);
  for (const n of [1, 2, 3, 4]) {
    const kept = pts.filter((_, i) => i % n === 0);
    console.log(`| every ${n === 1 ? 'fix' : `${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`} | ${ways.map(([, f]) => pct(counted(f(kept)), ref)).join(' | ')} |`);
  }
}
