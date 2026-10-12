import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';

// The app's count-up rest stopwatch, running for show: m:ss with hundredths, or m:ss alone (the island's compact
// view). It starts partway into a rest and wraps at `wrap` seconds, so the page never shows a stale clock.
@Component({
  selector: 'ia-rest-clock',
  template: `{{ text() }}`,
  host: { class: 'rest-clock', 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestClock {
  readonly hundredths = input(true);
  readonly startAt = input(47);
  readonly wrap = input(150);

  private readonly started = performance.now();
  private readonly tick = signal(0);

  protected readonly text = computed(() => {
    this.tick();
    const s = (this.startAt() + (performance.now() - this.started) / 1000) % this.wrap();
    const whole = Math.floor(s);
    const mmss = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
    return this.hundredths() ? `${mmss}.${String(Math.floor((s - whole) * 100)).padStart(2, '0')}` : mmss;
  });

  /** 0 to 1 through the current rest, for a progress fill. */
  readonly progress = computed(() => {
    this.tick();
    return ((this.startAt() + (performance.now() - this.started) / 1000) % this.wrap()) / this.wrap();
  });

  constructor() {
    const timer = setInterval(() => this.tick.update((n) => n + 1), 53);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
