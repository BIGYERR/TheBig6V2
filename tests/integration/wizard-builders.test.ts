// The wizard's small markup builders moved into the Wizard component's template (architecture phase E): the mile and
// swim advisories, the seed banner and the start pips. The oracle is each legacy builder in the booted app: for every
// draft below, the view drawn from the model, written out in the legacy markup, is the legacy markup byte for byte, and
// the draft is left as the legacy builder left it. The app's own unit tests hold hand-worked values for the same functions.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, pinClock } from '../support/app.ts';
import { alignedPips, type Advisory, mileAdvisory, type Seed, seedView, type SeedView, swimAdvisory } from '../../frontends/app/src/app/screens/wizard/cardio-goal-model.ts';

describe('the wizard\'s small builders (phase E step 31)', () => {
  const IA = loadApp();
  pinClock(IA, '2026-10-12T15:00:00Z');
  const W = IA.window;
  const icon = (key: string, size: number): string => W['asyIcon'](key, size);
  const WD = () => IA.eval('WD') as Record<string, unknown>;
  const advisory = (id: string, a: Advisory) => `<div id="${id}" style="font-size:11px;line-height:1.45;margin-top:6px;display:${a.text ? 'block' : 'none'};color:${a.color}">${a.text}</div>`;

  test('the mile advisory for every kind of entry and experience', () => {
    const goals: [string, Record<string, unknown> | undefined][] = [
      ['intermediate', undefined], ['intermediate', { id: 'run_pace_goal' }], ['beginner', { id: 'run_pace_goal' }], ['advanced', { id: 'run_10k', mileBestMins: '' }],
      ['intermediate', { id: 'run_base', mileBestMins: '7', mileBestSecs: '30' }], ['intermediate', { id: 'run_base', mileBestMins: '7', mileBestSecs: '75' }],
      ['intermediate', { id: 'run_base', mileBestMins: '2', mileBestSecs: '50' }], ['intermediate', { id: 'run_base', mileBestMins: '26' }],
      ['intermediate', { id: 'run_base', mileBestMins: '4', mileBestSecs: '30' }], ['intermediate', { id: 'run_base', mileBestMins: '13' }], ['intermediate', { id: 'run_base', mileBestMins: 'x' }],
    ];
    const seen = new Set<string>();
    for (const [exp, g] of goals) {
      Object.assign(WD(), { experience: exp, cardioGoals: g ? { run: g } : {} });
      const want = W['_mileAdvisoryHTML']() as string;
      assert.equal(advisory('mileAdvisory', mileAdvisory(W['_mileEntryState']())), want, JSON.stringify([exp, g]));
      seen.add(want.replace(/>.*</, '><'));
    }
    assert.equal(seen.size, 3, 'hidden, refused in orange, and muted');
  });

  test('the swim advisory for each time goal and entry', () => {
    const goals: (Record<string, unknown> | undefined)[] = [
      undefined, { id: 'swim_mile' }, { id: 'swim_500_time' }, { id: 'swim_500_time', baseMins: '9', baseSecs: '30' }, { id: 'swim_500_time', baseMins: '9', baseSecs: '75' },
      { id: 'swim_100_time', swimUnit: 'm', baseMins: '1', baseSecs: '30' }, { id: 'swim_100_time', baseMins: '1', baseSecs: '30', base500Mins: '7' },
      { id: 'swim_100_time', baseMins: '2', baseSecs: '0', base500Mins: '8' }, { id: 'swim_100_time', base500Mins: '8' },
    ];
    for (const g of goals) {
      Object.assign(WD(), { cardioGoals: g ? { swim: g } : {} });
      assert.equal(advisory('swimAdvisory', swimAdvisory(W['_swimEntryState']())), W['_swimAdvisoryHTML'](), JSON.stringify(g));
    }
  });

  test('the seed banner: dismissed, none found, a lookup that fails, the offer with and without a longest run, and applied', () => {
    const banner = (v: SeedView | null): string => {
      if (!v) return '';
      if (v.applied) return `<div style="font-size:11px;color:var(--muted);margin:2px 0 8px">${icon('chart', 12)} Estimated from “${v.prog}”. Edit if you know better.</div>`;
      return `<div style="background:var(--surface);border:1px solid var(--accent);border-radius:4px;padding:12px 14px;margin-bottom:12px">
    <div style="font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--text);margin-bottom:4px">${icon('chart', 13)} Seed from “${v.prog}”?</div>
    <div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px">${v.found}</div>
    <div style="display:flex;gap:8px">
      <button class="prog-action-btn primary" style="flex:1" onclick="applySeedData()">Use this data</button>
      <button class="prog-action-btn" style="flex:1" onclick="dismissSeedData()">Start fresh</button>
    </div>
  </div>`;
    };
    const SEED: Seed = { progName: 'Old <b>Block</b>', n: 4, avgRecSec: 600, maxDist: 4 };
    const cases: [string, Record<string, unknown>, Seed | null | 'throw'][] = [
      ['dismissed', { _seedDismissed: true }, SEED],
      ['none found', {}, null],
      ['a lookup that fails', {}, 'throw'],
      ['the offer', {}, SEED],
      ['the offer with no longest run', {}, { ...SEED, maxDist: 0 }],
      ['the offer with no pace', {}, { ...SEED, avgRecSec: 0 }],
      ['already read', { _seed: { ...SEED, n: 9 } }, null],
      ['applied', { _seedApplied: true }, SEED],
    ];
    const real = W['seedFromPriorPrograms'];
    try {
      for (const [what, draft, seed] of cases) {
        IA.eval('seedFromPriorPrograms = function(){ if (globalThis.__seed === "throw") throw new Error("no"); return globalThis.__seed; }');
        W['__seed'] = seed;
        const reset = () => { for (const k of ['_seed', '_seedApplied', '_seedDismissed']) delete WD()[k]; Object.assign(WD(), JSON.parse(JSON.stringify(draft))); };
        reset();
        const want = W['_seedBannerHTML']() as string;
        const wantSeed = JSON.stringify(WD()['_seed']);
        reset();
        const d = WD() as { _seedDismissed?: boolean; _seed?: Seed | null; _seedApplied?: boolean };
        assert.equal(banner(seedView(d, () => W['seedFromPriorPrograms'](), (s) => W['_fmtPaceMi'](s))), want, what);
        assert.equal(JSON.stringify(WD()['_seed']), wantSeed, `${what}: the seed is kept on the draft as the legacy banner kept it`);
      }
    } finally {
      W['seedFromPriorPrograms'] = real;
    }
  });

  test('the start pips for each opening week, and none when the plan starts later', () => {
    for (const al of [{ tw: 8, openWeek: 1 }, { tw: 8, openWeek: 3 }, { tw: 10, openWeek: 10 }, { tw: 1, openWeek: 1 }, { tw: 8, openWeek: 2, futureWeeks: 3 }]) {
      const p = alignedPips(al);
      assert.equal(p === null ? '' : '<div class="start-pips">' + p.map((c) => `<i class="${c}"></i>`).join('') + '</div>', W['alignedPipsHTML'](al), JSON.stringify(al));
    }
  });
});
