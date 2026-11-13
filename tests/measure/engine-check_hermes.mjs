// Measure for the React Native migration's phase 2, session 1 (MIGRATION.md phase 2): does core's engine check build
// for Hermes as it is, before any Expo code is written?
//
//   node tests/measure/engine-check_hermes.mjs <hermesc> <scratch dir>
//
// 1. The check through core's modules alone under Node (V8): no page, no harness, no stored state. Proves the module
//    graph engine-check.ts + budget-engine-d.ts stands on its own, which is what Metro will bundle.
// 2. The same two modules bundled by esbuild (types stripped, syntax left as written: target esnext) into one script,
//    and that script compiled by hermesc, the compiler React Native 0.88.1 ships (hermes-compiler 260318099.0.5).
//    hermesc refuses syntax Hermes cannot run; it does not run the code (the npm package has no Hermes VM), so the
//    run under Hermes itself is the simulator's.
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const [hermesc, scratch] = process.argv.slice(2);
if (!hermesc || !scratch) { console.error('usage: engine-check_hermes.mjs <hermesc> <scratch dir>'); process.exit(2); }
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENGINE = join(REPO, 'core', 'src', 'engine');

// 1. Under V8, through the modules alone.
const check = await import(join(ENGINE, 'engine-check.ts'));
const { buildProgram } = await import(join(ENGINE, 'budget-engine-d.ts'));
const run = check.engineCheckBegin(check.engineCheckCases(), performance.now());
while (!check.engineCheckSlice(run, buildProgram, () => performance.now())) { /* slices back to back */ }
console.log('V8, core modules alone: ' + check.engineCheckLine(run) + ' (' + run.cases.length + ' cases)');

// 2. Bundled as written, compiled by hermesc.
mkdirSync(scratch, { recursive: true });
const entry = join(scratch, 'entry.ts');
writeFileSync(entry, [
  `import { engineCheckBegin, engineCheckCases, engineCheckSlice, engineCheckLine } from ${JSON.stringify(join(ENGINE, 'engine-check.ts'))};`,
  `import { buildProgram } from ${JSON.stringify(join(ENGINE, 'budget-engine-d.ts'))};`,
  `const run = engineCheckBegin(engineCheckCases(), Date.now());`,
  `while (!engineCheckSlice(run, buildProgram, () => Date.now())) {}`,
  `print(engineCheckLine(run));`,
  '',
].join('\n'));
const bundle = join(scratch, 'engine-check.js');
const esbuild = join(REPO, 'frontends', 'node_modules', '.bin', 'esbuild');
execFileSync(esbuild, [entry, '--bundle', '--format=iife', '--target=esnext', '--log-level=warning', '--outfile=' + bundle], { stdio: 'inherit' });
console.log('bundle: ' + statSync(bundle).size + ' bytes (esnext, types stripped)');
const hbc = join(scratch, 'engine-check.hbc');
try {
  const out = execFileSync(hermesc, ['-emit-binary', '-out', hbc, bundle], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('hermesc: compiled, ' + statSync(hbc).size + ' bytes of bytecode' + (out.trim() ? '; said: ' + out.trim() : ''));
} catch (e) {
  console.log('hermesc: REFUSED');
  console.log(String(e.stderr || e.message).split('\n').slice(0, 30).join('\n'));
  process.exitCode = 1;
}
