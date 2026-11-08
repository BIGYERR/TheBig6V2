import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, type ElementRef, inject, Injectable, signal, untracked, viewChild } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { openMotion } from '../deck/deck-model';
import { type GrowBox, type GrowStage, growBox, growCopy, growFx, growWeek } from '../deck/grow-motion';
import { RunRecorder } from './run-recorder';

/** The run a run card records: its day, and the words over the recorder. */
export interface RecordFrom { week: number; key: string; over: string; title: string }

/** Record run's shared state (D272, D276): This Week asks for the recorder, the host opens it. */
@Injectable({ providedIn: 'root' })
export class RecordState {
  /** The latest Record run, and the card it opens out of. */
  readonly request = signal<{ from: RecordFrom; card: HTMLElement | null } | null>(null);
  /** Opens a day's session sheet the way This Week does, set by This Week (Ran without the phone?). */
  openDay: ((week: number, key: string) => void) | null = null;

  start(from: RecordFrom, card: HTMLElement | null): void {
    this.request.set({ from, card });
  }
}

/**
 * Record run (D272 P-RECORDRUN as amended): D267's recorder grown out of the run card with the deck's motion
 * (Amendment 2, P-DECK call 16), every way out closing back into the card, and Ran without the phone? before Start
 * (D272's open item) opening the day's hand log once it has closed. It sits beside the deck, outside This Week's screen,
 * so the screen's shrink under it never holds it.
 */
@Component({
  selector: 'ia-record-host',
  host: { style: 'display: contents' },
  imports: [RunRecorder],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (rec(); as r) {
    <div class="deck-ov tw-recov" role="presentation">
      <div class="deck-scrim" [attr.style]="fx().scrim"></div>
      <div class="deck-ghost" #ghost aria-hidden="true" [attr.style]="fx().ghost"></div>
      <div class="deck-frame" [attr.style]="fx().frame">
        <div class="deck-content" [attr.style]="fx().content">
          <ia-run-recorder [embedded]="true" [heading]="{ over: r.over, title: r.title }" (closed)="close()" (handLog)="close(r)" />
        </div>
      </div>
    </div>
  }
  `,
})
export class RecordHost {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly state = inject(RecordState);
  private readonly ghost = viewChild<ElementRef<HTMLElement>>('ghost');
  private readonly calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  protected readonly rec = signal<RecordFrom | null>(null);
  private readonly stage = signal<GrowStage>(null);
  private origin: GrowBox | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  protected readonly fx = computed(() =>
    growFx(this.stage(), this.origin, typeof innerWidth === 'number' ? innerWidth : 390, typeof innerHeight === 'number' ? innerHeight : 844));

  constructor() {
    effect(() => {
      if (this.rec()) growWeek(this.fx().week);
    });
    effect(() => {
      const req = this.state.request();
      if (req) untracked(() => this.open(req.from, req.card));
    });
  }

  private later(fn: () => void, ms: number): void {
    this.timers.push(setTimeout(() => {
      fn();
      this.cdr.detectChanges();
    }, ms));
  }

  private open(from: RecordFrom, card: HTMLElement | null): void {
    if (this.rec()) return;
    this.rec.set(from);
    this.origin = growBox(card);
    if (this.calm || !this.origin) {
      this.stage.set('open');
      this.cdr.detectChanges();
      return;
    }
    // Drawn first: the recorder at the card's place under a copy of the card, two frames before anything moves.
    this.stage.set('pre');
    this.cdr.detectChanges();
    const host = this.ghost()?.nativeElement;
    if (host && card) growCopy(host, card);
    const M = openMotion();
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

  /** Every way out closes into the run card (Amendment 2); Ran without the phone? then opens the day's hand log. */
  protected close(then?: RecordFrom): void {
    if (!this.rec() || this.stage() === 'out') return;
    const done = () => {
      this.timers.forEach(clearTimeout);
      this.timers = [];
      this.stage.set(null);
      this.rec.set(null);
      this.state.request.set(null);
      growWeek('');
      this.bridge.call('renderWeekView');
      if (then && this.state.openDay) this.state.openDay(then.week, then.key);
    };
    if (this.calm || !this.origin) {
      done();
      this.cdr.detectChanges();
      return;
    }
    this.stage.set('out');
    this.cdr.detectChanges();
    this.later(done, openMotion().close);
  }
}
