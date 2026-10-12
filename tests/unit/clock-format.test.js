'use strict';
// The m:ss clock helper: _clkMS in index.html, the one owner of every seconds limb the app prints (D126). It rounds
// the WHOLE number of seconds first, then splits it: minutes are the quotient by 60, seconds the remainder, padded to
// two digits. So a seconds limb of 60 cannot be built (the old idiom floored the minutes off the raw value and rounded
// the remainder afterwards, which printed 7:60 on Mario's card for 479.6 s).
//
// Every expected string below was worked out by hand from that contract and typed in. The test never asks the app
// what a clock should read. The printed clocks on cards are held by tests/integration/clock-format.test.js.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { appFunction } = require('../support/app.js');

const clk = appFunction('_clkMS');

/** A clock is minutes, a colon and a two digit seconds limb in 00..59. */
const WELL = /^-?\d+:[0-5]\d$/;
/** The contract, written here: round the whole value, then split at 60. */
function handClock(sec) {
  const t = Math.round(sec);
  const r = t % 60;
  return (t - r) / 60 + ':' + (r < 10 ? '0' + r : String(r));
}
/** The idiom D126 replaced, retyped: floor the minutes off the raw value, then round the remainder. */
const IDIOM = (s) => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');

test('the clock helper is a function', () => {
  assert.equal(typeof clk, 'function');
});

test('the hand table: whole seconds round first, then split, so 59.5 s carries into the minute', () => {
  const HAND = [
    [0, '0:00'],
    [7, '0:07'],
    [59, '0:59'],
    [59.4, '0:59'],
    [59.5, '1:00'], // the old idiom printed 0:60
    [60, '1:00'],
    [61.5, '1:02'],
    [299.5, '5:00'], // the old idiom printed 4:60
    [450.6, '7:31'],
    [479.4, '7:59'],
    [479.6, '8:00'], // Mario's card; the old idiom printed 7:60
    [480, '8:00'],
    [518.4, '8:38'],
    [570, '9:30'],
    [689.7, '11:30'],
    [3599, '59:59'],
    [3600, '60:00'], // a carrying clock keeps counting minutes; there is no hours limb
    [3660, '61:00'],
  ];
  for (const [sec, want] of HAND) assert.equal(clk(sec), want, `_clkMS(${sec})`);
});

test('every tenth of a second from 0 to 1200 s prints a two digit seconds limb in 00..59', () => {
  const bad = [];
  for (let x = 0; x <= 12000; x++) {
    const out = clk(x / 10);
    if (!WELL.test(out) && bad.length < 5) bad.push(x / 10 + ' -> ' + out);
  }
  assert.deepEqual(bad, []);
});

test('the helper differs from the old idiom only where the old idiom printed a malformed clock', () => {
  let changed = 0;
  const wrong = [];
  for (let x = 0; x <= 12000; x++) {
    const s = x / 10;
    const a = IDIOM(s);
    const b = clk(s);
    if (a === b) continue;
    changed++;
    if (WELL.test(a) && wrong.length < 5) wrong.push(s + ' idiom=' + a + ' helper=' + b);
  }
  assert.deepEqual(wrong, [], 'a divergence is legitimate only where the idiom printed :60');
  assert.ok(changed > 0, 'the changed set is not empty, so the helper is not a renamed copy of the idiom');
});

test('the rounding edges print as typed: x.5, m:59.5, 3599.5 and past the hour', () => {
  // Round the whole value (half up), then split: 0.5 -> 1 -> 0:01; 3599.5 -> 3600 -> 60:00; 7199.5 -> 7200 -> 120:00.
  const EDGE = [
    [0.4, '0:00'],
    [0.5, '0:01'],
    [29.5, '0:30'],
    [59.5, '1:00'],
    [119.5, '2:00'],
    [359.5, '6:00'],
    [599.5, '10:00'],
    [3599.4, '59:59'],
    [3599.5, '60:00'],
    [3600.5, '60:01'],
    [3659.5, '61:00'],
    [5999.5, '100:00'],
    [7199.5, '120:00'],
  ];
  for (const [sec, want] of EDGE) assert.equal(clk(sec), want, `_clkMS(${sec})`);
});

test('every half second from 0 to 7200 s prints the round-then-split clock, seconds 00..59', () => {
  const bad = [];
  for (let i = 0; i <= 14400; i++) {
    const s = i / 2;
    const got = clk(s);
    if ((got !== handClock(s) || !WELL.test(got)) && bad.length < 5) bad.push(s + ' -> ' + got + ' want ' + handClock(s));
  }
  assert.deepEqual(bad, []);
});
