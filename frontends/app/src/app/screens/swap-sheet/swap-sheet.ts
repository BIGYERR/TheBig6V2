import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { type SwapSheetView, swapSheetView } from './swap-sheet-model';

/**
 * The exercise swap sheet (architecture phase E, step 5), in place of the legacy openSwapSheet inside #swapOverlay. The
 * markup is the legacy one, element for element. The candidates still come from the legacy swapCandidates and
 * auxSwapCandidates, and a pick is still the legacy applySwapChoice, which reads the swap's context from the legacy
 * `let _swapCtx`: the component writes it there through LegacyBridge.set, and openSwapSheet and closeSwapSheet reach
 * the component through LegacyBridge.provide. The sheet draws before it opens, as the legacy writes did.
 */
@Component({
  selector: 'ia-swap-sheet',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="detail-header">
    <div class="dh-toprow">
      <button class="dh-back" (click)="close()">‹ Back</button>
    </div>
    <div class="dh-over">SWAP OUT</div>
    <div class="dh-title" id="swapOutName">{{ view()?.outName }}</div>
    <div class="swap-tags" id="swapTags">
      @if (view(); as v) {
        <span class="swap-tag">{{ v.kindTag }}</span><span class="swap-tag">{{ v.regionTag }}</span>@if (v.slotTag) {<span class="swap-tag">{{ v.slotTag }}</span>}@if (v.keeps) {<div class="swap-keeps">Whatever you pick keeps {{ v.keeps }}.</div>}
      }
    </div>
  </div>
  <div class="swap-body" id="swapBody">
    @if (view(); as v) {
      @if (v.sameJob.length) {
        <div class="swap-sec-lbl">SAME JOB</div>
        <div class="swap-sec-sub">These do the same work. Your week keeps its shape.</div>
        @if (v.flowNote) {<div class="swap-sec-sub">{{ v.flowNote }}</div>}
        @for (r of v.sameJob; track $index) {
          <button type="button" [class]="'swap-cand' + (r.caution ? ' caution' : '')" (click)="pick(r.name)"><span class="swap-cand-name">{{ r.name }}</span>@if (r.note) {<span class="swap-cand-note">{{ r.note }}</span>}</button>
        }
      }
      @if (v.otherJob.length) {
        <div class="swap-sec-lbl caution" [innerHTML]="warning()"></div>
        <div class="swap-sec-sub">Still {{ v.otherRegion }} work. You give up the {{ v.givenUp }} for today.</div>
        @for (r of v.otherJob; track $index) {
          <button type="button" [class]="'swap-cand' + (r.caution ? ' caution' : '')" (click)="pick(r.name)"><span class="swap-cand-name">{{ r.name }}</span>@if (r.note) {<span class="swap-cand-note">{{ r.note }}</span>}</button>
        }
      }
      @if (!v.sameJob.length && !v.otherJob.length) {
        <div class="swap-empty">Nothing else in your kit does this job. Keep it, or drop it with the minus and move on.</div>
      } @else {
        <div class="swap-foot">Swaps hold for this session only. Next week says what it always said.</div>
      }
    }
  </div>
  `,
})
export class SwapSheet {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly view = signal<SwapSheetView | null>(null);

  constructor() {
    this.bridge.provide('openSwapSheet', (secIdx: number, itemIdx: number, src?: 'wild') => this.open(secIdx, itemIdx, src));
    this.bridge.provide('closeSwapSheet', () => this.close());
  }

  protected warning(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.bridge.call('asyIcon', 'warning', 13) + ' DIFFERENT JOB, SAME DAY');
  }

  protected pick(name: string): void {
    this.bridge.call('applySwapChoice', name);
  }

  protected close(): void {
    document.getElementById('swapOverlay')?.classList.remove('open');
    this.bridge.set('_swapCtx', null);
  }

  private open(secIdx: number, itemIdx: number, src?: 'wild'): void {
    const prog = this.bridge.global('activeProg');
    const week = this.bridge.global('currentWeek');
    const dayKey = this.bridge.global('currentDayKey');
    // v0.246.0 D250 (P-WILDEDIT): a Wildcard card is looked up on the Wildcard's own working day, as the legacy _editDay does.
    const day = src === 'wild' ? this.bridge.global('_wildDraw') : prog && prog.weeks && prog.weeks[week] && prog.weeks[week][dayKey];
    const sec = day && day.sections && day.sections[secIdx];
    const item = sec && sec.items && (sec.items[itemIdx] as { name: string; detail?: string } | undefined);
    if (!item || !item.name) {
      this.bridge.call('showToast', 'Nothing to swap here');
      return;
    }
    this.bridge.set('_swapCtx', src === 'wild' ? { secIdx, itemIdx, name: item.name, detail: item.detail || '', src } : { secIdx, itemIdx, name: item.name, detail: item.detail || '' });
    const c = this.bridge.call('swapCandidates', item.name, day, week, prog);
    const fam = !c.pattern ? this.bridge.call('_auxFamily', item.name) : null;
    if (fam) {
      c.tier1 = this.bridge.call('auxSwapCandidates', item.name, day, prog);
      c.tier2 = [];
    }
    this.view.set(swapSheetView({
      name: item.name,
      detail: item.detail || '',
      itemIdx,
      section: sec!,
      candidates: c,
      familyLabel: fam ? this.bridge.global('_AUX_FAMILY_LABEL')[fam] ?? null : null,
      compoundTier: this.bridge.call('_compoundTier', item.name),
      loadNote: (outName, cand) => this.bridge.call('swapLoadNote', outName, cand),
    }));
    this.cdr.detectChanges();
    const o = document.getElementById('swapOverlay');
    if (o) {
      o.classList.add('open');
      o.scrollTop = 0;
    }
  }
}
