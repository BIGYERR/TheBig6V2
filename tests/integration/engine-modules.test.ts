// Engine modules: the app's JS source files are ES modules as well as the classic script index.html carries
// (architecture phase C, step 1; frontends/app/scripts/module-blocks.mjs writes their import and export blocks). Here the
// engine is imported straight from the sources, with no VM and no index.html, and what it builds must be what the
// classic script builds: the golden program output (tests/snapshots/program-output.json, HALF_MANNY and the nine
// seeded configs) that tests/integration/program-output.test.ts holds against the harness. A missing import, a wrong
// export or a module that will not load turns this red; tests/sweeps/engine-modules.test.ts runs the 864-config
// lattice the same way.
//
// Oracles: the golden file (built by the classic script); each program equal to itself built twice; its config
// untouched.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, test, vi } from 'vitest';
import type { Cfg, Program } from '@ia/core';
import { progDigest } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { ENGINE_FILES, ENGINE_SOURCES, loadEngineModules } from '../support/engine-modules.ts';

const SNAPSHOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'snapshots', 'program-output.json');
/** The day the golden file was built on (tests/integration/program-output.test.ts pins the same local noon). */
const TODAY = new Date(2026, 9, 11, 12, 0, 0);

let buildProgram: (cfg: Cfg) => Program;
beforeAll(async () => {
  vi.useFakeTimers({ now: TODAY, toFake: ['Date'] });
  ({ buildProgram } = await loadEngineModules());
});
afterAll(() => {
  vi.useRealTimers();
});

test('the engine\'s files import only each other: buildProgram reaches no UI file (phase C, step 3)', () => {
  const importsOf = (file: string) => [...readFileSync(join(ENGINE_SOURCES, `${file}.js`), 'utf8').matchAll(/^} from '\.\/([a-z0-9-]+)\.js';$|^import \{[^}]*\} from '\.\/([a-z0-9-]+)\.js';$/gm)].map((m) => (m[1] ?? m[2])!);
  const reached = new Set<string>(['budget-engine-d']);
  for (const file of reached) for (const next of importsOf(file)) reached.add(next);
  const outside = [...reached].filter((f) => !(ENGINE_FILES as readonly string[]).includes(f));
  assert.deepEqual(outside, [], 'files the engine imports that are not engine files');
  assert.equal(reached.size, ENGINE_FILES.length, 'the engine reaches every engine file');
  assert.equal(typeof (globalThis as { document?: unknown }).document, 'undefined', 'and no page is here');
});

test('buildProgram imports from the module sources and builds every seeded program as the classic script does', () => {
  const golden = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as { programs: Record<string, { digest: string; weeks: number }> };
  assert.deepEqual(Object.keys(golden.programs).sort(), Object.keys(PROGRAMS).sort(), 'the golden file holds every seeded config');
  for (const [name, cfg] of Object.entries(PROGRAMS)) {
    const before = JSON.stringify(cfg);
    const prog = buildProgram(cfg);
    assert.equal(JSON.stringify(cfg), before, `${name}: the config is untouched`);
    assert.equal(progDigest(buildProgram(cfg)), progDigest(prog), `${name}: equal to itself built twice`);
    assert.equal(Object.keys(prog.weeks).length, golden.programs[name]!.weeks, `${name}: weeks`);
    assert.equal(progDigest(prog), golden.programs[name]!.digest, `${name}: the digest the classic script builds`);
  }
});
