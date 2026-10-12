import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { detailBody, hasLogged, liftsFirst, loggedCount, logNudge } from './day-detail-model';

/** A scheduled day, as far as the sheet reads it. */
interface DetailDay {
  title?: string;
  tags?: string[];
  sections?: unknown[];
  cardio?: unknown;
  note?: string;
  testLift?: unknown;
}

/** One open of the sheet. A new object each time, so the sheet is drawn anew, as the legacy writes did. */
interface DetailView {
  over: string;
  title: string;
  tags: SafeHtml;
  counter: string | null;
  body: SafeHtml;
}

/** The fields the legacy sheet wired to save as they change. */
const LOG_FIELDS = ['log_rpe', 'log_run_dist', 'log_run_pace', 'log_run_mins', 'log_run_rep_time', 'log_bike_mins', 'log_swim_yards', 'log_notes'];

/**
 * A day's session sheet (architecture phase E, step 20), in place of the legacy #detailOverlay markup and the
 * openDetail that filled it. It takes over openDetail through LegacyBridge.provide, so every open and every re-render
 * (a skip, a swap, an add, a KB size, the nudge) reaches it. The header (the week and day, the title, the tags, the
 * logged count, Back, RPE and the add button) and the frame are the component's, drawn anew on each call as the legacy
 * writes did. The body is still the legacy builders' markup (the sections and their set logging, the 1RM calculator,
 * the cardio card, the note, the nudges, the session log) and the foot still the legacy renderStatusFoot's, and after
 * each draw the legacy wiring runs as before: the log fields save as they change, the wheels start, the derived dose
 * paints. A re-render keeps the reader where they were; a fresh open starts at the top.
 */
@Component({
  selector: 'ia-day-detail',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @for (v of views(); track v) {
    <div class="detail-header">
      <div class="dh-toprow">
        <button class="dh-back" (click)="call('closeDetail')">‹ Back</button>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="dh-counter" id="detailCounter" [style.display]="v.counter === null ? 'none' : ''">{{ v.counter ?? '' }}</span>
          <button class="dh-rpe-btn" (click)="call('showRpeInfo')" aria-label="What is RPE?">RPE <span style="font-size:12px">ⓘ</span></button>
        </div>
      </div>
      <div class="dh-over"><span class="dh-over-txt" id="detailDayName">{{ v.over }}</span></div>
      <div class="dh-title" id="detailDayTitle">{{ v.title }}</div>
      <div class="dh-tagrow">
        <div class="dh-tags" id="detailTags" [innerHTML]="v.tags"></div>
        <button class="dh-addbtn" id="detailAddBtn" (click)="call('openAddSheet')" aria-label="Add an exercise to this day"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Exercise</button>
      </div>
    </div>
    <div class="detail-body" id="detailBody" [innerHTML]="v.body"></div>
    <div class="detail-foot" id="detailFoot">
      <div id="detailStatusRow"></div>
    </div>
  }
  `,
})
export class DayDetail {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly view = signal<DetailView | null>(null);
  protected readonly views = computed(() => {
    const v = this.view();
    return v ? [v] : [];
  });

  constructor() {
    this.bridge.provide('openDetail', (dayKey: string, day: DetailDay) => this.open(dayKey, day));
  }

  protected call(name: string, ...args: unknown[]): void {
    this.bridge.call(name, ...args);
  }

  /** The legacy openDetail: the sheet drawn anew, the legacy wiring run on it, then shown where the reader was. */
  private open(dayKey: string, day: DetailDay): void {
    const b = this.bridge;
    b.call('_setStaleWarnShown', false);
    b.call('_setStaleWarnSrc', '');
    const prog = b.global<{ cfg?: { unit?: string }; primaryPath?: string; liftingFocus?: string } | null>('activeProg');
    (globalThis as Record<string, unknown>)['_unitLabel'] = prog && prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';
    const ov = document.getElementById('detailOverlay');
    const fresh = !(ov && ov.classList.contains('open') && b.global('currentDayKey') === dayKey);
    const keep = fresh ? 0 : ov!.scrollTop;
    b.call('_setCurrentDayKey', dayKey);
    const week = b.global<number>('currentWeek');
    const comp = b.call<Record<string, { title?: string; status?: string } | undefined>>('getCompleted')[b.call<string>('completedKey', week, dayKey)];
    const progress = b.call<{ done: number; total: number }>('sessionLogProgress', day);
    const tags = b.call<string>('modTagsHTML', day.tags) + b.call<string>('travelTagHTML', day);
    b.call('ruResetIfIdle');

    const secs = day.sections || [];
    const status = comp ? comp.status || 'complete' : null;
    const le = b.call<Record<string, Record<string, unknown> | undefined>>('getLogs')[b.call<string>('logKey', week, dayKey)];
    const html = detailBody({
      lifts: secs.length
        ? b.call<string>('buildSectionsHTML', [secs[0]], 0) + (day.testLift ? b.call<string>('e1rmCalcHTML', day) : '') + b.call<string>('buildSectionsHTML', secs.slice(1), 1)
        : '',
      cardio: b.call<string>('buildCardioHTML', day.cardio),
      note: day.note,
      rangeNudge: b.call<string>('rangeTopNudgeHTML', day),
      wildcardTag: b.call<string>('wildcardTagHTML', week, dayKey),
      log: b.call<string>('buildLogHTML', dayKey, day.cardio),
      logNudge: !status && hasLogged(le) ? logNudge(dayKey, day.title, b.call<string>('asyIcon', 'notebook', 14)) : '',
    }, liftsFirst(secs.length > 0, prog?.primaryPath, prog?.liftingFocus), secs.length > 0);
    this.view.set({
      over: 'Week ' + week + ' · ' + b.global<Record<string, string>>('DAY_FULL')[dayKey],
      title: (comp && comp.title) || day.title || 'Training',
      tags: this.sanitizer.bypassSecurityTrustHtml(tags),
      counter: loggedCount(progress),
      body: this.sanitizer.bypassSecurityTrustHtml(html),
    });
    this.cdr.detectChanges();

    b.call('renderStatusFoot', dayKey, day.title || '');
    for (const id of LOG_FIELDS) {
      const el = document.getElementById(id);
      const free = id === 'log_rpe' || id === 'log_notes';
      if (el) {
        el.addEventListener('input', () => {
          if (free || b.call<boolean>('cardioLive', dayKey)) b.call('persistLogFields', dayKey);
          b.call('updateDoseDerived');
        });
      }
    }
    b.call('iaWheelInit');
    b.call('updateDoseDerived');
    if (ov) {
      ov.classList.add('open');
      ov.scrollTop = fresh ? 0 : keep;
    }
  }
}
