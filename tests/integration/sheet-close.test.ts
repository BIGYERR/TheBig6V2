// A sheet that is not open takes no touch (v0.240.0, ruling D230 P-SHEETCLOSE, docs/decisions/rest-sheet.md). Every
// sheet slides out over 360 ms after its close function removes `open`, and before this rule it stayed hit-testable
// for that whole window, so a second touch on a closing sheet ran its button again (m5: a sum, a duplicate overlay, a
// toggled status, a rewritten mile). The rule is on the sheet, in the stylesheet: the closed state of `.overlay` and
// `.rand-overlay` takes no pointer events, and `.open` gives them back. `pointer-events` is not in the transition, so
// it switches the moment `open` is removed. The expected rules and the list of the nine sheets are typed here by hand.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APP } from '../support/app.ts';

const PAGE = fs.readFileSync(APP, 'utf8');
const CSS = (PAGE.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
/** The declarations of the first rule whose selector is exactly `sel`. */
const rule = (sel: string) => {
  const at = CSS.indexOf(sel + '{');
  assert.ok(at >= 0, 'a rule for ' + sel);
  return CSS.slice(at + sel.length + 1, CSS.indexOf('}', at));
};
const SHEETS: [string, string][] = [
  ['detailOverlay', 'overlay'], ['swapOverlay', 'overlay'], ['addOverlay', 'overlay'],
  ['randOverlay', 'rand-overlay'], ['restOverlay', 'rand-overlay'], ['changeOverlay', 'rand-overlay'],
  ['goalOverlay', 'rand-overlay'], ['mileOverlay', 'rand-overlay'], ['mileLockOverlay', 'rand-overlay'],
];

test('a closed sheet takes no touch and an open one takes them, and the switch is not animated', () => {
  const closed = rule('.overlay,.rand-overlay');
  const open = rule('.overlay.open,.rand-overlay.open');
  assert.ok(/pointer-events:none;/.test(closed), closed);
  assert.ok(/pointer-events:auto;/.test(open), open);
  for (const decl of [closed, open]) {
    const tr = (decl.match(/transition:([^;]*);/) || [])[1] || '';
    assert.ok(tr && !tr.includes('pointer-events') && !tr.includes('all'), 'pointer-events is not transitioned: ' + tr);
  }
  // reduced motion still has no transition at all
  assert.ok(/@media \(prefers-reduced-motion: reduce\)\{[\s\S]*?\.overlay,\.rand-overlay,\.overlay\.open,\.rand-overlay\.open\{transition:none;\}/.test(CSS));
});

// A guard, true before this build too: the rule above reaches a sheet only through these two classes, so a sheet that
// left them would take touches while closing again without any rule changing.
test('each of the nine sheets is one of the two classes the rule covers', () => {
  for (const [id, cls] of SHEETS) {
    assert.ok(PAGE.includes('<div class="' + cls + '" id="' + id + '"'), id + ' carries .' + cls);
  }
  // and no sheet hands touches back to a child while closed
  const kids = [...CSS.matchAll(/([^{}]+)\{[^}]*pointer-events:auto[^}]*\}/g)].map((m) => m[1]!.trim());
  assert.deepEqual(kids.filter((s) => s !== '.overlay.open,.rand-overlay.open' && /overlay|#(detail|swap|add|rand|rest|change|goal|mile)/.test(s)), []);
});
