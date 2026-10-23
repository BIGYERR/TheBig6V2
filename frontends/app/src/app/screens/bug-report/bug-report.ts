import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { BUG_SENT_TOAST, BUG_STATUS, bugContextText, submitBugReport } from './bug-report-model';

/**
 * The bug report screen (architecture phase E, step 1), in place of the legacy script's submitBug inside #screenBugs.
 * The markup is the legacy screen's, element for element and style for style, so the screen looks as it did (the e2e's
 * parity compares it with the single-file page). The host takes no box of its own (display: contents), so the screen's
 * flex layout sees the same children. The context it attaches reads the legacy app through the bridge.
 */
@Component({
  selector: 'ia-bug-report',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="top-bar">
    <div class="top-bar-inner">
      <div>
        <div class="app-title">THE <span>ASYLUM</span></div>
        <div class="app-subtitle">Report a Bug</div>
      </div>
    </div>
  </div>
  <div style="padding:16px 20px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding-bottom:40px">
    <div style="font-size:13px;color:var(--muted);line-height:1.6">Found something broken or weird? Tell me what happened — what you tapped, what you expected, what it did instead. The more detail the better.</div>
    <textarea id="bugText" class="input-field" placeholder="e.g. Tapped Save on the program name and it didn't update the This Week header until I reopened the app…" style="min-height:160px;resize:vertical;line-height:1.5" [value]="text()" (input)="text.set($any($event.target).value)"></textarea>
    <button id="bugSubmit" style="font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:14px;border-radius:4px;border:none;background:var(--accent);color:var(--on-ink);cursor:pointer" [disabled]="sending()" [style.opacity]="sending() ? '0.6' : null" (click)="send()">{{ sending() ? 'Sending…' : 'Send Bug Report' }}</button>
    <div id="bugStatus" style="font-size:13px;min-height:20px;line-height:1.5" [style.color]="status().color">{{ status().text }}</div>
    <div style="font-size:11px;color:var(--muted);line-height:1.5;opacity:0.8">Your device and app context is attached automatically to help track it down.</div>
    <div id="bugVersion" style="font-family:var(--font-mono,monospace);font-size:11px;color:var(--muted);opacity:0.55;letter-spacing:0.08em;text-align:center;padding-top:4px">{{ versionLabel }}</div>
  </div>
  `,
})
export class BugReport {
  private readonly bridge = inject(LegacyBridge);
  protected readonly text = signal('');
  protected readonly sending = signal(false);
  protected readonly status = signal<{ text: string; color: string }>({ text: '', color: 'var(--muted)' });
  protected readonly versionLabel = 'BUILD ' + this.bridge.call('iaVersionLabel', this.bridge.global('IA_VERSION'));

  protected async send(): Promise<void> {
    const txt = this.text().trim();
    if (!txt) {
      this.status.set(BUG_STATUS.empty);
      return;
    }
    let ctx = '';
    try {
      const program = this.bridge.global('activeProg');
      ctx = bugContextText({
        build: this.bridge.call('iaVersionLabel', this.bridge.global('IA_VERSION')),
        time: new Date().toISOString(),
        ua: navigator.userAgent,
        width: window.innerWidth,
        height: window.innerHeight,
        standalone: !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches),
        url: location.href,
        program,
        week: this.bridge.global('currentWeek'),
      });
    } catch {
      // The legacy script sent the report with no context when reading it failed; so does this.
    }
    this.sending.set(true);
    this.status.set(BUG_STATUS.sending);
    const outcome = await submitBugReport(txt, ctx, (url, init) => fetch(url, init));
    this.sending.set(false);
    if (outcome === 'sent') {
      this.text.set('');
      this.bridge.call('showToast', BUG_SENT_TOAST);
    }
    this.status.set(BUG_STATUS[outcome]);
  }
}
