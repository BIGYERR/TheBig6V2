import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icon, IconName } from '../common/icon';
import { Devices } from './devices';
import { span } from './format';
import { Login } from './login';
import { Overview } from './overview';
import { ServerInfo } from './server-info';
import { AdminState } from './state';
import { VersionsView } from './versions';

type SectionId = 'overview' | 'devices' | 'versions' | 'server';

interface Section {
  id: SectionId;
  label: string;
  icon: IconName;
  blurb: string;
}

const SECTIONS: Section[] = [
  { id: 'overview', label: 'Overview', icon: 'chart', blurb: 'Who is connected right now, and how fast the link is.' },
  { id: 'devices', label: 'Devices', icon: 'smartphone', blurb: 'Every device that has checked in. Name them here.' },
  { id: 'versions', label: 'Versions', icon: 'tag', blurb: 'Which app versions are out there, and who runs an old one.' },
  { id: 'server', label: 'Server', icon: 'server', blurb: 'This backend: where it runs, what build, and its settings.' },
];

/** The section in the address: #/devices, #/versions?... Anything else is the overview. */
function fromHash(): SectionId {
  const id = location.hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  return SECTIONS.some((s) => s.id === id) ? (id as SectionId) : 'overview';
}

// The admin's frame: a global header (which backend this is, who is signed in, Log out), the left nav, the footer, and
// one inner panel that holds whichever section is open. Signed out, it is the login page instead.
@Component({
  selector: 'ia-admin',
  imports: [Icon, Login, Overview, Devices, VersionsView, ServerInfo],
  templateUrl: './admin.html',
  host: { '(window:hashchange)': 'route()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {
  protected readonly state = inject(AdminState);
  protected readonly sections = SECTIONS;
  protected readonly section = signal<SectionId>(fromHash());
  protected readonly current = computed(() => SECTIONS.find((s) => s.id === this.section()) ?? SECTIONS[0]);
  protected readonly year = new Date().getFullYear();
  protected readonly span = span;

  constructor() {
    void this.state.check();
  }

  protected route(): void {
    this.section.set(fromHash());
  }
}
