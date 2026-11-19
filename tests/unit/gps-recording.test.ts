// GPS recording's math (core/src/gps/, docs/decisions/gps-recording.md, D267 P-GPSTEST): the lines the iOS app's ia-gps
// plugin writes, the run they add up to, how it reads on the screen and the GPX the Run recorder shares.
//
// Every expected number is worked by hand from the ruling and plain arithmetic, never asked of the code:
// - one degree of latitude on a meridian is 6,371,008.8 m (the IUGG mean radius) × π ÷ 180 = 111,195.0797 m, and along
//   a meridian the haversine is exact (2R·asin(sin(Δφ/2)) = R·Δφ), so a track that moves north at a steady speed
//   covers speed × time;
// - a mile is 1,609.344 m, so at 4 m/s a mile takes 402.336 s;
// - near 0° latitude a degree of longitude is the same 111,195.0797 m, so a fix x metres east and y metres north of
//   0°, 0° sits at (y, x) ÷ 111,195.0797 degrees, and distances between such fixes are plain Pythagoras;
// - times are built with Date.UTC, and every line is typed out.
//
// D293 (the 10 m rule) and D296 (steps and climb) added the tests from "the 10 m rule" on. A straight line at a steady
// speed keeps every fix that stands 10 m or more on, so the D267 tests above it keep their oracles.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
  formatClock,
  formatMiles,
  formatPace,
  gpsDistanceM,
  gpsSummary,
  parseRecording,
  recordingGpx,
  type GpsLine,
} from '@ia/core';

const DEG_LAT_M = 111195.0797;

/** A fix iOS gave a 5 m accuracy. */
function fix(t: number, lat: number, lon = 0, ha = 5): GpsLine {
  return { t, lat, lon, ha };
}

describe('distance', () => {
  test('one degree of latitude on a meridian is 111,195.08 m', () => {
    assert.ok(Math.abs(gpsDistanceM({ lat: 0, lon: 0 }, { lat: 1, lon: 0 }) - DEG_LAT_M) < 0.01);
  });

  test('a fix iOS marks invalid (negative horizontal accuracy) adds no distance', () => {
    // Counted, the off-line fix B would add about 1.1 km; dropped, the run is A to C, 0.002 degrees north.
    const run = gpsSummary([{ t: 0, mark: 'start' }, fix(0, 0), fix(1000, 0.001, 0.01, -1), fix(2000, 0.002), { t: 2000, mark: 'finish' }]);
    assert.ok(Math.abs(run.distanceM - 0.002 * DEG_LAT_M) < 0.001);
    assert.equal(run.stretches[0]?.length, 2);
  });
});

describe('pauses', () => {
  // Start at 0 s, Pause at 20 s, Resume at 80 s, Finish at 100 s: 100 s elapsed, 60 s paused, 40 s moving. Moving: A to
  // B and C to D, 0.001 degrees each. The 0.009 degree gap from B to C (about 1 km) falls inside no stretch, and the fix
  // P recorded during the pause counts for nothing.
  const lines: GpsLine[] = [
    { t: 0, mark: 'start' },
    fix(1000, 0),
    fix(11000, 0.001),
    { t: 20000, mark: 'pause' },
    fix(25000, 0.5),
    { t: 80000, mark: 'resume' },
    fix(81000, 0.01),
    fix(91000, 0.011),
    { t: 100000, mark: 'finish' },
  ];

  test('time between Pause and Resume counts toward elapsed time, not moving time', () => {
    const run = gpsSummary(lines);
    assert.equal(run.state, 'finished');
    assert.equal(run.elapsedS, 100);
    assert.equal(run.movingS, 40);
  });

  test('the gap a pause spans adds no distance', () => {
    const run = gpsSummary(lines);
    assert.ok(Math.abs(run.distanceM - 0.002 * DEG_LAT_M) < 0.001);
    assert.equal(run.stretches.length, 2);
  });

  test('a run still paused counts the open pause up to now', () => {
    const run = gpsSummary(lines.slice(0, 5), 50000);
    assert.equal(run.state, 'paused');
    assert.equal(run.elapsedS, 50);
    assert.equal(run.movingS, 20);
  });
});

describe('mile splits', () => {
  // North along the meridian at 4 m/s, one fix a second for 900 s: 3,600 m. Each mile takes 1,609.344 ÷ 4 = 402.336 s;
  // after two miles the mile in progress holds 3,600 − 3,218.688 = 381.312 m in 900 − 804.672 = 95.328 s.
  const lines: GpsLine[] = [{ t: 0, mark: 'start' }];
  for (let s = 0; s <= 900; s++) lines.push(fix(s * 1000, (4 * s) / DEG_LAT_M));
  lines.push({ t: 900000, mark: 'finish' });
  const run = gpsSummary(lines);

  test('a split falls at 1,609.344 m, its time interpolated between the fixes either side', () => {
    assert.equal(run.splits.length, 2);
    assert.deepEqual(run.splits.map((s) => s.mile), [1, 2]);
    for (const s of run.splits) assert.ok(Math.abs(s.seconds - 402.336) < 1e-3);
  });

  test('the mile in progress holds the distance and moving time since the last split', () => {
    assert.ok(Math.abs(run.distanceM - 3600) < 0.01);
    assert.ok(Math.abs(run.partM - 381.312) < 0.01);
    assert.ok(Math.abs(run.partS - 95.328) < 1e-3);
  });
});

/** A fix x metres east and y metres north of 0°, 0°, at t seconds, with an accuracy of ha metres. */
function at(t: number, x: number, y: number, ha = 5): GpsLine {
  return { t: t * 1000, lat: y / DEG_LAT_M, lon: x / DEG_LAT_M, ha };
}
const START: GpsLine = { t: 0, mark: 'start' };

describe('the 10 m rule (D293)', () => {
  test('a run north at 3 m/s whose fixes swing 2 m either side of its line counts the line, not the zig-zag', () => {
    // Every fix joined, each step is a 3, 4, 5 triangle: 40 steps of 5 m, 200 m. Kept from fix 0, the 1st stands 5 m
    // off, the 2nd 6 m, the 3rd √(9² + 4²) ≈ 9.85 m, the 4th 12 m: every 4th fix is kept, on the line, 12 m apart, and
    // the 40 s count 10 steps of 12 m, 120 m.
    const lines: GpsLine[] = [START];
    for (let s = 0; s <= 40; s++) lines.push(at(s, s % 2 === 0 ? 2 : -2, 3 * s));
    lines.push({ t: 40000, mark: 'finish' });
    assert.ok(Math.abs(gpsSummary(lines).distanceM - 120) < 1e-3);
  });

  test('standing, a fix wandering within a few metres of where it stood adds nothing', () => {
    // A minute of fixes round the corners of a 3 m square: none stands 10 m (the far corner is √18 ≈ 4.24 m) from the
    // first, so nothing is kept after it. Every fix joined would count 60 steps of 3 m or more.
    const corners = [
      [0, 0],
      [3, 0],
      [3, 3],
      [0, 3],
    ] as const;
    const lines: GpsLine[] = [START];
    for (let s = 0; s <= 60; s++) {
      const [x, y] = corners[s % 4] ?? [0, 0];
      lines.push(at(s, x, y));
    }
    lines.push({ t: 60000, mark: 'finish' });
    assert.equal(gpsSummary(lines).distanceM, 0);
  });

  test('a fix with an accuracy worse than 50 m is never kept, and one of 50 m is', () => {
    // From 0, 0: a fix 100 m east and 20 m north at 60 m accuracy is passed over; one 30 m north at 50 m is kept, 30 m.
    const run = gpsSummary([START, at(0, 0, 0), at(10, 100, 20, 60), at(20, 0, 30, 50), { t: 20000, mark: 'finish' }]);
    assert.ok(Math.abs(run.distanceM - 30) < 1e-3);
  });

  test('nothing after the last kept fix is counted', () => {
    // North at 4 m/s for 4 s: the fixes stand 0, 4, 8, 12 and 16 m on. 12 m is kept; 16 m is 4 m past it. 12 m.
    const lines: GpsLine[] = [START];
    for (let s = 0; s <= 4; s++) lines.push(at(s, 0, 4 * s));
    lines.push({ t: 4000, mark: 'finish' });
    assert.ok(Math.abs(gpsSummary(lines).distanceM - 12) < 1e-3);
  });
});

describe('steps and cadence (D296)', () => {
  test('a step counter line and a barometer line parse, and a fix still parses as a fix', () => {
    const text = '{"t":5,"steps":12,"sd":8.5,"cad":2.6}\n{"t":6,"ralt":-0.4,"kpa":101.2}\n{"t":7,"lat":1,"lon":2,"ha":3}';
    assert.deepEqual(parseRecording(text), [
      { t: 5, steps: 12, sd: 8.5, cad: 2.6 },
      { t: 6, ralt: -0.4, kpa: 101.2 },
      { t: 7, lat: 1, lon: 2, ha: 3 },
    ]);
  });

  test('steps count the rise in the total inside each stretch, and a pause drops the steps across it', () => {
    // Start at 0 s (the total stands at 0), 100 at 10 s, Pause at 60 s, 130 at 90 s while paused, Resume at 100 s, 150
    // at 110 s, 250 at 160 s, Finish at 170 s: 100 + (250 − 150) = 200 steps; the 50 from 100 to 150 span the pause.
    // Moving time 170 − 40 = 130 s, so the cadence is 200 × 60 ÷ 130 ≈ 92.31 steps a minute.
    const run = gpsSummary([
      START,
      { t: 10000, steps: 100 },
      { t: 60000, mark: 'pause' },
      { t: 90000, steps: 130 },
      { t: 100000, mark: 'resume' },
      { t: 110000, steps: 150 },
      { t: 160000, steps: 250 },
      { t: 170000, mark: 'finish' },
    ]);
    assert.equal(run.steps, 200);
    assert.ok(Math.abs((run.cadenceSpm ?? 0) - (200 * 60) / 130) < 1e-9);
  });

  test('a run with no step counter or barometer reading has no steps, cadence or climb', () => {
    const run = gpsSummary([START, at(0, 0, 0), at(10, 0, 40), { t: 10000, mark: 'finish' }]);
    assert.equal(run.steps, null);
    assert.equal(run.cadenceSpm, null);
    assert.equal(run.climbM, null);
    assert.equal(run.descentM, null);
  });
});

describe('climb (D296)', () => {
  const baro = (s: number, ralt: number): GpsLine => ({ t: s * 1000, ralt });

  test('counts on a 2 m turn band', () => {
    // Mark 0. 1, 1.9 and 0.5 stand under 2 m from it. 2.5 stands 2.5 m above: climb 2.5, mark 2.5, climbing. 3.5 rises
    // on: climb 1, mark 3.5. 2 is 1.5 below: nothing. 1.4 is 2.1 below: descent 2.1, mark 1.4, descending. 2 is 0.6
    // above: nothing. Climb 3.5 m, descent 2.1 m.
    const alts = [0, 1, 1.9, 0.5, 2.5, 3.5, 2, 1.4, 2];
    const run = gpsSummary([START, ...alts.map((a, i) => baro(i + 1, a)), { t: 10000, mark: 'finish' }]);
    assert.ok(Math.abs((run.climbM ?? -1) - 3.5) < 1e-9);
    assert.ok(Math.abs((run.descentM ?? -1) - 2.1) < 1e-9);
  });

  test('the band starts again after a pause, and a reading while paused counts for nothing', () => {
    // Stretch 1: 0, then 1.5 (under the band). Paused: 1.5. Stretch 2 marks its first reading, 1.5, and 3 stands 1.5
    // above it: no climb. Carried across the pause, the mark 0 would have counted 3 m.
    const run = gpsSummary([
      START,
      baro(1, 0),
      baro(2, 1.5),
      { t: 3000, mark: 'pause' },
      baro(4, 1.5),
      { t: 5000, mark: 'resume' },
      baro(6, 1.5),
      baro(7, 3),
      { t: 8000, mark: 'finish' },
    ]);
    assert.equal(run.climbM, 0);
    assert.equal(run.descentM, 0);
  });

  test('a split carries the barometer\'s net change across its mile', () => {
    // North at 4 m/s for 900 s: the miles end at 402.336 s and 804.672 s. The barometer reads 0 at 0 s, 3 at 400 s,
    // 3.5 at 403 s, 1 at 804 s and 0 at 900 s. The last reading at or before each end: 3 (mile 1, +3 m) and 1 (mile 2,
    // 1 − 3 = −2 m).
    const lines: GpsLine[] = [START, baro(0, 0)];
    const readings = new Map([
      [400, 3],
      [403, 3.5],
      [804, 1],
      [900, 0],
    ]);
    for (let s = 0; s <= 900; s++) {
      lines.push(fix(s * 1000, (4 * s) / DEG_LAT_M));
      const r = readings.get(s);
      if (r !== undefined) lines.push(baro(s, r));
    }
    lines.push({ t: 900000, mark: 'finish' });
    const run = gpsSummary(lines);
    assert.deepEqual(
      run.splits.map((s) => s.climbM),
      [3, -2],
    );
  });
});

describe('the recording file', () => {
  test('a line cut short by iOS closing the app is skipped, and every whole line is kept', () => {
    const text = '{"t":0,"mark":"start"}\n{"t":1000,"lat":37.1,"lon":-76.5,"ha":4.7,"spd":2.45}\n\n{"t":2000,"lat":37.10';
    assert.deepEqual(parseRecording(text), [
      { t: 0, mark: 'start' },
      { t: 1000, lat: 37.1, lon: -76.5, ha: 4.7, spd: 2.45 },
    ]);
  });
});

describe('how a run reads', () => {
  test('distance prints in miles to two places', () => {
    assert.equal(formatMiles(0), '0.00');
    assert.equal(formatMiles(3.514 * 1609.344), '3.51');
  });

  test('pace prints as m:ss per mile, rounded once on whole seconds so it never reads 8:60', () => {
    assert.equal(formatPace(519.4), '8:39');
    assert.equal(formatPace(539.6), '9:00');
    assert.equal(formatPace(null), '—');
  });

  test('time prints as m:ss, and h:mm:ss from an hour on', () => {
    assert.equal(formatClock(2184.48), '36:24');
    assert.equal(formatClock(3723), '1:02:03');
  });
});

describe('the GPX the Run recorder shares', () => {
  const t0 = Date.UTC(2026, 9, 26, 12, 0, 0);
  const gpx = recordingGpx(
    [
      { t: t0, mark: 'start' },
      { t: t0 + 1000, lat: 37.1, lon: -76.5, ha: 5, alt: 12, va: 3, spd: 2.5 },
      { t: t0 + 2000, lat: 37.2, lon: -76.5, ha: -1 },
      { t: t0 + 3000, mark: 'pause' },
      { t: t0 + 9000, mark: 'resume' },
      { t: t0 + 10000, lat: 37.3, lon: -76.4, ha: 6, alt: 15, va: -1 },
      { t: t0 + 11000, lat: 37.31, lon: -76.4, ha: 7, spd: -1 },
      { t: t0 + 12000, mark: 'finish' },
    ],
    'Run <test> & co',
  );

  test('holds one trkpt per valid fix with its time, and a new trkseg after each pause', () => {
    assert.equal(gpx.match(/<trkseg>/g)?.length, 2);
    assert.equal(gpx.match(/<trkpt /g)?.length, 3);
    assert.ok(
      gpx.includes(
        '<trkpt lat="37.1" lon="-76.5"><ele>12</ele><time>2026-10-26T12:00:01.000Z</time>' +
          '<extensions><ia:ha>5</ia:ha><ia:spd>2.5</ia:spd></extensions></trkpt>',
      ),
    );
    // No altitude where iOS gave the altitude no accuracy, no speed where iOS gave none.
    assert.ok(gpx.includes('<trkpt lat="37.3" lon="-76.4"><time>2026-10-26T12:00:10.000Z</time><extensions><ia:ha>6</ia:ha></extensions></trkpt>'));
    assert.ok(gpx.includes('<trkpt lat="37.31" lon="-76.4"><time>2026-10-26T12:00:11.000Z</time><extensions><ia:ha>7</ia:ha></extensions></trkpt>'));
    assert.ok(!gpx.includes('lat="37.2"'));
  });

  test('gives each point the step total and the barometer altitude last read at or before it (D296)', () => {
    const withMotion = recordingGpx(
      [
        { t: t0, mark: 'start' },
        { t: t0 + 500, steps: 3 },
        { t: t0 + 700, ralt: 0.4 },
        { t: t0 + 1000, lat: 37.1, lon: -76.5, ha: 5 },
        { t: t0 + 1500, steps: 5 },
        { t: t0 + 2000, lat: 37.2, lon: -76.5, ha: 5 },
        { t: t0 + 3000, mark: 'finish' },
      ],
      'Run',
    );
    assert.ok(withMotion.includes('<extensions><ia:ha>5</ia:ha><ia:steps>3</ia:steps><ia:ralt>0.4</ia:ralt></extensions></trkpt>'));
    assert.ok(withMotion.includes('<extensions><ia:ha>5</ia:ha><ia:steps>5</ia:steps><ia:ralt>0.4</ia:ralt></extensions></trkpt>'));
  });

  test('names the run, escaped, and starts at the start mark', () => {
    assert.ok(gpx.includes('<metadata><name>Run &lt;test&gt; &amp; co</name><time>2026-10-26T12:00:00.000Z</time></metadata>'));
  });
});
