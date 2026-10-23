import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { SessionSections } from '../day-detail/session-sections';
import { type ExSection, sectionsView, type SectionView } from '../day-detail/session-sections-model';
import { type BridgeLike, sectionReads } from '../day-detail/session-sections-reads';
import {
  dayKeyOf, RAND_FILTERS, randCount, randDraw, type RandFilter, randPool, type RandView, randView, type RandWorkout,
} from './random-workout-model';

/**
 * Random Workout (architecture phase E, step 11), in place of the legacy #randOverlay markup and the openRandom,
 * buildRandFilterBar, reroll, resetWildcardCounter and updateRandCounter that drew it. It takes over openRandom and
 * updateRandCounter (which This Week also calls) through LegacyBridge.provide. The draw keeps the legacy order of
 * Math.random calls and still records itself through the legacy _setLastRandIdx, _setCurrentRandIdx and
 * _setCurrentRandDayKey; the sections are the session sheet's SessionSections (the legacy buildSectionsHTML's until
 * step 28). Completing is still the legacy completeWildcard, and closing the legacy closeRandom.
 */
@Component({
  selector: 'ia-random-workout',
  host: { style: 'display: contents' },
  imports: [SessionSections],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="rand-header">
    <button class="back-btn" (click)="close()">← Back</button>
    <div class="rand-filter-bar" id="randFilterBar" style="flex:1;margin-left:12px;margin-bottom:0">@for (f of filters; track f.id) {<button [class]="'rand-filter-btn' + (filter() === f.id ? ' active' : '')" (click)="setFilter(f.id)">{{ f.label }}</button>}</div>
    <button class="rand-reset-btn" (click)="reset()" id="resetRandBtn" aria-label="Reset wildcard counter" title="Reset wildcard counter" [style.color]="resetPending() ? 'var(--red)' : ''">{{ resetPending() ? 'Tap again' : '↺ Reset' }}</button>
  </div>
  <div class="rand-body" id="randBody">
    @if (view(); as v) {
      <div style="text-align:center;padding:4px 0 16px">
        <div class="rand-badge" [attr.style]="v.badgeStyle">{{ v.done ? 'Done Before ✓' : 'Wildcard' }}</div>
        <div class="rand-title">{{ v.title }}</div>
      </div>
      @if (v.cardio; as c) {
        <div [class]="c.blockCls"><div [class]="'cardio-type-label ' + c.labelCls">{{ c.type }}</div><div class="cardio-detail">{{ c.detail }}</div></div>
      }
      <ia-session-sections [sections]="sections()" />
      @if (v.note) {
        <div class="note-block">{{ v.note }}</div>
      }
      @if (v.done) {
        <div class="wildcard-done-block">✓ You've done this one before</div>
      } @else {
        <button class="wildcard-complete-btn" (click)="complete(v.title)" [innerHTML]="completeLabel()"></button>
      }
    }
  </div>
  `,
})
export class RandomWorkout {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly filters = RAND_FILTERS;
  protected readonly filter = signal<RandFilter>('mine');
  protected readonly view = signal<RandView | null>(null);
  protected readonly sections = signal<SectionView[]>([]);
  protected readonly completeLabel = signal<SafeHtml>('');
  protected readonly resetPending = signal(false);

  constructor() {
    this.bridge.provide('openRandom', () => this.open());
    this.bridge.provide('updateRandCounter', () => this.updateCounter());
  }

  protected close(): void {
    this.bridge.call('closeRandom');
  }
  protected setFilter(f: RandFilter): void {
    this.filter.set(f);
    this.reroll();
  }
  protected complete(title: string): void {
    this.bridge.call('completeWildcard', title);
  }

  /** The legacy two-tap reset: the first tap asks again for three seconds, the second empties the done list. */
  protected reset(): void {
    if (!this.resetPending()) {
      this.resetPending.set(true);
      setTimeout(() => {
        this.resetPending.set(false);
        this.updateCounter();
      }, 3000);
      return;
    }
    this.resetPending.set(false);
    this.bridge.call('saveWildcardDone', []);
    this.updateCounter();
    this.bridge.call('showToast', 'Wildcard counter reset ✓');
  }

  private goal(): string {
    return this.bridge.global('activeProg')?.goal || 'balanced';
  }
  private pools(): Record<string, RandWorkout[]> {
    return this.bridge.global('RAND_POOLS');
  }

  /** The legacy openRandom: the filter bar and a fresh draw, then the sheet opens at its top. */
  private open(): void {
    this.reroll();
    const o = document.getElementById('randOverlay');
    if (o) {
      o.classList.add('open');
      o.scrollTop = 0;
    }
  }

  /** The legacy reroll: draws a workout other than the last, records the draw, and draws the sheet at once. */
  private reroll(): void {
    const pool = randPool(this.pools(), this.goal(), this.filter());
    const idx = randDraw(pool.length, this.bridge.global('lastRandIdx'), Math.random);
    this.bridge.call('_setLastRandIdx', idx);
    this.bridge.call('_setCurrentRandIdx', idx);
    const w = pool[idx]!;
    const done = this.bridge.call('getWildcardDone');
    this.bridge.call('_setCurrentRandDayKey', dayKeyOf(new Date()));
    this.view.set(randView(w, done, this.goal()));
    this.sections.set(sectionsView(w.sections as ExSection[] | undefined, undefined, sectionReads(this.bridge as unknown as BridgeLike)));
    this.completeLabel.set(this.sanitizer.bypassSecurityTrustHtml(this.bridge.call('asyIcon', '✅', 14) + ' Complete — Mark Done'));
    this.cdr.detectChanges();
  }

  /** The legacy updateRandCounter: This Week's counter, and the reset button back to itself unless a reset is pending. */
  private updateCounter(): void {
    const el = document.getElementById('randCounter');
    if (el) el.textContent = randCount(this.bridge.call('getWildcardDone'), this.pools(), this.goal());
    this.cdr.detectChanges();
  }
}
