import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { Device, DevicePage, DeviceQuery } from './admin-api';
import { ago, ms, span, version, when } from './format';
import { AdminState } from './state';

const REFRESH_MS = 5_000;

// Every device that has checked in: search, filter, page, and name them. #/devices?old=1 opens on the old builds.
@Component({
  selector: 'ia-devices',
  templateUrl: './devices.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Devices {
  protected readonly state = inject(AdminState);
  private seq = 0;

  protected readonly result = signal<DevicePage | null>(null);
  protected readonly q = signal('');
  protected readonly name = signal('');
  protected readonly connectedOnly = signal(false);
  protected readonly oldOnly = signal(/[?&]old=1\b/.test(location.hash));
  protected readonly page = signal(1);
  protected readonly pageSize = signal(25);
  protected readonly pageSizes = [10, 25, 50];

  private readonly query = computed<DeviceQuery>(() => ({
    q: this.q(),
    name: this.name(),
    connected: this.connectedOnly(),
    outdated: this.oldOnly(),
    page: this.page(),
    pageSize: this.pageSize(),
  }));

  protected readonly ms = ms;
  protected readonly span = span;
  protected readonly when = when;
  protected readonly version = version;
  protected readonly ago = (t: number) => ago(t, this.state.now());

  constructor() {
    let debounce: ReturnType<typeof setTimeout> | undefined;
    // A changed search or page reloads the table after a short pause, so typing is not a request per key.
    effect(() => {
      const query = this.query();
      clearTimeout(debounce);
      debounce = setTimeout(() => void this.load(query), 200);
    });
    const timer = setInterval(() => void this.load(this.query()), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      clearTimeout(debounce);
    });
  }

  protected search(field: 'q' | 'name', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected toggle(which: 'connectedOnly' | 'oldOnly', event: Event): void {
    this[which].set((event.target as HTMLInputElement).checked);
    this.page.set(1);
  }

  protected setPageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(1);
  }

  protected turn(delta: number): void {
    const r = this.result();
    if (r) this.page.set(Math.min(r.pages, Math.max(1, r.page + delta)));
  }

  // Saves on blur or Enter. An empty name clears it.
  protected async rename(device: Device, event: Event): Promise<void> {
    const name = (event.target as HTMLInputElement).value.trim();
    if (name === device.name) return;
    try {
      await this.state.api.rename(device.uid, name);
      await this.load(this.query());
    } catch (err) {
      this.state.fail(err);
    }
  }

  private async load(query: DeviceQuery): Promise<void> {
    const seq = ++this.seq;
    try {
      const page = await this.state.api.devices(query);
      if (seq !== this.seq) return; // a newer query was sent after this one
      this.result.set(page);
      this.state.now.set(Date.now());
    } catch (err) {
      this.state.fail(err);
    }
  }
}
