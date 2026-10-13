// The legacy app as ES modules, for the Angular build (architecture phase E, step 34). The page (index.html) runs the
// app's source files as one classic script; the Angular build runs the same files as the ES modules they also are
// (phase C, scripts/module-blocks.mjs), bundled here by esbuild into one module script, public/legacy/legacy.js, which
// hands them to the shell when it runs:
//
//   globalThis.__iaLegacyReady(LEGACY_MODULES)   // [piece, module namespace][], in the page's order
//
// It is a module script the shell adds to the page, not an import() of a lazy chunk, because a script element delays
// the page's load event until it has run, as the page's own script does, so the boot has drawn before the browser
// restores a reloaded page's scroll position (an import() let the load event pass first, and a reload kept less of the
// reader's place than the page does).
//
// The files are read as they are; what the Angular build needs beyond them is added here, to the bundle only, so the
// page and the sources never change:
//   - every top-level name of a file is exported (a file's own export block names only what other files use), so the
//     bridge reaches each one as the page's global scope did;
//   - `__iaTakeOver(name, fn)` rebinds one of the file's top-level functions (a function declaration is a mutable
//     binding, and every importer sees the new value), which is how a component takes over a legacy function now that
//     no global stands in between; and `__iaSet(name, value)` writes one of its top-level `let`s or `var`s;
//   - the page's boot line, the last line of the last file, is dropped: the shell runs init() itself.
// A file that writes a name nothing declares (an implicit global, which a module's strict mode refuses) fails the
// bundle loudly, naming it.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { piecePath, readOrder, SOURCES, stripTypes } from './build-index.mjs';

/** The page's own boot, the script's last line. */
export const BOOT_LINE = "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}";

const require = createRequire(import.meta.url);
const acorn = require('acorn');
const escope = require('eslint-scope');

/** The pieces of the page that are code: the app's JS files and the engine's TypeScript, in the page's order. */
export function codePieces(srcDir = SOURCES) {
  return readOrder(srcDir).filter((p) => p.startsWith('js/') || p.startsWith('engine/'));
}

/** A piece's top-level names: every one declared there (not imported), the mutable ones, and those it exports already. */
export function topLevel(piece, text) {
  const code = piece.endsWith('.ts') ? stripTypes(text, piece) : text;
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', ranges: true });
  const scope = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'module' });
  const mod = scope.globalScope.childScopes.find((s) => s.type === 'module');
  if (!mod) throw new Error(`${piece}: no module scope`);
  const declared = [];
  const mutable = [];
  for (const v of mod.variables) {
    const def = v.defs[0];
    if (!def || def.type === 'ImportBinding') continue;
    declared.push(v.name);
    if (def.type === 'FunctionName' || (def.type === 'Variable' && def.parent.kind !== 'const')) mutable.push(v.name);
  }
  const exported = new Set();
  for (const node of ast.body) {
    if (node.type !== 'ExportNamedDeclaration') continue;
    for (const s of node.specifiers) exported.add(s.exported.name);
    const d = node.declaration;
    if (d && d.id) exported.add(d.id.name);
    if (d && d.declarations) for (const v of d.declarations) if (v.id.type === 'Identifier') exported.add(v.id.name);
  }
  const implicit = [...new Set(scope.globalScope.through.filter((r) => r.isWrite()).map((r) => r.identifier.name))];
  return { declared, mutable, exported, implicit };
}

/** What the bundle adds to a piece: its unexported top-level names, and the two seams. */
export function seams(names) {
  const rest = names.declared.filter((n) => !names.exported.has(n));
  // The parameters' names start with __ia, which no legacy file declares, so none can shadow the name it rebinds.
  const clash = names.declared.find((n) => n.startsWith('__ia'));
  if (clash) throw new Error(`a legacy file declares ${clash}, a name the bundle keeps for its seams`);
  const cases = (list, value) => list.map((n) => `case '${n}': ${n} = ${value}; return true;`).join(' ');
  return '\n' + (rest.length ? `export { ${rest.join(', ')} };\n` : '')
    + `export function __iaTakeOver(__iaName, __iaFn) { switch (__iaName) { ${cases(names.mutable, '__iaFn')} default: return false; } }\n`
    + `export function __iaSet(__iaName, __iaValue) { switch (__iaName) { ${cases(names.mutable, '__iaValue')} default: return false; } }\n`;
}

/** The bundle's entry: each piece's namespace, in the page's order, handed to the shell's callback. */
export function entry(pieces, srcDir = SOURCES) {
  return pieces.map((p, i) => `import * as m${i} from ${JSON.stringify(piecePath(srcDir, p))};\n`).join('')
    + `export const LEGACY_MODULES = [${pieces.map((p, i) => `[${JSON.stringify(p)}, m${i}]`).join(', ')}];\n`
    + `const ready = globalThis.__iaLegacyReady;\nif (typeof ready === 'function') ready(LEGACY_MODULES);\n`;
}

/** The bundle (minified unless asked not to) and its type declaration. */
export async function legacyBundle(srcDir = SOURCES, { minify = true } = {}) {
  const esbuild = require('esbuild');
  const pieces = codePieces(srcDir);
  const byPath = new Map(pieces.map((p) => [resolve(piecePath(srcDir, p)), p]));
  const last = pieces[pieces.length - 1];
  const result = await esbuild.build({
    stdin: { contents: entry(pieces, srcDir), resolveDir: srcDir, sourcefile: 'legacy-entry.js', loader: 'js' },
    bundle: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
    legalComments: 'none',
    minify,
    keepNames: true,
    plugins: [{
      name: 'legacy-seams',
      setup(build) {
        build.onLoad({ filter: /\.(js|ts)$/ }, (args) => {
          const piece = byPath.get(resolve(args.path));
          if (!piece) return undefined;
          let text = readFileSync(args.path, 'utf8');
          const names = topLevel(piece, text);
          if (names.implicit.length) throw new Error(`${piece} writes ${names.implicit.join(', ')}, which nothing declares (a module refuses an implicit global)`);
          if (piece === last) {
            const at = text.indexOf(BOOT_LINE);
            if (at === -1 || text.indexOf(BOOT_LINE, at + 1) !== -1) throw new Error(`${piece}: the page's boot line must occur once`);
            text = text.slice(0, at) + text.slice(at + BOOT_LINE.length);
          }
          return { contents: text + seams(names), loader: piece.endsWith('.ts') ? 'ts' : 'js' };
        });
      },
    }],
  });
  const js = result.outputFiles[0].text;
  const dts = '// GENERATED by scripts/legacy-bundle.mjs. Do not edit.\n'
    + '/** A legacy file as an ES module: its top-level names, and the seams the Angular build adds to it. */\n'
    + 'export interface LegacyModule {\n  readonly [name: string]: unknown;\n'
    + '  __iaTakeOver(name: string, fn: unknown): boolean;\n  __iaSet(name: string, value: unknown): boolean;\n}\n'
    + '/** Each legacy file, by its piece in order.json, in the page\'s order: what public/legacy/legacy.js hands the shell. */\n'
    + 'export type LegacyModules = readonly (readonly [piece: string, module: LegacyModule])[];\n';
  return { js, dts, pieces };
}

