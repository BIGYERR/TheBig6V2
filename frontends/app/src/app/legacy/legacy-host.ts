import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { Platform } from '../core/platform';
import { LegacyBridge } from './legacy-bridge';
import { LEGACY_MARKUP, LEGACY_SCRIPT_URL } from '../../legacy/generated/legacy-markup';

/**
 * Mounts the Iron Asylum app generated from its page (built from src/legacy/src by scripts/build-index.mjs).
 *
 * Order matters and mirrors what the browser does with the original page: the body markup goes in first, then the
 * app script runs as a classic script so its top-level functions stay globals for the markup's inline handlers.
 * The markup is written through the element, not an [innerHTML] binding, so Angular's sanitizer does not strip those
 * handlers. The script ends by calling init() at once, because the document has finished loading by then.
 */
@Component({
  selector: 'ia-legacy-host',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyHost {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platform = inject(Platform);
  private readonly bridge = inject(LegacyBridge);

  constructor() {
    afterNextRender(() => void this.mount());
  }

  private async mount(): Promise<void> {
    await this.platform.whenReady();
    this.host.nativeElement.innerHTML = LEGACY_MARKUP;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = LEGACY_SCRIPT_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`failed to load ${LEGACY_SCRIPT_URL}`));
      document.body.appendChild(script);
    });
    this.bridge.markBooted();
  }
}
