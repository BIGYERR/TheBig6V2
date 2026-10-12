// The home screen's program list (src/app/screens/program-list/program-list-model.ts, architecture phase E step 4),
// against the legacy renderProgList it replaces: the meta line, the cards and their state, and the empty lines. The icon
// is a stand-in that names what was asked for, so every expected string is typed here from the legacy template.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EMPTY_HTML, metaHtml, programList, type ListState } from '../../src/app/screens/program-list/program-list-model.ts';

const icon = (key: string, size: number) => `[${key}/${size}]`;
const STATE: ListState = { activeId: 'a', openIds: new Set(['b']), editId: null, confirmId: null, confirmTier: 0 };
const A = {
  id: 'a', name: 'Half Manny', goal: 'balanced', totalWeeks: 14,
  cfg: { days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], restDays: ['sun', 'wed'], equipment: 'commercial', experience: 'advanced', ageBracket: '36-54',
    cardioTypes: ['run', 'swim'], cardioGoals: { run: { label: 'Half Marathon' }, swim: {} } },
};
const B = { id: 'b', name: 'Lift Block', goal: 'hypertrophy', cfg: { days: ['mon', 'thu'], restDays: [] } };

describe('the program list', () => {
  it('writes the meta line as the legacy list did: days, lengths, equipment, experience, age, then the cardio', () => {
    assert.equal(
      metaHtml(A, icon),
      'Mo · Tu · Th · Fr · Sa · 14 wks cardio · 6 wks lift<br>[dumbbell/13] Gym · advanced · 36-54<br>[🏃/13] Half Marathon + [🏊/13]',
    );
    assert.equal(metaHtml(B, icon), 'Mo · Th · 6 wks cardio · 6 wks lift<br>[home/13] Home · intermediate · 18-35<br>Lift only');
  });

  it('draws a card per unarchived program, the active one marked, the open one open', () => {
    const v = programList([A, B, { id: 'c', name: 'Old', archived: true }], STATE, icon);
    assert.equal(v.empty, null);
    assert.deepEqual(v.cards.map((c) => [c.id, c.cardClass, c.isActive, c.goalLabel, c.editing, c.confirm]), [
      ['a', 'prog-card active-prog', true, 'Balanced', false, 0],
      ['b', 'prog-card open', false, 'Size', false, 0],
    ]);
  });

  it('marks the card being renamed and the archive or delete being confirmed, and only on its own card', () => {
    const v = programList([A, B], { ...STATE, editId: 'b', confirmId: 'a', confirmTier: 1 }, icon);
    assert.deepEqual(v.cards.map((c) => [c.editing, c.confirm]), [[false, 1], [true, 0]]);
    assert.equal(programList([A], { ...STATE, confirmId: 'a', confirmTier: 2 }, icon).cards[0]!.confirm, 2);
    assert.equal(programList([A], { ...STATE, confirmId: 'a', confirmTier: 7 }, icon).cards[0]!.confirm, 0);
  });

  it('keeps the legacy name: the template literal on the card, the empty string in the rename box', () => {
    const [c] = programList([{ id: 'x', goal: 'mystery' }], STATE, icon).cards;
    assert.deepEqual([c!.name, c!.nameValue, c!.goalLabel], ['undefined', '', 'mystery']);
  });

  it('says why the list is empty: nothing built yet, or everything archived', () => {
    assert.deepEqual(programList([], STATE, icon), { empty: 'none', cards: [] });
    assert.deepEqual(programList([{ id: 'c', archived: true }], STATE, icon), { empty: 'archived', cards: [] });
    assert.equal(EMPTY_HTML.none, 'No programs yet.<br>Tap below to build your first.');
    assert.equal(EMPTY_HTML.archived, 'All programs archived.<br>View them under Progress, or build a new one below.');
  });
});
