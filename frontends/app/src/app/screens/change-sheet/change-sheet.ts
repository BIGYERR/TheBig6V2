import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { type ChangeSheetView, changeSheetView, type DraftKey, type OverlayDraft, type PreviewOverlay, type SheetAction } from './change-sheet-model';

/**
 * The injury and travel sheet's body (architecture phase E, step 10), in place of the legacy renderOverlaySheet inside
 * #changeBody (the sheet's frame and its Back button stay the legacy markup). The draft stays the legacy `_ovDraft`:
 * each choice is still the legacy _ovSet, which redraws through renderOverlaySheet, and the foot's button is still the
 * legacy applyOverlayDraft, applyInjuryDraft or closeOverlaySheet. renderOverlaySheet reaches the component through
 * LegacyBridge.provide and draws at once, before the sheet opens, as the legacy write did.
 */
@Component({
  selector: 'ia-change-sheet',
  host: { style: 'display: contents' },
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (view(); as v) {
    <div class="ov-kicker">{{ v.kicker }}</div><div class="ov-title">{{ v.title }}</div><div class="ov-intro">{{ v.intro }}</div>
    @if (v.travel; as tr) {
      @if (tr.dates; as dates) {
        <ng-container *ngTemplateOutlet="dateRow; context: { $implicit: dates, style: null }"></ng-container>
      }
      <div class="ov-eq-lbl">WHAT YOU’LL HAVE</div>
      @for (c of tr.cards; track c.id) {
        <ng-container *ngTemplateOutlet="card; context: { $implicit: c }"></ng-container>
      }
      <ng-container *ngTemplateOutlet="effect; context: { $implicit: tr.effect }"></ng-container>
      <ng-container *ngTemplateOutlet="foot; context: { $implicit: tr.action }"></ng-container>
    }
    @if (v.injury; as inj) {
      <div class="ov-eq-lbl">WHERE’S THE PROBLEM</div>
      @for (c of inj.regions; track c.id) {
        <ng-container *ngTemplateOutlet="card; context: { $implicit: c }"></ng-container>
      }
      @if (inj.tiers; as tiers) {
        <div class="ov-eq-lbl" style="margin-top:12px">HOW BAD IS IT</div>
        @for (c of tiers; track c.id) {
          <ng-container *ngTemplateOutlet="card; context: { $implicit: c }"></ng-container>
        }
      }
      @if (inj.effect; as e) {
        <ng-container *ngTemplateOutlet="effect; context: { $implicit: e }"></ng-container>
      }
      @if (inj.dates; as dates) {
        <ng-container *ngTemplateOutlet="dateRow; context: { $implicit: dates, style: 'margin-top:12px' }"></ng-container>
      }
      @if (inj.action; as a) {
        <ng-container *ngTemplateOutlet="foot; context: { $implicit: a }"></ng-container>
      }
    }
  }
  <ng-template #card let-c>
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy choice card, kept as it was -->
    <div [class]="'ov-eq' + (c.sel ? ' sel' : '')" (click)="set(c.key, c.id)"><div class="ov-eq-body"><div class="ov-eq-name">{{ c.name }}</div>@if (c.desc) {<div class="ov-eq-desc">{{ c.desc }}</div>}</div>@if (c.sel) {<span class="ov-eq-chk">✓</span>}</div>
  </ng-template>
  <ng-template #effect let-e>
    <div class="ov-effect">@if (e.title !== null) {<div class="ov-effect-ttl">{{ e.title }}</div>}@for (s of e.subs; track $index) {<div class="ov-effect-sub" [attr.style]="s.style">{{ s.text }}</div>}</div>
  </ng-template>
  <ng-template #dateRow let-dates let-style="style">
    <div class="ov-dates" [attr.style]="style">@for (f of dates; track f.key) {<label class="ov-date"><span class="ov-date-lbl">{{ f.label }}</span><span class="ov-date-val">{{ f.shown }}</span><input type="date" [attr.min]="f.min" [value]="f.value" (change)="date(f.key, $event)"></label>}</div>
  </ng-template>
  <ng-template #foot let-a>
    <button class="ov-apply" (click)="act(a)">{{ a === 'close' ? 'Got it' : 'Apply change' }}</button>
  </ng-template>
  `,
})
export class ChangeSheet {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly view = signal<ChangeSheetView | null>(null);

  constructor() {
    this.bridge.provide('renderOverlaySheet', () => this.render());
  }

  protected set(key: DraftKey, value: string): void {
    this.bridge.call('_ovSet', key, value);
  }
  protected date(key: DraftKey, e: Event): void {
    this.bridge.call('_ovSet', key, (e.target as HTMLInputElement).value);
  }
  protected act(a: SheetAction): void {
    this.bridge.call(a === 'travel' ? 'applyOverlayDraft' : a === 'injury' ? 'applyInjuryDraft' : 'closeOverlaySheet');
  }

  /** The legacy renderOverlaySheet: drawn at once. */
  private render(): void {
    const prog = this.bridge.global<{ totalWeeks?: number } | null>('activeProg');
    const tw = (prog && prog.totalWeeks) || 0;
    this.view.set(changeSheetView(this.bridge.global<OverlayDraft>('_ovDraft'), this.bridge.global<Record<string, { label: string }>>('INJURY_REGIONS'), {
      fmtDate: (iso) => this.bridge.call<string>('_fmtDate', iso),
      fmtDateWd: (iso) => this.bridge.call<string>('_fmtDateWd', iso),
      dayCount: (from, to) => this.bridge.call<number>('_dayCount', from, to),
      dayCountWord: (n) => this.bridge.call<string>('_dayCountWord', n),
      inProgram: (ov: PreviewOverlay) => !!this.bridge.call('overlayWeekRange', prog, ov, tw),
      backCopy: (ov: PreviewOverlay) => this.bridge.call<string>('overlayBackCopy', prog, ov),
    }));
    this.cdr.detectChanges();
  }
}
