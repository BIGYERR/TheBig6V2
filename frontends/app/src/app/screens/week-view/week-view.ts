import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, type ElementRef, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { type LegacyArgs, LegacyBridge, type LegacyFunction } from '../../legacy/legacy-bridge';
import { wildcardSub } from '../day-detail/sheet-marks-model';
import { WildcardMark, WildcardTag } from '../marks/wildcard';
import { type Overlay, type WeekDay, type WeekView as View, weekView } from './week-view-model';

/** The screen before any program is drawn, as the legacy markup stood. */
const BLANK: View = {
  overline: 'THE ASYLUM', bigNum: 'WEEK 1', pill: { html: '', cls: '' }, injuryWeek: false,
  hurt: { icon: '', injured: false, label: 'HURT?' }, weeks: [], start: { shown: null, iso: '' },
  race: { aligned: false, iso: '', day: '\\u2014' }, days: null,
};

/**
 * This Week (architecture phase E, step 18), in place of the legacy #screenWeek markup and the renderWeekView that
 * drew into it. It takes over renderWeekView through LegacyBridge.provide (every legacy caller reaches it). Each render
 * draws the week strip and the days list anew, as the legacy innerHTML writes did, then runs the legacy strip scoot on
 * the new strip; the header, the dates and the bar below keep their elements, whose text and state change. The Random
 * Workout counter and the overlay chip are still written by their own legacy writers (updateRandCounter, now the
 * RandomWorkout component's, and renderOverlayChip) into the elements this screen leaves empty. The day codes, the
 * hero's summary, time and marks, the streak, the tip and the race alignment are the legacy helpers'.
 */
@Component({
  selector: 'ia-week-view',
  host: { style: 'display: contents' },
  imports: [WildcardMark, WildcardTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let v = view();
  <div class="wk-topbar">
    <div class="wk-overline" id="weekOverline">{{ v.overline }}</div>
    <div class="wk-headrow">
      <div class="wk-bignum" id="weekBigNum">{{ v.bigNum }}</div>
      <button [class]="'hurt-btn' + (v.hurt.injured ? ' is-injured' : '')" id="hurtBtn" (click)="call('openInjurySheet')" aria-label="Report or manage an injury">
        <span class="hurt-ico" id="hurtIco" [innerHTML]="markup().hurtIcon"></span>
        <span class="hurt-lbl" id="hurtLbl">{{ v.hurt.label }}</span>
      </button>
    </div>
  </div>
  @for (s of strips(); track s) {
    <div class="week-scroll" id="weekScroll" #weekScroll>@for (b of s.weeks; track b.w) {<button [class]="'week-btn' + (b.active ? ' active' : '')" (click)="setWeek(b.w)">{{ b.label }}</button>}</div>
  }
  <div class="wk-subrow">
    <label class="wk-startdate" aria-label="Program start date" [style.display]="startDisplay()">
      <svg class="wk-cal-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span class="wk-startdate-stack">
        <span class="wk-startdate-lbl">Program Start</span>
        <span id="startDateDisplay" [class]="'wk-startdate-txt' + (v.start.shown ? '' : ' is-unset')">{{ v.start.shown || 'Set date' }}</span>
      </span>
      <input type="date" id="startDateInput" class="wk-startdate-native" [value]="v.start.iso" (change)="setDate('setProgStart', $event)">
    </label>
    <label class="wk-startdate" id="raceDateWrap" aria-label="Race date" [style.display]="v.race.aligned ? 'flex' : 'none'">
      <svg class="wk-cal-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4a1 1 0 0 1 1-1h13l-3 4 3 4H5"/></svg>
      <span class="wk-startdate-stack">
        <span class="wk-startdate-lbl">Race Day</span>
        <span id="raceDateDisplay" class="wk-startdate-txt">{{ raceDay() }}</span>
      </span>
      <input type="date" id="raceDateInput" class="wk-startdate-native" [value]="v.race.iso" (change)="setDate('setProgRace', $event)">
    </label>
    <div [class]="'phase-pill' + v.pill.cls" id="phasePill" [innerHTML]="markup().pill"></div>
  </div>
  <div class="days-list" id="daysList">
    @for (d of daysViews(); track d) {
      <div class="wk-strip">
        @for (c of d.strip; track $index) {
          @if (c.pre) {
            <div class="wk-day pre" aria-label="Before your start date"><div class="wk-day-lbl">{{ c.label }}</div><div class="wk-day-top">—</div><div class="wk-day-num">{{ c.num }}</div><div class="wk-day-bot">—</div></div>
          } @else {
            <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy day cell, kept as it was -->
            <div [class]="c.cls" (click)="call('openDayKey', c.key)"><div class="wk-day-lbl">{{ c.label }}</div><div class="wk-day-top" [style.color]="c.topColor">{{ c.top }}</div><div class="wk-day-num">@switch (c.center.kind) {@case ('check') {<span class="chk">✓</span>} @case ('wild') {<ia-wildcard-mark [size]="14" />} @case ('skip') {✕} @default {{{ c.center.kind === 'num' ? c.center.text : '' }}}}</div><div class="wk-day-bot" [style.color]="c.botColor">{{ c.bot }}</div></div>
          }
        }
      </div>
      @switch (d.hero.kind) {
        @case ('rest') {
          @if (d.hero.kind === 'rest') {
            <div class="wk-hero"><div class="wk-rest-pad"><div class="wk-hero-over">{{ d.hero.over }}</div><div class="wk-rest-title">REST DAY</div><div class="wk-rest-sub">Recovery is where the work sets in. Move easy, refuel, sleep.</div>@for (l of d.hero.lines; track $index) {<div class="wk-rest-logged">{{ l }}</div>}<div class="wk-rest-acts">@if (d.hero.anyway) {<button class="wk-rest-act" (click)="restSheet(d.hero.key, 'move')">Training anyway?</button>}<button class="wk-rest-act" (click)="restSheet(d.hero.key, 'cardio')">{{ d.hero.logLabel }}</button></div></div></div>
            <div class="wk-tip"><div class="wk-tip-lbl">{{ d.hero.tip.label }}</div><div class="wk-tip-txt">{{ d.hero.tip.text }}</div><div class="wk-tip-src">{{ '— ' + d.hero.tip.src }}</div></div>
          }
        }
        @case ('day') {
          @if (d.hero.kind === 'day') {
            <div [class]="'wk-hero' + (d.hero.today ? ' is-today' : '')"><div class="wk-hero-pad"><div class="wk-hero-over">{{ d.hero.over }}</div><div class="wk-hero-title">{{ d.hero.title }}</div><div class="wk-hero-tags"><span class="wk-tag wk-time">{{ d.hero.time }}</span>@for (t of d.hero.tags; track $index) {<span class="wk-tag" [attr.style]="t.style">{{ t.label }}</span>}@if (d.hero.travel) {<span class="wk-tag wk-travel" [innerHTML]="travelInner()"></span>}</div></div>@if (d.hero.summary) {<div class="wk-hero-summary" [innerHTML]="html(d.hero.summary)"></div>}@if (d.hero.status) {<div class="wk-hero-status">{{ d.hero.status }}</div>}<div class="wk-hero-cta-wrap"><button class="wk-hero-cta" (click)="call('openDayKey', d.hero.key)">{{ d.hero.cta }}</button></div></div>
          }
        }
        @default {
          <div class="wk-hero"><div class="wk-rest-pad"><div class="wk-rest-title" style="font-size:30px">NO SESSIONS</div><div class="wk-rest-sub">This week has no scheduled training.</div></div></div>
        }
      }
      @if (d.wildcard !== null) {<ia-wildcard-tag [sub]="d.wildcard" />}
      <div class="wk-stats"><div class="wk-stat"><div class="wk-stat-num">{{ d.stats.done }}<span class="den">{{ '/' + d.stats.of }}</span></div><div class="wk-stat-lbl">DONE</div></div><div class="wk-stat"><div class="wk-stat-num" style="color:var(--run)">{{ d.stats.miles }}</div><div class="wk-stat-lbl">MILES</div></div><div class="wk-stat"><div class="wk-stat-num" style="color:var(--accent)">{{ d.stats.streak }}</div><div class="wk-stat-lbl">DAY STREAK</div></div></div>
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
  protected readonly view = signal<View>(BLANK);
  /** A fresh object per render, so the strip and the days list are drawn anew, as the legacy innerHTML writes did. */
  protected readonly strips = computed(() => [{ weeks: this.view().weeks }]);
  protected readonly daysViews = computed(() => {
    const d = this.view().days;
    return d ? [d] : [];
  });
  /** The start date's box: no inline display before the first draw, then hidden on a race-aligned program. */
  protected readonly startDisplay = signal<string | null>(null);
  /** The race day's words: kept from the last aligned draw, as the legacy left them. */
  protected readonly raceDay = signal('\\u2014');
  protected readonly markup = computed(() => {
    const v = this.view();
    return { hurtIcon: this.sanitizer.bypassSecurityTrustHtml(v.hurt.icon), pill: this.sanitizer.bypassSecurityTrustHtml(v.pill.html) };
  });
  private readonly weekScroll = viewChild<ElementRef<HTMLElement>>('weekScroll');
  private readonly safe = new Map<string, SafeHtml>();

  constructor() {
    this.bridge.provide('renderWeekView', () => this.render());
  }

  /** Markup from the legacy helpers, made ready for the page once per string. */
  protected html(s: string): SafeHtml {
    let h = this.safe.get(s);
    if (!h) {
      h = this.sanitizer.bypassSecurityTrustHtml(s);
      this.safe.set(s, h);
    }
    return h;
  }
  /** The travel tag's backpack and word. */
  protected travelInner(): SafeHtml {
    return this.html(this.bridge.call('asyIcon', 'backpack', 11) + '<span>Travel</span>');
  }

  protected call<K extends LegacyFunction>(name: K, ...args: LegacyArgs<K>): void {
    this.bridge.call(name, ...args);
  }
  protected setWeek(w: number): void {
    this.bridge.call('_setCurrentWeek', w);
    this.render();
  }
  protected restSheet(key: string, mode: string): void {
    this.bridge.call('openRestSheet', this.bridge.global('currentWeek'), key, mode);
  }
  protected setDate(fn: 'setProgStart' | 'setProgRace', e: Event): void {
    this.bridge.call(fn, (e.target as HTMLInputElement).value);
  }

  /** The legacy renderWeekView: drawn at once, then the strip placed on the week in view. */
  private render(): void {
    const b = this.bridge;
    const prog = b.global('activeProg');
    if (!prog) return;
    b.call('_wkScootCancel');
    const week = b.global('currentWeek');
    const totalWeeks = prog.totalWeeks || 6;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const regions = b.global('INJURY_REGIONS');
    const v = weekView({
      prog, week, today,
      actualWeek: b.call('calcCurrentWeek'),
      weekMon: prog.startDate ? b.call('getWeekMonday', prog.startDate) : null,
      completed: b.call('getCompleted'),
      logs: b.call('getLogs'),
      dayFull: b.global('DAY_FULL'),
    }, {
      weekRange: (ov: Overlay) => b.call('overlayWeekRange', prog, ov, totalWeeks),
      parseDate: (iso) => b.call('_parseLocalDate', iso),
      isTravel: (day: WeekDay | undefined) => b.call('dayIsTravel', day),
      beforeStart: (w, d) => b.call('dayBeforeStart', prog, w, d),
      regionLabel: (r) => (regions[r] || {}).label,
      icon: (n, s) => b.call('asyIcon', n, s),
      dayCode: (day) => b.call('dayCode', day),
      onGold: (hex) => b.call('_onGold', hex),
      wildcardOn: (w, d) => b.call('wildcardOn', w, d),
      statusOf: (w, d) => b.call('statusOf', w, d),
      heroSummary: (day) => b.call('heroSummary', day),
      sessionTime: (day) => b.call('sessionTimeEst', day),
      restTip: () => b.call('restDayTip'),
      restLines: (rl) => b.call('restLogLines', rl),
      streak: () => b.call('computeStreak'),
      wildcardSub: (w, k) => wildcardSub(b.call('wildcardOn', w, k), (prog && prog.weeks && prog.weeks[w] ? prog.weeks[w]![k as string] : null) as { rest?: unknown; title?: string } | null),
      liveInjury: () => ((b.call('_liveInjuryOverlay') || {}).patch || {}).injury || null,
      alignment: () => b.call('progAlignment', prog),
      raceDay: (iso) => b.call('_fmtStartDay', iso, true),
      completedKey: (w, d) => b.call('completedKey', w, d),
      logKey: (w, d) => b.call('logKey', w, d),
    });
    this.view.set(v);
    this.startDisplay.set(v.race.aligned ? 'none' : 'flex');
    if (v.race.day !== null) this.raceDay.set(v.race.day);
    this.cdr.detectChanges();
    document.getElementById('screenWeek')?.classList.toggle('is-injury-week', v.injuryWeek);
    this.place(week);
    b.call('updateRandCounter');
    b.call('renderOverlayChip');
  }

  /** The legacy strip placement: a one-time scoot to the week in view on the first draw, a straight jump after. */
  private place(week: number): void {
    const b = this.bridge;
    const el = this.weekScroll()?.nativeElement;
    if (!el) return;
    const btn = el.querySelectorAll('.week-btn')[week - 1] || null;
    const to = b.call('_wkStripTarget', el, btn);
    if (to === null) return;
    if (b.global('_wkScootDone') || b.call('_wkReduceMotion')) {
      el.scrollLeft = to;
      b.set('_wkScootDone', true);
    } else {
      b.set('_wkScootDone', true);
      b.call('_wkScoot', el, to, week);
    }
  }
}
