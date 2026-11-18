// Measure: the phone recorder against a known distance and against the watch, and what each candidate fix would have
// read on the same raw fixes (D293, docs/decisions/gps-recording.md). It reads four files Mario sends, never committed
// (a track shows where a run starts and ends): the Run recorder's GPX and the COROS FIT file of a track run of 4 laps of
// lane 1 (1,600 m), and of one road run. It prints distances and times only, never a coordinate.
//   node tests/measure/gps-recording_track-test.mjs <track.gpx> <track.fit> <road.gpx> <road.fit>
// Its output is saved beside it as gps-recording_track-test.md.
import fs from 'node:fs';
import { fitSessions, fitTrack, formatClock, gpsDistanceM, readFit } from '../../core/src/index.ts';

const KNOWN_M = 1600;
const [trackGpx, trackFit, roadGpx, roadFit] = process.argv.slice(2);
if (!roadFit) {
  console.error('usage: node tests/measure/gps-recording_track-test.mjs <track.gpx> <track.fit> <road.gpx> <road.fit>');
  process.exit(2);
}

/** The GPX's points with iOS's horizontal accuracy and speed (D267's extensions). */
function readGpx(file) {
  return [...fs.readFileSync(file, 'utf8').matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)">([\s\S]*?)<\/trkpt>/g)].map((m) => {
    const num = (tag) => {
      const x = new RegExp(`<${tag}>([^<]+)</${tag}>`).exec(m[3]);
      return x ? Number(x[1]) : undefined;
    };
    return { t: Date.parse(/<time>([^<]+)<\/time>/.exec(m[3])[1]), lat: Number(m[1]), lon: Number(m[2]), ha: num('ia:ha'), spd: num('ia:spd') };
  });
}
const readWatch = (file) => readFit(new Uint8Array(fs.readFileSync(file)));
const path = (pts) => {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += gpsDistanceM(pts[i - 1], pts[i]);
  return d;
};
/** Each position the mean of itself and up to h fixes either side (k = 2h + 1). */
function averaged(pts, k) {
  if (k === 1) return pts;
  const h = (k - 1) / 2;
  return pts.map((p, i) => {
    const w = pts.slice(Math.max(0, i - h), Math.min(pts.length, i + h + 1));
    return { ...p, lat: w.reduce((s, x) => s + x.lat, 0) / w.length, lon: w.reduce((s, x) => s + x.lon, 0) / w.length };
  });
}
/** Distance counting no step into a fix whose iOS speed is under thr (null counts every step). */
function counted(pts, thr) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) if (thr === null || (pts[i].spd ?? Infinity) >= thr) d += gpsDistanceM(pts[i - 1], pts[i]);
  return d;
}
function doppler(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.max(0, pts[i].spd ?? 0) * ((pts[i].t - pts[i - 1].t) / 1000);
  return d;
}
/** The watch's own running distance at a time, interpolated between its records. */
function watchAt(track, t) {
  let j = 0;
  while (j + 1 < track.length && track[j + 1].t <= t) j++;
  const a = track[j], b = track[j + 1] ?? a, k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
  return a.distM + k * (b.distM - a.distM);
}
const pct = (d, ref) => `${d - ref >= 0 ? '+' : ''}${(((d / ref) - 1) * 100).toFixed(2)}%`;
const q = (sorted, p) => sorted[Math.floor(p * (sorted.length - 1))];

// THE TRACK
const tp = readGpx(trackGpx);
const tMsgs = readWatch(trackFit);
const tw = fitTrack(tMsgs);
const tSession = fitSessions(tMsgs)[0] ?? {};
const movingIdx = tp.map((p) => (p.spd ?? 0) > 1);
const runFrom = movingIdx.indexOf(true), runTo = movingIdx.lastIndexOf(true);
const run = tp.slice(runFrom, runTo + 1);
const ha = tp.map((p) => p.ha).filter((v) => v !== undefined).sort((a, b) => a - b);
console.log('## The track: 4 laps of lane 1, 1,600 m');
console.log('');
console.log(`- Phone: ${tp.length} fixes over ${formatClock((tp.at(-1).t - tp[0].t) / 1000)}; iOS accuracy median ${q(ha, 0.5).toFixed(1)} m, 90th ${q(ha, 0.9).toFixed(1)} m, worst ${ha.at(-1).toFixed(1)} m.`);
console.log(`- Phone as recorded, the whole recording: ${path(tp).toFixed(1)} m, ${pct(path(tp), KNOWN_M)}.`);
console.log(`- Phone as recorded, the run alone (its own speed over 1 m/s, ${formatClock((run.at(-1).t - run[0].t) / 1000)}): ${path(run).toFixed(1)} m, ${pct(path(run), KNOWN_M)}.`);
console.log(`- Phone standing: ${path(tp.slice(0, runFrom + 1)).toFixed(1)} m counted in the ${((tp[runFrom].t - tp[0].t) / 1000).toFixed(0)} s before the run, ${path(tp.slice(runTo)).toFixed(1)} m in the ${((tp.at(-1).t - tp[runTo].t) / 1000).toFixed(0)} s after.`);
const passes = [];
for (let i = 30; i < run.length; i++) {
  const d = gpsDistanceM(run[0], run[i]);
  const prevD = gpsDistanceM(run[0], run[i - 1]);
  const nextD = i + 1 < run.length ? gpsDistanceM(run[0], run[i + 1]) : Infinity;
  if (d < 15 && d <= prevD && d <= nextD && (passes.length === 0 || i - passes.at(-1) > 30)) passes.push(i);
}
let lapFrom = 0;
const laps = passes.map((i) => {
  const d = path(run.slice(lapFrom, i + 1));
  lapFrom = i;
  return `${d.toFixed(0)} m`;
});
console.log(`- Phone lap by lap (each pass of the run's first fix): ${laps.join(', ')}.`);
const tFrom = Math.max(tp[0].t, tw[0].t), tTo = Math.min(tp.at(-1).t, tw.at(-1).t);
const watchRun = watchAt(tw, Math.min(tTo, tp[runTo].t)) - watchAt(tw, Math.max(tFrom, tp[runFrom].t));
console.log(`- Watch: session ${tSession.distanceM} m over ${formatClock(tSession.timerS ?? 0)}, ${pct(tSession.distanceM, KNOWN_M)}; over the run ${watchRun.toFixed(1)} m, ${pct(watchRun, KNOWN_M)}. It logged positions only while moving: its first is ${((tw[0].t - tp[0].t) / 1000).toFixed(1)} s after the phone's, its last ${((tp.at(-1).t - tw.at(-1).t) / 1000).toFixed(1)} s before.`);

// THE ROAD
const rp = readGpx(roadGpx);
const rw = fitTrack(readWatch(roadFit));
const rFrom = Math.max(rp[0].t, rw[0].t), rTo = Math.min(rp.at(-1).t, rw.at(-1).t);
const rIn = rp.filter((p) => p.t >= rFrom && p.t <= rTo);
const rRef = watchAt(rw, rTo) - watchAt(rw, rFrom);
console.log('');
console.log('## The road run: the phone against the watch, over the seconds both recorded');
console.log('');
console.log(`- The phone started ${((rw[0].t - rp[0].t) / 1000).toFixed(1)} s before the watch and stopped ${((rp.at(-1).t - rw.at(-1).t) / 1000).toFixed(1)} s after it; the seconds both recorded: ${((rTo - rFrom) / 1000).toFixed(0)}.`);
console.log(`- Watch ${rRef.toFixed(1)} m; phone as recorded ${path(rIn).toFixed(1)} m, ${pct(path(rIn), rRef)}.`);

// THE FIXES
console.log('');
console.log('## Each candidate fix on the same raw fixes');
console.log('');
console.log('| Fix | Track, whole recording, against 1,600 m | Road, against the watch |');
console.log('|---|---|---|');
for (const k of [1, 5, 9]) {
  for (const thr of [null, 0.5, 1]) {
    const name = `${k === 1 ? 'Positions as recorded' : `Positions averaged over ${k} fixes`}${thr === null ? '' : `, no distance under ${thr} m/s`}`;
    const t = counted(averaged(tp, k), thr), r = counted(averaged(rIn, k), thr);
    console.log(`| ${name} | ${t.toFixed(1)} m, ${pct(t, KNOWN_M)} | ${pct(r, rRef)} |`);
  }
}
console.log(`| iOS speed times time | ${doppler(tp).toFixed(1)} m, ${pct(doppler(tp), KNOWN_M)} | ${pct(doppler(rIn), rRef)} |`);
