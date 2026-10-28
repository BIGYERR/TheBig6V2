// Night mode, the palettes (D261, docs/decisions/night-mode.md): the stylesheet of the page under test carries the day
// palette, the night palette the ruling typed, and the same night palette again for Auto on a dark phone; and no colour
// is written anywhere else except the few that are the same in both looks.
//
// Oracles are the ruling's tables, typed here by hand. The page's <style> is read as text; nothing in the app runs.
// The last test reads the Angular screens' sources in the working tree (the native app's), not the page under test,
// so IA_APP does not change what it sees.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { APP, REPO } from '../support/app.ts';

const HTML = readFileSync(APP, 'utf8');
const CSS = (HTML.match(/<style[^>]*>([\s\S]*?)<\/style>/) || ['', ''])[1] ?? '';

const AUTO_OPEN = '@media (prefers-color-scheme: dark) {\n:root:not([data-theme="day"]){';
const NIGHT_OPEN = ':root[data-theme="night"]{';

/** The declarations of the first block opened by `open` (its text up to the first closing brace), as name -> value. */
function block(open: string): Map<string, string> {
  const at = CSS.indexOf(open);
  assert.notEqual(at, -1, `the stylesheet opens ${JSON.stringify(open)}`);
  const body = CSS.slice(at + open.length, CSS.indexOf('}', at + open.length));
  const out = new Map<string, string>();
  for (const decl of body.replace(/\/\*[\s\S]*?\*\//g, '').split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    out.set(decl.slice(0, i).trim(), decl.slice(i + 1).trim());
  }
  return out;
}
const norm = (v: string) => v.replace(/\s+/g, '').toLowerCase();

function assertHolds(decls: Map<string, string>, want: Record<string, string>, where: string) {
  for (const [name, value] of Object.entries(want)) {
    assert.equal(norm(decls.get(name) ?? '(missing)'), norm(value), `${where} ${name}`);
  }
}

// The ruling's table, day column, and the tokens it adds (D261 items 2 to 4).
const DAY: Record<string, string> = {
  '--bg': '#F4F1E8', '--surface': '#FBFAF5', '--surface2': '#ECE7DA', '--surface3': '#E0DACA',
  '--border': '#D5CEBD', '--border2': '#BCB29B', '--text': '#181712', '--muted': '#6B6557', '--accent': '#181712',
  '--on-ink': '#F4F1E8', '--signal': '#CF4E1A', '--signal-press': '#AE3F12', '--on-signal': '#FBF6EE',
  '--run': '#5e8c54', '--green': '#5e8c54', '--bike': '#3f6e96', '--swim': '#3f6e96', '--lift': '#bc6a43',
  '--hip': '#7e5e96', '--core': '#a6822f', '--red': '#9e3328',
  '--band-header': '#161618', '--band': '#181712', '--on-band': '#F4F1E8', '--dim': '#5F5F62', '--mark': '#7D7668',
};
// The ruling's table, night column; each -dim keeps its 0.15 alpha over its colour's night value.
const NIGHT: Record<string, string> = {
  'color-scheme': 'dark',
  '--bg': '#12110D', '--surface': '#1B1A15', '--surface2': '#24221C', '--surface3': '#2E2B23',
  '--border': '#38342B', '--border2': '#514B3E', '--text': '#ECE7DA', '--muted': '#9C9584', '--accent': '#E4DFD2',
  '--on-ink': '#12110D', '--signal': '#E2622B', '--signal-press': '#C4501E', '--on-signal': '#12110D',
  '--run': '#86B27A', '--green': '#86B27A', '--bike': '#7FA6C9', '--swim': '#7FA6C9', '--lift': '#D98A63',
  '--hip': '#AB8CC4', '--core': '#CFA752', '--red': '#D9665A',
  '--run-dim': 'rgba(134,178,122,0.15)', '--bike-dim': 'rgba(127,166,201,0.15)', '--swim-dim': 'rgba(127,166,201,0.15)',
  '--lift-dim': 'rgba(217,138,99,0.15)', '--hip-dim': 'rgba(171,140,196,0.15)', '--core-dim': 'rgba(207,167,82,0.15)',
  '--band-header': '#211F1A', '--band': '#24221C', '--on-band': '#ECE7DA', '--dim': '#837D6F', '--mark': '#7A7467',
};

/** '#5e8c54' -> '94,140,84' */
function channels(hex: string): string {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
}

describe('night mode palettes', () => {
  test('the day palette keeps every colour it had and adds the band and grey tokens at their day values', () => {
    assertHolds(block(':root{'), DAY, 'day');
  });

  test('the night palette holds the values the ruling typed', () => {
    assertHolds(block(NIGHT_OPEN), NIGHT, 'night');
  });

  test('Auto on a dark phone gets the same night palette, unless the athlete chose Day', () => {
    const auto = block(AUTO_OPEN);
    const night = block(NIGHT_OPEN);
    assert.deepEqual([...auto.entries()].map(([k, v]) => k + ':' + norm(v)), [...night.entries()].map(([k, v]) => k + ':' + norm(v)));
    assertHolds(auto, NIGHT, 'auto');
  });

  test('a tint carries the channels of the colour it tints, in both palettes', () => {
    // ink tints flip to bone at night, the band's tints are its type, the sport and signal tints their colour
    const pairs: [string, string][] = [
      ['--ink-rgb', '--text'], ['--on-band-rgb', '--on-band'], ['--signal-rgb', '--signal'],
      ['--on-signal-rgb', '--on-signal'], ['--muted-rgb', '--muted'], ['--mark-rgb', '--mark'],
      ['--run-rgb', '--run'], ['--bike-rgb', '--bike'], ['--swim-rgb', '--swim'], ['--lift-rgb', '--lift'],
      ['--hip-rgb', '--hip'], ['--core-rgb', '--core'], ['--red-rgb', '--red'],
    ];
    for (const [where, decls] of [['day', block(':root{')], ['night', block(NIGHT_OPEN)]] as const) {
      for (const [tint, colour] of pairs) {
        assert.equal(norm(decls.get(tint) ?? '(missing)'), channels(decls.get(colour) ?? '#000000'), `${where} ${tint}`);
      }
    }
    // scrims and shadows stay dark at night
    assert.equal(norm(block(NIGHT_OPEN).get('--scrim-rgb') ?? ''), '0,0,0');
    assert.equal(norm(block(NIGHT_OPEN).get('--shadow-rgb') ?? ''), '0,0,0');
  });
});

// The colours that are the same in both looks, so stay written as they are (D261 item 4 and its Amendment 1).
const SAME_IN_BOTH = new Set([
  '#0a0a0a', // type on a coloured fill (toast, counters, the RPE close)
  '#fff', // the toggle's knob
  'rgba(255,69,58,0.35)', // the danger button's line
  '#f0a050', // the cycling chart's orange
  '#006bb6', '#f58426', '#bec0c2', // the Knicks pop-up colours
  '#1c5f2c', '#0a3a66', '#7a3410', '#3a2c08', '#7a4d00', // type on today's signal cell
]);
const LITERAL = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}(?![0-9A-Za-z])|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[0-9.]+\s*)?\)/g;
const sameInBoth = (lit: string) => SAME_IN_BOTH.has(norm(lit)) || /^rgba\(0,0,0,[0-9.]+\)$/.test(norm(lit));

function strayLiterals(text: string): string[] {
  return [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(LITERAL)].map((m) => m[0]).filter((lit) => !sameInBoth(lit));
}

describe('one home for every colour', () => {
  test('the page writes no colour outside its palettes but the ones that are the same in both looks', () => {
    const palettes = [':root{', AUTO_OPEN, NIGHT_OPEN].map((open) => {
      const at = CSS.indexOf(open);
      return at < 0 ? '' : CSS.slice(at, CSS.indexOf('}', at + open.length) + 1);
    });
    let rest = HTML;
    for (const p of palettes) if (p) rest = rest.replace(p, '');
    // the theme-color meta starts on the day paper; applyTheme rewrites it from the resolved --bg
    rest = rest.replace(/<meta name="theme-color" content="#F4F1E8">/, '');
    assert.deepEqual(strayLiterals(rest), []);
  });

  test("the native app's screens write no colour but the ones that are the same in both looks", () => {
    const root = join(REPO, 'frontends', 'app', 'src', 'app');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|html|css)$/.test(name) && !name.endsWith('.spec.ts')) files.push(p);
      }
    };
    walk(root);
    assert.ok(files.length > 20, `read the Angular screens (${files.length} files)`);
    const found = files.flatMap((f) => strayLiterals(readFileSync(f, 'utf8')).map((lit) => `${f.slice(root.length + 1)}: ${lit}`));
    assert.deepEqual(found, []);
  });
});
