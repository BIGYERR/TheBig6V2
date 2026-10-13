import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { EMPTY_HTML, type ListedProgram, type ProgramCard, programList } from './program-list-model';
import { ProgramDetail } from './program-detail';
import { type DetailChip, programDetail, type ProgramDetailView, type ProgSel } from './program-detail-model';

/**
 * The home screen's program list (architecture phase E, step 4), in place of the legacy renderProgList inside
 * #progList. The markup is the legacy one, element for element. The program store, the active program and the list's
 * state stay the legacy script's: its actions (setActive, startRename, commitRename, askArchive, archiveProg, ...)
 * change them and call renderProgList, which LegacyBridge.provide hands to this component, and so does toggleProgCard,
 * which used to flip a card's class in place. The list draws at once when asked, as the legacy one did, because its
 * callers reach into it straight after (startRename focuses the rename box). A card's detail is the ProgramDetail
 * component (step 29; the legacy progDetailHTML's markup until then), drawn from the legacy progSelData.
 */
@Component({
  selector: 'ia-program-list',
  host: { style: 'display: contents' },
  imports: [NgTemplateOutlet, ProgramDetail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (empty(); as why) {
    <div style="text-align:center;padding:60px 20px;color:var(--muted);font-size:14px;" [innerHTML]="emptyHtml(why)"></div>
  }
  @for (c of cards(); track c.id) {
    <div [class]="c.cardClass" [id]="'pcard_' + c.id">
      @if (c.editing) {
        <ng-container [ngTemplateOutlet]="headMeta" [ngTemplateOutletContext]="{ $implicit: c }" />
      } @else {
        <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- the legacy card's tap target, kept as it was (a focusable div would draw a focus ring) -->
        <div class="prog-tap" (click)="toggle(c.id)"><ng-container [ngTemplateOutlet]="headMeta" [ngTemplateOutletContext]="{ $implicit: c }" /></div>
        @if (details().get(c.id); as dv) {<ia-program-detail [detail]="dv" />}
      }
      @switch (c.confirm) {
        @case (1) {
          <div class="prog-card-actions" style="flex-direction:column;align-items:stretch;gap:8px">
            <div style="font-size:13px;color:var(--text);line-height:1.5" [innerHTML]="archiveQuestion(c.name)"></div>
            <div style="display:flex;gap:8px">
              <button class="prog-action-btn primary" (click)="call('archiveProg', c.id)">Archive</button>
              <button class="prog-action-btn" (click)="call('cancelConfirm')">Cancel</button>
            </div>
            <button style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:11px;text-align:left;padding:2px 0;text-decoration:underline" (click)="call('askPurge', c.id)">Delete forever…</button>
          </div>
        }
        @case (2) {
          <div class="prog-card-actions" style="flex-direction:column;align-items:stretch;gap:8px">
            <div style="font-size:13px;color:var(--red);line-height:1.5" [innerHTML]="purgeWarning(c.name)"></div>
            <div style="display:flex;gap:8px">
              <button class="prog-action-btn danger" (click)="call('deleteProg', c.id)">Delete Forever</button>
              <button class="prog-action-btn" (click)="call('cancelConfirm')">Cancel</button>
            </div>
          </div>
        }
        @default {
          <div class="prog-card-actions">
            @if (!c.isActive) {
              <button class="prog-action-btn primary" (click)="call('setActive', c.id)">Set Active</button>
            } @else {
              <button class="prog-action-btn" style="opacity:0.4;cursor:default">Active ✓</button>
            }
            <button class="prog-action-btn danger" (click)="call('askArchive', c.id)">Archive</button>
          </div>
        }
      }
    </div>
  }
  <ng-template #headMeta let-c>
    <div class="prog-card-header">
      @if (c.editing) {
        <input type="text" class="input-field" [id]="'renameInput_' + c.id" [value]="c.nameValue" maxlength="40" style="flex:1;min-width:0;font-size:16px;padding:8px 10px" (keydown)="renameKey($event, c.id)">
        <div style="display:flex;gap:6px;flex-shrink:0;margin-left:8px">
          <button class="prog-action-btn primary" style="flex:0 0 auto;padding:8px 12px" (click)="call('commitRename', c.id)">Save</button>
          <button class="prog-action-btn" style="flex:0 0 auto;padding:8px 10px" (click)="call('cancelRename')" [innerHTML]="icon('x', 15)"></button>
        </div>
      } @else {
        <div class="prog-card-name" [innerHTML]="markup(c.name)"></div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
          <div [class]="'prog-card-badge badge-' + c.goal">{{ c.goalLabel }}</div>
          <button (click)="$event.stopPropagation(); call('startRename', c.id)" aria-label="Rename program" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center" [innerHTML]="icon('pencil', 16)"></button>
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      }
    </div>
    <div class="prog-card-meta" [innerHTML]="markup(c.metaHtml)"></div>
  </ng-template>
  `,
})
export class ProgramList {
  private readonly bridge = inject(LegacyBridge);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly empty = signal<'none' | 'archived' | null>(null);
  protected readonly cards = signal<ProgramCard[]>([]);
  /** Each card's detail, drawn with the list as the legacy one was. */
  protected readonly details = signal<Map<string, ProgramDetailView>>(new Map());
  private programs: ListedProgram[] = [];

  constructor() {
    this.bridge.provide('renderProgList', () => this.render());
    this.bridge.provide('toggleProgCard', (id: string) => this.toggle(id));
    this.read();
  }

  /** Reads the legacy store and state into the view. */
  private read(): void {
    const icon = (key: string, size: number) => this.bridge.call<string>('asyIcon', key, size);
    this.programs = this.bridge.call<ListedProgram[]>('getPrograms');
    const v = programList(this.programs, {
      activeId: this.bridge.call<string | null>('getActiveProgId'),
      openIds: this.bridge.global<Set<string>>('openProgIds'),
      editId: this.bridge.global<string | null>('editProgId'),
      confirmId: this.bridge.global<string | null>('confirmProgId'),
      confirmTier: this.bridge.global<number>('confirmTier'),
    }, icon);
    this.empty.set(v.empty);
    this.cards.set(v.cards);
    this.details.set(new Map(v.cards.map((c) => [c.id, this.detail(this.programs.find((p) => p.id === c.id)!)])));
  }

  /** The legacy renderProgList: drawn at once, since its callers read the new list straight after. */
  private render(): void {
    this.read();
    this.cdr.detectChanges();
  }

  protected toggle(id: string): void {
    const open = this.bridge.global<Set<string>>('openProgIds');
    if (open.has(id)) open.delete(id);
    else open.add(id);
    this.render();
  }

  protected call(name: string, ...args: unknown[]): void {
    this.bridge.call(name, ...args);
  }

  protected renameKey(e: KeyboardEvent, id: string): void {
    if (e.key === 'Enter') this.bridge.call('commitRename', id);
    else if (e.key === 'Escape') this.bridge.call('cancelRename');
  }

  protected markup(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
  protected icon(key: string, size: number): SafeHtml {
    return this.markup(this.bridge.call<string>('asyIcon', key, size));
  }
  protected emptyHtml(why: 'none' | 'archived'): SafeHtml {
    return this.markup(EMPTY_HTML[why]);
  }
  /** The legacy progDetailHTML's reads: the selections, the day and goal names, and the run paces when the run reads the chart. */
  private detail(p: ListedProgram): ProgramDetailView {
    const b = this.bridge;
    const s = b.call<ProgSel>('progSelData', p);
    const paces = s.runAnchor ? { chips: b.call<DetailChip[]>('runAnchorChips', s.runAnchor), sentence: b.call<string>('runAnchorSentence', s.runAnchor) } : null;
    return programDetail(p.id, s, { dayNames: b.global('_DAYF'), goalLabels: b.global('_GOAL_LABELS') }, paces);
  }
  protected archiveQuestion(name: string): SafeHtml {
    return this.markup(`Archive “${name}”?<br><span style="color:var(--muted);font-size:12px">It leaves your program list but its history stays. View it anytime under Progress.</span>`);
  }
  protected purgeWarning(name: string): SafeHtml {
    return this.markup(`This erases all logs, weights, and history for “${name}”. It cannot be undone.`);
  }
}
