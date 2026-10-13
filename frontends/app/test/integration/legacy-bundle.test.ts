// The real legacy bundle (scripts/legacy-bundle.mjs over the page's source files, architecture phase E step 34): every
// file in it, in the page's order, the page's boot line gone, no implicit global, and a seam for every legacy name the
// Angular components take over or write. The names are read off the components' own source, so a component that takes
// over a const or a name no file declares fails here rather than at the app's boot.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { BOOT_LINE, codePieces, legacyBundle, topLevel } from '../../scripts/legacy-bundle.mjs';
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
