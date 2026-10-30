// The session sheet's pieces moved from the legacy builders to Angular components (architecture phase E). The oracle
// here is the legacy builder itself, lifted out of the page with appFunction: for every input below, the view written
// back out in the legacy markup format is the legacy builder's markup, byte for byte. The app's own unit tests hold
// hand-worked values for the same functions.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { appFunction, loadApp, pinClock } from '../support/app.ts';
import { cardioCard, type CardioCardView, type CardioRx } from '../../frontends/app/src/app/screens/day-detail/cardio-card-model.ts';
import { type LogEntry, sessionLog, type SessionLogData } from '../../frontends/app/src/app/screens/day-detail/session-log-model.ts';
import { type ExSection, type ExView, sectionsView, type SectionView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';
import { benchNotes, modTags, wildcardSub } from '../../frontends/app/src/app/screens/day-detail/sheet-marks-model.ts';
import { cardioFields, type CardioFields as CardioFieldsView, type Dose, type FieldReads, type PlanStrip, type RepStepper, type WheelView } from '../../frontends/app/src/app/screens/day-detail/cardio-fields-model.ts';

const BENCH = '<div class="cardio-note"><b>RETEST:</b> strip</div>';
/** The strip as the model's lines, for the same stand-in. */
const BENCH_NOTES = [{ lead: 'RETEST:', text: ' strip' }];

/** The card written out as buildCardioHTML wrote it. */
function cardMarkup(c: CardioCardView | null): string {
  if (!c) return '';
  const body = c.segments
    ? c.segments.map((sg) => `<div class="swim-seg"><div class="swim-seg-label">${sg.label}</div><div class="swim-seg-body">${sg.text}</div></div>`).join('')
      + (c.total ? `<div class="swim-total">${c.total}</div>` : '')
    : `<div class="cardio-detail">${c.detail}</div>`;
  return `<div class="${c.blockCls}"><div class="cardio-type-label ${c.labelCls}">${c.label}</div>` + body
    + (c.note ? `<div class="cardio-note">${c.note}</div>` : '') + c.bench.map((n) => '<div class="cardio-note">' + (n.lead ? '<b>' + n.lead + '</b>' : '') + n.text + '</div>').join('') + '</div>';
}


/** The cardio fields written out as the legacy cardioFieldHTML wrote them, with the app's own icons and escape. */
function fieldsMarkupFor(icon: (key: string, size: number) => string, esc: (x: string) => string): (f: CardioFieldsView) => string {
  const wheel = (w: WheelView) => '<div class="iaw-cell iaw-f' + w.ncols + '"><div class="iaw-cap">' + w.cap + '</div>'
    + '<div class="iaw" data-kind="' + w.kind + '" data-for="' + w.hiddenId + '"' + (w.plan === null ? '' : ' data-plan="' + w.plan.replace(/"/g, '&quot;') + '"') + '><div class="iaw-shade"></div><div class="iaw-band"></div>'
    + w.cols.map((c) => '<div class="iaw-col" data-ci="' + c.ci + '" data-wrap="' + (c.wrap ? '1' : '') + '" data-len="' + c.len + '"><div class="iaw-pad"></div>'
      + c.items.map((it) => '<div class="iaw-it' + (it.nil ? ' nil' : '') + '" data-v="' + it.v + '">' + it.face + '</div>').join('') + '<div class="iaw-pad"></div></div>').join('')
    + '</div><input type="hidden" id="' + w.hiddenId + '" value="' + w.value.replace(/"/g, '&quot;') + '"></div>';
  const strip = (s: PlanStrip) => '<div class="plan-strip' + (s.bike ? ' bike-strip' : '') + '"><span class="ps-lbl">' + s.label + '</span><span class="ps-val">' + esc(s.value) + '</span></div>';
  const stepper = (st: RepStepper) => `<label>Reps completed</label>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="exset-ctl" style="flex:0 0 150px">
            <button type="button" class="exset-btn" onclick="doseRep(-1)">−</button>
            <div class="exset-val" id="doseRepVal">${st.shown}</div>
            <button type="button" class="exset-btn" onclick="doseRep(1)">+</button>
          </div>
          <span class="reps-of">${st.of}</span>
        </div>
        <input type="hidden" id="log_run_reps" value="${st.stored}">`;
  function fieldsMarkup(f: CardioFieldsView): string {
    switch (f.kind) {
      case 'time':
      case 'dist':
        return strip(f.strip) + `<label>${icon('run', 15)} Log the run</label>
        <div class="iaw-wrap iaw-solo">${wheel(f.first)}</div>
        <div class="f-sub">Shows the plan. Move it to match the watch.</div>
        <div class="iaw-wrap iaw-solo">${wheel(f.second)}</div>
        <div class="f-sub">Off the watch.</div>
        <div id="doseDerived"></div>`;
      case 'reps_dist':
        return strip(f.strip) + `<div class="log-field" style="margin-bottom:10px">${stepper(f.stepper)}</div>
        <div class="iaw-wrap" style="max-width:190px">${wheel(f.wheel)}</div>
        <div class="f-sub">what the watch showed on most reps</div>
        <div id="doseDerived"></div>`;
      case 'reps_time':
        return strip(f.strip) + `<div class="log-field" style="margin-bottom:10px">${stepper(f.stepper)}</div>
        <label>Miles in the work reps</label>
        <div class="iaw-wrap iaw-solo">${wheel(f.wheel)}</div>
        <div class="f-sub">Leave out the easy jog between reps.</div>
        <div id="doseDerived"></div>`;
      case 'run':
        return `<label>${icon('run', 15)} Run — actual distance & pace</label>${f.speedHint ? '<div class="f-sub" style="margin-bottom:6px">Whole session off the watch — warm up, efforts and recoveries all count.</div>' : ''}
        <div class="iaw-wrap">
          ${wheel(f.dist)}
          ${wheel(f.pace)}
        </div>`;
      case 'bike':
        return (f.strip ? strip(f.strip) : '') + `<label>${icon('bike', 15)} Log the ride</label>
        <div class="iaw-wrap iaw-solo">${wheel(f.wheel)}</div>`;
      case 'swim':
        return `<label>${icon('swim', 15)} Swim — actual yardage</label>
        <input type="number" id="log_swim_yards" placeholder="yards" value="${f.yards}" min="0" step="25" class="input-field">`;
      default:
        return '';
    }
  }
  return fieldsMarkup;
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
      assert.equal(cardMarkup(cardioCard(rx, rx ? BENCH_NOTES : [])), want);
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
  const fieldsMarkup = fieldsMarkupFor(icon, (x) => W['esc'](x));

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
        <div id="cardioFields">${fieldsMarkup(d.fields)}</div>
        <button type="button" id="cardioSwapLink" onclick="toggleCardioPicker()" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:6px 0 0;display:inline-flex;align-items:center;gap:5px;text-decoration:underline;text-underline-offset:2px">${icon('history', 13)} Did a different activity?</button>
        <div id="cardioPicker" style="display:${c.swapped ? 'block' : 'none'};margin-top:8px">
          <div style="font-size:10px;color:var(--muted);font-weight:700;letter-spacing:0;margin-bottom:6px">Logged as</div>
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
        fields: (sport, e, dose, sub) => cardioFields(sport, e, dose as Dose | null, sub, { spec: IA.eval('_IAW_SPEC'), sessionCode: (s, k, sp) => W['runSessionCode'](s, k, sp), pace: (sec) => W['_fmtPaceMi'](sec) }),
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

describe('the sections and their exercise cards (buildSectionsHTML and buildExItem, phase E step 28)', () => {
  // The booted app with two stored programs: the active one (Mario's), whose loads, drafts and swaps are written per
  // day below, and an older one whose loads the cards may offer across the boundary. The legacy builders and the model
  // read the same stores through the same helpers; the sections drawn from the model, written out in the legacy
  // markup, are the legacy markup byte for byte, and both leave the same render-time state behind.
  const IA = loadApp();
  const NOW = new Date('2026-10-12T15:00:00Z').getTime();
  pinClock(IA, NOW);
  const W = IA.window;
  const DAY = 86400000;
  const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
  const P1 = clone(IA.buildProgram(IA.fixtures.HALF_MANNY)) as unknown as { id: string; name: string; weeks: Record<number, Record<string, { sections?: ExSection[] } | null>> };
  P1.id = 'p_sections';
  P1.name = 'Half Manny';
  IA.localStorage.setItem('ia_programs', JSON.stringify([P1, { id: 'p_old', name: 'Old <b>Block</b>', weeks: {} }]));
  IA.localStorage.setItem('ia_active', P1.id);
  IA.eval('showToast=function(){};activeProgId=null;activeProg=null;init();');
  const bridge = { call: <T,>(n: string, ...a: unknown[]): T => W[n](...a) as T, global: <T,>(n: string): T => IA.eval(n) as T };
  const icon = (key: string, size: number): string => W['asyIcon'](key, size);
  const esc = (x: string): string => W['esc'](x);
  const q = (x: string): string => x.replace(/'/g, "\\'");

  function cardMarkup(x: ExView): string {
    if (x.kind === 'skipped') {
      return `<div class="ex-skipped"><span class="ex-skipped-lbl">Skipped</span><span class="ex-skipped-name">${esc(x.name)}</span><button class="ex-skipped-undo" onclick="unskipExercise('${q(x.name)}')">Put it back</button></div>`;
    }
    const k = x.exKey;
    let h = `<div class="exercise-item${x.logged ? ' logged' : ''}" id="excard_${k}"><div class="ex-namerow"><span class="ex-name">${x.name}</span>`
      + (x.swap ? `<button type="button" class="ex-swapbtn" aria-label="Swap this exercise" onclick="openSwapSheet(${x.swap.secIdx},${x.swap.itemIdx})">${icon('swap', 16)}</button>` : '')
      + (x.skip ? `<button type="button" class="ex-skipbtn" aria-label="Skip this exercise" onclick="skipExercise('${q(x.name)}')">${icon('minus', 16)}</button>` : '')
      + `<span class="ex-badge" id="exbadge_${k}">${x.logged ? '✓' : ''}</span></div>`
      + (x.detail ? `<div class="ex-detail">${x.detail}</div>` : '')
      + (x.added ? `<div class="ex-swapchip"><span class="ex-swapchip-lbl">You added this</span> · not in the plan<button type="button" class="ex-swapundo" onclick="removeAddedExercise('${q(x.name)}')">remove</button></div>` : '')
      + (x.swappedFrom ? `<div class="ex-swapchip"><span class="ex-swapchip-lbl">Swapped in</span> for ${x.swappedFrom}<button type="button" class="ex-swapundo" onclick="undoSwap('${q(x.swappedFrom)}')">put it back</button></div>` : '');
    if (x.log) {
      h += `<div class="ex-log" id="exlog_${k}">`;
      const st = x.log.sets;
      if (st) {
        h += `<button type="button" class="exset-head" onclick="toggleSets('${k}')"><span class="exset-head-lbl">Sets</span><span class="exset-head-val" id="exsum_${k}">${st.head}</span><span class="exset-head-sub" id="exsumsub_${k}">${st.sub}</span><span class="exset-head-sp"></span><span class="exset-head-vary" id="exvary_${k}"${st.varied ? '' : ' style="display:none"'}>Varied</span><span class="exset-caret">${icon('chevronDown', 20)}</span></button>`;
        h += `<div class="exset-rows" id="exrows_${k}">`;
        for (const r of st.rows) {
          h += `<div class="exset-row" id="exsetrow_${k}_${r.s}"><span class="exset-num">${r.s + 1}</span><div class="exset-ctl">`
            + `<button type="button" class="exset-btn" onclick="stepSet('${r.rowId}',${-r.step})">−</button>`
            + `<span class="exset-val"><input id="${r.rowId}" class="${r.cls}" inputmode="numeric" value="${r.value}" placeholder="${r.placeholder}"${r.rx === null ? '' : ` data-rx="${r.rx}"`} oninput="setDelta('${r.rowId}')" onblur="autoSaveSets('${k}')">`
            + (r.suffix ? `<span class="exset-suf">${r.suffix}</span>` : '')
            + `<span class="${r.deltaCls}" id="${r.rowId}_d">${r.deltaText}</span></span>`
            + `<button type="button" class="exset-btn" onclick="stepSet('${r.rowId}',${r.step})">+</button></div>`;
          if (r.weight) h += `<div class="exset-w"><span class="exset-toppip">Top</span><input inputmode="numeric" id="${r.weight.id}" class="${r.weight.cls}" value="${r.weight.value}" placeholder="" oninput="onSetWeight('${k}',${r.s})" onblur="autoSaveSets('${k}')"><span class="exset-w-u">${r.weight.unit}</span></div>`;
          h += '</div>';
        }
        h += '</div>';
        if (st.foot) h += `<div class="exset-foot"><span class="exset-foot-lbl" id="extoplbl_${k}">${st.foot}</span><span class="exset-foot-val" id="extop_${k}">—</span><span class="exset-foot-note">This is what tracks<br>your progress</span></div>`;
      }
      const ld = x.log.load;
      if (ld) {
        h += `<div class="ex-weight"><span class="ex-weight-lbl">${ld.label}</span><input type="number" inputmode="numeric" id="exw_${k}" value="${esc(ld.value)}" placeholder="" min="0" step="${ld.step}" class="ex-winput" oninput="cascadeSetWeights('${k}')" onblur="autoSaveSets('${k}')"><span class="ex-wunit">${ld.unit}</span>`;
        if (ld.reuse) h += `<button type="button" class="ex-reuse${ld.reuse.stale ? ' is-stale' : ''}" onclick="reuseWeight('${k}',${ld.reuse.value})"><span class="ex-reuse-ico">↺</span><span class="ex-reuse-txt"><span id="exreusenum_${k}">${ld.reuse.text}</span><small id="exrec_${k}">${esc(ld.reuse.rec)}</small></span></button>`;
        h += '</div>' + (ld.warn ? `<div class="ex-stale-warn"><i>△</i><span>${esc(ld.warn)}</span></div>` : '');
        if (ld.fill) h += `<button type="button" class="ex-reuse ex-reuse-fill${ld.fill.stale ? ' is-stale' : ''}" onclick="fillAllSetWeights('${k}',${ld.fill.value})"><span class="ex-reuse-ico">↺</span><span class="ex-reuse-txt">${ld.fill.text}<small>${ld.fill.rec}</small></span></button>`;
      }
      h += `<button class="ex-logbtn" onclick="saveExWeight('${k}','${q(x.name)}','${q(x.rxDetail)}')">Log</button></div>`;
    }
    return h + '</div>';
  }

  function sectionsMarkup(v: SectionView[]): string {
    return v.map((sec) => {
      if (sec.kind === 'skippedRound') {
        return `<div class="section"><div class="ex-skipped"><span class="ex-skipped-lbl">Skipped</span><span class="ex-skipped-name">${esc(sec.text)}</span><button class="ex-skipped-undo" onclick="unskipSuperset(${sec.secIdx})">Put it back</button></div></div>`;
      }
      const b = sec.body;
      const cards = b.items.map(cardMarkup).join('');
      const body = b.kind === 'block'
        ? (b.label ? `<div class="section-label" style="color:${b.label.color}">${b.label.markup ? b.label.text : esc(b.label.text)}</div>` : '') + `<div class="section-block">${cards}</div>`
        : b.kind === 'core' ? `<div class="core-block"><div class="core-header">${b.header}</div>${cards}</div>`
          : `<div class="superset-wrap"><div class="superset-header"><span class="sshdr-txt">${b.header}</span><button class="ss-minus" onclick="skipSuperset(${b.secIdx})" aria-label="Skip this round">${icon('minus', 15)}</button></div>${cards}</div>`;
      return '<div class="section">' + (sec.label !== null ? `<div class="section-label">${sec.label}</div>` : '') + body + '</div>';
    }).join('');
  }

  /** The day's loads, drafts and swaps: each exercise in turn logged today, loaded last week, drafted, loaded only in the old program long ago, or blank. */
  function seed(week: number, day: string, sections: ExSection[]): void {
    const names = [...new Set(sections.flatMap((s) => (s.items || []).map((i) => i.name || '')).filter(Boolean))];
    const exw: Record<string, unknown> = {};
    const old: Record<string, unknown> = {};
    const sets: Record<string, unknown> = {};
    names.forEach((n, i) => {
      const key = W['exStoreKey'](n);
      const role = i % 5;
      if (role === 0) exw[key] = { name: n, entries: [{ week, day, weight: 135 + i * 5, setsW: [135 + i * 5, 140 + i * 5, 135 + i * 5], setsDone: [8, 7, 8], ts: NOW - 3600000 }] };
      if (role === 1) exw[key] = { name: n, entries: [{ week: week - 1, day, weight: 95, setsDone: [10, 10, 10], ts: NOW - 6 * DAY }, { week: week - 1, day, weight: 0, ts: NOW - 5 * DAY }] };
      if (role === 2) sets[key] = { r: ['9', '', '7'], w: ['', '50', ''], L: '45' };
      if (role === 3) old[key] = { name: n, entries: [{ week: 3, day: 'mon', weight: 60, ts: NOW - 45 * DAY }] };
    });
    IA.localStorage.setItem('ia_exw_' + P1.id, JSON.stringify(exw));
    IA.localStorage.setItem('ia_exw_p_old', JSON.stringify(old));
    const logs: Record<string, unknown> = {};
    logs[W['logKey'](week, day)] = { sets };
    IA.localStorage.setItem('ia_logs_' + P1.id, JSON.stringify(logs));
    const swaps: Record<string, unknown> = {};
    if (names[1]) swaps['w' + week + '_' + day] = [{ from: 'Barbell row', to: names[1] }, { from: "Farmer's walk", to: names[1] }];
    IA.localStorage.setItem('ia_swaps_' + P1.id, JSON.stringify(swaps));
  }

  /** Every markup the comparisons saw, so each test can show it reached what it claims to cover. */
  const seen: string[] = [];
  const covers = (needles: string[]) => {
    const all = seen.join('\n');
    for (const n of needles) assert.ok(all.includes(n), `no comparison drew ${n}`);
    seen.length = 0;
  };

  /** The sheet's two calls (the main section, then the rest), legacy and model, from the same state. */
  function compare(week: number, day: string, unit: string): void {
    IA.eval(`currentWeek=${week};_setCurrentDayKey('${day}');window._unitLabel='${unit}';`);
    const secs = (IA.eval('activeProg').weeks[week][day].sections || []) as ExSection[];
    const reset = () => IA.eval("_setStaleWarnShown(false);_setStaleWarnSrc('');for(const k of Object.keys(_rxCache))delete _rxCache[k];");
    const state = () => JSON.stringify(IA.eval('[_staleWarnShown,_staleWarnSrc,_rxCache]'));
    reset();
    const want = W['buildSectionsHTML']([secs[0]], 0) + W['buildSectionsHTML'](secs.slice(1), 1);
    const wantState = state();
    seen.push(want);
    reset();
    const got = sectionsMarkup(sectionsView([secs[0]!], 0, sectionReads(bridge))) + sectionsMarkup(sectionsView(secs.slice(1), 1, sectionReads(bridge)));
    assert.equal(got, want, `week ${week} ${day} in ${unit}`);
    assert.equal(state(), wantState, 'the rx cache and the stale warning are left as the legacy builders left them');
  }

  const days: [number, string][] = [];
  for (const [w, wk] of Object.entries(P1.weeks)) for (const [d, day] of Object.entries(wk || {})) if (day && (day.sections || []).length) days.push([+w, d]);

  test('every lifting day of Mario\'s program, in pounds and kilograms, with loads, drafts, swaps and old loads', () => {
    assert.ok(days.length >= 40, `found ${days.length} lifting days`);
    for (const [w, d] of days) {
      seed(w, d, P1.weeks[w]![d]!.sections!);
      for (const unit of ['lbs', 'kg']) compare(w, d, unit);
    }
    covers(['class="section-label"', 'exercise-item logged', 'class="ex-swapbtn"', 'class="ex-skipbtn"', 'Swapped in</span> for Farmer\'s walk', 'exset-delta down', 'exset-delta up',
      'data-rx=', 'class="exw-inherit"', 'id="exvary_', '>Varied<', 'Top set', 'Every set', 'class="ex-reuse"', 'ex-reuse is-stale', 'class="ex-stale-warn"',
      'came from Old &lt;b&gt;Block&lt;/b&gt;', 'ex-reuse-fill', 'value="45"', '<span class="ex-wunit">kg</span>', '<span class="ex-wunit">lbs</span>']);
  });

  test('a kettlebell weighs in the program\'s unit: lbs or kg, never "lb", on both builders (D257)', () => {
    const sec = [{ label: 'Accessories', items: [{ name: 'Kettlebell single-arm row', detail: '3×8–12 each @ RPE 8' }] }] as ExSection[];
    for (const unit of ['lbs', 'kg']) {
      IA.eval(`window._unitLabel='${unit}';`);
      const want = W['buildSectionsHTML'](sec, 1) as string;
      assert.ok(want.includes(`<span class="ex-wunit">${unit}</span>`), unit);
      assert.ok(!/>lb</.test(want), 'no "lb" label in ' + unit);
      assert.equal(sectionsMarkup(sectionsView(sec, 1, sectionReads(bridge))), want, 'the iOS app draws the same card');
    }
  });

  test('a day edited every way: a skipped exercise, a skipped round, a round down to one, added and hip and core blocks, a round with no count', () => {
    const [w, d] = days[3]!;
    const live = IA.eval('activeProg').weeks[w][d];
    const base = clone(live.sections) as ExSection[];
    const first = base[0]!;
    const crafted: ExSection[] = [
      { ...first, items: first.items.map((it, i) => (i === 1 ? { ...it, _skipped: true } : it)) },
      { label: 'Conditioning — 3 Rounds', superset: true, _skipped: true, items: [{ name: 'Burpees', detail: '10 reps' }, { name: 'Kettlebell swing', detail: '15 reps' }] },
      { label: 'Finisher', type: 'superset', items: [{ name: 'Push-ups', detail: '12 reps', _skipped: true }, { name: 'Goblet squat (DB)', detail: '12 reps' }], rounds: 3 },
      { label: 'Finisher B', type: 'superset', items: [{ name: 'Dead bugs', detail: '3×10 each', _skipped: true }, { name: 'Plank', detail: '' }] },
      { label: 'Your <i>adds</i>', _added: true, items: [{ name: 'Cable fly', detail: '3×12', _addedByUser: true }] },
      { hip: true, items: [{ name: 'Banded lateral walk', detail: '2×12 each' }, { name: 'Clamshell', detail: '2×15 each' }] },
      { core: true, coreHeader: 'Core — <b>anti-rotation</b>', items: [{ name: 'Pallof press', detail: '3×10 each' }] },
      { label: 'Circuit', superset: true, items: [{ name: 'Dumbbell row', detail: '3×10' }, { name: 'Dumbbell bench press', detail: '3×10' }] },
      { label: 'Primer', items: [{ name: 'Box jump', detail: '3×3' }, { name: '<svg viewBox="0 0 1 1"></svg> Rest 2 min', detail: '' }] },
    ];
    live.sections = crafted;
    try {
      seed(w, d, crafted);
      for (const unit of ['lbs', 'kg']) compare(w, d, unit);
      covers(['<span class="ex-skipped-name">', 'unskipSuperset(1)', 'reduced to straight sets', 'Finisher B', 'You added this', 'style="color:var(--signal)">Your <i>adds</i>',
        'style="color:var(--hip)">Hip stability', '<div class="core-header">Core — <b>anti-rotation</b></div>', 'class="superset-wrap"', 'class="ss-minus"',
        '<div class="section-label">Primer</div>', 'class="ex-name"><svg', 'bw-blank']);
    } finally {
      live.sections = base;
    }
  });
});

describe('the sheet\'s marks (modTagsHTML, travelTagHTML, wildcardTagHTML, _benchStripHTML, phase E step 30)', () => {
  // The booted app's own builders against the model's marks written out in the legacy markup. The stores they read
  // (Wildcards done, overlays, logs and frozen days) are written or stood in for below.
  const IA = loadApp();
  pinClock(IA, '2026-10-12T15:00:00Z');
  const W = IA.window;
  const icon = (key: string, size: number): string => W['asyIcon'](key, size);
  const esc = (x: string): string => W['esc'](x);
  const prog = IA.buildProgram(IA.fixtures.HALF_MANNY) as unknown as { weeks: Record<number, Record<string, { title?: string; rest?: boolean; tags?: string[]; cardio?: { subtype?: string } } | null>> };

  test('every day\'s tags, and a tag with no color or label', () => {
    const seen = new Set<string>();
    const sets: string[][] = [['odd', 'rest', 'run'], []];
    for (const wk of Object.values(prog.weeks)) for (const day of Object.values(wk)) if (day && !seen.has(JSON.stringify(day.tags))) { seen.add(JSON.stringify(day.tags)); sets.push(day.tags || []); }
    assert.ok(sets.length >= 6, `found ${sets.length} tag sets`);
    for (const tags of sets) {
      const got = modTags(tags, IA.eval('MOD_PAL'), IA.eval('tagMeta')).map((t) => `<span class="wk-tag" style="color:${t.color};background:${t.bg}">${t.label}</span>`).join('');
      assert.equal(got, W['modTagsHTML'](tags), JSON.stringify(tags));
    }
  });

  test('the travel tag on a travel day only', () => {
    const real = W['dayOverlayInfo'];
    try {
      for (const [info, travel] of [[null, false], [{ type: 'substitute', patch: { equipment: 'bodyweight' } }, true], [{ type: 'substitute', patch: { equipment: 'commercial' } }, false], [{ type: 'protect', patch: {} }, false]] as const) {
        IA.eval('dayOverlayInfo = function(){ return globalThis.__info; }');
        W['__info'] = info;
        assert.equal(W['dayIsTravel']({}) ? `<span class="wk-tag wk-travel">${icon('backpack', 11)}<span>Travel</span></span>` : '', W['travelTagHTML']({}));
        assert.equal(!!W['dayIsTravel']({}), travel);
      }
    } finally {
      W['dayOverlayInfo'] = real;
    }
  });

  test('the Wildcard tag on a training day, a rest day, a day with no title, and none where no Wildcard was done', () => {
    IA.localStorage.setItem('ia_programs', JSON.stringify([{ ...prog, id: 'p_marks' }]));
    IA.localStorage.setItem('ia_active', 'p_marks');
    IA.eval('showToast=function(){};activeProgId=null;activeProg=null;init();');
    const active = IA.eval('activeProg') as typeof prog;
    active.weeks[2]!['sat'] = { ...(active.weeks[2]!['sat'] || {}), rest: true, title: 'Rest' };
    active.weeks[3]!['mon'] = { ...(active.weeks[3]!['mon'] || {}), title: '' };
    const real = W['wildcardDaySet'];
    try {
      IA.eval("wildcardDaySet = function(){ const o={}; for (const [w,d] of [[1,'mon'],[2,'sat'],[3,'mon']]) o[completedKey(w,d)]={title:'Wild'}; return o; }");
      for (const [w, d] of [[1, 'mon'], [2, 'sat'], [3, 'mon'], [1, 'tue'], [0, 'mon']] as const) {
        const sub = wildcardSub(W['wildcardOn'](w, d), active.weeks[w] ? active.weeks[w]![d] : null);
        const got = sub === null ? '' : '<div class="wc-tag">' + W['wildcardMarkHTML'](16) + '<div class="wc-tag-txt"><div class="wc-tag-lbl">Wildcard done</div><div class="wc-tag-sub">' + esc(sub) + '</div></div></div>';
        assert.equal(got, W['wildcardTagHTML'](w, d), `week ${w} ${d}`);
      }
      assert.equal(W['wildcardMarkHTML'](16), `<span class="wc-mark" aria-label="Wildcard done">${icon('flame', 16)}<span class="wc-mark-w">W</span></span>`, 'the mark the sheet draws itself');
    } finally {
      W['wildcardDaySet'] = real;
    }
  });

  test('the retest strip: not a retest, no week 1, week 1 only, and faster, even and slower retests', () => {
    const retest = { type: 'run', subtype: 'Benchmark Run — Retest', week: 6 };
    const bench = { type: 'run', subtype: 'Benchmark Run' };
    const setRuns = (runs: [number, string, number | null][]) => {
      const logs: Record<string, unknown> = {};
      const hist: Record<string, unknown> = {};
      for (const [w, mi, mins] of runs) {
        const key = W['logKey'](w, 'sat');
        logs[key] = { run_dist: mi, run_mins: mins == null ? '' : String(mins) };
        hist[key] = { cardio: w === 1 ? bench : retest };
      }
      IA.localStorage.setItem('ia_logs_p_marks', JSON.stringify(logs));
      IA.localStorage.setItem('ia_hist_p_marks', JSON.stringify(hist));
    };
    const strip = (c: { subtype?: string; week?: number }) => benchNotes(c, (wk) => W['_benchmarkEntryFor'](wk), (s) => W['_clkMS'](s))
      .map((n) => '<div class="cardio-note">' + (n.lead ? '<b>' + n.lead + '</b>' : '') + n.text + '</div>').join('');
    const cases: [string, [number, string, number | null][], string][] = [
      ['no week 1', [], 'No week 1 benchmark'],
      ['week 1 only', [[1, '2.5', 20]], 'Week 1 baseline'],
      ['faster', [[1, '2.5', 20], [6, '2.7', 20]], 'FASTER'],
      ['even', [[1, '2.5', 20], [6, '2.51', 20]], 'Even with week 1'],
      ['slower', [[1, '2.5', 20], [6, '2.3', null]], 'slower'],
    ];
    for (const [what, runs, needle] of cases) {
      setRuns(runs);
      const want = W['_benchStripHTML'](retest) as string;
      assert.equal(strip(retest), want, what);
      assert.ok(want.includes(needle), `${what} drew ${needle}`);
    }
    assert.equal(strip({ subtype: 'Long Run' }), W['_benchStripHTML']({ subtype: 'Long Run' }));
  });
});

describe('the cardio fields and their wheels (cardioFieldHTML, _doseStripHTML and iaWheelHTML, phase E step 32)', () => {
  // The booted app's own builders against the model's fields written out in the legacy markup, for every dose kind,
  // the plain run, the ride with and without a dose, the swim and another sport, blank and logged.
  const IA = loadApp();
  pinClock(IA, '2026-10-12T15:00:00Z');
  const W = IA.window;
  const icon = (key: string, size: number): string => W['asyIcon'](key, size);
  const esc = (x: string): string => W['esc'](x);
  const reads: FieldReads = { spec: IA.eval('_IAW_SPEC'), sessionCode: (s, k, sp) => W['runSessionCode'](s, k, sp), pace: (sec) => W['_fmtPaceMi'](sec) };
  const fieldsMarkup = fieldsMarkupFor(icon, esc);
  const doses: [string, Record<string, unknown> | null][] = [
    ['none', null],
    ['a time dose', { k: 'time', mins: 25, tgt: 800, cap: 760, key: 'recovery' }],
    ['a distance dose', { k: 'dist', mi: 3.1, tgt: 800 }],
    ['a distance dose with no pace', { k: 'dist', mi: 13.1 }],
    ['400s', { k: 'reps_dist', reps: 8, m: 400, tgt: 450, key: 'intervals' }],
    ['timed reps', { k: 'reps_time', reps: 6, mins: 3, tgt: 480 }],
    ['an unknown kind', { k: 'mystery', mins: 5 }],
  ];
  const entries: [string, Record<string, unknown>][] = [
    ['blank', {}],
    ['logged', { run_mins: '29.5', run_dist: '3.10', run_pace: '9:30', run_reps: 7, run_rep_time: '1:52', bike_mins: '45', swim_yards: '1500' }],
    ['the stamp of the plan', { run_dist: '3.1', run_reps: '' }],
    ['a quote in a field', { run_dist: '3"1', run_mins: 0 }],
  ];
  for (const sport of ['run', 'bike', 'swim', 'rower']) {
    test(`${sport}: every dose and entry`, () => {
      for (const [dl, dose] of doses) for (const [el, entry] of entries) for (const sub of ['', 'Speed Run — Intervals', 'Long Run']) {
        const want = W['cardioFieldHTML'](sport, entry, dose, sub) as string;
        assert.equal(fieldsMarkup(cardioFields(sport, entry, dose as Dose | null, sub, reads)), want, `${sport}, ${dl}, ${el}, "${sub}"`);
      }
    });
  }
});
