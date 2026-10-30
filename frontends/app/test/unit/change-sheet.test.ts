// The injury and travel sheet (src/app/screens/change-sheet/change-sheet-model.ts, architecture phase E step 10),
// against the legacy renderOverlaySheet it replaces: the head, the travel sheet's dates, cards and effect for each
// tier, and the injury sheet's regions, tiers, effect and off-ramp. The legacy date helpers are stood in by hand-made
// ones that name what they were given, so every expected string is typed here from the legacy code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { changeSheetView, INJ_EFFECT, injuryView, type OverlayDraft, type SheetDeps, travelView } from '../../src/app/screens/change-sheet/change-sheet-model.ts';

const REGIONS = { shoulder: { label: 'Shoulder' }, lowback: { label: 'Lower Back' }, knee: { label: 'Knee' } };
const deps = (inProgram = true): SheetDeps => ({
  fmtDate: (iso) => (iso ? `d(${iso})` : 'Set date'),
  fmtDateWd: (iso) => (iso ? `wd(${iso})` : ''),
  dayCount: (from, to) => (from === to ? 1 : 14),
  dayCountWord: (n) => (n === 14 ? 'Fourteen days' : `${n} days`),
  inProgram: () => inProgram,
  backCopy: (ov) => `wd(after ${ov.to}) picks your program back up.`,
});
const TRIP: OverlayDraft = { type: 'substitute', from: '2026-10-07', to: '2026-10-20', equipment: 'home_basic', tab: 'travel', injRegion: null, injTier: 'workaround' };
const HURT: OverlayDraft = { ...TRIP, type: 'injury', tab: 'injury', to: null };

describe('the injury and travel sheet', () => {
  it('heads each sheet with its own kicker, title and promise', () => {
    const t = changeSheetView(TRIP, REGIONS, deps());
    assert.deepEqual([t.kicker, t.title, t.intro, !!t.travel, t.injury], ['Traveling?', 'Temporary change', 'Your program reverts on its own. Nothing you’ve already trained changes.', true, null]);
    const i = changeSheetView(HURT, REGIONS, deps());
    assert.deepEqual([i.kicker, i.title, i.intro, i.travel, !!i.injury], ['Hurt?', 'Train around it', 'No end date on this one. You tell it when you’re back. Nothing you’ve already trained changes.', null, true]);
  });

  it('dates a trip, describes the chosen tier only, and says when the program picks back up', () => {
    const v = travelView(TRIP, deps());
    assert.deepEqual(v.dates, [
      { key: 'from', label: 'From', shown: 'd(2026-10-07)', value: '2026-10-07', min: null },
      { key: 'to', label: 'Through', shown: 'd(2026-10-20)', value: '2026-10-20', min: '2026-10-07' },
    ]);
    assert.deepEqual(v.cards.map((c) => [c.id, c.name, c.sel, c.desc]), [
      ['bodyweight', 'Room only', false, null],
      ['home_basic', 'Mini gym', true, 'Dumbbells, a bench, a treadmill. The standard hotel setup.'],
      ['commercial', 'Full gym', false, null],
    ]);
    assert.equal(v.effect.title, 'Takes effect wd(2026-10-07) through wd(2026-10-20). Fourteen days.');
    assert.deepEqual(v.effect.subs.map((s) => s.style), [null, 'margin-top:6px']);
    assert.equal(v.effect.subs[0]!.text, 'wd(after 2026-10-20) picks your program back up. Every other day stays as written.');
    assert.match(v.effect.subs[1]!.text, /Grab the heaviest load you can control and work in the 8 to 12 range\./);
    assert.equal(v.action, 'travel');
  });

  it('gives a room-only trip its own lifting line, and names one day and an open end', () => {
    const one = travelView({ ...TRIP, equipment: 'bodyweight', to: '2026-10-07' }, deps());
    assert.equal(one.effect.title, 'Takes effect wd(2026-10-07). One day.');
    assert.match(one.effect.subs[1]!.text, /^Lifting holds steady while you’re away\. Reps are yours: three sets/);
    const open = travelView({ ...TRIP, to: null }, deps());
    assert.deepEqual([open.effect.title, open.effect.subs[0]!.text, open.dates![1]!.shown, open.dates![1]!.value], ['Takes effect wd(2026-10-07) onward.', '', 'Set date', '']);
  });

  it('answers a full gym with no dates and Got it, and dates outside the program with a muted line', () => {
    const gym = travelView({ ...TRIP, equipment: 'commercial' }, deps());
    assert.deepEqual([gym.dates, gym.effect.title, gym.action], [null, 'You’re set', 'close']);
    const out = travelView(TRIP, deps(false));
    assert.deepEqual(out.effect, { title: null, subs: [{ text: 'That range falls outside your program. Pick dates inside it.', style: 'color:var(--muted)' }] });
  });

  it('lists the regions then the off-ramp, and shows nothing more until a region is picked', () => {
    const v = injuryView(HURT, REGIONS, deps());
    assert.deepEqual(v.regions.map((c) => c.name), ['Shoulder', 'Lower Back', 'Knee', 'Neck / something else']);
    assert.deepEqual([v.tiers, v.effect, v.dates, v.action], [null, null, null, null]);
  });

  it('names the effect for a region and tier, asks after the first word of the region, and dates it from today', () => {
    const v = injuryView({ ...HURT, injRegion: 'lowback', injTier: 'protect' }, REGIONS, deps());
    assert.deepEqual(v.tiers!.map((c) => [c.name, c.sel, c.desc]), [
      ['Work around it', false, null],
      ['Protect it', true, 'Sharp, swollen, or it hurts at rest. We pull the load off it entirely.'],
    ]);
    assert.equal(v.effect!.title, 'Protected · Lower Back');
    assert.match(v.effect!.subs[0]!.text, /^Nothing loads the spine\./);
    assert.match(v.effect!.subs[1]!.text, /^Every two weeks it asks how the lower feels\./);
    assert.deepEqual(v.effect!.subs.map((s) => s.style), [null, 'margin-top:6px', 'margin-top:6px;color:var(--muted)']);
    assert.deepEqual([v.dates, v.action], [[{ key: 'from', label: 'From', shown: 'd(2026-10-07)', value: '2026-10-07', min: null }], 'injury']);
    assert.equal(injuryView({ ...HURT, injRegion: 'knee', injTier: '' }, REGIONS, deps()).effect!.title, 'Working around it · Knee');
  });

  it('sends a neck or anything unlisted to a professional, with Got it and nothing to apply', () => {
    const v = injuryView({ ...HURT, injRegion: 'other' }, REGIONS, deps());
    assert.deepEqual([v.regions.at(-1)!.sel, v.tiers, v.dates, v.action, v.effect!.title], [true, null, null, 'close', 'That one’s above my pay grade']);
  });
  it('offers the calf with its own effect copy on both tiers, written in the coach\'s voice (D245)', () => {
    const regions = { ...REGIONS, calf: { label: 'Calf' } };
    const w = injuryView({ ...HURT, injRegion: 'calf', injTier: '' }, regions, deps());
    const p = injuryView({ ...HURT, injRegion: 'calf', injTier: 'protect' }, regions, deps());
    assert.equal(w.effect!.title, 'Working around it · Calf');
    assert.equal(p.effect!.title, 'Protected · Calf');
    assert.equal(INJ_EFFECT['calf']!.workaround, 'Calf raises and jumps are out. Tibialis raises and ankle mobility stay. Runs get shorter and stay easy.');
    assert.equal(INJ_EFFECT['calf']!.protect, 'Nothing stands on that calf under load. Leg day leans hip and hamstring. Runs become rides or swims, same slots, same clock.');
    for (const t of [INJ_EFFECT['calf']!.workaround, INJ_EFFECT['calf']!.protect]) assert.doesNotMatch(t, /\S[-\u2013\u2014]\S|\s[-\u2013\u2014]\s/, 'no mid-sentence dash');
  });
});
