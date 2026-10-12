import { afterNextRender, ApplicationRef, ChangeDetectionStrategy, Component, createComponent, ElementRef, EnvironmentInjector, inject } from '@angular/core';
import { Platform } from '../core/platform';
import { LegacyBridge } from './legacy-bridge';
import { MOVED_SCREENS } from '../screens/screens';
import { LEGACY_MARKUP, LEGACY_SCRIPT_URL } from '../../legacy/generated/legacy-markup';

/**
 * Mounts the Iron Asylum app generated from its page (built from src/legacy/src by scripts/build-index.mjs).
 *
 * Order matters and mirrors what the browser does with the original page: the body markup goes in first, then the
 * app script runs as a classic script so its top-level functions stay globals for the markup's inline handlers.
 * The markup is written through the element, not an [innerHTML] binding, so Angular's sanitizer does not strip those
 * handlers. The script ends by calling init() at once, because the document has finished loading by then. Then each
 * screen phase E has moved (MOVED_SCREENS) takes its legacy screen's place: the component renders inside the screen
 * element, whose own content goes.
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
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

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
    this.mountScreens();
  }

  /**
   * Puts each moved screen's component inside its legacy screen element, in place of the legacy content, and draws it at
   * once, so the components inside it (the program list in the Programs screen) are in place before any legacy call. A
   * screen the legacy boot already drew (This Week) has a mounted() hook, called then, to draw itself in its place.
   */
  private mountScreens(): void {
    for (const [screenId, component] of MOVED_SCREENS) {
      const screen = document.getElementById(screenId);
      if (!screen) throw new Error(`no legacy screen #${screenId} to mount ${component.name} in`);
      const hostElement = document.createElement('div');
      screen.replaceChildren(hostElement);
      const ref = createComponent(component, { environmentInjector: this.injector, hostElement });
      this.appRef.attachView(ref.hostView);
      ref.changeDetectorRef.detectChanges();
      const instance = ref.instance as { mounted?: () => void };
      if (typeof instance.mounted === 'function') instance.mounted();
    }
  }
}
