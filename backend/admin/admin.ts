import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { AdminApi, Device, DevicePage, DeviceQuery, Stats } from './admin-api';

const REFRESH_MS = 5_000;

@Component({
  selector: 'ia-admin',
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {
  private readonly api = new AdminApi();
  private seq = 0;

  protected readonly stats = signal<Stats | null>(null);
  protected readonly result = signal<DevicePage | null>(null);
  protected readonly error = signal('');
  protected readonly now = signal(Date.now());

  protected readonly q = signal('');
  protected readonly name = signal('');
  protected readonly connectedOnly = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(25);
  protected readonly pageSizes = [10, 25, 50];

  private readonly query = computed<DeviceQuery>(() => ({
    q: this.q(),
    name: this.name(),
    connected: this.connectedOnly(),
    page: this.page(),
    pageSize: this.pageSize(),
  }));

  constructor() {
    let debounce: ReturnType<typeof setTimeout> | undefined;
    // A changed search or page reloads the table after a short pause, so typing is not a request per key.
    effect(() => {
      const query = this.query();
      clearTimeout(debounce);
      debounce = setTimeout(() => void this.loadDevices(query), 200);
    });
    void this.loadStats();
    const timer = setInterval(() => {
      void this.loadStats();
      void this.loadDevices(this.query());
    }, REFRESH_MS);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      clearTimeout(debounce);
    });
  }

  protected search(field: 'q' | 'name', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected setConnectedOnly(event: Event): void {
    this.connectedOnly.set((event.target as HTMLInputElement).checked);
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
      await this.api.rename(device.uid, name);
      await this.loadDevices(this.query());
    } catch (err) {
      this.fail(err);
    }
  }

  private async loadStats(): Promise<void> {
    try {
      this.stats.set(await this.api.stats());
      this.now.set(Date.now());
      this.error.set('');
    } catch (err) {
      this.fail(err);
    }
  }

  private async loadDevices(query: DeviceQuery): Promise<void> {
    const seq = ++this.seq;
    try {
      const page = await this.api.devices(query);
      if (seq !== this.seq) return; // a newer query was sent after this one
      this.result.set(page);
      this.now.set(Date.now());
      this.error.set('');
    } catch (err) {
      this.fail(err);
    }
  }

  private fail(err: unknown): void {
    this.error.set(err instanceof Error ? err.message : String(err));
  }

  // ── Formatting for the template ──
  protected ms(value: number | null | undefined): string {
    return value == null ? '–' : `${value} ms`;
  }

  protected ago(t: number): string {
    return t ? `${this.span((this.now() - t) / 1000)} ago` : '–';
  }

  protected span(seconds: number): string {
    const s = Math.max(0, Math.round(seconds));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
    return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
  }

  protected when(t: number): string {
    return t ? new Date(t).toLocaleString() : '';
  }
}
