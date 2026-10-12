import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { MILE_LOCK_TEXT } from './mile-sheet-model';
import { MileSheetState } from './mile-sheet-state';

/**
 * The mile pencil's lock (architecture phase E, step 8), in place of the legacy openMileSheet's write into
 * #mileLockBody: what the last three weeks of a program show instead of the edit sheet. Empty until the first lock, as
 * before; the MileSheet fills it at the tap.
 */
@Component({
  selector: 'ia-mile-lock',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (state.lock().length) {
    <div style="font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:0.03em;color:var(--accent)">THE ROW HOLDS</div>
    <div class="det-group" style="margin-top:10px">
      @for (f of state.lock(); track f.k) {
        <div class="det-row"><span class="k">{{ f.k }}</span><span class="v">{{ f.v }}</span></div>
      }
    </div>
    <div style="font-size:13px;color:var(--text);line-height:1.5;margin-top:12px">{{ text }}</div>
    <div style="display:flex;gap:8px;margin-top:14px"><button class="prog-action-btn primary" style="flex:1" (click)="close()">Got it</button></div>
  }
  `,
})
export class MileLock {
  private readonly bridge = inject(LegacyBridge);
  protected readonly state = inject(MileSheetState);
  protected readonly text = MILE_LOCK_TEXT;

  protected close(): void {
    this.bridge.call('closeMileSheet');
  }
}
