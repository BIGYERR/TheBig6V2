import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ago, ms, version } from './format';
import { AdminState } from './state';

// The landing section: the counts and latency at a glance, the app versions in use, and which backend this is.
@Component({
  selector: 'ia-overview',
  templateUrl: './overview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Overview {
  protected readonly state = inject(AdminState);
  protected readonly topVersions = computed(() => (this.state.versions()?.rows ?? []).slice(0, 5));
  protected readonly ms = ms;
  protected readonly ago = ago;
  protected readonly version = version;
}
