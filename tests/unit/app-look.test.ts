// The Track look (D263, docs/decisions/app-look.md): no label set in capitals by a style, the glow behind the tab screens
// and under the main buttons, the floating tab bar, round shapes in place of outlines, and today's date as an ink ring.
// The palettes themselves are tests/unit/night-mode.test.ts; the labels as rendered are tests/integration/app-look.test.ts.
//
// Oracles are the ruling's words and values, typed here by hand. The page's <style> is read as text and nothing in the app
// runs. The capitals scan also reads the native app's Angular screens in the working tree, so IA_APP does not change
// what that one test sees there.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { APP, REPO } from '../support/app.ts';

const HTML = readFileSync(APP, 'utf8');
const CSS = ((HTML.match(/<style[^>]*>([\s\S]*?)<\/style>/) || ['', ''])[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
const norm = (v: string) => v.replace(/\s+/g, '').toLowerCase();

/** Every rule of the stylesheet outside @media, as [selector, declarations by name]. */
function rules(): [string, Map<string, string>][] {
  const out: [string, Map<string, string>][] = [];
  for (const m of CSS.replace(/@media[^{]*\{([^{}]*\{[^{}]*\})*[^{}]*\}/g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = new Map<string, string>();
    for (const d of (m[2] ?? '').split(';')) {
      const i = d.indexOf(':');
      if (i > 0) decls.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
    }
    out.push([(m[1] ?? '').trim().replace(/\s+/g, ' '), decls]);
  }
  return out;
}
const RULES = rules();
/** The declarations of the last rule whose selector list is exactly `sel`. */
const ruleOf = (sel: string): Map<string, string> => {
  const hit = RULES.filter(([s]) => s === sel).pop();
  assert.ok(hit, 'a rule for ' + sel);
  return hit[1];
};
/** The declarations of the first block opened by `open`. */
function block(open: string): Map<string, string> {
  const at = CSS.indexOf(open);
  assert.notEqual(at, -1, open);
  const body = CSS.slice(at + open.length, CSS.indexOf('}', at + open.length));
  const out = new Map<string, string>();
  for (const d of body.split(';')) {
    const i = d.indexOf(':');
    if (i > 0) out.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
  }
  return out;
}

/** Every .ts and .html file of the native app's screens. */
function nativeSources(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|html)$/.test(name) && !name.endsWith('.spec.ts')) files.push(p);
    }
  };
  walk(join(REPO, 'frontends', 'app', 'src', 'app', 'screens'));
  return files;
}
const CAPS = /text-transform:\s*uppercase/;
const TRACKED = /letter-spacing:\s*(?:0?\.\d*[1-9]\d*em|\d*\.?\d*[1-9]\d*px)/;

describe('sentence case', () => {
  test('no style in the page sets a label in capitals or spreads its letters', () => {
    assert.deepEqual(HTML.match(new RegExp(CAPS.source, 'g')) || [], []);
    assert.deepEqual(HTML.match(new RegExp(TRACKED.source, 'g')) || [], []);
  });

  test("no style in the native app's screens does either", () => {
    const bad = nativeSources().filter((f) => {
      const s = readFileSync(f, 'utf8');
      return CAPS.test(s) || TRACKED.test(s);
    });
    assert.deepEqual(bad, []);
  });

  test('no text between tags is written in capitals in either build, but acronyms and the session codes', () => {
    // The ruling's exceptions, typed by hand: acronyms, and the codes printed under each day of the strip.
    const KEEP = new Set(['RPE', 'AMRAP', 'EMOM', 'NRC', 'NSW', 'FTP', 'OHP', 'RDL', 'GPS', 'PR', 'HR', 'RUN', 'LIFT', 'REST']);
    const capitals = (text: string): string[] => [...text.matchAll(/>\s*([A-Z][A-Z0-9 ?!.,’'-]{1,30}?)\s*</g)]
      .map((m) => (m[1] ?? '').trim())
      .filter((t) => (t.match(/[A-Z]{2,}/g) || []).some((w) => !KEEP.has(w)));
    assert.deepEqual(capitals(HTML), [], 'the page');
    assert.deepEqual(nativeSources().flatMap((f) => capitals(readFileSync(f, 'utf8')).map((t) => f.split('/screens/')[1] + ': ' + t)), [], 'the native screens');
  });

  test('the wordmark over Your Programs, Progress and Bugs reads The Asylum in both builds', () => {
    assert.equal((HTML.match(/<div class="app-title">The <span>Asylum<\/span><\/div>/g) || []).length, 3, 'the page');
    for (const frame of ['frames/home-screen.ts', 'frames/progress-frame.ts', 'bug-report/bug-report.ts']) {
      const src = readFileSync(join(REPO, 'frontends', 'app', 'src', 'app', 'screens', frame), 'utf8');
      assert.ok(src.includes('<div class="app-title">The <span>Asylum</span></div>'), frame);
    }
  });

  test('the day strip keeps the short day name in its markup and shows its first letter', () => {
    assert.equal(ruleOf('.wk-day-lbl').get('font-size'), '0');
    assert.equal(ruleOf('.wk-day-lbl::first-letter').get('font-size'), '14px');
  });
});

describe('the glow', () => {
  test('the glow is signal at 0.26 by day and at 0.64 at night, and Auto on a dark phone matches Night', () => {
    assert.equal(norm(block(':root{').get('--glow') ?? ''), 'rgba(var(--signal-rgb),0.26)');
    assert.equal(norm(block(':root[data-theme="night"]{').get('--glow') ?? ''), 'rgba(var(--signal-rgb),0.64)');
    assert.equal(norm(block('@media (prefers-color-scheme: dark) {\n:root:not([data-theme="day"]){').get('--glow') ?? ''), 'rgba(var(--signal-rgb),0.64)');
  });

  test('the light is 150% wide and 455px tall, centred 130px above the top edge, gone by 68%', () => {
    const light = RULES.filter(([s, d]) => s === ':root' && d.has('--glow-light')).pop();
    assert.ok(light);
    assert.equal(norm(light[1].get('--glow-light') ?? ''), 'radial-gradient(150%455pxat50%-130px,var(--glow),transparent68%)');
  });

  test('the four tab screens and their sticky bars paint the light, and nothing else does', () => {
    const painted = RULES.filter(([, d]) => [...d.values()].some((v) => v.includes('var(--glow-light)'))).map(([s]) => s);
    assert.deepEqual(painted, [
      '#screenHome.screen,#screenWeek.screen,#screenProgress.screen,#screenBugs.screen',
      '#screenHome .top-bar,#screenProgress .top-bar,#screenBugs .top-bar,.wk-topbar',
    ]);
  });

  test('Start session, the session sheet\'s Done and the pop-up\'s main button glow, and no other rule casts a signal light', () => {
    const glowing = RULES.filter(([, d]) => /rgba\(var\(--signal-rgb\),0\.42\)/.test(norm(d.get('box-shadow') ?? ''))).map(([s]) => s);
    assert.deepEqual(glowing, ['.wk-hero-cta,.day-done,.pop-act.go']);
    assert.equal(norm(ruleOf('.wk-hero-cta,.day-done,.pop-act.go').get('box-shadow') ?? ''), '010px28pxrgba(var(--signal-rgb),0.42)');
  });
});

describe('shape', () => {
  test('the corners are 24px for a card, 16px for a tile, 12px for a field, and a pill', () => {
    const root = block(':root{');
    assert.deepEqual(['--r-card', '--r-tile', '--r-field', '--r-pill'].map((t) => root.get(t)), ['24px', '16px', '12px', '999px']);
  });

  test('the cards drop their outlines and round to the card corner', () => {
    const cards = ruleOf('.prog-card,.day-card,.summary-block,.section-block,.section-items,.export-section,.swap-cand,.swap-empty,.toggle-row,.log-section,.also-block,.e1rm,.swap-nudge-card');
    assert.deepEqual([cards.get('border-color'), cards.get('border-radius')], ['transparent', 'var(--r-card)']);
    for (const sel of ['.wk-strip', '.wk-hero', '.wk-stats']) assert.equal(ruleOf(sel).get('border-radius'), 'var(--r-card)', sel);
  });

  test("the hero's button, the week's actions and the program buttons are pills", () => {
    assert.equal(ruleOf('.wk-hero-cta').get('border-radius'), 'var(--r-pill)');
    assert.equal(ruleOf('.random-btn,.change-btn').get('border-radius'), 'var(--r-pill)');
    const pills = RULES.filter(([, d]) => d.get('border-radius') === 'var(--r-pill)').map(([s]) => s).join(',').split(',');
    for (const sel of ['.day-done', '.day-skip', '.new-prog-btn', '.prog-action-btn', '.wizard-next', '.ex-logbtn', '.toast']) {
      assert.ok(pills.includes(sel), sel);
    }
  });

  test("today's date is an ink ring, and no rule paints today's cell signal or turns its marks on-signal", () => {
    const today = ruleOf('.wk-day.today .wk-day-num');
    assert.deepEqual([today.get('background'), norm(today.get('box-shadow') ?? ''), today.get('color')], ['transparent', 'inset0002pxvar(--text)', 'var(--text)']);
    const signalled = RULES.filter(([s, d]) => /\.wk-day\.today/.test(s) && [...d.values()].some((v) => /var\(--(signal|on-signal)\)/.test(v)));
    assert.deepEqual(signalled.map(([s]) => s), []);
  });

  test('the week tabs are underlined in signal, not boxed', () => {
    const active = ruleOf('.week-btn.active');
    assert.deepEqual([active.get('background'), active.get('border-bottom-color')], ['transparent', 'var(--signal)']);
  });
});

describe('the floating tab bar', () => {
  test('the bar sits 12px in from each side, a 34px pill over a blurred fill, above the home indicator', () => {
    const bar = ruleOf('.tabbar');
    assert.deepEqual(
      ['left', 'right', 'border-radius', 'background', 'backdrop-filter', 'bottom'].map((p) => bar.get(p)),
      ['12px', '12px', '34px', 'var(--nav)', 'blur(20px)', 'max(12px,env(safe-area-inset-bottom,0px))'],
    );
    assert.equal(ruleOf('.tabbar button.active').get('color'), 'var(--signal)');
  });

  test('the screens and the toast leave room for it', () => {
    assert.equal(ruleOf('.screen.with-tabbar').get('padding-bottom'), 'calc(96px + env(safe-area-inset-bottom,0px))');
    assert.equal(ruleOf('.toast').get('bottom'), 'calc(96px + env(safe-area-inset-bottom,0px))');
  });
});
