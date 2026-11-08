import { Injectable, signal } from '@angular/core';

/** What opens the deck: the day, and the card on This Week it opens out of (call 16), when there is one on screen. */
export interface DeckOpen {
  dayKey: string;
  from: HTMLElement | null;
}

/**
 * The swipe deck's shared state (D275 P-DECK): This Week asks for it, the deck opens, and the session sheet hands the
 * deck its redraws while it is open. Every edit the deck's cards make (a skip, a swap, an undo) runs the session
 * sheet's own handler, which redraws through openDetail; while the deck is open that redraw is the deck's, and the
 * sheet stays shut and empty, so no exercise card is on the page twice (the set handlers find their inputs by id).
 */
@Injectable({ providedIn: 'root' })
export class DeckState {
  /** The latest request to open the deck. */
  readonly request = signal<DeckOpen | null>(null);
  /** True from the moment the deck starts to open until it has closed. */
  readonly isOpen = signal(false);
  /** The deck's redraw for openDetail while it is open, set by the deck. */
  redraw: ((dayKey: string, day: unknown) => void) | null = null;
  /** Empties the session sheet, set by the sheet, called by the deck before it draws its cards. */
  clearSheet: (() => void) | null = null;

  /** Start session: opens the day as a deck out of the card that was tapped. */
  start(dayKey: string, from: HTMLElement | null): void {
    this.request.set({ dayKey, from });
  }
}
