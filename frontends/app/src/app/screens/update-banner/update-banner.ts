import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';

/**
 * The update banner's contents (architecture phase E, step 12), in place of the legacy spans inside #iaUpdateBanner.
 * The banner itself, the check that shows it and its tap to refresh stay legacy (update-check.js); the ✕ still
 * dismisses it for the session through the legacy iaDismissUpdate, without the tap reaching the banner.
 */
@Component({
  selector: 'ia-update-banner',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <span class="ia-update-label">Update available — tap to refresh</span>
  <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy dismiss mark, kept as it was -->
  <span class="ia-update-dismiss" (click)="dismiss($event)">✕</span>
  `,
})
export class UpdateBanner {
  private readonly bridge = inject(LegacyBridge);

  protected dismiss(e: Event): void {
    e.stopPropagation();
    this.bridge.call('iaDismissUpdate');
  }
}
