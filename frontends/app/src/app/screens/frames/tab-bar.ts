import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';

/**
 * The tab bar's buttons (architecture phase E, step 21), in place of the legacy buttons inside #tabBar. Each still goes
 * through the legacy tabGo; showing the bar and marking the active tab are still the legacy updateTabBar's, on the
 * buttons' ids, run once more at the mount for the screen the boot showed.
 */
@Component({
  selector: 'ia-tab-bar',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <button id="tabHome" (click)="call('tabGo', 'screenHome')"><span class="tab-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex:0 0 auto"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span><span class="tab-lbl">Programs</span></button>
  <button id="tabWeek" (click)="call('tabGo', 'screenWeek')"><span class="tab-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex:0 0 auto"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span><span class="tab-lbl">This Week</span></button>
  <button id="tabProgress" (click)="call('tabGo', 'screenProgress')"><span class="tab-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex:0 0 auto"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg></span><span class="tab-lbl">Progress</span></button>
  <button id="tabBugs" (click)="call('tabGo', 'screenBugs')"><span class="tab-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex:0 0 auto"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg></span><span class="tab-lbl">Bugs</span></button>
`,
})
export class TabBar {
  private readonly bridge = inject(LegacyBridge);

  protected call(name: string, ...args: unknown[]): void {
    this.bridge.call(name, ...args);
  }

  /** Called by the host once the bar is attached: the legacy boot marked the active tab on the buttons the mount removed. */
  mounted(): void {
    const current = this.bridge.global<string | null>('_curScreen');
    if (current) this.bridge.call('updateTabBar', current);
  }
}
