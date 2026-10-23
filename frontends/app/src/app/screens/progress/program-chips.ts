import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { chipStyle, type ChipsView } from './program-chips-model';

/**
 * The Progress screen's program chips and the archived program's bar (architecture phase E, step 17), in place of the
 * legacy _progChipsHTML and _restoreBarHTML markup. A chip shows that program (the legacy setProgressView); the bar
 * restores it (unarchiveProg, then the screen again) or arms its delete (askPurgeFromProgress), whose confirmation
 * deletes it (deleteProg) or stands down (cancelProgressConfirm). Laid in a box that makes none of its own.
 */
@Component({
  selector: 'ia-program-chips',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @let v = view();
  @if (v.chips; as chips) {
    <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch">@for (c of chips; track c.id) {<button (click)="show(c.id)" [attr.style]="style(c.sel)" [innerHTML]="labels()[$index]"></button>}</div>
  }
  @if (v.bar; as b) {
    @if (b.kind === 'confirm') {
      <div style="display:flex;flex-direction:column;gap:8px;background:var(--surface);border:1px solid var(--red);border-radius:4px;padding:10px 12px">
        <div style="font-size:12px;color:var(--red);line-height:1.5">{{ 'This erases all logs, weights, and history for “' + b.name + '”. It cannot be undone.' }}@if (b.warn) {<br><span style="color:var(--muted)">Other programs are using these loads as starting points — those will go blank.</span>}</div>
        <div style="display:flex;gap:8px"><button class="prog-action-btn danger" (click)="purge(b.id)">Delete Forever</button><button class="prog-action-btn" (click)="cancel()">Cancel</button></div>
      </div>
    } @else {
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:10px 12px">
        <div style="font-size:12px;color:var(--muted)">This program is archived — history only.</div>
        <button class="prog-action-btn" style="flex:0 0 auto" (click)="restore(b.id)">Restore</button>
        <button class="prog-action-btn" aria-label="Delete this program forever" title="Delete forever" style="flex:0 0 auto;color:var(--red);padding:8px 10px;display:inline-flex;align-items:center" (click)="askPurge(b.id)" [innerHTML]="trash()"></button>
      </div>
    }
  }
  `,
})
export class ProgramChips {
  private readonly bridge = inject(LegacyBridge);
  private readonly sanitizer = inject(DomSanitizer);
  readonly view = input.required<ChipsView>();
  /** The trash icon's markup. */
  readonly trashIcon = input.required<string>();
  protected readonly style = chipStyle;
  protected readonly labels = computed(() => (this.view().chips || []).map((c) => this.sanitizer.bypassSecurityTrustHtml(c.label)));
  protected readonly trash = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.trashIcon()));

  protected show(id: string): void {
    this.bridge.call('setProgressView', id);
  }
  protected restore(id: string): void {
    this.bridge.call('unarchiveProg', id);
    this.bridge.call('renderProgressScreen');
  }
  protected askPurge(id: string): void {
    this.bridge.call('askPurgeFromProgress', id);
  }
  protected purge(id: string): void {
    this.bridge.call('deleteProg', id, true);
  }
  protected cancel(): void {
    this.bridge.call('cancelProgressConfirm');
  }
}
