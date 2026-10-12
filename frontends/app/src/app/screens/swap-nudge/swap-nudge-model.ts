// The coach's swap nudge, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase
// E, step 9: the card's words move from the legacy showSwapNudge to the SwapNudge component). When to offer it, and
// what accepting or declining does, stay the legacy script's (bumpSwapCount, acceptSwapNudge, dismissSwapNudge).

/** The nudge's two paragraphs. */
export interface NudgeText {
  noticed: string;
  offer: string;
}

/** The slot a swap would take over: the movement pattern of the lift swapped out, or "main" without one. */
export function nudgeSlot(pattern: string | null | undefined): string {
  return ((pattern || 'main') + '').replace(/_/g, ' ');
}

/** The words, as the legacy showSwapNudge wrote them, for three sessions running of `from` traded for `to`. */
export function nudgeText(from: string, to: string, pattern: string | null | undefined): NudgeText {
  return {
    noticed: 'That is three sessions running you have traded ' + from.toLowerCase() + ' for ' + to.toLowerCase() + '.',
    offer: 'Want me to make ' + to.toLowerCase() + ' your ' + nudgeSlot(pattern) + ' from here on? I will rebuild the rest of the block around it.',
  };
}
