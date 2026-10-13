import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { type BodyBlock, detailBody, e1rmCard, type FootButton, hasLogged, liftsFirst, loggedCount, logNudge, rangeNudge, statusFoot } from './day-detail-model';
import { E1rmCard } from './e1rm-card';
import { CardioCard } from './cardio-card';
import { cardioCard, type CardioRx } from './cardio-card-model';
import { SessionLog } from './session-log';
import { type LogEntry, sessionLog, type SessionLogData } from './session-log-model';

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
  body: (BodyBlock | { kind: 'html'; html: SafeHtml })[];
}

/** The fields the legacy sheet wired to save as they change. */
const LOG_FIELDS = ['log_rpe', 'log_run_dist', 'log_run_pace', 'log_run_mins', 'log_run_rep_time', 'log_bike_mins', 'log_swim_yards', 'log_notes'];

/**
 * A day's session sheet (architecture phase E, step 20), in place of the legacy #detailOverlay markup and the
 * openDetail that filled it. It takes over openDetail through LegacyBridge.provide, so every open and every re-render
 * (a skip, a swap, an add, a KB size, the nudge) reaches it. The header (the week and day, the title, the tags, the
 * logged count, Back, RPE and the add button) and the frame are the component's, drawn anew on each call as the legacy
 * writes did. The body is a list of blocks: the legacy builders' markup (the sections and their set logging, the note,
 * the log nudge), each laid in a box that makes none of its own, the test-week 1RM calculator (E1rmCard) and the
 * range-top nudge since step 24, the cardio card (CardioCard) since step 25, and the session log (SessionLog) since
 * step 27. The foot (Done and Skip, each undoing itself) is the
 * component's since step 23: it takes over renderStatusFoot, which the legacy handleDayStatus calls on every status
 * change. After each draw the legacy wiring runs as before: the log fields save as they change, the wheels start, the derived dose
 * paints. A re-render keeps the reader where they were; a fresh open starts at the top.
 */
@Component({
  selector: 'ia-day-detail',
  host: { style: 'display: contents' },
  imports: [CardioCard, E1rmCard, SessionLog],
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
    <div class="detail-body" id="detailBody">
      @for (blk of v.body; track $index) {
        @switch (blk.kind) {
          @case ('html') { <div style="display:contents" [innerHTML]="blk.html"></div> }
          @case ('e1rm') { <ia-e1rm-card [card]="blk.card" /> }
          @case ('cardio') { <ia-cardio-card [card]="blk.card" /> }
          @case ('log') { <ia-session-log [log]="blk.log" /> }
          @case ('nudge') { <div class="prog-nudge"><b>Time to add weight.</b>{{ ' Last session you hit the top of the range on every set of ' }}@for (n of blk.nudge.shown; track $index; let last = $last) {<b>{{ n }}</b>@if (!last) {{{ ' and ' }}}}{{ blk.nudge.extra + '. Go up in weight today and start back at the bottom of the range.' }}</div> }
        }
      }
    </div>
    <div class="detail-foot" id="detailFoot">
      <div id="detailStatusRow">@if (foot(); as f) {<div class="status-stack">@for (btn of f.buttons; track btn.id) {<button [class]="btn.cls" [id]="btn.id" (click)="call('handleDayStatus', f.dayKey, f.title, btn.status)">{{ btn.label }}@if (btn.undo) {<small>tap to undo</small>}</button>}</div>}</div>
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
  /** The status foot's two buttons, for the day the sheet shows. */
  protected readonly foot = signal<{ dayKey: string; title: string; buttons: FootButton[] } | null>(null);

  constructor() {
    this.bridge.provide('openDetail', (dayKey: string, day: DetailDay) => this.open(dayKey, day));
    this.bridge.provide('renderStatusFoot', (dayKey: string, title: string) => this.renderFoot(dayKey, title));
  }

  /** The legacy renderStatusFoot: the foot drawn again for the day's status, once the sheet has been drawn. */
  private renderFoot(dayKey: string, title: string): void {
    if (!this.view()) return;
    this.foot.set({ dayKey, title: title || '', buttons: statusFoot(this.bridge.call<string | undefined>('statusOf', this.bridge.global<number>('currentWeek'), dayKey)) });
    this.cdr.detectChanges();
  }

  /** A legacy read that the legacy sheet guarded: a failure draws nothing for that piece, as before. */
  private safeRead<T>(read: () => T, fallback: T): T {
    try {
      return read();
    } catch {
      return fallback;
    }
  }

  protected call(name: string, ...args: unknown[]): void {
    this.bridge.call(name, ...args);
  }

  /** The legacy buildLogHTML's reads: the day's entry, then the log drawn from it through the legacy helpers. */
  private log(dayKey: string, cardio: { type?: string; subtype?: string } | undefined): SessionLogData {
    const b = this.bridge;
    const entry = b.call<Record<string, LogEntry | undefined>>('getLogs')[b.call<string>('logKey', b.global<number>('currentWeek'), dayKey)] || {};
    return sessionLog(entry, cardio, {
      rpeLabels: b.global<Record<number, string>>('RPE_LABELS'),
      dose: (c) => b.call('doseFromCardio', c),
      setDoseFull: (d) => b.call('_setCurLogDoseFull', d),
      setSub: (s) => b.call('_setCurLogSub', s),
      setDose: (d) => b.call('_setCurLogDose', d),
      fields: (sport, e, dose, sub) => b.call<string>('cardioFieldHTML', sport, e, dose, sub),
      live: (e, sport) => b.call<boolean>('cardioEntryLive', e, sport),
      noteText: (active, planned, e) => b.call<string>('cardioSwapNoteText', active, planned, e),
      logLabel: (live) => b.call<string>('cardioLogLabel', live),
    });
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
    const store = this.safeRead(() => b.call<Record<string, { entries?: { weight?: string | number; setsDone?: (string | number)[] }[] } | undefined>>('getExWeights'), {});
    const lastOf = (name: string | undefined) => {
      const row = store[b.call<string>('exStoreKey', name)];
      return ((row && row.entries) || []).slice(-1)[0];
    };
    const mainName = this.safeRead(() => (secs[0] as { items: { name?: string }[] }).items[0]!.name, undefined);
    const unit = (globalThis as Record<string, unknown>)['_unitLabel'] as string || 'lbs';
    const items = secs.flatMap((sec) => ((sec as { items?: { name?: string; detail?: string }[] }).items || []));
    const body = detailBody({
      main: secs.length ? b.call<string>('buildSectionsHTML', [secs[0]], 0) : '',
      e1rm: day.testLift ? e1rmCard(String(day.testLift), unit, this.safeRead(() => lastOf(mainName), undefined)) : null,
      rest: secs.length ? b.call<string>('buildSectionsHTML', secs.slice(1), 1) : '',
      cardio: cardioCard(day.cardio as CardioRx | undefined, day.cardio ? b.call<string>('_benchStripHTML', day.cardio) : ''),
      note: day.note,
      nudge: this.safeRead(() => rangeNudge(items, lastOf), null),
      wildcardTag: b.call<string>('wildcardTagHTML', week, dayKey),
      log: this.log(dayKey, day.cardio as { type?: string; subtype?: string } | undefined),
      logNudge: !status && hasLogged(le) ? logNudge(dayKey, day.title, b.call<string>('asyIcon', 'notebook', 14)) : '',
    }, liftsFirst(secs.length > 0, prog?.primaryPath, prog?.liftingFocus), secs.length > 0);
    this.view.set({
      over: 'Week ' + week + ' · ' + b.global<Record<string, string>>('DAY_FULL')[dayKey],
      title: (comp && comp.title) || day.title || 'Training',
      tags: this.sanitizer.bypassSecurityTrustHtml(tags),
      counter: loggedCount(progress),
      body: body.map((blk) => (blk.kind === 'html' ? { kind: 'html' as const, html: this.sanitizer.bypassSecurityTrustHtml(blk.html) } : blk)),
    });
    this.foot.set(null);
    this.cdr.detectChanges();

    this.renderFoot(dayKey, day.title || '');
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
