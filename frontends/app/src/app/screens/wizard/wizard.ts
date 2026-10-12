import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import {
  type Choice, equipmentChoices, MOVED_STEPS, primaryChoices, profileView, unitStyle, type WizardDraft, wizardShell, WIZARD_STEPS,
} from './wizard-model';

/** One render of a moved step. */
type StepView =
  | { step: 'primary'; choices: Choice[] }
  | { step: 'profile'; profile: ReturnType<typeof profileView> }
  | { step: 'equipment'; choices: Choice[] };

/**
 * The new-program wizard (architecture phase E, step 19), in place of the legacy #screenWizard markup and the
 * renderWizardStep that drew into it. It takes over renderWizardStep through LegacyBridge.provide. The shell (Back, the
 * progress bar, the step count, the next button) and the moved steps (MOVED_STEPS: what the program is for, about you,
 * equipment) are the component's; a step not yet moved is still drawn by the legacy renderWizardStep, captured before
 * it was replaced, into a #wizardBody of its own, so neither ever writes into the other's. The draft is still the
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
  private readonly icons = new Map<string, SafeHtml>();

  constructor() {
    this.legacyRender = this.bridge.global<() => void>('renderWizardStep');
    this.bridge.provide('renderWizardStep', () => this.render());
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
  protected set(key: keyof WizardDraft, id: string): void {
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
            : { step: 'equipment', choices: equipmentChoices(draft) },
    );
    this.cdr.detectChanges();
    if (!MOVED_STEPS.has(name)) this.legacyRender();
  }
}
