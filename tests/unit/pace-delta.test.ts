// The pace gap under a logged run: updateDoseDerived's note in #doseDerived, "on target", "<n>s/mi faster than target"
// or "<m>:<ss>/mi slower than target". Ruling D40: a gap of a minute or more prints m:ss.
//
//   ad = |round(actual sec/mi - target sec/mi)|
//     ad <  5   "on target"
//     ad <  60  "<ad>s/mi <dir> than target"
//     ad >= 60  "<m>:<ss>/mi <dir> than target", ss padded to two digits
//   dir is "faster" when the athlete ran fewer seconds per mile than the target, "slower" when more.
//
// The real updateDoseDerived and doseDerived run alone (appFunction), with _parseClock, _fmtPaceMi and _clkMS lifted
// beside them and a document stub that keeps #doseDerived. The dose is a 60 mile run with a 10:00/mi target, so the
// minutes typed equal the seconds per mile exactly; that is a numeric convenience, not a coaching claim.
//
// Oracles: a hand table typed from the ruling; a sweep that decodes the printed m:ss back to seconds (min * 60 + sec,
// the inverse written here); the copy rule from CLAUDE.md. None asks the app what the answer should be.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APP, appFunction } from '../support/app.ts';

const TGT = 600; // 10:00/mi
const DOSE = { k: 'dist', mi: 60, tgt: TGT };

const _clkMS = appFunction('_clkMS');
const _fmtPaceMi = appFunction('_fmtPaceMi', { _clkMS });
const _parseClock = appFunction('_parseClock');
const doseDerived = appFunction('doseDerived', { _parseClock, _fmtPaceMi });

const els: Record<string, { id: string; value: string; innerHTML: string }> = {};
const document = { getElementById: (id: string) => els[id] || (els[id] = { id, value: '', innerHTML: '' }) };
const updateDoseDerived = appFunction('updateDoseDerived', { document, doseDerived, _curLogDose: DOSE });

/** The note under the derived pace for a run of `actSec` seconds per mile against the 10:00 target, or null. */
function noteFor(actSec: number) {
  for (const k of Object.keys(els)) delete els[k];
  document.getElementById('log_run_mins').value = String(actSec);
  document.getElementById('log_run_dist').value = '60';
  document.getElementById('log_run_reps').value = '';
  document.getElementById('log_run_rep_time').value = '';
  updateDoseDerived();
  const m = String(els.doseDerived.innerHTML).match(/<small>([\s\S]*?)<\/small>/);
  return m ? m[1] : null;
}

test('the gap reads as the hand table says, seconds under a minute and m:ss from a minute', () => {
  // [actual - target in s/mi, the note]
  const TABLE: [number, string][] = [
    [0, 'on target'],
    [+4, 'on target'],
    [-4, 'on target'],
    [+5, '5s/mi slower than target'],
    [-5, '5s/mi faster than target'],
    [-43, '43s/mi faster than target'],
    [+59, '59s/mi slower than target'],
    [-59, '59s/mi faster than target'],
    [+60, '1:00/mi slower than target'],
    [-60, '1:00/mi faster than target'],
    [-73, '1:13/mi faster than target'], // the reported case
    [+73, '1:13/mi slower than target'],
    [+69, '1:09/mi slower than target'], // single-digit seconds pad
    [+120, '2:00/mi slower than target'],
    [+125, '2:05/mi slower than target'],
    [-125, '2:05/mi faster than target'],
  ];
  for (const [df, want] of TABLE) assert.equal(noteFor(TGT + df), want, `gap ${df}`);
});

test('every gap from 0 to 300 s/mi prints its band\'s shape and decodes back to the gap', () => {
  for (let ad = 0; ad <= 300; ad++) {
    for (const sign of [-1, +1]) {
      if (ad === 0 && sign === +1) continue;
      const got = noteFor(TGT + sign * ad) || '';
      if (ad < 5) {
        assert.equal(got, 'on target', `gap ${sign * ad}`);
        continue;
      }
      if (ad < 60) {
        const m = got.match(/^(\d+)s\/mi (faster|slower) than target$/);
        assert.ok(m, `gap ${sign * ad} prints seconds: ${got}`);
        assert.equal(+m[1], ad, `gap ${sign * ad} decodes back`);
      } else {
        const m = got.match(/^(\d+):(\d{2})\/mi (faster|slower) than target$/);
        assert.ok(m, `gap ${sign * ad} prints m:ss with two-digit seconds: ${got}`);
        assert.ok(+m[2] <= 59, `gap ${sign * ad} seconds under 60: ${got}`);
        assert.equal(+m[1] * 60 + +m[2], ad, `gap ${sign * ad} decodes back`);
      }
    }
  }
});

test('no gap of a minute or more prints a raw second count', () => {
  for (let ad = 60; ad <= 300; ad += 7) {
    const got = noteFor(TGT + ad) || '';
    assert.doesNotMatch(got, /\d+s\/mi/, `gap +${ad}: ${got}`);
  }
});

test('fewer seconds per mile reads faster, more reads slower, whatever the size', () => {
  for (let ad = 5; ad <= 300; ad += 11) {
    assert.match(noteFor(TGT - ad) || '', / faster than target$/, `gap -${ad}`);
    assert.match(noteFor(TGT + ad) || '', / slower than target$/, `gap +${ad}`);
  }
});

test('the gap copy has no mid-sentence hyphen, no em-dash and no brand', () => {
  for (const ad of [0, 4, 5, 43, 59, 60, 73, 125, 605]) {
    for (const s of [-1, +1]) {
      const got = noteFor(TGT + s * ad) || '';
      assert.doesNotMatch(got, /\S[-—]\S/, got);
      assert.doesNotMatch(got, /—/, got);
      assert.doesNotMatch(got, /nike/i, got);
    }
  }
});

// Source reads: whole-line // comments and /* */ blocks stripped, the rest of the file as shipped.
const SRC = fs.readFileSync(APP, 'utf8').replace(/(^|\n)\s*\/\/[^\n]*/g, '$1').replace(/\/\*[\s\S]*?\*\//g, '');

test('exactly one place in the app writes the pace gap', () => {
  assert.equal((SRC.match(/faster than target/g) || []).length, 1, 'faster than target');
  assert.equal((SRC.match(/slower than target/g) || []).length, 1, 'slower than target');
});

test('the benchmark retest strip keeps its own sec/mi wording', () => {
  // D40 ruled the logged-run gap only; the retest strip's "N sec/mi FASTER at the same effort" was not part of it.
  assert.equal((SRC.match(/sec\/mi FASTER at the same effort/g) || []).length, 1);
});

test('the gap is display only: doseDerived returns the pace, the target and the seconds, never the gap', () => {
  const d = doseDerived({ k: 'dist', mi: 60, tgt: 600 }, { mins: '673', dist: '60' });
  assert.equal(d.pace, '11:13/mi');
  assert.equal(d.tgt, 600);
  assert.equal(Math.round(d.sec), 673);
  assert.ok(!Object.values(d).some((v) => /than target/.test(String(v))), JSON.stringify(d));
});
