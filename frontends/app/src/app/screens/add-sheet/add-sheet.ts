import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { type AddSheetView, addSheetView, workingSets } from './add-sheet-model';

/**
 * The add-an-exercise sheet (architecture phase E, step 6), in place of the legacy openAddSheet inside #addOverlay. The
 * markup is the legacy one, element for element. The candidates still come from the legacy addCandidates, and adding
 * one is still the legacy applyAddChoice, which closes the sheet through closeAddSheet: openAddSheet and closeAddSheet
 * reach the component through LegacyBridge.provide. The sheet draws before it opens, as the legacy writes did.
 */
@Component({
  selector: 'ia-add-sheet',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="detail-header">
    <div class="dh-toprow">
      <button class="dh-back" (click)="close()">‹ Back</button>
    </div>
    <div class="dh-over"><span class="dh-over-txt">Add an exercise</span></div>
    <div class="dh-title" id="addOutName">{{ view()?.title }}</div>
    <div class="swap-tags" id="addTags">
      @if (view(); as v) {
        <span class="swap-tag">{{ v.weekTag }}</span><span class="swap-tag">{{ v.regionTag }}</span><span class="swap-tag">{{ v.setsTag }}</span><div class="swap-keeps">Added work matches the closest thing to it in your week.</div>
      }
    </div>
  </div>
  <div class="swap-body" id="addBody">
    @if (view(); as v) {
      @if (v.gap.length) {
        <div class="swap-sec-lbl">Today isn't training these</div>
        <div class="swap-sec-sub">Work your day has no movement for yet.</div>
        @for (r of v.gap; track $index) {
          <button type="button" class="swap-cand" (click)="pick(r.name)"><span class="swap-cand-name">{{ r.name }}</span></button>
        }
      }
      @if (v.more.length) {
        <div class="swap-sec-lbl caution" [innerHTML]="warning('more')"></div>
        <div class="swap-sec-sub">Your day already trains this pattern. Adding here stacks fatigue on the same tissue.</div>
        @for (r of v.more; track $index) {
          <button type="button" class="swap-cand caution" (click)="pick(r.name)"><span class="swap-cand-name">{{ r.name }}</span><span class="swap-cand-note">{{ r.note }}</span></button>
        }
      }
      @if (v.off.length) {
        <div class="swap-sec-lbl caution" [innerHTML]="warning('off')"></div>
        <div class="swap-sec-sub">Different region than this day trains. Fine once, but watch what it lands next to.</div>
        @for (r of v.off; track $index) {
          <button type="button" class="swap-cand caution" (click)="pick(r.name)"><span class="swap-cand-name">{{ r.name }}</span><span class="swap-cand-note">{{ r.note }}</span></button>
        }
      }
      @if (!v.gap.length && !v.more.length && !v.off.length) {
        <div class="swap-empty">Nothing left in your kit that isn't already on this card.</div>
      } @else {
        <div class="swap-foot">Added work holds for this session only. It logs and counts like anything else on the card. Next week says what it always said.</div>
      }
    }
  </div>
  `,
})
export class AddSheet {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly view = signal<AddSheetView | null>(null);

  constructor() {
    this.bridge.provide('openAddSheet', () => this.open());
    this.bridge.provide('closeAddSheet', () => this.close());
  }

  protected warning(which: 'more' | 'off'): SafeHtml {
    const text = which === 'more' ? " More of what you're already doing" : ' Not what today is for';
    return this.sanitizer.bypassSecurityTrustHtml(this.bridge.call('asyIcon', 'warning', 13) + text);
  }

  protected pick(name: string): void {
    this.bridge.call('applyAddChoice', name);
  }

  protected close(): void {
    document.getElementById('addOverlay')?.classList.remove('open');
  }

  private open(): void {
    const day = this.bridge.call('_liveDay');
    const prog = this.bridge.global('activeProg');
    if (!day || !prog) {
      this.bridge.call('showToast', 'Nothing to add to here');
      return;
    }
    const week = this.bridge.global('currentWeek');
    const c = this.bridge.call('addCandidates', day, week, prog);
    const parseRx = (detail: string, name: string) => this.bridge.call('parseRx', detail, name);
    const PATTERN_REGION = this.bridge.global('_PATTERN_REGION');
    this.view.set(addSheetView({
      title: day.title,
      week,
      setCount: workingSets(day.sections, parseRx),
      candidates: c,
      addedSets: (n) => parseRx(this.bridge.call('addedDetailFor', day, n, week, prog), n)?.sets ?? null,
      regionOf: (n) => PATTERN_REGION[(this.bridge.call('_pattern', n) as string)] ?? null,
    }));
    this.cdr.detectChanges();
    const o = document.getElementById('addOverlay');
    if (o) {
      o.classList.add('open');
      o.scrollTop = 0;
    }
  }
}
