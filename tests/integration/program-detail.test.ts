// A program card's detail moved from the legacy progDetailHTML to the ProgramDetail component (architecture phase E).
// The oracle is the legacy builder in the booted app: for every program below, the detail drawn from the model
// (through the same legacy reads the component makes), written out in the legacy markup, is the legacy markup byte for
// byte. The app's own unit tests hold hand-worked values for the same function.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, pinClock } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { programDetail, type ProgramDetailView, type ProgSel } from '../../frontends/app/src/app/screens/program-list/program-detail-model.ts';

describe('the program detail (progDetailHTML, phase E step 29)', () => {
  const IA = loadApp();
  pinClock(IA, '2026-10-12T15:00:00Z');
  const W = IA.window;
  const icon = (key: string, size: number): string => W['asyIcon'](key, size);

  /** The detail written out as progDetailHTML wrote it. */
  function detailMarkup(d: ProgramDetailView): string {
    const rows = (rs: { k: string; v: string }[]) => rs.map((r) => `<div class="det-row"><span class="k">${r.k}</span><span class="v">${r.v}</span></div>`).join('');
    const chips = (cs: { k: string; v: string; u: string }[]) => cs.map((c) => `<div class="lift-chip"><div class="lc-k">${c.k}</div><div class="lc-v">${c.v}</div><div class="lc-u">${c.u}</div></div>`).join('');
    const cardio = d.cardio
      ? d.cardio.map((c) => `<div class="det-row"><span class="k">${c.label}</span><span class="v" style="display:inline-flex;align-items:center;gap:7px">${c.goal}<button onclick="event.stopPropagation();openGoalSheet('${d.id}','${c.type}')" aria-label="Change ${c.label} goal" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center">${icon('pencil', 14)}</button></span></div>`).join('')
      : rows([{ k: 'Cardio', v: 'Lift only' }]);
    const event = d.event ? `<div class="det-group"><div class="det-label">Event target</div>${rows(d.event)}</div>` : '';
    const est = d.estimated ? ' <span style="font-weight:400;color:var(--muted);font-size:9px;letter-spacing:0">(est.)</span>' : '';
    return `<div class="prog-detail">
      <div class="det-group"><div class="det-label">Focus</div>${rows(d.focus)}</div>
      <div class="det-group"><div class="det-label">Profile</div>${rows(d.profile)}</div>
      <div class="det-group"><div class="det-label">Schedule</div>${rows(d.schedule)}</div>
      <div class="det-group"><div class="det-label">Starting 1RM${est}</div><div class="det-lifts">${chips(d.lifts)}</div></div>${d.paces ? `
      <div class="det-group"><div class="det-label" style="display:inline-flex;align-items:center;gap:7px">Run paces<button onclick="event.stopPropagation();openMileSheet('${d.id}')" aria-label="Change mile time" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center">${icon('pencil', 14)}</button></div><div class="det-paces">${chips(d.paces.chips)}</div><div class="det-src">${d.paces.sentence}</div></div>` : ''}
      <div class="det-group"><div class="det-label">Cardio</div>${cardio}</div>
      ${event}
      <div class="det-foot"><span class="det-seed">${d.seed}</span><button class="copy-icon-btn" onclick="event.stopPropagation();copyProgSel('${d.id}')" aria-label="Copy program selections for troubleshooting" title="Copy for troubleshooting">${icon('copy', 15)}</button></div>
    </div>`;
  }

  /** The component's reads, against the booted app. */
  function view(p: { id: string }): ProgramDetailView {
    const s = W['progSelData'](p) as ProgSel;
    const paces = s.runAnchor ? { chips: W['runAnchorChips'](s.runAnchor), sentence: W['runAnchorSentence'](s.runAnchor) } : null;
    return programDetail(p.id, s, { dayNames: IA.eval('_DAYF'), goalLabels: IA.eval('_GOAL_LABELS') }, paces);
  }

  const seen: string[] = [];
  for (const [label, cfg] of Object.entries(PROGRAMS)) {
    test(label, () => {
      const p = JSON.parse(JSON.stringify(IA.buildProgram(cfg))) as { id: string; cfg: Record<string, unknown> };
      p.id = 'p_' + label.replace(/\W+/g, '_');
      const want = W['progDetailHTML'](p) as string;
      assert.equal(detailMarkup(view(p)), want);
      seen.push(want);
    });
  }

  test('edits every way the detail reads a program: no maxes, a race with no date, a race date, a seed on the program, no rest days, a mile pencil kind', () => {
    const base = JSON.parse(JSON.stringify(IA.buildProgram(IA.fixtures.HALF_MANNY))) as { id: string; seed?: number; cfg: Record<string, unknown>; totalWeeks?: number };
    base.id = 'p_edits';
    const variants: [string, (p: typeof base) => void][] = [
      ['estimated maxes', (p) => { p.cfg['squat'] = 0; p.cfg['bench'] = 0; p.cfg['deadlift'] = 0; }],
      ['a race with no date', (p) => { p.cfg['primaryPath'] = 'event'; delete p.cfg['raceDate']; }],
      ['a race date', (p) => { p.cfg['primaryPath'] = 'event'; p.cfg['raceDate'] = '2026-12-06'; }],
      ['a past race date', (p) => { p.cfg['primaryPath'] = 'event'; p.cfg['raceDate'] = '2026-09-06'; }],
      ['a seed on the program only', (p) => { delete p.cfg['seed']; p.seed = 4242; }],
      ['no seed at all', (p) => { delete p.cfg['seed']; delete p.seed; }],
      ['no rest days, every unknown label', (p) => { p.cfg['restDays'] = []; p.cfg['liftingFocus'] = 'mystery'; p.cfg['equipment'] = 'shed'; p.cfg['primaryPath'] = 'odd'; }],
      ['every day off', (p) => { p.cfg['restDays'] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; }],
      ['a cardio goal with no label', (p) => { p.cfg['cardioGoals'] = { run: { id: 'run_base' } }; }],
      ['lift only', (p) => { p.cfg['cardioTypes'] = []; }],
      ['an edited mile', (p) => { const g = (p.cfg['cardioGoals'] as Record<string, Record<string, unknown>>)['run']!; g['mileBestMins'] = '7'; g['mileBestSecs'] = '30'; g['mileBestSrc'] = { kind: 'edited', wk: 3, from: { kind: 'default' } }; }],
    ];
    for (const [what, edit] of variants) {
      const p = JSON.parse(JSON.stringify(base)) as typeof base;
      edit(p);
      const want = W['progDetailHTML'](p) as string;
      assert.equal(detailMarkup(view(p)), want, what);
      seen.push(want);
    }
    const all = seen.join('\n');
    for (const n of ['(est.)</span>', 'Event target', 'No date set', 'Time out', 'Run paces', 'det-src', 'Lift only', 'General fitness', 'seed 4242', '<span class="v">None</span>', '<span class="v">—</span>']) {
      assert.ok(all.includes(n), `no detail drew ${n}`);
    }
  });
});
