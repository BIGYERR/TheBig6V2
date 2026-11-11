// The swipe deck, swept (D283 P-DECKFIT, docs/decisions/swipe-deck.md): every prescription and every section label the
// engine writes across the shared 864-config lattice (tests/lattice193.js FULL, on HALF_MANNY), read the way a deck card
// prints it. The ruling: no line or cue carries an em dash, an en dash, a semicolon, a parenthesis or a tilde, and no card
// title carries " — ". The measure behind it is tests/measure/swipe-deck_prescriptions.md (250 prescriptions, 190 with
// a dash, on v0.259.4). CI runs this file; the 60-second check only type-checks it.
//
// Oracles: the five marks and the title rule, typed from the ruling; the lattice's own cell count.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { fixtures, loadApp, pinClock } from '../support/app.ts';
import { deckCards, labelHead, rxLine } from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import type { ExSection, SectionView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';

interface LatticeCell {
  tag: string;
  over: Partial<Cfg>;
}
const LATTICE: { FULL: LatticeCell[]; FULL_N: number } = createRequire(import.meta.url)('../lattice193.js');

const IA = loadApp();
pinClock(IA, new Date(2026, 10, 10, 12, 0, 0));

const MARKS = /[—–;()~]/;
const details = new Map<string, string>();
const titles = new Map<string, string>();
let built = 0;
for (const cell of LATTICE.FULL) {
  const prog = IA.buildProgram({ ...fixtures.HALF_MANNY, ...cell.over } as Cfg) as unknown as { weeks: Record<string, Record<string, { rest?: boolean; sections?: ExSection[] }>> };
  built++;
  for (const week of Object.values(prog.weeks)) for (const day of Object.values(week)) {
    if (!day || day.rest) continue;
    const secs = day.sections || [];
    for (const s of secs) for (const it of s.items || []) if (!details.has(String(it.detail || ''))) details.set(String(it.detail || ''), cell.tag);
    // Each section drawn as a bare block, so the deck's own card rule picks the titles a card shows.
    const views: SectionView[] = secs.map((s) => ({ kind: 'section', label: null, body: { kind: 'block', label: null, items: (s.items || []).map((it, k) => ({
      kind: 'card', exKey: 'k' + k, name: it.name, detail: String(it.detail || ''), rxDetail: String(it.detail || ''), logged: false, swap: null, skip: true,
      added: false, swappedFrom: null, log: { sets: null, load: null } })) } }) as SectionView);
    for (const c of deckCards(secs, views, (s) => (typeof s['rounds'] === 'number' ? (s['rounds'] as number) : null))) if (!titles.has(c.title)) titles.set(c.title, cell.tag);
  }
}

test('the lattice builds whole, and the sweep reads its prescriptions and titles', () => {
  assert.equal(built, LATTICE.FULL_N);
  assert.ok(details.size >= 200, 'read ' + details.size + ' distinct prescriptions');
  assert.ok(titles.size >= 50, 'read ' + titles.size + ' distinct card titles');
});

test('no prescription prints a dash, a semicolon, a parenthesis or a tilde on a deck card', () => {
  const bad: string[] = [];
  for (const [d, tag] of details) {
    const l = rxLine(d);
    const printed = [l.dose, l.rpe || '', l.cue || ''].join(' | ');
    if (MARKS.test(printed)) bad.push(tag + ': ' + JSON.stringify(d) + ' prints ' + JSON.stringify(printed));
  }
  assert.deepEqual(bad.slice(0, 10), []);
});

test('no deck card title carries the engine\'s " — "', () => {
  const bad = [...titles].filter(([t]) => t.includes(' — ')).map(([t, tag]) => tag + ': ' + t);
  assert.deepEqual(bad.slice(0, 10), []);
  assert.equal(labelHead('Leg circuit — runner armor'), 'Leg circuit');
});
