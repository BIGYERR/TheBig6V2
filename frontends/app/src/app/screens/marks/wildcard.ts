import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';

/**
 * The Wildcard mark (architecture phase E, step 31): the flame and the W, signal orange, in place of the legacy
 * wildcardMarkHTML. This Week draws it in a day's cell, and the Wildcard tag beside its words.
 */
@Component({
  selector: 'ia-wildcard-mark',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="wc-mark" aria-label="Wildcard done" [innerHTML]="inner()"></span>`,
})
export class WildcardMark {
  private readonly bridge = inject(LegacyBridge);
  private readonly sanitizer = inject(DomSanitizer);
  readonly size = input(14);
  protected readonly inner = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.bridge.call('asyIcon', 'flame', this.size()) + '<span class="wc-mark-w">W</span>'));
}

/**
 * The Wildcard tag (architecture phase E, step 31): WILDCARD DONE and the words under it (sheet-marks-model's
 * wildcardSub), in place of the legacy wildcardTagHTML, on This Week and on the session sheet.
 */
@Component({
  selector: 'ia-wildcard-tag',
  host: { style: 'display: contents' },
  imports: [WildcardMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="wc-tag"><ia-wildcard-mark [size]="16" /><div class="wc-tag-txt"><div class="wc-tag-lbl">WILDCARD DONE</div><div class="wc-tag-sub">{{ sub() }}</div></div></div>`,
})
export class WildcardTag {
  readonly sub = input.required<string>();
}
