// Page comments (D268, docs/decisions/page-comments.md): the page ships without the source files' comments. The build
// (frontends/app/scripts/build-index.mjs, withoutComments) strips each piece's comments before the pieces are joined,
// and the script runs the same, token for token (tools/same-script.mjs is the release proof of that).
//
// Oracles: the page's inline script is parsed and must report no comment; its styles and its markup carry no comment
// syntax; the race plans' source is named nowhere in it. The strip itself is checked on text typed here by hand, so a
// line comment, a block comment between two tokens, a comment-like sequence inside a string, a regex and a template,
// and the line count, are each proved against an expected output and never against the function's own result.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, test } from 'vitest';
import { APP, REPO } from '../support/app.ts';

const require = createRequire(import.meta.url);
const { extractInlineJS } = require(join(REPO, 'tests', 'harness.js')) as { extractInlineJS: (html: string) => string };

const SCRIPTS = join(REPO, 'frontends', 'app', 'scripts');
type Comment = { type: string; value: string; start: number; end: number };
type Acorn = { parse: (text: string, opts: Record<string, unknown>) => unknown };
type Build = { withoutComments: (text: string, piece: string) => string };
const acorn = (await import(pathToFileURL(join(SCRIPTS, 'vendor', 'acorn.mjs')).href)) as Acorn;
const build = (await import(pathToFileURL(join(SCRIPTS, 'build-index.mjs')).href)) as Build;

const HTML = readFileSync(APP, 'utf8');

/** Every comment acorn finds in a script. */
function commentsOf(script: string): Comment[] {
  const out: Comment[] = [];
  acorn.parse(script, { ecmaVersion: 'latest', sourceType: 'script', onComment: out });
  return out;
}

describe('the page ships without comments', () => {
  test('its inline script parses with no comment in it', () => {
    const script = extractInlineJS(HTML);
    assert.ok(script.length > 100_000, 'the inline script was found');
    assert.equal(commentsOf(script).length, 0);
  });

  test('its styles carry no comment', () => {
    const styles = [...HTML.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1] ?? '');
    assert.ok(styles.length >= 1, 'a style block was found');
    for (const css of styles) assert.doesNotMatch(css, /\/\*/);
  });

  test('its markup outside the script carries no comment', () => {
    const markup = HTML.replace(/<script(\s[^>]*)?>[\s\S]*?<\/script>/gi, '');
    assert.doesNotMatch(markup, /<!--/);
  });

  test('the race plans are named by brand nowhere in it', () => {
    assert.doesNotMatch(HTML, /nike/i);
  });
});

describe('withoutComments', () => {
  test('a script loses its comments and keeps every token and every line', () => {
    const input = [
      '// the first line is a comment',
      'var a = 1; // trailing',
      'var b = a/*between*/+ 1;',
      "var s = '// not a comment' + \"/* nor this */\";",
      'var r = /\\/\\*not one\\*\\//g;',
      'var t = `template // keeps ${a /* inner */} this`;',
      '/* a block',
      '   over three',
      '   lines */ var c = 2;',
      '<!-- an html-like comment line',
      'var d = c;',
    ].join('\n');
    const expected = [
      '',
      'var a = 1; ',
      'var b = a + 1;',
      "var s = '// not a comment' + \"/* nor this */\";",
      'var r = /\\/\\*not one\\*\\//g;',
      'var t = `template // keeps ${a  } this`;',
      '',
      '',
      ' var c = 2;',
      '',
      'var d = c;',
    ].join('\n');
    assert.equal(build.withoutComments(input, 'js/sample.js'), expected);
    assert.equal(build.withoutComments(input, 'engine/sample.ts'), expected);
  });

  test('a script that does not parse is refused, naming the piece', () => {
    assert.throws(() => build.withoutComments('var = ;', 'js/broken.js'), /js\/broken\.js does not parse/);
  });

  test('a stylesheet loses its comments and keeps its rules', () => {
    const css = '/* header */\n.a { color: red; /* why */ }\n/* multi\nline */ .b { margin: 0 }\n';
    assert.equal(build.withoutComments(css, 'css/sample.css'), '\n.a { color: red;  }\n .b { margin: 0 }\n');
  });

  test('a stylesheet whose comment openers and closers do not pair up is refused', () => {
    assert.throws(() => build.withoutComments('.a { } /* open', 'css/odd.css'), /css\/odd\.css: 1 comment openers and 0 closers/);
  });

  test('markup loses its comments and keeps its elements', () => {
    const html = '<!-- top -->\n<div>\n  <!-- inside\n  two lines -->\n  <span>x</span>\n</div>\n';
    assert.equal(build.withoutComments(html, 'html/sample.html'), '\n<div>\n  \n  <span>x</span>\n</div>\n');
  });

  test('any other piece is returned as it is', () => {
    assert.equal(build.withoutComments('{"a": 1} // kept', 'order.json'), '{"a": 1} // kept');
  });
});
