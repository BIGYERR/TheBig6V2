// Design tokens: the website and the admin take the tokens they share from frontends/common/tokens.css, each
// stylesheet importing it first, and keep only their own tokens beside it (docs/decisions/design-tokens.md, D237
// P-SHAREDTOKENS). Where the two had drifted, the website's value won; those four values are typed here from the
// ruling, not read from either stylesheet.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'vitest';

const FRONTENDS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontends');
const read = (file: string) => readFileSync(join(FRONTENDS, file), 'utf8');

/**
 * The custom properties a sheet declares in its :root rules, comments stripped first, each with the value its first
 * :root rule gives it. A later :root rule (a media query's, such as the website's narrower --gutter) may override one.
 */
function tokens(css: string): Map<string, string> {
  const out = new Map<string, string>();
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, body] of text.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const [, name, value] of body!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      if (!out.has(name!)) out.set(name!, value!.trim());
    }
  }
  return out;
}

const shared = tokens(read('common/tokens.css'));
const sheets = { website: read('website/styles.css'), admin: read('admin/styles.css') };

describe('design tokens', () => {
  test('the four tokens that had drifted carry the website values, once, in common/tokens.css', () => {
    assert.equal(shared.get('--ink-line'), 'rgba(244, 241, 232, 0.14)');
    assert.equal(shared.get('--ink-muted'), 'rgba(244, 241, 232, 0.64)');
    assert.equal(shared.get('--font-text'), "'Helvetica Neue', Helvetica, 'Geist', 'Helvetica Now Text', Arial, sans-serif");
    assert.equal(shared.get('--font-mono'), "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace");
  });

  test('the shared palette is in common/tokens.css: bone, ink and the signal orange', () => {
    assert.equal(shared.get('--bg'), '#f4f1e8');
    assert.equal(shared.get('--text'), '#181712');
    assert.equal(shared.get('--signal'), '#cf4e1a');
  });

  test('each stylesheet imports common/tokens.css before anything else', () => {
    for (const [name, css] of Object.entries(sheets)) {
      const code = css.replace(/\/\*[\s\S]*?\*\//g, '').trim();
      assert.ok(code.startsWith("@import '../common/tokens.css';"), `${name}/styles.css starts with the import`);
    }
  });

  test('no stylesheet redeclares a shared token, and no token is declared in both stylesheets', () => {
    const own = Object.fromEntries(Object.entries(sheets).map(([name, css]) => [name, tokens(css)]));
    for (const [name, mine] of Object.entries(own)) {
      const shadowed = [...mine.keys()].filter((k) => shared.has(k));
      assert.deepEqual(shadowed, [], `${name}/styles.css redeclares shared tokens`);
    }
    const both = [...own['website']!.keys()].filter((k) => own['admin']!.has(k));
    assert.deepEqual(both, [], 'a token both frontends declare belongs in common/tokens.css, with one value');
  });
});
