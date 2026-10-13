import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import {
  baselineSuffix, type CardioDraft, type CardioField, type CardioGoalDraft, type CardioReads, cardioStep, type CardioStep, type GoalChoice, localIso,
  prepareCardioDraft, raceButtonStyle, unitButtonStyle,
} from './cardio-goal-model';
import {
  type Choice, daysView, equipmentChoices, LIFT_LABELS, type LiftOption, liftingView, nameSummary, primaryChoices, profileView,
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
  | { step: 'cardio_goal'; cardio: CardioStep }
  | { step: 'lifting_focus'; lifting: ReturnType<typeof liftingView> }
  | { step: 'days'; days: ReturnType<typeof daysView> }
  | { step: 'name'; name: NameView };

/**
 * The new-program wizard (architecture phase E, step 19), in place of the legacy #screenWizard markup and the
 * renderWizardStep that drew into it. It takes over renderWizardStep through LegacyBridge.provide. The shell (Back, the
 * progress bar, the step count, the next button) and every step are the component's. The name step's start date
 * repaints only its explanation and its summary row on a change (updateStartResolve, provided), so the native date
 * picker stays open. The cardio goal step is drawn afresh on every render, as the legacy one was, because the legacy
 * updaters (updateRaceDateFeedback and the pace, swim and mile lines) repaint parts of it in place between renders; its
 * fields write the draft and call those updaters as the legacy handlers did. The draft is still the legacy `WD`, the
 * step the legacy `wizardStep`, and moving between steps the legacy wizardBack and wizardNext.
 */
@Component({
  selector: 'ia-wizard',
  host: { style: 'display: contents' },
  imports: [NgTemplateOutlet],
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
        @case ('cardio_goal') {
          @if (v.step === 'cardio_goal') {
            @for (c of [v.cardio]; track c) {
              <div class="wizard-title">Cardio goals</div>
              <div class="wizard-subtitle">Select all sports you want to train. Set a goal for each.</div>
              <div style="display:flex;flex-direction:column;gap:10px">
                @for (s of c.sports; track s.id) {
                  <div [attr.style]="'background:var(--surface);border:1.5px solid ' + (s.sel ? 'var(--accent)' : 'var(--border)') + ';border-radius:4px;overflow:hidden'">
                    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy sport header, kept as it was -->
                    <div (click)="call('toggleCardioTypeSport', s.id)" [attr.style]="'display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;background:' + (s.sel ? 'var(--accent-dim)' : 'transparent')">
                      <div [innerHTML]="icon(s.icon, 24)"></div>
                      <div style="flex:1">
                        <div [attr.style]="'font-family:var(--font-display);font-size:16px;font-weight:700;color:' + (s.sel ? 'var(--accent)' : 'var(--text)')">{{ s.name }}</div>
                        <div style="font-size:11px;color:var(--muted);margin-top:2px">{{ s.desc }}</div>
                      </div>
                      <div style="font-size:20px;color:var(--accent)" [style.opacity]="s.sel ? 1 : 0">✓</div>
                    </div>
                    @if (s.sel) {
                      <div style="padding:0 14px 14px;border-top:1px solid var(--border)">
                        <div style="padding-top:10px;display:flex;flex-direction:column;gap:6px">
                          @for (go of s.goals; track go.id) {
                            <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy goal option, kept as it was -->
                            <div [class]="'goal-option' + (go.sel ? ' selected' : '')" (click)="call('setCardioGoal', s.id, go.id)">
                              <div class="goal-option-label">{{ go.label }}</div>
                              <div class="goal-option-desc">{{ go.desc }}</div>
                            </div>
                          }
                        </div>
                        @if (s.form; as f) {
                          @if (f.kind === 'swim') {
                            <div style="margin-top:10px">
                              <div class="input-label" style="margin-bottom:6px">Distance</div>
                              <div style="display:flex;gap:0;align-items:stretch">
                                <input type="number" class="input-field" style="border-radius:4px 0 0 8px;flex:1;background:var(--surface2);color:var(--muted)" [attr.value]="f.dist" readonly>
                                <div style="display:flex;gap:0;border:1px solid var(--border2);border-left:none;border-radius:0 8px 8px 0;overflow:hidden;flex-shrink:0">
                                  <button (click)="call('setSwimUnit', 'yd')" [attr.style]="unitBtn(f.unit === 'yd', false)">yd</button>
                                  <button (click)="call('setSwimUnit', 'm')" [attr.style]="unitBtn(f.unit === 'm', true)">m</button>
                                </div>
                              </div>
                            </div>
                            <div style="margin-top:10px">
                              <div class="input-label" style="margin-bottom:6px">Target time</div>
                              <ng-container [ngTemplateOutlet]="pair" [ngTemplateOutletContext]="{ $implicit: f.target, sport: 'swim' }" />
                              <div id="swimPaceLine" style="font-size:12px;color:var(--accent);margin-top:6px" [style.display]="f.paceShown ? 'block' : 'none'" [innerHTML]="html(f.paceLine)"></div>
                            </div>
                            <div style="margin-top:8px">
                              <div class="input-label" style="margin-bottom:6px">{{ f.baseLabel }}</div>
                              <ng-container [ngTemplateOutlet]="flatPair" [ngTemplateOutletContext]="{ mins: f.baseMins, secs: f.baseSecs, minsKey: 'baseMins', secsKey: 'baseSecs' }" />
                              <div style="display:contents" [innerHTML]="html(f.advisory)"></div>
                            </div>
                            @if (f.base500; as b) {
                              <div style="margin-top:8px">
                                <div class="input-label" style="margin-bottom:6px">{{ b.label }}</div>
                                <div style="font-size:11px;line-height:1.45;color:var(--muted);margin-bottom:6px">Your repeats key off your 500 pace. Your 100 time sets the goal.</div>
                                <ng-container [ngTemplateOutlet]="flatPair" [ngTemplateOutletContext]="{ mins: b.mins, secs: b.secs, minsKey: 'base500Mins', secsKey: 'base500Secs' }" />
                              </div>
                            }
                          } @else if (f.kind === 'pace') {
                            <div style="margin-top:10px">
                              <div class="input-label" style="margin-bottom:6px">Target distance</div>
                              <div style="display:flex;gap:0;align-items:stretch">
                                <input type="number" class="input-field" style="border-radius:4px 0 0 8px;flex:1" placeholder="e.g. 1.5" [attr.value]="f.dist" (input)="edit('runDist', 'run', 'targetDist', $event)" min="0.1" step="0.1">
                                <div style="display:flex;gap:0;border:1px solid var(--border2);border-left:none;border-radius:0 8px 8px 0;overflow:hidden;flex-shrink:0">
                                  <button (click)="call('setPaceUnit', 'mi')" [attr.style]="unitBtn(f.unit === 'mi', false)">mi</button>
                                  <button (click)="call('setPaceUnit', 'km')" [attr.style]="unitBtn(f.unit === 'km', true)">km</button>
                                </div>
                              </div>
                            </div>
                            <div style="margin-top:10px">
                              <div class="input-label" style="margin-bottom:6px">Target time</div>
                              <ng-container [ngTemplateOutlet]="pair" [ngTemplateOutletContext]="{ $implicit: f.target, sport: 'run' }" />
                              <div id="paceDisplayLine" style="font-size:12px;color:var(--accent);margin-top:6px" [style.display]="f.paceShown ? 'block' : 'none'" [innerHTML]="html(f.paceLine)"></div>
                              <div id="paceFeasLine" style="display:none"></div>
                            </div>
                            @if (f.seed) {<div style="display:contents" [innerHTML]="html(f.seed)"></div>}
                            <div class="input-group" style="margin-top:8px">
                              <div class="input-label">How far can you currently run? (optional)</div>
                              <div style="display:flex;gap:8px;align-items:center">
                                <input type="number" class="input-field" style="flex:1" placeholder="e.g. 1.5" [attr.value]="f.baseline" (input)="edit('paceBaseline', 'run', 'baselineDist', $event)" min="0" step="0.1">
                                <span style="font-size:13px;color:var(--muted);flex-shrink:0">{{ f.unit }}</span>
                              </div>
                            </div>
                            <ng-container [ngTemplateOutlet]="mile" [ngTemplateOutletContext]="{ $implicit: f.mile }" />
                          } @else {
                            @if (f.seed) {<div style="display:contents" [innerHTML]="html(f.seed)"></div>}
                            <div class="input-group" style="margin-top:10px">
                              <div class="input-label">{{ f.question + ' (optional)' }}</div>
                              <div style="display:flex;gap:8px;align-items:center">
                                <input type="number" class="input-field" style="flex:1" [attr.placeholder]="f.placeholder" [attr.value]="f.baseline" (input)="edit('baseline', s.id, 'baselineDist', $event)" min="0" [attr.step]="f.step">
                                <span style="font-size:13px;color:var(--muted);flex-shrink:0">{{ f.unitWord }}</span>
                              </div>
                            </div>
                            @if (f.mile; as m) {
                              <ng-container [ngTemplateOutlet]="mile" [ngTemplateOutletContext]="{ $implicit: m }" />
                            }
                          }
                        }
                      </div>
                    }
                  </div>
                }
              </div>
              @if (c.footer; as ft) {
                <div style="background:var(--surface);border:1px solid var(--border2);border-radius:4px;padding:12px 14px;margin-top:4px">
                  <div style="font-size:12px;color:var(--muted);line-height:1.6"><span id="progLenLine" [innerHTML]="html(ft.progLen)"></span>@if (ft.multi) {<br>Sessions rotate across training days. Each sport gets its own days. }</div>
                  @if (ft.race; as r) {
                    <div style="margin-top:10px">
                      <div style="font-size:11px;color:var(--muted);font-family:var(--font-display);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Race date</div>
                      <div style="display:flex;gap:0;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;overflow:hidden;margin-bottom:8px">
                        <button (click)="raceDate(true)" [attr.style]="raceBtn(r.targeted)">✓ I have a race date</button>
                        <button (click)="raceDate(false)" [attr.style]="raceBtn(!r.targeted)">✕ Just building fitness</button>
                      </div>
                      @if (r.targeted) {
                        <div>
                          <div style="font-size:11px;color:var(--muted);font-family:var(--font-display);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px">Race date</div>
                          <input type="date" id="raceDateInput" [attr.value]="r.value" [attr.min]="r.min" (input)="setRaceDate($event)" style="width:100%;background:var(--surface2);border:1.5px solid var(--accent);border-radius:4px;color:var(--text);font-family:var(--font-display);font-size:17px;font-weight:700;letter-spacing:0.04em;padding:13px 14px;outline:none;box-sizing:border-box;color-scheme:dark;-webkit-appearance:none;cursor:pointer">
                          <div id="raceDateFeedback" style="margin-top:8px"></div>
                          <div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5">Tap to open the calendar. The final weeks taper so you arrive fresh.</div>
                        </div>
                      } @else {
                        <div style="font-size:11px;color:var(--muted);line-height:1.5">{{ r.copy }}</div>
                      }
                    </div>
                  }
                </div>
              }
            }
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
  <ng-template #pair let-p let-sport="sport">
    <div style="display:flex;align-items:center;gap:6px">
      <div style="flex:1;text-align:center">
        <input type="number" class="input-field" style="text-align:center" placeholder="min" [attr.value]="p.mins" (input)="edit(p.field, sport, p.minsKey, $event)" [attr.min]="p.lo" [attr.max]="p.hi">
        <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">minutes</div>
      </div>
      <div style="font-size:24px;color:var(--muted);font-weight:300;flex-shrink:0;padding-bottom:14px">:</div>
      <div style="flex:1;text-align:center">
        <input type="number" class="input-field" style="text-align:center" placeholder="sec" [attr.value]="p.secs" (input)="edit(p.field, sport, p.secsKey, $event)" min="0" max="59">
        <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">seconds</div>
      </div>
    </div>
  </ng-template>
  <ng-template #flatPair let-mins="mins" let-secs="secs" let-minsKey="minsKey" let-secsKey="secsKey">
    <div style="display:flex;align-items:center;gap:6px">
      <input type="number" class="input-field" style="text-align:center;flex:1" placeholder="min" [attr.value]="mins" (input)="edit('swimBase', 'swim', minsKey, $event)" min="0" max="99">
      <div style="font-size:20px;color:var(--muted);font-weight:300;flex-shrink:0">:</div>
      <input type="number" class="input-field" style="text-align:center;flex:1" placeholder="sec" [attr.value]="secs" (input)="edit('swimBase', 'swim', secsKey, $event)" min="0" max="59">
    </div>
  </ng-template>
  <ng-template #mile let-m>
    <div class="input-group" style="margin-top:8px">
      <div class="input-label">Current mile time <span style="color:var(--muted);font-weight:400" [innerHTML]="html(m.help)"></span></div>
      <ng-container [ngTemplateOutlet]="pair" [ngTemplateOutletContext]="{ $implicit: m.pair, sport: 'run' }" />
      <div style="display:contents" [innerHTML]="html(m.advisory)"></div>
    </div>
  </ng-template>
  `,
})
export class Wizard {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly shell = signal<{ fill: string | null; label: string; next: string }>({ fill: null, label: '1 / 6', next: 'Continue →' });
  protected readonly view = signal<StepView | null>(null);
  protected readonly unit = unitStyle;
  protected readonly unitBtn = unitButtonStyle;
  protected readonly raceBtn = raceButtonStyle;
  /** The name step's start explanation and summary rows, repainted alone when the start date changes. */
  protected readonly resolveCopy = signal('');
  protected readonly rows = signal<{ k: string; v: string }[]>([]);
  private readonly icons = new Map<string, SafeHtml>();
  private readonly safe = new Map<string, SafeHtml>();
  /** What the name step's summary was built from, so a start date change rebuilds only the start row. */
  private nameInput: Parameters<typeof nameSummary>[1] | null = null;

  constructor() {
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

  /** A cardio goal field, as the legacy handler wrote it: the draft's value, then what that field repainted. */
  protected edit(field: CardioField, sport: string, key: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    const b = this.bridge;
    const g = (b.global<CardioDraft>('WD').cardioGoals[sport] as CardioGoalDraft);
    g[key] = v;
    if (field === 'swimTarget') {
      b.call('updatePaceTime', 'swim');
      b.call('updateSwimPaceDisplay');
    } else if (field === 'swimBase') {
      b.call('updateSwimAdvisory');
    } else if (field === 'runDist') {
      b.call('updateRaceDateFeedback');
    } else if (field === 'runTarget') {
      b.call('updatePaceTime', 'run');
      b.call('updateRaceDateFeedback');
    } else if (field === 'paceBaseline') {
      g.baseline = v + (g.paceUnit || 'mi');
      b.call('updateRaceDateFeedback');
    } else if (field === 'mile') {
      g.mileBestSrc = { kind: 'entered' };
      b.call('updateRaceDateFeedback');
      b.call('updateMileAdvisory');
    } else {
      g.baseline = v + baselineSuffix(sport);
      if (sport === 'run') b.call('updateRaceDateFeedback');
    }
  }
  /** The race date buttons: a date (today when none is picked yet), or none and no week count, then the step again. */
  protected raceDate(targeted: boolean): void {
    const d = this.bridge.global<CardioDraft>('WD');
    d.eventTargeted = targeted;
    if (targeted) {
      if (!d.raceDate) d.raceDate = localIso(new Date());
    } else {
      d.raceDate = '';
      d.raceDateWeeks = null;
    }
    this.render();
  }
  protected setRaceDate(e: Event): void {
    this.bridge.global<CardioDraft>('WD').raceDate = (e.target as HTMLInputElement).value;
    this.bridge.call('updateRaceDateFeedback');
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

  /** The legacy renderWizardStep: the shell and the step, drawn at once. */
  private render(): void {
    const step = this.bridge.global<number>('wizardStep');
    const draft = this.bridge.global<WizardDraft>('WD');
    const name = WIZARD_STEPS[step]!;
    this.shell.set(wizardShell(step, draft.primaryPath));
    this.view.set(
      name === 'primary' ? { step: 'primary', choices: primaryChoices(draft) }
        : name === 'profile' ? { step: 'profile', profile: profileView(draft) }
          : name === 'equipment' ? { step: 'equipment', choices: equipmentChoices(draft) }
            : name === 'cardio_goal' ? { step: 'cardio_goal', cardio: this.cardio() }
              : name === 'lifting_focus' ? { step: 'lifting_focus', lifting: liftingView(draft, this.bridge.global<{ body: LiftOption[]; event: LiftOption[] }>('LIFTING_OPTIONS')) }
                : name === 'days' ? { step: 'days', days: this.days(draft) }
                  : { step: 'name', name: this.name(draft) },
    );
    this.cdr.detectChanges();
    // The legacy step's one repaint, in the same tick, once every line it paints is on the page.
    if (name === 'cardio_goal') this.bridge.call('updateRaceDateFeedback');
  }

  /** The cardio goal step: the draft prepared as the legacy step prepared it, then its reads from the legacy helpers. */
  private cardio(): CardioStep {
    const b = this.bridge;
    const draft = b.global<CardioDraft>('WD');
    const today = localIso(new Date());
    const hybridExcluded = b.global<ReadonlySet<string>>('HYBRID_EXCLUDED_GOALS');
    prepareCardioDraft(draft, hybridExcluded, today);
    const reads: CardioReads = {
      goalsByType: b.global<Record<string, GoalChoice[]>>('CARDIO_GOALS_BY_TYPE'),
      hybridExcluded,
      swimDist: b.global<Record<string, number>>('SWIM_GOAL_DIST'),
      icon: (key, size) => b.call<string>('asyIcon', key, size),
      clock: (secs) => b.call<string>('_clkMS', secs),
      paceTarget: (g) => b.call<{ tTotalSecs?: number; tPacePerMile?: number }>('paceGoalTarget', g),
      seedBanner: () => b.call<string>('_seedBannerHTML'),
      swimAdvisory: () => b.call<string>('_swimAdvisoryHTML'),
      mileHelp: () => b.call<string>('_mileFieldHelp'),
      mileAdvisory: () => b.call<string>('_mileAdvisoryHTML'),
      progLen: () => b.call<string>('progLenLineHTML'),
      today,
    };
    return cardioStep(draft, reads);
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
