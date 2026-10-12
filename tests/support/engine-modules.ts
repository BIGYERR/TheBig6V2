// The app's engine as ES modules (architecture phase C): its JS source files imported straight from
// frontends/app/src/legacy/src/js, with no VM and no index.html. For tests/integration/engine-modules.test.ts and
// tests/sweeps/engine-modules.test.ts.
//
// The files form one import cycle, so importing the engine loads every file. Loading runs almost nothing (the measure:
// tests/measure/es-modules_module-graph.md); the one thing that touches the page while loading is update-check.js,
// which boots the app (init) at once unless the document is still loading, in which case it waits for
// DOMContentLoaded. So a document that is still loading and keeps no listeners is stubbed while the modules load: the
// app never boots, and the engine needs no page.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';
import type { Cfg, Program } from '@ia/core';

/**
 * The app's JS source files, each an ES module. IA_ENGINE_SOURCES=<folder> loads another copy of them (an absolute
 * path, or one relative to tests/), as IA_APP does for the page: a gatekeeper's run against the commit before a change.
 */
const ENV_SOURCES = process.env['IA_ENGINE_SOURCES'];
export const ENGINE_SOURCES = ENV_SOURCES
  ? resolve(join(dirname(fileURLToPath(import.meta.url)), '..'), ENV_SOURCES)
  : join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontends', 'app', 'src', 'legacy', 'src', 'js');

export interface EngineModules {
  buildProgram(cfg: Cfg): Program;
}

/** Imports the engine from the module sources. Stubs `document` with vi.stubGlobal; vi.unstubAllGlobals() undoes it. */
export async function loadEngineModules(): Promise<EngineModules> {
  vi.stubGlobal('document', { readyState: 'loading', addEventListener() {} });
  const engine = (await import(join(ENGINE_SOURCES, 'budget-engine-d.js'))) as EngineModules;
  return { buildProgram: engine.buildProgram };
}
