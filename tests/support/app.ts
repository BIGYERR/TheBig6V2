// Shared helpers for tests/unit and tests/integration. They reuse tests/harness.js (load, extractInlineJS, fixtures,
// weekGrid, progDigest) through createRequire, since it is CommonJS, and never copy it.
//
//   IA_APP=<file>   run the same tests against another body of the app, for example the previous release:
//                   git show <previous tag>:index.html > <scratch>/prev.html
//                   cd tests && IA_APP=<scratch>/prev.html npx vitest run unit integration
//                   A test written for a changed behaviour must fail there.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as VM from 'node:vm';
import type { Cfg, Program } from '@ia/core';

const require = createRequire(import.meta.url);
/** The same node:vm module object harness.js calls, so a hook placed on it reaches the harness. */
const vm: typeof VM = require('node:vm');

/** The localStorage stub the harness gives the app: a Map underneath. */
export interface StorageStub {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
  clear(): void;
  key(i: number): string | null;
  readonly length: number;
  _map: Map<string, string>;
}

/** A booted app: the engine surface the harness exports by name, and handles on its VM. */
export interface App {
  /** The raw ia-version meta of the file under test. */
  version: string;
  html: string;
  js: string;
  localStorage: StorageStub;
  /** The VM's global object (also `ctx`). */
  window: Record<string, any>;
  ctx: VM.Context;
  flushTimers(n?: number): number;
  /**
   * Runs `code` in the app's context: reaches any name, exported or not. What comes back is whatever the app's own
   * (untyped) script returns, so it is typed any; a test asserts on it.
   */
  eval(code: string): any;
  fixtures: { HALF_MANNY: Cfg };
  /**
   * The engine. A config typed as Cfg gives a typed Program; a looser record (a test building a shape the wizard never
   * writes, then editing the program in place) gives the app's untyped value.
   */
  buildProgram(cfg: Cfg): Program;
  buildProgram(cfg: Record<string, any>): any;
  /** With loadApp({ dom: true }): one element stub per id the app asked for. */
  els: Record<string, any>;
  /** With loadApp({ dom: true }): every document listener the app added, by event type. */
  docListeners: Record<string, ((e: any) => void)[]>;
  /**
   * Every other name the harness exports (EXPORT_NAMES), undefined when the app has no such name: the app's own
   * functions and tables, untyped until phase D moves them into @ia/core.
   */
  [name: string]: any;
}

interface Harness {
  load(file: string, opts?: { verbose?: boolean }): App;
  extractInlineJS(html: string): string;
  fixtures: { HALF_MANNY: Cfg };
  weekGrid(prog: Program, opts?: { order?: string[]; showRest?: boolean }): string;
  progDigest(prog: Program): string;
}
const H: Harness = require('../harness.js');

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
/**
 * The app under test: dist-github-pages/index.html, the build of the sources that GitHub Pages deploys (support/global-setup.ts
 * builds it fresh before every run), or the file IA_APP names.
 */
export const APP = resolve(process.env['IA_APP'] || join(REPO, 'dist-github-pages', 'index.html'));

let script: string | undefined;
/** The app's inline script, read once. */
export function appScript(): string {
  if (script === undefined) script = H.extractInlineJS(readFileSync(APP, 'utf8'));
  return script;
}

/**
 * One top-level function declaration from the app's inline script, compiled on its own in a fresh context that holds
 * only `globals`. For unit tests of pure logic: nothing else in the app runs.
 * The declaration must start a line (`function name(`) and appear exactly once. It ends at the first closing brace
 * after which the text compiles by itself; a prefix that stops at an inner brace never does.
 */
export function appFunction<F extends (...args: any[]) => unknown = (...args: any[]) => any>(name: string, globals: Record<string, unknown> = {}): F {
  const js = appScript();
  const starts = [...js.matchAll(new RegExp('(^|\\n)function ' + name + '\\s*\\(', 'g'))];
  const first = starts[0];
  if (starts.length !== 1 || !first) {
    throw new Error(`appFunction: "function ${name}(" starts a line ${starts.length} times in ${APP} (want 1)`);
  }
  const from = first.index + (first[1] ?? '').length;
  for (let end = js.indexOf('}', from); end !== -1; end = js.indexOf('}', end + 1)) {
    const src = '(' + js.slice(from, end + 1) + ')';
    try {
      new vm.Script(src);
    } catch {
      continue;
    }
    return vm.runInContext(src, vm.createContext({ ...globals })) as F;
  }
  throw new Error(`appFunction: the declaration of ${name} in ${APP} never compiles on its own`);
}

/**
 * Boots the app in the VM harness (tests/harness.js load). With `{ dom: true }` the document keeps what the script
 * puts in it: getElementById returns one stub per id, kept in IA.els (a test can place its own stub there first), and
 * document.addEventListener keeps every listener in IA.docListeners. The hook is installed for exactly the one
 * vm.runInContext call that runs the app's script, before any of it runs, so boot-time code writes where a test can
 * read it. harness.js is not changed.
 */
export function loadApp(opts: { dom?: boolean; file?: string } = {}): App {
  const file = opts.file ? resolve(opts.file) : APP;
  if (!opts.dom) return H.load(file);
  const els: Record<string, any> = {};
  const docListeners: Record<string, ((e: any) => void)[]> = {};
  const orig = vm.runInContext;
  vm.runInContext = function (code: string, ctx: VM.Context, o?: VM.RunningCodeOptions | string) {
    if (typeof code === 'string' && code.includes('globalThis.__IA')) {
      vm.runInContext = orig;
      const doc = ctx['document'];
      const mkDiv = doc.getElementById;
      doc.getElementById = (id: string) => els[id] || (els[id] = Object.assign(mkDiv.call(doc, id), { id }));
      doc.addEventListener = (type: string, fn: unknown) => {
        if (typeof fn === 'function') (docListeners[type] = docListeners[type] || []).push(fn as (e: any) => void);
      };
    }
    return orig.call(vm, code, ctx, o);
  } as typeof vm.runInContext;
  try {
    const IA = H.load(file);
    IA.els = els;
    IA.docListeners = docListeners;
    return IA;
  } finally {
    vm.runInContext = orig;
  }
}

/**
 * Pins the app's clock: `new Date()` and `Date.now()` inside the VM return `at` (a local date and time, so a test
 * reads the same day in every time zone CI might use). A Date built from arguments is unchanged.
 */
export function pinClock(IA: App, at: Date | string | number): number {
  const Real = Date;
  const t = (at instanceof Real ? at : new Real(at)).getTime();
  if (!Number.isFinite(t)) throw new Error(`pinClock: ${String(at)} is not a date`);
  class PinnedDate extends Real {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(t);
      else super(...(args as [string | number]));
    }
    static override now(): number {
      return t;
    }
  }
  IA.window['Date'] = PinnedDate;
  return t;
}

export const fixtures = H.fixtures;
export const weekGrid = H.weekGrid;
export const progDigest = H.progDigest;
