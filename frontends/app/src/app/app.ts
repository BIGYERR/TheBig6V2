import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegacyHost } from './legacy/legacy-host';

@Component({
  selector: 'ia-root',
  imports: [LegacyHost],
  template: '<ia-legacy-host />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
