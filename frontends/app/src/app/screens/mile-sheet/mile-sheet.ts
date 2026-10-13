import { ApplicationRef, ChangeDetectionStrategy, Component, type ElementRef, inject, signal, viewChild } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { MILE_INTRO, mileField, mileLocked, mileLockFacts } from './mile-sheet-model';
import { MileSheetState } from './mile-sheet-state';

/** A stored program, as far as the pencil reads it. */
interface MileProgram {
  id: string;
  totalWeeks?: number;
  cfg?: { raceDate?: string | null; cardioGoals?: { run?: { mileBestMins?: string | number | null; mileBestSecs?: string | number | null } } };
}

/**
 * The mile pencil's edit sheet (architecture phase E, step 8), in place of the legacy #mileOverlay markup and the
 * openMileSheet that filled it. It takes over openMileSheet through LegacyBridge.provide: the tap is judged against the
 * program's week there and then, and opens either this sheet, its fields drawn anew from the stored mile, or the lock
 * (MileLock), drawn before it opens. The two fields stay the same elements from open to open, and each open writes the
 * stored mile into them, as the legacy did, so a field that held the focus keeps it. The draft stays the legacy `_mileDraft`, and saving is still the legacy
 * commitMileChange, which reads the two fields by their ids; closing is still the legacy closeMileSheet.
 */
@Component({
  selector: 'ia-mile-sheet',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="rand-header">
    <button class="back-btn" (click)="close()">← Back</button>
  </div>
  <div class="rand-body">
    <div style="font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:0.03em;color:var(--text)">YOUR MILE</div>
    <div id="mileSheetIntro" style="font-size:13px;color:var(--text);line-height:1.5;margin-top:6px">{{ opened() ? intro : '' }}</div>
    <div style="display:flex;gap:6px;margin-top:12px">
      <input #mins type="number" class="input-field" id="mileSheetMins" style="flex:1;text-align:center" placeholder="min" min="0" max="99">
      <input #secs type="number" class="input-field" id="mileSheetSecs" style="flex:1;text-align:center" placeholder="sec" min="0" max="59">
    </div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button id="mileCommitBtn" class="prog-action-btn primary" style="flex:1" (click)="commit()">Update my mile</button>
      <button class="prog-action-btn" style="flex:1" (click)="close()">Keep what I have</button>
    </div>
  </div>
  `,
})
export class MileSheet {
  private readonly bridge = inject(LegacyBridge);
  private readonly appRef = inject(ApplicationRef);
  protected readonly state = inject(MileSheetState);
  protected readonly intro = MILE_INTRO;
  /** The intro is written at the first open, as before. */
  protected readonly opened = signal(false);
  private readonly mins = viewChild.required<ElementRef<HTMLInputElement>>('mins');
  private readonly secs = viewChild.required<ElementRef<HTMLInputElement>>('secs');

  constructor() {
    this.bridge.provide('openMileSheet', (progId: string) => this.open(progId));
  }

  protected commit(): void {
    this.bridge.call('commitMileChange');
  }
  protected close(): void {
    this.bridge.call('closeMileSheet');
  }

  /** The legacy openMileSheet: the lock in a program's last three weeks, the edit sheet before them. */
  private open(progId: string): void {
    const p = (this.bridge.call('getPrograms') as MileProgram[]).find((x) => x.id === progId);
    if (!p) return;
    const tw = p.totalWeeks || 6;
    const week = this.bridge.call('_goalCurWeek', p);
    if (mileLocked(week, tw)) {
      this.state.lock.set(mileLockFacts(p.cfg?.raceDate, week, tw, {
        countdown: (iso) => this.bridge.call('raceCountdown', iso),
        words: (cd) => this.bridge.call('raceCountdownWords', cd),
        day: (iso) => this.bridge.call('_fmtStartDay', iso, true),
      }));
      this.appRef.tick();
      this.show('mileLockOverlay');
      return;
    }
    const g = p.cfg?.cardioGoals?.run || {};
    this.bridge.set('_mileDraft', { progId });
    this.mins().nativeElement.value = mileField(g.mileBestMins);
    this.secs().nativeElement.value = mileField(g.mileBestSecs);
    this.opened.set(true);
    this.appRef.tick();
    this.show('mileOverlay');
  }

  private show(id: string): void {
    const o = document.getElementById(id);
    if (o) {
      o.classList.add('open');
      o.scrollTop = 0;
    }
  }
}
