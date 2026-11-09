import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, type ElementRef, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { type LegacyArgs, LegacyBridge, type LegacyFunction } from '../../legacy/legacy-bridge';
import { wildcardSub } from '../day-detail/sheet-marks-model';
import { WildcardMark, WildcardTag } from '../marks/wildcard';
import { DeckState } from '../deck/deck-state';
import { type RecordFrom, RecordState } from '../run-recorder/record-host';
import { cardRoute, type CardioOnly, recordWorkout } from '../day-detail/cardio-sheet-model';
import type { CardioRx } from '../day-detail/cardio-card-model';
import { SheetMode } from '../day-detail/sheet-mode';
import { recorderAvailable } from '../run-recorder/run-recorder-model';
import { type DayCard, type Overlay, TITLE_W, type WeekDay, type WeekView as View, liveTitle, weekView } from './week-view-model';

/** The screen before any program is drawn. */
const BLANK: View = {
  overline: 'The Asylum', pill: { html: '', cls: '' }, injuryWeek: false, hurt: { injured: false, label: 'Hurt?' },
  titles: [{ n: 1, title: 'Week 1', active: true }], row: { kind: 'start', shown: null, iso: '' }, days: null,
};

/**
 * This Week (D276 P-WEEKSCREEN, docs/decisions/this-week.md): Mario's redesign. The week titles snap sideways in a
 * strip of their own (the only thing on the screen that swipes); the day strip runs Sunday first, a title's Sunday the
 * program week before it, and the strip ends on Race Day or Last day; a tap on a day picks it into the cards below. The
 * run card records the run (D272, D267's recorder grown out of the card, Amendment 2) and the lift card opens the swipe
 * deck (D275, DeckState.start); a done card shows its own Reopen. The recorder and the deck sit outside this screen
 * (RecordHost and Deck, beside it in the legacy host), so the screen's shrink under them never holds them. It takes over renderWeekView through
 * LegacyBridge.provide, so every legacy caller reaches it, and it keeps the legacy `currentWeek` on the program week of
 * what it shows or opens: the title's own, or the week before for a Sunday.
 */
@Component({
  selector: 'ia-week-view',
  host: { style: 'display: contents' },
  imports: [WildcardMark, WildcardTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let v = view();
  <div class="wk-topbar tw-top">
    <div class="wk-overline tw-over" id="weekOverline">{{ v.overline }}</div>
    <div class="tw-titles">
      <div class="tw-strip" #strip id="weekScroll" role="group" aria-label="Choose a week" (scroll)="scrolled()" (pointerdown)="dragDown($event)" (pointermove)="dragMove($event)" (pointerup)="dragUp()" (pointercancel)="dragUp()">
        @for (t of v.titles; track t.n) {
          <button type="button" [class]="'tw-title' + (t.active ? ' on' : '')" [attr.aria-current]="t.active ? 'true' : null" (click)="pickTitle(t.n)">{{ t.title }}</button>
        }
      </div>
      <div class="tw-fade" aria-hidden="true"></div>
      <button type="button" [class]="'tw-hurt' + (v.hurt.injured ? ' is-injured' : '')" id="hurtBtn" (click)="call('openInjurySheet')" aria-label="Report or manage an injury"><span id="hurtLbl">{{ v.hurt.label }}</span></button>
    </div>
  </div>
  <div class="tw-row">
    @if (v.row.kind === 'race') {
      <label class="tw-race" id="raceDateWrap" aria-label="Race date">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>
        <span class="tw-race-stack"><span class="tw-race-big">{{ v.row.big }}</span><span class="tw-race-small" id="raceDateDisplay">{{ v.row.small }}</span></span>
        <input type="date" id="raceDateInput" class="wk-startdate-native" [value]="v.row.iso" (change)="setDate('setProgRace', $event)">
      </label>
    } @else {
      <label class="wk-startdate" aria-label="Program start date">
        <svg class="wk-cal-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span class="wk-startdate-stack">
          <span class="wk-startdate-lbl">Program Start</span>
          <span id="startDateDisplay" [class]="'wk-startdate-txt' + (v.row.shown ? '' : ' is-unset')">{{ v.row.shown || 'Set date' }}</span>
        </span>
        <input type="date" id="startDateInput" class="wk-startdate-native" [value]="v.row.iso" (change)="setDate('setProgStart', $event)">
      </label>
    }
    <div [class]="'phase-pill tw-pill' + v.pill.cls" id="phasePill" [innerHTML]="pill()"></div>
  </div>
  <div class="days-list tw-days" id="daysList">
    @if (v.days; as d) {
      <div class="tw-week" role="group" aria-label="Pick a day">
        @for (c of d.strip; track $index) {
          @if (c.empty) {
            <div class="tw-col empty" aria-hidden="true"><span class="tw-l">{{ c.letter }}</span><span class="tw-c"><span class="tw-n">{{ c.num }}</span></span><span class="tw-w"></span></div>
          } @else {
            <button type="button" [class]="'tw-col' + (c.today ? ' today' : '') + (c.picked ? ' picked' : '') + (c.filled ? ' filled' : '')" [attr.aria-label]="c.label" [attr.aria-pressed]="c.picked" (click)="pickDay($index)">
              <span class="tw-l">{{ c.letter }}</span>
              <span class="tw-c">@switch (c.mark) {@case ('check') {<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="tw-chk" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>} @case ('wild') {<ia-wildcard-mark [size]="14" />} @case ('skip') {<span class="tw-n">✕</span>} @default {<span class="tw-n">{{ c.num }}</span>}}</span>
              <span class="tw-w" [style.color]="c.wordColor">{{ c.word }}</span>
            </button>
          }
        }
      </div>
      @for (k of d.cards; track k.kind) {
        <div [class]="'tw-card' + (k.first ? ' first' : ' second')" [attr.data-card]="k.kind">
          <div class="tw-head">
            @if (!k.first) {<span class="tw-ico" aria-hidden="true">@if (k.kind === 'lift') {<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4M6 8v8M9 10v4M15 10v4M18 8v8M21 10v4M9 12h6"/></svg>} @else {<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 3v-6l-4-2-3 3M14 12l3 2h3"/></svg>}</span>}
            <span class="tw-label">{{ k.label }}</span>
          </div>
          <div class="tw-name">{{ k.title }}</div>
          @if (k.meta) {<div class="tw-meta">{{ k.meta }}</div>}
          @if (k.blurb) {<div class="tw-blurb">{{ k.blurb }}</div>}
          @if (k.done; as dn) {
            <div class="tw-done">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="tw-chk" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>
              <span class="tw-done-txt"><span class="tw-done-title">{{ dn.title }}</span><span class="tw-done-line">{{ dn.line }}</span></span>
              <button type="button" class="tw-reopen" (click)="tap(k, $event, d.cards[0]!.label, 'reopen')">Reopen</button>
            </div>
          }
          @if (k.button; as bt) {
            <button type="button" [class]="'tw-btn' + (bt.glow ? ' glow' : '')" (click)="tap(k, $event, d.cards[0]!.label, 'button')">
              @if (bt.act === 'record') {<span class="tw-recdot" aria-hidden="true"></span>} @else if (bt.act === 'deck') {<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>}
              {{ bt.text }}
            </button>
          }
        </div>
      }
      @if (d.rest; as r) {
        <div class="tw-card first rest" data-card="rest">
          <div class="tw-head"><span class="tw-label">{{ r.when }}</span></div>
          <div class="tw-name">Rest day</div>
          <div class="tw-blurb">Recovery is where the work sets in. Move easy, refuel, sleep.</div>
          @for (l of r.lines; track $index) {<div class="wk-rest-logged">{{ l }}</div>}
          <div class="tw-links">
            @if (r.anyway) {<button type="button" class="tw-link" (click)="restSheet(r.week, r.key, 'move')">Training anyway?</button>}
            <button type="button" class="tw-link" (click)="restSheet(r.week, r.key, 'cardio')">{{ r.logLabel }}</button>
          </div>
        </div>
      }
      @if (!d.cards.length && !d.rest) {
        <div class="tw-card first"><div class="tw-name">No sessions</div><div class="tw-blurb">This week has no scheduled training.</div></div>
      }
      @if (d.tip; as t) {<div class="wk-tip"><div class="wk-tip-lbl">{{ t.label }}</div><div class="wk-tip-txt">{{ t.text }}</div><div class="wk-tip-src">{{ '— ' + t.src }}</div></div>}
      @if (d.wildcard !== null) {<ia-wildcard-tag [sub]="d.wildcard" />}
      <div class="wk-stats"><div class="wk-stat"><div class="wk-stat-num">{{ d.stats.done }}<span class="den">{{ '/' + d.stats.of }}</span></div><div class="wk-stat-lbl">Done</div></div><div class="wk-stat"><div class="wk-stat-num" style="color:var(--run)">{{ d.stats.miles }}</div><div class="wk-stat-lbl">Miles</div></div><div class="wk-stat"><div class="wk-stat-num" style="color:var(--accent)">{{ d.stats.streak }}</div><div class="wk-stat-lbl">Day streak</div></div></div>
    }
  </div>
  <div class="settings-bar">
    <div class="wk-actions-row">
      <button class="random-btn" (click)="call('openRandom')" id="randBtn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M16 8h.01"/><path d="M8 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M12 12h.01"/></svg><span>Random Workout</span><span class="rand-counter" id="randCounter"></span></button>
      <button class="change-btn" (click)="call('openOverlaySheet')" id="changeBtn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/><path d="M8 18h8"/><path d="M8 14h8"/></svg><span>Traveling?</span></button>
    </div>
    <div class="change-active-wrap" id="changeActiveWrap"></div>
  </div>
  `,
})
export class WeekView {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly deck = inject(DeckState);
  private readonly recorder = inject(RecordState);
  private readonly mode = inject(SheetMode);
  protected readonly view = signal<View>(BLANK);
  protected readonly pill = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.view().pill.html));
  private readonly strip = viewChild<ElementRef<HTMLElement>>('strip');
  private readonly calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly gps = recorderAvailable(window as { iaGps?: unknown });

  /** The week title in view, and the day picked in each title (for this program). */
  private readonly shown = signal(1);
  private readonly picks = new Map<number, number>();
  private progId: unknown = undefined;
  /** The legacy currentWeek as this screen last wrote it; any other value was set from outside (a boot, a program loaded). */
  private ownWeek: number | null = null;
  /** The strip sits where it should: false until the first draw, and after the week is set from outside. */
  private placed = false;
  private settleTimer: ReturnType<typeof setTimeout> | null = null;
  private drag: { x: number; left: number; moved: boolean } | null = null;
  private dragAt = 0;

  constructor() {
    this.bridge.provide('renderWeekView', () => this.render());
    this.recorder.openDay = (r) => this.openCardio(r.week, r.key, { over: r.over, title: r.title });
  }

  protected call<K extends LegacyFunction>(name: K, ...args: LegacyArgs<K>): void {
    this.bridge.call(name, ...args);
  }
  protected setDate(fn: 'setProgStart' | 'setProgRace', e: Event): void {
    this.bridge.call(fn, (e.target as HTMLInputElement).value);
  }

  // ── The week titles ──────────────────────────────────────────────────────────────────────────────────────────
  /** A tap on a title picks it and brings it to the left. */
  protected pickTitle(n: number): void {
    if (this.drag && this.drag.moved) return;
    if (Date.now() - this.dragAt < 350) return;
    this.toTitle(n, true);
  }
  private toTitle(n: number, scroll: boolean): void {
    const prog = this.bridge.global('activeProg');
    if (!prog) return;
    const total = prog.totalWeeks || 6;
    const t = Math.min(Math.max(1, n), total + 1);
    if (scroll) this.scrollTo(t, true);
    if (t === this.shown()) return;
    this.shown.set(t);
    this.setLegacyWeek(Math.min(t, total));
    this.render();
  }
  private scrollTo(n: number, smooth: boolean): void {
    const el = this.strip()?.nativeElement;
    if (!el) return;
    const left = (n - 1) * TITLE_W;
    if (smooth && !this.calm && typeof el.scrollTo === 'function') el.scrollTo({ left, behavior: 'smooth' });
    else el.scrollLeft = left;
  }
  /** Where the strip settles is the week: round(scrollLeft / 240) + 1, once the scroll has stopped. */
  protected scrolled(): void {
    if (this.drag) return;
    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => this.settle(), 120);
  }
  private settle(): void {
    this.settleTimer = null;
    const el = this.strip()?.nativeElement;
    if (!el) return;
    const n = Math.round(el.scrollLeft / TITLE_W) + 1;
    if (n !== this.shown()) this.toTitle(n, false);
  }
  /** A mouse drags the strip the way a finger swipes it (the browser and the dev server); touch keeps its own swipe. */
  protected dragDown(e: PointerEvent): void {
    const el = this.strip()?.nativeElement;
    if (e.pointerType !== 'mouse' || !el) return;
    this.drag = { x: e.clientX, left: el.scrollLeft, moved: false };
    el.style.scrollSnapType = 'none';
  }
  protected dragMove(e: PointerEvent): void {
    const g = this.drag, el = this.strip()?.nativeElement;
    if (!g || !el) return;
    const dx = e.clientX - g.x;
    if (Math.abs(dx) > 5 && !g.moved) {
      g.moved = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // A pointer the page no longer holds: the drag goes on without capture.
      }
    }
    if (g.moved) el.scrollLeft = g.left - dx;
  }
  protected dragUp(): void {
    const g = this.drag, el = this.strip()?.nativeElement;
    this.drag = null;
    if (!g || !el) return;
    el.style.scrollSnapType = '';
    if (!g.moved) return;
    this.dragAt = Date.now();
    this.toTitle(Math.round(el.scrollLeft / TITLE_W) + 1, true);
  }

  // ── The days ─────────────────────────────────────────────────────────────────────────────────────────────────
  protected pickDay(col: number): void {
    this.picks.set(this.shown(), col);
    this.render();
  }
  /** The legacy currentWeek, for whatever opens next: the session sheet, the deck, the rest sheet, Traveling?. */
  private setLegacyWeek(w: number): void {
    this.bridge.call('_setCurrentWeek', w);
    this.ownWeek = w;
  }
  /** The day's session sheet: its hand log, its review and edits, its undo (P-DECK answer 3, D179). */
  protected openDay(week: number, key: string): void {
    this.mode.ask(null);
    this.setLegacyWeek(week);
    this.bridge.call('openDayKey', key);
  }
  protected restSheet(week: number, key: string, mode: string): void {
    this.setLegacyWeek(week);
    this.bridge.call('openRestSheet', week, key, mode);
  }
  /** A card's button: Record run, the hand log, or the deck out of the card (D275 call 16). */
  /** One cardio alone (D278): the run, ride or swim's workout and its hand log, not the whole day. */
  private openCardio(week: number, key: string, sheet: CardioOnly): void {
    this.setLegacyWeek(week);
    this.mode.ask(sheet);
    this.bridge.call('openDayKey', key);
  }
  /** A card's button, or its done row's Reopen (D278 items 3 and 4); `when` is the day's when line. */
  protected tap(k: DayCard, ev: Event, when: string, tap: 'button' | 'reopen'): void {
    const r = cardRoute(k, when, tap);
    if (!r) return;
    const btn = ev.currentTarget as HTMLElement | null;
    const card = btn && btn.closest ? (btn.closest('.tw-card') as HTMLElement | null) : null;
    if (r.to === 'cardio') this.openCardio(k.week, k.key, r.sheet);
    else if (r.to === 'day') this.openDay(k.week, k.key);
    else if (r.to === 'deck') {
      this.setLegacyWeek(k.week);
      this.deck.start(k.key, card);
    } else this.record(k, card, when);
  }

  /** Record run: D267's recorder, grown out of the run card (D272 Amendment 2), the run's workout above the clock (D278). */
  private record(k: DayCard, card: HTMLElement | null, when: string): void {
    const prog = this.bridge.global('activeProg');
    const day = prog && prog.weeks && prog.weeks[k.week] ? (prog.weeks[k.week]![k.key] as { cardio?: CardioRx } | null) : null;
    const from: RecordFrom = { week: k.week, key: k.key, over: when, title: k.title, workout: recordWorkout(day) };
    this.recorder.start(from, card);
  }

  // ── The draw ─────────────────────────────────────────────────────────────────────────────────────────────────
  /** The legacy renderWeekView: the screen drawn from the program, then the strip placed on the title in view. */
  private render(): void {
    const b = this.bridge;
    const prog = b.global('activeProg');
    if (!prog) return;
    const totalWeeks = prog.totalWeeks || 6;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actualWeek = b.call('calcCurrentWeek');
    const weekMon = prog.startDate ? b.call('getWeekMonday', prog.startDate) : null;
    const id = b.global('activeProgId') ?? prog.id;
    if (id !== this.progId) {
      this.progId = id;
      this.picks.clear();
      this.ownWeek = null;
    }
    const cw = b.global('currentWeek');
    if (cw !== this.ownWeek) {
      // Set from outside (a boot, a program loaded, the wizard): the title holding today when it is today's week.
      this.shown.set(cw === actualWeek ? liveTitle(weekMon, today, totalWeeks, actualWeek) : Math.min(Math.max(1, cw), totalWeeks + 1));
      this.ownWeek = cw;
      this.placed = false;
    }
    const regions = b.global('INJURY_REGIONS');
    const v = weekView({
      prog, shown: this.shown(), picked: this.picks.get(this.shown()) ?? null, actualWeek, today, weekMon,
      completed: b.call('getCompleted'),
      logs: b.call('getLogs'),
      dayFull: b.global('DAY_FULL'),
      gps: this.gps,
    }, {
      weekRange: (ov: Overlay) => b.call('overlayWeekRange', prog, ov, totalWeeks),
      parseDate: (iso) => b.call('_parseLocalDate', iso),
      isTravel: (day: WeekDay | undefined) => b.call('dayIsTravel', day),
      beforeStart: (w, d) => b.call('dayBeforeStart', prog, w, d),
      regionLabel: (r) => (regions[r] || {}).label,
      icon: (n, s) => b.call('asyIcon', n, s),
      liftFocus: (t) => b.call('liftFocusCode', t),
      runChip: (sub, key, type) => b.call('runSessionCode', sub, key, type),
      wildcardOn: (w, d) => b.call('wildcardOn', w, d),
      statusOf: (w, d) => b.call('statusOf', w, d),
      heroSummary: (day) => b.call('heroSummary', day),
      sessionTime: (day) => b.call('sessionTimeEst', day),
      restTip: () => b.call('restDayTip'),
      restLines: (rl) => b.call('restLogLines', rl),
      streak: () => b.call('computeStreak'),
      wildcardSub: (w, k) => (k ? wildcardSub(b.call('wildcardOn', w, k), (prog && prog.weeks && prog.weeks[w] ? prog.weeks[w]![k as string] : null) as { rest?: unknown; title?: string } | null) : null),
      liveInjury: () => ((b.call('_liveInjuryOverlay') || {}).patch || {}).injury || null,
      alignment: () => b.call('progAlignment', prog),
      shortDay: (iso) => b.call('_fmtStartDay', iso),
      completedKey: (w, d) => b.call('completedKey', w, d),
      logKey: (w, d) => b.call('logKey', w, d),
    });
    this.view.set(v);
    this.cdr.detectChanges();
    document.getElementById('screenWeek')?.classList.toggle('is-injury-week', v.injuryWeek);
    if (!this.placed) {
      // A hidden screen has no width and keeps no scroll: placed on the first draw it shows on.
      const el = this.strip()?.nativeElement;
      this.scrollTo(this.shown(), false);
      this.placed = !!el && el.clientWidth > 0;
    }
    b.call('updateRandCounter');
    b.call('renderOverlayChip');
  }

}
