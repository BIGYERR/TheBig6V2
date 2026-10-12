import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { type NudgeText, nudgeText } from './swap-nudge-model';

/**
 * The coach's swap nudge (architecture phase E, step 9), in place of the legacy card inside #swapNudgeOverlay (the
 * overlay itself stays legacy markup). It takes over showSwapNudge through LegacyBridge.provide: the legacy `_nudgeCtx`
 * is written first, as before, then the words are drawn and the card shown. Accepting and declining are still the
 * legacy acceptSwapNudge and dismissSwapNudge, which read `_nudgeCtx`.
 */
@Component({
  selector: 'ia-swap-nudge',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="swap-nudge-card">
    <div class="swap-nudge-hd">Noticed something</div>
    <div class="swap-nudge-body" id="swapNudgeBody">@if (text(); as t) {{{ t.noticed }}<br><br>{{ t.offer }}}</div>
    <button class="swap-nudge-yes" (click)="accept()">Make the change</button>&ngsp;<button class="swap-nudge-no" (click)="dismiss()">Leave the plan alone</button>
  </div>
  `,
})
export class SwapNudge {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly text = signal<NudgeText | null>(null);

  constructor() {
    this.bridge.provide('showSwapNudge', (from: string, to: string) => this.show(from, to));
  }

  protected accept(): void {
    this.bridge.call('acceptSwapNudge');
  }
  protected dismiss(): void {
    this.bridge.call('dismissSwapNudge');
  }

  private show(from: string, to: string): void {
    this.bridge.set('_nudgeCtx', { from, to });
    const o = document.getElementById('swapNudgeOverlay');
    if (!o) return;
    this.text.set(nudgeText(from, to, this.bridge.call<string | null>('_pattern', from)));
    this.cdr.detectChanges();
    o.classList.add('show');
  }
}
