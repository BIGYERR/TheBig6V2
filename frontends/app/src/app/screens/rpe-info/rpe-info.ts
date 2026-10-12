import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';

/**
 * The app-wide RPE card (architecture phase E, step 9), in place of the legacy card inside #rpeInfoOverlay. Opening it
 * and the overlay's own tap-outside close stay the legacy showRpeInfo and hideRpeInfo; a tap inside the card stops
 * there, as before, and Got it closes it.
 */
@Component({
  selector: 'ia-rpe-info',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy card, which only keeps a tap inside it from closing the overlay -->
  <div class="rpe-info-card" (click)="$event.stopPropagation()">
    <div class="rpe-info-title">RPE — Rate of Perceived Exertion</div>
    <div class="rpe-info-sub">How hard it feels on a 1–10 scale. Use the talk test to place your effort:</div>
    <div class="rpe-info-scale">
      <div><b>1–3</b><span>Easy — can hold a full conversation</span></div>
      <div><b>4–6</b><span>Moderate — short sentences only</span></div>
      <div><b>7–8</b><span>Hard — a few words at a time</span></div>
      <div><b>9–10</b><span>Max — can't talk, all-out</span></div>
    </div>
    <div class="rpe-info-note">Lifting uses the same feel — it's how many reps you leave in reserve (RPE 8 ≈ 2 reps left in the tank).</div>
    <div class="rpe-info-note">Rest between sets: 2–3 minutes on main lifts, 60–90 seconds on everything else unless the card says otherwise.</div>
    <div class="rpe-info-note">Accessories: hit the top of the rep range on every set, then add weight and start back at the bottom of the range.</div>
    <button class="rpe-info-close" (click)="close()">Got it</button>
  </div>
  `,
})
export class RpeInfo {
  private readonly bridge = inject(LegacyBridge);

  protected close(): void {
    this.bridge.call('hideRpeInfo');
  }
}
