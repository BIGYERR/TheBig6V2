// GPS recording's math (core/src/gps/, docs/decisions/gps-recording.md, D267 P-GPSTEST): the lines the iOS app's ia-gps
// plugin writes, the run they add up to, how it reads on the screen and the GPX the Run recorder shares.
//
// Every expected number is worked by hand from the ruling and plain arithmetic, never asked of the code:
// - one degree of latitude on a meridian is 6,371,008.8 m (the IUGG mean radius) × π ÷ 180 = 111,195.0797 m, and along
//   a meridian the haversine is exact (2R·asin(sin(Δφ/2)) = R·Δφ), so a track that moves north at a steady speed
//   covers speed × time;
// - a mile is 1,609.344 m, so at 4 m/s a mile takes 402.336 s;
// - times are built with Date.UTC, and every line is typed out.
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

  test('names the run, escaped, and starts at the start mark', () => {
    assert.ok(gpx.includes('<metadata><name>Run &lt;test&gt; &amp; co</name><time>2026-10-26T12:00:00.000Z</time></metadata>'));
  });
});
