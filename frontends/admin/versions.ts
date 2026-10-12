import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ago, version, when } from './format';
import { AdminState } from './state';

// Devices per app version, newest first. The newest is APP_LATEST_VERSION when set, else the app this backend serves
// at /app/, else the newest any device reported; a device below it runs an old build.
@Component({
  selector: 'ia-versions',
  templateUrl: './versions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionsView {
  protected readonly state = inject(AdminState);
  protected readonly version = version;
  protected readonly when = when;
  protected readonly ago = (t: number) => ago(t, this.state.now());
  protected readonly sources: Record<string, string> = {
    config: 'set by APP_LATEST_VERSION',
    app: 'the app this backend serves at /app/',
    devices: 'the newest any device has reported',
  };
}
