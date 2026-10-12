import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { type GoalChoice, type GoalDraft, type GoalSheetView, goalSheetView } from './goal-sheet-model';

/** A stored program, as far as the sheet reads it. */
interface GoalProgram {
  id: string;
  startDate?: string | null;
  cfg?: { primaryPath?: string; cardioGoals?: Record<string, { id?: string; label?: string } | undefined> };
}

/**
 * The change-a-goal sheet's body (architecture phase E, step 7), in place of the legacy renderGoalSheet inside
 * #goalBody (the sheet's frame and its Back button stay the legacy markup). The draft stays the legacy `_goalDraft`,
 * and choosing a goal, typing its targets and committing are still the legacy selectGoalOpt, _goalSetInput and
 * commitGoalChange. renderGoalSheet (on opening and on each pick) and _goalRefreshCommit (on each keystroke, which
 * redraws only the commit button, so a typed field keeps its caret) reach the component through LegacyBridge.provide.
 * The body draws at once when asked, before the sheet opens, as the legacy writes did. The decision panel is drawn anew
 * on every pick (tracked by the object itself), so a field typed for one goal never shows under the next, whose draft
 * starts empty, as the legacy innerHTML write cleared it.
 */
@Component({
  selector: 'ia-goal-sheet',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (view(); as v) {
    <div class="det-label" style="font-size:14px;letter-spacing:1px;margin-bottom:4px">{{ v.heading }}</div>
    <div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:14px">Weeks you already trained stay on the books. The rest of the program rebuilds around the new goal.</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      @for (o of v.options; track o.id) {
        <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy option row, kept as it was -->
        <div [class]="'goal-option' + (o.selected ? ' selected' : '')" [attr.style]="o.current ? 'opacity:0.55;cursor:default' : null" (click)="pick(o.id, o.current)">
          <div class="goal-option-label" style="display:flex;justify-content:space-between;align-items:center">{{ o.label }}@if (o.current) {<span style="font-size:10px;letter-spacing:1px;color:var(--muted);font-weight:400">CURRENT</span>}</div>
          <div class="goal-option-desc">{{ o.desc }}@if (!o.current && o.up) {<br><span style="color:var(--accent)">Bigger goal than your current build.</span>}</div>
        </div>
      }
    </div>
    @for (d of decisions(); track d) {
      <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:14px">
        <div [attr.style]="'font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:0.03em;color:' + (d.up ? 'var(--accent)' : 'var(--text)')">{{ d.title }}</div>
        <div style="font-size:13px;color:var(--text);line-height:1.5;margin-top:6px">{{ d.body }}</div>
        @if (d.inputs === 'pace') {
          <div style="margin-top:10px"><div style="font-size:11px;color:var(--muted);margin-bottom:5px">Target distance and time. The engine will not guess these for you.</div><div style="display:flex;gap:6px;align-items:center"><input type="number" class="input-field" style="flex:1" placeholder="dist e.g. 1.5" [value]="d.values.targetDist" min="0.1" step="0.1" (input)="type('targetDist', $event)"><select class="input-field" style="flex:0 0 64px" (change)="type('paceUnit', $event)"><option value="mi" [selected]="d.values.paceUnit === 'mi'">mi</option><option value="km" [selected]="d.values.paceUnit === 'km'">km</option></select><input type="number" class="input-field" style="flex:0 0 58px;text-align:center" placeholder="min" min="0" max="99" [value]="d.values.targetMins" (input)="type('targetMins', $event)"><input type="number" class="input-field" style="flex:0 0 58px;text-align:center" placeholder="sec" min="0" max="59" [value]="d.values.targetSecs" (input)="type('targetSecs', $event)"></div></div>
        } @else if (d.inputs === 'time') {
          <div style="margin-top:10px"><div style="font-size:11px;color:var(--muted);margin-bottom:5px">Target time. The engine will not guess this for you.</div><div style="display:flex;gap:6px"><input type="number" class="input-field" style="flex:1;text-align:center" placeholder="min" min="0" max="99" [value]="d.values.targetMins" (input)="type('targetMins', $event)"><input type="number" class="input-field" style="flex:1;text-align:center" placeholder="sec" min="0" max="59" [value]="d.values.targetSecs" (input)="type('targetSecs', $event)"></div></div>
        }
        <div style="display:flex;gap:8px;margin-top:14px">
          @if (d.up) {
            <button class="prog-action-btn primary" style="flex:1" (click)="keep()">{{ d.keepLabel }}</button><button id="goalCommitBtn" class="prog-action-btn" style="flex:1;border-color:var(--accent);color:var(--accent)" [style.opacity]="ok() ? '1' : '0.4'" [style.pointer-events]="ok() ? 'auto' : 'none'" (click)="commit()">{{ d.commitLabel }}</button>
          } @else {
            <button id="goalCommitBtn" class="prog-action-btn primary" style="flex:1" [style.opacity]="ok() ? '1' : '0.4'" [style.pointer-events]="ok() ? 'auto' : 'none'" (click)="commit()">{{ d.commitLabel }}</button><button class="prog-action-btn" style="flex:1" (click)="keep()">{{ d.keepLabel }}</button>
          }
        </div>
      </div>
    }
  }
  `,
})
export class GoalSheet {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly view = signal<GoalSheetView | null>(null);
  protected readonly ok = signal(true);
  protected readonly decisions = computed(() => {
    const d = this.view()?.decision;
    return d ? [d] : [];
  });

  constructor() {
    this.bridge.provide('renderGoalSheet', () => this.render());
    this.bridge.provide('_goalRefreshCommit', () => {
      this.ok.set(this.bridge.call<boolean>('_goalInputsValid'));
      this.cdr.detectChanges();
    });
  }

  protected pick(id: string, current: boolean): void {
    if (!current) this.bridge.call('selectGoalOpt', id);
  }
  protected type(key: string, e: Event): void {
    this.bridge.call('_goalSetInput', key, (e.target as HTMLInputElement | HTMLSelectElement).value);
  }
  protected commit(): void {
    this.bridge.call('commitGoalChange');
  }
  protected keep(): void {
    this.bridge.call('closeGoalSheet');
  }

  /** The legacy renderGoalSheet: drawn at once, the commit button's state with it. */
  private render(): void {
    const draft = this.bridge.global<GoalDraft>('_goalDraft');
    const p = this.bridge.call<GoalProgram[]>('getPrograms').find((x) => x.id === draft.progId);
    if (!p) {
      this.view.set(null);
    } else {
      const sport = draft.sport || '';
      const labels = this.bridge.global<Record<string, string>>('_CARDIO_LABELS');
      const week = this.bridge.call<number>('_goalCurWeek', p);
      this.view.set(goalSheetView({
        draft,
        sportLabel: labels[sport] || sport,
        current: (p.cfg && p.cfg.cardioGoals && p.cfg.cardioGoals[sport]) || null,
        path: p.cfg && p.cfg.primaryPath,
        choices: this.bridge.global<Record<string, GoalChoice[]>>('CARDIO_GOALS_BY_TYPE')[sport] || [],
        excluded: this.bridge.global<Set<string>>('HYBRID_EXCLUDED_GOALS'),
        rank: this.bridge.global<Record<string, number>>('_GOAL_RANK'),
        needsInputs: this.bridge.global<Set<string>>('_GOAL_REQ_INPUTS'),
        started: !!p.startDate && week > 1,
        week,
      }));
    }
    this.ok.set(this.bridge.call<boolean>('_goalInputsValid'));
    this.cdr.detectChanges();
  }
}
