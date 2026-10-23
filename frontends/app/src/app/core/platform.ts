import { Injectable } from '@angular/core';

/** Where the app is running, and the one-time native bridge handshake when that is Cordova. */
@Injectable({ providedIn: 'root' })
export class Platform {
  /** cordova-ios serves the bundled www/ from the app:// scheme; a browser never does. */
  readonly isCordova = typeof location !== 'undefined' && location.protocol === 'app:';

  private ready?: Promise<void>;

  /**
   * Resolves once the native bridge is up (Cordova's `deviceready`), or at once in a browser.
   * cordova.js only exists inside the native build, so it is loaded here rather than from index.html,
   * which keeps the browser and e2e builds free of a 404.
   */
  whenReady(): Promise<void> {
    this.ready ??= this.isCordova ? this.loadCordova() : Promise.resolve();
    return this.ready;
  }

  private loadCordova(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      document.addEventListener('deviceready', () => resolve(), { once: true });
      const script = document.createElement('script');
      script.src = 'cordova.js';
      script.onerror = () => reject(new Error('cordova.js failed to load'));
      document.head.appendChild(script);
    });
  }
}
