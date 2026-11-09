import { ChangeDetectionStrategy, Component, inject, signal, type OnDestroy } from '@angular/core';
import { type LegacyApi, LegacyBridge } from '../../legacy/legacy-bridge';
import { MileSheetState } from '../mile-sheet/mile-sheet-state';
import { type NudgeOffer, type NudgeRecord, type NudgeText, judgeNudge, nudgeText, offerFields } from './mile-nudge-model';

/** How long the run card shows its done row on This Week before the sheet rises over it. */
export const NUDGE_DELAY_MS = 700;

/** A stored program, as far as the nudge reads it; `mileNudge` is the record a dismissal leaves (D274 item 4). */
interface NudgeProgram {
  id: string;
  totalWeeks?: number;
  cfg?: Parameters<LegacyApi['runAnchorInfo']>[0];
  mileNudge?: NudgeRecord | null;
}

/**
 * The coach's mile nudge (D274 P-ANCHORNUDGE, docs/decisions/mile-anchor.md), iOS app only. It wraps the legacy logCardio
 * through LegacyBridge.provide: the log is saved and toasted as before, then the judge reads the card just logged and
 * the easy card before it, and when both ran a chart row or more off the plan the same way, the sheet waits for This
 * Week: it rises over the run card, now closed on its done row, once the session sheet has gone (D276's run card is
 * where every way of logging a run ends, the recorder's included).
 * Update mile time opens the mile pencil (MileSheet) with the offer in its fields; Keep closes it. Either answer leaves
 * the two cards on the program, so the sheet waits for two new ones; a new mile clears that, since the record names the
 * mile it was judged against.
 */
@Component({
  selector: 'ia-mile-nudge',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (text(); as t) {
    <div class="mn-overlay" id="mileNudgeOverlay">
      <div class="mn-scrim" aria-hidden="true"></div>
      <div class="mn-sheet" role="dialog" aria-modal="true" aria-labelledby="mnTitle" aria-describedby="mnBody">
        <div class="mn-lbl">{{ t.label }}</div>
        <div class="mn-title" id="mnTitle">{{ t.title }}</div>
        <p class="mn-body" id="mnBody">{{ t.body }}</p>
        <button type="button" class="tw-btn glow mn-update" (click)="update()">{{ t.update }}</button>
        <button type="button" class="tw-btn mn-keep" (click)="keep()">{{ t.keep }}</button>
      </div>
    </div>
  }
  `,
})
export class MileNudge implements OnDestroy {
  private readonly bridge = inject(LegacyBridge);
  private readonly mile = inject(MileSheetState);
  protected readonly text = signal<NudgeText | null>(null);
  private offer: NudgeOffer | null = null;
  private progId = '';
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: { offer: NudgeOffer; progId: string } | null = null;
  private watch: MutationObserver | null = null;

  constructor() {
    const log = this.bridge.global('logCardio');
    this.bridge.provide('logCardio', () => {
      log();
      this.afterLog();
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.watch?.disconnect();
  }

  /** The judge, after the log is saved: the card just logged is the legacy currentWeek and currentDayKey. */
  private afterLog(): void {
    const pid = this.bridge.global('activeProgId');
    const p = (this.bridge.call('getPrograms') as NudgeProgram[]).find((x) => x.id === pid);
    if (!p || !p.cfg) return;
    const info = this.bridge.call('runAnchorInfo', p.cfg);
    if (!info) return;
    const offer = judgeNudge({
      week: Number(this.bridge.global('currentWeek')),
      day: String(this.bridge.global('currentDayKey')),
      hist: this.bridge.call('getDayHist'),
      logs: this.bridge.call('getLogs'),
      comp: this.bridge.call('getCompleted'),
      anchor: info.anchorSec,
      curWeek: Number(this.bridge.call('_goalCurWeek', p)),
      totalWeeks: p.totalWeeks || 6,
      record: p.mileNudge ?? null,
      implied: (pace) => this.bridge.call('paceChartLookup', 'recovery', pace).mile,
    });
    if (!offer) return;
    this.pending = { offer, progId: p.id };
    this.whenOnWeek();
  }

  /** This Week on screen with nothing over it: the session sheet closed and the week screen showing. */
  private onWeek(): boolean {
    const d = document.getElementById('detailOverlay');
    return !(d && d.classList.contains('open')) && !!document.getElementById('screenWeek')?.classList.contains('active');
  }

  /** The sheet rises once This Week shows the run card again; until then it waits on the session sheet's close. */
  private whenOnWeek(): void {
    if (this.onWeek()) {
      this.watch?.disconnect();
      this.watch = null;
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.timer = null;
        const p = this.pending;
        if (!p || !this.onWeek()) return this.whenOnWeek();
        this.pending = null;
        this.offer = p.offer;
        this.progId = p.progId;
        this.text.set(nudgeText(p.offer));
      }, NUDGE_DELAY_MS);
      return;
    }
    if (this.watch) return;
    const d = document.getElementById('detailOverlay');
    if (!d) return;
    this.watch = new MutationObserver(() => {
      if (this.pending && this.onWeek()) this.whenOnWeek();
    });
    this.watch.observe(d, { attributes: true, attributeFilter: ['class'] });
  }

  protected update(): void {
    const o = this.offer;
    this.answer();
    if (!o) return;
    this.mile.prefill.set(offerFields(o.offer));
    this.bridge.call('openMileSheet', this.progId);
  }

  protected keep(): void {
    this.answer();
  }

  /** Either answer leaves the two cards judged, and the mile they were judged against, on the program. */
  private answer(): void {
    const o = this.offer;
    this.text.set(null);
    this.offer = null;
    if (!o) return;
    const progs = this.bridge.call('getPrograms') as NudgeProgram[];
    const p = progs.find((x) => x.id === this.progId);
    if (!p) return;
    p.mileNudge = { cards: [o.cards[0].key, o.cards[1].key], anchor: o.anchor };
    this.bridge.call('savePrograms', progs);
  }
}
