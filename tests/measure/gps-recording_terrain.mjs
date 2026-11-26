// Measure: does a map of ground height fix the climb the phone's barometer counts (D296, docs/decisions/gps-recording.md)?
// It reads the Run recorder's GPX of one run and one Copernicus 30 m elevation tile (GLO-30, a GeoTIFF from the public
// archive, the one-degree square the run sits in), neither committed: a track shows where a run starts and ends, and a
// tile's name shows the square. For every fix it reads the ground height under it, then counts the climb each candidate
// gives on the 2 m turn band, in total and mile by mile against the watch's own laps.
//   node tests/measure/gps-recording_terrain.mjs <run.gpx> <tile.tif> <watch laps up/down,...> <watch lap ends s,...>
// It prints counts, heights relative to Start and times from Start only: never a coordinate, a date or a clock time.
// Its output is saved beside it as gps-recording_terrain.md.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { CLIMB_BAND_M } from '../../core/src/index.ts';

const [gpxFile, tifFile, lapsArg, endsArg] = process.argv.slice(2);
if (!endsArg) {
  console.error('usage: node tests/measure/gps-recording_terrain.mjs <run.gpx> <tile.tif> <watch laps up/down,...> <watch lap ends s,...>');
  process.exit(2);
}
const watchLaps = lapsArg.split(',').map((s) => s.split('/').map(Number));
const lapEnds = endsArg.split(',').map(Number);

// The GeoTIFF: one image of 32-bit floats in deflated tiles, predictor 3 (floating point), its tiepoint the centre of
// the first cell (GTRasterTypeGeoKey 2, a point). Only what the Copernicus tiles use is read; anything else stops.
const buf = fs.readFileSync(tifFile);
if (buf.toString('latin1', 0, 2) !== 'II' || buf.readUInt16LE(2) !== 42) throw new Error('not a little-endian classic TIFF');
const tags = new Map();
{
  const ifd = buf.readUInt32LE(4);
  const n = buf.readUInt16LE(ifd);
  const size = { 3: 2, 4: 4, 12: 8 };
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    const tag = buf.readUInt16LE(e), type = buf.readUInt16LE(e + 2), count = buf.readUInt32LE(e + 4);
    if (!size[type]) continue;
    const at = size[type] * count <= 4 ? e + 8 : buf.readUInt32LE(e + 8);
    const read = (k) => (type === 3 ? buf.readUInt16LE(at + 2 * k) : type === 4 ? buf.readUInt32LE(at + 4 * k) : buf.readDoubleLE(at + 8 * k));
    tags.set(tag, Array.from({ length: count }, (_, k) => read(k)));
  }
}
const one = (t) => tags.get(t)?.[0];
if (one(259) !== 8 || one(317) !== 3 || one(339) !== 3 || one(258) !== 32) throw new Error('expected deflate, predictor 3, float32');
const keys = tags.get(34735) ?? [];
const rasterType = (() => {
  for (let i = 4; i < keys.length; i += 4) if (keys[i] === 1025) return keys[i + 3];
  return 1;
})();
const W = one(256), H = one(257), TW = one(322), TH = one(323);
const [sx, sy] = tags.get(33550);
const [, , , lon0, lat0] = tags.get(33922);
const offsets = tags.get(324), counts = tags.get(325);
const across = Math.ceil(W / TW);
const cache = new Map();
function tile(i) {
  if (cache.has(i)) return cache.get(i);
  const raw = zlib.inflateSync(buf.subarray(offsets[i], offsets[i] + counts[i]));
  const out = new Float32Array(TW * TH);
  const row = new Uint8Array(TW * 4);
  const four = new DataView(new ArrayBuffer(4));
  for (let y = 0; y < TH; y++) {
    row.set(raw.subarray(y * TW * 4, (y + 1) * TW * 4));
    for (let k = 1; k < row.length; k++) row[k] = (row[k] + row[k - 1]) & 255;
    for (let x = 0; x < TW; x++) {
      for (let b = 0; b < 4; b++) four.setUint8(b, row[b * TW + x]);
      out[y * TW + x] = four.getFloat32(0, false);
    }
  }
  cache.set(i, out);
  return out;
}
function cell(c, r) {
  const t = tile(Math.floor(r / TH) * across + Math.floor(c / TW));
  return t[(r % TH) * TW + (c % TW)];
}
/** The ground height under a point, read bilinearly between the four cells around it. */
function ground(lat, lon) {
  const half = rasterType === 1 ? 0.5 : 0;
  const c = (lon - lon0) / sx - half, r = (lat0 - lat) / sy - half;
  const c0 = Math.floor(c), r0 = Math.floor(r), fc = c - c0, fr = r - r0;
  if (c0 < 0 || r0 < 0 || c0 + 1 >= W || r0 + 1 >= H) throw new Error('the run leaves the tile');
  const top = cell(c0, r0) * (1 - fc) + cell(c0 + 1, r0) * fc;
  const bottom = cell(c0, r0 + 1) * (1 - fc) + cell(c0 + 1, r0 + 1) * fc;
  return top * (1 - fr) + bottom * fr;
}

// The run: every fix with its time from Start, GPS altitude, barometer altitude and the ground under it.
const gpx = fs.readFileSync(gpxFile, 'utf8');
const start = Date.parse(/<metadata>[\s\S]*?<time>([^<]+)<\/time>/.exec(gpx)[1]);
const P = [...gpx.matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)">([\s\S]*?)<\/trkpt>/g)]
  .map((m) => {
    const num = (tag) => {
      const x = new RegExp(`<${tag}>([^<]+)</${tag}>`).exec(m[3]);
      return x ? Number(x[1]) : undefined;
    };
    const lat = Number(m[1]), lon = Number(m[2]);
    return { s: (Date.parse(/<time>([^<]+)<\/time>/.exec(m[3])[1]) - start) / 1000, gps: num('ele'), baro: num('ia:ralt'), dem: ground(lat, lon) };
  })
  .filter((p) => p.gps !== undefined && p.baro !== undefined);

/** Climb and descent on the turn band, each counted step put in the watch lap it falls in. */
function band(xs) {
  let mark = null, dir = 0;
  const laps = lapEnds.map(() => [0, 0]);
  xs.forEach((x, i) => {
    const lap = lapEnds.findIndex((e) => P[i].s <= e);
    const at = lap < 0 ? lapEnds.length - 1 : lap;
    if (mark === null) mark = x;
    else if (x > mark && (dir === 1 || x - mark >= CLIMB_BAND_M)) [laps[at][0], mark, dir] = [laps[at][0] + x - mark, x, 1];
    else if (x < mark && (dir === -1 || mark - x >= CLIMB_BAND_M)) [laps[at][1], mark, dir] = [laps[at][1] + mark - x, x, -1];
  });
  return laps;
}
/** The barometer plus the mean of (reference − barometer) over the last w minutes. */
const heldTo = (ref, w) => {
  const q = [];
  let sum = 0;
  return P.map((p) => {
    const d = p[ref] - p.baro;
    q.push(d);
    sum += d;
    if (q.length > w * 60) sum -= q.shift();
    return p.baro + sum / q.length;
  });
};
/** The barometer less the straight line fitted over the whole run to (barometer − reference): its drift taken out. */
const lineTo = (ref) => {
  const n = P.length;
  const mt = P.reduce((a, p) => a + p.s, 0) / n;
  const md = P.reduce((a, p) => a + (p.baro - p[ref]), 0) / n;
  let num = 0, den = 0;
  for (const p of P) {
    num += (p.s - mt) * (p.baro - p[ref] - md);
    den += (p.s - mt) ** 2;
  }
  const slope = num / den;
  console.log(`- The barometer drifts ${(slope * 3600).toFixed(1)} m an hour against ${ref === 'gps' ? 'GPS altitude' : 'the ground under the run'}.`);
  return P.map((p) => p.baro - slope * (p.s - mt));
};

const f = (x) => x.toFixed(1);
console.log('## Where each stands from Start, in m');
const rows = [];
for (let m = 5; m * 60 <= P.at(-1).s; m += 5) {
  const p = P.find((x) => x.s >= m * 60);
  rows.push(`${m} min: barometer ${f(p.baro - P[0].baro)}, GPS ${f(p.gps - P[0].gps)}, ground ${f(p.dem - P[0].dem)}`);
}
console.log(`- ${rows.join('; ')}.`);
console.log(`- At the last fix: barometer ${f(P.at(-1).baro - P[0].baro)}, GPS ${f(P.at(-1).gps - P[0].gps)}, ground ${f(P.at(-1).dem - P[0].dem)}.`);
console.log('');
console.log(`## Climb on the ${CLIMB_BAND_M} m turn band, against the watch`);
const watch = { up: watchLaps.reduce((a, l) => a + l[0], 0), down: watchLaps.reduce((a, l) => a + l[1], 0) };
console.log(`- The watch: ${watch.up} m up, ${watch.down} m down; by lap ${watchLaps.map(([u, d]) => `${u}/${d}`).join(', ')}.`);
const candidates = [
  ['The barometer (as built)', P.map((p) => p.baro)],
  ['The ground under the run', P.map((p) => p.dem)],
  ['GPS altitude', P.map((p) => p.gps)],
  ['The barometer held to GPS altitude over 5 min', heldTo('gps', 5)],
  ['The barometer held to the ground over 5 min', heldTo('dem', 5)],
  ['The barometer held to the ground over 10 min', heldTo('dem', 10)],
  ['The barometer, its drift against GPS altitude taken out', lineTo('gps')],
  ['The barometer, its drift against the ground taken out', lineTo('dem')],
];
for (const [name, xs] of candidates) {
  const laps = band(xs);
  const up = laps.reduce((a, l) => a + l[0], 0), down = laps.reduce((a, l) => a + l[1], 0);
  const miss = laps.reduce((a, [u, d], i) => a + Math.abs(u - watchLaps[i][0]) + Math.abs(d - watchLaps[i][1]), 0);
  console.log(`- ${name}: ${f(up)} m up, ${f(down)} m down; by lap ${laps.map(([u, d]) => `${f(u)}/${f(d)}`).join(', ')}; off the watch's laps by ${f(miss)} m in all.`);
}
