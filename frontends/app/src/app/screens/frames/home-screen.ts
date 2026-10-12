import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LegacyBridge } from '../../legacy/legacy-bridge';
import { ProgramList } from '../program-list/program-list';

/**
 * The Programs screen's frame (architecture phase E, step 21), in place of the legacy #screenHome markup: the title, the
 * program list (the ProgramList component, now its child) and the button that starts the wizard (the legacy startWizard).
 */
@Component({
  selector: 'ia-home-screen',
  host: { style: 'display: contents' },
  imports: [ProgramList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="top-bar">
    <div class="top-bar-inner">
      <div>
        <div class="app-title">THE <span>ASYLUM</span></div>
        <div class="app-subtitle" id="homeSubtitle">Your Programs</div>
      </div>
    </div>
  </div>
  <div class="prog-list" id="progList"><ia-program-list /></div>
  <button class="new-prog-btn" (click)="call('startWizard')">+ Build New Program</button>
`,
})
export class HomeScreen {
  private readonly bridge = inject(LegacyBridge);

  protected call(name: string, ...args: unknown[]): void {
    this.bridge.call(name, ...args);
  }
}
