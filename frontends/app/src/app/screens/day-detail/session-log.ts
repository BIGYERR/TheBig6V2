import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { type LegacyArgs, LegacyBridge, type LegacyFunction } from '../../legacy/legacy-bridge';
import type { LogEntry, SessionLogData } from './session-log-model';
import { CardioFields } from './cardio-fields';
import { cardioFields } from './cardio-fields-model';
import { fieldReads } from './cardio-fields-reads';
import type { BridgeLike } from './session-sections-reads';

/** The cardio fields the legacy sheet wired to save as they change, once the card holds a logged number. */
const CARDIO_FIELD_IDS = ['log_run_dist', 'log_run_pace', 'log_run_mins', 'log_run_rep_time', 'log_bike_mins', 'log_swim_yards'];

/**
 * The session sheet's log (architecture phase E, step 27), in place of the legacy buildLogHTML markup: the RPE slider
 * and its words, the day's cardio (its fields, the "different activity" picker with its sport chips and note, its Log
 * button) and the notes. The cardio fields are the CardioFields component since step 32, and the picker's sport change
 * (the legacy setCardioSwap, taken over through LegacyBridge.provide) draws them again here. The ids, data attributes
 * and handlers are the legacy ones, because the legacy updateRPEDisplay, toggleCardioPicker, cardioLive and logCardio
 * still read and change the section in place, and the sheet's wiring saves its fields as they change.
 */
@Component({
  selector: 'ia-session-log',
  host: { style: 'display: contents' },
  imports: [CardioFields],
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
          <div id="cardioFields">@for (fx of [fieldsNow()]; track fx) {<ia-cardio-fields [fields]="fx" />}</div>
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
  private readonly cdr = inject(ChangeDetectorRef);
  readonly log = input.required<SessionLogData>();
  /** The fields on show: the log's, until the picker changes the sport. */
  protected readonly fieldsNow = linkedSignal(() => this.log().fields);

  constructor() {
    this.bridge.provide('setCardioSwap', (sport: string) => this.swap(sport));
  }

  /**
   * The legacy setCardioSwap: the chip credits the sport, it never erases. The form is committed under the leaving sport,
   * its numbers park on the entry and the arriving sport's come back, the fields are drawn for the new sport (with the
   * planned dose only for the planned sport), the chips and the note follow, and the new fields are wired, wheeled and
   * saved, in the legacy order.
   */
  private swap(sport: string): void {
    const b = this.bridge;
    const wrap = document.getElementById('cardioSwapWrap');
    if (!wrap) return;
    const planned = wrap.dataset['planned'] || '';
    const leaving = wrap.dataset['active'] || planned;
    b.call('iaWheelFlush', wrap);
    b.call('persistLogFields', b.global('currentDayKey'));
    const logs = b.call('getLogs');
    const key = b.call('logKey', b.global('currentWeek'), b.global('currentDayKey'));
    const e: LogEntry = logs[key] || {};
    const park = b.global('CARDIO_PARK_FIELDS') as Record<string, string[] | undefined>;
    if (sport !== leaving) {
      const P: Record<string, Record<string, unknown>> = Object.assign({}, (e['parked'] as Record<string, Record<string, unknown>>) || {});
      const out: Record<string, string> = {};
      (park[leaving] || []).forEach((f) => {
        out[f] = e[f] == null ? '' : String(e[f]);
        e[f] = '';
      });
      if (Object.keys(out).some((f) => out[f] !== '')) P[leaving] = out;
      else delete P[leaving];
      const back = P[sport] || null;
      (park[sport] || []).forEach((f) => {
        e[f] = back && back[f] != null ? back[f] : '';
      });
      delete P[sport];
      if (Object.keys(P).length) e['parked'] = P;
      else delete e['parked'];
      logs[key] = e;
      b.call('saveLogs', logs);
    }
    wrap.dataset['active'] = sport;
    b.call('_setCurLogDose', sport === planned ? b.global('_curLogDoseFull') : null);
    this.fieldsNow.set(cardioFields(sport, e, b.global('_curLogDose'), b.global('_curLogSub'), fieldReads(b as unknown as BridgeLike)));
    this.cdr.detectChanges();
    wrap.querySelectorAll<HTMLElement>('#cardioPicker button[data-sport]').forEach((btn) => {
      const on = btn.dataset['sport'] === sport;
      btn.style.border = '1px solid ' + (on ? 'var(--accent)' : 'var(--border2)');
      btn.style.background = on ? 'rgba(24,23,18,0.12)' : 'var(--surface2)';
      btn.style.color = on ? 'var(--accent)' : 'var(--muted)';
    });
    const note = document.getElementById('cardioSwapNote');
    if (note) {
      if (sport !== planned) {
        note.style.display = 'block';
        note.textContent = b.call('cardioSwapNoteText', sport, planned, e);
      } else {
        note.style.display = 'none';
        note.textContent = '';
      }
    }
    for (const id of CARDIO_FIELD_IDS) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          if (b.call('cardioLive', b.global('currentDayKey'))) b.call('persistLogFields', b.global('currentDayKey'));
          b.call('updateDoseDerived');
        });
      }
    }
    b.call('iaWheelInit');
    b.call('updateDoseDerived');
    b.call('persistLogFields', b.global('currentDayKey'));
  }
  protected readonly markup = computed(() => {
    const { view } = this.log();
    const h = (s: string): SafeHtml => this.sanitizer.bypassSecurityTrustHtml(s);
    const icon = (key: string, size: number) => this.bridge.call('asyIcon', key, size);
    return {
      link: h(icon('history', 13) + ' Did a different activity?'),
      chips: (view.cardio?.chips || []).map((ch) => h(icon(ch.sport, 15) + '<span>' + ch.label + '</span>')),
      // The notes as the legacy builder wrote them between the box's tags: read as the box's text, entities and all.
      notes: h(view.notes),
    };
  });

  protected call<K extends LegacyFunction>(name: K, ...args: LegacyArgs<K>): void {
    this.bridge.call(name, ...args);
  }

  /** The slider's legacy handler: the words beside it, and the mark that says the athlete set it. */
  protected rpe(e: Event): void {
    this.bridge.call('updateRPEDisplay', (e.target as HTMLInputElement).value);
  }
}
