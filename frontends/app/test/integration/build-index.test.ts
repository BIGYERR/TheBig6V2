// build-index: the page is the build of src/legacy/src/, byte for byte (the test strips and joins the files itself);
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
import { buildIndex, checkIndex, firstDifference, ICON, PAGES_DIR, readOrder, SOURCES, TARGET, writePages } from '../../scripts/build-index.mjs';

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
/** A TypeScript file as the page carries it: Node's own stripper, called here, puts spaces where the types were. */
const stripped = (code: string) => stripTypeScriptTypes(code, { mode: 'strip' });
const pieceOnPage = (piece: string) => {
  const bytes = readFileSync(piece.startsWith('engine/') ? join(LIVE_ENGINE, piece.slice('engine/'.length)) : join(LIVE_SOURCES, piece));
  if (piece.endsWith('.ts')) return Buffer.from(stripped(classic(bytes.toString('utf8'))), 'utf8');
  return piece.endsWith('.js') ? Buffer.from(classic(bytes.toString('utf8')), 'utf8') : bytes;
};

describe('build-index on the live sources', () => {
  const order = JSON.parse(readFileSync(join(LIVE_SOURCES, 'order.json'), 'utf8')) as string[];

  it('points at frontends/app/src/legacy/src, the repo root index.html, dist-github-pages/ and the icon beside the root', () => {
    assert.equal(SOURCES, LIVE_SOURCES);
    assert.equal(TARGET, LIVE_PAGE);
    assert.equal(PAGES_DIR, join(REPO, 'dist-github-pages'));
    assert.equal(ICON, join(REPO, 'apple-touch-icon.png'));
  });

  it('the files order.json lists, read straight from disk and joined (the JS files without their module blocks), are the page byte for byte', () => {
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

  it('builds an engine file from core/src/engine: its module blocks stripped, then its types, to spaces in place', () => {
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
    const code = 'function pace(sec: number, cfg?: Cfg): string { return String(sec as number); }\n';
    assert.equal(page, `<script>${' '.repeat("import type { Cfg } from '../domain/index.ts';".length)}\n${code.replace(/: number|\?: Cfg|: string| as number/g, (t) => ' '.repeat(t.length))}pace(1);\n</script>\n`);
    writeFileSync(join(engine, 'stray.ts'), 'export {};\n');
    assert.throws(() => readOrder(dir), /core\/src\/engine\/stray\.ts is not in order\.json/);
    rmSync(join(engine, 'stray.ts'));
    writeFileSync(join(engine, 'index.ts'), "export { pace } from './pace.ts';\n");
    assert.doesNotThrow(() => readOrder(dir), 'the engine\'s index.ts is the package entry, never a piece');
  });
});
