import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { type LegacyArgs, LegacyBridge, type LegacyFunction } from '../../legacy/legacy-bridge';
import type { SectionView } from './session-sections-model';

/**
 * A day's sections and their exercise cards (architecture phase E, step 28), in place of the legacy buildSectionsHTML
 * and buildExItem markup: the Main and Primer labels, the athlete's added block and the hip block under their own
 * labels, the core block, a conditioning round with its header and minus (or reduced to straight sets when one
 * movement is left, or struck through when skipped), and each exercise's card: its name and controls, the prescription,
 * the swap and added chips, the set rows with their steppers, deltas and load cells, the load field, the reuse pill
 * and its stale warning, the fill-every-set pill and Log. The ids, classes and data attributes are the legacy ones,
 * because the legacy set handlers still read and change the cards in place; the cards are drawn afresh with the sheet.
 */
@Component({
  selector: 'ia-session-sections',
  host: { style: 'display: contents' },
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <!-- A new list is drawn afresh, as the legacy markup was written anew: the legacy handlers own the cards' state between draws. -->
  @for (list of [sections()]; track list) {
  @for (sec of list; track $index) {
    @if (sec.kind === 'skippedRound') {
      <div class="section"><div class="ex-skipped"><span class="ex-skipped-lbl">Skipped</span><span class="ex-skipped-name">{{ sec.text }}</span><button class="ex-skipped-undo" (click)="call('unskipSuperset', sec.secIdx, src())">Put it back</button></div></div>
    } @else {
      <div class="section">
        @if (sec.label !== null) {<div class="section-label" [innerHTML]="html(sec.label)"></div>}
        @if (sec.body.kind === 'block') {
          @if (sec.body.label; as l) {
            @if (l.markup) {<div class="section-label" [style.color]="l.color" [innerHTML]="html(l.text)"></div>} @else {<div class="section-label" [style.color]="l.color">{{ l.text }}</div>}
          }
          <div class="section-block"><ng-container [ngTemplateOutlet]="cards" [ngTemplateOutletContext]="{ $implicit: sec.body.items }" /></div>
        } @else if (sec.body.kind === 'core') {
          <div class="core-block"><div class="core-header" [innerHTML]="html(sec.body.header)"></div><ng-container [ngTemplateOutlet]="cards" [ngTemplateOutletContext]="{ $implicit: sec.body.items }" /></div>
        } @else {
          <div class="superset-wrap"><div class="superset-header"><span class="sshdr-txt" [innerHTML]="html(sec.body.header)"></span><button class="ss-minus" (click)="call('skipSuperset', sec.body.secIdx, src())" aria-label="Skip this round" [innerHTML]="icon('minus', 15)"></button></div><ng-container [ngTemplateOutlet]="cards" [ngTemplateOutletContext]="{ $implicit: sec.body.items }" /></div>
        }
      </div>
    }
  }
  }
  <ng-template #cards let-items>
    @for (x of items; track $index) {
      @if (x.kind === 'skipped') {
        <div class="ex-skipped"><span class="ex-skipped-lbl">Skipped</span><span class="ex-skipped-name">{{ x.name }}</span><button class="ex-skipped-undo" (click)="call('unskipExercise', x.name, src())">Put it back</button></div>
      } @else {
        <div [attr.class]="'exercise-item' + (x.logged ? ' logged' : '')" [id]="'excard_' + x.exKey">
          <div class="ex-namerow">
            <span class="ex-name" [innerHTML]="html(x.name)"></span>
            @if (x.swap; as sw) {<button type="button" class="ex-swapbtn" aria-label="Swap this exercise" (click)="call('openSwapSheet', sw.secIdx, sw.itemIdx, src())" [innerHTML]="icon('swap', 16)"></button>}
            @if (x.skip) {<button type="button" class="ex-skipbtn" aria-label="Skip this exercise" (click)="call('skipExercise', x.name, src())" [innerHTML]="icon('minus', 16)"></button>}
            <span class="ex-badge" [id]="'exbadge_' + x.exKey">@if (x.logged) {✓}</span>
          </div>
          @if (x.detail) {<div class="ex-detail" [innerHTML]="html(x.detail)"></div>}
          @if (x.added) {<div class="ex-swapchip"><span class="ex-swapchip-lbl">YOU ADDED THIS</span>{{ ' · not in the plan' }}<button type="button" class="ex-swapundo" (click)="call('removeAddedExercise', x.name)">remove</button></div>}
          @if (x.swappedFrom; as from) {<div class="ex-swapchip"><span class="ex-swapchip-lbl">SWAPPED IN</span>{{ ' for ' + from }}<button type="button" class="ex-swapundo" (click)="call('undoSwap', from, src())">put it back</button></div>}
          @if (x.log; as lg) {
            <div class="ex-log" [id]="'exlog_' + x.exKey">
              @if (lg.sets; as st) {
                <button type="button" class="exset-head" (click)="call('toggleSets', x.exKey)">
                  <span class="exset-head-lbl">Sets</span>
                  <span class="exset-head-val" [id]="'exsum_' + x.exKey">{{ st.head }}</span>
                  <span class="exset-head-sub" [id]="'exsumsub_' + x.exKey">{{ st.sub }}</span>
                  <span class="exset-head-sp"></span>
                  <span class="exset-head-vary" [id]="'exvary_' + x.exKey" [style.display]="st.varied ? null : 'none'">Varied</span>
                  <span class="exset-caret" [innerHTML]="icon('chevronDown', 20)"></span>
                </button>
                <div class="exset-rows" [id]="'exrows_' + x.exKey">
                  @for (row of st.rows; track row.s) {
                    <div class="exset-row" [id]="'exsetrow_' + x.exKey + '_' + row.s">
                      <span class="exset-num">{{ row.s + 1 }}</span>
                      <div class="exset-ctl">
                        <button type="button" class="exset-btn" (click)="call('stepSet', row.rowId, -row.step)">−</button>
                        <span class="exset-val">
                          <input [id]="row.rowId" [attr.class]="row.cls" inputmode="numeric" [attr.value]="row.value" [attr.placeholder]="row.placeholder" [attr.data-rx]="row.rx" (input)="call('setDelta', row.rowId)" (blur)="call('autoSaveSets', x.exKey)">
                          @if (row.suffix) {<span class="exset-suf">{{ row.suffix }}</span>}
                          <span [attr.class]="row.deltaCls" [id]="row.rowId + '_d'">{{ row.deltaText }}</span>
                        </span>
                        <button type="button" class="exset-btn" (click)="call('stepSet', row.rowId, row.step)">+</button>
                      </div>
                      @if (row.weight; as w) {
                        <div class="exset-w"><span class="exset-toppip">Top</span><input inputmode="numeric" [id]="w.id" [attr.class]="w.cls" [attr.value]="w.value" placeholder="" (input)="call('onSetWeight', x.exKey, row.s)" (blur)="call('autoSaveSets', x.exKey)"><span class="exset-w-u">{{ w.unit }}</span></div>
                      }
                    </div>
                  }
                </div>
                @if (st.foot; as ft) {<div class="exset-foot"><span class="exset-foot-lbl" [id]="'extoplbl_' + x.exKey">{{ ft }}</span><span class="exset-foot-val" [id]="'extop_' + x.exKey">—</span><span class="exset-foot-note">This is what tracks<br>your progress</span></div>}
              }
              @if (lg.load; as ld) {
                <div class="ex-weight">
                  <span class="ex-weight-lbl">{{ ld.label }}</span>
                  <input type="number" inputmode="numeric" [id]="'exw_' + x.exKey" [attr.value]="ld.value" placeholder="" min="0" [attr.step]="ld.step" class="ex-winput" (input)="call('cascadeSetWeights', x.exKey)" (blur)="call('autoSaveSets', x.exKey)">
                  <span class="ex-wunit">{{ ld.unit }}</span>
                  @if (ld.reuse; as ru) {<button type="button" [attr.class]="'ex-reuse' + (ru.stale ? ' is-stale' : '')" (click)="call('reuseWeight', x.exKey, ru.value)"><span class="ex-reuse-ico">↺</span><span class="ex-reuse-txt"><span [id]="'exreusenum_' + x.exKey">{{ ru.text }}</span><small [id]="'exrec_' + x.exKey">{{ ru.rec }}</small></span></button>}
                </div>
                @if (ld.warn; as wn) {<div class="ex-stale-warn"><i>△</i><span>{{ wn }}</span></div>}
                @if (ld.fill; as fl) {<button type="button" [attr.class]="'ex-reuse ex-reuse-fill' + (fl.stale ? ' is-stale' : '')" (click)="call('fillAllSetWeights', x.exKey, fl.value)"><span class="ex-reuse-ico">↺</span><span class="ex-reuse-txt">{{ fl.text }}<small>{{ fl.rec }}</small></span></button>}
              }
              <button class="ex-logbtn" (click)="call('saveExWeight', x.exKey, x.name, x.rxDetail)">Log</button>
            </div>
          }
        </div>
      }
    }
  </ng-template>
  `,
})
export class SessionSections {
  private readonly bridge = inject(LegacyBridge);
  private readonly sanitizer = inject(DomSanitizer);
  readonly sections = input.required<SectionView[]>();
  /** v0.246.0 D250 (P-WILDEDIT): 'wild' on Random Workout, whose swap, skip and undo address the Wildcard's own day. */
  readonly src = input<'wild' | undefined>(undefined);
  private readonly safe = new Map<string, SafeHtml>();

  /** Markup from the program or a legacy helper, made ready for the page once per string. */
  protected html(s: string): SafeHtml {
    let h = this.safe.get(s);
    if (!h) {
      h = this.sanitizer.bypassSecurityTrustHtml(s);
      this.safe.set(s, h);
    }
    return h;
  }
  protected icon(key: string, size: number): SafeHtml {
    return this.html(this.bridge.call('asyIcon', key, size));
  }
  protected call<K extends LegacyFunction>(name: K, ...args: LegacyArgs<K>): void {
    this.bridge.call(name, ...args);
  }
}
