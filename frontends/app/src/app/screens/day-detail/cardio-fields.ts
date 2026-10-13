import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { type LegacyArgs, LegacyBridge, type LegacyFunction } from '../../legacy/legacy-bridge';
import type { CardioFields as Fields } from './cardio-fields-model';

/**
 * The session log's cardio fields (architecture phase E, step 32), in place of the legacy cardioFieldHTML markup: on a
 * planned run its plan strip, then the fixed dimension's wheel showing the plan and the free one's (a time or distance
 * dose), or the reps stepper with the rep time or work miles wheel (a rep dose); the plain run's distance and pace
 * wheels; the ride's time wheel under its strip; the swim's yards. The wheels are the legacy iaWheelHTML's markup as
 * templates, so the legacy iaWheelInit gives them their motion and the legacy updateDoseDerived and doseRep their
 * readouts, by the same ids and data attributes.
 */
@Component({
  selector: 'ia-cardio-fields',
  host: { style: 'display: contents' },
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let f = fields();
  @switch (f.kind) {
    @case ('time') {
      @if (f.kind === 'time') {
        <ng-container [ngTemplateOutlet]="strip" [ngTemplateOutletContext]="{ $implicit: f.strip }" />
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was -->
        <label [innerHTML]="label('run', ' Log the run')"></label>
        <div class="iaw-wrap iaw-solo"><ng-container [ngTemplateOutlet]="wheel" [ngTemplateOutletContext]="{ $implicit: f.first }" /></div>
        <div class="f-sub">Shows the plan. Move it to match the watch.</div>
        <div class="iaw-wrap iaw-solo"><ng-container [ngTemplateOutlet]="wheel" [ngTemplateOutletContext]="{ $implicit: f.second }" /></div>
        <div class="f-sub">Off the watch.</div>
        <div id="doseDerived"></div>
      }
    }
    @case ('dist') {
      @if (f.kind === 'dist') {
        <ng-container [ngTemplateOutlet]="strip" [ngTemplateOutletContext]="{ $implicit: f.strip }" />
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was -->
        <label [innerHTML]="label('run', ' Log the run')"></label>
        <div class="iaw-wrap iaw-solo"><ng-container [ngTemplateOutlet]="wheel" [ngTemplateOutletContext]="{ $implicit: f.first }" /></div>
        <div class="f-sub">Shows the plan. Move it to match the watch.</div>
        <div class="iaw-wrap iaw-solo"><ng-container [ngTemplateOutlet]="wheel" [ngTemplateOutletContext]="{ $implicit: f.second }" /></div>
        <div class="f-sub">Off the watch.</div>
        <div id="doseDerived"></div>
      }
    }
    @case ('reps_dist') {
      @if (f.kind === 'reps_dist') {
        <ng-container [ngTemplateOutlet]="strip" [ngTemplateOutletContext]="{ $implicit: f.strip }" />
        <div class="log-field" style="margin-bottom:10px"><ng-container [ngTemplateOutlet]="stepper" [ngTemplateOutletContext]="{ $implicit: f.stepper }" /></div>
        <div class="iaw-wrap" style="max-width:190px"><ng-container [ngTemplateOutlet]="wheel" [ngTemplateOutletContext]="{ $implicit: f.wheel }" /></div>
        <div class="f-sub">what the watch showed on most reps</div>
        <div id="doseDerived"></div>
      }
    }
    @case ('reps_time') {
      @if (f.kind === 'reps_time') {
        <ng-container [ngTemplateOutlet]="strip" [ngTemplateOutletContext]="{ $implicit: f.strip }" />
        <div class="log-field" style="margin-bottom:10px"><ng-container [ngTemplateOutlet]="stepper" [ngTemplateOutletContext]="{ $implicit: f.stepper }" /></div>
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was -->
        <label>Miles in the work reps</label>
        <div class="iaw-wrap iaw-solo"><ng-container [ngTemplateOutlet]="wheel" [ngTemplateOutletContext]="{ $implicit: f.wheel }" /></div>
        <div class="f-sub">Leave out the easy jog between reps.</div>
        <div id="doseDerived"></div>
      }
    }
    @case ('run') {
      @if (f.kind === 'run') {
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was -->
        <label [innerHTML]="label('run', ' Run — actual distance & pace')"></label>
        @if (f.speedHint) {<div class="f-sub" style="margin-bottom:6px">Whole session off the watch — warm up, efforts and recoveries all count.</div>}
        <div class="iaw-wrap"><ng-container [ngTemplateOutlet]="wheel" [ngTemplateOutletContext]="{ $implicit: f.dist }" /><ng-container [ngTemplateOutlet]="wheel" [ngTemplateOutletContext]="{ $implicit: f.pace }" /></div>
      }
    }
    @case ('bike') {
      @if (f.kind === 'bike') {
        @if (f.strip; as s) {<ng-container [ngTemplateOutlet]="strip" [ngTemplateOutletContext]="{ $implicit: s }" />}
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was -->
        <label [innerHTML]="label('bike', ' Log the ride')"></label>
        <div class="iaw-wrap iaw-solo"><ng-container [ngTemplateOutlet]="wheel" [ngTemplateOutletContext]="{ $implicit: f.wheel }" /></div>
      }
    }
    @case ('swim') {
      @if (f.kind === 'swim') {
        <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was -->
        <label [innerHTML]="label('swim', ' Swim — actual yardage')"></label>
        <input type="number" id="log_swim_yards" placeholder="yards" [attr.value]="f.yards" min="0" step="25" class="input-field">
      }
    }
  }
  <ng-template #strip let-s>
    <div [attr.class]="'plan-strip' + (s.bike ? ' bike-strip' : '')"><span class="ps-lbl">{{ s.label }}</span><span class="ps-val">{{ s.value }}</span></div>
  </ng-template>
  <ng-template #stepper let-st>
    <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the legacy label, kept as it was -->
    <label>Reps completed</label>
    <div style="display:flex;align-items:center;gap:10px">
      <div class="exset-ctl" style="flex:0 0 150px">
        <button type="button" class="exset-btn" (click)="call('doseRep', -1)">−</button>
        <div class="exset-val" id="doseRepVal">{{ st.shown }}</div>
        <button type="button" class="exset-btn" (click)="call('doseRep', 1)">+</button>
      </div>
      <span class="reps-of">{{ st.of }}</span>
    </div>
    <input type="hidden" id="log_run_reps" [attr.value]="st.stored">
  </ng-template>
  <ng-template #wheel let-w>
    <div [attr.class]="'iaw-cell iaw-f' + w.ncols"><div class="iaw-cap">{{ w.cap }}</div><div class="iaw" [attr.data-kind]="w.kind" [attr.data-for]="w.hiddenId" [attr.data-plan]="w.plan"><div class="iaw-shade"></div><div class="iaw-band"></div>@for (c of w.cols; track c.ci) {<div class="iaw-col" [attr.data-ci]="c.ci" [attr.data-wrap]="c.wrap ? '1' : ''" [attr.data-len]="c.len"><div class="iaw-pad"></div>@for (it of c.items; track $index) {<div [attr.class]="it.nil ? 'iaw-it nil' : 'iaw-it'" [attr.data-v]="it.v">{{ it.face }}</div>}<div class="iaw-pad"></div></div>}</div><input type="hidden" [id]="w.hiddenId" [attr.value]="w.value"></div>
  </ng-template>
  `,
})
export class CardioFields {
  private readonly bridge = inject(LegacyBridge);
  private readonly sanitizer = inject(DomSanitizer);
  readonly fields = input.required<Fields>();
  private readonly safe = new Map<string, SafeHtml>();

  /** A field's label: the sport's icon, then its words. */
  protected label(icon: string, words: string): SafeHtml {
    const key = icon + words;
    let h = this.safe.get(key);
    if (!h) {
      h = this.sanitizer.bypassSecurityTrustHtml(this.bridge.call('asyIcon', icon, 15) + words);
      this.safe.set(key, h);
    }
    return h;
  }
  protected call<K extends LegacyFunction>(name: K, ...args: LegacyArgs<K>): void {
    this.bridge.call(name, ...args);
  }
}
