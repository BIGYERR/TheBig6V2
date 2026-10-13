// The real legacy bundle (scripts/legacy-bundle.mjs over the page's source files, architecture phase E step 34): every
// file in it, in the page's order, the page's boot line gone, no implicit global, and a seam for every legacy name the
// Angular components take over or write. The names are read off the components' own source, so a component that takes
// over a const or a name no file declares fails here rather than at the app's boot. Then the types the components are
// checked against (legacyTypes): every legacy name, from the file the bridge resolves it to, and nothing else.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { BOOT_LINE, codePieces, legacyBundle, legacyTypes, topLevel } from '../../scripts/legacy-bundle.mjs';
import { piecePath, readOrder, SOURCES } from '../../scripts/build-index.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Every .ts file under a folder. */
function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? tsFiles(p) : n.endsWith('.ts') ? [p] : [];
  });
}

describe('the legacy bundle', async () => {
  // Unminified, so its entry can be read as written.
  const bundle = await legacyBundle(undefined, { minify: false });
  const pieces = codePieces();
  const names = new Map(pieces.map((p) => [p, topLevel(p, readFileSync(piecePath(SOURCES, p), 'utf8'))]));
  const sources = tsFiles(join(APP, 'src', 'app')).map((f) => readFileSync(f, 'utf8')).join('\n');
  const used = (re: RegExp) => [...new Set([...sources.matchAll(re)].map((m) => m[1]!))].sort();

  it('holds every code piece of the page, in the page\'s order', () => {
    assert.deepEqual(pieces, readOrder().filter((p: string) => p.startsWith('js/') || p.startsWith('engine/')));
    assert.ok(pieces.length >= 40, `${pieces.length} pieces`);
    assert.deepEqual(bundle.pieces, pieces);
    const listed = /LEGACY_MODULES = \[(.*)\];/.exec(bundle.js)![1]!;
    assert.deepEqual([...listed.matchAll(/\["([^"]+)", /g)].map((m) => m[1]), pieces);
  });

  it('leaves the page\'s boot line out, and finds no implicit global in any piece', () => {
    assert.ok(!bundle.js.includes(BOOT_LINE));
    for (const [p, n] of names) assert.deepEqual(n.implicit, [], p);
  });

  it('can take over every legacy function a component takes over, and write every legacy let a component writes', () => {
    const mutable = new Set([...names.values()].flatMap((n) => n.mutable));
    const provided = used(/\.provide\('([A-Za-z_$][\w$]*)'/g);
    const written = used(/bridge\.set\('([A-Za-z_$][\w$]*)'/g);
    assert.ok(provided.length >= 25, `${provided.length} takeovers read off the components`);
    assert.deepEqual(provided.filter((n) => !mutable.has(n)), [], 'every takeover is a top-level function or let');
    assert.deepEqual(written.filter((n) => !mutable.has(n)), [], 'every write is a top-level let');
  });
});

describe('the legacy types', () => {
  const GEN = join(APP, 'src', 'legacy', 'generated');
  const files: Map<string, string> = legacyTypes();
  const api = files.get(join(GEN, 'legacy-api.d.ts'))!;
  const pieces = codePieces();
  const names = pieces.map((p) => [p, topLevel(p, readFileSync(piecePath(SOURCES, p), 'utf8'))] as const);

  it('types every top-level name of every file, from the file the bridge resolves it to (the later one), and nothing else', () => {
    const owner = new Map<string, number>();
    names.forEach(([, n], i) => { for (const d of n.declared) owner.set(d, i); });
    const listed = [...api.matchAll(/^ {2}readonly ([\w$]+): typeof m(\d+)\.([\w$]+);$/gm)];
    assert.deepEqual(listed.map((m) => m[1]).sort(), [...owner.keys()].sort());
    for (const m of listed) assert.equal(+m[2]!, owner.get(m[1]!), m[1]);
    for (const m of listed) assert.equal(m[3], m[1]);
    // _isoToday is declared twice; the bridge resolves it to overlays, the later file, and so does the type.
    assert.equal(pieces[owner.get('_isoToday')!], 'js/overlays.ts');
    const writable = /^export type LegacyWritable = (.*);$/m.exec(api)![1]!.split(' | ').map((w) => w.slice(1, -1));
    assert.deepEqual(writable.sort(), [...new Set(names.flatMap(([, n]) => n.writable))].sort());
    assert.ok(writable.includes('currentWeek') && !writable.includes('EXLIB'));
  });

  it('lets a component reach a declared name, and refuses an undeclared one and a write to a const, when compiled', () => {
    const ts = createRequire(import.meta.url)('typescript');
    const dir = mkdtempSync(join(tmpdir(), 'ia-legacy-types-'));
    try {
      for (const [path, text] of files) {
        const to = join(dir, relative(GEN, path));
        mkdirSync(dirname(to), { recursive: true });
        writeFileSync(to, text);
      }
      // Each refusal is an @ts-expect-error: a line the types let through leaves its directive unused, which is an error.
      writeFileSync(join(dir, 'fixture.ts'), [
        "import type { LegacyApi, LegacyWritable } from './legacy-api';",
        'type Fn = { [K in keyof LegacyApi]: LegacyApi[K] extends (...args: never[]) => unknown ? K : never }[keyof LegacyApi];',
        "export const open: Fn = 'openDetail';",
        '// @ts-expect-error a name no legacy file declares',
        "export const none: Fn = 'noSuchLegacyName';",
        "export const week: LegacyWritable = 'currentWeek';",
        '// @ts-expect-error a const, which the bridge cannot write',
        "export const lib: LegacyWritable = 'EXLIB';",
        "export const active: ReturnType<LegacyApi['getActiveProgId']> = null;",
        '',
      ].join('\n'));
      const program = ts.createProgram([join(dir, 'fixture.ts')], {
        strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.Preserve,
        moduleResolution: ts.ModuleResolutionKind.Bundler, allowImportingTsExtensions: true, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], types: [],
      });
      const errors = ts.getPreEmitDiagnostics(program).map((d: { messageText: unknown }) => ts.flattenDiagnosticMessageText(d.messageText, ' '));
      assert.deepEqual(errors, []);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
