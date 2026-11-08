// The swipe deck (D275 P-DECK, docs/decisions/swipe-deck.md): a day's lift work as a deck of cards, one card per thing
// to do, swiped through while training. This file is the deck's logic, apart from Angular so the tests drive it: the
// day's sections turned into cards by the rule the canvas was built with (docs/design/swipe-deck/deck-data.ts, board()),
// what each card says, what Start session opens, the RPE bubble, the day log Call it writes, and the opening motion's
// numbers (call 16). The deck writes nothing of its own: each card holds the app's own exercise cards (SessionSections),
// so every set is logged by the session sheet's handlers into the same stores.
import type { ExSection, ExView, SectionView } from '../day-detail/session-sections-model.ts';

export type CardKind = 'lift' | 'round' | 'block' | 'cool' | 'finish';
/** One colour per kind (call 4): a lift or a round, hip work, core work, the finish. */
export type CardTone = 'lift' | 'hip' | 'core' | 'finish';

/** What a card's skip and its undo act on, through the app's own handlers. */
export type CardAct =
  | { kind: 'exercise'; name: string }
  | { kind: 'round'; secIdx: number }
  | { kind: 'names'; names: string[] };

/** A movement on a card that the app can log, and whether it is logged today. */
export interface CardMove { exKey: string; name: string; rxDetail: string; logged: boolean }

export interface DeckCard {
  /** Stable across redraws: the section, and the item for a single lift. */
  key: string;
  kind: CardKind;
  tone: CardTone;
  kicker: string;
  title: string;
  rx: string;
  /** The Main card's cue (reserve, warmup, rest), else ''. */
  cue: string;
  /** Sets and rest only, or a round's rounds and rest (call 6). */
  chips: string[];
  /** The RPE the info mark explains, on a single lift whose prescription names one (call 7), else null. */
  rpe: number | null;
  main: boolean;
  /** What SessionSections draws on the card: this card's slice of the day's sections, labels left to the card. */
  views: SectionView[];
  /** Every movement that can be logged, in order. */
  moves: CardMove[];
  skipped: boolean;
  /** Every live movement that can be logged is logged, and there is at least one. */
  logged: boolean;
  /** The card's swap (a single lift), its skip and the undo of a skip, null where the app offers none. */
  swap: { secIdx: number; itemIdx: number } | null;
  skip: CardAct | null;
  undo: CardAct | null;
  swappedFrom: string | null;
}

/** Past this many sets a movement shows one set at a time behind a strip of pips (first round, board P). */
export const PIP_THRESHOLD = 4;

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
const REST_WORDS: Record<string, string> = { '3': 'Three minutes rest.', '2–3': 'Two to three minutes rest.', '2': 'Two minutes rest.' };
const RESERVE_WORDS: Record<number, string> = { 1: 'one rep', 2: 'two reps', 3: 'three reps', 4: 'four reps', 5: 'five reps' };

/** "3 sets" from a prescription that opens with its count, else null. */
export function setsPill(detail: string): string | null {
  const n = (String(detail).match(/^(\d+)\s*(?:×|sets)/) || [])[1];
  return n ? n + ' sets' : null;
}

/** The rest a prescription names, else the generator's default: two to three minutes on a main, a minute or so otherwise. */
export function restPill(detail: string, main: boolean): string {
  const m = String(detail).match(/(\d+(?:–\d+)?) min rest/);
  if (m) return m[1] + ' min rest';
  const s = String(detail).match(/(\d+)\s*s(?:ec)? rest/);
  if (s) return s[1] + ' sec rest';
  return main ? '2–3 min rest' : '60–90 sec rest';
}

/** The RPE a prescription names, half steps kept ("RPE 6.5"), the top of a range ("RPE 6–7" is 7), else null. */
export function rpeOf(detail: string): number | null {
  const m = String(detail).match(/RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?/);
  if (!m) return null;
  const n = +(m[2] || m[1]!);
  return n >= 1 && n <= 10 ? n : null;
}

/** Reps left in the tank for an RPE, in words: three for 7, "three to four" for 6.5. */
export function reserveWords(n: number): string | undefined {
  const left = 10 - n, lo = Math.floor(left), hi = Math.ceil(left);
  if (lo === hi) return RESERVE_WORDS[lo];
  const a = RESERVE_WORDS[lo], b = RESERVE_WORDS[hi];
  return a && b ? a.replace(/ reps?$/, '') + ' to ' + b : undefined;
}

/**
 * The reps in reserve the engine's own line names ("leave ~4 reps in reserve", "leave 3+ in reserve", "leave 3–4 in
 * reserve", "stop 2 reps short of failure"), in words; else what its RPE leaves; else nothing.
 */
export function reserveOf(detail: string): string | undefined {
  const d = String(detail);
  const range = d.match(/leave (\d+)\s*[–-]\s*(\d+) (?:reps )?in reserve/);
  if (range) return reserveWords(10 - (+range[1]! + +range[2]!) / 2);
  const one = d.match(/leave ~?(\d+)(?:\+| or more)? (?:reps )?in reserve/) || d.match(/stop (\d+) reps? short of failure/);
  if (one) return RESERVE_WORDS[+one[1]!];
  const n = rpeOf(d);
  return n != null ? reserveWords(n) : undefined;
}

/** The Main card's prescription and cue: the line before its parenthesis, then reserve, warmup and rest in words. */
export function mainRx(detail: string): { rx: string; cue: string } {
  const rx = String(detail).split(' (')[0]!;
  const left = reserveOf(detail);
  const rest = (String(detail).match(/(\d+(?:–\d+)?) min rest/) || [])[1];
  const parts = [left ? 'Leave about ' + left + ' in reserve.' : '', 'Ramp up with two or three warmup sets.', rest ? REST_WORDS[rest] || rest + ' minutes rest.' : ''];
  return { rx, cue: parts.filter(Boolean).join(' ') };
}

/** The cool down's line: how many moves and about how long, from their prescriptions. */
export function coolRx(details: string[]): string {
  const secs = details.reduce((t, d) => {
    const h = String(d).match(/^(\d+)\s*×\s*(\d+)\s*sec(\s+each side)?/);
    const m = String(d).match(/(\d+)\s*min/);
    return t + (h ? +h[1]! * +h[2]! * (h[3] ? 2 : 1) : m ? +m[1]! * 60 : 0);
  }, 0);
  const n = details.length;
  return (n === 1 ? 'One easy move' : (WORDS[n] || String(n)) + ' easy moves') + ', about ' + Math.round(secs / 60) + ' minutes. Take your time.';
}

const moveOf = (x: ExView): CardMove | null => (x.kind === 'card' && x.log ? { exKey: x.exKey, name: x.name, rxDetail: x.rxDetail, logged: x.logged } : null);
const liveMoves = (items: ExView[]): CardMove[] => items.map(moveOf).filter((m): m is CardMove => !!m);
const allLogged = (moves: CardMove[]): boolean => moves.length > 0 && moves.every((m) => m.logged);
const namesOf = (items: ExView[]): string[] => items.filter((x) => x.kind === 'card').map((x) => (x as { name: string }).name);
const skippedNames = (items: ExView[]): string[] => items.filter((x) => x.kind === 'skipped').map((x) => x.name);
/** The section drawn bare: the card states its label and its round line, SessionSections draws the movements. */
const bare = (v: SectionView): SectionView => (v.kind === 'section' ? { ...v, label: null } : v);
const itemsOf = (v: SectionView): ExView[] => (v.kind === 'section' ? v.body.items : []);

/** The finish card, always last: Call it (call R). */
export const FINISH: DeckCard = {
  key: 'finish', kind: 'finish', tone: 'finish', kicker: 'Finish', title: 'Call it', rx: 'How did the whole thing feel?', cue: '', chips: [],
  rpe: null, main: false, views: [], moves: [], skipped: false, logged: false, swap: null, skip: null, undo: null, swappedFrom: null,
};

/**
 * The day's sections as deck cards, in the engine's order (coach's read-ahead ruling: never re-sorted): a main or single
 * lift is one card, a round of two or more is one card with its movements inside, a core or hip section is one block
 * card, post-run mobility is one cool down card, and Call it closes the deck. The run is not a card (D272 amends
 * P-DECK); nothing else is dropped. `views` is sectionsView over the same sections with base 0.
 */
export function deckCards(sections: ExSection[], views: SectionView[], roundsOf: (sec: ExSection) => number | null): DeckCard[] {
  const cards: DeckCard[] = [];
  sections.forEach((sec, si) => {
    const view = views[si];
    if (!view) return;
    const label = sec.label || '';
    const isMain = /^main/i.test(label);
    const isRound = !!(sec.superset || sec.type === 'superset') && (sec.items || []).length > 1;
    const base = { cue: '', rpe: null, main: false, swap: null, swappedFrom: null } as const;
    if (/mobility/i.test(label) && !isMain && !sec.superset) {
      const items = itemsOf(view), moves = liveMoves(items), live = namesOf(items);
      cards.push({ ...base, key: 's' + si, kind: 'cool', tone: 'hip', kicker: 'After the run', title: 'Stretch and roll', rx: coolRx((sec.items || []).map((it) => it.detail || '')),
        chips: [], views: [bare(view)], moves, skipped: !live.length, logged: allLogged(moves), skip: null, undo: live.length ? null : { kind: 'names', names: skippedNames(items) } });
      return;
    }
    if (sec.core || sec.hip) {
      const items = itemsOf(view), moves = liveMoves(items), live = namesOf(items);
      const title = sec.core ? String(sec.coreHeader || 'Core').replace(/^Core — /, '') : label || 'Hip stability';
      cards.push({ ...base, key: 's' + si, kind: 'block', tone: sec.core ? 'core' : 'hip', kicker: sec.core ? 'Core' : 'Prehab', title,
        rx: 'One block, straight through', chips: [setsPill((sec.items[0] || {}).detail || ''), '60–90 sec rest'].filter((x): x is string => !!x),
        views: [bare(view)], moves, skipped: !live.length, logged: allLogged(moves),
        skip: live.length ? { kind: 'names', names: live } : null, undo: live.length ? null : { kind: 'names', names: skippedNames(items) } });
      return;
    }
    if (isRound) {
      const r = roundsOf(sec);
      const chips = r ? [r + ' rounds', (r <= 2 ? 90 : 60) + ' sec rest'] : [];
      if (view.kind === 'skippedRound') {
        cards.push({ ...base, key: 's' + si, kind: 'round', tone: 'lift', kicker: 'Round', title: label || 'Round', rx: 'The whole card is off today.', chips: ['Skipped'],
          views: [], moves: [], skipped: true, logged: false, skip: null, undo: { kind: 'round', secIdx: si } });
        return;
      }
      const items = itemsOf(view), moves = liveMoves(items), live = namesOf(items);
      const demoted = view.body.kind === 'block' && live.length === 1;
      const rx = !live.length ? 'Every movement is out.' : demoted ? 'One movement left, so the round is off. It keeps its own sets.'
        : r ? r + ' rounds, no rest inside · ' + (r <= 2 ? 90 : 60) + ' sec between rounds' : label;
      cards.push({ ...base, key: 's' + si, kind: 'round', tone: 'lift', kicker: 'Round', title: demoted ? live[0]! : label || 'Round', rx, chips,
        views: [bare(view)], moves, skipped: !live.length, logged: allLogged(moves),
        skip: live.length ? { kind: 'round', secIdx: si } : null, undo: live.length ? null : { kind: 'names', names: skippedNames(items) } });
      return;
    }
    itemsOf(view).forEach((x, k) => {
      const main = isMain && k === 0;
      const kicker = main ? 'Main' : isMain ? 'Main, second lift' : sec._added ? 'Added by you' : label || 'Lift';
      const one: SectionView = view.kind === 'section' ? { ...view, label: null, body: { kind: 'block', label: null, items: [x] } } : view;
      if (x.kind === 'skipped') {
        cards.push({ ...base, key: 's' + si + 'i' + k, kind: 'lift', tone: 'lift', kicker, title: x.name, rx: x.name + ' is off today.', chips: ['Skipped'], main,
          views: [], moves: [], skipped: true, logged: false, skip: null, undo: { kind: 'exercise', name: x.name } });
        return;
      }
      const m = main ? mainRx(x.rxDetail) : { rx: x.rxDetail, cue: '' };
      const moves = liveMoves([x]);
      cards.push({ key: 's' + si + 'i' + k, kind: 'lift', tone: 'lift', kicker, title: x.name, rx: m.rx, cue: m.cue,
        chips: [setsPill(x.rxDetail), restPill(x.rxDetail, main)].filter((c): c is string => !!c), rpe: rpeOf(m.rx), main,
        views: [one], moves, skipped: false, logged: allLogged(moves), swap: x.swap, skip: x.skip ? { kind: 'exercise', name: x.name } : null, undo: null,
        swappedFrom: x.swappedFrom });
    });
  });
  if (cards.length) cards.push(FINISH);
  return cards;
}

/**
 * What Start session opens: the deck when the day has lift work beyond the cool down, else the day sheet, where the run
 * is logged (a long run whose only lift card is its cool down: the run is the day).
 */
export function deckOpens(cards: DeckCard[]): boolean {
  return cards.some((c) => c.kind !== 'finish' && c.kind !== 'cool');
}

/** The position numeral top left (board E): this card and the deck's length, two digits each. */
export function numeral(i: number, n: number): { num: string; of: string } {
  return { num: String(i + 1).padStart(2, '0'), of: '/' + String(n).padStart(2, '0') };
}

/** A card's state on the session map and its pip. */
export function stateOf(card: DeckCard, k: number, current: number, done: boolean): 'Skipped' | 'Logged' | 'You are here' | 'Up next' {
  if (card.skipped) return 'Skipped';
  if (card.logged || done) return 'Logged';
  return k === current ? 'You are here' : 'Up next';
}

/** The big button's words: the finish marks the day, a live card is done and moves on, anything else just moves on. */
export function ctaText(card: DeckCard, done: boolean, dayDone: boolean): string {
  if (card.kind === 'finish') return dayDone ? 'Day done' : 'Mark the day done';
  return card.skipped || card.logged || done ? 'Next one' : 'Done, next one';
}

/**
 * The RPE bubble (call 7): its line for the card's number, and the four bands with the card's one lit. A half step reads
 * as the step below, as the engine's own line does (RPE 6.5 leaves about four), so the bubble and the card agree.
 */
export function rpeBubble(rpe: number): { line: string; rows: { range: string; label: string; detail: string; on: boolean }[] } {
  const n = Math.min(10, Math.max(1, Math.floor(rpe)));
  const left: Record<number, string> = { 6: 'four', 7: 'three', 8: 'two' };
  const line = n <= 5 ? 'Easy to moderate. You could keep going for a while.'
    : n >= 10 ? 'Nothing left. Every rep you had.'
      : n === 9 ? 'About one rep left in the tank. Stop the set there.'
        : 'About ' + left[n] + ' reps left in the tank. Stop the set there.';
  const BANDS: [string, string, string, number, number][] = [['1–3', 'Easy', 'Full conversation', 1, 3], ['4–6', 'Moderate', 'Short sentences only', 4, 6],
    ['7–8', 'Hard', 'A few words at a time', 7, 8], ['9–10', 'Max', "Can't talk. All out.", 9, 10]];
  return { line, rows: BANDS.map(([range, label, detail, lo, hi]) => ({ range, label, detail, on: n >= lo && n <= hi })) };
}

/** Call it's slider words, as the canvas has them, one clear word for each step of the session's effort (call R). */
export const CALL_IT_WORDS: Record<number, string> = {
  1: 'barely moving', 2: 'a walk in the park', 3: 'very easy', 4: 'easy', 5: 'steady', 6: 'comfortable, four left in the tank', 7: 'working, three left',
  8: 'hard, two left', 9: 'very hard, one left', 10: 'everything you had',
};

/** A day's log entry as the app stores it (ia_logs_), as far as Call it touches it. */
export interface DayLog { rpe?: unknown; notes?: unknown; week?: unknown; ts?: unknown; [field: string]: unknown }

/**
 * Call it's write: the day's RPE and notes merged into the entry, every other field carried as it was (the run's log,
 * the sets, the parked sport, the rest-day jog). The session sheet's persistLogFields rebuilds the entry from the form on
 * screen, which the deck does not draw, so the deck never calls it.
 */
export function callItLog(entry: DayLog | null | undefined, rpe: number | null, notes: string, week: number, now: number): DayLog {
  const out: DayLog = { ...(entry || {}) };
  if (rpe != null) out.rpe = String(rpe);
  else if (out.rpe == null) out.rpe = '';
  out.notes = notes;
  out.week = week;
  out.ts = now;
  return out;
}

/** The opening motion, Lift first at 420 ms (call 16), every number Mario picked, derived from the speed. */
export function openMotion(speed = 420): {
  lift: number; open: number; close: number; deckFadeIn: number; deckFadeDelay: number; copyFadeOut: number; deckFadeOut: number;
  copyBackFrom: number; copyBackTo: number; settled: number;
  ease: { lift: string; open: string; close: string };
} {
  const lift = Math.round(speed * 0.4), close = Math.round(speed * 0.85);
  return {
    lift, open: speed, close,
    deckFadeIn: Math.round(speed * 0.7), deckFadeDelay: Math.round(speed * 0.2), copyFadeOut: Math.round(speed * 0.3),
    deckFadeOut: Math.round(close * 0.4), copyBackFrom: Math.round(close * 0.45), copyBackTo: Math.round(close * 0.45) + Math.round(close * 0.35),
    settled: lift + speed,
    ease: { lift: 'cubic-bezier(.3,0,.2,1)', open: 'cubic-bezier(.05,.7,.1,1)', close: 'cubic-bezier(.3,0,.8,.15)' },
  };
}
