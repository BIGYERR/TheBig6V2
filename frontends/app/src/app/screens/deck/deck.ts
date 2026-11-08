import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, type ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { type LegacyArgs, LegacyBridge, type LegacyFunction } from '../../legacy/legacy-bridge';
import { SessionSections } from '../day-detail/session-sections';
import { type ExSection, sectionsView } from '../day-detail/session-sections-model';
import { type BridgeLike, sectionReads } from '../day-detail/session-sections-reads';
import { CALL_IT_WORDS, type CardAct, callItLog, ctaText, type DayLog, type DeckCard, deckCards, deckOpens, numeral, openMotion, PIP_THRESHOLD, rpeBubble, stateOf } from './deck-model';
import { DeckState } from './deck-state';
import { type GrowBox, type GrowStage, growBox, growCopy, growFx, growWeek } from './grow-motion';

/** A scheduled day, as far as the deck reads it. */
interface DeckDay { title?: string; rest?: unknown; sections?: ExSection[] }

/** The opening motion's stage (call 16): drawn under the copy, lifted, opening, open, closing. */
type Stage = GrowStage;
/** A card's done motion (call 10): it lifts with a glow, then leaves. */
interface DoneAnim { phase: 'lift' | 'leave'; glow: boolean }

const FAN = 3;
const SWIPE = 80;
const DOUBLE_TAP = 320;
/** Each kind's glow, from the palette (D261). */
const TONE_RGB: Record<string, string> = { lift: 'var(--lift-rgb)', hip: 'var(--hip-rgb)', core: 'var(--core-rgb)', finish: 'var(--on-band-rgb)' };

/**
 * The swipe deck (D275 P-DECK, docs/decisions/swipe-deck.md): a day's lift work as a deck of cards, opened by Start
 * session out of This Week's card (call 16, Lift first at 420 ms). One card shows at a time in a fan; a swipe moves on,
 * mid swipe the next card rises drawn in full (call 3), a double tap switches between sideways and an up and down pager
 * (call 1). Each card carries the app's own exercise cards (SessionSections), so a set is logged, a lift swapped or
 * skipped exactly as on the session sheet, into the same stores (call 8). Done, next one logs what the card shows and
 * sends it behind the deck with a glow (call 10); a skip punches the card and leaves an undo (call 5, board V). Call it
 * closes the deck: the day's RPE and notes, then Mark the day done. The deck explains nothing (call 15). Its stylesheet,
 * deck.css, is global (angular.json's styles, beside the legacy CSS), since it styles the session sheet's own cards inside it.
 */
@Component({
  selector: 'ia-deck',
  // After a tap or a field leaving focus while the deck is open, what the app logged is read back (touched()).
  host: { style: 'display: contents', '(document:click)': 'touched()', '(document:focusout)': 'touched()' },
  imports: [SessionSections],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (stage() !== null) {
  <div class="deck-ov" id="deckOverlay" role="dialog" [attr.aria-label]="title()">
    <div class="deck-scrim" [attr.style]="fx().scrim"></div>
    <div class="deck-ghost" #ghost aria-hidden="true" [attr.style]="fx().ghost"></div>
    <div class="deck-frame" [attr.style]="fx().frame">
      <div class="deck-content" [attr.style]="fx().content">
        <div class="deck-head">
          <button type="button" class="deck-back" (click)="close()" aria-label="Back to This Week" [innerHTML]="icon('chevronLeft', 22)"></button>
          <div class="deck-title">{{ title() }}</div>
          <button type="button" class="deck-mapbtn" (click)="sheet.set('map')" aria-label="See the whole session"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5"></rect><rect x="14" y="4" width="6" height="6" rx="1.5"></rect><rect x="4" y="14" width="6" height="6" rx="1.5"></rect><rect x="14" y="14" width="6" height="6" rx="1.5"></rect></svg></button>
        </div>
        <div [attr.class]="'deck-stage' + (vert() ? ' vert' : '')" (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up($event)" (pointercancel)="cancel()" (wheel)="wheel($event)">
          @for (c of cards(); track c.key; let k = $index) {
            <section [attr.class]="cardClass(c, k)" [attr.data-tone]="c.tone" [attr.style]="cardStyle(k)" [attr.inert]="k === i() ? null : ''" [attr.aria-hidden]="k === i() ? null : 'true'">
              <div class="deck-face" [attr.style]="faceStyle(k)">
                @if (isLogged(c, k)) {<div class="deck-band"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>Logged</div>}
                <div class="deck-body">
                  @if (isLogged(c, k)) {<div class="deck-bigcheck" aria-hidden="true"><svg width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>}
                  <div class="deck-top">
                    <div class="deck-num">{{ num(k).num }}<span>{{ num(k).of }}</span></div>
                    <div class="deck-side">
                      <div class="deck-chips">@for (ch of c.chips; track $index) {<span class="deck-chip">{{ ch }}</span>}</div>
                      <div class="deck-acts">
                        @if (c.swap; as sw) {<button type="button" class="deck-act" aria-label="Swap this exercise" (click)="call('openSwapSheet', sw.secIdx, sw.itemIdx)" [innerHTML]="icon('swap', 17)"></button>}
                        @if (c.skip && c.kind !== 'lift') {<button type="button" class="deck-act deck-all" aria-label="Skip the whole card" (click)="skip(c, k)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line></svg>All</button>}
                        @if (c.undo; as u) {<button type="button" class="deck-act deck-undo" aria-label="Put it back" (click)="act(u, false)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path></svg></button>}
                        @if (c.skip && c.kind === 'lift') {<button type="button" class="deck-act" aria-label="Skip this card" (click)="skip(c, k)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>}
                      </div>
                    </div>
                  </div>
                  <div class="deck-rule"></div>
                  <div class="deck-kicker">{{ c.kicker }}</div>
                  <div [attr.class]="'deck-name' + (c.title.length > 26 ? ' s' : c.title.length > 16 ? ' m' : '')">{{ c.title }}</div>
                  <div class="deck-rx"><span>{{ c.rx }}</span>@if (c.rpe !== null && !c.skipped) {<button type="button" class="deck-rpemark" aria-label="What RPE means" (click)="openRpe(c.rpe, $event)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"></circle><line x1="12" y1="11" x2="12" y2="16.5"></line><circle cx="12" cy="7.6" r="0.6" fill="currentColor"></circle></svg></button>}</div>
                  @if (c.cue && !c.skipped) {<div class="deck-cue">{{ c.cue }}</div>}
                  @if (c.swappedFrom; as from) {<div class="deck-from"><b>Swapped in</b><span>{{ 'for ' + from }}</span><button type="button" aria-label="Put it back" (click)="call('undoSwap', from)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path></svg></button></div>}
                  @if (c.kind === 'finish') {
                    <div class="deck-callit">
                      <div class="deck-rpe-read"><span class="deck-rpe-n">{{ rpe() }}</span><span class="deck-rpe-w">{{ rpeWord() }}</span></div>
                      <div class="deck-slider"><div class="deck-slider-fill" [style.width.%]="(rpe() - 1) / 9 * 100"></div><input type="range" class="deck-rpe" id="deckRpe" min="1" max="10" step="1" [value]="rpe()" aria-label="How hard was the whole session, 1 to 10" (input)="setRpe($event)"></div>
                      <label class="deck-notes-lbl" for="deckNotes">Notes</label>
                      <textarea id="deckNotes" class="deck-notes" rows="3" [value]="notes()" (input)="setNotes($event)"></textarea>
                    </div>
                  } @else if (!c.skipped) {
                    <div [attr.class]="'deck-work deck-' + c.kind"><ia-session-sections [sections]="c.views" [pipAt]="pip" /></div>
                  }
                </div>
              </div>
              @if (c.skipped) {
                <div [attr.class]="'deck-hole' + (hit() === c.key ? ' hit' : '')" aria-hidden="true"><svg viewBox="0 0 220 220" width="200" height="200"><path d="M110,30 L122,52 L142,42 L140,66 L164,60 L154,82 L182,84 L164,102 L190,114 L166,124 L184,146 L158,144 L166,168 L142,158 L138,186 L118,166 L104,192 L96,164 L72,178 L74,152 L48,158 L60,136 L32,130 L52,112 L28,98 L54,88 L40,64 L66,68 L64,42 L88,54 Z" fill="rgba(0,0,0,0.62)" transform="translate(5,7)"></path><path d="M110,30 L122,52 L142,42 L140,66 L164,60 L154,82 L182,84 L164,102 L190,114 L166,124 L184,146 L158,144 L166,168 L142,158 L138,186 L118,166 L104,192 L96,164 L72,178 L74,152 L48,158 L60,136 L32,130 L52,112 L28,98 L54,88 L40,64 L66,68 L64,42 L88,54 Z" fill="var(--bg)"></path></svg></div>
                @if (hit() === c.key) {@for (s of shards; track $index) {<div [attr.class]="'deck-shard ' + s.a" aria-hidden="true"><svg viewBox="0 0 30 30" [attr.width]="s.s" [attr.height]="s.s"><path d="M4,8 L20,2 L28,18 L12,28 Z" style="fill:rgba(var(--on-band-rgb),0.85)"></path></svg></div>}}
              }
            </section>
          }
          @if (vert()) {<div class="deck-dots v">@for (d of dots(); track $index) {<button type="button" [attr.class]="d.cls" [attr.aria-label]="d.label" (click)="go(d.k)"></button>}</div>}
        </div>
        @if (!vert()) {<div class="deck-dots">@for (d of dots(); track $index) {<button type="button" [attr.class]="d.cls" [attr.aria-label]="d.label" (click)="go(d.k)"></button>}</div>}
        <div class="deck-foot">
          <button type="button" [attr.class]="'deck-cta' + (ctaQuiet() ? ' quiet' : '')" (click)="advance()">{{ cta() }}</button>
        </div>
      </div>
    </div>
    @if (sheet() === 'map') {
      <div class="deck-sheetwrap">
        <button type="button" class="deck-sheetscrim" aria-label="Close" (click)="sheet.set(null)"></button>
        <div class="deck-sheet" role="dialog" aria-label="The whole session">
          <div class="deck-sheet-head"><span>{{ title() }}</span><button type="button" class="deck-x" aria-label="Close" (click)="sheet.set(null)">✕</button></div>
          <div class="deck-tiles">@for (t of tiles(); track t.k) {<button type="button" [attr.class]="t.cls" [attr.data-tone]="t.tone" (click)="go(t.k); sheet.set(null)"><span class="deck-tile-num">{{ t.num }}</span><span class="deck-tile-kick">{{ t.kicker }}</span><span class="deck-tile-title">{{ t.title }}</span><span class="deck-tile-state">{{ t.state }}</span></button>}</div>
        </div>
      </div>
    }
    @if (rpeSheet(); as rs) {
      <div class="deck-sheetwrap">
        <button type="button" [attr.class]="'deck-sheetscrim' + (rs.closing ? ' out' : '')" aria-label="Close" (click)="closeRpe()"></button>
        <div [attr.class]="'deck-bubble' + (rs.closing ? ' out' : '')" role="dialog" aria-label="What RPE means" [style.transform-origin]="rs.origin">
          <div class="deck-bubble-k">RPE {{ rs.n }}</div>
          <div class="deck-bubble-line">{{ rs.line }}</div>
          <div class="deck-bubble-rows">@for (r of rs.rows; track r.range) {<div [attr.class]="'deck-band-row' + (r.on ? ' on' : '')"><span class="r">{{ r.range }}</span><span class="l">{{ r.label }}</span><span class="d">{{ r.detail }}</span></div>}</div>
          <button type="button" class="deck-gotit" (click)="closeRpe()">Got it</button>
        </div>
      </div>
    }
  </div>
  }
  `,
})
export class Deck {
  private readonly bridge = inject(LegacyBridge);
  private readonly state = inject(DeckState);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly ghostEl = viewChild<ElementRef<HTMLElement>>('ghost');
  protected readonly pip = PIP_THRESHOLD;
  protected readonly shards = [{ a: 'd1', s: 17 }, { a: 'd2', s: 13 }, { a: 'd3', s: 11 }, { a: 'd4', s: 15 }];

  protected readonly stage = signal<Stage>(null);
  protected readonly cards = signal<DeckCard[]>([]);
  protected readonly title = signal('');
  protected readonly i = signal(0);
  protected readonly vert = signal(false);
  protected readonly sheet = signal<'map' | null>(null);
  protected readonly rpeSheet = signal<{ n: number; line: string; rows: ReturnType<typeof rpeBubble>['rows']; origin: string; closing: boolean } | null>(null);
  protected readonly hit = signal<string | null>(null);
  /** Cards marked done with nothing on them the app can log; the deck's own, for this open. */
  private readonly doneLocal = signal<Record<string, boolean>>({});
  private readonly drag = signal<{ dx: number; dy: number; on: boolean }>({ dx: 0, dy: 0, on: false });
  private readonly anim = signal<{ dir: number } | null>(null);
  private readonly doneAnim = signal<DoneAnim | null>(null);
  private readonly snap = signal(false);
  protected readonly rpe = signal(7);
  private rpeTouched = false;
  protected readonly notes = signal('');
  private readonly dayDone = signal(false);
  private dayKey = '';
  private week = 0;
  private origin: GrowBox | null = null;
  private x0 = 0;
  private y0 = 0;
  private lastTap = 0;
  private pressed = false;
  private body: HTMLElement | null = null;
  private xLast = 0;
  private yLast = 0;
  private wheelSum = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private readonly calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    this.state.redraw = (dayKey, day) => this.redraw(dayKey, day as DeckDay);
    effect(() => this.setWeek(this.fx().week));
    effect(() => {
      const req = this.state.request();
      if (req) untracked(() => this.open(req.dayKey, req.from));
    });
  }

  protected call<K extends LegacyFunction>(name: K, ...args: LegacyArgs<K>): void {
    this.bridge.call(name, ...args);
  }
  private readonly safe = new Map<string, SafeHtml>();
  protected icon(key: string, size: number): SafeHtml {
    const s = this.bridge.call('asyIcon', key, size);
    let h = this.safe.get(s);
    if (!h) {
      h = this.sanitizer.bypassSecurityTrustHtml(s);
      this.safe.set(s, h);
    }
    return h;
  }
  private later(fn: () => void, ms: number): void {
    this.timers.push(setTimeout(() => {
      fn();
      this.cdr.detectChanges();
    }, ms));
  }
  private b(): BridgeLike {
    return this.bridge as unknown as BridgeLike;
  }

  // ── Opening and closing (call 16) ────────────────────────────────────────────────────────────────────────────────
  private dayOf(dayKey: string): DeckDay | null {
    const prog = this.bridge.global('activeProg') as { weeks?: Record<number, Record<string, DeckDay | null>> } | null;
    const week = this.bridge.global('currentWeek') as number;
    return (prog && prog.weeks && prog.weeks[week] && prog.weeks[week]![dayKey]) || null;
  }

  /** The day's cards from the session sheet's own reads: the deck's model over sectionsView of the whole day. */
  private build(day: DeckDay): DeckCard[] {
    const secs = day.sections || [];
    const views = sectionsView(secs, 0, sectionReads(this.b()));
    return deckCards(secs, views, (s) => this.bridge.call('_secRounds', s) as number | null);
  }

  private open(dayKey: string, from: HTMLElement | null): void {
    if (this.stage() !== null) return;
    const day = this.dayOf(dayKey);
    if (!day || day.rest) return;
    const b = this.bridge;
    // What openDetail sets before it draws: the stale warning once per open, the unit, the active day, the idle clock.
    b.call('_setStaleWarnShown', false);
    b.call('_setStaleWarnSrc', '');
    const prog = b.global('activeProg') as { cfg?: { unit?: string } } | null;
    (globalThis as Record<string, unknown>)['_unitLabel'] = prog && prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';
    b.call('_setCurrentDayKey', dayKey);
    b.call('ruResetIfIdle');
    if (this.state.clearSheet) this.state.clearSheet();
    const cards = this.build(day);
    if (!deckOpens(cards)) {
      b.call('openDetail', dayKey, day);
      return;
    }
    this.dayKey = dayKey;
    this.week = b.global('currentWeek') as number;
    const entry = (b.call('getLogs') as Record<string, DayLog>)[b.call('logKey', this.week, dayKey)] || null;
    const stored = entry && entry.rpe != null && entry.rpe !== '' ? +(entry.rpe as string) : NaN;
    this.rpe.set(stored >= 1 && stored <= 10 ? stored : 7);
    this.rpeTouched = false;
    this.notes.set(entry && typeof entry.notes === 'string' ? entry.notes : '');
    this.dayDone.set(b.call('statusOf', this.week, dayKey) === 'complete');
    this.title.set(day.title || 'Training');
    this.cards.set(cards);
    const first = cards.findIndex((c) => c.kind !== 'finish' && !c.skipped && !c.logged);
    this.i.set(first < 0 ? cards.length - 1 : first);
    this.vert.set(false);
    this.sheet.set(null);
    this.rpeSheet.set(null);
    this.doneLocal.set({});
    this.drag.set({ dx: 0, dy: 0, on: false });
    this.anim.set(null);
    this.doneAnim.set(null);
    this.state.isOpen.set(true);
    this.origin = growBox(from);
    if (this.calm || !this.origin) {
      this.stage.set('open');
      this.cdr.detectChanges();
      return;
    }
    // Drawn first: the deck at the card's place under a copy of the card, two frames before anything moves.
    this.stage.set('pre');
    this.cdr.detectChanges();
    this.copyCard(from!);
    const M = openMotion();
    // Two frames, or 64 ms when frames are held back (a page in the background), whichever comes first.
    let started = false;
    const lift = () => {
      if (started || this.stage() !== 'pre') return;
      started = true;
      this.stage.set('lift');
      this.cdr.detectChanges();
      this.later(() => {
        if (this.stage() === 'lift') this.stage.set('in');
      }, M.lift);
      this.later(() => {
        if (this.stage() === 'in') this.stage.set('open');
      }, M.settled);
    };
    requestAnimationFrame(() => requestAnimationFrame(lift));
    this.later(lift, 64);
  }

  /** The copy of the card the deck opens out of: its label, name and summary, without its button. */
  private copyCard(from: HTMLElement): void {
    const host = this.ghostEl()?.nativeElement;
    if (host) growCopy(host, from);
  }

  /** Back and Mark the day done close the same way: the opening played back into the card. */
  protected close(then?: () => void): void {
    if (this.stage() === null || this.stage() === 'out') return;
    const done = () => {
      this.stage.set(null);
      this.cards.set([]);
      this.state.isOpen.set(false);
      this.setWeek('');
      const host = this.ghostEl()?.nativeElement;
      if (host) host.textContent = '';
      this.bridge.call('renderWeekView');
      if (then) then();
    };
    this.sheet.set(null);
    this.rpeSheet.set(null);
    if (this.calm || !this.origin) {
      done();
      this.cdr.detectChanges();
      return;
    }
    this.stage.set('out');
    this.cdr.detectChanges();
    this.later(done, openMotion().close);
  }

  /** The motion's styles for each stage: the scrim, the copy, the deck's frame and its content, and This Week. */
  protected readonly fx = computed(() =>
    growFx(this.stage(), this.origin, typeof innerWidth === 'number' ? innerWidth : 390, typeof innerHeight === 'number' ? innerHeight : 844));

  /** This Week under the deck: it shrinks to 96% as the deck opens and grows back as it closes. */
  private setWeek(css: string): void {
    growWeek(css);
  }

  // ── The cards ────────────────────────────────────────────────────────────────────────────────────────────────
  /** openDetail while the deck is open: an edit's redraw lands on the deck, the reader stays on their card. */
  private redraw(dayKey: string, day: DeckDay): void {
    if (dayKey !== this.dayKey) return;
    const next = this.build(day);
    const key = (this.cards()[this.i()] || { key: '' }).key;
    this.cards.set(next);
    const at = next.findIndex((c) => c.key === key);
    this.i.set(at >= 0 ? at : Math.min(this.i(), next.length - 1));
    this.cdr.detectChanges();
  }

  /** After a tap or a field leaves focus inside the cards: what the app logged since, read back from the store. */
  protected touched(): void {
    setTimeout(() => {
      if (this.stage() === null) return;
      const store = this.bridge.call('getExWeights') as Record<string, { entries?: { week?: unknown }[] } | undefined>;
      const today = (exKey: string) => ((store[exKey] && store[exKey]!.entries) || []).some((e) => +(e.week as number) === +this.week && this.bridge.call('entryDay', e as never) === this.dayKey);
      let moved = false;
      const next = this.cards().map((c) => {
        if (!c.moves.some((m) => today(m.exKey) !== m.logged)) return c;
        moved = true;
        const moves = c.moves.map((m) => ({ ...m, logged: today(m.exKey) }));
        return { ...c, moves, logged: moves.every((m) => m.logged) };
      });
      if (moved) {
        this.cards.set(next);
        this.cdr.detectChanges();
      }
    }, 0);
  }

  protected isLogged(c: DeckCard, k: number): boolean {
    return !c.skipped && (c.logged || !!this.doneLocal()[c.key]) && (c.kind !== 'finish' || this.dayDone()) && k >= 0;
  }
  protected num(k: number): { num: string; of: string } {
    return numeral(k, this.cards().length);
  }

  /** Where card k sits: the top card under the finger, the next three fanned behind, the rest out of sight. */
  private pos(k: number): number {
    const n = this.cards().length;
    return (k - this.i() + n) % n;
  }
  private peekIndex(): number | null {
    const n = this.cards().length;
    if (n < 2) return null;
    const d = this.drag(), da = this.doneAnim(), an = this.anim();
    const dd = this.vert() ? d.dy : d.dx;
    const leaving = !!da && da.phase === 'leave';
    if (!((d.on && Math.abs(dd) > 2) || (this.vert() && !!an) || leaving)) return null;
    const dir = leaving ? 1 : this.vert() && an ? an.dir : dd < 0 ? 1 : -1;
    return (this.i() + dir + n) % n;
  }
  private progress(): number {
    const d = this.drag();
    return Math.min(1, Math.abs(this.vert() ? d.dy : d.dx) / 140);
  }

  protected cardClass(c: DeckCard, k: number): string {
    return 'deck-card' + (k === this.i() ? ' top' : '') + (c.skipped ? ' skipped' : '') + (this.isLogged(c, k) ? ' logged' : '') + (this.hit() === c.key ? ' hit' : '');
  }

  protected cardStyle(k: number): string {
    const p = this.pos(k), vert = this.vert(), d = this.drag(), c = this.cards()[k]!;
    const settle = d.on || this.snap() ? '' : 'transition:transform 290ms cubic-bezier(0.22,0.61,0.36,1),box-shadow 260ms ease,filter 460ms ease,opacity 460ms ease;';
    const pk = this.peekIndex();
    if (p === 0) {
      const da = this.doneAnim(), an = this.anim();
      if (this.hit() === c.key) return 'z-index:20;animation:deckHit 520ms cubic-bezier(0.22,0.9,0.3,1);';
      if (da && da.phase === 'lift') {
        const g = TONE_RGB[c.tone] || 'var(--on-band-rgb)';
        return 'z-index:20;transform:translateY(-10px) scale(1.03);transition:transform 340ms cubic-bezier(0.2,0.8,0.2,1),box-shadow 340ms ease;'
          + (da.glow ? 'box-shadow:0 0 0 2px rgba(' + g + ',0.9),0 0 42px 8px rgba(' + g + ',0.6),0 20px 44px rgba(0,0,0,0.26);' : '');
      }
      if (da && da.phase === 'leave') return 'z-index:20;animation:' + (vert ? 'deckPagerLeave' : 'deckTuck') + ' 760ms cubic-bezier(0.45,0,0.2,1) forwards;';
      const t = vert
        ? an ? (an.dir > 0 ? 'translateY(calc(-100% - 14px))' : 'translateY(calc(100% + 14px))') : 'translateY(' + d.dy + 'px)'
        : 'translateX(' + d.dx + 'px) rotate(' + (d.dx / 26).toFixed(2) + 'deg)';
      return 'z-index:20;transform:' + t + ';' + settle;
    }
    if (k === pk) {
      const da = this.doneAnim();
      if (da && da.phase === 'leave') return 'z-index:15;animation:' + (vert ? 'deckPagerRise' : 'deckPeekRise') + ' 760ms cubic-bezier(0.45,0,0.2,1) forwards;';
      const dirUp = (k - this.i() + this.cards().length) % this.cards().length === 1;
      if (vert) {
        const dd = d.dy, an = this.anim();
        const t = an ? 'translateY(0)' : dirUp ? 'translateY(calc(100% + 14px)) translateY(' + dd + 'px)' : 'translateY(calc(-100% - 14px)) translateY(' + dd + 'px)';
        return 'z-index:15;transform:' + t + ';' + (d.on || this.snap() ? '' : 'transition:transform 290ms cubic-bezier(0.22,0.61,0.36,1);');
      }
      const f = dirUp ? { x: 15, y: -7, s: 0.965, r: 1.6 } : { x: 0, y: 0, s: 0.92, r: 0 };
      const q = this.progress(), l = (a: number, b: number) => a + (b - a) * q;
      return 'z-index:15;transform:translate(' + l(f.x, 0).toFixed(1) + 'px,' + l(f.y, 0).toFixed(1) + 'px) scale(' + l(f.s, 1).toFixed(3) + ') rotate(' + l(f.r, 0).toFixed(2) + 'deg);';
    }
    if (!vert && p >= 1 && p <= FAN) {
      return 'z-index:' + (10 - p) + ';transform:translateX(' + p * 15 + 'px) translateY(' + p * -7 + 'px) scale(' + (1 - p * 0.035) + ') rotate(' + p * 1.6 + 'deg);transition:transform 260ms ease;';
    }
    return 'z-index:1;visibility:hidden;transform:none;';
  }

  /** A card's face: the top card in full, the one rising mid swipe fading in with the drag, the fan as plain cards. */
  protected faceStyle(k: number): string {
    if (k === this.i()) return '';
    const pk = this.peekIndex();
    if (k === pk) {
      const da = this.doneAnim();
      if (da && da.phase === 'leave' && !this.vert()) return 'animation:deckPeekFade 760ms ease forwards;';
      return 'opacity:' + (this.vert() ? 1 : 0.25 + 0.75 * this.progress()).toFixed(2) + ';';
    }
    return 'opacity:0;';
  }

  protected readonly dots = computed(() => this.cards().map((c, k) => {
    const s = stateOf(c, k, this.i(), !!this.doneLocal()[c.key] || (c.kind === 'finish' && this.dayDone()));
    return { k, label: 'Card ' + (k + 1) + ', ' + s, cls: 'deck-dot' + (k === this.i() ? ' on' : '') + (s === 'Logged' ? ' done' : '') + (s === 'Skipped' ? ' skip' : '') };
  }));
  protected readonly tiles = computed(() => this.cards().map((c, k) => {
    const s = stateOf(c, k, this.i(), !!this.doneLocal()[c.key] || (c.kind === 'finish' && this.dayDone()));
    return { k, num: String(k + 1).padStart(2, '0'), kicker: c.kicker, title: c.title, state: s, tone: c.skipped ? 'skip' : c.tone,
      cls: 'deck-tile' + (k === this.i() ? ' here' : '') + (s === 'Logged' ? ' done' : '') };
  }));

  protected readonly cta = computed(() => {
    const c = this.cards()[this.i()];
    return c ? ctaText(c, !!this.doneLocal()[c.key], this.dayDone()) : '';
  });
  protected readonly ctaQuiet = computed(() => {
    const c = this.cards()[this.i()];
    if (!c) return false;
    return c.kind === 'finish' ? this.dayDone() : c.skipped || c.logged || !!this.doneLocal()[c.key];
  });
  protected rpeWord(): string {
    return CALL_IT_WORDS[this.rpe()] || '';
  }

  // ── Moving through the deck ──────────────────────────────────────────────────────────────────────────────────
  protected go(k: number): void {
    const n = this.cards().length;
    if (!n) return;
    this.i.set((k + n) % n);
    this.drag.set({ dx: 0, dy: 0, on: false });
  }
  private slide(dir: number): void {
    if (this.anim()) return;
    if (this.calm) {
      this.go(this.i() + dir);
      return;
    }
    this.anim.set({ dir });
    this.drag.set({ dx: 0, dy: 0, on: false });
    this.later(() => {
      this.snap.set(true);
      this.anim.set(null);
      this.go(this.i() + dir);
      this.later(() => this.snap.set(false), 40);
    }, 290);
  }
  private step(dir: number): void {
    if (this.vert()) this.slide(dir);
    else this.go(this.i() + dir);
  }

  /**
   * A press on a card. Sideways, the card body scrolls by itself (pan-y) and a sideways drag moves the deck. Up and down,
   * the pager owns the finger: a drag scrolls the card's body first and pages only past its top or bottom edge. A press
   * that barely moves is a tap, and two inside DOUBLE_TAP switch the two (call 1).
   */
  protected down(e: PointerEvent): void {
    const t = e.target as Element | null;
    this.pressed = false;
    if (this.doneAnim() || this.anim() || (t && t.closest && t.closest('button,input,textarea,select,label,a'))) return;
    this.pressed = true;
    this.body = t && t.closest ? (t.closest('.deck-body') as HTMLElement | null) : null;
    this.x0 = this.xLast = e.clientX;
    this.y0 = this.yLast = e.clientY;
    this.drag.set({ dx: 0, dy: 0, on: true });
  }
  protected move(e: PointerEvent): void {
    const d = this.drag();
    this.xLast = e.clientX;
    if (!d.on || this.cards().length < 2) {
      this.yLast = e.clientY;
      return;
    }
    if (!this.vert()) {
      this.drag.set({ dx: e.clientX - this.x0, dy: 0, on: true });
      return;
    }
    const step = e.clientY - this.yLast;
    this.yLast = e.clientY;
    const b = this.body;
    let rest = step;
    if (b && b.scrollHeight > b.clientHeight + 2 && d.dy === 0) {
      const before = b.scrollTop;
      b.scrollTop = before - step;
      rest = step - (before - b.scrollTop);
    }
    if (rest) this.drag.set({ dx: 0, dy: d.dy + rest, on: true });
  }
  protected up(e?: PointerEvent): void {
    const d = this.drag();
    if (!this.pressed) return;
    this.pressed = false;
    const x = e ? e.clientX : this.xLast, y = e ? e.clientY : this.yLast;
    if (Math.abs(x - this.x0) < 6 && Math.abs(y - this.y0) < 6) {
      const now = Date.now();
      this.drag.set({ dx: 0, dy: 0, on: false });
      if (now - this.lastTap < DOUBLE_TAP) {
        this.vert.update((v) => !v);
        this.lastTap = 0;
      } else this.lastTap = now;
      return;
    }
    const dist = this.vert() ? d.dy : d.dx;
    if (dist < -SWIPE) this.step(1);
    else if (dist > SWIPE) this.step(-1);
    else this.drag.set({ dx: 0, dy: 0, on: false });
  }
  protected cancel(): void {
    this.pressed = false;
    this.drag.set({ dx: 0, dy: 0, on: false });
  }
  protected wheel(e: WheelEvent): void {
    const t = e.target as Element | null;
    const z = t && t.closest ? (t.closest('.deck-body') as HTMLElement | null) : null;
    if (z && z.scrollHeight > z.clientHeight + 2) return;
    const dv = this.vert() ? e.deltaY : Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
    if (!dv || this.anim() || this.sheet() || this.rpeSheet()) return;
    this.wheelSum += dv;
    if (Math.abs(this.wheelSum) > 50) {
      const dir = this.wheelSum > 0 ? 1 : -1;
      this.wheelSum = 0;
      this.step(dir);
    }
  }

  // ── What the cards do ────────────────────────────────────────────────────────────────────────────────────────
  /** A skip or its undo, through the app's own handlers; their redraw comes back through openDetail. */
  protected act(a: CardAct, off: boolean): void {
    if (a.kind === 'exercise') this.bridge.call(off ? 'skipExercise' : 'unskipExercise', a.name);
    else if (a.kind === 'round') this.bridge.call(off ? 'skipSuperset' : 'unskipSuperset', a.secIdx);
    else for (const n of a.names) this.bridge.call(off ? 'skipExercise' : 'unskipExercise', n);
  }
  /** A skip punches the card (board V), plain grey under Reduce Motion, and raises no pop up (call 5). */
  protected skip(c: DeckCard, k: number): void {
    if (!c.skip || k !== this.i()) return;
    this.act(c.skip, true);
    if (this.calm) return;
    this.hit.set(c.key);
    this.later(() => this.hit.set(null), 620);
  }

  /** The big button: Done, next one logs what the card shows and sends it behind the deck; Call it marks the day. */
  protected advance(): void {
    const c = this.cards()[this.i()];
    if (!c || this.doneAnim() || this.anim()) return;
    if (c.kind === 'finish') {
      if (this.dayDone()) this.close();
      else this.markDay();
      return;
    }
    const marking = !c.skipped && !c.logged && !this.doneLocal()[c.key];
    if (marking) {
      const open = c.moves.filter((m) => !m.logged);
      for (const m of open) this.bridge.call('saveExWeight', m.exKey, m.name, m.rxDetail, true);
      if (open.length) {
        const moves = c.moves.map((m) => ({ ...m, logged: true }));
        this.cards.update((all) => all.map((x) => (x.key === c.key ? { ...x, moves, logged: true } : x)));
      } else this.doneLocal.update((d) => ({ ...d, [c.key]: true }));
    }
    if (this.calm) {
      this.later(() => this.go(this.i() + 1), 200);
      return;
    }
    this.doneAnim.set({ phase: 'lift', glow: marking });
    this.later(() => {
      this.doneAnim.set({ phase: 'leave', glow: false });
      this.later(() => {
        this.snap.set(true);
        this.doneAnim.set(null);
        this.go(this.i() + 1);
        this.later(() => this.snap.set(false), 40);
      }, 760);
    }, marking ? 560 : 220);
  }

  protected setRpe(e: Event): void {
    this.rpe.set(+(e.target as HTMLInputElement).value);
    this.rpeTouched = true;
  }
  protected setNotes(e: Event): void {
    this.notes.set((e.target as HTMLTextAreaElement).value);
  }

  /**
   * Mark the day done: the day's RPE (only once the slider is moved, D219) and notes merged into its log entry, every
   * other field kept; the day marked complete; the rest clock stopped; the deck closed into its card, then the
   * completion pop-up over This Week, or the toast when none shows, as the session sheet's Done does (D179).
   */
  private markDay(): void {
    const b = this.bridge, week = this.week, dayKey = this.dayKey;
    b.call('snapshotDay', week, dayKey);
    const logs = b.call('getLogs') as Record<string, DayLog>;
    const key = b.call('logKey', week, dayKey);
    logs[key] = callItLog(logs[key], this.rpeTouched ? this.rpe() : null, this.notes(), week, Date.now());
    b.call('saveLogs', logs);
    b.call('markDayComplete', week, dayKey, this.title());
    b.call('ruReset');
    this.dayDone.set(true);
    this.close(() => {
      b.call('fireCompletionPopup', week, dayKey);
      const pop = document.getElementById('popOverlay');
      if (!(pop && pop.classList.contains('show'))) b.call('showToast', 'Done ✓');
    });
  }

  /** The RPE bubble (call 7): it warps out of the mark to the centre and back in on Got it. */
  protected openRpe(n: number, e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement | null;
    const r = el ? el.getBoundingClientRect() : null;
    const origin = r ? (r.left + r.width / 2 - 24).toFixed(0) + 'px ' + (r.top + r.height / 2 - 170).toFixed(0) + 'px' : 'center';
    this.rpeSheet.set({ n, ...rpeBubble(n), origin, closing: false });
  }
  protected closeRpe(): void {
    const s = this.rpeSheet();
    if (!s || s.closing) return;
    if (this.calm) {
      this.rpeSheet.set(null);
      return;
    }
    this.rpeSheet.set({ ...s, closing: true });
    this.later(() => this.rpeSheet.set(null), 300);
  }
}
