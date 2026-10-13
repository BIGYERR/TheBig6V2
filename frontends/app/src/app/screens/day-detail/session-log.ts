import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import type { SessionLogData } from './session-log-model';

/**
 * The session sheet's log (architecture phase E, step 27), in place of the legacy buildLogHTML markup: the RPE slider
 * and its words, the day's cardio (its fields, the "different activity" picker with its sport chips and note, its Log
 * button) and the notes. The cardio fields are still the legacy cardioFieldHTML's markup. The ids, data attributes and
 * handlers are the legacy ones, because the legacy updateRPEDisplay, toggleCardioPicker, setCardioSwap, cardioLive and
 * logCardio still read and change the section in place, and the sheet's wiring saves its fields as they change.
 */
@Component({
  selector: 'ia-session-log',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let v = log().view;
  @let m = markup();
  <div class="log-section" id="logSection">
    <div class="log-header"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex:0 0 auto;margin-right:6px"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>Log This Session</div>
    <div class="log-body">
      <div class="log-field">
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was (its slider sits outside it) -->
        <label>How hard was it? — RPE <button type="button" (click)="call('showRpeInfo')" aria-label="What is RPE?" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:0 2px;vertical-align:baseline">ⓘ</button></label>
        <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
          <input type="range" min="1" max="10" step="1" [value]="v.rpeValue" id="log_rpe" (input)="rpe($event)" style="flex:1">
          <div id="rpeDisplay" style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--accent);min-width:120px;text-align:right">{{ v.rpeText }}</div>
        </div>
      </div>
      @if (v.cardio; as c) {
        <div class="log-field" id="cardioSwapWrap" [attr.data-planned]="c.planned" [attr.data-active]="c.active" [attr.data-logged]="c.logged ? '1' : '0'">
          <div id="cardioFields" [innerHTML]="m.fields"></div>
          <button type="button" id="cardioSwapLink" (click)="call('toggleCardioPicker')" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:6px 0 0;display:inline-flex;align-items:center;gap:5px;text-decoration:underline;text-underline-offset:2px" [innerHTML]="m.link"></button>
          <div id="cardioPicker" style="margin-top:8px" [style.display]="c.swapped ? 'block' : 'none'">
            <div style="font-size:10px;color:var(--muted);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">Logged as</div>
            <div style="display:flex;gap:6px">@for (ch of c.chips; track ch.sport; let i = $index) {<button type="button" [attr.data-sport]="ch.sport" (click)="call('setCardioSwap', ch.sport)" [attr.style]="ch.style" [innerHTML]="m.chips[i]"></button>}</div>
            <div id="cardioSwapNote" style="font-size:11px;color:var(--accent);margin-top:8px;line-height:1.4" [style.display]="c.swapped ? 'block' : 'none'">{{ c.note }}</div>
          </div>
          <button type="button" id="cardioLogBtn" [class]="'ex-logbtn' + (c.logged ? ' logged' : '')" (click)="call('logCardio')">{{ c.logLabel }}</button>
        </div>
      }
      <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was -->
      <div class="log-field"><label>Notes</label>
        <textarea id="log_notes" placeholder="How did it go? Anything to remember next week?" class="input-field" style="resize:none;height:64px;line-height:1.4" [innerHTML]="m.notes"></textarea>
      </div>
    </div>
  </div>
  `,
})
export class SessionLog {
  private readonly bridge = inject(LegacyBridge);
  private readonly sanitizer = inject(DomSanitizer);
  readonly log = input.required<SessionLogData>();
  protected readonly markup = computed(() => {
    const { view, fields } = this.log();
    const h = (s: string): SafeHtml => this.sanitizer.bypassSecurityTrustHtml(s);
    const icon = (key: string, size: number) => this.bridge.call<string>('asyIcon', key, size);
    return {
      fields: h(fields),
      link: h(icon('history', 13) + ' Did a different activity?'),
      chips: (view.cardio?.chips || []).map((ch) => h(icon(ch.sport, 15) + '<span>' + ch.label + '</span>')),
      // The notes as the legacy builder wrote them between the box's tags: read as the box's text, entities and all.
      notes: h(view.notes),
    };
  });

  protected call(name: string, ...args: unknown[]): void {
    this.bridge.call(name, ...args);
  }

  /** The slider's legacy handler: the words beside it, and the mark that says the athlete set it. */
  protected rpe(e: Event): void {
    this.bridge.call('updateRPEDisplay', (e.target as HTMLInputElement).value);
  }
}
