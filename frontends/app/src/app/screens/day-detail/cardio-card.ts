import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import type { CardioCardView } from './cardio-card-model';

/**
 * The session sheet's cardio card (architecture phase E, step 25), in place of the legacy buildCardioHTML markup: the
 * sport and session, the swim segments with their total or the prescription, the note, and the retest strip (its lines
 * from sheet-marks-model's benchNotes since step 30). The prescription's words are the engine's markup, as before.
 */
@Component({
  selector: 'ia-cardio-card',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let c = card();
  @let m = markup();
  <div [class]="c.blockCls"><div [class]="'cardio-type-label ' + c.labelCls" [innerHTML]="m.label"></div>@if (m.segments; as segs) {@for (sg of segs; track $index) {<div class="swim-seg"><div class="swim-seg-label" [innerHTML]="sg.label"></div><div class="swim-seg-body" [innerHTML]="sg.text"></div></div>}@if (c.total) {<div class="swim-total">{{ c.total }}</div>}} @else {<div class="cardio-detail" [innerHTML]="m.detail"></div>}@if (m.note) {<div class="cardio-note" [innerHTML]="m.note"></div>}@for (n of c.bench; track $index) {<div class="cardio-note">@if (n.lead) {<b>{{ n.lead }}</b>}{{ n.text }}</div>}</div>
  `,
})
export class CardioCard {
  private readonly sanitizer = inject(DomSanitizer);
  readonly card = input.required<CardioCardView>();
  protected readonly markup = computed(() => {
    const c = this.card();
    const h = (s: string): SafeHtml => this.sanitizer.bypassSecurityTrustHtml(s);
    return {
      label: h(c.label),
      segments: c.segments ? c.segments.map((sg) => ({ label: h(sg.label), text: h(sg.text) })) : null,
      detail: h(c.detail),
      note: c.note ? h(c.note) : null,
    };
  });
}
