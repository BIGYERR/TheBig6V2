// module-blocks: every JS source file is also an ES module (architecture phase C, step 1). Its import block names what
// it uses from the other files and its export block what they, and the tests, use from it; scripts/module-blocks.mjs
// writes both from the code. Here the blocks are current, every file parses as a module, and every import names an
// export of the file it imports from, read off the files themselves with acorn, not from the script's own reasoning.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { readOrder, SOURCES } from '../../scripts/build-index.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const acorn = createRequire(import.meta.url)('acorn') as { parse(text: string, o: object): { body: Node[] } };
interface Node {
  type: string;
  source?: { value: string };
  specifiers?: { imported?: { name: string }; local: { name: string }; exported?: { name: string } }[];
}

describe('module blocks', () => {
  const pieces = readOrder().filter((p: string) => p.endsWith('.js'));
  const asts = new Map(pieces.map((p: string) => [p.slice(3, -3), acorn.parse(readFileSync(join(SOURCES, p), 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' })]));

  it('every JS file\'s blocks are what its code needs (npm run modules:check)', () => {
    const res = spawnSync(process.execPath, ['scripts/module-blocks.mjs', '--check'], { cwd: APP, encoding: 'utf8' });
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /every block matches its code \(\d+ JS files, \d+ imported names, \d+ exported\)/);
  });

  it('every JS file parses as an ES module, and every import names an export of the file it comes from', () => {
    assert.equal(asts.size, pieces.length);
    const exportsOf = new Map<string, Set<string>>();
    for (const [file, ast] of asts) {
      const names = new Set<string>();
      for (const n of ast.body) if (n.type === 'ExportNamedDeclaration') for (const s of n.specifiers ?? []) names.add(s.exported!.name);
      exportsOf.set(file, names);
    }
    let imported = 0;
    for (const [file, ast] of asts) {
      for (const n of ast.body) {
        if (n.type !== 'ImportDeclaration') continue;
        const from = /^\.\/([a-z0-9-]+)\.js$/.exec(n.source!.value)?.[1];
        assert.ok(from && exportsOf.has(from), `${file} imports from ${n.source!.value}, which is not a source file`);
        for (const s of n.specifiers ?? []) {
          imported++;
          assert.ok(exportsOf.get(from)!.has(s.imported!.name), `${file} imports ${s.imported!.name} from ${from}, which does not export it`);
        }
      }
    }
    assert.ok(imported > 0, 'the files import from each other');
  });
});
