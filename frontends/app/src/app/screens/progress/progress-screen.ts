import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { ChartCard } from './charts/chart-card';
import type { CardSpec } from './charts/chart-card-model';
import { DotChart } from './charts/dot-chart';
import { LedgerCards } from './charts/ledger-cards';
import { ProgramChips } from './program-chips';
import { type ChipsView, chipsView } from './program-chips-model';
import type { LedgerView } from './charts/ledger-model';
import type { DotSpec } from './charts/dot-chart-model';
import {
  CALC_LIFTS, chartChunks, estimate1RM, journalWeeks, viewedProgram, weeklySums,
} from './progress-model';

/** A journal entry with its markup made ready for the page. */
interface EntryView {
  day: string;
  headStyle: string;
  rpe: { text: string; style: string } | null;
  swap: { html: SafeHtml; style: string } | null;
  jog: { lines: SafeHtml[]; style: string } | null;
  notes: SafeHtml | null;
}

/** One render of the screen. A new object each time, so the template draws the body anew, as the legacy write did. */
interface ScreenView {
  chips: ChipsView;
  trash: string;
  /** 'none' before anything is logged, 'charts' when there is nothing to chart, null when there is. */
  empty: 'none' | 'charts' | null;
  emptyIcon: SafeHtml;
  charts: ({ kind: 'dot'; spec: DotSpec } | { kind: 'card'; spec: CardSpec } | { kind: 'ledger'; view: LedgerView })[];
  journal: { title: SafeHtml; caret: SafeHtml; weeks: { week: number; open: boolean; count: string; entries: EntryView[] }[] } | null;
  estimator: { title: SafeHtml } | null;
}

/**
 * The Progress screen's body (architecture phase E, step 13), in place of the legacy renderProgressScreen inside
 * #progressBody. It takes over renderProgressScreen through LegacyBridge.provide (the tab, the program chips, the
 * restore and delete bar all call it). The arrangement, the weekly sums, the Session Journal and the 1RM estimator are
 * the component's, and so are the weekly dot charts (DotChart, step 14), the run charts (ChartCard, step 15) and the
 * Lift Ledger (LedgerCards, step 16), and the program chips and the archived bar (ProgramChips, step 17). The estimator's lift is still the legacy `calcLift`.
 */
@Component({
  selector: 'ia-progress-screen',
  host: { style: 'display: contents' },
  imports: [ChartCard, DotChart, LedgerCards, ProgramChips],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @for (v of views(); track v) {
    <ia-program-chips [view]="v.chips" [trashIcon]="v.trash" />
    @if (v.empty) {
      <div style="text-align:center;padding:60px 20px;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:16px" [innerHTML]="v.emptyIcon"></div>
        <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px">No data yet</div>
        <div style="font-size:13px;line-height:1.6">{{ v.empty === 'none' ? 'Start logging your sessions and your progress will appear here as dotted line charts.' : 'Log sessions to see progress charts, exercise history, and your training journal here.' }}</div>
      </div>
    }
    @for (c of v.charts; track $index) {
      @switch (c.kind) {
        @case ('dot') { <ia-dot-chart [spec]="c.spec" /> }
        @case ('card') { <ia-chart-card [spec]="c.spec" /> }
        @case ('ledger') { <ia-ledger-cards [view]="c.view" /> }
      }
    }
    @if (v.journal; as j) {
      <div style="background:var(--surface);border:1px solid transparent;border-radius:16px;padding:14px 16px">
        <div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0;color:var(--muted);margin-bottom:12px" [innerHTML]="j.title"></div>
        @for (wk of j.weeks; track wk.week) {
          <details class="journal-week" [attr.open]="wk.open ? '' : null">
            <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0;color:var(--muted)">
              <span>Week {{ wk.week }}</span>
              <span style="display:flex;align-items:center;gap:7px;font-size:10px;letter-spacing:0;opacity:0.75">{{ wk.count }}<span class="journal-caret" style="display:inline-flex" [innerHTML]="j.caret"></span></span>
            </summary>
            <div style="padding:2px 0 8px">
              @for (e of wk.entries; track $index) {
                <div style="background:var(--surface2);border-radius:16px;padding:10px 12px;margin-bottom:6px">
                  <div [attr.style]="e.headStyle">
                    <div style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--text)">{{ e.day }}</div>
                    @if (e.rpe; as r) {<div [attr.style]="r.style">{{ r.text }}</div>}
                  </div>
                  @if (e.swap; as s) {<div [attr.style]="s.style" [innerHTML]="s.html"></div>}
                  @if (e.jog; as g) {<div [attr.style]="g.style">@for (l of g.lines; track $index) {<div style="font-size:12px;font-weight:500;color:var(--run);line-height:1.5" [innerHTML]="l"></div>}</div>}
                  @if (e.notes) {<div style="font-size:12px;color:var(--muted);line-height:1.5;font-style:italic" [innerHTML]="e.notes"></div>}
                </div>
              }
            </div>
          </details>
        }
      </div>
    }
    @if (v.estimator; as est) {
      <details style="background:var(--surface);border:1px solid transparent;border-radius:16px;padding:0 16px;margin-top:4px">
        <summary style="cursor:pointer;padding:14px 0;font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0;color:var(--muted)" [innerHTML]="est.title"></summary>
        <div style="padding-bottom:14px">
          <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:10px">Optional — estimate a one-rep max from any recent set, just for your own records. Your training still runs on RPE.</div>
          <div style="display:flex;gap:0;background:var(--surface2);border:1px solid var(--border2);border-radius:16px;overflow:hidden;margin-bottom:10px">@for (n of lifts; track n; let i = $index) {<button type="button" [id]="'calcLift_' + n" (click)="setLift(n, w.value, r.value)" [attr.style]="liftStyle(n, i)">{{ n }}</button>}</div>
          <div class="input-row" style="margin-bottom:10px">
            <div class="input-group"><div class="input-label">Weight</div><input #w type="number" class="input-field" id="calc_weight" placeholder="e.g. 185" (input)="calc(w.value, r.value)"></div>
            <div class="input-group"><div class="input-label">Reps</div><input #r type="number" class="input-field" id="calc_reps" placeholder="e.g. 5" (input)="calc(w.value, r.value)"></div>
          </div>
          <div id="calc_result" style="font-size:13px;color:var(--muted);min-height:20px;line-height:1.5">@if (result(); as c) {<b style="color:var(--accent)">Estimated {{ c.lift }} 1RM: {{ c.est }} {{ c.unit }}</b>&ngsp;<span style="color:var(--muted)">— for your reference; the app coaches by RPE.</span>}</div>
        </div>
      </details>
    }
  }
  `,
})
export class ProgressScreen {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly lifts = CALC_LIFTS;
  private readonly view = signal<ScreenView | null>(null);
  protected readonly views = computed(() => {
    const v = this.view();
    return v ? [v] : [];
  });
  protected readonly lift = signal('Deadlift');
  protected readonly result = signal<{ lift: string; est: number; unit: string } | null>(null);

  constructor() {
    this.bridge.provide('renderProgressScreen', () => this.render());
  }

  protected liftStyle(n: string, i: number): string {
    const on = this.lift() === n;
    return 'flex:1;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0;padding:9px;border:none;'
      + (i ? 'border-left:1px solid var(--border2);' : '') + 'cursor:pointer;background:' + (on ? 'var(--accent)' : 'transparent') + ';color:' + (on ? 'var(--on-ink)' : 'var(--muted)');
  }

  /** The legacy setCalcLift: the lift is the legacy `calcLift`, then the estimate again. */
  protected setLift(n: string, weight: string, reps: string): void {
    this.bridge.call('_setCalcLift', n);
    this.lift.set(n);
    this.calc(weight, reps);
  }

  /** The legacy runCalc: the estimate in the active program's unit, else the wizard's, else pounds. */
  protected calc(weight: string, reps: string): void {
    const est = estimate1RM(weight, reps);
    if (est === null) {
      this.result.set(null);
    } else {
      const prog = this.bridge.global('activeProg');
      const unit = (prog && prog.cfg && prog.cfg.unit) || (this.bridge.global('WD') as { unit?: string }).unit || 'lbs';
      this.result.set({ lift: this.bridge.global('calcLift'), est, unit });
    }
    this.cdr.detectChanges();
  }

  private html(s: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(s);
  }
  private icon(name: string, size: number): string {
    return this.bridge.call('asyIcon', name, size);
  }

  /** The legacy renderProgressScreen, drawn at once. */
  private render(): void {
    const b = this.bridge;
    const all = b.call('getPrograms');
    if (!document.getElementById('progressBody') || !all.length) return;
    const { prog, reset } = viewedProgram(all, b.global('progressViewId'), b.global('activeProgId'), !!b.global('activeProg'));
    if (reset) b.call('_setProgressViewId', null);
    if (!prog) return;
    const vid = prog.id;
    const chips = chipsView(all, vid, {
      activeId: b.global('activeProgId'),
      confirmId: b.global('confirmProgId'),
      confirmTier: b.global('confirmTier'),
      warnsCrossProg: (id) => b.call('_purgeWarnsCrossProg', id),
      icon: (n, s) => this.icon(n, s),
    });
    const trash = this.icon('trash', 16);

    const exw = b.call('getExWeightsFor', vid);
    const folded = b.call('foldExAliasKeys', exw);
    const deduped = b.call('dedupeExDayEntries', exw);
    if (folded || deduped) b.call('saveExWeightsFor', vid, exw);

    const logs = b.call('getLogsFor', vid);
    const cfg = prog.cfg || {};
    const totalWeeks = prog.totalWeeks || 6;
    const sums = weeklySums(logs, b.call('getExWeightsFor', vid), totalWeeks);
    this.lift.set(b.global('calcLift'));
    this.result.set(null);
    const emptyIcon = this.html(this.icon('📊', 44));

    if (!Object.keys(logs).length) {
      this.view.set({ chips, trash, empty: 'none', emptyIcon, charts: [], journal: null, estimator: null });
      this.cdr.detectChanges();
      return;
    }

    const hist = b.call('getDayHistFor', vid);
    const goalId = (cfg.cardioGoals && cfg.cardioGoals.run && cfg.cardioGoals.run.id) || '';
    const charts = chartChunks({
      logs, hist, sums, totalWeeks, cfg,
      cardioTypes: cfg.cardioTypes || [],
      cut: b.call('_cutWeek', prog),
      skip1: b.call('_partialWeek1', prog),
      raceMi: (b.global('RACE_DIST_MI') as Record<string, number>)[goalId] || 0,
    }, {
      icon: (n, s) => this.icon(n, s),
      ladderWeekly: (...a) => b.call('ladderWeekly', ...a),
      easyVsPrescribed: (...a) => b.call('easyVsPrescribed', ...a),
      runsByClass: (...a) => b.call('runsByClass', ...a),
      easyEffortWeekly: (...a) => b.call('easyEffortWeekly', ...a),
      recoveryPaceWeekly: (...a) => b.call('recoveryPaceWeekly', ...a),
      plannedVsLogged: (...a) => b.call('plannedVsLogged', ...a),
      exWeights: () => b.call('getExWeightsFor', vid),
      ledgerModel: (...a) => b.call('ledgerModel', ...a),
      run: {
        pace: (sec) => b.call('_fmtPaceShort', sec),
        icon: (n, s) => this.icon(n, s),
        mileFromRecovery: (sec) => b.call('_mileFromRecoverySec', sec),
        halfFromMile: (sec) => b.call('_halfFromMileSec', sec),
        easyRpeLo: b.global('EASY_RPE_LO'),
        easyRpeHi: b.global('EASY_RPE_HI'),
        easyMinRuns: b.global('EASY_MIN_RUNS'),
        easyZoneMinRuns: b.global('EASY_ZONE_MIN_RUNS'),
      },
    });
    const labels = b.global('RPE_LABELS');
    const weeks = journalWeeks(b.call('getLogsFor', vid), {
      rpeLabel: (r) => labels[r],
      jogLines: (rl) => b.call('restLogLines', rl),
      icon: (n, s) => this.icon(n, s),
    });
    const journal = weeks.length
      ? {
        title: this.html(this.icon('📓', 15) + ' Session Journal'),
        caret: this.html(this.icon('chevronDown', 14)),
        weeks: weeks.map((wk) => ({
          week: wk.week, open: wk.open, count: wk.count,
          entries: wk.entries.map((e): EntryView => ({
            day: e.day,
            headStyle: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:' + e.headMb + 'px',
            rpe: e.rpe ? { text: e.rpe.text, style: 'font-family:var(--font-display);font-size:12px;font-weight:700;color:' + e.rpe.color } : null,
            swap: e.swap
              ? { html: this.html(e.swap.html), style: 'display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--accent);background:rgba(var(--ink-rgb),0.06);border-radius:3px;padding:3px 7px;margin-bottom:' + e.swap.mb + 'px' }
              : null,
            jog: e.jogLines.length ? { lines: e.jogLines.map((l) => this.html(l)), style: 'margin-bottom:' + e.jogMb + 'px' } : null,
            notes: e.notes ? this.html(e.notes) : null,
          })),
        })),
      }
      : null;
    const empty = !charts.some((c) => c.kind !== 'ledger' || c.view.mains || c.view.ladder || c.view.other) && !journal ? 'charts' : null;
    this.view.set({
      chips, trash, empty, emptyIcon,
      charts,
      journal,
      estimator: { title: this.html(this.icon('🧮', 15) + ' 1RM Estimator') },
    });
    this.cdr.detectChanges();
  }
}
