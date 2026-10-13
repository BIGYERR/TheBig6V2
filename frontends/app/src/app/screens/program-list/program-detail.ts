import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import type { ProgramDetailView } from './program-detail-model';

/**
 * A program card's detail (architecture phase E, step 29), in place of the legacy progDetailHTML markup: the focus,
 * the profile, the schedule, the starting maxes, the run paces with their pencil and their source, each sport's goal
 * with its pencil, the race, and the seed with the copy button. The pencils and the copy button call the legacy
 * openMileSheet, openGoalSheet and copyProgSel, and keep the tap from reaching the card, as before.
 */
@Component({
  selector: 'ia-program-detail',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let d = detail();
  <div class="prog-detail">
    <div class="det-group"><div class="det-label">Focus</div>@for (r of d.focus; track r.k) {<div class="det-row"><span class="k">{{ r.k }}</span><span class="v">{{ r.v }}</span></div>}</div>
    <div class="det-group"><div class="det-label">Profile</div>@for (r of d.profile; track r.k) {<div class="det-row"><span class="k">{{ r.k }}</span><span class="v">{{ r.v }}</span></div>}</div>
    <div class="det-group"><div class="det-label">Schedule</div>@for (r of d.schedule; track r.k) {<div class="det-row"><span class="k">{{ r.k }}</span><span class="v">{{ r.v }}</span></div>}</div>
    <div class="det-group"><div class="det-label">{{ d.estimated ? 'Starting 1RM ' : 'Starting 1RM' }}@if (d.estimated) {<span style="font-weight:400;color:var(--muted);font-size:9px;letter-spacing:0">(est.)</span>}</div><div class="det-lifts">@for (c of d.lifts; track c.k) {<div class="lift-chip"><div class="lc-k">{{ c.k }}</div><div class="lc-v">{{ c.v }}</div><div class="lc-u">{{ c.u }}</div></div>}</div></div>
    @if (d.paces; as p) {
      <div class="det-group"><div class="det-label" style="display:inline-flex;align-items:center;gap:7px">Run paces<button (click)="$event.stopPropagation(); call('openMileSheet', d.id)" aria-label="Change mile time" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center" [innerHTML]="icon('pencil', 14)"></button></div><div class="det-paces">@for (c of p.chips; track $index) {<div class="lift-chip"><div class="lc-k">{{ c.k }}</div><div class="lc-v">{{ c.v }}</div><div class="lc-u">{{ c.u }}</div></div>}</div><div class="det-src" [innerHTML]="html(p.sentence)"></div></div>
    }
    <div class="det-group"><div class="det-label">Cardio</div>@if (d.cardio; as cs) {@for (c of cs; track c.type) {<div class="det-row"><span class="k">{{ c.label }}</span><span class="v" style="display:inline-flex;align-items:center;gap:7px">{{ c.goal }}<button (click)="$event.stopPropagation(); call('openGoalSheet', d.id, c.type)" [attr.aria-label]="'Change ' + c.label + ' goal'" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center" [innerHTML]="icon('pencil', 14)"></button></span></div>}} @else {<div class="det-row"><span class="k">Cardio</span><span class="v">Lift only</span></div>}</div>
    @if (d.event; as ev) {
      <div class="det-group"><div class="det-label">Event target</div>@for (r of ev; track r.k) {<div class="det-row"><span class="k">{{ r.k }}</span><span class="v">{{ r.v }}</span></div>}</div>
    }
    <div class="det-foot"><span class="det-seed">{{ d.seed }}</span><button class="copy-icon-btn" (click)="$event.stopPropagation(); call('copyProgSel', d.id)" aria-label="Copy program selections for troubleshooting" title="Copy for troubleshooting" [innerHTML]="icon('copy', 15)"></button></div>
  </div>
  `,
})
export class ProgramDetail {
  private readonly bridge = inject(LegacyBridge);
  private readonly sanitizer = inject(DomSanitizer);
  readonly detail = input.required<ProgramDetailView>();
  private readonly safe = new Map<string, SafeHtml>();

  protected html(s: string): SafeHtml {
    let h = this.safe.get(s);
    if (!h) {
      h = this.sanitizer.bypassSecurityTrustHtml(s);
      this.safe.set(s, h);
    }
    return h;
  }
  protected icon(key: string, size: number): SafeHtml {
    return this.html(this.bridge.call<string>('asyIcon', key, size));
  }
  protected call(name: string, ...args: unknown[]): void {
    this.bridge.call(name, ...args);
  }
}
