import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import {
  clockFace, DRAG_THRESHOLD, dragPosition, type Island, type RtSide, showsOn, sideStyles, snapSide, Stopwatch, stopwatchClock, syncIsland,
} from './rest-timer-model';

/**
 * The floating rest timer (architecture phase E, step 2), in place of the legacy script's rest-timer.ts inside
 * #restFloat. The markup is the legacy one, element for element; the readout and the Start/Stop button follow signals,
 * and the docking side, the open card, the intro and the drag write the same inline styles the legacy script wrote.
 * The legacy calls into the timer from the rest of the app (updateRestFloat on every screen change, ruReset when a day
 * closes, ruResetIfIdle when a day opens, _ruIsland at boot, _setRtIntroPending after the first program) reach this
 * component through LegacyBridge.provide.
 */
@Component({
  selector: 'ia-rest-timer',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div id="rtAnchor" #anchor>
    <div id="rtTab" #tab role="button" tabindex="0" aria-label="Rest timer, tap to open"
      (pointerdown)="down($event, true)" (pointermove)="move($event)" (pointerup)="up(true)" (pointercancel)="cancel()">
      <span id="rtChev" #chev>‹</span>
      <div id="rtMini" [class.run]="running()">@for (c of face().main; track $index) {<span>@if (c === ':') {<span style="opacity:.7">:</span>} @else {{{ c }}}</span>}</div>
    </div>
    <div id="rtCard" #card
      (pointerdown)="down($event, false)" (pointermove)="move($event)" (pointerup)="up(false)" (pointercancel)="cancel()">
      <div id="rtNub" #nub></div>
      <div class="rt-head">
        <span class="rt-cap">Rest Timer</span>
        <button class="rt-collapse" type="button" (click)="collapse()" aria-label="Minimize">›</button>
      </div>
      <div class="rt-readout"><span id="rtBig">{{ face().main }}</span><span id="rtCs">{{ face().cs }}</span></div>
      <div class="rt-actions">
        <button id="rtToggle" class="rt-btn" type="button" [class.running]="running()" (click)="toggleBtn()">{{ running() ? 'Stop' : 'Start' }}</button>
        <button class="rt-reset" type="button" (click)="resetBtn()">Reset</button>
      </div>
    </div>
  </div>
  `,
})
export class RestTimer {
  private readonly bridge = inject(LegacyBridge);
  private readonly anchor = viewChild.required<ElementRef<HTMLElement>>('anchor');
  private readonly tab = viewChild.required<ElementRef<HTMLElement>>('tab');
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
  private readonly chev = viewChild.required<ElementRef<HTMLElement>>('chev');
  private readonly nub = viewChild.required<ElementRef<HTMLElement>>('nub');

  private readonly island = (window as { iaIsland?: Island }).iaIsland;
  private readonly watch = new Stopwatch(stopwatchClock(this.island, performance, () => Date.now()));
  /** Bumped on every change and every 33 ms while running, so the readout reads the watch afresh. */
  private readonly tick = signal(0);
  protected readonly running = signal(false);
  protected readonly face = computed(() => (this.tick(), clockFace(this.watch.now())));

  private ticker: ReturnType<typeof setInterval> | null = null;
  private side: RtSide = 'right';
  private inited = false;
  private introPending = false;
  private introTimer: ReturnType<typeof setTimeout> | null = null;
  private dragging = false;
  private drag = { sx: 0, sy: 0, sTop: 0, moved: false };

  constructor() {
    this.bridge.provide('updateRestFloat', () => this.updateRestFloat());
    this.bridge.provide('ruReset', () => this.reset());
    this.bridge.provide('ruResetIfIdle', () => this.resetIfIdle());
    this.bridge.provide('_ruIsland', () => syncIsland(this.island, this.watch));
    this.bridge.provide('_setRtIntroPending', (v: boolean) => (this.introPending = v));
    const blockScroll = (e: TouchEvent) => {
      if (this.dragging && e.cancelable) e.preventDefault();
    };
    document.addEventListener('touchmove', blockScroll, { passive: false });
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('touchmove', blockScroll);
      if (this.ticker) clearInterval(this.ticker);
    });
  }

  // ── the stopwatch ─────────────────────────────────────────────────────────────────────────────────────────────
  private render(): void {
    this.running.set(this.watch.running);
    this.tick.update((n) => n + 1);
  }
  private start(): void {
    if (this.watch.running) return;
    this.watch.begin();
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = setInterval(() => this.render(), 33);
    this.render();
    syncIsland(this.island, this.watch);
  }
  private pause(): void {
    this.watch.pause();
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
    this.render();
    syncIsland(this.island, this.watch);
  }
  private reset(): void {
    this.pause();
    this.watch.reset();
    this.render();
    syncIsland(this.island, this.watch);
  }
  private resetIfIdle(): void {
    if (this.watch.resetIfIdle()) {
      this.render();
      syncIsland(this.island, this.watch);
    }
  }

  // ── the card, the side, the intro ─────────────────────────────────────────────────────────────────────────────
  private applySide(): void {
    const st = sideStyles(this.side);
    const anchor = this.anchor().nativeElement.style, tab = this.tab().nativeElement.style, card = this.card().nativeElement.style;
    const nub = this.nub().nativeElement.style;
    anchor.right = st.anchor.right;
    anchor.left = st.anchor.left;
    tab.borderRadius = st.tab.borderRadius;
    tab.borderRight = st.tab.borderRight;
    tab.borderLeft = st.tab.borderLeft;
    card.borderRadius = st.card.borderRadius;
    card.borderRight = st.card.borderRight;
    card.borderLeft = st.card.borderLeft;
    this.chev().nativeElement.textContent = st.chevron;
    nub.left = st.nub.left;
    nub.right = st.nub.right;
  }
  private setExpanded(v: boolean): void {
    this.tab().nativeElement.style.display = v ? 'none' : 'flex';
    this.card().nativeElement.style.display = v ? 'block' : 'none';
    this.render();
  }
  private dismissIntro(): void {
    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }
    this.card().nativeElement.style.animation = '';
    this.tab().nativeElement.style.animation = '';
  }
  private playIntro(): void {
    const card = this.card().nativeElement, tab = this.tab().nativeElement;
    this.setExpanded(true);
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = 'rtCardIntro 1.9s cubic-bezier(.34,1.25,.5,1) .3s 1 both';
    if (this.introTimer) clearTimeout(this.introTimer);
    this.introTimer = setTimeout(() => {
      this.introTimer = null;
      card.style.animation = '';
      this.setExpanded(false);
      tab.style.transformOrigin = 'right center';
      tab.style.animation = 'none';
      void tab.offsetWidth;
      tab.style.animation = 'rtPillSettle .34s cubic-bezier(.34,1.4,.5,1) 1 both';
      setTimeout(() => {
        tab.style.animation = '';
        tab.style.transformOrigin = '';
      }, 420);
    }, 2200);
  }
  protected collapse(): void {
    this.dismissIntro();
    this.setExpanded(false);
  }
  protected toggleBtn(): void {
    const wasIntro = !!this.introTimer;
    this.dismissIntro();
    if (this.watch.running) this.pause();
    else this.start();
    if (wasIntro) this.collapse();
  }
  protected resetBtn(): void {
    const wasIntro = !!this.introTimer;
    this.dismissIntro();
    this.reset();
    if (wasIntro) this.collapse();
  }
  private init(): void {
    if (this.inited) return;
    this.inited = true;
    this.applySide();
    this.setExpanded(false);
    this.render();
  }
  /** Shows the timer on the week, Progress and Bugs while a program is active, and plays the intro once after the first program. */
  private updateRestFloat(): void {
    const frame = document.getElementById('restFloat');
    if (!frame) return;
    const show = showsOn(!!this.bridge.global('activeProg'), this.bridge.global('_curScreen'));
    frame.style.display = show ? 'block' : 'none';
    if (!show) return;
    this.init();
    if (this.introPending) {
      this.introPending = false;
      this.side = 'right';
      this.applySide();
      this.playIntro();
    }
  }

  // ── the drag ──────────────────────────────────────────────────────────────────────────────────────────────────
  protected down(e: PointerEvent, isTab: boolean): void {
    void isTab;
    if ((e.target as Element).closest('.rt-btn,.rt-reset,.rt-collapse')) return;
    const anchor = this.anchor().nativeElement;
    this.dragging = true;
    this.drag = { sx: e.clientX, sy: e.clientY, sTop: anchor.offsetTop, moved: false };
    if (e.cancelable) e.preventDefault();
    anchor.style.transition = 'none';
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // A pointer that cannot be captured still drags, as before.
    }
  }
  protected move(e: PointerEvent): void {
    if (!this.dragging) return;
    if (e.cancelable) e.preventDefault();
    const anchor = this.anchor().nativeElement, frame = document.getElementById('restFloat')!;
    const dx = e.clientX - this.drag.sx, dy = e.clientY - this.drag.sy;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) this.drag.moved = true;
    if (!this.drag.moved) return;
    const fb = frame.getBoundingClientRect();
    const at = dragPosition(
      { startTop: this.drag.sTop, dy, clientX: e.clientX },
      { innerHeight: window.innerHeight, anchorHeight: anchor.offsetHeight, anchorWidth: anchor.offsetWidth, frameLeft: fb.left, frameWidth: fb.width },
    );
    anchor.style.top = at.top + 'px';
    anchor.style.left = at.left + 'px';
    anchor.style.right = 'auto';
  }
  /** Ends a drag and docks the timer to the nearer edge; true when it moved. */
  private snap(): boolean {
    this.dragging = false;
    const anchor = this.anchor().nativeElement, frame = document.getElementById('restFloat')!;
    anchor.style.transition = 'left .18s cubic-bezier(.34,1.3,.5,1),right .18s cubic-bezier(.34,1.3,.5,1)';
    if (this.drag.moved) {
      this.side = snapSide(anchor.offsetLeft, anchor.offsetWidth, frame.getBoundingClientRect().width);
      anchor.style.left = '';
      this.applySide();
    }
    return this.drag.moved;
  }
  protected up(isTab: boolean): void {
    if (!this.dragging) return;
    if (this.snap()) return;
    if (isTab) {
      this.dismissIntro();
      this.setExpanded(true);
    } else if (this.introTimer) {
      this.collapse();
    }
  }
  protected cancel(): void {
    if (this.dragging) this.snap();
  }
}
