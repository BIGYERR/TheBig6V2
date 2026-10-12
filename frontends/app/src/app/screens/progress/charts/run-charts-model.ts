// Progress's run charts, kept apart from Angular so the app's node --test suite reads them as they are (architecture
// phase E, step 15: the legacy buildLadderChart, buildEasyEffortChart, buildEasyEffortEmpty, buildProjectionCard,
// buildDriftChart, buildEasyZoneChart, buildEasyBandsFallback and buildPaceChart become CardSpecs the ChartCard
// component draws). Each function is its legacy builder's arithmetic and wording, returning null where the legacy
// returned nothing. The readers that gather the runs (ladderWeekly, easyEffortWeekly, plannedVsLogged, easyVsPrescribed,
// runsByClass, recoveryPaceWeekly) stay the legacy script's.
import { axTx, card, type CardSpec, gridLine, type SvgEl, svgEl } from './chart-card-model.ts';

/** The legacy pieces the charts read: the pace clock, the icon, the pace table's mile and half readings, and the gates. */
export interface RunChartDeps {
  pace(sec: number): string;
  icon(name: string, size: number): string;
  mileFromRecovery(sec: number): number | null;
  halfFromMile(sec: number): number | null;
  easyRpeLo: number;
  easyRpeHi: number;
  easyMinRuns: number;
  easyZoneMinRuns: number;
}

const max = (xs: number[]) => Math.max.apply(null, xs);
const min = (xs: number[]) => Math.min.apply(null, xs);
const plain = (w: number, h: number, els: SvgEl[]) => ({ w, h, els });

/** The legacy buildLadderChart: the long run each week as a bar, the best one bolder, the race distance as a line. */
export function ladderChart(wk: Record<number, number>, totalWeeks: number, raceMi: number, cut: number, skip1: boolean, d: RunChartDeps): CardSpec | null {
  const vals = Object.keys(wk).map(Number);
  if (vals.length < 2) return null;
  const best = max(vals.map((w) => wk[w]!));
  const mx = Math.max(best, raceMi || 0) * 1.12 || 1;
  const W = 320, H = 152, padL = 26, padR = 10, padT = 20, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const slot = plotW / totalWeeks, barW = slot * 0.6;
  const s: SvgEl[] = [];
  const step = mx > 20 ? 10 : 5;
  for (let yv = 0; yv <= mx; yv += step) {
    const cy = padT + plotH - (yv / mx) * plotH;
    s.push(gridLine(padL, cy.toFixed(1), W - padR), axTx(padL - 5, cy + 3, yv));
  }
  if (raceMi > 0 && raceMi <= mx) {
    const hy = padT + plotH - (raceMi / mx) * plotH;
    s.push(svgEl('line', { x1: padL, y1: hy.toFixed(1), x2: W - padR, y2: hy.toFixed(1), stroke: 'var(--signal)', 'stroke-width': '1.2', 'stroke-dasharray': '4,3' }));
    s.push(axTx(W - padR, hy - 5, 'RACE — ' + raceMi + ' mi', 8, 'end', 'var(--signal)', '700'));
  }
  for (let i = 0; i < totalWeeks; i++) {
    const w = i + 1, x = padL + i * slot + (slot - barW) / 2, v = wk[w];
    if (!(v! > 0)) {
      s.push(svgEl('rect', { x: x.toFixed(1), y: (padT + plotH - 8).toFixed(1), width: barW.toFixed(1), height: '8', fill: 'none', stroke: 'var(--border)', 'stroke-width': '1', 'stroke-dasharray': '2,2' }));
      continue;
    }
    const h = (v! / mx) * plotH;
    s.push(svgEl('rect', { x: x.toFixed(1), y: (padT + plotH - h).toFixed(1), width: barW.toFixed(1), height: h.toFixed(1), fill: 'var(--run)', opacity: v === best ? 0.95 : 0.62 }));
  }
  const lblStep = Math.ceil(totalWeeks / 7);
  for (let i = 0; i < totalWeeks; i++) if (i % lblStep === 0) s.push(axTx(padL + i * slot + slot / 2, H - 8, 'W' + (i + 1), 8, 'middle'));
  const bestW = vals.filter((w) => wk[w] === best)[0];
  let foot = 'Furthest so far <b style="color:var(--run)">' + best.toFixed(1) + ' mi</b> in W' + bestW;
  if (raceMi > 0) {
    foot += best >= raceMi ? ' — you have already covered race distance.' : ' — <b style="color:var(--text)">' + (raceMi - best).toFixed(1) + ' mi</b> from race distance.';
  }
  if (cut) foot += ' Week ' + cut + ' is still in progress and is not counted yet.';
  if (skip1) foot += ' Week 1 was a short first week and is not counted here or in the mileage above.';
  return card(d.icon('🏃', 15) + ' Long Run Ladder', 'var(--run)', { svg: plain(W, H, s), foot });
}

/** What the effort readers return: the mean easy pace per week (seconds per mile) and the coverage. */
export interface EasyEffort {
  weekly: Record<number, number>;
  nRuns: number;
  nWeeks?: number;
}

/** The legacy buildEasyEffortChart: easy pace at a fixed RPE, week by week, faster upward. */
export function easyEffortChart(ee: EasyEffort, totalWeeks: number, d: RunChartDeps): CardSpec | null {
  const ws = Object.keys(ee.weekly).map(Number).sort((a, b) => a - b);
  if (ws.length < 2) return null;
  const vals = ws.map((w) => ee.weekly[w]!);
  let lo = min(vals), hi = max(vals);
  const pad = Math.max(12, (hi - lo) * 0.25);
  lo -= pad;
  hi += pad;
  const W = 320, H = 136, padL = 40, padR = 12, padT = 18, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const xs = plotW / Math.max(1, totalWeeks - 1);
  const yof = (p: number) => padT + ((p - lo) / (hi - lo)) * plotH;
  const s: SvgEl[] = [];
  const tickStep = hi - lo > 240 ? 60 : 30;
  for (let pv = Math.ceil(lo / tickStep) * tickStep; pv <= hi; pv += tickStep) {
    const cy = yof(pv);
    s.push(gridLine(padL, cy.toFixed(1), W - padR), axTx(padL - 5, cy + 3, d.pace(pv)));
  }
  s.push(axTx(padL, padT - 6, '↑ faster', 7, 'start'));
  let path = '';
  let prev: [number, number] | null = null;
  ws.forEach((w) => {
    const x = padL + (w - 1) * xs, y = yof(ee.weekly[w]!);
    if (prev) path += ' M' + prev[0].toFixed(1) + ',' + prev[1].toFixed(1) + ' L' + x.toFixed(1) + ',' + y.toFixed(1);
    prev = [x, y];
  });
  s.push(svgEl('path', { d: path, stroke: 'var(--run)', 'stroke-width': '1.5', 'stroke-dasharray': '3,3', fill: 'none', opacity: '0.6' }));
  ws.forEach((w) => {
    const x = (padL + (w - 1) * xs).toFixed(1), y = yof(ee.weekly[w]!).toFixed(1);
    s.push(svgEl('circle', { cx: x, cy: y, r: '4', fill: 'var(--run)', opacity: '0.9' }), svgEl('circle', { cx: x, cy: y, r: '7', fill: 'var(--run)', opacity: '0.15' }));
  });
  const lblStep = Math.ceil(totalWeeks / 7);
  for (let i = 0; i < totalWeeks; i++) if (i % lblStep === 0) s.push(axTx(padL + i * xs, H - 8, 'W' + (i + 1), 8, 'middle'));
  const drop = ee.weekly[ws[0]!]! - ee.weekly[ws[ws.length - 1]!]!;
  let foot = 'Easy and recovery runs at RPE ' + d.easyRpeLo + '–' + d.easyRpeHi + ' only, so effort is held and pace is the one free variable. ';
  foot += drop > 0
    ? 'Pace fell <b style="color:var(--run)">' + Math.round(drop) + ' sec/mi</b> at the same effort — that is aerobic fitness.'
    : 'Pace has not moved yet at this effort. Aerobic change is slow; keep the easy days easy.';
  return card(d.icon('🏃', 15) + ' Same Effort, More Speed', 'var(--run)', { svg: plain(W, H, s), foot });
}

/** The legacy buildEasyEffortEmpty: how many easy runs with an RPE the chart still needs. */
export function easyEffortEmpty(ee: EasyEffort, d: RunChartDeps): CardSpec {
  const need = d.easyMinRuns - ee.nRuns;
  return card(d.icon('🏃', 15) + ' Same Effort, More Speed', 'var(--muted)', {
    body: '<div style="font-size:12px;color:var(--muted);line-height:1.6">This chart holds effort constant so pace is the only thing that can move — it needs '
      + '<b style="color:var(--text)">' + d.easyMinRuns + '</b> easy or recovery runs logged with an RPE of ' + d.easyRpeLo + '–' + d.easyRpeHi + '. '
      + 'You have <b style="color:var(--text)">' + ee.nRuns + '</b>' + (need > 0 ? ', so ' + need + ' to go' : '') + '. Adding the RPE slider on easy days is all it takes.</div>',
  });
}

/** The legacy _fmtHMS: hours, minutes and seconds of a rounded time. */
export function fmtHMS(sec: number): string {
  const t = Math.round(sec);
  return Math.floor(t / 3600) + ':' + String(Math.floor((t % 3600) / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
}

/** The legacy buildProjectionCard: the half finish the easy pace reads to on the pace table, week by week. */
export function projectionCard(ee: EasyEffort, totalWeeks: number, intakeMileSec: number, d: RunChartDeps): CardSpec | null {
  const ws = Object.keys(ee.weekly).map(Number).sort((a, b) => a - b);
  if (ws.length < 2) return null;
  const proj: Record<number, number> = {};
  let any = false;
  ws.forEach((w) => {
    const mile = d.mileFromRecovery(ee.weekly[w]!);
    const half = mile ? d.halfFromMile(mile) : null;
    if (half) {
      proj[w] = half;
      any = true;
    }
  });
  if (!any) return null;
  const pws = Object.keys(proj).map(Number).sort((a, b) => a - b);
  if (pws.length < 2) return null;
  const claimed = intakeMileSec > 0 ? d.halfFromMile(intakeMileSec) : null;
  let vals = pws.map((w) => proj[w]!);
  if (claimed) vals = vals.concat([claimed]);
  let lo = min(vals), hi = max(vals);
  const pad = Math.max(180, (hi - lo) * 0.25);
  lo -= pad;
  hi += pad;
  const W = 320, H = 146, padL = 46, padR = 12, padT = 16, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const xs = plotW / Math.max(1, totalWeeks - 1);
  const yof = (v: number) => padT + ((v - lo) / (hi - lo)) * plotH;
  const s: SvgEl[] = [];
  for (let tv = Math.ceil(lo / 600) * 600; tv <= hi; tv += 600) {
    const cy = yof(tv);
    s.push(gridLine(padL, cy.toFixed(1), W - padR), axTx(padL - 5, cy + 3, Math.floor(tv / 3600) + ':' + String(Math.floor((tv % 3600) / 60)).padStart(2, '0')));
  }
  if (claimed) {
    const cy = yof(claimed);
    s.push(svgEl('line', { x1: padL, y1: cy.toFixed(1), x2: W - padR, y2: cy.toFixed(1), stroke: 'var(--text)', 'stroke-width': '1.2', 'stroke-dasharray': '4,3', opacity: '0.55' }));
    s.push(axTx(W - padR, cy - 5, 'your ' + d.pace(intakeMileSec) + ' mile', 8, 'end', 'var(--muted)', '700'));
  }
  let up = '', dn = '';
  pws.forEach((w) => {
    up += (padL + (w - 1) * xs).toFixed(1) + ',' + yof(proj[w]! * 0.975).toFixed(1) + ' ';
  });
  for (let i = pws.length - 1; i >= 0; i--) {
    const w = pws[i]!;
    dn += (padL + (w - 1) * xs).toFixed(1) + ',' + yof(proj[w]! * 1.025).toFixed(1) + ' ';
  }
  s.push(svgEl('polygon', { points: up + dn, fill: 'var(--hip)', opacity: '0.13' }));
  let path = '';
  let prev: [number, number] | null = null;
  pws.forEach((w) => {
    const x = padL + (w - 1) * xs, y = yof(proj[w]!);
    if (prev) path += ' M' + prev[0].toFixed(1) + ',' + prev[1].toFixed(1) + ' L' + x.toFixed(1) + ',' + y.toFixed(1);
    prev = [x, y];
  });
  s.push(svgEl('path', { d: path, stroke: 'var(--hip)', 'stroke-width': '1.5', 'stroke-dasharray': '3,3', fill: 'none', opacity: '0.7' }));
  pws.forEach((w) => s.push(svgEl('circle', { cx: (padL + (w - 1) * xs).toFixed(1), cy: yof(proj[w]!).toFixed(1), r: '3.2', fill: 'var(--hip)', opacity: '0.9' })));
  const lblStep = Math.ceil(totalWeeks / 7);
  for (let i = 0; i < totalWeeks; i++) if (i % lblStep === 0) s.push(axTx(padL + i * xs, H - 8, 'W' + (i + 1), 8, 'middle'));
  const last = proj[pws[pws.length - 1]!]!, firstP = proj[pws[0]!]!;
  const head = '<div style="font-family:var(--font-display);font-size:26px;font-weight:700;letter-spacing:-0.02em;color:var(--hip);line-height:1.1">'
    + fmtHMS(last * 0.975) + ' – ' + fmtHMS(last * 1.025) + '</div>'
    + '<div style="font-size:11px;color:var(--muted);margin-bottom:12px">projected half finish, on current easy-run fitness</div>';
  let foot = 'Read off the app’s own pace table: easy pace → mile equivalent → half finish. An estimate from training pace, not a promise — and never a reason to race a recovery run. Opened the block at <b>' + fmtHMS(firstP) + '</b>.';
  if (claimed) foot += ' The dashed line is the ' + d.pace(intakeMileSec) + ' mile you entered at signup, read through the same table.';
  return card(d.icon('🏁', 15) + ' Where This Is Heading', 'var(--hip)', { head, svg: plain(W, H, s), foot });
}

/** What plannedVsLogged returns: each week's written and logged miles. */
export type PlannedVsLogged = Record<number, { presc: number; act: number }>;

/** The legacy buildDriftChart: logged miles over or under what was written, week by week. */
export function driftChart(pv: PlannedVsLogged, totalWeeks: number, cut: number, skip1: boolean, d: RunChartDeps): CardSpec | null {
  const ws = Object.keys(pv).map(Number).sort((a, b) => a - b);
  if (ws.length < 2) return null;
  const deltas = ws.map((w) => pv[w]!.act - pv[w]!.presc);
  let lo = min(deltas.concat([0])), hi = max(deltas.concat([0]));
  const pad = Math.max(1, (hi - lo) * 0.18);
  lo -= pad;
  hi += pad;
  const W = 320, H = 128, padL = 36, padR = 10, padT = 12, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const slot = plotW / totalWeeks, barW = slot * 0.58;
  const yof = (v: number) => padT + plotH - ((v - lo) / (hi - lo)) * plotH;
  const s: SvgEl[] = [];
  const span = hi - lo, step = span > 16 ? 5 : span > 6 ? 2 : 1;
  for (let yv = Math.ceil(lo / step) * step; yv <= hi; yv += step) {
    if (Math.abs(yv) < 1e-9) continue;
    const cy = yof(yv);
    s.push(gridLine(padL, cy.toFixed(1), W - padR), axTx(padL - 5, cy + 3, (yv > 0 ? '+' : '') + yv));
  }
  const zy = yof(0);
  s.push(svgEl('line', { x1: padL, y1: zy.toFixed(1), x2: W - padR, y2: zy.toFixed(1), stroke: 'var(--border2)', 'stroke-width': '1.2' }));
  s.push(axTx(padL - 5, zy + 3, 'as written', 7, 'end', 'var(--muted)'));
  ws.forEach((w) => {
    const dl = pv[w]!.act - pv[w]!.presc;
    const x = padL + (w - 1) * slot + (slot - barW) / 2, y0 = yof(0), y1 = yof(dl);
    s.push(svgEl('rect', { x: x.toFixed(1), y: Math.min(y0, y1).toFixed(1), width: barW.toFixed(1), height: Math.max(Math.abs(y1 - y0), 1.2).toFixed(1), fill: dl >= 0 ? 'var(--run)' : 'var(--red)', opacity: '0.85' }));
  });
  const lblStep = Math.ceil(totalWeeks / 7);
  for (let i = 0; i < totalWeeks; i++) if (i % lblStep === 0) s.push(axTx(padL + i * slot + slot / 2, H - 8, 'W' + (i + 1), 8, 'middle'));
  let tp = 0, ta = 0;
  ws.forEach((w) => {
    tp += pv[w]!.presc;
    ta += pv[w]!.act;
  });
  const net = ta - tp;
  let foot = 'Written <b>' + tp.toFixed(1) + ' mi</b> · logged <b style="color:var(--run)">' + ta.toFixed(1) + ' mi</b> across ' + ws.length
    + (ws.length === 1 ? ' week' : ' weeks') + ' — <b style="color:' + (net >= 0 ? 'var(--run)' : 'var(--red)') + '">' + (net >= 0 ? '+' : '') + net.toFixed(1) + ' mi</b> net. '
    + 'Distance-prescribed runs only; time-based runs carry no written mileage to compare against.';
  if (cut) foot += ' Week ' + cut + ' is still in progress and is not counted yet.';
  if (skip1) foot += ' Week 1 was a short first week and is not counted.';
  return card(d.icon('🏃', 15) + ' Mileage — Drift From Plan', 'var(--run)', { svg: plain(W, H, s), foot });
}

/** One easy run placed against its plan (the legacy easyVsPrescribed rows). */
export interface ZoneRun {
  w: number;
  sec: number;
  tgt: number;
  cap: number;
  hot: boolean;
}

const headHtml = (col: string, head: string, sub: string) =>
  '<div style="font-family:var(--font-display);font-size:24px;font-weight:700;letter-spacing:-0.02em;color:' + col + ';line-height:1.15;margin-bottom:4px">' + head + '</div>'
  + '<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px">' + sub + '</div>';

/** The legacy buildEasyZoneChart: each easy run against the plan's ceiling and aim. */
export function easyZoneChart(runs: ZoneRun[], d: RunChartDeps): CardSpec | null {
  if (runs.length < d.easyZoneMinRuns) return null;
  const hot = runs.filter((r) => r.hot);
  const ok = hot.length === 0;
  const col = ok ? 'var(--run)' : 'var(--red)';
  const tgt = Math.round(runs.reduce((a, r) => a + r.tgt, 0) / runs.length);
  const cap = Math.round(runs.reduce((a, r) => a + r.cap, 0) / runs.length);
  const head = ok ? 'Yes — every one' : hot.length + ' of ' + runs.length + ' were too fast';
  const sub = ok
    ? 'Every easy run came in at or below the ceiling the plan set. Nothing to fix.'
    : 'The plan asks for ' + d.pace(tgt) + '/mi and sets a ceiling at ' + d.pace(cap) + '/mi. '
      + hot.length + ' run' + (hot.length > 1 ? 's' : '') + ' came in under it — faster than easy is meant to be, which '
      + 'costs the recovery those days exist for.';
  const W = 320, H = 150, padL = 40, padR = 10, padT = 22, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  let lo = min(runs.map((r) => Math.min(r.sec, r.cap))) - 40;
  let hi = max(runs.map((r) => Math.max(r.sec, r.tgt))) + 45;
  if (hi - lo < 90) {
    const mid = (hi + lo) / 2;
    lo = mid - 45;
    hi = mid + 45;
  }
  const n = runs.length, xs = plotW / Math.max(1, n - 1);
  const yof = (p: number) => padT + ((p - lo) / (hi - lo)) * plotH;
  const capY = Math.max(yof(cap), padT), tgtY = yof(tgt);
  const s: SvgEl[] = [];
  s.push(svgEl('rect', { x: padL, y: padT, width: plotW, height: Math.max(capY - padT, 0).toFixed(1), fill: 'var(--red)', opacity: '0.07' }));
  s.push(svgEl('rect', { x: padL, y: capY.toFixed(1), width: plotW, height: Math.max(padT + plotH - capY, 0).toFixed(1), fill: 'var(--run)', opacity: '0.07' }));
  s.push(svgEl('line', { x1: padL, y1: capY.toFixed(1), x2: W - padR, y2: capY.toFixed(1), stroke: 'var(--red)', 'stroke-width': '1.2', 'stroke-dasharray': '4,3', opacity: '0.75' }));
  s.push(axTx(padL + 2, padT + 9, 'too fast', 8, 'start', 'var(--red)', '700'));
  s.push(axTx(W - padR, capY - 5, 'CEILING ' + d.pace(cap), 8, 'end', 'var(--red)', '700'));
  if (tgtY > capY + 14 && tgtY < padT + plotH) {
    s.push(svgEl('line', { x1: padL, y1: tgtY.toFixed(1), x2: W - padR, y2: tgtY.toFixed(1), stroke: 'var(--run)', 'stroke-width': '1', 'stroke-dasharray': '2,3', opacity: '0.7' }));
    s.push(axTx(W - padR, tgtY + 12, 'aim ' + d.pace(tgt), 8, 'end', 'var(--run)', '700'));
  }
  for (let pv = Math.ceil(lo / 60) * 60; pv <= hi; pv += 60) s.push(axTx(padL - 5, yof(pv) + 3, d.pace(pv)));
  runs.forEach((r, i) => {
    const x = (padL + i * xs).toFixed(1), y = yof(r.sec).toFixed(1), c = r.hot ? 'var(--red)' : 'var(--run)';
    s.push(svgEl('circle', { cx: x, cy: y, r: '4', fill: c, opacity: '0.9' }), svgEl('circle', { cx: x, cy: y, r: '7.5', fill: c, opacity: '0.16' }));
  });
  const lblStep = Math.max(1, Math.ceil(n / 6));
  runs.forEach((r, i) => {
    if (i % lblStep === 0) s.push(axTx(padL + i * xs, H - 8, 'W' + r.w, 8, 'middle'));
  });
  return card(d.icon('🏃', 15) + ' Is Your Easy Actually Easy?', col, {
    head: headHtml(col, head, sub),
    svg: plain(W, H, s),
    foot: 'Each dot is one easy or recovery run. The ceiling and the aim are the plan’s own numbers for that session, not a rule invented for this chart.',
  });
}

/** What runsByClass returns: each class's logged paces. */
export type RunsByClass = Record<string, { sec: number }[] | undefined>;

/** The legacy buildEasyBandsFallback: the easy range against the hard range on one pace axis. */
export function easyBandsFallback(byClass: RunsByClass, d: RunChartDeps): CardSpec | null {
  const easy = (byClass['Easy'] || []).concat(byClass['Recovery'] || []).map((r) => r.sec);
  const hard = (byClass['Tempo'] || []).concat(byClass['Interval'] || []).map((r) => r.sec);
  if (easy.length < 2 || hard.length < 2) return null;
  const gap = min(easy) - max(hard);
  const ok = gap >= 60, col = ok ? 'var(--run)' : 'var(--red)';
  const head = ok ? 'Yes — comfortably' : 'Not really';
  const sub = ok
    ? 'Your easiest run is ' + d.pace(gap) + '/mi slower than your hardest. That separation is what lets easy days rebuild you while hard days push.'
    : 'Only ' + d.pace(Math.abs(gap)) + '/mi separates your easiest run from your hardest. Everything is landing at one medium speed — too fast to recover from, too slow to build speed.';
  const W = 320, H = 108, padL = 10, padR = 10, padT = 26;
  const plotW = W - padL - padR;
  const all = easy.concat(hard);
  const lo = min(all) - 40, hi = max(all) + 40;
  const xof = (p: number) => padL + ((p - lo) / (hi - lo)) * plotW;
  const s: SvgEl[] = [];
  for (let pv = Math.ceil(lo / 60) * 60; pv <= hi; pv += 60) {
    s.push(svgEl('line', { x1: xof(pv).toFixed(1), y1: padT - 6, x2: xof(pv).toFixed(1), y2: padT + 58, stroke: 'rgba(24,23,18,0.06)', 'stroke-width': '1' }));
    s.push(axTx(xof(pv), padT + 74, d.pace(pv), 8, 'middle'));
  }
  s.push(axTx(padL, padT - 12, '← faster', 7, 'start'));
  s.push(axTx(W - padR, padT - 12, 'slower →', 7, 'end'));
  ([['HARD', hard, 'var(--lift)'], ['EASY', easy, 'var(--run)']] as const).forEach((row, i) => {
    const y = padT + i * 30, x1 = xof(min(row[1])), x2 = xof(max(row[1]));
    s.push(svgEl('rect', { x: x1.toFixed(1), y, width: Math.max(x2 - x1, 3).toFixed(1), height: '18', fill: row[2], opacity: '0.82', rx: '1' }));
    s.push(axTx(x1 - 4, y + 13, row[0], 9, 'end', row[2], '700'));
  });
  const g1 = xof(max(hard)), g2 = xof(min(easy));
  s.push(svgEl('rect', { x: Math.min(g1, g2).toFixed(1), y: padT - 2, width: Math.max(Math.abs(g2 - g1), 2).toFixed(1), height: '64', fill: col, opacity: '0.09' }));
  s.push(axTx((g1 + g2) / 2, padT + 61, d.pace(Math.abs(gap)) + ' gap', 8, 'middle', col, '700'));
  return card(d.icon('🏃', 15) + ' Is Your Easy Actually Easy?', col, {
    head: headHtml(col, head, sub),
    svg: plain(W, H, s),
    foot: 'The two bars should not touch. The space between them is the whole point of running two different speeds.',
  });
}

/** The legacy buildPaceChart: a pace trend, faster upward, with the plan's target as a dashed line. */
export function paceChart(title: string, weeks: number[], data: (number | null)[], tgt: number | null | undefined, color: string, d: RunChartDeps): CardSpec | null {
  const valid = data.filter((v): v is number => v !== null);
  if (valid.length < 2) return null;
  const all = valid.concat(tgt ? [tgt] : []);
  let lo = min(all), hi = max(all);
  const pad = Math.max(15, (hi - lo) * 0.15);
  lo -= pad;
  hi += pad;
  const W = 320, H = 132, padL = 42, padR = 12, padT = 16, padB = 36;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = weeks.length, xStep = plotW / Math.max(n - 1, 1);
  const Y = (v: number) => padT + ((v - lo) / (hi - lo)) * plotH;
  const s: SvgEl[] = [];
  [lo, (lo + hi) / 2, hi].forEach((yv) => {
    const cy = Y(yv);
    s.push(gridLine(padL, cy.toFixed(1), W - padR));
    s.push(svgEl('text', { x: padL - 4, y: (cy + 4).toFixed(1), fill: 'rgba(24,23,18,0.3)', 'font-size': '8', 'text-anchor': 'end', 'font-family': 'Helvetica Neue,Helvetica,Geist,sans-serif' }, d.pace(yv)));
  });
  if (tgt) {
    const ty = Y(tgt);
    s.push(svgEl('line', { x1: padL, y1: ty.toFixed(1), x2: W - padR, y2: ty.toFixed(1), stroke: color, 'stroke-width': '1', 'stroke-dasharray': '2,4', opacity: '0.55' }));
    s.push(svgEl('text', { x: W - padR - 2, y: (ty - 3).toFixed(1), 'font-size': '7.5', fill: color, 'text-anchor': 'end', opacity: '0.85' }, 'PLAN ' + d.pace(tgt) + '/mi'));
  }
  let path = '';
  let prev: { x: number; y: number } | null = null;
  let lastPt: { x: number; y: number; v: number } | null = null;
  const dots: SvgEl[] = [];
  data.forEach((v, i) => {
    if (v === null) {
      prev = null;
      return;
    }
    const x = padL + i * xStep, y = Y(v);
    if (prev) path += ' M' + prev.x.toFixed(1) + ',' + prev.y.toFixed(1) + ' L' + x.toFixed(1) + ',' + y.toFixed(1);
    prev = { x, y };
    lastPt = { x, y, v };
    dots.push(svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: '3.5', fill: color }));
  });
  if (path) s.push(svgEl('path', { d: path, stroke: color, 'stroke-width': '1.5', 'stroke-dasharray': '1,3', fill: 'none' }));
  s.push(...dots);
  const lp = lastPt as { x: number; y: number; v: number } | null;
  if (lp) s.push(svgEl('text', { x: lp.x.toFixed(1), y: (lp.y - 8).toFixed(1), 'font-size': '8', 'font-weight': '700', fill: color, 'text-anchor': 'middle' }, d.pace(lp.v)));
  const xLabelStep = n <= 8 ? 1 : n <= 16 ? 2 : 4;
  weeks.forEach((w, i) => {
    if (i % xLabelStep !== 0) return;
    s.push(svgEl('text', { x: (padL + i * xStep).toFixed(1), y: H - padB + 14, 'font-size': '8', fill: 'rgba(24,23,18,0.35)', 'text-anchor': 'middle', 'font-family': 'Helvetica Neue,Helvetica,Geist,sans-serif' }, 'W' + w));
  });
  s.push(svgEl('text', { x: (padL + plotW / 2).toFixed(1), y: H - 4, 'font-size': '8', fill: 'rgba(24,23,18,0.45)', 'text-anchor': 'middle' }, 'higher = faster easy pace · dashed = plan target'));
  return { title, color, titleGap: 10, head: null, svg: plain(W, H, s), body: null, foot: null };
}
