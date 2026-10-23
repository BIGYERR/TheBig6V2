import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProgressScreen } from '../progress/progress-screen';

/**
 * The Progress screen's frame (architecture phase E, step 21), in place of the legacy #screenProgress markup: the title
 * and the scrolling body, with the ProgressScreen component, now its child, inside.
 */
@Component({
  selector: 'ia-progress-frame',
  host: { style: 'display: contents' },
  imports: [ProgressScreen],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="top-bar">
    <div class="top-bar-inner">
      <div>
        <div class="app-title">THE <span>ASYLUM</span></div>
        <div class="app-subtitle" id="progressTitle">Progress</div>
      </div>
    </div>
  </div>
  <div id="progressBody" style="padding:16px 20px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:20px;padding-bottom:40px"><ia-progress-screen /></div>
`,
})
export class ProgressFrame {
}
