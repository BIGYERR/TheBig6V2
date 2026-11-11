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
  /** What kind of card this is, in words; the session map's tiles show it, the card does not (D283). */
  kicker: string;
  title: string;
  /**
   * The one line under the title (D283 P-DECKFIT), in place of the kicker, the chips and the round sentence: a round's
   * rounds and rest, a block's "Straight through" and rest, a single lift's rest between sets, the cool down's moves and
   * minutes, or why the card is off.
   */
  meta: string;
  /** The Main card's cue (reserve, warmup), else ''. */
  cue: string;
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

const RESERVE_WORDS: Record<number, string> = { 1: 'one rep', 2: 'two reps', 3: 'three reps', 4: 'four reps', 5: 'five reps' };

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

/**
 * The Main card's prescription and cue: the line before its parenthesis, then reserve and warmup in words. The rest is
 * the card's meta line (D283), so the cue no longer says it.
 */
export function mainRx(detail: string): { rx: string; cue: string } {
  const rx = String(detail).split(' (')[0]!;
  const left = reserveOf(detail);
  const parts = [left ? 'Leave about ' + left + ' in reserve.' : '', 'Two or three warmup sets first.'];
  return { rx, cue: parts.filter(Boolean).join(' ') };
}

/** A range in the deck's own words: "2–3" reads "2 to 3" (D283: no en dash in what the deck writes). */
export function rangeWords(s: string): string {
  return String(s).replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2');
}

/** A label as a card's title or a tile's kicker shows it (D283, Mario's "Deck drops it"): the words before its first " — ". */
export function labelHead(label: string): string {
  const s = String(label), at = s.indexOf(' — ');
  return at >= 0 ? s.slice(0, at) : s;
}

/** A round's meta line (D283): its rounds and the rest after each, 90 sec for two rounds, 60 past that (call 6). */
export function roundMeta(rounds: number): string {
  return rounds + ' rounds · ' + (rounds <= 2 ? 90 : 60) + ' sec rest after each';
}

/** A core or hip block's meta line (D283). */
export function blockMeta(core: boolean): string {
  return (core ? 'Core · ' : '') + 'Straight through · 60 to 90 sec rest';
}

/** A single lift's meta line (D283): the rest its prescription names, else the default, between sets. */
export function liftMeta(detail: string, main: boolean): string {
  return rangeWords(restPill(detail, main)) + ' between sets';
}

/** The cool down's meta line (D283): how many moves and about how long, from their prescriptions. */
export function coolMeta(details: string[]): string {
  const secs = details.reduce((t, d) => {
    const h = String(d).match(/^(\d+)\s*×\s*(\d+)\s*sec(\s+each side)?/);
    const m = String(d).match(/(\d+)\s*min/);
    return t + (h ? +h[1]! * +h[2]! * (h[3] ? 2 : 1) : m ? +m[1]! * 60 : 0);
  }, 0);
  const n = details.length;
  return (n === 1 ? '1 easy move' : n + ' easy moves') + ' · about ' + Math.round(secs / 60) + ' min';
}

/** A move's prescription as a deck card prints it (D283): its dose, the RPE for the line, and any cue as sentences. */
export interface RxLine { dose: string; rpe: string | null; cue: string | null }

// The leading dose: sets and reps or a time, a unit, and "each" or "each side" when nothing else follows it.
const DOSE = /^~?\d+(?:\.\d+)?(?:\s*[–-]\s*\d+(?:\.\d+)?)?(?:\s*[×x]\s*~?\d+(?:\.\d+)?(?:\s*[–-]\s*\d+(?:\.\d+)?)?)?(?:\s*(?:sec|min|yd|yards|reps|rep|sets))?(?:\s+each(?:\s+side)?(?=$|[,;(@]|\s+[—@(]))?/;
// What the card says elsewhere: the RPE (the line), reserve and "in the tank" (the RPE), warmups (the main cue), rest (the meta line).
const SAID = [/^(?:hold\s+)?RPE\s*\d/i, /^(?:leave|stop)\b/i, /^three in the tank$/i, /^ramp up with\b/i, /^~?\d+(?:\s*[–-]\s*\d+)?\s*(?:min|s|sec)\s+rest$/i];

/**
 * A prescription split for a deck card (D283): the dose, with the × spaced and "~" read "About" (the cool down prints it;
 * a move with sets prints its live set summary instead); the RPE it names ("RPE 6 to 7" for a range); and what is left,
 * as sentences. A dash, a semicolon or a parenthesis ends a sentence; a comma keeps it going.
 */
export function rxLine(detail: string): RxLine {
  const d = String(detail || '').replace(/\s+/g, ' ').trim();
  const r = d.match(/RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?/);
  const rpe = r ? 'RPE ' + r[1] + (r[2] ? ' to ' + r[2] : '') : null;
  const head = (d.match(DOSE) || [''])[0];
  const dose = rangeWords(head.trim().replace(/\s*[×x]\s*/, ' × ').replace(/^~\s*/, 'About '));
  const parts: { sep: string; text: string }[] = [];
  const re = /\s*(—|;|,|\(|\)|@)\s*|([^—;,()@]+)/g;
  const rest = d.slice(head.length);
  let sep = 'start';
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest))) {
    if (m[1]) {
      if (sep !== 'dash') sep = m[1] === ',' ? 'comma' : 'dash';
      continue;
    }
    const text = m[2]!.trim();
    if (!text) continue;
    parts.push({ sep, text });
    sep = 'start';
  }
  const sentences: string[] = [];
  let open = false;
  for (const p of parts) {
    if (SAID.some((x) => x.test(p.text))) {
      open = false;
      continue;
    }
    const t = rangeWords(p.text.replace(/^~\s*/, 'about '));
    if (open && p.sep === 'comma') sentences[sentences.length - 1] += ', ' + t;
    else sentences.push(t);
    open = true;
  }
  const cue = sentences.map((x) => x.charAt(0).toUpperCase() + x.slice(1) + '.').join(' ') || null;
  return { dose, rpe, cue };
}

/** The four move rule (D283, Auto): a round or block of this many moves opens with only its first unlogged move unfolded. */
export const FOLD_AT = 4;

/** A round or block long enough that only one of its moves shows in full at a time (D283). */
export function longCard(c: Pick<DeckCard, 'kind' | 'moves'>): boolean {
  return (c.kind === 'round' || c.kind === 'block') && c.moves.length >= FOLD_AT;
}

/** After a move's set summary is tapped (D283): that move stays open while its sets are, or on a long card; else none, and every move unfolds. */
export function openAfterSetsTap(c: Pick<DeckCard, 'kind' | 'moves'>, exKey: string, setsOpen: boolean): string | null {
  return setsOpen || longCard(c) ? exKey : null;
}

/** The move a long card keeps open while the others fold: its first unlogged move, else its first (D283); null on any other card. */
export function restOpen(c: Pick<DeckCard, 'kind' | 'moves'>): string | null {
  if (!longCard(c)) return null;
  const m = c.moves.find((x) => !x.logged) || c.moves[0];
  return m ? m.exKey : null;
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
  key: 'finish', kind: 'finish', tone: 'finish', kicker: 'Finish', title: 'Call it', meta: 'How did the whole thing feel?', cue: '',
  rpe: null, main: false, views: [], moves: [], skipped: false, logged: false, swap: null, skip: null, undo: null, swappedFrom: null,
};

/**
 * The day's sections as deck cards, in the engine's order (coach's read-ahead ruling: never re-sorted): a main or single
 * lift is one card, a round of two or more is one card with its movements inside, a core or hip section is one block
 * card, post-run mobility is one cool down card, and Call it closes the deck. The run is not a card (D272 amends
 * P-DECK); nothing else is dropped. `views` is sectionsView over the same sections with base 0.
 */
/** An item that is a note, not a move (D283 Amendment 1): no prescription, and markup in its name (the taper's flag). */
export function isNote(it: { name?: string; detail?: string }): boolean {
  return !String(it.detail || '').trim() && /<[a-z]/i.test(String(it.name || ''));
}

/** A note's words for a cue (D283 Amendment 1): the markup dropped, each " — " ending a sentence. */
export function noteWords(name: string): string {
  return String(name).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+—\s+/).map((x) => x.trim()).filter(Boolean)
    .map((x) => {
      const t = x.charAt(0).toUpperCase() + x.slice(1);
      return /[.!?]$/.test(t) ? t : t + '.';
    }).join(' ');
}

export function deckCards(sections: ExSection[], views: SectionView[], roundsOf: (sec: ExSection) => number | null): DeckCard[] {
  const cards: DeckCard[] = [];
  let pending = '';
  sections.forEach((sec, si) => {
    const view = views[si];
    if (!view) return;
    // D283 Amendment 1: a section of notes (the taper's) is not a card; its words join the cue of the card before it.
    const its = sec.items || [];
    if (its.length && its.every(isNote)) {
      const words = its.map((it) => noteWords(it.name || '')).join(' ');
      const last = cards[cards.length - 1];
      if (last) cards[cards.length - 1] = { ...last, cue: [last.cue, words].filter(Boolean).join(' ') };
      else pending = [pending, words].filter(Boolean).join(' ');
      return;
    }
    const label = sec.label || '';
    const isMain = /^main/i.test(label);
    const isRound = !!(sec.superset || sec.type === 'superset') && (sec.items || []).length > 1;
    const base = { cue: '', rpe: null, main: false, swap: null, swappedFrom: null } as const;
    if (/mobility/i.test(label) && !isMain && !sec.superset) {
      const items = itemsOf(view), moves = liveMoves(items), live = namesOf(items);
      cards.push({ ...base, key: 's' + si, kind: 'cool', tone: 'hip', kicker: 'After the run', title: 'Stretch and roll', meta: coolMeta((sec.items || []).map((it) => it.detail || '')),
        views: [bare(view)], moves, skipped: !live.length, logged: allLogged(moves), skip: null, undo: live.length ? null : { kind: 'names', names: skippedNames(items) } });
      return;
    }
    if (sec.core || sec.hip) {
      const items = itemsOf(view), moves = liveMoves(items), live = namesOf(items);
      const title = sec.core ? String(sec.coreHeader || 'Core').replace(/^Core — /, '') : labelHead(label) || 'Hip stability';
      cards.push({ ...base, key: 's' + si, kind: 'block', tone: sec.core ? 'core' : 'hip', kicker: sec.core ? 'Core' : 'Prehab', title,
        meta: blockMeta(!!sec.core),
        views: [bare(view)], moves, skipped: !live.length, logged: allLogged(moves),
        skip: live.length ? { kind: 'names', names: live } : null, undo: live.length ? null : { kind: 'names', names: skippedNames(items) } });
      return;
    }
    if (isRound) {
      const r = roundsOf(sec);
      if (view.kind === 'skippedRound') {
        cards.push({ ...base, key: 's' + si, kind: 'round', tone: 'lift', kicker: 'Round', title: labelHead(label) || 'Round', meta: 'The whole card is off today.',
          views: [], moves: [], skipped: true, logged: false, skip: null, undo: { kind: 'round', secIdx: si } });
        return;
      }
      const items = itemsOf(view), moves = liveMoves(items), live = namesOf(items);
      const demoted = view.body.kind === 'block' && live.length === 1;
      const meta = !live.length ? 'Every movement is out.' : demoted ? 'One movement left, so the round is off. It keeps its own sets.'
        : r ? roundMeta(r) : 'Straight through';
      cards.push({ ...base, key: 's' + si, kind: 'round', tone: 'lift', kicker: 'Round', title: demoted ? live[0]! : labelHead(label) || 'Round', meta,
        views: [bare(view)], moves, skipped: !live.length, logged: allLogged(moves),
        skip: live.length ? { kind: 'round', secIdx: si } : null, undo: live.length ? null : { kind: 'names', names: skippedNames(items) } });
      return;
    }
    itemsOf(view).forEach((x, k) => {
      const main = isMain && k === 0;
      const kicker = main ? 'Main' : isMain ? 'Main, second lift' : sec._added ? 'Added by you' : labelHead(label) || 'Lift';
      const one: SectionView = view.kind === 'section' ? { ...view, label: null, body: { kind: 'block', label: null, items: [x] } } : view;
      if (x.kind === 'skipped') {
        cards.push({ ...base, key: 's' + si + 'i' + k, kind: 'lift', tone: 'lift', kicker, title: x.name, meta: x.name + ' is off today.', main,
          views: [], moves: [], skipped: true, logged: false, skip: null, undo: { kind: 'exercise', name: x.name } });
        return;
      }
      const m = main ? mainRx(x.rxDetail) : { rx: x.rxDetail, cue: '' };
      const moves = liveMoves([x]);
      cards.push({ key: 's' + si + 'i' + k, kind: 'lift', tone: 'lift', kicker, title: x.name, meta: liftMeta(x.rxDetail, main), cue: m.cue,
        rpe: rpeOf(m.rx), main,
        views: [one], moves, skipped: false, logged: allLogged(moves), swap: x.swap, skip: x.skip ? { kind: 'exercise', name: x.name } : null, undo: null,
        swappedFrom: x.swappedFrom });
    });
  });
  if (pending && cards.length) cards[0] = { ...cards[0]!, cue: [pending, cards[0]!.cue].filter(Boolean).join(' ') };
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
