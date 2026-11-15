// native-deck: what do today's decks hold, over the standard histories? Read-only (measure).
// For each of the ten seeded programs walked through the standard history (tests/support/stored-state.ts `life`), at
// each of its five launches, every training day of every week is turned into today's deck on the page itself
// (deckCards over sectionsView over sectionReads, as deck.ts build() does), and counted: which days open the deck,
// what the cards hold, what the grid's sections and items carry, and which stored state a card was drawn from.
//
// Usage: node tests/measure/native-deck_days.ts     (writes tests/measure/native-deck_days.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { life } from '../support/stored-state.ts';
import { deckCards, deckOpens } from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import { sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';

const DAYS7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const T: Record<string, number> = {};
const bump = (k: string, n = 1) => { T[k] = (T[k] || 0) + n; };
const secKeys = new Map<string, number>(), itemKeys = new Map<string, number>(), dayKeys = new Map<string, number>();
const count = (m: Map<string, number>, o: object) => { for (const k of Object.keys(o)) m.set(k, (m.get(k) || 0) + 1); };

function decks(P: any): void {
  const prog = P.prog;
  if (!prog || !prog.weeks) return;
  bump('launches');
  const was = { week: P.ev('currentWeek'), day: P.ev('currentDayKey'), shown: P.ev('_staleWarnShown'), src: P.ev('_staleWarnSrc'), unit: P.IA.window['_unitLabel'] };
  const cache = JSON.stringify(P.ev('_rxCache'));
  const call = (n: string, ...a: unknown[]) => P.ev(n)(...a);
  const bridge = { call, global: (n: string) => P.ev(n) };
  for (const w of Object.keys(prog.weeks)) for (const d of DAYS7) {
    const day = prog.weeks[w][d];
    if (!day) continue;
    bump('days');
    if (day.rest) { bump('rest days'); continue; }
    bump('training days');
    count(dayKeys, day);
    // What deck.ts open() sets before it draws.
    call('_setStaleWarnShown', false); call('_setStaleWarnSrc', '');
    P.IA.window['_unitLabel'] = prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';
    call('_setCurrentWeek', +w); call('_setCurrentDayKey', d);
    const secs = day.sections || [];
    for (const s of secs) { count(secKeys, s); for (const it of s.items || []) count(itemKeys, it); }
    const reads = sectionReads(bridge as never);
    let drafts = 0, cross = 0;
    const r0 = reads.readDraft, c0 = reads.crossLast;
    reads.readDraft = (k: string) => { const x = r0(k); if (x) drafts++; return x; };
    reads.crossLast = (k: string) => { const x = c0(k); if (x) cross++; return x; };
    const cards = deckCards(secs, sectionsView(secs, 0, reads), (s: unknown) => call('_secRounds', s));
    if (!cards.length) { bump('training days with no card'); continue; }
    if (deckOpens(cards)) bump('days whose Start opens the deck'); else bump('days whose only card is the cool down (Start opens the day sheet)');
    bump('decks drawn from a set draft', drafts ? 1 : 0); bump('decks drawn from another program\'s log', cross ? 1 : 0);
    bump('decks where the stale warning spoke', call('_setStaleWarnShown', P.ev('_staleWarnShown')) === undefined && P.ev('_staleWarnShown') ? 1 : 0);
    for (const c of cards) {
      if (c.kind === 'finish') continue;
      bump('cards'); bump('cards: ' + c.kind);
      if (c.skipped) bump('cards skipped');
      if (c.logged) bump('cards logged');
      if (c.swap) bump('cards with a swap control');
      if (c.swappedFrom) bump('cards swapped in');
      if (c.cue) bump('cards with a cue');
      if (c.rpe !== null) bump('cards with an RPE mark');
      for (const v of c.views) if (v.kind === 'section') for (const x of v.body.items) {
        if (x.kind !== 'card') { bump('moves skipped'); continue; }
        bump('moves');
        if (x.logged) bump('moves logged today');
        if (x.added) bump('moves added by the athlete');
        if (x.log && x.log.sets) bump('moves with set rows');
        if (x.log && x.log.load) bump('moves with a load field');
        if (x.log && x.log.load && x.log.load.reuse) bump('moves with a reuse pill');
        if (x.log && x.log.load && x.log.load.reuse && x.log.load.reuse.stale) bump('moves whose reuse pill is stale');
        if (x.log && x.log.load && x.log.load.warn) bump('moves carrying the stale warning');
        if (!x.log) bump('moves with nothing to log');
      }
    }
  }
  call('_setCurrentWeek', was.week); call('_setCurrentDayKey', was.day); call('_setStaleWarnShown', was.shown); call('_setStaleWarnSrc', was.src);
  P.IA.window['_unitLabel'] = was.unit;
  const rc = P.ev('_rxCache');
  for (const k of Object.keys(rc)) delete rc[k];
  Object.assign(rc, JSON.parse(cache));
}

const CREATED = '2026-08-29T09:00:00';
for (const [, seeded] of Object.entries(PROGRAMS) as [string, any][]) {
  const cfg = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
  life(cfg, CREATED, undefined, (_stage: string, P: unknown) => decks(P));
  bump('programs');
}
const out: string[] = [];
const say = (s = '') => { out.push(s); };
say('# The swipe deck in the Expo app: what today\'s decks hold, over the standard histories');
say();
say('Written by `node tests/measure/native-deck_days.ts` (read-only). The ten seeded programs, each walked through the');
say('standard history (`tests/support/stored-state.ts`, `life`); at each of its five launches, every training day of');
say('every week turned into today\'s deck on the page itself, as `deck.ts` builds it.');
say();
say('| What | Count |');
say('|---|---|');
for (const k of Object.keys(T)) say('| ' + k + ' | ' + T[k] + ' |');
const list = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => '`' + k + '` ' + n).join(', ');
say();
say('**A training day carries:** ' + list(dayKeys));
say();
say('**A section carries:** ' + list(secKeys));
say();
say('**An item carries:** ' + list(itemKeys));
writeFileSync(join(REPO, 'tests/measure/native-deck_days.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
