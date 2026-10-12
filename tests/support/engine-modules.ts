// The app's engine as ES modules (architecture phase C): its JS source files imported straight from
// frontends/app/src/legacy/src/js, with no VM and no index.html. For tests/integration/engine-modules.test.ts and
// tests/sweeps/engine-modules.test.ts.
//
// The engine's files import only each other (phase C, step 3: ENGINE_FILES below), so importing it loads no UI file,
// touches no page and boots nothing: there is no document here, and none is needed.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Cfg, Program } from '@ia/core';

/**
 * The app's JS source files, each an ES module. IA_ENGINE_SOURCES=<folder> loads another copy of them (an absolute
 * path, or one relative to tests/), as IA_APP does for the page: a gatekeeper's run against the commit before a change.
 */
const ENV_SOURCES = process.env['IA_ENGINE_SOURCES'];
export const ENGINE_SOURCES = ENV_SOURCES
  ? resolve(join(dirname(fileURLToPath(import.meta.url)), '..'), ENV_SOURCES)
  : join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontends', 'app', 'src', 'legacy', 'src', 'js');

/** The files that hold the engine, buildProgram and everything it reaches, in build order (phase C, step 3). */
export const ENGINE_FILES = [
  'icons', 'exercise-library', 'exercise-kinds', 'calendar', 'clock-format', 'nsw-cardio', 'nrc-race-bike-swim',
  'cardio-progression', 'prehab', 'power-accessory', 'core-legs', 'engine-a-b-calendar', 'injury', 'engine-c', 'region-caps',
  'swap-prefs', 'budget-engine-d',
] as const;

export interface EngineModules {
  buildProgram(cfg: Cfg): Program;
}

/** Imports the engine from the module sources, with no page. */
export async function loadEngineModules(): Promise<EngineModules> {
  const engine = (await import(join(ENGINE_SOURCES, 'budget-engine-d.js'))) as EngineModules;
  return { buildProgram: engine.buildProgram };
}
