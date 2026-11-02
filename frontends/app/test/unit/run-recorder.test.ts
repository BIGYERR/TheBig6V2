// The Run recorder (src/app/screens/run-recorder/run-recorder-model.ts, docs/decisions/gps-recording.md, D267
// P-GPSTEST): the row on the Bugs tab, the screen's states and buttons, and how a run reads on it. The math is
// core/src/gps's, tested in tests/unit/gps-recording.test.ts; this holds what the screen says.
//
// Every expected string is typed by hand from the ruling's copy and plain arithmetic: north along a meridian at 4 m/s,
// one fix a second, a run covers 4 m a second (one degree of latitude is 6,371,008.8 m × π ÷ 180 = 111,195.0797 m), so
// 600 s is 2,400 m, 1.4913 miles ("1.49"); every mile takes 1,609.344 ÷ 4 = 402.336 s, so the average pace, the first
// split and the pace of the mile in progress all read 6:42.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  RECORDER_COPY,
  gpsLine,
  gpxFileName,
  recorderAvailable,
  recorderView,
  runStart,
  type GpsLine,
} from '../../src/app/screens/run-recorder/run-recorder-model.ts';

const DEG_LAT_M = 111195.0797;
const T0 = Date.UTC(2026, 9, 26, 11, 30, 0);

function meridian(seconds: number): GpsLine[] {
  const lines: GpsLine[] = [{ t: T0, mark: 'start' }];
  for (let s = 0; s <= seconds; s++) lines.push({ t: T0 + s * 1000, lat: (4 * s) / DEG_LAT_M, lon: 0, ha: 5 });
  return lines;
}

const LIVE = { auth: 'granted', lastFix: null, live: true } as const;

describe('the Run recorder row', () => {
  it('shows on the Bugs tab only when the GPS plugin is present', () => {
    assert.equal(recorderAvailable({}), false);
    assert.equal(recorderAvailable({ iaGps: {} }), true);
  });

  it('reads as the ruling wrote it', () => {
    assert.equal(RECORDER_COPY.row, 'Run recorder');
    assert.equal(RECORDER_COPY.rowNote, 'Test GPS against your watch. Runs stay on this phone.');
    assert.equal(RECORDER_COPY.confirmDelete, 'Delete this run? It cannot come back.');
  });
});

describe('the screen', () => {
  it('walks waiting, recording, paused and finished, with the buttons each state shows', () => {
    assert.deepEqual(recorderView([], LIVE).buttons, ['start']);
    const going = meridian(10);
    assert.deepEqual(recorderView(going, LIVE).state, 'recording');
    assert.deepEqual(recorderView(going, LIVE).buttons, ['pause', 'finish']);
    const paused: GpsLine[] = [...going, { t: T0 + 11000, mark: 'pause' }];
    assert.deepEqual(recorderView(paused, LIVE).buttons, ['resume', 'finish']);
    const done: GpsLine[] = [...paused, { t: T0 + 20000, mark: 'finish' }];
    assert.deepEqual(recorderView(done, { ...LIVE, live: false }).buttons, ['share', 'delete']);
  });

  it('shows a run iOS ended without a finish mark as finished, never as still recording', () => {
    const view = recorderView(meridian(10), { ...LIVE, live: false });
    assert.equal(view.state, 'finished');
    assert.deepEqual(view.buttons, ['share', 'delete']);
  });

  it('says Waiting for GPS. until a fix, then the accuracy iOS reports in whole metres', () => {
    assert.equal(gpsLine('granted', null), 'Waiting for GPS.');
    assert.equal(gpsLine('granted', { t: T0, lat: 0, lon: 0, ha: -1 }), 'Waiting for GPS.');
    assert.equal(gpsLine('granted', { t: T0, lat: 0, lon: 0, ha: 7.6 }), 'GPS ±8 m');
    assert.equal(gpsLine('denied', null), 'Location is off for The Asylum. Turn it on in Settings.');
  });

  it('prints distance in miles to two places and pace as m:ss per mile', () => {
    const view = recorderView(meridian(600), { ...LIVE, now: T0 + 600000 });
    assert.equal(view.time, '10:00');
    assert.equal(view.distance, '1.49');
    assert.equal(view.avgPace, '6:42');
    assert.equal(view.milePace, '6:42');
    assert.deepEqual(view.splits, [{ mile: 1, time: '6:42' }]);
  });

  it('shows no pace before any distance', () => {
    const view = recorderView([{ t: T0, mark: 'start' }], { ...LIVE, now: T0 + 5000 });
    assert.equal(view.time, '0:05');
    assert.equal(view.avgPace, '—');
  });

  it('runs the clock on now while recording, and stops it at the last line once the run is over', () => {
    assert.equal(recorderView(meridian(10), { ...LIVE, now: T0 + 65000 }).time, '1:05');
    assert.equal(recorderView(meridian(10), { ...LIVE, live: false, now: T0 + 65000 }).time, '0:10');
  });
});

describe('a run file', () => {
  it('names the run by its start, and the shared GPX by its local start', () => {
    assert.equal(runStart(`run-${T0}`), T0);
    assert.equal(runStart('backup.json'), null);
    const d = new Date(T0);
    const p = (n: number) => String(n).padStart(2, '0');
    const local = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
    assert.equal(gpxFileName(`run-${T0}`), `asylum-run-${local}.gpx`);
  });
});
