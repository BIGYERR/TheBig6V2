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

  /** Calls a legacy global function by name; throws if the app has not booted or the name is not a function. */
  call<T = unknown>(name: string, ...args: unknown[]): T {
    if (!this.booted()) throw new Error(`legacy app not booted; cannot call ${name}`);
    const fn = (globalThis as Record<string, unknown>)[name];
    if (typeof fn !== 'function') throw new Error(`legacy global ${name} is not a function`);
    return (fn as (...a: unknown[]) => T)(...args);
  }
}
