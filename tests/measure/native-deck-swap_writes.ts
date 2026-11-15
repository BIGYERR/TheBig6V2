// native-deck-swap: what today's app reads and writes when a lift is swapped on the deck, put back, and an added move
// removed. Read-only (measure), before the Expo deck's swap sheet (MIGRATION.md phase 3, the deck's third session).
// It runs today's page in the VM harness on the test phone of tests/support/stored-state.ts.
//
// A. Every day of the live grid at each stretch of the ten standard histories: how many moves the deck offers a swap
//    on, where the control sits, and what the sheet would show for each (today's swapSheetView over the page's own
//    swapCandidates and auxSwapCandidates).
// B. One training day of HALF_MANNY: each handler the sheet and the card reach, run on the page, with the keys it
//    changed; what a swap does to the card's key, the move's lift log key, a set draft and a logged lift; the nudge.
//
// Usage: node tests/measure/native-deck-swap_writes.ts   (writes tests/measure/native-deck-swap_writes.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type DeckCard, deckCards } from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import { type ExCard, type ExSection, sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';
import { swapSheetView } from '../../frontends/app/src/app/screens/swap-sheet/swap-sheet-model.ts';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, at, firstWeek, life, training } from '../support/stored-state.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const say = (s = ''): void => { out.push(s); };
const bump = (m: Record<string, number>, k: string | number): void => { m[k] = (m[k] || 0) + 1; };
const list = (m: Record<string, number>): string => Object.keys(m).sort((a, b) => (isNaN(+a) || isNaN(+b) ? a.localeCompare(b) : +a - +b)).map((k) => '`' + k + '` ' + m[k]).join(', ') || 'none';
const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const pad = (n: number): string => String(n).padStart(2, '0');
const iso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const idsOf = (keys: Record<string, string>): string[] => {
  try { return (JSON.parse(keys['ia_programs'] || '[]') as { id?: string }[]).map((p) => String(p.id || '')).filter(Boolean).sort((a, b) => b.length - a.length); } catch { return []; }
};
function family(k: string, ids: string[]): string { let f = k; for (const id of ids) f = f.split(id).join('<id>'); return f; }

/** The day's deck as today's deck.ts build() draws it, the week and day in hand set first. */
function deckOf(P: Phone, w: number, d: string): DeckCard[] {
  const f = <T>(name: string): T => P.ev(name) as T;
  const call = <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args);
  call('_setCurrentWeek', w); call('_setCurrentDayKey', d);
  const secs = ((P.day(w, d as never) || {}).sections || []) as ExSection[];
  return plain(deckCards(secs, sectionsView(secs, 0, sectionReads({ call, global: f })), (x) => call<number | null>('_secRounds', x)));
}
const movesOf = (cards: DeckCard[]): ExCard[] => cards.flatMap((c) => c.views.flatMap((v) => (v.kind === 'section' ? v.body.items : []))).filter((x): x is ExCard => x.kind === 'card');

/** The sheet for one move, as swap-sheet.ts open() builds it from the page. */
function sheetOf(P: Phone, w: number, d: string, secIdx: number, itemIdx: number): any {
  P.IA.ctx['__w'] = w; P.IA.ctx['__d'] = d; P.IA.ctx['__si'] = secIdx; P.IA.ctx['__ii'] = itemIdx;
  const raw = P.ev(`(function(){var day=activeProg.weeks[__w][__d];var sec=day.sections[__si];var item=sec.items[__ii];
    var c=swapCandidates(item.name,day,__w,activeProg);var fam=!c.pattern?_auxFamily(item.name):null;
    if(fam){c.tier1=auxSwapCandidates(item.name,day,activeProg);c.tier2=[];}
    return JSON.stringify({name:item.name,detail:item.detail||'',sec:{label:sec.label,superset:sec.superset,type:sec.type,items:(sec.items||[]).map(function(x){return {name:x.name};})},c:c,fam:fam,famLabel:fam?_AUX_FAMILY_LABEL[fam]:null,tier:_compoundTier(item.name),uni:(day._ovKey&&activeProg._swapUniverseByKey&&activeProg._swapUniverseByKey[day._ovKey])?'by overlay key':'base'});})()`);
  const r = JSON.parse(raw);
  const view = swapSheetView({ name: r.name, detail: r.detail, itemIdx, section: r.sec, candidates: r.c, familyLabel: r.famLabel ?? null, compoundTier: r.tier,
    loadNote: (o, c) => P.ev(`swapLoadNote(${J(o)},${J(c)})`) });
  return { r, view };
}

// ── A. The cards and the sheet ───────────────────────────────────────────────────────────────────────────────────
const A = { stages: 0, days: 0, cards: 0, moves: 0, swappable: 0, onCardTop: 0, onMoveRow: 0, kind: {} as Record<string, number>, pattern: 0, aux: 0, empty: 0, emptyBy: {} as Record<string, number>,
  t1: {} as Record<string, number>, t2: {} as Record<string, number>, rows: 0, flow: 0, slot: {} as Record<string, number>, loadNotes: 0, uni: {} as Record<string, number>,
  swappedIn: 0, swappedInCardTop: 0, added: 0, addedByProg: {} as Record<string, number>, loggedSwappable: 0, skippedSwappable: 0, keeps: 0, noKeeps: 0, universe: {} as Record<string, number>, perProg: {} as Record<string, number>, addedKind: {} as Record<string, number>, swappedKind: {} as Record<string, number> };
for (const [name, cfg] of Object.entries(PROGRAMS)) {
  life(walkable(cfg), CREATED, undefined, (_stage, P) => {
    A.stages++;
    const Q = new Phone();
    for (const [k, v] of Object.entries(P.dump())) Q.damage(k, v);
    Q.launch(iso(new Date(P.ev('Date.now()') as number)));
    const prog = Q.prog;
    if (!prog || !prog.weeks) return;
    bump(A.universe, Array.isArray(prog._swapUniverse) ? 'a list' : 'none');
    for (const w of Object.keys(prog.weeks).map(Number).sort((a, b) => a - b)) for (const d of DAYS) {
      const day = Q.day(w, d as never);
      if (!day || day.rest || !Array.isArray(day.sections) || !day.sections.length) continue;
      const cards = deckOf(Q, w, d);
      if (!cards.length) continue;
      A.days++;
      A.cards += cards.length;
      for (const c of cards) {
        if (c.swap) A.onCardTop++;
        if (c.swappedFrom) A.swappedInCardTop++;
        for (const x of movesOf([c])) {
          A.moves++;
          if (x.added) { A.added++; bump(A.addedByProg, name); bump(A.addedKind, c.kind + (c.swap ? ', swap on its top' : '')); }
          if (x.swappedFrom) { A.swappedIn++; bump(A.swappedKind, c.kind); }
          if (!x.swap) continue;
          A.swappable++; bump(A.perProg, name);
          bump(A.kind, c.kind);
          if (!c.swap) A.onMoveRow++;
          if (x.logged) A.loggedSwappable++;
          if (x.skipped) A.skippedSwappable++;
          const { r, view } = sheetOf(Q, w, d, x.swap.secIdx, x.swap.itemIdx);
          if (r.fam) A.aux++; else A.pattern++;
          bump(A.uni, r.uni);
          bump(A.t1, view.sameJob.length); bump(A.t2, view.otherJob.length);
          A.rows += view.sameJob.length + view.otherJob.length;
          if (!view.sameJob.length && !view.otherJob.length) { A.empty++; bump(A.emptyBy, r.fam ? 'family ' + r.fam : 'pattern ' + r.c.pattern); }
          if (view.flowNote) A.flow++;
          bump(A.slot, view.slotTag || 'none');
          if (view.keeps) A.keeps++; else A.noKeeps++;
          A.loadNotes += [...view.sameJob, ...view.otherJob].filter((row: any) => row.note && !/Different job/.test(row.note)).length;
        }
      }
    }
  });
}
say('# The swap sheet on the deck: what today\'s app reads and writes');
say();
say('Read-only. Zone America/New_York. Today\'s page in the VM harness, the test phone of `tests/support/stored-state.ts`.');
say();
say('## A. The cards that offer a swap, and what the sheet shows');
say();
say('Every day of the live grid, at each of the five stretches of the ten standard histories (a second phone launched on the keys as they stand).');
say();
say('- Launches read: **' + A.stages + '**. The live program carries `_swapUniverse`: ' + list(A.universe) + '.');
say('- Days with a deck: **' + A.days + '**. Cards: ' + A.cards + '. Moves on them: ' + A.moves + '.');
say('- **Moves that offer a swap: ' + A.swappable + '** of ' + A.moves + '. By the kind of card they sit on: ' + list(A.kind) + '.');
say('- Where the control sits: on the card\'s own top (a single lift) **' + A.onCardTop + '**; on a move\'s row inside a round or a block **' + A.onMoveRow + '**.');
say('- By program: ' + list(A.perProg) + '.');
say('- The list is the pattern\'s (`swapCandidates`) on **' + A.pattern + '**, the aux family\'s (`auxSwapCandidates`) on **' + A.aux + '**. The universe read: ' + list(A.uni) + '.');
say('- Rows in "Same job", by how many: ' + list(A.t1) + '.');
say('- Rows in "Different job, same day", by how many: ' + list(A.t2) + '.');
say('- Candidate rows in all: ' + A.rows + '. Rows carrying the "Much lighter than" note: ' + A.loadNotes + '.');
say('- **Sheets with no row at all** ("Nothing else in your kit does this job."): **' + A.empty + '**: ' + list(A.emptyBy) + '.');
say('- Sheets with the one implement note: ' + A.flow + '. The slot tag: ' + list(A.slot) + '. "Whatever you pick keeps": on ' + A.keeps + ', absent on ' + A.noKeeps + '.');
say('- Swappable moves already logged today: ' + A.loggedSwappable + '. Swappable moves skipped: ' + A.skippedSwappable + '.');
say('- Moves showing "Swapped in for": **' + A.swappedIn + '** (' + A.swappedInCardTop + ' on a single lift\'s card, with Put it back). Moves showing "You added this": **' + A.added + '** (' + list(A.addedByProg) + ').');
say('- An added move sits on a card of kind: ' + list(A.addedKind) + '. A swapped in move: ' + list(A.swappedKind) + '. Today\'s deck hides the chip of a single lift\'s card (`.deck-lift .ex-swapchip{display:none}`, deck.css), and draws the swapped in strip in its place; it draws nothing in place of "You added this, remove".');
say();

// ── B. The handlers ──────────────────────────────────────────────────────────────────────────────────────────────
function diff(pre: Record<string, string>, post: Record<string, string>, ids: string[]): string {
  const rows: string[] = [];
  for (const k of [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort()) {
    if ((pre[k] ?? null) === (post[k] ?? null)) continue;
    const f = family(k, ids);
    let inside = '';
    try {
      const a = pre[k] == null ? {} : JSON.parse(pre[k]!), b = post[k] == null ? {} : JSON.parse(post[k]!);
      if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
        const parts: string[] = [];
        for (const e of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
          if (J(a[e]) === J(b[e])) continue;
          let sub = '';
          if (a[e] && b[e] && typeof a[e] === 'object' && typeof b[e] === 'object' && !Array.isArray(a[e])) {
            sub = ' {' + [...new Set([...Object.keys(a[e]), ...Object.keys(b[e])])].filter((x) => J(a[e][x]) !== J(b[e][x])).map((x) => (x in a[e] ? (x in b[e] ? '~' : '-') : '+') + x).join(' ') + '}';
          }
          parts.push((e in a ? (e in b ? '~' : '-') : '+') + e + sub);
        }
        inside = ' [' + parts.slice(0, 6).join(', ') + (parts.length > 6 ? ', and ' + (parts.length - 6) + ' more' : '') + ']';
      } else if (Array.isArray(a) && Array.isArray(b)) inside = ' [the list, ' + a.length + ' to ' + b.length + ' entries; ' + (pre[k] || '').length + ' to ' + (post[k] || '').length + ' bytes]';
    } catch { /* not JSON */ }
    rows.push('`' + f + '`' + (pre[k] == null ? ' (new)' : post[k] == null ? ' (removed)' : '') + inside);
  }
  return rows.join('; ') || 'nothing';
}
/** A field of the page as the Angular template draws it. */
function field(id: string, value: string, placeholder: string, cls: string, rx: string | null): any {
  const set = new Set(cls.split(' ').filter(Boolean));
  return { id, value, placeholder, dataset: {}, textContent: '', style: {},
    classList: { add: (c: string) => { set.add(c); }, remove: (c: string) => { set.delete(c); }, contains: (c: string) => set.has(c), toggle: (c: string, on?: boolean) => { const want = on === undefined ? !set.has(c) : on; if (want) set.add(c); else set.delete(c); return want; } },
    getAttribute: (n: string) => (n === 'data-rx' ? rx : null) };
}
function place(P: Phone, cards: ExCard[]): void {
  const fields = (P as any).fields as Map<string, any>;
  fields.clear();
  for (const x of cards) {
    fields.set('excard_' + x.exKey, field('excard_' + x.exKey, '', '', 'exercise-item' + (x.logged ? ' logged' : ''), null));
    if (!x.log) continue;
    if (x.log.sets) for (const r of x.log.sets.rows) {
      fields.set(r.rowId, field(r.rowId, r.value, r.placeholder, r.cls, r.rx));
      if (r.weight) fields.set(r.weight.id, field(r.weight.id, r.weight.value, '', r.weight.cls, null));
    }
    if (x.log.load) fields.set('exw_' + x.exKey, field('exw_' + x.exKey, x.log.load.value, '', 'ex-winput', null));
  }
}

say('## B. What each handler writes (HALF_MANNY, the page\'s own functions)');
say();
say('`+` an entry added, `~` changed, `-` dropped.');
say();
say('| Step | On the page | Keys it changed | What the card shows after |');
say('|---|---|---|---|');
{
  const cfg = PROGRAMS['half-manny (Mario, NRC half, crossfit)']!;
  const P = new Phone().launch(CREATED);
  P.generate(cfg);
  const { first, start } = firstWeek(P, CREATED);
  const w = first;
  P.launch(at(start, 7 * (w - 1), '06:30'));
  const days = training(P, w);
  const lifts = (d: string): DeckCard[] => deckOf(P, w, d).filter((c) => c.kind === 'lift' && c.swap);
  const d = days.find((x) => lifts(x).some((c) => movesOf([c]).some((m) => m.log && m.log.load && m.log.sets && m.log.sets.rows.length > 1))) || days[0]!;
  const d2 = days.find((x) => x !== d && lifts(x).length) || d;
  P.launch(at(start, 7 * (w - 1) + DAYS.indexOf(d)));
  const ids = idsOf(P.dump());
  const openDay = (day: string): void => { P.ev(`currentWeek=${w};_setStaleWarnShown(false);_setStaleWarnSrc('');window._unitLabel=(activeProg.cfg&&activeProg.cfg.unit==='kg')?'kg':'lbs';_setCurrentDayKey(${J(day)});ruResetIfIdle();`); place(P, movesOf(deckOf(P, w, day))); };
  const step = (what: string, code: string, run: () => void, shows: () => string): void => {
    const pre = P.dump();
    run();
    P.settle();
    say('| ' + what + ' | `' + code + '` | ' + diff(pre, P.dump(), ids) + ' | ' + shows() + ' |');
  };
  const cardAt = (day: string, key: string): DeckCard | undefined => deckOf(P, w, day).find((c) => c.key === key);
  const show = (day: string, key: string): string => {
    const c = cardAt(day, key); if (!c) return 'no card ' + key;
    const m = movesOf([c])[0]!;
    const draft = (JSON.parse(P.dump()['ia_logs_' + ids[0]] || '{}')['w' + w + '_' + day] || {}).sets || {};
    const rows = m.log && m.log.sets ? m.log.sets.rows.map((r) => r.value || '(' + r.placeholder + ')').join(' ') : '';
    return 'card `' + c.key + '`, **' + m.name + '** (`' + m.exKey + '`), ' + m.rxDetail.slice(0, 28) + (m.rxDetail.length > 28 ? '…' : '') + '; logged ' + (m.logged ? 'yes' : 'no') + (c.swappedFrom ? '; Swapped in for ' + c.swappedFrom : '') + '; rep fields ' + rows + '; drafts held for `' + (Object.keys(draft).join('`, `') || 'none') + '`';
  };

  // 1. A day not yet touched.
  {
    openDay(d2);
    const c = lifts(d2)[0]!, m = movesOf([c])[0]!;
    const { view } = sheetOf(P, w, d2, c.swap!.secIdx, c.swap!.itemIdx);
    const to = (view.sameJob[0] || view.otherJob[0]).name;
    say('| | *a day not yet touched (' + d2 + '): ' + m.name + '* | | |');
    step('The sheet opens', 'openSwapSheet(sec, item)', () => { P.ev(`openSwapSheet(${c.swap!.secIdx},${c.swap!.itemIdx});`); }, () => 'the sheet: ' + view.sameJob.length + ' same job, ' + view.otherJob.length + ' different job');
    step('A pick', 'applySwapChoice(to)', () => { P.ev(`applySwapChoice(${J(to)});`); }, () => show(d2, c.key));
    step('Put it back', 'undoSwap(from)', () => { P.ev(`undoSwap(${J(m.name)});`); }, () => show(d2, c.key));
  }
  // 2. The day in hand: a draft, then the swap.
  openDay(d);
  const c0 = lifts(d).find((c) => movesOf([c]).some((m) => m.log && m.log.load && m.log.sets && m.log.sets.rows.length > 1))!;
  const m0 = movesOf([c0])[0]!;
  const sheet0 = sheetOf(P, w, d, c0.swap!.secIdx, c0.swap!.itemIdx);
  const to0 = (sheet0.view.sameJob[0] || sheet0.view.otherJob[0]).name;
  const to1 = (sheet0.view.sameJob[1] || sheet0.view.otherJob[0] || sheet0.view.sameJob[0]).name;
  say('| | *the day in hand (' + d + '): ' + m0.name + ', ' + m0.rxDetail + '* | | |');
  const row0 = m0.log!.sets!.rows[0]!;
  step('A set\'s plus (a draft)', 'stepSet(row, +step)', () => { P.ev(`stepSet(${J(row0.rowId)},${row0.step});`); }, () => show(d, c0.key));
  step('The sheet opens', 'openSwapSheet(sec, item)', () => { P.ev(`openSwapSheet(${c0.swap!.secIdx},${c0.swap!.itemIdx});`); }, () => 'the sheet');
  step('The sheet closed, no pick', 'closeSwapSheet()', () => { P.ev('closeSwapSheet();'); }, () => show(d, c0.key));
  step('The sheet opens, a pick', 'openSwapSheet; applySwapChoice(to)', () => { P.ev(`openSwapSheet(${c0.swap!.secIdx},${c0.swap!.itemIdx});applySwapChoice(${J(to0)});`); place(P, movesOf(deckOf(P, w, d))); }, () => show(d, c0.key));
  step('A second pick on the same card', 'openSwapSheet; applySwapChoice(to2)', () => { P.ev(`openSwapSheet(${c0.swap!.secIdx},${c0.swap!.itemIdx});applySwapChoice(${J(to1)});`); place(P, movesOf(deckOf(P, w, d))); }, () => show(d, c0.key) + '; the day\'s records ' + J((JSON.parse(P.dump()['ia_swaps_' + ids[0]] || '{}')['w' + w + '_' + d] || []).map((e: any) => e.from + ' to ' + e.to)));
  step('Put it back (the lift it shows)', 'undoSwap(from)', () => { const from = cardAt(d, c0.key)!.swappedFrom!; P.ev(`undoSwap(${J(from)});`); place(P, movesOf(deckOf(P, w, d))); }, () => show(d, c0.key) + '; the day\'s records ' + J((JSON.parse(P.dump()['ia_swaps_' + ids[0]] || '{}')['w' + w + '_' + d] || []).map((e: any) => e.from + ' to ' + e.to)));
  step('Put it back, again', 'undoSwap(from)', () => { const c = cardAt(d, c0.key)!; if (c.swappedFrom) P.ev(`undoSwap(${J(c.swappedFrom)});`); place(P, movesOf(deckOf(P, w, d))); }, () => show(d, c0.key));
  // 3. Logged, then swapped.
  step('Log on it', 'saveExWeight(key, name, rx)', () => { const m = movesOf([cardAt(d, c0.key)!])[0]!; P.ev(`saveExWeight(${J(m.exKey)},${J(m.name)},${J(m.rxDetail)});`); }, () => show(d, c0.key));
  step('A pick, once logged', 'openSwapSheet; applySwapChoice(to)', () => { P.ev(`openSwapSheet(${c0.swap!.secIdx},${c0.swap!.itemIdx});applySwapChoice(${J(to0)});`); place(P, movesOf(deckOf(P, w, d))); },
    () => show(d, c0.key) + '; the lift log holds today\'s entry for `' + Object.entries(JSON.parse(P.dump()['ia_exw_' + ids[0]] || '{}')).filter(([, v]: any) => (v.entries || []).some((e: any) => +e.week === w)).map(([k]) => k).join('`, `') + '`');
  step('Put it back', 'undoSwap(from)', () => { P.ev(`undoSwap(${J(m0.name)});`); place(P, movesOf(deckOf(P, w, d))); }, () => show(d, c0.key));
  // 4. The count and the nudge.
  const ct = (): string => J(JSON.parse(P.dump()['ia_swapct_' + ids[0]] || '{}')[m0.name] || null);
  say('| | *the count of ' + m0.name + ' to ' + to0 + ' stands at ' + ct() + '* | | |');
  step('A third pick of the same pair', 'applySwapChoice(to)', () => { P.ev(`openSwapSheet(${c0.swap!.secIdx},${c0.swap!.itemIdx});applySwapChoice(${J(to0)});`); },
    () => 'count ' + ct() + '; the nudge in hand: ' + J(P.ev('_nudgeCtx')));
  const mid = P.dump();
  step('The nudge: Leave the plan alone', 'dismissSwapNudge()', () => { P.ev('dismissSwapNudge();'); }, () => 'count ' + ct());
  {
    const R = new Phone();
    for (const [k, v] of Object.entries(mid)) R.damage(k, v);
    R.launch(iso(new Date(P.ev('Date.now()') as number)));
    R.ev(`currentWeek=${w};_setCurrentDayKey(${J(d)});_nudgeCtx={from:${J(m0.name)},to:${J(to0)}};`);
    const pre = R.dump();
    const before = J(R.prog.weeks);
    R.ev('acceptSwapNudge();'); R.settle();
    const post = R.dump();
    const days2 = Object.keys(R.prog.weeks).reduce((n, wk) => n + DAYS.filter((dd) => J(JSON.parse(before)[wk][dd]) !== J(R.prog.weeks[wk][dd])).length, 0);
    say('| The nudge: Make the change (on a copy of the keys) | `acceptSwapNudge()` | ' + diff(pre, post, ids) + ' | `cfg.exSwapPrefs` ' + J((JSON.parse(post['ia_programs']!)[0].cfg || {}).exSwapPrefs) + '; the program rebuilt, ' + days2 + ' days of the grid changed |');
  }
  // 5. An added move, removed.
  {
    P.ev(`undoSwap(${J(m0.name)});`);
    const add: string | null = P.ev(`(function(){var c=addCandidates(activeProg.weeks[${w}][${J(d)}],${w},activeProg);return (c.gap||[])[0]||(c.more||[])[0]||null;})()`);
    say('| | *an added move (' + add + '), from the session sheet\'s add sheet* | | |');
    if (add) {
      step('Add', 'applyAddChoice(name)', () => { P.ev(`applyAddChoice(${J(add)});`); }, () => { const cs = deckOf(P, w, d); const c = cs.find((x) => movesOf([x]).some((m) => m.added)); return c ? 'card `' + c.key + '` (' + c.kind + ', kicker ' + c.kicker + '), swap on its top: ' + (c.swap ? 'yes' : 'no') : 'no card'; });
      step('Remove', 'removeAddedExercise(name)', () => { P.ev(`removeAddedExercise(${J(add)});`); }, () => 'cards with an added move: ' + deckOf(P, w, d).filter((x) => movesOf([x]).some((m) => m.added)).length);
    }
  }
}
say();

const file = join(REPO, 'tests/measure/native-deck-swap_writes.md');
writeFileSync(file, out.join('\n') + '\n');
console.log('written', file, out.length, 'lines');
