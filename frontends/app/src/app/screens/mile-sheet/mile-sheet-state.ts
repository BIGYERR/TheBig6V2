import { Injectable, signal } from '@angular/core';
import type { MileFact } from './mile-sheet-model';

/**
 * What the mile pencil's lock shows: the facts the MileSheet (which takes the tap) lists for the MileLock (the lock's
 * body), which draws them. And the mile the coach's nudge offers (D274), which the next open writes into the two fields
 * in place of the stored mile, once.
 */
@Injectable({ providedIn: 'root' })
export class MileSheetState {
  readonly lock = signal<MileFact[]>([]);
  readonly prefill = signal<{ mins: string; secs: string } | null>(null);
}
