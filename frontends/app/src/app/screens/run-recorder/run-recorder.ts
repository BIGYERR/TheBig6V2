import { ChangeDetectionStrategy, Component, computed, output, signal, type OnDestroy } from '@angular/core';
import {
  BUTTON_LABEL,
  RECORDER_COPY,
  gpxFileName,
  parseRecording,
  recorderView,
  runGpx,
  runLabel,
  runListLine,
  type GpsAuth,
  type GpsBridge,
  type GpsEvent,
  type GpsFix,
  type GpsLine,
  type RecorderButton,
} from './run-recorder-model';

type Share = (fileName: string, text: string, done: () => void, fail: () => void) => void;

/**
 * The Run recorder (D267 P-GPSTEST, docs/decisions/gps-recording.md), opened from its row on the Bugs tab, iOS only. It
 * draws what the ia-gps plugin records; the plugin writes every fix to the run's file itself, so the screen can close,
 * the phone can lock and the app can sleep without losing a second. On its return the screen reads the file back.
 */
@Component({
  selector: 'ia-run-recorder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="overlay open" role="dialog" aria-label="Run recorder" style="z-index:320">
    <div class="detail-header">
      <button class="back-btn" (click)="back()">‹ Back</button>
      <div>
        <div class="detail-day-name">{{ subtitle() }}</div>
        <div class="detail-day-title">{{ copy.row }}</div>
      </div>
    </div>
    <div class="detail-body">
      <div class="look-note" aria-live="polite">{{ view().gps }}</div>
      <div style="font-family:var(--font-display);font-size:56px;font-weight:700;letter-spacing:0;line-height:1;color:var(--text);font-variant-numeric:tabular-nums">{{ view().time }}</div>
      <div style="display:flex;gap:8px">
        <div class="look-row" style="flex:1;border-top:none;padding-top:0;margin-top:0">
          <div class="look-lbl">Miles</div>
          <div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums">{{ view().distance }}</div>
        </div>
        <div class="look-row" style="flex:1;border-top:none;padding-top:0;margin-top:0">
          <div class="look-lbl">Avg pace</div>
          <div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums">{{ view().avgPace }}</div>
        </div>
        <div class="look-row" style="flex:1;border-top:none;padding-top:0;margin-top:0">
          <div class="look-lbl">This mile</div>
          <div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums">{{ view().milePace }}</div>
        </div>
      </div>
      <div class="look-seg">
        @for (b of view().buttons; track b) {
          <button class="look-opt" style="padding:14px;font-size:15px" (click)="press(b)">{{ label[b] }}</button>
        }
      </div>
      @if (message()) {
        <div class="look-note" aria-live="polite">{{ message() }}</div>
      }
      @if (view().splits.length) {
        <div class="look-row">
          <div class="look-lbl">Splits</div>
          @for (s of view().splits; track s.mile) {
            <div style="display:flex;justify-content:space-between;font-size:14px;color:var(--text);font-variant-numeric:tabular-nums">
              <span>Mile {{ s.mile }}</span><span>{{ s.time }}</span>
            </div>
          }
        </div>
      }
      @if (past().length) {
        <div class="look-row">
          <div class="look-lbl">Past runs</div>
          @for (r of past(); track r.id) {
            <button class="look-opt" style="text-align:left" (click)="openRun(r.id)">{{ r.label }} · {{ r.line }}</button>
          }
        </div>
      }
    </div>
  </div>
  `,
})
export class RunRecorder implements OnDestroy {
  readonly closed = output<void>();

  protected readonly copy = RECORDER_COPY;
  protected readonly label = BUTTON_LABEL;
  private readonly gps = (window as { iaGps?: GpsBridge }).iaGps;
  private readonly share = (window as { iaIsland?: { share?: Share } }).iaIsland?.share;

  private readonly lines = signal<GpsLine[]>([]);
  private readonly runId = signal<string | null>(null);
  private readonly live = signal(false);
  private readonly auth = signal<GpsAuth>('unasked');
  private readonly lastFix = signal<GpsFix | null>(null);
  private readonly now = signal(Date.now());
  protected readonly past = signal<{ id: string; label: string; line: string }[]>([]);
  protected readonly message = signal('');

  protected readonly view = computed(() =>
    recorderView(this.lines(), { auth: this.auth(), lastFix: this.lastFix(), live: this.live(), now: this.now() }),
  );
  protected readonly subtitle = computed(() => {
    const id = this.runId();
    return id && !this.live() ? runLabel(id) : this.copy.rowNote;
  });

  private readonly tick = setInterval(() => this.now.set(Date.now()), 1000);
  private readonly onVisible = () => {
    if (document.visibilityState === 'visible') this.resync();
  };

  constructor() {
    this.gps?.listen((e) => this.onEvent(e));
    this.gps?.warm();
    this.resync();
    document.addEventListener('visibilitychange', this.onVisible);
  }

  ngOnDestroy(): void {
    clearInterval(this.tick);
    document.removeEventListener('visibilitychange', this.onVisible);
    // Location goes off unless a run is recording; a recording keeps going with the screen closed.
    this.gps?.cool();
  }

  private onEvent(e: GpsEvent): void {
    if (e.type === 'auth') this.auth.set(e.status);
    else if (e.type === 'fix') {
      this.lastFix.set(e.fix);
      if (e.recorded && this.live()) this.lines.update((ls) => [...ls, e.fix]);
    } else if (e.type === 'mark') {
      if ('mark' in e.line && e.line.mark === 'start') {
        this.live.set(true);
        this.lines.set([e.line]);
        this.gps?.status((s) => this.runId.set(s.id));
      } else if (this.live()) this.lines.update((ls) => [...ls, e.line]);
    } else this.message.set(e.message);
  }

  /** What the plugin holds: the live run read back from its file, and the past runs. */
  private resync(): void {
    this.gps?.status((s) => {
      if (s.recording && s.id) {
        const id = s.id;
        this.live.set(true);
        this.runId.set(id);
        this.gps?.read(id, (text) => this.lines.set(parseRecording(text)));
      }
      this.refreshPast(s.id);
    });
  }

  private refreshPast(liveId: string | null): void {
    this.gps?.list((runs) => {
      const ids = runs.map((r) => r.id).filter((id) => id !== liveId);
      const rows = new Map<string, string>();
      if (!ids.length) this.past.set([]);
      for (const id of ids) {
        this.gps?.read(id, (text) => {
          rows.set(id, runListLine(parseRecording(text)));
          if (rows.size === ids.length) this.past.set(ids.map((i) => ({ id: i, label: runLabel(i), line: rows.get(i) ?? '' })));
        });
      }
    });
  }

  protected openRun(id: string): void {
    if (this.live()) return;
    this.gps?.read(id, (text) => {
      this.message.set('');
      this.runId.set(id);
      this.lines.set(parseRecording(text));
    });
  }

  protected press(b: RecorderButton): void {
    const gps = this.gps;
    if (!gps) return;
    this.message.set('');
    const id = this.runId();
    if (b === 'start') {
      this.runId.set(null);
      this.lines.set([]);
      gps.start();
    } else if (b === 'pause') gps.pause();
    else if (b === 'resume') gps.resume();
    else if (b === 'finish') {
      gps.finish(
        (done) => {
          this.live.set(false);
          this.runId.set(done);
          gps.read(done, (text) => this.lines.set(parseRecording(text)));
          this.refreshPast(null);
        },
        (why) => this.message.set(why),
      );
    } else if (b === 'share' && id) {
      const fail = () => this.message.set(RECORDER_COPY.shareFailed);
      if (this.share) this.share(gpxFileName(id), runGpx(id, this.lines()), () => this.message.set(''), fail);
      else fail();
    } else if (b === 'delete' && id) {
      if (!confirm(RECORDER_COPY.confirmDelete)) return;
      gps.remove(
        id,
        () => {
          this.clear();
          this.refreshPast(null);
        },
        (why) => this.message.set(why),
      );
    }
  }

  /** Back from a finished run goes to the start; back from the start, or from a live run, closes the screen. */
  protected back(): void {
    if (!this.live() && this.runId()) this.clear();
    else this.closed.emit();
  }

  private clear(): void {
    this.runId.set(null);
    this.lines.set([]);
    this.message.set('');
  }
}
