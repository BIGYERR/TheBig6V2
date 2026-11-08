import { Injectable } from '@angular/core';
import { atEdge, follow, lockOf, SETTLE_EASE, SETTLE_MS, settle, speed, topLayer } from './swipe-back-model';

/** The full-screen pages a swipe can take back, and the layers that stop it (a pop-up, the RPE card). */
const PAGES = '#deckOverlay, .tw-recov, .overlay.open, .rand-overlay.open';
const BLOCKERS = '.pop-overlay.open, .rpe-overlay.open';
/** Each page's Back. */
const BACKS = '.deck-back, .dh-back, .back-btn';

interface Page { el: HTMLElement; back: HTMLElement | null; z: number; order: number }
interface Drag { id: number; x0: number; y0: number; page: Page; locked: boolean; samples: { x: number; t: number }[]; dx: number }

const shown = (el: Element) => el.isConnected && (el as HTMLElement).getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
const zOf = (el: Element) => {
  const z = parseInt(getComputedStyle(el).zIndex, 10);
  return Number.isFinite(z) ? z : 0;
};

/**
 * The iOS edge swipe (D277 P-SWIPEBACK, docs/decisions/swipe-back.md): from the left edge, the top full-screen page
 * follows the finger, and a release past half the width or a flick right presses that page's own Back, so it goes back
 * exactly as a tap does. Installed once on the document, in the capture phase, so the deck's own swipe never sees an
 * edge swipe. Pointer events carry it, a finger on the phone and a mouse drag in a browser alike.
 */
@Injectable({ providedIn: 'root' })
export class SwipeBack {
  private drag: Drag | null = null;
  private installed = false;
  private readonly calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  install(): void {
    if (this.installed || typeof document === 'undefined') return;
    this.installed = true;
    const opts = { capture: true, passive: false } as AddEventListenerOptions;
    // Pointer events carry the swipe for a finger and a mouse alike; a swipe that may start keeps them to itself from the
    // first touch, so the deck's own card swipe never moves under it.
    document.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (this.down(e.clientX, e.clientY, e.target, e.pointerId)) e.stopPropagation();
    }, opts);
    document.addEventListener('pointermove', (e) => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      this.holding = this.move(e.clientX, e.clientY);
      if (this.holding) {
        if (e.pointerType === 'mouse') e.preventDefault();
        e.stopPropagation();
      }
    }, opts);
    document.addEventListener('pointerup', (e) => {
      if (this.drag && e.pointerId === this.drag.id && this.up()) e.stopPropagation();
    }, opts);
    document.addEventListener('pointercancel', (e) => {
      if (this.drag && e.pointerId === this.drag.id) this.cancel();
    }, opts);
    // A page's own scroll would take the touch: held while the swipe has it, or may yet.
    document.addEventListener('touchmove', (e) => {
      if (this.drag && this.holding && e.cancelable) e.preventDefault();
    }, opts);
    // A drag that went somewhere is not a tap on what it ended over.
    document.addEventListener('click', (e) => {
      if (this.swallowClick) {
        this.swallowClick = false;
        e.preventDefault();
        e.stopPropagation();
      }
    }, opts);
  }
  private swallowClick = false;
  private holding = false;

  /** The page on top, when it is a page with a Back and nothing stops the swipe. */
  private top(): Page | null {
    const els = Array.from(document.querySelectorAll<HTMLElement>(PAGES + ', ' + BLOCKERS)).filter(shown);
    const pages = els.map((el, order) => {
      const blocker = el.matches(BLOCKERS) || !!el.querySelector('.deck-sheetscrim');
      const back = blocker ? null : Array.from(el.querySelectorAll<HTMLElement>(BACKS)).find(shown) || null;
      return { el, back, z: zOf(el), order };
    });
    return topLayer(pages);
  }

  /** True when a swipe may start here: the touch is the swipe's until it turns out to be a scroll. */
  private down(x: number, y: number, target: EventTarget | null, id: number): boolean {
    this.drag = null;
    this.holding = false;
    if (!atEdge(x)) return false;
    const t = target as Element | null;
    if (t && t.closest && t.closest('#restFloat')) return false;
    const page = this.top();
    if (!page || !page.back) return false;
    this.drag = { id, x0: x, y0: y, page, locked: false, samples: [{ x, t: performance.now() }], dx: 0 };
    return true;
  }

  /** True while the swipe holds the touch. */
  private move(x: number, y: number): boolean {
    const g = this.drag;
    if (!g) return false;
    const dx = x - g.x0, dy = y - g.y0;
    if (!g.locked) {
      const lock = lockOf(dx, dy);
      if (lock === 'scroll') {
        this.drag = null;
        return false;
      }
      if (lock === null) return Math.abs(dx) >= Math.abs(dy);
      g.locked = true;
      const s = g.page.el.style;
      s.transition = 'none';
      s.willChange = 'transform';
      s.boxShadow = '-10px 0 30px rgba(0,0,0,0.25)';
    }
    g.dx = follow(dx);
    g.samples.push({ x, t: performance.now() });
    if (g.samples.length > 4) g.samples.shift();
    g.page.el.style.transform = 'translateX(' + g.dx + 'px)';
    return true;
  }

  /** True when the touch was the swipe's. */
  private up(): boolean {
    const g = this.drag;
    this.drag = null;
    this.holding = false;
    if (!g || !g.locked) return false;
    // The speed at release: a finger held still before it lets go is no flick.
    const last = g.samples[g.samples.length - 1]!;
    g.samples.push({ x: last.x, t: Math.max(performance.now(), last.t + 1) });
    if (g.samples[g.samples.length - 1]!.t - last.t < 16) g.samples.pop();
    this.swallowClick = true;
    setTimeout(() => (this.swallowClick = false), 400);
    const width = typeof innerWidth === 'number' ? innerWidth : 390;
    const s = g.page.el.style;
    const ms = this.calm ? 0 : SETTLE_MS;
    s.transition = ms ? 'transform ' + ms + 'ms ' + SETTLE_EASE : 'none';
    if (settle(g.dx, speed(g.samples), width) === 'back') {
      s.transform = 'translateX(' + width + 'px)';
      setTimeout(() => this.goBack(g.page), ms);
    } else this.home(g.page, ms);
    return true;
  }

  private cancel(): void {
    const g = this.drag;
    this.drag = null;
    this.holding = false;
    if (g && g.locked) this.home(g.page, this.calm ? 0 : SETTLE_MS);
  }

  /** Presses the page's own Back; a page its Back keeps open (the recorder's finished run) slides home. */
  private goBack(p: Page): void {
    // The press is the swipe's own, not a stray click left by the drag.
    this.swallowClick = false;
    p.back?.click();
    let waited = 0;
    const check = () => {
      if (!p.el.isConnected || !shown(p.el)) return this.clear(p.el);
      if (waited >= 600) return this.home(p, this.calm ? 0 : SETTLE_MS);
      waited += 50;
      setTimeout(check, 50);
    };
    setTimeout(check, 50);
  }

  private home(p: Page, ms: number): void {
    const s = p.el.style;
    s.transition = ms ? 'transform ' + ms + 'ms ' + SETTLE_EASE : 'none';
    s.transform = 'translateX(0px)';
    setTimeout(() => this.clear(p.el), ms);
  }

  private clear(el: HTMLElement): void {
    el.style.transition = '';
    el.style.transform = '';
    el.style.willChange = '';
    el.style.boxShadow = '';
  }
}

