import { Injectable } from '@angular/core';
import type { CardioOnly } from './cardio-sheet-model';

/**
 * How the next open of the session sheet draws (D278 P-CARDIOSHEET: This Week's run card opens just that cardio). A run,
 * ride or swim card asks for its cardio alone before it opens the day: the sheet then shows the cardio's workout and its
 * hand log, without the lift sections or the add button, and without the day's Done and Skip when the day also holds lift
 * work (a day that is only the run keeps them, the one place left to skip or undo it). Any other open (a lift card's
 * Reopen, a rest day, the deck) asks for nothing and gets the whole day. The ask is taken by the next fresh open, once.
 */
@Injectable({ providedIn: 'root' })
export class SheetMode {
  private next: CardioOnly | null = null;
  ask(m: CardioOnly | null): void {
    this.next = m;
  }
  take(): CardioOnly | null {
    const m = this.next;
    this.next = null;
    return m;
  }
}
