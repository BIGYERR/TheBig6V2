// The session sheet's pieces moved from the legacy builders to Angular components (architecture phase E). The oracle
// here is the legacy builder itself, lifted out of the page with appFunction: for every input below, the view written
// back out in the legacy markup format is the legacy builder's markup, byte for byte. The app's own unit tests hold
// hand-worked values for the same functions.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { appFunction, loadApp } from '../support/app.ts';
import { cardioCard, type CardioCardView, type CardioRx } from '../../frontends/app/src/app/screens/day-detail/cardio-card-model.ts';
import { type LogEntry, sessionLog, type SessionLogData } from '../../frontends/app/src/app/screens/day-detail/session-log-model.ts';

const BENCH = '<div class="cardio-note"><b>RETEST:</b> strip</div>';

/** The card written out as buildCardioHTML wrote it. */
function cardMarkup(c: CardioCardView | null): string {
  if (!c) return '';
  const body = c.segments
    ? c.segments.map((sg) => `<div class="swim-seg"><div class="swim-seg-label">${sg.label}</div><div class="swim-seg-body">${sg.text}</div></div>`).join('')
      + (c.total ? `<div class="swim-total">${c.total}</div>` : '')
    : `<div class="cardio-detail">${c.detail}</div>`;
  return `<div class="${c.blockCls}"><div class="cardio-type-label ${c.labelCls}">${c.label}</div>` + body
    + (c.note ? `<div class="cardio-note">${c.note}</div>` : '') + c.bench + '</div>';
}

describe('the cardio card (buildCardioHTML, phase E step 25)', () => {
  const legacy = appFunction<(c: CardioRx | null) => string>('buildCardioHTML', { _benchStripHTML: () => BENCH });
  const cases: [string, CardioRx | null][] = [
    ['a long run with a note', { type: 'run', subtype: 'Long_Run', detail: '6 mi easy\nfinish the last mile strong', note: 'Keep it <b>conversational</b>.' }],
    ['a retest', { type: 'Run', subtype: 'Benchmark Run — Retest', detail: '20 min at even effort' }],
    ['a ride', { type: 'bike', detail: '45 min @ RPE 6' }],
    ['a segmented swim', { type: 'swim', subtype: 'endurance', segments: [{ label: 'WU', text: '200 easy', yd: 200 }, { label: 'Main', text: '10×100 @ :15 rest', yd: 1000 }, { label: 'CD', text: '100 easy', yd: '100' }] }],
    ['a swim with segments but no yards', { type: 'swim', segments: [{ label: 'Drill', text: 'catch-up' }] }],
    ['a swim without segments', { type: 'swim', detail: '1,500 yd continuous' }],
    ['another sport', { type: 'Rower', detail: '2k test' }],
    ['no detail', { type: 'run' }],
    ['nothing', null],
  ];
  for (const [label, rx] of cases) {
    test(label, () => {
      const want = legacy(rx);
      assert.equal(cardMarkup(cardioCard(rx, rx ? BENCH : '')), want);
      assert.equal(want === '', rx === null);
    });
  }
});

describe('the session log (buildLogHTML, phase E step 27)', () => {
  // The booted app: the real buildLogHTML and every helper it reads (the dose parser, the cardio fields with their
  // wheels, the chips' icons, the swap note), so the log drawn from the model's reads is held to the legacy one.
  const IA = loadApp();
  const W = IA.window;
  const icon = (key: string, size: number): string => W['asyIcon'](key, size);

  /** The log written out as buildLogHTML wrote it. */
  function logMarkup(d: SessionLogData): string {
    const v = d.view;
    const c = v.cardio;
    return `<div class="log-section" id="logSection">
    <div class="log-header"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex:0 0 auto;margin-right:6px"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>Log This Session</div>
    <div class="log-body">
      <div class="log-field">
        <label>How hard was it? — RPE <button type="button" onclick="showRpeInfo()" aria-label="What is RPE?" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:0 2px;vertical-align:baseline">ⓘ</button></label>
        <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
          <input type="range" min="1" max="10" step="1" value="${v.rpeValue}" id="log_rpe"
            oninput="updateRPEDisplay(this.value)"
            style="flex:1">
          <div id="rpeDisplay" style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--accent);min-width:120px;text-align:right">${v.rpeText}</div>
        </div>
      </div>
      ${c ? `<div class="log-field" id="cardioSwapWrap" data-planned="${c.planned}" data-active="${c.active}" data-logged="${c.logged ? '1' : '0'}">
        <div id="cardioFields">${d.fields}</div>
        <button type="button" id="cardioSwapLink" onclick="toggleCardioPicker()" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:6px 0 0;display:inline-flex;align-items:center;gap:5px;text-decoration:underline;text-underline-offset:2px">${icon('history', 13)} Did a different activity?</button>
        <div id="cardioPicker" style="display:${c.swapped ? 'block' : 'none'};margin-top:8px">
          <div style="font-size:10px;color:var(--muted);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">Logged as</div>
          <div style="display:flex;gap:6px">${c.chips.map((ch) => `<button type="button" data-sport="${ch.sport}" onclick="setCardioSwap('${ch.sport}')" style="${ch.style}">${icon(ch.sport, 15)}<span>${ch.label}</span></button>`).join('')}</div>
          <div id="cardioSwapNote" style="font-size:11px;color:var(--accent);margin-top:8px;line-height:1.4;display:${c.swapped ? 'block' : 'none'}">${c.note}</div>
        </div>
        <button type="button" id="cardioLogBtn" class="ex-logbtn${c.logged ? ' logged' : ''}" onclick="logCardio()">${c.logLabel}</button>
      </div>` : ''}

      <div class="log-field"><label>Notes</label>
        <textarea id="log_notes" placeholder="How did it go? Anything to remember next week?" class="input-field" style="resize:none;height:64px;line-height:1.4">${v.notes}</textarea>
      </div>
    </div>
  </div>`;
  }

  const prog = IA.buildProgram(IA.fixtures.HALF_MANNY);
  const dayCardio = (w: number, d: string) => (prog.weeks as unknown as Record<number, Record<string, { cardio?: unknown }>>)[w]![d]!.cardio;
  const SENTINEL = '__unset__';
  const doseState = (): string => JSON.stringify(IA.eval('[_curLogDose, _curLogDoseFull, _curLogSub]'));
  // Each case: what the day plans, what the log holds, then (typed by hand) whether a cardio block shows and reads as logged.
  const cases: [string, unknown, LogEntry | null, 'none' | 'draft' | 'logged'][] = [
    ['a lifting day, nothing logged', null, null, 'none'],
    ['a lifting day with an RPE and notes written as markup', null, { rpe: 7, notes: 'Felt good &amp; <b>fast</b>' }, 'none'],
    ['a recovery run (a time dose), nothing logged', dayCardio(1, 'fri'), null, 'draft'],
    ['a long run (a distance dose), logged', dayCardio(1, 'sat'), { rpe: '6', run_dist: '3.1', run_mins: '29' }, 'logged'],
    ['intervals (no dose), logged by pace only', dayCardio(1, 'mon'), { run_pace: '7:30' }, 'logged'],
    ['race day', dayCardio(14, 'sun'), { rpe: 10 }, 'draft'],
    ['a run logged as a ride, the run numbers parked', dayCardio(1, 'sat'), { swapTo: 'bike', bike_mins: '40', parked: { run: { run_dist: '2', run_pace: '', run_mins: '', run_reps: '', run_rep_time: '' } } }, 'logged'],
    ['a run logged as a swim, nothing parked', dayCardio(1, 'fri'), { swapTo: 'swim', swim_yards: '' }, 'draft'],
    ['a ride', { type: 'bike', detail: '45 min @ RPE 6' }, { bike_mins: '45' }, 'logged'],
    ['a swim', { type: 'Swim', subtype: 'endurance', detail: '1,500 yd continuous' }, null, 'draft'],
    ['another sport', { type: 'Rower', detail: '2k test' }, { rpe: 5 }, 'none'],
  ];
  for (const [label, cardio, entry, block] of cases) {
    test(label, () => {
      IA.eval('saveLogs({})');
      if (entry) {
        const logs = W['getLogs']();
        logs[W['logKey'](IA.eval('currentWeek'), 'fri')] = JSON.parse(JSON.stringify(entry));
        W['saveLogs'](logs);
      }
      IA.eval(`_setCurLogDose('${SENTINEL}'); _setCurLogDoseFull('${SENTINEL}'); _setCurLogSub('${SENTINEL}')`);
      const want = W['buildLogHTML']('fri', cardio);
      const wantState = doseState();
      IA.eval(`_setCurLogDose('${SENTINEL}'); _setCurLogDoseFull('${SENTINEL}'); _setCurLogSub('${SENTINEL}')`);
      const stored = W['getLogs']()[W['logKey'](IA.eval('currentWeek'), 'fri')] || {};
      const got = sessionLog(stored, cardio as { type?: string; subtype?: string } | null, {
        rpeLabels: IA.eval('RPE_LABELS'),
        dose: (c) => W['doseFromCardio'](c),
        setDoseFull: (d) => W['_setCurLogDoseFull'](d),
        setSub: (s) => W['_setCurLogSub'](s),
        setDose: (d) => W['_setCurLogDose'](d),
        fields: (sport, e, dose, sub) => W['cardioFieldHTML'](sport, e, dose, sub),
        live: (e, sport) => W['cardioEntryLive'](e, sport),
        noteText: (active, planned, e) => W['cardioSwapNoteText'](active, planned, e),
        logLabel: (live) => W['cardioLogLabel'](live),
      });
      assert.equal(logMarkup(got), want);
      assert.equal(/id="cardioSwapWrap"/.test(want) ? (/data-logged="1"/.test(want) ? 'logged' : 'draft') : 'none', block);
      assert.equal(doseState(), wantState, 'the dose the fields read back is the one the legacy log set');
    });
  }
});

