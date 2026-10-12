import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * The legacy _iaCard as a shell (architecture phase E, step 16): the card, its title in a colour, whatever the caller
 * puts inside, and a footer when there is one. The title and the footer are the legacy markup.
 */
@Component({
  selector: 'ia-card-shell',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">
    <div [attr.style]="'font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:' + color() + ';margin-bottom:12px'" [innerHTML]="titleHtml()"></div>
    <ng-content />
    @if (footHtml(); as f) {
      <div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5" [innerHTML]="f"></div>
    }
  </div>
  `,
})
export class CardShell {
  private readonly sanitizer = inject(DomSanitizer);
  readonly title = input.required<string>();
  readonly color = input.required<string>();
  readonly foot = input<string | null>(null);
  protected readonly titleHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.title()));
  protected readonly footHtml = computed(() => {
    const f = this.foot();
    return f ? this.sanitizer.bypassSecurityTrustHtml(f) : null;
  });
}
