// GPS recording: how the watch counts climb and cadence, so the phone's barometer and step counter can be counted the
// same way (measure, Post-v0.262.4, behind D296, docs/decisions/gps-recording.md). Prints no coordinate.
//
//   node tests/measure/gps-recording_watch-climb.mjs <label>=<watch.fit> ...
//
// For each FIT file: the session's own total ascent and descent (session fields 22 and 23), and the watch's altitude
// track (record field 78, else 2) counted three ways at each band h: every change; a change counted only once the
// altitude stands h from where it was last counted ("dead band"); and a turn counted only once the altitude stands h
// past the highest or lowest point since the last turn ("turn band"; inside a climb every rise counts). Then the
// watch's cadence: record field 4 is strides a minute, so steps a minute is twice it plus field 53 (1/128 of a stride).
import fs from 'node:fs';
import { fitTrack, readFit } from '../../core/src/index.ts';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: node tests/measure/gps-recording_watch-climb.mjs <label>=<watch.fit> ...');
  process.exit(2);
}

function deadBand(xs, h) {
  let up = 0, down = 0, base = xs[0];
  for (const x of xs) {
    if (x - base >= h) {
      up += x - base;
      base = x;
    } else if (base - x >= h) {
      down += base - x;
      base = x;
    }
  }
  return [up, down];
}
function turnBand(xs, h) {
  let up = 0, down = 0, ref = xs[0], dir = 0;
  for (const x of xs) {
    if (x > ref && (dir === 1 || x - ref >= h)) {
      up += x - ref;
      ref = x;
      dir = 1;
    } else if (x < ref && (dir === -1 || ref - x >= h)) {
      down += ref - x;
      ref = x;
      dir = -1;
    }
  }
  return [up, down];
}

for (const [label, file] of args.map((a) => a.split('='))) {
  const msgs = readFit(new Uint8Array(fs.readFileSync(file)));
  const session = msgs.find((m) => m.num === 18);
  const alts = fitTrack(msgs).map((p) => p.alt).filter((a) => a !== undefined);
  console.log(`## ${label}`);
  console.log('');
  console.log(`- The watch's session: total ascent ${session?.fields.get(22)} m, total descent ${session?.fields.get(23)} m; its altitude track: ${alts.length} points.`);
  console.log('');
  console.log('| Band | Dead band: climb, descent | Turn band: climb, descent |');
  console.log('|---|---|---|');
  for (const h of [0, 0.5, 1, 1.5, 2, 3, 4]) {
    const [du, dd] = h === 0 ? turnBand(alts, 0) : deadBand(alts, h);
    const [tu, td] = turnBand(alts, h);
    console.log(`| ${h} m | ${du.toFixed(1)} m, ${dd.toFixed(1)} m | ${tu.toFixed(1)} m, ${td.toFixed(1)} m |`);
  }
  const cad = msgs.filter((m) => m.num === 20 && m.fields.get(4) !== undefined).map((m) => 2 * m.fields.get(4) + (m.fields.get(53) ?? 0) / 128);
  console.log('');
  console.log(`- Cadence: ${cad.length} records, mean ${(cad.reduce((a, b) => a + b, 0) / cad.length).toFixed(1)} steps a minute; the session's average cadence (field 18) ${session?.fields.get(18)} strides a minute.`);
  console.log('');
}
