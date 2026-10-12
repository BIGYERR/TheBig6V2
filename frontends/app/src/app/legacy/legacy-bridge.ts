import { Injectable, signal } from '@angular/core';
import { LEGACY_SHA256, LEGACY_VERSION } from '../../legacy/generated/legacy-markup';

/**
 * Typed access to the legacy app's globals for Angular code that replaces it one screen at a time.
 * Nothing in the shipped app calls this yet; it is the seam a migrated component reads through.
 */
@Injectable({ providedIn: 'root' })
export class LegacyBridge {
  /** The page's ia-version this build was generated from (the page is built from src/legacy/src). */
  readonly version = LEGACY_VERSION;
  /** sha256 of that page, so a build can be traced to the exact source. */
  readonly sourceSha256 = LEGACY_SHA256;
  /** True once the legacy script has run and init() has drawn the first screen. */
  readonly booted = signal(false);

  markBooted(): void {
    this.booted.set(true);
  }

  /**
   * Reads a legacy top-level binding by name: a function, or a `let` or `const` (`activeProg`, `currentWeek`,
   * `IA_VERSION`), which a classic script keeps in the global scope but not on globalThis. An indirect eval runs in that
   * scope; the name must be a plain identifier, so nothing but a name is ever evaluated. Throws before the app has booted.
   */
  global<T = unknown>(name: string): T {
    if (!this.booted()) throw new Error(`legacy app not booted; cannot read ${name}`);
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error(`not a legacy binding name: ${name}`);
    return (0, eval)(name) as T;
  }

  /**
   * Hands a legacy global function to Angular: the legacy script's own calls of `name` reach `fn` from now on. A top-level
   * function of a classic script is a writable property of the global object, and every call looks it up afresh. For a
   * screen whose component takes over what other legacy code still calls (the rest timer's ruReset, updateRestFloat).
   */
  provide(name: string, fn: (...args: never[]) => unknown): void {
    if (!this.booted()) throw new Error(`legacy app not booted; cannot provide ${name}`);
    if (typeof (globalThis as Record<string, unknown>)[name] !== 'function') throw new Error(`legacy global ${name} is not a function to take over`);
    (globalThis as Record<string, unknown>)[name] = fn;
  }

  /** Calls a legacy global function by name; throws if the app has not booted or the name is not a function. */
  call<T = unknown>(name: string, ...args: unknown[]): T {
    if (!this.booted()) throw new Error(`legacy app not booted; cannot call ${name}`);
    const fn = (globalThis as Record<string, unknown>)[name];
    if (typeof fn !== 'function') throw new Error(`legacy global ${name} is not a function`);
    return (fn as (...a: unknown[]) => T)(...args);
  }
}
