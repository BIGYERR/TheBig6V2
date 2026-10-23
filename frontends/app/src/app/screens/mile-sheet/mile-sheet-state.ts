import { Injectable, signal } from '@angular/core';
import type { MileFact } from './mile-sheet-model';

/**
 * What the mile pencil's lock shows: the facts the MileSheet (which takes the tap) lists for the MileLock (the lock's
 * body), which draws them.
 */
@Injectable({ providedIn: 'root' })
export class MileSheetState {
  readonly lock = signal<MileFact[]>([]);
}
