import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JOURNEYS } from '../../e2e/flow.ts';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('e2e JOURNEYS', () => {
  it('gives every journey a unique kebab-case id, a name and at least one step', () => {
    const ids = JOURNEYS.map((j) => j.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate journey id in ${ids.join(', ')}`);
    for (const j of JOURNEYS) {
      assert.match(j.id, KEBAB);
      assert.ok(j.name.trim().length > 0, `${j.id} has a name`);
      assert.ok(j.steps.length > 0, `${j.id} has steps`);
    }
  });

  it('gives every step a unique kebab-case id across all journeys (ids anchor the report and label the collage)', () => {
    const ids = JOURNEYS.flatMap((j) => j.steps.map((s) => s.id));
    assert.equal(new Set(ids).size, ids.length, `duplicate step id in ${ids.join(', ')}`);
    for (const id of ids) assert.match(id, KEBAB);
  });

  it('gives every step a distinct page label', () => {
    const pages = JOURNEYS.flatMap((j) => j.steps.map((s) => s.page.trim()));
    assert.ok(pages.every((p) => p.length > 0));
    assert.equal(new Set(pages).size, pages.length);
  });

  it('starts the first journey on the empty Programs screen, as a first launch does', () => {
    assert.equal(JOURNEYS[0]?.steps[0]?.id, 'home-empty');
  });
});
