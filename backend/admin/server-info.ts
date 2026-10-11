import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { span, version } from './format';
import { AdminState } from './state';

// This backend: where it runs and what build it is, the app it serves, and the settings that shape the device table.
@Component({
  selector: 'ia-server-info',
  templateUrl: './server-info.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerInfo {
  protected readonly state = inject(AdminState);
  protected readonly span = span;
  protected readonly version = version;
  protected readonly kinds: Record<string, string> = {
    heroku: 'Heroku, deployed from main',
    docker: 'the docker image (npm run docker:up)',
    'mac-local': 'a Mac with no docker (npm run mac-local-backend)',
    local: 'a local dev server (npm start or npm run dev)',
  };
}
