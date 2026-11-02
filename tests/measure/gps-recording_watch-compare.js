// Measure: the phone against the watch on one run (D267 P-GPSTEST, docs/decisions/gps-recording.md). Reads the GPX the
// Run recorder shares and the watch's FIT file of the same run, and prints each one's distance and the difference, the
// mile splits side by side, and how far apart the two tracks sit: each phone fix against the watch's position at the
// same second, interpolated between the watch's records either side. The phone's numbers come from core/src/gps, the
// same math the app shows. With --track <metres> (1600 for four laps of a 400 m track in lane 1) both are judged
// against that known distance too.
//
// It prints distances and times only, never a coordinate: a track shows where a run starts. Keep both input files out
// of the repo (the scratchpad, or the gitignored temp/).
// Run: node tests/measure/gps-recording_watch-compare.js <phone.gpx> <watch.fit> [--track <metres>]
'use strict';
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const trackAt = args.indexOf('--track');
  const knownM = trackAt >= 0 ? Number(args[trackAt + 1]) : null;
  const files = args.filter((a, i) => !a.startsWith('--') && (trackAt < 0 || i !== trackAt + 1));
  if (files.length !== 2) {
    console.error('usage: node tests/measure/gps-recording_watch-compare.js <phone.gpx> <watch.fit> [--track <metres>]');
    process.exit(2);
  }
  const gps = await import(path.join(__dirname, '..', '..', 'core', 'src', 'gps', 'index.ts'));
  const { METRES_PER_MILE, formatClock, formatPace, gpsDistanceM, gpsSummary, pacePerMile } = gps;

  // The phone: the GPX's segments back into the recorder's lines, so gpsSummary sees what the app saw.
  const gpx = fs.readFileSync(files[0], 'utf8');
  const segments = [...gpx.matchAll(/<trkseg>([\s\S]*?)<\/trkseg>/g)].map((m) =>
    [...m[1].matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)">[\s\S]*?<time>([^<]+)<\/time>[\s\S]*?<ia:ha>([^<]+)<\/ia:ha>[\s\S]*?<\/trkpt>/g)].map(
      (p) => ({ t: Date.parse(p[3]), lat: Number(p[1]), lon: Number(p[2]), ha: Number(p[4]) }),
    ),
  ).filter((s) => s.length);
  if (!segments.length) throw new Error('the GPX holds no track points');
  const lines = [];
  segments.forEach((seg, i) => {
    lines.push({ t: seg[0].t, mark: i === 0 ? 'start' : 'resume' });
    lines.push(...seg);
    lines.push({ t: seg[seg.length - 1].t, mark: i === segments.length - 1 ? 'finish' : 'pause' });
  });
  const phone = gpsSummary(lines);

  // The watch: its own distance (the session's total and the records' running distance) and its points.
  const msgs = gps.readFit(new Uint8Array(fs.readFileSync(files[1])));
  const track = gps.fitTrack(msgs);
  const session = gps.fitSessions(msgs)[0] || {};
  let watchHaversine = 0;
  for (let i = 1; i < track.length; i++) watchHaversine += gpsDistanceM(track[i - 1], track[i]);
  // Timer events (global 21, event 0): type 0 start, 1 stop, 4 stop all. Paused spans run from a stop to the next start.
  const pauses = [];
  let stoppedAt = null;
  for (const m of msgs) {
    if (m.num !== 21 || m.fields.get(0) !== 0) continue;
    const t = gps.fitTimeMs(m.fields.get(253));
    const type = m.fields.get(1);
    if ((type === 1 || type === 4) && stoppedAt === null) stoppedAt = t;
    else if (type === 0 && stoppedAt !== null) {
      pauses.push([stoppedAt, t]);
      stoppedAt = null;
    }
  }
  const t0 = track[0].t;
  const clock = (t) => t - t0 - pauses.reduce((s, [a, b]) => s + Math.max(0, Math.min(t, b) - a) * (t > a ? 1 : 0), 0);
  const watchSplits = [];
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i];
    if (a.distM === undefined || b.distM === undefined || b.distM <= a.distM) continue;
    while (b.distM >= (watchSplits.length + 1) * METRES_PER_MILE && a.distM < (watchSplits.length + 1) * METRES_PER_MILE) {
      const target = (watchSplits.length + 1) * METRES_PER_MILE;
      const at = clock(a.t) + ((target - a.distM) / (b.distM - a.distM)) * (clock(b.t) - clock(a.t));
      watchSplits.push(at);
    }
  }
  const watchDist = session.distanceM ?? track[track.length - 1].distM ?? watchHaversine;

  // The gap between the tracks at each phone fix the watch's records bracket in time.
  const gaps = [];
  let j = 0;
  for (const seg of phone.stretches)
    for (const f of seg) {
      while (j + 1 < track.length && track[j + 1].t <= f.t) j++;
      const a = track[j], b = track[j + 1];
      if (!a || !b || f.t < a.t || f.t > b.t) continue;
      const k = b.t === a.t ? 0 : (f.t - a.t) / (b.t - a.t);
      gaps.push(gpsDistanceM(f, { lat: a.lat + k * (b.lat - a.lat), lon: a.lon + k * (b.lon - a.lon) }));
    }
  gaps.sort((x, y) => x - y);
  const q = (p) => (gaps.length ? gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))] : NaN);

  const mi = (m) => (m / METRES_PER_MILE).toFixed(3) + ' mi';
  const pct = (a, b) => (((a - b) / b) * 100).toFixed(2) + '%';
  console.log(`phone  ${phone.stretches.reduce((s, x) => s + x.length, 0)} fixes in ${phone.stretches.length} stretch(es), moving ${formatClock(phone.movingS)}, elapsed ${formatClock(phone.elapsedS)}`);
  console.log(`watch  ${track.length} records, timer ${session.timerS === undefined ? '?' : formatClock(session.timerS)}, ${pauses.length} pause(s)`);
  console.log('');
  console.log(`distance  phone ${phone.distanceM.toFixed(1)} m (${mi(phone.distanceM)})  watch ${watchDist.toFixed(1)} m (${mi(watchDist)})  phone − watch ${(phone.distanceM - watchDist).toFixed(1)} m (${pct(phone.distanceM, watchDist)})`);
  console.log(`          the watch's points by the phone's math: ${watchHaversine.toFixed(1)} m (${pct(watchHaversine, watchDist)} from its own distance)`);
  if (knownM) console.log(`known     ${knownM} m: phone ${pct(phone.distanceM, knownM)}  watch ${pct(watchDist, knownM)}`);
  console.log(`avg pace  phone ${formatPace(pacePerMile(phone.distanceM, phone.movingS))}  watch ${formatPace(pacePerMile(watchDist, session.timerS ?? 0))} per mile`);
  console.log('');
  console.log('mile  phone   watch   phone − watch');
  const n = Math.max(phone.splits.length, watchSplits.length);
  for (let i = 0; i < n; i++) {
    const p = phone.splits[i] ? phone.splits[i].seconds : null;
    const w = watchSplits[i] === undefined ? null : (watchSplits[i] - (watchSplits[i - 1] ?? 0)) / 1000;
    const d = p !== null && w !== null ? (p - w >= 0 ? '+' : '−') + Math.abs(p - w).toFixed(1) + ' s' : '';
    console.log(`${String(i + 1).padStart(4)}  ${(p === null ? '' : formatClock(p)).padEnd(6)}  ${(w === null ? '' : formatClock(w)).padEnd(6)}  ${d}`);
  }
  console.log('');
  console.log(`track gap (${gaps.length} phone fixes matched in time)  median ${q(0.5).toFixed(1)} m  90th ${q(0.9).toFixed(1)} m  worst ${(gaps[gaps.length - 1] ?? NaN).toFixed(1)} m`);
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
