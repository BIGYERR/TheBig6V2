// The FIT reader (core/src/gps/fit.ts, docs/decisions/gps-recording.md, D267 P-GPSTEST), which reads a watch's run for
// the comparison. The file here is built byte by byte from the FIT protocol, and every expected value is worked by hand:
// - the CRC is CRC-16/ARC (reflected polynomial 0xA001, start 0): its published check value for the nine bytes
//   "123456789" is 0xBB3D, and the file's CRC is computed here bit by bit, not with the reader's nibble table;
// - FIT time is seconds since 1989-12-31T00:00:00Z, 631,065,600 s after 1970, so FIT time 1,000,000,000 is
//   1,631,065,600,000 ms;
// - a position is in semicircles, 2^31 to 180 degrees: 0x1A000000 is 0.203125 × 180 = 36.5625 degrees and −0x36000000
//   is −0.421875 × 180 = −75.9375 degrees;
// - distance is centimetres (12,345 is 123.45 m), speed mm/s (2,500 is 2.5 m/s), and 0xFFFF is the invalid uint16;
// - a compressed timestamp header replaces the last time's low five bits: 1,000,000,001 has low bits 1, so an offset
//   of 3 is 1,000,000,003.
// A real watch file is never committed (a track shows where a run starts); the reader was also checked by hand on the
// Pace 4's file of 2026-10-26 against COROS's own summary (5,640.39 m, 36:24, 15 laps), recorded in the ruling's file.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { FitError, fitCrc, fitTrack, readFit } from '@ia/core';

function crcArc(bytes: readonly number[]): number {
  let crc = 0;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
  }
  return crc;
}

const u16 = (v: number) => [v & 0xff, (v >>> 8) & 0xff];
const u32 = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];

function fitFile(data: number[]): number[] {
  const head = [14, 0x20, ...u16(2132), ...u32(data.length), 0x2e, 0x46, 0x49, 0x54];
  const header = [...head, ...u16(crcArc(head))];
  const body = [...header, ...data];
  return [...body, ...u16(crcArc(body))];
}

const LAT = 0x1a000000;
const LON = -0x36000000;
const DATA = [
  // Definition, local type 0: record (global 20), little endian: timestamp uint32, position_lat sint32,
  // position_long sint32, distance uint32, speed uint16.
  0x40, 0, 0, ...u16(20), 5, 253, 4, 0x86, 0, 4, 0x85, 1, 4, 0x85, 5, 4, 0x86, 6, 2, 0x84,
  0x00, ...u32(1000000000), ...u32(LAT), ...u32(LON), ...u32(12345), ...u16(2500),
  0x00, ...u32(1000000001), ...u32(LAT), ...u32(LON), ...u32(12545), ...u16(0xffff),
  // Definition, local type 1: record, position only; then one record with a compressed timestamp header, offset 3.
  0x41, 0, 0, ...u16(20), 2, 0, 4, 0x85, 1, 4, 0x85,
  0x80 | (1 << 5) | 3, ...u32(LAT), ...u32(LON),
];

describe('reading a FIT file', () => {
  test('the CRC is CRC-16/ARC: "123456789" checks to 0xBB3D', () => {
    assert.equal(fitCrc(new TextEncoder().encode('123456789')), 0xbb3d);
  });

  test('a file built from the protocol reads back as the typed time, position, distance and speed', () => {
    const track = fitTrack(readFit(new Uint8Array(fitFile(DATA))));
    assert.deepEqual(track, [
      { t: 1631065600000, lat: 36.5625, lon: -75.9375, distM: 123.45, spd: 2.5 },
      { t: 1631065601000, lat: 36.5625, lon: -75.9375, distM: 125.45 },
      { t: 1631065603000, lat: 36.5625, lon: -75.9375 },
    ]);
  });

  test('a file whose CRC is wrong is refused', () => {
    const bytes = fitFile(DATA);
    bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 0xff;
    // The reader's own refusal, for the CRC: any other throw (a missing reader among them) fails the test.
    assert.throws(
      () => readFit(new Uint8Array(bytes)),
      (e: unknown) => e instanceof FitError && e.message === 'file CRC is wrong',
    );
  });

  test('a file that is not FIT is refused', () => {
    assert.throws(
      () => readFit(new TextEncoder().encode('{"t":0,"mark":"start"}')),
      (e: unknown) => e instanceof FitError && e.message === 'not a FIT header',
    );
  });
});
