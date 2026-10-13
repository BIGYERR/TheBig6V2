import { Injectable, signal } from '@angular/core';
import type { LegacyModule, LegacyModules } from '../../legacy/generated/legacy-bundle';
import { LEGACY_SHA256, LEGACY_VERSION } from '../../legacy/generated/legacy-markup';

/** A name the legacy files declare at their top level: a plain identifier. */
const NAME = /^[A-Za-z_$][\w$]*$/;

/**
 * Typed access to the legacy app for the Angular components that replace it. Since phase E step 34 the legacy app runs as
 * the ES modules its source files are (public/legacy/legacy.js, scripts/legacy-bundle.mjs), not as the page's classic
 * script: a name resolves to the file that declares it (the later file, where two declare one, as the
 * classic script's global scope resolved it), and a name no file declares to the browser's own global (`window`).
 */
@Injectable({ providedIn: 'root' })
export class LegacyBridge {
  /** The page's ia-version this build was generated from (the page is built from src/legacy/src). */
  readonly version = LEGACY_VERSION;
  /** sha256 of that page, so a build can be traced to the exact source. */
  readonly sourceSha256 = LEGACY_SHA256;
  /** True once the legacy modules have run. */
  readonly booted = signal(false);
  /** Each top-level name, by the module that declares it. */
  private readonly owners = new Map<string, LegacyModule>();

  /** Takes the legacy modules, in the page's order, and opens the bridge. */
  markBooted(modules: LegacyModules): void {
    for (const [, m] of modules) {
      for (const name of Object.keys(m)) if (!name.startsWith('__ia')) this.owners.set(name, m);
    }
    this.booted.set(true);
  }

  /**
   * Gives the global scope the legacy names, as the page's classic script did, for the inline handlers the legacy app
   * still writes into its own markup (the rest sheet) and for the code it writes into a handler string (`run`): every
   * function on the global object (a function taken over later is put there again, by `provide`), and every other
   * top-level binding as a live accessor (read through to the module, written through its seam), as the classic
   * script's top-level `let`s and `const`s were visible to that code. A name the browser already defines keeps the
   * browser's, as it did beside the classic script.
   */
  installGlobals(): void {
    const g = globalThis as Record<string, unknown>;
    for (const [name, m] of this.owners) {
      if (typeof m[name] === 'function') {
        try {
          g[name] = m[name];
        } catch {
          // a read-only property of the browser's own; the classic script could not take it either
        }
      } else if (!(name in g)) {
        Object.defineProperty(g, name, {
          configurable: true,
          get: () => m[name],
          set: (v: unknown) => {
            if (!m.__iaSet(name, v)) throw new TypeError(`Assignment to constant variable ${name}.`);
          },
        });
      }
    }
  }

  private check(what: string, name: string): void {
    if (!this.booted()) throw new Error(`legacy app not booted; cannot ${what} ${name}`);
    if (!NAME.test(name)) throw new Error(`not a legacy binding name: ${name}`);
  }

  /** Reads a legacy top-level binding by name, its current value (a function, a `let`, a `const`), or a browser global. */
  global<T = unknown>(name: string): T {
    this.check('read', name);
    const m = this.owners.get(name);
    return (m ? m[name] : (globalThis as Record<string, unknown>)[name]) as T;
  }

  /** Writes a legacy top-level `let` or `var` (`_swapCtx`) through its module's seam. */
  set(name: string, value: unknown): void {
    this.check('write', name);
    const m = this.owners.get(name);
    if (!m || !m.__iaSet(name, value)) throw new Error(`legacy ${name} is not a top-level let to write`);
  }

  /**
   * Hands a legacy function to Angular: every legacy call of `name`, from any file, reaches `fn` from now on (the
   * module's seam rebinds the declaration, and each importer sees the new binding), and so does an inline handler.
   */
  provide(name: string, fn: (...args: never[]) => unknown): void {
    this.check('provide', name);
    const m = this.owners.get(name);
    if (!m || typeof m[name] !== 'function' || !m.__iaTakeOver(name, fn)) throw new Error(`legacy ${name} is not a function to take over`);
    (globalThis as Record<string, unknown>)[name] = fn;
  }

  /**
   * Runs a legacy handler's code, as an inline onclick attribute would have: in the global scope, where installGlobals
   * put the legacy functions. Only for code the legacy app itself wrote into a handler (the pop-up's action buttons,
   * "popClose();injSnooze('...')"), never for user input.
   */
  run(code: string): void {
    if (!this.booted()) throw new Error('legacy app not booted; cannot run a handler');
    (0, eval)(code);
  }

  /** Calls a legacy function by name; throws if the app has not booted or the name is not a function. */
  call<T = unknown>(name: string, ...args: unknown[]): T {
    const fn = this.global(name);
    if (typeof fn !== 'function') throw new Error(`legacy ${name} is not a function`);
    return (fn as (...a: unknown[]) => T)(...args);
  }
}
