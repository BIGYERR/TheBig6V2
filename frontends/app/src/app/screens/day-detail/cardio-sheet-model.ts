// D278 P-CARDIOSHEET (docs/decisions/this-week.md): This Week's run card carries its own workout, and the chevron goes.
// Kept apart from Angular so the app's node --test suite reads it as it is: where a tap on a card goes, how the session
// sheet draws one cardio alone, and the workout Record run carries above the clock.
import type { BodyBlock } from './day-detail-model.ts';
import { cardioCard, type CardioCardView, type CardioRx } from './cardio-card-model.ts';

/** A session sheet drawn for one cardio alone: the day's when line and the cardio's name over its workout and its log. */
export interface CardioOnly {
  over: string;
  title: string;
}

/** A This Week card, as far as a tap on it reads it. */
export interface TappedCard {
  kind: 'run' | 'lift';
  title: string;
  button: { act: 'record' | 'log' | 'deck' } | null;
}

/** Where a tap on a card goes: the recorder, the cardio's own sheet, the deck, or the whole day. */
export type CardRoute = { to: 'record' } | { to: 'cardio'; sheet: CardioOnly } | { to: 'deck' } | { to: 'day' };

/**
 * A card's button, or its done row's Reopen (D278 items 3 and 4). Record run records; Log the run, the ride or the swim
 * opens that cardio's own sheet; Start lift opens the deck. A done run, ride or swim reopens its own sheet; a done lift the
 * whole day, where a closed day is undone. `when` is the day's when line, the first card's label.
 */
export function cardRoute(k: TappedCard, when: string, tap: 'button' | 'reopen'): CardRoute | null {
  if (tap === 'reopen') return k.kind === 'run' ? { to: 'cardio', sheet: { over: when, title: k.title } } : { to: 'day' };
  const b = k.button;
  if (!b) return null;
  if (b.act === 'record') return { to: 'record' };
  if (b.act === 'deck') return { to: 'deck' };
  return { to: 'cardio', sheet: { over: when, title: k.title } };
}

/** Whether a day holds lift work beside its cardio: a section with a movement in it. */
export function liftOnDay(sections: readonly { items?: readonly unknown[] }[] | null | undefined): boolean {
  return (sections || []).some((s) => (s.items || []).length > 0);
}

/** The sheet's header and body as the whole day draws them. */
export interface SheetParts<Tags> {
  over: string;
  title: string;
  tags: Tags;
  counter: string | null;
  body: BodyBlock[];
}

/** The sheet as it draws: the whole day, or one cardio alone, with or without the day's Done and Skip. */
export interface SheetFrame<Tags> extends SheetParts<Tags> {
  /** Drawn for one cardio alone: no add button. */
  cardio: boolean;
  /** The day's Done and Skip at the foot. */
  foot: boolean;
}

/**
 * D278 item 3: one cardio alone keeps its cardio card and its hand log, under the when line and the cardio's name, with
 * no tags, no logged counter, no add button, and no Done and Skip on a day that also holds lift work. A day that is only
 * cardio keeps its Done and Skip, the one place left to skip or undo it. With no ask, the whole day as it was.
 */
export function cardioSheet<Tags>(only: CardioOnly | null, lift: boolean, whole: SheetParts<Tags>, noTags: Tags): SheetFrame<Tags> {
  if (!only) return { ...whole, cardio: false, foot: true };
  return {
    over: only.over,
    title: only.title,
    tags: noTags,
    counter: null,
    body: whole.body.filter((b) => b.kind === 'cardio' || b.kind === 'log'),
    cardio: true,
    foot: !lift,
  };
}

/** The workout Record run carries above the clock (D278 item 2): the session sheet's cardio card, with no benchmark strip. */
export function recordWorkout(day: { cardio?: CardioRx | null } | null | undefined): CardioCardView | null {
  return cardioCard((day && day.cardio) || null, []);
}
