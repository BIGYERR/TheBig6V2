// build-index: the page is the build of src/legacy/src/, each piece without its comments (D268; the test strips and joins
// the files itself, its own comment stripper on acorn's parse);
// writePages() writes it and its icon into the folder GitHub Pages deploys; and the check that the root index.html is
// that build names the first byte that drifts. The live sources, then fixture source folders for every way the list can
// be wrong.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import * as acorn from '../../scripts/vendor/acorn.mjs';
import { buildIndex, checkIndex, collapseTypes, firstDifference, ICON, PAGES_DIR, readOrder, SOURCES, TARGET, writePages } from '../../scripts/build-index.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIVE_SOURCES = join(APP, 'src', 'legacy', 'src');
const LIVE_PAGE = join(APP, '..', '..', 'index.html');
const REPO = join(APP, '..', '..');
const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex');
/**
 * A JS source file as the page carries it: without its module blocks (architecture phase C), cut at the two marker lines
 * typed here by hand, not taken from build-index.mjs, so the test stays independent of the build.
 */
const IMPORTS_END = '// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)\n';
const EXPORTS_START = '\n// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)\n';
function classic(text: string): string {
  const i = text.indexOf(IMPORTS_END);
  const j = text.indexOf(EXPORTS_START);
  return text.slice(i === -1 ? 0 : i + IMPORTS_END.length, j === -1 ? text.length : j);
}
/** The engine's TypeScript (architecture phase D): order.json's engine/<name>.ts is core/src/engine/<name>.ts. */
const LIVE_ENGINE = join(REPO, 'core', 'src', 'engine');
/**
 * A TypeScript file as the page carries it: Node's own stripper, called here, then the build's collapse of the blanks,
 * then without the lines tools/ts-expect.mjs writes above a check the code cannot meet yet (`// @ts-expect-error TS<n> `,
 * the form typed here by hand), which go with the types.
 */
const stripped = (code: string) =>
  collapseTypes(code, stripTypeScriptTypes(code, { mode: 'strip' })).split('\n').filter((l) => !/^[ \t]*\/\/ @ts-expect-error TS\d+ /.test(l)).join('\n');
/**
 * A piece without its comments, as the page carries it (D268, docs/decisions/page-comments.md), written here by hand: a
 * script's comments by acorn's parse (a block comment leaves its line breaks, or one space; a line comment leaves its own
 * line break), a stylesheet's and a markup file's by their own syntax.
 */
function uncommented(text: string, piece: string): string {
  if (/\.(js|ts)$/.test(piece)) {
    const comments: acorn.Comment[] = [];
    acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'script', onComment: comments });
    let out = '';
    let at = 0;
    for (const c of comments) {
      out += text.slice(at, c.start) + (c.type === 'Block' ? '\n'.repeat((c.value.match(/\n/g) ?? []).length) || ' ' : '');
      at = c.end;
    }
    return out + text.slice(at);
  }
  if (piece.endsWith('.css')) return text.replace(/\/\*[\s\S]*?\*\//g, '');
  if (piece.endsWith('.html')) return text.replace(/<!--[\s\S]*?-->/g, '');
  return text;
}
const pieceOnPage = (piece: string) => {
  const text = readFileSync(piece.startsWith('engine/') ? join(LIVE_ENGINE, piece.slice('engine/'.length)) : join(LIVE_SOURCES, piece), 'utf8');
  if (piece.endsWith('.ts')) return Buffer.from(uncommented(stripped(classic(text)), piece), 'utf8');
  return Buffer.from(uncommented(piece.endsWith('.js') ? classic(text) : text, piece), 'utf8');
};

describe('build-index on the live sources', () => {
  const order = JSON.parse(readFileSync(join(LIVE_SOURCES, 'order.json'), 'utf8')) as string[];

  it('points at frontends/app/src/legacy/src, the repo root index.html, dist-github-pages/ and the icon beside the root', () => {
    assert.equal(SOURCES, LIVE_SOURCES);
    assert.equal(TARGET, LIVE_PAGE);
    assert.equal(PAGES_DIR, join(REPO, 'dist-github-pages'));
    assert.equal(ICON, join(REPO, 'apple-touch-icon.png'));
  });

  it('the files order.json lists, read straight from disk, each without its comments, and joined (the JS files without their module blocks), are the page byte for byte', () => {
    // Independent of the build function: the test strips and joins the files itself.
    const joined = Buffer.concat(order.map(pieceOnPage));
    const page = buildIndex();
    assert.equal(joined.length, page.length);
    assert.equal(sha256(joined), sha256(page));
  });

  it('writePages writes the page and its icon into a folder, and nothing else', () => {
    const out = mkdtempSync(join(tmpdir(), 'build-index-pages-'));
    try {
      const page = writePages(join(out, 'site'));
      assert.deepEqual(readdirSync(join(out, 'site')).sort(), ['apple-touch-icon.png', 'index.html']);
      assert.ok(readFileSync(join(out, 'site', 'index.html')).equals(Buffer.concat(order.map(pieceOnPage))));
      assert.ok(readFileSync(join(out, 'site', 'index.html')).equals(page));
      assert.ok(readFileSync(join(out, 'site', 'apple-touch-icon.png')).equals(readFileSync(ICON)));
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });

  it('the root index.html, while the repo carries it, is the page byte for byte', { skip: !existsSync(LIVE_PAGE) && 'no root index.html' }, () => {
    assert.ok(readFileSync(LIVE_PAGE).equals(Buffer.concat(order.map(pieceOnPage))));
  });

  it('the JS files and the engine\'s TypeScript are the inline script, in order, and each compiles on its own', () => {
    const html = buildIndex().toString('utf8');
    const script = html.split('<script>')[1]!.split('</script>')[0];
    const js = order.filter((piece) => piece.startsWith('js/') || piece.startsWith('engine/'));
    assert.equal(js.map((piece) => pieceOnPage(piece).toString('utf8')).join(''), script);
    for (const piece of js) assert.doesNotThrow(() => new Script(pieceOnPage(piece).toString('utf8'), { filename: piece }), piece);
  });

  it('lists every source file once, and no file name carries a version', () => {
    assert.deepEqual(readOrder(), order);
    const onDisk = ['html', 'css', 'js'].flatMap((folder) => readdirSync(join(LIVE_SOURCES, folder)).map((f) => `${folder}/${f}`));
    if (existsSync(LIVE_ENGINE)) onDisk.push(...readdirSync(LIVE_ENGINE).filter((f) => f.endsWith('.ts') && f !== 'index.ts').map((f) => `engine/${f}`));
    assert.deepEqual([...onDisk].sort(), [...order].sort());
    for (const piece of order) assert.doesNotMatch(piece, /(?:^|[/-])v\d/, piece);
  });

  it('npm run build:index:check passes and prints the page it proved', () => {
    const res = spawnSync(process.execPath, ['scripts/build-index.mjs', '--check'], { cwd: APP, encoding: 'utf8' });
    assert.equal(res.status, 0, res.stderr);
    const page = readFileSync(LIVE_PAGE);
    assert.equal(res.stdout.trim(), `build-index: index.html is the build of ${order.length} source files: ${page.length} bytes, ia-version ${/<meta name="ia-version" content="([^"]*)"/.exec(page.toString())![1]}, sha256 ${sha256(page)}`);
  });
});

describe('collapseTypes: the JavaScript a TypeScript file was written from', () => {
  // Each case: the TypeScript, and the JavaScript typed by hand. The stripper is Node's own.
  const cases: [string, string][] = [
    ['function f(a: number, b?: string): void {}', 'function f(a, b) {}'],
    ['x = foo(d as DayKey);', 'x = foo(d);'],
    ['y = a as T || b;', 'y = a || b;'],
    ['z = bar as T\n  next();', 'z = bar \n  next();'],
    ["\nimport type { X } from './x.ts';\nfunction g(){}", '\nfunction g(){}'],
    ['a = 1;\n  interface I { n: number }\nb = 2;', 'a = 1;\nb = 2;'],
    ['const q = new Set<number>();', 'const q = new Set();'],
    ['const r: (s: number) => string = s => String(s);', 'const r = s => String(s);'],
    ['w = m!.x + n!;', 'w = m.x + n;'],
    ['function h(a: number): number;\nfunction h(a) { return a; }', 'function h(a) { return a; }'],
    ['const t: Record<string, number>={a:1};', 'const t={a:1};'],
  ];
  for (const [ts, js] of cases) {
    it(`${JSON.stringify(ts)} reads ${JSON.stringify(js)}`, () => assert.equal(collapseTypes(ts, stripTypeScriptTypes(ts, { mode: 'strip' })), js));
  }
  it('never takes away a line break that stands between two tokens', () => {
    const ts = 'let v = w as Q\nnext();';
    assert.equal(collapseTypes(ts, stripTypeScriptTypes(ts, { mode: 'strip' })), 'let v = w \nnext();');
    // Where taking a type out would join the next line to the statement, Node's stripper writes the semicolon itself
    // (a new token, which tools/same-script.mjs would name), and the line break still stands.
    const call = 'let v = w as Q\n(go)();';
    assert.equal(collapseTypes(call, stripTypeScriptTypes(call, { mode: 'strip' })), 'let v = w ;\n(go)();');
  });
  it('maps each character it keeps to its place in the source', () => {
    const ts = 'function f(a: A,b){}';
    const at: number[] = [];
    assert.equal(collapseTypes(ts, stripTypeScriptTypes(ts, { mode: 'strip' }), at), 'function f(a,b){}');
    assert.deepEqual(at, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16, 17, 18, 19]);
  });
});

describe('build-index on fixture sources', () => {
  const made: string[] = [];
  after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
  /** A source folder of three pieces, and the page they build. */
  function fixture() {
    const dir = mkdtempSync(join(tmpdir(), 'ia-build-index-test-'));
    made.push(dir);
    const pieces: Record<string, string> = {
      'html/top.html': '<!doctype html>\n<html><head><style>',
      'css/base.css': 'body{color:red}\n',
      'html/body.html': '</style></head><body><script>',
      'js/app.js': "function go(){ return 'x'; }\n",
      'html/end.html': '</script></body></html>\n',
    };
    for (const folder of ['html', 'css', 'js']) mkdirSync(join(dir, folder));
    for (const [piece, text] of Object.entries(pieces)) writeFileSync(join(dir, piece), text);
    writeFileSync(join(dir, 'order.json'), JSON.stringify(Object.keys(pieces)));
    const page = join(dir, 'index.html');
    writeFileSync(page, Object.values(pieces).join(''));
    return { dir, page };
  }

  it('passes when the page is the build, and fails at the first differing byte, naming the source file and line', () => {
    const { dir, page } = fixture();
    assert.equal(checkIndex(dir, page).ok, true);
    writeFileSync(page, readFileSync(page, 'utf8').replace("'x'", "'y'"));
    const drift = checkIndex(dir, page);
    if (drift.kept) made.push(dirname(drift.kept));
    assert.equal(drift.ok, false);
    const offset = '<!doctype html>\n<html><head><style>body{color:red}\n</style></head><body><script>'.length + "function go(){ return '".length;
    assert.equal(drift.offset, offset);
    assert.match(drift.message, new RegExp(`first difference is byte ${offset} \\(index\\.html line 3, column \\d+; js/app\\.js line 1\\)`));
    assert.ok(drift.kept && readFileSync(drift.kept).equals(buildIndex(dir)), 'the build is kept for a diff');
  });

  it('strips a JS file\'s module blocks, and names a drifting line as it sits in the file on disk', () => {
    const { dir, page } = fixture();
    const body = "function go(){ return 'x'; }\n";
    writeFileSync(join(dir, 'js/app.js'), `import { a } from './lib.js';\n${IMPORTS_END}${body}${EXPORTS_START}export { go };\n`);
    assert.equal(checkIndex(dir, page).ok, true, 'the page carries the code between the markers, byte for byte');
    writeFileSync(page, readFileSync(page, 'utf8').replace("'x'", "'y'"));
    const drift = checkIndex(dir, page);
    if (drift.kept) made.push(dirname(drift.kept));
    assert.match(drift.message, /; js\/app\.js line 3\)/, 'line 3 of the file: two lines of import block come first');
  });

  it('refuses a module block that holds anything but module syntax, and a marker written twice', () => {
    const { dir, page } = fixture();
    const body = "function go(){ return 'x'; }\n";
    for (const bad of [
      `let stray = 1;\n${IMPORTS_END}${body}`,
      `${body}${EXPORTS_START}export { go };\nlet stray = 1;\n`,
      `${IMPORTS_END}${IMPORTS_END}${body}`,
    ]) {
      writeFileSync(join(dir, 'js/app.js'), bad);
      assert.throws(() => checkIndex(dir, page), /import block holds|export block holds|marker appears twice/, JSON.stringify(bad));
    }
  });

  it('fails when the page is longer or shorter than the build', () => {
    const { dir, page } = fixture();
    writeFileSync(page, `${readFileSync(page, 'utf8')}\n`);
    const longer = checkIndex(dir, page);
    if (longer.kept) made.push(dirname(longer.kept));
    assert.equal(longer.ok, false);
    assert.equal(longer.offset, readFileSync(page).length - 1);
    assert.equal(firstDifference(Buffer.from('abc'), Buffer.from('abcd')), 3);
    assert.equal(firstDifference(Buffer.from('abc'), Buffer.from('abc')), -1);
  });

  it('refuses a source file the list leaves out, an entry that is missing or repeated, and a badly named one', () => {
    const { dir } = fixture();
    const list = JSON.parse(readFileSync(join(dir, 'order.json'), 'utf8')) as string[];
    const withList = (next: unknown) => writeFileSync(join(dir, 'order.json'), JSON.stringify(next));

    writeFileSync(join(dir, 'js', 'stray.js'), '1;\n');
    assert.throws(() => readOrder(dir), /js\/stray\.js is not in order\.json/);
    rmSync(join(dir, 'js', 'stray.js'));
    readOrder(dir);

    withList([...list, 'js/missing.js']);
    assert.throws(() => readOrder(dir), /lists js\/missing\.js, which does not exist/);
    withList([...list, list[0]]);
    assert.throws(() => readOrder(dir), /lists html\/top\.html twice/);
    for (const bad of ['js/App.js', 'js/app.css', 'lib/app.js', 'js/../app.js', 'js/engine-v239.js', 'js/app_x.js']) {
      withList([...list, bad]);
      assert.throws(() => readOrder(dir), /is not html\/, css\/, js\/ or engine\/ plus a file named in lower case words joined by dashes/, bad);
    }
  });

  it('builds an engine file from core/src/engine: its module blocks stripped, then its types, taken out', () => {
    // A copy of the repo's shape: the sources four folders under frontends/, core/src/engine beside them.
    const top = mkdtempSync(join(tmpdir(), 'ia-build-index-engine-'));
    made.push(top);
    const dir = join(top, 'frontends', 'app', 'src', 'legacy', 'src');
    const engine = join(top, 'core', 'src', 'engine');
    for (const folder of ['html', 'js']) mkdirSync(join(dir, folder), { recursive: true });
    mkdirSync(engine, { recursive: true });
    writeFileSync(join(dir, 'html/top.html'), '<script>');
    writeFileSync(join(engine, 'pace.ts'), `import type { Cfg } from '../domain/index.ts';\nfunction pace(sec: number, cfg?: Cfg): string { return String(sec as number); }\n${EXPORTS_START}export { pace };\n`);
    writeFileSync(join(dir, 'js/app.js'), `import { pace } from '../../../../../../core/src/engine/pace.ts';\n${IMPORTS_END}pace(1);\n`);
    writeFileSync(join(dir, 'html/end.html'), '</script>\n');
    writeFileSync(join(dir, 'order.json'), JSON.stringify(['html/top.html', 'engine/pace.ts', 'js/app.js', 'html/end.html']));
    const page = buildIndex(dir).toString('utf8');
    assert.equal(page, '<script>function pace(sec, cfg) { return String(sec); }\npace(1);\n</script>\n', 'the type import line goes whole');
    writeFileSync(join(engine, 'stray.ts'), 'export {};\n');
    assert.throws(() => readOrder(dir), /core\/src\/engine\/stray\.ts is not in order\.json/);
    rmSync(join(engine, 'stray.ts'));
    writeFileSync(join(engine, 'index.ts'), "export { pace } from './pace.ts';\n");
    assert.doesNotThrow(() => readOrder(dir), 'the engine\'s index.ts is the package entry, never a piece');
  });

  it('builds an app file turned TypeScript in place: its types out, the type checker\'s marker lines out, a hand marker\'s line left empty (D268)', () => {
    const { dir } = fixture();
    rmSync(join(dir, 'js', 'app.js'));
    writeFileSync(join(dir, 'js', 'app.ts'), "function go(n: any): string {\n  // @ts-expect-error TS2339 Property 'x' does not exist on type '{}'.\n  const v = ({}).x;\n  // @ts-expect-error kept: a finding, written by hand\n  return 'x' + v + n;\n}\n");
    writeFileSync(join(dir, 'order.json'), JSON.stringify(['html/top.html', 'css/base.css', 'html/body.html', 'js/app.ts', 'html/end.html']));
    assert.equal(buildIndex(dir).toString('utf8'), '<!doctype html>\n<html><head><style>body{color:red}\n</style></head><body><script>'
      + "function go(n) {\n  const v = ({}).x;\n  \n  return 'x' + v + n;\n}\n</script></body></html>\n");
    writeFileSync(join(dir, 'js', 'stray.ts'), 'export {};\n');
    assert.throws(() => readOrder(dir), /js\/stray\.ts is not in order\.json/);
  });
});
