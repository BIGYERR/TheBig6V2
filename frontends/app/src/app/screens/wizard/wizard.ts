import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import {
  type Choice, daysView, equipmentChoices, LIFT_LABELS, type LiftOption, liftingView, MOVED_STEPS, nameSummary, primaryChoices, profileView,
  unitStyle, type WizardDraft, wizardShell, WIZARD_STEPS,
} from './wizard-model';

/** The name step: the name, the start (derived on a race-aligned program), and the summary. */
interface NameView {
  name: string;
  startDate: string;
  aligned: { start: string; warn: boolean; copy: string; pips: string } | null;
  rows: { k: string; v: string }[];
}

/** One render of a moved step. */
type StepView =
  | { step: 'primary'; choices: Choice[] }
  | { step: 'profile'; profile: ReturnType<typeof profileView> }
  | { step: 'equipment'; choices: Choice[] }
  | { step: 'lifting_focus'; lifting: ReturnType<typeof liftingView> }
  | { step: 'days'; days: ReturnType<typeof daysView> }
  | { step: 'name'; name: NameView };

/**
 * The new-program wizard (architecture phase E, step 19), in place of the legacy #screenWizard markup and the
 * renderWizardStep that drew into it. It takes over renderWizardStep through LegacyBridge.provide. The shell (Back, the
 * progress bar, the step count, the next button) and the moved steps (MOVED_STEPS: all but the cardio goal) are the
 * component's; a step not yet moved is still drawn by the legacy renderWizardStep, captured before it was replaced,
 * into a #wizardBody of its own, so neither ever writes into the other's. The name step's start date repaints only its
 * explanation and its summary row on a change (updateStartResolve, provided), so the native date picker stays open. The draft is still the
 * legacy `WD`, the step the legacy `wizardStep`, and moving between steps the legacy wizardBack and wizardNext.
 */
@Component({
  selector: 'ia-wizard',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="wizard-bar">
    <button class="wizard-back" (click)="call('wizardBack')">← Back</button>
    <div class="wizard-progress"><div class="wizard-progress-fill" id="wizardFill" [style.width]="shell().fill"></div></div>
    <div class="wizard-step-label" id="wizardStepLabel" [textContent]="shell().label"></div>
  </div>
  @if (view(); as v) {
    <div class="wizard-body" id="wizardBody">
      @switch (v.step) {
        @case ('primary') {
          @if (v.step === 'primary') {
            <div class="wizard-title">What are you training for?</div>
            <div class="wizard-subtitle">This shapes everything! Program length, lifting focus, and cardio structure.</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              @for (p of v.choices; track p.id) {
                <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy option card, kept as it was -->
                <div [class]="'option-card' + (p.sel ? ' selected' : '')" (click)="set('primaryPath', p.id)" style="display:flex;align-items:center;gap:14px;text-align:left;padding:14px 16px">
                  <div style="flex-shrink:0" [innerHTML]="icon(p.icon, 30)"></div>
                  <div><div class="option-label">{{ p.label }}</div><div class="option-desc">{{ p.desc }}</div><div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">{{ p.detail }}</div></div>
                </div>
              }
            </div>
          }
        }
        @case ('profile') {
          @if (v.step === 'profile') {
            <div class="wizard-title">About you</div>
            <div class="wizard-subtitle">Calibrates volume, intensity, and program length to your fitness level.</div>
            <div class="input-label" style="margin-bottom:8px">Training experience</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
              @for (e of v.profile.experience; track e.id) {
                <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy option card, kept as it was -->
                <div [class]="'option-card' + (e.sel ? ' selected' : '')" (click)="set('experience', e.id)" style="display:flex;align-items:center;gap:12px;text-align:left;padding:12px 14px">
                  <div style="flex-shrink:0" [innerHTML]="icon(e.icon, 26)"></div>
                  <div><div class="option-label">{{ e.label }}</div><div class="option-desc">{{ e.desc }}</div></div>
                </div>
              }
            </div>
            <div class="input-label" style="margin-bottom:8px">Age range</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
              @for (a of v.profile.age; track a.id) {
                <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy option card, kept as it was -->
                <div [class]="'option-card' + (a.sel ? ' selected' : '')" (click)="set('ageBracket', a.id)" style="text-align:center;padding:14px 8px">
                  <div style="margin-bottom:4px" [innerHTML]="icon(a.icon, 24)"></div>
                  <div class="option-label">{{ a.label }}</div>
                </div>
              }
            </div>
            <div class="input-label" style="margin-bottom:8px">Units</div>
            <div style="display:flex;gap:0;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;overflow:hidden;margin-bottom:16px">
              <button (click)="call('setUnit', 'lbs')" [attr.style]="unit(!v.profile.kg)">LBS</button>
              <button (click)="call('setUnit', 'kg')" [attr.style]="unit(v.profile.kg)">KG</button>
            </div>
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:12px 14px;font-size:12px;color:var(--muted);line-height:1.8">
              <div><b style="color:var(--accent)">Experience:</b>{{ ' ' + v.profile.expHint }}</div>
              <div style="margin-top:6px"><b style="color:var(--accent)">{{ v.profile.ageLabel }}</b>{{ ' ' + v.profile.ageHint }}</div>
            </div>
          }
        }
        @case ('equipment') {
          @if (v.step === 'equipment') {
            <div class="wizard-title">Your equipment</div>
            <div class="wizard-subtitle">The program only prescribes exercises you can actually do.</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              @for (e of v.choices; track e.id) {
                <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy equipment card, kept as it was -->
                <div [class]="'cardio-type-card' + (e.sel ? ' selected' : '')" (click)="set('equipment', e.id)">
                  <div class="cardio-type-icon" [innerHTML]="icon(e.icon, 26)"></div>
                  <div style="flex:1"><div class="cardio-type-name" [style.color]="e.sel ? 'var(--accent)' : 'var(--text)'">{{ e.label }}</div><div class="cardio-type-desc">{{ e.desc }}</div></div>
                  <div class="cardio-check" [style.opacity]="e.sel ? 1 : 0">✓</div>
                </div>
              }
            </div>
          }
        }
        @case ('lifting_focus') {
          @if (v.step === 'lifting_focus') {
            <div class="wizard-title">Lifting focus</div>
            <div class="wizard-subtitle">{{ v.lifting.subtitle }}</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              @for (o of v.lifting.choices; track o.id) {
                <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy option card, kept as it was -->
                <div [class]="'option-card' + (o.sel ? ' selected' : '')" (click)="set('liftingFocus', o.id)" style="display:flex;align-items:center;gap:14px;text-align:left;padding:14px 16px">
                  <div style="flex-shrink:0" [innerHTML]="icon(o.icon, 28)"></div>
                  <div><div class="option-label">{{ o.label }}</div><div class="option-desc">{{ o.desc }}</div></div>
                </div>
              }
            </div>
            @if (v.lifting.addOn; as a) {
              <div style="margin-top:12px;background:var(--surface);border:1px solid var(--border2);border-radius:4px;overflow:hidden">
                <div style="padding:10px 14px;font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)">Optional cardio add-on</div>
                <div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px">
                  @for (t of a.sports; track t.id) {
                    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy sport card, kept as it was -->
                    <div [class]="'cardio-type-card' + (t.sel ? ' selected' : '')" (click)="call('toggleCardioTypeSport', t.id)" style="padding:10px 14px">
                      <div style="flex-shrink:0" [innerHTML]="icon(t.icon, 22)"></div>
                      <div style="flex:1"><div class="cardio-type-name" [attr.style]="'color:' + (t.sel ? 'var(--accent)' : 'var(--text)') + ';font-size:14px'">{{ t.label }}</div></div>
                      <div class="cardio-check" [style.opacity]="t.sel ? 1 : 0">✓</div>
                    </div>
                  }
                  <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy sport card, kept as it was -->
                  <div [class]="'cardio-type-card' + (a.liftOnly ? ' selected' : '')" (click)="liftOnly()" style="padding:10px 14px">
                    <div style="flex-shrink:0" [innerHTML]="icon('dumbbell', 22)"></div>
                    <div style="flex:1"><div class="cardio-type-name" [attr.style]="'color:' + (a.liftOnly ? 'var(--accent)' : 'var(--text)') + ';font-size:14px'">Lift Only</div></div>
                    <div class="cardio-check" [style.opacity]="a.liftOnly ? 1 : 0">✓</div>
                  </div>
                </div>
              </div>
            }
          }
        }
        @case ('days') {
          @if (v.step === 'days') {
            <div class="wizard-title">Rest days</div>
            <div class="wizard-subtitle">All days are training days by default. Tap to mark as rest.</div>
            <div class="day-grid">
              @for (x of v.days.days; track x.key) {
                <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy day toggle, kept as it was -->
                <div [class]="'day-toggle' + (x.rest ? ' rest' : '')" [attr.style]="x.blocked ? 'opacity:0.5;' : ''" (click)="call('toggleRestDay', x.key)"><div style="line-height:1">{{ x.short }}</div>@if (x.rest) {<div style="font-size:9px;margin-top:2px;opacity:0.5">✕</div>} @else if (x.blocked) {<div style="font-size:9px;margin-top:2px;opacity:0.6" [innerHTML]="icon('🔒', 10)"></div>}</div>
              }
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:6px">{{ 'Gold = training · Grey = rest · ' }}<b style="color:var(--text)">{{ v.days.count }}</b>{{ ' selected' }}</div>
            @if (v.days.floor; as f) {
              <div style="margin-top:10px;background:rgba(24,23,18,0.12);border:1px solid rgba(24,23,18,0.35);border-radius:4px;padding:12px 14px">
                <div style="font-size:13px;color:var(--accent);font-weight:700;line-height:1.5;margin-bottom:4px" [innerHTML]="lockTitle()"></div>
                <div style="font-size:12px;color:var(--text);line-height:1.5">@if (f.reason) {{{ 'Your ' }}<b>{{ f.reason }}</b>{{ ' goal needs at least ' }}<b>{{ f.min + ' training days a week' }}</b>{{ ' to build the volume safely and avoid injury. To add more rest, ease your goal or pick a shorter distance.' }}} @else {Three days a week is the floor, cardio or no cardio. Two gives you the same session twice with nowhere to put the hard work. Three is where real training days start.}</div>
              </div>
            }
            @if (v.days.advisories.length) {
              <div style="margin-top:10px;background:rgba(24,23,18,0.10);border:1px solid rgba(24,23,18,0.28);border-radius:4px;padding:11px 14px;display:flex;flex-direction:column;gap:8px">@for (a of v.days.advisories; track $index) {<div style="font-size:12px;color:var(--accent);line-height:1.5" [innerHTML]="html(a)"></div>}</div>
            }
          }
        }
        @case ('name') {
          @if (v.step === 'name') {
            <div class="wizard-title">Name your program</div>
            <div class="wizard-subtitle">Give it something you will recognize, and tell it when to begin.</div>
            <div class="input-group"><div class="input-label">Program name</div><input type="text" class="input-field" [value]="v.name.name" (input)="setName($event)" maxlength="40"></div>
            @if (v.name.aligned; as al) {
              <div class="input-group"><div class="input-label">Start date</div><div class="input-field derived"><span>{{ al.start }}</span><span class="src">set by race date</span></div><div [class]="'start-resolve' + (al.warn ? ' warn' : '')" id="startResolve" [innerHTML]="html(al.copy)"></div>@if (al.pips) {<span style="display:contents" [innerHTML]="html(al.pips)"></span>}</div>
            } @else {
              <div class="input-group"><div class="input-label">Start date</div><input type="date" class="input-field" id="wizStartDate" [value]="v.name.startDate" (change)="setStart($event)"><div class="start-resolve" id="startResolve" [innerHTML]="html(resolveCopy())"></div></div>
            }
            <div class="summary-block">
              <div class="summary-block-header">Program Summary</div>
              @for (r of rows(); track $index) {<div class="summary-row"><span class="summary-key">{{ r.k }}</span><span class="summary-val" [innerHTML]="html(r.v)"></span></div>}
            </div>
          }
        }
      }
    </div>
  } @else {
    <div class="wizard-body" id="wizardBody"></div>
  }
  <button class="wizard-next" id="wizardNext" (click)="call('wizardNext')" [textContent]="shell().next"></button>
  `,
})
export class Wizard {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  /** The legacy renderWizardStep, kept for the steps not yet moved. */
  private readonly legacyRender: () => void;
  protected readonly shell = signal<{ fill: string | null; label: string; next: string }>({ fill: null, label: '1 / 6', next: 'Continue →' });
  protected readonly view = signal<StepView | null>(null);
  protected readonly unit = unitStyle;
  /** The name step's start explanation and summary rows, repainted alone when the start date changes. */
  protected readonly resolveCopy = signal('');
  protected readonly rows = signal<{ k: string; v: string }[]>([]);
  private readonly icons = new Map<string, SafeHtml>();
  private readonly safe = new Map<string, SafeHtml>();
  /** What the name step's summary was built from, so a start date change rebuilds only the start row. */
  private nameInput: Parameters<typeof nameSummary>[1] | null = null;

  constructor() {
    this.legacyRender = this.bridge.global<() => void>('renderWizardStep');
    this.bridge.provide('renderWizardStep', () => this.render());
    this.bridge.provide('updateStartResolve', () => this.updateStart());
  }

  /** Markup from the legacy helpers, made ready for the page once per string. */
  protected html(s: string): SafeHtml {
    let h = this.safe.get(s);
    if (!h) {
      h = this.sanitizer.bypassSecurityTrustHtml(s);
      this.safe.set(s, h);
    }
    return h;
  }
  protected lockTitle(): SafeHtml {
    return this.html(this.bridge.call<string>('asyIcon', '🔒', 13) + ' You\'re at your minimum training days');
  }
  /** The legacy Lift Only card: no cardio, no goals, then the step again. */
  protected liftOnly(): void {
    const d = this.bridge.global<WizardDraft>('WD');
    d.cardioTypes = [];
    d.cardioGoals = {};
    this.render();
  }
  protected setName(e: Event): void {
    this.bridge.global<WizardDraft>('WD').name = (e.target as HTMLInputElement).value;
  }
  protected setStart(e: Event): void {
    this.bridge.global<WizardDraft>('WD').startDate = (e.target as HTMLInputElement).value;
    this.updateStart();
  }

  protected icon(name: string, size: number): SafeHtml {
    const key = name + '/' + size;
    let h = this.icons.get(key);
    if (!h) {
      h = this.sanitizer.bypassSecurityTrustHtml(this.bridge.call<string>('asyIcon', name, size));
      this.icons.set(key, h);
    }
    return h;
  }
  protected call(name: string, ...args: unknown[]): void {
    this.bridge.call(name, ...args);
  }
  /** A card's choice, as the legacy handler wrote it: the draft's field, then the step again. */
  protected set(key: 'primaryPath' | 'experience' | 'ageBracket' | 'equipment' | 'liftingFocus', id: string): void {
    this.bridge.global<WizardDraft>('WD')[key] = id;
    this.render();
  }

  /** The legacy renderWizardStep: the shell and a moved step drawn at once, or the legacy step drawn in its own body. */
  private render(): void {
    const step = this.bridge.global<number>('wizardStep');
    const draft = this.bridge.global<WizardDraft>('WD');
    const name = WIZARD_STEPS[step]!;
    this.shell.set(wizardShell(step, draft.primaryPath));
    this.view.set(
      !MOVED_STEPS.has(name) ? null
        : name === 'primary' ? { step: 'primary', choices: primaryChoices(draft) }
          : name === 'profile' ? { step: 'profile', profile: profileView(draft) }
            : name === 'equipment' ? { step: 'equipment', choices: equipmentChoices(draft) }
              : name === 'lifting_focus' ? { step: 'lifting_focus', lifting: liftingView(draft, this.bridge.global<{ body: LiftOption[]; event: LiftOption[] }>('LIFTING_OPTIONS')) }
                : name === 'days' ? { step: 'days', days: this.days(draft) }
                  : { step: 'name', name: this.name(draft) },
    );
    this.cdr.detectChanges();
    if (!MOVED_STEPS.has(name)) this.legacyRender();
  }

  /** The days step's reads: the advisories, the floor and the goals' names, from their legacy helpers. */
  private days(draft: WizardDraft): ReturnType<typeof daysView> {
    return daysView(draft, {
      advisories: this.bridge.call<string[]>('getDayAdvisories'),
      minDays: this.bridge.call<number>('getMinTrainDays'),
      goalLabel: (id) => this.bridge.call<string>('goalLabel', id),
    });
  }

  /** The name step, as the legacy drew it: a default name and start written into the draft first, then the reads. */
  private name(draft: WizardDraft & { experience?: string; eventTargeted?: boolean }): NameView {
    const b = this.bridge;
    const types = draft.cardioTypes || [];
    const goals = draft.cardioGoals || {};
    const internalGoal = b.global<Record<string, string>>('LIFTING_FOCUS_TO_GOAL')[draft.liftingFocus || ''] || draft.liftingFocus;
    const liftLabel = LIFT_LABELS[draft.liftingFocus || ''] || draft.liftingFocus;
    const sport: Record<string, [string, string]> = { run: ['🏃', 'Run'], bike: ['🚴', 'Bike'], swim: ['🏊', 'Swim'] };
    const cardio = types.length
      ? types.map((t) => b.call<string>('asyIcon', sport[t]![0], 15) + ' ' + sport[t]![1] + (goals[t] && goals[t]!.label ? ': ' + goals[t]!.label : '')).join(' + ')
      : 'Lift only';
    const pin = b.call<{ tw?: number } | null>('wizardTestPin');
    const weeks = (pin || {}).tw || (types.length
      ? b.call<{ weeks: number }>('calcProgramLength', types, { ...goals, _experience: draft.experience, _ageBracket: draft.ageBracket, _eventTargeted: draft.eventTargeted }, internalGoal).weeks
      : 6);
    if (!draft.name) draft.name = liftLabel + ' Block ' + (b.call<unknown[]>('getPrograms').length + 1);
    if (!draft.startDate) draft.startDate = b.call<string>('_isoToday');
    const sr = b.call('resolveStartDate', draft.startDate, draft.restDays || [], b.call('_rsRace', draft));
    const al = b.call<{ start: string; underFloor?: boolean } | null>('wizardAlignment');
    let raceRow: string | null = null;
    if (draft.primaryPath === 'event' && draft.raceDate) {
      const cd = b.call<{ days: number } | null>('raceCountdown', draft.raceDate);
      const w = b.call<{ card: string; copy: string } | null>('raceCountdownWords', cd);
      raceRow = b.call<string>('_fmtStartDay', draft.raceDate, true) + (!w ? '' : cd!.days <= 0 ? ' (' + w.copy + ')' : ' (' + w.card + ' away)');
    } else if (draft.primaryPath === 'event') {
      raceRow = 'No date set — no taper';
    }
    this.nameInput = { weeks, cardio, raceRow, startSummary: b.call<string>('startSummaryVal', sr), aligned: null, resolveCopy: '' };
    this.rows.set(nameSummary(draft, this.nameInput));
    this.resolveCopy.set(al ? '' : b.call<string>('startResolveCopy', sr));
    return {
      name: draft.name,
      startDate: draft.startDate,
      aligned: al ? { start: b.call<string>('_fmtStartDay', al.start, true), warn: !!al.underFloor, copy: b.call<string>('alignedStartCopy', al), pips: b.call<string>('alignedPipsHTML', al) } : null,
      rows: [],
    };
  }

  /** The legacy updateStartResolve: on a start date change, only the explanation under it and the summary's start row. */
  private updateStart(): void {
    const v = this.view();
    if (!v || v.step !== 'name' || !this.nameInput) return;
    const b = this.bridge;
    if (b.call('wizardAlignment')) return;
    const draft = b.global<WizardDraft>('WD');
    const sr = b.call('resolveStartDate', draft.startDate, draft.restDays || [], b.call('_rsRace', draft));
    this.resolveCopy.set(b.call<string>('startResolveCopy', sr));
    this.nameInput = { ...this.nameInput, startSummary: b.call<string>('startSummaryVal', sr) };
    this.rows.set(nameSummary(draft, this.nameInput));
    this.cdr.detectChanges();
  }
}
