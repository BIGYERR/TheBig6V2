import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';

/**
 * The toast (architecture phase E, step 12), in place of the legacy showToast's write into #toast (the element and its
 * look stay the legacy markup and CSS). It takes over showToast through LegacyBridge.provide, so every legacy caller
 * reaches it. The message is the app's own markup, laid in a box that makes none of its own. Each toast still hides
 * 2.2 s after it shows, and an earlier toast's timer is still never cancelled (handoff §12, a finding for a ruling):
 * this step moves the toast, it does not change it.
 */
@Component({
  selector: 'ia-toast',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span style="display:contents" [innerHTML]="message()"></span>`,
})
export class Toast {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly message = signal<SafeHtml>('');

  constructor() {
    this.bridge.provide('showToast', (msg: string) => this.show(msg));
  }

  private show(msg: string): void {
    const t = document.getElementById('toast');
    if (!t) return;
    this.message.set(this.sanitizer.bypassSecurityTrustHtml(String(msg)));
    this.cdr.detectChanges();
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }
}
