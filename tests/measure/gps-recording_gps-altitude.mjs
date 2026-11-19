// GPS recording: can the phone's GPS altitude give a run's climb? (measure, Post-v0.262.4, behind D296,
// docs/decisions/gps-recording.md). The phone's GPS altitude (the GPX's ele, there only where iOS gave the altitude an
// accuracy) against the watch's barometric altitude (the FIT's), each summed raw, and the phone's over a 9 fix mean.
// Prints no coordinate.
//
//   node tests/measure/gps-recording_gps-altitude.mjs <phone.gpx> <watch.fit> <label>
import fs from 'node:fs';
import { fitTrack, readFit } from '../../core/src/index.ts';

const [gpxPath, fitPath, label] = process.argv.slice(2);
if (!label) {
  console.error('usage: node tests/measure/gps-recording_gps-altitude.mjs <phone.gpx> <watch.fit> <label>');
  process.exit(2);
}
const phone = [...fs.readFileSync(gpxPath, 'utf8').matchAll(/<trkpt [^>]*>([\s\S]*?)<\/trkpt>/g)]
  .map((m) => /<ele>([^<]+)<\/ele>/.exec(m[1]))
  .filter(Boolean)
  .map((x) => Number(x[1]));
const watch = fitTrack(readFit(new Uint8Array(fs.readFileSync(fitPath)))).map((p) => p.alt).filter((a) => a !== undefined);
const mean = (xs, k) =>
  xs.map((_, i) => {
    const w = xs.slice(Math.max(0, i - (k - 1) / 2), Math.min(xs.length, i + (k - 1) / 2 + 1));
    return w.reduce((s, v) => s + v, 0) / w.length;
  });
const updown = (xs) => {
  let up = 0, down = 0;
  for (let i = 1; i < xs.length; i++) {
    const d = xs[i] - xs[i - 1];
    if (d > 0) up += d;
    else down -= d;
  }
  return `climb ${up.toFixed(0)} m, descent ${down.toFixed(0)} m, range ${Math.min(...xs).toFixed(0)} to ${Math.max(...xs).toFixed(0)} m`;
};
console.log(`- ${label}, the phone's GPS altitude, ${phone.length} fixes, every change: ${updown(phone)}.`);
console.log(`- ${label}, the phone's GPS altitude, each the mean of 9: ${updown(mean(phone, 9))}.`);
console.log(`- ${label}, the watch's barometric altitude, ${watch.length} points, every change: ${updown(watch)}.`);
