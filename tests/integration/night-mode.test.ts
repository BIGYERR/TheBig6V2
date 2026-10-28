// Night mode, the setting (D261, docs/decisions/night-mode.md): the look is Auto, Day or Night. Auto is no ia_theme key
// and no data-theme on <html> (the phone decides, in CSS); Day and Night are stored and set data-theme from boot. The
// Bugs page offers the three under the bug report (D261 Amendment 1). The palettes themselves are tests/unit/night-mode.test.ts.
//
// The app boots in the VM harness. A stored choice is written into the VM's localStorage before the app's script runs,
// by the same one-call hook tests/support/app.ts uses for its document. Oracles are the ruling's words: the key, its
// two values, the attribute, the copy.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { describe, test } from 'vitest';
import { loadApp, REPO } from '../support/app.ts';
import type { App } from '../support/app.ts';

/** Boots the app with `ia_theme` already stored as `stored` (null: nothing stored). */
function bootWith(stored: string | null): App {
  const orig = vm.runInContext;
  vm.runInContext = function (code: string, ctx: vm.Context, o?: vm.RunningCodeOptions | string) {
    if (typeof code === 'string' && code.includes('globalThis.__IA')) {
      vm.runInContext = orig;
      if (stored !== null) ctx['localStorage'].setItem('ia_theme', stored);
    }
    return orig.call(vm, code, ctx, o);
  } as typeof vm.runInContext;
  try {
    return loadApp();
  } finally {
    vm.runInContext = orig;
  }
}
const themeOf = (I: App) => I.window['document'].documentElement.getAttribute('data-theme');

describe('the look', () => {
  test('a stored Night or Day is on the page from boot, and anything else boots on Auto', () => {
    assert.equal(themeOf(bootWith('night')), 'night');
    assert.equal(themeOf(bootWith('day')), 'day');
    assert.equal(themeOf(bootWith('dusk')), null);
    const fresh = bootWith(null);
    assert.equal(themeOf(fresh), null);
    assert.equal(fresh.localStorage.getItem('ia_theme'), null);
  });

  test('picking Night or Day stores it and sets the page; picking Auto clears both', () => {
    const I = bootWith(null);
    I.eval("setTheme('night')");
    assert.equal(I.localStorage.getItem('ia_theme'), 'night');
    assert.equal(themeOf(I), 'night');
    I.eval("setTheme('day')");
    assert.equal(I.localStorage.getItem('ia_theme'), 'day');
    assert.equal(themeOf(I), 'day');
    I.eval("setTheme('auto')");
    assert.equal(I.localStorage.getItem('ia_theme'), null);
    assert.equal(themeOf(I), null);
  });

  test('the Bugs page offers Auto, Day and Night under the bug report, with its caption, and the home screen does not', () => {
    const html = loadApp().html;
    const home = html.slice(html.indexOf('<div class="screen active" id="screenHome">'), html.indexOf('id="screenWizard"'));
    assert.ok(!home.includes('look-'), 'no Look row on the home screen');
    const bugs = html.slice(html.indexOf('<div class="screen" id="screenBugs">'), html.indexOf('<!-- BOTTOM TAB BAR -->'));
    const row = bugs.slice(bugs.indexOf('Your device and app context is attached'), bugs.indexOf('id="bugVersion"'));
    assert.match(row, /<div class="look-lbl">Look<\/div>/);
    for (const [look, label] of [['auto', 'Auto'], ['day', 'Day'], ['night', 'Night']]) {
      assert.ok(row.includes(`<button class="look-opt" data-look="${look}" onclick="setTheme('${look}')">${label}</button>`), `the ${label} option`);
    }
    assert.ok(row.includes('<div class="look-note">Auto follows your phone.</div>'));
  });

  // The native app draws the Bugs page from its own Angular component; this reads its source in the working tree, so
  // IA_APP does not change what it sees.
  test("the native app's Bugs page offers the same three, each through the bridge's setTheme", () => {
    const src = readFileSync(join(REPO, 'frontends/app/src/app/screens/bug-report/bug-report.ts'), 'utf8');
    const row = src.slice(src.indexOf('Your device and app context is attached'), src.indexOf('id="bugVersion"'));
    for (const [look, label] of [['auto', 'Auto'], ['day', 'Day'], ['night', 'Night']]) {
      assert.ok(row.includes(`<button class="look-opt" data-look="${look}" (click)="pickLook('${look}')">${label}</button>`), `the ${label} option`);
    }
    assert.ok(row.includes('<div class="look-note">Auto follows your phone.</div>'));
    assert.match(src, /pickLook\(look: 'auto' \| 'day' \| 'night'\): void \{\n\s*this\.bridge\.call\('setTheme', look\);/);
  });
});

describe('colours as tokens', () => {
  test("today's cell keeps its dark type on each sport now the codes carry tokens", () => {
    const I = loadApp();
    const code = (day: unknown) => I.eval('dayCode')(day) as { topColor: string; botColor: string };
    const run = code({ title: 'Easy', sections: [], cardio: { type: 'run', subtype: 'Easy Run' } });
    const lift = code({ title: 'Posterior Chain', sections: [{ items: [{ name: 'Barbell row' }] }], cardio: { type: 'bike' } });
    const rest = code({ rest: true });
    assert.deepEqual([run.topColor, lift.topColor, lift.botColor, rest.botColor], ['var(--run)', 'var(--bike)', 'var(--lift)', 'var(--dim)']);
    const onGold = I.eval('_onGold') as (c: string) => string;
    assert.deepEqual([run.topColor, lift.topColor, lift.botColor, rest.botColor].map(onGold), ['#1c5f2c', '#0a3a66', '#7a3410', '#3a2c08']);
  });
});
