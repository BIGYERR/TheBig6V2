import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { BOOT_LINE, innerOf, render, split, withoutBoot } from '../../scripts/sync-legacy.mjs';

/**
 * The smallest page with every piece the split expects: a rest sheet whose markup the Angular shell takes (nested, to
 * prove its divs are counted) and a script ending on the page's boot line. The script holds a "</div>" to prove only
 * "</script>" ends it.
 */
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="ia-version" content="7">
<title>T</title>
<style>body{color:red}</style>
</head>
<body>
<div id="a" onclick="go()">A</div>
<div class="rand-overlay" id="restOverlay"><div class="x"><div>in</div></div><span onclick="r()">s</span></div>
<script>function go(){ return '</div>'; }
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}</script>
<div id="b">B</div>
</body>
</html>
`;

const swap = (from: string, to: string) => {
  assert.equal(PAGE.split(from).length, 2, `fixture holds "${from}" once`);
  return PAGE.replace(from, to);
};

describe('sync-legacy split', () => {
  const parts = split(PAGE);

  it('takes the style, the script and the version out whole', () => {
    assert.equal(parts.css, 'body{color:red}');
    assert.equal(parts.js, "function go(){ return '</div>'; }\n" + BOOT_LINE);
    assert.equal(parts.version, '7');
  });

  it('takes a dotted ia-version out as written: 0.239.1', () => {
    assert.equal(split(swap('content="7"', 'content="0.239.1"')).version, '0.239.1');
  });

  it('keeps the body markup from both sides of the script, in order', () => {
    assert.equal(parts.markup, '\n<div id="a" onclick="go()">A</div>\n<div class="rand-overlay" id="restOverlay"><div class="x"><div>in</div></div><span onclick="r()">s</span></div>\n\n<div id="b">B</div>\n');
  });

  it('keeps every other head tag and drops the style block from it', () => {
    assert.ok(parts.headRest.includes('<meta name="ia-version" content="7">'));
    assert.ok(parts.headRest.includes('<title>T</title>'));
    assert.ok(!parts.headRest.includes('<style'));
  });

  for (const [what, page, error] of [
    ['a second style block', swap('</style>', '</style><style>p{}</style>'), /exactly one <style>/],
    ['a script in the head', swap('<title>T</title>', '<title>T</title><script></script>'), /<script> in <head>/],
    ['attributes on <body>', swap('<body>', '<body class="x">'), /<body> tag carries attributes/],
    ['a module script', swap('<script>', '<script type="module">'), /plain inline <script>/],
    ['a second body script', swap('<div id="b">B</div>', '<div id="b">B</div><script>x()</script>'), /second <script>/],
    ['no ia-version', swap('<meta name="ia-version" content="7">', ''), /no <meta name="ia-version">/],
    ['an ia-version that is not a version', swap('content="7"', 'content="0.239"'), /holds "0\.239", which is not a version/],
    ['no </head>', swap('</head>', ''), /no <\/head>/],
  ] as const) {
    it(`fails loudly on ${what}`, () => {
      assert.throws(() => split(page), error);
    });
  }
});

describe('sync-legacy render', () => {
  const files = render(PAGE);
  const byName = (suffix: string): string => {
    const hits = Object.entries(files).filter(([path]) => path.endsWith(suffix));
    assert.equal(hits.length, 1, `exactly one output ends with ${suffix}`);
    return hits[0]![1];
  };
  const sha = createHash('sha256').update(PAGE).digest('hex');

  it('writes the five generated files', () => {
    assert.equal(Object.keys(files).length, 5);
  });

  it('passes the script through byte for byte but its boot line, which the Angular shell runs itself', () => {
    assert.equal(byName('/public/legacy/app.js'), "function go(){ return '</div>'; }\n");
  });

  it('takes the rest sheet\'s markup, its nested divs counted, as the one legacy markup the shell writes in', () => {
    assert.ok(byName('/legacy-markup.ts').includes('export const LEGACY_REST_OVERLAY = "<div class=\\"x\\"><div>in</div></div><span onclick=\\"r()\\">s</span>";'));
    assert.ok(!byName('/legacy-markup.ts').includes('LEGACY_MARKUP'));
  });

  it('refuses a script whose boot line is missing, doubled or not last, and a rest sheet that is missing, doubled or open', () => {
    assert.throws(() => withoutBoot('init();'), /boot line occurs 0 times/);
    assert.throws(() => withoutBoot(BOOT_LINE + BOOT_LINE), /boot line occurs 2 times/);
    assert.throws(() => withoutBoot(BOOT_LINE + '\nmore();'), /not the script's last line/);
    assert.equal(withoutBoot('a();\n' + BOOT_LINE + '\n'), 'a();\n\n');
    const open = '<div id="r">';
    assert.throws(() => innerOf('<p></p>', open), /occurs 0 times/);
    assert.throws(() => innerOf(open + '</div>' + open + '</div>', open), /occurs 2 times/);
    assert.throws(() => innerOf(open + '<div>', open), /never closes/);
    assert.equal(innerOf('x' + open + '<div><div></div></div>y</div>z', open), '<div><div></div></div>y');
  });

  it('stamps the version and the source sha256 on the markup module and the manifest', () => {
    const ts = byName('/legacy-markup.ts');
    assert.ok(ts.includes('export const LEGACY_VERSION = "7";'));
    assert.ok(ts.includes(`export const LEGACY_SHA256 = "${sha}";`));
    assert.ok(ts.includes(`legacy/legacy.js?v=7-${sha.slice(0, 12)}`));
    assert.deepEqual(JSON.parse(byName('/legacy-manifest.json')), { version: '7', sha256: sha });
  });

  it('stamps a dotted ia-version as written: 0.239.1 on the module, the script URL, the manifest and the banner', () => {
    const page = swap('content="7"', 'content="0.239.1"');
    const dotted = Object.entries(render(page));
    const pick = (suffix: string): string => dotted.find(([path]) => path.endsWith(suffix))![1];
    const s = createHash('sha256').update(page).digest('hex');
    assert.ok(pick('/legacy-markup.ts').includes('export const LEGACY_VERSION = "0.239.1";'));
    assert.ok(pick('/legacy-markup.ts').includes(`legacy/legacy.js?v=0.239.1-${s.slice(0, 12)}`));
    assert.deepEqual(JSON.parse(pick('/legacy-manifest.json')), { version: '0.239.1', sha256: s });
    assert.ok(pick('/generated/index.html').includes(`(ia-version 0.239.1, sha256 ${s})`));
  });

  it("makes Angular's index page from the head, with ia-root as the body", () => {
    const index = byName('/generated/index.html');
    assert.ok(index.includes('<base href="/">'));
    assert.ok(index.includes('<meta name="ia-version" content="7">'));
    assert.ok(index.includes('<ia-root></ia-root>'));
    assert.ok(!index.includes('<style'));
  });

  it('keeps the stylesheet whole under a generated banner', () => {
    assert.match(byName('/legacy.css'), /^\/\* GENERATED by scripts\/sync-legacy\.mjs .*\*\/\nbody\{color:red\}$/);
  });
});
