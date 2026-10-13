// The legacy app as ES modules for the Angular build (scripts/legacy-bundle.mjs, architecture phase E step 34): each
// file's top-level names read off its code, the seams added to it, the entry's order, and the bundle itself refusing an
// implicit global. The expected values are typed here from small sources written for each case.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { entry, seams, topLevel } from '../../scripts/legacy-bundle.mjs';

describe('the legacy bundle', () => {
  it('reads a file\'s top-level names: declared, not imported; functions and lets mutable, consts not; its exports', () => {
    const src = "import { x } from './x.js';\nfunction f(){ return x; }\nlet a = 1;\nvar b = 2;\nconst c = 3;\nclass K {}\nexport { f };\n";
    const t = topLevel('js/a.js', src);
    assert.deepEqual([t.declared.sort(), t.mutable.sort(), [...t.exported], t.implicit], [['K', 'a', 'b', 'c', 'f'], ['a', 'b', 'f'], ['f'], []]);
  });

  it('reads an engine file through its types, and finds a write to a name nothing declares', () => {
    const ts = topLevel('engine/e.ts', 'interface I { n: number }\nexport function g(i: I): number { return i.n; }\nlet m: number = 0;\n');
    assert.deepEqual([ts.declared.sort(), ts.mutable.sort()], [['g', 'm'], ['g', 'm']]);
    assert.deepEqual(topLevel('js/b.js', 'function h(){ leaked = 1; }\n').implicit, ['leaked']);
  });

  it('adds the unexported names, and the two seams over the mutable ones', () => {
    const add = seams({ declared: ['f', 'a', 'c'], mutable: ['f', 'a'], exported: new Set(['f']), implicit: [] });
    assert.equal(add, "\nexport { a, c };\n"
      + "export function __iaTakeOver(__iaName, __iaFn) { switch (__iaName) { case 'f': f = __iaFn; return true; case 'a': a = __iaFn; return true; default: return false; } }\n"
      + "export function __iaSet(__iaName, __iaValue) { switch (__iaName) { case 'f': f = __iaValue; return true; case 'a': a = __iaValue; return true; default: return false; } }\n");
    assert.throws(() => seams({ declared: ['__iaName'], mutable: [], exported: new Set(), implicit: [] }), /keeps for its seams/);
  });

  it('takes over a function and writes a let through the seams, and every importer sees it', async () => {
    const { build } = await import('esbuild');
    const lib = "export function greet(){ return 'legacy'; }\nexport function callGreet(){ return greet(); }\nlet count = 1;\nexport function readCount(){ return count; }\n";
    const names = topLevel('js/lib.js', lib);
    const out = await build({
      stdin: { contents: "import * as lib from 'lib';\nimport { greet } from 'lib';\nexport const run = () => [lib.__iaTakeOver('greet', () => 'angular'), lib.callGreet(), greet(), lib.__iaSet('count', 7), lib.readCount(), lib.__iaSet('nope', 1)];\n", loader: 'js' },
      bundle: true, format: 'esm', write: false,
      plugins: [{ name: 'lib', setup(b) { b.onResolve({ filter: /^lib$/ }, () => ({ path: 'lib', namespace: 'lib' })); b.onLoad({ filter: /.*/, namespace: 'lib' }, () => ({ contents: lib + seams(names), loader: 'js' })); } }],
    });
    const mod = await import('data:text/javascript,' + encodeURIComponent(out.outputFiles[0]!.text));
    assert.deepEqual(mod.run(), [true, 'angular', 'angular', true, 7, false]);
  });

  it('imports every piece, in the page\'s order, lists each namespace under its piece, and hands the list to the shell', () => {
    const e = entry(['js/a.js', 'engine/b.ts'], '/src');
    assert.match(e, /^import \* as m0 from "[^"]*\/src\/js\/a\.js";\nimport \* as m1 from "[^"]*\/core\/src\/engine\/b\.ts";\n/);
    assert.ok(e.endsWith('export const LEGACY_MODULES = [["js/a.js", m0], ["engine/b.ts", m1]];\n'
      + "const ready = globalThis.__iaLegacyReady;\nif (typeof ready === 'function') ready(LEGACY_MODULES);\n"));
  });
});
